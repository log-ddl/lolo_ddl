import type { MutableRefObject } from "react";
import { Command as CommandIcon } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import type { CliSlashCommand } from "@/features/video-studio/lib/cli-runtime";
import type { ContentCliAdapter } from "../store";
import { cliLabel } from "../lib/labels";

/** A CLI-provided command, or one of the app's own `/new`, `/clear`, … commands. */
export type SlashMenuItem = CliSlashCommand | {
  name: string;
  description: string;
  provider: 'app';
  kind: 'command';
  source: 'app';
};

export interface SlashCommandMenuProps {
  adapter: ContentCliAdapter;
  commands: SlashMenuItem[];
  selection: number;
  itemRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  onSelect: (command: SlashMenuItem) => void;
  onHover: (index: number) => void;
}

export function SlashCommandMenu({ adapter, commands, selection, itemRefs, onSelect, onHover }: SlashCommandMenuProps) {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-2xs font-medium text-muted-foreground">
        <CommandIcon className="size-3.5" />
        {t("contentChat.slashCommands", { cli: cliLabel(adapter) })}
      </div>
      {commands.length > 0 ? (
        <div className="max-h-72 overflow-y-auto p-1.5" role="listbox">
          {commands.map((command, index) => (
            <button
              key={`${command.provider}:${command.name}`}
              ref={(element) => { itemRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={index === selection}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(command)}
              onMouseEnter={() => onHover(index)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left",
                index === selection ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-2xs">/</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-mono text-xs font-semibold">/{command.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-2xs uppercase text-muted-foreground">
                    {command.provider === "app" ? "App" : command.kind}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-2xs text-muted-foreground">{command.description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="px-3 py-5 text-center text-xs text-muted-foreground">{t("contentChat.noSlashCommands")}</p>
      )}
    </div>
  );
}
