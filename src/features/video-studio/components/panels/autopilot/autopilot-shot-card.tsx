import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { useNow } from "@/shared/lib/use-now";
import { TaskInfoButton } from "@/shared/task-metadata";
import { Check, ChevronRight, Mic, Users, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { SplitSceneCard } from "@/features/video-studio/components/panels/director/split-scene-card";
import { useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import type { SplitScene } from "@/features/video-studio/stores/director-types";
import type { GenerationStatus } from "@/features/video-studio/lib/ai/generation-status";
import type {
  AutopilotJobListItem,
  AutopilotMediaOutput,
  AutopilotPlannedShot,
} from "@/features/video-studio/autopilot/types";

function toGenerationStatus(status: AutopilotPlannedShot["imageStatus"] | AutopilotMediaOutput["imageStatus"]): GenerationStatus {
  if (status === "skipped") return "completed";
  if (
    status === "queued" ||
    status === "uploading" ||
    status === "generating" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }
  return "idle";
}

/** Track when a status transitions to 'generating' and return the timestamp */
function useStartedAt(status: string | undefined): number | undefined {
  const ref = useRef<number | undefined>(undefined);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  useEffect(() => {
    const isGenerating = status === "generating";
    if (isGenerating) {
      if (ref.current === undefined) {
        const now = Date.now();
        ref.current = now;
        setStartedAt(now);
      }
    } else {
      ref.current = undefined;
      setStartedAt(undefined);
    }
  }, [status]);
  return startedAt;
}

export function AutopilotShotCard({
  job,
  shot,
  media,
}: {
  job: AutopilotJobListItem;
  shot: AutopilotPlannedShot;
  media?: AutopilotMediaOutput;
}) {
  const { t } = useI18n();
  const updateShotPrompts = useAutopilotStore((s) => s.updateShotPrompts);
  const updateShotVideoLength = useAutopilotStore((s) => s.updateShotVideoLength);
  const removeShotImage = useAutopilotStore((s) => s.removeShotImage);
  const regenerateShotMedia = useAutopilotStore((s) => s.regenerateShotMedia);
  const importShotImage = useAutopilotStore((s) => s.importShotImage);
  const cancelJob = useAutopilotStore((s) => s.cancelJob);

  const busy = job.status === "running" || job.status === "queued";
  const shotIndex = shot.index;
  const imageStartedAt = useStartedAt(media?.imageStatus);
  const videoStartedAt = useStartedAt(media?.videoStatus);

  const scene = useMemo<SplitScene>(() => ({
    id: shot.index - 1,
    sceneName: shot.sceneRefId || "",
    sceneLocation: "",
    imageDataUrl: media?.imagePath || "",
    imageHttpUrl: null,
    width: 0,
    height: 0,
    imagePrompt: shot.imagePrompt || "",
    imageStatus: toGenerationStatus(media?.imageStatus),
    imageProgress: 0,
    imageError: null,
    imageSource: "ai-generated",
    videoPrompt: shot.videoPrompt || "",
    voiceOver: shot.voiceOver || "",
    videoLength: shot.videoLength,
    videoStatus: toGenerationStatus(media?.videoStatus),
    videoProgress: 0,
    videoUrl: media?.videoPath || null,
    videoError: media?.videoStatus === "failed" ? t("director.generationFailed") : null,
    videoMediaId: media?.videoMediaId || null,
    characterIds: [],
    dialogue: "",
    soundEffectText: "",
    ambientSound: "",
    soundEffects: [],
    row: 0,
    col: 0,
    sourceRect: { x: 0, y: 0, width: 0, height: 0 },
  }), [
    shot.index,
    shot.sceneRefId,
    shot.imagePrompt,
    shot.videoPrompt,
    shot.voiceOver,
    shot.videoLength,
    media?.imagePath,
    media?.imageStatus,
    media?.videoPath,
    media?.videoStatus,
    media?.videoMediaId,
    t,
  ]);

  // Derive compact status info for summary row
  const hasImage = !!media?.imagePath;
  const hasVideo = !!media?.videoPath;
  const imageGenerating = media?.imageStatus === "generating";
  const imageQueued = media?.imageStatus === "queued";
  const videoGenerating = media?.videoStatus === "generating";
  const videoQueued = media?.videoStatus === "queued";
  const imageFailed = media?.imageStatus === "failed";
  const videoFailed = media?.videoStatus === "failed";
  const sceneName = shot.sceneRefId || "";
  const now = useNow(imageGenerating || videoGenerating);
  const imageElapsed = imageGenerating && imageStartedAt ? Math.max(0, Math.floor((now - imageStartedAt) / 1000)) : 0;
  const videoElapsed = videoGenerating && videoStartedAt ? Math.max(0, Math.floor((now - videoStartedAt) / 1000)) : 0;

  return (
    <details className="rounded-lg border border-border bg-card overflow-hidden">
      <summary className="flex cursor-pointer items-center gap-3 select-none list-none px-3 py-2 [&::-webkit-details-marker]:hidden hover:bg-muted/30 transition-colors">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground shrink-0">Shot {shot.index}</span>
          {sceneName && <span className="text-xs font-medium text-foreground truncate">{sceneName}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Image status */}
          {hasImage ? (
            <span className="rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-[9px] text-green-700 dark:text-green-400">Asset</span>
          ) : imageGenerating ? (
            <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[9px] text-primary animate-pulse">{t("autopilot.card.generating")} {imageElapsed}s</span>
          ) : imageQueued ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9px] text-amber-600 dark:text-amber-400">{t("autopilot.panel.waiting")}</span>
          ) : imageFailed ? (
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[9px] text-red-600 dark:text-red-400">{t("autopilot.card.failed")}</span>
          ) : null}
          {/* Duration */}
          <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{shot.videoLength}s</span>
          {/* Video status */}
          {hasVideo ? (
            <span className="rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-[9px] text-green-700 dark:text-green-400">{t("autopilot.card.hasVideo")}</span>
          ) : videoGenerating ? (
            <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[9px] text-primary animate-pulse">{t("autopilot.card.renderingVideo")} {videoElapsed}s</span>
          ) : videoQueued ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9px] text-amber-600 dark:text-amber-400">{t("autopilot.panel.waiting")}</span>
          ) : videoFailed ? (
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[9px] text-red-600 dark:text-red-400">{t("autopilot.card.videoFailed")}</span>
          ) : null}
          <TaskInfoButton
            outputUrl={hasVideo ? media?.videoPath : media?.imagePath}
            prompt={hasVideo ? shot.videoPrompt : shot.imagePrompt}
            kind={hasVideo ? "video" : "image"}
            title={t(hasVideo ? "taskInfo.video" : "taskInfo.image")}
          />
        </div>
        <ChevronRight className="autopilot-collapsible-chevron-right h-4 w-4 shrink-0 text-muted-foreground" />
      </summary>
      <div className="border-t border-border">
        {shot.voiceOver?.trim() && (
          <div className="flex items-start gap-1.5 border-b border-border/60 bg-muted/20 px-3 py-2">
            <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
            <p className="text-[11px] leading-relaxed text-foreground/80" title={shot.voiceOver}>{shot.voiceOver}</p>
          </div>
        )}
        <SplitSceneCard
          scene={scene}
          isGeneratingAny={busy}
          videoGenerationMode="image-to-video"
          imageStartedAt={imageStartedAt}
          videoStartedAt={videoStartedAt}
          onUpdateImagePrompt={(_id, prompt) => updateShotPrompts(job.id, shotIndex, { imagePrompt: prompt })}
          onUpdateVideoPrompt={(_id, prompt) => updateShotPrompts(job.id, shotIndex, { videoPrompt: prompt })}
          onUpdateCharacters={() => {}}
          onGenerateImage={() => {
            if (!regenerateShotMedia(job.id, shotIndex, "image")) toast.error(t("autopilot.card.regenBlocked"));
          }}
          onGenerateVideo={() => {
            if (!regenerateShotMedia(job.id, shotIndex, "video")) toast.error(t("autopilot.card.regenBlocked"));
          }}
          onRemoveImage={() => removeShotImage(job.id, shotIndex)}
          onUploadImage={async (_id, dataUrl) => {
            if (await importShotImage(job.id, shotIndex, dataUrl)) toast.success(`Đã import ảnh shot ${shotIndex}`);
          }}
          onStopImageGeneration={() => cancelJob(job.id)}
          onStopVideoGeneration={() => cancelJob(job.id)}
          onUpdateField={(_id, field, value) => {
            if (field === "videoLength") updateShotVideoLength(job.id, shotIndex, Number(value) as 4 | 6 | 8);
          }}
          referenceSlot={<AutopilotReferenceSelector job={job} shot={shot} disabled={busy} />}
        />
      </div>
    </details>
  );
}

