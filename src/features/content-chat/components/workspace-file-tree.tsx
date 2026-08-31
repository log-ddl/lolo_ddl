import { useState, useEffect, useMemo, memo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  Image as ImageIcon,
  Music,
  Video as VideoIcon,
  File,
  RotateCw,
  ExternalLink,
  Search,
  X,
  FolderTree,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export interface WorkspaceTreeNode {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
  children?: WorkspaceTreeNode[];
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(ext?: string) {
  const extension = (ext || "").toLowerCase();
  if (extension === ".md" || extension === ".txt") {
    return <FileText className="size-3.5 text-blue-500 shrink-0" />;
  }
  if (extension === ".json") {
    return <FileJson className="size-3.5 text-amber-500 shrink-0" />;
  }
  if ([".ts", ".js", ".tsx", ".jsx", ".py", ".sh", ".cmd", ".bat"].includes(extension)) {
    return <FileCode className="size-3.5 text-emerald-500 shrink-0" />;
  }
  if ([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"].includes(extension)) {
    return <ImageIcon className="size-3.5 text-purple-500 shrink-0" />;
  }
  if ([".wav", ".mp3", ".ogg", ".m4a", ".flac", ".aac"].includes(extension)) {
    return <Music className="size-3.5 text-rose-500 shrink-0" />;
  }
  if ([".mp4", ".webm", ".mov", ".mkv", ".avi"].includes(extension)) {
    return <VideoIcon className="size-3.5 text-cyan-500 shrink-0" />;
  }
  return <File className="size-3.5 text-muted-foreground shrink-0" />;
}

function TreeNodeRow({
  node,
  depth = 0,
  searchQuery,
  onOpenFile,
}: {
  node: WorkspaceTreeNode;
  depth?: number;
  searchQuery: string;
  onOpenFile: (relativePath: string) => void;
}) {
  // Mặc định đóng gọn gàng, chỉ mở khi user click hoặc khi tìm kiếm
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) setIsOpen(true);
  }, [searchQuery]);

  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const selfMatches = node.name.toLowerCase().includes(q);
    const childrenMatch = node.children?.some((c) =>
      c.name.toLowerCase().includes(q) || (c.children && c.children.length > 0)
    );
    return selfMatches || childrenMatch;
  }, [node, searchQuery]);

  if (!matchesSearch) return null;

  if (node.isDirectory) {
    return (
      <div>
        <div
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className="flex items-center gap-1.5 py-1 px-1.5 rounded-md text-xs font-medium text-foreground/90 hover:bg-muted/60 transition-colors cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="size-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="size-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="size-3.5 text-amber-500/90 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {isOpen && node.children && (
          <div className="border-l border-border/40 ml-2.5 space-y-0.5 my-0.5">
            {node.children.map((child) => (
              <TreeNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                searchQuery={searchQuery}
                onOpenFile={onOpenFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ paddingLeft: `${depth * 12 + 16}px` }}
      className="flex items-center justify-between gap-1.5 py-1 px-1.5 rounded-md text-xs text-foreground/80 hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer select-none"
      onClick={() => onOpenFile(node.relativePath)}
      title={node.relativePath}
    >
      <div className="flex items-center gap-1.5 min-w-0 truncate">
        {getFileIcon(node.extension)}
        <span className="truncate">{node.name}</span>
      </div>
      {node.size !== undefined && (
        <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">
          {formatBytes(node.size)}
        </span>
      )}
    </div>
  );
}

export const WorkspaceFileTree = memo(function WorkspaceFileTree({
  workspacePath,
  onOpenFile,
  onOpenDirectory,
  onClose,
}: {
  workspacePath?: string | null;
  onOpenFile: (relativePath: string) => void;
  onOpenDirectory: () => void;
  onClose?: () => void;
}) {
  const [tree, setTree] = useState<WorkspaceTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshTree = async () => {
    if (!window.contentWorkspace?.listTree) return;
    setLoading(true);
    try {
      const res = await window.contentWorkspace.listTree(workspacePath);
      setTree(res.tree || []);
    } catch (err: any) {
      toast.error(`Lỗi tải cây thư mục: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshTree();
  }, [workspacePath]);

  return (
    <div className="flex flex-col h-full bg-card border-l border-border/60 w-72 shrink-0 overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <FolderTree className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate">Files</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void refreshTree()}
            disabled={loading}
            title="Làm mới cây thư mục"
            className="size-7"
          >
            <RotateCw className={cn("size-3.5 text-muted-foreground", loading && "animate-spin")} />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenDirectory}
            title="Mở trong Finder / File Explorer"
            className="size-7"
          >
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              title="Đóng bảng files"
              className="size-7"
            >
              <X className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-border/40 bg-background/50">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/50">
          <Search className="size-3 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc file..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")}>
              <X className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading && tree.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Đang tải danh sách file...
          </div>
        ) : tree.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground italic px-2">
            Thư mục chưa có file nào.
          </div>
        ) : (
          tree.map((node) => (
            <TreeNodeRow
              key={node.path}
              node={node}
              searchQuery={searchQuery}
              onOpenFile={onOpenFile}
            />
          ))
        )}
      </div>
    </div>
  );
});
