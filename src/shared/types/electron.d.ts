import type { OpenExternalResult, UpdateCheckResult, UpdateDownloadResult } from "./update";
import type {
  GoogleFlowGenerateImagePayload,
  GoogleFlowGenerateVideoPayload,
  GoogleFlowGenerationResult,
  GoogleFlowProjectBinding,
  GoogleFlowReferenceSyncResult,
  GoogleFlowReferenceSyncSource,
  GoogleFlowStatus,
  GoogleFlowTaskEvent,
} from "@/features/video-studio/packages/ai-core/providers/google-flow/types";
import type {
  GrokGenerateVideoPayload,
  GrokGenerationResult,
  GrokStatus,
  GrokTaskEvent,
} from "@/features/video-studio/packages/ai-core/providers/grok/types";

export {};

export interface AutoEditProjectSummary {
  id: string;
  name: string;
  filePath: string;
  updatedAt: number;
  durationMs: number;
}

export type VideoStudioInAppAccount = {
  accountSlotId: string;
  provider: "google-flow" | "grok";
  label: string;
  createdAt: number;
};

export type MediaToolkitBrowserState = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  error?: string;
};

export type YouTubeProfileState = {
  activeProfileId: string;
  profiles: import("@/features/media-toolkit/types").YouTubeProfile[];
};

