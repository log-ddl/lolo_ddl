"use client";

/**
 * Character library selection popover.
 * Lets users attach characters from the library to a shot.
 */

import { useState, useMemo } from "react";
import { Check, User, Users } from "lucide-react";
import { useCharacterLibraryStore } from "@/features/video-studio/stores/character-library-store";
import { useVideoStudioSettingsStore } from "@/features/video-studio/stores/video-studio-settings-store";
import { useProjectStore } from "@/features/video-studio/stores/project-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useI18n } from "@/shared/i18n";

interface CharacterSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function CharacterSelector({
  selectedIds,
  onChange,
  disabled,
}: CharacterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  const { characters } = useCharacterLibraryStore();
  const { resourceSharing } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();

  const visibleCharacters = useMemo(() => {
    const list = resourceSharing.shareCharacters
      ? characters
      : !activeProjectId
        ? []
        : characters.filter((c) => c.projectId === activeProjectId);
    // Deduplicate by id because project copies can create repeated character ids.
    const seen = new Set<string>();
    return list.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [characters, resourceSharing.shareCharacters, activeProjectId]);

  const toggleCharacter = (charId: string) => {
    if (selectedIds.includes(charId)) {
      onChange(selectedIds.filter(id => id !== charId));
    } else {
      onChange([...selectedIds, charId]);
    }
  };

  // Only count characters that still exist in the library.
  const selectedCharacters = visibleCharacters.filter(c => selectedIds.includes(c.id));
  const validSelectedCount = selectedCharacters.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Users className="h-3 w-3" />
          {validSelectedCount > 0 ? (
            <span>{t("director.charactersSelected", { count: validSelectedCount })}</span>
          ) : (
            <span>{t("director.characterLibrary")}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-sm font-medium mb-2">{t("director.selectCharactersLabel")}</p>
        {visibleCharacters.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {t("director.characterLibraryEmpty")}
          </p>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-1">
            {visibleCharacters.map((char) => {
              const thumbnail = char.thumbnailUrl;
              const isSelected = selectedIds.includes(char.id);
              return (
                <div key={char.id}>
                  <button
                    onClick={() => toggleCharacter(char.id)}
                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted text-left"
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt={char.name} className="w-6 h-6 rounded object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                    <span className="flex-1 text-xs truncate">
                      {char.name}
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
