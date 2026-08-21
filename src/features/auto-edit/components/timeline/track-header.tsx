"use client";

/**
 * The sticky left column of a timeline row: track name plus its hide / mute toggles.
 */

import type { ReactNode } from "react";
import { Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useI18n } from "@/shared/i18n";
import { useEditorStore } from "../../store/editor-store";
import { toggleTrackHiddenCommand, toggleTrackMutedCommand } from "../../commands";
import { trackColor } from "./theme";
import type { TimelineTrack } from "../../types";

export function TrackHeader({ track, isMain }: { track: TimelineTrack; isMain: boolean }) {
  const { t } = useI18n();
  const execute = useEditorStore((s) => s.execute);
  const color = trackColor(track.type);

  return (
    // The label column is 112px wide (opencut's measurement), so the row stays
    // compact: small dot, truncating name, and icon buttons that shrink to fit.
    <div className="flex h-full items-center gap-1 px-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
        {isMain ? t("autoEdit.track.main") : track.name}
      </span>
      {track.type !== "audio" && "hidden" in track && (
        <HeaderIconButton
          active={!track.hidden}
          onClick={() => execute(toggleTrackHiddenCommand(track.id, t("autoEdit.hideTrack")))}
        >
          {track.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        </HeaderIconButton>
      )}
      {"muted" in track && (
        <HeaderIconButton
          active={!track.muted}
          onClick={() => execute(toggleTrackMutedCommand(track.id, t("autoEdit.muteTrack")))}
        >
          {track.muted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
        </HeaderIconButton>
      )}
    </div>
  );
}

function HeaderIconButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
        !active && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}
