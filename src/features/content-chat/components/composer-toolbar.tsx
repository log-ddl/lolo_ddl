import { Bot, FileText, FolderOpen, LockKeyhole, Loader2, RotateCcw } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { effortLabel, workspaceLabel } from "../lib/labels";

/**
 * The row under the composer: system prompt, workspace, memory.md, and the
 * model / reasoning-effort pickers.
 */
export interface ComposerToolbarProps {
  running: boolean;
  workspaceBusy: boolean;
  /** True once the chat has a user message — provider and workspace are then fixed. */
  workspaceLocked: boolean;
  workspacePath: string | undefined;
  /** Set only when the conversation overrides the default workspace. */
  conversationWorkspacePath: string | null;
  selectedModel: string;
  selectedEffort: string;
  availableModels: string[];
  availableEfforts: string[];
  loadingModels: boolean;
  locale: string;
  onOpenSystemPrompt: () => void;
  onWorkspaceClick: () => void;
  onOpenMemory: () => void;
  onUseDefaultWorkspace: () => void;
  onModelChange: (model: string) => void;
  onEffortChange: (effort: string) => void;
  onLoadModels: () => void;
}

export function ComposerToolbar({
  running,
  workspaceBusy,
  workspaceLocked,
  workspacePath,
  conversationWorkspacePath,
  selectedModel,
  selectedEffort,
  availableModels,
  availableEfforts,
  loadingModels,
  locale,
  onOpenSystemPrompt,
  onWorkspaceClick,
  onOpenMemory,
  onUseDefaultWorkspace,
  onModelChange,
  onEffortChange,
  onLoadModels,
}: ComposerToolbarProps) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-lg px-2 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={running}
        onClick={onOpenSystemPrompt}
        title={t("contentChat.systemPromptTitle")}
      >
        <Bot className="size-3.5" />
        {t("contentChat.systemPromptButton")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 min-w-0 max-w-52 justify-start rounded-lg bg-muted/55 px-2 text-xs font-normal hover:bg-muted"
        disabled={workspaceBusy || (!workspaceLocked && running)}
        onClick={onWorkspaceClick}
        title={workspaceLocked
          ? t("contentChat.openWorkspace", { path: workspacePath || t("contentChat.defaultWorkspace") })
          : workspacePath || t("contentChat.defaultWorkspace")}
      >
        {workspaceBusy ? <Loader2 className="size-3.5 animate-spin" /> : <FolderOpen className="size-3.5" />}
        <span className="truncate">
          {conversationWorkspacePath && workspacePath
            ? workspaceLabel(workspacePath)
            : t("contentChat.defaultWorkspace")}
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-lg px-2 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
        disabled={running || workspaceBusy}
        onClick={onOpenMemory}
      >
        <FileText className="size-3.5" />
        memory.md
      </Button>
      {conversationWorkspacePath && !workspaceLocked && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground"
          disabled={running || workspaceBusy}
          onClick={onUseDefaultWorkspace}
          title={t("contentChat.useDefaultWorkspace")}
          aria-label={t("contentChat.useDefaultWorkspace")}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
      {workspaceLocked && (
        <LockKeyhole className="mx-1 size-3.5 shrink-0 text-muted-foreground" aria-label={t("contentChat.workspaceLocked")} />
      )}
      <Select
        value={selectedModel || "__default"}
        onValueChange={(value) => onModelChange(value === "__default" ? "" : value)}
        disabled={running}
        onOpenChange={(open) => { if (open) onLoadModels(); }}
      >
        <SelectTrigger className="h-8 w-auto min-w-32 max-w-72 rounded-lg border-0 bg-muted/55 px-2 text-xs shadow-none">
          {loadingModels ? <Loader2 className="size-3.5 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default">{t("contentChat.defaultModel")}</SelectItem>
          {availableModels.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select
        value={selectedEffort || "__default"}
        onValueChange={(value) => onEffortChange(value === "__default" ? "" : value)}
        disabled={running}
        onOpenChange={(open) => { if (open) onLoadModels(); }}
      >
        <SelectTrigger className="h-8 w-max min-w-max max-w-none rounded-lg border-0 bg-muted/55 px-2 text-xs shadow-none [&>span]:line-clamp-none [&>span]:overflow-visible">
          {loadingModels ? <Loader2 className="size-3.5 animate-spin" /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default">{t("contentChat.defaultEffort")}</SelectItem>
          {availableEfforts.map((effort) => (
            <SelectItem key={effort} value={effort}>{effortLabel(effort, locale)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
