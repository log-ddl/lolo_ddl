"use client";

/**
 * The landing view of the Canvas tab: every space, none of them owned by a
 * project. Opening a different Video Studio project must not change what is
 * listed here.
 */

import { SpaceTransfer } from "./space-transfer";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, Waypoints } from "lucide-react";
import { useCanvasStore } from "@/features/video-studio/canvas/canvas-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useI18n } from "@/shared/i18n";

export function SpaceList() {
  const { t } = useI18n();
  const spaces = useCanvasStore((state) => state.spaces);
  const { createSpace, openSpace, renameSpace, deleteSpace } = useCanvasStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const commitRename = (spaceId: string) => {
    renameSpace(spaceId, draftName);
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("canvas.spaces.title")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("canvas.spaces.subtitle")}</p>
        </div>
        <SpaceTransfer />
        <Button onClick={() => createSpace()} className="shrink-0">
          <Plus className="mr-1.5 size-4" />
          {t("canvas.spaces.new")}
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-center">
          <Waypoints className="size-10 text-muted-foreground/50" />
          <p className="font-medium">{t("canvas.spaces.empty")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("canvas.spaces.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {spaces.map((space) => (
            <div key={space.id} className="group rounded-2xl border border-border bg-card p-4 transition hover:border-muted-foreground/60">
              {editingId === space.id ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    autoFocus
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename(space.id);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="h-8 text-sm"
                  />
                  <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={() => commitRename(space.id)}>
                    <Check className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openSpace(space.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-medium">{space.name || t("canvas.spaces.untitled")}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t(space.nodes.length === 1 ? "canvas.spaces.nodeCountOne" : "canvas.spaces.nodeCount", { count: space.nodes.length })}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title={t("canvas.spaces.rename")}
                      onClick={() => { setEditingId(space.id); setDraftName(space.name); }}
                      className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title={t("canvas.spaces.delete")}
                      onClick={() => { if (window.confirm(t("canvas.spaces.deleteConfirm"))) deleteSpace(space.id); }}
                      className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => openSpace(space.id)}>
                {t("canvas.spaces.open")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
