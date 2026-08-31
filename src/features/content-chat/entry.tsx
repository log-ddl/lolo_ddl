import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Columns2,
  FolderTree,
  LockKeyhole,
  MessageSquareText,
  PanelLeftOpen,
  Radar,
  RefreshCw,
  Send,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { FeatureHeaderIcon } from "@/shared/components/FeatureHeaderIcon";
import { FeatureRail } from "@/shared/components/FeatureRail";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import {
  runCliTextTask,
  type CliSlashCommand,
  type CliRuntimeStatus,
} from "@/features/video-studio/lib/cli-runtime";
import {
  cachedCliCommands,
  cachedCliModels,
  cachedCliStatus,
  invalidateCliStatus,
  primeCliCommands,
} from "./lib/cli-cache";
import { useContentChatStore, type ContentCliAdapter, type ContentMessage } from "./store";
import { registerContentMcpToolHost } from "./mcp/renderer-tool-host";
import { BuzzView } from "./buzz/components/buzz-view";
import { hasPlanAccess } from "@/shared/lib/license-client";
import { useLicenseStore } from "@/shared/stores/license-store";
import { cliLabel, createMessage } from "./lib/labels";
import { MessageBubble, StreamingBubble } from "./components/message-bubble";
import { ConversationSidebar } from "./components/conversation-sidebar";
import { SlashCommandMenu, type SlashMenuItem } from "./components/slash-command-menu";
import { ComposerToolbar } from "./components/composer-toolbar";
import { MemoryDialog, RenameConversationDialog, SystemPromptDialog } from "./components/chat-dialogs";
import { FilePreviewPanel, type FilePreviewState } from "./components/file-preview";
import { ModelComparisonView } from "./components/model-comparison-view";
import { WorkspaceFileTree } from "./components/workspace-file-tree";

/** Nhịp vẽ tối đa khi đang stream. ~12 khung hình/giây là đủ mượt để đọc. */
const STREAM_PAINT_INTERVAL_MS = 80;

