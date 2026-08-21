"use client";

/**
 * Presentational pieces of the import stage: section wrapper, file drop zone,
 * mode / provider chips, and one editable row of the parsed CSV preview.
 */

import { useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { WHISPER_PROVIDERS, type WhisperProvider } from "@/features/video-studio/lib/auto-video/whisper-api";
import { VIDEO_EXTS } from "./constants";

export type TranscribeStageId =
  | "idle" | "probing" | "chunking" | "uploading" | "merging" | "done" | "error";

export function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export function DropZone({
  hint,
  onDrop,
  onClick,
  busy,
}: {
  hint: string;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  busy?: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDrop(e); }}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        over
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40 hover:bg-muted/20",
      )}
    >
      <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {hint}
      </div>
    </div>
  );
}

export function ModeChip({
  active, onClick, label, disabled,
}: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      {label}
    </button>
  );
}

export function ProviderChip({
  provider, active, onClick,
}: { provider: WhisperProvider; active: boolean; onClick: () => void }) {
  const cfg = WHISPER_PROVIDERS[provider];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-2 rounded-md border text-left transition-colors",
        active
          ? "bg-primary/10 border-primary"
          : "bg-muted/30 border-border hover:bg-muted/50",
      )}
    >
      <div className="text-sm font-medium">{cfg.label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        {cfg.defaultModel}
      </div>
    </button>
  );
}

const ROW_IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "gif"];

export function CsvPreviewRow({
  row,
  edit,
  showVideo,
  onVoiceChange,
  onPickImage,
  onClearImage,
  onPickVideo,
  onClearVideo,
}: {
  row: { index: number; voice: string; imagePath: string; videoPath: string };
  edit: { voice?: string; imagePath?: string; videoPath?: string } | undefined;
  showVideo: boolean;
  onVoiceChange: (next: string) => void;
  onPickImage: (file: File) => void;
  onClearImage: () => void;
  onPickVideo: (file: File) => void;
  onClearVideo: () => void;
}) {
  const { t } = useI18n();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const voiceValue = edit?.voice ?? row.voice;
  const imagePath = edit?.imagePath !== undefined ? edit.imagePath : row.imagePath;
  const videoPath = edit?.videoPath !== undefined ? edit.videoPath : row.videoPath;
  const dirty = edit !== undefined && (
    (edit.voice !== undefined && edit.voice !== row.voice) ||
    (edit.imagePath !== undefined && edit.imagePath !== row.imagePath) ||
    (edit.videoPath !== undefined && edit.videoPath !== row.videoPath)
  );

  return (
    <tr className={cn("border-t align-top hover:bg-muted/30", dirty && "bg-amber-500/5")}>
      <td className="p-2 text-muted-foreground">{row.index}</td>
      <td className="p-2">
        <input
          value={voiceValue}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="w-full bg-transparent border-0 outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -mx-1 text-xs"
          placeholder="—"
        />
      </td>
      <td className="p-2 text-muted-foreground">
        <div className="flex items-center gap-1">
          {imagePath ? (
            <>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex-1 truncate text-left hover:text-foreground transition-colors"
                title={imagePath}
              >
                {imagePath.split(/[\\/]/).pop()}
              </button>
              <button
                onClick={onClearImage}
                className="opacity-50 hover:opacity-100"
                title={t("autoVideo.import.clearImage")}
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              onClick={() => imageInputRef.current?.click()}
              className="text-left italic opacity-60 hover:opacity-100 hover:text-foreground transition-colors"
            >
              {t("autoVideo.import.chooseImage")}
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept={ROW_IMAGE_EXTS.map((e) => `.${e}`).join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickImage(f);
              e.target.value = "";
            }}
          />
        </div>
      </td>
      {showVideo && (
        <td className="p-2 text-muted-foreground">
          <div className="flex items-center gap-1">
            {videoPath ? (
              <>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 truncate text-left hover:text-foreground transition-colors"
                  title={videoPath}
                >
                  {videoPath.split(/[\\/]/).pop()}
                </button>
                <button
                  onClick={onClearVideo}
                  className="opacity-50 hover:opacity-100"
                  title={t("autoVideo.import.clearVideo")}
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : imagePath ? (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="text-left text-amber-600 dark:text-amber-400 hover:text-foreground transition-colors"
                title={t("autoVideo.import.videoFallbackHint")}
              >
                {t("autoVideo.import.fallbackImage")}
              </button>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="text-left italic opacity-60 hover:opacity-100 hover:text-foreground transition-colors"
              >
                {t("autoVideo.import.chooseVideo")}
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept={VIDEO_EXTS.map((e) => `.${e}`).join(",")}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickVideo(f);
                e.target.value = "";
              }}
            />
          </div>
        </td>
      )}
    </tr>
  );
}

