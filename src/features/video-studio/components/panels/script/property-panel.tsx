"use client";

/**
 * Property Panel Component
 * Right panel: selected item properties, navigation actions, and edit helpers.
 */

import type { ScriptCharacter, ScriptScene, Shot, Episode } from "@/features/video-studio/types/script";
import { getPromptTargetStatus, getShotCompletionStatus } from "@/features/video-studio/lib/script/shot-utils";
import { useActiveScriptProject } from "@/features/video-studio/stores/script-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  User,
  MapPin,
  Film,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Save,
  X,
  Trash2,
  Clapperboard,
  Copy,
  Check,
  Upload,
} from "lucide-react";
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
import { PromptStatusBadge, StatusBadge } from "./property-badges";
import { usePropertyEditing } from "./property/use-property-editing";

interface EpisodeDetail extends Episode {
  synopsis?: string;
  keyEvents?: string[];
  scenes: Array<{ sceneHeader: string; characters: string[] }>;
  shotGenerationStatus: 'idle' | 'generating' | 'completed' | 'error';
}

interface PropertyPanelProps {
  selectedItemId: string | null;
  selectedItemType: "character" | "scene" | "shot" | "episode" | null;
  character?: ScriptCharacter;
  scene?: ScriptScene;
  shot?: Shot;
  episode?: EpisodeDetail;  // Episode data
  episodeShots?: Shot[];    // All shots in the episode
  sceneShots?: Shot[];      // All shots in the scene (used for multi-view analysis)
  onGoToCharacterLibrary?: (characterId: string) => void;
  onGoToSceneLibrary?: (sceneId: string) => void;
  onImportCharacters?: (initialCharacterId?: string) => void;
  onImportScenes?: (initialSceneId?: string) => void;
  onGoToDirector?: (shotId: string) => void;
  onGoToDirectorFromScene?: (sceneId: string) => void; // Scene-level jump
  onGenerateEpisodeShots?: (episodeIndex: number) => void; // Generate shots
  // Edit callbacks
  onUpdateCharacter?: (id: string, updates: Partial<ScriptCharacter>) => void;
  onUpdateScene?: (id: string, updates: Partial<ScriptScene>) => void;
  onUpdateShot?: (id: string, updates: Partial<Shot>) => void;
  onDeleteCharacter?: (id: string) => void;
  onDeleteScene?: (id: string) => void;
  onDeleteShot?: (id: string) => void;
}

