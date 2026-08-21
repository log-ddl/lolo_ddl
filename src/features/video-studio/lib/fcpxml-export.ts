/**
 * Build a Final Cut Pro XML (FCPXML v1.9) timeline from AutoPilot shot clips + narration.
 *
 * This describes a timeline that references the individual shot clips (and the
 * narration audio) at their timeline positions — it is NOT a rendered video. Open the
 * resulting .fcpxml in DaVinci Resolve (or Final Cut) to edit/color/render the clips
 * with full control. Because it references the separate clips, it must be exported
 * from the shot media, never from a flattened/merged MP4.
 *
 * Gap handling: AI videos have fixed lengths (4/6/8s) but each shot's narration slot is
 * arbitrary, so a clip is often shorter than its slot. ffmpeg holds/pads to fill; DaVinci
 * instead clamps a clip to its real media length, leaving a gap. To match, each clip that
 * is shorter than its slot is retimed (slowed) to fill it exactly — no gaps, audio stays
 * in sync. The narration is the primary track; video clips are connected above it.
 */

export interface FcpxmlClip {
  /** Absolute filesystem path to the clip (video or still image). */
  src: string;
  startMs: number;
  endMs: number;
  name: string;
  /** Still image (Ken Burns) rather than a video file. Images stretch freely (no gap). */
  isImage: boolean;
  /** Real media duration in seconds (probed). Used to retime short videos to fill the slot. */
  mediaDurationSec?: number;
}

export interface FcpxmlOptions {
  title: string;
  width: number;
  height: number;
  fps: number;
  clips: FcpxmlClip[];
  /** Absolute path to the narration audio (becomes the primary track). */
  audioSrc?: string;
  audioDurationMs?: number;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert an absolute path to a file:// URL (handles Windows drive letters). */
function toFileUrl(absolutePath: string): string {
  let normalized = absolutePath.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) normalized = `/${normalized}`; // C:/... -> /C:/...
  return `file://${encodeURI(normalized)}`;
}

export function buildFcpxml(options: FcpxmlOptions): string {
  const fps = Math.max(1, Math.round(options.fps || 30));
  const toFrames = (ms: number) => Math.max(0, Math.round((ms / 1000) * fps));
  const ftime = (frames: number) => `${frames}/${fps}s`;

  const totalFrames = options.clips.length > 0
    ? toFrames(Math.max(...options.clips.map((clip) => clip.endMs)))
    : 0;
  const audioFrames = options.audioDurationMs ? toFrames(options.audioDurationMs) : totalFrames;
  const seqFrames = Math.max(totalFrames, audioFrames, 1);

  // Flow layout: every clip runs from its own start to the NEXT clip's start (the last
  // to the end of the sequence). This leaves no gaps even when the narration has pauses
  // between shots — the clip simply covers the pause until the next shot begins.
  const offsets = options.clips.map((clip) => toFrames(clip.startMs));
  const slots = offsets.map((offset, index) =>
    Math.max(1, (index < offsets.length - 1 ? offsets[index + 1] : seqFrames) - offset),
  );

  const resources: string[] = [
    `    <format id="r1" name="FFVideoFormat${options.height}p${fps}" frameDuration="1/${fps}s" width="${options.width}" height="${options.height}" colorSpace="1-1-1 (Rec. 709)"/>`,
  ];

  /** Emit one video/image clip element, retiming short videos to fill their slot. */
  const clipElement = (clip: FcpxmlClip, index: number, indent: string, lane?: number): string => {
    const assetId = `a${index + 1}`;
    const offsetFrames = offsets[index];
    const slotFrames = slots[index];
    const mediaFrames = clip.mediaDurationSec ? toFrames(clip.mediaDurationSec * 1000) : 0;

    // Declare the asset. Images are given the slot length; videos their real length.
    // Videos keep their own audio track so DaVinci imports the original clip sound.
    const audioAttr = clip.isImage ? '' : ' hasAudio="1" audioSources="1"';
    resources.push(
      `    <asset id="${assetId}" name="${xmlEscape(clip.name)}" uid="${assetId}" start="0s" hasVideo="1" videoSources="1"${audioAttr} format="r1" duration="${ftime(clip.isImage ? slotFrames : Math.max(1, mediaFrames || slotFrames))}">\n` +
      `      <media-rep kind="original-media" src="${xmlEscape(toFileUrl(clip.src))}"/>\n` +
      `    </asset>`,
    );

    // A real video shorter than its slot must be slowed to fill it (no gap). Images and
    // videos that already cover the slot need no retime (DaVinci trims longer clips).
    const needsRetime = !clip.isImage && mediaFrames > 0 && mediaFrames < slotFrames - 1;
    const timeMap = needsRetime
      ? `\n${indent}  <timeMap>\n${indent}    <timept time="0s" value="0s" interp="linear"/>\n${indent}    <timept time="${ftime(slotFrames)}" value="${ftime(mediaFrames)}" interp="linear"/>\n${indent}  </timeMap>`
      : '';
    const laneAttr = lane != null ? ` lane="${lane}"` : '';
    return `${indent}<asset-clip ref="${assetId}"${laneAttr} offset="${ftime(offsetFrames)}" name="${xmlEscape(clip.name)}" duration="${ftime(slotFrames)}" start="0s" format="r1">${timeMap}\n${indent}</asset-clip>`;
  };

  let spineBody: string;
  if (options.audioSrc) {
    // Narration is the primary storyline; video clips are connected above it (lane 1).
    resources.push(
      `    <asset id="aud" name="Narration" uid="aud" start="0s" hasAudio="1" audioSources="1" duration="${ftime(audioFrames)}">\n` +
      `      <media-rep kind="original-media" src="${xmlEscape(toFileUrl(options.audioSrc))}"/>\n` +
      `    </asset>`,
    );
    const connected = options.clips.map((clip, index) => clipElement(clip, index, '            ', 1)).join('\n');
    spineBody =
      `        <asset-clip ref="aud" offset="0s" name="Narration" duration="${ftime(seqFrames)}" start="0s">\n` +
      `${connected}\n` +
      `        </asset-clip>`;
  } else {
    spineBody = options.clips.map((clip, index) => clipElement(clip, index, '        ')).join('\n');
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
${resources.join('\n')}
  </resources>
  <library>
    <event name="AutoPilot">
      <project name="${xmlEscape(options.title)}">
        <sequence format="r1" duration="${ftime(seqFrames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
          <spine>
${spineBody}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
