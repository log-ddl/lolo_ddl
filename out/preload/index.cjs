"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("imageStorage", {
  searchWebImages: (query, limit) => electron.ipcRenderer.invoke("search-web-images", { query, limit }),
  // Save image from URL to local storage
  saveImage: (url, category, filename, sourcePageUrl) => electron.ipcRenderer.invoke("save-image", { url, category, filename, sourcePageUrl }),
  // Get actual file path for a local-image:// URL
  getImagePath: (localPath) => electron.ipcRenderer.invoke("get-image-path", localPath),
  // Delete a locally stored image
  deleteImage: (localPath) => electron.ipcRenderer.invoke("delete-image", localPath),
  // Read local image as base64 (for AI API calls like video generation)
  readAsBase64: (localPath) => electron.ipcRenderer.invoke("read-image-base64", localPath),
  // Get absolute file path (for local video generation tools like FFmpeg)
  getAbsolutePath: (localPath) => electron.ipcRenderer.invoke("get-absolute-path", localPath)
});
electron.contextBridge.exposeInMainWorld("watermarkRemoval", {
  remove: (localPath, box) => electron.ipcRenderer.invoke("watermark-remove", localPath, box)
});
electron.contextBridge.exposeInMainWorld("fileStorage", {
  getItem: (key) => electron.ipcRenderer.invoke("file-storage-get", key),
  setItem: (key, value) => electron.ipcRenderer.invoke("file-storage-set", key, value),
  removeItem: (key) => electron.ipcRenderer.invoke("file-storage-remove", key),
  exists: (key) => electron.ipcRenderer.invoke("file-storage-exists", key),
  listKeys: (prefix) => electron.ipcRenderer.invoke("file-storage-list", prefix),
  listDirs: (prefix) => electron.ipcRenderer.invoke("file-storage-list-dirs", prefix),
  removeDir: (prefix) => electron.ipcRenderer.invoke("file-storage-remove-dir", prefix),
  /** Main gọi lúc before-quit để renderer ghi nốt phần còn treo trong bộ gộp ghi. */
  onFlushRequest: (listener) => {
    const wrapped = () => listener();
    electron.ipcRenderer.on("app-flush-storage", wrapped);
    return () => electron.ipcRenderer.off("app-flush-storage", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("storageManager", {
  getPaths: () => electron.ipcRenderer.invoke("storage-get-paths"),
  selectDirectory: () => electron.ipcRenderer.invoke("storage-select-directory"),
  // Unified storage operations (single base path)
  validateDataDir: (dirPath) => electron.ipcRenderer.invoke("storage-validate-data-dir", dirPath),
  moveData: (newPath) => electron.ipcRenderer.invoke("storage-move-data", newPath),
  linkData: (dirPath) => electron.ipcRenderer.invoke("storage-link-data", dirPath),
  exportData: (targetPath) => electron.ipcRenderer.invoke("storage-export-data", targetPath),
  importData: (sourcePath) => electron.ipcRenderer.invoke("storage-import-data", sourcePath),
  // Cache
  getCacheSize: () => electron.ipcRenderer.invoke("storage-get-cache-size"),
  clearCache: (options) => electron.ipcRenderer.invoke("storage-clear-cache", options),
  updateConfig: (config) => electron.ipcRenderer.invoke("storage-update-config", config)
});
electron.contextBridge.exposeInMainWorld("exportStorage", {
  writeFiles: (payload) => electron.ipcRenderer.invoke("export-write-files", payload)
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  saveFileDialog: (options) => electron.ipcRenderer.invoke("save-file-dialog", options)
});
electron.contextBridge.exposeInMainWorld("autoEditRuntime", {
  pickMedia: () => electron.ipcRenderer.invoke("auto-edit-pick-media"),
  pickJson: () => electron.ipcRenderer.invoke("auto-edit-pick-json"),
  registerMediaPaths: (paths) => electron.ipcRenderer.invoke("auto-edit-register-media-paths", paths),
  getPathForFile: (file) => electron.webUtils.getPathForFile(file),
  saveText: (payload) => electron.ipcRenderer.invoke("auto-edit-save-text", payload),
  listProjects: () => electron.ipcRenderer.invoke("auto-edit-projects-list"),
  saveProjectFile: (payload) => electron.ipcRenderer.invoke("auto-edit-project-save", payload),
  loadProjectFile: (filePath) => electron.ipcRenderer.invoke("auto-edit-project-load", filePath),
  deleteProject: (filePath) => electron.ipcRenderer.invoke("auto-edit-project-delete", filePath),
  renameProject: (payload) => electron.ipcRenderer.invoke("auto-edit-project-rename", payload),
  revealProject: (filePath) => electron.ipcRenderer.invoke("auto-edit-project-reveal", filePath)
});
electron.contextBridge.exposeInMainWorld("researchDatabase", {
  load: () => electron.ipcRenderer.invoke("research-db-load"),
  recordScan: (payload) => electron.ipcRenderer.invoke("research-db-record-scan", payload),
  recordFailure: (payload) => electron.ipcRenderer.invoke("research-db-record-failure", payload),
  migrateLegacy: (payload) => electron.ipcRenderer.invoke("research-db-migrate-legacy", payload),
  clearHistory: () => electron.ipcRenderer.invoke("research-db-clear-history")
});
electron.contextBridge.exposeInMainWorld("appUpdater", {
  getCurrentVersion: () => electron.ipcRenderer.invoke("app-updater-get-current-version"),
  checkForUpdates: () => electron.ipcRenderer.invoke("app-updater-check"),
  downloadAndInstall: () => electron.ipcRenderer.invoke("app-updater-download-and-install"),
  openExternalLink: (url) => electron.ipcRenderer.invoke("app-updater-open-link", url)
});
electron.contextBridge.exposeInMainWorld("authBridge", {
  openExternal: (url) => electron.ipcRenderer.invoke("auth-open-external", url),
  getDeviceInfo: () => electron.ipcRenderer.invoke("auth-get-device-info"),
  consumePendingCallback: () => electron.ipcRenderer.invoke("auth-consume-pending-callback"),
  onOAuthCallback: (listener) => {
    const wrapped = (_event, url) => listener(url);
    electron.ipcRenderer.on("auth-oauth-callback", wrapped);
    return () => electron.ipcRenderer.off("auth-oauth-callback", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("cliRuntime", {
  getStatus: () => electron.ipcRenderer.invoke("cli-runtime-status"),
  install: (adapter) => electron.ipcRenderer.invoke("cli-runtime-install", adapter),
  getModels: (adapter) => electron.ipcRenderer.invoke("cli-runtime-models", adapter),
  getCommands: (adapter, workingDirectory) => electron.ipcRenderer.invoke("cli-runtime-commands", adapter, workingDirectory),
  runTextTask: (payload) => electron.ipcRenderer.invoke("cli-runtime-run-text", payload),
  cancelTextTask: (requestId) => electron.ipcRenderer.invoke("cli-runtime-cancel-text", requestId),
  onTaskEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("cli-runtime-event", wrapped);
    return () => electron.ipcRenderer.off("cli-runtime-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("contentWorkspace", {
  getDefault: () => electron.ipcRenderer.invoke("content-workspace-get-default"),
  ensure: (workspacePath) => electron.ipcRenderer.invoke("content-workspace-ensure", workspacePath),
  chooseDirectory: (currentPath) => electron.ipcRenderer.invoke("content-workspace-choose", currentPath),
  pickInput: (kind, workspacePath, currentPath) => electron.ipcRenderer.invoke("content-workspace-pick-input", { kind, workspacePath, currentPath }),
  prepareBuzzInputs: (workspacePath, inputs) => electron.ipcRenderer.invoke("content-workspace-prepare-buzz-inputs", { workspacePath, inputs }),
  verifyBuzzOutput: (workspacePath, kind, outputPath, text) => electron.ipcRenderer.invoke("content-workspace-verify-buzz-output", { workspacePath, kind, outputPath, text }),
  openDirectory: (workspacePath) => electron.ipcRenderer.invoke("content-workspace-open", workspacePath),
  previewFile: (workspacePath, filePath) => electron.ipcRenderer.invoke("content-workspace-preview-file", { workspacePath, filePath }),
  resolveFiles: (workspacePath, filePaths) => electron.ipcRenderer.invoke("content-workspace-resolve-files", { workspacePath, filePaths }),
  openFile: (workspacePath, filePath) => electron.ipcRenderer.invoke("content-workspace-open-file", { workspacePath, filePath }),
  revealFile: (workspacePath, filePath) => electron.ipcRenderer.invoke("content-workspace-reveal-file", { workspacePath, filePath }),
  readMemory: (workspacePath) => electron.ipcRenderer.invoke("content-workspace-read-memory", workspacePath),
  writeMemory: (workspacePath, content) => electron.ipcRenderer.invoke("content-workspace-write-memory", { workspacePath, content })
});
electron.contextBridge.exposeInMainWorld("contentMcp", {
  ready: () => electron.ipcRenderer.send("content-mcp-ready"),
  respond: (payload) => electron.ipcRenderer.send("content-mcp-tool-result", payload),
  onToolCall: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("content-mcp-tool-call", wrapped);
    return () => electron.ipcRenderer.off("content-mcp-tool-call", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("ffmpegRuntime", {
  run: (payload) => electron.ipcRenderer.invoke("ffmpeg-run", payload),
  cancel: (jobId) => electron.ipcRenderer.invoke("ffmpeg-cancel", jobId),
  probeDuration: (audioPath) => electron.ipcRenderer.invoke("ffmpeg-probe-duration", audioPath),
  probeDimensions: (mediaPath) => electron.ipcRenderer.invoke("ffmpeg-probe-dimensions", mediaPath),
  onEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("ffmpeg-event", wrapped);
    return () => electron.ipcRenderer.off("ffmpeg-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("whisperRuntime", {
  transcribe: (payload) => electron.ipcRenderer.invoke("whisper-transcribe", payload),
  cancel: (jobId) => electron.ipcRenderer.invoke("whisper-cancel", jobId),
  onProgress: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("whisper-event", wrapped);
    return () => electron.ipcRenderer.off("whisper-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("mediaToolkit", {
  listProfiles: () => electron.ipcRenderer.invoke("media-toolkit-profiles-list"),
  createProfile: () => electron.ipcRenderer.invoke("media-toolkit-profiles-create"),
  switchProfile: (profileId) => electron.ipcRenderer.invoke("media-toolkit-profiles-switch", profileId),
  renameProfile: (payload) => electron.ipcRenderer.invoke("media-toolkit-profiles-rename", payload),
  deleteProfile: (profileId) => electron.ipcRenderer.invoke("media-toolkit-profiles-delete", profileId),
  showBrowser: (bounds) => electron.ipcRenderer.invoke("media-toolkit-browser-show", bounds),
  setBrowserBounds: (bounds) => electron.ipcRenderer.invoke("media-toolkit-browser-bounds", bounds),
  hideBrowser: () => electron.ipcRenderer.invoke("media-toolkit-browser-hide"),
  browserAction: (action) => electron.ipcRenderer.invoke("media-toolkit-browser-action", action),
  navigateBrowser: (url) => electron.ipcRenderer.invoke("media-toolkit-browser-navigate", url),
  onBrowserState: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("media-toolkit-browser-state", wrapped);
    return () => electron.ipcRenderer.off("media-toolkit-browser-state", wrapped);
  },
  getStatus: () => electron.ipcRenderer.invoke("media-toolkit-status"),
  install: (jobId) => electron.ipcRenderer.invoke("media-toolkit-install", jobId),
  analyze: (payload) => electron.ipcRenderer.invoke("media-toolkit-analyze", payload),
  analyzePlaylist: (payload) => electron.ipcRenderer.invoke("media-toolkit-analyze-playlist", payload),
  chooseDirectory: () => electron.ipcRenderer.invoke("media-toolkit-choose-directory"),
  download: (payload) => electron.ipcRenderer.invoke("media-toolkit-download", payload),
  cancel: (jobId) => electron.ipcRenderer.invoke("media-toolkit-cancel", jobId),
  saveSubtitle: (payload) => electron.ipcRenderer.invoke("media-toolkit-save-subtitle", payload),
  reveal: (filePath) => electron.ipcRenderer.invoke("media-toolkit-reveal", filePath),
  openSource: (url) => electron.ipcRenderer.invoke("media-toolkit-open-source", url),
  onProgress: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("media-toolkit-event", wrapped);
    return () => electron.ipcRenderer.off("media-toolkit-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("googleFlowRuntime", {
  getStatus: () => electron.ipcRenderer.invoke("google-flow:get-status"),
  listCredentials: () => electron.ipcRenderer.invoke("google-flow:list-credentials"),
  getCapacity: () => electron.ipcRenderer.invoke("google-flow:get-capacity"),
  listProjectBindings: (longddProjectId) => electron.ipcRenderer.invoke("google-flow:list-project-bindings", longddProjectId),
  createProjectBinding: (payload) => electron.ipcRenderer.invoke("google-flow:create-project-binding", payload),
  activateProjectBinding: (payload) => electron.ipcRenderer.invoke("google-flow:activate-project-binding", payload),
  syncReferences: (payload) => electron.ipcRenderer.invoke("google-flow:sync-references", payload),
  openFlow: () => electron.ipcRenderer.invoke("google-flow:open-flow"),
  updateSettings: (payload) => electron.ipcRenderer.invoke("google-flow:update-settings", payload),
  generateImage: (payload) => electron.ipcRenderer.invoke("google-flow:generate-image", payload),
  generateVideo: (payload) => electron.ipcRenderer.invoke("google-flow:generate-video", payload),
  upscaleVideo: (payload) => electron.ipcRenderer.invoke("google-flow:upscale-video", payload),
  cancelTask: (taskId) => electron.ipcRenderer.invoke("google-flow:cancel-task", taskId),
  listInAppAccounts: () => electron.ipcRenderer.invoke("google-flow:list-inapp-accounts"),
  addInAppAccount: () => electron.ipcRenderer.invoke("google-flow:add-inapp-account"),
  removeInAppAccount: (accountSlotId) => electron.ipcRenderer.invoke("google-flow:remove-inapp-account", accountSlotId),
  showInAppAccount: (accountSlotId) => electron.ipcRenderer.invoke("google-flow:show-inapp-account", accountSlotId),
  refreshInAppAccounts: () => electron.ipcRenderer.invoke("google-flow:refresh-inapp-accounts"),
  onStatus: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("google-flow:status-event", wrapped);
    return () => electron.ipcRenderer.off("google-flow:status-event", wrapped);
  },
  onTask: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("google-flow:task-event", wrapped);
    return () => electron.ipcRenderer.off("google-flow:task-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("grokVideoRuntime", {
  getStatus: () => electron.ipcRenderer.invoke("grok:get-status"),
  refreshQuota: () => electron.ipcRenderer.invoke("grok:refresh-quota"),
  getCapacity: () => electron.ipcRenderer.invoke("grok:get-capacity"),
  updateSettings: (payload) => electron.ipcRenderer.invoke("grok:update-settings", payload),
  openGrok: () => electron.ipcRenderer.invoke("grok:open"),
  generateVideo: (payload) => electron.ipcRenderer.invoke("grok:generate-video", payload),
  cancelTask: (taskId) => electron.ipcRenderer.invoke("grok:cancel-task", taskId),
  listInAppAccounts: () => electron.ipcRenderer.invoke("grok:list-inapp-accounts"),
  addInAppAccount: () => electron.ipcRenderer.invoke("grok:add-inapp-account"),
  removeInAppAccount: (accountSlotId) => electron.ipcRenderer.invoke("grok:remove-inapp-account", accountSlotId),
  showInAppAccount: (accountSlotId) => electron.ipcRenderer.invoke("grok:show-inapp-account", accountSlotId),
  onStatus: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("grok:status-event", wrapped);
    return () => electron.ipcRenderer.off("grok:status-event", wrapped);
  },
  onTask: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("grok:task-event", wrapped);
    return () => electron.ipcRenderer.off("grok:task-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("videoStudioBrowser", {
  startRuntimes: () => electron.ipcRenderer.invoke("vs-browser:start-runtimes"),
  setHideAfterLogin: (value) => electron.ipcRenderer.invoke("vs-browser:set-hide-after-login", value)
});
electron.contextBridge.exposeInMainWorld("ttsRuntime", {
  getModelStatuses: (models) => electron.ipcRenderer.invoke("tts-model-statuses", models),
  installModel: (payload) => electron.ipcRenderer.invoke("tts-model-install", payload),
  removeModel: (modelId) => electron.ipcRenderer.invoke("tts-model-remove", modelId),
  generate: (payload) => electron.ipcRenderer.invoke("tts-generate", payload),
  getGeminiApiKeys: () => electron.ipcRenderer.invoke("tts-gemini-keys-get"),
  setGeminiApiKeys: (keys) => electron.ipcRenderer.invoke("tts-gemini-keys-set", keys),
  getVbeeCredentials: () => electron.ipcRenderer.invoke("tts-vbee-credentials-get"),
  setVbeeCredentials: (input) => electron.ipcRenderer.invoke("tts-vbee-credentials-set", input),
  getVbeeVoices: (force) => electron.ipcRenderer.invoke("tts-vbee-voices-get", force),
  getVieneuVoices: () => electron.ipcRenderer.invoke("tts-vieneu-voices-get"),
  cancel: (jobId) => electron.ipcRenderer.invoke("tts-cancel", jobId),
  pickReferenceAudio: (title) => electron.ipcRenderer.invoke("tts-pick-reference-audio", title),
  exportAudio: (sourcePath, title) => electron.ipcRenderer.invoke("tts-export-audio", sourcePath, title),
  revealAudio: (filePath) => electron.ipcRenderer.invoke("tts-reveal-audio", filePath),
  onEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("tts-runtime-event", wrapped);
    return () => electron.ipcRenderer.off("tts-runtime-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("autoVideoRuntime", {
  render: (payload) => electron.ipcRenderer.invoke("auto-video-render", payload),
  cancel: (jobId) => electron.ipcRenderer.invoke("auto-video-cancel", jobId),
  pickOutput: (defaultName) => electron.ipcRenderer.invoke("auto-video-pick-output", defaultName),
  showInFolder: (filePath) => electron.ipcRenderer.invoke("auto-video-show-in-folder", filePath),
  openFile: (filePath) => electron.ipcRenderer.invoke("auto-video-open-file", filePath),
  onEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("auto-video-render-event", wrapped);
    return () => electron.ipcRenderer.off("auto-video-render-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("editorRenderRuntime", {
  render: (payload) => electron.ipcRenderer.invoke("editor-render", payload),
  cancel: (jobId) => electron.ipcRenderer.invoke("editor-render-cancel", jobId),
  pickOutput: (defaultName) => electron.ipcRenderer.invoke("editor-render-pick-output", defaultName),
  showInFolder: (filePath) => electron.ipcRenderer.invoke("editor-render-show-in-folder", filePath),
  onEvent: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    electron.ipcRenderer.on("editor-render-event", wrapped);
    return () => electron.ipcRenderer.off("editor-render-event", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("autopilotBridge", {
  getServerStatus: () => electron.ipcRenderer.invoke("autopilot-server-status"),
  onRequest: (handler) => {
    const wrapped = (_event, request) => {
      const emit = (event) => {
        electron.ipcRenderer.send("autopilot:sse-event", request.requestId, event);
      };
      void handler(request, emit).then((response) => {
        electron.ipcRenderer.send("autopilot:http-response", request.requestId, response.status, response.body);
      });
    };
    electron.ipcRenderer.on("autopilot:http-request", wrapped);
    return () => electron.ipcRenderer.off("autopilot:http-request", wrapped);
  }
});
electron.contextBridge.exposeInMainWorld("imageHostUploader", {
  upload: (payload) => electron.ipcRenderer.invoke("image-host-upload", payload)
});
