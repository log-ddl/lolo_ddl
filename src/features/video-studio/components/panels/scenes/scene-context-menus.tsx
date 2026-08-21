"use client";

/**
 * Right-click menus for a folder (rename / delete) and a scene (move / delete).
 */

import { Folder, FolderInput, Home, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import type { Scene, SceneFolder } from "@/features/video-studio/stores/scene-store";

export function FolderContextMenu({
  folder: _folder,
  children,
  onRename,
  onDelete,
}: {
  folder: SceneFolder;
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="h-4 w-4 mr-2" />
          {t("scenes.renameFolder")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t("scenes.deleteFolder")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function SceneContextMenu({
  scene: _scene,
  children,
  folders,
  onDelete,
  onMove,
}: {
  scene: Scene;
  children: React.ReactNode;
  folders: SceneFolder[];
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const { t } = useI18n();

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="h-4 w-4 mr-2" />
            {t("common.moveTo")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onMove(null)}>
              <Home className="h-4 w-4 mr-2" />
              {t("common.root")}
            </ContextMenuItem>
            {folders.map((f) => (
              <ContextMenuItem key={f.id} onClick={() => onMove(f.id)}>
                <Folder className="h-4 w-4 mr-2" />
                {f.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t("scenes.deleteScene")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
