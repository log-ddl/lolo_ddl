import { j as jsxRuntimeExports, r as reactDomExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, bi as Monitor, bj as Smartphone, u as CircleAlert, z as Users, K as Plus, bh as User, a3 as Check, X, bk as ImagePlus, W as WandSparkles, L as LoaderCircle, q as RefreshCw, b9 as Image$1, J as ArrowLeft, t as CircleCheck, S as Scissors, a7 as FolderOpen, G as Clapperboard, aZ as Sparkles, aP as Volume2, aO as VolumeX, aC as Square, _ as Play, m as ArrowRight, O as ChevronRight, f as ChevronLeft } from "./lucide-react-DHCwBhKI.js";
import { B as readImageAsBase64, c as useProjectVisualStyleId, e as useActiveDirectorProject, C as getStyleById, s as setProjectVisualStyleId, d as useDirectorStore, h as useCharacterLibraryStore, p as normalizeRefImageIndexes, n as normalizeVideoLength, V as VISUAL_STYLE_PRESETS, E as getStyleTokens, F as isIdbImagePath, z as saveImageToLocal, f as useSceneStore, m as useAPIConfigStore, q as getFeatureConfig, G as getStylePrompt, H as syncRuntimeLaneSettings, I as resolveLaneCount, J as buildLaneWorkers, K as getGenerationFlowSettings, L as runLaneQueue, M as withRetry, N as randomBetween, O as isAbortLikeError, g as googleFlowProvider, A as getFeatureNotConfiguredMessage, P as saveVideoToLocal, D as DEFAULT_STYLE_ID, k as useMediaStore, j as useScriptStore, Q as retryOperation } from "./autopilot-store-i3rmgegs.js";
import { a as useProjectStore, s as splitVideoPromptVoiceOver, b as buildPromptVoiceOverSuffix } from "./auto-video-store-Cd8fXBc8.js";
import { u as useMediaPanelStore } from "./entry-CEuYoVRr.js";
import { a as useI18n, b as useVideoStudioSettingsStore, t as toast, B as Button, T as TooltipProvider, U as Tooltip, V as TooltipTrigger, W as TooltipContent, I as Input, c as cn } from "./index-ld1jMZXM.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-ZlGxq1Za.js";
import { L as Label } from "./label-DOUrVQeY.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-CuPNgqie.js";
import { i as isImageHostConfigured, u as uploadToImageHost } from "./image-host-Cffd4T6U.js";
import { S as StylePicker } from "./index-D6U0ie8M.js";
import { S as SplitSceneCard } from "./split-scene-card-C0N96cGk.js";
import { u as useNow } from "./use-now-BZ1xkfxg.js";
import { u as useGoogleFlowRuntimeStore } from "./google-flow-runtime-store-S1TkgWH5.js";
import { g as getSourceFingerprint, s as submitGridImageRequest } from "./source-fingerprint-B0Cw_jDf.js";
import { t as taskMetadata } from "./model-registry-C5c6bagc.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DnVmcEKu.js";
import "./cors-fetch-CkwbEcad.js";
import "./dropdown-menu-D7DihKO-.js";
import "./progress-CoGwezcY.js";
import "./FeatureHeaderIcon-DurhyC1w.js";
import "./resizable-ZbW8XN3y.js";
import "./use-resolved-image-url-PaRm8NoY.js";
import "./task-info-button-Dug1kt_w.js";
import "./local-image-DQvys8BA.js";
const RESOLUTION_PRESETS = {
  "2K": {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 }
  },
  "4K": {
    "16:9": { width: 3840, height: 2160 },
    "9:16": { width: 2160, height: 3840 }
  }
};
const SCENE_LIMITS = {
  "2K": 12,
  "4K": 48
};
function calculateLandscapeGrid(sceneCount, canvasWidth, canvasHeight) {
  let bestConfig = null;
  let bestMinDimension = 0;
  for (let cols = 1; cols <= sceneCount; cols++) {
    const rows = Math.ceil(sceneCount / cols);
    if (cols * rows - sceneCount >= cols) continue;
    const cellWidth = Math.floor(canvasWidth / cols);
    const cellHeight = Math.floor(cellWidth * 9 / 16);
    const totalHeight = cellHeight * rows;
    if (totalHeight > canvasHeight) continue;
    if (cols < rows && sceneCount > 1) continue;
    const minDim = Math.min(cellWidth, cellHeight);
    if (minDim > bestMinDimension) {
      bestMinDimension = minDim;
      bestConfig = {
        cols,
        rows,
        cellWidth,
        cellHeight,
        canvasWidth,
        canvasHeight,
        totalCells: cols * rows,
        emptyCells: cols * rows - sceneCount
      };
    }
  }
  if (!bestConfig) {
    const cols = Math.ceil(Math.sqrt(sceneCount));
    const rows = Math.ceil(sceneCount / cols);
    const cellWidth = Math.floor(canvasWidth / cols);
    const cellHeight = Math.floor(cellWidth * 9 / 16);
    bestConfig = {
      cols,
      rows,
      cellWidth,
      cellHeight,
      canvasWidth,
      canvasHeight,
      totalCells: cols * rows,
      emptyCells: cols * rows - sceneCount
    };
  }
  return bestConfig;
}
function calculatePortraitGrid(sceneCount, canvasWidth, canvasHeight) {
  let bestConfig = null;
  let bestMinDimension = 0;
  for (let rows = 1; rows <= sceneCount; rows++) {
    const cols = Math.ceil(sceneCount / rows);
    if (cols * rows - sceneCount >= rows) continue;
    const cellHeight = Math.floor(canvasHeight / rows);
    const cellWidth = Math.floor(cellHeight * 9 / 16);
    const totalWidth = cellWidth * cols;
    if (totalWidth > canvasWidth) continue;
    if (rows < cols && sceneCount > 1) continue;
    const minDim = Math.min(cellWidth, cellHeight);
    if (minDim > bestMinDimension) {
      bestMinDimension = minDim;
      bestConfig = {
        cols,
        rows,
        cellWidth,
        cellHeight,
        canvasWidth,
        canvasHeight,
        totalCells: cols * rows,
        emptyCells: cols * rows - sceneCount
      };
    }
  }
  if (!bestConfig) {
    const rows = Math.ceil(Math.sqrt(sceneCount));
    const cols = Math.ceil(sceneCount / rows);
    const cellHeight = Math.floor(canvasHeight / rows);
    const cellWidth = Math.floor(cellHeight * 9 / 16);
    bestConfig = {
      cols,
      rows,
      cellWidth,
      cellHeight,
      canvasWidth,
      canvasHeight,
      totalCells: cols * rows,
      emptyCells: cols * rows - sceneCount
    };
  }
  return bestConfig;
}
const OPTIMAL_LAYOUTS = {
  // 4 scenes: 2x2 grid
  4: { landscape: { cols: 2, rows: 2 }, portrait: { cols: 2, rows: 2 } },
  // 6 scenes: 3x2 or 2x3
  6: { landscape: { cols: 3, rows: 2 }, portrait: { cols: 2, rows: 3 } },
  // 8 scenes: 4x2 or 2x4
  8: { landscape: { cols: 4, rows: 2 }, portrait: { cols: 2, rows: 4 } },
  // 9 scenes: 3x3 grid (optimal)
  9: { landscape: { cols: 3, rows: 3 }, portrait: { cols: 3, rows: 3 } },
  // 10 scenes: 5x2 or 2x5
  10: { landscape: { cols: 5, rows: 2 }, portrait: { cols: 2, rows: 5 } },
  // 12 scenes: 4x3 or 3x4 (avoid 6x2 or 2x6)
  12: { landscape: { cols: 4, rows: 3 }, portrait: { cols: 3, rows: 4 } }
};
function calculateGrid(input) {
  const { sceneCount, aspectRatio, resolution } = input;
  const preset = RESOLUTION_PRESETS[resolution][aspectRatio];
  const { width: canvasWidth, height: canvasHeight } = preset;
  if (sceneCount <= 0) {
    return {
      cols: 1,
      rows: 1,
      cellWidth: canvasWidth,
      cellHeight: canvasHeight,
      canvasWidth,
      canvasHeight,
      totalCells: 1,
      emptyCells: 1
    };
  }
  if (sceneCount === 1) {
    return {
      cols: 1,
      rows: 1,
      cellWidth: canvasWidth,
      cellHeight: canvasHeight,
      canvasWidth,
      canvasHeight,
      totalCells: 1,
      emptyCells: 0
    };
  }
  const optimalLayout = OPTIMAL_LAYOUTS[sceneCount];
  if (optimalLayout) {
    const layout = aspectRatio === "16:9" ? optimalLayout.landscape : optimalLayout.portrait;
    const { cols, rows } = layout;
    let cellWidth, cellHeight;
    if (aspectRatio === "16:9") {
      cellWidth = Math.floor(canvasWidth / cols);
      cellHeight = Math.floor(cellWidth * 9 / 16);
    } else {
      cellHeight = Math.floor(canvasHeight / rows);
      cellWidth = Math.floor(cellHeight * 9 / 16);
    }
    console.log(`[GridCalculator] Using optimal layout for ${sceneCount} scenes: ${cols}x${rows} (${aspectRatio})`);
    return {
      cols,
      rows,
      cellWidth,
      cellHeight,
      canvasWidth,
      canvasHeight,
      totalCells: cols * rows,
      emptyCells: cols * rows - sceneCount
    };
  }
  if (aspectRatio === "16:9") {
    return calculateLandscapeGrid(sceneCount, canvasWidth, canvasHeight);
  } else {
    return calculatePortraitGrid(sceneCount, canvasWidth, canvasHeight);
  }
}
function validateSceneCount(sceneCount, resolution) {
  const limit = SCENE_LIMITS[resolution];
  const isValid = sceneCount <= limit;
  return {
    isValid,
    limit,
    message: isValid ? "" : `Scene count exceeds the ${resolution} resolution limit (max ${limit}). Switch to a higher resolution or reduce the scene count.`
  };
}
async function uploadBase64Image(imageData) {
  if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
    return imageData;
  }
  let base64Data = imageData;
  if (imageData.startsWith("local-image://")) {
    const converted = await readImageAsBase64(imageData);
    if (!converted) {
      throw new Error(`Unable to read local image: ${imageData}`);
    }
    base64Data = converted;
  }
  if (!base64Data.startsWith("data:image/")) {
    throw new Error("Invalid image data: must be base64 data URI, HTTP URL, or local-image:// path");
  }
  if (!isImageHostConfigured()) {
    throw new Error("Image host is not configured");
  }
  const result = await uploadToImageHost(base64Data, {
    // 180 days for hosts that support expiration-style parameters
    expiration: 15552e3
  });
  if (result.success && result.url) {
    return result.url;
  }
  throw new Error(result.error || "Image upload failed");
}
async function uploadMultipleImages(base64Images) {
  if (base64Images.length === 0) return [];
  if (!isImageHostConfigured()) {
    throw new Error("Image host is not configured");
  }
  const results = await Promise.allSettled(
    base64Images.map((img) => uploadBase64Image(img))
  );
  const urls = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      urls.push(result.value);
    } else {
      console.warn(`[ImageUpload] Image ${index} upload failed:`, result.reason);
    }
  });
  return urls;
}
const EXAMPLE_PROMPTS = [
  "A cute kitten plays on the grass, chasing butterflies.",
  "Two close friends walk through a park, sharing a joyful afternoon.",
  "A rabbit and a bear explore the forest and discover a mysterious treasure.",
  "A little girl builds a sandcastle by the sea while waves roll in softly."
];
function ScreenplayInput({ onGenerateStoryboard }) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const activeDirectorProject = useActiveDirectorProject();
  const savedConfig = activeDirectorProject?.storyboardConfig;
  const savedDraft = activeDirectorProject?.screenplayDraft;
  const lastHydratedProjectIdRef = reactExports.useRef(null);
  const savedStyleId = savedConfig?.visualStyleId;
  const initialStyleId = savedStyleId && getStyleById(savedStyleId) ? savedStyleId : projectVisualStyleId;
  const initialResolution = savedConfig?.resolution === "4K" ? "4K" : "2K";
  const [prompt, setPrompt] = reactExports.useState(savedDraft?.prompt || "");
  const [images, setImages] = reactExports.useState([]);
  const imageUrls = reactExports.useMemo(() => images.map((img) => URL.createObjectURL(img)), [images]);
  reactExports.useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [sceneCount, setSceneCount] = reactExports.useState(savedConfig?.sceneCount || 4);
  const [styleId, setStyleId] = reactExports.useState(initialStyleId);
  const [selectedCharacters, setSelectedCharacters] = reactExports.useState([]);
  const [isDragOver, setIsDragOver] = reactExports.useState(false);
  const [isCharacterPopoverOpen, setIsCharacterPopoverOpen] = reactExports.useState(false);
  const [aspectRatio, setAspectRatio] = reactExports.useState(savedConfig?.aspectRatio || "9:16");
  const [resolution, setResolution] = reactExports.useState(initialResolution);
  const dropZoneRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    setStyleId(projectVisualStyleId);
  }, [projectVisualStyleId]);
  const handleStyleChange = reactExports.useCallback((nextStyleId) => {
    if (!setProjectVisualStyleId(nextStyleId)) return;
    setStyleId(nextStyleId);
  }, []);
  const sceneValidation = validateSceneCount(sceneCount, resolution);
  const isSceneCountValid = sceneValidation.isValid;
  const { setScreenplayDraft, setSplitScenes, setStoryboardStatus } = useDirectorStore();
  const { characters } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const visibleCharacters = reactExports.useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeProjectId) return [];
    return characters.filter((c) => c.projectId === activeProjectId);
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);
  const { setActiveTab, pendingDirectorData, setPendingDirectorData } = useMediaPanelStore();
  const selectedCharacterIds = reactExports.useMemo(
    () => selectedCharacters.map((c) => c.characterId),
    [selectedCharacters]
  );
  const resolveDraftCharacters = reactExports.useCallback((characterIds) => {
    if (!characterIds?.length) return [];
    const seen = /* @__PURE__ */ new Set();
    return characterIds.map((id) => {
      const libChar = visibleCharacters.find((c) => c.id === id);
      if (!libChar || seen.has(libChar.id)) return null;
      seen.add(libChar.id);
      return {
        characterId: libChar.id,
        characterName: libChar.name,
        characterPrompt: libChar.characterPrompt || libChar.description || "",
        thumbnailUrl: libChar.thumbnailUrl
      };
    }).filter(Boolean);
  }, [visibleCharacters]);
  reactExports.useEffect(() => {
    if (!activeProjectId || !activeDirectorProject) return;
    if (pendingDirectorData) return;
    if (lastHydratedProjectIdRef.current === activeProjectId) return;
    const draftCharacterIds = savedDraft?.selectedCharacterIds || [];
    if (draftCharacterIds.length > 0 && visibleCharacters.length === 0) return;
    const restoredCharacters = resolveDraftCharacters(draftCharacterIds);
    lastHydratedProjectIdRef.current = activeProjectId;
    setPrompt(savedDraft?.prompt || "");
    setSelectedCharacters(restoredCharacters);
  }, [
    activeProjectId,
    activeDirectorProject,
    pendingDirectorData,
    savedDraft,
    visibleCharacters.length,
    resolveDraftCharacters
  ]);
  reactExports.useEffect(() => {
    if (!pendingDirectorData) return;
    if (pendingDirectorData.prebuiltScenes && pendingDirectorData.prebuiltScenes.length > 0) {
      const resolveCharacterIds = (ids, names) => {
        if (ids?.length) return ids;
        if (!names?.length) return [];
        const resolved = [];
        const seen = /* @__PURE__ */ new Set();
        for (const name of names) {
          const character = visibleCharacters.find((c) => c.name === name || c.name.includes(name) || name.includes(c.name));
          if (character && !seen.has(character.id)) {
            resolved.push(character.id);
            seen.add(character.id);
          }
        }
        return resolved;
      };
      const scenes = pendingDirectorData.prebuiltScenes.map((s, idx) => ({
        id: idx + 1,
        sceneName: s.sceneName || "",
        sceneLocation: s.sceneLocation || "",
        imageDataUrl: null,
        imageHttpUrl: null,
        width: 0,
        height: 0,
        imagePrompt: s.imagePrompt,
        videoPrompt: s.videoPrompt,
        voiceOver: s.voiceOver || "",
        videoLength: normalizeVideoLength(s.videoLength),
        characterIds: resolveCharacterIds(s.characterIds, s.characterNames),
        characterNames: s.characterNames || [],
        sceneReferenceImage: s.sceneReferenceImage || void 0,
        ref_image: normalizeRefImageIndexes(s.ref_image ?? s.refImage),
        sourceShotId: s.sourceShotId,
        sourceShotIndex: s.sourceShotIndex ?? idx + 1,
        ambientSound: s.ambientSound || "",
        soundEffects: [],
        soundEffectText: "",
        dialogue: s.dialogue || "",
        imageStatus: "idle",
        imageProgress: 0,
        imageError: null,
        videoStatus: "idle",
        videoProgress: 0,
        videoUrl: null,
        videoError: null,
        videoMediaId: null,
        row: 0,
        col: 0,
        sourceRect: { x: 0, y: 0, width: 0, height: 0 }
      }));
      setSplitScenes(scenes);
      setStoryboardStatus("editing");
      setPendingDirectorData(null);
      toast.success(`Imported ${scenes.length} shot(s) from script`);
      return;
    }
    const hasPendingCharacterNames = (pendingDirectorData.characterNames?.length || 0) > 0;
    const hasPendingCharacterIds = (pendingDirectorData.characterLibraryIds?.length || 0) > 0;
    const hasDraftCharacterIds = (savedDraft?.selectedCharacterIds?.length || 0) > 0;
    if ((hasPendingCharacterNames || hasPendingCharacterIds || hasDraftCharacterIds) && visibleCharacters.length === 0) {
      return;
    }
    if (activeProjectId) {
      lastHydratedProjectIdRef.current = activeProjectId;
    }
    const draftPrompt = savedDraft?.prompt || "";
    const draftCharacters = resolveDraftCharacters(savedDraft?.selectedCharacterIds || []);
    setPrompt(pendingDirectorData.storyPrompt || draftPrompt);
    if (pendingDirectorData.sceneCount) {
      setSceneCount(pendingDirectorData.sceneCount);
    }
    setStyleId(projectVisualStyleId);
    let matchedChars = [];
    if (hasPendingCharacterIds) {
      matchedChars = (pendingDirectorData.characterLibraryIds || []).map((id) => {
        const libChar = visibleCharacters.find((c) => c.id === id);
        if (!libChar) return null;
        const thumbnailUrl = libChar.thumbnailUrl;
        return {
          characterId: libChar.id,
          characterName: libChar.name,
          characterPrompt: libChar.characterPrompt || libChar.description || "",
          thumbnailUrl
        };
      }).filter(Boolean);
    }
    if (matchedChars.length === 0 && hasPendingCharacterNames) {
      matchedChars = pendingDirectorData.characterNames.map((name) => {
        const libChar = visibleCharacters.find(
          (c) => c.name === name || c.name.includes(name) || name.includes(c.name)
        );
        if (!libChar) return null;
        const thumbnailUrl = libChar.thumbnailUrl;
        return {
          characterId: libChar.id,
          characterName: libChar.name,
          characterPrompt: libChar.characterPrompt || libChar.description || "",
          thumbnailUrl
        };
      }).filter(Boolean);
    }
    setSelectedCharacters(matchedChars.length > 0 ? matchedChars : draftCharacters);
    setPendingDirectorData(null);
  }, [
    pendingDirectorData,
    visibleCharacters,
    setPendingDirectorData,
    activeProjectId,
    savedDraft,
    resolveDraftCharacters,
    projectVisualStyleId
  ]);
  reactExports.useEffect(() => {
    if (!activeProjectId || pendingDirectorData) return;
    const savedCharacterIds = savedDraft?.selectedCharacterIds || [];
    const sameCharacters = selectedCharacterIds.length === savedCharacterIds.length && selectedCharacterIds.every((id, idx) => id === savedCharacterIds[idx]);
    const samePrompt = prompt === (savedDraft?.prompt || "");
    if (samePrompt && sameCharacters) return;
    const timer = window.setTimeout(() => {
      setScreenplayDraft({
        prompt,
        selectedCharacterIds
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    activeProjectId,
    pendingDirectorData,
    prompt,
    selectedCharacterIds,
    savedDraft,
    setScreenplayDraft
  ]);
  const getMaxSceneOptions = () => {
    const limit = SCENE_LIMITS[resolution];
    return Array.from({ length: limit }, (_, i) => i + 1);
  };
  const getSelectedStyleTokens = () => {
    if (styleId === "random") {
      const randomizableStyles = VISUAL_STYLE_PRESETS.filter((style) => style.id !== "none");
      const randomStyle = randomizableStyles[Math.floor(Math.random() * randomizableStyles.length)];
      return randomStyle ? getStyleTokens(randomStyle.id) : [];
    }
    return getStyleTokens(styleId);
  };
  const handleDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = reactExports.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  const handleDrop = reactExports.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "character") {
        if (selectedCharacters.some((c) => c.characterId === data.characterId)) {
          toast.info("This character is already added");
          return;
        }
        const newChar = {
          characterId: data.characterId,
          characterName: data.characterName,
          characterPrompt: data.characterPrompt || "",
          thumbnailUrl: data.thumbnailUrl
        };
        setSelectedCharacters((prev) => [...prev, newChar]);
        toast.success(`Added character: ${data.characterName}`);
      }
    } catch (err) {
    }
  }, [selectedCharacters]);
  const removeCharacter = (characterId) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.characterId !== characterId));
  };
  const toggleCharacterSelection = (character) => {
    const isSelected = selectedCharacters.some((c) => c.characterId === character.id);
    if (isSelected) {
      setSelectedCharacters((prev) => prev.filter((c) => c.characterId !== character.id));
    } else {
      const thumbnailUrl = character.thumbnailUrl;
      const newChar = {
        characterId: character.id,
        characterName: character.name,
        characterPrompt: character.characterPrompt || character.description || "",
        thumbnailUrl
      };
      setSelectedCharacters((prev) => [...prev, newChar]);
    }
  };
  const goToCharacterLibrary = () => {
    setIsCharacterPopoverOpen(false);
    setActiveTab("characters");
  };
  const buildPromptWithCharacters = () => {
    let fullPrompt = prompt;
    if (selectedCharacters.length > 0) {
      const characterDescriptions = selectedCharacters.map((c) => `Character "${c.characterName}": ${c.characterPrompt || "designed by AI based on the name"}`).join("; ");
      fullPrompt = `${prompt}

Include these characters: ${characterDescriptions}`;
    }
    return fullPrompt;
  };
  const getCharacterReferenceImages = () => {
    const refImages = [];
    for (const selectedChar of selectedCharacters) {
      const fullChar = visibleCharacters.find((c) => c.id === selectedChar.characterId);
      if (fullChar?.thumbnailUrl) {
        const refImage = fullChar.thumbnailUrl;
        if (refImage) {
          refImages.push(refImage);
        }
      }
    }
    return refImages;
  };
  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 3);
      setImages((prev) => [...prev, ...newImages].slice(0, 3));
    }
    e.target.value = "";
  };
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a screenplay description");
      return;
    }
    setIsSubmitting(true);
    try {
      const actualStyleTokens = getSelectedStyleTokens();
      const rawCharacterImages = getCharacterReferenceImages();
      const characterDescriptions = selectedCharacters.map(
        (c) => `${c.characterName}: ${c.characterPrompt || "designed by AI based on the name"}`
      );
      let characterReferenceImages = [];
      if (rawCharacterImages.length > 0) {
        toast.info("Uploading character reference images...");
        try {
          characterReferenceImages = await uploadMultipleImages(rawCharacterImages);
          if (characterReferenceImages.length > 0) {
            toast.success(`Uploaded ${characterReferenceImages.length} character reference images`);
          }
        } catch (uploadError) {
          console.warn("[ScreenplayInput] Failed to upload character images:", uploadError);
          toast.warning("Character reference image upload failed, so no character refs will be used");
        }
      }
      const fullPrompt = buildPromptWithCharacters();
      onGenerateStoryboard({
        storyPrompt: fullPrompt,
        sceneCount,
        aspectRatio,
        resolution,
        styleTokens: actualStyleTokens,
        visualStyleId: styleId === "random" ? void 0 : styleId,
        characterDescriptions: characterDescriptions.length > 0 ? characterDescriptions : void 0,
        characterReferenceImages: characterReferenceImages.length > 0 ? characterReferenceImages : void 0
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleExampleClick = (example) => {
    setPrompt(example);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("director.describeVideo") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          placeholder: t("director.screenplayPlaceholder"),
          value: prompt,
          onChange: (e) => setPrompt(e.target.value),
          className: "min-h-[100px] resize-none",
          disabled: isSubmitting
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground", children: t("director.examplePrompts") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: EXAMPLE_PROMPTS.map((example, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => handleExampleClick(example),
          className: "text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors truncate max-w-[150px]",
          disabled: isSubmitting,
          children: [
            example.substring(0, 15),
            "..."
          ]
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: t("director.aspectRatioLabel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: aspectRatio,
            onValueChange: (v) => setAspectRatio(v),
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("director.selectRatio") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "16:9", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-3 w-3" }),
                  "16:9 Landscape"
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "9:16", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-3 w-3" }),
                  "9:16 Portrait"
                ] }) })
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: t("director.resolutionLabel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: resolution,
            onValueChange: (v) => {
              const newRes = v;
              setResolution(newRes);
              const newLimit = SCENE_LIMITS[newRes];
              if (sceneCount > newLimit) {
                setSceneCount(newLimit);
              }
            },
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("director.selectResolution") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: "2K", children: [
                  "2K (up to ",
                  SCENE_LIMITS["2K"],
                  " scenes)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: "4K", children: [
                  "4K (up to ",
                  SCENE_LIMITS["4K"],
                  " scenes)"
                ] })
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm font-medium flex items-center gap-2", children: [
          "Scene Count",
          !isSceneCountValid && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-destructive font-normal", children: "Over limit" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: String(sceneCount),
            onValueChange: (v) => setSceneCount(Number(v)),
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: `w-full ${!isSceneCountValid ? "border-destructive" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("director.selectSceneCount") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: getMaxSceneOptions().map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: String(n), children: [
                n,
                " scenes"
              ] }, n)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: t("director.visualStyleLabel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          StylePicker,
          {
            value: styleId === "random" ? "" : styleId,
            onChange: handleStyleChange,
            disabled: isSubmitting,
            placeholder: t("director.selectStyleRandom")
          }
        )
      ] })
    ] }),
    !isSceneCountValid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: sceneValidation.message }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm font-medium flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
          t("director.characterLibrary")
        ] }),
        selectedCharacters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("director.charactersSelected", { count: selectedCharacters.length }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          ref: dropZoneRef,
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
          className: `min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-colors ${isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-muted-foreground/40"}`,
          children: selectedCharacters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isCharacterPopoverOpen, onOpenChange: setIsCharacterPopoverOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "w-full h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-6 w-6" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-64 p-0", align: "start", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("director.selectCharacters") }) }),
              visibleCharacters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 text-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: t("director.characterLibraryEmpty") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "sm",
                    onClick: goToCharacterLibrary,
                    children: t("director.goCreateCharacter")
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[200px] overflow-y-auto", children: visibleCharacters.map((char) => {
                const isSelected = selectedCharacters.some((c) => c.characterId === char.id);
                const thumbnail = char.thumbnailUrl;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => toggleCharacterSelection(char),
                    className: "w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left",
                    children: [
                      thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: thumbnail,
                          alt: char.name,
                          className: "w-8 h-8 rounded-full object-cover"
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm truncate", children: char.name }),
                      isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-primary" })
                    ]
                  },
                  char.id
                );
              }) })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [
            selectedCharacters.map((char) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1",
                children: [
                  char.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: char.thumbnailUrl,
                      alt: char.characterName,
                      className: "w-6 h-6 rounded-full object-cover"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: char.characterName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: () => removeCharacter(char.characterId),
                      className: "text-muted-foreground hover:text-destructive transition-colors",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
                    }
                  )
                ]
              },
              char.characterId
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open: isCharacterPopoverOpen, onOpenChange: setIsCharacterPopoverOpen, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-64 p-0", align: "start", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("director.selectCharacters") }) }),
                visibleCharacters.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-8 w-8 mx-auto mb-2 text-muted-foreground" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: t("director.characterLibraryEmpty") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: goToCharacterLibrary,
                      children: t("director.goCreateCharacter")
                    }
                  )
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[200px] overflow-y-auto", children: visibleCharacters.map((char) => {
                  const isSelected = selectedCharacters.some((c) => c.characterId === char.id);
                  const thumbnail = char.thumbnailUrl;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      onClick: () => toggleCharacterSelection(char),
                      className: "w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left",
                      children: [
                        thumbnail ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "img",
                          {
                            src: thumbnail,
                            alt: char.name,
                            className: "w-8 h-8 rounded-full object-cover"
                          }
                        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm truncate", children: char.name }),
                        isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-primary" })
                      ]
                    },
                    char.id
                  );
                }) })
              ] })
            ] })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: t("director.referenceImagesOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          images.length,
          "/3"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        images.map((_img, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: imageUrls[i],
              alt: `Reference ${i + 1}`,
              className: "w-16 h-16 object-cover rounded-lg border"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => removeImage(i),
              className: "absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
            }
          )
        ] }, i)),
        images.length < 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `relative w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`,
            onClick: () => {
              if (isSubmitting) return;
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.multiple = true;
              input.onchange = (e) => handleImageChange(e);
              input.click();
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "h-5 w-5 pointer-events-none" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: handleSubmit,
        disabled: !prompt.trim() || isSubmitting || !isSceneCountValid,
        className: "flex-1",
        size: "lg",
        children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" }),
          "Generating..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(WandSparkles, { className: "h-4 w-4 mr-2" }),
          "Generate Storyboard"
        ] })
      }
    ) })
  ] });
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${e}`));
    img.src = src;
  });
}
function isCellEmpty(canvas, threshold = 30) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const width = canvas.width;
  const height = canvas.height;
  const stepX = Math.max(1, Math.floor(width / 10));
  const stepY = Math.max(1, Math.floor(height / 10));
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const centerIdx = (centerY * width + centerX) * 4;
  const refR = data[centerIdx];
  const refG = data[centerIdx + 1];
  const refB = data[centerIdx + 2];
  const isNearBlack = refR < 30 && refG < 30 && refB < 30;
  let uniformCount = 0;
  let totalSamples = 0;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      const diff = Math.abs(data[i] - refR) + Math.abs(data[i + 1] - refG) + Math.abs(data[i + 2] - refB);
      if (diff < threshold) {
        uniformCount++;
      }
      totalSamples++;
    }
  }
  const uniformRatio = uniformCount / totalSamples;
  return isNearBlack && uniformRatio > 0.9;
}
async function splitStoryboardImage(imageSrc, config) {
  const { aspectRatio, resolution, sceneCount, options = {} } = config;
  const { threshold = 30, filterEmpty = true } = options;
  const edgeMarginPercent = options.edgeMarginPercent ?? 0.03;
  const img = await loadImage(imageSrc);
  const totalWidth = img.width;
  const totalHeight = img.height;
  const results = [];
  const gridConfig = calculateGrid({ sceneCount, aspectRatio, resolution });
  const expectedCols = options.expectedCols || gridConfig.cols;
  const expectedRows = options.expectedRows || gridConfig.rows;
  console.log("[ImageSplitter] Using FIXED UNIFORM GRID (Approach D)", {
    imageSize: `${totalWidth}x${totalHeight}`,
    grid: `${expectedRows}x${expectedCols}`,
    sceneCount,
    edgeMarginPercent
  });
  const cellWidth = Math.floor(totalWidth / expectedCols);
  const cellHeight = Math.floor(totalHeight / expectedRows);
  const targetAspectW = aspectRatio === "16:9" ? 16 : 9;
  const targetAspectH = aspectRatio === "16:9" ? 9 : 16;
  const targetRatio = targetAspectW / targetAspectH;
  const rawRatio = cellWidth / cellHeight;
  let cropX = 0, cropY = 0, cropW = cellWidth, cropH = cellHeight;
  let outputWidth, outputHeight;
  if (Math.abs(rawRatio - targetRatio) < 0.01) {
    outputWidth = cellWidth;
    outputHeight = cellHeight;
    console.log("[ImageSplitter] Ratio already matches target, no crop needed");
  } else if (rawRatio > targetRatio) {
    cropW = Math.floor(cellHeight * targetRatio);
    cropX = Math.floor((cellWidth - cropW) / 2);
    outputWidth = cropW;
    outputHeight = cellHeight;
    console.log(`[ImageSplitter] Cell too wide (${rawRatio.toFixed(3)} > ${targetRatio.toFixed(3)}), crop width: ${cellWidth} → ${cropW}, offsetX: ${cropX}`);
  } else {
    cropH = Math.floor(cellWidth / targetRatio);
    cropY = Math.floor((cellHeight - cropH) / 2);
    outputWidth = cellWidth;
    outputHeight = cropH;
    console.log(`[ImageSplitter] Cell too tall (${rawRatio.toFixed(3)} < ${targetRatio.toFixed(3)}), crop height: ${cellHeight} → ${cropH}, offsetY: ${cropY}`);
  }
  if (aspectRatio === "16:9") {
    outputHeight = Math.round(outputWidth * 9 / 16);
  } else {
    outputWidth = Math.round(outputHeight * 9 / 16);
  }
  const finalEdgeMargin = options.edgeMarginPercent ?? 5e-3;
  const marginW = Math.floor(cropW * finalEdgeMargin);
  const marginH = Math.floor(cropH * finalEdgeMargin);
  console.log("[ImageSplitter] Split params:", {
    cellRaw: `${cellWidth}x${cellHeight}`,
    rawRatio: rawRatio.toFixed(3),
    targetRatio: targetRatio.toFixed(3),
    cropRegion: `${cropW}x${cropH} (offset: ${cropX}, ${cropY})`,
    outputStrict: `${outputWidth}x${outputHeight}`,
    margin: `${marginW}px x ${marginH}px (${finalEdgeMargin * 100}%)`
  });
  const cellDefs = [];
  for (let row = 0; row < expectedRows; row++) {
    for (let col = 0; col < expectedCols; col++) {
      cellDefs.push({
        x: col * cellWidth,
        y: row * cellHeight,
        w: cellWidth,
        h: cellHeight,
        row,
        col
      });
    }
  }
  for (let i = 0; i < cellDefs.length; i++) {
    const def = cellDefs[i];
    const cellCanvas = document.createElement("canvas");
    cellCanvas.width = outputWidth;
    cellCanvas.height = outputHeight;
    const ctx = cellCanvas.getContext("2d");
    if (!ctx) continue;
    const srcX = def.x + cropX + marginW;
    const srcY = def.y + cropY + marginH;
    const srcW = cropW - marginW * 2;
    const srcH = cropH - marginH * 2;
    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcW,
      srcH,
      // Source (cropped + contracted)
      0,
      0,
      outputWidth,
      outputHeight
      // Destination (strict ratio)
    );
    const isEmpty = filterEmpty ? isCellEmpty(cellCanvas, threshold) : false;
    if (filterEmpty && isEmpty) {
      console.log(`[ImageSplitter] Skipping empty cell ${i} (Row ${def.row}, Col ${def.col})`);
      continue;
    }
    results.push({
      id: results.length,
      originalIndex: i,
      dataUrl: cellCanvas.toDataURL("image/png"),
      width: outputWidth,
      height: outputHeight,
      isEmpty,
      row: def.row,
      col: def.col,
      sourceRect: {
        x: def.x,
        y: def.y,
        width: def.w,
        height: def.h
      }
    });
  }
  console.log(`[ImageSplitter] Split complete: ${results.length} valid cells from ${cellDefs.length} total`);
  return results;
}
const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/avif": "avif"
};
function getImageExtension(imageData) {
  const dataMime = imageData.match(/^data:([^;,]+)/)?.[1]?.toLowerCase();
  if (dataMime && MIME_EXTENSIONS[dataMime]) {
    return MIME_EXTENSIONS[dataMime];
  }
  const cleanSource = imageData.split(/[?#]/)[0] || "";
  const sourceExtension = cleanSource.match(/\.([a-z0-9]{2,8})$/i)?.[1]?.toLowerCase();
  if (sourceExtension && ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"].includes(sourceExtension)) {
    return sourceExtension === "jpeg" ? "jpg" : sourceExtension;
  }
  return "png";
}
async function persistSceneImage(imageData, sceneId, frameType = "first", category = "shots") {
  if (imageData.startsWith("local-image://") || isIdbImagePath(imageData)) {
    return { localPath: imageData, httpUrl: null };
  }
  if (!imageData) {
    return { localPath: "", httpUrl: null };
  }
  const timestamp = Date.now();
  const filename = `scene_${sceneId}_${frameType}_${timestamp}.${getImageExtension(imageData)}`;
  const localPath = await saveImageToLocal(imageData, category, filename);
  let httpUrl = null;
  if (isImageHostConfigured()) {
    try {
      const result = await uploadToImageHost(imageData, {
        name: filename,
        expiration: 15552e3
        // 180 days
      });
      if (result.success && result.url) {
        httpUrl = result.url;
      }
    } catch (error) {
      console.warn("[persistSceneImage] Image host upload failed:", error);
    }
  }
  return { localPath, httpUrl };
}
function StoryboardPreview({ onBack, onSplitComplete }) {
  const { t } = useI18n();
  const [isSplitting, setIsSplitting] = reactExports.useState(false);
  const [splitError, setSplitError] = reactExports.useState(null);
  const pendingDirectorData = useMediaPanelStore((state) => state.pendingDirectorData);
  const projectData = useActiveDirectorProject();
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardStatus = projectData?.storyboardStatus || "idle";
  const storyboardError = projectData?.storyboardError || null;
  const storyboardConfig = projectData?.storyboardConfig || {
    aspectRatio: "9:16",
    resolution: "2K",
    sceneCount: 5,
    storyPrompt: ""
  };
  const {
    setStoryboardStatus,
    setStoryboardError,
    setSplitScenes,
    resetStoryboard
  } = useDirectorStore();
  const handleRegenerate = reactExports.useCallback(() => {
    resetStoryboard();
    onBack?.();
  }, [resetStoryboard, onBack]);
  const handleSplit = reactExports.useCallback(async () => {
    if (!storyboardImage) {
      toast.error(t("director.noStoryboard"));
      return;
    }
    setIsSplitting(true);
    setSplitError(null);
    setStoryboardStatus("splitting");
    try {
      if (storyboardConfig.sceneCount === 1) {
        const singlePersist = await persistSceneImage(storyboardImage, 1, "first");
        const singleScene = {
          id: 1,
          sceneName: "",
          sceneLocation: "",
          imageDataUrl: singlePersist.localPath,
          imageHttpUrl: null,
          width: 0,
          // Will be determined when image loads
          height: 0,
          imagePrompt: "",
          videoPrompt: "",
          voiceOver: "",
          videoLength: 4,
          row: 0,
          col: 0,
          sourceRect: { x: 0, y: 0, width: 0, height: 0 },
          characterIds: [],
          sceneLibraryId: pendingDirectorData?.sceneLibraryId,
          sceneReferenceImage: pendingDirectorData?.sceneReferenceImage,
          ambientSound: "",
          soundEffects: [],
          soundEffectText: "",
          dialogue: "",
          imageStatus: "completed",
          imageProgress: 100,
          imageError: null,
          videoStatus: "idle",
          videoProgress: 0,
          videoUrl: null,
          videoError: null,
          videoMediaId: null
        };
        setSplitScenes([singleScene]);
        setStoryboardStatus("editing");
        toast.success(t("director.enterSceneEditing"));
        onSplitComplete?.();
        return;
      }
      const splitResults = await splitStoryboardImage(storyboardImage, {
        aspectRatio: storyboardConfig.aspectRatio,
        resolution: storyboardConfig.resolution === "1K" ? "2K" : storyboardConfig.resolution,
        sceneCount: storyboardConfig.sceneCount,
        options: {
          filterEmpty: true,
          threshold: 30,
          edgeMarginPercent: 0.03
          // 3% edge crop for separator line tolerance
        }
      });
      if (splitResults.length === 0) {
        throw new Error(t("director.emptySplitResult"));
      }
      const splitScenes = await Promise.all(splitResults.map(async (result, index) => {
        const sceneId = index + 1;
        const persistResult = await persistSceneImage(result.dataUrl, sceneId, "first", "shots");
        return {
          id: sceneId,
          sceneName: "",
          sceneLocation: "",
          imageDataUrl: persistResult.localPath,
          imageHttpUrl: persistResult.httpUrl,
          width: result.width,
          height: result.height,
          imagePrompt: "",
          videoPrompt: "",
          // English prompt, populated after AI generation
          voiceOver: "",
          videoLength: 4,
          row: result.row,
          col: result.col,
          sourceRect: result.sourceRect,
          characterIds: [],
          sceneLibraryId: pendingDirectorData?.sceneLibraryId,
          sceneReferenceImage: pendingDirectorData?.sceneReferenceImage,
          ambientSound: "",
          soundEffects: [],
          soundEffectText: "",
          dialogue: "",
          imageStatus: "completed",
          imageProgress: 100,
          imageError: null,
          videoStatus: "idle",
          videoProgress: 0,
          videoUrl: null,
          videoError: null,
          videoMediaId: null
        };
      }));
      setSplitScenes(splitScenes);
      setStoryboardStatus("editing");
      toast.success(t("director.splitDone", { count: splitScenes.length }));
      onSplitComplete?.();
    } catch (error) {
      const err = error;
      console.error("[StoryboardPreview] Split failed:", err);
      setSplitError(err.message);
      setStoryboardError(err.message);
      setStoryboardStatus("error");
      toast.error(t("director.splitFailed", { message: err.message }));
    } finally {
      setIsSplitting(false);
    }
  }, [
    storyboardImage,
    storyboardConfig,
    setSplitScenes,
    setStoryboardStatus,
    setStoryboardError,
    onSplitComplete,
    pendingDirectorData
  ]);
  if (storyboardStatus === "generating") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-12 w-12 animate-spin text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("director.generatingStoryboard") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground/60", children: [
        t("director.sceneCount", { count: storyboardConfig.sceneCount }),
        " · ",
        storyboardConfig.aspectRatio,
        " · ",
        storyboardConfig.resolution
      ] })
    ] });
  }
  if (storyboardStatus === "error" || storyboardError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-8 w-8 text-destructive" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-destructive", children: t("director.generationFailed") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground max-w-[250px]", children: storyboardError || splitError || t("director.unknownError") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleRegenerate, className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
        t("director.regenerate")
      ] })
    ] });
  }
  if (!storyboardImage) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { className: "h-8 w-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("director.noStoryboardImage") }),
      onBack && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: onBack, className: "mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
        t("director.backToInput")
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: t("director.storyboardReady") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        t("director.sceneCount", { count: storyboardConfig.sceneCount }),
        " · ",
        storyboardConfig.aspectRatio,
        " · ",
        storyboardConfig.resolution
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg border overflow-hidden bg-muted/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: storyboardImage,
          alt: t("director.storyboardReady"),
          className: "w-full h-auto object-contain",
          style: { maxHeight: "400px" }
        }
      ),
      isSplitting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-background/80 flex flex-col items-center justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary mb-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("director.splitting") })
      ] })
    ] }),
    splitError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-destructive mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: t("director.splitFailedTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: splitError })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleRegenerate,
            disabled: isSplitting,
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
              "Regenerate"
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Go back to the input step and regenerate the storyboard" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleSplit,
            disabled: isSplitting,
            className: "flex-1",
            children: isSplitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
              storyboardConfig.sceneCount === 1 ? "Processing..." : "Splitting..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4 mr-2" }),
              storyboardConfig.sceneCount === 1 ? "Next" : "Split Scenes"
            ] })
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: storyboardConfig.sceneCount === 1 ? "Jump straight into scene editing" : "Split into separate scenes using the fixed grid" }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground bg-muted/50 rounded-lg p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      "💡 ",
      storyboardConfig.sceneCount === 1 ? 'Click "Next" to go straight into scene editing, where you can edit prompts and generate videos.' : `Click "Split Scenes" to divide the storyboard into ${storyboardConfig.sceneCount} evenly sized grid cells and automatically trim border separators. After that, you can edit each scene prompt.`
    ] }) })
  ] });
}
function sceneHasTextDescription(scene) {
  const hasAction = !!(scene.actionSummary && scene.actionSummary.trim().length > 5);
  const hasCamera = !!(scene.cameraMovement && scene.cameraMovement.trim().length > 0);
  const hasDialogue = !!(scene.dialogue && scene.dialogue.trim().length > 0);
  const hasSceneDesc = !!(scene.sceneDescription && scene.sceneDescription.trim().length > 5);
  return hasAction || hasSceneDesc || hasCamera || hasDialogue;
}
function generatePromptFromText(scene) {
  const action = scene.actionSummary || "";
  const camera = scene.cameraMovement || "";
  const dialogue = scene.dialogue || "";
  const sceneDesc = scene.sceneDescription || "";
  const sceneName = scene.sceneName || `Scene ${scene.id}`;
  const imagePromptParts = [];
  if (sceneDesc) imagePromptParts.push(sceneDesc);
  if (action) imagePromptParts.push(action);
  const imagePrompt = imagePromptParts.join(". ") || `${sceneName} frame`;
  const videoPromptParts = [];
  if (action) videoPromptParts.push(action);
  if (camera) videoPromptParts.push(`Camera: ${camera}`);
  if (dialogue) videoPromptParts.push(`Dialogue: "${dialogue.substring(0, 50)}"`);
  const videoPrompt = videoPromptParts.join(". ") || `${sceneName} dynamic shot`;
  return {
    id: scene.id,
    // First frame
    imagePrompt,
    // Video
    videoPrompt,
    // Legacy
    prompt: videoPrompt,
    action: action || void 0,
    camera: camera || void 0
  };
}
async function generateScenePrompts(config) {
  const { storyboardImage, storyPrompt, scenes, apiKey, provider = "unknown", baseUrl, model } = config;
  console.log(`[ScenePromptGenerator] Generating two-tier prompts for ${scenes.length} scenes`);
  const scenesWithText = scenes.filter((s) => sceneHasTextDescription(s));
  const scenesWithoutText = scenes.filter((s) => !sceneHasTextDescription(s));
  console.log(`[ScenePromptGenerator] ${scenesWithText.length} scenes have text descriptions, ${scenesWithoutText.length} need Vision API`);
  if (scenesWithoutText.length === 0) {
    console.log("[ScenePromptGenerator] All scenes have text descriptions, generating from text (no API call)");
    return scenes.map(generatePromptFromText);
  }
  const textResults = scenesWithText.map(generatePromptFromText);
  if (scenesWithoutText.length > 0) {
    console.log(`[ScenePromptGenerator] Falling back to Vision API for ${scenesWithoutText.length} scenes`);
    const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");
    if (!normalizedBaseUrl) {
      console.warn("[ScenePromptGenerator] No Vision API configured, using placeholder for scenes without text");
      const placeholderResults = scenesWithoutText.map((s) => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
    if (!model) {
      console.warn("[ScenePromptGenerator] No Vision model configured, using placeholder for scenes without text");
      const placeholderResults = scenesWithoutText.map((s) => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
    try {
      const visionResults = await generatePromptsViaVisionAPI(
        storyboardImage,
        storyPrompt,
        scenesWithoutText,
        apiKey,
        provider,
        normalizedBaseUrl,
        model
      );
      return [...textResults, ...visionResults].sort((a, b) => a.id - b.id);
    } catch (error) {
      console.error("[ScenePromptGenerator] Vision API failed, using placeholders:", error);
      const placeholderResults = scenesWithoutText.map((s) => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
  }
  return textResults;
}
async function generatePromptsViaVisionAPI(storyboardImage, storyPrompt, scenes, apiKey, provider, baseUrl, model) {
  console.log(`[ScenePromptGenerator] Calling Vision API for ${scenes.length} scenes using ${provider}`);
  const buildEndpoint2 = (root, path) => {
    const normalized = root.replace(/\/+$/, "");
    return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
  };
  const sceneList = scenes.map((s) => {
    let desc = `- Frame #${s.id}: Position Row ${s.row}, Column ${s.col}`;
    if (s.actionSummary) desc += `
  Action hint: ${s.actionSummary}`;
    if (s.cameraMovement) desc += `
  Camera hint: ${s.cameraMovement}`;
    if (s.dialogue) desc += `
  Dialogue: "${s.dialogue.substring(0, 50)}..."`;
    return desc;
  }).join("\n");
  const systemPrompt = `
# Role
You are a world-class cinematographer with Oscar-winning experience, specializing in AI-assisted filmmaking.

Your Expertise:
- **Visual Language Mastery**: Expert at composition, lighting, framing for every shot
- **Motion Understanding**: Precisely judge when a scene needs controlled endpoints (end frames) for AI video generation
- **AI Video Generation Expert**: Deep knowledge of Seedance, Sora, Runway and other AI video models - know exactly when end frames improve quality
- **Storytelling Through Camera**: Understand how each shot serves the overall narrative

You understand the TWO-TIER PROMPT SYSTEM for video generation:
1. **First Frame Prompt**: STATIC description for generating the starting image
2. **Video Prompt**: DYNAMIC description for the motion/action between frames

# Context
- Input: A storyboard grid containing multiple frames.
- Story Context: "${storyPrompt}"
- Task: For each frame, generate TWO types of prompts.

# Prompt Writing Guidelines

## First Frame Prompt (imagePrompt)
- Describe the STATIC visual: composition, lighting, character appearance, pose
- Focus on WHAT IS VISIBLE in the starting frame
- Example: "A young woman in a red dress stands at the doorway, hand on the doorknob, warm afternoon light streaming through the window."

## Video Prompt (videoPrompt)
- Describe the MOTION and ACTION between first and end frames
- Do NOT describe static appearance (the image provides this)
- Include camera movement if any
- Example: "The woman gently pushes the door open and walks into the room with graceful steps. Camera follows her movement."

# Frames to Analyze
${sceneList}

# Output Format
Return a RAW JSON array with English-only prompt fields.
[
  {
    "id": 1,
    "imagePrompt": "English static first frame description...",
    "videoPrompt": "English action/motion description..."
  },
  {
    "id": 2,
    "imagePrompt": "...",
    "videoPrompt": "..."
  }
]
`;
  if (apiKey === "mock" || !apiKey) {
    console.log("[ScenePromptGenerator] Using mock response");
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    return scenes.map((s) => {
      return {
        id: s.id,
        // First frame (static)
        imagePrompt: `(Mock) A character in scene ${s.id}, composition based on "${storyPrompt}".`,
        // Video action (dynamic)
        videoPrompt: `(Mock) Slow zoom in. Scene ${s.id} action based on "${storyPrompt}".`,
        // Legacy compatibility
        prompt: `(Mock) Slow zoom in. Scene ${s.id} action based on "${storyPrompt}".`,
        action: "Mock action",
        camera: "Zoom In"
      };
    });
  }
  try {
    const formattedMessages = [
      {
        role: "user",
        content: [
          { type: "text", text: systemPrompt },
          { type: "image_url", image_url: { url: storyboardImage } }
        ]
      }
    ];
    const endpoint = buildEndpoint2(baseUrl, "chat/completions");
    console.log("[ScenePromptGenerator] Calling chat completion:", { model, hasImage: true, endpoint });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: false,
        response_format: { type: "json_object" }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ScenePromptGenerator] API error:", response.status, errorText);
      let errorMessage = `API request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("API key is invalid or expired");
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    console.log("[ScenePromptGenerator] API response received");
    const content = data.choices?.[0]?.message?.content || data.content || "";
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("[ScenePromptGenerator] Failed to parse JSON:", content);
      throw new Error("AI response is not valid JSON");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("AI response is not an array");
    }
    const results = parsed.map((item) => {
      const imagePrompt = String(item.imagePrompt || item.prompt || "");
      const videoPrompt = String(item.videoPrompt || item.prompt || "");
      return {
        id: Number(item.id),
        // First frame (static)
        imagePrompt,
        // Video action (dynamic)
        videoPrompt,
        // Legacy compatibility (maps to videoPrompt)
        prompt: videoPrompt,
        action: item.action,
        camera: item.camera
      };
    }).filter((p) => (p.videoPrompt || p.imagePrompt) && !isNaN(p.id));
    console.log(`[ScenePromptGenerator] Generated ${results.length} two-tier prompts`);
    return results;
  } catch (error) {
    console.error("[ScenePromptGenerator] Vision API Error:", error);
    throw error;
  }
}
function resolveSceneAudioVoice(scene, characters, config) {
  const voiceMode = config?.voiceMode || "off";
  const narratorVoice = config?.narratorVoice?.trim();
  const spokenText = scene.dialogue?.trim() || scene.voiceOver?.trim() || "";
  if (voiceMode === "full") {
    return narratorVoice || void 0;
  }
  if (voiceMode !== "ref" && voiceMode !== "selective") {
    return void 0;
  }
  if (voiceMode === "selective" && !spokenText) {
    return void 0;
  }
  const sceneCharacters = (scene.characterIds || []).map((id) => characters.find((c) => c.id === id)).filter((c) => !!c);
  if (spokenText) {
    const speakerMatch = spokenText.match(/^([^:(]+)(?:\s*\([^)]*\))?\s*:/);
    if (speakerMatch) {
      const speakerName = speakerMatch[1].trim().toLowerCase();
      const speakerVoice = sceneCharacters.find(
        (c) => c.name.trim().toLowerCase() === speakerName && c.voiceId?.trim()
      )?.voiceId?.trim();
      if (speakerVoice) return speakerVoice;
    }
  }
  return sceneCharacters.find((c) => c.voiceId?.trim())?.voiceId?.trim() ?? void 0;
}
function resolveAllSceneVoices(scene, characters, config) {
  const voiceMode = config?.voiceMode || "off";
  if (voiceMode === "off") return [];
  if (voiceMode === "full") {
    const v = config?.narratorVoice?.trim();
    return v ? [{ voiceId: v, active: true }] : [];
  }
  const activeVoice = resolveSceneAudioVoice(scene, characters, config);
  const sceneCharacters = (scene.characterIds || []).map((id) => characters.find((c) => c.id === id)).filter((c) => !!c);
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  if (activeVoice) {
    seen.add(activeVoice);
    result.push({ voiceId: activeVoice, active: true });
  }
  for (const char of sceneCharacters) {
    const v = char.voiceId?.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      result.push({ voiceId: v, active: false });
    }
  }
  return result;
}
const isHttpImageUrl = (value) => {
  return typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));
};
const isLocalImageSource = (value) => {
  return typeof value === "string" && value.length > 0 && !isHttpImageUrl(value);
};
const looksLikeUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
const isContentModerationError = (error) => {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/anti[- ]?bot|x-statsig|captcha|HTTP\s*(?:401|403)|unauthori[sz]ed|forbidden|session|login/i.test(message)) return false;
  return /MODERATION:|moderation|content[_ -]?sensitive|safety(?:[_ -]?check)?|content.{0,30}(?:violation|policy|refused|rejected|blocked|prohibited|unsafe)|(?:prompt|image|video).{0,30}(?:inappropriate|prohibited|unsafe)/i.test(message);
};
const DIRECTOR_IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];
const directorImageSortCollator = new Intl.Collator(void 0, {
  numeric: true,
  sensitivity: "base"
});
function getDirectorImageExtension(file) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}
function isSupportedDirectorImageFile(file) {
  return DIRECTOR_IMAGE_EXTS.includes(getDirectorImageExtension(file));
}
function getDirectorImageSortKey(file) {
  return file.webkitRelativePath || file.name;
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image file"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}
async function getPersistableImageSource(file) {
  const localPath = file.path;
  return localPath || readFileAsDataUrl(file);
}
function buildCharacterIdentityBlock(scene) {
  const characterIds = scene.characterIds || [];
  if (characterIds.length === 0) return "";
  const { characters } = useCharacterLibraryStore.getState();
  const lines = characterIds.map((characterId) => {
    const character = characters.find((item) => item.id === characterId);
    if (!character) return null;
    const identity = character.identityPrompt || character.description || character.appearance || character.characterPrompt;
    if (!identity?.trim()) return null;
    return `- ${character.name}: ${identity.trim()}`;
  }).filter((line) => !!line);
  if (lines.length === 0) return "";
  return [
    "Character identity lock:",
    ...lines,
    "Preserve these character identities exactly; do not change face, hairstyle, age, body type, outfit identity, or distinctive marks unless the shot prompt explicitly says so."
  ].join("\n");
}
function applyCharacterIdentityToPrompt(prompt, scene) {
  const identityBlock = buildCharacterIdentityBlock(scene);
  if (!identityBlock) return prompt;
  return `${identityBlock}

