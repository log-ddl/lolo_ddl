import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileCode2, FolderOpen, Loader2, X } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { cachedFileReferences, fileTypeLabel, formatFileSize } from "../lib/file-references";
import { MarkdownContent } from "./markdown-content";

export type FilePreviewState = {
  requestedPath: string;
  loading: boolean;
  /** Workspace mà file này được resolve trong đó (tab AI dùng của hội thoại, tab Buzz dùng của pipeline). */
  workspacePath: string | null;
  path?: string;
  name?: string;
  extension?: string;
  size?: number;
  kind?: 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'unsupported';
  mimeType?: string;
  content?: string;
  dataUrl?: string;
  truncated?: boolean;
  error?: string;
};

/** Cards for the files an assistant reply mentions that actually exist on disk. */
export function FileReferenceCards({
  content,
  cacheKey,
  onOpenFile,
  workspacePath,
}: {
  content: string;
  /** id tin nhắn; có thì kết quả quét được nhớ lại trọn đời tin nhắn đó. */
  cacheKey?: string;
  onOpenFile: (filePath: string) => void;
  workspacePath: string | null;
}) {
  const candidates = useMemo(() => cachedFileReferences(cacheKey, content), [cacheKey, content]);
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace || candidates.length === 0) {
      setFiles([]);
      return () => { cancelled = true; };
    }
    setFiles([]);
    void window.contentWorkspace.resolveFiles(workspacePath, candidates)
      .then((resolved) => {
        if (!cancelled) setFiles(resolved.map((file) => file.requestedPath));
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => { cancelled = true; };
  }, [candidates, workspacePath]);

  if (files.length === 0) return null;
  return (
    <div className="mt-3 grid gap-2">
      {files.map((filePath) => (
        <button
          key={filePath}
          type="button"
          onClick={() => onOpenFile(filePath)}
          className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/45 px-3 py-2.5 text-left transition hover:bg-muted"
          title={filePath}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
            <FileCode2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">{filePath.split(/[\\/]/).pop()}</span>
            <span className="block text-2xs text-muted-foreground">{fileTypeLabel(filePath)}</span>
          </span>
          <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export function FilePreviewPanel({
  preview,
  onClose,
  onOpen,
  onReveal,
}: {
  preview: FilePreviewState;
  onClose: () => void;
  onOpen: () => void;
  onReveal: () => void;
}) {
  const { t } = useI18n();
  const displayName = preview.name || preview.requestedPath.split(/[\\/]/).pop() || preview.requestedPath;
  return (
    <aside className="flex h-full w-[42%] min-w-96 max-w-3xl shrink-0 flex-col border-l border-border bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.04)]">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={preview.path || preview.requestedPath}>{displayName}</p>
          <p className="truncate text-2xs text-muted-foreground">{preview.path || preview.requestedPath}</p>
        </div>
        {preview.path && (
          <>
            <Button variant="ghost" size="icon" className="size-8" onClick={onReveal} title={t("contentChat.revealFile")}>
              <FolderOpen className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={onOpen} title={t("contentChat.openFile")}>
              <ExternalLink className="size-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose} title={t("common.close")}>
          <X className="size-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {preview.loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : preview.error && !preview.path ? (
          <div className="m-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">{preview.error}</div>
        ) : preview.kind === 'image' && preview.dataUrl ? (
          <div className="flex min-h-full items-center justify-center bg-muted/25 p-5">
            <img src={preview.dataUrl} alt={displayName} className="max-h-full max-w-full rounded-lg object-contain shadow-sm" />
          </div>
        ) : preview.kind === 'pdf' && preview.dataUrl ? (
          <iframe src={preview.dataUrl} title={displayName} className="h-full min-h-[500px] w-full border-0 bg-background" />
        ) : preview.kind === 'audio' && preview.dataUrl ? (
          <div className="flex min-h-full items-center justify-center bg-muted/25 p-8">
            <audio src={preview.dataUrl} controls className="w-full max-w-xl" />
          </div>
        ) : preview.kind === 'video' && preview.dataUrl ? (
          <div className="flex min-h-full items-center justify-center bg-black p-4">
            <video src={preview.dataUrl} controls className="max-h-full max-w-full rounded-lg" />
          </div>
        ) : preview.kind === 'text' ? (
          preview.extension === '.md' || preview.extension === '.markdown' ? (
            <div className="mx-auto max-w-4xl p-6 text-sm leading-6">
              <MarkdownContent content={preview.content ?? ""} />
            </div>
          ) : (
            <pre className="min-h-full overflow-x-auto p-5 font-mono text-xs leading-5 text-foreground"><code>{preview.content}</code></pre>
          )
        ) : (
          <div className="m-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground">
            {preview.error || t("contentChat.previewUnsupported")}
          </div>
        )}
      </div>
      {!preview.loading && preview.path && (
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2 text-2xs text-muted-foreground">
          <span>{fileTypeLabel(displayName)}{typeof preview.size === 'number' ? ` · ${formatFileSize(preview.size)}` : ''}</span>
          {preview.truncated && <span>{t("contentChat.previewTruncated")}</span>}
        </footer>
      )}
    </aside>
  );
}
