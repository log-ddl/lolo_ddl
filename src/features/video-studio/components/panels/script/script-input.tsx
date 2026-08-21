
"use client";

/**
 * Script Input Component
 * Left panel: screenplay import and analysis.
 */

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import {
  Loader2,
  AlertCircle,
  Palette,
  Upload,
  Save,
  Trash2,
  Wand2,
  Square,
} from "lucide-react";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { useI18n } from "@/shared/i18n";
import { useScriptSkillStore } from "@/features/video-studio/stores/script-skill-store";
import {
  MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
  MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
  normalizeLongScriptSkillWordThreshold,
  useVideoStudioSettingsStore,
} from "@/features/video-studio/stores/video-studio-settings-store";
import { normalizeScriptSkillMeta } from "@/features/video-studio/lib/script/script-skill-validation";
import { toast } from "sonner";

interface ScriptInputProps {
  rawScript: string;
  styleId: string;
  parseStatus: "idle" | "parsing" | "ready" | "error";
  parseError?: string;
  chatConfigured: boolean;
  onRawScriptChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onImportWithSkill?: (text: string, skillText: string) => Promise<void>;
  onCancelImport?: () => void;
  importStatus?: 'idle' | 'importing' | 'ready' | 'error';
  importError?: string;
  calibrationStatus?: 'idle' | 'calibrating' | 'completed' | 'error';
  cliStreamTitle?: string | null;
  cliStreamOutput?: string;
}

