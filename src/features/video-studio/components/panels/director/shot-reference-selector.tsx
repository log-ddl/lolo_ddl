"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Check, ImageIcon } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { normalizeRefImageIndexes } from "@/features/video-studio/types/script";
import type { SplitScene } from "@/features/video-studio/stores/director-store";

interface ShotReferenceSelectorProps {
  currentSceneId: number;
  scenes: SplitScene[];
  selectedIndexes?: number[];
  onChange: (indexes: number[]) => void;
  disabled?: boolean;
}

function getSceneShotIndex(scene: SplitScene): number {
  return scene.sourceShotIndex || scene.id + 1;
}

function ResolvedImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const resolved = useResolvedImageUrl(src);
  return <img src={resolved || ""} alt={alt} className={className} />;
}

export function ShotReferenceSelector({
  currentSceneId,
  scenes,
  selectedIndexes,
  onChange,
  disabled,
}: ShotReferenceSelectorProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const normalizedSelected = useMemo(() => normalizeRefImageIndexes(selectedIndexes), [selectedIndexes]);
  const availableScenes = useMemo(
    () => scenes.filter((scene) => scene.id !== currentSceneId),
    [scenes, currentSceneId],
  );
  const selectedScenes = useMemo(() => {
    const selectedSet = new Set(normalizedSelected);
    return availableScenes.filter((scene) => selectedSet.has(getSceneShotIndex(scene)));
  }, [availableScenes, normalizedSelected]);
  const firstPreview = selectedScenes.find((scene) => scene.imageDataUrl || scene.imageHttpUrl);
  const previewImage = firstPreview?.imageDataUrl || firstPreview?.imageHttpUrl || "";
  const hasSelection = normalizedSelected.length > 0;

  const toggleScene = (scene: SplitScene) => {
    const shotIndex = getSceneShotIndex(scene);
    const selectedSet = new Set(normalizedSelected);
    if (selectedSet.has(shotIndex)) {
      selectedSet.delete(shotIndex);
    } else {
      selectedSet.add(shotIndex);
    }
    onChange(Array.from(selectedSet).sort((a, b) => a - b));
  };

  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  const triggerText = hasSelection
    ? normalizedSelected.length === 1
      ? `Ref Shot ${String(normalizedSelected[0]).padStart(2, "0")}`
      : t("director.shotReferencesSelected", { count: normalizedSelected.length })
    : t("director.shotReference");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs transition-colors disabled:opacity-50",
            hasSelection
              ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          <ImageIcon className="h-3 w-3" />
          <span className="max-w-[96px] truncate">{triggerText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[560px] p-3" align="start">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">{t("director.selectShotReference")}</p>
          {hasSelection && (
            <Button variant="secondary" size="xs" onClick={handleClear} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80">
              {t("director.clearSelection")}
            </Button>
          )}
        </div>

        {availableScenes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("director.noOtherShots")}</p>
        ) : (
          <div className="flex gap-3">
            <div className="w-[280px] shrink-0">
              <Label className="text-xs text-muted-foreground mb-2 block">{t("director.shotsLabel")}</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                {availableScenes.map((scene) => {
                  const shotIndex = getSceneShotIndex(scene);
                  const isSelected = normalizedSelected.includes(shotIndex);
                  const thumbnail = scene.imageDataUrl || scene.imageHttpUrl;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => toggleScene(scene)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded text-left transition-colors",
                        isSelected ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-muted",
                      )}
                    >
                      {thumbnail ? (
                        <ResolvedImg src={thumbnail} alt={`Shot ${shotIndex}`} className="w-12 h-12 rounded object-contain bg-muted shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <span className="flex-1 min-w-0 text-xs truncate">
                        Shot {String(shotIndex).padStart(2, "0")}
                        {scene.sceneName ? ` · ${scene.sceneName}` : ""}
                      </span>
                      {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-[240px] shrink-0 border-l pl-3">
              <Label className="text-xs text-muted-foreground mb-2 block">Reference preview</Label>
              {previewImage ? (
                <div className="w-full rounded-lg bg-muted flex items-center justify-center min-h-[120px] max-h-[240px] overflow-hidden">
                  <ResolvedImg src={previewImage} alt="Shot reference preview" className="max-w-full max-h-[240px] rounded-lg object-contain" />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">{t("director.selectGeneratedShotHint")}</span>
                </div>
              )}
              {hasSelection && (
                <div className="mt-2 text-xs text-foreground truncate">
                  {normalizedSelected.map((index) => `Shot ${String(index).padStart(2, "0")}`).join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
