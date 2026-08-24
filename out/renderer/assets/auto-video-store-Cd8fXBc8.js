import { p as persist, d as createJSONStorage, g as generateUUID, f as fileStorage } from "./index-ld1jMZXM.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { g as getDefaultExportFromCjs, aw as commonjsGlobal } from "./lucide-react-DHCwBhKI.js";
const DEFAULT_PROJECT = {
  id: "default-project",
  name: "LONGDD Project",
  createdAt: Date.now(),
  updatedAt: Date.now()
};
const useProjectStore = create()(
  persist(
    (set, get) => ({
      projects: [DEFAULT_PROJECT],
      activeProjectId: DEFAULT_PROJECT.id,
      activeProject: DEFAULT_PROJECT,
      ensureDefaultProject: () => {
        const { projects, activeProjectId } = get();
        if (projects.length === 0) {
          set({
            projects: [DEFAULT_PROJECT],
            activeProjectId: DEFAULT_PROJECT.id,
            activeProject: DEFAULT_PROJECT
          });
          return;
        }
        if (!activeProjectId) {
          set({
            activeProjectId: projects[0].id,
            activeProject: projects[0]
          });
        }
      },
      createProject: (name) => {
        const newProject = {
          id: generateUUID(),
          name: name?.trim() || `New Project ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set((state) => ({
          projects: [newProject, ...state.projects]
          // Do not set activeProjectId here. Project switching is handled elsewhere to avoid skipping rehydration when the id matches.
        }));
        return newProject;
      },
      renameProject: (id, name) => {
        set((state) => ({
          projects: state.projects.map(
            (p) => p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
          activeProject: state.activeProject?.id === id ? { ...state.activeProject, name, updatedAt: Date.now() } : state.activeProject
        }));
      },
      deleteProject: (id) => {
        set((state) => {
          const remaining = state.projects.filter((p) => p.id !== id);
          const nextActive = state.activeProjectId === id ? remaining[0] || null : state.activeProject;
          return {
            projects: remaining,
            activeProjectId: nextActive?.id || null,
            activeProject: nextActive
          };
        });
        if (window.fileStorage?.removeDir) {
          window.fileStorage.removeDir(`_p/${id}`).catch(
            (err) => console.warn(`[ProjectStore] Failed to remove project dir _p/${id}:`, err)
          );
        }
      },
      setActiveProject: (id) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id) || null;
          return {
            activeProjectId: project?.id || null,
            activeProject: project
          };
        });
      }
    }),
    {
      name: "longdd-project-store",
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId
      }),
      migrate: (persisted) => {
        if (persisted?.projects && persisted.projects.length > 0) {
          return persisted;
        }
        return {
          projects: [DEFAULT_PROJECT],
          activeProjectId: DEFAULT_PROJECT.id
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const project = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0] || null;
        state.activeProjectId = project?.id || null;
        state.activeProject = project;
        discoverProjectsFromDisk().catch(
          (err) => console.warn("[ProjectStore] Disk discovery failed:", err)
        );
      }
    }
  )
);
async function discoverProjectsFromDisk() {
  if (!window.fileStorage?.listDirs) return;
  try {
    const diskProjectIds = await window.fileStorage.listDirs("_p");
    if (!diskProjectIds || diskProjectIds.length === 0) return;
    const { projects } = useProjectStore.getState();
    const coreStoreById = /* @__PURE__ */ new Map();
    await Promise.all(diskProjectIds.map(async (pid) => {
      const [scriptRaw, directorRaw] = await Promise.all([
        readFirstProjectStore(pid, ["script", "script-store"]),
        readFirstProjectStore(pid, ["director", "director-store"])
      ]);
      coreStoreById.set(pid, { scriptRaw, directorRaw });
    }));
    const hasCoreStore = (id) => {
      const stores = coreStoreById.get(id);
      return Boolean(stores?.scriptRaw || stores?.directorRaw);
    };
    const staleRecoveredIds = new Set(
      projects.filter(
        (project) => project.name.startsWith("Recovered Project (") && diskProjectIds.includes(project.id) && !hasCoreStore(project.id)
      ).map((project) => project.id)
    );
    if (staleRecoveredIds.size > 0) {
      useProjectStore.setState((state) => {
        const remaining = state.projects.filter((project) => !staleRecoveredIds.has(project.id));
        const activeWasRemoved = state.activeProjectId !== null && staleRecoveredIds.has(state.activeProjectId);
        const nextActive = activeWasRemoved ? remaining[0] || null : state.activeProject;
        return {
          projects: remaining,
          activeProjectId: nextActive?.id || null,
          activeProject: nextActive
        };
      });
      console.log(
        "[ProjectStore] Hid resource-only recovered entries:",
        [...staleRecoveredIds].map((id) => id.substring(0, 8))
      );
    }
    const currentProjects = useProjectStore.getState().projects;
    const knownIds = new Set(currentProjects.map((p) => p.id));
    const missingIds = diskProjectIds.filter((id) => !knownIds.has(id) && hasCoreStore(id));
    if (missingIds.length === 0) return;
    console.log(
      `[ProjectStore] Found ${missingIds.length} projects on disk not in store:`,
      missingIds.map((id) => id.substring(0, 8))
    );
    const recoveredProjects = [];
    for (const pid of missingIds) {
      let name = `Recovered Project (${pid.substring(0, 8)})`;
      const createdAt = Date.now();
      const coreStores = coreStoreById.get(pid);
      try {
        const scriptRaw = coreStores?.scriptRaw;
        if (scriptRaw) {
          const parsed = JSON.parse(scriptRaw);
          const state = parsed?.state ?? parsed;
          if (state?.projects?.[pid]?.title) {
            name = state.projects[pid].title;
          }
        }
      } catch {
      }
      try {
        const directorRaw = coreStores?.directorRaw;
        if (directorRaw) {
          const parsed = JSON.parse(directorRaw);
          const state = parsed?.state ?? parsed;
          const screenplay = state?.projectData?.screenplay ?? state?.projects?.[pid]?.screenplay;
          if (screenplay) {
            if (!name.includes("Recovered Project")) {
            } else if (screenplay) {
              const preview = screenplay.substring(0, 20).replace(/\n/g, " ").trim();
              if (preview) name = preview + "...";
            }
          }
        }
      } catch {
      }
      recoveredProjects.push({
        id: pid,
        name,
        createdAt,
        updatedAt: Date.now()
      });
    }
    if (recoveredProjects.length > 0) {
      useProjectStore.setState((state) => ({
        projects: [...state.projects, ...recoveredProjects]
      }));
      console.log(
        `[ProjectStore] Recovered ${recoveredProjects.length} projects from disk:`,
        recoveredProjects.map((p) => `${p.id.substring(0, 8)}:${p.name}`)
      );
    }
  } catch (err) {
    console.error("[ProjectStore] discoverProjectsFromDisk error:", err);
  }
}
async function readFirstProjectStore(projectId, storeNames) {
  for (const storeName of storeNames) {
    try {
      const raw = await window.fileStorage?.getItem(`_p/${projectId}/${storeName}`);
      if (raw) return raw;
    } catch {
    }
  }
  return null;
}
const VOICE_OVER_MARKER_RE = /\bVoice\s+Over\s*[:：]\s*/i;
function cleanVoiceOverText(value) {
  return String(value ?? "").trim().replace(/^(?:"|“|'|‘)\s*/, "").replace(/\s*(?:"|”|'|’)$/, "").replace(/\\(["'])/g, "$1").trim();
}
function splitVideoPromptVoiceOver(prompt) {
  const source = String(prompt ?? "");
  const match = source.match(VOICE_OVER_MARKER_RE);
  if (!match || match.index === void 0) {
    return {
      videoPrompt: source.trim(),
      voiceOver: ""
    };
  }
  const markerEnd = match.index + match[0].length;
  return {
    videoPrompt: source.slice(0, match.index).trim(),
    voiceOver: cleanVoiceOverText(source.slice(markerEnd))
  };
}
function buildPromptVoiceOverSuffix(voiceOver) {
  const cleaned = cleanVoiceOverText(voiceOver);
  return cleaned ? `Voice Over: "${cleaned.replace(/"/g, '\\"')}"` : "";
}
function mergeVideoPromptVoiceOver(videoPrompt, voiceOver) {
  const parts = splitVideoPromptVoiceOver(videoPrompt);
  const suffix = buildPromptVoiceOverSuffix(cleanVoiceOverText(voiceOver) || parts.voiceOver);
  return [parts.videoPrompt, suffix].filter(Boolean).join(" ");
}
const AUTO_VIDEO_MEDIA_EFFECTS = [
  "none",
  "zoom_in",
  "zoom_out",
  "pan_left",
  "pan_right",
  "pan_up",
  "pan_down",
  "zoom_pan_left",
  "zoom_pan_right"
];
const AUTO_VIDEO_TRANSITIONS = [
  "none",
  "fade",
  "fade_slow",
  "dip_white",
  "flash_white",
  "dissolve",
  "fade_black",
  "fade_white",
  "wipe_left",
  "wipe_right",
  "wipe_up",
  "wipe_down",
  "slide_left",
  "slide_right",
  "smooth_left",
  "smooth_right",
  "circle_open",
  "circle_close",
  "pixelize",
  "zoom_in"
];
const DEFAULT_RENDER_SETTINGS = {
  resolution: "1920x1080",
  fps: 30,
  codec: "libx264",
  crf: 23,
  burnSubtitles: false,
  subtitleFontSize: 0,
  bgmPath: "",
  bgmVolume: 0.25,
  bgmDuckVoice: true,
  audioNormalize: false,
  videoAudioVolume: 0
};
const TIME_RE = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/;
function parseSrt(raw) {
  const cleaned = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = cleaned.split(/\n\s*\n/);
  const segments = [];
  const errors = [];
  let nextIndex = 1;
  for (let bi = 0; bi < blocks.length; bi += 1) {
    const block = blocks[bi].trim();
    if (!block) continue;
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) continue;
    let timeLineIdx = 0;
    if (TIME_RE.test(lines[0])) {
      timeLineIdx = 0;
    } else if (lines.length >= 2 && TIME_RE.test(lines[1])) {
      timeLineIdx = 1;
    } else {
      errors.push({ blockIndex: bi, message: "No time line in block" });
      continue;
    }
    const m = lines[timeLineIdx].match(TIME_RE);
    if (!m) {
      errors.push({ blockIndex: bi, message: "Failed to parse time line" });
      continue;
    }
    const startMs = toMs(m[1], m[2], m[3], m[4]);
    const endMs = toMs(m[5], m[6], m[7], m[8]);
    if (endMs < startMs) {
      errors.push({ blockIndex: bi, message: `End before start: ${lines[timeLineIdx]}` });
      continue;
    }
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join(" ").trim();
    if (!text) continue;
    segments.push({
      index: nextIndex,
      startMs,
      endMs,
      text
    });
    nextIndex += 1;
  }
  return { segments, errors };
}
function toMs(h, m, s, frac) {
  const hour = parseInt(h, 10) || 0;
  const min = parseInt(m, 10) || 0;
  const sec = parseInt(s, 10) || 0;
  const fracMs = parseInt((frac + "000").slice(0, 3), 10) || 0;
  return (hour * 3600 + min * 60 + sec) * 1e3 + fracMs;
}
var papaparse_min = { exports: {} };
/* @license
Papa Parse
v5.5.3
https://github.com/mholt/PapaParse
License: MIT
*/
(function(module, exports$1) {
  ((e, t) => {
    module.exports = t();
  })(commonjsGlobal, function r() {
    var n = "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== n ? n : {};
    var d, s = !n.document && !!n.postMessage, a = n.IS_PAPA_WORKER || false, o = {}, h = 0, v = {};
    function u(e) {
      this._handle = null, this._finished = false, this._completed = false, this._halted = false, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = true, this._completeResults = { data: [], errors: [], meta: {} }, function(e2) {
        var t = b(e2);
        t.chunkSize = parseInt(t.chunkSize), e2.step || e2.chunk || (t.chunkSize = null);
        this._handle = new i(t), (this._handle.streamer = this)._config = t;
      }.call(this, e), this.parseChunk = function(t, e2) {
        var i2 = parseInt(this._config.skipFirstNLines) || 0;
        if (this.isFirstChunk && 0 < i2) {
          let e3 = this._config.newline;
          e3 || (r2 = this._config.quoteChar || '"', e3 = this._handle.guessLineEndings(t, r2)), t = [...t.split(e3).slice(i2)].join(e3);
        }
        this.isFirstChunk && U(this._config.beforeFirstChunk) && void 0 !== (r2 = this._config.beforeFirstChunk(t)) && (t = r2), this.isFirstChunk = false, this._halted = false;
        var i2 = this._partialLine + t, r2 = (this._partialLine = "", this._handle.parse(i2, this._baseIndex, !this._finished));
        if (!this._handle.paused() && !this._handle.aborted()) {
          t = r2.meta.cursor, i2 = (this._finished || (this._partialLine = i2.substring(t - this._baseIndex), this._baseIndex = t), r2 && r2.data && (this._rowCount += r2.data.length), this._finished || this._config.preview && this._rowCount >= this._config.preview);
          if (a) n.postMessage({ results: r2, workerId: v.WORKER_ID, finished: i2 });
          else if (U(this._config.chunk) && !e2) {
            if (this._config.chunk(r2, this._handle), this._handle.paused() || this._handle.aborted()) return void (this._halted = true);
            this._completeResults = r2 = void 0;
          }
          return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(r2.data), this._completeResults.errors = this._completeResults.errors.concat(r2.errors), this._completeResults.meta = r2.meta), this._completed || !i2 || !U(this._config.complete) || r2 && r2.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = true), i2 || r2 && r2.meta.paused || this._nextChunk(), r2;
        }
        this._halted = true;
      }, this._sendError = function(e2) {
        U(this._config.error) ? this._config.error(e2) : a && this._config.error && n.postMessage({ workerId: v.WORKER_ID, error: e2, finished: false });
      };
    }
    function f(e) {
      var r2;
      (e = e || {}).chunkSize || (e.chunkSize = v.RemoteChunkSize), u.call(this, e), this._nextChunk = s ? function() {
        this._readChunk(), this._chunkLoaded();
      } : function() {
        this._readChunk();
      }, this.stream = function(e2) {
        this._input = e2, this._nextChunk();
      }, this._readChunk = function() {
        if (this._finished) this._chunkLoaded();
        else {
          if (r2 = new XMLHttpRequest(), this._config.withCredentials && (r2.withCredentials = this._config.withCredentials), s || (r2.onload = y(this._chunkLoaded, this), r2.onerror = y(this._chunkError, this)), r2.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !s), this._config.downloadRequestHeaders) {
            var e2, t = this._config.downloadRequestHeaders;
            for (e2 in t) r2.setRequestHeader(e2, t[e2]);
          }
          var i2;
          this._config.chunkSize && (i2 = this._start + this._config.chunkSize - 1, r2.setRequestHeader("Range", "bytes=" + this._start + "-" + i2));
          try {
            r2.send(this._config.downloadRequestBody);
          } catch (e3) {
            this._chunkError(e3.message);
          }
          s && 0 === r2.status && this._chunkError();
        }
      }, this._chunkLoaded = function() {
        4 === r2.readyState && (r2.status < 200 || 400 <= r2.status ? this._chunkError() : (this._start += this._config.chunkSize || r2.responseText.length, this._finished = !this._config.chunkSize || this._start >= ((e2) => null !== (e2 = e2.getResponseHeader("Content-Range")) ? parseInt(e2.substring(e2.lastIndexOf("/") + 1)) : -1)(r2), this.parseChunk(r2.responseText)));
      }, this._chunkError = function(e2) {
        e2 = r2.statusText || e2;
        this._sendError(new Error(e2));
      };
    }
    function l(e) {
      (e = e || {}).chunkSize || (e.chunkSize = v.LocalChunkSize), u.call(this, e);
      var i2, r2, n2 = "undefined" != typeof FileReader;
      this.stream = function(e2) {
        this._input = e2, r2 = e2.slice || e2.webkitSlice || e2.mozSlice, n2 ? ((i2 = new FileReader()).onload = y(this._chunkLoaded, this), i2.onerror = y(this._chunkError, this)) : i2 = new FileReaderSync(), this._nextChunk();
      }, this._nextChunk = function() {
        this._finished || this._config.preview && !(this._rowCount < this._config.preview) || this._readChunk();
      }, this._readChunk = function() {
        var e2 = this._input, t = (this._config.chunkSize && (t = Math.min(this._start + this._config.chunkSize, this._input.size), e2 = r2.call(e2, this._start, t)), i2.readAsText(e2, this._config.encoding));
        n2 || this._chunkLoaded({ target: { result: t } });
      }, this._chunkLoaded = function(e2) {
        this._start += this._config.chunkSize, this._finished = !this._config.chunkSize || this._start >= this._input.size, this.parseChunk(e2.target.result);
      }, this._chunkError = function() {
        this._sendError(i2.error);
      };
    }
    function c(e) {
      var i2;
      u.call(this, e = e || {}), this.stream = function(e2) {
        return i2 = e2, this._nextChunk();
      }, this._nextChunk = function() {
        var e2, t;
        if (!this._finished) return e2 = this._config.chunkSize, i2 = e2 ? (t = i2.substring(0, e2), i2.substring(e2)) : (t = i2, ""), this._finished = !i2, this.parseChunk(t);
      };
    }
    function p(e) {
      u.call(this, e = e || {});
      var t = [], i2 = true, r2 = false;
      this.pause = function() {
        u.prototype.pause.apply(this, arguments), this._input.pause();
      }, this.resume = function() {
        u.prototype.resume.apply(this, arguments), this._input.resume();
      }, this.stream = function(e2) {
        this._input = e2, this._input.on("data", this._streamData), this._input.on("end", this._streamEnd), this._input.on("error", this._streamError);
      }, this._checkIsFinished = function() {
        r2 && 1 === t.length && (this._finished = true);
      }, this._nextChunk = function() {
        this._checkIsFinished(), t.length ? this.parseChunk(t.shift()) : i2 = true;
      }, this._streamData = y(function(e2) {
        try {
          t.push("string" == typeof e2 ? e2 : e2.toString(this._config.encoding)), i2 && (i2 = false, this._checkIsFinished(), this.parseChunk(t.shift()));
        } catch (e3) {
          this._streamError(e3);
        }
      }, this), this._streamError = y(function(e2) {
        this._streamCleanUp(), this._sendError(e2);
      }, this), this._streamEnd = y(function() {
        this._streamCleanUp(), r2 = true, this._streamData("");
      }, this), this._streamCleanUp = y(function() {
        this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError);
      }, this);
    }
    function i(m2) {
      var n2, s2, a2, t, o2 = Math.pow(2, 53), h2 = -o2, u2 = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/, d2 = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/, i2 = this, r2 = 0, f2 = 0, l2 = false, e = false, c2 = [], p2 = { data: [], errors: [], meta: {} };
      function y2(e2) {
        return "greedy" === m2.skipEmptyLines ? "" === e2.join("").trim() : 1 === e2.length && 0 === e2[0].length;
      }
      function g2() {
        if (p2 && a2 && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + v.DefaultDelimiter + "'"), a2 = false), m2.skipEmptyLines && (p2.data = p2.data.filter(function(e3) {
          return !y2(e3);
        })), _2()) {
          let t2 = function(e3, t3) {
            U(m2.transformHeader) && (e3 = m2.transformHeader(e3, t3)), c2.push(e3);
          };
          if (p2) if (Array.isArray(p2.data[0])) {
            for (var e2 = 0; _2() && e2 < p2.data.length; e2++) p2.data[e2].forEach(t2);
            p2.data.splice(0, 1);
          } else p2.data.forEach(t2);
        }
        function i3(e3, t2) {
          for (var i4 = m2.header ? {} : [], r4 = 0; r4 < e3.length; r4++) {
            var n3 = r4, s3 = e3[r4], s3 = ((e4, t3) => ((e5) => (m2.dynamicTypingFunction && void 0 === m2.dynamicTyping[e5] && (m2.dynamicTyping[e5] = m2.dynamicTypingFunction(e5)), true === (m2.dynamicTyping[e5] || m2.dynamicTyping)))(e4) ? "true" === t3 || "TRUE" === t3 || "false" !== t3 && "FALSE" !== t3 && (((e5) => {
              if (u2.test(e5)) {
                e5 = parseFloat(e5);
                if (h2 < e5 && e5 < o2) return 1;
              }
            })(t3) ? parseFloat(t3) : d2.test(t3) ? new Date(t3) : "" === t3 ? null : t3) : t3)(n3 = m2.header ? r4 >= c2.length ? "__parsed_extra" : c2[r4] : n3, s3 = m2.transform ? m2.transform(s3, n3) : s3);
            "__parsed_extra" === n3 ? (i4[n3] = i4[n3] || [], i4[n3].push(s3)) : i4[n3] = s3;
          }
          return m2.header && (r4 > c2.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + c2.length + " fields but parsed " + r4, f2 + t2) : r4 < c2.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + c2.length + " fields but parsed " + r4, f2 + t2)), i4;
        }
        var r3;
        p2 && (m2.header || m2.dynamicTyping || m2.transform) && (r3 = 1, !p2.data.length || Array.isArray(p2.data[0]) ? (p2.data = p2.data.map(i3), r3 = p2.data.length) : p2.data = i3(p2.data, 0), m2.header && p2.meta && (p2.meta.fields = c2), f2 += r3);
      }
      function _2() {
        return m2.header && 0 === c2.length;
      }
      function k(e2, t2, i3, r3) {
        e2 = { type: e2, code: t2, message: i3 };
        void 0 !== r3 && (e2.row = r3), p2.errors.push(e2);
      }
      U(m2.step) && (t = m2.step, m2.step = function(e2) {
        p2 = e2, _2() ? g2() : (g2(), 0 !== p2.data.length && (r2 += e2.data.length, m2.preview && r2 > m2.preview ? s2.abort() : (p2.data = p2.data[0], t(p2, i2))));
      }), this.parse = function(e2, t2, i3) {
        var r3 = m2.quoteChar || '"', r3 = (m2.newline || (m2.newline = this.guessLineEndings(e2, r3)), a2 = false, m2.delimiter ? U(m2.delimiter) && (m2.delimiter = m2.delimiter(e2), p2.meta.delimiter = m2.delimiter) : ((r3 = ((e3, t3, i4, r4, n3) => {
          var s3, a3, o3, h3;
          n3 = n3 || [",", "	", "|", ";", v.RECORD_SEP, v.UNIT_SEP];
          for (var u3 = 0; u3 < n3.length; u3++) {
            for (var d3, f3 = n3[u3], l3 = 0, c3 = 0, p3 = 0, g3 = (o3 = void 0, new E({ comments: r4, delimiter: f3, newline: t3, preview: 10 }).parse(e3)), _3 = 0; _3 < g3.data.length; _3++) i4 && y2(g3.data[_3]) ? p3++ : (d3 = g3.data[_3].length, c3 += d3, void 0 === o3 ? o3 = d3 : 0 < d3 && (l3 += Math.abs(d3 - o3), o3 = d3));
            0 < g3.data.length && (c3 /= g3.data.length - p3), (void 0 === a3 || l3 <= a3) && (void 0 === h3 || h3 < c3) && 1.99 < c3 && (a3 = l3, s3 = f3, h3 = c3);
          }
          return { successful: !!(m2.delimiter = s3), bestDelimiter: s3 };
        })(e2, m2.newline, m2.skipEmptyLines, m2.comments, m2.delimitersToGuess)).successful ? m2.delimiter = r3.bestDelimiter : (a2 = true, m2.delimiter = v.DefaultDelimiter), p2.meta.delimiter = m2.delimiter), b(m2));
        return m2.preview && m2.header && r3.preview++, n2 = e2, s2 = new E(r3), p2 = s2.parse(n2, t2, i3), g2(), l2 ? { meta: { paused: true } } : p2 || { meta: { paused: false } };
      }, this.paused = function() {
        return l2;
      }, this.pause = function() {
        l2 = true, s2.abort(), n2 = U(m2.chunk) ? "" : n2.substring(s2.getCharIndex());
      }, this.resume = function() {
        i2.streamer._halted ? (l2 = false, i2.streamer.parseChunk(n2, true)) : setTimeout(i2.resume, 3);
      }, this.aborted = function() {
        return e;
      }, this.abort = function() {
        e = true, s2.abort(), p2.meta.aborted = true, U(m2.complete) && m2.complete(p2), n2 = "";
      }, this.guessLineEndings = function(e2, t2) {
        e2 = e2.substring(0, 1048576);
        var t2 = new RegExp(P(t2) + "([^]*?)" + P(t2), "gm"), i3 = (e2 = e2.replace(t2, "")).split("\r"), t2 = e2.split("\n"), e2 = 1 < t2.length && t2[0].length < i3[0].length;
        if (1 === i3.length || e2) return "\n";
        for (var r3 = 0, n3 = 0; n3 < i3.length; n3++) "\n" === i3[n3][0] && r3++;
        return r3 >= i3.length / 2 ? "\r\n" : "\r";
      };
    }
    function P(e) {
      return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function E(C) {
      var S = (C = C || {}).delimiter, O = C.newline, x = C.comments, I = C.step, A = C.preview, T = C.fastMode, D = null, L = false, F = null == C.quoteChar ? '"' : C.quoteChar, j = F;
      if (void 0 !== C.escapeChar && (j = C.escapeChar), ("string" != typeof S || -1 < v.BAD_DELIMITERS.indexOf(S)) && (S = ","), x === S) throw new Error("Comment character same as delimiter");
      true === x ? x = "#" : ("string" != typeof x || -1 < v.BAD_DELIMITERS.indexOf(x)) && (x = false), "\n" !== O && "\r" !== O && "\r\n" !== O && (O = "\n");
      var z = 0, M = false;
      this.parse = function(i2, t, r2) {
        if ("string" != typeof i2) throw new Error("Input must be a string");
        var n2 = i2.length, e = S.length, s2 = O.length, a2 = x.length, o2 = U(I), h2 = [], u2 = [], d2 = [], f2 = z = 0;
        if (!i2) return w();
        if (T || false !== T && -1 === i2.indexOf(F)) {
          for (var l2 = i2.split(O), c2 = 0; c2 < l2.length; c2++) {
            if (d2 = l2[c2], z += d2.length, c2 !== l2.length - 1) z += O.length;
            else if (r2) return w();
            if (!x || d2.substring(0, a2) !== x) {
              if (o2) {
                if (h2 = [], k(d2.split(S)), R(), M) return w();
              } else k(d2.split(S));
              if (A && A <= c2) return h2 = h2.slice(0, A), w(true);
            }
          }
          return w();
        }
        for (var p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z), _2 = new RegExp(P(j) + P(F), "g"), m2 = i2.indexOf(F, z); ; ) if (i2[z] === F) for (m2 = z, z++; ; ) {
          if (-1 === (m2 = i2.indexOf(F, m2 + 1))) return r2 || u2.push({ type: "Quotes", code: "MissingQuotes", message: "Quoted field unterminated", row: h2.length, index: z }), E2();
          if (m2 === n2 - 1) return E2(i2.substring(z, m2).replace(_2, F));
          if (F === j && i2[m2 + 1] === j) m2++;
          else if (F === j || 0 === m2 || i2[m2 - 1] !== j) {
            -1 !== p2 && p2 < m2 + 1 && (p2 = i2.indexOf(S, m2 + 1));
            var y2 = v2(-1 === (g2 = -1 !== g2 && g2 < m2 + 1 ? i2.indexOf(O, m2 + 1) : g2) ? p2 : Math.min(p2, g2));
            if (i2.substr(m2 + 1 + y2, e) === S) {
              d2.push(i2.substring(z, m2).replace(_2, F)), i2[z = m2 + 1 + y2 + e] !== F && (m2 = i2.indexOf(F, z)), p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z);
              break;
            }
            y2 = v2(g2);
            if (i2.substring(m2 + 1 + y2, m2 + 1 + y2 + s2) === O) {
              if (d2.push(i2.substring(z, m2).replace(_2, F)), b2(m2 + 1 + y2 + s2), p2 = i2.indexOf(S, z), m2 = i2.indexOf(F, z), o2 && (R(), M)) return w();
              if (A && h2.length >= A) return w(true);
              break;
            }
            u2.push({ type: "Quotes", code: "InvalidQuotes", message: "Trailing quote on quoted field is malformed", row: h2.length, index: z }), m2++;
          }
        }
        else if (x && 0 === d2.length && i2.substring(z, z + a2) === x) {
          if (-1 === g2) return w();
          z = g2 + s2, g2 = i2.indexOf(O, z), p2 = i2.indexOf(S, z);
        } else if (-1 !== p2 && (p2 < g2 || -1 === g2)) d2.push(i2.substring(z, p2)), z = p2 + e, p2 = i2.indexOf(S, z);
        else {
          if (-1 === g2) break;
          if (d2.push(i2.substring(z, g2)), b2(g2 + s2), o2 && (R(), M)) return w();
          if (A && h2.length >= A) return w(true);
        }
        return E2();
        function k(e2) {
          h2.push(e2), f2 = z;
        }
        function v2(e2) {
          var t2 = 0;
          return t2 = -1 !== e2 && (e2 = i2.substring(m2 + 1, e2)) && "" === e2.trim() ? e2.length : t2;
        }
        function E2(e2) {
          return r2 || (void 0 === e2 && (e2 = i2.substring(z)), d2.push(e2), z = n2, k(d2), o2 && R()), w();
        }
        function b2(e2) {
          z = e2, k(d2), d2 = [], g2 = i2.indexOf(O, z);
        }
        function w(e2) {
          if (C.header && !t && h2.length && !L) {
            var s3 = h2[0], a3 = /* @__PURE__ */ Object.create(null), o3 = new Set(s3);
            let n3 = false;
            for (let r3 = 0; r3 < s3.length; r3++) {
              let i3 = s3[r3];
              if (a3[i3 = U(C.transformHeader) ? C.transformHeader(i3, r3) : i3]) {
                let e3, t2 = a3[i3];
                for (; e3 = i3 + "_" + t2, t2++, o3.has(e3); ) ;
                o3.add(e3), s3[r3] = e3, a3[i3]++, n3 = true, (D = null === D ? {} : D)[e3] = i3;
              } else a3[i3] = 1, s3[r3] = i3;
              o3.add(i3);
            }
            n3 && console.warn("Duplicate headers found and renamed."), L = true;
          }
          return { data: h2, errors: u2, meta: { delimiter: S, linebreak: O, aborted: M, truncated: !!e2, cursor: f2 + (t || 0), renamedHeaders: D } };
        }
        function R() {
          I(w()), h2 = [], u2 = [];
        }
      }, this.abort = function() {
        M = true;
      }, this.getCharIndex = function() {
        return z;
      };
    }
    function g(e) {
      var t = e.data, i2 = o[t.workerId], r2 = false;
      if (t.error) i2.userError(t.error, t.file);
      else if (t.results && t.results.data) {
        var n2 = { abort: function() {
          r2 = true, _(t.workerId, { data: [], errors: [], meta: { aborted: true } });
        }, pause: m, resume: m };
        if (U(i2.userStep)) {
          for (var s2 = 0; s2 < t.results.data.length && (i2.userStep({ data: t.results.data[s2], errors: t.results.errors, meta: t.results.meta }, n2), !r2); s2++) ;
          delete t.results;
        } else U(i2.userChunk) && (i2.userChunk(t.results, n2, t.file), delete t.results);
      }
      t.finished && !r2 && _(t.workerId, t.results);
    }
    function _(e, t) {
      var i2 = o[e];
      U(i2.userComplete) && i2.userComplete(t), i2.terminate(), delete o[e];
    }
    function m() {
      throw new Error("Not implemented.");
    }
    function b(e) {
      if ("object" != typeof e || null === e) return e;
      var t, i2 = Array.isArray(e) ? [] : {};
      for (t in e) i2[t] = b(e[t]);
      return i2;
    }
    function y(e, t) {
      return function() {
        e.apply(t, arguments);
      };
    }
    function U(e) {
      return "function" == typeof e;
    }
    return v.parse = function(e, t) {
      var i2 = (t = t || {}).dynamicTyping || false;
      U(i2) && (t.dynamicTypingFunction = i2, i2 = {});
      if (t.dynamicTyping = i2, t.transform = !!U(t.transform) && t.transform, !t.worker || !v.WORKERS_SUPPORTED) return i2 = null, v.NODE_STREAM_INPUT, "string" == typeof e ? (e = ((e2) => 65279 !== e2.charCodeAt(0) ? e2 : e2.slice(1))(e), i2 = new (t.download ? f : c)(t)) : true === e.readable && U(e.read) && U(e.on) ? i2 = new p(t) : (n.File && e instanceof File || e instanceof Object) && (i2 = new l(t)), i2.stream(e);
      (i2 = (() => {
        var e2;
        return !!v.WORKERS_SUPPORTED && (e2 = (() => {
          var e3 = n.URL || n.webkitURL || null, t2 = r.toString();
          return v.BLOB_URL || (v.BLOB_URL = e3.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", t2, ")();"], { type: "text/javascript" })));
        })(), (e2 = new n.Worker(e2)).onmessage = g, e2.id = h++, o[e2.id] = e2);
      })()).userStep = t.step, i2.userChunk = t.chunk, i2.userComplete = t.complete, i2.userError = t.error, t.step = U(t.step), t.chunk = U(t.chunk), t.complete = U(t.complete), t.error = U(t.error), delete t.worker, i2.postMessage({ input: e, config: t, workerId: i2.id });
    }, v.unparse = function(e, t) {
      var n2 = false, _2 = true, m2 = ",", y2 = "\r\n", s2 = '"', a2 = s2 + s2, i2 = false, r2 = null, o2 = false, h2 = ((() => {
        if ("object" == typeof t) {
          if ("string" != typeof t.delimiter || v.BAD_DELIMITERS.filter(function(e2) {
            return -1 !== t.delimiter.indexOf(e2);
          }).length || (m2 = t.delimiter), "boolean" != typeof t.quotes && "function" != typeof t.quotes && !Array.isArray(t.quotes) || (n2 = t.quotes), "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (i2 = t.skipEmptyLines), "string" == typeof t.newline && (y2 = t.newline), "string" == typeof t.quoteChar && (s2 = t.quoteChar), "boolean" == typeof t.header && (_2 = t.header), Array.isArray(t.columns)) {
            if (0 === t.columns.length) throw new Error("Option columns is empty");
            r2 = t.columns;
          }
          void 0 !== t.escapeChar && (a2 = t.escapeChar + s2), t.escapeFormulae instanceof RegExp ? o2 = t.escapeFormulae : "boolean" == typeof t.escapeFormulae && t.escapeFormulae && (o2 = /^[=+\-@\t\r].*$/);
        }
      })(), new RegExp(P(s2), "g"));
      "string" == typeof e && (e = JSON.parse(e));
      if (Array.isArray(e)) {
        if (!e.length || Array.isArray(e[0])) return u2(null, e, i2);
        if ("object" == typeof e[0]) return u2(r2 || Object.keys(e[0]), e, i2);
      } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields || r2), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : "object" == typeof e.data[0] ? Object.keys(e.data[0]) : []), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), u2(e.fields || [], e.data || [], i2);
      throw new Error("Unable to serialize unrecognized input");
      function u2(e2, t2, i3) {
        var r3 = "", n3 = ("string" == typeof e2 && (e2 = JSON.parse(e2)), "string" == typeof t2 && (t2 = JSON.parse(t2)), Array.isArray(e2) && 0 < e2.length), s3 = !Array.isArray(t2[0]);
        if (n3 && _2) {
          for (var a3 = 0; a3 < e2.length; a3++) 0 < a3 && (r3 += m2), r3 += k(e2[a3], a3);
          0 < t2.length && (r3 += y2);
        }
        for (var o3 = 0; o3 < t2.length; o3++) {
          var h3 = (n3 ? e2 : t2[o3]).length, u3 = false, d2 = n3 ? 0 === Object.keys(t2[o3]).length : 0 === t2[o3].length;
          if (i3 && !n3 && (u3 = "greedy" === i3 ? "" === t2[o3].join("").trim() : 1 === t2[o3].length && 0 === t2[o3][0].length), "greedy" === i3 && n3) {
            for (var f2 = [], l2 = 0; l2 < h3; l2++) {
              var c2 = s3 ? e2[l2] : l2;
              f2.push(t2[o3][c2]);
            }
            u3 = "" === f2.join("").trim();
          }
          if (!u3) {
            for (var p2 = 0; p2 < h3; p2++) {
              0 < p2 && !d2 && (r3 += m2);
              var g2 = n3 && s3 ? e2[p2] : p2;
              r3 += k(t2[o3][g2], p2);
            }
            o3 < t2.length - 1 && (!i3 || 0 < h3 && !d2) && (r3 += y2);
          }
        }
        return r3;
      }
      function k(e2, t2) {
        var i3, r3;
        return null == e2 ? "" : e2.constructor === Date ? JSON.stringify(e2).slice(1, 25) : (r3 = false, o2 && "string" == typeof e2 && o2.test(e2) && (e2 = "'" + e2, r3 = true), i3 = e2.toString().replace(h2, a2), (r3 = r3 || true === n2 || "function" == typeof n2 && n2(e2, t2) || Array.isArray(n2) && n2[t2] || ((e3, t3) => {
          for (var i4 = 0; i4 < t3.length; i4++) if (-1 < e3.indexOf(t3[i4])) return true;
          return false;
        })(i3, v.BAD_DELIMITERS) || -1 < i3.indexOf(m2) || " " === i3.charAt(0) || " " === i3.charAt(i3.length - 1)) ? s2 + i3 + s2 : i3);
      }
    }, v.RECORD_SEP = String.fromCharCode(30), v.UNIT_SEP = String.fromCharCode(31), v.BYTE_ORDER_MARK = "\uFEFF", v.BAD_DELIMITERS = ["\r", "\n", '"', v.BYTE_ORDER_MARK], v.WORKERS_SUPPORTED = !s && !!n.Worker, v.NODE_STREAM_INPUT = 1, v.LocalChunkSize = 10485760, v.RemoteChunkSize = 5242880, v.DefaultDelimiter = ",", v.Parser = E, v.ParserHandle = i, v.NetworkStreamer = f, v.FileStreamer = l, v.StringStreamer = c, v.ReadableStreamStreamer = p, n.jQuery && ((d = n.jQuery).fn.parse = function(o2) {
      var i2 = o2.config || {}, h2 = [];
      return this.each(function(e2) {
        if (!("INPUT" === d(this).prop("tagName").toUpperCase() && "file" === d(this).attr("type").toLowerCase() && n.FileReader) || !this.files || 0 === this.files.length) return true;
        for (var t = 0; t < this.files.length; t++) h2.push({ file: this.files[t], inputElem: this, instanceConfig: d.extend({}, i2) });
      }), e(), this;
      function e() {
        if (0 === h2.length) U(o2.complete) && o2.complete();
        else {
          var e2, t, i3, r2, n2 = h2[0];
          if (U(o2.before)) {
            var s2 = o2.before(n2.file, n2.inputElem);
            if ("object" == typeof s2) {
              if ("abort" === s2.action) return e2 = "AbortError", t = n2.file, i3 = n2.inputElem, r2 = s2.reason, void (U(o2.error) && o2.error({ name: e2 }, t, i3, r2));
              if ("skip" === s2.action) return void u2();
              "object" == typeof s2.config && (n2.instanceConfig = d.extend(n2.instanceConfig, s2.config));
            } else if ("skip" === s2) return void u2();
          }
          var a2 = n2.instanceConfig.complete;
          n2.instanceConfig.complete = function(e3) {
            U(a2) && a2(e3, n2.file, n2.inputElem), u2();
          }, v.parse(n2.file, n2.instanceConfig);
        }
      }
      function u2() {
        h2.splice(0, 1), e();
      }
    }), a && (n.onmessage = function(e) {
      e = e.data;
      void 0 === v.WORKER_ID && e && (v.WORKER_ID = e.workerId);
      "string" == typeof e.input ? n.postMessage({ workerId: v.WORKER_ID, results: v.parse(e.input, e.config), finished: true }) : (n.File && e.input instanceof File || e.input instanceof Object) && (e = v.parse(e.input, e.config)) && n.postMessage({ workerId: v.WORKER_ID, results: e, finished: true });
    }), (f.prototype = Object.create(u.prototype)).constructor = f, (l.prototype = Object.create(u.prototype)).constructor = l, (c.prototype = Object.create(c.prototype)).constructor = c, (p.prototype = Object.create(u.prototype)).constructor = p, v;
  });
})(papaparse_min);
var papaparse_minExports = papaparse_min.exports;
const Papa = /* @__PURE__ */ getDefaultExportFromCjs(papaparse_minExports);
const HEADER_MAP = {
  index: "index",
  text: "text",
  image_path: "imagePath",
  imagepath: "imagePath",
  image: "imagePath",
  video_path: "videoPath",
  videopath: "videoPath",
  video: "videoPath",
  voice: "voice",
  speaker: "voice"
};
function parseCsv(raw) {
  const errors = [];
  const rows = [];
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase()
  });
  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push({ row: err.row ?? -1, message: `${err.code}: ${err.message}` });
    }
  }
  if (!parsed.data || parsed.data.length === 0) {
    if (errors.length === 0) errors.push({ row: -1, message: "No rows parsed from CSV" });
    return { rows, errors };
  }
  parsed.data.forEach((rawRow, i) => {
    const normalized = {};
    for (const [key, value] of Object.entries(rawRow)) {
      const mapped = HEADER_MAP[key];
      if (!mapped) continue;
      const trimmed = (value ?? "").trim();
      if (mapped === "index") {
        normalized.index = trimmed ? parseInt(trimmed, 10) : i + 1;
      } else {
        normalized[mapped] = trimmed;
      }
    }
    const voice = normalized.voice ?? "";
    const text = normalized.text && normalized.text.trim() ? normalized.text : voice;
    if (!text) return;
    rows.push({
      index: normalized.index ?? i + 1,
      text,
      imagePath: normalized.imagePath ?? "",
      videoPath: normalized.videoPath ?? "",
      voice: voice || text
    });
  });
  return { rows, errors };
}
function fuzzyMatch(srtSegments, csvRows) {
  if (csvRows.length === 0) {
    return srtSegments.map((s, i) => ({
      index: i + 1,
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
      imagePath: "",
      videoPath: "",
      confidence: null
    }));
  }
  if (srtSegments.length === 0) {
    return csvRows.map((row, i) => ({
      index: i + 1,
      startMs: 0,
      endMs: 0,
      text: row.voice || row.text,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? "",
      confidence: 0
    }));
  }
  const timeline = buildTokenTimeline(srtSegments);
  if (timeline.length > 0) {
    return alignCsvRowsToTokenTimeline(csvRows, timeline, srtSegments);
  }
  const result = [];
  let srtPointer = 0;
  let lastEndMs = srtSegments[0]?.startMs ?? 0;
  for (let ci = 0; ci < csvRows.length; ci += 1) {
    const row = csvRows[ci];
    const csvText = row.voice || row.text;
    if (srtPointer >= srtSegments.length) {
      result.push({
        index: ci + 1,
        startMs: lastEndMs,
        endMs: lastEndMs,
        text: csvText,
        imagePath: row.imagePath,
        videoPath: row.videoPath ?? "",
        confidence: 0
      });
      continue;
    }
    const remainingCsvRows = csvRows.length - ci - 1;
    const remainingSrt = srtSegments.length - srtPointer;
    const maxEnd = remainingSrt > remainingCsvRows ? srtSegments.length - remainingCsvRows - 1 : srtPointer;
    const csvNorm = normalize(csvText);
    let bestEnd = srtPointer;
    let bestScore = -1;
    let combined = "";
    for (let si = srtPointer; si <= maxEnd; si += 1) {
      combined = combined ? `${combined} ${srtSegments[si].text}` : srtSegments[si].text;
      const score = similarity(normalize(combined), csvNorm);
      if (score > bestScore) {
        bestScore = score;
        bestEnd = si;
      }
    }
    const startMs = srtSegments[srtPointer].startMs;
    const endMs = srtSegments[bestEnd].endMs;
    lastEndMs = endMs;
    result.push({
      index: ci + 1,
      startMs,
      endMs,
      text: csvText,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? "",
      confidence: Math.max(0, bestScore)
    });
    srtPointer = bestEnd + 1;
  }
  return result;
}
function buildTokenTimeline(srtSegments) {
  const timeline = [];
  for (const segment of srtSegments) {
    const tokens = tokenize(segment.text);
    if (tokens.length === 0) continue;
    const duration = Math.max(0, segment.endMs - segment.startMs);
    for (let i = 0; i < tokens.length; i += 1) {
      const startMs = segment.startMs + Math.round(duration * i / tokens.length);
      const endMs = segment.startMs + Math.round(duration * (i + 1) / tokens.length);
      timeline.push({ text: tokens[i], startMs, endMs, isSegmentEnd: i === tokens.length - 1 });
    }
  }
  return timeline;
}
function alignCsvRowsToTokenTimeline(csvRows, timeline, srtSegments) {
  const result = [];
  let tokenPointer = 0;
  let lastEndMs = timeline[0]?.startMs ?? srtSegments[0]?.startMs ?? 0;
  const csvTokenRows = csvRows.map((row) => tokenize(row.voice || row.text));
  for (let ci = 0; ci < csvRows.length; ci += 1) {
    const row = csvRows[ci];
    const csvText = row.voice || row.text;
    if (tokenPointer >= timeline.length) {
      result.push({
        index: ci + 1,
        startMs: lastEndMs,
        endMs: lastEndMs,
        text: csvText,
        imagePath: row.imagePath,
        videoPath: row.videoPath ?? "",
        confidence: 0
      });
      continue;
    }
    const remainingCsvRows = csvRows.length - ci - 1;
    const remainingTokens = timeline.length - tokenPointer;
    const takeCount = ci === csvRows.length - 1 ? remainingTokens : findBestTokenCount({
      timeline,
      start: tokenPointer,
      maxCount: Math.max(1, remainingTokens - remainingCsvRows),
      currentTokens: csvTokenRows[ci],
      nextTokens: csvTokenRows[ci + 1] ?? []
    });
    const startToken = timeline[tokenPointer];
    const endToken = timeline[tokenPointer + takeCount - 1];
    const consumedTokens = sliceTokenText(timeline, tokenPointer, takeCount);
    lastEndMs = endToken.endMs;
    result.push({
      index: ci + 1,
      startMs: startToken.startMs,
      endMs: endToken.endMs,
      text: csvText,
      imagePath: row.imagePath,
      videoPath: row.videoPath ?? "",
      confidence: similarity(consumedTokens, csvTokenRows[ci].join(" "))
    });
    tokenPointer += takeCount;
  }
  return result;
}
function findBestTokenCount(input) {
  const { timeline, start, maxCount, currentTokens, nextTokens } = input;
  const desiredCount = Math.max(1, currentTokens.length);
  const nextDesiredCount = Math.max(1, nextTokens.length);
  const lower = Math.max(1, Math.min(maxCount, Math.floor(desiredCount * 0.45) - 2));
  const upper = Math.min(maxCount, Math.max(desiredCount + 8, Math.ceil(desiredCount * 2.2)));
  const exactCount = findExactTokenSequenceCount(timeline, start, maxCount, currentTokens);
  const candidates = /* @__PURE__ */ new Set([1, Math.min(desiredCount, maxCount), maxCount]);
  for (let count = lower; count <= upper; count += 1) candidates.add(count);
  if (exactCount != null) {
    candidates.add(exactCount);
    candidates.add(Math.max(1, exactCount - 1));
    candidates.add(Math.min(maxCount, exactCount + 1));
  }
  let bestCount = Math.min(desiredCount, maxCount);
  let bestScore = -Infinity;
  for (const count of candidates) {
    if (count < 1 || count > maxCount) continue;
    const currentText = sliceTokenText(timeline, start, count);
    const currentScore = similarity(currentText, currentTokens.join(" "));
    const nextScore = nextTokens.length > 0 ? similarity(sliceTokenText(timeline, start + count, Math.min(nextDesiredCount, timeline.length - start - count)), nextTokens.join(" ")) : 0;
    const lengthScore = Math.min(count, desiredCount) / Math.max(count, desiredCount);
    const boundaryBonus = timeline[start + count - 1]?.isSegmentEnd ? 0.035 : 0;
    const exactBonus = exactCount === count ? 0.08 : 0;
    const score = currentScore * 0.78 + nextScore * 0.12 + lengthScore * 0.1 + boundaryBonus + exactBonus;
    if (score > bestScore) {
      bestScore = score;
      bestCount = count;
    }
  }
  return bestCount;
}
function findExactTokenSequenceCount(timeline, start, maxCount, targetTokens) {
  if (targetTokens.length === 0) return null;
  const limit = Math.min(maxCount, Math.max(targetTokens.length * 2, targetTokens.length + 12));
  for (let offset = 0; offset <= Math.min(4, limit - targetTokens.length); offset += 1) {
    let ok = true;
    for (let i = 0; i < targetTokens.length; i += 1) {
      if (timeline[start + offset + i]?.text !== targetTokens[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return offset + targetTokens.length;
  }
  return null;
}
function sliceTokenText(timeline, start, count) {
  if (count <= 0) return "";
  return timeline.slice(start, start + count).map((token) => token.text).join(" ");
}
function tokenize(s) {
  return normalize(s).split(" ").filter(Boolean);
}
function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function similarity(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  if (a === b) return 1;
  const tokensA = a.split(" ").filter(Boolean);
  const tokensB = b.split(" ").filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect += 1;
  const union = setA.size + setB.size - intersect;
  const jaccard = union === 0 ? 0 : intersect / union;
  const lenA = tokensA.length;
  const lenB = tokensB.length;
  const lenRatio = Math.min(lenA, lenB) / Math.max(lenA, lenB);
  return jaccard * 0.7 + lenRatio * 0.3;
}
function extractVoiceFromPrompt(prompt) {
  const text = splitVideoPromptVoiceOver(prompt).voiceOver;
  return text.length > 0 ? text : null;
}
function shotsToVoiceRows(shots) {
  const rows = [];
  let matched = 0;
  let skipped = 0;
  for (const shot of shots) {
    const voice = cleanVoiceOverText(shot.voiceOver) || extractVoiceFromPrompt(shot.videoPrompt);
    if (!voice) {
      skipped += 1;
      continue;
    }
    rows.push({
      index: shot.index,
      text: voice,
      imagePath: shot.imagePath ?? "",
      videoPath: shot.videoPath ?? "",
      voice
    });
    matched += 1;
  }
  return {
    rows,
    totalShots: shots.length,
    matched,
    skipped
  };
}
const defaultState = {
  stage: "import",
  audioFilePath: null,
  audioFileName: null,
  audioFileSize: null,
  audioDurationSec: null,
  srtSourceMode: "api",
  whisperProvider: "groq",
  whisperApiKeys: { openai: "", groq: "" },
  whisperLanguage: "",
  srtRaw: "",
  srtSegments: [],
  csvRaw: "",
  csvRows: [],
  csvFileName: null,
  mediaMode: "image",
  mappedSegments: [],
  transcribeJobId: null,
  transcribeProgress: { stage: "idle", message: "", percent: 0 },
  transcribeError: null,
  renderSettings: DEFAULT_RENDER_SETTINGS,
  renderJobId: null,
  renderProgress: { stage: "idle", percent: 0, message: "" },
  renderError: null,
  renderLog: "",
  outputVideoPath: null
};
const CONFIG_FIELDS = [
  "whisperProvider",
  "whisperApiKeys",
  "whisperLanguage",
  "srtSourceMode",
  "mediaMode",
  "renderSettings"
];
const PROJECT_FIELDS = [
  "stage",
  "audioFilePath",
  "audioFileName",
  "audioFileSize",
  "audioDurationSec",
  "srtRaw",
  "srtSegments",
  "csvRaw",
  "csvRows",
  "csvFileName",
  "mappedSegments",
  "outputVideoPath"
];
function pickFields(state, keys) {
  const out = {};
  if (!state || typeof state !== "object") return out;
  for (const k of keys) {
    if (k in state) out[k] = state[k];
  }
  return out;
}
function createAutoVideoSplitStorage() {
  const CONFIG_KEY = "longdd-auto-video-config";
  const projectKey = (pid) => `_p/${pid}/auto-video`;
  const ensureProjectHydrated = async () => {
    if (!useProjectStore.persist.hasHydrated()) {
      await new Promise((resolve) => {
        const unsub = useProjectStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }
  };
  return {
    getItem: async (legacyKey) => {
      await ensureProjectHydrated();
      const pid = useProjectStore.getState().activeProjectId;
      const [configRaw, projectRaw] = await Promise.all([
        fileStorage.getItem(CONFIG_KEY),
        pid ? fileStorage.getItem(projectKey(pid)) : Promise.resolve(null)
      ]);
      let config = {};
      let project = {};
      let version = 0;
      if (configRaw) {
        try {
          const parsed = JSON.parse(configRaw);
          config = parsed?.state ?? parsed ?? {};
          if (typeof parsed?.version === "number") version = parsed.version;
        } catch {
        }
      }
      if (projectRaw) {
        try {
          const parsed = JSON.parse(projectRaw);
          project = parsed?.state ?? parsed ?? {};
          if (typeof parsed?.version === "number") version = parsed.version;
        } catch {
        }
      }
      if (!configRaw && !projectRaw) {
        const legacyRaw = await fileStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const parsed = JSON.parse(legacyRaw);
            const legacyState = parsed?.state ?? parsed ?? {};
            config = pickFields(legacyState, CONFIG_FIELDS);
            project = pickFields(legacyState, PROJECT_FIELDS);
            if (typeof parsed?.version === "number") version = parsed.version;
            console.log("[AutoVideoStorage] Migrated legacy auto-video state into split layout");
          } catch (err) {
            console.warn("[AutoVideoStorage] Failed to parse legacy auto-video file:", err);
          }
        }
      }
      const merged = { ...project, ...config };
      return JSON.stringify({ state: merged, version });
    },
    setItem: async (_legacyKey, value) => {
      let state = {};
      let version = 0;
      try {
        const parsed = JSON.parse(value);
        state = parsed?.state ?? parsed ?? {};
        version = typeof parsed?.version === "number" ? parsed.version : 0;
      } catch {
        console.warn("[AutoVideoStorage] Skipping write: payload is not valid JSON");
        return;
      }
      const config = pickFields(state, CONFIG_FIELDS);
      const projectData = pickFields(state, PROJECT_FIELDS);
      const pid = useProjectStore.getState().activeProjectId;
      const writes = [
        fileStorage.setItem(CONFIG_KEY, JSON.stringify({ state: config, version }))
      ];
      if (pid) {
        writes.push(
          fileStorage.setItem(projectKey(pid), JSON.stringify({ state: projectData, version }))
        );
      }
      await Promise.all(writes);
    },
    removeItem: async (_legacyKey) => {
      const pid = useProjectStore.getState().activeProjectId;
      const ops = [fileStorage.removeItem(CONFIG_KEY)];
      if (pid) ops.push(fileStorage.removeItem(projectKey(pid)));
      await Promise.all(ops);
    }
  };
}
const useAutoVideoStore = create()(
  persist(
    (set, get) => ({
      ...defaultState,
      setStage: (stage) => set({ stage }),
      setAudio: (info) => set({
        audioFilePath: info.path,
        audioFileName: info.name,
        audioFileSize: info.size,
        audioDurationSec: info.durationSec,
        // Reset downstream state when audio changes.
        srtRaw: "",
        srtSegments: [],
        mappedSegments: [],
        outputVideoPath: null,
        transcribeError: null
      }),
      clearAudio: () => set({
        audioFilePath: null,
        audioFileName: null,
        audioFileSize: null,
        audioDurationSec: null
      }),
      setWhisperProvider: (provider) => set({ whisperProvider: provider }),
      setWhisperApiKey: (provider, key) => set((state) => ({
        whisperApiKeys: { ...state.whisperApiKeys, [provider]: key }
      })),
      setWhisperLanguage: (lang) => set({ whisperLanguage: lang }),
      setSrtSourceMode: (mode) => set({ srtSourceMode: mode }),
      setMediaMode: (mode) => set({ mediaMode: mode }),
      loadSrtRaw: (raw) => {
        const result = parseSrt(raw);
        if (result.segments.length === 0) {
          return {
            ok: false,
            segmentCount: 0,
            error: result.errors[0]?.message || "SRT parse failed: no segments"
          };
        }
        set({ srtRaw: raw, srtSegments: result.segments });
        get().recomputeMapping();
        return { ok: true, segmentCount: result.segments.length };
      },
      loadCsvRaw: (raw, fileName) => {
        const result = parseCsv(raw);
        if (result.rows.length === 0) {
          return {
            ok: false,
            rowCount: 0,
            error: result.errors[0]?.message || "CSV parse failed: no rows"
          };
        }
        set({
          csvRaw: raw,
          csvRows: result.rows,
          csvFileName: fileName ?? null
        });
        get().recomputeMapping();
        return { ok: true, rowCount: result.rows.length };
      },
      clearCsv: () => {
        set({ csvRaw: "", csvRows: [], csvFileName: null });
        get().recomputeMapping();
      },
      updateCsvRows: (edits) => {
        if (edits.length === 0) return;
        const editsByIndex = new Map(edits.map((e) => [e.index, e]));
        set((state) => ({
          csvRows: state.csvRows.map((row) => {
            const e = editsByIndex.get(row.index);
            if (!e) return row;
            const nextVoice = e.voice ?? row.voice;
            return {
              ...row,
              voice: nextVoice,
              // text mirrors voice when handed off from Script tab; keep them in sync
              // so fuzzy match against SRT picks up the edited content.
              text: nextVoice,
              imagePath: e.imagePath ?? row.imagePath,
              videoPath: e.videoPath ?? row.videoPath
            };
          })
        }));
        get().recomputeMapping();
      },
      setTranscribeJobId: (jobId) => set({ transcribeJobId: jobId }),
      updateTranscribeProgress: (next) => set((state) => ({
        transcribeProgress: { ...state.transcribeProgress, ...next }
      })),
      setTranscribeError: (err) => set({ transcribeError: err }),
      setImageForSegment: (segmentIndex, imagePath) => set((state) => ({
        mappedSegments: state.mappedSegments.map(
          (seg) => seg.index === segmentIndex ? { ...seg, imagePath } : seg
        )
      })),
      setVideoForSegment: (segmentIndex, videoPath) => set((state) => ({
        mappedSegments: state.mappedSegments.map(
          (seg) => seg.index === segmentIndex ? { ...seg, videoPath } : seg
        )
      })),
      clearImageForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map(
          (seg) => seg.index === segmentIndex ? { ...seg, imagePath: "" } : seg
        )
      })),
      clearVideoForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map(
          (seg) => seg.index === segmentIndex ? { ...seg, videoPath: "" } : seg
        )
      })),
      autoFillImagesFromFolder: (paths) => {
        const indexForPath = (filePath) => {
          const name = filePath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") ?? "";
          const sceneShot = name.match(/scene[_\s-]*(\d+).*shot[_\s-]*(\d+)/i);
          if (sceneShot) return Number(`${sceneShot[1]}${sceneShot[2].padStart(3, "0")}`);
          const shot = name.match(/(?:shot|index|idx)[_\s-]*(\d+)/i);
          if (shot) return Number(shot[1]);
          const numbers = name.match(/\d+/g);
          return numbers?.length ? Number(numbers[numbers.length - 1]) : null;
        };
        const byIndex = /* @__PURE__ */ new Map();
        for (const p of paths) {
          const idx = indexForPath(p);
          if (idx != null && !byIndex.has(idx)) byIndex.set(idx, p);
        }
        let used = 0;
        set((state) => ({
          mappedSegments: state.mappedSegments.map((seg) => {
            const indexedPath = byIndex.get(seg.index);
            if (state.mediaMode === "video") {
              if (seg.videoPath) return seg;
              if (indexedPath) {
                used += 1;
                return { ...seg, videoPath: indexedPath };
              }
              if (used >= paths.length) return seg;
              const path2 = paths[used];
              used += 1;
              return { ...seg, videoPath: path2 };
            }
            if (seg.imagePath) return seg;
            if (indexedPath) {
              used += 1;
              return { ...seg, imagePath: indexedPath };
            }
            if (used >= paths.length) return seg;
            const path = paths[used];
            used += 1;
            return { ...seg, imagePath: path };
          })
        }));
        return used;
      },
      setMediaEffectForSegment: (segmentIndex, effect) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, mediaEffect: effect } : seg)
      })),
      setTransitionForSegment: (segmentIndex, transition) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, transitionToNext: transition } : seg)
      })),
      applyMediaEffectToAll: (effect) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, mediaEffect: effect }))
      })),
      applyTransitionToAll: (transition) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg, idx) => ({
          ...seg,
          transitionToNext: idx === state.mappedSegments.length - 1 ? "none" : transition
        }))
      })),
      randomizeMediaEffects: (count, effect) => {
        const effects = AUTO_VIDEO_MEDIA_EFFECTS.filter((effect2) => effect2 !== "none");
        let applied = 0;
        set((state) => {
          const candidates = state.mappedSegments.map((seg, idx) => ({ seg, idx })).filter(({ seg }) => !seg.mediaEffect || seg.mediaEffect === "none");
          const chosen = /* @__PURE__ */ new Set();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              mediaEffect: chosen.has(idx) ? effect && effect !== "none" ? effect : effects[idx % effects.length] : seg.mediaEffect ?? "none"
            }))
          };
        });
        return applied;
      },
      randomizeTransitions: (count, transition) => {
        const transitions = AUTO_VIDEO_TRANSITIONS.filter((transition2) => transition2 !== "none");
        let applied = 0;
        set((state) => {
          const max = Math.max(0, state.mappedSegments.length - 1);
          const candidates = state.mappedSegments.slice(0, max).map((seg, idx) => ({ seg, idx })).filter(({ seg }) => !seg.transitionToNext || seg.transitionToNext === "none");
          const chosen = /* @__PURE__ */ new Set();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              transitionToNext: chosen.has(idx) ? transition && transition !== "none" ? transition : transitions[idx % transitions.length] : idx === state.mappedSegments.length - 1 ? "none" : seg.transitionToNext ?? "none"
            }))
          };
        });
        return applied;
      },
      clearMediaEffects: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, mediaEffect: "none" }))
      })),
      clearTransitions: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, transitionToNext: "none" }))
      })),
      setSfxForSegment: (segmentIndex, sfxPath) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, sfxPath } : seg)
      })),
      clearSfxForSegment: (segmentIndex) => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => seg.index === segmentIndex ? { ...seg, sfxPath: "" } : seg)
      })),
      clearAllSfx: () => set((state) => ({
        mappedSegments: state.mappedSegments.map((seg) => ({ ...seg, sfxPath: "" }))
      })),
      randomizeSfx: (count, sfxPaths) => {
        const usable = sfxPaths.filter(Boolean);
        if (usable.length === 0) return 0;
        let applied = 0;
        set((state) => {
          const candidates = state.mappedSegments.map((seg, idx) => ({ seg, idx })).filter(({ seg }) => !seg.sfxPath);
          const chosen = /* @__PURE__ */ new Set();
          const limit = Math.max(0, Math.min(count, candidates.length));
          while (chosen.size < limit) chosen.add(candidates[Math.floor(Math.random() * candidates.length)].idx);
          applied = chosen.size;
          return {
            mappedSegments: state.mappedSegments.map((seg, idx) => ({
              ...seg,
              sfxPath: chosen.has(idx) ? usable[Math.floor(Math.random() * usable.length)] : seg.sfxPath ?? ""
            }))
          };
        });
        return applied;
      },
      setRenderSettings: (next) => set((state) => ({
        renderSettings: { ...state.renderSettings, ...next }
      })),
      setRenderJobId: (jobId) => set({ renderJobId: jobId }),
      updateRenderProgress: (next) => set((state) => ({
        renderProgress: { ...state.renderProgress, ...next }
      })),
      setRenderError: (err) => set({ renderError: err }),
      appendRenderLog: (line) => set((state) => {
        const next = state.renderLog ? state.renderLog + "\n" + line : line;
        const trimmed = next.length > 64 * 1024 ? next.slice(-64 * 1024) : next;
        return { renderLog: trimmed };
      }),
      setOutputVideoPath: (path) => set({ outputVideoPath: path }),
      resetAll: () => set({
        ...defaultState,
        whisperApiKeys: get().whisperApiKeys,
        whisperProvider: get().whisperProvider,
        renderSettings: get().renderSettings
      }),
      recomputeMapping: () => {
        const { srtSegments, csvRows } = get();
        const previous = new Map(get().mappedSegments.map((seg) => [seg.index, seg]));
        const mapped = fuzzyMatch(srtSegments, csvRows).map((seg) => ({
          ...seg,
          mediaEffect: previous.get(seg.index)?.mediaEffect ?? "none",
          transitionToNext: previous.get(seg.index)?.transitionToNext ?? "none",
          sfxPath: previous.get(seg.index)?.sfxPath ?? ""
        }));
        set({ mappedSegments: mapped });
      },
      receiveFromScript: (payload) => {
        set({
          stage: "import",
          audioFilePath: payload.audioPath,
          audioFileName: payload.audioName,
          audioFileSize: payload.audioSize,
          audioDurationSec: payload.audioDurationSec ?? null
        });
        if (payload.srtRaw) {
          get().loadSrtRaw(payload.srtRaw);
        }
        if (payload.csvRaw) {
          get().loadCsvRaw(payload.csvRaw, "from-script.csv");
        }
      },
      seedFromShots: (shots) => {
        const result = shotsToVoiceRows(shots);
        set({
          stage: "import",
          csvRaw: "",
          csvRows: result.rows,
          csvFileName: "from-script.csv"
        });
        get().recomputeMapping();
        return { matched: result.matched, skipped: result.skipped };
      }
    }),
    {
      name: "longdd-auto-video",
      storage: createJSONStorage(() => createAutoVideoSplitStorage()),
      version: 1,
      partialize: (state) => ({
        // User-config (routed to longdd-auto-video-config — shared across projects)
        whisperProvider: state.whisperProvider,
        whisperApiKeys: state.whisperApiKeys,
        whisperLanguage: state.whisperLanguage,
        srtSourceMode: state.srtSourceMode,
        mediaMode: state.mediaMode,
        renderSettings: state.renderSettings,
        // Workflow state (routed to _p/{projectId}/auto-video — per project).
        // Active job ids and progress are intentionally excluded (transient runtime only).
        stage: state.stage,
        audioFilePath: state.audioFilePath,
        audioFileName: state.audioFileName,
        audioFileSize: state.audioFileSize,
        audioDurationSec: state.audioDurationSec,
        srtRaw: state.srtRaw,
        srtSegments: state.srtSegments,
        csvRaw: state.csvRaw,
        csvRows: state.csvRows,
        csvFileName: state.csvFileName,
        mappedSegments: state.mappedSegments,
        outputVideoPath: state.outputVideoPath
      })
    }
  )
);
export {
  Papa as P,
  useProjectStore as a,
  buildPromptVoiceOverSuffix as b,
  cleanVoiceOverText as c,
  mergeVideoPromptVoiceOver as m,
  parseSrt as p,
  splitVideoPromptVoiceOver as s,
  useAutoVideoStore as u
};
