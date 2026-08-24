import { Ellipsis, Loader2, PanelLeftClose, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useContentChatStore } from "../store";
import { workspaceLabel } from "../lib/labels";

type Conversation = ReturnType<typeof useContentChatStore.getState>["conversations"][number];

export interface ConversationSidebarProps {
  collapsed: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  /** Keyed by conversation id; a present key means that chat is streaming. */
  runningTexts: Record<string, string>;
  searchOpen: boolean;
  searchQuery: string;
  locale: string;
  onToggleSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onCollapse: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  collapsed,
  conversations,
  activeConversationId,
  runningTexts,
  searchOpen,
  searchQuery,
  locale,
  onToggleSearch,
  onSearchQueryChange,
  onCollapse,
  onNewConversation,
  onSelectConversation,
  onTogglePinned,
  onRename,
  onDelete,
}: ConversationSidebarProps) {
  const { t } = useI18n();
  return (
    <aside className={cn(
      "shrink-0 overflow-hidden border-r border-border/60 bg-sidebar/60 transition-[width,border-color] duration-200 ease-out",
      collapsed ? "w-0 border-transparent" : "w-72",
    )}>
      <div className="flex h-full w-72 flex-col">
        <div className="flex gap-1.5 border-b border-border/60 p-3">
          <Button className="min-w-0 flex-1 justify-start" onClick={onNewConversation}>
            <Plus className="size-4" />
            <span className="truncate">{t("contentChat.newConversation")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("shrink-0", searchOpen && "bg-sidebar-accent")}
            onClick={onToggleSearch}
            title={t("contentChat.search")}
            aria-label={t("contentChat.search")}
          >
            <Search className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onCollapse}
            title={t("contentChat.collapseSidebar")}
            aria-label={t("contentChat.collapseSidebar")}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
        {searchOpen && (
          <div className="relative border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={t("contentChat.searchPlaceholder")}
              className="h-9 bg-background pl-8 pr-8 text-xs"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon-sm"
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-3 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
                aria-label={t("contentChat.clearSearch")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        )}
        <ScrollArea className="min-h-0 flex-1 p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs leading-5 text-muted-foreground">
            {searchQuery ? t("contentChat.noSearchResults") : t("contentChat.noHistory")}
          </p>
        ) : conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group mb-1 flex items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 transition-colors",
              conversation.id === activeConversationId ? "border-border bg-background shadow-xs" : "hover:bg-sidebar-accent/60",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className="min-w-0 flex-1 px-2 py-1.5 text-left"
            >
              <span className="flex items-center gap-1.5">
                {conversation.pinned && <Pin className="size-3 shrink-0 fill-current text-primary" />}
                <span className="block truncate text-sm font-medium">{conversation.title}</span>
                {/* Chạy song song thì phải nhìn ra chat nào còn đang chạy. */}
                {runningTexts[conversation.id] !== undefined && (
                  <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
                )}
              </span>
              <span className="mt-0.5 block text-2xs text-muted-foreground">
                {conversation.workspacePath ? workspaceLabel(conversation.workspacePath) : t("contentChat.defaultWorkspace")}
                {" · "}{new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(conversation.updatedAt)}
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm"
                  type="button"
                  aria-label={t("contentChat.chatActions")}
                  className="opacity-0 transition group-hover:opacity-100 focus:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100"
                >
                  <Ellipsis className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-44">
                <DropdownMenuItem onClick={() => onTogglePinned(conversation.id)}>
                  {conversation.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                  {conversation.pinned ? t("contentChat.unpin") : t("contentChat.pin")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(conversation.id, conversation.title)}>
                  <Pencil className="size-4" />
                  {t("contentChat.rename")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" disabled={runningTexts[conversation.id] !== undefined} onClick={() => onDelete(conversation.id)}>
                  <Trash2 className="size-4" />
                  {t("contentChat.deleteConversation")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        </ScrollArea>
      </div>
    </aside>
  );
}
