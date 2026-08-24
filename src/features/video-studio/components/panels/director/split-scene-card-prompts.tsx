"use client";

import { cn } from "@/shared/lib/utils";
import type { Translate } from "@/shared/i18n";
import type { SplitScene } from "@/features/video-studio/stores/director-store";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Check, ChevronRight, Edit3, ImageIcon, Play, X } from "lucide-react";
import { Label } from "@/shared/components/ui/label";

/**
 * Third row of a split scene card: the collapsible prompt panel holding the
 * start-frame prompt and the video prompt, each with inline editing and a
 * preview of the prompt as it will actually be sent (identity lock + style).
 */

export interface SplitSceneCardPromptsProps {
  scene: SplitScene;
  showPromptDetails: boolean;
  setShowPromptDetails: (value: boolean) => void;
  editingPrompt: "none" | "image" | "video";
  editPromptValue: string;
  setEditPromptValue: (value: string) => void;
  isRefToVideo: boolean;
  isGeneratingAny?: boolean;
  buildResolvedPromptPreview: (prompt: string | undefined) => string;
  buildResolvedImagePromptPreview: (prompt: string | undefined) => string;
  startEditing: (type: "image" | "video") => void;
  handleSavePrompt: () => void;
  handleCancelEdit: () => void;
  t: Translate;
}

