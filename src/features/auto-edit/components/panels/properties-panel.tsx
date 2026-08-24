import { Circle, Film, Gauge, Minus, MousePointerClick, PenLine, Scissors, Square, Trash2, Wand2 } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useI18n } from "@/shared/i18n";
import {
  addKeyframeCommand,
  addMaskCommand,
  removeEffectCommand,
  removeKeyframeCommand,
  removeMaskCommand,
  updateEffectCommand,
  updateElementParamsCommand,
  updateMaskCommand,
  updateMotionEffectCommand,
  updateRetimeCommand,
  updateTransitionCommand,
} from "../../commands";
import { hasKeyframeAt } from "../../lib/animation";
import type { ParamDefinition } from "../../lib/params";
import { getEffectDefinition } from "../../lib/effects";
import { MASK_DEFINITIONS } from "../../lib/masks";
import { MOTION_EFFECTS, motionEffectLabel } from "../../lib/motion";
import { getElement, getScene, getTrack } from "../../lib/mutate";
import { getPropertyGroups, isRetimable, isVisualElement } from "../../lib/properties";
import { formatTimecodeCompact } from "../../lib/time";
import { defaultDurationMs, TRANSITIONS } from "../../lib/transitions";
import { useEditorStore } from "../../store/editor-store";
import { useTimelineViewStore } from "../../store/timeline-view-store";
import type { EditorCommand } from "../../store/history";
import type {
  ElementRef,
  ImageElement,
  MaskType,
  MotionEffectType,
  TimelineElement,
  TransitionType,
  VideoElement,
  VisualElement,
} from "../../types";
import { ParamControl } from "./inspector/param-control";

/**
 * Right inspector — edits the first selected element: identity/speed readout,
 * effects + masks (Phase 5), and property groups with per-param keyframe toggles.
 */
