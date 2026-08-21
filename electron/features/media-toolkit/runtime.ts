import { app, BrowserWindow, dialog, ipcMain, session, shell, WebContentsView, type Rectangle, type WebContents } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import crypto from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { getMainWindow } from "../../app-window";
import { getFFmpegPath } from "../../ffmpeg-runtime";
import type {
  MediaDownloadRequest,
  MediaDownloadResult,
  MediaPlaylistInfo,
  MediaSourceInfo,
  MediaSubtitleTrack,
  MediaToolkitProgress,
  YouTubeProfile,
} from "../../../src/features/media-toolkit/types";

const jobs = new Map<string, ChildProcessWithoutNullStreams>();
let installPromise: Promise<string> | null = null;
let denoInstallPromise: Promise<string> | null = null;
let youtubeView: WebContentsView | null = null;
let youtubeParent: BrowserWindow | null = null;
let youtubeAttached = false;
let youtubeLoadError = "";
let youtubeProfileId = "default";
let youtubeBounds: Rectangle | null = null;

interface YouTubeProfileState {
  activeProfileId: string;
  profiles: YouTubeProfile[];
}

let profileState: YouTubeProfileState | null = null;

function profileStatePath() {
  return path.join(app.getPath("userData"), "media-toolkit-youtube-profiles.json");
}

function saveProfileState() {
  if (!profileState) return;
  fs.mkdirSync(path.dirname(profileStatePath()), { recursive: true });
  fs.writeFileSync(profileStatePath(), JSON.stringify(profileState, null, 2), "utf8");
}

function loadProfileState(): YouTubeProfileState {
  if (profileState) return profileState;
  try {
    const parsed = JSON.parse(fs.readFileSync(profileStatePath(), "utf8")) as YouTubeProfileState;
    if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
      const activeExists = parsed.profiles.some((profile) => profile.id === parsed.activeProfileId);
      profileState = { profiles: parsed.profiles, activeProfileId: activeExists ? parsed.activeProfileId : parsed.profiles[0].id };
      youtubeProfileId = profileState.activeProfileId;
      return profileState;
    }
  } catch {
    // First run preserves the existing YouTube session as Profile 1.
  }
  profileState = { activeProfileId: "default", profiles: [{ id: "default", name: "Profile 1", createdAt: Date.now() }] };
  youtubeProfileId = "default";
  saveProfileState();
  return profileState;
}

function youtubePartition(profileId: string) {
  return profileId === "default" ? "persist:media-toolkit-youtube" : `persist:media-toolkit-youtube-${profileId}`;
}

function publicProfileState() {
  const state = loadProfileState();
  return { activeProfileId: state.activeProfileId, profiles: state.profiles };
}

