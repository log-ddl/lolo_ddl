"use client";

/**
 * Timeline toolbar: zoom, the clip actions that apply to the current selection,
 * and the ripple-edit toggle.
 */

import { Copy, Scissors, Trash2, Type, Waves, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import type { Translate } from "@/shared/i18n";

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
      <Button variant="ghost" size="xs" className="px-1.5 text-muted-foreground" type="button" onClick={() => zoomBy(1 / 1.25)} aria-label={t("autoEdit.zoomOut")}>
        <ZoomOut className="size-4" />
      </Button>
      <Button variant="ghost" size="xs" className="px-1.5 text-muted-foreground" type="button" onClick={() => zoomBy(1.25)} aria-label={t("autoEdit.zoomIn")}>
        <ZoomIn className="size-4" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="xs" className="gap-1 px-1.5 text-muted-foreground" type="button" onClick={addText}>
        <Type className="size-4" />
        <span className="text-xs">{t("autoEdit.addText")}</span>
      </Button>
      <Button variant="ghost" size="xs"
        type="button"
        onClick={splitSelected}
        disabled={selectionEmpty}
        className="gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Scissors className="size-4" />
        <span className="text-xs">{t("autoEdit.split")}</span>
      </Button>
      <Button variant="ghost" size="xs"
        type="button"
        onClick={duplicateSelected}
        disabled={selectionEmpty}
        className="gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Copy className="size-4" />
        <span className="text-xs">{t("autoEdit.duplicate")}</span>
      </Button>
      <Button variant="ghost" size="xs"
        type="button"
        onClick={deleteSelected}
        disabled={selectionEmpty}
        className="gap-1 px-1.5 text-muted-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Trash2 className="size-4" />
        <span className="text-xs">{t("autoEdit.delete")}</span>
      </Button>

      <div className="ml-auto flex items-center">
        <Button variant="ghost" size="xs"
          type="button"
          onClick={() => setRippleEnabled(!rippleEnabled)}
          aria-label={t("autoEdit.ripple")}
          title={t("autoEdit.ripple.hint")}
          aria-pressed={rippleEnabled}
          className={cn(
            "gap-1 px-1.5",
            rippleEnabled ? "bg-primary/10 text-primary" : "text-muted-foreground opacity-60",
          )}
        >
          <Waves className="size-4" />
          <span className="text-xs">{t("autoEdit.ripple")}</span>
        </Button>
      </div>
    </div>
  );
}
