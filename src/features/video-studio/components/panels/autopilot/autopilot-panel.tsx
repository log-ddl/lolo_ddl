"use client";

/**
 * AutoPilot panel: the "new job" form plus the job list.
 *
 * Sub-pieces live alongside this file — voice-settings.tsx (TTS engine state),
 * job-card.tsx / job-progress.tsx / job-media-gallery.tsx (job display) and
 * job-actions.tsx (re-render + DaVinci export).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n";
import { useNow } from "@/shared/lib/use-now";
import { useAutopilotStore } from "@/features/video-studio/stores/autopilot-store";
import { useBatchQueueStore } from "@/features/video-studio/stores/batch-queue-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import {
  normalizeAutopilotKenBurnsPercent,
  normalizeAutopilotLongFormThresholdMinutes,
  useVideoStudioSettingsStore,
} from "@/features/video-studio/stores/video-studio-settings-store";
import { useAutopilotSkillStore } from "@/features/video-studio/stores/autopilot-skill-store";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { StylePicker } from "@/features/video-studio/components/style-picker";
import { setProjectVisualStyleId, useProjectVisualStyleId } from "@/features/video-studio/lib/project-visual-style";
import { toast } from "sonner";
import { parseSrt } from "@/features/video-studio/lib/auto-video/srt-parser";
import { parseAutopilotImportedPlan, scriptFromImportedPlan } from "@/features/video-studio/autopilot/imported-plan";
import {
  ChevronDown,
  ChevronRight,
  FileUp,
  FolderOpen,
  Palette,
  Pencil,
  Play,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import type { AutopilotImportedPlan, AutopilotJobInput } from "@/features/video-studio/autopilot/types";
import type { RenderCodec } from "@/features/video-studio/lib/auto-video/types";
import { CODEC_OPTIONS, inferAutopilotSkillName } from "./panel-shared";
import { useAutopilotVoiceSettings, VoiceEnginePicker, VoiceEngineSettings } from "./voice-settings";
import { ShotPreviewOverlay } from "./job-media-gallery";
import { JobCard } from "./job-card";

export function AutopilotPanel() {
  const { t } = useI18n();
  const jobs = useAutopilotStore((s) => s.jobs);
  const createJob = useAutopilotStore((s) => s.createJob);
  const cancelJob = useAutopilotStore((s) => s.cancelJob);
  const resumeJob = useAutopilotStore((s) => s.resumeJob);
  const removeJob = useAutopilotStore((s) => s.removeJob);
  const longFormThresholdMinutes = useVideoStudioSettingsStore((s) => s.autopilot.longFormThresholdMinutes);
  const kenBurnsEnabled = useVideoStudioSettingsStore((s) => s.autopilot.kenBurnsEnabled);
  const kenBurnsPercent = useVideoStudioSettingsStore((s) => s.autopilot.kenBurnsPercent);
  const setAutopilotSettings = useVideoStudioSettingsStore((s) => s.setAutopilot);
  const visualStyleId = useProjectVisualStyleId();
  const savedSkills = useAutopilotSkillStore((s) => s.skills);
  const selectedSkillId = useAutopilotSkillStore((s) => s.selectedSkillId);
  const addSkill = useAutopilotSkillStore((s) => s.addSkill);
  const updateSkill = useAutopilotSkillStore((s) => s.updateSkill);
  const deleteSkill = useAutopilotSkillStore((s) => s.deleteSkill);
  const selectSkill = useAutopilotSkillStore((s) => s.selectSkill);

  const [script, setScript] = useState("");
  // Kept as text so the field can be left empty, which means 100%.
  const [kenBurnsPercentInput, setKenBurnsPercentInput] = useState(kenBurnsPercent === 100 ? "" : String(kenBurnsPercent));
  const [skillName, setSkillName] = useState("");
  const [skillText, setSkillText] = useState("");
  const [skillExpanded, setSkillExpanded] = useState(false);
  const [maxShots, setMaxShots] = useState(0);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [voiceSource, setVoiceSource] = useState<"tts" | "import">("tts");
  const [importedAudioPath, setImportedAudioPath] = useState("");
  const [importedSrtRaw, setImportedSrtRaw] = useState("");
  const [importedSrtName, setImportedSrtName] = useState("");
  const srtInputRef = useRef<HTMLInputElement>(null);
  const [importedPlan, setImportedPlan] = useState<AutopilotImportedPlan | null>(null);
  const [importedPlanName, setImportedPlanName] = useState("");
  const planInputRef = useRef<HTMLInputElement>(null);
  const [subtitles, setSubtitles] = useState(false);
  const [bgmPath, setBgmPath] = useState("");
  const [codec, setCodec] = useState<RenderCodec>("libx264");
  const [audioNormalize, setAudioNormalize] = useState(false);
  const [videoAudioVolume, setVideoAudioVolume] = useState(0);
  // When false, stop after generating the shot videos (no final ffmpeg merge).
  const [mergeAfterCreate, setMergeAfterCreate] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const now = useNow(jobs.some((job) => job.status === "running" || job.status === "queued"));

  const voice = useAutopilotVoiceSettings();

  useEffect(() => {
    if (!selectedSkillId) {
      setSkillName("");
      setSkillText("");
      return;
    }
    const selected = savedSkills.find((skill) => skill.id === selectedSkillId);
    if (!selected) {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }
    setSkillName(selected.name);
    setSkillText(selected.content);
  }, [savedSkills, selectedSkillId, selectSkill]);

  const handleSelectSkill = useCallback((id: string) => {
    if (id === "new") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      setSkillExpanded(true);
      return;
    }
    if (id === "none") {
      selectSkill(null);
      setSkillName("");
      setSkillText("");
      return;
    }
    const selected = savedSkills.find((skill) => skill.id === id);
    if (!selected) return;
    selectSkill(id);
    setSkillName(selected.name);
    setSkillText(selected.content);
    setSkillExpanded(false);
  }, [savedSkills, selectSkill]);

  const handleSaveSkill = useCallback(() => {
    const content = skillText.trim();
    if (!content) return;
    const name = skillName.trim() || inferAutopilotSkillName(content) || t("autopilot.panel.untitledSkill");
    if (selectedSkillId && savedSkills.some((skill) => skill.id === selectedSkillId)) {
      updateSkill(selectedSkillId, { name, content });
      toast.success(t("autopilot.panel.skillUpdated", { name }));
    } else {
      addSkill({ name, content });
      toast.success(t("autopilot.panel.skillSaved", { name }));
    }
    setSkillName(name);
  }, [addSkill, savedSkills, selectedSkillId, skillName, skillText, t, updateSkill]);

  const handleDeleteSkill = useCallback(() => {
    if (!selectedSkillId) return;
    const selected = savedSkills.find((skill) => skill.id === selectedSkillId);
    if (!selected || !window.confirm(t("autopilot.panel.deleteSkillConfirm", { name: selected.name }))) return;
    deleteSkill(selectedSkillId);
    setSkillName("");
    setSkillText("");
    toast.success(t("autopilot.panel.skillDeleted"));
  }, [deleteSkill, savedSkills, selectedSkillId, t]);

  /** Build the AutopilotJobInput from the current form. Returns null if invalid. */
  const buildInput = useCallback((executionMode: "all" | "step"): AutopilotJobInput | null => {
    if (voiceSource === "import" && !importedAudioPath.trim()) {
      toast.error(t("autopilot.panel.audioRequired"));
      return null;
    }
    const input: AutopilotJobInput = {
      title: importedPlan?.title,
      script: script.trim() || undefined,
      skill: skillText.trim() || undefined,
      maxShots: importedPlan ? undefined : maxShots > 0 ? maxShots : undefined,
      longFormThresholdMinutes,
      aspectRatio,
      importedAudioPath: voiceSource === "import" ? importedAudioPath.trim() || undefined : undefined,
      importedSrtRaw: voiceSource === "import" ? importedSrtRaw.trim() || undefined : undefined,
      importedPlan: importedPlan || undefined,
      voice: voice.buildVoice(),
      subtitles,
      bgmPath: bgmPath.trim() || undefined,
      codec,
      audioNormalize: audioNormalize || undefined,
      videoAudioVolume: videoAudioVolume > 0 ? videoAudioVolume : undefined,
      kenBurnsEnabled,
      kenBurnsPercent,
      resolution: "1920x1080",
      executionMode,
      stopAfterStep: mergeAfterCreate ? undefined : "videos",
    };
    if (!input.script && !input.importedAudioPath) {
      toast.error(t("autopilot.panel.noInput"));
      return null;
    }
    return input;
  }, [t, importedPlan, script, skillText, maxShots, longFormThresholdMinutes, aspectRatio, voiceSource, importedAudioPath, importedSrtRaw, voice, subtitles, bgmPath, codec, audioNormalize, videoAudioVolume, kenBurnsEnabled, kenBurnsPercent, mergeAfterCreate]);

  const handleCreate = useCallback((executionMode: "all" | "step") => {
    const input = buildInput(executionMode);
    if (!input) return;
    const result = createJob(input);
    if (result.ok) {
      toast.success(t("autopilot.panel.jobCreated", { id: result.jobId ?? "" }));
      if (result.jobId) setExpandedJob(result.jobId);
      setScript("");
      setImportedPlan(null);
      setImportedPlanName("");
    } else {
      toast.error(result.error || t("autopilot.panel.createFailed"));
    }
  }, [t, buildInput, createJob]);

  const handleAddToQueue = useCallback(() => {
    const input = buildInput("all");
    if (!input) return;
    const { activeProjectId, projects } = useProjectStore.getState();
    if (!activeProjectId) {
      toast.error("Chưa có dự án đang mở để thêm vào hàng chờ");
      return;
    }
    const projectName = projects.find((p) => p.id === activeProjectId)?.name || "Dự án";
    useBatchQueueStore.getState().addEntry({
      projectId: activeProjectId,
      projectName,
      label: mergeAfterCreate ? "AutoPilot đầy đủ" : "Chỉ tạo video (chưa ghép)",
      stopAfterStep: input.stopAfterStep,
      input: { ...input, title: projectName },
    });
    toast.success(`Đã thêm "${projectName}" vào hàng chờ`);
  }, [buildInput, mergeAfterCreate]);

  const handlePickNarrationAudio = useCallback(async () => {
    const result = await window.ttsRuntime?.pickReferenceAudio(t("autopilot.panel.importAudio"));
    if (result?.path) setImportedAudioPath(result.path);
  }, [t]);

  const handlePickSrt = useCallback(async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const result = parseSrt(text);
    if (result.segments.length === 0) {
      toast.error(t("autopilot.panel.srtInvalid"));
      return;
    }
    setImportedSrtRaw(text);
    setImportedSrtName(file.name);
    toast.success(t("autopilot.panel.srtLoaded", { count: result.segments.length }));
  }, [t]);

  const handleClearSrt = useCallback(() => {
    setImportedSrtRaw("");
    setImportedSrtName("");
  }, []);

  const handlePickPlan = useCallback(async (file: File | null) => {
    if (!file) return;
    try {
      const plan = parseAutopilotImportedPlan(await file.text());
      setImportedPlan(plan);
      setImportedPlanName(file.name);
      setScript(scriptFromImportedPlan(plan));
      if (plan.aspectRatio) setAspectRatio(plan.aspectRatio);
      toast.success(`Đã nạp ${plan.shots.length} shot từ JSON; bỏ qua CLI lập shot`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const handleClearPlan = useCallback(() => {
    setImportedPlan(null);
    setImportedPlanName("");
  }, []);

  const handleCopyPath = useCallback((path: string) => {
    void navigator.clipboard.writeText(path);
    toast.success(t("autoVideo.render.copySuccess"));
  }, [t]);

  const handleSaveVideo = useCallback(async (path: string, title: string) => {
    const result = await window.electronAPI?.saveFileDialog({
      localPath: path,
      defaultPath: `${title.replace(/[^a-zA-Z0-9À-ɏ_-]+/g, "_") || "autopilot"}.mp4`,
      filters: [{ name: "MP4 Video", extensions: ["mp4"] }],
    });
    if (result?.success) toast.success(t("autopilot.panel.videoSaved"));
    else if (result && !result.canceled) toast.error(result.error || t("autopilot.panel.videoSaveFailed"));
  }, [t]);

  const showVoiceSettings = advancedExpanded && voiceSource === "tts";

  return (
    <div className="autopilot-panel h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="w-full space-y-4 px-4 pb-20 pt-4 md:px-5">

          {/* === Create job === */}
          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">{t("autopilot.panel.newJob")}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdvancedExpanded((value) => !value)}>
                <Settings2 className="mr-1.5 h-4 w-4" />
                {advancedExpanded ? t("autopilot.panel.hideAdvanced") : t("autopilot.panel.advanced")}
                {advancedExpanded ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>

            <Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder={t("autopilot.panel.scriptPlaceholder")} rows={4} className="text-xs" />

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/10 p-2.5">
              <Button type="button" variant="outline" size="sm" onClick={() => planInputRef.current?.click()}>
                <FileUp className="mr-1.5 h-4 w-4" />Nhập kế hoạch JSON
              </Button>
              <input
                ref={planInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(event) => {
                  void handlePickPlan(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              {importedPlan ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-xs text-green-600 dark:text-green-400">
                    {importedPlanName} · {importedPlan.shots.length} shot · bỏ qua CLI lập shot
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Bỏ JSON đã nhập" onClick={handleClearPlan}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <span className="text-2xs text-muted-foreground">Nạp JSON có shots[].voiceOver và shots[].imagePrompt.</span>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-xs">{t("autopilot.panel.skill")}</Label>
                <div className="flex gap-1">
                  <select value={selectedSkillId || "none"} onChange={(e) => handleSelectSkill(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs">
                    <option value="none">{t("autopilot.panel.noSkill")}</option>
                    {savedSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
                  </select>
                  <Button type="button" variant="outline" size="sm" className="h-9 px-2" title="Chỉnh sửa skill" disabled={!selectedSkillId} onClick={() => setSkillExpanded(true)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="outline" size="sm" className="h-9 px-2" title={t("autopilot.panel.newSkill")} onClick={() => handleSelectSkill("new")}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-xs"><Palette className="h-3.5 w-3.5" />{t("scriptInput.visualStyle")}</Label>
                <StylePicker value={visualStyleId} onChange={(styleId) => setProjectVisualStyleId(styleId)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">{t("autopilot.panel.voiceSource")}</Label>
                <select value={voiceSource} onChange={(e) => setVoiceSource(e.target.value as typeof voiceSource)} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs">
                  <option value="tts">{t("autopilot.panel.createTts")}</option>
                  <option value="import">{t("autopilot.panel.importAudio")}</option>
                </select>
              </div>
            </div>

            {skillExpanded && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-3">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold">Chỉnh sửa skill</span><Button type="button" variant="ghost" size="sm" onClick={() => setSkillExpanded(false)}><ChevronDown className="h-4 w-4" /></Button></div>
                <Input value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder={t("autopilot.panel.skillNamePlaceholder")} className="text-xs" />
                <Textarea value={skillText} onChange={(e) => setSkillText(e.target.value)} placeholder={t("autopilot.panel.skillPlaceholder")} rows={7} className="max-h-64 resize-y font-mono text-2xs" />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleDeleteSkill} disabled={!selectedSkillId}><Trash2 className="mr-1 h-3.5 w-3.5" />{t("autopilot.panel.deleteSkill")}</Button>
                  <Button type="button" size="sm" onClick={handleSaveSkill} disabled={!skillText.trim()}><Save className="mr-1 h-3.5 w-3.5" />{selectedSkillId ? t("autopilot.panel.updateSkill") : t("autopilot.panel.saveSkill")}</Button>
                </div>
              </div>
            )}

            {voiceSource === "import" && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <Label className="text-xs">{t("autopilot.panel.importAudio")}</Label>
                <div className="flex gap-2">
                  <Input value={importedAudioPath} readOnly placeholder={t("autopilot.panel.audioPlaceholder")} className="text-xs" />
                  <Button type="button" variant="outline" onClick={() => void handlePickNarrationAudio()}>
                    <FolderOpen className="mr-2 h-4 w-4" />{t("autopilot.panel.chooseAudio")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input value={importedSrtName} readOnly placeholder={t("autopilot.panel.srtPlaceholder")} className="text-xs" />
                  <Button type="button" variant="outline" onClick={() => srtInputRef.current?.click()}>
                    <FileUp className="mr-2 h-4 w-4" />{t("autopilot.panel.chooseSrt")}
                  </Button>
                  {importedSrtRaw && (
                    <Button type="button" variant="ghost" size="icon" title={t("autopilot.panel.clearSrt")} onClick={handleClearSrt}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <input
                    ref={srtInputRef}
                    type="file"
                    accept=".srt,text/plain"
                    className="hidden"
                    onChange={(event) => {
                      void handlePickSrt(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </div>
                <p className="text-2xs text-muted-foreground">{t("autopilot.panel.audioIsScriptHint")}</p>
                <p className="text-2xs text-muted-foreground">{t("autopilot.panel.srtHint")}</p>
              </div>
            )}

            {showVoiceSettings && <VoiceEnginePicker settings={voice} t={t} />}
            {showVoiceSettings && <VoiceEngineSettings settings={voice} t={t} />}

            {advancedExpanded && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div><Label className="mb-1.5 block text-xs">{t("autopilot.panel.maxShots")}</Label><Input type="number" min={0} max={100} value={maxShots} onChange={(e) => setMaxShots(Math.max(0, parseInt(e.target.value, 10) || 0))} className="text-xs" /></div>
                  <div><Label className="mb-1.5 block text-xs">{t("autopilot.panel.aspectRatio")}</Label><select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs">{["16:9", "9:16", "1:1", "4:3"].map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}</select></div>
                  <div><Label className="mb-1.5 block text-xs">{t("autopilot.panel.longFormThreshold")}</Label><Input type="number" min={1} max={120} value={longFormThresholdMinutes} onChange={(event) => setAutopilotSettings({ longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(event.target.value) })} className="text-xs" /></div>
                  <div><Label className="mb-1.5 block text-xs">{t("autoVideo.render.bgm")}</Label><Input value={bgmPath} onChange={(e) => setBgmPath(e.target.value)} placeholder={t("autopilot.panel.bgmPlaceholder")} className="text-xs" /></div>
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_auto_auto] lg:items-end">
                  <div>
                    <Label className="mb-1.5 block text-xs">Encoder</Label>
                    <select value={codec} onChange={(e) => setCodec(e.target.value as RenderCodec)} className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs">{CODEC_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                  </div>
                  <div className="flex h-8 items-center gap-2 whitespace-nowrap"><Switch checked={subtitles} onCheckedChange={setSubtitles} /><Label>{t("autopilot.panel.addSubtitles")}</Label></div>
                  <div className="flex h-8 items-center gap-2 whitespace-nowrap"><Switch checked={audioNormalize} onCheckedChange={setAudioNormalize} /><Label>Chuẩn hóa âm thanh (-14 LUFS YouTube)</Label></div>
                </div>
                <div>
                  <div className="flex h-8 items-center gap-2 whitespace-nowrap">
                    <Switch
                      checked={kenBurnsEnabled}
                      onCheckedChange={(value) => setAutopilotSettings({ kenBurnsEnabled: value })}
                    />
                    <Label>{t("autopilot.panel.kenBurns")}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      disabled={!kenBurnsEnabled}
                      value={kenBurnsPercentInput}
                      placeholder="100"
                      onChange={(event) => {
                        setKenBurnsPercentInput(event.target.value);
                        setAutopilotSettings({ kenBurnsPercent: normalizeAutopilotKenBurnsPercent(event.target.value) });
                      }}
                      className="h-7 w-20 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <p className="text-2xs text-muted-foreground mt-0.5">{t("autopilot.panel.kenBurnsHint")}</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Âm thanh gốc video ({Math.round(videoAudioVolume * 100)}%)</Label>
                  <input type="range" min={0} max={0.5} step={0.05} value={videoAudioVolume} onChange={(e) => setVideoAudioVolume(parseFloat(e.target.value))} className="w-full accent-primary" />
                  <p className="text-2xs text-muted-foreground mt-0.5">{videoAudioVolume === 0 ? "Tắt (mặc định)" : `Giữ âm thanh gốc video ở ${Math.round(videoAudioVolume * 100)}% so với voice`}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 border-t border-border pt-3">
              <Switch checked={mergeAfterCreate} onCheckedChange={setMergeAfterCreate} />
              <div className="min-w-0">
                <Label className="text-xs font-medium">Ghép thành video hoàn chỉnh</Label>
                <p className="text-2xs text-muted-foreground">
                  {mergeAfterCreate
                    ? "Tạo xong sẽ ghép (ffmpeg) ra 1 video hoàn chỉnh."
                    : "Chỉ tạo các video từng cảnh, KHÔNG ghép — bấm “Ghép lại” sau để xuất video cuối."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" className="mr-auto" onClick={handleAddToQueue} title="Thêm dự án này vào hàng chờ để chạy AutoPilot theo lịch/tuần tự">
                <Plus className="mr-1.5 h-4 w-4" />Thêm vào hàng chờ
              </Button>
              <Button variant="outline" onClick={() => handleCreate("step")}><FileUp className="mr-2 h-4 w-4" />{t("autopilot.panel.createStepByStep")}</Button>
              <Button onClick={() => handleCreate("all")}><Play className="mr-2 h-4 w-4" />{t("autopilot.panel.createAll")}</Button>
            </div>
          </div>

          {/* === Jobs === */}
          <div className="space-y-3 pb-8">
            <h3 className="text-sm font-bold">
              {t("autopilot.panel.jobs")} ({jobs.length})
            </h3>
            {jobs.length === 0 && (
              <div className="text-xs text-muted-foreground bg-card border border-border rounded-lg p-3">
                {t("autopilot.panel.noJobs")}
              </div>
            )}
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                expanded={expandedJob === job.id}
                now={now}
                onToggleExpand={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onCancel={() => cancelJob(job.id)}
                onResume={() => resumeJob(job.id)}
                onRemove={() => removeJob(job.id)}
                onCopyPath={handleCopyPath}
                onSaveVideo={(path, title) => void handleSaveVideo(path, title)}
                t={t}
              />
            ))}
          </div>

        </div>
      </ScrollArea>
      <ShotPreviewOverlay />
    </div>
  );
}