Shot prompt:
${prompt}`;
}
function expandLinkedPromptMarkers(prompt) {
  if (!prompt.trim()) return prompt;
  const { characters } = useCharacterLibraryStore.getState();
  const { scenes } = useSceneStore.getState();
  const findCharacter = (name) => {
    const normalized = name.trim().toLowerCase();
    return characters.find(
      (item) => item.name.trim().toLowerCase() === normalized || item.name.trim().toLowerCase().includes(normalized) || normalized.includes(item.name.trim().toLowerCase())
    );
  };
  const findScene = (name) => {
    const normalized = name.trim().toLowerCase();
    return scenes.find(
      (item) => item.name.trim().toLowerCase() === normalized || item.name.trim().toLowerCase().includes(normalized) || normalized.includes(item.name.trim().toLowerCase())
    );
  };
  return prompt.replace(/@scene\[([^\]]+)\]/giu, (_match, sceneName) => {
    const linkedScene = findScene(sceneName);
    const sceneDescription = (linkedScene?.description || linkedScene?.scenePrompt || linkedScene?.name)?.trim();
    return sceneDescription ? `${sceneName.trim()} (${sceneDescription})` : sceneName.trim();
  }).replace(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu, (match, bracketName, simpleName) => {
    const name = (bracketName || simpleName || "").trim();
    if (!name) return match;
    const character = findCharacter(name);
    const characterDescription = (character?.description || character?.appearance || character?.characterPrompt)?.trim();
    return characterDescription ? `${name} (${characterDescription})` : name;
  });
}
const isDiscouragedExternalImageUrl = (value) => {
  if (!isHttpImageUrl(value)) return false;
  try {
    const hostname = new URL(value ?? "").hostname.toLowerCase();
    return hostname === "bmp.ovh" || hostname.endsWith(".bmp.ovh");
  } catch {
    return false;
  }
};
const shouldRefreshImageViaCurrentHost = (localUrl) => {
  return isLocalImageSource(localUrl) && useAPIConfigStore.getState().isImageHostConfigured();
};
const MAX_REFERENCE_IMAGES = 9;
function linkAbortSignals(controller, signal) {
  if (!signal) return;
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}
function createTimeoutSignal(parentSignal, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();
  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      parentSignal.addEventListener("abort", abortFromParent, { once: true });
    }
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  };
}
function normalizeReferenceName(value) {
  return (value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}
function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
function getSceneByIdFromStore(sceneId) {
  const state = useDirectorStore.getState();
  const projectId = state.activeProjectId;
  return projectId ? state.projects[projectId]?.splitScenes.find((scene) => scene.id === sceneId) : void 0;
}
const toggleShotSelection = (current, shotId, checked) => {
  const next = new Set(current);
  if (checked) next.add(shotId);
  else next.delete(shotId);
  return next;
};
function useGenerationElapsed(isRunning) {
  const [generationStartedAt, setGenerationStartedAt] = reactExports.useState(null);
  const [completedGenerationSeconds, setCompletedGenerationSeconds] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!isRunning) {
      if (generationStartedAt) {
        setCompletedGenerationSeconds((Date.now() - generationStartedAt) / 1e3);
        setGenerationStartedAt(null);
      }
      return;
    }
    setCompletedGenerationSeconds(null);
    setGenerationStartedAt((current) => current ?? Date.now());
  }, [isRunning, generationStartedAt]);
  return completedGenerationSeconds;
}
function useShotGenerationTimers() {
  const [runningImageStartedAtBySceneId, setRunningImageStartedAtBySceneId] = reactExports.useState({});
  const [runningVideoStartedAtBySceneId, setRunningVideoStartedAtBySceneId] = reactExports.useState({});
  const [batchProgress, setBatchProgress] = reactExports.useState(null);
  const compactNow = useNow(
    Object.keys(runningImageStartedAtBySceneId).length > 0 || Object.keys(runningVideoStartedAtBySceneId).length > 0
  );
  const markImageTimerStarted = reactExports.useCallback((sceneId, submittedAt = Date.now()) => {
    setRunningImageStartedAtBySceneId((current) => current[sceneId] ? current : { ...current, [sceneId]: submittedAt });
  }, []);
  const clearImageTimer = reactExports.useCallback((sceneId) => {
    setRunningImageStartedAtBySceneId((current) => {
      if (!current[sceneId]) return current;
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }, []);
  const markVideoTimerStarted = reactExports.useCallback((sceneId, submittedAt = Date.now()) => {
    setRunningVideoStartedAtBySceneId((current) => current[sceneId] ? current : { ...current, [sceneId]: submittedAt });
  }, []);
  const clearVideoTimer = reactExports.useCallback((sceneId) => {
    setRunningVideoStartedAtBySceneId((current) => {
      if (!current[sceneId]) return current;
      const next = { ...current };
      delete next[sceneId];
      return next;
    });
  }, []);
  const resetShotTimers = reactExports.useCallback(() => {
    setRunningImageStartedAtBySceneId({});
    setRunningVideoStartedAtBySceneId({});
  }, []);
  const startBatchProgress = reactExports.useCallback((phase, total) => {
    setBatchProgress({
      phase,
      label: phase === "images" ? "Đang tạo ảnh" : "Đang tạo video",
      completed: 0,
      failed: 0,
      total,
      active: true
    });
  }, []);
  const incrementBatchProgress = reactExports.useCallback((result) => {
    setBatchProgress((current) => {
      if (!current) return current;
      const next = {
        ...current,
        completed: current.completed + (result === "completed" ? 1 : 0),
        failed: current.failed + (result === "failed" ? 1 : 0)
      };
      return {
        ...next,
        active: next.completed + next.failed < next.total
      };
    });
  }, []);
  const finishBatchProgress = reactExports.useCallback(() => {
    setBatchProgress((current) => current ? { ...current, active: false } : current);
  }, []);
  return {
    compactNow,
    runningImageStartedAtBySceneId,
    runningVideoStartedAtBySceneId,
    batchProgress,
    markImageTimerStarted,
    clearImageTimer,
    markVideoTimerStarted,
    clearVideoTimer,
    resetShotTimers,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress
  };
}
const detectValueType = (value) => {
  if (value.startsWith("http://") || value.startsWith("https://")) return "http";
  if (value.startsWith("data:image/")) return "base64";
  if (value.startsWith("local-image://")) return "local-image";
  return "unknown";
};
function useShotReferences(splitScenes) {
  const getCharacterReferenceDetails = reactExports.useCallback((characterIds) => {
    if (!characterIds?.length) return [];
    const { characters } = useCharacterLibraryStore.getState();
    const perCharacterDetails = characterIds.flatMap((characterId) => {
      const character = characters.find((c) => c.id === characterId);
      if (!character) return [];
      const refs = [];
      const seen2 = /* @__PURE__ */ new Set();
      const push = (value, source) => {
        if (value && !seen2.has(value)) {
          seen2.add(value);
          refs.push({
            characterId,
            characterName: character.name,
            source,
            valueType: detectValueType(value),
            preview: value.slice(0, 120),
            value,
            originalValue: value
          });
        }
      };
      push(character.thumbnailUrl, "thumbnail");
      return [refs];
    });
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    const maxDepth = perCharacterDetails.reduce((d, r) => Math.max(d, r.length), 0);
    for (let i = 0; i < maxDepth && result.length < MAX_REFERENCE_IMAGES; i++) {
      for (const refs of perCharacterDetails) {
        const detail = refs[i];
        if (detail && !seen.has(detail.value)) {
          seen.add(detail.value);
          result.push(detail);
        }
        if (result.length >= MAX_REFERENCE_IMAGES) return result;
      }
    }
    return result;
  }, []);
  const getCharacterReferenceImages = reactExports.useCallback((characterIds) => {
    return getCharacterReferenceDetails(characterIds).map((item) => item.value);
  }, [getCharacterReferenceDetails]);
  const processReferenceImagesForApi = reactExports.useCallback(async (referenceImages, logPrefix) => {
    const processedRefs = [];
    for (const url of referenceImages) {
      if (!url) continue;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        processedRefs.push(url);
      } else if (looksLikeUuid(url)) {
        processedRefs.push(url);
      } else if (url.startsWith("data:image/") && url.includes(";base64,")) {
        processedRefs.push(url);
      } else if (url.startsWith("local-image://")) {
        try {
          const base64 = await readImageAsBase64(url);
          if (base64 && base64.startsWith("data:image/") && base64.includes(";base64,")) {
            processedRefs.push(base64);
          }
        } catch (error) {
          console.warn(`${logPrefix} Failed to read local image:`, url, error);
        }
      }
    }
    return processedRefs;
  }, []);
  const getSceneShotIndex = reactExports.useCallback((scene) => {
    return scene.sourceShotIndex || scene.id + 1;
  }, []);
  const getShotReferenceDetails = reactExports.useCallback((scene) => {
    const indexes = normalizeRefImageIndexes(scene.ref_image);
    if (indexes.length === 0) return [];
    const directorState = useDirectorStore.getState();
    const latestScenes = directorState.activeProjectId ? directorState.projects[directorState.activeProjectId]?.splitScenes || [] : [];
    const scenePool = latestScenes.length > 0 ? latestScenes : splitScenes;
    return indexes.map((shotIndex) => {
      const sourceScene = scenePool.find((item) => getSceneShotIndex(item) === shotIndex);
      if (!sourceScene || sourceScene.id === scene.id) {
        return {
          shotIndex,
          sceneId: -1,
          value: "",
          originalValue: "",
          label: `Shot ${String(shotIndex).padStart(2, "0")}`
        };
      }
      const value = sourceScene.imageDataUrl || sourceScene.imageHttpUrl || "";
      return {
        shotIndex,
        sceneId: sourceScene.id,
        value,
        originalValue: value,
        label: `Shot ${String(shotIndex).padStart(2, "0")}`
      };
    });
  }, [getSceneShotIndex, splitScenes]);
  const getMissingShotReferenceLabels = reactExports.useCallback((scene) => {
    return getShotReferenceDetails(scene).filter((detail) => !detail.value).map((detail) => detail.label);
  }, [getShotReferenceDetails]);
  return {
    getCharacterReferenceDetails,
    getCharacterReferenceImages,
    processReferenceImagesForApi,
    getSceneShotIndex,
    getShotReferenceDetails,
    getMissingShotReferenceLabels
  };
}
function useGenerationRuntime({
  splitScenes,
  updateSplitSceneImageStatus,
  updateSplitSceneVideo,
  timers,
  t
}) {
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const [isMergedRunning, setIsMergedRunning] = reactExports.useState(false);
  const [, setCurrentGeneratingId] = reactExports.useState(null);
  const imageAbortRef = reactExports.useRef(null);
  const videoAbortRef = reactExports.useRef(null);
  const activeImageControllersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const activeVideoControllersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const batchAbortRef = reactExports.useRef(null);
  const [googleFlowTaskIdBySceneId, setGoogleFlowTaskIdBySceneId] = reactExports.useState({});
  const [googleFlowVideoTaskIdBySceneId, setGoogleFlowVideoTaskIdBySceneId] = reactExports.useState({});
  const googleFlowTasks = useGoogleFlowRuntimeStore((state) => state.tasks);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  reactExports.useEffect(() => initializeGoogleFlowRuntime(), [initializeGoogleFlowRuntime]);
  const { clearImageTimer, clearVideoTimer, resetShotTimers } = timers;
  const stopActiveImageJobs = reactExports.useCallback(() => {
    imageAbortRef.current?.abort();
    imageAbortRef.current = null;
    activeImageControllersRef.current.forEach((controller) => controller.abort());
    activeImageControllersRef.current.clear();
  }, []);
  const stopActiveVideoJobs = reactExports.useCallback(() => {
    videoAbortRef.current?.abort();
    videoAbortRef.current = null;
    activeVideoControllersRef.current.forEach((controller) => controller.abort());
    activeVideoControllersRef.current.clear();
  }, []);
  const handleStopAllGeneration = reactExports.useCallback(() => {
    batchAbortRef.current?.abort();
    batchAbortRef.current = null;
    stopActiveImageJobs();
    stopActiveVideoJobs();
    splitScenes.forEach((scene) => {
      if (scene.imageStatus === "queued" || scene.imageStatus === "uploading" || scene.imageStatus === "generating") {
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: "idle",
          imageProgress: 0,
          imageError: t("director.userCancelled")
        });
      }
      if (scene.videoStatus === "queued" || scene.videoStatus === "uploading" || scene.videoStatus === "generating") {
        updateSplitSceneVideo(scene.id, {
          videoStatus: "idle",
          videoProgress: 0,
          videoError: t("director.userCancelled")
        });
      }
    });
    setIsMergedRunning(false);
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    resetShotTimers();
    toast.info(t("director.mergeStopped"));
  }, [splitScenes, stopActiveImageJobs, stopActiveVideoJobs, updateSplitSceneImageStatus, updateSplitSceneVideo, resetShotTimers, t]);
  const handleStopImageGeneration = reactExports.useCallback((sceneId) => {
    activeImageControllersRef.current.get(sceneId)?.abort();
    activeImageControllersRef.current.delete(sceneId);
    if (imageAbortRef.current) {
      imageAbortRef.current.abort();
      imageAbortRef.current = null;
    }
    updateSplitSceneImageStatus(sceneId, {
      imageStatus: "idle",
      imageProgress: 0,
      imageError: t("director.userCancelled")
    });
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    clearImageTimer(sceneId);
    toast.info(t("director.startFrameStopped", { index: sceneId + 1 }));
  }, [updateSplitSceneImageStatus, clearImageTimer, t]);
  const handleStopVideoGeneration = reactExports.useCallback((sceneId) => {
    activeVideoControllersRef.current.get(sceneId)?.abort();
    activeVideoControllersRef.current.delete(sceneId);
    if (videoAbortRef.current) {
      videoAbortRef.current.abort();
      videoAbortRef.current = null;
    }
    updateSplitSceneVideo(sceneId, {
      videoStatus: "idle",
      videoProgress: 0,
      videoError: t("director.userCancelled")
    });
    setIsGenerating(false);
    setCurrentGeneratingId(null);
    clearVideoTimer(sceneId);
    toast.info(t("director.videoStopped", { index: sceneId + 1 }));
  }, [updateSplitSceneVideo, clearVideoTimer, t]);
  return {
    isGenerating,
    setIsGenerating,
    isMergedRunning,
    setIsMergedRunning,
    setCurrentGeneratingId,
    imageAbortRef,
    videoAbortRef,
    activeImageControllersRef,
    activeVideoControllersRef,
    batchAbortRef,
    googleFlowTasks,
    googleFlowTaskIdBySceneId,
    setGoogleFlowTaskIdBySceneId,
    googleFlowVideoTaskIdBySceneId,
    setGoogleFlowVideoTaskIdBySceneId,
    handleStopAllGeneration,
    handleStopImageGeneration,
    handleStopVideoGeneration
  };
}
function lookupMediaByOwnerScope(source) {
  const fingerprint = getSourceFingerprint(source);
  if (!fingerprint) return void 0;
  const { characters } = useCharacterLibraryStore.getState();
  for (const character of characters) {
    const match = character.googleFlowMediaIdsBySource?.[fingerprint];
    if (match) return match;
  }
  const { scenes } = useSceneStore.getState();
  for (const scene of scenes) {
    const match = scene.googleFlowMediaIdsBySource?.[fingerprint];
    if (match) return match;
  }
  return void 0;
}
function resolveGoogleFlowReferenceBias(sources) {
  const uniqueSources = [...new Set(sources.filter(Boolean))];
  if (!uniqueSources.length) return { hints: {} };
  const readyCredentials = (useGoogleFlowRuntimeStore.getState().status?.credentials || []).filter((credential) => credential.state === "ready");
  if (!readyCredentials.length) return { hints: {} };
  const bySource = /* @__PURE__ */ new Map();
  const counts = /* @__PURE__ */ new Map();
  for (const source of uniqueSources) {
    const mediaByOwnerScope = lookupMediaByOwnerScope(source);
    bySource.set(source, mediaByOwnerScope);
    if (!mediaByOwnerScope) continue;
    for (const ownerScopeId of Object.keys(mediaByOwnerScope)) {
      counts.set(ownerScopeId, (counts.get(ownerScopeId) || 0) + 1);
    }
  }
  if (!counts.size) return { hints: {} };
  let bestOwnerScopeId;
  let bestCount = 0;
  for (const credential of readyCredentials) {
    const count = counts.get(credential.ownerScopeId) || 0;
    if (count > bestCount) {
      bestCount = count;
      bestOwnerScopeId = credential.ownerScopeId;
    }
  }
  if (!bestOwnerScopeId || bestCount === 0) return { hints: {} };
  const preferredCredentialId = readyCredentials.find((c) => c.ownerScopeId === bestOwnerScopeId)?.credentialId;
  const hints = {};
  for (const source of uniqueSources) {
    const stored = bySource.get(source)?.[bestOwnerScopeId];
    if (stored) hints[source] = { mediaId: stored.mediaId, ownerScopeId: bestOwnerScopeId, flowProjectId: stored.flowProjectId };
  }
  return { preferredCredentialId, hints };
}
const normalizeUrlValue = (url) => {
  if (!url) return void 0;
  if (Array.isArray(url)) return url[0] || void 0;
  if (typeof url === "string") return url;
  return void 0;
};
function useImageGeneration(deps) {
  const {
    splitScenes,
    storyboardConfig,
    currentStyleId,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneField,
    autoSaveImageToLibrary,
    references,
    timers,
    runtime,
    t
  } = deps;
  const {
    getCharacterReferenceDetails,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    getSceneShotIndex,
    processReferenceImagesForApi
  } = references;
  const { markImageTimerStarted, clearImageTimer, startBatchProgress, incrementBatchProgress, finishBatchProgress } = timers;
  const {
    setIsGenerating,
    setIsMergedRunning,
    activeImageControllersRef,
    activeVideoControllersRef,
    imageAbortRef,
    batchAbortRef,
    setGoogleFlowTaskIdBySceneId
  } = runtime;
  const handleGenerateSingleImage = reactExports.useCallback(async (sceneId, options = {}) => {
    const scene = getSceneByIdFromStore(sceneId) || splitScenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const { manageRunState = true, suppressSuccessToast = false, signal } = options;
    const featureConfig = getFeatureConfig("character_generation");
    if (!featureConfig) {
      toast.error(t("director.configureImageMapping"));
      return;
    }
    const keyManager = featureConfig.keyManager;
    const apiKey = keyManager.getCurrentKey() || featureConfig.apiKey || "";
    if (!apiKey && featureConfig.platform !== "googleflow") {
      toast.error(t("director.configureImageMapping"));
      return;
    }
    const platform = featureConfig.platform;
    const model = featureConfig.models?.[0];
    if (!model) {
      toast.error(t("director.configureImageModel"));
      return;
    }
    const imageBaseUrl = featureConfig.baseUrl?.replace(/\/+$/, "");
    if (!imageBaseUrl) {
      toast.error(t("director.configureImageMapping"));
      return;
    }
    console.log("[SingleImage] Using config:", { platform, model, imageBaseUrl });
    const rawPromptToUse = scene.imagePrompt?.trim() || "";
    if (!rawPromptToUse) {
      toast.warning(t("director.fillStartPromptFirst"));
      return;
    }
    const latestDirectorState = useDirectorStore.getState();
    const latestProject = latestDirectorState.activeProjectId ? latestDirectorState.projects[latestDirectorState.activeProjectId] : null;
    const latestStyleId = latestProject?.storyboardConfig?.visualStyleId || currentStyleId;
    const stylePrompt = latestStyleId ? getStylePrompt(latestStyleId) : "";
    const promptToUse = [expandLinkedPromptMarkers(rawPromptToUse), stylePrompt].filter(Boolean).join(", ");
    const missingShotRefs = getMissingShotReferenceLabels(scene);
    if (missingShotRefs.length > 0) {
      const message = t("director.missingShotRefs", { refs: missingShotRefs.join(", ") });
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: "failed",
        imageProgress: 0,
        imageError: message
      });
      toast.error(message);
      return;
    }
    if (manageRunState) {
      setIsGenerating(true);
    }
    const imageController = new AbortController();
    linkAbortSignals(imageController, signal);
    activeImageControllersRef.current.set(sceneId, imageController);
    if (manageRunState) {
      imageAbortRef.current = imageController;
    }
    const imageSignal = imageController.signal;
    try {
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: "uploading",
        imageProgress: 0,
        imageError: null
      });
      const characterRefDetails = getCharacterReferenceDetails(scene.characterIds || []);
      const characterRefs = characterRefDetails.map((item) => item.value);
      const shotRefDetails = getShotReferenceDetails(scene).filter((item) => item.value);
      const shotRefs = shotRefDetails.map((item) => item.value);
      const rawRefs = [
        scene.sceneMasterReferenceImage,
        scene.sceneReferenceImage,
        ...shotRefs,
        ...characterRefs
      ].filter(Boolean);
      const trimmedRawRefs = rawRefs.slice(0, MAX_REFERENCE_IMAGES);
      const referenceBias = platform === "googleflow" ? resolveGoogleFlowReferenceBias(trimmedRawRefs) : { hints: {}, preferredCredentialId: void 0 };
      const referenceImages = await processReferenceImagesForApi(trimmedRawRefs, "[SingleImage]");
      const imageGenerationMode = referenceImages.length > 0 ? "i2i" : "t2i";
      console.log("[SingleImage][Refs] Scene reference summary:", {
        sceneId,
        sceneName: scene.sceneName,
        characterIds: scene.characterIds || [],
        characterVariationMap: scene.characterVariationMap || {},
        shotRefIndexes: normalizeRefImageIndexes(scene.ref_image),
        shotRefCount: shotRefs.length,
        shotRefPreviews: shotRefDetails.map((detail) => ({
          shotIndex: detail.shotIndex,
          sceneId: detail.sceneId,
          preview: detail.value.slice(0, 120)
        })),
        characterRefDetails,
        hasSceneReferenceImage: !!scene.sceneReferenceImage,
        sceneReferenceImageType: !scene.sceneReferenceImage ? "missing" : String(scene.sceneReferenceImage).startsWith("http://") || String(scene.sceneReferenceImage).startsWith("https://") ? "http" : String(scene.sceneReferenceImage).startsWith("data:image/") ? "base64" : String(scene.sceneReferenceImage).startsWith("local-image://") ? "local-image" : "unknown",
        sceneReferenceImagePreview: scene.sceneReferenceImage ? String(scene.sceneReferenceImage).slice(0, 120) : "",
        characterRefCount: characterRefs.length,
        characterRefPreviews: characterRefDetails.map((detail, idx) => ({
          index: idx,
          characterId: detail.characterId,
          characterName: detail.characterName,
          source: detail.source,
          valueType: detail.valueType,
          preview: detail.preview
        })),
        rawRefCount: rawRefs.length,
        processedRefCount: referenceImages.length,
        processedRefPreviews: referenceImages.map((ref, idx) => ({
          index: idx,
          preview: String(ref).slice(0, 120)
        })),
        generationMode: imageGenerationMode
      });
      console.log("[SplitScenes] Generating image:", {
        sceneId,
        prompt: promptToUse.substring(0, 100),
        refCount: referenceImages.length,
        generationMode: imageGenerationMode,
        platform,
        model
      });
      const googleFlowTaskId = platform === "googleflow" ? crypto.randomUUID() : void 0;
      if (googleFlowTaskId) {
        setGoogleFlowTaskIdBySceneId((current) => ({ ...current, [sceneId]: googleFlowTaskId }));
      }
      const apiResult = await submitGridImageRequest({
        platform,
        model,
        prompt: promptToUse,
        apiKey,
        baseUrl: imageBaseUrl,
        aspectRatio: storyboardConfig.aspectRatio || "9:16",
        referenceImages: referenceImages.length > 0 ? referenceImages : void 0,
        referenceMediaHints: referenceBias.hints,
        preferredCredentialId: referenceBias.preferredCredentialId,
        taskId: googleFlowTaskId,
        onSubmitted: (submittedAt) => {
          if (imageSignal.aborted) return;
          updateSplitSceneImageStatus(sceneId, {
            imageStatus: "generating",
            imageProgress: 0,
            imageError: null
          });
          markImageTimerStarted(sceneId, submittedAt);
        },
        signal: imageSignal
      });
      if (apiResult.imageUrl) {
        const persistResult = await persistSceneImage(apiResult.imageUrl, sceneId, "first");
        updateSplitSceneImage(sceneId, persistResult.localPath, scene.width, scene.height, persistResult.httpUrl || void 0);
        if (platform === "googleflow") {
          updateSplitSceneField(sceneId, "imageProviderState", {
            provider: "googleflow",
            preferredCredentialId: apiResult.credentialId,
            accountId: apiResult.accountId,
            ownerScopeId: apiResult.ownerScopeId,
            projectId: apiResult.flowProjectId,
            mediaIdsByOwnerScope: apiResult.mediaId && apiResult.ownerScopeId ? { [apiResult.ownerScopeId]: apiResult.mediaId } : void 0
          });
        }
        autoSaveImageToLibrary(sceneId, persistResult.localPath);
        if (!suppressSuccessToast) {
          toast.success(t("director.imageDoneSaved", { index: sceneId + 1 }));
        }
        if (manageRunState) {
          setIsGenerating(false);
        }
        return;
      }
      let taskId = apiResult.taskId;
      console.log("[SplitScenes] Async task:", taskId);
      if (taskId) {
        const initialPollDelay = 3e4;
        const pollInterval = 5e3;
        updateSplitSceneImageStatus(sceneId, { imageProgress: 5 });
        await new Promise((resolve, reject) => {
          const tid = setTimeout(resolve, initialPollDelay);
          imageSignal.addEventListener("abort", () => {
            clearTimeout(tid);
            reject(new Error("Cancelled by user"));
          }, { once: true });
        });
        for (let attempt = 0; ; attempt++) {
          const progress = Math.min(10 + attempt, 95);
          updateSplitSceneImageStatus(sceneId, { imageProgress: progress });
          const url = new URL(`${imageBaseUrl}/v1/tasks/${taskId}`);
          url.searchParams.set("_ts", Date.now().toString());
          const statusResponse = await fetch(url.toString(), {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Cache-Control": "no-cache"
            },
            signal: imageSignal
          });
          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              throw new Error("Task not found");
            }
            throw new Error(`Failed to check task status: ${statusResponse.status}`);
          }
          const statusData = await statusResponse.json();
          const status = (statusData.status ?? statusData.data?.status ?? "unknown").toString().toLowerCase();
          if (status === "completed" || status === "succeeded" || status === "success") {
            const images = statusData.result?.images ?? statusData.data?.result?.images;
            let imageUrl;
            if (images?.[0]) {
              const rawUrl = images[0].url || images[0];
              imageUrl = normalizeUrlValue(rawUrl);
            }
            imageUrl = imageUrl || normalizeUrlValue(statusData.output_url) || normalizeUrlValue(statusData.result_url) || normalizeUrlValue(statusData.url);
            if (!imageUrl) throw new Error("Task completed but returned no image URL");
            const persistResult = await persistSceneImage(imageUrl, sceneId, "first");
            updateSplitSceneImage(sceneId, persistResult.localPath, scene.width, scene.height, persistResult.httpUrl || void 0);
            autoSaveImageToLibrary(sceneId, persistResult.localPath);
            if (!suppressSuccessToast) {
              toast.success(t("director.imageDoneSaved", { index: sceneId + 1 }));
            }
            if (manageRunState) {
              setIsGenerating(false);
            }
            return;
          }
          if (status === "failed" || status === "error") {
            const errorMsg = statusData.error || statusData.message || statusData.data?.error || "Image generation failed";
            console.error("[SplitScenes] Task failed:", statusData);
            throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
          }
          await new Promise((resolve, reject) => {
            const tid = setTimeout(resolve, pollInterval);
            imageSignal.addEventListener("abort", () => {
              clearTimeout(tid);
              reject(new Error("Cancelled by user"));
            }, { once: true });
          });
        }
      }
      throw new Error("Invalid API response: no image URL or task ID");
    } catch (error) {
      const err = error;
      const userMessage = err.message;
      if (err.name === "AbortError" || err.message === "Cancelled by user") {
        console.log(`[SplitScenes] Scene ${sceneId} image generation cancelled by user`);
        if (manageRunState) {
          setIsGenerating(false);
        }
        return;
      }
      console.error(`[SplitScenes] Scene ${sceneId} image generation failed:`, err);
      updateSplitSceneImageStatus(sceneId, {
        imageStatus: "failed",
        imageProgress: 0,
        imageError: userMessage
      });
      toast.error(t("director.shotFailed", { index: sceneId + 1, message: userMessage }));
    } finally {
      if (manageRunState) {
        setIsGenerating(activeImageControllersRef.current.size > 1 || activeVideoControllersRef.current.size > 0);
      }
      clearImageTimer(sceneId);
      activeImageControllersRef.current.delete(sceneId);
    }
  }, [
    splitScenes,
    storyboardConfig,
    currentStyleId,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneField,
    autoSaveImageToLibrary,
    getCharacterReferenceDetails,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    processReferenceImagesForApi,
    markImageTimerStarted,
    clearImageTimer,
    setIsGenerating,
    activeImageControllersRef,
    activeVideoControllersRef,
    imageAbortRef,
    setGoogleFlowTaskIdBySceneId,
    t
  ]);
  const handleGenerateAllImages = reactExports.useCallback(async () => {
    if (splitScenes.length === 0) return;
    const imageFeatureConfig = getFeatureConfig("character_generation");
    await syncRuntimeLaneSettings();
    const imageLaneCount = await resolveLaneCount("image", imageFeatureConfig?.platform);
    const queueWorkers = buildLaneWorkers([], imageLaneCount);
    const queuedScenes = splitScenes.filter((scene) => !scene.imageDataUrl && !!scene.imagePrompt?.trim() && (scene.imageStatus === "idle" || scene.imageStatus === "failed"));
    if (queuedScenes.length === 0) {
      toast.info(t("director.allImagesReady"));
      return;
    }
    queuedScenes.forEach((scene) => {
      updateSplitSceneImageStatus(scene.id, {
        imageStatus: "queued",
        imageProgress: 0,
        imageError: null
      });
    });
    const batchController = new AbortController();
    batchAbortRef.current = batchController;
    const flowSettings = getGenerationFlowSettings();
    const hasShotRefDependencies = queuedScenes.some((scene) => normalizeRefImageIndexes(scene.ref_image).length > 0);
    const runQueuedScene = async (scene) => {
      try {
        await withRetry(
          {
            attempts: flowSettings.retryAttempts + 1,
            signal: batchController.signal,
            onRetry: () => {
              updateSplitSceneImageStatus(scene.id, {
                imageStatus: "queued",
                imageProgress: 0,
                imageError: null
              });
            }
          },
          async () => {
            const timeoutMs = randomBetween(flowSettings.imageTimeoutMinMs, flowSettings.imageTimeoutMaxMs);
            const timeout = createTimeoutSignal(batchController.signal, timeoutMs);
            try {
              await handleGenerateSingleImage(scene.id, {
                manageRunState: false,
                signal: timeout.signal
              });
            } catch (error) {
              if (batchController.signal.aborted) throw new DOMException("Cancelled by user", "AbortError");
              if (!isAbortLikeError(error)) {
                console.error(`[SplitScenes] Batch: Scene ${scene.id} image generation failed:`, error);
              }
            } finally {
              timeout.cleanup();
            }
            if (batchController.signal.aborted) throw new DOMException("Cancelled by user", "AbortError");
            const latest = getSceneByIdFromStore(scene.id);
            if (latest?.imageStatus === "completed" && !!latest.imageDataUrl) {
              incrementBatchProgress("completed");
              return;
            }
            throw new Error(latest?.imageError || "Image generation timed out or failed after retry.");
          }
        );
      } catch (error) {
        if (batchController.signal.aborted) return false;
        if (isAbortLikeError(error)) return false;
        const latest = getSceneByIdFromStore(scene.id);
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: "failed",
          imageProgress: 0,
          imageError: latest?.imageError || "Image generation timed out or failed after retry."
        });
        incrementBatchProgress("failed");
      }
      return true;
    };
    setIsMergedRunning(true);
    startBatchProgress("images", queuedScenes.length);
    try {
      if (hasShotRefDependencies) {
        const orderedScenes = [...queuedScenes].sort((a, b) => getSceneShotIndex(a) - getSceneShotIndex(b));
        for (const scene of orderedScenes) {
          if (batchController.signal.aborted) break;
          const latestBeforeRun = getSceneByIdFromStore(scene.id) || scene;
          const missingRefs = getMissingShotReferenceLabels(latestBeforeRun);
          if (missingRefs.length > 0) {
            const message = t("director.missingShotRefs", { refs: missingRefs.join(", ") });
            updateSplitSceneImageStatus(scene.id, {
              imageStatus: "failed",
              imageProgress: 0,
              imageError: message
            });
            incrementBatchProgress("failed");
            continue;
          }
          const shouldContinue = await runQueuedScene(scene);
          if (!shouldContinue) break;
        }
      } else {
        await runLaneQueue(
          queuedScenes.map((scene) => ({ item: scene })),
          queueWorkers,
          async ({ item: scene }) => {
            await runQueuedScene(scene);
          },
          batchController.signal
        );
      }
      if (batchController.signal.aborted) return;
      const state = useDirectorStore.getState();
      const activeProjectId = state.activeProjectId;
      const latestScenes = activeProjectId ? state.projects[activeProjectId]?.splitScenes || [] : [];
      const completedCount = queuedScenes.filter((scene) => {
        const latest = latestScenes.find((item) => item.id === scene.id);
        return !!latest?.imageDataUrl && latest.imageStatus === "completed";
      }).length;
      const failedCount = queuedScenes.filter((scene) => {
        const latest = latestScenes.find((item) => item.id === scene.id);
        return latest?.imageStatus === "failed";
      }).length;
      if (completedCount === queuedScenes.length) {
        toast.success("Đã tạo xong tất cả ảnh");
      } else if (completedCount > 0) {
        toast.info(`Đã tạo ${completedCount}/${queuedScenes.length} ảnh. ${failedCount > 0 ? `${failedCount} ảnh lỗi.` : "Một số ảnh chưa hoàn tất."}`);
      } else {
        toast.warning(`Chưa có ảnh nào hoàn tất trong ${queuedScenes.length} ảnh đã chạy.`);
      }
    } finally {
      if (batchAbortRef.current === batchController) {
        batchAbortRef.current = null;
      }
      setIsMergedRunning(false);
      finishBatchProgress();
    }
  }, [
    splitScenes,
    handleGenerateSingleImage,
    updateSplitSceneImageStatus,
    getMissingShotReferenceLabels,
    getSceneShotIndex,
    t,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress,
    setIsMergedRunning,
    batchAbortRef
  ]);
  return { handleGenerateSingleImage, handleGenerateAllImages };
}
async function normalizeSource(ref) {
  if (!ref.source.startsWith("local-image://")) return ref;
  const result = await window.imageStorage?.readAsBase64(ref.source);
  if (!result?.success || !result.base64) throw new Error(result?.error || "Không thể đọc ảnh đầu vào cho Grok");
  const dataUrl = result.base64.startsWith("data:") ? result.base64 : `data:${result.mimeType || "image/jpeg"};base64,${result.base64}`;
  return { ...ref, source: dataUrl };
}
async function withCancellation(signal, call, onSubmitted, metadata) {
  const taskId = crypto.randomUUID();
  if (metadata) taskMetadata.begin({ ...metadata, id: taskId, queuedAt: Date.now(), status: "queued" });
  const onAbort = () => {
    void window.grokVideoRuntime?.cancelTask(taskId);
  };
  let submitted = false;
  const offTask = metadata || onSubmitted ? window.grokVideoRuntime?.onTask((task) => {
    if (task.taskId !== taskId) return;
    if (!submitted && task.taskId === taskId && task.status === "submitting") {
      submitted = true;
      taskMetadata.submitted(taskId);
      onSubmitted?.();
    }
    if (task.status === "polling" || task.status === "downloading") {
      taskMetadata.update(taskId, { status: "running" });
    }
  }) : void 0;
  if (signal?.aborted) throw new DOMException("Cancelled by user", "AbortError");
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    const result = await call(taskId);
    taskMetadata.completed(taskId, result.localUrl || result.remoteUrl, { mediaId: result.mediaId });
    return result;
  } catch (error) {
    taskMetadata.failed(taskId, error);
    throw error;
  } finally {
    offTask?.();
    signal?.removeEventListener("abort", onAbort);
  }
}
const grokVideoProvider = {
  id: "grok",
  async generateImage(_input) {
    throw new Error("Grok trong logdd hiện chỉ dùng cho tạo video.");
  },
  async generateVideo(input) {
    const settings = useVideoStudioSettingsStore.getState().maxStudioLanes;
    const videoLanesPerExtension = Math.max(1, settings.videoLanesPerJwt || 1);
    await window.grokVideoRuntime?.updateSettings({
      videoLanesPerExtension,
      videoSubmitDelayMinMs: settings.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: settings.videoSubmitDelayMaxMs,
      extensionStartStaggerMinMs: settings.jwtStartStaggerMinMs,
      extensionStartStaggerMaxMs: settings.jwtStartStaggerMaxMs
    });
    if (!window.grokVideoRuntime) throw new Error("Grok Video chỉ hoạt động trong ứng dụng logdd desktop.");
    const startImage = input.startImage ? await normalizeSource(input.startImage) : void 0;
    const endImage = input.endImage ? await normalizeSource(input.endImage) : void 0;
    const { onSubmitted, ...runtimeInput } = input;
    return withCancellation(
      input.signal,
      (taskId) => window.grokVideoRuntime.generateVideo({ ...runtimeInput, taskId, startImage, endImage }),
      onSubmitted,
      {
        kind: "video",
        provider: "Grok",
        model: "Grok Video",
        prompt: input.prompt,
        details: {
          duration: input.duration,
          aspectRatio: input.aspectRatio,
          mode: endImage ? "start-end" : startImage ? "start" : "text"
        }
      }
    );
  },
  async cancel(taskId) {
    await window.grokVideoRuntime?.cancelTask(taskId);
  }
};
function toGoogleFlowMediaRef(source, state) {
  const ownerScopeId = state?.ownerScopeId;
  return {
    source,
    provider: "googleflow",
    ownerScopeId,
    flowProjectId: state?.projectId,
    mediaId: ownerScopeId ? state?.mediaIdsByOwnerScope?.[ownerScopeId] : void 0
  };
}
async function generateProviderVideo(params) {
  if (params.platform === "grok") {
    const projectId2 = params.projectId || useProjectStore.getState().activeProjectId || "default-project";
    const result2 = await grokVideoProvider.generateVideo({
      projectId: projectId2,
      sceneId: String(params.sceneId),
      prompt: params.prompt,
      model: params.model,
      aspectRatio: params.aspectRatio || "16:9",
      duration: Number(params.length) || void 0,
      startImage: params.startImageUrl ? { source: params.startImageUrl, provider: "grok" } : void 0,
      endImage: params.endImageUrl ? { source: params.endImageUrl, provider: "grok" } : void 0,
      onSubmitted: params.onSubmitted,
      signal: params.signal
    });
    const videoUrl2 = result2.localUrl || result2.remoteUrl;
    if (!videoUrl2) throw new Error("Grok returned no video URL");
    return { videoUrl: videoUrl2, taskId: result2.taskId, mediaId: result2.mediaId, credentialId: result2.credentialId };
  }
  if (params.platform !== "googleflow") {
    throw new Error(`Unsupported video platform: ${params.platform}. Only "googleflow" and "grok" are supported.`);
  }
  const projectId = params.projectId || useProjectStore.getState().activeProjectId || "default-project";
  const result = await googleFlowProvider.generateVideo({
    projectId,
    sceneId: String(params.sceneId),
    prompt: params.prompt,
    model: params.model,
    aspectRatio: params.aspectRatio || "16:9",
    duration: Number(params.length) || void 0,
    startImage: params.startImageUrl ? toGoogleFlowMediaRef(params.startImageUrl, params.startImageFlowState) : void 0,
    endImage: params.endImageUrl ? toGoogleFlowMediaRef(params.endImageUrl, params.endImageFlowState) : void 0,
    references: params.referenceImageUrls?.map((source) => toGoogleFlowMediaRef(source, params.referenceImageFlowStates?.[source])),
    preferredCredentialId: params.preferredCredentialId || params.startImageFlowState?.preferredCredentialId || params.referenceImageUrls?.map((source) => params.referenceImageFlowStates?.[source]?.preferredCredentialId).find(Boolean),
    taskId: params.taskId,
    onSubmitted: params.onSubmitted,
    signal: params.signal
  });
  const videoUrl = result.localUrl || result.remoteUrl;
  if (!videoUrl) throw new Error("Google Flow returned no video URL");
  return {
    videoUrl,
    taskId: result.taskId,
    mediaId: result.mediaId,
    credentialId: result.credentialId,
    accountId: result.accountId,
    ownerScopeId: result.ownerScopeId,
    flowProjectId: result.flowProjectId
  };
}
function buildVideoPrompt(scene, options = {}) {
  const parts = [];
  if (scene.sceneName || scene.sceneLocation) {
    const info = [...new Set([scene.sceneName, scene.sceneLocation].map((value) => value?.trim()).filter(Boolean))].join(" - ");
    parts.push(`Setting: ${info}`);
  }
  const promptParts = splitVideoPromptVoiceOver(scene.videoPrompt);
  const base = promptParts.videoPrompt;
  if (base) parts.push(base);
  if (options.includeVoiceOver) {
    const voiceOver = buildPromptVoiceOverSuffix(scene.voiceOver || promptParts.voiceOver);
    if (voiceOver) parts.push(voiceOver);
  }
  return parts.join(". ");
}
function useVideoGeneration(deps) {
  const {
    splitScenes,
    storyboardConfig,
    frameMode,
    isRefToVideo,
    allCharacters,
    updateSplitSceneVideo,
    updateSplitSceneField,
    autoSaveVideoToLibrary,
    references,
    timers,
    runtime,
    t
  } = deps;
  const { getCharacterReferenceImages, getShotReferenceDetails, getMissingShotReferenceLabels } = references;
  const { markVideoTimerStarted, clearVideoTimer, startBatchProgress, incrementBatchProgress, finishBatchProgress } = timers;
  const {
    setIsGenerating,
    setCurrentGeneratingId,
    activeImageControllersRef,
    activeVideoControllersRef,
    videoAbortRef,
    batchAbortRef,
    setGoogleFlowVideoTaskIdBySceneId
  } = runtime;
  const handleGenerateSingleVideo = reactExports.useCallback(async (sceneId, options = {}) => {
    const scene = getSceneByIdFromStore(sceneId) || splitScenes.find((s) => s.id === sceneId);
    if (!scene) return;
    const { manageRunState = true, suppressSuccessToast = false, signal } = options;
    const buildSceneVideoPrompt = (audioVoice) => applyCharacterIdentityToPrompt(
      buildVideoPrompt(scene, {
        includeVoiceOver: Boolean(scene.voiceOver?.trim() && (storyboardConfig.voiceMode === "full" || audioVoice))
      }),
      scene
    );
    useAPIConfigStore.getState();
    const featureConfig = getFeatureConfig("video_generation");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("video_generation"));
      return;
    }
    const platform = featureConfig.platform;
    const model = featureConfig.model || featureConfig.models?.[0];
    if (!model) {
      toast.error(t("director.configureVideoModel"));
      return;
    }
    const videoBaseUrl = featureConfig.baseUrl?.replace(/\/+$/, "");
    if (!videoBaseUrl) {
      toast.error(t("director.configureVideoMapping"));
      return;
    }
    const isGoogleFlowVideo = platform === "googleflow";
    const isGrokVideo = platform === "grok";
    if (!isGoogleFlowVideo && !isGrokVideo) {
      toast.error("Tính năng tạo video hỗ trợ Google Flow hoặc Grok.");
      return;
    }
    const keyManager = featureConfig.keyManager;
    const apiKey = keyManager.getCurrentKey() || featureConfig.apiKey || "";
    if (!apiKey && !isGoogleFlowVideo && !isGrokVideo) {
      toast.error(t("director.configurePlatformKey", { platform }));
      return;
    }
    if (manageRunState) {
      setIsGenerating(true);
      setCurrentGeneratingId(sceneId);
    }
    const videoController = new AbortController();
    linkAbortSignals(videoController, signal);
    activeVideoControllersRef.current.set(sceneId, videoController);
    if (manageRunState) {
      videoAbortRef.current = videoController;
    }
    let hasSubmittedVideoRequest = false;
    const handleVideoSubmitted = (submittedAt) => {
      if (hasSubmittedVideoRequest) return;
      hasSubmittedVideoRequest = true;
      updateSplitSceneVideo(sceneId, {
        videoStatus: "generating",
        videoProgress: 0
      });
      markVideoTimerStarted(sceneId, submittedAt);
    };
    try {
      updateSplitSceneVideo(sceneId, {
        videoStatus: "queued",
        videoProgress: 0,
        videoError: null,
        videoUrl: null
      });
      if (isRefToVideo) {
        const sceneRef = scene.sceneReferenceImage;
        const sceneMasterRef = scene.sceneMasterReferenceImage;
        const missingShotRefs = getMissingShotReferenceLabels(scene);
        if (missingShotRefs.length > 0) {
          const message = t("director.missingShotRefs", { refs: missingShotRefs.join(", ") });
          toast.error(message);
          updateSplitSceneVideo(sceneId, { videoStatus: "idle", videoProgress: 0, videoError: message });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }
        const shotRefs = getShotReferenceDetails(scene).map((item) => item.value).filter(Boolean);
        const characterRefs = scene.characterIds?.length ? getCharacterReferenceImages(scene.characterIds) : [];
        const rawRefs = [sceneMasterRef, sceneRef, ...shotRefs, ...characterRefs].filter(Boolean);
        if (rawRefs.length === 0) {
          toast.error(t("director.noCharacterRefs"));
          updateSplitSceneVideo(sceneId, { videoStatus: "idle", videoProgress: 0 });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }
        const maxStudioRefInputs = rawRefs.slice(0, MAX_REFERENCE_IMAGES);
        const processedRefs = maxStudioRefInputs;
        const referenceBias = platform === "googleflow" ? resolveGoogleFlowReferenceBias(processedRefs) : { hints: {}, preferredCredentialId: void 0 };
        const referenceImageFlowStates = {};
        for (const [source, hint] of Object.entries(referenceBias.hints)) {
          referenceImageFlowStates[source] = {
            ownerScopeId: hint.ownerScopeId,
            projectId: hint.flowProjectId,
            mediaIdsByOwnerScope: { [hint.ownerScopeId]: hint.mediaId }
          };
        }
        if (processedRefs.length === 0) {
          toast.error(t("director.noCharacterRefs"));
          updateSplitSceneVideo(sceneId, { videoStatus: "idle", videoProgress: 0 });
          if (manageRunState) {
            setIsGenerating(false);
            setCurrentGeneratingId(null);
          }
          return;
        }
        const videoDuration2 = normalizeVideoLength(scene.videoLength);
        const audioVoice2 = resolveSceneAudioVoice(scene, allCharacters, storyboardConfig);
        const fullPrompt2 = buildSceneVideoPrompt(audioVoice2);
        console.log("[SplitScenes] Ref-to-video generation:", {
          sceneId,
          hasSceneRef: !!sceneRef,
          sceneRefPreview: sceneRef ? String(sceneRef).slice(0, 80) : "",
          shotRefCount: shotRefs.length,
          characterRefCount: characterRefs.length,
          refCount: processedRefs.length,
          audioVoice: audioVoice2,
          duration: videoDuration2,
          prompt: fullPrompt2.substring(0, 80)
        });
        const googleFlowVideoTaskId = platform === "googleflow" ? crypto.randomUUID() : void 0;
        if (googleFlowVideoTaskId) {
          setGoogleFlowVideoTaskIdBySceneId((current) => ({ ...current, [sceneId]: googleFlowVideoTaskId }));
        }
        const result2 = await generateProviderVideo({
          platform,
          sceneId,
          prompt: fullPrompt2,
          model,
          aspectRatio: storyboardConfig.aspectRatio,
          referenceImageUrls: processedRefs,
          referenceImageFlowStates,
          preferredCredentialId: referenceBias.preferredCredentialId,
          taskId: googleFlowVideoTaskId,
          length: videoDuration2,
          audioVoice: audioVoice2,
          onProgress: (progress) => {
            updateSplitSceneVideo(sceneId, { videoProgress: progress });
          },
          onSubmitted: handleVideoSubmitted,
          signal: videoController.signal
        });
        let finalVideoUrl2 = result2.videoUrl;
        if (platform === "googleflow") {
          updateSplitSceneField(sceneId, "videoProviderState", {
            provider: "googleflow",
            preferredCredentialId: result2.credentialId,
            accountId: result2.accountId,
            ownerScopeId: result2.ownerScopeId,
            projectId: result2.flowProjectId,
            mediaIdsByOwnerScope: result2.mediaId && result2.ownerScopeId ? { [result2.ownerScopeId]: result2.mediaId } : void 0
          });
        }
        try {
          const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
          finalVideoUrl2 = await saveVideoToLocal(finalVideoUrl2, filename);
          console.log("[SplitScenes] Ref-video saved locally:", finalVideoUrl2);
        } catch (e) {
          console.warn("[SplitScenes] Failed to save ref-video locally:", e);
        }
        const mediaId2 = autoSaveVideoToLibrary(sceneId, finalVideoUrl2, void 0, videoDuration2);
        updateSplitSceneVideo(sceneId, {
          videoStatus: "completed",
          videoProgress: 100,
          videoUrl: finalVideoUrl2,
          videoMediaId: mediaId2
        });
        if (!suppressSuccessToast) {
          toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
        }
        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }
      const audioVoice = resolveSceneAudioVoice(scene, allCharacters, storyboardConfig);
      const fullPrompt = buildSceneVideoPrompt(audioVoice);
      const videoDuration = normalizeVideoLength(scene.videoLength);
      let firstFrameUrl = scene.imageDataUrl || (isHttpImageUrl(scene.imageHttpUrl) ? scene.imageHttpUrl : "");
      const sceneIndex = splitScenes.findIndex((item) => item.id === sceneId);
      const nextScene = sceneIndex >= 0 ? splitScenes[sceneIndex + 1] : void 0;
      const crossesEpisodeBoundary = Boolean(
        scene.sourceEpisodeId && nextScene?.sourceEpisodeId && scene.sourceEpisodeId !== nextScene.sourceEpisodeId
      );
      const linkedEndScene = frameMode === "both" && !crossesEpisodeBoundary ? nextScene : void 0;
      const endFrameUrl = linkedEndScene ? linkedEndScene.imageDataUrl || (isHttpImageUrl(linkedEndScene.imageHttpUrl) ? linkedEndScene.imageHttpUrl : "") : "";
      const hasValidHttpUrl = isHttpImageUrl(scene.imageHttpUrl);
      const shouldRefreshFirstFrame = shouldRefreshImageViaCurrentHost(scene.imageDataUrl);
      if (isLocalImageSource(scene.imageDataUrl)) {
        if (shouldRefreshFirstFrame) {
          if (hasValidHttpUrl) {
            console.log(
              `[SplitScenes] Using local first frame and refreshing via configured image host${isDiscouragedExternalImageUrl(scene.imageHttpUrl) ? " (skipping discouraged external URL)" : ""}:`,
              scene.imageHttpUrl.substring(0, 60)
            );
          } else {
            console.log("[SplitScenes] Using local first frame and uploading to configured image host");
          }
          firstFrameUrl = scene.imageDataUrl;
        } else if (hasValidHttpUrl && scene.imageSource === "ai-generated") {
          console.log("[SplitScenes] Using imageHttpUrl for AI-generated image:", scene.imageHttpUrl.substring(0, 60));
          firstFrameUrl = scene.imageHttpUrl;
        } else {
          console.log(
            "[SplitScenes] Using imageDataUrl (will upload to image host):",
            hasValidHttpUrl ? "has old httpUrl but imageSource=" + scene.imageSource : "no valid httpUrl"
          );
        }
      }
      if (!firstFrameUrl) {
        if (!scene.videoPrompt?.trim()) {
          toast.error(t("director.noFirstFrame", { index: sceneId + 1 }));
          setIsGenerating(false);
          setCurrentGeneratingId(null);
          return;
        }
        const result2 = await generateProviderVideo({
          platform,
          sceneId,
          prompt: fullPrompt,
          model,
          aspectRatio: storyboardConfig.aspectRatio,
          length: videoDuration,
          audioVoice,
          onProgress: (progress) => {
            updateSplitSceneVideo(sceneId, { videoProgress: progress });
          },
          onSubmitted: handleVideoSubmitted,
          signal: videoController.signal
        });
        let finalVideoUrl2 = result2.videoUrl;
        if (platform === "googleflow") {
          updateSplitSceneField(sceneId, "videoProviderState", {
            provider: "googleflow",
            preferredCredentialId: result2.credentialId,
            accountId: result2.accountId,
            ownerScopeId: result2.ownerScopeId,
            projectId: result2.flowProjectId,
            mediaIdsByOwnerScope: result2.mediaId && result2.ownerScopeId ? { [result2.ownerScopeId]: result2.mediaId } : void 0
          });
        }
        try {
          const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
          finalVideoUrl2 = await saveVideoToLocal(result2.videoUrl, filename);
          console.log("[SplitScenes] Text-to-video saved locally:", finalVideoUrl2);
        } catch (e) {
          console.warn("[SplitScenes] Failed to save text-to-video locally, using URL:", e);
        }
        const mediaId2 = autoSaveVideoToLibrary(sceneId, finalVideoUrl2, void 0, videoDuration);
        updateSplitSceneVideo(sceneId, {
          videoStatus: "completed",
          videoProgress: 100,
          videoUrl: finalVideoUrl2,
          videoMediaId: mediaId2
        });
        if (!suppressSuccessToast) {
          toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
        }
        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }
      console.log("[SplitScenes] First frame source:", firstFrameUrl.startsWith("http") ? "HTTP URL" : "local/base64");
      console.log("[SplitScenes] Video generation params:", {
        sceneId,
        hasFirstFrame: !!firstFrameUrl,
        hasLinkedEndFrame: !!endFrameUrl,
        duration: videoDuration,
        fullPrompt
      });
      const result = await generateProviderVideo({
        platform,
        sceneId,
        prompt: fullPrompt,
        model,
        aspectRatio: storyboardConfig.aspectRatio,
        length: videoDuration,
        startImageUrl: firstFrameUrl,
        endImageUrl: endFrameUrl || void 0,
        preferredCredentialId: platform === "googleflow" ? scene.imageProviderState?.preferredCredentialId : void 0,
        startImageFlowState: platform === "googleflow" ? scene.imageProviderState : void 0,
        endImageFlowState: platform === "googleflow" ? linkedEndScene?.imageProviderState : void 0,
        audioVoice,
        onProgress: (progress) => {
          updateSplitSceneVideo(sceneId, { videoProgress: progress });
        },
        onSubmitted: handleVideoSubmitted,
        signal: videoController.signal
      });
      let finalVideoUrl = result.videoUrl;
      if (platform === "googleflow") {
        updateSplitSceneField(sceneId, "videoProviderState", {
          provider: "googleflow",
          preferredCredentialId: result.credentialId,
          accountId: result.accountId,
          ownerScopeId: result.ownerScopeId,
          projectId: result.flowProjectId,
          mediaIdsByOwnerScope: result.mediaId && result.ownerScopeId ? { [result.ownerScopeId]: result.mediaId } : void 0
        });
      }
      try {
        const filename = `scene_${sceneId + 1}_${Date.now()}.mp4`;
        finalVideoUrl = await saveVideoToLocal(result.videoUrl, filename);
        console.log("[SplitScenes] Video saved locally:", finalVideoUrl);
      } catch (e) {
        console.warn("[SplitScenes] Failed to save video locally, using URL:", e);
      }
      const mediaId = autoSaveVideoToLibrary(sceneId, finalVideoUrl, scene.imageDataUrl, videoDuration);
      updateSplitSceneVideo(sceneId, {
        videoStatus: "completed",
        videoProgress: 100,
        videoUrl: finalVideoUrl,
        videoMediaId: mediaId
      });
      if (!suppressSuccessToast) {
        toast.success(t("director.videoDoneSaved", { index: sceneId + 1 }));
      }
      if (manageRunState) {
        setIsGenerating(false);
        setCurrentGeneratingId(null);
      }
    } catch (error) {
      const err = error;
      if (err.name === "AbortError" || err.message === "Cancelled by user") {
        console.log(`[SplitScenes] Scene ${sceneId} video generation cancelled by user`);
        if (manageRunState) {
          setIsGenerating(false);
          setCurrentGeneratingId(null);
        }
        return;
      }
      console.error(`[SplitScenes] Scene ${sceneId} video generation failed:`, err);
      const isModerationError = isContentModerationError(err);
      if (isModerationError) {
        updateSplitSceneVideo(sceneId, {
          videoStatus: "failed",
          videoProgress: 0,
          videoError: `MODERATION_SKIPPED:${err.message}`
        });
        toast.warning(t("director.skippedModeration", { index: sceneId + 1 }));
        console.log(`[SplitScenes] Scene ${sceneId} skipped due to content moderation`);
      } else {
        updateSplitSceneVideo(sceneId, {
          videoStatus: "failed",
          videoProgress: 0,
          videoError: err.message
        });
        toast.error(t("director.shotFailed", { index: sceneId + 1, message: err.message }));
      }
    } finally {
      clearVideoTimer(sceneId);
      if (manageRunState) {
        setIsGenerating(activeImageControllersRef.current.size > 0 || activeVideoControllersRef.current.size > 1);
        setCurrentGeneratingId(null);
      }
      activeVideoControllersRef.current.delete(sceneId);
    }
  }, [
    splitScenes,
    storyboardConfig,
    frameMode,
    allCharacters,
    updateSplitSceneVideo,
    updateSplitSceneField,
    autoSaveVideoToLibrary,
    getCharacterReferenceImages,
    getShotReferenceDetails,
    getMissingShotReferenceLabels,
    isRefToVideo,
    markVideoTimerStarted,
    clearVideoTimer,
    setIsGenerating,
    setCurrentGeneratingId,
    activeImageControllersRef,
    activeVideoControllersRef,
    videoAbortRef,
    setGoogleFlowVideoTaskIdBySceneId,
    t
  ]);
  const generateVideosForScenes = reactExports.useCallback(async (sourceScenes) => {
    if (sourceScenes.length === 0) {
      toast.error(t("director.noShotsToGenerate"));
      return;
    }
    const featureConfig = getFeatureConfig("video_generation");
    if (!featureConfig) {
      toast.error(getFeatureNotConfiguredMessage("video_generation"));
      return;
    }
    const scenesWithoutPrompts = sourceScenes.filter(
      (s) => !s.videoPrompt?.trim()
    );
    if (scenesWithoutPrompts.length > 0) {
      toast.warning(t("director.missingPromptCount", { count: scenesWithoutPrompts.length }));
    }
    const scenesToGenerate = sourceScenes.filter(
      (s) => (s.videoStatus === "idle" || s.videoStatus === "failed") && !!s.videoPrompt?.trim() && (isRefToVideo || !!s.imageDataUrl || !s.imagePrompt?.trim())
    );
    if (scenesToGenerate.length === 0) {
      toast.info(t("director.allShotsAlreadyGenerating"));
      return;
    }
    await syncRuntimeLaneSettings();
    const laneCount = await resolveLaneCount("video", featureConfig.platform);
    const queueWorkers = buildLaneWorkers([], laneCount);
    scenesToGenerate.forEach((scene) => {
      updateSplitSceneVideo(scene.id, {
        videoStatus: "queued",
        videoProgress: 0,
        videoError: null
      });
    });
    const batchController = new AbortController();
    batchAbortRef.current = batchController;
    setIsGenerating(true);
    toast.info(t("director.startSerialVideo", { count: scenesToGenerate.length, concurrency: laneCount }));
    let successCount = 0;
    const totalCount = scenesToGenerate.length;
    const flowSettings = getGenerationFlowSettings();
    startBatchProgress("videos", totalCount);
    try {
      await runLaneQueue(
        scenesToGenerate.map((scene) => ({ item: scene })),
        queueWorkers,
        async ({ item: scene }) => {
          try {
            await withRetry(
              {
                attempts: flowSettings.retryAttempts + 1,
                signal: batchController.signal,
                retryable: (error) => !/tất cả tài khoản grok/i.test(error instanceof Error ? error.message : String(error)),
                onRetry: () => {
                  updateSplitSceneVideo(scene.id, {
                    videoStatus: "queued",
                    videoProgress: 0,
                    videoError: null,
                    videoUrl: null
                  });
                }
              },
              async () => {
                const timeoutMs = randomBetween(flowSettings.videoTimeoutMinMs, flowSettings.videoTimeoutMaxMs);
                const timeout = createTimeoutSignal(batchController.signal, timeoutMs);
                try {
                  await handleGenerateSingleVideo(scene.id, {
                    manageRunState: false,
                    signal: timeout.signal
                  });
                } catch (error2) {
                  if (batchController.signal.aborted) throw new DOMException("Cancelled by user", "AbortError");
                  if (!isAbortLikeError(error2)) {
                    console.error(`[SplitScenes] Batch: Scene ${scene.id} video generation failed:`, error2);
                  }
                } finally {
                  timeout.cleanup();
                }
                if (batchController.signal.aborted) throw new DOMException("Cancelled by user", "AbortError");
                const latest = getSceneByIdFromStore(scene.id);
                if (latest?.videoStatus === "completed" && latest.videoUrl) {
                  successCount++;
                  incrementBatchProgress("completed");
                  return;
                }
                const error = latest?.videoError || "Video generation timed out or failed after retry.";
                if (/tất cả tài khoản grok/i.test(error)) {
                  toast.error("Tất cả tài khoản Grok đã hết lượt tạo video — đã dừng tạo hàng loạt.");
                  batchController.abort();
                  throw new DOMException("Cancelled by user", "AbortError");
                }
                throw new Error(error);
              }
            );
          } catch (error) {
            if (batchController.signal.aborted) return;
            if (isAbortLikeError(error)) return;
            const latest = getSceneByIdFromStore(scene.id);
            updateSplitSceneVideo(scene.id, {
              videoStatus: "failed",
              videoProgress: 0,
              videoError: latest?.videoError || "Video generation timed out or failed after retry."
            });
            incrementBatchProgress("failed");
          }
        },
        batchController.signal
      );
    } finally {
      if (batchAbortRef.current === batchController) {
        batchAbortRef.current = null;
      }
      setIsGenerating(false);
      setCurrentGeneratingId(null);
      finishBatchProgress();
    }
    if (batchController.signal.aborted) return;
    if (successCount === totalCount) {
      toast.success(t("director.allVideosDone"));
    } else if (successCount > 0) {
      toast.info(t("director.someVideosDone", { success: successCount, total: totalCount, failed: totalCount - successCount }));
    }
  }, [
    handleGenerateSingleVideo,
    updateSplitSceneVideo,
    isRefToVideo,
    t,
    startBatchProgress,
    incrementBatchProgress,
    finishBatchProgress,
    setIsGenerating,
    setCurrentGeneratingId,
    batchAbortRef
  ]);
  const handleGenerateVideos = reactExports.useCallback(async () => {
    await generateVideosForScenes(splitScenes);
  }, [generateVideosForScenes, splitScenes]);
  return { handleGenerateSingleVideo, generateVideosForScenes, handleGenerateVideos };
}
function ProjectVoiceControls({
  voiceMode = "off",
  narratorVoice,
  onVoiceModeChange,
  onNarratorVoiceChange,
  disabled = false,
  compact = false
}) {
  const { t } = useI18n();
  const narratorDisabled = disabled || voiceMode !== "full";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: t("voice.mode") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: voiceMode, onValueChange: (value) => onVoiceModeChange(value), disabled, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: compact ? "w-[140px] h-8 text-xs" : "w-[160px] h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "off", className: "text-xs", children: t("voice.mode.off") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "selective", className: "text-xs", children: t("voice.mode.selective") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ref", className: "text-xs", children: t("voice.mode.ref") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "full", className: "text-xs", children: t("voice.mode.full") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: t("voice.narrator") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          value: narratorVoice || "",
          onChange: (e) => onNarratorVoiceChange(e.target.value.trim() || void 0),
          placeholder: t("voice.selectNarrator"),
          disabled: narratorDisabled,
          className: compact ? "w-[160px] h-8 text-xs" : "w-[180px] h-8 text-xs"
        }
      )
    ] })
  ] });
}
function BatchProgressBar({ progress }) {
  if (!progress) return null;
  const finishedCount = progress.completed + progress.failed;
  const percent = progress.total > 0 ? Math.min(100, Math.round(finishedCount / progress.total * 100)) : 0;
  const statusLabel = progress.active ? progress.label : "Hoàn tất batch";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/30 px-3 py-2 text-xs", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
        statusLabel,
        ": ",
        progress.completed,
        "/",
        progress.total
      ] }),
      progress.failed > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-destructive", children: [
        "Lỗi ",
        progress.failed
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: cn(
          "h-full rounded-full transition-all duration-300",
          progress.phase === "images" ? "bg-blue-500" : "bg-emerald-500"
        ),
        style: { width: `${percent}%` }
      }
    ) })
  ] });
}
function BatchActions({
  splitScenes,
  isRefToVideo,
  isGenerating,
  isMergedRunning,
  onGenerateAllFlow,
  onGenerateAllImages,
  onGenerateVideos,
  t
}) {
  if (isRefToVideo) {
    const scenesNeedVideo2 = splitScenes.filter((s) => s.videoStatus === "idle" || s.videoStatus === "failed").length;
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-w-0 grid-cols-1 gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: onGenerateVideos,
        disabled: isGenerating || splitScenes.length === 0 || scenesNeedVideo2 === 0,
        className: "min-w-0",
        size: "lg",
        children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
          t("freedom.generating")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-2" }),
          t("director.generateVideosButton", { ready: scenesNeedVideo2, total: splitScenes.length })
        ] })
      }
    ) });
  }
  const scenesWithImages = splitScenes.filter((s) => s.imageDataUrl).length;
  const scenesNeedImage = splitScenes.filter((s) => !s.imageDataUrl).length;
  const scenesNeedVideo = splitScenes.filter((s) => (s.videoStatus === "idle" || s.videoStatus === "failed") && !!s.videoPrompt?.trim() && (!!s.imageDataUrl || !s.imagePrompt?.trim())).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid min-w-0 grid-cols-1 gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        onClick: onGenerateAllFlow,
        disabled: isGenerating || isMergedRunning || splitScenes.length === 0,
        className: "min-w-0",
        size: "lg",
        children: isGenerating || isMergedRunning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
          t("freedom.generating")
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 mr-2" }),
          t("director.generateAll")
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onGenerateAllImages,
          disabled: isGenerating || isMergedRunning || splitScenes.length === 0 || scenesNeedImage === 0,
          className: "min-w-0",
          size: "lg",
          children: isGenerating || isMergedRunning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
            t("freedom.generating")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { className: "h-4 w-4 mr-2" }),
            t("director.generateImagesButton", { ready: splitScenes.length - scenesNeedImage, total: splitScenes.length })
          ] })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.imageReadyCounts", { ready: splitScenes.length - scenesNeedImage, needImage: scenesNeedImage }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: onGenerateVideos,
          disabled: isGenerating || isMergedRunning || splitScenes.length === 0 || scenesNeedVideo === 0,
          className: "min-w-0",
          size: "lg",
          children: isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
            t("freedom.generating")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-2" }),
            t("director.generateVideosButton", { ready: scenesNeedVideo, total: splitScenes.length })
          ] })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.videoReadyCounts", { withImages: scenesWithImages, needVideo: scenesNeedVideo }) }) })
    ] }) })
  ] });
}
function SplitScenesControlPanel(props) {
  const {
    splitScenes,
    storyboardConfig,
    videoGenerationMode,
    frameMode,
    isRefToVideo,
    currentStyleId,
    isGenerating,
    isMergedRunning,
    isGeneratingPrompts,
    isFillingShotImages,
    selectedShotCount,
    syncableVoiceOverCount,
    unsyncableVoiceOverCount,
    batchProgress,
    completedGenerationSeconds,
    imageFolderInputRef,
    onFillShotImagesFromFolder,
    onRelinkReferences,
    onAutoGeneratePrompts,
    onBack,
    onVideoGenerationModeChange,
    onFrameModeChange,
    onStyleChange,
    onAspectRatioChange,
    onVoiceModeChange,
    onNarratorVoiceChange,
    onSyncVoiceOver,
    onUnsyncVoiceOver,
    onClearShotSelection,
    onStopAllGeneration,
    onGenerateAllFlow,
    onGenerateAllImages,
    onGenerateVideos,
    t
  } = props;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: imageFolderInputRef,
        type: "file",
        multiple: true,
        accept: DIRECTOR_IMAGE_EXTS.map((ext) => `.${ext}`).join(","),
        webkitdirectory: "",
        directory: "",
        className: "hidden",
        onChange: (event) => {
          onFillShotImagesFromFolder(event.target.files);
          event.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: t("director.editingHeader") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full", children: t("director.shotCount", { count: splitScenes.length }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => imageFolderInputRef.current?.click(),
              disabled: isGenerating || isMergedRunning || isFillingShotImages || splitScenes.length === 0,
              className: "h-7 px-2 text-xs",
              children: [
                isFillingShotImages ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-3 w-3 mr-1" }),
                isFillingShotImages ? t("director.fillImagesBusy") : t("director.fillImagesFromFolder")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: onRelinkReferences,
              disabled: isGenerating,
              className: "h-7 px-2 text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clapperboard, { className: "h-3 w-3 mr-1" }),
                "Liên kết tham chiếu"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: onAutoGeneratePrompts,
              disabled: isGeneratingPrompts || isGenerating,
              className: "hidden h-7 px-2 text-xs",
              children: [
                isGeneratingPrompts ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3 mr-1 text-yellow-500" }),
                t("director.autoFillPrompts")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "text",
              size: "sm",
              onClick: onBack,
              className: "hidden h-7 px-2 text-xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3 mr-1" }),
                t("director.regenerateStoryboard")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-lg border bg-muted/30 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("director.videoModeLabel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: videoGenerationMode,
                onValueChange: (value) => onVideoGenerationModeChange(value),
                disabled: isGenerating || isMergedRunning,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-full min-w-0 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "image-to-video", children: t("director.imageToVideoOption") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: "ref-to-video",
                        disabled: true,
                        className: "text-muted-foreground data-disabled:opacity-100",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex w-full items-center justify-between gap-3", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("director.refToVideoOption") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-amber-500/15 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400", children: t("director.betaLabel") })
                        ] })
                      }
                    )
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("director.frameInputLabel") }),
            isRefToVideo ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: "references", disabled: true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-full min-w-0 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "references", children: t("director.referenceImagesOption") }) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: frameMode === "both" ? "start-end" : "start",
                onValueChange: (value) => onFrameModeChange(value === "start-end" ? "both" : "first"),
                disabled: isGenerating || isMergedRunning,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-full min-w-0 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "start", children: t("director.startFrameOption") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "start-end", children: t("director.startEndFrameOption") })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: "Phong cách hình ảnh" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StylePicker,
            {
              value: currentStyleId || DEFAULT_STYLE_ID,
              onChange: onStyleChange,
              disabled: isGenerating
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: t("director.aspectRatio") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex rounded-lg border overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => onAspectRatioChange("16:9"),
                className: cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                  storyboardConfig.aspectRatio === "16:9" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-3.5 w-3.5" }),
                  t("director.aspectHorizontal")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => onAspectRatioChange("9:16"),
                className: cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-l",
                  storyboardConfig.aspectRatio === "9:16" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-3.5 w-3.5" }),
                  t("director.aspectVertical")
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ProjectVoiceControls,
          {
            voiceMode: storyboardConfig.voiceMode,
            narratorVoice: storyboardConfig.narratorVoice,
            onVoiceModeChange,
            onNarratorVoiceChange,
            disabled: isGenerating,
            compact: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "h-8 min-w-0 px-3 text-xs",
            disabled: isGenerating || syncableVoiceOverCount === 0,
            onClick: onSyncVoiceOver,
            title: selectedShotCount > 0 ? "Đồng bộ voiceOver vào prompt video của shot đang chọn" : "Đồng bộ voiceOver vào prompt video",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3.5 w-3.5 mr-1.5" }),
              "Đồng bộ voice"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            className: "h-8 min-w-0 px-3 text-xs",
            disabled: isGenerating || unsyncableVoiceOverCount === 0,
            onClick: onUnsyncVoiceOver,
            title: selectedShotCount > 0 ? "Gỡ Voice Over khỏi prompt video của shot đang chọn" : "Gỡ Voice Over khỏi prompt video",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "h-3.5 w-3.5 mr-1.5" }),
              "Tắt đồng bộ"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-wrap items-center gap-2", children: [
          !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              className: "h-8 min-w-0 px-4 text-xs font-medium",
              disabled: isGenerating || isMergedRunning || splitScenes.length === 0,
              onClick: onGenerateAllImages,
              children: isMergedRunning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 mr-1.5 animate-spin" }),
                t("director.mergedRunning")
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 mr-1.5" }),
                t("director.generateAllImages")
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              className: "h-8 min-w-0 px-3 text-xs",
              disabled: selectedShotCount === 0,
              onClick: onClearShotSelection,
              children: t("director.clearShotSelection")
            }
          ),
          (isMergedRunning || isGenerating) && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "destructive",
              className: "h-8 min-w-0 px-3 text-xs",
              onClick: onStopAllGeneration,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "h-3.5 w-3.5 mr-1" }),
                t("director.card.stop")
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BatchActions,
        {
          splitScenes,
          isRefToVideo,
          isGenerating,
          isMergedRunning,
          onGenerateAllFlow,
          onGenerateAllImages,
          onGenerateVideos,
          t
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BatchProgressBar, { progress: batchProgress }),
      completedGenerationSeconds !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground", children: [
        "Hoàn tất trong ",
        formatDuration(completedGenerationSeconds)
      ] }),
      splitScenes.some((s) => !s.videoPrompt?.trim()) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-yellow-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-yellow-600 dark:text-yellow-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t("director.missingPromptWarning") }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground bg-muted/50 rounded-lg p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "💡 ",
        t("director.bottomHint")
      ] }) })
    ] })
  ] });
}
const GOOGLE_FLOW_PHASE_SUFFIX = {
  checking_media: "kiểm tra ảnh đã lưu",
  uploading_media: "đang tải ảnh mới lên",
  media_ready: "đã dùng lại ảnh"
};
function ShotStatusPill({ scene, status }) {
  const { imageElapsedSeconds, videoElapsedSeconds, imagePhase, videoPhase } = status;
  if (scene.imageStatus === "generating") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-2xs text-blue-700 dark:text-blue-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
      "Đang tạo ảnh ",
      imageElapsedSeconds,
      "s"
    ] });
  }
  if (scene.imageStatus === "uploading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-2xs text-blue-700 dark:text-blue-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
      "Đang chuẩn bị ảnh",
      imagePhase && GOOGLE_FLOW_PHASE_SUFFIX[imagePhase] ? ` · ${GOOGLE_FLOW_PHASE_SUFFIX[imagePhase]}` : ""
    ] });
  }
  if (scene.videoStatus === "generating" || scene.videoStatus === "uploading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs text-emerald-700 dark:text-emerald-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3 w-3 animate-spin" }),
      "Đang tạo video ",
      videoElapsedSeconds,
      "s",
      videoPhase && GOOGLE_FLOW_PHASE_SUFFIX[videoPhase] ? ` · ${GOOGLE_FLOW_PHASE_SUFFIX[videoPhase]}` : ""
    ] });
  }
  if (scene.imageStatus === "queued" || scene.videoStatus === "queued") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground", children: "Đang chờ" });
  }
  if (scene.imageStatus === "failed" || scene.videoStatus === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-destructive/10 px-2 py-0.5 text-2xs text-destructive", children: "Lỗi" });
  }
  if (scene.videoStatus === "completed" && scene.videoUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs text-emerald-700 dark:text-emerald-300", children: "Đã có video" });
  }
  if (scene.imageDataUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-blue-500/10 px-2 py-0.5 text-2xs text-blue-700 dark:text-blue-300", children: "Đã có ảnh" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground", children: "Chưa tạo" });
}
function CompactShotCard({
  scene,
  nextScene,
  expanded,
  selected,
  frameMode,
  isRefToVideo,
  status,
  onToggle,
  t
}) {
  const hasImage = !!scene.imageDataUrl;
  const hasVideo = scene.videoStatus === "completed" && !!scene.videoUrl;
  const assetColor = hasImage && hasVideo ? "bg-emerald-500" : hasImage || hasVideo ? "bg-amber-500" : "bg-red-500";
  const sceneTitle = scene.sceneName || scene.sceneLocation;
  const shotDuration = formatDuration(normalizeVideoLength(scene.videoLength));
  const canLinkNextFrame = frameMode === "both" && !isRefToVideo && Boolean(nextScene?.imageDataUrl || nextScene?.imageHttpUrl) && !(scene.sourceEpisodeId && nextScene?.sourceEpisodeId && scene.sourceEpisodeId !== nextScene.sourceEpisodeId);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: () => onToggle(scene.id),
      className: cn(
        "w-full rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/20",
        expanded && "border-primary/40 bg-muted/20"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
        selected && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 shrink-0 rounded-full bg-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0 text-xs font-semibold text-muted-foreground", children: [
              "Shot ",
              scene.id + 1
            ] }),
            sceneTitle && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: sceneTitle })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-2xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("h-2.5 w-2.5 rounded-full", assetColor) }),
              "Asset"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary", children: shotDuration }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShotStatusPill, { scene, status }),
            frameMode === "both" && !isRefToVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium",
              canLinkNextFrame ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-muted text-muted-foreground"
            ), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-2.5 w-2.5" }),
              canLinkNextFrame ? t("director.endFrameUsesShot", { index: nextScene.id + 1 }) : t("director.noLinkedEndFrame")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90") })
      ] })
    }
  );
}
function PreparingShotsOverlay() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 z-10 flex flex-col gap-3 rounded-lg bg-background/90 p-3 backdrop-blur-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Đang mở Đạo diễn..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 h-3 w-24 rounded bg-muted" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video w-36 rounded bg-muted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-2/3 rounded bg-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-1/2 rounded bg-muted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-full rounded bg-muted/70" })
        ] })
      ] })
    ] }, index)) })
  ] });
}
const DEFAULT_STORYBOARD_CONFIG = {
  aspectRatio: "9:16",
  resolution: "2K",
  videoResolution: "480p",
  sceneCount: 5,
  storyPrompt: "",
  styleTokens: [],
  characterReferenceImages: [],
  characterDescriptions: [],
  voiceMode: "off"
};
function SplitScenes({ onBack }) {
  const { t } = useI18n();
  const [isGeneratingPrompts, setIsGeneratingPrompts] = reactExports.useState(false);
  const [isPreparingView, setIsPreparingView] = reactExports.useState(true);
  const [selectedShotIds, setSelectedShotIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [expandedShotIds, setExpandedShotIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [directorControlsRoot, setDirectorControlsRoot] = reactExports.useState(null);
  const [isFillingShotImages, setIsFillingShotImages] = reactExports.useState(false);
  const imageFolderInputRef = reactExports.useRef(null);
  const projectData = useActiveDirectorProject();
  const allCharacters = useCharacterLibraryStore((state) => state.characters);
  const allSceneRefs = useSceneStore((state) => state.scenes);
  const promptLanguage = "en";
  const splitScenes = projectData?.splitScenes || [];
  projectData?.storyboardStatus || "idle";
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardConfig = projectData?.storyboardConfig || DEFAULT_STORYBOARD_CONFIG;
  const videoGenerationMode = storyboardConfig.videoGenerationMode || "image-to-video";
  const frameMode = projectData?.editorPrefs?.frameMode || "first";
  const isRefToVideo = videoGenerationMode === "ref-to-video";
  reactExports.useEffect(() => {
    let frameId = 0;
    let cancelled = false;
    const findControlsRoot = () => {
      if (cancelled) return;
      const root = document.getElementById("director-right-panel-controls");
      setDirectorControlsRoot(root);
      if (!root) {
        frameId = window.requestAnimationFrame(findControlsRoot);
      }
    };
    findControlsRoot();
    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);
  reactExports.useEffect(() => {
    let firstFrameId = 0;
    let secondFrameId = 0;
    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => setIsPreparingView(false));
    });
    return () => {
      if (firstFrameId) window.cancelAnimationFrame(firstFrameId);
      if (secondFrameId) window.cancelAnimationFrame(secondFrameId);
    };
  }, []);
  const {
    activeProjectId,
    setStoryboardConfig,
    // Three-tier prompt methods
    updateSplitSceneImagePrompt,
    updateSplitSceneVideoPrompt,
    // Other scene update methods
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneVideo,
    updateSplitSceneCharacters,
    updateSplitSceneCharacterVariationMap,
    // Scene-library association update methods
    updateSplitSceneReference,
    // Generic field update method (used for double-click editing)
    updateSplitSceneField,
    syncVoiceOverToVideoPrompts,
    unsyncVoiceOverFromVideoPrompts,
    deleteSplitScene,
    addBlankSplitScene,
    setEditorPrefs,
    resetStoryboard
  } = useDirectorStore();
  const mediaProjectId = activeProjectId || void 0;
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const getImageFolderId = reactExports.useCallback(() => getOrCreateCategoryFolder("ai-image"), [getOrCreateCategoryFolder]);
  const getVideoFolderId = reactExports.useCallback(() => getOrCreateCategoryFolder("ai-video"), [getOrCreateCategoryFolder]);
  const autoSaveVideoToLibrary = reactExports.useCallback((sceneId, videoUrl, thumbnailUrl, duration) => {
    const folderId = getVideoFolderId();
    const mediaId = addMediaFromUrl({
      url: videoUrl,
      name: `Shot ${sceneId + 1} - AI Video`,
      type: "video",
      source: "ai-video",
      thumbnailUrl,
      duration: duration || 5,
      folderId,
      projectId: mediaProjectId
    });
    console.log("[SplitScenes] Auto-saved video to AI video folder:", mediaId);
    return mediaId;
  }, [addMediaFromUrl, getVideoFolderId, mediaProjectId]);
  const autoSaveImageToLibrary = reactExports.useCallback((sceneId, imageUrl) => {
    const folderId = getImageFolderId();
    const mediaId = addMediaFromUrl({
      url: imageUrl,
      name: `Shot ${sceneId + 1} - AI Image`,
      type: "image",
      source: "ai-image",
      folderId,
      projectId: mediaProjectId
    });
    console.log("[SplitScenes] Auto-saved image to AI image folder:", mediaId);
    return mediaId;
  }, [addMediaFromUrl, getImageFolderId, mediaProjectId]);
  const currentStyleId = reactExports.useMemo(() => {
    if (storyboardConfig.visualStyleId) {
      return storyboardConfig.visualStyleId;
    }
    if (storyboardConfig.styleTokens && storyboardConfig.styleTokens.length > 0) {
      const joinedTokens = storyboardConfig.styleTokens.join(", ");
      const found = VISUAL_STYLE_PRESETS.find((s) => s.prompt.startsWith(joinedTokens));
      return found?.id || null;
    }
    return null;
  }, [storyboardConfig.visualStyleId, storyboardConfig.styleTokens]);
  const timers = useShotGenerationTimers();
  const references = useShotReferences(splitScenes);
  const runtime = useGenerationRuntime({
    splitScenes,
    updateSplitSceneImageStatus,
    updateSplitSceneVideo,
    timers,
    t
  });
  const { isGenerating, isMergedRunning } = runtime;
  const completedGenerationSeconds = useGenerationElapsed(isMergedRunning || isGenerating);
  const { handleGenerateSingleImage, handleGenerateAllImages } = useImageGeneration({
    splitScenes,
    storyboardConfig,
    currentStyleId,
    updateSplitSceneImage,
    updateSplitSceneImageStatus,
    updateSplitSceneField,
    autoSaveImageToLibrary,
    references,
    timers,
    runtime,
    t
  });
  const { handleGenerateSingleVideo, generateVideosForScenes, handleGenerateVideos } = useVideoGeneration({
    splitScenes,
    storyboardConfig,
    frameMode,
    isRefToVideo,
    allCharacters,
    updateSplitSceneVideo,
    updateSplitSceneField,
    autoSaveVideoToLibrary,
    references,
    timers,
    runtime,
    t
  });
  const handleGenerateAllFlow = reactExports.useCallback(async () => {
    const imagesNeeded = splitScenes.some((scene) => !!scene.imagePrompt?.trim() && !scene.imageDataUrl);
    if (splitScenes.length === 0) {
      toast.error(t("director.noShotsToGenerate"));
      return;
    }
    if (imagesNeeded) {
      await handleGenerateAllImages();
    }
    const state = useDirectorStore.getState();
    const currentProjectId = state.activeProjectId;
    const refreshedScenes = currentProjectId ? state.projects[currentProjectId]?.splitScenes || [] : [];
    const scenesReadyForVideo = refreshedScenes.filter(
      (scene) => !!scene.videoPrompt?.trim() && (isRefToVideo || !!scene.imageDataUrl || !scene.imagePrompt?.trim()) && (scene.videoStatus === "idle" || scene.videoStatus === "failed")
    );
    if (scenesReadyForVideo.length === 0) {
      toast.warning(t("director.allImagesRequiredBeforeVideo"));
      return;
    }
    await generateVideosForScenes(scenesReadyForVideo);
  }, [splitScenes, handleGenerateAllImages, generateVideosForScenes, isRefToVideo, t]);
  const syncableVoiceOverCount = reactExports.useMemo(() => splitScenes.filter((scene) => {
    if (selectedShotIds.size > 0 && !selectedShotIds.has(scene.id)) return false;
    return Boolean(scene.voiceOver?.trim());
  }).length, [splitScenes, selectedShotIds]);
  const unsyncableVoiceOverCount = reactExports.useMemo(() => splitScenes.filter((scene) => {
    if (selectedShotIds.size > 0 && !selectedShotIds.has(scene.id)) return false;
    return Boolean(scene.voiceOverSynced || splitVideoPromptVoiceOver(scene.videoPrompt).voiceOver);
  }).length, [splitScenes, selectedShotIds]);
  const handleSyncVoiceOverToPrompts = reactExports.useCallback(() => {
    const sceneIds = selectedShotIds.size > 0 ? Array.from(selectedShotIds) : void 0;
    const synced = syncVoiceOverToVideoPrompts(sceneIds);
    if (synced === 0) {
      toast.info(selectedShotIds.size > 0 ? "Các shot đang chọn không có voiceOver để đồng bộ." : "Không có voiceOver nào để đồng bộ.");
      return;
    }
    toast.success(selectedShotIds.size > 0 ? `Đã đồng bộ voiceOver vào ${synced} prompt video đã chọn.` : `Đã đồng bộ voiceOver vào ${synced} prompt video.`);
  }, [selectedShotIds, syncVoiceOverToVideoPrompts]);
  const handleUnsyncVoiceOverFromPrompts = reactExports.useCallback(() => {
    const sceneIds = selectedShotIds.size > 0 ? Array.from(selectedShotIds) : void 0;
    const unsynced = unsyncVoiceOverFromVideoPrompts(sceneIds);
    if (unsynced === 0) {
      toast.info(selectedShotIds.size > 0 ? "Các shot đang chọn không có Voice Over trong prompt video." : "Không có Voice Over nào trong prompt video để gỡ.");
      return;
    }
    toast.success(selectedShotIds.size > 0 ? `Đã gỡ Voice Over khỏi ${unsynced} prompt video đã chọn.` : `Đã gỡ Voice Over khỏi ${unsynced} prompt video.`);
  }, [selectedShotIds, unsyncVoiceOverFromVideoPrompts]);
  const relinkReferencesFromPrompts = reactExports.useCallback(() => {
    let characterHits = 0;
    let sceneHits = 0;
    for (const scene of splitScenes) {
      const promptText = `${scene.imagePrompt || ""}
