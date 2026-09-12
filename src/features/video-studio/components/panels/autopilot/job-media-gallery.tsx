"use client";

/**
 * The per-job workspace: character/scene reference cards, researched source
 * images, and the shot grid, plus the preview modals they open.
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, ExternalLink, FileUp, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { LocalImage } from "@/shared/components/ui/local-image";
import { useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import { usePreviewStore } from "@/features/video-studio/stores/preview-store";
import { ImagePreviewModal, VideoPreviewModal } from "@/features/video-studio/components/panels/director/media-preview-modal";
import { AutopilotShotCard } from "@/features/video-studio/components/panels/autopilot/autopilot-shot-card";
import type {
  AutopilotCharacterOutput,
  AutopilotJobListItem,
  AutopilotSceneOutput,
} from "@/features/video-studio/autopilot/types";
import { readFileAsDataUrl, useActiveElapsedSeconds } from "./panel-shared";

function ReferenceCard({
  job,
  kind,
  name,
  prompt,
  output,
  onPreview,
}: {
  job: AutopilotJobListItem;
  kind: "character" | "scene";
  name: string;
  prompt: string;
  output?: AutopilotCharacterOutput | AutopilotSceneOutput;
  onPreview: (path: string) => void;
}) {
  const importCharacterImage = useAutopilotStore((state) => state.importCharacterImage);
  const importSceneImage = useAutopilotStore((state) => state.importSceneImage);
  const regenerateReferenceImage = useAutopilotStore((state) => state.regenerateReferenceImage);
  const updateReferencePrompt = useAutopilotStore((state) => state.updateReferencePrompt);
  const busy = job.status === "running" || job.status === "queued";
  const active = output?.status === "generating" || output?.status === "queued";
  const failed = output?.status === "failed";
  const elapsed = useActiveElapsedSeconds(output?.status);
  const [localPrompt, setLocalPrompt] = useState(prompt);
  useEffect(() => { setLocalPrompt(prompt); }, [prompt]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { updateReferencePrompt(job.id, kind, name, value); }, 600);
  };
  const handleImport = async (file: File) => {
    try {
      const source = await readFileAsDataUrl(file);
      const ok = kind === "character"
        ? await importCharacterImage(job.id, name, source)
        : await importSceneImage(job.id, name, source);
      if (ok) toast.success(`Đã import ảnh tham chiếu: ${name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  const handleRegenerate = () => {
    if (!regenerateReferenceImage(job.id, kind, name)) {
      toast.error("Không thể tạo lại lúc này. Hãy tạm dừng job trước.");
    }
  };
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", active ? "border-primary/60" : failed ? "border-red-500/50" : "border-border")}>
      <button type="button" disabled={!output?.imagePath} onClick={() => output?.imagePath && onPreview(output.imagePath)} className={cn("relative block w-full bg-muted/30", kind === "character" ? "aspect-square" : "aspect-video")}>
        {output?.imagePath ? <LocalImage src={output.imagePath} alt={name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{active ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/50" />}</span>}
        <span className={cn("absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-2xs", output?.imagePath ? "bg-green-600 text-white" : failed ? "bg-red-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-black/60 text-white")}>{output?.imagePath ? "Đã có" : failed ? "Lỗi" : (output?.status === "generating" || output?.status === "uploading") ? `${elapsed}s` : output?.status === "queued" ? "Chờ gửi đi" : "Chờ"}</span>
      </button>
      <div className="space-y-1 p-1.5">
        <div className="truncate text-2xs font-medium">{name}</div>
        <textarea
          value={localPrompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          disabled={busy}
          rows={2}
          className="w-full resize-none rounded border border-border bg-background px-1.5 py-1 text-2xs text-foreground leading-tight focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
          placeholder="Mô tả nhân vật / cảnh..."
        />
        <div className="flex gap-1">
          <label className={cn("flex h-5 flex-1 cursor-pointer items-center justify-center rounded border border-border text-2xs hover:bg-muted", busy && "pointer-events-none opacity-50")}>
            <FileUp className="mr-0.5 h-2.5 w-2.5" />{output?.imagePath ? "Thay" : "Import"}
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void handleImport(file); }} />
          </label>
          <button type="button" disabled={busy} onClick={handleRegenerate} className={cn("flex h-5 flex-1 items-center justify-center rounded border border-border text-2xs hover:bg-muted", busy && "pointer-events-none opacity-50")}>
            <Loader2 className="mr-0.5 h-2.5 w-2.5" />Tạo lại
          </button>
        </div>
      </div>
    </div>
  );
}

export function JobMediaGallery({ job }: { job: AutopilotJobListItem }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<{ type: "image" | "video"; path: string; shotIndex?: number } | null>(null);
  const updateShotImagePath = useAutopilotStore((state) => state.updateShotImagePath);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const characters = job.plannedCharacters || [];
  const scenes = job.plannedScenes || [];
  const shots = job.plannedShots || [];
  const researchedImages = job.mediaOutputs?.filter((item) => item.realImagePath) || [];
  const mediaByIndex = new Map(job.mediaOutputs?.map((item) => [item.index, item]));
  const rows = shots.map((shot) => {
    const media = mediaByIndex.get(shot.index);
    const statuses = [media?.imageStatus, media?.videoStatus];
    const active = statuses.some((status) => status === "generating" || status === "uploading" || status === "queued");
    const attention = statuses.includes("failed") || (media?.videoStatus === "skipped" && !!media.videoError);
    const state = active ? "active" : attention ? "attention" : media?.imagePath || media?.videoPath ? "ready" : "waiting";
    return { shot, media, state };
  });
  const filters = [
    { id: "all", label: "Tất cả", count: rows.length },
    { id: "attention", label: "Cần xử lý", count: rows.filter((row) => row.state === "attention").length },
    { id: "active", label: "Đang thực hiện", count: rows.filter((row) => row.state === "active").length },
    { id: "ready", label: "Đã có media", count: rows.filter((row) => row.state === "ready").length },
    { id: "waiting", label: "Chưa bắt đầu", count: rows.filter((row) => row.state === "waiting").length },
  ];
  const search = query.trim().toLocaleLowerCase();
  const filtered = rows.filter(({ shot, state }) => (filter === "all" || filter === state)
    && (!search || `shot ${shot.index} ${shot.sceneRefId} ${shot.voiceOver}`.toLocaleLowerCase().includes(search)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 24));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = filtered.slice(currentPage * 24, (currentPage + 1) * 24);
  const attentionCount = filters[1].count;
  if (characters.length === 0 && scenes.length === 0 && shots.length === 0 && researchedImages.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/10">
      <details open>
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">Không gian làm việc ({characters.length + scenes.length + shots.length} mục)</summary>
        <div className="flex flex-col gap-3 border-t border-border p-2.5">
      {characters.length > 0 && (
        <details open className="order-2 group/section">
          <summary className="flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronDown className="autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" />
            {t("autopilot.panel.characterReferences")} ({characters.length})
          </summary>
          <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {characters.map((character) => <ReferenceCard key={character.name} job={job} kind="character" name={character.name} prompt={character.characterPrompt} output={job.characterOutputs?.find((item) => item.name.toLocaleLowerCase() === character.name.toLocaleLowerCase())} onPreview={(path) => setPreview({ type: "image", path })} />)}
          </div>
        </details>
      )}
      {scenes.length > 0 && (
        <details open className="order-3 group/section">
          <summary className="flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronDown className="autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" />
            {t("autopilot.panel.sceneReferences")} ({scenes.length})
          </summary>
          <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
            {scenes.map((scene) => <ReferenceCard key={scene.name} job={job} kind="scene" name={scene.name} prompt={scene.scenePrompt} output={job.sceneOutputs?.find((item) => item.name.toLocaleLowerCase() === scene.name.toLocaleLowerCase())} onPreview={(path) => setPreview({ type: "image", path })} />)}
          </div>
        </details>
      )}
      {researchedImages.length > 0 && (
        <details open className="order-1 group/section">
          <summary className="flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronDown className="autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" />
            {t("autopilot.panel.researchedImages")} ({researchedImages.length})
          </summary>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {researchedImages.map((shot) => (
              <div key={`real-${shot.index}`} className="overflow-hidden rounded-lg border border-border bg-card">
                <button type="button" onClick={() => setPreview({ type: "image", path: shot.realImagePath! })} className="relative block w-full">
                  <LocalImage src={shot.realImagePath!} alt={shot.realImageTitle || `Real image ${shot.index}`} className="aspect-video w-full object-cover" />
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-2xs text-white">Shot {shot.index}</span>
                </button>
                <div className="space-y-1 p-1.5 text-2xs">
                  <div className="truncate" title={shot.realImageTitle}>{shot.realImageTitle || shot.realImageQuery}</div>
                  <div className="flex items-center justify-end gap-2 text-muted-foreground">
                    {shot.realImageSourceUrl && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-2xs" onClick={() => void window.authBridge?.openExternal(shot.realImageSourceUrl!)}>
                        <ExternalLink className="mr-1 h-3 w-3" />{t("autopilot.panel.openSource")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
      {shots.length > 0 && (
        <details open className="order-first group/section">
          <summary className="flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronDown className="autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" />
            {t("autopilot.panel.shotMedia")} ({shots.length})
          </summary>
          <div className="mt-3 space-y-3">
            {attentionCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm" role="status">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div><p className="font-medium">{attentionCount} shot cần kiểm tra</p><p className="mt-1 text-xs text-muted-foreground">{job.status === "running" || job.status === "queued" ? "Các shot khác vẫn tiếp tục. Lọc Cần xử lý để xem lỗi; tạm dừng job trước khi sửa hoặc tạo lại từng shot." : "Mở shot để xem lỗi, thay ảnh hoặc tạo lại. Video bị lỗi có thể được ghép bằng ảnh tĩnh."}</p></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc trạng thái shot">
              {filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setPage(0); }} className={cn("flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", filter === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {item.label}<span className="rounded bg-current/10 px-1.5 tabular-nums">{item.count}</span>
              </button>)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border bg-background px-3 sm:max-w-sm"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input aria-label="Tìm shot theo số, cảnh hoặc lời đọc" placeholder="Tìm số shot, tên cảnh, lời đọc…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" /></label>
              <span className="text-xs text-muted-foreground">{filtered.length ? `${currentPage * 24 + 1}–${Math.min((currentPage + 1) * 24, filtered.length)} / ${filtered.length} shot` : "0 shot"}</span>
            </div>
            <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {visibleRows.map(({ shot, media }) => <AutopilotShotCard key={shot.id || shot.index} job={job} shot={shot} media={media} />)}
            </div>
            {filtered.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Không có shot phù hợp bộ lọc.<Button variant="ghost" className="ml-2" onClick={() => { setFilter("all"); setQuery(""); setPage(0); }}>Xem tất cả</Button></div>}
            {pageCount > 1 && <div className="flex items-center justify-between border-t pt-3"><Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Trang trước</Button><span className="text-xs tabular-nums text-muted-foreground">Trang {currentPage + 1} / {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Trang sau</Button></div>}
          </div>
        </details>
      )}
        </div>
      </details>
      <ImagePreviewModal imageUrl={preview?.type === "image" ? preview.path : ""} isOpen={preview?.type === "image"} onClose={() => setPreview(null)} onImageCleaned={(cleanedUrl) => { if (preview?.shotIndex != null) { updateShotImagePath(job.id, preview.shotIndex, cleanedUrl); } setPreview({ type: "image", path: cleanedUrl, shotIndex: preview?.shotIndex }); }} />
      <VideoPreviewModal videoUrl={preview?.type === "video" ? preview.path : ""} isOpen={preview?.type === "video"} onClose={() => setPreview(null)} />
    </div>
  );
}

/** Global preview modals driven by the shared preview store. */
export function ShotPreviewOverlay() {
  const previewItem = usePreviewStore((s) => s.previewItem);
  const setPreviewItem = usePreviewStore((s) => s.setPreviewItem);
  return (
    <>
      <ImagePreviewModal
        imageUrl={previewItem?.type === "image" ? previewItem.url : ""}
        isOpen={previewItem?.type === "image"}
        onClose={() => setPreviewItem(null)}
      />
      <VideoPreviewModal
        videoUrl={previewItem?.type === "video" ? previewItem.url : ""}
        isOpen={previewItem?.type === "video"}
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
