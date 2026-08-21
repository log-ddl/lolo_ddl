import { Loader2 } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

/** Editor for the workspace-scoped memory.md that is prepended to every prompt. */
export function MemoryDialog({
  open,
  onOpenChange,
  workspacePath,
  draft,
  onDraftChange,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspacePath: string | undefined;
  draft: string;
  onDraftChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!saving) onOpenChange(next);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("contentChat.memoryTitle")}</DialogTitle>
          <DialogDescription>{t("contentChat.memoryDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{t("contentChat.workspace")}</Label>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
            {workspacePath}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-memory">memory.md</Label>
          <Textarea
            id="content-memory"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t("contentChat.memoryPlaceholder")}
            className="min-h-72 resize-y font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{t("contentChat.memoryScopeHint")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("contentChat.saveMemory")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Per-conversation system prompt. */
export function SystemPromptDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("contentChat.systemPromptTitle")}</DialogTitle>
          <DialogDescription>{t("contentChat.systemPromptDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="content-system-prompt">System prompt</Label>
          <Textarea
            id="content-system-prompt"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t("contentChat.systemPromptPlaceholder")}
            className="min-h-72 resize-y font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{t("contentChat.systemPromptScopeHint")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={onSave}>{t("contentChat.saveSystemPrompt")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RenameConversationDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("contentChat.renameTitle")}</DialogTitle>
          <DialogDescription>{t("contentChat.renameDescription")}</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={draft}
          maxLength={120}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button disabled={!draft.trim()} onClick={onSubmit}>{t("contentChat.rename")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