${scene.videoPrompt || ""}`;
      const promptNames = Array.from(promptText.matchAll(/@\[([^\]]+)\]|@(?!scene\[)([\p{L}\p{N}_-]+)/giu)).map((match) => (match[1] || match[2] || "").trim().replace(/[,.!?;:，。！？；：]+$/, "")).filter(Boolean);
      const names = Array.from(/* @__PURE__ */ new Set([...scene.characterNames || [], ...promptNames]));
      const characterIds = names.map((name) => {
        const normalizedName = normalizeReferenceName(name);
        return allCharacters.find((character) => normalizeReferenceName(character.name) === normalizedName)?.id;
      }).filter((id) => !!id);
      if (characterIds.length > 0) {
        updateSplitSceneCharacters(scene.id, characterIds);
        characterHits += characterIds.length;
      }
      const sceneMarker = Array.from(promptText.matchAll(/@scene\[([^\]]+)\]/giu)).map((match) => match[1].trim()).find(Boolean);
      const sceneName = (sceneMarker || scene.sceneName || scene.sceneLocation || "").trim().toLowerCase();
      if (sceneName) {
        const normalizedSceneName = normalizeReferenceName(sceneName);
        const sceneRef = allSceneRefs.find((item) => normalizeReferenceName(item.name) === normalizedSceneName);
        if (sceneRef) {
          updateSplitSceneReference(scene.id, sceneRef.id, sceneRef.referenceImage || sceneRef.referenceImageBase64);
          sceneHits += 1;
        }
      }
    }
    toast.success(`Đã liên kết ${characterHits} nhân vật và ${sceneHits} cảnh.`);
  }, [splitScenes, allCharacters, allSceneRefs, updateSplitSceneCharacters, updateSplitSceneReference]);
  const handleUpdateImagePrompt = reactExports.useCallback((id, prompt) => {
    updateSplitSceneImagePrompt(id, prompt);
  }, [updateSplitSceneImagePrompt]);
  const handleUpdateVideoPrompt = reactExports.useCallback((id, prompt) => {
    updateSplitSceneVideoPrompt(id, prompt);
  }, [updateSplitSceneVideoPrompt]);
  const handleUpdateSceneReferenceFromCard = reactExports.useCallback((id, sceneLibId, refImage) => {
    updateSplitSceneReference(id, sceneLibId, refImage);
  }, [updateSplitSceneReference]);
  const handleUpdateSceneField = reactExports.useCallback((id, field, value) => {
    updateSplitSceneField(id, field, value);
  }, [updateSplitSceneField]);
  const handleStyleChange = reactExports.useCallback((styleId) => {
    const style = getStyleById(styleId);
    if (style && setProjectVisualStyleId(styleId)) {
      toast.success(t("director.styleSwitched", { name: style.name }));
    }
  }, [t]);
  const handleAspectRatioChange = reactExports.useCallback((ratio) => {
    setStoryboardConfig({ aspectRatio: ratio });
    toast.success(t("director.aspectSwitched", { mode: ratio === "16:9" ? t("director.aspectHorizontal") : t("director.aspectVertical") }));
  }, [setStoryboardConfig, t]);
  const handleVideoGenerationModeChange = reactExports.useCallback((mode) => {
    setStoryboardConfig({ videoGenerationMode: mode });
    if (activeProjectId) {
      useScriptStore.getState().setVideoGenerationMode(activeProjectId, mode);
    }
  }, [activeProjectId, setStoryboardConfig]);
  const handleUpdateCharacters = reactExports.useCallback((sceneId, characterIds) => {
    updateSplitSceneCharacters(sceneId, characterIds);
    const currentScene = splitScenes.find((s) => s.id === sceneId);
    const currentMap = currentScene?.characterVariationMap;
    if (!currentMap) return;
    const selectedSet = new Set(characterIds);
    const prunedMap = {};
    Object.entries(currentMap).forEach(([charId, variationId]) => {
      if (selectedSet.has(charId) && variationId) {
        prunedMap[charId] = variationId;
      }
    });
    const hasChanged = Object.keys(prunedMap).length !== Object.keys(currentMap).length || Object.entries(prunedMap).some(([charId, variationId]) => currentMap[charId] !== variationId);
    if (hasChanged) {
      updateSplitSceneCharacterVariationMap(sceneId, prunedMap);
    }
  }, [splitScenes, updateSplitSceneCharacters, updateSplitSceneCharacterVariationMap]);
  const handleUpdateCharacterVariationMap = reactExports.useCallback((sceneId, characterVariationMap) => {
    updateSplitSceneCharacterVariationMap(sceneId, characterVariationMap);
  }, [updateSplitSceneCharacterVariationMap]);
  const handleDeleteScene = reactExports.useCallback((sceneId) => {
    deleteSplitScene(sceneId);
    toast.success(t("director.sceneDeleted", { index: sceneId + 1 }));
  }, [deleteSplitScene, t]);
  const handleRemoveImage = reactExports.useCallback((sceneId) => {
    updateSplitSceneImage(sceneId, "", void 0, void 0, void 0);
    updateSplitSceneField(sceneId, "imageSource", void 0);
    updateSplitSceneField(sceneId, "imageProviderState", void 0);
    updateSplitSceneImageStatus(sceneId, {
      imageStatus: "idle",
      imageProgress: 0,
      imageError: null
    });
  }, [updateSplitSceneField, updateSplitSceneImage, updateSplitSceneImageStatus]);
  const handleUploadImage = reactExports.useCallback(async (sceneId, imageDataUrl) => {
    const localPath = await saveImageToLocal(
      imageDataUrl,
      "shots",
      `scene_${sceneId}_first_${Date.now()}.png`
    );
    updateSplitSceneImage(sceneId, localPath, void 0, void 0, void 0);
    updateSplitSceneField(sceneId, "imageSource", "upload");
    updateSplitSceneField(sceneId, "imageProviderState", void 0);
  }, [updateSplitSceneField, updateSplitSceneImage]);
  const handleFillShotImagesFromFolder = reactExports.useCallback(async (files) => {
    if (!files || files.length === 0 || isFillingShotImages) return;
    const imageFiles = Array.from(files).filter(isSupportedDirectorImageFile).sort((a, b) => directorImageSortCollator.compare(getDirectorImageSortKey(a), getDirectorImageSortKey(b)));
    if (imageFiles.length === 0) {
      toast.error(t("director.fillImagesNoImages"));
      return;
    }
    const targetScenes = splitScenes.filter((scene) => !scene.imageDataUrl);
    if (targetScenes.length === 0) {
      toast.info(t("director.fillImagesNoMissingShots"));
      return;
    }
    const fillCount = Math.min(imageFiles.length, targetScenes.length);
    let filled = 0;
    let failed = 0;
    setIsFillingShotImages(true);
    try {
      let nextIndex = 0;
      const fillNext = async () => {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= fillCount) return;
        const file = imageFiles[index];
        const scene = targetScenes[index];
        updateSplitSceneImageStatus(scene.id, {
          imageStatus: "uploading",
          imageProgress: 0,
          imageError: null
        });
        try {
          const source = await getPersistableImageSource(file);
          const extension = getDirectorImageExtension(file) || "png";
          const localPath = await saveImageToLocal(
            source,
            "shots",
            `scene_${scene.id}_first_${Date.now()}.${extension}`
          );
          updateSplitSceneImage(scene.id, localPath, scene.width, scene.height, void 0);
          updateSplitSceneField(scene.id, "imageSource", "upload");
          updateSplitSceneField(scene.id, "imageProviderState", void 0);
          filled += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : String(error || "Unknown error");
          updateSplitSceneImageStatus(scene.id, {
            imageStatus: "failed",
            imageProgress: 0,
            imageError: message
          });
        }
        await fillNext();
      };
      await Promise.all(
        Array.from(
          { length: Math.min(Math.max(1, useVideoStudioSettingsStore.getState().maxStudioLanes.imageLanesPerJwt || 1), fillCount) },
          () => fillNext()
        )
      );
      if (filled > 0) {
        toast.success(t("director.fillImagesDone", { count: filled }));
      }
      if (failed > 0) {
        toast.error(t("director.fillImagesFailed", { count: failed }));
      }
      if (imageFiles.length > targetScenes.length) {
        toast.info(t("director.fillImagesExtra", { count: imageFiles.length - targetScenes.length }));
      }
      const remaining = Math.max(0, targetScenes.length - filled);
      if (remaining > 0) {
        toast.info(t("director.fillImagesRemaining", { count: remaining }));
      }
    } finally {
      setIsFillingShotImages(false);
    }
  }, [
    isFillingShotImages,
    splitScenes,
    t,
    updateSplitSceneField,
    updateSplitSceneImage,
    updateSplitSceneImageStatus
  ]);
  const handleBack = reactExports.useCallback(() => {
    resetStoryboard();
    onBack?.();
  }, [resetStoryboard, onBack]);
  const handleShotSelectedChange = reactExports.useCallback((sceneId, checked) => {
    setSelectedShotIds((prev) => toggleShotSelection(prev, sceneId, checked));
  }, []);
  const toggleShotExpanded = reactExports.useCallback((sceneId) => {
    setExpandedShotIds((current) => {
      const next = new Set(current);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);
  const handleAutoGeneratePrompts = reactExports.useCallback(async () => {
    if (!storyboardImage || splitScenes.length === 0) {
      toast.error(t("director.cannotGeneratePrompts"));
      return;
    }
    const featureConfig = getFeatureConfig("image_understanding");
    const apiKey = featureConfig?.apiKey || "";
    const provider = featureConfig?.platform || "";
    const model = featureConfig?.models?.[0] || "";
    const baseUrl = featureConfig?.baseUrl?.replace(/\/+$/, "") || "";
    setIsGeneratingPrompts(true);
    toast.info(t("director.generatingPrompts"));
    try {
      const storyPrompt = storyboardConfig.storyPrompt || t("director.videoStoryboardFallback");
      const prompts = await generateScenePrompts({
        storyboardImage,
        storyPrompt,
        scenes: splitScenes.map((s) => ({
          id: s.id,
          row: s.row,
          col: s.col,
          dialogue: s.dialogue,
          // Additional fields for text-based generation
          sceneName: s.sceneName,
          sceneDescription: s.sceneLocation
        })),
        apiKey,
        provider,
        baseUrl,
        model
      });
      let updatedCount = 0;
      prompts.forEach((p) => {
        if (p.videoPrompt || p.imagePrompt) {
          updateSplitSceneImagePrompt(p.id, p.imagePrompt);
          updateSplitSceneVideoPrompt(p.id, p.videoPrompt);
          updatedCount++;
        }
      });
      toast.success(t("director.generatedPrompts", { count: updatedCount }));
    } catch (error) {
      const err = error;
      console.error("[SplitScenes] Prompt generation failed:", err);
      toast.error(t("scriptView.scriptGenerationFailed", { message: err.message }));
    } finally {
      setIsGeneratingPrompts(false);
    }
  }, [storyboardImage, splitScenes, storyboardConfig, t, updateSplitSceneImagePrompt, updateSplitSceneVideoPrompt]);
  const handleSaveToLibrary = reactExports.useCallback(async (scene, type) => {
    try {
      if (type === "video") {
        if (!scene.videoUrl) {
          toast.error(t("director.noVideoToSave"));
          return;
        }
        const folderId = getVideoFolderId();
        addMediaFromUrl({
          url: scene.videoUrl,
          name: `Shot ${scene.id + 1} - AI Video`,
          type: "video",
          source: "ai-video",
          thumbnailUrl: scene.imageDataUrl,
          duration: 5,
          folderId,
          projectId: mediaProjectId
        });
        toast.success(t("director.videoSaved", { index: scene.id + 1 }));
      } else {
        if (!scene.imageDataUrl) {
          toast.error(t("director.noImageToSave"));
          return;
        }
        const folderId = getImageFolderId();
        addMediaFromUrl({
          url: scene.imageDataUrl,
          name: `Shot ${scene.id + 1} - AI Image`,
          type: "image",
          source: "ai-image",
          folderId,
          projectId: mediaProjectId
        });
        toast.success(t("director.imageSaved", { index: scene.id + 1 }));
      }
    } catch (error) {
      const err = error;
      toast.error(t("director.saveFailed", { message: err.message }));
    }
  }, [addMediaFromUrl, getImageFolderId, getVideoFolderId, mediaProjectId, t]);
  if (splitScenes.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { className: "h-8 w-8 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("director.noSplitScenes") })
    ] });
  }
  const controlPanel = /* @__PURE__ */ jsxRuntimeExports.jsx(
    SplitScenesControlPanel,
    {
      splitScenes,
      storyboardConfig,
      videoGenerationMode,
      frameMode,
      isRefToVideo,
      currentStyleId,
      isGenerating,
      isMergedRunning,
      isGeneratingPrompts,
      isFillingShotImages,
      selectedShotCount: selectedShotIds.size,
      syncableVoiceOverCount,
      unsyncableVoiceOverCount,
      batchProgress: timers.batchProgress,
      completedGenerationSeconds,
      imageFolderInputRef,
      onFillShotImagesFromFolder: handleFillShotImagesFromFolder,
      onRelinkReferences: relinkReferencesFromPrompts,
      onAutoGeneratePrompts: handleAutoGeneratePrompts,
      onBack: handleBack,
      onVideoGenerationModeChange: handleVideoGenerationModeChange,
      onFrameModeChange: (mode) => setEditorPrefs({ frameMode: mode }),
      onStyleChange: handleStyleChange,
      onAspectRatioChange: handleAspectRatioChange,
      onVoiceModeChange: (voiceMode) => setStoryboardConfig({ voiceMode }),
      onNarratorVoiceChange: (narratorVoice) => setStoryboardConfig({ narratorVoice }),
      onSyncVoiceOver: handleSyncVoiceOverToPrompts,
      onUnsyncVoiceOver: handleUnsyncVoiceOverFromPrompts,
      onClearShotSelection: () => setSelectedShotIds(/* @__PURE__ */ new Set()),
      onStopAllGeneration: runtime.handleStopAllGeneration,
      onGenerateAllFlow: handleGenerateAllFlow,
      onGenerateAllImages: handleGenerateAllImages,
      onGenerateVideos: handleGenerateVideos,
      t
    }
  );
  const resolveShotLiveStatus = (scene) => ({
    imageElapsedSeconds: timers.runningImageStartedAtBySceneId[scene.id] ? Math.max(0, Math.floor((timers.compactNow - timers.runningImageStartedAtBySceneId[scene.id]) / 1e3)) : 0,
    videoElapsedSeconds: timers.runningVideoStartedAtBySceneId[scene.id] ? Math.max(0, Math.floor((timers.compactNow - timers.runningVideoStartedAtBySceneId[scene.id]) / 1e3)) : 0,
    imagePhase: runtime.googleFlowTasks[runtime.googleFlowTaskIdBySceneId[scene.id]]?.phase,
    videoPhase: runtime.googleFlowTasks[runtime.googleFlowVideoTaskIdBySceneId[scene.id]]?.phase
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
    directorControlsRoot ? reactDomExports.createPortal(controlPanel, directorControlsRoot) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative order-2 min-w-0 space-y-3", children: [
      isPreparingView && /* @__PURE__ */ jsxRuntimeExports.jsx(PreparingShotsOverlay, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
        splitScenes.map((scene, sceneIndex) => {
          const expanded = expandedShotIds.has(scene.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CompactShotCard,
              {
                scene,
                nextScene: splitScenes[sceneIndex + 1],
                expanded,
                selected: selectedShotIds.has(scene.id),
                frameMode,
                isRefToVideo,
                status: resolveShotLiveStatus(scene),
                onToggle: toggleShotExpanded,
                t
              }
            ),
            expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(
              SplitSceneCard,
              {
                scene,
                resolvedVoice: resolveSceneAudioVoice(scene, allCharacters, storyboardConfig),
                allVoices: resolveAllSceneVoices(scene, allCharacters, storyboardConfig),
                voiceMode: storyboardConfig.voiceMode,
                imageStylePrompt: currentStyleId ? getStylePrompt(currentStyleId) : "",
                promptLanguage,
                onUpdateImagePrompt: handleUpdateImagePrompt,
                onUpdateVideoPrompt: handleUpdateVideoPrompt,
                onUpdateCharacters: handleUpdateCharacters,
                onUpdateCharacterVariationMap: handleUpdateCharacterVariationMap,
                onUpdateSceneReference: handleUpdateSceneReferenceFromCard,
                onDelete: handleDeleteScene,
                onSaveToLibrary: handleSaveToLibrary,
                onGenerateImage: handleGenerateSingleImage,
                onGenerateVideo: handleGenerateSingleVideo,
                onRemoveImage: handleRemoveImage,
                onUploadImage: handleUploadImage,
                onUpdateField: handleUpdateSceneField,
                onStopImageGeneration: runtime.handleStopImageGeneration,
                onStopVideoGeneration: runtime.handleStopVideoGeneration,
                imageStartedAt: timers.runningImageStartedAtBySceneId[scene.id],
                videoStartedAt: timers.runningVideoStartedAtBySceneId[scene.id],
                isGeneratingAny: isMergedRunning,
                videoGenerationMode,
                selectable: true,
                selected: selectedShotIds.has(scene.id),
                onSelectedChange: (checked) => handleShotSelectedChange(scene.id, checked),
                allScenes: splitScenes
              }
            )
          ] }, scene.id);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: addBlankSplitScene,
            disabled: isGenerating,
            className: cn(
              "w-full rounded-lg border-2 border-dashed border-muted-foreground/25",
              "flex items-center justify-center gap-2 py-6",
              "text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5",
              "transition-colors cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("director.addBlankShot") })
            ]
          }
        )
      ] })
    ] })
  ] });
}
function buildStoryboardPrompt(config) {
  const { story, aspectRatio, resolution, sceneCount, styleTokens, characters } = config;
  const grid = calculateGrid({ sceneCount, aspectRatio, resolution });
  const { cols, rows, totalCells, emptyCells } = grid;
  const promptParts = [];
  promptParts.push("<instruction>");
  promptParts.push(`Generate a clean ${rows}x${cols} storyboard grid with exactly ${totalCells} equal-sized panels.`);
  promptParts.push(`Overall Image Aspect Ratio: ${aspectRatio}.`);
  const panelAspect = aspectRatio === "16:9" ? "16:9 (horizontal landscape)" : "9:16 (vertical portrait)";
  promptParts.push(`Each individual panel must have a ${panelAspect} aspect ratio.`);
  promptParts.push("Structure: No borders between panels, no text, no watermarks, no speech bubbles.");
  promptParts.push("Consistency: Maintain consistent character appearance, lighting, and color grading across all panels.");
  promptParts.push("</instruction>");
  promptParts.push(`Layout: ${rows} rows, ${cols} columns, reading order left-to-right, top-to-bottom.`);
  promptParts.push("<story_content>");
  promptParts.push(story);
  promptParts.push("</story_content>");
  if (characters && characters.length > 0) {
    promptParts.push("<characters>");
    characters.forEach((c) => {
      promptParts.push(`${c.name}: ${c.characterPrompt || "design based on name"}`);
    });
    promptParts.push("</characters>");
  }
  for (let idx = 0; idx < sceneCount; idx++) {
    const row = Math.floor(idx / cols) + 1;
    const col = idx % cols + 1;
    promptParts.push(`Panel [row ${row}, col ${col}]: Scene ${idx + 1} from story`);
  }
  if (emptyCells > 0) {
    for (let i = sceneCount; i < totalCells; i++) {
      const row = Math.floor(i / cols) + 1;
      const col = i % cols + 1;
      promptParts.push(`Panel [row ${row}, col ${col}]: empty placeholder, solid gray background`);
    }
  }
  if (styleTokens.length > 0) {
    promptParts.push(`Style: ${styleTokens.join(", ")}`);
  }
  promptParts.push("Negative constraints: text, watermark, split screen borders, speech bubbles, blur, distortion, bad anatomy.");
  return promptParts.join("\n");
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const RATE_LIMITS = {
  /** Delay between batch items (e.g., character/scene generation) */
  BATCH_ITEM_DELAY: 3e3
};
const buildEndpoint = (baseUrl, path) => {
  const normalized = baseUrl.replace(/\/+$/, "");
  return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
};
async function pollTaskCompletion(taskId, apiKey, baseUrl, onProgress, type = "image") {
  const maxAttempts = 120;
  const pollInterval = 2e3;
  if (taskId.startsWith("mock_") || taskId.startsWith("sync_")) {
    return "";
  }
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const progress = Math.min(Math.floor(attempt / maxAttempts * 100), 99);
    onProgress?.(progress);
    try {
      const url = new URL(buildEndpoint(baseUrl, `tasks/${taskId}`));
      url.searchParams.set("_ts", Date.now().toString());
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Task not found");
        }
        throw new Error(`Failed to check task status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[StoryboardService] Task ${taskId} status:`, data);
      const status = (data.status ?? data.data?.status ?? "unknown").toString().toLowerCase();
      const statusMap = {
        "pending": "pending",
        "submitted": "pending",
        "queued": "pending",
        "processing": "processing",
        "running": "processing",
        "in_progress": "processing",
        "completed": "completed",
        "succeeded": "completed",
        "success": "completed",
        "failed": "failed",
        "error": "failed"
      };
      const mappedStatus = statusMap[status] || "processing";
      if (mappedStatus === "completed") {
        onProgress?.(100);
        let resultUrl;
        if (type === "image") {
          const images = data.result?.images ?? data.data?.result?.images;
          if (images?.[0]) {
            const urlField = images[0].url;
            resultUrl = Array.isArray(urlField) ? urlField[0] : urlField;
          }
        } else {
          const videos = data.result?.videos ?? data.data?.result?.videos;
          if (videos?.[0]) {
            const urlField = videos[0].url;
            resultUrl = Array.isArray(urlField) ? urlField[0] : urlField;
          }
        }
        resultUrl = resultUrl || data.output_url || data.result_url || data.url;
        if (!resultUrl) {
          throw new Error("Task completed but no URL in result");
        }
        return resultUrl;
      }
      if (mappedStatus === "failed") {
        const rawError = data.error || data.error_message || data.data?.error;
        const errorMsg = rawError ? typeof rawError === "string" ? rawError : JSON.stringify(rawError) : "Task failed";
        throw new Error(errorMsg);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      if (error instanceof Error && (error.message.includes("Task failed") || error.message.includes("Task completed") || error.message.includes("Task not found") || error.message.includes("no URL"))) {
        throw error;
      }
      console.error(`[StoryboardService] Poll attempt ${attempt} failed:`, error);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
  throw new Error(`Task ${taskId} timed out after ${maxAttempts * pollInterval / 1e3}s`);
}
async function generateStoryboardImage(config, onProgress) {
  const {
    storyPrompt,
    sceneCount,
    aspectRatio,
    resolution,
    styleTokens = [],
    characterDescriptions = [],
    apiKey,
    mockMode = false
  } = config;
  const gridConfig = calculateGrid({
    sceneCount,
    aspectRatio,
    resolution
  });
  const characters = characterDescriptions.map((desc, i) => ({
    name: `Character ${i + 1}`,
    characterPrompt: desc
  }));
  const promptConfig = {
    story: storyPrompt,
    sceneCount,
    aspectRatio,
    resolution,
    styleTokens,
    characters: characters.length > 0 ? characters : void 0
  };
  const prompt = buildStoryboardPrompt(promptConfig);
  console.log("[StoryboardService] Generated prompt:", prompt.substring(0, 200));
  console.log("[StoryboardService] Grid config:", gridConfig);
  const outputSize = RESOLUTION_PRESETS[resolution][aspectRatio];
  if (mockMode) {
    onProgress?.(100);
    const placeholderUrl = `https://placehold.co/${outputSize.width}x${outputSize.height}/333/fff?text=Storyboard+Mock+(${gridConfig.cols}x${gridConfig.rows})`;
    return {
      imageUrl: placeholderUrl,
      gridConfig: {
        cols: gridConfig.cols,
        rows: gridConfig.rows,
        cellWidth: gridConfig.cellWidth,
        cellHeight: gridConfig.cellHeight
      }
    };
  }
  if (!apiKey) {
    throw new Error("Configure an API key in Settings first");
  }
  onProgress?.(10);
  let result;
  const baseUrl = config.baseUrl?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("Configure the image-generation service mapping in Settings first");
  }
  const model = config.model;
  if (!model) {
    throw new Error("Configure the image-generation model in Settings first");
  }
  const apiResult = await submitGridImageRequest({
    model,
    prompt,
    aspectRatio,
    referenceImages: config.characterReferenceImages
  });
  if (apiResult.imageUrl) {
    result = { imageUrl: apiResult.imageUrl, estimatedTime: 0 };
  } else if (apiResult.taskId) {
    result = { taskId: apiResult.taskId, estimatedTime: 30 };
  } else {
    throw new Error("Invalid API response: no image URL or task ID");
  }
  onProgress?.(30);
  if (result.imageUrl) {
    onProgress?.(100);
    return {
      imageUrl: result.imageUrl,
      gridConfig: {
        cols: gridConfig.cols,
        rows: gridConfig.rows,
        cellWidth: gridConfig.cellWidth,
        cellHeight: gridConfig.cellHeight
      }
    };
  }
  if (result.taskId) {
    const imageUrl = await pollTaskCompletion(
      result.taskId,
      apiKey,
      baseUrl,
      (progress) => {
        onProgress?.(30 + Math.floor(progress * 0.7));
      },
      "image"
    );
    return {
      imageUrl,
      gridConfig: {
        cols: gridConfig.cols,
        rows: gridConfig.rows,
        cellWidth: gridConfig.cellWidth,
        cellHeight: gridConfig.cellHeight
      }
    };
  }
  throw new Error("Invalid API response: no taskId or imageUrl");
}
async function submitVideoGenTask(imageInput, prompt, aspectRatio, apiKey, referenceImages, model, baseUrl, videoResolution) {
  if (!model) {
    throw new Error("Configure the video-generation model in Settings first");
  }
  if (!baseUrl) {
    throw new Error("Configure the video-generation service mapping in Settings first");
  }
  const actualModel = model;
  const actualBaseUrl = baseUrl.replace(/\/+$/, "");
  const roles = [];
  roles.push({ url: imageInput, role: "first_frame" });
  if (referenceImages && referenceImages.length > 0) {
    const maxRefs = Math.min(referenceImages.length, 4);
    for (let i = 0; i < maxRefs; i++) {
      roles.push({ url: referenceImages[i], role: "reference_image" });
    }
  }
  const requestBody = {
    model: actualModel,
    prompt,
    duration: 5,
    aspect_ratio: aspectRatio,
    resolution: videoResolution || "480p",
    audio: true,
    camerafixed: false,
    image_with_roles: roles
  };
  console.log("[StoryboardService] Submitting video to:", actualBaseUrl, {
    model: requestBody.model,
    aspectRatio: requestBody.aspect_ratio,
    promptPreview: prompt.substring(0, 100),
    imageRolesCount: roles.length
  });
  const data = await retryOperation(async () => {
    const endpoint = buildEndpoint(actualBaseUrl, "videos/generations");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[StoryboardService] Video API error:", response.status, errorText);
      let errorMessage = `Video API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorJson.msg || errorMessage;
      } catch {
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("API key is invalid or expired. Check your configuration.");
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }, {
    maxRetries: 3,
    baseDelay: 5e3,
    retryOn429: true
  });
  console.log("[StoryboardService] Video API response:", data);
  let taskId;
  const dataField = data.data;
  if (Array.isArray(dataField) && dataField.length > 0) {
    taskId = dataField[0].task_id?.toString() || dataField[0].id?.toString();
  } else if (dataField && typeof dataField === "object") {
    taskId = dataField.task_id?.toString() || dataField.id?.toString();
  } else {
    taskId = data.task_id?.toString() || data.id?.toString();
  }
  if (!taskId) {
    throw new Error("API returned empty task ID");
  }
  return {
    taskId,
    estimatedTime: data.estimated_time || 120
  };
}
async function pollVideoTaskCompletion(taskId, apiKey, baseUrl, onProgress) {
  return pollTaskCompletion(taskId, apiKey, baseUrl, onProgress, "video");
}
async function generateSceneVideos(scenes, config, onSceneProgress, onSceneComplete, onSceneFailed) {
  const results = /* @__PURE__ */ new Map();
  const {
    aspectRatio,
    apiKey,
    provider = "openrouter",
    model,
    baseUrl,
    mockMode = false,
    characterReferenceImages = []
  } = config;
  if (!apiKey && !mockMode) {
    throw new Error("Configure an API key in Settings first");
  }
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (i > 0) {
      await delay(RATE_LIMITS.BATCH_ITEM_DELAY);
    }
    try {
      onSceneProgress?.(scene.id, 0);
      if (mockMode) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        const mockVideoUrl = `https://example.com/mock-video-${scene.id}.mp4`;
        results.set(scene.id, mockVideoUrl);
        onSceneProgress?.(scene.id, 100);
        onSceneComplete?.(scene.id, mockVideoUrl);
        continue;
      }
      onSceneProgress?.(scene.id, 10);
      if (provider !== "zhipu") {
        const resolvedBaseUrl = baseUrl?.replace(/\/+$/, "");
        if (!resolvedBaseUrl) {
          throw new Error("Configure the video-generation service mapping in Settings first");
        }
        const result = await submitVideoGenTask(
          scene.imageDataUrl,
          scene.videoPrompt,
          aspectRatio,
          apiKey,
          characterReferenceImages,
          model,
          resolvedBaseUrl,
          config.videoResolution
        );
        onSceneProgress?.(scene.id, 30);
        if (result.videoUrl) {
          results.set(scene.id, result.videoUrl);
          onSceneProgress?.(scene.id, 100);
          onSceneComplete?.(scene.id, result.videoUrl);
          continue;
        }
        if (result.taskId) {
          const videoUrl = await pollVideoTaskCompletion(
            result.taskId,
            apiKey,
            resolvedBaseUrl,
            // Use the same baseUrl that was used when submitting the task
            (progress) => {
              onSceneProgress?.(scene.id, 30 + Math.floor(progress * 0.7));
            }
          );
          results.set(scene.id, videoUrl);
          onSceneProgress?.(scene.id, 100);
          onSceneComplete?.(scene.id, videoUrl);
        } else {
          throw new Error("Invalid API response: no taskId or videoUrl");
        }
      } else {
        throw new Error(`Video generation not yet supported for provider: ${provider}`);
      }
    } catch (error) {
      const err = error;
      console.error(`[StoryboardService] Scene ${scene.id} video generation failed:`, err);
      onSceneFailed?.(scene.id, err.message);
    }
  }
  return results;
}
function DirectorView() {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const { activeProjectId } = useProjectStore();
  const { setActiveProjectId, ensureProject } = useDirectorStore();
  reactExports.useEffect(() => {
    if (activeProjectId) {
      setActiveProjectId(activeProjectId);
      ensureProject(activeProjectId);
    }
  }, [activeProjectId, setActiveProjectId, ensureProject]);
  reactExports.useEffect(() => {
    if (activeProjectId) setProjectVisualStyleId(projectVisualStyleId);
  }, [activeProjectId, projectVisualStyleId]);
  const projectData = useActiveDirectorProject();
  const {
    // Storyboard actions
    setStoryboardImage,
    setStoryboardStatus,
    setStoryboardError,
    setStoryboardConfig,
    resetStoryboard
  } = useDirectorStore();
  const storyboardStatus = projectData?.storyboardStatus || "editing";
  const storyboardImage = projectData?.storyboardImage || null;
  const storyboardError = projectData?.storyboardError || null;
  const storyboardConfig = projectData?.storyboardConfig || {
    aspectRatio: "9:16",
    resolution: "2K",
    sceneCount: 5,
    storyPrompt: ""
  };
  const splitScenes = projectData?.splitScenes || [];
  const { addMediaFromUrl, getOrCreateCategoryFolder } = useMediaStore();
  const libraryCharacters = useCharacterLibraryStore((state) => state.characters);
  const { pendingDirectorData, setPendingDirectorData } = useMediaPanelStore();
  const [storyboardProgress, setStoryboardProgress] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (!pendingDirectorData?.prebuiltScenes?.length) return;
    const resolveCharacterIds = (ids, names) => {
      if (ids?.length) return ids;
      if (!names?.length) return [];
      const resolved = [];
      const seen = /* @__PURE__ */ new Set();
      for (const name of names) {
        const character = libraryCharacters.find((c) => c.name === name || c.name.includes(name) || name.includes(c.name));
        if (character && !seen.has(character.id)) {
          resolved.push(character.id);
          seen.add(character.id);
        }
      }
      return resolved;
    };
    const importedScenes = pendingDirectorData.prebuiltScenes.map((s, idx) => ({
      id: idx + 1,
      sceneName: s.sceneName || "",
      sceneLocation: s.sceneLocation || "",
      imageDataUrl: "",
      imageHttpUrl: null,
      width: 0,
      height: 0,
      imagePrompt: s.imagePrompt || "",
      imageStatus: "idle",
      imageProgress: 0,
      imageError: null,
      videoPrompt: s.videoPrompt || "",
      voiceOver: s.voiceOver || "",
      videoLength: normalizeVideoLength(s.videoLength),
      videoStatus: "idle",
      videoProgress: 0,
      videoUrl: null,
      videoError: null,
      videoMediaId: null,
      characterIds: resolveCharacterIds(s.characterIds, s.characterNames),
      characterNames: s.characterNames || [],
      emotionTags: [],
      dialogue: s.dialogue || "",
      soundEffectText: "",
      ambientSound: s.ambientSound || "",
      soundEffects: [],
      row: 0,
      col: 0,
      sourceRect: { x: 0, y: 0, width: 0, height: 0 },
      sceneLibraryId: s.sceneLibraryId,
      sceneReferenceImage: s.sceneReferenceImage || void 0,
      sceneMasterReferenceImage: s.sceneMasterReferenceImage || void 0,
      ref_image: normalizeRefImageIndexes(s.ref_image ?? s.refImage),
      sourceShotId: s.sourceShotId,
      sourceShotIndex: s.sourceShotIndex ?? idx + 1
    }));
    useDirectorStore.getState().setSplitScenes(importedScenes);
    setProjectVisualStyleId(projectVisualStyleId);
    setStoryboardConfig({
      storyPrompt: pendingDirectorData.storyPrompt || "",
      sceneCount: pendingDirectorData.sceneCount || importedScenes.length
    });
    setStoryboardStatus("editing");
    setPendingDirectorData(null);
  }, [pendingDirectorData, setPendingDirectorData, setStoryboardConfig, setStoryboardStatus, libraryCharacters, projectVisualStyleId]);
  const STEPS = [
    { id: "idle", name: t("director.step.storyInput"), storyboardStatus: "idle" },
    { id: "preview", name: t("director.step.previewStoryboard"), storyboardStatus: "preview" },
    { id: "editing", name: t("director.step.editScenes"), storyboardStatus: "editing" }
  ];
  const getCurrentStepIndex = () => {
    if (storyboardStatus === "idle") return 0;
    if (storyboardStatus === "preview") return 1;
    if (storyboardStatus === "editing") return 2;
    return 0;
  };
  const currentStepIndex = getCurrentStepIndex();
  const goToPrevStep = () => {
    if (currentStepIndex === 0) return;
    const prevStep = STEPS[currentStepIndex - 1];
    if (prevStep.storyboardStatus === "idle") {
      resetStoryboard();
    } else {
      setStoryboardStatus(prevStep.storyboardStatus);
    }
  };
  const goToNextStep = () => {
    if (currentStepIndex >= STEPS.length - 1) return;
    if (currentStepIndex === 0 && !storyboardImage) {
      toast.error("Generate a storyboard first");
      return;
    }
    if (currentStepIndex === 1 && splitScenes.length === 0) {
      toast.error("Split the scenes first");
      return;
    }
    const nextStep = STEPS[currentStepIndex + 1];
    setStoryboardStatus(nextStep.storyboardStatus);
  };
  const canGoPrev = currentStepIndex > 0 && !["generating", "splitting"].includes(storyboardStatus);
  const canGoNext = currentStepIndex < STEPS.length - 1 && !["generating", "splitting"].includes(storyboardStatus) && (currentStepIndex === 0 && storyboardImage || currentStepIndex === 1 && splitScenes.length > 0);
  const handleGenerateStoryboard = reactExports.useCallback(async (config) => {
    if (config.visualStyleId) setProjectVisualStyleId(config.visualStyleId);
    setStoryboardStatus("generating");
    setStoryboardConfig({
      aspectRatio: config.aspectRatio,
      resolution: config.resolution,
      sceneCount: config.sceneCount,
      storyPrompt: config.storyPrompt,
      visualStyleId: config.visualStyleId,
      styleTokens: config.styleTokens,
      characterDescriptions: config.characterDescriptions,
      characterReferenceImages: config.characterReferenceImages
    });
    setStoryboardProgress(0);
    try {
      const featureConfig = getFeatureConfig("character_generation");
      if (!featureConfig) {
        throw new Error("Configure image generation in Settings first");
      }
      const apiKey = featureConfig.apiKey;
      const provider = featureConfig.platform;
      const model = featureConfig.models[0];
      const baseUrl = featureConfig.baseUrl;
      console.log("[DirectorView] Using image generation config:", { provider, model, baseUrl });
      const result = await generateStoryboardImage(
        {
          storyPrompt: config.storyPrompt,
          sceneCount: config.sceneCount,
          aspectRatio: config.aspectRatio,
          resolution: config.resolution,
          styleTokens: config.styleTokens,
          characterDescriptions: config.characterDescriptions,
          characterReferenceImages: config.characterReferenceImages,
          apiKey,
          provider,
          model,
          baseUrl
        },
        (progress) => setStoryboardProgress(progress)
      );
      const folderId = getOrCreateCategoryFolder("ai-image");
      const mediaId = addMediaFromUrl({
        url: result.imageUrl,
        name: `Storyboard-${config.sceneCount}-scene`,
        type: "image",
        source: "ai-image",
        folderId,
        projectId: activeProjectId || void 0
      });
      console.log("[DirectorView] Saved storyboard image to AI image folder:", mediaId);
      setStoryboardImage(result.imageUrl, mediaId);
      setStoryboardStatus("preview");
      toast.success("Storyboard generated and saved to Assets");
    } catch (error) {
      const err = error;
      console.error("[DirectorView] Storyboard generation failed:", err);
      setStoryboardError(err.message);
      setStoryboardStatus("error");
      toast.error(`Storyboard generation failed: ${err.message}`);
    }
  }, [setStoryboardImage, setStoryboardStatus, setStoryboardError, setStoryboardConfig, getOrCreateCategoryFolder, addMediaFromUrl, activeProjectId]);
  const handleGenerateVideos = reactExports.useCallback(async () => {
    if (splitScenes.length === 0) {
      toast.error("No scenes available for generation");
      return;
    }
    const videoConfig = getFeatureConfig("video_generation");
    if (!videoConfig) {
      toast.error("Configure video generation in Settings first");
      return;
    }
    const apiKey = videoConfig.apiKey;
    const provider = videoConfig.platform;
    const model = videoConfig.models[0];
    const baseUrl = videoConfig.baseUrl;
    console.log("[DirectorView] Using video generation config:", { provider, model, baseUrl });
    toast.info(`Starting video generation for ${splitScenes.length} scenes... (${provider} ${model || ""})`);
    await generateSceneVideos(
      splitScenes.map((s) => ({
        id: s.id,
        imageDataUrl: s.imageDataUrl,
        videoPrompt: s.videoPrompt
      })),
      {
        aspectRatio: storyboardConfig.aspectRatio,
        apiKey,
        provider,
        // Pass through the provider selected in the service mapping.
        model,
        baseUrl
      },
      (sceneId, progress) => {
        console.log(`[DirectorView] Scene ${sceneId} progress: ${progress}%`);
      },
      (sceneId) => {
        toast.success(t("director.videoDoneSaved", { index: sceneId }));
      },
      (sceneId, error) => {
        toast.error(t("director.shotFailed", { index: sceneId, message: error }));
      }
    );
    toast.success(t("director.allVideosDone"));
  }, [splitScenes, storyboardConfig, t]);
  const renderContent = () => {
    if (storyboardStatus !== "idle") {
      switch (storyboardStatus) {
        case "generating":
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
              t("director.generatingStoryboard"),
              " ",
              storyboardProgress,
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground/60", children: [
              t("director.sceneCount", { count: storyboardConfig.sceneCount }),
              " · ",
              storyboardConfig.aspectRatio,
              " · ",
              storyboardConfig.resolution
            ] })
          ] });
        case "preview":
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            StoryboardPreview,
            {
              onBack: () => resetStoryboard(),
              onSplitComplete: () => {
              }
            }
          );
        case "splitting":
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("director.splitting") })
          ] });
        case "editing":
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            SplitScenes,
            {
              onBack: () => resetStoryboard(),
              onGenerateVideos: handleGenerateVideos
            }
          );
        case "error":
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-64 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl", children: "😕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: storyboardError }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => resetStoryboard(), variant: "outline", children: t("director.retry") })
          ] });
      }
    }
    if (splitScenes.length > 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        SplitScenes,
        {
          onBack: () => resetStoryboard(),
          onGenerateVideos: handleGenerateVideos
        }
      );
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ScreenplayInput, { onGenerateStoryboard: handleGenerateStoryboard });
  };
  const showHeaderStatus = storyboardStatus !== "idle";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full min-w-0 flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 pb-2 bg-panel", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-sm", children: t("director.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: showHeaderStatus && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: storyboardStatus === "editing" ? "hidden" : "text-xs text-muted-foreground capitalize", children: [
        storyboardStatus === "generating" && t("director.storyboardProgress", { progress: storyboardProgress }),
        storyboardStatus === "preview" && t("director.previewStatus"),
        storyboardStatus === "splitting" && t("director.splitting"),
        storyboardStatus === "editing" && t("director.editingStatus"),
        storyboardStatus === "error" && t("director.errorStatus")
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", children: renderContent() }),
    storyboardStatus !== "editing" && storyboardStatus !== "idle" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 pt-2 border-t bg-panel", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-2 mb-2", children: STEPS.map((step, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-center gap-1 text-xs ${idx === currentStepIndex ? "text-primary font-medium" : idx < currentStepIndex ? "text-muted-foreground" : "text-muted-foreground/50"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-2xs ${idx === currentStepIndex ? "bg-primary text-primary-foreground" : idx < currentStepIndex ? "bg-muted-foreground/30 text-muted-foreground" : "bg-muted text-muted-foreground/50"}`, children: idx + 1 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: step.name }),
            idx < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-muted-foreground/30 mx-1" })
          ]
        },
        step.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: goToPrevStep,
            disabled: !canGoPrev,
            className: "flex-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }),
              t("director.previousStep")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: goToNextStep,
            disabled: !canGoNext,
            className: "flex-1",
            children: [
              t("director.nextStep"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 ml-1" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  DirectorView
};
