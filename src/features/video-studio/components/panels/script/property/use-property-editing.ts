"use client";

/**
 * Editing and clipboard behaviour shared by every branch of the Script property
 * panel: the inline edit buffer, image upload/removal for a character, and the
 * "copy as text" actions for a scene, character, episode or shot.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Translate } from "@/shared/i18n";
import { saveImageToLocal } from "@/features/video-studio/lib/image-storage";
import type { ScriptCharacter, ScriptScene, Shot } from "@/features/video-studio/types/script";

export interface PropertyEditingDeps {
  selectedItemId: string | null;
  selectedItemType: "character" | "scene" | "shot" | "episode" | null;
  character?: ScriptCharacter;
  scene?: ScriptScene;
  shot?: Shot;
  episode?: any;
  episodeShots: Shot[];
  onUpdateCharacter?: (id: string, updates: Partial<ScriptCharacter>) => void;
  onUpdateScene?: (id: string, updates: Partial<ScriptScene>) => void;
  onUpdateShot?: (id: string, updates: Partial<Shot>) => void;
  onDeleteCharacter?: (id: string) => void;
  onDeleteScene?: (id: string) => void;
  onDeleteShot?: (id: string) => void;
  t: Translate;
}

export function usePropertyEditing(deps: PropertyEditingDeps) {
  const {
    selectedItemId,
    selectedItemType,
    character,
    scene,
    shot,
    episode,
    episodeShots,
    onUpdateCharacter,
    onUpdateScene,
    onUpdateShot,
    onDeleteCharacter,
    onDeleteScene,
    onDeleteShot,
    t,
  } = deps;

  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [copiedCharacter, setCopiedCharacter] = useState(false);
  const [copiedShotPrompts, setCopiedShotPrompts] = useState(false);
  const [copiedScene, setCopiedScene] = useState(false);

  const handleUploadCharacterImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !character) return;

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const localPath = await saveImageToLocal(
        dataUrl,
        'characters',
        `${character.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.png`
      );

      const nextReferenceImages = [...(character.referenceImages || []), localPath].slice(0, 3);
      onUpdateCharacter?.(character.id, {
        thumbnailUrl: localPath,
        referenceImages: nextReferenceImages,
      });

      toast.success(t("characters.savedLocal"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };

  const handleRemoveCharacterImage = (imagePath: string) => {
    if (!character) return;
    const nextReferenceImages = (character.referenceImages || []).filter((img) => img !== imagePath);
    onUpdateCharacter?.(character.id, {
      referenceImages: nextReferenceImages.length > 0 ? nextReferenceImages : undefined,
      thumbnailUrl: character.thumbnailUrl === imagePath ? nextReferenceImages[0] : character.thumbnailUrl,
    });
  };

  // Copy scene data
  const handleCopySceneData = async () => {
    if (!scene) return;
    
    const lines: string[] = [];
    lines.push(`# Scene: ${scene.name || "Untitled"}`);
    lines.push('');

    if (scene.description) {
      lines.push(`## Description`);
      lines.push(scene.description);
      lines.push('');
    }
    
    // Scene prompt
    const includeScenePrompt = !!scene.scenePrompt;
    if (includeScenePrompt) {
      lines.push(`## Scene Prompt`);
      lines.push(scene.scenePrompt || '');
      lines.push('');
    }
    
    // Appearance stats
    if (scene.importance || scene.appearanceCount || scene.episodeNumbers?.length) {
      lines.push(`## Appearance Stats`);
      if (scene.importance) {
        const importanceLabel = scene.importance === 'main' ? 'Primary Scene' : 
                               scene.importance === 'secondary' ? 'Secondary Scene' : 'Transition Scene';
        lines.push(`Importance: ${importanceLabel}`);
      }
      if (scene.appearanceCount) lines.push(`Appearances: ${scene.appearanceCount}`);
      if (scene.episodeNumbers && scene.episodeNumbers.length > 0) {
        lines.push(`Episodes: ${scene.episodeNumbers.join(', ')}`);
      }
      lines.push('');
    }
    
    const text = lines.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScene(true);
      setTimeout(() => setCopiedScene(false), 2000);
    } catch (e) {
      console.error('Copy scene failed:', e);
    }
  };

  // Copy character data
  const handleCopyCharacterData = async () => {
    if (!character) return;
    
    // Format character data
    const lines: string[] = [];
    lines.push(`# Character: ${character.name}`);
    lines.push('');

    if (character.characterPrompt || character.appearance) {
      lines.push(`## Image Prompt`);
      lines.push(character.characterPrompt || character.appearance || '');
      lines.push('');
    }
    
    const text = lines.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCharacter(true);
      setTimeout(() => setCopiedCharacter(false), 2000);
    } catch (e) {
      console.error('Copy character failed:', e);
    }
  };

  // Copy episode shot data
  const handleCopyEpisodeShots = async () => {
    if (!episode || episodeShots.length === 0) return;
    
    // Emotion label mapping
    const emotionLabels: Record<string, string> = {
      happy: 'happy', sad: 'sad', angry: 'angry', surprised: 'surprised', fearful: 'fearful', calm: 'calm',
      tense: 'tense', excited: 'excited', mysterious: 'mysterious', romantic: 'romantic', funny: 'funny', touching: 'touching',
      serious: 'serious', relaxed: 'relaxed', playful: 'playful', gentle: 'gentle', passionate: 'passionate', low: 'low'
    };
    
    // Format shot data
    const lines: string[] = [];
    lines.push(`# Episode ${episode.index}: ${episode.title.replace(/^\u7b2c\d+\u96c6[\uff1a:]?/, '')}`);
    lines.push('');
    lines.push(`## Shot List (${episodeShots.length} total)`);
    lines.push('');
    
    episodeShots.forEach((s, idx) => {
      lines.push(`### Shot ${String(idx + 1).padStart(2, '0')}`);
      if (s.dialogue) {
        lines.push(`**Dialogue**: "${s.dialogue}"`);
      }
      if (s.characterNames && s.characterNames.length > 0) {
        lines.push(`**Characters**: ${s.characterNames.join(', ')}`);
      }
      if (s.emotionTags && s.emotionTags.length > 0) {
        const tags = s.emotionTags.map(t => emotionLabels[t] || t).join(', ');
        lines.push(`**Emotion**: ${tags}`);
      }
      if (s.imagePrompt) {
        lines.push(`**Image Prompt**: ${s.imagePrompt}`);
      }
      if (s.videoPrompt) {
        lines.push(`**Video Prompt**: ${s.videoPrompt}`);
      }
      if (s.voiceOver) {
        lines.push(`**Voice Over**: ${s.voiceOver}`);
      }
      lines.push('');
    });
    
    const text = lines.join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

    // Copy the current shot's image/video prompts
  const handleCopyShotTriPrompts = async () => {
    if (!shot) return;

    const hasTri = !!(
      shot.imagePrompt ||
      shot.videoPrompt ||
      shot.voiceOver
    );

    const lines: string[] = [];
    lines.push('═══════════════════════════════════════');
    lines.push(`Shot ${shot.index} - Prompt Data`);
    lines.push('═══════════════════════════════════════');
    lines.push('');

    if (!hasTri) {
      lines.push('Warning: this shot does not have prompts yet. Run AI shot calibration first.');
    } else {
      // ===== First-frame prompt =====
      lines.push('───────────────────────────────────────');
      lines.push('[First-Frame Prompt] Used to generate the first video frame image');
      lines.push('───────────────────────────────────────');
      if (shot.imagePrompt) {
        lines.push(`English: ${shot.imagePrompt}`);
      } else {
        lines.push('(not generated)');
      }
      lines.push('');

      // ===== Video prompt =====
      lines.push('───────────────────────────────────────');
      lines.push('[Video Prompt] Used for image-to-video generation, describing motion and action');
      lines.push('───────────────────────────────────────');
      if (shot.videoPrompt) {
        lines.push(`English: ${shot.videoPrompt}`);
      } else {
        lines.push('(not generated)');
      }
      lines.push('');

      if (shot.voiceOver) {
        lines.push('───────────────────────────────────────');
        lines.push('[Voice Over] Spoken narration, appended only when voice generation is enabled');
        lines.push('───────────────────────────────────────');
        lines.push(shot.voiceOver);
        lines.push('');
      }

    }

    lines.push('');
    lines.push('═══════════════════════════════════════');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedShotPrompts(true);
      setTimeout(() => setCopiedShotPrompts(false), 2000);
    } catch (e) {
      console.error('Copy tri-layer prompts failed:', e);
    }
  };

  // Reset edit state when selection changes
  useEffect(() => {
    setIsEditing(false);
    setEditData({});
  }, [selectedItemId, selectedItemType]);

  // Initialize edit data
  const startEditing = () => {
    if (selectedItemType === "character" && character) {
      setEditData({
        name: character.name || "",
        appearance: character.characterPrompt || character.appearance || "",
      });
    } else if (selectedItemType === "scene" && scene) {
      setEditData({
        name: scene.name || "",
        description: scene.description || "",
        scenePrompt: scene.scenePrompt || "",
      });
    } else if (selectedItemType === "shot" && shot) {
      setEditData({
        specialTechnique: shot.specialTechnique || "none",
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedItemType === "character" && character) {
      onUpdateCharacter?.(character.id, editData);
    } else if (selectedItemType === "scene" && scene) {
      onUpdateScene?.(scene.id, editData);
    } else if (selectedItemType === "shot" && shot) {
      onUpdateShot?.(shot.id, editData as any);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (selectedItemType === "character" && character) {
      onDeleteCharacter?.(character.id);
    } else if (selectedItemType === "scene" && scene) {
      onDeleteScene?.(scene.id);
    } else if (selectedItemType === "shot" && shot) {
      onDeleteShot?.(shot.id);
    }
    setDeleteDialogOpen(false);
  };


  return {
    isEditing, setIsEditing,
    deleteDialogOpen, setDeleteDialogOpen,
    editData, setEditData,
    copied, copiedCharacter, copiedShotPrompts, copiedScene,
    handleUploadCharacterImage,
    handleRemoveCharacterImage,
    handleCopySceneData,
    handleCopyCharacterData,
    handleCopyEpisodeShots,
    handleCopyShotTriPrompts,
    startEditing,
    handleSave,
    handleDelete,
  };
}
