"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Check, Layers } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { useResolvedImageUrl } from "@/features/video-studio/hooks/use-resolved-image-url";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";

interface SceneLibrarySelectorProps {
  sceneId: number;
  selectedSceneLibraryId?: string;
  onChange: (sceneLibraryId: string | undefined, referenceImage: string | undefined) => void;
  disabled?: boolean;
}

function ResolvedImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const resolved = useResolvedImageUrl(src);
  return <img src={resolved || ""} alt={alt} className={className} />;
}

export function SceneLibrarySelector({
  sceneId: _sceneId,
  selectedSceneLibraryId,
  onChange,
  disabled,
}: SceneLibrarySelectorProps) {
  void _sceneId;
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const { scenes: libraryScenes } = useSceneStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();

  const visibleScenes = useMemo(() => {
    if (resourceSharing.shareScenes) return libraryScenes;
    if (!activeProjectId) return [];
    return libraryScenes.filter((scene) => scene.projectId === activeProjectId);
  }, [libraryScenes, resourceSharing.shareScenes, activeProjectId]);

  const selectedScene = useMemo(() => {
    if (!selectedSceneLibraryId) return null;
    return visibleScenes.find((scene) => scene.id === selectedSceneLibraryId) || null;
  }, [visibleScenes, selectedSceneLibraryId]);

  const previewRefImage = selectedScene?.referenceImage || selectedScene?.referenceImageBase64 || null;
  const hasSelection = !!selectedSceneLibraryId;

  const handleSelectScene = (sceneLibraryId: string) => {
    const scene = visibleScenes.find((item) => item.id === sceneLibraryId);
    if (!scene) {
      onChange(undefined, undefined);
      return;
    }
    onChange(scene.id, scene.referenceImage || scene.referenceImageBase64);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined, undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded border border-dashed text-xs transition-colors disabled:opacity-50",
            hasSelection
              ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
          )}
        >
          <Layers className="h-3 w-3" />
          <span className="max-w-[80px] truncate">{selectedScene?.name || t("director.sceneReference")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[560px] p-3" align="start">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">{t("director.selectSceneReference")}</p>
          {hasSelection && (
            <Button variant="secondary" size="xs" onClick={handleClear} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80">
              {t("director.clearSelection")}
            </Button>
          )}
        </div>

        {visibleScenes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("director.emptySceneLibrary")}</p>
        ) : (
          <div className="flex gap-3">
            <div className="w-[280px] shrink-0">
              <Label className="text-xs text-muted-foreground mb-2 block">{t("director.scenesLabel")}</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                {visibleScenes.map((scene) => {
                  const isSelected = selectedSceneLibraryId === scene.id;
                  const thumbnail = scene.referenceImage || scene.referenceImageBase64;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => handleSelectScene(scene.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded text-left transition-colors",
                        isSelected ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-muted"
                      )}
                    >
                      {thumbnail ? (
                        <ResolvedImg src={thumbnail} alt={scene.name} className="w-12 h-12 rounded object-contain bg-muted shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                      )}
                      <span className="flex-1 min-w-0 text-xs truncate">{scene.name}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-[240px] shrink-0 border-l pl-3">
              <Label className="text-xs text-muted-foreground mb-2 block">{t("director.referencePreview")}</Label>
              {previewRefImage ? (
                <div className="w-full rounded-lg bg-muted flex items-center justify-center min-h-[120px] max-h-[240px] overflow-hidden">
                  <ResolvedImg src={previewRefImage} alt={t("director.referencePreview")} className="max-w-full max-h-[240px] rounded-lg object-contain" />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">{t("director.selectSceneHint")}</span>
                </div>
              )}
              {selectedScene && <div className="mt-2 text-xs text-foreground truncate">{selectedScene.name}</div>}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
