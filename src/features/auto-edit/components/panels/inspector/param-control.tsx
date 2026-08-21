import { Diamond } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import type { ParamDefinition, ParamValue } from "../../../lib/params";
import { FONT_FAMILIES } from "../../../lib/properties";

interface ParamControlProps {
  param: ParamDefinition;
  value: ParamValue | undefined;
  onChange: (key: string, value: ParamValue) => void;
  /** Optional keyframe affordance (number params only). */
  keyframe?: { active: boolean; onToggle: () => void };
  /**
   * Narrow two-column layout: abbreviated label and a flexible input, so groups
   * like Transform fit in half the vertical space.
   */
  dense?: boolean;
}

export function ParamControl({ param, value, onChange, keyframe, dense }: ParamControlProps) {
  const current = value ?? param.default;

  switch (param.type) {
    case "number": {
      const num = typeof current === "number" ? current : param.default;
      const input = (
        <Input
          type="number"
          value={num}
          min={param.min}
          max={param.max}
          step={param.step}
          className={cn(
            "h-7 text-right font-mono text-xs",
            dense ? "min-w-0 flex-1" : "w-24",
          )}
          onChange={(e) => {
            const parsed = Number.parseFloat(e.target.value);
            if (Number.isFinite(parsed)) onChange(param.key, parsed);
          }}
        />
      );
      const keyframeButton = keyframe && (
        <button
          type="button"
          onClick={keyframe.onToggle}
          title="Keyframe"
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            keyframe.active && "text-primary",
          )}
        >
          <Diamond className={cn("size-3", keyframe.active && "fill-current")} />
        </button>
      );

      if (dense) {
        return (
          <div className="flex min-w-0 items-center gap-1" title={param.label}>
            {keyframeButton}
            <Label className="w-7 shrink-0 truncate text-[10px] text-muted-foreground">
              {param.shortLabel ?? param.label}
            </Label>
            {input}
          </div>
        );
      }

      return (
        <Row label={param.label}>
          <div className="flex items-center gap-1">
            {keyframeButton}
            {input}
          </div>
        </Row>
      );
    }
    case "boolean":
      return (
        <Row label={param.label}>
          <Switch
            checked={typeof current === "boolean" ? current : param.default}
            onCheckedChange={(checked) => onChange(param.key, checked)}
          />
        </Row>
      );
    case "color":
      return (
        <Row label={param.label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={typeof current === "string" ? current : param.default}
              onChange={(e) => onChange(param.key, e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <span className="font-mono text-[10px] text-muted-foreground">
              {typeof current === "string" ? current : param.default}
            </span>
          </div>
        </Row>
      );
    case "select":
      return (
        <Row label={param.label}>
          <Select
            value={typeof current === "string" ? current : param.default}
            onValueChange={(v) => onChange(param.key, v)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {param.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      );
    case "font":
      return (
        <Row label={param.label}>
          <Select
            value={typeof current === "string" ? current : param.default}
            onValueChange={(v) => onChange(param.key, v)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      );
    case "text":
      return (
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground">{param.label}</Label>
          <Textarea
            value={typeof current === "string" ? current : param.default}
            rows={3}
            className="resize-none text-xs"
            onChange={(e) => onChange(param.key, e.target.value)}
          />
        </div>
      );
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
