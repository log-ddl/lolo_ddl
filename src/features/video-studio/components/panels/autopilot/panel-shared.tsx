"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { useNow } from "@/shared/lib/use-now";
import { Label } from "@/shared/components/ui/label";
import type { AutopilotJob } from "@/features/video-studio/autopilot/types";
import type { RenderCodec } from "@/features/video-studio/lib/auto-video/types";

export const CODEC_OPTIONS: { value: RenderCodec; label: string }[] = [
  { value: "libx264", label: "H.264 (CPU)" },
  { value: "libx265", label: "H.265 (CPU)" },
  { value: "h264_nvenc", label: "H.264 (NVIDIA GPU)" },
];

export const STATUS_STYLES: Record<AutopilotJob["status"], string> = {
  queued: "text-amber-600 dark:text-amber-400",
  running: "text-sky-600 dark:text-sky-400",
  done: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  paused: "text-amber-600 dark:text-amber-400",
  interrupted: "text-amber-600 dark:text-amber-400",
  cancelled: "text-muted-foreground",
};

export const STATUS_ICONS: Record<AutopilotJob["status"], typeof Circle> = {
  queued: Circle,
  running: Loader2,
  done: CircleCheck,
  failed: CircleX,
  paused: Circle,
  interrupted: Circle,
  cancelled: Circle,
};

/** Seconds since an asset entered an in-flight state; resets to 0 when it leaves one. */
export function useActiveElapsedSeconds(status: string | undefined): number {
  const isGenerating = status === "generating" || status === "uploading";
  const now = useNow(isGenerating);
  const startedAtRef = useRef<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  useEffect(() => {
    if (isGenerating) {
      if (startedAtRef.current === null) {
        startedAtRef.current = Date.now();
        setStartedAt(Date.now());
      }
    } else {
      startedAtRef.current = null;
      setStartedAt(null);
    }
  }, [isGenerating, status]);
  return isGenerating && startedAt !== null ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

/** Pulls a display name out of a skill's front-matter or first markdown heading. */
export function inferAutopilotSkillName(content: string): string {
  return content.match(/^name:\s*(.+)$/im)?.[1]?.trim()
    || content.match(/^#\s+(.+)$/m)?.[1]?.trim()
    || "";
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

export function SpeedSlider({ value, onChange, min, max, step, t }: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  t: (key: string) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{t("tts.settings.speed")}</Label>
        <span className="text-2xs tabular-nums font-medium text-primary">{value.toFixed(2)}×</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full accent-primary" />
    </div>
  );
}
