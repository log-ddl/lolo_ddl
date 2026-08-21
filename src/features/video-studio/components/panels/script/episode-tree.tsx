"use client";

/**
 * Episode Tree Component
 * Middle column: hierarchical structure preview (episode -> scene -> shot), status tracking, and CRUD controls.
 */

import { useState, useMemo } from "react";
import type { ScriptData, ScriptCharacter, ScriptScene, Episode, Shot, CompletionStatus } from "@/features/video-studio/types/script";
import { normalizeVideoLength } from "@/features/video-studio/types/script";
import { getPromptTargetStatus, getShotCompletionStatus, calculateProgress, type PromptTargetStatus } from "@/features/video-studio/lib/script/shot-utils";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Film,
  MapPin,
  User,
  Circle,
  Clock,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Wand2,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
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
import { useI18n } from "@/shared/i18n";

function PromptStatusPill({ label, status }: { label: string; status: PromptTargetStatus }) {
  const { t } = useI18n();
  const className = status === 'ready'
    ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
    : status === 'missing'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : 'border-muted bg-muted/50 text-muted-foreground';
  return <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px]', className)}>{label}: {t(`promptStatus.${status === 'not-required' ? 'notRequired' : status}`)}</span>;
}

// Compute the completion-status icon.
function StatusIcon({ status }: { status?: CompletionStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    case "in_progress":
      return <Clock className="h-3 w-3 text-yellow-500" />;
    default:
      return <Circle className="h-3 w-3 text-muted-foreground" />;
  }
}

interface EpisodeTreeProps {
  scriptData: ScriptData | null;
  shots: Shot[];
  shotStatus?: "idle" | "generating" | "ready" | "error"; // Shot generation status
  selectedItemId: string | null;
  selectedItemType: "character" | "scene" | "shot" | "episode" | null;
  onSelectItem: (id: string, type: "character" | "scene" | "shot" | "episode") => void;
  // CRUD callbacks, bundle version to keep episodeRawScripts in sync
  onUpdateEpisodeBundle?: (episodeIndex: number, updates: { title?: string; synopsis?: string }) => void;
  onDeleteEpisodeBundle?: (episodeIndex: number) => void;
  onAddScene?: (scene: ScriptScene, episodeId?: string) => void;
  onUpdateScene?: (id: string, updates: Partial<ScriptScene>) => void;
  onDeleteScene?: (id: string) => void;
  onAddCharacter?: (character: ScriptCharacter) => void;
  onUpdateCharacter?: (id: string, updates: Partial<ScriptCharacter>) => void;
  onDeleteCharacter?: (id: string) => void;
  onDeleteShot?: (id: string) => void;
  // Shot generation callbacks
  onGenerateEpisodeShots?: (episodeIndex: number) => void;
  episodeGenerationStatus?: Record<number, 'idle' | 'generating' | 'completed' | 'error'>;
  onImportCharacters?: () => void;
  onImportScenes?: () => void;
}

