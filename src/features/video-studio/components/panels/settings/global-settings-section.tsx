"use client";

/**
 * App-wide generation settings: script-import concurrency, watermark removal,
 * and the shared Director/AutoPilot lane limits, submit delays and timeouts.
 *
 * The lane fields edit a local draft and only reach the store on Save, so a
 * half-typed number never throttles a running job.
 */

import { useEffect, useState } from "react";
import { MessageSquare, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { useLicenseStore } from "@/shared/stores/license-store";
import {
  MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
  MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
  normalizeLongScriptSkillChunkConcurrency,
  useVideoStudioSettingsStore,
} from "@/features/video-studio/stores/video-studio-settings-store";

type LaneDraft = ReturnType<typeof useVideoStudioSettingsStore.getState>['maxStudioLanes'];

/** Millisecond range input pair used by the delay/stagger rows. */
function MsRangeInputs({
  min,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  width = "w-28",
}: {
  min: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  width?: string;
}) {
  const handle = (raw: string, apply: (value: number) => void) => {
    const value = parseInt(raw, 10);
    if (value >= min) apply(value);
  };
  return (
    <div className="flex items-center gap-2">
      <Input type="number" min={min} value={minValue} onChange={(e) => handle(e.target.value, onMinChange)} className={width} />
      <span className="text-xs text-muted-foreground">-</span>
      <Input type="number" min={min} value={maxValue} onChange={(e) => handle(e.target.value, onMaxChange)} className={width} />
    </div>
  );
}

export function GlobalSettingsSection() {
  const { t } = useI18n();
  const {
    maxStudioLanes,
    scriptImport,
    setMaxStudioLanes,
    setScriptImport,
    watermarkRemovalEnabled,
    setWatermarkRemovalEnabled,
  } = useVideoStudioSettingsStore();
  const licensePlan = useLicenseStore((s) => s.plan);

  const [draft, setDraft] = useState<LaneDraft>(maxStudioLanes);
  useEffect(() => {
    setDraft(maxStudioLanes);
  }, [maxStudioLanes]);

  const patchDraft = (patch: Partial<LaneDraft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <div className="p-6 border border-border rounded-xl bg-card space-y-6">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Settings className="h-4 w-4" />
        {t("settings.globalSettings")}
      </h3>

      <div className="rounded-lg border bg-muted/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-foreground">{t("settings.scriptImportChunkConcurrency")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("settings.scriptImportChunkConcurrencyDesc")}
              </p>
              <p className="text-2xs text-muted-foreground/70">
                {t("settings.scriptImportChunkConcurrencyHint", {
                  min: MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
                  max: MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
                })}
              </p>
            </div>
          </div>
          <Input
            type="number"
            min={MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY}
            max={MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY}
            step={1}
            value={scriptImport.longScriptSkillChunkConcurrency}
            onChange={(event) => {
              setScriptImport({
                longScriptSkillChunkConcurrency: normalizeLongScriptSkillChunkConcurrency(event.target.value),
              });
            }}
            className="w-24 shrink-0"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-foreground">{t("settings.watermarkRemoval")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("settings.watermarkRemovalDesc")}
              </p>
            </div>
          </div>
          <Switch
            checked={watermarkRemovalEnabled}
            onCheckedChange={setWatermarkRemovalEnabled}
            disabled={licensePlan === "free"}
          />
        </div>
        {licensePlan === "free" && (
          <p className="text-xs text-muted-foreground mt-3">
            {t("settings.watermarkRemovalProHint")}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs text-muted-foreground">{t("settings.maxStudioLanesTitle")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMaxStudioLanes(draft);
              toast.success(t("settings.maxStudioSettingsSaved"));
            }}
          >
            {t("settings.save")}
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.maxStudioImageLanes")}</Label>
            <Input
              type="number"
              min={1}
              value={draft.imageLanesPerJwt}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1) patchDraft({ imageLanesPerJwt: val });
              }}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.maxStudioImageLanesHelp")}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.maxStudioVideoLanes")}</Label>
            <Input
              type="number"
              min={1}
              value={draft.videoLanesPerJwt}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1) patchDraft({ videoLanesPerJwt: val });
              }}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.maxStudioVideoLanesHelp")}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.maxStudioImageSubmitDelay")}</Label>
            <MsRangeInputs
              min={0}
              minValue={draft.imageSubmitDelayMinMs}
              maxValue={draft.imageSubmitDelayMaxMs}
              onMinChange={(value) => patchDraft({ imageSubmitDelayMinMs: value })}
              onMaxChange={(value) => patchDraft({ imageSubmitDelayMaxMs: value })}
            />
            <p className="text-xs text-muted-foreground">{t("settings.maxStudioImageSubmitDelayHelp")}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.maxStudioVideoSubmitDelay")}</Label>
            <MsRangeInputs
              min={0}
              minValue={draft.videoSubmitDelayMinMs}
              maxValue={draft.videoSubmitDelayMaxMs}
              onMinChange={(value) => patchDraft({ videoSubmitDelayMinMs: value })}
              onMaxChange={(value) => patchDraft({ videoSubmitDelayMaxMs: value })}
            />
            <p className="text-xs text-muted-foreground">{t("settings.maxStudioVideoSubmitDelayHelp")}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">{t("settings.maxStudioJwtStartStagger")}</Label>
          <MsRangeInputs
            min={0}
            minValue={draft.jwtStartStaggerMinMs}
            maxValue={draft.jwtStartStaggerMaxMs}
            onMinChange={(value) => patchDraft({ jwtStartStaggerMinMs: value })}
            onMaxChange={(value) => patchDraft({ jwtStartStaggerMaxMs: value })}
          />
          <p className="text-xs text-muted-foreground">{t("settings.maxStudioJwtStartStaggerHelp")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.directorImageTimeout")}</Label>
            {/* Stored in ms, edited in seconds. */}
            <MsRangeInputs
              min={1}
              minValue={Math.round(draft.imageGenerationTimeoutMinMs / 1000)}
              maxValue={Math.round(draft.imageGenerationTimeoutMaxMs / 1000)}
              onMinChange={(value) => patchDraft({ imageGenerationTimeoutMinMs: value * 1000 })}
              onMaxChange={(value) => patchDraft({ imageGenerationTimeoutMaxMs: value * 1000 })}
            />
            <p className="text-xs text-muted-foreground">{t("settings.directorImageTimeoutHelp")}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t("settings.directorVideoTimeout")}</Label>
            <MsRangeInputs
              min={1}
              minValue={Math.round(draft.videoGenerationTimeoutMinMs / 1000)}
              maxValue={Math.round(draft.videoGenerationTimeoutMaxMs / 1000)}
              onMinChange={(value) => patchDraft({ videoGenerationTimeoutMinMs: value * 1000 })}
              onMaxChange={(value) => patchDraft({ videoGenerationTimeoutMaxMs: value * 1000 })}
            />
            <p className="text-xs text-muted-foreground">{t("settings.directorVideoTimeoutHelp")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