function isAllowedYouTubeNavigation(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return host === "youtu.be"
      || host.endsWith(".youtu.be")
      || host === "youtube.com"
      || host.endsWith(".youtube.com")
      || host === "google.com"
      || host.endsWith(".google.com")
      || host.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

function browserState(view: WebContentsView) {
  return {
    url: view.webContents.getURL(),
    title: view.webContents.getTitle(),
    canGoBack: view.webContents.canGoBack(),
    canGoForward: view.webContents.canGoForward(),
    loading: !youtubeLoadError && view.webContents.isLoading(),
    error: youtubeLoadError || undefined,
  };
}

function emitBrowserState(view: WebContentsView) {
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

function ensureYouTubeView(parent: BrowserWindow, profileId = loadProfileState().activeProfileId) {
  if (youtubeView && !youtubeView.webContents.isDestroyed() && youtubeProfileId === profileId) {
    youtubeParent = parent;
    return youtubeView;
  }
  destroyYouTubeView();
  youtubeProfileId = profileId;
  youtubeParent = parent;
  youtubeView = new WebContentsView({
    webPreferences: {
      partition: youtubePartition(profileId),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  const view = youtubeView;
  view.setBackgroundColor("#0f0f0f");
  view.webContents.setUserAgent(
    `Mozilla/5.0 (${process.platform === "win32" ? "Windows NT 10.0; Win64; x64" : "X11; Linux x86_64"}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`,
  );
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedYouTubeNavigation(url)) void view.webContents.loadURL(url);
    else if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  view.webContents.on("will-navigate", (event, url) => {
    if (isAllowedYouTubeNavigation(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
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

function safeViewBounds(parent: BrowserWindow, input: Rectangle, zoomFactor = 1): Rectangle {
  const content = parent.getContentBounds();
  const x = Math.max(0, Math.round((Number(input.x) || 0) * zoomFactor));
  const y = Math.max(0, Math.round((Number(input.y) || 0) * zoomFactor));
  return {
    x: Math.min(x, content.width),
    y: Math.min(y, content.height),
    width: Math.max(0, Math.min(Math.round((Number(input.width) || 0) * zoomFactor), content.width - x)),
    height: Math.max(0, Math.min(Math.round((Number(input.height) || 0) * zoomFactor), content.height - y)),
  };
}

function binaryName() {
  if (process.platform === "win32") return "yt-dlp.exe";
  return process.platform === "darwin" ? "yt-dlp_macos" : "yt-dlp";
}

function managedBinaryPath() {
  return path.join(app.getPath("userData"), "tools", binaryName());
}

function releaseUrl() {
  return `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName()}`;
}

function denoBinaryName() {
  return process.platform === "win32" ? "deno.exe" : "deno";
}

function managedDenoPath() {
  return path.join(app.getPath("userData"), "tools", denoBinaryName());
}

function denoReleaseUrl() {
  const architecture = process.arch === "arm64" ? "aarch64" : "x86_64";
  const target = process.platform === "win32"
    ? `${architecture}-pc-windows-msvc`
    : process.platform === "darwin"
      ? `${architecture}-apple-darwin`
      : `${architecture}-unknown-linux-gnu`;
  return `https://github.com/denoland/deno/releases/latest/download/deno-${target}.zip`;
}

async function extractDenoArchive(archivePath: string, destination: string) {
  const archive = await fs.promises.readFile(archivePath);
  let endOffset = archive.length - 22;
  while (endOffset >= Math.max(0, archive.length - 65_557) && archive.readUInt32LE(endOffset) !== 0x06054b50) endOffset -= 1;
  if (endOffset < 0 || archive.readUInt32LE(endOffset) !== 0x06054b50) throw new Error("Invalid Deno archive");
  const centralOffset = archive.readUInt32LE(endOffset + 16);
  const entryCount = archive.readUInt16LE(endOffset + 10);
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid Deno archive directory");
    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const fileName = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (path.basename(fileName).toLowerCase() === denoBinaryName().toLowerCase()) {
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Invalid Deno archive entry");
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
      const output = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
      if (!output) throw new Error(`Unsupported Deno archive compression method: ${method}`);
      await fs.promises.writeFile(destination, output);
      if (process.platform !== "win32") await fs.promises.chmod(destination, 0o755);
      return;
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error("Deno executable was not found in its archive");
}

function isYouTubeUrl(rawUrl: string) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host === "youtu.be" || host.endsWith(".youtu.be") || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

function cookieField(value: string) {
  return value.replace(/[\t\r\n]/g, "");
}

async function createYouTubeCookieFile(rawUrl: string, jobId: string): Promise<string | null> {
  if (!isYouTubeUrl(rawUrl)) return null;
  const youtubeSession = session.fromPartition(youtubePartition(loadProfileState().activeProfileId));
  const cookies = await youtubeSession.cookies.get({});
  const relevant = cookies.filter((cookie) => {
    if (!cookie.domain) return false;
    const domain = cookie.domain.replace(/^\./, "").toLowerCase();
    return domain === "youtube.com"
      || domain.endsWith(".youtube.com")
      || domain === "google.com"
      || domain.endsWith(".google.com")
      || domain.endsWith(".googleusercontent.com");
  });
  if (relevant.length === 0) return null;
  const directory = path.join(app.getPath("temp"), "logdd-media-toolkit");
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
      cookieField(cookie.value),
    ].join("\t");
  });
  await fs.promises.writeFile(filePath, `# Netscape HTTP Cookie File\n${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600 });
  return filePath;
}

function send(sender: WebContents, payload: MediaToolkitProgress) {
  if (!sender.isDestroyed()) sender.send("media-toolkit-event", payload);
}

function downloadFile(url: string, destination: string, onPercent: (value: number) => void, redirects = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("Too many redirects while installing yt-dlp"));
    const request = https.get(url, { headers: { "User-Agent": "logdd-media-toolkit" } }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        void downloadFile(next, destination, onPercent, redirects + 1).then(resolve, reject);
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
      response.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (total > 0) onPercent(Math.round((received / total) * 100));
      });
      response.pipe(stream);
      stream.on("finish", () => stream.close(() => resolve()));
      stream.on("error", reject);
    });
    request.on("error", reject);
  });
}

async function ensureYtDlp(sender?: WebContents, jobId = "setup"): Promise<string> {
  const managed = managedBinaryPath();
  if (fs.existsSync(managed)) return managed;
  if (installPromise) return installPromise;
  installPromise = (async () => {
    await fs.promises.mkdir(path.dirname(managed), { recursive: true });
    const temporary = `${managed}.download`;
    sender && send(sender, { jobId, stage: "installing", percent: 0, message: "Installing yt-dlp…" });
    try {
      await downloadFile(releaseUrl(), temporary, (percent) => {
        sender && send(sender, { jobId, stage: "installing", percent, message: "Installing yt-dlp…" });
      });
      await fs.promises.rename(temporary, managed);
      if (process.platform !== "win32") await fs.promises.chmod(managed, 0o755);
      return managed;
    } catch (error) {
      await fs.promises.rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    } finally {
      installPromise = null;
    }
  })();
  return installPromise;
}

async function ensureDeno(sender?: WebContents, jobId = "setup"): Promise<string> {
  const managed = managedDenoPath();
  if (fs.existsSync(managed)) return managed;
  if (denoInstallPromise) return denoInstallPromise;
  denoInstallPromise = (async () => {
    const toolsDirectory = path.dirname(managed);
    await fs.promises.mkdir(toolsDirectory, { recursive: true });
    const archive = path.join(toolsDirectory, `deno-${process.platform}-${process.arch}.zip.download`);
    sender && send(sender, { jobId, stage: "installing", percent: 0, message: "Installing YouTube JavaScript runtime…" });
    try {
      await downloadFile(denoReleaseUrl(), archive, (percent) => {
        sender && send(sender, { jobId, stage: "installing", percent, message: "Installing YouTube JavaScript runtime…" });
      });
      await extractDenoArchive(archive, managed);
      return managed;
    } catch (error) {
      await fs.promises.rm(managed, { force: true }).catch(() => undefined);
      throw error;
    } finally {
      await fs.promises.rm(archive, { force: true }).catch(() => undefined);
      denoInstallPromise = null;
    }
  })();
  return denoInstallPromise;
}

async function ytDlpVersion(binary: string): Promise<string | null> {
  const result = await run(binary, ["--version"]);
  if (result.code !== 0) return null;
  const version = result.stdout.trim();
  return version || null;
}

/**
 * Auto-update the managed yt-dlp binary using yt-dlp's own `--update`, then ask
 * the user to restart the app when a newer version was installed. Runs at startup
 * so no download job can be using the exe while it is being replaced. No-op when
 * the binary is missing (the install flow handles that) or a job is in flight.
 */
export async function autoUpdateYtDlp(): Promise<void> {
  const managed = managedBinaryPath();
  if (!fs.existsSync(managed) || jobs.size > 0) return;
  try {
    const before = await ytDlpVersion(managed);
    const result = await run(managed, ["--update"], "yt-dlp-auto-update");
    if (result.code !== 0) return;
    const after = await ytDlpVersion(managed);
    if (!after || after === before) return; // already up to date
    const options = {
      type: "info" as const,
      title: "yt-dlp đã được cập nhật",
      message: `yt-dlp được cập nhật từ ${before} lên ${after}.`,
      detail: "Khởi động lại ứng dụng để áp dụng bản cập nhật.",
      buttons: ["Khởi động lại ngay", "Để sau"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    };
    const parent = getMainWindow();
    const choice = parent
      ? await dialog.showMessageBox(parent, options)
      : await dialog.showMessageBox(options);
    if (choice.response === 0) {
      app.relaunch();
      app.quit();
    }
  } catch (error) {
    console.error("[media-toolkit] yt-dlp auto-update failed:", error);
  }
}

function run(binary: string, args: string[], jobId?: string, onLine?: (line: string) => void) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; canceled: boolean }>((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true });
    if (jobId) jobs.set(jobId, child);
    let stdout = "";
    let stderr = "";
    const consume = (kind: "stdout" | "stderr", chunk: Buffer) => {
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

function subtitleTracks(data: Record<string, unknown>): MediaSubtitleTrack[] {
  const tracks: MediaSubtitleTrack[] = [];
  for (const [key, automatic] of [["subtitles", false], ["automatic_captions", true]] as const) {
    const group = data[key];
    if (!group || typeof group !== "object") continue;
    for (const [language, entries] of Object.entries(group as Record<string, Array<Record<string, unknown>>>)) {
      tracks.push({
        language,
        label: String(entries?.[0]?.name || language),
        automatic,
        formats: [...new Set((entries || []).map((entry) => String(entry.ext || "")).filter(Boolean))],
      });
    }
  }
  return tracks.sort((a, b) => Number(a.automatic) - Number(b.automatic) || a.language.localeCompare(b.language));
}

async function analyze(sender: WebContents, jobId: string, url: string): Promise<{ success: boolean; info?: MediaSourceInfo; error?: string }> {
  let cookiePath: string | null = null;
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
    const data = JSON.parse(result.stdout) as Record<string, unknown>;
    const info: MediaSourceInfo = {
      id: String(data.id || ""),
      url,
      webpageUrl: String(data.webpage_url || url),
      title: String(data.title || "Untitled media"),
      uploader: data.uploader ? String(data.uploader) : undefined,
      duration: typeof data.duration === "number" ? data.duration : undefined,
      thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
      extractor: data.extractor_key ? String(data.extractor_key) : undefined,
      subtitles: subtitleTracks(data),
    };
    send(sender, { jobId, stage: "done", percent: 100 });
    return { success: true, info };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => undefined);
  }
}

async function analyzePlaylist(sender: WebContents, jobId: string, url: string): Promise<{ success: boolean; playlist?: MediaPlaylistInfo; error?: string }> {
  let cookiePath: string | null = null;
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
    const data = JSON.parse(result.stdout) as Record<string, unknown>;
    const rawEntries = Array.isArray(data.entries) ? data.entries as Array<Record<string, unknown>> : [];
    const entries = rawEntries
      .filter((entry) => entry && entry.id)
      .map((entry) => {
        const rawUrl = String(entry.webpage_url || entry.url || "");
        return {
          id: String(entry.id),
          title: String(entry.title || "Untitled video"),
          url: /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://www.youtube.com/watch?v=${entry.id}`,
          thumbnail: entry.thumbnail ? String(entry.thumbnail) : undefined,
          duration: typeof entry.duration === "number" ? entry.duration : undefined,
          uploader: entry.uploader ? String(entry.uploader) : undefined,
        };
      });
    const playlist: MediaPlaylistInfo = {
      id: String(data.id || ""),
      title: String(data.title || "Playlist"),
      url,
      entries,
    };
    send(sender, { jobId, stage: "done", percent: 100 });
    return { success: true, playlist };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => undefined);
  }
}

function outputTemplate(directory: string, suffix = "") {
  const safeSuffix = suffix.replace(/[\\/:*?"<>|%\r\n]+/g, "").slice(0, 40);
  return path.join(directory, `%(title).160B [%(id)s]${safeSuffix}.%(ext)s`);
}

function parseDestination(line: string) {
  const match = line.match(/__LOGDD_FILE__(.+)$/);
  return match?.[1]?.trim();
}

async function download(sender: WebContents, request: MediaDownloadRequest): Promise<MediaDownloadResult> {
  let cookiePath: string | null = null;
  try {
    const binary = await ensureYtDlp(sender, request.jobId);
    const deno = isYouTubeUrl(request.url) ? await ensureDeno(sender, request.jobId) : null;
    let directory = request.outputDirectory;
    if (!directory) {
      const selected = await dialog.showOpenDialog({ title: "Choose download folder", properties: ["openDirectory", "createDirectory"] });
      if (selected.canceled || !selected.filePaths[0]) return { success: false, canceled: true };
      directory = selected.filePaths[0];
    }
    const startedAt = Date.now();
    const args = [
      "--no-playlist", "--no-simulate", "--newline", "--progress",
      "--ffmpeg-location", getFFmpegPath(),
      "--print", "after_move:__LOGDD_FILE__%(filepath)s",
      "-o", outputTemplate(directory, request.outputSuffix),
    ];
    if (deno) args.push("--js-runtimes", `deno:${deno}`);
    cookiePath = await createYouTubeCookieFile(request.url, request.jobId);
    if (cookiePath) args.push("--cookies", cookiePath);
    const hasTimeRange = Boolean(request.startTime?.trim() || request.endTime?.trim());
    if (request.kind === "video") {
      const height = request.quality === "best" ? "" : request.quality;
      // Prefer H.264 (avc1) video + AAC (mp4a) audio so the file imports
      // cleanly into editors like Premiere, which reject AV1/Opus. YouTube
      // caps its H.264 streams at 1080p, so "best" resolves to the best H.264
      // stream instead of AV1. Fall back to any codec for the rare videos
      // that ship no H.264 stream at all.
      const format = height
        ? `bv*[vcodec^=avc1][height<=${height}]+ba[acodec^=mp4a]/bv*+ba/b[height<=${height}]`
        : `bv*[vcodec^=avc1]+ba[acodec^=mp4a]/bv*+ba/b`;
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
          "--downloader-args", "ffmpeg_o:-preset ultrafast -threads 0",
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
        percent: percent ? Number(percent) : undefined,
        message: line.replace(/\x1b\[[0-9;]*m/g, ""),
      });
    });
    if (result.canceled) return { success: false, canceled: true };
    if (result.code !== 0) return { success: false, error: result.stderr.trim() || "Download failed" };
    send(sender, { jobId: request.jobId, stage: "done", percent: 100, message: "Download complete" });
    if (request.kind === "subtitle" && (!filePath || !filePath.toLowerCase().endsWith(".srt"))) {
      const candidates = (await fs.promises.readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".srt"))
        .map((entry) => path.join(directory, entry.name));
      const recent = await Promise.all(candidates.map(async (candidate) => ({
        candidate,
        mtime: (await fs.promises.stat(candidate)).mtimeMs,
      })));
      filePath = recent
        .filter((item) => item.mtime >= startedAt - 1500)
        .sort((a, b) => b.mtime - a.mtime)[0]?.candidate || filePath;
    }
    if (request.kind === "thumbnail" && (!filePath || !/\.(?:jpe?g|png|webp)$/i.test(filePath))) {
      const candidates = (await fs.promises.readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && /\.(?:jpe?g|png|webp)$/i.test(entry.name))
        .map((entry) => path.join(directory, entry.name));
      const recent = await Promise.all(candidates.map(async (candidate) => ({
        candidate,
        mtime: (await fs.promises.stat(candidate)).mtimeMs,
      })));
      filePath = recent
        .filter((item) => item.mtime >= startedAt - 1500)
        .sort((a, b) => b.mtime - a.mtime)[0]?.candidate || filePath;
    }
    const subtitlePath = request.kind === "subtitle" && filePath.toLowerCase().endsWith(".srt") ? filePath : undefined;
    const srt = subtitlePath && fs.existsSync(subtitlePath) ? await fs.promises.readFile(subtitlePath, "utf8") : undefined;
    return { success: true, filePath: filePath || directory, srt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(sender, { jobId: request.jobId, stage: "error", message });
    return { success: false, error: message };
  } finally {
    if (cookiePath) await fs.promises.rm(cookiePath, { force: true }).catch(() => undefined);
  }
}

export function cancelAllMediaToolkitJobs() {
  for (const [jobId, child] of jobs) {
    jobs.delete(jobId);
    child.kill();
  }
  if (youtubeView && !youtubeView.webContents.isDestroyed()) youtubeView.webContents.close();
  youtubeView = null;
  youtubeParent = null;
  youtubeAttached = false;
}

export function registerMediaToolkitIpc() {
  ipcMain.handle("media-toolkit-profiles-list", async () => publicProfileState());
  ipcMain.handle("media-toolkit-profiles-create", async (event) => {
    const state = loadProfileState();
    const profile: YouTubeProfile = { id: crypto.randomUUID(), name: `Profile ${state.profiles.length + 1}`, createdAt: Date.now() };
    state.profiles.push(profile);
    state.activeProfileId = profile.id;
    saveProfileState();
    const parent = BrowserWindow.fromWebContents(event.sender);
    if (parent) {
      const view = ensureYouTubeView(parent, profile.id);
      parent.contentView.addChildView(view);
      youtubeAttached = true;
      if (youtubeBounds) view.setBounds(youtubeBounds);
    }
    return publicProfileState();
  });
  ipcMain.handle("media-toolkit-profiles-switch", async (event, profileId: string) => {
    const state = loadProfileState();
    if (!state.profiles.some((profile) => profile.id === profileId)) throw new Error("YouTube profile not found");
    state.activeProfileId = profileId;
    saveProfileState();
    const parent = BrowserWindow.fromWebContents(event.sender);
    if (parent) {
      const view = ensureYouTubeView(parent, profileId);
      parent.contentView.addChildView(view);
      youtubeAttached = true;
      if (youtubeBounds) view.setBounds(youtubeBounds);
    }
    return publicProfileState();
  });
  ipcMain.handle("media-toolkit-profiles-rename", async (_event, payload: { profileId: string; name: string }) => {
    const state = loadProfileState();
    const profile = state.profiles.find((item) => item.id === payload.profileId);
    if (!profile) throw new Error("YouTube profile not found");
    const name = payload.name.trim().slice(0, 40);
    if (!name) throw new Error("Profile name is required");
    profile.name = name;
    saveProfileState();
    return publicProfileState();
  });
  ipcMain.handle("media-toolkit-profiles-delete", async (event, profileId: string) => {
    const state = loadProfileState();
    if (state.profiles.length <= 1) throw new Error("At least one profile is required");
    const index = state.profiles.findIndex((profile) => profile.id === profileId);
    if (index < 0) throw new Error("YouTube profile not found");
    const wasActive = state.activeProfileId === profileId;
    state.profiles.splice(index, 1);
    if (wasActive) state.activeProfileId = state.profiles[0].id;
    saveProfileState();
    if (wasActive) {
      const parent = BrowserWindow.fromWebContents(event.sender);
      if (parent) {
        const view = ensureYouTubeView(parent, state.activeProfileId);
        parent.contentView.addChildView(view);
        youtubeAttached = true;
        if (youtubeBounds) view.setBounds(youtubeBounds);
      }
    }
    await session.fromPartition(youtubePartition(profileId)).clearStorageData();
    return publicProfileState();
  });
  ipcMain.handle("media-toolkit-browser-show", async (event, bounds: Rectangle) => {
    const parent = BrowserWindow.fromWebContents(event.sender);
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
  ipcMain.handle("media-toolkit-browser-bounds", async (event, bounds: Rectangle) => {
    if (!youtubeView || !youtubeParent || !youtubeAttached) return { success: false };
    youtubeBounds = safeViewBounds(youtubeParent, bounds, event.sender.getZoomFactor());
    youtubeView.setBounds(youtubeBounds);
    return { success: true };
  });
  ipcMain.handle("media-toolkit-browser-hide", async () => {
    if (youtubeView && youtubeParent && youtubeAttached) {
      youtubeParent.contentView.removeChildView(youtubeView);
      youtubeAttached = false;
    }
    return { success: true };
  });
  ipcMain.handle("media-toolkit-browser-action", async (_event, action: "back" | "forward" | "reload" | "home") => {
    if (!youtubeView) return { success: false };
    if (action === "back" && youtubeView.webContents.canGoBack()) youtubeView.webContents.goBack();
    if (action === "forward" && youtubeView.webContents.canGoForward()) youtubeView.webContents.goForward();
    if (action === "reload") youtubeView.webContents.reload();
    if (action === "home") await youtubeView.webContents.loadURL("https://www.youtube.com/");
    return { success: true };
  });
  ipcMain.handle("media-toolkit-browser-navigate", async (_event, url: string) => {
    if (!youtubeView || !isAllowedYouTubeNavigation(url)) return { success: false, error: "Only YouTube/Google navigation is allowed" };
    await youtubeView.webContents.loadURL(url);
    return { success: true };
  });
  ipcMain.handle("media-toolkit-status", async () => ({ installed: fs.existsSync(managedBinaryPath()) }));
  ipcMain.handle("media-toolkit-install", async (event, jobId: string) => {
    try {
      await ensureYtDlp(event.sender, jobId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  ipcMain.handle("media-toolkit-analyze", (event, payload: { jobId: string; url: string }) => analyze(event.sender, payload.jobId, payload.url));
  ipcMain.handle("media-toolkit-analyze-playlist", (event, payload: { jobId: string; url: string }) => analyzePlaylist(event.sender, payload.jobId, payload.url));
  ipcMain.handle("media-toolkit-choose-directory", async () => {
    const selected = await dialog.showOpenDialog({ title: "Choose download folder", properties: ["openDirectory", "createDirectory"] });
    if (selected.canceled || !selected.filePaths[0]) return { success: false, canceled: true };
    return { success: true, directory: selected.filePaths[0] };
  });
  ipcMain.handle("media-toolkit-download", (event, payload: MediaDownloadRequest) => download(event.sender, payload));
  ipcMain.handle("media-toolkit-cancel", async (_event, jobId: string) => {
    const child = jobs.get(jobId);
    if (!child) return { canceled: false };
    jobs.delete(jobId);
    child.kill();
    return { canceled: true };
  });
  ipcMain.handle("media-toolkit-save-subtitle", async (_event, payload: { srt: string; defaultName: string }) => {
    const result = await dialog.showSaveDialog({ defaultPath: payload.defaultName, filters: [{ name: "SubRip subtitle", extensions: ["srt"] }] });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };
    await fs.promises.writeFile(result.filePath, payload.srt, "utf8");
    return { success: true, filePath: result.filePath };
  });
  ipcMain.handle("media-toolkit-reveal", async (_event, filePath: string) => {
    if (fs.existsSync(filePath) && (await fs.promises.stat(filePath)).isFile()) shell.showItemInFolder(filePath);
    else await shell.openPath(filePath);
    return { success: true };
  });
  ipcMain.handle("media-toolkit-open-source", async (_event, url: string) => {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL");
    await shell.openExternal(parsed.toString());
    return { success: true };
  });
}
