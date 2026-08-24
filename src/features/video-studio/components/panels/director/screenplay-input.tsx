"use client";

/**
 * Screenplay Input Component
 * Input area for screenplay generation prompt and reference images
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { useDirectorStore, useActiveDirectorProject } from "@/features/video-studio/stores/director-store";
import { useCharacterLibraryStore, type Character } from "@/features/video-studio/stores/character-library-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import { Wand2, ImagePlus, X, User, Users, Plus, Check, Monitor, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useI18n } from "@/shared/i18n";
import { useMediaPanelStore } from "@/features/video-studio/stores/media-panel-store";
import { 
  validateSceneCount, 
  SCENE_LIMITS,
  type AspectRatio,
  type Resolution 
} from "@/features/video-studio/lib/storyboard/grid-calculator";
import { uploadMultipleImages } from "@/features/video-studio/lib/utils/image-upload";
import { VISUAL_STYLE_PRESETS, getStyleById, getStyleTokens, type VisualStyleId } from "@/features/video-studio/lib/constants/visual-styles";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { normalizeRefImageIndexes, normalizeVideoLength } from "@/features/video-studio/types/script";
import { setProjectVisualStyleId, useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";

const EXAMPLE_PROMPTS = [
  "A cute kitten plays on the grass, chasing butterflies.",
  "Two close friends walk through a park, sharing a joyful afternoon.",
  "A rabbit and a bear explore the forest and discover a mysterious treasure.",
  "A little girl builds a sandcastle by the sea while waves roll in softly.",
];

type StyleId = VisualStyleId | "random";

// Dragged character info type
interface DraggedCharacter {
  characterId: string;
  characterName: string;
  characterPrompt: string;
  thumbnailUrl?: string;
}

interface ScreenplayInputProps {
  onGenerateStoryboard: (config: {
    storyPrompt: string;
    sceneCount: number;
    aspectRatio: '16:9' | '9:16';
    resolution: '2K' | '4K';
    styleTokens: string[];
    visualStyleId?: string;
    characterDescriptions?: string[];
    characterReferenceImages?: string[];
  }) => void;
}

export function ScreenplayInput({ onGenerateStoryboard }: ScreenplayInputProps) {
  const { t } = useI18n();
  const projectVisualStyleId = useProjectVisualStyleId();
  const activeDirectorProject = useActiveDirectorProject();
  const savedConfig = activeDirectorProject?.storyboardConfig;
  const savedDraft = activeDirectorProject?.screenplayDraft;
  const lastHydratedProjectIdRef = useRef<string | null>(null);
  const savedStyleId = savedConfig?.visualStyleId;
  const initialStyleId: StyleId = savedStyleId && getStyleById(savedStyleId)
    ? (savedStyleId as StyleId)
    : (projectVisualStyleId as StyleId);
  const initialResolution: Resolution = savedConfig?.resolution === '4K' ? '4K' : '2K';

  const [prompt, setPrompt] = useState(savedDraft?.prompt || "");
  const [images, setImages] = useState<File[]>([]);
  const imageUrls = useMemo(() => images.map(img => URL.createObjectURL(img)), [images]);
  useEffect(() => {
    return () => { imageUrls.forEach(url => URL.revokeObjectURL(url)); };
  }, [imageUrls]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sceneCount, setSceneCount] = useState<number>(savedConfig?.sceneCount || 4);
  const [styleId, setStyleId] = useState<StyleId>(initialStyleId);
  const [selectedCharacters, setSelectedCharacters] = useState<DraggedCharacter[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCharacterPopoverOpen, setIsCharacterPopoverOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(savedConfig?.aspectRatio || '9:16');
  const [resolution, setResolution] = useState<Resolution>(initialResolution);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStyleId(projectVisualStyleId as StyleId);
  }, [projectVisualStyleId]);

  const handleStyleChange = useCallback((nextStyleId: string) => {
    if (!setProjectVisualStyleId(nextStyleId)) return;
    setStyleId(nextStyleId as StyleId);
  }, []);

  // Validate scene count against resolution limit (strong constraint)
  const sceneValidation = validateSceneCount(sceneCount, resolution);
  const isSceneCountValid = sceneValidation.isValid;

  const { setScreenplayDraft, setSplitScenes, setStoryboardStatus } = useDirectorStore();
  const { characters } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const visibleCharacters = useMemo(() => {
    if (resourceSharing.shareCharacters) return characters;
    if (!activeProjectId) return [];
    return characters.filter((c) => c.projectId === activeProjectId);
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);
  const { setActiveTab, pendingDirectorData, setPendingDirectorData } = useMediaPanelStore();
  const selectedCharacterIds = useMemo(
    () => selectedCharacters.map((c) => c.characterId),
    [selectedCharacters]
  );

  const resolveDraftCharacters = useCallback((characterIds: string[]): DraggedCharacter[] => {
    if (!characterIds?.length) return [];
    const seen = new Set<string>();
    return characterIds
      .map((id) => {
        const libChar = visibleCharacters.find((c) => c.id === id);
        if (!libChar || seen.has(libChar.id)) return null;
        seen.add(libChar.id);
        return {
          characterId: libChar.id,
          characterName: libChar.name,
          characterPrompt: libChar.characterPrompt || libChar.description || "",
          thumbnailUrl: libChar.thumbnailUrl,
        } as DraggedCharacter;
      })
      .filter(Boolean) as DraggedCharacter[];
  }, [visibleCharacters]);

  // Restore persisted draft once per project (pendingDirectorData has higher priority)
  useEffect(() => {
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
    resolveDraftCharacters,
  ]);

  // Read pending data from script panel and prefill
  useEffect(() => {
    if (!pendingDirectorData) return;

    // If calibrated prompts already exist → skip storyboard generation, go directly to editing
    if (pendingDirectorData.prebuiltScenes && pendingDirectorData.prebuiltScenes.length > 0) {
      const resolveCharacterIds = (ids?: string[], names?: string[]) => {
        if (ids?.length) return ids;
        if (!names?.length) return [];
        const resolved: string[] = [];
        const seen = new Set<string>();
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
        sceneName: s.sceneName || '',
        sceneLocation: s.sceneLocation || '',
        imageDataUrl: null as string | null,
        imageHttpUrl: null as string | null,
        width: 0,
        height: 0,
        imagePrompt: s.imagePrompt,
        videoPrompt: s.videoPrompt,
        voiceOver: s.voiceOver || '',
        videoLength: normalizeVideoLength(s.videoLength),
        characterIds: resolveCharacterIds(s.characterIds, s.characterNames),
        characterNames: s.characterNames || [],
        sceneReferenceImage: s.sceneReferenceImage || undefined,
        ref_image: normalizeRefImageIndexes((s as any).ref_image ?? (s as any).refImage),
        sourceShotId: s.sourceShotId,
        sourceShotIndex: s.sourceShotIndex ?? idx + 1,
        ambientSound: s.ambientSound || '',
        soundEffects: [] as string[],
        soundEffectText: '',
        dialogue: s.dialogue || '',
        imageStatus: 'idle' as const,
        imageProgress: 0,
        imageError: null as string | null,
        videoStatus: 'idle' as const,
        videoProgress: 0,
        videoUrl: null as string | null,
        videoError: null as string | null,
        videoMediaId: null as string | null,
        row: 0,
        col: 0,
        sourceRect: { x: 0, y: 0, width: 0, height: 0 },
      }));
      setSplitScenes(scenes as any);
      setStoryboardStatus('editing');
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

    // Pending data has higher priority; draft fills missing fields.
    setPrompt(pendingDirectorData.storyPrompt || draftPrompt);

    // Set scene count (single shot = 1)
    if (pendingDirectorData.sceneCount) {
      setSceneCount(pendingDirectorData.sceneCount);
    }

    // Director's persisted project style is authoritative over forwarded data.
    setStyleId(projectVisualStyleId as StyleId);

    // Prefer pending character-library IDs, then fall back to names, then draft IDs.
    let matchedChars: DraggedCharacter[] = [];
    if (hasPendingCharacterIds) {
      matchedChars = (pendingDirectorData.characterLibraryIds || []).map((id) => {
        const libChar = visibleCharacters.find((c) => c.id === id);
        if (!libChar) return null;
        const thumbnailUrl = libChar.thumbnailUrl;
        return {
          characterId: libChar.id,
          characterName: libChar.name,
          characterPrompt: libChar.characterPrompt || libChar.description || "",
          thumbnailUrl,
        } as DraggedCharacter;
      }).filter(Boolean) as DraggedCharacter[];
    }
    if (matchedChars.length === 0 && hasPendingCharacterNames) {
      matchedChars = pendingDirectorData.characterNames!.map((name) => {
        const libChar = visibleCharacters.find(
          (c) => c.name === name || c.name.includes(name) || name.includes(c.name)
        );
        if (!libChar) return null;
        const thumbnailUrl = libChar.thumbnailUrl;
        return {
          characterId: libChar.id,
          characterName: libChar.name,
          characterPrompt: libChar.characterPrompt || libChar.description || "",
          thumbnailUrl,
        } as DraggedCharacter;
      }).filter(Boolean) as DraggedCharacter[];
    }
    setSelectedCharacters(matchedChars.length > 0 ? matchedChars : draftCharacters);

    // Clear the pending data after consuming
    setPendingDirectorData(null);
  }, [
    pendingDirectorData,
    visibleCharacters,
    setPendingDirectorData,
    activeProjectId,
    savedDraft,
    resolveDraftCharacters,
    projectVisualStyleId,
  ]);

  // Persist screenplay draft to store (debounced) to survive panel/module switching
  useEffect(() => {
    if (!activeProjectId || pendingDirectorData) return;

    const savedCharacterIds = savedDraft?.selectedCharacterIds || [];
    const sameCharacters =
      selectedCharacterIds.length === savedCharacterIds.length &&
      selectedCharacterIds.every((id, idx) => id === savedCharacterIds[idx]);
    const samePrompt = prompt === (savedDraft?.prompt || "");
    if (samePrompt && sameCharacters) return;

    const timer = window.setTimeout(() => {
      setScreenplayDraft({
        prompt,
        selectedCharacterIds,
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    activeProjectId,
    pendingDirectorData,
    prompt,
    selectedCharacterIds,
    savedDraft,
    setScreenplayDraft,
  ]);

  // Get max scene options based on resolution
  const getMaxSceneOptions = () => {
    const limit = SCENE_LIMITS[resolution];
    return Array.from({ length: limit }, (_, i) => i + 1);
  };

  // Get style tokens for the selected style
  const getSelectedStyleTokens = () => {
    if (styleId === "random") {
      const randomizableStyles = VISUAL_STYLE_PRESETS.filter((style) => style.id !== 'none');
      const randomStyle = randomizableStyles[Math.floor(Math.random() * randomizableStyles.length)];
      return randomStyle ? getStyleTokens(randomStyle.id) : [];
    }
    return getStyleTokens(styleId);
  };

  // Handle character drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // Handle character drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === "character") {
        // Check if already added
        if (selectedCharacters.some(c => c.characterId === data.characterId)) {
          toast.info("This character is already added");
          return;
        }

        const newChar: DraggedCharacter = {
          characterId: data.characterId,
          characterName: data.characterName,
          characterPrompt: data.characterPrompt || "",
          thumbnailUrl: data.thumbnailUrl,
        };

        setSelectedCharacters(prev => [...prev, newChar]);
        toast.success(`Added character: ${data.characterName}`);
      }
    } catch (err) {
      // Not a valid character drop
    }
  }, [selectedCharacters]);

  // Remove character
  const removeCharacter = (characterId: string) => {
    setSelectedCharacters(prev => prev.filter(c => c.characterId !== characterId));
  };

  // Toggle character selection from popover
  const toggleCharacterSelection = (character: Character) => {
    const isSelected = selectedCharacters.some(c => c.characterId === character.id);
    
    if (isSelected) {
      setSelectedCharacters(prev => prev.filter(c => c.characterId !== character.id));
    } else {
      const thumbnailUrl = character.thumbnailUrl;
      const newChar: DraggedCharacter = {
        characterId: character.id,
        characterName: character.name,
        characterPrompt: character.characterPrompt || character.description || "",
        thumbnailUrl,
      };
      setSelectedCharacters(prev => [...prev, newChar]);
    }
  };

  // Navigate to characters view
  const goToCharacterLibrary = () => {
    setIsCharacterPopoverOpen(false);
    setActiveTab("characters");
  };

  // Build prompt with character descriptions
  const buildPromptWithCharacters = () => {
    let fullPrompt = prompt;
    if (selectedCharacters.length > 0) {
      const characterDescriptions = selectedCharacters
        .map(c => `Character "${c.characterName}": ${c.characterPrompt || 'designed by AI based on the name'}`)
        .join("; ");
      fullPrompt = `${prompt}\n\nInclude these characters: ${characterDescriptions}`;
    }
    return fullPrompt;
  };

  // Get character reference images (base64 or URL) for visual consistency
  // Will be uploaded to get HTTP URLs before API call
  const getCharacterReferenceImages = (): string[] => {
    const refImages: string[] = [];
    
    for (const selectedChar of selectedCharacters) {
      // Find full character data from store
      const fullChar = visibleCharacters.find(c => c.id === selectedChar.characterId);
      if (fullChar?.thumbnailUrl) {
        const refImage = fullChar.thumbnailUrl;
        if (refImage) {
          refImages.push(refImage);
        }
      }
    }
    
    return refImages;
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 3); // Max 3 images
      setImages((prev) => [...prev, ...newImages].slice(0, 3));
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
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
        c => `${c.characterName}: ${c.characterPrompt || 'designed by AI based on the name'}`
      );

      // Upload base64 images to get HTTP URLs (API only accepts URLs)
      let characterReferenceImages: string[] = [];
      if (rawCharacterImages.length > 0) {
        toast.info('Uploading character reference images...');
        try {
          characterReferenceImages = await uploadMultipleImages(rawCharacterImages);
          if (characterReferenceImages.length > 0) {
            toast.success(`Uploaded ${characterReferenceImages.length} character reference images`);
          }
        } catch (uploadError) {
          console.warn('[ScreenplayInput] Failed to upload character images:', uploadError);
          toast.warning('Character reference image upload failed, so no character refs will be used');
        }
      }

      // Build prompt with character info
      const fullPrompt = buildPromptWithCharacters();

      onGenerateStoryboard({
        storyPrompt: fullPrompt,
        sceneCount,
        aspectRatio,
        resolution,
        styleTokens: actualStyleTokens,
        visualStyleId: styleId === "random" ? undefined : styleId,
        characterDescriptions: characterDescriptions.length > 0 ? characterDescriptions : undefined,
        characterReferenceImages: characterReferenceImages.length > 0 ? characterReferenceImages : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="space-y-4">
      {/* Prompt input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("director.describeVideo")}</label>
        <Textarea
          placeholder={t("director.screenplayPlaceholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Example prompts */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">{t("director.examplePrompts")}</label>
        <div className="flex flex-wrap gap-1">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(example)}
              className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors truncate max-w-[150px]"
              disabled={isSubmitting}
            >
              {example.substring(0, 15)}...
            </button>
          ))}
        </div>
      </div>

      {/* Aspect ratio and resolution selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Aspect ratio */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("director.aspectRatioLabel")}</Label>
          <Select
            value={aspectRatio}
            onValueChange={(v) => setAspectRatio(v as AspectRatio)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("director.selectRatio")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">
                <span className="flex items-center gap-2">
                  <Monitor className="h-3 w-3" />
                  16:9 Landscape
                </span>
              </SelectItem>
              <SelectItem value="9:16">
                <span className="flex items-center gap-2">
                  <Smartphone className="h-3 w-3" />
                  9:16 Portrait
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resolution */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("director.resolutionLabel")}</Label>
          <Select
            value={resolution}
            onValueChange={(v) => {
              const newRes = v as Resolution;
              setResolution(newRes);
              // Auto-adjust scene count if it exceeds new limit
              const newLimit = SCENE_LIMITS[newRes];
              if (sceneCount > newLimit) {
                setSceneCount(newLimit);
              }
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("director.selectResolution")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2K">
                2K (up to {SCENE_LIMITS['2K']} scenes)
              </SelectItem>
              <SelectItem value="4K">
                4K (up to {SCENE_LIMITS['4K']} scenes)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scene count and style selection */}
      <div className="grid grid-cols-2 gap-3">
        {/* Scene count */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-2">
            Scene Count
            {!isSceneCountValid && (
              <span className="text-xs text-destructive font-normal">
                Over limit
              </span>
            )}
          </Label>
          <Select
            value={String(sceneCount)}
            onValueChange={(v) => setSceneCount(Number(v))}
            disabled={isSubmitting}
          >
            <SelectTrigger className={`w-full ${!isSceneCountValid ? 'border-destructive' : ''}`}>
              <SelectValue placeholder={t("director.selectSceneCount")} />
            </SelectTrigger>
            <SelectContent>
              {getMaxSceneOptions().map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} scenes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("director.visualStyleLabel")}</Label>
          <StylePicker
            value={styleId === "random" ? "" : styleId}
            onChange={handleStyleChange}
            disabled={isSubmitting}
            placeholder={t("director.selectStyleRandom")}
          />
        </div>
      </div>

      {/* Scene count warning */}
      {!isSceneCountValid && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-xs text-destructive">
            <p>{sceneValidation.message}</p>
          </div>
        </div>
      )}

      {/* Character drop zone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Users className="h-4 w-4" />
            {t("director.characterLibrary")}
          </Label>
          {selectedCharacters.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {t("director.charactersSelected", { count: selectedCharacters.length })}
            </span>
          )}
        </div>
        
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-colors ${
            isDragOver 
              ? "border-primary bg-primary/10" 
              : "border-muted-foreground/20 hover:border-muted-foreground/40"
          }`}
        >
          {selectedCharacters.length === 0 ? (
            <Popover open={isCharacterPopoverOpen} onOpenChange={setIsCharacterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-2 border-b">
                  <p className="text-sm font-medium">{t("director.selectCharacters")}</p>
                </div>
                {visibleCharacters.length === 0 ? (
                  <div className="p-4 text-center">
                    <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">{t("director.characterLibraryEmpty")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToCharacterLibrary}
                    >
                      {t("director.goCreateCharacter")}
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto">
                    {visibleCharacters.map((char: Character) => {
                      const isSelected = selectedCharacters.some(c => c.characterId === char.id);
                      const thumbnail = char.thumbnailUrl;
                      
                      return (
                        <button
                          key={char.id}
                          onClick={() => toggleCharacterSelection(char)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left"
                        >
                          {thumbnail ? (
                            <img 
                              src={thumbnail} 
                              alt={char.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <span className="flex-1 text-sm truncate">{char.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              {selectedCharacters.map((char) => (
                <div 
                  key={char.characterId}
                  className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1"
                >
                  {char.thumbnailUrl ? (
                    <img 
                      src={char.thumbnailUrl} 
                      alt={char.characterName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                  <span className="text-xs font-medium">{char.characterName}</span>
                  <button
                    onClick={() => removeCharacter(char.characterId)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Add more button */}
              <Popover open={isCharacterPopoverOpen} onOpenChange={setIsCharacterPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2 border-b">
                    <p className="text-sm font-medium">{t("director.selectCharacters")}</p>
                  </div>
                  {visibleCharacters.length === 0 ? (
                    <div className="p-4 text-center">
                      <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">{t("director.characterLibraryEmpty")}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToCharacterLibrary}
                      >
                        {t("director.goCreateCharacter")}
                      </Button>
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto">
                      {visibleCharacters.map((char: Character) => {
                        const isSelected = selectedCharacters.some(c => c.characterId === char.id);
                        const thumbnail = char.thumbnailUrl;
                        
                        return (
                          <button
                            key={char.id}
                            onClick={() => toggleCharacterSelection(char)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors text-left"
                          >
                            {thumbnail ? (
                              <img 
                                src={thumbnail} 
                                alt={char.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                            <span className="flex-1 text-sm truncate">{char.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
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
      </div>

      {/* Reference images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t("director.referenceImagesOptional")}</label>
          <span className="text-xs text-muted-foreground">{images.length}/3</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {images.map((_img, i) => (
            <div key={i} className="relative group">
              <img
                src={imageUrls[i]}
                alt={`Reference ${i + 1}`}
                className="w-16 h-16 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {images.length < 3 && (
            <div
              className={`relative w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => {
                if (isSubmitting) return;
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = (e) => handleImageChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
                input.click();
              }}
            >
              <ImagePlus className="h-5 w-5 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isSubmitting || !isSceneCountValid}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Storyboard
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
