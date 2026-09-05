import { ipcRenderer, contextBridge, webUtils } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Image storage API
contextBridge.exposeInMainWorld('imageStorage', {
  searchWebImages: (query: string, limit?: number) =>
    ipcRenderer.invoke('search-web-images', { query, limit }),
  // Save image from URL to local storage
  saveImage: (url: string, category: string, filename: string, sourcePageUrl?: string) =>
    ipcRenderer.invoke('save-image', { url, category, filename, sourcePageUrl }),
  
  // Get actual file path for a local-image:// URL
  getImagePath: (localPath: string) => 
    ipcRenderer.invoke('get-image-path', localPath),
  
  // Delete a locally stored image
  deleteImage: (localPath: string) => 
    ipcRenderer.invoke('delete-image', localPath),
  
  // Read local image as base64 (for AI API calls like video generation)
  readAsBase64: (localPath: string) => 
    ipcRenderer.invoke('read-image-base64', localPath),
  
  // Get absolute file path (for local video generation tools like FFmpeg)
  getAbsolutePath: (localPath: string) => 
    ipcRenderer.invoke('get-absolute-path', localPath),
})

// Watermark removal via Python (poly background fit + OpenCV inpaint)
contextBridge.exposeInMainWorld('watermarkRemoval', {
  remove: (localPath: string, box?: string) =>
    ipcRenderer.invoke('watermark-remove', localPath, box),
})

// File storage API for app data (unlimited size)
contextBridge.exposeInMainWorld('fileStorage', {
  getItem: (key: string) => ipcRenderer.invoke('file-storage-get', key),
  setItem: (key: string, value: string) => ipcRenderer.invoke('file-storage-set', key, value),
  removeItem: (key: string) => ipcRenderer.invoke('file-storage-remove', key),
  exists: (key: string) => ipcRenderer.invoke('file-storage-exists', key),
  listKeys: (prefix: string) => ipcRenderer.invoke('file-storage-list', prefix),
  listDirs: (prefix: string) => ipcRenderer.invoke('file-storage-list-dirs', prefix),
  removeDir: (prefix: string) => ipcRenderer.invoke('file-storage-remove-dir', prefix),
  /** Main gọi lúc before-quit để renderer ghi nốt phần còn treo trong bộ gộp ghi. */
  onFlushRequest: (listener: () => void) => {
    const wrapped = () => listener()
    ipcRenderer.on('app-flush-storage', wrapped)
    return () => ipcRenderer.off('app-flush-storage', wrapped)
  },
})
// Storage manager API for paths, cache, import/export
contextBridge.exposeInMainWorld('storageManager', {
  getPaths: () => ipcRenderer.invoke('storage-get-paths'),
  selectDirectory: () => ipcRenderer.invoke('storage-select-directory'),
  // Unified storage operations (single base path)
  validateDataDir: (dirPath: string) => ipcRenderer.invoke('storage-validate-data-dir', dirPath),
  moveData: (newPath: string) => ipcRenderer.invoke('storage-move-data', newPath),
  linkData: (dirPath: string) => ipcRenderer.invoke('storage-link-data', dirPath),
  exportData: (targetPath: string) => ipcRenderer.invoke('storage-export-data', targetPath),
  importData: (sourcePath: string) => ipcRenderer.invoke('storage-import-data', sourcePath),
  // Cache
  getCacheSize: () => ipcRenderer.invoke('storage-get-cache-size'),
  clearCache: (options?: { olderThanDays?: number }) => ipcRenderer.invoke('storage-clear-cache', options),
  updateConfig: (config: { autoCleanEnabled?: boolean; autoCleanDays?: number }) =>
    ipcRenderer.invoke('storage-update-config', config),
})

contextBridge.exposeInMainWorld('exportStorage', {
  writeFiles: (payload: { baseDir: string; files: Array<{ relativePath: string; data: ArrayBuffer } | { relativePath: string; text: string }> }) =>
    ipcRenderer.invoke('export-write-files', payload),
})

// Electron API for native features
contextBridge.exposeInMainWorld('electronAPI', {
  saveFileDialog: (options: { localPath: string, defaultPath: string, filters: { name: string, extensions: string[] }[] }) =>
    ipcRenderer.invoke('save-file-dialog', options),
})

