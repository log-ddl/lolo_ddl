"use client";

/**
 * The palette that opens when a wire is dropped on empty canvas, or when the
 * toolbar's add button is pressed.
 *
 * When it opens from a wire it is filtered to the kinds that actually accept
 * what that wire carries, so an unusable option is never offered and the user
 * never has to learn the type rules by failing at them.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, TypeIcon, VideoIcon } from "lucide-react";
import { CANVAS_NODE_KINDS, NODE_SPECS, kindsAccepting, type CanvasNodeKind, type PortType } from "@/features/video-studio/canvas/types";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

const KIND_ICONS: Record<CanvasNodeKind, typeof ImageIcon> = {
  reference: ImageIcon, list: TypeIcon, router: TypeIcon, selectResult: ImageIcon, imageEdit: ImageIcon,
  note: TypeIcon,
  group: TypeIcon,
  localVideo: VideoIcon,
  localImage: ImageIcon,
  imageGenerator: ImageIcon,
  videoGenerator: VideoIcon,
  text: TypeIcon,
};

const KIND_COLORS: Record<CanvasNodeKind, string> = {
  reference: "text-amber-500", list: "text-violet-500", router: "text-violet-500", selectResult: "text-blue-500", imageEdit: "text-blue-500",
  note: "text-amber-500",
  group: "text-muted-foreground",
  localVideo: "text-emerald-500",
  localImage: "text-amber-500",
  imageGenerator: "text-blue-500",
  videoGenerator: "text-emerald-500",
  text: "text-violet-500",
};

/** Kept in sync with the classes below so the panel can clamp it to the canvas. */
export const PICKER_WIDTH = 288;
export const PICKER_HEIGHT = 300;

export interface NodePickerProps {
  /** Screen position, relative to the canvas wrapper. */
  at: { x: number; y: number };
  /** Only offer kinds that accept this type. Undefined = offer everything. */
  accepts?: PortType;
  onPick: (kind: CanvasNodeKind) => void;
  onClose: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function NodePicker({ at, accepts, onPick, onClose, onContextMenu }: NodePickerProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  const kinds = useMemo(() => {
    const allowed = accepts ? kindsAccepting(accepts) : CANVAS_NODE_KINDS;
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return allowed;
    return allowed.filter((kind) => t(NODE_SPECS[kind].labelKey).toLocaleLowerCase().includes(needle));
  }, [accepts, query, t]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { rowsRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active, query]);
  // Keep the highlight on a row that still exists after the list narrows.
  useEffect(() => { setActive((current) => Math.min(current, Math.max(kinds.length - 1, 0))); }, [kinds.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current) => (current + 1) % Math.max(kinds.length, 1)); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((current) => (current - 1 + kinds.length) % Math.max(kinds.length, 1)); return; }
    if (event.key === "Enter" && kinds[active]) { event.preventDefault(); onPick(kinds[active]); }
  };

  return (
    <>
      <div className="absolute inset-0 z-40" onClick={onClose} onContextMenu={onContextMenu ?? ((event) => { event.preventDefault(); onClose(); })} />
      <div
        className="absolute z-50 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        style={{ left: at.x, top: at.y }}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-border px-3 py-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("canvas.picker.search")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={rowsRef} className="max-h-64 overflow-y-auto py-1" role="listbox" aria-label={t('canvas.toolbar.add')}>
          {kinds.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">{t("canvas.picker.empty")}</p>
          ) : kinds.map((kind, index) => {
            const Icon = KIND_ICONS[kind];
            return (
              <button
                key={kind}
                role="option"
                aria-selected={index === active}
                data-active={index === active}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => onPick(kind)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
                  index === active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <Icon className={cn("size-4 shrink-0", KIND_COLORS[kind])} />
                <span className="truncate">{t(NODE_SPECS[kind].labelKey)}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-2xs text-muted-foreground">
          <span>↑↓ {t("canvas.picker.navigate")}</span>
          <span>⏎ {t("canvas.picker.insert")}</span>
        </div>
      </div>
    </>
  );
}