export default function ContentChatFeature() {
  const { t, locale } = useI18n();
  // Selector từng phần thay vì `useContentChatStore()` trần. Subscribe cả store
  // nghĩa là mọi thay đổi bất kỳ đều re-render toàn bộ cây này.
  const conversations = useContentChatStore((state) => state.conversations);
  const activeConversationId = useContentChatStore((state) => state.activeConversationId);
  const adapter = useContentChatStore((state) => state.adapter);
  const selectedModels = useContentChatStore((state) => state.models);
  const selectedEfforts = useContentChatStore((state) => state.efforts);
  // Action của zustand có identity cố định suốt vòng đời store.
  const createConversation = useContentChatStore((state) => state.createConversation);
  const selectConversation = useContentChatStore((state) => state.selectConversation);
  const deleteConversation = useContentChatStore((state) => state.deleteConversation);
  const addMessage = useContentChatStore((state) => state.addMessage);
  const setAdapter = useContentChatStore((state) => state.setAdapter);
  const setModel = useContentChatStore((state) => state.setModel);
  const setEffort = useContentChatStore((state) => state.setEffort);
  const setConversationWorkspace = useContentChatStore((state) => state.setConversationWorkspace);
  const bindConversationAdapter = useContentChatStore((state) => state.bindConversationAdapter);
  const setConversationSystemPrompt = useContentChatStore((state) => state.setConversationSystemPrompt);
  const renameConversation = useContentChatStore((state) => state.renameConversation);
  const toggleConversationPinned = useContentChatStore((state) => state.toggleConversationPinned);
  const [draft, setDraft] = useState("");
  /**
   * Chỉ vẽ tin nhắn sau khi đã chốt xong sẽ mở hội thoại nào. Không có cờ này thì
   * lúc vừa hydrate xong, app vẽ hội thoại cũ đang active rồi mới nhảy sang chat
   * mới — trả trọn chi phí render một hội thoại mà user còn chưa mở tới.
   */
  const [entryReady, setEntryReady] = useState(false);
  const [status, setStatus] = useState<CliRuntimeStatus | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableEfforts, setAvailableEfforts] = useState<string[]>([]);
  const [checkingRuntime, setCheckingRuntime] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  /**
   * Text đang stream, theo từng hội thoại. Có mặt khoá = hội thoại đó đang chạy.
   * Nhờ vậy nhiều hội thoại chạy song song được, và mở chat mới không phải chờ.
   */
  const [runningTexts, setRunningTexts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState("");
  const [workspaceInfo, setWorkspaceInfo] = useState<{ path: string; memory: string } | null>(null);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [systemPromptDraft, setSystemPromptDraft] = useState("");
  const [systemPromptConversationId, setSystemPromptConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [filePreview, setFilePreview] = useState<FilePreviewState | null>(null);
  const [slashCommands, setSlashCommands] = useState<CliSlashCommand[]>([]);
  const [slashSelection, setSlashSelection] = useState(0);
  const [activeTab, setActiveTab] = useState<"ai" | "buzz">("ai");
  const licensePlan = useLicenseStore((state) => state.plan);
  const canUseBuzz = hasPlanAccess(licensePlan, "dev");

  // File Tree Explorer state
  const [showFileTree, setShowFileTree] = useState(false);

  // Split comparison mode states
  const [splitCompareMode, setSplitCompareMode] = useState(false);
  const [compareAdapterA, setCompareAdapterA] = useState<ContentCliAdapter>("claude");
  const [compareAdapterB, setCompareAdapterB] = useState<ContentCliAdapter>("opencode");
  const [compareModelA, setCompareModelA] = useState("");
  const [compareModelB, setCompareModelB] = useState("");
  const [compareResponseA, setCompareResponseA] = useState("");
  const [compareResponseB, setCompareResponseB] = useState("");
  const [isStreamingA, setIsStreamingA] = useState(false);
  const [isStreamingB, setIsStreamingB] = useState(false);
  const [comparedPrompt, setComparedPrompt] = useState("");

  /** Một controller cho mỗi hội thoại đang chạy, để dừng được đúng cái mình muốn. */
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const openedWithFreshConversationRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  /** Hội thoại đã cuộn xuống cuối lần gần nhất, để phân biệt "đổi chat" với "có tin mới". */
  const lastScrolledConversationRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slashItemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const activeAdapter = activeConversation?.adapter ?? adapter;
  /** Tách riêng để callback memo hoá không phụ thuộc cả object hội thoại. */
  const activeConversationWorkspace = activeConversation?.workspacePath ?? null;
  /**
   * Chỉ hội thoại ĐANG XEM mới bị khoá ô nhập. Các hội thoại khác, và việc tạo chat
   * mới, không liên quan gì tới lượt chạy này.
   */
  const activeRunText = activeConversation ? runningTexts[activeConversation.id] : undefined;
  const activeIsRunning = activeRunText !== undefined;
  const providerLocked = Boolean(activeConversation?.messages.some((message) => message.role === "user"));
  const workspaceLocked = providerLocked;
  const selectedModel = selectedModels[activeAdapter];
  const selectedEffort = selectedEfforts[activeAdapter];
  const adapterStatus = status?.[activeAdapter];
  const visibleConversations = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => conversation.title.toLocaleLowerCase().includes(query)
      || conversation.messages.some((message) => message.content.toLocaleLowerCase().includes(query)));
  }, [conversations, searchQuery]);
  const appSlashCommands = useMemo<SlashMenuItem[]>(() => [
    { name: "new", description: t("contentChat.slashNew"), provider: "app", kind: "command", source: "app" },
    { name: "clear", description: t("contentChat.slashClear"), provider: "app", kind: "command", source: "app" },
    { name: "memory", description: t("contentChat.slashMemory"), provider: "app", kind: "command", source: "app" },
    { name: "folder", description: t("contentChat.slashFolder"), provider: "app", kind: "command", source: "app" },
  ], [t]);
  const slashMatch = /^\/([^\s]*)$/.exec(draft);
  const slashMenuOpen = Boolean(slashMatch);
  const slashQuery = slashMatch?.[1].toLocaleLowerCase() ?? "";
  const visibleSlashCommands = useMemo(() => {
    if (!slashMatch) return [];
    return [...appSlashCommands, ...slashCommands]
      .filter((command, index, all) => all.findIndex((item) => item.name.toLocaleLowerCase() === command.name.toLocaleLowerCase()) === index)
      .filter((command) => !slashQuery || command.name.toLocaleLowerCase().includes(slashQuery)
        || command.description.toLocaleLowerCase().includes(slashQuery))
      .slice(0, 30);
  }, [appSlashCommands, slashCommands, slashMatch, slashQuery]);

  useEffect(() => {
    const openFreshConversation = () => {
      if (openedWithFreshConversationRef.current) return;
      openedWithFreshConversationRef.current = true;
      const state = useContentChatStore.getState();
      const current = state.conversations.find((item) => item.id === state.activeConversationId);
      // Một chat đang hoàn toàn trống đã chính là màn hình chat mới; dùng lại để
      // lịch sử không tích tụ thêm mục rỗng sau mỗi lần mở phần AI.
      if (!current || current.messages.length > 0) state.createConversation();
      setEntryReady(true);
    };

    if (useContentChatStore.persist.hasHydrated()) {
      openFreshConversation();
      return;
    }
    return useContentChatStore.persist.onFinishHydration(openFreshConversation);
  }, []);

  const loadWorkspace = useCallback(async (workspacePath?: string | null) => {
    if (!window.contentWorkspace) throw new Error(t("contentChat.desktopOnly"));
    const workspace = await window.contentWorkspace.ensure(workspacePath);
    setWorkspaceInfo(workspace);
    return workspace;
  }, [t]);

  const refreshRuntime = useCallback(async (force = false) => {
    setCheckingRuntime(true);
    try {
      if (force) invalidateCliStatus();
      setStatus(await cachedCliStatus());
    } finally {
      setCheckingRuntime(false);
    }
  }, []);

  useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);

  useEffect(() => registerContentMcpToolHost(), []);

  useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace) return;
    void window.contentWorkspace.ensure(activeConversation?.workspacePath ?? null).then((workspace) => {
      if (!cancelled) setWorkspaceInfo(workspace);
    }).catch((error) => {
      if (!cancelled) toast.error(error instanceof Error ? error.message : String(error));
    });
    return () => { cancelled = true; };
  }, [activeConversation?.id, activeConversation?.workspacePath]);

  useEffect(() => setFilePreview(null), [activeConversation?.id]);

  /**
   * Danh sách model chỉ cần khi user mở dropdown. Trước đây effect này chạy mỗi lần
   * đổi hội thoại (adapter gắn theo hội thoại) và còn tự kích lại chính nó vì
   * `setModel` nằm trong thân effect mà `selectedModels` lại nằm trong deps.
   */
  const loadModels = useCallback(async () => {
    setLoadingModels(true);
    try {
      const result = await cachedCliModels(activeAdapter);
      setAvailableModels(result.models);
      const model = useContentChatStore.getState().models[activeAdapter];
      const efforts = model && result.effortsByModel?.[model]
        ? result.effortsByModel[model]
        : result.efforts ?? [];
      setAvailableEfforts(efforts);
      // Dọn lựa chọn không còn tồn tại ở CLI hiện tại.
      if (model && !result.models.includes(model)) setModel(activeAdapter, "");
      const effort = useContentChatStore.getState().efforts[activeAdapter];
      if (effort && !efforts.includes(effort)) setEffort(activeAdapter, "");
    } catch {
      setAvailableModels([]);
      setAvailableEfforts([]);
    } finally {
      setLoadingModels(false);
    }
  }, [activeAdapter, setEffort, setModel]);

  // Vẫn nạp một lần khi đổi adapter, vì SelectValue cần danh sách mới hiển thị được
  // tên model đang chọn. Nhờ cache nên đổi qua lại giữa các hội thoại cùng adapter
  // không tốn thêm lượt spawn nào.
  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  /**
   * Quét slash command đi đệ quy khắp ~/.claude, ~/.agents, .opencode… và đọc
   * frontmatter từng file .md, đồng bộ trên main process. Chỉ nạp khi user thực sự
   * gõ `/`, và có cache nên gõ đi gõ lại không quét lại.
   */
  useEffect(() => {
    if (!slashMenuOpen) return;
    let cancelled = false;
    void cachedCliCommands(activeAdapter, workspaceInfo?.path).then((result) => {
      if (!cancelled) setSlashCommands(result.commands);
    }).catch(() => {
      if (!cancelled) setSlashCommands([]);
    });
    return () => { cancelled = true; };
  }, [activeAdapter, workspaceInfo?.path, slashMenuOpen]);

  useEffect(() => setSlashSelection(0), [slashQuery, activeAdapter]);

  useEffect(() => {
    if (!slashMenuOpen) return;
    slashItemRefs.current[slashSelection]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
  }, [slashMenuOpen, slashSelection, visibleSlashCommands.length]);

  useLayoutEffect(() => {
    const conversationId = activeConversation?.id ?? null;
    const switched = lastScrolledConversationRef.current !== conversationId;
    lastScrolledConversationRef.current = conversationId;
    if (!entryReady) return;
    // Mở hoặc đổi hội thoại thì nhảy thẳng xuống cuối (cuộn mượt sẽ thấy nó bò từ
    // đầu xuống). Tin mới tới trong lúc đang xem thì vẫn cuộn mượt như cũ.
    endRef.current?.scrollIntoView({ behavior: switched ? "auto" : "smooth", block: "end" });
  }, [activeConversation?.id, activeConversation?.messages.length, entryReady, activeRunText]);

  // Rời khỏi phần AI thì dừng mọi lượt đang chạy — process CLI không nên sống mồ côi.
  useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
    };
  }, []);

  async function sendCompareMessage(prompt: string) {
    if (!prompt || isStreamingA || isStreamingB) return;
    setComparedPrompt(prompt);
    setCompareResponseA("");
    setCompareResponseB("");
    setIsStreamingA(true);
    setIsStreamingB(true);
    setDraft("");

    let workspace: { path: string; memory: string };
    try {
      workspace = await loadWorkspace(activeConversation?.workspacePath ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setIsStreamingA(false);
      setIsStreamingB(false);
      return;
    }

    const runModel = async (
      modelAdapter: ContentCliAdapter,
      modelName: string,
      setStream: React.Dispatch<React.SetStateAction<string>>,
      setEnd: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      let acc = "";
      try {
        const output = await runCliTextTask({
          adapter: modelAdapter,
          prompt,
          model: modelName || undefined,
          sessionKey: `compare:${modelAdapter}:${Date.now()}`,
          timeoutMs: 10 * 60 * 1000,
          workingDirectory: workspace.path,
          enableContentMcp: true,
          onChunk: (chunk) => {
            acc += chunk;
            setStream(acc);
          },
        });
        setStream(acc || output);
      } catch (err: any) {
        if (acc) setStream(acc);
        else setStream(`[Lỗi khi chạy ${modelAdapter}: ${err.message || String(err)}]`);
      } finally {
        setEnd(false);
      }
    };

    void runModel(compareAdapterA, compareModelA, setCompareResponseA, setIsStreamingA);
    void runModel(compareAdapterB, compareModelB, setCompareResponseB, setIsStreamingB);
  }

  async function sendMessage() {
    const prompt = draft.trim();
    if (!prompt || activeIsRunning) return;

    if (splitCompareMode) {
      await sendCompareMessage(prompt);
      return;
    }

    if (!adapterStatus?.available) {
      toast.error(t("contentChat.cliUnavailable", { cli: cliLabel(activeAdapter) }));
      return;
    }

    const conversationId = activeConversation?.id ?? createConversation();
    let workspace: { path: string; memory: string };
    try {
      workspace = await loadWorkspace(activeConversation?.workspacePath ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return;
    }
    addMessage(conversationId, createMessage("user", prompt));
    bindConversationAdapter(conversationId, activeAdapter);
    setDraft("");
    setRunningTexts((current) => ({ ...current, [conversationId]: "" }));
    const controller = new AbortController();
    abortControllersRef.current.set(conversationId, controller);
    let streamedText = "";
    let lastPaintAt = 0;

    try {
      const output = await runCliTextTask({
        adapter: activeAdapter,
        prompt,
        model: selectedModel || undefined,
        effort: selectedEffort || undefined,
        sessionKey: `content-chat:${conversationId}`,
        timeoutMs: 10 * 60 * 1000,
        workingDirectory: workspace.path,
        enableContentMcp: true,
        systemPrompt: [
          activeConversation?.systemPrompt?.trim(),
          workspace.memory.trim(),
        ].filter(Boolean).join("\n\n---\n\n") || undefined,
        signal: controller.signal,
        onChunk: (chunk) => {
          streamedText += chunk;
          // Gom nhịp vẽ. Set state theo từng token nghĩa là parse lại markdown của
          // cả đoạn đã tích luỹ ở mỗi token — càng dài càng đơ theo cấp số nhân.
          const nowMs = Date.now();
          if (nowMs - lastPaintAt < STREAM_PAINT_INTERVAL_MS) return;
          lastPaintAt = nowMs;
          setRunningTexts((current) => ({ ...current, [conversationId]: streamedText }));
        },
        onCommands: (commands) => {
          setSlashCommands(commands);
          primeCliCommands(activeAdapter, workspace.path, commands);
        },
      });
      const finalText = streamedText || output;
      if (finalText.trim()) addMessage(conversationId, createMessage("assistant", finalText));
    } catch (error) {
      if (streamedText.trim()) addMessage(conversationId, createMessage("assistant", streamedText));
      const message = error instanceof Error ? error.message : String(error);
      if (!/cancelled|canceled/i.test(message)) toast.error(message);
    } finally {
      abortControllersRef.current.delete(conversationId);
      setRunningTexts((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });
    }
  }

  /** Chỉ dừng hội thoại đang xem; các hội thoại khác vẫn chạy tiếp. */
  function stopGeneration() {
    if (activeConversation) abortControllersRef.current.get(activeConversation.id)?.abort();
  }

  // useCallback ở đây không phải để tiết kiệm vặt: MessageBubble đã memo, callback
  // đổi identity mỗi render là memo mất tác dụng hoàn toàn.
  const copyMessage = useCallback(async (message: ContentMessage) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    globalThis.setTimeout(() => setCopiedId(""), 1400);
  }, []);

  async function chooseWorkspace() {
    if (!window.contentWorkspace || activeIsRunning || workspaceLocked) return;
    setWorkspaceBusy(true);
    try {
      const result = await window.contentWorkspace.chooseDirectory(workspaceInfo?.path);
      if (result.canceled || !result.path) return;
      const conversationId = activeConversation?.id ?? createConversation();
      setConversationWorkspace(conversationId, result.path);
      setWorkspaceInfo({ path: result.path, memory: result.memory ?? "" });
      toast.success(t("contentChat.workspaceChanged"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function openWorkspaceDirectory() {
    if (!window.contentWorkspace) return;
    try {
      const result = await window.contentWorkspace.openDirectory(activeConversation?.workspacePath ?? null);
      if (!result.success) throw new Error(result.error || t("contentChat.workspaceOpenFailed"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }

  /** `workspaceOverride` cho phép tab Buzz mở file từ workspace của pipeline. */
  const previewWorkspaceFile = useCallback(async (filePath: string, workspaceOverride?: string | null) => {
    if (!window.contentWorkspace) return;
    const workspacePath = workspaceOverride !== undefined
      ? workspaceOverride
      : activeConversationWorkspace;
    setFilePreview({ requestedPath: filePath, loading: true, workspacePath });
    try {
      const result = await window.contentWorkspace.previewFile(workspacePath, filePath);
      setFilePreview({ requestedPath: filePath, loading: false, workspacePath, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFilePreview({ requestedPath: filePath, loading: false, workspacePath, error: message });
      toast.error(message);
    }
  }, [activeConversationWorkspace]);

  async function openPreviewedFile() {
    if (!window.contentWorkspace || !filePreview?.path) return;
    const result = await window.contentWorkspace.openFile(filePreview.workspacePath ?? null, filePreview.path);
    if (!result.success) toast.error(result.error || t("contentChat.fileOpenFailed"));
  }

  async function revealPreviewedFile() {
    if (!window.contentWorkspace || !filePreview?.path) return;
    const result = await window.contentWorkspace.revealFile(filePreview.workspacePath ?? null, filePreview.path);
    if (!result.success) toast.error(result.error || t("contentChat.fileRevealFailed"));
  }

  async function useDefaultWorkspace() {
    if (!window.contentWorkspace || activeIsRunning || workspaceLocked) return;
    setWorkspaceBusy(true);
    try {
      const conversationId = activeConversation?.id ?? createConversation();
      const workspace = await window.contentWorkspace.getDefault();
      setConversationWorkspace(conversationId, null);
      setWorkspaceInfo(workspace);
      toast.success(t("contentChat.defaultWorkspaceRestored"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function openMemory() {
    if (activeIsRunning) return;
    setWorkspaceBusy(true);
    try {
      const workspace = await loadWorkspace(activeConversation?.workspacePath ?? null);
      setMemoryDraft(workspace.memory);
      setMemoryOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function saveMemory() {
    if (!window.contentWorkspace) return;
    setSavingMemory(true);
    try {
      const workspace = await window.contentWorkspace.writeMemory(
        activeConversation?.workspacePath ?? null,
        memoryDraft,
      );
      setWorkspaceInfo(workspace);
      setMemoryOpen(false);
      toast.success(t("contentChat.memorySaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingMemory(false);
    }
  }

  function openSystemPrompt() {
    if (activeIsRunning) return;
    const conversationId = activeConversation?.id ?? createConversation();
    const conversation = useContentChatStore.getState().conversations.find((item) => item.id === conversationId);
    setSystemPromptConversationId(conversationId);
    setSystemPromptDraft(conversation?.systemPrompt ?? "");
    setSystemPromptOpen(true);
  }

  function saveSystemPrompt() {
    if (!systemPromptConversationId) return;
    setConversationSystemPrompt(systemPromptConversationId, systemPromptDraft);
    setSystemPromptOpen(false);
    toast.success(t("contentChat.systemPromptSaved"));
  }

  function submitRenameConversation() {
    const title = renameDraft.trim();
    if (!renameTarget || !title) return;
    renameConversation(renameTarget.id, title);
    setRenameTarget(null);
  }

  function selectSlashCommand(command: SlashMenuItem) {
    if (command.provider === "app") {
      setDraft("");
      if (command.name === "new" || command.name === "clear") createConversation();
      else if (command.name === "memory") void openMemory();
      else if (command.name === "folder") void (workspaceLocked ? openWorkspaceDirectory() : chooseWorkspace());
      return;
    }
    setDraft(`/${command.name} `);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashMatch && visibleSlashCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashSelection((index) => (index + 1) % visibleSlashCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashSelection((index) => (index - 1 + visibleSlashCommands.length) % visibleSlashCommands.length);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft("");
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        selectSlashCommand(visibleSlashCommands[Math.min(slashSelection, visibleSlashCommands.length - 1)]);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex h-full min-h-0 bg-background text-foreground">
      <FeatureRail showCliSettings items={[
        {
          id: "ai",
          icon: Bot,
          label: "AI",
          active: activeTab === "ai",
          onClick: () => setActiveTab("ai"),
        },
        ...(canUseBuzz ? [{
          id: "buzz",
          icon: Radar,
          label: "Buzz",
          active: activeTab === "buzz",
          onClick: () => {
            setActiveTab("buzz");
            setFilePreview(null);
          },
        }] : []),
      ]} />

      {activeTab === "ai" || !canUseBuzz ? (
        <>

      <ConversationSidebar
        collapsed={sidebarCollapsed}
        conversations={visibleConversations}
        activeConversationId={activeConversationId}
        runningTexts={runningTexts}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        locale={locale}
        onToggleSearch={() => {
          setSearchOpen((open) => !open);
          if (searchOpen) setSearchQuery("");
        }}
        onSearchQueryChange={setSearchQuery}
        onCollapse={() => setSidebarCollapsed(true)}
        onNewConversation={() => createConversation()}
        onSelectConversation={selectConversation}
        onTogglePinned={toggleConversationPinned}
        onRename={(id, title) => {
          setRenameTarget({ id, title });
          setRenameDraft(title);
        }}
        onDelete={deleteConversation}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5">
          {sidebarCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSidebarCollapsed(false)}
              title={t("contentChat.expandSidebar")}
              aria-label={t("contentChat.expandSidebar")}
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
          <FeatureHeaderIcon icon={MessageSquareText} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{t("contentChat.title")}</h1>
            <p className="truncate text-2xs text-muted-foreground">{t("contentChat.noInjectedPrompt")}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFileTree ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFileTree((prev) => !prev)}
              className={cn("h-8 gap-1.5 text-2xs font-semibold", showFileTree && "bg-primary text-primary-foreground")}
              title="Bật/Tắt Cây thư mục File Explorer của dự án"
            >
              <FolderTree className="size-3.5" />
              <span className="hidden sm:inline">Files</span>
            </Button>
            <Button
              variant={splitCompareMode ? "default" : "outline"}
              size="sm"
              onClick={() => setSplitCompareMode((prev) => !prev)}
              className={cn("h-8 gap-1.5 text-2xs font-semibold", splitCompareMode && "bg-primary text-primary-foreground")}
              title="Bật/Tắt chế độ so sánh 2 Model song song"
            >
              <Columns2 className="size-3.5" />
              <span className="hidden sm:inline">So Sánh Model</span>
            </Button>
            <span className={cn("size-2 rounded-full", adapterStatus?.available ? "bg-emerald-500" : "bg-destructive")} />
            <Select value={activeAdapter} onValueChange={(value) => setAdapter(value as ContentCliAdapter)} disabled={activeIsRunning || providerLocked}>
              <SelectTrigger className="w-auto min-w-28 max-w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">Claude CLI</SelectItem>
                <SelectItem value="opencode">OpenCode CLI</SelectItem>
                <SelectItem value="codex">Codex CLI</SelectItem>
              </SelectContent>
            </Select>
            {providerLocked && <LockKeyhole className="size-3.5 text-muted-foreground" aria-label={t("contentChat.providerLocked")} />}
            <Button variant="outline" size="icon" onClick={() => void refreshRuntime(true)} disabled={checkingRuntime} title={t("contentChat.refreshCli")}>
              <RefreshCw className={cn("size-4", checkingRuntime && "animate-spin")} />
            </Button>
          </div>
        </header>

        {splitCompareMode ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <ModelComparisonView
              prompt={comparedPrompt}
              adapterA={compareAdapterA}
              adapterB={compareAdapterB}
              modelA={compareModelA}
              modelB={compareModelB}
              responseA={compareResponseA}
              responseB={compareResponseB}
              isStreamingA={isStreamingA}
              isStreamingB={isStreamingB}
              onSelectAdapterA={setCompareAdapterA}
              onSelectAdapterB={setCompareAdapterB}
              onSelectModelA={setCompareModelA}
              onSelectModelB={setCompareModelB}
              onPickResponse={(chosenAdapter, chosenModel, chosenContent) => {
                const conversationId = activeConversation?.id ?? createConversation();
                addMessage(conversationId, createMessage("user", comparedPrompt));
                addMessage(conversationId, createMessage("assistant", chosenContent));
                bindConversationAdapter(conversationId, chosenAdapter);
                if (chosenModel) {
                  setModel(chosenAdapter, chosenModel);
                }
                setSplitCompareMode(false);
                toast.success(`Đã thêm câu trả lời từ ${cliLabel(chosenAdapter, true)} vào hội thoại!`);
              }}
              onClose={() => setSplitCompareMode(false)}
            />
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-6">
              {!entryReady || !activeConversation || activeConversation.messages.length === 0 ? (
                <div className="m-auto max-w-md px-4 py-10 text-center">
                  <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareText className="size-5" />
                  </div>
                  <h2 className="text-lg font-semibold">{t("contentChat.emptyTitle")}</h2>
                  <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{t("contentChat.emptyDescription")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeConversation.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      copied={copiedId === message.id}
                      onCopy={copyMessage}
                      onOpenFile={previewWorkspaceFile}
                      workspacePath={activeConversation.workspacePath ?? null}
                    />
                  ))}
                  {activeRunText !== undefined && (
                    <StreamingBubble text={activeRunText} />
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <footer className="shrink-0 bg-background px-5 pb-3 pt-2">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative rounded-2xl border border-input bg-card p-2 shadow-sm transition focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/25">
              {slashMatch && (
                <SlashCommandMenu
                  adapter={activeAdapter}
                  commands={visibleSlashCommands}
                  selection={slashSelection}
                  itemRefs={slashItemRefs}
                  onSelect={selectSlashCommand}
                  onHover={setSlashSelection}
                />
              )}
              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={t("contentChat.placeholder")}
                disabled={activeIsRunning}
                className="max-h-36 min-h-12 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between gap-3 pt-1">
                <ComposerToolbar
                  running={activeIsRunning}
                  workspaceBusy={workspaceBusy}
                  workspaceLocked={workspaceLocked}
                  workspacePath={workspaceInfo?.path}
                  conversationWorkspacePath={activeConversationWorkspace}
                  selectedModel={selectedModel}
                  selectedEffort={selectedEffort}
                  availableModels={availableModels}
                  availableEfforts={availableEfforts}
                  loadingModels={loadingModels}
                  locale={locale}
                  onOpenSystemPrompt={openSystemPrompt}
                  onWorkspaceClick={() => void (workspaceLocked ? openWorkspaceDirectory() : chooseWorkspace())}
                  onOpenMemory={() => void openMemory()}
                  onUseDefaultWorkspace={() => void useDefaultWorkspace()}
                  onModelChange={(model) => setModel(activeAdapter, model)}
                  onEffortChange={(effort) => setEffort(activeAdapter, effort)}
                  onLoadModels={() => void loadModels()}
                />
                {activeIsRunning ? (
                  <Button size="icon" variant="destructive" className="size-9 shrink-0 rounded-xl" onClick={stopGeneration} title={t("contentChat.stop")}>
                    <Square className="size-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button size="icon" className="size-9 shrink-0 rounded-xl" onClick={() => void sendMessage()} disabled={!draft.trim() || !adapterStatus?.available} title={t("contentChat.send")}>
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", adapterStatus?.available ? "bg-emerald-500" : "bg-destructive")} />
              <span>{adapterStatus?.available
                ? t("contentChat.connected", { cli: cliLabel(activeAdapter, true) })
                : t("contentChat.disconnected")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("contentChat.inputHint")}</span>
            </div>
          </div>
        </footer>
      </main>

        </>
      ) : (
        <BuzzView
          onOpenFile={(workspacePath, filePath) => void previewWorkspaceFile(filePath, workspacePath)}
        />
      )}

      {filePreview && (
        <FilePreviewPanel
          preview={filePreview}
          onClose={() => setFilePreview(null)}
          onOpen={() => void openPreviewedFile()}
          onReveal={() => void revealPreviewedFile()}
        />
      )}

      {showFileTree && (
        <WorkspaceFileTree
          workspacePath={workspaceInfo?.path ?? activeConversationWorkspace}
          onOpenFile={previewWorkspaceFile}
          onOpenDirectory={openWorkspaceDirectory}
          onClose={() => setShowFileTree(false)}
        />
      )}

      <MemoryDialog
        open={memoryOpen}
        onOpenChange={setMemoryOpen}
        workspacePath={workspaceInfo?.path}
        draft={memoryDraft}
        onDraftChange={setMemoryDraft}
        saving={savingMemory}
        onSave={() => void saveMemory()}
      />

      <SystemPromptDialog
        open={systemPromptOpen}
        onOpenChange={setSystemPromptOpen}
        draft={systemPromptDraft}
        onDraftChange={setSystemPromptDraft}
        onSave={saveSystemPrompt}
      />

      <RenameConversationDialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        draft={renameDraft}
        onDraftChange={setRenameDraft}
        onSubmit={submitRenameConversation}
      />
    </div>
  );
}