contextBridge.exposeInMainWorld('autoEditRuntime', {
  pickMedia: () => ipcRenderer.invoke('auto-edit-pick-media'),
  pickJson: () => ipcRenderer.invoke('auto-edit-pick-json'),
  registerMediaPaths: (paths: string[]) => ipcRenderer.invoke('auto-edit-register-media-paths', paths),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  saveText: (payload: { content: string; defaultName: string; extension: string }) =>
    ipcRenderer.invoke('auto-edit-save-text', payload),
  listProjects: () => ipcRenderer.invoke('auto-edit-projects-list'),
  saveProjectFile: (payload: { id: string; content: string }) =>
    ipcRenderer.invoke('auto-edit-project-save', payload),
  loadProjectFile: (filePath: string) => ipcRenderer.invoke('auto-edit-project-load', filePath),
  deleteProject: (filePath: string) => ipcRenderer.invoke('auto-edit-project-delete', filePath),
  renameProject: (payload: { filePath: string; name: string }) =>
    ipcRenderer.invoke('auto-edit-project-rename', payload),
  revealProject: (filePath: string) => ipcRenderer.invoke('auto-edit-project-reveal', filePath),
})

contextBridge.exposeInMainWorld('researchDatabase', {
  load: () => ipcRenderer.invoke('research-db-load'),
  recordScan: (payload: unknown) => ipcRenderer.invoke('research-db-record-scan', payload),
  recordFailure: (payload: unknown) => ipcRenderer.invoke('research-db-record-failure', payload),
  migrateLegacy: (payload: unknown) => ipcRenderer.invoke('research-db-migrate-legacy', payload),
  clearHistory: () => ipcRenderer.invoke('research-db-clear-history'),
})

contextBridge.exposeInMainWorld('appUpdater', {
  getCurrentVersion: () => ipcRenderer.invoke('app-updater-get-current-version'),
  checkForUpdates: () => ipcRenderer.invoke('app-updater-check'),
  downloadAndInstall: () => ipcRenderer.invoke('app-updater-download-and-install'),
  openExternalLink: (url: string) => ipcRenderer.invoke('app-updater-open-link', url),
})

contextBridge.exposeInMainWorld('authBridge', {
  openExternal: (url: string) => ipcRenderer.invoke('auth-open-external', url),
  getDeviceInfo: () => ipcRenderer.invoke('auth-get-device-info'),
  consumePendingCallback: () => ipcRenderer.invoke('auth-consume-pending-callback'),
  onOAuthCallback: (listener: (url: string) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, url: string) => listener(url)
    ipcRenderer.on('auth-oauth-callback', wrapped)
    return () => ipcRenderer.off('auth-oauth-callback', wrapped)
  },
})