export function ScriptInput({
  rawScript,
  styleId,
  parseStatus,
  parseError,
  chatConfigured,
  onRawScriptChange,
  onStyleChange,
  onImportWithSkill,
  onCancelImport,
  importStatus,
  importError,
  calibrationStatus,
  cliStreamTitle,
  cliStreamOutput,
}: ScriptInputProps) {
  const { t } = useI18n();
  const [isImporting, setIsImporting] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillText, setSkillText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const skills = useScriptSkillStore((state) => state.skills);
  const selectedSkillId = useScriptSkillStore((state) => state.selectedSkillId);
  const addSkill = useScriptSkillStore((state) => state.addSkill);
  const updateSkill = useScriptSkillStore((state) => state.updateSkill);
  const deleteSkill = useScriptSkillStore((state) => state.deleteSkill);
  const selectSkill = useScriptSkillStore((state) => state.selectSkill);
  const longScriptSkillWordThreshold = useVideoStudioSettingsStore((state) => state.scriptImport.longScriptSkillWordThreshold);
  const setScriptImport = useVideoStudioSettingsStore((state) => state.setScriptImport);
  const skillMeta = normalizeScriptSkillMeta(extractSkillMetadata(skillText));
  const normalizedRawScript = normalizeScriptInput(rawScript);
  const rawScriptStats = getScriptInputStats(normalizedRawScript);

  // The selected ID is persisted by Zustand, while the editable fields are local
  // component state. Hydrate those fields when the app reopens or the stored skill
  // changes; Select does not fire onValueChange for an already-selected value.
  useEffect(() => {
    if (!selectedSkillId) {
      setSkillName("");
      setSkillText("");
      return;
    }

    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
    if (!selectedSkill) {
      setSkillName("");
      setSkillText("");
      return;
    }

    setSkillName(selectedSkill.name);
    setSkillText(selectedSkill.content);
  }, [selectedSkillId, skills]);

  const handleRawScriptChange = (value: string) => {
    onRawScriptChange(normalizeScriptInput(value));
  };

  const handleImportWithSkill = async () => {
    if (!normalizedRawScript.trim() || !skillText.trim() || !onImportWithSkill) return;
    setIsImporting(true);
    try {
      await onImportWithSkill(normalizedRawScript, skillText);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectSkill = (id: string) => {
    if (id === "none") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }

    const skill = skills.find((item) => item.id === id);
    if (!skill) return;
    selectSkill(id);
    setSkillName(skill.name);
    setSkillText(skill.content);
  };

  const handleSaveSkill = () => {
    const content = skillText.trim();
    if (!content) return;
    const meta = normalizeScriptSkillMeta(extractSkillMetadata(content));
    const name = skillName.trim() || extractSkillName(content) || t("scriptInput.untitledSkill");

    if (selectedSkillId && skills.some((skill) => skill.id === selectedSkillId)) {
      updateSkill(selectedSkillId, { name, content, outputs: meta.outputs, mergeMode: meta.mergeMode });
      toast.success(t("scriptInput.skillUpdated", { name }));
      return;
    }

    addSkill({ name, content, outputs: meta.outputs, mergeMode: meta.mergeMode });
    toast.success(t("scriptInput.skillSaved", { name }));
  };

  const handleDeleteSkill = () => {
    if (!selectedSkillId) return;
    deleteSkill(selectedSkillId);
    setSkillName("");
    setSkillText("");
    toast.success(t("scriptInput.skillDeleted"));
  };

  const handleImportSkillFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || "");
      setSkillText(content);
      setSkillName(extractSkillName(content) || file.name.replace(/\.[^.]+$/, ""));
      selectSkill(null);
      toast.success(t("scriptInput.skillFileImported", { name: file.name }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto p-3 pb-24 space-y-3">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          {t("scriptInput.importLabel")}
        </Label>
        <Textarea
          placeholder={t("scriptInput.importPlaceholder")}
          value={normalizedRawScript}
          onChange={(e) => handleRawScriptChange(e.target.value)}
          className="min-h-[200px] max-h-[40vh] resize-none text-sm overflow-y-auto"
          disabled={parseStatus === "parsing" || isImporting}
        />
        <div className="flex justify-end text-[10px] text-muted-foreground">
          Ký tự: {rawScriptStats.characterCount.toLocaleString()} · Từ: {rawScriptStats.wordCount.toLocaleString()}
        </div>
        <div className="rounded-xl border bg-card/50 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs flex items-center gap-1">
              <Wand2 className="h-3 w-3" />
              {t("scriptInput.scriptSkill")}
            </Label>
            <span className="text-[10px] text-muted-foreground">{t("scriptInput.skillOptionalWorkflow")}</span>
          </div>

          <Select value={selectedSkillId || "none"} onValueChange={handleSelectSkill}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("scriptInput.chooseSavedSkill")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("scriptInput.noSavedSkill")}</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={skillName}
            onChange={(event) => setSkillName(event.target.value)}
            placeholder={t("scriptInput.skillNamePlaceholder")}
            disabled={parseStatus === "parsing" || isImporting}
          />

          <Textarea
            value={skillText}
            onChange={(event) => setSkillText(event.target.value)}
            placeholder={t("scriptInput.skillTextPlaceholder")}
            className="min-h-[140px] max-h-[30vh] resize-none text-xs font-mono overflow-y-auto"
            disabled={parseStatus === "parsing" || isImporting}
          />

          {skillText.trim() && (
            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">{t("scriptInput.skillOutputs")}: {skillMeta.outputs.join(", ")}</span>
              <span className="rounded-full border px-2 py-0.5">{t("scriptInput.skillMerge")}: {skillMeta.mergeMode || "replace-missing"}</span>
            </div>
          )}

          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">{t("scriptInput.chunkThreshold")}</Label>
              <Input
                type="number"
                min={MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD}
                max={MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD}
                step={50}
                value={longScriptSkillWordThreshold}
                onChange={(event) => {
                  setScriptImport({
                    longScriptSkillWordThreshold: normalizeLongScriptSkillWordThreshold(event.target.value),
                  });
                }}
                className="h-8 w-28 text-xs"
                disabled={parseStatus === "parsing" || isImporting}
              />
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">
              {t("scriptInput.chunkThresholdHelp", { count: longScriptSkillWordThreshold })}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.json,text/markdown,text/plain,application/json"
            className="hidden"
            onChange={(event) => handleImportSkillFile(event.target.files)}
          />

          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              <Upload className="h-3.5 w-3.5 mr-1" />
              {t("scriptInput.importSkillFile")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleSaveSkill} disabled={!skillText.trim() || isImporting}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {t("scriptInput.saveSkill")}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleDeleteSkill} disabled={!selectedSkillId || isImporting}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t("scriptInput.deleteSkill")}
            </Button>
          </div>
        </div>
        {importStatus === "error" && importError && (
          <p className="text-xs text-destructive">{t("scriptInput.importFailed", { message: importError })}</p>
        )}

        {importStatus === 'ready' &&
          calibrationStatus !== 'calibrating' && (
          <p className="text-xs text-green-600">✓ {t("scriptInput.importSuccess")}</p>
        )}

        {(importStatus === 'importing' ||
          calibrationStatus === 'calibrating') && (
          <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg font-bold">{t("scriptInput.processing")}</span>
              </div>
              {onCancelImport && (
                <Button type="button" variant="destructive" size="sm" onClick={onCancelImport}>
                  <Square className="h-3.5 w-3.5" />
                  {t("scriptInput.cancel")}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className={`flex items-center gap-3 py-1 ${importStatus === 'importing' ? 'text-primary font-bold' : importStatus === 'ready' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                {importStatus === 'importing' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : importStatus === 'ready' ? (
                  <span className="text-lg">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-current" />
                )}
                <span className="text-base">{t("scriptInput.importScript")}</span>
              </div>
              <div className={`flex items-center gap-3 py-1 ${calibrationStatus === 'calibrating' ? 'text-primary font-bold' : calibrationStatus === 'completed' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                {calibrationStatus === 'calibrating' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : calibrationStatus === 'completed' ? (
                  <span className="text-lg">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-current" />
                )}
                <span className="text-base">{t("scriptInput.generateShotPrompts")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Palette className="h-3 w-3" />
            {t("scriptInput.visualStyle")}
          </Label>
          <StylePicker
            value={styleId}
            onChange={(id) => onStyleChange(id)}
            disabled={parseStatus === "parsing" || isImporting}
          />
          <p className="text-[10px] text-muted-foreground">
            {t("scriptInput.visualStyleHelp")}
          </p>
        </div>

        {/* API warning */}
        {!chatConfigured && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              <p className="font-medium">{t("scriptInput.apiNotConfigured")}</p>
              <p className="opacity-80">{t("scriptInput.apiNotConfiguredHelp")}</p>
            </div>
          </div>
        )}

        {!!cliStreamTitle && parseStatus === "parsing" && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{cliStreamTitle}</span>
            </div>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-[11px] text-foreground/90 font-mono">
              {cliStreamOutput || t("scriptInput.cliStreamingWaiting")}
            </pre>
          </div>
        )}

        {/* Import / analysis actions */}
        <div className="space-y-2">
          {onImportWithSkill && (
            <Button
              onClick={handleImportWithSkill}
              disabled={!normalizedRawScript.trim() || !skillText.trim() || isImporting}
              className="w-full"
              variant="secondary"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("scriptInput.runningSkill")}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t("scriptInput.importWithSkill")}
                </>
              )}
            </Button>
          )}
          {isImporting && onCancelImport && (
            <Button
              type="button"
              onClick={onCancelImport}
              className="w-full"
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              {t("scriptInput.cancel")}
            </Button>
          )}
           
        </div>

        {/* Parse error */}
        {parseStatus === "error" && parseError && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{parseError}</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function extractSkillName(content: string): string | null {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() || null;
}

function extractSkillMetadata(content: string): unknown {
  const metadataBlock = content.match(/##\s*Skill Metadata[\s\S]*?```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (!metadataBlock) return undefined;
  try {
    return JSON.parse(metadataBlock);
  } catch {
    return undefined;
  }
}

function normalizeScriptInput(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
}

function getScriptInputStats(value: string): { characterCount: number; wordCount: number } {
  const trimmed = value.trim();

  return {
    characterCount: value.length,
    wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
  };
}
