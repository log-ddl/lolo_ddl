"use client";

/**
 * Right-click menus for a folder (rename / delete) and a character (move / delete).
 */

import { Folder, FolderInput, Home, Pencil, Trash2 } from "lucide-react";
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
import type { Character, CharacterFolder } from "@/features/video-studio/stores/character-library-store";

export function FolderContextMenu({
  folder: _folder,
  children,
  onRename,
  onDelete,
}: {
  folder: CharacterFolder;
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Character context menu component
export function CharacterContextMenu({
  character: _character,
  children,
  folders,
  onDelete,
  onMove,
}: {
  character: Character;
  children: React.ReactNode;
  folders: CharacterFolder[];
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="h-4 w-4 mr-2" />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onMove(null)}>
              <Home className="h-4 w-4 mr-2" />
              Root
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
          Delete character
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

