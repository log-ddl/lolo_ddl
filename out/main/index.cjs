"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const path = require("node:path");
const electron = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const node_child_process = require("node:child_process");
const net = require("node:net");
const http = require("node:http");
const ws = require("ws");
const node_url = require("node:url");
const node_stream = require("node:stream");
const https = require("node:https");
const electronUpdater = require("electron-updater");
const ffmpegStaticPath = require("ffmpeg-static");
const readline = require("node:readline");
const Database = require("better-sqlite3");
const node_zlib = require("node:zlib");
process.env.APP_ROOT = path.join(__dirname, "../..");
const VITE_DEV_SERVER_URL = process.env["ELECTRON_RENDERER_URL"] || process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(__dirname);
const RENDERER_DIST = path.join(__dirname, "../renderer");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const APP_ROOT = process.env.APP_ROOT;
const productName = "logdd";
const packageMetadata = {
  productName
};
let win = null;
let onDidFinishLoadHook = null;
const appIconPath = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, "build", "icon.ico") : path.join(process.resourcesPath, "build", "icon.ico");
function getMainWindow() {
  return win && !win.isDestroyed() ? win : null;
}
function focusMainWindow() {
  const target = getMainWindow();
  if (!target) return;
  if (target.isMinimized()) target.restore();
  target.show();
  target.focus();
}
function sendToMainWindow(channel, ...args) {
  getMainWindow()?.webContents.send(channel, ...args);
}
function broadcastToWindows(channel, ...args) {
  for (const window of electron.BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, ...args);
  }
}
function findAppWebContents() {
  const windows = electron.BrowserWindow.getAllWindows();
  return windows.find((item) => !item.isDestroyed() && item.webContents.getURL().includes("index.html"))?.webContents ?? windows.find((item) => !item.isDestroyed())?.webContents ?? null;
}
function createMainWindow(onDidFinishLoad) {
  if (onDidFinishLoad) onDidFinishLoadHook = onDidFinishLoad;
  win = new electron.BrowserWindow({
    title: packageMetadata.productName,
    icon: appIconPath,
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    // autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs")
      // devTools: Boolean(VITE_DEV_SERVER_URL),
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    onDidFinishLoadHook?.();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL)) return;
    if (url.startsWith("file://")) return;
    event.preventDefault();
    electron.shell.openExternal(url);
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function registerWindowLifecycle() {
  electron.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      electron.app.quit();
      win = null;
    }
  });
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function sanitizeExternalUrl(value) {
  if (!isNonEmptyString(value)) return void 0;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return void 0;
    }
    return parsed.toString();
  } catch {
    return void 0;
  }
}
const AUTH_CALLBACK_SCHEME = "logdd";
let pendingAuthCallbackUrl = null;
function deliverAuthCallback(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== `${AUTH_CALLBACK_SCHEME}:` || url.hostname !== "auth" || url.pathname !== "/callback") {
      return;
    }
    pendingAuthCallbackUrl = url.toString();
    if (getMainWindow()) {
      sendToMainWindow("auth-oauth-callback", pendingAuthCallbackUrl);
      pendingAuthCallbackUrl = null;
      focusMainWindow();
    }
  } catch {
  }
}
function flushPendingAuthCallback() {
  if (!pendingAuthCallbackUrl) return;
  sendToMainWindow("auth-oauth-callback", pendingAuthCallbackUrl);
}
function findAuthCallbackArg(argv) {
  return argv.find((arg) => arg.startsWith(`${AUTH_CALLBACK_SCHEME}://`));
}
function getOrCreateAuthDeviceInfo() {
  const deviceIdPath = path.join(electron.app.getPath("userData"), "auth-device-id");
  let localId = "";
  try {
    localId = fs.readFileSync(deviceIdPath, "utf8").trim();
  } catch {
  }
  if (!localId) {
    localId = crypto.randomUUID();
    fs.writeFileSync(deviceIdPath, localId, { encoding: "utf8", mode: 384 });
  }
  const deviceHash = crypto.createHash("sha256").update(`${localId}:${process.platform}:${process.arch}`).digest("hex");
  return {
    deviceHash,
    deviceName: os.hostname() || `${process.platform}-${process.arch}`
  };
}
function registerAuthIpc() {
  electron.ipcMain.handle("auth-open-external", async (_event, url) => {
    const safeUrl = sanitizeExternalUrl(url);
    if (!safeUrl) return { success: false, error: "Invalid authentication URL" };
    try {
      await electron.shell.openExternal(safeUrl);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("auth-get-device-info", async () => getOrCreateAuthDeviceInfo());
  electron.ipcMain.handle("auth-consume-pending-callback", async () => {
    const callbackUrl = pendingAuthCallbackUrl;
    pendingAuthCallbackUrl = null;
    return callbackUrl;
  });
}
const DEFAULT_STORAGE_CONFIG = {
  basePath: "",
  projectPath: "",
  mediaPath: "",
  autoCleanEnabled: false,
  autoCleanDays: 30
};
const storageConfigPath = path.join(electron.app.getPath("userData"), "storage-config.json");
let autoCleanInterval = null;
function loadStorageConfig() {
  try {
    if (fs.existsSync(storageConfigPath)) {
      const raw = fs.readFileSync(storageConfigPath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORAGE_CONFIG, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load storage config:", error);
  }
  return { ...DEFAULT_STORAGE_CONFIG };
}
let storageConfig = loadStorageConfig();
function saveStorageConfig() {
  try {
    fs.writeFileSync(storageConfigPath, JSON.stringify(storageConfig, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to save storage config:", error);
  }
}
function setStorageBasePath(basePath) {
  storageConfig.basePath = basePath;
  storageConfig.projectPath = "";
  storageConfig.mediaPath = "";
  saveStorageConfig();
}
function updateStorageConfig(patch) {
  storageConfig = { ...storageConfig, ...patch };
  saveStorageConfig();
}
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
function normalizePath(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(inputPath);
}
function isSubdirectory(parentPath, childPath) {
  const normalizedParent = path.resolve(parentPath).toLowerCase() + path.sep;
  const normalizedChild = path.resolve(childPath).toLowerCase() + path.sep;
  return normalizedChild.startsWith(normalizedParent);
}
function pathsConflict(source, dest) {
  const normalizedSource = path.resolve(source).toLowerCase();
  const normalizedDest = path.resolve(dest).toLowerCase();
  if (normalizedSource === normalizedDest) {
    return null;
  }
  if (isSubdirectory(source, dest)) {
    return "The target path cannot be inside the current path";
  }
  if (isSubdirectory(dest, source)) {
    return "The current path cannot be inside the target path";
  }
  return null;
}
function getStorageBasePath() {
  const configured = storageConfig.basePath?.trim();
  if (configured) {
    return normalizePath(configured);
  }
  const legacyProject = storageConfig.projectPath?.trim();
  if (legacyProject) {
    return path.dirname(normalizePath(legacyProject));
  }
  return electron.app.getPath("userData");
}
function getProjectDataRoot() {
  const base = path.join(getStorageBasePath(), "projects");
  ensureDir(base);
  return base;
}
function getMediaRoot() {
  const base = path.join(getStorageBasePath(), "media");
  ensureDir(base);
  return base;
}
function getCacheDirs() {
  const userData = electron.app.getPath("userData");
  return [
    path.join(userData, "Cache"),
    path.join(userData, "Code Cache"),
    path.join(userData, "GPUCache")
  ];
}
async function getDirectorySize(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await getDirectorySize(fullPath);
      } else {
        const stat = await fs.promises.stat(fullPath);
        total += stat.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}
async function copyDir(source, destination) {
  ensureDir(destination);
  await fs.promises.cp(source, destination, { recursive: true, force: true });
}
async function removeDir(dirPath) {
  await fs.promises.rm(dirPath, { recursive: true, force: true });
}
async function deleteOldFiles(dirPath, cutoffTime) {
  let cleared = 0;
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        cleared += await deleteOldFiles(fullPath, cutoffTime);
        const remaining = await fs.promises.readdir(fullPath);
        if (remaining.length === 0) {
          await fs.promises.rmdir(fullPath).catch(() => {
          });
        }
      } else {
        const stat = await fs.promises.stat(fullPath);
        if (stat.mtimeMs < cutoffTime) {
          await fs.promises.unlink(fullPath).catch(() => {
          });
          cleared += stat.size;
        }
      }
    }
  } catch {
  }
  return cleared;
}
async function clearCache(olderThanDays) {
  const dirs = getCacheDirs();
  let cleared = 0;
  if (olderThanDays && olderThanDays > 0) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1e3;
    for (const dir of dirs) {
      cleared += await deleteOldFiles(dir, cutoff);
    }
    return cleared;
  }
  for (const dir of dirs) {
    cleared += await getDirectorySize(dir);
    await removeDir(dir).catch(() => {
    });
    ensureDir(dir);
  }
  return cleared;
}
function scheduleAutoClean() {
  if (autoCleanInterval) {
    clearInterval(autoCleanInterval);
    autoCleanInterval = null;
  }
  if (storageConfig.autoCleanEnabled) {
    const days = storageConfig.autoCleanDays || DEFAULT_STORAGE_CONFIG.autoCleanDays;
    clearCache(days).catch(() => {
    });
    autoCleanInterval = setInterval(() => {
      clearCache(days).catch(() => {
      });
    }, 24 * 60 * 60 * 1e3);
  }
}
const getImagesDir = (subDir) => {
  const imagesDir = path.join(getMediaRoot(), subDir);
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  return imagesDir;
};
function fetchCdpTargets(port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/json/list", timeout: 3e3 }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("CDP target discovery timed out")));
  });
}
async function waitForCdpEndpoint(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const targets = await fetchCdpTargets(port);
      if (targets.some((t) => t.type === "page")) return targets;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Chrome DevTools endpoint on port ${port} never came up: ${String(lastError)}`);
}
class CdpSession {
  constructor(ws2) {
    this.ws = ws2;
    ws2.on("message", (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (typeof message.id === "number") {
        const call = this.pending.get(message.id);
        if (!call) return;
        this.pending.delete(message.id);
        if (message.error) call.reject(new Error(message.error.message || "CDP call failed"));
        else call.resolve(message.result);
        return;
      }
      if (typeof message.method === "string") {
        const listeners = this.eventListeners.get(message.method);
        if (listeners) for (const listener of listeners) listener(message.params);
      }
    });
    ws2.on("close", () => {
      this.markClosed();
    });
  }
  nextId = 1;
  pending = /* @__PURE__ */ new Map();
  eventListeners = /* @__PURE__ */ new Map();
  closeListeners = /* @__PURE__ */ new Set();
  closed = false;
  markClosed() {
    if (this.closed) return;
    this.closed = true;
    for (const call of this.pending.values()) call.reject(new Error("CDP session is closed"));
    this.pending.clear();
    for (const listener of this.closeListeners) listener();
  }
  onClose(listener) {
    if (this.closed) {
      listener();
      return () => {
      };
    }
    this.closeListeners.add(listener);
    return () => {
      this.closeListeners.delete(listener);
    };
  }
  static connect(webSocketDebuggerUrl) {
    return new Promise((resolve, reject) => {
      const ws$1 = new ws.WebSocket(webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
      ws$1.once("open", () => resolve(new CdpSession(ws$1)));
      ws$1.once("error", reject);
    });
  }
  send(method, params = {}) {
    if (this.closed) return Promise.reject(new Error("CDP session is closed"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    let set = this.eventListeners.get(method);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.eventListeners.set(method, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }
  get isClosed() {
    return this.closed;
  }
  close() {
    if (this.closed) {
      try {
        this.ws.close();
      } catch {
      }
      return;
    }
    this.markClosed();
    try {
      this.ws.close();
    } catch {
    }
  }
}
function findChromeExecutable() {
  if (process.platform === "win32") return findWindows();
  if (process.platform === "darwin") return findMacos();
  return findLinux();
}
function findWindows() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "", "AppData", "Local");
  const candidates = [
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  return readWindowsAppPathsRegistry("chrome.exe") || readWindowsAppPathsRegistry("msedge.exe");
}
function readWindowsAppPathsRegistry(exeName) {
  try {
    const output = node_child_process.execFileSync("reg", [
      "query",
      `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${exeName}`,
      "/ve"
    ], { encoding: "utf8", windowsHide: true });
    const match = /REG_SZ\s+(.+)$/m.exec(output);
    const registryPath = match?.[1]?.trim();
    if (registryPath && fs.existsSync(registryPath)) return registryPath;
  } catch {
  }
  return null;
}
function findMacos() {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    path.join(process.env.HOME || "", "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ];
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  return null;
}
function findLinux() {
  for (const name of ["google-chrome", "google-chrome-stable", "chromium-browser", "chromium", "microsoft-edge"]) {
    try {
      const resolved = node_child_process.execFileSync("which", [name], { encoding: "utf8" }).trim();
      if (resolved) return resolved;
    } catch {
    }
  }
  return null;
}
const SW_HIDE = 0;
const SW_RESTORE = 9;
function setChromeWindowVisibilityNative(pid, visible) {
  if (!pid || process.platform !== "win32") return Promise.resolve(false);
  const cmd = visible ? SW_RESTORE : SW_HIDE;
  const script = [
    `$root=${pid};$cmd=${cmd};`,
    "$pids=New-Object System.Collections.Generic.HashSet[int];",
    "$q=New-Object System.Collections.Queue;[void]$q.Enqueue($root);",
    'while($q.Count -gt 0){$p=[int]$q.Dequeue();if($pids.Add($p)){Get-CimInstance Win32_Process -Filter "ParentProcessId=$p" -ErrorAction SilentlyContinue|%{[void]$q.Enqueue([int]$_.ProcessId)}}}',
    'Add-Type @"',
    "using System;using System.Collections.Generic;using System.Runtime.InteropServices;",
    "public class VsWin{",
    '[DllImport("user32.dll")]static extern bool EnumWindows(EnumWindowsProc cb,IntPtr l);',
    "delegate bool EnumWindowsProc(IntPtr h,IntPtr l);",
    '[DllImport("user32.dll")]static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);',
    '[DllImport("user32.dll")]static extern bool ShowWindow(IntPtr h,int c);',
    '[DllImport("user32.dll")]static extern int GetWindowTextLength(IntPtr h);',
    "public static void Apply(int[] pids,int cmd){var s=new HashSet<uint>();foreach(var p in pids)s.Add((uint)p);EnumWindows((h,l)=>{uint wp;GetWindowThreadProcessId(h,out wp);if(s.Contains(wp)&&GetWindowTextLength(h)>0){ShowWindow(h,cmd);}return true;},IntPtr.Zero);}",
    "}",
    '"@;',
    "[VsWin]::Apply([int[]]@($pids),$cmd)|Out-Null"
  ].join("\n");
  return new Promise((resolve) => {
    try {
      node_child_process.execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
        { windowsHide: true },
        (error) => resolve(!error)
      );
    } catch {
      resolve(false);
    }
  });
}
const FAST_CRASH_WINDOW_MS = 8e3;
const MAX_FAST_CRASHES = 3;
const BROWSER_CLOSE_GRACE_MS = 800;
const PROCESS_EXIT_GRACE_MS = 1200;
function waitForChildExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.removeListener("exit", finish);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    child.once("exit", finish);
  });
}
async function terminateChromeProcessTree(child) {
  const pid = child.pid;
  if (!pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      try {
        node_child_process.execFile("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => resolve());
      } catch {
        resolve();
      }
    });
    return;
  }
  try {
    child.kill("SIGTERM");
  } catch {
  }
  await waitForChildExit(child, PROCESS_EXIT_GRACE_MS);
  if (child.exitCode === null && child.signalCode === null) {
    try {
      child.kill("SIGKILL");
    } catch {
    }
  }
}
class InAppBrowserSessionManager {
  accountsPath;
  settingsPath;
  profilesDir;
  accounts = [];
  sessions = /* @__PURE__ */ new Map();
  // When true, a login window is fully hidden (SW_HIDE, gone from the taskbar)
  // once it reports ready, instead of just minimized. Controlled by a UI toggle.
  hideAfterLogin = false;
  constructor(userDataPath) {
    this.accountsPath = path.join(userDataPath, "vs-inapp-accounts.json");
    this.settingsPath = path.join(userDataPath, "vs-browser-settings.json");
    this.profilesDir = path.join(userDataPath, "vs-inapp-profiles");
    this.loadAccounts();
    this.loadSettings();
  }
  async setHideAfterLogin(value) {
    this.hideAfterLogin = value;
    this.saveSettings();
    if (value) {
      await Promise.allSettled(
        [...this.sessions.values()].filter((session) => session.autoHidden).map((session) => this.hideSession(session))
      );
    }
  }
  // Bring an account's login window back on screen (used by the "Hiện" button).
  async showAccountWindow(accountSlotId) {
    const session = this.sessions.get(accountSlotId);
    if (!session) return;
    await setChromeWindowVisibilityNative(session.process?.pid, true);
    if (session.cdp && session.targetId) {
      try {
        const { windowId } = await session.cdp.send("Browser.getWindowForTarget", { targetId: session.targetId });
        await session.cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } });
      } catch {
      }
    }
  }
  loadAccounts() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.accountsPath, "utf8"));
      this.accounts = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.accounts = [];
    }
  }
  loadSettings() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.settingsPath, "utf8"));
      this.hideAfterLogin = parsed.hideAfterLogin === true;
    } catch {
      this.hideAfterLogin = false;
    }
  }
  saveSettings() {
    try {
      fs.mkdirSync(path.dirname(this.settingsPath), { recursive: true });
      fs.writeFileSync(this.settingsPath, JSON.stringify({ hideAfterLogin: this.hideAfterLogin }, null, 2));
    } catch (error) {
      console.warn("[video-studio][in-app-session] failed to persist browser settings:", error);
    }
  }
  saveAccounts() {
    try {
      fs.mkdirSync(path.dirname(this.accountsPath), { recursive: true });
      fs.writeFileSync(this.accountsPath, JSON.stringify(this.accounts, null, 2));
    } catch {
    }
  }
  listAccounts(provider) {
    return this.accounts.filter((a) => a.provider === provider);
  }
  async addAccount(provider, options) {
    const accountSlotId = crypto.randomUUID();
    const record = { accountSlotId, provider, label: "Đang đăng nhập…", createdAt: Date.now() };
    this.accounts.push(record);
    this.saveAccounts();
    const session = { record, options, removed: false, respawning: false, lastConnectedAt: 0, fastCrashes: 0, autoHidden: false, reconnectListeners: /* @__PURE__ */ new Set() };
    this.sessions.set(accountSlotId, session);
    await this.launch(session, options);
    return this.makeHandle(session);
  }
  async restoreAll(provider, options) {
    const handles = [];
    for (const record of this.listAccounts(provider)) {
      const session = { record, options, removed: false, respawning: false, lastConnectedAt: 0, fastCrashes: 0, autoHidden: false, reconnectListeners: /* @__PURE__ */ new Set() };
      this.sessions.set(record.accountSlotId, session);
      try {
        await this.launch(session, { ...options, startMinimized: true });
        const handle = this.makeHandle(session);
        if (this.hideAfterLogin) await handle.hide();
        handles.push(handle);
      } catch (error) {
        console.error(`[video-studio][in-app-session] failed to restore account ${record.accountSlotId}:`, error);
      }
    }
    return handles;
  }
  async removeAccount(accountSlotId) {
    const session = this.sessions.get(accountSlotId);
    if (session) {
      session.removed = true;
      this.sessions.delete(accountSlotId);
      try {
        session.cdp?.close();
      } catch {
      }
      try {
        session.process?.kill();
      } catch {
      }
    }
    this.accounts = this.accounts.filter((a) => a.accountSlotId !== accountSlotId);
    this.saveAccounts();
    try {
      fs.rmSync(path.join(this.profilesDir, accountSlotId), { recursive: true, force: true });
    } catch {
    }
  }
  /**
   * Stops every app-owned browser without deleting its persisted login.
   * Mark sessions removed first so a closing CDP socket cannot schedule a
   * background respawn while Electron is quitting.
   */
  async shutdownAll() {
    const sessions2 = [...this.sessions.values()];
    for (const session of sessions2) {
      session.removed = true;
      session.respawning = false;
      session.reconnectListeners.clear();
    }
    await Promise.allSettled(sessions2.map(async (session) => {
      const cdp = session.cdp;
      const child = session.process;
      if (cdp && !cdp.isClosed) {
        await Promise.race([
          cdp.send("Browser.close").catch(() => void 0),
          new Promise((resolve) => setTimeout(resolve, BROWSER_CLOSE_GRACE_MS))
        ]);
      }
      try {
        cdp?.close();
      } catch {
      }
      if (child) await terminateChromeProcessTree(child);
    }));
    this.sessions.clear();
  }
  async launch(session, options) {
    const chromePath = findChromeExecutable();
    if (!chromePath) {
      throw new Error("Không tìm thấy Chrome hoặc Edge trên máy — cần cài Google Chrome để đăng nhập trong ứng dụng.");
    }
    const { record } = session;
    const profileDir = path.join(this.profilesDir, record.accountSlotId);
    fs.mkdirSync(profileDir, { recursive: true });
    const port = await findFreePort();
    const width = options.windowSize?.width ?? 1200;
    const height = options.windowSize?.height ?? 840;
    const args = [
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${port}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-default-apps",
      "--disable-blink-features=AutomationControlled",
      `--window-size=${width},${height}`
    ];
    if (options.startMinimized) args.push("--start-minimized");
    args.push(options.loginUrl);
    console.log(`[video-studio][in-app-session] spawning ${chromePath} on CDP port ${port} (account=${record.accountSlotId})`);
    const child = node_child_process.spawn(chromePath, args, { stdio: "ignore", detached: false });
    session.process = child;
    child.on("exit", (code) => {
      console.log(`[video-studio][in-app-session] chrome exited (account=${record.accountSlotId}, code=${code})`);
      if (session.process === child) session.process = void 0;
    });
    child.on("error", (error) => {
      console.error(`[video-studio][in-app-session] failed to spawn chrome for account ${record.accountSlotId}:`, error);
    });
    let targets;
    try {
      targets = await waitForCdpEndpoint(port, 2e4);
    } catch (error) {
      try {
        child.kill();
      } catch {
      }
      throw error;
    }
    const pageTarget = targets.find((t) => t.type === "page") ?? targets[0];
    if (!pageTarget) {
      try {
        child.kill();
      } catch {
      }
      throw new Error("Chrome không mở được tab nào để kết nối");
    }
    const cdp = await CdpSession.connect(pageTarget.webSocketDebuggerUrl);
    session.cdp = cdp;
    session.targetId = pageTarget.id;
    session.lastConnectedAt = Date.now();
    console.log(`[video-studio][in-app-session] CDP connected (account=${record.accountSlotId})`);
    cdp.onClose(() => {
      if (!session.removed) this.scheduleRespawn(session);
    });
  }
  scheduleRespawn(session) {
    if (session.removed || session.respawning) return;
    if (session.lastConnectedAt && Date.now() - session.lastConnectedAt < FAST_CRASH_WINDOW_MS) {
      session.fastCrashes += 1;
      if (session.fastCrashes >= MAX_FAST_CRASHES) {
        console.error(`[video-studio][in-app-session] account ${session.record.accountSlotId} Chrome keeps crashing on launch — giving up respawn. Gỡ và thêm lại tài khoản.`);
        return;
      }
    } else {
      session.fastCrashes = 0;
    }
    session.respawning = true;
    console.log(`[video-studio][in-app-session] chrome for account ${session.record.accountSlotId} is gone — respawning in background`);
    const attempt = (retriesLeft) => {
      setTimeout(async () => {
        if (session.removed) {
          session.respawning = false;
          return;
        }
        try {
          await this.launch(session, { ...session.options, startMinimized: true });
          session.respawning = false;
          if (session.autoHidden) await this.hideSession(session);
          if (session.cdp) {
            for (const listener of session.reconnectListeners) {
              try {
                listener(session.cdp);
              } catch (error) {
                console.error("[video-studio][in-app-session] reconnect listener error:", error);
              }
            }
          }
        } catch (error) {
          console.error(`[video-studio][in-app-session] respawn failed for account ${session.record.accountSlotId} (retries left ${retriesLeft}):`, error);
          if (retriesLeft > 0 && !session.removed) attempt(retriesLeft - 1);
          else session.respawning = false;
        }
      }, 1500);
    };
    attempt(5);
  }
  makeHandle(session) {
    return {
      accountSlotId: session.record.accountSlotId,
      provider: session.record.provider,
      get cdp() {
        if (!session.cdp) throw new Error("CDP session is not connected");
        return session.cdp;
      },
      onReconnect: (listener) => {
        session.reconnectListeners.add(listener);
        return () => {
          session.reconnectListeners.delete(listener);
        };
      },
      show: async () => {
        await setChromeWindowVisibilityNative(session.process?.pid, true);
        await this.setWindowState(session, "normal");
      },
      // Called once the account reports ready: fully hide (gone from taskbar)
      // when the user opted in, otherwise just minimize as before.
      hide: async () => {
        await this.hideSession(session);
      }
    };
  }
  async setWindowState(session, windowState) {
    const cdp = session.cdp;
    if (!cdp || !session.targetId) return false;
    try {
      const { windowId } = await cdp.send("Browser.getWindowForTarget", { targetId: session.targetId });
      await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState } });
      return true;
    } catch {
      return false;
    }
  }
  async hideSession(session) {
    session.autoHidden = true;
    if (this.hideAfterLogin) {
      const hidden = await setChromeWindowVisibilityNative(session.process?.pid, false);
      if (hidden) return;
    }
    await this.setWindowState(session, "minimized");
  }
}
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server2 = net.createServer();
    server2.unref();
    server2.on("error", reject);
    server2.listen(0, "127.0.0.1", () => {
      const address = server2.address();
      const port = address && typeof address === "object" ? address.port : 0;
      server2.close(() => resolve(port));
    });
  });
}
let googleFlowRuntime = null;
let unregisterGoogleFlowIpc = null;
let googleFlowStartupPromise = null;
let grokVideoRuntime = null;
let unregisterGrokIpc = null;
let grokStartupPromise = null;
let inAppSessionManager = null;
let googleFlowAccountManager = null;
let grokAccountManager = null;
function getInAppSessionManager() {
  if (!inAppSessionManager) {
    inAppSessionManager = new InAppBrowserSessionManager(electron.app.getPath("userData"));
  }
  return inAppSessionManager;
}
function getExtensionPath() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "extensions", "logdd") : path.join(APP_ROOT, "extensions", "logdd");
}
function startGoogleFlowRuntime() {
  if (googleFlowRuntime) return Promise.resolve();
  if (googleFlowStartupPromise) return googleFlowStartupPromise;
  googleFlowStartupPromise = Promise.all([
    Promise.resolve().then(() => require("./chunks/runtime-CvEIr5fj.cjs")),
    Promise.resolve().then(() => require("./chunks/ipc-DWDaIxbL.cjs")),
    Promise.resolve().then(() => require("./chunks/in-app-account-manager-DBZVAFf_.cjs"))
  ]).then(async ([runtimeModule, ipcModule, accountManagerModule]) => {
    if (googleFlowRuntime) return;
    googleFlowRuntime = new runtimeModule.GoogleFlowRuntime({
      userDataPath: electron.app.getPath("userData"),
      mediaRoot: getMediaRoot(),
      extensionPath: getExtensionPath()
    });
    googleFlowAccountManager = new accountManagerModule.GoogleFlowInAppAccountManager(getInAppSessionManager(), googleFlowRuntime);
    unregisterGoogleFlowIpc = ipcModule.registerGoogleFlowIpc(googleFlowRuntime, googleFlowAccountManager);
    googleFlowRuntime.start();
    void googleFlowAccountManager.restoreAccounts().catch((error) => {
      console.error("[video-studio] Google Flow account restore failed:", error);
    });
  }).finally(() => {
    googleFlowStartupPromise = null;
  });
  return googleFlowStartupPromise;
}
function startGrokRuntime() {
  if (grokVideoRuntime) return Promise.resolve();
  if (grokStartupPromise) return grokStartupPromise;
  grokStartupPromise = Promise.all([
    Promise.resolve().then(() => require("./chunks/runtime-Cq1krzwU.cjs")),
    Promise.resolve().then(() => require("./chunks/ipc-C-ezG8-X.cjs")),
    Promise.resolve().then(() => require("./chunks/in-app-account-manager-CnVDbwnf.cjs"))
  ]).then(async ([runtimeModule, ipcModule, accountManagerModule]) => {
    if (grokVideoRuntime) return;
    const extensionPath = getExtensionPath();
    grokVideoRuntime = new runtimeModule.GrokVideoRuntime({
      mediaRoot: getMediaRoot(),
      extensionPath
    });
    grokAccountManager = new accountManagerModule.GrokInAppAccountManager(getInAppSessionManager(), grokVideoRuntime, extensionPath, getMediaRoot());
    unregisterGrokIpc = ipcModule.registerGrokIpc(grokVideoRuntime, grokAccountManager);
    grokVideoRuntime.start();
    void grokAccountManager.restoreAccounts().catch((error) => {
      console.error("[video-studio] Grok account restore failed:", error);
    });
  }).finally(() => {
    grokStartupPromise = null;
  });
  return grokStartupPromise;
}
function registerBrowserRuntimeIpc() {
  electron.ipcMain.handle("vs-browser:start-runtimes", async () => {
    await Promise.all([startGoogleFlowRuntime(), startGrokRuntime()]);
    return { ok: true };
  });
  electron.ipcMain.handle("vs-browser:set-hide-after-login", async (_event, value) => {
    await getInAppSessionManager().setHideAfterLogin(Boolean(value));
    return { ok: true };
  });
}
function stopBrowserRuntimes() {
  unregisterGoogleFlowIpc?.();
  unregisterGoogleFlowIpc = null;
  googleFlowRuntime?.stop();
  googleFlowRuntime = null;
  unregisterGrokIpc?.();
  unregisterGrokIpc = null;
  grokVideoRuntime?.stop();
  grokVideoRuntime = null;
  const sessionManager = inAppSessionManager;
  inAppSessionManager = null;
  googleFlowAccountManager = null;
  grokAccountManager = null;
  return sessionManager;
}
const autoEditMediaTokens = /* @__PURE__ */ new Map();
function getAutoEditMediaPath(token2) {
  return autoEditMediaTokens.get(token2);
}
function registerAutoEditMedia(filePath) {
  const token2 = crypto.randomUUID();
  autoEditMediaTokens.set(token2, path.resolve(filePath));
  return `auto-edit-media://${token2}`;
}
function autoEditProjectsDir() {
  const dir = path.join(electron.app.getPath("documents"), "Logdd", "AutoEdit Projects");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function registerFileExportIpc() {
  electron.ipcMain.handle("save-file-dialog", async (_event, { localPath, defaultPath, filters }) => {
    try {
      let sourcePath = null;
      const imageMatch = localPath.match(/^local-image:\/\/(.+)\/(.+)$/);
      const videoMatch = localPath.match(/^local-video:\/\/(.+)\/(.+)$/);
      if (imageMatch) {
        const [, category, filename] = imageMatch;
        sourcePath = path.join(getMediaRoot(), category, decodeURIComponent(filename));
      } else if (videoMatch) {
        const [, category, filename] = videoMatch;
        sourcePath = path.join(getMediaRoot(), category, decodeURIComponent(filename));
      } else if (localPath.startsWith("file://")) {
        sourcePath = localPath.replace("file://", "");
      } else {
        sourcePath = localPath;
      }
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { success: false, error: "Source file not found" };
      }
      const result = await electron.dialog.showSaveDialog({
        defaultPath,
        filters
      });
      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }
      fs.copyFileSync(sourcePath, result.filePath);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error("Failed to save file:", error);
      return { success: false, error: String(error) };
    }
  });
}
function registerAutoEditIpc() {
  electron.ipcMain.handle("auto-edit-pick-media", async () => {
    const result = await electron.dialog.showOpenDialog({
      title: "Chọn video hoặc audio để Auto Edit",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Media", extensions: ["mp4", "mov", "mkv", "webm", "avi", "mp3", "wav", "m4a", "aac", "png", "jpg", "jpeg", "webp"] },
        { name: "All files", extensions: ["*"] }
      ]
    });
    if (result.canceled) return { canceled: true, files: [] };
    const files = result.filePaths.map((filePath) => {
      const previewUrl = registerAutoEditMedia(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const kind = [".mp3", ".wav", ".m4a", ".aac"].includes(extension) ? "audio" : [".png", ".jpg", ".jpeg", ".webp"].includes(extension) ? "image" : "video";
      return { path: filePath, name: path.basename(filePath), previewUrl, kind };
    });
    return { canceled: false, files };
  });
  electron.ipcMain.handle("auto-edit-pick-json", async () => {
    const result = await electron.dialog.showOpenDialog({
      title: "Nhập Auto Edit JSON / CSV",
      properties: ["openFile"],
      filters: [
        { name: "JSON / CSV", extensions: ["json", "csv", "tsv"] },
        { name: "JSON", extensions: ["json"] },
        { name: "CSV", extensions: ["csv", "tsv"] }
      ]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const filePath = result.filePaths[0];
    return { canceled: false, filePath, content: await fs.promises.readFile(filePath, "utf8") };
  });
  electron.ipcMain.handle("auto-edit-register-media-paths", async (_event, paths) => {
    const result = {};
    for (const candidate of paths.slice(0, 2e3)) {
      if (typeof candidate !== "string" || !candidate.trim()) continue;
      const resolved = path.resolve(candidate);
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) continue;
      result[candidate] = registerAutoEditMedia(resolved);
    }
    return result;
  });
  electron.ipcMain.handle("auto-edit-save-text", async (_event, payload) => {
    const extension = payload.extension.replace(/[^a-z0-9]/gi, "") || "txt";
    const result = await electron.dialog.showSaveDialog({
      title: "Xuất timeline",
      defaultPath: payload.defaultName,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    await fs.promises.writeFile(result.filePath, payload.content, "utf8");
    return { success: true, filePath: result.filePath };
  });
}
function registerAutoEditProjectsIpc() {
  electron.ipcMain.handle("auto-edit-projects-list", async () => {
    const dir = autoEditProjectsDir();
    let entries = [];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return { success: true, projects: [] };
    }
    const projects = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const filePath = path.join(dir, entry.name);
      try {
        const stat = await fs.promises.stat(filePath);
        const raw = await fs.promises.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw);
        const id = entry.name.replace(/\.json$/, "");
        const name = typeof parsed?.metadata?.name === "string" && parsed.metadata.name.trim() ? parsed.metadata.name : id;
        const durationMs = typeof parsed?.metadata?.duration === "number" ? parsed.metadata.duration : 0;
        projects.push({ id, name, filePath, updatedAt: stat.mtimeMs, durationMs });
      } catch {
      }
    }
    projects.sort((a, b) => b.updatedAt - a.updatedAt);
    return { success: true, projects };
  });
  electron.ipcMain.handle("auto-edit-project-save", async (_event, payload) => {
    try {
      const dir = autoEditProjectsDir();
      const safeId = payload.id.replace(/[^a-zA-Z0-9_-]/g, "_") || "project";
      const filePath = path.join(dir, `${safeId}.json`);
      await fs.promises.writeFile(filePath, payload.content, "utf8");
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("auto-edit-project-load", async (_event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("auto-edit-project-delete", async (_event, filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("auto-edit-project-rename", async (_event, payload) => {
    try {
      const name = payload.name.trim();
      if (!name) return { success: false, error: "Empty name" };
      const raw = await fs.promises.readFile(payload.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.metadata) {
        parsed.metadata.name = name;
        parsed.metadata.updatedAt = Date.now();
      }
      await fs.promises.writeFile(payload.filePath, JSON.stringify(parsed, null, 2), "utf8");
      return { success: true, name };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("auto-edit-project-reveal", async (_event, filePath) => {
    try {
      if (fs.existsSync(filePath)) electron.shell.showItemInFolder(filePath);
      return { success: true };
    } catch {
      return { success: false };
    }
  });
}
const MEDIA_MIME_TYPES = {
  // Images
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  // Videos
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska"
};
async function serveFile(filePath, request) {
  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile()) return new Response("Not a file", { status: 404 });
  const mimeType = MEDIA_MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const size = stats.size;
  const commonHeaders = {
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
    // Generated media is never rewritten in place (each render writes a new
    // filename), so the renderer may reuse what it already has.
    "Cache-Control": "private, max-age=3600"
  };
  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/i.exec(range.trim()) : null;
  if (range && !match) {
    return new Response(null, { status: 416, headers: { ...commonHeaders, "Content-Range": `bytes */${size}` } });
  }
  let start = 0;
  let end = size - 1;
  if (match) {
    if (!match[1] && match[2]) start = Math.max(0, size - Number(match[2]));
    else {
      start = match[1] ? Number(match[1]) : 0;
      if (match[2]) end = Math.min(Number(match[2]), size - 1);
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...commonHeaders, "Content-Range": `bytes */${size}` } });
    }
  }
  if (size === 0) return new Response(null, { headers: { ...commonHeaders, "Content-Length": "0" } });
  const stream = fs.createReadStream(filePath, { start, end });
  const body = node_stream.Readable.toWeb(stream);
  const length = end - start + 1;
  if (match) {
    return new Response(body, {
      status: 206,
      headers: { ...commonHeaders, "Content-Length": String(length), "Content-Range": `bytes ${start}-${end}/${size}` }
    });
  }
  return new Response(body, { headers: { ...commonHeaders, "Content-Length": String(length) } });
}
function registerPrivilegedSchemes() {
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: "local-image",
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    },
    {
      scheme: "local-tts",
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    },
    {
      scheme: "auto-edit-media",
      privileges: { secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    }
  ]);
}
function handleAutoEditMedia() {
  electron.protocol.handle("auto-edit-media", async (request) => {
    try {
      const token2 = new URL(request.url).hostname;
      const filePath = getAutoEditMediaPath(token2);
      if (!filePath || !fs.existsSync(filePath)) return new Response("Media not found", { status: 404 });
      return electron.net.fetch(node_url.pathToFileURL(filePath).toString());
    } catch {
      return new Response("Media not found", { status: 404 });
    }
  });
}
function handleLocalTts() {
  electron.protocol.handle("local-tts", async (request) => {
    try {
      const url = new URL(request.url);
      const filename = path.basename(decodeURIComponent(url.pathname.slice(1)));
      const extension = path.extname(filename).toLowerCase();
      const audioMimeTypes = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg"
      };
      if (!audioMimeTypes[extension]) return new Response("Unsupported audio", { status: 415 });
      const outputDir = path.resolve(electron.app.getPath("userData"), "tts", "outputs");
      const filePath = path.resolve(outputDir, filename);
      if (!filePath.startsWith(`${outputDir}${path.sep}`)) return new Response("Invalid path", { status: 400 });
      const data = fs.readFileSync(filePath);
      const range = request.headers.get("range");
      const commonHeaders = {
        "Accept-Ranges": "bytes",
        "Content-Type": audioMimeTypes[extension]
      };
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
        const start = match?.[1] ? Number(match[1]) : 0;
        const requestedEnd = match?.[2] ? Number(match[2]) : data.length - 1;
        const end = Math.min(requestedEnd, data.length - 1);
        if (!match || !Number.isSafeInteger(start) || start < 0 || start > end) {
          return new Response(null, {
            status: 416,
            headers: { ...commonHeaders, "Content-Range": `bytes */${data.length}` }
          });
        }
        const chunk = data.subarray(start, end + 1);
        return new Response(chunk, {
          status: 206,
          headers: {
            ...commonHeaders,
            "Content-Length": String(chunk.length),
            "Content-Range": `bytes ${start}-${end}/${data.length}`
          }
        });
      }
      return new Response(data, {
        headers: { ...commonHeaders, "Content-Length": String(data.length) }
      });
    } catch {
      return new Response("Audio not found", { status: 404 });
    }
  });
}
function handleLocalImage() {
  electron.protocol.handle("local-image", async (request) => {
    try {
      const url = new URL(request.url);
      const category = url.hostname;
      const filename = decodeURIComponent(url.pathname.slice(1));
      const mediaRoot = getMediaRoot();
      const filePath = path.resolve(mediaRoot, category, filename);
      if (!filePath.startsWith(path.resolve(mediaRoot) + path.sep)) {
        return new Response("Invalid path", { status: 400 });
      }
      return await serveFile(filePath, request);
    } catch (error) {
      console.error("Failed to load local image:", error);
      return new Response("Image not found", { status: 404 });
    }
  });
}
function registerAppProtocols() {
  handleAutoEditMedia();
  handleLocalTts();
  handleLocalImage();
}
const WEB_BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9,vi;q=0.8"
};
const downloadImage = (url, filePath, maxRedirects = 5, sourcePageUrl) => {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error("Too many redirects"));
      return;
    }
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(filePath);
    protocol.get(url, {
      headers: {
        ...WEB_BROWSER_HEADERS,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        ...sourcePageUrl ? { Referer: sourcePageUrl } : {}
      }
    }, (response) => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        file.close();
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          const resolvedRedirect = new URL(redirectUrl, url).toString();
          downloadImage(resolvedRedirect, filePath, maxRedirects - 1, sourcePageUrl).then(resolve).catch(reject);
          return;
        }
      }
      if (status !== 200) {
        file.close();
        fs.unlink(filePath, () => {
        });
        reject(new Error(`Failed to download: ${status}`));
        return;
      }
      const contentType = String(response.headers["content-type"] || "").toLowerCase();
      if (contentType.includes("text/html") || contentType.includes("application/json")) {
        file.close();
        fs.unlink(filePath, () => {
        });
        reject(new Error(`Image URL returned ${contentType || "non-image content"}`));
        return;
      }
      const contentLength = Number(response.headers["content-length"] || 0);
      if (contentLength > 40 * 1024 * 1024) {
        file.close();
        fs.unlink(filePath, () => {
        });
        reject(new Error("Image exceeds 40 MB download limit"));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      file.close();
      fs.unlink(filePath, () => {
      });
      reject(err);
    });
  });
};
const fetchWebPage = (url, maxRedirects = 5) => new Promise((resolve, reject) => {
  if (maxRedirects <= 0) return reject(new Error("Too many redirects"));
  const client = url.startsWith("https") ? https : http;
  client.get(url, {
    headers: {
      ...WEB_BROWSER_HEADERS,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
    }
  }, (response) => {
    const status = response.statusCode ?? 0;
    if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
      response.resume();
      const redirect = new URL(response.headers.location, url).toString();
      void fetchWebPage(redirect, maxRedirects - 1).then(resolve, reject);
      return;
    }
    if (status !== 200) {
      response.resume();
      reject(new Error(`Web search failed (${status})`));
      return;
    }
    const chunks = [];
    response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  }).on("error", reject);
});
function decodeHtmlAttribute(value) {
  return value.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
async function searchBingWebImages(query, limit) {
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&scenario=ImageBasicHover`;
  const html = await fetchWebPage(searchUrl);
  const results = [];
  const anchorPattern = /<a\b[^>]*class="[^"]*\biusc\b[^"]*"[^>]*>/giu;
  for (const anchor of html.match(anchorPattern) || []) {
    const metadataMatch = anchor.match(/\bm="([^"]+)"/iu);
    if (!metadataMatch) continue;
    try {
      const metadata = JSON.parse(decodeHtmlAttribute(metadataMatch[1]));
      const imageUrl = typeof metadata.murl === "string" ? metadata.murl : "";
      const sourcePageUrl = typeof metadata.purl === "string" ? metadata.purl : "";
      if (!/^https?:\/\//i.test(imageUrl) || !/^https?:\/\//i.test(sourcePageUrl)) continue;
      if (/\.svg(?:$|\?)/i.test(imageUrl)) continue;
      results.push({
        imageUrl,
        sourcePageUrl,
        title: typeof metadata.t === "string" ? metadata.t : void 0,
        width: Number.isFinite(Number(metadata.w)) ? Number(metadata.w) : void 0,
        height: Number.isFinite(Number(metadata.h)) ? Number(metadata.h) : void 0
      });
      if (results.length >= limit) break;
    } catch {
    }
  }
  return results;
}
function isHttpUrl(value) {
  return value.startsWith("http://") || value.startsWith("https://");
}
function resolveImageHostUploadUrl(provider) {
  const uploadPath = (provider.uploadPath || "").trim();
  if (uploadPath && isHttpUrl(uploadPath)) {
    return uploadPath;
  }
  const baseUrl = (provider.baseUrl || "").trim().replace(/\/*$/, "");
  if (!baseUrl && !uploadPath) return "";
  if (!baseUrl && uploadPath) return "";
  if (!uploadPath) return baseUrl;
  const normalizedPath = uploadPath.startsWith("/") ? uploadPath : `/${uploadPath}`;
  return `${baseUrl}${normalizedPath}`;
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function getByPath(obj, objectPath) {
  if (!isRecord(obj) || !objectPath) return void 0;
  return objectPath.split(".").reduce((acc, key) => {
    if (!isRecord(acc)) return void 0;
    return acc[key];
  }, obj);
}
function extractFirstHttpUrl(value) {
  const match = value.match(/https?:\/\/[^\s"'<>]+/i);
  return match?.[0];
}
function getExtensionFromMimeType(mimeType) {
  switch ((mimeType || "").toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "image/bmp":
      return "bmp";
    case "image/avif":
      return "avif";
    case "image/png":
    default:
      return "png";
  }
}
function getMimeTypeFromExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".avif": "image/avif"
  };
  return mimeTypes[extension] || "image/png";
}
function parseDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s);
  if (!matches) return null;
  const mimeType = matches[1] || "image/png";
  const buffer = Buffer.from(matches[2], "base64");
  if (buffer.length === 0) return null;
  return { buffer, mimeType };
}
function resolveImageSourcePath(imagePath) {
  const localImageMatch = imagePath.match(/^local-image:\/\/(.+)\/(.+)$/);
  if (localImageMatch) {
    const [, category, filename] = localImageMatch;
    return path.join(getMediaRoot(), category, decodeURIComponent(filename));
  }
  if (imagePath.startsWith("file://")) {
    return imagePath.replace(/^file:\/\/\/?/, "");
  }
  if (path.isAbsolute(imagePath)) {
    return imagePath;
  }
  return null;
}
async function fetchBuffer(url, timeoutMs = 45e3) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/*, */*;q=0.8"
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      throw new Error("Fetched image is empty");
    }
    return {
      buffer,
      mimeType: response.headers.get("content-type") || "image/png"
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out (${Math.round(timeoutMs / 1e3)}s)`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
async function readImageSource(imageData) {
  if (isHttpUrl(imageData)) {
    return fetchBuffer(imageData);
  }
  const parsedDataUrl = parseDataUrl(imageData);
  if (parsedDataUrl) {
    return parsedDataUrl;
  }
  const resolvedPath = resolveImageSourcePath(imageData);
  if (resolvedPath) {
    if (!fs.existsSync(resolvedPath)) {
      throw new Error("Local image does not exist");
    }
    const buffer = fs.readFileSync(resolvedPath);
    if (buffer.length === 0) {
      throw new Error("Local image file is empty");
    }
    return {
      buffer,
      mimeType: getMimeTypeFromExtension(resolvedPath)
    };
  }
  const rawBuffer = Buffer.from(imageData, "base64");
  if (rawBuffer.length === 0) {
    throw new Error("Invalid image data");
  }
  return {
    buffer: rawBuffer,
    mimeType: "image/png"
  };
}
async function toUploadFilePayload(imageData, name) {
  const { buffer, mimeType } = await readImageSource(imageData);
  const baseName = (name || "upload").trim() || "upload";
  const hasExtension = /\.[a-z0-9]{2,8}$/i.test(baseName);
  const filename = hasExtension ? baseName : `${baseName}.${getExtensionFromMimeType(mimeType)}`;
  return {
    blob: new Blob([new Uint8Array(buffer)], { type: mimeType }),
    filename,
    mimeType
  };
}
async function toBase64Payload(imageData) {
  if (imageData.startsWith("data:")) {
    const parsed = parseDataUrl(imageData);
    if (!parsed) {
      throw new Error("Invalid image data");
    }
    return parsed.buffer.toString("base64");
  }
  if (isHttpUrl(imageData) || imageData.startsWith("local-image://") || imageData.startsWith("file://") || path.isAbsolute(imageData)) {
    const { buffer } = await readImageSource(imageData);
    return buffer.toString("base64");
  }
  return imageData;
}
async function uploadImageHostFromMain({
  provider,
  apiKey,
  imageData,
  options
}) {
  try {
    const uploadUrl = resolveImageHostUploadUrl(provider);
    if (!uploadUrl) {
      return { success: false, error: "Image host upload URL is not configured" };
    }
    const fieldName = provider.imageField || "image";
    const nameField = provider.nameField || "name";
    const payloadType = provider.imagePayloadType || "base64";
    const staticFormFields = provider.staticFormFields || {};
    const formData = new FormData();
    Object.entries(staticFormFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (provider.apiKeyFormField && apiKey) {
      formData.append(provider.apiKeyFormField, apiKey);
    }
    if (payloadType === "file") {
      const { blob, filename } = await toUploadFilePayload(imageData, options?.name);
      formData.append(fieldName, blob, filename);
    } else {
      const base64Data = await toBase64Payload(imageData);
      formData.append(fieldName, base64Data);
    }
    if (options?.name) {
      formData.append(nameField, options.name);
    }
    const url = new URL(uploadUrl);
    if (provider.apiKeyParam && apiKey) {
      url.searchParams.set(provider.apiKeyParam, apiKey);
    }
    if (provider.expirationParam && options?.expiration) {
      url.searchParams.set(provider.expirationParam, String(options.expiration));
    }
    const headers = {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8"
    };
    if (provider.apiKeyHeader && apiKey) {
      headers[provider.apiKeyHeader] = apiKey;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45e3);
    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (!response.ok) {
        const errorMessage = getByPath(data, "error.message");
        const messageField = getByPath(data, "message");
        const message = typeof errorMessage === "string" ? errorMessage : typeof messageField === "string" ? messageField : text || `Upload failed: ${response.status}`;
        return { success: false, error: message };
      }
      const urlField = getByPath(data, provider.responseUrlField || "url");
      const deleteField = getByPath(data, provider.responseDeleteUrlField || "delete_url");
      const trimmedText = text.trim();
      const extractedTextUrl = extractFirstHttpUrl(trimmedText);
      if (urlField) {
        return {
          success: true,
          url: typeof urlField === "string" ? urlField : String(urlField),
          deleteUrl: deleteField ? typeof deleteField === "string" ? deleteField : String(deleteField) : void 0
        };
      }
      if (extractedTextUrl) {
        return { success: true, url: extractedTextUrl };
      }
      console.warn("[ImageHost/Main] Upload succeeded but no URL was detected in the response", {
        provider: provider.name,
        platform: provider.platform,
        responsePreview: trimmedText.substring(0, 200)
      });
      return { success: false, error: `Image host ${provider.name} succeeded but returned no URL` };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { success: false, error: "Upload timed out. Please try again." };
      }
      return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
  }
}
function parseLocalImageUrl(localPath) {
  const match = localPath.match(/^local-image:\/\/(.+)\/(.+)$/);
  if (!match) return null;
  return { category: match[1], filename: match[2] };
}
function registerImageIpc() {
  electron.ipcMain.handle("search-web-images", async (_event, payload) => {
    const query = typeof payload?.query === "string" ? payload.query.trim().slice(0, 180) : "";
    if (!query) return [];
    const limit = Math.min(30, Math.max(1, Number(payload?.limit) || 12));
    try {
      return await searchBingWebImages(query, limit);
    } catch (error) {
      console.warn("[WebImageSearch] Bing search failed:", error);
      return [];
    }
  });
  electron.ipcMain.handle("save-image", async (_event, { url, category, filename, sourcePageUrl }) => {
    try {
      const imagesDir = getImagesDir(category);
      const ext = path.extname(filename) || ".png";
      const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(imagesDir, safeName);
      if (url.startsWith("data:")) {
        const matches = url.match(/^data:[^;]+;base64,(.+)$/s);
        if (!matches) {
          return { success: false, error: "Invalid data URL format" };
        }
        const buffer = Buffer.from(matches[1], "base64");
        if (buffer.length === 0) {
          return { success: false, error: "Decoded base64 data is empty (0 bytes)" };
        }
        fs.writeFileSync(filePath, buffer);
      } else {
        const sourcePath = resolveImageSourcePath(url);
        if (sourcePath) {
          if (!fs.existsSync(sourcePath)) {
            return { success: false, error: "Source image file not found" };
          }
          fs.copyFileSync(sourcePath, filePath);
        } else {
          await downloadImage(url, filePath, 5, typeof sourcePageUrl === "string" ? sourcePageUrl : void 0);
        }
      }
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        fs.unlinkSync(filePath);
        return { success: false, error: "Saved file is 0 bytes" };
      }
      return { success: true, localPath: `local-image://${category}/${safeName}` };
    } catch (error) {
      console.error("Failed to save image:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("get-image-path", async (_event, localPath) => {
    const parsed = parseLocalImageUrl(localPath);
    if (!parsed) return null;
    const filePath = path.join(getMediaRoot(), parsed.category, parsed.filename);
    if (fs.existsSync(filePath)) {
      return `file:///${filePath.replace(/\\/g, "/")}`;
    }
    return null;
  });
  electron.ipcMain.handle("delete-image", async (_event, localPath) => {
    const parsed = parseLocalImageUrl(localPath);
    if (!parsed) return false;
    const filePath = path.join(getMediaRoot(), parsed.category, parsed.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch {
      return false;
    }
  });
  electron.ipcMain.handle("read-image-base64", async (_event, localPath) => {
    try {
      if (isHttpUrl(localPath)) {
        const { buffer, mimeType: mimeType2 } = await fetchBuffer(localPath);
        const base642 = `data:${mimeType2};base64,${buffer.toString("base64")}`;
        return { success: true, base64: base642, mimeType: mimeType2, size: buffer.length };
      }
      let filePath;
      const parsed = parseLocalImageUrl(localPath);
      if (parsed) {
        filePath = path.join(getMediaRoot(), parsed.category, decodeURIComponent(parsed.filename));
      } else if (localPath.startsWith("file://")) {
        filePath = localPath.replace("file://", "");
      } else {
        filePath = localPath;
      }
      if (!fs.existsSync(filePath)) {
        return { success: false, error: "File not found" };
      }
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".mkv": "video/x-matroska"
      };
      const mimeType = mimeTypes[ext] || "image/png";
      const base64 = `data:${mimeType};base64,${data.toString("base64")}`;
      return { success: true, base64, mimeType, size: data.length };
    } catch (error) {
      console.error("Failed to read image:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("get-absolute-path", async (_event, localPath) => {
    const parsed = parseLocalImageUrl(localPath);
    if (!parsed) return null;
    const filePath = path.join(getMediaRoot(), parsed.category, decodeURIComponent(parsed.filename));
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  });
  electron.ipcMain.handle("image-host-upload", async (_event, payload) => {
    return uploadImageHostFromMain(payload);
  });
}
const getDataDir = () => {
  const dataDir = getProjectDataRoot();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};
const fileStorageWriteQueues = /* @__PURE__ */ new Map();
async function writeFileStorageAtomic(filePath, value) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    await fs.promises.writeFile(tempPath, value, "utf-8");
    await fs.promises.rename(tempPath, filePath);
  } catch (error) {
    await fs.promises.rm(tempPath, { force: true }).catch(() => void 0);
    throw error;
  }
}
function registerFileStorageIpc() {
  electron.ipcMain.handle("file-storage-get", async (_event, key) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`);
      return await fs.promises.readFile(filePath, "utf-8");
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      console.error("Failed to read file storage:", error);
      return null;
    }
  });
  electron.ipcMain.handle("file-storage-set", async (_event, key, value) => {
    const filePath = path.join(getDataDir(), `${key}.json`);
    const queued = (fileStorageWriteQueues.get(key) ?? Promise.resolve()).catch(() => void 0).then(() => writeFileStorageAtomic(filePath, value));
    fileStorageWriteQueues.set(key, queued.catch(() => void 0));
    try {
      await queued;
      return true;
    } catch (error) {
      console.error("Failed to write file storage:", error);
      return false;
    }
  });
  electron.ipcMain.handle("file-storage-remove", async (_event, key) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error) {
      console.error("Failed to remove file storage:", error);
      return false;
    }
  });
  electron.ipcMain.handle("file-storage-exists", async (_event, key) => {
    try {
      const filePath = path.join(getDataDir(), `${key}.json`);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  });
  electron.ipcMain.handle("file-storage-list-dirs", async (_event, prefix) => {
    try {
      const dirPath = path.join(getDataDir(), prefix);
      if (!fs.existsSync(dirPath)) return [];
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "_migrated").map((e) => e.name);
    } catch {
      return [];
    }
  });
  electron.ipcMain.handle("file-storage-list", async (_event, prefix) => {
    try {
      const dirPath = path.join(getDataDir(), prefix);
      if (!fs.existsSync(dirPath)) return [];
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => `${prefix}/${e.name.replace(".json", "")}`);
    } catch {
      return [];
    }
  });
  electron.ipcMain.handle("file-storage-remove-dir", async (_event, prefix) => {
    try {
      const dirPath = path.join(getDataDir(), prefix);
      if (fs.existsSync(dirPath)) {
        await fs.promises.rm(dirPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.error("Failed to remove directory:", error);
      return false;
    }
  });
}
function registerStorageManagerIpc() {
  electron.ipcMain.handle("storage-get-paths", async () => {
    return {
      basePath: getStorageBasePath(),
      projectPath: getProjectDataRoot(),
      mediaPath: getMediaRoot(),
      cachePath: path.join(electron.app.getPath("userData"), "Cache")
    };
  });
  electron.ipcMain.handle("storage-select-directory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });
  electron.ipcMain.handle("export-write-files", async (_event, payload) => {
    try {
      const baseDir = normalizePath(payload.baseDir);
      await fs.promises.mkdir(baseDir, { recursive: true });
      for (const file of payload.files) {
        const targetPath = path.resolve(baseDir, file.relativePath);
        if (!targetPath.startsWith(baseDir + path.sep) && targetPath !== baseDir) {
          throw new Error(`Invalid export path: ${file.relativePath}`);
        }
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
        if (typeof file.text === "string") {
          await fs.promises.writeFile(targetPath, file.text, "utf8");
        } else {
          const data = file.data instanceof ArrayBuffer ? new Uint8Array(file.data) : file.data;
          await fs.promises.writeFile(targetPath, data);
        }
      }
      return { success: true };
    } catch (error) {
      console.error("[Export] Failed to write files:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("storage-validate-data-dir", async (_event, dirPath) => {
    try {
      if (!dirPath) return { valid: false, error: "Path is required" };
      const target = normalizePath(dirPath);
      if (!fs.existsSync(target)) return { valid: false, error: "Directory does not exist" };
      const projectsDir = path.join(target, "projects");
      const mediaDir = path.join(target, "media");
      let projectCount = 0;
      let mediaCount = 0;
      if (fs.existsSync(projectsDir)) {
        const files = await fs.promises.readdir(projectsDir);
        projectCount = files.filter((f) => f.endsWith(".json")).length;
        const perProjectDir = path.join(projectsDir, "_p");
        if (fs.existsSync(perProjectDir)) {
          const projectDirs = await fs.promises.readdir(perProjectDir, { withFileTypes: true });
          const dirCount = projectDirs.filter((d) => d.isDirectory() && !d.name.startsWith(".")).length;
          if (dirCount > 0) projectCount = Math.max(projectCount, dirCount);
        }
      }
      if (fs.existsSync(mediaDir)) {
        const entries = await fs.promises.readdir(mediaDir);
        mediaCount = entries.length;
      }
      if (projectCount === 0 && mediaCount === 0) {
        return { valid: false, error: "This directory does not contain valid data (expected projects/ or media/)" };
      }
      return { valid: true, projectCount, mediaCount };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-link-data", async (_event, dirPath) => {
    try {
      if (!dirPath) return { success: false, error: "Path is required" };
      const target = normalizePath(dirPath);
      if (!fs.existsSync(target)) return { success: false, error: "Directory does not exist" };
      const projectsDir = path.join(target, "projects");
      const mediaDir = path.join(target, "media");
      const hasProjects = fs.existsSync(projectsDir);
      const hasMedia = fs.existsSync(mediaDir);
      if (!hasProjects && !hasMedia) {
        return { success: false, error: "This directory does not contain valid data (expected projects/ or media/)" };
      }
      setStorageBasePath(target);
      return { success: true, path: target };
    } catch (error) {
      console.error("Failed to link data:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-move-data", async (_event, newPath) => {
    try {
      if (!newPath) return { success: false, error: "Path is required" };
      const target = normalizePath(newPath);
      const currentBase = getStorageBasePath();
      if (currentBase === target) return { success: true, path: currentBase };
      const conflictError = pathsConflict(currentBase, target);
      if (conflictError) {
        return { success: false, error: conflictError };
      }
      const targetProjectsDir = path.join(target, "projects");
      const targetMediaDir = path.join(target, "media");
      ensureDir(targetProjectsDir);
      ensureDir(targetMediaDir);
      const currentProjectsDir = getProjectDataRoot();
      if (fs.existsSync(currentProjectsDir)) {
        const files = await fs.promises.readdir(currentProjectsDir);
        for (const file of files) {
          const src = path.join(currentProjectsDir, file);
          const dest = path.join(targetProjectsDir, file);
          await fs.promises.cp(src, dest, { recursive: true, force: true });
        }
      }
      const currentMediaDir = getMediaRoot();
      if (fs.existsSync(currentMediaDir)) {
        const files = await fs.promises.readdir(currentMediaDir);
        for (const file of files) {
          const src = path.join(currentMediaDir, file);
          const dest = path.join(targetMediaDir, file);
          await fs.promises.cp(src, dest, { recursive: true, force: true });
        }
      }
      setStorageBasePath(target);
      const userData = electron.app.getPath("userData");
      if (!currentProjectsDir.startsWith(userData)) {
        await removeDir(currentProjectsDir).catch(() => {
        });
      }
      if (!currentMediaDir.startsWith(userData)) {
        await removeDir(currentMediaDir).catch(() => {
        });
      }
      return { success: true, path: target };
    } catch (error) {
      console.error("Failed to move data:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-export-data", async (_event, targetPath) => {
    try {
      if (!targetPath) return { success: false, error: "Path is required" };
      const exportDir = path.join(
        normalizePath(targetPath),
        `longdd-data-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`
      );
      const exportProjectsDir = path.join(exportDir, "projects");
      const exportMediaDir = path.join(exportDir, "media");
      ensureDir(exportProjectsDir);
      ensureDir(exportMediaDir);
      await copyDir(getProjectDataRoot(), exportProjectsDir);
      await copyDir(getMediaRoot(), exportMediaDir);
      return { success: true, path: exportDir };
    } catch (error) {
      console.error("Failed to export data:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-import-data", async (_event, sourcePath) => {
    try {
      if (!sourcePath) return { success: false, error: "Path is required" };
      const source = normalizePath(sourcePath);
      const sourceProjectsDir = path.join(source, "projects");
      const sourceMediaDir = path.join(source, "media");
      const hasProjects = fs.existsSync(sourceProjectsDir);
      const hasMedia = fs.existsSync(sourceMediaDir);
      if (!hasProjects && !hasMedia) {
        return { success: false, error: "Source directory does not contain valid data (expected projects/ or media/)" };
      }
      const backupDir = path.join(os.tmpdir(), `longdd-backup-${Date.now()}`);
      const currentProjectsDir = getProjectDataRoot();
      const currentMediaDir = getMediaRoot();
      try {
        if (hasProjects && fs.existsSync(currentProjectsDir)) {
          const files = await fs.promises.readdir(currentProjectsDir);
          if (files.length > 0) {
            await copyDir(currentProjectsDir, path.join(backupDir, "projects"));
          }
        }
        if (hasMedia && fs.existsSync(currentMediaDir)) {
          const files = await fs.promises.readdir(currentMediaDir);
          if (files.length > 0) {
            await copyDir(currentMediaDir, path.join(backupDir, "media"));
          }
        }
        if (hasProjects) {
          await removeDir(currentProjectsDir).catch(() => {
          });
          await copyDir(sourceProjectsDir, currentProjectsDir);
        }
        if (hasMedia) {
          await removeDir(currentMediaDir).catch(() => {
          });
          await copyDir(sourceMediaDir, currentMediaDir);
        }
        const migrationFlagPath = path.join(currentProjectsDir, "_p", "_migrated.json");
        if (fs.existsSync(migrationFlagPath)) {
          fs.unlinkSync(migrationFlagPath);
          console.log("Cleared migration flag for re-evaluation after import");
        }
        await removeDir(backupDir).catch(() => {
        });
        return { success: true };
      } catch (importError) {
        console.error("Import failed, rolling back:", importError);
        const backupProjectsDir = path.join(backupDir, "projects");
        const backupMediaDir = path.join(backupDir, "media");
        if (fs.existsSync(backupProjectsDir)) {
          await removeDir(currentProjectsDir).catch(() => {
          });
          await copyDir(backupProjectsDir, currentProjectsDir).catch(() => {
          });
        }
        if (fs.existsSync(backupMediaDir)) {
          await removeDir(currentMediaDir).catch(() => {
          });
          await copyDir(backupMediaDir, currentMediaDir).catch(() => {
          });
        }
        await removeDir(backupDir).catch(() => {
        });
        throw importError;
      }
    } catch (error) {
      console.error("Failed to import data:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-get-cache-size", async () => {
    const dirs = getCacheDirs();
    const details = await Promise.all(
      dirs.map(async (dirPath) => ({
        path: dirPath,
        size: await getDirectorySize(dirPath)
      }))
    );
    const total = details.reduce((sum, item) => sum + item.size, 0);
    return { total, details };
  });
  electron.ipcMain.handle("storage-clear-cache", async (_event, options) => {
    try {
      const clearedBytes = await clearCache(options?.olderThanDays);
      return { success: true, clearedBytes };
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return { success: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("storage-update-config", async (_event, config) => {
    updateStorageConfig(config);
    scheduleAutoClean();
    return true;
  });
}
electronUpdater.autoUpdater.autoDownload = false;
electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
function normalizeVersionParts(version) {
  return version.replace(/^v/i, "").split(".").map((part) => {
    const match = part.match(/\d+/);
    return match ? Number(match[0]) : 0;
  });
}
function compareVersions(left, right) {
  const leftParts = normalizeVersionParts(left);
  const rightParts = normalizeVersionParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}
async function resolveAvailableUpdate(currentVersion) {
  if (!electron.app.isPackaged) {
    throw new Error("Auto update is only available in the packaged desktop app");
  }
  const result = await electronUpdater.autoUpdater.checkForUpdates();
  const updateInfo = result?.updateInfo;
  if (!updateInfo?.version || compareVersions(updateInfo.version, currentVersion) <= 0) {
    return null;
  }
  return {
    currentVersion,
    latestVersion: updateInfo.version,
    releaseNotes: Array.isArray(updateInfo.releaseNotes) ? updateInfo.releaseNotes.map((note) => note.note).filter(Boolean).join("\n\n") : typeof updateInfo.releaseNotes === "string" ? updateInfo.releaseNotes : void 0,
    publishedAt: updateInfo.releaseDate
  };
}
function registerAppUpdaterIpc() {
  electron.ipcMain.handle("app-updater-get-current-version", async () => {
    return electron.app.getVersion();
  });
  electron.ipcMain.handle("app-updater-check", async () => {
    const currentVersion = electron.app.getVersion();
    try {
      const update = await resolveAvailableUpdate(currentVersion);
      return {
        success: true,
        currentVersion,
        hasUpdate: !!update,
        update
      };
    } catch (error) {
      console.error("Failed to check updates:", error);
      return {
        success: false,
        currentVersion,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("app-updater-download-and-install", async () => {
    if (!electron.app.isPackaged) {
      return { success: false, error: "Auto update is only available in the packaged desktop app" };
    }
    try {
      await electronUpdater.autoUpdater.downloadUpdate();
      electronUpdater.autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      console.error("Failed to download and install update:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  electron.ipcMain.handle("app-updater-open-link", async (_event, url) => {
    const safeUrl = sanitizeExternalUrl(url);
    if (!safeUrl) {
      return { success: false, error: "Invalid download link" };
    }
    try {
      await electron.shell.openExternal(safeUrl);
      return { success: true };
    } catch (error) {
      console.error("Failed to open external link:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
}
const AUTOPILOT_DEFAULT_PORT = 8787;
const AUTOPILOT_HOST = "127.0.0.1";
class AutopilotHttpServer {
  server = null;
  port = AUTOPILOT_DEFAULT_PORT;
  pending = /* @__PURE__ */ new Map();
  getWebContents = null;
  start(getWebContents) {
    if (this.server) return;
    this.getWebContents = getWebContents;
    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });
    this.server.listen(this.port, AUTOPILOT_HOST);
  }
  stop() {
    if (!this.server) return;
    for (const pending2 of this.pending.values()) {
      try {
        pending2.res.end();
      } catch {
      }
    }
    this.pending.clear();
    this.server.close();
    this.server = null;
  }
  getPort() {
    return this.port;
  }
  isRunning() {
    return this.server !== null;
  }
  handleSseEvent(requestId, event) {
    const pending2 = this.pending.get(requestId);
    if (!pending2 || !pending2.isSse) return;
    try {
      pending2.res.write(`data: ${JSON.stringify(event)}

`);
    } catch {
    }
  }
  handleResponse(requestId, status, body) {
    const pending2 = this.pending.get(requestId);
    if (!pending2) return;
    this.pending.delete(requestId);
    try {
      if (pending2.isSse) {
        pending2.res.write(`data: ${JSON.stringify({ type: "done", status, body })}

`);
        pending2.res.end();
        return;
      }
      const text = JSON.stringify(body ?? {});
      pending2.res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(text),
        "Access-Control-Allow-Origin": "*"
      });
      pending2.res.end(text);
    } catch {
    }
  }
  async handleRequest(req, res) {
    const webContents = this.getWebContents?.() ?? null;
    const url = new node_url.URL(req.url ?? "/", `http://${AUTOPILOT_HOST}:${this.port}`);
    const query = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }
    if (req.method === "GET" && url.pathname === "/autopilot/file") {
      const filePath = query.path;
      if (!filePath || !path.isAbsolute(filePath)) {
        res.writeHead(400, { "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "path must be an absolute path" }));
        return;
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "file not found" }));
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`,
        "Access-Control-Allow-Origin": "*"
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    if (req.method === "GET" && url.pathname === "/autopilot/server-status") {
      const text = JSON.stringify({ port: this.port, running: this.isRunning() });
      res.writeHead(200, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(text), "Access-Control-Allow-Origin": "*" });
      res.end(text);
      return;
    }
    if (!webContents || webContents.isDestroyed()) {
      const text = JSON.stringify({ error: "Renderer not ready" });
      res.writeHead(503, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(text), "Access-Control-Allow-Origin": "*" });
      res.end(text);
      return;
    }
    const bodyText = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (chunk) => {
        chunks.push(chunk);
      });
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    const requestId = `http-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const isSse = url.pathname.endsWith("/events");
    if (isSse) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });
      res.write(": connected\n\n");
      res.flushHeaders?.();
      this.pending.set(requestId, { res, isSse: true });
      req.on("close", () => {
        this.pending.delete(requestId);
      });
    } else {
      this.pending.set(requestId, { res, isSse: false });
    }
    let body;
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = void 0;
      }
    }
    webContents.send("autopilot:http-request", {
      requestId,
      method: req.method ?? "GET",
      path: url.pathname,
      query,
      body
    });
  }
}
const autopilotHttpServer = new AutopilotHttpServer();
function registerAutopilotIpc() {
  electron.ipcMain.handle("autopilot-server-status", () => {
    return {
      port: autopilotHttpServer.getPort(),
      running: autopilotHttpServer.isRunning()
    };
  });
  electron.ipcMain.on("autopilot:http-response", (_event, requestId, status, body) => {
    autopilotHttpServer.handleResponse(requestId, status, body);
  });
  electron.ipcMain.on("autopilot:sse-event", (_event, requestId, event) => {
    autopilotHttpServer.handleSseEvent(requestId, event);
  });
}
function startAutopilotServer() {
  autopilotHttpServer.start(() => findAppWebContents());
}
const STATIC_CLAUDE_MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-6",
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001"
];
function resolveCliPathEnv() {
  const nvmVersionsDir = path.join(os.homedir(), ".nvm", "versions", "node");
  const nvmBinDirs = fs.existsSync(nvmVersionsDir) ? fs.readdirSync(nvmVersionsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(nvmVersionsDir, entry.name, "bin")) : [];
  const entries = [
    process.env.PATH,
    "/opt/homebrew/bin",
    "/usr/local/bin",
    path.join(os.homedir(), ".local", "bin"),
    path.join(os.homedir(), ".npm-global", "bin"),
    path.join(os.homedir(), ".bun", "bin"),
    path.join(os.homedir(), ".claude", "bin"),
    path.join(os.homedir(), ".claude", "local"),
    path.join(os.homedir(), ".codex", "bin"),
    path.join(os.homedir(), ".opencode", "bin"),
    path.join(os.homedir(), "Library", "pnpm"),
    path.join(os.homedir(), ".config", "yarn", "global", "node_modules", ".bin"),
    path.join(os.homedir(), "anaconda3", "bin"),
    path.join(os.homedir(), "miniconda3", "bin"),
    "/opt/anaconda3/bin",
    "/opt/miniconda3/bin",
    ...nvmBinDirs
  ].filter(Boolean);
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    entries.push(
      path.join(appData, "npm"),
      path.join(os.homedir(), "scoop", "shims"),
      path.join(process.env.ChocolateyInstall || "C:\\ProgramData\\chocolatey", "bin"),
      path.join(process.env.ProgramFiles || "C:\\Program Files", "nodejs"),
      path.join(localAppData, "Programs", "nodejs"),
      path.join(os.homedir(), ".logdd", "runtime", "node-v22.14.0-win-x64"),
      path.join(os.homedir(), ".logdd", "runtime", "node-v22.14.0-win-arm64"),
      path.join(os.homedir(), ".logdd", "cli", "node_modules", ".bin")
    );
  }
  return [...new Set(entries.flatMap((entry) => entry.split(path.delimiter)).filter(Boolean))].join(path.delimiter);
}
const CLI_PATH_ENV = resolveCliPathEnv();
function detectCliPath(command) {
  if (!/^[a-z0-9_-]+$/i.test(command)) return null;
  const candidates = [
    path.join(os.homedir(), ".local", "bin", command),
    path.join(os.homedir(), ".claude", "bin", command),
    path.join(os.homedir(), ".claude", "local", command),
    path.join(os.homedir(), ".codex", "bin", command),
    path.join(os.homedir(), ".opencode", "bin", command),
    path.join(os.homedir(), ".bun", "bin", command)
  ];
  if (process.platform === "darwin" && command === "codex") {
    candidates.push(
      "/Applications/ChatGPT.app/Contents/Resources/codex",
      "/Applications/Codex.app/Contents/Resources/codex",
      path.join(os.homedir(), "Applications", "ChatGPT.app", "Contents", "Resources", "codex"),
      path.join(os.homedir(), "Applications", "Codex.app", "Contents", "Resources", "codex")
    );
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const windowsCandidates = [
      path.join(appData, "npm", command),
      path.join(os.homedir(), "scoop", "shims", command),
      path.join(process.env.ChocolateyInstall || "C:\\ProgramData\\chocolatey", "bin", command),
      path.join(os.homedir(), ".logdd", "cli", "node_modules", ".bin", command)
    ];
    candidates.push(...windowsCandidates);
    candidates.push(...candidates.flatMap((candidate) => [`${candidate}.cmd`, `${candidate}.exe`, `${candidate}.bat`]));
  }
  const direct = candidates.find((candidate) => fs.existsSync(candidate));
  if (direct) return direct;
  try {
    const lookupCommand = process.platform === "win32" ? "where.exe" : "which";
    const result = node_child_process.execFileSync(lookupCommand, [command], {
      timeout: 3e3,
      encoding: "utf8",
      env: { ...process.env, PATH: CLI_PATH_ENV }
    }).trim().split("\n")[0].trim();
    return result || null;
  } catch {
  }
  if (process.platform !== "win32") {
    try {
      const shell = process.env.SHELL || (process.platform === "darwin" ? "/bin/zsh" : "/bin/sh");
      const result = node_child_process.execFileSync(shell, ["-lic", `command -v ${command}`], {
        timeout: 5e3,
        encoding: "utf8",
        env: process.env
      }).trim().split(/\r?\n/).filter(Boolean).pop()?.trim();
      if (result && path.isAbsolute(result) && fs.existsSync(result)) return result;
    } catch {
    }
  }
  return null;
}
function normalizeOpenCodeModel(model) {
  if (!model) return void 0;
  return model.includes("/") ? model : `anthropic/${model}`;
}
function parseOpenCodeModels(stdout) {
  const models = [];
  const seen = /* @__PURE__ */ new Set();
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const firstToken = line.split(/\s+/)[0]?.trim() ?? "";
    if (!firstToken.includes("/")) continue;
    const [provider, ...rest] = firstToken.split("/");
    const model = rest.join("/");
    if (!provider || !model) continue;
    const id = `${provider}/${model}`;
    if (!seen.has(id)) {
      seen.add(id);
      models.push(id);
    }
  }
  return models.sort((a, b) => a.localeCompare(b, "en", {
    numeric: true,
    sensitivity: "base"
  }));
}
function parseCodexModels(stdout) {
  try {
    const payload = JSON.parse(stdout);
    return (payload.models ?? []).filter((model) => model.visibility === void 0 || model.visibility === "list").map((model) => typeof model.slug === "string" ? model.slug.trim() : "").filter((model, index, all) => Boolean(model) && all.indexOf(model) === index);
  } catch {
    return [];
  }
}
function parseCodexModelEfforts(stdout) {
  try {
    const payload = JSON.parse(stdout);
    return Object.fromEntries((payload.models ?? []).flatMap((model) => {
      if (typeof model.slug !== "string" || !model.slug.trim()) return [];
      const efforts = (model.supported_reasoning_levels ?? []).map((level) => typeof level.effort === "string" ? level.effort.trim() : "").filter((effort, index, all) => Boolean(effort) && all.indexOf(effort) === index);
      return [[model.slug.trim(), efforts]];
    }));
  } catch {
    return {};
  }
}
const activeTasks = /* @__PURE__ */ new Map();
function cancelCliTextTask(requestId) {
  const task = activeTasks.get(requestId);
  if (!task) return { canceled: false };
  task.canceled = true;
  try {
    task.child.kill("SIGTERM");
  } catch {
  }
  task.killTimer = setTimeout(() => {
    try {
      task.child.kill("SIGKILL");
    } catch {
    }
  }, 3e3);
  return { canceled: true };
}
const CLI_INSTALLERS = {
  claude: {
    unix: "curl -fsSL https://claude.ai/install.sh | bash",
    npmPackage: "@anthropic-ai/claude-code"
  },
  opencode: {
    unix: "curl -fsSL https://opencode.ai/install | bash",
    npmPackage: "opencode-ai"
  },
  codex: {
    unix: "curl -fsSL https://chatgpt.com/codex/install.sh | sh",
    npmPackage: "@openai/codex"
  }
};
function runInstallerProcess(command, args, timeoutMs = 10 * 6e4) {
  return new Promise((resolve) => {
    const resolved = resolveSpawnArgs(command, args);
    const child = node_child_process.spawn(resolved.command, resolved.args, {
      shell: false,
      windowsHide: true,
      env: cliEnvironment()
    });
    let output = "";
    let settled = false;
    const append = (data) => {
      output = `${output}${data.toString()}`.slice(-16e3);
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", append);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGTERM");
      } catch {
      }
      resolve({ ok: false, output: `${output}
Cài đặt quá thời gian cho phép.`.trim(), code: null });
    }, timeoutMs);
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, output: `${output}
${error.message}`.trim(), code: null });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: code === 0, output: output.trim(), code });
    });
  });
}
function windowsGitBashPath() {
  if (process.platform !== "win32") return null;
  const candidates = [
    process.env.CLAUDE_CODE_GIT_BASH_PATH,
    path.join(process.env.ProgramFiles || "C:\\Program Files", "Git", "bin", "bash.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Git", "bin", "bash.exe"),
    path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Programs", "Git", "bin", "bash.exe"),
    path.join(os.homedir(), "scoop", "apps", "git", "current", "bin", "bash.exe")
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}
async function ensureWindowsGitBash() {
  if (windowsGitBashPath()) return { ok: true, output: "Git Bash đã sẵn sàng." };
  const installers = [
    { command: "winget", args: ["install", "--id", "Git.Git", "--exact", "--silent", "--accept-package-agreements", "--accept-source-agreements"] },
    { command: "choco", args: ["install", "git", "-y"] },
    { command: "scoop", args: ["install", "git"] }
  ];
  for (const candidate of installers) {
    const executable = detectCliPath(candidate.command);
    if (!executable) continue;
    const result = await runInstallerProcess(executable, candidate.args);
    if (result.ok && windowsGitBashPath()) return { ok: true, output: result.output };
  }
  return {
    ok: false,
    output: "Claude Code trên Windows cần Git Bash. Không tìm thấy winget, Chocolatey hoặc Scoop để tự cài Git for Windows."
  };
}
async function ensureManagedWindowsNode() {
  const systemNpm = detectCliPath("npm");
  if (systemNpm) return { npmPath: systemNpm, output: "Đang dùng npm có sẵn trên máy." };
  const version = "22.14.0";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  const expectedSha256 = arch === "arm64" ? "2d71f5f9b2fffa33baa108c07d74b0d24e0c3dd8f441d567772ae0e3dd4b1a22" : "55b639295920b219bb2acbcfa00f90393a2789095b7323f79475c9f34795f217";
  const folderName = `node-v${version}-win-${arch}`;
  const runtimeRoot2 = path.join(os.homedir(), ".logdd", "runtime");
  const nodeRoot = path.join(runtimeRoot2, folderName);
  const npmPath = path.join(nodeRoot, "npm.cmd");
  if (fs.existsSync(npmPath)) return { npmPath, output: `Đang dùng Node.js riêng của logdd (${version}).` };
  fs.mkdirSync(runtimeRoot2, { recursive: true });
  const zipPath = path.join(runtimeRoot2, `${folderName}.zip`);
  try {
    const response = await fetch(`https://nodejs.org/dist/v${version}/${folderName}.zip`);
    if (!response.ok) throw new Error(`Tải Node.js thất bại (${response.status}).`);
    const archive = Buffer.from(await response.arrayBuffer());
    const actualSha256 = crypto.createHash("sha256").update(archive).digest("hex");
    if (actualSha256 !== expectedSha256) throw new Error("Gói Node.js tải về không vượt qua kiểm tra an toàn SHA-256.");
    fs.writeFileSync(zipPath, archive);
    const quote = (value) => value.replace(/'/g, "''");
    const extracted = await runInstallerProcess("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Expand-Archive -LiteralPath '${quote(zipPath)}' -DestinationPath '${quote(runtimeRoot2)}' -Force`
    ]);
    if (!extracted.ok || !fs.existsSync(npmPath)) {
      return { output: extracted.output || "Không thể giải nén Node.js tự quản lý." };
    }
    return { npmPath, output: `Đã chuẩn bị Node.js riêng cho logdd (${version}).` };
  } catch (error) {
    return { output: error instanceof Error ? error.message : String(error) };
  } finally {
    try {
      fs.unlinkSync(zipPath);
    } catch {
    }
  }
}
async function installCliOnWindows(adapter) {
  let preparation = "";
  if (adapter === "claude") {
    const git = await ensureWindowsGitBash();
    preparation = git.output;
    if (!git.ok) return { ok: false, output: git.output, code: null };
  }
  const node = await ensureManagedWindowsNode();
  preparation = `${preparation}
${node.output}`.trim();
  if (!node.npmPath) return { ok: false, output: preparation, code: null };
  const managedCliRoot = path.join(os.homedir(), ".logdd", "cli");
  fs.mkdirSync(managedCliRoot, { recursive: true });
  const installed = await runInstallerProcess(node.npmPath, [
    "install",
    "--prefix",
    managedCliRoot,
    CLI_INSTALLERS[adapter].npmPackage,
    "--no-audit",
    "--no-fund"
  ]);
  return { ...installed, output: `${preparation}
${installed.output}`.trim() };
}
async function installCli(adapter) {
  const installer = CLI_INSTALLERS[adapter];
  const result = process.platform === "win32" ? await installCliOnWindows(adapter) : await runInstallerProcess("/bin/sh", ["-lc", installer.unix]);
  const status = await detectCli(adapter);
  if (result.ok && status.available) return { success: true, output: result.output, status };
  return {
    success: false,
    output: result.output,
    status,
    error: result.output || `Installer kết thúc với mã ${result.code ?? "không xác định"}.`
  };
}
function resolveCliCommand(command) {
  return detectCliPath(command) || command;
}
function resolveSpawnArgs(command, args) {
  if (process.platform === "win32") {
    return { command: "cmd", args: ["/c", command, ...args] };
  }
  return { command, args };
}
function cliEnvironment(extra = {}) {
  const gitBash = windowsGitBashPath();
  return {
    ...process.env,
    PATH: CLI_PATH_ENV,
    ...gitBash ? { CLAUDE_CODE_GIT_BASH_PATH: gitBash } : {},
    ...extra
  };
}
function spawnAndStream(cfg) {
  return new Promise((resolve) => {
    const resolved = cfg.direct ? { command: cfg.command, args: cfg.args } : resolveSpawnArgs(cfg.command, cfg.args);
    const child = node_child_process.spawn(resolved.command, resolved.args, {
      shell: false,
      cwd: cfg.cwd,
      env: cliEnvironment(cfg.env),
      windowsHide: true
    });
    let stdoutBuf = "";
    let stderrBuf = "";
    let timedOut = false;
    let settled = false;
    let timeoutHandle = null;
    let activeTask;
    if (cfg.requestId) {
      activeTask = { child, canceled: false };
      activeTasks.set(cfg.requestId, activeTask);
    }
    const finish = (code) => {
      if (settled) return;
      settled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      const currentTask = cfg.requestId ? activeTasks.get(cfg.requestId) : void 0;
      const canceled = Boolean((currentTask || activeTask)?.canceled);
      const killTimer = (currentTask || activeTask)?.killTimer;
      if (killTimer) clearTimeout(killTimer);
      if (cfg.requestId && currentTask === activeTask) {
        activeTasks.delete(cfg.requestId);
      }
      if (stdoutBuf.trim()) cfg.onStdoutLine(stdoutBuf.trim());
      if (stderrBuf.trim()) cfg.onStderrLine(stderrBuf.trim());
      resolve({ exitCode: code, timedOut, canceled });
    };
    if (cfg.timeoutMs) {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        try {
          child.kill("SIGTERM");
        } catch {
        }
        setTimeout(() => {
          try {
            if (!child.killed) child.kill("SIGKILL");
          } catch {
          }
        }, 3e3);
      }, cfg.timeoutMs);
    }
    if (cfg.stdinText !== void 0) {
      try {
        child.stdin?.write(cfg.stdinText);
        child.stdin?.end();
      } catch {
      }
    }
    child.stdout?.on("data", (data) => {
      stdoutBuf += data.toString();
      const lines = stdoutBuf.split(/\r?\n/);
      stdoutBuf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) cfg.onStdoutLine(trimmed);
      }
    });
    child.stderr?.on("data", (data) => {
      stderrBuf += data.toString();
      const lines = stderrBuf.split(/\r?\n/);
      stderrBuf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) cfg.onStderrLine(trimmed);
      }
    });
    child.on("close", finish);
    child.on("error", () => finish(-1));
  });
}
function detectCli(command, args = ["--version"]) {
  const cliPath = detectCliPath(command);
  return new Promise((resolve) => {
    const resolved = resolveSpawnArgs(cliPath || command, args);
    const child = node_child_process.spawn(resolved.command, resolved.args, {
      shell: false,
      windowsHide: true,
      env: cliEnvironment()
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (available, version, error) => {
      if (settled) return;
      settled = true;
      resolve({ available, version, error, path: cliPath });
    };
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) => finish(false, void 0, error.message));
    child.on("close", (code) => {
      const output = `${stdout}
${stderr}`.trim();
      if (code === 0) {
        finish(true, output.split(/\r?\n/)[0]?.trim() || "OK");
      } else {
        finish(false, void 0, output || `${command} exited with code ${code}`);
      }
    });
  });
}
const CONTENT_MCP_TOOLS = [
  {
    name: "search_youtube",
    description: "Search YouTube using the Research feature already configured in logdd. Use this when the user asks to find videos, topics, Shorts, long videos, or live videos. The YouTube API key is managed by logdd and must never be requested from the user by this tool.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "YouTube search query." },
        kind: { type: "string", enum: ["Long", "Shorts", "Live"], description: "Video kind. Defaults to Long." },
        order: { type: "string", enum: ["relevance", "viewCount"], description: "Sort order. Defaults to relevance." },
        limit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum number of videos returned. Defaults to 10." },
        publishedAfter: { type: "string", description: "Optional ISO-8601 lower publication bound." },
        publishedBefore: { type: "string", description: "Optional ISO-8601 upper publication bound." },
        duration: { type: "string", enum: ["short", "medium", "long"], description: "Optional YouTube duration filter." }
      },
      required: ["query"],
      additionalProperties: false
    }
  },
  {
    name: "get_youtube_comments",
    description: "Load public comments and replies from one YouTube video using the Comments feature already configured in logdd. Accepts a YouTube URL or video ID. Use the limit to avoid flooding the conversation; the result also reports the total number loaded.",
    inputSchema: {
      type: "object",
      properties: {
        video: { type: "string", description: "YouTube video URL or 11-character video ID." },
        limit: { type: "integer", minimum: 1, maximum: 500, description: "Maximum comments returned. Defaults to 200." }
      },
      required: ["video"],
      additionalProperties: false
    }
  },
  {
    name: "get_youtube_transcript",
    description: "Get the transcript/captions of one YouTube video through the Media Toolkit already available in logdd. It supports creator subtitles and automatic captions. Accepts a YouTube URL or video ID.",
    inputSchema: {
      type: "object",
      properties: {
        video: { type: "string", description: "YouTube video URL or 11-character video ID." },
        language: { type: "string", description: "Preferred caption language code such as vi, en, or en-US. If omitted, the best available track is selected." },
        includeTimestamps: { type: "boolean", description: "Return SRT timestamps instead of plain transcript text. Defaults to false." }
      },
      required: ["video"],
      additionalProperties: false
    }
  },
  {
    name: "create_tts_audio",
    description: "Synthesize speech from text using the local OmniVoice TTS engine inside logdd. Returns the generated audio file path and duration.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The text script or narration to speak." },
        voiceProfileId: { type: "string", description: "Optional ID of an existing voice clone profile." },
        voiceDesignDescription: { type: "string", description: "Optional natural language description of voice character if using Voice Design." },
        speed: { type: "number", minimum: 0.5, maximum: 2, description: "Speech speed multiplier. Defaults to 1.0." }
      },
      required: ["text"],
      additionalProperties: false
    }
  },
  {
    name: "list_voice_profiles",
    description: "List all available voice clone profiles and built-in voices in logdd.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "create_video_project",
    description: "Create a new video project in Video AI Studio with title, aspect ratio, scenes, image prompts, and narration lines.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the new video project." },
        aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1"], description: "Video aspect ratio. Defaults to 16:9." },
        scenes: {
          type: "array",
          description: "List of video scenes with visual prompts and narration scripts.",
          items: {
            type: "object",
            properties: {
              sceneNumber: { type: "integer", description: "Scene index." },
              imagePrompt: { type: "string", description: "Detailed prompt for visual image generation." },
              narration: { type: "string", description: "Voice narration script for this scene." },
              durationSec: { type: "number", description: "Estimated scene duration in seconds." }
            },
            required: ["sceneNumber", "imagePrompt", "narration"]
          }
        }
      },
      required: ["title", "scenes"],
      additionalProperties: false
    }
  },
  {
    name: "get_system_resource_metrics",
    description: "Check current system CPU usage %, RAM memory, and running background media/AI processes.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];
const activeProcesses = /* @__PURE__ */ new Map();
function spawnManagedProcess(id, name, command, args = [], options = {}) {
  if (activeProcesses.has(id)) {
    terminateManagedProcess(id);
  }
  const child = node_child_process.spawn(command, args, {
    ...options,
    // Detach on Unix so process.kill(-pid) terminates all descendants
    detached: process.platform !== "win32"
  });
  if (child.pid) {
    const record = {
      id,
      name,
      pid: child.pid,
      startTime: Date.now(),
      process: child
    };
    activeProcesses.set(id, record);
    const cleanup = () => {
      activeProcesses.delete(id);
    };
    child.on("exit", cleanup);
    child.on("error", cleanup);
  }
  return child;
}
function terminateManagedProcess(id, signal = "SIGTERM") {
  const record = activeProcesses.get(id);
  if (!record || !record.pid) return false;
  const pid = record.pid;
  activeProcesses.delete(id);
  if (process.platform === "win32") {
    try {
      const killer = node_child_process.spawn("taskkill", ["/pid", String(pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true
      });
      killer.unref();
    } catch {
      try {
        record.process.kill();
      } catch {
      }
    }
    return true;
  }
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") {
      try {
        record.process.kill(signal);
      } catch {
      }
    }
  }
  return true;
}
function terminateAllManagedProcesses() {
  for (const id of Array.from(activeProcesses.keys())) {
    terminateManagedProcess(id, "SIGKILL");
  }
  activeProcesses.clear();
}
function getActiveProcessList() {
  const now = Date.now();
  return Array.from(activeProcesses.values()).map((proc) => ({
    id: proc.id,
    name: proc.name,
    pid: proc.pid,
    runtimeMs: now - proc.startTime
  }));
}
let previousCpus = os.cpus();
let monitorTimer = null;
function calculateCpuUsage() {
  const currentCpus = os.cpus();
  let idleDelta = 0;
  let totalDelta = 0;
  for (let i = 0; i < currentCpus.length; i++) {
    const prev = previousCpus[i]?.times;
    const curr = currentCpus[i]?.times;
    if (!prev || !curr) continue;
    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;
    totalDelta += currTotal - prevTotal;
    idleDelta += curr.idle - prev.idle;
  }
  previousCpus = currentCpus;
  if (totalDelta === 0) return 0;
  const usage = Math.round((1 - idleDelta / totalDelta) * 100);
  return Math.max(0, Math.min(100, usage));
}
function getSystemResourceMetrics() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const totalMemMb = Math.round(totalBytes / (1024 * 1024));
  const freeMemMb = Math.round(freeBytes / (1024 * 1024));
  const usedMemMb = Math.round(usedBytes / (1024 * 1024));
  const memUsagePercent = Math.round(usedBytes / totalBytes * 100);
  return {
    cpuUsagePercent: calculateCpuUsage(),
    totalMemMb,
    usedMemMb,
    freeMemMb,
    memUsagePercent,
    activeProcesses: getActiveProcessList()
  };
}
function registerResourceMonitorIpc() {
  electron.ipcMain.handle("system:get-resource-metrics", () => {
    return getSystemResourceMetrics();
  });
  electron.ipcMain.handle("system:cancel-managed-process", (_event, processId) => {
    return terminateManagedProcess(processId, "SIGKILL");
  });
  if (!monitorTimer) {
    monitorTimer = setInterval(() => {
      try {
        const metrics = getSystemResourceMetrics();
        broadcastToWindows("system:resource-metrics-update", metrics);
      } catch {
      }
    }, 3e3);
  }
}
function stopResourceMonitor() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
}
let server = null;
let connectionPromise = null;
let renderer = null;
const token = crypto.randomBytes(32).toString("hex");
const pending = /* @__PURE__ */ new Map();
function findRenderer() {
  if (renderer && !renderer.isDestroyed()) return renderer;
  const window = electron.BrowserWindow.getAllWindows().find((item) => !item.isDestroyed());
  return window?.webContents ?? null;
}
function callRenderer(name, args) {
  const target = findRenderer();
  if (!target) return Promise.reject(new Error("Content Chat is not open"));
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Tool ${name} timed out`));
    }, 10 * 60 * 1e3);
    pending.set(requestId, { senderId: target.id, resolve, reject, timer });
    target.send("content-mcp-tool-call", { requestId, name, arguments: args ?? {} });
  });
}
function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
async function handleRpc(message) {
  const id = message?.id ?? null;
  switch (message?.method) {
    case "initialize":
      return jsonRpcResult(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "logdd-content-tools", version: "0.1.0" }
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return jsonRpcResult(id, {});
    case "tools/list":
      return jsonRpcResult(id, { tools: CONTENT_MCP_TOOLS });
    case "tools/call": {
      const name = String(message?.params?.name ?? "");
      if (!CONTENT_MCP_TOOLS.some((tool) => tool.name === name)) {
        return jsonRpcError(id, -32602, `Unknown tool: ${name}`);
      }
      try {
        let result;
        if (name === "get_system_resource_metrics") {
          result = getSystemResourceMetrics();
        } else {
          result = await callRenderer(name, message?.params?.arguments);
        }
        return jsonRpcResult(id, {
          content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
          isError: false
        });
      } catch (error) {
        return jsonRpcResult(id, {
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
          isError: true
        });
      }
    }
    case "resources/list":
      return jsonRpcResult(id, { resources: [] });
    case "prompts/list":
      return jsonRpcResult(id, { prompts: [] });
    default:
      return jsonRpcError(id, -32601, `Method not found: ${String(message?.method ?? "")}`);
  }
}
function writeJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}
function registerContentMcpGateway() {
  electron.ipcMain.on("content-mcp-ready", (event) => {
    renderer = event.sender;
  });
  electron.ipcMain.on("content-mcp-tool-result", (event, payload) => {
    const requestId = String(payload?.requestId ?? "");
    const item = pending.get(requestId);
    if (!item || item.senderId !== event.sender.id) return;
    pending.delete(requestId);
    clearTimeout(item.timer);
    if (payload.success) item.resolve(payload.result);
    else item.reject(new Error(payload.error || "Tool call failed"));
  });
}
function getContentMcpConnection() {
  if (connectionPromise) return connectionPromise;
  connectionPromise = new Promise((resolve, reject) => {
    server = http.createServer(async (request, response) => {
      if (request.url !== "/mcp" || request.method !== "POST") {
        response.writeHead(404).end();
        return;
      }
      if (request.headers.authorization !== `Bearer ${token}`) {
        response.writeHead(401).end();
        return;
      }
      const chunks = [];
      let byteLength = 0;
      request.on("data", (chunk) => {
        byteLength += chunk.length;
        if (byteLength > 1024 * 1024) {
          request.destroy(new Error("MCP request exceeds 1 MB"));
          return;
        }
        chunks.push(chunk);
      });
      request.on("end", async () => {
        try {
          const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (Array.isArray(message)) {
            const results = (await Promise.all(message.map(handleRpc))).filter(Boolean);
            writeJson(response, 200, results);
            return;
          }
          const result = await handleRpc(message);
          if (result === null) {
            response.writeHead(202).end();
            return;
          }
          writeJson(response, 200, result);
        } catch (error) {
          writeJson(response, 400, jsonRpcError(null, -32700, error instanceof Error ? error.message : String(error)));
        }
      });
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server?.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to start Content MCP gateway"));
        return;
      }
      resolve({ url: `http://127.0.0.1:${address.port}/mcp`, token });
    });
  });
  return connectionPromise;
}
function closeContentMcpGateway() {
  for (const item of pending.values()) {
    clearTimeout(item.timer);
    item.reject(new Error("Content MCP gateway closed"));
  }
  pending.clear();
  server?.close();
  server = null;
  connectionPromise = null;
}
function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/.exec(content);
  const frontmatter = match?.[1] ?? "";
  const body = match ? content.slice(match[0].length).trim() : content.trim();
  const field = (name) => {
    const value = new RegExp(`^${name}:\\s*(.+)$`, "mi").exec(frontmatter)?.[1];
    return value ? unquote(value) : void 0;
  };
  return {
    body,
    name: field("name"),
    description: field("description") || "",
    agent: field("agent"),
    model: field("model"),
    subtask: field("subtask") === "true" ? true : field("subtask") === "false" ? false : void 0,
    userInvocable: field("user-invocable") !== "false"
  };
}
function markdownFiles(root) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(candidate);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(candidate);
    }
  };
  visit(root);
  return files;
}
function workspaceRoots(workingDirectory, configFolder) {
  if (!workingDirectory) return [];
  const start = path.resolve(workingDirectory);
  const chain = [];
  let current = start;
  let gitRootFound = false;
  while (true) {
    chain.push(current);
    if (fs.existsSync(path.join(current, ".git"))) {
      gitRootFound = true;
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const scoped = gitRootFound ? chain.reverse() : [start];
  return scoped.map((directory) => path.join(directory, configFolder));
}
function addSkills(target, root, provider, source) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(root, entry.name, "SKILL.md");
    if (!fs.existsSync(skillFile)) continue;
    const parsed = parseMarkdown(skillFile);
    if (!parsed.userInvocable) continue;
    const name = parsed.name || entry.name;
    target.set(name.toLocaleLowerCase(), {
      name,
      description: parsed.description || `${provider === "claude" ? "Claude" : provider === "opencode" ? "OpenCode" : "Codex"} skill from ${source}`,
      provider,
      kind: "skill",
      source,
      template: parsed.body
    });
  }
}
function addMarkdownCommands(target, root, provider, source) {
  for (const filePath of markdownFiles(root)) {
    const parsed = parseMarkdown(filePath);
    const relative = path.relative(root, filePath).replace(/\.md$/i, "").split(path.sep).join(":");
    const name = parsed.name || relative;
    target.set(name.toLocaleLowerCase(), {
      name,
      description: parsed.description || `${provider === "claude" ? "Claude" : provider === "opencode" ? "OpenCode" : "Codex"} command from ${source}`,
      provider,
      kind: "command",
      source,
      template: parsed.body,
      agent: parsed.agent,
      model: parsed.model,
      subtask: parsed.subtask
    });
  }
}
function discoverClaude(workingDirectory) {
  const commands = /* @__PURE__ */ new Map();
  const userRoot = path.join(os.homedir(), ".claude");
  addSkills(commands, path.join(userRoot, "skills"), "claude", "user");
  addMarkdownCommands(commands, path.join(userRoot, "commands"), "claude", "user");
  for (const root of workspaceRoots(workingDirectory, ".claude")) {
    addSkills(commands, path.join(root, "skills"), "claude", "workspace");
    addMarkdownCommands(commands, path.join(root, "commands"), "claude", "workspace");
  }
  return [...commands.values()];
}
function discoverOpenCode(workingDirectory) {
  const commands = /* @__PURE__ */ new Map();
  const home = os.homedir();
  const globalOpenCode = path.join(home, ".config", "opencode");
  addSkills(commands, path.join(globalOpenCode, "skills"), "opencode", "user");
  addSkills(commands, path.join(home, ".claude", "skills"), "opencode", "user");
  addSkills(commands, path.join(home, ".agents", "skills"), "opencode", "user");
  addMarkdownCommands(commands, path.join(globalOpenCode, "commands"), "opencode", "user");
  for (const root of workspaceRoots(workingDirectory, ".opencode")) {
    addSkills(commands, path.join(root, "skills"), "opencode", "workspace");
    addMarkdownCommands(commands, path.join(root, "commands"), "opencode", "workspace");
  }
  for (const root of workspaceRoots(workingDirectory, ".claude")) {
    addSkills(commands, path.join(root, "skills"), "opencode", "workspace");
  }
  for (const root of workspaceRoots(workingDirectory, ".agents")) {
    addSkills(commands, path.join(root, "skills"), "opencode", "workspace");
  }
  return [...commands.values()];
}
function discoverCodex(workingDirectory) {
  const commands = /* @__PURE__ */ new Map();
  const home = os.homedir();
  addSkills(commands, path.join(home, ".codex", "skills"), "codex", "user");
  addSkills(commands, path.join(home, ".agents", "skills"), "codex", "user");
  for (const root of workspaceRoots(workingDirectory, ".codex")) {
    addSkills(commands, path.join(root, "skills"), "codex", "workspace");
  }
  for (const root of workspaceRoots(workingDirectory, ".agents")) {
    addSkills(commands, path.join(root, "skills"), "codex", "workspace");
  }
  return [...commands.values()];
}
function rootsFor(provider, workingDirectory) {
  const home = os.homedir();
  const roots = [];
  if (provider === "claude") {
    roots.push(path.join(home, ".claude", "skills"), path.join(home, ".claude", "commands"));
    for (const root of workspaceRoots(workingDirectory, ".claude")) {
      roots.push(path.join(root, "skills"), path.join(root, "commands"));
    }
  } else if (provider === "opencode") {
    const globalOpenCode = path.join(home, ".config", "opencode");
    roots.push(
      path.join(globalOpenCode, "skills"),
      path.join(globalOpenCode, "commands"),
      path.join(home, ".claude", "skills"),
      path.join(home, ".agents", "skills")
    );
    for (const configFolder of [".opencode", ".claude", ".agents"]) {
      for (const root of workspaceRoots(workingDirectory, configFolder)) {
        roots.push(path.join(root, "skills"), path.join(root, "commands"));
      }
    }
  } else {
    roots.push(path.join(home, ".codex", "skills"), path.join(home, ".agents", "skills"));
    for (const configFolder of [".codex", ".agents"]) {
      for (const root of workspaceRoots(workingDirectory, configFolder)) {
        roots.push(path.join(root, "skills"));
      }
    }
  }
  return [...new Set(roots)];
}
const commandCache = /* @__PURE__ */ new Map();
const definitionCache = /* @__PURE__ */ new Map();
const watchedKeys = /* @__PURE__ */ new Set();
function cacheKey(provider, workingDirectory) {
  return `${provider}\0${workingDirectory ?? ""}`;
}
function nearestExistingDir(candidate) {
  let current = candidate;
  for (let depth = 0; depth < 10; depth += 1) {
    if (fs.existsSync(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return null;
}
function watchRoots(key, roots) {
  if (watchedKeys.has(key)) return;
  watchedKeys.add(key);
  const targets = /* @__PURE__ */ new Set();
  for (const root of roots) {
    const target = nearestExistingDir(root);
    if (target) targets.add(target);
  }
  for (const target of targets) {
    const invalidate = () => {
      commandCache.delete(key);
      definitionCache.delete(key);
    };
    try {
      const watcher = fs.watch(target, { recursive: true, persistent: false }, invalidate);
      watcher.on("error", invalidate);
    } catch {
      try {
        const watcher = fs.watch(target, { persistent: false }, invalidate);
        watcher.on("error", invalidate);
      } catch {
        commandCache.delete(key);
        watchedKeys.delete(key);
      }
    }
  }
}
function discoverContentSlashCommands(provider, workingDirectory) {
  const key = cacheKey(provider, workingDirectory);
  const cached = commandCache.get(key);
  if (cached) return cached;
  const commands = provider === "claude" ? discoverClaude(workingDirectory) : provider === "opencode" ? discoverOpenCode(workingDirectory) : discoverCodex(workingDirectory);
  const result = commands.map(({ template: _template, agent: _agent, model: _model, subtask: _subtask, ...command }) => command).sort((a, b) => a.name.localeCompare(b.name));
  commandCache.set(key, result);
  watchRoots(key, rootsFor(provider, workingDirectory));
  return result;
}
function buildOpenCodeDefinitions(workingDirectory) {
  return Object.fromEntries(discoverOpenCode(workingDirectory).map((command) => [command.name, {
    template: command.template,
    description: command.description,
    ...command.agent ? { agent: command.agent } : {},
    ...command.model ? { model: command.model } : {},
    ...command.subtask !== void 0 ? { subtask: command.subtask } : {}
  }]));
}
function getOpenCodeCommandDefinitions(workingDirectory) {
  const key = cacheKey("opencode", workingDirectory);
  const cached = definitionCache.get(key);
  if (cached) return cached;
  const definitions = buildOpenCodeDefinitions(workingDirectory);
  definitionCache.set(key, definitions);
  watchRoots(key, rootsFor("opencode", workingDirectory));
  return definitions;
}
const runtimeCommands = /* @__PURE__ */ new Map();
function commandCacheKey(adapter, workingDirectory) {
  return `${adapter}:${workingDirectory || ""}`;
}
function getCliCommands(adapter, workingDirectory) {
  const commands = /* @__PURE__ */ new Map();
  for (const command of discoverContentSlashCommands(adapter, workingDirectory)) {
    commands.set(command.name.toLocaleLowerCase(), command);
  }
  for (const command of runtimeCommands.get(commandCacheKey(adapter, workingDirectory)) ?? []) {
    const key = command.name.toLocaleLowerCase();
    if (!commands.has(key)) commands.set(key, command);
  }
  return { commands: [...commands.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}
function normalizeRuntimeCommands(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") {
      const name2 = item.replace(/^\//, "").trim();
      return name2 ? [{ name: name2, description: "Claude session command", provider: "claude", kind: "command", source: "session" }] : [];
    }
    if (!item || typeof item !== "object") return [];
    const record = item;
    const name = String(record.name ?? record.command ?? "").replace(/^\//, "").trim();
    if (!name) return [];
    return [{
      name,
      description: String(record.description ?? "Claude session command"),
      provider: "claude",
      kind: String(record.type ?? "").toLowerCase().includes("skill") ? "skill" : "command",
      source: "session"
    }];
  });
}
const CLAUDE_EFFORTS = ["low", "medium", "high", "xhigh", "max"];
let openCodeModelsCache = null;
let openCodeModelsCacheExpiry = 0;
let codexModelsCache = null;
let codexModelsCacheExpiry = 0;
let codexModelEffortsCache = {};
function writeSystemPromptFile(systemPrompt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "longdd-claude-"));
  const filePath = path.join(dir, "system-prompt.txt");
  fs.writeFileSync(filePath, systemPrompt, "utf-8");
  return filePath;
}
function getOpenCodeEfforts(model) {
  const normalized = model.toLocaleLowerCase();
  if (normalized.startsWith("anthropic/") || normalized.includes("claude")) return ["high", "max"];
  if (normalized.startsWith("google/") || normalized.includes("gemini")) return ["low", "high"];
  if (normalized.startsWith("openai/") || /(?:^|\/)(?:gpt|o[134])/.test(normalized)) {
    return ["none", "minimal", "low", "medium", "high", "xhigh"];
  }
  return ["low", "medium", "high"];
}
async function getCliModels(adapter) {
  if (adapter === "claude") {
    return { models: STATIC_CLAUDE_MODELS, source: "static", efforts: CLAUDE_EFFORTS };
  }
  if (adapter === "codex") {
    const now2 = Date.now();
    if (codexModelsCache && now2 < codexModelsCacheExpiry) {
      return {
        models: codexModelsCache,
        source: "cli",
        efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
        effortsByModel: codexModelEffortsCache
      };
    }
    return new Promise((resolve) => {
      let stdout = "";
      let settled = false;
      const resolvedCodex = resolveSpawnArgs(resolveCliCommand("codex"), ["debug", "models", "--bundled"]);
      const proc = node_child_process.spawn(resolvedCodex.command, resolvedCodex.args, {
        env: cliEnvironment(),
        shell: false,
        windowsHide: true
      });
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          proc.kill();
        } catch {
        }
        resolve({
          models: codexModelsCache ?? [],
          source: "cli",
          efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
          effortsByModel: codexModelEffortsCache
        });
      }, 2e4);
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.on("close", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const models = parseCodexModels(stdout);
        const effortsByModel = parseCodexModelEfforts(stdout);
        if (models.length > 0) {
          codexModelsCache = models;
          codexModelEffortsCache = effortsByModel;
          codexModelsCacheExpiry = Date.now() + 6e4;
        }
        resolve({
          models,
          source: "cli",
          efforts: [...new Set(Object.values(effortsByModel).flat())],
          effortsByModel
        });
      });
      proc.on("error", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve({
          models: codexModelsCache ?? [],
          source: "cli",
          efforts: [...new Set(Object.values(codexModelEffortsCache).flat())],
          effortsByModel: codexModelEffortsCache
        });
      });
    });
  }
  const now = Date.now();
  if (openCodeModelsCache && now < openCodeModelsCacheExpiry) {
    return {
      models: openCodeModelsCache,
      source: "cli",
      efforts: ["low", "medium", "high"],
      effortsByModel: Object.fromEntries(openCodeModelsCache.map((model) => [model, getOpenCodeEfforts(model)]))
    };
  }
  return new Promise((resolve) => {
    let stdout = "";
    let settled = false;
    const resolvedOC = resolveSpawnArgs(resolveCliCommand("opencode"), ["models"]);
    const proc = node_child_process.spawn(resolvedOC.command, resolvedOC.args, {
      env: cliEnvironment({ OPENCODE_DISABLE_PROJECT_CONFIG: "true" }),
      shell: false,
      windowsHide: true
    });
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        proc.kill();
      } catch {
      }
      const models = openCodeModelsCache ?? [];
      resolve({
        models,
        source: "cli",
        efforts: ["low", "medium", "high"],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)]))
      });
    }, 2e4);
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.on("close", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const models = parseOpenCodeModels(stdout);
      if (models.length > 0) {
        openCodeModelsCache = models;
        openCodeModelsCacheExpiry = Date.now() + 6e4;
      }
      resolve({
        models,
        source: "cli",
        efforts: ["low", "medium", "high"],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)]))
      });
    });
    proc.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const models = openCodeModelsCache ?? [];
      resolve({
        models,
        source: "cli",
        efforts: ["low", "medium", "high"],
        effortsByModel: Object.fromEntries(models.map((model) => [model, getOpenCodeEfforts(model)]))
      });
    });
  });
}
function isExpiredSessionError(errorText) {
  if (!errorText) return false;
  return /unknown session|session.*expired|invalid session|could not find session/i.test(errorText);
}
async function executeClaude(ctx) {
  const args = [
    "--output-format",
    "stream-json",
    "--verbose",
    "--print",
    "-",
    "--dangerously-skip-permissions"
  ];
  if (ctx.model) args.push("--model", ctx.model);
  if (ctx.effort) args.push("--effort", ctx.effort);
  if (ctx.sessionId) args.push("--resume", ctx.sessionId);
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection();
    args.push("--mcp-config", JSON.stringify({
      mcpServers: {
        logdd: {
          type: "http",
          url: mcp.url,
          headers: { Authorization: `Bearer ${mcp.token}` }
        }
      }
    }));
  }
  let promptFilePath = null;
  if (ctx.systemPrompt && !ctx.sessionId) {
    promptFilePath = writeSystemPromptFile(ctx.systemPrompt);
    args.push("--append-system-prompt-file", promptFilePath);
  }
  let resultSessionId;
  let outputText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  const stderrLines = [];
  try {
    const { exitCode, timedOut, canceled } = await spawnAndStream({
      command: resolveCliCommand("claude"),
      args,
      stdinText: ctx.prompt,
      cwd: ctx.workingDirectory,
      timeoutMs: ctx.timeoutMs,
      requestId: ctx.requestId,
      onStdoutLine: (line) => {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          return;
        }
        if (event.type === "system" && event.subtype === "init" && event.session_id) {
          resultSessionId = event.session_id;
          ctx.onSessionId?.(event.session_id);
        }
        if (event.type === "system" && event.subtype === "init") {
          const commands = normalizeRuntimeCommands(event.slash_commands ?? event.slashCommands);
          if (commands.length > 0) {
            runtimeCommands.set(commandCacheKey("claude", ctx.workingDirectory), commands);
            ctx.onCommands?.(getCliCommands("claude", ctx.workingDirectory).commands);
          }
        }
        if (event.type === "assistant" && Array.isArray(event.message?.content)) {
          for (const block of event.message.content) {
            if (block.type === "text" && block.text) {
              outputText += block.text;
              ctx.onChunk?.(block.text);
            }
          }
        }
        if (event.type === "result") {
          if (event.session_id) resultSessionId = event.session_id;
          inputTokens = (event.usage?.input_tokens ?? 0) + (event.usage?.cache_read_input_tokens ?? 0);
          outputTokens = event.usage?.output_tokens ?? 0;
          costUsd = event.total_cost_usd ?? 0;
        }
      },
      onStderrLine: (line) => {
        stderrLines.push(line);
      }
    });
    return {
      sessionId: resultSessionId,
      outputText,
      inputTokens: inputTokens || void 0,
      outputTokens: outputTokens || void 0,
      costUsd: costUsd || void 0,
      exitCode,
      timedOut,
      canceled,
      error: canceled ? "Cancelled by user" : exitCode !== 0 && !outputText ? stderrLines.join("\n").trim() || `claude exited with code ${exitCode}` : void 0
    };
  } finally {
    if (promptFilePath) {
      try {
        fs.unlinkSync(promptFilePath);
        fs.rmdirSync(path.dirname(promptFilePath));
      } catch {
      }
    }
  }
}
async function executeOpenCode(ctx) {
  const args = ["run", "--format", "json"];
  const model = normalizeOpenCodeModel(ctx.model);
  if (model) args.push("--model", model);
  if (ctx.effort) args.push("--variant", ctx.effort);
  if (ctx.sessionId) args.push("--session", ctx.sessionId);
  let resultSessionId;
  let outputText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  const stderrLines = [];
  const commandDefinitions = getOpenCodeCommandDefinitions(ctx.workingDirectory);
  const discoveredCommands = discoverContentSlashCommands("opencode", ctx.workingDirectory);
  const slashMatch = /^\/([^\s]+)(?:\s+([\s\S]*))?$/.exec(ctx.prompt.trim());
  const discoveredSlashCommand = slashMatch ? discoveredCommands.find((command) => command.name.toLocaleLowerCase() === slashMatch[1].toLocaleLowerCase()) : void 0;
  const commandName = discoveredSlashCommand?.name;
  if (commandName) args.push("--command", commandName);
  const commandArguments = commandName ? slashMatch?.[2] ?? "" : ctx.prompt;
  if (commandName && commandDefinitions[commandName] && ctx.systemPrompt) {
    commandDefinitions[commandName] = {
      ...commandDefinitions[commandName],
      template: `${ctx.systemPrompt}

---

${commandDefinitions[commandName].template}`
    };
  }
  const stdinText = !commandName && ctx.systemPrompt ? `${ctx.systemPrompt}

---

${commandArguments}` : commandArguments;
  const env2 = ctx.enableContentMcp ? {} : { OPENCODE_DISABLE_PROJECT_CONFIG: "true" };
  const inlineConfig = {};
  if (commandName && commandDefinitions[commandName]) inlineConfig.command = commandDefinitions;
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection();
    inlineConfig.mcp = {
      logdd: {
        type: "remote",
        url: mcp.url,
        enabled: true,
        headers: { Authorization: `Bearer ${mcp.token}` }
      }
    };
  }
  if (Object.keys(inlineConfig).length > 0) env2.OPENCODE_CONFIG_CONTENT = JSON.stringify(inlineConfig);
  const { exitCode, timedOut, canceled } = await spawnAndStream({
    command: resolveCliCommand("opencode"),
    args,
    stdinText,
    cwd: ctx.workingDirectory,
    timeoutMs: ctx.timeoutMs,
    requestId: ctx.requestId,
    env: env2,
    onStdoutLine: (line) => {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        return;
      }
      if (event.sessionID && !resultSessionId) {
        resultSessionId = event.sessionID;
        ctx.onSessionId?.(event.sessionID);
      }
      if (event.type === "text" && event.part?.text) {
        outputText += event.part.text;
        ctx.onChunk?.(event.part.text);
      }
      if (event.type === "step_finish" && event.part?.tokens) {
        inputTokens += (event.part.tokens.input ?? 0) + (event.part.tokens.cache?.read ?? 0);
        outputTokens += (event.part.tokens.output ?? 0) + (event.part.tokens.reasoning ?? 0);
        costUsd += event.part.cost ?? 0;
      }
    },
    onStderrLine: (line) => {
      stderrLines.push(line);
    }
  });
  return {
    sessionId: resultSessionId,
    outputText,
    inputTokens: inputTokens || void 0,
    outputTokens: outputTokens || void 0,
    costUsd: costUsd || void 0,
    exitCode,
    timedOut,
    canceled,
    error: canceled ? "Cancelled by user" : exitCode !== 0 && !outputText ? stderrLines.join("\n").trim() || `opencode exited with code ${exitCode}` : void 0
  };
}
async function executeCodex(ctx) {
  const args = ctx.sessionId ? ["exec", "resume", "--json", "--skip-git-repo-check"] : ["exec", "--json", "--sandbox", "workspace-write", "--skip-git-repo-check"];
  if (ctx.model) args.push("--model", ctx.model);
  if (ctx.effort) args.push("--config", `model_reasoning_effort=${JSON.stringify(ctx.effort)}`);
  const env2 = {};
  if (ctx.enableContentMcp) {
    const mcp = await getContentMcpConnection();
    const tokenEnvName = "LOGDD_CONTENT_MCP_TOKEN";
    env2[tokenEnvName] = mcp.token;
    args.push(
      "--config",
      `mcp_servers.logdd.url=${JSON.stringify(mcp.url)}`,
      "--config",
      `mcp_servers.logdd.bearer_token_env_var=${JSON.stringify(tokenEnvName)}`,
      "--config",
      "mcp_servers.logdd.required=true",
      "--config",
      'mcp_servers.logdd.default_tools_approval_mode="auto"'
    );
  }
  if (ctx.sessionId) args.push(ctx.sessionId);
  args.push("-");
  const discoveredCommands = discoverContentSlashCommands("codex", ctx.workingDirectory);
  const slashMatch = /^\/([^\s]+)(?:\s+([\s\S]*))?$/.exec(ctx.prompt.trim());
  const skill = slashMatch ? discoveredCommands.find((command) => command.kind === "skill" && command.name.toLocaleLowerCase() === slashMatch[1].toLocaleLowerCase()) : void 0;
  const prompt = skill ? `$${skill.name}${slashMatch?.[2] ? ` ${slashMatch[2]}` : ""}` : ctx.prompt;
  const stdinText = ctx.systemPrompt && !ctx.sessionId ? `${ctx.systemPrompt}

---

${prompt}` : prompt;
  let resultSessionId;
  let outputText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  const stderrLines = [];
  const { exitCode, timedOut, canceled } = await spawnAndStream({
    command: resolveCliCommand("codex"),
    args,
    direct: process.platform === "win32",
    stdinText,
    cwd: ctx.workingDirectory,
    env: env2,
    timeoutMs: ctx.timeoutMs,
    requestId: ctx.requestId,
    onStdoutLine: (line) => {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        return;
      }
      if (event.type === "thread.started" && event.thread_id) {
        resultSessionId = event.thread_id;
        ctx.onSessionId?.(event.thread_id);
      }
      if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
        outputText += event.item.text;
        ctx.onChunk?.(event.item.text);
      }
      if (event.type === "turn.completed" && event.usage) {
        inputTokens = (event.usage.input_tokens ?? 0) + (event.usage.cached_input_tokens ?? 0);
        outputTokens = event.usage.output_tokens ?? 0;
      }
      if ((event.type === "error" || event.type === "turn.failed") && event.message) {
        stderrLines.push(String(event.message));
      }
    },
    onStderrLine: (line) => {
      stderrLines.push(line);
    }
  });
  return {
    sessionId: resultSessionId,
    outputText,
    inputTokens: inputTokens || void 0,
    outputTokens: outputTokens || void 0,
    exitCode,
    timedOut,
    canceled,
    error: canceled ? "Cancelled by user" : exitCode !== 0 && !outputText ? stderrLines.join("\n").trim() || `codex exited with code ${exitCode}` : void 0
  };
}
async function executeAdapter(adapter, ctx) {
  if (adapter === "claude") {
    return executeClaude(ctx);
  }
  if (adapter === "opencode") {
    return executeOpenCode(ctx);
  }
  return executeCodex(ctx);
}
const sessions = /* @__PURE__ */ new Map();
async function getCliStatus() {
  const [claude, opencode, codex] = await Promise.all([
    detectCli("claude"),
    detectCli("opencode", ["--version"]),
    detectCli("codex", ["--version"])
  ]);
  return { claude, opencode, codex };
}
async function runCliTextTask(payload) {
  const timeoutMs = payload.timeoutMs ?? 12e4;
  const existingSession = payload.sessionKey ? sessions.get(payload.sessionKey) : void 0;
  const canResume = existingSession?.adapter === payload.adapter && existingSession.workingDirectory === payload.workingDirectory && existingSession.systemPrompt === payload.systemPrompt ? existingSession.sessionId : void 0;
  const execute = async (sessionId) => {
    return executeAdapter(payload.adapter, {
      prompt: payload.prompt,
      systemPrompt: payload.systemPrompt,
      model: payload.model,
      effort: payload.effort,
      sessionId,
      timeoutMs,
      workingDirectory: payload.workingDirectory,
      enableContentMcp: payload.enableContentMcp,
      requestId: payload.requestId,
      onChunk: payload.onChunk,
      onSessionId: payload.onSessionId,
      onCommands: payload.onCommands
    });
  };
  let result = await execute(canResume);
  if (canResume && result.error && isExpiredSessionError(result.error)) {
    if (payload.sessionKey) {
      sessions.delete(payload.sessionKey);
    }
    result = await execute(void 0);
  }
  if (payload.sessionKey) {
    if (result.error || result.canceled) {
      sessions.delete(payload.sessionKey);
    } else if (result.sessionId) {
      sessions.set(payload.sessionKey, {
        adapter: payload.adapter,
        sessionId: result.sessionId,
        workingDirectory: payload.workingDirectory,
        systemPrompt: payload.systemPrompt
      });
    }
  }
  return {
    success: !result.error && Boolean(result.outputText),
    outputText: result.outputText,
    sessionId: result.sessionId,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.costUsd,
    timedOut: result.timedOut,
    exitCode: result.exitCode,
    canceled: result.canceled,
    error: result.error
  };
}
const activeJobs$2 = /* @__PURE__ */ new Map();
function getFFmpegPath() {
  if (!ffmpegStaticPath) {
    throw new Error("ffmpeg-static did not provide a binary path for this platform");
  }
  const unpacked = ffmpegStaticPath.replace(/[\\/]app\.asar[\\/]/, path.sep + "app.asar.unpacked" + path.sep);
  if (fs.existsSync(unpacked)) return unpacked;
  if (fs.existsSync(ffmpegStaticPath)) return ffmpegStaticPath;
  throw new Error(`ffmpeg binary not found at ${unpacked} or ${ffmpegStaticPath}`);
}
function parseFFmpegTime(line) {
  const match = line.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseFloat(match[3]);
  return h * 3600 + m * 60 + s;
}
function runFFmpeg(opts) {
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath();
    let stderrBuf = "";
    let canceled = false;
    const child = spawnManagedProcess(`ffmpeg-${opts.jobId}`, `FFmpeg Job (${opts.jobId})`, ffmpegPath, opts.args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    activeJobs$2.set(opts.jobId, child);
    child.stdout?.setEncoding("utf-8");
    child.stderr?.setEncoding("utf-8");
    let stderrTail = "";
    child.stderr?.on("data", (chunk) => {
      stderrBuf += chunk;
      stderrTail += chunk;
      const lines = stderrTail.split(/[\r\n]/);
      stderrTail = lines.pop() ?? "";
      for (const line of lines) {
        if (!line) continue;
        opts.onLog?.(line);
        const timeSec = parseFFmpegTime(line);
        if (timeSec != null && opts.onProgress) {
          const percent = opts.totalDurationSec && opts.totalDurationSec > 0 ? Math.min(100, timeSec / opts.totalDurationSec * 100) : 0;
          opts.onProgress({ percent, timeSec, raw: line });
        }
      }
    });
    child.on("error", (err) => {
      activeJobs$2.delete(opts.jobId);
      resolve({
        success: false,
        exitCode: null,
        stderr: stderrBuf,
        canceled,
        error: err.message
      });
    });
    child.on("close", (code) => {
      activeJobs$2.delete(opts.jobId);
      resolve({
        success: code === 0 && !canceled,
        exitCode: code,
        stderr: stderrBuf,
        canceled,
        error: canceled ? "canceled" : code !== 0 ? `ffmpeg exited with code ${code}` : void 0
      });
    });
    const originalKill = child.kill.bind(child);
    child._markCanceled = () => {
      canceled = true;
      originalKill("SIGKILL");
    };
  });
}
function cancelFFmpeg(jobId) {
  terminateManagedProcess(`ffmpeg-${jobId}`);
  const child = activeJobs$2.get(jobId);
  if (!child) return false;
  if (child._markCanceled) child._markCanceled();
  else child.kill("SIGKILL");
  activeJobs$2.delete(jobId);
  return true;
}
function cancelAllFFmpeg() {
  for (const [jobId, child] of activeJobs$2.entries()) {
    terminateManagedProcess(`ffmpeg-${jobId}`);
    const c = child;
    if (c._markCanceled) c._markCanceled();
    else child.kill("SIGKILL");
    activeJobs$2.delete(jobId);
  }
}
async function probeMediaDuration(mediaPath) {
  return new Promise((resolve) => {
    const ffmpegPath = getFFmpegPath();
    let stderrBuf = "";
    const child = node_child_process.spawn(ffmpegPath, ["-i", mediaPath, "-f", "null", "-"], {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });
    child.stderr?.setEncoding("utf-8");
    child.stderr?.on("data", (chunk) => {
      stderrBuf += chunk;
    });
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const match = stderrBuf.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!match) return resolve(null);
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const s = parseFloat(match[3]);
      resolve(h * 3600 + m * 60 + s);
    });
  });
}
async function probeAudioDuration(audioPath) {
  return probeMediaDuration(audioPath);
}
async function probeMediaDimensions(mediaPath) {
  return new Promise((resolve) => {
    let ffmpegPath;
    try {
      ffmpegPath = getFFmpegPath();
    } catch {
      return resolve(null);
    }
    let stderrBuf = "";
    const child = node_child_process.spawn(ffmpegPath, ["-i", mediaPath, "-t", "0", "-f", "null", "-"], {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });
    child.stderr?.setEncoding("utf-8");
    child.stderr?.on("data", (chunk) => {
      stderrBuf += chunk;
    });
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const match = stderrBuf.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
      if (!match) return resolve(null);
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (!width || !height) return resolve(null);
      resolve({ width, height });
    });
  });
}
async function probeHasAudioStream(mediaPath) {
  return new Promise((resolve) => {
    let ffmpegPath;
    try {
      ffmpegPath = getFFmpegPath();
    } catch {
      return resolve(false);
    }
    let stderrBuf = "";
    const child = node_child_process.spawn(ffmpegPath, ["-i", mediaPath, "-t", "0", "-f", "null", "-"], {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });
    child.stderr?.setEncoding("utf-8");
    child.stderr?.on("data", (chunk) => {
      stderrBuf += chunk;
    });
    child.on("error", () => resolve(false));
    child.on("close", () => resolve(/Stream #\d+:\d+.*: Audio:/.test(stderrBuf)));
  });
}
const ffmpegRuntime = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  cancelAllFFmpeg,
  cancelFFmpeg,
  getFFmpegPath,
  probeAudioDuration,
  probeHasAudioStream,
  probeMediaDimensions,
  probeMediaDuration,
  runFFmpeg
}, Symbol.toStringTag, { value: "Module" }));
const PROVIDER_BASE_URL = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1"
};
const PROVIDER_DEFAULT_MODEL = {
  openai: "whisper-1",
  groq: "whisper-large-v3-turbo"
};
const PROVIDER_MAX_BYTES = 24 * 1024 * 1024;
const activeTranscribes = /* @__PURE__ */ new Map();
function cancelTranscribe(jobId) {
  const state = activeTranscribes.get(jobId);
  if (!state) return false;
  state.controller.abort();
  return true;
}
function cancelAllTranscribes() {
  for (const [, state] of activeTranscribes) {
    state.controller.abort();
  }
  activeTranscribes.clear();
}
async function transcribeAudio(req, emit) {
  if (!req.apiKey) return { success: false, error: "Missing API key" };
  if (!fs.existsSync(req.audioPath)) return { success: false, error: `Audio not found: ${req.audioPath}` };
  const baseUrl = PROVIDER_BASE_URL[req.provider];
  const model = req.model || PROVIDER_DEFAULT_MODEL[req.provider];
  if (!baseUrl) return { success: false, error: `Unknown provider: ${req.provider}` };
  const controller = new AbortController();
  const state = { controller, tempDir: null };
  activeTranscribes.set(req.jobId, state);
  try {
    emit({ jobId: req.jobId, type: "stage", stage: "probing", message: "Probing audio duration" });
    const totalDuration = await probeAudioDuration(req.audioPath);
    const audioStat = fs.statSync(req.audioPath);
    const needChunk = audioStat.size > PROVIDER_MAX_BYTES;
    let chunkPaths;
    if (!needChunk) {
      chunkPaths = [{ path: req.audioPath, offsetSec: 0 }];
    } else {
      emit({ jobId: req.jobId, type: "stage", stage: "chunking", message: "Splitting audio into chunks" });
      const tempDir = makeTempDir$1(req.jobId);
      state.tempDir = tempDir;
      const chunkSec = req.chunkDurationSec ?? 600;
      chunkPaths = await splitAudio({
        jobId: req.jobId,
        audioPath: req.audioPath,
        outDir: tempDir,
        chunkDurationSec: chunkSec,
        totalDurationSec: totalDuration ?? void 0
      });
    }
    emit({
      jobId: req.jobId,
      type: "stage",
      stage: "uploading",
      message: `Transcribing ${chunkPaths.length} chunk(s)`,
      chunkTotal: chunkPaths.length
    });
    const srtParts = [];
    let cumulativeIndex = 0;
    for (let i = 0; i < chunkPaths.length; i += 1) {
      if (controller.signal.aborted) {
        return { success: false, canceled: true, error: "canceled" };
      }
      const chunk = chunkPaths[i];
      emit({
        jobId: req.jobId,
        type: "chunk-start",
        chunkIndex: i,
        chunkTotal: chunkPaths.length,
        percent: Math.round(i / chunkPaths.length * 100)
      });
      const result = await uploadChunk({
        baseUrl,
        apiKey: req.apiKey,
        model,
        language: req.language,
        prompt: req.prompt,
        chunkPath: chunk.path,
        signal: controller.signal
      });
      if (!result.ok) {
        return {
          success: false,
          error: result.error,
          status: result.status
        };
      }
      const { adjusted, lastIndex } = offsetSrt(result.srt, chunk.offsetSec, cumulativeIndex);
      cumulativeIndex = lastIndex;
      srtParts.push(adjusted);
      emit({
        jobId: req.jobId,
        type: "chunk-done",
        chunkIndex: i,
        chunkTotal: chunkPaths.length,
        percent: Math.round((i + 1) / chunkPaths.length * 100)
      });
    }
    emit({ jobId: req.jobId, type: "stage", stage: "merging", message: "Merging chunks" });
    const finalSrt = srtParts.join("\n\n").trim() + "\n";
    emit({ jobId: req.jobId, type: "stage", stage: "done", percent: 100 });
    return {
      success: true,
      srt: finalSrt,
      durationSec: totalDuration ?? void 0,
      chunks: chunkPaths.length
    };
  } catch (err) {
    if (controller.signal.aborted) {
      return { success: false, canceled: true, error: "canceled" };
    }
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    activeTranscribes.delete(req.jobId);
    if (state.tempDir) {
      cleanupTempDir$2(state.tempDir);
    }
  }
}
function makeTempDir$1(jobId) {
  const slug2 = jobId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "job";
  const dir = path.join(os.tmpdir(), `whisper-${slug2}-${crypto.randomBytes(4).toString("hex")}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cleanupTempDir$2(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
  }
}
async function splitAudio(opts) {
  const ext = ".mp3";
  const total = opts.totalDurationSec ?? 0;
  const count = total > 0 ? Math.ceil(total / opts.chunkDurationSec) : 0;
  const pattern = path.join(opts.outDir, `chunk_%03d${ext}`);
  const args = [
    "-y",
    "-i",
    opts.audioPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "64k",
    "-f",
    "segment",
    "-segment_time",
    String(opts.chunkDurationSec),
    "-reset_timestamps",
    "1",
    pattern
  ];
  const result = await runFFmpeg({
    jobId: `${opts.jobId}-split`,
    args,
    totalDurationSec: opts.totalDurationSec
  });
  if (!result.success) {
    throw new Error(`Audio chunking failed: ${result.error || "unknown ffmpeg error"}`);
  }
  const entries = fs.readdirSync(opts.outDir).filter((f) => f.startsWith("chunk_") && f.endsWith(ext)).sort();
  const parts = [];
  for (let i = 0; i < entries.length; i += 1) {
    parts.push({
      path: path.join(opts.outDir, entries[i]),
      offsetSec: i * opts.chunkDurationSec
    });
  }
  if (parts.length === 0) {
    throw new Error(`Chunking produced no output (count=${count})`);
  }
  return parts;
}
async function uploadChunk(opts) {
  const fileBuffer = await fs.promises.readFile(opts.chunkPath);
  const fileBlob = new Blob([fileBuffer], { type: guessMimeType(opts.chunkPath) });
  const form = new FormData();
  form.append("file", fileBlob, path.basename(opts.chunkPath));
  form.append("model", opts.model);
  form.append("response_format", "srt");
  if (opts.language) form.append("language", opts.language);
  if (opts.prompt) form.append("prompt", opts.prompt);
  let res;
  try {
    res = await fetch(`${opts.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      body: form,
      signal: opts.signal
    });
  } catch (err) {
    return {
      ok: false,
      srt: "",
      error: err instanceof Error ? err.message : String(err)
    };
  }
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
    }
    return {
      ok: false,
      srt: "",
      status: res.status,
      error: extractErrorMessage(bodyText) || `${res.status} ${res.statusText}`
    };
  }
  const srt = await res.text();
  return { ok: true, srt };
}
function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".m4a":
      return "audio/mp4";
    case ".flac":
      return "audio/flac";
    case ".ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
}
function extractErrorMessage(body) {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.error === "string") return parsed.error;
    if (typeof parsed.error === "object" && parsed.error && typeof parsed.error.message === "string") {
      return parsed.error.message;
    }
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
  }
  return body.slice(0, 500);
}
const SRT_TIME_RE = /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/;
function offsetSrt(srt, offsetSec, startIndex) {
  const blocks = srt.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  let nextIndex = startIndex;
  const offsetMs = Math.round(offsetSec * 1e3);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;
    const timeIdx = lines.findIndex((l) => SRT_TIME_RE.test(l));
    if (timeIdx < 0) continue;
    const timeLine = lines[timeIdx].replace(SRT_TIME_RE, (...m) => {
      const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = m;
      const startMs = toMs(h1, m1, s1, ms1) + offsetMs;
      const endMs = toMs(h2, m2, s2, ms2) + offsetMs;
      return `${fromMs(startMs)} --> ${fromMs(endMs)}`;
    });
    nextIndex += 1;
    const textLines = lines.slice(timeIdx + 1).join("\n");
    out.push(`${nextIndex}
${timeLine}
${textLines}`);
  }
  return { adjusted: out.join("\n\n"), lastIndex: nextIndex };
}
function toMs(h, m, s, ms) {
  return (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * 1e3 + parseInt(ms, 10);
}
function fromMs(totalMs) {
  const ms = Math.max(0, Math.round(totalMs));
  const h = Math.floor(ms / 36e5);
  const rem1 = ms - h * 36e5;
  const mi = Math.floor(rem1 / 6e4);
  const rem2 = rem1 - mi * 6e4;
  const s = Math.floor(rem2 / 1e3);
  const milli = rem2 - s * 1e3;
  const pad = (n, w = 2) => n.toString().padStart(w, "0");
  return `${pad(h)}:${pad(mi)}:${pad(s)},${pad(milli, 3)}`;
}
function imageExtFromMime(mimeType) {
  const normalized = mimeType.toLowerCase().split(";")[0].trim();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return ".jpg";
  if (normalized.includes("webp")) return ".webp";
  if (normalized.includes("gif")) return ".gif";
  if (normalized.includes("bmp")) return ".bmp";
  if (normalized.includes("svg")) return ".svg";
  return ".png";
}
async function resolveMediaSrc(src, mediaRoot, candidateDirs, options) {
  const cleaned = src.trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("data:")) {
    if (!options.allowDataUrl || !options.tempDir || !options.tempName) return "";
    const match = cleaned.match(/^data:([^;,]+)?(?:;[^,]*)?;base64,(.+)$/s);
    if (!match) return "";
    const mimeType = match[1] || "image/png";
    const ext = imageExtFromMime(mimeType);
    const filePath = path.join(options.tempDir, `${options.tempName}${ext}`);
    fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
    return fs.existsSync(filePath) ? filePath : "";
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    if (!options.allowRemote || !options.tempDir || !options.tempName) return "";
    try {
      const response = await fetch(cleaned, { headers: { Accept: options.remoteAccept || "*/*" } });
      if (!response.ok) return "";
      const mimeType = response.headers.get("content-type") || "image/png";
      const ext = imageExtFromMime(mimeType);
      const filePath = path.join(options.tempDir, `${options.tempName}${ext}`);
      fs.writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
      return fs.existsSync(filePath) ? filePath : "";
    } catch {
      return "";
    }
  }
  if (cleaned.startsWith("local-image://") || cleaned.startsWith("local-video://")) {
    const match = cleaned.match(/^local-(?:image|video):\/\/([^/]+)\/(.+)$/);
    if (!match) return "";
    const [, category, filename] = match;
    const filePath = path.join(mediaRoot, decodeURIComponent(category), decodeURIComponent(filename));
    return fs.existsSync(filePath) ? filePath : "";
  }
  if (cleaned.startsWith("file://")) {
    try {
      const filePath = node_url.fileURLToPath(cleaned);
      return fs.existsSync(filePath) ? filePath : "";
    } catch {
      const decoded = decodeURIComponent(cleaned.replace(/^file:\/\/\/?/, ""));
      return fs.existsSync(decoded) ? decoded : "";
    }
  }
  if (path.isAbsolute(cleaned)) {
    return fs.existsSync(cleaned) ? cleaned : "";
  }
  for (const dir of candidateDirs) {
    const filePath = path.resolve(dir, cleaned);
    if (fs.existsSync(filePath)) return filePath;
  }
  return "";
}
async function resolveImageSrc(src, mediaRoot, candidateDirs, tempDir, index) {
  return resolveMediaSrc(src, mediaRoot, candidateDirs, {
    tempDir,
    tempName: `img_${index.toString().padStart(4, "0")}`,
    allowDataUrl: true,
    allowRemote: true,
    remoteAccept: "image/*,*/*;q=0.8"
  });
}
async function resolveVideoSrc(src, mediaRoot, candidateDirs) {
  return resolveMediaSrc(src, mediaRoot, candidateDirs, {
    allowDataUrl: false,
    allowRemote: false
  });
}
function resolveAudioPath(src, candidateDirs) {
  const cleaned = src.trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("file://")) {
    try {
      const filePath = node_url.fileURLToPath(cleaned);
      return fs.existsSync(filePath) ? filePath : "";
    } catch {
      const decoded = decodeURIComponent(cleaned.replace(/^file:\/\/\/?/, ""));
      return fs.existsSync(decoded) ? decoded : "";
    }
  }
  if (path.isAbsolute(cleaned)) return fs.existsSync(cleaned) ? cleaned : "";
  for (const dir of candidateDirs) {
    const filePath = path.resolve(dir, cleaned);
    if (fs.existsSync(filePath)) return filePath;
  }
  return "";
}
function makeTempDir(jobId) {
  const slug2 = jobId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "job";
  const dir = path.join(os.tmpdir(), `autovideo-${slug2}-${crypto.randomBytes(4).toString("hex")}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cleanupTempDir$1(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
  }
}
function buildFrameTimeline(segments, fps, audioDurationSec) {
  const frameFromMs = (ms) => Math.max(0, Math.round(ms / 1e3 * fps));
  const startFrames = segments.map((segment) => frameFromMs(segment.startMs));
  if (startFrames.length === 0) return [];
  startFrames[0] = 0;
  for (let i = 1; i < startFrames.length; i += 1) {
    startFrames[i] = Math.max(startFrames[i], startFrames[i - 1] + 1);
  }
  const lastSegment = segments[segments.length - 1];
  const lastCaptionEndFrame = frameFromMs(Math.max(lastSegment.endMs, lastSegment.startMs));
  const audioEndFrame = audioDurationSec && Number.isFinite(audioDurationSec) ? Math.max(0, Math.round(audioDurationSec * fps)) : 0;
  const finalEndFrame = Math.max(lastCaptionEndFrame, audioEndFrame, startFrames[startFrames.length - 1] + 1);
  return segments.map((_segment, index) => {
    const startFrame = startFrames[index];
    const nextStartFrame = startFrames[index + 1] ?? startFrame + 1;
    const endFrame = index < segments.length - 1 ? Math.max(startFrame + 1, nextStartFrame) : Math.max(startFrame + 1, finalEndFrame);
    const durationFrames = Math.max(1, endFrame - startFrame);
    return {
      startFrame,
      endFrame,
      durationFrames,
      durationSec: durationFrames / fps
    };
  });
}
function getXfadeProfile(transition) {
  switch (transition) {
    case "fade":
      return { ffmpegName: "fade", durationSec: 0.35 };
    case "fade_slow":
      return { ffmpegName: "fadeslow", durationSec: 0.65 };
    case "dip_white":
      return { ffmpegName: "fadewhite", durationSec: 0.35 };
    case "flash_white":
      return { ffmpegName: "fadewhite", durationSec: 0.14 };
    case "dissolve":
      return { ffmpegName: "dissolve", durationSec: 0.45 };
    case "fade_black":
      return { ffmpegName: "fadeblack", durationSec: 0.45 };
    case "fade_white":
      return { ffmpegName: "fadewhite", durationSec: 0.4 };
    case "wipe_left":
      return { ffmpegName: "wipeleft", durationSec: 0.4 };
    case "wipe_right":
      return { ffmpegName: "wiperight", durationSec: 0.4 };
    case "wipe_up":
      return { ffmpegName: "wipeup", durationSec: 0.4 };
    case "wipe_down":
      return { ffmpegName: "wipedown", durationSec: 0.4 };
    case "slide_left":
      return { ffmpegName: "slideleft", durationSec: 0.45 };
    case "slide_right":
      return { ffmpegName: "slideright", durationSec: 0.45 };
    case "smooth_left":
      return { ffmpegName: "smoothleft", durationSec: 0.5 };
    case "smooth_right":
      return { ffmpegName: "smoothright", durationSec: 0.5 };
    case "circle_open":
      return { ffmpegName: "circleopen", durationSec: 0.45 };
    case "circle_close":
      return { ffmpegName: "circleclose", durationSec: 0.45 };
    case "pixelize":
      return { ffmpegName: "pixelize", durationSec: 0.35 };
    case "zoom_in":
      return { ffmpegName: "zoomin", durationSec: 0.45 };
    case "none":
      return { ffmpegName: "fade", durationSec: 0 };
  }
}
function buildXfadeTimeline(segments, frames, fps) {
  return segments.map((segment, index) => {
    const transition = index < segments.length - 1 ? segment.transitionToNext ?? "none" : "none";
    const profile = getXfadeProfile(transition);
    if (transition === "none" || !frames[index] || !frames[index + 1]) {
      return {
        transition: "none",
        ffmpegName: "fade",
        durationFrames: 0,
        durationSec: 0,
        inputDurationSec: frames[index]?.durationSec ?? 0
      };
    }
    const requestedDurationSec = segment.transitionDurationMs == null ? profile.durationSec : Math.max(0.1, Math.min(2, segment.transitionDurationMs / 1e3));
    const requestedFrames = Math.max(1, Math.round(requestedDurationSec * fps));
    const maxFrames = Math.max(1, Math.min(
      Math.floor(frames[index].durationFrames * 0.45),
      Math.floor(frames[index + 1].durationFrames * 0.45)
    ));
    const durationFrames = Math.min(requestedFrames, maxFrames);
    const durationSec = durationFrames / fps;
    return {
      transition,
      ffmpegName: profile.ffmpegName,
      durationFrames,
      durationSec,
      inputDurationSec: frames[index].durationSec + durationSec
    };
  });
}
function crfArgs(codec, crf) {
  if (codec === "h264_nvenc") return ["-cq", String(crf), "-preset", "p4"];
  return ["-crf", String(crf), "-preset", "medium"];
}
const NO_MOTION = { supersample: 1, pixelFormat: "yuv420p", filter: "" };
const MOTION_SPECS = {
  zoom_in: { zoomStart: 1, zoomEnd: 1.12, axis: null, forward: true },
  zoom_out: { zoomStart: 1.12, zoomEnd: 1, axis: null, forward: true },
  pan_left: { zoomStart: 1.12, zoomEnd: 1.12, axis: "x", forward: false },
  pan_right: { zoomStart: 1.12, zoomEnd: 1.12, axis: "x", forward: true },
  pan_up: { zoomStart: 1.12, zoomEnd: 1.12, axis: "y", forward: false },
  pan_down: { zoomStart: 1.12, zoomEnd: 1.12, axis: "y", forward: true },
  zoom_pan_left: { zoomStart: 1.08, zoomEnd: 1.14, axis: "x", forward: false },
  zoom_pan_right: { zoomStart: 1.08, zoomEnd: 1.14, axis: "x", forward: true }
};
const MIN_SUPERSAMPLE = 2;
const MAX_SUPERSAMPLE = 3;
const TARGET_STEP_PX = 2;
const MIN_CROP_PX = 16;
const clampInt = (value, lo, hi) => Math.max(lo, Math.min(hi, Math.round(value)));
const halfStep = (step) => step < 0 ? -Math.round(-step / 2) : Math.round(step / 2);
const rampExpr = (base, step, t) => {
  if (step === 0) return String(base);
  const ramp = `${Math.abs(step)}*${t}`;
  if (base === 0) return step < 0 ? `-${ramp}` : ramp;
  return `${base}${step < 0 ? "-" : "+"}${ramp}`;
};
function buildMotionPlan(effect, width, height, fps, durationFrames, effectStartMs = 0, effectEndMs = Number.POSITIVE_INFINITY, options = {}) {
  const spec = effect === "none" ? void 0 : MOTION_SPECS[effect];
  if (!spec || durationFrames <= 1) return NO_MOTION;
  const last = durationFrames - 1;
  const startFrame = clampInt(effectStartMs / 1e3 * fps, 0, last - 1);
  const endFrame = clampInt(effectEndMs / 1e3 * fps, startFrame + 1, last);
  const span = endFrame - startFrame;
  const zoomTravel = Math.abs(width / spec.zoomStart - width / spec.zoomEnd);
  const panAxisLen = spec.axis === "y" ? height : width;
  const panZoom = spec.forward ? spec.zoomEnd : spec.zoomStart;
  const panTravel = spec.axis ? panAxisLen * (1 - 1 / panZoom) : 0;
  const zoomNeed = zoomTravel > 0 ? (spec.axis === null ? 2 : 1) * span / zoomTravel : 0;
  const panNeed = panTravel > 0 ? TARGET_STEP_PX * span / panTravel : 0;
  const supersample = clampInt(Math.ceil(Math.max(zoomNeed, panNeed)), MIN_SUPERSAMPLE, MAX_SUPERSAMPLE);
  const iw = width * supersample;
  const ih = height * supersample;
  const w0 = spec.axis === null ? Math.round(iw / spec.zoomStart) & -2 : Math.round(iw / spec.zoomStart);
  const idealStepW = (w0 - Math.round(iw / spec.zoomEnd)) / span;
  let stepW = spec.axis === null ? 2 * Math.round(idealStepW / 2) : Math.round(idealStepW);
  if (stepW === 0 && idealStepW !== 0) stepW = (idealStepW > 0 ? 1 : -1) * (spec.axis === null ? 2 : 1);
  if (stepW > 0) stepW = Math.min(stepW, Math.max(0, Math.floor((w0 - MIN_CROP_PX) / span)));
  if (stepW < 0) stepW = -Math.min(-stepW, Math.max(0, Math.floor((iw - w0) / span)));
  if (spec.axis === null) stepW -= stepW % 2;
  const widthAt = (n) => w0 - stepW * n;
  const heightAt = (n) => Math.floor(ih * (widthAt(n) + 0.5) / iw);
  const sizeAt = (axis, n) => axis === "y" ? heightAt(n) : widthAt(n);
  const lenOf = (axis) => axis === "y" ? ih : iw;
  const fitStep = (axis, posAt, desired) => {
    const dir = desired < 0 ? -1 : 1;
    let step = Math.abs(desired);
    while (step > 0) {
      const inside = [0, span].every((n) => {
        const pos = posAt(dir * step, n);
        return pos >= 0 && pos + sizeAt(axis, n) <= lenOf(axis);
      });
      if (inside) break;
      step -= 1;
    }
    return dir * step;
  };
  const t = startFrame > 0 ? `min(${span},max(0,on-${startFrame}))` : `min(${span},on)`;
  const panExpr = (axis) => {
    const room = lenOf(axis) - Math.min(sizeAt(axis, 0), sizeAt(axis, span));
    const posAt = (step2, n) => spec.forward ? step2 * n : step2 * (span - n);
    const step = fitStep(axis, posAt, Math.max(1, Math.floor(room / span)));
    return spec.forward ? rampExpr(0, step, t) : rampExpr(step * span, -step, t);
  };
  const centreExpr = (axis) => {
    const pos0 = Math.round((lenOf(axis) - sizeAt(axis, 0)) / 2);
    const sizeStep = axis === "y" ? stepW * height / width : stepW;
    const step = fitStep(axis, (s, n) => pos0 + s * n, halfStep(sizeStep));
    return rampExpr(pos0, step, t);
  };
  const zExpr = `${iw}/(${rampExpr(w0, -stepW, t)}+0.5)`;
  const xExpr = spec.axis === "x" ? panExpr("x") : centreExpr("x");
  const yExpr = spec.axis === "y" ? panExpr("y") : centreExpr("y");
  const pixelFormat = options.alpha ? "gbrap" : "yuv444p";
  return {
    supersample,
    pixelFormat,
    filter: `,format=${pixelFormat},zoompan=z='${zExpr}':d=1:x='${xExpr}':y='${yExpr}':s=${width}x${height}:fps=${fps}`
  };
}
function buildSegmentArgs(input) {
  const { mediaType, imagePath, videoPath, sourceStartSec, overlayImagePath, overlayPlacement, sourceDurationSec, durationSec, durationFrames, width, height, fps, codec, crf, mediaEffect, effectStartMs, effectEndMs, outputPath, keepVideoAudio } = input;
  const motion = buildMotionPlan(mediaEffect, width, height, fps, durationFrames, effectStartMs, effectEndMs);
  const scaleW = width * motion.supersample;
  const scaleH = height * motion.supersample;
  const baseScale = `scale=${scaleW}:${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:color=black`;
  const vf = `${baseScale}${motion.filter},fps=${fps},format=yuv420p,setsar=1`;
  const hasOverlay = !!overlayImagePath && fs.existsSync(overlayImagePath);
  const buildOverlayFilter = (basePrefix = "") => {
    const centered = overlayPlacement === "center";
    const insertWidth = Math.max(240, Math.round(width * (centered ? 0.48 : 0.36)));
    const insertHeight = Math.max(160, Math.round(height * (centered ? 0.54 : 0.4)));
    const border = Math.max(6, Math.round(width * 4e-3));
    const framedWidth = insertWidth + border * 2;
    const framedHeight = insertHeight + border * 2;
    const marginX = Math.round(width * 0.045);
    const marginY = Math.round(height * 0.06);
    const positions = {
      top_left: [String(marginX), String(marginY)],
      top_right: [`W-w-${marginX}`, String(marginY)],
      bottom_left: [String(marginX), `H-h-${marginY}`],
      bottom_right: [`W-w-${marginX}`, `H-h-${marginY}`],
      center: ["(W-w)/2", "(H-h)/2"]
    };
    const [x, y] = positions[overlayPlacement];
    const fadeOutStart = Math.max(0.25, durationSec - 0.3).toFixed(3);
    return [
      `[0:v]${basePrefix}${vf}[base]`,
      `[1:v]scale=${insertWidth}:${insertHeight}:force_original_aspect_ratio=increase,crop=${insertWidth}:${insertHeight},setsar=1,pad=${framedWidth}:${framedHeight}:${border}:${border}:color=white,format=rgba,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st=${fadeOutStart}:d=0.25:alpha=1[insert]`,
      `[base][insert]overlay=x='${x}':y='${y}':format=auto,format=yuv420p[vout]`
    ].join(";");
  };
  if (mediaType === "video" && videoPath && fs.existsSync(videoPath)) {
    const shouldSlowVideo = !!sourceDurationSec && sourceDurationSec > 0 && sourceDurationSec < durationSec;
    const videoPrefix = shouldSlowVideo ? `setpts=${(durationSec / sourceDurationSec).toFixed(6)}*PTS,trim=duration=${durationSec.toFixed(3)},${vf}` : vf;
    if (hasOverlay) {
      const basePrefix = shouldSlowVideo ? `setpts=${(durationSec / sourceDurationSec).toFixed(6)}*PTS,trim=duration=${durationSec.toFixed(3)},` : `trim=duration=${durationSec.toFixed(3)},setpts=PTS-STARTPTS,`;
      return [
        "-y",
        ...sourceStartSec > 0 ? ["-ss", sourceStartSec.toFixed(3)] : [],
        "-i",
        videoPath,
        "-loop",
        "1",
        "-framerate",
        String(fps),
        "-i",
        overlayImagePath,
        "-filter_complex",
        buildOverlayFilter(basePrefix),
        "-map",
        "[vout]",
        "-r",
        String(fps),
        "-frames:v",
        String(durationFrames),
        "-c:v",
        codec,
        ...crfArgs(codec, crf),
        "-pix_fmt",
        "yuv420p",
        ...keepVideoAudio ? [] : ["-an"],
        outputPath
      ];
    }
    return [
      "-y",
      ...sourceStartSec > 0 ? ["-ss", sourceStartSec.toFixed(3)] : [],
      "-i",
      videoPath,
      ...shouldSlowVideo ? [] : ["-t", String(durationSec.toFixed(3))],
      "-vf",
      videoPrefix,
      "-r",
      String(fps),
      "-frames:v",
      String(durationFrames),
      "-c:v",
      codec,
      ...crfArgs(codec, crf),
      "-pix_fmt",
      "yuv420p",
      ...keepVideoAudio ? [] : ["-an"],
      outputPath
    ];
  }
  if (imagePath && fs.existsSync(imagePath)) {
    if (hasOverlay) {
      return [
        "-y",
        "-loop",
        "1",
        "-framerate",
        String(fps),
        "-i",
        imagePath,
        "-loop",
        "1",
        "-framerate",
        String(fps),
        "-i",
        overlayImagePath,
        "-filter_complex",
        buildOverlayFilter("setpts=PTS-STARTPTS,"),
        "-map",
        "[vout]",
        "-r",
        String(fps),
        "-frames:v",
        String(durationFrames),
        "-c:v",
        codec,
        ...crfArgs(codec, crf),
        "-pix_fmt",
        "yuv420p",
        "-an",
        outputPath
      ];
    }
    return [
      "-y",
      "-loop",
      "1",
      "-framerate",
      String(fps),
      "-i",
      imagePath,
      "-t",
      String(durationSec.toFixed(3)),
      "-vf",
      vf,
      "-r",
      String(fps),
      "-frames:v",
      String(durationFrames),
      "-c:v",
      codec,
      ...crfArgs(codec, crf),
      "-pix_fmt",
      "yuv420p",
      "-an",
      outputPath
    ];
  }
  return [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=black:s=${width}x${height}:r=${fps}:d=${durationSec.toFixed(3)}`,
    "-frames:v",
    String(durationFrames),
    "-c:v",
    codec,
    ...crfArgs(codec, crf),
    "-pix_fmt",
    "yuv420p",
    "-an",
    outputPath
  ];
}
function escapeFilterPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/,/g, "\\,").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}
function buildSubtitleFilter(assPath) {
  const fontsDir = process.env.WINDIR ? path.join(process.env.WINDIR, "Fonts") : "";
  const filter = `subtitles='${escapeFilterPath(assPath)}'`;
  if (fontsDir && fs.existsSync(fontsDir)) {
    return `${filter}:fontsdir='${escapeFilterPath(fontsDir)}'`;
  }
  return filter;
}
function writeAssSubtitleFile(segments, width, height, fontSizeOverride, tempDir) {
  const captions = segments.filter((s) => s.text && s.text.trim());
  if (captions.length === 0) return null;
  const fontSize = Math.max(16, Math.round(fontSizeOverride && fontSizeOverride > 0 ? fontSizeOverride : height * 0.05));
  const marginV = Math.max(24, Math.round(height * 0.06));
  const pad2 = (n) => n.toString().padStart(2, "0");
  const formatAssTime = (ms) => {
    let cs = Math.max(0, Math.round(ms / 10));
    const h = Math.floor(cs / 36e4);
    cs -= h * 36e4;
    const m = Math.floor(cs / 6e3);
    cs -= m * 6e3;
    const s = Math.floor(cs / 100);
    cs -= s * 100;
    return `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
  };
  const sanitizeAssText = (text) => text.replace(/\{[^}]*\}/g, "").replace(/<[^>]*>/g, "").replace(/\r?\n/g, "\\N").replace(/\s+/g, " ").trim();
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,2,1,2,48,48,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];
  const dialogue = captions.map((seg) => {
    const text = sanitizeAssText(seg.text);
    if (!text) return null;
    return `Dialogue: 0,${formatAssTime(seg.startMs)},${formatAssTime(Math.max(seg.endMs, seg.startMs + 200))},Default,,0,0,0,,${text}`;
  }).filter((line) => line !== null);
  if (dialogue.length === 0) return null;
  const filePath = path.join(tempDir, "captions.ass");
  fs.writeFileSync(filePath, [...header, ...dialogue, ""].join("\n"), "utf-8");
  return filePath;
}
const MAX_XFADE_INPUTS = 60;
function buildAudioMixArgs(sfxStartMs) {
  if (sfxStartMs.length === 0) return ["-c:a", "aac"];
  const delayed = sfxStartMs.map((startMs, idx) => {
    const inputIndex = idx + 2;
    const delayMs = Math.max(0, Math.round(startMs));
    return `[${inputIndex}:a]adelay=${delayMs}:all=1[sfx${idx}]`;
  });
  const inputs = ["[1:a]", ...sfxStartMs.map((_, idx) => `[sfx${idx}]`)].join("");
  return [
    "-filter_complex",
    `${delayed.join(";")};${inputs}amix=inputs=${sfxStartMs.length + 1}:duration=first:dropout_transition=0:normalize=0[aout]`,
    "-map",
    "0:v",
    "-map",
    "[aout]",
    "-c:a",
    "aac"
  ];
}
function buildXfadeVideoChain(count, plan) {
  const parts = [];
  for (let index = 0; index < count; index += 1) {
    parts.push(`[${index}:v]settb=AVTB,setpts=PTS-STARTPTS[v${index}]`);
  }
  let currentLabel = "v0";
  let composedDurationSec = plan[0]?.inputDurationSec ?? 0;
  for (let index = 1; index < count; index += 1) {
    const cut = plan[index - 1];
    const outputLabel = `vx${index}`;
    if (cut?.durationSec > 0) {
      const offset = Math.max(0, composedDurationSec - cut.durationSec);
      parts.push(
        `[${currentLabel}][v${index}]xfade=transition=${cut.ffmpegName}:duration=${cut.durationSec.toFixed(6)}:offset=${offset.toFixed(6)}[${outputLabel}]`
      );
      composedDurationSec += (plan[index]?.inputDurationSec ?? 0) - cut.durationSec;
    } else {
      parts.push(`[${currentLabel}][v${index}]concat=n=2:v=1:a=0[${outputLabel}]`);
      composedDurationSec += plan[index]?.inputDurationSec ?? 0;
    }
    currentLabel = outputLabel;
  }
  return { parts, finalLabel: currentLabel, composedDurationSec };
}
function buildChunkXfadeArgs(input) {
  const { files, plan, codec, crf, outputPath, tempDir, chunkId } = input;
  const args = ["-y"];
  for (const file of files) args.push("-i", file);
  const { parts, finalLabel, composedDurationSec } = buildXfadeVideoChain(files.length, plan);
  parts.push(`[${finalLabel}]format=yuv420p[vout]`);
  const filterScriptPath = path.join(tempDir, `xfade-chunk-${chunkId}.txt`);
  fs.writeFileSync(filterScriptPath, parts.join(";"), "utf-8");
  args.push(
    "-filter_complex_script",
    filterScriptPath,
    "-map",
    "[vout]",
    "-an",
    "-c:v",
    codec,
    ...crfArgs(codec, crf),
    outputPath
  );
  return { args, composedDurationSec };
}
async function collapseXfadeSegments(input) {
  const { segmentFiles, transitionPlan, codec, crf, tempDir, jobIdBase, runChunk, onLevel } = input;
  let files = segmentFiles;
  let plan = transitionPlan;
  let level = 0;
  while (files.length > MAX_XFADE_INPUTS) {
    const chunkTotal = Math.ceil(files.length / MAX_XFADE_INPUTS);
    onLevel?.(level, chunkTotal);
    const nextFiles = [];
    const nextPlan = [];
    for (let c = 0; c < chunkTotal; c += 1) {
      const start = c * MAX_XFADE_INPUTS;
      const end = Math.min(start + MAX_XFADE_INPUTS, files.length);
      const chunkFiles = files.slice(start, end);
      const chunkPlan = plan.slice(start, end);
      const boundaryItem = plan[end - 1];
      if (chunkFiles.length === 1) {
        nextFiles.push(chunkFiles[0]);
        nextPlan.push(boundaryItem);
        continue;
      }
      const chunkOut = path.join(tempDir, `xfade_l${level}_c${c.toString().padStart(4, "0")}.mp4`);
      const { args, composedDurationSec } = buildChunkXfadeArgs({
        files: chunkFiles,
        plan: chunkPlan,
        codec,
        crf,
        outputPath: chunkOut,
        tempDir,
        chunkId: `l${level}_c${c}`
      });
      const res = await runChunk(args, `${jobIdBase}-xl${level}-c${c}`);
      if (res.canceled) return { success: false, files, plan, canceled: true };
      if (!res.success) return { success: false, files, plan, error: `batch l${level} c${c}: ${res.error || "unknown"}` };
      nextFiles.push(chunkOut);
      nextPlan.push({ ...boundaryItem, inputDurationSec: composedDurationSec });
    }
    files = nextFiles;
    plan = nextPlan;
    level += 1;
  }
  return { success: true, files, plan };
}
function buildFinalXfadeArgs(input) {
  const {
    segmentFiles,
    transitionPlan,
    audioPath,
    audioStartSec,
    sfxInputs,
    bgmPath,
    bgmVolume,
    duckBgm,
    assSubtitlePath,
    totalDurationSec,
    codec,
    crf,
    outputPath,
    audioNormalize,
    videoAudioVolume,
    tempDir,
    segmentHasAudio
  } = input;
  const args = ["-y"];
  for (const file of segmentFiles) args.push("-i", file);
  const audioInputIndex = segmentFiles.length;
  if (audioStartSec > 0) args.push("-ss", audioStartSec.toFixed(3));
  args.push("-t", totalDurationSec.toFixed(3), "-i", audioPath);
  const sfxStartIdx = audioInputIndex + 1;
  for (const item of sfxInputs) args.push("-i", item.path);
  const hasBgm = !!bgmPath;
  const bgmInputIndex = sfxStartIdx + sfxInputs.length;
  if (hasBgm) args.push("-stream_loop", "-1", "-i", bgmPath);
  const { parts: videoChainParts, finalLabel } = buildXfadeVideoChain(segmentFiles.length, transitionPlan);
  const parts = [...videoChainParts];
  if (assSubtitlePath) {
    parts.push(`[${finalLabel}]${buildSubtitleFilter(assSubtitlePath)},format=yuv420p[vout]`);
  } else {
    parts.push(`[${finalLabel}]format=yuv420p[vout]`);
  }
  if (sfxInputs.length > 0) {
    const delayed = sfxInputs.map((item, idx) => `[${sfxStartIdx + idx}:a]adelay=${Math.max(0, Math.round(item.startMs))}:all=1[sfx${idx}]`);
    const amixInputs = [`[${audioInputIndex}:a]`, ...sfxInputs.map((_, idx) => `[sfx${idx}]`)].join("");
    parts.push(`${delayed.join(";")};${amixInputs}amix=inputs=${sfxInputs.length + 1}:duration=first:dropout_transition=0:normalize=0[voiceMix]`);
  } else {
    parts.push(`[${audioInputIndex}:a]anull[voiceMix]`);
  }
  if (hasBgm) {
    parts.push(`[${bgmInputIndex}:a]volume=${bgmVolume.toFixed(3)}[bgm0]`);
    if (duckBgm) {
      parts.push("[bgm0][voiceMix]sidechaincompress=threshold=0.05:ratio=8:attack=50:release=500[bgmDucked]");
      parts.push("[voiceMix][bgmDucked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMaster]");
    } else {
      parts.push("[voiceMix][bgm0]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMaster]");
    }
  } else {
    parts.push("[voiceMix]anull[preMaster]");
  }
  const anySegmentAudio = segmentHasAudio.some(Boolean);
  if (videoAudioVolume > 0 && anySegmentAudio) {
    const AUDIO_FMT = "aformat=sample_fmts=fltp:channel_layouts=stereo:sample_rates=48000";
    const segAudioParts = segmentFiles.map((_, idx) => {
      if (segmentHasAudio[idx]) {
        return `[${idx}:a]${AUDIO_FMT},volume=${videoAudioVolume.toFixed(3)}[va${idx}]`;
      }
      const durSec = (transitionPlan[idx]?.inputDurationSec ?? 0).toFixed(6);
      return `anullsrc=r=48000:cl=stereo,atrim=duration=${durSec},${AUDIO_FMT}[va${idx}]`;
    });
    const segAudioLabels = segmentFiles.map((_, idx) => `[va${idx}]`).join("");
    parts.push(...segAudioParts);
    parts.push(`${segAudioLabels}concat=n=${segmentFiles.length}:v=0:a=1[vidAudio]`);
    parts.push("[preMaster][vidAudio]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preNorm]");
  } else {
    parts.push("[preMaster]anull[preNorm]");
  }
  if (audioNormalize) {
    parts.push("[preNorm]loudnorm=I=-14:TP=-1:LRA=11[aout]");
  } else {
    parts.push("[preNorm]anull[aout]");
  }
  const filterScriptPath = path.join(tempDir, "xfade-filter.txt");
  fs.writeFileSync(filterScriptPath, parts.join(";"), "utf-8");
  args.push(
    "-filter_complex_script",
    filterScriptPath,
    "-map",
    "[vout]",
    "-map",
    "[aout]",
    "-c:v",
    codec,
    ...crfArgs(codec, crf),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    totalDurationSec.toFixed(3),
    "-shortest",
    outputPath
  );
  return args;
}
function buildFinalConcatArgs(input) {
  const {
    concatList,
    audioPath,
    audioStartSec,
    sfxInputs,
    bgmPath,
    bgmVolume,
    duckBgm,
    assSubtitlePath,
    totalDurationSec,
    codec,
    crf,
    outputPath,
    audioNormalize,
    videoAudioVolume,
    masterFromSegments,
    anySegmentHasAudio
  } = input;
  if (masterFromSegments && !assSubtitlePath && !bgmPath && !audioNormalize) {
    return [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatList,
      "-map",
      "0:v",
      "-map",
      "0:a",
      "-c",
      "copy",
      "-t",
      totalDurationSec.toFixed(3),
      "-shortest",
      outputPath
    ];
  }
  const voiceInput = masterFromSegments ? "0:a" : "1:a";
  const base = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatList
  ];
  if (audioStartSec > 0) base.push("-ss", audioStartSec.toFixed(3));
  base.push("-t", totalDurationSec.toFixed(3), "-i", audioPath);
  const sfxStartIdx = 2;
  for (const item of sfxInputs) base.push("-i", item.path);
  const hasBgm = !!bgmPath;
  const bgmInputIndex = sfxStartIdx + sfxInputs.length;
  if (hasBgm) base.push("-stream_loop", "-1", "-i", bgmPath);
  if (!assSubtitlePath && !hasBgm && !audioNormalize && videoAudioVolume <= 0) {
    return [
      ...base,
      ...buildAudioMixArgs(sfxInputs.map((item) => item.startMs)),
      "-c:v",
      "copy",
      "-b:a",
      "192k",
      "-shortest",
      outputPath
    ];
  }
  const parts = [];
  if (assSubtitlePath) {
    parts.push(`[0:v]${buildSubtitleFilter(assSubtitlePath)}[vout]`);
  }
  if (sfxInputs.length > 0) {
    const delayed = sfxInputs.map((item, idx) => `[${sfxStartIdx + idx}:a]adelay=${Math.max(0, Math.round(item.startMs))}:all=1[sfx${idx}]`);
    const amixInputs = [`[${voiceInput}]`, ...sfxInputs.map((_, idx) => `[sfx${idx}]`)].join("");
    parts.push(`${delayed.join(";")};${amixInputs}amix=inputs=${sfxInputs.length + 1}:duration=first:dropout_transition=0:normalize=0[voiceMix]`);
  } else {
    parts.push(`[${voiceInput}]anull[voiceMix]`);
  }
  if (hasBgm) {
    parts.push(`[${bgmInputIndex}:a]volume=${bgmVolume.toFixed(3)}[bgm0]`);
    if (duckBgm) {
      parts.push("[bgm0][voiceMix]sidechaincompress=threshold=0.05:ratio=8:attack=50:release=500[bgmDucked]");
      parts.push("[voiceMix][bgmDucked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMasterC]");
    } else {
      parts.push("[voiceMix][bgm0]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preMasterC]");
    }
  } else {
    parts.push("[voiceMix]anull[preMasterC]");
  }
  if (videoAudioVolume > 0 && !masterFromSegments && anySegmentHasAudio) {
    parts.push(`[0:a]volume=${videoAudioVolume.toFixed(3)}[vidAudioC]`);
    parts.push("[preMasterC][vidAudioC]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[preNormC]");
  } else {
    parts.push("[preMasterC]anull[preNormC]");
  }
  if (audioNormalize) {
    parts.push("[preNormC]loudnorm=I=-14:TP=-1:LRA=11[aout]");
  } else {
    parts.push("[preNormC]anull[aout]");
  }
  const args = [...base, "-filter_complex", parts.join(";")];
  if (assSubtitlePath) {
    args.push("-map", "[vout]", "-map", "[aout]");
    args.push("-c:v", codec, ...crfArgs(codec, crf));
  } else {
    args.push("-map", "0:v", "-map", "[aout]");
    args.push("-c:v", "copy");
  }
  args.push("-c:a", "aac", "-b:a", "192k");
  if (hasBgm) args.push("-t", totalDurationSec.toFixed(3));
  args.push("-shortest", outputPath);
  return args;
}
const activeJobs$1 = /* @__PURE__ */ new Map();
function cancelRender(jobId) {
  const state = activeJobs$1.get(jobId);
  if (!state) return false;
  state.canceled = true;
  for (const cid of state.childJobIds) cancelFFmpeg(cid);
  return true;
}
function cancelAllRenders() {
  for (const [, state] of activeJobs$1) {
    state.canceled = true;
    for (const cid of state.childJobIds) cancelFFmpeg(cid);
  }
  activeJobs$1.clear();
}
async function pickOutputVideoPath(defaultName) {
  const result = await electron.dialog.showSaveDialog({
    title: "Save rendered video",
    defaultPath: path.join(electron.app.getPath("videos"), defaultName),
    filters: [{ name: "MP4 Video", extensions: ["mp4"] }]
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
}
async function renderVideo(req, emit) {
  if (!fs.existsSync(req.audioPath)) {
    return { success: false, error: `Audio not found: ${req.audioPath}` };
  }
  if (req.segments.length === 0) {
    return { success: false, error: "No segments to render" };
  }
  const state = { canceled: false, childJobIds: /* @__PURE__ */ new Set(), tempDir: null };
  activeJobs$1.set(req.jobId, state);
  try {
    emit({ jobId: req.jobId, type: "stage", stage: "preparing", message: "Preparing temp folder", percent: 0 });
    const outputPath = req.outputPath ?? path.join(path.dirname(req.audioPath), `${path.parse(req.audioPath).name}.auto.mp4`);
    const imageCandidateDirs = [
      path.dirname(req.audioPath),
      path.dirname(outputPath),
      process.cwd(),
      req.mediaRoot
    ];
    const tempDir = makeTempDir(req.jobId);
    state.tempDir = tempDir;
    emit({ jobId: req.jobId, type: "log", message: `mediaRoot: ${req.mediaRoot}` });
    emit({ jobId: req.jobId, type: "log", message: `tempDir: ${tempDir}` });
    emit({ jobId: req.jobId, type: "log", message: `mediaMode: ${req.mediaMode ?? "image"}` });
    emit({ jobId: req.jobId, type: "log", message: `segments with image: ${req.segments.filter((s) => s.imagePath).length}/${req.segments.length}` });
    emit({ jobId: req.jobId, type: "log", message: `segments with video: ${req.segments.filter((s) => s.videoPath).length}/${req.segments.length}` });
    emit({
      jobId: req.jobId,
      type: "stage",
      stage: "building-segments",
      message: `Building ${req.segments.length} segment(s)`,
      percent: 0,
      segmentTotal: req.segments.length
    });
    const segmentFiles = [];
    const segmentHasAudio = [];
    const [width, height] = req.resolution.split("x").map((n) => parseInt(n, 10));
    const sourceAudioDurationSec = await probeMediaDuration(req.audioPath);
    const audioStartSec = Math.max(0, (req.audioStartMs ?? 0) / 1e3);
    const requestedAudioEndSec = req.audioEndMs != null ? Math.max(audioStartSec, req.audioEndMs / 1e3) : null;
    const audioDurationSec = requestedAudioEndSec != null ? Math.max(0.1, requestedAudioEndSec - audioStartSec) : sourceAudioDurationSec != null ? Math.max(0.1, sourceAudioDurationSec - audioStartSec) : null;
    const framePlan = buildFrameTimeline(req.segments, req.fps, audioDurationSec);
    const transitionPlan = buildXfadeTimeline(req.segments, framePlan, req.fps);
    const finalFrame = framePlan[framePlan.length - 1]?.endFrame ?? 0;
    const totalDurationSec = Math.max(0.1, finalFrame / req.fps);
    const captionSegments = req.captionSegments ?? req.segments;
    const assSubtitlePath = req.burnSubtitles ? writeAssSubtitleFile(captionSegments, width, height, req.subtitleFontSize, tempDir) : null;
    const bgmResolvedPath = resolveAudioPath(req.bgmPath ?? "", imageCandidateDirs);
    const bgmVolume = Math.min(1, Math.max(0, req.bgmVolume ?? 0.25));
    const duckBgm = req.bgmDuckVoice !== false;
    const audioNormalize = req.audioNormalize === true;
    const videoAudioVolume = Math.min(1, Math.max(0, req.videoAudioVolume ?? 0));
    const masterFromSegments = req.masterFromSegments === true;
    emit({
      jobId: req.jobId,
      type: "log",
      message: `frame plan: fps=${req.fps}, audio=${audioDurationSec?.toFixed(3) ?? "unknown"}s, finalFrame=${finalFrame}, duration=${(finalFrame / req.fps).toFixed(3)}s`
    });
    emit({
      jobId: req.jobId,
      type: "log",
      message: `xfade plan: ${transitionPlan.filter((item) => item.durationFrames > 0).map((item, index) => `${index + 1}:${item.ffmpegName}/${item.durationSec.toFixed(3)}s`).join(", ") || "hard cuts only"}`
    });
    emit({
      jobId: req.jobId,
      type: "log",
      message: `subtitles: ${assSubtitlePath ? `burning (${captionSegments.filter((s) => s.text?.trim()).length} captions)` : "off"}`
    });
    emit({
      jobId: req.jobId,
      type: "log",
      message: `bgm: ${bgmResolvedPath ? `${bgmResolvedPath} (volume=${bgmVolume}, duck=${duckBgm})` : "off"}`
    });
    emit({
      jobId: req.jobId,
      type: "log",
      message: `audioNormalize: ${audioNormalize ? "-14 LUFS" : "off"}, videoAudioVolume: ${videoAudioVolume}`
    });
    for (let i = 0; i < req.segments.length; i += 1) {
      if (state.canceled) return { success: false, canceled: true, error: "canceled" };
      const seg = req.segments[i];
      const plan = framePlan[i];
      const durationFrames = plan.durationFrames + transitionPlan[i].durationFrames;
      const durationSec = durationFrames / req.fps;
      emit({
        jobId: req.jobId,
        type: "segment-start",
        segmentIndex: i,
        segmentTotal: req.segments.length,
        percent: Math.round(i / req.segments.length * 50)
      });
      const segOutPath = path.join(tempDir, `seg_${i.toString().padStart(4, "0")}.mp4`);
      const childJobId = `${req.jobId}-seg-${i}`;
      state.childJobIds.add(childJobId);
      const useVideo = req.mediaMode === "video" && !!seg.videoPath;
      const resolvedVideoPath = useVideo ? await resolveVideoSrc(seg.videoPath || "", req.mediaRoot, imageCandidateDirs) : "";
      if (useVideo && !resolvedVideoPath) {
        return {
          success: false,
          error: [
            `Segment ${i + 1}: video not found/readable, render stopped.`,
            `videoPath: ${seg.videoPath}`,
            `mediaRoot: ${req.mediaRoot}`,
            `tried relative dirs: ${imageCandidateDirs.join(" | ")}`
          ].join("\n")
        };
      }
      const resolvedImagePath = await resolveImageSrc(seg.imagePath, req.mediaRoot, imageCandidateDirs, tempDir, i);
      if (seg.imagePath && !resolvedImagePath) {
        return {
          success: false,
          error: [
            `Segment ${i + 1}: image not found/readable, render stopped.`,
            `imagePath: ${seg.imagePath}`,
            `mediaRoot: ${req.mediaRoot}`,
            `tried relative dirs: ${imageCandidateDirs.join(" | ")}`
          ].join("\n")
        };
      }
      if (resolvedImagePath) {
        const stat = fs.statSync(resolvedImagePath);
        emit({
          jobId: req.jobId,
          type: "log",
          message: `Segment ${i + 1}: using image ${resolvedImagePath} (${stat.size} bytes)`
        });
      }
      const resolvedOverlayImagePath = seg.overlayImagePath ? await resolveImageSrc(seg.overlayImagePath, req.mediaRoot, imageCandidateDirs, tempDir, 1e4 + i) : "";
      if (seg.overlayImagePath && !resolvedOverlayImagePath) {
        emit({
          jobId: req.jobId,
          type: "log",
          message: `Segment ${i + 1}: researched overlay unavailable, continuing without it`
        });
      } else if (resolvedOverlayImagePath) {
        emit({
          jobId: req.jobId,
          type: "log",
          message: `Segment ${i + 1}: overlay ${resolvedOverlayImagePath} at ${seg.overlayPlacement ?? "top_right"}`
        });
      }
      if (resolvedVideoPath) {
        const stat = fs.statSync(resolvedVideoPath);
        emit({
          jobId: req.jobId,
          type: "log",
          message: `Segment ${i + 1}: using video ${resolvedVideoPath} (${stat.size} bytes)`
        });
      }
      const keepVideoAudio = !!resolvedVideoPath && videoAudioVolume > 0;
      const sourceDurationSec = resolvedVideoPath ? await probeMediaDuration(resolvedVideoPath) : null;
      const segHasAudio = keepVideoAudio ? await probeHasAudioStream(resolvedVideoPath) : false;
      const args = buildSegmentArgs({
        mediaType: resolvedVideoPath ? "video" : "image",
        imagePath: resolvedImagePath,
        videoPath: resolvedVideoPath,
        sourceStartSec: Math.max(0, (seg.sourceStartMs ?? 0) / 1e3),
        overlayImagePath: resolvedOverlayImagePath,
        overlayPlacement: seg.overlayPlacement ?? "top_right",
        sourceDurationSec,
        durationSec,
        width,
        height,
        fps: req.fps,
        codec: req.codec,
        crf: req.crf,
        mediaEffect: seg.mediaEffect ?? "none",
        effectStartMs: seg.effectStartMs ?? 0,
        effectEndMs: seg.effectEndMs ?? durationSec * 1e3,
        durationFrames,
        outputPath: segOutPath,
        keepVideoAudio
      });
      const result = await runFFmpeg({
        jobId: childJobId,
        args,
        totalDurationSec: durationSec
      });
      state.childJobIds.delete(childJobId);
      if (state.canceled) return { success: false, canceled: true, error: "canceled" };
      if (!result.success) {
        return {
          success: false,
          error: `Segment ${i + 1} failed: ${result.error || "unknown"}
${result.stderr.slice(-500)}`
        };
      }
      segmentFiles.push(segOutPath);
      segmentHasAudio.push(segHasAudio);
      emit({
        jobId: req.jobId,
        type: "segment-done",
        segmentIndex: i,
        segmentTotal: req.segments.length,
        percent: Math.round((i + 1) / req.segments.length * 50)
      });
    }
    const concatList = path.join(tempDir, "concat.txt");
    const concatLines = segmentFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(concatList, concatLines, "utf-8");
    emit({
      jobId: req.jobId,
      type: "stage",
      stage: "concatenating",
      message: "Concatenating segments + audio",
      percent: 50
    });
    const concatJobId = `${req.jobId}-concat`;
    state.childJobIds.add(concatJobId);
    const sfxInputs = req.segments.map((seg) => ({ path: resolveAudioPath(seg.sfxPath ?? "", imageCandidateDirs), startMs: seg.startMs })).filter((item) => item.path);
    for (const item of sfxInputs) {
      emit({ jobId: req.jobId, type: "log", message: `SFX at ${(item.startMs / 1e3).toFixed(3)}s: ${item.path}` });
    }
    const hasXfade = transitionPlan.some((item) => item.durationFrames > 0);
    const anySegmentHasAudio = segmentHasAudio.some(Boolean);
    let finalSegmentFiles = segmentFiles;
    let finalTransitionPlan = transitionPlan;
    let finalSegmentHasAudio = segmentHasAudio;
    if (hasXfade && !anySegmentHasAudio && segmentFiles.length > MAX_XFADE_INPUTS) {
      emit({
        jobId: req.jobId,
        type: "log",
        message: `xfade batching: ${segmentFiles.length} segments > ${MAX_XFADE_INPUTS}, collapsing in batches`
      });
      const collapse = await collapseXfadeSegments({
        segmentFiles,
        transitionPlan,
        codec: req.codec,
        crf: req.crf,
        tempDir,
        jobIdBase: req.jobId,
        onLevel: (level, chunkTotal) => emit({
          jobId: req.jobId,
          type: "log",
          message: `xfade batching level ${level}: ${chunkTotal} batch(es)`
        }),
        runChunk: async (args, jobId) => {
          if (state.canceled) return { success: false, canceled: true };
          state.childJobIds.add(jobId);
          const r = await runFFmpeg({ jobId, args });
          state.childJobIds.delete(jobId);
          if (state.canceled) return { success: false, canceled: true };
          if (!r.success) return { success: false, error: `${r.error || "unknown"}
${r.stderr.slice(-400)}` };
          return { success: true };
        }
      });
      if (collapse.canceled || state.canceled) return { success: false, canceled: true, error: "canceled" };
      if (!collapse.success) return { success: false, error: `Xfade batching failed: ${collapse.error || "unknown"}` };
      finalSegmentFiles = collapse.files;
      finalTransitionPlan = collapse.plan;
      finalSegmentHasAudio = finalSegmentFiles.map(() => false);
      emit({
        jobId: req.jobId,
        type: "log",
        message: `xfade batching done: collapsed to ${finalSegmentFiles.length} clip(s) for final render`
      });
    }
    const concatArgs = hasXfade ? buildFinalXfadeArgs({
      segmentFiles: finalSegmentFiles,
      transitionPlan: finalTransitionPlan,
      audioPath: req.audioPath,
      audioStartSec,
      sfxInputs,
      bgmPath: bgmResolvedPath,
      bgmVolume,
      duckBgm,
      assSubtitlePath,
      totalDurationSec,
      codec: req.codec,
      crf: req.crf,
      outputPath,
      audioNormalize,
      videoAudioVolume,
      segmentCount: finalSegmentFiles.length,
      tempDir,
      segmentHasAudio: finalSegmentHasAudio
    }) : buildFinalConcatArgs({
      concatList,
      audioPath: req.audioPath,
      audioStartSec,
      sfxInputs,
      bgmPath: bgmResolvedPath,
      bgmVolume,
      duckBgm,
      assSubtitlePath,
      totalDurationSec,
      codec: req.codec,
      crf: req.crf,
      outputPath,
      audioNormalize,
      videoAudioVolume,
      masterFromSegments,
      anySegmentHasAudio
    });
    const concatResult = await runFFmpeg({
      jobId: concatJobId,
      args: concatArgs,
      totalDurationSec,
      onProgress: (p) => {
        const overall = 50 + p.percent / 2;
        emit({
          jobId: req.jobId,
          type: "concat-progress",
          percent: overall
        });
      }
    });
    state.childJobIds.delete(concatJobId);
    if (state.canceled) return { success: false, canceled: true, error: "canceled" };
    if (!concatResult.success) {
      return {
        success: false,
        error: `Concat failed: ${concatResult.error || "unknown"}
${concatResult.stderr.slice(-500)}`
      };
    }
    emit({ jobId: req.jobId, type: "stage", stage: "done", percent: 100, message: "Render complete" });
    return { success: true, outputPath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (state.tempDir) cleanupTempDir$1(state.tempDir);
    activeJobs$1.delete(req.jobId);
  }
}
const activeJobs = /* @__PURE__ */ new Set();
function cancelEditorRender(jobId) {
  activeJobs.delete(jobId);
  return cancelFFmpeg(jobId);
}
async function pickEditorOutput(defaultName) {
  const result = await electron.dialog.showSaveDialog({
    title: "Xuất video",
    defaultPath: defaultName,
    filters: [{ name: "MP4", extensions: ["mp4"] }]
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
}
async function renderEditor(plan, jobId, outputPath, emit, options) {
  const tempDir = path.join(os.tmpdir(), `autoedit-${slug(jobId)}-${crypto.randomBytes(4).toString("hex")}`);
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const textPaths = [];
    plan.visual.forEach((layer, i) => {
      if (layer.kind === "text") textPaths.push(writeTextPng(layer.pngDataUrl, tempDir, i));
    });
    emit({ jobId, type: "stage", stage: "rendering", message: "Rendering…" });
    const args = buildArgs(plan, textPaths, outputPath, options);
    const result = await runFFmpeg({
      jobId,
      args,
      totalDurationSec: plan.durationSec,
      onProgress: (progress) => emit({ jobId, type: "progress", percent: progress.percent }),
      onLog: (line) => emit({ jobId, type: "log", message: line })
    });
    if (result.canceled) return { success: false, canceled: true };
    if (!result.success) return { success: false, error: result.error || tail(result.stderr) };
    if (!fs.existsSync(outputPath)) return { success: false, error: "ffmpeg did not produce an output file" };
    return { success: true, outputPath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    cleanupTempDir(tempDir);
  }
}
function buildArgs(plan, textPaths, outputPath, options) {
  const W = plan.width;
  const H = plan.height;
  const fps = fmt(plan.fps);
  const fpsNum = plan.fps;
  const args = ["-y"];
  const inputIndexByLayer = [];
  let textCursor = 0;
  let inputCount = 0;
  plan.visual.forEach((layer) => {
    inputIndexByLayer.push(inputCount);
    if (layer.kind === "text") {
      args.push("-loop", "1", "-framerate", fps, "-t", fmt(layer.durSec), "-an", "-i", textPaths[textCursor++]);
    } else if (layer.kind === "video") {
      args.push("-ss", fmt(layer.trimStartSec), "-t", fmt(layer.srcDurSec), "-an", "-i", layer.path);
    } else {
      args.push("-loop", "1", "-framerate", fps, "-t", fmt(layer.durSec), "-an", "-i", layer.path);
    }
    inputCount += 1;
  });
  const audioInputIndex = [];
  plan.audio.forEach((a) => {
    audioInputIndex.push(inputCount);
    args.push("-ss", fmt(a.trimStartSec), "-t", fmt(a.srcDurSec), "-vn", "-i", a.path);
    inputCount += 1;
  });
  const filters = [];
  const baseLabel = "base";
  filters.push(`color=c=${plan.backgroundColor}:s=${W}x${H}:r=${fps}:d=${fmt(plan.durationSec)},format=rgba[${baseLabel}]`);
  const units = [];
  let i = 0;
  while (i < plan.visual.length) {
    const layer = plan.visual[i];
    const next = plan.visual[i + 1];
    const canTransition = layer.kind !== "text" && !!layer.transitionToNext && !!next && next.kind !== "text";
    if (!canTransition) {
      const label = `l${i}`;
      filters.push(buildLayerChain(layer, inputIndexByLayer[i], W, H, fpsNum, label));
      const fullCanvas = layer.kind !== "text" && layer.scaleX === 1 && layer.scaleY === 1 && layer.rotateDeg === 0 && layer.posX === 0 && layer.posY === 0;
      units.push({ label, startSec: layer.startSec, endSec: layer.startSec + layer.durSec, posX: layer.posX, posY: layer.posY, blendMode: layer.blendMode, fullCanvas });
      i += 1;
      continue;
    }
    const startSec = layer.startSec;
    const posX = layer.posX;
    const posY = layer.posY;
    let accLabel = `fx${i}`;
    filters.push(mediaXfadeInput(layer, inputIndexByLayer[i], W, H, fpsNum, accLabel));
    let accDur = layer.durSec;
    let j = i;
    while (j + 1 < plan.visual.length) {
      const cur = plan.visual[j];
      const nxt = plan.visual[j + 1];
      if (cur.kind === "text" || !cur.transitionToNext || nxt.kind === "text") break;
      const D = cur.transitionToNext.durationSec;
      const offset = Math.max(0, accDur - D);
      const inLabel = `fx${j + 1}`;
      filters.push(mediaXfadeInput(nxt, inputIndexByLayer[j + 1], W, H, fpsNum, inLabel));
      const outLabel = `fx${j + 1}_x`;
      filters.push(`[${accLabel}][${inLabel}]xfade=transition=${cur.transitionToNext.xfade}:duration=${fmt(D)}:offset=${fmt(offset)}[${outLabel}]`);
      accLabel = outLabel;
      accDur = accDur + nxt.durSec - D;
      j += 1;
    }
    const finalLabel = `xf${i}`;
    filters.push(`[${accLabel}]setpts=PTS-STARTPTS+${fmt(startSec)}/TB[${finalLabel}]`);
    units.push({ label: finalLabel, startSec, endSec: startSec + accDur, posX, posY, blendMode: "normal", fullCanvas: false });
    i = j + 1;
  }
  let acc = baseLabel;
  units.forEach((unit, idx) => {
    const out = `acc${idx + 1}`;
    const mode = unit.fullCanvas ? ffmpegBlendMode(unit.blendMode) : null;
    if (mode) {
      const padStart = Math.max(0, unit.startSec);
      const padStop = Math.max(0, plan.durationSec - unit.endSec);
      const padded = `${unit.label}_f`;
      filters.push(`[${unit.label}]tpad=start_mode=clone:start_duration=${fmt(padStart)}:stop_mode=clone:stop_duration=${fmt(padStop)}[${padded}]`);
      filters.push(
        `[${acc}][${padded}]blend=all_mode=${mode}:enable='between(t,${fmt(unit.startSec)},${fmt(unit.endSec)})'[${out}]`
      );
    } else {
      const x = `(main_w/2+${fmt(unit.posX)})-overlay_w/2`;
      const y = `(main_h/2+${fmt(unit.posY)})-overlay_h/2`;
      filters.push(
        `[${acc}][${unit.label}]overlay=${x}:${y}:enable='between(t,${fmt(unit.startSec)},${fmt(unit.endSec)})':eof_action=pass:format=auto[${out}]`
      );
    }
    acc = out;
  });
  for (const [idx, effect] of (plan.sceneEffects ?? []).entries()) {
    const filter = sceneEffectFilter(effect);
    if (!filter) continue;
    const out = `fx${idx + 1}`;
    const endSec = effect.startSec + effect.durSec;
    filters.push(
      `[${acc}]${filter}:enable='between(t,${fmt(effect.startSec)},${fmt(endSec)})'[${out}]`
    );
    acc = out;
  }
  const outW = options?.outputWidth ?? W;
  const outH = options?.outputHeight ?? H;
  if (outW !== W || outH !== H) {
    filters.push(`[${acc}]scale=${outW}:${outH}:flags=lanczos[vout]`);
  } else {
    filters.push(`[${acc}]null[vout]`);
  }
  if (plan.audio.length > 0) {
    plan.audio.forEach((a, i2) => {
      const idx = audioInputIndex[i2];
      filters.push(`[${idx}:a]asetpts=PTS-STARTPTS,${atempoChain(a.rate)},adelay=${Math.round(a.startMs)}:all=1,volume=${fmt(a.volume)}[a${i2}]`);
    });
    const mixInputs = plan.audio.map((_, i2) => `[a${i2}]`).join("");
    filters.push(`${mixInputs}amix=inputs=${plan.audio.length}:duration=longest:normalize=0[aout]`);
  }
  args.push("-filter_complex", filters.join(";"));
  args.push("-map", "[vout]");
  if (plan.audio.length > 0) args.push("-map", "[aout]");
  const codec = options?.codec ?? "libx264";
  const crf = options?.crf ?? 18;
  if (codec === "h264_nvenc") {
    args.push("-c:v", "h264_nvenc", "-cq", String(crf), "-preset", "p4", "-pix_fmt", "yuv420p");
  } else {
    args.push("-c:v", codec, "-crf", String(crf), "-preset", "medium", "-pix_fmt", "yuv420p");
  }
  if (plan.audio.length > 0) args.push("-c:a", "aac", "-b:a", "192k");
  args.push("-r", fps);
  args.push("-t", fmt(plan.durationSec));
  args.push(outputPath);
  return args;
}
function sceneEffectFilter(effect) {
  if (effect.type === "blur") {
    if (effect.blurSigma <= 0) return null;
    return `gblur=sigma=${fmt(effect.blurSigma)}`;
  }
  return null;
}
function fitScale(fit, W, H, pad = false) {
  if (fit === "cover") return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  if (fit === "stretch") return `scale=${W}:${H}`;
  const contain = `scale=${W}:${H}:force_original_aspect_ratio=decrease`;
  return pad ? `${contain},pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black@0` : contain;
}
function buildLayerChain(layer, inputIndex, W, H, fpsNum, label) {
  const src = `[${inputIndex}:v]`;
  let chain = src;
  const motion = layerMotion(layer, W, H, fpsNum);
  const fitted = (fit) => motion.filter ? `,format=${motion.pixelFormat},${fitScale(fit, W * motion.supersample, H * motion.supersample, true)}${motion.filter}` : `,${fitScale(fit, W, H)}`;
  if (layer.kind === "video") {
    chain += `setpts=(PTS-STARTPTS)/${fmt(layer.rate)}+${fmt(layer.startSec)}/TB`;
    chain += fitted(layer.fit);
  } else if (layer.kind === "image") {
    chain += `setpts=PTS-STARTPTS+${fmt(layer.startSec)}/TB`;
    chain += fitted(layer.fit);
  } else {
    chain += `setpts=PTS-STARTPTS+${fmt(layer.startSec)}/TB`;
  }
  const sx = fmt(layer.scaleX);
  const sy = fmt(layer.scaleY);
  chain += `,scale=w='max(2,trunc(iw*${sx}))':h='max(2,trunc(ih*${sy}))'`;
  chain += `,format=rgba`;
  chain += `,rotate=${fmt(layer.rotateDeg)}*PI/180:ow=rotw(${fmt(layer.rotateDeg)}):oh=roth(${fmt(layer.rotateDeg)}):c=black@0`;
  if (layer.blurSigma > 0) chain += `,gblur=sigma=${fmt(layer.blurSigma)}`;
  if (layer.opacity < 1) chain += `,colorchannelmixer=aa=${fmt(layer.opacity)}`;
  return `${chain}[${label}]`;
}
function mediaXfadeInput(layer, inputIndex, W, H, fpsNum, label) {
  const rate = layer.kind === "video" ? layer.rate : 1;
  const motion = layerMotion(layer, W, H, fpsNum);
  const fillW = W * motion.supersample;
  const fillH = H * motion.supersample;
  let chain = `[${inputIndex}:v]setpts=(PTS-STARTPTS)/${fmt(rate)}`;
  chain += `,scale=${fillW}:${fillH}:force_original_aspect_ratio=increase,crop=${fillW}:${fillH},setsar=1,fps=${fmt(fpsNum)}`;
  chain += `${motion.filter},format=rgba`;
  if (layer.blurSigma > 0) chain += `,gblur=sigma=${fmt(layer.blurSigma)}`;
  if (layer.opacity < 1) chain += `,colorchannelmixer=aa=${fmt(layer.opacity)}`;
  return `${chain}[${label}]`;
}
function layerMotion(layer, W, H, fpsNum) {
  if (layer.kind === "text") return NO_MOTION;
  const durationFrames = Math.max(1, Math.round(layer.durSec * fpsNum));
  return buildMotionPlan(layer.motionEffect, W, H, fpsNum, durationFrames, 0, Number.POSITIVE_INFINITY, { alpha: true });
}
function ffmpegBlendMode(blendMode) {
  switch (blendMode) {
    case "normal":
      return null;
    case "multiply":
      return "multiply";
    case "screen":
      return "screen";
    case "overlay":
      return "overlay";
    case "darken":
      return "darken";
    case "lighten":
      return "lighten";
    case "color_dodge":
      return "dodge";
    case "color_burn":
      return "burn";
    case "hard_light":
      return "hardlight";
    case "soft_light":
      return "softlight";
    case "difference":
      return "difference";
    case "exclusion":
      return "exclusion";
    case "add":
      return "addition";
    default:
      return null;
  }
}
function atempoChain(rate) {
  if (rate === 1) return "atempo=1.0";
  let remaining = rate;
  const parts = [];
  while (remaining > 2) {
    parts.push("2.0");
    remaining /= 2;
  }
  while (remaining < 0.5) {
    parts.push("0.5");
    remaining /= 0.5;
  }
  parts.push(fmt(remaining));
  return parts.map((p) => `atempo=${p}`).join(",");
}
function writeTextPng(dataUrl, tempDir, index) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join(tempDir, `text_${index}.png`);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  return filePath;
}
function fmt(n) {
  if (!Number.isFinite(n)) return "0";
  return Number(n.toFixed(6)).toString();
}
function slug(s) {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "job";
}
function tail(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.slice(-8).join("\n");
}
function cleanupTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
  }
}
const voiceCatalog = [
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV421_vivn_streaming",
    display_name: "Nhỏ Ngọt Ngào",
    resource_id: "7252594014782755330",
    captured_at: "2026-04-16T16:54:58.535653"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "vi_female_huong",
    display_name: "Giọng Nữ Phổ Thông",
    resource_id: "7264854897953083905",
    captured_at: "2026-04-16T16:58:05.941432"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV074_streaming_dsp",
    display_name: "Giọng Bé",
    resource_id: "7550087831092251920",
    captured_at: "2026-04-16T16:59:13.750474"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV074_streaming",
    display_name: "Cô Gái Hoạt Ngôn",
    resource_id: "7102355709945188865",
    captured_at: "2026-04-16T16:59:13.750474"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "vi-VN-HoaiMyNeural",
    display_name: "Hoai My",
    resource_id: "7371666434650280464",
    captured_at: "2026-04-16T17:00:10.719561"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "vi-VN-NamMinhNeural",
    display_name: "Nam Minh",
    resource_id: "7371666524727153168",
    captured_at: "2026-04-16T17:00:10.719561"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV075_streaming_vibrato_dsp",
    display_name: "Việt Méo",
    resource_id: "7569450639810465040",
    captured_at: "2026-04-16T17:01:05.535801"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV562_streaming",
    display_name: "Mai",
    resource_id: "7483736254694035984",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_yangguangnv_uranus_bigtts",
    display_name: "Ban Mai",
    resource_id: "7637456432522218773",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_richgirl_uranus_bigtts",
    display_name: "Review Phim new",
    resource_id: "7637460351541447956",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_quanweinv_uranus_bigtts",
    display_name: "Bản Tin 1",
    resource_id: "7637458743197732117",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_stokie_uranus_bigtts",
    display_name: "Review Phim 4",
    resource_id: "7637456729696996628",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_sisi_uranus_bigtts",
    display_name: "Bản Tin nữ",
    resource_id: "7637455857285860629",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_daqi_uranus_bigtts",
    display_name: "Review Phim 3",
    resource_id: "7637451983389019409",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_xyf04auto_uranus_bigtts",
    display_name: "Review Phim 2",
    resource_id: "7637458743197732117",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_kiwi_uranus_bigtts",
    display_name: "Sunny Idol",
    resource_id: "7637457995882089749",
    captured_at: "2026-04-16T17:03:08.196640"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV075_streaming_demon_dsp",
    display_name: "Kenny Đại Đế",
    resource_id: "7569442422665661712",
    captured_at: "2026-04-16T17:07:53.599467"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "th",
    display_name: "ThaiLand 3",
    resource_id: "7371666742055014913",
    captured_at: "2026-04-16T17:04:13.750410"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_us_006",
    display_name: "EN US 2",
    resource_id: "7114563482518819329",
    captured_at: "2026-04-16T17:15:57.990247"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_us_002",
    display_name: "EN US",
    resource_id: "7130515992936976897",
    captured_at: "2026-04-16T17:17:42.175768"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_janeamber_mars_bigtts",
    display_name: "Janeamber",
    resource_id: "7538652405005700369",
    captured_at: "2026-04-16T17:22:43.690635"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_emotional_moon_bigtts",
    display_name: "Emotional",
    resource_id: "7114563483257016833",
    captured_at: "2026-04-16T17:22:43.690635"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "BV452_streaming",
    display_name: "Vũ hán",
    resource_id: "7543766515837848833",
    captured_at: "2026-04-16T17:27:42.444689"
  },
  {
    lan: "id",
    lang: "id-ID",
    voice_type: "id_female_icha_uranus_bigtts",
    display_name: "Icathian",
    resource_id: "7587328219989249296",
    captured_at: "2026-04-16T17:16:15.390713"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_xiaonan_lv_clone2",
    display_name: "旅遊主播",
    resource_id: "7554226531451833617",
    captured_at: "2026-04-16T17:19:51.620761"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_female_zhiyu",
    display_name: "Lovely Idol",
    resource_id: "7579078759446285584",
    captured_at: "2026-04-16T17:30:06.622497"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_xinggan",
    display_name: "Xinggan",
    resource_id: "7522965008020540688",
    captured_at: "2026-04-16T17:31:31.391270"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV510_streaming",
    display_name: "English",
    resource_id: "7081169180120060418",
    captured_at: "2026-04-16T17:32:31.135157"
  },
  {
    lan: "fr",
    lang: "fr-FR",
    voice_type: "DiT_fr_male_wit",
    display_name: "Wit",
    resource_id: "7573964692587023617",
    captured_at: "2026-04-16T17:37:56.473383"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_rap",
    display_name: "Rap",
    resource_id: "7573959040657591553",
    captured_at: "2026-04-16T17:38:40.966389"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_sherry",
    display_name: "Sherry",
    resource_id: "7278146554844680706",
    captured_at: "2026-04-16T17:39:22.565639"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_male_wutiaowu",
    display_name: "クールな青年",
    resource_id: "7527837025815334161",
    captured_at: "2026-04-16T17:39:22.565639"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "DiT_es_male_bilunan",
    display_name: "Señor entusiasta",
    resource_id: "7597943534309690641",
    captured_at: "2026-04-16T17:46:01.806866"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "DiT_es_male_agenting",
    display_name: "Agenting",
    resource_id: "7597890302053010704",
    captured_at: "2026-04-16T17:46:01.806866"
  },
  {
    lan: "de",
    lang: "de-DE",
    voice_type: "DiT_de_male_koubo",
    display_name: "Koubo",
    resource_id: "7584344912276114704",
    captured_at: "2026-04-16T17:46:01.806866"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_us_010",
    display_name: "Chrming Male",
    resource_id: "7114563482359435778",
    captured_at: "2026-04-16T17:51:54.146075"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "BV433_streaming",
    display_name: "電視廣告",
    resource_id: "7436608032152228353",
    captured_at: "2026-04-16T17:53:32.141677"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_female_hatunemiku",
    display_name: "Hatunemiku",
    resource_id: "749455601346334",
    captured_at: "2026-04-16T17:58:16.108073"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_paoxiao",
    display_name: "Ơaoxiao",
    resource_id: "7584702432115019009",
    captured_at: "2026-04-16T17:59:13.918584"
  },
  {
    lan: "pt",
    lang: "pt-BR",
    voice_type: "DiT_pt_male_wenrou",
    display_name: "Wenrou",
    resource_id: "7576131428711255297",
    captured_at: "2026-04-16T18:00:23.448961"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_female_tanhua",
    display_name: "Tanhua",
    resource_id: "7522976550736760065",
    captured_at: "2026-04-16T18:01:40.541766"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_deadpool",
    display_name: "Deadpool",
    resource_id: "7231025912261644802",
    captured_at: "2026-04-16T18:04:05.940535"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "BV421_thth_streaming_vibrato_dsp",
    display_name: "ThaiLand 2",
    resource_id: "7569439521352338689",
    captured_at: "2026-04-16T18:05:52.828530"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en-US-JennyMultilingualNeural",
    display_name: "Jenny",
    resource_id: "7569439521352338689",
    captured_at: "2026-04-16T18:05:52.828530"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en",
    display_name: "Male Eng",
    resource_id: "7337657863390630401",
    captured_at: "2026-04-16T18:18:54.241692"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_xiaonan_lv_clone2",
    display_name: "Male China",
    resource_id: "7554226531451833617",
    captured_at: "2026-04-16T18:18:54.241692"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_m03_classical",
    display_name: "Classical Music",
    resource_id: "7245192458206712322",
    captured_at: "2026-04-16T18:32:07.063338"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_dramaqueen_zachk",
    display_name: "Dramaaa",
    resource_id: "733719524381032",
    captured_at: "2026-04-16T18:34:18.103409"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "BV213_streaming",
    display_name: "Dramaaa",
    resource_id: "7372474337594446337",
    captured_at: "2026-04-16T18:34:18.103409"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV503_streaming",
    display_name: "Energetic Famale",
    resource_id: "7081168775646548482",
    captured_at: "2026-04-16T18:43:36.318127"
  },
  {
    lan: "id",
    lang: "id-ID",
    voice_type: "ICL_id_female_hantuperempuan",
    display_name: "Hantuperempuan",
    resource_id: "7469006620379320848",
    captured_at: "2026-04-16T18:44:53.449707"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_guaiqiaogirl",
    display_name: "Guaiqiaogirl",
    resource_id: "7473014336223449616",
    captured_at: "2026-04-16T18:47:37.946328"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_nail_artist",
    display_name: "Artist",
    resource_id: "7393228944540963344",
    captured_at: "2026-04-16T18:48:51.024178"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "DiT_es_female_bilunv",
    display_name: "Female Bilunv",
    resource_id: "7598080655146192144",
    captured_at: "2026-04-16T18:48:51.024178"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_male_tangsengdsp",
    display_name: "Tangsengdsp",
    resource_id: "7520150587619478801",
    captured_at: "2026-04-16T18:52:15.343036"
  },
  {
    lan: "de",
    lang: "de-DE",
    voice_type: "DiT_de_female_jiangshi",
    display_name: "TieFE Dozen",
    resource_id: "7584344912292777232",
    captured_at: "2026-04-16T18:54:06.059705"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_naying",
    display_name: "Naying",
    resource_id: "7436607833887478289",
    captured_at: "2026-04-16T18:56:00.032327"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_female_little_cute_dsp",
    display_name: "Cute Girl",
    resource_id: "7605129105306111233",
    captured_at: "2026-04-16T18:57:04.904497"
  },
  {
    lan: "fr",
    lang: "fr-FR",
    voice_type: "DiT_fr_female_soothing",
    display_name: "Douce",
    resource_id: "7573961077009042689",
    captured_at: "2026-04-16T18:57:48.700364"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_trickster_stream",
    display_name: "Trickster",
    resource_id: "7189462618589893121",
    captured_at: "2026-04-16T18:58:47.747115"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "multi_male_M092_conversation_wvae_bigtts_cc",
    display_name: "conversation",
    resource_id: "7483453668117713425",
    captured_at: "2026-04-16T18:59:30.942521"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_artistic_layne",
    display_name: "Mentor",
    resource_id: "7337195454980952577",
    captured_at: "2026-04-16T19:00:42.297804"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_bobao2",
    display_name: "穏やかな声優",
    resource_id: "7579090923636755729",
    captured_at: "2026-04-16T19:01:26.520189"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "BV567_streaming_dsp",
    display_name: "เด็กเสียง",
    resource_id: "7550069260152818960",
    captured_at: "2026-04-16T19:02:45.068541"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_male_yangguang",
    display_name: "Yangguang",
    resource_id: "752572180004351515",
    captured_at: "2026-04-16T19:04:05.166761"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_male_death_rock",
    display_name: "Grim Rock",
    resource_id: "7372472588859085313",
    captured_at: "2026-04-16T19:04:59.706691"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_ja_female_lengjingnv",
    display_name: "女性AI",
    resource_id: "7571602819283701009",
    captured_at: "2026-04-16T19:06:59.679070"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_male_emo",
    display_name: "Diablomalo",
    resource_id: "7568807675337723137",
    captured_at: "2026-04-16T19:08:00.490219"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_philosopher_dsp",
    display_name: "Narrator",
    resource_id: "7525722920161725712",
    captured_at: "2026-04-16T19:09:15.586981"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_female_kuaizui02",
    display_name: "マネージャー",
    resource_id: "7522976550736678145",
    captured_at: "2026-04-16T19:12:12.094622"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_us_007",
    display_name: "Male Profess",
    resource_id: "7114563482472681986",
    captured_at: "2026-04-16T19:13:08.687098"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_female_ditie_dsp",
    display_name: "Creepy female",
    resource_id: "7572089965652315393",
    captured_at: "2026-04-16T19:14:13.977433"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_soothing_mars_bigtts",
    display_name: "Female Teacher",
    resource_id: "7526754143369760016",
    captured_at: "2026-04-16T19:15:13.877104"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV072_streaming",
    display_name: "Suaraaa",
    resource_id: "7028847457089884674",
    captured_at: "2026-04-16T19:16:04.763487"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_male_jiqiren",
    display_name: "Male Jiqiren ",
    resource_id: "7568807473923099920",
    captured_at: "2026-04-16T19:17:16.008945"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_male_zhenfennan",
    display_name: "少年ヒーロー",
    resource_id: "7538698409633516816",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV075_streaming_robot_dsp",
    display_name: "Robot VN",
    resource_id: "7538698409633516816",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "id",
    lang: "id-ID",
    voice_type: "id_female_icha_uranus_bigtts",
    display_name: "Nữ Cao",
    resource_id: "7587328219989249296",
    captured_at: "2026-04-16T17:16:15.390713"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_male_felipe_uranus_bigtts",
    display_name: "Giọng Nam Trầm ",
    resource_id: "7637456729696996628",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_peiqi_uranus_bigtts",
    display_name: "Giọng Gái Mới Lớn",
    resource_id: "7637458789033151751",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_xinwenjieshuo_uranus_bigtts",
    display_name: "Nam bản tin",
    resource_id: "7637455039719640327",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "multi_female_tianmeijieshuo_uranus_bigtts",
    display_name: "Quên Tên Tự Test",
    resource_id: "7637460417295469832",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV075_streaming",
    display_name: "Thanh Niên Tự Tin",
    resource_id: "7102355803792740865",
    captured_at: "2026-04-16T19:18:27.829029"
  },
  {
    lan: "pt",
    lang: "pt-BR",
    voice_type: "DiT_pt_male_shangren",
    display_name: "Empresário Frio",
    resource_id: "7576131970103643408",
    captured_at: "2026-04-16T19:21:35.568740"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_female_araisan",
    display_name: "天真爛漫な娘",
    resource_id: "7527796800649055489",
    captured_at: "2026-04-16T19:22:51.045337"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_jp_male_dashu",
    display_name: "Dashu",
    resource_id: "7527814111502077201",
    captured_at: "2026-04-16T19:32:12.344997"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "DiT_en_female_jessie",
    display_name: "Jessie",
    resource_id: "7564325260414160129",
    captured_at: "2026-04-16T19:33:50.661222"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_xiaoyue",
    display_name: "Xiaoyue",
    resource_id: "7543792542727425281",
    captured_at: "2026-04-16T19:35:19.418716"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_angela",
    display_name: "暗夜蘿莉",
    resource_id: "7473014770862395905",
    captured_at: "2026-04-16T19:36:47.691630"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "multi_zh_male_youyoujunzi_moon_bigtts_cc",
    display_name: "Rizki",
    resource_id: "7501234950042030608",
    captured_at: "2026-04-16T19:37:53.015530"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV540_streaming",
    display_name: "Desti",
    resource_id: "7477925128651674113",
    captured_at: "2026-04-16T19:39:00.038670"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "DiT_zh_male_xionger",
    display_name: "XiaoChao",
    resource_id: "7564318793716059409",
    captured_at: "2026-04-16T19:42:00.336094"
  },
  {
    lan: "id",
    lang: "id-ID",
    voice_type: "ICL_id_male_deep_god_dsp",
    display_name: "Deep God",
    resource_id: "7605123605034208513",
    captured_at: "2026-04-16T19:42:48.257147"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_inspirational",
    display_name: "溫柔姐姐",
    resource_id: "7473013595417088528",
    captured_at: "2026-04-16T19:43:51.529982"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_loba_apex",
    display_name: "Robaa",
    resource_id: "7360986396594541057",
    captured_at: "2026-04-16T19:44:48.062758"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_reborn",
    display_name: "厳しい先生",
    resource_id: "7573954050379566337",
    captured_at: "2026-04-16T19:45:53.221494"
  },
  {
    lan: "de",
    lang: "de-DE",
    voice_type: "DiT_de_female_qingsong",
    display_name: "Sanfte Führerin",
    resource_id: "7584344912292760848",
    captured_at: "2026-04-16T19:47:19.338313"
  },
  {
    lan: "br",
    lang: "pt-BR",
    voice_type: "ICL_br_male_212M_LuizS",
    display_name: "Contra",
    resource_id: "7501618011829178896",
    captured_at: "2026-04-16T19:48:13.839334"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "DiT_en_male_trickster",
    display_name: "Trickster",
    resource_id: "7564317234814848273",
    captured_at: "2026-04-16T19:49:11.232200"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_female_caroline_clone2",
    display_name: "Excited",
    resource_id: "7232136837861478913",
    captured_at: "2026-04-16T19:51:05.634646"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_305M_JamieTr",
    display_name: "Tinn",
    resource_id: "7501615071068426768",
    captured_at: "2026-04-16T19:51:50.109232"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_kevin2",
    display_name: "Mischief",
    resource_id: "7438551246824280592",
    captured_at: "2026-04-16T19:52:28.876917"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "en_us_002_dsp",
    display_name: "Dolly famle",
    resource_id: "7519722328935140624",
    captured_at: "2026-04-16T19:53:43.896703"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "zh_female_sistermango",
    display_name: "語音助理",
    resource_id: "7588056140685036817",
    captured_at: "2026-04-16T19:53:43.896703"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV507_streaming",
    display_name: "Cute Boy",
    resource_id: "7081168994673103362",
    captured_at: "2026-04-16T19:55:47.456838"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "BV029_streaming",
    display_name: "American Female",
    resource_id: "6898240012404396546",
    captured_at: "2026-04-16T19:57:11.684698"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_female_cc_bluetooth",
    display_name: "Bluetooth",
    resource_id: "7427072447129588225",
    captured_at: "2026-04-16T19:58:43.473823"
  },
  {
    lan: "pt",
    lang: "pt-BR",
    voice_type: "DiT_pt_female_youya",
    display_name: "Youya",
    resource_id: "7576144104547945729",
    captured_at: "2026-04-16T20:00:02.827036"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_female_lisa",
    display_name: "Lisa",
    resource_id: "7491194157852004881",
    captured_at: "2026-04-16T20:01:16.419852"
  },
  {
    lan: "jp",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_huolinan2",
    display_name: "爽やかメンズ",
    resource_id: "7510072022672624913",
    captured_at: "2026-04-16T20:02:12.936927"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "BV567_streaming_demon_dsp",
    display_name: "Thailand",
    resource_id: "7569443462295178512",
    captured_at: "2026-04-16T20:06:49.895883"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "BV568_streaming",
    display_name: "นภา",
    resource_id: "7569443462295178512",
    captured_at: "2026-04-16T20:06:49.895883"
  },
  {
    lan: "th",
    lang: "th-TH",
    voice_type: "multi_female_zendaya_uranus_bigtts",
    display_name: "สุนิสา",
    resource_id: "7569443462295178512",
    captured_at: "2026-04-16T20:06:49.895883"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_317M_BrianJW",
    display_name: "BrianJW",
    resource_id: "7501615796456526352",
    captured_at: "2026-04-16T20:07:51.218166"
  },
  {
    lan: "fr",
    lang: "fr-FR",
    voice_type: "DiT_fr_female_sharp",
    display_name: "sharp",
    resource_id: "7573963007588371728",
    captured_at: "2026-04-16T20:09:23.606987"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_310M_CoreyK",
    display_name: "Kai",
    resource_id: "7501615396093432337",
    captured_at: "2026-04-16T20:11:03.648451"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_captain",
    display_name: "Captain",
    resource_id: "7510080106199665937",
    captured_at: "2026-04-16T20:13:15.083861"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_female_narrator",
    display_name: "narrator",
    resource_id: "7573956962279361809",
    captured_at: "2026-04-16T20:14:15.853320"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "multi_female_wenjingmaomao_moon_bigtts_cc",
    display_name: "Daiana",
    resource_id: "7501234865447113233",
    captured_at: "2026-04-16T20:15:00.999210"
  },
  {
    lan: "zh",
    lang: "zh-CN",
    voice_type: "DiT_zh_male_paoxiaoge",
    display_name: "paoxiaoge",
    resource_id: "7564296190074948865",
    captured_at: "2026-04-16T20:16:39.299060"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_gaoxiao",
    display_name: "gaoxiao",
    resource_id: "7522976550736661761",
    captured_at: "2026-04-16T20:18:03.840903"
  },
  {
    lan: "ja",
    lang: "ja-JP",
    voice_type: "ICL_ja_male_cute",
    display_name: "cute",
    resource_id: "7573955139086667009",
    captured_at: "2026-04-16T20:18:37.864435"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_female_tt_Vivi",
    display_name: "Lía",
    resource_id: "7501616990008644113",
    captured_at: "2026-04-16T20:19:51.325029"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_male_tt_EdgarRu",
    display_name: "EdgarRu",
    resource_id: "7501616889173381633",
    captured_at: "2026-04-16T20:20:31.688602"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_female_tt_RosaW",
    display_name: "Lina",
    resource_id: "75016171499039011",
    captured_at: "2026-04-16T20:21:05.595179"
  },
  {
    lan: "es",
    lang: "es-ES",
    voice_type: "ICL_es_male_shenchen",
    display_name: "Lavana",
    resource_id: "7568807534438468865",
    captured_at: "2026-04-16T20:21:58.224584"
  },
  {
    lan: "en",
    lang: "en-US",
    voice_type: "ICL_en_male_oogie2",
    display_name: "Oogie",
    resource_id: "7438551608746578449",
    captured_at: "2026-04-16T20:23:06.330292"
  },
  {
    lan: "id",
    lang: "id-ID",
    voice_type: "id_male_putra_uranus_bigtts",
    display_name: "Uranus",
    resource_id: "7587328479071309073",
    captured_at: "2026-04-16T20:24:40.652003"
  },
  {
    lan: "vi",
    lang: "vi-VN",
    voice_type: "BV560_streaming",
    display_name: "Alex Đại Đế",
    resource_id: "7483736167565758992",
    captured_at: "2026-04-16T20:26:32.733998"
  }
];
const BASE_URL$1 = "https://editor-api-sg.capcutapi.com";
const DEVICE = {
  aid: "359289",
  app_name: "CapCut",
  appvr: "8.7.0",
  version_name: "8.7.0",
  version_code: "8.7.0",
  channel: "capcutpc_google",
  device_platform: "mac",
  device_type: "MacBookPro17,4",
  device_brand: "MacBookPro17,4",
  os_version: "15.7.4",
  device_id: "76471456455646328721",
  iid: "76471456455646328721",
  region: "VN",
  loc: "VN",
  lan: "vi-VN",
  pf: "3",
  tdid: "76471456455646328721"
};
const TTS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmTd34Lw4b7IuldSXh/zY
CMla+ITdGG5TeWz6ad+OySd4r+IrY45AoqrYUxhQ2dl+7z+i7r/5vEa8rr39BYfB
8AGMQLmZA8HmgpWBsqrn/V6daUALkKnkLb70Fn32CJigIuGXAYqxUdGuI340aC+0
v5Es3puJsHyzf01/AelE4Cdc6bZhQrASJLBh8R3BQToYClmDVSDUQk28o8sl/guA
Z4n303Vj+6Siv1HayPCdV6kpVVnMBAG4+umUbwGmn132N3fgpzLarFF3XyWmS1zh
D/J07iM/rP8GDO9IskHNHd2phrO0G6KzrcFAnTBHjVv+hCBEfzN/no3FNA9AuC36
mwIDAQAB
-----END PUBLIC KEY-----`;
const activeControllers = /* @__PURE__ */ new Map();
const catalog = voiceCatalog;
function outputRoot$4() {
  return path.join(electron.app.getPath("userData"), "tts", "outputs");
}
function md5(value) {
  return crypto.createHash("md5").update(value, "utf8").digest("hex");
}
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function traceId() {
  const seed = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  return `00-${seed}-${seed.slice(0, 16)}-01`;
}
function baseHeaders(bodyText, url) {
  const now = String(Math.floor(Date.now() / 1e3));
  const pathOnly = url.split("?", 1)[0];
  const signInput = `9e2c|${pathOnly.slice(-7)}|3|${DEVICE.appvr}|${now}|${DEVICE.tdid}|11ac`;
  return {
    "content-type": "application/json",
    appvr: DEVICE.appvr,
    ch: DEVICE.channel,
    "device-time": now,
    lan: DEVICE.lan,
    loc: DEVICE.loc,
    pf: DEVICE.pf,
    "sign-ver": "1",
    tdid: DEVICE.tdid,
    "x-ss-stub": md5(bodyText),
    "x-ss-dp": DEVICE.aid,
    "x-khronos": now,
    "x-tt-trace-id": traceId(),
    "user-agent": "Cronet/TTNetVersion:1d7cc3b1 2025-07-16 QuicVersion:52c2b40d 2025-04-03",
    "store-country-code": DEVICE.loc.toLowerCase(),
    "store-country-code-src": "did",
    "is-dispatch-us-ttp": "0",
    "is-app-region-us-ttp": "0",
    "app-sdk-version": DEVICE.appvr,
    appid: DEVICE.aid,
    sign: md5(signInput)
  };
}
function commonQuery(includeRegion, babi) {
  const query = {
    app_name: DEVICE.app_name,
    device_type: DEVICE.device_type,
    os_version: DEVICE.os_version,
    channel: DEVICE.channel,
    version_name: DEVICE.version_name,
    device_brand: DEVICE.device_brand,
    device_id: DEVICE.device_id,
    iid: DEVICE.iid,
    version_code: DEVICE.version_code,
    device_platform: DEVICE.device_platform,
    aid: DEVICE.aid
  };
  if (includeRegion) query.region = DEVICE.region;
  if (babi) query.babi_param = JSON.stringify(babi);
  return query;
}
function payloadSignature(ssml, extraInfo) {
  const signInput = `appid:${DEVICE.aid}&did:${DEVICE.device_id}&creditDisable:false&ssml:${md5(ssml)}&extraInfo:${extraInfo}`;
  return crypto.publicEncrypt(
    { key: TTS_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(signInput, "utf8")
  ).toString("base64");
}
function resolveVoice(voiceType, resourceId) {
  const requested = voiceType || "BV074_streaming";
  const voice = catalog.find((item) => item.voice_type === requested && !item.voice_type.includes("Neural"));
  if (!voice) throw new Error("Giọng CapCut không hợp lệ hoặc không được hỗ trợ");
  if (resourceId && resourceId !== voice.resource_id) throw new Error("Mã tài nguyên giọng CapCut không hợp lệ");
  return { voiceType: voice.voice_type, resourceId: voice.resource_id };
}
async function postJson(url, body, signal) {
  const bodyText = JSON.stringify(body);
  const response = await fetch(url, {
    method: "POST",
    headers: baseHeaders(bodyText, url),
    body: bodyText,
    signal
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`CapCut trả về dữ liệu không hợp lệ (HTTP ${response.status})`);
  }
  if (!response.ok) throw new Error(`CapCut HTTP ${response.status}`);
  return data;
}
function buildCreateRequest(text, voiceType, resourceId, rate) {
  const babi = {
    feature_entrance: "editor",
    feature_entrance_detail: "editor-feature-text_to_speech",
    feature_key: "text_to_speech",
    scenario: "video_editor"
  };
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${voiceType}" mock_tone_info="" platform="sami" resource_id="${resourceId}" emotion="" emotion_scale="0" style="" role="" moyin_emotion="" is_clone_tone="false" need_subtitle_timestamp="false">
        <prosody rate="${rate.toFixed(1)}">${escapeXml(text)}</prosody>
    </voice>
</speak>`;
  const extraInfo = JSON.stringify({ benefit_info: {} });
  const payload = {
    audio_format: "mp3",
    babi_param: JSON.stringify(babi),
    credit_disable: false,
    extra_info: extraInfo,
    need_merge_voice: false,
    need_subtitle_timestamp: false,
    scene: "text_to_speech",
    ssml
  };
  payload.sign = payloadSignature(ssml, extraInfo);
  const body = {
    bind_id: crypto.randomUUID(),
    can_queue: true,
    enter_from: "text_to_speech",
    tasks: [{
      context: crypto.randomUUID(),
      payload: JSON.stringify(payload),
      req_key: "sami_text_to_speech",
      task_version: "v3"
    }]
  };
  const query = new URLSearchParams(commonQuery(true, babi)).toString();
  return { url: `${BASE_URL$1}/lv/v1/common_task/new?${query}`, body };
}
function buildQueryRequest(taskId, token2) {
  const body = {
    tasks: [{ bind_id: "", id: taskId, req_key: "sami_text_to_speech", task_version: "v3", token: token2 }]
  };
  const query = new URLSearchParams(commonQuery(false)).toString();
  return { url: `${BASE_URL$1}/lv/v1/common_task/query?${query}`, body };
}
function tasksFrom(response) {
  const data = response.data;
  return data?.tasks || [];
}
async function wait(milliseconds, signal) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}
async function generateChunk(text, voiceType, resourceId, rate, signal) {
  const create = buildCreateRequest(text, voiceType, resourceId, rate);
  const created = await postJson(create.url, create.body, signal);
  const task = tasksFrom(created)[0];
  if (!task?.id || !task?.token) throw new Error("CapCut không tạo được tác vụ giọng nói");
  const started = Date.now();
  while (Date.now() - started < 6e5) {
    await wait(1500, signal);
    const query = buildQueryRequest(String(task.id), String(task.token));
    const result = await postJson(query.url, query.body, signal);
    const current = tasksFrom(result)[0];
    const status = String(current?.status || "");
    if (["failed", "error", "fail"].includes(status)) throw new Error("CapCut không thể tạo giọng đã chọn");
    if (["succeed", "success", "completed", "done", "finish"].includes(status)) {
      const rawPayload = current?.payload;
      const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
      const subtitles = payload?.audio_subtitles;
      const audioUrl = subtitles?.[0]?.speech_url;
      if (!audioUrl) throw new Error("CapCut đã xử lý xong nhưng không trả về đường dẫn audio");
      return audioUrl;
    }
  }
  throw new Error("CapCut phản hồi quá thời gian 600 giây");
}
function splitText$1(text, maxLength = 450) {
  const sentences = text.replace(/\r\n/g, "\n").split(/(?<=[.!?…。！？])\s+|\n+/u).map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      push();
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if (current && `${current} ${word}`.length > maxLength) push();
        current = current ? `${current} ${word}` : word;
      }
      push();
    } else if (!current) {
      current = sentence;
    } else if (`${current} ${sentence}`.length <= maxLength) {
      current += ` ${sentence}`;
    } else {
      push();
      current = sentence;
    }
  }
  push();
  return chunks.length ? chunks : [text];
}
async function downloadFile$2(url, target, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Không thể tải audio CapCut (HTTP ${response.status})`);
  fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
}
async function mergeChunks(jobId, inputs, outputPath) {
  const listPath = path.join(path.dirname(inputs[0]), "concat.txt");
  const list = inputs.map((item) => `file '${item.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, list, "utf8");
  const result = await runFFmpeg({
    jobId,
    args: ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-vn", "-c:a", "pcm_s16le", outputPath]
  });
  if (!result.success) throw new Error(result.canceled ? "Đã hủy tạo giọng" : "Không thể ghép các đoạn audio CapCut");
}
async function generateCapCutTts(payload, emit) {
  const controller = new AbortController();
  activeControllers.set(payload.jobId, controller);
  const safeJobId = payload.jobId.replace(/[^a-zA-Z0-9_-]/g, "");
  const root = outputRoot$4();
  const tempRoot = path.join(root, ".capcut-temp", safeJobId);
  const outputPath = path.join(root, `${safeJobId}.wav`);
  try {
    const voice = resolveVoice(payload.capcutVoiceType, payload.capcutResourceId);
    const chunks = splitText$1(payload.text);
    const rate = Math.min(2, Math.max(0.5, payload.speed || 1));
    fs.mkdirSync(tempRoot, { recursive: true });
    emit({ jobId: payload.jobId, kind: "generate", stage: "chunking", percent: 5, message: `Đã chia văn bản thành ${chunks.length} đoạn` });
    const audioFiles = [];
    for (let index = 0; index < chunks.length; index += 1) {
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const basePercent = 8 + index / chunks.length * 78;
      emit({
        jobId: payload.jobId,
        kind: "generate",
        stage: "generating",
        percent: basePercent,
        message: `CapCut đang tạo đoạn ${index + 1}/${chunks.length}...`
      });
      const url = await generateChunk(chunks[index], voice.voiceType, voice.resourceId, rate, controller.signal);
      const audioPath = path.join(tempRoot, `chunk-${String(index + 1).padStart(3, "0")}.mp3`);
      await downloadFile$2(url, audioPath, controller.signal);
      audioFiles.push(audioPath);
    }
    emit({ jobId: payload.jobId, kind: "generate", stage: "merging", percent: 90, message: "Đang ghép các đoạn audio..." });
    fs.mkdirSync(root, { recursive: true });
    await mergeChunks(payload.jobId, audioFiles, outputPath);
    const durationSec = await probeMediaDuration(outputPath);
    emit({ jobId: payload.jobId, kind: "generate", stage: "saving", percent: 98, message: "Đã lưu audio CapCut" });
    return { success: true, outputPath, durationSec: durationSec || void 0 };
  } catch (error) {
    const canceled = controller.signal.aborted || error instanceof Error && error.name === "AbortError";
    return { success: false, canceled, error: canceled ? "Đã hủy tạo giọng" : error instanceof Error ? error.message : String(error) };
  } finally {
    activeControllers.delete(payload.jobId);
    const resolvedTemp = path.resolve(tempRoot);
    const resolvedParent = path.resolve(path.join(root, ".capcut-temp"));
    if (resolvedTemp.startsWith(`${resolvedParent}${path.sep}`)) {
      fs.rmSync(resolvedTemp, { recursive: true, force: true });
    }
  }
}
function cancelCapCutJob(jobId) {
  const controller = activeControllers.get(jobId);
  controller?.abort();
  const ffmpegCanceled = cancelFFmpeg(jobId);
  return Boolean(controller) || ffmpegCanceled;
}
function cancelAllCapCutJobs() {
  for (const controller of activeControllers.values()) controller.abort();
  activeControllers.clear();
}
const ALLOWED_MODELS$1 = /* @__PURE__ */ new Set(["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"]);
const ALLOWED_VOICES = /* @__PURE__ */ new Set([
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat"
]);
const REQUEST_TIMEOUT_MS = 18e4;
const controllers$1 = /* @__PURE__ */ new Map();
function settingsPath$1() {
  return path.join(electron.app.getPath("userData"), "tts", "gemini-keys.json");
}
function outputRoot$3() {
  return path.join(electron.app.getPath("userData"), "tts", "outputs");
}
function normalizeKeys(keys) {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))].slice(0, 20);
}
function getGeminiApiKeys() {
  const target = settingsPath$1();
  if (!fs.existsSync(target)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(target, "utf8"));
    return (data.encryptedKeys || []).map((value) => electron.safeStorage.decryptString(Buffer.from(value, "base64")));
  } catch {
    return [];
  }
}
function setGeminiApiKeys(keys) {
  const normalized = normalizeKeys(keys);
  if (normalized.length && !electron.safeStorage.isEncryptionAvailable()) {
    throw new Error("Thiết bị chưa hỗ trợ lưu API key an toàn");
  }
  const target = settingsPath$1();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const encryptedKeys = normalized.map((key) => electron.safeStorage.encryptString(key).toString("base64"));
  fs.writeFileSync(target, JSON.stringify({ encryptedKeys }, null, 2), "utf8");
  return { success: true, keyCount: normalized.length };
}
function splitText(text, maxChars = 3500) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxChars) return [normalized];
  const sentences = normalized.split(/(?<=[.!?。！？])\s+|\n+/).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current) chunks.push(current);
      for (let offset = 0; offset < sentence.length; offset += maxChars) chunks.push(sentence.slice(offset, offset + maxChars));
      current = "";
    } else if (!current || current.length + sentence.length + 1 <= maxChars) {
      current = current ? `${current} ${sentence}` : sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
function wavBuffer(pcm, sampleRate = 24e3) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
function apiErrorMessage(status, body) {
  const message = typeof body === "object" && body && "error" in body ? String(body.error?.message || "") : "";
  if (status === 429) return `Gemini đã đạt giới hạn sử dụng${message ? `: ${message}` : ""}`;
  if (status === 401 || status === 403) return `Gemini API key không hợp lệ hoặc chưa có quyền dùng TTS${message ? `: ${message}` : ""}`;
  return `Gemini API lỗi HTTP ${status}${message ? `: ${message}` : ""}`;
}
async function requestAudio(payload, text, keys, controller, emit, chunkIndex, chunkCount) {
  const temperature = Math.min(2, Math.max(0, Number.isFinite(payload.temperature) ? payload.temperature : 1));
  let lastError;
  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    if (controller.signal.aborted) throw new DOMException("Đã hủy tạo giọng", "AbortError");
    const key = keys[attempt];
    const requestController = new AbortController();
    let timedOut = false;
    const abortRequest = () => requestController.abort(controller.signal.reason);
    controller.signal.addEventListener("abort", abortRequest, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      requestController.abort();
    }, REQUEST_TIMEOUT_MS);
    const startPercent = 8 + Math.round((chunkIndex + 0.05) / chunkCount * 84);
    emit({
      jobId: payload.jobId,
      kind: "generate",
      stage: "generating",
      percent: startPercent,
      message: `Đã gửi đoạn ${chunkIndex + 1}/${chunkCount} tới Gemini · đang chờ tạo audio${keys.length > 1 ? ` · API ${attempt + 1}/${keys.length}` : ""}`
    });
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(payload.modelId)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: requestController.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: payload.style?.trim() ? `${payload.style.trim()}

${text}` : text }] }],
          generationConfig: {
            temperature,
            responseModalities: ["AUDIO"],
            speechConfig: {
              languageCode: payload.language || "vi-VN",
              voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voiceName || "Puck" } }
            }
          }
        })
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        const candidate = body.candidates?.[0];
        const base64 = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
        if (base64) {
          const audio = Buffer.from(base64, "base64");
          if (audio.length > 0) {
            const receivedPercent = 8 + Math.round((chunkIndex + 0.9) / chunkCount * 84);
            emit({ jobId: payload.jobId, kind: "generate", stage: "generating", percent: receivedPercent, message: `Đã nhận audio đoạn ${chunkIndex + 1}/${chunkCount}` });
            return audio;
          }
        }
        lastError = new Error(`Gemini đã phản hồi nhưng không có audio${candidate?.finishReason ? ` (lý do: ${candidate.finishReason})` : ""}`);
        if (attempt + 1 < keys.length) continue;
        throw lastError;
      }
      lastError = new Error(apiErrorMessage(response.status, body));
      if (![429, 500, 503].includes(response.status) || attempt + 1 >= keys.length) throw lastError;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      if (timedOut) {
        lastError = new Error(`Gemini không phản hồi sau ${REQUEST_TIMEOUT_MS / 1e3} giây${keys.length > 1 ? ` với API ${attempt + 1}` : ""}`);
        if (attempt + 1 < keys.length) continue;
        throw lastError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      controller.signal.removeEventListener("abort", abortRequest);
    }
  }
  throw lastError || new Error("Không thể kết nối Gemini TTS");
}
async function generateGeminiTts(payload, emit) {
  if (!ALLOWED_MODELS$1.has(payload.modelId)) return { success: false, error: "Model Gemini TTS không được hỗ trợ" };
  if (!ALLOWED_VOICES.has(payload.voiceName || "Puck")) return { success: false, error: "Giọng Gemini không được hỗ trợ" };
  const keys = getGeminiApiKeys();
  if (!keys.length) return { success: false, error: "Chưa có Gemini API key. Hãy thêm key trong Cài đặt." };
  const controller = new AbortController();
  controllers$1.set(payload.jobId, controller);
  try {
    const chunks = splitText(payload.text);
    const pcmParts = [];
    emit({ jobId: payload.jobId, kind: "generate", stage: "chunking", percent: 5, message: chunks.length === 1 ? "Văn bản được gửi trong một lượt" : `Đã chia thành ${chunks.length} đoạn` });
    for (let index = 0; index < chunks.length; index += 1) {
      pcmParts.push(await requestAudio(payload, chunks[index], keys, controller, emit, index, chunks.length));
    }
    const pcm = Buffer.concat(pcmParts);
    emit({ jobId: payload.jobId, kind: "generate", stage: "saving", percent: 96, message: "Đang lưu audio Gemini..." });
    fs.mkdirSync(outputRoot$3(), { recursive: true });
    const outputPath = path.join(outputRoot$3(), `${payload.jobId}.wav`);
    fs.writeFileSync(outputPath, wavBuffer(pcm));
    emit({ jobId: payload.jobId, kind: "generate", stage: "saving", percent: 100, message: "Đã lưu audio Gemini" });
    return { success: true, outputPath, sampleRate: 24e3, durationSec: pcm.length / 2 / 24e3 };
  } catch (error) {
    const canceled = controller.signal.aborted;
    return { success: false, canceled, error: canceled ? "Đã hủy tạo giọng" : error instanceof Error ? error.message : String(error) };
  } finally {
    controllers$1.delete(payload.jobId);
  }
}
function cancelGeminiJob(jobId) {
  const controller = controllers$1.get(jobId);
  if (!controller) return false;
  controller.abort();
  controllers$1.delete(jobId);
  return true;
}
function cancelAllGeminiJobs() {
  for (const controller of controllers$1.values()) controller.abort();
  controllers$1.clear();
}
const BASE_URL = "https://vbee.vn/api/v1/tts";
const VOICES_URL = "https://vbee.vn/api/public/v1/voices";
const controllers = /* @__PURE__ */ new Map();
let voicesCache;
function settingsPath() {
  return path.join(electron.app.getPath("userData"), "tts", "vbee-credentials.json");
}
function outputRoot$2() {
  return path.join(electron.app.getPath("userData"), "tts", "outputs");
}
function voicesCachePath() {
  return path.join(electron.app.getPath("userData"), "tts", "vbee-voices.json");
}
function accountCacheKey(appId) {
  return crypto.createHash("sha256").update(appId).digest("hex");
}
function readVoicesCache(key) {
  try {
    const data = JSON.parse(fs.readFileSync(voicesCachePath(), "utf8"));
    if (data.version !== 1 || data.accountKey !== key || !Array.isArray(data.voices)) return void 0;
    return { key, at: Number(data.updatedAt) || 0, voices: data.voices };
  } catch {
    return void 0;
  }
}
function writeVoicesCache(cache) {
  const target = voicesCachePath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const data = {
    version: 1,
    accountKey: cache.key,
    updatedAt: cache.at,
    voices: cache.voices
  };
  fs.writeFileSync(target, JSON.stringify(data), "utf8");
}
function decodeJwtExpiry(token2) {
  try {
    const payload = token2.split(".")[1];
    if (!payload) return void 0;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(parsed.exp) ? Number(parsed.exp) * 1e3 : void 0;
  } catch {
    return void 0;
  }
}
function getVbeeCredentials() {
  const target = settingsPath();
  if (!fs.existsSync(target)) return { appId: "", token: "" };
  try {
    const data = JSON.parse(fs.readFileSync(target, "utf8"));
    const appId = electron.safeStorage.decryptString(Buffer.from(data.encryptedAppId, "base64"));
    const token2 = electron.safeStorage.decryptString(Buffer.from(data.encryptedToken, "base64"));
    return { appId, token: token2, expiresAt: decodeJwtExpiry(token2) };
  } catch {
    return { appId: "", token: "" };
  }
}
function setVbeeCredentials(input) {
  const appId = String(input.appId || "").trim();
  const token2 = String(input.token || "").trim();
  voicesCache = void 0;
  if ((appId || token2) && (!appId || !token2)) throw new Error("Vui lòng nhập đủ App ID và Token Vbee");
  if ((appId || token2) && !electron.safeStorage.isEncryptionAvailable()) {
    throw new Error("Thiết bị chưa hỗ trợ lưu thông tin Vbee an toàn");
  }
  const target = settingsPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!appId && !token2) {
    fs.rmSync(target, { force: true });
    return { success: true, configured: false };
  }
  const data = {
    encryptedAppId: electron.safeStorage.encryptString(appId).toString("base64"),
    encryptedToken: electron.safeStorage.encryptString(token2).toString("base64")
  };
  fs.writeFileSync(target, JSON.stringify(data, null, 2), "utf8");
  return { success: true, configured: true, expiresAt: decodeJwtExpiry(token2) };
}
async function fetchVoiceOwnership(credentials, ownership) {
  const voices = [];
  let cursor = "";
  for (let page = 0; page < 30; page += 1) {
    const url = new URL(VOICES_URL);
    url.searchParams.set("voiceOwnership", ownership);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, {
      headers: {
        "app-id": credentials.appId,
        Authorization: `Bearer ${credentials.token}`,
        Accept: "application/json"
      }
    });
    const body = await readJson(response);
    if (!response.ok) throw new Error(apiError(response.status, body));
    if (body.status === 0) throw new Error(body.error_message || "Không thể lấy danh sách giọng Vbee");
    for (const voice of body.result?.voices || []) {
      if (!voice.code || !voice.name) continue;
      voices.push({
        code: voice.code,
        name: voice.name,
        gender: voice.gender || "",
        languageCode: voice.language_code || "",
        demo: voice.demo,
        creditFactor: voice.credit_factor,
        ownership
      });
    }
    const pagination = body.result?.pagination;
    if (!pagination?.has_next_page || !pagination.next_cursor) break;
    cursor = pagination.next_cursor;
  }
  return voices;
}
async function getVbeeVoices(force = false) {
  const credentials = getVbeeCredentials();
  if (!credentials.appId || !credentials.token) return { success: false, voices: [], error: "Chưa nhập App ID và Token Vbee." };
  const cacheKey2 = accountCacheKey(credentials.appId);
  if (!force) {
    const cached = voicesCache?.key === cacheKey2 ? voicesCache : readVoicesCache(cacheKey2);
    if (cached?.voices.length) {
      voicesCache = cached;
      return { success: true, voices: cached.voices, updatedAt: cached.at };
    }
  }
  try {
    const groups = await Promise.all(["VBEE", "PERSONAL", "COMMUNITY"].map((ownership) => fetchVoiceOwnership(credentials, ownership).catch((error) => {
      if (ownership === "VBEE") throw error;
      return [];
    })));
    const unique = /* @__PURE__ */ new Map();
    for (const voice of groups.flat()) if (!unique.has(voice.code)) unique.set(voice.code, voice);
    const voices = [...unique.values()].sort((left, right) => left.languageCode.localeCompare(right.languageCode) || left.name.localeCompare(right.name));
    voicesCache = { key: cacheKey2, at: Date.now(), voices };
    writeVoicesCache(voicesCache);
    return { success: true, voices, updatedAt: voicesCache.at };
  } catch (error) {
    return { success: false, voices: [], error: error instanceof Error ? error.message : String(error) };
  }
}
function findString(value, keys, depth = 0) {
  if (depth > 6 || value === null || value === void 0) return void 0;
  if (typeof value === "string") {
    if (keys.includes("$value") && /^https:\/\//i.test(value)) return value;
    return void 0;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item, keys, depth + 1);
      if (found) return found;
    }
    return void 0;
  }
  if (typeof value !== "object") return void 0;
  const record = value;
  for (const key of keys) {
    const item = record[key];
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  for (const item of Object.values(record)) {
    const found = findString(item, keys, depth + 1);
    if (found) return found;
  }
  return void 0;
}
function findNumber(value, keys, depth = 0) {
  if (depth > 6 || value === null || value === void 0 || typeof value !== "object") return void 0;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNumber(item, keys, depth + 1);
      if (found !== void 0) return found;
    }
    return void 0;
  }
  const record = value;
  for (const key of keys) {
    const item = record[key];
    if (typeof item === "number" && Number.isFinite(item)) return item;
  }
  for (const item of Object.values(record)) {
    const found = findNumber(item, keys, depth + 1);
    if (found !== void 0) return found;
  }
  return void 0;
}
function responseError(body) {
  if (!body || typeof body !== "object") return "";
  const record = body;
  const statusFailed = record.status === 0 || record.success === false;
  const message = findString(body, ["error_message", "message", "error", "detail"]);
  return statusFailed ? message || "Vbee từ chối yêu cầu" : "";
}
async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}
function apiError(status, body) {
  const detail = responseError(body) || findString(body, ["error_message", "message", "error", "detail"]) || "";
  if (status === 401 || status === 403) return `App ID hoặc Token Vbee không hợp lệ, hết hạn hoặc chưa được cấp quyền API${detail ? `: ${detail}` : ""}`;
  if (status === 429) return `Vbee đang giới hạn số yêu cầu hoặc tài khoản đã hết hạn mức${detail ? `: ${detail}` : ""}`;
  if (/callback/i.test(detail)) return `Gói Vbee này đang bắt buộc Callback URL và chưa hỗ trợ nhận kết quả trực tiếp: ${detail}`;
  return `Vbee API lỗi HTTP ${status}${detail ? `: ${detail}` : ""}`;
}
async function pollResult(requestId, token2, controller, payload, emit) {
  const startedAt = Date.now();
  const timeoutMs = 15 * 60 * 1e3;
  let attempt = 0;
  while (Date.now() - startedAt < timeoutMs) {
    if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 2500);
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
    attempt += 1;
    const elapsedRatio = Math.min(1, (Date.now() - startedAt) / timeoutMs);
    emit({
      jobId: payload.jobId,
      kind: "generate",
      stage: "vbee-processing",
      percent: Math.round(18 + elapsedRatio * 58),
      message: `Vbee đang xử lý audio... (${attempt})`
    });
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${token2}`, Accept: "application/json" },
      signal: controller.signal
    });
    const body = await readJson(response);
    if (!response.ok) {
      if ([404, 409, 425].includes(response.status)) continue;
      throw new Error(apiError(response.status, body));
    }
    const failed = responseError(body);
    if (failed && !/pending|processing|wait|đang xử lý/i.test(failed)) throw new Error(failed);
    const taskStatus = findString(body, ["status"])?.toUpperCase();
    if (taskStatus === "FAILURE" || taskStatus === "FAILED" || taskStatus === "ERROR") {
      throw new Error(findString(body, ["error_message", "message", "error", "detail"]) || "Vbee không thể tạo audio");
    }
    const remoteProgress = findNumber(body, ["progress"]);
    if (remoteProgress !== void 0) {
      emit({
        jobId: payload.jobId,
        kind: "generate",
        stage: "vbee-processing",
        percent: Math.min(78, Math.max(18, Math.round(18 + remoteProgress * 0.6))),
        message: `Vbee đang tạo giọng... ${Math.round(remoteProgress)}%`
      });
    }
    const audioLink = findString(body, ["audio_link", "audio_url", "file_url", "url"]);
    if (audioLink && /^https:\/\//i.test(audioLink)) return audioLink;
  }
  throw new Error("Vbee xử lý quá 15 phút. Hãy kiểm tra lại tác vụ trong tài khoản Vbee.");
}
async function downloadAudio(url, destination, controller, payload, emit) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Vbee trả về đường dẫn audio không an toàn");
  emit({ jobId: payload.jobId, kind: "generate", stage: "vbee-downloading", percent: 82, message: "Đang tải audio Vbee về máy..." });
  const response = await fetch(parsed, { signal: controller.signal, redirect: "follow" });
  if (!response.ok) throw new Error(`Không thể tải audio Vbee (HTTP ${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error("File audio Vbee trả về bị rỗng");
  fs.writeFileSync(destination, bytes);
}
async function generateVbeeTts(payload, emit) {
  const credentials = getVbeeCredentials();
  if (!credentials.appId || !credentials.token) return { success: false, error: "Chưa nhập App ID và Token Vbee trong Cài đặt." };
  if (credentials.expiresAt && credentials.expiresAt <= Date.now()) return { success: false, error: "Token Vbee đã hết hạn. Hãy tạo hoặc nhập Token mới." };
  const voiceCode = String(payload.voiceCode || "").trim();
  if (!voiceCode) return { success: false, error: "Hãy nhập mã giọng Vbee." };
  if (!/^[a-zA-Z0-9_.-]{2,200}$/.test(voiceCode)) return { success: false, error: "Mã giọng Vbee không hợp lệ." };
  const audioType = payload.audioType === "wav" ? "wav" : "mp3";
  const bitrate = [8, 16, 32, 64, 128].includes(Number(payload.bitrate)) ? Number(payload.bitrate) : 128;
  const speed = Math.round(Math.min(1.9, Math.max(0.1, Number(payload.speed) || 1)) * 10) / 10;
  const controller = new AbortController();
  const requestStartedAt = Date.now();
  let timedOut = false;
  const requestProgressTimer = setInterval(() => {
    const elapsedSec = Math.round((Date.now() - requestStartedAt) / 1e3);
    const percent = Math.min(70, 10 + Math.round(elapsedSec / 12));
    emit({
      jobId: payload.jobId,
      kind: "generate",
      stage: "vbee-processing",
      percent,
      message: `Vbee đang tạo giọng... (${elapsedSec} giây)`
    });
  }, 3e3);
  const requestTimeoutTimer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15 * 60 * 1e3);
  controllers.set(payload.jobId, controller);
  try {
    emit({ jobId: payload.jobId, kind: "generate", stage: "vbee-submitting", percent: 6, message: "Đang gửi văn bản tới Vbee..." });
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        app_id: credentials.appId,
        response_type: "indirect",
        callback_url: "https://vbee.vn/api/v1/tts/callback-disabled",
        input_text: payload.text,
        voice_code: voiceCode,
        audio_type: audioType,
        bitrate,
        speed_rate: speed
      })
    });
    const body = await readJson(response);
    clearInterval(requestProgressTimer);
    clearTimeout(requestTimeoutTimer);
    if (!response.ok) throw new Error(apiError(response.status, body));
    const failed = responseError(body);
    if (failed) throw new Error(failed);
    let audioLink = findString(body, ["audio_link", "audio_url", "file_url", "url"]);
    if (!audioLink) {
      const requestId = findString(body, ["request_id", "requestId", "id"]);
      if (!requestId) throw new Error("Vbee không trả về đường dẫn audio hoặc mã yêu cầu.");
      emit({ jobId: payload.jobId, kind: "generate", stage: "vbee-processing", percent: 16, message: "Vbee đã nhận yêu cầu và đang tạo giọng..." });
      audioLink = await pollResult(requestId, credentials.token, controller, payload, emit);
    }
    fs.mkdirSync(outputRoot$2(), { recursive: true });
    const outputPath = path.join(outputRoot$2(), `${payload.jobId}.${audioType}`);
    await downloadAudio(audioLink, outputPath, controller, payload, emit);
    emit({ jobId: payload.jobId, kind: "generate", stage: "saving", percent: 96, message: "Đang lưu audio Vbee..." });
    const durationSec = await probeMediaDuration(outputPath);
    emit({ jobId: payload.jobId, kind: "generate", stage: "vbee-done", percent: 100, message: "Đã tạo xong audio Vbee" });
    return { success: true, outputPath, durationSec: durationSec || void 0 };
  } catch (error) {
    const canceled = controller.signal.aborted && !timedOut;
    return {
      success: false,
      canceled,
      error: timedOut ? "Vbee xử lý quá 15 phút. Hãy kiểm tra tác vụ trong tài khoản Vbee." : canceled ? "Đã hủy tạo giọng Vbee" : error instanceof Error ? error.message : String(error)
    };
  } finally {
    clearInterval(requestProgressTimer);
    clearTimeout(requestTimeoutTimer);
    controllers.delete(payload.jobId);
  }
}
function cancelVbeeJob(jobId) {
  const controller = controllers.get(jobId);
  if (!controller) return false;
  controller.abort();
  controllers.delete(jobId);
  return true;
}
function cancelAllVbeeJobs() {
  for (const controller of controllers.values()) controller.abort();
  controllers.clear();
}
const UV_VERSION = "0.12.3";
const UV_ASSETS = {
  "darwin-arm64": { file: "uv-aarch64-apple-darwin.tar.gz", sha256: "546f7f8a6c70ff13a3a9d2bc958db3427298cebf3e0cb756f9177133b7068843" },
  "darwin-x64": { file: "uv-x86_64-apple-darwin.tar.gz", sha256: "4c9f52262a14da336e4a42ed24992d12d0c956acde87619e4611d321dffa602b" },
  "win32-x64": { file: "uv-x86_64-pc-windows-msvc.zip", sha256: "b23350c79e8ad0192b8124af13a0f17e8d4e4549524785e1aef389ae5a06990e" },
  "win32-arm64": { file: "uv-aarch64-pc-windows-msvc.zip", sha256: "4343217d668727b8a8eb5cad92389a1d2eeead93c89940d1b955ba1bb15462eb" },
  "linux-x64": { file: "uv-x86_64-unknown-linux-gnu.tar.gz", sha256: "600cf9a742aca00d292673b16b5acffaa7b8c269a364ad0c2e79498dcb1fe101" },
  "linux-arm64": { file: "uv-aarch64-unknown-linux-gnu.tar.gz", sha256: "bb66cb52e7b1823aed1183630d8d8e5c958840d584a4c55ec10a4cfc168dcca2" }
};
function managedRoot() {
  return path.join(electron.app.getPath("userData"), "runtimes", "managed-python");
}
function uvRoot() {
  return path.join(managedRoot(), "uv");
}
function pythonRoot() {
  return path.join(managedRoot(), "python");
}
function cacheRoot() {
  return path.join(managedRoot(), "cache");
}
function run$2(command, args, env2) {
  return new Promise((resolve) => {
    let output = "";
    let settled = false;
    const child = node_child_process.spawn(command, args, { windowsHide: true, env: { ...process.env, ...env2 } });
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("error", (error) => {
      if (!settled) resolve({ ok: false, output: `${output}
${error.message}` });
      settled = true;
    });
    child.on("close", (code) => {
      if (!settled) resolve({ ok: code === 0, output });
      settled = true;
    });
  });
}
function download$1(url, destination, redirects = 0) {
  if (redirects > 6) return Promise.reject(new Error("Quá nhiều chuyển hướng khi tải Python runtime"));
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url);
        if (next.protocol !== "https:") return reject(new Error("Nguồn Python runtime không an toàn"));
        return download$1(next.toString(), destination, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`Không thể tải Python runtime (HTTP ${response.statusCode})`));
      }
      const stream = fs.createWriteStream(destination);
      response.pipe(stream);
      stream.on("finish", () => stream.close(() => resolve()));
      stream.on("error", reject);
    });
    request.on("error", reject);
  });
}
function findFile(root, filename) {
  if (!fs.existsSync(root)) return null;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) return candidate;
    if (entry.isDirectory()) {
      const nested = findFile(candidate, filename);
      if (nested) return nested;
    }
  }
  return null;
}
function findManagedPython() {
  return findFile(pythonRoot(), process.platform === "win32" ? "python.exe" : "python3.12") || findFile(pythonRoot(), process.platform === "win32" ? "python.exe" : "python3");
}
async function ensureUv(progress) {
  const existing = findFile(uvRoot(), process.platform === "win32" ? "uv.exe" : "uv");
  if (existing) return existing;
  const asset = UV_ASSETS[`${process.platform}-${process.arch}`];
  if (!asset) throw new Error(`Chưa hỗ trợ Python tự động cho ${process.platform}/${process.arch}`);
  fs.mkdirSync(uvRoot(), { recursive: true });
  const archive = path.join(managedRoot(), asset.file);
  progress("runtime.python.download", 3, "Đang tải trình quản lý Python...");
  await download$1(`https://releases.astral.sh/github/uv/releases/download/${UV_VERSION}/${asset.file}`, archive);
  const digest = crypto.createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
  if (digest !== asset.sha256) {
    fs.rmSync(archive, { force: true });
    throw new Error("Python bootstrap không vượt qua kiểm tra toàn vẹn SHA-256");
  }
  progress("runtime.python.install", 6, "Đang giải nén trình quản lý Python...");
  const extracted = process.platform === "win32" ? await run$2("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Expand-Archive", "-LiteralPath", archive, "-DestinationPath", uvRoot(), "-Force"]) : await run$2("tar", ["-xzf", archive, "-C", uvRoot()]);
  fs.rmSync(archive, { force: true });
  if (!extracted.ok) throw new Error(extracted.output || "Không thể giải nén Python bootstrap");
  const executable = findFile(uvRoot(), process.platform === "win32" ? "uv.exe" : "uv");
  if (!executable) throw new Error("Không tìm thấy uv sau khi giải nén");
  if (process.platform !== "win32") fs.chmodSync(executable, 493);
  return executable;
}
async function ensureManagedPython(progress) {
  const existing = findManagedPython();
  if (existing) return existing;
  const uv = await ensureUv(progress);
  fs.mkdirSync(pythonRoot(), { recursive: true });
  fs.mkdirSync(cacheRoot(), { recursive: true });
  progress("runtime.python.download", 7, "Đang tải Python 3.12 phù hợp với thiết bị...");
  const managedEnv = {
    UV_PYTHON_INSTALL_DIR: pythonRoot(),
    UV_CACHE_DIR: cacheRoot(),
    UV_NO_PROGRESS: "1"
  };
  const installed = await run$2(uv, ["python", "install", "3.12", "--install-dir", pythonRoot(), "--no-bin", "--managed-python", "--no-config"], managedEnv);
  if (!installed.ok) throw new Error(installed.output || "Không thể cài Python 3.12 tự động");
  const executable = findManagedPython();
  if (!executable) throw new Error("Đã tải Python 3.12 nhưng không tìm thấy interpreter");
  const verified = await run$2(executable, ["-c", "import sys; assert sys.version_info[:2] == (3, 12); print(sys.version)"]);
  if (!verified.ok) throw new Error("Python runtime tải về không hợp lệ");
  progress("runtime.python.install", 9, "Python 3.12 đã sẵn sàng");
  return executable;
}
const jobs$2 = /* @__PURE__ */ new Map();
const RUNTIME_VERSION$1 = 1;
function runtimeRoot$2() {
  return path.join(electron.app.getPath("userData"), "runtimes", "vieneu");
}
function modelRoot$1() {
  return path.join(electron.app.getPath("userData"), "models", "vieneu", "vieneu-v3-turbo");
}
function markerPath() {
  return path.join(modelRoot$1(), ".model-ready");
}
function venvPython$1() {
  return process.platform === "win32" ? path.join(runtimeRoot$2(), ".venv", "Scripts", "python.exe") : path.join(runtimeRoot$2(), ".venv", "bin", "python");
}
function workerPath$1() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "tts-worker", "vieneu_worker.py") : path.join(process.env.APP_ROOT || process.cwd(), "electron", "features", "tts-voice", "python", "vieneu_worker.py");
}
function outputRoot$1() {
  return path.join(electron.app.getPath("userData"), "tts", "outputs");
}
function env() {
  return { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", HF_HOME: path.join(modelRoot$1(), "huggingface") };
}
function spawnCapture$2(command, args) {
  return new Promise((resolve) => {
    let output = "";
    const child = node_child_process.spawn(command, args, { windowsHide: true, env: env() });
    child.stdout.on("data", (chunk) => {
      output += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk);
    });
    child.on("error", () => resolve({ ok: false, output }));
    child.on("close", (code) => resolve({ ok: code === 0, output }));
  });
}
async function findPython() {
  const candidates = process.platform === "win32" ? [{ command: "py", args: ["-3.12"] }, { command: "py", args: ["-3"] }, { command: "python", args: [] }] : [{ command: "python3", args: [] }, { command: "python", args: [] }];
  for (const candidate of candidates) {
    const result = await spawnCapture$2(candidate.command, [...candidate.args, "-c", "import sys; print(int(sys.version_info >= (3, 10)))"]);
    if (result.ok && result.output.trim().split(/\r?\n/).at(-1) === "1") return candidate;
  }
  return null;
}
async function isCompatiblePython$1(command) {
  if (!fs.existsSync(command)) return false;
  const result = await spawnCapture$2(command, ["-c", "import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))"]);
  return result.ok && result.output.trim().split(/\r?\n/).at(-1) === "1";
}
function run$1(jobId, kind, request, emit) {
  return new Promise((resolve, reject) => {
    const child = node_child_process.spawn(venvPython$1(), ["-X", "utf8", workerPath$1()], { windowsHide: true, env: env() });
    jobs$2.set(jobId, child);
    let stderr = "";
    let buffer = "";
    let result;
    child.stdout.on("data", (chunk) => {
      buffer += String(chunk);
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          if (message.type === "progress") emit({ jobId, kind, stage: String(message.stage || "default"), percent: Number(message.percent), message: String(message.message || "") });
          if (message.type === "result") result = message;
        } catch {
          stderr += `${line}
`;
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      jobs$2.delete(jobId);
      if (result) resolve(result);
      else reject(new Error(stderr.trim() || `VieNeu worker kết thúc với mã ${code}`));
    });
    child.stdin.end(`${JSON.stringify(request)}
`);
  });
}
async function getVieneuStatus() {
  const pythonAvailable = true;
  const ready = fs.existsSync(markerPath()) && fs.existsSync(venvPython$1());
  return {
    modelId: "vieneu-v3-turbo",
    status: ready ? "ready" : "not-installed",
    installedPath: ready ? modelRoot$1() : void 0,
    runtimeReady: ready,
    pythonAvailable,
    accelerator: "cpu",
    messageKey: ready ? void 0 : "tts.runtime.pythonAutoInstall"
  };
}
async function installVieneu(jobId, emit) {
  let python = await findPython();
  if (!python) {
    const command = await ensureManagedPython((stage, percent, message) => emit({ jobId, kind: "install", stage, percent, message }));
    python = { command, args: [] };
  }
  fs.mkdirSync(runtimeRoot$2(), { recursive: true });
  fs.mkdirSync(modelRoot$1(), { recursive: true });
  if (fs.existsSync(venvPython$1()) && !await isCompatiblePython$1(venvPython$1())) {
    emit({ jobId, kind: "install", stage: "runtime.venv", percent: 2, message: "Đang thay runtime Python cũ bằng Python 3.12..." });
    fs.rmSync(path.join(runtimeRoot$2(), ".venv"), { recursive: true, force: true });
  }
  emit({ jobId, kind: "install", stage: "runtime.venv", percent: 5, message: "Đang tạo môi trường VieNeu riêng..." });
  let step = await spawnCapture$2(python.command, [...python.args, "-m", "venv", path.join(runtimeRoot$2(), ".venv")]);
  if (!step.ok) throw new Error(step.output || "Không thể tạo VieNeu runtime");
  emit({ jobId, kind: "install", stage: "runtime.pip", percent: 15, message: "Đang cập nhật pip..." });
  step = await spawnCapture$2(venvPython$1(), ["-m", "pip", "install", "--upgrade", "pip"]);
  if (!step.ok) throw new Error(step.output || "Không thể cập nhật pip");
  emit({ jobId, kind: "install", stage: "runtime.dependencies", percent: 25, message: "Đang cài VieNeu CPU/ONNX..." });
  step = await spawnCapture$2(venvPython$1(), ["-m", "pip", "install", "vieneu==3.2.4"]);
  if (!step.ok) throw new Error(step.output || "Không thể cài package vieneu");
  emit({ jobId, kind: "install", stage: "model.download", percent: 65, message: "Đang tải VieNeu v3 Turbo..." });
  const prepared = await run$1(jobId, "install", { command: "prepare" }, emit);
  if (!prepared.success) throw new Error(String(prepared.error || "Không thể chuẩn bị VieNeu"));
  fs.writeFileSync(markerPath(), JSON.stringify({ version: RUNTIME_VERSION$1, installedAt: Date.now() }), "utf8");
  emit({ jobId, kind: "install", stage: "done", percent: 100, message: "VieNeu đã sẵn sàng" });
  return { success: true };
}
async function removeVieneu() {
  await fs.promises.rm(modelRoot$1(), { recursive: true, force: true });
  await fs.promises.rm(runtimeRoot$2(), { recursive: true, force: true });
  return { success: true };
}
async function listVieneuVoices() {
  if (!fs.existsSync(markerPath())) return [];
  const result = await run$1(`voices-${Date.now()}`, "generate", { command: "voices" }, () => {
  });
  return Array.isArray(result.voices) ? result.voices : [];
}
async function generateVieneu(input, emit) {
  if (!fs.existsSync(markerPath())) return { success: false, error: "Model VieNeu chưa được cài đặt" };
  const outputPath = path.join(outputRoot$1(), `${input.jobId}.wav`);
  fs.mkdirSync(outputRoot$1(), { recursive: true });
  const result = await run$1(input.jobId, "generate", { command: "generate", outputPath, ...input }, emit);
  if (!result.success) return { success: false, error: String(result.error || "VieNeu không thể tạo audio") };
  return { success: true, outputPath, sampleRate: 48e3, durationSec: await probeMediaDuration(outputPath) };
}
function cancelVieneu(jobId) {
  const child = jobs$2.get(jobId);
  if (!child) return false;
  child.kill();
  jobs$2.delete(jobId);
  return true;
}
const jobs$1 = /* @__PURE__ */ new Map();
const downloadControllers = /* @__PURE__ */ new Map();
const canceledJobs = /* @__PURE__ */ new Set();
const RUNTIME_VERSION = 2;
const TORCH_VERSION = "2.8.0";
const TORCH_CUDA_INDEX = "https://download.pytorch.org/whl/cu128";
const ALLOWED_MODELS = /* @__PURE__ */ new Map([
  ["omnivoice-main", { repository: "k2-fsa/OmniVoice", capability: "omnivoice" }],
  ["vieneu-v3-turbo", { repository: "pnnbao97/VieNeu-TTS", capability: "vieneu" }]
]);
function assertAllowedModel(model) {
  const allowed = ALLOWED_MODELS.get(model.id);
  if (!allowed || allowed.repository !== model.repository || allowed.capability !== model.capability) {
    throw new Error("Model TTS không được phép");
  }
}
function runtimeRoot$1() {
  return path.join(electron.app.getPath("userData"), "runtimes", "omnivoice");
}
function modelRoot() {
  return path.join(electron.app.getPath("userData"), "models", "omnivoice");
}
function outputRoot() {
  return path.join(electron.app.getPath("userData"), "tts", "outputs");
}
function voicePromptRoot() {
  return path.join(electron.app.getPath("userData"), "tts", "voices", "omnivoice");
}
function sourceRoot() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "omnivoice-package") : path.join(process.env.APP_ROOT || process.cwd(), "electron", "features", "tts-voice", "vendor", "omnivoice");
}
function workerPath() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "tts-worker", "omnivoice_worker.py") : path.join(process.env.APP_ROOT || process.cwd(), "electron", "features", "tts-voice", "python", "omnivoice_worker.py");
}
function venvPython() {
  return process.platform === "win32" ? path.join(runtimeRoot$1(), ".venv", "Scripts", "python.exe") : path.join(runtimeRoot$1(), ".venv", "bin", "python");
}
function bundledPython$1() {
  return process.platform === "win32" ? path.join(runtimeRoot$1(), "python", "python.exe") : "";
}
function legacyQwenPython() {
  return process.platform === "win32" ? path.join(electron.app.getPath("userData"), "runtimes", "qwen-tts", "python", "python.exe") : "";
}
function runtimeMarker() {
  return path.join(runtimeRoot$1(), ".runtime-ready");
}
function modelPath(modelId) {
  return path.join(modelRoot(), modelId);
}
function readRuntimeMarker() {
  try {
    return JSON.parse(fs.readFileSync(runtimeMarker(), "utf8"));
  } catch {
    return {};
  }
}
function sourceVersion() {
  try {
    const pyproject = fs.readFileSync(path.join(sourceRoot(), "pyproject.toml"), "utf8");
    return pyproject.match(/^version\s*=\s*["']([^"']+)["']/m)?.[1] || "unknown";
  } catch {
    return "unknown";
  }
}
function isRuntimeCurrent() {
  const marker = readRuntimeMarker();
  if ((marker.version || 0) < RUNTIME_VERSION) return false;
  const currentSourceVersion = sourceVersion();
  if (!marker.sourceVersion && fs.existsSync(runtimeMarker())) {
    fs.writeFileSync(runtimeMarker(), JSON.stringify({ ...marker, sourceVersion: currentSourceVersion }, null, 2), "utf8");
    return true;
  }
  return marker.sourceVersion === currentSourceVersion;
}
function isInstalled(modelId) {
  return fs.existsSync(path.join(modelPath(modelId), ".model-ready"));
}
function utf8Environment$1() {
  const delimiter = process.platform === "win32" ? ";" : ":";
  const ffmpegPath = getFFmpegPath();
  return {
    ...process.env,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
    PYTORCH_ENABLE_MPS_FALLBACK: "1",
    PYTHONPATH: [sourceRoot(), process.env.PYTHONPATH].filter(Boolean).join(delimiter),
    FFMPEG_BINARY: ffmpegPath,
    IMAGEIO_FFMPEG_EXE: ffmpegPath,
    PATH: [path.dirname(ffmpegPath), process.env.PATH].filter(Boolean).join(delimiter)
  };
}
function spawnCapture$1(command, args) {
  return new Promise((resolve) => {
    let output = "";
    let settled = false;
    try {
      const child = node_child_process.spawn(command, args, { windowsHide: true, env: utf8Environment$1() });
      child.stdout.on("data", (chunk) => {
        output += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        output += String(chunk);
      });
      child.on("error", () => {
        if (!settled) resolve({ ok: false, output });
        settled = true;
      });
      child.on("close", (code) => {
        if (!settled) resolve({ ok: code === 0, output });
        settled = true;
      });
    } catch {
      resolve({ ok: false, output });
    }
  });
}
async function findSystemPython() {
  const candidates = [
    ...bundledPython$1() && fs.existsSync(bundledPython$1()) ? [{ command: bundledPython$1(), prefix: [] }] : [],
    ...legacyQwenPython() && fs.existsSync(legacyQwenPython()) ? [{ command: legacyQwenPython(), prefix: [] }] : [],
    ...process.platform === "win32" ? [{ command: "py", prefix: ["-3.12"] }, { command: "py", prefix: ["-3"] }, { command: "python", prefix: [] }] : [{ command: "python3.12", prefix: [] }, { command: "python3", prefix: [] }, { command: "python", prefix: [] }]
  ];
  for (const candidate of candidates) {
    const result = await spawnCapture$1(candidate.command, [...candidate.prefix, "-c", "import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))"]);
    if (result.ok && result.output.trim().split(/\r?\n/).at(-1) === "1") return candidate;
  }
  return null;
}
async function isCompatiblePython(command) {
  if (!command || !fs.existsSync(command)) return false;
  const result = await spawnCapture$1(command, ["-c", "import sys; print(int((3, 10) <= sys.version_info[:2] < (3, 14)))"]);
  return result.ok && result.output.trim().split(/\r?\n/).at(-1) === "1";
}
async function migrateLegacyPython(jobId, emit) {
  const legacyExe = legacyQwenPython();
  if (!legacyExe || !fs.existsSync(legacyExe) || fs.existsSync(bundledPython$1())) return;
  const legacyRoot = path.dirname(legacyExe);
  const targetRoot = path.dirname(bundledPython$1());
  emit({
    jobId,
    kind: "install",
    stage: "runtime.python.migrate",
    percent: 7,
    message: "Đang tái sử dụng Python nền từ runtime cũ..."
  });
  fs.mkdirSync(targetRoot, { recursive: true });
  await fs.promises.cp(legacyRoot, targetRoot, {
    recursive: true,
    force: false,
    filter: (source) => {
      const relative = path.relative(legacyRoot, source);
      return relative !== "Scripts" && !relative.startsWith(`Scripts${path.sep}`) && relative !== path.join("Lib", "site-packages") && !relative.startsWith(`${path.join("Lib", "site-packages")}${path.sep}`);
    }
  });
  if (!fs.existsSync(bundledPython$1())) {
    throw new Error("Không thể sao chép Python nền từ runtime cũ");
  }
}
async function hasNvidiaGpu() {
  if (process.platform === "darwin") return false;
  const result = await spawnCapture$1("nvidia-smi", ["-L"]);
  return result.ok && /GPU\s+\d+/i.test(result.output);
}
async function probeRuntime() {
  if (!fs.existsSync(venvPython())) return null;
  const script = [
    "import json, torch",
    "backend = 'cuda' if torch.cuda.is_available() else ('xpu' if hasattr(torch, 'xpu') and torch.xpu.is_available() else ('mps' if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available() else 'cpu'))",
    "print(json.dumps({'backend': backend, 'torchVersion': torch.__version__, 'cudaBuild': torch.version.cuda}))"
  ].join("; ");
  const result = await spawnCapture$1(venvPython(), ["-X", "utf8", "-c", script]);
  if (!result.ok) return null;
  try {
    return JSON.parse(result.output.trim().split(/\r?\n/).at(-1) || "");
  } catch {
    return null;
  }
}
function runStep(jobId, command, args, emit, stage, percent) {
  return new Promise((resolve, reject) => {
    emit({ jobId, kind: "install", stage, percent, message: stage });
    const child = node_child_process.spawn(command, args, {
      windowsHide: true,
      cwd: runtimeRoot$1(),
      env: utf8Environment$1()
    });
    jobs$1.set(jobId, child);
    let stderr = "";
    let stdoutBuffer = "";
    const emitOutputLine = (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      try {
        const event = JSON.parse(line);
        if (event.type === "progress") {
          emit({
            jobId,
            kind: "install",
            stage,
            percent: typeof event.percent === "number" ? event.percent : percent,
            message: event.message || line
          });
          return;
        }
      } catch {
      }
      emit({ jobId, kind: "install", stage, percent, message: line.slice(-500) });
    };
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += String(chunk);
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      lines.forEach(emitOutputLine);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      const line = String(chunk).trim().split(/\r?\n/).at(-1);
      if (line) {
        const progressMatch = stage === "model.download" ? line.match(/(\d{1,3})%\|/) : null;
        const livePercent = progressMatch ? Math.min(95, 50 + Math.round(Number(progressMatch[1]) * 0.45)) : percent;
        emit({ jobId, kind: "install", stage, percent: livePercent, message: line.slice(-500) });
      }
    });
    child.on("error", reject);
    child.on("close", (code) => {
      emitOutputLine(stdoutBuffer);
      jobs$1.delete(jobId);
      if (code === 0) resolve();
      else reject(new Error(code === null ? "Đã hủy" : stderr.slice(-2500) || `${stage} thất bại (${code})`));
    });
  });
}
async function bootstrapPython(jobId, emit) {
  return ensureManagedPython((stage, percent, message) => emit({ jobId, kind: "install", stage, percent, message }));
}
async function ensureRuntime(jobId, emit) {
  fs.mkdirSync(runtimeRoot$1(), { recursive: true });
  if (fs.existsSync(venvPython()) && !await isCompatiblePython(venvPython())) {
    emit({ jobId, kind: "install", stage: "runtime.venv", percent: 2, message: "Đang thay runtime Python cũ bằng Python 3.12..." });
    fs.rmSync(path.join(runtimeRoot$1(), ".venv"), { recursive: true, force: true });
  }
  if (!fs.existsSync(venvPython())) {
    await migrateLegacyPython(jobId, emit);
    let python = await findSystemPython();
    if (!python) {
      python = { command: await bootstrapPython(jobId, emit), prefix: [] };
    }
    await runStep(jobId, python.command, [...python.prefix, "-m", "venv", path.join(runtimeRoot$1(), ".venv")], emit, "runtime.venv", 10);
  }
  if (!isRuntimeCurrent()) {
    await runStep(jobId, venvPython(), ["-m", "pip", "install", "--disable-pip-version-check", "--upgrade", "pip"], emit, "runtime.pip", 14);
    const torchArgs = ["-m", "pip", "install", "--disable-pip-version-check", `torch==${TORCH_VERSION}`, `torchaudio==${TORCH_VERSION}`];
    if (await hasNvidiaGpu()) torchArgs.push("--index-url", TORCH_CUDA_INDEX);
    await runStep(jobId, venvPython(), torchArgs, emit, "runtime.accelerator", 22);
    await runStep(jobId, venvPython(), [
      "-m",
      "pip",
      "install",
      "--disable-pip-version-check",
      "transformers==5.3.0",
      "accelerate",
      "huggingface-hub>=0.34,<2",
      "pydub",
      "numpy",
      "soundfile>=0.12",
      "librosa",
      "num2words"
    ], emit, "runtime.dependencies", 35);
  }
  const nvidiaAvailable = await hasNvidiaGpu();
  let probe = await probeRuntime();
  if (nvidiaAvailable && probe?.backend !== "cuda") {
    await runStep(jobId, venvPython(), [
      "-m",
      "pip",
      "install",
      "--disable-pip-version-check",
      "--force-reinstall",
      `torch==${TORCH_VERSION}`,
      `torchaudio==${TORCH_VERSION}`,
      "--index-url",
      TORCH_CUDA_INDEX
    ], emit, "runtime.accelerator", 38);
    probe = await probeRuntime();
  }
  if (!probe) throw new Error("Không thể kiểm tra OmniVoice runtime");
  if (nvidiaAvailable && probe.backend !== "cuda") {
    throw new Error("Không thể bật CUDA cho OmniVoice runtime");
  }
  fs.writeFileSync(runtimeMarker(), JSON.stringify({
    version: RUNTIME_VERSION,
    sourceVersion: sourceVersion(),
    torch: probe.torchVersion,
    backend: probe.backend
  }, null, 2), "utf8");
}
function safeProfilePromptPath(profileId) {
  if (!profileId) return void 0;
  const safeId = profileId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return void 0;
  fs.mkdirSync(voicePromptRoot(), { recursive: true });
  return path.join(voicePromptRoot(), `${safeId}.pt`);
}
const lineJobs = /* @__PURE__ */ new Map();
function splitLines(text) {
  return text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean);
}
function splitSentences(text) {
  return text.replace(/\r\n/g, "\n").split(/(?<=[.!?…。！？])\s+|\n+/u).map((part) => part.trim()).filter(Boolean);
}
function mergeLineAudios(jobId, inputs, outputPath, gapSec = 0.25, sampleRate = 24e3) {
  const graphParts = inputs.map((_input, index) => {
    const pad = index < inputs.length - 1 ? `,apad=pad_dur=${gapSec}` : "";
    return `[${index}:a]aresample=${sampleRate},aformat=sample_fmts=s16:channel_layouts=mono${pad}[a${index}]`;
  });
  const concatInputs = inputs.map((_input, index) => `[a${index}]`).join("");
  const filter = `${graphParts.join(";")};${concatInputs}concat=n=${inputs.length}:v=0:a=1[out]`;
  return runFFmpeg({
    jobId,
    args: [
      "-y",
      ...inputs.flatMap((input) => ["-i", input]),
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-c:a",
      "pcm_s16le",
      outputPath
    ]
  }).then((result) => ({ ok: result.success, canceled: result.canceled }));
}
async function generateSplit(generateTts2, payload, parts, emit, options) {
  const parentJobId = payload.jobId;
  const isLine = payload.splitMode === "line";
  const unitLabel = options?.unitLabel || (isLine ? "dòng" : "câu");
  const stage = options?.stage || (isLine ? "line-generating" : "sentence-generating");
  const subIds = parts.map((_part, index) => `${parentJobId}-${index}`);
  lineJobs.set(parentJobId, subIds);
  try {
    fs.mkdirSync(outputRoot(), { recursive: true });
    const emitParent = (event) => emit({ ...event, jobId: parentJobId });
    const outputs = [];
    for (let index = 0; index < parts.length; index += 1) {
      emit({
        jobId: parentJobId,
        kind: "generate",
        stage,
        percent: Math.round(4 + index / parts.length * 86),
        message: `Đang đọc ${unitLabel} ${index + 1}/${parts.length}...`
      });
      const result = await generateTts2({ ...payload, jobId: subIds[index], text: parts[index], splitMode: "default" }, emitParent);
      if (!result.success || !result.outputPath) {
        return { success: false, canceled: result.canceled, error: result.error || `Không thể đọc ${unitLabel} ${index + 1}` };
      }
      outputs.push(result.outputPath);
    }
    const outputPath = path.join(outputRoot(), `${parentJobId}.wav`);
    emit({ jobId: parentJobId, kind: "generate", stage: "merging", percent: 94, message: "Đang ghép các phần lại..." });
    const merged = await mergeLineAudios(parentJobId, outputs, outputPath, options?.gapSec, payload.model.capability === "vieneu" ? 48e3 : 24e3);
    if (!merged.ok) {
      return { success: false, canceled: merged.canceled, error: merged.canceled ? "Đã hủy tạo giọng" : "Không thể ghép các phần audio" };
    }
    for (const output of outputs) fs.rmSync(output, { force: true });
    const durationSec = await probeMediaDuration(outputPath);
    emit({ jobId: parentJobId, kind: "generate", stage: "saving", percent: 100, message: "Đã lưu audio" });
    return { success: true, outputPath, durationSec: durationSec || void 0 };
  } finally {
    lineJobs.delete(parentJobId);
  }
}
const VBEE_MAX_TEXT_CHARS = 5e4;
function splitVbeeText(text) {
  let remaining = text.replace(/\r\n/g, "\n").trim();
  if (remaining.length <= VBEE_MAX_TEXT_CHARS) return remaining ? [remaining] : [];
  const chunks = [];
  const separators = ["\n\n", "\n", ". ", "! ", "? ", "… ", "; ", ", ", " "];
  const preferredFloor = Math.floor(VBEE_MAX_TEXT_CHARS * 0.7);
  while (remaining.length > VBEE_MAX_TEXT_CHARS) {
    const window = remaining.slice(0, VBEE_MAX_TEXT_CHARS + 1);
    let cutAt = VBEE_MAX_TEXT_CHARS;
    let bestBoundary = -1;
    let bestSeparatorLength = 0;
    for (const separator of separators) {
      const boundary = window.lastIndexOf(separator, VBEE_MAX_TEXT_CHARS);
      if (boundary >= preferredFloor && boundary > bestBoundary) {
        bestBoundary = boundary;
        bestSeparatorLength = separator.length;
      }
    }
    if (bestBoundary >= preferredFloor) cutAt = bestBoundary + bestSeparatorLength;
    const chunk = remaining.slice(0, cutAt).trim();
    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(cutAt).trimStart();
  }
  if (remaining.trim()) chunks.push(remaining.trim());
  return chunks;
}
async function getTtsModelStatuses(models) {
  models.filter((model) => model.capability === "omnivoice").forEach(assertAllowedModel);
  models.filter((model) => model.capability === "vieneu").forEach(assertAllowedModel);
  const vieneuStatus = models.some((model) => model.capability === "vieneu") ? await getVieneuStatus() : null;
  const pythonAvailable = true;
  const runtimeReady = fs.existsSync(venvPython()) && isRuntimeCurrent();
  const [probe, nvidiaAvailable] = await Promise.all([
    runtimeReady ? probeRuntime() : Promise.resolve(null),
    hasNvidiaGpu()
  ]);
  const runtimeNeedsRepair = !runtimeReady || nvidiaAvailable && probe?.backend !== "cuda";
  return models.map((model) => model.capability === "vieneu" && vieneuStatus ? vieneuStatus : model.capability === "capcut" || model.capability === "gemini" || model.capability === "vbee" ? {
    modelId: model.id,
    status: "ready",
    runtimeReady: true,
    pythonAvailable: true,
    accelerator: void 0
  } : {
    modelId: model.id,
    status: isInstalled(model.id) ? runtimeNeedsRepair ? "incompatible" : "ready" : "not-installed",
    installedPath: isInstalled(model.id) ? modelPath(model.id) : void 0,
    runtimeReady,
    pythonAvailable,
    cudaAvailable: probe ? probe.backend === "cuda" : void 0,
    accelerator: probe?.backend,
    messageKey: runtimeNeedsRepair ? "tts.runtime.cudaRepairRequired" : probe?.backend === "mps" ? "tts.runtime.mpsExperimental" : runtimeReady && probe?.backend === "cpu" ? "tts.runtime.cpuOnly" : void 0
  });
}
async function installTtsModel(jobId, model, emit) {
  try {
    assertAllowedModel(model);
    if (model.capability === "vieneu") return await installVieneu(jobId, emit);
    if (!fs.existsSync(path.join(sourceRoot(), "omnivoice"))) {
      throw new Error("Không tìm thấy source OmniVoice đi kèm ứng dụng");
    }
    await ensureRuntime(jobId, emit);
    fs.mkdirSync(modelRoot(), { recursive: true });
    await runStep(
      jobId,
      venvPython(),
      ["-X", "utf8", workerPath(), "download", "--repository", model.repository, "--output", modelPath(model.id)],
      emit,
      "model.download",
      50
    );
    fs.writeFileSync(path.join(modelPath(model.id), ".model-ready"), `${model.repository}
`, "utf8");
    emit({ jobId, kind: "install", stage: "done", percent: 100, message: "OmniVoice đã sẵn sàng" });
    return { success: true };
  } catch (error) {
    const canceled = canceledJobs.delete(jobId);
    return { success: false, canceled, error: error instanceof Error ? error.message : String(error) };
  }
}
class PersistentOmniVoiceWorker {
  child = null;
  pending = /* @__PURE__ */ new Map();
  stderr = "";
  start() {
    if (this.child && !this.child.killed) return;
    const child = node_child_process.spawn(venvPython(), ["-X", "utf8", workerPath(), "serve"], {
      windowsHide: true,
      env: utf8Environment$1()
    });
    this.child = child;
    this.stderr = "";
    const lines = readline.createInterface({ input: child.stdout });
    lines.on("line", (line) => this.handleLine(line));
    child.stderr.on("data", (chunk) => {
      this.stderr = `${this.stderr}${String(chunk)}`.slice(-6e3);
    });
    child.on("error", (error) => this.failAll(error.message));
    child.on("close", (code) => {
      if (this.child === child) this.child = null;
      this.failAll(this.stderr || `OmniVoice worker dừng với mã ${code}`);
    });
  }
  handleLine(line) {
    try {
      const event = JSON.parse(line);
      const jobId = String(event.jobId || "");
      const pending2 = this.pending.get(jobId);
      if (!pending2) return;
      if (event.type === "progress") {
        pending2.emit({
          jobId,
          kind: "generate",
          stage: String(event.stage || "generating"),
          percent: typeof event.percent === "number" ? event.percent : void 0,
          message: String(event.message || "Đang tạo giọng")
        });
      } else if (event.type === "result") {
        this.pending.delete(jobId);
        pending2.resolve(event);
      }
    } catch {
    }
  }
  failAll(message) {
    for (const [jobId, pending2] of this.pending) {
      this.pending.delete(jobId);
      pending2.resolve({
        success: false,
        canceled: canceledJobs.delete(jobId),
        error: message
      });
    }
  }
  request(jobId, payload, emit) {
    this.start();
    return new Promise((resolve) => {
      this.pending.set(jobId, { resolve, emit });
      this.child?.stdin.write(`${JSON.stringify({ ...payload, jobId })}
`);
    });
  }
  stop(jobId) {
    if (jobId && !this.pending.has(jobId)) return false;
    if (jobId) canceledJobs.add(jobId);
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    return true;
  }
}
const omniWorker = new PersistentOmniVoiceWorker();
async function generateTts(payload, emit) {
  if (payload.model.capability === "vbee") {
    const parts = splitVbeeText(payload.text);
    if (parts.length > 1) {
      emit({
        jobId: payload.jobId,
        kind: "generate",
        stage: "chunking",
        percent: 3,
        message: `Văn bản vượt 50.000 ký tự, đã chia thành ${parts.length} phần`
      });
      return generateSplit(
        generateTts,
        { ...payload, splitMode: "default" },
        parts,
        emit,
        { unitLabel: "phần", stage: "vbee-part-generating", gapSec: 0 }
      );
    }
    return generateVbeeTts({
      jobId: payload.jobId,
      text: parts[0] || "",
      voiceCode: payload.vbeeVoiceCode || "",
      speed: payload.speed,
      audioType: payload.vbeeAudioType,
      bitrate: payload.vbeeBitrate
    }, emit);
  }
  if (payload.splitMode && payload.splitMode !== "default") {
    const parts = payload.splitMode === "line" ? splitLines(payload.text) : splitSentences(payload.text);
    if (parts.length > 1) return generateSplit(generateTts, payload, parts, emit);
  }
  if (payload.model.capability === "vieneu") {
    assertAllowedModel(payload.model);
    return generateVieneu({
      jobId: payload.jobId,
      text: payload.text,
      mode: payload.mode === "clone" ? "clone" : "preset",
      voice: payload.vieneuVoice,
      style: payload.vieneuStyle,
      referenceAudioPath: payload.referenceAudioPath
    }, emit);
  }
  if (payload.model.capability === "capcut") {
    return generateCapCutTts({
      jobId: payload.jobId,
      text: payload.text,
      speed: payload.speed,
      capcutVoiceType: payload.capcutVoiceType,
      capcutResourceId: payload.capcutResourceId
    }, emit);
  }
  if (payload.model.capability === "gemini") {
    return generateGeminiTts({
      jobId: payload.jobId,
      text: payload.text,
      modelId: payload.model.id,
      language: payload.language,
      voiceName: payload.geminiVoiceName,
      style: payload.geminiStyle,
      temperature: payload.geminiTemperature
    }, emit);
  }
  assertAllowedModel(payload.model);
  if (!isInstalled(payload.model.id)) return { success: false, error: "Model chưa được tải" };
  if (!fs.existsSync(venvPython())) return { success: false, error: "OmniVoice runtime chưa được cài đặt" };
  if (payload.mode === "clone" && (!payload.referenceAudioPath || !payload.referenceText)) {
    return { success: false, error: "Voice Clone cần audio và transcript tham chiếu" };
  }
  if (payload.mode === "design" && !payload.instruction?.trim()) {
    return { success: false, error: "Voice Design cần mô tả giọng" };
  }
  fs.mkdirSync(outputRoot(), { recursive: true });
  const outputPath = path.join(outputRoot(), `${payload.jobId}.wav`);
  const advanced = payload.advancedSettings;
  const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number.isFinite(value) ? Number(value) : fallback));
  const advancedSettings = advanced ? {
    audioChunkDuration: clamp(advanced.audioChunkDuration, 5, 60, 15),
    audioChunkThreshold: clamp(advanced.audioChunkThreshold, 5, 120, 30),
    guidanceScale: clamp(advanced.guidanceScale, 0, 5, 2),
    tShift: clamp(advanced.tShift, 0, 1, 0.1),
    positionTemperature: clamp(advanced.positionTemperature, 0, 10, 5),
    classTemperature: clamp(advanced.classTemperature, 0, 10, 0),
    layerPenaltyFactor: clamp(advanced.layerPenaltyFactor, 0, 10, 5),
    denoise: advanced.denoise !== false,
    preprocessPrompt: advanced.preprocessPrompt !== false,
    postprocessOutput: advanced.postprocessOutput !== false,
    padDuration: clamp(advanced.padDuration, 0, 2, 0.1),
    fadeDuration: clamp(advanced.fadeDuration, 0, 2, 0.1)
  } : void 0;
  if (advancedSettings && advancedSettings.audioChunkThreshold < advancedSettings.audioChunkDuration) {
    advancedSettings.audioChunkThreshold = advancedSettings.audioChunkDuration;
  }
  return omniWorker.request(payload.jobId, {
    command: "generate",
    modelPath: modelPath(payload.model.id),
    outputPath,
    promptPath: safeProfilePromptPath(payload.profileId),
    text: payload.text,
    mode: payload.mode,
    language: payload.language === "auto" ? null : payload.language || "vi",
    speed: Math.min(1.5, Math.max(0.75, payload.speed || 1)),
    numStep: [8, 12, 16, 24, 32].includes(payload.numStep || 24) ? payload.numStep : 24,
    advancedSettings,
    instruction: payload.instruction,
    referenceAudioPath: payload.referenceAudioPath,
    referenceText: payload.referenceText
  }, emit);
}
async function removeTtsModel(modelId) {
  if (!ALLOWED_MODELS.has(modelId)) throw new Error("Model TTS không được phép");
  if (modelId === "vieneu-v3-turbo") return removeVieneu();
  omniWorker.stop();
  const target = path.resolve(modelPath(modelId));
  const root = path.resolve(modelRoot());
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Đường dẫn model không hợp lệ");
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  return { success: true };
}
function cancelTtsJob(jobId) {
  if (cancelVieneu(jobId)) return { canceled: true };
  const subs = lineJobs.get(jobId);
  if (subs && subs.length) {
    let canceled = cancelFFmpeg(jobId);
    for (const sub of subs) {
      canceled = cancelCapCutJob(sub) || canceled;
      canceled = cancelGeminiJob(sub) || canceled;
      canceled = cancelVbeeJob(sub) || canceled;
      if (omniWorker.stop(sub)) canceled = true;
    }
    return { canceled };
  }
  const capcutCanceled = cancelCapCutJob(jobId);
  const geminiCanceled = cancelGeminiJob(jobId);
  const vbeeCanceled = cancelVbeeJob(jobId);
  const download2 = downloadControllers.get(jobId);
  if (download2) {
    canceledJobs.add(jobId);
    download2.abort();
    downloadControllers.delete(jobId);
    return { canceled: true };
  }
  const child = jobs$1.get(jobId);
  if (child) {
    canceledJobs.add(jobId);
    child.kill();
    jobs$1.delete(jobId);
    return { canceled: true };
  }
  return { canceled: capcutCanceled || geminiCanceled || vbeeCanceled || omniWorker.stop(jobId) };
}
async function pickReferenceAudio(title) {
  const result = await electron.dialog.showOpenDialog({
    title,
    properties: ["openFile"],
    filters: [{ name: "Audio", extensions: ["wav", "mp3", "m4a", "aac", "flac", "ogg"] }]
  });
  return { path: result.canceled ? null : result.filePaths[0] || null };
}
async function exportTtsAudio(sourcePath, title) {
  if (!fs.existsSync(sourcePath)) return { success: false, error: "Không tìm thấy file audio" };
  const extension = path.extname(sourcePath).toLowerCase() === ".mp3" ? "mp3" : "wav";
  const result = await electron.dialog.showSaveDialog({
    title,
    defaultPath: path.basename(sourcePath),
    filters: [{ name: extension === "mp3" ? "MP3 audio" : "Wave audio", extensions: [extension] }]
  });
  if (result.canceled || !result.filePath) return { success: false, canceled: true };
  fs.copyFileSync(sourcePath, result.filePath);
  return { success: true, filePath: result.filePath };
}
async function revealTtsAudio(filePath) {
  if (fs.existsSync(filePath)) electron.shell.showItemInFolder(filePath);
  return { success: fs.existsSync(filePath) };
}
function cancelAllTtsJobs() {
  cancelAllCapCutJobs();
  cancelAllGeminiJobs();
  cancelAllVbeeJobs();
  for (const [jobId, controller] of downloadControllers) {
    canceledJobs.add(jobId);
    controller.abort();
    downloadControllers.delete(jobId);
  }
  for (const [jobId, child] of jobs$1) {
    canceledJobs.add(jobId);
    child.kill();
    jobs$1.delete(jobId);
  }
  omniWorker.stop();
}
function registerCliRuntimeIpc() {
  electron.ipcMain.handle("cli-runtime-status", async () => {
    return getCliStatus();
  });
  electron.ipcMain.handle("cli-runtime-install", async (_event, adapter) => {
    return installCli(adapter);
  });
  electron.ipcMain.handle("cli-runtime-models", async (_event, adapter) => {
    return getCliModels(adapter);
  });
  electron.ipcMain.handle("cli-runtime-commands", async (_event, adapter, workingDirectory) => {
    return getCliCommands(adapter, workingDirectory);
  });
  electron.ipcMain.handle("cli-runtime-run-text", async (_event, payload) => {
    return runCliTextTask({
      ...payload,
      onChunk: payload.requestId ? (chunk) => {
        _event.sender.send("cli-runtime-event", {
          requestId: payload.requestId,
          type: "chunk",
          chunk
        });
      } : void 0,
      onSessionId: payload.requestId ? (sessionId) => {
        _event.sender.send("cli-runtime-event", {
          requestId: payload.requestId,
          type: "session",
          sessionId
        });
      } : void 0,
      onCommands: payload.requestId ? (commands) => {
        _event.sender.send("cli-runtime-event", {
          requestId: payload.requestId,
          type: "commands",
          commands
        });
      } : void 0
    });
  });
  electron.ipcMain.handle("cli-runtime-cancel-text", async (_event, requestId) => {
    return cancelCliTextTask(requestId);
  });
}
function registerFFmpegIpc() {
  electron.ipcMain.handle("ffmpeg-run", async (_event, payload) => {
    return runFFmpeg({
      ...payload,
      onProgress: (progress) => {
        _event.sender.send("ffmpeg-event", {
          jobId: payload.jobId,
          type: "progress",
          progress
        });
      },
      onLog: (line) => {
        _event.sender.send("ffmpeg-event", {
          jobId: payload.jobId,
          type: "log",
          line
        });
      }
    });
  });
  electron.ipcMain.handle("ffmpeg-cancel", async (_event, jobId) => {
    return { canceled: cancelFFmpeg(jobId) };
  });
  electron.ipcMain.handle("ffmpeg-probe-duration", async (_event, audioPath) => {
    return { durationSec: await probeAudioDuration(audioPath) };
  });
  electron.ipcMain.handle("ffmpeg-probe-dimensions", async (_event, mediaPath) => {
    return { dimensions: await probeMediaDimensions(mediaPath) };
  });
}
function registerWhisperIpc() {
  electron.ipcMain.handle("whisper-transcribe", async (_event, payload) => {
    return transcribeAudio(payload, (progress) => {
      _event.sender.send("whisper-event", progress);
    });
  });
  electron.ipcMain.handle("whisper-cancel", async (_event, jobId) => {
    return { canceled: cancelTranscribe(jobId) };
  });
}
function registerTtsIpc() {
  electron.ipcMain.handle("tts-model-statuses", async (_event, models) => getTtsModelStatuses(models));
  electron.ipcMain.handle("tts-gemini-keys-get", async () => getGeminiApiKeys());
  electron.ipcMain.handle("tts-gemini-keys-set", async (_event, keys) => setGeminiApiKeys(keys));
  electron.ipcMain.handle("tts-vbee-credentials-get", async () => getVbeeCredentials());
  electron.ipcMain.handle("tts-vbee-credentials-set", async (_event, input) => setVbeeCredentials(input));
  electron.ipcMain.handle("tts-vbee-voices-get", async (_event, force) => getVbeeVoices(Boolean(force)));
  electron.ipcMain.handle("tts-vieneu-voices-get", async () => ({ success: true, voices: await listVieneuVoices() }));
  electron.ipcMain.handle("tts-model-install", async (event, payload) => installTtsModel(payload.jobId, payload.model, (progress) => {
    if (!event.sender.isDestroyed()) event.sender.send("tts-runtime-event", progress);
  }));
  electron.ipcMain.handle("tts-model-remove", async (_event, modelId) => removeTtsModel(modelId));
  electron.ipcMain.handle("tts-generate", async (event, payload) => generateTts(payload, (progress) => {
    if (!event.sender.isDestroyed()) event.sender.send("tts-runtime-event", progress);
  }));
  electron.ipcMain.handle("tts-cancel", async (_event, jobId) => cancelTtsJob(jobId));
  electron.ipcMain.handle("tts-pick-reference-audio", async (_event, title) => pickReferenceAudio(title));
  electron.ipcMain.handle("tts-export-audio", async (_event, sourcePath, title) => exportTtsAudio(sourcePath, title));
  electron.ipcMain.handle("tts-reveal-audio", async (_event, filePath) => revealTtsAudio(filePath));
}
function registerRenderIpc() {
  electron.ipcMain.handle("auto-video-render", async (_event, payload) => {
    return renderVideo({ ...payload, mediaRoot: getMediaRoot() }, (progress) => {
      _event.sender.send("auto-video-render-event", progress);
    });
  });
  electron.ipcMain.handle("auto-video-cancel", async (_event, jobId) => {
    return { canceled: cancelRender(jobId) };
  });
  electron.ipcMain.handle("auto-video-pick-output", async (_event, defaultName) => {
    return { path: await pickOutputVideoPath(defaultName) };
  });
  electron.ipcMain.handle("auto-video-show-in-folder", async (_event, filePath) => {
    electron.shell.showItemInFolder(filePath);
    return { ok: true };
  });
  electron.ipcMain.handle("auto-video-open-file", async (_event, filePath) => {
    const err = await electron.shell.openPath(filePath);
    return { ok: !err, error: err || void 0 };
  });
  electron.ipcMain.handle("editor-render", async (_event, payload) => {
    return renderEditor(payload.plan, payload.jobId, payload.outputPath, (progress) => {
      if (!_event.sender.isDestroyed()) _event.sender.send("editor-render-event", progress);
    }, payload.options);
  });
  electron.ipcMain.handle("editor-render-cancel", async (_event, jobId) => {
    return { canceled: cancelEditorRender(jobId) };
  });
  electron.ipcMain.handle("editor-render-pick-output", async (_event, defaultName) => {
    return { path: await pickEditorOutput(defaultName) };
  });
  electron.ipcMain.handle("editor-render-show-in-folder", async (_event, filePath) => {
    electron.shell.showItemInFolder(filePath);
    return { ok: true };
  });
}
let database = null;
function getDatabase() {
  if (database) return database;
  const filePath = path.join(electron.app.getPath("userData"), "research-monitor.sqlite3");
  database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("synchronous = FULL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('channels', 'videos', 'all')),
      status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
      channel_count INTEGER NOT NULL DEFAULT 0,
      video_count INTEGER NOT NULL DEFAULT 0,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS video_snapshots (
      video_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      scan_id INTEGER,
      channel_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      view_count INTEGER NOT NULL,
      PRIMARY KEY (video_id, captured_at),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS channel_snapshots (
      channel_id TEXT NOT NULL,
      captured_at INTEGER NOT NULL,
      scan_id INTEGER,
      view_count INTEGER NOT NULL,
      PRIMARY KEY (channel_id, captured_at),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_video_snapshots_time
      ON video_snapshots(video_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_channel_snapshots_time
      ON channel_snapshots(channel_id, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(finished_at DESC);
  `);
  return database;
}
function recordScan(payload) {
  const db = getDatabase();
  return db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO scans(started_at, finished_at, scope, status, channel_count, video_count)
      VALUES (?, ?, ?, 'success', ?, ?)
    `).run(payload.startedAt, payload.finishedAt, payload.scope, payload.channels.length, payload.videos.length);
    const scanId = Number(result.lastInsertRowid);
    const insertVideo = db.prepare(`
      INSERT OR IGNORE INTO video_snapshots
        (video_id, captured_at, scan_id, channel_id, title, thumbnail_url, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertChannel = db.prepare(`
      INSERT OR IGNORE INTO channel_snapshots(channel_id, captured_at, scan_id, view_count)
      VALUES (?, ?, ?, ?)
    `);
    for (const video of payload.videos) {
      insertVideo.run(video.id, video.capturedAt || payload.finishedAt, scanId, video.channelId, video.title, video.thumbnailUrl, video.viewCount);
    }
    for (const channel of payload.channels) {
      insertChannel.run(channel.id, channel.capturedAt || payload.finishedAt, scanId, channel.viewCount);
    }
    return { scanId };
  })();
}
function recordFailure(payload) {
  const db = getDatabase();
  const result = db.prepare(`
    INSERT INTO scans(started_at, finished_at, scope, status, error)
    VALUES (?, ?, ?, 'failed', ?)
  `).run(payload.startedAt, payload.finishedAt, payload.scope, payload.error);
  return { scanId: Number(result.lastInsertRowid) };
}
function loadHistory() {
  const db = getDatabase();
  const videos = db.prepare(`
    SELECT video_id AS videoId, channel_id AS channelId, title, thumbnail_url AS thumbnailUrl,
           view_count AS viewCount, captured_at AS scannedAt
    FROM video_snapshots ORDER BY video_id, captured_at
  `).all();
  const channels = db.prepare(`
    SELECT channel_id AS channelId, view_count AS viewCount, captured_at AS scannedAt
    FROM channel_snapshots ORDER BY channel_id, captured_at
  `).all();
  const scans = db.prepare(`
    SELECT id, started_at AS startedAt, finished_at AS finishedAt, scope, status,
           channel_count AS channelCount, video_count AS videoCount, error
    FROM scans ORDER BY finished_at DESC LIMIT 100
  `).all();
  return { videos, channels, scans };
}
function migrateLegacy(payload) {
  const db = getDatabase();
  return db.transaction(() => {
    const insertVideo = db.prepare(`
      INSERT OR IGNORE INTO video_snapshots
        (video_id, captured_at, channel_id, title, thumbnail_url, view_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertChannel = db.prepare(`
      INSERT OR IGNORE INTO channel_snapshots(channel_id, captured_at, view_count)
      VALUES (?, ?, ?)
    `);
    for (const [videoId, points] of Object.entries(payload.vphHistory || {})) {
      const metadata = payload.snapshots?.[videoId];
      for (const point of points) {
        const previousAt = Math.round(point.scannedAt - point.elapsedHours * 36e5);
        insertVideo.run(videoId, previousAt, metadata?.channelId || "", metadata?.title || "", metadata?.thumbnailUrl || "", point.viewCount - point.deltaViews);
        insertVideo.run(videoId, point.scannedAt, metadata?.channelId || "", metadata?.title || "", metadata?.thumbnailUrl || "", point.viewCount);
      }
    }
    for (const snapshot of Object.values(payload.snapshots || {})) {
      insertVideo.run(snapshot.videoId, snapshot.scannedAt, snapshot.channelId, snapshot.title, snapshot.thumbnailUrl, snapshot.viewCount);
    }
    for (const [channelId, points] of Object.entries(payload.channelViewHistory || {})) {
      for (const point of points) {
        const previousAt = Math.round(point.scannedAt - point.elapsedHours * 36e5);
        insertChannel.run(channelId, previousAt, point.viewCount - point.deltaViews);
        insertChannel.run(channelId, point.scannedAt, point.viewCount);
      }
    }
    for (const snapshot of Object.values(payload.channelSnapshots || {})) {
      insertChannel.run(snapshot.channelId, snapshot.scannedAt, snapshot.viewCount);
    }
    return { migrated: true };
  })();
}
function registerResearchDatabaseIpc() {
  electron.ipcMain.handle("research-db-record-scan", (_event, payload) => recordScan(payload));
  electron.ipcMain.handle("research-db-record-failure", (_event, payload) => recordFailure(payload));
  electron.ipcMain.handle("research-db-load", () => loadHistory());
  electron.ipcMain.handle("research-db-migrate-legacy", (_event, payload) => migrateLegacy(payload));
  electron.ipcMain.handle("research-db-clear-history", () => {
    const db = getDatabase();
    db.transaction(() => {
      db.prepare("DELETE FROM video_snapshots").run();
      db.prepare("DELETE FROM channel_snapshots").run();
      db.prepare("DELETE FROM scans").run();
    })();
    return true;
  });
}
function closeResearchDatabase() {
  database?.close();
  database = null;
}
const jobs = /* @__PURE__ */ new Map();
let installPromise = null;
let denoInstallPromise = null;
let youtubeView = null;
let youtubeParent = null;
let youtubeAttached = false;
let youtubeLoadError = "";
let youtubeProfileId = "default";
let youtubeBounds = null;
let profileState = null;
function profileStatePath() {
  return path.join(electron.app.getPath("userData"), "media-toolkit-youtube-profiles.json");
}
function saveProfileState() {
  if (!profileState) return;
  fs.mkdirSync(path.dirname(profileStatePath()), { recursive: true });
  fs.writeFileSync(profileStatePath(), JSON.stringify(profileState, null, 2), "utf8");
}
function loadProfileState() {
  if (profileState) return profileState;
  try {
    const parsed = JSON.parse(fs.readFileSync(profileStatePath(), "utf8"));
    if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
      const activeExists = parsed.profiles.some((profile) => profile.id === parsed.activeProfileId);
      profileState = { profiles: parsed.profiles, activeProfileId: activeExists ? parsed.activeProfileId : parsed.profiles[0].id };
      youtubeProfileId = profileState.activeProfileId;
      return profileState;
    }
  } catch {
  }
  profileState = { activeProfileId: "default", profiles: [{ id: "default", name: "Profile 1", createdAt: Date.now() }] };
  youtubeProfileId = "default";
  saveProfileState();
  return profileState;
}
function youtubePartition(profileId) {
  return profileId === "default" ? "persist:media-toolkit-youtube" : `persist:media-toolkit-youtube-${profileId}`;
}
function publicProfileState() {
  const state = loadProfileState();
  return { activeProfileId: state.activeProfileId, profiles: state.profiles };
}
function isAllowedYouTubeNavigation(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtu.be") || host === "youtube.com" || host.endsWith(".youtube.com") || host === "google.com" || host.endsWith(".google.com") || host.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}
function browserState(view) {
  return {
    url: view.webContents.getURL(),
    title: view.webContents.getTitle(),
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
    loading: !youtubeLoadError && view.webContents.isLoading(),
    error: youtubeLoadError || void 0
  };
}
function emitBrowserState(view) {
  if (youtubeParent && !youtubeParent.isDestroyed()) {
    youtubeParent.webContents.send("media-toolkit-browser-state", browserState(view));
  }
}
function destroyYouTubeView() {
  if (youtubeView && youtubeParent && youtubeAttached) youtubeParent.contentView.removeChildView(youtubeView);
  if (youtubeView && !youtubeView.webContents.isDestroyed()) youtubeView.webContents.close();
  youtubeView = null;
  youtubeAttached = false;
  youtubeLoadError = "";
}
function ensureYouTubeView(parent, profileId = loadProfileState().activeProfileId) {
  if (youtubeView && !youtubeView.webContents.isDestroyed() && youtubeProfileId === profileId) {
    youtubeParent = parent;
    return youtubeView;
  }
  destroyYouTubeView();
  youtubeProfileId = profileId;
  youtubeParent = parent;
  youtubeView = new electron.WebContentsView({
    webPreferences: {
      partition: youtubePartition(profileId),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });
  const view = youtubeView;
  view.setBackgroundColor("#0f0f0f");
  view.webContents.setUserAgent(
    `Mozilla/5.0 (${process.platform === "win32" ? "Windows NT 10.0; Win64; x64" : "X11; Linux x86_64"}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`
  );
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedYouTubeNavigation(url)) void view.webContents.loadURL(url);
    else if (/^https?:\/\//i.test(url)) void electron.shell.openExternal(url);
    return { action: "deny" };
  });
  view.webContents.on("will-navigate", (event, url) => {
    if (isAllowedYouTubeNavigation(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) void electron.shell.openExternal(url);
  });
  view.webContents.on("did-navigate", () => emitBrowserState(view));
  view.webContents.on("did-navigate-in-page", () => emitBrowserState(view));
  view.webContents.on("did-start-loading", () => {
    youtubeLoadError = "";
    emitBrowserState(view);
  });
  view.webContents.on("did-stop-loading", () => emitBrowserState(view));
  view.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    youtubeLoadError = `${errorDescription} (${errorCode})`;
    console.error("[media-toolkit][youtube] load failed", { errorCode, errorDescription, validatedURL });
    emitBrowserState(view);
  });
  view.webContents.on("render-process-gone", (_event, details) => {
    youtubeLoadError = `YouTube renderer stopped: ${details.reason}`;
    console.error("[media-toolkit][youtube] renderer stopped", details);
    emitBrowserState(view);
  });
  view.webContents.on("unresponsive", () => {
    youtubeLoadError = "YouTube is not responding";
    emitBrowserState(view);
  });
  view.webContents.on("page-title-updated", () => emitBrowserState(view));
  void view.webContents.loadURL("https://www.youtube.com/").catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (/ERR_ABORTED|\(-3\)/i.test(message)) {
      youtubeLoadError = "";
      emitBrowserState(view);
      return;
    }
    youtubeLoadError = message;
    console.error("[media-toolkit][youtube] initial navigation failed", error);
    emitBrowserState(view);
  });
  return view;
}
function safeViewBounds(parent, input, zoomFactor = 1) {
  const content = parent.getContentBounds();
  const x = Math.max(0, Math.round((Number(input.x) || 0) * zoomFactor));
  const y = Math.max(0, Math.round((Number(input.y) || 0) * zoomFactor));
  return {
    x: Math.min(x, content.width),
    y: Math.min(y, content.height),
    width: Math.max(0, Math.min(Math.round((Number(input.width) || 0) * zoomFactor), content.width - x)),
    height: Math.max(0, Math.min(Math.round((Number(input.height) || 0) * zoomFactor), content.height - y))
  };
}
function binaryName() {
  if (process.platform === "win32") return "yt-dlp.exe";
  return process.platform === "darwin" ? "yt-dlp_macos" : "yt-dlp";
}
function managedBinaryPath() {
  return path.join(electron.app.getPath("userData"), "tools", binaryName());
}
function releaseUrl() {
  return `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName()}`;
}
function denoBinaryName() {
  return process.platform === "win32" ? "deno.exe" : "deno";
}
function managedDenoPath() {
  return path.join(electron.app.getPath("userData"), "tools", denoBinaryName());
}
function denoReleaseUrl() {
  const architecture = process.arch === "arm64" ? "aarch64" : "x86_64";
  const target = process.platform === "win32" ? `${architecture}-pc-windows-msvc` : process.platform === "darwin" ? `${architecture}-apple-darwin` : `${architecture}-unknown-linux-gnu`;
  return `https://github.com/denoland/deno/releases/latest/download/deno-${target}.zip`;
}
async function extractDenoArchive(archivePath, destination) {
  const archive = await fs.promises.readFile(archivePath);
  let endOffset = archive.length - 22;
  while (endOffset >= Math.max(0, archive.length - 65557) && archive.readUInt32LE(endOffset) !== 101010256) endOffset -= 1;
  if (endOffset < 0 || archive.readUInt32LE(endOffset) !== 101010256) throw new Error("Invalid Deno archive");
  const centralOffset = archive.readUInt32LE(endOffset + 16);
  const entryCount = archive.readUInt16LE(endOffset + 10);
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(offset) !== 33639248) throw new Error("Invalid Deno archive directory");
    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const fileName = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (path.basename(fileName).toLowerCase() === denoBinaryName().toLowerCase()) {
      if (archive.readUInt32LE(localOffset) !== 67324752) throw new Error("Invalid Deno archive entry");
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
      const output = method === 0 ? compressed : method === 8 ? node_zlib.inflateRawSync(compressed) : null;
      if (!output) throw new Error(`Unsupported Deno archive compression method: ${method}`);
      await fs.promises.writeFile(destination, output);
      if (process.platform !== "win32") await fs.promises.chmod(destination, 493);
      return;
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error("Deno executable was not found in its archive");
}
function isYouTubeUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtu.be") || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}
function cookieField(value) {
  return value.replace(/[\t\r\n]/g, "");
}
async function createYouTubeCookieFile(rawUrl, jobId) {
  if (!isYouTubeUrl(rawUrl)) return null;
  const youtubeSession = electron.session.fromPartition(youtubePartition(loadProfileState().activeProfileId));
  const cookies = await youtubeSession.cookies.get({});
  const relevant = cookies.filter((cookie) => {
    if (!cookie.domain) return false;
    const domain = cookie.domain.replace(/^\./, "").toLowerCase();
    return domain === "youtube.com" || domain.endsWith(".youtube.com") || domain === "google.com" || domain.endsWith(".google.com") || domain.endsWith(".googleusercontent.com");
  });
  if (relevant.length === 0) return null;
  const directory = path.join(electron.app.getPath("temp"), "logdd-media-toolkit");
  await fs.promises.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `youtube-cookies-${jobId.replace(/[^a-z0-9_-]/gi, "_")}.txt`);
  const lines = relevant.map((cookie) => {
    const httpOnlyPrefix = cookie.httpOnly ? "#HttpOnly_" : "";
    const rawDomain = cookie.domain || "youtube.com";
    const domain = rawDomain.startsWith(".") ? rawDomain : `.${rawDomain}`;
    return [
      `${httpOnlyPrefix}${cookieField(domain)}`,
      "TRUE",
      cookieField(cookie.path || "/"),
      cookie.secure ? "TRUE" : "FALSE",
      String(cookie.expirationDate ? Math.floor(cookie.expirationDate) : 0),
      cookieField(cookie.name),
      cookieField(cookie.value)
    ].join("	");
  });
  await fs.promises.writeFile(filePath, `# Netscape HTTP Cookie File
${lines.join("\n")}
`, { encoding: "utf8", mode: 384 });
  return filePath;
}
function send(sender, payload) {
  if (!sender.isDestroyed()) sender.send("media-toolkit-event", payload);
}
function downloadFile$1(url, destination, onPercent, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("Too many redirects while installing yt-dlp"));
    const request = https.get(url, { headers: { "User-Agent": "logdd-media-toolkit" } }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        void downloadFile$1(next, destination, onPercent, redirects + 1).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`yt-dlp download failed (HTTP ${response.statusCode ?? "unknown"})`));
        return;
      }
      const total = Number(response.headers["content-length"] || 0);
      let received = 0;
      const stream = fs.createWriteStream(destination);
      response.on("data", (chunk) => {
        received += chunk.length;
        if (total > 0) onPercent(Math.round(received / total * 100));
      });
      response.pipe(stream);
      stream.on("finish", () => stream.close(() => resolve()));
      stream.on("error", reject);
    });
    request.on("error", reject);
  });
}
async function ensureYtDlp(sender, jobId = "setup") {
  const managed = managedBinaryPath();
  if (fs.existsSync(managed)) return managed;
  if (installPromise) return installPromise;
  installPromise = (async () => {
    await fs.promises.mkdir(path.dirname(managed), { recursive: true });
    const temporary = `${managed}.download`;
    sender && send(sender, { jobId, stage: "installing", percent: 0, message: "Installing yt-dlp…" });
    try {
      await downloadFile$1(releaseUrl(), temporary, (percent) => {
        sender && send(sender, { jobId, stage: "installing", percent, message: "Installing yt-dlp…" });
      });
      await fs.promises.rename(temporary, managed);
      if (process.platform !== "win32") await fs.promises.chmod(managed, 493);
      return managed;
    } catch (error) {
      await fs.promises.rm(temporary, { force: true }).catch(() => void 0);
      throw error;
    } finally {
      installPromise = null;
    }
  })();
  return installPromise;
}
async function ensureDeno(sender, jobId = "setup") {
  const managed = managedDenoPath();
  if (fs.existsSync(managed)) return managed;
  if (denoInstallPromise) return denoInstallPromise;
  denoInstallPromise = (async () => {
    const toolsDirectory = path.dirname(managed);
    await fs.promises.mkdir(toolsDirectory, { recursive: true });
    const archive = path.join(toolsDirectory, `deno-${process.platform}-${process.arch}.zip.download`);
    sender && send(sender, { jobId, stage: "installing", percent: 0, message: "Installing YouTube JavaScript runtime…" });
    try {
      await downloadFile$1(denoReleaseUrl(), archive, (percent) => {
        sender && send(sender, { jobId, stage: "installing", percent, message: "Installing YouTube JavaScript runtime…" });
      });
      await extractDenoArchive(archive, managed);
      return managed;
    } catch (error) {
      await fs.promises.rm(managed, { force: true }).catch(() => void 0);
      throw error;
    } finally {
      await fs.promises.rm(archive, { force: true }).catch(() => void 0);
      denoInstallPromise = null;
    }
  })();
  return denoInstallPromise;
}
async function ytDlpVersion(binary) {
  const result = await run(binary, ["--version"]);
  if (result.code !== 0) return null;
  const version = result.stdout.trim();
  return version || null;
}
async function autoUpdateYtDlp() {
  const managed = managedBinaryPath();
  if (!fs.existsSync(managed) || jobs.size > 0) return;
  try {
    const before = await ytDlpVersion(managed);
    const result = await run(managed, ["--update"], "yt-dlp-auto-update");
    if (result.code !== 0) return;
    const after = await ytDlpVersion(managed);
    if (!after || after === before) return;
    const options = {
      type: "info",
      title: "yt-dlp đã được cập nhật",
      message: `yt-dlp được cập nhật từ ${before} lên ${after}.`,
      detail: "Khởi động lại ứng dụng để áp dụng bản cập nhật.",
      buttons: ["Khởi động lại ngay", "Để sau"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    };
    const parent = getMainWindow();
    const choice = parent ? await electron.dialog.showMessageBox(parent, options) : await electron.dialog.showMessageBox(options);
    if (choice.response === 0) {
      electron.app.relaunch();
      electron.app.quit();
    }
  } catch (error) {
    console.error("[media-toolkit] yt-dlp auto-update failed:", error);
  }
}
function run(binary, args, jobId, onLine) {
  return new Promise((resolve, reject) => {
    const child = node_child_process.spawn(binary, args, { windowsHide: true });
    if (jobId) jobs.set(jobId, child);
    let stdout = "";
    let stderr = "";
    const consume = (kind, chunk) => {
      const value = chunk.toString();
      if (kind === "stdout") stdout += value;
      else stderr += value;
      value.split(/\r?\n/).filter(Boolean).forEach((line) => onLine?.(line));
    };
    child.stdout.on("data", (chunk) => consume("stdout", chunk));
    child.stderr.on("data", (chunk) => consume("stderr", chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const canceled = Boolean(jobId && !jobs.has(jobId));
      if (jobId) jobs.delete(jobId);
      resolve({ code, stdout, stderr, canceled });
    });
  });
}
function subtitleTracks(data) {
  const tracks = [];
  for (const [key, automatic] of [["subtitles", false], ["automatic_captions", true]]) {
    const group = data[key];
    if (!group || typeof group !== "object") continue;
    for (const [language, entries] of Object.entries(group)) {
      tracks.push({
        language,
        label: String(entries?.[0]?.name || language),
        automatic,
        formats: [...new Set((entries || []).map((entry) => String(entry.ext || "")).filter(Boolean))]
      });
    }
  }
  return tracks.sort((a, b) => Number(a.automatic) - Number(b.automatic) || a.language.localeCompare(b.language));
}
async function analyze(sender, jobId, url) {
  let cookiePath = null;
  try {
    send(sender, { jobId, stage: "analyzing", message: "Reading media information…" });
    const binary = await ensureYtDlp(sender, jobId);
    const deno = isYouTubeUrl(url) ? await ensureDeno(sender, jobId) : null;
    cookiePath = await createYouTubeCookieFile(url, jobId);
    const args = ["--dump-single-json", "--no-playlist", "--no-warnings"];
    if (deno) args.push("--js-runtimes", `deno:${deno}`);
    if (cookiePath) args.push("--cookies", cookiePath);
    args.push(url);
    const result = await run(binary, args, jobId);
    if (result.canceled) return { success: false, error: "Canceled" };
    if (result.code !== 0) return { success: false, error: result.stderr.trim() || "Could not analyze this URL" };
    const data = JSON.parse(result.stdout);
    const info = {
      id: String(data.id || ""),
      url,
      webpageUrl: String(data.webpage_url || url),
      title: String(data.title || "Untitled media"),
      uploader: data.uploader ? String(data.uploader) : void 0,
      duration: typeof data.duration === "number" ? data.duration : void 0,
      thumbnail: data.thumbnail ? String(data.thumbnail) : void 0,
      extractor: data.extractor_key ? String(data.extractor_key) : void 0,
      subtitles: subtitleTracks(data)
    };
    send(sender, { jobId, stage: "done", percent: 100 });
    return { success: true, info };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => void 0);
  }
}
async function analyzePlaylist(sender, jobId, url) {
  let cookiePath = null;
  try {
    send(sender, { jobId, stage: "analyzing", message: "Reading playlist…" });
    const binary = await ensureYtDlp(sender, jobId);
    const deno = isYouTubeUrl(url) ? await ensureDeno(sender, jobId) : null;
    cookiePath = await createYouTubeCookieFile(url, jobId);
    const args = ["--dump-single-json", "--flat-playlist", "--no-warnings"];
    if (deno) args.push("--js-runtimes", `deno:${deno}`);
    if (cookiePath) args.push("--cookies", cookiePath);
    args.push(url);
    const result = await run(binary, args, jobId);
    if (result.canceled) return { success: false, error: "Canceled" };
    if (result.code !== 0) return { success: false, error: result.stderr.trim() || "Could not analyze this playlist" };
    const data = JSON.parse(result.stdout);
    const rawEntries = Array.isArray(data.entries) ? data.entries : [];
    const entries = rawEntries.filter((entry) => entry && entry.id).map((entry) => {
      const rawUrl = String(entry.webpage_url || entry.url || "");
      return {
        id: String(entry.id),
        title: String(entry.title || "Untitled video"),
        url: /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://www.youtube.com/watch?v=${entry.id}`,
        thumbnail: entry.thumbnail ? String(entry.thumbnail) : void 0,
        duration: typeof entry.duration === "number" ? entry.duration : void 0,
        uploader: entry.uploader ? String(entry.uploader) : void 0
      };
    });
    const playlist = {
      id: String(data.id || ""),
      title: String(data.title || "Playlist"),
      url,
      entries
    };
    send(sender, { jobId, stage: "done", percent: 100 });
    return { success: true, playlist };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => void 0);
  }
}
function outputTemplate(directory, suffix = "") {
  const safeSuffix = suffix.replace(/[\\/:*?"<>|%\r\n]+/g, "").slice(0, 40);
  return path.join(directory, `%(title).160B [%(id)s]${safeSuffix}.%(ext)s`);
}
function parseDestination(line) {
  const match = line.match(/__LOGDD_FILE__(.+)$/);
  return match?.[1]?.trim();
}
async function download(sender, request) {
  let cookiePath = null;
  try {
    const binary = await ensureYtDlp(sender, request.jobId);
    const deno = isYouTubeUrl(request.url) ? await ensureDeno(sender, request.jobId) : null;
    let directory = request.outputDirectory;
    if (!directory) {
      const selected = await electron.dialog.showOpenDialog({ title: "Choose download folder", properties: ["openDirectory", "createDirectory"] });
      if (selected.canceled || !selected.filePaths[0]) return { success: false, canceled: true };
      directory = selected.filePaths[0];
    }
    const startedAt = Date.now();
    const args = [
      "--no-playlist",
      "--no-simulate",
      "--newline",
      "--progress",
      "--ffmpeg-location",
      getFFmpegPath(),
      "--print",
      "after_move:__LOGDD_FILE__%(filepath)s",
      "-o",
      outputTemplate(directory, request.outputSuffix)
    ];
    if (deno) args.push("--js-runtimes", `deno:${deno}`);
    cookiePath = await createYouTubeCookieFile(request.url, request.jobId);
    if (cookiePath) args.push("--cookies", cookiePath);
    const hasTimeRange = Boolean(request.startTime?.trim() || request.endTime?.trim());
    if (request.kind === "video") {
      const height = request.quality === "best" ? "" : request.quality;
      const format = height ? `bv*[vcodec^=avc1][height<=${height}]+ba[acodec^=mp4a]/bv*+ba/b[height<=${height}]` : `bv*[vcodec^=avc1]+ba[acodec^=mp4a]/bv*+ba/b`;
      args.push("-f", format, "--merge-output-format", "mp4");
    } else if (request.kind === "audio") {
      args.push("-x", "--audio-format", request.audioFormat || "mp3");
    } else if (request.kind === "subtitle") {
      if (!request.subtitleLanguage) return { success: false, error: "Choose a subtitle language" };
      args.push("--skip-download", "--write-subs");
      if (request.includeAutomatic) args.push("--write-auto-subs");
      args.push("--sub-langs", request.subtitleLanguage, "--convert-subs", "srt");
    } else {
      args.push("--skip-download", "--write-thumbnail", "--convert-thumbnails", "jpg");
    }
    if ((request.kind === "video" || request.kind === "audio") && hasTimeRange) {
      const start = request.startTime?.trim() || "0";
      const end = request.endTime?.trim() || "inf";
      args.push("--download-sections", `*${start}-${end}`, "--force-keyframes-at-cuts");
      if (request.kind === "video") {
        args.push(
          "--downloader-args",
          "ffmpeg_o:-preset ultrafast -threads 0"
        );
      }
    }
    args.push(request.url);
    let filePath = "";
    const result = await run(binary, args, request.jobId, (line) => {
      const destination = parseDestination(line);
      if (destination) filePath = destination;
      const percent = line.match(/\[download\]\s+([\d.]+)%/)?.[1];
      send(sender, {
        jobId: request.jobId,
        stage: line.includes("[Merger]") || line.includes("[ExtractAudio]") ? "processing" : "downloading",
        percent: percent ? Number(percent) : void 0,
        message: line.replace(/\x1b\[[0-9;]*m/g, "")
      });
    });
    if (result.canceled) return { success: false, canceled: true };
    if (result.code !== 0) return { success: false, error: result.stderr.trim() || "Download failed" };
    send(sender, { jobId: request.jobId, stage: "done", percent: 100, message: "Download complete" });
    if (request.kind === "subtitle" && (!filePath || !filePath.toLowerCase().endsWith(".srt"))) {
      const candidates = (await fs.promises.readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".srt")).map((entry) => path.join(directory, entry.name));
      const recent = await Promise.all(candidates.map(async (candidate) => ({
        candidate,
        mtime: (await fs.promises.stat(candidate)).mtimeMs
      })));
      filePath = recent.filter((item) => item.mtime >= startedAt - 1500).sort((a, b) => b.mtime - a.mtime)[0]?.candidate || filePath;
    }
    if (request.kind === "thumbnail" && (!filePath || !/\.(?:jpe?g|png|webp)$/i.test(filePath))) {
      const candidates = (await fs.promises.readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name)).map((entry) => path.join(directory, entry.name));
      const recent = await Promise.all(candidates.map(async (candidate) => ({
        candidate,
        mtime: (await fs.promises.stat(candidate)).mtimeMs
      })));
      filePath = recent.filter((item) => item.mtime >= startedAt - 1500).sort((a, b) => b.mtime - a.mtime)[0]?.candidate || filePath;
    }
    const subtitlePath = request.kind === "subtitle" && filePath.toLowerCase().endsWith(".srt") ? filePath : void 0;
    const srt = subtitlePath && fs.existsSync(subtitlePath) ? await fs.promises.readFile(subtitlePath, "utf8") : void 0;
    return { success: true, filePath: filePath || directory, srt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId: request.jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => void 0);
  }
}
function cancelAllMediaToolkitJobs() {
  for (const [jobId, child] of jobs) {
    jobs.delete(jobId);
    child.kill();
  }
  if (youtubeView && !youtubeView.webContents.isDestroyed()) youtubeView.webContents.close();
  youtubeView = null;
  youtubeParent = null;
  youtubeAttached = false;
}
function registerMediaToolkitIpc() {
  electron.ipcMain.handle("media-toolkit-profiles-list", async () => publicProfileState());
  electron.ipcMain.handle("media-toolkit-profiles-create", async (event) => {
    const state = loadProfileState();
    const profile = { id: crypto.randomUUID(), name: `Profile ${state.profiles.length + 1}`, createdAt: Date.now() };
    state.profiles.push(profile);
    state.activeProfileId = profile.id;
    saveProfileState();
    const parent = electron.BrowserWindow.fromWebContents(event.sender);
    if (parent) {
      const view = ensureYouTubeView(parent, profile.id);
      parent.contentView.addChildView(view);
      youtubeAttached = true;
      if (youtubeBounds) view.setBounds(youtubeBounds);
    }
    return publicProfileState();
  });
  electron.ipcMain.handle("media-toolkit-profiles-switch", async (event, profileId) => {
    const state = loadProfileState();
    if (!state.profiles.some((profile) => profile.id === profileId)) throw new Error("YouTube profile not found");
    state.activeProfileId = profileId;
    saveProfileState();
    const parent = electron.BrowserWindow.fromWebContents(event.sender);
    if (parent) {
      const view = ensureYouTubeView(parent, profileId);
      parent.contentView.addChildView(view);
      youtubeAttached = true;
      if (youtubeBounds) view.setBounds(youtubeBounds);
    }
    return publicProfileState();
  });
  electron.ipcMain.handle("media-toolkit-profiles-rename", async (_event, payload) => {
    const state = loadProfileState();
    const profile = state.profiles.find((item) => item.id === payload.profileId);
    if (!profile) throw new Error("YouTube profile not found");
    const name = payload.name.trim().slice(0, 40);
    if (!name) throw new Error("Profile name is required");
    profile.name = name;
    saveProfileState();
    return publicProfileState();
  });
  electron.ipcMain.handle("media-toolkit-profiles-delete", async (event, profileId) => {
    const state = loadProfileState();
    if (state.profiles.length <= 1) throw new Error("At least one profile is required");
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) throw new Error("YouTube profile not found");
    const wasActive = state.activeProfileId === profileId;
    state.profiles.splice(index, 1);
    if (wasActive) state.activeProfileId = state.profiles[0].id;
    saveProfileState();
    if (wasActive) {
      const parent = electron.BrowserWindow.fromWebContents(event.sender);
      if (parent) {
        const view = ensureYouTubeView(parent, state.activeProfileId);
        parent.contentView.addChildView(view);
        youtubeAttached = true;
        if (youtubeBounds) view.setBounds(youtubeBounds);
      }
    }
    await electron.session.fromPartition(youtubePartition(profileId)).clearStorageData();
    return publicProfileState();
  });
  electron.ipcMain.handle("media-toolkit-browser-show", async (event, bounds) => {
    const parent = electron.BrowserWindow.fromWebContents(event.sender);
    if (!parent) return { success: false };
    const view = ensureYouTubeView(parent);
    if (!youtubeAttached) {
      parent.contentView.addChildView(view);
      youtubeAttached = true;
    }
    youtubeBounds = safeViewBounds(parent, bounds, event.sender.getZoomFactor());
    view.setBounds(youtubeBounds);
    emitBrowserState(view);
    return { success: true, state: browserState(view) };
  });
  electron.ipcMain.handle("media-toolkit-browser-bounds", async (event, bounds) => {
    if (!youtubeView || !youtubeParent || !youtubeAttached) return { success: false };
    youtubeBounds = safeViewBounds(youtubeParent, bounds, event.sender.getZoomFactor());
    youtubeView.setBounds(youtubeBounds);
    return { success: true };
  });
  electron.ipcMain.handle("media-toolkit-browser-hide", async () => {
    if (youtubeView && youtubeParent && youtubeAttached) {
      youtubeParent.contentView.removeChildView(youtubeView);
      youtubeAttached = false;
    }
    return { success: true };
  });
  electron.ipcMain.handle("media-toolkit-browser-action", async (_event, action) => {
    if (!youtubeView) return { success: false };
    if (action === "back" && youtubeView.webContents.canGoBack()) youtubeView.webContents.goBack();
    if (action === "forward" && youtubeView.webContents.canGoForward()) youtubeView.webContents.goForward();
    if (action === "reload") youtubeView.webContents.reload();
    if (action === "home") await youtubeView.webContents.loadURL("https://www.youtube.com/");
    return { success: true };
  });
  electron.ipcMain.handle("media-toolkit-browser-navigate", async (_event, url) => {
    if (!youtubeView || !isAllowedYouTubeNavigation(url)) return { success: false, error: "Only YouTube/Google navigation is allowed" };
    await youtubeView.webContents.loadURL(url);
    return { success: true };
  });
  electron.ipcMain.handle("media-toolkit-status", async () => ({ installed: fs.existsSync(managedBinaryPath()) }));
  electron.ipcMain.handle("media-toolkit-install", async (event, jobId) => {
    try {
      await ensureYtDlp(event.sender, jobId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  electron.ipcMain.handle("media-toolkit-analyze", (event, payload) => analyze(event.sender, payload.jobId, payload.url));
  electron.ipcMain.handle("media-toolkit-analyze-playlist", (event, payload) => analyzePlaylist(event.sender, payload.jobId, payload.url));
  electron.ipcMain.handle("media-toolkit-choose-directory", async () => {
    const selected = await electron.dialog.showOpenDialog({ title: "Choose download folder", properties: ["openDirectory", "createDirectory"] });
    if (selected.canceled || !selected.filePaths[0]) return { success: false, canceled: true };
    return { success: true, directory: selected.filePaths[0] };
  });
  electron.ipcMain.handle("media-toolkit-download", (event, payload) => download(event.sender, payload));
  electron.ipcMain.handle("media-toolkit-cancel", async (_event, jobId) => {
    const child = jobs.get(jobId);
    if (!child) return { canceled: false };
    jobs.delete(jobId);
    child.kill();
    return { canceled: true };
  });
  electron.ipcMain.handle("media-toolkit-save-subtitle", async (_event, payload) => {
    const result = await electron.dialog.showSaveDialog({ defaultPath: payload.defaultName, filters: [{ name: "SubRip subtitle", extensions: ["srt"] }] });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    await fs.promises.writeFile(result.filePath, payload.srt, "utf8");
    return { success: true, filePath: result.filePath };
  });
  electron.ipcMain.handle("media-toolkit-reveal", async (_event, filePath) => {
    if (fs.existsSync(filePath) && (await fs.promises.stat(filePath)).isFile()) electron.shell.showItemInFolder(filePath);
    else await electron.shell.openPath(filePath);
    return { success: true };
  });
  electron.ipcMain.handle("media-toolkit-open-source", async (_event, url) => {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL");
    await electron.shell.openExternal(parsed.toString());
    return { success: true };
  });
}
const PYTHON_VERSION = "3.12.10";
const PYTHON_WIN_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-amd64.exe`;
const PYTHON_DEPS = ["numpy", "scipy", "Pillow", "opencv-python"];
const DEPS_MARKER = "deps-ok";
function runtimeRoot() {
  return path.join(electron.app.getPath("userData"), "runtimes", "watermark");
}
function bundledPython() {
  return process.platform === "win32" ? path.join(runtimeRoot(), "python", "python.exe") : path.join(runtimeRoot(), "venv", "bin", "python3");
}
function depsOkMarker() {
  return path.join(runtimeRoot(), DEPS_MARKER);
}
function scriptDir() {
  return electron.app.isPackaged ? path.join(process.resourcesPath, "watermark") : path.join(process.env.APP_ROOT || process.cwd(), "electron", "features", "video-studio", "python");
}
function watermarkScriptPath() {
  return path.join(scriptDir(), "wm_remove.py");
}
function utf8Environment() {
  return {
    ...process.env,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8"
  };
}
function spawnCapture(command, args, timeoutMs) {
  return new Promise((resolve) => {
    let output = "";
    let settled = false;
    const finish = (result) => {
      if (!settled) resolve(result);
      settled = true;
    };
    try {
      const child = node_child_process.spawn(command, args, { windowsHide: true, env: utf8Environment() });
      const timer = timeoutMs ? setTimeout(() => {
        try {
          child.kill();
        } catch {
        }
        finish({ ok: false, output: `${output}
[timeout]` });
      }, timeoutMs) : null;
      child.stdout.on("data", (chunk) => {
        output += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        output += String(chunk);
      });
      child.on("error", (error) => {
        if (timer) clearTimeout(timer);
        finish({ ok: false, output: output || `Failed to start ${command}: ${error.message}` });
      });
      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        finish({ ok: code === 0, output });
      });
    } catch (error) {
      finish({ ok: false, output: String(error) });
    }
  });
}
async function hasDeps(python) {
  const result = await spawnCapture(python, ["-c", "import cv2, numpy, scipy, PIL"], 3e4);
  return result.ok;
}
async function findUsablePython() {
  const candidates = [];
  if (bundledPython() && fs.existsSync(bundledPython())) candidates.push(bundledPython());
  const legacy = path.join(electron.app.getPath("userData"), "runtimes", "qwen-tts", "python", "python.exe");
  if (fs.existsSync(legacy)) candidates.push(legacy);
  for (const candidate of candidates) {
    if (await hasDeps(candidate)) return candidate;
  }
  for (const exe of await systemPythons()) {
    if (await hasDeps(exe)) return exe;
  }
  return null;
}
async function systemPythons() {
  const commands = process.platform === "win32" ? [{ command: "py", args: ["-3"] }, { command: "python", args: [] }] : [{ command: "python3", args: [] }, { command: "python", args: [] }];
  const found = [];
  for (const candidate of commands) {
    const probe = await spawnCapture(candidate.command, [...candidate.args, "-c", "import sys; print(sys.executable)"], 3e4);
    if (!probe.ok) continue;
    const exe = probe.output.trim().split(/\r?\n/).at(-1);
    if (exe && !found.includes(exe)) found.push(exe);
  }
  if (process.platform !== "win32") {
    const wellKnown = ["/opt/homebrew/bin/python3", "/usr/local/bin/python3", "/usr/bin/python3"];
    for (const exe of wellKnown) {
      if (fs.existsSync(exe) && !found.includes(exe)) found.push(exe);
    }
  }
  return found;
}
async function installDeps(python, onProgress) {
  onProgress?.("pip", 0, `Đang cài thư viện (${PYTHON_DEPS.join(", ")})...`);
  const pip = await spawnCapture(
    python,
    ["-m", "pip", "install", "--disable-pip-version-check", "--no-warn-script-location", ...PYTHON_DEPS],
    15 * 6e4
  );
  if (!pip.ok) throw new Error(`Cài thư viện thất bại: ${pip.output.slice(-800)}`);
  if (!await hasDeps(python)) throw new Error("Kiểm tra thư viện thất bại");
  fs.writeFileSync(depsOkMarker(), PYTHON_VERSION, "utf8");
}
async function baseInterpreter(onProgress) {
  try {
    return await ensureManagedPython((_stage, percent, message) => {
      onProgress?.("install", Math.min(0.2, percent / 100), message);
    });
  } catch (error) {
    console.warn("[WatermarkRuntime] Managed Python unavailable, falling back to system Python:", error);
    return (await systemPythons())[0] ?? null;
  }
}
async function bootstrapVenv(onProgress) {
  const base = await baseInterpreter(onProgress);
  if (!base) {
    throw new Error("Không tìm thấy Python 3 trên máy. Cài Python 3 (brew install python) rồi thử lại.");
  }
  const venvDir = path.join(runtimeRoot(), "venv");
  const python = bundledPython();
  if (!fs.existsSync(python)) {
    onProgress?.("install", 0.2, "Đang tạo môi trường Python...");
    fs.mkdirSync(runtimeRoot(), { recursive: true });
    const create = await spawnCapture(base, ["-m", "venv", venvDir], 5 * 6e4);
    if (!create.ok || !fs.existsSync(python)) {
      throw new Error(`Tạo môi trường Python thất bại: ${create.output.slice(-800)}`);
    }
  }
  await installDeps(python, onProgress);
  return python;
}
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    let current = url;
    let redirects = 0;
    const fetchOnce = (target) => {
      https.get(target, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          if (redirects >= 3) {
            reject(new Error("Quá nhiều chuyển hướng khi tải Python"));
            return;
          }
          const next = new URL(response.headers.location, target);
          if (next.protocol !== "https:" || !next.hostname.endsWith(".python.org")) {
            reject(new Error("Nguồn tải Python chuyển hướng tới địa chỉ không được phép"));
            return;
          }
          redirects += 1;
          fetchOnce(next.href);
          return;
        }
        if (!response.statusCode || response.statusCode !== 200) {
          reject(new Error(`Không thể tải Python (HTTP ${response.statusCode})`));
          return;
        }
        const total = Number(response.headers["content-length"] || 0);
        let received = 0;
        const file = fs.createWriteStream(dest);
        response.on("data", (chunk) => {
          received += chunk.length;
          if (total > 0) onProgress?.(Math.min(0.99, received / total));
        });
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            onProgress?.(1);
            resolve();
          });
        });
        file.on("error", reject);
      }).on("error", reject);
    };
    fetchOnce(current);
  });
}
let runtimePromise = null;
let lastBootstrapError = "";
function ensureWatermarkRuntime(onProgress) {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      try {
        const existing = await findUsablePython();
        if (existing) return existing;
        if (process.platform !== "win32") {
          const venvPython2 = await bootstrapVenv(onProgress);
          onProgress?.("ready", 1, "Runtime Python sẵn sàng");
          return venvPython2;
        }
        onProgress?.("download", 0, `Đang tải Python ${PYTHON_VERSION}...`);
        const root = runtimeRoot();
        fs.mkdirSync(root, { recursive: true });
        const installer = path.join(root, `python-${PYTHON_VERSION}-amd64.exe`);
        if (!fs.existsSync(installer)) {
          await downloadFile(PYTHON_WIN_URL, installer, (ratio) => {
            onProgress?.("download", ratio, `Đang tải Python ${PYTHON_VERSION} (${Math.round(ratio * 100)}%)...`);
          });
        }
        onProgress?.("install", 0.25, "Đang cài Python...");
        const installArgs = [
          "/quiet",
          "InstallAllUsers=0",
          "PrependPath=0",
          "Include_launcher=0",
          "Include_pip=1",
          `TargetDir=${root}\\python`
        ];
        const install = await spawnCapture(installer, installArgs, 5 * 6e4);
        if (!install.ok) throw new Error(`Cài Python thất bại: ${install.output.slice(-800)}`);
        const python = bundledPython();
        if (!python || !fs.existsSync(python)) throw new Error("Không tìm thấy Python sau khi cài");
        await installDeps(python, onProgress);
        try {
          fs.rmSync(installer, { force: true });
        } catch {
        }
        onProgress?.("ready", 1, "Runtime Python sẵn sàng");
        return python;
      } catch (error) {
        console.error("[WatermarkRuntime] Bootstrap failed:", error);
        lastBootstrapError = error instanceof Error ? error.message : String(error);
        runtimePromise = null;
        return null;
      }
    })();
  }
  return runtimePromise;
}
async function runWatermarkRemoval(inputPath, outputPath, box, onProgress) {
  const script = watermarkScriptPath();
  if (!fs.existsSync(script)) {
    return { ok: false, output: `Watermark script not found: ${script}` };
  }
  const python = await ensureWatermarkRuntime(onProgress);
  if (!python) {
    const detail = lastBootstrapError ? `: ${lastBootstrapError}` : " (xem log phía trên)";
    return { ok: false, output: `Không thể khởi tạo runtime Python${detail}` };
  }
  const scriptArgs = [script, inputPath, "-o", outputPath];
  if (box) scriptArgs.push("--box", box);
  const result = await spawnCapture(python, scriptArgs, 12e4);
  if (!result.ok && !fs.existsSync(outputPath)) {
    return { ok: false, output: result.output };
  }
  return result;
}
function registerWatermarkIpc(getMediaRoot2) {
  electron.ipcMain.handle("watermark-remove", async (event, localPath, box) => {
    const emit = (stage, ratio, message) => {
      try {
        event.sender.send("watermark-runtime-progress", { stage, ratio, message });
      } catch {
      }
    };
    try {
      const match = localPath.match(/^local-image:\/\/(.+)\/(.+)$/);
      if (!match) return { success: false, error: "Invalid local path" };
      const [, category, filename] = match;
      if (category !== "shots" && category !== "scenes" && category !== "characters") {
        return { success: false, error: `Unsupported media category: ${category}` };
      }
      const filePath = path.join(getMediaRoot2(), category, decodeURIComponent(filename));
      if (!fs.existsSync(filePath)) return { success: false, error: "Source image not found" };
      const validBox = box && /^\d+,\d+,\d+,\d+$/.test(box) ? box : void 0;
      const dir = path.join(getMediaRoot2(), "shots");
      fs.mkdirSync(dir, { recursive: true });
      const outName = `cleaned_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;
      const outPath = path.join(dir, outName);
      const result = await runWatermarkRemoval(filePath, outPath, validBox, emit);
      if (!result.ok || !fs.existsSync(outPath)) {
        if (result.output) console.warn("[WatermarkRemoval]", result.output);
        const reason = result.output.trim().split(/\r?\n/).filter(Boolean).at(-1);
        return { success: false, output: result.output, error: reason || "Watermark removal failed" };
      }
      return { success: true, localPath: `local-image://shots/${outName}`, output: result.output };
    } catch (error) {
      console.error("Failed to remove watermark:", error);
      return { success: false, error: String(error) };
    }
  });
}
const MEMORY_FILE_NAME = "memory.md";
const MAX_MEMORY_BYTES = 1024 * 1024;
const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_PREVIEW_BYTES = 12 * 1024 * 1024;
const MAX_MEDIA_PREVIEW_BYTES = 32 * 1024 * 1024;
const MAX_BUZZ_INPUT_FILES = 2e3;
const MAX_BUZZ_INPUT_BYTES = 512 * 1024 * 1024;
const BUZZ_IGNORED_NAMES = /* @__PURE__ */ new Set([".buzz", ".git", ".svn", ".hg", "node_modules", ".DS_Store", "Thumbs.db"]);
const TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".jsonc",
  ".csv",
  ".tsv",
  ".srt",
  ".vtt",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".html",
  ".xml",
  ".yaml",
  ".yml",
  ".py",
  ".sh",
  ".ps1",
  ".bat",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".java",
  ".go",
  ".rs",
  ".sql",
  ".toml",
  ".ini",
  ".env",
  ".log",
  ".svg",
  ".vue",
  ".svelte",
  ".astro",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".kts",
  ".dart",
  ".lua",
  ".r",
  ".m",
  ".mm",
  ".cs",
  ".fs",
  ".fsx",
  ".vb",
  ".gradle",
  ".properties",
  ".conf",
  ".config",
  ".lock",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".dockerfile"
]);
const IMAGE_MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
  ".ico": "image/x-icon"
};
const AUDIO_MIME_TYPES = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".opus": "audio/ogg"
};
const VIDEO_MIME_TYPES = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska"
};
function getDefaultWorkspacePath() {
  return path.join(electron.app.getPath("userData"), "content-chat", "workspace");
}
function resolveWorkspacePath(candidate) {
  return path.resolve(candidate?.trim() || getDefaultWorkspacePath());
}
function ensureWorkspace(candidate) {
  const workspacePath = resolveWorkspacePath(candidate);
  fs.mkdirSync(workspacePath, { recursive: true });
  const stats = fs.statSync(workspacePath);
  if (!stats.isDirectory()) throw new Error("Workspace path is not a directory");
  const memoryPath = path.join(workspacePath, MEMORY_FILE_NAME);
  if (!fs.existsSync(memoryPath)) fs.writeFileSync(memoryPath, "", "utf8");
  const memoryStats = fs.statSync(memoryPath);
  if (!memoryStats.isFile()) throw new Error("memory.md is not a file");
  if (memoryStats.size > MAX_MEMORY_BYTES) throw new Error("memory.md exceeds the 1 MB limit");
  return { path: workspacePath, memory: fs.readFileSync(memoryPath, "utf8") };
}
function resolveFileInWorkspace(workspaceRealPath, fileCandidate) {
  const cleaned = String(fileCandidate ?? "").trim().replace(/^[`'\"]+|[`'\"]+$/g, "");
  if (!cleaned) throw new Error("File path is required");
  const requestedPath = path.isAbsolute(cleaned) ? path.resolve(cleaned) : path.resolve(workspaceRealPath, cleaned.replace(/^\.([\\/])/, ""));
  if (!fs.existsSync(requestedPath)) throw new Error("File not found in this workspace");
  const fileRealPath = fs.realpathSync(requestedPath);
  const relative = path.relative(workspaceRealPath, fileRealPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("File is outside the active workspace");
  }
  const stats = fs.statSync(fileRealPath);
  if (!stats.isFile()) throw new Error("The selected path is not a file");
  return { filePath: fileRealPath, stats };
}
function resolveWorkspaceFile(workspaceCandidate, fileCandidate) {
  const workspace = ensureWorkspace(workspaceCandidate);
  const workspaceRealPath = fs.realpathSync(workspace.path);
  return { workspace, ...resolveFileInWorkspace(workspaceRealPath, fileCandidate) };
}
function looksLikeTextFile(filePath, size) {
  const descriptor = fs.openSync(filePath, "r");
  try {
    const sampleSize = Math.min(size, 8192);
    const sample = Buffer.alloc(sampleSize);
    fs.readSync(descriptor, sample, 0, sampleSize, 0);
    if (sample.includes(0)) return false;
    let controlBytes = 0;
    for (const byte of sample) {
      if (byte < 9 || byte > 13 && byte < 32) controlBytes += 1;
    }
    return sampleSize === 0 || controlBytes / sampleSize < 0.05;
  } finally {
    fs.closeSync(descriptor);
  }
}
function scanBuzzInput(sourcePath, kind) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) throw new Error("Đường dẫn không còn tồn tại");
  const rootStats = fs.statSync(resolved);
  if (kind === "file" && !rootStats.isFile()) throw new Error("Đầu vào phải là một file");
  if (kind === "folder" && !rootStats.isDirectory()) throw new Error("Đầu vào phải là một folder");
  if (rootStats.isFile()) return [{ relativePath: path.basename(resolved), size: rootStats.size, modifiedAt: rootStats.mtimeMs, sourcePath: resolved }];
  const files = [];
  let totalBytes = 0;
  const visit = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (BUZZ_IGNORED_NAMES.has(entry.name) || entry.isSymbolicLink()) continue;
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const stats = fs.statSync(entryPath);
      totalBytes += stats.size;
      if (files.length >= MAX_BUZZ_INPUT_FILES) throw new Error(`Folder vượt quá ${MAX_BUZZ_INPUT_FILES} file`);
      if (totalBytes > MAX_BUZZ_INPUT_BYTES) throw new Error("Folder vượt quá giới hạn 512 MB");
      files.push({
        relativePath: path.relative(resolved, entryPath),
        size: stats.size,
        modifiedAt: stats.mtimeMs,
        sourcePath: entryPath
      });
    }
  };
  visit(resolved);
  return files;
}
function fingerprintScannedFiles(kind, files) {
  const hash = crypto.createHash("sha256");
  hash.update(kind);
  for (const file of files) hash.update(`
${file.relativePath}\0${file.size}\0${Math.floor(file.modifiedAt)}`);
  return hash.digest("hex");
}
function isInsideDirectory(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function prepareBuzzInput(workspaceCandidate, input) {
  const workspace = ensureWorkspace(workspaceCandidate);
  const workspaceRoot = fs.realpathSync(workspace.path);
  const sourcePath = path.resolve(input.path);
  const files = scanBuzzInput(sourcePath, input.kind);
  const fingerprint = fingerprintScannedFiles(input.kind, files);
  const sourceRealPath = fs.realpathSync(sourcePath);
  const staged = !isInsideDirectory(workspaceRoot, sourceRealPath);
  let resolvedPath = sourceRealPath;
  if (staged) {
    const safeId = input.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const cacheRoot2 = path.join(workspaceRoot, ".buzz", "input-cache", safeId, fingerprint.slice(0, 16));
    resolvedPath = path.join(cacheRoot2, path.basename(sourceRealPath));
    if (!fs.existsSync(resolvedPath)) {
      if (input.kind === "file") {
        fs.mkdirSync(cacheRoot2, { recursive: true });
        fs.copyFileSync(sourceRealPath, resolvedPath);
      } else {
        fs.mkdirSync(resolvedPath, { recursive: true });
        for (const file of files) {
          const destination = path.join(resolvedPath, file.relativePath);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.copyFileSync(file.sourcePath, destination);
        }
      }
    }
  }
  return {
    nodeId: input.id,
    name: input.name,
    kind: input.kind,
    sourcePath: sourceRealPath,
    resolvedPath,
    staged,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    fingerprint,
    files: files.slice(0, 250).map((file) => file.relativePath),
    filesTruncated: files.length > 250
  };
}
function verifyBuzzOutput(workspaceCandidate, kind, outputPath, text) {
  if (kind === "text") {
    const value = String(text ?? "").trim();
    if (!value) return { valid: false, error: "Agent không trả về nội dung" };
    return {
      valid: true,
      kind,
      fileCount: 0,
      totalBytes: Buffer.byteLength(value, "utf8"),
      fingerprint: crypto.createHash("sha256").update(value).digest("hex")
    };
  }
  try {
    const workspace = ensureWorkspace(workspaceCandidate);
    const workspaceRoot = fs.realpathSync(workspace.path);
    const cleaned = String(outputPath ?? "").trim().replace(/^[`'"]+|[`'"]+$/g, "");
    if (!cleaned) throw new Error("Chưa đặt đường dẫn đầu ra");
    const candidate = path.isAbsolute(cleaned) ? path.resolve(cleaned) : path.resolve(workspaceRoot, cleaned);
    if (!isInsideDirectory(workspaceRoot, candidate)) throw new Error("Đầu ra phải nằm trong workspace");
    if (!fs.existsSync(candidate)) throw new Error(`${kind === "file" ? "File" : "Folder"} đầu ra chưa được tạo`);
    const stats = fs.statSync(candidate);
    if (kind === "file" && !stats.isFile()) throw new Error("Đường dẫn đầu ra không phải file");
    if (kind === "folder" && !stats.isDirectory()) throw new Error("Đường dẫn đầu ra không phải folder");
    const files = scanBuzzInput(candidate, kind);
    if (kind === "folder" && files.length === 0) throw new Error("Folder đầu ra đang rỗng");
    return {
      valid: true,
      kind,
      path: candidate,
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
      fingerprint: fingerprintScannedFiles(kind, files)
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}
function scanWorkspaceDirectory(dirPath, rootPath, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dirPath)) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes = [];
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
      return a.isDirectory() ? -1 : 1;
    });
    for (const entry of sorted) {
      if (entry.name.startsWith(".") && entry.name !== ".env") continue;
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "out" || entry.name === ".git") continue;
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(rootPath, fullPath);
      const isDir = entry.isDirectory();
      if (isDir) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          isDirectory: true,
          children: scanWorkspaceDirectory(fullPath, rootPath, maxDepth, currentDepth + 1)
        });
      } else {
        let size = 0;
        try {
          size = fs.statSync(fullPath).size;
        } catch {
        }
        nodes.push({
          name: entry.name,
          path: fullPath,
          relativePath: relPath,
          isDirectory: false,
          size,
          extension: path.extname(entry.name).toLowerCase()
        });
      }
    }
    return nodes;
  } catch {
    return [];
  }
}
function registerContentWorkspaceIpc() {
  electron.ipcMain.handle("content-workspace-get-default", () => ensureWorkspace());
  electron.ipcMain.handle("content-workspace-list-tree", (_event, candidate) => {
    const workspace = ensureWorkspace(candidate);
    return {
      workspacePath: workspace.path,
      tree: scanWorkspaceDirectory(workspace.path, workspace.path)
    };
  });
  electron.ipcMain.handle("content-workspace-ensure", (_event, candidate) => {
    return ensureWorkspace(candidate);
  });
  electron.ipcMain.handle("content-workspace-choose", async (_event, currentPath) => {
    const result = await electron.dialog.showOpenDialog({
      title: "Choose Content workspace",
      defaultPath: currentPath?.trim() || getDefaultWorkspacePath(),
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    return { canceled: false, ...ensureWorkspace(result.filePaths[0]) };
  });
  electron.ipcMain.handle("content-workspace-pick-input", async (_event, payload) => {
    const kind = payload?.kind === "folder" ? "folder" : "file";
    const workspace = ensureWorkspace(payload?.workspacePath);
    const currentPath = payload?.currentPath?.trim();
    const result = await electron.dialog.showOpenDialog({
      title: kind === "file" ? "Chọn file đầu vào" : "Chọn folder đầu vào",
      defaultPath: currentPath && fs.existsSync(currentPath) ? currentPath : workspace.path,
      properties: kind === "file" ? ["openFile"] : ["openDirectory"]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const selectedPath = path.resolve(result.filePaths[0]);
    return {
      canceled: false,
      path: selectedPath,
      name: path.basename(selectedPath)
    };
  });
  electron.ipcMain.handle("content-workspace-prepare-buzz-inputs", (_event, payload) => {
    const inputs = Array.isArray(payload?.inputs) ? payload.inputs : [];
    return inputs.map((input) => prepareBuzzInput(payload?.workspacePath, input));
  });
  electron.ipcMain.handle("content-workspace-verify-buzz-output", (_event, payload) => verifyBuzzOutput(payload?.workspacePath, payload?.kind ?? "text", payload?.outputPath, payload?.text));
  electron.ipcMain.handle("content-workspace-read-memory", (_event, candidate) => {
    return ensureWorkspace(candidate);
  });
  electron.ipcMain.handle("content-workspace-open", async (_event, candidate) => {
    const workspace = ensureWorkspace(candidate);
    const error = await electron.shell.openPath(workspace.path);
    return { success: !error, error: error || void 0 };
  });
  electron.ipcMain.handle("content-workspace-preview-file", (_event, payload) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath);
    const extension = path.extname(resolved.filePath).toLowerCase();
    const common = {
      success: true,
      path: resolved.filePath,
      name: path.basename(resolved.filePath),
      extension,
      size: resolved.stats.size
    };
    if (TEXT_EXTENSIONS.has(extension)) {
      const readBytes = Math.min(resolved.stats.size, MAX_TEXT_PREVIEW_BYTES);
      const descriptor = fs.openSync(resolved.filePath, "r");
      try {
        const buffer = Buffer.alloc(readBytes);
        fs.readSync(descriptor, buffer, 0, readBytes, 0);
        let content = buffer.toString("utf8");
        if (extension === ".json" && resolved.stats.size <= MAX_TEXT_PREVIEW_BYTES) {
          try {
            content = JSON.stringify(JSON.parse(content), null, 2);
          } catch {
          }
        }
        return { ...common, kind: "text", content, truncated: resolved.stats.size > readBytes };
      } finally {
        fs.closeSync(descriptor);
      }
    }
    const imageMimeType = IMAGE_MIME_TYPES[extension];
    if (imageMimeType) {
      if (resolved.stats.size > MAX_IMAGE_PREVIEW_BYTES) {
        return { ...common, kind: "unsupported", error: "Image exceeds the 12 MB preview limit" };
      }
      const data = fs.readFileSync(resolved.filePath).toString("base64");
      return { ...common, kind: "image", dataUrl: `data:${imageMimeType};base64,${data}`, truncated: false };
    }
    const mediaMimeType = AUDIO_MIME_TYPES[extension] || VIDEO_MIME_TYPES[extension] || (extension === ".pdf" ? "application/pdf" : "");
    if (mediaMimeType) {
      if (resolved.stats.size > MAX_MEDIA_PREVIEW_BYTES) {
        return { ...common, kind: "unsupported", error: "File exceeds the 32 MB in-app preview limit" };
      }
      const data = fs.readFileSync(resolved.filePath).toString("base64");
      const kind = extension === ".pdf" ? "pdf" : AUDIO_MIME_TYPES[extension] ? "audio" : "video";
      return { ...common, kind, mimeType: mediaMimeType, dataUrl: `data:${mediaMimeType};base64,${data}`, truncated: false };
    }
    if (looksLikeTextFile(resolved.filePath, resolved.stats.size)) {
      const readBytes = Math.min(resolved.stats.size, MAX_TEXT_PREVIEW_BYTES);
      const descriptor = fs.openSync(resolved.filePath, "r");
      try {
        const buffer = Buffer.alloc(readBytes);
        fs.readSync(descriptor, buffer, 0, readBytes, 0);
        return { ...common, kind: "text", content: buffer.toString("utf8"), truncated: resolved.stats.size > readBytes };
      } finally {
        fs.closeSync(descriptor);
      }
    }
    return { ...common, kind: "unsupported", error: "Preview is not available for this file type" };
  });
  electron.ipcMain.handle("content-workspace-resolve-files", (_event, payload) => {
    const filePaths = Array.isArray(payload?.filePaths) ? payload.filePaths.slice(0, 100) : [];
    if (filePaths.length === 0) return [];
    let workspaceRealPath;
    try {
      workspaceRealPath = fs.realpathSync(ensureWorkspace(payload?.workspacePath).path);
    } catch {
      return [];
    }
    const seen = /* @__PURE__ */ new Set();
    return filePaths.flatMap((requestedPath) => {
      const key = String(requestedPath ?? "").trim().toLowerCase();
      if (!key || seen.has(key)) return [];
      seen.add(key);
      try {
        const resolved = resolveFileInWorkspace(workspaceRealPath, requestedPath);
        return [{
          requestedPath,
          path: resolved.filePath,
          name: path.basename(resolved.filePath),
          extension: path.extname(resolved.filePath).toLowerCase(),
          size: resolved.stats.size
        }];
      } catch {
        return [];
      }
    });
  });
  electron.ipcMain.handle("content-workspace-open-file", async (_event, payload) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath);
    const error = await electron.shell.openPath(resolved.filePath);
    return { success: !error, error: error || void 0 };
  });
  electron.ipcMain.handle("content-workspace-reveal-file", (_event, payload) => {
    const resolved = resolveWorkspaceFile(payload?.workspacePath, payload?.filePath);
    electron.shell.showItemInFolder(resolved.filePath);
    return { success: true };
  });
  electron.ipcMain.handle("content-workspace-create-file", (_event, payload) => {
    const workspace = ensureWorkspace(payload?.workspacePath);
    const targetPath = path.resolve(workspace.path, payload.relativePath);
    if (!targetPath.startsWith(workspace.path)) throw new Error("Invalid file path outside workspace");
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, payload.initialContent ?? "", "utf8");
    }
    return { success: true, path: targetPath };
  });
  electron.ipcMain.handle("content-workspace-create-folder", (_event, payload) => {
    const workspace = ensureWorkspace(payload?.workspacePath);
    const targetPath = path.resolve(workspace.path, payload.relativePath);
    if (!targetPath.startsWith(workspace.path)) throw new Error("Invalid directory path outside workspace");
    fs.mkdirSync(targetPath, { recursive: true });
    return { success: true, path: targetPath };
  });
  electron.ipcMain.handle("content-workspace-delete-entry", (_event, payload) => {
    const workspace = ensureWorkspace(payload?.workspacePath);
    const targetPath = path.resolve(workspace.path, payload.relativePath);
    if (!targetPath.startsWith(workspace.path)) throw new Error("Invalid path outside workspace");
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    return { success: true };
  });
  electron.ipcMain.handle("content-workspace-write-memory", (_event, payload) => {
    const content = String(payload?.content ?? "");
    if (Buffer.byteLength(content, "utf8") > MAX_MEMORY_BYTES) {
      throw new Error("memory.md exceeds the 1 MB limit");
    }
    const workspace = ensureWorkspace(payload?.workspacePath);
    fs.writeFileSync(path.join(workspace.path, MEMORY_FILE_NAME), content, "utf8");
    return { path: workspace.path, memory: content };
  });
}
let quitCleanupStarted = false;
const gotSingleInstanceLock = electron.app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (_event, commandLine) => {
    const callbackUrl = findAuthCallbackArg(commandLine);
    if (callbackUrl) deliverAuthCallback(callbackUrl);
    focusMainWindow();
  });
}
electron.app.on("open-url", (event, url) => {
  event.preventDefault();
  deliverAuthCallback(url);
});
registerResourceMonitorIpc();
registerResearchDatabaseIpc();
registerMediaToolkitIpc();
registerWatermarkIpc(getMediaRoot);
registerContentWorkspaceIpc();
registerContentMcpGateway();
registerImageIpc();
registerFileStorageIpc();
registerStorageManagerIpc();
registerAppUpdaterIpc();
registerCliRuntimeIpc();
registerFFmpegIpc();
registerWhisperIpc();
registerTtsIpc();
registerRenderIpc();
registerAutopilotIpc();
registerFileExportIpc();
registerAutoEditIpc();
registerAutoEditProjectsIpc();
registerWindowLifecycle();
electron.app.on("before-quit", (event) => {
  if (quitCleanupStarted) return;
  quitCleanupStarted = true;
  event.preventDefault();
  broadcastToWindows("app-flush-storage");
  stopResourceMonitor();
  terminateAllManagedProcesses();
  const sessionManager = stopBrowserRuntimes();
  cancelAllFFmpeg();
  cancelAllTranscribes();
  cancelAllTtsJobs();
  cancelAllRenders();
  cancelAllMediaToolkitJobs();
  closeResearchDatabase();
  closeContentMcpGateway();
  void sessionManager?.shutdownAll().catch((error) => console.error("[video-studio][in-app-session] shutdown failed:", error)).finally(() => electron.app.quit());
  if (!sessionManager) electron.app.quit();
});
registerPrivilegedSchemes();
electron.app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return;
  if (process.defaultApp && process.argv[1]) {
    electron.app.setAsDefaultProtocolClient(AUTH_CALLBACK_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    electron.app.setAsDefaultProtocolClient(AUTH_CALLBACK_SCHEME);
  }
  registerAuthIpc();
  registerBrowserRuntimeIpc();
  registerAppProtocols();
  scheduleAutoClean();
  createMainWindow(flushPendingAuthCallback);
  startAutopilotServer();
  void autoUpdateYtDlp();
  const startupCallbackUrl = findAuthCallbackArg(process.argv);
  if (startupCallbackUrl) deliverAuthCallback(startupCallbackUrl);
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
exports.ffmpegRuntime = ffmpegRuntime;
