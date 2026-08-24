import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Blend,
  Check,
  Film,
  GripVertical,
  ImageIcon,
  Loader2,
  Move,
  Music,
  Sparkles,
  Subtitles,
  Wand2,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { useAutoVideoStore } from "@/features/video-studio/stores/auto-video-store";
import {
  addEffectCommand,
  addElementToTrackOfTypeCommand,
  updateMotionEffectCommand,
  updateTransitionCommand,
} from "../../commands";
import { createTextElement } from "../../defaults";
import { DND_MEDIA, setEffectDrag, setMotionDrag, setTransitionDrag } from "../../lib/dnd";
import { EFFECT_DEFINITIONS } from "../../lib/effects";
import { MOTION_EFFECTS } from "../../lib/motion";
import { TRANSITIONS } from "../../lib/transitions";
import { getElement, getScene, getTrack, nextVisualSibling } from "../../lib/mutate";
import { isVisualElement } from "../../lib/properties";
import { formatTimecodeCompact } from "../../lib/time";
import { buildTimelineFromRows } from "../../lib/auto-build";
import { parseAutoRows } from "../../lib/auto-import";
import { importMediaFiles } from "../../lib/import-media";
import { parseSrt } from "../../lib/srt";
import { buildCaptionsCommand } from "../../lib/subtitles";
import { useEditorStore } from "../../store/editor-store";
import { usePanelStore, type AssetsTab } from "../../store/panel-store";
import { useTimelineViewStore } from "../../store/timeline-view-store";
import {
  allTracks,
  type ElementRef,
  type ImageElement,
  type MediaAsset,
  type MotionEffectType,
  type VideoElement,
} from "../../types";

