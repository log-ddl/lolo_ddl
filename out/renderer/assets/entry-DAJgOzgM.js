import { j as jsxRuntimeExports, u as shimExports, r as reactDomExports } from "./radix-ui-G3HX32g5.js";
import { r as reactExports, K as Plus, a9 as Bot, L as LoaderCircle, d as Trash2, g as getDefaultExportFromCjs, R as React$1, aa as Type, x as FileText, a7 as FolderOpen, ab as Merge, ac as GitBranch, ad as Repeat2, _ as Play, ae as Ellipsis, X, af as Search, ag as GripVertical, ah as Maximize, ai as ZoomIn, aj as ZoomOut, ak as Paintbrush, al as Files, v as ExternalLink, am as ThumbsUp, an as ThumbsDown, u as CircleAlert, $ as CircleX, t as CircleCheck, ao as UserCheck, ap as ScanEye, aq as CircleDashed, ar as PanelLeftClose, a6 as Copy, as as History, at as PanelLeftOpen, au as Radar, av as Workflow, aw as commonjsGlobal, ax as FileCodeCorner, U as UserRound, a3 as Check, ay as Pin, az as PinOff, P as Pencil, aA as Command, aB as RotateCcw, n as LockKeyhole, M as MessageSquareText, q as RefreshCw, aC as Square, aD as Send } from "./lucide-react-DHCwBhKI.js";
import { s as getCliRuntimeStatus, v as getCliModels, w as getCliCommands, f as fileStorage, p as persist, d as createJSONStorage, g as generateUUID, x as runCliTextTask, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, y as DialogDescription, B as Button, c as cn, I as Input, t as toast, a as useI18n, k as DialogFooter, u as useLicenseStore, F as FeatureRail, h as hasPlanAccess } from "./index-ld1jMZXM.js";
import { F as FeatureHeaderIcon } from "./FeatureHeaderIcon-DurhyC1w.js";
import { S as ScrollArea, D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-D7DihKO-.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-ZlGxq1Za.js";
import { T as Textarea } from "./textarea-COLWDImR.js";
import { c as create$2 } from "./zustand-DnVmcEKu.js";
import { d as discoverYouTubeVideos, e as extractYouTubeVideoId, l as loadAllVideoComments, u as useResearchStore } from "./youtube-api-S-9TP3wu.js";
import { L as Label } from "./label-DOUrVQeY.js";
import { B as Badge } from "./badge-DGXWRPZx.js";
import "./supabase-DI0hoIb9.js";
import "./cors-fetch-CkwbEcad.js";
const STATUS_TTL_MS = 3e4;
const MODELS_TTL_MS = 5 * 6e4;
const COMMANDS_TTL_MS = 1500;
function readThrough(store, key, ttlMs, load) {
  const now2 = Date.now();
  const entry = store.get(key);
  if (entry?.inflight) return entry.inflight;
  if (entry && entry.value !== void 0 && entry.expiresAt > now2) {
    return Promise.resolve(entry.value);
  }
  const inflight2 = load().then((value) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }).catch((error) => {
    store.delete(key);
    throw error;
  });
  store.set(key, { ...entry, expiresAt: now2 + ttlMs, inflight: inflight2 });
  return inflight2;
}
const statusCache = /* @__PURE__ */ new Map();
const modelsCache = /* @__PURE__ */ new Map();
const commandsCache = /* @__PURE__ */ new Map();
function cachedCliStatus() {
  return readThrough(statusCache, "status", STATUS_TTL_MS, getCliRuntimeStatus);
}
function invalidateCliStatus() {
  statusCache.delete("status");
}
function cachedCliModels(adapter) {
  return readThrough(modelsCache, adapter, MODELS_TTL_MS, () => getCliModels(adapter));
}
function cachedCliCommands(adapter, workingDirectory) {
  return readThrough(
    commandsCache,
    `${adapter}\0${workingDirectory ?? ""}`,
    COMMANDS_TTL_MS,
    () => getCliCommands(adapter, workingDirectory)
  );
}
function primeCliCommands(adapter, workingDirectory, commands) {
  commandsCache.set(`${adapter}\0${workingDirectory ?? ""}`, {
    value: { commands },
    expiresAt: Date.now() + COMMANDS_TTL_MS
  });
}
const pending = /* @__PURE__ */ new Map();
let inflight = Promise.resolve();
function writeNow(name2) {
  const entry = pending.get(name2);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(name2);
  inflight = inflight.catch(() => void 0).then(() => entry.target.setItem(name2, entry.value));
}
function createDebouncedStorage(target, delayMs = 400) {
  return {
    getItem: (name2) => {
      const entry = pending.get(name2);
      if (entry) return Promise.resolve(entry.value);
      return target.getItem(name2);
    },
    setItem: (name2, value) => {
      const entry = pending.get(name2);
      if (entry) clearTimeout(entry.timer);
      pending.set(name2, {
        value,
        target,
        timer: setTimeout(() => writeNow(name2), delayMs)
      });
    },
    removeItem: (name2) => {
      const entry = pending.get(name2);
      if (entry) {
        clearTimeout(entry.timer);
        pending.delete(name2);
      }
      return target.removeItem(name2);
    }
  };
}
function flushPendingWrites() {
  for (const name2 of [...pending.keys()]) writeNow(name2);
  return inflight;
}
if (typeof window !== "undefined") {
  window.fileStorage?.onFlushRequest?.(() => void flushPendingWrites());
  window.addEventListener("beforeunload", () => void flushPendingWrites());
  window.addEventListener("pagehide", () => void flushPendingWrites());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushPendingWrites();
  });
  window.addEventListener("blur", () => void flushPendingWrites());
}
const debouncedFileStorage = createDebouncedStorage(fileStorage);
function newConversation() {
  const now2 = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Cuộc trò chuyện mới",
    createdAt: now2,
    updatedAt: now2,
    messages: [],
    workspacePath: null,
    adapter: null,
    systemPrompt: "",
    pinned: false,
    customTitle: false
  };
}
function titleFromMessage(content2) {
  const oneLine = content2.replace(/\s+/g, " ").trim();
  return oneLine.length > 48 ? `${oneLine.slice(0, 48).trim()}…` : oneLine;
}
function sortConversations(conversations) {
  return [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}
const useContentChatStore = create$2()(
  persist(
    (set2) => ({
      conversations: [],
      activeConversationId: null,
      adapter: "claude",
      models: { claude: "", opencode: "", codex: "" },
      efforts: { claude: "", opencode: "", codex: "" },
      createConversation: () => {
        const conversation = newConversation();
        set2((state) => ({
          conversations: sortConversations([conversation, ...state.conversations]),
          activeConversationId: conversation.id
        }));
        return conversation.id;
      },
      selectConversation: (activeConversationId) => set2({ activeConversationId }),
      deleteConversation: (id2) => set2((state) => {
        const conversations = state.conversations.filter((item) => item.id !== id2);
        return {
          conversations,
          activeConversationId: state.activeConversationId === id2 ? conversations[0]?.id ?? null : state.activeConversationId
        };
      }),
      addMessage: (conversationId, message) => set2((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          const isFirstUserMessage = message.role === "user" && !conversation.messages.some((item) => item.role === "user");
          return {
            ...conversation,
            title: isFirstUserMessage && !conversation.customTitle ? titleFromMessage(message.content) : conversation.title,
            updatedAt: Date.now(),
            messages: [...conversation.messages, message]
          };
        }))
      })),
      setAdapter: (adapter) => set2({ adapter }),
      setModel: (adapter, model) => set2((state) => ({
        models: { ...state.models, [adapter]: model }
      })),
      setEffort: (adapter, effort) => set2((state) => ({
        efforts: { ...state.efforts, [adapter]: effort }
      })),
      setConversationWorkspace: (conversationId, workspacePath) => set2((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, workspacePath, updatedAt: Date.now() } : conversation))
      })),
      bindConversationAdapter: (conversationId, adapter) => set2((state) => ({
        conversations: state.conversations.map((conversation) => conversation.id === conversationId && !conversation.adapter ? { ...conversation, adapter } : conversation)
      })),
      setConversationSystemPrompt: (conversationId, systemPrompt) => set2((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, systemPrompt, updatedAt: Date.now() } : conversation))
      })),
      renameConversation: (conversationId, title) => set2((state) => ({
        conversations: state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, title: title.trim(), customTitle: true } : conversation)
      })),
      toggleConversationPinned: (conversationId) => set2((state) => ({
        conversations: sortConversations(state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, pinned: !conversation.pinned } : conversation))
      }))
    }),
    {
      name: "longdd-content-chat",
      storage: createJSONStorage(() => debouncedFileStorage),
      version: 7,
      migrate: (persisted) => {
        const state = persisted;
        return {
          ...state,
          models: { claude: "", opencode: "", codex: "", ...state?.models ?? {} },
          efforts: { claude: "", opencode: "", codex: "", ...state?.efforts ?? {} },
          conversations: (state?.conversations ?? []).map((conversation) => ({
            ...conversation,
            workspacePath: conversation.workspacePath ?? null,
            adapter: conversation.adapter ?? (conversation.messages.length > 0 ? state?.adapter ?? "claude" : null),
            systemPrompt: conversation.systemPrompt ?? "",
            pinned: conversation.pinned ?? false,
            customTitle: conversation.customTitle ?? false
          }))
        };
      },
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        adapter: state.adapter,
        models: state.models,
        efforts: state.efforts
      })
    }
  )
);
function requiredText(args, key) {
  const value = typeof args[key] === "string" ? args[key].trim() : "";
  if (!value) throw new Error(`${key} is required`);
  return value;
}
function integer(args, key, fallback, min, max) {
  const value = Number(args[key] ?? fallback);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
}
function youtubeApiKey() {
  const key = useResearchStore.getState().apiKey.trim();
  if (!key) throw new Error("YouTube API key is not configured. Add it in Research > Settings, then retry.");
  return key;
}
function youtubeUrl(input) {
  const id2 = extractYouTubeVideoId(input);
  if (!id2) throw new Error("Invalid YouTube URL or video ID");
  return `https://www.youtube.com/watch?v=${id2}`;
}
function plainTextFromSrt(srt) {
  return srt.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() && !/^\d+$/.test(line.trim()) && !/-->/.test(line)).join("\n").replace(/<[^>]+>/g, "").trim();
}
async function searchYouTube(args) {
  const query = requiredText(args, "query");
  const kind = args.kind === "Shorts" || args.kind === "Live" ? args.kind : "Long";
  const order2 = args.order === "viewCount" ? "viewCount" : "relevance";
  const duration = args.duration === "short" || args.duration === "medium" || args.duration === "long" ? args.duration : void 0;
  const limit = integer(args, "limit", 10, 1, 50);
  const result = await discoverYouTubeVideos(
    youtubeApiKey(),
    query,
    kind,
    void 0,
    typeof args.publishedAfter === "string" ? args.publishedAfter : void 0,
    typeof args.publishedBefore === "string" ? args.publishedBefore : void 0,
    order2,
    duration
  );
  return {
    query,
    totalResults: result.totalResults,
    returned: Math.min(limit, result.videos.length),
    videos: result.videos.slice(0, limit).map((video) => ({
      id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.title,
      channel: video.channelTitle,
      publishedAt: video.publishedAt,
      duration: video.duration,
      kind: video.kind,
      views: video.viewCount,
      likes: video.likeCount,
      comments: video.commentCount,
      subscribers: video.subscriberCount,
      viewsPerHour: video.viewsPerHour,
      outlier: video.outlier,
      description: video.description
    }))
  };
}
async function getComments(args) {
  const input = requiredText(args, "video");
  const id2 = extractYouTubeVideoId(input);
  if (!id2) throw new Error("Invalid YouTube URL or video ID");
  const limit = integer(args, "limit", 200, 1, 500);
  const comments = await loadAllVideoComments(youtubeApiKey(), id2);
  return {
    videoId: id2,
    videoUrl: `https://www.youtube.com/watch?v=${id2}`,
    totalLoaded: comments.length,
    returned: Math.min(limit, comments.length),
    truncated: comments.length > limit,
    comments: comments.slice(0, limit)
  };
}
async function getTranscript(args) {
  if (!window.mediaToolkit) throw new Error("Media Toolkit is only available in the desktop app");
  const url = youtubeUrl(requiredText(args, "video"));
  const jobId = `content-mcp-transcript-${crypto.randomUUID()}`;
  const analysis = await window.mediaToolkit.analyze({ jobId, url });
  if (!analysis.success || !analysis.info) throw new Error(analysis.error || "Unable to inspect this video");
  const preferred = typeof args.language === "string" ? args.language.trim().toLowerCase() : "";
  const tracks = analysis.info.subtitles;
  const track = tracks.find((item) => item.language.toLowerCase() === preferred && !item.automatic) || tracks.find((item) => item.language.toLowerCase() === preferred) || tracks.find((item) => preferred && item.language.toLowerCase().startsWith(`${preferred}-`)) || tracks.find((item) => !item.automatic) || tracks[0];
  if (!track) throw new Error("This video has no available subtitles or automatic captions");
  const contentState = useContentChatStore.getState();
  const activeConversation = contentState.conversations.find((item) => item.id === contentState.activeConversationId);
  const workspace = await window.contentWorkspace?.ensure(activeConversation?.workspacePath ?? null);
  const result = await window.mediaToolkit.download({
    jobId,
    url,
    kind: "subtitle",
    outputDirectory: workspace?.path,
    subtitleLanguage: track.language,
    includeAutomatic: true
  });
  if (!result.success || !result.srt) throw new Error(result.error || "Unable to download the transcript");
  const includeTimestamps = args.includeTimestamps === true;
  return {
    videoId: analysis.info.id,
    videoUrl: url,
    title: analysis.info.title,
    language: track.language,
    automatic: track.automatic,
    format: includeTimestamps ? "srt" : "text",
    transcript: includeTimestamps ? result.srt : plainTextFromSrt(result.srt),
    savedFile: result.filePath
  };
}
async function executeTool(name2, args) {
  if (name2 === "search_youtube") return searchYouTube(args);
  if (name2 === "get_youtube_comments") return getComments(args);
  if (name2 === "get_youtube_transcript") return getTranscript(args);
  throw new Error(`Unknown tool: ${name2}`);
}
function registerContentMcpToolHost() {
  if (!window.contentMcp) return () => void 0;
  window.contentMcp.ready();
  return window.contentMcp.onToolCall((request) => {
    void executeTool(request.name, request.arguments ?? {}).then((result) => window.contentMcp?.respond({ requestId: request.requestId, success: true, result })).catch((error) => window.contentMcp?.respond({
      requestId: request.requestId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }));
  });
}
const MAX_STEP_RUNS = 60;
const MAX_STORED_OUTPUT = 2e4;
const MAX_JUDGE_INPUT = 24e3;
function emptyRule() {
  return {
    requireOutputFile: true,
    minLength: 0,
    mustMatch: "",
    mustNotMatch: "",
    jsonValid: false
  };
}
function emptyGate() {
  return { kind: "none", rule: emptyRule(), judgeAgentId: "", judgePrompt: "" };
}
const ADAPTER_LABELS = {
  claude: "Claude CLI",
  opencode: "OpenCode CLI",
  codex: "Codex CLI"
};
function now$1() {
  return Date.now();
}
function newStep(agentId, index2) {
  return {
    id: generateUUID(),
    name: `Bước ${index2 + 1}`,
    position: { x: 80 + index2 * 300, y: 120 },
    topicInput: index2 === 0,
    agentId,
    prompt: "",
    outputKind: "text",
    outputFile: "",
    inputStepIds: [],
    gate: { ...emptyGate(), position: { x: 350 + index2 * 300, y: 120 } },
    onFail: "stop",
    maxRetries: 2,
    gotoStepId: ""
  };
}
const useBuzzStore = create$2()(
  persist(
    (set2, get2) => ({
      agents: [],
      pipelines: [],
      runs: [],
      activePipelineId: null,
      activeRunId: null,
      hydrated: false,
      createAgent: (agent) => {
        const id2 = generateUUID();
        set2((state) => ({
          agents: [
            ...state.agents,
            {
              id: id2,
              name: "Agent mới",
              role: "",
              adapter: "claude",
              model: "",
              effort: "",
              systemPrompt: "",
              createdAt: now$1(),
              updatedAt: now$1(),
              ...agent
            }
          ]
        }));
        return id2;
      },
      updateAgent: (id2, patch2) => set2((state) => ({
        agents: state.agents.map((agent) => agent.id === id2 ? { ...agent, ...patch2, updatedAt: now$1() } : agent)
      })),
      deleteAgent: (id2) => set2((state) => ({
        agents: state.agents.filter((agent) => agent.id !== id2),
        // Gỡ agent khỏi mọi step/gate đang trỏ tới nó để pipeline không trỏ vào khoảng không.
        pipelines: state.pipelines.map((pipeline) => ({
          ...pipeline,
          steps: pipeline.steps.map((step) => ({
            ...step,
            agentId: step.agentId === id2 ? "" : step.agentId,
            gate: step.gate.judgeAgentId === id2 ? { ...step.gate, judgeAgentId: "" } : step.gate
          }))
        }))
      })),
      createPipeline: (name2) => {
        const id2 = generateUUID();
        set2((state) => ({
          pipelines: [
            ...state.pipelines,
            {
              id: id2,
              name: name2 || "Pipeline mới",
              description: "",
              steps: [],
              inputNodes: [],
              functionNodes: [],
              connections: [],
              workspacePath: null,
              createdAt: now$1(),
              updatedAt: now$1()
            }
          ],
          activePipelineId: id2
        }));
        return id2;
      },
      updatePipeline: (id2, patch2) => set2((state) => ({
        pipelines: state.pipelines.map((pipeline) => pipeline.id === id2 ? { ...pipeline, ...patch2, updatedAt: now$1() } : pipeline)
      })),
      deletePipeline: (id2) => set2((state) => {
        const pipelines = state.pipelines.filter((pipeline) => pipeline.id !== id2);
        return {
          pipelines,
          activePipelineId: state.activePipelineId === id2 ? pipelines[0]?.id ?? null : state.activePipelineId
        };
      }),
      duplicatePipeline: (id2) => {
        const source = get2().pipelines.find((pipeline) => pipeline.id === id2);
        if (!source) return null;
        const newId2 = generateUUID();
        const allNodeIds = [
          ...source.steps.map((step) => step.id),
          ...(source.inputNodes ?? []).map((node2) => node2.id),
          ...(source.functionNodes ?? []).map((node2) => node2.id)
        ];
        const idMap = new Map(allNodeIds.map((nodeId) => [nodeId, generateUUID()]));
        set2((state) => ({
          pipelines: [
            ...state.pipelines,
            {
              ...source,
              id: newId2,
              name: `${source.name} (bản sao)`,
              createdAt: now$1(),
              updatedAt: now$1(),
              inputNodes: (source.inputNodes ?? []).map((node2) => ({ ...node2, id: idMap.get(node2.id) })),
              functionNodes: (source.functionNodes ?? []).map((node2) => ({ ...node2, id: idMap.get(node2.id) })),
              connections: (source.connections ?? []).flatMap((connection) => {
                const mappedSource = idMap.get(connection.source);
                const mappedTarget = idMap.get(connection.target);
                return mappedSource && mappedTarget ? [{ ...connection, id: generateUUID(), source: mappedSource, target: mappedTarget }] : [];
              }),
              steps: source.steps.map((step) => ({
                ...step,
                id: idMap.get(step.id),
                inputStepIds: step.inputStepIds.map((stepId) => idMap.get(stepId)).filter((v) => Boolean(v)),
                gotoStepId: idMap.get(step.gotoStepId) ?? ""
              }))
            }
          ],
          activePipelineId: newId2
        }));
        return newId2;
      },
      selectPipeline: (activePipelineId) => set2({ activePipelineId }),
      addStep: (pipelineId) => set2((state) => ({
        pipelines: state.pipelines.map((pipeline) => {
          if (pipeline.id !== pipelineId) return pipeline;
          const fallbackAgent = state.agents[0]?.id ?? "";
          return {
            ...pipeline,
            steps: [...pipeline.steps, newStep(fallbackAgent, pipeline.steps.length)],
            updatedAt: now$1()
          };
        })
      })),
      updateStep: (pipelineId, stepId, patch2) => set2((state) => ({
        pipelines: state.pipelines.map((pipeline) => pipeline.id === pipelineId ? {
          ...pipeline,
          updatedAt: now$1(),
          steps: pipeline.steps.map((step) => step.id === stepId ? { ...step, ...patch2 } : step)
        } : pipeline)
      })),
      removeStep: (pipelineId, stepId) => set2((state) => ({
        pipelines: state.pipelines.map((pipeline) => pipeline.id === pipelineId ? {
          ...pipeline,
          updatedAt: now$1(),
          steps: pipeline.steps.filter((step) => step.id !== stepId).map((step) => ({
            ...step,
            inputStepIds: step.inputStepIds.filter((id2) => id2 !== stepId),
            gotoStepId: step.gotoStepId === stepId ? "" : step.gotoStepId
          }))
        } : pipeline)
      })),
      moveStep: (pipelineId, stepId, direction) => set2((state) => ({
        pipelines: state.pipelines.map((pipeline) => {
          if (pipeline.id !== pipelineId) return pipeline;
          const index2 = pipeline.steps.findIndex((step) => step.id === stepId);
          const target = direction === "up" ? index2 - 1 : index2 + 1;
          if (index2 < 0 || target < 0 || target >= pipeline.steps.length) return pipeline;
          const steps = [...pipeline.steps];
          [steps[index2], steps[target]] = [steps[target], steps[index2]];
          return { ...pipeline, steps, updatedAt: now$1() };
        })
      })),
      createRun: (run) => set2((state) => ({
        // Giữ 20 lần chạy gần nhất, cũ hơn thì bỏ để store không phình.
        runs: [run, ...state.runs].slice(0, 20),
        activeRunId: run.id
      })),
      patchRun: (runId, patch2) => set2((state) => ({
        runs: state.runs.map((run) => run.id === runId ? { ...run, ...patch2 } : run)
      })),
      patchRunStep: (runId, stepId, patch2) => set2((state) => ({
        runs: state.runs.map((run) => run.id === runId ? { ...run, steps: run.steps.map((step) => step.stepId === stepId ? { ...step, ...patch2 } : step) } : run)
      })),
      setRunStatus: (runId, status, error) => set2((state) => ({
        runs: state.runs.map((run) => run.id === runId ? {
          ...run,
          status,
          error: error ?? run.error,
          finishedAt: status === "done" || status === "failed" ? now$1() : run.finishedAt
        } : run)
      })),
      deleteRun: (runId) => set2((state) => ({
        runs: state.runs.filter((run) => run.id !== runId),
        activeRunId: state.activeRunId === runId ? null : state.activeRunId
      })),
      clearRuns: () => set2({ runs: [], activeRunId: null }),
      selectRun: (activeRunId2) => set2({ activeRunId: activeRunId2 })
    }),
    {
      name: "longdd-buzz",
      storage: createJSONStorage(() => debouncedFileStorage),
      version: 5,
      migrate: (persisted) => {
        const state = persisted;
        return {
          ...state,
          pipelines: (state?.pipelines ?? []).map((pipeline) => {
            const legacyInputId = `input-topic:${pipeline.id}`;
            const steps = (pipeline.steps ?? []).map((step, index2) => {
              const position2 = step.position ?? { x: 80 + index2 * 300, y: 120 };
              return {
                ...step,
                position: position2,
                outputKind: step.outputKind ?? (step.outputFile?.trim() ? "file" : "text"),
                topicInput: step.topicInput ?? /\{\{\s*topic\s*\}\}/.test(step.prompt),
                gate: {
                  ...step.gate,
                  position: step.gate.position ?? { x: position2.x + 300, y: position2.y }
                }
              };
            });
            const legacyPosition = pipeline.inputPosition;
            const needsLegacyInput = !pipeline.inputNodes && steps.some((step) => step.topicInput);
            const inputNodes = pipeline.inputNodes ?? (needsLegacyInput ? [{
              id: legacyInputId,
              type: "input",
              kind: "text",
              name: "Đề bài",
              position: legacyPosition ?? { x: -240, y: 120 },
              value: "",
              path: ""
            }] : []);
            const legacyConnections = pipeline.connections ?? [
              ...steps.filter((step) => step.topicInput).map((step) => ({
                id: generateUUID(),
                source: legacyInputId,
                target: step.id
              })),
              ...steps.flatMap((step) => step.inputStepIds.map((source) => ({
                id: generateUUID(),
                source,
                target: step.id
              })))
            ];
            const validNodeIds = /* @__PURE__ */ new Set([
              ...steps.map((step) => step.id),
              ...inputNodes.map((node2) => node2.id),
              ...(pipeline.functionNodes ?? []).map((node2) => node2.id)
            ]);
            const seenConnections = /* @__PURE__ */ new Set();
            const connections = legacyConnections.flatMap((connection) => {
              if (connection.target.startsWith("gate:")) return [];
              const rawSource = connection.source === "input:topic" ? legacyInputId : connection.source.startsWith("gate:") ? connection.source.slice(5) : connection.source;
              if (!validNodeIds.has(rawSource) || !validNodeIds.has(connection.target)) return [];
              const key = `${rawSource}>${connection.target}`;
              if (seenConnections.has(key)) return [];
              seenConnections.add(key);
              return [{ ...connection, id: generateUUID(), source: rawSource, target: connection.target }];
            });
            return {
              ...pipeline,
              steps,
              inputNodes,
              functionNodes: (pipeline.functionNodes ?? []).map((node2) => ({
                ...node2,
                field: node2.field ?? "",
                operator: node2.operator ?? "truthy",
                compareValue: node2.compareValue ?? "",
                maxIterations: node2.maxIterations ?? (node2.kind === "condition" ? 10 : 3)
              })),
              connections
            };
          })
        };
      },
      partialize: (state) => ({
        agents: state.agents,
        pipelines: state.pipelines,
        runs: state.runs,
        activePipelineId: state.activePipelineId
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error("[Buzz] Không đọc được dữ liệu đã lưu:", error);
        useBuzzStore.setState({
          hydrated: true,
          // Tiến trình chạy chết theo process. Đánh dấu lại để user biết cần chạy lại.
          // Dùng ?? [] vì file cũ có thể thiếu khoá — thiếu guard là hydrate ném lỗi
          // và store rơi về rỗng, đúng nghĩa mất dữ liệu.
          runs: (state?.runs ?? []).map((run) => run.status === "running" || run.status === "awaiting" ? {
            ...run,
            status: "paused",
            steps: (run.steps ?? []).map((step) => step.status === "running" || step.status === "checking" || step.status === "awaiting" ? { ...step, status: "pending" } : step)
          } : run),
          agents: state?.agents ?? [],
          pipelines: state?.pipelines ?? []
        });
      }
    }
  )
);
function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max)}
…(đã cắt bớt)` : value;
}
function stableFingerprint(value) {
  const input = JSON.stringify(value);
  let first = 2166136261;
  let second = 2654435769;
  for (let index2 = 0; index2 < input.length; index2 += 1) {
    const code2 = input.charCodeAt(index2);
    first = Math.imul(first ^ code2, 16777619);
    second = Math.imul(second ^ code2, 2246822507);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}
async function prepareRunInputManifest(pipeline, workspacePath) {
  const connectedSources = new Set((pipeline.connections ?? []).map((connection) => connection.source));
  const pathInputs = (pipeline.inputNodes ?? []).filter((input) => input.kind !== "text" && input.path.trim() && connectedSources.has(input.id)).map((input) => ({ id: input.id, name: input.name, kind: input.kind, path: input.path.trim() }));
  if (pathInputs.length === 0) return [];
  if (!window.contentWorkspace?.prepareBuzzInputs) throw new Error("Runtime hiện tại chưa hỗ trợ quét file/folder đầu vào.");
  return window.contentWorkspace.prepareBuzzInputs(workspacePath, pathInputs);
}
function createPipelineFingerprint(pipeline, agents, manifest) {
  const usedAgentIds = new Set(pipeline.steps.flatMap((step) => [step.agentId, step.gate.judgeAgentId]).filter(Boolean));
  return stableFingerprint({
    pipelineId: pipeline.id,
    workspacePath: pipeline.workspacePath,
    inputs: (pipeline.inputNodes ?? []).map(({ id: id2, kind, name: name2, value, path: path2 }) => ({ id: id2, kind, name: name2, value, path: path2 })),
    inputArtifacts: manifest.map(({ nodeId, fingerprint, resolvedPath }) => ({ nodeId, fingerprint, resolvedPath })),
    functions: (pipeline.functionNodes ?? []).map(({ id: id2, kind, name: name2, field, operator, compareValue, maxIterations }) => ({ id: id2, kind, name: name2, field, operator, compareValue, maxIterations })),
    connections: (pipeline.connections ?? []).map(({ source, target, sourceHandle, loop }) => ({ source, target, sourceHandle, loop })),
    steps: pipeline.steps.map(({ position: _position, gate, ...step }) => ({ ...step, gate: { ...gate, position: void 0 } })),
    agents: agents.filter((agent) => usedAgentIds.has(agent.id)).map(({ updatedAt: _updatedAt, createdAt: _createdAt, ...agent }) => agent)
  });
}
function createNodeFingerprints(pipeline, agents, manifest) {
  const manifestByNode = new Map(manifest.map((item) => [item.nodeId, item.fingerprint]));
  const incoming = /* @__PURE__ */ new Map();
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue;
    incoming.set(connection.target, [...incoming.get(connection.target) ?? [], connection]);
  }
  const inputsById = new Map((pipeline.inputNodes ?? []).map((node2) => [node2.id, node2]));
  const functionsById = new Map((pipeline.functionNodes ?? []).map((node2) => [node2.id, node2]));
  const stepsById = new Map(pipeline.steps.map((step) => [step.id, step]));
  const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
  const memo = /* @__PURE__ */ new Map();
  const visit2 = (id2, trail2) => {
    const cached = memo.get(id2);
    if (cached) return cached;
    if (trail2.has(id2)) return "cycle";
    trail2.add(id2);
    const sources = (incoming.get(id2) ?? []).map((connection) => `${visit2(connection.source, trail2)}:${connection.sourceHandle ?? ""}`).sort();
    trail2.delete(id2);
    const input = inputsById.get(id2);
    const fn = functionsById.get(id2);
    const step = stepsById.get(id2);
    const payload = input ? { kind: input.kind, name: input.name, value: input.value, path: input.path, artifact: manifestByNode.get(id2) ?? "" } : fn ? { kind: fn.kind, name: fn.name, field: fn.field, operator: fn.operator, compareValue: fn.compareValue, maxIterations: fn.maxIterations, sources } : step ? (() => {
      const { position: _position, gate: _gate, ...config } = step;
      const agent = agentsById.get(step.agentId);
      return {
        ...config,
        agent: agent ? { name: agent.name, adapter: agent.adapter, model: agent.model, effort: agent.effort, systemPrompt: agent.systemPrompt } : null,
        sources
      };
    })() : { missing: id2 };
    const fingerprint = stableFingerprint(payload);
    memo.set(id2, fingerprint);
    return fingerprint;
  };
  for (const id2 of [...inputsById.keys(), ...functionsById.keys(), ...stepsById.keys()]) visit2(id2, /* @__PURE__ */ new Set());
  return memo;
}
function renderPrompt(template, vars) {
  return template.replace(/\{\{\s*topic\s*\}\}/g, vars.topic).replace(/\{\{\s*input\s*\}\}/g, vars.input).replace(/\{\{\s*output\s*\}\}/g, vars.output).replace(/\{\{\s*feedback\s*\}\}/g, vars.feedback);
}
async function readArtifact(workspacePath, file) {
  if (!window.contentWorkspace || !file.trim()) return null;
  try {
    const result = await window.contentWorkspace.previewFile(workspacePath, file);
    if (result.kind !== "text" || typeof result.content !== "string") return null;
    return result.content;
  } catch {
    return null;
  }
}
function buildHandoffBlock(step, inputFiles, inputTexts, workspacePath, manifests) {
  const lines = [
    "",
    "---",
    "BỐI CẢNH HỆ THỐNG (do Buzz thêm vào, không phải lời người dùng)",
    `Thư mục làm việc: ${workspacePath}`
  ];
  if (inputFiles.length > 0) {
    lines.push(`Đọc các file đầu vào trước khi làm: ${inputFiles.join(", ")}`);
  }
  if (manifests.length > 0) {
    lines.push("", "MANIFEST ĐẦU VÀO:");
    for (const manifest of manifests) {
      lines.push(`- ${manifest.name} (${manifest.kind}): ${manifest.resolvedPath}`);
      lines.push(`  ${manifest.fileCount} file, ${manifest.totalBytes} byte${manifest.staged ? ", đã đưa vào workspace" : ""}`);
      for (const file of manifest.files) lines.push(`  • ${file}`);
      if (manifest.filesTruncated) lines.push("  • … danh sách đã rút gọn; hãy tự duyệt tiếp trong folder");
    }
  }
  if (inputTexts.length > 0) {
    lines.push("", "DỮ LIỆU TEXT ĐẦU VÀO:");
    for (const input of inputTexts) lines.push(`[${input.name}]`, input.value);
  }
  const outputKind = step.outputKind ?? (step.outputFile.trim() ? "file" : "text");
  if (outputKind === "file" && step.outputFile.trim()) {
    lines.push(
      `Ghi toàn bộ kết quả vào file: ${step.outputFile}`,
      "Ghi đè file nếu đã tồn tại. Chỉ ghi nội dung thành phẩm, không ghi lời dẫn hay ghi chú quá trình."
    );
  } else if (outputKind === "folder" && step.outputFile.trim()) {
    lines.push(
      `Ghi các tệp kết quả vào thư mục: ${step.outputFile}`,
      "Tự tạo thư mục nếu chưa tồn tại. Chỉ ghi sản phẩm cần bàn giao vào thư mục này."
    );
  } else {
    lines.push("Trả toàn bộ kết quả thành phẩm trực tiếp trong phản hồi. Không bắt buộc ghi file.");
  }
  return lines.join("\n");
}
const STEP_TIMEOUT_MS = 20 * 60 * 1e3;
const JUDGE_TIMEOUT_MS = 5 * 60 * 1e3;
let controller = null;
let activeRunId = null;
let humanGateResolver = null;
function isRunnerBusy() {
  return activeRunId !== null;
}
function setActiveRun(runId, next) {
  activeRunId = runId;
  controller = next;
}
function getSignal() {
  return controller?.signal;
}
function abortRun() {
  controller?.abort();
  humanGateResolver?.({ pass: false, reason: "Người dùng đã dừng pipeline" });
  humanGateResolver = null;
}
function resolveHumanGate(pass, reason) {
  humanGateResolver?.({ pass, reason });
  humanGateResolver = null;
}
function setHumanGateResolver(resolver2) {
  humanGateResolver = resolver2;
}
function assertAlive() {
  if (controller?.signal.aborted) throw new Error("aborted");
}
async function evaluateRuleGate(step, workspacePath, fallbackOutput) {
  const rule = step.gate.rule;
  const artifact = await readArtifact(workspacePath, step.outputFile);
  if (rule.requireOutputFile && step.outputFile.trim() && artifact === null) {
    return { pass: false, reason: `Không tìm thấy hoặc không đọc được file "${step.outputFile}".` };
  }
  const content2 = artifact ?? fallbackOutput;
  if (rule.minLength > 0 && content2.trim().length < rule.minLength) {
    return {
      pass: false,
      reason: `Nội dung quá ngắn: ${content2.trim().length} ký tự, yêu cầu tối thiểu ${rule.minLength}.`
    };
  }
  if (rule.jsonValid) {
    try {
      JSON.parse(content2.trim());
    } catch {
      return { pass: false, reason: "Nội dung không phải JSON hợp lệ." };
    }
  }
  if (rule.mustMatch.trim()) {
    try {
      if (!new RegExp(rule.mustMatch, "i").test(content2)) {
        return { pass: false, reason: `Nội dung không khớp mẫu bắt buộc: ${rule.mustMatch}` };
      }
    } catch {
      return { pass: false, reason: `Regex "mustMatch" không hợp lệ: ${rule.mustMatch}` };
    }
  }
  if (rule.mustNotMatch.trim()) {
    try {
      if (new RegExp(rule.mustNotMatch, "i").test(content2)) {
        return { pass: false, reason: `Nội dung chứa mẫu bị cấm: ${rule.mustNotMatch}` };
      }
    } catch {
      return { pass: false, reason: `Regex "mustNotMatch" không hợp lệ: ${rule.mustNotMatch}` };
    }
  }
  return { pass: true, reason: "Đạt mọi điều kiện kiểm tra." };
}
async function evaluateAgentGate(step, judge, workspacePath, runId, attempt, fallbackOutput) {
  const artifact = await readArtifact(workspacePath, step.outputFile);
  const content2 = truncate(artifact ?? fallbackOutput, MAX_JUDGE_INPUT);
  if (!content2.trim()) {
    return { pass: false, reason: "Không có nội dung để chấm." };
  }
  const prompt = [
    "Bạn đang chấm kết quả của một bước trong dây chuyền sản xuất nội dung.",
    "",
    "TIÊU CHÍ:",
    step.gate.judgePrompt.trim() || "Đánh giá xem kết quả có đạt yêu cầu chuyên môn không.",
    "",
    "NỘI DUNG CẦN CHẤM:",
    '"""',
    content2,
    '"""',
    "",
    "Trả lời theo đúng định dạng sau, không thêm gì khác:",
    "VERDICT: PASS hoặc FAIL",
    "REASON: <một đến ba câu nêu lý do; nếu FAIL thì chỉ rõ phải sửa gì>"
  ].join("\n");
  const raw = await runCliTextTask({
    adapter: judge.adapter,
    prompt,
    systemPrompt: judge.systemPrompt || void 0,
    model: judge.model || void 0,
    effort: judge.effort || void 0,
    // Session mới mỗi lần chấm: agent QC không được nhìn thấy quá trình agent viết,
    // nếu không nó sẽ thiên vị và gật cho qua.
    sessionKey: `buzz-judge:${runId}:${step.id}:${attempt}`,
    timeoutMs: JUDGE_TIMEOUT_MS,
    workingDirectory: workspacePath ?? void 0,
    enableContentMcp: true,
    signal: getSignal()
  });
  const verdict = /VERDICT\s*:\s*(PASS|FAIL)/i.exec(raw)?.[1]?.toUpperCase();
  const reason = /REASON\s*:\s*([\s\S]+)/i.exec(raw)?.[1]?.trim() || raw.trim();
  if (verdict === "PASS") return { pass: true, reason: truncate(reason, 2e3) };
  if (verdict === "FAIL") return { pass: false, reason: truncate(reason, 2e3) };
  return { pass: false, reason: `Agent QC không trả đúng định dạng VERDICT. Nó trả về: ${truncate(raw.trim(), 600)}` };
}
function waitForHumanGate() {
  return new Promise((resolve) => {
    setHumanGateResolver((verdict) => resolve({ pass: verdict.pass, reason: verdict.reason }));
  });
}
async function evaluateGate(step, run, attempt, output) {
  const store = useBuzzStore.getState();
  switch (step.gate.kind) {
    case "none":
      return { pass: true, reason: "" };
    case "rule":
      return evaluateRuleGate(step, run.workspacePath, output);
    case "agent": {
      const judge = store.agents.find((agent) => agent.id === step.gate.judgeAgentId);
      if (!judge) return { pass: false, reason: "Chưa chọn agent QC cho bước này." };
      return evaluateAgentGate(step, judge, run.workspacePath, run.id, attempt, output);
    }
    case "human": {
      store.patchRunStep(run.id, step.id, { status: "awaiting" });
      store.patchRun(run.id, { status: "awaiting" });
      const result = await waitForHumanGate();
      store.patchRun(run.id, { status: "running" });
      return result;
    }
    default:
      return { pass: true, reason: "" };
  }
}
function orderedAgentSteps(pipeline) {
  const inputIds = (pipeline.inputNodes ?? []).map((node2) => node2.id);
  const functionIds = (pipeline.functionNodes ?? []).map((node2) => node2.id);
  const stepIds = pipeline.steps.map((step) => step.id);
  const ids = [...inputIds, ...functionIds, ...stepIds];
  const known = new Set(ids);
  const connections = (pipeline.connections ?? []).filter((item) => !item.loop && known.has(item.source) && known.has(item.target));
  const incoming = new Map(ids.map((id2) => [id2, 0]));
  const outgoing = /* @__PURE__ */ new Map();
  for (const connection of connections) {
    incoming.set(connection.target, (incoming.get(connection.target) ?? 0) + 1);
    outgoing.set(connection.source, [...outgoing.get(connection.source) ?? [], connection.target]);
  }
  const queue = ids.filter((id2) => (incoming.get(id2) ?? 0) === 0);
  const ordered = [];
  while (queue.length > 0) {
    const id2 = queue.shift();
    ordered.push(id2);
    for (const target of outgoing.get(id2) ?? []) {
      const count = (incoming.get(target) ?? 1) - 1;
      incoming.set(target, count);
      if (count === 0) queue.push(target);
    }
  }
  for (const id2 of ids) if (!ordered.includes(id2)) ordered.push(id2);
  const byId = new Map(pipeline.steps.map((step) => [step.id, step]));
  return ordered.map((id2) => byId.get(id2)).filter((step) => Boolean(step));
}
function upstreamAgentIds(pipeline, targetId) {
  const incoming = /* @__PURE__ */ new Map();
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue;
    incoming.set(connection.target, [...incoming.get(connection.target) ?? [], connection.source]);
  }
  const agentIds = new Set(pipeline.steps.map((step) => step.id));
  const result = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit2 = (id2) => {
    if (visited.has(id2)) return;
    visited.add(id2);
    for (const source of incoming.get(id2) ?? []) {
      if (agentIds.has(source)) result.add(source);
      visit2(source);
    }
  };
  visit2(targetId);
  return result;
}
function resolveGraphInputs(pipeline, targetId, runTopic, stepOutputs, inputManifest) {
  const connections = pipeline.connections ?? [];
  const inputs = new Map((pipeline.inputNodes ?? []).map((node2) => [node2.id, node2]));
  const functions = new Map((pipeline.functionNodes ?? []).map((node2) => [node2.id, node2]));
  const steps = new Map(pipeline.steps.map((step) => [step.id, step]));
  const files = [];
  const texts = [];
  const values = {};
  const manifests = [];
  const visited = /* @__PURE__ */ new Set();
  const visit2 = (id2) => {
    if (visited.has(id2)) return;
    visited.add(id2);
    const input = inputs.get(id2);
    if (input) {
      if (input.kind === "text") {
        const value = input.value.trim() || runTopic.trim();
        if (value) {
          texts.push({ name: input.name || "Text", value });
          values[input.id] = value;
        }
      } else if (input.path.trim()) {
        const manifest = inputManifest.get(input.id);
        const value = manifest?.resolvedPath ?? input.path.trim();
        files.push(value);
        values[input.id] = value;
        if (manifest) manifests.push(manifest);
      }
      return;
    }
    const sourceStep = steps.get(id2);
    if (sourceStep) {
      const outputKind = sourceStep.outputKind ?? (sourceStep.outputFile.trim() ? "file" : "text");
      const runtimeOutput = stepOutputs.get(sourceStep.id)?.trim() ?? "";
      if (outputKind === "text" && runtimeOutput) {
        texts.push({ name: sourceStep.name || "Agent", value: runtimeOutput });
        values[sourceStep.id] = runtimeOutput;
      } else if (sourceStep.outputFile.trim() && stepOutputs.has(sourceStep.id)) {
        const value = sourceStep.outputFile.trim();
        files.push(value);
        values[sourceStep.id] = value;
      } else if (runtimeOutput) {
        texts.push({ name: sourceStep.name || "Agent", value: runtimeOutput });
        values[sourceStep.id] = runtimeOutput;
      }
      return;
    }
    if (functions.has(id2)) {
      const runtimeOutput = stepOutputs.get(id2)?.trim();
      if (runtimeOutput) values[id2] = runtimeOutput;
      for (const connection of connections) if (connection.target === id2) visit2(connection.source);
    }
  };
  for (const connection of connections) if (connection.target === targetId) visit2(connection.source);
  return { files: [...new Set(files)], texts, values, manifests: [...new Map(manifests.map((item) => [item.nodeId, item])).values()] };
}
function parseJsonCandidate(raw) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw)?.[1];
  const candidate = (fenced ?? raw).trim();
  if (!candidate) return void 0;
  try {
    return JSON.parse(candidate);
  } catch {
  }
  const start2 = candidate.search(/[{[]/);
  if (start2 >= 0) {
    const end = candidate.lastIndexOf(candidate[start2] === "{" ? "}" : "]");
    if (end > start2) {
      try {
        return JSON.parse(candidate.slice(start2, end + 1));
      } catch {
        return void 0;
      }
    }
  }
  return void 0;
}
function readObjectPath(value, field) {
  if (!field.trim()) return value;
  let current = value;
  for (const part of field.trim().split(".").filter(Boolean)) {
    if (!current || typeof current !== "object" || !(part in current)) return void 0;
    current = current[part];
  }
  return current;
}
function parseComparable(value) {
  const trimmed = value.trim();
  if (/^(true|false|null)$/i.test(trimmed)) return JSON.parse(trimmed.toLowerCase());
  if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
  return trimmed;
}
function isTruthyValue(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized || ["false", "0", "no", "fail", "null", "undefined"].includes(normalized)) return false;
  }
  return Boolean(value);
}
function evaluateConditionNode(node2, rawInput) {
  const parsed = parseJsonCandidate(rawInput);
  const source = node2.field?.trim() ? parsed : parsed ?? rawInput;
  const value = readObjectPath(source, node2.field ?? "");
  const expected = parseComparable(node2.compareValue ?? "");
  const operator = node2.operator ?? "truthy";
  switch (operator) {
    case "exists":
      return { passed: value !== void 0 && value !== null, value };
    case "truthy":
      return { passed: isTruthyValue(value), value };
    case "equals":
      return { passed: value === expected || String(value) === String(expected), value };
    case "notEquals":
      return { passed: !(value === expected || String(value) === String(expected)), value };
    case "contains":
      return { passed: String(value ?? "").includes(String(expected ?? "")), value };
    case "notContains":
      return { passed: !String(value ?? "").includes(String(expected ?? "")), value };
    case "regex": {
      try {
        return { passed: new RegExp(String(expected ?? ""), "i").test(String(value ?? "")), value };
      } catch {
        throw new Error(`Regex không hợp lệ trong node “${node2.name}”.`);
      }
    }
    case "gt":
      return { passed: Number(value) > Number(expected), value };
    case "gte":
      return { passed: Number(value) >= Number(expected), value };
    case "lt":
      return { passed: Number(value) < Number(expected), value };
    case "lte":
      return { passed: Number(value) <= Number(expected), value };
    default:
      return { passed: false, value };
  }
}
function executionRoots(pipeline) {
  const executableIds = /* @__PURE__ */ new Set([
    ...pipeline.steps.map((step) => step.id),
    ...(pipeline.functionNodes ?? []).map((node2) => node2.id)
  ]);
  const inputIds = new Set((pipeline.inputNodes ?? []).map((node2) => node2.id));
  const roots = [];
  for (const connection of pipeline.connections ?? []) {
    if (inputIds.has(connection.source) && executableIds.has(connection.target) && !roots.includes(connection.target)) roots.push(connection.target);
  }
  for (const id2 of executableIds) {
    const hasForwardIncoming = (pipeline.connections ?? []).some((connection) => connection.target === id2 && !connection.loop && (executableIds.has(connection.source) || inputIds.has(connection.source)));
    if (!hasForwardIncoming && !roots.includes(id2)) roots.push(id2);
  }
  return roots;
}
function validateControlFlow(pipeline) {
  const nodeIds = /* @__PURE__ */ new Set([
    ...(pipeline.inputNodes ?? []).map((node2) => node2.id),
    ...(pipeline.functionNodes ?? []).map((node2) => node2.id),
    ...pipeline.steps.map((step) => step.id)
  ]);
  for (const connection of pipeline.connections ?? []) {
    if (!nodeIds.has(connection.source) || !nodeIds.has(connection.target)) throw new Error("Workflow có dây nối tới node không còn tồn tại.");
  }
  for (const node2 of pipeline.functionNodes ?? []) {
    const outgoing = (pipeline.connections ?? []).filter((connection) => connection.source === node2.id);
    if (node2.kind === "condition") {
      if (outgoing.some((connection) => connection.sourceHandle !== "true" && connection.sourceHandle !== "false")) throw new Error(`Dây ra khỏi node “${node2.name}” phải dùng cổng Đúng hoặc Sai.`);
    }
    if (node2.kind === "loop") {
      if (outgoing.some((connection) => connection.sourceHandle !== "loop" && connection.sourceHandle !== "done")) throw new Error(`Dây ra khỏi node “${node2.name}” phải dùng cổng Lặp hoặc Xong.`);
    }
  }
  const forwardOutgoing = /* @__PURE__ */ new Map();
  for (const connection of pipeline.connections ?? []) {
    if (connection.loop) continue;
    forwardOutgoing.set(connection.source, [...forwardOutgoing.get(connection.source) ?? [], connection.target]);
  }
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit2 = (id2) => {
    if (visiting.has(id2)) throw new Error("Workflow có vòng lặp không đi qua cổng điều khiển If/Loop.");
    if (visited.has(id2)) return;
    visiting.add(id2);
    for (const target of forwardOutgoing.get(id2) ?? []) visit2(target);
    visiting.delete(id2);
    visited.add(id2);
  };
  for (const id2 of nodeIds) visit2(id2);
}
class RunAborted extends Error {
  constructor() {
    super("Đã dừng");
    this.name = "RunAborted";
  }
}
async function startRun(options) {
  if (isRunnerBusy()) return null;
  const store = useBuzzStore.getState();
  validateControlFlow(options.pipeline);
  const inputManifest = await prepareRunInputManifest(options.pipeline, options.workspacePath);
  const pipelineFingerprint = createPipelineFingerprint(options.pipeline, store.agents, inputManifest);
  const nodeFingerprints = createNodeFingerprints(options.pipeline, store.agents, inputManifest);
  const orderedSteps = orderedAgentSteps(options.pipeline).map((step) => ({ ...step, gate: { ...step.gate, kind: "none" } }));
  const targetFunctionNode = options.targetStepId ? (options.pipeline.functionNodes ?? []).find((node2) => node2.id === options.targetStepId) : void 0;
  const seedStepOutputs = /* @__PURE__ */ new Map();
  if (options.targetStepId) {
    for (const previousRun of store.runs) {
      if (previousRun.pipelineId !== options.pipeline.id) continue;
      for (const step of previousRun.steps) {
        if (step.status !== "passed" || !step.output || seedStepOutputs.has(step.stepId)) continue;
        const sourceStep = options.pipeline.steps.find((candidate) => candidate.id === step.stepId);
        if (!sourceStep) continue;
        if (!step.inputFingerprint || step.inputFingerprint !== nodeFingerprints.get(step.stepId)) continue;
        const outputKind = sourceStep.outputKind ?? (sourceStep.outputFile.trim() ? "file" : "text");
        if (outputKind === "text" && (step.artifact?.totalBytes ?? 0) > MAX_STORED_OUTPUT) continue;
        if (outputKind !== "text") {
          if (!sourceStep || !step.artifact?.fingerprint || !window.contentWorkspace?.verifyBuzzOutput) continue;
          const currentArtifact = await window.contentWorkspace.verifyBuzzOutput(
            options.workspacePath,
            outputKind,
            sourceStep.outputFile,
            ""
          );
          if (!currentArtifact.valid || currentArtifact.fingerprint !== step.artifact.fingerprint) continue;
        }
        seedStepOutputs.set(step.stepId, step.output);
      }
    }
  }
  const upstreamIds = options.targetStepId ? upstreamAgentIds(options.pipeline, options.targetStepId) : /* @__PURE__ */ new Set();
  const steps = options.targetStepId ? orderedSteps.filter((step) => step.id === options.targetStepId || upstreamIds.has(step.id) && !seedStepOutputs.has(step.id)) : orderedSteps;
  if (!targetFunctionNode && (steps.length === 0 || options.targetStepId && !steps.some((step) => step.id === options.targetStepId))) return null;
  const runFunctionNodes = targetFunctionNode ? [targetFunctionNode] : options.targetStepId ? [] : options.pipeline.functionNodes ?? [];
  const runId = generateUUID();
  const run = {
    id: runId,
    pipelineId: options.pipeline.id,
    pipelineName: options.pipeline.name,
    topic: options.topic,
    workspacePath: options.workspacePath,
    status: "running",
    currentStepId: null,
    startedAt: Date.now(),
    stepRuns: 0,
    pipelineFingerprint,
    inputManifest,
    steps: [
      ...steps.map((step) => ({
        stepId: step.id,
        name: step.name,
        agentName: store.agents.find((agent) => agent.id === step.agentId)?.name ?? "(chưa chọn agent)",
        status: "pending",
        attempt: 0,
        output: ""
      })),
      ...runFunctionNodes.map((node2) => ({
        stepId: node2.id,
        name: node2.name,
        agentName: node2.kind === "condition" ? "Điều kiện" : node2.kind === "loop" ? "Vòng lặp" : "Gộp",
        status: "pending",
        attempt: 0,
        output: ""
      }))
    ]
  };
  store.createRun(run);
  const controller2 = new AbortController();
  setActiveRun(runId, controller2);
  try {
    if (options.targetStepId) {
      const stepOutputs = await executeSteps(runId, steps, options, seedStepOutputs, inputManifest, nodeFingerprints);
      if (targetFunctionNode) evaluateFunctionNodeOnce(runId, targetFunctionNode, options, stepOutputs, inputManifest);
    } else {
      await executeGraph(runId, orderedSteps, runFunctionNodes, options, seedStepOutputs, inputManifest, nodeFingerprints);
    }
    const finished = useBuzzStore.getState().runs.find((item) => item.id === runId);
    const anyFailed = finished?.steps.some((step) => step.status === "failed");
    useBuzzStore.getState().setRunStatus(runId, anyFailed ? "failed" : "done");
  } catch (error) {
    if (error instanceof RunAborted) {
      const current = useBuzzStore.getState().runs.find((item) => item.id === runId);
      useBuzzStore.getState().patchRun(runId, {
        status: "paused",
        steps: current?.steps.map((step) => step.status === "running" || step.status === "checking" || step.status === "awaiting" ? { ...step, status: "pending" } : step)
      });
    } else {
      useBuzzStore.getState().setRunStatus(runId, "failed", error instanceof Error ? error.message : String(error));
    }
  } finally {
    setActiveRun(null, null);
    setHumanGateResolver(null);
    useBuzzStore.getState().patchRun(runId, { currentStepId: null });
  }
  return runId;
}
function evaluateFunctionNodeOnce(runId, node2, options, stepOutputs, manifests) {
  const store = useBuzzStore.getState();
  const upstreamFailed = store.runs.find((run) => run.id === runId)?.steps.some((step) => step.stepId !== node2.id && step.status === "failed");
  if (upstreamFailed) {
    store.patchRunStep(runId, node2.id, { status: "skipped", error: "Node phía trước không hoàn thành.", finishedAt: Date.now() });
    return;
  }
  store.patchRun(runId, { currentStepId: node2.id });
  store.patchRunStep(runId, node2.id, { status: "running", attempt: 1, startedAt: Date.now(), error: void 0, output: "" });
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]));
  const graphInput = resolveGraphInputs(options.pipeline, node2.id, options.topic, stepOutputs, inputManifest);
  try {
    let output = "";
    if (node2.kind === "condition") {
      const rawInput = graphInput.texts.map((item) => item.value).join("\n\n") || graphInput.files.join("\n");
      const result = evaluateConditionNode(node2, rawInput);
      output = JSON.stringify({ branch: result.passed ? "true" : "false", field: node2.field ?? "", value: result.value ?? null }, null, 2);
    } else if (node2.kind === "loop") {
      const maxIterations = Math.max(1, Math.min(MAX_STEP_RUNS, node2.maxIterations ?? 3));
      output = JSON.stringify({ branch: "loop", iteration: 1, maxIterations }, null, 2);
    } else {
      output = JSON.stringify({ merged: true, inputs: graphInput.texts.length + graphInput.files.length }, null, 2);
    }
    store.patchRunStep(runId, node2.id, { status: "passed", output, gateVerdict: "pass", finishedAt: Date.now() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.patchRunStep(runId, node2.id, { status: "failed", error: message, finishedAt: Date.now() });
    throw error;
  }
}
async function executeGraph(runId, agentSteps, functionNodes, options, seedStepOutputs, manifests, nodeFingerprints) {
  const agentsById = new Map(agentSteps.map((step) => [step.id, step]));
  const functionsById = new Map(functionNodes.map((node2) => [node2.id, node2]));
  const executableIds = /* @__PURE__ */ new Set([...agentsById.keys(), ...functionsById.keys()]);
  const outputs = new Map(seedStepOutputs);
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]));
  const attempts = /* @__PURE__ */ new Map();
  const counter = { value: 0 };
  const functionVisits = /* @__PURE__ */ new Map();
  const loopCounts = /* @__PURE__ */ new Map();
  const queue = [];
  const queued = /* @__PURE__ */ new Set();
  const enqueue = (id2) => {
    if (!executableIds.has(id2) || queued.has(id2)) return;
    queue.push(id2);
    queued.add(id2);
  };
  for (const id2 of executionRoots(options.pipeline)) enqueue(id2);
  while (queue.length > 0) {
    assertAlive();
    const nodeId = queue.shift();
    queued.delete(nodeId);
    const agentStep = agentsById.get(nodeId);
    if (agentStep) {
      const nextOutputs = await executeSteps(
        runId,
        [agentStep],
        options,
        outputs,
        manifests,
        nodeFingerprints,
        attempts,
        counter
      );
      outputs.clear();
      for (const [id2, value] of nextOutputs) outputs.set(id2, value);
      const runStep = useBuzzStore.getState().runs.find((run) => run.id === runId)?.steps.find((step) => step.stepId === nodeId);
      if (runStep?.status === "failed") throw new Error(`Node “${agentStep.name}” không hoàn thành.`);
      for (const connection of options.pipeline.connections ?? []) if (connection.source === nodeId) enqueue(connection.target);
      continue;
    }
    const functionNode = functionsById.get(nodeId);
    if (!functionNode) continue;
    counter.value += 1;
    if (counter.value > MAX_STEP_RUNS) throw new Error(`Workflow vượt quá ${MAX_STEP_RUNS} lượt thực thi và đã bị dừng.`);
    const visit2 = (functionVisits.get(nodeId) ?? 0) + 1;
    functionVisits.set(nodeId, visit2);
    const maxVisits = Math.max(1, Math.min(MAX_STEP_RUNS, functionNode.maxIterations ?? (functionNode.kind === "condition" ? 10 : 3)));
    if (functionNode.kind === "condition" && visit2 > maxVisits) {
      useBuzzStore.getState().patchRunStep(runId, nodeId, { status: "failed", attempt: visit2, error: `Điều kiện đã chạy quá ${maxVisits} lần.`, finishedAt: Date.now() });
      throw new Error(`Node điều kiện “${functionNode.name}” vượt giới hạn ${maxVisits} lần.`);
    }
    useBuzzStore.getState().patchRun(runId, { currentStepId: nodeId, stepRuns: counter.value });
    useBuzzStore.getState().patchRunStep(runId, nodeId, { status: "running", attempt: visit2, startedAt: Date.now(), error: void 0, output: "" });
    const graphInput = resolveGraphInputs(options.pipeline, nodeId, options.topic, outputs, inputManifest);
    let branch = null;
    let output = "";
    try {
      if (functionNode.kind === "condition") {
        const rawInput = graphInput.texts.map((item) => item.value).join("\n\n") || graphInput.files.join("\n");
        const result = evaluateConditionNode(functionNode, rawInput);
        branch = result.passed ? "true" : "false";
        output = JSON.stringify({ branch, field: functionNode.field ?? "", value: result.value ?? null }, null, 2);
      } else if (functionNode.kind === "loop") {
        const count = (loopCounts.get(nodeId) ?? 0) + 1;
        loopCounts.set(nodeId, count);
        branch = count <= maxVisits ? "loop" : "done";
        output = JSON.stringify({ branch, iteration: count, maxIterations: maxVisits }, null, 2);
      } else {
        output = JSON.stringify({ merged: true, inputs: graphInput.texts.length + graphInput.files.length }, null, 2);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      useBuzzStore.getState().patchRunStep(runId, nodeId, { status: "failed", error: message, finishedAt: Date.now() });
      throw error;
    }
    outputs.set(nodeId, output);
    useBuzzStore.getState().patchRunStep(runId, nodeId, { status: "passed", output, gateVerdict: "pass", finishedAt: Date.now() });
    const outgoing = (options.pipeline.connections ?? []).filter((connection) => connection.source === nodeId);
    const selected2 = functionNode.kind === "merge" ? outgoing : outgoing.filter((connection) => !connection.sourceHandle || connection.sourceHandle === branch);
    for (const connection of selected2) enqueue(connection.target);
  }
  const finishedRun = useBuzzStore.getState().runs.find((run) => run.id === runId);
  for (const step of finishedRun?.steps ?? []) {
    if (step.status === "pending") useBuzzStore.getState().patchRunStep(runId, step.stepId, { status: "skipped", finishedAt: Date.now() });
  }
}
async function executeSteps(runId, steps, options, seedStepOutputs = /* @__PURE__ */ new Map(), manifests = [], nodeFingerprints = /* @__PURE__ */ new Map(), attempts = /* @__PURE__ */ new Map(), executionCounter = { value: 0 }) {
  const feedback = /* @__PURE__ */ new Map();
  const stepOutputs = new Map(seedStepOutputs);
  const inputManifest = new Map(manifests.map((manifest) => [manifest.nodeId, manifest]));
  let index2 = 0;
  while (index2 < steps.length) {
    assertAlive();
    const step = steps[index2];
    const store = useBuzzStore.getState();
    if (executionCounter.value >= MAX_STEP_RUNS) {
      store.patchRunStep(runId, step.id, {
        status: "failed",
        error: `Đã chạm trần ${MAX_STEP_RUNS} lượt chạy step — nghi ngờ pipeline lặp vô tận.`
      });
      throw new Error(`Pipeline vượt quá ${MAX_STEP_RUNS} lượt chạy step và đã bị dừng.`);
    }
    const agent = store.agents.find((item) => item.id === step.agentId);
    if (!agent) {
      store.patchRunStep(runId, step.id, { status: "failed", error: "Bước này chưa gán agent." });
      if (step.onFail === "continue") {
        index2 += 1;
        continue;
      }
      throw new Error(`Bước "${step.name}" chưa gán agent.`);
    }
    const attempt = (attempts.get(step.id) ?? 0) + 1;
    attempts.set(step.id, attempt);
    executionCounter.value += 1;
    const graphInput = resolveGraphInputs(options.pipeline, step.id, options.topic, stepOutputs, inputManifest);
    const inputFingerprint = nodeFingerprints.get(step.id);
    store.patchRun(runId, { currentStepId: step.id, stepRuns: executionCounter.value });
    store.patchRunStep(runId, step.id, {
      status: "running",
      attempt,
      startedAt: Date.now(),
      error: void 0,
      gateVerdict: void 0,
      gateReason: void 0,
      output: "",
      inputFingerprint,
      artifact: void 0
    });
    const inputFiles = graphInput.files;
    const workspacePath = options.workspacePath ?? "";
    const promptWithNodeInputs = step.prompt.replace(/\{\{\s*node:([^}\s]+)\s*\}\}/g, (_match, nodeId) => graphInput.values[nodeId] ?? "");
    const prompt = renderPrompt(promptWithNodeInputs, {
      topic: graphInput.texts.map((item) => item.value).join("\n\n"),
      input: inputFiles.join(", "),
      output: step.outputFile,
      feedback: feedback.get(step.id) ?? ""
    }) + buildHandoffBlock(step, inputFiles, graphInput.texts, workspacePath, graphInput.manifests);
    let output = "";
    let artifact;
    const outputKind = step.outputKind ?? (step.outputFile.trim() ? "file" : "text");
    const previousArtifact = outputKind === "text" || !window.contentWorkspace?.verifyBuzzOutput ? null : await window.contentWorkspace.verifyBuzzOutput(options.workspacePath, outputKind, step.outputFile, "");
    try {
      output = await runCliTextTask({
        adapter: agent.adapter,
        prompt,
        systemPrompt: agent.systemPrompt || void 0,
        model: agent.model || void 0,
        effort: agent.effort || void 0,
        // Mỗi lượt chạy là một session sạch: step sau không thừa hưởng context step
        // trước, và lần chạy lại không mang theo bài cũ đã bị chấm trượt.
        sessionKey: `buzz:${runId}:${step.id}:${attempt}`,
        timeoutMs: STEP_TIMEOUT_MS,
        workingDirectory: options.workspacePath ?? void 0,
        enableContentMcp: true,
        signal: getSignal(),
        onChunk: (chunk) => {
          output += chunk;
          options.onStepChunk?.(step.id, output);
        }
      });
      assertAlive();
      if (!window.contentWorkspace?.verifyBuzzOutput) throw new Error("Runtime hiện tại chưa hỗ trợ xác minh đầu ra.");
      const verified = await window.contentWorkspace.verifyBuzzOutput(
        options.workspacePath,
        outputKind,
        step.outputFile,
        output
      );
      if (!verified.valid || !verified.fingerprint) {
        throw new Error(`Đầu ra không hợp lệ: ${verified.error || "không xác minh được sản phẩm"}`);
      }
      if (outputKind !== "text" && previousArtifact?.valid && previousArtifact.fingerprint === verified.fingerprint) {
        throw new Error(`Đầu ra không hợp lệ: Agent chưa tạo hoặc cập nhật ${outputKind === "file" ? "file" : "folder"} đầu ra trong lượt chạy này.`);
      }
      artifact = {
        kind: outputKind,
        path: verified.path,
        fingerprint: verified.fingerprint,
        fileCount: verified.fileCount ?? 0,
        totalBytes: verified.totalBytes ?? 0
      };
    } catch (error) {
      assertAlive();
      const message = error instanceof Error ? error.message : String(error);
      useBuzzStore.getState().patchRunStep(runId, step.id, {
        status: "failed",
        error: message,
        finishedAt: Date.now()
      });
      const next2 = decideAfterFailure(step, steps, index2, attempt);
      if (next2.action === "abort") throw new Error(`Bước "${step.name}" lỗi: ${message}`);
      if (next2.action === "continue") {
        index2 += 1;
        continue;
      }
      if (next2.action === "goto") {
        resetFrom(runId, steps, next2.index, index2);
        index2 = next2.index;
        continue;
      }
      continue;
    }
    assertAlive();
    stepOutputs.set(step.id, output);
    useBuzzStore.getState().patchRunStep(runId, step.id, {
      status: "checking",
      output: truncate(output, MAX_STORED_OUTPUT),
      artifact
    });
    const run = useBuzzStore.getState().runs.find((item) => item.id === runId);
    const gate = await evaluateGate(step, run, attempt, output);
    assertAlive();
    if (gate.pass) {
      useBuzzStore.getState().patchRunStep(runId, step.id, {
        status: "passed",
        gateVerdict: "pass",
        gateReason: gate.reason,
        finishedAt: Date.now()
      });
      feedback.delete(step.id);
      index2 += 1;
      continue;
    }
    useBuzzStore.getState().patchRunStep(runId, step.id, {
      status: "failed",
      gateVerdict: "fail",
      gateReason: gate.reason,
      finishedAt: Date.now()
    });
    feedback.set(step.id, gate.reason);
    const next = decideAfterFailure(step, steps, index2, attempt);
    if (next.action === "abort") {
      useBuzzStore.getState().patchRun(runId, { error: `Bước "${step.name}" không đạt QC: ${gate.reason}` });
      return stepOutputs;
    }
    if (next.action === "continue") {
      index2 += 1;
      continue;
    }
    if (next.action === "goto") {
      resetFrom(runId, steps, next.index, index2);
      index2 = next.index;
      continue;
    }
  }
  return stepOutputs;
}
function decideAfterFailure(step, steps, index2, attempt) {
  if (step.onFail === "continue") return { action: "continue" };
  if (step.onFail === "stop") return { action: "abort" };
  if (attempt > step.maxRetries) return { action: "abort" };
  if (step.onFail === "retry") return { action: "retry" };
  const target = steps.findIndex((item) => item.id === step.gotoStepId);
  if (target < 0 || target >= index2) return { action: "abort" };
  return { action: "goto", index: target };
}
function resetFrom(runId, steps, from, to) {
  const store = useBuzzStore.getState();
  for (let i = from; i <= to && i < steps.length; i += 1) {
    store.patchRunStep(runId, steps[i].id, {
      status: "pending",
      gateVerdict: void 0,
      gateReason: void 0,
      error: void 0
    });
  }
}
function useAdapterOptions(adapter) {
  const [models, setModels] = reactExports.useState([]);
  const [efforts, setEfforts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getCliModels(adapter).then((result) => {
      if (cancelled) return;
      setModels(result.models);
      setEfforts(result.efforts ?? []);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [adapter]);
  return { models, efforts, loading };
}
function AgentManagerDialog({ open, onOpenChange }) {
  const { agents, createAgent, updateAgent, deleteAgent } = useBuzzStore();
  const [selectedId, setSelectedId] = reactExports.useState(agents[0]?.id ?? "");
  const selected2 = agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;
  const [draft, setDraft] = reactExports.useState(selected2 ? { ...selected2 } : null);
  const edited = draft?.id === selected2?.id ? draft : selected2;
  const { models, efforts, loading } = useAdapterOptions(edited?.adapter ?? "claude");
  reactExports.useEffect(() => {
    if (!agents.some((agent) => agent.id === selectedId)) setSelectedId(agents[0]?.id ?? "");
  }, [agents, selectedId]);
  reactExports.useEffect(() => {
    setDraft(selected2 ? { ...selected2 } : null);
  }, [selected2?.id, selected2?.updatedAt]);
  const patchDraft = (patch2) => setDraft((current) => current ? { ...current, ...patch2 } : current);
  const saveAgent = () => {
    if (!edited) return;
    const name2 = edited.name.trim();
    if (!name2) {
      toast.error("Hãy đặt tên cho Agent.");
      return;
    }
    updateAgent(edited.id, { ...edited, name: name2 });
    toast.success(`Đã lưu Agent “${name2}”.`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "flex h-[78vh] max-w-4xl flex-col gap-0 overflow-hidden p-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "shrink-0 border-b border-border px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Agent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Mỗi agent là một preset CLI + system prompt. Tạo một lần, dùng lại ở mọi pipeline." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            className: "w-full justify-start",
            onClick: () => setSelectedId(createAgent()),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
              "Tạo agent"
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "min-h-0 flex-1 p-2", children: agents.map((agent) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setSelectedId(agent.id),
            className: cn(
              "mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
              agent.id === selected2?.id ? "bg-background shadow-xs ring-1 ring-border" : "hover:bg-sidebar-accent/60"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4 shrink-0 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: agent.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-2xs text-muted-foreground", children: ADAPTER_LABELS[agent.adapter] })
              ] })
            ]
          },
          agent.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: !edited ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground", children: "Chưa có agent nào. Bấm “Tạo agent” để bắt đầu." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Tên" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: edited.name,
                maxLength: 60,
                onChange: (event) => patchDraft({ name: event.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Vai trò" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: edited.role,
                maxLength: 120,
                placeholder: "Ví dụ: viết lời đọc",
                onChange: (event) => patchDraft({ role: event.target.value })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "CLI" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: edited.adapter,
                onValueChange: (value) => patchDraft({
                  adapter: value,
                  // Model/effort của CLI cũ không tồn tại ở CLI mới.
                  model: "",
                  effort: ""
                }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.keys(ADAPTER_LABELS).map((adapter) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: adapter, children: ADAPTER_LABELS[adapter] }, adapter)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Model" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: edited.model || "__default",
                onValueChange: (value) => patchDraft({ model: value === "__default" ? "" : value }),
                disabled: loading,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: "Mặc định" }),
                    models.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: model }, model))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Suy luận" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: edited.effort || "__default",
                onValueChange: (value) => patchDraft({ effort: value === "__default" ? "" : value }),
                disabled: loading || efforts.length === 0,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: "Mặc định" }),
                    efforts.map((effort) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: effort, children: effort }, effort))
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "System prompt" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: edited.systemPrompt,
              onChange: (event) => patchDraft({ systemPrompt: event.target.value }),
              placeholder: "Mô tả agent này là ai, làm gì, và không được làm gì.",
              className: "min-h-56 resize-y font-mono text-xs leading-5"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Đây là tính cách cố định của agent. Việc cụ thể từng bước thì viết ở prompt của step." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-3 border-t border-border pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "text-destructive hover:bg-destructive/10 hover:text-destructive",
              onClick: () => deleteAgent(edited.id),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
                "Xoá agent"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: saveAgent, children: "Lưu cài đặt" })
        ] })
      ] }) }) })
    ] })
  ] }) });
}
function cc(names) {
  if (typeof names === "string" || typeof names === "number") return "" + names;
  let out = "";
  if (Array.isArray(names)) {
    for (let i = 0, tmp; i < names.length; i++) {
      if ((tmp = cc(names[i])) !== "") {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (let k in names) {
      if (names[k]) out += (out && " ") + k;
    }
  }
  return out;
}
var noop = { value: () => {
} };
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames$1(typenames, types2) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name2 = "", i = t.indexOf(".");
    if (i >= 0) name2 = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types2.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name2 };
  });
}
Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._, T = parseTypenames$1(typename + "", _), t, i = -1, n = T.length;
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }
    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};
function get$1(type, name2) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name2) {
      return c.value;
    }
  }
}
function set$1(type, name2, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name2) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name2, value: callback });
  return type;
}
var xhtml = "http://www.w3.org/1999/xhtml";
const namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};
function namespace(name2) {
  var prefix = name2 += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name2.slice(0, i)) !== "xmlns") name2 = name2.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name2 } : name2;
}
function creatorInherit(name2) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name2) : document2.createElementNS(uri, name2);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator(name2) {
  var fullname = namespace(name2);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
function none() {
}
function selector(selector2) {
  return selector2 == null ? none : function() {
    return this.querySelector(selector2);
  };
}
function selection_select(select2) {
  if (typeof select2 !== "function") select2 = selector(select2);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node2, subnode, i = 0; i < n; ++i) {
      if ((node2 = group[i]) && (subnode = select2.call(node2, node2.__data__, i, group))) {
        if ("__data__" in node2) subnode.__data__ = node2.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection$1(subgroups, this._parents);
}
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}
function empty$2() {
  return [];
}
function selectorAll(selector2) {
  return selector2 == null ? empty$2 : function() {
    return this.querySelectorAll(selector2);
  };
}
function arrayAll(select2) {
  return function() {
    return array(select2.apply(this, arguments));
  };
}
function selection_selectAll(select2) {
  if (typeof select2 === "function") select2 = arrayAll(select2);
  else select2 = selectorAll(select2);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0; i < n; ++i) {
      if (node2 = group[i]) {
        subgroups.push(select2.call(node2, node2.__data__, i, group));
        parents.push(node2);
      }
    }
  }
  return new Selection$1(subgroups, parents);
}
function matcher(selector2) {
  return function() {
    return this.matches(selector2);
  };
}
function childMatcher(selector2) {
  return function(node2) {
    return node2.matches(selector2);
  };
}
var find$1 = Array.prototype.find;
function childFind(match) {
  return function() {
    return find$1.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selection_selectChild(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}
var filter = Array.prototype.filter;
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}
function selection_selectChildren(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}
function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node2, i = 0; i < n; ++i) {
      if ((node2 = group[i]) && match.call(node2, node2.__data__, i, group)) {
        subgroup.push(node2);
      }
    }
  }
  return new Selection$1(subgroups, this._parents);
}
function sparse(update) {
  return new Array(update.length);
}
function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function(selector2) {
    return this._parent.querySelector(selector2);
  },
  querySelectorAll: function(selector2) {
    return this._parent.querySelectorAll(selector2);
  }
};
function constant$3(x) {
  return function() {
    return x;
  };
}
function bindIndex(parent, group, enter, update, exit2, data) {
  var i = 0, node2, groupLength = group.length, dataLength = data.length;
  for (; i < dataLength; ++i) {
    if (node2 = group[i]) {
      node2.__data__ = data[i];
      update[i] = node2;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if (node2 = group[i]) {
      exit2[i] = node2;
    }
  }
}
function bindKey(parent, group, enter, update, exit2, data, key) {
  var i, node2, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0; i < groupLength; ++i) {
    if (node2 = group[i]) {
      keyValues[i] = keyValue = key.call(node2, node2.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit2[i] = node2;
      } else {
        nodeByKeyValue.set(keyValue, node2);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node2 = nodeByKeyValue.get(keyValue)) {
      update[i] = node2;
      node2.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node2 = group[i]) && nodeByKeyValue.get(keyValues[i]) === node2) {
      exit2[i] = node2;
    }
  }
}
function datum(node2) {
  return node2.__data__;
}
function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
  if (typeof value !== "function") value = constant$3(value);
  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit2 = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit2[j] = new Array(groupLength);
    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous2, next; i0 < dataLength; ++i0) {
      if (previous2 = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) ;
        previous2._next = next || null;
      }
    }
  }
  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit2;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}
function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit2 = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit2.remove();
  else onexit(exit2);
  return enter && update ? enter.merge(update).order() : update;
}
function selection_merge(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge2 = merges[j] = new Array(n), node2, i = 0; i < n; ++i) {
      if (node2 = group0[i] || group1[i]) {
        merge2[i] = node2;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection$1(merges, this._parents);
}
function selection_order() {
  for (var groups = this._groups, j = -1, m = groups.length; ++j < m; ) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node2; --i >= 0; ) {
      if (node2 = group[i]) {
        if (next && node2.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node2, next);
        next = node2;
      }
    }
  }
  return this;
}
function selection_sort(compare) {
  if (!compare) compare = ascending;
  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }
  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node2, i = 0; i < n; ++i) {
      if (node2 = group[i]) {
        sortgroup[i] = node2;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection$1(sortgroups, this._parents).order();
}
function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}
function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
function selection_nodes() {
  return Array.from(this);
}
function selection_node() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node2 = group[i];
      if (node2) return node2;
    }
  }
  return null;
}
function selection_size() {
  let size = 0;
  for (const node2 of this) ++size;
  return size;
}
function selection_empty() {
  return !this.node();
}
function selection_each(callback) {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node2; i < n; ++i) {
      if (node2 = group[i]) callback.call(node2, node2.__data__, i, group);
    }
  }
  return this;
}
function attrRemove$1(name2) {
  return function() {
    this.removeAttribute(name2);
  };
}
function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant$1(name2, value) {
  return function() {
    this.setAttribute(name2, value);
  };
}
function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction$1(name2, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name2);
    else this.setAttribute(name2, v);
  };
}
function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}
function selection_attr(name2, value) {
  var fullname = namespace(name2);
  if (arguments.length < 2) {
    var node2 = this.node();
    return fullname.local ? node2.getAttributeNS(fullname.space, fullname.local) : node2.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS$1 : attrRemove$1 : typeof value === "function" ? fullname.local ? attrFunctionNS$1 : attrFunction$1 : fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, value));
}
function defaultView(node2) {
  return node2.ownerDocument && node2.ownerDocument.defaultView || node2.document && node2 || node2.defaultView;
}
function styleRemove$1(name2) {
  return function() {
    this.style.removeProperty(name2);
  };
}
function styleConstant$1(name2, value, priority) {
  return function() {
    this.style.setProperty(name2, value, priority);
  };
}
function styleFunction$1(name2, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name2);
    else this.style.setProperty(name2, v, priority);
  };
}
function selection_style(name2, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove$1 : typeof value === "function" ? styleFunction$1 : styleConstant$1)(name2, value, priority == null ? "" : priority)) : styleValue(this.node(), name2);
}
function styleValue(node2, name2) {
  return node2.style.getPropertyValue(name2) || defaultView(node2).getComputedStyle(node2, null).getPropertyValue(name2);
}
function propertyRemove(name2) {
  return function() {
    delete this[name2];
  };
}
function propertyConstant(name2, value) {
  return function() {
    this[name2] = value;
  };
}
function propertyFunction(name2, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name2];
    else this[name2] = v;
  };
}
function selection_property(name2, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name2, value)) : this.node()[name2];
}
function classArray(string2) {
  return string2.trim().split(/^|\s+/);
}
function classList(node2) {
  return node2.classList || new ClassList(node2);
}
function ClassList(node2) {
  this._node = node2;
  this._names = classArray(node2.getAttribute("class") || "");
}
ClassList.prototype = {
  add: function(name2) {
    var i = this._names.indexOf(name2);
    if (i < 0) {
      this._names.push(name2);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name2) {
    var i = this._names.indexOf(name2);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name2) {
    return this._names.indexOf(name2) >= 0;
  }
};
function classedAdd(node2, names) {
  var list2 = classList(node2), i = -1, n = names.length;
  while (++i < n) list2.add(names[i]);
}
function classedRemove(node2, names) {
  var list2 = classList(node2), i = -1, n = names.length;
  while (++i < n) list2.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function selection_classed(name2, value) {
  var names = classArray(name2 + "");
  if (arguments.length < 2) {
    var list2 = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list2.contains(names[i])) return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}
function textRemove() {
  this.textContent = "";
}
function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}
function selection_text(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction$1 : textConstant$1)(value)) : this.node().textContent;
}
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}
function selection_html(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}
function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}
function selection_raise() {
  return this.each(raise);
}
function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function selection_lower() {
  return this.each(lower);
}
function selection_append(name2) {
  var create2 = typeof name2 === "function" ? name2 : creator(name2);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
function constantNull() {
  return null;
}
function selection_insert(name2, before) {
  var create2 = typeof name2 === "function" ? name2 : creator(name2), select2 = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select2.apply(this, arguments) || null);
  });
}
function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function selection_remove() {
  return this.each(remove);
}
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
function selection_datum(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name2 = "", i = t.indexOf(".");
    if (i >= 0) name2 = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name2 };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on) this.__on = [o];
    else on.push(o);
  };
}
function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}
function dispatchEvent(node2, type, params) {
  var window2 = defaultView(node2), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }
  node2.dispatchEvent(event);
}
function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}
function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}
function selection_dispatch(type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
}
function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node2; i < n; ++i) {
      if (node2 = group[i]) yield node2;
    }
  }
}
var root$3 = [null];
function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}
function selection() {
  return new Selection$1([[document.documentElement]], root$3);
}
function selection_selection() {
  return this;
}
Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};
function select(selector2) {
  return typeof selector2 === "string" ? new Selection$1([[document.querySelector(selector2)]], [document.documentElement]) : new Selection$1([[selector2]], root$3);
}
function sourceEvent(event) {
  let sourceEvent2;
  while (sourceEvent2 = event.sourceEvent) event = sourceEvent2;
  return event;
}
function pointer(event, node2) {
  event = sourceEvent(event);
  if (node2 === void 0) node2 = event.currentTarget;
  if (node2) {
    var svg2 = node2.ownerSVGElement || node2;
    if (svg2.createSVGPoint) {
      var point2 = svg2.createSVGPoint();
      point2.x = event.clientX, point2.y = event.clientY;
      point2 = point2.matrixTransform(node2.getScreenCTM().inverse());
      return [point2.x, point2.y];
    }
    if (node2.getBoundingClientRect) {
      var rect = node2.getBoundingClientRect();
      return [event.clientX - rect.left - node2.clientLeft, event.clientY - rect.top - node2.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
const nonpassive = { passive: false };
const nonpassivecapture = { capture: true, passive: false };
function nopropagation$1(event) {
  event.stopImmediatePropagation();
}
function noevent$1(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function dragDisable(view) {
  var root2 = view.document.documentElement, selection2 = select(view).on("dragstart.drag", noevent$1, nonpassivecapture);
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", noevent$1, nonpassivecapture);
  } else {
    root2.__noselect = root2.style.MozUserSelect;
    root2.style.MozUserSelect = "none";
  }
}
function yesdrag(view, noclick) {
  var root2 = view.document.documentElement, selection2 = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection2.on("click.drag", noevent$1, nonpassivecapture);
    setTimeout(function() {
      selection2.on("click.drag", null);
    }, 0);
  }
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", null);
  } else {
    root2.style.MozUserSelect = root2.__noselect;
    delete root2.__noselect;
  }
}
const constant$2 = (x) => () => x;
function DragEvent(type, {
  sourceEvent: sourceEvent2,
  subject,
  target,
  identifier,
  active,
  x,
  y,
  dx,
  dy,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent2, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x, enumerable: true, configurable: true },
    y: { value: y, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};
function defaultFilter$1(event) {
  return !event.ctrlKey && !event.button;
}
function defaultContainer() {
  return this.parentNode;
}
function defaultSubject(event, d) {
  return d == null ? { x: event.x, y: event.y } : d;
}
function defaultTouchable$1() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function drag() {
  var filter2 = defaultFilter$1, container = defaultContainer, subject = defaultSubject, touchable = defaultTouchable$1, gestures = {}, listeners = dispatch("start", "drag", "end"), active = 0, mousedownx, mousedowny, mousemoving, touchending, clickDistance2 = 0;
  function drag2(selection2) {
    selection2.on("mousedown.drag", mousedowned).filter(touchable).on("touchstart.drag", touchstarted).on("touchmove.drag", touchmoved, nonpassive).on("touchend.drag touchcancel.drag", touchended).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  function mousedowned(event, d) {
    if (touchending || !filter2.call(this, event, d)) return;
    var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
    if (!gesture) return;
    select(event.view).on("mousemove.drag", mousemoved, nonpassivecapture).on("mouseup.drag", mouseupped, nonpassivecapture);
    dragDisable(event.view);
    nopropagation$1(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }
  function mousemoved(event) {
    noevent$1(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }
  function mouseupped(event) {
    select(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent$1(event);
    gestures.mouse("end", event);
  }
  function touchstarted(event, d) {
    if (!filter2.call(this, event, d)) return;
    var touches = event.changedTouches, c = container.call(this, event, d), n = touches.length, i, gesture;
    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
        nopropagation$1(event);
        gesture("start", event, touches[i]);
      }
    }
  }
  function touchmoved(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent$1(event);
        gesture("drag", event, touches[i]);
      }
    }
  }
  function touchended(event) {
    var touches = event.changedTouches, n = touches.length, i, gesture;
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, 500);
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation$1(event);
        gesture("end", event, touches[i]);
      }
    }
  }
  function beforestart(that, container2, event, d, identifier, touch) {
    var dispatch2 = listeners.copy(), p = pointer(touch || event, container2), dx, dy, s;
    if ((s = subject.call(that, new DragEvent("beforestart", {
      sourceEvent: event,
      target: drag2,
      identifier,
      active,
      x: p[0],
      y: p[1],
      dx: 0,
      dy: 0,
      dispatch: dispatch2
    }), d)) == null) return;
    dx = s.x - p[0] || 0;
    dy = s.y - p[1] || 0;
    return function gesture(type, event2, touch2) {
      var p0 = p, n;
      switch (type) {
        case "start":
          gestures[identifier] = gesture, n = active++;
          break;
        case "end":
          delete gestures[identifier], --active;
        case "drag":
          p = pointer(touch2 || event2, container2), n = active;
          break;
      }
      dispatch2.call(
        type,
        that,
        new DragEvent(type, {
          sourceEvent: event2,
          subject: s,
          target: drag2,
          identifier,
          active: n,
          x: p[0] + dx,
          y: p[1] + dy,
          dx: p[0] - p0[0],
          dy: p[1] - p0[1],
          dispatch: dispatch2
        }),
        d
      );
    };
  }
  drag2.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant$2(!!_), drag2) : filter2;
  };
  drag2.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$2(_), drag2) : container;
  };
  drag2.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$2(_), drag2) : subject;
  };
  drag2.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$2(!!_), drag2) : touchable;
  };
  drag2.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag2 : value;
  };
  drag2.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag2) : Math.sqrt(clickDistance2);
  };
  return drag2;
}
function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend$2(parent, definition2) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition2) prototype[key] = definition2[key];
  return prototype;
}
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*", reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", reHex = /^#([0-9a-f]{3,8})$/, reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`), reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`), reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`), reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`), reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`), reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define(Color, color$1, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color$1(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define(Rgb, rgb, extend$2(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color$1(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r, g, b), max = Math.max(r, g, b), h = NaN, s = max - min, l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}
function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define(Hsl, hsl, extend$2(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
const constant$1 = (x) => () => x;
function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}
function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
  };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
}
const interpolateRgb = function rgbGamma(y) {
  var color2 = gamma(y);
  function rgb$1(start2, end) {
    var r = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.r = r(t);
      start2.g = g(t);
      start2.b = b(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  }
  rgb$1.gamma = rgbGamma;
  return rgb$1;
}(1);
function numberArray(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}
function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}
function genericArray(a, b) {
  var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x = new Array(na), c = new Array(nb), i;
  for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}
function date(a, b) {
  var d = /* @__PURE__ */ new Date();
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}
function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}
function object(a, b) {
  var i = {}, c = {}, k;
  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};
  for (k in b) {
    if (k in a) {
      i[k] = interpolate$1(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, reB = new RegExp(reA.source, "g");
function zero(b) {
  return function() {
    return b;
  };
}
function one$2(b) {
  return function(t) {
    return b(t) + "";
  };
}
function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
  a = a + "", b = b + "";
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm;
      else s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: interpolateNumber(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs;
    else s[++i] = bs;
  }
  return s.length < 2 ? q[0] ? one$2(q[0].x) : zero(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
    return s.join("");
  });
}
function interpolate$1(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$1(b) : (t === "number" ? interpolateNumber : t === "string" ? (c = color$1(b)) ? (b = c, interpolateRgb) : interpolateString : b instanceof color$1 ? interpolateRgb : b instanceof Date ? date : isNumberArray(b) ? numberArray : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object : interpolateNumber)(a, b);
}
var degrees = 180 / Math.PI;
var identity$2 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};
function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX,
    scaleY
  };
}
var svgNode;
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity$2 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value) {
  if (value == null) return identity$2;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}
function interpolateTransform(parse2, pxComma, pxParen, degParen) {
  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: interpolateNumber(xa, xb) }, { i: i - 2, x: interpolateNumber(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;
      else if (b - a > 180) a += 360;
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }
  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }
  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: interpolateNumber(xa, xb) }, { i: i - 2, x: interpolateNumber(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a, b) {
    var s = [], q = [];
    a = parse2(a), b = parse2(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}
var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
var epsilon2 = 1e-12;
function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}
function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}
function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}
const interpolateZoom = function zoomRho(rho, rho2, rho4) {
  function zoom2(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S, coshr0 = cosh(r0), u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }
    i.duration = S * 1e3 * rho / Math.SQRT2;
    return i;
  }
  zoom2.rho = function(_) {
    var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };
  return zoom2;
}(Math.SQRT2, 2, 4);
var frame = 0, timeout$1 = 0, interval = 0, pokeDelay = 1e3, taskHead, taskTail, clockLast = 0, clockNow = 0, clockSkew = 0, clock = typeof performance === "object" && performance.now ? performance : Date, setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
  setTimeout(f, 17);
};
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};
function timer(callback, delay, time) {
  var t = new Timer();
  t.restart(callback, delay, time);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(void 0, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}
function sleep(time) {
  if (frame) return;
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
function timeout(callback, delay, time) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}
var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];
var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;
function schedule(node2, name2, id2, index2, group, timing) {
  var schedules = node2.__transition;
  if (!schedules) node2.__transition = {};
  else if (id2 in schedules) return;
  create$1(node2, id2, {
    name: name2,
    index: index2,
    // For context during callback.
    group,
    // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function init(node2, id2) {
  var schedule2 = get(node2, id2);
  if (schedule2.state > CREATED) throw new Error("too late; already scheduled");
  return schedule2;
}
function set(node2, id2) {
  var schedule2 = get(node2, id2);
  if (schedule2.state > STARTED) throw new Error("too late; already running");
  return schedule2;
}
function get(node2, id2) {
  var schedule2 = node2.__transition;
  if (!schedule2 || !(schedule2 = schedule2[id2])) throw new Error("transition not found");
  return schedule2;
}
function create$1(node2, id2, self2) {
  var schedules = node2.__transition, tween;
  schedules[id2] = self2;
  self2.timer = timer(schedule2, 0, self2.time);
  function schedule2(elapsed) {
    self2.state = SCHEDULED;
    self2.timer.restart(start2, self2.delay, self2.time);
    if (self2.delay <= elapsed) start2(elapsed - self2.delay);
  }
  function start2(elapsed) {
    var i, j, n, o;
    if (self2.state !== SCHEDULED) return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self2.name) continue;
      if (o.state === STARTED) return timeout(start2);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id2) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node2, node2.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout(function() {
      if (self2.state === STARTED) {
        self2.state = RUNNING;
        self2.timer.restart(tick, self2.delay, self2.time);
        tick(elapsed);
      }
    });
    self2.state = STARTING;
    self2.on.call("start", node2, node2.__data__, self2.index, self2.group);
    if (self2.state !== STARTING) return;
    self2.state = STARTED;
    tween = new Array(n = self2.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self2.tween[i].value.call(node2, node2.__data__, self2.index, self2.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self2.duration ? self2.ease.call(null, elapsed / self2.duration) : (self2.timer.restart(stop), self2.state = ENDING, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node2, t);
    }
    if (self2.state === ENDING) {
      self2.on.call("end", node2, node2.__data__, self2.index, self2.group);
      stop();
    }
  }
  function stop() {
    self2.state = ENDED;
    self2.timer.stop();
    delete schedules[id2];
    for (var i in schedules) return;
    delete node2.__transition;
  }
}
function interrupt(node2, name2) {
  var schedules = node2.__transition, schedule2, active, empty2 = true, i;
  if (!schedules) return;
  name2 = name2 == null ? null : name2 + "";
  for (i in schedules) {
    if ((schedule2 = schedules[i]).name !== name2) {
      empty2 = false;
      continue;
    }
    active = schedule2.state > STARTING && schedule2.state < ENDING;
    schedule2.state = ENDED;
    schedule2.timer.stop();
    schedule2.on.call(active ? "interrupt" : "cancel", node2, node2.__data__, schedule2.index, schedule2.group);
    delete schedules[i];
  }
  if (empty2) delete node2.__transition;
}
function selection_interrupt(name2) {
  return this.each(function() {
    interrupt(this, name2);
  });
}
function tweenRemove(id2, name2) {
  var tween0, tween1;
  return function() {
    var schedule2 = set(this, id2), tween = schedule2.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name2) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule2.tween = tween1;
  };
}
function tweenFunction(id2, name2, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function() {
    var schedule2 = set(this, id2), tween = schedule2.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name2, value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name2) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }
    schedule2.tween = tween1;
  };
}
function transition_tween(name2, value) {
  var id2 = this._id;
  name2 += "";
  if (arguments.length < 2) {
    var tween = get(this.node(), id2).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name2) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id2, name2, value));
}
function tweenValue(transition, name2, value) {
  var id2 = transition._id;
  transition.each(function() {
    var schedule2 = set(this, id2);
    (schedule2.value || (schedule2.value = {}))[name2] = value.apply(this, arguments);
  });
  return function(node2) {
    return get(node2, id2).value[name2];
  };
}
function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber : b instanceof color$1 ? interpolateRgb : (c = color$1(b)) ? (b = c, interpolateRgb) : interpolateString)(a, b);
}
function attrRemove(name2) {
  return function() {
    this.removeAttribute(name2);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name2, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name2);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrConstantNS(fullname, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function attrFunction(name2, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name2);
    string0 = this.getAttribute(name2);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function attrFunctionNS(fullname, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function transition_attr(name2, value) {
  var fullname = namespace(name2), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name2, typeof value === "function" ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name2, value)) : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname) : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}
function attrInterpolate(name2, i) {
  return function(t) {
    this.setAttribute(name2, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function attrTween(name2, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name2, i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function transition_attrTween(name2, value) {
  var key = "attr." + name2;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace(name2);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}
function delayFunction(id2, value) {
  return function() {
    init(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id2, value) {
  return value = +value, function() {
    init(this, id2).delay = value;
  };
}
function transition_delay(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get(this.node(), id2).delay;
}
function durationFunction(id2, value) {
  return function() {
    set(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id2, value) {
  return value = +value, function() {
    set(this, id2).duration = value;
  };
}
function transition_duration(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get(this.node(), id2).duration;
}
function easeConstant(id2, value) {
  if (typeof value !== "function") throw new Error();
  return function() {
    set(this, id2).ease = value;
  };
}
function transition_ease(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant(id2, value)) : get(this.node(), id2).ease;
}
function easeVarying(id2, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error();
    set(this, id2).ease = v;
  };
}
function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error();
  return this.each(easeVarying(this._id, value));
}
function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node2, i = 0; i < n; ++i) {
      if ((node2 = group[i]) && match.call(node2, node2.__data__, i, group)) {
        subgroup.push(node2);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}
function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error();
  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge2 = merges[j] = new Array(n), node2, i = 0; i < n; ++i) {
      if (node2 = group0[i] || group1[i]) {
        merge2[i] = node2;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}
function start(name2) {
  return (name2 + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction(id2, name2, listener) {
  var on0, on1, sit = start(name2) ? init : set;
  return function() {
    var schedule2 = sit(this, id2), on = schedule2.on;
    if (on !== on0) (on1 = (on0 = on).copy()).on(name2, listener);
    schedule2.on = on1;
  };
}
function transition_on(name2, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get(this.node(), id2).on.on(name2) : this.each(onFunction(id2, name2, listener));
}
function removeFunction(id2) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id2) return;
    if (parent) parent.removeChild(this);
  };
}
function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}
function transition_select(select2) {
  var name2 = this._name, id2 = this._id;
  if (typeof select2 !== "function") select2 = selector(select2);
  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node2, subnode, i = 0; i < n; ++i) {
      if ((node2 = group[i]) && (subnode = select2.call(node2, node2.__data__, i, group))) {
        if ("__data__" in node2) subnode.__data__ = node2.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name2, id2, i, subgroup, get(node2, id2));
      }
    }
  }
  return new Transition(subgroups, this._parents, name2, id2);
}
function transition_selectAll(select2) {
  var name2 = this._name, id2 = this._id;
  if (typeof select2 !== "function") select2 = selectorAll(select2);
  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0; i < n; ++i) {
      if (node2 = group[i]) {
        for (var children2 = select2.call(node2, node2.__data__, i, group), child, inherit2 = get(node2, id2), k = 0, l = children2.length; k < l; ++k) {
          if (child = children2[k]) {
            schedule(child, name2, id2, k, children2, inherit2);
          }
        }
        subgroups.push(children2);
        parents.push(node2);
      }
    }
  }
  return new Transition(subgroups, parents, name2, id2);
}
var Selection = selection.prototype.constructor;
function transition_selection() {
  return new Selection(this._groups, this._parents);
}
function styleNull(name2, interpolate2) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name2), string1 = (this.style.removeProperty(name2), styleValue(this, name2));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, string10 = string1);
  };
}
function styleRemove(name2) {
  return function() {
    this.style.removeProperty(name2);
  };
}
function styleConstant(name2, interpolate2, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name2);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate2(string00 = string0, value1);
  };
}
function styleFunction(name2, interpolate2, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name2), value1 = value(this), string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name2), styleValue(this, name2));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate2(string00 = string0, value1));
  };
}
function styleMaybeRemove(id2, name2) {
  var on0, on1, listener0, key = "style." + name2, event = "end." + key, remove2;
  return function() {
    var schedule2 = set(this, id2), on = schedule2.on, listener = schedule2.value[key] == null ? remove2 || (remove2 = styleRemove(name2)) : void 0;
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);
    schedule2.on = on1;
  };
}
function transition_style(name2, value, priority) {
  var i = (name2 += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this.styleTween(name2, styleNull(name2, i)).on("end.style." + name2, styleRemove(name2)) : typeof value === "function" ? this.styleTween(name2, styleFunction(name2, i, tweenValue(this, "style." + name2, value))).each(styleMaybeRemove(this._id, name2)) : this.styleTween(name2, styleConstant(name2, i, value), priority).on("end.style." + name2, null);
}
function styleInterpolate(name2, i, priority) {
  return function(t) {
    this.style.setProperty(name2, i.call(this, t), priority);
  };
}
function styleTween(name2, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name2, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}
function transition_styleTween(name2, value, priority) {
  var key = "style." + (name2 += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween(name2, value, priority == null ? "" : priority));
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function transition_text(value) {
  return this.tween("text", typeof value === "function" ? textFunction(tweenValue(this, "text", value)) : textConstant(value == null ? "" : value + ""));
}
function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}
function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, textTween(value));
}
function transition_transition() {
  var name2 = this._name, id0 = this._id, id1 = newId();
  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0; i < n; ++i) {
      if (node2 = group[i]) {
        var inherit2 = get(node2, id0);
        schedule(node2, name2, id1, i, group, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease
        });
      }
    }
  }
  return new Transition(groups, this._parents, name2, id1);
}
function transition_end() {
  var on0, on1, that = this, id2 = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0) resolve();
    } };
    that.each(function() {
      var schedule2 = set(this, id2), on = schedule2.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule2.on = on1;
    });
    if (size === 0) resolve();
  });
}
var id = 0;
function Transition(groups, parents, name2, id2) {
  this._groups = groups;
  this._parents = parents;
  this._name = name2;
  this._id = id2;
}
function newId() {
  return ++id;
}
var selection_prototype = selection.prototype;
Transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
var defaultTiming = {
  time: null,
  // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};
function inherit(node2, id2) {
  var timing;
  while (!(timing = node2.__transition) || !(timing = timing[id2])) {
    if (!(node2 = node2.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function selection_transition(name2) {
  var id2, timing;
  if (name2 instanceof Transition) {
    id2 = name2._id, name2 = name2._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name2 = name2 == null ? null : name2 + "";
  }
  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node2, i = 0; i < n; ++i) {
      if (node2 = group[i]) {
        schedule(node2, name2, id2, i, group, timing || inherit(node2, id2));
      }
    }
  }
  return new Transition(groups, this._parents, name2, id2);
}
selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;
const constant = (x) => () => x;
function ZoomEvent(type, {
  sourceEvent: sourceEvent2,
  target,
  transform: transform2,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent2, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    transform: { value: transform2, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}
Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point2) {
    return [point2[0] * this.k + this.x, point2[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};
var identity$1 = new Transform(1, 0, 0);
transform.prototype = Transform.prototype;
function transform(node2) {
  while (!node2.__zoom) if (!(node2 = node2.parentNode)) return identity$1;
  return node2.__zoom;
}
function nopropagation(event) {
  event.stopImmediatePropagation();
}
function noevent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function defaultFilter(event) {
  return (!event.ctrlKey || event.type === "wheel") && !event.button;
}
function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}
function defaultTransform() {
  return this.__zoom || identity$1;
}
function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 2e-3) * (event.ctrlKey ? 10 : 1);
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function defaultConstrain(transform2, extent, translateExtent) {
  var dx0 = transform2.invertX(extent[0][0]) - translateExtent[0][0], dx1 = transform2.invertX(extent[1][0]) - translateExtent[1][0], dy0 = transform2.invertY(extent[0][1]) - translateExtent[0][1], dy1 = transform2.invertY(extent[1][1]) - translateExtent[1][1];
  return transform2.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}
function zoom() {
  var filter2 = defaultFilter, extent = defaultExtent, constrain = defaultConstrain, wheelDelta2 = defaultWheelDelta, touchable = defaultTouchable, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate2 = interpolateZoom, listeners = dispatch("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
  function zoom2(selection2) {
    selection2.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  zoom2.transform = function(collection, transform2, point2, event) {
    var selection2 = collection.selection ? collection.selection() : collection;
    selection2.property("__zoom", defaultTransform);
    if (collection !== selection2) {
      schedule2(collection, transform2, point2, event);
    } else {
      selection2.interrupt().each(function() {
        gesture(this, arguments).event(event).start().zoom(null, typeof transform2 === "function" ? transform2.apply(this, arguments) : transform2).end();
      });
    }
  };
  zoom2.scaleBy = function(selection2, k, p, event) {
    zoom2.scaleTo(selection2, function() {
      var k0 = this.__zoom.k, k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p, event);
  };
  zoom2.scaleTo = function(selection2, k, p, event) {
    zoom2.transform(selection2, function() {
      var e = extent.apply(this, arguments), t0 = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p, p1 = t0.invert(p0), k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p, event);
  };
  zoom2.translateBy = function(selection2, x, y, event) {
    zoom2.transform(selection2, function() {
      return constrain(this.__zoom.translate(
        typeof x === "function" ? x.apply(this, arguments) : x,
        typeof y === "function" ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };
  zoom2.translateTo = function(selection2, x, y, p, event) {
    zoom2.transform(selection2, function() {
      var e = extent.apply(this, arguments), t = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity$1.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x === "function" ? -x.apply(this, arguments) : -x,
        typeof y === "function" ? -y.apply(this, arguments) : -y
      ), e, translateExtent);
    }, p, event);
  };
  function scale(transform2, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform2.k ? transform2 : new Transform(k, transform2.x, transform2.y);
  }
  function translate(transform2, p0, p1) {
    var x = p0[0] - p1[0] * transform2.k, y = p0[1] - p1[1] * transform2.k;
    return x === transform2.x && y === transform2.y ? transform2 : new Transform(transform2.k, x, y);
  }
  function centroid(extent2) {
    return [(+extent2[0][0] + +extent2[1][0]) / 2, (+extent2[0][1] + +extent2[1][1]) / 2];
  }
  function schedule2(transition, transform2, point2, event) {
    transition.on("start.zoom", function() {
      gesture(this, arguments).event(event).start();
    }).on("interrupt.zoom end.zoom", function() {
      gesture(this, arguments).event(event).end();
    }).tween("zoom", function() {
      var that = this, args = arguments, g = gesture(that, args).event(event), e = extent.apply(that, args), p = point2 == null ? centroid(e) : typeof point2 === "function" ? point2.apply(that, args) : point2, w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]), a = that.__zoom, b = typeof transform2 === "function" ? transform2.apply(that, args) : transform2, i = interpolate2(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
      return function(t) {
        if (t === 1) t = b;
        else {
          var l = i(t), k = w / l[2];
          t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k);
        }
        g.zoom(null, t);
      };
    });
  }
  function gesture(that, args, clean) {
    return !clean && that.__zooming || new Gesture(that, args);
  }
  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }
  Gesture.prototype = {
    event: function(event) {
      if (event) this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform2) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform2.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch") this.touch0[1] = transform2.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch") this.touch1[1] = transform2.invert(this.touch1[0]);
      this.that.__zoom = transform2;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      var d = select(this.that).datum();
      listeners.call(
        type,
        this.that,
        new ZoomEvent(type, {
          sourceEvent: this.sourceEvent,
          target: zoom2,
          transform: this.that.__zoom,
          dispatch: listeners
        }),
        d
      );
    }
  };
  function wheeled(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var g = gesture(this, args).event(event), t = this.__zoom, k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta2.apply(this, arguments)))), p = pointer(event);
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    } else if (t.k === k) return;
    else {
      g.mouse = [p, t.invert(p)];
      interrupt(this);
      g.start();
    }
    noevent(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));
    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter2.apply(this, arguments)) return;
    var currentTarget = event.currentTarget, g = gesture(this, args, true).event(event), v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p = pointer(event, currentTarget), x0 = event.clientX, y0 = event.clientY;
    dragDisable(event.view);
    nopropagation(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt(this);
    g.start();
    function mousemoved(event2) {
      noevent(event2);
      if (!g.moved) {
        var dx = event2.clientX - x0, dy = event2.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event2).zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event2, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }
    function mouseupped(event2) {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event2.view, g.moved);
      noevent(event2);
      g.event(event2).end();
    }
  }
  function dblclicked(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var t0 = this.__zoom, p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t0.invert(p0), k1 = t0.k * (event.shiftKey ? 0.5 : 2), t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);
    noevent(event);
    if (duration > 0) select(this).transition().duration(duration).call(schedule2, t1, p0, event);
    else select(this).call(zoom2.transform, t1, p0, event);
  }
  function touchstarted(event, ...args) {
    if (!filter2.apply(this, arguments)) return;
    var touches = event.touches, n = touches.length, g = gesture(this, args, event.changedTouches.length === n).event(event), started, i, t, p;
    nopropagation(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
    }
    if (touchstarting) touchstarting = clearTimeout(touchstarting);
    if (started) {
      if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() {
        touchstarting = null;
      }, touchDelay);
      interrupt(this);
      g.start();
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t, p, l;
    noevent(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1], p1 = g.touch1[0], l1 = g.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
    else return;
    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }
  function touchended(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t;
    nopropagation(event);
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
    }
    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      if (g.taps === 2) {
        t = pointer(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select(this).on("dblclick.zoom");
          if (p) p.apply(this, arguments);
        }
      }
    }
  }
  zoom2.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta2 = typeof _ === "function" ? _ : constant(+_), zoom2) : wheelDelta2;
  };
  zoom2.filter = function(_) {
    return arguments.length ? (filter2 = typeof _ === "function" ? _ : constant(!!_), zoom2) : filter2;
  };
  zoom2.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), zoom2) : touchable;
  };
  zoom2.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom2) : extent;
  };
  zoom2.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom2) : [scaleExtent[0], scaleExtent[1]];
  };
  zoom2.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom2) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };
  zoom2.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom2) : constrain;
  };
  zoom2.duration = function(_) {
    return arguments.length ? (duration = +_, zoom2) : duration;
  };
  zoom2.interpolate = function(_) {
    return arguments.length ? (interpolate2 = _, zoom2) : interpolate2;
  };
  zoom2.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom2 : value;
  };
  zoom2.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom2) : Math.sqrt(clickDistance2);
  };
  zoom2.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom2) : tapDistance;
  };
  return zoom2;
}
const errorMessages = {
  error001: (lib = "react") => `Seems like you have not used ${lib === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${lib}flow.dev/error#001`,
  error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
  error003: (nodeType) => `Node type "${nodeType}" not found. Using fallback type "default".`,
  error004: () => "The parent container needs a width and a height to render the graph.",
  error005: () => "Only child nodes can use a parent extent.",
  error006: () => "Can't create edge. An edge needs a source and a target.",
  error007: (id2) => `The old edge with id=${id2} does not exist.`,
  error009: (type) => `Marker type "${type}" doesn't exist.`,
  error008: (handleType, { id: id2, sourceHandle, targetHandle }) => `Couldn't create edge for ${handleType} handle id: "${handleType === "source" ? sourceHandle : targetHandle}", edge id: ${id2}.`,
  error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
  error011: (edgeType) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
  error012: (id2) => `Node with id "${id2}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
  error013: (lib = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${lib}/dist/style.css' or base.css to make sure everything is working properly.`,
  error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
  error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
  error016: (id2) => `Edge with id "${id2}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
};
const infiniteExtent = [
  [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
  [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
];
const elementSelectionKeys = ["Enter", " ", "Escape"];
const defaultAriaLabelConfig = {
  "node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
  "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) => `Moved selected node ${direction}. New position, x: ${x}, y: ${y}`,
  "edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
  // Control elements
  "controls.ariaLabel": "Control Panel",
  "controls.zoomIn.ariaLabel": "Zoom In",
  "controls.zoomOut.ariaLabel": "Zoom Out",
  "controls.fitView.ariaLabel": "Fit View",
  "controls.interactive.ariaLabel": "Toggle Interactivity",
  // Mini map
  "minimap.ariaLabel": "Mini Map",
  // Handle
  "handle.ariaLabel": "Handle"
};
var ConnectionMode;
(function(ConnectionMode2) {
  ConnectionMode2["Strict"] = "strict";
  ConnectionMode2["Loose"] = "loose";
})(ConnectionMode || (ConnectionMode = {}));
var PanOnScrollMode;
(function(PanOnScrollMode2) {
  PanOnScrollMode2["Free"] = "free";
  PanOnScrollMode2["Vertical"] = "vertical";
  PanOnScrollMode2["Horizontal"] = "horizontal";
})(PanOnScrollMode || (PanOnScrollMode = {}));
var SelectionMode;
(function(SelectionMode2) {
  SelectionMode2["Partial"] = "partial";
  SelectionMode2["Full"] = "full";
})(SelectionMode || (SelectionMode = {}));
const initialConnection = {
  inProgress: false,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null,
  pointer: null
};
var ConnectionLineType;
(function(ConnectionLineType2) {
  ConnectionLineType2["Bezier"] = "default";
  ConnectionLineType2["Straight"] = "straight";
  ConnectionLineType2["Step"] = "step";
  ConnectionLineType2["SmoothStep"] = "smoothstep";
  ConnectionLineType2["SimpleBezier"] = "simplebezier";
})(ConnectionLineType || (ConnectionLineType = {}));
var MarkerType;
(function(MarkerType2) {
  MarkerType2["Arrow"] = "arrow";
  MarkerType2["ArrowClosed"] = "arrowclosed";
})(MarkerType || (MarkerType = {}));
var Position;
(function(Position2) {
  Position2["Left"] = "left";
  Position2["Top"] = "top";
  Position2["Right"] = "right";
  Position2["Bottom"] = "bottom";
})(Position || (Position = {}));
const oppositePosition = {
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top
};
function getConnectionStatus(isValid) {
  return isValid === null ? null : isValid ? "valid" : "invalid";
}
const isEdgeBase = (element2) => !!element2 && typeof element2 === "object" && "id" in element2 && "source" in element2 && "target" in element2;
const isNodeBase = (element2) => !!element2 && typeof element2 === "object" && "id" in element2 && "position" in element2 && !("source" in element2) && !("target" in element2);
const isInternalNodeBase = (element2) => !!element2 && typeof element2 === "object" && "id" in element2 && "internals" in element2 && !("source" in element2) && !("target" in element2);
const getNodePositionWithOrigin = (node2, nodeOrigin = [0, 0]) => {
  const { width, height } = getNodeDimensions(node2);
  const origin = node2.origin ?? nodeOrigin;
  const offsetX = width * origin[0];
  const offsetY = height * origin[1];
  return {
    x: node2.position.x - offsetX,
    y: node2.position.y - offsetY
  };
};
const getNodesBounds = (nodes, params = { nodeOrigin: [0, 0] }) => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let hasNode = false;
  const box = nodes.reduce((currBox, nodeOrId) => {
    const isId = typeof nodeOrId === "string";
    let currentNode = !params.nodeLookup && !isId ? nodeOrId : void 0;
    if (params.nodeLookup) {
      currentNode = isId ? params.nodeLookup.get(nodeOrId) : !isInternalNodeBase(nodeOrId) ? params.nodeLookup.get(nodeOrId.id) : nodeOrId;
    }
    if (!currentNode) {
      return currBox;
    }
    hasNode = true;
    return getBoundsOfBoxes(currBox, nodeToBox(currentNode, params.nodeOrigin));
  }, { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity });
  return hasNode ? boxToRect(box) : { x: 0, y: 0, width: 0, height: 0 };
};
const getInternalNodesBounds = (nodeLookup, params = {}) => {
  let box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
  let hasVisibleNodes = false;
  nodeLookup.forEach((node2) => {
    if (params.filter === void 0 || params.filter(node2)) {
      box = getBoundsOfBoxes(box, nodeToBox(node2));
      hasVisibleNodes = true;
    }
  });
  return hasVisibleNodes ? boxToRect(box) : { x: 0, y: 0, width: 0, height: 0 };
};
const getNodesInside = (nodes, rect, [tx, ty, tScale] = [0, 0, 1], partially = false, excludeNonSelectableNodes = false) => {
  const paneX = (rect.x - tx) / tScale;
  const paneY = (rect.y - ty) / tScale;
  const paneWidth = rect.width / tScale;
  const paneHeight = rect.height / tScale;
  const visibleNodes = [];
  for (const node2 of nodes.values()) {
    const { measured, selectable = true, hidden = false } = node2;
    if (excludeNonSelectableNodes && !selectable || hidden) {
      continue;
    }
    const width = measured.width ?? node2.width ?? node2.initialWidth ?? 0;
    const height = measured.height ?? node2.height ?? node2.initialHeight ?? 0;
    const { x, y } = node2.internals.positionAbsolute;
    const overlappingArea = getRectsOverlappingArea(paneX, paneY, paneWidth, paneHeight, x, y, width, height);
    const area = width * height;
    const partiallyVisible = partially && overlappingArea > 0;
    const forceInitialRender = !node2.internals.handleBounds;
    const isVisible = forceInitialRender || partiallyVisible || overlappingArea >= area;
    if (isVisible || node2.dragging) {
      visibleNodes.push(node2);
    }
  }
  return visibleNodes;
};
const getConnectedEdges = (nodes, edges) => {
  const nodeIds = /* @__PURE__ */ new Set();
  nodes.forEach((node2) => {
    nodeIds.add(node2.id);
  });
  return edges.filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target));
};
function getFitViewNodes(nodeLookup, options) {
  const fitViewNodes = /* @__PURE__ */ new Map();
  const optionNodeIds = options?.nodes ? new Set(options.nodes.map((node2) => node2.id)) : null;
  nodeLookup.forEach((n) => {
    let isVisible;
    if (options?.includeHiddenNodes) {
      const { width, height } = getNodeDimensions(n);
      isVisible = width > 0 && height > 0;
    } else {
      isVisible = Boolean(n.measured.width && n.measured.height && !n.hidden);
    }
    if (isVisible && (!optionNodeIds || optionNodeIds.has(n.id))) {
      fitViewNodes.set(n.id, n);
    }
  });
  return fitViewNodes;
}
async function fitViewport({ nodes, width, height, panZoom, minZoom, maxZoom }, options) {
  if (nodes.size === 0) {
    return true;
  }
  const nodesToFit = getFitViewNodes(nodes, options);
  const bounds = getInternalNodesBounds(nodesToFit);
  const viewport = getViewportForBounds(bounds, width, height, options?.minZoom ?? minZoom, options?.maxZoom ?? maxZoom, options?.padding ?? 0.1);
  await panZoom.setViewport(viewport, {
    duration: options?.duration,
    ease: options?.ease,
    interpolate: options?.interpolate
  });
  return true;
}
function calculateNodePosition({ nodeId, nextPosition, nodeLookup, nodeOrigin = [0, 0], nodeExtent, onError }) {
  const node2 = nodeLookup.get(nodeId);
  const parentNode = node2.parentId ? nodeLookup.get(node2.parentId) : void 0;
  const { x: parentX, y: parentY } = parentNode ? parentNode.internals.positionAbsolute : { x: 0, y: 0 };
  const origin = node2.origin ?? nodeOrigin;
  let extent = node2.extent || nodeExtent;
  if (node2.extent === "parent" && !node2.expandParent) {
    if (!parentNode) {
      onError?.("005", errorMessages["error005"]());
    } else {
      const { width: parentWidth, height: parentHeight } = getNodeDimensions(parentNode);
      if (parentWidth && parentHeight) {
        extent = [
          [parentX, parentY],
          [parentX + parentWidth, parentY + parentHeight]
        ];
      }
    }
  } else if (parentNode && isCoordinateExtent(node2.extent)) {
    extent = [
      [node2.extent[0][0] + parentX, node2.extent[0][1] + parentY],
      [node2.extent[1][0] + parentX, node2.extent[1][1] + parentY]
    ];
  }
  const positionAbsolute = isCoordinateExtent(extent) ? clampPosition(nextPosition, extent, node2.measured) : nextPosition;
  if (node2.measured.width === void 0 || node2.measured.height === void 0) {
    onError?.("015", errorMessages["error015"]());
  }
  return {
    position: {
      x: positionAbsolute.x - parentX + (node2.measured.width ?? 0) * origin[0],
      y: positionAbsolute.y - parentY + (node2.measured.height ?? 0) * origin[1]
    },
    positionAbsolute
  };
}
async function getElementsToRemove({ nodesToRemove = [], edgesToRemove = [], nodes, edges, onBeforeDelete }) {
  const nodeIds = new Set(nodesToRemove.map((node2) => node2.id));
  const matchingNodes = [];
  for (const node2 of nodes) {
    if (node2.deletable === false) {
      continue;
    }
    const isIncluded = nodeIds.has(node2.id);
    const parentHit = !isIncluded && node2.parentId && matchingNodes.find((n) => n.id === node2.parentId);
    if (isIncluded || parentHit) {
      matchingNodes.push(node2);
    }
  }
  const edgeIds = new Set(edgesToRemove.map((edge) => edge.id));
  const deletableEdges = edges.filter((edge) => edge.deletable !== false);
  const connectedEdges = getConnectedEdges(matchingNodes, deletableEdges);
  const matchingEdges = connectedEdges;
  for (const edge of deletableEdges) {
    const isIncluded = edgeIds.has(edge.id);
    if (isIncluded && !matchingEdges.find((e) => e.id === edge.id)) {
      matchingEdges.push(edge);
    }
  }
  if (!onBeforeDelete) {
    return {
      edges: matchingEdges,
      nodes: matchingNodes
    };
  }
  const onBeforeDeleteResult = await onBeforeDelete({
    nodes: matchingNodes,
    edges: matchingEdges
  });
  if (typeof onBeforeDeleteResult === "boolean") {
    return onBeforeDeleteResult ? { edges: matchingEdges, nodes: matchingNodes } : { edges: [], nodes: [] };
  }
  return onBeforeDeleteResult;
}
const clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);
const clampPosition = (position2 = { x: 0, y: 0 }, extent, dimensions) => ({
  x: clamp(position2.x, extent[0][0], extent[1][0] - (dimensions?.width ?? 0)),
  y: clamp(position2.y, extent[0][1], extent[1][1] - (dimensions?.height ?? 0))
});
function clampPositionToParent(childPosition, childDimensions, parent) {
  const { width: parentWidth, height: parentHeight } = getNodeDimensions(parent);
  const { x: parentX, y: parentY } = parent.internals.positionAbsolute;
  return clampPosition(childPosition, [
    [parentX, parentY],
    [parentX + parentWidth, parentY + parentHeight]
  ], childDimensions);
}
const calcAutoPanVelocity = (value, min, max) => {
  if (value < min) {
    return clamp(Math.abs(value - min), 1, min) / min;
  } else if (value > max) {
    return -clamp(Math.abs(value - max), 1, min) / min;
  }
  return 0;
};
const calcAutoPan = (pos, bounds, speed = 15, distance2 = 40) => {
  const xMovement = calcAutoPanVelocity(pos.x, distance2, bounds.width - distance2) * speed;
  const yMovement = calcAutoPanVelocity(pos.y, distance2, bounds.height - distance2) * speed;
  return [xMovement, yMovement];
};
const getBoundsOfBoxes = (box1, box2) => ({
  x: Math.min(box1.x, box2.x),
  y: Math.min(box1.y, box2.y),
  x2: Math.max(box1.x2, box2.x2),
  y2: Math.max(box1.y2, box2.y2)
});
const rectToBox = ({ x, y, width, height }) => ({
  x,
  y,
  x2: x + width,
  y2: y + height
});
const boxToRect = ({ x, y, x2, y2 }) => ({
  x,
  y,
  width: x2 - x,
  height: y2 - y
});
const nodeToRect = (node2, nodeOrigin = [0, 0]) => {
  const { x, y } = isInternalNodeBase(node2) ? node2.internals.positionAbsolute : getNodePositionWithOrigin(node2, nodeOrigin);
  return {
    x,
    y,
    width: node2.measured?.width ?? node2.width ?? node2.initialWidth ?? 0,
    height: node2.measured?.height ?? node2.height ?? node2.initialHeight ?? 0
  };
};
const nodeToBox = (node2, nodeOrigin = [0, 0]) => {
  const { x, y } = isInternalNodeBase(node2) ? node2.internals.positionAbsolute : getNodePositionWithOrigin(node2, nodeOrigin);
  return {
    x,
    y,
    x2: x + (node2.measured?.width ?? node2.width ?? node2.initialWidth ?? 0),
    y2: y + (node2.measured?.height ?? node2.height ?? node2.initialHeight ?? 0)
  };
};
const getBoundsOfRects = (rect1, rect2) => boxToRect(getBoundsOfBoxes(rectToBox(rect1), rectToBox(rect2)));
const getRectsOverlappingArea = (aX, aY, aWidth, aHeight, bX, bY, bWidth, bHeight) => {
  const xOverlap = Math.max(0, Math.min(aX + aWidth, bX + bWidth) - Math.max(aX, bX));
  const yOverlap = Math.max(0, Math.min(aY + aHeight, bY + bHeight) - Math.max(aY, bY));
  return Math.ceil(xOverlap * yOverlap);
};
const getOverlappingArea = (rectA, rectB) => getRectsOverlappingArea(rectA.x, rectA.y, rectA.width, rectA.height, rectB.x, rectB.y, rectB.width, rectB.height);
const isRectObject = (obj) => isNumeric(obj.width) && isNumeric(obj.height) && isNumeric(obj.x) && isNumeric(obj.y);
const isNumeric = (n) => !isNaN(n) && isFinite(n);
const createDevWarn = (lib, helpUrl) => (id2, message) => {
};
const snapPosition = (position2, snapGrid = [1, 1]) => {
  return {
    x: snapGrid[0] * Math.round(position2.x / snapGrid[0]),
    y: snapGrid[1] * Math.round(position2.y / snapGrid[1])
  };
};
const pointToRendererPoint = ({ x, y }, [tx, ty, tScale], snapToGrid = false, snapGrid = [1, 1]) => {
  const position2 = {
    x: (x - tx) / tScale,
    y: (y - ty) / tScale
  };
  return snapToGrid ? snapPosition(position2, snapGrid) : position2;
};
const rendererPointToPoint = ({ x, y }, [tx, ty, tScale]) => {
  return {
    x: x * tScale + tx,
    y: y * tScale + ty
  };
};
function parsePadding(padding, viewport) {
  if (typeof padding === "number") {
    return Math.floor((viewport - viewport / (1 + padding)) * 0.5);
  }
  if (typeof padding === "string" && padding.endsWith("px")) {
    const paddingValue = parseFloat(padding);
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(paddingValue);
    }
  }
  if (typeof padding === "string" && padding.endsWith("%")) {
    const paddingValue = parseFloat(padding);
    if (!Number.isNaN(paddingValue)) {
      return Math.floor(viewport * paddingValue * 0.01);
    }
  }
  console.error(`The padding value "${padding}" is invalid. Please provide a number or a string with a valid unit (px or %).`);
  return 0;
}
function parsePaddings(padding, width, height) {
  if (typeof padding === "string" || typeof padding === "number") {
    const paddingY = parsePadding(padding, height);
    const paddingX = parsePadding(padding, width);
    return {
      top: paddingY,
      right: paddingX,
      bottom: paddingY,
      left: paddingX,
      x: paddingX * 2,
      y: paddingY * 2
    };
  }
  if (typeof padding === "object") {
    const top = parsePadding(padding.top ?? padding.y ?? 0, height);
    const bottom = parsePadding(padding.bottom ?? padding.y ?? 0, height);
    const left = parsePadding(padding.left ?? padding.x ?? 0, width);
    const right = parsePadding(padding.right ?? padding.x ?? 0, width);
    return { top, right, bottom, left, x: left + right, y: top + bottom };
  }
  return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
function calculateAppliedPaddings(bounds, x, y, zoom2, width, height) {
  const { x: left, y: top } = rendererPointToPoint(bounds, [x, y, zoom2]);
  const { x: boundRight, y: boundBottom } = rendererPointToPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, [x, y, zoom2]);
  const right = width - boundRight;
  const bottom = height - boundBottom;
  return {
    left: Math.floor(left),
    top: Math.floor(top),
    right: Math.floor(right),
    bottom: Math.floor(bottom)
  };
}
const getViewportForBounds = (bounds, width, height, minZoom, maxZoom, padding) => {
  const p = parsePaddings(padding, width, height);
  const xZoom = (width - p.x) / bounds.width;
  const yZoom = (height - p.y) / bounds.height;
  const zoom2 = Math.min(xZoom, yZoom);
  const clampedZoom = clamp(zoom2, minZoom, maxZoom);
  const boundsCenterX = bounds.x + bounds.width / 2;
  const boundsCenterY = bounds.y + bounds.height / 2;
  const x = width / 2 - boundsCenterX * clampedZoom;
  const y = height / 2 - boundsCenterY * clampedZoom;
  const newPadding = calculateAppliedPaddings(bounds, x, y, clampedZoom, width, height);
  const offset = {
    left: Math.min(newPadding.left - p.left, 0),
    top: Math.min(newPadding.top - p.top, 0),
    right: Math.min(newPadding.right - p.right, 0),
    bottom: Math.min(newPadding.bottom - p.bottom, 0)
  };
  return {
    x: x - offset.left + offset.right,
    y: y - offset.top + offset.bottom,
    zoom: clampedZoom
  };
};
const isMacOs = () => typeof navigator !== "undefined" && navigator?.userAgent?.indexOf("Mac") >= 0;
function isCoordinateExtent(extent) {
  return extent !== void 0 && extent !== null && extent !== "parent";
}
function getNodeDimensions(node2) {
  return {
    width: node2.measured?.width ?? node2.width ?? node2.initialWidth ?? 0,
    height: node2.measured?.height ?? node2.height ?? node2.initialHeight ?? 0
  };
}
function nodeHasDimensions(node2) {
  return (node2.measured?.width ?? node2.width ?? node2.initialWidth) !== void 0 && (node2.measured?.height ?? node2.height ?? node2.initialHeight) !== void 0;
}
function evaluateAbsolutePosition(position2, dimensions = { width: 0, height: 0 }, parentId, nodeLookup, nodeOrigin) {
  const positionAbsolute = { ...position2 };
  const parent = nodeLookup.get(parentId);
  if (parent) {
    const origin = parent.origin || nodeOrigin;
    positionAbsolute.x += parent.internals.positionAbsolute.x - (dimensions.width ?? 0) * origin[0];
    positionAbsolute.y += parent.internals.positionAbsolute.y - (dimensions.height ?? 0) * origin[1];
  }
  return positionAbsolute;
}
function areSetsEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}
function withResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function mergeAriaLabelConfig(partial) {
  return { ...defaultAriaLabelConfig, ...partial || {} };
}
function getPointerPosition(event, { snapGrid = [0, 0], snapToGrid = false, transform: transform2, containerBounds }) {
  const { x, y } = getEventPosition(event);
  const pointerPos = pointToRendererPoint({ x: x - (containerBounds?.left ?? 0), y: y - (containerBounds?.top ?? 0) }, transform2);
  const { x: xSnapped, y: ySnapped } = snapToGrid ? snapPosition(pointerPos, snapGrid) : pointerPos;
  return {
    xSnapped,
    ySnapped,
    ...pointerPos
  };
}
const getDimensions = (node2) => ({
  width: node2.offsetWidth,
  height: node2.offsetHeight
});
const getHostForElement = (element2) => element2?.getRootNode?.() || window?.document;
const inputTags = ["INPUT", "SELECT", "TEXTAREA"];
function isInputDOMNode(event) {
  const target = event.composedPath?.()?.[0] || event.target;
  if (target?.nodeType !== 1)
    return false;
  const isInput = inputTags.includes(target.nodeName) || target.hasAttribute("contenteditable");
  return isInput || !!target.closest(".nokey");
}
const isMouseEvent = (event) => "clientX" in event;
const getEventPosition = (event, bounds) => {
  const isMouse = isMouseEvent(event);
  const evtX = isMouse ? event.clientX : event.touches?.[0].clientX;
  const evtY = isMouse ? event.clientY : event.touches?.[0].clientY;
  return {
    x: evtX - (bounds?.left ?? 0),
    y: evtY - (bounds?.top ?? 0)
  };
};
const getHandleBounds = (type, nodeElement, nodeBounds, zoom2, nodeId) => {
  const handles = nodeElement.querySelectorAll(`.${type}`);
  if (!handles || !handles.length) {
    return null;
  }
  return Array.from(handles).map((handle2) => {
    const handleBounds = handle2.getBoundingClientRect();
    return {
      id: handle2.getAttribute("data-handleid"),
      type,
      nodeId,
      position: handle2.getAttribute("data-handlepos"),
      x: (handleBounds.left - nodeBounds.left) / zoom2,
      y: (handleBounds.top - nodeBounds.top) / zoom2,
      ...getDimensions(handle2)
    };
  });
};
function getBezierEdgeCenter({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY }) {
  const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
  const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
  const offsetX = Math.abs(centerX - sourceX);
  const offsetY = Math.abs(centerY - sourceY);
  return [centerX, centerY, offsetX, offsetY];
}
function calculateControlOffset(distance2, curvature) {
  if (distance2 >= 0) {
    return 0.5 * distance2;
  }
  return curvature * 25 * Math.sqrt(-distance2);
}
function getControlWithCurvature({ pos, x1, y1, x2, y2, c }) {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
  }
}
function getBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, curvature = 0.25 }) {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature
  });
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY
  });
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY
  ];
}
function getEdgeCenter({ sourceX, sourceY, targetX, targetY }) {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;
  return [centerX, centerY, xOffset, yOffset];
}
function getElevatedEdgeZIndex({ sourceNode, targetNode, selected: selected2 = false, zIndex = 0, elevateOnSelect = false, zIndexMode = "basic" }) {
  if (zIndexMode === "manual") {
    return zIndex;
  }
  const edgeZ = elevateOnSelect && selected2 ? zIndex + 1e3 : zIndex;
  const nodeZ = Math.max(sourceNode.parentId || elevateOnSelect && sourceNode.selected ? sourceNode.internals.z : 0, targetNode.parentId || elevateOnSelect && targetNode.selected ? targetNode.internals.z : 0);
  return edgeZ + nodeZ;
}
function isEdgeVisible({ sourceNode, targetNode, width, height, transform: transform2 }) {
  const edgeBox = getBoundsOfBoxes(nodeToBox(sourceNode), nodeToBox(targetNode));
  if (edgeBox.x === edgeBox.x2) {
    edgeBox.x2 += 1;
  }
  if (edgeBox.y === edgeBox.y2) {
    edgeBox.y2 += 1;
  }
  const viewRect = {
    x: -transform2[0] / transform2[2],
    y: -transform2[1] / transform2[2],
    width: width / transform2[2],
    height: height / transform2[2]
  };
  return getOverlappingArea(viewRect, boxToRect(edgeBox)) > 0;
}
const getEdgeId = ({ source, sourceHandle, target, targetHandle }) => `xy-edge__${source}${sourceHandle || ""}-${target}${targetHandle || ""}`;
const connectionExists = (edge, edges) => {
  return edges.some((el) => el.source === edge.source && el.target === edge.target && (el.sourceHandle === edge.sourceHandle || !el.sourceHandle && !edge.sourceHandle) && (el.targetHandle === edge.targetHandle || !el.targetHandle && !edge.targetHandle));
};
const addEdge$1 = (edgeParams, edges, options = {}) => {
  if (!edgeParams.source || !edgeParams.target) {
    options.onError?.("006", errorMessages["error006"]());
    return edges;
  }
  const edgeIdGenerator = options.getEdgeId || getEdgeId;
  let edge;
  if (isEdgeBase(edgeParams)) {
    edge = { ...edgeParams };
  } else {
    edge = {
      ...edgeParams,
      id: edgeIdGenerator(edgeParams)
    };
  }
  if (connectionExists(edge, edges)) {
    return edges;
  }
  if (edge.sourceHandle === null) {
    delete edge.sourceHandle;
  }
  if (edge.targetHandle === null) {
    delete edge.targetHandle;
  }
  return edges.concat(edge);
};
function getStraightPath({ sourceX, sourceY, targetX, targetY }) {
  const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY
  });
  return [`M ${sourceX},${sourceY}L ${targetX},${targetY}`, labelX, labelY, offsetX, offsetY];
}
const handleDirections = {
  [Position.Left]: { x: -1, y: 0 },
  [Position.Right]: { x: 1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 }
};
const getDirection = ({ source, sourcePosition = Position.Bottom, target }) => {
  if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
    return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }
  return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
};
const distance = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
function getPoints({ source, sourcePosition = Position.Bottom, target, targetPosition = Position.Top, center, offset, stepPosition }) {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGapped = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
  const targetGapped = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };
  const dir = getDirection({
    source: sourceGapped,
    sourcePosition,
    target: targetGapped
  });
  const dirAccessor = dir.x !== 0 ? "x" : "y";
  const currDir = dir[dirAccessor];
  let points = [];
  let centerX, centerY;
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };
  const [, , defaultOffsetX, defaultOffsetY] = getEdgeCenter({
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y
  });
  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    if (dirAccessor === "x") {
      centerX = center.x ?? sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
      centerY = center.y ?? (sourceGapped.y + targetGapped.y) / 2;
    } else {
      centerX = center.x ?? (sourceGapped.x + targetGapped.x) / 2;
      centerY = center.y ?? sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
    }
    const verticalSplit = [
      { x: centerX, y: sourceGapped.y },
      { x: centerX, y: targetGapped.y }
    ];
    const horizontalSplit = [
      { x: sourceGapped.x, y: centerY },
      { x: targetGapped.x, y: centerY }
    ];
    if (sourceDir[dirAccessor] === currDir) {
      points = dirAccessor === "x" ? verticalSplit : horizontalSplit;
    } else {
      points = dirAccessor === "x" ? horizontalSplit : verticalSplit;
    }
  } else {
    const sourceTarget = [{ x: sourceGapped.x, y: targetGapped.y }];
    const targetSource = [{ x: targetGapped.x, y: sourceGapped.y }];
    if (dirAccessor === "x") {
      points = sourceDir.x === currDir ? targetSource : sourceTarget;
    } else {
      points = sourceDir.y === currDir ? sourceTarget : targetSource;
    }
    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
      if (diff <= offset) {
        const gapOffset = Math.min(offset - 1, offset - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] = (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
        } else {
          targetGapOffset[dirAccessor] = (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
        }
      }
    }
    if (sourcePosition !== targetPosition) {
      const dirAccessorOpposite = dirAccessor === "x" ? "y" : "x";
      const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
      const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
      const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
      const flipSourceTarget = sourceDir[dirAccessor] === 1 && (!isSameDir && sourceGtTargetOppo || isSameDir && sourceLtTargetOppo) || sourceDir[dirAccessor] !== 1 && (!isSameDir && sourceLtTargetOppo || isSameDir && sourceGtTargetOppo);
      if (flipSourceTarget) {
        points = dirAccessor === "x" ? sourceTarget : targetSource;
      }
    }
    const sourceGapPoint = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
    const targetGapPoint = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
    const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
    const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));
    if (maxXDistance >= maxYDistance) {
      centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
      centerY = points[0].y;
    } else {
      centerX = points[0].x;
      centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
    }
  }
  const gappedSource = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
  const gappedTarget = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
  const pathPoints = [
    source,
    // we only want to add the gapped source/target if they are different from the first/last point to avoid duplicates which can cause issues with the bends
    ...gappedSource.x !== points[0].x || gappedSource.y !== points[0].y ? [gappedSource] : [],
    ...points,
    ...gappedTarget.x !== points[points.length - 1].x || gappedTarget.y !== points[points.length - 1].y ? [gappedTarget] : [],
    target
  ];
  return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}
function getBend(a, b, c, size) {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;
  if (a.x === x && x === c.x || a.y === y && y === c.y) {
    return `L${x} ${y}`;
  }
  if (a.y === y) {
    const xDir2 = a.x < c.x ? -1 : 1;
    const yDir2 = a.y < c.y ? 1 : -1;
    return `L ${x + bendSize * xDir2},${y}Q ${x},${y} ${x},${y + bendSize * yDir2}`;
  }
  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}
function getSmoothStepPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, borderRadius = 5, centerX, centerY, offset = 20, stepPosition = 0.5 }) {
  const [points, labelX, labelY, offsetX, offsetY] = getPoints({
    source: { x: sourceX, y: sourceY },
    sourcePosition,
    target: { x: targetX, y: targetY },
    targetPosition,
    center: { x: centerX, y: centerY },
    offset,
    stepPosition
  });
  let path2 = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    path2 += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
  }
  path2 += `L${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return [path2, labelX, labelY, offsetX, offsetY];
}
function isNodeInitialized(node2) {
  return node2 && !!(node2.internals.handleBounds || node2.handles?.length) && !!(node2.measured.width || node2.width || node2.initialWidth);
}
function getEdgePosition(params) {
  const { sourceNode, targetNode } = params;
  if (!isNodeInitialized(sourceNode) || !isNodeInitialized(targetNode)) {
    return null;
  }
  const sourceHandleBounds = sourceNode.internals.handleBounds || toHandleBounds(sourceNode.handles);
  const targetHandleBounds = targetNode.internals.handleBounds || toHandleBounds(targetNode.handles);
  const sourceHandle = getHandle$1(sourceHandleBounds?.source ?? [], params.sourceHandle);
  const targetHandle = getHandle$1(
    // when connection type is loose we can define all handles as sources and connect source -> source
    params.connectionMode === ConnectionMode.Strict ? targetHandleBounds?.target ?? [] : (targetHandleBounds?.target ?? []).concat(targetHandleBounds?.source ?? []),
    params.targetHandle
  );
  if (!sourceHandle || !targetHandle) {
    params.onError?.("008", errorMessages["error008"](!sourceHandle ? "source" : "target", {
      id: params.id,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle
    }));
    return null;
  }
  const sourcePosition = sourceHandle?.position || Position.Bottom;
  const targetPosition = targetHandle?.position || Position.Top;
  const source = getHandlePosition(sourceNode, sourceHandle, sourcePosition);
  const target = getHandlePosition(targetNode, targetHandle, targetPosition);
  return {
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    sourcePosition,
    targetPosition
  };
}
function toHandleBounds(handles) {
  if (!handles) {
    return null;
  }
  const source = [];
  const target = [];
  for (const handle2 of handles) {
    handle2.width = handle2.width ?? 1;
    handle2.height = handle2.height ?? 1;
    if (handle2.type === "source") {
      source.push(handle2);
    } else if (handle2.type === "target") {
      target.push(handle2);
    }
  }
  return {
    source,
    target
  };
}
function getHandlePosition(node2, handle2, fallbackPosition = Position.Left, center = false) {
  const x = (handle2?.x ?? 0) + node2.internals.positionAbsolute.x;
  const y = (handle2?.y ?? 0) + node2.internals.positionAbsolute.y;
  const { width, height } = handle2 ?? getNodeDimensions(node2);
  if (center) {
    return { x: x + width / 2, y: y + height / 2 };
  }
  const position2 = handle2?.position ?? fallbackPosition;
  switch (position2) {
    case Position.Top:
      return { x: x + width / 2, y };
    case Position.Right:
      return { x: x + width, y: y + height / 2 };
    case Position.Bottom:
      return { x: x + width / 2, y: y + height };
    case Position.Left:
      return { x, y: y + height / 2 };
  }
}
function getHandle$1(bounds, handleId) {
  if (!bounds) {
    return null;
  }
  return (!handleId ? bounds[0] : bounds.find((d) => d.id === handleId)) || null;
}
function getMarkerId(marker, id2) {
  if (!marker) {
    return "";
  }
  if (typeof marker === "string") {
    return marker;
  }
  const idPrefix = id2 ? `${id2}__` : "";
  return `${idPrefix}${Object.keys(marker).sort().map((key) => `${key}=${marker[key]}`).join("&")}`;
}
function createMarkerIds(edges, { id: id2, defaultColor, defaultMarkerStart, defaultMarkerEnd }) {
  const ids = /* @__PURE__ */ new Set();
  return edges.reduce((markers, edge) => {
    [edge.markerStart || defaultMarkerStart, edge.markerEnd || defaultMarkerEnd].forEach((marker) => {
      if (marker && typeof marker === "object") {
        const markerId = getMarkerId(marker, id2);
        if (!ids.has(markerId)) {
          markers.push({ id: markerId, color: marker.color || defaultColor, ...marker });
          ids.add(markerId);
        }
      }
    });
    return markers;
  }, []).sort((a, b) => a.id.localeCompare(b.id));
}
const SELECTED_NODE_Z = 1e3;
const ROOT_PARENT_Z_INCREMENT = 10;
const defaultOptions = {
  nodeOrigin: [0, 0],
  nodeExtent: infiniteExtent,
  elevateNodesOnSelect: true,
  zIndexMode: "basic",
  defaults: {}
};
const adoptUserNodesDefaultOptions = {
  ...defaultOptions,
  checkEquality: true
};
function mergeObjects(base, incoming) {
  const result = { ...base };
  for (const key in incoming) {
    if (incoming[key] !== void 0) {
      result[key] = incoming[key];
    }
  }
  return result;
}
function updateAbsolutePositions(nodeLookup, parentLookup, options) {
  const _options = mergeObjects(defaultOptions, options);
  for (const node2 of nodeLookup.values()) {
    if (node2.parentId) {
      updateChildNode(node2, nodeLookup, parentLookup, _options);
    } else {
      const positionWithOrigin = getNodePositionWithOrigin(node2, _options.nodeOrigin);
      const extent = isCoordinateExtent(node2.extent) ? node2.extent : _options.nodeExtent;
      const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(node2));
      node2.internals.positionAbsolute = clampedPosition;
    }
  }
}
function parseHandles(userNode, internalNode) {
  if (!userNode.handles) {
    return !userNode.measured ? void 0 : internalNode?.internals.handleBounds;
  }
  const source = [];
  const target = [];
  for (const handle2 of userNode.handles) {
    const handleBounds = {
      id: handle2.id,
      width: handle2.width ?? 1,
      height: handle2.height ?? 1,
      nodeId: userNode.id,
      x: handle2.x,
      y: handle2.y,
      position: handle2.position,
      type: handle2.type
    };
    if (handle2.type === "source") {
      source.push(handleBounds);
    } else if (handle2.type === "target") {
      target.push(handleBounds);
    }
  }
  return {
    source,
    target
  };
}
function isManualZIndexMode(zIndexMode) {
  return zIndexMode === "manual";
}
function adoptUserNodes(nodes, nodeLookup, parentLookup, options = {}) {
  const _options = mergeObjects(adoptUserNodesDefaultOptions, options);
  const rootParentIndex = { i: 0 };
  const tmpLookup = new Map(nodeLookup);
  const selectedNodeZ = _options?.elevateNodesOnSelect && !isManualZIndexMode(_options.zIndexMode) ? SELECTED_NODE_Z : 0;
  let nodesInitialized = nodes.length > 0;
  let hasSelectedNodes = false;
  nodeLookup.clear();
  parentLookup.clear();
  for (const userNode of nodes) {
    let internalNode = tmpLookup.get(userNode.id);
    if (_options.checkEquality && userNode === internalNode?.internals.userNode) {
      nodeLookup.set(userNode.id, internalNode);
    } else {
      const positionWithOrigin = getNodePositionWithOrigin(userNode, _options.nodeOrigin);
      const extent = isCoordinateExtent(userNode.extent) ? userNode.extent : _options.nodeExtent;
      const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(userNode));
      internalNode = {
        ..._options.defaults,
        ...userNode,
        measured: {
          width: userNode.measured?.width,
          height: userNode.measured?.height
        },
        internals: {
          positionAbsolute: clampedPosition,
          // if user re-initializes the node or removes `measured` for whatever reason, we reset the handleBounds so that the node gets re-measured
          handleBounds: parseHandles(userNode, internalNode),
          z: calculateZ(userNode, selectedNodeZ, _options.zIndexMode),
          userNode
        }
      };
      nodeLookup.set(userNode.id, internalNode);
    }
    if ((internalNode.measured === void 0 || internalNode.measured.width === void 0 || internalNode.measured.height === void 0) && !internalNode.hidden) {
      nodesInitialized = false;
    }
    if (userNode.parentId) {
      updateChildNode(internalNode, nodeLookup, parentLookup, options, rootParentIndex);
    }
    hasSelectedNodes ||= userNode.selected ?? false;
  }
  return { nodesInitialized, hasSelectedNodes };
}
function updateParentLookup(node2, parentLookup) {
  if (!node2.parentId) {
    return;
  }
  const childNodes = parentLookup.get(node2.parentId);
  if (childNodes) {
    childNodes.set(node2.id, node2);
  } else {
    parentLookup.set(node2.parentId, /* @__PURE__ */ new Map([[node2.id, node2]]));
  }
}
function updateChildNode(node2, nodeLookup, parentLookup, options, rootParentIndex) {
  const { elevateNodesOnSelect, nodeOrigin, nodeExtent, zIndexMode } = mergeObjects(defaultOptions, options);
  const parentId = node2.parentId;
  const parentNode = nodeLookup.get(parentId);
  if (!parentNode) {
    console.warn(`Parent node ${parentId} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
    return;
  }
  updateParentLookup(node2, parentLookup);
  if (rootParentIndex && !parentNode.parentId && parentNode.internals.rootParentIndex === void 0 && zIndexMode === "auto") {
    parentNode.internals.rootParentIndex = ++rootParentIndex.i;
    parentNode.internals.z = parentNode.internals.z + rootParentIndex.i * ROOT_PARENT_Z_INCREMENT;
  }
  if (rootParentIndex && parentNode.internals.rootParentIndex !== void 0) {
    rootParentIndex.i = parentNode.internals.rootParentIndex;
  }
  const selectedNodeZ = elevateNodesOnSelect && !isManualZIndexMode(zIndexMode) ? SELECTED_NODE_Z : 0;
  const { x, y, z } = calculateChildXYZ(node2, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode);
  const { positionAbsolute } = node2.internals;
  const positionChanged = x !== positionAbsolute.x || y !== positionAbsolute.y;
  if (positionChanged || z !== node2.internals.z) {
    nodeLookup.set(node2.id, {
      ...node2,
      internals: {
        ...node2.internals,
        positionAbsolute: positionChanged ? { x, y } : positionAbsolute,
        z
      }
    });
  }
}
function calculateZ(node2, selectedNodeZ, zIndexMode) {
  const zIndex = isNumeric(node2.zIndex) ? node2.zIndex : 0;
  if (isManualZIndexMode(zIndexMode)) {
    return zIndex;
  }
  return zIndex + (node2.selected ? selectedNodeZ : 0);
}
function calculateChildXYZ(childNode, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode) {
  const { x: parentX, y: parentY } = parentNode.internals.positionAbsolute;
  const childDimensions = getNodeDimensions(childNode);
  const positionWithOrigin = getNodePositionWithOrigin(childNode, nodeOrigin);
  const clampedPosition = isCoordinateExtent(childNode.extent) ? clampPosition(positionWithOrigin, childNode.extent, childDimensions) : positionWithOrigin;
  let absolutePosition = clampPosition({ x: parentX + clampedPosition.x, y: parentY + clampedPosition.y }, nodeExtent, childDimensions);
  if (childNode.extent === "parent") {
    absolutePosition = clampPositionToParent(absolutePosition, childDimensions, parentNode);
  }
  const childZ = calculateZ(childNode, selectedNodeZ, zIndexMode);
  const parentZ = parentNode.internals.z ?? 0;
  return {
    x: absolutePosition.x,
    y: absolutePosition.y,
    z: parentZ >= childZ ? parentZ + 1 : childZ
  };
}
function handleExpandParent(children2, nodeLookup, parentLookup, nodeOrigin = [0, 0]) {
  const changes = [];
  const parentExpansions = /* @__PURE__ */ new Map();
  for (const child of children2) {
    const parent = nodeLookup.get(child.parentId);
    if (!parent) {
      continue;
    }
    const parentRect = parentExpansions.get(child.parentId)?.expandedRect ?? nodeToRect(parent);
    const expandedRect = getBoundsOfRects(parentRect, child.rect);
    parentExpansions.set(child.parentId, { expandedRect, parent });
  }
  if (parentExpansions.size > 0) {
    parentExpansions.forEach(({ expandedRect, parent }, parentId) => {
      const positionAbsolute = parent.internals.positionAbsolute;
      const dimensions = getNodeDimensions(parent);
      const origin = parent.origin ?? nodeOrigin;
      const xChange = expandedRect.x < positionAbsolute.x ? Math.round(Math.abs(positionAbsolute.x - expandedRect.x)) : 0;
      const yChange = expandedRect.y < positionAbsolute.y ? Math.round(Math.abs(positionAbsolute.y - expandedRect.y)) : 0;
      const newWidth = Math.max(dimensions.width, Math.round(expandedRect.width));
      const newHeight = Math.max(dimensions.height, Math.round(expandedRect.height));
      const widthChange = (newWidth - dimensions.width) * origin[0];
      const heightChange = (newHeight - dimensions.height) * origin[1];
      if (xChange > 0 || yChange > 0 || widthChange || heightChange) {
        changes.push({
          id: parentId,
          type: "position",
          position: {
            x: parent.position.x - xChange + widthChange,
            y: parent.position.y - yChange + heightChange
          }
        });
        parentLookup.get(parentId)?.forEach((childNode) => {
          if (!children2.some((child) => child.id === childNode.id)) {
            changes.push({
              id: childNode.id,
              type: "position",
              position: {
                x: childNode.position.x + xChange,
                y: childNode.position.y + yChange
              }
            });
          }
        });
      }
      if (dimensions.width < expandedRect.width || dimensions.height < expandedRect.height || xChange || yChange) {
        changes.push({
          id: parentId,
          type: "dimensions",
          setAttributes: true,
          dimensions: {
            width: newWidth + (xChange ? origin[0] * xChange - widthChange : 0),
            height: newHeight + (yChange ? origin[1] * yChange - heightChange : 0)
          }
        });
      }
    });
  }
  return changes;
}
function updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, zIndexMode) {
  const viewportNode = domNode?.querySelector(".xyflow__viewport");
  let updatedInternals = false;
  if (!viewportNode) {
    return { changes: [], updatedInternals };
  }
  const changes = [];
  const style2 = window.getComputedStyle(viewportNode);
  const { m22: zoom2 } = new window.DOMMatrixReadOnly(style2.transform);
  const parentExpandChildren = [];
  for (const update of updates.values()) {
    const node2 = nodeLookup.get(update.id);
    if (!node2) {
      continue;
    }
    if (node2.hidden) {
      nodeLookup.set(node2.id, {
        ...node2,
        internals: {
          ...node2.internals,
          handleBounds: void 0
        }
      });
      updatedInternals = true;
      continue;
    }
    const dimensions = getDimensions(update.nodeElement);
    const dimensionChanged = node2.measured.width !== dimensions.width || node2.measured.height !== dimensions.height;
    const doUpdate = !!(dimensions.width && dimensions.height && (dimensionChanged || !node2.internals.handleBounds || update.force));
    if (doUpdate) {
      const nodeBounds = update.nodeElement.getBoundingClientRect();
      const extent = isCoordinateExtent(node2.extent) ? node2.extent : nodeExtent;
      let { positionAbsolute } = node2.internals;
      if (node2.parentId && node2.extent === "parent") {
        const parentNode = nodeLookup.get(node2.parentId);
        if (parentNode) {
          positionAbsolute = clampPositionToParent(positionAbsolute, dimensions, parentNode);
        }
      } else if (extent) {
        positionAbsolute = clampPosition(positionAbsolute, extent, dimensions);
      }
      const newNode = {
        ...node2,
        measured: dimensions,
        internals: {
          ...node2.internals,
          positionAbsolute,
          handleBounds: {
            source: getHandleBounds("source", update.nodeElement, nodeBounds, zoom2, node2.id),
            target: getHandleBounds("target", update.nodeElement, nodeBounds, zoom2, node2.id)
          }
        }
      };
      nodeLookup.set(node2.id, newNode);
      if (node2.parentId) {
        updateChildNode(newNode, nodeLookup, parentLookup, { nodeOrigin, zIndexMode });
      }
      updatedInternals = true;
      if (dimensionChanged) {
        changes.push({
          id: node2.id,
          type: "dimensions",
          dimensions
        });
        if (node2.expandParent && node2.parentId) {
          parentExpandChildren.push({
            id: node2.id,
            parentId: node2.parentId,
            rect: nodeToRect(newNode, nodeOrigin)
          });
        }
      }
    }
  }
  if (parentExpandChildren.length > 0) {
    const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin);
    changes.push(...parentExpandChanges);
  }
  return { changes, updatedInternals };
}
async function panBy({ delta, panZoom, transform: transform2, translateExtent, width, height }) {
  if (!panZoom || !delta.x && !delta.y) {
    return false;
  }
  const nextViewport = await panZoom.setViewportConstrained({
    x: transform2[0] + delta.x,
    y: transform2[1] + delta.y,
    zoom: transform2[2]
  }, [
    [0, 0],
    [width, height]
  ], translateExtent);
  const transformChanged = !!nextViewport && (nextViewport.x !== transform2[0] || nextViewport.y !== transform2[1] || nextViewport.k !== transform2[2]);
  return transformChanged;
}
function addConnectionToLookup(type, connection, connectionKey, connectionLookup, nodeId, handleId) {
  let key = nodeId;
  const nodeMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
  connectionLookup.set(key, nodeMap.set(connectionKey, connection));
  key = `${nodeId}-${type}`;
  const typeMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
  connectionLookup.set(key, typeMap.set(connectionKey, connection));
  if (handleId) {
    key = `${nodeId}-${type}-${handleId}`;
    const handleMap = connectionLookup.get(key) || /* @__PURE__ */ new Map();
    connectionLookup.set(key, handleMap.set(connectionKey, connection));
  }
}
function updateConnectionLookup(connectionLookup, edgeLookup, edges) {
  connectionLookup.clear();
  edgeLookup.clear();
  for (const edge of edges) {
    const { source: sourceNode, target: targetNode, sourceHandle = null, targetHandle = null } = edge;
    const connection = { edgeId: edge.id, source: sourceNode, target: targetNode, sourceHandle, targetHandle };
    const sourceKey = `${sourceNode}-${sourceHandle}--${targetNode}-${targetHandle}`;
    const targetKey = `${targetNode}-${targetHandle}--${sourceNode}-${sourceHandle}`;
    addConnectionToLookup("source", connection, targetKey, connectionLookup, sourceNode, sourceHandle);
    addConnectionToLookup("target", connection, sourceKey, connectionLookup, targetNode, targetHandle);
    edgeLookup.set(edge.id, edge);
  }
}
function isParentSelected(node2, nodeLookup) {
  if (!node2.parentId) {
    return false;
  }
  const parentNode = nodeLookup.get(node2.parentId);
  if (!parentNode) {
    return false;
  }
  if (parentNode.selected) {
    return true;
  }
  return isParentSelected(parentNode, nodeLookup);
}
function hasSelector(target, selector2, domNode) {
  let current = target;
  do {
    if (current?.matches?.(selector2))
      return true;
    if (current === domNode)
      return false;
    current = current?.parentElement;
  } while (current);
  return false;
}
function getDragItems(nodeLookup, nodesDraggable, mousePos, nodeId) {
  const dragItems = /* @__PURE__ */ new Map();
  for (const [id2, node2] of nodeLookup) {
    if ((node2.selected || node2.id === nodeId) && (!node2.parentId || !isParentSelected(node2, nodeLookup)) && (node2.draggable || nodesDraggable && typeof node2.draggable === "undefined")) {
      const internalNode = nodeLookup.get(id2);
      if (internalNode) {
        dragItems.set(id2, {
          id: id2,
          position: internalNode.position || { x: 0, y: 0 },
          distance: {
            x: mousePos.x - internalNode.internals.positionAbsolute.x,
            y: mousePos.y - internalNode.internals.positionAbsolute.y
          },
          extent: internalNode.extent,
          parentId: internalNode.parentId,
          origin: internalNode.origin,
          expandParent: internalNode.expandParent,
          internals: {
            positionAbsolute: internalNode.internals.positionAbsolute || { x: 0, y: 0 }
          },
          measured: {
            width: internalNode.measured.width ?? 0,
            height: internalNode.measured.height ?? 0
          }
        });
      }
    }
  }
  return dragItems;
}
function getEventHandlerParams({ nodeId, dragItems, nodeLookup, dragging = true }) {
  const nodesFromDragItems = [];
  for (const [id2, dragItem] of dragItems) {
    const node22 = nodeLookup.get(id2)?.internals.userNode;
    if (node22) {
      nodesFromDragItems.push({
        ...node22,
        position: dragItem.position,
        dragging
      });
    }
  }
  if (!nodeId) {
    return [nodesFromDragItems[0], nodesFromDragItems];
  }
  const node2 = nodeLookup.get(nodeId)?.internals.userNode;
  return [
    !node2 ? nodesFromDragItems[0] : {
      ...node2,
      position: dragItems.get(nodeId)?.position || node2.position,
      dragging
    },
    nodesFromDragItems
  ];
}
function calculateSnapOffset({ dragItems, snapGrid, x, y }) {
  const refDragItem = dragItems.values().next().value;
  if (!refDragItem) {
    return null;
  }
  const refPos = {
    x: x - refDragItem.distance.x,
    y: y - refDragItem.distance.y
  };
  const refPosSnapped = snapPosition(refPos, snapGrid);
  return {
    x: refPosSnapped.x - refPos.x,
    y: refPosSnapped.y - refPos.y
  };
}
function XYDrag({ onNodeMouseDown, getStoreItems, onDragStart, onDrag, onDragStop }) {
  let lastPos = { x: null, y: null };
  let autoPanId = 0;
  let dragItems = /* @__PURE__ */ new Map();
  let autoPanStarted = false;
  let mousePosition = { x: 0, y: 0 };
  let containerBounds = null;
  let dragStarted = false;
  let d3Selection = null;
  let abortDrag = false;
  let nodePositionsChanged = false;
  let dragEvent = null;
  function update({ noDragClassName, handleSelector, domNode, isSelectable, nodeId, nodeClickDistance = 0 }) {
    d3Selection = select(domNode);
    function updateNodes({ x, y }) {
      const { nodeLookup, nodeExtent, snapGrid, snapToGrid, nodeOrigin, onNodeDrag, onSelectionDrag, onError, updateNodePositions } = getStoreItems();
      lastPos = { x, y };
      let hasChange = false;
      const isMultiDrag = dragItems.size > 1;
      const nodesBox = isMultiDrag && nodeExtent ? rectToBox(getInternalNodesBounds(dragItems)) : null;
      const multiDragSnapOffset = isMultiDrag && snapToGrid ? calculateSnapOffset({
        dragItems,
        snapGrid,
        x,
        y
      }) : null;
      for (const [id2, dragItem] of dragItems) {
        if (!nodeLookup.has(id2)) {
          continue;
        }
        let nextPosition = { x: x - dragItem.distance.x, y: y - dragItem.distance.y };
        if (snapToGrid) {
          nextPosition = multiDragSnapOffset ? {
            x: Math.round(nextPosition.x + multiDragSnapOffset.x),
            y: Math.round(nextPosition.y + multiDragSnapOffset.y)
          } : snapPosition(nextPosition, snapGrid);
        }
        let adjustedNodeExtent = null;
        if (isMultiDrag && nodeExtent && !dragItem.extent && nodesBox) {
          const { positionAbsolute: positionAbsolute2 } = dragItem.internals;
          const x1 = positionAbsolute2.x - nodesBox.x + nodeExtent[0][0];
          const x2 = positionAbsolute2.x + dragItem.measured.width - nodesBox.x2 + nodeExtent[1][0];
          const y1 = positionAbsolute2.y - nodesBox.y + nodeExtent[0][1];
          const y2 = positionAbsolute2.y + dragItem.measured.height - nodesBox.y2 + nodeExtent[1][1];
          adjustedNodeExtent = [
            [x1, y1],
            [x2, y2]
          ];
        }
        const { position: position2, positionAbsolute } = calculateNodePosition({
          nodeId: id2,
          nextPosition,
          nodeLookup,
          nodeExtent: adjustedNodeExtent ? adjustedNodeExtent : nodeExtent,
          nodeOrigin,
          onError
        });
        hasChange = hasChange || dragItem.position.x !== position2.x || dragItem.position.y !== position2.y;
        dragItem.position = position2;
        dragItem.internals.positionAbsolute = positionAbsolute;
      }
      nodePositionsChanged = nodePositionsChanged || hasChange;
      if (!hasChange) {
        return;
      }
      updateNodePositions(dragItems, true);
      if (dragEvent && (onDrag || onNodeDrag || !nodeId && onSelectionDrag)) {
        const [currentNode, currentNodes] = getEventHandlerParams({
          nodeId,
          dragItems,
          nodeLookup
        });
        onDrag?.(dragEvent, dragItems, currentNode, currentNodes);
        onNodeDrag?.(dragEvent, currentNode, currentNodes);
        if (!nodeId) {
          onSelectionDrag?.(dragEvent, currentNodes);
        }
      }
    }
    async function autoPan() {
      if (!containerBounds) {
        return;
      }
      const { transform: transform2, panBy: panBy2, autoPanSpeed, autoPanOnNodeDrag } = getStoreItems();
      if (!autoPanOnNodeDrag) {
        autoPanStarted = false;
        cancelAnimationFrame(autoPanId);
        return;
      }
      const [xMovement, yMovement] = calcAutoPan(mousePosition, containerBounds, autoPanSpeed);
      if (xMovement !== 0 || yMovement !== 0) {
        lastPos.x = (lastPos.x ?? 0) - xMovement / transform2[2];
        lastPos.y = (lastPos.y ?? 0) - yMovement / transform2[2];
        if (await panBy2({ x: xMovement, y: yMovement })) {
          updateNodes(lastPos);
        }
      }
      autoPanId = requestAnimationFrame(autoPan);
    }
    function startDrag(event) {
      const { nodeLookup, multiSelectionActive, nodesDraggable, transform: transform2, snapGrid, snapToGrid, selectNodesOnDrag, onNodeDragStart, onSelectionDragStart, unselectNodesAndEdges } = getStoreItems();
      dragStarted = true;
      if ((!selectNodesOnDrag || !isSelectable) && !multiSelectionActive && nodeId) {
        if (!nodeLookup.get(nodeId)?.selected) {
          unselectNodesAndEdges();
        }
      }
      if (isSelectable && selectNodesOnDrag && nodeId) {
        onNodeMouseDown?.(nodeId);
      }
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      lastPos = pointerPos;
      dragItems = getDragItems(nodeLookup, nodesDraggable, pointerPos, nodeId);
      if (dragItems.size > 0 && (onDragStart || onNodeDragStart || !nodeId && onSelectionDragStart)) {
        const [currentNode, currentNodes] = getEventHandlerParams({
          nodeId,
          dragItems,
          nodeLookup
        });
        onDragStart?.(event.sourceEvent, dragItems, currentNode, currentNodes);
        onNodeDragStart?.(event.sourceEvent, currentNode, currentNodes);
        if (!nodeId) {
          onSelectionDragStart?.(event.sourceEvent, currentNodes);
        }
      }
    }
    const d3DragInstance = drag().clickDistance(nodeClickDistance).on("start", (event) => {
      const { domNode: domNode2, nodeDragThreshold, transform: transform2, snapGrid, snapToGrid } = getStoreItems();
      containerBounds = domNode2?.getBoundingClientRect() || null;
      abortDrag = false;
      nodePositionsChanged = false;
      dragEvent = event.sourceEvent;
      if (nodeDragThreshold === 0) {
        startDrag(event);
      }
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      lastPos = pointerPos;
      mousePosition = getEventPosition(event.sourceEvent, containerBounds);
    }).on("drag", (event) => {
      const { autoPanOnNodeDrag, transform: transform2, snapGrid, snapToGrid, nodeDragThreshold, nodeLookup } = getStoreItems();
      const pointerPos = getPointerPosition(event.sourceEvent, { transform: transform2, snapGrid, snapToGrid, containerBounds });
      dragEvent = event.sourceEvent;
      if (event.sourceEvent.type === "touchmove" && event.sourceEvent.touches.length > 1 || // if user deletes a node while dragging, we need to abort the drag to prevent errors
      nodeId && !nodeLookup.has(nodeId)) {
        abortDrag = true;
      }
      if (abortDrag) {
        return;
      }
      if (!autoPanStarted && autoPanOnNodeDrag && dragStarted) {
        autoPanStarted = true;
        autoPan();
      }
      if (!dragStarted) {
        const currentMousePosition = getEventPosition(event.sourceEvent, containerBounds);
        const x = currentMousePosition.x - mousePosition.x;
        const y = currentMousePosition.y - mousePosition.y;
        const distance2 = Math.sqrt(x * x + y * y);
        if (distance2 > nodeDragThreshold) {
          startDrag(event);
        }
      }
      if ((lastPos.x !== pointerPos.xSnapped || lastPos.y !== pointerPos.ySnapped) && dragItems && dragStarted) {
        mousePosition = getEventPosition(event.sourceEvent, containerBounds);
        updateNodes(pointerPos);
      }
    }).on("end", (event) => {
      if (!dragStarted || abortDrag) {
        if (abortDrag && dragItems.size > 0) {
          getStoreItems().updateNodePositions(dragItems, false);
        }
        return;
      }
      autoPanStarted = false;
      dragStarted = false;
      cancelAnimationFrame(autoPanId);
      if (dragItems.size > 0) {
        const { nodeLookup, updateNodePositions, onNodeDragStop, onSelectionDragStop } = getStoreItems();
        if (nodePositionsChanged) {
          updateNodePositions(dragItems, false);
          nodePositionsChanged = false;
        }
        if (onDragStop || onNodeDragStop || !nodeId && onSelectionDragStop) {
          const [currentNode, currentNodes] = getEventHandlerParams({
            nodeId,
            dragItems,
            nodeLookup,
            dragging: false
          });
          onDragStop?.(event.sourceEvent, dragItems, currentNode, currentNodes);
          onNodeDragStop?.(event.sourceEvent, currentNode, currentNodes);
          if (!nodeId) {
            onSelectionDragStop?.(event.sourceEvent, currentNodes);
          }
        }
      }
    }).filter((event) => {
      const target = event.target;
      const isDraggable = !event.button && (!noDragClassName || !hasSelector(target, `.${noDragClassName}`, domNode)) && (!handleSelector || hasSelector(target, handleSelector, domNode));
      return isDraggable;
    });
    d3Selection.call(d3DragInstance);
  }
  function destroy() {
    d3Selection?.on(".drag", null);
  }
  return {
    update,
    destroy
  };
}
function getNodesWithinDistance(position2, nodeLookup, distance2) {
  const nodes = [];
  const rect = {
    x: position2.x - distance2,
    y: position2.y - distance2,
    width: distance2 * 2,
    height: distance2 * 2
  };
  for (const node2 of nodeLookup.values()) {
    if (getOverlappingArea(rect, nodeToRect(node2)) > 0) {
      nodes.push(node2);
    }
  }
  return nodes;
}
const ADDITIONAL_DISTANCE = 250;
function getClosestHandle(position2, connectionRadius, nodeLookup, fromHandle) {
  let closestHandles = [];
  let minDistance = Infinity;
  const closeNodes = getNodesWithinDistance(position2, nodeLookup, connectionRadius + ADDITIONAL_DISTANCE);
  for (const node2 of closeNodes) {
    const allHandles = [...node2.internals.handleBounds?.source ?? [], ...node2.internals.handleBounds?.target ?? []];
    for (const handle2 of allHandles) {
      if (fromHandle.nodeId === handle2.nodeId && fromHandle.type === handle2.type && fromHandle.id === handle2.id) {
        continue;
      }
      const { x, y } = getHandlePosition(node2, handle2, handle2.position, true);
      const distance2 = Math.sqrt(Math.pow(x - position2.x, 2) + Math.pow(y - position2.y, 2));
      if (distance2 > connectionRadius) {
        continue;
      }
      if (distance2 < minDistance) {
        closestHandles = [{ ...handle2, x, y }];
        minDistance = distance2;
      } else if (distance2 === minDistance) {
        closestHandles.push({ ...handle2, x, y });
      }
    }
  }
  if (!closestHandles.length) {
    return null;
  }
  if (closestHandles.length > 1) {
    const oppositeHandleType = fromHandle.type === "source" ? "target" : "source";
    return closestHandles.find((handle2) => handle2.type === oppositeHandleType) ?? closestHandles[0];
  }
  return closestHandles[0];
}
function getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode, withAbsolutePosition = false) {
  const node2 = nodeLookup.get(nodeId);
  if (!node2) {
    return null;
  }
  const handles = connectionMode === "strict" ? node2.internals.handleBounds?.[handleType] : [...node2.internals.handleBounds?.source ?? [], ...node2.internals.handleBounds?.target ?? []];
  const handle2 = (handleId ? handles?.find((h) => h.id === handleId) : handles?.[0]) ?? null;
  return handle2 && withAbsolutePosition ? { ...handle2, ...getHandlePosition(node2, handle2, handle2.position, true) } : handle2;
}
function getHandleType(edgeUpdaterType, handleDomNode) {
  if (edgeUpdaterType) {
    return edgeUpdaterType;
  } else if (handleDomNode?.classList.contains("target")) {
    return "target";
  } else if (handleDomNode?.classList.contains("source")) {
    return "source";
  }
  return null;
}
function isConnectionValid(isInsideConnectionRadius, isHandleValid) {
  let isValid = null;
  if (isHandleValid) {
    isValid = true;
  } else if (isInsideConnectionRadius && !isHandleValid) {
    isValid = false;
  }
  return isValid;
}
const alwaysValid = () => true;
function onPointerDown(event, { connectionMode, connectionRadius, handleId, nodeId, edgeUpdaterType, isTarget, domNode, nodeLookup, lib, autoPanOnConnect, flowId, panBy: panBy2, cancelConnection, onConnectStart, onConnect, onConnectEnd, isValidConnection = alwaysValid, onReconnectEnd, updateConnection, getTransform, getFromHandle, autoPanSpeed, dragThreshold = 1, handleDomNode }) {
  const doc = getHostForElement(event.target);
  let autoPanId = 0;
  let closestHandle;
  const { x, y } = getEventPosition(event);
  const handleType = getHandleType(edgeUpdaterType, handleDomNode);
  const containerBounds = domNode?.getBoundingClientRect();
  let connectionStarted = false;
  if (!containerBounds || !handleType) {
    return;
  }
  const fromHandleInternal = getHandle(nodeId, handleType, handleId, nodeLookup, connectionMode);
  if (!fromHandleInternal) {
    return;
  }
  let position2 = getEventPosition(event, containerBounds);
  let autoPanStarted = false;
  let connection = null;
  let isValid = false;
  let resultHandleDomNode = null;
  function autoPan() {
    if (!autoPanOnConnect || !containerBounds) {
      return;
    }
    const [x2, y2] = calcAutoPan(position2, containerBounds, autoPanSpeed);
    panBy2({ x: x2, y: y2 });
    autoPanId = requestAnimationFrame(autoPan);
  }
  const fromHandle = {
    ...fromHandleInternal,
    nodeId,
    type: handleType,
    position: fromHandleInternal.position
  };
  const fromInternalNode = nodeLookup.get(nodeId);
  const from = getHandlePosition(fromInternalNode, fromHandle, Position.Left, true);
  let previousConnection = {
    inProgress: true,
    isValid: null,
    from,
    fromHandle,
    fromPosition: fromHandle.position,
    fromNode: fromInternalNode,
    to: position2,
    toHandle: null,
    toPosition: oppositePosition[fromHandle.position],
    toNode: null,
    pointer: position2
  };
  function startConnection() {
    connectionStarted = true;
    updateConnection(previousConnection);
    onConnectStart?.(event, { nodeId, handleId, handleType });
  }
  if (dragThreshold === 0) {
    startConnection();
  }
  function onPointerMove(event2) {
    if (!connectionStarted) {
      const { x: evtX, y: evtY } = getEventPosition(event2);
      const dx = evtX - x;
      const dy = evtY - y;
      const nextConnectionStarted = dx * dx + dy * dy > dragThreshold * dragThreshold;
      if (!nextConnectionStarted) {
        return;
      }
      startConnection();
    }
    if (!getFromHandle() || !fromHandle) {
      onPointerUp(event2);
      return;
    }
    const transform2 = getTransform();
    position2 = getEventPosition(event2, containerBounds);
    closestHandle = getClosestHandle(pointToRendererPoint(position2, transform2, false, [1, 1]), connectionRadius, nodeLookup, fromHandle);
    if (!autoPanStarted) {
      autoPan();
      autoPanStarted = true;
    }
    const result = isValidHandle(event2, {
      handle: closestHandle,
      connectionMode,
      fromNodeId: nodeId,
      fromHandleId: handleId,
      fromType: isTarget ? "target" : "source",
      isValidConnection,
      doc,
      lib,
      flowId,
      nodeLookup
    });
    resultHandleDomNode = result.handleDomNode;
    connection = result.connection;
    isValid = isConnectionValid(!!closestHandle, result.isValid);
    const fromInternalNode2 = nodeLookup.get(nodeId);
    const from2 = fromInternalNode2 ? getHandlePosition(fromInternalNode2, fromHandle, Position.Left, true) : previousConnection.from;
    const newConnection = {
      ...previousConnection,
      from: from2,
      isValid,
      to: result.toHandle && isValid ? rendererPointToPoint({ x: result.toHandle.x, y: result.toHandle.y }, transform2) : position2,
      toHandle: result.toHandle,
      toPosition: isValid && result.toHandle ? result.toHandle.position : oppositePosition[fromHandle.position],
      toNode: result.toHandle ? nodeLookup.get(result.toHandle.nodeId) : null,
      pointer: position2
    };
    updateConnection(newConnection);
    previousConnection = newConnection;
  }
  function onPointerUp(event2) {
    if ("touches" in event2 && event2.touches.length > 0) {
      return;
    }
    if (connectionStarted) {
      if ((closestHandle || resultHandleDomNode) && connection && isValid) {
        onConnect?.(connection);
      }
      const { inProgress, ...connectionState } = previousConnection;
      const finalConnectionState = {
        ...connectionState,
        toPosition: previousConnection.toHandle ? previousConnection.toPosition : null
      };
      onConnectEnd?.(event2, finalConnectionState);
      if (edgeUpdaterType) {
        onReconnectEnd?.(event2, finalConnectionState);
      }
    }
    cancelConnection();
    cancelAnimationFrame(autoPanId);
    autoPanStarted = false;
    isValid = false;
    connection = null;
    resultHandleDomNode = null;
    doc.removeEventListener("mousemove", onPointerMove);
    doc.removeEventListener("mouseup", onPointerUp);
    doc.removeEventListener("touchmove", onPointerMove);
    doc.removeEventListener("touchend", onPointerUp);
  }
  doc.addEventListener("mousemove", onPointerMove);
  doc.addEventListener("mouseup", onPointerUp);
  doc.addEventListener("touchmove", onPointerMove);
  doc.addEventListener("touchend", onPointerUp);
}
function isValidHandle(event, { handle: handle2, connectionMode, fromNodeId, fromHandleId, fromType, doc, lib, flowId, isValidConnection = alwaysValid, nodeLookup }) {
  const isTarget = fromType === "target";
  const handleDomNode = handle2 ? doc.querySelector(`.${lib}-flow__handle[data-id="${flowId}-${handle2?.nodeId}-${handle2?.id}-${handle2?.type}"]`) : null;
  const { x, y } = getEventPosition(event);
  const handleBelow = doc.elementFromPoint(x, y);
  const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`) ? handleBelow : handleDomNode;
  const result = {
    handleDomNode: handleToCheck,
    isValid: false,
    connection: null,
    toHandle: null
  };
  if (handleToCheck) {
    const handleType = getHandleType(void 0, handleToCheck);
    const handleNodeId = handleToCheck.getAttribute("data-nodeid");
    const handleId = handleToCheck.getAttribute("data-handleid");
    const connectable = handleToCheck.classList.contains("connectable");
    const connectableEnd = handleToCheck.classList.contains("connectableend");
    if (!handleNodeId || !handleType) {
      return result;
    }
    const connection = {
      source: isTarget ? handleNodeId : fromNodeId,
      sourceHandle: isTarget ? handleId : fromHandleId,
      target: isTarget ? fromNodeId : handleNodeId,
      targetHandle: isTarget ? fromHandleId : handleId
    };
    result.connection = connection;
    const isConnectable = connectable && connectableEnd;
    const isValid = isConnectable && (connectionMode === ConnectionMode.Strict ? isTarget && handleType === "source" || !isTarget && handleType === "target" : handleNodeId !== fromNodeId || handleId !== fromHandleId);
    result.isValid = isValid && isValidConnection(connection);
    result.toHandle = getHandle(handleNodeId, handleType, handleId, nodeLookup, connectionMode, true);
  }
  return result;
}
const XYHandle = {
  onPointerDown,
  isValid: isValidHandle
};
function XYMinimap({ domNode, panZoom, getTransform, getViewScale }) {
  const selection2 = select(domNode);
  function update({ translateExtent, width, height, zoomStep = 1, pannable = true, zoomable = true, inversePan = false }) {
    const zoomHandler = (event) => {
      if (event.sourceEvent.type !== "wheel" || !panZoom) {
        return;
      }
      const transform2 = getTransform();
      const factor = event.sourceEvent.ctrlKey && isMacOs() ? 10 : 1;
      const pinchDelta = -event.sourceEvent.deltaY * (event.sourceEvent.deltaMode === 1 ? 0.05 : event.sourceEvent.deltaMode ? 1 : 2e-3) * zoomStep;
      const nextZoom = transform2[2] * Math.pow(2, pinchDelta * factor);
      panZoom.scaleTo(nextZoom);
    };
    let panStart = [0, 0];
    const panStartHandler = (event) => {
      if (event.sourceEvent.type === "mousedown" || event.sourceEvent.type === "touchstart") {
        panStart = [
          event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX,
          event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY
        ];
      }
    };
    const panHandler = (event) => {
      const transform2 = getTransform();
      if (event.sourceEvent.type !== "mousemove" && event.sourceEvent.type !== "touchmove" || !panZoom) {
        return;
      }
      const panCurrent = [
        event.sourceEvent.clientX ?? event.sourceEvent.touches[0].clientX,
        event.sourceEvent.clientY ?? event.sourceEvent.touches[0].clientY
      ];
      const panDelta = [panCurrent[0] - panStart[0], panCurrent[1] - panStart[1]];
      panStart = panCurrent;
      const moveScale = getViewScale() * Math.max(transform2[2], Math.log(transform2[2])) * (inversePan ? -1 : 1);
      const position2 = {
        x: transform2[0] - panDelta[0] * moveScale,
        y: transform2[1] - panDelta[1] * moveScale
      };
      const extent = [
        [0, 0],
        [width, height]
      ];
      panZoom.setViewportConstrained({
        x: position2.x,
        y: position2.y,
        zoom: transform2[2]
      }, extent, translateExtent);
    };
    const zoomAndPanHandler = zoom().on("start", panStartHandler).on("zoom", pannable ? panHandler : null).on("zoom.wheel", zoomable ? zoomHandler : null);
    selection2.call(zoomAndPanHandler, {});
  }
  function destroy() {
    selection2.on("zoom", null);
  }
  return {
    update,
    destroy,
    pointer
  };
}
const transformToViewport = (transform2) => ({
  x: transform2.x,
  y: transform2.y,
  zoom: transform2.k
});
const viewportToTransform = ({ x, y, zoom: zoom2 }) => identity$1.translate(x, y).scale(zoom2);
const isWrappedWithClass = (event, className) => event.target.closest(`.${className}`);
const isRightClickPan = (panOnDrag, usedButton) => usedButton === 2 && Array.isArray(panOnDrag) && panOnDrag.includes(2);
const defaultEase = (t) => ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
const getD3Transition = (selection2, duration = 0, ease = defaultEase, onEnd = () => {
}) => {
  const hasDuration = typeof duration === "number" && duration > 0;
  if (!hasDuration) {
    onEnd();
  }
  return hasDuration ? selection2.transition().duration(duration).ease(ease).on("end", onEnd) : selection2;
};
const wheelDelta = (event) => {
  const factor = event.ctrlKey && isMacOs() ? 10 : 1;
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 2e-3) * factor;
};
function createPanOnScrollHandler({ zoomPanValues, noWheelClassName, d3Selection, d3Zoom, panOnScrollMode, panOnScrollSpeed, zoomOnPinch, onPanZoomStart, onPanZoom, onPanZoomEnd }) {
  return (event) => {
    if (isWrappedWithClass(event, noWheelClassName)) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
      return false;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    const currentZoom = d3Selection.property("__zoom").k || 1;
    if (event.ctrlKey && zoomOnPinch) {
      const point2 = pointer(event);
      const pinchDelta = wheelDelta(event);
      const zoom2 = currentZoom * Math.pow(2, pinchDelta);
      d3Zoom.scaleTo(d3Selection, zoom2, point2, event);
      return;
    }
    const deltaNormalize = event.deltaMode === 1 ? 20 : 1;
    let deltaX = panOnScrollMode === PanOnScrollMode.Vertical ? 0 : event.deltaX * deltaNormalize;
    let deltaY = panOnScrollMode === PanOnScrollMode.Horizontal ? 0 : event.deltaY * deltaNormalize;
    if (!isMacOs() && event.shiftKey && panOnScrollMode !== PanOnScrollMode.Vertical) {
      deltaX = event.deltaY * deltaNormalize;
      deltaY = 0;
    }
    d3Zoom.translateBy(
      d3Selection,
      -(deltaX / currentZoom) * panOnScrollSpeed,
      -(deltaY / currentZoom) * panOnScrollSpeed,
      // @ts-ignore
      { internal: true }
    );
    const nextViewport = transformToViewport(d3Selection.property("__zoom"));
    clearTimeout(zoomPanValues.panScrollTimeout);
    if (!zoomPanValues.isPanScrolling) {
      zoomPanValues.isPanScrolling = true;
      onPanZoomStart?.(event, nextViewport);
    } else {
      onPanZoom?.(event, nextViewport);
    }
    zoomPanValues.panScrollTimeout = setTimeout(() => {
      onPanZoomEnd?.(event, nextViewport);
      zoomPanValues.isPanScrolling = false;
    }, 150);
  };
}
function createZoomOnScrollHandler({ noWheelClassName, preventScrolling, d3ZoomHandler }) {
  return function(event, d) {
    const isWheel = event.type === "wheel";
    const preventZoom = !preventScrolling && isWheel && !event.ctrlKey;
    const hasNoWheelClass = isWrappedWithClass(event, noWheelClassName);
    if (event.ctrlKey && isWheel && hasNoWheelClass) {
      event.preventDefault();
    }
    if (preventZoom || hasNoWheelClass) {
      return null;
    }
    event.preventDefault();
    d3ZoomHandler.call(this, event, d);
  };
}
function createPanZoomStartHandler({ zoomPanValues, onDraggingChange, onPanZoomStart }) {
  return (event) => {
    if (event.sourceEvent?.internal) {
      return;
    }
    const viewport = transformToViewport(event.transform);
    zoomPanValues.mouseButton = event.sourceEvent?.button || 0;
    zoomPanValues.isZoomingOrPanning = true;
    zoomPanValues.prevViewport = viewport;
    if (event.sourceEvent?.type === "mousedown") {
      onDraggingChange(true);
    }
    if (onPanZoomStart) {
      onPanZoomStart?.(event.sourceEvent, viewport);
    }
  };
}
function createPanZoomHandler({ zoomPanValues, panOnDrag, onPaneContextMenu, onTransformChange, onPanZoom }) {
  return (event) => {
    zoomPanValues.usedRightMouseButton = !!(onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0));
    if (!event.sourceEvent?.sync) {
      onTransformChange([event.transform.x, event.transform.y, event.transform.k]);
    }
    if (onPanZoom && !event.sourceEvent?.internal) {
      onPanZoom?.(event.sourceEvent, transformToViewport(event.transform));
    }
  };
}
function createPanZoomEndHandler({ zoomPanValues, panOnDrag, panOnScroll, onDraggingChange, onPanZoomEnd, onPaneContextMenu }) {
  return (event) => {
    if (event.sourceEvent?.internal) {
      return;
    }
    zoomPanValues.isZoomingOrPanning = false;
    if (onPaneContextMenu && isRightClickPan(panOnDrag, zoomPanValues.mouseButton ?? 0) && !zoomPanValues.usedRightMouseButton && event.sourceEvent) {
      onPaneContextMenu(event.sourceEvent);
    }
    zoomPanValues.usedRightMouseButton = false;
    onDraggingChange(false);
    if (onPanZoomEnd) {
      const viewport = transformToViewport(event.transform);
      zoomPanValues.prevViewport = viewport;
      clearTimeout(zoomPanValues.timerId);
      zoomPanValues.timerId = setTimeout(
        () => {
          onPanZoomEnd?.(event.sourceEvent, viewport);
        },
        // we need a setTimeout for panOnScroll to suppress multiple end events fired during scroll
        panOnScroll ? 150 : 0
      );
    }
  };
}
function createFilter({ panActivationKeyPressed, zoomActivationKeyPressed, zoomOnScroll, zoomOnPinch, panOnDrag, panOnScroll, zoomOnDoubleClick, userSelectionActive, noWheelClassName, noPanClassName, lib, connectionInProgress }) {
  return (event) => {
    const zoomScroll = zoomActivationKeyPressed || zoomOnScroll;
    const pinchZoom = zoomOnPinch && event.ctrlKey;
    const isWheelEvent = event.type === "wheel";
    if (event.button === 1 && event.type === "mousedown" && (isWrappedWithClass(event, `${lib}-flow__node`) || isWrappedWithClass(event, `${lib}-flow__edge`) || isWrappedWithClass(event, `${lib}-flow__selection`) || isWrappedWithClass(event, `${lib}-flow__nodesselection`))) {
      return true;
    }
    if (!panOnDrag && !zoomScroll && !panOnScroll && !zoomOnDoubleClick && !zoomOnPinch) {
      return false;
    }
    if (userSelectionActive) {
      return false;
    }
    if (connectionInProgress && !isWheelEvent) {
      return false;
    }
    if (isWrappedWithClass(event, noWheelClassName) && isWheelEvent) {
      return false;
    }
    if (isWrappedWithClass(event, noPanClassName) && (!isWheelEvent || panOnScroll && isWheelEvent && !zoomActivationKeyPressed)) {
      return false;
    }
    if (!zoomOnPinch && event.ctrlKey && isWheelEvent) {
      return false;
    }
    if (!zoomOnPinch && event.type === "touchstart" && event.touches?.length > 1) {
      event.preventDefault();
      return false;
    }
    if (!zoomScroll && !panOnScroll && !pinchZoom && isWheelEvent) {
      return false;
    }
    if (!panOnDrag && (event.type === "mousedown" || event.type === "touchstart")) {
      return false;
    }
    if (Array.isArray(panOnDrag) && !panOnDrag.includes(event.button) && event.type === "mousedown") {
      return false;
    }
    const buttonAllowed = Array.isArray(panOnDrag) && panOnDrag.includes(event.button) || !event.button || event.button <= 1;
    return (!event.ctrlKey || isWheelEvent || panActivationKeyPressed) && buttonAllowed;
  };
}
function XYPanZoom({ domNode, minZoom, maxZoom, translateExtent, viewport, onPanZoom, onPanZoomStart, onPanZoomEnd, onDraggingChange }) {
  const zoomPanValues = {
    isZoomingOrPanning: false,
    usedRightMouseButton: false,
    prevViewport: {},
    mouseButton: 0,
    timerId: void 0,
    panScrollTimeout: void 0,
    isPanScrolling: false
  };
  const bbox = domNode.getBoundingClientRect();
  let cachedExtent = [
    [0, 0],
    [bbox.width, bbox.height]
  ];
  const extentResizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
      cachedExtent = [
        [0, 0],
        [entry.contentRect.width, entry.contentRect.height]
      ];
    }
  }) : null;
  extentResizeObserver?.observe(domNode);
  const d3ZoomInstance = zoom().extent(() => cachedExtent).scaleExtent([minZoom, maxZoom]).translateExtent(translateExtent);
  const d3Selection = select(domNode).call(d3ZoomInstance);
  setViewportConstrained({
    x: viewport.x,
    y: viewport.y,
    zoom: clamp(viewport.zoom, minZoom, maxZoom)
  }, [
    [0, 0],
    [bbox.width, bbox.height]
  ], translateExtent);
  const d3ZoomHandler = d3Selection.on("wheel.zoom");
  const d3DblClickZoomHandler = d3Selection.on("dblclick.zoom");
  d3ZoomInstance.wheelDelta(wheelDelta);
  async function setTransform(transform2, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? interpolate$1 : interpolateZoom).transform(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), transform2);
      });
    }
    return false;
  }
  function update({ noWheelClassName, noPanClassName, onPaneContextMenu, userSelectionActive, panOnScroll, panOnDrag, panOnScrollMode, panOnScrollSpeed, preventScrolling, zoomOnPinch, zoomOnScroll, zoomOnDoubleClick, panActivationKeyPressed = false, zoomActivationKeyPressed, lib, onTransformChange, connectionInProgress, paneClickDistance, selectionOnDrag }) {
    if (userSelectionActive && !zoomPanValues.isZoomingOrPanning) {
      destroy();
    }
    const isPanOnScroll = panOnScroll && !zoomActivationKeyPressed && !userSelectionActive;
    d3ZoomInstance.clickDistance(selectionOnDrag ? Infinity : !isNumeric(paneClickDistance) || paneClickDistance < 0 ? 0 : paneClickDistance);
    const wheelHandler = isPanOnScroll ? createPanOnScrollHandler({
      zoomPanValues,
      noWheelClassName,
      d3Selection,
      d3Zoom: d3ZoomInstance,
      panOnScrollMode,
      panOnScrollSpeed,
      zoomOnPinch,
      onPanZoomStart,
      onPanZoom,
      onPanZoomEnd
    }) : createZoomOnScrollHandler({
      noWheelClassName,
      preventScrolling,
      d3ZoomHandler
    });
    d3Selection.on("wheel.zoom", wheelHandler, { passive: false });
    const startHandler = createPanZoomStartHandler({
      zoomPanValues,
      onDraggingChange,
      onPanZoomStart
    });
    d3ZoomInstance.on("start", startHandler);
    const panZoomHandler = createPanZoomHandler({
      zoomPanValues,
      panOnDrag,
      onPaneContextMenu: !!onPaneContextMenu,
      onPanZoom,
      onTransformChange
    });
    d3ZoomInstance.on("zoom", panZoomHandler);
    const panZoomEndHandler = createPanZoomEndHandler({
      zoomPanValues,
      panOnDrag,
      panOnScroll,
      onPaneContextMenu,
      onPanZoomEnd,
      onDraggingChange
    });
    d3ZoomInstance.on("end", panZoomEndHandler);
    const filter2 = createFilter({
      panActivationKeyPressed,
      zoomActivationKeyPressed,
      panOnDrag,
      zoomOnScroll,
      panOnScroll,
      zoomOnDoubleClick,
      zoomOnPinch,
      userSelectionActive,
      noPanClassName,
      noWheelClassName,
      lib,
      connectionInProgress
    });
    d3ZoomInstance.filter(filter2);
    if (zoomOnDoubleClick) {
      d3Selection.on("dblclick.zoom", d3DblClickZoomHandler);
    } else {
      d3Selection.on("dblclick.zoom", null);
    }
  }
  function destroy() {
    d3ZoomInstance.on("zoom", null);
  }
  async function setViewportConstrained(viewport2, extent, translateExtent2) {
    const nextTransform = viewportToTransform(viewport2);
    const contrainedTransform = d3ZoomInstance?.constrain()(nextTransform, extent, translateExtent2);
    if (contrainedTransform) {
      await setTransform(contrainedTransform);
    }
    return contrainedTransform;
  }
  async function setViewport(viewport2, options) {
    const nextTransform = viewportToTransform(viewport2);
    await setTransform(nextTransform, options);
    return nextTransform;
  }
  function syncViewport(viewport2) {
    if (d3Selection) {
      const nextTransform = viewportToTransform(viewport2);
      const currentTransform = d3Selection.property("__zoom");
      if (currentTransform.k !== viewport2.zoom || currentTransform.x !== viewport2.x || currentTransform.y !== viewport2.y) {
        d3ZoomInstance?.transform(d3Selection, nextTransform, null, { sync: true });
      }
    }
  }
  function getViewport() {
    const transform$1 = d3Selection ? transform(d3Selection.node()) : { x: 0, y: 0, k: 1 };
    return { x: transform$1.x, y: transform$1.y, zoom: transform$1.k };
  }
  async function scaleTo(zoom2, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? interpolate$1 : interpolateZoom).scaleTo(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), zoom2);
      });
    }
    return false;
  }
  async function scaleBy(factor, options) {
    if (d3Selection) {
      return new Promise((resolve) => {
        d3ZoomInstance?.interpolate(options?.interpolate === "linear" ? interpolate$1 : interpolateZoom).scaleBy(getD3Transition(d3Selection, options?.duration, options?.ease, () => resolve(true)), factor);
      });
    }
    return false;
  }
  function setScaleExtent(scaleExtent) {
    d3ZoomInstance?.scaleExtent(scaleExtent);
  }
  function setTranslateExtent(translateExtent2) {
    d3ZoomInstance?.translateExtent(translateExtent2);
  }
  function setClickDistance(distance2) {
    const validDistance = !isNumeric(distance2) || distance2 < 0 ? 0 : distance2;
    d3ZoomInstance?.clickDistance(validDistance);
  }
  return {
    update,
    destroy,
    setViewport,
    setViewportConstrained,
    getViewport,
    scaleTo,
    scaleBy,
    setScaleExtent,
    setTranslateExtent,
    syncViewport,
    setClickDistance
  };
}
var ResizeControlVariant;
(function(ResizeControlVariant2) {
  ResizeControlVariant2["Line"] = "line";
  ResizeControlVariant2["Handle"] = "handle";
})(ResizeControlVariant || (ResizeControlVariant = {}));
function getResizeDirection({ width, prevWidth, height, prevHeight, affectsX, affectsY }) {
  const deltaWidth = width - prevWidth;
  const deltaHeight = height - prevHeight;
  const direction = [deltaWidth > 0 ? 1 : deltaWidth < 0 ? -1 : 0, deltaHeight > 0 ? 1 : deltaHeight < 0 ? -1 : 0];
  if (deltaWidth && affectsX) {
    direction[0] = direction[0] * -1;
  }
  if (deltaHeight && affectsY) {
    direction[1] = direction[1] * -1;
  }
  return direction;
}
function getControlDirection(controlPosition) {
  const isHorizontal = controlPosition.includes("right") || controlPosition.includes("left");
  const isVertical = controlPosition.includes("bottom") || controlPosition.includes("top");
  const affectsX = controlPosition.includes("left");
  const affectsY = controlPosition.includes("top");
  return {
    isHorizontal,
    isVertical,
    affectsX,
    affectsY
  };
}
function getLowerExtentClamp(lowerExtent, lowerBound) {
  return Math.max(0, lowerBound - lowerExtent);
}
function getUpperExtentClamp(upperExtent, upperBound) {
  return Math.max(0, upperExtent - upperBound);
}
function getSizeClamp(size, minSize, maxSize) {
  return Math.max(0, minSize - size, size - maxSize);
}
function xor(a, b) {
  return a ? !b : b;
}
function getDimensionsAfterResize(startValues, controlDirection, pointerPosition, boundaries, keepAspectRatio, nodeOrigin, extent, childExtent) {
  let { affectsX, affectsY } = controlDirection;
  const { isHorizontal, isVertical } = controlDirection;
  const isDiagonal = isHorizontal && isVertical;
  const { xSnapped, ySnapped } = pointerPosition;
  const { minWidth, maxWidth, minHeight, maxHeight } = boundaries;
  const { x: startX, y: startY, width: startWidth, height: startHeight, aspectRatio } = startValues;
  let distX = Math.floor(isHorizontal ? xSnapped - startValues.pointerX : 0);
  let distY = Math.floor(isVertical ? ySnapped - startValues.pointerY : 0);
  const newWidth = startWidth + (affectsX ? -distX : distX);
  const newHeight = startHeight + (affectsY ? -distY : distY);
  const originOffsetX = -nodeOrigin[0] * startWidth;
  const originOffsetY = -nodeOrigin[1] * startHeight;
  let clampX = getSizeClamp(newWidth, minWidth, maxWidth);
  let clampY = getSizeClamp(newHeight, minHeight, maxHeight);
  if (extent) {
    let xExtentClamp = 0;
    let yExtentClamp = 0;
    if (affectsX && distX < 0) {
      xExtentClamp = getLowerExtentClamp(startX + distX + originOffsetX, extent[0][0]);
    } else if (!affectsX && distX > 0) {
      xExtentClamp = getUpperExtentClamp(startX + newWidth + originOffsetX, extent[1][0]);
    }
    if (affectsY && distY < 0) {
      yExtentClamp = getLowerExtentClamp(startY + distY + originOffsetY, extent[0][1]);
    } else if (!affectsY && distY > 0) {
      yExtentClamp = getUpperExtentClamp(startY + newHeight + originOffsetY, extent[1][1]);
    }
    clampX = Math.max(clampX, xExtentClamp);
    clampY = Math.max(clampY, yExtentClamp);
  }
  if (childExtent) {
    let xExtentClamp = 0;
    let yExtentClamp = 0;
    if (affectsX && distX > 0) {
      xExtentClamp = getUpperExtentClamp(startX + distX, childExtent[0][0]);
    } else if (!affectsX && distX < 0) {
      xExtentClamp = getLowerExtentClamp(startX + newWidth, childExtent[1][0]);
    }
    if (affectsY && distY > 0) {
      yExtentClamp = getUpperExtentClamp(startY + distY, childExtent[0][1]);
    } else if (!affectsY && distY < 0) {
      yExtentClamp = getLowerExtentClamp(startY + newHeight, childExtent[1][1]);
    }
    clampX = Math.max(clampX, xExtentClamp);
    clampY = Math.max(clampY, yExtentClamp);
  }
  if (keepAspectRatio) {
    if (isHorizontal) {
      const aspectHeightClamp = getSizeClamp(newWidth / aspectRatio, minHeight, maxHeight) * aspectRatio;
      clampX = Math.max(clampX, aspectHeightClamp);
      if (extent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) {
          aspectExtentClamp = getUpperExtentClamp(startY + originOffsetY + newWidth / aspectRatio, extent[1][1]) * aspectRatio;
        } else {
          aspectExtentClamp = getLowerExtentClamp(startY + originOffsetY + (affectsX ? distX : -distX) / aspectRatio, extent[0][1]) * aspectRatio;
        }
        clampX = Math.max(clampX, aspectExtentClamp);
      }
      if (childExtent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsX && !affectsY && isDiagonal) {
          aspectExtentClamp = getLowerExtentClamp(startY + newWidth / aspectRatio, childExtent[1][1]) * aspectRatio;
        } else {
          aspectExtentClamp = getUpperExtentClamp(startY + (affectsX ? distX : -distX) / aspectRatio, childExtent[0][1]) * aspectRatio;
        }
        clampX = Math.max(clampX, aspectExtentClamp);
      }
    }
    if (isVertical) {
      const aspectWidthClamp = getSizeClamp(newHeight * aspectRatio, minWidth, maxWidth) / aspectRatio;
      clampY = Math.max(clampY, aspectWidthClamp);
      if (extent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) {
          aspectExtentClamp = getUpperExtentClamp(startX + newHeight * aspectRatio + originOffsetX, extent[1][0]) / aspectRatio;
        } else {
          aspectExtentClamp = getLowerExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio + originOffsetX, extent[0][0]) / aspectRatio;
        }
        clampY = Math.max(clampY, aspectExtentClamp);
      }
      if (childExtent) {
        let aspectExtentClamp = 0;
        if (!affectsX && !affectsY || affectsY && !affectsX && isDiagonal) {
          aspectExtentClamp = getLowerExtentClamp(startX + newHeight * aspectRatio, childExtent[1][0]) / aspectRatio;
        } else {
          aspectExtentClamp = getUpperExtentClamp(startX + (affectsY ? distY : -distY) * aspectRatio, childExtent[0][0]) / aspectRatio;
        }
        clampY = Math.max(clampY, aspectExtentClamp);
      }
    }
  }
  distY = distY + (distY < 0 ? clampY : -clampY);
  distX = distX + (distX < 0 ? clampX : -clampX);
  if (keepAspectRatio) {
    if (isDiagonal) {
      if (newWidth > newHeight * aspectRatio) {
        distY = (xor(affectsX, affectsY) ? -distX : distX) / aspectRatio;
      } else {
        distX = (xor(affectsX, affectsY) ? -distY : distY) * aspectRatio;
      }
    } else {
      if (isHorizontal) {
        distY = distX / aspectRatio;
        affectsY = affectsX;
      } else {
        distX = distY * aspectRatio;
        affectsX = affectsY;
      }
    }
  }
  const x = affectsX ? startX + distX : startX;
  const y = affectsY ? startY + distY : startY;
  return {
    width: startWidth + (affectsX ? -distX : distX),
    height: startHeight + (affectsY ? -distY : distY),
    x: nodeOrigin[0] * distX * (!affectsX ? 1 : -1) + x,
    y: nodeOrigin[1] * distY * (!affectsY ? 1 : -1) + y
  };
}
const initPrevValues$1 = { width: 0, height: 0, x: 0, y: 0 };
const initStartValues = {
  ...initPrevValues$1,
  pointerX: 0,
  pointerY: 0,
  aspectRatio: 1
};
function nodeToChildExtent(child, parent, nodeOrigin) {
  const x = parent.position.x + child.position.x;
  const y = parent.position.y + child.position.y;
  const width = child.measured.width ?? 0;
  const height = child.measured.height ?? 0;
  const originOffsetX = nodeOrigin[0] * width;
  const originOffsetY = nodeOrigin[1] * height;
  return [
    [x - originOffsetX, y - originOffsetY],
    [x + width - originOffsetX, y + height - originOffsetY]
  ];
}
function XYResizer({ domNode, nodeId, getStoreItems, onChange, onEnd }) {
  const selection2 = select(domNode);
  let params = {
    controlDirection: getControlDirection("bottom-right"),
    boundaries: {
      minWidth: 0,
      minHeight: 0,
      maxWidth: Number.MAX_VALUE,
      maxHeight: Number.MAX_VALUE
    },
    resizeDirection: void 0,
    keepAspectRatio: false
  };
  function update({ controlPosition, boundaries, keepAspectRatio, resizeDirection, onResizeStart, onResize, onResizeEnd, shouldResize }) {
    let prevValues = { ...initPrevValues$1 };
    let startValues = { ...initStartValues };
    params = {
      boundaries,
      resizeDirection,
      keepAspectRatio,
      controlDirection: getControlDirection(controlPosition)
    };
    let node2 = void 0;
    let containerBounds = null;
    let childNodes = [];
    let parentNode = void 0;
    let nodeExtent = void 0;
    let childExtent = void 0;
    let resizeDetected = false;
    const dragHandler = drag().on("start", (event) => {
      const { nodeLookup, transform: transform2, snapGrid, snapToGrid, nodeOrigin, paneDomNode } = getStoreItems();
      node2 = nodeLookup.get(nodeId);
      if (!node2) {
        return;
      }
      containerBounds = paneDomNode?.getBoundingClientRect() ?? null;
      const { xSnapped, ySnapped } = getPointerPosition(event.sourceEvent, {
        transform: transform2,
        snapGrid,
        snapToGrid,
        containerBounds
      });
      prevValues = {
        width: node2.measured.width ?? 0,
        height: node2.measured.height ?? 0,
        x: node2.position.x ?? 0,
        y: node2.position.y ?? 0
      };
      startValues = {
        ...prevValues,
        pointerX: xSnapped,
        pointerY: ySnapped,
        aspectRatio: prevValues.width / prevValues.height
      };
      parentNode = void 0;
      nodeExtent = isCoordinateExtent(node2.extent) ? node2.extent : void 0;
      if (node2.parentId && (node2.extent === "parent" || node2.expandParent)) {
        parentNode = nodeLookup.get(node2.parentId);
      }
      if (parentNode && node2.extent === "parent") {
        nodeExtent = [
          [0, 0],
          [parentNode.measured.width, parentNode.measured.height]
        ];
      }
      childNodes = [];
      childExtent = void 0;
      for (const [childId, child] of nodeLookup) {
        if (child.parentId === nodeId) {
          childNodes.push({
            id: childId,
            position: { ...child.position },
            extent: child.extent
          });
          if (child.extent === "parent" || child.expandParent) {
            const extent = nodeToChildExtent(child, node2, child.origin ?? nodeOrigin);
            if (childExtent) {
              childExtent = [
                [Math.min(extent[0][0], childExtent[0][0]), Math.min(extent[0][1], childExtent[0][1])],
                [Math.max(extent[1][0], childExtent[1][0]), Math.max(extent[1][1], childExtent[1][1])]
              ];
            } else {
              childExtent = extent;
            }
          }
        }
      }
      onResizeStart?.(event, { ...prevValues });
    }).on("drag", (event) => {
      const { transform: transform2, snapGrid, snapToGrid, nodeOrigin: storeNodeOrigin } = getStoreItems();
      const pointerPosition = getPointerPosition(event.sourceEvent, {
        transform: transform2,
        snapGrid,
        snapToGrid,
        containerBounds
      });
      const childChanges = [];
      if (!node2) {
        return;
      }
      const { x: prevX, y: prevY, width: prevWidth, height: prevHeight } = prevValues;
      const change = {};
      const nodeOrigin = node2.origin ?? storeNodeOrigin;
      const { width, height, x, y } = getDimensionsAfterResize(startValues, params.controlDirection, pointerPosition, params.boundaries, params.keepAspectRatio, nodeOrigin, nodeExtent, childExtent);
      const isWidthChange = width !== prevWidth;
      const isHeightChange = height !== prevHeight;
      const isXPosChange = x !== prevX && isWidthChange;
      const isYPosChange = y !== prevY && isHeightChange;
      if (!isXPosChange && !isYPosChange && !isWidthChange && !isHeightChange) {
        return;
      }
      if (isXPosChange || isYPosChange || nodeOrigin[0] === 1 || nodeOrigin[1] === 1) {
        change.x = isXPosChange ? x : prevValues.x;
        change.y = isYPosChange ? y : prevValues.y;
        prevValues.x = change.x;
        prevValues.y = change.y;
        if (childNodes.length > 0) {
          const xChange = x - prevX;
          const yChange = y - prevY;
          for (const childNode of childNodes) {
            childNode.position = {
              x: childNode.position.x - xChange + nodeOrigin[0] * (width - prevWidth),
              y: childNode.position.y - yChange + nodeOrigin[1] * (height - prevHeight)
            };
            childChanges.push(childNode);
          }
        }
      }
      if (isWidthChange || isHeightChange) {
        change.width = isWidthChange && (!params.resizeDirection || params.resizeDirection === "horizontal") ? width : prevValues.width;
        change.height = isHeightChange && (!params.resizeDirection || params.resizeDirection === "vertical") ? height : prevValues.height;
        prevValues.width = change.width;
        prevValues.height = change.height;
      }
      if (parentNode && node2.expandParent) {
        const xLimit = nodeOrigin[0] * (change.width ?? 0);
        if (change.x && change.x < xLimit) {
          prevValues.x = xLimit;
          startValues.x = startValues.x - (change.x - xLimit);
        }
        const yLimit = nodeOrigin[1] * (change.height ?? 0);
        if (change.y && change.y < yLimit) {
          prevValues.y = yLimit;
          startValues.y = startValues.y - (change.y - yLimit);
        }
      }
      const direction = getResizeDirection({
        width: prevValues.width,
        prevWidth,
        height: prevValues.height,
        prevHeight,
        affectsX: params.controlDirection.affectsX,
        affectsY: params.controlDirection.affectsY
      });
      const nextValues = { ...prevValues, direction };
      const callResize = shouldResize?.(event, nextValues);
      if (callResize === false) {
        return;
      }
      resizeDetected = true;
      onResize?.(event, nextValues);
      onChange(change, childChanges);
    }).on("end", (event) => {
      if (!resizeDetected) {
        return;
      }
      onResizeEnd?.(event, { ...prevValues });
      onEnd?.({ ...prevValues });
      resizeDetected = false;
    });
    selection2.call(dragHandler);
  }
  function destroy() {
    selection2.on(".drag", null);
  }
  return {
    update,
    destroy
  };
}
var withSelector = { exports: {} };
var withSelector_production = {};
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = reactExports, shim = shimExports;
function is(x, y) {
  return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
}
var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue$1 = React.useDebugValue;
withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector2, isEqual) {
  var instRef = useRef(null);
  if (null === instRef.current) {
    var inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else inst = instRef.current;
  instRef = useMemo(
    function() {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector2(nextSnapshot);
          if (void 0 !== isEqual && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return memoizedSelection = currentSelection;
          }
          return memoizedSelection = nextSnapshot;
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
        var nextSelection = selector2(nextSnapshot);
        if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
          return memoizedSnapshot = nextSnapshot, currentSelection;
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection = nextSelection;
      }
      var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
      return [
        function() {
          return memoizedSelector(getSnapshot());
        },
        null === maybeGetServerSnapshot ? void 0 : function() {
          return memoizedSelector(maybeGetServerSnapshot());
        }
      ];
    },
    [getSnapshot, getServerSnapshot, selector2, isEqual]
  );
  var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
  useEffect(
    function() {
      inst.hasValue = true;
      inst.value = value;
    },
    [value]
  );
  useDebugValue$1(value);
  return value;
};
{
  withSelector.exports = withSelector_production;
}
var withSelectorExports = withSelector.exports;
const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
const __vite_import_meta_env__ = {};
const createStoreImpl = (createState2) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace2) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace2 != null ? replace2 : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState2 = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState: getInitialState2, subscribe, destroy };
  const initialState = state = createState2(setState, getState, api);
  return api;
};
const createStore$1 = (createState2) => createState2 ? createStoreImpl(createState2) : createStoreImpl;
const { useDebugValue } = React$1;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
const identity = (arg) => arg;
function useStoreWithEqualityFn(api, selector2 = identity, equalityFn) {
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector2,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createWithEqualityFnImpl = (createState2, defaultEqualityFn) => {
  const api = createStore$1(createState2);
  const useBoundStoreWithEqualityFn = (selector2, equalityFn = defaultEqualityFn) => useStoreWithEqualityFn(api, selector2, equalityFn);
  Object.assign(useBoundStoreWithEqualityFn, api);
  return useBoundStoreWithEqualityFn;
};
const createWithEqualityFn = (createState2, defaultEqualityFn) => createState2 ? createWithEqualityFnImpl(createState2, defaultEqualityFn) : createWithEqualityFnImpl;
function shallow$1(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    for (const [key, value] of objA) {
      if (!Object.is(value, objB.get(key))) {
        return false;
      }
    }
    return true;
  }
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    for (const value of objA) {
      if (!objB.has(value)) {
        return false;
      }
    }
    return true;
  }
  const keysA = Object.keys(objA);
  if (keysA.length !== Object.keys(objB).length) {
    return false;
  }
  for (const keyA of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, keyA) || !Object.is(objA[keyA], objB[keyA])) {
      return false;
    }
  }
  return true;
}
const StoreContext = reactExports.createContext(null);
const Provider$1 = StoreContext.Provider;
const zustandErrorMessage = errorMessages["error001"]("react");
function useStore(selector2, equalityFn) {
  const store = reactExports.useContext(StoreContext);
  if (store === null) {
    throw new Error(zustandErrorMessage);
  }
  return useStoreWithEqualityFn(store, selector2, equalityFn);
}
function useStoreApi() {
  const store = reactExports.useContext(StoreContext);
  if (store === null) {
    throw new Error(zustandErrorMessage);
  }
  return reactExports.useMemo(() => ({
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe
  }), [store]);
}
const style = { display: "none" };
const ariaLiveStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  border: 0,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0px, 0px, 0px, 0px)",
  clipPath: "inset(100%)"
};
const ARIA_NODE_DESC_KEY = "react-flow__node-desc";
const ARIA_EDGE_DESC_KEY = "react-flow__edge-desc";
const ARIA_LIVE_MESSAGE = "react-flow__aria-live";
const ariaLiveSelector = (s) => s.ariaLiveMessage;
const ariaLabelConfigSelector = (s) => s.ariaLabelConfig;
function AriaLiveMessage({ rfId }) {
  const ariaLiveMessage = useStore(ariaLiveSelector);
  return jsxRuntimeExports.jsx("div", { id: `${ARIA_LIVE_MESSAGE}-${rfId}`, "aria-live": "assertive", "aria-atomic": "true", style: ariaLiveStyle, children: ariaLiveMessage });
}
function A11yDescriptions({ rfId, disableKeyboardA11y }) {
  const ariaLabelConfig = useStore(ariaLabelConfigSelector);
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("div", { id: `${ARIA_NODE_DESC_KEY}-${rfId}`, style, children: disableKeyboardA11y ? ariaLabelConfig["node.a11yDescription.default"] : ariaLabelConfig["node.a11yDescription.keyboardDisabled"] }), jsxRuntimeExports.jsx("div", { id: `${ARIA_EDGE_DESC_KEY}-${rfId}`, style, children: ariaLabelConfig["edge.a11yDescription.default"] }), !disableKeyboardA11y && jsxRuntimeExports.jsx(AriaLiveMessage, { rfId })] });
}
const Panel = reactExports.forwardRef(({ position: position2 = "top-left", children: children2, className, style: style2, ...rest }, ref) => {
  const positionClasses = `${position2}`.split("-");
  return jsxRuntimeExports.jsx("div", { className: cc(["react-flow__panel", className, ...positionClasses]), style: style2, ref, ...rest, children: children2 });
});
Panel.displayName = "Panel";
const link$2 = `https://reactflow.dev${"?utm_source=attribution"}`;
function Attribution({ proOptions, position: position2 = "bottom-right" }) {
  if (proOptions?.hideAttribution) {
    return null;
  }
  return jsxRuntimeExports.jsx(Panel, { position: position2, className: "react-flow__attribution", "data-message": `Please only hide this attribution when you are subscribed to React Flow Pro: ${link$2}`, children: jsxRuntimeExports.jsx("a", { href: link$2, target: "_blank", rel: "noopener noreferrer", "aria-label": "React Flow attribution", children: "React Flow" }) });
}
const selector$l = (s) => {
  const selectedNodes = [];
  const selectedEdges = [];
  for (const [, node2] of s.nodeLookup) {
    if (node2.selected) {
      selectedNodes.push(node2.internals.userNode);
    }
  }
  for (const [, edge] of s.edgeLookup) {
    if (edge.selected) {
      selectedEdges.push(edge);
    }
  }
  return { selectedNodes, selectedEdges };
};
const selectId = (obj) => obj.id;
function areEqual$1(a, b) {
  return shallow$1(a.selectedNodes.map(selectId), b.selectedNodes.map(selectId)) && shallow$1(a.selectedEdges.map(selectId), b.selectedEdges.map(selectId));
}
function SelectionListenerInner({ onSelectionChange }) {
  const store = useStoreApi();
  const { selectedNodes, selectedEdges } = useStore(selector$l, areEqual$1);
  reactExports.useEffect(() => {
    const params = { nodes: selectedNodes, edges: selectedEdges };
    onSelectionChange?.(params);
    store.getState().onSelectionChangeHandlers.forEach((fn) => fn(params));
  }, [selectedNodes, selectedEdges, onSelectionChange]);
  return null;
}
const changeSelector = (s) => !!s.onSelectionChangeHandlers;
function SelectionListener({ onSelectionChange }) {
  const storeHasSelectionChangeHandlers = useStore(changeSelector);
  if (onSelectionChange || storeHasSelectionChangeHandlers) {
    return jsxRuntimeExports.jsx(SelectionListenerInner, { onSelectionChange });
  }
  return null;
}
const defaultNodeOrigin = [0, 0];
const defaultViewport = { x: 0, y: 0, zoom: 1 };
const reactFlowFieldsToTrack = [
  "nodes",
  "edges",
  "defaultNodes",
  "defaultEdges",
  "onConnect",
  "onConnectStart",
  "onConnectEnd",
  "onClickConnectStart",
  "onClickConnectEnd",
  "nodesDraggable",
  "autoPanOnNodeFocus",
  "nodesConnectable",
  "nodesFocusable",
  "edgesFocusable",
  "edgesReconnectable",
  "elevateNodesOnSelect",
  "elevateEdgesOnSelect",
  "minZoom",
  "maxZoom",
  "nodeExtent",
  "onNodesChange",
  "onEdgesChange",
  "elementsSelectable",
  "connectionMode",
  "snapGrid",
  "snapToGrid",
  "translateExtent",
  "connectOnClick",
  "defaultEdgeOptions",
  "fitView",
  "fitViewOptions",
  "onNodesDelete",
  "onEdgesDelete",
  "onDelete",
  "onNodeDrag",
  "onNodeDragStart",
  "onNodeDragStop",
  "onSelectionDrag",
  "onSelectionDragStart",
  "onSelectionDragStop",
  "onMoveStart",
  "onMove",
  "onMoveEnd",
  "noPanClassName",
  "nodeOrigin",
  "autoPanOnConnect",
  "autoPanOnNodeDrag",
  "onError",
  "connectionRadius",
  "isValidConnection",
  "selectNodesOnDrag",
  "nodeDragThreshold",
  "connectionDragThreshold",
  "onBeforeDelete",
  "debug",
  "autoPanSpeed",
  "ariaLabelConfig",
  "zIndexMode"
];
const fieldsToTrack = [...reactFlowFieldsToTrack, "rfId"];
const selector$k = (s) => ({
  setNodes: s.setNodes,
  setEdges: s.setEdges,
  setMinZoom: s.setMinZoom,
  setMaxZoom: s.setMaxZoom,
  setTranslateExtent: s.setTranslateExtent,
  setNodeExtent: s.setNodeExtent,
  reset: s.reset,
  setDefaultNodesAndEdges: s.setDefaultNodesAndEdges
});
const initPrevValues = {
  /*
   * these are values that are also passed directly to other components
   * than the StoreUpdater. We can reduce the number of setStore calls
   * by setting the same values here as prev fields.
   */
  translateExtent: infiniteExtent,
  nodeOrigin: defaultNodeOrigin,
  minZoom: 0.5,
  maxZoom: 2,
  elementsSelectable: true,
  noPanClassName: "nopan",
  rfId: "1"
};
function StoreUpdater(props) {
  const { setNodes, setEdges, setMinZoom, setMaxZoom, setTranslateExtent, setNodeExtent, reset, setDefaultNodesAndEdges } = useStore(selector$k, shallow$1);
  const store = useStoreApi();
  reactExports.useEffect(() => {
    setDefaultNodesAndEdges(props.defaultNodes, props.defaultEdges);
    return () => {
      previousFields.current = initPrevValues;
      reset();
    };
  }, []);
  const previousFields = reactExports.useRef(initPrevValues);
  reactExports.useEffect(
    () => {
      for (const fieldName of fieldsToTrack) {
        const fieldValue = props[fieldName];
        const previousFieldValue = previousFields.current[fieldName];
        if (fieldValue === previousFieldValue)
          continue;
        if (typeof props[fieldName] === "undefined")
          continue;
        if (fieldName === "nodes")
          setNodes(fieldValue);
        else if (fieldName === "edges")
          setEdges(fieldValue);
        else if (fieldName === "minZoom")
          setMinZoom(fieldValue);
        else if (fieldName === "maxZoom")
          setMaxZoom(fieldValue);
        else if (fieldName === "translateExtent")
          setTranslateExtent(fieldValue);
        else if (fieldName === "nodeExtent")
          setNodeExtent(fieldValue);
        else if (fieldName === "ariaLabelConfig")
          store.setState({ ariaLabelConfig: mergeAriaLabelConfig(fieldValue) });
        else if (fieldName === "fitView")
          store.setState({ fitViewQueued: fieldValue });
        else if (fieldName === "fitViewOptions")
          store.setState({ fitViewOptions: fieldValue });
        else
          store.setState({ [fieldName]: fieldValue });
      }
      previousFields.current = props;
    },
    // Only re-run the effect if one of the fields we track changes
    fieldsToTrack.map((fieldName) => props[fieldName])
  );
  return null;
}
function getMediaQuery() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
}
function useColorModeClass(colorMode) {
  const [colorModeClass, setColorModeClass] = reactExports.useState(colorMode === "system" ? null : colorMode);
  reactExports.useEffect(() => {
    if (colorMode !== "system") {
      setColorModeClass(colorMode);
      return;
    }
    const mediaQuery = getMediaQuery();
    const updateColorModeClass = () => setColorModeClass(mediaQuery?.matches ? "dark" : "light");
    updateColorModeClass();
    mediaQuery?.addEventListener("change", updateColorModeClass);
    return () => {
      mediaQuery?.removeEventListener("change", updateColorModeClass);
    };
  }, [colorMode]);
  return colorModeClass !== null ? colorModeClass : getMediaQuery()?.matches ? "dark" : "light";
}
const defaultDoc = typeof document !== "undefined" ? document : null;
function useKeyPress(keyCode = null, options = { target: defaultDoc, actInsideInputWithModifier: true }) {
  const [keyPressed, setKeyPressed] = reactExports.useState(false);
  const modifierPressed = reactExports.useRef(false);
  const pressedKeys = reactExports.useRef(/* @__PURE__ */ new Set([]));
  const [keyCodes, keysToWatch] = reactExports.useMemo(() => {
    if (keyCode !== null) {
      const keyCodeArr = Array.isArray(keyCode) ? keyCode : [keyCode];
      const keys2 = keyCodeArr.filter((kc) => typeof kc === "string").map((kc) => kc.replace(/\+/g, "\n").replace("\n\n", "\n+").split("\n"));
      const keysFlat = keys2.reduce((res, item) => res.concat(...item), []);
      return [keys2, keysFlat];
    }
    return [[], []];
  }, [keyCode]);
  reactExports.useEffect(() => {
    const target = options?.target ?? defaultDoc;
    const actInsideInputWithModifier = options?.actInsideInputWithModifier ?? true;
    if (keyCode !== null) {
      const downHandler = (event) => {
        modifierPressed.current = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
        const preventAction = (!modifierPressed.current || modifierPressed.current && !actInsideInputWithModifier) && isInputDOMNode(event);
        if (preventAction) {
          return false;
        }
        const keyOrCode = useKeyOrCode(event.code, keysToWatch);
        pressedKeys.current.add(event[keyOrCode]);
        if (isMatchingKey(keyCodes, pressedKeys.current, false)) {
          const target2 = event.composedPath?.()?.[0] || event.target;
          const isInteractiveElement = target2?.nodeName === "BUTTON" || target2?.nodeName === "A";
          if (options.preventDefault !== false && (modifierPressed.current || !isInteractiveElement)) {
            event.preventDefault();
          }
          setKeyPressed(true);
        }
      };
      const upHandler = (event) => {
        const keyOrCode = useKeyOrCode(event.code, keysToWatch);
        if (isMatchingKey(keyCodes, pressedKeys.current, true)) {
          setKeyPressed(false);
          pressedKeys.current.clear();
        } else {
          pressedKeys.current.delete(event[keyOrCode]);
        }
        if (event.key === "Meta") {
          pressedKeys.current.clear();
        }
        modifierPressed.current = false;
      };
      const resetHandler = () => {
        pressedKeys.current.clear();
        setKeyPressed(false);
      };
      target?.addEventListener("keydown", downHandler);
      target?.addEventListener("keyup", upHandler);
      window.addEventListener("blur", resetHandler);
      window.addEventListener("contextmenu", resetHandler);
      return () => {
        target?.removeEventListener("keydown", downHandler);
        target?.removeEventListener("keyup", upHandler);
        window.removeEventListener("blur", resetHandler);
        window.removeEventListener("contextmenu", resetHandler);
      };
    }
  }, [keyCode, setKeyPressed]);
  return keyPressed;
}
function isMatchingKey(keyCodes, pressedKeys, isUp) {
  return keyCodes.filter((keys2) => isUp || keys2.length === pressedKeys.size).some((keys2) => keys2.every((k) => pressedKeys.has(k)));
}
function useKeyOrCode(eventCode, keysToWatch) {
  return keysToWatch.includes(eventCode) ? "code" : "key";
}
const useViewportHelper = () => {
  const store = useStoreApi();
  return reactExports.useMemo(() => {
    return {
      zoomIn: async (options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleBy(1.2, options) : false;
      },
      zoomOut: async (options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleBy(1 / 1.2, options) : false;
      },
      zoomTo: async (zoomLevel, options) => {
        const { panZoom } = store.getState();
        return panZoom ? panZoom.scaleTo(zoomLevel, options) : false;
      },
      getZoom: () => store.getState().transform[2],
      setViewport: async (viewport, options) => {
        const { transform: [tX, tY, tZoom], panZoom } = store.getState();
        if (!panZoom) {
          return false;
        }
        await panZoom.setViewport({
          x: viewport.x ?? tX,
          y: viewport.y ?? tY,
          zoom: viewport.zoom ?? tZoom
        }, options);
        return true;
      },
      getViewport: () => {
        const [x, y, zoom2] = store.getState().transform;
        return { x, y, zoom: zoom2 };
      },
      setCenter: async (x, y, options) => {
        return store.getState().setCenter(x, y, options);
      },
      fitBounds: async (bounds, options) => {
        const { width, height, minZoom, maxZoom, panZoom } = store.getState();
        const viewport = getViewportForBounds(bounds, width, height, minZoom, maxZoom, options?.padding ?? 0.1);
        if (!panZoom) {
          return false;
        }
        await panZoom.setViewport(viewport, {
          duration: options?.duration,
          ease: options?.ease,
          interpolate: options?.interpolate
        });
        return true;
      },
      screenToFlowPosition: (clientPosition, options = {}) => {
        const { transform: transform2, snapGrid, snapToGrid, domNode } = store.getState();
        if (!domNode) {
          return clientPosition;
        }
        const { x: domX, y: domY } = domNode.getBoundingClientRect();
        const correctedPosition = {
          x: clientPosition.x - domX,
          y: clientPosition.y - domY
        };
        const _snapGrid = options.snapGrid ?? snapGrid;
        const _snapToGrid = options.snapToGrid ?? snapToGrid;
        return pointToRendererPoint(correctedPosition, transform2, _snapToGrid, _snapGrid);
      },
      flowToScreenPosition: (flowPosition) => {
        const { transform: transform2, domNode } = store.getState();
        if (!domNode) {
          return flowPosition;
        }
        const { x: domX, y: domY } = domNode.getBoundingClientRect();
        const rendererPosition = rendererPointToPoint(flowPosition, transform2);
        return {
          x: rendererPosition.x + domX,
          y: rendererPosition.y + domY
        };
      }
    };
  }, []);
};
function applyChanges(changes, elements) {
  const updatedElements = [];
  const changesMap = /* @__PURE__ */ new Map();
  const addItemChanges = [];
  for (const change of changes) {
    if (change.type === "add") {
      addItemChanges.push(change);
      continue;
    } else if (change.type === "remove" || change.type === "replace") {
      changesMap.set(change.id, [change]);
    } else {
      const elementChanges = changesMap.get(change.id);
      if (elementChanges) {
        elementChanges.push(change);
      } else {
        changesMap.set(change.id, [change]);
      }
    }
  }
  for (const element2 of elements) {
    const changes2 = changesMap.get(element2.id);
    if (!changes2) {
      updatedElements.push(element2);
      continue;
    }
    if (changes2[0].type === "remove") {
      continue;
    }
    if (changes2[0].type === "replace") {
      updatedElements.push({ ...changes2[0].item });
      continue;
    }
    const updatedElement = { ...element2 };
    for (const change of changes2) {
      applyChange(change, updatedElement);
    }
    updatedElements.push(updatedElement);
  }
  if (addItemChanges.length) {
    addItemChanges.forEach((change) => {
      if (change.index !== void 0) {
        updatedElements.splice(change.index, 0, { ...change.item });
      } else {
        updatedElements.push({ ...change.item });
      }
    });
  }
  return updatedElements;
}
function applyChange(change, element2) {
  switch (change.type) {
    case "select": {
      element2.selected = change.selected;
      break;
    }
    case "position": {
      if (typeof change.position !== "undefined") {
        element2.position = change.position;
      }
      if (typeof change.dragging !== "undefined") {
        element2.dragging = change.dragging;
      }
      break;
    }
    case "dimensions": {
      if (typeof change.dimensions !== "undefined") {
        element2.measured = {
          ...change.dimensions
        };
        if (change.setAttributes) {
          if (change.setAttributes === true || change.setAttributes === "width") {
            element2.width = change.dimensions.width;
          }
          if (change.setAttributes === true || change.setAttributes === "height") {
            element2.height = change.dimensions.height;
          }
        }
      }
      if (typeof change.resizing === "boolean") {
        element2.resizing = change.resizing;
      }
      break;
    }
  }
}
function applyNodeChanges(changes, nodes) {
  return applyChanges(changes, nodes);
}
function applyEdgeChanges(changes, edges) {
  return applyChanges(changes, edges);
}
function createSelectionChange(id2, selected2) {
  return {
    id: id2,
    type: "select",
    selected: selected2
  };
}
function getSelectionChanges(items, selectedIds = /* @__PURE__ */ new Set(), mutateItem = false) {
  const changes = [];
  for (const [id2, item] of items) {
    const willBeSelected = selectedIds.has(id2);
    if (!(item.selected === void 0 && !willBeSelected) && item.selected !== willBeSelected) {
      if (mutateItem) {
        item.selected = willBeSelected;
      }
      changes.push(createSelectionChange(item.id, willBeSelected));
    }
  }
  return changes;
}
function getElementsDiffChanges({ items = [], lookup }) {
  const changes = [];
  const itemsLookup = new Map(items.map((item) => [item.id, item]));
  for (const [index2, item] of items.entries()) {
    const lookupItem = lookup.get(item.id);
    const storeItem = lookupItem?.internals?.userNode ?? lookupItem;
    if (storeItem !== void 0 && storeItem !== item) {
      changes.push({ id: item.id, item, type: "replace" });
    }
    if (storeItem === void 0) {
      changes.push({ item, type: "add", index: index2 });
    }
  }
  for (const [id2] of lookup) {
    const nextNode = itemsLookup.get(id2);
    if (nextNode === void 0) {
      changes.push({ id: id2, type: "remove" });
    }
  }
  return changes;
}
function elementToRemoveChange(item) {
  return {
    id: item.id,
    type: "remove"
  };
}
const defaultOnError$1 = createDevWarn();
function addEdge(edgeParams, edges, options = {}) {
  return addEdge$1(edgeParams, edges, {
    ...options,
    onError: options.onError ?? defaultOnError$1
  });
}
const isNode = (element2) => isNodeBase(element2);
const isEdge = (element2) => isEdgeBase(element2);
function fixedForwardRef(render) {
  return reactExports.forwardRef(render);
}
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? reactExports.useLayoutEffect : reactExports.useEffect;
function useQueue(runQueue) {
  const [serial, setSerial] = reactExports.useState(BigInt(0));
  const [queue] = reactExports.useState(() => createQueue(() => setSerial((n) => n + BigInt(1))));
  useIsomorphicLayoutEffect(() => {
    const queueItems = queue.get();
    if (queueItems.length) {
      runQueue(queueItems);
      queue.reset();
    }
  }, [serial]);
  return queue;
}
function createQueue(cb) {
  let queue = [];
  return {
    get: () => queue,
    reset: () => {
      queue = [];
    },
    push: (item) => {
      queue.push(item);
      cb();
    }
  };
}
const BatchContext = reactExports.createContext(null);
function BatchProvider({ children: children2 }) {
  const store = useStoreApi();
  const nodeQueueHandler = reactExports.useCallback((queueItems) => {
    const { nodes = [], setNodes, hasDefaultNodes, onNodesChange, nodeLookup, fitViewQueued, onNodesChangeMiddlewareMap } = store.getState();
    let next = nodes;
    for (const payload of queueItems) {
      next = typeof payload === "function" ? payload(next) : payload;
    }
    let changes = getElementsDiffChanges({
      items: next,
      lookup: nodeLookup
    });
    for (const middleware of onNodesChangeMiddlewareMap.values()) {
      changes = middleware(changes);
    }
    if (hasDefaultNodes) {
      setNodes(next);
    }
    if (changes.length > 0) {
      onNodesChange?.(changes);
    } else if (fitViewQueued) {
      window.requestAnimationFrame(() => {
        const { fitViewQueued: fitViewQueued2, nodes: nodes2, setNodes: setNodes2 } = store.getState();
        if (fitViewQueued2) {
          setNodes2(nodes2);
        }
      });
    }
  }, []);
  const nodeQueue = useQueue(nodeQueueHandler);
  const edgeQueueHandler = reactExports.useCallback((queueItems) => {
    const { edges = [], setEdges, hasDefaultEdges, onEdgesChange, edgeLookup } = store.getState();
    let next = edges;
    for (const payload of queueItems) {
      next = typeof payload === "function" ? payload(next) : payload;
    }
    if (hasDefaultEdges) {
      setEdges(next);
    } else if (onEdgesChange) {
      onEdgesChange(getElementsDiffChanges({
        items: next,
        lookup: edgeLookup
      }));
    }
  }, []);
  const edgeQueue = useQueue(edgeQueueHandler);
  const value = reactExports.useMemo(() => ({ nodeQueue, edgeQueue }), []);
  return jsxRuntimeExports.jsx(BatchContext.Provider, { value, children: children2 });
}
function useBatchContext() {
  const batchContext = reactExports.useContext(BatchContext);
  if (!batchContext) {
    throw new Error("useBatchContext must be used within a BatchProvider");
  }
  return batchContext;
}
const selector$j = (s) => !!s.panZoom;
function useReactFlow() {
  const viewportHelper = useViewportHelper();
  const store = useStoreApi();
  const batchContext = useBatchContext();
  const viewportInitialized = useStore(selector$j);
  const generalHelper = reactExports.useMemo(() => {
    const getInternalNode = (id2) => store.getState().nodeLookup.get(id2);
    const setNodes = (payload) => {
      batchContext.nodeQueue.push(payload);
    };
    const setEdges = (payload) => {
      batchContext.edgeQueue.push(payload);
    };
    const getNodeRect = (node2) => {
      const { nodeLookup, nodeOrigin } = store.getState();
      const nodeToUse = isNode(node2) ? node2 : nodeLookup.get(node2.id);
      const position2 = nodeToUse.parentId ? evaluateAbsolutePosition(nodeToUse.position, nodeToUse.measured, nodeToUse.parentId, nodeLookup, nodeOrigin) : nodeToUse.position;
      const nodeWithPosition = {
        ...nodeToUse,
        position: position2,
        width: nodeToUse.measured?.width ?? nodeToUse.width,
        height: nodeToUse.measured?.height ?? nodeToUse.height
      };
      return nodeToRect(nodeWithPosition);
    };
    const updateNode = (id2, nodeUpdate, options = { replace: false }) => {
      setNodes((prevNodes) => prevNodes.map((node2) => {
        if (node2.id === id2) {
          const nextNode = typeof nodeUpdate === "function" ? nodeUpdate(node2) : nodeUpdate;
          return options.replace && isNode(nextNode) ? nextNode : { ...node2, ...nextNode };
        }
        return node2;
      }));
    };
    const updateEdge = (id2, edgeUpdate, options = { replace: false }) => {
      setEdges((prevEdges) => prevEdges.map((edge) => {
        if (edge.id === id2) {
          const nextEdge = typeof edgeUpdate === "function" ? edgeUpdate(edge) : edgeUpdate;
          return options.replace && isEdge(nextEdge) ? nextEdge : { ...edge, ...nextEdge };
        }
        return edge;
      }));
    };
    return {
      getNodes: () => store.getState().nodes.map((n) => ({ ...n })),
      getNode: (id2) => getInternalNode(id2)?.internals.userNode,
      getInternalNode,
      getEdges: () => {
        const { edges = [] } = store.getState();
        return edges.map((e) => ({ ...e }));
      },
      getEdge: (id2) => store.getState().edgeLookup.get(id2),
      setNodes,
      setEdges,
      addNodes: (payload) => {
        const newNodes = Array.isArray(payload) ? payload : [payload];
        batchContext.nodeQueue.push((nodes) => [...nodes, ...newNodes]);
      },
      addEdges: (payload) => {
        const newEdges = Array.isArray(payload) ? payload : [payload];
        batchContext.edgeQueue.push((edges) => [...edges, ...newEdges]);
      },
      toObject: () => {
        const { nodes = [], edges = [], transform: transform2 } = store.getState();
        const [x, y, zoom2] = transform2;
        return {
          nodes: nodes.map((n) => ({ ...n })),
          edges: edges.map((e) => ({ ...e })),
          viewport: {
            x,
            y,
            zoom: zoom2
          }
        };
      },
      deleteElements: async ({ nodes: nodesToRemove = [], edges: edgesToRemove = [] }) => {
        const { nodes, edges, onNodesDelete, onEdgesDelete, triggerNodeChanges, triggerEdgeChanges, onDelete, onBeforeDelete } = store.getState();
        const { nodes: matchingNodes, edges: matchingEdges } = await getElementsToRemove({
          nodesToRemove,
          edgesToRemove,
          nodes,
          edges,
          onBeforeDelete
        });
        const hasMatchingEdges = matchingEdges.length > 0;
        const hasMatchingNodes = matchingNodes.length > 0;
        if (hasMatchingEdges) {
          const edgeChanges = matchingEdges.map(elementToRemoveChange);
          onEdgesDelete?.(matchingEdges);
          triggerEdgeChanges(edgeChanges);
        }
        if (hasMatchingNodes) {
          const nodeChanges = matchingNodes.map(elementToRemoveChange);
          onNodesDelete?.(matchingNodes);
          triggerNodeChanges(nodeChanges);
        }
        if (hasMatchingNodes || hasMatchingEdges) {
          onDelete?.({ nodes: matchingNodes, edges: matchingEdges });
        }
        return { deletedNodes: matchingNodes, deletedEdges: matchingEdges };
      },
      /**
       * Partial is defined as "the 2 nodes/areas are intersecting partially".
       * If a is contained in b or b is contained in a, they are both
       * considered fully intersecting.
       */
      getIntersectingNodes: (nodeOrRect, partially = true, nodes) => {
        const isRect = isRectObject(nodeOrRect);
        const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
        const hasNodesOption = nodes !== void 0;
        if (!nodeRect) {
          return [];
        }
        return (nodes || store.getState().nodes).filter((n) => {
          const internalNode = store.getState().nodeLookup.get(n.id);
          if (internalNode && !isRect && (n.id === nodeOrRect.id || !internalNode.internals.positionAbsolute)) {
            return false;
          }
          const currNodeRect = nodeToRect(hasNodesOption ? n : internalNode);
          const overlappingArea = getOverlappingArea(currNodeRect, nodeRect);
          const partiallyVisible = partially && overlappingArea > 0;
          return partiallyVisible || overlappingArea >= currNodeRect.width * currNodeRect.height || overlappingArea >= nodeRect.width * nodeRect.height;
        });
      },
      isNodeIntersecting: (nodeOrRect, area, partially = true) => {
        const isRect = isRectObject(nodeOrRect);
        const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
        if (!nodeRect) {
          return false;
        }
        const overlappingArea = getOverlappingArea(nodeRect, area);
        const partiallyVisible = partially && overlappingArea > 0;
        return partiallyVisible || overlappingArea >= area.width * area.height || overlappingArea >= nodeRect.width * nodeRect.height;
      },
      updateNode,
      updateNodeData: (id2, dataUpdate, options = { replace: false }) => {
        updateNode(id2, (node2) => {
          const nextData = typeof dataUpdate === "function" ? dataUpdate(node2) : dataUpdate;
          return options.replace ? { ...node2, data: nextData } : { ...node2, data: { ...node2.data, ...nextData } };
        }, options);
      },
      updateEdge,
      updateEdgeData: (id2, dataUpdate, options = { replace: false }) => {
        updateEdge(id2, (edge) => {
          const nextData = typeof dataUpdate === "function" ? dataUpdate(edge) : dataUpdate;
          return options.replace ? { ...edge, data: nextData } : { ...edge, data: { ...edge.data, ...nextData } };
        }, options);
      },
      getNodesBounds: (nodes) => {
        const { nodeLookup, nodeOrigin } = store.getState();
        return getNodesBounds(nodes, { nodeLookup, nodeOrigin });
      },
      getHandleConnections: ({ type, id: id2, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}-${type}${id2 ? `-${id2}` : ""}`)?.values() ?? []),
      getNodeConnections: ({ type, handleId, nodeId }) => Array.from(store.getState().connectionLookup.get(`${nodeId}${type ? handleId ? `-${type}-${handleId}` : `-${type}` : ""}`)?.values() ?? []),
      fitView: async (options) => {
        const fitViewResolver = store.getState().fitViewResolver ?? withResolvers();
        store.setState({ fitViewQueued: true, fitViewOptions: options, fitViewResolver });
        batchContext.nodeQueue.push((nodes) => [...nodes]);
        return fitViewResolver.promise;
      }
    };
  }, []);
  return reactExports.useMemo(() => {
    return {
      ...generalHelper,
      ...viewportHelper,
      viewportInitialized
    };
  }, [viewportInitialized]);
}
const selected = (item) => item.selected;
const win$1 = typeof window !== "undefined" ? window : void 0;
function useGlobalKeyHandler({ deleteKeyCode, multiSelectionKeyCode }) {
  const store = useStoreApi();
  const { deleteElements } = useReactFlow();
  const deleteKeyPressed = useKeyPress(deleteKeyCode, { actInsideInputWithModifier: false });
  const multiSelectionKeyPressed = useKeyPress(multiSelectionKeyCode, { target: win$1 });
  reactExports.useEffect(() => {
    if (deleteKeyPressed) {
      const { edges, nodes } = store.getState();
      deleteElements({ nodes: nodes.filter(selected), edges: edges.filter(selected) });
      store.setState({ nodesSelectionActive: false });
    }
  }, [deleteKeyPressed]);
  reactExports.useEffect(() => {
    store.setState({ multiSelectionActive: multiSelectionKeyPressed });
  }, [multiSelectionKeyPressed]);
}
function useResizeHandler(domNode) {
  const store = useStoreApi();
  reactExports.useEffect(() => {
    const updateDimensions = () => {
      if (!domNode.current || !(domNode.current.checkVisibility?.() ?? true)) {
        return false;
      }
      const size = getDimensions(domNode.current);
      if (size.height === 0 || size.width === 0) {
        store.getState().onError?.("004", errorMessages["error004"]());
      }
      store.setState({ width: size.width || 500, height: size.height || 500 });
    };
    if (domNode.current) {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      const resizeObserver = new ResizeObserver(() => updateDimensions());
      resizeObserver.observe(domNode.current);
      return () => {
        window.removeEventListener("resize", updateDimensions);
        if (resizeObserver && domNode.current) {
          resizeObserver.unobserve(domNode.current);
        }
      };
    }
  }, []);
}
const containerStyle = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0
};
const selector$i = (s) => ({
  userSelectionActive: s.userSelectionActive,
  lib: s.lib,
  connectionInProgress: s.connection.inProgress
});
function ZoomPane({ onPaneContextMenu, zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panActivationKeyPressed, panOnScrollSpeed = 0.5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, zoomActivationKeyCode, preventScrolling = true, children: children2, noWheelClassName, noPanClassName, onViewportChange, isControlledViewport, paneClickDistance, selectionOnDrag }) {
  const store = useStoreApi();
  const zoomPane = reactExports.useRef(null);
  const { userSelectionActive, lib, connectionInProgress } = useStore(selector$i, shallow$1);
  const zoomActivationKeyPressed = useKeyPress(zoomActivationKeyCode);
  const panZoom = reactExports.useRef();
  useResizeHandler(zoomPane);
  const onTransformChange = reactExports.useCallback((transform2) => {
    onViewportChange?.({ x: transform2[0], y: transform2[1], zoom: transform2[2] });
    if (!isControlledViewport) {
      store.setState({ transform: transform2 });
    }
  }, [onViewportChange, isControlledViewport]);
  reactExports.useEffect(() => {
    if (zoomPane.current) {
      panZoom.current = XYPanZoom({
        domNode: zoomPane.current,
        minZoom,
        maxZoom,
        translateExtent,
        viewport: defaultViewport2,
        onDraggingChange: (paneDragging) => store.setState((prevState) => prevState.paneDragging === paneDragging ? prevState : { paneDragging }),
        onPanZoomStart: (event, vp) => {
          const { onViewportChangeStart, onMoveStart } = store.getState();
          onMoveStart?.(event, vp);
          onViewportChangeStart?.(vp);
        },
        onPanZoom: (event, vp) => {
          const { onViewportChange: onViewportChange2, onMove } = store.getState();
          onMove?.(event, vp);
          onViewportChange2?.(vp);
        },
        onPanZoomEnd: (event, vp) => {
          const { onViewportChangeEnd, onMoveEnd } = store.getState();
          onMoveEnd?.(event, vp);
          onViewportChangeEnd?.(vp);
        }
      });
      const { x, y, zoom: zoom2 } = panZoom.current.getViewport();
      store.setState({
        panZoom: panZoom.current,
        transform: [x, y, zoom2],
        domNode: zoomPane.current.closest(".react-flow")
      });
      return () => {
        panZoom.current?.destroy();
      };
    }
  }, []);
  reactExports.useEffect(() => {
    panZoom.current?.update({
      onPaneContextMenu,
      zoomOnScroll,
      zoomOnPinch,
      panOnScroll,
      panActivationKeyPressed,
      panOnScrollSpeed,
      panOnScrollMode,
      zoomOnDoubleClick,
      panOnDrag,
      zoomActivationKeyPressed,
      preventScrolling,
      noPanClassName,
      userSelectionActive,
      noWheelClassName,
      lib,
      onTransformChange,
      connectionInProgress,
      selectionOnDrag,
      paneClickDistance
    });
  }, [
    onPaneContextMenu,
    zoomOnScroll,
    zoomOnPinch,
    panOnScroll,
    panActivationKeyPressed,
    panOnScrollSpeed,
    panOnScrollMode,
    zoomOnDoubleClick,
    panOnDrag,
    zoomActivationKeyPressed,
    preventScrolling,
    noPanClassName,
    userSelectionActive,
    noWheelClassName,
    lib,
    onTransformChange,
    connectionInProgress,
    selectionOnDrag,
    paneClickDistance
  ]);
  return jsxRuntimeExports.jsx("div", { className: "react-flow__renderer", ref: zoomPane, style: containerStyle, children: children2 });
}
const selector$h = (s) => ({
  userSelectionActive: s.userSelectionActive,
  userSelectionRect: s.userSelectionRect
});
function UserSelection() {
  const { userSelectionActive, userSelectionRect } = useStore(selector$h, shallow$1);
  const isActive = userSelectionActive && userSelectionRect;
  if (!isActive) {
    return null;
  }
  return jsxRuntimeExports.jsx("div", { className: "react-flow__selection react-flow__container", style: {
    width: userSelectionRect.width,
    height: userSelectionRect.height,
    transform: `translate(${userSelectionRect.x}px, ${userSelectionRect.y}px)`
  } });
}
const wrapHandler = (handler, containerRef) => {
  return (event) => {
    if (event.target !== containerRef.current) {
      return;
    }
    handler?.(event);
  };
};
const selector$g = (s) => ({
  userSelectionActive: s.userSelectionActive,
  elementsSelectable: s.elementsSelectable,
  dragging: s.paneDragging,
  panBy: s.panBy,
  autoPanSpeed: s.autoPanSpeed
});
function Pane({ isSelecting, selectionKeyPressed, selectionMode = SelectionMode.Full, panOnDrag, autoPanOnSelection, paneClickDistance, selectionOnDrag, onSelectionStart, onSelectionEnd, onPaneClick, onPaneContextMenu, onPaneScroll, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, children: children2 }) {
  const autoPanId = reactExports.useRef(0);
  const store = useStoreApi();
  const { userSelectionActive, elementsSelectable, dragging, panBy: panBy2, autoPanSpeed } = useStore(selector$g, shallow$1);
  const isSelectionEnabled = elementsSelectable && (isSelecting || userSelectionActive);
  const container = reactExports.useRef(null);
  const containerBounds = reactExports.useRef();
  const selectedNodeIds = reactExports.useRef(/* @__PURE__ */ new Set());
  const selectedEdgeIds = reactExports.useRef(/* @__PURE__ */ new Set());
  const connectionEndedOnPane = reactExports.useRef(false);
  const selectionInProgress = reactExports.useRef(false);
  const position2 = reactExports.useRef({ x: 0, y: 0 });
  const autoPanStarted = reactExports.useRef(false);
  const onClick = (event) => {
    if (selectionInProgress.current || connectionEndedOnPane.current || store.getState().connection.inProgress) {
      selectionInProgress.current = false;
      connectionEndedOnPane.current = false;
      return;
    }
    onPaneClick?.(event);
    store.getState().resetSelectedElements();
    store.setState({ nodesSelectionActive: false });
  };
  const onContextMenu = (event) => {
    if (Array.isArray(panOnDrag) && panOnDrag?.includes(2)) {
      event.preventDefault();
      return;
    }
    onPaneContextMenu?.(event);
  };
  const onWheel = onPaneScroll ? (event) => onPaneScroll(event) : void 0;
  const onClickCapture = (event) => {
    if (selectionInProgress.current) {
      event.stopPropagation();
      selectionInProgress.current = false;
    }
  };
  const onPointerDownCapture = (event) => {
    if (event.pointerType === "touch" && panOnDrag !== false && !selectionKeyPressed) {
      return;
    }
    const { domNode, transform: transform2 } = store.getState();
    containerBounds.current = domNode?.getBoundingClientRect();
    if (!containerBounds.current)
      return;
    const eventTargetIsContainer = event.target === container.current;
    const isNoKeyEvent = !eventTargetIsContainer && !!event.target.closest(".nokey");
    const isSelectionActive = selectionOnDrag && eventTargetIsContainer || selectionKeyPressed;
    if (isNoKeyEvent || !isSelecting || !isSelectionActive || event.button !== 0 || !event.isPrimary) {
      return;
    }
    event.target?.setPointerCapture?.(event.pointerId);
    selectionInProgress.current = false;
    const { x, y } = getEventPosition(event.nativeEvent, containerBounds.current);
    const userSelectionStartPosition = pointToRendererPoint({ x, y }, transform2);
    store.setState({
      userSelectionRect: {
        width: 0,
        height: 0,
        startX: userSelectionStartPosition.x,
        startY: userSelectionStartPosition.y,
        x,
        y
      }
    });
    if (!eventTargetIsContainer) {
      event.stopPropagation();
      event.preventDefault();
    }
  };
  function commitUserSelectionRect(mouseX, mouseY) {
    const { userSelectionRect } = store.getState();
    if (!userSelectionRect) {
      return;
    }
    const { transform: transform2, nodeLookup, edgeLookup, connectionLookup, triggerNodeChanges, triggerEdgeChanges, defaultEdgeOptions } = store.getState();
    const userStartPosition = { x: userSelectionRect.startX, y: userSelectionRect.startY };
    const { x: screenStartX, y: screenStartY } = rendererPointToPoint(userStartPosition, transform2);
    const nextUserSelectRect = {
      startX: userStartPosition.x,
      startY: userStartPosition.y,
      x: mouseX < screenStartX ? mouseX : screenStartX,
      y: mouseY < screenStartY ? mouseY : screenStartY,
      width: Math.abs(mouseX - screenStartX),
      height: Math.abs(mouseY - screenStartY)
    };
    const prevSelectedNodeIds = selectedNodeIds.current;
    const prevSelectedEdgeIds = selectedEdgeIds.current;
    selectedNodeIds.current = new Set(getNodesInside(nodeLookup, nextUserSelectRect, transform2, selectionMode === SelectionMode.Partial, true).map((node2) => node2.id));
    selectedEdgeIds.current = /* @__PURE__ */ new Set();
    const edgesSelectable = defaultEdgeOptions?.selectable ?? true;
    for (const nodeId of selectedNodeIds.current) {
      const connections = connectionLookup.get(nodeId);
      if (!connections)
        continue;
      for (const { edgeId } of connections.values()) {
        const edge = edgeLookup.get(edgeId);
        if (edge && (edge.selectable ?? edgesSelectable)) {
          selectedEdgeIds.current.add(edgeId);
        }
      }
    }
    if (!areSetsEqual(prevSelectedNodeIds, selectedNodeIds.current)) {
      const changes = getSelectionChanges(nodeLookup, selectedNodeIds.current, true);
      triggerNodeChanges(changes);
    }
    if (!areSetsEqual(prevSelectedEdgeIds, selectedEdgeIds.current)) {
      const changes = getSelectionChanges(edgeLookup, selectedEdgeIds.current);
      triggerEdgeChanges(changes);
    }
    store.setState({
      userSelectionRect: nextUserSelectRect,
      userSelectionActive: true,
      nodesSelectionActive: false
    });
  }
  function autoPan() {
    if (!autoPanOnSelection || !containerBounds.current) {
      return;
    }
    const [x, y] = calcAutoPan(position2.current, containerBounds.current, autoPanSpeed);
    panBy2({ x, y }).then((panned) => {
      if (!selectionInProgress.current || !panned) {
        autoPanId.current = requestAnimationFrame(autoPan);
        return;
      }
      const { x: mx, y: my } = position2.current;
      commitUserSelectionRect(mx, my);
      autoPanId.current = requestAnimationFrame(autoPan);
    });
  }
  const cleanupAutoPan = () => {
    cancelAnimationFrame(autoPanId.current);
    autoPanId.current = 0;
    autoPanStarted.current = false;
  };
  reactExports.useEffect(() => {
    return () => cleanupAutoPan();
  }, []);
  const onPointerMove = (event) => {
    const { userSelectionRect, transform: transform2, resetSelectedElements } = store.getState();
    if (!containerBounds.current || !userSelectionRect) {
      return;
    }
    const { x: mouseX, y: mouseY } = getEventPosition(event.nativeEvent, containerBounds.current);
    position2.current = { x: mouseX, y: mouseY };
    const screenStart = rendererPointToPoint({ x: userSelectionRect.startX, y: userSelectionRect.startY }, transform2);
    if (!selectionInProgress.current) {
      const requiredDistance = selectionKeyPressed ? 0 : paneClickDistance;
      const distance2 = Math.hypot(mouseX - screenStart.x, mouseY - screenStart.y);
      if (distance2 <= requiredDistance) {
        return;
      }
      resetSelectedElements();
      onSelectionStart?.(event);
    }
    selectionInProgress.current = true;
    if (!autoPanStarted.current) {
      autoPan();
      autoPanStarted.current = true;
    }
    commitUserSelectionRect(mouseX, mouseY);
  };
  const onPointerUp = (event) => {
    if (!isSelectionEnabled) {
      if (event.target === container.current && store.getState().connection.inProgress) {
        connectionEndedOnPane.current = true;
      }
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.target?.releasePointerCapture?.(event.pointerId);
    if (!userSelectionActive && event.target === container.current && store.getState().userSelectionRect) {
      onClick?.(event);
    }
    store.setState({
      userSelectionActive: false,
      userSelectionRect: null
    });
    if (selectionInProgress.current) {
      onSelectionEnd?.(event);
      store.setState({
        nodesSelectionActive: selectedNodeIds.current.size > 0
      });
    }
    cleanupAutoPan();
  };
  const onPointerCancel = (event) => {
    event.target?.releasePointerCapture?.(event.pointerId);
    cleanupAutoPan();
  };
  const draggable = panOnDrag === true || Array.isArray(panOnDrag) && panOnDrag.includes(0);
  return jsxRuntimeExports.jsxs("div", { className: cc(["react-flow__pane", { draggable, dragging, selection: isSelecting }]), onClick: isSelectionEnabled ? void 0 : wrapHandler(onClick, container), onContextMenu: wrapHandler(onContextMenu, container), onWheel: wrapHandler(onWheel, container), onPointerEnter: isSelectionEnabled ? void 0 : onPaneMouseEnter, onPointerMove: isSelectionEnabled ? onPointerMove : onPaneMouseMove, onPointerUp, onPointerCancel: isSelectionEnabled ? onPointerCancel : void 0, onPointerDownCapture: isSelectionEnabled ? onPointerDownCapture : void 0, onClickCapture: isSelectionEnabled ? onClickCapture : void 0, onPointerLeave: onPaneMouseLeave, ref: container, style: containerStyle, children: [children2, jsxRuntimeExports.jsx(UserSelection, {})] });
}
function handleNodeClick({ id: id2, store, unselect = false, nodeRef }) {
  const { addSelectedNodes, unselectNodesAndEdges, multiSelectionActive, nodeLookup, onError } = store.getState();
  const node2 = nodeLookup.get(id2);
  if (!node2) {
    onError?.("012", errorMessages["error012"](id2));
    return;
  }
  store.setState({ nodesSelectionActive: false });
  if (!node2.selected) {
    addSelectedNodes([id2]);
  } else if (unselect || node2.selected && multiSelectionActive) {
    unselectNodesAndEdges({ nodes: [node2], edges: [] });
    requestAnimationFrame(() => nodeRef?.current?.blur());
  }
}
function useDrag({ nodeRef, disabled = false, noDragClassName, handleSelector, nodeId, isSelectable, nodeClickDistance }) {
  const store = useStoreApi();
  const [dragging, setDragging] = reactExports.useState(false);
  const xyDrag = reactExports.useRef();
  reactExports.useEffect(() => {
    if (disabled) {
      return;
    }
    xyDrag.current = XYDrag({
      getStoreItems: () => store.getState(),
      onNodeMouseDown: (id2) => {
        handleNodeClick({
          id: id2,
          store,
          nodeRef
        });
      },
      onDragStart: () => {
        setDragging(true);
      },
      onDragStop: () => {
        setDragging(false);
      }
    });
    return () => {
      xyDrag.current?.destroy();
      xyDrag.current = void 0;
    };
  }, [disabled, store, nodeRef]);
  reactExports.useEffect(() => {
    if (disabled || !nodeRef.current || !xyDrag.current) {
      return;
    }
    xyDrag.current.update({
      noDragClassName,
      handleSelector,
      domNode: nodeRef.current,
      isSelectable,
      nodeId,
      nodeClickDistance
    });
  }, [noDragClassName, handleSelector, disabled, isSelectable, nodeRef, nodeId, nodeClickDistance]);
  return dragging;
}
const selectedAndDraggable = (nodesDraggable) => (n) => n.selected && (n.draggable || nodesDraggable && typeof n.draggable === "undefined");
function useMoveSelectedNodes() {
  const store = useStoreApi();
  const moveSelectedNodes = reactExports.useCallback((params) => {
    const { nodeExtent, snapToGrid, snapGrid, nodesDraggable, onError, updateNodePositions, nodeLookup, nodeOrigin } = store.getState();
    const nodeUpdates = /* @__PURE__ */ new Map();
    const isSelected = selectedAndDraggable(nodesDraggable);
    const xVelo = snapToGrid ? snapGrid[0] : 5;
    const yVelo = snapToGrid ? snapGrid[1] : 5;
    const xDiff = params.direction.x * xVelo * params.factor;
    const yDiff = params.direction.y * yVelo * params.factor;
    for (const [, node2] of nodeLookup) {
      if (!isSelected(node2)) {
        continue;
      }
      let nextPosition = {
        x: node2.internals.positionAbsolute.x + xDiff,
        y: node2.internals.positionAbsolute.y + yDiff
      };
      if (snapToGrid) {
        nextPosition = snapPosition(nextPosition, snapGrid);
      }
      const { position: position2, positionAbsolute } = calculateNodePosition({
        nodeId: node2.id,
        nextPosition,
        nodeLookup,
        nodeExtent,
        nodeOrigin,
        onError
      });
      node2.position = position2;
      node2.internals.positionAbsolute = positionAbsolute;
      nodeUpdates.set(node2.id, node2);
    }
    updateNodePositions(nodeUpdates);
  }, []);
  return moveSelectedNodes;
}
const NodeIdContext = reactExports.createContext(null);
const Provider = NodeIdContext.Provider;
NodeIdContext.Consumer;
const useNodeId = () => {
  const nodeId = reactExports.useContext(NodeIdContext);
  return nodeId;
};
const selector$f = (s) => ({
  connectOnClick: s.connectOnClick,
  noPanClassName: s.noPanClassName,
  rfId: s.rfId
});
const HandleConfigContext = reactExports.createContext(null);
function HandleConfigProvider({ children: children2 }) {
  const config = useStore(selector$f, shallow$1);
  return jsxRuntimeExports.jsx(HandleConfigContext.Provider, { value: config, children: children2 });
}
function useHandleConfig() {
  const config = reactExports.useContext(HandleConfigContext);
  if (!config) {
    throw new Error("useHandleConfig must be used within a HandleConfigProvider");
  }
  return config;
}
const idleConnectingState = {
  connectingFrom: false,
  connectingTo: false,
  clickConnecting: false,
  isPossibleEndHandle: true,
  connectionInProcess: false,
  clickConnectionInProcess: false,
  valid: false
};
const connectingSelector = (nodeId, handleId, type) => (state) => {
  const { connectionClickStartHandle: clickHandle, connectionMode, connection } = state;
  const { fromHandle, toHandle, isValid } = connection;
  if (!fromHandle && !clickHandle) {
    return idleConnectingState;
  }
  const connectingTo = toHandle?.nodeId === nodeId && toHandle?.id === handleId && toHandle?.type === type;
  return {
    connectingFrom: fromHandle?.nodeId === nodeId && fromHandle?.id === handleId && fromHandle?.type === type,
    connectingTo,
    clickConnecting: clickHandle?.nodeId === nodeId && clickHandle?.id === handleId && clickHandle?.type === type,
    isPossibleEndHandle: connectionMode === ConnectionMode.Strict ? fromHandle?.type !== type : nodeId !== fromHandle?.nodeId || handleId !== fromHandle?.id,
    connectionInProcess: !!fromHandle,
    clickConnectionInProcess: !!clickHandle,
    valid: connectingTo && isValid
  };
};
function HandleComponent({ type = "source", position: position2 = Position.Top, isValidConnection, isConnectable = true, isConnectableStart = true, isConnectableEnd = true, id: id2, onConnect, children: children2, className, onMouseDown, onTouchStart, ...rest }, ref) {
  const handleId = id2 || null;
  const isTarget = type === "target";
  const store = useStoreApi();
  const nodeId = useNodeId();
  const { connectOnClick, noPanClassName, rfId } = useHandleConfig();
  const { connectingFrom, connectingTo, clickConnecting, isPossibleEndHandle, connectionInProcess, clickConnectionInProcess, valid: valid2 } = useStore(connectingSelector(nodeId, handleId, type), shallow$1);
  if (!nodeId) {
    store.getState().onError?.("010", errorMessages["error010"]());
  }
  const onConnectExtended = (params) => {
    const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = store.getState();
    const edgeParams = {
      ...defaultEdgeOptions,
      ...params
    };
    if (hasDefaultEdges) {
      const { edges, setEdges, onError } = store.getState();
      setEdges(addEdge(edgeParams, edges, { onError }));
    }
    onConnectAction?.(edgeParams);
    onConnect?.(edgeParams);
  };
  const onPointerDown2 = (event) => {
    if (!nodeId) {
      return;
    }
    const isMouseTriggered = isMouseEvent(event.nativeEvent);
    if (isConnectableStart && (isMouseTriggered && event.button === 0 || !isMouseTriggered)) {
      const currentStore = store.getState();
      XYHandle.onPointerDown(event.nativeEvent, {
        handleDomNode: event.currentTarget,
        autoPanOnConnect: currentStore.autoPanOnConnect,
        connectionMode: currentStore.connectionMode,
        connectionRadius: currentStore.connectionRadius,
        domNode: currentStore.domNode,
        nodeLookup: currentStore.nodeLookup,
        lib: currentStore.lib,
        isTarget,
        handleId,
        nodeId,
        flowId: currentStore.rfId,
        panBy: currentStore.panBy,
        cancelConnection: currentStore.cancelConnection,
        onConnectStart: currentStore.onConnectStart,
        onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
        updateConnection: currentStore.updateConnection,
        onConnect: onConnectExtended,
        isValidConnection: isValidConnection || ((...args) => store.getState().isValidConnection?.(...args) ?? true),
        getTransform: () => store.getState().transform,
        getFromHandle: () => store.getState().connection.fromHandle,
        autoPanSpeed: currentStore.autoPanSpeed,
        dragThreshold: currentStore.connectionDragThreshold
      });
    }
    if (isMouseTriggered) {
      onMouseDown?.(event);
    } else {
      onTouchStart?.(event);
    }
  };
  const onClick = (event) => {
    const { onClickConnectStart, onClickConnectEnd, connectionClickStartHandle, connectionMode, isValidConnection: isValidConnectionStore, lib, rfId: flowId, nodeLookup, connection: connectionState } = store.getState();
    if (!nodeId || !connectionClickStartHandle && !isConnectableStart) {
      return;
    }
    if (!connectionClickStartHandle) {
      onClickConnectStart?.(event.nativeEvent, { nodeId, handleId, handleType: type });
      store.setState({ connectionClickStartHandle: { nodeId, type, id: handleId } });
      return;
    }
    const doc = getHostForElement(event.target);
    const isValidConnectionHandler = isValidConnection || isValidConnectionStore;
    const { connection, isValid } = XYHandle.isValid(event.nativeEvent, {
      handle: {
        nodeId,
        id: handleId,
        type
      },
      connectionMode,
      fromNodeId: connectionClickStartHandle.nodeId,
      fromHandleId: connectionClickStartHandle.id || null,
      fromType: connectionClickStartHandle.type,
      isValidConnection: isValidConnectionHandler,
      flowId,
      doc,
      lib,
      nodeLookup
    });
    if (isValid && connection) {
      onConnectExtended(connection);
    }
    const connectionClone = structuredClone(connectionState);
    delete connectionClone.inProgress;
    connectionClone.toPosition = connectionClone.toHandle ? connectionClone.toHandle.position : null;
    onClickConnectEnd?.(event, connectionClone);
    store.setState({ connectionClickStartHandle: null });
  };
  return jsxRuntimeExports.jsx("div", { "data-handleid": handleId, "data-nodeid": nodeId, "data-handlepos": position2, "data-id": `${rfId}-${nodeId}-${handleId}-${type}`, className: cc([
    "react-flow__handle",
    `react-flow__handle-${position2}`,
    "nodrag",
    noPanClassName,
    className,
    {
      source: !isTarget,
      target: isTarget,
      connectable: isConnectable,
      connectablestart: isConnectableStart,
      connectableend: isConnectableEnd,
      clickconnecting: clickConnecting,
      connectingfrom: connectingFrom,
      connectingto: connectingTo,
      valid: valid2,
      /*
       * shows where you can start a connection from
       * and where you can end it while connecting
       */
      connectionindicator: isConnectable && (!connectionInProcess || isPossibleEndHandle) && (connectionInProcess || clickConnectionInProcess ? isConnectableEnd : isConnectableStart)
    }
  ]), onMouseDown: onPointerDown2, onTouchStart: onPointerDown2, onClick: connectOnClick ? onClick : void 0, ref, ...rest, children: children2 });
}
const Handle = reactExports.memo(fixedForwardRef(HandleComponent));
function InputNode({ data, isConnectable, sourcePosition = Position.Bottom }) {
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [data?.label, jsxRuntimeExports.jsx(Handle, { type: "source", position: sourcePosition, isConnectable })] });
}
function DefaultNode({ data, isConnectable, targetPosition = Position.Top, sourcePosition = Position.Bottom }) {
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx(Handle, { type: "target", position: targetPosition, isConnectable }), data?.label, jsxRuntimeExports.jsx(Handle, { type: "source", position: sourcePosition, isConnectable })] });
}
function GroupNode() {
  return null;
}
function OutputNode({ data, isConnectable, targetPosition = Position.Top }) {
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx(Handle, { type: "target", position: targetPosition, isConnectable }), data?.label] });
}
const arrowKeyDiffs = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};
const builtinNodeTypes = {
  input: InputNode,
  default: DefaultNode,
  output: OutputNode,
  group: GroupNode
};
function getNodeInlineStyleDimensions(node2) {
  if (node2.internals.handleBounds === void 0) {
    return {
      width: node2.width ?? node2.initialWidth ?? node2.style?.width,
      height: node2.height ?? node2.initialHeight ?? node2.style?.height
    };
  }
  return {
    width: node2.width ?? node2.style?.width,
    height: node2.height ?? node2.style?.height
  };
}
const selector$e = (s) => {
  const { width, height, x, y } = getInternalNodesBounds(s.nodeLookup, {
    filter: (node2) => !!node2.selected
  });
  return {
    width: isNumeric(width) ? width : null,
    height: isNumeric(height) ? height : null,
    userSelectionActive: s.userSelectionActive,
    transformString: `translate(${s.transform[0]}px,${s.transform[1]}px) scale(${s.transform[2]}) translate(${x}px,${y}px)`
  };
};
function NodesSelection({ onSelectionContextMenu, noPanClassName, disableKeyboardA11y }) {
  const store = useStoreApi();
  const { width, height, transformString, userSelectionActive } = useStore(selector$e, shallow$1);
  const moveSelectedNodes = useMoveSelectedNodes();
  const nodeRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!disableKeyboardA11y) {
      nodeRef.current?.focus({
        preventScroll: true
      });
    }
  }, [disableKeyboardA11y]);
  const shouldRender = !userSelectionActive && width !== null && height !== null;
  useDrag({
    nodeRef,
    disabled: !shouldRender
  });
  if (!shouldRender) {
    return null;
  }
  const onContextMenu = onSelectionContextMenu ? (event) => {
    const selectedNodes = store.getState().nodes.filter((n) => n.selected);
    onSelectionContextMenu(event, selectedNodes);
  } : void 0;
  const onKeyDown = (event) => {
    if (Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
      event.preventDefault();
      moveSelectedNodes({
        direction: arrowKeyDiffs[event.key],
        factor: event.shiftKey ? 4 : 1
      });
    }
  };
  return jsxRuntimeExports.jsx("div", { className: cc(["react-flow__nodesselection", "react-flow__container", noPanClassName]), style: {
    transform: transformString
  }, children: jsxRuntimeExports.jsx("div", { ref: nodeRef, className: "react-flow__nodesselection-rect", onContextMenu, tabIndex: disableKeyboardA11y ? void 0 : -1, onKeyDown: disableKeyboardA11y ? void 0 : onKeyDown, style: {
    width,
    height
  } }) });
}
const win = typeof window !== "undefined" ? window : void 0;
const selector$d = (s) => {
  return { nodesSelectionActive: s.nodesSelectionActive, userSelectionActive: s.userSelectionActive };
};
function FlowRendererComponent({ children: children2, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, paneClickDistance, deleteKeyCode, selectionKeyCode, selectionOnDrag, selectionMode, onSelectionStart, onSelectionEnd, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, elementsSelectable, zoomOnScroll, zoomOnPinch, panOnScroll: _panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag: _panOnDrag, autoPanOnSelection, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, preventScrolling, onSelectionContextMenu, noWheelClassName, noPanClassName, disableKeyboardA11y, onViewportChange, isControlledViewport }) {
  const { nodesSelectionActive, userSelectionActive } = useStore(selector$d, shallow$1);
  const selectionKeyPressed = useKeyPress(selectionKeyCode, { target: win });
  const panActivationKeyPressed = useKeyPress(panActivationKeyCode, { target: win });
  const panOnDrag = panActivationKeyPressed || _panOnDrag;
  const panOnScroll = panActivationKeyPressed || _panOnScroll;
  const _selectionOnDrag = selectionOnDrag && panOnDrag !== true;
  const isSelecting = selectionKeyPressed || userSelectionActive || _selectionOnDrag;
  useGlobalKeyHandler({ deleteKeyCode, multiSelectionKeyCode });
  return jsxRuntimeExports.jsx(ZoomPane, { onPaneContextMenu, elementsSelectable, zoomOnScroll, zoomOnPinch, panOnScroll, panActivationKeyPressed, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag: !selectionKeyPressed && panOnDrag, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, zoomActivationKeyCode, preventScrolling, noWheelClassName, noPanClassName, onViewportChange, isControlledViewport, paneClickDistance, selectionOnDrag: _selectionOnDrag, children: jsxRuntimeExports.jsxs(Pane, { onSelectionStart, onSelectionEnd, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, panOnDrag, autoPanOnSelection, isSelecting: !!isSelecting, selectionMode, selectionKeyPressed, paneClickDistance, selectionOnDrag: _selectionOnDrag, children: [children2, nodesSelectionActive && jsxRuntimeExports.jsx(NodesSelection, { onSelectionContextMenu, noPanClassName, disableKeyboardA11y })] }) });
}
FlowRendererComponent.displayName = "FlowRenderer";
const FlowRenderer = reactExports.memo(FlowRendererComponent);
const selector$c = (onlyRenderVisible) => (s) => {
  return onlyRenderVisible ? getNodesInside(s.nodeLookup, { x: 0, y: 0, width: s.width, height: s.height }, s.transform, true).map((node2) => node2.id) : Array.from(s.nodeLookup.keys());
};
function useVisibleNodeIds(onlyRenderVisible) {
  const nodeIds = useStore(reactExports.useCallback(selector$c(onlyRenderVisible), [onlyRenderVisible]), shallow$1);
  return nodeIds;
}
const selector$b = (s) => s.updateNodeInternals;
function useResizeObserver() {
  const updateNodeInternals2 = useStore(selector$b);
  const [resizeObserver] = reactExports.useState(() => {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }
    return new ResizeObserver((entries) => {
      const updates = /* @__PURE__ */ new Map();
      entries.forEach((entry) => {
        const id2 = entry.target.getAttribute("data-id");
        updates.set(id2, {
          id: id2,
          nodeElement: entry.target,
          force: true
        });
      });
      updateNodeInternals2(updates);
    });
  });
  reactExports.useEffect(() => {
    return () => {
      resizeObserver?.disconnect();
    };
  }, [resizeObserver]);
  return resizeObserver;
}
function useNodeObserver({ node: node2, nodeType, hasDimensions, resizeObserver }) {
  const store = useStoreApi();
  const nodeRef = reactExports.useRef(null);
  const observedNode = reactExports.useRef(null);
  const prevSourcePosition = reactExports.useRef(node2.sourcePosition);
  const prevTargetPosition = reactExports.useRef(node2.targetPosition);
  const prevType = reactExports.useRef(nodeType);
  const isInitialized = hasDimensions && !!node2.internals.handleBounds;
  reactExports.useEffect(() => {
    if (nodeRef.current && !node2.hidden && (!isInitialized || observedNode.current !== nodeRef.current)) {
      if (observedNode.current) {
        resizeObserver?.unobserve(observedNode.current);
      }
      resizeObserver?.observe(nodeRef.current);
      observedNode.current = nodeRef.current;
    }
  }, [isInitialized, node2.hidden]);
  reactExports.useEffect(() => {
    return () => {
      if (observedNode.current) {
        resizeObserver?.unobserve(observedNode.current);
        observedNode.current = null;
      }
    };
  }, []);
  reactExports.useEffect(() => {
    if (nodeRef.current) {
      const typeChanged = prevType.current !== nodeType;
      const sourcePosChanged = prevSourcePosition.current !== node2.sourcePosition;
      const targetPosChanged = prevTargetPosition.current !== node2.targetPosition;
      if (typeChanged || sourcePosChanged || targetPosChanged) {
        prevType.current = nodeType;
        prevSourcePosition.current = node2.sourcePosition;
        prevTargetPosition.current = node2.targetPosition;
        store.getState().updateNodeInternals(/* @__PURE__ */ new Map([[node2.id, { id: node2.id, nodeElement: nodeRef.current, force: true }]]));
      }
    }
  }, [node2.id, nodeType, node2.sourcePosition, node2.targetPosition]);
  return nodeRef;
}
function NodeWrapper({ id: id2, onClick, onMouseEnter, onMouseMove, onMouseLeave, onContextMenu, onDoubleClick, nodesDraggable, elementsSelectable, nodesConnectable, nodesFocusable, resizeObserver, noDragClassName, noPanClassName, disableKeyboardA11y, rfId, nodeTypes: nodeTypes2, nodeClickDistance, onError }) {
  const { node: node2, internals, isParent } = useStore((s) => {
    const node22 = s.nodeLookup.get(id2);
    const isParent2 = s.parentLookup.has(id2);
    return {
      node: node22,
      internals: node22.internals,
      isParent: isParent2
    };
  }, shallow$1);
  let nodeType = node2.type || "default";
  let NodeComponent = nodeTypes2?.[nodeType] || builtinNodeTypes[nodeType];
  if (NodeComponent === void 0) {
    onError?.("003", errorMessages["error003"](nodeType));
    nodeType = "default";
    NodeComponent = nodeTypes2?.["default"] || builtinNodeTypes.default;
  }
  const isDraggable = !!(node2.draggable || nodesDraggable && typeof node2.draggable === "undefined");
  const isSelectable = !!(node2.selectable || elementsSelectable && typeof node2.selectable === "undefined");
  const isConnectable = !!(node2.connectable || nodesConnectable && typeof node2.connectable === "undefined");
  const isFocusable = !!(node2.focusable || nodesFocusable && typeof node2.focusable === "undefined");
  const store = useStoreApi();
  const hasDimensions = nodeHasDimensions(node2);
  const nodeRef = useNodeObserver({ node: node2, nodeType, hasDimensions, resizeObserver });
  const dragging = useDrag({
    nodeRef,
    disabled: node2.hidden || !isDraggable,
    noDragClassName,
    handleSelector: node2.dragHandle,
    nodeId: id2,
    isSelectable,
    nodeClickDistance
  });
  const moveSelectedNodes = useMoveSelectedNodes();
  if (node2.hidden) {
    return null;
  }
  const nodeDimensions = getNodeDimensions(node2);
  const inlineDimensions = getNodeInlineStyleDimensions(node2);
  const hasPointerEvents = isSelectable || isDraggable || onClick || onMouseEnter || onMouseMove || onMouseLeave;
  const onMouseEnterHandler = onMouseEnter ? (event) => onMouseEnter(event, { ...internals.userNode }) : void 0;
  const onMouseMoveHandler = onMouseMove ? (event) => onMouseMove(event, { ...internals.userNode }) : void 0;
  const onMouseLeaveHandler = onMouseLeave ? (event) => onMouseLeave(event, { ...internals.userNode }) : void 0;
  const onContextMenuHandler = onContextMenu ? (event) => onContextMenu(event, { ...internals.userNode }) : void 0;
  const onDoubleClickHandler = onDoubleClick ? (event) => onDoubleClick(event, { ...internals.userNode }) : void 0;
  const onSelectNodeHandler = (event) => {
    const { selectNodesOnDrag, nodeDragThreshold } = store.getState();
    if (isSelectable && (!selectNodesOnDrag || !isDraggable || nodeDragThreshold > 0)) {
      handleNodeClick({
        id: id2,
        store,
        nodeRef
      });
    }
    if (onClick) {
      onClick(event, { ...internals.userNode });
    }
  };
  const onKeyDown = (event) => {
    if (isInputDOMNode(event.nativeEvent) || disableKeyboardA11y) {
      return;
    }
    if (elementSelectionKeys.includes(event.key) && isSelectable) {
      const unselect = event.key === "Escape";
      handleNodeClick({
        id: id2,
        store,
        unselect,
        nodeRef
      });
    } else if (isDraggable && node2.selected && Object.prototype.hasOwnProperty.call(arrowKeyDiffs, event.key)) {
      event.preventDefault();
      const { ariaLabelConfig } = store.getState();
      store.setState({
        ariaLiveMessage: ariaLabelConfig["node.a11yDescription.ariaLiveMessage"]({
          direction: event.key.replace("Arrow", "").toLowerCase(),
          x: ~~internals.positionAbsolute.x,
          y: ~~internals.positionAbsolute.y
        })
      });
      moveSelectedNodes({
        direction: arrowKeyDiffs[event.key],
        factor: event.shiftKey ? 4 : 1
      });
    }
  };
  const onFocus = () => {
    if (disableKeyboardA11y || !nodeRef.current?.matches(":focus-visible")) {
      return;
    }
    const { transform: transform2, width, height, autoPanOnNodeFocus, setCenter } = store.getState();
    if (!autoPanOnNodeFocus) {
      return;
    }
    const withinViewport = getNodesInside(/* @__PURE__ */ new Map([[id2, node2]]), { x: 0, y: 0, width, height }, transform2, true).length > 0;
    if (!withinViewport) {
      setCenter(node2.position.x + nodeDimensions.width / 2, node2.position.y + nodeDimensions.height / 2, {
        zoom: transform2[2]
      });
    }
  };
  return jsxRuntimeExports.jsx("div", { className: cc([
    "react-flow__node",
    `react-flow__node-${nodeType}`,
    {
      // this is overwritable by passing `nopan` as a class name
      [noPanClassName]: isDraggable
    },
    node2.className,
    {
      selected: node2.selected,
      selectable: isSelectable,
      parent: isParent,
      draggable: isDraggable,
      dragging
    }
  ]), ref: nodeRef, style: {
    zIndex: internals.z,
    transform: `translate(${internals.positionAbsolute.x}px,${internals.positionAbsolute.y}px)`,
    pointerEvents: hasPointerEvents ? "all" : "none",
    visibility: hasDimensions ? "visible" : "hidden",
    ...node2.style,
    ...inlineDimensions
  }, "data-id": id2, "data-testid": `rf__node-${id2}`, onMouseEnter: onMouseEnterHandler, onMouseMove: onMouseMoveHandler, onMouseLeave: onMouseLeaveHandler, onContextMenu: onContextMenuHandler, onClick: onSelectNodeHandler, onDoubleClick: onDoubleClickHandler, onKeyDown: isFocusable ? onKeyDown : void 0, tabIndex: isFocusable ? 0 : void 0, onFocus: isFocusable ? onFocus : void 0, role: node2.ariaRole ?? (isFocusable ? "group" : void 0), "aria-roledescription": "node", "aria-describedby": disableKeyboardA11y ? void 0 : `${ARIA_NODE_DESC_KEY}-${rfId}`, "aria-label": node2.ariaLabel, ...node2.domAttributes, children: jsxRuntimeExports.jsx(Provider, { value: id2, children: jsxRuntimeExports.jsx(NodeComponent, { id: id2, data: node2.data, type: nodeType, positionAbsoluteX: internals.positionAbsolute.x, positionAbsoluteY: internals.positionAbsolute.y, selected: node2.selected ?? false, selectable: isSelectable, draggable: isDraggable, deletable: node2.deletable ?? true, isConnectable, sourcePosition: node2.sourcePosition, targetPosition: node2.targetPosition, dragging, dragHandle: node2.dragHandle, zIndex: internals.z, parentId: node2.parentId, ...nodeDimensions }) }) });
}
var NodeWrapper$1 = reactExports.memo(NodeWrapper);
const selector$a = (s) => ({
  nodesConnectable: s.nodesConnectable,
  nodesFocusable: s.nodesFocusable,
  elementsSelectable: s.elementsSelectable,
  onError: s.onError
});
function NodeRendererComponent(props) {
  const { nodesConnectable, nodesFocusable, elementsSelectable, onError } = useStore(selector$a, shallow$1);
  const nodeIds = useVisibleNodeIds(props.onlyRenderVisibleElements);
  const resizeObserver = useResizeObserver();
  return jsxRuntimeExports.jsx("div", { className: "react-flow__nodes", style: containerStyle, children: nodeIds.map((nodeId) => {
    return (
      /*
       * The split of responsibilities between NodeRenderer and
       * NodeComponentWrapper may appear weird. However, it’s designed to
       * minimize the cost of updates when individual nodes change.
       *
       * For example, when you’re dragging a single node, that node gets
       * updated multiple times per second. If `NodeRenderer` were to update
       * every time, it would have to re-run the `nodes.map()` loop every
       * time. This gets pricey with hundreds of nodes, especially if every
       * loop cycle does more than just rendering a JSX element!
       *
       * As a result of this choice, we took the following implementation
       * decisions:
       * - NodeRenderer subscribes *only* to node IDs – and therefore
       *   rerender *only* when visible nodes are added or removed.
       * - NodeRenderer performs all operations the result of which can be
       *   shared between nodes (such as creating the `ResizeObserver`
       *   instance, or subscribing to `selector`). This means extra prop
       *   drilling into `NodeComponentWrapper`, but it means we need to run
       *   these operations only once – instead of once per node.
       * - Any operations that you’d normally write inside `nodes.map` are
       *   moved into `NodeComponentWrapper`. This ensures they are
       *   memorized – so if `NodeRenderer` *has* to rerender, it only
       *   needs to regenerate the list of nodes, nothing else.
       */
      jsxRuntimeExports.jsx(NodeWrapper$1, { id: nodeId, nodeTypes: props.nodeTypes, nodeExtent: props.nodeExtent, onClick: props.onNodeClick, onMouseEnter: props.onNodeMouseEnter, onMouseMove: props.onNodeMouseMove, onMouseLeave: props.onNodeMouseLeave, onContextMenu: props.onNodeContextMenu, onDoubleClick: props.onNodeDoubleClick, noDragClassName: props.noDragClassName, noPanClassName: props.noPanClassName, rfId: props.rfId, disableKeyboardA11y: props.disableKeyboardA11y, resizeObserver, nodesDraggable: props.nodesDraggable ?? true, nodesConnectable, nodesFocusable, elementsSelectable, nodeClickDistance: props.nodeClickDistance, onError }, nodeId)
    );
  }) });
}
NodeRendererComponent.displayName = "NodeRenderer";
const NodeRenderer = reactExports.memo(NodeRendererComponent);
function useVisibleEdgeIds(onlyRenderVisible) {
  const edgeIds = useStore(reactExports.useCallback((s) => {
    if (!onlyRenderVisible) {
      return s.edges.map((edge) => edge.id);
    }
    const visibleEdgeIds = [];
    if (s.width && s.height) {
      for (const edge of s.edges) {
        const sourceNode = s.nodeLookup.get(edge.source);
        const targetNode = s.nodeLookup.get(edge.target);
        if (sourceNode && targetNode && isEdgeVisible({
          sourceNode,
          targetNode,
          width: s.width,
          height: s.height,
          transform: s.transform
        })) {
          visibleEdgeIds.push(edge.id);
        }
      }
    }
    return visibleEdgeIds;
  }, [onlyRenderVisible]), shallow$1);
  return edgeIds;
}
const ArrowSymbol = ({ color: color2 = "none", strokeWidth = 1 }) => {
  const style2 = {
    strokeWidth,
    ...color2 && { stroke: color2 }
  };
  return jsxRuntimeExports.jsx("polyline", { className: "arrow", style: style2, strokeLinecap: "round", fill: "none", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4" });
};
const ArrowClosedSymbol = ({ color: color2 = "none", strokeWidth = 1 }) => {
  const style2 = {
    strokeWidth,
    ...color2 && { stroke: color2, fill: color2 }
  };
  return jsxRuntimeExports.jsx("polyline", { className: "arrowclosed", style: style2, strokeLinecap: "round", strokeLinejoin: "round", points: "-5,-4 0,0 -5,4 -5,-4" });
};
const MarkerSymbols = {
  [MarkerType.Arrow]: ArrowSymbol,
  [MarkerType.ArrowClosed]: ArrowClosedSymbol
};
function useMarkerSymbol(type) {
  const store = useStoreApi();
  const symbol = reactExports.useMemo(() => {
    const symbolExists = Object.prototype.hasOwnProperty.call(MarkerSymbols, type);
    if (!symbolExists) {
      store.getState().onError?.("009", errorMessages["error009"](type));
      return null;
    }
    return MarkerSymbols[type];
  }, [type]);
  return symbol;
}
const Marker = ({ id: id2, type, color: color2, width = 12.5, height = 12.5, markerUnits = "strokeWidth", strokeWidth, orient = "auto-start-reverse" }) => {
  const Symbol2 = useMarkerSymbol(type);
  if (!Symbol2) {
    return null;
  }
  return jsxRuntimeExports.jsx("marker", { className: "react-flow__arrowhead", id: id2, markerWidth: `${width}`, markerHeight: `${height}`, viewBox: "-10 -10 20 20", markerUnits, orient, refX: "0", refY: "0", children: jsxRuntimeExports.jsx(Symbol2, { color: color2, strokeWidth }) });
};
const MarkerDefinitions = ({ defaultColor, rfId }) => {
  const edges = useStore((s) => s.edges);
  const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
  const markers = reactExports.useMemo(() => {
    const markers2 = createMarkerIds(edges, {
      id: rfId,
      defaultColor,
      defaultMarkerStart: defaultEdgeOptions?.markerStart,
      defaultMarkerEnd: defaultEdgeOptions?.markerEnd
    });
    return markers2;
  }, [edges, defaultEdgeOptions, rfId, defaultColor]);
  if (!markers.length) {
    return null;
  }
  return jsxRuntimeExports.jsx("svg", { className: "react-flow__marker", "aria-hidden": "true", children: jsxRuntimeExports.jsx("defs", { children: markers.map((marker) => jsxRuntimeExports.jsx(Marker, { id: marker.id, type: marker.type, color: marker.color, width: marker.width, height: marker.height, markerUnits: marker.markerUnits, strokeWidth: marker.strokeWidth, orient: marker.orient }, marker.id)) }) });
};
MarkerDefinitions.displayName = "MarkerDefinitions";
var MarkerDefinitions$1 = reactExports.memo(MarkerDefinitions);
function EdgeTextComponent({ x, y, label, labelStyle, labelShowBg = true, labelBgStyle, labelBgPadding = [2, 4], labelBgBorderRadius = 2, children: children2, className, ...rest }) {
  const [edgeTextBbox, setEdgeTextBbox] = reactExports.useState({ x: 1, y: 0, width: 0, height: 0 });
  const edgeTextClasses = cc(["react-flow__edge-textwrapper", className]);
  const edgeTextRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (edgeTextRef.current) {
      const textBbox = edgeTextRef.current.getBBox();
      setEdgeTextBbox({
        x: textBbox.x,
        y: textBbox.y,
        width: textBbox.width,
        height: textBbox.height
      });
    }
  }, [label]);
  if (!label) {
    return null;
  }
  return jsxRuntimeExports.jsxs("g", { transform: `translate(${x - edgeTextBbox.width / 2} ${y - edgeTextBbox.height / 2})`, className: edgeTextClasses, visibility: edgeTextBbox.width ? "visible" : "hidden", ...rest, children: [labelShowBg && jsxRuntimeExports.jsx("rect", { width: edgeTextBbox.width + 2 * labelBgPadding[0], x: -labelBgPadding[0], y: -labelBgPadding[1], height: edgeTextBbox.height + 2 * labelBgPadding[1], className: "react-flow__edge-textbg", style: labelBgStyle, rx: labelBgBorderRadius, ry: labelBgBorderRadius }), jsxRuntimeExports.jsx("text", { className: "react-flow__edge-text", y: edgeTextBbox.height / 2, dy: "0.3em", ref: edgeTextRef, style: labelStyle, children: label }), children2] });
}
EdgeTextComponent.displayName = "EdgeText";
const EdgeText = reactExports.memo(EdgeTextComponent);
function BaseEdge({ path: path2, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, interactionWidth = 20, ...props }) {
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx("path", { ...props, d: path2, fill: "none", className: cc(["react-flow__edge-path", props.className]) }), interactionWidth ? jsxRuntimeExports.jsx("path", { d: path2, fill: "none", strokeOpacity: 0, strokeWidth: interactionWidth, className: "react-flow__edge-interaction" }) : null, label && isNumeric(labelX) && isNumeric(labelY) ? jsxRuntimeExports.jsx(EdgeText, { x: labelX, y: labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius }) : null] });
}
function getControl({ pos, x1, y1, x2, y2 }) {
  if (pos === Position.Left || pos === Position.Right) {
    return [0.5 * (x1 + x2), y1];
  }
  return [x1, 0.5 * (y1 + y2)];
}
function getSimpleBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top }) {
  const [sourceControlX, sourceControlY] = getControl({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY
  });
  const [targetControlX, targetControlY] = getControl({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY
  });
  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY
  });
  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY
  ];
}
function createSimpleBezierEdge(params) {
  return reactExports.memo(({ id: id2, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth }) => {
    const [path2, labelX, labelY] = getSimpleBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    });
    const _id = params.isInternal ? void 0 : id2;
    return jsxRuntimeExports.jsx(BaseEdge, { id: _id, path: path2, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
const SimpleBezierEdge = createSimpleBezierEdge({ isInternal: false });
const SimpleBezierEdgeInternal = createSimpleBezierEdge({ isInternal: true });
SimpleBezierEdge.displayName = "SimpleBezierEdge";
SimpleBezierEdgeInternal.displayName = "SimpleBezierEdgeInternal";
function createSmoothStepEdge(params) {
  return reactExports.memo(({ id: id2, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, sourcePosition = Position.Bottom, targetPosition = Position.Top, markerEnd, markerStart, pathOptions, interactionWidth }) => {
    const [path2, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: pathOptions?.borderRadius,
      offset: pathOptions?.offset,
      stepPosition: pathOptions?.stepPosition
    });
    const _id = params.isInternal ? void 0 : id2;
    return jsxRuntimeExports.jsx(BaseEdge, { id: _id, path: path2, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
const SmoothStepEdge = createSmoothStepEdge({ isInternal: false });
const SmoothStepEdgeInternal = createSmoothStepEdge({ isInternal: true });
SmoothStepEdge.displayName = "SmoothStepEdge";
SmoothStepEdgeInternal.displayName = "SmoothStepEdgeInternal";
function createStepEdge(params) {
  return reactExports.memo(({ id: id2, ...props }) => {
    const _id = params.isInternal ? void 0 : id2;
    return jsxRuntimeExports.jsx(SmoothStepEdge, { ...props, id: _id, pathOptions: reactExports.useMemo(() => ({ borderRadius: 0, offset: props.pathOptions?.offset }), [props.pathOptions?.offset]) });
  });
}
const StepEdge = createStepEdge({ isInternal: false });
const StepEdgeInternal = createStepEdge({ isInternal: true });
StepEdge.displayName = "StepEdge";
StepEdgeInternal.displayName = "StepEdgeInternal";
function createStraightEdge(params) {
  return reactExports.memo(({ id: id2, sourceX, sourceY, targetX, targetY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth }) => {
    const [path2, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    const _id = params.isInternal ? void 0 : id2;
    return jsxRuntimeExports.jsx(BaseEdge, { id: _id, path: path2, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
const StraightEdge = createStraightEdge({ isInternal: false });
const StraightEdgeInternal = createStraightEdge({ isInternal: true });
StraightEdge.displayName = "StraightEdge";
StraightEdgeInternal.displayName = "StraightEdgeInternal";
function createBezierEdge(params) {
  return reactExports.memo(({ id: id2, sourceX, sourceY, targetX, targetY, sourcePosition = Position.Bottom, targetPosition = Position.Top, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, pathOptions, interactionWidth }) => {
    const [path2, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: pathOptions?.curvature
    });
    const _id = params.isInternal ? void 0 : id2;
    return jsxRuntimeExports.jsx(BaseEdge, { id: _id, path: path2, labelX, labelY, label, labelStyle, labelShowBg, labelBgStyle, labelBgPadding, labelBgBorderRadius, style: style2, markerEnd, markerStart, interactionWidth });
  });
}
const BezierEdge = createBezierEdge({ isInternal: false });
const BezierEdgeInternal = createBezierEdge({ isInternal: true });
BezierEdge.displayName = "BezierEdge";
BezierEdgeInternal.displayName = "BezierEdgeInternal";
const builtinEdgeTypes = {
  default: BezierEdgeInternal,
  straight: StraightEdgeInternal,
  step: StepEdgeInternal,
  smoothstep: SmoothStepEdgeInternal,
  simplebezier: SimpleBezierEdgeInternal
};
const nullPosition = {
  sourceX: null,
  sourceY: null,
  targetX: null,
  targetY: null,
  sourcePosition: null,
  targetPosition: null,
  zIndex: void 0
};
const shiftX = (x, shift, position2) => {
  if (position2 === Position.Left)
    return x - shift;
  if (position2 === Position.Right)
    return x + shift;
  return x;
};
const shiftY = (y, shift, position2) => {
  if (position2 === Position.Top)
    return y - shift;
  if (position2 === Position.Bottom)
    return y + shift;
  return y;
};
const EdgeUpdaterClassName = "react-flow__edgeupdater";
function EdgeAnchor({ position: position2, centerX, centerY, radius = 10, onMouseDown, onMouseEnter, onMouseOut, type }) {
  return jsxRuntimeExports.jsx("circle", { onMouseDown, onMouseEnter, onMouseOut, className: cc([EdgeUpdaterClassName, `${EdgeUpdaterClassName}-${type}`]), cx: shiftX(centerX, radius, position2), cy: shiftY(centerY, radius, position2), r: radius, stroke: "transparent", fill: "transparent" });
}
function EdgeUpdateAnchors({ isReconnectable, reconnectRadius, edge, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, onReconnect, onReconnectStart, onReconnectEnd, setReconnecting, setUpdateHover }) {
  const store = useStoreApi();
  const handleEdgeUpdater = (event, oppositeHandle) => {
    if (event.button !== 0) {
      return;
    }
    const { autoPanOnConnect, domNode, connectionMode, connectionRadius, lib, onConnectStart, cancelConnection, nodeLookup, rfId: flowId, panBy: panBy2, updateConnection } = store.getState();
    const isTarget = oppositeHandle.type === "target";
    const _onReconnectEnd = (evt, connectionState) => {
      setReconnecting(false);
      onReconnectEnd?.(evt, edge, oppositeHandle.type, connectionState);
    };
    const onConnectEdge = (connection) => onReconnect?.(edge, connection);
    const _onConnectStart = (_event, params) => {
      setReconnecting(true);
      onReconnectStart?.(event, edge, oppositeHandle.type);
      onConnectStart?.(_event, params);
    };
    XYHandle.onPointerDown(event.nativeEvent, {
      autoPanOnConnect,
      connectionMode,
      connectionRadius,
      domNode,
      handleId: oppositeHandle.id,
      nodeId: oppositeHandle.nodeId,
      nodeLookup,
      isTarget,
      edgeUpdaterType: oppositeHandle.type,
      lib,
      flowId,
      cancelConnection,
      panBy: panBy2,
      isValidConnection: (...args) => store.getState().isValidConnection?.(...args) ?? true,
      onConnect: onConnectEdge,
      onConnectStart: _onConnectStart,
      onConnectEnd: (...args) => store.getState().onConnectEnd?.(...args),
      onReconnectEnd: _onReconnectEnd,
      updateConnection,
      getTransform: () => store.getState().transform,
      getFromHandle: () => store.getState().connection.fromHandle,
      dragThreshold: store.getState().connectionDragThreshold,
      handleDomNode: event.currentTarget
    });
  };
  const onReconnectSourceMouseDown = (event) => handleEdgeUpdater(event, { nodeId: edge.target, id: edge.targetHandle ?? null, type: "target" });
  const onReconnectTargetMouseDown = (event) => handleEdgeUpdater(event, { nodeId: edge.source, id: edge.sourceHandle ?? null, type: "source" });
  const onReconnectMouseEnter = () => setUpdateHover(true);
  const onReconnectMouseOut = () => setUpdateHover(false);
  return jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [(isReconnectable === true || isReconnectable === "source") && jsxRuntimeExports.jsx(EdgeAnchor, { position: sourcePosition, centerX: sourceX, centerY: sourceY, radius: reconnectRadius, onMouseDown: onReconnectSourceMouseDown, onMouseEnter: onReconnectMouseEnter, onMouseOut: onReconnectMouseOut, type: "source" }), (isReconnectable === true || isReconnectable === "target") && jsxRuntimeExports.jsx(EdgeAnchor, { position: targetPosition, centerX: targetX, centerY: targetY, radius: reconnectRadius, onMouseDown: onReconnectTargetMouseDown, onMouseEnter: onReconnectMouseEnter, onMouseOut: onReconnectMouseOut, type: "target" })] });
}
function EdgeWrapper({ id: id2, edgesFocusable, edgesReconnectable, elementsSelectable, onClick, onDoubleClick, onContextMenu, onMouseEnter, onMouseMove, onMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, rfId, edgeTypes: edgeTypes2, noPanClassName, onError, disableKeyboardA11y }) {
  let edge = useStore((s) => s.edgeLookup.get(id2));
  const defaultEdgeOptions = useStore((s) => s.defaultEdgeOptions);
  edge = defaultEdgeOptions ? { ...defaultEdgeOptions, ...edge } : edge;
  let edgeType = edge.type || "default";
  let EdgeComponent = edgeTypes2?.[edgeType] || builtinEdgeTypes[edgeType];
  if (EdgeComponent === void 0) {
    onError?.("011", errorMessages["error011"](edgeType));
    edgeType = "default";
    EdgeComponent = edgeTypes2?.["default"] || builtinEdgeTypes.default;
  }
  const isFocusable = !!(edge.focusable || edgesFocusable && typeof edge.focusable === "undefined");
  const isReconnectable = typeof onReconnect !== "undefined" && (edge.reconnectable || edgesReconnectable && typeof edge.reconnectable === "undefined");
  const isSelectable = !!(edge.selectable || elementsSelectable && typeof edge.selectable === "undefined");
  const edgeRef = reactExports.useRef(null);
  const [updateHover, setUpdateHover] = reactExports.useState(false);
  const [reconnecting, setReconnecting] = reactExports.useState(false);
  const store = useStoreApi();
  const { zIndex = edge.zIndex, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = useStore(reactExports.useCallback((store2) => {
    const sourceNode = store2.nodeLookup.get(edge.source);
    const targetNode = store2.nodeLookup.get(edge.target);
    if (!sourceNode || !targetNode) {
      return nullPosition;
    }
    const edgePosition = getEdgePosition({
      id: id2,
      sourceNode,
      targetNode,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode: store2.connectionMode,
      onError
    });
    const zIndex2 = getElevatedEdgeZIndex({
      selected: edge.selected,
      zIndex: edge.zIndex,
      sourceNode,
      targetNode,
      elevateOnSelect: store2.elevateEdgesOnSelect,
      zIndexMode: store2.zIndexMode
    });
    return {
      ...edgePosition || nullPosition,
      zIndex: zIndex2
    };
  }, [edge.source, edge.target, edge.sourceHandle, edge.targetHandle, edge.selected, edge.zIndex, onError]), shallow$1);
  const markerStartUrl = reactExports.useMemo(() => edge.markerStart ? `url('#${getMarkerId(edge.markerStart, rfId)}')` : void 0, [edge.markerStart, rfId]);
  const markerEndUrl = reactExports.useMemo(() => edge.markerEnd ? `url('#${getMarkerId(edge.markerEnd, rfId)}')` : void 0, [edge.markerEnd, rfId]);
  if (edge.hidden || sourceX === null || sourceY === null || targetX === null || targetY === null) {
    return null;
  }
  const onEdgeClick = (event) => {
    const { addSelectedEdges, unselectNodesAndEdges, multiSelectionActive } = store.getState();
    if (isSelectable) {
      store.setState({ nodesSelectionActive: false });
      if (edge.selected && multiSelectionActive) {
        unselectNodesAndEdges({ nodes: [], edges: [edge] });
        edgeRef.current?.blur();
      } else {
        addSelectedEdges([id2]);
      }
    }
    if (onClick) {
      onClick(event, edge);
    }
  };
  const onEdgeDoubleClick = onDoubleClick ? (event) => {
    onDoubleClick(event, { ...edge });
  } : void 0;
  const onEdgeContextMenu = onContextMenu ? (event) => {
    onContextMenu(event, { ...edge });
  } : void 0;
  const onEdgeMouseEnter = onMouseEnter ? (event) => {
    onMouseEnter(event, { ...edge });
  } : void 0;
  const onEdgeMouseMove = onMouseMove ? (event) => {
    onMouseMove(event, { ...edge });
  } : void 0;
  const onEdgeMouseLeave = onMouseLeave ? (event) => {
    onMouseLeave(event, { ...edge });
  } : void 0;
  const onKeyDown = (event) => {
    if (!disableKeyboardA11y && elementSelectionKeys.includes(event.key) && isSelectable) {
      const { unselectNodesAndEdges, addSelectedEdges } = store.getState();
      const unselect = event.key === "Escape";
      if (unselect) {
        edgeRef.current?.blur();
        unselectNodesAndEdges({ edges: [edge] });
      } else {
        addSelectedEdges([id2]);
      }
    }
  };
  return jsxRuntimeExports.jsx("svg", { style: { zIndex }, children: jsxRuntimeExports.jsxs("g", { className: cc([
    "react-flow__edge",
    `react-flow__edge-${edgeType}`,
    edge.className,
    noPanClassName,
    {
      selected: edge.selected,
      animated: edge.animated,
      inactive: !isSelectable && !onClick,
      updating: updateHover,
      selectable: isSelectable
    }
  ]), onClick: onEdgeClick, onDoubleClick: onEdgeDoubleClick, onContextMenu: onEdgeContextMenu, onMouseEnter: onEdgeMouseEnter, onMouseMove: onEdgeMouseMove, onMouseLeave: onEdgeMouseLeave, onKeyDown: isFocusable ? onKeyDown : void 0, tabIndex: isFocusable ? 0 : void 0, role: edge.ariaRole ?? (isFocusable ? "group" : "img"), "aria-roledescription": "edge", "data-id": id2, "data-testid": `rf__edge-${id2}`, "aria-label": edge.ariaLabel === null ? void 0 : edge.ariaLabel || `Edge from ${edge.source} to ${edge.target}`, "aria-describedby": isFocusable ? `${ARIA_EDGE_DESC_KEY}-${rfId}` : void 0, ref: edgeRef, ...edge.domAttributes, children: [!reconnecting && jsxRuntimeExports.jsx(EdgeComponent, { id: id2, source: edge.source, target: edge.target, type: edge.type, selected: edge.selected, animated: edge.animated, selectable: isSelectable, deletable: edge.deletable ?? true, label: edge.label, labelStyle: edge.labelStyle, labelShowBg: edge.labelShowBg, labelBgStyle: edge.labelBgStyle, labelBgPadding: edge.labelBgPadding, labelBgBorderRadius: edge.labelBgBorderRadius, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data: edge.data, style: edge.style, sourceHandleId: edge.sourceHandle, targetHandleId: edge.targetHandle, markerStart: markerStartUrl, markerEnd: markerEndUrl, pathOptions: "pathOptions" in edge ? edge.pathOptions : void 0, interactionWidth: edge.interactionWidth }), isReconnectable && jsxRuntimeExports.jsx(EdgeUpdateAnchors, { edge, isReconnectable, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, setUpdateHover, setReconnecting })] }) });
}
var EdgeWrapper$1 = reactExports.memo(EdgeWrapper);
const selector$9 = (s) => ({
  edgesFocusable: s.edgesFocusable,
  edgesReconnectable: s.edgesReconnectable,
  elementsSelectable: s.elementsSelectable,
  connectionMode: s.connectionMode,
  onError: s.onError
});
function EdgeRendererComponent({ defaultMarkerColor, onlyRenderVisibleElements, rfId, edgeTypes: edgeTypes2, noPanClassName, onReconnect, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, onEdgeClick, reconnectRadius, onEdgeDoubleClick, onReconnectStart, onReconnectEnd, disableKeyboardA11y }) {
  const { edgesFocusable, edgesReconnectable, elementsSelectable, onError } = useStore(selector$9, shallow$1);
  const edgeIds = useVisibleEdgeIds(onlyRenderVisibleElements);
  return jsxRuntimeExports.jsxs("div", { className: "react-flow__edges", children: [jsxRuntimeExports.jsx(MarkerDefinitions$1, { defaultColor: defaultMarkerColor, rfId }), edgeIds.map((id2) => {
    return jsxRuntimeExports.jsx(EdgeWrapper$1, { id: id2, edgesFocusable, edgesReconnectable, elementsSelectable, noPanClassName, onReconnect, onContextMenu: onEdgeContextMenu, onMouseEnter: onEdgeMouseEnter, onMouseMove: onEdgeMouseMove, onMouseLeave: onEdgeMouseLeave, onClick: onEdgeClick, reconnectRadius, onDoubleClick: onEdgeDoubleClick, onReconnectStart, onReconnectEnd, rfId, onError, edgeTypes: edgeTypes2, disableKeyboardA11y }, id2);
  })] });
}
EdgeRendererComponent.displayName = "EdgeRenderer";
const EdgeRenderer = reactExports.memo(EdgeRendererComponent);
const toTransformString = (transform2) => `translate(${transform2[0]}px,${transform2[1]}px) scale(${transform2[2]})`;
function Viewport({ children: children2 }) {
  const store = useStoreApi();
  const viewportRef = reactExports.useRef(null);
  const [initialTransform] = reactExports.useState(() => store.getState().transform);
  useIsomorphicLayoutEffect(() => {
    let prevTransform = null;
    const applyTransform = () => {
      const transform2 = store.getState().transform;
      if (prevTransform && transform2[0] === prevTransform[0] && transform2[1] === prevTransform[1] && transform2[2] === prevTransform[2]) {
        return;
      }
      prevTransform = transform2;
      if (viewportRef.current) {
        viewportRef.current.style.transform = toTransformString(transform2);
      }
    };
    applyTransform();
    return store.subscribe(applyTransform);
  }, [store]);
  return jsxRuntimeExports.jsx("div", { ref: viewportRef, className: "react-flow__viewport xyflow__viewport react-flow__container", style: { transform: toTransformString(initialTransform) }, children: children2 });
}
function useOnInitHandler(onInit) {
  const rfInstance = useReactFlow();
  const isInitialized = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!isInitialized.current && rfInstance.viewportInitialized && onInit) {
      setTimeout(() => onInit(rfInstance), 1);
      isInitialized.current = true;
    }
  }, [onInit, rfInstance.viewportInitialized]);
}
const selector$8 = (state) => state.panZoom?.syncViewport;
function useViewportSync(viewport) {
  const syncViewport = useStore(selector$8);
  const store = useStoreApi();
  reactExports.useEffect(() => {
    if (viewport) {
      syncViewport?.(viewport);
      store.setState({ transform: [viewport.x, viewport.y, viewport.zoom] });
    }
  }, [viewport, syncViewport]);
  return null;
}
function storeSelector$1(s) {
  return s.connection.inProgress ? { ...s.connection, to: pointToRendererPoint(s.connection.to, s.transform) } : { ...s.connection };
}
function getSelector(connectionSelector) {
  return storeSelector$1;
}
function useConnection(connectionSelector) {
  const combinedSelector = getSelector();
  return useStore(combinedSelector, shallow$1);
}
const selector$7 = (s) => ({
  nodesConnectable: s.nodesConnectable,
  isValid: s.connection.isValid,
  inProgress: s.connection.inProgress,
  width: s.width,
  height: s.height
});
function ConnectionLineWrapper({ containerStyle: containerStyle2, style: style2, type, component }) {
  const { nodesConnectable, width, height, isValid, inProgress } = useStore(selector$7, shallow$1);
  const renderConnection = !!(width && nodesConnectable && inProgress);
  if (!renderConnection) {
    return null;
  }
  return jsxRuntimeExports.jsx("svg", { style: containerStyle2, width, height, className: "react-flow__connectionline react-flow__container", children: jsxRuntimeExports.jsx("g", { className: cc(["react-flow__connection", getConnectionStatus(isValid)]), children: jsxRuntimeExports.jsx(ConnectionLine, { style: style2, type, CustomComponent: component, isValid }) }) });
}
const ConnectionLine = ({ style: style2, type = ConnectionLineType.Bezier, CustomComponent, isValid }) => {
  const { inProgress, from, fromNode, fromHandle, fromPosition, to, toNode, toHandle, toPosition, pointer: pointer2 } = useConnection();
  if (!inProgress) {
    return;
  }
  if (CustomComponent) {
    return jsxRuntimeExports.jsx(CustomComponent, { connectionLineType: type, connectionLineStyle: style2, fromNode, fromHandle, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, fromPosition, toPosition, connectionStatus: getConnectionStatus(isValid), toNode, toHandle, pointer: pointer2 });
  }
  let path2 = "";
  const pathParams = {
    sourceX: from.x,
    sourceY: from.y,
    sourcePosition: fromPosition,
    targetX: to.x,
    targetY: to.y,
    targetPosition: toPosition
  };
  switch (type) {
    case ConnectionLineType.Bezier:
      [path2] = getBezierPath(pathParams);
      break;
    case ConnectionLineType.SimpleBezier:
      [path2] = getSimpleBezierPath(pathParams);
      break;
    case ConnectionLineType.Step:
      [path2] = getSmoothStepPath({
        ...pathParams,
        borderRadius: 0
      });
      break;
    case ConnectionLineType.SmoothStep:
      [path2] = getSmoothStepPath(pathParams);
      break;
    default:
      [path2] = getStraightPath(pathParams);
  }
  return jsxRuntimeExports.jsx("path", { d: path2, fill: "none", className: "react-flow__connection-path", style: style2 });
};
ConnectionLine.displayName = "ConnectionLine";
const emptyTypes = {};
function useNodeOrEdgeTypesWarning(nodeOrEdgeTypes = emptyTypes) {
  reactExports.useRef(nodeOrEdgeTypes);
  useStoreApi();
  reactExports.useEffect(() => {
  }, [nodeOrEdgeTypes]);
}
function useStylesLoadedWarning() {
  useStoreApi();
  reactExports.useRef(false);
  reactExports.useEffect(() => {
  }, []);
}
function GraphViewComponent({ nodeTypes: nodeTypes2, edgeTypes: edgeTypes2, onInit, onNodeClick, onEdgeClick, onNodeDoubleClick, onEdgeDoubleClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onSelectionContextMenu, onSelectionStart, onSelectionEnd, connectionLineType, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, selectionKeyCode, selectionOnDrag, selectionMode, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, deleteKeyCode, onlyRenderVisibleElements, elementsSelectable, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, preventScrolling, defaultMarkerColor, zoomOnScroll, zoomOnPinch, panOnScroll, panOnScrollSpeed, panOnScrollMode, zoomOnDoubleClick, panOnDrag, autoPanOnSelection, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance, nodeClickDistance, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, onReconnect, onReconnectStart, onReconnectEnd, noDragClassName, noWheelClassName, noPanClassName, disableKeyboardA11y, nodeExtent, rfId, viewport, onViewportChange, nodesDraggable }) {
  useNodeOrEdgeTypesWarning(nodeTypes2);
  useNodeOrEdgeTypesWarning(edgeTypes2);
  useStylesLoadedWarning();
  useOnInitHandler(onInit);
  useViewportSync(viewport);
  return jsxRuntimeExports.jsx(FlowRenderer, { onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneContextMenu, onPaneScroll, paneClickDistance, deleteKeyCode, selectionKeyCode, selectionOnDrag, selectionMode, onSelectionStart, onSelectionEnd, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, elementsSelectable, zoomOnScroll, zoomOnPinch, zoomOnDoubleClick, panOnScroll, panOnScrollSpeed, panOnScrollMode, panOnDrag, autoPanOnSelection, defaultViewport: defaultViewport2, translateExtent, minZoom, maxZoom, onSelectionContextMenu, preventScrolling, noDragClassName, noWheelClassName, noPanClassName, disableKeyboardA11y, onViewportChange, isControlledViewport: !!viewport, children: jsxRuntimeExports.jsxs(Viewport, { children: [jsxRuntimeExports.jsx(EdgeRenderer, { edgeTypes: edgeTypes2, onEdgeClick, onEdgeDoubleClick, onReconnect, onReconnectStart, onReconnectEnd, onlyRenderVisibleElements, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, defaultMarkerColor, noPanClassName, disableKeyboardA11y, rfId }), jsxRuntimeExports.jsx(ConnectionLineWrapper, { style: connectionLineStyle, type: connectionLineType, component: connectionLineComponent, containerStyle: connectionLineContainerStyle }), jsxRuntimeExports.jsx("div", { className: "react-flow__edgelabel-renderer" }), jsxRuntimeExports.jsx(NodeRenderer, { nodeTypes: nodeTypes2, onNodeClick, onNodeDoubleClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, nodeClickDistance, onlyRenderVisibleElements, noPanClassName, noDragClassName, disableKeyboardA11y, nodeExtent, rfId, nodesDraggable }), jsxRuntimeExports.jsx("div", { className: "react-flow__viewport-portal" })] }) });
}
GraphViewComponent.displayName = "GraphView";
const GraphView = reactExports.memo(GraphViewComponent);
const devWarn = createDevWarn();
const getInitialState = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom = 0.5, maxZoom = 2, nodeOrigin, nodeExtent, zIndexMode = "basic" } = {}) => {
  const nodeLookup = /* @__PURE__ */ new Map();
  const parentLookup = /* @__PURE__ */ new Map();
  const connectionLookup = /* @__PURE__ */ new Map();
  const edgeLookup = /* @__PURE__ */ new Map();
  const storeEdges = defaultEdges ?? edges ?? [];
  const storeNodes = defaultNodes ?? nodes ?? [];
  const storeNodeOrigin = nodeOrigin ?? [0, 0];
  const storeNodeExtent = nodeExtent ?? infiniteExtent;
  updateConnectionLookup(connectionLookup, edgeLookup, storeEdges);
  const { nodesInitialized } = adoptUserNodes(storeNodes, nodeLookup, parentLookup, {
    nodeOrigin: storeNodeOrigin,
    nodeExtent: storeNodeExtent,
    zIndexMode
  });
  let transform2 = [0, 0, 1];
  if (fitView && width && height) {
    const bounds = getInternalNodesBounds(nodeLookup, {
      filter: (node2) => !!((node2.width || node2.initialWidth) && (node2.height || node2.initialHeight))
    });
    const { x, y, zoom: zoom2 } = getViewportForBounds(bounds, width, height, minZoom, maxZoom, fitViewOptions?.padding ?? 0.1);
    transform2 = [x, y, zoom2];
  }
  return {
    rfId: "1",
    width: width ?? 0,
    height: height ?? 0,
    transform: transform2,
    nodes: storeNodes,
    nodesInitialized,
    nodeLookup,
    parentLookup,
    edges: storeEdges,
    edgeLookup,
    connectionLookup,
    onNodesChange: null,
    onEdgesChange: null,
    hasDefaultNodes: defaultNodes !== void 0,
    hasDefaultEdges: defaultEdges !== void 0,
    panZoom: null,
    minZoom,
    maxZoom,
    translateExtent: infiniteExtent,
    nodeExtent: storeNodeExtent,
    nodesSelectionActive: false,
    userSelectionActive: false,
    userSelectionRect: null,
    connectionMode: ConnectionMode.Strict,
    domNode: null,
    paneDragging: false,
    noPanClassName: "nopan",
    nodeOrigin: storeNodeOrigin,
    nodeDragThreshold: 1,
    connectionDragThreshold: 1,
    snapGrid: [15, 15],
    snapToGrid: false,
    nodesDraggable: true,
    nodesConnectable: true,
    nodesFocusable: true,
    edgesFocusable: true,
    edgesReconnectable: true,
    elementsSelectable: true,
    elevateNodesOnSelect: true,
    elevateEdgesOnSelect: true,
    selectNodesOnDrag: true,
    multiSelectionActive: false,
    fitViewQueued: fitView ?? false,
    fitViewOptions,
    fitViewResolver: null,
    connection: { ...initialConnection },
    connectionClickStartHandle: null,
    connectOnClick: true,
    ariaLiveMessage: "",
    autoPanOnConnect: true,
    autoPanOnNodeDrag: true,
    autoPanOnNodeFocus: true,
    autoPanSpeed: 15,
    connectionRadius: 20,
    onError: devWarn,
    isValidConnection: void 0,
    onSelectionChangeHandlers: [],
    lib: "react",
    debug: false,
    ariaLabelConfig: defaultAriaLabelConfig,
    zIndexMode,
    onNodesChangeMiddlewareMap: /* @__PURE__ */ new Map(),
    onEdgesChangeMiddlewareMap: /* @__PURE__ */ new Map()
  };
};
const createStore = ({ nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) => createWithEqualityFn((set2, get2) => {
  async function resolveFitView() {
    const { nodeLookup, panZoom, fitViewOptions: fitViewOptions2, fitViewResolver, width: width2, height: height2, minZoom: minZoom2, maxZoom: maxZoom2 } = get2();
    if (!panZoom) {
      return;
    }
    await fitViewport({
      nodes: nodeLookup,
      width: width2,
      height: height2,
      panZoom,
      minZoom: minZoom2,
      maxZoom: maxZoom2
    }, fitViewOptions2);
    fitViewResolver?.resolve(true);
    set2({ fitViewResolver: null });
  }
  return {
    ...getInitialState({
      nodes,
      edges,
      width,
      height,
      fitView,
      fitViewOptions,
      minZoom,
      maxZoom,
      nodeOrigin,
      nodeExtent,
      defaultNodes,
      defaultEdges,
      zIndexMode
    }),
    setNodes: (nodes2) => {
      const { nodeLookup, parentLookup, nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, elevateNodesOnSelect, fitViewQueued, zIndexMode: zIndexMode2, nodesSelectionActive } = get2();
      const { nodesInitialized, hasSelectedNodes } = adoptUserNodes(nodes2, nodeLookup, parentLookup, {
        nodeOrigin: nodeOrigin2,
        nodeExtent: nodeExtent2,
        elevateNodesOnSelect,
        checkEquality: true,
        zIndexMode: zIndexMode2
      });
      const nextNodesSelectionActive = nodesSelectionActive && hasSelectedNodes;
      if (fitViewQueued && nodesInitialized) {
        resolveFitView();
        set2({
          nodes: nodes2,
          nodesInitialized,
          fitViewQueued: false,
          fitViewOptions: void 0,
          nodesSelectionActive: nextNodesSelectionActive
        });
      } else {
        set2({ nodes: nodes2, nodesInitialized, nodesSelectionActive: nextNodesSelectionActive });
      }
    },
    setEdges: (edges2) => {
      const { connectionLookup, edgeLookup } = get2();
      updateConnectionLookup(connectionLookup, edgeLookup, edges2);
      set2({ edges: edges2 });
    },
    setDefaultNodesAndEdges: (nodes2, edges2) => {
      if (nodes2) {
        const { setNodes } = get2();
        setNodes(nodes2);
        set2({ hasDefaultNodes: true });
      }
      if (edges2) {
        const { setEdges } = get2();
        setEdges(edges2);
        set2({ hasDefaultEdges: true });
      }
    },
    /*
     * Every node gets registered at a ResizeObserver. Whenever a node
     * changes its dimensions, this function is called to measure the
     * new dimensions and update the nodes.
     */
    updateNodeInternals: (updates) => {
      const { triggerNodeChanges, nodeLookup, parentLookup, domNode, nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, debug, fitViewQueued, zIndexMode: zIndexMode2 } = get2();
      const { changes, updatedInternals } = updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin2, nodeExtent2, zIndexMode2);
      if (!updatedInternals) {
        return;
      }
      updateAbsolutePositions(nodeLookup, parentLookup, { nodeOrigin: nodeOrigin2, nodeExtent: nodeExtent2, zIndexMode: zIndexMode2 });
      if (fitViewQueued) {
        resolveFitView();
        set2({ fitViewQueued: false, fitViewOptions: void 0 });
      } else {
        set2({});
      }
      if (changes?.length > 0) {
        if (debug) {
          console.log("React Flow: trigger node changes", changes);
        }
        triggerNodeChanges?.(changes);
      }
    },
    updateNodePositions: (nodeDragItems, dragging = false) => {
      const parentExpandChildren = [];
      let changes = [];
      const { nodeLookup, triggerNodeChanges, connection, updateConnection, onNodesChangeMiddlewareMap } = get2();
      for (const [id2, dragItem] of nodeDragItems) {
        const node2 = nodeLookup.get(id2);
        const expandParent = !!(node2?.expandParent && node2?.parentId && dragItem?.position);
        const change = {
          id: id2,
          type: "position",
          position: expandParent ? {
            x: Math.max(0, dragItem.position.x),
            y: Math.max(0, dragItem.position.y)
          } : dragItem.position,
          dragging
        };
        if (node2 && connection.inProgress && connection.fromNode.id === node2.id) {
          const updatedFrom = getHandlePosition(node2, connection.fromHandle, Position.Left, true);
          updateConnection({ ...connection, from: updatedFrom });
        }
        if (expandParent && node2.parentId) {
          parentExpandChildren.push({
            id: id2,
            parentId: node2.parentId,
            rect: {
              ...dragItem.internals.positionAbsolute,
              width: dragItem.measured.width ?? 0,
              height: dragItem.measured.height ?? 0
            }
          });
        }
        changes.push(change);
      }
      if (parentExpandChildren.length > 0) {
        const { parentLookup, nodeOrigin: nodeOrigin2 } = get2();
        const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin2);
        changes.push(...parentExpandChanges);
      }
      for (const middleware of onNodesChangeMiddlewareMap.values()) {
        changes = middleware(changes);
      }
      triggerNodeChanges(changes);
    },
    triggerNodeChanges: (changes) => {
      const { onNodesChange, setNodes, nodes: nodes2, hasDefaultNodes, debug } = get2();
      if (changes?.length) {
        if (hasDefaultNodes) {
          const updatedNodes = applyNodeChanges(changes, nodes2);
          setNodes(updatedNodes);
        }
        if (debug) {
          console.log("React Flow: trigger node changes", changes);
        }
        onNodesChange?.(changes);
      }
    },
    triggerEdgeChanges: (changes) => {
      const { onEdgesChange, setEdges, edges: edges2, hasDefaultEdges, debug } = get2();
      if (changes?.length) {
        if (hasDefaultEdges) {
          const updatedEdges = applyEdgeChanges(changes, edges2);
          setEdges(updatedEdges);
        }
        if (debug) {
          console.log("React Flow: trigger edge changes", changes);
        }
        onEdgesChange?.(changes);
      }
    },
    addSelectedNodes: (selectedNodeIds) => {
      const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get2();
      if (multiSelectionActive) {
        const nodeChanges = selectedNodeIds.map((nodeId) => createSelectionChange(nodeId, true));
        triggerNodeChanges(nodeChanges);
        return;
      }
      triggerNodeChanges(getSelectionChanges(nodeLookup, /* @__PURE__ */ new Set([...selectedNodeIds]), true));
      triggerEdgeChanges(getSelectionChanges(edgeLookup));
    },
    addSelectedEdges: (selectedEdgeIds) => {
      const { multiSelectionActive, edgeLookup, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get2();
      if (multiSelectionActive) {
        const changedEdges = selectedEdgeIds.map((edgeId) => createSelectionChange(edgeId, true));
        triggerEdgeChanges(changedEdges);
        return;
      }
      triggerEdgeChanges(getSelectionChanges(edgeLookup, /* @__PURE__ */ new Set([...selectedEdgeIds])));
      triggerNodeChanges(getSelectionChanges(nodeLookup, /* @__PURE__ */ new Set(), true));
    },
    unselectNodesAndEdges: ({ nodes: nodes2, edges: edges2 } = {}) => {
      const { edges: storeEdges, nodes: storeNodes, nodeLookup, triggerNodeChanges, triggerEdgeChanges } = get2();
      const nodesToUnselect = nodes2 ? nodes2 : storeNodes;
      const edgesToUnselect = edges2 ? edges2 : storeEdges;
      const nodeChanges = [];
      for (const node2 of nodesToUnselect) {
        if (!node2.selected) {
          continue;
        }
        const internalNode = nodeLookup.get(node2.id);
        if (internalNode) {
          internalNode.selected = false;
        }
        nodeChanges.push(createSelectionChange(node2.id, false));
      }
      const edgeChanges = [];
      for (const edge of edgesToUnselect) {
        if (!edge.selected) {
          continue;
        }
        edgeChanges.push(createSelectionChange(edge.id, false));
      }
      triggerNodeChanges(nodeChanges);
      triggerEdgeChanges(edgeChanges);
    },
    setMinZoom: (minZoom2) => {
      const { panZoom, maxZoom: maxZoom2 } = get2();
      panZoom?.setScaleExtent([minZoom2, maxZoom2]);
      set2({ minZoom: minZoom2 });
    },
    setMaxZoom: (maxZoom2) => {
      const { panZoom, minZoom: minZoom2 } = get2();
      panZoom?.setScaleExtent([minZoom2, maxZoom2]);
      set2({ maxZoom: maxZoom2 });
    },
    setTranslateExtent: (translateExtent) => {
      get2().panZoom?.setTranslateExtent(translateExtent);
      set2({ translateExtent });
    },
    resetSelectedElements: () => {
      const { edges: edges2, nodes: nodes2, triggerNodeChanges, triggerEdgeChanges, elementsSelectable } = get2();
      if (!elementsSelectable) {
        return;
      }
      const nodeChanges = nodes2.reduce((res, node2) => node2.selected ? [...res, createSelectionChange(node2.id, false)] : res, []);
      const edgeChanges = edges2.reduce((res, edge) => edge.selected ? [...res, createSelectionChange(edge.id, false)] : res, []);
      triggerNodeChanges(nodeChanges);
      triggerEdgeChanges(edgeChanges);
    },
    setNodeExtent: (nextNodeExtent) => {
      const { nodes: nodes2, nodeLookup, parentLookup, nodeOrigin: nodeOrigin2, elevateNodesOnSelect, nodeExtent: nodeExtent2, zIndexMode: zIndexMode2 } = get2();
      if (nextNodeExtent[0][0] === nodeExtent2[0][0] && nextNodeExtent[0][1] === nodeExtent2[0][1] && nextNodeExtent[1][0] === nodeExtent2[1][0] && nextNodeExtent[1][1] === nodeExtent2[1][1]) {
        return;
      }
      adoptUserNodes(nodes2, nodeLookup, parentLookup, {
        nodeOrigin: nodeOrigin2,
        nodeExtent: nextNodeExtent,
        elevateNodesOnSelect,
        checkEquality: false,
        zIndexMode: zIndexMode2
      });
      set2({ nodeExtent: nextNodeExtent });
    },
    panBy: (delta) => {
      const { transform: transform2, width: width2, height: height2, panZoom, translateExtent } = get2();
      return panBy({ delta, panZoom, transform: transform2, translateExtent, width: width2, height: height2 });
    },
    setCenter: async (x, y, options) => {
      const { width: width2, height: height2, maxZoom: maxZoom2, panZoom } = get2();
      if (!panZoom) {
        return false;
      }
      const nextZoom = typeof options?.zoom !== "undefined" ? options.zoom : maxZoom2;
      await panZoom.setViewport({
        x: width2 / 2 - x * nextZoom,
        y: height2 / 2 - y * nextZoom,
        zoom: nextZoom
      }, { duration: options?.duration, ease: options?.ease, interpolate: options?.interpolate });
      return true;
    },
    cancelConnection: () => {
      set2({
        connection: { ...initialConnection }
      });
    },
    updateConnection: (connection) => {
      set2({ connection });
    },
    reset: () => set2({ ...getInitialState() })
  };
}, Object.is);
function ReactFlowProvider({ initialNodes: nodes, initialEdges: edges, defaultNodes, defaultEdges, initialWidth: width, initialHeight: height, initialMinZoom: minZoom, initialMaxZoom: maxZoom, initialFitViewOptions: fitViewOptions, fitView, nodeOrigin, nodeExtent, zIndexMode, children: children2 }) {
  const [store] = reactExports.useState(() => createStore({
    nodes,
    edges,
    defaultNodes,
    defaultEdges,
    width,
    height,
    fitView,
    minZoom,
    maxZoom,
    fitViewOptions,
    nodeOrigin,
    nodeExtent,
    zIndexMode
  }));
  return jsxRuntimeExports.jsx(Provider$1, { value: store, children: jsxRuntimeExports.jsx(BatchProvider, { children: jsxRuntimeExports.jsx(HandleConfigProvider, { children: children2 }) }) });
}
function Wrapper({ children: children2, nodes, edges, defaultNodes, defaultEdges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode }) {
  const isWrapped = reactExports.useContext(StoreContext);
  if (isWrapped) {
    return jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: children2 });
  }
  return jsxRuntimeExports.jsx(ReactFlowProvider, { initialNodes: nodes, initialEdges: edges, defaultNodes, defaultEdges, initialWidth: width, initialHeight: height, fitView, initialFitViewOptions: fitViewOptions, initialMinZoom: minZoom, initialMaxZoom: maxZoom, nodeOrigin, nodeExtent, zIndexMode, children: children2 });
}
const wrapperStyle = {
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  zIndex: 0
};
function ReactFlow({ nodes, edges, defaultNodes, defaultEdges, className, nodeTypes: nodeTypes2, edgeTypes: edgeTypes2, onNodeClick, onEdgeClick, onInit, onMove, onMoveStart, onMoveEnd, onConnect, onConnectStart, onConnectEnd, onClickConnectStart, onClickConnectEnd, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onNodeDoubleClick, onNodeDragStart, onNodeDrag, onNodeDragStop, onNodesDelete, onEdgesDelete, onDelete, onSelectionChange, onSelectionDragStart, onSelectionDrag, onSelectionDragStop, onSelectionContextMenu, onSelectionStart, onSelectionEnd, onBeforeDelete, connectionMode, connectionLineType = ConnectionLineType.Bezier, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, deleteKeyCode = "Backspace", selectionKeyCode = "Shift", selectionOnDrag = false, selectionMode = SelectionMode.Full, panActivationKeyCode = "Space", multiSelectionKeyCode = isMacOs() ? "Meta" : "Control", zoomActivationKeyCode = isMacOs() ? "Meta" : "Control", snapToGrid, snapGrid, onlyRenderVisibleElements = false, selectNodesOnDrag, nodesDraggable, autoPanOnNodeFocus, nodesConnectable, nodesFocusable, nodeOrigin = defaultNodeOrigin, edgesFocusable, edgesReconnectable, elementsSelectable = true, defaultViewport: defaultViewport$1 = defaultViewport, minZoom = 0.5, maxZoom = 2, translateExtent = infiniteExtent, preventScrolling = true, nodeExtent, defaultMarkerColor = "#b1b1b7", zoomOnScroll = true, zoomOnPinch = true, panOnScroll = false, panOnScrollSpeed = 0.5, panOnScrollMode = PanOnScrollMode.Free, zoomOnDoubleClick = true, panOnDrag = true, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance = 1, nodeClickDistance = 0, children: children2, onReconnect, onReconnectStart, onReconnectEnd, onEdgeContextMenu, onEdgeDoubleClick, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius = 10, onNodesChange, onEdgesChange, noDragClassName = "nodrag", noWheelClassName = "nowheel", noPanClassName = "nopan", fitView, fitViewOptions, connectOnClick, attributionPosition, proOptions, defaultEdgeOptions, elevateNodesOnSelect = true, elevateEdgesOnSelect = false, disableKeyboardA11y = false, autoPanOnConnect, autoPanOnNodeDrag, autoPanOnSelection = true, autoPanSpeed, connectionRadius, isValidConnection, onError, style: style2, id: id2, nodeDragThreshold, connectionDragThreshold, viewport, onViewportChange, width, height, colorMode = "light", debug, onScroll, ariaLabelConfig, zIndexMode = "basic", ...rest }, ref) {
  const rfId = id2 || "1";
  const colorModeClassName = useColorModeClass(colorMode);
  const wrapperOnScroll = reactExports.useCallback((e) => {
    e.currentTarget.scrollTo({ top: 0, left: 0, behavior: "instant" });
    onScroll?.(e);
  }, [onScroll]);
  return jsxRuntimeExports.jsx("div", { "data-testid": "rf__wrapper", ...rest, onScroll: wrapperOnScroll, style: { ...style2, ...wrapperStyle }, ref, className: cc(["react-flow", className, colorModeClassName]), id: id2, role: "application", children: jsxRuntimeExports.jsxs(Wrapper, { nodes, edges, width, height, fitView, fitViewOptions, minZoom, maxZoom, nodeOrigin, nodeExtent, zIndexMode, children: [jsxRuntimeExports.jsx(StoreUpdater, { nodes, edges, defaultNodes, defaultEdges, onConnect, onConnectStart, onConnectEnd, onClickConnectStart, onClickConnectEnd, nodesDraggable, autoPanOnNodeFocus, nodesConnectable, nodesFocusable, edgesFocusable, edgesReconnectable, elementsSelectable, elevateNodesOnSelect, elevateEdgesOnSelect, minZoom, maxZoom, nodeExtent, onNodesChange, onEdgesChange, snapToGrid, snapGrid, connectionMode, translateExtent, connectOnClick, defaultEdgeOptions, fitView, fitViewOptions, onNodesDelete, onEdgesDelete, onDelete, onNodeDragStart, onNodeDrag, onNodeDragStop, onSelectionDrag, onSelectionDragStart, onSelectionDragStop, onMove, onMoveStart, onMoveEnd, noPanClassName, nodeOrigin, rfId, autoPanOnConnect, autoPanOnNodeDrag, autoPanSpeed, onError, connectionRadius, isValidConnection, selectNodesOnDrag, nodeDragThreshold, connectionDragThreshold, onBeforeDelete, debug, ariaLabelConfig, zIndexMode }), jsxRuntimeExports.jsx(GraphView, { onInit, onNodeClick, onEdgeClick, onNodeMouseEnter, onNodeMouseMove, onNodeMouseLeave, onNodeContextMenu, onNodeDoubleClick, nodeTypes: nodeTypes2, edgeTypes: edgeTypes2, connectionLineType, connectionLineStyle, connectionLineComponent, connectionLineContainerStyle, selectionKeyCode, selectionOnDrag, selectionMode, deleteKeyCode, multiSelectionKeyCode, panActivationKeyCode, zoomActivationKeyCode, onlyRenderVisibleElements, defaultViewport: defaultViewport$1, translateExtent, minZoom, maxZoom, preventScrolling, zoomOnScroll, zoomOnPinch, zoomOnDoubleClick, panOnScroll, panOnScrollSpeed, panOnScrollMode, panOnDrag, autoPanOnSelection, onPaneClick, onPaneMouseEnter, onPaneMouseMove, onPaneMouseLeave, onPaneScroll, onPaneContextMenu, paneClickDistance, nodeClickDistance, onSelectionContextMenu, onSelectionStart, onSelectionEnd, onReconnect, onReconnectStart, onReconnectEnd, onEdgeContextMenu, onEdgeDoubleClick, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, reconnectRadius, defaultMarkerColor, noDragClassName, noWheelClassName, noPanClassName, rfId, disableKeyboardA11y, nodeExtent, viewport, onViewportChange, nodesDraggable }), jsxRuntimeExports.jsx(SelectionListener, { onSelectionChange }), children2, jsxRuntimeExports.jsx(Attribution, { proOptions, position: attributionPosition }), jsxRuntimeExports.jsx(A11yDescriptions, { rfId, disableKeyboardA11y })] }) });
}
var index$2 = fixedForwardRef(ReactFlow);
const selector$6 = (s) => s.domNode?.querySelector(".react-flow__edgelabel-renderer");
function EdgeLabelRenderer({ children: children2 }) {
  const edgeLabelRenderer = useStore(selector$6);
  if (!edgeLabelRenderer) {
    return null;
  }
  return reactDomExports.createPortal(children2, edgeLabelRenderer);
}
function LinePattern({ dimensions, lineWidth, variant, className }) {
  return jsxRuntimeExports.jsx("path", { strokeWidth: lineWidth, d: `M${dimensions[0] / 2} 0 V${dimensions[1]} M0 ${dimensions[1] / 2} H${dimensions[0]}`, className: cc(["react-flow__background-pattern", variant, className]) });
}
function DotPattern({ radius, className }) {
  return jsxRuntimeExports.jsx("circle", { cx: radius, cy: radius, r: radius, className: cc(["react-flow__background-pattern", "dots", className]) });
}
var BackgroundVariant;
(function(BackgroundVariant2) {
  BackgroundVariant2["Lines"] = "lines";
  BackgroundVariant2["Dots"] = "dots";
  BackgroundVariant2["Cross"] = "cross";
})(BackgroundVariant || (BackgroundVariant = {}));
const defaultSize = {
  [BackgroundVariant.Dots]: 1,
  [BackgroundVariant.Lines]: 1,
  [BackgroundVariant.Cross]: 6
};
const selector$3 = (s) => ({ transform: s.transform, patternId: `pattern-${s.rfId}` });
function BackgroundComponent({
  id: id2,
  variant = BackgroundVariant.Dots,
  // only used for dots and cross
  gap = 20,
  // only used for lines and cross
  size,
  lineWidth = 1,
  offset = 0,
  color: color2,
  bgColor,
  style: style2,
  className,
  patternClassName
}) {
  const ref = reactExports.useRef(null);
  const { transform: transform2, patternId } = useStore(selector$3, shallow$1);
  const patternSize = size || defaultSize[variant];
  const isDots = variant === BackgroundVariant.Dots;
  const isCross = variant === BackgroundVariant.Cross;
  const gapXY = Array.isArray(gap) ? gap : [gap, gap];
  const scaledGap = [gapXY[0] * transform2[2] || 1, gapXY[1] * transform2[2] || 1];
  const scaledSize = patternSize * transform2[2];
  const offsetXY = Array.isArray(offset) ? offset : [offset, offset];
  const patternDimensions = isCross ? [scaledSize, scaledSize] : scaledGap;
  const scaledOffset = [
    offsetXY[0] * transform2[2] + patternDimensions[0] / 2,
    offsetXY[1] * transform2[2] + patternDimensions[1] / 2
  ];
  const _patternId = `${patternId}${id2 ? id2 : ""}`;
  return jsxRuntimeExports.jsxs("svg", { className: cc(["react-flow__background", className]), style: {
    ...style2,
    ...containerStyle,
    "--xy-background-color-props": bgColor,
    "--xy-background-pattern-color-props": color2
  }, ref, "data-testid": "rf__background", children: [jsxRuntimeExports.jsx("pattern", { id: _patternId, x: transform2[0] % scaledGap[0], y: transform2[1] % scaledGap[1], width: scaledGap[0], height: scaledGap[1], patternUnits: "userSpaceOnUse", patternTransform: `translate(-${scaledOffset[0]},-${scaledOffset[1]})`, children: isDots ? jsxRuntimeExports.jsx(DotPattern, { radius: scaledSize / 2, className: patternClassName }) : jsxRuntimeExports.jsx(LinePattern, { dimensions: patternDimensions, lineWidth, variant, className: patternClassName }) }), jsxRuntimeExports.jsx("rect", { x: "0", y: "0", width: "100%", height: "100%", fill: `url(#${_patternId})` })] });
}
BackgroundComponent.displayName = "Background";
const Background = reactExports.memo(BackgroundComponent);
function PlusIcon() {
  return jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 32", children: jsxRuntimeExports.jsx("path", { d: "M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" }) });
}
function MinusIcon() {
  return jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 5", children: jsxRuntimeExports.jsx("path", { d: "M0 0h32v4.2H0z" }) });
}
function FitViewIcon() {
  return jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 32 30", children: jsxRuntimeExports.jsx("path", { d: "M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" }) });
}
function LockIcon() {
  return jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: jsxRuntimeExports.jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" }) });
}
function UnlockIcon() {
  return jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 25 32", children: jsxRuntimeExports.jsx("path", { d: "M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z" }) });
}
function ControlButton({ children: children2, className, ...rest }) {
  return jsxRuntimeExports.jsx("button", { type: "button", className: cc(["react-flow__controls-button", className]), ...rest, children: children2 });
}
const selector$2 = (s) => ({
  isInteractive: s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  minZoomReached: s.transform[2] <= s.minZoom,
  maxZoomReached: s.transform[2] >= s.maxZoom,
  ariaLabelConfig: s.ariaLabelConfig
});
function ControlsComponent({ style: style2, showZoom = true, showFitView = true, showInteractive = true, fitViewOptions, onZoomIn, onZoomOut, onFitView, onInteractiveChange, className, children: children2, position: position2 = "bottom-left", orientation = "vertical", "aria-label": ariaLabel }) {
  const store = useStoreApi();
  const { isInteractive, minZoomReached, maxZoomReached, ariaLabelConfig } = useStore(selector$2, shallow$1);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const onZoomInHandler = () => {
    zoomIn();
    onZoomIn?.();
  };
  const onZoomOutHandler = () => {
    zoomOut();
    onZoomOut?.();
  };
  const onFitViewHandler = () => {
    fitView(fitViewOptions);
    onFitView?.();
  };
  const onToggleInteractivity = () => {
    store.setState({
      nodesDraggable: !isInteractive,
      nodesConnectable: !isInteractive,
      elementsSelectable: !isInteractive
    });
    onInteractiveChange?.(!isInteractive);
  };
  const orientationClass = orientation === "horizontal" ? "horizontal" : "vertical";
  return jsxRuntimeExports.jsxs(Panel, { className: cc(["react-flow__controls", orientationClass, className]), position: position2, style: style2, "data-testid": "rf__controls", "aria-label": ariaLabel ?? ariaLabelConfig["controls.ariaLabel"], children: [showZoom && jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [jsxRuntimeExports.jsx(ControlButton, { onClick: onZoomInHandler, className: "react-flow__controls-zoomin", title: ariaLabelConfig["controls.zoomIn.ariaLabel"], "aria-label": ariaLabelConfig["controls.zoomIn.ariaLabel"], disabled: maxZoomReached, children: jsxRuntimeExports.jsx(PlusIcon, {}) }), jsxRuntimeExports.jsx(ControlButton, { onClick: onZoomOutHandler, className: "react-flow__controls-zoomout", title: ariaLabelConfig["controls.zoomOut.ariaLabel"], "aria-label": ariaLabelConfig["controls.zoomOut.ariaLabel"], disabled: minZoomReached, children: jsxRuntimeExports.jsx(MinusIcon, {}) })] }), showFitView && jsxRuntimeExports.jsx(ControlButton, { className: "react-flow__controls-fitview", onClick: onFitViewHandler, title: ariaLabelConfig["controls.fitView.ariaLabel"], "aria-label": ariaLabelConfig["controls.fitView.ariaLabel"], children: jsxRuntimeExports.jsx(FitViewIcon, {}) }), showInteractive && jsxRuntimeExports.jsx(ControlButton, { className: "react-flow__controls-interactive", onClick: onToggleInteractivity, title: ariaLabelConfig["controls.interactive.ariaLabel"], "aria-label": ariaLabelConfig["controls.interactive.ariaLabel"], children: isInteractive ? jsxRuntimeExports.jsx(UnlockIcon, {}) : jsxRuntimeExports.jsx(LockIcon, {}) }), children2] });
}
ControlsComponent.displayName = "Controls";
reactExports.memo(ControlsComponent);
function MiniMapNodeComponent({ id: id2, x, y, width, height, style: style2, color: color2, strokeColor, strokeWidth, className, borderRadius, shapeRendering, selected: selected2, onClick }) {
  const { background, backgroundColor } = style2 || {};
  const fill = color2 || background || backgroundColor;
  return jsxRuntimeExports.jsx("rect", { className: cc(["react-flow__minimap-node", { selected: selected2 }, className]), x, y, rx: borderRadius, ry: borderRadius, width, height, style: {
    fill,
    stroke: strokeColor,
    strokeWidth
  }, shapeRendering, onClick: onClick ? (event) => onClick(event, id2) : void 0 });
}
const MiniMapNode = reactExports.memo(MiniMapNodeComponent);
const selectorNodeIds = (s) => s.nodes.map((node2) => node2.id);
const getAttrFunction = (func) => func instanceof Function ? func : () => func;
function MiniMapNodes({
  nodeStrokeColor,
  nodeColor,
  nodeClassName = "",
  nodeBorderRadius = 5,
  nodeStrokeWidth,
  /*
   * We need to rename the prop to be `CapitalCase` so that JSX will render it as
   * a component properly.
   */
  nodeComponent: NodeComponent = MiniMapNode,
  onClick
}) {
  const nodeIds = useStore(selectorNodeIds, shallow$1);
  const nodeColorFunc = getAttrFunction(nodeColor);
  const nodeStrokeColorFunc = getAttrFunction(nodeStrokeColor);
  const nodeClassNameFunc = getAttrFunction(nodeClassName);
  const shapeRendering = typeof window === "undefined" || !!window.chrome ? "crispEdges" : "geometricPrecision";
  return jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: nodeIds.map((nodeId) => (
    /*
     * The split of responsibilities between MiniMapNodes and
     * NodeComponentWrapper may appear weird. However, it’s designed to
     * minimize the cost of updates when individual nodes change.
     *
     * For more details, see a similar commit in `NodeRenderer/index.tsx`.
     */
    jsxRuntimeExports.jsx(NodeComponentWrapper, { id: nodeId, nodeColorFunc, nodeStrokeColorFunc, nodeClassNameFunc, nodeBorderRadius, nodeStrokeWidth, NodeComponent, onClick, shapeRendering }, nodeId)
  )) });
}
function NodeComponentWrapperInner({ id: id2, nodeColorFunc, nodeStrokeColorFunc, nodeClassNameFunc, nodeBorderRadius, nodeStrokeWidth, shapeRendering, NodeComponent, onClick }) {
  const { node: node2, x, y, width, height } = useStore((s) => {
    const node22 = s.nodeLookup.get(id2);
    if (!node22) {
      return { node: void 0, x: 0, y: 0, width: 0, height: 0 };
    }
    const userNode = node22.internals.userNode;
    const { x: x2, y: y2 } = node22.internals.positionAbsolute;
    const { width: width2, height: height2 } = getNodeDimensions(userNode);
    return {
      node: userNode,
      x: x2,
      y: y2,
      width: width2,
      height: height2
    };
  }, shallow$1);
  if (!node2 || node2.hidden || !nodeHasDimensions(node2)) {
    return null;
  }
  return jsxRuntimeExports.jsx(NodeComponent, { x, y, width, height, style: node2.style, selected: !!node2.selected, className: nodeClassNameFunc(node2), color: nodeColorFunc(node2), borderRadius: nodeBorderRadius, strokeColor: nodeStrokeColorFunc(node2), strokeWidth: nodeStrokeWidth, shapeRendering, onClick, id: node2.id });
}
const NodeComponentWrapper = reactExports.memo(NodeComponentWrapperInner);
var MiniMapNodes$1 = reactExports.memo(MiniMapNodes);
const defaultWidth = 200;
const defaultHeight = 150;
const filterHidden = (node2) => !node2.hidden;
const selector$1 = (s) => {
  const viewBB = {
    x: -s.transform[0] / s.transform[2],
    y: -s.transform[1] / s.transform[2],
    width: s.width / s.transform[2],
    height: s.height / s.transform[2]
  };
  return {
    viewBB,
    boundingRect: s.nodeLookup.size > 0 ? getBoundsOfRects(getInternalNodesBounds(s.nodeLookup, { filter: filterHidden }), viewBB) : viewBB,
    rfId: s.rfId,
    panZoom: s.panZoom,
    translateExtent: s.translateExtent,
    flowWidth: s.width,
    flowHeight: s.height,
    ariaLabelConfig: s.ariaLabelConfig
  };
};
const rectEqual = (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
const areEqual = (a, b) => rectEqual(a.viewBB, b.viewBB) && rectEqual(a.boundingRect, b.boundingRect) && a.rfId === b.rfId && a.panZoom === b.panZoom && a.translateExtent === b.translateExtent && a.flowWidth === b.flowWidth && a.flowHeight === b.flowHeight && a.ariaLabelConfig === b.ariaLabelConfig;
const ARIA_LABEL_KEY = "react-flow__minimap-desc";
function MiniMapComponent({
  style: style2,
  className,
  nodeStrokeColor,
  nodeColor,
  nodeClassName = "",
  nodeBorderRadius = 5,
  nodeStrokeWidth,
  /*
   * We need to rename the prop to be `CapitalCase` so that JSX will render it as
   * a component properly.
   */
  nodeComponent,
  bgColor,
  maskColor,
  maskStrokeColor,
  maskStrokeWidth,
  position: position2 = "bottom-right",
  onClick,
  onNodeClick,
  pannable = false,
  zoomable = false,
  ariaLabel,
  inversePan,
  zoomStep = 1,
  offsetScale = 5
}) {
  const store = useStoreApi();
  const svg2 = reactExports.useRef(null);
  const { boundingRect, viewBB, rfId, panZoom, translateExtent, flowWidth, flowHeight, ariaLabelConfig } = useStore(selector$1, areEqual);
  const elementWidth = style2?.width ?? defaultWidth;
  const elementHeight = style2?.height ?? defaultHeight;
  const scaledWidth = boundingRect.width / elementWidth;
  const scaledHeight = boundingRect.height / elementHeight;
  const viewScale = Math.max(scaledWidth, scaledHeight);
  const viewWidth = viewScale * elementWidth;
  const viewHeight = viewScale * elementHeight;
  const offset = offsetScale * viewScale;
  const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
  const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
  const width = viewWidth + offset * 2;
  const height = viewHeight + offset * 2;
  const labelledBy = `${ARIA_LABEL_KEY}-${rfId}`;
  const viewScaleRef = reactExports.useRef(0);
  const minimapInstance = reactExports.useRef();
  viewScaleRef.current = viewScale;
  reactExports.useEffect(() => {
    if (svg2.current && panZoom) {
      minimapInstance.current = XYMinimap({
        domNode: svg2.current,
        panZoom,
        getTransform: () => store.getState().transform,
        getViewScale: () => viewScaleRef.current
      });
      return () => {
        minimapInstance.current?.destroy();
      };
    }
  }, [panZoom]);
  reactExports.useEffect(() => {
    minimapInstance.current?.update({
      translateExtent,
      width: flowWidth,
      height: flowHeight,
      inversePan,
      pannable,
      zoomStep,
      zoomable
    });
  }, [pannable, zoomable, inversePan, zoomStep, translateExtent, flowWidth, flowHeight]);
  const onSvgClick = onClick ? (event) => {
    const [x2, y2] = minimapInstance.current?.pointer(event) || [0, 0];
    onClick(event, { x: x2, y: y2 });
  } : void 0;
  const onSvgNodeClick = onNodeClick ? reactExports.useCallback((event, nodeId) => {
    const node2 = store.getState().nodeLookup.get(nodeId).internals.userNode;
    onNodeClick(event, node2);
  }, []) : void 0;
  const _ariaLabel = ariaLabel ?? ariaLabelConfig["minimap.ariaLabel"];
  return jsxRuntimeExports.jsx(Panel, { position: position2, style: {
    ...style2,
    "--xy-minimap-background-color-props": typeof bgColor === "string" ? bgColor : void 0,
    "--xy-minimap-mask-background-color-props": typeof maskColor === "string" ? maskColor : void 0,
    "--xy-minimap-mask-stroke-color-props": typeof maskStrokeColor === "string" ? maskStrokeColor : void 0,
    "--xy-minimap-mask-stroke-width-props": typeof maskStrokeWidth === "number" ? maskStrokeWidth * viewScale : void 0,
    "--xy-minimap-node-background-color-props": typeof nodeColor === "string" ? nodeColor : void 0,
    "--xy-minimap-node-stroke-color-props": typeof nodeStrokeColor === "string" ? nodeStrokeColor : void 0,
    "--xy-minimap-node-stroke-width-props": typeof nodeStrokeWidth === "number" ? nodeStrokeWidth : void 0
  }, className: cc(["react-flow__minimap", className]), "data-testid": "rf__minimap", children: jsxRuntimeExports.jsxs("svg", { width: elementWidth, height: elementHeight, viewBox: `${x} ${y} ${width} ${height}`, className: "react-flow__minimap-svg", role: "img", "aria-labelledby": labelledBy, ref: svg2, onClick: onSvgClick, children: [_ariaLabel && jsxRuntimeExports.jsx("title", { id: labelledBy, children: _ariaLabel }), jsxRuntimeExports.jsx(MiniMapNodes$1, { onClick: onSvgNodeClick, nodeColor, nodeStrokeColor, nodeBorderRadius, nodeClassName, nodeStrokeWidth, nodeComponent }), jsxRuntimeExports.jsx("path", { className: "react-flow__minimap-mask", d: `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`, fillRule: "evenodd", pointerEvents: "none" })] }) });
}
MiniMapComponent.displayName = "MiniMap";
reactExports.memo(MiniMapComponent);
const scaleSelector = (calculateScale) => (store) => calculateScale ? `${Math.max(1 / store.transform[2], 1)}` : void 0;
const defaultPositions = {
  [ResizeControlVariant.Line]: "right",
  [ResizeControlVariant.Handle]: "bottom-right"
};
function ResizeControl({ nodeId, position: position2, variant = ResizeControlVariant.Handle, className, style: style2 = void 0, children: children2, color: color2, minWidth = 10, minHeight = 10, maxWidth = Number.MAX_VALUE, maxHeight = Number.MAX_VALUE, keepAspectRatio = false, resizeDirection, autoScale = true, shouldResize, onResizeStart, onResize, onResizeEnd }) {
  const contextNodeId = useNodeId();
  const id2 = typeof nodeId === "string" ? nodeId : contextNodeId;
  const store = useStoreApi();
  const resizeControlRef = reactExports.useRef(null);
  const isHandleControl = variant === ResizeControlVariant.Handle;
  const scale = useStore(reactExports.useCallback(scaleSelector(isHandleControl && autoScale), [isHandleControl, autoScale]), shallow$1);
  const resizer = reactExports.useRef(null);
  const controlPosition = position2 ?? defaultPositions[variant];
  reactExports.useEffect(() => {
    if (!resizeControlRef.current || !id2) {
      return;
    }
    if (!resizer.current) {
      resizer.current = XYResizer({
        domNode: resizeControlRef.current,
        nodeId: id2,
        getStoreItems: () => {
          const { nodeLookup, transform: transform2, snapGrid, snapToGrid, nodeOrigin, domNode } = store.getState();
          return {
            nodeLookup,
            transform: transform2,
            snapGrid,
            snapToGrid,
            nodeOrigin,
            paneDomNode: domNode
          };
        },
        onChange: (change, childChanges) => {
          const { triggerNodeChanges, nodeLookup, parentLookup, nodeOrigin } = store.getState();
          const changes = [];
          const nextPosition = { x: change.x, y: change.y };
          const node2 = nodeLookup.get(id2);
          if (node2 && node2.expandParent && node2.parentId) {
            const origin = node2.origin ?? nodeOrigin;
            const width = change.width ?? node2.measured.width ?? 0;
            const height = change.height ?? node2.measured.height ?? 0;
            const child = {
              id: node2.id,
              parentId: node2.parentId,
              rect: {
                width,
                height,
                ...evaluateAbsolutePosition({
                  x: change.x ?? node2.position.x,
                  y: change.y ?? node2.position.y
                }, { width, height }, node2.parentId, nodeLookup, origin)
              }
            };
            const parentExpandChanges = handleExpandParent([child], nodeLookup, parentLookup, nodeOrigin);
            changes.push(...parentExpandChanges);
            nextPosition.x = change.x ? Math.max(origin[0] * width, change.x) : void 0;
            nextPosition.y = change.y ? Math.max(origin[1] * height, change.y) : void 0;
          }
          if (nextPosition.x !== void 0 && nextPosition.y !== void 0) {
            const positionChange = {
              id: id2,
              type: "position",
              position: { ...nextPosition }
            };
            changes.push(positionChange);
          }
          if (change.width !== void 0 && change.height !== void 0) {
            const setAttributes = !resizeDirection ? true : resizeDirection === "horizontal" ? "width" : "height";
            const dimensionChange = {
              id: id2,
              type: "dimensions",
              resizing: true,
              setAttributes,
              dimensions: {
                width: change.width,
                height: change.height
              }
            };
            changes.push(dimensionChange);
          }
          for (const childChange of childChanges) {
            const positionChange = {
              ...childChange,
              type: "position"
            };
            changes.push(positionChange);
          }
          triggerNodeChanges(changes);
        },
        onEnd: ({ width, height }) => {
          const dimensionChange = {
            id: id2,
            type: "dimensions",
            resizing: false,
            dimensions: {
              width,
              height
            }
          };
          store.getState().triggerNodeChanges([dimensionChange]);
        }
      });
    }
    resizer.current.update({
      controlPosition,
      boundaries: {
        minWidth,
        minHeight,
        maxWidth,
        maxHeight
      },
      keepAspectRatio,
      resizeDirection,
      onResizeStart,
      onResize,
      onResizeEnd,
      shouldResize
    });
    return () => {
      resizer.current?.destroy();
    };
  }, [
    controlPosition,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    keepAspectRatio,
    onResizeStart,
    onResize,
    onResizeEnd,
    shouldResize
  ]);
  const positionClassNames = controlPosition.split("-");
  return jsxRuntimeExports.jsx("div", { className: cc(["react-flow__resize-control", "nodrag", ...positionClassNames, variant, className]), ref: resizeControlRef, style: {
    ...style2,
    scale,
    ...color2 && { [isHandleControl ? "backgroundColor" : "borderColor"]: color2 }
  }, children: children2 });
}
reactExports.memo(ResizeControl);
const PICKER_ITEMS = [
  { id: "input-text", family: "input", title: "Text", description: "Đề bài hoặc nội dung văn bản", icon: Type, color: "text-blue-500" },
  { id: "input-file", family: "input", title: "File", description: "Markdown, DOCX, TXT, JSON…", icon: FileText, color: "text-blue-500" },
  { id: "input-folder", family: "input", title: "Folder", description: "Cho agent đọc cả thư mục", icon: FolderOpen, color: "text-blue-500" },
  { id: "function-merge", family: "function", title: "Merge", description: "Gộp nhiều input thành một luồng", icon: Merge, color: "text-amber-500" },
  { id: "function-condition", family: "function", title: "If", description: "Rẽ nhánh Đúng hoặc Sai theo dữ liệu", icon: GitBranch, color: "text-violet-500" },
  { id: "function-loop", family: "function", title: "Loop", description: "Quay lại một nhánh với số lượt giới hạn", icon: Repeat2, color: "text-cyan-500" },
  { id: "agent", family: "agent", title: "Agent", description: "Chạy Claude, OpenCode hoặc Codex CLI", icon: Bot, color: "text-primary" }
];
const STATUS_COLORS = {
  pending: "bg-muted-foreground/40",
  running: "bg-blue-500",
  checking: "bg-amber-500",
  awaiting: "bg-violet-500",
  passed: "bg-emerald-500",
  failed: "bg-destructive",
  skipped: "bg-muted-foreground/30"
};
function localizedNodeName(name2, vietnamese) {
  if (!vietnamese) return name2;
  return { Text: "Văn bản", File: "Tệp", Folder: "Thư mục", Merge: "Gộp", If: "Điều kiện", Loop: "Vòng lặp", Agent: "Agent" }[name2] ?? name2;
}
function CanvasControl({ title, onClick, disabled, children: children2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title, "aria-label": title, disabled, onClick, className: "flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:border-muted-foreground hover:bg-accent disabled:opacity-40", children: children2 });
}
function BuzzGraphEdge({ id: id2, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style: style2, selected: selected2, data }) {
  const [path2, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      BaseEdge,
      {
        id: id2,
        path: path2,
        markerEnd,
        style: {
          ...style2,
          stroke: selected2 ? "hsl(var(--primary))" : style2?.stroke,
          strokeWidth: selected2 ? 2.5 : style2?.strokeWidth
        }
      }
    ),
    (selected2 || data?.branchLabel) && /* @__PURE__ */ jsxRuntimeExports.jsxs(EdgeLabelRenderer, { children: [
      data?.branchLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
        "pointer-events-none absolute rounded-lg border bg-card px-1.5 py-0.5 text-2xs font-semibold shadow-sm",
        data.branchTone === "success" ? "border-emerald-500/40 text-emerald-500" : data.branchTone === "danger" ? "border-rose-500/40 text-rose-500" : data.branchTone === "loop" ? "border-cyan-500/40 text-cyan-500" : "border-blue-500/40 text-blue-500"
      ), style: { transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }, children: data.branchLabel }),
      selected2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          title: "Xóa dây nối",
          "aria-label": "Xóa dây nối",
          className: "nodrag nopan pointer-events-auto absolute flex size-7 items-center justify-center rounded-lg border border-primary/50 bg-card text-primary shadow-lg transition hover:bg-destructive hover:text-destructive-foreground",
          style: { transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - (data?.branchLabel ? 24 : 0)}px)` },
          onPointerDown: (event) => event.stopPropagation(),
          onClick: (event) => {
            event.stopPropagation();
            data?.onDelete(id2);
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
        }
      )
    ] })
  ] });
}
function BuzzGraphNode({ data, selected: selected2 }) {
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const trueLabel = vietnamese ? "Đúng" : "True";
  const falseLabel = vietnamese ? "Sai" : "False";
  const loopLabel = vietnamese ? "Lặp" : "Loop";
  const doneLabel = vietnamese ? "Xong" : "Done";
  const running = data.status === "running";
  const meta = data.family === "input" ? { Icon: data.kind === "text" ? Type : data.kind === "file" ? FileText : FolderOpen, color: "text-blue-500", surface: "bg-blue-500/10", border: "border-blue-500" } : data.family === "function" ? data.kind === "condition" ? { Icon: GitBranch, color: "text-violet-500", surface: "bg-violet-500/10", border: "border-violet-500" } : data.kind === "loop" ? { Icon: Repeat2, color: "text-cyan-500", surface: "bg-cyan-500/10", border: "border-cyan-500" } : { Icon: Merge, color: "text-amber-500", surface: "bg-amber-500/10", border: "border-amber-500" } : { Icon: Bot, color: "text-primary", surface: "bg-primary/10", border: "border-primary" };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-24 text-center", children: [
    selected2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "nodrag nopan absolute -top-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-md", children: [
      data.family !== "input" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "Chạy node", onPointerDown: (event) => event.stopPropagation(), onClick: (event) => {
        event.stopPropagation();
        data.onRun();
      }, className: "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground", children: data.status === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-3 fill-current" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "Xóa node", onPointerDown: (event) => event.stopPropagation(), onClick: (event) => {
        event.stopPropagation();
        data.onDelete();
      }, className: "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: "Mở cài đặt", onPointerDown: (event) => event.stopPropagation(), onClick: (event) => {
        event.stopPropagation();
        data.onOpen();
      }, className: "flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "size-3.5" }) })
    ] }),
    data.family !== "input" && /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "target", position: Position.Left, className: "!top-12 !size-3 !border-2 !border-background !bg-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
      "relative flex size-24 items-center justify-center rounded-2xl border-2 bg-card shadow-sm transition",
      running ? "border-primary shadow-[0_0_28px_hsl(var(--primary)/0.28)] ring-4 ring-primary/15" : selected2 ? `${meta.border} shadow-lg ring-4 ring-primary/10` : "border-border hover:border-muted-foreground/60"
    ), children: [
      running && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -inset-1.5 animate-pulse rounded-[20px] border-2 border-primary/60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("relative flex size-12 items-center justify-center rounded-xl", meta.surface, meta.color), children: running ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "absolute size-9 animate-spin stroke-[1.5]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { className: "size-5" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { className: "size-6" }) }),
      running ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-2.5 animate-spin" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("absolute right-2 top-2 size-2 rounded-full", STATUS_COLORS[data.status]) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "-ml-6 mt-2 w-36", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs font-semibold", children: data.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("mt-0.5 block truncate text-2xs", running ? "font-medium text-primary" : "text-muted-foreground"), children: running ? data.runningLabel : data.subtitle })
    ] }),
    data.kind === "condition" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { id: "true", type: "source", position: Position.Right, className: "!top-8 !size-3 !border-2 !border-background !bg-emerald-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { id: "false", type: "source", position: Position.Right, className: "!top-16 !size-3 !border-2 !border-background !bg-rose-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-8 top-[27px] text-2xs font-medium text-emerald-500", children: trueLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-7 top-[59px] text-2xs font-medium text-rose-500", children: falseLabel })
    ] }) : data.kind === "loop" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { id: "loop", type: "source", position: Position.Right, className: "!top-8 !size-3 !border-2 !border-background !bg-cyan-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { id: "done", type: "source", position: Position.Right, className: "!top-16 !size-3 !border-2 !border-background !bg-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-7 top-[27px] text-2xs font-medium text-cyan-500", children: loopLabel }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute -right-8 top-[59px] text-2xs font-medium text-blue-500", children: doneLabel })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Handle, { type: "source", position: Position.Right, className: cn("!top-12 !size-3 !border-2 !border-background", data.family === "input" ? "!bg-blue-500" : data.family === "function" ? "!bg-amber-500" : "!bg-primary") }),
    selected2 && data.kind !== "condition" && data.kind !== "loop" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "pointer-events-none absolute left-full top-12 h-px w-5 bg-muted-foreground/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          "aria-label": "Thêm node tiếp theo",
          onPointerDown: (event) => event.stopPropagation(),
          onClick: (event) => {
            event.stopPropagation();
            data.onAddNext();
          },
          className: "nodrag nopan absolute -right-12 top-12 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" })
        }
      )
    ] }),
    selected2 && data.kind === "condition" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BranchAddButton, { className: "-right-16 top-8 border-emerald-500/50 text-emerald-500", label: trueLabel, onClick: () => data.onAddNext("true") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BranchAddButton, { className: "-right-16 top-16 border-rose-500/50 text-rose-500", label: falseLabel, onClick: () => data.onAddNext("false") })
    ] }),
    selected2 && data.kind === "loop" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BranchAddButton, { className: "-right-16 top-8 border-cyan-500/50 text-cyan-500", label: loopLabel, onClick: () => data.onAddNext("loop") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BranchAddButton, { className: "-right-16 top-16 border-blue-500/50 text-blue-500", label: doneLabel, onClick: () => data.onAddNext("done") })
    ] })
  ] });
}
function BranchAddButton({ className, label, onClick }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", title: `Thêm nhánh ${label}`, "aria-label": `Thêm nhánh ${label}`, onPointerDown: (event) => event.stopPropagation(), onClick: (event) => {
    event.stopPropagation();
    onClick();
  }, className: cn("nodrag nopan absolute z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg border bg-card shadow-sm transition hover:bg-accent", className), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3" }) });
}
function ConditionDataPreview({ node: node2, inputSources, onPickField }) {
  const rawInput = reactExports.useMemo(() => {
    const texts = inputSources.filter((source) => source.dataType === "text" && source.value.trim()).map((source) => source.value);
    const paths = inputSources.filter((source) => source.dataType === "path" && source.value.trim()).map((source) => source.value);
    return texts.join("\n\n") || paths.join("\n");
  }, [inputSources]);
  const parsed = reactExports.useMemo(() => parseJsonCandidate(rawInput), [rawInput]);
  const fields = reactExports.useMemo(() => flattenJsonPaths(parsed), [parsed]);
  const verdict = reactExports.useMemo(() => {
    if (!rawInput.trim()) return null;
    try {
      return { ...evaluateConditionNode(node2, rawInput), error: "" };
    } catch (error) {
      return { passed: false, value: void 0, error: error instanceof Error ? error.message : String(error) };
    }
  }, [node2, rawInput]);
  if (!rawInput.trim()) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-muted/25 p-3 text-2xs leading-5 text-muted-foreground", children: "Chưa có dữ liệu từ node trước. Chạy node phía trước một lần để xem field và thử điều kiện ngay tại đây." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    fields.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs", children: [
        "Field trong dữ liệu nhận được ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-muted-foreground", children: "(bấm để dùng)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-44 overflow-y-auto rounded-xl border border-border bg-card", children: fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onPickField(field.path),
          className: cn(
            "flex w-full items-center gap-2 border-b border-border/60 px-2.5 py-1.5 text-left last:border-b-0 hover:bg-muted/40",
            (node2.field ?? "").trim() === field.path && "bg-primary/10"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 font-mono text-2xs font-semibold text-primary", children: field.path }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-right font-mono text-2xs text-muted-foreground", title: field.preview, children: field.preview })
          ]
        },
        field.path
      )) })
    ] }) : parsed !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/25 p-3 text-2xs leading-5 text-muted-foreground", children: [
      "JSON nhận được không có field con (mảng hoặc giá trị đơn). Với mảng có thể điền chỉ số, ví dụ ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: "0.title" }),
      "."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-2xs leading-5 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-amber-600 dark:text-amber-400", children: "Output của node trước không đọc được thành JSON." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: 'Điền "Trường JSON" sẽ luôn ra rỗng — hãy yêu cầu agent trả JSON thuần, hoặc để trống field để so sánh trên toàn bộ text.' }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/70 p-2 font-mono text-2xs leading-4", children: rawInput.slice(0, 400) })
    ] }),
    verdict && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
      "rounded-xl border p-3 text-2xs leading-5",
      verdict.error ? "border-destructive/40 bg-destructive/5 text-destructive" : verdict.passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"
    ), children: verdict.error ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: verdict.error }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Thử với dữ liệu hiện có: " }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("font-semibold", verdict.passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"), children: verdict.passed ? "rẽ nhánh Đúng" : "rẽ nhánh Sai" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: " · giá trị đọc được: " }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono text-2xs", children: previewJsonValue(verdict.value) })
    ] }) })
  ] });
}
function previewJsonValue(value) {
  if (value === void 0) return "không có (undefined)";
  try {
    const text2 = JSON.stringify(value);
    return text2.length > 80 ? `${text2.slice(0, 80)}…` : text2;
  } catch {
    return String(value);
  }
}
function flattenJsonPaths(value, prefix = "", depth = 0, out = []) {
  if (depth > 3 || out.length >= 50 || !value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, child] of Object.entries(value)) {
    if (out.length >= 50) break;
    const path2 = prefix ? `${prefix}.${key}` : key;
    out.push({ path: path2, preview: previewJsonValue(child) });
    flattenJsonPaths(child, path2, depth + 1, out);
  }
  return out;
}
function NodePicker({ vietnamese, query, onQueryChange, items, onPick, onClose }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "flex w-80 shrink-0 flex-col border-l border-border bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.05)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 px-4 pb-3 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "Thêm gì vào workflow?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: "Chọn một node rồi nối dữ liệu trên canvas." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-7", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { autoFocus: true, value: query, onChange: (event) => onQueryChange(event.target.value), placeholder: "Tìm node…", className: "pl-9" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4", children: ["input", "function", "agent"].map((family) => {
      const group = items.filter((item) => item.family === family);
      if (group.length === 0) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-1.5 text-2xs font-semibold text-muted-foreground", children: family === "input" ? vietnamese ? "Đầu vào" : "Input" : family === "function" ? vietnamese ? "Hàm" : "Function" : "Agent" }),
        group.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => onPick(item), className: "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: cn("size-4", item.color) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-medium", children: localizedNodeName(item.title, vietnamese) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block text-2xs text-muted-foreground", children: item.description })
          ] })
        ] }, item.id))
      ] }, family);
    }) })
  ] });
}
function NodeInspector({ inputNode, functionNode, agentNode, agents, workspacePath, inputSources, output, busy, running, onExecute, onUpdateInput, onUpdateFunction, onUpdateAgent, onCreateAgent, onUpdateAgentPreset, onDelete, onClose }) {
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const [editorTab, setEditorTab] = reactExports.useState("parameters");
  const [agentDraft, setAgentDraft] = reactExports.useState({
    name: "Agent mới",
    role: "",
    adapter: "claude",
    model: "",
    effort: "",
    systemPrompt: ""
  });
  const [agentModels, setAgentModels] = reactExports.useState([]);
  const [agentEfforts, setAgentEfforts] = reactExports.useState([]);
  const [loadingAgentOptions, setLoadingAgentOptions] = reactExports.useState(false);
  const promptRef = reactExports.useRef(null);
  const nodeId = inputNode?.id ?? functionNode?.id ?? agentNode.id;
  const rawTitle = inputNode?.name ?? functionNode?.name ?? agentNode?.name ?? "Node";
  const title = localizedNodeName(rawTitle, vietnamese);
  const family = inputNode ? vietnamese ? "Đầu vào" : "Input" : functionNode ? vietnamese ? "Hàm" : "Function" : "Agent";
  const agentOutputKind = agentNode?.outputKind ?? (agentNode?.outputFile.trim() ? "file" : "text");
  const selectedAgentPreset = agentNode ? agents.find((agent) => agent.id === agentNode.agentId) ?? null : null;
  reactExports.useEffect(() => {
    if (!selectedAgentPreset) return;
    setAgentDraft({
      name: selectedAgentPreset.name,
      role: selectedAgentPreset.role,
      adapter: selectedAgentPreset.adapter,
      model: selectedAgentPreset.model,
      effort: selectedAgentPreset.effort,
      systemPrompt: selectedAgentPreset.systemPrompt
    });
  }, [selectedAgentPreset?.id, selectedAgentPreset?.updatedAt]);
  reactExports.useEffect(() => {
    if (!agentNode) return;
    let cancelled = false;
    setLoadingAgentOptions(true);
    void getCliModels(agentDraft.adapter).then((result) => {
      if (cancelled) return;
      setAgentModels(result.models);
      setAgentEfforts(result.efforts ?? []);
    }).finally(() => {
      if (!cancelled) setLoadingAgentOptions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [agentDraft.adapter, agentNode?.id]);
  const saveAgentSettings = () => {
    if (!selectedAgentPreset) return;
    const name2 = agentDraft.name.trim();
    if (!name2) {
      toast.error(vietnamese ? "Hãy đặt tên cho Agent." : "Give the Agent a name.");
      return;
    }
    onUpdateAgentPreset(selectedAgentPreset.id, { ...agentDraft, name: name2 });
    toast.success(vietnamese ? `Đã lưu Agent “${name2}”.` : `Saved Agent “${name2}”.`);
  };
  const chooseInput = async (node2) => {
    if (!window.contentWorkspace || node2.kind === "text") return;
    try {
      const result = await window.contentWorkspace.pickInput(node2.kind, workspacePath, node2.path || null);
      if (!result.canceled && result.path) onUpdateInput(node2.id, { path: result.path });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  const insertPromptToken = (token) => {
    if (!agentNode) return;
    const textarea = promptRef.current;
    const start2 = textarea?.selectionStart ?? agentNode.prompt.length;
    const end = textarea?.selectionEnd ?? start2;
    const before = agentNode.prompt.slice(0, start2);
    const after = agentNode.prompt.slice(end);
    const spacer = before && !/\s$/.test(before) ? " " : "";
    const nextPrompt = `${before}${spacer}${token}${after}`;
    onUpdateAgent(agentNode.id, { prompt: nextPrompt });
    requestAnimationFrame(() => {
      const cursor = before.length + spacer.length + token.length;
      promptRef.current?.focus();
      promptRef.current?.setSelectionRange(cursor, cursor);
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-50 flex items-center justify-center bg-background/65 p-5 backdrop-blur-[2px]", onMouseDown: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "flex h-[88%] max-h-[820px] w-[92%] max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl", onMouseDown: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-12 shrink-0 items-center gap-3 border-b border-border px-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary", children: inputNode ? inputNode.kind === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Type, { className: "size-4" }) : inputNode.kind === "file" ? /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-4" }) : functionNode ? functionNode.kind === "condition" ? /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "size-4" }) : functionNode.kind === "loop" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat2, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Merge, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs font-semibold", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: family })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-7", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "flex min-w-0 flex-col border-r border-border bg-muted/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "border-b border-border px-4 py-3 text-2xs font-semibold text-muted-foreground", children: vietnamese ? "Đầu vào" : "Input" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: inputSources.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-md space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border bg-muted/25 px-3 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold", children: "Input" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
                inputSources.length,
                " ",
                vietnamese ? "mục" : "items"
              ] })
            ] }),
            inputSources.map((source) => {
              const SourceIcon = source.kind === "text" ? Type : source.kind === "file" ? FileText : source.kind === "folder" ? FolderOpen : Bot;
              const label = source.kind === "text" ? vietnamese ? "Văn bản" : "Text" : source.kind === "file" ? vietnamese ? "Tệp" : "File" : source.kind === "folder" ? vietnamese ? "Thư mục" : "Folder" : vietnamese ? "Kết quả bước trước" : "Previous result";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", draggable: true, onDragStart: (event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("text/plain", source.token);
              }, onDoubleClick: () => insertPromptToken(source.token), className: "group flex w-full cursor-grab items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/25 active:cursor-grabbing", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(GripVertical, { className: "size-3.5 shrink-0 text-muted-foreground/50" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SourceIcon, { className: "size-3.5 shrink-0 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs font-medium", children: label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: source.field })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[48%] truncate rounded-lg bg-muted px-2 py-1 text-2xs text-muted-foreground", title: source.value, children: source.value || (vietnamese ? "Chưa có dữ liệu" : "No data") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-primary/10 px-1.5 py-0.5 font-mono text-2xs text-primary", children: source.dataType })
              ] }, source.id);
            })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-1 text-2xs leading-4 text-muted-foreground", children: vietnamese ? "Kéo một mục sang ô Chỉ dẫn, hoặc nhấp đúp để chèn." : "Drag an item into Prompt, or double-click to insert it." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium", children: vietnamese ? "Không có dữ liệu đầu vào" : "No input data" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: vietnamese ? "Đóng cửa sổ và kéo dây từ node Input vào Agent." : "Close this window and connect an Input node to the Agent." })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "flex min-w-0 flex-col bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-12 shrink-0 items-end justify-between border-b border-border px-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setEditorTab("parameters"), className: cn("h-full border-b-2 px-3 text-xs font-medium", editorTab === "parameters" ? "border-primary text-primary" : "border-transparent text-muted-foreground"), children: vietnamese ? "Tham số" : "Parameters" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setEditorTab("settings"), className: cn("h-full border-b-2 px-3 text-xs font-medium", editorTab === "settings" ? "border-primary text-primary" : "border-transparent text-muted-foreground"), children: vietnamese ? "Cài đặt" : "Settings" })
          ] }),
          (agentNode || functionNode) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "mb-2 h-7 bg-primary text-2xs text-primary-foreground hover:bg-primary/90", onClick: onExecute, disabled: busy, children: [
            running ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-3 fill-current" }),
            " ",
            running ? vietnamese ? "Đang chạy…" : "Running…" : vietnamese ? "Chạy node" : "Execute node"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 space-y-4 overflow-y-auto p-4", children: editorTab === "settings" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Tên node" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: title, onChange: (event) => inputNode ? onUpdateInput(inputNode.id, { name: event.target.value }) : functionNode ? onUpdateFunction(functionNode.id, { name: event.target.value }) : onUpdateAgent(agentNode.id, { name: event.target.value }) })
          ] }),
          agentNode && selectedAgentPreset && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: vietnamese ? "Tên Agent" : "Agent name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: agentDraft.name, maxLength: 60, onChange: (event) => setAgentDraft((draft) => ({ ...draft, name: event.target.value })) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: vietnamese ? "Vai trò" : "Role" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: agentDraft.role, maxLength: 120, placeholder: vietnamese ? "Ví dụ: nghiên cứu" : "Example: researcher", onChange: (event) => setAgentDraft((draft) => ({ ...draft, role: event.target.value })) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: "CLI" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: agentDraft.adapter, onValueChange: (value) => setAgentDraft((draft) => ({ ...draft, adapter: value, model: "", effort: "" })), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.keys(ADAPTER_LABELS).map((adapter) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: adapter, children: ADAPTER_LABELS[adapter] }, adapter)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: "Model" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: agentDraft.model || "__default", onValueChange: (value) => setAgentDraft((draft) => ({ ...draft, model: value === "__default" ? "" : value })), disabled: loadingAgentOptions, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: loadingAgentOptions ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: vietnamese ? "Mặc định" : "Default" }),
                    agentModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: model }, model))
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: vietnamese ? "Suy luận" : "Reasoning" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: agentDraft.effort || "__default", onValueChange: (value) => setAgentDraft((draft) => ({ ...draft, effort: value === "__default" ? "" : value })), disabled: loadingAgentOptions || agentEfforts.length === 0, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 text-xs", children: loadingAgentOptions ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: vietnamese ? "Mặc định" : "Default" }),
                    agentEfforts.map((effort) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: effort, children: effort }, effort))
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-2xs", children: "System prompt" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: agentDraft.systemPrompt, onChange: (event) => setAgentDraft((draft) => ({ ...draft, systemPrompt: event.target.value })), placeholder: vietnamese ? "Agent này là ai, làm gì, và không được làm gì?" : "Who is this Agent, what does it do, and what must it avoid?", className: "min-h-36 resize-y font-mono text-2xs leading-4" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", size: "sm", className: "w-full", onClick: saveAgentSettings, children: vietnamese ? "Lưu cài đặt Agent" : "Save Agent settings" })
          ] }),
          agentNode && !selectedAgentPreset && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "w-full", onClick: () => {
            const id2 = onCreateAgent();
            onUpdateAgent(agentNode.id, { agentId: id2 });
          }, children: vietnamese ? "Tạo Agent cho node này" : "Create an Agent for this node" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "w-full text-destructive hover:bg-destructive/10 hover:text-destructive", onClick: () => onDelete(nodeId), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
            " Xóa node"
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          inputNode && (inputNode.kind === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Nội dung" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: inputNode.value, onChange: (event) => onUpdateInput(inputNode.id, { value: event.target.value }), placeholder: "Nhập nội dung đầu vào…", className: "min-h-56 resize-y" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: inputNode.kind === "file" ? "File đầu vào" : "Folder đầu vào" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void chooseInput(inputNode), className: "flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-left transition hover:border-primary hover:bg-primary/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500", children: inputNode.kind === "file" ? /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs font-medium", children: inputNode.path.split(/[\\/]/).filter(Boolean).pop() || (inputNode.kind === "file" ? "Chọn file" : "Chọn folder") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block text-2xs text-muted-foreground", children: inputNode.path ? "Nhấn để chọn lại" : "Mở trình chọn trên máy" })
              ] })
            ] }),
            inputNode.path && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 w-full text-xs text-muted-foreground", onClick: () => onUpdateInput(inputNode.id, { path: "" }), children: "Bỏ lựa chọn" })
          ] })),
          functionNode?.kind === "merge" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/25 p-3 text-2xs leading-5 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Merge, { className: "mr-1 inline size-3.5" }),
            vietnamese ? "Node Gộp nhận nhiều kết nối và chuyển toàn bộ dữ liệu sang node tiếp theo." : "Merge accepts multiple connections and passes all data to the next node."
          ] }),
          functionNode?.kind === "condition" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-2xs leading-5 text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { className: "mr-1 inline size-3.5 text-violet-500" }),
              "Đọc dữ liệu đầu vào rồi chỉ kích hoạt một cổng Đúng hoặc Sai."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionDataPreview, { node: functionNode, inputSources, onPickField: (path2) => onUpdateFunction(functionNode.id, { field: path2 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs", children: [
                "Trường JSON ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-muted-foreground", children: "(không bắt buộc)" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: functionNode.field ?? "", onChange: (event) => onUpdateFunction(functionNode.id, { field: event.target.value }), placeholder: "Ví dụ: result.passed hoặc score" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Để trống để so sánh toàn bộ text đầu vào." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Điều kiện" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: functionNode.operator ?? "truthy", onValueChange: (value) => onUpdateFunction(functionNode.id, { operator: value }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "truthy", children: "Có giá trị / true" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "exists", children: "Trường tồn tại" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "equals", children: "Bằng" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "notEquals", children: "Không bằng" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "contains", children: "Có chứa" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "notContains", children: "Không chứa" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "regex", children: "Khớp Regex" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gt", children: "Lớn hơn" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "gte", children: "Lớn hơn hoặc bằng" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lt", children: "Nhỏ hơn" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "lte", children: "Nhỏ hơn hoặc bằng" })
                ] })
              ] })
            ] }),
            functionNode.operator !== "truthy" && functionNode.operator !== "exists" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Giá trị so sánh" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: functionNode.compareValue ?? "", onChange: (event) => onUpdateFunction(functionNode.id, { compareValue: event.target.value }), placeholder: functionNode.operator === "regex" ? "^PASS$" : "true" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Giới hạn số lần đánh giá" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, max: 60, value: functionNode.maxIterations ?? 10, onChange: (event) => onUpdateFunction(functionNode.id, { maxIterations: Math.max(1, Math.min(60, Number(event.target.value) || 1)) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Chặn dây quay ngược lặp vô hạn khi điều kiện không bao giờ đổi." })
            ] })
          ] }),
          functionNode?.kind === "loop" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 text-2xs leading-5 text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat2, { className: "mr-1 inline size-3.5 text-cyan-500" }),
              "Mỗi lần nhận dữ liệu, node đi qua cổng Lặp. Khi đủ lượt, nó chuyển sang cổng Xong."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Số lượt quay lại" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, max: 60, value: functionNode.maxIterations ?? 3, onChange: (event) => onUpdateFunction(functionNode.id, { maxIterations: Math.max(1, Math.min(60, Number(event.target.value) || 1)) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Ví dụ 3 nghĩa là chạy nhánh Lặp tối đa 3 lần, lần tiếp theo đi qua nhánh Xong." })
            ] })
          ] }),
          agentNode && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Agent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: agentNode.agentId || "__none", onValueChange: (value) => {
                if (value === "__create") {
                  const id2 = onCreateAgent();
                  onUpdateAgent(agentNode.id, { agentId: id2 });
                  setEditorTab("settings");
                  return;
                }
                onUpdateAgent(agentNode.id, { agentId: value === "__none" ? "" : value });
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: "__none", children: [
                    "— ",
                    vietnamese ? "chưa chọn" : "not selected",
                    " —"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__create", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 font-medium text-primary", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3.5" }),
                    vietnamese ? "Tạo Agent mới…" : "Create new Agent…"
                  ] }) }),
                  agents.map((agent) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: agent.id, children: agent.name }, agent.id))
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: vietnamese ? "Chọn Agent dùng lại, hoặc tạo mới rồi cấu hình trong tab Cài đặt." : "Reuse an Agent, or create one and configure it in Settings." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: vietnamese ? "Chỉ dẫn" : "Prompt" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { ref: promptRef, value: agentNode.prompt, onChange: (event) => onUpdateAgent(agentNode.id, { prompt: event.target.value }), onDragOver: (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }, onDrop: (event) => {
                event.preventDefault();
                const token = event.dataTransfer.getData("text/plain");
                if (token) insertPromptToken(token);
              }, placeholder: "Agent này cần làm gì với input được nối vào?", className: "min-h-48 resize-y border-dashed font-mono text-xs leading-5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: vietnamese ? "Có thể kéo trường dữ liệu từ cột Đầu vào sang đây." : "Drag fields from the Input panel into this prompt." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: vietnamese ? "Kiểu đầu ra" : "Output type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: agentOutputKind, onValueChange: (value) => onUpdateAgent(agentNode.id, { outputKind: value, outputFile: value === "text" ? "" : agentNode.outputFile }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text", children: vietnamese ? "Phản hồi trực tiếp" : "Direct response" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "file", children: vietnamese ? "Tệp bất kỳ" : "File" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "folder", children: vietnamese ? "Thư mục" : "Folder" })
                ] })
              ] })
            ] }),
            agentOutputKind !== "text" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: agentOutputKind === "folder" ? vietnamese ? "Tên thư mục đầu ra" : "Output folder" : vietnamese ? "Tên tệp đầu ra" : "Output file name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: agentNode.outputFile, onChange: (event) => onUpdateAgent(agentNode.id, { outputFile: event.target.value }), placeholder: agentOutputKind === "folder" ? "ket-qua/" : "ket-qua.json" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: vietnamese ? "Có thể dùng bất kỳ tên và định dạng nào, không bắt buộc .md." : "Any name or format is allowed; Markdown is not required." })
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "flex min-w-0 flex-col bg-muted/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "border-b border-border px-4 py-3 text-2xs font-semibold text-muted-foreground", children: vietnamese ? "Đầu ra" : "Output" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-0 flex-1 items-center justify-center p-5", children: output ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "max-h-full w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-3 font-mono text-2xs leading-5", children: output }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium", children: "Chưa có dữ liệu đầu ra" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: agentNode ? vietnamese ? "Chạy node để xem kết quả." : "Execute the node to see its output." : vietnamese ? "Chạy quy trình để xem kết quả." : "Execute the workflow to see its output." })
        ] }) })
      ] })
    ] })
  ] }) });
}
const nodeTypes = { buzzNode: BuzzGraphNode };
const edgeTypes = { buzzEdge: BuzzGraphEdge };
function PipelineEditor({ pipeline, run, busy, runningNodeId, resultPanelOpen, onExecute, onExecuteNode, onStop }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReactFlowProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PipelineCanvas, { pipeline, run, busy, runningNodeId, resultPanelOpen, onExecute, onExecuteNode, onStop }) });
}
function PipelineCanvas({ pipeline, run, busy, runningNodeId, resultPanelOpen, onExecute, onExecuteNode, onStop }) {
  const { agents, runs, createAgent, updateAgent: updateAgentPreset, updatePipeline } = useBuzzStore();
  const { locale } = useI18n();
  const vietnamese = locale.toLocaleLowerCase().startsWith("vi");
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = reactExports.useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [selectedEdgeId, setSelectedEdgeId] = reactExports.useState(null);
  const [panelMode, setPanelMode] = reactExports.useState(null);
  const [pendingSource, setPendingSource] = reactExports.useState(null);
  const [query, setQuery] = reactExports.useState("");
  const inputs = pipeline.inputNodes ?? [];
  const functions = pipeline.functionNodes ?? [];
  const connections = pipeline.connections ?? [];
  const runForPipeline = run?.pipelineId === pipeline.id ? run : null;
  const latestNodeOutputs = reactExports.useMemo(() => {
    const result = /* @__PURE__ */ new Map();
    for (const item of runs) {
      if (item.pipelineId !== pipeline.id) continue;
      for (const step of item.steps) if (step.output && !result.has(step.stepId)) result.set(step.stepId, step.output);
    }
    return result;
  }, [pipeline.id, runs]);
  const totalNodes = inputs.length + functions.length + pipeline.steps.length;
  reactExports.useEffect(() => {
    setSelectedNodeId(null);
    setSelectedNodeIds(/* @__PURE__ */ new Set());
    setSelectedEdgeId(null);
    setPendingSource(null);
    setPanelMode(null);
  }, [pipeline.id]);
  const openPicker = reactExports.useCallback((sourceId, sourceHandle) => {
    setPendingSource(sourceId ? { id: sourceId, handle: sourceHandle } : null);
    setQuery("");
    setPanelMode("picker");
  }, []);
  const openInspector = reactExports.useCallback((id2) => {
    setSelectedNodeId(id2);
    setSelectedNodeIds(/* @__PURE__ */ new Set([id2]));
    setPanelMode("inspector");
  }, []);
  const removeNode = reactExports.useCallback((id2) => {
    updatePipeline(pipeline.id, {
      inputNodes: inputs.filter((item) => item.id !== id2),
      functionNodes: functions.filter((item) => item.id !== id2),
      steps: pipeline.steps.filter((item) => item.id !== id2),
      connections: connections.filter((item) => item.source !== id2 && item.target !== id2)
    });
    setSelectedNodeId(null);
    setSelectedNodeIds((current) => {
      const next = new Set(current);
      next.delete(id2);
      return next;
    });
    setPanelMode(null);
  }, [connections, functions, inputs, pipeline.id, pipeline.steps, updatePipeline]);
  const buildNodes = reactExports.useCallback(() => {
    const inputNodes = inputs.map((item) => ({
      id: item.id,
      type: "buzzNode",
      position: item.position,
      selected: selectedNodeIds.has(item.id),
      deletable: false,
      data: {
        family: "input",
        kind: item.kind,
        title: localizedNodeName(item.name, vietnamese),
        subtitle: item.kind === "text" ? item.value.trim() ? "Đã có nội dung" : "Chưa có nội dung" : item.path.split(/[\\/]/).filter(Boolean).pop() || (item.kind === "file" ? "Chưa chọn file" : "Chưa chọn folder"),
        runningLabel: vietnamese ? "Đang chạy…" : "Running…",
        status: "pending",
        onAddNext: () => openPicker(item.id),
        onOpen: () => openInspector(item.id),
        onDelete: () => removeNode(item.id),
        onRun: () => {
        }
      }
    }));
    const functionNodes = functions.map((item) => {
      const runStep = runForPipeline?.steps.find((step) => step.stepId === item.id);
      return {
        id: item.id,
        type: "buzzNode",
        position: item.position,
        selected: selectedNodeIds.has(item.id),
        deletable: false,
        data: {
          family: "function",
          kind: item.kind,
          title: localizedNodeName(item.name, vietnamese),
          subtitle: item.kind === "condition" ? vietnamese ? "Rẽ nhánh Đúng / Sai" : "Branch True / False" : item.kind === "loop" ? vietnamese ? `Lặp tối đa ${item.maxIterations ?? 3} lượt` : `Repeat up to ${item.maxIterations ?? 3} times` : vietnamese ? "Gộp mọi đầu vào" : "Merge all inputs",
          runningLabel: vietnamese ? "Đang xử lý…" : "Processing…",
          status: runStep?.status ?? "pending",
          onAddNext: (handle2) => openPicker(item.id, handle2),
          onOpen: () => openInspector(item.id),
          onDelete: () => removeNode(item.id),
          onRun: () => onExecuteNode(item.id)
        }
      };
    });
    const agentNodes = pipeline.steps.map((step) => {
      const runStep = runForPipeline?.steps.find((item) => item.stepId === step.id);
      const agent = agents.find((item) => item.id === step.agentId);
      return {
        id: step.id,
        type: "buzzNode",
        position: step.position ?? { x: 80, y: 120 },
        selected: selectedNodeIds.has(step.id),
        deletable: false,
        data: {
          family: "agent",
          kind: "agent",
          title: localizedNodeName(step.name || "Agent", vietnamese),
          subtitle: agent ? `${agent.name} · ${agent.adapter}` : "Chưa gán agent",
          runningLabel: vietnamese ? "Đang chạy…" : "Running…",
          status: runStep?.status ?? "pending",
          onAddNext: () => openPicker(step.id),
          onOpen: () => openInspector(step.id),
          onDelete: () => removeNode(step.id),
          onRun: () => onExecuteNode(step.id)
        }
      };
    });
    return [...inputNodes, ...functionNodes, ...agentNodes];
  }, [agents, functions, inputs, onExecuteNode, openInspector, openPicker, pipeline.steps, removeNode, runForPipeline?.steps, selectedNodeIds, vietnamese]);
  const [nodes, setNodes] = reactExports.useState(buildNodes);
  const nodesRef = reactExports.useRef(nodes);
  reactExports.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  reactExports.useEffect(() => {
    const nextNodes = buildNodes();
    setNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node2) => [node2.id, node2]));
      return nextNodes.map((nextNode) => {
        const currentNode = currentById.get(nextNode.id);
        if (!currentNode) return nextNode;
        return {
          ...currentNode,
          position: nextNode.position,
          selected: nextNode.selected,
          deletable: nextNode.deletable,
          data: nextNode.data
        };
      });
    });
  }, [buildNodes]);
  const fitAllNodes = reactExports.useCallback((duration = 300) => {
    const currentNodes = nodesRef.current;
    if (currentNodes.length === 0) return;
    void fitView({
      nodes: currentNodes.map(({ id: id2 }) => ({ id: id2 })),
      padding: 0.22,
      maxZoom: 1.1,
      duration
    });
  }, [fitView]);
  reactExports.useEffect(() => {
    let timer2;
    const frame2 = requestAnimationFrame(() => {
      timer2 = window.setTimeout(() => fitAllNodes(250), 40);
    });
    return () => {
      cancelAnimationFrame(frame2);
      if (timer2 !== void 0) window.clearTimeout(timer2);
    };
  }, [fitAllNodes, resultPanelOpen]);
  const deleteConnection = reactExports.useCallback((id2) => {
    if (busy) return;
    updatePipeline(pipeline.id, { connections: connections.filter((connection) => connection.id !== id2) });
    setSelectedEdgeId(null);
  }, [busy, connections, pipeline.id, updatePipeline]);
  reactExports.useEffect(() => {
    if (selectedEdgeId && !connections.some((connection) => connection.id === selectedEdgeId)) setSelectedEdgeId(null);
  }, [connections, selectedEdgeId]);
  reactExports.useEffect(() => {
    if (!selectedEdgeId || busy) return;
    const handleDeleteKey = (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      deleteConnection(selectedEdgeId);
    };
    window.addEventListener("keydown", handleDeleteKey);
    return () => window.removeEventListener("keydown", handleDeleteKey);
  }, [busy, deleteConnection, selectedEdgeId]);
  const edges = reactExports.useMemo(() => connections.map((connection) => {
    const branchLabel = connection.sourceHandle === "true" ? vietnamese ? "Đúng" : "True" : connection.sourceHandle === "false" ? vietnamese ? "Sai" : "False" : connection.sourceHandle === "loop" ? vietnamese ? "Lặp" : "Loop" : connection.sourceHandle === "done" ? vietnamese ? "Xong" : "Done" : void 0;
    const branchTone = connection.sourceHandle === "true" ? "success" : connection.sourceHandle === "false" ? "danger" : connection.sourceHandle === "loop" ? "loop" : connection.sourceHandle === "done" ? "done" : void 0;
    return {
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? void 0,
      type: "buzzEdge",
      markerEnd: { type: MarkerType.ArrowClosed },
      deletable: !busy,
      selectable: !busy,
      selected: selectedEdgeId === connection.id,
      interactionWidth: 36,
      data: { onDelete: deleteConnection, branchLabel, branchTone },
      style: { stroke: connection.loop ? "hsl(var(--primary) / 0.8)" : "hsl(var(--muted-foreground) / 0.75)", strokeWidth: connection.loop ? 2 : 1.75, strokeDasharray: connection.loop ? "6 4" : void 0 }
    };
  }), [busy, connections, deleteConnection, selectedEdgeId, vietnamese]);
  const nodeExists = reactExports.useCallback((id2) => inputs.some((item) => item.id === id2) || functions.some((item) => item.id === id2) || pipeline.steps.some((item) => item.id === id2), [functions, inputs, pipeline.steps]);
  const wouldCreateCycle = reactExports.useCallback((source, target) => {
    const outgoing = /* @__PURE__ */ new Map();
    for (const connection of connections) {
      outgoing.set(connection.source, [...outgoing.get(connection.source) ?? [], connection.target]);
    }
    const stack = [target];
    const visited = /* @__PURE__ */ new Set();
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === source) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      stack.push(...outgoing.get(current) ?? []);
    }
    return false;
  }, [connections]);
  const isValidConnection = reactExports.useCallback((connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return false;
    if (!nodeExists(connection.source) || !nodeExists(connection.target)) return false;
    if (inputs.some((item) => item.id === connection.target)) return false;
    if (connections.some((item) => item.source === connection.source && item.target === connection.target && (item.sourceHandle ?? null) === (connection.sourceHandle ?? null))) return false;
    const createsCycle = wouldCreateCycle(connection.source, connection.target);
    if (!createsCycle) return true;
    const sourceFunction = functions.find((item) => item.id === connection.source);
    const targetFunction = functions.find((item) => item.id === connection.target);
    if (sourceFunction?.kind === "condition") return true;
    if (sourceFunction?.kind === "loop" && connection.sourceHandle === "loop") return true;
    return targetFunction?.kind === "loop";
  }, [connections, functions, inputs, nodeExists, wouldCreateCycle]);
  const addConnection = reactExports.useCallback((source, target, sourceHandle) => {
    const connection = {
      id: generateUUID(),
      source,
      target,
      sourceHandle: sourceHandle ?? null,
      loop: wouldCreateCycle(source, target)
    };
    updatePipeline(pipeline.id, { connections: [...connections, connection] });
  }, [connections, pipeline.id, updatePipeline, wouldCreateCycle]);
  const onConnect = reactExports.useCallback((connection) => {
    if (!isValidConnection(connection)) {
      toast.error("Không thể tạo connection này.");
      return;
    }
    addConnection(connection.source, connection.target, connection.sourceHandle);
  }, [addConnection, isValidConnection]);
  const nextPosition = reactExports.useCallback(() => {
    if (pendingSource) {
      const source = nodes.find((node2) => node2.id === pendingSource.id);
      if (source) {
        const branchOffset = pendingSource.handle === "true" || pendingSource.handle === "loop" ? -110 : pendingSource.handle === "false" || pendingSource.handle === "done" ? 110 : 0;
        return { x: source.position.x + 260, y: source.position.y + branchOffset };
      }
    }
    return { x: 80 + totalNodes % 3 * 260, y: 100 + Math.floor(totalNodes / 3) * 190 };
  }, [nodes, pendingSource, totalNodes]);
  const addNode2 = reactExports.useCallback((item) => {
    const position2 = nextPosition();
    let newId2 = "";
    if (item.id === "agent") {
      const agentId = createAgent();
      const step = newStep(agentId, pipeline.steps.length);
      newId2 = step.id;
      updatePipeline(pipeline.id, {
        steps: [...pipeline.steps, { ...step, name: "Agent", position: position2, topicInput: false, gate: { ...step.gate, kind: "none" } }]
      });
    } else if (item.family === "input") {
      const kind = item.id.replace("input-", "");
      const node2 = { id: generateUUID(), type: "input", kind, name: item.title, position: position2, value: "", path: "" };
      newId2 = node2.id;
      updatePipeline(pipeline.id, { inputNodes: [...inputs, node2] });
    } else {
      const kind = item.id === "function-condition" ? "condition" : item.id === "function-loop" ? "loop" : "merge";
      const node2 = {
        id: generateUUID(),
        type: "function",
        kind,
        name: kind === "condition" ? "If" : kind === "loop" ? "Loop" : "Merge",
        position: position2,
        field: "",
        operator: "truthy",
        compareValue: "",
        maxIterations: 3
      };
      newId2 = node2.id;
      updatePipeline(pipeline.id, { functionNodes: [...functions, node2] });
    }
    if (pendingSource && pendingSource.id !== newId2) addConnection(pendingSource.id, newId2, pendingSource.handle);
    setSelectedNodeId(newId2);
    setSelectedNodeIds(/* @__PURE__ */ new Set([newId2]));
    setPendingSource(null);
    setPanelMode("inspector");
  }, [addConnection, createAgent, functions, inputs, nextPosition, pendingSource, pipeline.id, pipeline.steps, updatePipeline]);
  const updateInputNode = reactExports.useCallback((id2, patch2) => {
    updatePipeline(pipeline.id, { inputNodes: inputs.map((item) => item.id === id2 ? { ...item, ...patch2 } : item) });
  }, [inputs, pipeline.id, updatePipeline]);
  const updateFunctionNode = reactExports.useCallback((id2, patch2) => {
    updatePipeline(pipeline.id, { functionNodes: functions.map((item) => item.id === id2 ? { ...item, ...patch2 } : item) });
  }, [functions, pipeline.id, updatePipeline]);
  const updateAgentNode = reactExports.useCallback((id2, patch2) => {
    updatePipeline(pipeline.id, { steps: pipeline.steps.map((item) => item.id === id2 ? { ...item, ...patch2 } : item) });
  }, [pipeline.id, pipeline.steps, updatePipeline]);
  const onNodesChange = reactExports.useCallback((changes) => {
    const selectionChanges = changes.filter((change) => change.type === "select");
    if (selectionChanges.length > 0) {
      setSelectedNodeIds((current) => {
        const next = new Set(current);
        for (const change of selectionChanges) {
          if (change.selected) next.add(change.id);
          else next.delete(change.id);
        }
        return next;
      });
    }
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);
  const autoLayout = reactExports.useCallback(() => {
    const order2 = [...inputs, ...functions, ...pipeline.steps];
    const ids = new Set(order2.map((item) => item.id));
    const forward = connections.filter((connection) => !connection.loop && ids.has(connection.source) && ids.has(connection.target));
    const incoming = new Map(order2.map((item) => [item.id, 0]));
    const outgoing = /* @__PURE__ */ new Map();
    for (const connection of forward) {
      incoming.set(connection.target, (incoming.get(connection.target) ?? 0) + 1);
      outgoing.set(connection.source, [...outgoing.get(connection.source) ?? [], connection.target]);
    }
    const queue = order2.filter((item) => (incoming.get(item.id) ?? 0) === 0).map((item) => item.id);
    const depth = new Map(queue.map((id2) => [id2, 0]));
    while (queue.length > 0) {
      const id2 = queue.shift();
      for (const target of outgoing.get(id2) ?? []) {
        depth.set(target, Math.max(depth.get(target) ?? 0, (depth.get(id2) ?? 0) + 1));
        const nextIncoming = (incoming.get(target) ?? 1) - 1;
        incoming.set(target, nextIncoming);
        if (nextIncoming === 0) queue.push(target);
      }
    }
    const groups = /* @__PURE__ */ new Map();
    for (const item of order2) {
      const level = depth.get(item.id) ?? 0;
      groups.set(level, [...groups.get(level) ?? [], item.id]);
    }
    const positions = /* @__PURE__ */ new Map();
    for (const [level, group] of groups) {
      group.forEach((id2, index2) => positions.set(id2, { x: 80 + level * 260, y: 100 + (index2 - (group.length - 1) / 2) * 190 }));
    }
    updatePipeline(pipeline.id, {
      inputNodes: inputs.map((item) => ({ ...item, position: positions.get(item.id) })),
      functionNodes: functions.map((item) => ({ ...item, position: positions.get(item.id) })),
      steps: pipeline.steps.map((item) => ({ ...item, position: positions.get(item.id) }))
    });
    requestAnimationFrame(() => fitAllNodes(300));
  }, [connections, fitAllNodes, functions, inputs, pipeline.id, pipeline.steps, updatePipeline]);
  const selectedInput = inputs.find((item) => item.id === selectedNodeId) ?? null;
  const selectedFunction = functions.find((item) => item.id === selectedNodeId) ?? null;
  const selectedAgent = pipeline.steps.find((item) => item.id === selectedNodeId) ?? null;
  const filteredItems = PICKER_ITEMS.filter((item) => !query.trim() || `${item.title} ${item.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const editorInputSources = reactExports.useMemo(() => {
    if (!selectedNodeId) return [];
    const result = [];
    const visited = /* @__PURE__ */ new Set();
    const visit2 = (id2) => {
      if (visited.has(id2)) return;
      visited.add(id2);
      const input = inputs.find((item) => item.id === id2);
      if (input) {
        result.push({
          id: input.id,
          kind: input.kind,
          field: input.kind === "text" ? vietnamese ? "nội dung" : "content" : vietnamese ? "đường dẫn" : "path",
          dataType: input.kind === "text" ? "text" : "path",
          value: input.kind === "text" ? input.value : input.path,
          token: `{{node:${input.id}}}`
        });
        return;
      }
      const sourceAgent = pipeline.steps.find((item) => item.id === id2);
      if (sourceAgent) {
        const outputKind = sourceAgent.outputKind ?? (sourceAgent.outputFile.trim() ? "file" : "text");
        result.push({ id: sourceAgent.id, kind: "agent", field: outputKind === "text" ? vietnamese ? "kết quả trước" : "previous result" : outputKind === "folder" ? vietnamese ? "thư mục đầu ra" : "output folder" : vietnamese ? "tệp đầu ra" : "output file", dataType: outputKind === "text" ? "text" : "path", value: outputKind === "text" ? latestNodeOutputs.get(sourceAgent.id) ?? "" : sourceAgent.outputFile, token: `{{node:${sourceAgent.id}}}` });
        return;
      }
      if (functions.some((item) => item.id === id2)) {
        connections.filter((connection) => connection.target === id2).forEach((connection) => visit2(connection.source));
      }
    };
    connections.filter((connection) => connection.target === selectedNodeId).forEach((connection) => visit2(connection.source));
    return result;
  }, [connections, functions, inputs, latestNodeOutputs, pipeline.steps, selectedNodeId, vietnamese]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex h-full min-h-0 bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1", children: [
      totalNodes === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => openPicker(), className: "pointer-events-auto group text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-36 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/70 bg-card/40 text-muted-foreground shadow-sm transition group-hover:border-primary group-hover:text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-14 stroke-[1.5]" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-4 block text-lg font-medium", children: "Thêm node đầu tiên…" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        index$2,
        {
          nodes,
          edges,
          nodeTypes,
          edgeTypes,
          onNodesChange,
          nodesDraggable: !busy,
          nodesConnectable: !busy,
          panOnDrag: false,
          panActivationKeyCode: "Space",
          selectionOnDrag: !busy,
          selectionMode: SelectionMode.Partial,
          onSelectionStart: () => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setPanelMode(null);
          },
          onNodeClick: (_event, node2) => {
            setSelectedEdgeId(null);
            setSelectedNodeId(node2.id);
            setSelectedNodeIds(/* @__PURE__ */ new Set([node2.id]));
            setPanelMode(null);
          },
          onNodeDoubleClick: (_event, node2) => openInspector(node2.id),
          onEdgeClick: (event, edge) => {
            if (busy) return;
            event.stopPropagation();
            setSelectedNodeId(null);
            setSelectedNodeIds(/* @__PURE__ */ new Set());
            setPanelMode(null);
            setSelectedEdgeId(edge.id);
          },
          onPaneClick: () => {
            setSelectedNodeId(null);
            setSelectedNodeIds(/* @__PURE__ */ new Set());
            setSelectedEdgeId(null);
            setPanelMode(null);
          },
          onNodeDragStop: (_event, node2) => {
            const positions = new Map(
              nodesRef.current.filter((item) => item.selected || item.id === node2.id).map((item) => [item.id, item.id === node2.id ? node2.position : item.position])
            );
            updatePipeline(pipeline.id, {
              inputNodes: inputs.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id) } : item),
              functionNodes: functions.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id) } : item),
              steps: pipeline.steps.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id) } : item)
            });
          },
          onConnect,
          isValidConnection,
          onEdgesDelete: (deleted) => {
            if (!busy) updatePipeline(pipeline.id, { connections: connections.filter((item) => !deleted.some((edge) => edge.id === item.id)) });
          },
          deleteKeyCode: ["Backspace", "Delete"],
          fitView: true,
          fitViewOptions: { padding: 0.3, maxZoom: 1.1 },
          minZoom: 0.25,
          maxZoom: 1.8,
          connectionLineType: ConnectionLineType.Bezier,
          connectionLineStyle: { stroke: "hsl(var(--primary))", strokeWidth: 1.75 },
          proOptions: { hideAttribution: true },
          className: "bg-background",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Background, { gap: 20, size: 1, color: "hsl(var(--border))" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { position: "bottom-left", className: "m-3 flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasControl, { title: "Vừa màn hình", onClick: () => fitAllNodes(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize, { className: "size-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasControl, { title: "Phóng to", onClick: () => void zoomIn({ duration: 150 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomIn, { className: "size-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasControl, { title: "Thu nhỏ", onClick: () => void zoomOut({ duration: 150 }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ZoomOut, { className: "size-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CanvasControl, { title: "Xếp tự động", onClick: autoLayout, disabled: totalNodes === 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Paintbrush, { className: "size-4" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Panel, { position: "bottom-center", className: "m-4", children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-10 px-5 shadow-lg", onClick: onStop, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
              " ",
              vietnamese ? "Đang chạy…" : "Running…"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-10 px-5 shadow-lg", onClick: onExecute, disabled: pipeline.steps.length === 0, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "size-4 fill-current" }),
              " ",
              vietnamese ? "Chạy quy trình" : "Execute workflow"
            ] }) })
          ]
        }
      )
    ] }),
    panelMode === "picker" && /* @__PURE__ */ jsxRuntimeExports.jsx(NodePicker, { vietnamese, query, onQueryChange: setQuery, items: filteredItems, onPick: addNode2, onClose: () => {
      setPanelMode(null);
      setPendingSource(null);
    } }),
    panelMode === "inspector" && (selectedInput || selectedFunction || selectedAgent) && /* @__PURE__ */ jsxRuntimeExports.jsx(
      NodeInspector,
      {
        inputNode: selectedInput,
        functionNode: selectedFunction,
        agentNode: selectedAgent,
        agents,
        workspacePath: pipeline.workspacePath,
        onUpdateInput: updateInputNode,
        onUpdateFunction: updateFunctionNode,
        onUpdateAgent: updateAgentNode,
        onCreateAgent: createAgent,
        onUpdateAgentPreset: updateAgentPreset,
        inputSources: editorInputSources,
        output: selectedAgent ? latestNodeOutputs.get(selectedAgent.id) ?? "" : selectedFunction ? latestNodeOutputs.get(selectedFunction.id) ?? "" : selectedInput?.kind === "text" ? selectedInput.value : selectedInput?.path ?? "",
        busy,
        running: Boolean((selectedAgent ?? selectedFunction) && busy && runningNodeId === (selectedAgent ?? selectedFunction)?.id),
        onExecute: () => {
          const target = selectedAgent ?? selectedFunction;
          if (target) onExecuteNode(target.id);
        },
        onDelete: removeNode,
        onClose: () => {
          setPanelMode(null);
          setSelectedNodeId(null);
        }
      }
    )
  ] });
}
const STATUS_META = {
  pending: { icon: CircleDashed, className: "text-muted-foreground", label: "Chờ" },
  running: { icon: LoaderCircle, className: "text-primary animate-spin", label: "Đang chạy" },
  checking: { icon: ScanEye, className: "text-amber-500", label: "Đang xác minh" },
  awaiting: { icon: UserCheck, className: "text-amber-500", label: "Chờ bạn duyệt" },
  passed: { icon: CircleCheck, className: "text-emerald-500", label: "Đạt" },
  failed: { icon: CircleX, className: "text-destructive", label: "Không đạt" },
  skipped: { icon: CircleAlert, className: "text-muted-foreground", label: "Bỏ qua" }
};
function RunView({
  run,
  liveOutput,
  onOpenFile
}) {
  const { pipelines } = useBuzzStore();
  const [rejectReason, setRejectReason] = reactExports.useState("");
  const [expandedStepId, setExpandedStepId] = reactExports.useState("");
  const endRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [run?.currentStepId, liveOutput?.text]);
  if (!run) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center px-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Chưa có lần chạy nào" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-muted-foreground", children: "Chuẩn bị các Input node trên canvas rồi bấm Chạy. Tiến trình từng agent sẽ hiện ở đây." })
    ] }) });
  }
  const pipeline = pipelines.find((item) => item.id === run.pipelineId);
  const awaitingStep = run.steps.find((step) => step.status === "awaiting");
  const agentStepIds = new Set(pipeline?.steps.map((step) => step.id) ?? []);
  const finalStep = [...run.steps].reverse().find((step) => agentStepIds.has(step.stepId) && (step.output || step.status === "passed"));
  const finalStepConfig = pipeline?.steps.find((step) => step.id === finalStep?.stepId);
  const finalOutputKind = finalStepConfig?.outputKind ?? (finalStepConfig?.outputFile?.trim() ? "file" : "text");
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-4xl space-y-3 px-6 py-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: run.pipelineName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(RunStatusBadge, { run })
      ] }),
      run.topic && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground", children: run.topic }),
      run.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive", children: run.error })
    ] }),
    (run.inputManifest?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Files, { className: "size-4 text-primary" }),
        " Đầu vào đã chuẩn hóa"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: run.inputManifest.map((input) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-muted/45 px-3 py-2 text-2xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate font-medium", title: input.resolvedPath, children: input.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          input.fileCount,
          " file · ",
          formatBytes(input.totalBytes)
        ] }),
        input.staged && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-2xs font-normal", children: "đã đưa vào workspace" })
      ] }, input.nodeId)) })
    ] }),
    run.status === "done" && finalStep && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-primary/35 bg-primary/5 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold", children: "Đầu ra cuối cùng" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs text-muted-foreground", children: finalStep.name })
        ] }),
        finalOutputKind === "file" && finalStepConfig?.outputFile && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-2xs", onClick: () => onOpenFile(finalStepConfig.outputFile), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3" }),
          " Mở ",
          finalStepConfig.outputFile
        ] }),
        finalOutputKind === "folder" && finalStepConfig?.outputFile && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-lg border border-border bg-background px-2 py-1 font-mono text-2xs", children: finalStepConfig.outputFile })
      ] }),
      finalStep.output && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background/80 p-3 font-mono text-2xs leading-5", children: finalStep.output })
    ] }),
    awaitingStep && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium", children: [
        "Bước “",
        awaitingStep.name,
        "” đang chờ bạn duyệt"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: rejectReason,
          onChange: (event) => setRejectReason(event.target.value),
          placeholder: "Nhận xét (bắt buộc nếu từ chối — agent sẽ đọc để sửa)",
          className: "min-h-20 resize-y text-xs"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            onClick: () => {
              resolveHumanGate(true, rejectReason.trim() || "Người dùng đã duyệt");
              setRejectReason("");
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "size-4" }),
              "Duyệt"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "destructive",
            disabled: !rejectReason.trim(),
            onClick: () => {
              resolveHumanGate(false, rejectReason.trim());
              setRejectReason("");
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsDown, { className: "size-4" }),
              "Từ chối"
            ]
          }
        )
      ] })
    ] }),
    run.steps.map((step, index2) => {
      const meta = STATUS_META[step.status];
      const StatusIcon = meta.icon;
      const isLive = liveOutput?.stepId === step.stepId && step.status === "running";
      const body = isLive ? liveOutput.text : step.output;
      const outputFile = pipeline?.steps.find((item) => item.id === step.stepId)?.outputFile;
      const outputKind = pipeline?.steps.find((item) => item.id === step.stepId)?.outputKind ?? (outputFile?.trim() ? "file" : "text");
      const expanded = expandedStepId === step.stepId;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: cn(
            "rounded-xl border bg-card transition-colors",
            step.status === "failed" ? "border-destructive/40" : step.status === "passed" ? "border-emerald-500/30" : step.stepId === run.currentStepId ? "border-primary/40 shadow-sm" : "border-border"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold", children: index2 + 1 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StatusIcon, { className: cn("size-4 shrink-0", meta.className) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: step.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "shrink-0 text-2xs font-normal", children: step.agentName }),
                  step.attempt > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "shrink-0 text-2xs font-normal", children: [
                    "lần ",
                    step.attempt
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: meta.label }),
                step.artifact && step.status === "passed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-0.5 block text-2xs text-emerald-500", children: [
                  "Đầu ra đã xác minh · ",
                  step.artifact.fileCount || 1,
                  " ",
                  step.artifact.kind === "folder" ? "file" : step.artifact.kind === "file" ? "tệp" : "phản hồi",
                  " · ",
                  formatBytes(step.artifact.totalBytes)
                ] })
              ] }),
              outputFile && outputKind === "file" && (step.status === "passed" || step.status === "failed") && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-7 shrink-0 px-2 text-2xs font-normal text-muted-foreground",
                  onClick: () => onOpenFile(outputFile),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5" }),
                    outputFile
                  ]
                }
              ),
              outputFile && outputKind === "folder" && (step.status === "passed" || step.status === "failed") && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded-lg bg-muted px-2 py-1 font-mono text-2xs text-muted-foreground", children: outputFile }),
              (body || step.error) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-7 shrink-0 px-2 text-2xs font-normal text-muted-foreground",
                  onClick: () => setExpandedStepId(expanded ? "" : step.stepId),
                  children: expanded ? "Ẩn log" : "Xem log"
                }
              )
            ] }),
            step.gateReason && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
              "mx-4 mb-3 rounded-lg px-3 py-2 text-xs leading-5",
              step.gateVerdict === "fail" ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            ), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: step.gateVerdict === "fail" ? "QC không đạt: " : "QC đạt: " }),
              step.gateReason
            ] }),
            step.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-4 mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive", children: step.error }),
            (isLive || expanded) && body && /* @__PURE__ */ jsxRuntimeExports.jsxs("pre", { className: "mx-4 mb-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/60 p-3 font-mono text-2xs leading-5", children: [
              body,
              isLive && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary align-middle" })
            ] })
          ]
        },
        step.stepId
      );
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: endRef }),
    run.status === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "pt-2 text-center text-xs text-muted-foreground", children: "Xong. Kết quả nằm trong workspace — bấm tên file ở từng bước để mở." })
  ] }) });
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function RunStatusBadge({ run }) {
  const map2 = {
    running: { label: "Đang chạy", className: "bg-primary/15 text-primary" },
    awaiting: { label: "Chờ duyệt", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    paused: { label: "Đã dừng", className: "bg-muted text-muted-foreground" },
    done: { label: "Hoàn tất", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    failed: { label: "Thất bại", className: "bg-destructive/15 text-destructive" }
  };
  const meta = map2[run.status];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded px-1.5 py-0.5 text-2xs font-medium", meta.className), children: meta.label });
}
function BuzzView({ onOpenFile }) {
  const {
    agents,
    pipelines,
    runs,
    activePipelineId,
    activeRunId: activeRunId2,
    hydrated,
    createPipeline,
    deletePipeline,
    duplicatePipeline,
    selectPipeline,
    selectRun,
    updatePipeline,
    deleteRun
  } = useBuzzStore();
  const [agentsOpen, setAgentsOpen] = reactExports.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = reactExports.useState(false);
  const [historyOpen, setHistoryOpen] = reactExports.useState(false);
  const [runPanelOpen, setRunPanelOpen] = reactExports.useState(false);
  const [runningPipelineSnapshot, setRunningPipelineSnapshot] = reactExports.useState(null);
  const [runningNodeId, setRunningNodeId] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const [liveOutput, setLiveOutput] = reactExports.useState(null);
  const [workspaceInfo, setWorkspaceInfo] = reactExports.useState(null);
  const [status, setStatus] = reactExports.useState(null);
  const pipeline = pipelines.find((item) => item.id === activePipelineId) ?? pipelines[0] ?? null;
  const run = runs.find((item) => item.id === activeRunId2) ?? null;
  const pipelineRuns = reactExports.useMemo(
    () => runs.filter((item) => item.pipelineId === pipeline?.id),
    [runs, pipeline?.id]
  );
  reactExports.useEffect(() => {
    void getCliRuntimeStatus().then(setStatus);
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace) return;
    void window.contentWorkspace.ensure(pipeline?.workspacePath ?? null).then((workspace) => {
      if (!cancelled) setWorkspaceInfo(workspace);
    }).catch((error) => {
      if (!cancelled) toast.error(error instanceof Error ? error.message : String(error));
    });
    return () => {
      cancelled = true;
    };
  }, [pipeline?.id, pipeline?.workspacePath]);
  const missingAdapters = reactExports.useMemo(() => {
    if (!pipeline || !status) return [];
    const used = new Set(
      pipeline.steps.flatMap((step) => [
        agents.find((agent) => agent.id === step.agentId)?.adapter,
        step.gate.kind === "agent" ? agents.find((agent) => agent.id === step.gate.judgeAgentId)?.adapter : void 0
      ]).filter((adapter) => Boolean(adapter))
    );
    return [...used].filter((adapter) => !status[adapter]?.available);
  }, [agents, pipeline, status]);
  const chooseWorkspace = reactExports.useCallback(async () => {
    if (!window.contentWorkspace || !pipeline || busy) return;
    try {
      const result = await window.contentWorkspace.chooseDirectory(workspaceInfo?.path);
      if (result.canceled || !result.path) return;
      updatePipeline(pipeline.id, { workspacePath: result.path });
      setWorkspaceInfo({ path: result.path, memory: result.memory ?? "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [busy, pipeline, updatePipeline, workspaceInfo?.path]);
  async function handleRun(targetStepId) {
    if (!pipeline || busy || isRunnerBusy()) return;
    const emptyTextInput = (pipeline.inputNodes ?? []).find((node2) => node2.kind === "text" && !node2.value.trim() && (pipeline.connections ?? []).some((connection) => connection.source === node2.id));
    if (emptyTextInput) {
      toast.error(`Input "${emptyTextInput.name}" chưa có nội dung.`);
      return;
    }
    const emptyPathInput = (pipeline.inputNodes ?? []).find((node2) => node2.kind !== "text" && !node2.path.trim() && (pipeline.connections ?? []).some((connection) => connection.source === node2.id));
    if (emptyPathInput) {
      toast.error(`Input "${emptyPathInput.name}" chưa chọn ${emptyPathInput.kind === "file" ? "file" : "folder"}.`);
      return;
    }
    const targetFunction = targetStepId ? (pipeline.functionNodes ?? []).find((node2) => node2.id === targetStepId) : void 0;
    const executableSteps = targetFunction ? [] : pipeline.steps.filter((step) => !targetStepId || step.id === targetStepId);
    if (!targetFunction && executableSteps.length === 0) {
      toast.error(targetStepId ? "Node này không còn tồn tại." : "Pipeline chưa có bước nào.");
      return;
    }
    const unassigned = executableSteps.find((step) => !step.agentId);
    if (unassigned) {
      toast.error(`Bước "${unassigned.name}" chưa gán agent.`);
      return;
    }
    const missingOutputPath = executableSteps.find((step) => (step.outputKind === "file" || step.outputKind === "folder") && !step.outputFile.trim());
    if (missingOutputPath) {
      toast.error(`Agent "${missingOutputPath.name}" chưa đặt tên đầu ra.`);
      return;
    }
    if (missingAdapters.length > 0) {
      toast.error(`CLI chưa sẵn sàng: ${missingAdapters.join(", ")}`);
      return;
    }
    let workspacePath = null;
    try {
      const workspace = await window.contentWorkspace.ensure(pipeline.workspacePath ?? null);
      setWorkspaceInfo(workspace);
      workspacePath = workspace.path;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return;
    }
    const graphSnapshot = {
      ...pipeline,
      steps: pipeline.steps.map((step) => ({ ...step, position: step.position ? { ...step.position } : void 0, gate: { ...step.gate } })),
      inputNodes: (pipeline.inputNodes ?? []).map((node2) => ({ ...node2, position: { ...node2.position } })),
      functionNodes: (pipeline.functionNodes ?? []).map((node2) => ({ ...node2, position: { ...node2.position } })),
      connections: (pipeline.connections ?? []).map((connection) => ({ ...connection }))
    };
    setRunningPipelineSnapshot(graphSnapshot);
    setRunningNodeId(targetStepId ?? null);
    setBusy(true);
    setLiveOutput(null);
    try {
      const runId = await startRun({
        pipeline: graphSnapshot,
        topic: "",
        workspacePath,
        targetStepId,
        onStepChunk: (stepId, text2) => setLiveOutput({ stepId, text: text2 })
      });
      if (runId) setRunPanelOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setRunningPipelineSnapshot(null);
      setRunningNodeId(null);
      setBusy(false);
      setLiveOutput(null);
    }
  }
  if (!hydrated) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-w-0 flex-1 items-center justify-center bg-background", "aria-label": "Buzz", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin text-muted-foreground" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: cn(
      "shrink-0 overflow-hidden border-r border-border/60 bg-sidebar/60 transition-[width,border-color] duration-200 ease-out",
      sidebarCollapsed ? "w-0 border-transparent" : "w-64"
    ), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-64 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 border-b border-border/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "min-w-0 flex-1 justify-start", onClick: () => createPipeline(), disabled: busy, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Pipeline mới" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "shrink-0",
            title: "Thu gọn sidebar",
            "aria-label": "Thu gọn sidebar",
            onClick: () => setSidebarCollapsed(true),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftClose, { className: "size-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "min-h-0 flex-1 p-2", children: pipelines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-6 text-center text-xs leading-5 text-muted-foreground", children: "Chưa có pipeline nào." }) : pipelines.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: cn(
            "group mb-1 flex items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 transition-colors",
            item.id === pipeline?.id ? "border-border bg-background shadow-xs" : "hover:bg-sidebar-accent/60"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => selectPipeline(item.id),
                className: "min-w-0 flex-1 px-2 py-1.5 text-left",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: item.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-0.5 block text-2xs text-muted-foreground", children: [
                    item.steps.length,
                    " bước"
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon-sm",
                type: "button",
                title: "Nhân bản",
                onClick: () => duplicatePipeline(item.id),
                className: "opacity-0 transition group-hover:opacity-100",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon-sm",
                type: "button",
                title: "Xoá",
                disabled: busy,
                onClick: () => deletePipeline(item.id),
                className: "opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5" })
              }
            )
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/60 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "w-full justify-start text-xs font-normal text-muted-foreground",
            onClick: () => setHistoryOpen((open) => !open),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "size-4" }),
              "Lịch sử chạy (",
              pipelineRuns.length,
              ")"
            ]
          }
        ),
        historyOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 max-h-52 overflow-y-auto", children: pipelineRuns.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-2 py-3 text-center text-2xs text-muted-foreground", children: "Chưa có lần chạy nào." }) : pipelineRuns.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                selectRun(item.id);
                setRunPanelOpen(true);
              },
              className: cn(
                "min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-2xs transition-colors",
                item.id === activeRunId2 ? "bg-background shadow-xs" : "hover:bg-sidebar-accent/60"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate", children: item.pipelineName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: new Date(item.startedAt).toLocaleString() })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon-sm",
              type: "button",
              disabled: busy && item.id === activeRunId2,
              onClick: () => deleteRun(item.id),
              className: "opacity-0 transition hover:text-destructive group-hover:opacity-100",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3" })
            }
          )
        ] }, item.id)) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5", children: [
        sidebarCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "shrink-0", onClick: () => setSidebarCollapsed(false), title: "Mở sidebar", "aria-label": "Mở sidebar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftOpen, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { icon: Radar }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-sm font-semibold", children: pipeline?.name ?? "Buzz" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-2xs text-muted-foreground", children: pipeline?.description || "Workflow kết nối Input, Function và Agent trên canvas." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "size-8 shrink-0 rounded-lg bg-muted/55 hover:bg-muted",
            title: "Quản lý agent",
            "aria-label": "Quản lý agent",
            onClick: () => setAgentsOpen(true),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "h-8 max-w-56 justify-start rounded-lg bg-muted/55 px-2 text-xs font-normal hover:bg-muted",
            disabled: busy,
            onClick: () => void chooseWorkspace(),
            title: workspaceInfo?.path || "Workspace mặc định",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-3.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: workspaceInfo?.path.split(/[\\/]/).filter(Boolean).pop() || "Workspace" })
            ]
          }
        )
      ] }),
      missingAdapters.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 border-b border-border/60 px-5 py-2 text-2xs text-destructive", children: [
        "CLI chưa sẵn sàng: ",
        missingAdapters.join(", ")
      ] }),
      !pipeline ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center px-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Workflow, { className: "size-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Chưa có pipeline" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-sm leading-5 text-muted-foreground", children: "Tạo agent trước (mỗi agent là một vai trò do bạn tự định nghĩa), rồi tạo pipeline, thêm các bước và gán agent cho từng bước." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setAgentsOpen(true), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4" }),
            "Tạo agent"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => createPipeline(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
            "Tạo pipeline"
          ] })
        ] })
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          PipelineEditor,
          {
            pipeline: runningPipelineSnapshot?.id === pipeline.id ? runningPipelineSnapshot : pipeline,
            run: run?.pipelineId === pipeline.id ? run : null,
            busy,
            runningNodeId,
            resultPanelOpen: runPanelOpen,
            onExecute: () => void handleRun(),
            onExecuteNode: (stepId) => void handleRun(stepId),
            onStop: abortRun
          }
        ) }),
        runPanelOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "relative z-40 flex w-[min(520px,48vw)] shrink-0 flex-col border-l border-border bg-background shadow-[-12px_0_36px_rgba(0,0,0,0.12)]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-12 shrink-0 items-center justify-between border-b border-border px-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "size-4" }),
              " Kết quả chạy"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-7", onClick: () => setRunPanelOpen(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            RunView,
            {
              run,
              liveOutput,
              onOpenFile: (filePath) => onOpenFile(run?.workspacePath ?? pipeline.workspacePath ?? null, filePath)
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AgentManagerDialog, { open: agentsOpen, onOpenChange: setAgentsOpen })
  ] });
}
function createMessage(role, content2) {
  return { id: crypto.randomUUID(), role, content: content2, createdAt: Date.now() };
}
function cliLabel(adapter, includeCli = false) {
  const label = adapter === "claude" ? "Claude" : adapter === "opencode" ? "OpenCode" : "Codex";
  return includeCli ? `${label} CLI` : label;
}
function effortLabel(effort, locale) {
  const labels = {
    none: { en: "None", vi: "Không suy luận" },
    minimal: { en: "Minimal", vi: "Tối thiểu" },
    low: { en: "Low", vi: "Thấp" },
    medium: { en: "Medium", vi: "Trung bình" },
    high: { en: "High", vi: "Cao" },
    xhigh: { en: "Extra high", vi: "Rất cao" },
    max: { en: "Maximum", vi: "Tối đa" },
    ultra: { en: "Ultra", vi: "Siêu cao" }
  };
  const language = locale.toLocaleLowerCase().startsWith("vi") ? "vi" : "en";
  const value = labels[effort]?.[language] ?? effort;
  return language === "vi" ? `Suy luận: ${value}` : `Reasoning: ${value}`;
}
function workspaceLabel(workspacePath) {
  return workspacePath.split(/[\\/]/).filter(Boolean).pop() || workspacePath;
}
function ok$1() {
}
function unreachable() {
}
function stringify$1(values, options) {
  const settings = {};
  const input = values[values.length - 1] === "" ? [...values, ""] : values;
  return input.join(
    (settings.padRight ? " " : "") + "," + (settings.padLeft === false ? "" : " ")
  ).trim();
}
const nameRe = /^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u;
const nameReJsx = /^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u;
const emptyOptions$3 = {};
function name(name2, options) {
  const settings = emptyOptions$3;
  const re2 = settings.jsx ? nameReJsx : nameRe;
  return re2.test(name2);
}
const re = /[ \t\n\f\r]/g;
function whitespace(thing) {
  return typeof thing === "object" ? thing.type === "text" ? empty$1(thing.value) : false : empty$1(thing);
}
function empty$1(value) {
  return value.replace(re, "") === "";
}
class Schema {
  /**
   * @param {SchemaType['property']} property
   *   Property.
   * @param {SchemaType['normal']} normal
   *   Normal.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Schema.
   */
  constructor(property, normal, space2) {
    this.normal = normal;
    this.property = property;
    if (space2) {
      this.space = space2;
    }
  }
}
Schema.prototype.normal = {};
Schema.prototype.property = {};
Schema.prototype.space = void 0;
function merge(definitions, space2) {
  const property = {};
  const normal = {};
  for (const definition2 of definitions) {
    Object.assign(property, definition2.property);
    Object.assign(normal, definition2.normal);
  }
  return new Schema(property, normal, space2);
}
function normalize$1(value) {
  return value.toLowerCase();
}
class Info {
  /**
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @returns
   *   Info.
   */
  constructor(property, attribute) {
    this.attribute = attribute;
    this.property = property;
  }
}
Info.prototype.attribute = "";
Info.prototype.booleanish = false;
Info.prototype.boolean = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.commaSeparated = false;
Info.prototype.defined = false;
Info.prototype.mustUseProperty = false;
Info.prototype.number = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.property = "";
Info.prototype.spaceSeparated = false;
Info.prototype.space = void 0;
let powers = 0;
const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();
function increment() {
  return 2 ** ++powers;
}
const types = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  boolean,
  booleanish,
  commaOrSpaceSeparated,
  commaSeparated,
  number,
  overloadedBoolean,
  spaceSeparated
}, Symbol.toStringTag, { value: "Module" }));
const checks = (
  /** @type {ReadonlyArray<keyof typeof types>} */
  Object.keys(types)
);
class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @param {number | null | undefined} [mask]
   *   Mask.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Info.
   */
  constructor(property, attribute, mask, space2) {
    let index2 = -1;
    super(property, attribute);
    mark(this, "space", space2);
    if (typeof mask === "number") {
      while (++index2 < checks.length) {
        const check = checks[index2];
        mark(this, checks[index2], (mask & types[check]) === types[check]);
      }
    }
  }
}
DefinedInfo.prototype.defined = true;
function mark(values, key, value) {
  if (value) {
    values[key] = value;
  }
}
function create(definition2) {
  const properties = {};
  const normals = {};
  for (const [property, value] of Object.entries(definition2.properties)) {
    const info = new DefinedInfo(
      property,
      definition2.transform(definition2.attributes || {}, property),
      value,
      definition2.space
    );
    if (definition2.mustUseProperty && definition2.mustUseProperty.includes(property)) {
      info.mustUseProperty = true;
    }
    properties[property] = info;
    normals[normalize$1(property)] = property;
    normals[normalize$1(info.attribute)] = property;
  }
  return new Schema(properties, normals, definition2.space);
}
const aria = create({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  },
  transform(_, property) {
    return property === "role" ? property : "aria-" + property.slice(4).toLowerCase();
  }
});
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute;
}
function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase());
}
const html$3 = create({
  attributes: {
    acceptcharset: "accept-charset",
    classname: "class",
    htmlfor: "for",
    httpequiv: "http-equiv"
  },
  mustUseProperty: ["checked", "multiple", "muted", "selected"],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alpha: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    blocking: spaceSeparated,
    capture: null,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    closedBy: null,
    colorSpace: null,
    cols: number,
    colSpan: number,
    command: null,
    commandFor: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    fetchPriority: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: overloadedBoolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inert: boolean,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforeMatch: null,
    onBeforePrint: null,
    onBeforeToggle: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onScrollEnd: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    popover: null,
    popoverTarget: null,
    popoverTargetAction: null,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shadowRootClonable: boolean,
    shadowRootCustomElementRegistry: boolean,
    shadowRootDelegatesFocus: boolean,
    shadowRootMode: null,
    shadowRootSerializable: boolean,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,
    writingSuggestions: null,
    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null,
    // Several. Use CSS `text-align` instead,
    aLink: null,
    // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated,
    // `<object>`. List of URIs to archives
    axis: null,
    // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null,
    // `<body>`. Use CSS `background-image` instead
    bgColor: null,
    // `<body>` and table elements. Use CSS `background-color` instead
    border: number,
    // `<table>`. Use CSS `border-width` instead,
    borderColor: null,
    // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number,
    // `<body>`
    cellPadding: null,
    // `<table>`
    cellSpacing: null,
    // `<table>`
    char: null,
    // Several table elements. When `align=char`, sets the character to align on
    charOff: null,
    // Several table elements. When `char`, offsets the alignment
    classId: null,
    // `<object>`
    clear: null,
    // `<br>`. Use CSS `clear` instead
    code: null,
    // `<object>`
    codeBase: null,
    // `<object>`
    codeType: null,
    // `<object>`
    color: null,
    // `<font>` and `<hr>`. Use CSS instead
    compact: boolean,
    // Lists. Use CSS to reduce space between items instead
    declare: boolean,
    // `<object>`
    event: null,
    // `<script>`
    face: null,
    // `<font>`. Use CSS instead
    frame: null,
    // `<table>`
    frameBorder: null,
    // `<iframe>`. Use CSS `border` instead
    hSpace: number,
    // `<img>` and `<object>`
    leftMargin: number,
    // `<body>`
    link: null,
    // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null,
    // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null,
    // `<img>`. Use a `<picture>`
    marginHeight: number,
    // `<body>`
    marginWidth: number,
    // `<body>`
    noResize: boolean,
    // `<frame>`
    noHref: boolean,
    // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean,
    // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean,
    // `<td>` and `<th>`
    object: null,
    // `<applet>`
    profile: null,
    // `<head>`
    prompt: null,
    // `<isindex>`
    rev: null,
    // `<link>`
    rightMargin: number,
    // `<body>`
    rules: null,
    // `<table>`
    scheme: null,
    // `<meta>`
    scrolling: booleanish,
    // `<frame>`. Use overflow in the child context
    standby: null,
    // `<object>`
    summary: null,
    // `<table>`
    text: null,
    // `<body>`. Use CSS `color` instead
    topMargin: number,
    // `<body>`
    valueType: null,
    // `<param>`
    version: null,
    // `<html>`. Use a doctype.
    vAlign: null,
    // Several. Use CSS `vertical-align` instead
    vLink: null,
    // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number,
    // `<img>` and `<object>`
    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    credentialless: boolean,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    exportParts: commaSeparated,
    part: spaceSeparated,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  },
  space: "html",
  transform: caseInsensitiveTransform
});
const svg$1 = create({
  attributes: {
    accentHeight: "accent-height",
    alignmentBaseline: "alignment-baseline",
    arabicForm: "arabic-form",
    baselineShift: "baseline-shift",
    capHeight: "cap-height",
    className: "class",
    clipPath: "clip-path",
    clipRule: "clip-rule",
    colorInterpolation: "color-interpolation",
    colorInterpolationFilters: "color-interpolation-filters",
    colorProfile: "color-profile",
    colorRendering: "color-rendering",
    crossOrigin: "crossorigin",
    dataType: "datatype",
    dominantBaseline: "dominant-baseline",
    enableBackground: "enable-background",
    fillOpacity: "fill-opacity",
    fillRule: "fill-rule",
    floodColor: "flood-color",
    floodOpacity: "flood-opacity",
    fontFamily: "font-family",
    fontSize: "font-size",
    fontSizeAdjust: "font-size-adjust",
    fontStretch: "font-stretch",
    fontStyle: "font-style",
    fontVariant: "font-variant",
    fontWeight: "font-weight",
    glyphName: "glyph-name",
    glyphOrientationHorizontal: "glyph-orientation-horizontal",
    glyphOrientationVertical: "glyph-orientation-vertical",
    hrefLang: "hreflang",
    horizAdvX: "horiz-adv-x",
    horizOriginX: "horiz-origin-x",
    horizOriginY: "horiz-origin-y",
    imageRendering: "image-rendering",
    letterSpacing: "letter-spacing",
    lightingColor: "lighting-color",
    markerEnd: "marker-end",
    markerMid: "marker-mid",
    markerStart: "marker-start",
    maskType: "mask-type",
    navDown: "nav-down",
    navDownLeft: "nav-down-left",
    navDownRight: "nav-down-right",
    navLeft: "nav-left",
    navNext: "nav-next",
    navPrev: "nav-prev",
    navRight: "nav-right",
    navUp: "nav-up",
    navUpLeft: "nav-up-left",
    navUpRight: "nav-up-right",
    onAbort: "onabort",
    onActivate: "onactivate",
    onAfterPrint: "onafterprint",
    onBeforePrint: "onbeforeprint",
    onBegin: "onbegin",
    onCancel: "oncancel",
    onCanPlay: "oncanplay",
    onCanPlayThrough: "oncanplaythrough",
    onChange: "onchange",
    onClick: "onclick",
    onClose: "onclose",
    onCopy: "oncopy",
    onCueChange: "oncuechange",
    onCut: "oncut",
    onDblClick: "ondblclick",
    onDrag: "ondrag",
    onDragEnd: "ondragend",
    onDragEnter: "ondragenter",
    onDragExit: "ondragexit",
    onDragLeave: "ondragleave",
    onDragOver: "ondragover",
    onDragStart: "ondragstart",
    onDrop: "ondrop",
    onDurationChange: "ondurationchange",
    onEmptied: "onemptied",
    onEnd: "onend",
    onEnded: "onended",
    onError: "onerror",
    onFocus: "onfocus",
    onFocusIn: "onfocusin",
    onFocusOut: "onfocusout",
    onHashChange: "onhashchange",
    onInput: "oninput",
    onInvalid: "oninvalid",
    onKeyDown: "onkeydown",
    onKeyPress: "onkeypress",
    onKeyUp: "onkeyup",
    onLoad: "onload",
    onLoadedData: "onloadeddata",
    onLoadedMetadata: "onloadedmetadata",
    onLoadStart: "onloadstart",
    onMessage: "onmessage",
    onMouseDown: "onmousedown",
    onMouseEnter: "onmouseenter",
    onMouseLeave: "onmouseleave",
    onMouseMove: "onmousemove",
    onMouseOut: "onmouseout",
    onMouseOver: "onmouseover",
    onMouseUp: "onmouseup",
    onMouseWheel: "onmousewheel",
    onOffline: "onoffline",
    onOnline: "ononline",
    onPageHide: "onpagehide",
    onPageShow: "onpageshow",
    onPaste: "onpaste",
    onPause: "onpause",
    onPlay: "onplay",
    onPlaying: "onplaying",
    onPopState: "onpopstate",
    onProgress: "onprogress",
    onRateChange: "onratechange",
    onRepeat: "onrepeat",
    onReset: "onreset",
    onResize: "onresize",
    onScroll: "onscroll",
    onSeeked: "onseeked",
    onSeeking: "onseeking",
    onSelect: "onselect",
    onShow: "onshow",
    onStalled: "onstalled",
    onStorage: "onstorage",
    onSubmit: "onsubmit",
    onSuspend: "onsuspend",
    onTimeUpdate: "ontimeupdate",
    onToggle: "ontoggle",
    onUnload: "onunload",
    onVolumeChange: "onvolumechange",
    onWaiting: "onwaiting",
    onZoom: "onzoom",
    overlinePosition: "overline-position",
    overlineThickness: "overline-thickness",
    paintOrder: "paint-order",
    panose1: "panose-1",
    pointerEvents: "pointer-events",
    referrerPolicy: "referrerpolicy",
    renderingIntent: "rendering-intent",
    shapeRendering: "shape-rendering",
    stopColor: "stop-color",
    stopOpacity: "stop-opacity",
    strikethroughPosition: "strikethrough-position",
    strikethroughThickness: "strikethrough-thickness",
    strokeDashArray: "stroke-dasharray",
    strokeDashOffset: "stroke-dashoffset",
    strokeLineCap: "stroke-linecap",
    strokeLineJoin: "stroke-linejoin",
    strokeMiterLimit: "stroke-miterlimit",
    strokeOpacity: "stroke-opacity",
    strokeWidth: "stroke-width",
    tabIndex: "tabindex",
    textAnchor: "text-anchor",
    textDecoration: "text-decoration",
    textRendering: "text-rendering",
    transformOrigin: "transform-origin",
    typeOf: "typeof",
    underlinePosition: "underline-position",
    underlineThickness: "underline-thickness",
    unicodeBidi: "unicode-bidi",
    unicodeRange: "unicode-range",
    unitsPerEm: "units-per-em",
    vAlphabetic: "v-alphabetic",
    vHanging: "v-hanging",
    vIdeographic: "v-ideographic",
    vMathematical: "v-mathematical",
    vectorEffect: "vector-effect",
    vertAdvY: "vert-adv-y",
    vertOriginX: "vert-origin-x",
    vertOriginY: "vert-origin-y",
    wordSpacing: "word-spacing",
    writingMode: "writing-mode",
    xHeight: "x-height",
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: "playbackorder",
    timelineBegin: "timelinebegin"
  },
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null,
    // SEMI_COLON_SEPARATED
    keySplines: null,
    // SEMI_COLON_SEPARATED
    keyTimes: null,
    // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskType: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    transformOrigin: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  },
  space: "svg",
  transform: caseSensitiveTransform
});
const xlink = create({
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  },
  space: "xlink",
  transform(_, property) {
    return "xlink:" + property.slice(5).toLowerCase();
  }
});
const xmlns = create({
  attributes: { xmlnsxlink: "xmlns:xlink" },
  properties: { xmlnsXLink: null, xmlns: null },
  space: "xmlns",
  transform: caseInsensitiveTransform
});
const xml = create({
  properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
  space: "xml",
  transform(_, property) {
    return "xml:" + property.slice(3).toLowerCase();
  }
});
const hastToReact = {
  classId: "classID",
  dataType: "datatype",
  itemId: "itemID",
  strokeDashArray: "strokeDasharray",
  strokeDashOffset: "strokeDashoffset",
  strokeLineCap: "strokeLinecap",
  strokeLineJoin: "strokeLinejoin",
  strokeMiterLimit: "strokeMiterlimit",
  typeOf: "typeof",
  xLinkActuate: "xlinkActuate",
  xLinkArcRole: "xlinkArcrole",
  xLinkHref: "xlinkHref",
  xLinkRole: "xlinkRole",
  xLinkShow: "xlinkShow",
  xLinkTitle: "xlinkTitle",
  xLinkType: "xlinkType",
  xmlnsXLink: "xmlnsXlink"
};
const cap$1 = /[A-Z]/g;
const dash = /-[a-z]/g;
const valid = /^data[-\w.:]+$/i;
function find(schema, value) {
  const normal = normalize$1(value);
  let property = value;
  let Type2 = Info;
  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]];
  }
  if (normal.length > 4 && normal.slice(0, 4) === "data" && valid.test(value)) {
    if (value.charAt(4) === "-") {
      const rest = value.slice(5).replace(dash, camelcase);
      property = "data" + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      const rest = value.slice(4);
      if (!dash.test(rest)) {
        let dashes = rest.replace(cap$1, kebab);
        if (dashes.charAt(0) !== "-") {
          dashes = "-" + dashes;
        }
        value = "data" + dashes;
      }
    }
    Type2 = DefinedInfo;
  }
  return new Type2(property, value);
}
function kebab($0) {
  return "-" + $0.toLowerCase();
}
function camelcase($0) {
  return $0.charAt(1).toUpperCase();
}
const html$2 = merge([aria, html$3, xlink, xmlns, xml], "html");
const svg = merge([aria, svg$1, xlink, xmlns, xml], "svg");
function stringify(values) {
  return values.join(" ").trim();
}
var cjs$2 = {};
var COMMENT_REGEX = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;
var NEWLINE_REGEX = /\n/g;
var WHITESPACE_REGEX = /^\s*/;
var PROPERTY_REGEX = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/;
var COLON_REGEX = /^:\s*/;
var VALUE_REGEX = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/;
var SEMICOLON_REGEX = /^[;\s]*/;
var TRIM_REGEX = /^\s+|\s+$/g;
var NEWLINE = "\n";
var FORWARD_SLASH = "/";
var ASTERISK = "*";
var EMPTY_STRING = "";
var TYPE_COMMENT = "comment";
var TYPE_DECLARATION = "declaration";
function index$1(style2, options) {
  if (typeof style2 !== "string") {
    throw new TypeError("First argument must be a string");
  }
  if (!style2) return [];
  options = options || {};
  var lineno = 1;
  var column = 1;
  function updatePosition(str) {
    var lines = str.match(NEWLINE_REGEX);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf(NEWLINE);
    column = ~i ? str.length - i : column + str.length;
  }
  function position2() {
    var start2 = { line: lineno, column };
    return function(node2) {
      node2.position = new Position2(start2);
      whitespace2();
      return node2;
    };
  }
  function Position2(start2) {
    this.start = start2;
    this.end = { line: lineno, column };
    this.source = options.source;
  }
  Position2.prototype.content = style2;
  function error(msg) {
    var err = new Error(
      options.source + ":" + lineno + ":" + column + ": " + msg
    );
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = style2;
    if (options.silent) ;
    else {
      throw err;
    }
  }
  function match(re2) {
    var m = re2.exec(style2);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    style2 = style2.slice(str.length);
    return m;
  }
  function whitespace2() {
    match(WHITESPACE_REGEX);
  }
  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }
  function comment() {
    var pos = position2();
    if (FORWARD_SLASH != style2.charAt(0) || ASTERISK != style2.charAt(1)) return;
    var i = 2;
    while (EMPTY_STRING != style2.charAt(i) && (ASTERISK != style2.charAt(i) || FORWARD_SLASH != style2.charAt(i + 1))) {
      ++i;
    }
    i += 2;
    if (EMPTY_STRING === style2.charAt(i - 1)) {
      return error("End of comment missing");
    }
    var str = style2.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    style2 = style2.slice(i);
    column += 2;
    return pos({
      type: TYPE_COMMENT,
      comment: str
    });
  }
  function declaration() {
    var pos = position2();
    var prop = match(PROPERTY_REGEX);
    if (!prop) return;
    comment();
    if (!match(COLON_REGEX)) return error("property missing ':'");
    var val = match(VALUE_REGEX);
    var ret = pos({
      type: TYPE_DECLARATION,
      property: trim(prop[0].replace(COMMENT_REGEX, EMPTY_STRING)),
      value: val ? trim(val[0].replace(COMMENT_REGEX, EMPTY_STRING)) : EMPTY_STRING
    });
    match(SEMICOLON_REGEX);
    return ret;
  }
  function declarations() {
    var decls = [];
    comments(decls);
    var decl;
    while (decl = declaration()) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }
    return decls;
  }
  whitespace2();
  return declarations();
}
function trim(str) {
  return str ? str.replace(TRIM_REGEX, EMPTY_STRING) : EMPTY_STRING;
}
var cjs$1 = index$1;
var __importDefault$1 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(cjs$2, "__esModule", { value: true });
cjs$2.default = StyleToObject;
const inline_style_parser_1 = __importDefault$1(cjs$1);
function StyleToObject(style2, iterator) {
  let styleObject = null;
  if (!style2 || typeof style2 !== "string") {
    return styleObject;
  }
  const declarations = (0, inline_style_parser_1.default)(style2);
  const hasIterator = typeof iterator === "function";
  declarations.forEach((declaration) => {
    if (declaration.type !== "declaration") {
      return;
    }
    const { property, value } = declaration;
    if (hasIterator) {
      iterator(property, value, declaration);
    } else if (value) {
      styleObject = styleObject || {};
      styleObject[property] = value;
    }
  });
  return styleObject;
}
var utilities = {};
Object.defineProperty(utilities, "__esModule", { value: true });
utilities.camelCase = void 0;
var CUSTOM_PROPERTY_REGEX = /^--[a-zA-Z0-9_-]+$/;
var HYPHEN_REGEX = /-([a-z])/g;
var NO_HYPHEN_REGEX = /^[^-]+$/;
var VENDOR_PREFIX_REGEX = /^-(webkit|moz|ms|o|khtml)-/;
var MS_VENDOR_PREFIX_REGEX = /^-(ms)-/;
var skipCamelCase = function(property) {
  return !property || NO_HYPHEN_REGEX.test(property) || CUSTOM_PROPERTY_REGEX.test(property);
};
var capitalize = function(match, character) {
  return character.toUpperCase();
};
var trimHyphen = function(match, prefix) {
  return "".concat(prefix, "-");
};
var camelCase = function(property, options) {
  if (options === void 0) {
    options = {};
  }
  if (skipCamelCase(property)) {
    return property;
  }
  property = property.toLowerCase();
  if (options.reactCompat) {
    property = property.replace(MS_VENDOR_PREFIX_REGEX, trimHyphen);
  } else {
    property = property.replace(VENDOR_PREFIX_REGEX, trimHyphen);
  }
  return property.replace(HYPHEN_REGEX, capitalize);
};
utilities.camelCase = camelCase;
var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
  return mod && mod.__esModule ? mod : { "default": mod };
};
var style_to_object_1 = __importDefault(cjs$2);
var utilities_1 = utilities;
function StyleToJS(style2, options) {
  var output = {};
  if (!style2 || typeof style2 !== "string") {
    return output;
  }
  (0, style_to_object_1.default)(style2, function(property, value) {
    if (property && value) {
      output[(0, utilities_1.camelCase)(property, options)] = value;
    }
  });
  return output;
}
StyleToJS.default = StyleToJS;
var cjs = StyleToJS;
const styleToJs = /* @__PURE__ */ getDefaultExportFromCjs(cjs);
const pointEnd = point$2("end");
const pointStart = point$2("start");
function point$2(type) {
  return point2;
  function point2(node2) {
    const point3 = node2 && node2.position && node2.position[type] || {};
    if (typeof point3.line === "number" && point3.line > 0 && typeof point3.column === "number" && point3.column > 0) {
      return {
        line: point3.line,
        column: point3.column,
        offset: typeof point3.offset === "number" && point3.offset > -1 ? point3.offset : void 0
      };
    }
  }
}
function position$1(node2) {
  const start2 = pointStart(node2);
  const end = pointEnd(node2);
  if (start2 && end) {
    return { start: start2, end };
  }
}
function stringifyPosition(value) {
  if (!value || typeof value !== "object") {
    return "";
  }
  if ("position" in value || "type" in value) {
    return position(value.position);
  }
  if ("start" in value || "end" in value) {
    return position(value);
  }
  if ("line" in value || "column" in value) {
    return point$1(value);
  }
  return "";
}
function point$1(point2) {
  return index(point2 && point2.line) + ":" + index(point2 && point2.column);
}
function position(pos) {
  return point$1(pos && pos.start) + "-" + point$1(pos && pos.end);
}
function index(value) {
  return value && typeof value === "number" ? value : 1;
}
class VFileMessage extends Error {
  /**
   * Create a message for `reason`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {Options | null | undefined} [options]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | Options | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns
   *   Instance of `VFileMessage`.
   */
  // eslint-disable-next-line complexity
  constructor(causeOrReason, optionsOrParentOrPlace, origin) {
    super();
    if (typeof optionsOrParentOrPlace === "string") {
      origin = optionsOrParentOrPlace;
      optionsOrParentOrPlace = void 0;
    }
    let reason = "";
    let options = {};
    let legacyCause = false;
    if (optionsOrParentOrPlace) {
      if ("line" in optionsOrParentOrPlace && "column" in optionsOrParentOrPlace) {
        options = { place: optionsOrParentOrPlace };
      } else if ("start" in optionsOrParentOrPlace && "end" in optionsOrParentOrPlace) {
        options = { place: optionsOrParentOrPlace };
      } else if ("type" in optionsOrParentOrPlace) {
        options = {
          ancestors: [optionsOrParentOrPlace],
          place: optionsOrParentOrPlace.position
        };
      } else {
        options = { ...optionsOrParentOrPlace };
      }
    }
    if (typeof causeOrReason === "string") {
      reason = causeOrReason;
    } else if (!options.cause && causeOrReason) {
      legacyCause = true;
      reason = causeOrReason.message;
      options.cause = causeOrReason;
    }
    if (!options.ruleId && !options.source && typeof origin === "string") {
      const index2 = origin.indexOf(":");
      if (index2 === -1) {
        options.ruleId = origin;
      } else {
        options.source = origin.slice(0, index2);
        options.ruleId = origin.slice(index2 + 1);
      }
    }
    if (!options.place && options.ancestors && options.ancestors) {
      const parent = options.ancestors[options.ancestors.length - 1];
      if (parent) {
        options.place = parent.position;
      }
    }
    const start2 = options.place && "start" in options.place ? options.place.start : options.place;
    this.ancestors = options.ancestors || void 0;
    this.cause = options.cause || void 0;
    this.column = start2 ? start2.column : void 0;
    this.fatal = void 0;
    this.file = "";
    this.message = reason;
    this.line = start2 ? start2.line : void 0;
    this.name = stringifyPosition(options.place) || "1:1";
    this.place = options.place || void 0;
    this.reason = this.message;
    this.ruleId = options.ruleId || void 0;
    this.source = options.source || void 0;
    this.stack = legacyCause && options.cause && typeof options.cause.stack === "string" ? options.cause.stack : "";
    this.actual = void 0;
    this.expected = void 0;
    this.note = void 0;
    this.url = void 0;
  }
}
VFileMessage.prototype.file = "";
VFileMessage.prototype.name = "";
VFileMessage.prototype.reason = "";
VFileMessage.prototype.message = "";
VFileMessage.prototype.stack = "";
VFileMessage.prototype.column = void 0;
VFileMessage.prototype.line = void 0;
VFileMessage.prototype.ancestors = void 0;
VFileMessage.prototype.cause = void 0;
VFileMessage.prototype.fatal = void 0;
VFileMessage.prototype.place = void 0;
VFileMessage.prototype.ruleId = void 0;
VFileMessage.prototype.source = void 0;
const own$3 = {}.hasOwnProperty;
const emptyMap = /* @__PURE__ */ new Map();
const cap = /[A-Z]/g;
const tableElements = /* @__PURE__ */ new Set(["table", "tbody", "thead", "tfoot", "tr"]);
const tableCellElement = /* @__PURE__ */ new Set(["td", "th"]);
const docs = "https://github.com/syntax-tree/hast-util-to-jsx-runtime";
function toJsxRuntime(tree, options) {
  if (!options || options.Fragment === void 0) {
    throw new TypeError("Expected `Fragment` in options");
  }
  const filePath = options.filePath || void 0;
  let create2;
  if (options.development) {
    if (typeof options.jsxDEV !== "function") {
      throw new TypeError(
        "Expected `jsxDEV` in options when `development: true`"
      );
    }
    create2 = developmentCreate(filePath, options.jsxDEV);
  } else {
    if (typeof options.jsx !== "function") {
      throw new TypeError("Expected `jsx` in production options");
    }
    if (typeof options.jsxs !== "function") {
      throw new TypeError("Expected `jsxs` in production options");
    }
    create2 = productionCreate(filePath, options.jsx, options.jsxs);
  }
  const state = {
    Fragment: options.Fragment,
    ancestors: [],
    components: options.components || {},
    create: create2,
    elementAttributeNameCase: options.elementAttributeNameCase || "react",
    evaluater: options.createEvaluater ? options.createEvaluater() : void 0,
    filePath,
    ignoreInvalidStyle: options.ignoreInvalidStyle || false,
    passKeys: options.passKeys !== false,
    passNode: options.passNode || false,
    schema: options.space === "svg" ? svg : html$2,
    stylePropertyNameCase: options.stylePropertyNameCase || "dom",
    tableCellAlignToStyle: options.tableCellAlignToStyle !== false
  };
  const result = one$1(state, tree, void 0);
  if (result && typeof result !== "string") {
    return result;
  }
  return state.create(
    tree,
    state.Fragment,
    { children: result || void 0 },
    void 0
  );
}
function one$1(state, node2, key) {
  if (node2.type === "element") {
    return element$1(state, node2, key);
  }
  if (node2.type === "mdxFlowExpression" || node2.type === "mdxTextExpression") {
    return mdxExpression(state, node2);
  }
  if (node2.type === "mdxJsxFlowElement" || node2.type === "mdxJsxTextElement") {
    return mdxJsxElement(state, node2, key);
  }
  if (node2.type === "mdxjsEsm") {
    return mdxEsm(state, node2);
  }
  if (node2.type === "root") {
    return root$2(state, node2, key);
  }
  if (node2.type === "text") {
    return text$5(state, node2);
  }
}
function element$1(state, node2, key) {
  const parentSchema = state.schema;
  let schema = parentSchema;
  if (node2.tagName.toLowerCase() === "svg" && parentSchema.space === "html") {
    schema = svg;
    state.schema = schema;
  }
  state.ancestors.push(node2);
  const type = findComponentFromName(state, node2.tagName, false);
  const props = createElementProps(state, node2);
  let children2 = createChildren(state, node2);
  if (tableElements.has(node2.tagName)) {
    children2 = children2.filter(function(child) {
      return typeof child === "string" ? !whitespace(child) : true;
    });
  }
  addNode(state, props, type, node2);
  addChildren(props, children2);
  state.ancestors.pop();
  state.schema = parentSchema;
  return state.create(node2, type, props, key);
}
function mdxExpression(state, node2) {
  if (node2.data && node2.data.estree && state.evaluater) {
    const program = node2.data.estree;
    const expression = program.body[0];
    ok$1(expression.type === "ExpressionStatement");
    return (
      /** @type {Child | undefined} */
      state.evaluater.evaluateExpression(expression.expression)
    );
  }
  crashEstree(state, node2.position);
}
function mdxEsm(state, node2) {
  if (node2.data && node2.data.estree && state.evaluater) {
    return (
      /** @type {Child | undefined} */
      state.evaluater.evaluateProgram(node2.data.estree)
    );
  }
  crashEstree(state, node2.position);
}
function mdxJsxElement(state, node2, key) {
  const parentSchema = state.schema;
  let schema = parentSchema;
  if (node2.name === "svg" && parentSchema.space === "html") {
    schema = svg;
    state.schema = schema;
  }
  state.ancestors.push(node2);
  const type = node2.name === null ? state.Fragment : findComponentFromName(state, node2.name, true);
  const props = createJsxElementProps(state, node2);
  const children2 = createChildren(state, node2);
  addNode(state, props, type, node2);
  addChildren(props, children2);
  state.ancestors.pop();
  state.schema = parentSchema;
  return state.create(node2, type, props, key);
}
function root$2(state, node2, key) {
  const props = {};
  addChildren(props, createChildren(state, node2));
  return state.create(node2, state.Fragment, props, key);
}
function text$5(_, node2) {
  return node2.value;
}
function addNode(state, props, type, node2) {
  if (typeof type !== "string" && type !== state.Fragment && state.passNode) {
    props.node = node2;
  }
}
function addChildren(props, children2) {
  if (children2.length > 0) {
    const value = children2.length > 1 ? children2 : children2[0];
    if (value) {
      props.children = value;
    }
  }
}
function productionCreate(_, jsx, jsxs) {
  return create2;
  function create2(_2, type, props, key) {
    const isStaticChildren = Array.isArray(props.children);
    const fn = isStaticChildren ? jsxs : jsx;
    return key ? fn(type, props, key) : fn(type, props);
  }
}
function developmentCreate(filePath, jsxDEV) {
  return create2;
  function create2(node2, type, props, key) {
    const isStaticChildren = Array.isArray(props.children);
    const point2 = pointStart(node2);
    return jsxDEV(
      type,
      props,
      key,
      isStaticChildren,
      {
        columnNumber: point2 ? point2.column - 1 : void 0,
        fileName: filePath,
        lineNumber: point2 ? point2.line : void 0
      },
      void 0
    );
  }
}
function createElementProps(state, node2) {
  const props = {};
  let alignValue;
  let prop;
  for (prop in node2.properties) {
    if (prop !== "children" && own$3.call(node2.properties, prop)) {
      const result = createProperty(state, prop, node2.properties[prop]);
      if (result) {
        const [key, value] = result;
        if (state.tableCellAlignToStyle && key === "align" && typeof value === "string" && tableCellElement.has(node2.tagName)) {
          alignValue = value;
        } else {
          props[key] = value;
        }
      }
    }
  }
  if (alignValue) {
    const style2 = (
      /** @type {Style} */
      props.style || (props.style = {})
    );
    style2[state.stylePropertyNameCase === "css" ? "text-align" : "textAlign"] = alignValue;
  }
  return props;
}
function createJsxElementProps(state, node2) {
  const props = {};
  for (const attribute of node2.attributes) {
    if (attribute.type === "mdxJsxExpressionAttribute") {
      if (attribute.data && attribute.data.estree && state.evaluater) {
        const program = attribute.data.estree;
        const expression = program.body[0];
        ok$1(expression.type === "ExpressionStatement");
        const objectExpression = expression.expression;
        ok$1(objectExpression.type === "ObjectExpression");
        const property = objectExpression.properties[0];
        ok$1(property.type === "SpreadElement");
        Object.assign(
          props,
          state.evaluater.evaluateExpression(property.argument)
        );
      } else {
        crashEstree(state, node2.position);
      }
    } else {
      const name2 = attribute.name;
      let value;
      if (attribute.value && typeof attribute.value === "object") {
        if (attribute.value.data && attribute.value.data.estree && state.evaluater) {
          const program = attribute.value.data.estree;
          const expression = program.body[0];
          ok$1(expression.type === "ExpressionStatement");
          value = state.evaluater.evaluateExpression(expression.expression);
        } else {
          crashEstree(state, node2.position);
        }
      } else {
        value = attribute.value === null ? true : attribute.value;
      }
      props[name2] = /** @type {Props[keyof Props]} */
      value;
    }
  }
  return props;
}
function createChildren(state, node2) {
  const children2 = [];
  let index2 = -1;
  const countsByName = state.passKeys ? /* @__PURE__ */ new Map() : emptyMap;
  while (++index2 < node2.children.length) {
    const child = node2.children[index2];
    let key;
    if (state.passKeys) {
      const name2 = child.type === "element" ? child.tagName : child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement" ? child.name : void 0;
      if (name2) {
        const count = countsByName.get(name2) || 0;
        key = name2 + "-" + count;
        countsByName.set(name2, count + 1);
      }
    }
    const result = one$1(state, child, key);
    if (result !== void 0) children2.push(result);
  }
  return children2;
}
function createProperty(state, prop, value) {
  const info = find(state.schema, prop);
  if (value === null || value === void 0 || typeof value === "number" && Number.isNaN(value)) {
    return;
  }
  if (Array.isArray(value)) {
    value = info.commaSeparated ? stringify$1(value) : stringify(value);
  }
  if (info.property === "style") {
    let styleObject = typeof value === "object" ? value : parseStyle(state, String(value));
    if (state.stylePropertyNameCase === "css") {
      styleObject = transformStylesToCssCasing(styleObject);
    }
    return ["style", styleObject];
  }
  return [
    state.elementAttributeNameCase === "react" && info.space ? hastToReact[info.property] || info.property : info.attribute,
    value
  ];
}
function parseStyle(state, value) {
  try {
    return styleToJs(value, { reactCompat: true });
  } catch (error) {
    if (state.ignoreInvalidStyle) {
      return {};
    }
    const cause = (
      /** @type {Error} */
      error
    );
    const message = new VFileMessage("Cannot parse `style` attribute", {
      ancestors: state.ancestors,
      cause,
      ruleId: "style",
      source: "hast-util-to-jsx-runtime"
    });
    message.file = state.filePath || void 0;
    message.url = docs + "#cannot-parse-style-attribute";
    throw message;
  }
}
function findComponentFromName(state, name$1, allowExpression) {
  let result;
  if (!allowExpression) {
    result = { type: "Literal", value: name$1 };
  } else if (name$1.includes(".")) {
    const identifiers = name$1.split(".");
    let index2 = -1;
    let node2;
    while (++index2 < identifiers.length) {
      const prop = name(identifiers[index2]) ? { type: "Identifier", name: identifiers[index2] } : { type: "Literal", value: identifiers[index2] };
      node2 = node2 ? {
        type: "MemberExpression",
        object: node2,
        property: prop,
        computed: Boolean(index2 && prop.type === "Literal"),
        optional: false
      } : prop;
    }
    result = node2;
  } else {
    result = name(name$1) && !/^[a-z]/.test(name$1) ? { type: "Identifier", name: name$1 } : { type: "Literal", value: name$1 };
  }
  if (result.type === "Literal") {
    const name2 = (
      /** @type {string | number} */
      result.value
    );
    return own$3.call(state.components, name2) ? state.components[name2] : name2;
  }
  if (state.evaluater) {
    return state.evaluater.evaluateExpression(result);
  }
  crashEstree(state);
}
function crashEstree(state, place) {
  const message = new VFileMessage(
    "Cannot handle MDX estrees without `createEvaluater`",
    {
      ancestors: state.ancestors,
      place,
      ruleId: "mdx-estree",
      source: "hast-util-to-jsx-runtime"
    }
  );
  message.file = state.filePath || void 0;
  message.url = docs + "#cannot-handle-mdx-estrees-without-createevaluater";
  throw message;
}
function transformStylesToCssCasing(domCasing) {
  const cssCasing = {};
  let from;
  for (from in domCasing) {
    if (own$3.call(domCasing, from)) {
      cssCasing[transformStyleToCssCasing(from)] = domCasing[from];
    }
  }
  return cssCasing;
}
function transformStyleToCssCasing(from) {
  let to = from.replace(cap, toDash);
  if (to.slice(0, 3) === "ms-") to = "-" + to;
  return to;
}
function toDash($0) {
  return "-" + $0.toLowerCase();
}
const urlAttributes = {
  action: ["form"],
  cite: ["blockquote", "del", "ins", "q"],
  data: ["object"],
  formAction: ["button", "input"],
  href: ["a", "area", "base", "link"],
  icon: ["menuitem"],
  itemId: null,
  manifest: ["html"],
  ping: ["a", "area"],
  poster: ["video"],
  src: [
    "audio",
    "embed",
    "iframe",
    "img",
    "input",
    "script",
    "source",
    "track",
    "video"
  ]
};
const emptyOptions$2 = {};
function toString$1(value, options) {
  const settings = emptyOptions$2;
  const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
  const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
  return one(value, includeImageAlt, includeHtml);
}
function one(value, includeImageAlt, includeHtml) {
  if (node(value)) {
    if ("value" in value) {
      return value.type === "html" && !includeHtml ? "" : value.value;
    }
    if (includeImageAlt && "alt" in value && value.alt) {
      return value.alt;
    }
    if ("children" in value) {
      return all(value.children, includeImageAlt, includeHtml);
    }
  }
  if (Array.isArray(value)) {
    return all(value, includeImageAlt, includeHtml);
  }
  return "";
}
function all(values, includeImageAlt, includeHtml) {
  const result = [];
  let index2 = -1;
  while (++index2 < values.length) {
    result[index2] = one(values[index2], includeImageAlt, includeHtml);
  }
  return result.join("");
}
function node(value) {
  return Boolean(value && typeof value === "object");
}
const element = document.createElement("i");
function decodeNamedCharacterReference(value) {
  const characterReference2 = "&" + value + ";";
  element.innerHTML = characterReference2;
  const character = element.textContent;
  if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") {
    return false;
  }
  return character === characterReference2 ? false : character;
}
function splice(list2, start2, remove2, items) {
  const end = list2.length;
  let chunkStart = 0;
  let parameters;
  if (start2 < 0) {
    start2 = -start2 > end ? 0 : end + start2;
  } else {
    start2 = start2 > end ? end : start2;
  }
  remove2 = remove2 > 0 ? remove2 : 0;
  if (items.length < 1e4) {
    parameters = Array.from(items);
    parameters.unshift(start2, remove2);
    list2.splice(...parameters);
  } else {
    if (remove2) list2.splice(start2, remove2);
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + 1e4);
      parameters.unshift(start2, 0);
      list2.splice(...parameters);
      chunkStart += 1e4;
      start2 += 1e4;
    }
  }
}
function push(list2, items) {
  if (list2.length > 0) {
    splice(list2, list2.length, 0, items);
    return list2;
  }
  return items;
}
const hasOwnProperty = {}.hasOwnProperty;
function combineExtensions(extensions) {
  const all2 = {};
  let index2 = -1;
  while (++index2 < extensions.length) {
    syntaxExtension(all2, extensions[index2]);
  }
  return all2;
}
function syntaxExtension(all2, extension2) {
  let hook;
  for (hook in extension2) {
    const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : void 0;
    const left = maybe || (all2[hook] = {});
    const right = extension2[hook];
    let code2;
    if (right) {
      for (code2 in right) {
        if (!hasOwnProperty.call(left, code2)) left[code2] = [];
        const value = right[code2];
        constructs(
          // @ts-expect-error Looks like a list.
          left[code2],
          Array.isArray(value) ? value : value ? [value] : []
        );
      }
    }
  }
}
function constructs(existing, list2) {
  let index2 = -1;
  const before = [];
  while (++index2 < list2.length) {
    (list2[index2].add === "after" ? existing : before).push(list2[index2]);
  }
  splice(existing, 0, 0, before);
}
function decodeNumericCharacterReference(value, base) {
  const code2 = Number.parseInt(value, base);
  if (
    // C0 except for HT, LF, FF, CR, space.
    code2 < 9 || code2 === 11 || code2 > 13 && code2 < 32 || // Control character (DEL) of C0, and C1 controls.
    code2 > 126 && code2 < 160 || // Lone high surrogates and low surrogates.
    code2 > 55295 && code2 < 57344 || // Noncharacters.
    code2 > 64975 && code2 < 65008 || /* eslint-disable no-bitwise */
    (code2 & 65535) === 65535 || (code2 & 65535) === 65534 || /* eslint-enable no-bitwise */
    // Out of range
    code2 > 1114111
  ) {
    return "�";
  }
  return String.fromCodePoint(code2);
}
function normalizeIdentifier(value) {
  return value.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
const asciiAlpha = regexCheck(/[A-Za-z]/);
const asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
const asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
function asciiControl(code2) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code2 !== null && (code2 < 32 || code2 === 127)
  );
}
const asciiDigit = regexCheck(/\d/);
const asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
const asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
function markdownLineEnding(code2) {
  return code2 !== null && code2 < -2;
}
function markdownLineEndingOrSpace(code2) {
  return code2 !== null && (code2 < 0 || code2 === 32);
}
function markdownSpace(code2) {
  return code2 === -2 || code2 === -1 || code2 === 32;
}
const unicodePunctuation = regexCheck(new RegExp("\\p{P}|\\p{S}", "u"));
const unicodeWhitespace = regexCheck(/\s/);
function regexCheck(regex) {
  return check;
  function check(code2) {
    return code2 !== null && code2 > -1 && regex.test(String.fromCharCode(code2));
  }
}
function normalizeUri(value) {
  const result = [];
  let index2 = -1;
  let start2 = 0;
  let skip = 0;
  while (++index2 < value.length) {
    const code2 = value.charCodeAt(index2);
    let replace2 = "";
    if (code2 === 37 && asciiAlphanumeric(value.charCodeAt(index2 + 1)) && asciiAlphanumeric(value.charCodeAt(index2 + 2))) {
      skip = 2;
    } else if (code2 < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(code2))) {
        replace2 = String.fromCharCode(code2);
      }
    } else if (code2 > 55295 && code2 < 57344) {
      const next = value.charCodeAt(index2 + 1);
      if (code2 < 56320 && next > 56319 && next < 57344) {
        replace2 = String.fromCharCode(code2, next);
        skip = 1;
      } else {
        replace2 = "�";
      }
    } else {
      replace2 = String.fromCharCode(code2);
    }
    if (replace2) {
      result.push(value.slice(start2, index2), encodeURIComponent(replace2));
      start2 = index2 + skip + 1;
      replace2 = "";
    }
    if (skip) {
      index2 += skip;
      skip = 0;
    }
  }
  return result.join("") + value.slice(start2);
}
function factorySpace(effects, ok2, type, max) {
  const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
  let size = 0;
  return start2;
  function start2(code2) {
    if (markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return ok2(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size++ < limit) {
      effects.consume(code2);
      return prefix;
    }
    effects.exit(type);
    return ok2(code2);
  }
}
const content$1 = {
  tokenize: initializeContent
};
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  let previous2;
  return contentStart;
  function afterContentStartConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, contentStart, "linePrefix");
  }
  function paragraphInitial(code2) {
    effects.enter("paragraph");
    return lineStart(code2);
  }
  function lineStart(code2) {
    const token = effects.enter("chunkText", {
      contentType: "text",
      previous: previous2
    });
    if (previous2) {
      previous2.next = token;
    }
    previous2 = token;
    return data(code2);
  }
  function data(code2) {
    if (code2 === null) {
      effects.exit("chunkText");
      effects.exit("paragraph");
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      effects.exit("chunkText");
      return lineStart;
    }
    effects.consume(code2);
    return data;
  }
}
const document$2 = {
  tokenize: initializeDocument
};
const containerConstruct = {
  tokenize: tokenizeContainer
};
function initializeDocument(effects) {
  const self2 = this;
  const stack = [];
  let continued = 0;
  let childFlow;
  let childToken;
  let lineStartOffset;
  return start2;
  function start2(code2) {
    if (continued < stack.length) {
      const item = stack[continued];
      self2.containerState = item[1];
      return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code2);
    }
    return checkNewContainers(code2);
  }
  function documentContinue(code2) {
    continued++;
    if (self2.containerState._closeFlow) {
      self2.containerState._closeFlow = void 0;
      if (childFlow) {
        closeFlow();
      }
      const indexBeforeExits = self2.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let point2;
      while (indexBeforeFlow--) {
        if (self2.events[indexBeforeFlow][0] === "exit" && self2.events[indexBeforeFlow][1].type === "chunkFlow") {
          point2 = self2.events[indexBeforeFlow][1].end;
          break;
        }
      }
      exitContainers(continued);
      let index2 = indexBeforeExits;
      while (index2 < self2.events.length) {
        self2.events[index2][1].end = {
          ...point2
        };
        index2++;
      }
      splice(self2.events, indexBeforeFlow + 1, 0, self2.events.slice(indexBeforeExits));
      self2.events.length = index2;
      return checkNewContainers(code2);
    }
    return start2(code2);
  }
  function checkNewContainers(code2) {
    if (continued === stack.length) {
      if (!childFlow) {
        return documentContinued(code2);
      }
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code2);
      }
      self2.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }
    self2.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code2);
  }
  function thereIsANewContainer(code2) {
    if (childFlow) closeFlow();
    exitContainers(continued);
    return documentContinued(code2);
  }
  function thereIsNoNewContainer(code2) {
    self2.parser.lazy[self2.now().line] = continued !== stack.length;
    lineStartOffset = self2.now().offset;
    return flowStart(code2);
  }
  function documentContinued(code2) {
    self2.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code2);
  }
  function containerContinue(code2) {
    continued++;
    stack.push([self2.currentConstruct, self2.containerState]);
    return documentContinued(code2);
  }
  function flowStart(code2) {
    if (code2 === null) {
      if (childFlow) closeFlow();
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    childFlow = childFlow || self2.parser.flow(self2.now());
    effects.enter("chunkFlow", {
      _tokenizer: childFlow,
      contentType: "flow",
      previous: childToken
    });
    return flowContinue(code2);
  }
  function flowContinue(code2) {
    if (code2 === null) {
      writeToChild(effects.exit("chunkFlow"), true);
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      writeToChild(effects.exit("chunkFlow"));
      continued = 0;
      self2.interrupt = void 0;
      return start2;
    }
    effects.consume(code2);
    return flowContinue;
  }
  function writeToChild(token, endOfFile) {
    const stream = self2.sliceStream(token);
    if (endOfFile) stream.push(null);
    token.previous = childToken;
    if (childToken) childToken.next = token;
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);
    if (self2.parser.lazy[token.start.line]) {
      let index2 = childFlow.events.length;
      while (index2--) {
        if (
          // The token starts before the line ending…
          childFlow.events[index2][1].start.offset < lineStartOffset && // …and either is not ended yet…
          (!childFlow.events[index2][1].end || // …or ends after it.
          childFlow.events[index2][1].end.offset > lineStartOffset)
        ) {
          return;
        }
      }
      const indexBeforeExits = self2.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let seen;
      let point2;
      while (indexBeforeFlow--) {
        if (self2.events[indexBeforeFlow][0] === "exit" && self2.events[indexBeforeFlow][1].type === "chunkFlow") {
          if (seen) {
            point2 = self2.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      exitContainers(continued);
      index2 = indexBeforeExits;
      while (index2 < self2.events.length) {
        self2.events[index2][1].end = {
          ...point2
        };
        index2++;
      }
      splice(self2.events, indexBeforeFlow + 1, 0, self2.events.slice(indexBeforeExits));
      self2.events.length = index2;
    }
  }
  function exitContainers(size) {
    let index2 = stack.length;
    while (index2-- > size) {
      const entry = stack[index2];
      self2.containerState = entry[1];
      entry[0].exit.call(self2, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    childFlow.write([null]);
    childToken = void 0;
    childFlow = void 0;
    self2.containerState._closeFlow = void 0;
  }
}
function tokenizeContainer(effects, ok2, nok) {
  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok2, nok), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}
function classifyCharacter(code2) {
  if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
    return 1;
  }
  if (unicodePunctuation(code2)) {
    return 2;
  }
}
function resolveAll(constructs2, events, context) {
  const called = [];
  let index2 = -1;
  while (++index2 < constructs2.length) {
    const resolve = constructs2[index2].resolveAll;
    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context);
      called.push(resolve);
    }
  }
  return events;
}
const attention = {
  name: "attention",
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};
function resolveAllAttention(events, context) {
  let index2 = -1;
  let open;
  let group;
  let text2;
  let openingSequence;
  let closingSequence;
  let use;
  let nextEvents;
  let offset;
  while (++index2 < events.length) {
    if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
      open = index2;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) {
            continue;
          }
          use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
          const start2 = {
            ...events[open][1].end
          };
          const end = {
            ...events[index2][1].start
          };
          movePoint(start2, -use);
          movePoint(end, use);
          openingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: start2,
            end: {
              ...events[open][1].end
            }
          };
          closingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: {
              ...events[index2][1].start
            },
            end
          };
          text2 = {
            type: use > 1 ? "strongText" : "emphasisText",
            start: {
              ...events[open][1].end
            },
            end: {
              ...events[index2][1].start
            }
          };
          group = {
            type: use > 1 ? "strong" : "emphasis",
            start: {
              ...openingSequence.start
            },
            end: {
              ...closingSequence.end
            }
          };
          events[open][1].end = {
            ...openingSequence.start
          };
          events[index2][1].start = {
            ...closingSequence.end
          };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [["enter", events[open][1], context], ["exit", events[open][1], context]]);
          }
          nextEvents = push(nextEvents, [["enter", group, context], ["enter", openingSequence, context], ["exit", openingSequence, context], ["enter", text2, context]]);
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
          nextEvents = push(nextEvents, [["exit", text2, context], ["enter", closingSequence, context], ["exit", closingSequence, context], ["exit", group, context]]);
          if (events[index2][1].end.offset - events[index2][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [["enter", events[index2][1], context], ["exit", events[index2][1], context]]);
          } else {
            offset = 0;
          }
          splice(events, open - 1, index2 - open + 3, nextEvents);
          index2 = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index2 = -1;
  while (++index2 < events.length) {
    if (events[index2][1].type === "attentionSequence") {
      events[index2][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok2) {
  const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
  const previous2 = this.previous;
  const before = classifyCharacter(previous2);
  let marker;
  return start2;
  function start2(code2) {
    marker = code2;
    effects.enter("attentionSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const after = classifyCharacter(code2);
    const open = !after || after === 2 && before || attentionMarkers2.includes(code2);
    const close = !before || before === 2 && after || attentionMarkers2.includes(previous2);
    token._open = Boolean(marker === 42 ? open : open && (before || !close));
    token._close = Boolean(marker === 42 ? close : close && (after || !open));
    return ok2(code2);
  }
}
function movePoint(point2, offset) {
  point2.column += offset;
  point2.offset += offset;
  point2._bufferIndex += offset;
}
const autolink = {
  name: "autolink",
  tokenize: tokenizeAutolink
};
function tokenizeAutolink(effects, ok2, nok) {
  let size = 0;
  return start2;
  function start2(code2) {
    effects.enter("autolink");
    effects.enter("autolinkMarker");
    effects.consume(code2);
    effects.exit("autolinkMarker");
    effects.enter("autolinkProtocol");
    return open;
  }
  function open(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return schemeOrEmailAtext;
    }
    if (code2 === 64) {
      return nok(code2);
    }
    return emailAtext(code2);
  }
  function schemeOrEmailAtext(code2) {
    if (code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) {
      size = 1;
      return schemeInsideOrEmailAtext(code2);
    }
    return emailAtext(code2);
  }
  function schemeInsideOrEmailAtext(code2) {
    if (code2 === 58) {
      effects.consume(code2);
      size = 0;
      return urlInside;
    }
    if ((code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) && size++ < 32) {
      effects.consume(code2);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code2);
  }
  function urlInside(code2) {
    if (code2 === 62) {
      effects.exit("autolinkProtocol");
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok2;
    }
    if (code2 === null || code2 === 32 || code2 === 60 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return urlInside;
  }
  function emailAtext(code2) {
    if (code2 === 64) {
      effects.consume(code2);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code2)) {
      effects.consume(code2);
      return emailAtext;
    }
    return nok(code2);
  }
  function emailAtSignOrDot(code2) {
    return asciiAlphanumeric(code2) ? emailLabel(code2) : nok(code2);
  }
  function emailLabel(code2) {
    if (code2 === 46) {
      effects.consume(code2);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code2 === 62) {
      effects.exit("autolinkProtocol").type = "autolinkEmail";
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok2;
    }
    return emailValue(code2);
  }
  function emailValue(code2) {
    if ((code2 === 45 || asciiAlphanumeric(code2)) && size++ < 63) {
      const next = code2 === 45 ? emailValue : emailLabel;
      effects.consume(code2);
      return next;
    }
    return nok(code2);
  }
}
const blankLine = {
  partial: true,
  tokenize: tokenizeBlankLine
};
function tokenizeBlankLine(effects, ok2, nok) {
  return start2;
  function start2(code2) {
    return markdownSpace(code2) ? factorySpace(effects, after, "linePrefix")(code2) : after(code2);
  }
  function after(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok2(code2) : nok(code2);
  }
}
const blockQuote = {
  continuation: {
    tokenize: tokenizeBlockQuoteContinuation
  },
  exit: exit$1,
  name: "blockQuote",
  tokenize: tokenizeBlockQuoteStart
};
function tokenizeBlockQuoteStart(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    if (code2 === 62) {
      const state = self2.containerState;
      if (!state.open) {
        effects.enter("blockQuote", {
          _container: true
        });
        state.open = true;
      }
      effects.enter("blockQuotePrefix");
      effects.enter("blockQuoteMarker");
      effects.consume(code2);
      effects.exit("blockQuoteMarker");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownSpace(code2)) {
      effects.enter("blockQuotePrefixWhitespace");
      effects.consume(code2);
      effects.exit("blockQuotePrefixWhitespace");
      effects.exit("blockQuotePrefix");
      return ok2;
    }
    effects.exit("blockQuotePrefix");
    return ok2(code2);
  }
}
function tokenizeBlockQuoteContinuation(effects, ok2, nok) {
  const self2 = this;
  return contStart;
  function contStart(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, contBefore, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return contBefore(code2);
  }
  function contBefore(code2) {
    return effects.attempt(blockQuote, ok2, nok)(code2);
  }
}
function exit$1(effects) {
  effects.exit("blockQuote");
}
const characterEscape = {
  name: "characterEscape",
  tokenize: tokenizeCharacterEscape
};
function tokenizeCharacterEscape(effects, ok2, nok) {
  return start2;
  function start2(code2) {
    effects.enter("characterEscape");
    effects.enter("escapeMarker");
    effects.consume(code2);
    effects.exit("escapeMarker");
    return inside;
  }
  function inside(code2) {
    if (asciiPunctuation(code2)) {
      effects.enter("characterEscapeValue");
      effects.consume(code2);
      effects.exit("characterEscapeValue");
      effects.exit("characterEscape");
      return ok2;
    }
    return nok(code2);
  }
}
const characterReference = {
  name: "characterReference",
  tokenize: tokenizeCharacterReference
};
function tokenizeCharacterReference(effects, ok2, nok) {
  const self2 = this;
  let size = 0;
  let max;
  let test;
  return start2;
  function start2(code2) {
    effects.enter("characterReference");
    effects.enter("characterReferenceMarker");
    effects.consume(code2);
    effects.exit("characterReferenceMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 35) {
      effects.enter("characterReferenceMarkerNumeric");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerNumeric");
      return numeric;
    }
    effects.enter("characterReferenceValue");
    max = 31;
    test = asciiAlphanumeric;
    return value(code2);
  }
  function numeric(code2) {
    if (code2 === 88 || code2 === 120) {
      effects.enter("characterReferenceMarkerHexadecimal");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerHexadecimal");
      effects.enter("characterReferenceValue");
      max = 6;
      test = asciiHexDigit;
      return value;
    }
    effects.enter("characterReferenceValue");
    max = 7;
    test = asciiDigit;
    return value(code2);
  }
  function value(code2) {
    if (code2 === 59 && size) {
      const token = effects.exit("characterReferenceValue");
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self2.sliceSerialize(token))) {
        return nok(code2);
      }
      effects.enter("characterReferenceMarker");
      effects.consume(code2);
      effects.exit("characterReferenceMarker");
      effects.exit("characterReference");
      return ok2;
    }
    if (test(code2) && size++ < max) {
      effects.consume(code2);
      return value;
    }
    return nok(code2);
  }
}
const nonLazyContinuation = {
  partial: true,
  tokenize: tokenizeNonLazyContinuation
};
const codeFenced = {
  concrete: true,
  name: "codeFenced",
  tokenize: tokenizeCodeFenced
};
function tokenizeCodeFenced(effects, ok2, nok) {
  const self2 = this;
  const closeStart = {
    partial: true,
    tokenize: tokenizeCloseStart
  };
  let initialPrefix = 0;
  let sizeOpen = 0;
  let marker;
  return start2;
  function start2(code2) {
    return beforeSequenceOpen(code2);
  }
  function beforeSequenceOpen(code2) {
    const tail = self2.events[self2.events.length - 1];
    initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code2;
    effects.enter("codeFenced");
    effects.enter("codeFencedFence");
    effects.enter("codeFencedFenceSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === marker) {
      sizeOpen++;
      effects.consume(code2);
      return sequenceOpen;
    }
    if (sizeOpen < 3) {
      return nok(code2);
    }
    effects.exit("codeFencedFenceSequence");
    return markdownSpace(code2) ? factorySpace(effects, infoBefore, "whitespace")(code2) : infoBefore(code2);
  }
  function infoBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFencedFence");
      return self2.interrupt ? ok2(code2) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFencedFenceInfo");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return info(code2);
  }
  function info(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return infoBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return factorySpace(effects, metaBefore, "whitespace")(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return info;
  }
  function metaBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return infoBefore(code2);
    }
    effects.enter("codeFencedFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code2);
  }
  function meta(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceMeta");
      return infoBefore(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return meta;
  }
  function atNonLazyBreak(code2) {
    return effects.attempt(closeStart, after, contentBefore)(code2);
  }
  function contentBefore(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return contentStart;
  }
  function contentStart(code2) {
    return initialPrefix > 0 && markdownSpace(code2) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code2) : beforeContentChunk(code2);
  }
  function beforeContentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return contentChunk(code2);
  }
  function contentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return beforeContentChunk(code2);
    }
    effects.consume(code2);
    return contentChunk;
  }
  function after(code2) {
    effects.exit("codeFenced");
    return ok2(code2);
  }
  function tokenizeCloseStart(effects2, ok3, nok2) {
    let size = 0;
    return startBefore;
    function startBefore(code2) {
      effects2.enter("lineEnding");
      effects2.consume(code2);
      effects2.exit("lineEnding");
      return start3;
    }
    function start3(code2) {
      effects2.enter("codeFencedFence");
      return markdownSpace(code2) ? factorySpace(effects2, beforeSequenceClose, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : beforeSequenceClose(code2);
    }
    function beforeSequenceClose(code2) {
      if (code2 === marker) {
        effects2.enter("codeFencedFenceSequence");
        return sequenceClose(code2);
      }
      return nok2(code2);
    }
    function sequenceClose(code2) {
      if (code2 === marker) {
        size++;
        effects2.consume(code2);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects2.exit("codeFencedFenceSequence");
        return markdownSpace(code2) ? factorySpace(effects2, sequenceCloseAfter, "whitespace")(code2) : sequenceCloseAfter(code2);
      }
      return nok2(code2);
    }
    function sequenceCloseAfter(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects2.exit("codeFencedFence");
        return ok3(code2);
      }
      return nok2(code2);
    }
  }
}
function tokenizeNonLazyContinuation(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineStart;
  }
  function lineStart(code2) {
    return self2.parser.lazy[self2.now().line] ? nok(code2) : ok2(code2);
  }
}
const codeIndented = {
  name: "codeIndented",
  tokenize: tokenizeCodeIndented
};
const furtherStart = {
  partial: true,
  tokenize: tokenizeFurtherStart
};
function tokenizeCodeIndented(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    effects.enter("codeIndented");
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code2);
  }
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? atBreak(code2) : nok(code2);
  }
  function atBreak(code2) {
    if (code2 === null) {
      return after(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.attempt(furtherStart, atBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return atBreak(code2);
    }
    effects.consume(code2);
    return inside;
  }
  function after(code2) {
    effects.exit("codeIndented");
    return ok2(code2);
  }
}
function tokenizeFurtherStart(effects, ok2, nok) {
  const self2 = this;
  return furtherStart2;
  function furtherStart2(code2) {
    if (self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return furtherStart2;
    }
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code2);
  }
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? ok2(code2) : markdownLineEnding(code2) ? furtherStart2(code2) : nok(code2);
  }
}
const codeText = {
  name: "codeText",
  previous: previous$1,
  resolve: resolveCodeText,
  tokenize: tokenizeCodeText
};
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index2;
  let enter;
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
    index2 = headEnterIndex;
    while (++index2 < tailExitIndex) {
      if (events[index2][1].type === "codeTextData") {
        events[headEnterIndex][1].type = "codeTextPadding";
        events[tailExitIndex][1].type = "codeTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index2 = headEnterIndex - 1;
  tailExitIndex++;
  while (++index2 <= tailExitIndex) {
    if (enter === void 0) {
      if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
        enter = index2;
      }
    } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
      events[enter][1].type = "codeTextData";
      if (index2 !== enter + 2) {
        events[enter][1].end = events[index2 - 1][1].end;
        events.splice(enter + 2, index2 - enter - 2);
        tailExitIndex -= index2 - enter - 2;
        index2 = enter + 2;
      }
      enter = void 0;
    }
  }
  return events;
}
function previous$1(code2) {
  return code2 !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function tokenizeCodeText(effects, ok2, nok) {
  let sizeOpen = 0;
  let size;
  let token;
  return start2;
  function start2(code2) {
    effects.enter("codeText");
    effects.enter("codeTextSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit("codeTextSequence");
    return between(code2);
  }
  function between(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 32) {
      effects.enter("space");
      effects.consume(code2);
      effects.exit("space");
      return between;
    }
    if (code2 === 96) {
      token = effects.enter("codeTextSequence");
      size = 0;
      return sequenceClose(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return between;
    }
    effects.enter("codeTextData");
    return data(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 32 || code2 === 96 || markdownLineEnding(code2)) {
      effects.exit("codeTextData");
      return between(code2);
    }
    effects.consume(code2);
    return data;
  }
  function sequenceClose(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      size++;
      return sequenceClose;
    }
    if (size === sizeOpen) {
      effects.exit("codeTextSequence");
      effects.exit("codeText");
      return ok2(code2);
    }
    token.type = "codeTextData";
    return data(code2);
  }
}
class SpliceBuffer {
  /**
   * @param {ReadonlyArray<T> | null | undefined} [initial]
   *   Initial items (optional).
   * @returns
   *   Splice buffer.
   */
  constructor(initial) {
    this.left = initial ? [...initial] : [];
    this.right = [];
  }
  /**
   * Array access;
   * does not move the cursor.
   *
   * @param {number} index
   *   Index.
   * @return {T}
   *   Item.
   */
  get(index2) {
    if (index2 < 0 || index2 >= this.left.length + this.right.length) {
      throw new RangeError("Cannot access index `" + index2 + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
    }
    if (index2 < this.left.length) return this.left[index2];
    return this.right[this.right.length - index2 + this.left.length - 1];
  }
  /**
   * The length of the splice buffer, one greater than the largest index in the
   * array.
   */
  get length() {
    return this.left.length + this.right.length;
  }
  /**
   * Remove and return `list[0]`;
   * moves the cursor to `0`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  shift() {
    this.setCursor(0);
    return this.right.pop();
  }
  /**
   * Slice the buffer to get an array;
   * does not move the cursor.
   *
   * @param {number} start
   *   Start.
   * @param {number | null | undefined} [end]
   *   End (optional).
   * @returns {Array<T>}
   *   Array of items.
   */
  slice(start2, end) {
    const stop = end === null || end === void 0 ? Number.POSITIVE_INFINITY : end;
    if (stop < this.left.length) {
      return this.left.slice(start2, stop);
    }
    if (start2 > this.left.length) {
      return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start2 + this.left.length).reverse();
    }
    return this.left.slice(start2).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
  }
  /**
   * Mimics the behavior of Array.prototype.splice() except for the change of
   * interface necessary to avoid segfaults when patching in very large arrays.
   *
   * This operation moves cursor is moved to `start` and results in the cursor
   * placed after any inserted items.
   *
   * @param {number} start
   *   Start;
   *   zero-based index at which to start changing the array;
   *   negative numbers count backwards from the end of the array and values
   *   that are out-of bounds are clamped to the appropriate end of the array.
   * @param {number | null | undefined} [deleteCount=0]
   *   Delete count (default: `0`);
   *   maximum number of elements to delete, starting from start.
   * @param {Array<T> | null | undefined} [items=[]]
   *   Items to include in place of the deleted items (default: `[]`).
   * @return {Array<T>}
   *   Any removed items.
   */
  splice(start2, deleteCount, items) {
    const count = deleteCount || 0;
    this.setCursor(Math.trunc(start2));
    const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
    if (items) chunkedPush(this.left, items);
    return removed.reverse();
  }
  /**
   * Remove and return the highest-numbered item in the array, so
   * `list[list.length - 1]`;
   * Moves the cursor to `length`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  pop() {
    this.setCursor(Number.POSITIVE_INFINITY);
    return this.left.pop();
  }
  /**
   * Inserts a single item to the high-numbered side of the array;
   * moves the cursor to `length`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  push(item) {
    this.setCursor(Number.POSITIVE_INFINITY);
    this.left.push(item);
  }
  /**
   * Inserts many items to the high-numbered side of the array.
   * Moves the cursor to `length`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  pushMany(items) {
    this.setCursor(Number.POSITIVE_INFINITY);
    chunkedPush(this.left, items);
  }
  /**
   * Inserts a single item to the low-numbered side of the array;
   * Moves the cursor to `0`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  unshift(item) {
    this.setCursor(0);
    this.right.push(item);
  }
  /**
   * Inserts many items to the low-numbered side of the array;
   * moves the cursor to `0`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  unshiftMany(items) {
    this.setCursor(0);
    chunkedPush(this.right, items.reverse());
  }
  /**
   * Move the cursor to a specific position in the array. Requires
   * time proportional to the distance moved.
   *
   * If `n < 0`, the cursor will end up at the beginning.
   * If `n > length`, the cursor will end up at the end.
   *
   * @param {number} n
   *   Position.
   * @return {undefined}
   *   Nothing.
   */
  setCursor(n) {
    if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0) return;
    if (n < this.left.length) {
      const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
      chunkedPush(this.right, removed.reverse());
    } else {
      const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
      chunkedPush(this.left, removed.reverse());
    }
  }
}
function chunkedPush(list2, right) {
  let chunkStart = 0;
  if (right.length < 1e4) {
    list2.push(...right);
  } else {
    while (chunkStart < right.length) {
      list2.push(...right.slice(chunkStart, chunkStart + 1e4));
      chunkStart += 1e4;
    }
  }
}
function subtokenize(eventsArray) {
  const jumps = {};
  let index2 = -1;
  let event;
  let lineIndex;
  let otherIndex;
  let otherEvent;
  let parameters;
  let subevents;
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index2 < events.length) {
    while (index2 in jumps) {
      index2 = jumps[index2];
    }
    event = events.get(index2);
    if (index2 && event[1].type === "chunkFlow" && events.get(index2 - 1)[1].type === "listItemPrefix") {
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === "content") {
            break;
          }
          if (subevents[otherIndex][1].type === "chunkText") {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }
    if (event[0] === "enter") {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index2));
        index2 = jumps[index2];
        more = true;
      }
    } else if (event[1]._container) {
      otherIndex = index2;
      lineIndex = void 0;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
          if (otherEvent[0] === "enter") {
            if (lineIndex) {
              events.get(lineIndex)[1].type = "lineEndingBlank";
            }
            otherEvent[1].type = "lineEnding";
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") ;
        else {
          break;
        }
      }
      if (lineIndex) {
        event[1].end = {
          ...events.get(lineIndex)[1].start
        };
        parameters = events.slice(lineIndex, index2);
        parameters.unshift(event);
        events.splice(lineIndex, index2 - lineIndex + 1, parameters);
      }
    }
  }
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  const startPositions = [];
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  const jumps = [];
  const gaps = {};
  let stream;
  let previous2;
  let index2 = -1;
  let current = token;
  let adjust = 0;
  let start2 = 0;
  const breaks = [start2];
  while (current) {
    while (events.get(++startPosition)[1] !== current) {
    }
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(null);
      }
      if (previous2) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = void 0;
      }
    }
    previous2 = current;
    current = current.next;
  }
  current = token;
  while (++index2 < childEvents.length) {
    if (
      // Find a void token that includes a break.
      childEvents[index2][0] === "exit" && childEvents[index2 - 1][0] === "enter" && childEvents[index2][1].type === childEvents[index2 - 1][1].type && childEvents[index2][1].start.line !== childEvents[index2][1].end.line
    ) {
      start2 = index2 + 1;
      breaks.push(start2);
      current._tokenizer = void 0;
      current.previous = void 0;
      current = current.next;
    }
  }
  tokenizer.events = [];
  if (current) {
    current._tokenizer = void 0;
    current.previous = void 0;
  } else {
    breaks.pop();
  }
  index2 = breaks.length;
  while (index2--) {
    const slice = childEvents.slice(breaks[index2], breaks[index2 + 1]);
    const start3 = startPositions.pop();
    jumps.push([start3, start3 + slice.length - 1]);
    events.splice(start3, 2, slice);
  }
  jumps.reverse();
  index2 = -1;
  while (++index2 < jumps.length) {
    gaps[adjust + jumps[index2][0]] = adjust + jumps[index2][1];
    adjust += jumps[index2][1] - jumps[index2][0] - 1;
  }
  return gaps;
}
const content = {
  resolve: resolveContent,
  tokenize: tokenizeContent
};
const continuationConstruct = {
  partial: true,
  tokenize: tokenizeContinuation
};
function resolveContent(events) {
  subtokenize(events);
  return events;
}
function tokenizeContent(effects, ok2) {
  let previous2;
  return chunkStart;
  function chunkStart(code2) {
    effects.enter("content");
    previous2 = effects.enter("chunkContent", {
      contentType: "content"
    });
    return chunkInside(code2);
  }
  function chunkInside(code2) {
    if (code2 === null) {
      return contentEnd(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code2);
    }
    effects.consume(code2);
    return chunkInside;
  }
  function contentEnd(code2) {
    effects.exit("chunkContent");
    effects.exit("content");
    return ok2(code2);
  }
  function contentContinue(code2) {
    effects.consume(code2);
    effects.exit("chunkContent");
    previous2.next = effects.enter("chunkContent", {
      contentType: "content",
      previous: previous2
    });
    previous2 = previous2.next;
    return chunkInside;
  }
}
function tokenizeContinuation(effects, ok2, nok) {
  const self2 = this;
  return startLookahead;
  function startLookahead(code2) {
    effects.exit("chunkContent");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, prefixed, "linePrefix");
  }
  function prefixed(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    const tail = self2.events[self2.events.length - 1];
    if (!self2.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
      return ok2(code2);
    }
    return effects.interrupt(self2.parser.constructs.flow, nok, ok2)(code2);
  }
}
function factoryDestination(effects, ok2, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start2;
  function start2(code2) {
    if (code2 === 60) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }
    if (code2 === null || code2 === 32 || code2 === 41 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return raw(code2);
  }
  function enclosedBefore(code2) {
    if (code2 === 62) {
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return enclosed(code2);
  }
  function enclosed(code2) {
    if (code2 === 62) {
      effects.exit("chunkString");
      effects.exit(stringType);
      return enclosedBefore(code2);
    }
    if (code2 === null || code2 === 60 || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? enclosedEscape : enclosed;
  }
  function enclosedEscape(code2) {
    if (code2 === 60 || code2 === 62 || code2 === 92) {
      effects.consume(code2);
      return enclosed;
    }
    return enclosed(code2);
  }
  function raw(code2) {
    if (!balance && (code2 === null || code2 === 41 || markdownLineEndingOrSpace(code2))) {
      effects.exit("chunkString");
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok2(code2);
    }
    if (balance < limit && code2 === 40) {
      effects.consume(code2);
      balance++;
      return raw;
    }
    if (code2 === 41) {
      effects.consume(code2);
      balance--;
      return raw;
    }
    if (code2 === null || code2 === 32 || code2 === 40 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? rawEscape : raw;
  }
  function rawEscape(code2) {
    if (code2 === 40 || code2 === 41 || code2 === 92) {
      effects.consume(code2);
      return raw;
    }
    return raw(code2);
  }
}
function factoryLabel(effects, ok2, nok, type, markerType, stringType) {
  const self2 = this;
  let size = 0;
  let seen;
  return start2;
  function start2(code2) {
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code2);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }
  function atBreak(code2) {
    if (size > 999 || code2 === null || code2 === 91 || code2 === 93 && !seen || // To do: remove in the future once we’ve switched from
    // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
    // which doesn’t need this.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    code2 === 94 && !size && "_hiddenFootnoteSupport" in self2.parser.constructs) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return atBreak;
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return labelInside(code2);
  }
  function labelInside(code2) {
    if (code2 === null || code2 === 91 || code2 === 93 || markdownLineEnding(code2) || size++ > 999) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    if (!seen) seen = !markdownSpace(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
}
function factoryTitle(effects, ok2, nok, type, markerType, stringType) {
  let marker;
  return start2;
  function start2(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      marker = code2 === 40 ? 41 : code2;
      return begin;
    }
    return nok(code2);
  }
  function begin(code2) {
    if (code2 === marker) {
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok2;
    }
    effects.enter(stringType);
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return factorySpace(effects, atBreak, "linePrefix");
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker || code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? escape : inside;
  }
  function escape(code2) {
    if (code2 === marker || code2 === 92) {
      effects.consume(code2);
      return inside;
    }
    return inside(code2);
  }
}
function factoryWhitespace(effects, ok2) {
  let seen;
  return start2;
  function start2(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      seen = true;
      return start2;
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, start2, seen ? "linePrefix" : "lineSuffix")(code2);
    }
    return ok2(code2);
  }
}
const definition$1 = {
  name: "definition",
  tokenize: tokenizeDefinition
};
const titleBefore = {
  partial: true,
  tokenize: tokenizeTitleBefore
};
function tokenizeDefinition(effects, ok2, nok) {
  const self2 = this;
  let identifier;
  return start2;
  function start2(code2) {
    effects.enter("definition");
    return before(code2);
  }
  function before(code2) {
    return factoryLabel.call(
      self2,
      effects,
      labelAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionLabel",
      "definitionLabelMarker",
      "definitionLabelString"
    )(code2);
  }
  function labelAfter(code2) {
    identifier = normalizeIdentifier(self2.sliceSerialize(self2.events[self2.events.length - 1][1]).slice(1, -1));
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      return markerAfter;
    }
    return nok(code2);
  }
  function markerAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, destinationBefore)(code2) : destinationBefore(code2);
  }
  function destinationBefore(code2) {
    return factoryDestination(
      effects,
      destinationAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionDestination",
      "definitionDestinationLiteral",
      "definitionDestinationLiteralMarker",
      "definitionDestinationRaw",
      "definitionDestinationString"
    )(code2);
  }
  function destinationAfter(code2) {
    return effects.attempt(titleBefore, after, after)(code2);
  }
  function after(code2) {
    return markdownSpace(code2) ? factorySpace(effects, afterWhitespace, "whitespace")(code2) : afterWhitespace(code2);
  }
  function afterWhitespace(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("definition");
      self2.parser.defined.push(identifier);
      return ok2(code2);
    }
    return nok(code2);
  }
}
function tokenizeTitleBefore(effects, ok2, nok) {
  return titleBefore2;
  function titleBefore2(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, beforeMarker)(code2) : nok(code2);
  }
  function beforeMarker(code2) {
    return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code2);
  }
  function titleAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code2) : titleAfterOptionalWhitespace(code2);
  }
  function titleAfterOptionalWhitespace(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok2(code2) : nok(code2);
  }
}
const hardBreakEscape = {
  name: "hardBreakEscape",
  tokenize: tokenizeHardBreakEscape
};
function tokenizeHardBreakEscape(effects, ok2, nok) {
  return start2;
  function start2(code2) {
    effects.enter("hardBreakEscape");
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      effects.exit("hardBreakEscape");
      return ok2(code2);
    }
    return nok(code2);
  }
}
const headingAtx = {
  name: "headingAtx",
  resolve: resolveHeadingAtx,
  tokenize: tokenizeHeadingAtx
};
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  let content2;
  let text2;
  if (events[contentStart][1].type === "whitespace") {
    contentStart += 2;
  }
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    content2 = {
      type: "atxHeadingText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    text2 = {
      type: "chunkText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: "text"
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [["enter", content2, context], ["enter", text2, context], ["exit", text2, context], ["exit", content2, context]]);
  }
  return events;
}
function tokenizeHeadingAtx(effects, ok2, nok) {
  let size = 0;
  return start2;
  function start2(code2) {
    effects.enter("atxHeading");
    return before(code2);
  }
  function before(code2) {
    effects.enter("atxHeadingSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 35 && size++ < 6) {
      effects.consume(code2);
      return sequenceOpen;
    }
    if (code2 === null || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingSequence");
      return atBreak(code2);
    }
    return nok(code2);
  }
  function atBreak(code2) {
    if (code2 === 35) {
      effects.enter("atxHeadingSequence");
      return sequenceFurther(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("atxHeading");
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, atBreak, "whitespace")(code2);
    }
    effects.enter("atxHeadingText");
    return data(code2);
  }
  function sequenceFurther(code2) {
    if (code2 === 35) {
      effects.consume(code2);
      return sequenceFurther;
    }
    effects.exit("atxHeadingSequence");
    return atBreak(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 35 || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingText");
      return atBreak(code2);
    }
    effects.consume(code2);
    return data;
  }
}
const htmlBlockNames = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];
const htmlRawNames = ["pre", "script", "style", "textarea"];
const htmlFlow = {
  concrete: true,
  name: "htmlFlow",
  resolveTo: resolveToHtmlFlow,
  tokenize: tokenizeHtmlFlow
};
const blankLineBefore = {
  partial: true,
  tokenize: tokenizeBlankLineBefore
};
const nonLazyContinuationStart = {
  partial: true,
  tokenize: tokenizeNonLazyContinuationStart
};
function resolveToHtmlFlow(events) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][0] === "enter" && events[index2][1].type === "htmlFlow") {
      break;
    }
  }
  if (index2 > 1 && events[index2 - 2][1].type === "linePrefix") {
    events[index2][1].start = events[index2 - 2][1].start;
    events[index2 + 1][1].start = events[index2 - 2][1].start;
    events.splice(index2 - 2, 2);
  }
  return events;
}
function tokenizeHtmlFlow(effects, ok2, nok) {
  const self2 = this;
  let marker;
  let closingTag;
  let buffer;
  let index2;
  let markerB;
  return start2;
  function start2(code2) {
    return before(code2);
  }
  function before(code2) {
    effects.enter("htmlFlow");
    effects.enter("htmlFlowData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      closingTag = true;
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      marker = 3;
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      marker = 2;
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      marker = 5;
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      marker = 4;
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return self2.interrupt ? ok2 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      if (index2 === value.length) {
        return self2.interrupt ? ok2 : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function tagName(code2) {
    if (code2 === null || code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      const slash = code2 === 47;
      const name2 = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name2)) {
        marker = 1;
        return self2.interrupt ? ok2(code2) : continuation(code2);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = 6;
        if (slash) {
          effects.consume(code2);
          return basicSelfClosing;
        }
        return self2.interrupt ? ok2(code2) : continuation(code2);
      }
      marker = 7;
      return self2.interrupt && !self2.parser.lazy[self2.now().line] ? nok(code2) : closingTag ? completeClosingTagAfter(code2) : completeAttributeNameBefore(code2);
    }
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function basicSelfClosing(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return self2.interrupt ? ok2 : continuation;
    }
    return nok(code2);
  }
  function completeClosingTagAfter(code2) {
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeClosingTagAfter;
    }
    return completeEnd(code2);
  }
  function completeAttributeNameBefore(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return completeEnd;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameBefore;
    }
    return completeEnd(code2);
  }
  function completeAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code2);
  }
  function completeAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code2);
  }
  function completeAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      markerB = code2;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code2);
  }
  function completeAttributeValueQuoted(code2) {
    if (code2 === markerB) {
      effects.consume(code2);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return completeAttributeValueQuoted;
  }
  function completeAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 47 || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96 || markdownLineEndingOrSpace(code2)) {
      return completeAttributeNameAfter(code2);
    }
    effects.consume(code2);
    return completeAttributeValueUnquoted;
  }
  function completeAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownSpace(code2)) {
      return completeAttributeNameBefore(code2);
    }
    return nok(code2);
  }
  function completeEnd(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function completeAfter(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuation(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function continuation(code2) {
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationCommentInside;
    }
    if (code2 === 60 && marker === 1) {
      effects.consume(code2);
      return continuationRawTagOpen;
    }
    if (code2 === 62 && marker === 4) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 63 && marker === 3) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    if (code2 === 93 && marker === 5) {
      effects.consume(code2);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code2) && (marker === 6 || marker === 7)) {
      effects.exit("htmlFlowData");
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationStart(code2);
    }
    effects.consume(code2);
    return continuation;
  }
  function continuationStart(code2) {
    return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code2);
  }
  function continuationStartNonLazy(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return continuationBefore;
  }
  function continuationBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuationStart(code2);
    }
    effects.enter("htmlFlowData");
    return continuation(code2);
  }
  function continuationCommentInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationRawTagOpen(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      buffer = "";
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationRawEndTag(code2) {
    if (code2 === 62) {
      const name2 = buffer.toLowerCase();
      if (htmlRawNames.includes(name2)) {
        effects.consume(code2);
        return continuationClose;
      }
      return continuation(code2);
    }
    if (asciiAlpha(code2) && buffer.length < 8) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationCdataInside(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationDeclarationInside(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationClose(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationAfter(code2);
    }
    effects.consume(code2);
    return continuationClose;
  }
  function continuationAfter(code2) {
    effects.exit("htmlFlow");
    return ok2(code2);
  }
}
function tokenizeNonLazyContinuationStart(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    return self2.parser.lazy[self2.now().line] ? nok(code2) : ok2(code2);
  }
}
function tokenizeBlankLineBefore(effects, ok2, nok) {
  return start2;
  function start2(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return effects.attempt(blankLine, ok2, nok);
  }
}
const htmlText = {
  name: "htmlText",
  tokenize: tokenizeHtmlText
};
function tokenizeHtmlText(effects, ok2, nok) {
  const self2 = this;
  let marker;
  let index2;
  let returnState;
  return start2;
  function start2(code2) {
    effects.enter("htmlText");
    effects.enter("htmlTextData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instruction;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return declaration;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return nok(code2);
  }
  function comment(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 45) {
      effects.consume(code2);
      return commentClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = comment;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return comment;
  }
  function commentClose(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return comment(code2);
  }
  function commentEnd(code2) {
    return code2 === 62 ? end(code2) : code2 === 45 ? commentClose(code2) : comment(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      return index2 === value.length ? cdata : cdataOpenInside;
    }
    return nok(code2);
  }
  function cdata(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = cdata;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return cdata;
  }
  function cdataClose(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function cdataEnd(code2) {
    if (code2 === 62) {
      return end(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function declaration(code2) {
    if (code2 === null || code2 === 62) {
      return end(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = declaration;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return declaration;
  }
  function instruction(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instructionClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = instruction;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return instruction;
  }
  function instructionClose(code2) {
    return code2 === 62 ? end(code2) : instruction(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return nok(code2);
  }
  function tagClose(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return tagCloseBetween(code2);
  }
  function tagCloseBetween(code2) {
    if (markdownLineEnding(code2)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagCloseBetween;
    }
    return end(code2);
  }
  function tagOpen(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function tagOpenBetween(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return end;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenBetween;
    }
    return end(code2);
  }
  function tagOpenAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code2);
  }
  function tagOpenAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code2);
  }
  function tagOpenAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      marker = code2;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuoted(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      marker = void 0;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueQuoted;
  }
  function tagOpenAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 60 || code2 === 61 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function end(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      effects.exit("htmlTextData");
      effects.exit("htmlText");
      return ok2;
    }
    return nok(code2);
  }
  function lineEndingBefore(code2) {
    effects.exit("htmlTextData");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineEndingAfter;
  }
  function lineEndingAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : lineEndingAfterPrefix(code2);
  }
  function lineEndingAfterPrefix(code2) {
    effects.enter("htmlTextData");
    return returnState(code2);
  }
}
const labelEnd = {
  name: "labelEnd",
  resolveAll: resolveAllLabelEnd,
  resolveTo: resolveToLabelEnd,
  tokenize: tokenizeLabelEnd
};
const resourceConstruct = {
  tokenize: tokenizeResource
};
const referenceFullConstruct = {
  tokenize: tokenizeReferenceFull
};
const referenceCollapsedConstruct = {
  tokenize: tokenizeReferenceCollapsed
};
function resolveAllLabelEnd(events) {
  let index2 = -1;
  const newEvents = [];
  while (++index2 < events.length) {
    const token = events[index2][1];
    newEvents.push(events[index2]);
    if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
      const offset = token.type === "labelImage" ? 4 : 2;
      token.type = "data";
      index2 += offset;
    }
  }
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}
function resolveToLabelEnd(events, context) {
  let index2 = events.length;
  let offset = 0;
  let token;
  let open;
  let close;
  let media;
  while (index2--) {
    token = events[index2][1];
    if (open) {
      if (token.type === "link" || token.type === "labelLink" && token._inactive) {
        break;
      }
      if (events[index2][0] === "enter" && token.type === "labelLink") {
        token._inactive = true;
      }
    } else if (close) {
      if (events[index2][0] === "enter" && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
        open = index2;
        if (token.type !== "labelLink") {
          offset = 2;
          break;
        }
      }
    } else if (token.type === "labelEnd") {
      close = index2;
    }
  }
  const group = {
    type: events[open][1].type === "labelLink" ? "link" : "image",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  const label = {
    type: "label",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[close][1].end
    }
  };
  const text2 = {
    type: "labelText",
    start: {
      ...events[open + offset + 2][1].end
    },
    end: {
      ...events[close - 2][1].start
    }
  };
  media = [["enter", group, context], ["enter", label, context]];
  media = push(media, events.slice(open + 1, open + offset + 3));
  media = push(media, [["enter", text2, context]]);
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
  media = push(media, [["exit", text2, context], events[close - 2], events[close - 1], ["exit", label, context]]);
  media = push(media, events.slice(close + 1));
  media = push(media, [["exit", group, context]]);
  splice(events, open, events.length, media);
  return events;
}
function tokenizeLabelEnd(effects, ok2, nok) {
  const self2 = this;
  let index2 = self2.events.length;
  let labelStart;
  let defined;
  while (index2--) {
    if ((self2.events[index2][1].type === "labelImage" || self2.events[index2][1].type === "labelLink") && !self2.events[index2][1]._balanced) {
      labelStart = self2.events[index2][1];
      break;
    }
  }
  return start2;
  function start2(code2) {
    if (!labelStart) {
      return nok(code2);
    }
    if (labelStart._inactive) {
      return labelEndNok(code2);
    }
    defined = self2.parser.defined.includes(normalizeIdentifier(self2.sliceSerialize({
      start: labelStart.end,
      end: self2.now()
    })));
    effects.enter("labelEnd");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelEnd");
    return after;
  }
  function after(code2) {
    if (code2 === 40) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code2);
    }
    if (code2 === 91) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code2);
    }
    return defined ? labelEndOk(code2) : labelEndNok(code2);
  }
  function referenceNotFull(code2) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code2);
  }
  function labelEndOk(code2) {
    return ok2(code2);
  }
  function labelEndNok(code2) {
    labelStart._balanced = true;
    return nok(code2);
  }
}
function tokenizeResource(effects, ok2, nok) {
  return resourceStart;
  function resourceStart(code2) {
    effects.enter("resource");
    effects.enter("resourceMarker");
    effects.consume(code2);
    effects.exit("resourceMarker");
    return resourceBefore;
  }
  function resourceBefore(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceOpen)(code2) : resourceOpen(code2);
  }
  function resourceOpen(code2) {
    if (code2 === 41) {
      return resourceEnd(code2);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code2);
  }
  function resourceDestinationAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceBetween)(code2) : resourceEnd(code2);
  }
  function resourceDestinationMissing(code2) {
    return nok(code2);
  }
  function resourceBetween(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code2);
    }
    return resourceEnd(code2);
  }
  function resourceTitleAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceEnd)(code2) : resourceEnd(code2);
  }
  function resourceEnd(code2) {
    if (code2 === 41) {
      effects.enter("resourceMarker");
      effects.consume(code2);
      effects.exit("resourceMarker");
      effects.exit("resource");
      return ok2;
    }
    return nok(code2);
  }
}
function tokenizeReferenceFull(effects, ok2, nok) {
  const self2 = this;
  return referenceFull;
  function referenceFull(code2) {
    return factoryLabel.call(self2, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code2);
  }
  function referenceFullAfter(code2) {
    return self2.parser.defined.includes(normalizeIdentifier(self2.sliceSerialize(self2.events[self2.events.length - 1][1]).slice(1, -1))) ? ok2(code2) : nok(code2);
  }
  function referenceFullMissing(code2) {
    return nok(code2);
  }
}
function tokenizeReferenceCollapsed(effects, ok2, nok) {
  return referenceCollapsedStart;
  function referenceCollapsedStart(code2) {
    effects.enter("reference");
    effects.enter("referenceMarker");
    effects.consume(code2);
    effects.exit("referenceMarker");
    return referenceCollapsedOpen;
  }
  function referenceCollapsedOpen(code2) {
    if (code2 === 93) {
      effects.enter("referenceMarker");
      effects.consume(code2);
      effects.exit("referenceMarker");
      effects.exit("reference");
      return ok2;
    }
    return nok(code2);
  }
}
const labelStartImage = {
  name: "labelStartImage",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartImage
};
function tokenizeLabelStartImage(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    effects.enter("labelImage");
    effects.enter("labelImageMarker");
    effects.consume(code2);
    effects.exit("labelImageMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 91) {
      effects.enter("labelMarker");
      effects.consume(code2);
      effects.exit("labelMarker");
      effects.exit("labelImage");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    return code2 === 94 && "_hiddenFootnoteSupport" in self2.parser.constructs ? nok(code2) : ok2(code2);
  }
}
const labelStartLink = {
  name: "labelStartLink",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartLink
};
function tokenizeLabelStartLink(effects, ok2, nok) {
  const self2 = this;
  return start2;
  function start2(code2) {
    effects.enter("labelLink");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelLink");
    return after;
  }
  function after(code2) {
    return code2 === 94 && "_hiddenFootnoteSupport" in self2.parser.constructs ? nok(code2) : ok2(code2);
  }
}
const lineEnding = {
  name: "lineEnding",
  tokenize: tokenizeLineEnding
};
function tokenizeLineEnding(effects, ok2) {
  return start2;
  function start2(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, ok2, "linePrefix");
  }
}
const thematicBreak$2 = {
  name: "thematicBreak",
  tokenize: tokenizeThematicBreak
};
function tokenizeThematicBreak(effects, ok2, nok) {
  let size = 0;
  let marker;
  return start2;
  function start2(code2) {
    effects.enter("thematicBreak");
    return before(code2);
  }
  function before(code2) {
    marker = code2;
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.enter("thematicBreakSequence");
      return sequence(code2);
    }
    if (size >= 3 && (code2 === null || markdownLineEnding(code2))) {
      effects.exit("thematicBreak");
      return ok2(code2);
    }
    return nok(code2);
  }
  function sequence(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      size++;
      return sequence;
    }
    effects.exit("thematicBreakSequence");
    return markdownSpace(code2) ? factorySpace(effects, atBreak, "whitespace")(code2) : atBreak(code2);
  }
}
const list$2 = {
  continuation: {
    tokenize: tokenizeListContinuation
  },
  exit: tokenizeListEnd,
  name: "list",
  tokenize: tokenizeListStart
};
const listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
};
const indentConstruct = {
  partial: true,
  tokenize: tokenizeIndent$1
};
function tokenizeListStart(effects, ok2, nok) {
  const self2 = this;
  const tail = self2.events[self2.events.length - 1];
  let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start2;
  function start2(code2) {
    const kind = self2.containerState.type || (code2 === 42 || code2 === 43 || code2 === 45 ? "listUnordered" : "listOrdered");
    if (kind === "listUnordered" ? !self2.containerState.marker || code2 === self2.containerState.marker : asciiDigit(code2)) {
      if (!self2.containerState.type) {
        self2.containerState.type = kind;
        effects.enter(kind, {
          _container: true
        });
      }
      if (kind === "listUnordered") {
        effects.enter("listItemPrefix");
        return code2 === 42 || code2 === 45 ? effects.check(thematicBreak$2, nok, atMarker)(code2) : atMarker(code2);
      }
      if (!self2.interrupt || code2 === 49) {
        effects.enter("listItemPrefix");
        effects.enter("listItemValue");
        return inside(code2);
      }
    }
    return nok(code2);
  }
  function inside(code2) {
    if (asciiDigit(code2) && ++size < 10) {
      effects.consume(code2);
      return inside;
    }
    if ((!self2.interrupt || size < 2) && (self2.containerState.marker ? code2 === self2.containerState.marker : code2 === 41 || code2 === 46)) {
      effects.exit("listItemValue");
      return atMarker(code2);
    }
    return nok(code2);
  }
  function atMarker(code2) {
    effects.enter("listItemMarker");
    effects.consume(code2);
    effects.exit("listItemMarker");
    self2.containerState.marker = self2.containerState.marker || code2;
    return effects.check(
      blankLine,
      // Can’t be empty when interrupting.
      self2.interrupt ? nok : onBlank,
      effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix)
    );
  }
  function onBlank(code2) {
    self2.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code2);
  }
  function otherPrefix(code2) {
    if (markdownSpace(code2)) {
      effects.enter("listItemPrefixWhitespace");
      effects.consume(code2);
      effects.exit("listItemPrefixWhitespace");
      return endOfPrefix;
    }
    return nok(code2);
  }
  function endOfPrefix(code2) {
    self2.containerState.size = initialSize + self2.sliceSerialize(effects.exit("listItemPrefix"), true).length;
    return ok2(code2);
  }
}
function tokenizeListContinuation(effects, ok2, nok) {
  const self2 = this;
  self2.containerState._closeFlow = void 0;
  return effects.check(blankLine, onBlank, notBlank);
  function onBlank(code2) {
    self2.containerState.furtherBlankLines = self2.containerState.furtherBlankLines || self2.containerState.initialBlankLine;
    return factorySpace(effects, ok2, "listItemIndent", self2.containerState.size + 1)(code2);
  }
  function notBlank(code2) {
    if (self2.containerState.furtherBlankLines || !markdownSpace(code2)) {
      self2.containerState.furtherBlankLines = void 0;
      self2.containerState.initialBlankLine = void 0;
      return notInCurrentItem(code2);
    }
    self2.containerState.furtherBlankLines = void 0;
    self2.containerState.initialBlankLine = void 0;
    return effects.attempt(indentConstruct, ok2, notInCurrentItem)(code2);
  }
  function notInCurrentItem(code2) {
    self2.containerState._closeFlow = true;
    self2.interrupt = void 0;
    return factorySpace(effects, effects.attempt(list$2, ok2, nok), "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
  }
}
function tokenizeIndent$1(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "listItemIndent", self2.containerState.size + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self2.containerState.size ? ok2(code2) : nok(code2);
  }
}
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type);
}
function tokenizeListItemPrefixWhitespace(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4 + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return !markdownSpace(code2) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok2(code2) : nok(code2);
  }
}
const setextUnderline = {
  name: "setextUnderline",
  resolveTo: resolveToSetextUnderline,
  tokenize: tokenizeSetextUnderline
};
function resolveToSetextUnderline(events, context) {
  let index2 = events.length;
  let content2;
  let text2;
  let definition2;
  while (index2--) {
    if (events[index2][0] === "enter") {
      if (events[index2][1].type === "content") {
        content2 = index2;
        break;
      }
      if (events[index2][1].type === "paragraph") {
        text2 = index2;
      }
    } else {
      if (events[index2][1].type === "content") {
        events.splice(index2, 1);
      }
      if (!definition2 && events[index2][1].type === "definition") {
        definition2 = index2;
      }
    }
  }
  const heading2 = {
    type: "setextHeading",
    start: {
      ...events[content2][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  events[text2][1].type = "setextHeadingText";
  if (definition2) {
    events.splice(text2, 0, ["enter", heading2, context]);
    events.splice(definition2 + 1, 0, ["exit", events[content2][1], context]);
    events[content2][1].end = {
      ...events[definition2][1].end
    };
  } else {
    events[content2][1] = heading2;
  }
  events.push(["exit", heading2, context]);
  return events;
}
function tokenizeSetextUnderline(effects, ok2, nok) {
  const self2 = this;
  let marker;
  return start2;
  function start2(code2) {
    let index2 = self2.events.length;
    let paragraph2;
    while (index2--) {
      if (self2.events[index2][1].type !== "lineEnding" && self2.events[index2][1].type !== "linePrefix" && self2.events[index2][1].type !== "content") {
        paragraph2 = self2.events[index2][1].type === "paragraph";
        break;
      }
    }
    if (!self2.parser.lazy[self2.now().line] && (self2.interrupt || paragraph2)) {
      effects.enter("setextHeadingLine");
      marker = code2;
      return before(code2);
    }
    return nok(code2);
  }
  function before(code2) {
    effects.enter("setextHeadingLineSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    effects.exit("setextHeadingLineSequence");
    return markdownSpace(code2) ? factorySpace(effects, after, "lineSuffix")(code2) : after(code2);
  }
  function after(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("setextHeadingLine");
      return ok2(code2);
    }
    return nok(code2);
  }
}
const flow$1 = {
  tokenize: initializeFlow
};
function initializeFlow(effects) {
  const self2 = this;
  const initial = effects.attempt(
    // Try to parse a blank line.
    blankLine,
    atBlankEnding,
    // Try to parse initial flow (essentially, only code).
    effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content, afterConstruct)), "linePrefix"))
  );
  return initial;
  function atBlankEnding(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEndingBlank");
    effects.consume(code2);
    effects.exit("lineEndingBlank");
    self2.currentConstruct = void 0;
    return initial;
  }
  function afterConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    self2.currentConstruct = void 0;
    return initial;
  }
}
const resolver = {
  resolveAll: createResolver()
};
const string$1 = initializeFactory("string");
const text$4 = initializeFactory("text");
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0),
    tokenize: initializeText
  };
  function initializeText(effects) {
    const self2 = this;
    const constructs2 = this.parser.constructs[field];
    const text2 = effects.attempt(constructs2, start2, notText);
    return start2;
    function start2(code2) {
      return atBreak(code2) ? text2(code2) : notText(code2);
    }
    function notText(code2) {
      if (code2 === null) {
        effects.consume(code2);
        return;
      }
      effects.enter("data");
      effects.consume(code2);
      return data;
    }
    function data(code2) {
      if (atBreak(code2)) {
        effects.exit("data");
        return text2(code2);
      }
      effects.consume(code2);
      return data;
    }
    function atBreak(code2) {
      if (code2 === null) {
        return true;
      }
      const list2 = constructs2[code2];
      let index2 = -1;
      if (list2) {
        while (++index2 < list2.length) {
          const item = list2[index2];
          if (!item.previous || item.previous.call(self2, self2.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}
function createResolver(extraResolver) {
  return resolveAllText;
  function resolveAllText(events, context) {
    let index2 = -1;
    let enter;
    while (++index2 <= events.length) {
      if (enter === void 0) {
        if (events[index2] && events[index2][1].type === "data") {
          enter = index2;
          index2++;
        }
      } else if (!events[index2] || events[index2][1].type !== "data") {
        if (index2 !== enter + 2) {
          events[enter][1].end = events[index2 - 1][1].end;
          events.splice(enter + 2, index2 - enter - 2);
          index2 = enter + 2;
        }
        enter = void 0;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}
function resolveAllLineSuffixes(events, context) {
  let eventIndex = 0;
  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index2 = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      let tabs;
      while (index2--) {
        const chunk = chunks[index2];
        if (typeof chunk === "string") {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === 32) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex) break;
          bufferIndex = -1;
        } else if (chunk === -2) {
          tabs = true;
          size++;
        } else if (chunk === -1) ;
        else {
          index2++;
          break;
        }
      }
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            _bufferIndex: index2 ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index2,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: {
            ...data.end
          }
        };
        data.end = {
          ...token.start
        };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          events.splice(eventIndex, 0, ["enter", token, context], ["exit", token, context]);
          eventIndex += 2;
        }
      }
      eventIndex++;
    }
  }
  return events;
}
const document$1 = {
  [42]: list$2,
  [43]: list$2,
  [45]: list$2,
  [48]: list$2,
  [49]: list$2,
  [50]: list$2,
  [51]: list$2,
  [52]: list$2,
  [53]: list$2,
  [54]: list$2,
  [55]: list$2,
  [56]: list$2,
  [57]: list$2,
  [62]: blockQuote
};
const contentInitial = {
  [91]: definition$1
};
const flowInitial = {
  [-2]: codeIndented,
  [-1]: codeIndented,
  [32]: codeIndented
};
const flow = {
  [35]: headingAtx,
  [42]: thematicBreak$2,
  [45]: [setextUnderline, thematicBreak$2],
  [60]: htmlFlow,
  [61]: setextUnderline,
  [95]: thematicBreak$2,
  [96]: codeFenced,
  [126]: codeFenced
};
const string = {
  [38]: characterReference,
  [92]: characterEscape
};
const text$3 = {
  [-5]: lineEnding,
  [-4]: lineEnding,
  [-3]: lineEnding,
  [33]: labelStartImage,
  [38]: characterReference,
  [42]: attention,
  [60]: [autolink, htmlText],
  [91]: labelStartLink,
  [92]: [hardBreakEscape, characterEscape],
  [93]: labelEnd,
  [95]: attention,
  [96]: codeText
};
const insideSpan = {
  null: [attention, resolver]
};
const attentionMarkers = {
  null: [42, 95]
};
const disable = {
  null: []
};
const defaultConstructs = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  attentionMarkers,
  contentInitial,
  disable,
  document: document$1,
  flow,
  flowInitial,
  insideSpan,
  string,
  text: text$3
}, Symbol.toStringTag, { value: "Module" }));
function createTokenizer(parser, initialize, from) {
  let point2 = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  const columnStart = {};
  const resolveAllConstructs = [];
  let chunks = [];
  let stack = [];
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit: exit2,
    interrupt: constructFactory(onsuccessfulcheck, {
      interrupt: true
    })
  };
  const context = {
    code: null,
    containerState: {},
    defineSkip,
    events: [],
    now: now2,
    parser,
    previous: null,
    sliceSerialize,
    sliceStream,
    write
  };
  let state = initialize.tokenize.call(context, effects);
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;
  function write(slice) {
    chunks = push(chunks, slice);
    main();
    if (chunks[chunks.length - 1] !== null) {
      return [];
    }
    addResult(initialize, 0);
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }
  function now2() {
    const {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    } = point2;
    return {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    };
  }
  function defineSkip(value) {
    columnStart[value.line] = value.column;
    accountForPotentialSkip();
  }
  function main() {
    let chunkIndex;
    while (point2._index < chunks.length) {
      const chunk = chunks[point2._index];
      if (typeof chunk === "string") {
        chunkIndex = point2._index;
        if (point2._bufferIndex < 0) {
          point2._bufferIndex = 0;
        }
        while (point2._index === chunkIndex && point2._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point2._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }
  function go(code2) {
    state = state(code2);
  }
  function consume(code2) {
    if (markdownLineEnding(code2)) {
      point2.line++;
      point2.column = 1;
      point2.offset += code2 === -3 ? 2 : 1;
      accountForPotentialSkip();
    } else if (code2 !== -1) {
      point2.column++;
      point2.offset++;
    }
    if (point2._bufferIndex < 0) {
      point2._index++;
    } else {
      point2._bufferIndex++;
      if (point2._bufferIndex === // Points w/ non-negative `_bufferIndex` reference
      // strings.
      /** @type {string} */
      chunks[point2._index].length) {
        point2._bufferIndex = -1;
        point2._index++;
      }
    }
    context.previous = code2;
  }
  function enter(type, fields) {
    const token = fields || {};
    token.type = type;
    token.start = now2();
    context.events.push(["enter", token, context]);
    stack.push(token);
    return token;
  }
  function exit2(type) {
    const token = stack.pop();
    token.end = now2();
    context.events.push(["exit", token, context]);
    return token;
  }
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }
  function onsuccessfulcheck(_, info) {
    info.restore();
  }
  function constructFactory(onreturn, fields) {
    return hook;
    function hook(constructs2, returnState, bogusState) {
      let listOfConstructs;
      let constructIndex;
      let currentConstruct;
      let info;
      return Array.isArray(constructs2) ? (
        /* c8 ignore next 1 */
        handleListOfConstructs(constructs2)
      ) : "tokenize" in constructs2 ? (
        // Looks like a construct.
        handleListOfConstructs([
          /** @type {Construct} */
          constructs2
        ])
      ) : handleMapOfConstructs(constructs2);
      function handleMapOfConstructs(map2) {
        return start2;
        function start2(code2) {
          const left = code2 !== null && map2[code2];
          const all2 = code2 !== null && map2.null;
          const list2 = [
            // To do: add more extension tests.
            /* c8 ignore next 2 */
            ...Array.isArray(left) ? left : left ? [left] : [],
            ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
          ];
          return handleListOfConstructs(list2)(code2);
        }
      }
      function handleListOfConstructs(list2) {
        listOfConstructs = list2;
        constructIndex = 0;
        if (list2.length === 0) {
          return bogusState;
        }
        return handleConstruct(list2[constructIndex]);
      }
      function handleConstruct(construct) {
        return start2;
        function start2(code2) {
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }
          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok();
          }
          return construct.tokenize.call(
            // If we do have fields, create an object w/ `context` as its
            // prototype.
            // This allows a “live binding”, which is needed for `interrupt`.
            fields ? Object.assign(Object.create(context), fields) : context,
            effects,
            ok2,
            nok
          )(code2);
        }
      }
      function ok2(code2) {
        onreturn(currentConstruct, info);
        return returnState;
      }
      function nok(code2) {
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }
  function addResult(construct, from2) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
  }
  function store() {
    const startPoint = now2();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return {
      from: startEventsIndex,
      restore
    };
    function restore() {
      point2 = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
    }
  }
  function accountForPotentialSkip() {
    if (point2.line in columnStart && point2.column < 2) {
      point2.column = columnStart[point2.line];
      point2.offset += columnStart[point2.line] - 1;
    }
  }
}
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  let view;
  if (startIndex === endIndex) {
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head = view[0];
      if (typeof head === "string") {
        view[0] = head.slice(startBufferIndex);
      } else {
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}
function serializeChunks(chunks, expandTabs) {
  let index2 = -1;
  const result = [];
  let atTab;
  while (++index2 < chunks.length) {
    const chunk = chunks[index2];
    let value;
    if (typeof chunk === "string") {
      value = chunk;
    } else switch (chunk) {
      case -5: {
        value = "\r";
        break;
      }
      case -4: {
        value = "\n";
        break;
      }
      case -3: {
        value = "\r\n";
        break;
      }
      case -2: {
        value = expandTabs ? " " : "	";
        break;
      }
      case -1: {
        if (!expandTabs && atTab) continue;
        value = " ";
        break;
      }
      default: {
        value = String.fromCharCode(chunk);
      }
    }
    atTab = chunk === -2;
    result.push(value);
  }
  return result.join("");
}
function parse(options) {
  const settings = options || {};
  const constructs2 = (
    /** @type {FullNormalizedExtension} */
    combineExtensions([defaultConstructs, ...settings.extensions || []])
  );
  const parser = {
    constructs: constructs2,
    content: create2(content$1),
    defined: [],
    document: create2(document$2),
    flow: create2(flow$1),
    lazy: {},
    string: create2(string$1),
    text: create2(text$4)
  };
  return parser;
  function create2(initial) {
    return creator2;
    function creator2(from) {
      return createTokenizer(parser, initial, from);
    }
  }
}
function postprocess(events) {
  while (!subtokenize(events)) {
  }
  return events;
}
const search = /[\0\t\n\r]/g;
function preprocess() {
  let column = 1;
  let buffer = "";
  let start2 = true;
  let atCarriageReturn;
  return preprocessor;
  function preprocessor(value, encoding, end) {
    const chunks = [];
    let match;
    let next;
    let startPosition;
    let endPosition;
    let code2;
    value = buffer + (typeof value === "string" ? value.toString() : new TextDecoder(encoding || void 0).decode(value));
    startPosition = 0;
    buffer = "";
    if (start2) {
      if (value.charCodeAt(0) === 65279) {
        startPosition++;
      }
      start2 = void 0;
    }
    while (startPosition < value.length) {
      search.lastIndex = startPosition;
      match = search.exec(value);
      endPosition = match && match.index !== void 0 ? match.index : value.length;
      code2 = value.charCodeAt(endPosition);
      if (!match) {
        buffer = value.slice(startPosition);
        break;
      }
      if (code2 === 10 && startPosition === endPosition && atCarriageReturn) {
        chunks.push(-3);
        atCarriageReturn = void 0;
      } else {
        if (atCarriageReturn) {
          chunks.push(-5);
          atCarriageReturn = void 0;
        }
        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code2) {
          case 0: {
            chunks.push(65533);
            column++;
            break;
          }
          case 9: {
            next = Math.ceil(column / 4) * 4;
            chunks.push(-2);
            while (column++ < next) chunks.push(-1);
            break;
          }
          case 10: {
            chunks.push(-4);
            column = 1;
            break;
          }
          default: {
            atCarriageReturn = true;
            column = 1;
          }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn) chunks.push(-5);
      if (buffer) chunks.push(buffer);
      chunks.push(null);
    }
    return chunks;
  }
}
const characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function decodeString(value) {
  return value.replace(characterEscapeOrReference, decode);
}
function decode($0, $1, $2) {
  if ($1) {
    return $1;
  }
  const head = $2.charCodeAt(0);
  if (head === 35) {
    const head2 = $2.charCodeAt(1);
    const hex2 = head2 === 120 || head2 === 88;
    return decodeNumericCharacterReference($2.slice(hex2 ? 2 : 1), hex2 ? 16 : 10);
  }
  return decodeNamedCharacterReference($2) || $0;
}
const own$2 = {}.hasOwnProperty;
function fromMarkdown(value, encoding, options) {
  if (encoding && typeof encoding === "object") {
    options = encoding;
    encoding = void 0;
  }
  return compiler(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
}
function compiler(options) {
  const config = {
    transforms: [],
    canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
    enter: {
      autolink: opener(link2),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener(heading2),
      blockQuote: opener(blockQuote2),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener(codeFlow, buffer),
      codeText: opener(codeText2, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener(definition2),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener(emphasis2),
      hardBreakEscape: opener(hardBreak2),
      hardBreakTrailing: opener(hardBreak2),
      htmlFlow: opener(html2, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener(html2, buffer),
      htmlTextData: onenterdata,
      image: opener(image2),
      label: buffer,
      link: opener(link2),
      listItem: opener(listItem2),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener(list2, onenterlistordered),
      listUnordered: opener(list2),
      paragraph: opener(paragraph2),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener(heading2),
      strong: opener(strong2),
      thematicBreak: opener(thematicBreak2)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);
  const data = {};
  return compile;
  function compile(events) {
    let tree = {
      type: "root",
      children: []
    };
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit: exit2,
      buffer,
      resume,
      data
    };
    const listStack = [];
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "listOrdered" || events[index2][1].type === "listUnordered") {
        if (events[index2][0] === "enter") {
          listStack.push(index2);
        } else {
          const tail = listStack.pop();
          index2 = prepareList(events, tail, index2);
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      const handler = config[events[index2][0]];
      if (own$2.call(handler, events[index2][1].type)) {
        handler[events[index2][1].type].call(Object.assign({
          sliceSerialize: events[index2][2].sliceSerialize
        }, context), events[index2][1]);
      }
    }
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, void 0, tail[0]);
    }
    tree.position = {
      start: point(events.length > 0 ? events[0][1].start : {
        line: 1,
        column: 1,
        offset: 0
      }),
      end: point(events.length > 0 ? events[events.length - 2][1].end : {
        line: 1,
        column: 1,
        offset: 0
      })
    };
    index2 = -1;
    while (++index2 < config.transforms.length) {
      tree = config.transforms[index2](tree) || tree;
    }
    return tree;
  }
  function prepareList(events, start2, length) {
    let index2 = start2 - 1;
    let containerBalance = -1;
    let listSpread = false;
    let listItem3;
    let lineIndex;
    let firstBlankLineIndex;
    let atMarker;
    while (++index2 <= length) {
      const event = events[index2];
      switch (event[1].type) {
        case "listUnordered":
        case "listOrdered":
        case "blockQuote": {
          if (event[0] === "enter") {
            containerBalance++;
          } else {
            containerBalance--;
          }
          atMarker = void 0;
          break;
        }
        case "lineEndingBlank": {
          if (event[0] === "enter") {
            if (listItem3 && !atMarker && !containerBalance && !firstBlankLineIndex) {
              firstBlankLineIndex = index2;
            }
            atMarker = void 0;
          }
          break;
        }
        case "linePrefix":
        case "listItemValue":
        case "listItemMarker":
        case "listItemPrefix":
        case "listItemPrefixWhitespace": {
          break;
        }
        default: {
          atMarker = void 0;
        }
      }
      if (!containerBalance && event[0] === "enter" && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === "exit" && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
        if (listItem3) {
          let tailIndex = index2;
          lineIndex = void 0;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
              if (tailEvent[0] === "exit") continue;
              if (lineIndex) {
                events[lineIndex][1].type = "lineEndingBlank";
                listSpread = true;
              }
              tailEvent[1].type = "lineEnding";
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") ;
            else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem3._spread = true;
          }
          listItem3.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          events.splice(lineIndex || index2, 0, ["exit", listItem3, event[2]]);
          index2++;
          length++;
        }
        if (event[1].type === "listItemPrefix") {
          const item = {
            type: "listItem",
            _spread: false,
            start: Object.assign({}, event[1].start),
            // @ts-expect-error: we’ll add `end` in a second.
            end: void 0
          };
          listItem3 = item;
          events.splice(index2, 0, ["enter", item, event[2]]);
          index2++;
          length++;
          firstBlankLineIndex = void 0;
          atMarker = true;
        }
      }
    }
    events[start2][1]._spread = listSpread;
    return length;
  }
  function opener(create2, and) {
    return open;
    function open(token) {
      enter.call(this, create2(token), token);
      if (and) and.call(this, token);
    }
  }
  function buffer() {
    this.stack.push({
      type: "fragment",
      children: []
    });
  }
  function enter(node2, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    const siblings = parent.children;
    siblings.push(node2);
    this.stack.push(node2);
    this.tokenStack.push([token, errorHandler || void 0]);
    node2.position = {
      start: point(token.start),
      // @ts-expect-error: `end` will be patched later.
      end: void 0
    };
  }
  function closer(and) {
    return close;
    function close(token) {
      if (and) and.call(this, token);
      exit2.call(this, token);
    }
  }
  function exit2(token, onExitError) {
    const node2 = this.stack.pop();
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({
        start: token.start,
        end: token.end
      }) + "): it’s not open");
    } else if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    node2.position.end = point(token.end);
  }
  function resume() {
    return toString$1(this.stack.pop());
  }
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
      this.data.expectingFirstListItemValue = void 0;
    }
  }
  function onexitcodefencedfenceinfo() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.lang = data2;
  }
  function onexitcodefencedfencemeta() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.meta = data2;
  }
  function onexitcodefencedfence() {
    if (this.data.flowCodeInside) return;
    this.buffer();
    this.data.flowCodeInside = true;
  }
  function onexitcodefenced() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    this.data.flowCodeInside = void 0;
  }
  function onexitcodeindented() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/(\r?\n|\r)$/g, "");
  }
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }
  function onexitdefinitiontitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitdefinitiondestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitatxheadingsequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    if (!node2.depth) {
      const depth = this.sliceSerialize(token).length;
      node2.depth = depth;
    }
  }
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }
  function onexitsetextheadinglinesequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    node2.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
  }
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = void 0;
  }
  function onenterdata(token) {
    const node2 = this.stack[this.stack.length - 1];
    const siblings = node2.children;
    let tail = siblings[siblings.length - 1];
    if (!tail || tail.type !== "text") {
      tail = text2();
      tail.position = {
        start: point(token.start),
        // @ts-expect-error: we’ll add `end` later.
        end: void 0
      };
      siblings.push(tail);
    }
    this.stack.push(tail);
  }
  function onexitdata(token) {
    const tail = this.stack.pop();
    tail.value += this.sliceSerialize(token);
    tail.position.end = point(token.end);
  }
  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    if (this.data.atHardBreak) {
      const tail = context.children[context.children.length - 1];
      tail.position.end = point(token.end);
      this.data.atHardBreak = void 0;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }
  function onexithardbreak() {
    this.data.atHardBreak = true;
  }
  function onexithtmlflow() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexithtmltext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitcodetext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitlink() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitimage() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitlabeltext(token) {
    const string2 = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    ancestor.label = decodeString(string2);
    ancestor.identifier = normalizeIdentifier(string2).toLowerCase();
  }
  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    const value = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    this.data.inReference = true;
    if (node2.type === "link") {
      const children2 = fragment.children;
      node2.children = children2;
    } else {
      node2.alt = value;
    }
  }
  function onexitresourcedestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitresourcetitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitresource() {
    this.data.inReference = void 0;
  }
  function onenterreference() {
    this.data.referenceType = "collapsed";
  }
  function onexitreferencestring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = "full";
  }
  function onexitcharacterreferencemarker(token) {
    this.data.characterReferenceType = token.type;
  }
  function onexitcharacterreferencevalue(token) {
    const data2 = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    let value;
    if (type) {
      value = decodeNumericCharacterReference(data2, type === "characterReferenceMarkerNumeric" ? 10 : 16);
      this.data.characterReferenceType = void 0;
    } else {
      const result = decodeNamedCharacterReference(data2);
      value = result;
    }
    const tail = this.stack[this.stack.length - 1];
    tail.value += value;
  }
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    tail.position.end = point(token.end);
  }
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = this.sliceSerialize(token);
  }
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = "mailto:" + this.sliceSerialize(token);
  }
  function blockQuote2() {
    return {
      type: "blockquote",
      children: []
    };
  }
  function codeFlow() {
    return {
      type: "code",
      lang: null,
      meta: null,
      value: ""
    };
  }
  function codeText2() {
    return {
      type: "inlineCode",
      value: ""
    };
  }
  function definition2() {
    return {
      type: "definition",
      identifier: "",
      label: null,
      title: null,
      url: ""
    };
  }
  function emphasis2() {
    return {
      type: "emphasis",
      children: []
    };
  }
  function heading2() {
    return {
      type: "heading",
      // @ts-expect-error `depth` will be set later.
      depth: 0,
      children: []
    };
  }
  function hardBreak2() {
    return {
      type: "break"
    };
  }
  function html2() {
    return {
      type: "html",
      value: ""
    };
  }
  function image2() {
    return {
      type: "image",
      title: null,
      url: "",
      alt: null
    };
  }
  function link2() {
    return {
      type: "link",
      title: null,
      url: "",
      children: []
    };
  }
  function list2(token) {
    return {
      type: "list",
      ordered: token.type === "listOrdered",
      start: null,
      spread: token._spread,
      children: []
    };
  }
  function listItem2(token) {
    return {
      type: "listItem",
      spread: token._spread,
      checked: null,
      children: []
    };
  }
  function paragraph2() {
    return {
      type: "paragraph",
      children: []
    };
  }
  function strong2() {
    return {
      type: "strong",
      children: []
    };
  }
  function text2() {
    return {
      type: "text",
      value: ""
    };
  }
  function thematicBreak2() {
    return {
      type: "thematicBreak"
    };
  }
}
function point(d) {
  return {
    line: d.line,
    column: d.column,
    offset: d.offset
  };
}
function configure(combined, extensions) {
  let index2 = -1;
  while (++index2 < extensions.length) {
    const value = extensions[index2];
    if (Array.isArray(value)) {
      configure(combined, value);
    } else {
      extension(combined, value);
    }
  }
}
function extension(combined, extension2) {
  let key;
  for (key in extension2) {
    if (own$2.call(extension2, key)) {
      switch (key) {
        case "canContainEols": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "transforms": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "enter":
        case "exit": {
          const right = extension2[key];
          if (right) {
            Object.assign(combined[key], right);
          }
          break;
        }
      }
    }
  }
}
function defaultOnError(left, right) {
  if (left) {
    throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({
      start: left.start,
      end: left.end
    }) + "): a different token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is open");
  } else {
    throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is still open");
  }
}
function remarkParse(options) {
  const self2 = this;
  self2.parser = parser;
  function parser(doc) {
    return fromMarkdown(doc, {
      ...self2.data("settings"),
      ...options,
      // Note: these options are not in the readme.
      // The goal is for them to be set by plugins on `data` instead of being
      // passed by users.
      extensions: self2.data("micromarkExtensions") || [],
      mdastExtensions: self2.data("fromMarkdownExtensions") || []
    });
  }
}
function blockquote$1(state, node2) {
  const result = {
    type: "element",
    tagName: "blockquote",
    properties: {},
    children: state.wrap(state.all(node2), true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function hardBreak$1(state, node2) {
  const result = { type: "element", tagName: "br", properties: {}, children: [] };
  state.patch(node2, result);
  return [state.applyData(node2, result), { type: "text", value: "\n" }];
}
function code$2(state, node2) {
  const value = node2.value ? node2.value + "\n" : "";
  const properties = {};
  const language = node2.lang ? node2.lang.split(/\s+/) : [];
  if (language.length > 0) {
    properties.className = ["language-" + language[0]];
  }
  let result = {
    type: "element",
    tagName: "code",
    properties,
    children: [{ type: "text", value }]
  };
  if (node2.meta) {
    result.data = { meta: node2.meta };
  }
  state.patch(node2, result);
  result = state.applyData(node2, result);
  result = { type: "element", tagName: "pre", properties: {}, children: [result] };
  state.patch(node2, result);
  return result;
}
function strikethrough(state, node2) {
  const result = {
    type: "element",
    tagName: "del",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function emphasis$1(state, node2) {
  const result = {
    type: "element",
    tagName: "em",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function footnoteReference$1(state, node2) {
  const clobberPrefix = typeof state.options.clobberPrefix === "string" ? state.options.clobberPrefix : "user-content-";
  const id2 = String(node2.identifier).toUpperCase();
  const safeId = normalizeUri(id2.toLowerCase());
  const index2 = state.footnoteOrder.indexOf(id2);
  let counter;
  let reuseCounter = state.footnoteCounts.get(id2);
  if (reuseCounter === void 0) {
    reuseCounter = 0;
    state.footnoteOrder.push(id2);
    counter = state.footnoteOrder.length;
  } else {
    counter = index2 + 1;
  }
  reuseCounter += 1;
  state.footnoteCounts.set(id2, reuseCounter);
  const link2 = {
    type: "element",
    tagName: "a",
    properties: {
      href: "#" + clobberPrefix + "fn-" + safeId,
      id: clobberPrefix + "fnref-" + safeId + (reuseCounter > 1 ? "-" + reuseCounter : ""),
      dataFootnoteRef: true,
      ariaDescribedBy: ["footnote-label"]
    },
    children: [{ type: "text", value: String(counter) }]
  };
  state.patch(node2, link2);
  const sup = {
    type: "element",
    tagName: "sup",
    properties: {},
    children: [link2]
  };
  state.patch(node2, sup);
  return state.applyData(node2, sup);
}
function heading$1(state, node2) {
  const result = {
    type: "element",
    tagName: "h" + node2.depth,
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function html$1(state, node2) {
  if (state.options.allowDangerousHtml) {
    const result = { type: "raw", value: node2.value };
    state.patch(node2, result);
    return state.applyData(node2, result);
  }
  return void 0;
}
function revert(state, node2) {
  const subtype = node2.referenceType;
  let suffix = "]";
  if (subtype === "collapsed") {
    suffix += "[]";
  } else if (subtype === "full") {
    suffix += "[" + (node2.label || node2.identifier) + "]";
  }
  if (node2.type === "imageReference") {
    return [{ type: "text", value: "![" + node2.alt + suffix }];
  }
  const contents = state.all(node2);
  const head = contents[0];
  if (head && head.type === "text") {
    head.value = "[" + head.value;
  } else {
    contents.unshift({ type: "text", value: "[" });
  }
  const tail = contents[contents.length - 1];
  if (tail && tail.type === "text") {
    tail.value += suffix;
  } else {
    contents.push({ type: "text", value: suffix });
  }
  return contents;
}
function imageReference$1(state, node2) {
  const id2 = String(node2.identifier).toUpperCase();
  const definition2 = state.definitionById.get(id2);
  if (!definition2) {
    return revert(state, node2);
  }
  const properties = { src: normalizeUri(definition2.url || ""), alt: node2.alt };
  if (definition2.title !== null && definition2.title !== void 0) {
    properties.title = definition2.title;
  }
  const result = { type: "element", tagName: "img", properties, children: [] };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function image$1(state, node2) {
  const properties = { src: normalizeUri(node2.url) };
  if (node2.alt !== null && node2.alt !== void 0) {
    properties.alt = node2.alt;
  }
  if (node2.title !== null && node2.title !== void 0) {
    properties.title = node2.title;
  }
  const result = { type: "element", tagName: "img", properties, children: [] };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function inlineCode$1(state, node2) {
  const text2 = { type: "text", value: node2.value.replace(/\r?\n|\r/g, " ") };
  state.patch(node2, text2);
  const result = {
    type: "element",
    tagName: "code",
    properties: {},
    children: [text2]
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function linkReference$1(state, node2) {
  const id2 = String(node2.identifier).toUpperCase();
  const definition2 = state.definitionById.get(id2);
  if (!definition2) {
    return revert(state, node2);
  }
  const properties = { href: normalizeUri(definition2.url || "") };
  if (definition2.title !== null && definition2.title !== void 0) {
    properties.title = definition2.title;
  }
  const result = {
    type: "element",
    tagName: "a",
    properties,
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function link$1(state, node2) {
  const properties = { href: normalizeUri(node2.url) };
  if (node2.title !== null && node2.title !== void 0) {
    properties.title = node2.title;
  }
  const result = {
    type: "element",
    tagName: "a",
    properties,
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function listItem$1(state, node2, parent) {
  const results = state.all(node2);
  const loose = parent ? listLoose(parent) : listItemLoose(node2);
  const properties = {};
  const children2 = [];
  if (typeof node2.checked === "boolean") {
    const head = results[0];
    let paragraph2;
    if (head && head.type === "element" && head.tagName === "p") {
      paragraph2 = head;
    } else {
      paragraph2 = { type: "element", tagName: "p", properties: {}, children: [] };
      results.unshift(paragraph2);
    }
    if (paragraph2.children.length > 0) {
      paragraph2.children.unshift({ type: "text", value: " " });
    }
    paragraph2.children.unshift({
      type: "element",
      tagName: "input",
      properties: { type: "checkbox", checked: node2.checked, disabled: true },
      children: []
    });
    properties.className = ["task-list-item"];
  }
  let index2 = -1;
  while (++index2 < results.length) {
    const child = results[index2];
    if (loose || index2 !== 0 || child.type !== "element" || child.tagName !== "p") {
      children2.push({ type: "text", value: "\n" });
    }
    if (child.type === "element" && child.tagName === "p" && !loose) {
      children2.push(...child.children);
    } else {
      children2.push(child);
    }
  }
  const tail = results[results.length - 1];
  if (tail && (loose || tail.type !== "element" || tail.tagName !== "p")) {
    children2.push({ type: "text", value: "\n" });
  }
  const result = { type: "element", tagName: "li", properties, children: children2 };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function listLoose(node2) {
  let loose = false;
  if (node2.type === "list") {
    loose = node2.spread || false;
    const children2 = node2.children;
    let index2 = -1;
    while (!loose && ++index2 < children2.length) {
      loose = listItemLoose(children2[index2]);
    }
  }
  return loose;
}
function listItemLoose(node2) {
  const spread = node2.spread;
  return spread === null || spread === void 0 ? node2.children.length > 1 : spread;
}
function list$1(state, node2) {
  const properties = {};
  const results = state.all(node2);
  let index2 = -1;
  if (typeof node2.start === "number" && node2.start !== 1) {
    properties.start = node2.start;
  }
  while (++index2 < results.length) {
    const child = results[index2];
    if (child.type === "element" && child.tagName === "li" && child.properties && Array.isArray(child.properties.className) && child.properties.className.includes("task-list-item")) {
      properties.className = ["contains-task-list"];
      break;
    }
  }
  const result = {
    type: "element",
    tagName: node2.ordered ? "ol" : "ul",
    properties,
    children: state.wrap(results, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function paragraph$1(state, node2) {
  const result = {
    type: "element",
    tagName: "p",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function root$1(state, node2) {
  const result = { type: "root", children: state.wrap(state.all(node2)) };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function strong$1(state, node2) {
  const result = {
    type: "element",
    tagName: "strong",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function table(state, node2) {
  const rows = state.all(node2);
  const firstRow = rows.shift();
  const tableContent = [];
  if (firstRow) {
    const head = {
      type: "element",
      tagName: "thead",
      properties: {},
      children: state.wrap([firstRow], true)
    };
    state.patch(node2.children[0], head);
    tableContent.push(head);
  }
  if (rows.length > 0) {
    const body = {
      type: "element",
      tagName: "tbody",
      properties: {},
      children: state.wrap(rows, true)
    };
    const start2 = pointStart(node2.children[1]);
    const end = pointEnd(node2.children[node2.children.length - 1]);
    if (start2 && end) body.position = { start: start2, end };
    tableContent.push(body);
  }
  const result = {
    type: "element",
    tagName: "table",
    properties: {},
    children: state.wrap(tableContent, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function tableRow(state, node2, parent) {
  const siblings = parent ? parent.children : void 0;
  const rowIndex = siblings ? siblings.indexOf(node2) : 1;
  const tagName = rowIndex === 0 ? "th" : "td";
  const align = parent && parent.type === "table" ? parent.align : void 0;
  const length = align ? align.length : node2.children.length;
  let cellIndex = -1;
  const cells = [];
  while (++cellIndex < length) {
    const cell = node2.children[cellIndex];
    const properties = {};
    const alignValue = align ? align[cellIndex] : void 0;
    if (alignValue) {
      properties.align = alignValue;
    }
    let result2 = { type: "element", tagName, properties, children: [] };
    if (cell) {
      result2.children = state.all(cell);
      state.patch(cell, result2);
      result2 = state.applyData(cell, result2);
    }
    cells.push(result2);
  }
  const result = {
    type: "element",
    tagName: "tr",
    properties: {},
    children: state.wrap(cells, true)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function tableCell(state, node2) {
  const result = {
    type: "element",
    tagName: "td",
    // Assume body cell.
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
const tab = 9;
const space = 32;
function trimLines(value) {
  const source = String(value);
  const search2 = /\r?\n|\r/g;
  let match = search2.exec(source);
  let last = 0;
  const lines = [];
  while (match) {
    lines.push(
      trimLine(source.slice(last, match.index), last > 0, true),
      match[0]
    );
    last = match.index + match[0].length;
    match = search2.exec(source);
  }
  lines.push(trimLine(source.slice(last), last > 0, false));
  return lines.join("");
}
function trimLine(value, start2, end) {
  let startIndex = 0;
  let endIndex = value.length;
  if (start2) {
    let code2 = value.codePointAt(startIndex);
    while (code2 === tab || code2 === space) {
      startIndex++;
      code2 = value.codePointAt(startIndex);
    }
  }
  if (end) {
    let code2 = value.codePointAt(endIndex - 1);
    while (code2 === tab || code2 === space) {
      endIndex--;
      code2 = value.codePointAt(endIndex - 1);
    }
  }
  return endIndex > startIndex ? value.slice(startIndex, endIndex) : "";
}
function text$2(state, node2) {
  const result = { type: "text", value: trimLines(String(node2.value)) };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function thematicBreak$1(state, node2) {
  const result = {
    type: "element",
    tagName: "hr",
    properties: {},
    children: []
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
const handlers = {
  blockquote: blockquote$1,
  break: hardBreak$1,
  code: code$2,
  delete: strikethrough,
  emphasis: emphasis$1,
  footnoteReference: footnoteReference$1,
  heading: heading$1,
  html: html$1,
  imageReference: imageReference$1,
  image: image$1,
  inlineCode: inlineCode$1,
  linkReference: linkReference$1,
  link: link$1,
  listItem: listItem$1,
  list: list$1,
  paragraph: paragraph$1,
  // @ts-expect-error: root is different, but hard to type.
  root: root$1,
  strong: strong$1,
  table,
  tableCell,
  tableRow,
  text: text$2,
  thematicBreak: thematicBreak$1,
  toml: ignore,
  yaml: ignore,
  definition: ignore,
  footnoteDefinition: ignore
};
function ignore() {
  return void 0;
}
const VOID = -1;
const PRIMITIVE = 0;
const ARRAY = 1;
const OBJECT = 2;
const DATE = 3;
const REGEXP = 4;
const MAP = 5;
const SET = 6;
const ERROR = 7;
const BIGINT = 8;
const env = typeof self === "object" ? self : globalThis;
const deserializer = ($, _) => {
  const as = (out, index2) => {
    $.set(index2, out);
    return out;
  };
  const unpair = (index2) => {
    if ($.has(index2))
      return $.get(index2);
    const [type, value] = _[index2];
    switch (type) {
      case PRIMITIVE:
      case VOID:
        return as(value, index2);
      case ARRAY: {
        const arr = as([], index2);
        for (const index3 of value)
          arr.push(unpair(index3));
        return arr;
      }
      case OBJECT: {
        const object2 = as({}, index2);
        for (const [key, index3] of value)
          object2[unpair(key)] = unpair(index3);
        return object2;
      }
      case DATE:
        return as(new Date(value), index2);
      case REGEXP: {
        const { source, flags } = value;
        return as(new RegExp(source, flags), index2);
      }
      case MAP: {
        const map2 = as(/* @__PURE__ */ new Map(), index2);
        for (const [key, index3] of value)
          map2.set(unpair(key), unpair(index3));
        return map2;
      }
      case SET: {
        const set2 = as(/* @__PURE__ */ new Set(), index2);
        for (const index3 of value)
          set2.add(unpair(index3));
        return set2;
      }
      case ERROR: {
        const { name: name2, message } = value;
        return as(new env[name2](message), index2);
      }
      case BIGINT:
        return as(BigInt(value), index2);
      case "BigInt":
        return as(Object(BigInt(value)), index2);
      case "ArrayBuffer":
        return as(new Uint8Array(value).buffer, value);
      case "DataView": {
        const { buffer } = new Uint8Array(value);
        return as(new DataView(buffer), value);
      }
    }
    return as(new env[type](value), index2);
  };
  return unpair;
};
const deserialize = (serialized) => deserializer(/* @__PURE__ */ new Map(), serialized)(0);
const EMPTY = "";
const { toString } = {};
const { keys } = Object;
const typeOf = (value) => {
  const type = typeof value;
  if (type !== "object" || !value)
    return [PRIMITIVE, type];
  const asString = toString.call(value).slice(8, -1);
  switch (asString) {
    case "Array":
      return [ARRAY, EMPTY];
    case "Object":
      return [OBJECT, EMPTY];
    case "Date":
      return [DATE, EMPTY];
    case "RegExp":
      return [REGEXP, EMPTY];
    case "Map":
      return [MAP, EMPTY];
    case "Set":
      return [SET, EMPTY];
    case "DataView":
      return [ARRAY, asString];
  }
  if (asString.includes("Array"))
    return [ARRAY, asString];
  if (asString.includes("Error"))
    return [ERROR, asString];
  return [OBJECT, asString];
};
const shouldSkip = ([TYPE, type]) => TYPE === PRIMITIVE && (type === "function" || type === "symbol");
const serializer = (strict, json, $, _) => {
  const as = (out, value) => {
    const index2 = _.push(out) - 1;
    $.set(value, index2);
    return index2;
  };
  const pair = (value) => {
    if ($.has(value))
      return $.get(value);
    let [TYPE, type] = typeOf(value);
    switch (TYPE) {
      case PRIMITIVE: {
        let entry = value;
        switch (type) {
          case "bigint":
            TYPE = BIGINT;
            entry = value.toString();
            break;
          case "function":
          case "symbol":
            if (strict)
              throw new TypeError("unable to serialize " + type);
            entry = null;
            break;
          case "undefined":
            return as([VOID], value);
        }
        return as([TYPE, entry], value);
      }
      case ARRAY: {
        if (type) {
          let spread = value;
          if (type === "DataView") {
            spread = new Uint8Array(value.buffer);
          } else if (type === "ArrayBuffer") {
            spread = new Uint8Array(value);
          }
          return as([type, [...spread]], value);
        }
        const arr = [];
        const index2 = as([TYPE, arr], value);
        for (const entry of value)
          arr.push(pair(entry));
        return index2;
      }
      case OBJECT: {
        if (type) {
          switch (type) {
            case "BigInt":
              return as([type, value.toString()], value);
            case "Boolean":
            case "Number":
            case "String":
              return as([type, value.valueOf()], value);
          }
        }
        if (json && "toJSON" in value)
          return pair(value.toJSON());
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const key of keys(value)) {
          if (strict || !shouldSkip(typeOf(value[key])))
            entries.push([pair(key), pair(value[key])]);
        }
        return index2;
      }
      case DATE:
        return as([TYPE, value.toISOString()], value);
      case REGEXP: {
        const { source, flags } = value;
        return as([TYPE, { source, flags }], value);
      }
      case MAP: {
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const [key, entry] of value) {
          if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
            entries.push([pair(key), pair(entry)]);
        }
        return index2;
      }
      case SET: {
        const entries = [];
        const index2 = as([TYPE, entries], value);
        for (const entry of value) {
          if (strict || !shouldSkip(typeOf(entry)))
            entries.push(pair(entry));
        }
        return index2;
      }
    }
    const { message } = value;
    return as([TYPE, { name: type, message }], value);
  };
  return pair;
};
const serialize$1 = (value, { json, lossy } = {}) => {
  const _ = [];
  return serializer(!(json || lossy), !!json, /* @__PURE__ */ new Map(), _)(value), _;
};
const structuredClone$1 = typeof structuredClone === "function" ? (
  /* c8 ignore start */
  (any, options) => options && ("json" in options || "lossy" in options) ? deserialize(serialize$1(any, options)) : structuredClone(any)
) : (any, options) => deserialize(serialize$1(any, options));
function defaultFootnoteBackContent(_, rereferenceIndex) {
  const result = [{ type: "text", value: "↩" }];
  if (rereferenceIndex > 1) {
    result.push({
      type: "element",
      tagName: "sup",
      properties: {},
      children: [{ type: "text", value: String(rereferenceIndex) }]
    });
  }
  return result;
}
function defaultFootnoteBackLabel(referenceIndex, rereferenceIndex) {
  return "Back to reference " + (referenceIndex + 1) + (rereferenceIndex > 1 ? "-" + rereferenceIndex : "");
}
function footer(state) {
  const clobberPrefix = typeof state.options.clobberPrefix === "string" ? state.options.clobberPrefix : "user-content-";
  const footnoteBackContent = state.options.footnoteBackContent || defaultFootnoteBackContent;
  const footnoteBackLabel = state.options.footnoteBackLabel || defaultFootnoteBackLabel;
  const footnoteLabel = state.options.footnoteLabel || "Footnotes";
  const footnoteLabelTagName = state.options.footnoteLabelTagName || "h2";
  const footnoteLabelProperties = state.options.footnoteLabelProperties || {
    className: ["sr-only"]
  };
  const listItems = [];
  let referenceIndex = -1;
  while (++referenceIndex < state.footnoteOrder.length) {
    const definition2 = state.footnoteById.get(
      state.footnoteOrder[referenceIndex]
    );
    if (!definition2) {
      continue;
    }
    const content2 = state.all(definition2);
    const id2 = String(definition2.identifier).toUpperCase();
    const safeId = normalizeUri(id2.toLowerCase());
    let rereferenceIndex = 0;
    const backReferences = [];
    const counts = state.footnoteCounts.get(id2);
    while (counts !== void 0 && ++rereferenceIndex <= counts) {
      if (backReferences.length > 0) {
        backReferences.push({ type: "text", value: " " });
      }
      let children2 = typeof footnoteBackContent === "string" ? footnoteBackContent : footnoteBackContent(referenceIndex, rereferenceIndex);
      if (typeof children2 === "string") {
        children2 = { type: "text", value: children2 };
      }
      backReferences.push({
        type: "element",
        tagName: "a",
        properties: {
          href: "#" + clobberPrefix + "fnref-" + safeId + (rereferenceIndex > 1 ? "-" + rereferenceIndex : ""),
          dataFootnoteBackref: "",
          ariaLabel: typeof footnoteBackLabel === "string" ? footnoteBackLabel : footnoteBackLabel(referenceIndex, rereferenceIndex),
          className: ["data-footnote-backref"]
        },
        children: Array.isArray(children2) ? children2 : [children2]
      });
    }
    const tail = content2[content2.length - 1];
    if (tail && tail.type === "element" && tail.tagName === "p") {
      const tailTail = tail.children[tail.children.length - 1];
      if (tailTail && tailTail.type === "text") {
        tailTail.value += " ";
      } else {
        tail.children.push({ type: "text", value: " " });
      }
      tail.children.push(...backReferences);
    } else {
      content2.push(...backReferences);
    }
    const listItem2 = {
      type: "element",
      tagName: "li",
      properties: { id: clobberPrefix + "fn-" + safeId },
      children: state.wrap(content2, true)
    };
    state.patch(definition2, listItem2);
    listItems.push(listItem2);
  }
  if (listItems.length === 0) {
    return;
  }
  return {
    type: "element",
    tagName: "section",
    properties: { dataFootnotes: true, className: ["footnotes"] },
    children: [
      {
        type: "element",
        tagName: footnoteLabelTagName,
        properties: {
          ...structuredClone$1(footnoteLabelProperties),
          id: "footnote-label"
        },
        children: [{ type: "text", value: footnoteLabel }]
      },
      { type: "text", value: "\n" },
      {
        type: "element",
        tagName: "ol",
        properties: {},
        children: state.wrap(listItems, true)
      },
      { type: "text", value: "\n" }
    ]
  };
}
const convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  function(test) {
    if (test === null || test === void 0) {
      return ok;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  }
);
function anyFactory(tests) {
  const checks2 = [];
  let index2 = -1;
  while (++index2 < tests.length) {
    checks2[index2] = convert(tests[index2]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index3 = -1;
    while (++index3 < checks2.length) {
      if (checks2[index3].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all2);
  function all2(node2) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node2
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node2) {
    return node2 && node2.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index2, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index2 === "number" ? index2 : void 0,
        parent || void 0
      )
    );
  }
}
function ok() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}
function color(d) {
  return d;
}
const empty = [];
const CONTINUE = true;
const EXIT = false;
const SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is2 = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node2, index2, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node2 && typeof node2 === "object" ? node2 : {}
    );
    if (typeof value.type === "string") {
      const name2 = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit2, "name", {
        value: "node (" + color(node2.type + (name2 ? "<" + name2 + ">" : "")) + ")"
      });
    }
    return visit2;
    function visit2() {
      let result = empty;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is2(node2, index2, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node2, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node2 && node2.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node2
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty : [value];
}
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  let reverse;
  let test;
  let visitor;
  if (typeof testOrVisitor === "function" && typeof visitorOrReverse !== "function") {
    test = void 0;
    visitor = testOrVisitor;
    reverse = visitorOrReverse;
  } else {
    test = testOrVisitor;
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }
  visitParents(tree, test, overload, reverse);
  function overload(node2, parents) {
    const parent = parents[parents.length - 1];
    const index2 = parent ? parent.children.indexOf(node2) : void 0;
    return visitor(node2, index2, parent);
  }
}
const own$1 = {}.hasOwnProperty;
const emptyOptions$1 = {};
function createState(tree, options) {
  const settings = options || emptyOptions$1;
  const definitionById = /* @__PURE__ */ new Map();
  const footnoteById = /* @__PURE__ */ new Map();
  const footnoteCounts = /* @__PURE__ */ new Map();
  const handlers$1 = { ...handlers, ...settings.handlers };
  const state = {
    all: all2,
    applyData,
    definitionById,
    footnoteById,
    footnoteCounts,
    footnoteOrder: [],
    handlers: handlers$1,
    one: one2,
    options: settings,
    patch,
    wrap: wrap$1
  };
  visit(tree, function(node2) {
    if (node2.type === "definition" || node2.type === "footnoteDefinition") {
      const map2 = node2.type === "definition" ? definitionById : footnoteById;
      const id2 = String(node2.identifier).toUpperCase();
      if (!map2.has(id2)) {
        map2.set(id2, node2);
      }
    }
  });
  return state;
  function one2(node2, parent) {
    const type = node2.type;
    const handle2 = state.handlers[type];
    if (own$1.call(state.handlers, type) && handle2) {
      return handle2(state, node2, parent);
    }
    if (state.options.passThrough && state.options.passThrough.includes(type)) {
      if ("children" in node2) {
        const { children: children2, ...shallow } = node2;
        const result = structuredClone$1(shallow);
        result.children = state.all(node2);
        return result;
      }
      return structuredClone$1(node2);
    }
    const unknown = state.options.unknownHandler || defaultUnknownHandler;
    return unknown(state, node2, parent);
  }
  function all2(parent) {
    const values = [];
    if ("children" in parent) {
      const nodes = parent.children;
      let index2 = -1;
      while (++index2 < nodes.length) {
        const result = state.one(nodes[index2], parent);
        if (result) {
          if (index2 && nodes[index2 - 1].type === "break") {
            if (!Array.isArray(result) && result.type === "text") {
              result.value = trimMarkdownSpaceStart(result.value);
            }
            if (!Array.isArray(result) && result.type === "element") {
              const head = result.children[0];
              if (head && head.type === "text") {
                head.value = trimMarkdownSpaceStart(head.value);
              }
            }
          }
          if (Array.isArray(result)) {
            values.push(...result);
          } else {
            values.push(result);
          }
        }
      }
    }
    return values;
  }
}
function patch(from, to) {
  if (from.position) to.position = position$1(from);
}
function applyData(from, to) {
  let result = to;
  if (from && from.data) {
    const hName = from.data.hName;
    const hChildren = from.data.hChildren;
    const hProperties = from.data.hProperties;
    if (typeof hName === "string") {
      if (result.type === "element") {
        result.tagName = hName;
      } else {
        const children2 = "children" in result ? result.children : [result];
        result = { type: "element", tagName: hName, properties: {}, children: children2 };
      }
    }
    if (result.type === "element" && hProperties) {
      Object.assign(result.properties, structuredClone$1(hProperties));
    }
    if ("children" in result && result.children && hChildren !== null && hChildren !== void 0) {
      result.children = hChildren;
    }
  }
  return result;
}
function defaultUnknownHandler(state, node2) {
  const data = node2.data || {};
  const result = "value" in node2 && !(own$1.call(data, "hProperties") || own$1.call(data, "hChildren")) ? { type: "text", value: node2.value } : {
    type: "element",
    tagName: "div",
    properties: {},
    children: state.all(node2)
  };
  state.patch(node2, result);
  return state.applyData(node2, result);
}
function wrap$1(nodes, loose) {
  const result = [];
  let index2 = -1;
  if (loose) {
    result.push({ type: "text", value: "\n" });
  }
  while (++index2 < nodes.length) {
    if (index2) result.push({ type: "text", value: "\n" });
    result.push(nodes[index2]);
  }
  if (loose && nodes.length > 0) {
    result.push({ type: "text", value: "\n" });
  }
  return result;
}
function trimMarkdownSpaceStart(value) {
  let index2 = 0;
  let code2 = value.charCodeAt(index2);
  while (code2 === 9 || code2 === 32) {
    index2++;
    code2 = value.charCodeAt(index2);
  }
  return value.slice(index2);
}
function toHast(tree, options) {
  const state = createState(tree, options);
  const node2 = state.one(tree, void 0);
  const foot = footer(state);
  const result = Array.isArray(node2) ? { type: "root", children: node2 } : node2 || { type: "root", children: [] };
  if (foot) {
    result.children.push({ type: "text", value: "\n" }, foot);
  }
  return result;
}
function remarkRehype(destination, options) {
  if (destination && "run" in destination) {
    return async function(tree, file) {
      const hastTree = (
        /** @type {HastRoot} */
        toHast(tree, { file, ...options })
      );
      await destination.run(hastTree, file);
    };
  }
  return function(tree, file) {
    return (
      /** @type {HastRoot} */
      toHast(tree, { file, ...destination || options })
    );
  };
}
function bail(error) {
  if (error) {
    throw error;
  }
}
var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;
var isArray = function isArray2(arr) {
  if (typeof Array.isArray === "function") {
    return Array.isArray(arr);
  }
  return toStr.call(arr) === "[object Array]";
};
var isPlainObject$1 = function isPlainObject(obj) {
  if (!obj || toStr.call(obj) !== "[object Object]") {
    return false;
  }
  var hasOwnConstructor = hasOwn.call(obj, "constructor");
  var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, "isPrototypeOf");
  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  }
  var key;
  for (key in obj) {
  }
  return typeof key === "undefined" || hasOwn.call(obj, key);
};
var setProperty = function setProperty2(target, options) {
  if (defineProperty && options.name === "__proto__") {
    defineProperty(target, options.name, {
      enumerable: true,
      configurable: true,
      value: options.newValue,
      writable: true
    });
  } else {
    target[options.name] = options.newValue;
  }
};
var getProperty = function getProperty2(obj, name2) {
  if (name2 === "__proto__") {
    if (!hasOwn.call(obj, name2)) {
      return void 0;
    } else if (gOPD) {
      return gOPD(obj, name2).value;
    }
  }
  return obj[name2];
};
var extend = function extend2() {
  var options, name2, src, copy, copyIsArray, clone;
  var target = arguments[0];
  var i = 1;
  var length = arguments.length;
  var deep = false;
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[1] || {};
    i = 2;
  }
  if (target == null || typeof target !== "object" && typeof target !== "function") {
    target = {};
  }
  for (; i < length; ++i) {
    options = arguments[i];
    if (options != null) {
      for (name2 in options) {
        src = getProperty(target, name2);
        copy = getProperty(options, name2);
        if (target !== copy) {
          if (deep && copy && (isPlainObject$1(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject$1(src) ? src : {};
            }
            setProperty(target, { name: name2, newValue: extend2(deep, clone, copy) });
          } else if (typeof copy !== "undefined") {
            setProperty(target, { name: name2, newValue: copy });
          }
        }
      }
    }
  }
  return target;
};
const extend$1 = /* @__PURE__ */ getDefaultExportFromCjs(extend);
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}
function trough() {
  const fns = [];
  const pipeline = { run, use };
  return pipeline;
  function run(...values) {
    let middlewareIndex = -1;
    const callback = values.pop();
    if (typeof callback !== "function") {
      throw new TypeError("Expected function as last argument, not " + callback);
    }
    next(null, ...values);
    function next(error, ...output) {
      const fn = fns[++middlewareIndex];
      let index2 = -1;
      if (error) {
        callback(error);
        return;
      }
      while (++index2 < values.length) {
        if (output[index2] === null || output[index2] === void 0) {
          output[index2] = values[index2];
        }
      }
      values = output;
      if (fn) {
        wrap(fn, next)(...output);
      } else {
        callback(null, ...output);
      }
    }
  }
  function use(middelware) {
    if (typeof middelware !== "function") {
      throw new TypeError(
        "Expected `middelware` to be a function, not " + middelware
      );
    }
    fns.push(middelware);
    return pipeline;
  }
}
function wrap(middleware, callback) {
  let called;
  return wrapped;
  function wrapped(...parameters) {
    const fnExpectsCallback = middleware.length > parameters.length;
    let result;
    if (fnExpectsCallback) {
      parameters.push(done);
    }
    try {
      result = middleware.apply(this, parameters);
    } catch (error) {
      const exception = (
        /** @type {Error} */
        error
      );
      if (fnExpectsCallback && called) {
        throw exception;
      }
      return done(exception);
    }
    if (!fnExpectsCallback) {
      if (result && result.then && typeof result.then === "function") {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }
  function done(error, ...output) {
    if (!called) {
      called = true;
      callback(error, ...output);
    }
  }
  function then(value) {
    done(null, value);
  }
}
const minpath = { basename, dirname, extname, join, sep: "/" };
function basename(path2, extname2) {
  if (extname2 !== void 0 && typeof extname2 !== "string") {
    throw new TypeError('"ext" argument must be a string');
  }
  assertPath$1(path2);
  let start2 = 0;
  let end = -1;
  let index2 = path2.length;
  let seenNonSlash;
  if (extname2 === void 0 || extname2.length === 0 || extname2.length > path2.length) {
    while (index2--) {
      if (path2.codePointAt(index2) === 47) {
        if (seenNonSlash) {
          start2 = index2 + 1;
          break;
        }
      } else if (end < 0) {
        seenNonSlash = true;
        end = index2 + 1;
      }
    }
    return end < 0 ? "" : path2.slice(start2, end);
  }
  if (extname2 === path2) {
    return "";
  }
  let firstNonSlashEnd = -1;
  let extnameIndex = extname2.length - 1;
  while (index2--) {
    if (path2.codePointAt(index2) === 47) {
      if (seenNonSlash) {
        start2 = index2 + 1;
        break;
      }
    } else {
      if (firstNonSlashEnd < 0) {
        seenNonSlash = true;
        firstNonSlashEnd = index2 + 1;
      }
      if (extnameIndex > -1) {
        if (path2.codePointAt(index2) === extname2.codePointAt(extnameIndex--)) {
          if (extnameIndex < 0) {
            end = index2;
          }
        } else {
          extnameIndex = -1;
          end = firstNonSlashEnd;
        }
      }
    }
  }
  if (start2 === end) {
    end = firstNonSlashEnd;
  } else if (end < 0) {
    end = path2.length;
  }
  return path2.slice(start2, end);
}
function dirname(path2) {
  assertPath$1(path2);
  if (path2.length === 0) {
    return ".";
  }
  let end = -1;
  let index2 = path2.length;
  let unmatchedSlash;
  while (--index2) {
    if (path2.codePointAt(index2) === 47) {
      if (unmatchedSlash) {
        end = index2;
        break;
      }
    } else if (!unmatchedSlash) {
      unmatchedSlash = true;
    }
  }
  return end < 0 ? path2.codePointAt(0) === 47 ? "/" : "." : end === 1 && path2.codePointAt(0) === 47 ? "//" : path2.slice(0, end);
}
function extname(path2) {
  assertPath$1(path2);
  let index2 = path2.length;
  let end = -1;
  let startPart = 0;
  let startDot = -1;
  let preDotState = 0;
  let unmatchedSlash;
  while (index2--) {
    const code2 = path2.codePointAt(index2);
    if (code2 === 47) {
      if (unmatchedSlash) {
        startPart = index2 + 1;
        break;
      }
      continue;
    }
    if (end < 0) {
      unmatchedSlash = true;
      end = index2 + 1;
    }
    if (code2 === 46) {
      if (startDot < 0) {
        startDot = index2;
      } else if (preDotState !== 1) {
        preDotState = 1;
      }
    } else if (startDot > -1) {
      preDotState = -1;
    }
  }
  if (startDot < 0 || end < 0 || // We saw a non-dot character immediately before the dot.
  preDotState === 0 || // The (right-most) trimmed path component is exactly `..`.
  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return "";
  }
  return path2.slice(startDot, end);
}
function join(...segments) {
  let index2 = -1;
  let joined;
  while (++index2 < segments.length) {
    assertPath$1(segments[index2]);
    if (segments[index2]) {
      joined = joined === void 0 ? segments[index2] : joined + "/" + segments[index2];
    }
  }
  return joined === void 0 ? "." : normalize(joined);
}
function normalize(path2) {
  assertPath$1(path2);
  const absolute = path2.codePointAt(0) === 47;
  let value = normalizeString(path2, !absolute);
  if (value.length === 0 && !absolute) {
    value = ".";
  }
  if (value.length > 0 && path2.codePointAt(path2.length - 1) === 47) {
    value += "/";
  }
  return absolute ? "/" + value : value;
}
function normalizeString(path2, allowAboveRoot) {
  let result = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let index2 = -1;
  let code2;
  let lastSlashIndex;
  while (++index2 <= path2.length) {
    if (index2 < path2.length) {
      code2 = path2.codePointAt(index2);
    } else if (code2 === 47) {
      break;
    } else {
      code2 = 47;
    }
    if (code2 === 47) {
      if (lastSlash === index2 - 1 || dots === 1) ;
      else if (lastSlash !== index2 - 1 && dots === 2) {
        if (result.length < 2 || lastSegmentLength !== 2 || result.codePointAt(result.length - 1) !== 46 || result.codePointAt(result.length - 2) !== 46) {
          if (result.length > 2) {
            lastSlashIndex = result.lastIndexOf("/");
            if (lastSlashIndex !== result.length - 1) {
              if (lastSlashIndex < 0) {
                result = "";
                lastSegmentLength = 0;
              } else {
                result = result.slice(0, lastSlashIndex);
                lastSegmentLength = result.length - 1 - result.lastIndexOf("/");
              }
              lastSlash = index2;
              dots = 0;
              continue;
            }
          } else if (result.length > 0) {
            result = "";
            lastSegmentLength = 0;
            lastSlash = index2;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          result = result.length > 0 ? result + "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (result.length > 0) {
          result += "/" + path2.slice(lastSlash + 1, index2);
        } else {
          result = path2.slice(lastSlash + 1, index2);
        }
        lastSegmentLength = index2 - lastSlash - 1;
      }
      lastSlash = index2;
      dots = 0;
    } else if (code2 === 46 && dots > -1) {
      dots++;
    } else {
      dots = -1;
    }
  }
  return result;
}
function assertPath$1(path2) {
  if (typeof path2 !== "string") {
    throw new TypeError(
      "Path must be a string. Received " + JSON.stringify(path2)
    );
  }
}
const minproc = { cwd };
function cwd() {
  return "/";
}
function isUrl(fileUrlOrPath) {
  return Boolean(
    fileUrlOrPath !== null && typeof fileUrlOrPath === "object" && "href" in fileUrlOrPath && fileUrlOrPath.href && "protocol" in fileUrlOrPath && fileUrlOrPath.protocol && // @ts-expect-error: indexing is fine.
    fileUrlOrPath.auth === void 0
  );
}
function urlToPath(path2) {
  if (typeof path2 === "string") {
    path2 = new URL(path2);
  } else if (!isUrl(path2)) {
    const error = new TypeError(
      'The "path" argument must be of type string or an instance of URL. Received `' + path2 + "`"
    );
    error.code = "ERR_INVALID_ARG_TYPE";
    throw error;
  }
  if (path2.protocol !== "file:") {
    const error = new TypeError("The URL must be of scheme file");
    error.code = "ERR_INVALID_URL_SCHEME";
    throw error;
  }
  return getPathFromURLPosix(path2);
}
function getPathFromURLPosix(url) {
  if (url.hostname !== "") {
    const error = new TypeError(
      'File URL host must be "localhost" or empty on darwin'
    );
    error.code = "ERR_INVALID_FILE_URL_HOST";
    throw error;
  }
  const pathname = url.pathname;
  let index2 = -1;
  while (++index2 < pathname.length) {
    if (pathname.codePointAt(index2) === 37 && pathname.codePointAt(index2 + 1) === 50) {
      const third = pathname.codePointAt(index2 + 2);
      if (third === 70 || third === 102) {
        const error = new TypeError(
          "File URL path must not include encoded / characters"
        );
        error.code = "ERR_INVALID_FILE_URL_PATH";
        throw error;
      }
    }
  }
  return decodeURIComponent(pathname);
}
const order = (
  /** @type {const} */
  [
    "history",
    "path",
    "basename",
    "stem",
    "extname",
    "dirname"
  ]
);
class VFile {
  /**
   * Create a new virtual file.
   *
   * `options` is treated as:
   *
   * *   `string` or `Uint8Array` — `{value: options}`
   * *   `URL` — `{path: options}`
   * *   `VFile` — shallow copies its data over to the new file
   * *   `object` — all fields are shallow copied over to the new file
   *
   * Path related fields are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * You cannot set `dirname` or `extname` without setting either `history`,
   * `path`, `basename`, or `stem` too.
   *
   * @param {Compatible | null | undefined} [value]
   *   File value.
   * @returns
   *   New instance.
   */
  constructor(value) {
    let options;
    if (!value) {
      options = {};
    } else if (isUrl(value)) {
      options = { path: value };
    } else if (typeof value === "string" || isUint8Array$1(value)) {
      options = { value };
    } else {
      options = value;
    }
    this.cwd = "cwd" in options ? "" : minproc.cwd();
    this.data = {};
    this.history = [];
    this.messages = [];
    this.value;
    this.map;
    this.result;
    this.stored;
    let index2 = -1;
    while (++index2 < order.length) {
      const field2 = order[index2];
      if (field2 in options && options[field2] !== void 0 && options[field2] !== null) {
        this[field2] = field2 === "history" ? [...options[field2]] : options[field2];
      }
    }
    let field;
    for (field in options) {
      if (!order.includes(field)) {
        this[field] = options[field];
      }
    }
  }
  /**
   * Get the basename (including extname) (example: `'index.min.js'`).
   *
   * @returns {string | undefined}
   *   Basename.
   */
  get basename() {
    return typeof this.path === "string" ? minpath.basename(this.path) : void 0;
  }
  /**
   * Set basename (including extname) (`'index.min.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} basename
   *   Basename.
   * @returns {undefined}
   *   Nothing.
   */
  set basename(basename2) {
    assertNonEmpty(basename2, "basename");
    assertPart(basename2, "basename");
    this.path = minpath.join(this.dirname || "", basename2);
  }
  /**
   * Get the parent path (example: `'~'`).
   *
   * @returns {string | undefined}
   *   Dirname.
   */
  get dirname() {
    return typeof this.path === "string" ? minpath.dirname(this.path) : void 0;
  }
  /**
   * Set the parent path (example: `'~'`).
   *
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} dirname
   *   Dirname.
   * @returns {undefined}
   *   Nothing.
   */
  set dirname(dirname2) {
    assertPath(this.basename, "dirname");
    this.path = minpath.join(dirname2 || "", this.basename);
  }
  /**
   * Get the extname (including dot) (example: `'.js'`).
   *
   * @returns {string | undefined}
   *   Extname.
   */
  get extname() {
    return typeof this.path === "string" ? minpath.extname(this.path) : void 0;
  }
  /**
   * Set the extname (including dot) (example: `'.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} extname
   *   Extname.
   * @returns {undefined}
   *   Nothing.
   */
  set extname(extname2) {
    assertPart(extname2, "extname");
    assertPath(this.dirname, "extname");
    if (extname2) {
      if (extname2.codePointAt(0) !== 46) {
        throw new Error("`extname` must start with `.`");
      }
      if (extname2.includes(".", 1)) {
        throw new Error("`extname` cannot contain multiple dots");
      }
    }
    this.path = minpath.join(this.dirname, this.stem + (extname2 || ""));
  }
  /**
   * Get the full path (example: `'~/index.min.js'`).
   *
   * @returns {string}
   *   Path.
   */
  get path() {
    return this.history[this.history.length - 1];
  }
  /**
   * Set the full path (example: `'~/index.min.js'`).
   *
   * Cannot be nullified.
   * You can set a file URL (a `URL` object with a `file:` protocol) which will
   * be turned into a path with `url.fileURLToPath`.
   *
   * @param {URL | string} path
   *   Path.
   * @returns {undefined}
   *   Nothing.
   */
  set path(path2) {
    if (isUrl(path2)) {
      path2 = urlToPath(path2);
    }
    assertNonEmpty(path2, "path");
    if (this.path !== path2) {
      this.history.push(path2);
    }
  }
  /**
   * Get the stem (basename w/o extname) (example: `'index.min'`).
   *
   * @returns {string | undefined}
   *   Stem.
   */
  get stem() {
    return typeof this.path === "string" ? minpath.basename(this.path, this.extname) : void 0;
  }
  /**
   * Set the stem (basename w/o extname) (example: `'index.min'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} stem
   *   Stem.
   * @returns {undefined}
   *   Nothing.
   */
  set stem(stem) {
    assertNonEmpty(stem, "stem");
    assertPart(stem, "stem");
    this.path = minpath.join(this.dirname || "", stem + (this.extname || ""));
  }
  // Normal prototypal methods.
  /**
   * Create a fatal message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `true` (error; file not usable)
   * and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {never}
   *   Never.
   * @throws {VFileMessage}
   *   Message.
   */
  fail(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);
    message.fatal = true;
    throw message;
  }
  /**
   * Create an info message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `undefined` (info; change
   * likely not needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  info(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);
    message.fatal = void 0;
    return message;
  }
  /**
   * Create a message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `false` (warning; change may be
   * needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  message(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = new VFileMessage(
      // @ts-expect-error: the overloads are fine.
      causeOrReason,
      optionsOrParentOrPlace,
      origin
    );
    if (this.path) {
      message.name = this.path + ":" + message.name;
      message.file = this.path;
    }
    message.fatal = false;
    this.messages.push(message);
    return message;
  }
  /**
   * Serialize the file.
   *
   * > **Note**: which encodings are supported depends on the engine.
   * > For info on Node.js, see:
   * > <https://nodejs.org/api/util.html#whatwg-supported-encodings>.
   *
   * @param {string | null | undefined} [encoding='utf8']
   *   Character encoding to understand `value` as when it’s a `Uint8Array`
   *   (default: `'utf-8'`).
   * @returns {string}
   *   Serialized file.
   */
  toString(encoding) {
    if (this.value === void 0) {
      return "";
    }
    if (typeof this.value === "string") {
      return this.value;
    }
    const decoder = new TextDecoder(encoding || void 0);
    return decoder.decode(this.value);
  }
}
function assertPart(part, name2) {
  if (part && part.includes(minpath.sep)) {
    throw new Error(
      "`" + name2 + "` cannot be a path: did not expect `" + minpath.sep + "`"
    );
  }
}
function assertNonEmpty(part, name2) {
  if (!part) {
    throw new Error("`" + name2 + "` cannot be empty");
  }
}
function assertPath(path2, name2) {
  if (!path2) {
    throw new Error("Setting `" + name2 + "` requires `path` to be set too");
  }
}
function isUint8Array$1(value) {
  return Boolean(
    value && typeof value === "object" && "byteLength" in value && "byteOffset" in value
  );
}
const CallableInstance = (
  /**
   * @type {new <Parameters extends Array<unknown>, Result>(property: string | symbol) => (...parameters: Parameters) => Result}
   */
  /** @type {unknown} */
  /**
   * @this {Function}
   * @param {string | symbol} property
   * @returns {(...parameters: Array<unknown>) => unknown}
   */
  function(property) {
    const self2 = this;
    const constr = self2.constructor;
    const proto = (
      /** @type {Record<string | symbol, Function>} */
      // Prototypes do exist.
      // type-coverage:ignore-next-line
      constr.prototype
    );
    const value = proto[property];
    const apply = function() {
      return value.apply(apply, arguments);
    };
    Object.setPrototypeOf(apply, proto);
    return apply;
  }
);
const own = {}.hasOwnProperty;
class Processor extends CallableInstance {
  /**
   * Create a processor.
   */
  constructor() {
    super("copy");
    this.Compiler = void 0;
    this.Parser = void 0;
    this.attachers = [];
    this.compiler = void 0;
    this.freezeIndex = -1;
    this.frozen = void 0;
    this.namespace = {};
    this.parser = void 0;
    this.transformers = trough();
  }
  /**
   * Copy a processor.
   *
   * @deprecated
   *   This is a private internal method and should not be used.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   New *unfrozen* processor ({@linkcode Processor}) that is
   *   configured to work the same as its ancestor.
   *   When the descendant processor is configured in the future it does not
   *   affect the ancestral processor.
   */
  copy() {
    const destination = (
      /** @type {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>} */
      new Processor()
    );
    let index2 = -1;
    while (++index2 < this.attachers.length) {
      const attacher = this.attachers[index2];
      destination.use(...attacher);
    }
    destination.data(extend$1(true, {}, this.namespace));
    return destination;
  }
  /**
   * Configure the processor with info available to all plugins.
   * Information is stored in an object.
   *
   * Typically, options can be given to a specific plugin, but sometimes it
   * makes sense to have information shared with several plugins.
   * For example, a list of HTML elements that are self-closing, which is
   * needed during all phases.
   *
   * > **Note**: setting information cannot occur on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * > **Note**: to register custom data in TypeScript, augment the
   * > {@linkcode Data} interface.
   *
   * @example
   *   This example show how to get and set info:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   const processor = unified().data('alpha', 'bravo')
   *
   *   processor.data('alpha') // => 'bravo'
   *
   *   processor.data() // => {alpha: 'bravo'}
   *
   *   processor.data({charlie: 'delta'})
   *
   *   processor.data() // => {charlie: 'delta'}
   *   ```
   *
   * @template {keyof Data} Key
   *
   * @overload
   * @returns {Data}
   *
   * @overload
   * @param {Data} dataset
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Key} key
   * @returns {Data[Key]}
   *
   * @overload
   * @param {Key} key
   * @param {Data[Key]} value
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @param {Data | Key} [key]
   *   Key to get or set, or entire dataset to set, or nothing to get the
   *   entire dataset (optional).
   * @param {Data[Key]} [value]
   *   Value to set (optional).
   * @returns {unknown}
   *   The current processor when setting, the value at `key` when getting, or
   *   the entire dataset when getting without key.
   */
  data(key, value) {
    if (typeof key === "string") {
      if (arguments.length === 2) {
        assertUnfrozen("data", this.frozen);
        this.namespace[key] = value;
        return this;
      }
      return own.call(this.namespace, key) && this.namespace[key] || void 0;
    }
    if (key) {
      assertUnfrozen("data", this.frozen);
      this.namespace = key;
      return this;
    }
    return this.namespace;
  }
  /**
   * Freeze a processor.
   *
   * Frozen processors are meant to be extended and not to be configured
   * directly.
   *
   * When a processor is frozen it cannot be unfrozen.
   * New processors working the same way can be created by calling the
   * processor.
   *
   * It’s possible to freeze processors explicitly by calling `.freeze()`.
   * Processors freeze automatically when `.parse()`, `.run()`, `.runSync()`,
   * `.stringify()`, `.process()`, or `.processSync()` are called.
   *
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   The current processor.
   */
  freeze() {
    if (this.frozen) {
      return this;
    }
    const self2 = (
      /** @type {Processor} */
      /** @type {unknown} */
      this
    );
    while (++this.freezeIndex < this.attachers.length) {
      const [attacher, ...options] = this.attachers[this.freezeIndex];
      if (options[0] === false) {
        continue;
      }
      if (options[0] === true) {
        options[0] = void 0;
      }
      const transformer = attacher.call(self2, ...options);
      if (typeof transformer === "function") {
        this.transformers.use(transformer);
      }
    }
    this.frozen = true;
    this.freezeIndex = Number.POSITIVE_INFINITY;
    return this;
  }
  /**
   * Parse text to a syntax tree.
   *
   * > **Note**: `parse` freezes the processor if not already *frozen*.
   *
   * > **Note**: `parse` performs the parse phase, not the run phase or other
   * > phases.
   *
   * @param {Compatible | undefined} [file]
   *   file to parse (optional); typically `string` or `VFile`; any value
   *   accepted as `x` in `new VFile(x)`.
   * @returns {ParseTree extends undefined ? Node : ParseTree}
   *   Syntax tree representing `file`.
   */
  parse(file) {
    this.freeze();
    const realFile = vfile(file);
    const parser = this.parser || this.Parser;
    assertParser("parse", parser);
    return parser(String(realFile), realFile);
  }
  /**
   * Process the given file as configured on the processor.
   *
   * > **Note**: `process` freezes the processor if not already *frozen*.
   *
   * > **Note**: `process` performs the parse, run, and stringify phases.
   *
   * @overload
   * @param {Compatible | undefined} file
   * @param {ProcessCallback<VFileWithOutput<CompileResult>>} done
   * @returns {undefined}
   *
   * @overload
   * @param {Compatible | undefined} [file]
   * @returns {Promise<VFileWithOutput<CompileResult>>}
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`]; any value accepted as
   *   `x` in `new VFile(x)`.
   * @param {ProcessCallback<VFileWithOutput<CompileResult>> | undefined} [done]
   *   Callback (optional).
   * @returns {Promise<VFile> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise a promise, rejected with a fatal error or resolved with the
   *   processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  process(file, done) {
    const self2 = this;
    this.freeze();
    assertParser("process", this.parser || this.Parser);
    assertCompiler("process", this.compiler || this.Compiler);
    return done ? executor(void 0, done) : new Promise(executor);
    function executor(resolve, reject) {
      const realFile = vfile(file);
      const parseTree = (
        /** @type {HeadTree extends undefined ? Node : HeadTree} */
        /** @type {unknown} */
        self2.parse(realFile)
      );
      self2.run(parseTree, realFile, function(error, tree, file2) {
        if (error || !tree || !file2) {
          return realDone(error);
        }
        const compileTree = (
          /** @type {CompileTree extends undefined ? Node : CompileTree} */
          /** @type {unknown} */
          tree
        );
        const compileResult = self2.stringify(compileTree, file2);
        if (looksLikeAValue(compileResult)) {
          file2.value = compileResult;
        } else {
          file2.result = compileResult;
        }
        realDone(
          error,
          /** @type {VFileWithOutput<CompileResult>} */
          file2
        );
      });
      function realDone(error, file2) {
        if (error || !file2) {
          reject(error);
        } else if (resolve) {
          resolve(file2);
        } else {
          done(void 0, file2);
        }
      }
    }
  }
  /**
   * Process the given file as configured on the processor.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `processSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `processSync` performs the parse, run, and stringify phases.
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`; any value accepted as
   *   `x` in `new VFile(x)`.
   * @returns {VFileWithOutput<CompileResult>}
   *   The processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  processSync(file) {
    let complete = false;
    let result;
    this.freeze();
    assertParser("processSync", this.parser || this.Parser);
    assertCompiler("processSync", this.compiler || this.Compiler);
    this.process(file, realDone);
    assertDone("processSync", "process", complete);
    return result;
    function realDone(error, file2) {
      complete = true;
      bail(error);
      result = file2;
    }
  }
  /**
   * Run *transformers* on a syntax tree.
   *
   * > **Note**: `run` freezes the processor if not already *frozen*.
   *
   * > **Note**: `run` performs the run phase, not other phases.
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} file
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} [file]
   * @returns {Promise<TailTree extends undefined ? Node : TailTree>}
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {(
   *   RunCallback<TailTree extends undefined ? Node : TailTree> |
   *   Compatible
   * )} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} [done]
   *   Callback (optional).
   * @returns {Promise<TailTree extends undefined ? Node : TailTree> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise, a promise rejected with a fatal error or resolved with the
   *   transformed tree.
   */
  run(tree, file, done) {
    assertNode(tree);
    this.freeze();
    const transformers = this.transformers;
    if (!done && typeof file === "function") {
      done = file;
      file = void 0;
    }
    return done ? executor(void 0, done) : new Promise(executor);
    function executor(resolve, reject) {
      const realFile = vfile(file);
      transformers.run(tree, realFile, realDone);
      function realDone(error, outputTree, file2) {
        const resultingTree = (
          /** @type {TailTree extends undefined ? Node : TailTree} */
          outputTree || tree
        );
        if (error) {
          reject(error);
        } else if (resolve) {
          resolve(resultingTree);
        } else {
          done(void 0, resultingTree, file2);
        }
      }
    }
  }
  /**
   * Run *transformers* on a syntax tree.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `runSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `runSync` performs the run phase, not other phases.
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {TailTree extends undefined ? Node : TailTree}
   *   Transformed tree.
   */
  runSync(tree, file) {
    let complete = false;
    let result;
    this.run(tree, file, realDone);
    assertDone("runSync", "run", complete);
    return result;
    function realDone(error, tree2) {
      bail(error);
      result = tree2;
      complete = true;
    }
  }
  /**
   * Compile a syntax tree.
   *
   * > **Note**: `stringify` freezes the processor if not already *frozen*.
   *
   * > **Note**: `stringify` performs the stringify phase, not the run phase
   * > or other phases.
   *
   * @param {CompileTree extends undefined ? Node : CompileTree} tree
   *   Tree to compile.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {CompileResult extends undefined ? Value : CompileResult}
   *   Textual representation of the tree (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most compilers
   *   > return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  stringify(tree, file) {
    this.freeze();
    const realFile = vfile(file);
    const compiler2 = this.compiler || this.Compiler;
    assertCompiler("stringify", compiler2);
    assertNode(tree);
    return compiler2(tree, realFile);
  }
  /**
   * Configure the processor to use a plugin, a list of usable values, or a
   * preset.
   *
   * If the processor is already using a plugin, the previous plugin
   * configuration is changed based on the options that are passed in.
   * In other words, the plugin is not added a second time.
   *
   * > **Note**: `use` cannot be called on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * @example
   *   There are many ways to pass plugins to `.use()`.
   *   This example gives an overview:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   unified()
   *     // Plugin with options:
   *     .use(pluginA, {x: true, y: true})
   *     // Passing the same plugin again merges configuration (to `{x: true, y: false, z: true}`):
   *     .use(pluginA, {y: false, z: true})
   *     // Plugins:
   *     .use([pluginB, pluginC])
   *     // Two plugins, the second with options:
   *     .use([pluginD, [pluginE, {}]])
   *     // Preset with plugins and settings:
   *     .use({plugins: [pluginF, [pluginG, {}]], settings: {position: false}})
   *     // Settings only:
   *     .use({settings: {position: false}})
   *   ```
   *
   * @template {Array<unknown>} [Parameters=[]]
   * @template {Node | string | undefined} [Input=undefined]
   * @template [Output=Input]
   *
   * @overload
   * @param {Preset | null | undefined} [preset]
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {PluggableList} list
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Plugin<Parameters, Input, Output>} plugin
   * @param {...(Parameters | [boolean])} parameters
   * @returns {UsePlugin<ParseTree, HeadTree, TailTree, CompileTree, CompileResult, Input, Output>}
   *
   * @param {PluggableList | Plugin | Preset | null | undefined} value
   *   Usable value.
   * @param {...unknown} parameters
   *   Parameters, when a plugin is given as a usable value.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   Current processor.
   */
  use(value, ...parameters) {
    const attachers = this.attachers;
    const namespace2 = this.namespace;
    assertUnfrozen("use", this.frozen);
    if (value === null || value === void 0) ;
    else if (typeof value === "function") {
      addPlugin(value, parameters);
    } else if (typeof value === "object") {
      if (Array.isArray(value)) {
        addList(value);
      } else {
        addPreset(value);
      }
    } else {
      throw new TypeError("Expected usable value, not `" + value + "`");
    }
    return this;
    function add(value2) {
      if (typeof value2 === "function") {
        addPlugin(value2, []);
      } else if (typeof value2 === "object") {
        if (Array.isArray(value2)) {
          const [plugin, ...parameters2] = (
            /** @type {PluginTuple<Array<unknown>>} */
            value2
          );
          addPlugin(plugin, parameters2);
        } else {
          addPreset(value2);
        }
      } else {
        throw new TypeError("Expected usable value, not `" + value2 + "`");
      }
    }
    function addPreset(result) {
      if (!("plugins" in result) && !("settings" in result)) {
        throw new Error(
          "Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither"
        );
      }
      addList(result.plugins);
      if (result.settings) {
        namespace2.settings = extend$1(true, namespace2.settings, result.settings);
      }
    }
    function addList(plugins) {
      let index2 = -1;
      if (plugins === null || plugins === void 0) ;
      else if (Array.isArray(plugins)) {
        while (++index2 < plugins.length) {
          const thing = plugins[index2];
          add(thing);
        }
      } else {
        throw new TypeError("Expected a list of plugins, not `" + plugins + "`");
      }
    }
    function addPlugin(plugin, parameters2) {
      let index2 = -1;
      let entryIndex = -1;
      while (++index2 < attachers.length) {
        if (attachers[index2][0] === plugin) {
          entryIndex = index2;
          break;
        }
      }
      if (entryIndex === -1) {
        attachers.push([plugin, ...parameters2]);
      } else if (parameters2.length > 0) {
        let [primary, ...rest] = parameters2;
        const currentPrimary = attachers[entryIndex][1];
        if (isPlainObject2(currentPrimary) && isPlainObject2(primary)) {
          primary = extend$1(true, currentPrimary, primary);
        }
        attachers[entryIndex] = [plugin, primary, ...rest];
      }
    }
  }
}
const unified = new Processor().freeze();
function assertParser(name2, value) {
  if (typeof value !== "function") {
    throw new TypeError("Cannot `" + name2 + "` without `parser`");
  }
}
function assertCompiler(name2, value) {
  if (typeof value !== "function") {
    throw new TypeError("Cannot `" + name2 + "` without `compiler`");
  }
}
function assertUnfrozen(name2, frozen) {
  if (frozen) {
    throw new Error(
      "Cannot call `" + name2 + "` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`."
    );
  }
}
function assertNode(node2) {
  if (!isPlainObject2(node2) || typeof node2.type !== "string") {
    throw new TypeError("Expected node, got `" + node2 + "`");
  }
}
function assertDone(name2, asyncName, complete) {
  if (!complete) {
    throw new Error(
      "`" + name2 + "` finished async. Use `" + asyncName + "` instead"
    );
  }
}
function vfile(value) {
  return looksLikeAVFile(value) ? value : new VFile(value);
}
function looksLikeAVFile(value) {
  return Boolean(
    value && typeof value === "object" && "message" in value && "messages" in value
  );
}
function looksLikeAValue(value) {
  return typeof value === "string" || isUint8Array(value);
}
function isUint8Array(value) {
  return Boolean(
    value && typeof value === "object" && "byteLength" in value && "byteOffset" in value
  );
}
const changelog = "https://github.com/remarkjs/react-markdown/blob/main/changelog.md";
const emptyPlugins = [];
const emptyRemarkRehypeOptions = { allowDangerousHtml: true };
const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i;
const deprecations = [
  { from: "astPlugins", id: "remove-buggy-html-in-markdown-parser" },
  { from: "allowDangerousHtml", id: "remove-buggy-html-in-markdown-parser" },
  {
    from: "allowNode",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "allowElement"
  },
  {
    from: "allowedTypes",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "allowedElements"
  },
  { from: "className", id: "remove-classname" },
  {
    from: "disallowedTypes",
    id: "replace-allownode-allowedtypes-and-disallowedtypes",
    to: "disallowedElements"
  },
  { from: "escapeHtml", id: "remove-buggy-html-in-markdown-parser" },
  { from: "includeElementIndex", id: "#remove-includeelementindex" },
  {
    from: "includeNodeIndex",
    id: "change-includenodeindex-to-includeelementindex"
  },
  { from: "linkTarget", id: "remove-linktarget" },
  { from: "plugins", id: "change-plugins-to-remarkplugins", to: "remarkPlugins" },
  { from: "rawSourcePos", id: "#remove-rawsourcepos" },
  { from: "renderers", id: "change-renderers-to-components", to: "components" },
  { from: "source", id: "change-source-to-children", to: "children" },
  { from: "sourcePos", id: "#remove-sourcepos" },
  { from: "transformImageUri", id: "#add-urltransform", to: "urlTransform" },
  { from: "transformLinkUri", id: "#add-urltransform", to: "urlTransform" }
];
function Markdown(options) {
  const processor = createProcessor(options);
  const file = createFile(options);
  return post(processor.runSync(processor.parse(file), file), options);
}
function createProcessor(options) {
  const rehypePlugins = options.rehypePlugins || emptyPlugins;
  const remarkPlugins = options.remarkPlugins || emptyPlugins;
  const remarkRehypeOptions = options.remarkRehypeOptions ? { ...options.remarkRehypeOptions, ...emptyRemarkRehypeOptions } : emptyRemarkRehypeOptions;
  const processor = unified().use(remarkParse).use(remarkPlugins).use(remarkRehype, remarkRehypeOptions).use(rehypePlugins);
  return processor;
}
function createFile(options) {
  const children2 = options.children || "";
  const file = new VFile();
  if (typeof children2 === "string") {
    file.value = children2;
  }
  return file;
}
function post(tree, options) {
  const allowedElements = options.allowedElements;
  const allowElement = options.allowElement;
  const components = options.components;
  const disallowedElements = options.disallowedElements;
  const skipHtml = options.skipHtml;
  const unwrapDisallowed = options.unwrapDisallowed;
  const urlTransform = options.urlTransform || defaultUrlTransform;
  for (const deprecation of deprecations) {
    if (Object.hasOwn(options, deprecation.from)) {
      unreachable(
        "Unexpected `" + deprecation.from + "` prop, " + (deprecation.to ? "use `" + deprecation.to + "` instead" : "remove it") + " (see <" + changelog + "#" + deprecation.id + "> for more info)"
      );
    }
  }
  visit(tree, transform2);
  return toJsxRuntime(tree, {
    Fragment: jsxRuntimeExports.Fragment,
    components,
    ignoreInvalidStyle: true,
    jsx: jsxRuntimeExports.jsx,
    jsxs: jsxRuntimeExports.jsxs,
    passKeys: true,
    passNode: true
  });
  function transform2(node2, index2, parent) {
    if (node2.type === "raw" && parent && typeof index2 === "number") {
      if (skipHtml) {
        parent.children.splice(index2, 1);
      } else {
        parent.children[index2] = { type: "text", value: node2.value };
      }
      return index2;
    }
    if (node2.type === "element") {
      let key;
      for (key in urlAttributes) {
        if (Object.hasOwn(urlAttributes, key) && Object.hasOwn(node2.properties, key)) {
          const value = node2.properties[key];
          const test = urlAttributes[key];
          if (test === null || test.includes(node2.tagName)) {
            node2.properties[key] = urlTransform(String(value || ""), key, node2);
          }
        }
      }
    }
    if (node2.type === "element") {
      let remove2 = allowedElements ? !allowedElements.includes(node2.tagName) : disallowedElements ? disallowedElements.includes(node2.tagName) : false;
      if (!remove2 && allowElement && typeof index2 === "number") {
        remove2 = !allowElement(node2, index2, parent);
      }
      if (remove2 && parent && typeof index2 === "number") {
        if (unwrapDisallowed && node2.children) {
          parent.children.splice(index2, 1, ...node2.children);
        } else {
          parent.children.splice(index2, 1);
        }
        return index2;
      }
    }
  }
}
function defaultUrlTransform(value) {
  const colon = value.indexOf(":");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");
  const slash = value.indexOf("/");
  if (
    // If there is no protocol, it’s relative.
    colon === -1 || // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    slash !== -1 && colon > slash || questionMark !== -1 && colon > questionMark || numberSign !== -1 && colon > numberSign || // It is a protocol, it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value;
  }
  return "";
}
function ccount(value, character) {
  const source = String(value);
  if (typeof character !== "string") {
    throw new TypeError("Expected character");
  }
  let count = 0;
  let index2 = source.indexOf(character);
  while (index2 !== -1) {
    count++;
    index2 = source.indexOf(character, index2 + character.length);
  }
  return count;
}
function escapeStringRegexp(string2) {
  if (typeof string2 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string2.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function findAndReplace(tree, list2, options) {
  const settings = options || {};
  const ignored = convert(settings.ignore || []);
  const pairs = toPairs(list2);
  let pairIndex = -1;
  while (++pairIndex < pairs.length) {
    visitParents(tree, "text", visitor);
  }
  function visitor(node2, parents) {
    let index2 = -1;
    let grandparent;
    while (++index2 < parents.length) {
      const parent = parents[index2];
      const siblings = grandparent ? grandparent.children : void 0;
      if (ignored(
        parent,
        siblings ? siblings.indexOf(parent) : void 0,
        grandparent
      )) {
        return;
      }
      grandparent = parent;
    }
    if (grandparent) {
      return handler(node2, parents);
    }
  }
  function handler(node2, parents) {
    const parent = parents[parents.length - 1];
    const find2 = pairs[pairIndex][0];
    const replace2 = pairs[pairIndex][1];
    let start2 = 0;
    const siblings = parent.children;
    const index2 = siblings.indexOf(node2);
    let change = false;
    let nodes = [];
    find2.lastIndex = 0;
    let match = find2.exec(node2.value);
    while (match) {
      const position2 = match.index;
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node2]
      };
      let value = replace2(...match, matchObject);
      if (typeof value === "string") {
        value = value.length > 0 ? { type: "text", value } : void 0;
      }
      if (value === false) {
        find2.lastIndex = position2 + 1;
      } else {
        if (start2 !== position2) {
          nodes.push({
            type: "text",
            value: node2.value.slice(start2, position2)
          });
        }
        if (Array.isArray(value)) {
          nodes.push(...value);
        } else if (value) {
          nodes.push(value);
        }
        start2 = position2 + match[0].length;
        change = true;
      }
      if (!find2.global) {
        break;
      }
      match = find2.exec(node2.value);
    }
    if (change) {
      if (start2 < node2.value.length) {
        nodes.push({ type: "text", value: node2.value.slice(start2) });
      }
      parent.children.splice(index2, 1, ...nodes);
    } else {
      nodes = [node2];
    }
    return index2 + nodes.length;
  }
}
function toPairs(tupleOrList) {
  const result = [];
  if (!Array.isArray(tupleOrList)) {
    throw new TypeError("Expected find and replace tuple or list of tuples");
  }
  const list2 = !tupleOrList[0] || Array.isArray(tupleOrList[0]) ? tupleOrList : [tupleOrList];
  let index2 = -1;
  while (++index2 < list2.length) {
    const tuple = list2[index2];
    result.push([toExpression(tuple[0]), toFunction(tuple[1])]);
  }
  return result;
}
function toExpression(find2) {
  return typeof find2 === "string" ? new RegExp(escapeStringRegexp(find2), "g") : find2;
}
function toFunction(replace2) {
  return typeof replace2 === "function" ? replace2 : function() {
    return replace2;
  };
}
const inConstruct = "phrasing";
const notInConstruct = ["autolink", "link", "image", "label"];
function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  };
}
function gfmAutolinkLiteralToMarkdown() {
  return {
    unsafe: [
      {
        character: "@",
        before: "[+\\-.\\w]",
        after: "[\\-.\\w]",
        inConstruct,
        notInConstruct
      },
      {
        character: ".",
        before: "[Ww]",
        after: "[\\-.\\w]",
        inConstruct,
        notInConstruct
      },
      {
        character: ":",
        before: "[ps]",
        after: "\\/",
        inConstruct,
        notInConstruct
      }
    ]
  };
}
function enterLiteralAutolink(token) {
  this.enter({ type: "link", title: null, url: "", children: [] }, token);
}
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token);
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "link");
  node2.url = "http://" + this.sliceSerialize(token);
}
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token);
}
function exitLiteralAutolink(token) {
  this.exit(token);
}
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, findUrl],
      [new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)", "gu"), findEmail]
    ],
    { ignore: ["link", "linkReference"] }
  );
}
function findUrl(_, protocol, domain2, path2, match) {
  let prefix = "";
  if (!previous(match)) {
    return false;
  }
  if (/^w/i.test(protocol)) {
    domain2 = protocol + domain2;
    protocol = "";
    prefix = "http://";
  }
  if (!isCorrectDomain(domain2)) {
    return false;
  }
  const parts = splitUrl(domain2 + path2);
  if (!parts[0]) return false;
  const result = {
    type: "link",
    title: null,
    url: prefix + protocol + parts[0],
    children: [{ type: "text", value: protocol + parts[0] }]
  };
  if (parts[1]) {
    return [result, { type: "text", value: parts[1] }];
  }
  return result;
}
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous(match, true) || // Label ends in not allowed character.
    /[-\d_]$/.test(label)
  ) {
    return false;
  }
  return {
    type: "link",
    title: null,
    url: "mailto:" + atext + "@" + label,
    children: [{ type: "text", value: atext + "@" + label }]
  };
}
function isCorrectDomain(domain2) {
  const parts = domain2.split(".");
  if (parts.length < 2 || parts[parts.length - 1] && (/_/.test(parts[parts.length - 1]) || !/[a-zA-Z\d]/.test(parts[parts.length - 1])) || parts[parts.length - 2] && (/_/.test(parts[parts.length - 2]) || !/[a-zA-Z\d]/.test(parts[parts.length - 2]))) {
    return false;
  }
  return true;
}
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url);
  if (!trailExec) {
    return [url, void 0];
  }
  url = url.slice(0, trailExec.index);
  let trail2 = trailExec[0];
  let closingParenIndex = trail2.indexOf(")");
  const openingParens = ccount(url, "(");
  let closingParens = ccount(url, ")");
  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail2.slice(0, closingParenIndex + 1);
    trail2 = trail2.slice(closingParenIndex + 1);
    closingParenIndex = trail2.indexOf(")");
    closingParens++;
  }
  return [url, trail2];
}
function previous(match, email) {
  const code2 = match.input.charCodeAt(match.index - 1);
  return (match.index === 0 || unicodeWhitespace(code2) || unicodePunctuation(code2)) && // If it’s an email, the previous character should not be a slash.
  (!email || code2 !== 47);
}
footnoteReference.peek = footnoteReferencePeek;
function enterFootnoteCallString() {
  this.buffer();
}
function enterFootnoteCall(token) {
  this.enter({ type: "footnoteReference", identifier: "", label: "" }, token);
}
function enterFootnoteDefinitionLabelString() {
  this.buffer();
}
function enterFootnoteDefinition(token) {
  this.enter(
    { type: "footnoteDefinition", identifier: "", label: "", children: [] },
    token
  );
}
function exitFootnoteCallString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "footnoteReference");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteCall(token) {
  this.exit(token);
}
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "footnoteDefinition");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteDefinition(token) {
  this.exit(token);
}
function footnoteReferencePeek() {
  return "[";
}
function footnoteReference(node2, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move("[^");
  const exit2 = state.enter("footnoteReference");
  const subexit = state.enter("reference");
  value += tracker.move(
    state.safe(state.associationId(node2), { after: "]", before: value })
  );
  subexit();
  exit2();
  value += tracker.move("]");
  return value;
}
function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteCallString: enterFootnoteCallString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: enterFootnoteDefinition
    },
    exit: {
      gfmFootnoteCallString: exitFootnoteCallString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: exitFootnoteDefinition
    }
  };
}
function gfmFootnoteToMarkdown(options) {
  let firstLineBlank = false;
  if (options && options.firstLineBlank) {
    firstLineBlank = true;
  }
  return {
    handlers: { footnoteDefinition, footnoteReference },
    // This is on by default already.
    unsafe: [{ character: "[", inConstruct: ["label", "phrasing", "reference"] }]
  };
  function footnoteDefinition(node2, _, state, info) {
    const tracker = state.createTracker(info);
    let value = tracker.move("[^");
    const exit2 = state.enter("footnoteDefinition");
    const subexit = state.enter("label");
    value += tracker.move(
      state.safe(state.associationId(node2), { before: value, after: "]" })
    );
    subexit();
    value += tracker.move("]:");
    if (node2.children && node2.children.length > 0) {
      tracker.shift(4);
      value += tracker.move(
        (firstLineBlank ? "\n" : " ") + state.indentLines(
          state.containerFlow(node2, tracker.current()),
          firstLineBlank ? mapAll : mapExceptFirst
        )
      );
    }
    exit2();
    return value;
  }
}
function mapExceptFirst(line, index2, blank) {
  return index2 === 0 ? line : mapAll(line, index2, blank);
}
function mapAll(line, index2, blank) {
  return (blank ? "" : "    ") + line;
}
const constructsWithoutStrikethrough = [
  "autolink",
  "destinationLiteral",
  "destinationRaw",
  "reference",
  "titleQuote",
  "titleApostrophe"
];
handleDelete.peek = peekDelete;
function gfmStrikethroughFromMarkdown() {
  return {
    canContainEols: ["delete"],
    enter: { strikethrough: enterStrikethrough },
    exit: { strikethrough: exitStrikethrough }
  };
}
function gfmStrikethroughToMarkdown() {
  return {
    unsafe: [
      {
        character: "~",
        inConstruct: "phrasing",
        notInConstruct: constructsWithoutStrikethrough
      }
    ],
    handlers: { delete: handleDelete }
  };
}
function enterStrikethrough(token) {
  this.enter({ type: "delete", children: [] }, token);
}
function exitStrikethrough(token) {
  this.exit(token);
}
function handleDelete(node2, _, state, info) {
  const tracker = state.createTracker(info);
  const exit2 = state.enter("strikethrough");
  let value = tracker.move("~~");
  value += state.containerPhrasing(node2, {
    ...tracker.current(),
    before: value,
    after: "~"
  });
  value += tracker.move("~~");
  exit2();
  return value;
}
function peekDelete() {
  return "~";
}
function defaultStringLength(value) {
  return value.length;
}
function markdownTable(table2, options) {
  const settings = options || {};
  const align = (settings.align || []).concat();
  const stringLength = settings.stringLength || defaultStringLength;
  const alignments = [];
  const cellMatrix = [];
  const sizeMatrix = [];
  const longestCellByColumn = [];
  let mostCellsPerRow = 0;
  let rowIndex = -1;
  while (++rowIndex < table2.length) {
    const row2 = [];
    const sizes2 = [];
    let columnIndex2 = -1;
    if (table2[rowIndex].length > mostCellsPerRow) {
      mostCellsPerRow = table2[rowIndex].length;
    }
    while (++columnIndex2 < table2[rowIndex].length) {
      const cell = serialize(table2[rowIndex][columnIndex2]);
      if (settings.alignDelimiters !== false) {
        const size = stringLength(cell);
        sizes2[columnIndex2] = size;
        if (longestCellByColumn[columnIndex2] === void 0 || size > longestCellByColumn[columnIndex2]) {
          longestCellByColumn[columnIndex2] = size;
        }
      }
      row2.push(cell);
    }
    cellMatrix[rowIndex] = row2;
    sizeMatrix[rowIndex] = sizes2;
  }
  let columnIndex = -1;
  if (typeof align === "object" && "length" in align) {
    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = toAlignment(align[columnIndex]);
    }
  } else {
    const code2 = toAlignment(align);
    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = code2;
    }
  }
  columnIndex = -1;
  const row = [];
  const sizes = [];
  while (++columnIndex < mostCellsPerRow) {
    const code2 = alignments[columnIndex];
    let before = "";
    let after = "";
    if (code2 === 99) {
      before = ":";
      after = ":";
    } else if (code2 === 108) {
      before = ":";
    } else if (code2 === 114) {
      after = ":";
    }
    let size = settings.alignDelimiters === false ? 1 : Math.max(
      1,
      longestCellByColumn[columnIndex] - before.length - after.length
    );
    const cell = before + "-".repeat(size) + after;
    if (settings.alignDelimiters !== false) {
      size = before.length + size + after.length;
      if (size > longestCellByColumn[columnIndex]) {
        longestCellByColumn[columnIndex] = size;
      }
      sizes[columnIndex] = size;
    }
    row[columnIndex] = cell;
  }
  cellMatrix.splice(1, 0, row);
  sizeMatrix.splice(1, 0, sizes);
  rowIndex = -1;
  const lines = [];
  while (++rowIndex < cellMatrix.length) {
    const row2 = cellMatrix[rowIndex];
    const sizes2 = sizeMatrix[rowIndex];
    columnIndex = -1;
    const line = [];
    while (++columnIndex < mostCellsPerRow) {
      const cell = row2[columnIndex] || "";
      let before = "";
      let after = "";
      if (settings.alignDelimiters !== false) {
        const size = longestCellByColumn[columnIndex] - (sizes2[columnIndex] || 0);
        const code2 = alignments[columnIndex];
        if (code2 === 114) {
          before = " ".repeat(size);
        } else if (code2 === 99) {
          if (size % 2) {
            before = " ".repeat(size / 2 + 0.5);
            after = " ".repeat(size / 2 - 0.5);
          } else {
            before = " ".repeat(size / 2);
            after = before;
          }
        } else {
          after = " ".repeat(size);
        }
      }
      if (settings.delimiterStart !== false && !columnIndex) {
        line.push("|");
      }
      if (settings.padding !== false && // Don’t add the opening space if we’re not aligning and the cell is
      // empty: there will be a closing space.
      !(settings.alignDelimiters === false && cell === "") && (settings.delimiterStart !== false || columnIndex)) {
        line.push(" ");
      }
      if (settings.alignDelimiters !== false) {
        line.push(before);
      }
      line.push(cell);
      if (settings.alignDelimiters !== false) {
        line.push(after);
      }
      if (settings.padding !== false) {
        line.push(" ");
      }
      if (settings.delimiterEnd !== false || columnIndex !== mostCellsPerRow - 1) {
        line.push("|");
      }
    }
    lines.push(
      settings.delimiterEnd === false ? line.join("").replace(/ +$/, "") : line.join("")
    );
  }
  return lines.join("\n");
}
function serialize(value) {
  return value === null || value === void 0 ? "" : String(value);
}
function toAlignment(value) {
  const code2 = typeof value === "string" ? value.codePointAt(0) : 0;
  return code2 === 67 || code2 === 99 ? 99 : code2 === 76 || code2 === 108 ? 108 : code2 === 82 || code2 === 114 ? 114 : 0;
}
function blockquote(node2, _, state, info) {
  const exit2 = state.enter("blockquote");
  const tracker = state.createTracker(info);
  tracker.move("> ");
  tracker.shift(2);
  const value = state.indentLines(
    state.containerFlow(node2, tracker.current()),
    map$1
  );
  exit2();
  return value;
}
function map$1(line, _, blank) {
  return ">" + (blank ? "" : " ") + line;
}
function patternInScope(stack, pattern) {
  return listInScope(stack, pattern.inConstruct, true) && !listInScope(stack, pattern.notInConstruct, false);
}
function listInScope(stack, list2, none2) {
  if (typeof list2 === "string") {
    list2 = [list2];
  }
  if (!list2 || list2.length === 0) {
    return none2;
  }
  let index2 = -1;
  while (++index2 < list2.length) {
    if (stack.includes(list2[index2])) {
      return true;
    }
  }
  return false;
}
function hardBreak(_, _1, state, info) {
  let index2 = -1;
  while (++index2 < state.unsafe.length) {
    if (state.unsafe[index2].character === "\n" && patternInScope(state.stack, state.unsafe[index2])) {
      return /[ \t]/.test(info.before) ? "" : " ";
    }
  }
  return "\\\n";
}
function longestStreak(value, substring) {
  const source = String(value);
  let index2 = source.indexOf(substring);
  let expected = index2;
  let count = 0;
  let max = 0;
  if (typeof substring !== "string") {
    throw new TypeError("Expected substring");
  }
  while (index2 !== -1) {
    if (index2 === expected) {
      if (++count > max) {
        max = count;
      }
    } else {
      count = 1;
    }
    expected = index2 + substring.length;
    index2 = source.indexOf(substring, expected);
  }
  return max;
}
function formatCodeAsIndented(node2, state) {
  return Boolean(
    state.options.fences === false && node2.value && // If there’s no info…
    !node2.lang && // And there’s a non-whitespace character…
    /[^ \r\n]/.test(node2.value) && // And the value doesn’t start or end in a blank…
    !/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(node2.value)
  );
}
function checkFence(state) {
  const marker = state.options.fence || "`";
  if (marker !== "`" && marker !== "~") {
    throw new Error(
      "Cannot serialize code with `" + marker + "` for `options.fence`, expected `` ` `` or `~`"
    );
  }
  return marker;
}
function code$1(node2, _, state, info) {
  const marker = checkFence(state);
  const raw = node2.value || "";
  const suffix = marker === "`" ? "GraveAccent" : "Tilde";
  if (formatCodeAsIndented(node2, state)) {
    const exit3 = state.enter("codeIndented");
    const value2 = state.indentLines(raw, map);
    exit3();
    return value2;
  }
  const tracker = state.createTracker(info);
  const sequence = marker.repeat(Math.max(longestStreak(raw, marker) + 1, 3));
  const exit2 = state.enter("codeFenced");
  let value = tracker.move(sequence);
  if (node2.lang) {
    const subexit = state.enter(`codeFencedLang${suffix}`);
    value += tracker.move(
      state.safe(node2.lang, {
        before: value,
        after: " ",
        encode: ["`"],
        ...tracker.current()
      })
    );
    subexit();
  }
  if (node2.lang && node2.meta) {
    const subexit = state.enter(`codeFencedMeta${suffix}`);
    value += tracker.move(" ");
    value += tracker.move(
      state.safe(node2.meta, {
        before: value,
        after: "\n",
        encode: ["`"],
        ...tracker.current()
      })
    );
    subexit();
  }
  value += tracker.move("\n");
  if (raw) {
    value += tracker.move(raw + "\n");
  }
  value += tracker.move(sequence);
  exit2();
  return value;
}
function map(line, _, blank) {
  return (blank ? "" : "    ") + line;
}
function checkQuote(state) {
  const marker = state.options.quote || '"';
  if (marker !== '"' && marker !== "'") {
    throw new Error(
      "Cannot serialize title with `" + marker + "` for `options.quote`, expected `\"`, or `'`"
    );
  }
  return marker;
}
function definition(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const exit2 = state.enter("definition");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("[");
  value += tracker.move(
    state.safe(state.associationId(node2), {
      before: value,
      after: "]",
      ...tracker.current()
    })
  );
  value += tracker.move("]: ");
  subexit();
  if (
    // If there’s no url, or…
    !node2.url || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : "\n",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  exit2();
  return value;
}
function checkEmphasis(state) {
  const marker = state.options.emphasis || "*";
  if (marker !== "*" && marker !== "_") {
    throw new Error(
      "Cannot serialize emphasis with `" + marker + "` for `options.emphasis`, expected `*`, or `_`"
    );
  }
  return marker;
}
function encodeCharacterReference(code2) {
  return "&#x" + code2.toString(16).toUpperCase() + ";";
}
function encodeInfo(outside, inside, marker) {
  const outsideKind = classifyCharacter(outside);
  const insideKind = classifyCharacter(inside);
  if (outsideKind === void 0) {
    return insideKind === void 0 ? (
      // Letter inside:
      // we have to encode *both* letters for `_` as it is looser.
      // it already forms for `*` (and GFMs `~`).
      marker === "_" ? { inside: true, outside: true } : { inside: false, outside: false }
    ) : insideKind === 1 ? (
      // Whitespace inside: encode both (letter, whitespace).
      { inside: true, outside: true }
    ) : (
      // Punctuation inside: encode outer (letter)
      { inside: false, outside: true }
    );
  }
  if (outsideKind === 1) {
    return insideKind === void 0 ? (
      // Letter inside: already forms.
      { inside: false, outside: false }
    ) : insideKind === 1 ? (
      // Whitespace inside: encode both (whitespace).
      { inside: true, outside: true }
    ) : (
      // Punctuation inside: already forms.
      { inside: false, outside: false }
    );
  }
  return insideKind === void 0 ? (
    // Letter inside: already forms.
    { inside: false, outside: false }
  ) : insideKind === 1 ? (
    // Whitespace inside: encode inner (whitespace).
    { inside: true, outside: false }
  ) : (
    // Punctuation inside: already forms.
    { inside: false, outside: false }
  );
}
emphasis.peek = emphasisPeek;
function emphasis(node2, _, state, info) {
  const marker = checkEmphasis(state);
  const exit2 = state.enter("emphasis");
  const tracker = state.createTracker(info);
  const before = tracker.move(marker);
  let between = tracker.move(
    state.containerPhrasing(node2, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );
  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }
  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }
  const after = tracker.move(marker);
  exit2();
  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after;
}
function emphasisPeek(_, _1, state) {
  return state.options.emphasis || "*";
}
function formatHeadingAsSetext(node2, state) {
  let literalWithBreak = false;
  visit(node2, function(node3) {
    if ("value" in node3 && /\r?\n|\r/.test(node3.value) || node3.type === "break") {
      literalWithBreak = true;
      return EXIT;
    }
  });
  return Boolean(
    (!node2.depth || node2.depth < 3) && toString$1(node2) && (state.options.setext || literalWithBreak)
  );
}
function heading(node2, _, state, info) {
  const rank = Math.max(Math.min(6, node2.depth || 1), 1);
  const tracker = state.createTracker(info);
  if (formatHeadingAsSetext(node2, state)) {
    const exit3 = state.enter("headingSetext");
    const subexit2 = state.enter("phrasing");
    const value2 = state.containerPhrasing(node2, {
      ...tracker.current(),
      before: "\n",
      after: "\n"
    });
    subexit2();
    exit3();
    return value2 + "\n" + (rank === 1 ? "=" : "-").repeat(
      // The whole size…
      value2.length - // Minus the position of the character after the last EOL (or
      // 0 if there is none)…
      (Math.max(value2.lastIndexOf("\r"), value2.lastIndexOf("\n")) + 1)
    );
  }
  const sequence = "#".repeat(rank);
  const exit2 = state.enter("headingAtx");
  const subexit = state.enter("phrasing");
  tracker.move(sequence + " ");
  let value = state.containerPhrasing(node2, {
    before: "# ",
    after: "\n",
    ...tracker.current()
  });
  if (/^[\t ]/.test(value)) {
    value = encodeCharacterReference(value.charCodeAt(0)) + value.slice(1);
  }
  value = value ? sequence + " " + value : sequence;
  if (state.options.closeAtx) {
    value += " " + sequence;
  }
  subexit();
  exit2();
  return value;
}
html.peek = htmlPeek;
function html(node2) {
  return node2.value || "";
}
function htmlPeek() {
  return "<";
}
image.peek = imagePeek;
function image(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const exit2 = state.enter("image");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("![");
  value += tracker.move(
    state.safe(node2.alt, { before: value, after: "]", ...tracker.current() })
  );
  value += tracker.move("](");
  subexit();
  if (
    // If there’s no url but there is a title…
    !node2.url && node2.title || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : ")",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  value += tracker.move(")");
  exit2();
  return value;
}
function imagePeek() {
  return "!";
}
imageReference.peek = imageReferencePeek;
function imageReference(node2, _, state, info) {
  const type = node2.referenceType;
  const exit2 = state.enter("imageReference");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("![");
  const alt = state.safe(node2.alt, {
    before: value,
    after: "]",
    ...tracker.current()
  });
  value += tracker.move(alt + "][");
  subexit();
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter("reference");
  const reference = state.safe(state.associationId(node2), {
    before: value,
    after: "]",
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit2();
  if (type === "full" || !alt || alt !== reference) {
    value += tracker.move(reference + "]");
  } else if (type === "shortcut") {
    value = value.slice(0, -1);
  } else {
    value += tracker.move("]");
  }
  return value;
}
function imageReferencePeek() {
  return "!";
}
inlineCode.peek = inlineCodePeek;
function inlineCode(node2, _, state) {
  let value = node2.value || "";
  let sequence = "`";
  let index2 = -1;
  while (new RegExp("(^|[^`])" + sequence + "([^`]|$)").test(value)) {
    sequence += "`";
  }
  if (/[^ \r\n]/.test(value) && (/^[ \r\n]/.test(value) && /[ \r\n]$/.test(value) || /^`|`$/.test(value))) {
    value = " " + value + " ";
  }
  while (++index2 < state.unsafe.length) {
    const pattern = state.unsafe[index2];
    const expression = state.compilePattern(pattern);
    let match;
    if (!pattern.atBreak) continue;
    while (match = expression.exec(value)) {
      let position2 = match.index;
      if (value.charCodeAt(position2) === 10 && value.charCodeAt(position2 - 1) === 13) {
        position2--;
      }
      value = value.slice(0, position2) + " " + value.slice(match.index + 1);
    }
  }
  return sequence + value + sequence;
}
function inlineCodePeek() {
  return "`";
}
function formatLinkAsAutolink(node2, state) {
  const raw = toString$1(node2);
  return Boolean(
    !state.options.resourceLink && // If there’s a url…
    node2.url && // And there’s a no title…
    !node2.title && // And the content of `node` is a single text node…
    node2.children && node2.children.length === 1 && node2.children[0].type === "text" && // And if the url is the same as the content…
    (raw === node2.url || "mailto:" + raw === node2.url) && // And that starts w/ a protocol…
    /^[a-z][a-z+.-]+:/i.test(node2.url) && // And that doesn’t contain ASCII control codes (character escapes and
    // references don’t work), space, or angle brackets…
    !/[\0- <>\u007F]/.test(node2.url)
  );
}
link.peek = linkPeek;
function link(node2, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? "Quote" : "Apostrophe";
  const tracker = state.createTracker(info);
  let exit2;
  let subexit;
  if (formatLinkAsAutolink(node2, state)) {
    const stack = state.stack;
    state.stack = [];
    exit2 = state.enter("autolink");
    let value2 = tracker.move("<");
    value2 += tracker.move(
      state.containerPhrasing(node2, {
        before: value2,
        after: ">",
        ...tracker.current()
      })
    );
    value2 += tracker.move(">");
    exit2();
    state.stack = stack;
    return value2;
  }
  exit2 = state.enter("link");
  subexit = state.enter("label");
  let value = tracker.move("[");
  value += tracker.move(
    state.containerPhrasing(node2, {
      before: value,
      after: "](",
      ...tracker.current()
    })
  );
  value += tracker.move("](");
  subexit();
  if (
    // If there’s no url but there is a title…
    !node2.url && node2.title || // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node2.url)
  ) {
    subexit = state.enter("destinationLiteral");
    value += tracker.move("<");
    value += tracker.move(
      state.safe(node2.url, { before: value, after: ">", ...tracker.current() })
    );
    value += tracker.move(">");
  } else {
    subexit = state.enter("destinationRaw");
    value += tracker.move(
      state.safe(node2.url, {
        before: value,
        after: node2.title ? " " : ")",
        ...tracker.current()
      })
    );
  }
  subexit();
  if (node2.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(" " + quote);
    value += tracker.move(
      state.safe(node2.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }
  value += tracker.move(")");
  exit2();
  return value;
}
function linkPeek(node2, _, state) {
  return formatLinkAsAutolink(node2, state) ? "<" : "[";
}
linkReference.peek = linkReferencePeek;
function linkReference(node2, _, state, info) {
  const type = node2.referenceType;
  const exit2 = state.enter("linkReference");
  let subexit = state.enter("label");
  const tracker = state.createTracker(info);
  let value = tracker.move("[");
  const text2 = state.containerPhrasing(node2, {
    before: value,
    after: "]",
    ...tracker.current()
  });
  value += tracker.move(text2 + "][");
  subexit();
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter("reference");
  const reference = state.safe(state.associationId(node2), {
    before: value,
    after: "]",
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit2();
  if (type === "full" || !text2 || text2 !== reference) {
    value += tracker.move(reference + "]");
  } else if (type === "shortcut") {
    value = value.slice(0, -1);
  } else {
    value += tracker.move("]");
  }
  return value;
}
function linkReferencePeek() {
  return "[";
}
function checkBullet(state) {
  const marker = state.options.bullet || "*";
  if (marker !== "*" && marker !== "+" && marker !== "-") {
    throw new Error(
      "Cannot serialize items with `" + marker + "` for `options.bullet`, expected `*`, `+`, or `-`"
    );
  }
  return marker;
}
function checkBulletOther(state) {
  const bullet = checkBullet(state);
  const bulletOther = state.options.bulletOther;
  if (!bulletOther) {
    return bullet === "*" ? "-" : "*";
  }
  if (bulletOther !== "*" && bulletOther !== "+" && bulletOther !== "-") {
    throw new Error(
      "Cannot serialize items with `" + bulletOther + "` for `options.bulletOther`, expected `*`, `+`, or `-`"
    );
  }
  if (bulletOther === bullet) {
    throw new Error(
      "Expected `bullet` (`" + bullet + "`) and `bulletOther` (`" + bulletOther + "`) to be different"
    );
  }
  return bulletOther;
}
function checkBulletOrdered(state) {
  const marker = state.options.bulletOrdered || ".";
  if (marker !== "." && marker !== ")") {
    throw new Error(
      "Cannot serialize items with `" + marker + "` for `options.bulletOrdered`, expected `.` or `)`"
    );
  }
  return marker;
}
function checkRule(state) {
  const marker = state.options.rule || "*";
  if (marker !== "*" && marker !== "-" && marker !== "_") {
    throw new Error(
      "Cannot serialize rules with `" + marker + "` for `options.rule`, expected `*`, `-`, or `_`"
    );
  }
  return marker;
}
function list(node2, parent, state, info) {
  const exit2 = state.enter("list");
  const bulletCurrent = state.bulletCurrent;
  let bullet = node2.ordered ? checkBulletOrdered(state) : checkBullet(state);
  const bulletOther = node2.ordered ? bullet === "." ? ")" : "." : checkBulletOther(state);
  let useDifferentMarker = parent && state.bulletLastUsed ? bullet === state.bulletLastUsed : false;
  if (!node2.ordered) {
    const firstListItem = node2.children ? node2.children[0] : void 0;
    if (
      // Bullet could be used as a thematic break marker:
      (bullet === "*" || bullet === "-") && // Empty first list item:
      firstListItem && (!firstListItem.children || !firstListItem.children[0]) && // Directly in two other list items:
      state.stack[state.stack.length - 1] === "list" && state.stack[state.stack.length - 2] === "listItem" && state.stack[state.stack.length - 3] === "list" && state.stack[state.stack.length - 4] === "listItem" && // That are each the first child.
      state.indexStack[state.indexStack.length - 1] === 0 && state.indexStack[state.indexStack.length - 2] === 0 && state.indexStack[state.indexStack.length - 3] === 0
    ) {
      useDifferentMarker = true;
    }
    if (checkRule(state) === bullet && firstListItem) {
      let index2 = -1;
      while (++index2 < node2.children.length) {
        const item = node2.children[index2];
        if (item && item.type === "listItem" && item.children && item.children[0] && item.children[0].type === "thematicBreak") {
          useDifferentMarker = true;
          break;
        }
      }
    }
  }
  if (useDifferentMarker) {
    bullet = bulletOther;
  }
  state.bulletCurrent = bullet;
  const value = state.containerFlow(node2, info);
  state.bulletLastUsed = bullet;
  state.bulletCurrent = bulletCurrent;
  exit2();
  return value;
}
function checkListItemIndent(state) {
  const style2 = state.options.listItemIndent || "one";
  if (style2 !== "tab" && style2 !== "one" && style2 !== "mixed") {
    throw new Error(
      "Cannot serialize items with `" + style2 + "` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`"
    );
  }
  return style2;
}
function listItem(node2, parent, state, info) {
  const listItemIndent = checkListItemIndent(state);
  let bullet = state.bulletCurrent || checkBullet(state);
  if (parent && parent.type === "list" && parent.ordered) {
    bullet = (typeof parent.start === "number" && parent.start > -1 ? parent.start : 1) + (state.options.incrementListMarker === false ? 0 : parent.children.indexOf(node2)) + bullet;
  }
  let size = bullet.length + 1;
  if (listItemIndent === "tab" || listItemIndent === "mixed" && (parent && parent.type === "list" && parent.spread || node2.spread)) {
    size = Math.ceil(size / 4) * 4;
  }
  const tracker = state.createTracker(info);
  tracker.move(bullet + " ".repeat(size - bullet.length));
  tracker.shift(size);
  const exit2 = state.enter("listItem");
  const value = state.indentLines(
    state.containerFlow(node2, tracker.current()),
    map2
  );
  exit2();
  return value;
  function map2(line, index2, blank) {
    if (index2) {
      return (blank ? "" : " ".repeat(size)) + line;
    }
    return (blank ? bullet : bullet + " ".repeat(size - bullet.length)) + line;
  }
}
function paragraph(node2, _, state, info) {
  const exit2 = state.enter("paragraph");
  const subexit = state.enter("phrasing");
  const value = state.containerPhrasing(node2, info);
  subexit();
  exit2();
  return value;
}
const phrasing = (
  /** @type {(node?: unknown) => node is Exclude<PhrasingContent, Html>} */
  convert([
    "break",
    "delete",
    "emphasis",
    // To do: next major: removed since footnotes were added to GFM.
    "footnote",
    "footnoteReference",
    "image",
    "imageReference",
    "inlineCode",
    // Enabled by `mdast-util-math`:
    "inlineMath",
    "link",
    "linkReference",
    // Enabled by `mdast-util-mdx`:
    "mdxJsxTextElement",
    // Enabled by `mdast-util-mdx`:
    "mdxTextExpression",
    "strong",
    "text",
    // Enabled by `mdast-util-directive`:
    "textDirective"
  ])
);
function root(node2, _, state, info) {
  const hasPhrasing = node2.children.some(function(d) {
    return phrasing(d);
  });
  const container = hasPhrasing ? state.containerPhrasing : state.containerFlow;
  return container.call(state, node2, info);
}
function checkStrong(state) {
  const marker = state.options.strong || "*";
  if (marker !== "*" && marker !== "_") {
    throw new Error(
      "Cannot serialize strong with `" + marker + "` for `options.strong`, expected `*`, or `_`"
    );
  }
  return marker;
}
strong.peek = strongPeek;
function strong(node2, _, state, info) {
  const marker = checkStrong(state);
  const exit2 = state.enter("strong");
  const tracker = state.createTracker(info);
  const before = tracker.move(marker + marker);
  let between = tracker.move(
    state.containerPhrasing(node2, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );
  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }
  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);
  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }
  const after = tracker.move(marker + marker);
  exit2();
  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after;
}
function strongPeek(_, _1, state) {
  return state.options.strong || "*";
}
function text$1(node2, _, state, info) {
  return state.safe(node2.value, info);
}
function checkRuleRepetition(state) {
  const repetition = state.options.ruleRepetition || 3;
  if (repetition < 3) {
    throw new Error(
      "Cannot serialize rules with repetition `" + repetition + "` for `options.ruleRepetition`, expected `3` or more"
    );
  }
  return repetition;
}
function thematicBreak(_, _1, state) {
  const value = (checkRule(state) + (state.options.ruleSpaces ? " " : "")).repeat(checkRuleRepetition(state));
  return state.options.ruleSpaces ? value.slice(0, -1) : value;
}
const handle = {
  blockquote,
  break: hardBreak,
  code: code$1,
  definition,
  emphasis,
  hardBreak,
  heading,
  html,
  image,
  imageReference,
  inlineCode,
  link,
  linkReference,
  list,
  listItem,
  paragraph,
  root,
  strong,
  text: text$1,
  thematicBreak
};
function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit,
      tableHeader: exit,
      tableRow: exit
    }
  };
}
function enterTable(token) {
  const align = token._align;
  this.enter(
    {
      type: "table",
      align: align.map(function(d) {
        return d === "none" ? null : d;
      }),
      children: []
    },
    token
  );
  this.data.inTable = true;
}
function exitTable(token) {
  this.exit(token);
  this.data.inTable = void 0;
}
function enterRow(token) {
  this.enter({ type: "tableRow", children: [] }, token);
}
function exit(token) {
  this.exit(token);
}
function enterCell(token) {
  this.enter({ type: "tableCell", children: [] }, token);
}
function exitCodeText(token) {
  let value = this.resume();
  if (this.data.inTable) {
    value = value.replace(/\\([\\|])/g, replace);
  }
  const node2 = this.stack[this.stack.length - 1];
  ok$1(node2.type === "inlineCode");
  node2.value = value;
  this.exit(token);
}
function replace($0, $1) {
  return $1 === "|" ? $1 : $0;
}
function gfmTableToMarkdown(options) {
  const settings = options || {};
  const padding = settings.tableCellPadding;
  const alignDelimiters = settings.tablePipeAlign;
  const stringLength = settings.stringLength;
  const around = padding ? " " : "|";
  return {
    unsafe: [
      { character: "\r", inConstruct: "tableCell" },
      { character: "\n", inConstruct: "tableCell" },
      // A pipe, when followed by a tab or space (padding), or a dash or colon
      // (unpadded delimiter row), could result in a table.
      { atBreak: true, character: "|", after: "[	 :-]" },
      // A pipe in a cell must be encoded.
      { character: "|", inConstruct: "tableCell" },
      // A colon must be followed by a dash, in which case it could start a
      // delimiter row.
      { atBreak: true, character: ":", after: "-" },
      // A delimiter row can also start with a dash, when followed by more
      // dashes, a colon, or a pipe.
      // This is a stricter version than the built in check for lists, thematic
      // breaks, and setex heading underlines though:
      // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/51a2038/lib/unsafe.js#L57>
      { atBreak: true, character: "-", after: "[:|-]" }
    ],
    handlers: {
      inlineCode: inlineCodeWithTable,
      table: handleTable,
      tableCell: handleTableCell,
      tableRow: handleTableRow
    }
  };
  function handleTable(node2, _, state, info) {
    return serializeData(handleTableAsData(node2, state, info), node2.align);
  }
  function handleTableRow(node2, _, state, info) {
    const row = handleTableRowAsData(node2, state, info);
    const value = serializeData([row]);
    return value.slice(0, value.indexOf("\n"));
  }
  function handleTableCell(node2, _, state, info) {
    const exit2 = state.enter("tableCell");
    const subexit = state.enter("phrasing");
    const value = state.containerPhrasing(node2, {
      ...info,
      before: around,
      after: around
    });
    subexit();
    exit2();
    return value;
  }
  function serializeData(matrix, align) {
    return markdownTable(matrix, {
      align,
      // @ts-expect-error: `markdown-table` types should support `null`.
      alignDelimiters,
      // @ts-expect-error: `markdown-table` types should support `null`.
      padding,
      // @ts-expect-error: `markdown-table` types should support `null`.
      stringLength
    });
  }
  function handleTableAsData(node2, state, info) {
    const children2 = node2.children;
    let index2 = -1;
    const result = [];
    const subexit = state.enter("table");
    while (++index2 < children2.length) {
      result[index2] = handleTableRowAsData(children2[index2], state, info);
    }
    subexit();
    return result;
  }
  function handleTableRowAsData(node2, state, info) {
    const children2 = node2.children;
    let index2 = -1;
    const result = [];
    const subexit = state.enter("tableRow");
    while (++index2 < children2.length) {
      result[index2] = handleTableCell(children2[index2], node2, state, info);
    }
    subexit();
    return result;
  }
  function inlineCodeWithTable(node2, parent, state) {
    let value = handle.inlineCode(node2, parent, state);
    if (state.stack.includes("tableCell")) {
      value = value.replace(/\|/g, "\\$&");
    }
    return value;
  }
}
function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  };
}
function gfmTaskListItemToMarkdown() {
  return {
    unsafe: [{ atBreak: true, character: "-", after: "[:|-]" }],
    handlers: { listItem: listItemWithTaskListItem }
  };
}
function exitCheck(token) {
  const node2 = this.stack[this.stack.length - 2];
  ok$1(node2.type === "listItem");
  node2.checked = token.type === "taskListCheckValueChecked";
}
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2];
  if (parent && parent.type === "listItem" && typeof parent.checked === "boolean") {
    const node2 = this.stack[this.stack.length - 1];
    ok$1(node2.type === "paragraph");
    const head = node2.children[0];
    if (head && head.type === "text") {
      const siblings = parent.children;
      let index2 = -1;
      let firstParaghraph;
      while (++index2 < siblings.length) {
        const sibling = siblings[index2];
        if (sibling.type === "paragraph") {
          firstParaghraph = sibling;
          break;
        }
      }
      if (firstParaghraph === node2) {
        head.value = head.value.slice(1);
        if (head.value.length === 0) {
          node2.children.shift();
        } else if (node2.position && head.position && typeof head.position.start.offset === "number") {
          head.position.start.column++;
          head.position.start.offset++;
          node2.position.start = Object.assign({}, head.position.start);
        }
      }
    }
  }
  this.exit(token);
}
function listItemWithTaskListItem(node2, parent, state, info) {
  const head = node2.children[0];
  const checkable = typeof node2.checked === "boolean" && head && head.type === "paragraph";
  const checkbox = "[" + (node2.checked ? "x" : " ") + "] ";
  const tracker = state.createTracker(info);
  if (checkable) {
    tracker.move(checkbox);
  }
  let value = handle.listItem(node2, parent, state, {
    ...info,
    ...tracker.current()
  });
  if (checkable) {
    value = value.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, check);
  }
  return value;
  function check($0) {
    return $0 + checkbox;
  }
}
function gfmFromMarkdown() {
  return [
    gfmAutolinkLiteralFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown()
  ];
}
function gfmToMarkdown(options) {
  return {
    extensions: [
      gfmAutolinkLiteralToMarkdown(),
      gfmFootnoteToMarkdown(options),
      gfmStrikethroughToMarkdown(),
      gfmTableToMarkdown(options),
      gfmTaskListItemToMarkdown()
    ]
  };
}
const wwwPrefix = {
  tokenize: tokenizeWwwPrefix,
  partial: true
};
const domain = {
  tokenize: tokenizeDomain,
  partial: true
};
const path = {
  tokenize: tokenizePath,
  partial: true
};
const trail = {
  tokenize: tokenizeTrail,
  partial: true
};
const emailDomainDotTrail = {
  tokenize: tokenizeEmailDomainDotTrail,
  partial: true
};
const wwwAutolink = {
  name: "wwwAutolink",
  tokenize: tokenizeWwwAutolink,
  previous: previousWww
};
const protocolAutolink = {
  name: "protocolAutolink",
  tokenize: tokenizeProtocolAutolink,
  previous: previousProtocol
};
const emailAutolink = {
  name: "emailAutolink",
  tokenize: tokenizeEmailAutolink,
  previous: previousEmail
};
const text = {};
function gfmAutolinkLiteral() {
  return {
    text
  };
}
let code = 48;
while (code < 123) {
  text[code] = emailAutolink;
  code++;
  if (code === 58) code = 65;
  else if (code === 91) code = 97;
}
text[43] = emailAutolink;
text[45] = emailAutolink;
text[46] = emailAutolink;
text[95] = emailAutolink;
text[72] = [emailAutolink, protocolAutolink];
text[104] = [emailAutolink, protocolAutolink];
text[87] = [emailAutolink, wwwAutolink];
text[119] = [emailAutolink, wwwAutolink];
function tokenizeEmailAutolink(effects, ok2, nok) {
  const self2 = this;
  let dot;
  let data;
  return start2;
  function start2(code2) {
    if (!gfmAtext(code2) || !previousEmail.call(self2, self2.previous) || previousUnbalanced(self2.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkEmail");
    return atext(code2);
  }
  function atext(code2) {
    if (gfmAtext(code2)) {
      effects.consume(code2);
      return atext;
    }
    if (code2 === 64) {
      effects.consume(code2);
      return emailDomain;
    }
    return nok(code2);
  }
  function emailDomain(code2) {
    if (code2 === 46) {
      return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code2);
    }
    if (code2 === 45 || code2 === 95 || asciiAlphanumeric(code2)) {
      data = true;
      effects.consume(code2);
      return emailDomain;
    }
    return emailDomainAfter(code2);
  }
  function emailDomainDot(code2) {
    effects.consume(code2);
    dot = true;
    return emailDomain;
  }
  function emailDomainAfter(code2) {
    if (data && dot && asciiAlpha(self2.previous)) {
      effects.exit("literalAutolinkEmail");
      effects.exit("literalAutolink");
      return ok2(code2);
    }
    return nok(code2);
  }
}
function tokenizeWwwAutolink(effects, ok2, nok) {
  const self2 = this;
  return wwwStart;
  function wwwStart(code2) {
    if (code2 !== 87 && code2 !== 119 || !previousWww.call(self2, self2.previous) || previousUnbalanced(self2.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkWww");
    return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code2);
  }
  function wwwAfter(code2) {
    effects.exit("literalAutolinkWww");
    effects.exit("literalAutolink");
    return ok2(code2);
  }
}
function tokenizeProtocolAutolink(effects, ok2, nok) {
  const self2 = this;
  let buffer = "";
  let seen = false;
  return protocolStart;
  function protocolStart(code2) {
    if ((code2 === 72 || code2 === 104) && previousProtocol.call(self2, self2.previous) && !previousUnbalanced(self2.events)) {
      effects.enter("literalAutolink");
      effects.enter("literalAutolinkHttp");
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    return nok(code2);
  }
  function protocolPrefixInside(code2) {
    if (asciiAlpha(code2) && buffer.length < 5) {
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    if (code2 === 58) {
      const protocol = buffer.toLowerCase();
      if (protocol === "http" || protocol === "https") {
        effects.consume(code2);
        return protocolSlashesInside;
      }
    }
    return nok(code2);
  }
  function protocolSlashesInside(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      if (seen) {
        return afterProtocol;
      }
      seen = true;
      return protocolSlashesInside;
    }
    return nok(code2);
  }
  function afterProtocol(code2) {
    return code2 === null || asciiControl(code2) || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || unicodePunctuation(code2) ? nok(code2) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code2);
  }
  function protocolAfter(code2) {
    effects.exit("literalAutolinkHttp");
    effects.exit("literalAutolink");
    return ok2(code2);
  }
}
function tokenizeWwwPrefix(effects, ok2, nok) {
  let size = 0;
  return wwwPrefixInside;
  function wwwPrefixInside(code2) {
    if ((code2 === 87 || code2 === 119) && size < 3) {
      size++;
      effects.consume(code2);
      return wwwPrefixInside;
    }
    if (code2 === 46 && size === 3) {
      effects.consume(code2);
      return wwwPrefixAfter;
    }
    return nok(code2);
  }
  function wwwPrefixAfter(code2) {
    return code2 === null ? nok(code2) : ok2(code2);
  }
}
function tokenizeDomain(effects, ok2, nok) {
  let underscoreInLastSegment;
  let underscoreInLastLastSegment;
  let seen;
  return domainInside;
  function domainInside(code2) {
    if (code2 === 46 || code2 === 95) {
      return effects.check(trail, domainAfter, domainAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || code2 !== 45 && unicodePunctuation(code2)) {
      return domainAfter(code2);
    }
    seen = true;
    effects.consume(code2);
    return domainInside;
  }
  function domainAtPunctuation(code2) {
    if (code2 === 95) {
      underscoreInLastSegment = true;
    } else {
      underscoreInLastLastSegment = underscoreInLastSegment;
      underscoreInLastSegment = void 0;
    }
    effects.consume(code2);
    return domainInside;
  }
  function domainAfter(code2) {
    if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) {
      return nok(code2);
    }
    return ok2(code2);
  }
}
function tokenizePath(effects, ok2) {
  let sizeOpen = 0;
  let sizeClose = 0;
  return pathInside;
  function pathInside(code2) {
    if (code2 === 40) {
      sizeOpen++;
      effects.consume(code2);
      return pathInside;
    }
    if (code2 === 41 && sizeClose < sizeOpen) {
      return pathAtPunctuation(code2);
    }
    if (code2 === 33 || code2 === 34 || code2 === 38 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 60 || code2 === 63 || code2 === 93 || code2 === 95 || code2 === 126) {
      return effects.check(trail, ok2, pathAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok2(code2);
    }
    effects.consume(code2);
    return pathInside;
  }
  function pathAtPunctuation(code2) {
    if (code2 === 41) {
      sizeClose++;
    }
    effects.consume(code2);
    return pathInside;
  }
}
function tokenizeTrail(effects, ok2, nok) {
  return trail2;
  function trail2(code2) {
    if (code2 === 33 || code2 === 34 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 63 || code2 === 95 || code2 === 126) {
      effects.consume(code2);
      return trail2;
    }
    if (code2 === 38) {
      effects.consume(code2);
      return trailCharacterReferenceStart;
    }
    if (code2 === 93) {
      effects.consume(code2);
      return trailBracketAfter;
    }
    if (
      // `<` is an end.
      code2 === 60 || // So is whitespace.
      code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)
    ) {
      return ok2(code2);
    }
    return nok(code2);
  }
  function trailBracketAfter(code2) {
    if (code2 === null || code2 === 40 || code2 === 91 || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok2(code2);
    }
    return trail2(code2);
  }
  function trailCharacterReferenceStart(code2) {
    return asciiAlpha(code2) ? trailCharacterReferenceInside(code2) : nok(code2);
  }
  function trailCharacterReferenceInside(code2) {
    if (code2 === 59) {
      effects.consume(code2);
      return trail2;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return trailCharacterReferenceInside;
    }
    return nok(code2);
  }
}
function tokenizeEmailDomainDotTrail(effects, ok2, nok) {
  return start2;
  function start2(code2) {
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    return asciiAlphanumeric(code2) ? nok(code2) : ok2(code2);
  }
}
function previousWww(code2) {
  return code2 === null || code2 === 40 || code2 === 42 || code2 === 95 || code2 === 91 || code2 === 93 || code2 === 126 || markdownLineEndingOrSpace(code2);
}
function previousProtocol(code2) {
  return !asciiAlpha(code2);
}
function previousEmail(code2) {
  return !(code2 === 47 || gfmAtext(code2));
}
function gfmAtext(code2) {
  return code2 === 43 || code2 === 45 || code2 === 46 || code2 === 95 || asciiAlphanumeric(code2);
}
function previousUnbalanced(events) {
  let index2 = events.length;
  let result = false;
  while (index2--) {
    const token = events[index2][1];
    if ((token.type === "labelLink" || token.type === "labelImage") && !token._balanced) {
      result = true;
      break;
    }
    if (token._gfmAutolinkLiteralWalkedInto) {
      result = false;
      break;
    }
  }
  if (events.length > 0 && !result) {
    events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
  }
  return result;
}
const indent = {
  tokenize: tokenizeIndent,
  partial: true
};
function gfmFootnote() {
  return {
    document: {
      [91]: {
        name: "gfmFootnoteDefinition",
        tokenize: tokenizeDefinitionStart,
        continuation: {
          tokenize: tokenizeDefinitionContinuation
        },
        exit: gfmFootnoteDefinitionEnd
      }
    },
    text: {
      [91]: {
        name: "gfmFootnoteCall",
        tokenize: tokenizeGfmFootnoteCall
      },
      [93]: {
        name: "gfmPotentialFootnoteCall",
        add: "after",
        tokenize: tokenizePotentialGfmFootnoteCall,
        resolveTo: resolveToPotentialGfmFootnoteCall
      }
    }
  };
}
function tokenizePotentialGfmFootnoteCall(effects, ok2, nok) {
  const self2 = this;
  let index2 = self2.events.length;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let labelStart;
  while (index2--) {
    const token = self2.events[index2][1];
    if (token.type === "labelImage") {
      labelStart = token;
      break;
    }
    if (token.type === "gfmFootnoteCall" || token.type === "labelLink" || token.type === "label" || token.type === "image" || token.type === "link") {
      break;
    }
  }
  return start2;
  function start2(code2) {
    if (!labelStart || !labelStart._balanced) {
      return nok(code2);
    }
    const id2 = normalizeIdentifier(self2.sliceSerialize({
      start: labelStart.end,
      end: self2.now()
    }));
    if (id2.codePointAt(0) !== 94 || !defined.includes(id2.slice(1))) {
      return nok(code2);
    }
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return ok2(code2);
  }
}
function resolveToPotentialGfmFootnoteCall(events, context) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][1].type === "labelImage" && events[index2][0] === "enter") {
      events[index2][1];
      break;
    }
  }
  events[index2 + 1][1].type = "data";
  events[index2 + 3][1].type = "gfmFootnoteCallLabelMarker";
  const call = {
    type: "gfmFootnoteCall",
    start: Object.assign({}, events[index2 + 3][1].start),
    end: Object.assign({}, events[events.length - 1][1].end)
  };
  const marker = {
    type: "gfmFootnoteCallMarker",
    start: Object.assign({}, events[index2 + 3][1].end),
    end: Object.assign({}, events[index2 + 3][1].end)
  };
  marker.end.column++;
  marker.end.offset++;
  marker.end._bufferIndex++;
  const string2 = {
    type: "gfmFootnoteCallString",
    start: Object.assign({}, marker.end),
    end: Object.assign({}, events[events.length - 1][1].start)
  };
  const chunk = {
    type: "chunkString",
    contentType: "string",
    start: Object.assign({}, string2.start),
    end: Object.assign({}, string2.end)
  };
  const replacement = [
    // Take the `labelImageMarker` (now `data`, the `!`)
    events[index2 + 1],
    events[index2 + 2],
    ["enter", call, context],
    // The `[`
    events[index2 + 3],
    events[index2 + 4],
    // The `^`.
    ["enter", marker, context],
    ["exit", marker, context],
    // Everything in between.
    ["enter", string2, context],
    ["enter", chunk, context],
    ["exit", chunk, context],
    ["exit", string2, context],
    // The ending (`]`, properly parsed and labelled).
    events[events.length - 2],
    events[events.length - 1],
    ["exit", call, context]
  ];
  events.splice(index2, events.length - index2 + 1, ...replacement);
  return events;
}
function tokenizeGfmFootnoteCall(effects, ok2, nok) {
  const self2 = this;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let size = 0;
  let data;
  return start2;
  function start2(code2) {
    effects.enter("gfmFootnoteCall");
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return callStart;
  }
  function callStart(code2) {
    if (code2 !== 94) return nok(code2);
    effects.enter("gfmFootnoteCallMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallMarker");
    effects.enter("gfmFootnoteCallString");
    effects.enter("chunkString").contentType = "string";
    return callData;
  }
  function callData(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteCallString");
      if (!defined.includes(normalizeIdentifier(self2.sliceSerialize(token)))) {
        return nok(code2);
      }
      effects.enter("gfmFootnoteCallLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteCallLabelMarker");
      effects.exit("gfmFootnoteCall");
      return ok2;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? callEscape : callData;
  }
  function callEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return callData;
    }
    return callData(code2);
  }
}
function tokenizeDefinitionStart(effects, ok2, nok) {
  const self2 = this;
  const defined = self2.parser.gfmFootnotes || (self2.parser.gfmFootnotes = []);
  let identifier;
  let size = 0;
  let data;
  return start2;
  function start2(code2) {
    effects.enter("gfmFootnoteDefinition")._container = true;
    effects.enter("gfmFootnoteDefinitionLabel");
    effects.enter("gfmFootnoteDefinitionLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteDefinitionLabelMarker");
    return labelAtMarker;
  }
  function labelAtMarker(code2) {
    if (code2 === 94) {
      effects.enter("gfmFootnoteDefinitionMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionMarker");
      effects.enter("gfmFootnoteDefinitionLabelString");
      effects.enter("chunkString").contentType = "string";
      return labelInside;
    }
    return nok(code2);
  }
  function labelInside(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteDefinitionLabelString");
      identifier = normalizeIdentifier(self2.sliceSerialize(token));
      effects.enter("gfmFootnoteDefinitionLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionLabelMarker");
      effects.exit("gfmFootnoteDefinitionLabel");
      return labelAfter;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
  function labelAfter(code2) {
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      if (!defined.includes(identifier)) {
        defined.push(identifier);
      }
      return factorySpace(effects, whitespaceAfter, "gfmFootnoteDefinitionWhitespace");
    }
    return nok(code2);
  }
  function whitespaceAfter(code2) {
    return ok2(code2);
  }
}
function tokenizeDefinitionContinuation(effects, ok2, nok) {
  return effects.check(blankLine, ok2, effects.attempt(indent, ok2, nok));
}
function gfmFootnoteDefinitionEnd(effects) {
  effects.exit("gfmFootnoteDefinition");
}
function tokenizeIndent(effects, ok2, nok) {
  const self2 = this;
  return factorySpace(effects, afterPrefix, "gfmFootnoteDefinitionIndent", 4 + 1);
  function afterPrefix(code2) {
    const tail = self2.events[self2.events.length - 1];
    return tail && tail[1].type === "gfmFootnoteDefinitionIndent" && tail[2].sliceSerialize(tail[1], true).length === 4 ? ok2(code2) : nok(code2);
  }
}
function gfmStrikethrough(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: "strikethrough",
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    text: {
      [126]: tokenizer
    },
    insideSpan: {
      null: [tokenizer]
    },
    attentionMarkers: {
      null: [126]
    }
  };
  function resolveAllStrikethrough(events, context) {
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][0] === "enter" && events[index2][1].type === "strikethroughSequenceTemporary" && events[index2][1]._close) {
        let open = index2;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && // If the sizes are the same:
          events[index2][1].end.offset - events[index2][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index2][1].type = "strikethroughSequence";
            events[open][1].type = "strikethroughSequence";
            const strikethrough2 = {
              type: "strikethrough",
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index2][1].end)
            };
            const text2 = {
              type: "strikethroughText",
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index2][1].start)
            };
            const nextEvents = [["enter", strikethrough2, context], ["enter", events[open][1], context], ["exit", events[open][1], context], ["enter", text2, context]];
            const insideSpan2 = context.parser.constructs.insideSpan.null;
            if (insideSpan2) {
              splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan2, events.slice(open + 1, index2), context));
            }
            splice(nextEvents, nextEvents.length, 0, [["exit", text2, context], ["enter", events[index2][1], context], ["exit", events[index2][1], context], ["exit", strikethrough2, context]]);
            splice(events, open - 1, index2 - open + 3, nextEvents);
            index2 = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "strikethroughSequenceTemporary") {
        events[index2][1].type = "data";
      }
    }
    return events;
  }
  function tokenizeStrikethrough(effects, ok2, nok) {
    const previous2 = this.previous;
    const events = this.events;
    let size = 0;
    return start2;
    function start2(code2) {
      if (previous2 === 126 && events[events.length - 1][1].type !== "characterEscape") {
        return nok(code2);
      }
      effects.enter("strikethroughSequenceTemporary");
      return more(code2);
    }
    function more(code2) {
      const before = classifyCharacter(previous2);
      if (code2 === 126) {
        if (size > 1) return nok(code2);
        effects.consume(code2);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code2);
      const token = effects.exit("strikethroughSequenceTemporary");
      const after = classifyCharacter(code2);
      token._open = !after || after === 2 && Boolean(before);
      token._close = !before || before === 2 && Boolean(after);
      return ok2(code2);
    }
  }
}
class EditMap {
  /**
   * Create a new edit map.
   */
  constructor() {
    this.map = [];
  }
  /**
   * Create an edit: a remove and/or add at a certain place.
   *
   * @param {number} index
   * @param {number} remove
   * @param {Array<Event>} add
   * @returns {undefined}
   */
  add(index2, remove2, add) {
    addImplementation(this, index2, remove2, add);
  }
  // To do: add this when moving to `micromark`.
  // /**
  //  * Create an edit: but insert `add` before existing additions.
  //  *
  //  * @param {number} index
  //  * @param {number} remove
  //  * @param {Array<Event>} add
  //  * @returns {undefined}
  //  */
  // addBefore(index, remove, add) {
  //   addImplementation(this, index, remove, add, true)
  // }
  /**
   * Done, change the events.
   *
   * @param {Array<Event>} events
   * @returns {undefined}
   */
  consume(events) {
    this.map.sort(function(a, b) {
      return a[0] - b[0];
    });
    if (this.map.length === 0) {
      return;
    }
    let index2 = this.map.length;
    const vecs = [];
    while (index2 > 0) {
      index2 -= 1;
      vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
      events.length = this.map[index2][0];
    }
    vecs.push(events.slice());
    events.length = 0;
    let slice = vecs.pop();
    while (slice) {
      for (const element2 of slice) {
        events.push(element2);
      }
      slice = vecs.pop();
    }
    this.map.length = 0;
  }
}
function addImplementation(editMap, at, remove2, add) {
  let index2 = 0;
  if (remove2 === 0 && add.length === 0) {
    return;
  }
  while (index2 < editMap.map.length) {
    if (editMap.map[index2][0] === at) {
      editMap.map[index2][1] += remove2;
      editMap.map[index2][2].push(...add);
      return;
    }
    index2 += 1;
  }
  editMap.map.push([at, remove2, add]);
}
function gfmTableAlign(events, index2) {
  let inDelimiterRow = false;
  const align = [];
  while (index2 < events.length) {
    const event = events[index2];
    if (inDelimiterRow) {
      if (event[0] === "enter") {
        if (event[1].type === "tableContent") {
          align.push(events[index2 + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
        }
      } else if (event[1].type === "tableContent") {
        if (events[index2 - 1][1].type === "tableDelimiterMarker") {
          const alignIndex = align.length - 1;
          align[alignIndex] = align[alignIndex] === "left" ? "center" : "right";
        }
      } else if (event[1].type === "tableDelimiterRow") {
        break;
      }
    } else if (event[0] === "enter" && event[1].type === "tableDelimiterRow") {
      inDelimiterRow = true;
    }
    index2 += 1;
  }
  return align;
}
function gfmTable() {
  return {
    flow: {
      null: {
        name: "table",
        tokenize: tokenizeTable,
        resolveAll: resolveTable
      }
    }
  };
}
function tokenizeTable(effects, ok2, nok) {
  const self2 = this;
  let size = 0;
  let sizeB = 0;
  let seen;
  return start2;
  function start2(code2) {
    let index2 = self2.events.length - 1;
    while (index2 > -1) {
      const type = self2.events[index2][1].type;
      if (type === "lineEnding" || // Note: markdown-rs uses `whitespace` instead of `linePrefix`
      type === "linePrefix") index2--;
      else break;
    }
    const tail = index2 > -1 ? self2.events[index2][1].type : null;
    const next = tail === "tableHead" || tail === "tableRow" ? bodyRowStart : headRowBefore;
    if (next === bodyRowStart && self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    return next(code2);
  }
  function headRowBefore(code2) {
    effects.enter("tableHead");
    effects.enter("tableRow");
    return headRowStart(code2);
  }
  function headRowStart(code2) {
    if (code2 === 124) {
      return headRowBreak(code2);
    }
    seen = true;
    sizeB += 1;
    return headRowBreak(code2);
  }
  function headRowBreak(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      if (sizeB > 1) {
        sizeB = 0;
        self2.interrupt = true;
        effects.exit("tableRow");
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        return headDelimiterStart;
      }
      return nok(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, headRowBreak, "whitespace")(code2);
    }
    sizeB += 1;
    if (seen) {
      seen = false;
      size += 1;
    }
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      seen = true;
      return headRowBreak;
    }
    effects.enter("data");
    return headRowData(code2);
  }
  function headRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return headRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? headRowEscape : headRowData;
  }
  function headRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return headRowData;
    }
    return headRowData(code2);
  }
  function headDelimiterStart(code2) {
    self2.interrupt = false;
    if (self2.parser.lazy[self2.now().line]) {
      return nok(code2);
    }
    effects.enter("tableDelimiterRow");
    seen = false;
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterBefore, "linePrefix", self2.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return headDelimiterBefore(code2);
  }
  function headDelimiterBefore(code2) {
    if (code2 === 45 || code2 === 58) {
      return headDelimiterValueBefore(code2);
    }
    if (code2 === 124) {
      seen = true;
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return headDelimiterCellBefore;
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterCellBefore(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterValueBefore, "whitespace")(code2);
    }
    return headDelimiterValueBefore(code2);
  }
  function headDelimiterValueBefore(code2) {
    if (code2 === 58) {
      sizeB += 1;
      seen = true;
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterLeftAlignmentAfter;
    }
    if (code2 === 45) {
      sizeB += 1;
      return headDelimiterLeftAlignmentAfter(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return headDelimiterCellAfter(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterLeftAlignmentAfter(code2) {
    if (code2 === 45) {
      effects.enter("tableDelimiterFiller");
      return headDelimiterFiller(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterFiller(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return headDelimiterFiller;
    }
    if (code2 === 58) {
      seen = true;
      effects.exit("tableDelimiterFiller");
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterRightAlignmentAfter;
    }
    effects.exit("tableDelimiterFiller");
    return headDelimiterRightAlignmentAfter(code2);
  }
  function headDelimiterRightAlignmentAfter(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterCellAfter, "whitespace")(code2);
    }
    return headDelimiterCellAfter(code2);
  }
  function headDelimiterCellAfter(code2) {
    if (code2 === 124) {
      return headDelimiterBefore(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      if (!seen || size !== sizeB) {
        return headDelimiterNok(code2);
      }
      effects.exit("tableDelimiterRow");
      effects.exit("tableHead");
      return ok2(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterNok(code2) {
    return nok(code2);
  }
  function bodyRowStart(code2) {
    effects.enter("tableRow");
    return bodyRowBreak(code2);
  }
  function bodyRowBreak(code2) {
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return bodyRowBreak;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("tableRow");
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, bodyRowBreak, "whitespace")(code2);
    }
    effects.enter("data");
    return bodyRowData(code2);
  }
  function bodyRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return bodyRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? bodyRowEscape : bodyRowData;
  }
  function bodyRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return bodyRowData;
    }
    return bodyRowData(code2);
  }
}
function resolveTable(events, context) {
  let index2 = -1;
  let inFirstCellAwaitingPipe = true;
  let rowKind = 0;
  let lastCell = [0, 0, 0, 0];
  let cell = [0, 0, 0, 0];
  let afterHeadAwaitingFirstBodyRow = false;
  let lastTableEnd = 0;
  let currentTable;
  let currentBody;
  let currentCell;
  const map2 = new EditMap();
  while (++index2 < events.length) {
    const event = events[index2];
    const token = event[1];
    if (event[0] === "enter") {
      if (token.type === "tableHead") {
        afterHeadAwaitingFirstBodyRow = false;
        if (lastTableEnd !== 0) {
          flushTableEnd(map2, context, lastTableEnd, currentTable, currentBody);
          currentBody = void 0;
          lastTableEnd = 0;
        }
        currentTable = {
          type: "table",
          start: Object.assign({}, token.start),
          // Note: correct end is set later.
          end: Object.assign({}, token.end)
        };
        map2.add(index2, 0, [["enter", currentTable, context]]);
      } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
        inFirstCellAwaitingPipe = true;
        currentCell = void 0;
        lastCell = [0, 0, 0, 0];
        cell = [0, index2 + 1, 0, 0];
        if (afterHeadAwaitingFirstBodyRow) {
          afterHeadAwaitingFirstBodyRow = false;
          currentBody = {
            type: "tableBody",
            start: Object.assign({}, token.start),
            // Note: correct end is set later.
            end: Object.assign({}, token.end)
          };
          map2.add(index2, 0, [["enter", currentBody, context]]);
        }
        rowKind = token.type === "tableDelimiterRow" ? 2 : currentBody ? 3 : 1;
      } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
        inFirstCellAwaitingPipe = false;
        if (cell[2] === 0) {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map2, context, lastCell, rowKind, void 0, currentCell);
            lastCell = [0, 0, 0, 0];
          }
          cell[2] = index2;
        }
      } else if (token.type === "tableCellDivider") {
        if (inFirstCellAwaitingPipe) {
          inFirstCellAwaitingPipe = false;
        } else {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map2, context, lastCell, rowKind, void 0, currentCell);
          }
          lastCell = cell;
          cell = [lastCell[1], index2, 0, 0];
        }
      }
    } else if (token.type === "tableHead") {
      afterHeadAwaitingFirstBodyRow = true;
      lastTableEnd = index2;
    } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
      lastTableEnd = index2;
      if (lastCell[1] !== 0) {
        cell[0] = cell[1];
        currentCell = flushCell(map2, context, lastCell, rowKind, index2, currentCell);
      } else if (cell[1] !== 0) {
        currentCell = flushCell(map2, context, cell, rowKind, index2, currentCell);
      }
      rowKind = 0;
    } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
      cell[3] = index2;
    }
  }
  if (lastTableEnd !== 0) {
    flushTableEnd(map2, context, lastTableEnd, currentTable, currentBody);
  }
  map2.consume(context.events);
  index2 = -1;
  while (++index2 < context.events.length) {
    const event = context.events[index2];
    if (event[0] === "enter" && event[1].type === "table") {
      event[1]._align = gfmTableAlign(context.events, index2);
    }
  }
  return events;
}
function flushCell(map2, context, range, rowKind, rowEnd, previousCell) {
  const groupName = rowKind === 1 ? "tableHeader" : rowKind === 2 ? "tableDelimiter" : "tableData";
  const valueName = "tableContent";
  if (range[0] !== 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
    map2.add(range[0], 0, [["exit", previousCell, context]]);
  }
  const now2 = getPoint(context.events, range[1]);
  previousCell = {
    type: groupName,
    start: Object.assign({}, now2),
    // Note: correct end is set later.
    end: Object.assign({}, now2)
  };
  map2.add(range[1], 0, [["enter", previousCell, context]]);
  if (range[2] !== 0) {
    const relatedStart = getPoint(context.events, range[2]);
    const relatedEnd = getPoint(context.events, range[3]);
    const valueToken = {
      type: valueName,
      start: Object.assign({}, relatedStart),
      end: Object.assign({}, relatedEnd)
    };
    map2.add(range[2], 0, [["enter", valueToken, context]]);
    if (rowKind !== 2) {
      const start2 = context.events[range[2]];
      const end = context.events[range[3]];
      start2[1].end = Object.assign({}, end[1].end);
      start2[1].type = "chunkText";
      start2[1].contentType = "text";
      if (range[3] > range[2] + 1) {
        const a = range[2] + 1;
        const b = range[3] - range[2] - 1;
        map2.add(a, b, []);
      }
    }
    map2.add(range[3] + 1, 0, [["exit", valueToken, context]]);
  }
  if (rowEnd !== void 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
    map2.add(rowEnd, 0, [["exit", previousCell, context]]);
    previousCell = void 0;
  }
  return previousCell;
}
function flushTableEnd(map2, context, index2, table2, tableBody) {
  const exits = [];
  const related = getPoint(context.events, index2);
  if (tableBody) {
    tableBody.end = Object.assign({}, related);
    exits.push(["exit", tableBody, context]);
  }
  table2.end = Object.assign({}, related);
  exits.push(["exit", table2, context]);
  map2.add(index2 + 1, 0, exits);
}
function getPoint(events, index2) {
  const event = events[index2];
  const side = event[0] === "enter" ? "start" : "end";
  return event[1][side];
}
const tasklistCheck = {
  name: "tasklistCheck",
  tokenize: tokenizeTasklistCheck
};
function gfmTaskListItem() {
  return {
    text: {
      [91]: tasklistCheck
    }
  };
}
function tokenizeTasklistCheck(effects, ok2, nok) {
  const self2 = this;
  return open;
  function open(code2) {
    if (
      // Exit if there’s stuff before.
      self2.previous !== null || // Exit if not in the first content that is the first child of a list
      // item.
      !self2._gfmTasklistFirstContentOfListItem
    ) {
      return nok(code2);
    }
    effects.enter("taskListCheck");
    effects.enter("taskListCheckMarker");
    effects.consume(code2);
    effects.exit("taskListCheckMarker");
    return inside;
  }
  function inside(code2) {
    if (markdownLineEndingOrSpace(code2)) {
      effects.enter("taskListCheckValueUnchecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueUnchecked");
      return close;
    }
    if (code2 === 88 || code2 === 120) {
      effects.enter("taskListCheckValueChecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueChecked");
      return close;
    }
    return nok(code2);
  }
  function close(code2) {
    if (code2 === 93) {
      effects.enter("taskListCheckMarker");
      effects.consume(code2);
      effects.exit("taskListCheckMarker");
      effects.exit("taskListCheck");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      return ok2(code2);
    }
    if (markdownSpace(code2)) {
      return effects.check({
        tokenize: spaceThenNonSpace
      }, ok2, nok)(code2);
    }
    return nok(code2);
  }
}
function spaceThenNonSpace(effects, ok2, nok) {
  return factorySpace(effects, after, "whitespace");
  function after(code2) {
    return code2 === null ? nok(code2) : ok2(code2);
  }
}
function gfm(options) {
  return combineExtensions([
    gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem()
  ]);
}
const emptyOptions = {};
function remarkGfm(options) {
  const self2 = (
    /** @type {Processor<Root>} */
    this
  );
  const settings = options || emptyOptions;
  const data = self2.data();
  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions = data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  micromarkExtensions.push(gfm(settings));
  fromMarkdownExtensions.push(gfmFromMarkdown());
  toMarkdownExtensions.push(gfmToMarkdown(settings));
}
const MARKDOWN_COMPONENTS = {
  p: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 whitespace-pre-wrap last:mb-0", children: children2 }),
  h1: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mb-3 mt-5 text-xl font-bold first:mt-0", children: children2 }),
  h2: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2.5 mt-5 text-lg font-bold first:mt-0", children: children2 }),
  h3: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 mt-4 text-base font-semibold first:mt-0", children: children2 }),
  ul: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mb-3 ml-5 list-disc space-y-1 last:mb-0", children: children2 }),
  ol: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mb-3 ml-5 list-decimal space-y-1 last:mb-0", children: children2 }),
  li: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "pl-1", children: children2 }),
  strong: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "font-semibold text-foreground", children: children2 }),
  blockquote: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("blockquote", { className: "my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground", children: children2 }),
  a: ({ children: children2, href }) => /* @__PURE__ */ jsxRuntimeExports.jsx("a", { className: "text-primary underline underline-offset-2 hover:opacity-80", href, target: "_blank", rel: "noreferrer", children: children2 }),
  code: ({ children: children2, className }) => {
    return className ? /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: cn(className, "font-mono text-xs"), children: children2 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]", children: children2 });
  },
  pre: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "my-3 max-w-full overflow-x-auto rounded-xl bg-muted p-3 leading-5", children: children2 }),
  table: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-3 max-w-full overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full border-collapse text-left text-xs", children: children2 }) }),
  th: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border border-border bg-muted px-3 py-2 font-semibold", children: children2 }),
  td: ({ children: children2 }) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "border border-border px-3 py-2 align-top", children: children2 }),
  hr: () => /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "my-4 border-border" })
};
const REMARK_PLUGINS = [remarkGfm];
const NO_PLUGINS = [];
const MAX_GFM_PARAGRAPH = 16 * 1024;
const PARAGRAPH_BREAK = /\r?\n[ \t]*\r?\n/;
function gfmIsAffordable(content2) {
  if (content2.length <= MAX_GFM_PARAGRAPH) return true;
  for (const paragraph2 of content2.split(PARAGRAPH_BREAK)) {
    if (paragraph2.length > MAX_GFM_PARAGRAPH) return false;
  }
  return true;
}
const MarkdownContent = reactExports.memo(function MarkdownContent2({ content: content2 }) {
  const plugins = reactExports.useMemo(() => gfmIsAffordable(content2) ? REMARK_PLUGINS : NO_PLUGINS, [content2]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 break-words", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Markdown, { remarkPlugins: plugins, components: MARKDOWN_COMPONENTS, children: content2 }) });
});
const FILE_EXTENSION_SOURCE = "txt|md|markdown|json|jsonc|csv|tsv|srt|vtt|js|jsx|ts|tsx|css|scss|html|xml|yaml|yml|py|sh|ps1|bat|c|cpp|h|hpp|java|go|rs|sql|toml|ini|env|log|vue|svelte|astro|php|rb|swift|kt|kts|dart|lua|cs|fs|fsx|gradle|properties|conf|config|lock|png|jpe?g|gif|webp|bmp|avif|ico|svg|pdf|mp3|wav|ogg|m4a|aac|flac|opus|mp4|webm|mov|m4v|avi|mkv|docx?|xlsx?|pptx?|zip|rar|7z";
const PREVIEWABLE_FILE_EXTENSION = new RegExp(`\\.(?:${FILE_EXTENSION_SOURCE})$`, "i");
function cleanFileReference(value) {
  return value.trim().replace(/^[`'\"]+|[`'\"]+$/g, "");
}
function isFileReference(value) {
  const cleaned = cleanFileReference(value);
  return cleaned.length > 2 && cleaned.length < 500 && !/^https?:\/\//i.test(cleaned) && PREVIEWABLE_FILE_EXTENSION.test(cleaned);
}
const BARE_FILE_REFERENCE = new RegExp(
  `([\\p{L}\\p{N}_().-]+\\.(?:${FILE_EXTENSION_SOURCE}))(?![\\p{L}\\p{N}_-])`,
  "giu"
);
const INLINE_CODE = /`([^`\r\n]+)`/g;
const FENCED_CODE_BLOCK = /```[\s\S]*?(?:```|$)/g;
const MAX_FILE_REFERENCES = 50;
const fileReferenceCache = /* @__PURE__ */ new Map();
function extractFileReferences(content2) {
  const results = [];
  const seen = /* @__PURE__ */ new Set();
  const push2 = (raw) => {
    const value = cleanFileReference(raw);
    const key = value.toLocaleLowerCase();
    if (!isFileReference(value) || seen.has(key)) return;
    seen.add(key);
    results.push(value);
  };
  INLINE_CODE.lastIndex = 0;
  for (const match of content2.matchAll(INLINE_CODE)) {
    push2(match[1]);
    if (results.length >= MAX_FILE_REFERENCES) return results;
  }
  const proseOnly = content2.replace(FENCED_CODE_BLOCK, " ");
  BARE_FILE_REFERENCE.lastIndex = 0;
  for (const match of proseOnly.matchAll(BARE_FILE_REFERENCE)) {
    push2(match[1]);
    if (results.length >= MAX_FILE_REFERENCES) break;
  }
  return results;
}
function cachedFileReferences(cacheKey, content2) {
  if (!cacheKey) return extractFileReferences(content2);
  const cached = fileReferenceCache.get(cacheKey);
  if (cached) return cached;
  const result = extractFileReferences(content2);
  fileReferenceCache.set(cacheKey, result);
  return result;
}
function fileTypeLabel(filePath) {
  const extension2 = filePath.split(".").pop()?.toUpperCase();
  return extension2 ? `${extension2} file` : "File";
}
function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function FileReferenceCards({
  content: content2,
  cacheKey,
  onOpenFile,
  workspacePath
}) {
  const candidates = reactExports.useMemo(() => cachedFileReferences(cacheKey, content2), [cacheKey, content2]);
  const [files, setFiles] = reactExports.useState([]);
  reactExports.useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace || candidates.length === 0) {
      setFiles([]);
      return () => {
        cancelled = true;
      };
    }
    setFiles([]);
    void window.contentWorkspace.resolveFiles(workspacePath, candidates).then((resolved) => {
      if (!cancelled) setFiles(resolved.map((file) => file.requestedPath));
    }).catch(() => {
      if (!cancelled) setFiles([]);
    });
    return () => {
      cancelled = true;
    };
  }, [candidates, workspacePath]);
  if (files.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2", children: files.map((filePath) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => onOpenFile(filePath),
      className: "flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/45 px-3 py-2.5 text-left transition hover:bg-muted",
      title: filePath,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileCodeCorner, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs font-medium", children: filePath.split(/[\\/]/).pop() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: fileTypeLabel(filePath) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5 shrink-0 text-muted-foreground" })
      ]
    },
    filePath
  )) });
}
function FilePreviewPanel({
  preview,
  onClose,
  onOpen,
  onReveal
}) {
  const { t } = useI18n();
  const displayName = preview.name || preview.requestedPath.split(/[\\/]/).pop() || preview.requestedPath;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "flex h-full w-[42%] min-w-96 max-w-3xl shrink-0 flex-col border-l border-border bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.04)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-16 shrink-0 items-center gap-3 border-b border-border px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileCodeCorner, { className: "size-4 shrink-0 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold", title: preview.path || preview.requestedPath, children: displayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-2xs text-muted-foreground", children: preview.path || preview.requestedPath })
      ] }),
      preview.path && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-8", onClick: onReveal, title: t("contentChat.revealFile"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-8", onClick: onOpen, title: t("contentChat.openFile"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "size-8", onClick: onClose, title: t("common.close"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-0 flex-1 overflow-auto", children: preview.loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin text-muted-foreground" }) }) : preview.error && !preview.path ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "m-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground", children: preview.error }) : preview.kind === "image" && preview.dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-full items-center justify-center bg-muted/25 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview.dataUrl, alt: displayName, className: "max-h-full max-w-full rounded-lg object-contain shadow-sm" }) }) : preview.kind === "pdf" && preview.dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { src: preview.dataUrl, title: displayName, className: "h-full min-h-[500px] w-full border-0 bg-background" }) : preview.kind === "audio" && preview.dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-full items-center justify-center bg-muted/25 p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { src: preview.dataUrl, controls: true, className: "w-full max-w-xl" }) }) : preview.kind === "video" && preview.dataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-full items-center justify-center bg-black p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: preview.dataUrl, controls: true, className: "max-h-full max-w-full rounded-lg" }) }) : preview.kind === "text" ? preview.extension === ".md" || preview.extension === ".markdown" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-4xl p-6 text-sm leading-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownContent, { content: preview.content ?? "" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "min-h-full overflow-x-auto p-5 font-mono text-xs leading-5 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: preview.content }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "m-auto max-w-sm px-6 py-16 text-center text-sm text-muted-foreground", children: preview.error || t("contentChat.previewUnsupported") }) }),
    !preview.loading && preview.path && /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-2 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        fileTypeLabel(displayName),
        typeof preview.size === "number" ? ` · ${formatFileSize(preview.size)}` : ""
      ] }),
      preview.truncated && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("contentChat.previewTruncated") })
    ] })
  ] });
}
const MessageBubble = reactExports.memo(function MessageBubble2({
  message,
  copied,
  onCopy,
  onOpenFile,
  workspacePath
}) {
  const { t } = useI18n();
  const isUser = message.role === "user";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex gap-3", isUser && "flex-row-reverse"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"), children: isUser ? /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("group relative max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6", isUser ? "bg-primary text-primary-foreground" : "border border-border/60 bg-card"), children: [
      isUser ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap break-words", children: message.content }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownContent, { content: message.content }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FileReferenceCards,
          {
            content: message.content,
            cacheKey: message.id,
            onOpenFile,
            workspacePath
          }
        )
      ] }),
      !isUser && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: () => onCopy(message),
          title: t("contentChat.copy"),
          className: "absolute -bottom-8 left-1 opacity-0 transition group-hover:opacity-100 focus:opacity-100",
          children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5 text-emerald-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-3.5" })
        }
      )
    ] })
  ] });
});
function StreamingBubble({ text: text2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-4" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[82%] rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm leading-6", children: [
      text2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(MarkdownContent, { content: text2 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin text-muted-foreground" }),
      text2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" })
    ] })
  ] });
}
function ConversationSidebar({
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
  onDelete
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: cn(
    "shrink-0 overflow-hidden border-r border-border/60 bg-sidebar/60 transition-[width,border-color] duration-200 ease-out",
    collapsed ? "w-0 border-transparent" : "w-72"
  ), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full w-72 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 border-b border-border/60 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "min-w-0 flex-1 justify-start", onClick: onNewConversation, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: t("contentChat.newConversation") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "icon-sm",
          className: cn("shrink-0", searchOpen && "bg-sidebar-accent"),
          onClick: onToggleSearch,
          title: t("contentChat.search"),
          "aria-label": t("contentChat.search"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "icon-sm",
          className: "shrink-0",
          onClick: onCollapse,
          title: t("contentChat.collapseSidebar"),
          "aria-label": t("contentChat.collapseSidebar"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftClose, { className: "size-4" })
        }
      )
    ] }),
    searchOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative border-b border-border/60 p-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          autoFocus: true,
          value: searchQuery,
          onChange: (event) => onSearchQueryChange(event.target.value),
          placeholder: t("contentChat.searchPlaceholder"),
          className: "h-9 bg-background pl-8 pr-8 text-xs"
        }
      ),
      searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "icon-sm",
          type: "button",
          onClick: () => onSearchQueryChange(""),
          className: "absolute right-3 top-1/2 size-6 -translate-y-1/2 text-muted-foreground",
          "aria-label": t("contentChat.clearSearch"),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "min-h-0 flex-1 p-2", children: conversations.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-6 text-center text-xs leading-5 text-muted-foreground", children: searchQuery ? t("contentChat.noSearchResults") : t("contentChat.noHistory") }) : conversations.map((conversation) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: cn(
          "group mb-1 flex items-center gap-1 rounded-lg border border-transparent px-1.5 py-1 transition-colors",
          conversation.id === activeConversationId ? "border-border bg-background shadow-xs" : "hover:bg-sidebar-accent/60"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => onSelectConversation(conversation.id),
              className: "min-w-0 flex-1 px-2 py-1.5 text-left",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
                  conversation.pinned && /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-3 shrink-0 fill-current text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: conversation.title }),
                  runningTexts[conversation.id] !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3 shrink-0 animate-spin text-primary" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-0.5 block text-2xs text-muted-foreground", children: [
                  conversation.workspacePath ? workspaceLabel(conversation.workspacePath) : t("contentChat.defaultWorkspace"),
                  " · ",
                  new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(conversation.updatedAt)
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon-sm",
                type: "button",
                "aria-label": t("contentChat.chatActions"),
                className: "opacity-0 transition group-hover:opacity-100 focus:opacity-100 data-[state=open]:bg-sidebar-accent data-[state=open]:opacity-100",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "size-4" })
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { side: "right", align: "start", className: "w-44", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onTogglePinned(conversation.id), children: [
                conversation.pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "size-4" }),
                conversation.pinned ? t("contentChat.unpin") : t("contentChat.pin")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => onRename(conversation.id, conversation.title), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4" }),
                t("contentChat.rename")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { variant: "destructive", disabled: runningTexts[conversation.id] !== void 0, onClick: () => onDelete(conversation.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4" }),
                t("contentChat.deleteConversation")
              ] })
            ] })
          ] })
        ]
      },
      conversation.id
    )) })
  ] }) });
}
function SlashCommandMenu({ adapter, commands, selection: selection2, itemRefs, onSelect, onHover }) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-[calc(100%+8px)] left-0 z-50 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border px-3 py-2 text-2xs font-medium text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Command, { className: "size-3.5" }),
      t("contentChat.slashCommands", { cli: cliLabel(adapter) })
    ] }),
    commands.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-72 overflow-y-auto p-1.5", role: "listbox", children: commands.map((command, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ref: (element2) => {
          itemRefs.current[index2] = element2;
        },
        type: "button",
        role: "option",
        "aria-selected": index2 === selection2,
        onMouseDown: (event) => event.preventDefault(),
        onClick: () => onSelect(command),
        onMouseEnter: () => onHover(index2),
        className: cn(
          "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left",
          index2 === selection2 ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-2xs", children: "/" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate font-mono text-xs font-semibold", children: [
                "/",
                command.name
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-1.5 py-0.5 text-2xs uppercase text-muted-foreground", children: command.provider === "app" ? "App" : command.kind })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-2xs text-muted-foreground", children: command.description })
          ] })
        ]
      },
      `${command.provider}:${command.name}`
    )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-5 text-center text-xs text-muted-foreground", children: t("contentChat.noSlashCommands") })
  ] });
}
function ComposerToolbar({
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
  onLoadModels
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "h-8 rounded-lg px-2 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled: running,
        onClick: onOpenSystemPrompt,
        title: t("contentChat.systemPromptTitle"),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "size-3.5" }),
          t("contentChat.systemPromptButton")
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "h-8 min-w-0 max-w-52 justify-start rounded-lg bg-muted/55 px-2 text-xs font-normal hover:bg-muted",
        disabled: workspaceBusy || !workspaceLocked && running,
        onClick: onWorkspaceClick,
        title: workspaceLocked ? t("contentChat.openWorkspace", { path: workspacePath || t("contentChat.defaultWorkspace") }) : workspacePath || t("contentChat.defaultWorkspace"),
        children: [
          workspaceBusy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "size-3.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: conversationWorkspacePath && workspacePath ? workspaceLabel(workspacePath) : t("contentChat.defaultWorkspace") })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "h-8 rounded-lg px-2 text-xs font-normal text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled: running || workspaceBusy,
        onClick: onOpenMemory,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5" }),
          "memory.md"
        ]
      }
    ),
    conversationWorkspacePath && !workspaceLocked && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "icon",
        className: "size-8 rounded-lg text-muted-foreground",
        disabled: running || workspaceBusy,
        onClick: onUseDefaultWorkspace,
        title: t("contentChat.useDefaultWorkspace"),
        "aria-label": t("contentChat.useDefaultWorkspace"),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-3.5" })
      }
    ),
    workspaceLocked && /* @__PURE__ */ jsxRuntimeExports.jsx(LockKeyhole, { className: "mx-1 size-3.5 shrink-0 text-muted-foreground", "aria-label": t("contentChat.workspaceLocked") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: selectedModel || "__default",
        onValueChange: (value) => onModelChange(value === "__default" ? "" : value),
        disabled: running,
        onOpenChange: (open) => {
          if (open) onLoadModels();
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-auto min-w-32 max-w-72 rounded-lg border-0 bg-muted/55 px-2 text-xs shadow-none", children: loadingModels ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: t("contentChat.defaultModel") }),
            availableModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: model }, model))
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: selectedEffort || "__default",
        onValueChange: (value) => onEffortChange(value === "__default" ? "" : value),
        disabled: running,
        onOpenChange: (open) => {
          if (open) onLoadModels();
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-8 w-max min-w-max max-w-none rounded-lg border-0 bg-muted/55 px-2 text-xs shadow-none [&>span]:line-clamp-none [&>span]:overflow-visible", children: loadingModels ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__default", children: t("contentChat.defaultEffort") }),
            availableEfforts.map((effort) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: effort, children: effortLabel(effort, locale) }, effort))
          ] })
        ]
      }
    )
  ] });
}
function MemoryDialog({
  open,
  onOpenChange,
  workspacePath,
  draft,
  onDraftChange,
  saving,
  onSave
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (next) => {
    if (!saving) onOpenChange(next);
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("contentChat.memoryTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("contentChat.memoryDescription") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("contentChat.workspace") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs break-all", children: workspacePath })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "content-memory", children: "memory.md" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          id: "content-memory",
          value: draft,
          onChange: (event) => onDraftChange(event.target.value),
          placeholder: t("contentChat.memoryPlaceholder"),
          className: "min-h-72 resize-y font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("contentChat.memoryScopeHint") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: saving, children: t("common.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onSave, disabled: saving, children: [
        saving && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
        t("contentChat.saveMemory")
      ] })
    ] })
  ] }) });
}
function SystemPromptDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSave
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("contentChat.systemPromptTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("contentChat.systemPromptDescription") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "content-system-prompt", children: "System prompt" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          id: "content-system-prompt",
          value: draft,
          onChange: (event) => onDraftChange(event.target.value),
          placeholder: t("contentChat.systemPromptPlaceholder"),
          className: "min-h-72 resize-y font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("contentChat.systemPromptScopeHint") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("common.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onSave, children: t("contentChat.saveSystemPrompt") })
    ] })
  ] }) });
}
function RenameConversationDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSubmit
}) {
  const { t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("contentChat.renameTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("contentChat.renameDescription") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        autoFocus: true,
        value: draft,
        maxLength: 120,
        onChange: (event) => onDraftChange(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") onSubmit();
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("common.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !draft.trim(), onClick: onSubmit, children: t("contentChat.rename") })
    ] })
  ] }) });
}
const STREAM_PAINT_INTERVAL_MS = 80;
function ContentChatFeature() {
  const { t, locale } = useI18n();
  const conversations = useContentChatStore((state) => state.conversations);
  const activeConversationId = useContentChatStore((state) => state.activeConversationId);
  const adapter = useContentChatStore((state) => state.adapter);
  const selectedModels = useContentChatStore((state) => state.models);
  const selectedEfforts = useContentChatStore((state) => state.efforts);
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
  const [draft, setDraft] = reactExports.useState("");
  const [entryReady, setEntryReady] = reactExports.useState(false);
  const [status, setStatus] = reactExports.useState(null);
  const [availableModels, setAvailableModels] = reactExports.useState([]);
  const [availableEfforts, setAvailableEfforts] = reactExports.useState([]);
  const [checkingRuntime, setCheckingRuntime] = reactExports.useState(false);
  const [loadingModels, setLoadingModels] = reactExports.useState(false);
  const [runningTexts, setRunningTexts] = reactExports.useState({});
  const [copiedId, setCopiedId] = reactExports.useState("");
  const [workspaceInfo, setWorkspaceInfo] = reactExports.useState(null);
  const [workspaceBusy, setWorkspaceBusy] = reactExports.useState(false);
  const [memoryOpen, setMemoryOpen] = reactExports.useState(false);
  const [memoryDraft, setMemoryDraft] = reactExports.useState("");
  const [savingMemory, setSavingMemory] = reactExports.useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = reactExports.useState(false);
  const [systemPromptDraft, setSystemPromptDraft] = reactExports.useState("");
  const [systemPromptConversationId, setSystemPromptConversationId] = reactExports.useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = reactExports.useState(false);
  const [searchOpen, setSearchOpen] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [renameTarget, setRenameTarget] = reactExports.useState(null);
  const [renameDraft, setRenameDraft] = reactExports.useState("");
  const [filePreview, setFilePreview] = reactExports.useState(null);
  const [slashCommands, setSlashCommands] = reactExports.useState([]);
  const [slashSelection, setSlashSelection] = reactExports.useState(0);
  const [activeTab, setActiveTab] = reactExports.useState("ai");
  const licensePlan = useLicenseStore((state) => state.plan);
  const canUseBuzz = hasPlanAccess(licensePlan, "dev");
  const abortControllersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const openedWithFreshConversationRef = reactExports.useRef(false);
  const endRef = reactExports.useRef(null);
  const lastScrolledConversationRef = reactExports.useRef(null);
  const textareaRef = reactExports.useRef(null);
  const slashItemRefs = reactExports.useRef([]);
  const activeConversation = reactExports.useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );
  const activeAdapter = activeConversation?.adapter ?? adapter;
  const activeConversationWorkspace = activeConversation?.workspacePath ?? null;
  const activeRunText = activeConversation ? runningTexts[activeConversation.id] : void 0;
  const activeIsRunning = activeRunText !== void 0;
  const providerLocked = Boolean(activeConversation?.messages.some((message) => message.role === "user"));
  const workspaceLocked = providerLocked;
  const selectedModel = selectedModels[activeAdapter];
  const selectedEffort = selectedEfforts[activeAdapter];
  const adapterStatus = status?.[activeAdapter];
  const visibleConversations = reactExports.useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => conversation.title.toLocaleLowerCase().includes(query) || conversation.messages.some((message) => message.content.toLocaleLowerCase().includes(query)));
  }, [conversations, searchQuery]);
  const appSlashCommands = reactExports.useMemo(() => [
    { name: "new", description: t("contentChat.slashNew"), provider: "app", kind: "command", source: "app" },
    { name: "clear", description: t("contentChat.slashClear"), provider: "app", kind: "command", source: "app" },
    { name: "memory", description: t("contentChat.slashMemory"), provider: "app", kind: "command", source: "app" },
    { name: "folder", description: t("contentChat.slashFolder"), provider: "app", kind: "command", source: "app" }
  ], [t]);
  const slashMatch = /^\/([^\s]*)$/.exec(draft);
  const slashMenuOpen = Boolean(slashMatch);
  const slashQuery = slashMatch?.[1].toLocaleLowerCase() ?? "";
  const visibleSlashCommands = reactExports.useMemo(() => {
    if (!slashMatch) return [];
    return [...appSlashCommands, ...slashCommands].filter((command, index2, all2) => all2.findIndex((item) => item.name.toLocaleLowerCase() === command.name.toLocaleLowerCase()) === index2).filter((command) => !slashQuery || command.name.toLocaleLowerCase().includes(slashQuery) || command.description.toLocaleLowerCase().includes(slashQuery)).slice(0, 30);
  }, [appSlashCommands, slashCommands, slashMatch, slashQuery]);
  reactExports.useEffect(() => {
    const openFreshConversation = () => {
      if (openedWithFreshConversationRef.current) return;
      openedWithFreshConversationRef.current = true;
      const state = useContentChatStore.getState();
      const current = state.conversations.find((item) => item.id === state.activeConversationId);
      if (!current || current.messages.length > 0) state.createConversation();
      setEntryReady(true);
    };
    if (useContentChatStore.persist.hasHydrated()) {
      openFreshConversation();
      return;
    }
    return useContentChatStore.persist.onFinishHydration(openFreshConversation);
  }, []);
  const loadWorkspace = reactExports.useCallback(async (workspacePath) => {
    if (!window.contentWorkspace) throw new Error(t("contentChat.desktopOnly"));
    const workspace = await window.contentWorkspace.ensure(workspacePath);
    setWorkspaceInfo(workspace);
    return workspace;
  }, [t]);
  const refreshRuntime = reactExports.useCallback(async (force = false) => {
    setCheckingRuntime(true);
    try {
      if (force) invalidateCliStatus();
      setStatus(await cachedCliStatus());
    } finally {
      setCheckingRuntime(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void refreshRuntime();
  }, [refreshRuntime]);
  reactExports.useEffect(() => registerContentMcpToolHost(), []);
  reactExports.useEffect(() => {
    let cancelled = false;
    if (!window.contentWorkspace) return;
    void window.contentWorkspace.ensure(activeConversation?.workspacePath ?? null).then((workspace) => {
      if (!cancelled) setWorkspaceInfo(workspace);
    }).catch((error) => {
      if (!cancelled) toast.error(error instanceof Error ? error.message : String(error));
    });
    return () => {
      cancelled = true;
    };
  }, [activeConversation?.id, activeConversation?.workspacePath]);
  reactExports.useEffect(() => setFilePreview(null), [activeConversation?.id]);
  const loadModels = reactExports.useCallback(async () => {
    setLoadingModels(true);
    try {
      const result = await cachedCliModels(activeAdapter);
      setAvailableModels(result.models);
      const model = useContentChatStore.getState().models[activeAdapter];
      const efforts = model && result.effortsByModel?.[model] ? result.effortsByModel[model] : result.efforts ?? [];
      setAvailableEfforts(efforts);
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
  reactExports.useEffect(() => {
    void loadModels();
  }, [loadModels]);
  reactExports.useEffect(() => {
    if (!slashMenuOpen) return;
    let cancelled = false;
    void cachedCliCommands(activeAdapter, workspaceInfo?.path).then((result) => {
      if (!cancelled) setSlashCommands(result.commands);
    }).catch(() => {
      if (!cancelled) setSlashCommands([]);
    });
    return () => {
      cancelled = true;
    };
  }, [activeAdapter, workspaceInfo?.path, slashMenuOpen]);
  reactExports.useEffect(() => setSlashSelection(0), [slashQuery, activeAdapter]);
  reactExports.useEffect(() => {
    if (!slashMenuOpen) return;
    slashItemRefs.current[slashSelection]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto"
    });
  }, [slashMenuOpen, slashSelection, visibleSlashCommands.length]);
  reactExports.useLayoutEffect(() => {
    const conversationId = activeConversation?.id ?? null;
    const switched = lastScrolledConversationRef.current !== conversationId;
    lastScrolledConversationRef.current = conversationId;
    if (!entryReady) return;
    endRef.current?.scrollIntoView({ behavior: switched ? "auto" : "smooth", block: "end" });
  }, [activeConversation?.id, activeConversation?.messages.length, entryReady, activeRunText]);
  reactExports.useEffect(() => {
    const controllers = abortControllersRef.current;
    return () => {
      for (const controller2 of controllers.values()) controller2.abort();
      controllers.clear();
    };
  }, []);
  async function sendMessage() {
    const prompt = draft.trim();
    if (!prompt || activeIsRunning) return;
    if (!adapterStatus?.available) {
      toast.error(t("contentChat.cliUnavailable", { cli: cliLabel(activeAdapter) }));
      return;
    }
    const conversationId = activeConversation?.id ?? createConversation();
    let workspace;
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
    const controller2 = new AbortController();
    abortControllersRef.current.set(conversationId, controller2);
    let streamedText = "";
    let lastPaintAt = 0;
    try {
      const output = await runCliTextTask({
        adapter: activeAdapter,
        prompt,
        model: selectedModel || void 0,
        effort: selectedEffort || void 0,
        sessionKey: `content-chat:${conversationId}`,
        timeoutMs: 10 * 60 * 1e3,
        workingDirectory: workspace.path,
        enableContentMcp: true,
        systemPrompt: [
          activeConversation?.systemPrompt?.trim(),
          workspace.memory.trim()
        ].filter(Boolean).join("\n\n---\n\n") || void 0,
        signal: controller2.signal,
        onChunk: (chunk) => {
          streamedText += chunk;
          const nowMs = Date.now();
          if (nowMs - lastPaintAt < STREAM_PAINT_INTERVAL_MS) return;
          lastPaintAt = nowMs;
          setRunningTexts((current) => ({ ...current, [conversationId]: streamedText }));
        },
        onCommands: (commands) => {
          setSlashCommands(commands);
          primeCliCommands(activeAdapter, workspace.path, commands);
        }
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
  function stopGeneration() {
    if (activeConversation) abortControllersRef.current.get(activeConversation.id)?.abort();
  }
  const copyMessage = reactExports.useCallback(async (message) => {
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
  const previewWorkspaceFile = reactExports.useCallback(async (filePath, workspaceOverride) => {
    if (!window.contentWorkspace) return;
    const workspacePath = workspaceOverride !== void 0 ? workspaceOverride : activeConversationWorkspace;
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
        memoryDraft
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
  function selectSlashCommand(command) {
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
  function handleComposerKeyDown(event) {
    if (slashMatch && visibleSlashCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashSelection((index2) => (index2 + 1) % visibleSlashCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashSelection((index2) => (index2 - 1 + visibleSlashCommands.length) % visibleSlashCommands.length);
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-0 bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureRail, { showCliSettings: true, items: [
      {
        id: "ai",
        icon: Bot,
        label: "AI",
        active: activeTab === "ai",
        onClick: () => setActiveTab("ai")
      },
      ...canUseBuzz ? [{
        id: "buzz",
        icon: Radar,
        label: "Buzz",
        active: activeTab === "buzz",
        onClick: () => {
          setActiveTab("buzz");
          setFilePreview(null);
        }
      }] : []
    ] }),
    activeTab === "ai" || !canUseBuzz ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ConversationSidebar,
        {
          collapsed: sidebarCollapsed,
          conversations: visibleConversations,
          activeConversationId,
          runningTexts,
          searchOpen,
          searchQuery,
          locale,
          onToggleSearch: () => {
            setSearchOpen((open) => !open);
            if (searchOpen) setSearchQuery("");
          },
          onSearchQueryChange: setSearchQuery,
          onCollapse: () => setSidebarCollapsed(true),
          onNewConversation: () => createConversation(),
          onSelectConversation: selectConversation,
          onTogglePinned: toggleConversationPinned,
          onRename: (id2, title) => {
            setRenameTarget({ id: id2, title });
            setRenameDraft(title);
          },
          onDelete: deleteConversation
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex min-w-0 flex-1 flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5", children: [
          sidebarCollapsed && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "icon",
              className: "shrink-0",
              onClick: () => setSidebarCollapsed(false),
              title: t("contentChat.expandSidebar"),
              "aria-label": t("contentChat.expandSidebar"),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftOpen, { className: "size-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { icon: MessageSquareText }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-sm font-semibold", children: t("contentChat.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-2xs text-muted-foreground", children: t("contentChat.noInjectedPrompt") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("size-2 rounded-full", adapterStatus?.available ? "bg-emerald-500" : "bg-destructive") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: activeAdapter, onValueChange: (value) => setAdapter(value), disabled: activeIsRunning || providerLocked, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-auto min-w-28 max-w-52", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "claude", children: "Claude CLI" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "opencode", children: "OpenCode CLI" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "codex", children: "Codex CLI" })
              ] })
            ] }),
            providerLocked && /* @__PURE__ */ jsxRuntimeExports.jsx(LockKeyhole, { className: "size-3.5 text-muted-foreground", "aria-label": t("contentChat.providerLocked") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => void refreshRuntime(true), disabled: checkingRuntime, title: t("contentChat.refreshCli"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: cn("size-4", checkingRuntime && "animate-spin") }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-6", children: !entryReady || !activeConversation || activeConversation.messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "m-auto max-w-md px-4 py-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquareText, { className: "size-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: t("contentChat.emptyTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-sm leading-5 text-muted-foreground", children: t("contentChat.emptyDescription") })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          activeConversation.messages.map((message) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            MessageBubble,
            {
              message,
              copied: copiedId === message.id,
              onCopy: copyMessage,
              onOpenFile: previewWorkspaceFile,
              workspacePath: activeConversation.workspacePath ?? null
            },
            message.id
          )),
          activeRunText !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(StreamingBubble, { text: activeRunText }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: endRef })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "shrink-0 bg-background px-5 pb-3 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-6xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-2xl border border-input bg-card p-2 shadow-sm transition focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/25", children: [
            slashMatch && /* @__PURE__ */ jsxRuntimeExports.jsx(
              SlashCommandMenu,
              {
                adapter: activeAdapter,
                commands: visibleSlashCommands,
                selection: slashSelection,
                itemRefs: slashItemRefs,
                onSelect: selectSlashCommand,
                onHover: setSlashSelection
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                ref: textareaRef,
                value: draft,
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: handleComposerKeyDown,
                placeholder: t("contentChat.placeholder"),
                disabled: activeIsRunning,
                className: "max-h-36 min-h-12 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 pt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                ComposerToolbar,
                {
                  running: activeIsRunning,
                  workspaceBusy,
                  workspaceLocked,
                  workspacePath: workspaceInfo?.path,
                  conversationWorkspacePath: activeConversationWorkspace,
                  selectedModel,
                  selectedEffort,
                  availableModels,
                  availableEfforts,
                  loadingModels,
                  locale,
                  onOpenSystemPrompt: openSystemPrompt,
                  onWorkspaceClick: () => void (workspaceLocked ? openWorkspaceDirectory() : chooseWorkspace()),
                  onOpenMemory: () => void openMemory(),
                  onUseDefaultWorkspace: () => void useDefaultWorkspace(),
                  onModelChange: (model) => setModel(activeAdapter, model),
                  onEffortChange: (effort) => setEffort(activeAdapter, effort),
                  onLoadModels: () => void loadModels()
                }
              ),
              activeIsRunning ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "destructive", className: "size-9 shrink-0 rounded-xl", onClick: stopGeneration, title: t("contentChat.stop"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "size-3.5 fill-current" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", className: "size-9 shrink-0 rounded-xl", onClick: () => void sendMessage(), disabled: !draft.trim() || !adapterStatus?.available, title: t("contentChat.send"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "size-4" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("size-1.5 rounded-full", adapterStatus?.available ? "bg-emerald-500" : "bg-destructive") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: adapterStatus?.available ? t("contentChat.connected", { cli: cliLabel(activeAdapter, true) }) : t("contentChat.disconnected") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("contentChat.inputHint") })
          ] })
        ] }) })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      BuzzView,
      {
        onOpenFile: (workspacePath, filePath) => void previewWorkspaceFile(filePath, workspacePath)
      }
    ),
    filePreview && /* @__PURE__ */ jsxRuntimeExports.jsx(
      FilePreviewPanel,
      {
        preview: filePreview,
        onClose: () => setFilePreview(null),
        onOpen: () => void openPreviewedFile(),
        onReveal: () => void revealPreviewedFile()
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MemoryDialog,
      {
        open: memoryOpen,
        onOpenChange: setMemoryOpen,
        workspacePath: workspaceInfo?.path,
        draft: memoryDraft,
        onDraftChange: setMemoryDraft,
        saving: savingMemory,
        onSave: () => void saveMemory()
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SystemPromptDialog,
      {
        open: systemPromptOpen,
        onOpenChange: setSystemPromptOpen,
        draft: systemPromptDraft,
        onDraftChange: setSystemPromptDraft,
        onSave: saveSystemPrompt
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RenameConversationDialog,
      {
        open: Boolean(renameTarget),
        onOpenChange: (open) => {
          if (!open) setRenameTarget(null);
        },
        draft: renameDraft,
        onDraftChange: setRenameDraft,
        onSubmit: submitRenameConversation
      }
    )
  ] });
}
export {
  ContentChatFeature as default
};
