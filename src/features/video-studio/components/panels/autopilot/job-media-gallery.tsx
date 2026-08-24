"use client";

/**
 * The per-job workspace: character/scene reference cards, researched source
 * images, and the shot grid, plus the preview modals they open.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink, FileUp, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const characters = job.plannedCharacters || [];
  const scenes = job.plannedScenes || [];
  const shots = job.plannedShots || [];
  const researchedImages = job.mediaOutputs?.filter((item) => item.realImagePath) || [];
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
        <details open className="order-4 group/section">
          <summary className="flex cursor-pointer items-center gap-1.5 select-none list-none text-xs font-semibold [&::-webkit-details-marker]:hidden">
            <ChevronDown className="autopilot-collapsible-chevron h-3.5 w-3.5 shrink-0" />
            {t("autopilot.panel.shotMedia")} ({shots.length})
          </summary>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {shots.map((shot) => <AutopilotShotCard key={shot.id || shot.index} job={job} shot={shot} media={job.mediaOutputs?.find((item) => item.index === shot.index)} />)}
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
