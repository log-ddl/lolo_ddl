const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./entry-CEuYoVRr.js","./radix-ui-G3HX32g5.js","./lucide-react-DHCwBhKI.js","./supabase-DI0hoIb9.js","./zustand-DnVmcEKu.js","./autopilot-store-i3rmgegs.js","./auto-video-store-Cd8fXBc8.js","./cors-fetch-CkwbEcad.js","./model-registry-C5c6bagc.js","./dropdown-menu-D7DihKO-.js","./progress-CoGwezcY.js","./popover-CuPNgqie.js","./FeatureHeaderIcon-DurhyC1w.js","./resizable-ZbW8XN3y.js","./entry-DAJgOzgM.js","./select-ZlGxq1Za.js","./textarea-COLWDImR.js","./youtube-api-S-9TP3wu.js","./label-DOUrVQeY.js","./badge-DGXWRPZx.js","./entry-B_bdRReW.js","./entry-CWvkVA3Y.js","./omnivoice-languages-BOAnY_r-.js","./gemini-voices-CGiUf3fL.js","./task-info-button-Dug1kt_w.js","./collapsible-BVeKrXwK.js","./switch-D859FYwM.js","./entry-Crm4XPRF.js","./autopilot-http-handler-Cy7P7pF0.js"])))=>i.map(i=>d[i]);
import { r as reactDomExports, R as ReactDOM, j as jsxRuntimeExports, S as Slot, a as Root, T as Trigger, P as Portal, C as Content, b as Close, c as Title, D as Description, O as Overlay, d as Provider, e as Root3, f as Trigger$1, g as Portal$1, h as Content2, i as Root2, k as Trigger2, l as Portal2, m as Content2$1, n as Title2, o as Description2, p as Cancel, A as Action, q as Overlay2 } from "./radix-ui-G3HX32g5.js";
import { F as Film, M as MessageSquareText, T as Telescope, A as AudioLines, S as Scissors, r as reactExports, R as React, X, E as Eye, b as EyeOff, L as LoaderCircle, c as Save, P as Pencil, C as Camera, d as Trash2, e as LogOut, U as UserRound, f as ChevronLeft, h as CircleQuestionMark, i as Settings, j as Languages, k as Sun, l as Moon, m as ArrowRight, n as LockKeyhole, o as LogIn, p as ShieldAlert, q as RefreshCw, D as Download, s as SquareTerminal, t as CircleCheck, u as CircleAlert, v as ExternalLink } from "./lucide-react-DHCwBhKI.js";
import { c as create } from "./zustand-DnVmcEKu.js";
import { c as createClient } from "./supabase-DI0hoIb9.js";
const scriptRel = function detectScriptRel() {
  const relList = typeof document !== "undefined" && document.createElement("link").relList;
  return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
}();
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
var client = {};
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
const loadVideoStudio = () => __vitePreload(() => import("./entry-CEuYoVRr.js").then((n) => n.e), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13]) : void 0, import.meta.url);
const loadContentChat = () => __vitePreload(() => import("./entry-DAJgOzgM.js"), true ? __vite__mapDeps([14,1,2,3,12,9,15,16,4,17,7,18,19]) : void 0, import.meta.url);
const loadResearchMonitor = () => __vitePreload(() => import("./entry-B_bdRReW.js"), true ? __vite__mapDeps([20,1,2,3,17,7,4,12]) : void 0, import.meta.url);
const loadTtsVoice = () => __vitePreload(() => import("./entry-CWvkVA3Y.js"), true ? __vite__mapDeps([21,1,2,3,8,4,22,23,18,15,24,10,16,12,25,26,19]) : void 0, import.meta.url);
const loadAutoEdit = () => __vitePreload(() => import("./entry-Crm4XPRF.js"), true ? __vite__mapDeps([27,1,2,3,4,13,18,11,15,6,26,16]) : void 0, import.meta.url);
const appFeatures = [
  {
    id: "video-studio",
    titleKey: "appHome.videoStudio.title",
    descriptionKey: "appHome.videoStudio.description",
    icon: Film,
    component: reactExports.lazy(loadVideoStudio),
    preload: loadVideoStudio,
    preloadOnIdle: true,
    requiredPlan: "pro"
  },
  {
    id: "content-chat",
    titleKey: "appHome.contentChat.title",
    descriptionKey: "appHome.contentChat.description",
    icon: MessageSquareText,
    component: reactExports.lazy(loadContentChat),
    preload: loadContentChat,
    requiredPlan: "dev"
  },
  {
    id: "research-monitor",
    titleKey: "appHome.researchMonitor.title",
    descriptionKey: "appHome.researchMonitor.description",
    icon: Telescope,
    component: reactExports.lazy(loadResearchMonitor),
    preload: loadResearchMonitor,
    requiredPlan: "unlimited"
  },
  {
    id: "tts-voice",
    titleKey: "appHome.ttsVoice.title",
    descriptionKey: "appHome.ttsVoice.description",
    icon: AudioLines,
    component: reactExports.lazy(loadTtsVoice),
    preload: loadTtsVoice,
    requiredPlan: "free"
  },
  {
    id: "auto-edit",
    titleKey: "appHome.autoEdit.title",
    descriptionKey: "appHome.autoEdit.description",
    icon: Scissors,
    component: reactExports.lazy(loadAutoEdit),
    preload: loadAutoEdit,
    requiredPlan: "unlimited"
  }
];
const useAppShellStore = create((set) => ({
  activeFeatureId: null,
  settingsOpen: false,
  openFeature: (activeFeatureId) => set({ activeFeatureId, settingsOpen: false }),
  goHome: () => set({ activeFeatureId: null, settingsOpen: false }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen })
}));
const SUPABASE_URL = "https://vodjxhmlfyduluskpisc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZGp4aG1sZnlkdWx1c2twaXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzkyMzYsImV4cCI6MjEwMDcxNTIzNn0.dS9eyRG8oFErSMqbHhHpBoE9hLU9jAydRRIc5UtNDMg";
const AUTH_CALLBACK_URL = "logdd://auth/callback";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "logdd-supabase-auth"
  }
});
function asRecord(value) {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? value : {};
}
function readString(record, ...keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return void 0;
}
function readNumber(record, fallback, ...keys) {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}
function normalizePlan(value) {
  return value === "pro" || value === "unlimited" || value === "dev" ? value : "free";
}
function hasPlanAccess(current, required) {
  const rank = { free: 0, pro: 1, unlimited: 2, dev: 3 };
  return rank[current ?? "free"] >= rank[required];
}
async function startGoogleSignIn() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_CALLBACK_URL,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" }
    }
  });
  if (error) throw error;
  if (!data.url) throw new Error("Supabase did not return a Google sign-in URL.");
  if (window.authBridge) {
    const result = await window.authBridge.openExternal(data.url);
    if (!result.success) throw new Error(result.error || "Cannot open Google sign-in.");
    return;
  }
  window.location.assign(data.url);
}
async function finishOAuthSignIn(callbackUrl) {
  const parsed = new URL(callbackUrl);
  const oauthError = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
  if (oauthError) throw new Error(oauthError);
  const code = parsed.searchParams.get("code");
  if (!code) throw new Error("OAuth callback is missing its authorization code.");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}
async function getStoredSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
async function signOutAccount() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
async function updateDisplayName(displayName) {
  const name = displayName.trim();
  if (!name) throw new Error("Display name cannot be empty.");
  const session = await getStoredSession();
  if (!session) throw new Error("You are not signed in.");
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", session.user.id);
  if (error) throw error;
}
function getGoogleDisplayName(user) {
  const metadata = asRecord(user.user_metadata);
  return readString(metadata, "full_name", "name", "display_name") || "";
}
async function checkAccountAndClaimDevice(params) {
  const session = await getStoredSession();
  if (!session) throw new Error("You are not signed in.");
  const { data: rpcData, error: rpcError } = await supabase.rpc("check_account_and_claim_device", {
    p_device_hash: params.deviceHash,
    p_device_name: params.deviceName
  });
  if (rpcError) throw rpcError;
  const [{ data: profile, error: profileError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from("profiles").select("display_name,email,created_at").eq("user_id", session.user.id).maybeSingle(),
    supabase.from("entitlements").select("plan,status,expires_at,max_devices").eq("user_id", session.user.id).maybeSingle()
  ]);
  if (profileError) throw profileError;
  if (entitlementError) throw entitlementError;
  const rpc = asRecord(rpcData);
  const entitlementRecord = asRecord(entitlement);
  const profileRecord = asRecord(profile);
  const reason = readString(rpc, "reason", "code", "error");
  const status = readString(entitlementRecord, "status") === "blocked" ? "blocked" : "active";
  const expiresAt = readString(entitlementRecord, "expires_at");
  const expired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  const explicitAllowed = typeof rpc.allowed === "boolean" ? rpc.allowed : typeof rpc.ok === "boolean" ? rpc.ok : void 0;
  const deniedReason = reason === "blocked" || reason === "device_limit" || reason === "expired";
  const allowed = explicitAllowed ?? (!deniedReason && status === "active");
  return {
    allowed,
    reason,
    userId: session.user.id,
    email: readString(profileRecord, "email") || session.user.email || "",
    displayName: readString(profileRecord, "display_name") || getGoogleDisplayName(session.user),
    registeredAt: readString(profileRecord, "created_at"),
    plan: expired ? "free" : normalizePlan(entitlementRecord.plan ?? rpc.plan),
    status,
    expiresAt,
    maxDevices: Math.max(1, readNumber(entitlementRecord, 1, "max_devices"))
  };
}
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, void 0);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, void 0)),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const persistImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  let hydrationVersion = 0;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    return setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      return setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    const currentVersion = ++hydrationVersion;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            const migration = options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
            if (migration instanceof Promise) {
              return migration.then((result) => [true, result]);
            }
            return [true, migration];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      if (currentVersion !== hydrationVersion) {
        return;
      }
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e) => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persist = persistImpl;
const emptyAccount = {
  userId: "",
  email: "",
  userName: "",
  plan: "free",
  status: "active",
  maxDevices: 1,
  deviceAllowed: true
};
const useLicenseStore = create()(
  persist(
    (set) => ({
      machineId: "",
      deviceName: "",
      ...emptyAccount,
      setDeviceInfo: (machineId, deviceName) => set({ machineId, deviceName }),
      setSessionUser: (userId, email, userName) => set({
        ...emptyAccount,
        userId,
        email,
        userName: userName.trim()
      }),
      setAccountAccess: (access) => set({
        userId: access.userId,
        email: access.email,
        userName: access.displayName,
        registeredAt: access.registeredAt,
        plan: access.plan,
        status: access.status,
        lastValidUntil: access.expiresAt,
        lastCheckedAt: Date.now(),
        maxDevices: access.maxDevices,
        deviceAllowed: access.allowed,
        deviceAccessReason: access.reason
      }),
      setUserName: (userName) => set({ userName: userName.trim() }),
      clearAccount: () => set(emptyAccount)
    }),
    {
      name: "opencut-license",
      version: 3,
      migrate: (persisted) => {
        const previous = persisted;
        return {
          machineId: "",
          deviceName: "",
          ...emptyAccount,
          userName: typeof previous.userName === "string" ? previous.userName : ""
        };
      }
    }
  )
);
function __insertCSS(code) {
  if (typeof document == "undefined") return;
  let head = document.head || document.getElementsByTagName("head")[0];
  let style = document.createElement("style");
  style.type = "text/css";
  head.appendChild(style);
  style.styleSheet ? style.styleSheet.cssText = code : style.appendChild(document.createTextNode(code));
}
const getAsset = (type) => {
  switch (type) {
    case "success":
      return SuccessIcon;
    case "info":
      return InfoIcon;
    case "warning":
      return WarningIcon;
    case "error":
      return ErrorIcon;
    default:
      return null;
  }
};
const bars = Array(12).fill(0);
const Loader = ({ visible, className }) => {
  return /* @__PURE__ */ React.createElement("div", {
    className: [
      "sonner-loading-wrapper",
      className
    ].filter(Boolean).join(" "),
    "data-visible": visible
  }, /* @__PURE__ */ React.createElement("div", {
    className: "sonner-spinner"
  }, bars.map((_, i) => /* @__PURE__ */ React.createElement("div", {
    className: "sonner-loading-bar",
    key: `spinner-bar-${i}`
  }))));
};
const SuccessIcon = /* @__PURE__ */ React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor",
  height: "20",
  width: "20"
}, /* @__PURE__ */ React.createElement("path", {
  fillRule: "evenodd",
  d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
  clipRule: "evenodd"
}));
const WarningIcon = /* @__PURE__ */ React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  height: "20",
  width: "20"
}, /* @__PURE__ */ React.createElement("path", {
  fillRule: "evenodd",
  d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z",
  clipRule: "evenodd"
}));
const InfoIcon = /* @__PURE__ */ React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor",
  height: "20",
  width: "20"
}, /* @__PURE__ */ React.createElement("path", {
  fillRule: "evenodd",
  d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z",
  clipRule: "evenodd"
}));
const ErrorIcon = /* @__PURE__ */ React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "currentColor",
  height: "20",
  width: "20"
}, /* @__PURE__ */ React.createElement("path", {
  fillRule: "evenodd",
  d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z",
  clipRule: "evenodd"
}));
const CloseIcon = /* @__PURE__ */ React.createElement("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  width: "12",
  height: "12",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /* @__PURE__ */ React.createElement("line", {
  x1: "18",
  y1: "6",
  x2: "6",
  y2: "18"
}), /* @__PURE__ */ React.createElement("line", {
  x1: "6",
  y1: "6",
  x2: "18",
  y2: "18"
}));
const useIsDocumentHidden = () => {
  const [isDocumentHidden, setIsDocumentHidden] = React.useState(document.hidden);
  React.useEffect(() => {
    const callback = () => {
      setIsDocumentHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", callback);
    return () => window.removeEventListener("visibilitychange", callback);
  }, []);
  return isDocumentHidden;
};
let toastsCounter = 1;
class Observer {
  constructor() {
    this.subscribe = (subscriber) => {
      this.subscribers.push(subscriber);
      return () => {
        const index = this.subscribers.indexOf(subscriber);
        this.subscribers.splice(index, 1);
      };
    };
    this.publish = (data) => {
      this.subscribers.forEach((subscriber) => subscriber(data));
    };
    this.addToast = (data) => {
      this.publish(data);
      this.toasts = [
        ...this.toasts,
        data
      ];
    };
    this.create = (data) => {
      var _data_id;
      const { message, ...rest } = data;
      const id = typeof (data == null ? void 0 : data.id) === "number" || ((_data_id = data.id) == null ? void 0 : _data_id.length) > 0 ? data.id : toastsCounter++;
      const alreadyExists = this.toasts.find((toast2) => {
        return toast2.id === id;
      });
      const dismissible = data.dismissible === void 0 ? true : data.dismissible;
      if (this.dismissedToasts.has(id)) {
        this.dismissedToasts.delete(id);
      }
      if (alreadyExists) {
        this.toasts = this.toasts.map((toast2) => {
          if (toast2.id === id) {
            this.publish({
              ...toast2,
              ...data,
              id,
              title: message
            });
            return {
              ...toast2,
              ...data,
              id,
              dismissible,
              title: message
            };
          }
          return toast2;
        });
      } else {
        this.addToast({
          title: message,
          ...rest,
          dismissible,
          id
        });
      }
      return id;
    };
    this.dismiss = (id) => {
      if (id) {
        this.dismissedToasts.add(id);
        requestAnimationFrame(() => this.subscribers.forEach((subscriber) => subscriber({
          id,
          dismiss: true
        })));
      } else {
        this.toasts.forEach((toast2) => {
          this.subscribers.forEach((subscriber) => subscriber({
            id: toast2.id,
            dismiss: true
          }));
        });
      }
      return id;
    };
    this.message = (message, data) => {
      return this.create({
        ...data,
        message
      });
    };
    this.error = (message, data) => {
      return this.create({
        ...data,
        message,
        type: "error"
      });
    };
    this.success = (message, data) => {
      return this.create({
        ...data,
        type: "success",
        message
      });
    };
    this.info = (message, data) => {
      return this.create({
        ...data,
        type: "info",
        message
      });
    };
    this.warning = (message, data) => {
      return this.create({
        ...data,
        type: "warning",
        message
      });
    };
    this.loading = (message, data) => {
      return this.create({
        ...data,
        type: "loading",
        message
      });
    };
    this.promise = (promise, data) => {
      if (!data) {
        return;
      }
      let id = void 0;
      if (data.loading !== void 0) {
        id = this.create({
          ...data,
          promise,
          type: "loading",
          message: data.loading,
          description: typeof data.description !== "function" ? data.description : void 0
        });
      }
      const p = Promise.resolve(promise instanceof Function ? promise() : promise);
      let shouldDismiss = id !== void 0;
      let result;
      const originalPromise = p.then(async (response) => {
        result = [
          "resolve",
          response
        ];
        const isReactElementResponse = React.isValidElement(response);
        if (isReactElementResponse) {
          shouldDismiss = false;
          this.create({
            id,
            type: "default",
            message: response
          });
        } else if (isHttpResponse(response) && !response.ok) {
          shouldDismiss = false;
          const promiseData = typeof data.error === "function" ? await data.error(`HTTP error! status: ${response.status}`) : data.error;
          const description = typeof data.description === "function" ? await data.description(`HTTP error! status: ${response.status}`) : data.description;
          const isExtendedResult = typeof promiseData === "object" && !React.isValidElement(promiseData);
          const toastSettings = isExtendedResult ? promiseData : {
            message: promiseData
          };
          this.create({
            id,
            type: "error",
            description,
            ...toastSettings
          });
        } else if (response instanceof Error) {
          shouldDismiss = false;
          const promiseData = typeof data.error === "function" ? await data.error(response) : data.error;
          const description = typeof data.description === "function" ? await data.description(response) : data.description;
          const isExtendedResult = typeof promiseData === "object" && !React.isValidElement(promiseData);
          const toastSettings = isExtendedResult ? promiseData : {
            message: promiseData
          };
          this.create({
            id,
            type: "error",
            description,
            ...toastSettings
          });
        } else if (data.success !== void 0) {
          shouldDismiss = false;
          const promiseData = typeof data.success === "function" ? await data.success(response) : data.success;
          const description = typeof data.description === "function" ? await data.description(response) : data.description;
          const isExtendedResult = typeof promiseData === "object" && !React.isValidElement(promiseData);
          const toastSettings = isExtendedResult ? promiseData : {
            message: promiseData
          };
          this.create({
            id,
            type: "success",
            description,
            ...toastSettings
          });
        }
      }).catch(async (error) => {
        result = [
          "reject",
          error
        ];
        if (data.error !== void 0) {
          shouldDismiss = false;
          const promiseData = typeof data.error === "function" ? await data.error(error) : data.error;
          const description = typeof data.description === "function" ? await data.description(error) : data.description;
          const isExtendedResult = typeof promiseData === "object" && !React.isValidElement(promiseData);
          const toastSettings = isExtendedResult ? promiseData : {
            message: promiseData
          };
          this.create({
            id,
            type: "error",
            description,
            ...toastSettings
          });
        }
      }).finally(() => {
        if (shouldDismiss) {
          this.dismiss(id);
          id = void 0;
        }
        data.finally == null ? void 0 : data.finally.call(data);
      });
      const unwrap = () => new Promise((resolve, reject) => originalPromise.then(() => result[0] === "reject" ? reject(result[1]) : resolve(result[1])).catch(reject));
      if (typeof id !== "string" && typeof id !== "number") {
        return {
          unwrap
        };
      } else {
        return Object.assign(id, {
          unwrap
        });
      }
    };
    this.custom = (jsx, data) => {
      const id = (data == null ? void 0 : data.id) || toastsCounter++;
      this.create({
        jsx: jsx(id),
        id,
        ...data
      });
      return id;
    };
    this.getActiveToasts = () => {
      return this.toasts.filter((toast2) => !this.dismissedToasts.has(toast2.id));
    };
    this.subscribers = [];
    this.toasts = [];
    this.dismissedToasts = /* @__PURE__ */ new Set();
  }
}
const ToastState = new Observer();
const toastFunction = (message, data) => {
  const id = (data == null ? void 0 : data.id) || toastsCounter++;
  ToastState.addToast({
    title: message,
    ...data,
    id
  });
  return id;
};
const isHttpResponse = (data) => {
  return data && typeof data === "object" && "ok" in data && typeof data.ok === "boolean" && "status" in data && typeof data.status === "number";
};
const basicToast = toastFunction;
const getHistory = () => ToastState.toasts;
const getToasts = () => ToastState.getActiveToasts();
const toast = Object.assign(basicToast, {
  success: ToastState.success,
  info: ToastState.info,
  warning: ToastState.warning,
  error: ToastState.error,
  custom: ToastState.custom,
  message: ToastState.message,
  promise: ToastState.promise,
  dismiss: ToastState.dismiss,
  loading: ToastState.loading
}, {
  getHistory,
  getToasts
});
__insertCSS("[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}");
function isAction(action) {
  return action.label !== void 0;
}
const VISIBLE_TOASTS_AMOUNT = 3;
const VIEWPORT_OFFSET = "24px";
const MOBILE_VIEWPORT_OFFSET = "16px";
const TOAST_LIFETIME = 4e3;
const TOAST_WIDTH = 356;
const GAP = 14;
const SWIPE_THRESHOLD = 45;
const TIME_BEFORE_UNMOUNT = 200;
function cn$1(...classes) {
  return classes.filter(Boolean).join(" ");
}
function getDefaultSwipeDirections(position) {
  const [y, x] = position.split("-");
  const directions = [];
  if (y) {
    directions.push(y);
  }
  if (x) {
    directions.push(x);
  }
  return directions;
}
const Toast = (props) => {
  var _toast_classNames, _toast_classNames1, _toast_classNames2, _toast_classNames3, _toast_classNames4, _toast_classNames5, _toast_classNames6, _toast_classNames7, _toast_classNames8;
  const { invert: ToasterInvert, toast: toast2, unstyled, interacting, setHeights, visibleToasts, heights, index, toasts, expanded, removeToast, defaultRichColors, closeButton: closeButtonFromToaster, style, cancelButtonStyle, actionButtonStyle, className = "", descriptionClassName = "", duration: durationFromToaster, position, gap, expandByDefault, classNames, icons, closeButtonAriaLabel = "Close toast" } = props;
  const [swipeDirection, setSwipeDirection] = React.useState(null);
  const [swipeOutDirection, setSwipeOutDirection] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);
  const [removed, setRemoved] = React.useState(false);
  const [swiping, setSwiping] = React.useState(false);
  const [swipeOut, setSwipeOut] = React.useState(false);
  const [isSwiped, setIsSwiped] = React.useState(false);
  const [offsetBeforeRemove, setOffsetBeforeRemove] = React.useState(0);
  const [initialHeight, setInitialHeight] = React.useState(0);
  const remainingTime = React.useRef(toast2.duration || durationFromToaster || TOAST_LIFETIME);
  const dragStartTime = React.useRef(null);
  const toastRef = React.useRef(null);
  const isFront = index === 0;
  const isVisible = index + 1 <= visibleToasts;
  const toastType = toast2.type;
  const dismissible = toast2.dismissible !== false;
  const toastClassname = toast2.className || "";
  const toastDescriptionClassname = toast2.descriptionClassName || "";
  const heightIndex = React.useMemo(() => heights.findIndex((height) => height.toastId === toast2.id) || 0, [
    heights,
    toast2.id
  ]);
  const closeButton = React.useMemo(() => {
    var _toast_closeButton;
    return (_toast_closeButton = toast2.closeButton) != null ? _toast_closeButton : closeButtonFromToaster;
  }, [
    toast2.closeButton,
    closeButtonFromToaster
  ]);
  const duration = React.useMemo(() => toast2.duration || durationFromToaster || TOAST_LIFETIME, [
    toast2.duration,
    durationFromToaster
  ]);
  const closeTimerStartTimeRef = React.useRef(0);
  const offset = React.useRef(0);
  const lastCloseTimerStartTimeRef = React.useRef(0);
  const pointerStartRef = React.useRef(null);
  const [y, x] = position.split("-");
  const toastsHeightBefore = React.useMemo(() => {
    return heights.reduce((prev, curr, reducerIndex) => {
      if (reducerIndex >= heightIndex) {
        return prev;
      }
      return prev + curr.height;
    }, 0);
  }, [
    heights,
    heightIndex
  ]);
  const isDocumentHidden = useIsDocumentHidden();
  const invert = toast2.invert || ToasterInvert;
  const disabled = toastType === "loading";
  offset.current = React.useMemo(() => heightIndex * gap + toastsHeightBefore, [
    heightIndex,
    toastsHeightBefore
  ]);
  React.useEffect(() => {
    remainingTime.current = duration;
  }, [
    duration
  ]);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    const toastNode = toastRef.current;
    if (toastNode) {
      const height = toastNode.getBoundingClientRect().height;
      setInitialHeight(height);
      setHeights((h) => [
        {
          toastId: toast2.id,
          height,
          position: toast2.position
        },
        ...h
      ]);
      return () => setHeights((h) => h.filter((height2) => height2.toastId !== toast2.id));
    }
  }, [
    setHeights,
    toast2.id
  ]);
  React.useLayoutEffect(() => {
    if (!mounted) return;
    const toastNode = toastRef.current;
    const originalHeight = toastNode.style.height;
    toastNode.style.height = "auto";
    const newHeight = toastNode.getBoundingClientRect().height;
    toastNode.style.height = originalHeight;
    setInitialHeight(newHeight);
    setHeights((heights2) => {
      const alreadyExists = heights2.find((height) => height.toastId === toast2.id);
      if (!alreadyExists) {
        return [
          {
            toastId: toast2.id,
            height: newHeight,
            position: toast2.position
          },
          ...heights2
        ];
      } else {
        return heights2.map((height) => height.toastId === toast2.id ? {
          ...height,
          height: newHeight
        } : height);
      }
    });
  }, [
    mounted,
    toast2.title,
    toast2.description,
    setHeights,
    toast2.id,
    toast2.jsx,
    toast2.action,
    toast2.cancel
  ]);
  const deleteToast = React.useCallback(() => {
    setRemoved(true);
    setOffsetBeforeRemove(offset.current);
    setHeights((h) => h.filter((height) => height.toastId !== toast2.id));
    setTimeout(() => {
      removeToast(toast2);
    }, TIME_BEFORE_UNMOUNT);
  }, [
    toast2,
    removeToast,
    setHeights,
    offset
  ]);
  React.useEffect(() => {
    if (toast2.promise && toastType === "loading" || toast2.duration === Infinity || toast2.type === "loading") return;
    let timeoutId;
    const pauseTimer = () => {
      if (lastCloseTimerStartTimeRef.current < closeTimerStartTimeRef.current) {
        const elapsedTime = (/* @__PURE__ */ new Date()).getTime() - closeTimerStartTimeRef.current;
        remainingTime.current = remainingTime.current - elapsedTime;
      }
      lastCloseTimerStartTimeRef.current = (/* @__PURE__ */ new Date()).getTime();
    };
    const startTimer = () => {
      if (remainingTime.current === Infinity) return;
      closeTimerStartTimeRef.current = (/* @__PURE__ */ new Date()).getTime();
      timeoutId = setTimeout(() => {
        toast2.onAutoClose == null ? void 0 : toast2.onAutoClose.call(toast2, toast2);
        deleteToast();
      }, remainingTime.current);
    };
    if (expanded || interacting || isDocumentHidden) {
      pauseTimer();
    } else {
      startTimer();
    }
    return () => clearTimeout(timeoutId);
  }, [
    expanded,
    interacting,
    toast2,
    toastType,
    isDocumentHidden,
    deleteToast
  ]);
  React.useEffect(() => {
    if (toast2.delete) {
      deleteToast();
      toast2.onDismiss == null ? void 0 : toast2.onDismiss.call(toast2, toast2);
    }
  }, [
    deleteToast,
    toast2.delete
  ]);
  function getLoadingIcon() {
    var _toast_classNames9;
    if (icons == null ? void 0 : icons.loading) {
      var _toast_classNames12;
      return /* @__PURE__ */ React.createElement("div", {
        className: cn$1(classNames == null ? void 0 : classNames.loader, toast2 == null ? void 0 : (_toast_classNames12 = toast2.classNames) == null ? void 0 : _toast_classNames12.loader, "sonner-loader"),
        "data-visible": toastType === "loading"
      }, icons.loading);
    }
    return /* @__PURE__ */ React.createElement(Loader, {
      className: cn$1(classNames == null ? void 0 : classNames.loader, toast2 == null ? void 0 : (_toast_classNames9 = toast2.classNames) == null ? void 0 : _toast_classNames9.loader),
      visible: toastType === "loading"
    });
  }
  const icon = toast2.icon || (icons == null ? void 0 : icons[toastType]) || getAsset(toastType);
  var _toast_richColors, _icons_close;
  return /* @__PURE__ */ React.createElement("li", {
    tabIndex: 0,
    ref: toastRef,
    className: cn$1(className, toastClassname, classNames == null ? void 0 : classNames.toast, toast2 == null ? void 0 : (_toast_classNames = toast2.classNames) == null ? void 0 : _toast_classNames.toast, classNames == null ? void 0 : classNames.default, classNames == null ? void 0 : classNames[toastType], toast2 == null ? void 0 : (_toast_classNames1 = toast2.classNames) == null ? void 0 : _toast_classNames1[toastType]),
    "data-sonner-toast": "",
    "data-rich-colors": (_toast_richColors = toast2.richColors) != null ? _toast_richColors : defaultRichColors,
    "data-styled": !Boolean(toast2.jsx || toast2.unstyled || unstyled),
    "data-mounted": mounted,
    "data-promise": Boolean(toast2.promise),
    "data-swiped": isSwiped,
    "data-removed": removed,
    "data-visible": isVisible,
    "data-y-position": y,
    "data-x-position": x,
    "data-index": index,
    "data-front": isFront,
    "data-swiping": swiping,
    "data-dismissible": dismissible,
    "data-type": toastType,
    "data-invert": invert,
    "data-swipe-out": swipeOut,
    "data-swipe-direction": swipeOutDirection,
    "data-expanded": Boolean(expanded || expandByDefault && mounted),
    "data-testid": toast2.testId,
    style: {
      "--index": index,
      "--toasts-before": index,
      "--z-index": toasts.length - index,
      "--offset": `${removed ? offsetBeforeRemove : offset.current}px`,
      "--initial-height": expandByDefault ? "auto" : `${initialHeight}px`,
      ...style,
      ...toast2.style
    },
    onDragEnd: () => {
      setSwiping(false);
      setSwipeDirection(null);
      pointerStartRef.current = null;
    },
    onPointerDown: (event) => {
      if (event.button === 2) return;
      if (disabled || !dismissible) return;
      dragStartTime.current = /* @__PURE__ */ new Date();
      setOffsetBeforeRemove(offset.current);
      event.target.setPointerCapture(event.pointerId);
      if (event.target.tagName === "BUTTON") return;
      setSwiping(true);
      pointerStartRef.current = {
        x: event.clientX,
        y: event.clientY
      };
    },
    onPointerUp: () => {
      var _toastRef_current, _toastRef_current1, _dragStartTime_current;
      if (swipeOut || !dismissible) return;
      pointerStartRef.current = null;
      const swipeAmountX = Number(((_toastRef_current = toastRef.current) == null ? void 0 : _toastRef_current.style.getPropertyValue("--swipe-amount-x").replace("px", "")) || 0);
      const swipeAmountY = Number(((_toastRef_current1 = toastRef.current) == null ? void 0 : _toastRef_current1.style.getPropertyValue("--swipe-amount-y").replace("px", "")) || 0);
      const timeTaken = (/* @__PURE__ */ new Date()).getTime() - ((_dragStartTime_current = dragStartTime.current) == null ? void 0 : _dragStartTime_current.getTime());
      const swipeAmount = swipeDirection === "x" ? swipeAmountX : swipeAmountY;
      const velocity = Math.abs(swipeAmount) / timeTaken;
      if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) {
        setOffsetBeforeRemove(offset.current);
        toast2.onDismiss == null ? void 0 : toast2.onDismiss.call(toast2, toast2);
        if (swipeDirection === "x") {
          setSwipeOutDirection(swipeAmountX > 0 ? "right" : "left");
        } else {
          setSwipeOutDirection(swipeAmountY > 0 ? "down" : "up");
        }
        deleteToast();
        setSwipeOut(true);
        return;
      } else {
        var _toastRef_current2, _toastRef_current3;
        (_toastRef_current2 = toastRef.current) == null ? void 0 : _toastRef_current2.style.setProperty("--swipe-amount-x", `0px`);
        (_toastRef_current3 = toastRef.current) == null ? void 0 : _toastRef_current3.style.setProperty("--swipe-amount-y", `0px`);
      }
      setIsSwiped(false);
      setSwiping(false);
      setSwipeDirection(null);
    },
    onPointerMove: (event) => {
      var _window_getSelection, _toastRef_current, _toastRef_current1;
      if (!pointerStartRef.current || !dismissible) return;
      const isHighlighted = ((_window_getSelection = window.getSelection()) == null ? void 0 : _window_getSelection.toString().length) > 0;
      if (isHighlighted) return;
      const yDelta = event.clientY - pointerStartRef.current.y;
      const xDelta = event.clientX - pointerStartRef.current.x;
      var _props_swipeDirections;
      const swipeDirections = (_props_swipeDirections = props.swipeDirections) != null ? _props_swipeDirections : getDefaultSwipeDirections(position);
      if (!swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
        setSwipeDirection(Math.abs(xDelta) > Math.abs(yDelta) ? "x" : "y");
      }
      let swipeAmount = {
        x: 0,
        y: 0
      };
      const getDampening = (delta) => {
        const factor = Math.abs(delta) / 20;
        return 1 / (1.5 + factor);
      };
      if (swipeDirection === "y") {
        if (swipeDirections.includes("top") || swipeDirections.includes("bottom")) {
          if (swipeDirections.includes("top") && yDelta < 0 || swipeDirections.includes("bottom") && yDelta > 0) {
            swipeAmount.y = yDelta;
          } else {
            const dampenedDelta = yDelta * getDampening(yDelta);
            swipeAmount.y = Math.abs(dampenedDelta) < Math.abs(yDelta) ? dampenedDelta : yDelta;
          }
        }
      } else if (swipeDirection === "x") {
        if (swipeDirections.includes("left") || swipeDirections.includes("right")) {
          if (swipeDirections.includes("left") && xDelta < 0 || swipeDirections.includes("right") && xDelta > 0) {
            swipeAmount.x = xDelta;
          } else {
            const dampenedDelta = xDelta * getDampening(xDelta);
            swipeAmount.x = Math.abs(dampenedDelta) < Math.abs(xDelta) ? dampenedDelta : xDelta;
          }
        }
      }
      if (Math.abs(swipeAmount.x) > 0 || Math.abs(swipeAmount.y) > 0) {
        setIsSwiped(true);
      }
      (_toastRef_current = toastRef.current) == null ? void 0 : _toastRef_current.style.setProperty("--swipe-amount-x", `${swipeAmount.x}px`);
      (_toastRef_current1 = toastRef.current) == null ? void 0 : _toastRef_current1.style.setProperty("--swipe-amount-y", `${swipeAmount.y}px`);
    }
  }, closeButton && !toast2.jsx && toastType !== "loading" ? /* @__PURE__ */ React.createElement("button", {
    "aria-label": closeButtonAriaLabel,
    "data-disabled": disabled,
    "data-close-button": true,
    onClick: disabled || !dismissible ? () => {
    } : () => {
      deleteToast();
      toast2.onDismiss == null ? void 0 : toast2.onDismiss.call(toast2, toast2);
    },
    className: cn$1(classNames == null ? void 0 : classNames.closeButton, toast2 == null ? void 0 : (_toast_classNames2 = toast2.classNames) == null ? void 0 : _toast_classNames2.closeButton)
  }, (_icons_close = icons == null ? void 0 : icons.close) != null ? _icons_close : CloseIcon) : null, (toastType || toast2.icon || toast2.promise) && toast2.icon !== null && ((icons == null ? void 0 : icons[toastType]) !== null || toast2.icon) ? /* @__PURE__ */ React.createElement("div", {
    "data-icon": "",
    className: cn$1(classNames == null ? void 0 : classNames.icon, toast2 == null ? void 0 : (_toast_classNames3 = toast2.classNames) == null ? void 0 : _toast_classNames3.icon)
  }, toast2.promise || toast2.type === "loading" && !toast2.icon ? toast2.icon || getLoadingIcon() : null, toast2.type !== "loading" ? icon : null) : null, /* @__PURE__ */ React.createElement("div", {
    "data-content": "",
    className: cn$1(classNames == null ? void 0 : classNames.content, toast2 == null ? void 0 : (_toast_classNames4 = toast2.classNames) == null ? void 0 : _toast_classNames4.content)
  }, /* @__PURE__ */ React.createElement("div", {
    "data-title": "",
    className: cn$1(classNames == null ? void 0 : classNames.title, toast2 == null ? void 0 : (_toast_classNames5 = toast2.classNames) == null ? void 0 : _toast_classNames5.title)
  }, toast2.jsx ? toast2.jsx : typeof toast2.title === "function" ? toast2.title() : toast2.title), toast2.description ? /* @__PURE__ */ React.createElement("div", {
    "data-description": "",
    className: cn$1(descriptionClassName, toastDescriptionClassname, classNames == null ? void 0 : classNames.description, toast2 == null ? void 0 : (_toast_classNames6 = toast2.classNames) == null ? void 0 : _toast_classNames6.description)
  }, typeof toast2.description === "function" ? toast2.description() : toast2.description) : null), /* @__PURE__ */ React.isValidElement(toast2.cancel) ? toast2.cancel : toast2.cancel && isAction(toast2.cancel) ? /* @__PURE__ */ React.createElement("button", {
    "data-button": true,
    "data-cancel": true,
    style: toast2.cancelButtonStyle || cancelButtonStyle,
    onClick: (event) => {
      if (!isAction(toast2.cancel)) return;
      if (!dismissible) return;
      toast2.cancel.onClick == null ? void 0 : toast2.cancel.onClick.call(toast2.cancel, event);
      deleteToast();
    },
    className: cn$1(classNames == null ? void 0 : classNames.cancelButton, toast2 == null ? void 0 : (_toast_classNames7 = toast2.classNames) == null ? void 0 : _toast_classNames7.cancelButton)
  }, toast2.cancel.label) : null, /* @__PURE__ */ React.isValidElement(toast2.action) ? toast2.action : toast2.action && isAction(toast2.action) ? /* @__PURE__ */ React.createElement("button", {
    "data-button": true,
    "data-action": true,
    style: toast2.actionButtonStyle || actionButtonStyle,
    onClick: (event) => {
      if (!isAction(toast2.action)) return;
      toast2.action.onClick == null ? void 0 : toast2.action.onClick.call(toast2.action, event);
      if (event.defaultPrevented) return;
      deleteToast();
    },
    className: cn$1(classNames == null ? void 0 : classNames.actionButton, toast2 == null ? void 0 : (_toast_classNames8 = toast2.classNames) == null ? void 0 : _toast_classNames8.actionButton)
  }, toast2.action.label) : null);
};
function getDocumentDirection() {
  if (typeof window === "undefined") return "ltr";
  if (typeof document === "undefined") return "ltr";
  const dirAttribute = document.documentElement.getAttribute("dir");
  if (dirAttribute === "auto" || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction;
  }
  return dirAttribute;
}
function assignOffset(defaultOffset, mobileOffset) {
  const styles = {};
  [
    defaultOffset,
    mobileOffset
  ].forEach((offset, index) => {
    const isMobile = index === 1;
    const prefix = isMobile ? "--mobile-offset" : "--offset";
    const defaultValue = isMobile ? MOBILE_VIEWPORT_OFFSET : VIEWPORT_OFFSET;
    function assignAll(offset2) {
      [
        "top",
        "right",
        "bottom",
        "left"
      ].forEach((key) => {
        styles[`${prefix}-${key}`] = typeof offset2 === "number" ? `${offset2}px` : offset2;
      });
    }
    if (typeof offset === "number" || typeof offset === "string") {
      assignAll(offset);
    } else if (typeof offset === "object") {
      [
        "top",
        "right",
        "bottom",
        "left"
      ].forEach((key) => {
        if (offset[key] === void 0) {
          styles[`${prefix}-${key}`] = defaultValue;
        } else {
          styles[`${prefix}-${key}`] = typeof offset[key] === "number" ? `${offset[key]}px` : offset[key];
        }
      });
    } else {
      assignAll(defaultValue);
    }
  });
  return styles;
}
const Toaster$1 = /* @__PURE__ */ React.forwardRef(function Toaster(props, ref) {
  const { id, invert, position = "bottom-right", hotkey = [
    "altKey",
    "KeyT"
  ], expand, closeButton, className, offset, mobileOffset, theme = "light", richColors, duration, style, visibleToasts = VISIBLE_TOASTS_AMOUNT, toastOptions, dir = getDocumentDirection(), gap = GAP, icons, containerAriaLabel = "Notifications" } = props;
  const [toasts, setToasts] = React.useState([]);
  const filteredToasts = React.useMemo(() => {
    if (id) {
      return toasts.filter((toast2) => toast2.toasterId === id);
    }
    return toasts.filter((toast2) => !toast2.toasterId);
  }, [
    toasts,
    id
  ]);
  const possiblePositions = React.useMemo(() => {
    return Array.from(new Set([
      position
    ].concat(filteredToasts.filter((toast2) => toast2.position).map((toast2) => toast2.position))));
  }, [
    filteredToasts,
    position
  ]);
  const [heights, setHeights] = React.useState([]);
  const [expanded, setExpanded] = React.useState(false);
  const [interacting, setInteracting] = React.useState(false);
  const [actualTheme, setActualTheme] = React.useState(theme !== "system" ? theme : typeof window !== "undefined" ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : "light");
  const listRef = React.useRef(null);
  const hotkeyLabel = hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
  const lastFocusedElementRef = React.useRef(null);
  const isFocusWithinRef = React.useRef(false);
  const removeToast = React.useCallback((toastToRemove) => {
    setToasts((toasts2) => {
      var _toasts_find;
      if (!((_toasts_find = toasts2.find((toast2) => toast2.id === toastToRemove.id)) == null ? void 0 : _toasts_find.delete)) {
        ToastState.dismiss(toastToRemove.id);
      }
      return toasts2.filter(({ id: id2 }) => id2 !== toastToRemove.id);
    });
  }, []);
  React.useEffect(() => {
    return ToastState.subscribe((toast2) => {
      if (toast2.dismiss) {
        requestAnimationFrame(() => {
          setToasts((toasts2) => toasts2.map((t) => t.id === toast2.id ? {
            ...t,
            delete: true
          } : t));
        });
        return;
      }
      setTimeout(() => {
        ReactDOM.flushSync(() => {
          setToasts((toasts2) => {
            const indexOfExistingToast = toasts2.findIndex((t) => t.id === toast2.id);
            if (indexOfExistingToast !== -1) {
              return [
                ...toasts2.slice(0, indexOfExistingToast),
                {
                  ...toasts2[indexOfExistingToast],
                  ...toast2
                },
                ...toasts2.slice(indexOfExistingToast + 1)
              ];
            }
            return [
              toast2,
              ...toasts2
            ];
          });
        });
      });
    });
  }, [
    toasts
  ]);
  React.useEffect(() => {
    if (theme !== "system") {
      setActualTheme(theme);
      return;
    }
    if (theme === "system") {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setActualTheme("dark");
      } else {
        setActualTheme("light");
      }
    }
    if (typeof window === "undefined") return;
    const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    try {
      darkMediaQuery.addEventListener("change", ({ matches }) => {
        if (matches) {
          setActualTheme("dark");
        } else {
          setActualTheme("light");
        }
      });
    } catch (error) {
      darkMediaQuery.addListener(({ matches }) => {
        try {
          if (matches) {
            setActualTheme("dark");
          } else {
            setActualTheme("light");
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [
    theme
  ]);
  React.useEffect(() => {
    if (toasts.length <= 1) {
      setExpanded(false);
    }
  }, [
    toasts
  ]);
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      var _listRef_current;
      const isHotkeyPressed = hotkey.every((key) => event[key] || event.code === key);
      if (isHotkeyPressed) {
        var _listRef_current1;
        setExpanded(true);
        (_listRef_current1 = listRef.current) == null ? void 0 : _listRef_current1.focus();
      }
      if (event.code === "Escape" && (document.activeElement === listRef.current || ((_listRef_current = listRef.current) == null ? void 0 : _listRef_current.contains(document.activeElement)))) {
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    hotkey
  ]);
  React.useEffect(() => {
    if (listRef.current) {
      return () => {
        if (lastFocusedElementRef.current) {
          lastFocusedElementRef.current.focus({
            preventScroll: true
          });
          lastFocusedElementRef.current = null;
          isFocusWithinRef.current = false;
        }
      };
    }
  }, [
    listRef.current
  ]);
  return (
    // Remove item from normal navigation flow, only available via hotkey
    /* @__PURE__ */ React.createElement("section", {
      ref,
      "aria-label": `${containerAriaLabel} ${hotkeyLabel}`,
      tabIndex: -1,
      "aria-live": "polite",
      "aria-relevant": "additions text",
      "aria-atomic": "false",
      suppressHydrationWarning: true
    }, possiblePositions.map((position2, index) => {
      var _heights_;
      const [y, x] = position2.split("-");
      if (!filteredToasts.length) return null;
      return /* @__PURE__ */ React.createElement("ol", {
        key: position2,
        dir: dir === "auto" ? getDocumentDirection() : dir,
        tabIndex: -1,
        ref: listRef,
        className,
        "data-sonner-toaster": true,
        "data-sonner-theme": actualTheme,
        "data-y-position": y,
        "data-x-position": x,
        style: {
          "--front-toast-height": `${((_heights_ = heights[0]) == null ? void 0 : _heights_.height) || 0}px`,
          "--width": `${TOAST_WIDTH}px`,
          "--gap": `${gap}px`,
          ...style,
          ...assignOffset(offset, mobileOffset)
        },
        onBlur: (event) => {
          if (isFocusWithinRef.current && !event.currentTarget.contains(event.relatedTarget)) {
            isFocusWithinRef.current = false;
            if (lastFocusedElementRef.current) {
              lastFocusedElementRef.current.focus({
                preventScroll: true
              });
              lastFocusedElementRef.current = null;
            }
          }
        },
        onFocus: (event) => {
          const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset.dismissible === "false";
          if (isNotDismissible) return;
          if (!isFocusWithinRef.current) {
            isFocusWithinRef.current = true;
            lastFocusedElementRef.current = event.relatedTarget;
          }
        },
        onMouseEnter: () => setExpanded(true),
        onMouseMove: () => setExpanded(true),
        onMouseLeave: () => {
          if (!interacting) {
            setExpanded(false);
          }
        },
        onDragEnd: () => setExpanded(false),
        onPointerDown: (event) => {
          const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset.dismissible === "false";
          if (isNotDismissible) return;
          setInteracting(true);
        },
        onPointerUp: () => setInteracting(false)
      }, filteredToasts.filter((toast2) => !toast2.position && index === 0 || toast2.position === position2).map((toast2, index2) => {
        var _toastOptions_duration, _toastOptions_closeButton;
        return /* @__PURE__ */ React.createElement(Toast, {
          key: toast2.id,
          icons,
          index: index2,
          toast: toast2,
          defaultRichColors: richColors,
          duration: (_toastOptions_duration = toastOptions == null ? void 0 : toastOptions.duration) != null ? _toastOptions_duration : duration,
          className: toastOptions == null ? void 0 : toastOptions.className,
          descriptionClassName: toastOptions == null ? void 0 : toastOptions.descriptionClassName,
          invert,
          visibleToasts,
          closeButton: (_toastOptions_closeButton = toastOptions == null ? void 0 : toastOptions.closeButton) != null ? _toastOptions_closeButton : closeButton,
          interacting,
          position: position2,
          style: toastOptions == null ? void 0 : toastOptions.style,
          unstyled: toastOptions == null ? void 0 : toastOptions.unstyled,
          classNames: toastOptions == null ? void 0 : toastOptions.classNames,
          cancelButtonStyle: toastOptions == null ? void 0 : toastOptions.cancelButtonStyle,
          actionButtonStyle: toastOptions == null ? void 0 : toastOptions.actionButtonStyle,
          closeButtonAriaLabel: toastOptions == null ? void 0 : toastOptions.closeButtonAriaLabel,
          removeToast,
          toasts: filteredToasts.filter((t) => t.position == toast2.position),
          heights: heights.filter((h) => h.position == toast2.position),
          setHeights,
          expandByDefault: expand,
          gap,
          expanded,
          swipeDirections: props.swipeDirections
        });
      }));
    }))
  );
});
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
const falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
const cx = clsx;
const cva = (base, config) => (props) => {
  var _config_compoundVariants;
  if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
  const { variants, defaultVariants } = config;
  const getVariantClassNames = Object.keys(variants).map((variant) => {
    const variantProp = props === null || props === void 0 ? void 0 : props[variant];
    const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
    if (variantProp === null) return null;
    const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
    return variants[variant][variantKey];
  });
  const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
    let [key, value] = param;
    if (value === void 0) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
  const getCompoundVariantClassNames = config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
    let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
    return Object.entries(compoundVariantOptions).every((param2) => {
      let [key, value] = param2;
      return Array.isArray(value) ? value.includes({
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key]) : {
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key] === value;
    }) ? [
      ...acc,
      cvClass,
      cvClassName
    ] : acc;
  }, []);
  return cx(base, getVariantClassNames, getCompoundVariantClassNames, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
};
const concatArrays = (array1, array2) => {
  const combinedArray = new Array(array1.length + array2.length);
  for (let i = 0; i < array1.length; i++) {
    combinedArray[i] = array1[i];
  }
  for (let i = 0; i < array2.length; i++) {
    combinedArray[array1.length + i] = array2[i];
  }
  return combinedArray;
};
const createClassValidatorObject = (classGroupId, validator) => ({
  classGroupId,
  validator
});
const createClassPartObject = (nextPart = /* @__PURE__ */ new Map(), validators = null, classGroupId) => ({
  nextPart,
  validators,
  classGroupId
});
const CLASS_PART_SEPARATOR = "-";
const EMPTY_CONFLICTS = [];
const ARBITRARY_PROPERTY_PREFIX = "arbitrary..";
const createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const {
    conflictingClassGroups,
    conflictingClassGroupModifiers
  } = config;
  const getClassGroupId = (className) => {
    if (className.startsWith("[") && className.endsWith("]")) {
      return getGroupIdForArbitraryProperty(className);
    }
    const classParts = className.split(CLASS_PART_SEPARATOR);
    const startIndex = classParts[0] === "" && classParts.length > 1 ? 1 : 0;
    return getGroupRecursive(classParts, startIndex, classMap);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    if (hasPostfixModifier) {
      const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
      const baseConflicts = conflictingClassGroups[classGroupId];
      if (modifierConflicts) {
        if (baseConflicts) {
          return concatArrays(baseConflicts, modifierConflicts);
        }
        return modifierConflicts;
      }
      return baseConflicts || EMPTY_CONFLICTS;
    }
    return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
const getGroupRecursive = (classParts, startIndex, classPartObject) => {
  const classPathsLength = classParts.length - startIndex;
  if (classPathsLength === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[startIndex];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  if (nextClassPartObject) {
    const result = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
    if (result) return result;
  }
  const validators = classPartObject.validators;
  if (validators === null) {
    return void 0;
  }
  const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
  const validatorsLength = validators.length;
  for (let i = 0; i < validatorsLength; i++) {
    const validatorObj = validators[i];
    if (validatorObj.validator(classRest)) {
      return validatorObj.classGroupId;
    }
  }
  return void 0;
};
const getGroupIdForArbitraryProperty = (className) => className.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
  const content = className.slice(1, -1);
  const colonIndex = content.indexOf(":");
  const property = content.slice(0, colonIndex);
  return property ? ARBITRARY_PROPERTY_PREFIX + property : void 0;
})();
const createClassMap = (config) => {
  const {
    theme,
    classGroups
  } = config;
  return processClassGroups(classGroups, theme);
};
const processClassGroups = (classGroups, theme) => {
  const classMap = createClassPartObject();
  for (const classGroupId in classGroups) {
    const group = classGroups[classGroupId];
    processClassesRecursively(group, classMap, classGroupId, theme);
  }
  return classMap;
};
const processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
  const len = classGroup.length;
  for (let i = 0; i < len; i++) {
    const classDefinition = classGroup[i];
    processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
  }
};
const processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (typeof classDefinition === "string") {
    processStringDefinition(classDefinition, classPartObject, classGroupId);
    return;
  }
  if (typeof classDefinition === "function") {
    processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
    return;
  }
  processObjectDefinition(classDefinition, classPartObject, classGroupId, theme);
};
const processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
  const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
  classPartObjectToEdit.classGroupId = classGroupId;
};
const processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (isThemeGetter(classDefinition)) {
    processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
    return;
  }
  if (classPartObject.validators === null) {
    classPartObject.validators = [];
  }
  classPartObject.validators.push(createClassValidatorObject(classGroupId, classDefinition));
};
const processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  const entries = Object.entries(classDefinition);
  const len = entries.length;
  for (let i = 0; i < len; i++) {
    const [key, value] = entries[i];
    processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
  }
};
const getPart = (classPartObject, path) => {
  let current = classPartObject;
  const parts = path.split(CLASS_PART_SEPARATOR);
  const len = parts.length;
  for (let i = 0; i < len; i++) {
    const part = parts[i];
    let next = current.nextPart.get(part);
    if (!next) {
      next = createClassPartObject();
      current.nextPart.set(part, next);
    }
    current = next;
  }
  return current;
};
const isThemeGetter = (func) => "isThemeGetter" in func && func.isThemeGetter === true;
const createLruCache = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => void 0,
      set: () => {
      }
    };
  }
  let cacheSize = 0;
  let cache = /* @__PURE__ */ Object.create(null);
  let previousCache = /* @__PURE__ */ Object.create(null);
  const update = (key, value) => {
    cache[key] = value;
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = /* @__PURE__ */ Object.create(null);
    }
  };
  return {
    get(key) {
      let value = cache[key];
      if (value !== void 0) {
        return value;
      }
      if ((value = previousCache[key]) !== void 0) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (key in cache) {
        cache[key] = value;
      } else {
        update(key, value);
      }
    }
  };
};
const IMPORTANT_MODIFIER = "!";
const MODIFIER_SEPARATOR = ":";
const EMPTY_MODIFIERS = [];
const createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal
});
const createParseClassName = (config) => {
  const {
    prefix,
    experimentalParseClassName
  } = config;
  let parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let parenDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    const len = className.length;
    for (let index = 0; index < len; index++) {
      const currentCharacter = className[index];
      if (bracketDepth === 0 && parenDepth === 0) {
        if (currentCharacter === MODIFIER_SEPARATOR) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + 1;
          continue;
        }
        if (currentCharacter === "/") {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === "[") bracketDepth++;
      else if (currentCharacter === "]") bracketDepth--;
      else if (currentCharacter === "(") parenDepth++;
      else if (currentCharacter === ")") parenDepth--;
    }
    const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
    let baseClassName = baseClassNameWithImportantModifier;
    let hasImportantModifier = false;
    if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
      baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
      hasImportantModifier = true;
    } else if (
      /**
       * In Tailwind CSS v3 the important modifier was at the start of the base class name. This is still supported for legacy reasons.
       * @see https://github.com/dcastil/tailwind-merge/issues/513#issuecomment-2614029864
       */
      baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)
    ) {
      baseClassName = baseClassNameWithImportantModifier.slice(1);
      hasImportantModifier = true;
    }
    const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
    return createResultObject(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
  };
  if (prefix) {
    const fullPrefix = prefix + MODIFIER_SEPARATOR;
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject(EMPTY_MODIFIERS, false, className, void 0, true);
  }
  if (experimentalParseClassName) {
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => experimentalParseClassName({
      className,
      parseClassName: parseClassNameOriginal
    });
  }
  return parseClassName;
};
const createSortModifiers = (config) => {
  const modifierWeights = /* @__PURE__ */ new Map();
  config.orderSensitiveModifiers.forEach((mod, index) => {
    modifierWeights.set(mod, 1e6 + index);
  });
  return (modifiers) => {
    const result = [];
    let currentSegment = [];
    for (let i = 0; i < modifiers.length; i++) {
      const modifier = modifiers[i];
      const isArbitrary = modifier[0] === "[";
      const isOrderSensitive = modifierWeights.has(modifier);
      if (isArbitrary || isOrderSensitive) {
        if (currentSegment.length > 0) {
          currentSegment.sort();
          result.push(...currentSegment);
          currentSegment = [];
        }
        result.push(modifier);
      } else {
        currentSegment.push(modifier);
      }
    }
    if (currentSegment.length > 0) {
      currentSegment.sort();
      result.push(...currentSegment);
    }
    return result;
  };
};
const createConfigUtils = (config) => ({
  cache: createLruCache(config.cacheSize),
  parseClassName: createParseClassName(config),
  sortModifiers: createSortModifiers(config),
  ...createClassGroupUtils(config)
});
const SPLIT_CLASSES_REGEX = /\s+/;
const mergeClassList = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds,
    sortModifiers
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
  let result = "";
  for (let index = classNames.length - 1; index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      isExternal,
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    if (isExternal) {
      result = originalClassName + (result.length > 0 ? " " + result : result);
      continue;
    }
    let hasPostfixModifier = !!maybePostfixModifierPosition;
    let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result = originalClassName + (result.length > 0 ? " " + result : result);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.indexOf(classId) > -1) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    for (let i = 0; i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result = originalClassName + (result.length > 0 ? " " + result : result);
  }
  return result;
};
const twJoin = (...classLists) => {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = "";
  while (index < classLists.length) {
    if (argument = classLists[index++]) {
      if (resolvedValue = toValue(argument)) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
const toValue = (mix) => {
  if (typeof mix === "string") {
    return mix;
  }
  let resolvedValue;
  let string = "";
  for (let k = 0; k < mix.length; k++) {
    if (mix[k]) {
      if (resolvedValue = toValue(mix[k])) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
const createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall;
  const initTailwindMerge = (classList) => {
    const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
    configUtils = createConfigUtils(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  };
  const tailwindMerge = (classList) => {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result = mergeClassList(classList, configUtils);
    cacheSet(classList, result);
    return result;
  };
  functionToCall = initTailwindMerge;
  return (...args) => functionToCall(twJoin(...args));
};
const fallbackThemeArr = [];
const fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || fallbackThemeArr;
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
const arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
const arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
const fractionRegex = /^\d+\/\d+$/;
const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
const lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
const shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
const imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
const isFraction = (value) => fractionRegex.test(value);
const isNumber = (value) => !!value && !Number.isNaN(Number(value));
const isInteger = (value) => !!value && Number.isInteger(Number(value));
const isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
const isTshirtSize = (value) => tshirtUnitRegex.test(value);
const isAny = () => true;
const isLengthOnly = (value) => (
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value)
);
const isNever = () => false;
const isShadow = (value) => shadowRegex.test(value);
const isImage = (value) => imageRegex.test(value);
const isAnyNonArbitrary = (value) => !isArbitraryValue(value) && !isArbitraryVariable(value);
const isArbitrarySize = (value) => getIsArbitraryValue(value, isLabelSize, isNever);
const isArbitraryValue = (value) => arbitraryValueRegex.test(value);
const isArbitraryLength = (value) => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
const isArbitraryNumber = (value) => getIsArbitraryValue(value, isLabelNumber, isNumber);
const isArbitraryPosition = (value) => getIsArbitraryValue(value, isLabelPosition, isNever);
const isArbitraryImage = (value) => getIsArbitraryValue(value, isLabelImage, isImage);
const isArbitraryShadow = (value) => getIsArbitraryValue(value, isLabelShadow, isShadow);
const isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
const isArbitraryVariableLength = (value) => getIsArbitraryVariable(value, isLabelLength);
const isArbitraryVariableFamilyName = (value) => getIsArbitraryVariable(value, isLabelFamilyName);
const isArbitraryVariablePosition = (value) => getIsArbitraryVariable(value, isLabelPosition);
const isArbitraryVariableSize = (value) => getIsArbitraryVariable(value, isLabelSize);
const isArbitraryVariableImage = (value) => getIsArbitraryVariable(value, isLabelImage);
const isArbitraryVariableShadow = (value) => getIsArbitraryVariable(value, isLabelShadow, true);
const getIsArbitraryValue = (value, testLabel, testValue) => {
  const result = arbitraryValueRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return testValue(result[2]);
  }
  return false;
};
const getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
  const result = arbitraryVariableRegex.exec(value);
  if (result) {
    if (result[1]) {
      return testLabel(result[1]);
    }
    return shouldMatchNoLabel;
  }
  return false;
};
const isLabelPosition = (label) => label === "position" || label === "percentage";
const isLabelImage = (label) => label === "image" || label === "url";
const isLabelSize = (label) => label === "length" || label === "size" || label === "bg-size";
const isLabelLength = (label) => label === "length";
const isLabelNumber = (label) => label === "number";
const isLabelFamilyName = (label) => label === "family-name";
const isLabelShadow = (label) => label === "shadow";
const getDefaultConfig = () => {
  const themeColor = fromTheme("color");
  const themeFont = fromTheme("font");
  const themeText = fromTheme("text");
  const themeFontWeight = fromTheme("font-weight");
  const themeTracking = fromTheme("tracking");
  const themeLeading = fromTheme("leading");
  const themeBreakpoint = fromTheme("breakpoint");
  const themeContainer = fromTheme("container");
  const themeSpacing = fromTheme("spacing");
  const themeRadius = fromTheme("radius");
  const themeShadow = fromTheme("shadow");
  const themeInsetShadow = fromTheme("inset-shadow");
  const themeTextShadow = fromTheme("text-shadow");
  const themeDropShadow = fromTheme("drop-shadow");
  const themeBlur = fromTheme("blur");
  const themePerspective = fromTheme("perspective");
  const themeAspect = fromTheme("aspect");
  const themeEase = fromTheme("ease");
  const themeAnimate = fromTheme("animate");
  const scaleBreak = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const scalePosition = () => [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-top",
    "top-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-top",
    "bottom-right",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "right-bottom",
    "bottom-left",
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    "left-bottom"
  ];
  const scalePositionWithArbitrary = () => [...scalePosition(), isArbitraryVariable, isArbitraryValue];
  const scaleOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const scaleOverscroll = () => ["auto", "contain", "none"];
  const scaleUnambiguousSpacing = () => [isArbitraryVariable, isArbitraryValue, themeSpacing];
  const scaleInset = () => [isFraction, "full", "auto", ...scaleUnambiguousSpacing()];
  const scaleGridTemplateColsRows = () => [isInteger, "none", "subgrid", isArbitraryVariable, isArbitraryValue];
  const scaleGridColRowStartAndEnd = () => ["auto", {
    span: ["full", isInteger, isArbitraryVariable, isArbitraryValue]
  }, isInteger, isArbitraryVariable, isArbitraryValue];
  const scaleGridColRowStartOrEnd = () => [isInteger, "auto", isArbitraryVariable, isArbitraryValue];
  const scaleGridAutoColsRows = () => ["auto", "min", "max", "fr", isArbitraryVariable, isArbitraryValue];
  const scaleAlignPrimaryAxis = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"];
  const scaleAlignSecondaryAxis = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
  const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
  const scaleSizing = () => [isFraction, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...scaleUnambiguousSpacing()];
  const scaleColor = () => [themeColor, isArbitraryVariable, isArbitraryValue];
  const scaleBgPosition = () => [...scalePosition(), isArbitraryVariablePosition, isArbitraryPosition, {
    position: [isArbitraryVariable, isArbitraryValue]
  }];
  const scaleBgRepeat = () => ["no-repeat", {
    repeat: ["", "x", "y", "space", "round"]
  }];
  const scaleBgSize = () => ["auto", "cover", "contain", isArbitraryVariableSize, isArbitrarySize, {
    size: [isArbitraryVariable, isArbitraryValue]
  }];
  const scaleGradientStopPosition = () => [isPercent, isArbitraryVariableLength, isArbitraryLength];
  const scaleRadius = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    "full",
    themeRadius,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleBorderWidth = () => ["", isNumber, isArbitraryVariableLength, isArbitraryLength];
  const scaleLineStyle = () => ["solid", "dashed", "dotted", "double"];
  const scaleBlendMode = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  const scaleMaskImagePosition = () => [isNumber, isPercent, isArbitraryVariablePosition, isArbitraryPosition];
  const scaleBlur = () => [
    // Deprecated since Tailwind CSS v4.0.0
    "",
    "none",
    themeBlur,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleRotate = () => ["none", isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleScale = () => ["none", isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleSkew = () => [isNumber, isArbitraryVariable, isArbitraryValue];
  const scaleTranslate = () => [isFraction, "full", ...scaleUnambiguousSpacing()];
  return {
    cacheSize: 500,
    theme: {
      animate: ["spin", "ping", "pulse", "bounce"],
      aspect: ["video"],
      blur: [isTshirtSize],
      breakpoint: [isTshirtSize],
      color: [isAny],
      container: [isTshirtSize],
      "drop-shadow": [isTshirtSize],
      ease: ["in", "out", "in-out"],
      font: [isAnyNonArbitrary],
      "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
      "inset-shadow": [isTshirtSize],
      leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
      perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
      radius: [isTshirtSize],
      shadow: [isTshirtSize],
      spacing: ["px", isNumber],
      text: [isTshirtSize],
      "text-shadow": [isTshirtSize],
      tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
    },
    classGroups: {
      // --------------
      // --- Layout ---
      // --------------
      /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */
      aspect: [{
        aspect: ["auto", "square", isFraction, isArbitraryValue, isArbitraryVariable, themeAspect]
      }],
      /**
       * Container
       * @see https://tailwindcss.com/docs/container
       * @deprecated since Tailwind CSS v4.0.0
       */
      container: ["container"],
      /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */
      columns: [{
        columns: [isNumber, isArbitraryValue, isArbitraryVariable, themeContainer]
      }],
      /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */
      "break-after": [{
        "break-after": scaleBreak()
      }],
      /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */
      "break-before": [{
        "break-before": scaleBreak()
      }],
      /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */
      box: [{
        box: ["border", "content"]
      }],
      /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      /**
       * Screen Reader Only
       * @see https://tailwindcss.com/docs/display#screen-reader-only
       */
      sr: ["sr-only", "not-sr-only"],
      /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */
      isolation: ["isolate", "isolation-auto"],
      /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */
      "object-position": [{
        object: scalePositionWithArbitrary()
      }],
      /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */
      overflow: [{
        overflow: scaleOverflow()
      }],
      /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-x": [{
        "overflow-x": scaleOverflow()
      }],
      /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */
      "overflow-y": [{
        "overflow-y": scaleOverflow()
      }],
      /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      overscroll: [{
        overscroll: scaleOverscroll()
      }],
      /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-x": [{
        "overscroll-x": scaleOverscroll()
      }],
      /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */
      "overscroll-y": [{
        "overscroll-y": scaleOverscroll()
      }],
      /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      inset: [{
        inset: scaleInset()
      }],
      /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-x": [{
        "inset-x": scaleInset()
      }],
      /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      "inset-y": [{
        "inset-y": scaleInset()
      }],
      /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      start: [{
        start: scaleInset()
      }],
      /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      end: [{
        end: scaleInset()
      }],
      /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      top: [{
        top: scaleInset()
      }],
      /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      right: [{
        right: scaleInset()
      }],
      /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      bottom: [{
        bottom: scaleInset()
      }],
      /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */
      left: [{
        left: scaleInset()
      }],
      /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */
      visibility: ["visible", "invisible", "collapse"],
      /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */
      z: [{
        z: [isInteger, "auto", isArbitraryVariable, isArbitraryValue]
      }],
      // ------------------------
      // --- Flexbox and Grid ---
      // ------------------------
      /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */
      basis: [{
        basis: [isFraction, "full", "auto", themeContainer, ...scaleUnambiguousSpacing()]
      }],
      /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */
      "flex-wrap": [{
        flex: ["nowrap", "wrap", "wrap-reverse"]
      }],
      /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */
      flex: [{
        flex: [isNumber, isFraction, "auto", "initial", "none", isArbitraryValue]
      }],
      /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */
      grow: [{
        grow: ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */
      shrink: [{
        shrink: ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */
      order: [{
        order: [isInteger, "first", "last", "none", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */
      "grid-cols": [{
        "grid-cols": scaleGridTemplateColsRows()
      }],
      /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start-end": [{
        col: scaleGridColRowStartAndEnd()
      }],
      /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-start": [{
        "col-start": scaleGridColRowStartOrEnd()
      }],
      /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */
      "col-end": [{
        "col-end": scaleGridColRowStartOrEnd()
      }],
      /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */
      "grid-rows": [{
        "grid-rows": scaleGridTemplateColsRows()
      }],
      /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start-end": [{
        row: scaleGridColRowStartAndEnd()
      }],
      /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-start": [{
        "row-start": scaleGridColRowStartOrEnd()
      }],
      /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */
      "row-end": [{
        "row-end": scaleGridColRowStartOrEnd()
      }],
      /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */
      "auto-cols": [{
        "auto-cols": scaleGridAutoColsRows()
      }],
      /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */
      "auto-rows": [{
        "auto-rows": scaleGridAutoColsRows()
      }],
      /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */
      gap: [{
        gap: scaleUnambiguousSpacing()
      }],
      /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-x": [{
        "gap-x": scaleUnambiguousSpacing()
      }],
      /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */
      "gap-y": [{
        "gap-y": scaleUnambiguousSpacing()
      }],
      /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */
      "justify-content": [{
        justify: [...scaleAlignPrimaryAxis(), "normal"]
      }],
      /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */
      "justify-items": [{
        "justify-items": [...scaleAlignSecondaryAxis(), "normal"]
      }],
      /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */
      "justify-self": [{
        "justify-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */
      "align-content": [{
        content: ["normal", ...scaleAlignPrimaryAxis()]
      }],
      /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */
      "align-items": [{
        items: [...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */
      "align-self": [{
        self: ["auto", ...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */
      "place-content": [{
        "place-content": scaleAlignPrimaryAxis()
      }],
      /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */
      "place-items": [{
        "place-items": [...scaleAlignSecondaryAxis(), "baseline"]
      }],
      /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */
      "place-self": [{
        "place-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      // Spacing
      /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */
      p: [{
        p: scaleUnambiguousSpacing()
      }],
      /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */
      px: [{
        px: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */
      py: [{
        py: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */
      ps: [{
        ps: scaleUnambiguousSpacing()
      }],
      /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */
      pe: [{
        pe: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */
      pt: [{
        pt: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */
      pr: [{
        pr: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */
      pb: [{
        pb: scaleUnambiguousSpacing()
      }],
      /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */
      pl: [{
        pl: scaleUnambiguousSpacing()
      }],
      /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */
      m: [{
        m: scaleMargin()
      }],
      /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */
      mx: [{
        mx: scaleMargin()
      }],
      /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */
      my: [{
        my: scaleMargin()
      }],
      /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */
      ms: [{
        ms: scaleMargin()
      }],
      /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */
      me: [{
        me: scaleMargin()
      }],
      /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */
      mt: [{
        mt: scaleMargin()
      }],
      /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */
      mr: [{
        mr: scaleMargin()
      }],
      /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */
      mb: [{
        mb: scaleMargin()
      }],
      /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */
      ml: [{
        ml: scaleMargin()
      }],
      /**
       * Space Between X
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x": [{
        "space-x": scaleUnambiguousSpacing()
      }],
      /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-x-reverse": ["space-x-reverse"],
      /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y": [{
        "space-y": scaleUnambiguousSpacing()
      }],
      /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/margin#adding-space-between-children
       */
      "space-y-reverse": ["space-y-reverse"],
      // --------------
      // --- Sizing ---
      // --------------
      /**
       * Size
       * @see https://tailwindcss.com/docs/width#setting-both-width-and-height
       */
      size: [{
        size: scaleSizing()
      }],
      /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */
      w: [{
        w: [themeContainer, "screen", ...scaleSizing()]
      }],
      /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */
      "min-w": [{
        "min-w": [
          themeContainer,
          "screen",
          /** Deprecated. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          "none",
          ...scaleSizing()
        ]
      }],
      /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */
      "max-w": [{
        "max-w": [
          themeContainer,
          "screen",
          "none",
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          "prose",
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          {
            screen: [themeBreakpoint]
          },
          ...scaleSizing()
        ]
      }],
      /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */
      h: [{
        h: ["screen", "lh", ...scaleSizing()]
      }],
      /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */
      "min-h": [{
        "min-h": ["screen", "lh", "none", ...scaleSizing()]
      }],
      /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */
      "max-h": [{
        "max-h": ["screen", "lh", ...scaleSizing()]
      }],
      // ------------------
      // --- Typography ---
      // ------------------
      /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */
      "font-size": [{
        text: ["base", themeText, isArbitraryVariableLength, isArbitraryLength]
      }],
      /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */
      "font-style": ["italic", "not-italic"],
      /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */
      "font-weight": [{
        font: [themeFontWeight, isArbitraryVariable, isArbitraryNumber]
      }],
      /**
       * Font Stretch
       * @see https://tailwindcss.com/docs/font-stretch
       */
      "font-stretch": [{
        "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", isPercent, isArbitraryValue]
      }],
      /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */
      "font-family": [{
        font: [isArbitraryVariableFamilyName, isArbitraryValue, themeFont]
      }],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-normal": ["normal-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-ordinal": ["ordinal"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-slashed-zero": ["slashed-zero"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */
      tracking: [{
        tracking: [themeTracking, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */
      "line-clamp": [{
        "line-clamp": [isNumber, "none", isArbitraryVariable, isArbitraryNumber]
      }],
      /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */
      leading: [{
        leading: [
          /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          themeLeading,
          ...scaleUnambiguousSpacing()
        ]
      }],
      /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */
      "list-image": [{
        "list-image": ["none", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */
      "list-style-type": [{
        list: ["disc", "decimal", "none", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://v3.tailwindcss.com/docs/placeholder-color
       */
      "placeholder-color": [{
        placeholder: scaleColor()
      }],
      /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */
      "text-color": [{
        text: scaleColor()
      }],
      /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */
      "text-decoration-style": [{
        decoration: [...scaleLineStyle(), "wavy"]
      }],
      /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */
      "text-decoration-thickness": [{
        decoration: [isNumber, "from-font", "auto", isArbitraryVariable, isArbitraryLength]
      }],
      /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */
      "text-decoration-color": [{
        decoration: scaleColor()
      }],
      /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */
      "underline-offset": [{
        "underline-offset": [isNumber, "auto", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      /**
       * Text Wrap
       * @see https://tailwindcss.com/docs/text-wrap
       */
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */
      indent: [{
        indent: scaleUnambiguousSpacing()
      }],
      /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      /**
       * Overflow Wrap
       * @see https://tailwindcss.com/docs/overflow-wrap
       */
      wrap: [{
        wrap: ["break-word", "anywhere", "normal"]
      }],
      /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */
      content: [{
        content: ["none", isArbitraryVariable, isArbitraryValue]
      }],
      // -------------------
      // --- Backgrounds ---
      // -------------------
      /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */
      "bg-position": [{
        bg: scaleBgPosition()
      }],
      /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */
      "bg-repeat": [{
        bg: scaleBgRepeat()
      }],
      /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */
      "bg-size": [{
        bg: scaleBgSize()
      }],
      /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */
      "bg-image": [{
        bg: ["none", {
          linear: [{
            to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
          }, isInteger, isArbitraryVariable, isArbitraryValue],
          radial: ["", isArbitraryVariable, isArbitraryValue],
          conic: [isInteger, isArbitraryVariable, isArbitraryValue]
        }, isArbitraryVariableImage, isArbitraryImage]
      }],
      /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */
      "bg-color": [{
        bg: scaleColor()
      }],
      /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from-pos": [{
        from: scaleGradientStopPosition()
      }],
      /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via-pos": [{
        via: scaleGradientStopPosition()
      }],
      /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to-pos": [{
        to: scaleGradientStopPosition()
      }],
      /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-from": [{
        from: scaleColor()
      }],
      /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-via": [{
        via: scaleColor()
      }],
      /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */
      "gradient-to": [{
        to: scaleColor()
      }],
      // ---------------
      // --- Borders ---
      // ---------------
      /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */
      rounded: [{
        rounded: scaleRadius()
      }],
      /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-s": [{
        "rounded-s": scaleRadius()
      }],
      /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-e": [{
        "rounded-e": scaleRadius()
      }],
      /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-t": [{
        "rounded-t": scaleRadius()
      }],
      /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-r": [{
        "rounded-r": scaleRadius()
      }],
      /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-b": [{
        "rounded-b": scaleRadius()
      }],
      /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-l": [{
        "rounded-l": scaleRadius()
      }],
      /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ss": [{
        "rounded-ss": scaleRadius()
      }],
      /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-se": [{
        "rounded-se": scaleRadius()
      }],
      /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-ee": [{
        "rounded-ee": scaleRadius()
      }],
      /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-es": [{
        "rounded-es": scaleRadius()
      }],
      /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tl": [{
        "rounded-tl": scaleRadius()
      }],
      /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-tr": [{
        "rounded-tr": scaleRadius()
      }],
      /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-br": [{
        "rounded-br": scaleRadius()
      }],
      /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */
      "rounded-bl": [{
        "rounded-bl": scaleRadius()
      }],
      /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w": [{
        border: scaleBorderWidth()
      }],
      /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-x": [{
        "border-x": scaleBorderWidth()
      }],
      /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-y": [{
        "border-y": scaleBorderWidth()
      }],
      /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-s": [{
        "border-s": scaleBorderWidth()
      }],
      /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-e": [{
        "border-e": scaleBorderWidth()
      }],
      /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-t": [{
        "border-t": scaleBorderWidth()
      }],
      /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-r": [{
        "border-r": scaleBorderWidth()
      }],
      /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-b": [{
        "border-b": scaleBorderWidth()
      }],
      /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */
      "border-w-l": [{
        "border-l": scaleBorderWidth()
      }],
      /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x": [{
        "divide-x": scaleBorderWidth()
      }],
      /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-x-reverse": ["divide-x-reverse"],
      /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y": [{
        "divide-y": scaleBorderWidth()
      }],
      /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/border-width#between-children
       */
      "divide-y-reverse": ["divide-y-reverse"],
      /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */
      "border-style": [{
        border: [...scaleLineStyle(), "hidden", "none"]
      }],
      /**
       * Divide Style
       * @see https://tailwindcss.com/docs/border-style#setting-the-divider-style
       */
      "divide-style": [{
        divide: [...scaleLineStyle(), "hidden", "none"]
      }],
      /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color": [{
        border: scaleColor()
      }],
      /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-x": [{
        "border-x": scaleColor()
      }],
      /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-y": [{
        "border-y": scaleColor()
      }],
      /**
       * Border Color S
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-s": [{
        "border-s": scaleColor()
      }],
      /**
       * Border Color E
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-e": [{
        "border-e": scaleColor()
      }],
      /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-t": [{
        "border-t": scaleColor()
      }],
      /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-r": [{
        "border-r": scaleColor()
      }],
      /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-b": [{
        "border-b": scaleColor()
      }],
      /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */
      "border-color-l": [{
        "border-l": scaleColor()
      }],
      /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */
      "divide-color": [{
        divide: scaleColor()
      }],
      /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */
      "outline-style": [{
        outline: [...scaleLineStyle(), "none", "hidden"]
      }],
      /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */
      "outline-offset": [{
        "outline-offset": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */
      "outline-w": [{
        outline: ["", isNumber, isArbitraryVariableLength, isArbitraryLength]
      }],
      /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */
      "outline-color": [{
        outline: scaleColor()
      }],
      // ---------------
      // --- Effects ---
      // ---------------
      /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */
      shadow: [{
        shadow: [
          // Deprecated since Tailwind CSS v4.0.0
          "",
          "none",
          themeShadow,
          isArbitraryVariableShadow,
          isArbitraryShadow
        ]
      }],
      /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-shadow-color
       */
      "shadow-color": [{
        shadow: scaleColor()
      }],
      /**
       * Inset Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-shadow
       */
      "inset-shadow": [{
        "inset-shadow": ["none", themeInsetShadow, isArbitraryVariableShadow, isArbitraryShadow]
      }],
      /**
       * Inset Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-shadow-color
       */
      "inset-shadow-color": [{
        "inset-shadow": scaleColor()
      }],
      /**
       * Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-a-ring
       */
      "ring-w": [{
        ring: scaleBorderWidth()
      }],
      /**
       * Ring Width Inset
       * @see https://v3.tailwindcss.com/docs/ring-width#inset-rings
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-w-inset": ["ring-inset"],
      /**
       * Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-ring-color
       */
      "ring-color": [{
        ring: scaleColor()
      }],
      /**
       * Ring Offset Width
       * @see https://v3.tailwindcss.com/docs/ring-offset-width
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-w": [{
        "ring-offset": [isNumber, isArbitraryLength]
      }],
      /**
       * Ring Offset Color
       * @see https://v3.tailwindcss.com/docs/ring-offset-color
       * @deprecated since Tailwind CSS v4.0.0
       * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
       */
      "ring-offset-color": [{
        "ring-offset": scaleColor()
      }],
      /**
       * Inset Ring Width
       * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-ring
       */
      "inset-ring-w": [{
        "inset-ring": scaleBorderWidth()
      }],
      /**
       * Inset Ring Color
       * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-ring-color
       */
      "inset-ring-color": [{
        "inset-ring": scaleColor()
      }],
      /**
       * Text Shadow
       * @see https://tailwindcss.com/docs/text-shadow
       */
      "text-shadow": [{
        "text-shadow": ["none", themeTextShadow, isArbitraryVariableShadow, isArbitraryShadow]
      }],
      /**
       * Text Shadow Color
       * @see https://tailwindcss.com/docs/text-shadow#setting-the-shadow-color
       */
      "text-shadow-color": [{
        "text-shadow": scaleColor()
      }],
      /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */
      opacity: [{
        opacity: [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */
      "mix-blend": [{
        "mix-blend": [...scaleBlendMode(), "plus-darker", "plus-lighter"]
      }],
      /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */
      "bg-blend": [{
        "bg-blend": scaleBlendMode()
      }],
      /**
       * Mask Clip
       * @see https://tailwindcss.com/docs/mask-clip
       */
      "mask-clip": [{
        "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
      }, "mask-no-clip"],
      /**
       * Mask Composite
       * @see https://tailwindcss.com/docs/mask-composite
       */
      "mask-composite": [{
        mask: ["add", "subtract", "intersect", "exclude"]
      }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image-linear-pos": [{
        "mask-linear": [isNumber]
      }],
      "mask-image-linear-from-pos": [{
        "mask-linear-from": scaleMaskImagePosition()
      }],
      "mask-image-linear-to-pos": [{
        "mask-linear-to": scaleMaskImagePosition()
      }],
      "mask-image-linear-from-color": [{
        "mask-linear-from": scaleColor()
      }],
      "mask-image-linear-to-color": [{
        "mask-linear-to": scaleColor()
      }],
      "mask-image-t-from-pos": [{
        "mask-t-from": scaleMaskImagePosition()
      }],
      "mask-image-t-to-pos": [{
        "mask-t-to": scaleMaskImagePosition()
      }],
      "mask-image-t-from-color": [{
        "mask-t-from": scaleColor()
      }],
      "mask-image-t-to-color": [{
        "mask-t-to": scaleColor()
      }],
      "mask-image-r-from-pos": [{
        "mask-r-from": scaleMaskImagePosition()
      }],
      "mask-image-r-to-pos": [{
        "mask-r-to": scaleMaskImagePosition()
      }],
      "mask-image-r-from-color": [{
        "mask-r-from": scaleColor()
      }],
      "mask-image-r-to-color": [{
        "mask-r-to": scaleColor()
      }],
      "mask-image-b-from-pos": [{
        "mask-b-from": scaleMaskImagePosition()
      }],
      "mask-image-b-to-pos": [{
        "mask-b-to": scaleMaskImagePosition()
      }],
      "mask-image-b-from-color": [{
        "mask-b-from": scaleColor()
      }],
      "mask-image-b-to-color": [{
        "mask-b-to": scaleColor()
      }],
      "mask-image-l-from-pos": [{
        "mask-l-from": scaleMaskImagePosition()
      }],
      "mask-image-l-to-pos": [{
        "mask-l-to": scaleMaskImagePosition()
      }],
      "mask-image-l-from-color": [{
        "mask-l-from": scaleColor()
      }],
      "mask-image-l-to-color": [{
        "mask-l-to": scaleColor()
      }],
      "mask-image-x-from-pos": [{
        "mask-x-from": scaleMaskImagePosition()
      }],
      "mask-image-x-to-pos": [{
        "mask-x-to": scaleMaskImagePosition()
      }],
      "mask-image-x-from-color": [{
        "mask-x-from": scaleColor()
      }],
      "mask-image-x-to-color": [{
        "mask-x-to": scaleColor()
      }],
      "mask-image-y-from-pos": [{
        "mask-y-from": scaleMaskImagePosition()
      }],
      "mask-image-y-to-pos": [{
        "mask-y-to": scaleMaskImagePosition()
      }],
      "mask-image-y-from-color": [{
        "mask-y-from": scaleColor()
      }],
      "mask-image-y-to-color": [{
        "mask-y-to": scaleColor()
      }],
      "mask-image-radial": [{
        "mask-radial": [isArbitraryVariable, isArbitraryValue]
      }],
      "mask-image-radial-from-pos": [{
        "mask-radial-from": scaleMaskImagePosition()
      }],
      "mask-image-radial-to-pos": [{
        "mask-radial-to": scaleMaskImagePosition()
      }],
      "mask-image-radial-from-color": [{
        "mask-radial-from": scaleColor()
      }],
      "mask-image-radial-to-color": [{
        "mask-radial-to": scaleColor()
      }],
      "mask-image-radial-shape": [{
        "mask-radial": ["circle", "ellipse"]
      }],
      "mask-image-radial-size": [{
        "mask-radial": [{
          closest: ["side", "corner"],
          farthest: ["side", "corner"]
        }]
      }],
      "mask-image-radial-pos": [{
        "mask-radial-at": scalePosition()
      }],
      "mask-image-conic-pos": [{
        "mask-conic": [isNumber]
      }],
      "mask-image-conic-from-pos": [{
        "mask-conic-from": scaleMaskImagePosition()
      }],
      "mask-image-conic-to-pos": [{
        "mask-conic-to": scaleMaskImagePosition()
      }],
      "mask-image-conic-from-color": [{
        "mask-conic-from": scaleColor()
      }],
      "mask-image-conic-to-color": [{
        "mask-conic-to": scaleColor()
      }],
      /**
       * Mask Mode
       * @see https://tailwindcss.com/docs/mask-mode
       */
      "mask-mode": [{
        mask: ["alpha", "luminance", "match"]
      }],
      /**
       * Mask Origin
       * @see https://tailwindcss.com/docs/mask-origin
       */
      "mask-origin": [{
        "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
      }],
      /**
       * Mask Position
       * @see https://tailwindcss.com/docs/mask-position
       */
      "mask-position": [{
        mask: scaleBgPosition()
      }],
      /**
       * Mask Repeat
       * @see https://tailwindcss.com/docs/mask-repeat
       */
      "mask-repeat": [{
        mask: scaleBgRepeat()
      }],
      /**
       * Mask Size
       * @see https://tailwindcss.com/docs/mask-size
       */
      "mask-size": [{
        mask: scaleBgSize()
      }],
      /**
       * Mask Type
       * @see https://tailwindcss.com/docs/mask-type
       */
      "mask-type": [{
        "mask-type": ["alpha", "luminance"]
      }],
      /**
       * Mask Image
       * @see https://tailwindcss.com/docs/mask-image
       */
      "mask-image": [{
        mask: ["none", isArbitraryVariable, isArbitraryValue]
      }],
      // ---------------
      // --- Filters ---
      // ---------------
      /**
       * Filter
       * @see https://tailwindcss.com/docs/filter
       */
      filter: [{
        filter: [
          // Deprecated since Tailwind CSS v3.0.0
          "",
          "none",
          isArbitraryVariable,
          isArbitraryValue
        ]
      }],
      /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */
      blur: [{
        blur: scaleBlur()
      }],
      /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */
      brightness: [{
        brightness: [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */
      contrast: [{
        contrast: [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */
      "drop-shadow": [{
        "drop-shadow": [
          // Deprecated since Tailwind CSS v4.0.0
          "",
          "none",
          themeDropShadow,
          isArbitraryVariableShadow,
          isArbitraryShadow
        ]
      }],
      /**
       * Drop Shadow Color
       * @see https://tailwindcss.com/docs/filter-drop-shadow#setting-the-shadow-color
       */
      "drop-shadow-color": [{
        "drop-shadow": scaleColor()
      }],
      /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */
      grayscale: [{
        grayscale: ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */
      "hue-rotate": [{
        "hue-rotate": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */
      invert: [{
        invert: ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */
      saturate: [{
        saturate: [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */
      sepia: [{
        sepia: ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Filter
       * @see https://tailwindcss.com/docs/backdrop-filter
       */
      "backdrop-filter": [{
        "backdrop-filter": [
          // Deprecated since Tailwind CSS v3.0.0
          "",
          "none",
          isArbitraryVariable,
          isArbitraryValue
        ]
      }],
      /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */
      "backdrop-blur": [{
        "backdrop-blur": scaleBlur()
      }],
      /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */
      "backdrop-brightness": [{
        "backdrop-brightness": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */
      "backdrop-contrast": [{
        "backdrop-contrast": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */
      "backdrop-grayscale": [{
        "backdrop-grayscale": ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */
      "backdrop-invert": [{
        "backdrop-invert": ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */
      "backdrop-opacity": [{
        "backdrop-opacity": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */
      "backdrop-saturate": [{
        "backdrop-saturate": [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */
      "backdrop-sepia": [{
        "backdrop-sepia": ["", isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      // --------------
      // --- Tables ---
      // --------------
      /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing": [{
        "border-spacing": scaleUnambiguousSpacing()
      }],
      /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-x": [{
        "border-spacing-x": scaleUnambiguousSpacing()
      }],
      /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */
      "border-spacing-y": [{
        "border-spacing-y": scaleUnambiguousSpacing()
      }],
      /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */
      caption: [{
        caption: ["top", "bottom"]
      }],
      // ---------------------------------
      // --- Transitions and Animation ---
      // ---------------------------------
      /**
       * Transition Property
       * @see https://tailwindcss.com/docs/transition-property
       */
      transition: [{
        transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Transition Behavior
       * @see https://tailwindcss.com/docs/transition-behavior
       */
      "transition-behavior": [{
        transition: ["normal", "discrete"]
      }],
      /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */
      duration: [{
        duration: [isNumber, "initial", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */
      ease: [{
        ease: ["linear", "initial", themeEase, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */
      delay: [{
        delay: [isNumber, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */
      animate: [{
        animate: ["none", themeAnimate, isArbitraryVariable, isArbitraryValue]
      }],
      // ------------------
      // --- Transforms ---
      // ------------------
      /**
       * Backface Visibility
       * @see https://tailwindcss.com/docs/backface-visibility
       */
      backface: [{
        backface: ["hidden", "visible"]
      }],
      /**
       * Perspective
       * @see https://tailwindcss.com/docs/perspective
       */
      perspective: [{
        perspective: [themePerspective, isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Perspective Origin
       * @see https://tailwindcss.com/docs/perspective-origin
       */
      "perspective-origin": [{
        "perspective-origin": scalePositionWithArbitrary()
      }],
      /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */
      rotate: [{
        rotate: scaleRotate()
      }],
      /**
       * Rotate X
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-x": [{
        "rotate-x": scaleRotate()
      }],
      /**
       * Rotate Y
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-y": [{
        "rotate-y": scaleRotate()
      }],
      /**
       * Rotate Z
       * @see https://tailwindcss.com/docs/rotate
       */
      "rotate-z": [{
        "rotate-z": scaleRotate()
      }],
      /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */
      scale: [{
        scale: scaleScale()
      }],
      /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-x": [{
        "scale-x": scaleScale()
      }],
      /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-y": [{
        "scale-y": scaleScale()
      }],
      /**
       * Scale Z
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-z": [{
        "scale-z": scaleScale()
      }],
      /**
       * Scale 3D
       * @see https://tailwindcss.com/docs/scale
       */
      "scale-3d": ["scale-3d"],
      /**
       * Skew
       * @see https://tailwindcss.com/docs/skew
       */
      skew: [{
        skew: scaleSkew()
      }],
      /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-x": [{
        "skew-x": scaleSkew()
      }],
      /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */
      "skew-y": [{
        "skew-y": scaleSkew()
      }],
      /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */
      transform: [{
        transform: [isArbitraryVariable, isArbitraryValue, "", "none", "gpu", "cpu"]
      }],
      /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */
      "transform-origin": [{
        origin: scalePositionWithArbitrary()
      }],
      /**
       * Transform Style
       * @see https://tailwindcss.com/docs/transform-style
       */
      "transform-style": [{
        transform: ["3d", "flat"]
      }],
      /**
       * Translate
       * @see https://tailwindcss.com/docs/translate
       */
      translate: [{
        translate: scaleTranslate()
      }],
      /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-x": [{
        "translate-x": scaleTranslate()
      }],
      /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-y": [{
        "translate-y": scaleTranslate()
      }],
      /**
       * Translate Z
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-z": [{
        "translate-z": scaleTranslate()
      }],
      /**
       * Translate None
       * @see https://tailwindcss.com/docs/translate
       */
      "translate-none": ["translate-none"],
      // ---------------------
      // --- Interactivity ---
      // ---------------------
      /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */
      accent: [{
        accent: scaleColor()
      }],
      /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */
      appearance: [{
        appearance: ["none", "auto"]
      }],
      /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */
      "caret-color": [{
        caret: scaleColor()
      }],
      /**
       * Color Scheme
       * @see https://tailwindcss.com/docs/color-scheme
       */
      "color-scheme": [{
        scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
      }],
      /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", isArbitraryVariable, isArbitraryValue]
      }],
      /**
       * Field Sizing
       * @see https://tailwindcss.com/docs/field-sizing
       */
      "field-sizing": [{
        "field-sizing": ["fixed", "content"]
      }],
      /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */
      "pointer-events": [{
        "pointer-events": ["auto", "none"]
      }],
      /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */
      resize: [{
        resize: ["none", "", "y", "x"]
      }],
      /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-m": [{
        "scroll-m": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mx": [{
        "scroll-mx": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-my": [{
        "scroll-my": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ms": [{
        "scroll-ms": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-me": [{
        "scroll-me": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mt": [{
        "scroll-mt": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mr": [{
        "scroll-mr": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-mb": [{
        "scroll-mb": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */
      "scroll-ml": [{
        "scroll-ml": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-p": [{
        "scroll-p": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-px": [{
        "scroll-px": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-py": [{
        "scroll-py": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-ps": [{
        "scroll-ps": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pe": [{
        "scroll-pe": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pt": [{
        "scroll-pt": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pr": [{
        "scroll-pr": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pb": [{
        "scroll-pb": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */
      "scroll-pl": [{
        "scroll-pl": scaleUnambiguousSpacing()
      }],
      /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */
      "touch-pz": ["touch-pinch-zoom"],
      /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", isArbitraryVariable, isArbitraryValue]
      }],
      // -----------
      // --- SVG ---
      // -----------
      /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */
      fill: [{
        fill: ["none", ...scaleColor()]
      }],
      /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */
      "stroke-w": [{
        stroke: [isNumber, isArbitraryVariableLength, isArbitraryLength, isArbitraryNumber]
      }],
      /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */
      stroke: [{
        stroke: ["none", ...scaleColor()]
      }],
      // ---------------------
      // --- Accessibility ---
      // ---------------------
      /**
       * Forced Color Adjust
       * @see https://tailwindcss.com/docs/forced-color-adjust
       */
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      translate: ["translate-x", "translate-y", "translate-none"],
      "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    },
    orderSensitiveModifiers: ["*", "**", "after", "backdrop", "before", "details-content", "file", "first-letter", "first-line", "marker", "placeholder", "selection"]
  };
};
const twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
  return hex.slice(0, 4).join("") + "-" + hex.slice(4, 6).join("") + "-" + hex.slice(6, 8).join("") + "-" + hex.slice(8, 10).join("") + "-" + hex.slice(10, 16).join("");
}
const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The implicit variant is the screen's main action, so it carries the
        // brand colour. Anything that should not compete for attention has to
        // opt out with outline/secondary/ghost.
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        "primary-gradient": "bg-brand-gradient text-white shadow hover:brightness-110",
        destructive: "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground",
        outline: "border border-input/40 bg-background hover:bg-muted/70 hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        text: "bg-transparent p-0 rounded-none opacity-100 hover:opacity-50 transition-opacity",
        link: "text-primary underline-offset-4 hover:underline"
      },
      // 28/32/36/40 — one 4px step apart, with the default matching the 36px
      // height of Input and SelectTrigger so mixed rows line up.
      size: {
        default: "h-9 px-3",
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
function isDebugLogEnabled(category) {
  if (typeof localStorage === "undefined") return false;
  const all = localStorage.getItem("DEBUG_LOGS") === "1";
  if (all) return true;
  return localStorage.getItem(`DEBUG_${category.toUpperCase()}_LOGS`) === "1";
}
function debugLog(category, ...args) {
  if (isDebugLogEnabled(category)) {
    console.log(...args);
  }
}
const isElectron = () => {
  return typeof window !== "undefined" && !!window.fileStorage;
};
const hasRichData = (jsonStr) => {
  if (!jsonStr) return false;
  if (jsonStr.length > 1e3) return true;
  try {
    const data = JSON.parse(jsonStr);
    const state = data.state || data;
    if (state.projects && Array.isArray(state.projects) && state.projects.length > 1) return true;
    if (state.splitScenes && Array.isArray(state.splitScenes) && state.splitScenes.length > 0) return true;
    if (state.scenes && Array.isArray(state.scenes) && state.scenes.length > 0) return true;
    if (state.episodes && Array.isArray(state.episodes) && state.episodes.length > 0) return true;
    if (state.characters && Array.isArray(state.characters) && state.characters.length > 0) return true;
    if (state.media && Array.isArray(state.media) && state.media.length > 0) return true;
    if (state.projects && typeof state.projects === "object") {
      for (const projectId of Object.keys(state.projects)) {
        const proj = state.projects[projectId];
        if (proj.splitScenes && proj.splitScenes.length > 0) return true;
        if (proj.screenplay) return true;
      }
    }
    return jsonStr.length > 1e3;
  } catch {
    return jsonStr.length > 1e3;
  }
};
const fileStorage = {
  getItem: async (name) => {
    debugLog("storage", `[Storage] getItem: ${name}, isElectron: ${isElectron()}`);
    if (isElectron()) {
      try {
        const fileData = await window.fileStorage.getItem(name);
        const localData = localStorage.getItem(name);
        const fileHasData = hasRichData(fileData);
        const localHasData = hasRichData(localData);
        debugLog("storage", `[Storage] ${name}: file=${fileData?.length || 0}, local=${localData?.length || 0}`);
        if (localHasData && !fileHasData) {
          debugLog("storage", `[Storage] Migrating ${name} from localStorage to file storage...`);
          await window.fileStorage.setItem(name, localData);
          localStorage.removeItem(name);
          return localData;
        }
        if (fileHasData) {
          if (localData) localStorage.removeItem(name);
          void purgeStaleIndexedDB(name);
          return fileData;
        }
        let idbData = null;
        try {
          idbData = await getFromIndexedDB(name);
        } catch {
        }
        if (hasRichData(idbData) && !localHasData) {
          debugLog("storage", `[Storage] Migrating ${name} from IndexedDB to file storage...`);
          await window.fileStorage.setItem(name, idbData);
          await removeFromIndexedDB(name);
          return idbData;
        }
        return fileData || localData || idbData || null;
      } catch (error) {
        console.error("File storage getItem error:", error);
      }
    }
    return localStorage.getItem(name);
  },
  setItem: async (name, value) => {
    debugLog("storage", `[Storage] setItem: ${name}, size: ${value.length} chars, isElectron: ${isElectron()}`);
    if (isElectron()) {
      try {
        const result = await window.fileStorage.setItem(name, value);
        debugLog("storage", `[Storage] File save result for ${name}:`, result);
        return;
      } catch (error) {
        console.error("[Storage] File storage setItem error:", error);
      }
    }
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error("localStorage setItem error:", error);
    }
  },
  removeItem: async (name) => {
    if (isElectron()) {
      try {
        await window.fileStorage.removeItem(name);
        return;
      } catch (error) {
        console.error("File storage removeItem error:", error);
      }
    }
    localStorage.removeItem(name);
  }
};
const purgedIndexedDBKeys = /* @__PURE__ */ new Set();
const purgeStaleIndexedDB = async (name) => {
  if (purgedIndexedDBKeys.has(name)) return;
  purgedIndexedDBKeys.add(name);
  try {
    if (await getFromIndexedDB(name)) {
      debugLog("storage", `[Storage] Cleaning up IndexedDB for ${name}`);
      await removeFromIndexedDB(name);
    }
  } catch {
  }
};
const getFromIndexedDB = (name) => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("longdd-creator-db", 1);
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("zustand-storage")) {
          resolve(null);
          return;
        }
        const transaction = db.transaction("zustand-storage", "readonly");
        const store = transaction.objectStore("zustand-storage");
        const getRequest = store.get(name);
        getRequest.onerror = () => resolve(null);
        getRequest.onsuccess = () => resolve(getRequest.result ?? null);
      };
    } catch {
      resolve(null);
    }
  });
};
const removeFromIndexedDB = (name) => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("longdd-creator-db", 1);
      request.onerror = () => resolve();
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("zustand-storage")) {
          resolve();
          return;
        }
        const transaction = db.transaction("zustand-storage", "readwrite");
        const store = transaction.objectStore("zustand-storage");
        store.delete(name);
        resolve();
      };
    } catch {
      resolve();
    }
  });
};
const migrateFromLocalStorage = async (_key) => {
};
const UI_PREFERENCES_KEY = "longdd-ui-preferences";
const LEGACY_APP_SETTINGS_KEY = "longdd-app-settings";
const useUIPreferencesStore = create()(
  persist(
    (set) => ({
      uiLanguage: "en",
      setUILanguage: (uiLanguage) => set({ uiLanguage })
    }),
    {
      name: UI_PREFERENCES_KEY,
      storage: createJSONStorage(() => fileStorage),
      partialize: (state) => ({ uiLanguage: state.uiLanguage })
    }
  )
);
async function migrateUIPreferencesFromLegacy() {
  await useUIPreferencesStore.persist.rehydrate();
  const current = await fileStorage.getItem(UI_PREFERENCES_KEY);
  if (current) return;
  const legacy = await fileStorage.getItem(LEGACY_APP_SETTINGS_KEY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy);
    const language = parsed?.state?.uiLanguage ?? parsed?.uiLanguage;
    if (language === "en" || language === "vi") {
      useUIPreferencesStore.getState().setUILanguage(language);
    }
  } catch (error) {
    console.warn("[UIPreferences] Could not migrate legacy language:", error);
  }
}
function mergeCatalogSections(...sections) {
  const catalog = {};
  for (const section of sections) {
    for (const [key, value] of Object.entries(section)) {
      if (Object.prototype.hasOwnProperty.call(catalog, key)) {
        throw new Error(`Duplicate i18n key: ${key}`);
      }
      catalog[key] = value;
    }
  }
  return catalog;
}
const core$1 = {
  "appHome.title": "What would you like to create?",
  "appHome.subtitle": "Choose a workspace below. Each feature keeps its own projects, tools, and workflow while sharing your language, theme, license, and help settings.",
  "appHome.videoStudio.title": "Video AI Studio",
  "appHome.videoStudio.description": "Turn scripts and prompts into characters, scenes, shots, images, videos, and exportable production assets.",
  "appHome.openingVideoStudio": "Opening Video AI Studio...",
  "nav.overview": "Overview",
  "nav.script": "Script",
  "nav.promptImport": "Prompt Import",
  "nav.characters": "Characters",
  "nav.scenes": "Scenes",
  "nav.director": "Director",
  "nav.media": "Media",
  "nav.export": "Export",
  "nav.autoVideo": "Auto Video",
  "nav.autopilot": "AutoPilot",
  "nav.settings": "Settings",
  "stage.script": "Script",
  "stage.assets": "Characters & Scenes",
  "stage.director": "Director Workspace",
  "stage.export": "Output & Export",
  "tabBar.help": "Help",
  "tabBar.usageGuide": "Usage Guide",
  "tabBar.settings": "Settings",
  "tabBar.systemSettings": "System Settings",
  "tabBar.cliSettings": "CLI setup",
  "cliSettings.title": "CLI setup",
  "cliSettings.description": "Check the CLI tools used by Chat and Buzz. Each CLI must be installed and authenticated on this device.",
  "cliSettings.installed": "Installed",
  "cliSettings.notInstalled": "Not installed",
  "cliSettings.notDetected": "CLI not detected",
  "cliSettings.ready": "Installed and authenticated — ready to use.",
  "cliSettings.testFailed": "The CLI is not authenticated or cannot be used yet.",
  "cliSettings.testLogin": "Test authentication",
  "cliSettings.install": "Install automatically",
  "cliSettings.installing": "Installing...",
  "cliSettings.installFailed": "Could not install the CLI.",
  "cliSettings.installStarted": "Starting {cli} installation...",
  "cliSettings.installSuccess": "{cli} was installed. You can now test authentication.",
  "cliSettings.restartRequired": "Electron is still using the old runtime. Fully quit and reopen the app, then click Install again.",
  "cliSettings.openGuide": "Open guide",
  "cliSettings.installGuide": "Installation guide",
  "cliSettings.refreshHint": "After installing or signing in through a terminal, refresh the status.",
  "tabBar.theme.light": "Light",
  "tabBar.theme.dark": "Dark",
  "tabBar.theme.toLight": "Switch to light mode",
  "tabBar.theme.toDark": "Switch to dark mode",
  "tabBar.backToProjects": "Back to projects",
  "tabBar.switchToEnglish": "Switch to English",
  "tabBar.switchToVietnamese": "Switch to Vietnamese",
  "project.untitled": "Untitled Project",
  "project.backToSeries": "Back to series view",
  "project.episode": "Episode {index}",
  "save.saved": "Saved",
  "save.saving": "Saving...",
  "save.unsaved": "Unsaved",
  "rightPanel.properties": "Properties",
  "rightPanel.comingSoon": "Coming soon",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.edit": "Edit",
  "common.moveTo": "Move to",
  "common.root": "Root",
  "time.justNow": "Just now",
  "time.minutesAgo": "{count} min ago",
  "time.hoursAgo": "{count} hr ago",
  "time.daysAgo": "{count} day ago",
  "common.loadingImageFailed": "Failed to load image",
  "brand.mark": "L",
  "common.apiExample": "https://api.example.com/v1",
  "common.apiHostExample": "https://api.example.com",
  "common.queryKey": "key",
  "common.authorization": "Authorization",
  "common.expiration": "expiration",
  "common.imageFieldName": "image",
  "common.nameFieldValue": "name",
  "common.responseUrlPath": "data.url",
  "common.responseDeleteUrlPath": "data.delete_url",
  "common.video": "Video",
  "common.audio": "Audio",
  "common.clickToPreview": "Click an image or video to preview it",
  "common.enabled": "Enabled",
  "common.advancedOptional": "Advanced Settings (optional)",
  "common.platform": "Platform",
  "common.name": "Name",
  "common.baseUrl": "Base URL",
  "common.uploadPathOrUrl": "Upload Path / URL",
  "common.selectPlatform": "Select platform",
  "common.imageHostName": "Image host name",
  "common.uploadOrFullUrl": "/upload or full URL",
  "common.apiKeyQueryParam": "API Key Query Param",
  "common.expirationParam": "Expiration Param",
  "common.imageField": "Image Field",
  "common.nameField": "Name Field",
  "common.responseUrlField": "Response URL Field",
  "common.deleteUrlField": "Delete URL Field",
  "common.close": "Close",
  "stage.phase01": "Phase 01",
  "stage.phase02": "Phase 02",
  "stage.phase03": "Phase 03",
  "stage.phase04": "Phase 04",
  "stage.phase05": "Phase 05",
  "taskInfo.title": "Task information",
  "taskInfo.image": "Image information",
  "taskInfo.video": "Video information",
  "taskInfo.scriptLatest": "Latest script task information",
  "taskInfo.status": "Status",
  "taskInfo.kind": "Type",
  "taskInfo.time": "Timing",
  "taskInfo.queuedAt": "Queued",
  "taskInfo.submittedAt": "Request sent",
  "taskInfo.completedAt": "Completed",
  "taskInfo.waitDuration": "Queue time",
  "taskInfo.processingDuration": "Processing time",
  "taskInfo.actualPrompt": "Actual content sent",
  "taskInfo.copy": "Copy",
  "taskInfo.copied": "Copied",
  "taskInfo.technical": "Technical details",
  "taskInfo.status.queued": "Waiting",
  "taskInfo.status.submitting": "Sending",
  "taskInfo.status.running": "Processing",
  "taskInfo.status.completed": "Completed",
  "taskInfo.status.failed": "Failed",
  "taskInfo.status.cancelled": "Cancelled",
  "taskInfo.noData": "No task information is available for this item.",
  "taskInfo.noDataHelp": "Items created before this update do not contain generation history. Create it again to record full details."
};
const projects$1 = {
  "dashboard.selection.exit": "Exit Selection",
  "dashboard.selection.manage": "Manage",
  "dashboard.newProject": "New Project",
  "dashboard.myProjects": "My Projects",
  "dashboard.projectCount": "{count} projects",
  "dashboard.selectedCount": "Selected {count}",
  "dashboard.selectAll": "Select All",
  "dashboard.clearSelection": "Clear Selection",
  "dashboard.deleteSelected": "Delete Selected ({count})",
  "dashboard.projectNamePlaceholder": "Enter project name...",
  "dashboard.create": "Create",
  "dashboard.rename": "Rename",
  "dashboard.duplicate": "Duplicate Project",
  "dashboard.delete": "Delete",
  "dashboard.openProject": "Open Project",
  "dashboard.emptyTitle": "No projects yet",
  "dashboard.emptyDescription": "Create your first AI video project",
  "dashboard.renameProject": "Rename Project",
  "dashboard.newNamePlaceholder": "Enter a new name...",
  "dashboard.confirmBatchDelete": "Confirm Batch Delete",
  "dashboard.batchDeleteMessage": "You are about to delete {count} projects. This action cannot be undone. Continue?",
  "dashboard.toast.deletedProjects": "Deleted {count} projects",
  "dashboard.toast.renamed": "Project renamed",
  "dashboard.toast.storageUnavailable": "File storage is unavailable. Only the project name was copied.",
  "dashboard.duplicateSuffix": "Copy",
  "dashboard.toast.duplicated": 'Copied "{name}" ({count} data files)',
  "dashboard.toast.duplicateNameOnly": "Project data files were empty. Only the project name was copied.",
  "dashboard.toast.duplicateFailed": "Failed to copy project data: {message}",
  "dashboard.toast.deletedSingle": 'Deleted "{name}"',
  "overview.onboarding": "Getting Started",
  "overview.workflowTitle": "Start a new video project",
  "overview.workflowSubtitle": "Follow these four stages. Return to Overview at any time to review the project's data.",
  "overview.workflow.stage1": "Prepare the script",
  "overview.workflow.stage1.1": "Open Script and paste your content, or use Prompt Import if you already have a prompt sheet.",
  "overview.workflow.stage1.2": "Choose a Script Skill and visual style when needed.",
  "overview.workflow.stage1.3": "Import the script, then review its episodes, scenes, shots, and dialogue.",
  "overview.workflow.stage2": "Prepare visuals",
  "overview.workflow.stage2.1": "Review the characters and scenes detected from the script.",
  "overview.workflow.stage2.2": "Complete any missing descriptions, prompts, or reference images.",
  "overview.workflow.stage2.3": "Generate and save the character and location images needed throughout the video.",
  "overview.workflow.stage3": "Build in Director",
  "overview.workflow.stage3.1": "Open Director and add the shots you want to produce to the working list.",
  "overview.workflow.stage3.2": "Check each shot's prompt, characters, location, and reference images.",
  "overview.workflow.stage3.3": "Generate images first, approve them, then generate video for the accepted shots.",
  "overview.workflow.stage4": "Review and export",
  "overview.workflow.stage4.1": "Review every shot's images, video, dialogue, and duration.",
  "overview.workflow.stage4.2": "Open Export and choose the deliverables you need.",
  "overview.workflow.stage4.3": "For a quick Audio + SRT + image assembly, use Auto Video.",
  "overview.projectTitle": "Project Overview",
  "overview.storyCore": "Story Core",
  "overview.title": "Title",
  "overview.titlePlaceholder": "Series title",
  "overview.logline": "Logline",
  "overview.loglinePlaceholder": "One-sentence summary of the story's main line...",
  "overview.outline": "Outline",
  "overview.outlinePlaceholder": "Full story outline in 100-500 words...",
  "overview.centralConflict": "Central Conflict",
  "overview.centralConflictPlaceholder": "Main conflict...",
  "overview.themes": "Themes",
  "overview.noThemes": "No theme tags yet",
  "overview.production": "Production Setup",
  "overview.visualStyle": "Visual Style",
  "overview.unset": "Not set",
  "overview.language": "Language",
  "overview.episodeDirectory": "Episodes ({count})",
  "overview.noEpisodes": "No episode data yet. It will be created automatically after importing the script.",
  "overview.episode": "Episode {index}",
  "overview.sceneCount": "{count} scenes",
  "overview.editEpisodeTitle": "Edit episode title",
  "overview.confirmDeleteEpisode": "Confirm delete?",
  "overview.add": "Add",
  "overview.characters": "Characters ({count})",
  "overview.noCharacters": "No character data yet",
  "overview.moreCharacters": "and {count} more characters..."
};
const settings$1 = {
  "update.desktopOnly": "This feature is only available in the desktop app",
  "update.installFailed": "Failed to download or install the update",
  "update.newVersion": "New version found: v{version}",
  "update.upgradeAvailable": "Current version v{currentVersion}. Upgrade available to v{latestVersion}.",
  "update.releaseNotes": "Release Notes",
  "update.publishedAt": "Published: {date}",
  "update.noReleaseNotes": "No release notes were provided for this release.",
  "update.installUpdate": "Install Update",
  "update.installHint": "The app will download the update, close, and reopen to finish installing.",
  "update.installNow": "Download and Install",
  "update.installing": "Downloading update...",
  "update.ignore": "Ignore this version",
  "update.later": "Later",
  "settings.title": "Settings",
  "settings.configured": "Configured: {count}/{total}",
  "settings.addProvider": "Add Provider",
  "settings.tab.api": "API Manager",
  "settings.tab.imageHost": "Image Hosting",
  "settings.tab.storage": "Storage",
  "settings.securityTitle": "Security Notice",
  "settings.securityBody": "All API keys are stored locally in your browser storage and are never uploaded to any server. Multiple keys are supported for rotation and automatic failover.",
  "settings.recommended": "Recommended",
  "settings.providers": "Providers",
  "settings.noProviders": "No providers configured yet",
  "settings.models": "Models ({count})",
  "settings.badgeConfigured": "Configured",
  "settings.syncModels": "Sync model list",
  "settings.syncSuccess": "Synced {count} models",
  "settings.syncFailed": "Failed to sync models",
  "settings.testConnection": "Test connection",
  "settings.edit": "Edit",
  "settings.confirmDelete": "Confirm Deletion",
  "settings.confirmDeleteProvider": "Delete {name}? This action cannot be undone.",
  "settings.deleteProvider": "Delete provider",
  "settings.deleteImageHost": "Delete image host",
  "settings.imageHostTestSuccess": "Image host {name} connected successfully",
  "settings.testFailed": "Test failed: {message}",
  "settings.networkTestFailed": "Connection test failed. Please check your network.",
  "settings.configureApiKeyFirst": "Configure an API key first",
  "settings.connectionSuccess": "Connection successful",
  "settings.providerConfigured": "{name} configured",
  "settings.connectionFailedWithStatus": "Connection test failed ({status})",
  "settings.globalSettings": "Global Settings",
  "settings.cliRuntimeTitle": "CLI Runtime",
  "settings.cliRuntimeDescription": "Use Claude CLI or OpenCode for text analysis tasks instead of direct API calls.",
  "settings.cliRuntimeUnavailableHint": "No CLI runtime detected yet. In web dev mode it should come from the Vite dev server; in desktop mode it comes from Electron.",
  "settings.cliModel": "CLI model",
  "settings.cliTimeout": "Timeout (ms)",
  "settings.cliAvailable": "Available",
  "settings.cliUnavailable": "Unavailable",
  "settings.cliStatusUnknown": "Status not checked yet",
  "settings.refreshCliStatus": "Refresh CLI Status",
  "settings.cliRuntimeHint": "When enabled, text features such as script analysis will prefer the selected CLI runtime. Image and video generation still use API providers.",
  "settings.cliTestPrompt": "Test prompt",
  "settings.cliRunTest": "Run CLI Test",
  "settings.cliTestPromptPlaceholder": "Enter a short prompt to verify the CLI runtime",
  "settings.cliTestOutput": "Streaming output",
  "settings.cliTestOutputEmpty": "No output yet",
  "settings.cliTestPromptRequired": "Enter a test prompt first",
  "settings.cliRuntimeUnavailable": "No CLI runtime is available yet. Start the normal dev server or Electron and refresh status.",
  "settings.cliUsingDevServer": "Using Vite dev runtime",
  "settings.cliUsingElectronRuntime": "Using Electron runtime",
  "settings.cliRuntimeStartHint": "Start the normal dev server or Electron",
  "settings.cliPathUnknown": "CLI path not detected",
  "settings.cliSelectModel": "Select CLI model",
  "settings.cliLoadingModels": "Loading models...",
  "settings.cliNoModels": "No models discovered yet",
  "settings.cliModelSourceReady": "{count} models available",
  "settings.maxStudioLanesTitle": "Lane count",
  "settings.maxStudioImageLanes": "Image lanes",
  "settings.maxStudioImageLanesHelp": "Image generation lanes per account, for every provider. Minimum 1.",
  "settings.maxStudioVideoLanes": "Video lanes",
  "settings.maxStudioVideoLanesHelp": "Video generation lanes per account, for every provider. Minimum 1.",
  "settings.maxStudioImageSubmitDelay": "Image submit delay (ms)",
  "settings.maxStudioImageSubmitDelayHelp": "Delay range between any two image submit requests, for every provider.",
  "settings.maxStudioVideoSubmitDelay": "Video submit delay (ms)",
  "settings.maxStudioVideoSubmitDelayHelp": "For every provider: spaces video submissions and adds a cooldown after a video finishes before that lane starts its next video.",
  "settings.maxStudioJwtStartStagger": "Account spacing (ms)",
  "settings.maxStudioJwtStartStaggerHelp": "Spacing used when requests switch accounts, preventing accounts from submitting at the same time.",
  "settings.directorImageTimeout": "Director image timeout (sec)",
  "settings.directorImageTimeoutHelp": "Random timeout range for each batch image job before retrying or marking failed.",
  "settings.directorVideoTimeout": "Director video timeout (sec)",
  "settings.directorVideoTimeoutHelp": "Random timeout range for each batch video job before retrying or marking failed.",
  "settings.maxStudioSettingsSaved": "Lane and delay settings saved",
  "settings.scriptImportChunkConcurrency": "Parallel script chunks",
  "settings.scriptImportChunkConcurrencyDesc": "Number of long-script chunks processed at the same time during script-skill import.",
  "settings.scriptImportChunkConcurrencyHint": "Raise to 3-4 for faster imports when your API/model can handle it. Range: {min}-{max}.",
  "settings.watermarkRemoval": "Auto-remove Gemini watermark",
  "settings.watermarkRemovalDesc": "Automatically removes the Gemini watermark from images right after they are generated. Applies to newly generated images only.",
  "settings.watermarkRemovalProHint": "This feature requires the Pro or Unlimited plan.",
  "settings.imageHostTitle": "Image Hosting",
  "settings.imageHostDescription": "Image hosting is used to store temporary images created during video generation, such as extracted end frames and frame handoff assets.",
  "settings.imageHostProviders": "Image host providers",
  "settings.add": "Add",
  "settings.noImageHosts": "No image host configured yet",
  "settings.notConfigured": "Not configured",
  "settings.addressNotSet": "address not set",
  "settings.guestUpload": "Guest upload (no key required)",
  "settings.keyCount": "{count} keys",
  "settings.imageHostNotice": "Image hosting stores temporary images used by features like Visual Continuity. Without it, frame handoff across shots will be limited. When multiple image hosts are enabled, they are used in order with automatic failover.",
  "settings.imageHostDefaultNotice": "SCDN is available by default and does not require a key. Enable an image host manually when frame handoff is needed.",
  "settings.storageTitle": "Storage Settings",
  "settings.storageDescription": "Configure resource sharing, storage locations, and cache management.",
  "settings.desktopOnly": "This feature is only available in the desktop app.",
  "settings.resourceSharing": "Resource Sharing",
  "settings.shareCharacters": "Share character library across projects",
  "settings.shareScenes": "Share scene library across projects",
  "settings.shareMedia": "Share media library across projects",
  "settings.visibleCurrentProjectOnly": "When disabled, only the current project can access this.",
  "settings.storageLocation": "Storage Location",
  "settings.storagePathLabel": "Data storage path (includes projects and media)",
  "settings.defaultLocation": "Default location",
  "settings.select": "Select",
  "settings.save": "Save",
  "settings.export": "Export",
  "settings.import": "Import",
  "settings.storageMoveWarning": "Changing the location will move existing data into the new directory and automatically create `projects/` and `media/` subfolders.",
  "settings.dataRecovery": "Data Recovery",
  "settings.dataRecoveryDescription": "After switching devices or reinstalling the system, point the app to an existing data directory to restore all settings and projects.",
  "settings.linkExistingData": "Link existing data directory",
  "settings.linkExistingDataHint": "Choose a data directory that contains `projects/` and `media/` subfolders. Restart the app after this operation.",
  "settings.cacheManagement": "Cache Management",
  "settings.cacheSize": "Cache Size",
  "settings.calculating": "Calculating...",
  "settings.clear": "Clear",
  "settings.autoClean": "Auto Clean",
  "settings.defaultOff": "Off by default",
  "settings.clean": "Clean",
  "settings.cacheOlderThanDays": "cache files older than {count} days",
  "settings.appUpdates": "App Updates",
  "settings.currentVersion": "Current Version",
  "settings.checkForUpdates": "Check for Updates",
  "settings.autoCheckUpdates": "Automatically check for updates on startup",
  "settings.autoCheckUpdatesHelp": "When enabled, the desktop app checks GitHub Releases on launch and notifies you when a new version is available.",
  "settings.ignoredVersion": "Ignored Version",
  "settings.restoreReminder": "Restore reminder",
  "settings.updateReminderRestored": "Update reminders restored",
  "settings.storageUpdated": "Storage location updated. Refreshing...",
  "settings.moveFailed": "Move failed: {message}",
  "settings.dataExported": "Data exported",
  "settings.exportFailed": "Export failed: {message}",
  "settings.confirmImport": "Importing will overwrite current data. Continue?",
  "settings.dataImported": "Data imported. Refreshing...",
  "settings.importFailed": "Import failed: {message}",
  "settings.invalidDataDirectory": "Invalid data directory",
  "settings.linkDataConfirm": "Detected {projectCount} project files and {mediaCount} media files.\n\nUse this directory? Restarting the app afterward is recommended.",
  "settings.linkedDataDir": "Data directory linked. Refreshing...",
  "settings.operationFailed": "Operation failed: {message}",
  "settings.cacheCleared": "Cache cleared",
  "settings.clearFailed": "Clear failed: {message}",
  "settings.checkUpdateFailed": "Failed to check for updates: {message}",
  "settings.upToDate": "You're already on the latest version v{version}",
  "settings.checkUpdateRetry": "Failed to check for updates. Please try again later.",
  "settings.autoSyncedModels": "Automatically synced {count} models",
  "settings.modelSyncFailed": "Model sync failed: {message}",
  "featureBindings.title": "Service Mapping",
  "featureBindings.configured": "Configured: {count}/{total}",
  "featureBindings.scriptAnalysis": "Script Analysis / Dialogue",
  "featureBindings.scriptAnalysisDesc": "Break story text into a structured screenplay.",
  "featureBindings.imageGeneration": "Image Generation",
  "featureBindings.imageGenerationDesc": "Generate reference images for characters and scenes.",
  "featureBindings.videoGeneration": "Video Generation",
  "featureBindings.videoGenerationDesc": "Convert images into video.",
  "featureBindings.imageUnderstanding": "Image Understanding",
  "featureBindings.imageUnderstandingDesc": "Analyze image content and generate descriptions.",
  "featureBindings.imageRec": "Recommended: Nano Banana Pro (Gemini 3 Pro) for strong image quality and consistency.",
  "featureBindings.videoRec": "Test recommendation: doubao-seedance-1-0-lite-t2v-250428 for quick workflow validation.",
  "featureBindings.modelCount": "{count} models",
  "featureBindings.noModels": "No selectable models yet. Configure model lists under API Providers first.",
  "featureBindings.multiSelectHint": "You can select multiple models. Requests will rotate across them in sequence with a 3-second interval.",
  "featureBindings.searchPlaceholder": "Search model names...",
  "featureBindings.noMatches": "No matching models",
  "featureBindings.incompleteTitle": "Some services are not configured",
  "featureBindings.incompleteBody": "Choose at least one provider/model for each feature above and make sure the matching provider has a valid API key.",
  "featureBindings.helpRotation": "Each feature can use multiple models, and requests will rotate across them in order every 3 seconds to reduce rate-limit pressure on a single API.",
  "featureBindings.helpSource": "Available options come from the model lists configured under API Providers. Expand a section to select multiple models.",
  "apiDialog.addProvider": "Add Provider",
  "apiDialog.addProviderDesc": "Add a new provider",
  "apiDialog.platform": "Platform",
  "apiDialog.selectPlatform": "Select a platform",
  "apiDialog.name": "Name",
  "apiDialog.namePlaceholder": "Provider name",
  "apiDialog.baseUrlOptional": "Base URL (optional to edit)",
  "apiDialog.enterApiKey": "Enter API key",
  "apiDialog.multiKeys": "Multiple keys are supported. Separate them with commas.",
  "apiDialog.modelOptional": "Model (optional)",
  "apiDialog.modelPlaceholder": "Enter model name, e.g. gpt-4o",
  "apiDialog.add": "Add",
  "apiDialog.choosePlatform": "Choose a platform",
  "apiDialog.enterName": "Enter a name",
  "apiDialog.customNeedsBaseUrl": "A custom platform requires a Base URL",
  "apiDialog.enterApiKeyError": "Enter an API key",
  "apiDialog.added": "Added {name}",
  "apiDialog.editProvider": "Edit Provider",
  "apiDialog.apiKeys": "API Keys",
  "apiDialog.keyCount": "{count} keys",
  "apiDialog.keyListPlaceholder": "Enter API keys (one per line or comma-separated)",
  "apiDialog.keyRotationHint": "Multiple keys are supported and will rotate automatically on failure.",
  "apiDialog.modelListHint": "Separate multiple models with commas. The first model is treated as the default.",
  "featureBindings.tip": "Tip:",
  "featureBindings.note": "Note:",
  "imageHost.addTitle": "Add Image Host Provider",
  "imageHost.editTitle": "Edit Image Host Provider",
  "imageHost.scdnHint": "SCDN supports direct uploads and works well as the default image host.",
  "imageHost.apiKeyHeader": "API Key Header",
  "imageHost.cancel": "Cancel",
  "imageHost.add": "Add",
  "imageHost.save": "Save"
};
const script$1 = {
  "promptImport.importFile": "Import file",
  "promptImport.title": "Prompt Import",
  "promptImport.description": "Paste CSV with columns: episodeIndex, shotIndex, sceneName, ref_image, imagePrompt, videoPrompt, voiceOver, videoLength. sceneName and ref_image are optional; ref_image accepts 1 or 1;2.",
  "promptImport.previewValid": "Preview: {count} valid row(s)",
  "promptImport.syncScript": "Sync Script",
  "promptImport.openDirector": "Open in Director",
  "promptImport.syncedDirector": "Synced {count} prompt(s) and opened in Director.",
  "promptImport.syncedScript": "Synced {count} prompt(s) to Script.",
  "promptImport.shot": "Shot",
  "promptImport.episode": "Episode",
  "promptImport.scene": "Scene",
  "promptImport.refImage": "Ref image",
  "promptImport.characters": "Characters",
  "promptImport.imagePrompt": "Image prompt",
  "promptImport.videoPrompt": "Video prompt",
  "promptImport.voiceOver": "Voice-over",
  "promptImport.videoLength": "Length",
  "property.empty": "Select an episode, character, scene, or shot\nto view details",
  "property.status.pending": "Not Started",
  "property.status.inProgress": "In Progress",
  "property.status.completed": "Completed",
  "property.episode": "Episode {index}",
  "property.sceneStats": "Scene Stats",
  "property.sceneCount": "This episode contains {count} scenes",
  "property.shotStatus": "Shot status: {status}",
  "property.shotStatus.completed": "Generated",
  "property.shotStatus.generating": "Generating...",
  "property.shotStatus.idle": "Not generated",
  "property.generateShots": "Generate Shots",
  "property.copied": "Copied",
  "property.copyShotData": "Copy Shot Data ({count})",
  "property.scenePrompt": "Scene Prompt",
  "property.viewCharacterLibrary": "View Character Library Asset",
  "property.importCharacterLibrary": "Import to Character Library",
  "property.copyCharacterData": "Copy Character Data",
  "property.deleteCharacter": "Delete Character",
  "property.confirmDelete": "Confirm Deletion",
  "property.confirmDeleteCharacter": 'Delete character "{name}"?',
  "property.mainScene": "Main Scene",
  "property.secondaryScene": "Secondary Scene",
  "property.transitionScene": "Transition Scene",
  "property.appearsCount": "Appears {count} times",
  "property.appearsEpisodes": "Episodes {episodes}",
  "property.viewSceneLibrary": "View Scene Library Asset",
  "property.importSceneLibrary": "Import to Scene Library",
  "property.copySceneData": "Copy Scene Data",
  "property.goAiDirector": "Generate Video in AI Director",
  "property.deleteScene": "Delete Scene",
  "property.confirmDeleteScene": 'Delete scene "{name}"? All shots under it will also be deleted.',
  "property.shot": "Shot {index}",
  "property.image": "Image",
  "property.video": "Video",
  "property.goAiDirectorShort": "Generate in AI Director",
  "property.copyThreeLayerPrompts": "Copy Three-Layer Prompt Data",
  "property.deleteShot": "Delete Shot",
  "property.confirmDeleteShot": "Delete shot {index}?",
  "scriptView.scriptGenerationFailed": "Script generation failed: {message}",
  "scriptView.parseFailed": "Parsing failed: {message}",
  "scriptView.shotGenerationFailed": "Shot generation failed: {message}",
  "scriptView.goCharacterLibrary": "Moved to Character Library",
  "scriptView.goCharacterLibrarySelected": 'Moved to Character Library and selected "{name}"',
  "scriptView.goSceneLibrarySelected": 'Moved to Scene Library and selected "{name}"',
  "scriptView.structureComplete": "Structure completion finished: parsed {count} scenes",
  "scriptView.structureCompleteFailed": "Structure completion failed",
  "scriptView.generatingEpisodeShots": "Generating shots for Episode {index}...",
  "scriptView.episodeShotsDone": "Episode {index} shot generation completed with {count} shots",
  "scriptView.allScenesImported": "All script scenes have already been imported",
  "scriptView.selectScenesToImport": "Select at least one scene to import",
  "scriptView.charactersImported": "Imported {count} characters to the library",
  "scriptView.scenesImported": "Imported {count} scenes to the library",
  "scriptView.importScenesTitle": "Import Scenes",
  "scriptView.importScenesHint": "Choose which script scenes to add to the scene library.",
  "scriptView.selectAll": "Select all",
  "scriptView.importAction": "Import ({count})",
  "scriptView.noDescription": "No description yet",
  "scriptView.goSceneLibrary": "Moved to Scene Library",
  "scriptView.goSceneLibraryBasic": 'Moved to Scene Library and filled the basic scene data for "{name}"',
  "scriptView.goDirector": "Moved to AI Director",
  "scriptView.goDirectorShotFilled": "Moved to AI Director and filled the shot content",
  "scriptView.goDirectorSceneFilled": 'Moved to AI Director and filled "{name}" with {count} shots',
  "scriptView.title": "Script Editor",
  "scriptView.statusParsing": "Parsing...",
  "scriptView.statusGeneratingShots": "Generating shots...",
  "scriptView.overwriteStructureTitle": "Overwrite existing scene structure?",
  "scriptView.overwriteStructureBody": "This episode already contains scene data. Re-parsing will replace the current scenes and remove their related shots. Continue?",
  "scriptView.confirmOverwrite": "Confirm overwrite",
  "episodeTree.structureAfterParse": "Prompt structure appears here after screenplay analysis",
  "episodeTree.generating": "Generating...",
  "episodeTree.refreshShots": "Refresh Shots",
  "episodeTree.generateShots": "Generate Shots",
  "episodeTree.newScene": "New Scene",
  "episodeTree.edit": "Edit",
  "episodeTree.extras": "Extras / Minor Roles ({count})",
  "episodeTree.editEpisode": "Edit Episode",
  "episodeTree.title": "Title",
  "episodeTree.description": "Description",
  "episodeTree.editScene": "Edit Scene",
  "episodeTree.sceneName": "Scene Name",
  "episodeTree.confirmAdd": "Confirm Add",
  "episodeTree.editCharacter": "Edit Character",
  "episodeTree.characterName": "Character Name",
  "episodeTree.confirmDelete": "Confirm Delete",
  "episodeTree.cancel": "Cancel",
  "episodeTree.progress": "Progress: {value}",
  "scriptInput.importLabel": "Paste the screenplay or source script content here so the system can analyze it into prompts afterward",
  "scriptInput.importPlaceholder": "You can paste a full screenplay, a long outline, or manually written script content. Once the script is ready, the system will analyze it into scenes, shots, characters, and base prompts.",
  "scriptInput.importSuccess": "The script is ready and analysis has completed. Pick a scene or shot in the middle column to continue.",
  "scriptInput.importFailed": "Import failed: {message}",
  "scriptInput.processing": "Processing script...",
  "scriptInput.importScript": "Read script, identify characters, and split shots",
  "scriptInput.cancel": "Cancel",
  "scriptInput.visualStyle": "Visual Style",
  "scriptInput.visualStyleHelp": "This style will be used when AI calibration generates visual descriptions for shots.",
  "scriptInput.apiNotConfigured": "API not configured",
  "scriptInput.apiNotConfiguredHelp": "Configure an API key in Settings first",
  "scriptInput.cliStreamingWaiting": "Waiting for CLI output...",
  "scriptInput.scriptSkill": "Script Skill",
  "scriptInput.skillOptionalWorkflow": "optional flexible workflow",
  "scriptInput.skillOutputs": "Outputs",
  "scriptInput.skillMerge": "Merge",
  "scriptInput.chooseSavedSkill": "Choose saved skill",
  "scriptInput.noSavedSkill": "No saved skill",
  "scriptInput.skillNamePlaceholder": "Skill name",
  "scriptInput.skillTextPlaceholder": "Paste skill.md here, or import a .md/.txt file",
  "scriptInput.chunkThreshold": "Script split threshold",
  "scriptInput.chunkThresholdHelp": "When using Script Skill, content with {count} words or more is split into chunks for more stable processing.",
  "scriptInput.importSkillFile": "Import",
  "scriptInput.saveSkill": "Save",
  "scriptInput.deleteSkill": "Delete",
  "scriptInput.untitledSkill": "Untitled Skill",
  "scriptInput.skillUpdated": "Updated skill: {name}",
  "scriptInput.skillSaved": "Saved skill: {name}",
  "scriptInput.skillDeleted": "Deleted skill",
  "scriptInput.skillFileImported": "Imported skill file: {name}",
  "scriptInput.importWithSkill": "Import with Skill",
  "scriptInput.runningSkill": "Running skill",
  "promptStatus.image": "Image",
  "promptStatus.video": "Video",
  "promptStatus.imagePrompt": "imagePrompt",
  "promptStatus.videoPrompt": "videoPrompt",
  "promptStatus.ready": "ready",
  "promptStatus.missing": "missing",
  "promptStatus.notRequired": "not required",
  "scriptInput.generateShotPrompts": "Create image/video prompts for each shot",
  "scriptInput.step2Incomplete": "Step 2 is not complete yet. This shot only has structure data. Run prompt generation to create Image Prompt and Video Prompt.",
  "scriptView.zhipuMissingSkipViewAnalysis": "Zhipu is not configured, so view analysis was skipped.",
  "scriptView.exportCsv": "Export CSV"
};
const director$1 = {
  "director.noStoryboard": "No storyboard image to process",
  "director.enterSceneEditing": "Entered scene editing",
  "director.splitDone": "Split into {count} scenes successfully",
  "director.splitFailed": "Split failed: {message}",
  "director.generatingStoryboard": "Generating storyboard grid...",
  "director.generationFailed": "Generation failed",
  "director.unknownError": "Unknown error",
  "director.regenerate": "Regenerate",
  "director.noStoryboardImage": "No storyboard image yet",
  "director.backToInput": "Back to input",
  "director.styleSwitched": "Switched to {name} style",
  "director.aspectHorizontal": "Landscape",
  "director.aspectVertical": "Portrait",
  "director.aspectSwitched": "Switched to {mode} mode",
  "director.sceneDeleted": "Shot {index} deleted",
  "director.startFrameStopped": "Stopped first-frame generation for shot {index}",
  "director.videoStopped": "Stopped video generation for shot {index}",
  "director.mergeStopped": "Merged generation stopped",
  "director.frame.start": "first",
  "director.card.startPromptUpdated": "Updated shot {index} start-frame {language} prompt",
  "director.card.videoPromptUpdated": "Updated shot {index} video {language} prompt",
  "director.card.startUploaded": "Uploaded shot {index} first frame",
  "director.card.startRemoved": "Removed shot {index} first frame",
  "director.card.downloadDone": "{name} downloaded",
  "director.card.downloadFailed": "Download failed",
  "director.card.shot": "Shot #{index}",
  "director.card.scene": "Scene: {name}",
  "director.card.location": "Location: {name}",
  "director.card.deleteShot": "Delete shot #{index}?",
  "director.card.deleteBody": "This action removes all content in the shot and cannot be undone.",
  "director.configureImageMapping": "Configure the image-generation service mapping in Settings first",
  "director.configureImageModel": "Configure the image-generation model in Settings first",
  "director.userCancelled": "Cancelled by user",
  "director.cannotGeneratePrompts": "Cannot generate prompts because the storyboard or shots are missing",
  "director.generatingPrompts": "Generating prompts from shot content...",
  "director.generatedPrompts": "Generated prompts for {count} shots ({endCount} require end frames)",
  "director.configureVideoModel": "Configure the video-generation model in Settings first",
  "director.configureVideoMapping": "Configure the video-generation service mapping in Settings first",
  "director.configurePlatformKey": "Configure the API key for {platform} first",
  "director.noFirstFrame": "Shot {index} has no first-frame image. Generate one first.",
  "director.videoDoneSaved": "Shot {index} video generated and saved to Assets",
  "director.skippedModeration": "Shot {index} was skipped due to content moderation",
  "director.shotFailed": "Shot {index} generation failed: {message}",
  "director.noShotsToGenerate": "No shots available for generation",
  "director.missingPromptCount": "{count} shots do not have prompts yet. Default prompts will be used.",
  "director.allShotsAlreadyGenerating": "All shots are already generated or currently generating",
  "director.startSerialVideo": "Starting serial generation for {count} videos... Processing {concurrency} at a time",
  "director.allVideosDone": "All videos generated",
  "director.someVideosDone": "{success}/{total} videos generated, {failed} failed",
  "director.fillStartPromptFirst": "Fill in the first-frame prompt before generating the image",
  "director.imageDoneSaved": "Shot {index} image generated and saved to Assets",
  "director.videoSaved": "Shot {index} video saved to Assets",
  "director.imageSaved": "Shot {index} image saved to Assets",
  "director.saveFailed": "Save failed: {message}",
  "director.noSplitScenes": "No split shots yet",
  "director.autoFillPrompts": "AI Auto-Fill Prompts",
  "director.aspectRatio": "Ratio:",
  "director.card.upload": "Upload",
  "director.card.generatingElapsed": "Generating {seconds}s",
  "director.card.stop": "Stop",
  "director.card.downloadStart": "Download first frame",
  "director.card.deleteStart": "Delete first frame",
  "director.card.regenerate": "Regenerate",
  "director.card.generateImage": "Generate Image",
  "director.card.generateVideo": "Generate Video",
  "director.card.moderationSkipped": "Skipped by moderation",
  "director.card.prompts": "Prompts",
  "director.card.startFrame": "Start Frame",
  "director.card.video": "Video",
  "director.card.unset": "Not set",
  "director.card.mode.imageVideo": "Image + Video",
  "director.card.mode.imageOnly": "Image Only",
  "director.card.mode.textToVideo": "Text to Video",
  "director.card.mode.noPrompts": "No Prompts",
  "director.card.noImagePrompt": "no imagePrompt",
  "director.card.noVideoPrompt": "no videoPrompt",
  "director.card.startFramePrompt": "Start-Frame Prompt (static image)",
  "director.card.startFramePlaceholder": "Describe the static image for the first frame...",
  "director.card.videoPrompt": "Video Prompt (dynamic action)",
  "director.card.videoPlaceholder": "Describe motion, action, and changes in the video...",
  "director.preview.shot": "Shot {index}",
  "director.preview.shotFrame": "Shot {index} - {frame}",
  "director.preview.shotVideo": "Shot {index} - Video",
  "director.preview.aiShotVideo": "Shot {index} - AI Video",
  "director.editingHeader": "Shot Editing",
  "director.shotCount": "{count} shots",
  "director.fillImagesFromFolder": "Fill images from folder",
  "director.fillImagesBusy": "Filling images...",
  "director.fillImagesNoImages": "No supported images found in the folder",
  "director.fillImagesNoMissingShots": "All shots already have images",
  "director.fillImagesDone": "Filled {count} image(s) into shots",
  "director.fillImagesFailed": "{count} image(s) failed to import",
  "director.fillImagesRemaining": "{count} shot(s) still need images",
  "director.fillImagesExtra": "{count} extra image(s) were ignored",
  "director.refToVideoIgnoredNotice": "This shot is in ref-to-video mode. Existing start-frame, end-frame, and image-prompt data will be ignored.",
  "director.regenerateStoryboard": "Regenerate",
  "director.endFrameUsesShot": "End frame: Shot {index}",
  "director.noLinkedEndFrame": "No linked end frame",
  "director.generateAll": "Generate Full Flow",
  "director.generateAllImages": "Generate All Shot Images",
  "director.generateImagesButton": "Generate Images ({ready}/{total})",
  "director.clearShotSelection": "Clear Selection",
  "director.mergedRunning": "Generating...",
  "director.allImagesReady": "All shots already have images",
  "director.allImagesRequiredBeforeVideo": "Every shot needs an image before video generation can start",
  "director.missingPromptWarning": "Some shots are missing prompts. Click the text area under a shot to edit them.",
  "director.addBlankShot": "Add Blank Shot",
  "director.generateVideosButton": "Generate All Videos ({ready}/{total})",
  "director.imageReadyCounts": "{ready} shots already have images, {needImage} empty shots will be generated",
  "director.videoReadyCounts": "{withImages} shots already have images, this button will generate videos for {needVideo} eligible shots",
  "director.bottomHint": "Click the text area below each shot to edit the video prompt. Hover over a shot to delete it.",
  "director.context.noScript": "No script data yet",
  "director.context.goScript": "Open the Script panel and parse the script first",
  "director.context.goScriptButton": "Go to Script",
  "director.context.progress": "Progress: {value}",
  "director.context.hint": "Click a scene or shot to send it into AI Director input",
  "director.context.addedCount": "Added {count} shots to the editing list",
  "director.context.addEpisode": "Add the full episode to shot editing",
  "director.context.sendShotOrAdd": "Click: send to AI Director input | Double-click: add directly to shot editing",
  "director.context.addToEditing": "Add to shot editing",
  "director.context.addMode": "+ Add to shot editing (generate images one by one)",
  "director.context.sendMode": "-> Send to input (cheaper for batch generation)",
  "director.context.backToScript": "Back to Script",
  "director.context.structure": "Script Structure",
  "director.storyboardReady": "Storyboard Ready",
  "director.emptySplitResult": "Split result is empty. Check whether the storyboard image is valid.",
  "director.splitting": "Splitting...",
  "director.splitFailedTitle": "Split failed",
  "director.sceneImagePreview": "Scene Image Preview",
  "director.generationComplete": "Generation Complete",
  "director.screenplayPreview": "Screenplay Preview",
  "director.completedCount": "{completed} / {total} scenes",
  "director.pendingStatus": "Pending",
  "director.failedStatus": "Failed",
  "director.estimatedRemaining": "Estimated remaining time: {time}",
  "director.lessThanOneMinute": "less than 1 minute",
  "director.aboutMinutes": "about {minutes} minutes",
  "director.aboutHoursMinutes": "about {hours}h {minutes}m",
  "director.previewStatus": "Preview",
  "director.editingStatus": "Editing Scenes",
  "director.errorStatus": "Error",
  "director.readyStatus": "Ready",
  "director.apiShort": "API",
  "director.configureApiShort": "Configure API",
  "director.previousStep": "Previous",
  "director.nextStep": "Next",
  "director.storyboardProgress": "Storyboard {progress}%",
  "director.imageProgress": "Images {progress}%",
  "director.imagesReady": "Images Ready",
  "director.videoProgress": "Videos {progress}%",
  "director.aiBadge": "AI",
  "director.describeVideo": "Describe the video you want to create",
  "director.examplePrompts": "Example prompts",
  "director.selectCharacters": "Select Characters",
  "director.characterLibraryEmpty": "Character library is empty",
  "director.referenceImagesOptional": "Reference Images (optional)",
  "director.apiNotConfigured": "API not configured",
  "director.screenplayPlaceholder": "For example: a cute kitten playing on the grass...",
  "director.aspectRatioLabel": "Ratio",
  "director.selectRatio": "Select ratio",
  "director.resolutionLabel": "Resolution",
  "director.selectResolution": "Select resolution",
  "director.selectSceneCount": "Select scene count",
  "director.visualStyleLabel": "Visual Style",
  "director.selectStyleRandom": "Select a style (leave empty for random)",
  "director.generatingScreenplay": "Generating screenplay...",
  "director.deleteAllScenes": "Delete all scenes",
  "director.title": "AI Director",
  "director.doubleClickEdit": "Double-click to edit",
  "director.selectCharactersLabel": "Select Characters",
  "director.charactersSelected": "Selected {count}",
  "director.characterLibrary": "Character Library",
  "director.goCreateCharacter": "Go Create Character",
  "director.generationProgressTitle": "Generation Progress",
  "director.chooseEmotionTags": "Choose mood",
  "director.deleteScene": "Delete scene",
  "director.sceneNarrationPlaceholder": "Enter scene narration...",
  "director.shotLabel": "Shot",
  "director.actionLabel": "Action",
  "director.scenesLabel": "Scenes",
  "director.referencePreview": "Reference Preview",
  "director.sceneReference": "Scene Reference",
  "director.shotReference": "Shot Reference",
  "director.selectShotReference": "Select shot reference",
  "director.shotReferencesSelected": "{count} shot refs",
  "director.noOtherShots": "No other shots available",
  "director.shotsLabel": "Shots",
  "director.selectGeneratedShotHint": "Select a generated shot",
  "director.missingShotRefs": "Missing reference images: {refs}",
  "director.selectSceneReference": "Select scene reference",
  "director.clearSelection": "Clear selection",
  "director.emptySceneLibrary": "Scene library is empty. Create scenes first.",
  "director.sceneNumber": "Scene {id}",
  "director.random": "Random",
  "director.clear": "Clear",
  "director.retry": "Retry",
  "director.cancel": "Cancel",
  "director.save": "Save",
  "director.moodLabel": "Mood",
  "director.generateAudio": "Generate Audio",
  "director.completedStatus": "Completed",
  "director.selectSceneHint": "Select a scene",
  "director.videoLabel": "Video",
  "director.generatingStatus": "Generating...",
  "director.generateVideo": "Generate Video",
  "director.videoStoryboardFallback": "Video storyboard",
  "director.sceneImagePreviewHint": "Review generated images. Regenerate or delete any scene you are not satisfied with.",
  "director.sceneCount": "{count} scenes",
  "director.confirmAndGenerateVideo": "Confirm and Generate Video",
  "director.cancelGeneration": "Cancel Generation",
  "director.allScenesGenerated": "All scenes are complete and the assets have been added to the media library.",
  "director.createNewScreenplay": "Create New Screenplay",
  "director.fromMediaLibrary": "From Media Library",
  "director.selectImageApplyTo": "Select an image to apply to {target}",
  "director.totalImagesCount": "{count} images",
  "director.mediaLibraryEmpty": "No images in the media library yet. Add images or generate a quad grid first.",
  "director.all": "All",
  "director.noVideoToSave": "No video available to save",
  "director.noImageToSave": "No image available to save",
  "director.step.storyInput": "Story Input",
  "director.step.previewStoryboard": "Storyboard Preview",
  "director.step.editScenes": "Edit Scenes",
  "director.noCharacterRefs": "No character reference images found. Please add character images in the Character tab first.",
  "director.videoModeLabel": "Video mode",
  "director.frameInputLabel": "Frame input",
  "director.imageToVideoOption": "Image to Video",
  "director.refToVideoOption": "Ref to Video",
  "director.startFrameOption": "Start",
  "director.startEndFrameOption": "Start + End",
  "director.referenceImagesOption": "Reference images",
  "director.betaLabel": "Beta"
};
const characters$1 = {
  "characters.finalImagePrompt": "Final image prompt",
  "characters.exportCurrentView": "Export Current View",
  "characters.generateImage": "Generate Character Image",
  "characters.referenceImages": "Reference Images",
  "characters.referenceAlt": "Reference {index}",
  "characters.previewBadge": "Preview",
  "characters.discardBack": "Discard and Go Back",
  "characters.imageSaving": "Saving image locally...",
  "characters.descriptionPlaceholder": "Short text used for @character references in Director, not for character image generation...",
  "characters.enterDescription": "Enter a character description",
  "characters.savedLocal": "Character sheet saved locally",
  "characters.saveFailed": "Save failed",
  "characters.console": "Character Sheet Console",
  "characters.name": "Character Name",
  "characters.namePlaceholder": "e.g. Xiaoming, Doraemon",
  "characters.description": "Character Description",
  "characters.shortDescriptionPlaceholder": "Base prompt for generating the character image, before style/sheet/reference images...",
  "characters.galleryTitle": "Character Library",
  "characters.search": "Search characters...",
  "characters.importCsv": "Import CSV",
  "characters.exportCsv": "Export CSV",
  "characters.csvExported": "Exported {count} characters to CSV.",
  "characters.fillImages": "Fill images by name",
  "characters.imagesFilled": "Filled {filled} character images; skipped {skipped}.",
  "characters.csvNeedsProject": "Open a project before importing character CSV.",
  "characters.csvImported": "Character CSV: {created} created, {updated} filled, {unchanged} unchanged, {skipped} skipped.",
  "characters.csvImportFailed": "Could not import character CSV: {message}",
  "characters.thisEpisode": "This Episode",
  "characters.fullSeries": "Full Series",
  "characters.folders": "Folders",
  "characters.count": "Characters ({count})",
  "characters.moved": "Character moved",
  "characters.doubleClickPreview": "Double-click to preview full image",
  "characters.noDescription": "No description yet",
  "characters.noMatch": "No matching characters found",
  "characters.noCharactersYet": "No characters yet",
  "characters.useConsole": "Use the left console to create characters",
  "characters.createFolder": "Create Folder",
  "characters.folderName": "Folder name",
  "characters.renameFolder": "Rename Folder",
  "characters.save": "Save",
  "characters.aspectRatio": "Ratio",
  "characters.voiceId": "Voice",
  "characters.voiceNone": "No voice",
  "characters.regenerateImage": "Regenerate Image",
  "characters.saveCharacterSettings": "Save Character Settings",
  "characters.settingsUpdated": "Character settings updated",
  "characters.detailEmpty": "Select a character to view details",
  "characters.deleted": "Character deleted",
  "characters.exportSuccess": "{name}.png exported successfully",
  "characters.exportFailed": "Export failed",
  "characters.info": "Character Info",
  "characters.characterPrompt": "Character Prompt",
  "characters.dragHint": "Character images can be dragged into the AI Director panel.",
  "characters.deleteCharacter": "Delete Character",
  "characters.deleteCharacterConfirm": 'Are you sure you want to delete "{name}"? This action cannot be undone.',
  "characters.deleteFolder": "Delete Folder",
  "characters.deleteFolderConfirm": 'Are you sure you want to delete the folder "{name}"? Characters inside will be moved to the root.',
  "characters.folderDeleted": "Folder deleted",
  "characters.create": "Create",
  "characters.createAll": "Create All ({count})",
  "characters.stopAll": "Stop All",
  "characters.openDetails": "Open Details",
  "characters.previewImage": "Preview character image",
  "characters.saveImage": "Save character image",
  "characters.imageReady": "Image ready",
  "characters.noImageYet": "No image yet",
  "characters.generateImageHint": "This character does not have a main image yet.",
  "characters.generatedImage": "Generated an image for {name}.",
  "characters.generateImageFailed": "Failed to generate an image for {name}: {message}",
  "characters.syncFlowMissing": "Sync Flow · {count} missing",
  "characters.syncFlowProgress": "Flow {synced}/{total}",
  "characters.syncFlowOffline": "Flow offline",
  "characters.syncingFlow": "Syncing Flow {count} accounts...",
  "characters.syncFlowTitle": "Sync Character library images to every ready Flow account",
  "characters.syncFlowPartial": "Sync incomplete: uploaded {uploaded}, skipped {skipped}; {failed} accounts failed.",
  "characters.syncFlowSuccess": "Synced {accounts} accounts: uploaded {uploaded}, skipped {skipped} existing images.",
  "characters.syncFlowError": "Could not sync character images."
};
const scenes$1 = {
  "scenes.untitled": "Untitled scene",
  "scenes.libraryTitle": "Scene Library",
  "scenes.search": "Search scenes...",
  "scenes.importCsv": "Import CSV",
  "scenes.exportCsv": "Export CSV",
  "scenes.csvExported": "Exported {count} scenes to CSV.",
  "scenes.fillImages": "Fill images by name",
  "scenes.imagesFilled": "Filled {filled} scene images; skipped {skipped}.",
  "scenes.csvNeedsProject": "Open a project before importing scene CSV.",
  "scenes.csvImported": "Scene CSV: {created} created, {updated} filled, {unchanged} unchanged, {skipped} skipped.",
  "scenes.csvImportFailed": "Could not import scene CSV: {message}",
  "scenes.folders": "Folders",
  "scenes.count": "Scenes ({count})",
  "scenes.moved": "Scene moved",
  "scenes.noMatch": "No matching scenes found",
  "scenes.noScenesYet": "No scenes yet",
  "scenes.useConsole": "Use the left console to create scenes",
  "scenes.createFolder": "Create Folder",
  "scenes.folderName": "Folder name",
  "scenes.renameFolder": "Rename Folder",
  "scenes.folderCreated": "Folder created",
  "scenes.folderRenamed": "Folder renamed",
  "scenes.folderDeleted": "Folder deleted",
  "scenes.deleteFolder": "Delete Folder",
  "scenes.deleted": "Scene deleted",
  "scenes.detailEmpty": "Select a scene to view details",
  "scenes.saveSceneSettings": "Save Scene Settings",
  "scenes.sceneSettingsUpdated": "Scene settings updated",
  "scenes.readLocalFailed": "Unable to read local image",
  "scenes.exportFailed": "Export failed",
  "scenes.info": "Scene Info",
  "scenes.description": "Scene Description",
  "scenes.descriptionPlaceholder": "Enter a short description used by Director and @scene[...]...",
  "scenes.scenePrompt": "Scene Prompt",
  "scenes.scenePromptPlaceholder": "Enter the scene prompt used for AI concept image generation...",
  "scenes.finalImagePrompt": "Final Image Prompt",
  "scenes.exportConcept": "Export Concept Image",
  "scenes.deleteScene": "Delete Scene",
  "scenes.tipDrag": "Scene concept images can be dragged into the AI Director panel.",
  "scenes.tipConsistency": "Keep lighting and shading consistent within the same scene.",
  "scenes.enterName": "Enter a scene name",
  "scenes.enterLocation": "Enter a location description",
  "scenes.created": "Scene created",
  "scenes.selectOrCreate": "Select or create a scene first",
  "scenes.conceptReady": "Scene concept image generated. Review it before saving.",
  "scenes.savedLocal": "Scene concept image saved locally",
  "scenes.saveFailed": "Save failed",
  "scenes.autoCreated": 'Auto-created scene "{name}"',
  "scenes.imageAspectRatio": "Ratio",
  "scenes.saveConcept": "Save Concept Image",
  "scenes.generateConcept": "Generate Scene Concept",
  "scenes.generateAllImages": "Generate all scene images ({count})",
  "scenes.generatingAllImages": "Generating all scene images...",
  "scenes.noImagesToGenerate": "No scenes need image generation",
  "scenes.generatedImagesAll": "Generated all {count} scene images",
  "scenes.uploadedSceneImage": "Uploaded scene image",
  "scenes.imageReady": "Scene image ready",
  "scenes.imageMissing": "No scene image",
  "scenes.openDetails": "Open details",
  "scenes.generateSceneImage": "Generate scene image",
  "scenes.generateImageFailed": "Failed to generate a scene image for {name}: {message}",
  "scenes.referenceImage": "Scene reference image",
  "scenes.removedReferenceImage": "Removed the scene image. Prompt and settings were kept.",
  "scenes.removeReferenceImage": "Remove scene image, keep prompt and settings",
  "scenes.imageStyle": "Image Style",
  "scenes.previewFullImage": "Preview full image",
  "scenes.previewTitle": "Preview Scene Concept Image",
  "scenes.previewAlt": "Scene concept preview",
  "scenes.previewBadge": "Preview",
  "scenes.regenerateConcept": "Regenerate Concept Image",
  "scenes.discardBack": "Discard and Go Back",
  "scenes.console": "Generation Console",
  "scenes.name": "Scene Name",
  "scenes.namePlaceholder": "e.g. city street, forest cabin",
  "scenes.references": "Reference Images",
  "scenes.aiUsesRefs": "AI uses these images as references when generating the scene concept image",
  "scenes.collapseChildren": "Collapse views",
  "scenes.expandChildren": "Expand views",
  "scenes.syncFlowMissing": "Sync Flow · {count} missing",
  "scenes.syncFlowProgress": "Flow {synced}/{total}",
  "scenes.syncFlowOffline": "Flow offline",
  "scenes.syncingFlow": "Syncing Flow {count} accounts...",
  "scenes.syncFlowTitle": "Sync Scene library images to every ready Flow account",
  "scenes.syncFlowPartial": "Sync incomplete: uploaded {uploaded}, skipped {skipped}; {failed} accounts failed.",
  "scenes.syncFlowSuccess": "Synced {accounts} accounts: uploaded {uploaded}, skipped {skipped} existing images.",
  "scenes.syncFlowError": "Could not sync scene images."
};
const generation$1 = {
  "stylePicker.placeholder": "Select style",
  "stylePicker.myStyles": "My Styles",
  "stylePicker.category.real": "Real",
  "stylePicker.category.stopMotion": "Stop Motion",
  "stylePicker.addStyle": "Add style",
  "stylePicker.editStyle": "Edit style",
  "stylePicker.styleName": "Style name",
  "stylePicker.styleNamePlaceholder": "For example: Minimal hand-drawn",
  "stylePicker.prompt": "Style prompt",
  "stylePicker.promptPlaceholder": "Describe the visual style...",
  "stylePicker.negativePrompt": "Negative prompt (optional)",
  "stylePicker.negativePromptPlaceholder": "Elements to avoid...",
  "stylePicker.save": "Save style",
  "stylePicker.deleteTitle": "Delete style?",
  "stylePicker.deleteDescription": "The style “{name}” will be permanently deleted. This action cannot be undone.",
  "freedom.generating": "Generating...",
  "voice.mode": "Voice Mode",
  "voice.mode.off": "Off",
  "voice.mode.selective": "Selective",
  "voice.mode.ref": "Character Ref",
  "voice.mode.full": "Full Voice",
  "voice.narrator": "Narrator Voice",
  "voice.selectNarrator": "Select narrator voice",
  "voice.sceneUnassigned": "Voice: {mode} pending"
};
const media$1 = {
  "autoVideo.title": "Auto Video",
  "autoVideo.subtitle": "Render MP4 from Audio + SRT + Images",
  "autoVideo.stage.import": "Import",
  "autoVideo.stage.editor": "Editor",
  "autoVideo.stage.render": "Render",
  "autoVideo.import.audio": "Audio",
  "autoVideo.import.audioDrop": "Drop audio file (.mp3, .wav, .m4a, .flac, .ogg) or click to choose",
  "autoVideo.import.srtSource": "SRT source",
  "autoVideo.import.srtViaApi": "Whisper API",
  "autoVideo.import.srtViaImport": "Import .srt file",
  "autoVideo.import.provider": "Provider",
  "autoVideo.import.apiKey": "API Key",
  "autoVideo.import.apiKeyHint": "Get an API key at: {url}",
  "autoVideo.import.language": "Audio language",
  "autoVideo.import.languageAuto": "Auto-detect",
  "autoVideo.import.transcribe": "Start transcribing",
  "autoVideo.import.uploadSrt": "Choose .srt file",
  "autoVideo.import.csvOptional": "Image mapping CSV (optional)",
  "autoVideo.import.csvDrop": "Drop .csv with columns: index, text, image_path, voice",
  "autoVideo.import.csvLoaded": "{count} CSV rows loaded",
  "autoVideo.editor.totalDuration": "Total duration",
  "autoVideo.editor.segments": "{n} segments",
  "autoVideo.editor.missingImages": "{n} missing image(s)",
  "autoVideo.editor.autoFillFolder": "Auto-fill from folder",
  "autoVideo.editor.proceedRender": "Proceed to render →",
  "autoVideo.editor.dropImage": "Drop image here",
  "autoVideo.editor.lowConfidence": "Low match confidence",
  "autoVideo.render.title": "Rendering video",
  "autoVideo.render.openFolder": "Open folder",
  "autoVideo.render.openVideo": "View video",
  "autoVideo.render.renderAgain": "Render again",
  "autoVideo.render.failed": "Render failed",
  "autoVideo.render.copyLog": "Copy log",
  "autoVideo.mediaMode.title": "Media mode",
  "autoVideo.mediaMode.imagePath": "Image path",
  "autoVideo.mediaMode.videoPath": "Video path",
  "autoVideo.mediaMode.help": "By default, image_path is used. When video_path is selected, each row prioritizes video_path; if video is missing, it falls back to image_path.",
  "autoVideo.import.savedChanges": "Saved {count} change(s)",
  "autoVideo.import.filePathMissing": "Could not get file path",
  "autoVideo.import.desktopPathMissing": "Could not get file path (desktop app only)",
  "autoVideo.import.unsupportedFormat": "Unsupported format: .{ext}",
  "autoVideo.import.unsupportedVideoFormat": "Unsupported video format: .{ext}",
  "autoVideo.import.audioReadFailed": "Could not read audio: {message}",
  "autoVideo.import.srtInvalid": "Invalid SRT",
  "autoVideo.import.srtLoaded": "Loaded {count} sentence(s) from SRT",
  "autoVideo.import.csvInvalid": "Invalid CSV",
  "autoVideo.import.csvRowsLoaded": "Loaded {count} CSV row(s)",
  "autoVideo.import.apiKeyRequired": "Enter an API key first",
  "autoVideo.import.progressStart": "Starting...",
  "autoVideo.import.progressProbing": "Reading audio...",
  "autoVideo.import.progressChunking": "Splitting audio...",
  "autoVideo.import.progressUploading": "Uploading chunks...",
  "autoVideo.import.progressMerging": "Merging timestamps...",
  "autoVideo.import.progressDone": "Done",
  "autoVideo.import.transcribeFailed": "Transcription failed",
  "autoVideo.import.srtParseFailed": "Could not parse SRT: {message}",
  "autoVideo.import.complete": "Complete",
  "autoVideo.import.transcribeComplete": "Transcription complete: {count} sentence(s)",
  "autoVideo.import.cancelled": "Cancelled",
  "autoVideo.import.cancel": "Cancel",
  "autoVideo.import.srtReady": "SRT contains {count} sentence(s)",
  "autoVideo.import.downloadCsv": "Download CSV",
  "autoVideo.import.unsavedChanges": "{count} unsaved change(s)",
  "autoVideo.import.discard": "Discard",
  "autoVideo.import.save": "Save",
  "autoVideo.import.voice": "Voice",
  "autoVideo.import.image": "Image",
  "autoVideo.import.video": "Video",
  "autoVideo.import.clearImage": "Clear image",
  "autoVideo.import.clearVideo": "Clear video",
  "autoVideo.import.chooseImage": "+ choose image",
  "autoVideo.import.chooseVideo": "+ choose video",
  "autoVideo.import.videoFallbackHint": "Missing video_path, will fall back to image_path",
  "autoVideo.import.fallbackImage": "fallback image",
  "autoVideo.editor.videoCount": "Video: {count}",
  "autoVideo.editor.fallbackImages": "Fallback images: {count}",
  "autoVideo.editor.lowConfidenceCount": "{count} low-confidence sentence(s)",
  "autoVideo.editor.noSegments": "No sentences yet. Go back to Import.",
  "autoVideo.editor.noVideosInFolder": "No videos found in folder",
  "autoVideo.editor.noImagesInFolder": "No images found in folder",
  "autoVideo.editor.filledVideos": "Filled {count} video(s) into sentences missing video",
  "autoVideo.editor.filledImages": "Filled {count} image(s) into missing sentences",
  "autoVideo.editor.autoFillVideoFolder": "Auto-fill video folder",
  "autoVideo.editor.back": "Back",
  "autoVideo.editor.effects": "Effects",
  "autoVideo.editor.randomEffectsDone": "Randomized {count} effect(s)",
  "autoVideo.editor.transitions": "Transitions",
  "autoVideo.editor.applyAll": "All",
  "autoVideo.editor.applyRandomCount": "Random count",
  "autoVideo.editor.applyRandom": "Random",
  "autoVideo.editor.randomTransitionsDone": "Randomized {count} transition(s)",
  "autoVideo.editor.clearEffects": "Clear effects",
  "autoVideo.editor.clearTransitions": "Clear transitions",
  "autoVideo.editor.sfx": "SFX",
  "autoVideo.editor.chooseSfxFolder": "Choose SFX folder",
  "autoVideo.editor.noSfxInFolder": "No SFX found in folder",
  "autoVideo.editor.noSfxSelected": "No SFX folder selected",
  "autoVideo.editor.loadedSfx": "Loaded {count} SFX file(s)",
  "autoVideo.editor.sfxLoaded": "{count} SFX",
  "autoVideo.editor.randomSfxDone": "Randomized {count} SFX",
  "autoVideo.editor.clearSfx": "Clear SFX",
  "autoVideo.editor.effect": "Effect",
  "autoVideo.editor.transitionNext": "Transition next",
  "autoVideo.editor.effectNone": "none",
  "autoVideo.editor.effectZoomIn": "zoom in",
  "autoVideo.editor.effectZoomOut": "zoom out",
  "autoVideo.editor.effectPanLeft": "pan left",
  "autoVideo.editor.effectPanRight": "pan right",
  "autoVideo.editor.effectPanUp": "pan up",
  "autoVideo.editor.effectPanDown": "pan down",
  "autoVideo.editor.effectZoomPanLeft": "zoom + pan left",
  "autoVideo.editor.effectZoomPanRight": "zoom + pan right",
  "autoVideo.editor.transitionFade": "fade",
  "autoVideo.editor.transitionFadeSlow": "slow fade",
  "autoVideo.editor.transitionDipWhite": "dip white",
  "autoVideo.editor.transitionFlashWhite": "flash white",
  "autoVideo.editor.dropVideo": "Drop video here",
  "autoVideo.render.segmentProgress": "Segment {index}/{total}",
  "autoVideo.render.segmentDone": "Done {index}/{total}",
  "autoVideo.render.unresolvedImage": "Could not resolve {count} local-image image(s) to real files.",
  "autoVideo.render.unresolvedVideo": "Could not resolve {count} local-image video(s) to real files.",
  "autoVideo.render.resolveMediaFailed": "Could not resolve media for rendering",
  "autoVideo.render.starting": "Starting...",
  "autoVideo.render.failedFallback": "Render failed",
  "autoVideo.render.done": "Render complete",
  "autoVideo.render.cancelled": "Cancelled",
  "autoVideo.render.statSentences": "Sentences",
  "autoVideo.render.statDuration": "Total duration",
  "autoVideo.render.statMissingMedia": "Missing media",
  "autoVideo.render.statMissingImages": "Sentences missing images",
  "autoVideo.render.diagnostics": "Render diagnostics",
  "autoVideo.render.diagnosticsSummary": "Mode: {mode}. Images: {images}/{total}. Videos: {videos}/{total}. Fallback images: {fallback}. Missing media: {missing}.",
  "autoVideo.render.noImagePath": "No imagePath found in segments; render will use a black background.",
  "autoVideo.render.settings": "Render settings",
  "autoVideo.render.resolution": "Resolution",
  "autoVideo.render.gpuRequired": "Requires NVIDIA GPU",
  "autoVideo.render.qualityHigh": "18 (high quality)",
  "autoVideo.render.fileSmall": "28 (small file)",
  "autoVideo.render.cancelRender": "Cancel render",
  "autoVideo.render.startRender": "Start render",
  "autoVideo.render.copySuccess": "Copied log",
  "autoVideo.render.logTitle": "Render log",
  "autoVideo.render.copy": "Copy",
  "autoVideo.render.emptyLog": "No log yet. Click Start render to write debug information.",
  "autoVideo.render.overlayTitle": "Overlays",
  "autoVideo.render.burnSubtitles": "Burn subtitles into video",
  "autoVideo.render.subtitleFontSize": "Subtitle font size",
  "autoVideo.render.subtitleFontAuto": "Auto",
  "autoVideo.render.bgm": "Background music",
  "autoVideo.render.bgmChoose": "Choose music",
  "autoVideo.render.bgmLoaded": "Background music selected",
  "autoVideo.render.bgmPathMissing": "Pick a file from disk so its path can be used",
  "autoVideo.render.bgmVolume": "Music volume",
  "autoVideo.render.bgmDuck": "Lower music while voice plays",
  "autoVideo.ttsGen.title": "Generate voice-over (TTS)",
  "autoVideo.ttsGen.help": "Generate audio from the narration in the CSV (voice column) or from typed text.",
  "autoVideo.ttsGen.engine": "Engine",
  "autoVideo.ttsGen.omnivoice": "OmniVoice",
  "autoVideo.ttsGen.capcut": "CapCut",
  "autoVideo.ttsGen.gemini": "Gemini",
  "autoVideo.ttsGen.voice": "Voice",
  "autoVideo.ttsGen.language": "Language",
  "autoVideo.ttsGen.source": "Text source",
  "autoVideo.ttsGen.fromCsv": "From CSV ({count} lines)",
  "autoVideo.ttsGen.customText": "Type manually",
  "autoVideo.ttsGen.textPlaceholder": "Paste the text to read here, one line = one sentence...",
  "autoVideo.ttsGen.csvSummary": "Using {count} narration lines from the CSV.",
  "autoVideo.ttsGen.csvEmpty": "No narration in the CSV yet.",
  "autoVideo.ttsGen.noText": "No text to read.",
  "autoVideo.ttsGen.starting": "Starting...",
  "autoVideo.ttsGen.generate": "Generate voice-over",
  "autoVideo.ttsGen.done": "Audio generated ({seconds}s)",
  "autoVideo.ttsGen.failed": "Voice generation failed: {message}",
  "autoVideo.ttsGen.failedGeneric": "Could not generate voice-over",
  "autoVideo.ttsGen.audioReady": "Audio ready",
  "autoVideo.ttsGen.omnivoiceNote": "OmniVoice auto-clones the voice from a reference audio (if any) or creates a new voice from a description.",
  "assets.deleteFolder": "Delete Folder",
  "autopilot.panel.server": "AutoPilot HTTP",
  "autopilot.panel.running": "running at 127.0.0.1:{port}",
  "autopilot.panel.stopped": "not running",
  "autopilot.panel.flow": "Google Flow",
  "autopilot.panel.flowReady": "{count} ready accounts",
  "autopilot.panel.flowOff": "off",
  "autopilot.panel.bound": "Flow project",
  "autopilot.panel.boundOk": "bound {count}",
  "autopilot.panel.boundMissing": "not bound (Settings → Google Flow)",
  "autopilot.panel.refresh": "Refresh",
  "autopilot.panel.newJob": "New job",
  "autopilot.panel.advanced": "Advanced",
  "autopilot.panel.hideAdvanced": "Hide advanced",
  "autopilot.panel.createStepByStep": "Create step by step",
  "autopilot.panel.createAll": "Create all",
  "autopilot.panel.fromTopic": "From topic",
  "autopilot.panel.fromScript": "From script",
  "autopilot.panel.topicPlaceholder": "e.g. The history of Hanoi through 1000 years, urban planning, street food...",
  "autopilot.panel.scriptPlaceholder": "Paste an existing script here (each scene with narration)...",
  "autopilot.panel.style": "Style",
  "autopilot.panel.stylePlaceholder": "e.g. BBC documentary style, deep male voice, slow pace...",
  "autopilot.panel.skill": "Creative skill",
  "autopilot.panel.visualStyleHelp": "This style is frozen when the job starts and applied to character references, shot frames, and frames using researched images. Choose None / Skill Defined to let the skill control the style.",
  "autopilot.panel.customSkill": "Custom skill",
  "autopilot.panel.customSkillHint": "Paste your complete workflow and prompt instructions.",
  "autopilot.panel.skillPlaceholder": "Enter instructions controlling beats, image prompts, and motion prompts...",
  "autopilot.panel.maxShots": "Max shots",
  "autopilot.panel.maxShotsHint": "0 = derive automatically from narration; safety cap only.",
  "autopilot.panel.longFormThreshold": "Split long video from (min)",
  "autopilot.panel.longFormThresholdHint": "Below this uses the normal pipeline; default is 8 minutes.",
  "autopilot.panel.aspectRatio": "Aspect ratio",
  "autopilot.panel.voice": "Voice provider",
  "autopilot.panel.language": "Language",
  "autopilot.panel.voiceSelect": "Voice",
  "autopilot.panel.voiceProfile": "Cloned voice",
  "autopilot.panel.omniNoProfile": "Auto (no clone)",
  "autopilot.panel.noVoiceProfiles": "No cloned voices — create them in the TTS tab.",
  "autopilot.panel.resolution": "Resolution",
  "autopilot.panel.bgmPlaceholder": "Background music file path (optional)",
  "autopilot.panel.start": "Run AutoPilot",
  "autopilot.panel.jobs": "Jobs",
  "autopilot.panel.noJobs": "No jobs yet.",
  "autopilot.panel.noInput": "Enter a topic, script, or choose a narration audio file before running.",
  "autopilot.panel.voiceSource": "Narration source",
  "autopilot.panel.createTts": "Generate with TTS",
  "autopilot.panel.importAudio": "Import narration audio",
  "autopilot.panel.audioPlaceholder": "Choose MP3, WAV, M4A, AAC, FLAC, or OGG",
  "autopilot.panel.chooseAudio": "Choose file",
  "autopilot.panel.audioRequired": "Choose a narration audio file before running.",
  "autopilot.panel.audioIsScriptHint": "The narration transcript becomes the primary script and locks all timing; AutoPilot skips TTS generation. Without an SRT, Whisper must be configured.",
  "autopilot.panel.chooseSrt": "Choose SRT",
  "autopilot.panel.srtPlaceholder": "No SRT yet — falls back to Whisper",
  "autopilot.panel.srtLoaded": "Loaded {count} subtitle cues from SRT",
  "autopilot.panel.srtInvalid": "Invalid SRT or no cues found",
  "autopilot.panel.clearSrt": "Clear SRT",
  "autopilot.panel.srtHint": "With an SRT, its timing and script are used directly, Whisper is skipped, and the visuals match the narration exactly.",
  "autopilot.panel.addSubtitles": "Add subtitles to video",
  "autopilot.panel.jobCreated": "Job created {id}",
  "autopilot.panel.createFailed": "Could not create job",
  "autopilot.panel.subtitlesHint": "(draws subtitle text onto the video, timed to the narration)",
  "autopilot.panel.characterReferences": "Character references",
  "autopilot.panel.sceneReferences": "Scene references",
  "autopilot.panel.shotMedia": "Shot images and videos",
  "autopilot.panel.imageReady": "Image ready",
  "autopilot.panel.videoReady": "Video ready",
  "autopilot.panel.saveMp4": "Save MP4",
  "autopilot.panel.videoSaved": "MP4 video saved",
  "autopilot.panel.videoSaveFailed": "Could not save video",
  "autopilot.panel.savedInLibrary": "Images are in Media > AI Images; shot videos and final output are in Media > AI Videos.",
  "autopilot.card.regenBlocked": "Can't regenerate right now (job is running). Pause the job first.",
  "autopilot.card.generating": "Generating",
  "autopilot.card.failed": "Failed",
  "autopilot.card.hasVideo": "Has video",
  "autopilot.card.renderingVideo": "Rendering",
  "autopilot.card.videoFailed": "Video failed",
  "autopilot.panel.copyPath": "Copy path",
  "autopilot.panel.openOutput": "Open output file",
  "autopilot.panel.assets": "Job assets",
  "autopilot.panel.clickToPreview": "Click to preview",
  "autopilot.panel.previewImage": "View image",
  "autopilot.panel.previewVideo": "View video",
  "autopilot.panel.researchedImages": "Inserted researched images",
  "autopilot.panel.openSource": "Source",
  "autopilot.panel.pause": "Pause",
  "autopilot.panel.resume": "Resume from checkpoint",
  "autopilot.panel.searchingResearch": "Finding research",
  "autopilot.panel.generatingImage": "Generating image",
  "autopilot.panel.generatingVideo": "Generating video",
  "autopilot.panel.imageFailed": "Image failed",
  "autopilot.panel.videoFailed": "Video failed",
  "autopilot.panel.waiting": "Waiting",
  "media.library": "Media Library",
  "media.dropFiles": "Drop files here",
  "media.orUpload": "or click the upload button",
  "media.categories": "Media Categories",
  "media.system.aiImage": "AI Images",
  "media.system.aiVideo": "AI Videos",
  "media.system.upload": "Uploads",
  "media.customFolders": "Custom Folders",
  "media.folderSummary": "{folders} folders, {files} files",
  "media.sort.name": "Name",
  "media.sort.type": "Type",
  "media.sort.duration": "Duration",
  "media.view.list": "List View",
  "media.view.grid": "Grid View",
  "media.root": "Root",
  "media.upload": "Upload",
  "media.content": "Content",
  "media.folderName": "Folder name",
  "media.rename": "Rename",
  "media.smartSplit": "Smart Split",
  "media.generateScenes": "Generate Shots",
  "media.export": "Export",
  "media.aiGenerated": "AI Generated",
  "media.newName": "New name",
  "export.stageTitle": "Output & Export",
  "export.stageSubtitle": "Media Export",
  "export.status": "Status: {value}",
  "export.statusReady": "READY",
  "export.statusInProgress": "IN PROGRESS",
  "export.masterSequence": "Master Sequence",
  "export.shotsLabel": "Shots",
  "export.splitScenes": "Split Scenes",
  "export.director": "Director",
  "export.chooseImages": "Choose media to export",
  "export.chooseImagesDesc": "Select a source and items. Director videos are exported with their shots.",
  "export.sourceDirector": "Director",
  "export.sourceCharacters": "Characters",
  "export.sourceScenes": "Scenes",
  "export.sourceAutopilot": "AutoPilot",
  "export.sourceMedia": "Media Library",
  "export.source.director": "Director",
  "export.source.character": "Character",
  "export.source.scene": "Scene",
  "export.source.autopilot": "AutoPilot",
  "export.source.media": "Media Library",
  "export.readyImages": "{ready}/{total} items ready",
  "export.selectAllImages": "Select all",
  "export.clearImages": "Clear",
  "export.selectedMedia": "{items} items selected · {images} images · {videos} videos",
  "export.noImage": "No image",
  "export.videoOnly": "Video ready",
  "export.videoIncluded": "Video included",
  "export.noSourceSelected": "Choose at least one image source.",
  "export.estDuration": "Est. Duration",
  "export.target": "Target",
  "export.renderStatus": "Render Status",
  "export.untitledProject": "Untitled Project",
  "export.sceneStatus": "Scene {index}{suffix}",
  "export.shotStatus": "Shot {index}",
  "export.sceneTitle": "Scene {index}: {name}",
  "export.shotTitle": "Shot {index}: {name}",
  "export.videoBadge": " [video]",
  "export.imageBadge": " [image]",
  "export.imagesCount": "Images: {ready}/{total}",
  "export.videosCount": "Videos: {ready}/{total}",
  "export.sequenceMap": "Sequence Map",
  "export.noShots": "No Shots Available",
  "export.downloadIndividually": "Download Selected Media",
  "export.preparingExport": "Preparing export...",
  "export.preparingDownload": "Preparing download...",
  "export.done": "Export complete",
  "export.downloadDone": "Download complete",
  "export.failed": "Export failed: {message}",
  "export.downloadFailed": "Download failed: {message}",
  "export.exporting": "Exporting...",
  "export.selectFolder": "Choose Folder to Export",
  "autopilot.panel.noSkill": "No skill",
  "autopilot.panel.noSkillHint": "Choose a saved skill or create a new one.",
  "autopilot.panel.newSkill": "New skill",
  "autopilot.panel.editSavedSkill": "Saved skill — open it to edit its content.",
  "autopilot.panel.skillNamePlaceholder": "Skill name",
  "autopilot.panel.saveSkill": "Save skill",
  "autopilot.panel.updateSkill": "Update",
  "autopilot.panel.deleteSkill": "Delete skill",
  "autopilot.panel.untitledSkill": "Untitled skill",
  "autopilot.panel.skillSaved": "Saved skill {name}",
  "autopilot.panel.skillUpdated": "Updated skill {name}",
  "autopilot.panel.skillDeleted": "Skill deleted",
  "autopilot.panel.deleteSkillConfirm": "Delete skill {name}?"
};
const features$1 = {
  "appHome.researchMonitor.title": "Research – Monitoring",
  "appHome.researchMonitor.description": "Collect, organize, and monitor research in a dedicated workspace.",
  "appHome.ttsVoice.title": "TTS – Voice Generation",
  "appHome.ttsVoice.description": "Turn text into speech and manage voice-generation workflows in a dedicated workspace.",
  "appHome.autoEdit.title": "Auto Edit",
  "appHome.autoEdit.description": "Automatically edit video, organize media, and complete production workflows in a dedicated workspace.",
  "appHome.planRequiredTitle": "Plan upgrade required",
  "appHome.planRequiredDescription": "{feature} requires the {plan} plan. Upgrade your account to use this feature.",
  "appHome.planRequiredClose": "Got it",
  "featurePlaceholder.badge": "New feature",
  "featurePlaceholder.ready": "The feature workspace is ready",
  "featurePlaceholder.note": "Detailed tools and workflows will be added in the next step.",
  "featurePlaceholder.previewOnly": "Preview only",
  "featurePlaceholder.unlimitedRequired": "Pro accounts can preview this workspace, but an Unlimited plan is required to use it.",
  "appHome.backToHome": "Back to home"
};
const account$1 = {
  "account.title": "Account",
  "account.description": "Account and license information for this device.",
  "account.changeAvatar": "Change picture",
  "account.removeAvatar": "Remove picture",
  "account.localAvatarHint": "This picture is stored locally on this device only.",
  "account.name": "Name",
  "account.plan": "Plan",
  "account.expiresAt": "Expires at",
  "account.machineId": "Machine ID",
  "account.lastCheckedAt": "Last verified",
  "account.notAvailable": "Not available",
  "account.noExpiration": "No expiration",
  "account.avatarUpdated": "Profile picture updated",
  "account.avatarRemoved": "Profile picture removed",
  "account.invalidImage": "This image file could not be read"
};
const tts$1 = {
  "tts.title": "TTS Studio",
  "tts.subtitle": "OmniVoice • Voice cloning and design",
  "tts.subtitle.capcut": "CapCut Online • Preset voices",
  "tts.subtitle.gemini": "Gemini Pro • Online AI voices",
  "tts.subtitle.vieneu": "VieNeu v3 Turbo • Offline 48 kHz Vietnamese speech",
  "tts.modelManager": "Settings",
  "tts.status.ready": "Installed",
  "tts.status.downloading": "Downloading",
  "tts.status.error": "Error",
  "tts.status.notInstalled": "Not installed",
  "tts.text.title": "Text to speech",
  "tts.text.savedWithoutModel": "Your text is saved even when no model is installed.",
  "tts.text.characters": "{count} characters",
  "tts.text.placeholder": "Enter or paste the text you want to turn into speech...",
  "tts.action.cancel": "Cancel",
  "tts.action.generate": "Generate speech",
  "tts.action.downloadToGenerate": "Download model to generate",
  "tts.history.title": "Recent audio",
  "tts.history.empty": "No audio has been generated yet.",
  "tts.history.remove": "Remove from history",
  "tts.history.deleteTitle": "Delete this audio?",
  "tts.history.deleteDescription": "“{name}” will be removed from the audio history.",
  "tts.history.confirmDelete": "Delete audio",
  "tts.history.openFolder": "Open folder",
  "tts.history.exportWav": "Export WAV",
  "tts.history.play": "Play audio",
  "tts.history.pause": "Pause audio",
  "tts.history.seek": "Audio timeline",
  "tts.history.mute": "Mute",
  "tts.history.unmute": "Unmute",
  "tts.history.rename": "Rename audio",
  "tts.history.saveName": "Save name",
  "tts.history.voice": "Voice: {voice}",
  "tts.history.model": "Model: {model}",
  "tts.history.search": "Search",
  "tts.history.searchPlaceholder": "Name, content, voice, or model...",
  "tts.history.sort": "Sort",
  "tts.history.newest": "Newest first",
  "tts.history.oldest": "Oldest first",
  "tts.history.resetFilters": "Reset filters",
  "tts.history.noResults": "No matching audio found.",
  "tts.history.resultCount": "Showing {visible}/{total}",
  "tts.native.selectReferenceAudio": "Select reference audio",
  "tts.native.exportAudio": "Export audio",
  "tts.settings.model": "Model",
  "tts.settings.cloneMode": "Voice clone",
  "tts.settings.voiceMode": "Voice mode",
  "tts.settings.designPrompt": "Describe the desired voice",
  "tts.settings.designPlaceholder": "Example: young female, low pitch, soft and warm delivery",
  "tts.settings.designVietnameseWarning": "Voice Design is optimized mainly for English and Chinese; Vietnamese results may be unstable.",
  "tts.settings.autoDescription": "OmniVoice will choose a voice suited to the text. No reference audio is required.",
  "tts.settings.language": "Language",
  "tts.settings.speed": "Speaking speed",
  "tts.settings.quality": "Quality",
  "tts.splitMode.title": "Reading mode",
  "tts.splitMode.default": "Default (read whole text)",
  "tts.splitMode.line": "Split by lines",
  "tts.splitMode.sentence": "Split by sentences",
  "tts.splitMode.hint": "Default reads the whole text at once. Line/sentence modes read each part, then join them into a single audio.",
  "tts.splitMode.linePreviewTitle": "Line breakdown",
  "tts.splitMode.sentencePreviewTitle": "Sentence breakdown",
  "tts.splitMode.previewCount": "Will read {count} parts",
  "tts.splitMode.previewEmpty": "Type text to preview how it will be split.",
  "tts.mode.clone": "Clone",
  "tts.mode.design": "Design",
  "tts.mode.auto": "Auto",
  "tts.mode.preset": "Preset voice",
  "tts.language.vi": "Vietnamese (vi)",
  "tts.language.en": "English (en)",
  "tts.language.auto": "Auto detect",
  "tts.language.supportedCount": "OmniVoice supports 646 languages.",
  "tts.language.add": "Add language",
  "tts.languagePicker.title": "Add a speech language",
  "tts.languagePicker.description": "Search the {count} languages supported by OmniVoice. Added languages are saved for next time.",
  "tts.languagePicker.searchPlaceholder": "Enter a name or code, for example: French, fr, fra...",
  "tts.languagePicker.saved": "Saved languages",
  "tts.languagePicker.remove": "Remove {language} from the list",
  "tts.languagePicker.modelCode": "OmniVoice code",
  "tts.languagePicker.empty": "No matching language found.",
  "tts.quality.fast": "Fast • 16 steps",
  "tts.quality.balanced": "Balanced • 24 steps",
  "tts.quality.high": "High quality • 32 steps",
  "tts.quality.preview": "Quick preview • 8 steps",
  "tts.quality.draft": "Draft • 12 steps",
  "tts.advanced.title": "Advanced tuning",
  "tts.advanced.expand": "Expand advanced tuning",
  "tts.advanced.collapse": "Collapse advanced tuning",
  "tts.advanced.enabledHint": "Custom settings will be used for the next generation.",
  "tts.advanced.disabledHint": "Enable to fine-tune OmniVoice; safe app defaults are used while off.",
  "tts.advanced.performance": "Performance and memory",
  "tts.advanced.reset": "Defaults",
  "tts.advanced.chunkDuration": "Chunk length (seconds)",
  "tts.advanced.chunkDurationHint": "Smaller chunks reduce peak VRAM usage.",
  "tts.advanced.chunkThreshold": "Chunk threshold (seconds)",
  "tts.advanced.chunkThresholdHint": "Split only when estimated audio exceeds this value.",
  "tts.advanced.lowVramHint": "For a 4 GB GPU, try 8–10 second chunks, a 15–20 second threshold, and 12–16 steps.",
  "tts.advanced.voiceBehavior": "Voice generation",
  "tts.advanced.guidanceScale": "Guidance scale",
  "tts.advanced.guidanceScaleHint": "How strongly generation follows voice conditions; default 2.",
  "tts.advanced.tShift": "T-shift",
  "tts.advanced.tShiftHint": "Adjusts the denoising schedule; default 0.1.",
  "tts.advanced.positionTemperature": "Position temperature",
  "tts.advanced.positionTemperatureHint": "Position randomness; 0 is the most deterministic.",
  "tts.advanced.classTemperature": "Class temperature",
  "tts.advanced.classTemperatureHint": "Token-selection randomness; default 0.",
  "tts.advanced.layerPenalty": "Layer penalty",
  "tts.advanced.layerPenaltyHint": "Affects layer decoding order; default 5.",
  "tts.advanced.denoise": "Denoise",
  "tts.advanced.denoiseHint": "Prioritize cleaner speech when using a reference.",
  "tts.advanced.output": "Input and output processing",
  "tts.advanced.preprocess": "Preprocess reference",
  "tts.advanced.preprocessHint": "Clean silence and reference transcript.",
  "tts.advanced.postprocess": "Postprocess audio",
  "tts.advanced.postprocessHint": "Remove excessively long silence from the output.",
  "tts.advanced.padDuration": "Edge padding (seconds)",
  "tts.advanced.padDurationHint": "Extra silence at the start and end.",
  "tts.advanced.fadeDuration": "Edge fade (seconds)",
  "tts.advanced.fadeDurationHint": "Smooth the beginning and end of the audio.",
  "tts.profile.title": "Voice profile",
  "tts.profile.create": "Create profile",
  "tts.profile.select": "Select a voice profile",
  "tts.profile.empty": "No compatible voice profile",
  "tts.profile.emptyHint": "Add reference audio and its transcript to clone a voice.",
  "tts.profile.remove": "Delete profile",
  "tts.profile.dialogTitle": "Create voice profile",
  "tts.profile.compatibility": "This profile is linked to {model}; other models may not be compatible.",
  "tts.profile.name": "Profile name",
  "tts.profile.namePlaceholder": "Example: Narrator 01",
  "tts.profile.referenceAudio": "Reference audio",
  "tts.profile.audioPlaceholder": "Select WAV, MP3, M4A, FLAC...",
  "tts.profile.choose": "Choose",
  "tts.profile.transcript": "Exact audio transcript",
  "tts.profile.transcriptOptional": "Transcript (optional for VieNeu)",
  "tts.profile.transcriptPlaceholder": "Enter exactly what is spoken in the reference audio...",
  "tts.profile.save": "Save profile",
  "tts.manager.title": "Settings",
  "tts.manager.chooseEngine": "Choose a speech engine. OmniVoice remains the default local option.",
  "tts.manager.ready": "Ready",
  "tts.manager.accelerator": "Accelerator",
  "tts.manager.downloadSize": "Estimated size",
  "tts.manager.installKeepOpen": "You can close this window; installation continues and progress remains visible on the main screen.",
  "tts.manager.remove": "Remove model",
  "tts.manager.download": "Download model",
  "tts.manager.repairRuntime": "Repair runtime",
  "tts.manager.later": "Later",
  "tts.missing.title": "Model is not installed",
  "tts.missing.description": "You can continue editing text and voice settings. Download the model when you are ready to generate audio.",
  "tts.missing.size": "About {size} GB; the Python runtime is installed only once.",
  "tts.runtime.desktopOnly": "Local models are available only in the Electron desktop app.",
  "tts.runtime.vieneuPythonRequired": "VieNeu requires Python 3.10–3.13 installed on this computer.",
  "tts.progress.starting": "Preparing...",
  "tts.progress.pythonDownload": "Downloading Python runtime...",
  "tts.progress.pythonInstall": "Installing Python runtime...",
  "tts.progress.pythonMigrate": "Preparing the base Python from the previous runtime...",
  "tts.progress.venv": "Creating an isolated Python environment...",
  "tts.progress.pip": "Updating the runtime installer...",
  "tts.progress.dependencies": "Installing the OmniVoice runtime...",
  "tts.progress.accelerator": "Installing GPU acceleration...",
  "tts.progress.modelDownload": "Downloading the model from Hugging Face...",
  "tts.progress.loading": "Loading the model...",
  "tts.progress.voicePrompt": "Preparing the voice profile...",
  "tts.progress.generating": "Generating speech...",
  "tts.progress.lineGenerating": "Reading line by line...",
  "tts.progress.sentenceGenerating": "Reading sentence by sentence...",
  "tts.progress.chunking": "Splitting the script...",
  "tts.progress.merging": "Merging audio segments...",
  "tts.progress.saving": "Saving WAV...",
  "tts.progress.done": "Model is ready",
  "tts.progress.default": "Processing...",
  "tts.toast.statusFailed": "Could not read model status",
  "tts.toast.restartRequired": "Electron main is still using the old Qwen runtime. Quit the app completely, then run npm.cmd run dev:electron again.",
  "tts.toast.jobBusy": "Wait for or cancel the active job first",
  "tts.toast.desktopDownload": "Run the Electron desktop app to download models",
  "tts.toast.preparing": "Preparing...",
  "tts.toast.modelReady": "{model} is ready",
  "tts.toast.downloadFailed": "Could not download model",
  "tts.confirm.removeModel": "Remove {model}? Generated audio files will be kept.",
  "tts.toast.modelRemoved": "Model removed",
  "tts.toast.removeFailed": "Could not remove model",
  "tts.toast.cancelRequested": "Cancellation requested",
  "tts.toast.profileRequiredFields": "Enter a name, reference audio, and transcript",
  "tts.toast.profileSaved": "Voice profile saved",
  "tts.toast.textRequired": "Enter the text to read",
  "tts.toast.profileRequired": "Select or create a voice profile",
  "tts.toast.instructionRequired": "Describe the voice you want to design",
  "tts.toast.desktopOnly": "Local TTS is available only in the Electron desktop app",
  "tts.toast.generateFailed": "Could not generate speech",
  "tts.toast.audioCreated": "Audio generated",
  "tts.model.omnivoice": "Local multilingual speech generation, voice cloning, and voice design.",
  "tts.model.vieneu": "Offline 48 kHz Vietnamese–English speech with VieNeu v3 Turbo CPU/ONNX.",
  "tts.engine.vieneu": "Local VieNeu optimized for Vietnamese preset voices and voice cloning.",
  "tts.vieneu.voice": "VieNeu voice",
  "tts.vieneu.style": "Reading style",
  "tts.vieneu.styleNatural": "Natural",
  "tts.vieneu.styleNews": "News",
  "tts.vieneu.styleStory": "Storytelling",
  "tts.vieneu.cloneHint": "Create a profile from a 3–8 second voice sample. Voice cloning requires a VieNeu-supported backend on this device.",
  "tts.engine.omnivoice": "Local OmniVoice with support for more than 600 languages.",
  "tts.model.capcut": "Online preset voices without downloading a model or using a GPU.",
  "tts.engine.capcut": "Preset CapCut voices through an Internet connection.",
  "tts.model.gemini31": "Gemini 3.1 Flash TTS with steerable style and expression.",
  "tts.model.gemini25": "Gemini 2.5 Flash TTS optimized for speed and cost.",
  "tts.engine.gemini": "Online Gemini TTS with preset voices and style control.",
  "tts.engine.local": "Local",
  "tts.engine.online": "Online",
  "tts.capcut.onlineLabel": "Online • Preset voices",
  "tts.capcut.managerDescription": "No model download or GPU is required. This engine calls CapCut over the Internet.",
  "tts.capcut.voice": "Voice",
  "tts.capcut.voices": "voices",
  "tts.capcut.searchVoice": "Search by voice name or code...",
  "tts.capcut.selectVoice": "Select a CapCut voice",
  "tts.capcut.preview": "Preview",
  "tts.capcut.previewing": "Generating voice preview...",
  "tts.capcut.voiceRequired": "Select a CapCut voice",
  "tts.capcut.longTextHint": "Long scripts are split by sentence, generated sequentially, and merged into one WAV file.",
  "tts.gemini.onlineLabel": "Online • 30 AI voices",
  "tts.gemini.managerDescription": "Enter one or more Gemini API keys, one per line. Keys are encrypted and stored only on this device.",
  "tts.gemini.saveKeys": "Save API keys",
  "tts.gemini.addKey": "Add API key",
  "tts.gemini.removeKey": "Remove this API key",
  "tts.gemini.noKey": "No API key has been saved.",
  "tts.gemini.notConfigured": "Not configured",
  "tts.gemini.keyCount": "{count} API keys saved.",
  "tts.gemini.keysSaved": "Securely saved {count} API keys.",
  "tts.gemini.keysSaveFailed": "Could not save API keys.",
  "tts.gemini.voice": "Voice",
  "tts.gemini.voices": "voices",
  "tts.gemini.female": "Female",
  "tts.gemini.male": "Male",
  "tts.gemini.preview": "Preview",
  "tts.gemini.previewing": "Generating a Gemini voice preview...",
  "tts.gemini.voiceRequired": "Select a Gemini voice",
  "tts.gemini.style": "Speaking style instructions",
  "tts.gemini.stylePlaceholder": "Example: Read naturally and warmly at a moderate pace, gently emphasizing key words.",
  "tts.gemini.temperature": "Temperature",
  "tts.gemini.temperatureHint": "Lower: more consistent · Higher: more expressive delivery.",
  "tts.gemini.showTags": "Show expression tags",
  "tts.gemini.hideTags": "Hide expression tags",
  "tts.gemini.longTextHint": "Long scripts are split by sentence, generated sequentially, and merged into one WAV. Multiple API keys only rotate quotas when they belong to different Google projects.",
  "tts.subtitle.vbee": "Vbee API • Online Vietnamese voices",
  "tts.model.vbee": "Generate online speech with an official Vbee App ID and Token.",
  "tts.engine.vbee": "Online Vbee voices using the voice codes available to the account.",
  "tts.vbee.onlineLabel": "Online • Official API",
  "tts.vbee.managerDescription": "Enter the App ID and Token issued by Vbee. Credentials are encrypted and stored only on this device.",
  "tts.vbee.notConfigured": "Not configured",
  "tts.vbee.configured": "Vbee App ID and Token are saved.",
  "tts.vbee.credentialsSaved": "Vbee credentials saved securely.",
  "tts.vbee.credentialsSaveFailed": "Could not save Vbee credentials.",
  "tts.vbee.saveCredentials": "Save credentials",
  "tts.vbee.tokenExpires": "Token expires: {date}",
  "tts.vbee.voiceCode": "Vbee voice code",
  "tts.vbee.voiceCodeHint": "Copy a voice code from the Vbee Voice Library. Available voices can differ by account.",
  "tts.vbee.voiceRequired": "Enter a Vbee voice code",
  "tts.vbee.preview": "Preview",
  "tts.vbee.previewing": "Generating a Vbee preview...",
  "tts.vbee.audioType": "Format",
  "tts.vbee.bitrate": "Quality",
  "tts.vbee.longTextHint": "The app calls Vbee directly, tracks progress, and downloads audio locally; Supabase is not used.",
  "tts.vbee.voice": "Voice",
  "tts.vbee.voices": "voices",
  "tts.vbee.searchVoice": "Search by name, language, or gender...",
  "tts.vbee.loadingVoices": "Loading voices...",
  "tts.vbee.selectVoice": "Select a Vbee voice",
  "tts.vbee.refreshVoices": "Update voice list from Vbee",
  "tts.vbee.voicesLoadFailed": "Could not load Vbee voices.",
  "tts.vbee.officialVoice": "Official Vbee voice",
  "tts.vbee.communityVoice": "Community voice",
  "tts.vbee.personalVoice": "Personal voice",
  "tts.vbee.credits": "credits/character",
  "tts.progress.vbeeSubmitting": "Sending to Vbee...",
  "tts.progress.vbeeProcessing": "Vbee is generating speech...",
  "tts.progress.vbeeDownloading": "Downloading Vbee audio...",
  "tts.progress.vbeeDone": "Vbee audio is complete"
};
const research$1 = {
  "research.sidebar.discover": "Discover",
  "research.sidebar.discoverTip": "Discover outliers — find winning videos and ideas",
  "research.sidebar.monitor": "Monitor",
  "research.sidebar.monitorTip": "Monitor channels — track competitor health over 48 hours",
  "research.sidebar.comments": "Comments",
  "research.sidebar.commentsTip": "Analyze and export comments from a video or channel",
  "research.sidebar.tools": "Tools",
  "research.sidebar.toolsTip": "Download YouTube video, audio, subtitles, and images",
  "research.sidebar.settings": "Settings",
  "research.sidebar.settingsTip": "Configure the YouTube Data API",
  "research.header.discoverTitle": "Outlier Discovery",
  "research.header.discoverSubtitle": "Find winning videos and ideas using YouTube data",
  "research.header.monitorTitle": "Channel Monitor",
  "research.header.monitorSubtitle": "Track public metrics and recent video velocity",
  "research.header.commentsTitle": "Comment Analysis",
  "research.header.commentsSubtitle": "Collect, filter, and export public YouTube comments",
  "research.header.toolsTitle": "Media tools",
  "research.header.toolsSubtitle": "Download and process media for your research",
  "research.header.settingsTitle": "Research Settings",
  "research.header.settingsSubtitle": "Manage API keys and estimated quota",
  "research.header.quotaTip": "Requests recorded by this app today; YouTube reports when a key is exhausted",
  "research.header.quota": "{count} keys · used {read} reads · {search} searches",
  "research.common.noApi": "YouTube Data API is not connected",
  "research.common.cancel": "Cancel",
  "research.common.save": "Save",
  "research.common.views": "views",
  "research.common.subscribers": "subscribers",
  "research.common.videos": "videos",
  "research.common.comments": "comments",
  "research.common.likes": "likes",
  "research.time.hoursAgo": "{count} hours ago",
  "research.time.daysAgo": "{count} days ago",
  "research.time.monthsAgo": "{count} months ago",
  "research.time.yearsAgo": "{count} years ago",
  "research.discover.filters": "Discovery filters",
  "research.discover.reset": "Reset",
  "research.discover.contentType": "Content type",
  "research.discover.duration": "Duration",
  "research.discover.durationAny": "Any length",
  "research.discover.durationShort": "Under 4 min",
  "research.discover.durationMedium": "4–20 min",
  "research.discover.durationLong": "Over 20 min",
  "research.discover.published": "Published",
  "research.discover.maxDays": "Maximum (days)",
  "research.discover.newestAge": "From · hours ago",
  "research.discover.oldestAge": "To · hours ago",
  "research.discover.now": "Now",
  "research.discover.hoursAgo": "{count} hours ago",
  "research.discover.daysAgo": "{count} days ago",
  "research.discover.daysHoursAgo": "{days} days {hours} hours ago",
  "research.discover.hourRange": "{from}–{to} hours ago",
  "research.discover.serverFilterHint": "These thresholds are checked during search. The app keeps scanning YouTube pages until enough matching videos are found; high view thresholds are prioritized by view count.",
  "research.discover.views": "Views",
  "research.discover.subscribers": "Subscribers",
  "research.discover.vphHint": "VPH appears after two scans for pinned videos and is not used as a search filter.",
  "research.discover.queryPlaceholder": "Enter a topic to research...",
  "research.discover.search": "Search YouTube",
  "research.discover.sort": "Sort:",
  "research.discover.sortOutlier": "Outlier",
  "research.discover.sortViews": "Views",
  "research.discover.sortSubscribers": "Subscribers",
  "research.discover.sortPublished": "Published",
  "research.discover.sortDesc": "Descending",
  "research.discover.sortAsc": "Ascending",
  "research.discover.sortComposite": "Composite",
  "research.discover.signalRecency": "Recency",
  "research.discover.compositePresets": "Presets:",
  "research.discover.presetBalanced": "Balanced",
  "research.discover.presetTrending": "Trending",
  "research.discover.presetBigChannel": "Big channel",
  "research.discover.presetBreakout": "Breakout",
  "research.discover.compositeHint": "Blends the enabled signals into one score. Higher weight = more influence. Reorders loaded results only, no new search.",
  "research.discover.type": "Type:",
  "research.discover.time": "Time:",
  "research.discover.clearAll": "Clear all",
  "research.discover.waitScan": "Waiting for scan 2",
  "research.discover.unpin": "Unpin video",
  "research.discover.pin": "Pin to measure VPH",
  "research.discover.hiddenSubs": "hidden subs",
  "research.discover.queryRequired": "Enter a topic to research.",
  "research.discover.apiRequired": "Add a YouTube API key in Settings.",
  "research.discover.loadFailed": "Could not load YouTube data.",
  "research.discover.loadMoreFailed": "Could not load more results.",
  "research.discover.filteredEmpty": "YouTube returned {count} videos, but the filters excluded all of them",
  "research.discover.showAll": "Clear filters to show all",
  "research.discover.resultCount": "Showing {shown} cards · loaded {loaded} of about {total} results",
  "research.discover.loadMore": "Load 50 more videos",
  "research.discover.noResults": "YouTube returned no videos for “{query}”",
  "research.discover.tryShorter": "Try a shorter keyword or another content type.",
  "research.discover.start": "Enter a topic to begin",
  "research.discover.pageHint": "Each page loads up to 50 results directly from YouTube.",
  "research.monitor.title": "Monitored channels",
  "research.monitor.latestSnapshot": "Latest snapshot: {time}",
  "research.monitor.needTwoScans": "Two scans are required before VPH can be calculated",
  "research.monitor.channelSettings": "Settings",
  "research.monitor.channelSettingsTitle": "Scan settings · {channel}",
  "research.monitor.channelSettingsDescription": "Each channel has its own scan interval and video selection.",
  "research.monitor.addChannel": "Add channel",
  "research.monitor.interval": "Scan interval",
  "research.monitor.minutes": "{count} minutes",
  "research.monitor.hours": "{count} hours",
  "research.monitor.videoScanMode": "Videos to scan",
  "research.monitor.scanRange": "Scan range",
  "research.monitor.latestVideoCount": "Number of latest videos",
  "research.monitor.videoType": "Video type",
  "research.monitor.allVideoTypes": "All",
  "research.monitor.longVideos": "Long videos",
  "research.monitor.shorts": "Shorts",
  "research.monitor.latestVideos": "Latest videos",
  "research.monitor.videosPerEachChannel": "videos / channel",
  "research.monitor.chooseVideos": "Choose videos",
  "research.monitor.chooseVideosHint": "No videos have been selected for this channel.",
  "research.monitor.chooseChannelVideos": "Choose videos · {channel}",
  "research.monitor.chooseChannelVideosDescription": "Only checked videos will have views fetched and history stored in later scans.",
  "research.monitor.searchVideos": "Search by video title",
  "research.monitor.selectedVideosCount": "{count} videos selected",
  "research.monitor.allChannelVideos": "All videos",
  "research.monitor.allVideosQuotaHint": "Scanning every video uses more quota and takes longer for large channels.",
  "research.monitor.autoScan": "Auto scan",
  "research.monitor.scanNow": "Scan now",
  "research.monitor.noApiHint": "Add an API key in Settings before adding and scanning channels.",
  "research.monitor.empty": "No monitored channels",
  "research.monitor.emptyHint": "Click “Add channel” above to begin.",
  "research.monitor.scannedChannels": "Channels scanned",
  "research.monitor.publicViews": "Total public views",
  "research.monitor.latestDelta": "Views gained in latest scan",
  "research.monitor.video": "Video",
  "research.monitor.totalViews": "Total views",
  "research.monitor.videoDetailDescription": "Observed snapshot data only; missing periods are not interpolated.",
  "research.monitor.openOnYouTube": "Open on YouTube",
  "research.monitor.views48h": "Views gained · last 48h",
  "research.monitor.measureHint": "At least two scans are required to start measuring.",
  "research.monitor.hours48Ago": "48h ago",
  "research.monitor.now": "Now",
  "research.monitor.measuredInterval": "{count} views observed over {minutes} minutes",
  "research.monitor.missingInterval": "Two real snapshots are missing — no value was filled",
  "research.monitor.noPublicVideos": "No public videos.",
  "research.monitor.showMoreVideos": "Show {count} more videos",
  "research.monitor.collapseVideos": "Collapse to 10 videos",
  "research.monitor.remove": "Stop monitoring",
  "research.monitor.dialogTitle": "Add monitored channel",
  "research.monitor.dialogDescription": "Enter a Channel ID, YouTube URL, or @handle. IDs and handles use less quota than name search.",
  "research.monitor.addAndScan": "Add and scan",
  "research.comments.single": "Single video",
  "research.comments.channel": "Entire channel",
  "research.comments.singleTitle": "Analyze one video's comments",
  "research.comments.channelTitle": "Collect comments by channel",
  "research.comments.singleHint": "Enter a URL or Video ID. The app will load metadata and all public comments.",
  "research.comments.channelHint": "Enter a URL, @handle, or Channel ID to load videos and export comments.",
  "research.comments.analyze": "Analyze",
  "research.comments.loadChannel": "Load channel",
  "research.comments.filterPlaceholder": "Filter content or authors...",
  "research.comments.youtubeOrder": "YouTube order",
  "research.comments.mostLiked": "Most liked",
  "research.comments.newest": "Newest",
  "research.comments.oldest": "Oldest",
  "research.comments.noMatch": "No matching comments.",
  "research.comments.displayLimit": "Showing the first 200 comment threads to keep the interface responsive. The CSV still contains everything.",
  "research.comments.videoInvalid": "Invalid URL or Video ID.",
  "research.comments.loadingVideo": "Loading video details...",
  "research.comments.videoNotFound": "Video not found or not public.",
  "research.comments.loadingComments": "Loading comments...",
  "research.comments.loadedComments": "Loaded {count} comments...",
  "research.comments.done": "Complete · {count} comments",
  "research.comments.videoFailed": "Could not analyze the video.",
  "research.comments.loadingChannel": "Loading the channel's video list...",
  "research.comments.foundVideos": "Found {count} videos...",
  "research.comments.channelReady": "Loaded {count} videos. Choose how many videos to collect comments from.",
  "research.comments.channelFailed": "Could not load the channel.",
  "research.comments.processing": "Video {current}/{total}: {title}",
  "research.comments.channelDone": "Complete · {comments} comments from {videos} videos",
  "research.comments.allFailed": "Could not load all channel comments.",
  "research.comments.publicComments": "{count} public comments",
  "research.comments.exportFull": "Export full CSV",
  "research.comments.loadedVideoCount": "{subscribers} subscribers · {videos} videos loaded",
  "research.comments.metadataCsv": "Metadata CSV",
  "research.comments.commentsCsv": "Comments CSV",
  "research.comments.collectFrom": "Collect comments from",
  "research.comments.latestVideos": "Latest {count} videos",
  "research.comments.allVideos": "All videos",
  "research.comments.fetch": "Load comments",
  "research.comments.quotaWarning": "Large jobs use more API read quota",
  "research.comments.noApiHint": "Add an API key in Settings to analyze comments.",
  "research.comments.csvVideo": "Video",
  "research.comments.csvVideoUrl": "Video URL",
  "research.comments.csvDescription": "Description",
  "research.comments.csvAuthor": "Author",
  "research.comments.csvType": "Type",
  "research.comments.csvPublished": "Published at",
  "research.comments.csvComment": "Comment",
  "research.comments.csvReply": "Reply",
  "research.comments.csvTitle": "Title",
  "research.settings.description": "Each API key has its own field. When the current key runs out of quota, the app automatically rotates to the next available key.",
  "research.settings.keyList": "API key list",
  "research.settings.keyLabel": "API key {count}",
  "research.settings.addKey": "Add API key",
  "research.settings.removeKey": "Remove API key",
  "research.settings.hideKeys": "Hide keys",
  "research.settings.showKeys": "Show keys",
  "research.settings.localOnly": "{count} keys · stored locally on this device only.",
  "research.settings.createKey": "Create API key",
  "research.settings.testAll": "Test all",
  "research.settings.save": "Save list",
  "research.settings.saved": "Saved {count} API keys. Keys will rotate automatically.",
  "research.settings.enterKey": "Enter at least one API key.",
  "research.settings.invalid": "Invalid",
  "research.settings.quotaTitle": "Estimated quota today",
  "research.settings.quotaHint": "Requests used by this app. It does not stop at 10K because a project may have higher approved quota.",
  "research.settings.resetQuota": "Reset estimate",
  "research.settings.active": "Active",
  "research.settings.keyPosition": "Key {current}/{total}",
  "research.settings.readRemaining": "Read requests used",
  "research.settings.searchRemaining": "Search requests used",
  "research.api.searchQuota": "All API keys have exhausted today's search quota.",
  "research.api.readQuota": "All API keys have exhausted today's read quota.",
  "research.api.failed": "Could not call the YouTube API.",
  "research.api.httpError": "YouTube API returned error {status}",
  "research.api.invalidKey": "The API key is invalid or the YouTube Data API is not enabled.",
  "research.api.channelNotFound": "Could not find this YouTube channel.",
  "research.api.noPlaylist": "This channel has no public video playlist.",
  "research.api.youtubeUser": "YouTube user",
  "research.api.commentsFailed": "Could not load comments.",
  "research.api.commentsDisabled": "Comments are disabled for this video.",
  "research.api.scanFailed": "Could not complete the YouTube scan."
};
const messages$1 = {
  "appHome.mediaToolkit.title": "Media Toolkit",
  "appHome.mediaToolkit.description": "Preview and download online video, audio, and subtitles in one workspace.",
  "mediaToolkit.title": "Media Toolkit",
  "mediaToolkit.subtitle": "Preview • Download • Subtitles",
  "mediaToolkit.urlPlaceholder": "Paste a YouTube, TikTok, Facebook, Vimeo or other supported URL…",
  "mediaToolkit.useCurrentVideo": "Use this video",
  "mediaToolkit.browserAddress": "YouTube address",
  "mediaToolkit.currentMedia": "Current media",
  "mediaToolkit.currentMediaHint": "The watched video is detected automatically",
  "mediaToolkit.pickVideoTitle": "Choose a video on YouTube",
  "mediaToolkit.pickVideoHint": "Play any video, then click “Use this video” to unlock download and subtitle tools.",
  "mediaToolkit.profile.select": "YouTube profile",
  "mediaToolkit.profile.create": "Create a clean profile",
  "mediaToolkit.profile.rename": "Rename profile",
  "mediaToolkit.profile.delete": "Delete profile",
  "mediaToolkit.profile.deleteConfirm": "Delete “{name}” and all of its YouTube cookies and local data?",
  "mediaToolkit.profile.renameTitle": "Rename YouTube profile",
  "mediaToolkit.profile.renameDescription": "Choose a short name that helps you recognize this browsing session.",
  "mediaToolkit.profile.deleteTitle": "Delete YouTube profile?",
  "mediaToolkit.profile.save": "Save changes",
  "mediaToolkit.profile.confirmDelete": "Delete profile",
  "mediaToolkit.desktopOnly": "This tool is available in the Electron desktop app.",
  "mediaToolkit.invalidUrl": "Enter a valid http(s) URL.",
  "mediaToolkit.analyzeFailed": "Could not analyze this link.",
  "mediaToolkit.downloadFailed": "Download failed.",
  "mediaToolkit.downloadDone": "Download complete.",
  "mediaToolkit.subtitleEditor": "Subtitle workspace",
  "mediaToolkit.srtPlaceholder": "Downloaded or generated SRT will appear here…",
  "mediaToolkit.saveSrt": "Save SRT",
  "mediaToolkit.showFile": "Show file",
  "mediaToolkit.downloadTitle": "Download",
  "mediaToolkit.kind.video": "Video",
  "mediaToolkit.kind.audio": "Audio",
  "mediaToolkit.kind.subtitle": "Subtitles",
  "mediaToolkit.kind.thumbnail": "Thumbnail",
  "mediaToolkit.quality": "Maximum quality",
  "mediaToolkit.best": "Best available",
  "mediaToolkit.audioFormat": "Audio format",
  "mediaToolkit.startTime": "Start",
  "mediaToolkit.endTime": "End",
  "mediaToolkit.startTimePlaceholder": "0:30",
  "mediaToolkit.endTimePlaceholder": "1:23",
  "mediaToolkit.loadPlaylist": "Load playlist into queue",
  "mediaToolkit.playlistFailed": "Could not read this playlist.",
  "mediaToolkit.playlistLoaded": "Added {count} videos to the queue.",
  "mediaToolkit.queueTitle": "Download queue",
  "mediaToolkit.batchHint": "Queue multiple URLs. Details are fetched only when you start downloading.",
  "mediaToolkit.batchUrlPlaceholder": "Paste a video URL to add to the batch…",
  "mediaToolkit.batchAdd": "Add to batch",
  "mediaToolkit.batchImportTxt": "Import TXT",
  "mediaToolkit.batchFetchHint": 'TXT files use one URL per line, optionally followed by a time range, e.g. "URL 1:23-2:45". Leave blank to download the full video.',
  "mediaToolkit.batchFetching": "Fetching details…",
  "mediaToolkit.batchWaiting": "Waiting to download",
  "mediaToolkit.batchFailed": "Could not read URL — you can retry",
  "mediaToolkit.batchEmpty": "No videos yet — paste a URL above to begin.",
  "mediaToolkit.batchRemove": "Remove from batch",
  "mediaToolkit.batchImported": "Imported {count} URLs from the TXT file.",
  "mediaToolkit.batchNoValidUrl": "No new valid URLs were found in the file.",
  "mediaToolkit.batchConfigTitle": "Configure video downloads",
  "mediaToolkit.batchConfigDescription": "Choose what to download for {count} selected videos. The folder picker opens next.",
  "mediaToolkit.batchChooseFolder": "Continue to folder",
  "mediaToolkit.queueSelectVideo": "Select this video",
  "mediaToolkit.queueDeselectVideo": "Deselect this video",
  "mediaToolkit.tasks": "tasks",
  "mediaToolkit.queueSettings": "Queue item settings",
  "mediaToolkit.backToCurrent": "Back to current video",
  "mediaToolkit.downloadTasks": "Choose folder & download {count} tasks",
  "mediaToolkit.queueAdded": "Added to the download queue.",
  "mediaToolkit.addQueue": "Add to queue",
  "mediaToolkit.selectAll": "Select all",
  "mediaToolkit.clearSelection": "Clear",
  "mediaToolkit.downloadQueue": "Choose folder & download queue",
  "mediaToolkit.queueProgress": "Downloading {current}/{total}",
  "mediaToolkit.queueDone": "Downloaded {completed}/{total} items.",
  "mediaToolkit.subtitleTrack": "Subtitle track",
  "mediaToolkit.noSubtitle": "No subtitle track",
  "mediaToolkit.searchSubtitle": "Search language or code…",
  "mediaToolkit.noSubtitleMatch": "No matching subtitle language",
  "mediaToolkit.auto": "automatic",
  "mediaToolkit.multiDownloadDone": "Downloaded {completed}/{total} selected items.",
  "mediaToolkit.cancel": "Cancel",
  "mediaToolkit.generateSubtitle": "Generate subtitles with Whisper",
  "mediaToolkit.generateFallbackHint": "This video has no downloadable subtitle track. Whisper can create one from its audio.",
  "mediaToolkit.provider": "Provider",
  "mediaToolkit.sourceLanguage": "Source language",
  "mediaToolkit.generate": "Generate SRT",
  "mediaToolkit.whisperKeyRequired": "Enter a Whisper API key first.",
  "mediaToolkit.transcribeFailed": "Could not transcribe this media.",
  "mediaToolkit.transcribeDone": "Subtitle transcription complete.",
  "mediaToolkit.stage.installing": "Installing the download engine…",
  "mediaToolkit.stage.analyzing": "Reading media information…",
  "mediaToolkit.stage.downloading": "Downloading…",
  "mediaToolkit.stage.processing": "Processing media…",
  "mediaToolkit.stage.done": "Complete",
  "mediaToolkit.stage.error": "An error occurred"
};
const contentChat$1 = {
  "appHome.contentChat.title": "Content Chat",
  "appHome.contentChat.description": "Chat directly with an AI CLI and shape content or scripts using your own instructions.",
  "contentChat.title": "Content Chat",
  "contentChat.railLabel": "Content",
  "contentChat.newConversation": "New conversation",
  "contentChat.noHistory": "No conversations yet.",
  "contentChat.deleteConversation": "Delete conversation",
  "contentChat.noInjectedPrompt": "Messages are sent as written · Per-chat system prompt · Memory from memory.md",
  "contentChat.defaultModel": "CLI default model",
  "contentChat.refreshCli": "Check CLI again",
  "contentChat.emptyTitle": "What do you want to create?",
  "contentChat.emptyDescription": "Write your request in your own way. You can set a system prompt for this conversation and use memory.md as workspace memory.",
  "contentChat.placeholder": "Type your request…",
  "contentChat.inputHint": "Enter to send · Shift + Enter for a new line",
  "contentChat.connected": "Connected to {cli}",
  "contentChat.disconnected": "CLI is not ready",
  "contentChat.cliUnavailable": "{cli} CLI is not installed or ready.",
  "contentChat.stop": "Stop response",
  "contentChat.send": "Send",
  "contentChat.copy": "Copy",
  "contentChat.desktopOnly": "Content Chat workspaces are available in the desktop app only.",
  "contentChat.defaultWorkspace": "Default workspace",
  "contentChat.useDefaultWorkspace": "Use default",
  "contentChat.workspaceChanged": "The conversation workspace was changed.",
  "contentChat.defaultWorkspaceRestored": "Switched to the app's default workspace.",
  "contentChat.memoryTitle": "Workspace memory",
  "contentChat.memoryDescription": "Each folder has its own memory.md. Conversations using the same folder share this memory.",
  "contentChat.workspace": "Working folder",
  "contentChat.memoryPlaceholder": "Add long-term information for this workspace…",
  "contentChat.memoryScopeHint": "The app sends this file's content to the CLI as written. There is no per-conversation memory file.",
  "contentChat.saveMemory": "Save memory.md",
  "contentChat.memorySaved": "memory.md was saved. The CLI session will refresh on the next message.",
  "contentChat.systemPromptButton": "System",
  "contentChat.systemPromptTitle": "Conversation system prompt",
  "contentChat.systemPromptDescription": "Set the role, rules, and response style for this conversation.",
  "contentChat.systemPromptPlaceholder": "Example: You are a content editor. Be concise, verify facts, and prefer English…",
  "contentChat.systemPromptScopeHint": "Applies only to this conversation. memory.md remains shared workspace memory.",
  "contentChat.saveSystemPrompt": "Save system prompt",
  "contentChat.systemPromptSaved": "System prompt saved. The CLI session will refresh on the next message.",
  "contentChat.collapseSidebar": "Collapse history sidebar",
  "contentChat.expandSidebar": "Open history sidebar",
  "contentChat.providerLocked": "The provider is locked for this session",
  "contentChat.workspaceLocked": "The workspace is locked after the chat starts",
  "contentChat.openWorkspace": "Open workspace folder: {path}",
  "contentChat.workspaceOpenFailed": "Could not open the workspace folder.",
  "contentChat.openFile": "Open with the default app",
  "contentChat.revealFile": "Show file in Explorer",
  "contentChat.fileOpenFailed": "Could not open the file.",
  "contentChat.fileRevealFailed": "Could not reveal the file in Explorer.",
  "contentChat.previewUnsupported": "Preview is not available for this file type.",
  "contentChat.previewTruncated": "Only the beginning of this file is shown",
  "contentChat.slashCommands": "App and {cli} commands",
  "contentChat.noSlashCommands": "No matching commands found.",
  "contentChat.slashNew": "Start a new conversation",
  "contentChat.slashClear": "Clear context by starting a new conversation",
  "contentChat.slashMemory": "Open the workspace memory.md",
  "contentChat.slashFolder": "Open or choose the workspace folder",
  "contentChat.search": "Search conversations",
  "contentChat.searchPlaceholder": "Search history…",
  "contentChat.clearSearch": "Clear search",
  "contentChat.noSearchResults": "No matching conversations found.",
  "contentChat.chatActions": "Conversation options",
  "contentChat.pin": "Pin conversation",
  "contentChat.unpin": "Unpin",
  "contentChat.rename": "Rename",
  "contentChat.renameTitle": "Rename conversation",
  "contentChat.renameDescription": "Choose a short name that makes this conversation easy to find.",
  "contentChat.defaultEffort": "Reasoning: Auto"
};
const autoEdit$1 = {
  "autoEdit.underDevelopment": "Under development",
  "autoEdit.underDevelopmentHint": "This feature is under development. Please check back later.",
  "autoEdit.title": "Auto Edit",
  "autoEdit.untitled": "Untitled",
  "autoEdit.undo": "Undo",
  "autoEdit.redo": "Redo",
  "autoEdit.export": "Export video",
  "autoEdit.render": "Render",
  "autoEdit.panels.assets": "Assets",
  "autoEdit.panels.preview": "Preview",
  "autoEdit.panels.properties": "Properties",
  "autoEdit.panels.timeline": "Timeline",
  "autoEdit.preview.fit": "Fit to screen",
  "autoEdit.preview.fullscreen": "Fullscreen",
  "autoEdit.assetsTab.media": "Media",
  "autoEdit.assetsTab.audio": "Audio",
  "autoEdit.assetsTab.text": "Text",
  "autoEdit.assetsTab.effects": "Effects",
  "autoEdit.assetsTab.transitions": "Transitions",
  "autoEdit.transitions.hint": "Drag onto a clip to crossfade into the next clip on the same track.",
  "autoEdit.library.clickOrDrag": "Click to apply, or drag onto a clip",
  "autoEdit.library.dragToClip": "Drag onto a clip",
  "autoEdit.drop.noClip": "Drop this onto a clip",
  "autoEdit.drop.noCut": "Drop this on a cut between two clips",
  "autoEdit.assetsTab.captions": "Captions",
  "autoEdit.assetsTab.auto": "Auto",
  "autoEdit.auto.import": "Import JSON / CSV",
  "autoEdit.auto.hint": "Reads four fields only: visual, matching voice-over, effect and transition. Other columns are ignored. Absolute paths are used as-is; bare filenames are matched against imported media.",
  "autoEdit.auto.shots": "Shots placed",
  "autoEdit.auto.skipped": "Rows skipped",
  "autoEdit.auto.missing": "Media not found",
  "autoEdit.auto.noRows": "No usable rows in that file",
  "autoEdit.auto.noMedia": "None of the referenced media could be found",
  "autoEdit.auto.done": "Timeline built",
  "autoEdit.track.video": "Video",
  "autoEdit.track.audio": "Audio",
  "autoEdit.track.text": "Text",
  "autoEdit.track.effect": "Effect",
  "autoEdit.track.main": "Main",
  "autoEdit.emptyProject": "Create a new project to start editing",
  "autoEdit.comingSoon": "Coming soon",
  "autoEdit.addText": "Add text",
  "autoEdit.importMedia": "Import media",
  "autoEdit.noSelection": "Select an element to edit",
  "autoEdit.speed": "Speed",
  "autoEdit.duration": "Duration",
  "autoEdit.volume": "Volume",
  "autoEdit.transition": "Transition",
  "autoEdit.transition.none": "None",
  "autoEdit.transition.duration": "Duration",
  "autoEdit.transition.needsNext": "Needs a following clip on the same track",
  "autoEdit.motion.apply": "Applies to the selected clip",
  "autoEdit.element.image": "Image",
  "autoEdit.delete": "Delete",
  "autoEdit.duplicate": "Duplicate",
  "autoEdit.split": "Split",
  "autoEdit.zoomIn": "Zoom in",
  "autoEdit.zoomOut": "Zoom out",
  "autoEdit.hideTrack": "Hide track",
  "autoEdit.muteTrack": "Mute track",
  "autoEdit.ripple": "Ripple",
  "autoEdit.ripple.hint": "Close gaps when clips are deleted or trimmed",
  "autoEdit.captions.transcribe": "Transcribe",
  "autoEdit.captions.empty": "Import a video or audio clip to generate captions",
  "autoEdit.captions.transcribing": "Transcribing…",
  "autoEdit.captions.done": "Captions added",
  "autoEdit.captions.noApiKey": "Set a Whisper API key in Video Studio settings",
  "autoEdit.captions.failed": "Transcription failed",
  "autoEdit.captions.noCaptions": "No captions found",
  "autoEdit.captions.unavailable": "Transcription is not available",
  "autoEdit.effects": "Effects",
  "autoEdit.effects.empty": "No effects applied yet",
  "autoEdit.motion": "Motion",
  "autoEdit.masks": "Masks",
  "autoEdit.masks.feather": "Feather",
  "autoEdit.masks.inverted": "Inverted",
  "autoEdit.export.noContent": "Nothing to export yet.",
  "autoEdit.export.unavailable": "Export is only available in the desktop app.",
  "autoEdit.export.canceled": "Export canceled.",
  "autoEdit.export.failed": "Video export failed.",
  "autoEdit.export.done": "Video exported.",
  "autoEdit.export.resolution": "Resolution",
  "autoEdit.export.codec": "Codec",
  "autoEdit.export.quality": "Quality (CRF)",
  "autoEdit.export.canvas": "Canvas",
  "autoEdit.newProject": "New project",
  "autoEdit.openProject": "Open project",
  "autoEdit.saveProject": "Save project",
  "autoEdit.project.saved": "Project saved.",
  "autoEdit.project.loaded": "Project loaded.",
  "autoEdit.project.loadFailed": "Couldn't open project.",
  "autoEdit.project.saveFailed": "Couldn't save project.",
  "autoEdit.project.invalid": "Invalid project file.",
  "autoEdit.scenes": "Scenes",
  "autoEdit.scenes.add": "Add scene",
  "autoEdit.scenes.rename": "Rename",
  "autoEdit.scenes.delete": "Delete",
  "autoEdit.scenes.main": "Main",
  "autoEdit.dashboard.subtitle": "Projects",
  "autoEdit.dashboard.empty": "No projects yet",
  "autoEdit.dashboard.emptyHint": "Create a project to start editing.",
  "autoEdit.dashboard.rename": "Rename",
  "autoEdit.dashboard.reveal": "Show in folder",
  "autoEdit.dashboard.confirmDelete": "Delete?",
  "autoEdit.dashboard.back": "Back to projects"
};
const en = mergeCatalogSections(
  core$1,
  projects$1,
  settings$1,
  script$1,
  director$1,
  characters$1,
  scenes$1,
  generation$1,
  media$1,
  features$1,
  account$1,
  tts$1,
  research$1,
  messages$1,
  contentChat$1,
  autoEdit$1
);
const core = {
  "appHome.title": "Bạn muốn tạo gì hôm nay?",
  "appHome.subtitle": "Chọn một không gian làm việc bên dưới. Mỗi chức năng có dự án, công cụ và quy trình riêng nhưng dùng chung ngôn ngữ, giao diện, giấy phép và trợ giúp.",
  "appHome.videoStudio.title": "Video AI Studio",
  "appHome.videoStudio.description": "Biến kịch bản và prompt thành nhân vật, bối cảnh, shot, hình ảnh, video và dữ liệu sản xuất có thể xuất ra.",
  "appHome.openingVideoStudio": "Đang mở Video AI Studio...",
  "nav.overview": "Tổng quan",
  "nav.script": "Kịch bản",
  "nav.promptImport": "Nhập Prompt",
  "nav.characters": "Nhân vật",
  "nav.scenes": "Cảnh",
  "nav.director": "Đạo diễn",
  "nav.media": "Tư liệu",
  "nav.export": "Xuất",
  "nav.autoVideo": "Auto Video",
  "nav.autopilot": "AutoPilot",
  "nav.settings": "Cài đặt",
  "stage.script": "Kịch bản",
  "stage.assets": "Nhân vật và Cảnh",
  "stage.director": "Không gian đạo diễn",
  "stage.export": "Thành phẩm và xuất",
  "tabBar.help": "Trợ giúp",
  "tabBar.usageGuide": "Hướng dẫn sử dụng",
  "tabBar.settings": "Cài đặt",
  "tabBar.systemSettings": "Cài đặt hệ thống",
  "tabBar.cliSettings": "Thiết lập CLI",
  "cliSettings.title": "Thiết lập CLI",
  "cliSettings.description": "Kiểm tra các CLI được Chat và Buzz sử dụng. Mỗi CLI cần được cài đặt và đăng nhập trên máy này.",
  "cliSettings.installed": "Đã cài",
  "cliSettings.notInstalled": "Chưa cài",
  "cliSettings.notDetected": "Chưa phát hiện CLI",
  "cliSettings.ready": "Đã cài đặt và đăng nhập — sẵn sàng sử dụng.",
  "cliSettings.testFailed": "CLI chưa đăng nhập hoặc chưa thể sử dụng.",
  "cliSettings.testLogin": "Kiểm tra đăng nhập",
  "cliSettings.install": "Cài đặt tự động",
  "cliSettings.installing": "Đang cài đặt...",
  "cliSettings.installFailed": "Không thể cài đặt CLI.",
  "cliSettings.installStarted": "Đang bắt đầu cài {cli}...",
  "cliSettings.installSuccess": "Đã cài đặt {cli}. Bây giờ có thể kiểm tra đăng nhập.",
  "cliSettings.restartRequired": "Electron đang dùng runtime cũ. Hãy tắt hẳn ứng dụng rồi mở lại và bấm Cài đặt lần nữa.",
  "cliSettings.openGuide": "Mở hướng dẫn",
  "cliSettings.installGuide": "Hướng dẫn cài đặt",
  "cliSettings.refreshHint": "Sau khi cài đặt hoặc đăng nhập trong terminal, hãy kiểm tra lại trạng thái.",
  "tabBar.theme.light": "Sáng",
  "tabBar.theme.dark": "Tối",
  "tabBar.theme.toLight": "Chuyển sang chế độ sáng",
  "tabBar.theme.toDark": "Chuyển sang chế độ tối",
  "tabBar.backToProjects": "Quay lại danh sách dự án",
  "tabBar.switchToEnglish": "Chuyển sang Tiếng Anh",
  "tabBar.switchToVietnamese": "Chuyển sang Tiếng Việt",
  "project.untitled": "Dự án chưa đặt tên",
  "project.backToSeries": "Quay lại chế độ toàn bộ phim",
  "project.episode": "Tập {index}",
  "save.saved": "Đã lưu",
  "save.saving": "Đang lưu...",
  "save.unsaved": "Chưa lưu",
  "rightPanel.properties": "Thuộc tính",
  "rightPanel.comingSoon": "Sắp có",
  "common.cancel": "Hủy",
  "common.confirm": "Xác nhận",
  "common.edit": "Chỉnh sửa",
  "common.moveTo": "Di chuyển đến",
  "common.root": "Thư mục gốc",
  "time.justNow": "Vừa xong",
  "time.minutesAgo": "{count} phút trước",
  "time.hoursAgo": "{count} giờ trước",
  "time.daysAgo": "{count} ngày trước",
  "common.loadingImageFailed": "Tải ảnh thất bại",
  "brand.mark": "L",
  "common.apiExample": "https://api.example.com/v1",
  "common.apiHostExample": "https://api.example.com",
  "common.queryKey": "key",
  "common.authorization": "Authorization",
  "common.expiration": "expiration",
  "common.imageFieldName": "image",
  "common.nameFieldValue": "name",
  "common.responseUrlPath": "data.url",
  "common.responseDeleteUrlPath": "data.delete_url",
  "common.video": "Video",
  "common.audio": "Âm thanh",
  "common.clickToPreview": "Bấm vào ảnh hoặc video để xem trước",
  "common.enabled": "Bật",
  "common.advancedOptional": "Thiết lập nâng cao (tùy chọn)",
  "common.platform": "Nền tảng",
  "common.name": "Tên",
  "common.baseUrl": "Base URL",
  "common.uploadPathOrUrl": "Đường dẫn tải lên / URL",
  "common.selectPlatform": "Chọn nền tảng",
  "common.imageHostName": "Tên dịch vụ lưu ảnh",
  "common.uploadOrFullUrl": "/upload hoặc URL đầy đủ",
  "common.apiKeyQueryParam": "Tham số query API Key",
  "common.expirationParam": "Tham số hết hạn",
  "common.imageField": "Tên trường ảnh",
  "common.nameField": "Tên trường tên",
  "common.responseUrlField": "Trường URL trả về",
  "common.deleteUrlField": "Trường URL xóa",
  "common.close": "Đóng",
  "stage.phase01": "Giai đoạn 01",
  "stage.phase02": "Giai đoạn 02",
  "stage.phase03": "Giai đoạn 03",
  "stage.phase04": "Giai đoạn 04",
  "stage.phase05": "Giai đoạn 05",
  "taskInfo.title": "Thông tin tác vụ",
  "taskInfo.image": "Thông tin ảnh",
  "taskInfo.video": "Thông tin video",
  "taskInfo.scriptLatest": "Thông tin lần xử lý kịch bản gần nhất",
  "taskInfo.status": "Trạng thái",
  "taskInfo.kind": "Loại",
  "taskInfo.time": "Thời gian",
  "taskInfo.queuedAt": "Xếp hàng",
  "taskInfo.submittedAt": "Gửi request",
  "taskInfo.completedAt": "Hoàn thành",
  "taskInfo.waitDuration": "Thời gian chờ",
  "taskInfo.processingDuration": "Thời gian xử lý",
  "taskInfo.actualPrompt": "Nội dung thực gửi",
  "taskInfo.copy": "Sao chép",
  "taskInfo.copied": "Đã chép",
  "taskInfo.technical": "Thông số kỹ thuật",
  "taskInfo.status.queued": "Đang chờ",
  "taskInfo.status.submitting": "Đang gửi",
  "taskInfo.status.running": "Đang xử lý",
  "taskInfo.status.completed": "Hoàn thành",
  "taskInfo.status.failed": "Thất bại",
  "taskInfo.status.cancelled": "Đã hủy",
  "taskInfo.noData": "Chưa có thông tin tác vụ cho mục này.",
  "taskInfo.noDataHelp": "Kết quả tạo trước bản cập nhật chưa có lịch sử. Tạo lại để ghi nhận đầy đủ thông tin."
};
const projects = {
  "dashboard.selection.exit": "Thoát chọn",
  "dashboard.selection.manage": "Quản lý",
  "dashboard.newProject": "Tạo dự án",
  "dashboard.myProjects": "Dự án của tôi",
  "dashboard.projectCount": "{count} dự án",
  "dashboard.selectedCount": "Đã chọn {count}",
  "dashboard.selectAll": "Chọn tất cả",
  "dashboard.clearSelection": "Bỏ chọn tất cả",
  "dashboard.deleteSelected": "Xóa mục đã chọn ({count})",
  "dashboard.projectNamePlaceholder": "Nhập tên dự án...",
  "dashboard.create": "Tạo",
  "dashboard.rename": "Đổi tên",
  "dashboard.duplicate": "Nhân bản dự án",
  "dashboard.delete": "Xóa",
  "dashboard.openProject": "Mở dự án",
  "dashboard.emptyTitle": "Chưa có dự án",
  "dashboard.emptyDescription": "Tạo dự án video AI đầu tiên của bạn",
  "dashboard.renameProject": "Đổi tên dự án",
  "dashboard.newNamePlaceholder": "Nhập tên mới...",
  "dashboard.confirmBatchDelete": "Xác nhận xóa hàng loạt",
  "dashboard.batchDeleteMessage": "Bạn sắp xóa {count} dự án. Hành động này không thể hoàn tác. Tiếp tục?",
  "dashboard.toast.deletedProjects": "Đã xóa {count} dự án",
  "dashboard.toast.renamed": "Đã đổi tên dự án",
  "dashboard.toast.storageUnavailable": "Không thể dùng bộ lưu trữ file. Chỉ sao chép tên dự án.",
  "dashboard.duplicateSuffix": "Bản sao",
  "dashboard.toast.duplicated": 'Đã sao chép "{name}" ({count} tệp dữ liệu)',
  "dashboard.toast.duplicateNameOnly": "Không có tệp dữ liệu dự án. Chỉ sao chép tên dự án.",
  "dashboard.toast.duplicateFailed": "Sao chép dữ liệu dự án thất bại: {message}",
  "dashboard.toast.deletedSingle": 'Đã xóa "{name}"',
  "overview.onboarding": "Hướng dẫn bắt đầu",
  "overview.workflowTitle": "Bắt đầu một dự án video mới",
  "overview.workflowSubtitle": "Đi theo 4 giai đoạn dưới đây. Bạn có thể quay lại Tổng quan bất cứ lúc nào để kiểm tra dữ liệu dự án.",
  "overview.workflow.stage1": "Chuẩn bị kịch bản",
  "overview.workflow.stage1.1": "Mở Kịch bản, dán nội dung hoặc dùng Nhập Prompt nếu đã có bảng prompt.",
  "overview.workflow.stage1.2": "Chọn Skill kịch bản và phong cách hình ảnh nếu cần.",
  "overview.workflow.stage1.3": "Nhập kịch bản, sau đó kiểm tra lại tập, cảnh, shot và lời thoại.",
  "overview.workflow.stage2": "Chuẩn bị hình ảnh",
  "overview.workflow.stage2.1": "Kiểm tra danh sách Nhân vật và Cảnh được nhận diện từ kịch bản.",
  "overview.workflow.stage2.2": "Bổ sung mô tả, prompt hoặc ảnh tham chiếu còn thiếu.",
  "overview.workflow.stage2.3": "Tạo và lưu hình nhân vật, bối cảnh cần dùng xuyên suốt video.",
  "overview.workflow.stage3": "Dựng trong Đạo diễn",
  "overview.workflow.stage3.1": "Mở Đạo diễn và đưa các shot cần sản xuất vào danh sách dựng.",
  "overview.workflow.stage3.2": "Kiểm tra prompt, nhân vật, bối cảnh và ảnh tham chiếu của từng shot.",
  "overview.workflow.stage3.3": "Tạo ảnh trước, duyệt kết quả rồi mới tạo video cho các shot đạt yêu cầu.",
  "overview.workflow.stage4": "Kiểm tra và xuất",
  "overview.workflow.stage4.1": "Xem lại hình ảnh, video, lời thoại và thời lượng của toàn bộ shot.",
  "overview.workflow.stage4.2": "Mở Xuất để chọn các thành phần cần bàn giao.",
  "overview.workflow.stage4.3": "Nếu cần ghép nhanh Audio + SRT + ảnh, sử dụng Auto Video.",
  "overview.projectTitle": "Tổng quan dự án",
  "overview.storyCore": "Cốt truyện chính",
  "overview.title": "Tiêu đề",
  "overview.titlePlaceholder": "Tên tác phẩm",
  "overview.logline": "Logline",
  "overview.loglinePlaceholder": "Tóm tắt tuyến truyện chính trong một câu...",
  "overview.outline": "Đại cương",
  "overview.outlinePlaceholder": "Tóm tắt đầy đủ cốt truyện trong 100-500 chữ...",
  "overview.centralConflict": "Xung đột trung tâm",
  "overview.centralConflictPlaceholder": "Mâu thuẫn chính...",
  "overview.themes": "Chủ đề",
  "overview.noThemes": "Chưa có thẻ chủ đề",
  "overview.production": "Thiết lập sản xuất",
  "overview.visualStyle": "Phong cách hình ảnh",
  "overview.unset": "Chưa đặt",
  "overview.language": "Ngôn ngữ",
  "overview.episodeDirectory": "Danh sách tập ({count})",
  "overview.noEpisodes": "Chưa có dữ liệu tập. Hệ thống sẽ tự tạo sau khi nhập kịch bản.",
  "overview.episode": "Tập {index}",
  "overview.sceneCount": "{count} cảnh",
  "overview.editEpisodeTitle": "Chỉnh tiêu đề tập",
  "overview.confirmDeleteEpisode": "Xác nhận xóa?",
  "overview.add": "Thêm",
  "overview.characters": "Nhân vật ({count})",
  "overview.noCharacters": "Chưa có dữ liệu nhân vật",
  "overview.moreCharacters": "còn {count} nhân vật nữa..."
};
const settings = {
  "update.desktopOnly": "Tính năng này chỉ dùng trên bản desktop",
  "update.installFailed": "Không thể tải hoặc cài bản cập nhật",
  "update.newVersion": "Đã tìm thấy bản mới v{version}",
  "update.upgradeAvailable": "Phiên bản hiện tại v{currentVersion}. Có thể nâng cấp lên v{latestVersion}.",
  "update.releaseNotes": "Ghi chú cập nhật",
  "update.publishedAt": "Phát hành: {date}",
  "update.noReleaseNotes": "Bản phát hành này không có ghi chú cập nhật.",
  "update.installUpdate": "Cài đặt cập nhật",
  "update.installHint": "Ứng dụng sẽ tải bản cập nhật, đóng và mở lại để hoàn tất cài đặt.",
  "update.installNow": "Tải và cài ngay",
  "update.installing": "Đang tải cập nhật...",
  "update.ignore": "Bỏ qua bản này",
  "update.later": "Để sau",
  "settings.title": "Cài đặt",
  "settings.configured": "Đã cấu hình: {count}/{total}",
  "settings.addProvider": "Thêm nhà cung cấp",
  "settings.tab.api": "Quản lý API",
  "settings.tab.imageHost": "Lưu trữ ảnh",
  "settings.tab.storage": "Lưu trữ",
  "settings.securityTitle": "Lưu ý bảo mật",
  "settings.securityBody": "Tất cả API key chỉ được lưu cục bộ trong bộ nhớ trình duyệt và không được tải lên bất kỳ máy chủ nào. Hệ thống hỗ trợ xoay vòng nhiều key và tự động chuyển khi gặp lỗi.",
  "settings.recommended": "Khuyên dùng",
  "settings.providers": "Nhà cung cấp",
  "settings.noProviders": "Chưa có nhà cung cấp nào được cấu hình",
  "settings.models": "Mô hình ({count})",
  "settings.badgeConfigured": "Đã cấu hình",
  "settings.syncModels": "Đồng bộ danh sách mô hình",
  "settings.syncSuccess": "Đã đồng bộ {count} mô hình",
  "settings.syncFailed": "Đồng bộ mô hình thất bại",
  "settings.testConnection": "Kiểm tra kết nối",
  "settings.edit": "Chỉnh sửa",
  "settings.confirmDelete": "Xác nhận xóa",
  "settings.confirmDeleteProvider": "Xóa {name}? Hành động này không thể hoàn tác.",
  "settings.deleteProvider": "Xóa nhà cung cấp",
  "settings.deleteImageHost": "Xóa dịch vụ lưu ảnh",
  "settings.imageHostTestSuccess": "Kết nối dịch vụ lưu ảnh {name} thành công",
  "settings.testFailed": "Kiểm tra thất bại: {message}",
  "settings.networkTestFailed": "Kiểm tra kết nối thất bại. Vui lòng kiểm tra mạng.",
  "settings.configureApiKeyFirst": "Hãy cấu hình API key trước",
  "settings.connectionSuccess": "Kết nối thành công",
  "settings.providerConfigured": "Đã cấu hình {name}",
  "settings.connectionFailedWithStatus": "Kiểm tra kết nối thất bại ({status})",
  "settings.globalSettings": "Cài đặt chung",
  "settings.cliRuntimeTitle": "CLI Runtime",
  "settings.cliRuntimeDescription": "Dùng Claude CLI hoặc OpenCode cho các tác vụ phân tích văn bản thay vì gọi API trực tiếp.",
  "settings.cliRuntimeUnavailableHint": "Chưa phát hiện CLI runtime. Ở web dev nó đi qua Vite dev server; ở desktop nó đi qua Electron.",
  "settings.cliModel": "Model CLI",
  "settings.cliTimeout": "Thời gian chờ (ms)",
  "settings.cliAvailable": "Sẵn sàng",
  "settings.cliUnavailable": "Không khả dụng",
  "settings.cliStatusUnknown": "Chưa kiểm tra trạng thái",
  "settings.refreshCliStatus": "Làm mới trạng thái CLI",
  "settings.cliRuntimeHint": "Khi bật, các tính năng text như phân tích kịch bản sẽ ưu tiên runtime CLI đã chọn. Sinh ảnh và video vẫn dùng API provider như cũ.",
  "settings.cliTestPrompt": "Prompt kiểm tra",
  "settings.cliRunTest": "Chạy thử CLI",
  "settings.cliTestPromptPlaceholder": "Nhập prompt ngắn để kiểm tra CLI runtime",
  "settings.cliTestOutput": "Output streaming",
  "settings.cliTestOutputEmpty": "Chưa có output",
  "settings.cliTestPromptRequired": "Hãy nhập prompt kiểm tra trước",
  "settings.cliRuntimeUnavailable": "Chưa có CLI runtime khả dụng. Hãy chạy dev server bình thường hoặc mở Electron rồi làm mới trạng thái.",
  "settings.cliUsingDevServer": "Đang dùng Vite dev runtime",
  "settings.cliUsingElectronRuntime": "Đang dùng Electron runtime",
  "settings.cliRuntimeStartHint": "Hãy chạy dev server bình thường hoặc mở Electron",
  "settings.cliPathUnknown": "Chưa phát hiện đường dẫn CLI",
  "settings.cliSelectModel": "Chọn model CLI",
  "settings.cliLoadingModels": "Đang tải model...",
  "settings.cliNoModels": "Chưa phát hiện model nào",
  "settings.cliModelSourceReady": "Có {count} model khả dụng",
  "settings.maxStudioLanesTitle": "Số lane",
  "settings.maxStudioImageLanes": "Lane tạo ảnh",
  "settings.maxStudioImageLanesHelp": "Số lane tạo ảnh cho mỗi tài khoản. Áp dụng cho tất cả provider. Tối thiểu 1.",
  "settings.maxStudioVideoLanes": "Lane tạo video",
  "settings.maxStudioVideoLanesHelp": "Số lane tạo video cho mỗi tài khoản. Áp dụng cho tất cả provider. Tối thiểu 1.",
  "settings.maxStudioImageSubmitDelay": "Delay gửi ảnh (ms)",
  "settings.maxStudioImageSubmitDelayHelp": "Khoảng delay giữa hai lần gửi request tạo ảnh bất kỳ, áp dụng cho tất cả provider.",
  "settings.maxStudioVideoSubmitDelay": "Delay gửi video (ms)",
  "settings.maxStudioVideoSubmitDelayHelp": "Áp dụng cho tất cả provider: giãn cách giữa các lần submit video và cooldown sau khi một video hoàn tất trước khi lane chạy video tiếp theo.",
  "settings.maxStudioJwtStartStagger": "Giãn cách giữa các tài khoản (ms)",
  "settings.maxStudioJwtStartStaggerHelp": "Khoảng giãn cách khi chuyển request sang tài khoản khác, tránh các tài khoản gửi cùng lúc.",
  "settings.directorImageTimeout": "Timeout ảnh Đạo diễn (giây)",
  "settings.directorImageTimeoutHelp": "Khoảng timeout random cho mỗi job ảnh chạy hàng loạt trước khi retry hoặc báo lỗi.",
  "settings.directorVideoTimeout": "Timeout video Đạo diễn (giây)",
  "settings.directorVideoTimeoutHelp": "Khoảng timeout random cho mỗi job video chạy hàng loạt trước khi retry hoặc báo lỗi.",
  "settings.maxStudioSettingsSaved": "Đã lưu cài đặt lane và delay",
  "settings.scriptImportChunkConcurrency": "Số chunk kịch bản chạy song song",
  "settings.scriptImportChunkConcurrencyDesc": "Số chunk của kịch bản dài được xử lý cùng lúc khi import bằng skill.",
  "settings.scriptImportChunkConcurrencyHint": "Có thể tăng lên 3-4 để nhập nhanh hơn nếu API/model chịu được. Phạm vi: {min}-{max}.",
  "settings.watermarkRemoval": "Tự động xóa watermark Gemini",
  "settings.watermarkRemovalDesc": "Tự động loại bỏ watermark Gemini khỏi ảnh ngay sau khi tạo xong. Chỉ áp dụng cho ảnh mới được tạo.",
  "settings.watermarkRemovalProHint": "Tính năng này yêu cầu gói Pro hoặc Unlimited.",
  "settings.imageHostTitle": "Lưu trữ ảnh",
  "settings.imageHostDescription": "Dịch vụ lưu trữ ảnh được dùng để lưu các ảnh tạm phát sinh trong quá trình tạo video, như khung cuối được trích xuất hoặc ảnh dùng để truyền khung.",
  "settings.imageHostProviders": "Nhà cung cấp lưu trữ ảnh",
  "settings.add": "Thêm",
  "settings.noImageHosts": "Chưa có dịch vụ lưu ảnh nào được cấu hình",
  "settings.notConfigured": "Chưa cấu hình",
  "settings.addressNotSet": "chưa đặt địa chỉ",
  "settings.guestUpload": "Tải lên dạng khách (không cần key)",
  "settings.keyCount": "{count} key",
  "settings.imageHostNotice": "Dịch vụ lưu trữ ảnh dùng để lưu các ảnh tạm phục vụ những tính năng như Liên tục hình ảnh. Nếu không cấu hình, việc truyền khung giữa các shot sẽ bị hạn chế. Khi bật nhiều dịch vụ, hệ thống sẽ dùng lần lượt và tự động chuyển sang dịch vụ khác nếu gặp lỗi.",
  "settings.imageHostDefaultNotice": "SCDN có sẵn mặc định và không yêu cầu key. Hãy bật thủ công dịch vụ lưu ảnh khi cần truyền khung.",
  "settings.storageTitle": "Cài đặt lưu trữ",
  "settings.storageDescription": "Thiết lập chia sẻ tài nguyên, vị trí lưu trữ và quản lý bộ nhớ đệm.",
  "settings.desktopOnly": "Tính năng này chỉ khả dụng trên bản desktop.",
  "settings.resourceSharing": "Chia sẻ tài nguyên",
  "settings.shareCharacters": "Chia sẻ thư viện nhân vật giữa các dự án",
  "settings.shareScenes": "Chia sẻ thư viện cảnh giữa các dự án",
  "settings.shareMedia": "Chia sẻ thư viện tư liệu giữa các dự án",
  "settings.visibleCurrentProjectOnly": "Khi tắt, chỉ dự án hiện tại mới có thể truy cập tài nguyên này.",
  "settings.storageLocation": "Vị trí lưu trữ",
  "settings.storagePathLabel": "Đường dẫn lưu dữ liệu (bao gồm dự án và tư liệu)",
  "settings.defaultLocation": "Vị trí mặc định",
  "settings.select": "Chọn",
  "settings.save": "Lưu",
  "settings.export": "Xuất",
  "settings.import": "Nhập",
  "settings.storageMoveWarning": "Việc đổi vị trí sẽ di chuyển dữ liệu hiện có sang thư mục mới và tự động tạo các thư mục con `projects/` và `media/`.",
  "settings.dataRecovery": "Khôi phục dữ liệu",
  "settings.dataRecoveryDescription": "Sau khi đổi thiết bị hoặc cài lại hệ điều hành, bạn có thể trỏ ứng dụng đến thư mục dữ liệu cũ để khôi phục toàn bộ cài đặt và dự án.",
  "settings.linkExistingData": "Liên kết thư mục dữ liệu hiện có",
  "settings.linkExistingDataHint": "Hãy chọn thư mục dữ liệu có chứa hai thư mục con `projects/` và `media/`. Nên khởi động lại ứng dụng sau thao tác này.",
  "settings.cacheManagement": "Quản lý bộ nhớ đệm",
  "settings.cacheSize": "Dung lượng bộ nhớ đệm",
  "settings.calculating": "Đang tính...",
  "settings.clear": "Xóa",
  "settings.autoClean": "Tự động dọn",
  "settings.defaultOff": "Mặc định tắt",
  "settings.clean": "Xóa",
  "settings.cacheOlderThanDays": "các tệp bộ nhớ đệm cũ hơn {count} ngày",
  "settings.appUpdates": "Cập nhật ứng dụng",
  "settings.currentVersion": "Phiên bản hiện tại",
  "settings.checkForUpdates": "Kiểm tra cập nhật",
  "settings.autoCheckUpdates": "Tự động kiểm tra cập nhật khi khởi động",
  "settings.autoCheckUpdatesHelp": "Khi bật, bản desktop sẽ tự kiểm tra GitHub Releases khi khởi động và thông báo nếu có phiên bản mới.",
  "settings.ignoredVersion": "Phiên bản đã bỏ qua",
  "settings.restoreReminder": "Khôi phục nhắc nhở",
  "settings.updateReminderRestored": "Đã khôi phục nhắc nhở cập nhật",
  "settings.storageUpdated": "Đã cập nhật vị trí lưu trữ. Đang làm mới...",
  "settings.moveFailed": "Di chuyển thất bại: {message}",
  "settings.dataExported": "Đã xuất dữ liệu",
  "settings.exportFailed": "Xuất dữ liệu thất bại: {message}",
  "settings.confirmImport": "Việc nhập dữ liệu sẽ ghi đè dữ liệu hiện tại. Bạn có muốn tiếp tục không?",
  "settings.dataImported": "Đã nhập dữ liệu. Đang làm mới...",
  "settings.importFailed": "Nhập dữ liệu thất bại: {message}",
  "settings.invalidDataDirectory": "Thư mục dữ liệu không hợp lệ",
  "settings.linkDataConfirm": "Đã phát hiện {projectCount} tệp dự án và {mediaCount} tệp tư liệu.\n\nBạn có muốn dùng thư mục này không? Nên khởi động lại ứng dụng sau thao tác này.",
  "settings.linkedDataDir": "Đã liên kết thư mục dữ liệu. Đang làm mới...",
  "settings.operationFailed": "Thao tác thất bại: {message}",
  "settings.cacheCleared": "Đã xóa bộ nhớ đệm",
  "settings.clearFailed": "Xóa thất bại: {message}",
  "settings.checkUpdateFailed": "Kiểm tra cập nhật thất bại: {message}",
  "settings.upToDate": "Bạn đang dùng phiên bản mới nhất v{version}",
  "settings.checkUpdateRetry": "Kiểm tra cập nhật thất bại. Vui lòng thử lại sau.",
  "settings.autoSyncedModels": "Đã tự động đồng bộ {count} mô hình",
  "settings.modelSyncFailed": "Đồng bộ mô hình thất bại: {message}",
  "featureBindings.title": "Ánh xạ dịch vụ",
  "featureBindings.configured": "Đã cấu hình: {count}/{total}",
  "featureBindings.scriptAnalysis": "Phân tích kịch bản / Đối thoại",
  "featureBindings.scriptAnalysisDesc": "Tách văn bản câu chuyện thành kịch bản có cấu trúc.",
  "featureBindings.imageGeneration": "Tạo ảnh",
  "featureBindings.imageGenerationDesc": "Tạo ảnh tham chiếu cho nhân vật và cảnh.",
  "featureBindings.videoGeneration": "Tạo video",
  "featureBindings.videoGenerationDesc": "Chuyển ảnh thành video.",
  "featureBindings.imageUnderstanding": "Hiểu ảnh",
  "featureBindings.imageUnderstandingDesc": "Phân tích nội dung ảnh và tạo mô tả.",
  "featureBindings.imageRec": "Khuyên dùng Nano Banana Pro (Gemini 3 Pro) vì chất lượng ảnh và độ nhất quán tốt.",
  "featureBindings.videoRec": "Khuyên thử doubao-seedance-1-0-lite-t2v-250428 để kiểm tra nhanh toàn bộ quy trình.",
  "featureBindings.modelCount": "{count} mô hình",
  "featureBindings.noModels": "Chưa có mô hình nào để chọn. Hãy cấu hình danh sách mô hình trong mục Nhà cung cấp trước.",
  "featureBindings.multiSelectHint": "Bạn có thể chọn nhiều mô hình. Các yêu cầu sẽ được luân phiên gửi qua từng mô hình theo thứ tự với khoảng cách 3 giây.",
  "featureBindings.searchPlaceholder": "Tìm theo tên mô hình...",
  "featureBindings.noMatches": "Không có mô hình phù hợp",
  "featureBindings.incompleteTitle": "Một số dịch vụ chưa được cấu hình",
  "featureBindings.incompleteBody": "Hãy chọn ít nhất một nhà cung cấp/mô hình cho từng tính năng ở trên và đảm bảo nhà cung cấp tương ứng đã có API key hợp lệ.",
  "featureBindings.helpRotation": "Mỗi tính năng có thể dùng nhiều mô hình và các yêu cầu sẽ được luân phiên gửi qua từng mô hình theo thứ tự mỗi 3 giây để giảm áp lực giới hạn tần suất trên một API duy nhất.",
  "featureBindings.helpSource": "Các tùy chọn có sẵn được lấy từ danh sách mô hình đã cấu hình trong mục Nhà cung cấp. Mở rộng từng phần để chọn nhiều mô hình.",
  "apiDialog.addProvider": "Thêm nhà cung cấp",
  "apiDialog.addProviderDesc": "Thêm một nhà cung cấp mới",
  "apiDialog.platform": "Nền tảng",
  "apiDialog.selectPlatform": "Chọn nền tảng",
  "apiDialog.name": "Tên",
  "apiDialog.namePlaceholder": "Tên nhà cung cấp",
  "apiDialog.baseUrlOptional": "Base URL (có thể chỉnh sửa)",
  "apiDialog.enterApiKey": "Nhập API key",
  "apiDialog.multiKeys": "Hỗ trợ nhiều key, phân tách bằng dấu phẩy.",
  "apiDialog.modelOptional": "Mô hình (tùy chọn)",
  "apiDialog.modelPlaceholder": "Nhập tên mô hình, ví dụ: gpt-4o",
  "apiDialog.add": "Thêm",
  "apiDialog.choosePlatform": "Hãy chọn nền tảng",
  "apiDialog.enterName": "Hãy nhập tên",
  "apiDialog.customNeedsBaseUrl": "Nền tảng tùy chỉnh cần có Base URL",
  "apiDialog.enterApiKeyError": "Hãy nhập API key",
  "apiDialog.added": "Đã thêm {name}",
  "apiDialog.editProvider": "Chỉnh sửa nhà cung cấp",
  "apiDialog.apiKeys": "API Key",
  "apiDialog.keyCount": "{count} key",
  "apiDialog.keyListPlaceholder": "Nhập API key (mỗi dòng một key hoặc phân tách bằng dấu phẩy)",
  "apiDialog.keyRotationHint": "Hỗ trợ nhiều key và sẽ tự động xoay vòng khi gặp lỗi.",
  "apiDialog.modelListHint": "Phân tách nhiều mô hình bằng dấu phẩy. Mô hình đầu tiên sẽ được dùng làm mặc định.",
  "featureBindings.tip": "Mẹo:",
  "featureBindings.note": "Ghi chú:",
  "imageHost.addTitle": "Thêm dịch vụ lưu ảnh",
  "imageHost.editTitle": "Chỉnh sửa dịch vụ lưu ảnh",
  "imageHost.scdnHint": "SCDN hỗ trợ tải lên trực tiếp và phù hợp để dùng làm dịch vụ lưu ảnh mặc định.",
  "imageHost.apiKeyHeader": "Header API Key",
  "imageHost.cancel": "Hủy",
  "imageHost.add": "Thêm",
  "imageHost.save": "Lưu"
};
const script = {
  "promptImport.importFile": "Nhập file",
  "promptImport.title": "Nhập Prompt",
  "promptImport.description": "Dán CSV có các cột: episodeIndex, shotIndex, sceneName, ref_image, imagePrompt, videoPrompt, voiceOver, videoLength. sceneName và ref_image là tùy chọn; ref_image nhận dạng 1 hoặc 1;2.",
  "promptImport.previewValid": "Preview: {count} dòng hợp lệ",
  "promptImport.syncScript": "Đồng bộ Kịch bản",
  "promptImport.openDirector": "Mở trong Đạo diễn",
  "promptImport.syncedDirector": "Đã đồng bộ {count} prompt và mở trong Đạo diễn.",
  "promptImport.syncedScript": "Đã đồng bộ {count} prompt xuống Kịch bản.",
  "promptImport.shot": "Shot",
  "promptImport.episode": "Tập",
  "promptImport.scene": "Cảnh",
  "promptImport.refImage": "Ref image",
  "promptImport.characters": "Nhân vật",
  "promptImport.imagePrompt": "Prompt ảnh",
  "promptImport.videoPrompt": "Prompt video",
  "promptImport.voiceOver": "Lời thoại",
  "promptImport.videoLength": "Thời lượng",
  "property.empty": "Chọn tập, nhân vật, cảnh hoặc shot\nđể xem chi tiết",
  "property.status.pending": "Chưa bắt đầu",
  "property.status.inProgress": "Đang thực hiện",
  "property.status.completed": "Hoàn thành",
  "property.episode": "Tập {index}",
  "property.sceneStats": "Thống kê cảnh",
  "property.sceneCount": "Tập này có {count} cảnh",
  "property.shotStatus": "Trạng thái shot: {status}",
  "property.shotStatus.completed": "Đã tạo",
  "property.shotStatus.generating": "Đang tạo...",
  "property.shotStatus.idle": "Chưa tạo",
  "property.generateShots": "Tạo shot",
  "property.copied": "Đã sao chép",
  "property.copyShotData": "Sao chép dữ liệu shot ({count})",
  "property.scenePrompt": "Scene Prompt",
  "property.viewCharacterLibrary": "Xem nhân vật trong thư viện",
  "property.importCharacterLibrary": "Nhập vào thư viện nhân vật",
  "property.copyCharacterData": "Sao chép dữ liệu nhân vật",
  "property.deleteCharacter": "Xóa nhân vật",
  "property.confirmDelete": "Xác nhận xóa",
  "property.confirmDeleteCharacter": 'Xóa nhân vật "{name}"?',
  "property.mainScene": "Cảnh chính",
  "property.secondaryScene": "Cảnh phụ",
  "property.transitionScene": "Cảnh chuyển tiếp",
  "property.appearsCount": "Xuất hiện {count} lần",
  "property.appearsEpisodes": "Tập {episodes}",
  "property.viewSceneLibrary": "Xem cảnh trong thư viện",
  "property.importSceneLibrary": "Nhập vào thư viện cảnh",
  "property.copySceneData": "Sao chép dữ liệu cảnh",
  "property.goAiDirector": "Tạo video trong AI Director",
  "property.deleteScene": "Xóa cảnh",
  "property.confirmDeleteScene": 'Xóa cảnh "{name}"? Toàn bộ shot bên trong cũng sẽ bị xóa.',
  "property.shot": "Shot {index}",
  "property.image": "Ảnh",
  "property.video": "Video",
  "property.goAiDirectorShort": "Tạo trong AI Director",
  "property.copyThreeLayerPrompts": "Sao chép dữ liệu prompt ba lớp",
  "property.deleteShot": "Xóa shot",
  "property.confirmDeleteShot": "Xóa shot {index}?",
  "scriptView.scriptGenerationFailed": "Tạo kịch bản thất bại: {message}",
  "scriptView.parseFailed": "Phân tích thất bại: {message}",
  "scriptView.shotGenerationFailed": "Tạo shot thất bại: {message}",
  "scriptView.goCharacterLibrary": "Đã chuyển đến Thư viện nhân vật",
  "scriptView.goCharacterLibrarySelected": 'Đã chuyển đến Thư viện nhân vật và chọn "{name}"',
  "scriptView.goSceneLibrarySelected": 'Đã chuyển đến Thư viện cảnh và chọn "{name}"',
  "scriptView.structureComplete": "Đã hoàn tất bổ sung cấu trúc: phân tích được {count} cảnh",
  "scriptView.structureCompleteFailed": "Bổ sung cấu trúc thất bại",
  "scriptView.zhipuMissingSkipViewAnalysis": "Chưa cấu hình API Zhipu. AI sẽ bỏ qua bước phân tích góc nhìn.",
  "scriptView.generatingEpisodeShots": "Đang tạo shot cho Tập {index}...",
  "scriptView.episodeShotsDone": "Đã tạo shot cho Tập {index} với {count} shot",
  "scriptView.allScenesImported": "Toàn bộ cảnh trong kịch bản đã được nhập",
  "scriptView.selectScenesToImport": "Hãy chọn ít nhất một cảnh để nhập",
  "scriptView.charactersImported": "Đã nhập {count} nhân vật vào thư viện",
  "scriptView.scenesImported": "Đã nhập {count} cảnh vào thư viện",
  "scriptView.importScenesTitle": "Nhập cảnh",
  "scriptView.importScenesHint": "Chọn các cảnh từ kịch bản để thêm vào thư viện cảnh.",
  "scriptView.selectAll": "Chọn tất cả",
  "scriptView.importAction": "Nhập ({count})",
  "scriptView.noDescription": "Chưa có mô tả",
  "scriptView.goSceneLibrary": "Đã chuyển đến Thư viện cảnh",
  "scriptView.goSceneLibraryBasic": 'Đã chuyển đến Thư viện cảnh và điền dữ liệu cơ bản cho "{name}"',
  "scriptView.goDirector": "Đã chuyển đến AI Director",
  "scriptView.goDirectorShotFilled": "Đã chuyển đến AI Director và điền nội dung shot",
  "scriptView.goDirectorSceneFilled": 'Đã chuyển đến AI Director và điền "{name}" với {count} shot',
  "scriptView.title": "Trình chỉnh sửa kịch bản",
  "scriptView.statusParsing": "Đang phân tích...",
  "scriptView.statusGeneratingShots": "Đang tạo shot...",
  "scriptView.overwriteStructureTitle": "Ghi đè cấu trúc cảnh hiện có?",
  "scriptView.overwriteStructureBody": "Tập này đã có dữ liệu cảnh. Phân tích lại sẽ thay thế các cảnh hiện tại và xóa các shot liên quan. Bạn có muốn tiếp tục không?",
  "scriptView.confirmOverwrite": "Xác nhận ghi đè",
  "episodeTree.structureAfterParse": "Cấu trúc prompt sẽ hiện ở đây sau khi phân tích kịch bản",
  "episodeTree.generating": "Đang tạo...",
  "episodeTree.refreshShots": "Cập nhật shot",
  "episodeTree.generateShots": "Tạo shot",
  "episodeTree.newScene": "Tạo cảnh mới",
  "episodeTree.edit": "Chỉnh sửa",
  "episodeTree.extras": "Quần chúng / Vai phụ ({count})",
  "episodeTree.editEpisode": "Chỉnh sửa tập",
  "episodeTree.title": "Tiêu đề",
  "episodeTree.description": "Mô tả",
  "episodeTree.editScene": "Chỉnh sửa cảnh",
  "episodeTree.sceneName": "Tên cảnh",
  "episodeTree.confirmAdd": "Xác nhận thêm",
  "episodeTree.editCharacter": "Chỉnh sửa nhân vật",
  "episodeTree.characterName": "Tên nhân vật",
  "episodeTree.confirmDelete": "Xác nhận xóa",
  "episodeTree.cancel": "Hủy",
  "episodeTree.progress": "Tiến độ: {value}",
  "scriptInput.importLabel": "Dán toàn bộ kịch bản hoặc nội dung screenplay để hệ thống phân tích tiếp thành prompt",
  "scriptInput.importPlaceholder": "Có thể dán screenplay hoàn chỉnh, outline dài, hoặc nội dung viết tay. Sau khi có kịch bản, hệ thống sẽ phân tích thành cảnh, shot, nhân vật và prompt nền tảng.",
  "scriptInput.importSuccess": "Đã có kịch bản và phân tích xong. Hãy chọn cảnh hoặc shot ở cột giữa để đi tiếp.",
  "scriptInput.importFailed": "Nhập thất bại: {message}",
  "scriptInput.processing": "Đang xử lý kịch bản...",
  "scriptInput.importScript": "Đọc kịch bản, nhận diện nhân vật và chia shot",
  "scriptInput.cancel": "Hủy",
  "scriptInput.visualStyle": "Phong cách hình ảnh",
  "scriptInput.visualStyleHelp": "Phong cách này sẽ được dùng khi AI hiệu chỉnh tạo mô tả hình ảnh cho shot.",
  "scriptInput.apiNotConfigured": "Chưa cấu hình API",
  "scriptInput.apiNotConfiguredHelp": "Hãy cấu hình API key trong Settings trước",
  "scriptInput.cliStreamingWaiting": "Đang chờ output từ CLI...",
  "scriptInput.scriptSkill": "Skill kịch bản",
  "scriptInput.skillOptionalWorkflow": "workflow linh hoạt tùy chọn",
  "scriptInput.skillOutputs": "Đầu ra",
  "scriptInput.skillMerge": "Merge",
  "scriptInput.chooseSavedSkill": "Chọn skill đã lưu",
  "scriptInput.noSavedSkill": "Chưa có skill đã lưu",
  "scriptInput.skillNamePlaceholder": "Tên skill",
  "scriptInput.skillTextPlaceholder": "Dán skill.md ở đây, hoặc import file .md/.txt",
  "scriptInput.chunkThreshold": "Ngưỡng chia kịch bản",
  "scriptInput.chunkThresholdHelp": "Khi dùng Script Skill, nội dung từ {count} từ trở lên sẽ được chia thành nhiều phần để xử lý ổn định hơn.",
  "scriptInput.importSkillFile": "Nhập",
  "scriptInput.saveSkill": "Lưu",
  "scriptInput.deleteSkill": "Xóa",
  "scriptInput.untitledSkill": "Skill chưa đặt tên",
  "scriptInput.skillUpdated": "Đã cập nhật skill: {name}",
  "scriptInput.skillSaved": "Đã lưu skill: {name}",
  "scriptInput.skillDeleted": "Đã xóa skill",
  "scriptInput.skillFileImported": "Đã nhập file skill: {name}",
  "scriptInput.importWithSkill": "Nhập bằng Skill",
  "scriptInput.runningSkill": "Đang chạy skill",
  "promptStatus.image": "Ảnh",
  "promptStatus.video": "Video",
  "promptStatus.imagePrompt": "imagePrompt",
  "promptStatus.videoPrompt": "videoPrompt",
  "promptStatus.ready": "sẵn sàng",
  "promptStatus.missing": "thiếu",
  "promptStatus.notRequired": "không bắt buộc",
  "scriptInput.generateShotPrompts": "Tạo prompt ảnh/video cho từng shot",
  "scriptInput.step2Incomplete": "Bước 2 chưa hoàn thành. Shot này chỉ có dữ liệu cấu trúc. Chạy tạo prompt để tạo Image Prompt và Video Prompt.",
  "scriptView.exportCsv": "Xuất CSV"
};
const director = {
  "director.noStoryboard": "Không có ảnh storyboard để xử lý",
  "director.enterSceneEditing": "Đã vào chế độ chỉnh sửa cảnh",
  "director.splitDone": "Đã tách thành công thành {count} cảnh",
  "director.splitFailed": "Tách thất bại: {message}",
  "director.generatingStoryboard": "Đang tạo bảng storyboard...",
  "director.generationFailed": "Tạo thất bại",
  "director.unknownError": "Lỗi không xác định",
  "director.regenerate": "Tạo lại",
  "director.noStoryboardImage": "Chưa có ảnh storyboard",
  "director.backToInput": "Quay lại nhập liệu",
  "director.styleSwitched": "Đã chuyển sang phong cách {name}",
  "director.aspectHorizontal": "Ngang",
  "director.aspectVertical": "Dọc",
  "director.aspectSwitched": "Đã chuyển sang chế độ {mode}",
  "director.sceneDeleted": "Đã xóa shot {index}",
  "director.startFrameStopped": "Đã dừng tạo khung đầu cho shot {index}",
  "director.videoStopped": "Đã dừng tạo video cho shot {index}",
  "director.mergeStopped": "Đã dừng tạo gộp",
  "director.frame.start": "khung đầu",
  "director.card.startPromptUpdated": "Đã cập nhật prompt {language} cho khung đầu của shot {index}",
  "director.card.videoPromptUpdated": "Đã cập nhật prompt {language} cho video của shot {index}",
  "director.card.startUploaded": "Đã tải lên khung đầu cho shot {index}",
  "director.card.startRemoved": "Đã xóa khung đầu của shot {index}",
  "director.card.downloadDone": "Đã tải xuống {name}",
  "director.card.downloadFailed": "Tải xuống thất bại",
  "director.card.shot": "Shot #{index}",
  "director.card.scene": "Cảnh: {name}",
  "director.card.location": "Địa điểm: {name}",
  "director.card.deleteShot": "Xóa shot #{index}?",
  "director.card.deleteBody": "Thao tác này sẽ xóa toàn bộ nội dung trong shot và không thể hoàn tác.",
  "director.configureImageMapping": "Hãy cấu hình ánh xạ dịch vụ tạo ảnh trong Settings trước",
  "director.configureImageModel": "Hãy cấu hình mô hình tạo ảnh trong Settings trước",
  "director.userCancelled": "Người dùng đã hủy",
  "director.cannotGeneratePrompts": "Không thể tạo prompt vì thiếu storyboard hoặc shot",
  "director.generatingPrompts": "Đang tạo prompt từ nội dung shot...",
  "director.generatedPrompts": "Đã tạo prompt cho {count} shot ({endCount} shot cần khung cuối)",
  "director.configureVideoModel": "Hãy cấu hình mô hình tạo video trong Settings trước",
  "director.configureVideoMapping": "Hãy cấu hình ánh xạ dịch vụ tạo video trong Settings trước",
  "director.configurePlatformKey": "Hãy cấu hình API key cho {platform} trước",
  "director.noFirstFrame": "Shot {index} chưa có ảnh khung đầu. Hãy tạo ảnh trước.",
  "director.videoDoneSaved": "Đã tạo video cho shot {index} và lưu vào Tài sản",
  "director.skippedModeration": "Shot {index} bị bỏ qua do kiểm duyệt nội dung",
  "director.shotFailed": "Tạo shot {index} thất bại: {message}",
  "director.noShotsToGenerate": "Không có shot nào để tạo",
  "director.missingPromptCount": "Còn {count} shot chưa có prompt. Hệ thống sẽ dùng prompt mặc định.",
  "director.allShotsAlreadyGenerating": "Tất cả shot đã được tạo hoặc đang tạo",
  "director.startSerialVideo": "Bắt đầu tạo nối tiếp {count} video... Mỗi lần xử lý {concurrency} video",
  "director.allVideosDone": "Đã tạo xong tất cả video",
  "director.someVideosDone": "Đã tạo {success}/{total} video, {failed} video thất bại",
  "director.fillStartPromptFirst": "Hãy điền prompt khung đầu trước khi tạo ảnh",
  "director.imageDoneSaved": "Đã tạo ảnh cho shot {index} và lưu vào Tài sản",
  "director.videoSaved": "Đã lưu video của shot {index} vào Tài sản",
  "director.imageSaved": "Đã lưu ảnh của shot {index} vào Tài sản",
  "director.saveFailed": "Lưu thất bại: {message}",
  "director.noSplitScenes": "Chưa có shot nào được tách",
  "director.autoFillPrompts": "AI tự điền prompt",
  "director.aspectRatio": "Tỷ lệ:",
  "director.card.upload": "Tải lên",
  "director.card.generatingElapsed": "Đang tạo {seconds}s",
  "director.card.stop": "Dừng",
  "director.card.downloadStart": "Tải khung đầu",
  "director.card.deleteStart": "Xóa khung đầu",
  "director.card.regenerate": "Tạo lại",
  "director.card.generateImage": "Tạo ảnh",
  "director.card.generateVideo": "Tạo video",
  "director.card.moderationSkipped": "Bị bỏ qua do kiểm duyệt",
  "director.card.prompts": "Prompt",
  "director.card.startFrame": "Khung đầu",
  "director.card.video": "Video",
  "director.card.unset": "Chưa đặt",
  "director.card.mode.imageVideo": "Ảnh + Video",
  "director.card.mode.imageOnly": "Chỉ tạo ảnh",
  "director.card.mode.textToVideo": "Text to Video",
  "director.card.mode.noPrompts": "Chưa có prompt",
  "director.card.noImagePrompt": "thiếu imagePrompt",
  "director.card.noVideoPrompt": "thiếu videoPrompt",
  "director.card.startFramePrompt": "Prompt khung đầu (ảnh tĩnh)",
  "director.card.startFramePlaceholder": "Mô tả ảnh tĩnh cho khung đầu...",
  "director.card.videoPrompt": "Prompt video (hành động động)",
  "director.card.videoPlaceholder": "Mô tả chuyển động, hành động và các thay đổi trong video...",
  "director.preview.shot": "Shot {index}",
  "director.preview.shotFrame": "Shot {index} - {frame}",
  "director.preview.shotVideo": "Shot {index} - Video",
  "director.preview.aiShotVideo": "Shot {index} - Video AI",
  "director.editingHeader": "Chỉnh sửa shot",
  "director.shotCount": "{count} shot",
  "director.fillImagesFromFolder": "Fill ảnh từ folder",
  "director.fillImagesBusy": "Đang fill ảnh...",
  "director.fillImagesNoImages": "Không tìm thấy ảnh hỗ trợ trong folder",
  "director.fillImagesNoMissingShots": "Tất cả shot đã có ảnh rồi",
  "director.fillImagesDone": "Đã fill {count} ảnh vào shot",
  "director.fillImagesFailed": "Có {count} ảnh import lỗi",
  "director.fillImagesRemaining": "Còn {count} shot chưa có ảnh",
  "director.fillImagesExtra": "Bỏ qua {count} ảnh dư",
  "director.refToVideoIgnoredNotice": "Shot này đang ở chế độ ref-to-video. Dữ liệu khung đầu, khung cuối và prompt ảnh cũ sẽ bị bỏ qua.",
  "director.regenerateStoryboard": "Tạo lại",
  "director.endFrameUsesShot": "Khung cuối: Shot {index}",
  "director.noLinkedEndFrame": "Không có khung cuối",
  "director.generateAll": "Tạo toàn bộ flow",
  "director.generateAllImages": "Tạo tất cả ảnh shot",
  "director.generateImagesButton": "Tạo ảnh ({ready}/{total})",
  "director.clearShotSelection": "Bỏ chọn",
  "director.mergedRunning": "Đang tạo...",
  "director.allImagesReady": "Tất cả shot đã có ảnh rồi",
  "director.allImagesRequiredBeforeVideo": "Cần tất cả shot có ảnh trước khi tạo video",
  "director.missingPromptWarning": "Một số shot còn thiếu prompt. Hãy bấm vào vùng chữ dưới mỗi shot để chỉnh sửa.",
  "director.addBlankShot": "Thêm shot trống",
  "director.generateVideosButton": "Tạo tất cả video ({ready}/{total})",
  "director.imageReadyCounts": "Đã có ảnh cho {ready} shot, còn {needImage} shot trống sẽ được tạo ảnh",
  "director.videoReadyCounts": "{withImages} shot đã có ảnh, nút này sẽ tạo video cho {needVideo} shot đủ điều kiện",
  "director.bottomHint": "Hãy bấm vào vùng chữ dưới mỗi shot để chỉnh prompt video. Di chuột lên shot để xóa những shot không cần thiết.",
  "director.context.noScript": "Chưa có dữ liệu kịch bản",
  "director.context.goScript": "Hãy mở panel Kịch bản và phân tích kịch bản trước",
  "director.context.goScriptButton": "Đi tới Kịch bản",
  "director.context.progress": "Tiến độ: {value}",
  "director.context.hint": "Bấm vào cảnh hoặc shot để gửi vào phần nhập của AI Director",
  "director.context.addedCount": "Đã thêm {count} shot vào danh sách chỉnh sửa",
  "director.context.addEpisode": "Thêm toàn bộ tập vào phần chỉnh sửa",
  "director.context.sendShotOrAdd": "Bấm: gửi sang AI Director | Bấm đúp: thêm trực tiếp vào phần chỉnh sửa",
  "director.context.addToEditing": "Thêm vào phần chỉnh sửa",
  "director.context.addMode": "+ Thêm vào shot (tạo ảnh riêng lẻ)",
  "director.context.sendMode": "-> Gửi vào input (tiết kiệm hơn khi tạo hàng loạt)",
  "director.context.backToScript": "Quay lại Kịch bản",
  "director.context.structure": "Cấu trúc kịch bản",
  "director.storyboardReady": "Storyboard đã sẵn sàng",
  "director.emptySplitResult": "Kết quả cắt rỗng. Hãy kiểm tra lại ảnh storyboard có hợp lệ không.",
  "director.splitting": "Đang cắt...",
  "director.splitFailedTitle": "Cắt thất bại",
  "director.sceneImagePreview": "Xem trước ảnh cảnh",
  "director.generationComplete": "Tạo hoàn tất",
  "director.screenplayPreview": "Xem trước kịch bản",
  "director.completedCount": "{completed} / {total} cảnh",
  "director.pendingStatus": "Chờ xử lý",
  "director.failedStatus": "Thất bại",
  "director.estimatedRemaining": "Ước tính thời gian còn lại: {time}",
  "director.lessThanOneMinute": "dưới 1 phút",
  "director.aboutMinutes": "khoảng {minutes} phút",
  "director.aboutHoursMinutes": "khoảng {hours} giờ {minutes} phút",
  "director.previewStatus": "Xem trước",
  "director.editingStatus": "Chỉnh sửa cảnh",
  "director.errorStatus": "Lỗi",
  "director.readyStatus": "Sẵn sàng",
  "director.apiShort": "API",
  "director.configureApiShort": "Cấu hình API",
  "director.previousStep": "Bước trước",
  "director.nextStep": "Bước tiếp",
  "director.storyboardProgress": "Storyboard {progress}%",
  "director.imageProgress": "Ảnh {progress}%",
  "director.imagesReady": "Ảnh đã sẵn sàng",
  "director.videoProgress": "Video {progress}%",
  "director.aiBadge": "AI",
  "director.describeVideo": "Mô tả video bạn muốn tạo",
  "director.examplePrompts": "Prompt mẫu",
  "director.selectCharacters": "Chọn nhân vật",
  "director.characterLibraryEmpty": "Thư viện nhân vật đang trống",
  "director.referenceImagesOptional": "Ảnh tham chiếu (tùy chọn)",
  "director.apiNotConfigured": "Chưa cấu hình API",
  "director.screenplayPlaceholder": "Ví dụ: một chú mèo con dễ thương đang chơi trên bãi cỏ...",
  "director.aspectRatioLabel": "Tỷ lệ",
  "director.selectRatio": "Chọn tỷ lệ",
  "director.resolutionLabel": "Độ phân giải",
  "director.selectResolution": "Chọn độ phân giải",
  "director.selectSceneCount": "Chọn số cảnh",
  "director.visualStyleLabel": "Phong cách hình ảnh",
  "director.selectStyleRandom": "Chọn phong cách (để trống nếu muốn ngẫu nhiên)",
  "director.generatingScreenplay": "Đang tạo kịch bản...",
  "director.deleteAllScenes": "Xóa toàn bộ cảnh",
  "director.title": "AI Đạo diễn",
  "director.doubleClickEdit": "Nhấp đúp để chỉnh sửa",
  "director.selectCharactersLabel": "Chọn nhân vật",
  "director.charactersSelected": "Đã chọn {count}",
  "director.characterLibrary": "Thư viện nhân vật",
  "director.goCreateCharacter": "Đi tạo nhân vật",
  "director.generationProgressTitle": "Tiến độ tạo",
  "director.chooseEmotionTags": "Chọn tâm trạng",
  "director.deleteScene": "Xóa cảnh",
  "director.sceneNarrationPlaceholder": "Nhập lời dẫn cảnh...",
  "director.shotLabel": "Shot",
  "director.actionLabel": "Hành động",
  "director.scenesLabel": "Cảnh",
  "director.referencePreview": "Xem trước tham chiếu",
  "director.sceneReference": "Tham chiếu cảnh",
  "director.shotReference": "Tham chiếu shot",
  "director.selectShotReference": "Chọn tham chiếu shot",
  "director.shotReferencesSelected": "{count} shot ref",
  "director.noOtherShots": "Không có shot khác",
  "director.shotsLabel": "Shot",
  "director.selectGeneratedShotHint": "Chọn một shot đã có ảnh",
  "director.missingShotRefs": "Thiếu ảnh tham chiếu: {refs}",
  "director.selectSceneReference": "Chọn tham chiếu cảnh",
  "director.clearSelection": "Xóa lựa chọn",
  "director.emptySceneLibrary": "Thư viện cảnh đang trống. Hãy tạo cảnh trước.",
  "director.sceneNumber": "Cảnh {id}",
  "director.random": "Ngẫu nhiên",
  "director.clear": "Xóa",
  "director.retry": "Thử lại",
  "director.cancel": "Hủy",
  "director.save": "Lưu",
  "director.moodLabel": "Cảm xúc",
  "director.generateAudio": "Tạo âm thanh",
  "director.completedStatus": "Hoàn tất",
  "director.selectSceneHint": "Chọn một cảnh",
  "director.videoLabel": "Video",
  "director.generatingStatus": "Đang tạo...",
  "director.generateVideo": "Tạo video",
  "director.videoStoryboardFallback": "Storyboard video",
  "director.sceneImagePreviewHint": "Xem lại ảnh đã tạo. Có thể tạo lại hoặc xóa cảnh nếu chưa ưng ý.",
  "director.sceneCount": "{count} cảnh",
  "director.confirmAndGenerateVideo": "Xác nhận và tạo video",
  "director.cancelGeneration": "Hủy tạo",
  "director.allScenesGenerated": "Tất cả cảnh đã hoàn tất, tài sản đã được thêm vào thư viện media.",
  "director.createNewScreenplay": "Tạo kịch bản mới",
  "director.fromMediaLibrary": "Từ thư viện media",
  "director.selectImageApplyTo": "Chọn ảnh để áp dụng cho {target}",
  "director.totalImagesCount": "{count} ảnh",
  "director.mediaLibraryEmpty": "Chưa có ảnh nào trong thư viện media. Hãy thêm ảnh hoặc tạo lưới bốn ảnh trước.",
  "director.all": "Tất cả",
  "director.noVideoToSave": "Không có video để lưu",
  "director.noImageToSave": "Không có ảnh để lưu",
  "director.step.storyInput": "Nhập câu chuyện",
  "director.step.previewStoryboard": "Xem trước storyboard",
  "director.step.editScenes": "Chỉnh sửa cảnh",
  "director.noCharacterRefs": "Không tìm thấy ảnh nhân vật tham chiếu. Vui lòng thêm ảnh nhân vật ở tab Nhân vật trước.",
  "director.videoModeLabel": "Chế độ video",
  "director.frameInputLabel": "Đầu vào khung hình",
  "director.imageToVideoOption": "Ảnh sang video",
  "director.refToVideoOption": "Tham chiếu sang video",
  "director.startFrameOption": "Khung đầu",
  "director.startEndFrameOption": "Khung đầu + cuối",
  "director.referenceImagesOption": "Ảnh tham chiếu",
  "director.betaLabel": "Beta"
};
const characters = {
  "characters.finalImagePrompt": "Prompt tạo ảnh cuối",
  "characters.exportCurrentView": "Xuất góc nhìn hiện tại",
  "characters.referenceImages": "Ảnh tham chiếu",
  "characters.referenceAlt": "Ảnh tham chiếu {index}",
  "characters.previewBadge": "Xem trước",
  "characters.discardBack": "Bỏ và quay lại",
  "characters.imageSaving": "Đang lưu ảnh vào máy...",
  "characters.descriptionPlaceholder": "Mô tả ngắn dùng cho @nhân vật trong Đạo diễn, không dùng để tạo ảnh nhân vật...",
  "characters.enterDescription": "Hãy nhập mô tả nhân vật",
  "characters.savedLocal": "Đã lưu bảng nhân vật vào máy",
  "characters.saveFailed": "Lưu thất bại",
  "characters.console": "Bảng điều khiển tạo bảng nhân vật",
  "characters.name": "Tên nhân vật",
  "characters.namePlaceholder": "ví dụ: Tiểu Minh, Doraemon",
  "characters.description": "Mô tả nhân vật",
  "characters.shortDescriptionPlaceholder": "Prompt gốc để tạo ảnh nhân vật, chưa gồm style/sheet/ảnh tham chiếu...",
  "characters.galleryTitle": "Thư viện nhân vật",
  "characters.search": "Tìm nhân vật...",
  "characters.importCsv": "Nhập CSV",
  "characters.exportCsv": "Xuất CSV",
  "characters.csvExported": "Đã xuất {count} nhân vật ra CSV.",
  "characters.fillImages": "Điền ảnh theo tên",
  "characters.imagesFilled": "Đã điền {filled} ảnh nhân vật; bỏ qua {skipped}.",
  "characters.csvNeedsProject": "Hãy mở một dự án trước khi nhập CSV nhân vật.",
  "characters.csvImported": "CSV nhân vật: tạo {created}, điền thêm {updated}, giữ nguyên {unchanged}, bỏ qua {skipped}.",
  "characters.csvImportFailed": "Không thể nhập CSV nhân vật: {message}",
  "characters.thisEpisode": "Tập này",
  "characters.fullSeries": "Toàn bộ phim",
  "characters.folders": "Thư mục",
  "characters.count": "Nhân vật ({count})",
  "characters.moved": "Đã di chuyển nhân vật",
  "characters.doubleClickPreview": "Bấm đúp để xem ảnh đầy đủ",
  "characters.noDescription": "Chưa có mô tả",
  "characters.noMatch": "Không tìm thấy nhân vật phù hợp",
  "characters.noCharactersYet": "Chưa có nhân vật nào",
  "characters.useConsole": "Hãy dùng bảng điều khiển bên trái để tạo nhân vật",
  "characters.createFolder": "Tạo thư mục",
  "characters.folderName": "Tên thư mục",
  "characters.renameFolder": "Đổi tên thư mục",
  "characters.save": "Lưu",
  "characters.aspectRatio": "Tỷ lệ",
  "characters.voiceId": "Giọng đọc",
  "characters.voiceNone": "Không có giọng",
  "characters.regenerateImage": "Tạo lại ảnh",
  "characters.saveCharacterSettings": "Lưu cài đặt nhân vật",
  "characters.settingsUpdated": "Đã cập nhật thông tin nhân vật",
  "characters.detailEmpty": "Chọn một nhân vật để xem chi tiết",
  "characters.deleted": "Đã xóa nhân vật",
  "characters.exportSuccess": "Đã xuất {name}.png thành công",
  "characters.exportFailed": "Xuất thất bại",
  "characters.info": "Thông tin nhân vật",
  "characters.characterPrompt": "Prompt nhân vật",
  "characters.dragHint": "Ảnh nhân vật có thể kéo vào panel AI Director để sử dụng.",
  "characters.deleteCharacter": "Xóa nhân vật",
  "characters.deleteCharacterConfirm": 'Bạn có chắc muốn xóa nhân vật "{name}" không? Hành động này không thể hoàn tác.',
  "characters.deleteFolder": "Xóa thư mục",
  "characters.deleteFolderConfirm": 'Bạn có chắc muốn xóa thư mục "{name}" không? Các nhân vật bên trong sẽ được chuyển về thư mục gốc.',
  "characters.folderDeleted": "Đã xóa thư mục",
  "characters.create": "Tạo",
  "characters.createAll": "Tạo tất cả ({count})",
  "characters.stopAll": "Dừng tất cả",
  "characters.openDetails": "Mở chi tiết",
  "characters.generateImage": "Tạo ảnh nhân vật",
  "characters.previewImage": "Xem trước ảnh nhân vật",
  "characters.saveImage": "Lưu ảnh nhân vật",
  "characters.imageReady": "Đã có ảnh",
  "characters.noImageYet": "Chưa có ảnh",
  "characters.generateImageHint": "Nhân vật chưa có ảnh đại diện.",
  "characters.generatedImage": "Đã tạo ảnh cho {name}.",
  "characters.generateImageFailed": "Không thể tạo ảnh cho {name}: {message}",
  "characters.syncFlowMissing": "Đồng bộ Flow · thiếu {count}",
  "characters.syncFlowProgress": "Flow {synced}/{total}",
  "characters.syncFlowOffline": "Flow ngoại tuyến",
  "characters.syncingFlow": "Đang đồng bộ Flow {count} TK...",
  "characters.syncFlowTitle": "Đồng bộ ảnh trong thư viện Nhân vật lên mọi tài khoản Flow đang sẵn sàng",
  "characters.syncFlowPartial": "Đồng bộ chưa hoàn tất: tải mới {uploaded}, bỏ qua {skipped}; {failed} tài khoản có lỗi.",
  "characters.syncFlowSuccess": "Đồng bộ xong {accounts} TK: tải mới {uploaded}, bỏ qua {skipped} ảnh đã có.",
  "characters.syncFlowError": "Không thể đồng bộ ảnh nhân vật."
};
const scenes = {
  "scenes.untitled": "Cảnh chưa đặt tên",
  "scenes.libraryTitle": "Thư viện cảnh",
  "scenes.search": "Tìm cảnh...",
  "scenes.importCsv": "Nhập CSV",
  "scenes.exportCsv": "Xuất CSV",
  "scenes.csvExported": "Đã xuất {count} cảnh ra CSV.",
  "scenes.fillImages": "Điền ảnh theo tên",
  "scenes.imagesFilled": "Đã điền {filled} ảnh cảnh; bỏ qua {skipped}.",
  "scenes.csvNeedsProject": "Hãy mở một dự án trước khi nhập CSV cảnh.",
  "scenes.csvImported": "CSV cảnh: tạo {created}, điền thêm {updated}, giữ nguyên {unchanged}, bỏ qua {skipped}.",
  "scenes.csvImportFailed": "Không thể nhập CSV cảnh: {message}",
  "scenes.folders": "Thư mục",
  "scenes.count": "Cảnh ({count})",
  "scenes.moved": "Đã di chuyển cảnh",
  "scenes.noMatch": "Không tìm thấy cảnh phù hợp",
  "scenes.noScenesYet": "Chưa có cảnh nào",
  "scenes.useConsole": "Hãy dùng bảng điều khiển bên trái để tạo cảnh",
  "scenes.createFolder": "Tạo thư mục",
  "scenes.folderName": "Tên thư mục",
  "scenes.renameFolder": "Đổi tên thư mục",
  "scenes.folderCreated": "Đã tạo thư mục",
  "scenes.folderRenamed": "Đã đổi tên thư mục",
  "scenes.folderDeleted": "Đã xóa thư mục",
  "scenes.deleteFolder": "Xóa thư mục",
  "scenes.deleted": "Đã xóa cảnh",
  "scenes.detailEmpty": "Chọn một cảnh để xem chi tiết",
  "scenes.saveSceneSettings": "Lưu cài đặt cảnh",
  "scenes.sceneSettingsUpdated": "Đã lưu cài đặt cảnh",
  "scenes.readLocalFailed": "Không thể đọc ảnh cục bộ",
  "scenes.exportFailed": "Xuất thất bại",
  "scenes.info": "Thông tin cảnh",
  "scenes.description": "Mô tả cảnh",
  "scenes.descriptionPlaceholder": "Nhập mô tả ngắn dùng cho Đạo diễn và @scene[...]...",
  "scenes.scenePrompt": "Prompt cảnh",
  "scenes.scenePromptPlaceholder": "Nhập scene prompt để AI tạo ảnh tham chiếu...",
  "scenes.finalImagePrompt": "Prompt tạo ảnh cuối",
  "scenes.exportConcept": "Xuất ảnh concept",
  "scenes.deleteScene": "Xóa cảnh",
  "scenes.tipDrag": "Ảnh concept cảnh có thể kéo vào panel AI Director để sử dụng.",
  "scenes.tipConsistency": "Giữ ánh sáng và bóng đổ nhất quán trong cùng một cảnh.",
  "scenes.enterName": "Hãy nhập tên cảnh",
  "scenes.enterLocation": "Hãy nhập mô tả địa điểm",
  "scenes.created": "Đã tạo cảnh",
  "scenes.selectOrCreate": "Hãy chọn hoặc tạo cảnh trước",
  "scenes.conceptReady": "Đã tạo xong ảnh concept cảnh. Hãy xem trước trước khi lưu.",
  "scenes.savedLocal": "Đã lưu ảnh concept cảnh vào máy",
  "scenes.saveFailed": "Lưu thất bại",
  "scenes.autoCreated": 'Đã tự tạo cảnh "{name}"',
  "scenes.imageAspectRatio": "Tỷ lệ",
  "scenes.saveConcept": "Lưu ảnh concept",
  "scenes.generateConcept": "Tạo ảnh concept cảnh",
  "scenes.generateAllImages": "Tạo tất cả ({count})",
  "scenes.generatingAllImages": "Đang tạo tất cả ảnh cảnh...",
  "scenes.noImagesToGenerate": "Không có cảnh nào cần tạo ảnh",
  "scenes.generatedImagesAll": "Đã tạo tất cả {count} ảnh cảnh",
  "scenes.uploadedSceneImage": "Đã upload ảnh cảnh",
  "scenes.imageReady": "Ảnh cảnh sẵn sàng",
  "scenes.imageMissing": "Chưa có ảnh cảnh",
  "scenes.openDetails": "Mở chi tiết",
  "scenes.generateSceneImage": "Tạo ảnh cảnh",
  "scenes.generateImageFailed": "Không thể tạo ảnh cảnh cho {name}: {message}",
  "scenes.referenceImage": "Ảnh tham chiếu cảnh",
  "scenes.removedReferenceImage": "Đã xóa ảnh cảnh, prompt và cài đặt vẫn được giữ nguyên",
  "scenes.removeReferenceImage": "Xóa ảnh cảnh, giữ nguyên prompt và cài đặt",
  "scenes.imageStyle": "Phong cách ảnh",
  "scenes.previewFullImage": "Xem ảnh đầy đủ",
  "scenes.expandChildren": "Mở rộng cảnh con",
  "scenes.collapseChildren": "Thu gọn cảnh con",
  "scenes.previewTitle": "Xem trước ảnh concept cảnh",
  "scenes.previewAlt": "Xem trước ảnh concept cảnh",
  "scenes.previewBadge": "Xem trước",
  "scenes.regenerateConcept": "Tạo lại ảnh concept",
  "scenes.discardBack": "Bỏ và quay lại",
  "scenes.console": "Bảng điều khiển tạo ảnh",
  "scenes.name": "Tên cảnh",
  "scenes.namePlaceholder": "ví dụ: phố thành thị, căn nhà gỗ trong rừng",
  "scenes.references": "Ảnh tham chiếu",
  "scenes.aiUsesRefs": "AI sẽ dùng các ảnh này làm tham chiếu khi tạo ảnh concept cảnh",
  "scenes.syncFlowMissing": "Đồng bộ Flow · thiếu {count}",
  "scenes.syncFlowProgress": "Flow {synced}/{total}",
  "scenes.syncFlowOffline": "Flow ngoại tuyến",
  "scenes.syncingFlow": "Đang đồng bộ Flow {count} TK...",
  "scenes.syncFlowTitle": "Đồng bộ ảnh trong thư viện Cảnh lên mọi tài khoản Flow đang sẵn sàng",
  "scenes.syncFlowPartial": "Đồng bộ chưa hoàn tất: tải mới {uploaded}, bỏ qua {skipped}; {failed} tài khoản có lỗi.",
  "scenes.syncFlowSuccess": "Đồng bộ xong {accounts} TK: tải mới {uploaded}, bỏ qua {skipped} ảnh đã có.",
  "scenes.syncFlowError": "Không thể đồng bộ ảnh cảnh."
};
const generation = {
  "stylePicker.placeholder": "Chọn phong cách",
  "stylePicker.myStyles": "Phong cách của tôi",
  "stylePicker.category.real": "Thật",
  "stylePicker.category.stopMotion": "Stop motion",
  "stylePicker.addStyle": "Thêm phong cách",
  "stylePicker.editStyle": "Sửa phong cách",
  "stylePicker.styleName": "Tên phong cách",
  "stylePicker.styleNamePlaceholder": "Ví dụ: Người que vẽ tay tối giản",
  "stylePicker.prompt": "Prompt phong cách",
  "stylePicker.promptPlaceholder": "Mô tả phong cách hình ảnh...",
  "stylePicker.negativePrompt": "Prompt phủ định (không bắt buộc)",
  "stylePicker.negativePromptPlaceholder": "Các yếu tố cần tránh...",
  "stylePicker.save": "Lưu phong cách",
  "stylePicker.deleteTitle": "Xóa phong cách?",
  "stylePicker.deleteDescription": "Phong cách “{name}” sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
  "freedom.generating": "Đang tạo...",
  "voice.mode": "Chế độ voice",
  "voice.mode.off": "Tắt",
  "voice.mode.selective": "Theo cảnh",
  "voice.mode.ref": "Tham chiếu nhân vật",
  "voice.mode.full": "Full voice",
  "voice.narrator": "Giọng narrator",
  "voice.selectNarrator": "Chọn giọng narrator",
  "voice.sceneUnassigned": "Voice: {mode} chưa gán"
};
const media = {
  "autoVideo.title": "Auto Video",
  "autoVideo.subtitle": "Render MP4 từ Audio + SRT + Ảnh",
  "autoVideo.stage.import": "Nhập",
  "autoVideo.stage.editor": "Chỉnh sửa",
  "autoVideo.stage.render": "Xuất video",
  "autoVideo.import.audio": "Audio",
  "autoVideo.import.audioDrop": "Kéo thả file audio (.mp3, .wav, .m4a, .flac, .ogg) hoặc click để chọn",
  "autoVideo.import.srtSource": "Nguồn SRT",
  "autoVideo.import.srtViaApi": "Whisper API",
  "autoVideo.import.srtViaImport": "Import file .srt",
  "autoVideo.import.provider": "Provider",
  "autoVideo.import.apiKey": "API Key",
  "autoVideo.import.apiKeyHint": "Lấy API key tại: {url}",
  "autoVideo.import.language": "Ngôn ngữ audio",
  "autoVideo.import.languageAuto": "Tự nhận diện",
  "autoVideo.import.transcribe": "Bắt đầu transcribe",
  "autoVideo.import.uploadSrt": "Chọn file .srt",
  "autoVideo.import.csvOptional": "CSV ánh xạ ảnh (không bắt buộc)",
  "autoVideo.import.csvDrop": "Kéo thả .csv với cột: index, text, image_path, voice",
  "autoVideo.import.csvLoaded": "Đã tải {count} dòng CSV",
  "autoVideo.editor.totalDuration": "Tổng thời lượng",
  "autoVideo.editor.segments": "{n} câu",
  "autoVideo.editor.missingImages": "{n} câu thiếu ảnh",
  "autoVideo.editor.autoFillFolder": "Tự điền từ folder",
  "autoVideo.editor.proceedRender": "Tiến hành render →",
  "autoVideo.editor.dropImage": "Kéo ảnh vào đây",
  "autoVideo.editor.lowConfidence": "Độ khớp thấp",
  "autoVideo.render.title": "Đang render video",
  "autoVideo.render.openFolder": "Mở thư mục",
  "autoVideo.render.openVideo": "Xem video",
  "autoVideo.render.renderAgain": "Render lại",
  "autoVideo.render.failed": "Render thất bại",
  "autoVideo.render.copyLog": "Copy log",
  "autoVideo.mediaMode.title": "Chế độ media",
  "autoVideo.mediaMode.imagePath": "Image path",
  "autoVideo.mediaMode.videoPath": "Video path",
  "autoVideo.mediaMode.help": "Mặc định dùng image_path. Khi chọn video_path, mỗi dòng ưu tiên video_path; nếu thiếu video thì fallback sang image_path.",
  "autoVideo.import.savedChanges": "Đã lưu {count} thay đổi",
  "autoVideo.import.filePathMissing": "Không lấy được path file",
  "autoVideo.import.desktopPathMissing": "Không lấy được đường dẫn file (chỉ hoạt động trong app desktop)",
  "autoVideo.import.unsupportedFormat": "Định dạng không hỗ trợ: .{ext}",
  "autoVideo.import.unsupportedVideoFormat": "Định dạng video không hỗ trợ: .{ext}",
  "autoVideo.import.audioReadFailed": "Không đọc được audio: {message}",
  "autoVideo.import.srtInvalid": "SRT không hợp lệ",
  "autoVideo.import.srtLoaded": "Đã nạp {count} câu từ SRT",
  "autoVideo.import.csvInvalid": "CSV không hợp lệ",
  "autoVideo.import.csvRowsLoaded": "Đã nạp {count} dòng CSV",
  "autoVideo.import.apiKeyRequired": "Hãy nhập API key trước",
  "autoVideo.import.progressStart": "Bắt đầu...",
  "autoVideo.import.progressProbing": "Đang đọc audio...",
  "autoVideo.import.progressChunking": "Đang chia nhỏ audio...",
  "autoVideo.import.progressUploading": "Đang upload chunks...",
  "autoVideo.import.progressMerging": "Ghép timestamp...",
  "autoVideo.import.progressDone": "Xong",
  "autoVideo.import.transcribeFailed": "Transcribe thất bại",
  "autoVideo.import.srtParseFailed": "Không parse được SRT: {message}",
  "autoVideo.import.complete": "Hoàn tất",
  "autoVideo.import.transcribeComplete": "Transcribe xong: {count} câu",
  "autoVideo.import.cancelled": "Đã hủy",
  "autoVideo.import.cancel": "Hủy",
  "autoVideo.import.srtReady": "Đã có {count} câu trong SRT",
  "autoVideo.import.downloadCsv": "Tải CSV",
  "autoVideo.import.unsavedChanges": "{count} thay đổi chưa lưu",
  "autoVideo.import.discard": "Bỏ",
  "autoVideo.import.save": "Lưu",
  "autoVideo.import.voice": "Voice",
  "autoVideo.import.image": "Image",
  "autoVideo.import.video": "Video",
  "autoVideo.import.clearImage": "Xoá ảnh",
  "autoVideo.import.clearVideo": "Xoá video",
  "autoVideo.import.chooseImage": "+ chọn ảnh",
  "autoVideo.import.chooseVideo": "+ chọn video",
  "autoVideo.import.videoFallbackHint": "Thiếu video_path, sẽ fallback sang image_path",
  "autoVideo.import.fallbackImage": "fallback ảnh",
  "autoVideo.editor.videoCount": "Video: {count}",
  "autoVideo.editor.fallbackImages": "Fallback ảnh: {count}",
  "autoVideo.editor.lowConfidenceCount": "{count} câu khớp thấp",
  "autoVideo.editor.noSegments": "Chưa có câu nào. Quay lại bước Nhập.",
  "autoVideo.editor.noVideosInFolder": "Không thấy video nào trong folder",
  "autoVideo.editor.noImagesInFolder": "Không thấy ảnh nào trong folder",
  "autoVideo.editor.filledVideos": "Đã điền {count} video vào câu thiếu video",
  "autoVideo.editor.filledImages": "Đã điền {count} ảnh vào câu thiếu",
  "autoVideo.editor.autoFillVideoFolder": "Tự điền folder video",
  "autoVideo.editor.back": "Quay lại",
  "autoVideo.editor.effects": "Hiệu ứng",
  "autoVideo.editor.randomEffectsDone": "Đã random {count} hiệu ứng",
  "autoVideo.editor.transitions": "Chuyển cảnh",
  "autoVideo.editor.applyAll": "Tất cả",
  "autoVideo.editor.applyRandomCount": "Random số lượng",
  "autoVideo.editor.applyRandom": "Random",
  "autoVideo.editor.randomTransitionsDone": "Đã random {count} chuyển cảnh",
  "autoVideo.editor.clearEffects": "Clear hiệu ứng",
  "autoVideo.editor.clearTransitions": "Clear chuyển cảnh",
  "autoVideo.editor.sfx": "SFX",
  "autoVideo.editor.chooseSfxFolder": "Chọn folder SFX",
  "autoVideo.editor.noSfxInFolder": "Không thấy SFX nào trong folder",
  "autoVideo.editor.noSfxSelected": "Chưa chọn folder SFX",
  "autoVideo.editor.loadedSfx": "Đã nạp {count} SFX",
  "autoVideo.editor.sfxLoaded": "{count} SFX",
  "autoVideo.editor.randomSfxDone": "Đã random {count} SFX",
  "autoVideo.editor.clearSfx": "Clear SFX",
  "autoVideo.editor.effect": "Hiệu ứng",
  "autoVideo.editor.transitionNext": "Chuyển cảnh tiếp theo",
  "autoVideo.editor.effectNone": "không",
  "autoVideo.editor.effectZoomIn": "zoom in",
  "autoVideo.editor.effectZoomOut": "zoom out",
  "autoVideo.editor.effectPanLeft": "pan trái",
  "autoVideo.editor.effectPanRight": "pan phải",
  "autoVideo.editor.effectPanUp": "pan lên",
  "autoVideo.editor.effectPanDown": "pan xuống",
  "autoVideo.editor.effectZoomPanLeft": "zoom + pan trái",
  "autoVideo.editor.effectZoomPanRight": "zoom + pan phải",
  "autoVideo.editor.transitionFade": "fade",
  "autoVideo.editor.transitionFadeSlow": "fade chậm",
  "autoVideo.editor.transitionDipWhite": "dip trắng",
  "autoVideo.editor.transitionFlashWhite": "flash trắng",
  "autoVideo.editor.dropVideo": "Thả video",
  "autoVideo.render.segmentProgress": "Segment {index}/{total}",
  "autoVideo.render.segmentDone": "Xong {index}/{total}",
  "autoVideo.render.unresolvedImage": "Không resolve được {count} ảnh local-image sang file thật.",
  "autoVideo.render.unresolvedVideo": "Không resolve được {count} video local-image sang file thật.",
  "autoVideo.render.resolveMediaFailed": "Không resolve được media để render",
  "autoVideo.render.starting": "Bắt đầu...",
  "autoVideo.render.failedFallback": "Render thất bại",
  "autoVideo.render.done": "Render xong",
  "autoVideo.render.cancelled": "Đã hủy",
  "autoVideo.render.statSentences": "Câu",
  "autoVideo.render.statDuration": "Tổng thời lượng",
  "autoVideo.render.statMissingMedia": "Thiếu media",
  "autoVideo.render.statMissingImages": "Câu thiếu ảnh",
  "autoVideo.render.diagnostics": "Chẩn đoán render",
  "autoVideo.render.diagnosticsSummary": "Mode: {mode}. Ảnh: {images}/{total}. Video: {videos}/{total}. Fallback ảnh: {fallback}. Thiếu media: {missing}.",
  "autoVideo.render.noImagePath": "Không có imagePath nào trong segments, render sẽ ra nền đen.",
  "autoVideo.render.settings": "Cài đặt render",
  "autoVideo.render.resolution": "Độ phân giải",
  "autoVideo.render.gpuRequired": "Cần GPU NVIDIA",
  "autoVideo.render.qualityHigh": "18 (chất lượng cao)",
  "autoVideo.render.fileSmall": "28 (file nhỏ)",
  "autoVideo.render.cancelRender": "Hủy render",
  "autoVideo.render.startRender": "Bắt đầu render",
  "autoVideo.render.copySuccess": "Đã copy log",
  "autoVideo.render.logTitle": "Nhật ký render",
  "autoVideo.render.copy": "Copy",
  "autoVideo.render.emptyLog": "Chưa có log. Bấm Bắt đầu render để ghi thông tin debug.",
  "autoVideo.render.overlayTitle": "Lớp phủ",
  "autoVideo.render.burnSubtitles": "Đốt phụ đề vào video",
  "autoVideo.render.subtitleFontSize": "Cỡ chữ phụ đề",
  "autoVideo.render.subtitleFontAuto": "Tự động",
  "autoVideo.render.bgm": "Nhạc nền",
  "autoVideo.render.bgmChoose": "Chọn nhạc",
  "autoVideo.render.bgmLoaded": "Đã chọn nhạc nền",
  "autoVideo.render.bgmPathMissing": "Chọn file từ đĩa để lấy đường dẫn",
  "autoVideo.render.bgmVolume": "Âm lượng nhạc nền",
  "autoVideo.render.bgmDuck": "Hạ nhạc khi có giọng đọc",
  "autoVideo.ttsGen.title": "Tạo giọng đọc (TTS)",
  "autoVideo.ttsGen.help": "Tạo file audio từ lời thoại trong CSV (cột voice) hoặc text nhập tay.",
  "autoVideo.ttsGen.engine": "Engine",
  "autoVideo.ttsGen.omnivoice": "OmniVoice",
  "autoVideo.ttsGen.capcut": "CapCut",
  "autoVideo.ttsGen.gemini": "Gemini",
  "autoVideo.ttsGen.voice": "Giọng",
  "autoVideo.ttsGen.language": "Ngôn ngữ",
  "autoVideo.ttsGen.source": "Nguồn text",
  "autoVideo.ttsGen.fromCsv": "Từ CSV ({count} dòng)",
  "autoVideo.ttsGen.customText": "Nhập tay",
  "autoVideo.ttsGen.textPlaceholder": "Dán text cần đọc vào đây, mỗi dòng = 1 câu...",
  "autoVideo.ttsGen.csvSummary": "Lấy {count} dòng lời thoại từ CSV.",
  "autoVideo.ttsGen.csvEmpty": "Chưa có lời thoại nào trong CSV.",
  "autoVideo.ttsGen.noText": "Không có text để đọc.",
  "autoVideo.ttsGen.starting": "Đang khởi động...",
  "autoVideo.ttsGen.generate": "Tạo giọng đọc",
  "autoVideo.ttsGen.done": "Đã tạo audio ({seconds}s)",
  "autoVideo.ttsGen.failed": "Tạo giọng đọc thất bại: {message}",
  "autoVideo.ttsGen.failedGeneric": "Không tạo được giọng đọc",
  "autoVideo.ttsGen.audioReady": "Audio đã có",
  "autoVideo.ttsGen.omnivoiceNote": "OmniVoice tự động clone giọng từ audio tham chiếu (nếu có) hoặc tạo giọng mới từ mô tả giọng.",
  "assets.deleteFolder": "Xóa thư mục",
  "autopilot.panel.server": "AutoPilot HTTP",
  "autopilot.panel.running": "đang chạy tại 127.0.0.1:{port}",
  "autopilot.panel.stopped": "chưa chạy",
  "autopilot.panel.flow": "Google Flow",
  "autopilot.panel.flowReady": "{count} tài khoản sẵn sàng",
  "autopilot.panel.flowOff": "chưa bật",
  "autopilot.panel.bound": "Flow project",
  "autopilot.panel.boundOk": "đã bind {count}",
  "autopilot.panel.boundMissing": "chưa bind (Settings → Google Flow)",
  "autopilot.panel.refresh": "Làm mới",
  "autopilot.panel.newJob": "Tạo job mới",
  "autopilot.panel.advanced": "Nâng cao",
  "autopilot.panel.hideAdvanced": "Ẩn nâng cao",
  "autopilot.panel.createStepByStep": "Tạo từng bước",
  "autopilot.panel.createAll": "Tạo tất cả",
  "autopilot.panel.fromTopic": "Từ chủ đề",
  "autopilot.panel.fromScript": "Từ kịch bản",
  "autopilot.panel.topicPlaceholder": "VD: Lịch sử Hà Nội qua 1000 năm, quy hoạch đô thị, ẩm thực đường phố...",
  "autopilot.panel.scriptPlaceholder": "Dán kịch bản có sẵn vào đây (mỗi cảnh có lời thuyết minh)...",
  "autopilot.panel.style": "Phong cách",
  "autopilot.panel.stylePlaceholder": "VD: phong cách phim tài liệu BBC, giọng nam trầm, chậm rãi...",
  "autopilot.panel.skill": "Skill sáng tạo",
  "autopilot.panel.visualStyleHelp": "Style này được khóa khi tạo job và áp dụng cho ảnh nhân vật, ảnh shot và frame có tư liệu thật. Chọn None / Skill Defined để skill tự quyết định style.",
  "autopilot.panel.customSkill": "Skill tùy chỉnh",
  "autopilot.panel.customSkillHint": "Dán toàn bộ hướng dẫn workflow/prompt của bạn.",
  "autopilot.panel.skillPlaceholder": "Nhập skill điều khiển cách viết beat, prompt ảnh và prompt chuyển động...",
  "autopilot.panel.maxShots": "Số phân cảnh tối đa",
  "autopilot.panel.maxShotsHint": "0 = tự động theo thời lượng voice; chỉ là giới hạn an toàn.",
  "autopilot.panel.longFormThreshold": "Chia phim dài từ (phút)",
  "autopilot.panel.longFormThresholdHint": "Dưới ngưỡng chạy pipeline thường; mặc định 8 phút.",
  "autopilot.panel.aspectRatio": "Tỷ lệ khung hình",
  "autopilot.panel.voice": "Nhà cung cấp giọng đọc",
  "autopilot.panel.language": "Ngôn ngữ",
  "autopilot.panel.voiceSelect": "Giọng đọc",
  "autopilot.panel.voiceProfile": "Giọng clone",
  "autopilot.panel.omniNoProfile": "Tự động (không dùng clone)",
  "autopilot.panel.noVoiceProfiles": "Chưa có giọng clone — tạo ở tab TTS.",
  "autopilot.panel.resolution": "Độ phân giải",
  "autopilot.panel.bgmPlaceholder": "Đường dẫn file nhạc nền (tuỳ chọn)",
  "autopilot.panel.start": "Chạy AutoPilot",
  "autopilot.panel.jobs": "Jobs",
  "autopilot.panel.noJobs": "Chưa có job nào.",
  "autopilot.panel.noInput": "Nhập chủ đề, kịch bản hoặc chọn file giọng đọc trước khi chạy.",
  "autopilot.panel.voiceSource": "Nguồn giọng đọc",
  "autopilot.panel.createTts": "Tạo giọng bằng TTS",
  "autopilot.panel.importAudio": "Import file giọng đọc",
  "autopilot.panel.audioPlaceholder": "Chọn MP3, WAV, M4A, AAC, FLAC hoặc OGG",
  "autopilot.panel.chooseAudio": "Chọn file",
  "autopilot.panel.audioRequired": "Hãy chọn file giọng đọc trước khi chạy.",
  "autopilot.panel.audioIsScriptHint": "Transcript của file giọng đọc sẽ là kịch bản chính và khóa toàn bộ timing; AutoPilot bỏ qua bước tạo TTS. Nếu không có SRT, cần cấu hình Whisper.",
  "autopilot.panel.chooseSrt": "Chọn SRT",
  "autopilot.panel.srtPlaceholder": "Chưa có SRT — sẽ fallback sang Whisper",
  "autopilot.panel.srtLoaded": "Đã nạp {count} câu phụ đề từ SRT",
  "autopilot.panel.srtInvalid": "SRT không hợp lệ hoặc không có câu nào",
  "autopilot.panel.clearSrt": "Bỏ SRT",
  "autopilot.panel.srtHint": "Có SRT sẽ dùng thẳng timing + kịch bản từ SRT, không cần Whisper và khớp đúng giọng đọc.",
  "autopilot.panel.addSubtitles": "Thêm phụ đề vào video",
  "autopilot.panel.jobCreated": "Đã tạo job {id}",
  "autopilot.panel.createFailed": "Không tạo được job",
  "autopilot.panel.subtitlesHint": "(vẽ chữ phụ đề trực tiếp lên video theo giọng đọc)",
  "autopilot.panel.characterReferences": "Ảnh tham chiếu nhân vật",
  "autopilot.panel.sceneReferences": "Ảnh tham chiếu cảnh",
  "autopilot.panel.shotMedia": "Ảnh và video các shot",
  "autopilot.panel.imageReady": "Có ảnh",
  "autopilot.panel.videoReady": "Có video",
  "autopilot.panel.saveMp4": "Lưu MP4",
  "autopilot.panel.videoSaved": "Đã lưu video MP4",
  "autopilot.panel.videoSaveFailed": "Không lưu được video",
  "autopilot.panel.savedInLibrary": "Ảnh nằm trong Media > AI Images; video shot và bản cuối nằm trong Media > AI Videos.",
  "autopilot.card.regenBlocked": "Không thể tạo lại lúc này (job đang chạy). Hãy tạm dừng job trước.",
  "autopilot.card.generating": "Đang tạo",
  "autopilot.card.failed": "Lỗi",
  "autopilot.card.hasVideo": "Đã có video",
  "autopilot.card.renderingVideo": "Đang render",
  "autopilot.card.videoFailed": "Lỗi video",
  "autopilot.panel.copyPath": "Sao chép đường dẫn",
  "autopilot.panel.openOutput": "Mở file kết quả",
  "autopilot.panel.assets": "Asset của job",
  "autopilot.panel.clickToPreview": "Bấm để xem",
  "autopilot.panel.previewImage": "Xem ảnh",
  "autopilot.panel.previewVideo": "Xem video",
  "autopilot.panel.researchedImages": "Ảnh tư liệu thật được chèn",
  "autopilot.panel.openSource": "Nguồn",
  "autopilot.panel.pause": "Tạm dừng",
  "autopilot.panel.resume": "Tiếp tục từ checkpoint",
  "autopilot.panel.searchingResearch": "Đang tìm tư liệu",
  "autopilot.panel.generatingImage": "Đang tạo ảnh",
  "autopilot.panel.generatingVideo": "Đang tạo video",
  "autopilot.panel.imageFailed": "Lỗi tạo ảnh",
  "autopilot.panel.videoFailed": "Lỗi tạo video",
  "autopilot.panel.waiting": "Đang chờ",
  "media.library": "Thư viện tư liệu",
  "media.dropFiles": "Kéo thả file vào đây",
  "media.orUpload": "hoặc bấm nút tải lên",
  "media.categories": "Phân loại tư liệu",
  "media.system.aiImage": "Ảnh AI",
  "media.system.aiVideo": "Video AI",
  "media.system.upload": "Tệp tải lên",
  "media.customFolders": "Thư mục tùy chỉnh",
  "media.folderSummary": "{folders} thư mục, {files} tệp",
  "media.sort.name": "Tên",
  "media.sort.type": "Loại",
  "media.sort.duration": "Thời lượng",
  "media.view.list": "Chế độ danh sách",
  "media.view.grid": "Chế độ lưới",
  "media.root": "Gốc",
  "media.upload": "Tải lên",
  "media.content": "Nội dung",
  "media.folderName": "Tên thư mục",
  "media.rename": "Đổi tên",
  "media.smartSplit": "Cắt thông minh",
  "media.generateScenes": "Tạo phân cảnh",
  "media.export": "Xuất",
  "media.aiGenerated": "AI tạo",
  "media.newName": "Tên mới",
  "export.stageTitle": "Thành phẩm và xuất",
  "export.stageSubtitle": "Xuất media",
  "export.status": "Trạng thái: {value}",
  "export.statusReady": "SẴN SÀNG",
  "export.statusInProgress": "ĐANG XỬ LÝ",
  "export.masterSequence": "Chuỗi chính",
  "export.shotsLabel": "Shot",
  "export.splitScenes": "Phân cảnh đã tách",
  "export.director": "Đạo diễn",
  "export.chooseImages": "Chọn media cần xuất",
  "export.chooseImagesDesc": "Chọn nguồn và từng mục. Video Đạo diễn sẽ được xuất cùng shot tương ứng.",
  "export.sourceDirector": "Đạo diễn",
  "export.sourceCharacters": "Nhân vật",
  "export.sourceScenes": "Cảnh",
  "export.sourceAutopilot": "AutoPilot",
  "export.sourceMedia": "Thư viện Media",
  "export.source.director": "Đạo diễn",
  "export.source.character": "Nhân vật",
  "export.source.scene": "Cảnh",
  "export.source.autopilot": "AutoPilot",
  "export.source.media": "Thư viện Media",
  "export.readyImages": "Sẵn sàng {ready}/{total} mục",
  "export.selectAllImages": "Chọn tất cả",
  "export.clearImages": "Bỏ chọn",
  "export.selectedMedia": "Đã chọn {items} mục · {images} ảnh · {videos} video",
  "export.noImage": "Chưa có ảnh",
  "export.videoOnly": "Đã có video",
  "export.videoIncluded": "Có video",
  "export.noSourceSelected": "Hãy chọn ít nhất một nguồn ảnh.",
  "export.estDuration": "Thời lượng ước tính",
  "export.target": "Mục tiêu",
  "export.renderStatus": "Trạng thái render",
  "export.untitledProject": "Dự án chưa đặt tên",
  "export.sceneStatus": "Cảnh {index}{suffix}",
  "export.shotStatus": "Shot {index}",
  "export.sceneTitle": "Cảnh {index}: {name}",
  "export.shotTitle": "Shot {index}: {name}",
  "export.videoBadge": " [video]",
  "export.imageBadge": " [ảnh]",
  "export.imagesCount": "Ảnh: {ready}/{total}",
  "export.videosCount": "Video: {ready}/{total}",
  "export.sequenceMap": "Sơ đồ chuỗi",
  "export.noShots": "Chưa có shot nào",
  "export.downloadIndividually": "Tải media đã chọn",
  "export.preparingExport": "Đang chuẩn bị xuất...",
  "export.preparingDownload": "Đang chuẩn bị tải xuống...",
  "export.done": "Xuất xong",
  "export.downloadDone": "Tải xuống xong",
  "export.failed": "Xuất thất bại: {message}",
  "export.downloadFailed": "Tải xuống thất bại: {message}",
  "export.exporting": "Đang xuất...",
  "export.selectFolder": "Chọn thư mục để xuất",
  "autopilot.panel.noSkill": "Không dùng skill",
  "autopilot.panel.noSkillHint": "Chọn một skill đã lưu hoặc tạo skill mới.",
  "autopilot.panel.newSkill": "Skill mới",
  "autopilot.panel.editSavedSkill": "Skill đã lưu — mở để chỉnh sửa nội dung.",
  "autopilot.panel.skillNamePlaceholder": "Tên skill",
  "autopilot.panel.saveSkill": "Lưu skill",
  "autopilot.panel.updateSkill": "Cập nhật",
  "autopilot.panel.deleteSkill": "Xóa skill",
  "autopilot.panel.untitledSkill": "Skill chưa đặt tên",
  "autopilot.panel.skillSaved": "Đã lưu skill {name}",
  "autopilot.panel.skillUpdated": "Đã cập nhật skill {name}",
  "autopilot.panel.skillDeleted": "Đã xóa skill",
  "autopilot.panel.deleteSkillConfirm": "Xóa skill {name}?"
};
const features = {
  "appHome.researchMonitor.title": "Nghiên cứu – Theo dõi",
  "appHome.researchMonitor.description": "Thu thập, tổ chức và theo dõi thông tin nghiên cứu trong một không gian làm việc riêng.",
  "appHome.ttsVoice.title": "TTS – Tạo giọng nói",
  "appHome.ttsVoice.description": "Chuyển văn bản thành giọng nói và quản lý quy trình tạo voice trong một không gian riêng.",
  "appHome.autoEdit.title": "Auto Edit",
  "appHome.autoEdit.description": "Tự động biên tập video, sắp xếp tư liệu và hoàn thiện quy trình dựng trong một không gian riêng.",
  "appHome.planRequiredTitle": "Cần nâng cấp gói",
  "appHome.planRequiredDescription": "{feature} yêu cầu gói {plan}. Hãy nâng cấp tài khoản để sử dụng chức năng này.",
  "appHome.planRequiredClose": "Đã hiểu",
  "featurePlaceholder.badge": "Chức năng mới",
  "featurePlaceholder.ready": "Không gian chức năng đã sẵn sàng",
  "featurePlaceholder.note": "Các công cụ và quy trình chi tiết sẽ được bổ sung ở bước tiếp theo.",
  "featurePlaceholder.previewOnly": "Chế độ chỉ xem",
  "featurePlaceholder.unlimitedRequired": "Tài khoản Pro có thể xem giao diện, nhưng cần gói Unlimited để sử dụng chức năng này.",
  "appHome.backToHome": "Quay về trang chủ"
};
const account = {
  "account.title": "Tài khoản",
  "account.description": "Thông tin tài khoản và giấy phép trên thiết bị này.",
  "account.changeAvatar": "Đổi ảnh",
  "account.removeAvatar": "Xóa ảnh",
  "account.localAvatarHint": "Ảnh chỉ được lưu cục bộ trên thiết bị này.",
  "account.name": "Tên",
  "account.plan": "Gói",
  "account.expiresAt": "Ngày hết hạn",
  "account.machineId": "Mã máy",
  "account.lastCheckedAt": "Xác minh gần nhất",
  "account.notAvailable": "Chưa có",
  "account.noExpiration": "Không giới hạn",
  "account.avatarUpdated": "Đã cập nhật ảnh đại diện",
  "account.avatarRemoved": "Đã xóa ảnh đại diện",
  "account.invalidImage": "Không thể đọc file ảnh này"
};
const tts = {
  "tts.title": "TTS Studio",
  "tts.subtitle": "OmniVoice • Nhân bản và thiết kế giọng nói",
  "tts.subtitle.capcut": "CapCut Online • Giọng dựng sẵn",
  "tts.subtitle.gemini": "Gemini Pro • Giọng AI trực tuyến",
  "tts.subtitle.vieneu": "VieNeu v3 Turbo • Giọng Việt offline 48 kHz",
  "tts.modelManager": "Cài đặt",
  "tts.status.ready": "Đã cài",
  "tts.status.downloading": "Đang tải",
  "tts.status.error": "Có lỗi",
  "tts.status.notInstalled": "Chưa cài",
  "tts.text.title": "Nội dung cần đọc",
  "tts.text.savedWithoutModel": "Nội dung vẫn được lưu kể cả khi chưa tải model.",
  "tts.text.characters": "{count} ký tự",
  "tts.text.placeholder": "Nhập hoặc dán văn bản cần chuyển thành giọng nói...",
  "tts.action.cancel": "Hủy",
  "tts.action.generate": "Tạo giọng nói",
  "tts.action.downloadToGenerate": "Tải model để tạo",
  "tts.history.title": "Audio gần đây",
  "tts.history.empty": "Chưa có audio nào.",
  "tts.history.remove": "Xóa khỏi lịch sử",
  "tts.history.deleteTitle": "Xóa audio này?",
  "tts.history.deleteDescription": "“{name}” sẽ bị xóa khỏi lịch sử audio.",
  "tts.history.confirmDelete": "Xóa audio",
  "tts.history.openFolder": "Mở thư mục",
  "tts.history.exportWav": "Xuất WAV",
  "tts.history.play": "Phát audio",
  "tts.history.pause": "Tạm dừng audio",
  "tts.history.seek": "Dòng thời gian audio",
  "tts.history.mute": "Tắt tiếng",
  "tts.history.unmute": "Bật tiếng",
  "tts.history.rename": "Đổi tên audio",
  "tts.history.saveName": "Lưu tên",
  "tts.history.voice": "Giọng: {voice}",
  "tts.history.model": "Model: {model}",
  "tts.history.search": "Tìm kiếm",
  "tts.history.searchPlaceholder": "Tên, nội dung, giọng hoặc model...",
  "tts.history.sort": "Sắp xếp",
  "tts.history.newest": "Mới tạo nhất",
  "tts.history.oldest": "Tạo lâu nhất",
  "tts.history.resetFilters": "Đặt lại bộ lọc",
  "tts.history.noResults": "Không tìm thấy audio phù hợp.",
  "tts.history.resultCount": "Hiện {visible}/{total}",
  "tts.native.selectReferenceAudio": "Chọn audio tham chiếu",
  "tts.native.exportAudio": "Xuất audio",
  "tts.settings.model": "Model",
  "tts.settings.cloneMode": "Nhân bản giọng",
  "tts.settings.voiceMode": "Chế độ giọng",
  "tts.settings.designPrompt": "Mô tả giọng mong muốn",
  "tts.settings.designPlaceholder": "Ví dụ: nữ trẻ, giọng thấp, nói nhẹ và ấm áp",
  "tts.settings.designVietnameseWarning": "Voice Design được tối ưu chủ yếu cho tiếng Anh và tiếng Trung; tiếng Việt có thể chưa ổn định.",
  "tts.settings.autoDescription": "OmniVoice sẽ tự chọn chất giọng phù hợp với nội dung. Không cần audio tham chiếu.",
  "tts.settings.language": "Ngôn ngữ",
  "tts.settings.speed": "Tốc độ đọc",
  "tts.settings.quality": "Chất lượng",
  "tts.splitMode.title": "Cách đọc",
  "tts.splitMode.default": "Mặc định (đọc toàn bộ)",
  "tts.splitMode.line": "Chia theo dòng",
  "tts.splitMode.sentence": "Chia theo câu",
  "tts.splitMode.hint": "Mặc định đọc cả văn bản một lần. Chia theo dòng/câu sẽ đọc từng phần rồi ghép lại thành một audio.",
  "tts.splitMode.linePreviewTitle": "Cách chia dòng",
  "tts.splitMode.sentencePreviewTitle": "Cách chia câu",
  "tts.splitMode.previewCount": "Sẽ đọc {count} phần",
  "tts.splitMode.previewEmpty": "Nhập văn bản để xem cách chia.",
  "tts.mode.clone": "Nhân bản",
  "tts.mode.design": "Thiết kế",
  "tts.mode.auto": "Tự động",
  "tts.mode.preset": "Giọng dựng sẵn",
  "tts.language.vi": "Tiếng Việt (vi)",
  "tts.language.en": "Tiếng Anh (en)",
  "tts.language.auto": "Tự nhận diện",
  "tts.language.supportedCount": "OmniVoice hỗ trợ 646 ngôn ngữ.",
  "tts.language.add": "Thêm ngôn ngữ",
  "tts.languagePicker.title": "Thêm ngôn ngữ đọc",
  "tts.languagePicker.description": "Tìm trong {count} ngôn ngữ được OmniVoice hỗ trợ. Ngôn ngữ đã thêm sẽ được lưu cho lần sau.",
  "tts.languagePicker.searchPlaceholder": "Nhập tên hoặc mã, ví dụ: French, fr, fra...",
  "tts.languagePicker.saved": "Ngôn ngữ đã lưu",
  "tts.languagePicker.remove": "Xóa {language} khỏi danh sách",
  "tts.languagePicker.modelCode": "Mã dùng cho OmniVoice",
  "tts.languagePicker.empty": "Không tìm thấy ngôn ngữ phù hợp.",
  "tts.quality.fast": "Nhanh • 16 bước",
  "tts.quality.balanced": "Cân bằng • 24 bước",
  "tts.quality.high": "Chất lượng cao • 32 bước",
  "tts.quality.preview": "Xem thử nhanh • 8 bước",
  "tts.quality.draft": "Bản nháp • 12 bước",
  "tts.advanced.title": "Tinh chỉnh nâng cao",
  "tts.advanced.expand": "Mở phần tinh chỉnh nâng cao",
  "tts.advanced.collapse": "Thu gọn phần tinh chỉnh nâng cao",
  "tts.advanced.enabledHint": "Đang dùng thiết lập riêng cho lần tạo tiếp theo.",
  "tts.advanced.disabledHint": "Bật để mở các thiết lập chuyên sâu.",
  "tts.advanced.performance": "Hiệu suất và bộ nhớ",
  "tts.advanced.reset": "Mặc định",
  "tts.advanced.chunkDuration": "Độ dài mỗi đoạn (giây)",
  "tts.advanced.chunkDurationHint": "Đoạn nhỏ hơn sử dụng ít bộ nhớ GPU hơn.",
  "tts.advanced.chunkThreshold": "Ngưỡng bắt đầu chia (giây)",
  "tts.advanced.chunkThresholdHint": "Chỉ chia khi thời lượng ước tính vượt ngưỡng này.",
  "tts.advanced.lowVramHint": "GPU 4 GB: mỗi đoạn 8–10 giây, ngưỡng 15–20 giây, 12–16 bước.",
  "tts.advanced.voiceBehavior": "Hành vi tạo giọng",
  "tts.advanced.guidanceScale": "Mức bám giọng",
  "tts.advanced.guidanceScaleHint": "Mức độ bám theo đặc điểm giọng; mặc định 2.",
  "tts.advanced.tShift": "Dịch lịch khử nhiễu",
  "tts.advanced.tShiftHint": "Điều chỉnh tiến trình khử nhiễu; mặc định 0.1.",
  "tts.advanced.positionTemperature": "Ngẫu nhiên vị trí",
  "tts.advanced.positionTemperatureHint": "Độ biến thiên theo vị trí; 0 là ổn định nhất.",
  "tts.advanced.classTemperature": "Ngẫu nhiên âm tiết",
  "tts.advanced.classTemperatureHint": "Độ biến thiên khi chọn đơn vị âm thanh; mặc định 0.",
  "tts.advanced.layerPenalty": "Ưu tiên tầng giải mã",
  "tts.advanced.layerPenaltyHint": "Ảnh hưởng thứ tự xử lý các tầng; mặc định 5.",
  "tts.advanced.denoise": "Làm sạch giọng",
  "tts.advanced.denoiseHint": "Ưu tiên giọng sạch hơn khi dùng tham chiếu.",
  "tts.advanced.output": "Xử lý đầu vào và đầu ra",
  "tts.advanced.preprocess": "Tiền xử lý tham chiếu",
  "tts.advanced.preprocessHint": "Làm sạch khoảng lặng và văn bản tham chiếu.",
  "tts.advanced.postprocess": "Làm sạch âm thanh đầu ra",
  "tts.advanced.postprocessHint": "Loại bỏ khoảng lặng quá dài ở đầu ra.",
  "tts.advanced.padDuration": "Khoảng đệm đầu/cuối (giây)",
  "tts.advanced.padDurationHint": "Khoảng lặng thêm ở đầu và cuối.",
  "tts.advanced.fadeDuration": "Làm mượt đầu/cuối (giây)",
  "tts.advanced.fadeDurationHint": "Làm mượt phần bắt đầu và kết thúc âm thanh.",
  "tts.profile.title": "Hồ sơ giọng",
  "tts.profile.create": "Tạo hồ sơ",
  "tts.profile.select": "Chọn hồ sơ giọng",
  "tts.profile.empty": "Chưa có hồ sơ giọng tương thích",
  "tts.profile.emptyHint": "Thêm audio và transcript để nhân bản giọng.",
  "tts.profile.remove": "Xóa hồ sơ",
  "tts.profile.dialogTitle": "Tạo hồ sơ giọng",
  "tts.profile.compatibility": "Hồ sơ gắn với {model}; model khác có thể không tương thích.",
  "tts.profile.name": "Tên hồ sơ",
  "tts.profile.namePlaceholder": "Ví dụ: Người dẫn chuyện 01",
  "tts.profile.referenceAudio": "Audio tham chiếu",
  "tts.profile.audioPlaceholder": "Chọn WAV, MP3, M4A, FLAC...",
  "tts.profile.choose": "Chọn",
  "tts.profile.transcript": "Transcript chính xác của audio",
  "tts.profile.transcriptOptional": "Transcript (không bắt buộc với VieNeu)",
  "tts.profile.transcriptPlaceholder": "Nhập đúng nội dung được nói trong audio tham chiếu...",
  "tts.profile.save": "Lưu hồ sơ",
  "tts.manager.title": "Cài đặt",
  "tts.manager.chooseEngine": "Chọn engine tạo giọng. OmniVoice vẫn là lựa chọn local mặc định.",
  "tts.manager.ready": "Sẵn sàng",
  "tts.manager.accelerator": "Thiết bị tăng tốc",
  "tts.manager.downloadSize": "Dung lượng ước tính",
  "tts.manager.installKeepOpen": "Có thể đóng cửa sổ này; tiến trình vẫn tiếp tục và được hiển thị ở màn hình chính.",
  "tts.manager.remove": "Gỡ model",
  "tts.manager.download": "Tải model",
  "tts.manager.repairRuntime": "Sửa runtime",
  "tts.manager.later": "Để sau",
  "tts.missing.title": "Model chưa được cài đặt",
  "tts.missing.description": "Bạn vẫn có thể soạn nội dung và cấu hình giọng. Tải model khi muốn bắt đầu tạo audio.",
  "tts.missing.size": "Khoảng {size} GB; runtime Python chỉ cài ở lần đầu.",
  "tts.runtime.desktopOnly": "Model local chỉ hoạt động trong ứng dụng Electron desktop.",
  "tts.runtime.vieneuPythonRequired": "VieNeu cần Python 3.10–3.13 được cài trên máy.",
  "tts.progress.starting": "Đang chuẩn bị...",
  "tts.progress.pythonDownload": "Đang tải Python runtime...",
  "tts.progress.pythonInstall": "Đang cài Python runtime...",
  "tts.progress.pythonMigrate": "Đang chuẩn bị Python nền từ runtime cũ...",
  "tts.progress.venv": "Đang tạo môi trường Python riêng...",
  "tts.progress.pip": "Đang cập nhật trình cài runtime...",
  "tts.progress.dependencies": "Đang cài OmniVoice runtime...",
  "tts.progress.accelerator": "Đang cài tăng tốc GPU...",
  "tts.progress.modelDownload": "Đang tải model từ Hugging Face...",
  "tts.progress.loading": "Đang nạp model...",
  "tts.progress.voicePrompt": "Đang chuẩn bị hồ sơ giọng...",
  "tts.progress.generating": "Đang tổng hợp giọng nói...",
  "tts.progress.lineGenerating": "Đang đọc từng dòng...",
  "tts.progress.sentenceGenerating": "Đang đọc từng câu...",
  "tts.progress.chunking": "Đang chia kịch bản...",
  "tts.progress.merging": "Đang ghép các đoạn audio...",
  "tts.progress.saving": "Đang lưu WAV...",
  "tts.progress.done": "Model đã sẵn sàng",
  "tts.progress.default": "Đang xử lý...",
  "tts.toast.statusFailed": "Không thể đọc trạng thái model",
  "tts.toast.restartRequired": "Electron main vẫn đang chạy runtime Qwen cũ. Hãy thoát hẳn ứng dụng rồi chạy lại npm.cmd run dev:electron.",
  "tts.toast.jobBusy": "Hãy chờ hoặc hủy tác vụ đang chạy",
  "tts.toast.desktopDownload": "Hãy chạy bản Electron desktop để tải model",
  "tts.toast.preparing": "Đang chuẩn bị...",
  "tts.toast.modelReady": "{model} đã sẵn sàng",
  "tts.toast.downloadFailed": "Không thể tải model",
  "tts.confirm.removeModel": "Gỡ {model}? Các file audio đã tạo sẽ được giữ lại.",
  "tts.toast.modelRemoved": "Đã gỡ model",
  "tts.toast.removeFailed": "Không thể gỡ model",
  "tts.toast.cancelRequested": "Đã yêu cầu hủy tác vụ",
  "tts.toast.profileRequiredFields": "Hãy nhập tên, audio và transcript tham chiếu",
  "tts.toast.profileSaved": "Đã lưu hồ sơ giọng",
  "tts.toast.textRequired": "Hãy nhập nội dung cần đọc",
  "tts.toast.profileRequired": "Hãy chọn hoặc tạo hồ sơ giọng",
  "tts.toast.instructionRequired": "Hãy mô tả giọng cần thiết kế",
  "tts.toast.desktopOnly": "TTS local chỉ hoạt động trong bản Electron desktop",
  "tts.toast.generateFailed": "Không thể tạo giọng",
  "tts.toast.audioCreated": "Đã tạo audio",
  "tts.model.omnivoice": "Tạo giọng đa ngôn ngữ, nhân bản giọng và thiết kế giọng hoàn toàn cục bộ.",
  "tts.model.vieneu": "Tạo giọng Việt–Anh offline 48 kHz bằng VieNeu v3 Turbo CPU/ONNX.",
  "tts.engine.vieneu": "VieNeu local tối ưu cho tiếng Việt, giọng dựng sẵn và nhân bản giọng.",
  "tts.vieneu.voice": "Giọng VieNeu",
  "tts.vieneu.style": "Phong cách đọc",
  "tts.vieneu.styleNatural": "Tự nhiên",
  "tts.vieneu.styleNews": "Tin tức",
  "tts.vieneu.styleStory": "Đọc truyện",
  "tts.vieneu.cloneHint": "Tạo hồ sơ từ đoạn giọng mẫu 3–8 giây. Voice clone cần backend được VieNeu hỗ trợ trên thiết bị.",
  "tts.engine.omnivoice": "OmniVoice local hỗ trợ hơn 600 ngôn ngữ.",
  "tts.model.capcut": "Giọng dựng sẵn trực tuyến, không cần tải model hoặc dùng GPU.",
  "tts.engine.capcut": "Giọng CapCut dựng sẵn qua kết nối Internet.",
  "tts.model.gemini31": "Gemini 3.1 Flash TTS có khả năng điều khiển phong cách và biểu cảm.",
  "tts.model.gemini25": "Gemini 2.5 Flash TTS ưu tiên tốc độ và chi phí.",
  "tts.engine.gemini": "Gemini TTS trực tuyến với giọng dựng sẵn và điều khiển phong cách.",
  "tts.engine.local": "Local",
  "tts.engine.online": "Online",
  "tts.capcut.onlineLabel": "Online • Giọng dựng sẵn",
  "tts.capcut.managerDescription": "Không cần tải model và không dùng GPU. Engine gọi dịch vụ CapCut qua Internet.",
  "tts.capcut.voice": "Giọng đọc",
  "tts.capcut.voices": "giọng",
  "tts.capcut.searchVoice": "Tìm theo tên hoặc mã giọng...",
  "tts.capcut.selectVoice": "Chọn giọng CapCut",
  "tts.capcut.preview": "Nghe thử",
  "tts.capcut.previewing": "Đang tạo bản nghe thử...",
  "tts.capcut.voiceRequired": "Hãy chọn một giọng CapCut",
  "tts.capcut.longTextHint": "Kịch bản dài sẽ được tự chia theo câu, tạo lần lượt và ghép thành một file WAV hoàn chỉnh.",
  "tts.gemini.onlineLabel": "Online • 30 giọng AI",
  "tts.gemini.managerDescription": "Nhập một hoặc nhiều Gemini API key, mỗi key một dòng. Key được mã hóa và chỉ lưu trên thiết bị này.",
  "tts.gemini.saveKeys": "Lưu API key",
  "tts.gemini.addKey": "Thêm API key",
  "tts.gemini.removeKey": "Xóa API key này",
  "tts.gemini.noKey": "Chưa có API key.",
  "tts.gemini.notConfigured": "Chưa cấu hình",
  "tts.gemini.keyCount": "Đang lưu {count} API key.",
  "tts.gemini.keysSaved": "Đã lưu an toàn {count} API key.",
  "tts.gemini.keysSaveFailed": "Không thể lưu API key.",
  "tts.gemini.voice": "Giọng đọc",
  "tts.gemini.voices": "giọng",
  "tts.gemini.female": "Nữ",
  "tts.gemini.male": "Nam",
  "tts.gemini.preview": "Nghe thử",
  "tts.gemini.previewing": "Đang tạo bản nghe thử Gemini...",
  "tts.gemini.voiceRequired": "Hãy chọn một giọng Gemini",
  "tts.gemini.style": "Hướng dẫn phong cách đọc",
  "tts.gemini.stylePlaceholder": "Ví dụ: Đọc tự nhiên, ấm áp, tốc độ vừa phải và nhấn nhẹ các từ quan trọng.",
  "tts.gemini.temperature": "Temperature",
  "tts.gemini.temperatureHint": "Thấp: ổn định hơn · Cao: ngữ điệu linh hoạt hơn.",
  "tts.gemini.showTags": "Hiện thẻ biểu cảm",
  "tts.gemini.hideTags": "Ẩn thẻ biểu cảm",
  "tts.gemini.longTextHint": "Kịch bản dài được chia theo câu, tạo lần lượt và ghép thành một WAV. Nhiều API key chỉ giúp xoay hạn mức khi chúng thuộc các dự án Google khác nhau.",
  "tts.subtitle.vbee": "Vbee API • Giọng Việt trực tuyến",
  "tts.model.vbee": "Tạo giọng nói trực tuyến bằng App ID và Token chính thức của Vbee.",
  "tts.engine.vbee": "Giọng Vbee trực tuyến, hỗ trợ mã giọng theo tài khoản.",
  "tts.vbee.onlineLabel": "Online • API chính thức",
  "tts.vbee.managerDescription": "Nhập App ID và Token do Vbee cấp. Thông tin được mã hóa và chỉ lưu trên thiết bị này.",
  "tts.vbee.notConfigured": "Chưa cấu hình",
  "tts.vbee.configured": "Đã lưu App ID và Token Vbee.",
  "tts.vbee.credentialsSaved": "Đã lưu an toàn thông tin Vbee.",
  "tts.vbee.credentialsSaveFailed": "Không thể lưu thông tin Vbee.",
  "tts.vbee.saveCredentials": "Lưu thông tin",
  "tts.vbee.tokenExpires": "Token hết hạn: {date}",
  "tts.vbee.voiceCode": "Mã giọng Vbee",
  "tts.vbee.voiceCodeHint": "Sao chép mã giọng trong Thư viện giọng trên Vbee. Mỗi tài khoản có thể được dùng các giọng khác nhau.",
  "tts.vbee.voiceRequired": "Hãy nhập mã giọng Vbee",
  "tts.vbee.preview": "Nghe thử",
  "tts.vbee.previewing": "Đang tạo bản nghe thử Vbee...",
  "tts.vbee.audioType": "Định dạng",
  "tts.vbee.bitrate": "Chất lượng",
  "tts.vbee.longTextHint": "App gửi trực tiếp tới Vbee, tự theo dõi tiến trình và tải audio về máy; không sử dụng Supabase.",
  "tts.vbee.voice": "Giọng đọc",
  "tts.vbee.voices": "giọng",
  "tts.vbee.searchVoice": "Tìm theo tên, ngôn ngữ hoặc giới tính...",
  "tts.vbee.loadingVoices": "Đang tải danh sách giọng...",
  "tts.vbee.selectVoice": "Chọn giọng Vbee",
  "tts.vbee.refreshVoices": "Cập nhật danh sách giọng từ Vbee",
  "tts.vbee.voicesLoadFailed": "Không thể tải danh sách giọng Vbee.",
  "tts.vbee.officialVoice": "Giọng chính thức Vbee",
  "tts.vbee.communityVoice": "Giọng cộng đồng",
  "tts.vbee.personalVoice": "Giọng cá nhân",
  "tts.vbee.credits": "điểm/ký tự",
  "tts.progress.vbeeSubmitting": "Đang gửi tới Vbee...",
  "tts.progress.vbeeProcessing": "Vbee đang tạo giọng...",
  "tts.progress.vbeeDownloading": "Đang tải audio Vbee...",
  "tts.progress.vbeeDone": "Audio Vbee đã hoàn tất"
};
const research = {
  "research.sidebar.discover": "Khám phá",
  "research.sidebar.discoverTip": "Khám phá Outlier — tìm video và ý tưởng đang thắng",
  "research.sidebar.monitor": "Theo dõi",
  "research.sidebar.monitorTip": "Theo dõi kênh — xem sức khoẻ đối thủ trong 48 giờ",
  "research.sidebar.comments": "Bình luận",
  "research.sidebar.commentsTip": "Phân tích và xuất bình luận của video hoặc kênh",
  "research.sidebar.tools": "Công cụ",
  "research.sidebar.toolsTip": "Tải video, âm thanh, phụ đề và ảnh từ YouTube",
  "research.sidebar.settings": "Cài đặt",
  "research.sidebar.settingsTip": "Cấu hình YouTube Data API",
  "research.header.discoverTitle": "Khám phá Outlier",
  "research.header.discoverSubtitle": "Tìm video và ý tưởng đang thắng từ dữ liệu YouTube",
  "research.header.monitorTitle": "Theo dõi kênh",
  "research.header.monitorSubtitle": "Quan sát thống kê công khai và tốc độ video gần đây",
  "research.header.commentsTitle": "Phân tích bình luận",
  "research.header.commentsSubtitle": "Thu thập, lọc và xuất bình luận công khai từ YouTube",
  "research.header.toolsTitle": "Công cụ media",
  "research.header.toolsSubtitle": "Tải và xử lý tài nguyên phục vụ nghiên cứu",
  "research.header.settingsTitle": "Cài đặt nghiên cứu",
  "research.header.settingsSubtitle": "Quản lý API key và theo dõi quota ước tính",
  "research.header.quotaTip": "Số request ứng dụng đã ghi nhận hôm nay; YouTube sẽ tự báo khi key hết quota",
  "research.header.quota": "{count} key · đã dùng {read} đọc · {search} tìm",
  "research.common.noApi": "Chưa kết nối YouTube Data API",
  "research.common.cancel": "Huỷ",
  "research.common.save": "Lưu",
  "research.common.views": "lượt xem",
  "research.common.subscribers": "người đăng ký",
  "research.common.videos": "video",
  "research.common.comments": "bình luận",
  "research.common.likes": "lượt thích",
  "research.time.hoursAgo": "{count} giờ trước",
  "research.time.daysAgo": "{count} ngày trước",
  "research.time.monthsAgo": "{count} tháng trước",
  "research.time.yearsAgo": "{count} năm trước",
  "research.discover.filters": "Bộ lọc khám phá",
  "research.discover.reset": "Đặt lại",
  "research.discover.contentType": "Loại nội dung",
  "research.discover.duration": "Thời lượng",
  "research.discover.durationAny": "Mọi thời lượng",
  "research.discover.durationShort": "Dưới 4 phút",
  "research.discover.durationMedium": "4–20 phút",
  "research.discover.durationLong": "Trên 20 phút",
  "research.discover.published": "Thời gian đăng",
  "research.discover.maxDays": "Tối đa (ngày)",
  "research.discover.newestAge": "Từ · giờ trước",
  "research.discover.oldestAge": "Đến · giờ trước",
  "research.discover.now": "Hiện tại",
  "research.discover.hoursAgo": "{count} giờ trước",
  "research.discover.daysAgo": "{count} ngày trước",
  "research.discover.daysHoursAgo": "{days} ngày {hours} giờ trước",
  "research.discover.hourRange": "{from}–{to} giờ trước",
  "research.discover.serverFilterHint": "Các ngưỡng này được kiểm tra trong lúc tìm. Ứng dụng tự quét tiếp nhiều trang YouTube cho đến khi đủ video đạt điều kiện; ngưỡng view cao được ưu tiên theo lượt xem.",
  "research.discover.views": "Lượt xem",
  "research.discover.subscribers": "Người đăng ký",
  "research.discover.vphHint": "VPH chỉ hiển thị sau hai lần quét đối với video đã ghim; không dùng làm bộ lọc tìm kiếm.",
  "research.discover.queryPlaceholder": "Nhập chủ đề cần nghiên cứu...",
  "research.discover.search": "Tìm trên YouTube",
  "research.discover.sort": "Sắp xếp:",
  "research.discover.sortOutlier": "Outlier",
  "research.discover.sortViews": "Lượt xem",
  "research.discover.sortSubscribers": "Người đăng ký",
  "research.discover.sortPublished": "Thời gian đăng",
  "research.discover.sortDesc": "Giảm dần",
  "research.discover.sortAsc": "Tăng dần",
  "research.discover.sortComposite": "Tổng hợp",
  "research.discover.signalRecency": "Độ mới",
  "research.discover.compositePresets": "Mẫu nhanh:",
  "research.discover.presetBalanced": "Cân bằng",
  "research.discover.presetTrending": "Đang lên",
  "research.discover.presetBigChannel": "Kênh lớn",
  "research.discover.presetBreakout": "Bứt phá",
  "research.discover.compositeHint": "Gộp các tín hiệu đang bật thành một điểm. Trọng số cao = ảnh hưởng nhiều. Chỉ sắp xếp lại kết quả đã tải, không tìm lại.",
  "research.discover.type": "Loại:",
  "research.discover.time": "Thời gian:",
  "research.discover.clearAll": "Xoá tất cả",
  "research.discover.waitScan": "Chờ lần quét 2",
  "research.discover.unpin": "Bỏ ghim video",
  "research.discover.pin": "Ghim để đo VPH",
  "research.discover.hiddenSubs": "ẩn sub",
  "research.discover.queryRequired": "Hãy nhập chủ đề cần nghiên cứu.",
  "research.discover.apiRequired": "Hãy nhập YouTube API key trong Cài đặt.",
  "research.discover.loadFailed": "Không thể tải dữ liệu YouTube.",
  "research.discover.loadMoreFailed": "Không thể tải thêm kết quả.",
  "research.discover.filteredEmpty": "YouTube đã trả {count} video nhưng bộ lọc đang loại hết",
  "research.discover.showAll": "Xoá bộ lọc để xem tất cả",
  "research.discover.resultCount": "{shown} card đang hiển thị · đã tải {loaded} / khoảng {total} kết quả",
  "research.discover.loadMore": "Tải thêm 50 video",
  "research.discover.noResults": "YouTube không trả về video nào cho “{query}”",
  "research.discover.tryShorter": "Thử từ khoá ngắn hơn hoặc đổi loại nội dung.",
  "research.discover.start": "Nhập một chủ đề để bắt đầu",
  "research.discover.pageHint": "Mỗi trang tải tối đa 50 kết quả trực tiếp từ YouTube.",
  "research.monitor.title": "Kênh đang theo dõi",
  "research.monitor.latestSnapshot": "Snapshot gần nhất: {time}",
  "research.monitor.needTwoScans": "Cần hai lần quét để bắt đầu tính VPH",
  "research.monitor.channelSettings": "Cài đặt",
  "research.monitor.channelSettingsTitle": "Cài đặt quét · {channel}",
  "research.monitor.channelSettingsDescription": "Mỗi kênh có chu kỳ và danh sách video quét riêng.",
  "research.monitor.addChannel": "Thêm kênh",
  "research.monitor.interval": "Chu kỳ quét",
  "research.monitor.minutes": "{count} phút",
  "research.monitor.hours": "{count} giờ",
  "research.monitor.videoScanMode": "Video cần quét",
  "research.monitor.scanRange": "Phạm vi quét",
  "research.monitor.latestVideoCount": "Số video mới nhất",
  "research.monitor.videoType": "Loại video",
  "research.monitor.allVideoTypes": "Tất cả",
  "research.monitor.longVideos": "Video dài",
  "research.monitor.shorts": "Shorts",
  "research.monitor.latestVideos": "Video mới nhất",
  "research.monitor.videosPerEachChannel": "video / kênh",
  "research.monitor.chooseVideos": "Chọn video",
  "research.monitor.chooseVideosHint": "Chưa chọn video nào cho kênh này.",
  "research.monitor.chooseChannelVideos": "Chọn video · {channel}",
  "research.monitor.chooseChannelVideosDescription": "Chỉ những video được tick mới được lấy view và lưu lịch sử ở các lượt quét tiếp theo.",
  "research.monitor.searchVideos": "Tìm theo tên video",
  "research.monitor.selectedVideosCount": "Đã chọn {count} video",
  "research.monitor.allChannelVideos": "Toàn bộ video",
  "research.monitor.allVideosQuotaHint": "Quét toàn bộ video sẽ dùng thêm quota và mất nhiều thời gian với kênh lớn.",
  "research.monitor.autoScan": "Tự động quét",
  "research.monitor.scanNow": "Quét ngay",
  "research.monitor.noApiHint": "Nhập API key trong Cài đặt trước khi thêm và quét kênh.",
  "research.monitor.empty": "Chưa có kênh theo dõi",
  "research.monitor.emptyHint": "Nhấn “Thêm kênh” ở phía trên để bắt đầu.",
  "research.monitor.scannedChannels": "Kênh đã quét",
  "research.monitor.publicViews": "Tổng lượt xem công khai",
  "research.monitor.latestDelta": "View tăng lần quét mới nhất",
  "research.monitor.video": "Video",
  "research.monitor.totalViews": "Tổng view",
  "research.monitor.videoDetailDescription": "Dữ liệu thật từ các snapshot đã quét; biểu đồ không tự nội suy phần còn thiếu.",
  "research.monitor.openOnYouTube": "Mở trên YouTube",
  "research.monitor.views48h": "Lượt xem đạt được · 48h qua",
  "research.monitor.measureHint": "Cần ít nhất hai lần quét để bắt đầu đo.",
  "research.monitor.hours48Ago": "48h trước",
  "research.monitor.now": "Hiện tại",
  "research.monitor.measuredInterval": "{count} view đo trong {minutes} phút",
  "research.monitor.missingInterval": "Thiếu hai snapshot thật — không điền dữ liệu",
  "research.monitor.noPublicVideos": "Không có video công khai.",
  "research.monitor.showMoreVideos": "Hiện thêm {count} video",
  "research.monitor.collapseVideos": "Thu gọn còn 10 video",
  "research.monitor.remove": "Bỏ theo dõi",
  "research.monitor.dialogTitle": "Thêm kênh theo dõi",
  "research.monitor.dialogDescription": "Nhập Channel ID, URL YouTube hoặc @handle. Dùng ID/@handle sẽ tiết kiệm quota hơn tìm theo tên.",
  "research.monitor.addAndScan": "Thêm và quét",
  "research.comments.single": "Một video",
  "research.comments.channel": "Cả kênh",
  "research.comments.singleTitle": "Phân tích bình luận một video",
  "research.comments.channelTitle": "Thu thập bình luận theo kênh",
  "research.comments.singleHint": "Nhập URL hoặc Video ID. Ứng dụng sẽ tải metadata và toàn bộ bình luận công khai.",
  "research.comments.channelHint": "Nhập URL, @handle hoặc Channel ID để tải danh sách video và xuất bình luận.",
  "research.comments.analyze": "Phân tích",
  "research.comments.loadChannel": "Tải kênh",
  "research.comments.filterPlaceholder": "Lọc nội dung hoặc tác giả...",
  "research.comments.youtubeOrder": "Thứ tự YouTube",
  "research.comments.mostLiked": "Nhiều like nhất",
  "research.comments.newest": "Mới nhất",
  "research.comments.oldest": "Cũ nhất",
  "research.comments.noMatch": "Không có bình luận phù hợp.",
  "research.comments.displayLimit": "Đang hiển thị 200 luồng bình luận đầu để giao diện không bị chậm. File CSV vẫn chứa đầy đủ.",
  "research.comments.videoInvalid": "URL hoặc Video ID không hợp lệ.",
  "research.comments.loadingVideo": "Đang tải thông tin video...",
  "research.comments.videoNotFound": "Không tìm thấy video hoặc video không công khai.",
  "research.comments.loadingComments": "Đang tải bình luận...",
  "research.comments.loadedComments": "Đã tải {count} bình luận...",
  "research.comments.done": "Hoàn tất · {count} bình luận",
  "research.comments.videoFailed": "Không thể phân tích video.",
  "research.comments.loadingChannel": "Đang đọc danh sách video của kênh...",
  "research.comments.foundVideos": "Đã tìm thấy {count} video...",
  "research.comments.channelReady": "Đã tải {count} video. Chọn số video rồi tải bình luận.",
  "research.comments.channelFailed": "Không thể tải kênh.",
  "research.comments.processing": "Video {current}/{total}: {title}",
  "research.comments.channelDone": "Hoàn tất · {comments} bình luận từ {videos} video",
  "research.comments.allFailed": "Không thể tải hết bình luận của kênh.",
  "research.comments.publicComments": "{count} bình luận công khai",
  "research.comments.exportFull": "Xuất CSV đầy đủ",
  "research.comments.loadedVideoCount": "{subscribers} người đăng ký · {videos} video đã tải",
  "research.comments.metadataCsv": "CSV metadata",
  "research.comments.commentsCsv": "CSV bình luận",
  "research.comments.collectFrom": "Lấy bình luận của",
  "research.comments.latestVideos": "{count} video mới nhất",
  "research.comments.allVideos": "Tất cả video",
  "research.comments.fetch": "Tải bình luận",
  "research.comments.quotaWarning": "Tác vụ lớn sẽ sử dụng nhiều quota đọc API",
  "research.comments.noApiHint": "Thêm API key trong Cài đặt để phân tích bình luận.",
  "research.comments.csvVideo": "Video",
  "research.comments.csvVideoUrl": "URL video",
  "research.comments.csvDescription": "Mô tả",
  "research.comments.csvAuthor": "Tác giả",
  "research.comments.csvType": "Loại",
  "research.comments.csvPublished": "Ngày đăng",
  "research.comments.csvComment": "Bình luận",
  "research.comments.csvReply": "Trả lời",
  "research.comments.csvTitle": "Tiêu đề",
  "research.settings.description": "Mỗi API key có một ô riêng. Khi key hiện tại hết quota, ứng dụng tự chuyển sang key khả dụng tiếp theo.",
  "research.settings.keyList": "Danh sách API key",
  "research.settings.keyLabel": "API key {count}",
  "research.settings.addKey": "Thêm API key",
  "research.settings.removeKey": "Xoá API key",
  "research.settings.hideKeys": "Ẩn key",
  "research.settings.showKeys": "Hiện key",
  "research.settings.localOnly": "{count} key · chỉ lưu cục bộ trên thiết bị.",
  "research.settings.createKey": "Tạo API key",
  "research.settings.testAll": "Kiểm tra tất cả",
  "research.settings.save": "Lưu danh sách",
  "research.settings.saved": "Đã lưu {count} API key. Hệ thống sẽ tự động xoay key.",
  "research.settings.enterKey": "Hãy nhập ít nhất một API key.",
  "research.settings.invalid": "Không hợp lệ",
  "research.settings.quotaTitle": "Quota ước tính hôm nay",
  "research.settings.quotaHint": "Số request ứng dụng đã dùng. Không tự giới hạn ở 10K vì project có thể được cấp quota cao hơn.",
  "research.settings.resetQuota": "Đặt lại ước tính",
  "research.settings.active": "Đang dùng",
  "research.settings.keyPosition": "Key {current}/{total}",
  "research.settings.readRemaining": "Request đọc đã dùng",
  "research.settings.searchRemaining": "Request tìm đã dùng",
  "research.api.searchQuota": "Tất cả API key đã hết quota tìm kiếm hôm nay.",
  "research.api.readQuota": "Tất cả API key đã hết quota đọc dữ liệu hôm nay.",
  "research.api.failed": "Không thể gọi YouTube API.",
  "research.api.httpError": "YouTube API trả về lỗi {status}",
  "research.api.invalidKey": "API key không hợp lệ hoặc YouTube Data API chưa được bật.",
  "research.api.channelNotFound": "Không tìm thấy kênh YouTube này.",
  "research.api.noPlaylist": "Kênh không có danh sách video công khai.",
  "research.api.youtubeUser": "Người dùng YouTube",
  "research.api.commentsFailed": "Không thể tải bình luận.",
  "research.api.commentsDisabled": "Video này đã tắt bình luận.",
  "research.api.scanFailed": "Không thể hoàn tất lần quét YouTube."
};
const messages = {
  "appHome.mediaToolkit.title": "Bộ công cụ Media",
  "appHome.mediaToolkit.description": "Xem trước và tải video, âm thanh, phụ đề trong cùng một nơi.",
  "mediaToolkit.title": "Bộ công cụ Media",
  "mediaToolkit.subtitle": "Xem • Tải video • Phụ đề",
  "mediaToolkit.urlPlaceholder": "Dán link YouTube, TikTok, Facebook, Vimeo hoặc nền tảng được hỗ trợ…",
  "mediaToolkit.useCurrentVideo": "Dùng video này",
  "mediaToolkit.browserAddress": "Địa chỉ YouTube",
  "mediaToolkit.currentMedia": "Media hiện tại",
  "mediaToolkit.currentMediaHint": "Tự nhận link từ video đang xem",
  "mediaToolkit.pickVideoTitle": "Chọn một video trên YouTube",
  "mediaToolkit.pickVideoHint": "Mở video bất kỳ rồi bấm “Dùng video này” để hiện công cụ tải và phụ đề.",
  "mediaToolkit.profile.select": "Profile YouTube",
  "mediaToolkit.profile.create": "Tạo profile trắng",
  "mediaToolkit.profile.rename": "Đổi tên profile",
  "mediaToolkit.profile.delete": "Xóa profile",
  "mediaToolkit.profile.deleteConfirm": "Xóa “{name}” cùng toàn bộ cookie và dữ liệu YouTube của profile này?",
  "mediaToolkit.profile.renameTitle": "Đổi tên profile YouTube",
  "mediaToolkit.profile.renameDescription": "Chọn một tên ngắn để dễ nhận biết phiên duyệt YouTube này.",
  "mediaToolkit.profile.deleteTitle": "Xóa profile YouTube?",
  "mediaToolkit.profile.save": "Lưu thay đổi",
  "mediaToolkit.profile.confirmDelete": "Xóa profile",
  "mediaToolkit.desktopOnly": "Công cụ này chỉ dùng trong ứng dụng Electron.",
  "mediaToolkit.invalidUrl": "Hãy nhập link http(s) hợp lệ.",
  "mediaToolkit.analyzeFailed": "Không thể phân tích link này.",
  "mediaToolkit.downloadFailed": "Tải xuống thất bại.",
  "mediaToolkit.downloadDone": "Đã tải xuống xong.",
  "mediaToolkit.subtitleEditor": "Không gian phụ đề",
  "mediaToolkit.srtPlaceholder": "SRT tải về hoặc tạo mới sẽ xuất hiện ở đây…",
  "mediaToolkit.saveSrt": "Lưu SRT",
  "mediaToolkit.showFile": "Mở thư mục",
  "mediaToolkit.downloadTitle": "Tải nội dung",
  "mediaToolkit.kind.video": "Video",
  "mediaToolkit.kind.audio": "Âm thanh",
  "mediaToolkit.kind.subtitle": "Phụ đề",
  "mediaToolkit.kind.thumbnail": "Ảnh bìa",
  "mediaToolkit.quality": "Chất lượng tối đa",
  "mediaToolkit.best": "Tốt nhất",
  "mediaToolkit.audioFormat": "Định dạng âm thanh",
  "mediaToolkit.startTime": "Bắt đầu",
  "mediaToolkit.endTime": "Kết thúc",
  "mediaToolkit.startTimePlaceholder": "0:30",
  "mediaToolkit.endTimePlaceholder": "1:23",
  "mediaToolkit.loadPlaylist": "Đưa playlist vào hàng đợi",
  "mediaToolkit.playlistFailed": "Không thể đọc playlist này.",
  "mediaToolkit.playlistLoaded": "Đã thêm {count} video vào hàng đợi.",
  "mediaToolkit.queueTitle": "Hàng đợi tải",
  "mediaToolkit.batchHint": "Dán nhiều URL để xếp hàng. Ứng dụng chỉ lấy thông tin khi bạn bắt đầu tải.",
  "mediaToolkit.batchUrlPlaceholder": "Dán URL video để thêm vào batch…",
  "mediaToolkit.batchAdd": "Thêm vào batch",
  "mediaToolkit.batchImportTxt": "Nhập file TXT",
  "mediaToolkit.batchFetchHint": 'File TXT: mỗi dòng là một URL, có thể kèm khoảng thời gian cách nhau bởi dấu cách, ví dụ "URL 1:23-2:45" — để trống sẽ tải toàn bộ video.',
  "mediaToolkit.batchFetching": "Đang lấy thông tin…",
  "mediaToolkit.batchWaiting": "Đang chờ tải",
  "mediaToolkit.batchFailed": "Không thể đọc URL — có thể thử tải lại",
  "mediaToolkit.batchEmpty": "Chưa có video — dán URL phía trên để bắt đầu.",
  "mediaToolkit.batchRemove": "Xóa khỏi batch",
  "mediaToolkit.batchImported": "Đã nhập {count} URL từ file TXT.",
  "mediaToolkit.batchNoValidUrl": "Không tìm thấy URL hợp lệ mới trong file.",
  "mediaToolkit.batchConfigTitle": "Cấu hình tải video",
  "mediaToolkit.batchConfigDescription": "Chọn nội dung muốn tải cho {count} video đã chọn. Sau đó ứng dụng mới mở cửa sổ chọn thư mục.",
  "mediaToolkit.batchChooseFolder": "Tiếp tục chọn thư mục",
  "mediaToolkit.queueSelectVideo": "Chọn video này",
  "mediaToolkit.queueDeselectVideo": "Bỏ chọn video này",
  "mediaToolkit.tasks": "tác vụ",
  "mediaToolkit.queueSettings": "Thông số video trong hàng đợi",
  "mediaToolkit.backToCurrent": "Quay lại video hiện tại",
  "mediaToolkit.downloadTasks": "Chọn thư mục và tải {count} tác vụ",
  "mediaToolkit.queueAdded": "Đã thêm vào hàng đợi tải.",
  "mediaToolkit.addQueue": "Thêm vào hàng đợi",
  "mediaToolkit.selectAll": "Chọn tất cả",
  "mediaToolkit.clearSelection": "Bỏ chọn",
  "mediaToolkit.downloadQueue": "Chọn thư mục và tải hàng đợi",
  "mediaToolkit.queueProgress": "Đang tải {current}/{total}",
  "mediaToolkit.queueDone": "Đã tải {completed}/{total} mục.",
  "mediaToolkit.subtitleTrack": "Ngôn ngữ phụ đề",
  "mediaToolkit.noSubtitle": "Không có phụ đề",
  "mediaToolkit.searchSubtitle": "Tìm tên hoặc mã ngôn ngữ…",
  "mediaToolkit.noSubtitleMatch": "Không tìm thấy ngôn ngữ phù hợp",
  "mediaToolkit.auto": "tự động",
  "mediaToolkit.multiDownloadDone": "Đã tải {completed}/{total} mục đã chọn.",
  "mediaToolkit.cancel": "Hủy",
  "mediaToolkit.generateSubtitle": "Tạo phụ đề bằng Whisper",
  "mediaToolkit.generateFallbackHint": "Video này không có track phụ đề để tải. Whisper có thể tạo phụ đề từ âm thanh.",
  "mediaToolkit.provider": "Nhà cung cấp",
  "mediaToolkit.sourceLanguage": "Ngôn ngữ nguồn",
  "mediaToolkit.generate": "Tạo SRT",
  "mediaToolkit.whisperKeyRequired": "Hãy nhập Whisper API key trước.",
  "mediaToolkit.transcribeFailed": "Không thể nhận dạng lời nói.",
  "mediaToolkit.transcribeDone": "Đã tạo phụ đề xong.",
  "mediaToolkit.stage.installing": "Đang cài bộ máy tải…",
  "mediaToolkit.stage.analyzing": "Đang đọc thông tin media…",
  "mediaToolkit.stage.downloading": "Đang tải…",
  "mediaToolkit.stage.processing": "Đang xử lý media…",
  "mediaToolkit.stage.done": "Hoàn tất",
  "mediaToolkit.stage.error": "Đã xảy ra lỗi"
};
const contentChat = {
  "appHome.contentChat.title": "Content Chat",
  "appHome.contentChat.description": "Trò chuyện trực tiếp với AI CLI để tự xây dựng nội dung và kịch bản theo yêu cầu của bạn.",
  "contentChat.title": "Content Chat",
  "contentChat.railLabel": "Content",
  "contentChat.newConversation": "Cuộc trò chuyện mới",
  "contentChat.noHistory": "Chưa có cuộc trò chuyện nào.",
  "contentChat.deleteConversation": "Xóa cuộc trò chuyện",
  "contentChat.noInjectedPrompt": "Tin nhắn gửi nguyên văn · System prompt theo cuộc chat · Bộ nhớ từ memory.md",
  "contentChat.defaultModel": "Model mặc định của CLI",
  "contentChat.refreshCli": "Kiểm tra lại CLI",
  "contentChat.emptyTitle": "Bạn muốn làm nội dung gì?",
  "contentChat.emptyDescription": "Hãy nhập yêu cầu theo cách bạn muốn. Bạn có thể đặt System prompt riêng cho cuộc trò chuyện và dùng memory.md làm bộ nhớ workspace.",
  "contentChat.placeholder": "Nhập yêu cầu của bạn…",
  "contentChat.inputHint": "Enter để gửi · Shift + Enter để xuống dòng",
  "contentChat.connected": "Đã kết nối {cli}",
  "contentChat.disconnected": "CLI chưa sẵn sàng",
  "contentChat.cliUnavailable": "{cli} CLI chưa được cài đặt hoặc chưa sẵn sàng.",
  "contentChat.stop": "Dừng trả lời",
  "contentChat.send": "Gửi",
  "contentChat.copy": "Sao chép",
  "contentChat.desktopOnly": "Workspace cho Content Chat chỉ khả dụng trong ứng dụng desktop.",
  "contentChat.defaultWorkspace": "Workspace mặc định",
  "contentChat.useDefaultWorkspace": "Dùng mặc định",
  "contentChat.workspaceChanged": "Đã đổi workspace cho cuộc trò chuyện.",
  "contentChat.defaultWorkspaceRestored": "Đã chuyển về workspace mặc định của ứng dụng.",
  "contentChat.memoryTitle": "Bộ nhớ của workspace",
  "contentChat.memoryDescription": "Mỗi thư mục có một memory.md riêng. Các cuộc trò chuyện cùng dùng thư mục này sẽ dùng chung bộ nhớ.",
  "contentChat.workspace": "Thư mục làm việc",
  "contentChat.memoryPlaceholder": "Nhập thông tin lâu dài dành riêng cho workspace này…",
  "contentChat.memoryScopeHint": "Ứng dụng chuyển nguyên văn nội dung file này cho CLI. Không có memory riêng cho từng cuộc trò chuyện.",
  "contentChat.saveMemory": "Lưu memory.md",
  "contentChat.memorySaved": "Đã lưu memory.md. Phiên CLI sẽ tự làm mới ở tin nhắn tiếp theo.",
  "contentChat.systemPromptButton": "System",
  "contentChat.systemPromptTitle": "System prompt của cuộc trò chuyện",
  "contentChat.systemPromptDescription": "Đặt vai trò, nguyên tắc và cách phản hồi riêng cho cuộc trò chuyện này.",
  "contentChat.systemPromptPlaceholder": "Ví dụ: Bạn là biên tập viên nội dung. Trả lời ngắn gọn, kiểm tra dữ kiện và ưu tiên tiếng Việt…",
  "contentChat.systemPromptScopeHint": "Chỉ áp dụng cho cuộc trò chuyện này. memory.md vẫn là bộ nhớ dùng chung của workspace.",
  "contentChat.saveSystemPrompt": "Lưu System prompt",
  "contentChat.systemPromptSaved": "Đã lưu System prompt. Phiên CLI sẽ tự làm mới ở tin nhắn tiếp theo.",
  "contentChat.collapseSidebar": "Thu gọn thanh lịch sử",
  "contentChat.expandSidebar": "Mở thanh lịch sử",
  "contentChat.providerLocked": "Nhà cung cấp đã được khóa cho session này",
  "contentChat.workspaceLocked": "Workspace đã được khóa sau khi bắt đầu chat",
  "contentChat.openWorkspace": "Mở thư mục workspace: {path}",
  "contentChat.workspaceOpenFailed": "Không thể mở thư mục workspace.",
  "contentChat.openFile": "Mở bằng ứng dụng mặc định",
  "contentChat.revealFile": "Hiện file trong Explorer",
  "contentChat.fileOpenFailed": "Không thể mở file.",
  "contentChat.fileRevealFailed": "Không thể hiện file trong Explorer.",
  "contentChat.previewUnsupported": "Định dạng file này chưa hỗ trợ xem trước.",
  "contentChat.previewTruncated": "Chỉ hiển thị phần đầu của file",
  "contentChat.slashCommands": "Lệnh của ứng dụng và {cli}",
  "contentChat.noSlashCommands": "Không tìm thấy lệnh phù hợp.",
  "contentChat.slashNew": "Bắt đầu một cuộc trò chuyện mới",
  "contentChat.slashClear": "Xóa ngữ cảnh bằng một cuộc trò chuyện mới",
  "contentChat.slashMemory": "Mở memory.md của workspace",
  "contentChat.slashFolder": "Mở hoặc chọn thư mục workspace",
  "contentChat.search": "Tìm kiếm cuộc trò chuyện",
  "contentChat.searchPlaceholder": "Tìm trong lịch sử…",
  "contentChat.clearSearch": "Xóa nội dung tìm kiếm",
  "contentChat.noSearchResults": "Không tìm thấy cuộc trò chuyện phù hợp.",
  "contentChat.chatActions": "Tùy chọn cuộc trò chuyện",
  "contentChat.pin": "Ghim cuộc trò chuyện",
  "contentChat.unpin": "Bỏ ghim",
  "contentChat.rename": "Đổi tên",
  "contentChat.renameTitle": "Đổi tên cuộc trò chuyện",
  "contentChat.renameDescription": "Đặt một tên ngắn để dễ tìm lại cuộc trò chuyện này.",
  "contentChat.defaultEffort": "Suy luận: Tự động"
};
const autoEdit = {
  "autoEdit.underDevelopment": "Đang phát triển",
  "autoEdit.underDevelopmentHint": "Tính năng này đang được phát triển. Vui lòng quay lại sau.",
  "autoEdit.title": "Auto Edit",
  "autoEdit.untitled": "Chưa đặt tên",
  "autoEdit.undo": "Hoàn tác",
  "autoEdit.redo": "Làm lại",
  "autoEdit.export": "Xuất video",
  "autoEdit.render": "Render",
  "autoEdit.panels.assets": "Tài nguyên",
  "autoEdit.panels.preview": "Xem trước",
  "autoEdit.panels.properties": "Thuộc tính",
  "autoEdit.panels.timeline": "Dòng thời gian",
  "autoEdit.preview.fit": "Vừa màn hình",
  "autoEdit.preview.fullscreen": "Toàn màn hình",
  "autoEdit.assetsTab.media": "Phương tiện",
  "autoEdit.assetsTab.audio": "Âm thanh",
  "autoEdit.assetsTab.text": "Văn bản",
  "autoEdit.assetsTab.effects": "Hiệu ứng",
  "autoEdit.assetsTab.transitions": "Chuyển cảnh",
  "autoEdit.transitions.hint": "Kéo vào một clip để hòa hình sang clip kế tiếp trên cùng track.",
  "autoEdit.library.clickOrDrag": "Bấm để áp dụng, hoặc kéo vào clip",
  "autoEdit.library.dragToClip": "Kéo vào một clip",
  "autoEdit.drop.noClip": "Hãy thả vào một clip",
  "autoEdit.drop.noCut": "Hãy thả vào chỗ nối giữa hai clip",
  "autoEdit.assetsTab.captions": "Phụ đề",
  "autoEdit.assetsTab.auto": "Tự động",
  "autoEdit.auto.import": "Nhập JSON / CSV",
  "autoEdit.auto.hint": "Chỉ đọc bốn trường: ảnh/video, giọng đọc tương ứng, hiệu ứng và chuyển cảnh. Các cột khác bỏ qua. Đường dẫn tuyệt đối dùng luôn; chỉ có tên file thì đối chiếu với media đã nhập.",
  "autoEdit.auto.shots": "Số cảnh đã đặt",
  "autoEdit.auto.skipped": "Dòng bị bỏ qua",
  "autoEdit.auto.missing": "Không tìm thấy media",
  "autoEdit.auto.noRows": "Tệp không có dòng nào dùng được",
  "autoEdit.auto.noMedia": "Không tìm thấy media nào được tham chiếu",
  "autoEdit.auto.done": "Đã dựng timeline",
  "autoEdit.track.video": "Video",
  "autoEdit.track.audio": "Âm thanh",
  "autoEdit.track.text": "Văn bản",
  "autoEdit.track.effect": "Hiệu ứng",
  "autoEdit.track.main": "Chính",
  "autoEdit.emptyProject": "Tạo dự án mới để bắt đầu chỉnh sửa",
  "autoEdit.comingSoon": "Tính năng sắp ra mắt",
  "autoEdit.addText": "Thêm văn bản",
  "autoEdit.importMedia": "Nhập phương tiện",
  "autoEdit.noSelection": "Chọn một phần tử để chỉnh sửa",
  "autoEdit.speed": "Tốc độ",
  "autoEdit.duration": "Thời lượng",
  "autoEdit.volume": "Âm lượng",
  "autoEdit.transition": "Chuyển cảnh",
  "autoEdit.transition.none": "Không",
  "autoEdit.transition.duration": "Thời lượng",
  "autoEdit.transition.needsNext": "Cần một clip kế tiếp trên cùng track",
  "autoEdit.motion.apply": "Áp dụng cho clip đang chọn",
  "autoEdit.element.image": "Hình ảnh",
  "autoEdit.delete": "Xóa",
  "autoEdit.duplicate": "Nhân đôi",
  "autoEdit.split": "Tách",
  "autoEdit.zoomIn": "Phóng to",
  "autoEdit.zoomOut": "Thu nhỏ",
  "autoEdit.hideTrack": "Ẩn track",
  "autoEdit.muteTrack": "Tắt tiếng",
  "autoEdit.ripple": "Ripple",
  "autoEdit.ripple.hint": "Dồn lại khoảng trống khi xóa hoặc cắt ngắn clip",
  "autoEdit.captions.transcribe": "Tạo phụ đề",
  "autoEdit.captions.empty": "Nhập video hoặc âm thanh để tạo phụ đề",
  "autoEdit.captions.transcribing": "Đang nhận dạng giọng nói…",
  "autoEdit.captions.done": "Đã thêm phụ đề",
  "autoEdit.captions.noApiKey": "Cấu hình khóa API Whisper trong Video Studio",
  "autoEdit.captions.failed": "Nhận dạng giọng nói thất bại",
  "autoEdit.captions.noCaptions": "Không tìm thấy phụ đề",
  "autoEdit.captions.unavailable": "Tính năng nhận dạng giọng nói không khả dụng",
  "autoEdit.effects": "Hiệu ứng",
  "autoEdit.effects.empty": "Chưa áp dụng hiệu ứng nào",
  "autoEdit.motion": "Chuyển động",
  "autoEdit.masks": "Mặt nạ",
  "autoEdit.masks.feather": "Làm mềm",
  "autoEdit.masks.inverted": "Đảo ngược",
  "autoEdit.export.noContent": "Chưa có nội dung để xuất.",
  "autoEdit.export.unavailable": "Xuất video chỉ khả dụng trong app desktop.",
  "autoEdit.export.canceled": "Đã hủy xuất video.",
  "autoEdit.export.failed": "Xuất video thất bại.",
  "autoEdit.export.done": "Đã xuất video.",
  "autoEdit.export.resolution": "Độ phân giải",
  "autoEdit.export.codec": "Codec",
  "autoEdit.export.quality": "Chất lượng (CRF)",
  "autoEdit.export.canvas": "Theo canvas",
  "autoEdit.newProject": "Dự án mới",
  "autoEdit.openProject": "Mở dự án",
  "autoEdit.saveProject": "Lưu dự án",
  "autoEdit.project.saved": "Đã lưu dự án.",
  "autoEdit.project.loaded": "Đã mở dự án.",
  "autoEdit.project.loadFailed": "Không mở được dự án.",
  "autoEdit.project.saveFailed": "Không lưu được dự án.",
  "autoEdit.project.invalid": "Tệp dự án không hợp lệ.",
  "autoEdit.scenes": "Cảnh",
  "autoEdit.scenes.add": "Thêm cảnh",
  "autoEdit.scenes.rename": "Đổi tên",
  "autoEdit.scenes.delete": "Xóa",
  "autoEdit.scenes.main": "Chính",
  "autoEdit.dashboard.subtitle": "Dự án",
  "autoEdit.dashboard.empty": "Chưa có dự án nào",
  "autoEdit.dashboard.emptyHint": "Tạo dự án để bắt đầu chỉnh sửa.",
  "autoEdit.dashboard.rename": "Đổi tên",
  "autoEdit.dashboard.reveal": "Mở trong thư mục",
  "autoEdit.dashboard.confirmDelete": "Xóa?",
  "autoEdit.dashboard.back": "Về trang dự án"
};
const vi = mergeCatalogSections(
  core,
  projects,
  settings,
  script,
  director,
  characters,
  scenes,
  generation,
  media,
  features,
  account,
  tts,
  research,
  messages,
  contentChat,
  autoEdit
);
const catalogs = { en, vi };
function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}
function translate(language, key, params) {
  const catalog = catalogs[language];
  const fallback = catalogs.en;
  const message = catalog[key] ?? fallback[key] ?? key;
  return interpolate(message, params);
}
function getLocale(language) {
  return language === "vi" ? "vi-VN" : "en-US";
}
function useI18n() {
  const language = useUIPreferencesStore((state) => state.uiLanguage);
  return reactExports.useMemo(
    () => ({
      language,
      locale: getLocale(language),
      t: (key, params) => translate(language, key, params)
    }),
    [language]
  );
}
const Dialog = Root;
const DialogTrigger = Trigger;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-250 bg-black/10 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] p-6 z-250 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl",
        className
      ),
      onCloseAutoFocus: (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-3 top-3 flex size-7 cursor-pointer items-center justify-center rounded-lg bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:pointer-events-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: translate(useUIPreferencesStore.getState().uiLanguage, "common.close") })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
const useAccountProfileStore = create()(
  persist(
    (set) => ({
      avatarDataUrl: "",
      setAvatarDataUrl: (avatarDataUrl) => set({ avatarDataUrl }),
      clearAvatar: () => set({ avatarDataUrl: "" })
    }),
    {
      name: "longdd-local-account-profile",
      version: 1
    }
  )
);
const Input = reactExports.forwardRef(
  ({
    className,
    type,
    containerClassName,
    showPassword,
    onShowPasswordChange,
    showClearIcon,
    onClear,
    value,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = reactExports.useState(false);
    const isPassword = type === "password";
    const showPasswordToggle = isPassword && onShowPasswordChange;
    const showClear = showClearIcon && onClear && value && String(value).length > 0 && isFocused;
    const inputType = isPassword && showPassword ? "text" : type;
    const hasIcons = showPasswordToggle || showClear;
    const iconCount = Number(showPasswordToggle) + Number(showClear);
    const paddingRight = iconCount === 2 ? "pr-20" : iconCount === 1 ? "pr-10" : "";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(hasIcons ? "relative w-full" : "", containerClassName), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: inputType,
          className: cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input/40 flex h-9 w-full min-w-0 rounded-lg border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[2px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            paddingRight,
            className
          ),
          ref,
          value,
          onFocus: (e) => {
            setIsFocused(true);
            onFocus?.(e);
          },
          onBlur: (e) => {
            setIsFocused(false);
            onBlur?.(e);
          },
          ...props
        }
      ),
      showClear && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "text",
          size: "icon",
          onMouseDown: (e) => {
            e.preventDefault();
            onClear?.();
          },
          className: "absolute right-0 top-0 h-full px-3 text-muted-foreground !opacity-100",
          "aria-label": "Clear input",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "!size-[0.85]" })
        }
      ),
      showPasswordToggle && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "text",
          size: "icon",
          onClick: () => onShowPasswordChange?.(!showPassword),
          className: cn(
            "absolute top-0 h-full px-3 text-muted-foreground hover:text-foreground",
            showClear ? "right-10" : "right-0"
          ),
          "aria-label": showPassword ? "Hide password" : "Show password",
          children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" })
        }
      )
    ] });
  }
);
Input.displayName = "Input";
const MAX_AVATAR_SIZE = 256;
function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "L";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
}
function formatAccountDate(value, locale, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
async function createLocalAvatar(file) {
  if (!file.type.startsWith("image/")) throw new Error("invalid-image");
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("invalid-image"));
      nextImage.src = sourceUrl;
    });
    const scale = Math.min(1, MAX_AVATAR_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("invalid-image");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.84);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
function AvatarPreview({ src, name, size = "small" }) {
  const sizeClass = size === "large" ? "h-20 w-20 text-xl" : "h-7 w-7 text-2xs";
  return src ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src,
      alt: "",
      className: `${sizeClass} rounded-full border border-border object-cover bg-muted`
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${sizeClass} rounded-full border border-primary/20 bg-primary/10 text-primary flex items-center justify-center font-semibold`, children: name ? getInitials(name) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: size === "large" ? "h-8 w-8" : "h-3.5 w-3.5" }) });
}
function AccountSidebarButton() {
  const { t, language } = useI18n();
  const locale = getLocale(language);
  const inputRef = reactExports.useRef(null);
  const [processingImage, setProcessingImage] = reactExports.useState(false);
  const [editingName, setEditingName] = reactExports.useState(false);
  const [savingName, setSavingName] = reactExports.useState(false);
  const avatarDataUrl = useAccountProfileStore((state) => state.avatarDataUrl);
  const setAvatarDataUrl = useAccountProfileStore((state) => state.setAvatarDataUrl);
  const clearAvatar = useAccountProfileStore((state) => state.clearAvatar);
  const {
    userName,
    email,
    plan,
    registeredAt,
    lastValidUntil,
    lastCheckedAt,
    machineId,
    maxDevices,
    setUserName,
    clearAccount
  } = useLicenseStore();
  const [draftName, setDraftName] = reactExports.useState(userName);
  const fallback = t("account.notAvailable");
  const handleAvatarFile = async (file) => {
    if (!file) return;
    setProcessingImage(true);
    try {
      setAvatarDataUrl(await createLocalAvatar(file));
      toast.success(t("account.avatarUpdated"));
    } catch {
      toast.error(t("account.invalidImage"));
    } finally {
      setProcessingImage(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const handleSaveName = async () => {
    const name = draftName.trim();
    if (!name) return;
    setSavingName(true);
    try {
      await updateDisplayName(name);
      setUserName(name);
      setEditingName(false);
      toast.success(language === "vi" ? "Đã cập nhật tên hiển thị" : "Display name updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot update display name");
    } finally {
      setSavingName(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOutAccount();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot sign out");
    } finally {
      clearAccount();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        title: userName || t("account.title"),
        className: "flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarPreview, { src: avatarDataUrl, name: userName }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block w-full truncate px-0.5 text-center text-2xs font-medium leading-tight", children: userName || t("account.title") })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("account.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("account.description") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 rounded-xl border border-border/60 bg-muted/20 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarPreview, { src: avatarDataUrl, name: userName, size: "large" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          editingName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: draftName, onChange: (event) => setDraftName(event.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", disabled: !draftName.trim() || savingName, onClick: () => void handleSaveName(), children: savingName ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: userName || fallback }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "icon",
                variant: "ghost",
                className: "h-7 w-7",
                onClick: () => {
                  setDraftName(userName);
                  setEditingName(true);
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs text-muted-foreground", children: email || fallback }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: inputRef,
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: (event) => void handleAvatarFile(event.target.files?.[0])
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", disabled: processingImage, onClick: () => inputRef.current?.click(), children: [
              processingImage ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "mr-2 h-4 w-4" }),
              t("account.changeAvatar")
            ] }),
            avatarDataUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => {
                  clearAvatar();
                  toast.success(t("account.avatarRemoved"));
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                  t("account.removeAvatar")
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xs text-muted-foreground", children: t("account.localAvatarHint") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid grid-cols-2 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: t("account.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 truncate font-medium", children: userName || fallback })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: t("account.plan") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 font-medium uppercase text-primary", children: plan })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: language === "vi" ? "Ngày đăng ký" : "Registered" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 font-medium", children: formatAccountDate(registeredAt, locale, fallback) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: t("account.expiresAt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 font-medium", children: lastValidUntil ? formatAccountDate(lastValidUntil, locale, fallback) : t("account.noExpiration") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: t("account.lastCheckedAt") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 font-medium", children: formatAccountDate(lastCheckedAt, locale, fallback) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: language === "vi" ? "Số máy được phép" : "Allowed devices" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 font-medium", children: maxDevices })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 rounded-lg border border-border/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-xs text-muted-foreground", children: t("account.machineId") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 break-all font-mono text-xs", children: machineId || fallback })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full", onClick: () => void handleSignOut(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
        language === "vi" ? "Đăng xuất" : "Sign out"
      ] })
    ] })
  ] });
}
const TooltipProvider = Provider;
const Tooltip = Root3;
const TooltipTrigger = Trigger$1;
const tooltipVariants = cva(
  "z-50 overflow-visible rounded-lg text-xs shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-primary px-3 py-1.5 text-primary-foreground",
        destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive [border-width:0.5px]",
        outline: "border border-border bg-background",
        important: "bg-amber-100/90 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300 border-amber-900 [border-width:0.5px]",
        promotions: "bg-red-100/90 text-red-900 dark:bg-red-900/20 dark:text-red-300 border-red-900 [border-width:0.5px]",
        personal: "bg-green-100/90 text-green-900 dark:bg-green-900/20 dark:text-green-300 border-green-900 [border-width:0.5px]",
        updates: "bg-purple-100/90 text-purple-900 dark:bg-purple-900/20 dark:text-purple-300 border-purple-900 [border-width:0.5px]",
        forums: "bg-blue-100/90 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 border-blue-900 [border-width:0.5px]",
        sidebar: "bg-primary p-2.5 text-primary-foreground flex flex-col gap-2"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const TooltipContent = reactExports.forwardRef(({ className, sideOffset = 4, variant, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Content2,
  {
    ref,
    sideOffset,
    className: cn(tooltipVariants({ variant }), "z-[300]", className),
    ...props,
    children: [
      variant === "sidebar" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          width: "6",
          height: "10",
          viewBox: "0 0 6 10",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg",
          className: "absolute left-[-6px] top-1/2 -translate-y-1/2",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 0L0 5L6 10V0Z", className: "fill-[hsl(var(--primary))]" })
        }
      ),
      props.children
    ]
  }
) }));
TooltipContent.displayName = Content2.displayName;
function HomeLogoButton({ onClick, label, mark }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { delayDuration: 300, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick,
        "aria-label": label,
        className: "w-8 h-8 flex items-center justify-center mx-auto rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold tracking-tight", children: mark })
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: label })
  ] }) });
}
const useThemeStore = create()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" })
    }),
    {
      name: "longdd-theme",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState;
        return { ...state ?? {}, theme: "light" };
      }
    }
  )
);
const railActionClass = "flex w-full flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
function RailItem({ item }) {
  const Icon = item.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: item.onClick,
        className: cn(
          railActionClass,
          item.active && "bg-sidebar-active text-sidebar-active-foreground shadow-xs hover:bg-sidebar-active hover:text-sidebar-active-foreground"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 max-w-full text-center text-2xs font-medium leading-tight", children: item.label })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: item.tooltip || item.label })
  ] });
}
function FeatureRail({ items = [], bottomItems = [], backAction, showCliSettings = false }) {
  const { t } = useI18n();
  const goHome = useAppShellStore((state) => state.goHome);
  const openSettings = useAppShellStore((state) => state.openSettings);
  const { theme, toggleTheme } = useThemeStore();
  const { uiLanguage, setUILanguage } = useUIPreferencesStore();
  const nextLanguage = uiLanguage === "en" ? "vi" : "en";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipProvider, { delayDuration: 300, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "buzz-rail flex w-18 shrink-0 flex-col border-r border-border/60", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2 pb-2 pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(HomeLogoButton, { onClick: goHome, label: t("appHome.backToHome"), mark: t("brand.mark") }),
      backAction && /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: backAction.onClick, "aria-label": backAction.label, className: "mt-1.5 flex h-5 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-3.5" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: backAction.label })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 space-y-0.5 px-1 pb-2 pt-4", children: items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(RailItem, { item }, item.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 px-1 pb-2 pt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AccountSidebarButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://www.facebook.com/logdd.pitre", target: "_blank", rel: "noopener noreferrer", className: railActionClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleQuestionMark, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-medium leading-tight", children: t("tabBar.help") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: t("tabBar.usageGuide") })
      ] }),
      showCliSettings && /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: openSettings, className: railActionClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-medium leading-tight", children: "CLI" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: t("tabBar.cliSettings") })
      ] }),
      bottomItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(RailItem, { item }, item.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setUILanguage(nextLanguage), className: railActionClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Languages, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-medium uppercase leading-tight", children: nextLanguage })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: nextLanguage === "en" ? t("tabBar.switchToEnglish") : t("tabBar.switchToVietnamese") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: toggleTheme, className: railActionClass, children: [
          theme === "dark" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "size-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-medium leading-tight", children: theme === "dark" ? t("tabBar.theme.light") : t("tabBar.theme.dark") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TooltipContent, { side: "right", className: "text-xs", children: theme === "dark" ? t("tabBar.theme.toLight") : t("tabBar.theme.toDark") })
      ] })
    ] })
  ] }) });
}
const AlertDialog = Root2;
const AlertDialogTrigger = Trigger2;
const AlertDialogPortal = Portal2;
const AlertDialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay2,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/10 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = Overlay2.displayName;
const AlertDialogContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    Content2$1,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = Content2$1.displayName;
const AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title2,
  {
    ref,
    className: cn("text-xl font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = Title2.displayName;
const AlertDialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description2,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = Description2.displayName;
const AlertDialogAction = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Action,
  {
    ref,
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = Action.displayName;
const AlertDialogCancel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Cancel,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = Cancel.displayName;
function AppHome({ blockedFeatureId }) {
  const { t } = useI18n();
  const openFeature = useAppShellStore((state) => state.openFeature);
  const goHome = useAppShellStore((state) => state.goHome);
  const licensePlan = useLicenseStore((state) => state.plan);
  const [lockedFeatureId, setLockedFeatureId] = reactExports.useState(null);
  const effectiveLockedFeatureId = blockedFeatureId ?? lockedFeatureId;
  const lockedFeature = appFeatures.find((feature) => feature.id === effectiveLockedFeatureId);
  reactExports.useEffect(() => {
    const preloadFeatures = () => {
      for (const feature of appFeatures) {
        if (feature.preloadOnIdle && hasPlanAccess(licensePlan, feature.requiredPlan)) {
          void feature.preload();
        }
      }
    };
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadFeatures, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timeoutId = globalThis.setTimeout(preloadFeatures, 250);
    return () => globalThis.clearTimeout(timeoutId);
  }, [licensePlan]);
  const closePlanDialog = () => {
    setLockedFeatureId(null);
    if (blockedFeatureId) goHome();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureRail, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative flex-1 overflow-y-auto content-edge", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-40 right-[-8rem] h-96 w-96 rounded-full bg-primary/10 blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[-12rem] left-[15%] h-80 w-80 rounded-full bg-primary/5 blur-3xl" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-6xl mx-auto px-8 py-14", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mb-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight mb-3", children: t("appHome.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 text-muted-foreground", children: t("appHome.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5", children: appFeatures.map((feature) => {
          const Icon = feature.icon;
          const canUseFeature = hasPlanAccess(licensePlan, feature.requiredPlan);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              "aria-disabled": !canUseFeature,
              onClick: () => canUseFeature ? openFeature(feature.id) : setLockedFeatureId(feature.id),
              onPointerEnter: () => {
                if (canUseFeature) void feature.preload();
              },
              onFocus: () => {
                if (canUseFeature) void feature.preload();
              },
              className: `group flex min-h-56 flex-col items-stretch justify-start text-left rounded-xl border bg-card/80 p-6 shadow-xs transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${canUseFeature ? "border-border/60 hover:border-primary/40" : "border-border/60 opacity-70 hover:border-amber-500/35"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-10", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-6 w-6" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.18em] text-primary", children: feature.requiredPlan }),
                    canUseFeature ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LockKeyhole, { className: "h-5 w-5 text-amber-500" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold mb-2", children: t(feature.titleKey) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 text-muted-foreground", children: t(feature.descriptionKey) })
              ]
            },
            feature.id
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: Boolean(lockedFeature), onOpenChange: (open) => {
      if (!open) closePlanDialog();
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("appHome.planRequiredTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("appHome.planRequiredDescription", {
          feature: lockedFeature ? t(lockedFeature.titleKey) : "",
          plan: lockedFeature?.requiredPlan.toUpperCase() ?? ""
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: closePlanDialog, children: t("appHome.planRequiredClose") }) })
    ] }) })
  ] });
}
function AppShell() {
  const activeFeatureId = useAppShellStore((state) => state.activeFeatureId);
  const licensePlan = useLicenseStore((state) => state.plan);
  if (!activeFeatureId) return /* @__PURE__ */ jsxRuntimeExports.jsx(AppHome, {});
  const definition = appFeatures.find((feature) => feature.id === activeFeatureId);
  if (!definition) return /* @__PURE__ */ jsxRuntimeExports.jsx(AppHome, {});
  if (!hasPlanAccess(licensePlan, definition.requiredPlan)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppHome, { blockedFeatureId: definition.id });
  }
  const Feature = definition.component;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    reactExports.Suspense,
    {
      fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, {})
    }
  );
}
const Toaster2 = ({ ...props }) => {
  const { theme } = useThemeStore();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      theme,
      className: "toaster group",
      position: "top-center",
      offset: 20,
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      expand: false,
      richColors: true,
      ...props
    }
  );
};
function metadataName(session) {
  const metadata = session.user.user_metadata;
  for (const key of ["full_name", "name", "display_name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
function fallbackDeviceInfo() {
  const key = "logdd-browser-device-id";
  let deviceHash = localStorage.getItem(key) || "";
  if (!deviceHash) {
    deviceHash = `browser-${crypto.randomUUID()}`;
    localStorage.setItem(key, deviceHash);
  }
  return { deviceHash, deviceName: navigator.platform || "Browser" };
}
function LicenseGate({ children }) {
  const { language } = useI18n();
  const vi2 = language === "vi";
  const [session, setSession] = reactExports.useState(null);
  const [sessionReady, setSessionReady] = reactExports.useState(false);
  const [signingIn, setSigningIn] = reactExports.useState(false);
  const [checkingAccess, setCheckingAccess] = reactExports.useState(false);
  const [accessError, setAccessError] = reactExports.useState("");
  const [blockedReason, setBlockedReason] = reactExports.useState("");
  const [nameDialogOpen, setNameDialogOpen] = reactExports.useState(false);
  const [draftName, setDraftName] = reactExports.useState("");
  const [savingName, setSavingName] = reactExports.useState(false);
  const checkingUserRef = reactExports.useRef("");
  const {
    setDeviceInfo,
    setSessionUser,
    setAccountAccess,
    setUserName,
    clearAccount
  } = useLicenseStore();
  const updateSessionAccount = reactExports.useCallback((nextSession) => {
    setSession((currentSession) => {
      if (currentSession?.user.id === nextSession?.user.id) return currentSession;
      return nextSession;
    });
  }, []);
  const processCallback = reactExports.useCallback(async (url) => {
    setSigningIn(true);
    try {
      const nextSession = await finishOAuthSignIn(url);
      updateSessionAccount(nextSession);
      toast.success(vi2 ? "Đăng nhập Google thành công" : "Signed in with Google");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setSigningIn(false);
      await window.authBridge?.consumePendingCallback();
    }
  }, [updateSessionAccount, vi2]);
  reactExports.useEffect(() => {
    let cancelled = false;
    void getStoredSession().then((stored) => {
      if (!cancelled) updateSessionAccount(stored);
    }).catch((error) => {
      if (!cancelled) toast.error(error instanceof Error ? error.message : "Cannot restore session");
    }).finally(() => {
      if (!cancelled) setSessionReady(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!cancelled) {
        updateSessionAccount(nextSession);
        setSessionReady(true);
      }
    });
    const removeCallbackListener = window.authBridge?.onOAuthCallback((url) => {
      void processCallback(url);
    });
    void window.authBridge?.consumePendingCallback().then((url) => {
      if (url && !cancelled) void processCallback(url);
    });
    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      removeCallbackListener?.();
    };
  }, [processCallback, updateSessionAccount]);
  const runAccessCheck = reactExports.useCallback(async (activeSession) => {
    if (checkingUserRef.current === activeSession.user.id) return;
    checkingUserRef.current = activeSession.user.id;
    setCheckingAccess(true);
    setAccessError("");
    setBlockedReason("");
    const googleName = metadataName(activeSession);
    setSessionUser(activeSession.user.id, activeSession.user.email || "", googleName);
    try {
      const resolvedDevice = window.authBridge ? await window.authBridge.getDeviceInfo() : fallbackDeviceInfo();
      setDeviceInfo(resolvedDevice.deviceHash, resolvedDevice.deviceName);
      const access = await checkAccountAndClaimDevice(resolvedDevice);
      setAccountAccess(access);
      if (!access.allowed || access.status === "blocked") {
        setBlockedReason(access.reason || access.status);
        return;
      }
      const onboardingKey = `logdd-display-name-confirmed:${activeSession.user.id}`;
      if (!localStorage.getItem(onboardingKey)) {
        setDraftName(access.displayName || googleName);
        setNameDialogOpen(true);
      }
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : String(error));
    } finally {
      setCheckingAccess(false);
      checkingUserRef.current = "";
    }
  }, [setAccountAccess, setDeviceInfo, setSessionUser]);
  reactExports.useEffect(() => {
    if (session) {
      void runAccessCheck(session);
    } else if (sessionReady) {
      clearAccount();
    }
  }, [clearAccount, runAccessCheck, session, sessionReady]);
  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await startGoogleSignIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot start Google sign-in");
    } finally {
      setSigningIn(false);
    }
  };
  const handleSignOut = async () => {
    try {
      await signOutAccount();
    } finally {
      setBlockedReason("");
      setAccessError("");
      clearAccount();
      setSession(null);
    }
  };
  const handleSaveName = async () => {
    const name = draftName.trim();
    if (!name) return;
    setSavingName(true);
    try {
      await updateDisplayName(name);
      setUserName(name);
      if (session) localStorage.setItem(`logdd-display-name-confirmed:${session.user.id}`, "1");
      setNameDialogOpen(false);
      toast.success(vi2 ? "Đã lưu tên hiển thị" : "Display name saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot save display name");
    } finally {
      setSavingName(false);
    }
  };
  if (!sessionReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-7 w-7 animate-spin text-primary" }) });
  }
  if (!session) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-full w-full overflow-hidden bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_38%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.08),transparent_35%)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-full flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "w-full max-w-md rounded-2xl border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold", children: "L" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-center text-2xl font-semibold", children: "logdd" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-center text-sm leading-6 text-muted-foreground", children: vi2 ? "Đăng nhập để đồng bộ tài khoản, gói sử dụng và thiết bị của bạn." : "Sign in to sync your account, plan, and registered device." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "mt-7 w-full h-11", disabled: signingIn, onClick: () => void handleGoogleSignIn(), children: [
          signingIn ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LogIn, { className: "mr-2 h-4 w-4" }),
          vi2 ? "Đăng nhập bằng Google" : "Continue with Google"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-xs text-muted-foreground", children: vi2 ? "Phiên đăng nhập sẽ được lưu cho lần mở app sau." : "Your session is saved for the next launch." })
      ] }) })
    ] });
  }
  const blockedMessage = blockedReason === "device_limit" ? vi2 ? "Tài khoản đã đạt giới hạn thiết bị. Hãy gỡ thiết bị cũ hoặc tăng số máy được phép trong Supabase." : "This account has reached its device limit." : blockedReason === "blocked" ? vi2 ? "Tài khoản này đang bị khóa." : "This account is blocked." : vi2 ? "Tài khoản không được phép sử dụng trên thiết bị này." : "This account cannot be used on this device.";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    children,
    checkingAccess && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed right-4 top-4 z-[80] flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin text-primary" }),
      vi2 ? "Đang kiểm tra tài khoản..." : "Checking account..."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: Boolean(blockedReason || accessError), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: accessError ? vi2 ? "Không thể kiểm tra tài khoản" : "Account check failed" : vi2 ? "Không thể sử dụng tài khoản" : "Account unavailable" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: accessError || blockedMessage })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => void handleSignOut(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
          vi2 ? "Đăng xuất" : "Sign out"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => void runAccessCheck(session), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-2 h-4 w-4" }),
          vi2 ? "Kiểm tra lại" : "Retry"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: nameDialogOpen, onOpenChange: () => void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm", onEscapeKeyDown: (event) => event.preventDefault(), onPointerDownOutside: (event) => event.preventDefault(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: vi2 ? "Tên hiển thị của bạn" : "Your display name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: vi2 ? "Tên này sẽ xuất hiện trên giao diện app. Bạn có thể sửa lại sau." : "This name is shown in the app UI." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          autoFocus: true,
          value: draftName,
          placeholder: vi2 ? "Nhập tên của bạn" : "Enter your name",
          onChange: (event) => setDraftName(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter" && draftName.trim()) void handleSaveName();
          }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", disabled: !draftName.trim() || savingName, onClick: () => void handleSaveName(), children: [
        savingName && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
        vi2 ? "Lưu và tiếp tục" : "Save and continue"
      ] }) })
    ] }) })
  ] });
}
function UpdateDialog({
  open,
  onOpenChange,
  updateInfo,
  onIgnoreVersion,
  mandatory = false
}) {
  const { locale, t } = useI18n();
  const [isInstalling, setIsInstalling] = reactExports.useState(false);
  const formattedPublishedAt = reactExports.useMemo(() => {
    if (!updateInfo?.publishedAt) return "";
    const publishedDate = new Date(updateInfo.publishedAt);
    if (Number.isNaN(publishedDate.getTime())) {
      return updateInfo.publishedAt;
    }
    return publishedDate.toLocaleString(locale);
  }, [locale, updateInfo?.publishedAt]);
  const handleDownloadAndInstall = async () => {
    if (!window.appUpdater) {
      toast.error(t("update.desktopOnly"));
      return;
    }
    setIsInstalling(true);
    try {
      const result = await window.appUpdater.downloadAndInstall();
      if (!result.success) {
        toast.error(result.error || t("update.installFailed"));
        setIsInstalling(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("update.installFailed"));
      setIsInstalling(false);
    }
  };
  if (!updateInfo) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open, onOpenChange: (nextOpen) => {
    if (!mandatory || nextOpen) onOpenChange(nextOpen);
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    AlertDialogContent,
    {
      className: "max-w-xl",
      onEscapeKeyDown: mandatory ? (event) => event.preventDefault() : void 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("update.newVersion", { version: updateInfo.latestVersion }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("update.upgradeAvailable", {
            currentVersion: updateInfo.currentVersion,
            latestVersion: updateInfo.latestVersion
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/30 p-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: t("update.releaseNotes") }),
                formattedPublishedAt && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("update.publishedAt", { date: formattedPublishedAt }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground rounded border border-border px-2 py-1 font-mono", children: [
                "v",
                updateInfo.currentVersion,
                " → v",
                updateInfo.latestVersion
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap leading-6", children: updateInfo.releaseNotes?.trim() || t("update.noReleaseNotes") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: t("update.installUpdate") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("update.installHint") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                className: "w-full",
                disabled: isInstalling,
                onClick: () => void handleDownloadAndInstall(),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
                  isInstalling ? t("update.installing") : t("update.installNow")
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-2", children: [
          !mandatory && onIgnoreVersion && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              onClick: () => {
                onIgnoreVersion(updateInfo.latestVersion);
                onOpenChange(false);
              },
              children: t("update.ignore")
            }
          ),
          !mandatory && /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("update.later") })
        ] })
      ]
    }
  ) });
}
function StartupUpdateGuard({ children }) {
  const [updateInfo, setUpdateInfo] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void window.appUpdater?.checkForUpdates().then((result) => {
        if (!cancelled && result.success && result.hasUpdate && result.update) {
          setUpdateInfo(result.update);
        }
      }).catch(() => {
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UpdateDialog,
      {
        mandatory: true,
        open: Boolean(updateInfo),
        onOpenChange: () => void 0,
        updateInfo
      }
    )
  ] });
}
const isCliRuntimeBeta = false;
const DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 500;
const MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 100;
const MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD = 5e4;
const DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 2;
const MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 1;
const MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY = 8;
const DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 8;
const MIN_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 1;
const MAX_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES = 120;
const DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY = 2;
const MIN_AUTOPILOT_PLANNING_CONCURRENCY = 1;
const MAX_AUTOPILOT_PLANNING_CONCURRENCY = 8;
const DEFAULT_TEXT_API_BATCH_CONCURRENCY = 1;
const MIN_TEXT_API_BATCH_CONCURRENCY = 1;
const MAX_TEXT_API_BATCH_CONCURRENCY = 8;
const defaultMaxStudioLaneSettings = {
  imageLanesPerJwt: 4,
  videoLanesPerJwt: 4,
  imageSubmitDelayMinMs: 1400,
  imageSubmitDelayMaxMs: 1600,
  videoSubmitDelayMinMs: 1500,
  videoSubmitDelayMaxMs: 1800,
  jwtStartStaggerMinMs: 1300,
  jwtStartStaggerMaxMs: 1500,
  imageGenerationTimeoutMinMs: 15e4,
  imageGenerationTimeoutMaxMs: 2e5,
  videoGenerationTimeoutMinMs: 36e4,
  videoGenerationTimeoutMaxMs: 42e4,
  generationRetryAttempts: 1,
  rateLimitRetryEnabled: true,
  rateLimitRetryAttempts: 1,
  rateLimitRetryExtraDelayMs: 2e3,
  textApiBatchConcurrency: DEFAULT_TEXT_API_BATCH_CONCURRENCY
};
function mergeMaxStudioLaneSettings(settings2) {
  return { ...defaultMaxStudioLaneSettings, ...settings2 || {} };
}
function normalizeTextApiBatchConcurrency(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TEXT_API_BATCH_CONCURRENCY;
  return Math.round(Math.min(MAX_TEXT_API_BATCH_CONCURRENCY, Math.max(MIN_TEXT_API_BATCH_CONCURRENCY, parsed)));
}
function normalizeLongScriptSkillWordThreshold(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD;
  return Math.round(Math.min(MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD, Math.max(MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD, parsed)));
}
function normalizeLongScriptSkillChunkConcurrency(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY;
  return Math.round(Math.min(MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, Math.max(MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, parsed)));
}
function normalizeAutopilotLongFormThresholdMinutes(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES;
  return Math.round(Math.min(MAX_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES, Math.max(MIN_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES, parsed)));
}
function normalizeAutopilotPlanningConcurrency(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY;
  return Math.round(Math.min(MAX_AUTOPILOT_PLANNING_CONCURRENCY, Math.max(MIN_AUTOPILOT_PLANNING_CONCURRENCY, parsed)));
}
function mergeScriptImportSettings(settings2) {
  return {
    longScriptSkillWordThreshold: normalizeLongScriptSkillWordThreshold(settings2?.longScriptSkillWordThreshold),
    longScriptSkillChunkConcurrency: normalizeLongScriptSkillChunkConcurrency(settings2?.longScriptSkillChunkConcurrency)
  };
}
const defaultState = {
  resourceSharing: {
    shareCharacters: false,
    shareScenes: false,
    shareMedia: false
  },
  storagePaths: {
    basePath: ""
  },
  cacheSettings: {
    autoCleanEnabled: false,
    autoCleanDays: 30
  },
  updateSettings: {
    autoCheckEnabled: true,
    ignoredVersion: ""
  },
  cliRuntime: {
    enabled: false,
    adapter: "opencode",
    model: "",
    timeoutMs: 12e4
  },
  maxStudioLanes: defaultMaxStudioLaneSettings,
  scriptImport: {
    longScriptSkillWordThreshold: DEFAULT_LONG_SCRIPT_SKILL_WORD_THRESHOLD,
    longScriptSkillChunkConcurrency: DEFAULT_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY
  },
  autopilot: {
    longFormThresholdMinutes: DEFAULT_AUTOPILOT_LONG_FORM_THRESHOLD_MINUTES,
    planningConcurrency: DEFAULT_AUTOPILOT_PLANNING_CONCURRENCY
  },
  hideLoginBrowser: false,
  watermarkRemovalEnabled: false
};
const useVideoStudioSettingsStore = create()(
  persist(
    (set) => ({
      ...defaultState,
      setResourceSharing: (settings2) => set((state) => ({
        resourceSharing: { ...state.resourceSharing, ...settings2 }
      })),
      setStoragePaths: (paths) => set((state) => ({
        storagePaths: { ...state.storagePaths, ...paths }
      })),
      setCacheSettings: (settings2) => set((state) => ({
        cacheSettings: { ...state.cacheSettings, ...settings2 }
      })),
      setUpdateSettings: (settings2) => set((state) => ({
        updateSettings: { ...state.updateSettings, ...settings2 }
      })),
      setCliRuntime: (settings2) => set((state) => ({
        cliRuntime: { ...state.cliRuntime, ...settings2, enabled: settings2.enabled ?? state.cliRuntime.enabled }
      })),
      setMaxStudioLanes: (settings2) => set((state) => ({
        maxStudioLanes: {
          ...state.maxStudioLanes,
          ...settings2,
          textApiBatchConcurrency: normalizeTextApiBatchConcurrency(
            settings2.textApiBatchConcurrency ?? state.maxStudioLanes.textApiBatchConcurrency
          )
        }
      })),
      setScriptImport: (settings2) => set((state) => ({
        scriptImport: mergeScriptImportSettings({ ...state.scriptImport, ...settings2 })
      })),
      setAutopilot: (settings2) => set((state) => ({
        autopilot: {
          ...state.autopilot,
          ...settings2,
          longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(
            settings2.longFormThresholdMinutes ?? state.autopilot.longFormThresholdMinutes
          ),
          planningConcurrency: normalizeAutopilotPlanningConcurrency(
            settings2.planningConcurrency ?? state.autopilot.planningConcurrency
          )
        }
      })),
      setHideLoginBrowser: (value) => set({ hideLoginBrowser: value }),
      setWatermarkRemovalEnabled: (value) => set({ watermarkRemovalEnabled: value })
    }),
    {
      name: "longdd-app-settings",
      storage: createJSONStorage(() => fileStorage),
      version: 10,
      migrate: (persisted, version) => {
        const typedPersisted = persisted && typeof persisted === "object" ? persisted : void 0;
        const persistedLanes = mergeMaxStudioLaneSettings(typedPersisted?.maxStudioLanes);
        const persistedFlowLanes = mergeMaxStudioLaneSettings(typedPersisted?.googleFlowLanes);
        const lanesWereCustomized = JSON.stringify(persistedLanes) !== JSON.stringify(defaultMaxStudioLaneSettings);
        const flowLanesWereCustomized = JSON.stringify(persistedFlowLanes) !== JSON.stringify(defaultMaxStudioLaneSettings);
        const adoptedLanes = !lanesWereCustomized && flowLanesWereCustomized ? persistedFlowLanes : persistedLanes;
        const next = {
          ...defaultState,
          resourceSharing: {
            ...defaultState.resourceSharing,
            ...typedPersisted?.resourceSharing || {}
          },
          storagePaths: {
            ...defaultState.storagePaths,
            ...typedPersisted?.storagePaths || {}
          },
          cacheSettings: {
            ...defaultState.cacheSettings,
            ...typedPersisted?.cacheSettings || {}
          },
          updateSettings: {
            ...defaultState.updateSettings,
            ...typedPersisted?.updateSettings || {}
          },
          cliRuntime: {
            ...defaultState.cliRuntime,
            ...typedPersisted?.cliRuntime || {},
            enabled: typedPersisted?.cliRuntime?.enabled ?? defaultState.cliRuntime.enabled
          },
          maxStudioLanes: version < 3 ? { ...defaultMaxStudioLaneSettings } : mergeMaxStudioLaneSettings({
            ...adoptedLanes,
            textApiBatchConcurrency: normalizeTextApiBatchConcurrency(adoptedLanes.textApiBatchConcurrency)
          }),
          scriptImport: mergeScriptImportSettings(typedPersisted?.scriptImport),
          autopilot: {
            longFormThresholdMinutes: normalizeAutopilotLongFormThresholdMinutes(
              typedPersisted?.autopilot?.longFormThresholdMinutes
            ),
            planningConcurrency: normalizeAutopilotPlanningConcurrency(
              typedPersisted?.autopilot?.planningConcurrency
            )
          },
          hideLoginBrowser: typedPersisted?.hideLoginBrowser ?? defaultState.hideLoginBrowser,
          watermarkRemovalEnabled: typedPersisted?.watermarkRemovalEnabled ?? defaultState.watermarkRemovalEnabled
        };
        if (version < 2) {
          next.resourceSharing = { ...defaultState.resourceSharing };
        }
        return next;
      }
    }
  )
);
const CLI_TEXT_FEATURES = /* @__PURE__ */ new Set(["script_analysis", "chat"]);
const DEV_CLI_BASE_PATH = "/__cli";
async function getCliCommands(adapter, workingDirectory) {
  if (window.cliRuntime?.getCommands) return window.cliRuntime.getCommands(adapter, workingDirectory);
  return { commands: [] };
}
async function getCliModels(adapter) {
  if (window.cliRuntime?.getModels) {
    return window.cliRuntime.getModels(adapter);
  }
  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/models?cli=${encodeURIComponent(adapter)}`);
    return await response.json();
  } catch (error) {
    return { models: [], efforts: [], error: error instanceof Error ? error.message : String(error) };
  }
}
async function cliJsonTest(adapter, model) {
  if (window.cliRuntime) {
    try {
      const text = await runViaElectron({
        adapter,
        prompt: "Reply with exactly one word: OK",
        model,
        timeoutMs: 3e4
      });
      return { ok: text.trim().length > 0 };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/json-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cli: adapter, model })
    });
    return await response.json();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
function isCliFeatureEnabled(feature) {
  const settings2 = useVideoStudioSettingsStore.getState().cliRuntime;
  if (!settings2.enabled) return false;
  if (!feature) return true;
  return CLI_TEXT_FEATURES.has(feature);
}
function getCliProviderPlatform(adapter) {
  return adapter === "claude" ? "claude-cli" : "opencode-cli";
}
function isCliProvider(platformOrProvider) {
  return platformOrProvider === "claude-cli" || platformOrProvider === "opencode-cli";
}
async function getCliRuntimeStatus() {
  if (window.cliRuntime) {
    const status = await window.cliRuntime.getStatus();
    return { ...status, transport: "electron" };
  }
  try {
    const response = await fetch(`${DEV_CLI_BASE_PATH}/status`);
    if (!response.ok) return null;
    const status = await response.json();
    return status;
  } catch {
    return null;
  }
}
async function installCliRuntime(adapter) {
  if (!window.cliRuntime?.install) {
    return { success: false, error: "Tự động cài CLI chỉ khả dụng trong ứng dụng desktop." };
  }
  return window.cliRuntime.install(adapter);
}
async function runViaElectron(params) {
  if (params.signal?.aborted) {
    throw new Error("Cancelled by user");
  }
  const requestId = params.onChunk || params.onCommands || params.signal ? crypto.randomUUID() : void 0;
  const unsubscribe = requestId && window.cliRuntime?.onTaskEvent ? window.cliRuntime.onTaskEvent((event) => {
    if (event.requestId !== requestId) return;
    if (event.type === "chunk" && event.chunk) params.onChunk?.(event.chunk);
    if (event.type === "commands" && event.commands) params.onCommands?.(event.commands);
  }) : void 0;
  const abortHandler = requestId ? () => {
    void window.cliRuntime?.cancelTextTask?.(requestId);
  } : void 0;
  if (abortHandler) {
    params.signal?.addEventListener("abort", abortHandler, { once: true });
  }
  const result = await (async () => {
    try {
      return await window.cliRuntime.runTextTask({
        adapter: params.adapter,
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        model: params.model,
        effort: params.effort,
        sessionKey: params.sessionKey,
        requestId,
        timeoutMs: params.timeoutMs,
        workingDirectory: params.workingDirectory,
        enableContentMcp: params.enableContentMcp
      });
    } finally {
      if (abortHandler) {
        params.signal?.removeEventListener("abort", abortHandler);
      }
      unsubscribe?.();
    }
  })();
  if (params.signal?.aborted || result.canceled) {
    throw new Error("Cancelled by user");
  }
  if (!result.success || !result.outputText) {
    throw new Error(result.error || "CLI text generation failed");
  }
  return result.outputText;
}
async function runViaHttpBridge(params) {
  if (params.signal?.aborted) {
    throw new Error("Cancelled by user");
  }
  const requestId = params.onChunk || params.signal ? crypto.randomUUID() : void 0;
  const response = await fetch(`${DEV_CLI_BASE_PATH}/run-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: params.signal,
    body: JSON.stringify({
      adapter: params.adapter,
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: params.model,
      effort: params.effort,
      sessionKey: params.sessionKey,
      requestId,
      timeoutMs: params.timeoutMs,
      workingDirectory: params.workingDirectory,
      enableContentMcp: params.enableContentMcp
    })
  }).catch((error) => {
    if (params.signal?.aborted || error instanceof Error && error.name === "AbortError") {
      throw new Error("Cancelled by user");
    }
    throw error;
  });
  if (!response.ok || !response.body) {
    throw new Error(`CLI bridge request failed (${response.status})`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";
  let finalError = "";
  let finalSuccess = false;
  let finalCanceled = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let event;
        try {
          event = JSON.parse(trimmed);
        } catch {
          continue;
        }
        if (event.type === "chunk" && event.chunk) {
          finalText += event.chunk;
          params.onChunk?.(event.chunk);
        }
        if (event.type === "result") {
          finalSuccess = Boolean(event.success);
          finalCanceled = Boolean(event.canceled);
          if (event.outputText && !finalText) {
            finalText = event.outputText;
          }
          finalError = event.error || "";
        }
      }
    }
  } catch (error) {
    if (params.signal?.aborted || error instanceof Error && error.name === "AbortError") {
      throw new Error("Cancelled by user");
    }
    throw error;
  }
  if (params.signal?.aborted || finalCanceled) {
    throw new Error("Cancelled by user");
  }
  if (!finalSuccess || !finalText) {
    throw new Error(finalError || "CLI bridge text generation failed");
  }
  return finalText;
}
async function runCliTextCompletion(params) {
  const settings2 = useVideoStudioSettingsStore.getState().cliRuntime;
  if (!settings2.enabled) {
    throw new Error("CLI runtime is disabled");
  }
  return runCliTextTask({
    adapter: settings2.adapter,
    prompt: params.userPrompt,
    systemPrompt: params.systemPrompt,
    model: params.model || settings2.model,
    effort: params.effort,
    sessionKey: params.sessionKey || params.feature || "chat",
    timeoutMs: settings2.timeoutMs,
    onChunk: params.onChunk,
    onCommands: params.onCommands,
    signal: params.signal
  });
}
async function runCliTextTask(params) {
  const sharedParams = {
    ...params,
    timeoutMs: params.timeoutMs ?? 12e4
  };
  if (window.cliRuntime) {
    return runViaElectron(sharedParams);
  }
  return runViaHttpBridge(sharedParams);
}
const CLI_OPTIONS = [
  { adapter: "claude", name: "Claude Code", docs: "https://docs.anthropic.com/en/docs/claude-code/getting-started" },
  { adapter: "opencode", name: "OpenCode", docs: "https://opencode.ai/docs" },
  { adapter: "codex", name: "Codex", docs: "https://learn.chatgpt.com/docs/codex/cli" }
];
function GlobalSettingsDialog() {
  const { t } = useI18n();
  const open = useAppShellStore((state) => state.settingsOpen);
  const setOpen = useAppShellStore((state) => state.setSettingsOpen);
  const [status, setStatus] = reactExports.useState(null);
  const [checking, setChecking] = reactExports.useState(false);
  const [testing, setTesting] = reactExports.useState(null);
  const [installing, setInstalling] = reactExports.useState(null);
  const [installMessage, setInstallMessage] = reactExports.useState("");
  const [testResults, setTestResults] = reactExports.useState({});
  const refresh = reactExports.useCallback(async () => {
    setChecking(true);
    try {
      setStatus(await getCliRuntimeStatus());
    } finally {
      setChecking(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);
  const openDocs = async (url) => {
    if (window.authBridge?.openExternal) {
      await window.authBridge.openExternal(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const testCli = async (adapter) => {
    setTesting(adapter);
    try {
      const result = await cliJsonTest(adapter);
      setTestResults((current) => ({
        ...current,
        [adapter]: { ok: Boolean(result.ok), error: result.error }
      }));
    } finally {
      setTesting(null);
    }
  };
  const installCli = async (adapter) => {
    const cliName = CLI_OPTIONS.find((item) => item.adapter === adapter)?.name ?? adapter;
    setInstalling(adapter);
    setInstallMessage(t("cliSettings.installStarted", { cli: cliName }));
    const toastId = toast.loading(t("cliSettings.installStarted", { cli: cliName }));
    setTestResults((current) => {
      const next = { ...current };
      delete next[adapter];
      return next;
    });
    try {
      const result = await installCliRuntime(adapter);
      if (!result.success) {
        const message = result.error || result.output || t("cliSettings.installFailed");
        setTestResults((current) => ({
          ...current,
          [adapter]: { ok: false, error: message }
        }));
        setInstallMessage(message);
        toast.error(message, { id: toastId });
      } else {
        const message = t("cliSettings.installSuccess", { cli: cliName });
        setInstallMessage(message);
        toast.success(message, { id: toastId });
      }
      await refresh();
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const message = /No handler registered|No handler/i.test(rawMessage) ? t("cliSettings.restartRequired") : rawMessage || t("cliSettings.installFailed");
      setTestResults((current) => ({ ...current, [adapter]: { ok: false, error: message } }));
      setInstallMessage(message);
      toast.error(message, { id: toastId });
    } finally {
      setInstalling(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-h-[85vh] w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden rounded-2xl p-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "border-b border-border/60 px-6 py-5 pr-14", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-base", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SquareTerminal, { className: "size-5 text-primary" }),
        t("cliSettings.title")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: t("cliSettings.description") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-y-auto p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-3", children: CLI_OPTIONS.map(({ adapter, name, docs }) => {
        const info = status?.[adapter];
        const available = Boolean(info?.available);
        const testResult = testResults[adapter];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "flex min-h-64 flex-col rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs uppercase tracking-wider text-muted-foreground", children: "CLI" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-2xs font-medium",
              available ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            ), children: [
              available ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-3" }),
              available ? t("cliSettings.installed") : t("cliSettings.notInstalled")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 min-h-20 space-y-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-words font-mono", children: info?.version || info?.error || t("cliSettings.notDetected") }),
            info?.path && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "break-all text-2xs opacity-70", children: info.path }),
            testResult && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: cn("flex items-start gap-1.5", testResult.ok ? "text-emerald-500" : "text-destructive"), children: [
              testResult.ok ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 size-3.5 shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 size-3.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: testResult.ok ? t("cliSettings.ready") : testResult.error || t("cliSettings.testFailed") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex flex-col gap-2 pt-4", children: [
            available ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", onClick: () => void testCli(adapter), disabled: testing !== null || installing !== null, children: [
              testing === adapter && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }),
              t("cliSettings.testLogin")
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", onClick: () => void installCli(adapter), disabled: installing !== null || testing !== null, children: [
              installing === adapter && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }),
              installing === adapter ? t("cliSettings.installing") : t("cliSettings.install")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", variant: "ghost", onClick: () => void openDocs(docs), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5" }),
              t("cliSettings.openGuide")
            ] })
          ] })
        ] }, adapter);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("cliSettings.refreshHint") }),
          installMessage && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 break-words text-xs font-medium text-foreground", children: installMessage })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", variant: "outline", onClick: () => void refresh(), disabled: checking, children: [
          checking ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-3.5" }),
          t("contentChat.refreshCli")
        ] })
      ] })
    ] })
  ] }) });
}
function App() {
  const { theme } = useThemeStore();
  const { language } = useI18n();
  const [preferencesReady, setPreferencesReady] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    void migrateUIPreferencesFromLegacy().finally(() => {
      if (!cancelled) setPreferencesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  reactExports.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.lang = language;
  }, [language, theme]);
  if (!preferencesReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-screen w-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen w-screen overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(StartupUpdateGuard, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LicenseGate, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalSettingsDialog, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster2, { richColors: true, position: "top-center" })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
if (window.ipcRenderer) {
  window.ipcRenderer.on("main-process-message", (_event, message) => {
    console.log(message);
  });
}
__vitePreload(async () => {
  const { registerAutopilotHttpHandler } = await import("./autopilot-http-handler-Cy7P7pF0.js");
  return { registerAutopilotHttpHandler };
}, true ? __vite__mapDeps([28,5,6,4,2,7,8,1,3,23]) : void 0, import.meta.url).then(({ registerAutopilotHttpHandler }) => {
  registerAutopilotHttpHandler();
}).catch((error) => {
  console.error("[autopilot] failed to register HTTP handler:", error);
});
export {
  MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY as $,
  translate as A,
  Button as B,
  useUIPreferencesStore as C,
  Dialog as D,
  AlertDialog as E,
  FeatureRail as F,
  AlertDialogTrigger as G,
  AlertDialogContent as H,
  Input as I,
  AlertDialogHeader as J,
  AlertDialogTitle as K,
  AlertDialogDescription as L,
  AlertDialogFooter as M,
  AlertDialogCancel as N,
  AlertDialogAction as O,
  normalizeLongScriptSkillWordThreshold as P,
  normalizeLongScriptSkillChunkConcurrency as Q,
  MAX_LONG_SCRIPT_SKILL_WORD_THRESHOLD as R,
  MIN_LONG_SCRIPT_SKILL_WORD_THRESHOLD as S,
  TooltipProvider as T,
  Tooltip as U,
  TooltipTrigger as V,
  TooltipContent as W,
  cliJsonTest as X,
  isCliRuntimeBeta as Y,
  MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY as Z,
  __vitePreload as _,
  useI18n as a,
  UpdateDialog as a0,
  normalizeAutopilotLongFormThresholdMinutes as a1,
  DialogTrigger as a2,
  useVideoStudioSettingsStore as b,
  cn as c,
  createJSONStorage as d,
  DialogContent as e,
  fileStorage as f,
  generateUUID as g,
  hasPlanAccess as h,
  DialogHeader as i,
  DialogTitle as j,
  DialogFooter as k,
  debugLog as l,
  migrateFromLocalStorage as m,
  isCliProvider as n,
  isCliFeatureEnabled as o,
  persist as p,
  getCliProviderPlatform as q,
  runCliTextCompletion as r,
  getCliRuntimeStatus as s,
  toast as t,
  useLicenseStore as u,
  getCliModels as v,
  getCliCommands as w,
  runCliTextTask as x,
  DialogDescription as y,
  cva as z
};
