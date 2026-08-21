import type { PointerEvent } from "react";
import { msToPx, pixelsPerSecond, pxToMs } from "../../store/timeline-view-store";
import { RULER_HEIGHT } from "./layout";

/** Choose a "nice" major tick interval so labels are roughly ~90px apart. */
function niceTickMs(pps: number): number {
  const target = (90 / pps) * 1000;
  const steps = [100, 200, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000, 300000, 600000];
  for (const s of steps) if (s >= target) return s;
  return steps[steps.length - 1];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTickLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  if (m > 0) return `${m}:${pad(s)}`;
  return `${s}s`;
}

interface RulerProps {
  /** Width the ruler spans, in pixels — ticks are drawn across all of it. */
  widthPx: number;
  zoomLevel: number;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
}

export function Ruler({ widthPx, zoomLevel, onPointerDown }: RulerProps) {
  const pps = pixelsPerSecond(zoomLevel);
  const majorMs = niceTickMs(pps);
  const minorMs = majorMs / (majorMs % 5 === 0 ? 5 : 4);

  // Ticks follow the ruler's pixel width, not the project duration: a short
  // project in a wide window should still show a full ruler rather than stopping
  // halfway across and leaving the rest blank.
  const spanMs = pxToMs(widthPx, zoomLevel);
  const ticks: Array<{ ms: number; major: boolean }> = [];
  for (let ms = 0; ms <= spanMs + minorMs; ms += minorMs) {
    const rounded = Math.round(ms);
    ticks.push({ ms: rounded, major: rounded % majorMs === 0 });
  }

  return (
    <div
      className="relative h-full cursor-col-resize border-b border-border/60"
      style={{ height: RULER_HEIGHT }}
      onPointerDown={onPointerDown}
    >
      {ticks.map(({ ms, major }) => (
        <div key={ms} className="absolute top-0 h-full" style={{ left: msToPx(ms, zoomLevel) }}>
          <div
            className="absolute bottom-0 w-px bg-border"
            style={{ height: major ? 10 : 5 }}
          />
          {major && (
            <span className="absolute bottom-1 left-1 whitespace-nowrap text-[9px] font-medium text-muted-foreground">
              {formatTickLabel(ms)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
