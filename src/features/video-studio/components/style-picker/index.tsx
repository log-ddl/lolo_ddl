"use client";

/**
 * StylePicker - unified visual style picker.
 *
 * Features:
 * - Left side: scrollable categorized style list
 * - Right side: large preview and description on hover/selection
 * - Supports both popover and inline modes
 */

import React, { useState, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  STYLE_CATEGORIES,
  VISUAL_STYLE_PRESETS,
  getStyleById,
  type StylePreset,
  type VisualStyleId,
} from "@/features/video-studio/lib/constants/visual-styles";
import { useCustomStyleStore } from "@/features/video-studio/stores/custom-style-store";
import { useI18n } from "@/shared/i18n";

// Background colors for style categories after image thumbnails were removed.
const CATEGORY_COLORS: Record<string, string> = {
  'none': 'bg-muted text-muted-foreground',
  '3d': 'bg-blue-500/20 text-blue-600',
  '2d': 'bg-green-500/20 text-green-600',
  'real': 'bg-amber-500/20 text-amber-600',
  'stop_motion': 'bg-purple-500/20 text-purple-600',
};

interface StylePickerProps {
  /** Currently selected style ID. */
  value: string;
  /** Called when the selection changes. */
  onChange: (styleId: VisualStyleId) => void;
  /** Whether to use popover mode. Defaults to true. */
  popover?: boolean;
  /** Custom trigger, used only in popover mode. */
  trigger?: React.ReactNode;
  /** Custom class name. */
  className?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** Placeholder text when nothing is selected. */
  placeholder?: string;
}

/**
 * Style picker component.
 */
