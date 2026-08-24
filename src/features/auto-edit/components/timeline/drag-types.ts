/**
 * Timeline drag vocabulary: the in-flight drag state machine plus the pixel
 * thresholds that control snapping and edge auto-scroll.
 */

import type { ElementRef } from "../../types";

export const TOOLBAR_BTN =
  "flex h-7 items-center justify-center rounded-lg px-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground";

/** Pixel distance within which the dragged edge snaps to a clip edge / playhead. */
export const SNAP_THRESHOLD_PX = 12;
/** How near a cut a transition must be dropped to land on it. */
export const CUT_SNAP_PX = 70;
/** Distance from the viewport edge at which a drag starts auto-scrolling. */
export const EDGE_SCROLL_PX = 48;
/** Auto-scroll speed, pixels per animation frame. */
export const EDGE_SCROLL_SPEED_PX = 14;

export interface MoveMember {
  ref: ElementRef;
  startTime: number;
}

export type DragState =
  | { mode: "seek"; startClientX: number; baseMs: number }
  | {
      mode: "marquee";
      startClientX: number;
      startClientY: number;
      currentClientX: number;
      currentClientY: number;
    }
  | {
      mode: "move";
      ref: ElementRef;
      startClientX: number;
      startTime: number;
      duration: number;
      newStart: number;
      newDuration: number;
      /** Track the pointer currently hovers (drop target), defaulting to the source track. */
      targetTrackId: string;
      /** All elements moved together (multi-select), each with its original start time. */
      group: MoveMember[];
    }
  | {
      mode: "trim-left";
      ref: ElementRef;
      startClientX: number;
      startTime: number;
      duration: number;
      trimStart: number;
      newStart: number;
      newDuration: number;
      newTrimStart: number;
    }
  | {
      mode: "trim-right";
      ref: ElementRef;
      startClientX: number;
      duration: number;
      trimEnd: number;
      newDuration: number;
      newTrimEnd: number;
    };

export function computeDrag(d: DragState, deltaMs: number, frameDur: number): DragState {
  if (d.mode === "seek" || d.mode === "marquee") return d;
  if (d.mode === "move") {
    return { ...d, newStart: Math.max(0, d.startTime + deltaMs) };
  }
  if (d.mode === "trim-left") {
    let newStart = d.startTime + deltaMs;
    let newDuration = d.duration - deltaMs;
    if (newDuration < frameDur) {
      newDuration = frameDur;
      newStart = d.startTime + d.duration - frameDur;
    }
    if (newStart < 0) {
      newStart = 0;
      newDuration = d.duration + d.startTime;
    }
    const newTrimStart = Math.max(0, d.trimStart + (newStart - d.startTime));
    return { ...d, newStart, newDuration, newTrimStart };
  }
  const newDuration = Math.max(frameDur, d.duration + deltaMs);
  const newTrimEnd = Math.max(0, d.trimEnd - deltaMs);
  return { ...d, newDuration, newTrimEnd };
}
