import type { MotionEffectType, TransitionType } from "../types";

/**
 * Drag-and-drop contract between the assets panel (drag source) and the timeline
 * (drop target). Everything draggable onto the timeline declares one of these
 * MIME types, so the timeline can tell what was dropped without guessing.
 *
 * `dataTransfer.getData` is only readable during `drop` (not `dragover`), so the
 * *types* list — which is readable during `dragover` — is what drives the hover
 * feedback, and the payload is read on drop.
 */

export const DND_MEDIA = "application/x-autoedit-media";
export const DND_EFFECT = "application/x-autoedit-effect";
export const DND_MOTION = "application/x-autoedit-motion";
export const DND_TRANSITION = "application/x-autoedit-transition";

/** What an in-flight drag will do when released, derived from its MIME types. */
export type DragPayloadKind = "media" | "effect" | "motion" | "transition" | "files";

export function dragPayloadKind(dataTransfer: DataTransfer | null): DragPayloadKind | null {
  if (!dataTransfer) return null;
  const types = Array.from(dataTransfer.types);
  if (types.includes(DND_EFFECT)) return "effect";
  if (types.includes(DND_MOTION)) return "motion";
  if (types.includes(DND_TRANSITION)) return "transition";
  if (types.includes(DND_MEDIA)) return "media";
  if (types.includes("Files")) return "files";
  return null;
}

/** Kinds that attach to an existing clip rather than creating a new element. */
export function targetsExistingClip(kind: DragPayloadKind | null): boolean {
  return kind === "effect" || kind === "motion" || kind === "transition";
}

export function setEffectDrag(dataTransfer: DataTransfer, effectType: string): void {
  dataTransfer.setData(DND_EFFECT, effectType);
  dataTransfer.effectAllowed = "copy";
}

export function setMotionDrag(dataTransfer: DataTransfer, motion: MotionEffectType): void {
  dataTransfer.setData(DND_MOTION, motion);
  dataTransfer.effectAllowed = "copy";
}

export function setTransitionDrag(dataTransfer: DataTransfer, transition: TransitionType): void {
  dataTransfer.setData(DND_TRANSITION, transition);
  dataTransfer.effectAllowed = "copy";
}