export function StylePicker({
  value,
  onChange,
  popover = true,
  trigger,
  className,
  disabled = false,
  placeholder,
}: StylePickerProps) {
  const [hoveredStyle, setHoveredStyle] = useState<StylePreset | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [styleName, setStyleName] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder || t("stylePicker.placeholder");

  // User-defined styles stored in localStorage.
  const customStyles = useCustomStyleStore((s) => s.styles);
  const addStyle = useCustomStyleStore((s) => s.addStyle);
  const updateStyle = useCustomStyleStore((s) => s.updateStyle);
  const deleteStyle = useCustomStyleStore((s) => s.deleteStyle);
  const customAsPresets: StylePreset[] = useMemo(() =>
    customStyles
      .map((style) => getStyleById(style.id))
      .filter((style): style is StylePreset => Boolean(style)),
    [customStyles]
  );

  // Resolve the selected style from built-in and custom sources.
  const selectedStyle = useMemo(() => getStyleById(value), [value, customStyles]);

  // Hovered style takes priority in the preview; otherwise show the selected style.
  const previewStyle = hoveredStyle || selectedStyle || VISUAL_STYLE_PRESETS[0];
  const isCustomPreview = previewStyle.id.startsWith('custom_style_');

  // Handle style selection.
  const handleSelect = (style: StylePreset) => {
    onChange(style.id as VisualStyleId);
    if (popover) {
      setIsOpen(false);
    }
  };

  const openStyleEditor = (styleId?: string) => {
    const style = styleId ? customStyles.find((item) => item.id === styleId) : undefined;
    setEditingStyleId(style?.id || null);
    setStyleName(style?.name || "");
    setStylePrompt(style?.prompt || "");
    setNegativePrompt(style?.negativePrompt || "");
    setIsOpen(false);
    setEditorOpen(true);
  };

  const handleSaveStyle = () => {
    const name = styleName.trim();
    const prompt = stylePrompt.trim();
    if (!name || !prompt) return;

    if (editingStyleId) {
      updateStyle(editingStyleId, {
        name,
        prompt,
        negativePrompt: negativePrompt.trim(),
      });
      onChange(editingStyleId as VisualStyleId);
    } else {
      const newId = addStyle({
        name,
        prompt,
        negativePrompt: negativePrompt.trim(),
        description: "",
        referenceImages: [],
        tags: [],
        folderId: null,
        styleTokens: "",
        sceneTokens: "",
      });
      onChange(newId as VisualStyleId);
    }
    setEditorOpen(false);
  };

  const requestDeleteStyle = (styleId: string) => {
    setIsOpen(false);
    setDeleteTargetId(styleId);
  };

  const handleDeleteStyle = () => {
    if (!deleteTargetId) return;
    deleteStyle(deleteTargetId);
    if (value === deleteTargetId) onChange("none" as VisualStyleId);
    setDeleteTargetId(null);
  };

  // Picker content panel.
  const pickerContent = (
    <div className={cn("flex", popover ? "w-[520px] h-[400px]" : "w-full h-full", className)}>
      {/* Left: style list */}
      <ScrollArea className="w-[240px] border-r border-border">
        <div className="p-2">
          {STYLE_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-4">
              {/* Category heading */}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/60 mb-2">
                {category.name}
              </div>
              {/* Style list */}
              <div className="space-y-1">
                {category.styles.map((style) => (
                  <StyleItem
                    key={style.id}
                    style={style}
                    isSelected={value === style.id}
                    onSelect={() => handleSelect(style)}
                    onHover={() => setHoveredStyle(style)}
                    onLeave={() => setHoveredStyle(null)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* User custom styles */}
          <div className="mb-4">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-primary/30 mb-2">
                <span className="text-xs font-medium text-primary">{t("stylePicker.myStyles")}</span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-2xs text-primary hover:opacity-70"
                  onClick={() => openStyleEditor()}
                >
                  <Plus className="h-3 w-3" />
                  {t("stylePicker.addStyle")}
                </button>
              </div>
              {customAsPresets.length > 0 && (
              <div className="space-y-1">
                {customAsPresets.map((style) => (
                  <StyleItem
                    key={style.id}
                    style={style}
                    isSelected={value === style.id}
                    isCustom
                    onSelect={() => handleSelect(style)}
                    onHover={() => setHoveredStyle(style)}
                    onLeave={() => setHoveredStyle(null)}
                    onEdit={() => openStyleEditor(style.id)}
                    onDelete={() => requestDeleteStyle(style.id)}
                  />
                ))}
              </div>
              )}
            </div>
        </div>
      </ScrollArea>

      {/* Right: preview details */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Color block placeholder plus style name */}
        <div className={cn(
          "flex-1 flex flex-col items-center justify-center rounded-lg mb-3",
          isCustomPreview
            ? 'bg-primary/10 text-primary'
            : CATEGORY_COLORS[previewStyle.category] || 'bg-muted/30'
        )}>
          <div className="text-2xl font-bold mb-2">{previewStyle.name}</div>
          <div className="max-w-[220px] text-center text-xs opacity-70 line-clamp-3">
            {isCustomPreview
              ? previewStyle.prompt
              : `${previewStyle.category.toUpperCase()} · ${previewStyle.mediaType}`}
          </div>
        </div>
        {/* Style details */}
        <div className="text-center">
          <div className="font-medium text-sm mb-1">{previewStyle.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {previewStyle.description}
          </div>
        </div>
      </div>
    </div>
  );

  // Popover mode.
  if (popover) {
    return (
      <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {trigger || (
            <button
              className={cn(
                // h-9 to match Input/SelectTrigger — the category chip inside
                // used to push this trigger taller than its neighbours.
                "flex h-9 items-center gap-2 px-3 rounded-lg border border-input bg-background",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-sm w-full justify-between"
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {selectedStyle && (
                  <span className={cn(
                    "w-5 h-5 shrink-0 rounded flex items-center justify-center text-2xs font-bold",
                    selectedStyle.id.startsWith('custom_style_')
                      ? 'bg-primary/20 text-primary'
                      : CATEGORY_COLORS[selectedStyle.category] || 'bg-muted'
                  )}>
                    {selectedStyle.id.startsWith('custom_style_') ? '★' : selectedStyle.category === 'none' ? 'NO' : selectedStyle.category === '3d' ? '3D' : selectedStyle.category === '2d' ? '2D' : selectedStyle.category === 'real' ? t("stylePicker.category.real") : t("stylePicker.category.stopMotion")}
                  </span>
                )}
                <span className={!selectedStyle ? "text-muted-foreground" : ""}>
                  {selectedStyle?.name || resolvedPlaceholder}
                </span>
              </div>
              <svg
                className="w-4 h-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-auto"
          align="start"
          sideOffset={4}
        >
          {pickerContent}
        </PopoverContent>
      </Popover>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStyleId ? t("stylePicker.editStyle") : t("stylePicker.addStyle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="custom-style-name">{t("stylePicker.styleName")}</Label>
              <Input
                id="custom-style-name"
                value={styleName}
                onChange={(event) => setStyleName(event.target.value)}
                placeholder={t("stylePicker.styleNamePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-style-prompt">{t("stylePicker.prompt")}</Label>
              <Textarea
                id="custom-style-prompt"
                value={stylePrompt}
                onChange={(event) => setStylePrompt(event.target.value)}
                placeholder={t("stylePicker.promptPlaceholder")}
                rows={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-style-negative">{t("stylePicker.negativePrompt")}</Label>
              <Textarea
                id="custom-style-negative"
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                placeholder={t("stylePicker.negativePromptPlaceholder")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSaveStyle}
              disabled={!styleName.trim() || !stylePrompt.trim()}
            >
              {t("stylePicker.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("stylePicker.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("stylePicker.deleteDescription", {
                name: customStyles.find((style) => style.id === deleteTargetId)?.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStyle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
    );
  }

  // Inline mode.
  return pickerContent;
}

/**
 * Single style item.
 */
interface StyleItemProps {
  style: StylePreset;
  isSelected: boolean;
  isCustom?: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function StyleItem({ style, isSelected, isCustom, onSelect, onHover, onLeave, onEdit, onDelete }: StyleItemProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "group w-full flex items-center gap-1 rounded-lg transition-colors",
        "hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <button type="button" className="min-w-0 flex flex-1 items-center gap-2 px-2 py-1.5" onClick={onSelect}>
      {/* Color block placeholder */}
      <span className={cn(
        "w-10 h-10 rounded flex items-center justify-center text-2xs font-bold flex-shrink-0",
        isCustom ? 'bg-primary/20 text-primary' : CATEGORY_COLORS[style.category] || 'bg-muted'
      )}>
        {isCustom ? '★' : style.category === 'none' ? 'NO' : style.category === '3d' ? '3D' : style.category === '2d' ? '2D' : style.category === 'real' ? t("stylePicker.category.real") : t("stylePicker.category.stopMotion")}
      </span>
      {/* Name */}
      <span className="flex-1 text-left text-sm truncate">{style.name}</span>
      {/* Selected marker */}
      {isSelected && (
        <Check className="w-4 h-4 text-primary flex-shrink-0" />
      )}
      </button>
      {isCustom && (
        <div className="flex pr-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button type="button" className="rounded p-1 text-muted-foreground hover:text-foreground" onClick={onEdit} title={t("common.edit")}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1 text-muted-foreground hover:text-destructive" onClick={onDelete} title={t("dashboard.delete")}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default StylePicker;
