import { createTextElement, createTextTrack } from "../defaults";
import { appendTrack, insertElement, updateTracks } from "./mutate";
import { newId } from "./id";
import type { EditorCommand } from "../store/history";
import type { TCanvasSize, TextElement } from "../types";
import type { SubtitleCue } from "./srt";

export type { SubtitleCue } from "./srt";

/**
 * Caption → TextElement conversion, ported from opencut
 * `subtitles/build-subtitle-text-element.ts` and simplified (no canvas
 * measurement; wrapping is estimated by character width). Captions land on a
 * dedicated text track, bottom-aligned and centered — the standard subtitle style.
 */

const FONT_SIZE_SCALE_REFERENCE = 90;
const SUBTITLE_FONT_SIZE = 5;
const SUBTITLE_MAX_WIDTH_RATIO = 0.8;
const SUBTITLE_BOTTOM_MARGIN_RATIO = 0.05;
/** Rough glyph aspect ratio used to estimate line capacity from font size. */
const GLYPH_ASPECT_RATIO = 0.55;

export function buildSubtitleTextElement({
  index,
  caption,
  canvasSize,
}: {
  index: number;
  caption: SubtitleCue;
  canvasSize: TCanvasSize;
}): TextElement {
  const fontSize = Math.round(
    canvasSize.height * (SUBTITLE_FONT_SIZE / FONT_SIZE_SCALE_REFERENCE),
  );
  const maxCharsPerLine = Math.max(
    8,
    Math.floor((canvasSize.width * SUBTITLE_MAX_WIDTH_RATIO) / (fontSize * GLYPH_ASPECT_RATIO)),
  );
  const positionY = Math.round(
    canvasSize.height / 2 -
      canvasSize.height * SUBTITLE_BOTTOM_MARGIN_RATIO -
      (fontSize * 1.2) / 2,
  );

  return createTextElement({
    name: `Caption ${index + 1}`,
    startTime: caption.startTime,
    duration: caption.duration,
    params: {
      content: wrapSubtitleText(caption.text, maxCharsPerLine),
      fontSize,
      fontFamily: "Arial",
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "bold",
      fontStyle: "normal",
      "transform.positionX": 0,
      "transform.positionY": positionY,
    },
  });
}

function wrapSubtitleText(text: string, maxCharsPerLine: number): string {
  const paragraphs = text.trim().replace(/\r\n/g, "\n").split("\n");
  const wrapped: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    if (!words[0]) {
      wrapped.push("");
      continue;
    }

    let line = words[0];
    const lines: string[] = [];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${line} ${words[i]}`;
      if (next.length <= maxCharsPerLine) {
        line = next;
        continue;
      }
      lines.push(line);
      line = words[i];
    }
    lines.push(line);
    wrapped.push(lines.join("\n"));
  }

  return wrapped.join("\n");
}

/**
 * Build a single undoable command that adds a "Captions" text track and drops
 * every caption cue onto it as a TextElement.
 */
export function buildCaptionsCommand(
  captions: SubtitleCue[],
  canvasSize: TCanvasSize,
  label = "Add captions",
): EditorCommand {
  const track = createTextTrack({ name: "Captions" });
  const elements = captions.map((caption, index) =>
    buildSubtitleTextElement({ index, caption, canvasSize }),
  );

  return {
    id: newId("cmd"),
    label: captions.length > 1 ? `${label} (${captions.length})` : label,
    apply: (project) => {
      let next = updateTracks(project, project.currentSceneId, (tracks) =>
        appendTrack(tracks, track),
      );
      for (const element of elements) {
        next = updateTracks(next, next.currentSceneId, (tracks) =>
          insertElement(tracks, track.id, element),
        );
      }
      return next;
    },
  };
}