export function PropertyPanel({
  selectedItemId,
  selectedItemType,
  character,
  scene,
  shot,
  episode,
  episodeShots = [],
  sceneShots: _sceneShots = [],
  onGoToCharacterLibrary,
  onGoToSceneLibrary,
  onImportCharacters,
  onImportScenes,
  onGoToDirector,
  onGoToDirectorFromScene,
  onGenerateEpisodeShots,
  onUpdateCharacter,
  onUpdateScene,
  onUpdateShot,
  onDeleteCharacter,
  onDeleteScene,
  onDeleteShot,
}: PropertyPanelProps) {
  const { t } = useI18n();
  const scriptProject = useActiveScriptProject();

  const {
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
  } = usePropertyEditing({
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
  });

  if (!selectedItemId || !selectedItemType) {
    // whitespace-pre-line, not split()+<br/>: this is a flex row, so the split
    // spans sat side by side and the <br/> pushed the second line down inside
    // its own span instead of breaking the sentence.
    return (
      <div className="h-full flex items-center justify-center whitespace-pre-line text-muted-foreground text-sm p-4 text-center">
        {t("property.empty")}
      </div>
    );
  }

  // Episode details
  if (selectedItemType === "episode" && episode) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4 pb-32">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <Clapperboard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{t("property.episode", { index: episode.index })}</h3>
              <p className="text-sm text-muted-foreground">{episode.title.replace(/^\u7b2c\d+\u96c6[\uff1a:]?/, '')}</p>
            </div>
          </div>

          <Separator />

          {/* Scene stats */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-xs text-muted-foreground mb-2">{t("property.sceneStats")}</div>
            <div className="text-sm">
              {t("property.sceneCount", { count: episode.scenes?.length || 0 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("property.shotStatus", { status: episode.shotGenerationStatus === 'completed' ? `✅ ${t("property.shotStatus.completed")}` : 
                episode.shotGenerationStatus === 'generating' ? `⏳ ${t("property.shotStatus.generating")}` : `⏹ ${t("property.shotStatus.idle")}` })}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            {episode.shotGenerationStatus !== 'completed' && (
              <Button
                className="w-full"
                onClick={() => onGenerateEpisodeShots?.(episode.index)}
                disabled={episode.shotGenerationStatus === 'generating'}
              >
                <Film className="h-4 w-4 mr-2" />
                {t("property.generateShots")}
              </Button>
            )}
            {episode.shotGenerationStatus === 'completed' && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyEpisodeShots}
                  disabled={episodeShots.length === 0}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      {t("property.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("property.copyShotData", { count: episodeShots.length })}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Character details
  if (selectedItemType === "character" && character) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4 pb-32">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="h-7 text-sm font-medium"
                />
              ) : (
                <h3 className="font-medium">{character.name}</h3>
              )}
              <StatusBadge status={character.status} />
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={startEditing}>
                <Pencil className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSave}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Properties */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Prompt tạo nhân vật</Label>
                <Textarea value={editData.appearance || ""} onChange={(e) => setEditData({ ...editData, appearance: e.target.value })} className="min-h-[40px]" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(character.characterPrompt || character.appearance) && (
                <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-2 rounded-lg border-l-2 border-purple-500/30">
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Prompt tạo nhân vật</div>
                  <div className="text-xs text-muted-foreground/70 italic">{character.characterPrompt || character.appearance}</div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onImportCharacters?.(character.id)}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {t("property.importCharacterLibrary")}
            </Button>
            {character.characterLibraryId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onGoToCharacterLibrary?.(character.id)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t("property.viewCharacterLibrary")}
              </Button>
            )}
            {((character.referenceImages && character.referenceImages.length > 0) || character.thumbnailUrl) && (
              <div className="space-y-2 rounded-lg border p-2">
                <div className="text-xs text-muted-foreground">{t("characters.referenceImages")}</div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(new Set([...(character.referenceImages || []), ...(character.thumbnailUrl ? [character.thumbnailUrl] : [])])).map((img, index) => (
                    <div key={`${img}-${index}`} className="relative group">
                      <img src={img} alt={character.name} className="h-14 w-14 rounded border object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveCharacterImage(img)}
                        className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <input
                id="script-character-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadCharacterImage}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('script-character-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("director.card.upload")}
              </Button>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyCharacterData}
            >
              {copiedCharacter ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {t("property.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t("property.copyCharacterData")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("property.deleteCharacter")}
            </Button>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("property.confirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>{t("property.confirmDeleteCharacter", { name: character.name })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("dashboard.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ScrollArea>
    );
  }

  // Scene details
  if (selectedItemType === "scene" && scene) {
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4 pb-32">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="h-7 text-sm font-medium"
                />
              ) : (
                <h3 className="font-medium">{scene.name || t("scenes.untitled")}</h3>
              )}
              <StatusBadge status={scene.status} />
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={startEditing}>
                <Pencil className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSave}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Properties */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("scenes.description")}</Label>
                <Textarea
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder={t("scenes.descriptionPlaceholder")}
                  className="min-h-[70px] text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("property.scenePrompt")}</Label>
                <Textarea value={editData.scenePrompt || ""} onChange={(e) => setEditData({ ...editData, scenePrompt: e.target.value })} className="min-h-[90px] text-xs" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="text-xs font-semibold text-primary">{t("scenes.description")}</div>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {scene.description || t("scenes.noDescription")}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-primary">Prompt cảnh</div>
                  {scene.scenePrompt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Đã gen
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-2xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">Chưa có</span>
                  )}
                </div>
                {scene.scenePrompt ? (
                  <div className="text-sm leading-relaxed text-muted-foreground italic">
                    {scene.scenePrompt}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Cảnh này chưa có prompt cảnh. Import lại hoặc chạy lại bước chia kịch bản để tạo prompt cảnh.
                  </div>
                )}
              </div>

              {/* Multi-View Contact Sheet hidden — not used by current AI pipeline */}
              
              {/* Appearance stats */}
              {(scene.appearanceCount || scene.episodeNumbers?.length) && (
                <>
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {scene.importance && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        scene.importance === 'main' ? 'bg-primary/10 text-primary' :
                        scene.importance === 'secondary' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {scene.importance === 'main' ? t("property.mainScene") : scene.importance === 'secondary' ? t("property.secondaryScene") : t("property.transitionScene")}
                      </span>
                    )}
                    {scene.appearanceCount && (
                      <span className="text-xs text-muted-foreground">{t("property.appearsCount", { count: scene.appearanceCount })}</span>
                    )}
                    {scene.episodeNumbers && scene.episodeNumbers.length > 0 && (
                      <span className="text-xs text-muted-foreground">{t("property.appearsEpisodes", { episodes: scene.episodeNumbers.join(', ') })}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onImportScenes?.(scene.id)}
              disabled={!!scene.sceneLibraryId}
            >
              {scene.sceneLibraryId ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {scene.sceneLibraryId ? "Đã import vào Scene Library" : t("property.importSceneLibrary")}
            </Button>
            {scene.sceneLibraryId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onGoToSceneLibrary?.(scene.id)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {t("property.viewSceneLibrary")}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopySceneData}
            >
              {copiedScene ? (
                <Check className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedScene ? t("property.copied") : t("property.copySceneData")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onGoToDirectorFromScene?.(scene.id)}
            >
              <Film className="h-4 w-4 mr-2" />
              {t("property.goAiDirector")}
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("property.deleteScene")}
            </Button>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("property.confirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>{t("property.confirmDeleteScene", { name: scene.name || t("scenes.untitled") })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("dashboard.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ScrollArea>
    );
  }

  // Shot details
  if (selectedItemType === "shot" && shot) {
    const shotStatus = getShotCompletionStatus(shot);
    const linkedScene = scriptProject?.scriptData?.scenes.find((item) => item.id === shot.sceneRefId);
    const isExplainerWorkflow = false;
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4 pb-32">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{t("property.shot", { index: String(shot.index).padStart(2, "0") })}</h3>
              <StatusBadge status={shotStatus} />
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={startEditing}>
                <Pencil className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSave}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsEditing(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Preview image */}
          {shot.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={shot.imageUrl}
                alt={`Shot ${shot.index}`}
                className="w-full h-auto"
              />
            </div>
          )}

          <Separator />

          {/* Properties */}
          {isEditing ? (
            <div className="space-y-3">
              {!isExplainerWorkflow && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("property.specialTechnique")}</Label>
                    <Input value={editData.specialTechnique || ""} onChange={(e) => setEditData({ ...editData, specialTechnique: e.target.value })} className="h-8 text-xs" />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3" />
          )}

          {/* Image / Video Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {linkedScene?.scenePrompt && <PromptStatusBadge label="Scene Prompt" status="ready" />}
            <PromptStatusBadge label={t("promptStatus.imagePrompt")} status={getPromptTargetStatus(shot, 'imagePrompt')} />
            <PromptStatusBadge label={t("promptStatus.videoPrompt")} status={getPromptTargetStatus(shot, 'videoPrompt')} />
          </div>
          {linkedScene && (
            <div className="space-y-1">
              <div className="text-2xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-500" />
                Scene Reference
              </div>
              <div className="text-2xs leading-relaxed bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 text-blue-800 dark:text-blue-200 break-words">
                <div className="font-medium">{linkedScene.name || t("scenes.untitled")}</div>
                {linkedScene.scenePrompt && (
                  <div className="mt-1 text-emerald-700 dark:text-emerald-300">
                    <span className="font-medium">Scene Prompt:</span> {linkedScene.scenePrompt}
                  </div>
                )}
              </div>
            </div>
          )}
          {!(shot.imagePrompt || shot.videoPrompt) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              {t("scriptInput.step2Incomplete")}
            </div>
          )}
          {(shot.imagePrompt || shot.videoPrompt || shot.voiceOver) && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Director Prompts</div>
              {shot.imagePrompt && (
                <div className="space-y-1">
                  <div className="text-2xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
                    Image Prompt
                  </div>
                  <div className="text-2xs leading-relaxed bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded p-2 text-violet-800 dark:text-violet-200 break-words">
                    {shot.imagePrompt}
                  </div>
                </div>
              )}
              {shot.videoPrompt && (
                <div className="space-y-1">
                  <div className="text-2xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                    Video Prompt
                  </div>
                  <div className="text-2xs leading-relaxed bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 text-blue-800 dark:text-blue-200 break-words">
                    {shot.videoPrompt}
                  </div>
                </div>
              )}
              {shot.voiceOver && (
                <div className="space-y-1">
                  <div className="text-2xs text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                    Voice Over
                  </div>
                  <div className="text-2xs leading-relaxed bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded p-2 text-emerald-800 dark:text-emerald-200 break-words">
                    {shot.voiceOver}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("property.image")}</span>
              <StatusBadge
                status={
                  shot.imageStatus === "completed"
                    ? "completed"
                    : shot.imageStatus === "generating"
                    ? "in_progress"
                    : "pending"
                }
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("property.video")}</span>
              <StatusBadge
                status={
                  shot.videoStatus === "completed"
                    ? "completed"
                    : shot.videoStatus === "generating"
                    ? "in_progress"
                    : "pending"
                }
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onGoToDirector?.(shot.id)}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {t("property.goAiDirectorShort")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCopyShotTriPrompts}
            >
              {copiedShotPrompts ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {t("property.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t("property.copyThreeLayerPrompts")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("property.deleteShot")}
            </Button>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("property.confirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>{t("property.confirmDeleteShot", { index: shot.index })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t("dashboard.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ScrollArea>
    );
  }

  return null;
}