export function PropertiesPanel() {
  const { t } = useI18n();
  const project = useEditorStore((s) => s.project);
  const execute = useEditorStore((s) => s.execute);
  const ref = useEditorStore((s) => s.selection.elements[0]);

  const scene = project ? getScene(project) : null;
  const element =
    project && ref ? getElement(getScene(project).tracks, ref) : null;

  // The next visual clip on the same track — a transition is only offered when
  // it exists (there must be a following clip to crossfade into).
  const nextSibling = (() => {
    if (!scene || !ref) return null;
    const track = getTrack(scene.tracks, ref.trackId);
    if (!track) return null;
    const sorted = [...track.elements].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((e) => e.id === ref.elementId);
    const next = idx >= 0 ? sorted[idx + 1] : undefined;
    return next && (next.type === "video" || next.type === "image") ? next : null;
  })();

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-border/60 px-3 text-xs font-semibold text-muted-foreground">
        {t("autoEdit.panels.properties")}
      </div>

      {!element || !ref ? (
        <EmptyState label={t("autoEdit.noSelection")} />
      ) : (
        <Inspector
          element={element}
          elementRef={ref}
          execute={execute}
          nextSibling={nextSibling}
        />
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2 px-4 text-center">
      <MousePointerClick className="size-8 text-muted-foreground/50" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * NOTE: the selected element's ref is passed as `elementRef`, never `ref` — React
 * treats `ref` as a reserved prop and strips it from a function component's props,
 * which would silently hand every section `undefined`.
 */
interface InspectorProps {
  element: TimelineElement;
  elementRef: ElementRef;
  execute: (command: EditorCommand) => void;
  nextSibling: TimelineElement | null;
}

function Inspector({ element, elementRef, execute, nextSibling }: InspectorProps) {
  const { t } = useI18n();
  const playheadMs = useTimelineViewStore((s) => s.playheadMs);
  const localTime = Math.max(0, Math.min(playheadMs - element.startTime, element.duration));

  const retimable = isRetimable(element);
  const rate =
    element.type === "video" || element.type === "audio"
      ? element.retime?.rate ?? 1
      : 1;
  const groups = getPropertyGroups(element);

  const onParam = (key: string, value: number | string | boolean) =>
    execute(updateElementParamsCommand(elementRef, { [key]: value }));

  const keyframeFor = (key: string) => {
    const active = hasKeyframeAt(element.animations, key, localTime);
    return {
      active,
      onToggle: () => {
        if (active) {
          execute(removeKeyframeCommand(elementRef, key, localTime));
          return;
        }
        const raw = element.params[key];
        const value = typeof raw === "number" ? raw : 0;
        execute(addKeyframeCommand(elementRef, key, localTime, value));
      },
    };
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Identity readout */}
      <div className="border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium text-foreground">{element.name}</div>
          <span className="shrink-0 rounded bg-sidebar-accent px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            {typeLabel(t, element.type)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-2xs text-muted-foreground">
          <span>
            {t("autoEdit.duration")} · {formatTimecodeCompact(element.duration)}
          </span>
          <span>0:00.00 – {formatTimecodeCompact(element.startTime + element.duration)}</span>
        </div>
      </div>

      {/* Speed */}
      {retimable && (
        <div className="border-b border-border/60 px-3 py-2.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-2xs font-medium text-muted-foreground">
            <Gauge className="size-3.5" />
            {t("autoEdit.speed")}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={rate}
              min={0.1}
              max={8}
              step={0.05}
              className="h-7 w-24 text-right font-mono text-xs"
              onChange={(e) => {
                const parsed = Number.parseFloat(e.target.value);
                if (Number.isFinite(parsed)) execute(updateRetimeCommand(elementRef, parsed));
              }}
            />
            <span className="text-2xs text-muted-foreground">×</span>
          </div>
        </div>
      )}

      {/* Motion effect (Ken Burns) */}
      {(element.type === "video" || element.type === "image") && (
        <MotionSection element={element} elementRef={elementRef} execute={execute} />
      )}

      {/* Effects */}
      {isVisualElement(element) && (
        <EffectsSection element={element} elementRef={elementRef} execute={execute} />
      )}

      {/* Masks */}
      {(element.type === "video" || element.type === "image") && (
        <MasksSection element={element} elementRef={elementRef} execute={execute} />
      )}

      {/* Transition (crossfade into the next clip on the same track) */}
      {(element.type === "video" || element.type === "image") && (
        <TransitionSection
          element={element}
          elementRef={elementRef}
          execute={execute}
          nextSibling={nextSibling}
        />
      )}

      {/* Property groups. Runs of number params are laid out two-up — Position,
          Scale and Rotation as five stacked rows wasted most of the panel. */}
      {groups.map((group) => (
        <div key={group.id} className="border-b border-border/60 px-3 py-2.5">
          <div className="mb-2 text-2xs font-semibold text-muted-foreground">
            {group.label}
          </div>
          <div className="space-y-2.5">
            {chunkByNumberRuns(group.params).map((run, index) =>
              run.dense ? (
                <div key={run.params[0]?.key ?? index} className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {run.params.map((param) => (
                    <ParamControl
                      key={param.key}
                      param={param}
                      value={element.params[param.key]}
                      onChange={onParam}
                      keyframe={keyframeFor(param.key)}
                      dense
                    />
                  ))}
                </div>
              ) : (
                <div key={run.params[0]?.key ?? index} className="space-y-2.5">
                  {run.params.map((param) => (
                    <ParamControl
                      key={param.key}
                      param={param}
                      value={element.params[param.key]}
                      onChange={onParam}
                    />
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MotionSection({
  element,
  elementRef,
  execute,
}: {
  element: VideoElement | ImageElement;
  elementRef: ElementRef;
  execute: (command: EditorCommand) => void;
}) {
  const { t } = useI18n();
  const current: MotionEffectType = element.motionEffect ?? "none";
  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
        <Film className="size-3.5" />
        {t("autoEdit.motion")}
      </div>
      <Select
        value={current}
        onValueChange={(v) => execute(updateMotionEffectCommand(elementRef, v as MotionEffectType))}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOTION_EFFECTS.map((m) => (
            <SelectItem key={m.type} value={m.type}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Named, removable row so an applied motion reads the same as an effect —
          the panel used to show only the dropdown, which made a clip with motion
          look like it had nothing applied. */}
      {current !== "none" && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border/60 px-2 py-1.5">
          <span className="truncate text-xs font-medium text-foreground">
            {motionEffectLabel(current)}
          </span>
          <button
            type="button"
            aria-label={t("autoEdit.delete")}
            onClick={() => execute(updateMotionEffectCommand(elementRef, "none"))}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function EffectsSection({
  element,
  elementRef,
  execute,
}: {
  element: VisualElement;
  elementRef: ElementRef;
  execute: (command: EditorCommand) => void;
}) {
  const { t } = useI18n();
  const effects = element.effects ?? [];
  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      {/* No "add" button here: effects come from the library panel, either dropped
          on a clip or dropped on empty timeline space to become a layer. */}
          <div className="mb-2 text-2xs font-semibold text-muted-foreground">
        {t("autoEdit.effects")}
      </div>

      {effects.length === 0 ? (
        <p className="text-2xs text-muted-foreground">{t("autoEdit.effects.empty")}</p>
      ) : (
        effects.map((effect) => {
          const def = getEffectDefinition(effect.type);
          return (
            <div key={effect.id} className="mb-2 rounded-lg border border-border/60 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {def?.name ?? effect.type}
                </span>
                <button
                  type="button"
                  onClick={() => execute(removeEffectCommand(elementRef, effect.id))}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {(def?.params ?? []).map((p) => (
                <ParamControl
                  key={p.key}
                  param={p}
                  value={effect.params[p.key]}
                  onChange={(key, value) =>
                    execute(updateEffectCommand(elementRef, effect.id, { params: { [key]: value } }))
                  }
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

function MasksSection({
  element,
  elementRef,
  execute,
}: {
  element: VisualElement;
  elementRef: ElementRef;
  execute: (command: EditorCommand) => void;
}) {
  const { t } = useI18n();
  const masks = element.type === "video" || element.type === "image" ? element.masks ?? [] : [];
  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-semibold text-muted-foreground">
          {t("autoEdit.masks")}
        </span>
        <div className="flex gap-1">
          {MASK_DEFINITIONS.map((m) => (
            <button
              key={m.type}
              type="button"
              title={m.name}
              onClick={() => execute(addMaskCommand(elementRef, m.type))}
              className="flex size-6 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <MaskIcon type={m.type} />
            </button>
          ))}
        </div>
      </div>

      {masks.map((mask) => (
        <div key={mask.id} className="mb-2 rounded-lg border border-border/60 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium capitalize text-foreground">
              {maskName(mask.type)}
            </span>
            <button
              type="button"
              onClick={() => execute(removeMaskCommand(elementRef, mask.id))}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">{t("autoEdit.masks.feather")}</Label>
            <Input
              type="number"
              value={mask.params.feather}
              min={0}
              max={1000}
              step={1}
              className="h-7 w-20 text-right font-mono text-xs"
              onChange={(e) => {
                const v = Number.parseFloat(e.target.value);
                if (Number.isFinite(v)) {
                  execute(updateMaskCommand(elementRef, mask.id, { feather: v }));
                }
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">{t("autoEdit.masks.inverted")}</Label>
            <Switch
              checked={mask.params.inverted}
              onCheckedChange={(v) =>
                execute(updateMaskCommand(elementRef, mask.id, { inverted: v }))
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransitionSection({
  element,
  elementRef,
  execute,
  nextSibling,
}: {
  element: VideoElement | ImageElement;
  elementRef: ElementRef;
  execute: (command: EditorCommand) => void;
  nextSibling: TimelineElement | null;
}) {
  const { t } = useI18n();
  const current = element.transitionToNext;
  const currentType: TransitionType = current?.type ?? "none";
  // A crossfade needs a clip to fade into; without one the picker is shown
  // disabled (with the reason) rather than hidden, so the feature is discoverable.
  const disabled = nextSibling == null;
  const maxMs = Math.max(0, Math.min(element.duration, nextSibling?.duration ?? element.duration));

  const onType = (type: TransitionType) => {
    if (type === "none") {
      execute(updateTransitionCommand(elementRef, null));
      return;
    }
    execute(
      updateTransitionCommand(elementRef, {
        type,
        durationMs: Math.max(0, Math.min(current?.durationMs ?? defaultDurationMs(type), maxMs)),
      }),
    );
  };

  const onDuration = (ms: number) => {
    if (!Number.isFinite(ms)) return;
    execute(
      updateTransitionCommand(elementRef, {
        type: currentType === "none" ? "fade" : currentType,
        durationMs: Math.max(0, Math.min(ms, maxMs)),
      }),
    );
  };

  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
        <Wand2 className="size-3.5" />
        {t("autoEdit.transition")}
      </div>
      <div className="space-y-2">
        <Select
          value={currentType}
          disabled={disabled}
          onValueChange={(v) => onType(v as TransitionType)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRANSITIONS.map((tr) => (
              <SelectItem key={tr.type} value={tr.type}>
                {tr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {disabled && (
          <p className="text-2xs text-muted-foreground">
            {t("autoEdit.transition.needsNext")}
          </p>
        )}

        {!disabled && currentType !== "none" && (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              {t("autoEdit.transition.duration")}
            </Label>
            <Input
              type="number"
              value={current?.durationMs ?? defaultDurationMs(currentType)}
              min={0}
              max={maxMs}
              step={50}
              className="h-7 w-20 text-right font-mono text-xs"
              onChange={(e) => onDuration(Number.parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Split a group's params into alternating runs: consecutive number params (which
 * pack into a two-column grid) and everything else (full-width rows). Only runs of
 * two or more are worth densifying — a lone number reads better full width.
 */
function chunkByNumberRuns(
  params: ParamDefinition[],
): Array<{ dense: boolean; params: ParamDefinition[] }> {
  const runs: Array<{ dense: boolean; params: ParamDefinition[] }> = [];
  for (const param of params) {
    const dense = param.type === "number";
    const last = runs[runs.length - 1];
    if (last && last.dense === dense) last.params.push(param);
    else runs.push({ dense, params: [param] });
  }
  return runs.map((run) =>
    run.dense && run.params.length < 2 ? { dense: false, params: run.params } : run,
  );
}

function typeLabel(t: (key: string) => string, type: TimelineElement["type"]): string {
  switch (type) {
    case "video":
      return t("autoEdit.track.video");
    case "audio":
      return t("autoEdit.track.audio");
    case "text":
      return t("autoEdit.track.text");
    case "effect":
      return t("autoEdit.track.effect");
    case "image":
      return t("autoEdit.element.image");
  }
}

function maskName(type: MaskType): string {
  switch (type) {
    case "rectangle":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "cinematic-bars":
      return "Cinematic Bars";
    case "split":
      return "Split";
    case "freeform":
      return "Freeform";
  }
}

function MaskIcon({ type }: { type: MaskType }) {
  if (type === "ellipse") return <Circle className="size-3" />;
  if (type === "cinematic-bars") return <Minus className="size-3" />;
  if (type === "split") return <Scissors className="size-3" />;
  if (type === "freeform") return <PenLine className="size-3" />;
  return <Square className="size-3" />;
}
