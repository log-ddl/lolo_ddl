import { memo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Bot, Check, Copy, Loader2, UserRound } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import type { ContentMessage } from "../store";
import { MarkdownContent } from "./markdown-content";
import { FileReferenceCards } from "./file-preview";

/**
 * Memo theo nội dung tin nhắn. Không có nó thì mỗi lần cha render lại (đổi ô nhập,
 * mỗi token khi đang stream…) là toàn bộ tin nhắn cũ bị parse markdown lại và quét
 * lại tên file, dù chúng chẳng đổi gì.
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  copied,
  onCopy,
  onOpenFile,
  workspacePath,
}: {
  message: ContentMessage;
  copied: boolean;
  onCopy: (message: ContentMessage) => void;
  onOpenFile: (filePath: string) => void;
  workspacePath: string | null;
}) {
  const { t } = useI18n();
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        {isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={cn("group relative max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6", isUser ? "bg-primary text-primary-foreground" : "border border-border/60 bg-card")}>
        {isUser
          ? <div className="whitespace-pre-wrap break-words">{message.content}</div>
          : <>
            <MarkdownContent content={message.content} />
            <FileReferenceCards
              content={message.content}
              cacheKey={message.id}
              onOpenFile={onOpenFile}
              workspacePath={workspacePath}
            />
          </>}
        {!isUser && (
          <Button variant="ghost" size="icon-sm"
            type="button"
            onClick={() => onCopy(message)}
            title={t("contentChat.copy")}
            className="absolute -bottom-8 left-1 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
});

export function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Bot className="size-4" />
      </div>
      <div className="max-w-[82%] rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm leading-6">
        {text ? <MarkdownContent content={text} /> : <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        {text && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />}
      </div>
    </div>
  );
}
