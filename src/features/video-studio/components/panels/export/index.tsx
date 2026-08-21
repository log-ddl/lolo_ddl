"use client";

/**
 * Export View - Timeline visualization and export
 * Based on CineGen-AI StageExport.tsx
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useActiveScriptProject } from "@/features/video-studio/stores/script-store";
import { useActiveDirectorProject } from "@/features/video-studio/stores/director-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import { useMediaStore } from "@/features/video-studio/stores/media-store";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Progress } from "@/shared/components/ui/progress";
import { LocalImage } from "@/shared/components/ui/local-image";
import { ImagePreviewModal, VideoPreviewModal } from "@/features/video-studio/components/panels/director/media-preview-modal";
import {
  Film,
  Download,
  CheckCircle,
  BarChart3,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Users,
  MapPin,
  Rocket,
  Play,
  Eye,
  Library,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  getDirectorExportStats,
  getExportStats,
  exportSelectedMediaToFolder,
  downloadSelectedMedia,
  type ExportMediaAsset,
  type ExportImageSource,
  type ExportProgress,
} from "@/features/video-studio/lib/script/export-service";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";

interface ExportImageCandidate {
  id: string;
  source: ExportImageSource;
  name: string;
  url?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

function hasExportableMedia(candidate: ExportImageCandidate): boolean {
  return !!(candidate.url || candidate.videoUrl);
}

export function ExportView() {
  const { t } = useI18n();
  const { activeProject } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const directorProject = useActiveDirectorProject();
  const characters = useCharacterLibraryStore((state) => state.characters);
  const scenes = useSceneStore((state) => state.scenes);
  const resourceSharing = useVideoStudioSettingsStore((state) => state.resourceSharing);
  const autopilotJobs = useAutopilotStore((state) => state.jobs);
  const mediaFiles = useMediaStore((state) => state.mediaFiles);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [enabledSources, setEnabledSources] = useState<Record<ExportImageSource, boolean>>({
    director: true,
    character: false,
    scene: false,
    autopilot: true,
    media: false,
  });
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const initializedSelectionRef = useRef(false);

  const shots = scriptProject?.shots || [];
  const splitScenes = directorProject?.splitScenes || [];
  const scriptData = scriptProject?.scriptData;
  const targetDuration = scriptProject?.targetDuration || "60s";
  const projectName = (scriptData?.title || activeProject?.name || t("export.untitledProject")).replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');

  // Progress calculation merges Script shots and Director split-scene status.
  const hasSplitScenes = splitScenes.length > 0;

  const imageCandidates = useMemo<ExportImageCandidate[]>(() => {
    const directorCandidates: ExportImageCandidate[] = hasSplitScenes
      ? splitScenes.map((scene, index) => ({
          id: `director:${scene.id}`,
          source: 'director',
          name: `shot_${String(index + 1).padStart(3, '0')}_${scene.sceneName || `scene_${index + 1}`}`,
          url: scene.imageDataUrl || scene.imageHttpUrl || undefined,
          videoUrl: scene.videoUrl || undefined,
        }))
      : shots.map((shot, index) => {
          const scriptScene = scriptData?.scenes.find((scene) => scene.id === shot.sceneRefId);
          const sceneName = scriptScene?.name || 'shot';
          return {
            id: `director:${shot.id}`,
            source: 'director' as const,
            name: `shot_${String(index + 1).padStart(3, '0')}_${sceneName}`,
            url: shot.imageUrl || shot.keyframes?.find((keyframe) => keyframe.type === 'start')?.imageUrl,
            videoUrl: shot.videoUrl,
          };
        });

    const visibleCharacters = resourceSharing.shareCharacters
      ? characters
      : characters.filter((character) => character.projectId === activeProject?.id);
    const characterCandidates: ExportImageCandidate[] = visibleCharacters.map((character) => ({
      id: `character:${character.id}`,
      source: 'character',
      name: character.name,
      url: character.thumbnailUrl,
    }));

    const visibleScenes = resourceSharing.shareScenes
      ? scenes
      : scenes.filter((scene) => scene.projectId === activeProject?.id);
    const sceneCandidates: ExportImageCandidate[] = visibleScenes.map((scene) => ({
      id: `scene:${scene.id}`,
      source: 'scene',
      name: scene.name,
      url: scene.referenceImage || scene.referenceImageBase64,
    }));

    const visibleAutopilotJobs = autopilotJobs.filter(
      (job) => !job.projectId || job.projectId === activeProject?.id,
    );
    const autopilotCandidates: ExportImageCandidate[] = visibleAutopilotJobs.flatMap((job) => {
      const characterAssets = (job.characterOutputs || [])
        .filter((character) => !!character.imagePath)
        .map((character, index) => ({
          id: `autopilot:${job.id}:character:${index}`,
          source: 'autopilot' as const,
          name: `${job.title}_character_${character.name}`,
          url: character.imagePath,
        }));
      const shotAssets = (job.mediaOutputs || [])
        .filter((shot) => !!(shot.imagePath || shot.videoPath))
        .map((shot) => ({
          id: `autopilot:${job.id}:shot:${shot.index}`,
          source: 'autopilot' as const,
          name: `${job.title}_shot_${String(shot.index).padStart(3, '0')}`,
          url: shot.imagePath || undefined,
          videoUrl: shot.videoPath || undefined,
        }));
      const finalAsset: ExportImageCandidate[] = job.outputVideoPath ? [{
        id: `autopilot:${job.id}:final`,
        source: 'autopilot',
        name: `${job.title}_final`,
        videoUrl: job.outputVideoPath,
      }] : [];
      return [...characterAssets, ...shotAssets, ...finalAsset];
    });

    const visibleMediaFiles = resourceSharing.shareMedia
      ? mediaFiles
      : mediaFiles.filter((file) => file.projectId === activeProject?.id);
    const mediaCandidates: ExportImageCandidate[] = visibleMediaFiles
      .filter((file) => (file.type === 'image' || file.type === 'video') && !!file.url)
      .map((file) => ({
        id: `media:${file.id}`,
        source: 'media' as const,
        name: file.name,
        url: file.type === 'image' ? file.url : undefined,
        videoUrl: file.type === 'video' ? file.url : undefined,
        thumbnailUrl: file.thumbnailUrl,
      }));

    return [...directorCandidates, ...characterCandidates, ...sceneCandidates, ...autopilotCandidates, ...mediaCandidates];
  }, [activeProject?.id, autopilotJobs, characters, hasSplitScenes, mediaFiles, resourceSharing.shareCharacters, resourceSharing.shareMedia, resourceSharing.shareScenes, scenes, scriptData?.scenes, shots, splitScenes]);

  const visibleImageCandidates = useMemo(
    () => imageCandidates.filter((candidate) => enabledSources[candidate.source]),
    [enabledSources, imageCandidates],
  );

  const selectedMediaAssets = useMemo<ExportMediaAsset[]>(
    () => imageCandidates.flatMap((candidate) => {
      if (!selectedAssetIds.has(candidate.id)) return [];

      const assets: ExportMediaAsset[] = [];
      if (candidate.url) {
        assets.push({
          id: `${candidate.id}:image`,
          source: candidate.source,
          type: 'image',
          name: candidate.name,
          url: candidate.url,
        });
      }
      if (candidate.videoUrl) {
        assets.push({
          id: `${candidate.id}:video`,
          source: candidate.source,
          type: 'video',
          name: candidate.name,
          url: candidate.videoUrl,
        });
      }
      return assets;
    }),
    [imageCandidates, selectedAssetIds],
  );

  const selectedItemCount = imageCandidates.filter(
    (candidate) => selectedAssetIds.has(candidate.id) && hasExportableMedia(candidate),
  ).length;
  const selectedImageCount = selectedMediaAssets.filter((asset) => asset.type === 'image').length;
  const selectedVideoCount = selectedMediaAssets.filter((asset) => asset.type === 'video').length;

  useEffect(() => {
    if (initializedSelectionRef.current || imageCandidates.length === 0) return;
    initializedSelectionRef.current = true;
    setSelectedAssetIds(new Set(
      imageCandidates
        .filter((candidate) => (candidate.source === 'director' || candidate.source === 'autopilot') && hasExportableMedia(candidate))
        .map((candidate) => candidate.id)
    ));
  }, [imageCandidates]);

  // Director stats
  const directorStats = hasSplitScenes ? getDirectorExportStats(splitScenes) : null;
  const directorCompleted = directorStats?.videosReady || 0;
  const directorWithImage = directorStats?.imagesReady || 0;

  // Script stats
  const scriptStats = !hasSplitScenes && shots.length > 0 ? getExportStats(shots) : null;
  const scriptCompleted = scriptStats ? scriptStats.imagesReady + scriptStats.videosReady : 0;

  const totalItems = hasSplitScenes ? splitScenes.length : shots.length;
  const completedItems = hasSplitScenes ? directorCompleted : scriptCompleted;
  const imageReadyItems = hasSplitScenes ? directorWithImage : (scriptStats?.imagesReady || 0);
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const canExport = selectedMediaAssets.length > 0;

  // Estimate total duration.
  const estimatedDuration = totalItems * (hasSplitScenes ? 5 : 3);

  const toggleSource = (source: ExportImageSource) => {
    const nextEnabled = !enabledSources[source];
    setEnabledSources((current) => ({ ...current, [source]: nextEnabled }));
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      imageCandidates
        .filter((candidate) => candidate.source === source)
        .forEach((candidate) => {
          if (nextEnabled && hasExportableMedia(candidate)) next.add(candidate.id);
          else next.delete(candidate.id);
        });
      return next;
    });
  };

  const toggleAsset = (candidate: ExportImageCandidate) => {
    if (!hasExportableMedia(candidate)) return;
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.add(candidate.id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      visibleImageCandidates.forEach((candidate) => {
        if (hasExportableMedia(candidate)) next.add(candidate.id);
      });
      return next;
    });
  };

  const clearVisibleSelection = () => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      visibleImageCandidates.forEach((candidate) => next.delete(candidate.id));
      return next;
    });
  };

  // === Export handlers ===
  const handleExportToFolder = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 0, message: t("export.preparingExport") });

    try {
      const success = await exportSelectedMediaToFolder(
        projectName,
        selectedMediaAssets,
        (p) => setExportProgress(p),
      );
      if (success) toast.success(t("export.done"));
    } catch (error) {
      toast.error(t("export.failed", { message: (error as Error).message }));
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [isExporting, projectName, selectedMediaAssets, t]);

  const handleDownloadFiles = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 0, message: t("export.preparingDownload") });

    try {
      await downloadSelectedMedia(
        selectedMediaAssets,
        (p) => setExportProgress(p),
      );
      toast.success(t("export.downloadDone"));
    } catch (error) {
      toast.error(t("export.downloadFailed", { message: (error as Error).message }));
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [isExporting, selectedMediaAssets, t]);

  const sourceOptions = [
    { source: 'director' as const, label: t("export.sourceDirector"), Icon: Film },
    { source: 'character' as const, label: t("export.sourceCharacters"), Icon: Users },
    { source: 'scene' as const, label: t("export.sourceScenes"), Icon: MapPin },
    { source: 'autopilot' as const, label: t("export.sourceAutopilot"), Icon: Rocket },
    { source: 'media' as const, label: t("export.sourceMedia"), Icon: Library },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-panel/70 px-5">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Film className="size-4 text-primary" />
            {t("export.stageTitle")}
            <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              {t("export.stageSubtitle")}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-border/60 bg-muted px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
            {t("export.status", { value: progress === 100 ? t("export.statusReady") : t("export.statusInProgress") })}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 md:p-12">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="order-2 bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{t("export.chooseImages")}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t("export.chooseImagesDesc")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={visibleImageCandidates.every((candidate) => !hasExportableMedia(candidate))}>
                    {t("export.selectAllImages")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearVisibleSelection}>
                    {t("export.clearImages")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {sourceOptions.map(({ source, label, Icon }) => {
                  const sourceItems = imageCandidates.filter((candidate) => candidate.source === source);
                  const readyCount = sourceItems.filter(hasExportableMedia).length;
                  return (
                    <Button
                      key={source}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-auto min-h-16 justify-start gap-3 px-4 py-3",
                        enabledSources[source] && "border-primary bg-primary/10 text-primary hover:bg-primary/15",
                      )}
                      onClick={() => toggleSource(source)}
                    >
                      <Checkbox checked={enabledSources[source]} className="pointer-events-none" />
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-medium truncate">{label}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {t("export.readyImages", { ready: readyCount, total: sourceItems.length })}
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>

              {visibleImageCandidates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {visibleImageCandidates.map((candidate) => {
                    const isSelected = selectedAssetIds.has(candidate.id);
                    const hasMedia = hasExportableMedia(candidate);
                    return (
                      <div
                        key={candidate.id}
                        className={cn(
                          "rounded-lg border overflow-hidden text-left transition-all",
                          hasMedia ? "hover:border-primary/60" : "opacity-60 cursor-not-allowed",
                          isSelected && "border-primary ring-1 ring-primary",
                        )}
                      >
                        <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                          {candidate.url || candidate.thumbnailUrl ? (
                            <LocalImage src={candidate.url || candidate.thumbnailUrl!} alt={candidate.name} className="h-full w-full object-contain" />
                          ) : candidate.videoUrl ? (
                            <div className="flex flex-col items-center gap-2 text-primary">
                              <Film className="h-7 w-7" />
                              <span className="text-[10px]">{t("export.videoOnly")}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <ImageIcon className="h-7 w-7" />
                              <span className="text-[10px]">{t("export.noImage")}</span>
                            </div>
                          )}
                          {hasMedia && (
                            <button type="button" onClick={() => toggleAsset(candidate)} className="absolute top-2 right-2 rounded bg-background/85 p-1" title={isSelected ? t("export.clearImages") : t("export.selectAllImages")}>
                              <Checkbox checked={isSelected} className="pointer-events-none" />
                            </button>
                          )}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1">
                            {candidate.url && (
                              <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-[10px] shadow" onClick={() => setPreview({ type: 'image', url: candidate.url! })}>
                                <Eye className="mr-1 h-3 w-3" />{t("autopilot.panel.previewImage")}
                              </Button>
                            )}
                            {candidate.videoUrl && (
                              <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-[10px] shadow" onClick={() => setPreview({ type: 'video', url: candidate.videoUrl! })}>
                                <Play className="mr-1 h-3 w-3" />{t("autopilot.panel.previewVideo")}
                              </Button>
                            )}
                          </div>
                        </div>
                        <button type="button" disabled={!hasMedia} onClick={() => toggleAsset(candidate)} className="block w-full p-2 text-left disabled:cursor-not-allowed">
                          <p className="text-xs font-medium truncate" title={candidate.name}>{candidate.name}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] text-muted-foreground">{t(`export.source.${candidate.source}`)}</p>
                            {candidate.videoUrl && (
                              <span className="text-[10px] font-medium text-primary">{t("export.videoIncluded")}</span>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {t("export.noSourceSelected")}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {t("export.selectedMedia", { items: selectedItemCount, images: selectedImageCount, videos: selectedVideoCount })}
              </div>
            </div>

            {/* Main Status Panel */}
            <div className="order-1 bg-card border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 p-48 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-32 bg-green-500/5 blur-[100px] rounded-full pointer-events-none" />

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 relative z-10 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      {scriptData?.title || activeProject?.name || t("export.untitledProject")}
                    </h3>
                    <span className="px-2 py-0.5 bg-muted border border-border text-muted-foreground text-[10px] rounded uppercase font-mono tracking-wider">
                      {t("export.masterSequence")}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">
                         {hasSplitScenes ? t("export.splitScenes") : t("export.shotsLabel")}
                      </span>
                      <span className="text-sm font-mono text-foreground/80">{totalItems}</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">
                         {t("export.estDuration")}
                      </span>
                      <span className="text-sm font-mono text-foreground/80">~{estimatedDuration}s</span>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">
                         {t("export.target")}
                      </span>
                      <span className="text-sm font-mono text-foreground/80">{targetDuration}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right bg-muted/50 p-4 rounded-lg border border-border backdrop-blur-sm min-w-[160px]">
                  <div className="flex items-baseline justify-end gap-1 mb-1">
                    <span className="text-3xl font-mono font-bold text-primary">{progress}</span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center justify-end gap-2">
                    {progress === 100 ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <BarChart3 className="w-3 h-3" />
                    )}
                    {t("export.renderStatus")}
                  </div>
                </div>
              </div>

              {/* Timeline Visualizer Strip */}
              <div className="mb-10">
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2 px-1">
                  <span>{t("export.sequenceMap")}{hasSplitScenes ? ` (${t("export.director")})` : ''}</span>
                  <span>TC 00:00:00:00</span>
                </div>
                <div className="h-20 bg-muted/30 rounded-lg border border-border flex items-center px-2 gap-1 overflow-x-auto relative shadow-inner">
                  {totalItems === 0 ? (
                    <div className="w-full flex items-center justify-center text-muted-foreground/50 text-xs font-mono uppercase tracking-widest">
                      <Film className="w-4 h-4 mr-2" />
                      {t("export.noShots")}
                    </div>
                  ) : hasSplitScenes ? (
                    splitScenes.map((scene, idx) => {
                      const hasImage = scene.imageStatus === 'completed' && !!scene.imageDataUrl;
                      const hasVideo = scene.videoStatus === 'completed' && !!scene.videoUrl;
                      return (
                        <div
                          key={scene.id}
                          className={cn(
                            "h-14 min-w-[4px] flex-1 rounded-[2px] transition-all relative group flex flex-col justify-end overflow-hidden",
                            hasVideo
                              ? "bg-green-500/40 border border-green-500/30 hover:bg-green-500/50"
                              : hasImage
                              ? "bg-primary/40 border border-primary/30 hover:bg-primary/50"
                              : "bg-muted border border-border hover:bg-muted/80"
                          )}
                          title={t("export.sceneTitle", { index: idx + 1, name: scene.sceneName || scene.imagePrompt || '' })}
                        >
                          {hasVideo && <div className="h-full w-full bg-green-500/20" />}
                          {hasImage && !hasVideo && <div className="h-full w-full bg-primary/20" />}
                          
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap">
                            <div className="bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border border-border shadow-xl">
                              {t("export.sceneStatus", { index: idx + 1, suffix: hasVideo ? t("export.videoBadge") : hasImage ? t("export.imageBadge") : '' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    shots.map((shot, idx) => {
                      const isDone = !!shot.imageUrl || !!shot.videoUrl;
                      return (
                        <div
                          key={shot.id}
                          className={cn(
                            "h-14 min-w-[4px] flex-1 rounded-[2px] transition-all relative group flex flex-col justify-end overflow-hidden",
                            isDone
                              ? "bg-primary/40 border border-primary/30 hover:bg-primary/50"
                              : "bg-muted border border-border hover:bg-muted/80"
                          )}
                          title={t("export.shotTitle", { index: idx + 1, name: shot.imagePrompt || shot.videoPrompt || '' })}
                        >
                          {isDone && <div className="h-full w-full bg-primary/20" />}
                          
                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 whitespace-nowrap">
                            <div className="bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border border-border shadow-xl">
                              {t("export.shotStatus", { index: idx + 1 })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {/* Image/video status summary */}
                {hasSplitScenes && (
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                    <span>{t("export.imagesCount", { ready: imageReadyItems, total: totalItems })}</span>
                    <span>{t("export.videosCount", { ready: completedItems, total: totalItems })}</span>
                  </div>
                )}
              </div>

              {/* Export Progress */}
              {exportProgress && (
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{exportProgress.message}</span>
                    {exportProgress.total > 0 && (
                      <span>{exportProgress.current}/{exportProgress.total}</span>
                    )}
                  </div>
                  <Progress
                    value={exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  disabled={!canExport || isExporting}
                  onClick={handleExportToFolder}
                  className={cn(
                    "h-12 font-bold text-xs uppercase tracking-widest transition-all",
                    canExport && !isExporting
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isExporting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("export.exporting")}</>
                  ) : (
                    <><FolderOpen className="w-4 h-4 mr-2" />{t("export.selectFolder")}</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  disabled={!canExport || isExporting}
                  onClick={handleDownloadFiles}
                  className="h-12 font-bold text-xs uppercase tracking-widest"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("export.downloadIndividually")}
                </Button>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                {t("export.selectedMedia", { items: selectedItemCount, images: selectedImageCount, videos: selectedVideoCount })}
              </div>
            </div>

          </div>
        </div>
      </ScrollArea>
      <ImagePreviewModal imageUrl={preview?.type === 'image' ? preview.url : ''} isOpen={preview?.type === 'image'} onClose={() => setPreview(null)} onImageCleaned={(cleanedUrl) => setPreview({ type: 'image', url: cleanedUrl })} />
      <VideoPreviewModal videoUrl={preview?.type === 'video' ? preview.url : ''} isOpen={preview?.type === 'video'} onClose={() => setPreview(null)} />
    </div>
  );
}