contextBridge.exposeInMainWorld('cliRuntime', {
  getStatus: () => ipcRenderer.invoke('cli-runtime-status'),
  install: (adapter: 'claude' | 'opencode' | 'codex') => ipcRenderer.invoke('cli-runtime-install', adapter),
  getModels: (adapter: 'claude' | 'opencode' | 'codex') => ipcRenderer.invoke('cli-runtime-models', adapter),
  getCommands: (adapter: 'claude' | 'opencode' | 'codex', workingDirectory?: string) =>
    ipcRenderer.invoke('cli-runtime-commands', adapter, workingDirectory),
  runTextTask: (payload: {
    adapter: 'claude' | 'opencode' | 'codex'
    prompt: string
    systemPrompt?: string
    model?: string
    effort?: string
    sessionKey?: string
    requestId?: string
    timeoutMs?: number
    workingDirectory?: string
    enableContentMcp?: boolean
  }) => ipcRenderer.invoke('cli-runtime-run-text', payload),
  cancelTextTask: (requestId: string) => ipcRenderer.invoke('cli-runtime-cancel-text', requestId),
  onTaskEvent: (listener: (payload: {
    requestId: string
    type: 'chunk' | 'session' | 'commands'
    chunk?: string
    sessionId?: string
    commands?: Array<{ name: string; description: string; provider: 'claude' | 'opencode' | 'codex'; kind: 'skill' | 'command'; source: 'user' | 'workspace' | 'session' }>
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      requestId: string
      type: 'chunk' | 'session' | 'commands'
      chunk?: string
      sessionId?: string
      commands?: Array<{ name: string; description: string; provider: 'claude' | 'opencode' | 'codex'; kind: 'skill' | 'command'; source: 'user' | 'workspace' | 'session' }>
    }) => listener(payload)
    ipcRenderer.on('cli-runtime-event', wrapped)
    return () => ipcRenderer.off('cli-runtime-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('contentWorkspace', {
  getDefault: () => ipcRenderer.invoke('content-workspace-get-default'),
  ensure: (workspacePath?: string | null) => ipcRenderer.invoke('content-workspace-ensure', workspacePath),
  chooseDirectory: (currentPath?: string | null) => ipcRenderer.invoke('content-workspace-choose', currentPath),
  pickInput: (kind: 'file' | 'folder', workspacePath?: string | null, currentPath?: string | null) =>
    ipcRenderer.invoke('content-workspace-pick-input', { kind, workspacePath, currentPath }),
  prepareBuzzInputs: (workspacePath: string | null | undefined, inputs: Array<{ id: string; name: string; kind: 'file' | 'folder'; path: string }>) =>
    ipcRenderer.invoke('content-workspace-prepare-buzz-inputs', { workspacePath, inputs }),
  verifyBuzzOutput: (workspacePath: string | null | undefined, kind: 'text' | 'file' | 'folder', outputPath: string, text: string) =>
    ipcRenderer.invoke('content-workspace-verify-buzz-output', { workspacePath, kind, outputPath, text }),
  openDirectory: (workspacePath?: string | null) => ipcRenderer.invoke('content-workspace-open', workspacePath),
  previewFile: (workspacePath: string | null | undefined, filePath: string) =>
    ipcRenderer.invoke('content-workspace-preview-file', { workspacePath, filePath }),
  resolveFiles: (workspacePath: string | null | undefined, filePaths: string[]) =>
    ipcRenderer.invoke('content-workspace-resolve-files', { workspacePath, filePaths }),
  openFile: (workspacePath: string | null | undefined, filePath: string) =>
    ipcRenderer.invoke('content-workspace-open-file', { workspacePath, filePath }),
  revealFile: (workspacePath: string | null | undefined, filePath: string) =>
    ipcRenderer.invoke('content-workspace-reveal-file', { workspacePath, filePath }),
  readMemory: (workspacePath?: string | null) => ipcRenderer.invoke('content-workspace-read-memory', workspacePath),
  listTree: (workspacePath?: string | null) => ipcRenderer.invoke('content-workspace-list-tree', workspacePath),
  createFile: (workspacePath: string | null | undefined, relativePath: string, initialContent?: string) =>
    ipcRenderer.invoke('content-workspace-create-file', { workspacePath, relativePath, initialContent }),
  createFolder: (workspacePath: string | null | undefined, relativePath: string) =>
    ipcRenderer.invoke('content-workspace-create-folder', { workspacePath, relativePath }),
  deleteEntry: (workspacePath: string | null | undefined, relativePath: string) =>
    ipcRenderer.invoke('content-workspace-delete-entry', { workspacePath, relativePath }),
})

contextBridge.exposeInMainWorld('contentMcp', {
  ready: () => ipcRenderer.send('content-mcp-ready'),
  respond: (payload: { requestId: string; success: boolean; result?: unknown; error?: string }) =>
    ipcRenderer.send('content-mcp-tool-result', payload),
  onToolCall: (listener: (payload: {
    requestId: string
    name: string
    arguments: Record<string, unknown>
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      requestId: string
      name: string
      arguments: Record<string, unknown>
    }) => listener(payload)
    ipcRenderer.on('content-mcp-tool-call', wrapped)
    return () => ipcRenderer.off('content-mcp-tool-call', wrapped)
  },
})

contextBridge.exposeInMainWorld('ffmpegRuntime', {
  run: (payload: { jobId: string; args: string[]; totalDurationSec?: number }) =>
    ipcRenderer.invoke('ffmpeg-run', payload),
  cancel: (jobId: string) => ipcRenderer.invoke('ffmpeg-cancel', jobId),
  probeDuration: (audioPath: string) => ipcRenderer.invoke('ffmpeg-probe-duration', audioPath),
  probeDimensions: (mediaPath: string) => ipcRenderer.invoke('ffmpeg-probe-dimensions', mediaPath),
  onEvent: (listener: (payload: {
    jobId: string
    type: 'progress' | 'log'
    progress?: { percent: number; timeSec: number; raw: string }
    line?: string
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      jobId: string
      type: 'progress' | 'log'
      progress?: { percent: number; timeSec: number; raw: string }
      line?: string
    }) => listener(payload)
    ipcRenderer.on('ffmpeg-event', wrapped)
    return () => ipcRenderer.off('ffmpeg-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('whisperRuntime', {
  transcribe: (payload: {
    jobId: string
    audioPath: string
    provider: 'openai' | 'groq'
    apiKey: string
    model?: string
    language?: string
    prompt?: string
    chunkDurationSec?: number
  }) => ipcRenderer.invoke('whisper-transcribe', payload),
  cancel: (jobId: string) => ipcRenderer.invoke('whisper-cancel', jobId),
  onProgress: (listener: (event: {
    jobId: string
    type: 'stage' | 'chunk-start' | 'chunk-done' | 'log'
    stage?: 'probing' | 'chunking' | 'uploading' | 'merging' | 'done'
    chunkIndex?: number
    chunkTotal?: number
    percent?: number
    message?: string
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      jobId: string
      type: 'stage' | 'chunk-start' | 'chunk-done' | 'log'
      stage?: 'probing' | 'chunking' | 'uploading' | 'merging' | 'done'
      chunkIndex?: number
      chunkTotal?: number
      percent?: number
      message?: string
    }) => listener(payload)
    ipcRenderer.on('whisper-event', wrapped)
    return () => ipcRenderer.off('whisper-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('mediaToolkit', {
  listProfiles: () => ipcRenderer.invoke('media-toolkit-profiles-list'),
  createProfile: () => ipcRenderer.invoke('media-toolkit-profiles-create'),
  switchProfile: (profileId: string) => ipcRenderer.invoke('media-toolkit-profiles-switch', profileId),
  renameProfile: (payload: { profileId: string; name: string }) => ipcRenderer.invoke('media-toolkit-profiles-rename', payload),
  deleteProfile: (profileId: string) => ipcRenderer.invoke('media-toolkit-profiles-delete', profileId),
  showBrowser: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('media-toolkit-browser-show', bounds),
  setBrowserBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('media-toolkit-browser-bounds', bounds),
  hideBrowser: () => ipcRenderer.invoke('media-toolkit-browser-hide'),
  browserAction: (action: 'back' | 'forward' | 'reload' | 'home') =>
    ipcRenderer.invoke('media-toolkit-browser-action', action),
  navigateBrowser: (url: string) => ipcRenderer.invoke('media-toolkit-browser-navigate', url),
  onBrowserState: (listener: (payload: {
    url: string
    title: string
    canGoBack: boolean
    canGoForward: boolean
    loading: boolean
    error?: string
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      url: string
      title: string
      canGoBack: boolean
      canGoForward: boolean
      loading: boolean
      error?: string
    }) => listener(payload)
    ipcRenderer.on('media-toolkit-browser-state', wrapped)
    return () => ipcRenderer.off('media-toolkit-browser-state', wrapped)
  },
  getStatus: () => ipcRenderer.invoke('media-toolkit-status'),
  install: (jobId: string) => ipcRenderer.invoke('media-toolkit-install', jobId),
  analyze: (payload: { jobId: string; url: string }) => ipcRenderer.invoke('media-toolkit-analyze', payload),
  analyzePlaylist: (payload: { jobId: string; url: string }) => ipcRenderer.invoke('media-toolkit-analyze-playlist', payload),
  chooseDirectory: () => ipcRenderer.invoke('media-toolkit-choose-directory'),
  download: (payload: {
    jobId: string
    url: string
    kind: 'video' | 'audio' | 'subtitle' | 'thumbnail'
    outputDirectory?: string
    quality?: 'best' | '1080' | '720' | '480'
    audioFormat?: 'mp3' | 'm4a' | 'wav'
    subtitleLanguage?: string
    includeAutomatic?: boolean
    startTime?: string
    endTime?: string
    outputSuffix?: string
  }) => ipcRenderer.invoke('media-toolkit-download', payload),
  cancel: (jobId: string) => ipcRenderer.invoke('media-toolkit-cancel', jobId),
  saveSubtitle: (payload: { srt: string; defaultName: string }) => ipcRenderer.invoke('media-toolkit-save-subtitle', payload),
  reveal: (filePath: string) => ipcRenderer.invoke('media-toolkit-reveal', filePath),
  openSource: (url: string) => ipcRenderer.invoke('media-toolkit-open-source', url),
  onProgress: (listener: (payload: {
    jobId: string
    stage: 'installing' | 'analyzing' | 'downloading' | 'processing' | 'done' | 'error'
    percent?: number
    message?: string
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      jobId: string
      stage: 'installing' | 'analyzing' | 'downloading' | 'processing' | 'done' | 'error'
      percent?: number
      message?: string
    }) => listener(payload)
    ipcRenderer.on('media-toolkit-event', wrapped)
    return () => ipcRenderer.off('media-toolkit-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('googleFlowRuntime', {
  getStatus: () => ipcRenderer.invoke('google-flow:get-status'),
  listCredentials: () => ipcRenderer.invoke('google-flow:list-credentials'),
  getCapacity: () => ipcRenderer.invoke('google-flow:get-capacity'),
  listProjectBindings: (longddProjectId: string) => ipcRenderer.invoke('google-flow:list-project-bindings', longddProjectId),
  createProjectBinding: (payload: unknown) => ipcRenderer.invoke('google-flow:create-project-binding', payload),
  activateProjectBinding: (payload: unknown) => ipcRenderer.invoke('google-flow:activate-project-binding', payload),
  syncReferences: (payload: unknown) => ipcRenderer.invoke('google-flow:sync-references', payload),
  clearQuotaLocks: (payload?: unknown) => ipcRenderer.invoke('google-flow:clear-quota-locks', payload),
  openFlow: () => ipcRenderer.invoke('google-flow:open-flow'),
  updateSettings: (payload: unknown) => ipcRenderer.invoke('google-flow:update-settings', payload),
  generateImage: (payload: unknown) => ipcRenderer.invoke('google-flow:generate-image', payload),
  generateVideo: (payload: unknown) => ipcRenderer.invoke('google-flow:generate-video', payload),
  upscaleVideo: (payload: unknown) => ipcRenderer.invoke('google-flow:upscale-video', payload),
  cancelTask: (taskId: string) => ipcRenderer.invoke('google-flow:cancel-task', taskId),
  listInAppAccounts: () => ipcRenderer.invoke('google-flow:list-inapp-accounts'),
  addInAppAccount: () => ipcRenderer.invoke('google-flow:add-inapp-account'),
  removeInAppAccount: (accountSlotId: string) => ipcRenderer.invoke('google-flow:remove-inapp-account', accountSlotId),
  showInAppAccount: (accountSlotId: string) => ipcRenderer.invoke('google-flow:show-inapp-account', accountSlotId),
  refreshInAppAccounts: () => ipcRenderer.invoke('google-flow:refresh-inapp-accounts'),
  onStatus: (listener: (payload: unknown) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on('google-flow:status-event', wrapped)
    return () => ipcRenderer.off('google-flow:status-event', wrapped)
  },
  onTask: (listener: (payload: unknown) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on('google-flow:task-event', wrapped)
    return () => ipcRenderer.off('google-flow:task-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('grokVideoRuntime', {
  getStatus: () => ipcRenderer.invoke('grok:get-status'),
  refreshQuota: () => ipcRenderer.invoke('grok:refresh-quota'),
  getCapacity: () => ipcRenderer.invoke('grok:get-capacity'),
  updateSettings: (payload: unknown) => ipcRenderer.invoke('grok:update-settings', payload),
  openGrok: () => ipcRenderer.invoke('grok:open'),
  generateVideo: (payload: unknown) => ipcRenderer.invoke('grok:generate-video', payload),
  cancelTask: (taskId: string) => ipcRenderer.invoke('grok:cancel-task', taskId),
  listInAppAccounts: () => ipcRenderer.invoke('grok:list-inapp-accounts'),
  addInAppAccount: () => ipcRenderer.invoke('grok:add-inapp-account'),
  removeInAppAccount: (accountSlotId: string) => ipcRenderer.invoke('grok:remove-inapp-account', accountSlotId),
  showInAppAccount: (accountSlotId: string) => ipcRenderer.invoke('grok:show-inapp-account', accountSlotId),
  onStatus: (listener: (payload: unknown) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on('grok:status-event', wrapped)
    return () => ipcRenderer.off('grok:status-event', wrapped)
  },
  onTask: (listener: (payload: unknown) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: unknown) => listener(payload)
    ipcRenderer.on('grok:task-event', wrapped)
    return () => ipcRenderer.off('grok:task-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('videoStudioBrowser', {
  startRuntimes: () => ipcRenderer.invoke('vs-browser:start-runtimes'),
  setHideAfterLogin: (value: boolean) => ipcRenderer.invoke('vs-browser:set-hide-after-login', value),
})

contextBridge.exposeInMainWorld('ttsRuntime', {
  getModelStatuses: (models: Array<{ id: string; repository: string; capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu' }>) =>
    ipcRenderer.invoke('tts-model-statuses', models),
  installModel: (payload: { jobId: string; model: { id: string; repository: string; capability: 'omnivoice' | 'capcut' | 'gemini' | 'vbee' | 'vieneu' } }) =>
    ipcRenderer.invoke('tts-model-install', payload),
  removeModel: (modelId: string) => ipcRenderer.invoke('tts-model-remove', modelId),
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
    advancedSettings?: import('../src/features/tts-voice/types').TtsAdvancedSettings;
    instruction?: string;
    profileId?: string;
    referenceAudioPath?: string;
    referenceText?: string;
  }) => ipcRenderer.invoke('tts-generate', payload),
  getGeminiApiKeys: () => ipcRenderer.invoke('tts-gemini-keys-get'),
  setGeminiApiKeys: (keys: string[]) => ipcRenderer.invoke('tts-gemini-keys-set', keys),
  getVbeeCredentials: () => ipcRenderer.invoke('tts-vbee-credentials-get'),
  setVbeeCredentials: (input: { appId: string; token: string }) => ipcRenderer.invoke('tts-vbee-credentials-set', input),
  getVbeeVoices: (force?: boolean) => ipcRenderer.invoke('tts-vbee-voices-get', force),
  getVieneuVoices: () => ipcRenderer.invoke('tts-vieneu-voices-get'),
  cancel: (jobId: string) => ipcRenderer.invoke('tts-cancel', jobId),
  pickReferenceAudio: (title?: string) => ipcRenderer.invoke('tts-pick-reference-audio', title),
  exportAudio: (sourcePath: string, title?: string) => ipcRenderer.invoke('tts-export-audio', sourcePath, title),
  revealAudio: (filePath: string) => ipcRenderer.invoke('tts-reveal-audio', filePath),
  onEvent: (listener: (payload: {
    jobId: string;
    kind: 'install' | 'generate';
    stage: string;
    percent?: number;
    message: string;
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      jobId: string;
      kind: 'install' | 'generate';
      stage: string;
      percent?: number;
      message: string;
    }) => listener(payload)
    ipcRenderer.on('tts-runtime-event', wrapped)
    return () => ipcRenderer.off('tts-runtime-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('autoVideoRuntime', {
  render: (payload: {
    jobId: string
    audioPath: string
    audioStartMs?: number
    audioEndMs?: number
    segments: Array<{
      index: number
      startMs: number
      endMs: number
      text: string
      imagePath: string
      videoPath?: string
	  sourceStartMs?: number
	    mediaEffect?: 'none' | 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'pan_up' | 'pan_down' | 'zoom_pan_left' | 'zoom_pan_right'
	    transitionToNext?: import('../src/features/video-studio/lib/auto-video/types').AutoVideoTransition
      sfxPath?: string
    }>
    captionSegments?: Array<{
      index: number
      startMs: number
      endMs: number
      text: string
    }>
    mediaMode?: 'image' | 'video'
    resolution: '1280x720' | '1920x1080' | '3840x2160'
    fps: 24 | 30 | 60
    codec: 'libx264' | 'libx265' | 'h264_nvenc'
    crf: number
    outputPath?: string
    burnSubtitles?: boolean
    subtitleFontSize?: number
    bgmPath?: string
    bgmVolume?: number
    bgmDuckVoice?: boolean
    audioNormalize?: boolean
    videoAudioVolume?: number
    masterFromSegments?: boolean
  }) => ipcRenderer.invoke('auto-video-render', payload),
  cancel: (jobId: string) => ipcRenderer.invoke('auto-video-cancel', jobId),
  pickOutput: (defaultName: string) => ipcRenderer.invoke('auto-video-pick-output', defaultName),
  showInFolder: (filePath: string) => ipcRenderer.invoke('auto-video-show-in-folder', filePath),
  openFile: (filePath: string) => ipcRenderer.invoke('auto-video-open-file', filePath),
  onEvent: (listener: (event: {
    jobId: string
    type: 'stage' | 'segment-start' | 'segment-done' | 'concat-progress' | 'log'
    stage?: 'preparing' | 'building-segments' | 'concatenating' | 'done' | 'error'
    segmentIndex?: number
    segmentTotal?: number
    percent?: number
    message?: string
  }) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: {
      jobId: string
      type: 'stage' | 'segment-start' | 'segment-done' | 'concat-progress' | 'log'
      stage?: 'preparing' | 'building-segments' | 'concatenating' | 'done' | 'error'
      segmentIndex?: number
      segmentTotal?: number
      percent?: number
      message?: string
    }) => listener(payload)
    ipcRenderer.on('auto-video-render-event', wrapped)
    return () => ipcRenderer.off('auto-video-render-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('editorRenderRuntime', {
  render: (payload: {
    jobId: string
    plan: import('../src/features/auto-edit/render/types').RenderPlan
    outputPath: string
    options?: import('../src/features/auto-edit/render/types').ExportOptions
  }) => ipcRenderer.invoke('editor-render', payload),
  cancel: (jobId: string) => ipcRenderer.invoke('editor-render-cancel', jobId),
  pickOutput: (defaultName: string) => ipcRenderer.invoke('editor-render-pick-output', defaultName),
  showInFolder: (filePath: string) => ipcRenderer.invoke('editor-render-show-in-folder', filePath),
  onEvent: (listener: (event: import('../src/features/auto-edit/render/types').RenderProgressEvent) => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: import('../src/features/auto-edit/render/types').RenderProgressEvent) => listener(payload)
    ipcRenderer.on('editor-render-event', wrapped)
    return () => ipcRenderer.off('editor-render-event', wrapped)
  },
})

contextBridge.exposeInMainWorld('autopilotBridge', {
  getServerStatus: () => ipcRenderer.invoke('autopilot-server-status'),
  onRequest: (handler: (request: {
    requestId: string
    method: string
    path: string
    query: Record<string, string>
    body?: unknown
  }, emit: (event: unknown) => void) => Promise<{ status: number; body: unknown }>) => {
    const wrapped = (_event: Electron.IpcRendererEvent, request: {
      requestId: string
      method: string
      path: string
      query: Record<string, string>
      body?: unknown
    }) => {
      const emit = (event: unknown) => {
        ipcRenderer.send('autopilot:sse-event', request.requestId, event)
      }
      void handler(request, emit).then((response) => {
        ipcRenderer.send('autopilot:http-response', request.requestId, response.status, response.body)
      })
    }
    ipcRenderer.on('autopilot:http-request', wrapped)
    return () => ipcRenderer.off('autopilot:http-request', wrapped)
  },
})

contextBridge.exposeInMainWorld('imageHostUploader', {
  upload: (payload: {
    provider: {
      name: string
      platform: string
      baseUrl?: string
      uploadPath?: string
      apiKeyParam?: string
      apiKeyHeader?: string
      apiKeyFormField?: string
      expirationParam?: string
      imageField?: string
      imagePayloadType?: 'base64' | 'file'
      nameField?: string
      staticFormFields?: Record<string, string>
      responseUrlField?: string
      responseDeleteUrlField?: string
    }
    apiKey: string
    imageData: string
    options?: {
      name?: string
      expiration?: number
    }
  }) => ipcRenderer.invoke('image-host-upload', payload),
})

contextBridge.exposeInMainWorld('systemResources', {
  getMetrics: () => ipcRenderer.invoke('system:get-resource-metrics'),
  cancelProcess: (processId: string) => ipcRenderer.invoke('system:cancel-managed-process', processId),
  onMetricsUpdate: (callback: (metrics: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('system:resource-metrics-update', handler)
    return () => ipcRenderer.off('system:resource-metrics-update', handler)
  },
})