function AutopilotReferenceSelector({
  job,
  shot,
  disabled,
}: {
  job: AutopilotJobListItem;
  shot: AutopilotPlannedShot;
  disabled: boolean;
}) {
  const updateShotReferences = useAutopilotStore((s) => s.updateShotReferences);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const characters = job.plannedCharacters || [];
  const scenes = job.plannedScenes || [];
  const selectedNames = shot.characterNames || [];
  const selectedSet = new Set(selectedNames.map((name) => name.toLocaleLowerCase()));

  const toggleCharacter = (name: string) => {
    const next = selectedSet.has(name.toLocaleLowerCase())
      ? selectedNames.filter((item) => item.toLocaleLowerCase() !== name.toLocaleLowerCase())
      : [...selectedNames, name];
    updateShotReferences(job.id, shot.index, { characterNames: next });
  };

  // Only characters actually attached to this shot are listed inline; the full
  // cast stays behind the picker so a large cast cannot flood every card.
  const attached = characters.filter((character) => selectedSet.has(character.name.toLocaleLowerCase()));
  // Names the plan still references but that no longer exist in the cast. Without
  // this they would be invisible here yet still sent into generation.
  const orphanNames = selectedNames.filter(
    (name) => !characters.some((character) => character.name.toLocaleLowerCase() === name.toLocaleLowerCase()),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const pickerCharacters = normalizedQuery
    ? characters.filter((character) => character.name.toLocaleLowerCase().includes(normalizedQuery))
    : characters;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 justify-end">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tham chiếu</div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground">Nhân vật</span>
          {characters.length > 0 && (
            <span className="text-[9px] tabular-nums text-muted-foreground/60">
              {selectedNames.length}/{characters.length}
            </span>
          )}
        </div>
        {characters.length === 0 ? (
          <div className="text-[9px] italic text-muted-foreground/60">Không có nhân vật</div>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {attached.map((character) => (
              <span
                key={character.name}
                className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                title={character.characterPrompt}
              >
                {character.name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleCharacter(character.name)}
                  className="rounded-full hover:bg-primary/20 disabled:opacity-50"
                  aria-label={`Bỏ gắn ${character.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {orphanNames.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300"
                title="Tên này không còn trong danh sách nhân vật của job"
              >
                {name}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleCharacter(name)}
                  className="rounded-full hover:bg-amber-500/20 disabled:opacity-50"
                  aria-label={`Bỏ gắn ${name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {attached.length === 0 && orphanNames.length === 0 && (
              <span className="text-[9px] italic text-muted-foreground/60">Chưa gắn nhân vật</span>
            )}
            <Popover
              open={pickerOpen}
              onOpenChange={(open) => {
                setPickerOpen(open);
                if (!open) setQuery("");
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                >
                  <Users className="h-2.5 w-2.5" />
                  Chọn
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                {characters.length > 8 && (
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm nhân vật..."
                    className="mb-1.5 h-7 w-full rounded-md border border-border bg-background px-2 text-[11px]"
                  />
                )}
                {pickerCharacters.length === 0 ? (
                  <p className="py-3 text-center text-[11px] text-muted-foreground">Không tìm thấy</p>
                ) : (
                  <div className="max-h-[240px] space-y-0.5 overflow-y-auto">
                    {pickerCharacters.map((character) => {
                      const active = selectedSet.has(character.name.toLocaleLowerCase());
                      return (
                        <button
                          key={character.name}
                          type="button"
                          onClick={() => toggleCharacter(character.name)}
                          className="flex w-full items-center gap-2 rounded p-1.5 text-left hover:bg-muted"
                          title={character.characterPrompt}
                        >
                          <span className={cn("flex-1 truncate text-[11px]", active && "text-primary")}>
                            {character.name}
                          </span>
                          {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[9px] text-muted-foreground">Cảnh</div>
        <select
          value={shot.sceneRefId || ""}
          disabled={disabled || scenes.length === 0}
          onChange={(event) => updateShotReferences(job.id, shot.index, { sceneRefId: event.target.value })}
          className="h-7 w-full rounded-md border border-border bg-background px-2 text-[10px] disabled:opacity-50"
        >
          <option value="">Không gắn cảnh</option>
          {scenes.map((sceneItem) => (
            <option key={sceneItem.name} value={sceneItem.name}>{sceneItem.name}</option>
          ))}
          {shot.sceneRefId && !scenes.some((sceneItem) => sceneItem.name === shot.sceneRefId) && (
            <option value={shot.sceneRefId}>{shot.sceneRefId}</option>
          )}
        </select>
      </div>
    </div>
  );
}
