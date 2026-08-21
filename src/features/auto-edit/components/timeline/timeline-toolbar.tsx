"use client";

/**
 * Timeline toolbar: zoom, the clip actions that apply to the current selection,
 * and the ripple-edit toggle.
 */

import { Copy, Scissors, Trash2, Type, Waves, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import { TOOLBAR_BTN } from "./drag-types";

export interface TimelineToolbarProps {
  selectionEmpty: boolean;
  rippleEnabled: boolean;
  setRippleEnabled: (value: boolean) => void;
  zoomBy: (factor: number) => void;
  addText: () => void;
  splitSelected: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  t: Translate;
}

export function TimelineToolbar({
  selectionEmpty,
  rippleEnabled,
  setRippleEnabled,
  zoomBy,
  addText,
  splitSelected,
  duplicateSelected,
  deleteSelected,
  t,
}: TimelineToolbarProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border/60 px-2">
      <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label={t("autoEdit.zoomOut")} className={TOOLBAR_BTN}>
        <ZoomOut className="size-4" />
      </button>
      <button type="button" onClick={() => zoomBy(1.25)} aria-label={t("autoEdit.zoomIn")} className={TOOLBAR_BTN}>
        <ZoomIn className="size-4" />
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button type="button" onClick={addText} className={cn(TOOLBAR_BTN, "gap-1")}>
        <Type className="size-4" />
        <span className="text-xs">{t("autoEdit.addText")}</span>
      </button>
      <button
        type="button"
        onClick={splitSelected}
        disabled={selectionEmpty}
        className={cn(TOOLBAR_BTN, "gap-1 disabled:pointer-events-none disabled:opacity-40")}
      >
        <Scissors className="size-4" />
        <span className="text-xs">{t("autoEdit.split")}</span>
      </button>
      <button
        type="button"
        onClick={duplicateSelected}
        disabled={selectionEmpty}
        className={cn(TOOLBAR_BTN, "gap-1 disabled:pointer-events-none disabled:opacity-40")}
      >
        <Copy className="size-4" />
        <span className="text-xs">{t("autoEdit.duplicate")}</span>
      </button>
      <button
        type="button"
        onClick={deleteSelected}
        disabled={selectionEmpty}
        className={cn(TOOLBAR_BTN, "gap-1 disabled:pointer-events-none disabled:opacity-40")}
      >
        <Trash2 className="size-4" />
        <span className="text-xs">{t("autoEdit.delete")}</span>
      </button>

      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => setRippleEnabled(!rippleEnabled)}
          aria-label={t("autoEdit.ripple")}
          title={t("autoEdit.ripple.hint")}
          aria-pressed={rippleEnabled}
          className={cn(
            TOOLBAR_BTN,
            "gap-1",
            rippleEnabled ? "bg-primary/10 text-primary" : "opacity-60",
          )}
        >
          <Waves className="size-4" />
          <span className="text-xs">{t("autoEdit.ripple")}</span>
        </button>
      </div>
    </div>
  );
}
