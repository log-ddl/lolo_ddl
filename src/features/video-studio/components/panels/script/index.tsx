"use client";

/**
 * Script View
 * Script panel in a three-column layout.
 * Left: script input (import / authoring).
 * Center: hierarchy (episode -> scene -> shot).
 * Right: property panel and navigation actions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  useScriptStore,
  useActiveScriptProject,
  type ScriptCalibrationStatus,
  type ScriptStructureStatus,
} from "@/features/video-studio/stores/script-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { useAPIConfigStore } from "@/features/video-studio/stores/api-config-store";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/features/video-studio/lib/ai/feature-router";
import { isCliProvider } from "@/features/video-studio/lib/cli-runtime";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useSceneStore } from "@/features/video-studio/stores/scene-store";
import { VIDEO_STUDIO_FEATURE_FLAGS, useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { 
  importScriptWithSkill,
  importSingleEpisodeContent,
  generateEpisodeShots, 
  getMissingTitleEpisodes,
} from "@/features/video-studio/lib/script/full-script-service";

import { ScriptInput } from "./script-input";
import { EpisodeTree } from "./episode-tree";
import { PropertyPanel } from "./property-panel";
import { Download, FileText, ListChecks, WandSparkles } from "lucide-react";
import { hasPlanAccess } from "@/shared/lib/license-client";
import { useLicenseStore } from "@/shared/stores/license-store";
import { toast } from "sonner";
import { DEFAULT_STYLE_ID } from "@/features/video-studio/lib/constants/visual-styles";
import { cleanVoiceOverText, splitVideoPromptVoiceOver } from "@/features/video-studio/lib/script/voice-over";
import { useI18n } from "@/shared/i18n";
import { setProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/shared/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { TaskInfoButton } from "@/shared/task-metadata";
import { useLibraryNavigation } from "./use-library-navigation";
import { useScriptExport } from "./use-script-export";

function isImportCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /cancelled|canceled|aborted|abort/i.test(error.message) || error.name === 'AbortError';
}

function getShotPromptVoiceFields(shot: { videoPrompt?: string; voiceOver?: string }) {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  return {
    videoPrompt: parts.videoPrompt,
    voiceOver: cleanVoiceOverText(shot.voiceOver) || parts.voiceOver,
  };
}

export function ScriptView() {
  const { t, language: uiLanguage } = useI18n();
  const { activeProjectId, activeProject } = useProjectStore();
  const scriptProject = useActiveScriptProject();
  const {
    setActiveProjectId,
    ensureProject,
    setRawScript,
    setScriptData,
    setEpisodeRawScripts,
    // Bundle operations (keep episodeRawScripts in sync)
    updateEpisodeBundle,
    deleteEpisodeBundle,
    addScene,
    updateScene,
    deleteScene,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    updateShot,
    deleteShot,
    updateEpisodeRawScript,
    setCalibrationState: setScriptCalibrationState,
  } = useScriptStore();

  const { checkChatKeys, isFeatureConfigured } = useAPIConfigStore();
  const { 
    characters: allCharacters, 
    selectCharacter: selectLibraryCharacter,
    addCharacter: addLibraryCharacter,
    setCurrentFolder: setCharacterLibraryFolder,
  } = useCharacterLibraryStore();
  const {
    addScene: addLibraryScene,
    selectScene: selectLibraryScene,
    setCurrentFolder: setSceneLibraryFolder,
    scenes: sceneLibraryItems,
  } = useSceneStore();
  const { setActiveTab, goToDirectorWithData, goToSceneWithData, activeEpisodeIndex, enterEpisode } = useMediaPanelStore();

  // Selection state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<
    "character" | "scene" | "shot" | "episode" | null
  >(null);
  const [cliStreamTitle] = useState<string | null>(null);
  const [cliStreamOutput] = useState("");
  const [showProcessLog, setShowProcessLog] = useState(false);
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const importAbortControllerRef = useRef<AbortController | null>(null);

  const appendProcessLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setProcessLogs((current) => [...current.slice(-99), `[${time}] ${message}`]);
  }, []);

  useEffect(() => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  }, [activeProjectId]);
  
  // Full-script import state
  const [importError, setImportError] = useState<string | undefined>();

  // AI calibration state
  const calibrationState = scriptProject?.calibrationState;
  const calibrationStatus = calibrationState?.titleCalibrationStatus || 'idle';
  const [, setMissingTitleCount] = useState(0);

  // Persist import state to the store so it survives panel switches.
  const importStatus = calibrationState?.importStatus || 'idle';
  const setImportStatus = useCallback((status: 'idle' | 'importing' | 'ready' | 'error') => {
    if (!activeProjectId) return;
    setScriptCalibrationState(activeProjectId, { importStatus: status });
  }, [activeProjectId, setScriptCalibrationState]);

  const handleCancelImport = useCallback(() => {
    const controller = importAbortControllerRef.current;
    if (!controller || controller.signal.aborted) return;
    appendProcessLog('Đã gửi yêu cầu dừng import đang chạy');
    controller.abort();
  }, [appendProcessLog]);

  // Single-episode structure-completion state
  const structureCompletionStatus = calibrationState?.structureCompletionStatus || 'idle';
  const [structureOverwriteConfirmOpen, setStructureOverwriteConfirmOpen] = useState(false);
  const prevEpisodeRef = useRef<{ index: number | null; rawLen: number }>({ index: null, rawLen: 0 });

  // Sync activeProjectId from project-store to script-store
  useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
      ensureProject(activeProjectId);
    }
  }, [activeProjectId, setActiveProjectId, ensureProject]);

  // Reset transient "in progress" states to idle when the panel remounts to avoid fake loading UI.
  useEffect(() => {
    if (!activeProjectId) return;
    const state = useScriptStore.getState().projects[activeProjectId]?.calibrationState;
    if (!state) return;
    const fixes: Record<string, string> = {};
    if (state.importStatus === 'importing') fixes.importStatus = 'idle';
    if (Object.keys(fixes).length > 0) {
      setScriptCalibrationState(activeProjectId, fixes as never);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // Keep last stable project id during transient null windows (e.g. duplicate flow)
  // to avoid creating phantom project keys like "default".
  const stableProjectIdRef = useRef<string>("default-project");
  useEffect(() => {
    if (activeProjectId) {
      stableProjectIdRef.current = activeProjectId;
    }
  }, [activeProjectId]);

  const projectId = activeProjectId || stableProjectIdRef.current;

  const setCalibrationStatus = useCallback((status: ScriptCalibrationStatus) => {
    setScriptCalibrationState(projectId, { titleCalibrationStatus: status });
  }, [projectId, setScriptCalibrationState]);

  const setStructureCompletionStatus = useCallback((status: ScriptStructureStatus) => {
    setScriptCalibrationState(projectId, { structureCompletionStatus: status });
  }, [projectId, setScriptCalibrationState]);

  // Local state fallbacks
  const rawScript = scriptProject?.rawScript || "";
  const targetDuration = scriptProject?.targetDuration || "60s";
  const styleId = scriptProject?.styleId || DEFAULT_STYLE_ID;
  const scriptData = scriptProject?.scriptData || null;
  const parseStatus = scriptProject?.parseStatus || "idle";
  const parseError = scriptProject?.parseError;
  const shots = scriptProject?.shots || [];
  const promptLanguage = 'en' as const;

  // Current episode scope: map activeEpisodeIndex to episodeId
  const activeEpisodeId = activeEpisodeIndex != null
    ? scriptData?.episodes.find(ep => ep.index === activeEpisodeIndex)?.id ?? undefined
    : undefined;

  // Auto-focus the corresponding episode when entering episode scope
  useEffect(() => {
    if (activeEpisodeIndex != null && scriptData?.episodes) {
      const ep = scriptData.episodes.find(e => e.index === activeEpisodeIndex);
      if (ep) {
        setSelectedItemId(`episode_${activeEpisodeIndex}`);
        setSelectedItemType("episode");
      }
    }
  }, [activeEpisodeIndex, scriptData?.episodes]);

  // Prefer the new service-mapping configuration first
  const chatConfigured = isFeatureConfigured('script_analysis') || checkChatKeys().isAllConfigured;
  const episodeRawScripts = scriptProject?.episodeRawScripts || [];

  // Migrate the old Prompt Import placeholder titles already persisted in
  // existing projects so they do not reappear in Script, Director, or exports.
  useEffect(() => {
    if (!scriptData) return;
    const isLegacyPromptTitle = (title?: string) => /^Imported Prompts(?:\s+\d+)?$/i.test(title || "");
    const hasLegacyTitle = isLegacyPromptTitle(scriptData.title)
      || scriptData.episodes.some((episode) => isLegacyPromptTitle(episode.title))
      || episodeRawScripts.some((episode) => isLegacyPromptTitle(episode.title));
    if (!hasLegacyTitle) return;

    setScriptData(projectId, {
      ...scriptData,
      title: isLegacyPromptTitle(scriptData.title) ? (activeProject?.name || "") : scriptData.title,
      episodes: scriptData.episodes.map((episode) => ({
        ...episode,
        title: isLegacyPromptTitle(episode.title)
          ? t("overview.episode", { index: episode.index })
          : episode.title,
      })),
    });
    setEpisodeRawScripts(projectId, episodeRawScripts.map((episode) => ({
      ...episode,
      title: isLegacyPromptTitle(episode.title)
        ? t("overview.episode", { index: episode.episodeIndex })
        : episode.title,
    })));
  }, [activeProject?.name, episodeRawScripts, projectId, scriptData, setEpisodeRawScripts, setScriptData, t]);

  // In episode scope show that episode's raw content; in global view show the full rawScript.
  const effectiveRawScript = activeEpisodeIndex != null
    ? episodeRawScripts.find(ep => ep.episodeIndex === activeEpisodeIndex)?.rawContent ?? ""
    : rawScript;
  
  // === Single-episode structure completion: auto-trigger when rawContent goes from empty to non-empty ===
  const handleStructureCompletion = useCallback(async () => {
    if (activeEpisodeIndex == null || !scriptData) return;
    appendProcessLog(`Bắt đầu hoàn thiện cấu trúc tập ${activeEpisodeIndex}`);
    setStructureCompletionStatus('processing');
    try {
      const result = await importSingleEpisodeContent(
        effectiveRawScript,
        activeEpisodeIndex,
        projectId,
        appendProcessLog,
      );
      if (result.success) {
        setStructureCompletionStatus('completed');
        appendProcessLog(`Hoàn thiện cấu trúc xong: ${result.sceneCount} cảnh`);
        if (result.sceneCount > 0) {
          toast.success(t("scriptView.structureComplete", { count: result.sceneCount }));
        }
      } else {
        setStructureCompletionStatus('error');
        appendProcessLog(`Lỗi hoàn thiện cấu trúc: ${result.error || t("scriptView.structureCompleteFailed")}`);
        toast.error(result.error || t("scriptView.structureCompleteFailed"));
      }
    } catch (e) {
      setStructureCompletionStatus('error');
      appendProcessLog(`Lỗi hoàn thiện cấu trúc: ${(e as Error).message || String(e)}`);
      console.error('[handleStructureCompletion]', e);
    }
    // Reset to idle after 3 seconds so it can be triggered again.
    setTimeout(() => setStructureCompletionStatus('idle'), 3000);
  }, [activeEpisodeIndex, effectiveRawScript, projectId, scriptData, appendProcessLog, t]);

  useEffect(() => {
    const prev = prevEpisodeRef.current;
    const currentLen = effectiveRawScript.length;

    // Episode switch: only update the ref
    if (prev.index !== (activeEpisodeIndex ?? null)) {
      prevEpisodeRef.current = { index: activeEpisodeIndex ?? null, rawLen: currentLen };
      return;
    }

    prevEpisodeRef.current = { index: activeEpisodeIndex ?? null, rawLen: currentLen };

    // Only trigger in episode scope while idle.
    if (activeEpisodeIndex == null) return;
    if (structureCompletionStatus !== 'idle') return;

    // Detect a large paste event when short content suddenly becomes much longer.
    if (prev.rawLen < 20 && currentLen > 50) {
      const ep = scriptData?.episodes?.find(e => e.index === activeEpisodeIndex);
      const hasScenes = ep && ep.sceneIds.length > 0;

      if (hasScenes) {
        setStructureOverwriteConfirmOpen(true);
      } else {
        handleStructureCompletion();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRawScript, activeEpisodeIndex, structureCompletionStatus]);

  // Compute per-episode shot-generation status
  const episodeGenerationStatus = episodeRawScripts.reduce((acc, ep) => {
    acc[ep.episodeIndex] = ep.shotGenerationStatus;
    return acc;
  }, {} as Record<number, 'idle' | 'generating' | 'completed' | 'error'>);

  // Handle selection
  const handleSelectItem = useCallback(
    (id: string, type: "character" | "scene" | "shot" | "episode") => {
      setSelectedItemId(id);
      setSelectedItemType(type);

      // Enter episode scope when an episode is selected.
      if (type === "episode" && id.startsWith("episode_")) {
        const epIndex = parseInt(id.replace("episode_", ""), 10);
        if (!Number.isNaN(epIndex)) {
          enterEpisode(epIndex, projectId);
        }
      }
    },
    [enterEpisode, projectId]
  );

  // Get selected data
  const selectedCharacter =
    selectedItemType === "character"
      ? scriptData?.characters.find((c) => c.id === selectedItemId)
      : undefined;
  const selectedScene =
    selectedItemType === "scene"
      ? scriptData?.scenes.find((s) => s.id === selectedItemId)
      : undefined;
  const selectedShot =
    selectedItemType === "shot"
      ? shots.find((s) => s.id === selectedItemId)
      : undefined;
  
  // Get selected episode data (including synopsis)
  const selectedEpisode = selectedItemType === "episode" && selectedItemId
    ? (() => {
        const epIndex = parseInt(selectedItemId.replace('episode_', ''));
        const rawScript = episodeRawScripts.find(ep => ep.episodeIndex === epIndex);
        const epData = scriptData?.episodes.find(ep => ep.index === epIndex);
        return rawScript && epData ? { ...epData, ...rawScript } : undefined;
      })()
    : undefined;
  
  // Get all shots for the selected scene (used for multi-view analysis)
  const selectedSceneShots = selectedItemType === "scene" && selectedItemId
    ? shots.filter(s => s.sceneRefId === selectedItemId || s.sceneId === selectedItemId)
    : undefined;
  
  // Get all shots for the selected episode (shots already carry episodeId)
  const selectedEpisodeShots = selectedItemType === "episode" && selectedEpisode
    ? shots.filter(shot => (shot as any).episodeId === selectedEpisode.id)
    : [];

  // Generate shots for a single episode.
  const handleGenerateEpisodeShots = useCallback(async (episodeIndex: number) => {
    // Get API configuration through the feature router
    const featureConfig = getFeatureConfig('script_analysis');
    
    console.log('[handleGenerateEpisodeShots] featureConfig:', featureConfig ? 'configured' : 'not configured');
    console.log('[handleGenerateEpisodeShots] allApiKeys:', featureConfig?.allApiKeys?.length || 0);
    
    if (!featureConfig) {
      toast.warning(t("scriptView.zhipuMissingSkipViewAnalysis"));
    }
    
    try {
      appendProcessLog(`Bắt đầu chia shot tập ${episodeIndex}`);
      toast.info(t("scriptView.generatingEpisodeShots", { index: episodeIndex }));

      const apiKey = featureConfig?.allApiKeys?.join(',') || '';
      // Use the configured provider instead of hardcoding one.
      const provider = (featureConfig?.platform || 'openai') as string;
      
      console.log('[handleGenerateEpisodeShots] apiKey length:', apiKey.length);
      console.log('[handleGenerateEpisodeShots] provider:', provider, '(from config:', featureConfig?.platform, ')');
      
      const options = {
        apiKey,
        provider,
        baseUrl: featureConfig?.baseUrl,
        styleId,
        targetDuration,
        promptLanguage,
      };
      
      const result = await generateEpisodeShots(
        episodeIndex,
        projectId,
        options,
        (msg) => {
          console.log(`[ScriptView] ${msg}`);
          appendProcessLog(msg);
        }
      );

      appendProcessLog(`Chia shot tập ${episodeIndex} xong: ${result.shots.length} shot`);
      toast.success(t("scriptView.episodeShotsDone", { index: episodeIndex, count: result.shots.length }));
      return result;
    } catch (error) {
      const err = error as Error;
      console.error("[ScriptView] Episode shot generation failed:", err);
      appendProcessLog(`Lỗi chia shot tập ${episodeIndex}: ${err.message}`);
      toast.error(t("scriptView.shotGenerationFailed", { message: err.message }));
      return { shots: [] };
    }
  }, [projectId, styleId, targetDuration, appendProcessLog, t]);

  const handleImportWithSkill = useCallback(async (text: string, skillText: string) => {
    if (!text.trim() || !skillText.trim()) {
      toast.error("Please provide both script text and a skill.");
      return;
    }
    
    const featureConfig = getFeatureConfig('script_analysis') || getFeatureConfig('chat');
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage('script_analysis'));
      return;
    }
    const controller = new AbortController();
    importAbortControllerRef.current?.abort();
    importAbortControllerRef.current = controller;

    setImportStatus('importing');
    setImportError(undefined);
    setCalibrationStatus('calibrating');
    appendProcessLog(`Bắt đầu nhập kịch bản bằng skill: ${text.trim().length} ký tự`);

    try {
      const result = await importScriptWithSkill(text, skillText, projectId, { styleId, onProgress: appendProcessLog, signal: controller.signal });
      if (controller.signal.aborted) {
        throw new Error('Cancelled by user');
      }
      if (!result.success) {
        throw new Error(result.error || "Skill import failed");
      }

      setImportStatus('ready');
      const importedShots = useScriptStore.getState().projects[projectId]?.shots || [];
      setCalibrationStatus('completed');
      appendProcessLog(`Nhập bằng skill xong: ${result.episodes.length} tập, ${result.scriptData?.scenes.length || 0} cảnh, ${importedShots.length} shot`);
      toast.success(`Skill import complete: ${result.episodes.length} episode(s), ${result.scriptData?.scenes.length || 0} scene(s), ${importedShots.length} shot(s)`);
    } catch (error) {
      const err = error as Error;
      if (isImportCancelled(err)) {
        console.warn("[ScriptView] Skill import cancelled:", err);
        setImportStatus('idle');
        setCalibrationStatus('idle');
        setImportError(undefined);
        appendProcessLog('Đã dừng nhập bằng skill');
        toast.info('Đã dừng nhập bằng skill');
        return;
      }
      console.error("[ScriptView] Skill import failed:", err);
      setImportStatus('error');
      setCalibrationStatus('error');
      setImportError(err.message);
      appendProcessLog(`Lỗi nhập bằng skill: ${err.message}`);
      toast.error(t("scriptView.parseFailed", { message: err.message }));
    } finally {
      if (importAbortControllerRef.current === controller) {
        importAbortControllerRef.current = null;
      }
    }
  }, [projectId, styleId, t, appendProcessLog]);

  // Compute the number of episodes missing titles.
  useEffect(() => {
    if (importStatus === 'ready' && projectId) {
      const missingTitles = getMissingTitleEpisodes(projectId);
      setMissingTitleCount(missingTitles.length);
    }
  }, [importStatus, projectId, episodeRawScripts]);


  const {
    sceneImportOpen,
    setSceneImportOpen,
    selectedSceneImportIds,
    setSelectedSceneImportIds,
    handleGoToCharacterLibrary,
    handleOpenCharactersPanel,
    handleGoToSceneLibrary,
    openSceneImport,
    handleImportScenes,
    handleGoToDirector,
    handleGoToDirectorFromScene,
  } = useLibraryNavigation({
    projectId,
    scriptData,
    shots,
    styleId,
    activeEpisodeIndex,
    activeEpisodeId,
    allCharacters,
    sceneLibraryItems,
    uiLanguage,
    setActiveTab,
    selectLibraryCharacter,
    selectLibraryScene,
    addLibraryCharacter,
    addLibraryScene,
    setCharacterLibraryFolder,
    setSceneLibraryFolder,
    updateCharacter,
    updateScene,
    goToSceneWithData,
    goToDirectorWithData,
    getShotPromptVoiceFields,
    t,
  });

  // CRUD handlers, wrapped with projectId.
  // Episode operations use the bundle version so episodeRawScripts stay in sync.
  const handleUpdateEpisodeBundle = useCallback((episodeIndex: number, updates: { title?: string; synopsis?: string }) => {
    updateEpisodeBundle(projectId, episodeIndex, updates);
  }, [projectId, updateEpisodeBundle]);

  const handleDeleteEpisodeBundle = useCallback((episodeIndex: number) => {
    deleteEpisodeBundle(projectId, episodeIndex);
    // Clear the selection if the deleted episode was currently selected.
    const ep = scriptData?.episodes?.find(e => e.index === episodeIndex);
    if (ep && selectedItemId === ep.id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteEpisodeBundle, scriptData?.episodes, selectedItemId]);

  const handleAddScene = useCallback((scene: import("@/features/video-studio/types/script").ScriptScene, episodeId?: string) => {
    addScene(projectId, scene, episodeId);
  }, [projectId, addScene]);

  const handleUpdateScene = useCallback((id: string, updates: Partial<import("@/features/video-studio/types/script").ScriptScene>) => {
    updateScene(projectId, id, updates);
  }, [projectId, updateScene]);

  const handleDeleteScene = useCallback((id: string) => {
    deleteScene(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteScene, selectedItemId]);

  const handleAddCharacter = useCallback((character: import("@/features/video-studio/types/script").ScriptCharacter) => {
    addCharacter(projectId, character);
  }, [projectId, addCharacter]);

  const handleUpdateCharacter = useCallback((id: string, updates: Partial<import("@/features/video-studio/types/script").ScriptCharacter>) => {
    updateCharacter(projectId, id, updates);
  }, [projectId, updateCharacter]);

  const handleDeleteCharacter = useCallback((id: string) => {
    deleteCharacter(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteCharacter, selectedItemId]);

  const handleUpdateShot = useCallback((id: string, updates: Partial<import("@/features/video-studio/types/script").Shot>) => {
    updateShot(projectId, id, updates);
  }, [projectId, updateShot]);

  const handleDeleteShot = useCallback((id: string) => {
    deleteShot(projectId, id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  }, [projectId, deleteShot, selectedItemId]);

  // Trailer generation
  const scriptAnalysisConfig = getFeatureConfig('script_analysis');
  const activeScriptRuntimeLabel = scriptAnalysisConfig
    ? isCliProvider(scriptAnalysisConfig.platform)
      ? scriptAnalysisConfig.provider.name
      : scriptAnalysisConfig.provider.name || scriptAnalysisConfig.platform
    : null;
  const usingCliForScriptAnalysis = Boolean(scriptAnalysisConfig && isCliProvider(scriptAnalysisConfig.platform));

  const licensePlan = useLicenseStore((s) => s.plan);
  const { handleExportPromptCsv, handleSendToAutoVideo } = useScriptExport({
    shots,
    scriptData,
    setActiveTab,
    appendProcessLog,
    getShotPromptVoiceFields,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 pb-2 bg-panel border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("scriptView.title")}
            </h2>
            {activeScriptRuntimeLabel && (
              <span className={`text-[10px] px-2 py-1 rounded-full border ${usingCliForScriptAnalysis ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                {usingCliForScriptAnalysis ? `CLI: ${activeScriptRuntimeLabel}` : `API: ${activeScriptRuntimeLabel}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TaskInfoButton kind="script" latest title={t("taskInfo.scriptLatest")} />
            <span className="text-xs text-muted-foreground">
              {parseStatus === "parsing"
                ? t("scriptView.statusParsing")
                : scriptProject?.shotStatus === "generating"
                ? t("scriptView.statusGeneratingShots")
                : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleExportPromptCsv}
              disabled={shots.length === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              {t("scriptView.exportCsv")}
            </Button>
            {VIDEO_STUDIO_FEATURE_FLAGS.autoVideoVisible && hasPlanAccess(licensePlan, 'dev') && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleSendToAutoVideo}
                disabled={shots.length === 0}
                title="Gửi voiceOver sang Auto Video"
              >
                <WandSparkles className="h-3 w-3 mr-1" />
                Gửi Auto Video
              </Button>
            )}
            <Button
              variant={showProcessLog ? "secondary" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowProcessLog((open) => !open)}
              title="Hiển thị log xử lý kịch bản"
            >
              <ListChecks className="h-3 w-3 mr-1" />
              Log
            </Button>
          </div>
        </div>
        {showProcessLog && (
          <div className="mt-2 rounded-md border bg-muted/30 p-2 text-xs">
            <div className="mb-1 flex items-center justify-between text-muted-foreground">
              <span>Log xử lý kịch bản</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setProcessLogs([])}>
                Xóa
              </Button>
            </div>
            <ScrollArea className="h-28">
              <pre className="whitespace-pre-wrap font-mono leading-5">
                {processLogs.length > 0 ? processLogs.join("\n") : "Chưa có log."}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Three-column layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left column: script input */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <ScriptInput
            rawScript={effectiveRawScript}
            styleId={styleId}
            parseStatus={parseStatus}
            parseError={parseError}
            chatConfigured={chatConfigured}
            onRawScriptChange={activeEpisodeIndex != null
              ? (v) => updateEpisodeRawScript(projectId, activeEpisodeIndex, { rawContent: v })
              : (v) => setRawScript(projectId, v)}
            onStyleChange={(v) => { setProjectVisualStyleId(v); }}
            onImportWithSkill={handleImportWithSkill}
            onCancelImport={handleCancelImport}
            importStatus={importStatus}
            importError={importError}
            calibrationStatus={calibrationStatus}
            cliStreamTitle={cliStreamTitle}
            cliStreamOutput={cliStreamOutput}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Middle column: hierarchy */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <EpisodeTree
            scriptData={scriptData}
            shots={shots}
            shotStatus={scriptProject?.shotStatus}
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            onSelectItem={handleSelectItem}
            onUpdateEpisodeBundle={handleUpdateEpisodeBundle}
            onDeleteEpisodeBundle={handleDeleteEpisodeBundle}
            onAddScene={handleAddScene}
            onUpdateScene={handleUpdateScene}
            onDeleteScene={handleDeleteScene}
            onAddCharacter={handleAddCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onDeleteShot={handleDeleteShot}
            onGenerateEpisodeShots={handleGenerateEpisodeShots}
            episodeGenerationStatus={episodeGenerationStatus}
            onImportCharacters={handleOpenCharactersPanel}
            onImportScenes={openSceneImport}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Right column: properties panel */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <PropertyPanel
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            character={selectedCharacter}
            scene={selectedScene}
            shot={selectedShot}
            episode={selectedEpisode}
            episodeShots={selectedEpisodeShots}
            sceneShots={selectedSceneShots}
            onGoToCharacterLibrary={handleGoToCharacterLibrary}
            onGoToSceneLibrary={handleGoToSceneLibrary}
            onImportCharacters={handleOpenCharactersPanel}
            onImportScenes={openSceneImport}
            onGoToDirector={handleGoToDirector}
            onGoToDirectorFromScene={handleGoToDirectorFromScene}
            onGenerateEpisodeShots={handleGenerateEpisodeShots}
            onUpdateCharacter={handleUpdateCharacter}
            onUpdateScene={handleUpdateScene}
            onUpdateShot={handleUpdateShot}
            onDeleteCharacter={handleDeleteCharacter}
            onDeleteScene={handleDeleteScene}
            onDeleteShot={handleDeleteShot}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Structure overwrite confirmation dialog */}
      <AlertDialog open={structureOverwriteConfirmOpen} onOpenChange={setStructureOverwriteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scriptView.overwriteStructureTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scriptView.overwriteStructureBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleStructureCompletion()}>
              {t("scriptView.confirmOverwrite")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={sceneImportOpen} onOpenChange={setSceneImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("scriptView.importScenesTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("scriptView.importScenesHint")}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const importableIds = (scriptData?.scenes || []).filter((scene) =>
                  !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
                ).map((scene) => scene.id);
                setSelectedSceneImportIds(selectedSceneImportIds.length === importableIds.length ? [] : importableIds);
              }}
            >
              {t("scriptView.selectAll")}
            </Button>
          </div>
          <ScrollArea className="max-h-80 rounded border">
            <div className="p-2 space-y-2">
              {(scriptData?.scenes || []).filter((scene) =>
                !scene.sceneLibraryId || !sceneLibraryItems.some((item) => item.id === scene.sceneLibraryId)
              ).map((scene) => {
                const checked = selectedSceneImportIds.includes(scene.id);
                return (
                  <label key={scene.id} className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedSceneImportIds((prev) => value ? [...prev, scene.id] : prev.filter((id) => id !== scene.id));
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{scene.name || t("scenes.untitled")}</div>
                        <span className={
                          scene.scenePrompt
                            ? "shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }>
                          {scene.scenePrompt ? "Có prompt cảnh" : "Thiếu prompt cảnh"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{scene.description || t("scriptView.noDescription")}</div>
                      {scene.scenePrompt && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">{scene.scenePrompt}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSceneImportOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleImportScenes}>{t("scriptView.importAction", { count: selectedSceneImportIds.length })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