declare global {
  interface Window {
    ipcRenderer?: {
      on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
      off: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
      send: (channel: string, ...args: unknown[]) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
    imageStorage?: {
      searchWebImages: (query: string, limit?: number) => Promise<Array<{ imageUrl: string; sourcePageUrl: string; title?: string; width?: number; height?: number }>>;
      saveImage: (url: string, category: string, filename: string, sourcePageUrl?: string) => Promise<{ success: boolean; localPath?: string; error?: string }>;
      getImagePath: (localPath: string) => Promise<string | null>;
      deleteImage: (localPath: string) => Promise<boolean>;
      readAsBase64: (localPath: string) => Promise<{ success: boolean; base64?: string; mimeType?: string; size?: number; error?: string }>;
      getAbsolutePath: (localPath: string) => Promise<string | null>;
    };
    watermarkRemoval?: {
      remove: (localPath: string, box?: string) => Promise<{ success: boolean; localPath?: string; output?: string; error?: string }>;
    };
    fileStorage?: {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<boolean>;
      removeItem: (key: string) => Promise<boolean>;
      exists: (key: string) => Promise<boolean>;
      listKeys: (prefix: string) => Promise<string[]>;
      listDirs: (prefix: string) => Promise<string[]>;
      removeDir: (prefix: string) => Promise<boolean>;
    };
    researchDatabase?: {
      load: () => Promise<{
        videos: Array<{ videoId: string; channelId: string; title: string; thumbnailUrl: string; viewCount: number; scannedAt: number }>;
        channels: Array<{ channelId: string; viewCount: number; scannedAt: number }>;
        scans: import("@/features/research-monitor/types").ScanAudit[];
      }>;
      recordScan: (payload: {
        startedAt: number;
        finishedAt: number;
        scope: import("@/features/research-monitor/types").ScanScope;
        videos: Array<Pick<import("@/features/research-monitor/types").YouTubeVideo, "id" | "channelId" | "title" | "thumbnailUrl" | "viewCount" | "capturedAt">>;
        channels: Array<Pick<import("@/features/research-monitor/types").YouTubeChannel, "id" | "viewCount" | "capturedAt">>;
      }) => Promise<{ scanId: number }>;
      recordFailure: (payload: { startedAt: number; finishedAt: number; scope: import("@/features/research-monitor/types").ScanScope; error: string }) => Promise<{ scanId: number }>;
      migrateLegacy: (payload: unknown) => Promise<{ migrated: boolean }>;
      clearHistory: () => Promise<boolean>;
    };
    storageManager?: {
      getPaths: () => Promise<{ basePath: string; projectPath: string; mediaPath: string; cachePath: string }>;
      selectDirectory: () => Promise<string | null>;
      // Unified storage operations (single base path for projects + media)
      validateDataDir: (dirPath: string) => Promise<{ valid: boolean; projectCount?: number; mediaCount?: number; error?: string }>;
      moveData: (newPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      linkData: (dirPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      exportData: (targetPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      importData: (sourcePath: string) => Promise<{ success: boolean; error?: string }>;
      // Cache
      getCacheSize: () => Promise<{ total: number; details: Array<{ path: string; size: number }> }>;
      clearCache: (options?: { olderThanDays?: number }) => Promise<{ success: boolean; clearedBytes?: number; error?: string }>;
      updateConfig: (config: { autoCleanEnabled?: boolean; autoCleanDays?: number }) => Promise<boolean>;
    };
    electronAPI?: {
      saveFileDialog: (options: {
        localPath: string;
        defaultPath: string;
        filters: { name: string; extensions: string[] }[];
      }) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
    };
    autoEditRuntime?: {
      pickMedia: () => Promise<{
        canceled: boolean;
        files: Array<{ path: string; name: string; previewUrl: string; kind: "video" | "audio" | "image" }>;
      }>;
      pickJson: () => Promise<{ canceled: boolean; filePath?: string; content?: string }>;
      registerMediaPaths: (paths: string[]) => Promise<Record<string, string>>;
      getPathForFile: (file: File) => string;
      saveText: (payload: { content: string; defaultName: string; extension: string }) => Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
        error?: string;
      }>;
      listProjects: () => Promise<{ success: boolean; projects: AutoEditProjectSummary[] }>;
      saveProjectFile: (payload: { id: string; content: string }) => Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
      }>;
      loadProjectFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
      }>;
      deleteProject: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      renameProject: (payload: { filePath: string; name: string }) => Promise<{
        success: boolean;
        name?: string;
        error?: string;
      }>;
      revealProject: (filePath: string) => Promise<{ success: boolean }>;
    };
    appUpdater?: {
      getCurrentVersion: () => Promise<string>;
      checkForUpdates: () => Promise<UpdateCheckResult>;
      downloadAndInstall: () => Promise<UpdateDownloadResult>;
      openExternalLink: (url: string) => Promise<OpenExternalResult>;
    };
    authBridge?: {
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      getDeviceInfo: () => Promise<{ deviceHash: string; deviceName: string }>;
      consumePendingCallback: () => Promise<string | null>;
      onOAuthCallback: (listener: (url: string) => void) => () => void;
    };
    cliRuntime?: {
      getStatus: () => Promise<{
        claude: { available: boolean; version?: string; error?: string; path?: string | null };
        opencode: { available: boolean; version?: string; error?: string; path?: string | null };
        codex: { available: boolean; version?: string; error?: string; path?: string | null };
      }>;
      install: (adapter: 'claude' | 'opencode' | 'codex') => Promise<{
        success: boolean;
        output?: string;
        error?: string;
        status?: { available: boolean; version?: string; error?: string; path?: string | null };
      }>;
      getModels: (adapter: 'claude' | 'opencode' | 'codex') => Promise<{
        models: string[];
        source: 'static' | 'cli';
        efforts: string[];
        effortsByModel?: Record<string, string[]>;
      }>;
      getCommands: (adapter: 'claude' | 'opencode' | 'codex', workingDirectory?: string) => Promise<{
        commands: Array<{
          name: string;
          description: string;
          provider: 'claude' | 'opencode' | 'codex';
          kind: 'skill' | 'command';
          source: 'user' | 'workspace' | 'session';
        }>;
      }>;
      runTextTask: (payload: {
        adapter: 'claude' | 'opencode' | 'codex';
        prompt: string;
        systemPrompt?: string;
        model?: string;
        effort?: string;
        sessionKey?: string;
        requestId?: string;
        timeoutMs?: number;
        workingDirectory?: string;
        enableContentMcp?: boolean;
      }) => Promise<{
        success: boolean;
        outputText?: string;
        sessionId?: string;
        inputTokens?: number;
        outputTokens?: number;
        costUsd?: number;
        timedOut: boolean;
        exitCode: number | null;
        canceled?: boolean;
        error?: string;
      }>;
      cancelTextTask: (requestId: string) => Promise<{ canceled: boolean }>;
      onTaskEvent: (listener: (payload: {
        requestId: string;
        type: 'chunk' | 'session' | 'commands';
        chunk?: string;
        sessionId?: string;
        commands?: Array<{
          name: string;
          description: string;
          provider: 'claude' | 'opencode' | 'codex';
          kind: 'skill' | 'command';
          source: 'user' | 'workspace' | 'session';
        }>;
      }) => void) => () => void;
    };
    contentWorkspace?: {
      getDefault: () => Promise<{ path: string; memory: string }>;
      ensure: (workspacePath?: string | null) => Promise<{ path: string; memory: string }>;
      chooseDirectory: (currentPath?: string | null) => Promise<{
        canceled: boolean;
        path?: string;
        memory?: string;
      }>;
      pickInput: (kind: 'file' | 'folder', workspacePath?: string | null, currentPath?: string | null) => Promise<{
        canceled: boolean;
        path?: string;
        name?: string;
      }>;
      prepareBuzzInputs: (workspacePath: string | null | undefined, inputs: Array<{
        id: string;
        name: string;
        kind: 'file' | 'folder';
        path: string;
      }>) => Promise<Array<{
        nodeId: string;
        name: string;
        kind: 'file' | 'folder';
        sourcePath: string;
        resolvedPath: string;
        staged: boolean;
        fileCount: number;
        totalBytes: number;
        fingerprint: string;
        files: string[];
        filesTruncated: boolean;
      }>>;
      verifyBuzzOutput: (workspacePath: string | null | undefined, kind: 'text' | 'file' | 'folder', outputPath: string, text: string) => Promise<{
        valid: boolean;
        kind?: 'text' | 'file' | 'folder';
        path?: string;
        fileCount?: number;
        totalBytes?: number;
        fingerprint?: string;
        error?: string;
      }>;
      openDirectory: (workspacePath?: string | null) => Promise<{ success: boolean; error?: string }>;
      previewFile: (workspacePath: string | null | undefined, filePath: string) => Promise<{
        success: boolean;
        path: string;
        name: string;
        extension: string;
        size: number;
        kind: 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'unsupported';
        mimeType?: string;
        content?: string;
        dataUrl?: string;
        truncated?: boolean;
        error?: string;
      }>;
      resolveFiles: (workspacePath: string | null | undefined, filePaths: string[]) => Promise<Array<{
        requestedPath: string;
        path: string;
        name: string;
        extension: string;
        size: number;
      }>>;
      openFile: (workspacePath: string | null | undefined, filePath: string) => Promise<{ success: boolean; error?: string }>;
      revealFile: (workspacePath: string | null | undefined, filePath: string) => Promise<{ success: boolean; error?: string }>;
      readMemory: (workspacePath?: string | null) => Promise<{ path: string; memory: string }>;
      writeMemory: (workspacePath: string | null | undefined, content: string) => Promise<{ path: string; memory: string }>;
      listTree: (workspacePath?: string | null) => Promise<{
        workspacePath: string;
        tree: Array<{
          name: string;
          path: string;
          relativePath: string;
          isDirectory: boolean;
          size?: number;
          extension?: string;
          children?: any[];
        }>;
      }>;
      createFile: (workspacePath: string | null | undefined, relativePath: string, initialContent?: string) => Promise<{ success: boolean; path: string }>;
      createFolder: (workspacePath: string | null | undefined, relativePath: string) => Promise<{ success: boolean; path: string }>;
      deleteEntry: (workspacePath: string | null | undefined, relativePath: string) => Promise<{ success: boolean }>;
    };
    contentMcp?: {
      ready: () => void;
      respond: (payload: { requestId: string; success: boolean; result?: unknown; error?: string }) => void;
      onToolCall: (listener: (payload: {
        requestId: string;
        name: string;
        arguments: Record<string, unknown>;
      }) => void) => () => void;
    };
    googleFlowRuntime?: {
      getStatus: () => Promise<GoogleFlowStatus>;
      listCredentials: () => Promise<GoogleFlowStatus['credentials']>;
      getCapacity: () => Promise<{ imageLanes: number; videoLanes: number }>;
      listProjectBindings: (longddProjectId: string) => Promise<GoogleFlowProjectBinding[]>;
      createProjectBinding: (payload: { longddProjectId: string; credentialId: string; title?: string }) => Promise<GoogleFlowProjectBinding>;
      activateProjectBinding: (payload: { longddProjectId: string; credentialId: string; flowProjectId: string }) => Promise<GoogleFlowProjectBinding>;
      syncReferences: (payload: { projectId: string; projectTitle?: string; sources: GoogleFlowReferenceSyncSource[] }) => Promise<GoogleFlowReferenceSyncResult>;
      openFlow: () => Promise<{ ok: boolean }>;
      updateSettings: (payload: {
        imageLanesPerToken?: number;
        videoLanesPerToken?: number;
        imageSubmitDelayMinMs?: number;
        imageSubmitDelayMaxMs?: number;
        videoSubmitDelayMinMs?: number;
        videoSubmitDelayMaxMs?: number;
        accountStartStaggerMinMs?: number;
        accountStartStaggerMaxMs?: number;
      }) => Promise<{
        imageLanesPerToken: number;
        videoLanesPerToken: number;
        imageSubmitDelayMinMs: number;
        imageSubmitDelayMaxMs: number;
        videoSubmitDelayMinMs: number;
        videoSubmitDelayMaxMs: number;
        accountStartStaggerMinMs: number;
        accountStartStaggerMaxMs: number;
      }>;
      generateImage: (payload: GoogleFlowGenerateImagePayload) => Promise<GoogleFlowGenerationResult>;
      generateVideo: (payload: GoogleFlowGenerateVideoPayload) => Promise<GoogleFlowGenerationResult>;
      upscaleVideo: (payload: { taskId?: string; projectId: string; sceneId: string; mediaId: string; aspectRatio: string; preferredCredentialId?: string }) => Promise<GoogleFlowGenerationResult>;
      cancelTask: (taskId: string) => Promise<{ cancelled: boolean }>;
      onStatus: (listener: (payload: GoogleFlowStatus) => void) => () => void;
      onTask: (listener: (payload: GoogleFlowTaskEvent) => void) => () => void;
      listInAppAccounts: () => Promise<VideoStudioInAppAccount[]>;
      addInAppAccount: () => Promise<VideoStudioInAppAccount>;
      removeInAppAccount: (accountSlotId: string) => Promise<void>;
      showInAppAccount: (accountSlotId: string) => Promise<void>;
      refreshInAppAccounts: () => Promise<{ ok: boolean }>;
    };
    videoStudioBrowser?: {
      startRuntimes: () => Promise<{ ok: boolean }>;
      setHideAfterLogin: (value: boolean) => Promise<{ ok: boolean }>;
    };
    grokVideoRuntime?: {
      getStatus: () => Promise<GrokStatus>;
      refreshQuota: () => Promise<GrokStatus>;
      getCapacity: () => Promise<{ videoLanes: number }>;
      updateSettings: (payload: {
        videoLanesPerExtension?: number;
        videoSubmitDelayMinMs?: number;
        videoSubmitDelayMaxMs?: number;
        extensionStartStaggerMinMs?: number;
        extensionStartStaggerMaxMs?: number;
      }) => Promise<{
        videoLanesPerExtension: number;
        videoSubmitDelayMinMs: number;
        videoSubmitDelayMaxMs: number;
        extensionStartStaggerMinMs: number;
        extensionStartStaggerMaxMs: number;
      }>;
      openGrok: () => Promise<{ ok: boolean }>;
      generateVideo: (payload: GrokGenerateVideoPayload) => Promise<GrokGenerationResult>;
      cancelTask: (taskId: string) => Promise<{ cancelled: boolean }>;
      onStatus: (listener: (payload: GrokStatus) => void) => () => void;
      onTask: (listener: (payload: GrokTaskEvent) => void) => () => void;
      listInAppAccounts: () => Promise<VideoStudioInAppAccount[]>;
      addInAppAccount: () => Promise<VideoStudioInAppAccount>;
      removeInAppAccount: (accountSlotId: string) => Promise<void>;
      showInAppAccount: (accountSlotId: string) => Promise<void>;
    };
    ffmpegRuntime?: {
      run: (payload: { jobId: string; args: string[]; totalDurationSec?: number }) => Promise<{
        success: boolean;
        exitCode: number | null;
        stderr: string;
        canceled: boolean;
        error?: string;
      }>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      probeDuration: (audioPath: string) => Promise<{ durationSec: number | null }>;
      probeDimensions: (mediaPath: string) => Promise<{ dimensions: { width: number; height: number } | null }>;
      onEvent: (listener: (payload: {
        jobId: string;
        type: 'progress' | 'log';
        progress?: { percent: number; timeSec: number; raw: string };
        line?: string;
      }) => void) => () => void;
    };
    whisperRuntime?: {
      transcribe: (payload: {
        jobId: string;
        audioPath: string;
        provider: 'openai' | 'groq';
        apiKey: string;
        model?: string;
        language?: string;
        prompt?: string;
        chunkDurationSec?: number;
      }) => Promise<{
        success: boolean;
        srt?: string;
        durationSec?: number;
        chunks?: number;
        error?: string;
        status?: number;
        canceled?: boolean;
      }>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      onProgress: (listener: (event: {
        jobId: string;
        type: 'stage' | 'chunk-start' | 'chunk-done' | 'log';
        stage?: 'probing' | 'chunking' | 'uploading' | 'merging' | 'done';
        chunkIndex?: number;
        chunkTotal?: number;
        percent?: number;
        message?: string;
      }) => void) => () => void;
    };
    mediaToolkit?: {
      listProfiles: () => Promise<YouTubeProfileState>;
      createProfile: () => Promise<YouTubeProfileState>;
      switchProfile: (profileId: string) => Promise<YouTubeProfileState>;
      renameProfile: (payload: { profileId: string; name: string }) => Promise<YouTubeProfileState>;
      deleteProfile: (profileId: string) => Promise<YouTubeProfileState>;
      showBrowser: (bounds: { x: number; y: number; width: number; height: number }) => Promise<{ success: boolean; state?: MediaToolkitBrowserState }>;
      setBrowserBounds: (bounds: { x: number; y: number; width: number; height: number }) => Promise<{ success: boolean }>;
      hideBrowser: () => Promise<{ success: boolean }>;
      browserAction: (action: "back" | "forward" | "reload" | "home") => Promise<{ success: boolean }>;
      navigateBrowser: (url: string) => Promise<{ success: boolean; error?: string }>;
      onBrowserState: (listener: (payload: MediaToolkitBrowserState) => void) => () => void;
      getStatus: () => Promise<{ installed: boolean }>;
      install: (jobId: string) => Promise<{ success: boolean; error?: string }>;
      analyze: (payload: { jobId: string; url: string }) => Promise<{
        success: boolean;
        info?: import("@/features/media-toolkit/types").MediaSourceInfo;
        error?: string;
      }>;
      analyzePlaylist: (payload: { jobId: string; url: string }) => Promise<{
        success: boolean;
        playlist?: import("@/features/media-toolkit/types").MediaPlaylistInfo;
        error?: string;
      }>;
      chooseDirectory: () => Promise<{ success: boolean; directory?: string; canceled?: boolean }>;
      download: (payload: import("@/features/media-toolkit/types").MediaDownloadRequest) => Promise<import("@/features/media-toolkit/types").MediaDownloadResult>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      saveSubtitle: (payload: { srt: string; defaultName: string }) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      reveal: (filePath: string) => Promise<{ success: boolean }>;
      openSource: (url: string) => Promise<{ success: boolean }>;
      onProgress: (listener: (payload: import("@/features/media-toolkit/types").MediaToolkitProgress) => void) => () => void;
    };
    ttsRuntime?: {
      getModelStatuses: (models: Array<{
        id: string;
        repository: string;
        capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu';
      }>) => Promise<import('@/features/tts-voice/types').TtsModelStatus[]>;
      installModel: (payload: {
        jobId: string;
        model: { id: string; repository: string; capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu' };
      }) => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
      removeModel: (modelId: string) => Promise<{ success: boolean; error?: string }>;
      generate: (payload: {
        jobId: string;
        model: { id: string; repository: string; capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu' };
        text: string;
        mode: 'clone' | 'design' | 'auto' | 'preset';
        splitMode?: 'default' | 'line' | 'sentence';
        language?: string;
        speed?: number;
        numStep?: number;
        capcutVoiceType?: string;
        capcutResourceId?: string;
        geminiVoiceName?: string;
        geminiStyle?: string;
        geminiTemperature?: number;
        vbeeVoiceCode?: string;
        vbeeAudioType?: 'mp3' | 'wav';
        vbeeBitrate?: number;
        vieneuVoice?: string;
        vieneuStyle?: 'tu_nhien' | 'tin_tuc' | 'doc_truyen';
        advancedSettings?: import('@/features/tts-voice/types').TtsAdvancedSettings;
        instruction?: string;
        profileId?: string;
        referenceAudioPath?: string;
        referenceText?: string;
      }) => Promise<import('@/features/tts-voice/types').TtsGenerateResult>;
      getGeminiApiKeys: () => Promise<string[]>;
      setGeminiApiKeys: (keys: string[]) => Promise<{ success: boolean; keyCount: number }>;
      getVbeeCredentials: () => Promise<{ appId: string; token: string; expiresAt?: number }>;
      setVbeeCredentials: (input: { appId: string; token: string }) => Promise<{ success: boolean; configured: boolean; expiresAt?: number }>;
      getVbeeVoices: (force?: boolean) => Promise<{ success: boolean; voices: import('@/features/tts-voice/types').VbeeVoice[]; updatedAt?: number; error?: string }>;
      getVieneuVoices: () => Promise<{ success: boolean; voices: import('@/features/tts-voice/types').VieneuVoice[]; error?: string }>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      pickReferenceAudio: (title?: string) => Promise<{ path: string | null }>;
      exportAudio: (sourcePath: string, title?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      revealAudio: (filePath: string) => Promise<{ success: boolean }>;
      onEvent: (listener: (event: import('@/features/tts-voice/types').TtsProgressEvent) => void) => () => void;
    };
    autoVideoRuntime?: {
      render: (payload: {
        jobId: string;
        audioPath: string;
        audioStartMs?: number;
        audioEndMs?: number;
        segments: Array<{
          index: number;
          startMs: number;
          endMs: number;
          text: string;
          imagePath: string;
          videoPath?: string;
          sourceStartMs?: number;
	          mediaEffect?: 'none' | 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up' | 'pan_down' | 'zoom_pan_left' | 'zoom_pan_right';
	          effectStartMs?: number;
	          effectEndMs?: number;
	          transitionToNext?: import('@/features/video-studio/lib/auto-video/types').AutoVideoTransition;
	          transitionDurationMs?: number;
          overlayImagePath?: string;
          overlayPlacement?: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
          sfxPath?: string;
        }>;
        captionSegments?: Array<{
          index: number;
          startMs: number;
          endMs: number;
          text: string;
        }>;
        mediaMode?: 'image' | 'video';
        resolution: '1280x720' | '1920x1080' | '3840x2160';
        fps: 24 | 30 | 60;
        codec: 'libx264' | 'libx265' | 'h264_nvenc';
        crf: number;
        outputPath?: string;
        burnSubtitles?: boolean;
        subtitleFontSize?: number;
        bgmPath?: string;
        bgmVolume?: number;
        bgmDuckVoice?: boolean;
        /** Normalize final audio to -14 LUFS (YouTube standard). */
        audioNormalize?: boolean;
        /** Keep original video audio at this volume 0..1. 0 = mute. */
        videoAudioVolume?: number;
        /** Long-form final concat: use the pre-rendered chapter clips' own audio as
         * master (they already contain narration + video) instead of re-laying the
         * narration track, which otherwise plays the imported voice twice. */
        masterFromSegments?: boolean;
      }) => Promise<{
        success: boolean;
        outputPath?: string;
        error?: string;
        canceled?: boolean;
      }>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      pickOutput: (defaultName: string) => Promise<{ path: string | null }>;
      showInFolder: (filePath: string) => Promise<{ ok: boolean }>;
      openFile: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
      onEvent: (listener: (event: {
        jobId: string;
        type: 'stage' | 'segment-start' | 'segment-done' | 'concat-progress' | 'log';
        stage?: 'preparing' | 'building-segments' | 'concatenating' | 'done' | 'error';
        segmentIndex?: number;
        segmentTotal?: number;
        percent?: number;
        message?: string;
      }) => void) => () => void;
    };
    editorRenderRuntime?: {
      render: (payload: {
        jobId: string;
        plan: import("@/features/auto-edit/render/types").RenderPlan;
        outputPath: string;
        options?: import("@/features/auto-edit/render/types").ExportOptions;
      }) => Promise<{
        success: boolean;
        outputPath?: string;
        error?: string;
        canceled?: boolean;
      }>;
      cancel: (jobId: string) => Promise<{ canceled: boolean }>;
      pickOutput: (defaultName: string) => Promise<{ path: string | null }>;
      showInFolder: (filePath: string) => Promise<{ ok: boolean }>;
      onEvent: (listener: (event: import("@/features/auto-edit/render/types").RenderProgressEvent) => void) => () => void;
    };
    autopilotBridge?: {
      getServerStatus: () => Promise<{ port: number; running: boolean }>;
      onRequest: (handler: (request: {
        requestId: string;
        method: string;
        path: string;
        query: Record<string, string>;
        body?: unknown;
      }, emit: (event: unknown) => void) => Promise<{ status: number; body: unknown }>) => () => void;
    };
    imageHostUploader?: {
      upload: (payload: {
        provider: {
          name: string;
          platform: string;
          baseUrl?: string;
          uploadPath?: string;
          apiKeyParam?: string;
          apiKeyHeader?: string;
          apiKeyFormField?: string;
          expirationParam?: string;
          imageField?: string;
          imagePayloadType?: 'base64' | 'file';
          nameField?: string;
          staticFormFields?: Record<string, string>;
          responseUrlField?: string;
          responseDeleteUrlField?: string;
        };
        apiKey: string;
        imageData: string;
        options?: {
          name?: string;
          expiration?: number;
        };
      }) => Promise<{
        success: boolean;
        url?: string;
        deleteUrl?: string;
        error?: string;
      }>;
    };
  }
}
