import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { useNow } from "@/shared/lib/use-now";
import { TaskInfoButton } from "@/shared/task-metadata";
import { ChevronRight, Mic, Plus } from "lucide-react";
import { SplitSceneCard } from "@/features/video-studio/components/panels/director/split-scene-card";
import { useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import type { SplitScene } from "@/features/video-studio/stores/director-types";
import type { GenerationStatus } from "@/features/video-studio/lib/ai/generation-status";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
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
            <span className="rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-2xs text-green-700 dark:text-green-400">Asset</span>
          ) : imageGenerating ? (
            <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-2xs text-primary animate-pulse">{t("autopilot.card.generating")} {imageElapsed}s</span>
          ) : imageQueued ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-2xs text-amber-600 dark:text-amber-400">{t("autopilot.panel.waiting")}</span>
          ) : imageFailed ? (
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-2xs text-red-600 dark:text-red-400">{t("autopilot.card.failed")}</span>
          ) : null}
          {/* Duration */}
          <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-2xs text-muted-foreground">{shot.videoLength}s</span>
          {/* Video status */}
          {hasVideo ? (
            <span className="rounded-full bg-green-500/15 border border-green-500/30 px-2 py-0.5 text-2xs text-green-700 dark:text-green-400">{t("autopilot.card.hasVideo")}</span>
          ) : videoGenerating ? (
            <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-2xs text-primary animate-pulse">{t("autopilot.card.renderingVideo")} {videoElapsed}s</span>
          ) : videoQueued ? (
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-2xs text-amber-600 dark:text-amber-400">{t("autopilot.panel.waiting")}</span>
          ) : videoFailed ? (
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-2xs text-red-600 dark:text-red-400">{t("autopilot.card.videoFailed")}</span>
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
            <p className="text-2xs leading-relaxed text-foreground/80" title={shot.voiceOver}>{shot.voiceOver}</p>
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
            if (field === "videoLength") updateShotVideoLength(job.id, shotIndex, normalizeVideoLength(value));
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
  const [addingCharacter, setAddingCharacter] = useState(false);
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

  // A shot only shows the characters it actually references. Everyone else lives
  // behind the + button, so a cast of ten does not print ten chips on every card.
  // An imported plan can reference a name the job never planned, so the roster is
  // the planned cast plus whatever this shot already points at.
  const promptByName = new Map(characters.map((character) => [character.name.toLocaleLowerCase(), character.characterPrompt]));
  const roster = [
    ...characters.map((character) => character.name),
    ...selectedNames.filter((name) => !promptByName.has(name.toLocaleLowerCase())),
  ];
  const referenced = roster.filter((name) => selectedSet.has(name.toLocaleLowerCase()));
  const unreferenced = roster.filter((name) => !selectedSet.has(name.toLocaleLowerCase()));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 justify-end">
      <div className="text-2xs font-semibold text-muted-foreground">Tham chiếu</div>

      {roster.length > 0 && (
        <div className="space-y-1">
          <div className="text-2xs text-muted-foreground">Nhân vật</div>
          <div className="flex min-h-[1.25rem] flex-wrap items-center gap-1">
            {referenced.map((name) => (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => toggleCharacter(name)}
                className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-2xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                title={promptByName.get(name.toLocaleLowerCase()) || "Bấm để bỏ tham chiếu"}
              >
                {name}
              </button>
            ))}
            {unreferenced.length > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setAddingCharacter((open) => !open)}
                className={cn(
                  "flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full border border-dashed text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50",
                  addingCharacter ? "border-primary/40 bg-muted" : "border-border",
                )}
                title="Thêm nhân vật tham chiếu"
              >
                <Plus className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
          {addingCharacter && unreferenced.length > 0 && (
            <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
              {unreferenced.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    toggleCharacter(name);
                    setAddingCharacter(false);
                  }}
                  className="rounded-full border border-border bg-background px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  title={promptByName.get(name.toLocaleLowerCase())}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <div className="text-2xs text-muted-foreground">Cảnh</div>
        <select
          value={shot.sceneRefId || ""}
          disabled={disabled || scenes.length === 0}
          onChange={(event) => updateShotReferences(job.id, shot.index, { sceneRefId: event.target.value })}
          className="h-7 w-full rounded-lg border border-border bg-background px-2 text-2xs disabled:opacity-50"
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
