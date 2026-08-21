import { useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DEFAULT_EXPORT_SETTINGS,
  exportAutoEditVideo,
  type ExportResolution,
  type ExportSettings,
} from "../render/render";
import { useRenderStore } from "../render/render-store";
import type { ExportCodec } from "../render/types";

/** Export button + settings popover (resolution / codec / quality). */
export function ExportButton() {
  const { t } = useI18n();
  const renderStatus = useRenderStore((s) => s.status);
  const renderPercent = useRenderStore((s) => s.percent);
  const rendering = renderStatus === "preparing" || renderStatus === "rendering";
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);

  const run = () => void exportAutoEditVideo(settings);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={rendering}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-70",
          )}
        >
          {rendering ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {Math.round(renderPercent)}%
            </>
          ) : (
            <>
              <Film className="size-4" />
              {t("autoEdit.export")}
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 space-y-3">
        <div className="text-sm font-semibold">{t("autoEdit.export")}</div>

        <div className="space-y-1.5">
          <Label htmlFor="export-resolution" className="text-xs text-muted-foreground">
            {t("autoEdit.export.resolution")}
          </Label>
          <Select
            value={settings.resolution}
            onValueChange={(v) => setSettings((s) => ({ ...s, resolution: v as ExportResolution }))}
          >
            <SelectTrigger id="export-resolution" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="canvas">{t("autoEdit.export.canvas")}</SelectItem>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
              <SelectItem value="1440p">1440p</SelectItem>
              <SelectItem value="2160p">2160p (4K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="export-codec" className="text-xs text-muted-foreground">
            {t("autoEdit.export.codec")}
          </Label>
          <Select
            value={settings.codec}
            onValueChange={(v) => setSettings((s) => ({ ...s, codec: v as ExportCodec }))}
          >
            <SelectTrigger id="export-codec" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="libx264">H.264 (libx264)</SelectItem>
              <SelectItem value="libx265">H.265 (libx265)</SelectItem>
              <SelectItem value="h264_nvenc">H.264 (NVENC)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="export-crf" className="text-xs text-muted-foreground">
            {t("autoEdit.export.quality")}
          </Label>
          <Input
            id="export-crf"
            type="number"
            min={0}
            max={51}
            step={1}
            value={settings.crf}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setSettings((s) => ({ ...s, crf: n }));
            }}
            className="h-8 text-xs"
          />
        </div>

        <Button
          type="button"
          variant="primary"
          className="h-8 w-full"
          onClick={run}
          disabled={rendering}
        >
          {rendering ? <Loader2 className="size-4 animate-spin" /> : <Film className="size-4" />}
          {t("autoEdit.render")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