/** Left asset browser — tabbed (media/audio/text/effects/captions). */
export function AssetsPanel() {
  const { t } = useI18n();
  const assetsTab = usePanelStore((s) => s.assetsTab);
  const setAssetsTab = usePanelStore((s) => s.setAssetsTab);

  const tabs: { key: AssetsTab; label: string; icon: typeof Film }[] = [
    { key: "media", label: t("autoEdit.assetsTab.media"), icon: Film },
    { key: "text", label: t("autoEdit.assetsTab.text"), icon: Type },
    { key: "effects", label: t("autoEdit.assetsTab.effects"), icon: Sparkles },
    { key: "transitions", label: t("autoEdit.assetsTab.transitions"), icon: Blend },
    { key: "captions", label: t("autoEdit.assetsTab.captions"), icon: Subtitles },
    { key: "auto", label: t("autoEdit.assetsTab.auto"), icon: Wand2 },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-border/60 px-3 text-xs font-semibold text-muted-foreground">
        {t("autoEdit.panels.assets")}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 border-b border-border/60 px-1.5 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = assetsTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAssetsTab(tab.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
                active && "bg-sidebar-accent text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0">
        {assetsTab === "media" && <MediaTab />}
        {assetsTab === "text" && <TextTab />}
        {assetsTab === "effects" && <EffectsTab />}
        {assetsTab === "transitions" && <TransitionsTab />}
        {assetsTab === "captions" && <CaptionsTab />}
        {assetsTab === "auto" && <AutoTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media / audio                                                      */
/* ------------------------------------------------------------------ */

/** Imports and lists every media kind — video, image and audio all land here. */
function MediaTab() {
  const { t } = useI18n();
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const [importing, setImporting] = useState(false);
  const assets = Object.values(mediaAssets);

  const onImport = async () => {
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    setImporting(true);
    try {
      const result = await runtime.pickMedia();
      if (!result.canceled && result.files.length > 0) {
        await importMediaFiles(result.files);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="p-2">
        <Button variant="outline"
          type="button"
          onClick={onImport}
          disabled={importing}
          className="w-full border-dashed py-2.5 text-muted-foreground"
        >
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {importing ? "…" : t("autoEdit.importMedia")}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2">
        {assets.length === 0 ? null : (
          <ul className="space-y-1">
            {assets.map((asset) => (
              <AssetRow key={asset.path} asset={asset} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AssetRow({ asset }: { asset: MediaAsset }) {
  const Icon = asset.kind === "video" ? Film : asset.kind === "audio" ? Music : ImageIcon;
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_MEDIA, asset.path);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="flex cursor-grab items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-1.5 active:cursor-grabbing"
    >
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded bg-panel">
        {asset.kind === "image" ? (
          <img src={asset.previewUrl} alt={asset.name} className="size-full object-cover" />
        ) : (
          <Icon className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{asset.name}</div>
        <div className="text-2xs text-muted-foreground">
          {asset.kind} · {formatTimecodeCompact(asset.durationMs)}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Text                                                               */
/* ------------------------------------------------------------------ */

function TextTab() {
  const { t } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);

  const addText = () => {
    execute(
      addElementToTrackOfTypeCommand(
        createTextElement({ startTime: playheadMs }),
        "text",
        t("autoEdit.addText"),
      ),
    );
  };

  return (
    <div className="p-2">
      <Button variant="outline"
        type="button"
        onClick={addText}
        className="w-full border-dashed py-2.5 text-muted-foreground"
      >
        <Type className="size-4" />
        {t("autoEdit.addText")}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Effects                                                            */
/* ------------------------------------------------------------------ */

/**
 * A draggable library row. Dragging it onto a timeline clip applies it there;
 * clicking applies it to the current selection. Both paths exist because dragging
 * is the discoverable gesture but clicking is faster once a clip is selected.
 */
function LibraryRow({
  label,
  hint,
  icon: Icon,
  active,
  disabled,
  onDragStart,
  onClick,
}: {
  label: string;
  hint: string;
  icon: typeof Sparkles;
  active?: boolean;
  disabled?: boolean;
  onDragStart: (dataTransfer: DataTransfer) => void;
  onClick: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e.dataTransfer)}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-lg border p-2 transition-colors active:cursor-grabbing",
        active
          ? "border-primary/60 bg-primary/10"
          : "border-border/60 bg-background/40 hover:border-primary/50 hover:bg-primary/5",
      )}
      onClick={() => {
        if (!disabled) onClick();
      }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded bg-panel">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">{label}</div>
        <div className="truncate text-2xs text-muted-foreground">{hint}</div>
      </div>
      {active ? (
        <Check className="size-3.5 shrink-0 text-primary" />
      ) : (
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" />
      )}
    </li>
  );
}

/**
 * Two families live here: filter effects (stacked on an element, e.g. blur) and
 * Ken Burns motion (a single per-clip choice). Both are always listed — drag one
 * onto any clip, or select a clip first and click.
 */
function EffectsTab() {
  const { t } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);
  const project = useEditorStore((s) => s.project);

  const element = project && ref ? getElement(getScene(project).tracks, ref) : null;
  const canApply = !!element && isVisualElement(element);
  const canAnimate = !!element && (element.type === "video" || element.type === "image");
  const currentMotion: MotionEffectType = canAnimate
    ? (element as VideoElement | ImageElement).motionEffect ?? "none"
    : "none";
  const hint = canApply ? t("autoEdit.library.clickOrDrag") : t("autoEdit.library.dragToClip");

  return (
    <div className="flex-1 min-h-0 overflow-auto p-2">
      <div className="px-1 pb-1.5 text-2xs font-semibold text-muted-foreground">
        {t("autoEdit.motion")}
      </div>
      <ul className="mb-3 space-y-1">
        {MOTION_EFFECTS.filter((m) => m.type !== "none").map((m) => (
          <LibraryRow
            key={m.type}
            label={m.label}
            hint={hint}
            icon={Move}
            active={currentMotion === m.type}
            disabled={!canAnimate}
            onDragStart={(dt) => setMotionDrag(dt, m.type)}
            onClick={() => {
              if (!canAnimate || !ref) return;
              execute(
                updateMotionEffectCommand(ref, currentMotion === m.type ? "none" : m.type),
              );
            }}
          />
        ))}
      </ul>

      <div className="px-1 pb-1.5 text-2xs font-semibold text-muted-foreground">
        {t("autoEdit.effects")}
      </div>
      <ul className="space-y-1">
        {EFFECT_DEFINITIONS.map((def) => (
          <LibraryRow
            key={def.type}
            label={def.name}
            hint={hint}
            icon={Sparkles}
            disabled={!canApply}
            onDragStart={(dt) => setEffectDrag(dt, def.type)}
            onClick={() => {
              if (!canApply || !ref) return;
              execute(addEffectCommand(ref, def.type));
            }}
          />
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transitions                                                        */
/* ------------------------------------------------------------------ */

/**
 * Transition library. A transition is a property of the *outgoing* clip, so
 * dropping one on a clip sets its crossfade into whatever follows it on the
 * same track.
 */
function TransitionsTab() {
  const { t } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);
  const project = useEditorStore((s) => s.project);

  const scene = project ? getScene(project) : null;
  const element = scene && ref ? getElement(scene.tracks, ref) : null;
  const track = scene && ref ? getTrack(scene.tracks, ref.trackId) : null;
  // Only offer to apply when the selected clip actually has a clip after it —
  // otherwise the crossfade has nothing to fade into and would never render.
  const next = track && ref ? nextVisualSibling(track, ref.elementId) : null;
  const canApply =
    !!element && (element.type === "video" || element.type === "image") && next != null;
  const current =
    element && (element.type === "video" || element.type === "image")
      ? element.transitionToNext?.type ?? "none"
      : "none";
  const maxMs = element && next ? Math.min(element.duration, next.duration) : 0;

  return (
    <div className="flex-1 min-h-0 overflow-auto p-2">
      <p className="px-1 pb-2 text-2xs leading-relaxed text-muted-foreground">
        {t("autoEdit.transitions.hint")}
      </p>
      <ul className="space-y-1">
        {TRANSITIONS.filter((tr) => tr.type !== "none").map((tr) => (
          <LibraryRow
            key={tr.type}
            label={tr.label}
            hint={`${tr.durationMs} ms`}
            icon={Blend}
            active={current === tr.type}
            disabled={!canApply}
            onDragStart={(dt) => setTransitionDrag(dt, tr.type)}
            onClick={() => {
              if (!ref) return;
              if (!canApply) {
                toast.error(t("autoEdit.transition.needsNext"));
                return;
              }
              execute(
                updateTransitionCommand(
                  ref,
                  current === tr.type
                    ? null
                    : { type: tr.type, durationMs: Math.min(tr.durationMs, maxMs) },
                ),
              );
            }}
          />
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Auto import                                                        */
/* ------------------------------------------------------------------ */

/**
 * Builds a whole timeline from a JSON/CSV shot list. Only four fields are read —
 * visual, voice, effect, transition — and everything lands as ordinary clips the
 * user can then trim, replace or delete.
 */
function AutoTab() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{ shots: number; skipped: number; missing: string[] } | null>(
    null,
  );

  const onImport = async () => {
    const runtime = window.autoEditRuntime;
    if (!runtime) return;
    setBusy(true);
    setSummary(null);
    try {
      const picked = await runtime.pickJson();
      if (picked.canceled || !picked.content) return;

      const parsed = parseAutoRows(picked.content, picked.filePath ?? "");
      if (parsed.rows.length === 0) {
        toast.error(t("autoEdit.auto.noRows"));
        setSummary({ shots: 0, skipped: parsed.skipped, missing: [] });
        return;
      }

      const built = await buildTimelineFromRows(parsed.rows);
      setSummary({ shots: built.shots, skipped: parsed.skipped, missing: built.missing });
      if (built.shots === 0) toast.error(t("autoEdit.auto.noMedia"));
      else toast.success(`${t("autoEdit.auto.done")} (${built.shots})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="p-2">
        <Button variant="outline"
          type="button"
          onClick={onImport}
          disabled={busy}
          className="w-full border-dashed py-2.5 text-muted-foreground"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {busy ? "…" : t("autoEdit.auto.import")}
        </Button>
        <p className="mt-2 px-1 text-2xs leading-relaxed text-muted-foreground">
          {t("autoEdit.auto.hint")}
        </p>
      </div>

      {summary && (
        <div className="min-h-0 flex-1 overflow-auto border-t border-border/60 px-3 py-2">
          <p className="text-2xs text-foreground">
            {t("autoEdit.auto.shots")}: <span className="font-medium">{summary.shots}</span>
          </p>
          {summary.skipped > 0 && (
            <p className="mt-1 text-2xs text-muted-foreground">
              {t("autoEdit.auto.skipped")}: {summary.skipped}
            </p>
          )}
          {summary.missing.length > 0 && (
            <div className="mt-2">
              <p className="text-2xs font-medium text-destructive">
                {t("autoEdit.auto.missing")} ({summary.missing.length})
              </p>
              <ul className="mt-1 space-y-0.5">
                {summary.missing.slice(0, 20).map((name) => (
                  <li key={name} className="truncate text-2xs text-muted-foreground" title={name}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Captions / transcription                                           */
/* ------------------------------------------------------------------ */

interface TranscribableClip {
  ref: ElementRef;
  name: string;
  kind: "video" | "audio";
  mediaPath: string;
}

function CaptionsTab() {
  const { t } = useI18n();
  const project = useEditorStore((s) => s.project);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clips: TranscribableClip[] = [];
  if (project) {
    const scene = getScene(project);
    for (const track of allTracks(scene.tracks)) {
      for (const el of track.elements) {
        if (el.type === "video" && el.mediaPath) {
          clips.push({
            ref: { trackId: track.id, elementId: el.id },
            name: el.name,
            kind: "video",
            mediaPath: el.mediaPath,
          });
        } else if (el.type === "audio" && "mediaPath" in el && el.mediaPath) {
          clips.push({
            ref: { trackId: track.id, elementId: el.id },
            name: el.name,
            kind: "audio",
            mediaPath: el.mediaPath,
          });
        }
      }
    }
  }

  const transcribe = async (clip: TranscribableClip) => {
    setError(null);
    const runtime = window.whisperRuntime;
    if (!runtime) {
      setError(t("autoEdit.captions.unavailable"));
      return;
    }
    const { whisperProvider, whisperApiKeys, whisperLanguage } = useAutoVideoStore.getState();
    const apiKey = whisperApiKeys[whisperProvider];
    if (!apiKey) {
      setError(t("autoEdit.captions.noApiKey"));
      return;
    }

    const key = `${clip.ref.trackId}:${clip.ref.elementId}`;
    const jobId = `autoedit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBusyKey(key);
    setProgress({ percent: 0, message: t("autoEdit.captions.transcribing") });

    const unsub = runtime.onProgress((event) => {
      if (event.jobId !== jobId) return;
      setProgress({ percent: event.percent ?? 0, message: event.message ?? "" });
    });

    try {
      const result = await runtime.transcribe({
        jobId,
        audioPath: clip.mediaPath,
        provider: whisperProvider,
        apiKey,
        language: whisperLanguage || undefined,
      });
      if (!result.success) {
        setError(result.error ?? t("autoEdit.captions.failed"));
        return;
      }
      const captions = parseSrt(result.srt ?? "");
      if (captions.length === 0) {
        setError(t("autoEdit.captions.noCaptions"));
        return;
      }
      const state = useEditorStore.getState();
      if (!state.project) return;
      state.execute(buildCaptionsCommand(captions, state.project.settings.canvasSize));
      setProgress({ percent: 100, message: `${t("autoEdit.captions.done")} (${captions.length})` });
    } finally {
      unsub();
      setBusyKey(null);
    }
  };

  if (clips.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
        {t("autoEdit.captions.empty")}
      </p>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex-1 min-h-0 overflow-auto px-2 py-2">
        <ul className="space-y-1">
          {clips.map((clip) => {
            const key = `${clip.ref.trackId}:${clip.ref.elementId}`;
            const busy = busyKey === key;
            return (
              <li
                key={key}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-1.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">{clip.name}</div>
                  <div className="text-2xs text-muted-foreground">{clip.kind}</div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => transcribe(clip)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-2xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Subtitles className="size-3.5" />
                  )}
                  {t("autoEdit.captions.transcribe")}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {(progress || error) && (
        <div className="shrink-0 border-t border-border/60 px-3 py-2">
          {progress && (
            <div className="mb-1 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
              <span className="truncate">{progress.message}</span>
              <span className="font-mono tabular-nums">{progress.percent}%</span>
            </div>
          )}
          {error && <p className="text-2xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
