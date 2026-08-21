import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { debouncedFileStorage } from "@/shared/lib/debounced-storage";

export type ContentCliAdapter = "claude" | "opencode" | "codex";

export interface ContentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ContentConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ContentMessage[];
  /** Null means the app-managed default Content workspace. */
  workspacePath: string | null;
  /** Provider is bound on the first user message and cannot change afterward. */
  adapter: ContentCliAdapter | null;
  /** Chỉ dẫn cấp cao riêng của cuộc trò chuyện này. */
  systemPrompt: string;
  pinned: boolean;
  customTitle: boolean;
}

interface ContentChatState {
  conversations: ContentConversation[];
  activeConversationId: string | null;
  adapter: ContentCliAdapter;
  models: Record<ContentCliAdapter, string>;
  efforts: Record<ContentCliAdapter, string>;
  createConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ContentMessage) => void;
  setAdapter: (adapter: ContentCliAdapter) => void;
  setModel: (adapter: ContentCliAdapter, model: string) => void;
  setEffort: (adapter: ContentCliAdapter, effort: string) => void;
  setConversationWorkspace: (conversationId: string, workspacePath: string | null) => void;
  bindConversationAdapter: (conversationId: string, adapter: ContentCliAdapter) => void;
  setConversationSystemPrompt: (conversationId: string, systemPrompt: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  toggleConversationPinned: (conversationId: string) => void;
}

function newConversation(): ContentConversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Cuộc trò chuyện mới",
    createdAt: now,
    updatedAt: now,
    messages: [],
    workspacePath: null,
    adapter: null,
    systemPrompt: "",
    pinned: false,
    customTitle: false,
  };
}

function titleFromMessage(content: string) {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > 48 ? `${oneLine.slice(0, 48).trim()}…` : oneLine;
}

function sortConversations(conversations: ContentConversation[]) {
  return [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export const useContentChatStore = create<ContentChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      adapter: "claude",
      models: { claude: "", opencode: "", codex: "" },
      efforts: { claude: "", opencode: "", codex: "" },
      createConversation: () => {
        const conversation = newConversation();
        set((state) => ({
          conversations: sortConversations([conversation, ...state.conversations]),
          activeConversationId: conversation.id,
        }));
        return conversation.id;
      },
      selectConversation: (activeConversationId) => set({ activeConversationId }),
      deleteConversation: (id) => set((state) => {
        const conversations = state.conversations.filter((item) => item.id !== id);
        return {
          conversations,
          activeConversationId: state.activeConversationId === id
            ? conversations[0]?.id ?? null
            : state.activeConversationId,
        };
      }),
      addMessage: (conversationId, message) => set((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const isFirstUserMessage = message.role === "user" && !conversation.messages.some((item) => item.role === "user");
          return {
            ...conversation,
            title: isFirstUserMessage && !conversation.customTitle ? titleFromMessage(message.content) : conversation.title,
            updatedAt: Date.now(),
            messages: [...conversation.messages, message],
          };
        })),
      })),
      setAdapter: (adapter) => set({ adapter }),
      setModel: (adapter, model) => set((state) => ({
        models: { ...state.models, [adapter]: model },
      })),
      setEffort: (adapter, effort) => set((state) => ({
        efforts: { ...state.efforts, [adapter]: effort },
      })),
      setConversationWorkspace: (conversationId, workspacePath) => set((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId
          ? { ...conversation, workspacePath, updatedAt: Date.now() }
          : conversation)),
      })),
      bindConversationAdapter: (conversationId, adapter) => set((state) => ({
        conversations: state.conversations.map((conversation) => conversation.id === conversationId && !conversation.adapter
          ? { ...conversation, adapter }
          : conversation),
      })),
      setConversationSystemPrompt: (conversationId, systemPrompt) => set((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId
          ? { ...conversation, systemPrompt, updatedAt: Date.now() }
          : conversation)),
      })),
      renameConversation: (conversationId, title) => set((state) => ({
        conversations: state.conversations.map((conversation) => conversation.id === conversationId
          ? { ...conversation, title: title.trim(), customTitle: true }
          : conversation),
      })),
      toggleConversationPinned: (conversationId) => set((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId
          ? { ...conversation, pinned: !conversation.pinned }
          : conversation)),
      })),
    }),
    {
      name: "longdd-content-chat",
      storage: createJSONStorage(() => debouncedFileStorage),
      version: 7,
      migrate: (persisted) => {
        const state = persisted as Partial<ContentChatState> | undefined;
        return {
          ...state,
          models: { claude: "", opencode: "", codex: "", ...(state?.models ?? {}) },
          efforts: { claude: "", opencode: "", codex: "", ...(state?.efforts ?? {}) },
          conversations: (state?.conversations ?? []).map((conversation) => ({
            ...conversation,
            workspacePath: conversation.workspacePath ?? null,
            adapter: conversation.adapter ?? (conversation.messages.length > 0 ? state?.adapter ?? "claude" : null),
            systemPrompt: conversation.systemPrompt ?? "",
            pinned: conversation.pinned ?? false,
            customTitle: conversation.customTitle ?? false,
          })),
        };
      },
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        adapter: state.adapter,
        models: state.models,
        efforts: state.efforts,
      }),
    },
  ),
);
