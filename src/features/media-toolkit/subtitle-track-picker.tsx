"use client";

/**
 * Small form pieces for the media toolkit: a labelled field wrapper and the
 * searchable subtitle-track dropdown.
 */

import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import type { MediaSubtitleTrack } from "./types";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

export function SubtitleTrackPicker({
  tracks,
  value,
  onChange,
}: {
  tracks: MediaSubtitleTrack[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = tracks.find((track) => track.language === value);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTracks = normalizedQuery
    ? tracks.filter((track) => `${track.label} ${track.language}`.toLocaleLowerCase().includes(normalizedQuery))
    : tracks;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between px-3 font-normal">
          <span className="truncate text-left">
            {selected
              ? `${selected.label} (${selected.language})${selected.automatic ? ` · ${t("mediaToolkit.auto")}` : ""}`
              : t("mediaToolkit.noSubtitle")}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("mediaToolkit.searchSubtitle")}
            className="h-9 pl-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredTracks.length > 0 ? filteredTracks.map((track) => (
            <button
              key={track.language}
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                onChange(track.language);
                setOpen(false);
                setQuery("");
              }}
            >
              <Check className={`h-4 w-4 shrink-0 ${track.language === value ? "opacity-100" : "opacity-0"}`} />
              <span className="min-w-0 flex-1 truncate">{track.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {track.language}{track.automatic ? ` · ${t("mediaToolkit.auto")}` : ""}
              </span>
            </button>
          )) : (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("mediaToolkit.noSubtitleMatch")}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

