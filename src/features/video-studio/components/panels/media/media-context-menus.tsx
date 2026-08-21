"use client";

/**
 * Folder icons/labels plus the right-click menus for a folder and a media item.
 */

import {
  CloudUpload,
  Download,
  Film,
  Folder,
  FolderInput,
  Home,
  Pencil,
  Scissors,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
import { useI18n } from "@/shared/i18n";
import type { MediaFile, MediaFolder } from "@/features/video-studio/types/media";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'ai-image': Sparkles,
  'ai-video': Film,
  'upload': CloudUpload,
};

// Get icon component for a folder
export function getFolderIcon(folder: MediaFolder) {
  if (folder.isSystem && folder.category) {
    const IconComp = CATEGORY_ICONS[folder.category];
    if (IconComp) return IconComp;
  }
  return Folder;
}

export function getFolderLabel(t: (key: string, params?: Record<string, string | number>) => string, folder: MediaFolder) {
  if (!folder.isSystem || !folder.category) return folder.name;
  const keyMap: Record<string, string> = {
    'ai-image': 'media.system.aiImage',
    'ai-video': 'media.system.aiVideo',
    'upload': 'media.system.upload',
  };
  return t(keyMap[folder.category] || folder.name);
}

// Folder context menu
export function FolderContextMenu({
  folder,
  children,
  onRename,
  onDelete,
}: {
  folder: MediaFolder;
  children: React.ReactNode;
  onRename: (folder: MediaFolder) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useI18n();

  // System folders cannot be deleted or renamed
  if (folder.isSystem) {
    return <>{children}</>;
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRename(folder)}>
          <Pencil className="h-4 w-4 mr-2" />
          {t("media.rename")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          onClick={() => onDelete(folder.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("assets.deleteFolder")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Media file context menu
export function MediaItemWithContextMenu({
  item,
  children,
  folders,
  onRemove,
  onExport,
  onRename,
  onMove,
  onSmartSplit,
  onGenerateScenes,
}: {
  item: MediaFile;
  children: React.ReactNode;
  folders: MediaFolder[];
  onRemove: (e: React.MouseEvent, id: string) => Promise<void>;
  onExport: (item: MediaFile) => void;
  onRename: (item: MediaFile) => void;
  onMove: (mediaId: string, folderId: string | null) => void;
  onSmartSplit?: (item: MediaFile) => void;
  onGenerateScenes?: (item: MediaFile) => void;
}) {
  const { t } = useI18n();
  const isImage = item.type === 'image';
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {/* AI director actions, available only for images. */}
        {isImage && onSmartSplit && onGenerateScenes && (
          <>
            <ContextMenuItem onClick={() => onSmartSplit(item)}>
              <Scissors className="h-4 w-4 mr-2 text-yellow-500" />
              {t("media.smartSplit")}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onGenerateScenes(item)}>
              <Film className="h-4 w-4 mr-2 text-blue-500" />
              {t("media.generateScenes")}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={() => onRename(item)}>
          <Pencil className="h-4 w-4 mr-2" />
          {t("media.rename")}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderInput className="h-4 w-4 mr-2" />
            {t("common.moveTo")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onMove(item.id, null)}>
              <Home className="h-4 w-4 mr-2" />
              {t("media.root")}
            </ContextMenuItem>
            {folders.map((f) => (
              <ContextMenuItem key={f.id} onClick={() => onMove(item.id, f.id)}>
                <Folder className="h-4 w-4 mr-2" />
                {f.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onExport(item)}>
          <Download className="h-4 w-4 mr-2" />
           {t("media.export")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive"
          onClick={(e) => onRemove(e, item.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
           {t("dashboard.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

