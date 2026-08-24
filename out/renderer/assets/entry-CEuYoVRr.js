const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-DmYBfTJM.js","./radix-ui-G3HX32g5.js","./lucide-react-DHCwBhKI.js","./supabase-DI0hoIb9.js","./autopilot-store-i3rmgegs.js","./auto-video-store-Cd8fXBc8.js","./index-ld1jMZXM.js","./zustand-DnVmcEKu.js","./index-BZMpfyeQ.css","./cors-fetch-CkwbEcad.js","./model-registry-C5c6bagc.js","./textarea-COLWDImR.js","./label-DOUrVQeY.js","./select-ZlGxq1Za.js","./index-D6U0ie8M.js","./dropdown-menu-D7DihKO-.js","./popover-CuPNgqie.js","./separator-d8zcEGSg.js","./resizable-ZbW8XN3y.js","./task-info-button-Dug1kt_w.js","./progress-CoGwezcY.js","./FeatureHeaderIcon-DurhyC1w.js","./index-C0AV6kWp.js","./image-host-Cffd4T6U.js","./split-scene-card-C0N96cGk.js","./use-now-BZ1xkfxg.js","./use-resolved-image-url-PaRm8NoY.js","./local-image-DQvys8BA.js","./google-flow-runtime-store-S1TkgWH5.js","./source-fingerprint-B0Cw_jDf.js","./index-DsJ3rgw_.js","./media-preview-modal-CVvAo77E.js","./library-csv-import-CmIYHdUV.js","./context-menu-BjjQRRpF.js","./index-Dx1Yj-e3.js","./index-DDD82jAi.js","./SettingsPanel-BqjYbQRh.js","./switch-D859FYwM.js","./collapsible-BVeKrXwK.js","./badge-DGXWRPZx.js","./index-Pjvxl2Gv.js","./index-L3ZTVkO8.js","./gemini-voices-CGiUf3fL.js","./autopilot-panel-BPgLR_w7.js","./omnivoice-languages-BOAnY_r-.js","./index-BEDTC9kF.js","./index-CVW_xSoP.js"])))=>i.map(i=>d[i]);
import { j as jsxRuntimeExports, s as Checkbox$1, t as CheckboxIndicator } from "./radix-ui-G3HX32g5.js";
import { w as LayoutDashboard, x as FileText, y as Table, z as Users, B as MapPin, G as Clapperboard, F as Film, H as Rocket, i as Settings, W as WandSparkles, V as Video, r as reactExports, I as FilePlay, J as ArrowLeft, K as Plus, N as ChevronDown, O as ChevronRight, Q as ListChecks, Y as Clock, Z as Pause, _ as Play, d as Trash2, $ as CircleX, t as CircleCheck, L as LoaderCircle, a0 as Circle, a1 as ChevronUp, a2 as CalendarClock, X, a3 as Check, a4 as SquareCheckBig, a5 as EllipsisVertical, P as Pencil, a6 as Copy, a7 as FolderOpen, a8 as CloudOff } from "./lucide-react-DHCwBhKI.js";
import { u as useLicenseStore, a as useI18n, h as hasPlanAccess, F as FeatureRail, b as useVideoStudioSettingsStore, B as Button, c as cn, t as toast, p as persist, d as createJSONStorage, f as fileStorage, g as generateUUID, I as Input, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, k as DialogFooter, _ as __vitePreload } from "./index-ld1jMZXM.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { u as useActiveScriptProject, c as useProjectVisualStyleId, d as useDirectorStore, e as useActiveDirectorProject, f as useSceneStore, s as setProjectVisualStyleId, h as useCharacterLibraryStore, n as normalizeVideoLength, D as DEFAULT_STYLE_ID, i as createProjectScopedStorage, j as useScriptStore, k as useMediaStore, a as autopilotEngine, l as hydrateAutopilotProject, m as useAPIConfigStore, o as isProviderCredentialConfigured } from "./autopilot-store-i3rmgegs.js";
import { S as ScrollArea, D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem, d as DropdownMenuSeparator } from "./dropdown-menu-D7DihKO-.js";
import { a as useProjectStore, s as splitVideoPromptVoiceOver, c as cleanVoiceOverText, u as useAutoVideoStore } from "./auto-video-store-Cd8fXBc8.js";
import { P as Progress } from "./progress-CoGwezcY.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CuPNgqie.js";
import { F as FeatureHeaderIcon } from "./FeatureHeaderIcon-DurhyC1w.js";
import { R as ResizablePanelGroup, a as ResizablePanel, b as ResizableHandle } from "./resizable-ZbW8XN3y.js";
const usePreviewStore = create((set, get) => ({
  previewItem: null,
  isPlaying: false,
  shouldAutoPlay: false,
  videoRef: null,
  playlist: [],
  currentIndex: 0,
  setPreviewItem: (item) => set({ previewItem: item, shouldAutoPlay: true, playlist: [], currentIndex: 0 }),
  setVideoRef: (ref) => set({ videoRef: ref }),
  play: () => {
    const { videoRef } = get();
    if (videoRef) {
      videoRef.play().catch(console.error);
      set({ isPlaying: true });
    }
  },
  pause: () => {
    const { videoRef } = get();
    if (videoRef) {
      videoRef.pause();
      set({ isPlaying: false });
    }
  },
  stop: () => {
    const { videoRef } = get();
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
      set({ isPlaying: false, currentIndex: 0 });
    }
  },
  seek: (time) => {
    const { videoRef } = get();
    if (videoRef) {
      videoRef.currentTime = time;
    }
  },
  setPlaylist: (items, startIndex = 0) => {
    if (items.length === 0) return;
    const index = Math.min(startIndex, items.length - 1);
    set({
      playlist: items,
      currentIndex: index,
      previewItem: items[index],
      shouldAutoPlay: true,
      isPlaying: true
    });
  },
  playNext: () => {
    const { playlist, currentIndex } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex < playlist.length) {
      set({
        currentIndex: nextIndex,
        previewItem: playlist[nextIndex],
        shouldAutoPlay: true
      });
    } else {
      set({ isPlaying: false, currentIndex: 0 });
    }
  },
  clearPlaylist: () => {
    set({ playlist: [], currentIndex: 0 });
  }
}));
const VIDEO_STUDIO_FEATURE_FLAGS = {
  autoVideoVisible: false
};
const mainNavItems = [
  { id: "overview", labelKey: "nav.overview", icon: LayoutDashboard },
  { id: "script", labelKey: "nav.script", icon: FileText, phase: "01" },
  { id: "promptImport", labelKey: "nav.promptImport", icon: Table, phase: "01" },
  { id: "characters", labelKey: "nav.characters", icon: Users, phase: "02" },
  { id: "scenes", labelKey: "nav.scenes", icon: MapPin, phase: "02" },
  { id: "director", labelKey: "nav.director", icon: Clapperboard, phase: "03" },
  { id: "export", labelKey: "nav.export", icon: Film, phase: "04" },
  ...[],
  { id: "autopilot", labelKey: "nav.autopilot", icon: Rocket, phase: "06", requiresPlan: "dev" }
];
const bottomNavItems = [
  { id: "settings", labelKey: "nav.settings", icon: Settings }
];
const stages = [
  { id: "script", labelKey: "stage.script", phase: "stage.phase01", icon: FileText, tabs: ["script", "promptImport"] },
  { id: "assets", labelKey: "stage.assets", phase: "stage.phase02", icon: Users, tabs: ["characters", "scenes"] },
  { id: "director", labelKey: "stage.director", phase: "stage.phase03", icon: Clapperboard, tabs: ["director"] },
  { id: "export", labelKey: "stage.export", phase: "stage.phase04", icon: Film, tabs: ["export"] }
];
const tabs = {
  dashboard: { icon: FileText, label: "Projects" },
  overview: { icon: LayoutDashboard, label: "Overview" },
  script: { icon: FileText, label: "Script", stage: "script" },
  promptImport: { icon: Table, label: "Prompt Import", stage: "script" },
  characters: { icon: Users, label: "Characters", stage: "assets" },
  scenes: { icon: MapPin, label: "Scenes", stage: "assets" },
  director: { icon: Clapperboard, label: "Director", stage: "director" },
  media: { icon: Video, label: "Media" },
  export: { icon: Film, label: "Export", stage: "export" },
  autoVideo: { icon: WandSparkles, label: "Auto Video" },
  autopilot: { icon: Rocket, label: "AutoPilot" },
  settings: { icon: Settings, label: "Settings" }
};
const useMediaPanelStore = create((set) => ({
  activeTab: "dashboard",
  activeStage: "script",
  inProject: false,
  setActiveTab: (tab) => {
    const tabConfig = tabs[tab];
    if (tabConfig?.stage) {
      set({ activeTab: tab, activeStage: tabConfig.stage, inProject: true });
    } else if (tab === "dashboard") {
      set({ activeTab: tab, inProject: false, activeEpisodeIndex: null, activeEpisodeScopeKey: null });
    } else if (tab === "overview") {
      set({ activeTab: tab, inProject: true });
    } else {
      set({ activeTab: tab });
    }
  },
  setActiveStage: (stage) => {
    const stageConfig = stages.find((s) => s.id === stage);
    if (stageConfig && stageConfig.tabs.length > 0) {
      set({ activeStage: stage, activeTab: stageConfig.tabs[0], inProject: true });
    }
  },
  setInProject: (inProject) => {
    if (!inProject) {
      set({ inProject: false, activeTab: "dashboard", activeEpisodeIndex: null, activeEpisodeScopeKey: null });
    } else {
      set({ inProject: true });
    }
  },
  // Episode scope
  activeEpisodeIndex: null,
  activeEpisodeScopeKey: null,
  enterEpisode: (index, projectId) => set({
    activeEpisodeIndex: index,
    activeEpisodeScopeKey: projectId ? `${projectId}::ep-${index}` : `default::ep-${index}`,
    activeTab: "script",
    activeStage: "script",
    inProject: true
  }),
  backToSeries: () => set({
    activeEpisodeIndex: null,
    activeEpisodeScopeKey: null,
    activeTab: "overview"
  }),
  highlightMediaId: null,
  requestRevealMedia: (mediaId) => set({ activeTab: "media", highlightMediaId: mediaId }),
  clearHighlight: () => set({ highlightMediaId: null }),
  // Cross-panel data passing
  pendingDirectorData: null,
  setPendingDirectorData: (data) => set({ pendingDirectorData: data }),
  goToDirectorWithData: (data) => set({
    pendingDirectorData: data,
    activeTab: "director",
    activeStage: "director",
    inProject: true
  }),
  // Character library data passing
  pendingCharacterData: null,
  setPendingCharacterData: (data) => set({ pendingCharacterData: data }),
  goToCharacterWithData: (data) => set({
    pendingCharacterData: data,
    activeTab: "characters",
    activeStage: "assets",
    inProject: true
  }),
  // Scene library data passing
  pendingSceneData: null,
  setPendingSceneData: (data) => set({ pendingSceneData: data }),
  goToSceneWithData: (data) => set({
    pendingSceneData: data,
    activeTab: "scenes",
    activeStage: "assets",
    inProject: true
  })
}));
useMediaPanelStore.subscribe((state, prev) => {
  if (state.activeTab !== prev.activeTab) {
    usePreviewStore.getState().setPreviewItem(null);
  }
});
function TabBar() {
  const { activeTab, inProject, setActiveTab, setInProject } = useMediaPanelStore();
  const plan = useLicenseStore((state) => state.plan);
  const { t } = useI18n();
  const items = mainNavItems.filter((item) => !item.requiresPlan || hasPlanAccess(plan, item.requiresPlan)).map((item) => ({
    id: item.id,
    icon: item.icon,
    label: t(item.labelKey),
    tooltip: `${t(item.labelKey)}${item.phase ? ` (${t(item.phase)})` : ""}`,
    active: activeTab === item.id,
    onClick: () => setActiveTab(item.id)
  }));
  const projectBottomItems = bottomNavItems.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: t(item.labelKey),
    active: activeTab === item.id,
    onClick: () => setActiveTab(item.id)
  }));
  const dashboardBottomItems = [{
    id: "settings",
    icon: Settings,
    label: t("tabBar.settings"),
    tooltip: t("tabBar.systemSettings"),
    active: activeTab === "settings",
    onClick: () => setActiveTab("settings")
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FeatureRail,
    {
      items: inProject ? items : [],
      bottomItems: inProject ? projectBottomItems : dashboardBottomItems,
      backAction: inProject ? { label: t("tabBar.backToProjects"), onClick: () => setInProject(false) } : activeTab === "settings" ? { label: t("tabBar.backToProjects"), onClick: () => setActiveTab("dashboard") } : void 0
    }
  );
}
function PreviewPanel() {
  const { t } = useI18n();
  const { previewItem, shouldAutoPlay, setVideoRef, playNext, playlist } = usePreviewStore();
  const videoRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (previewItem?.type === "video" && videoRef.current) {
      setVideoRef(videoRef.current);
    }
    return () => setVideoRef(null);
  }, [previewItem, setVideoRef]);
  reactExports.useEffect(() => {
    if (shouldAutoPlay && videoRef.current && previewItem?.type === "video") {
      videoRef.current.play().catch(console.error);
    }
  }, [shouldAutoPlay, previewItem]);
  reactExports.useEffect(() => {
    const video = videoRef.current;
    if (!video || playlist.length === 0) return;
    const handleEnded = () => {
      playNext();
    };
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [playNext, playlist.length]);
  if (!previewItem) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 flex flex-col items-center justify-center text-muted-foreground bg-neutral-200 dark:bg-neutral-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "h-12 w-12 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: t("common.clickToPreview") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-w-0 flex flex-col bg-neutral-200 dark:bg-neutral-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center overflow-hidden", children: previewItem.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: previewItem.url,
        alt: previewItem.name || "Preview",
        className: "max-w-full max-h-full object-contain"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        ref: videoRef,
        src: previewItem.url,
        controls: true,
        className: "max-w-full max-h-full",
        children: "Your browser does not support the video tag."
      }
    ) }),
    previewItem.name && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-background/80 text-center text-sm truncate", children: previewItem.name })
  ] });
}
function getShotCompletionStatus(shot) {
  const hasCorePrompts = !!(shot.imagePrompt?.trim() && shot.videoPrompt?.trim());
  if (!hasCorePrompts) {
    return "pending";
  }
  if (shot.imageStatus === "completed" && shot.videoStatus === "completed") {
    return "completed";
  }
  if (shot.imageStatus === "completed" || shot.videoStatus === "completed") {
    return "in_progress";
  }
  return "pending";
}
function calculateProgress(items) {
  const completed = items.filter((i) => i.status === "completed").length;
  return `${completed}/${items.length}`;
}
function getPromptTargetStatus(shot, target, requiredTargets) {
  const value = target === "imagePrompt" ? shot.imagePrompt : shot.videoPrompt;
  return value?.trim() ? "ready" : "missing";
}
function getShotPromptVoiceFields(shot) {
  const parts = splitVideoPromptVoiceOver(shot.videoPrompt);
  return {
    videoPrompt: parts.videoPrompt,
    voiceOver: cleanVoiceOverText(shot.voiceOver) || parts.voiceOver
  };
}
function DirectorContextPanel() {
  const { t } = useI18n();
  const { setActiveTab, goToDirectorWithData } = useMediaPanelStore();
  const scriptProject = useActiveScriptProject();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { addScenesFromScript, setStoryboardConfig } = useDirectorStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const projectData = useActiveDirectorProject();
  const splitScenes = projectData?.splitScenes || [];
  const { scenes } = useSceneStore();
  const sceneLibraryScenes = reactExports.useMemo(() => {
    if (resourceSharing.shareScenes) return scenes;
    if (!activeProjectId) return [];
    return scenes.filter((s) => s.projectId === activeProjectId);
  }, [scenes, resourceSharing.shareScenes, activeProjectId]);
  const [expandedEpisodes, setExpandedEpisodes] = reactExports.useState(/* @__PURE__ */ new Set(["default", "ep_1"]));
  const [selectedShotId, setSelectedShotId] = reactExports.useState(null);
  const scriptData = scriptProject?.scriptData || null;
  const shots = scriptProject?.shots || [];
  const styleId = projectVisualStyleId || DEFAULT_STYLE_ID;
  const addScenesAndSyncStyle = reactExports.useCallback((scenes2) => {
    addScenesFromScript(scenes2);
    const directorStyleId = projectData?.storyboardConfig?.visualStyleId;
    if (!directorStyleId) {
      setProjectVisualStyleId(projectVisualStyleId);
    }
    if (scriptProject?.videoGenerationMode) {
      setStoryboardConfig({ videoGenerationMode: scriptProject.videoGenerationMode });
    }
  }, [addScenesFromScript, setStoryboardConfig, projectData?.storyboardConfig?.visualStyleId, projectVisualStyleId, scriptProject?.videoGenerationMode]);
  const episodes = reactExports.useMemo(() => {
    if (!scriptData) return [];
    if (scriptData.episodes && scriptData.episodes.length > 0) {
      return scriptData.episodes;
    }
    return [{
      id: "default",
      index: 1,
      title: scriptData.title || "Episode 1",
      sceneIds: scriptData.scenes.map((s) => s.id)
    }];
  }, [scriptData]);
  const handleBackToScript = () => {
    setActiveTab("script");
  };
  const toggleEpisode = (id) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const { characters } = useCharacterLibraryStore();
  const libraryCharacters = reactExports.useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeProjectId) return [];
    return characters.filter((c) => c.projectId === activeProjectId);
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);
  const mapScriptCharacterIdsToLibraryIds = (scriptCharIds, characterNames) => {
    const libraryIds = [];
    const addedIds = /* @__PURE__ */ new Set();
    if (scriptCharIds && scriptCharIds.length > 0 && scriptData) {
      for (const scriptCharId of scriptCharIds) {
        const scriptChar = scriptData.characters.find((c) => c.id === scriptCharId);
        if (!scriptChar) continue;
        if (scriptChar.characterLibraryId && !addedIds.has(scriptChar.characterLibraryId)) {
          const linkedLibraryChar = libraryCharacters.find((c) => c.id === scriptChar.characterLibraryId);
          if (linkedLibraryChar) {
            libraryIds.push(linkedLibraryChar.id);
            addedIds.add(linkedLibraryChar.id);
            continue;
          }
          console.warn(`[ContextPanel] Invalid characterLibraryId "${scriptChar.characterLibraryId}" for script character "${scriptChar.name}", fallback to name matching`);
        }
        const libraryChar = libraryCharacters.find((c) => c.name === scriptChar.name);
        if (libraryChar && !addedIds.has(libraryChar.id)) {
          libraryIds.push(libraryChar.id);
          addedIds.add(libraryChar.id);
        }
      }
    }
    if (characterNames && characterNames.length > 0) {
      for (const charName of characterNames) {
        if (!charName) continue;
        let libraryChar = libraryCharacters.find((c) => c.name === charName);
        if (!libraryChar) {
          libraryChar = libraryCharacters.find(
            (c) => c.name.includes(charName) || charName.includes(c.name)
          );
        }
        if (libraryChar && !addedIds.has(libraryChar.id)) {
          libraryIds.push(libraryChar.id);
          addedIds.add(libraryChar.id);
          console.log(`[ContextPanel] Matched character "${charName}" to library "${libraryChar.name}"`);
        }
      }
    }
    return libraryIds;
  };
  const extractPromptCharacterNames = (...prompts) => {
    const names = /* @__PURE__ */ new Set();
    for (const prompt of prompts) {
      if (!prompt) continue;
      for (const match of prompt.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)) {
        const name = (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "");
        if (name) names.add(name);
      }
    }
    return Array.from(names);
  };
  const sceneById = reactExports.useMemo(() => new Map(scriptData?.scenes.map((scene) => [scene.id, scene]) || []), [scriptData?.scenes]);
  const shotsByEpisodeId = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const episode of episodes) {
      const episodeSceneIds = new Set(episode.sceneIds || []);
      map.set(
        episode.id,
        shots.filter((shot) => shot.episodeId === episode.id || episodeSceneIds.has(shot.sceneRefId))
      );
    }
    return map;
  }, [episodes, shots]);
  const findMatchingSceneInLibrary = (scene) => {
    const sceneName = scene.name || "";
    const parentScene = sceneLibraryScenes.find(
      (s) => s.name.includes(sceneName) || sceneName.includes(s.name)
    );
    if (!parentScene) return null;
    return {
      sceneLibraryId: parentScene.id,
      sceneReferenceImage: parentScene.referenceImage || parentScene.referenceImageBase64,
      matchedSceneName: parentScene.name
    };
  };
  const handleAddShotToSplitScenes = (shot, scene) => {
    const voiceFields = getShotPromptVoiceFields(shot);
    console.log("[ContextPanel] Adding shot to split scenes:", {
      shotId: shot.id,
      imagePrompt: shot.imagePrompt?.substring(0, 50),
      videoPrompt: voiceFields.videoPrompt.substring(0, 50)
    });
    const promptCharacterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
    const characterLibraryIds = mapScriptCharacterIdsToLibraryIds([], promptCharacterNames);
    const sceneMatch = scene ? findMatchingSceneInLibrary(scene) : null;
    addScenesAndSyncStyle([{
      // Scene info
      sceneName: sceneMatch?.matchedSceneName || scene?.name || "",
      sceneLocation: scene?.name || "",
      promptEn: voiceFields.videoPrompt || shot.imagePrompt || "",
      // Two-layer prompt system
      imagePrompt: shot.imagePrompt || "",
      videoPrompt: voiceFields.videoPrompt,
      voiceOver: voiceFields.voiceOver,
      videoLength: normalizeVideoLength(shot.videoLength),
      ref_image: shot.ref_image,
      sourceShotId: shot.id,
      sourceShotIndex: shot.index,
      characterIds: characterLibraryIds,
      characterNames: promptCharacterNames,
      ambientSound: "",
      soundEffects: [],
      soundEffectText: "",
      dialogue: "",
      // Scene-library association (auto-matched)
      sceneLibraryId: sceneMatch?.sceneLibraryId,
      sceneReferenceImage: sceneMatch?.sceneReferenceImage
    }]);
    const matchInfo = sceneMatch ? ` (Matched: ${sceneMatch.matchedSceneName})` : "";
    toast.success(`Added shot to editing list${matchInfo}`);
  };
  const handleAddEpisodeToSplitScenes = (episodeId) => {
    const episode = episodes.find((item) => item.id === episodeId);
    if (!episode) return;
    const episodeSceneIds = new Set(episode.sceneIds || []);
    const episodeShots = shots.filter((shot) => shot.episodeId === episode.id || episodeSceneIds.has(shot.sceneRefId));
    if (episodeShots.length === 0) {
      toast.warning("No shots in this episode");
      return;
    }
    const scenesToAdd = episodeShots.map((shot) => {
      const voiceFields = getShotPromptVoiceFields(shot);
      const scene = sceneById.get(shot.sceneRefId);
      const sceneMatch = scene ? findMatchingSceneInLibrary(scene) : null;
      const promptCharacterNames = extractPromptCharacterNames(shot.imagePrompt, voiceFields.videoPrompt);
      return {
        sceneName: sceneMatch?.matchedSceneName || scene?.name || "",
        sceneLocation: scene?.name || "",
        promptEn: voiceFields.videoPrompt || shot.imagePrompt || "",
        imagePrompt: shot.imagePrompt || "",
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        videoLength: normalizeVideoLength(shot.videoLength),
        ref_image: shot.ref_image,
        sourceShotId: shot.id,
        sourceShotIndex: shot.index,
        characterIds: mapScriptCharacterIdsToLibraryIds([], promptCharacterNames),
        characterNames: promptCharacterNames,
        ambientSound: "",
        soundEffects: [],
        soundEffectText: "",
        dialogue: "",
        sceneLibraryId: sceneMatch?.sceneLibraryId,
        sceneReferenceImage: sceneMatch?.sceneReferenceImage
      };
    });
    addScenesAndSyncStyle(scenesToAdd);
    toast.success(`Added ${scenesToAdd.length} shots to editing list`);
  };
  const handleSendShot = (shot, scene) => {
    const voiceFields = getShotPromptVoiceFields(shot);
    const parts = [];
    if (scene?.name) parts.push(`Scene: ${scene.name}`);
    if (scene?.description) parts.push(`Description: ${scene.description}`);
    if (scene?.time) parts.push(`Time: ${scene.time}`);
    if (shot.imagePrompt) parts.push(`Image: ${shot.imagePrompt}`);
    if (voiceFields.videoPrompt) parts.push(`Video: ${voiceFields.videoPrompt}`);
    const storyPrompt = parts.join("\n");
    goToDirectorWithData({
      storyPrompt,
      sceneLocation: scene?.name,
      sceneTime: scene?.time,
      shotId: shot.id,
      sceneCount: 1,
      styleId,
      sourceType: "shot",
      prebuiltScenes: [{
        imagePrompt: shot.imagePrompt || "",
        videoPrompt: voiceFields.videoPrompt,
        voiceOver: voiceFields.voiceOver,
        videoLength: normalizeVideoLength(shot.videoLength),
        ref_image: shot.ref_image,
        sourceShotId: shot.id,
        sourceShotIndex: shot.index,
        sceneName: scene?.name || "",
        sceneLocation: scene?.name || ""
      }]
    });
    setSelectedShotId(shot.id);
  };
  if (!scriptData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-w-0 flex flex-col overflow-x-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-medium text-sm flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlay, { className: "h-4 w-4" }),
        t("director.context.structure")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.context.noScript") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: t("director.context.goScript") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "w-full",
          onClick: handleBackToScript,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
            t("director.context.goScriptButton")
          ]
        }
      ) })
    ] });
  }
  const overallProgress = calculateProgress(
    shots.map((s) => ({ status: getShotCompletionStatus(s) }))
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-w-0 flex flex-col overflow-x-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 border-b", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-sm", children: scriptData.title }),
          scriptData.genre && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: scriptData.genre })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("director.context.progress", { value: overallProgress }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: t("director.context.hint") }),
      splitScenes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 px-2 py-1 bg-green-500/10 rounded text-xs text-green-600 flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("director.context.addedCount", { count: splitScenes.length }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 space-y-1", children: episodes.map((episode) => {
      const episodeShots = shotsByEpisodeId.get(episode.id) || [];
      const episodeProgress = calculateProgress(
        episodeShots.map((s) => ({ status: getShotCompletionStatus(s) }))
      );
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => toggleEpisode(episode.id),
              className: "flex-1 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted text-left",
              children: [
                expandedEpisodes.has(episode.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-3 w-3 text-primary" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium flex-1 truncate", children: episode.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: episodeProgress })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100",
              onClick: (e) => {
                e.stopPropagation();
                handleAddEpisodeToSplitScenes(episode.id);
              },
              title: t("director.context.addEpisode"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 text-green-500" })
            }
          )
        ] }),
        expandedEpisodes.has(episode.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-4 space-y-0.5", children: episodeShots.map((shot) => {
          const scene = sceneById.get(shot.sceneRefId);
          const isShotSelected = selectedShotId === shot.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => handleSendShot(shot, scene),
                onDoubleClick: () => handleAddShotToSplitScenes(shot, scene),
                className: cn(
                  "flex-1 flex items-center gap-2 px-2 py-1 rounded hover:bg-muted text-left",
                  isShotSelected && "bg-primary/10 ring-1 ring-primary/30"
                ),
                title: t("director.context.sendShotOrAdd"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-muted-foreground w-5", children: String(shot.index).padStart(2, "0") })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                className: "h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100",
                onClick: (e) => {
                  e.stopPropagation();
                  handleAddShotToSplitScenes(shot, scene);
                },
                title: t("director.context.addToEditing"),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 text-green-500" })
              }
            )
          ] }, shot.id);
        }) })
      ] }, episode.id);
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 border-t space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-500", children: "+" }),
          " ",
          t("director.context.addMode")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "→" }),
          " ",
          t("director.context.sendMode")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "w-full",
          onClick: handleBackToScript,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
            t("director.context.backToScript")
          ]
        }
      )
    ] })
  ] });
}
function RightPanel() {
  const { activeTab } = useMediaPanelStore();
  const { t } = useI18n();
  const renderContent = () => {
    switch (activeTab) {
      case "director":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 overflow-y-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { id: "director-right-panel-controls", className: "p-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DirectorContextPanel, {})
        ] });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 flex items-center justify-center text-muted-foreground text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("rightPanel.comingSoon") }) });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-w-0 flex flex-col overflow-hidden bg-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2.5 border-b border-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-xs text-muted-foreground", children: t("rightPanel.properties") }) }),
    renderContent()
  ] });
}
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
};
const useSimpleTimelineStore = create()(
  persist(
    (set, get) => ({
      clips: [],
      isPlaying: false,
      currentTime: 0,
      totalDuration: 0,
      activeClipId: null,
      addClip: (clipData) => {
        const { clips } = get();
        const startTime = clips.reduce((acc, clip) => acc + clip.duration, 0);
        const newClip = {
          ...clipData,
          id: nanoid(),
          startTime
        };
        const newClips = [...clips, newClip];
        const totalDuration = newClips.reduce((acc, clip) => acc + clip.duration, 0);
        set({ clips: newClips, totalDuration });
      },
      removeClip: (id) => {
        const { clips } = get();
        const newClips = clips.filter((c) => c.id !== id);
        let currentStart = 0;
        const recalculatedClips = newClips.map((clip) => {
          const updated = { ...clip, startTime: currentStart };
          currentStart += clip.duration;
          return updated;
        });
        const totalDuration = recalculatedClips.reduce((acc, clip) => acc + clip.duration, 0);
        set({ clips: recalculatedClips, totalDuration });
      },
      reorderClips: (fromIndex, toIndex) => {
        const { clips } = get();
        const newClips = [...clips];
        const [removed] = newClips.splice(fromIndex, 1);
        newClips.splice(toIndex, 0, removed);
        let currentStart = 0;
        const recalculatedClips = newClips.map((clip) => {
          const updated = { ...clip, startTime: currentStart };
          currentStart += clip.duration;
          return updated;
        });
        set({ clips: recalculatedClips });
      },
      clearTimeline: () => {
        set({
          clips: [],
          currentTime: 0,
          totalDuration: 0,
          isPlaying: false,
          activeClipId: null
        });
      },
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      stop: () => set({ isPlaying: false, currentTime: 0, activeClipId: null }),
      seek: (time) => {
        const { totalDuration } = get();
        const clampedTime = Math.max(0, Math.min(time, totalDuration));
        set({ currentTime: clampedTime });
      },
      setCurrentTime: (time) => {
        const clip = get().getClipAtTime(time);
        set({ currentTime: time, activeClipId: clip?.id || null });
      },
      getClipAtTime: (time) => {
        const { clips } = get();
        for (const clip of clips) {
          if (time >= clip.startTime && time < clip.startTime + clip.duration) {
            return clip;
          }
        }
        return null;
      }
    }),
    {
      name: "longdd-timeline-store",
      storage: createJSONStorage(() => createProjectScopedStorage("timeline")),
      partialize: (state) => ({
        // Only persist clips, not playback state
        clips: state.clips,
        totalDuration: state.totalDuration
      }),
      merge: (persisted, current) => {
        if (!persisted) return current;
        return {
          ...current,
          clips: persisted.clips ?? current.clips,
          totalDuration: persisted.totalDuration ?? current.totalDuration
        };
      }
    }
  )
);
async function switchProject(newProjectId) {
  const currentId = useProjectStore.getState().activeProjectId;
  if (currentId === newProjectId) return;
  console.log(`[ProjectSwitcher] Switching from ${currentId?.substring(0, 8) ?? "none"} to ${newProjectId.substring(0, 8)}`);
  usePreviewStore.getState().setPreviewItem(null);
  usePreviewStore.getState().clearPlaylist();
  useAutoVideoStore.setState({
    transcribeJobId: null,
    transcribeProgress: { stage: "idle", message: "", percent: 0 },
    transcribeError: null,
    renderJobId: null,
    renderProgress: { stage: "idle", percent: 0, message: "" },
    renderError: null,
    renderLog: ""
  });
  await new Promise((r) => setTimeout(r, 50));
  useProjectStore.getState().setActiveProject(newProjectId);
  try {
    await useScriptStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate script store:", e);
  }
  try {
    await useDirectorStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate director store:", e);
  }
  try {
    await useMediaStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate media store:", e);
  }
  try {
    await useCharacterLibraryStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate character library:", e);
  }
  try {
    await useSceneStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate scene store:", e);
  }
  try {
    await useSimpleTimelineStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate timeline store:", e);
  }
  try {
    await useAutoVideoStore.persist.rehydrate();
  } catch (e) {
    console.warn("[ProjectSwitcher] Failed to rehydrate auto-video store:", e);
  }
  useScriptStore.getState().setActiveProjectId(newProjectId);
  useDirectorStore.getState().setActiveProjectId(newProjectId);
  useScriptStore.getState().ensureProject(newProjectId);
  useDirectorStore.getState().ensureProject(newProjectId);
  console.log(`[ProjectSwitcher] Switch complete → ${newProjectId.substring(0, 8)}`);
}
let betweenDelayTimer = null;
let jobWatchOff = null;
let runNextRef = null;
const MAX_WAIT_MS = 3e4;
function clearBetweenDelay() {
  if (betweenDelayTimer) {
    clearTimeout(betweenDelayTimer);
    betweenDelayTimer = null;
  }
}
function mapJobStatusToEntry(status) {
  switch (status) {
    case "done":
      return "done";
    case "failed":
      return "failed";
    case "running":
    case "queued":
      return "running";
    default:
      return "paused";
  }
}
const useBatchQueueStore = create()(
  persist(
    (set, get) => {
      const waitForJob = (jobId) => new Promise((resolve) => {
        let settled = false;
        const finish = (status) => {
          if (settled) return;
          settled = true;
          off();
          resolve(status);
        };
        const check = () => {
          const job = autopilotEngine.getJob(jobId);
          if (!job) return finish("failed");
          set((state) => ({
            entries: state.entries.map(
              (entry2) => entry2.jobId === jobId ? {
                ...entry2,
                progress: job.progress,
                message: job.message,
                error: job.error,
                stage: job.stage,
                completedSteps: job.completedSteps,
                nextStep: job.nextStep
              } : entry2
            )
          }));
          if (["done", "failed", "paused", "interrupted", "cancelled"].includes(job.status)) {
            finish(job.status);
          }
        };
        const off = autopilotEngine.onEvent((event) => {
          const eventJobId = event.type === "job-updated" ? event.job.id : event.jobId;
          if (eventJobId === jobId) check();
        });
        jobWatchOff = off;
        check();
      });
      const runNext = async () => {
        if (!get().running) return;
        const entry2 = get().entries.find((item) => item.status === "pending");
        if (!entry2) {
          set({ running: false, activeEntryId: null, waiting: false });
          return;
        }
        const now = Date.now();
        if (entry2.scheduledAt && entry2.scheduledAt > now) {
          set({ activeEntryId: entry2.id, waiting: true });
          clearBetweenDelay();
          const wait = Math.min(entry2.scheduledAt - now, MAX_WAIT_MS);
          betweenDelayTimer = setTimeout(() => {
            betweenDelayTimer = null;
            void runNext();
          }, wait);
          return;
        }
        set((state) => ({
          activeEntryId: entry2.id,
          waiting: false,
          entries: state.entries.map(
            (item) => item.id === entry2.id ? { ...item, status: "running", error: void 0 } : item
          )
        }));
        try {
          await switchProject(entry2.projectId);
        } catch (error) {
          set((state) => ({
            entries: state.entries.map(
              (item) => item.id === entry2.id ? { ...item, status: "failed", error: error instanceof Error ? error.message : String(error) } : item
            )
          }));
          void afterEntry();
          return;
        }
        if (!get().running) return;
        const createFresh = () => autopilotEngine.createJob({
          ...entry2.input,
          title: entry2.input.title || entry2.projectName,
          executionMode: "all",
          stopAfterStep: entry2.stopAfterStep
        }).id;
        let jobId;
        if (entry2.resume && entry2.jobId) {
          if (!autopilotEngine.getJob(entry2.jobId)) {
            await hydrateAutopilotProject(entry2.projectId);
          }
          if (autopilotEngine.getJob(entry2.jobId) && autopilotEngine.resumeJob(entry2.jobId)) {
            jobId = entry2.jobId;
          } else {
            jobId = createFresh();
          }
        } else {
          jobId = createFresh();
        }
        set((state) => ({
          entries: state.entries.map(
            (item) => item.id === entry2.id ? { ...item, jobId, resume: void 0 } : item
          )
        }));
        const finalStatus = await waitForJob(jobId);
        jobWatchOff = null;
        if (!get().running) {
          set((state) => ({
            entries: state.entries.map(
              (item) => item.id === entry2.id ? { ...item, status: "paused" } : item
            )
          }));
          return;
        }
        set((state) => ({
          entries: state.entries.map(
            (item) => item.id === entry2.id ? { ...item, status: mapJobStatusToEntry(finalStatus) } : item
          )
        }));
        void afterEntry();
      };
      const afterEntry = async () => {
        if (!get().running) {
          set({ activeEntryId: null, waiting: false });
          return;
        }
        const minSec = Math.max(0, get().betweenDelayMinSec);
        const maxSec = Math.max(minSec, get().betweenDelayMaxSec);
        const delaySec = minSec + Math.random() * (maxSec - minSec);
        const delayMs = Math.max(0, Math.round(delaySec * 1e3));
        const hasMore = get().entries.some((item) => item.status === "pending");
        if (!hasMore || delayMs === 0) {
          set({ waiting: false });
          void runNext();
          return;
        }
        set({ waiting: true });
        clearBetweenDelay();
        betweenDelayTimer = setTimeout(() => {
          betweenDelayTimer = null;
          set({ waiting: false });
          void runNext();
        }, delayMs);
      };
      runNextRef = () => void runNext();
      return {
        entries: [],
        running: false,
        betweenDelayMinSec: 180,
        betweenDelayMaxSec: 420,
        activeEntryId: null,
        waiting: false,
        addEntry: (entry2) => {
          const id = generateUUID();
          set((state) => ({
            entries: [
              ...state.entries,
              {
                label: "AutoPilot đầy đủ",
                ...entry2,
                id,
                status: "pending",
                progress: 0,
                addedAt: Date.now()
              }
            ]
          }));
          return id;
        },
        setEntrySchedule: (id, scheduledAt) => {
          set((state) => ({
            entries: state.entries.map(
              (item) => item.id === id ? { ...item, scheduledAt: scheduledAt ?? void 0 } : item
            )
          }));
          maybeAutoStart();
        },
        removeEntry: (id) => {
          const entry2 = get().entries.find((item) => item.id === id);
          if (entry2?.status === "running" && entry2.jobId) {
            autopilotEngine.cancelJob(entry2.jobId);
          }
          set((state) => ({ entries: state.entries.filter((item) => item.id !== id) }));
        },
        moveEntry: (id, direction) => {
          set((state) => {
            const index = state.entries.findIndex((item) => item.id === id);
            if (index < 0) return state;
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= state.entries.length) return state;
            const entries = [...state.entries];
            [entries[index], entries[target]] = [entries[target], entries[index]];
            return { entries };
          });
        },
        resumeEntry: (id) => {
          const entry2 = get().entries.find((item) => item.id === id);
          if (!entry2 || entry2.status !== "failed" && entry2.status !== "paused") return;
          const wasRunning = get().running;
          set((state) => ({
            running: true,
            entries: state.entries.map(
              (item) => item.id === id ? { ...item, status: "pending", resume: true, error: void 0 } : item
            )
          }));
          if (!wasRunning) runNextRef?.();
        },
        setBetweenDelayRange: (minSec, maxSec) => {
          const min = Math.max(0, Math.round(minSec) || 0);
          const max = Math.max(min, Math.round(maxSec) || 0);
          set({ betweenDelayMinSec: min, betweenDelayMaxSec: max });
        },
        clearFinished: () => {
          set((state) => ({
            entries: state.entries.filter(
              (item) => item.status !== "done" && item.status !== "failed"
            )
          }));
        },
        clearAll: () => {
          const { running, pauseAll } = get();
          if (running) pauseAll();
          set({ entries: [], activeEntryId: null });
        },
        startAll: () => {
          if (get().running) return;
          set((state) => ({
            running: true,
            entries: state.entries.map(
              (item) => item.status === "paused" || item.status === "failed" ? { ...item, status: "pending", jobId: void 0, error: void 0 } : item
            )
          }));
          void runNext();
        },
        pauseAll: () => {
          clearBetweenDelay();
          const active = get().entries.find((item) => item.id === get().activeEntryId);
          if (active?.jobId) autopilotEngine.cancelJob(active.jobId);
          if (jobWatchOff) {
            jobWatchOff();
            jobWatchOff = null;
          }
          set((state) => ({
            running: false,
            waiting: false,
            entries: state.entries.map(
              (item) => item.status === "running" ? { ...item, status: "paused" } : item
            )
          }));
        },
        resumeAll: () => {
          if (get().running) return;
          if (!get().entries.some((item) => item.status === "pending" || item.status === "paused")) return;
          set((state) => ({
            running: true,
            entries: state.entries.map(
              (item) => item.status === "paused" ? { ...item, status: "pending" } : item
            )
          }));
          void runNext();
        }
      };
    },
    {
      name: "longdd-batch-queue",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        entries: state.entries,
        betweenDelayMinSec: state.betweenDelayMinSec,
        betweenDelayMaxSec: state.betweenDelayMaxSec
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.running = false;
        state.activeEntryId = null;
        state.waiting = false;
        state.entries = state.entries.map(
          (entry2) => entry2.status === "running" ? { ...entry2, status: "paused", jobId: void 0, resume: void 0 } : { ...entry2, resume: void 0 }
        );
      }
    }
  )
);
function maybeAutoStart() {
  const state = useBatchQueueStore.getState();
  if (state.running) return;
  const now = Date.now();
  const due = state.entries.some(
    (entry2) => entry2.status === "pending" && entry2.scheduledAt !== void 0 && entry2.scheduledAt <= now
  );
  if (!due) return;
  useBatchQueueStore.setState({ running: true, activeEntryId: null });
  runNextRef?.();
}
if (typeof window !== "undefined") {
  setInterval(maybeAutoStart, 2e4);
}
function selectProjectBatchStatus(entries, projectId) {
  const forProject = entries.filter((entry2) => entry2.projectId === projectId);
  if (forProject.length === 0) return void 0;
  return forProject.find((entry2) => entry2.status === "running") || forProject.find((entry2) => entry2.status === "pending") || forProject[forProject.length - 1];
}
const JOB_STEPS = [
  ["audio", "Voice"],
  ["shots", "Chia shot"],
  ["research", "Tư liệu"],
  ["references", "Tham chiếu"],
  ["images", "Ảnh"],
  ["videos", "Video"],
  ["render", "Ghép/Xuất"]
];
function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatSchedule(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}
function toDateInputValue(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function buildScheduleTs(dateStr, hour, minute) {
  if (!dateStr) return null;
  const [y, m, day] = dateStr.split("-").map(Number);
  if (!y || !m || !day) return null;
  const ts = new Date(y, m - 1, day, hour, minute, 0, 0).getTime();
  return Number.isNaN(ts) ? null : ts;
}
const STATUS_META = {
  pending: { label: "Đang chờ", className: "text-muted-foreground", Icon: Circle },
  running: { label: "Đang chạy", className: "text-sky-600 dark:text-sky-400", Icon: LoaderCircle },
  done: { label: "Xong", className: "text-green-600 dark:text-green-400", Icon: CircleCheck },
  failed: { label: "Lỗi", className: "text-red-600 dark:text-red-400", Icon: CircleX },
  paused: { label: "Tạm dừng", className: "text-amber-600 dark:text-amber-400", Icon: Pause }
};
function BatchQueuePanel() {
  const entries = useBatchQueueStore((s) => s.entries);
  const running = useBatchQueueStore((s) => s.running);
  const waiting = useBatchQueueStore((s) => s.waiting);
  const activeEntryId = useBatchQueueStore((s) => s.activeEntryId);
  const betweenDelayMinSec = useBatchQueueStore((s) => s.betweenDelayMinSec);
  const betweenDelayMaxSec = useBatchQueueStore((s) => s.betweenDelayMaxSec);
  const startAll = useBatchQueueStore((s) => s.startAll);
  const pauseAll = useBatchQueueStore((s) => s.pauseAll);
  const resumeAll = useBatchQueueStore((s) => s.resumeAll);
  const setBetweenDelayRange = useBatchQueueStore((s) => s.setBetweenDelayRange);
  const setEntrySchedule = useBatchQueueStore((s) => s.setEntrySchedule);
  const resumeEntry = useBatchQueueStore((s) => s.resumeEntry);
  const removeEntry = useBatchQueueStore((s) => s.removeEntry);
  const moveEntry = useBatchQueueStore((s) => s.moveEntry);
  const clearFinished = useBatchQueueStore((s) => s.clearFinished);
  const clearAll = useBatchQueueStore((s) => s.clearAll);
  if (entries.length === 0) return null;
  const activeEntry = entries.find((e) => e.id === activeEntryId);
  const waitingForSchedule = waiting && !!activeEntry?.scheduledAt && activeEntry.scheduledAt > Date.now();
  const counts = entries.reduce(
    (acc, entry2) => {
      acc[entry2.status] += 1;
      return acc;
    },
    { pending: 0, running: 0, done: 0, failed: 0, paused: 0 }
  );
  const hasRunnable = entries.some((e) => e.status === "pending" || e.status === "paused" || e.status === "failed");
  const hasFinished = counts.done + counts.failed > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-border/60 bg-card/80 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ListChecks, { className: "h-4 w-4 text-primary" }),
        "Hàng chờ dự án"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        counts.pending > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          counts.pending,
          " đang chờ"
        ] }),
        counts.running > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sky-600 dark:text-sky-400", children: [
          "· ",
          counts.running,
          " đang chạy"
        ] }),
        counts.done > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-600 dark:text-green-400", children: [
          "· ",
          counts.done,
          " xong"
        ] }),
        counts.failed > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-600 dark:text-red-400", children: [
          "· ",
          counts.failed,
          " lỗi"
        ] }),
        counts.paused > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-600 dark:text-amber-400", children: [
          "· ",
          counts.paused,
          " tạm dừng"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground", children: "Nghỉ giữa dự án" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 0,
              value: betweenDelayMinSec,
              onChange: (e) => setBetweenDelayRange(parseInt(e.target.value, 10) || 0, betweenDelayMaxSec),
              className: "h-8 w-[72px] px-2 text-xs",
              title: "Nghỉ tối thiểu (giây)"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "–" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 0,
              value: betweenDelayMaxSec,
              onChange: (e) => setBetweenDelayRange(betweenDelayMinSec, parseInt(e.target.value, 10) || 0),
              className: "h-8 w-[72px] px-2 text-xs",
              title: "Nghỉ tối đa (giây) — thời gian nghỉ sẽ random trong khoảng này"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "giây" })
        ] }),
        running ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: pauseAll, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Dừng tất cả"
        ] }) : counts.paused > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: resumeAll, disabled: !hasRunnable, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Tiếp tục tất cả"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: startAll, disabled: !hasRunnable, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Bắt đầu tất cả"
        ] })
      ] })
    ] }),
    waiting && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border/60 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400", children: waitingForSchedule ? `Chờ đến giờ hẹn ${formatSchedule(activeEntry.scheduledAt)} để chạy "${activeEntry.projectName}"…` : `Đang nghỉ (ngẫu nhiên ${betweenDelayMinSec}–${betweenDelayMaxSec}s) trước khi chạy dự án tiếp theo…` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/40", children: entries.map((entry2, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      QueueRow,
      {
        entry: entry2,
        first: index === 0,
        last: index === entries.length - 1,
        order: index + 1,
        onUp: () => moveEntry(entry2.id, "up"),
        onDown: () => moveEntry(entry2.id, "down"),
        onRemove: () => removeEntry(entry2.id),
        onSchedule: (ts) => setEntrySchedule(entry2.id, ts),
        onResume: () => resumeEntry(entry2.id)
      },
      entry2.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 border-t border-border/60 px-4 py-2", children: [
      hasFinished && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: clearFinished, children: "Xóa mục đã xong" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", className: "text-destructive hover:text-destructive", onClick: clearAll, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
        "Xóa hàng chờ"
      ] })
    ] })
  ] });
}
function QueueRow({
  entry: entry2,
  first,
  last,
  order,
  onUp,
  onDown,
  onRemove,
  onSchedule,
  onResume
}) {
  const meta = STATUS_META[entry2.status];
  const { Icon } = meta;
  const canSchedule = entry2.status === "pending" || entry2.status === "paused";
  const canResume = entry2.status === "failed" || entry2.status === "paused";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          disabled: first,
          onClick: onUp,
          className: "size-6 text-muted-foreground",
          title: "Lên",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3.5 w-3.5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          disabled: last,
          onClick: onDown,
          className: "size-6 text-muted-foreground",
          title: "Xuống",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground", children: [
      "#",
      order
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("h-4 w-4 shrink-0", meta.className, entry2.status === "running" && "animate-spin") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium text-foreground", children: entry2.projectName }),
        entry2.scheduledAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex shrink-0 items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-2xs text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "h-3 w-3" }),
          formatSchedule(entry2.scheduledAt)
        ] })
      ] }),
      (entry2.status === "running" || entry2.progress > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: entry2.progress, className: "h-1.5 flex-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-2xs tabular-nums text-muted-foreground", children: [
          Math.round(entry2.progress),
          "%"
        ] })
      ] }),
      (entry2.status === "running" || (entry2.completedSteps?.length ?? 0) > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx(StageTimeline, { entry: entry2 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-0.5 truncate text-2xs", entry2.status === "failed" ? "text-red-500" : "text-muted-foreground"), children: entry2.error || entry2.message || meta.label })
    ] }),
    canResume && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        className: "h-8 shrink-0",
        onClick: onResume,
        title: "Tiếp tục dự án này từ chỗ dừng (giữ phần đã làm + phần bạn vừa sửa)",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Tiếp tục"
        ]
      }
    ),
    canSchedule && /* @__PURE__ */ jsxRuntimeExports.jsx(SchedulePicker, { scheduledAt: entry2.scheduledAt, onSchedule }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "icon-sm",
        type: "button",
        onClick: onRemove,
        className: "shrink-0 text-muted-foreground hover:text-destructive",
        title: "Xóa khỏi hàng chờ",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
      }
    )
  ] });
}
function StageTimeline({ entry: entry2 }) {
  const completed = new Set(entry2.completedSteps || []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex flex-wrap gap-1", children: JOB_STEPS.map(([step, label]) => {
    const done = completed.has(step);
    const active = !done && entry2.status === "running" && (entry2.nextStep === step || entry2.stage === step || step === "references" && (entry2.stage === "characters" || entry2.stage === "scenes"));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        className: cn(
          "flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs",
          done ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400" : active ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground"
        ),
        children: [
          done ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-2.5 w-2.5 shrink-0" }) : active ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-2.5 w-2.5 shrink-0 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Circle, { className: "h-2.5 w-2.5 shrink-0" }),
          label
        ]
      },
      step
    );
  }) });
}
function SchedulePicker({
  scheduledAt,
  onSchedule
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [dateStr, setDateStr] = reactExports.useState("");
  const [hour, setHour] = reactExports.useState(0);
  const [minute, setMinute] = reactExports.useState(0);
  const handleOpenChange = (next) => {
    if (next) {
      const seed = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60 * 1e3);
      setDateStr(toDateInputValue(seed));
      setHour(seed.getHours());
      setMinute(seed.getMinutes());
    }
    setOpen(next);
  };
  const preview = buildScheduleTs(dateStr, hour, minute);
  const isPast = preview !== null && preview <= Date.now();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: handleOpenChange, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-8 shrink-0", title: "Hẹn giờ chạy dự án này", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "mr-1.5 h-3.5 w-3.5" }),
      scheduledAt ? formatSchedule(scheduledAt) : "Hẹn giờ"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { align: "end", className: "w-72 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: "Hẹn giờ chạy" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Ngày" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: dateStr, onChange: (e) => setDateStr(e.target.value), className: "h-8 text-xs" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Giờ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums font-medium", children: pad2(hour) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 23, value: hour, onChange: (e) => setHour(Number(e.target.value)), className: "w-full accent-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Phút" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "tabular-nums font-medium", children: pad2(minute) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 59, value: minute, onChange: (e) => setMinute(Number(e.target.value)), className: "w-full accent-primary" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/30 p-2 text-center text-xs", children: [
        "Chạy lúc:",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: preview ? formatSchedule(preview) : "—" }),
        isPast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-2xs text-amber-600 dark:text-amber-400", children: "Giờ đã qua — sẽ chạy ngay khi tới lượt." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        scheduledAt && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "flex-1",
            onClick: () => {
              onSchedule(null);
              setOpen(false);
            },
            children: "Bỏ hẹn"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            className: "flex-1",
            disabled: preview === null,
            onClick: () => {
              if (preview !== null) {
                onSchedule(preview);
                setOpen(false);
              }
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-1 h-3.5 w-3.5" }),
              "Xác nhận"
            ]
          }
        )
      ] })
    ] })
  ] });
}
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      CheckboxIndicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = Checkbox$1.displayName;
function Dashboard() {
  const { projects, createProject, deleteProject, renameProject } = useProjectStore();
  const { setActiveTab } = useMediaPanelStore();
  const { locale, t } = useI18n();
  const batchEntries = useBatchQueueStore((s) => s.entries);
  const [showNewProject, setShowNewProject] = reactExports.useState(false);
  const [newProjectName, setNewProjectName] = reactExports.useState("");
  const [selectionMode, setSelectionMode] = reactExports.useState(false);
  const [selectedIds, setSelectedIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [batchDeleteConfirm, setBatchDeleteConfirm] = reactExports.useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = reactExports.useState(false);
  const [renameTarget, setRenameTarget] = reactExports.useState(null);
  const [renameValue, setRenameValue] = reactExports.useState("");
  const [duplicatingId, setDuplicatingId] = reactExports.useState(null);
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
      await switchProject(project.id);
      setActiveTab("overview");
    }
  };
  const handleOpenProject = async (projectId) => {
    if (selectionMode) return;
    await switchProject(projectId);
    setActiveTab("overview");
  };
  const toggleSelectionMode = reactExports.useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(/* @__PURE__ */ new Set());
      return !prev;
    });
  }, []);
  const toggleSelect = reactExports.useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const handleSelectAll = reactExports.useCallback(() => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(/* @__PURE__ */ new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  }, [projects, selectedIds.size]);
  const handleBatchDelete = reactExports.useCallback(() => {
    selectedIds.forEach((id) => deleteProject(id));
    toast.success(t("dashboard.toast.deletedProjects", { count: selectedIds.size }));
    setSelectedIds(/* @__PURE__ */ new Set());
    setBatchDeleteConfirm(false);
    setSelectionMode(false);
  }, [deleteProject, selectedIds, t]);
  const openRenameDialog = reactExports.useCallback((id, name) => {
    setRenameTarget({ id, name });
    setRenameValue(name);
    setRenameDialogOpen(true);
  }, []);
  const handleRename = reactExports.useCallback(() => {
    if (!renameTarget || !renameValue.trim()) return;
    renameProject(renameTarget.id, renameValue.trim());
    setRenameDialogOpen(false);
    setRenameTarget(null);
    toast.success(t("dashboard.toast.renamed"));
  }, [renameProject, renameTarget, renameValue, t]);
  const handleDuplicate = reactExports.useCallback(async (projectId) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;
    setDuplicatingId(projectId);
    try {
      const fs = window.fileStorage;
      if (!fs) {
        toast.warning(t("dashboard.toast.storageUnavailable"));
        setDuplicatingId(null);
        return;
      }
      const currentPid = useProjectStore.getState().activeProjectId;
      if (currentPid === projectId) {
        useProjectStore.getState().setActiveProject(null);
      }
      await switchProject(projectId);
      await new Promise((r) => setTimeout(r, 500));
      const newProjectId = generateUUID();
      const newProjectName2 = `${source.name} (${t("dashboard.duplicateSuffix")})`;
      const KNOWN_STORES = [
        "director",
        "script",
        "sclass",
        "timeline",
        // createProjectScopedStorage
        "characters",
        "media",
        "scenes"
        // createSplitStorage (per-project portion)
      ];
      let copiedCount = 0;
      let keysToCopy = await fs.listKeys?.(`_p/${projectId}`) ?? [];
      console.log(`[Duplicate] listKeys('_p/${projectId}') → ${keysToCopy.length} keys:`, keysToCopy);
      if (keysToCopy.length === 0) {
        keysToCopy = KNOWN_STORES.map((s) => `_p/${projectId}/${s}`);
        console.log("[Duplicate] Fallback to known store names");
      }
      for (const key of keysToCopy) {
        const rawData = await fs.getItem(key);
        if (!rawData) continue;
        let dataToWrite = rawData;
        try {
          const parsed = JSON.parse(rawData);
          const state = parsed?.state ?? parsed;
          if (state && typeof state === "object") {
            if (state.activeProjectId === projectId) {
              state.activeProjectId = newProjectId;
            }
            if (state.projects && typeof state.projects === "object" && state.projects[projectId]) {
              state.projects[newProjectId] = state.projects[projectId];
              delete state.projects[projectId];
            }
          }
          dataToWrite = JSON.stringify(parsed);
        } catch {
          console.warn(`[Duplicate] Could not parse ${key}, copying raw`);
        }
        const newKey = key.replace(`_p/${projectId}`, `_p/${newProjectId}`);
        await fs.setItem(newKey, dataToWrite);
        copiedCount++;
        console.log(`[Duplicate] Copied: ${key} → ${newKey}`);
      }
      const newProject = {
        id: newProjectId,
        name: newProjectName2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      useProjectStore.setState((state) => ({
        projects: [newProject, ...state.projects]
      }));
      if (copiedCount > 0) {
        toast.success(t("dashboard.toast.duplicated", { name: source.name, count: copiedCount }));
      } else {
        toast.warning(t("dashboard.toast.duplicateNameOnly"));
      }
      useProjectStore.getState().setActiveProject(null);
    } catch (err) {
      console.error("[Duplicate] Failed:", err);
      toast.error(t("dashboard.toast.duplicateFailed", { message: err.message }));
    } finally {
      setDuplicatingId(null);
    }
  }, [projects, t]);
  const formatDate = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 6e4) return t("time.justNow");
    if (diff < 36e5) return t("time.minutesAgo", { count: Math.floor(diff / 6e4) });
    if (diff < 864e5) return t("time.hoursAgo", { count: Math.floor(diff / 36e5) });
    if (diff < 6048e5) return t("time.daysAgo", { count: Math.floor(diff / 864e5) });
    return new Date(timestamp).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  const allSelected = projects.length > 0 && selectedIds.size === projects.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { icon: Film }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-semibold", children: t("appHome.videoStudio.title") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        projects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: selectionMode ? "secondary" : "outline",
            size: "sm",
            onClick: toggleSelectionMode,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SquareCheckBig, { className: "w-4 h-4 mr-1.5" }),
              selectionMode ? t("dashboard.selection.exit") : t("dashboard.selection.manage")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: () => setShowNewProject(true),
            className: "font-medium",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
              t("dashboard.newProject")
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-5 py-6 lg:px-8 scrollbar-thin", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[1440px] mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-foreground mb-1 tracking-tight", children: t("dashboard.myProjects") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            t("dashboard.projectCount", { count: projects.length }),
            selectionMode && selectedIds.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary ml-2", children: [
              "· ",
              t("dashboard.selectedCount", { count: selectedIds.size })
            ] })
          ] })
        ] }),
        selectionMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleSelectAll, children: allSelected ? t("dashboard.clearSelection") : t("dashboard.selectAll") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "destructive",
              size: "sm",
              disabled: selectedIds.size === 0,
              onClick: () => setBatchDeleteConfirm(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5 mr-1.5" }),
                t("dashboard.deleteSelected", { count: selectedIds.size })
              ]
            }
          )
        ] })
      ] }),
      showNewProject && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 p-4 bg-card/80 border border-border/60 rounded-xl shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: t("dashboard.projectNamePlaceholder"),
            value: newProjectName,
            onChange: (e) => setNewProjectName(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleCreateProject(),
            className: "flex-1",
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCreateProject, disabled: !newProjectName.trim(), children: t("dashboard.create") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => {
              setShowNewProject(false);
              setNewProjectName("");
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }) }),
      !selectionMode && /* @__PURE__ */ jsxRuntimeExports.jsx(BatchQueuePanel, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4", children: [
        sortedProjects.map((project) => {
          const isSelected = selectedIds.has(project.id);
          const isDuplicating = duplicatingId === project.id;
          const batchStatus = selectProjectBatchStatus(batchEntries, project.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "group relative bg-card/80 border rounded-xl overflow-hidden transition-all duration-300",
                selectionMode ? isSelected ? "border-primary ring-2 ring-primary/20 shadow-sm cursor-pointer" : "border-border/60 cursor-pointer hover:border-border" : "border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              ),
              onClick: () => {
                if (selectionMode) {
                  toggleSelect(project.id);
                } else {
                  handleOpenProject(project.id);
                }
              },
              children: [
                selectionMode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-3 left-3 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Checkbox,
                  {
                    checked: isSelected,
                    onCheckedChange: () => toggleSelect(project.id),
                    onClick: (e) => e.stopPropagation(),
                    className: "bg-background/80 backdrop-blur-sm"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-32 bg-muted/30 flex items-center justify-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-10 h-10 text-muted-foreground/30" }),
                  batchStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 right-2 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BatchStatusBadge, { status: batchStatus.status, label: batchStatusLabel(batchStatus.status) }) }),
                  isDuplicating && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-background/60 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary" }) })
                ] }),
                batchStatus && (batchStatus.status === "running" || batchStatus.progress > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3.5 pt-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: batchStatus.progress, className: "h-1.5 flex-1" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-2xs tabular-nums text-muted-foreground", children: [
                      Math.round(batchStatus.progress),
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 truncate text-2xs text-muted-foreground", children: batchStatus.message || batchStatusLabel(batchStatus.status) })
                ] }),
                batchStatus?.status === "pending" && batchStatus.scheduledAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 px-3.5 pt-2 text-2xs text-primary", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "h-3 w-3" }),
                  "Hẹn ",
                  formatBatchSchedule(batchStatus.scheduledAt)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-foreground truncate mb-1.5", children: project.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-3 h-3" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatDate(project.updatedAt) })
                    ] }),
                    !selectionMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          onClick: (e) => e.stopPropagation(),
                          className: "opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted text-muted-foreground transition-all",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { className: "w-4 h-4" })
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", onClick: (e) => e.stopPropagation(), children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => openRenameDialog(project.id, project.name), children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4 mr-2" }),
                          t("dashboard.rename")
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          DropdownMenuItem,
                          {
                            onClick: () => handleDuplicate(project.id),
                            disabled: isDuplicating,
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-2" }),
                              t("dashboard.duplicate")
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          DropdownMenuItem,
                          {
                            className: "text-destructive focus:text-destructive",
                            onClick: () => {
                              deleteProject(project.id);
                              toast.success(t("dashboard.toast.deletedSingle", { name: project.name }));
                            },
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                              t("dashboard.delete")
                            ]
                          }
                        )
                      ] })
                    ] })
                  ] })
                ] }),
                !selectionMode && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 shadow-md", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-4 h-4" }),
                    t("dashboard.openProject")
                  ] }) })
                ] })
              ]
            },
            project.id
          );
        }),
        projects.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full flex flex-col items-center justify-center py-24 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-xl bg-muted/40 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "w-10 h-10 text-muted-foreground/40" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-foreground mb-2 tracking-tight", children: t("dashboard.emptyTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-8 max-w-xs", children: t("dashboard.emptyDescription") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowNewProject(true), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
            t("dashboard.newProject")
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: renameDialogOpen, onOpenChange: setRenameDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("dashboard.renameProject") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: renameValue,
          onChange: (e) => setRenameValue(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && handleRename(),
          placeholder: t("dashboard.newNamePlaceholder"),
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setRenameDialogOpen(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRename, disabled: !renameValue.trim(), children: t("common.confirm") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: batchDeleteConfirm, onOpenChange: setBatchDeleteConfirm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("dashboard.confirmBatchDelete") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("dashboard.batchDeleteMessage", { count: selectedIds.size }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setBatchDeleteConfirm(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: handleBatchDelete, children: t("common.confirm") })
      ] })
    ] }) })
  ] });
}
function batchStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Đang chờ";
    case "running":
      return "Đang chạy";
    case "done":
      return "Xong";
    case "failed":
      return "Lỗi";
    case "paused":
      return "Tạm dừng";
  }
}
function formatBatchSchedule(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}
function BatchStatusBadge({ status, label }) {
  const meta = {
    pending: { className: "bg-muted text-muted-foreground", Icon: Circle },
    running: { className: "bg-sky-600 text-white", Icon: LoaderCircle },
    done: { className: "bg-green-600 text-white", Icon: CircleCheck },
    failed: { className: "bg-red-600 text-white", Icon: CircleX },
    paused: { className: "bg-amber-500 text-white", Icon: Pause }
  };
  const { className, Icon } = meta[status];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium shadow-sm", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("h-3 w-3", status === "running" && "animate-spin") }),
    label
  ] });
}
const TAB_HEADER_CONTEXT = {
  overview: { labelKey: "nav.overview" },
  script: { labelKey: "nav.script", phaseKey: "stage.phase01" },
  promptImport: { labelKey: "nav.promptImport", phaseKey: "stage.phase01" },
  characters: { labelKey: "nav.characters", phaseKey: "stage.phase02" },
  scenes: { labelKey: "nav.scenes", phaseKey: "stage.phase02" },
  director: { labelKey: "nav.director", phaseKey: "stage.phase03" },
  export: { labelKey: "nav.export", phaseKey: "stage.phase04" },
  autoVideo: { labelKey: "nav.autoVideo", phaseKey: "stage.phase05" },
  media: { labelKey: "nav.media" },
  settings: { labelKey: "nav.settings" }
};
function ProjectHeader() {
  const { t } = useI18n();
  const { activeProject } = useProjectStore();
  const { activeTab, activeEpisodeIndex, backToSeries } = useMediaPanelStore();
  const scriptStore = useScriptStore();
  const [saveStatus, setSaveStatus] = reactExports.useState("saved");
  const saveTimeoutRef = reactExports.useRef(null);
  const lastUpdateRef = reactExports.useRef(0);
  const projectId = activeProject?.id;
  const scriptProject = projectId ? scriptStore.projects[projectId] : null;
  const currentUpdatedAt = scriptProject?.updatedAt || 0;
  reactExports.useEffect(() => {
    if (!projectId || currentUpdatedAt === 0) return;
    if (lastUpdateRef.current === currentUpdatedAt) return;
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => {
        setSaveStatus("saved");
        lastUpdateRef.current = currentUpdatedAt;
      }, 300);
    }, 1e3);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, currentUpdatedAt]);
  const headerContext = TAB_HEADER_CONTEXT[activeTab];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-11 bg-background border-b border-border/60 px-4 flex items-center justify-between shrink-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { className: "size-6 rounded-lg [&>svg]:size-3.5", icon: Film }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-foreground truncate max-w-[200px]", children: activeProject?.name || t("project.untitled") }),
      activeEpisodeIndex != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground/40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "text-xs text-primary hover:text-primary/80 font-medium transition-colors",
            onClick: backToSeries,
            title: t("project.backToSeries"),
            children: t("project.episode", { index: activeEpisodeIndex })
          }
        )
      ] }),
      headerContext && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/30", children: "/" }),
        headerContext.phaseKey && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/50 font-mono", children: t(headerContext.phaseKey) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t(headerContext.labelKey) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SaveStatusIndicator, { status: saveStatus }) })
  ] });
}
function SaveStatusIndicator({ status }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs uppercase tracking-widest transition-colors",
        status === "saved" && "text-success/60",
        status === "saving" && "text-warning/70",
        status === "unsaved" && "text-muted-foreground"
      ),
      children: [
        status === "saved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("save.saved") })
        ] }),
        status === "saving" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("save.saving") })
        ] }),
        status === "unsaved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CloudOff, { className: "w-3 h-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("save.unsaved") })
        ] })
      ]
    }
  );
}
const ScriptView = reactExports.lazy(() => __vitePreload(() => import("./index-DmYBfTJM.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]) : void 0, import.meta.url).then((module) => ({ default: module.ScriptView })));
const DirectorView = reactExports.lazy(() => __vitePreload(() => import("./index-C0AV6kWp.js"), true ? __vite__mapDeps([22,1,2,3,4,5,6,7,8,9,10,11,13,12,16,23,14,15,24,25,26,19,27,28,29,20,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.DirectorView })));
const CharactersView = reactExports.lazy(() => __vitePreload(() => import("./index-DsJ3rgw_.js"), true ? __vite__mapDeps([30,1,2,3,4,5,6,7,8,9,10,18,25,11,12,15,14,16,27,28,31,32,29,19,33,17,13,20,21]) : void 0, import.meta.url).then((module) => ({ default: module.CharactersView })));
const ScenesView = reactExports.lazy(() => __vitePreload(() => import("./index-Dx1Yj-e3.js"), true ? __vite__mapDeps([34,1,2,3,4,5,6,7,8,9,10,18,25,29,11,12,15,13,14,16,28,31,27,32,26,19,33,17,20,21]) : void 0, import.meta.url).then((module) => ({ default: module.ScenesView })));
const MediaView = reactExports.lazy(() => __vitePreload(() => import("./index-DDD82jAi.js"), true ? __vite__mapDeps([35,1,2,3,4,5,6,7,8,9,10,15,19,33,20,16,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.MediaView })));
const SettingsPanel = reactExports.lazy(() => __vitePreload(() => import("./SettingsPanel-BqjYbQRh.js"), true ? __vite__mapDeps([36,1,2,3,6,7,8,15,4,5,9,10,12,13,11,37,28,38,39,23,20,16,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.SettingsPanel })));
const ExportView = reactExports.lazy(() => __vitePreload(() => import("./index-Pjvxl2Gv.js"), true ? __vite__mapDeps([40,1,2,3,4,5,6,7,8,9,10,15,20,27,31,16,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.ExportView })));
const AutoVideoView = reactExports.lazy(() => __vitePreload(() => import("./index-L3ZTVkO8.js"), true ? __vite__mapDeps([41,1,2,3,6,7,8,5,12,15,20,11,42,10,37]) : void 0, import.meta.url).then((module) => ({ default: module.AutoVideoView })));
const AutopilotPanel = reactExports.lazy(() => __vitePreload(() => import("./autopilot-panel-BPgLR_w7.js"), true ? __vite__mapDeps([43,1,2,3,6,7,8,25,4,5,9,10,12,15,11,37,14,16,44,42,27,31,19,24,26,20,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.AutopilotPanel })));
const OverviewPanel = reactExports.lazy(() => __vitePreload(() => import("./index-BEDTC9kF.js"), true ? __vite__mapDeps([45,1,2,3,4,5,6,7,8,9,10,18,39,11,15,20,16,21]) : void 0, import.meta.url).then((module) => ({ default: module.OverviewPanel })));
const PromptImportView = reactExports.lazy(() => __vitePreload(() => import("./index-CVW_xSoP.js"), true ? __vite__mapDeps([46,1,2,3,6,7,8,11,5,4,9,10,15,20,16,21,18]) : void 0, import.meta.url).then((module) => ({ default: module.PromptImportView })));
function LazyPanel({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }), children });
}
function Layout() {
  const { activeTab, inProject, setActiveTab } = useMediaPanelStore();
  const activeProject = useProjectStore((state) => state.activeProject);
  const plan = useLicenseStore((state) => state.plan);
  const autoVideoBlocked = inProject && activeTab === "autoVideo" && true;
  const autopilotBlocked = inProject && activeTab === "autopilot" && !hasPlanAccess(plan, "dev");
  const effectiveTab = autoVideoBlocked || autopilotBlocked ? "overview" : activeTab;
  reactExports.useEffect(() => {
    if (autoVideoBlocked || autopilotBlocked) setActiveTab("overview");
  }, [autoVideoBlocked, autopilotBlocked, setActiveTab]);
  if (inProject && !activeProject) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) }) })
    ] });
  }
  if (!inProject) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0", children: activeTab === "settings" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LazyPanel, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsPanel, {}) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) }) })
    ] });
  }
  const fullScreenTabs = ["export", "autoVideo", "autopilot", "settings", "overview", "script", "promptImport", "characters", "scenes"];
  if (fullScreenTabs.includes(effectiveTab)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectHeader, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(LazyPanel, { children: [
          effectiveTab === "export" && /* @__PURE__ */ jsxRuntimeExports.jsx(ExportView, {}),
          effectiveTab === "autoVideo" && /* @__PURE__ */ jsxRuntimeExports.jsx(AutoVideoView, {}),
          effectiveTab === "autopilot" && /* @__PURE__ */ jsxRuntimeExports.jsx(AutopilotPanel, {}),
          effectiveTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsPanel, {}),
          effectiveTab === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewPanel, {}),
          effectiveTab === "script" && /* @__PURE__ */ jsxRuntimeExports.jsx(ScriptView, {}),
          effectiveTab === "promptImport" && /* @__PURE__ */ jsxRuntimeExports.jsx(PromptImportView, {}),
          effectiveTab === "characters" && /* @__PURE__ */ jsxRuntimeExports.jsx(CharactersView, {}),
          effectiveTab === "scenes" && /* @__PURE__ */ jsxRuntimeExports.jsx(ScenesView, {})
        ] })
      ] })
    ] });
  }
  const renderLeftPanel = () => {
    let panel;
    switch (activeTab) {
      case "script":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(ScriptView, {});
        break;
      case "promptImport":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(PromptImportView, {});
        break;
      case "director":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(DirectorView, {});
        break;
      case "characters":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(CharactersView, {});
        break;
      case "scenes":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(ScenesView, {});
        break;
      case "media":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(MediaView, {});
        break;
      case "settings":
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsPanel, {});
        break;
      default:
        panel = /* @__PURE__ */ jsxRuntimeExports.jsx(ScriptView, {});
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LazyPanel, { children: panel });
  };
  const renderRightPanel = () => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RightPanel, {});
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TabBar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-0 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(ResizablePanelGroup, { direction: "horizontal", className: "min-h-0 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 30, minSize: 20, maxSize: 42, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 overflow-hidden bg-panel border-r border-border/60", children: renderLeftPanel() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 45, minSize: 24, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PreviewPanel, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizableHandle, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ResizablePanel, { defaultSize: 25, minSize: 18, maxSize: 35, className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full min-w-0 overflow-hidden border-l border-border/60 bg-panel", children: renderRightPanel() }) })
      ] }) })
    ] })
  ] });
}
const MIGRATION_FLAG_KEY = "_p/_migrated";
const RECOVERY_FLAG_KEY = "_p/_legacy_recovery_v1";
async function migrateToProjectStorage() {
  if (!window.fileStorage) return;
  try {
    const flagExists = await window.fileStorage.exists(MIGRATION_FLAG_KEY);
    if (flagExists) {
      console.log("[Migration] Already migrated, skipping.");
      return;
    }
  } catch {
    const flag = await fileStorage.getItem(MIGRATION_FLAG_KEY);
    if (flag) return;
  }
  console.log("[Migration] Starting per-project migration...");
  try {
    const projectStoreRaw = await fileStorage.getItem("longdd-project-store");
    if (!projectStoreRaw) {
      console.log("[Migration] No project store found, nothing to migrate.");
      await writeMigrationFlag();
      return;
    }
    const projectStoreData = JSON.parse(projectStoreRaw);
    const projectState = projectStoreData.state ?? projectStoreData;
    const projectIds = (projectState.projects ?? []).map((p) => p.id);
    if (projectIds.length === 0) {
      console.log("[Migration] No projects found, nothing to migrate.");
      await writeMigrationFlag();
      return;
    }
    console.log(`[Migration] Found ${projectIds.length} projects: ${projectIds.map((id) => id.substring(0, 8)).join(", ")}`);
    await migrateRecordStore("longdd-script-store", "script");
    await migrateRecordStore("longdd-director-store", "director");
    await migrateFlatStore("longdd-media-store", "media", projectIds, {
      arrayKeys: ["mediaFiles", "folders"],
      projectIdField: "projectId",
      sharedFilter: (item, key) => {
        if (key === "folders") return item.isSystem || !item.projectId;
        return !item.projectId;
      }
    });
    await migrateFlatStore("longdd-character-library", "characters", projectIds, {
      arrayKeys: ["characters", "folders"],
      projectIdField: "projectId",
      sharedFilter: (item) => !item.projectId
    });
    await migrateFlatStore("longdd-scene-store", "scenes", projectIds, {
      arrayKeys: ["scenes", "folders"],
      projectIdField: "projectId",
      sharedFilter: (item) => !item.projectId
    });
    await migrateTimelineStore(projectState.activeProjectId || projectIds[0]);
    await writeMigrationFlag();
    console.log("[Migration] ✅ Migration complete! Old files remain as fallback.");
  } catch (error) {
    console.error("[Migration] ❌ Migration failed:", error);
  }
}
async function migrateRecordStore(legacyKey, storeName) {
  const raw = await fileStorage.getItem(legacyKey);
  if (!raw) {
    console.log(`[Migration] ${legacyKey} not found, skipping.`);
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const state = parsed.state ?? parsed;
    const projects = state.projects;
    if (!projects || typeof projects !== "object") {
      console.log(`[Migration] ${legacyKey} has no projects record, skipping.`);
      return;
    }
    let migratedCount = 0;
    for (const pid of Object.keys(projects)) {
      const projectData = projects[pid];
      if (!projectData) continue;
      const key = `_p/${pid}/${storeName}`;
      const payload = JSON.stringify({
        state: {
          activeProjectId: pid,
          projectData,
          // For director-store, also include config
          ...state.config ? { config: state.config } : {}
        },
        version: parsed.version ?? 0
      });
      await fileStorage.setItem(key, payload);
      migratedCount++;
    }
    console.log(`[Migration] ${legacyKey}: migrated ${migratedCount} projects to per-project files.`);
  } catch (error) {
    console.error(`[Migration] Failed to migrate ${legacyKey}:`, error);
  }
}
async function migrateFlatStore(legacyKey, storeName, projectIds, config) {
  const raw = await fileStorage.getItem(legacyKey);
  if (!raw) {
    console.log(`[Migration] ${legacyKey} not found, skipping.`);
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const state = parsed.state ?? parsed;
    const version = parsed.version ?? 0;
    const sharedState = {};
    for (const key of config.arrayKeys) {
      const arr = state[key] ?? [];
      sharedState[key] = arr.filter((item) => config.sharedFilter(item, key));
    }
    const sharedKey = `_shared/${storeName}`;
    await fileStorage.setItem(sharedKey, JSON.stringify({ state: sharedState, version }));
    let migratedCount = 0;
    for (const pid of projectIds) {
      const projectState = {};
      let hasData = false;
      for (const key of config.arrayKeys) {
        const arr = state[key] ?? [];
        const projectItems = arr.filter((item) => {
          if (key === "folders" && item.isSystem) return false;
          return item[config.projectIdField] === pid;
        });
        projectState[key] = projectItems;
        if (projectItems.length > 0) hasData = true;
      }
      if (hasData) {
        const projectKey = `_p/${pid}/${storeName}`;
        await fileStorage.setItem(projectKey, JSON.stringify({ state: projectState, version }));
        migratedCount++;
      }
    }
    console.log(`[Migration] ${legacyKey}: migrated ${migratedCount} project files + 1 shared file.`);
  } catch (error) {
    console.error(`[Migration] Failed to migrate ${legacyKey}:`, error);
  }
}
async function migrateTimelineStore(activeProjectId) {
  const raw = await fileStorage.getItem("longdd-timeline-store");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const state = parsed.state ?? parsed;
    if (state.clips && state.clips.length > 0) {
      const key = `_p/${activeProjectId}/timeline`;
      await fileStorage.setItem(key, raw);
      console.log(`[Migration] Timeline: migrated ${state.clips.length} clips to project ${activeProjectId.substring(0, 8)}`);
    }
  } catch (error) {
    console.error("[Migration] Failed to migrate timeline:", error);
  }
}
async function recoverFromLegacy() {
  if (!window.fileStorage) return;
  try {
    const flagExists = await window.fileStorage.exists(MIGRATION_FLAG_KEY);
    if (!flagExists) return;
  } catch {
    return;
  }
  try {
    const recoveryComplete = await window.fileStorage.exists(RECOVERY_FLAG_KEY);
    if (recoveryComplete) return;
  } catch {
    const recoveryFlag = await fileStorage.getItem(RECOVERY_FLAG_KEY);
    if (recoveryFlag) return;
  }
  console.log("[Recovery] Checking for data that needs recovery from legacy files...");
  try {
    await recoverRecordStore("longdd-script-store", "script", isScriptDataRich);
    await recoverRecordStore("longdd-director-store", "director", isDirectorDataRich);
    await fileStorage.setItem(RECOVERY_FLAG_KEY, JSON.stringify({
      recoveredAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: 1
    }));
    console.log("[Recovery] Recovery check complete.");
  } catch (error) {
    console.error("[Recovery] Recovery failed:", error);
  }
}
function isScriptDataRich(data) {
  if (!data) return false;
  if (data.rawScript && data.rawScript.length > 10) return true;
  if (data.shots && data.shots.length > 0) return true;
  if (data.scriptData && data.scriptData.episodes && data.scriptData.episodes.length > 0) return true;
  if (data.episodeRawScripts && data.episodeRawScripts.length > 0) return true;
  return false;
}
function isDirectorDataRich(data) {
  if (!data) return false;
  if (data.splitScenes && data.splitScenes.length > 0) return true;
  if (data.screenplay) return true;
  if (data.storyboardImage) return true;
  return false;
}
async function recoverRecordStore(legacyKey, storeName, isRich) {
  const legacyRaw = await window.fileStorage.getItem(legacyKey);
  if (!legacyRaw) return;
  try {
    const parsed = JSON.parse(legacyRaw);
    const state = parsed.state ?? parsed;
    const projects = state.projects;
    if (!projects || typeof projects !== "object") return;
    let recoveredCount = 0;
    for (const pid of Object.keys(projects)) {
      const legacyData = projects[pid];
      if (!legacyData || !isRich(legacyData)) continue;
      const projectKey = `_p/${pid}/${storeName}`;
      const currentRaw = await window.fileStorage.getItem(projectKey);
      let currentData = null;
      if (currentRaw) {
        try {
          const currentParsed = JSON.parse(currentRaw);
          const currentState = currentParsed.state ?? currentParsed;
          currentData = currentState.projectData ?? currentState;
        } catch {
        }
      }
      if (!isRich(currentData)) {
        const payload = JSON.stringify({
          state: {
            activeProjectId: pid,
            projectData: legacyData,
            ...state.config ? { config: state.config } : {}
          },
          version: parsed.version ?? 0
        });
        await fileStorage.setItem(projectKey, payload);
        recoveredCount++;
        console.log(`[Recovery] Restored ${storeName} for project ${pid.substring(0, 8)} from legacy data`);
      }
    }
    if (recoveredCount > 0) {
      console.log(`[Recovery] ${legacyKey}: recovered ${recoveredCount} projects`);
    }
  } catch (error) {
    console.error(`[Recovery] Failed to recover ${legacyKey}:`, error);
  }
}
async function writeMigrationFlag() {
  const flag = JSON.stringify({
    migratedAt: (/* @__PURE__ */ new Date()).toISOString(),
    version: 1
  });
  await fileStorage.setItem(MIGRATION_FLAG_KEY, flag);
  console.log("[Migration] Migration flag written.");
}
const MODEL_SYNC_CACHE_KEY = "longdd-video-studio-model-sync";
const MODEL_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1e3;
let storageReadyPromise = null;
let browserInitializationPromise = null;
let backgroundInitializationPromise = null;
function ensureStorageReady() {
  if (!storageReadyPromise) {
    performance.mark("video-studio:storage-start");
    storageReadyPromise = migrateToProjectStorage().finally(() => {
      performance.mark("video-studio:storage-end");
      performance.measure("video-studio:storage", "video-studio:storage-start", "video-studio:storage-end");
    });
  }
  return storageReadyPromise;
}
function scheduleIdleTask(task, timeout = 1200) {
  if ("requestIdleCallback" in window) {
    const id2 = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id2);
  }
  const id = globalThis.setTimeout(task, Math.min(timeout, 250));
  return () => globalThis.clearTimeout(id);
}
function initializeBrowserProviders() {
  browserInitializationPromise ??= (async () => {
    performance.mark("video-studio:browser-providers-start");
    await useVideoStudioSettingsStore.persist.rehydrate();
    const hideAfterLogin = useVideoStudioSettingsStore.getState().hideLoginBrowser;
    await window.videoStudioBrowser?.setHideAfterLogin(hideAfterLogin);
    await window.videoStudioBrowser?.startRuntimes();
  })().finally(() => {
    performance.mark("video-studio:browser-providers-end");
    performance.measure("video-studio:browser-providers", "video-studio:browser-providers-start", "video-studio:browser-providers-end");
  });
  return browserInitializationPromise;
}
function readModelSyncCache() {
  try {
    const value = JSON.parse(localStorage.getItem(MODEL_SYNC_CACHE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
function writeModelSyncCache(cache) {
  try {
    localStorage.setItem(MODEL_SYNC_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}
async function syncConfiguredProviderModelsInBackground() {
  const { providers, syncProviderModels } = useAPIConfigStore.getState();
  const configuredProviders = providers.filter(
    (provider) => isProviderCredentialConfigured(provider.platform, provider.apiKey)
  );
  const cache = readModelSyncCache();
  const now = Date.now();
  const providersToSync = configuredProviders.filter(
    (provider) => !cache[provider.id] || now - cache[provider.id] >= MODEL_SYNC_INTERVAL_MS
  );
  await Promise.allSettled(providersToSync.map(async (provider) => {
    try {
      const result = await syncProviderModels(provider.id);
      if (result.success) {
        cache[provider.id] = Date.now();
        writeModelSyncCache(cache);
      } else {
        console.warn(`[VideoStudio] Background model sync skipped for ${provider.name}: ${result.error || "unknown error"}`);
      }
    } catch (error) {
      console.warn(`[VideoStudio] Background model sync failed for ${provider.name}:`, error);
    }
  }));
}
function initializeVideoStudioInBackground() {
  if (!backgroundInitializationPromise) {
    performance.mark("video-studio:background-start");
    backgroundInitializationPromise = Promise.allSettled([
      (async () => {
        await recoverFromLegacy();
        await useDirectorStore.persist.rehydrate();
        useDirectorStore.getState().resetInflightStatuses();
      })(),
      syncConfiguredProviderModelsInBackground()
    ]).then(() => void 0).finally(() => {
      performance.mark("video-studio:background-end");
      performance.measure("video-studio:background", "video-studio:background-start", "video-studio:background-end");
    });
  }
  return backgroundInitializationPromise;
}
function VideoStudioFeature() {
  const { t } = useI18n();
  const [isInitializing, setIsInitializing] = reactExports.useState(true);
  reactExports.useEffect(() => {
    performance.mark("video-studio:route-start");
    useMediaPanelStore.getState().setInProject(false);
    let cancelled = false;
    let cancelBackgroundInitialization = () => {
    };
    const initialize = async () => {
      try {
        await ensureStorageReady();
      } catch (error) {
        console.error("[VideoStudio] Initialization error:", error);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
          window.requestAnimationFrame(() => {
            performance.mark("video-studio:first-paint");
            performance.measure("video-studio:route-to-first-paint", "video-studio:route-start", "video-studio:first-paint");
          });
          cancelBackgroundInitialization = scheduleIdleTask(() => {
            void initializeBrowserProviders().catch((error) => {
              console.error("[VideoStudio] Browser provider initialization error:", error);
            });
            void initializeVideoStudioInBackground();
          });
        }
      }
    };
    void initialize();
    return () => {
      cancelled = true;
      cancelBackgroundInitialization();
    };
  }, []);
  if (isInitializing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("appHome.openingVideoStudio") })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, {});
}
const entry = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: VideoStudioFeature
}, Symbol.toStringTag, { value: "Module" }));
export {
  Checkbox as C,
  VIDEO_STUDIO_FEATURE_FLAGS as V,
  getPromptTargetStatus as a,
  usePreviewStore as b,
  calculateProgress as c,
  useBatchQueueStore as d,
  entry as e,
  getShotCompletionStatus as g,
  useMediaPanelStore as u
};