export function EpisodeTree({
  scriptData,
  shots,
  shotStatus: _shotStatus,
  selectedItemId,
  selectedItemType,
  onSelectItem,
  onUpdateEpisodeBundle,
  onDeleteEpisodeBundle,
  onAddScene,
  onUpdateScene,
  onDeleteScene,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onDeleteShot,
  onGenerateEpisodeShots,
  episodeGenerationStatus,
  onImportCharacters,
  onImportScenes,
}: EpisodeTreeProps) {
  const { t } = useI18n();
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set(["default"]));
  // Collapsed state for extra-character groups
  const [extrasExpanded, setExtrasExpanded] = useState(false);

  // Dialog states
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false);
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState<{ type: "episode" | "scene" | "character" | "shot"; id: string } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "episode" | "scene" | "character" | "shot"; id: string; name: string } | null>(null);
  const [targetEpisodeId, setTargetEpisodeId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Create a default episode if none exist.
  const episodes = useMemo(() => {
    if (!scriptData) return [];
    if (scriptData.episodes && scriptData.episodes.length > 0) {
      return scriptData.episodes;
    }
    // Default single episode
    return [{
      id: "default",
      index: 1,
      title: t("overview.episode", { index: 1 }),
      sceneIds: scriptData.scenes.map((s) => s.id),
    }];
  }, [scriptData, t]);

  const toggleEpisode = (id: string) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getEpisodeTitle = (episode: Episode) =>
    /^Imported Prompts(?:\s+\d+)?$/i.test(episode.title)
      ? t("overview.episode", { index: episode.index })
      : episode.title;

  // CRUD handlers
  const handleEditEpisode = (ep: Episode) => {
    setEditingItem({ type: "episode", id: ep.id });
    setFormData({ title: getEpisodeTitle(ep), description: ep.description || "" });
    setEpisodeDialogOpen(true);
  };

  const handleSaveEpisode = () => {
    if (editingItem?.type === "episode") {
      const ep = episodes.find(e => e.id === editingItem.id);
      if (ep) {
        onUpdateEpisodeBundle?.(ep.index, { title: formData.title, synopsis: formData.description });
      }
    }
    setEpisodeDialogOpen(false);
    setFormData({});
  };

  const handleAddScene = (episodeId: string) => {
    setEditingItem(null);
    setTargetEpisodeId(episodeId);
    setFormData({ name: "", description: "", scenePrompt: "" });
    setSceneDialogOpen(true);
  };

  const handleSaveScene = () => {
    if (editingItem?.type === "scene") {
      onUpdateScene?.(editingItem.id, {
        name: formData.name,
        description: formData.description,
        scenePrompt: formData.scenePrompt,
      });
    } else {
      const newScene: ScriptScene = {
        id: `scene_${Date.now()}`,
        name: formData.name || "New Scene",
        description: formData.description,
        time: "day",
        atmosphere: "neutral",
        scenePrompt: formData.scenePrompt,
      };
      onAddScene?.(newScene, targetEpisodeId || undefined);
    }
    setSceneDialogOpen(false);
    setFormData({});
    setTargetEpisodeId(null);
  };

  const handleAddCharacter = () => {
    setEditingItem(null);
    setFormData({ name: "", appearance: "" });
    setCharacterDialogOpen(true);
  };

  const handleEditCharacter = (char: ScriptCharacter) => {
    setEditingItem({ type: "character", id: char.id });
    setFormData({ name: char.name, appearance: char.characterPrompt || char.appearance || "" });
    setCharacterDialogOpen(true);
  };

  const handleSaveCharacter = () => {
    if (editingItem?.type === "character") {
      onUpdateCharacter?.(editingItem.id, { name: formData.name, characterPrompt: formData.appearance, appearance: formData.appearance });
    } else {
      const newChar: ScriptCharacter = {
        id: `char_${Date.now()}`,
        name: formData.name || "New Character",
        appearance: formData.appearance,
        characterPrompt: formData.appearance,
      };
      onAddCharacter?.(newChar);
    }
    setCharacterDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (type: "episode" | "scene" | "character" | "shot", id: string, name: string) => {
    setDeleteItem({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    switch (deleteItem.type) {
      case "episode": {
        const ep = episodes.find(e => e.id === deleteItem.id);
        if (ep) onDeleteEpisodeBundle?.(ep.index);
        break;
      }
      case "scene":
        onDeleteScene?.(deleteItem.id);
        break;
      case "character":
        onDeleteCharacter?.(deleteItem.id);
        break;
      case "shot":
        onDeleteShot?.(deleteItem.id);
        break;
    }
    setDeleteDialogOpen(false);
    setDeleteItem(null);
  };

  // Compute overall progress
  const overallProgress = useMemo(() => {
    if (!scriptData) return '0/0';
    return calculateProgress(
      shots.map((s) => ({ status: getShotCompletionStatus(s) }))
    );
  }, [shots, scriptData]);

  if (!scriptData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        {t("episodeTree.structureAfterParse")}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b">
        <div className="flex items-center justify-end">
          <span className="text-xs text-muted-foreground">
            {t("episodeTree.progress", { value: overallProgress })}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 pb-20 space-y-1">
          {/* Episode list */}
          {episodes.map((episode) => {
            const episodeScenes = scriptData.scenes.filter((s) =>
              episode.sceneIds.includes(s.id)
            );
            const episodeShots = shots.filter((shot) =>
              shot.episodeId === episode.id || episodeScenes.some((s) => s.id === shot.sceneRefId)
            );
            return (
              <div key={episode.id} className="space-y-0.5">
                {/* Episode title */}
                <div className="flex items-center group">
                  <button
                    onClick={() => toggleEpisode(episode.id)}
                    className={cn(
                      "flex-1 min-w-0 flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted text-left overflow-hidden",
                      selectedItemId === `episode_${episode.index}` &&
                        selectedItemType === "episode" &&
                        "bg-primary/10"
                    )}
                  >
                    {expandedEpisodes.has(episode.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <Film className="h-3 w-3 text-primary" />
                    <span 
                      className="text-sm font-medium flex-1 truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectItem(`episode_${episode.index}`, "episode");
                      }}
                    >
                      {getEpisodeTitle(episode)}
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onGenerateEpisodeShots && (
                        <DropdownMenuItem
                          onClick={() => onGenerateEpisodeShots(episode.index)}
                          disabled={episodeGenerationStatus?.[episode.index] === 'generating'}
                        >
                          {episodeGenerationStatus?.[episode.index] === 'generating' ? (
                            <><Loader2 className="h-3 w-3 mr-2 animate-spin" />{t("episodeTree.generating")}</>
                          ) : episodeGenerationStatus?.[episode.index] === 'completed' ? (
                            <><RefreshCw className="h-3 w-3 mr-2" />{t("episodeTree.refreshShots")}</>
                          ) : (
                            <><Wand2 className="h-3 w-3 mr-2" />{t("episodeTree.generateShots")}</>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleAddScene(episode.id)}>
                        <Plus className="h-3 w-3 mr-2" />{t("episodeTree.newScene")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditEpisode(episode)}>
                        <Pencil className="h-3 w-3 mr-2" />{t("episodeTree.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete("episode", episode.id, getEpisodeTitle(episode))}>
                        <Trash2 className="h-3 w-3 mr-2" />{t("dashboard.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Shot list */}
                {expandedEpisodes.has(episode.id) && (
                  <div className="ml-4 space-y-0.5">
                    {onImportScenes && episodeScenes.length > 0 && (
                      <div className="flex justify-end px-2 py-1">
                        <Button size="sm" variant="ghost" className="h-5 text-xs px-1" onClick={() => onImportScenes()}>
                          {t("property.importSceneLibrary")}
                        </Button>
                      </div>
                    )}
                    {episodeShots.map((shot) => {
                      const scene = scriptData.scenes.find((item) => item.id === shot.sceneRefId);
                      const shotDuration = normalizeVideoLength(shot.videoLength);
                      return (
                        <div key={shot.id} className="flex items-center group">
                          <button
                            onClick={() => onSelectItem(shot.id, "shot")}
                            className={cn(
                              "flex-1 px-2 py-1 rounded hover:bg-muted text-left",
                              selectedItemId === shot.id && selectedItemType === "shot" && "bg-primary/10"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground w-5">
                                {String(shot.index).padStart(2, "0")}
                              </span>
                              {scene && (
                                <span className="inline-flex max-w-[120px] items-center gap-1 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600 dark:text-blue-300">
                                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{scene.name || t("scenes.untitled")}</span>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                <Clock className="h-2.5 w-2.5" />
                                {shotDuration}s
                              </span>
                              <span className="flex-1" />
                            </div>
                            {(shot.imagePrompt || shot.videoPrompt || shot.voiceOver) ? (
                              <div className="mt-1 pl-7 space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  <PromptStatusPill label={t("promptStatus.image")} status={getPromptTargetStatus(shot, 'imagePrompt')} />
                                  <PromptStatusPill label={t("promptStatus.video")} status={getPromptTargetStatus(shot, 'videoPrompt')} />
                                  {scene?.scenePrompt && <PromptStatusPill label="Scene" status="ready" />}
                                </div>
                                {scene?.scenePrompt && (
                                  <div className="text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-300 line-clamp-2">
                                    <span className="font-medium">Scene Prompt:</span> {scene.scenePrompt}
                                  </div>
                                )}
                                {shot.imagePrompt && (
                                  <div className="text-[10px] leading-relaxed text-violet-700 dark:text-violet-300 line-clamp-2">
                                    <span className="font-medium">Image Prompt:</span> {shot.imagePrompt}
                                  </div>
                                )}
                                {shot.videoPrompt && (
                                  <div className="text-[10px] leading-relaxed text-blue-700 dark:text-blue-300 line-clamp-2">
                                    <span className="font-medium">Video Prompt:</span> {shot.videoPrompt}
                                  </div>
                                )}
                                {shot.voiceOver && (
                                  <div className="text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-300 line-clamp-2">
                                    <span className="font-medium">Voice Over:</span> {shot.voiceOver}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 pl-7 text-[10px] text-amber-600 dark:text-amber-300">
                                Structure ready. Prompts not generated yet.
                              </div>
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete("shot", shot.id, `Shot ${shot.index}`);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Character list, split into main and extra/supporting groups */}
          {(() => {
            // Deduplicate characters.
            const seenIds = new Set<string>();
            const allCharacters = scriptData.characters
              .filter(c => {
                if (seenIds.has(c.id)) return false;
                seenIds.add(c.id);
                return true;
              });
            
            // Without legacy character tags, treat the deduplicated list as the main list.
            const mainCharacters = allCharacters;
            const extraCharacters: ScriptCharacter[] = [];
            
            const renderCharacterItem = (char: ScriptCharacter) => (
              <div key={char.id} className="flex items-center group">
                <button
                  onClick={() => onSelectItem(char.id, "character")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted",
                    selectedItemId === char.id &&
                      selectedItemType === "character" &&
                      "bg-primary/10"
                  )}
                >
                  <StatusIcon status={char.status} />
                  {char.name}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditCharacter(char)}>
                      <Pencil className="h-3 w-3 mr-2" />{t("episodeTree.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete("character", char.id, char.name)}>
                      <Trash2 className="h-3 w-3 mr-2" />{t("dashboard.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
            
            return (
              <>
                {/* Main character group */}
                <div className="mt-4 pt-4 border-t">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                       {t("overview.characters", { count: mainCharacters.length })}
                    </div>
                    <div className="flex items-center gap-1">
                      {onImportCharacters && (
                        <Button size="sm" variant="ghost" className="h-5 text-xs px-1" onClick={onImportCharacters}>
                          {t("property.importCharacterLibrary")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-5 text-xs px-1" onClick={handleAddCharacter}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 px-2 mt-1">
                    {mainCharacters.map(renderCharacterItem)}
                  </div>
                </div>
                
                {/* Extras/supporting group, collapsible */}
                {extraCharacters.length > 0 && (
                  <div className="mt-2 border-t border-dashed pt-2">
                    <button
                      onClick={() => setExtrasExpanded(!extrasExpanded)}
                      className="w-full px-2 py-1 text-xs text-muted-foreground flex items-center justify-between hover:bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-1">
                        {extrasExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <span>{t("episodeTree.extras", { count: extraCharacters.length })}</span>
                      </div>
                    </button>
                    {extrasExpanded && (
                      <div className="flex flex-wrap gap-1 px-2 mt-1">
                        {extraCharacters.map(renderCharacterItem)}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </ScrollArea>

      {/* Episode Dialog */}
      <Dialog open={episodeDialogOpen} onOpenChange={setEpisodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("episodeTree.editEpisode")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("episodeTree.title")}</Label>
              <Input value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("episodeTree.description")}</Label>
              <Input value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEpisodeDialogOpen(false)}>{t("episodeTree.cancel")}</Button>
            <Button onClick={handleSaveEpisode}>{t("characters.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scene dialog */}
      <Dialog open={sceneDialogOpen} onOpenChange={setSceneDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem?.type === "scene" ? (
                <><Pencil className="h-4 w-4" />{t("episodeTree.editScene")}</>
              ) : (
                <><Plus className="h-4 w-4 text-primary" />{t("episodeTree.newScene")}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("episodeTree.sceneName")}</Label>
              <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("scenes.description")}</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("scenes.descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt cảnh</Label>
              <Input value={formData.scenePrompt || ""} onChange={(e) => setFormData({ ...formData, scenePrompt: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSceneDialogOpen(false)}>{t("episodeTree.cancel")}</Button>
              <Button onClick={handleSaveScene}>{editingItem?.type === "scene" ? t("characters.save") : t("episodeTree.confirmAdd")}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Character dialog */}
      <Dialog open={characterDialogOpen} onOpenChange={setCharacterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem?.type === "character" ? (
                <><Pencil className="h-4 w-4" />{t("episodeTree.editCharacter")}</>
              ) : (
                <><Plus className="h-4 w-4 text-primary" />{t("episodeTree.addCharacter")}</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("episodeTree.characterName")}</Label>
              <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prompt tạo nhân vật</Label>
              <Input value={formData.appearance || ""} onChange={(e) => setFormData({ ...formData, appearance: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCharacterDialogOpen(false)}>{t("episodeTree.cancel")}</Button>
              <Button onClick={handleSaveCharacter}>{editingItem?.type === "character" ? t("characters.save") : t("episodeTree.confirmAdd")}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("episodeTree.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
              {deleteItem?.type === "episode" && "\nDeleting an episode will also delete all scenes and shots inside it."}
              {deleteItem?.type === "scene" && "\nDeleting a scene will also delete all shots inside it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("episodeTree.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">{t("dashboard.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