export function SplitSceneCardPrompts(props: SplitSceneCardPromptsProps) {
  const {
    scene, showPromptDetails, setShowPromptDetails, editingPrompt,
    editPromptValue, setEditPromptValue, isRefToVideo, isGeneratingAny,
    buildResolvedPromptPreview, buildResolvedImagePromptPreview, startEditing,
    handleSavePrompt, handleCancelEdit, t,
  } = props;

  return (
    <>
        {/* Row 3: prompt system */}
        <div className="space-y-1">
          {/* Collapse/expand header: chevron, title, and completion badges */}
          <button
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 border hover:bg-muted/70 transition-colors"
          >
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200", showPromptDetails && "rotate-90")} />
            <span className="text-xs font-medium">{t("director.card.prompts")}</span>
            {/* Completion status badges */}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
              {!isRefToVideo && (
                <span className={cn(
                  "text-2xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 border",
                  scene.imagePrompt
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : "bg-muted text-muted-foreground/40 border-transparent"
                )}>
                  <ImageIcon className="h-2.5 w-2.5" /> {t("director.card.startFrame")}
                </span>
              )}
              <span className={cn(
                "text-2xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 border",
                scene.videoPrompt
                  ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20"
                  : "bg-muted text-muted-foreground/40 border-transparent"
              )}>
                <Play className="h-2.5 w-2.5" /> {t("director.card.video")}
              </span>
            </div>
          </button>

          {showPromptDetails ? (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 pl-1">
              {/* Start-frame prompt - blue section (hidden in ref-to-video mode) */}
              {!isRefToVideo && <div className="border-l-[3px] border-blue-500 pl-3 py-1 space-y-1">
                <Label className="text-2xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                  <ImageIcon className="h-3 w-3" />
                  {t("director.card.startFramePrompt")}
                </Label>
                {editingPrompt === 'image' ? (
                  <>
                    <Textarea
                      value={editPromptValue}
                      onChange={(e) => setEditPromptValue(e.target.value)}
                      className="min-h-[150px] text-xs resize-none border-blue-500/30 focus-visible:ring-blue-500/30"
                      placeholder={t("director.card.startFramePlaceholder")}
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end mt-1">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-5 px-2 text-2xs">
                        <X className="h-2.5 w-2.5 mr-0.5" />{t("director.cancel")}
                      </Button>
                      <Button size="sm" onClick={handleSavePrompt} className="h-5 px-2 text-2xs">
                        <Check className="h-2.5 w-2.5 mr-0.5" />{t("director.save")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div
                      className="flex items-start gap-2 cursor-pointer p-1.5 rounded bg-blue-500/5 hover:bg-blue-500/10 transition-colors border border-blue-500/10"
                      onClick={() => !isGeneratingAny && startEditing('image')}
                    >
                      <p className="text-2xs text-muted-foreground flex-1 line-clamp-6 min-h-[4.5em]">
                        {scene.imagePrompt || t("director.card.startFramePlaceholder")}
                      </p>
                      {!isGeneratingAny && <Edit3 className="h-2.5 w-2.5 text-blue-500/50 shrink-0 mt-0.5" />}
                    </div>
                    {scene.imagePrompt && (
                      <div className="rounded border border-blue-500/15 bg-background/60 p-2">
                        <div className="mb-1 text-2xs font-medium text-blue-600 dark:text-blue-400">Prompt gửi đi</div>
                        <pre className="max-h-32 whitespace-pre-wrap overflow-y-auto text-2xs leading-relaxed text-muted-foreground">
                          {buildResolvedImagePromptPreview(scene.imagePrompt)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>}

              {/* Video prompt - green section */}
              <div className="border-l-[3px] border-green-500 pl-3 py-1 space-y-1.5">
                <Label className="text-2xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                  <Play className="h-3 w-3" />
                  {t("director.card.videoPrompt")}
                </Label>
                {/* Video prompt text */}
                {editingPrompt === 'video' ? (
                  <>
                    <Textarea
                      value={editPromptValue}
                      onChange={(e) => setEditPromptValue(e.target.value)}
                      className="min-h-[150px] text-xs resize-none border-green-500/30 focus-visible:ring-green-500/30"
                      placeholder={t("director.card.videoPlaceholder")}
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end mt-1">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} className="h-5 px-2 text-2xs">
                        <X className="h-2.5 w-2.5 mr-0.5" />{t("director.cancel")}
                      </Button>
                      <Button size="sm" onClick={handleSavePrompt} className="h-5 px-2 text-2xs">
                        <Check className="h-2.5 w-2.5 mr-0.5" />{t("director.save")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div
                      className="flex items-start gap-2 cursor-pointer p-1.5 rounded bg-green-500/5 hover:bg-green-500/10 transition-colors border border-green-500/10"
                      onClick={() => !isGeneratingAny && startEditing('video')}
                    >
                      <p className="text-2xs text-green-600 dark:text-green-400 flex-1 line-clamp-6 min-h-[4.5em]">
                        {scene.videoPrompt || t("director.card.videoPlaceholder")}
                      </p>
                      {!isGeneratingAny && <Edit3 className="h-2.5 w-2.5 text-green-500/50 shrink-0 mt-0.5" />}
                    </div>
                    {scene.videoPrompt && (
                      <div className="rounded border border-green-500/15 bg-background/60 p-2">
                        <div className="mb-1 text-2xs font-medium text-green-600 dark:text-green-400">Prompt gửi đi</div>
                        <pre className="max-h-32 whitespace-pre-wrap overflow-y-auto text-2xs leading-relaxed text-muted-foreground">
                          {buildResolvedPromptPreview(scene.videoPrompt)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed summary view: colored icon labels with content preview */
            <div
              className="space-y-0.5 rounded-lg border border-transparent bg-muted/20 p-1.5 transition-colors hover:border-muted hover:bg-muted/40 cursor-pointer"
              onClick={() => setShowPromptDetails(true)}
            >
              {!isRefToVideo && <p className="text-2xs truncate flex items-center gap-1">
                <span className="shrink-0 inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                  <ImageIcon className="h-2.5 w-2.5" /> {t("director.card.startFrame")}:
                </span>
                <span className="text-muted-foreground">{scene.imagePrompt || t("director.card.unset")}</span>
              </p>}
              <p className="text-2xs truncate flex items-center gap-1">
                <span className="shrink-0 inline-flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium">
                  <Play className="h-2.5 w-2.5" /> {t("director.videoLabel")}:
                </span>
                <span className="text-muted-foreground">
                  {scene.videoPrompt || t("director.card.unset")}
                </span>
              </p>
            </div>
          )}
        </div>
    </>
  );
}
