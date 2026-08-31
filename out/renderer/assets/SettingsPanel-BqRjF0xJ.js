import { a5 as Root2, j as jsxRuntimeExports, a6 as List, a7 as Trigger, a8 as Content } from "./radix-ui-BYOyDlCM.js";
import { r as reactExports, L as LoaderCircle, t as CircleCheck, u as CircleAlert, q as RefreshCw, i as Settings, a4 as Play, bI as Link2, bJ as Key, bK as Info, _ as Plus, a9 as Check, X, bL as Shield, P as Pencil, d as Trash2, $ as ChevronDown, a0 as ChevronRight, aY as Zap, x as MessageSquare, bd as Sparkles, bl as Upload, bf as HardDrive, aM as Folder, D as Download } from "./lucide-react-Cs1Usobv.js";
import { c as cn, a as useI18n, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, y as DialogDescription, I as Input, B as Button, k as DialogFooter, t as toast, b as useVideoStudioSettingsStore, E as AlertDialog, G as AlertDialogTrigger, H as AlertDialogContent, J as AlertDialogHeader, K as AlertDialogTitle, L as AlertDialogDescription, M as AlertDialogFooter, N as AlertDialogCancel, O as AlertDialogAction, s as getCliRuntimeStatus, v as getCliModels, X as cliJsonTest, r as runCliTextCompletion, Y as isCliRuntimeBeta, u as useLicenseStore, Z as MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, $ as MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY, Q as normalizeLongScriptSkillChunkConcurrency, a0 as UpdateDialog } from "./index-B8Pnvlyd.js";
import { S as ScrollArea } from "./dropdown-menu-obd7d5u9.js";
import { W as getApiKeyCount, X as IMAGE_HOST_PRESETS, Y as GOOGLE_FLOW_IMAGE_MODELS, Z as GOOGLE_FLOW_VIDEO_MODELS, _ as GROK_VIDEO_MODELS, m as useAPIConfigStore, $ as getProviderCredentialCount, a0 as getModelDisplayName, a1 as maskApiKey, a2 as parseApiKeys, o as isProviderCredentialConfigured, a3 as isVisibleImageHostProvider, h as useCharacterLibraryStore, f as useSceneStore, k as useMediaStore } from "./autopilot-store-4Sgwsp2L.js";
import { L as Label } from "./label-C6uhtku6.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dpmre5UT.js";
import { T as Textarea } from "./textarea-P4k3OFxA.js";
import "./entry-BWjcO7w7.js";
import { S as Switch } from "./switch-BmQfSxy-.js";
import { u as useGoogleFlowRuntimeStore } from "./google-flow-runtime-store-DqAjge8w.js";
import { c as create } from "./zustand-DqfYAuvg.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-D0X_7oLU.js";
import { B as Badge } from "./badge-DbPRmE25.js";
import { a as useProjectStore } from "./auto-video-store-BurpJGpg.js";
import { u as uploadToImageHost } from "./image-host-DWOhrabS.js";
import "./supabase-DI0hoIb9.js";
import "./cors-fetch-CkwbEcad.js";
import "./model-registry-CChP-jS9.js";
import "./progress-C4y9txuJ.js";
import "./popover-BBVZUjTG.js";
import "./FeatureHeaderIcon-BtUg61kJ.js";
import "./resizable-CVkLDVOZ.js";
const Tabs = Root2;
const TabsList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  List,
  {
    ref,
    className: cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = List.displayName;
const TabsTrigger = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center cursor-pointer justify-center whitespace-nowrap rounded-lg px-3 py-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = Trigger.displayName;
const TabsContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = Content.displayName;
const version = "0.1.5";
const packageJson = {
  version
};
const PLATFORM_PRESETS = [
  {
    platform: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    description: "OpenRouter OpenAI-compatible relay for Claude, Gemini, DeepSeek and more",
    services: ["Chat", "Image Understanding"],
    models: ["anthropic/claude-sonnet-4-6"],
    recommended: true
  },
  {
    platform: "custom",
    name: "Custom",
    baseUrl: "",
    description: "Custom OpenAI-compatible API provider",
    services: [],
    models: []
  }
];
function AddProviderDialog({
  open,
  onOpenChange,
  onSubmit,
  existingPlatforms = []
}) {
  const { t } = useI18n();
  const [platform, setPlatform] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [baseUrl, setBaseUrl] = reactExports.useState("");
  const [apiKey, setApiKey] = reactExports.useState("");
  const [model, setModel] = reactExports.useState("");
  const [fetchedModels, setFetchedModels] = reactExports.useState([]);
  const [fetchingModels, setFetchingModels] = reactExports.useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = reactExports.useState(false);
  const selectedPreset = PLATFORM_PRESETS.find((p) => p.platform === platform);
  const isCustom = platform === "custom";
  reactExports.useEffect(() => {
    if (open) {
      setPlatform("");
      setName("");
      setBaseUrl("");
      setApiKey("");
      setModel("");
      setFetchedModels([]);
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (selectedPreset && !isCustom) {
      setName(selectedPreset.name);
      setBaseUrl(selectedPreset.baseUrl);
      setFetchedModels([]);
      if (selectedPreset.models && selectedPreset.models.length > 0) {
        setModel(selectedPreset.models[0]);
      }
    }
  }, [platform, selectedPreset, isCustom]);
  const getOpenRouterEndpoint = (path) => {
    const normalized = (baseUrl || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
  };
  const fetchOpenRouterModels = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    setFetchingModels(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("models"), {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const data = Array.isArray(json.data) ? json.data : json;
      const models = data.map((item) => typeof item === "string" ? item : item.id).filter((id) => Boolean(id));
      if (models.length === 0) throw new Error("No models returned");
      setFetchedModels(models);
      setModel((current) => current && models.includes(current) ? current : models[0]);
      toast.success(`Fetched ${models.length} OpenRouter models`);
    } catch (error) {
      console.error("OpenRouter model fetch failed:", error);
      toast.error("Không fetch được model OpenRouter. Kiểm tra API key/Base URL.");
    } finally {
      setFetchingModels(false);
    }
  };
  const testOpenRouter = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    if (!model) {
      toast.error("Chọn model OpenRouter trước khi test.");
      return;
    }
    setTestingOpenRouter(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5
        })
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success("OpenRouter test OK.");
    } catch (error) {
      console.error("OpenRouter test failed:", error);
      toast.error("OpenRouter test lỗi. Kiểm tra key/model.");
    } finally {
      setTestingOpenRouter(false);
    }
  };
  const handleSubmit = () => {
    if (!platform) {
      toast.error(t("apiDialog.choosePlatform"));
      return;
    }
    if (!name.trim()) {
      toast.error(t("apiDialog.enterName"));
      return;
    }
    if (isCustom && !baseUrl.trim()) {
      toast.error(t("apiDialog.customNeedsBaseUrl"));
      return;
    }
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    const presetModels = selectedPreset?.models || [];
    const modelArray = platform === "openrouter" ? model ? [model] : [] : presetModels.length > 0 ? presetModels : model ? [model] : [];
    const combinedApiKey = apiKey.trim();
    onSubmit({
      platform,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: combinedApiKey,
      model: modelArray
    });
    onOpenChange(false);
    toast.success(t("apiDialog.added", { name }));
  };
  const availablePlatforms = PLATFORM_PRESETS.filter(
    (p) => p.platform === "custom" || !existingPlatforms.includes(p.platform)
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("apiDialog.addProvider") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "hidden", children: t("apiDialog.addProviderDesc") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.platform") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platform, onValueChange: setPlatform, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("apiDialog.selectPlatform") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: availablePlatforms.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: preset.platform, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
            preset.name,
            preset.recommended && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded font-medium", children: t("settings.recommended") })
          ] }) }, preset.platform)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: t("apiDialog.namePlaceholder")
          }
        )
      ] }),
      (isCustom || platform) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: isCustom ? "Base URL" : t("apiDialog.baseUrlOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: baseUrl,
            onChange: (e) => setBaseUrl(e.target.value),
            placeholder: isCustom ? "https://api.example.com/v1" : ""
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "API Key" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "password",
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: t("apiDialog.enterApiKey"),
            className: "font-mono"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("apiDialog.multiKeys") })
      ] }),
      platform === "openrouter" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "OpenRouter model" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: fetchOpenRouterModels, disabled: fetchingModels || !apiKey.trim(), children: [
              fetchingModels && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-3.5 w-3.5 animate-spin" }),
              "Fetch models"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: testOpenRouter, disabled: testingOpenRouter || !apiKey.trim() || !model, children: [
              testingOpenRouter && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-3.5 w-3.5 animate-spin" }),
              "Test nhẹ"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: model, onValueChange: setModel, disabled: fetchedModels.length === 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-full bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Fetch models để chọn" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: fetchedModels.map((modelId) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: modelId, children: modelId }, modelId)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Model được lấy trực tiếp từ OpenRouter `/models`, không cần nhập tay." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.modelOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: model,
            onChange: (e) => setModel(e.target.value),
            placeholder: t("apiDialog.modelPlaceholder")
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("common.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, children: t("apiDialog.add") })
    ] })
  ] }) });
}
function EditProviderDialog({
  open,
  onOpenChange,
  provider,
  onSave
}) {
  const { t } = useI18n();
  const [name, setName] = reactExports.useState("");
  const [baseUrl, setBaseUrl] = reactExports.useState("");
  const [apiKey, setApiKey] = reactExports.useState("");
  const [model, setModel] = reactExports.useState("");
  const [openRouterModels, setOpenRouterModels] = reactExports.useState([]);
  const [fetchingModels, setFetchingModels] = reactExports.useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (provider) {
      setName(provider.name);
      setBaseUrl(provider.baseUrl);
      setApiKey(provider.apiKey);
      setModel(provider.model?.join(", ") || "");
      setOpenRouterModels(provider.platform === "openrouter" ? provider.model || [] : []);
    }
  }, [provider]);
  const getOpenRouterEndpoint = (path) => {
    const normalized = (baseUrl || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
  };
  const fetchOpenRouterModels = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    setFetchingModels(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("models"), {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const data = Array.isArray(json.data) ? json.data : json;
      const models = data.map((item) => typeof item === "string" ? item : item.id).filter((id) => Boolean(id));
      if (models.length === 0) throw new Error("No models returned");
      setOpenRouterModels(models);
      setModel((current) => current && models.includes(current) ? current : models[0]);
      toast.success(`Fetched ${models.length} OpenRouter models`);
    } catch (error) {
      console.error("OpenRouter model fetch failed:", error);
      toast.error("Không fetch được model OpenRouter. Kiểm tra API key/Base URL.");
    } finally {
      setFetchingModels(false);
    }
  };
  const testOpenRouter = async () => {
    if (!apiKey.trim()) {
      toast.error(t("apiDialog.enterApiKeyError"));
      return;
    }
    if (!model) {
      toast.error("Chọn model OpenRouter trước khi test.");
      return;
    }
    setTestingOpenRouter(true);
    try {
      const response = await fetch(getOpenRouterEndpoint("chat/completions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5
        })
      });
      if (!response.ok) throw new Error(await response.text());
      toast.success("OpenRouter test OK.");
    } catch (error) {
      console.error("OpenRouter test failed:", error);
      toast.error("OpenRouter test lỗi. Kiểm tra key/model.");
    } finally {
      setTestingOpenRouter(false);
    }
  };
  const handleSave = () => {
    if (!provider) return;
    if (!name.trim()) {
      toast.error(t("apiDialog.enterName"));
      return;
    }
    const models = provider.platform === "openrouter" ? model ? [model] : [] : model.split(/[,\n]/).map((m) => m.trim()).filter((m) => m.length > 0);
    const combinedApiKey = apiKey.trim();
    onSave({
      ...provider,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: combinedApiKey,
      model: models
    });
    onOpenChange(false);
    toast.success("Changes saved");
  };
  const keyCount = getApiKeyCount(apiKey);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("apiDialog.editProvider") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-muted-foreground", children: t("apiDialog.platform") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: provider?.platform || "", disabled: true, className: "bg-muted" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: t("apiDialog.namePlaceholder")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Base URL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: baseUrl,
            onChange: (e) => setBaseUrl(e.target.value),
            placeholder: t("common.apiExample")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.apiKeys") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("apiDialog.keyCount", { count: keyCount }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: t("apiDialog.keyListPlaceholder"),
            className: "font-mono text-sm min-h-[100px]"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("apiDialog.keyRotationHint") })
      ] }),
      provider?.platform === "openrouter" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "OpenRouter model" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: fetchOpenRouterModels, disabled: fetchingModels || !apiKey.trim(), children: [
              fetchingModels && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-3.5 w-3.5 animate-spin" }),
              "Fetch models"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: testOpenRouter, disabled: testingOpenRouter || !apiKey.trim() || !model, children: [
              testingOpenRouter && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-3.5 w-3.5 animate-spin" }),
              "Test nhẹ"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: model, onValueChange: setModel, disabled: openRouterModels.length === 0, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-9 w-full bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Fetch models để chọn" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: openRouterModels.map((modelId) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: modelId, children: modelId }, modelId)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Model được lấy trực tiếp từ OpenRouter `/models`, không cần nhập tay." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("apiDialog.modelOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: model,
            onChange: (e) => setModel(e.target.value),
            placeholder: t("apiDialog.modelPlaceholder")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("apiDialog.modelListHint") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("common.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, children: t("characters.save") })
    ] })
  ] }) });
}
function AddImageHostDialog({
  open,
  onOpenChange,
  onSubmit
}) {
  const { t } = useI18n();
  const [platform, setPlatform] = reactExports.useState("scdn");
  const [name, setName] = reactExports.useState("");
  const [baseUrl, setBaseUrl] = reactExports.useState("");
  const [uploadPath, setUploadPath] = reactExports.useState("");
  const [apiKey, setApiKey] = reactExports.useState("");
  const [enabled, setEnabled] = reactExports.useState(true);
  const [apiKeyParam, setApiKeyParam] = reactExports.useState("");
  const [apiKeyHeader, setApiKeyHeader] = reactExports.useState("");
  const [apiKeyFormField, setApiKeyFormField] = reactExports.useState("");
  const [apiKeyOptional, setApiKeyOptional] = reactExports.useState(false);
  const [expirationParam, setExpirationParam] = reactExports.useState("");
  const [imageField, setImageField] = reactExports.useState("");
  const [imagePayloadType, setImagePayloadType] = reactExports.useState("base64");
  const [nameField, setNameField] = reactExports.useState("");
  const [staticFormFields, setStaticFormFields] = reactExports.useState(void 0);
  const [responseUrlField, setResponseUrlField] = reactExports.useState("");
  const [responseDeleteUrlField, setResponseDeleteUrlField] = reactExports.useState("");
  const selectedPreset = IMAGE_HOST_PRESETS.find((p) => p.platform === platform);
  const apiKeyLabel = platform === "scdn" ? "API Key (optional)" : "API Keys";
  const apiKeyRequiredMessage = "Enter an API key";
  const apiKeyPlaceholder = platform === "scdn" ? "Leave empty. SCDN supports direct uploads." : "Enter API keys (one per line or comma-separated)";
  reactExports.useEffect(() => {
    if (open) {
      const defaultPreset = IMAGE_HOST_PRESETS.find((preset) => preset.platform === "scdn") || IMAGE_HOST_PRESETS[0];
      setPlatform(defaultPreset.platform);
      setName(defaultPreset.name || "");
      setBaseUrl(defaultPreset.baseUrl || "");
      setUploadPath(defaultPreset.uploadPath || "");
      setApiKey("");
      setEnabled(defaultPreset.enabled ?? true);
      setApiKeyParam(defaultPreset.apiKeyParam || "");
      setApiKeyHeader(defaultPreset.apiKeyHeader || "");
      setApiKeyFormField(defaultPreset.apiKeyFormField || "");
      setApiKeyOptional(defaultPreset.apiKeyOptional ?? false);
      setExpirationParam(defaultPreset.expirationParam || "");
      setImageField(defaultPreset.imageField || "");
      setImagePayloadType(defaultPreset.imagePayloadType || "base64");
      setNameField(defaultPreset.nameField || "");
      setStaticFormFields(defaultPreset.staticFormFields);
      setResponseUrlField(defaultPreset.responseUrlField || "");
      setResponseDeleteUrlField(defaultPreset.responseDeleteUrlField || "");
    }
  }, [open]);
  reactExports.useEffect(() => {
    if (selectedPreset) {
      setName(selectedPreset.name || "");
      setBaseUrl(selectedPreset.baseUrl || "");
      setUploadPath(selectedPreset.uploadPath || "");
      setEnabled(selectedPreset.enabled ?? true);
      setApiKeyParam(selectedPreset.apiKeyParam || "");
      setApiKeyHeader(selectedPreset.apiKeyHeader || "");
      setApiKeyFormField(selectedPreset.apiKeyFormField || "");
      setApiKeyOptional(selectedPreset.apiKeyOptional ?? false);
      setExpirationParam(selectedPreset.expirationParam || "");
      setImageField(selectedPreset.imageField || "");
      setImagePayloadType(selectedPreset.imagePayloadType || "base64");
      setNameField(selectedPreset.nameField || "");
      setStaticFormFields(selectedPreset.staticFormFields);
      setResponseUrlField(selectedPreset.responseUrlField || "");
      setResponseDeleteUrlField(selectedPreset.responseDeleteUrlField || "");
    }
  }, [selectedPreset]);
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!baseUrl.trim() && !uploadPath.trim()) {
      toast.error("Configure Base URL or Upload Path");
      return;
    }
    if (!apiKey.trim() && !apiKeyOptional) {
      toast.error(apiKeyRequiredMessage);
      return;
    }
    onSubmit({
      platform,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      uploadPath: uploadPath.trim(),
      apiKey: apiKey.trim(),
      enabled,
      apiKeyParam: apiKeyParam.trim() || void 0,
      apiKeyHeader: apiKeyHeader.trim() || void 0,
      apiKeyFormField: apiKeyFormField.trim() || void 0,
      apiKeyOptional,
      expirationParam: expirationParam.trim() || void 0,
      imageField: imageField.trim() || void 0,
      imagePayloadType,
      nameField: nameField.trim() || void 0,
      staticFormFields,
      responseUrlField: responseUrlField.trim() || void 0,
      responseDeleteUrlField: responseDeleteUrlField.trim() || void 0
    });
    onOpenChange(false);
    toast.success(`Added ${name}`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("imageHost.addTitle") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 overflow-y-auto pr-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.platform") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platform, onValueChange: (v) => setPlatform(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("common.selectPlatform") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: IMAGE_HOST_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: preset.platform, children: preset.name }, preset.platform)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: t("common.imageHostName") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.baseUrl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: baseUrl, onChange: (e) => setBaseUrl(e.target.value), placeholder: t("common.apiHostExample") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.uploadPathOrUrl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: uploadPath, onChange: (e) => setUploadPath(e.target.value), placeholder: t("common.uploadOrFullUrl") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: apiKeyLabel }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: apiKeyPlaceholder,
            className: "font-mono text-sm min-h-[80px]"
          }
        ),
        platform === "scdn" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("imageHost.scdnHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.enabled") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: enabled, onCheckedChange: setEnabled })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-muted-foreground", children: t("common.advancedOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.apiKeyQueryParam") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: apiKeyParam, onChange: (e) => setApiKeyParam(e.target.value), placeholder: t("common.queryKey") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("imageHost.apiKeyHeader") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: apiKeyHeader, onChange: (e) => setApiKeyHeader(e.target.value), placeholder: t("common.authorization") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.expirationParam") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: expirationParam, onChange: (e) => setExpirationParam(e.target.value), placeholder: t("common.expiration") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.imageField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: imageField, onChange: (e) => setImageField(e.target.value), placeholder: t("common.imageFieldName") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.nameField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: nameField, onChange: (e) => setNameField(e.target.value), placeholder: t("common.nameFieldValue") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.responseUrlField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: responseUrlField, onChange: (e) => setResponseUrlField(e.target.value), placeholder: t("common.responseUrlPath") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.deleteUrlField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: responseDeleteUrlField, onChange: (e) => setResponseDeleteUrlField(e.target.value), placeholder: t("common.responseDeleteUrlPath") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("imageHost.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, children: t("imageHost.add") })
    ] })
  ] }) });
}
function EditImageHostDialog({
  open,
  onOpenChange,
  provider,
  onSave
}) {
  const { t } = useI18n();
  const [platform, setPlatform] = reactExports.useState("scdn");
  const [name, setName] = reactExports.useState("");
  const [baseUrl, setBaseUrl] = reactExports.useState("");
  const [uploadPath, setUploadPath] = reactExports.useState("");
  const [apiKey, setApiKey] = reactExports.useState("");
  const [enabled, setEnabled] = reactExports.useState(true);
  const [apiKeyParam, setApiKeyParam] = reactExports.useState("");
  const [apiKeyHeader, setApiKeyHeader] = reactExports.useState("");
  const [apiKeyFormField, setApiKeyFormField] = reactExports.useState("");
  const [apiKeyOptional, setApiKeyOptional] = reactExports.useState(false);
  const [expirationParam, setExpirationParam] = reactExports.useState("");
  const [imageField, setImageField] = reactExports.useState("");
  const [imagePayloadType, setImagePayloadType] = reactExports.useState("base64");
  const [nameField, setNameField] = reactExports.useState("");
  const [staticFormFields, setStaticFormFields] = reactExports.useState(void 0);
  const [responseUrlField, setResponseUrlField] = reactExports.useState("");
  const [responseDeleteUrlField, setResponseDeleteUrlField] = reactExports.useState("");
  const apiKeyLabel = platform === "scdn" ? "API Key (optional)" : "API Keys";
  const apiKeyRequiredMessage = "Enter an API key";
  const apiKeyPlaceholder = platform === "scdn" ? "Leave empty. SCDN supports direct uploads." : "Enter API keys (one per line or comma-separated)";
  reactExports.useEffect(() => {
    if (provider) {
      setPlatform(provider.platform);
      setName(provider.name || "");
      setBaseUrl(provider.baseUrl || "");
      setUploadPath(provider.uploadPath || "");
      setApiKey(provider.apiKey || "");
      setEnabled(provider.enabled ?? true);
      setApiKeyParam(provider.apiKeyParam || "");
      setApiKeyHeader(provider.apiKeyHeader || "");
      setApiKeyFormField(provider.apiKeyFormField || "");
      setApiKeyOptional(provider.apiKeyOptional ?? false);
      setExpirationParam(provider.expirationParam || "");
      setImageField(provider.imageField || "");
      setImagePayloadType(provider.imagePayloadType || "base64");
      setNameField(provider.nameField || "");
      setStaticFormFields(provider.staticFormFields);
      setResponseUrlField(provider.responseUrlField || "");
      setResponseDeleteUrlField(provider.responseDeleteUrlField || "");
    }
  }, [provider]);
  const handlePlatformChange = (value) => {
    const nextPlatform = value;
    const preset = IMAGE_HOST_PRESETS.find((item) => item.platform === nextPlatform);
    setPlatform(nextPlatform);
    if (!preset) return;
    setName(preset.name || "");
    setBaseUrl(preset.baseUrl || "");
    setUploadPath(preset.uploadPath || "");
    setEnabled(preset.enabled ?? true);
    setApiKeyParam(preset.apiKeyParam || "");
    setApiKeyHeader(preset.apiKeyHeader || "");
    setApiKeyFormField(preset.apiKeyFormField || "");
    setApiKeyOptional(preset.apiKeyOptional ?? false);
    setExpirationParam(preset.expirationParam || "");
    setImageField(preset.imageField || "");
    setImagePayloadType(preset.imagePayloadType || "base64");
    setNameField(preset.nameField || "");
    setStaticFormFields(preset.staticFormFields);
    setResponseUrlField(preset.responseUrlField || "");
    setResponseDeleteUrlField(preset.responseDeleteUrlField || "");
  };
  const handleSave = () => {
    if (!provider) return;
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!baseUrl.trim() && !uploadPath.trim()) {
      toast.error("Configure Base URL or Upload Path");
      return;
    }
    if (!apiKey.trim() && !apiKeyOptional) {
      toast.error(apiKeyRequiredMessage);
      return;
    }
    onSave({
      ...provider,
      platform,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      uploadPath: uploadPath.trim(),
      apiKey: apiKey.trim(),
      enabled,
      apiKeyParam: apiKeyParam.trim() || void 0,
      apiKeyHeader: apiKeyHeader.trim() || void 0,
      apiKeyFormField: apiKeyFormField.trim() || void 0,
      apiKeyOptional,
      expirationParam: expirationParam.trim() || void 0,
      imageField: imageField.trim() || void 0,
      imagePayloadType,
      nameField: nameField.trim() || void 0,
      staticFormFields,
      responseUrlField: responseUrlField.trim() || void 0,
      responseDeleteUrlField: responseDeleteUrlField.trim() || void 0
    });
    onOpenChange(false);
    toast.success("Changes saved");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: t("imageHost.editTitle") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.platform") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: platform, onValueChange: handlePlatformChange, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("common.selectPlatform") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: IMAGE_HOST_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: preset.platform, children: preset.name }, preset.platform)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: t("common.imageHostName") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.baseUrl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: baseUrl, onChange: (e) => setBaseUrl(e.target.value), placeholder: t("common.apiHostExample") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.uploadPathOrUrl") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: uploadPath, onChange: (e) => setUploadPath(e.target.value), placeholder: t("common.uploadOrFullUrl") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: apiKeyLabel }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: apiKeyPlaceholder,
            className: "font-mono text-sm min-h-[80px]"
          }
        ),
        platform === "scdn" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("imageHost.scdnHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("common.enabled") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: enabled, onCheckedChange: setEnabled })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm text-muted-foreground", children: t("common.advancedOptional") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.apiKeyQueryParam") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: apiKeyParam, onChange: (e) => setApiKeyParam(e.target.value), placeholder: t("common.queryKey") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("imageHost.apiKeyHeader") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: apiKeyHeader, onChange: (e) => setApiKeyHeader(e.target.value), placeholder: t("common.authorization") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.expirationParam") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: expirationParam, onChange: (e) => setExpirationParam(e.target.value), placeholder: t("common.expiration") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.imageField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: imageField, onChange: (e) => setImageField(e.target.value), placeholder: t("common.imageFieldName") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.nameField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: nameField, onChange: (e) => setNameField(e.target.value), placeholder: t("common.nameFieldValue") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.responseUrlField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: responseUrlField, onChange: (e) => setResponseUrlField(e.target.value), placeholder: t("common.responseUrlPath") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("common.deleteUrlField") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: responseDeleteUrlField, onChange: (e) => setResponseDeleteUrlField(e.target.value), placeholder: t("common.responseDeleteUrlPath") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: t("imageHost.cancel") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSave, children: t("imageHost.save") })
    ] })
  ] }) });
}
const useGrokRuntimeStore = create((set, get) => ({
  status: null,
  tasks: {},
  initialized: false,
  initialize: () => {
    if (get().initialized || !window.grokVideoRuntime) return () => {
    };
    set({ initialized: true });
    const offStatus = window.grokVideoRuntime.onStatus((status) => set({ status }));
    const offTask = window.grokVideoRuntime.onTask((task) => set((state) => ({ tasks: { ...state.tasks, [task.taskId]: task } })));
    void (window.videoStudioBrowser?.startRuntimes() ?? Promise.resolve()).then(() => get().refresh()).catch((error) => console.warn("[Grok] Runtime startup failed:", error));
    return () => {
      offStatus();
      offTask();
      set({ initialized: false });
    };
  },
  refresh: async () => {
    if (!window.grokVideoRuntime) return;
    try {
      set({ status: await window.grokVideoRuntime.refreshQuota() });
    } catch (error) {
      console.warn("[Grok] Status refresh failed:", error);
    }
  },
  clearFinished: () => set((state) => ({
    tasks: Object.fromEntries(Object.entries(state.tasks).filter(([, task]) => !["completed", "failed", "cancelled"].includes(task.status)))
  }))
}));
const statusClass = {
  queued: "bg-muted text-muted-foreground",
  uploading: "bg-blue-500/10 text-blue-600",
  submitting: "bg-indigo-500/10 text-indigo-600",
  polling: "bg-amber-500/10 text-amber-600",
  downloading: "bg-cyan-500/10 text-cyan-600",
  completed: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  cancelled: "bg-muted text-muted-foreground"
};
const statusLabel$1 = {
  queued: "Đang chờ",
  uploading: "Đang tải lên",
  submitting: "Đang gửi",
  polling: "Đang xử lý",
  downloading: "Đang tải về",
  completed: "Hoàn tất",
  failed: "Thất bại",
  cancelled: "Đã hủy"
};
const phaseLabel = {
  checking_media: "Kiểm tra ảnh đã lưu",
  uploading_media: "Tải ảnh lên Flow",
  media_ready: "Ảnh đã sẵn sàng"
};
const credentialStateLabel = {
  ready: "Sẵn sàng",
  stale: "Cần làm mới",
  disconnected: "Mất kết nối",
  blocked: "Bị chặn"
};
const ACCOUNT_LABELS_KEY = "googleFlowAccountLabels";
function readAccountLabels() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_LABELS_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeAccountLabels(labels) {
  try {
    localStorage.setItem(ACCOUNT_LABELS_KEY, JSON.stringify(labels));
  } catch {
  }
}
function formatFlowProjectLabel(binding, projectName, showId = false) {
  const rawTitle = binding.title?.trim() || "";
  const legacyInternalTitle = /^LONGDD\s+[0-9a-f]{8,}-[0-9a-f-]{20,}$/i.test(rawTitle);
  const cleanTitle = legacyInternalTitle ? projectName?.trim() || "Dự án Flow" : rawTitle.replace(/^LONGDD\s+/i, "").trim() || projectName?.trim() || "Dự án Flow";
  return showId ? `${cleanTitle} · ${binding.flowProjectId.slice(0, 8)}` : cleanTitle;
}
function GoogleFlowRuntimePanel({ alwaysVisible = false }) {
  const { status, tasks, initialize, refresh, clearFinished } = useGoogleFlowRuntimeStore();
  const laneSettings = useVideoStudioSettingsStore((state) => state.maxStudioLanes);
  const hideLoginBrowser = useVideoStudioSettingsStore((state) => state.hideLoginBrowser);
  const setHideLoginBrowser = useVideoStudioSettingsStore((state) => state.setHideLoginBrowser);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProject = useProjectStore((state) => state.activeProject);
  const [projectBindings, setProjectBindings] = reactExports.useState([]);
  const [projectBusy, setProjectBusy] = reactExports.useState(null);
  const [inAppAccounts, setInAppAccounts] = reactExports.useState([]);
  const [addingAccount, setAddingAccount] = reactExports.useState(false);
  const [removingAccount, setRemovingAccount] = reactExports.useState(null);
  const [accountLabels, setAccountLabels] = reactExports.useState(() => readAccountLabels());
  const [editingSlot, setEditingSlot] = reactExports.useState(null);
  const [draftName, setDraftName] = reactExports.useState("");
  const saveAccountLabel = reactExports.useCallback((accountSlotId, rawName) => {
    const name = rawName.trim().slice(0, 40);
    setAccountLabels((prev) => {
      const next = { ...prev };
      if (name) next[accountSlotId] = name;
      else delete next[accountSlotId];
      writeAccountLabels(next);
      return next;
    });
    setEditingSlot(null);
  }, []);
  reactExports.useEffect(() => initialize(), [initialize]);
  const refreshInAppAccounts = reactExports.useCallback(async () => {
    if (!window.googleFlowRuntime) return;
    try {
      setInAppAccounts(await window.googleFlowRuntime.listInAppAccounts());
    } catch (error) {
      console.warn("[GoogleFlow] Không thể đọc danh sách tài khoản trong app:", error);
    }
  }, []);
  reactExports.useEffect(() => {
    void refreshInAppAccounts();
  }, [refreshInAppAccounts, status?.readyCredentialCount]);
  reactExports.useEffect(() => {
    void window.videoStudioBrowser?.setHideAfterLogin(hideLoginBrowser);
  }, [hideLoginBrowser]);
  const addInAppAccount = reactExports.useCallback(async () => {
    if (!window.googleFlowRuntime) return;
    setAddingAccount(true);
    try {
      await window.googleFlowRuntime.addInAppAccount();
      toast.success("Đã mở cửa sổ đăng nhập Google Flow trong ứng dụng.");
      await refreshInAppAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở cửa sổ đăng nhập.");
    } finally {
      setAddingAccount(false);
    }
  }, [refreshInAppAccounts]);
  const removeInAppAccount = reactExports.useCallback(async (accountSlotId) => {
    if (!window.googleFlowRuntime) return;
    setRemovingAccount(accountSlotId);
    try {
      await window.googleFlowRuntime.removeInAppAccount(accountSlotId);
      await refreshInAppAccounts();
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gỡ tài khoản.");
    } finally {
      setRemovingAccount(null);
    }
  }, [refresh, refreshInAppAccounts]);
  reactExports.useEffect(() => {
    void window.googleFlowRuntime?.updateSettings({
      imageLanesPerToken: laneSettings.imageLanesPerJwt,
      videoLanesPerToken: laneSettings.videoLanesPerJwt,
      imageSubmitDelayMinMs: laneSettings.imageSubmitDelayMinMs,
      imageSubmitDelayMaxMs: laneSettings.imageSubmitDelayMaxMs,
      videoSubmitDelayMinMs: laneSettings.videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs: laneSettings.videoSubmitDelayMaxMs,
      accountStartStaggerMinMs: laneSettings.jwtStartStaggerMinMs,
      accountStartStaggerMaxMs: laneSettings.jwtStartStaggerMaxMs
    });
  }, [laneSettings]);
  const refreshProjectBindings = reactExports.useCallback(async () => {
    if (!alwaysVisible || !activeProjectId || !window.googleFlowRuntime) {
      setProjectBindings([]);
      return;
    }
    try {
      setProjectBindings(await window.googleFlowRuntime.listProjectBindings(activeProjectId));
    } catch (error) {
      console.warn("[GoogleFlow] Không thể đọc danh sách Flow project:", error);
    }
  }, [activeProjectId, alwaysVisible]);
  reactExports.useEffect(() => {
    void refreshProjectBindings();
  }, [refreshProjectBindings, status?.readyCredentialCount]);
  const bindingsByOwner = reactExports.useMemo(() => {
    const grouped = /* @__PURE__ */ new Map();
    for (const binding of projectBindings) {
      const list = grouped.get(binding.ownerScopeId) || [];
      list.push(binding);
      grouped.set(binding.ownerScopeId, list);
    }
    return grouped;
  }, [projectBindings]);
  const createFlowProject = reactExports.useCallback(async (credentialId) => {
    if (!activeProjectId || !window.googleFlowRuntime) return;
    setProjectBusy(credentialId);
    try {
      const suffix = (/* @__PURE__ */ new Date()).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      await window.googleFlowRuntime.createProjectBinding({
        longddProjectId: activeProjectId,
        credentialId,
        title: `${activeProject?.name || "Dự án Flow"} ${suffix}`
      });
      await refreshProjectBindings();
      toast.success("Đã tạo và chuyển sang Flow project mới.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo Flow project mới.");
    } finally {
      setProjectBusy(null);
    }
  }, [activeProject?.name, activeProjectId, refreshProjectBindings]);
  const activateFlowProject = reactExports.useCallback(async (credentialId, flowProjectId) => {
    if (!activeProjectId || !window.googleFlowRuntime) return;
    setProjectBusy(credentialId);
    try {
      await window.googleFlowRuntime.activateProjectBinding({ longddProjectId: activeProjectId, credentialId, flowProjectId });
      await refreshProjectBindings();
      toast.success("Đã chuyển Flow project đang hoạt động.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chuyển Flow project.");
    } finally {
      setProjectBusy(null);
    }
  }, [activeProjectId, refreshProjectBindings]);
  const taskList = Object.values(tasks);
  if (!alwaysVisible && !status?.readyCredentialCount && !taskList.length) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/20 p-3 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium", children: "Kết nối Google Flow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xs text-muted-foreground", children: [
          status?.readyCredentialCount || 0,
          " tiện ích sẵn sàng · ",
          status?.imageLaneCount || 0,
          " luồng ảnh / ",
          status?.videoLaneCount || 0,
          " luồng video · giao thức v",
          status?.protocolVersion || 1
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-7 text-2xs", disabled: addingAccount, onClick: () => void addInAppAccount(), children: addingAccount ? "Đang mở…" : "+ Thêm tài khoản" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 text-2xs", onClick: () => {
          void (async () => {
            await window.googleFlowRuntime?.refreshInAppAccounts();
            await new Promise((resolve) => setTimeout(resolve, 2500));
            await refresh();
            await refreshProjectBindings();
            await refreshInAppAccounts();
          })();
        }, children: "Làm mới" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 text-2xs", onClick: clearFinished, children: "Xóa đã xong" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          className: "h-3.5 w-3.5",
          checked: hideLoginBrowser,
          onChange: (event) => setHideLoginBrowser(event.target.checked)
        }
      ),
      "Ẩn cửa sổ Chrome sau khi đăng nhập xong (dùng nút “Hiện” khi cần đăng nhập lại)"
    ] }),
    inAppAccounts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: inAppAccounts.map((account) => {
      const shortId = account.accountSlotId.slice(0, 8);
      const custom = accountLabels[account.accountSlotId]?.trim();
      const editing = editingSlot === account.accountSlotId;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 rounded border bg-background/70 px-2 py-1.5 text-2xs", children: [
        editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            autoFocus: true,
            className: "h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-2xs",
            value: draftName,
            maxLength: 40,
            placeholder: `Tài khoản ${shortId}`,
            onChange: (event) => setDraftName(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") saveAccountLabel(account.accountSlotId, draftName);
              if (event.key === "Escape") setEditingSlot(null);
            }
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate", children: custom ? `${custom} · ${shortId}` : `Tài khoản trong app · ${shortId}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 gap-1", children: editing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 text-2xs", onClick: () => saveAccountLabel(account.accountSlotId, draftName), children: "Lưu" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 text-2xs", onClick: () => setEditingSlot(null), children: "Hủy" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              className: "h-6 text-2xs",
              onClick: () => {
                setEditingSlot(account.accountSlotId);
                setDraftName(custom || "");
              },
              children: "Đổi tên"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              className: "h-6 text-2xs",
              onClick: () => void window.googleFlowRuntime?.showInAppAccount(account.accountSlotId),
              children: "Hiện"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              className: "h-6 text-2xs text-red-600 hover:text-red-600",
              disabled: removingAccount === account.accountSlotId,
              onClick: () => void removeInAppAccount(account.accountSlotId),
              children: removingAccount === account.accountSlotId ? "Đang gỡ…" : "Gỡ tài khoản"
            }
          )
        ] }) })
      ] }, account.accountSlotId);
    }) }),
    status?.credentials.map((credential) => {
      const bindings = bindingsByOwner.get(credential.ownerScopeId) || [];
      const activeBinding = bindings.find((binding) => binding.active);
      const busy = projectBusy === credential.credentialId;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-background/70 px-2 py-1.5 text-2xs space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            accountLabels[credential.extensionInstanceId]?.trim() ? `${accountLabels[credential.extensionInstanceId].trim()} · ` : "",
            "Tiện ích ",
            credential.extensionInstanceId.slice(0, 8),
            " · tài khoản ",
            credential.credentialId.slice(0, 8)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            credential.tier || "chưa rõ gói",
            " · ",
            credential.credits ?? "—",
            " tín dụng · ",
            credentialStateLabel[credential.state] || credential.state
          ] })
        ] }),
        alwaysVisible && activeProjectId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2 rounded border bg-muted/20 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "min-w-0 flex-1 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
              "Flow project của dự án “",
              activeProject?.name || activeProjectId,
              "”"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "h-8 w-full rounded border bg-background px-2 font-mono text-2xs",
                value: activeBinding?.flowProjectId || "",
                disabled: busy || !bindings.length,
                onChange: (event) => {
                  if (event.target.value) void activateFlowProject(credential.credentialId, event.target.value);
                },
                children: [
                  !bindings.length && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Chưa tạo Flow project" }),
                  bindings.map((binding) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: binding.flowProjectId, children: formatFlowProjectLabel(binding, activeProject?.name, bindings.length > 1) }, binding.flowProjectId))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "h-8 shrink-0 text-2xs",
              disabled: busy || credential.state !== "ready",
              onClick: () => void createFlowProject(credential.credentialId),
              children: busy ? "Đang xử lý…" : "Tạo project mới"
            }
          )
        ] })
      ] }, credential.credentialId);
    }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: taskList.slice(0, 8).map((task) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-background/70 px-2 py-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-2xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
          task.kind === "image" ? "Ảnh" : task.kind === "video" ? "Video" : task.kind,
          " · luồng ",
          task.laneSlot || "—",
          "/",
          task.totalLanes || "—"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: statusClass[task.status], children: phaseLabel[task.phase || ""] || statusLabel$1[task.status] || task.status })
      ] }),
      task.message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-2xs text-red-600 line-clamp-1", children: task.message })
    ] }, task.taskId)) }),
    alwaysVisible && !status?.readyCredentialCount && !inAppAccounts.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Bấm “+ Thêm tài khoản” để đăng nhập Google Flow ngay trong ứng dụng." }),
    alwaysVisible && activeProjectId && projectBindings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: "Đổi Flow project không xóa project hoặc Media ID cũ. Ảnh dùng trong project mới sẽ được tải lên một lần rồi tiếp tục dùng lại từ cache riêng của project đó." })
  ] });
}
const statusLabel = {
  queued: "Đang chờ",
  submitting: "Đang gửi",
  polling: "Đang tạo",
  downloading: "Đang tải về",
  completed: "Hoàn tất",
  failed: "Thất bại",
  cancelled: "Đã hủy"
};
function credentialQuotaLabel(credential) {
  if (credential.state === "ready" || credential.state === "exhausted") {
    if (typeof credential.weeklyUsagePercent === "number") {
      const percent = Math.round(Math.max(0, Math.min(100, credential.weeklyUsagePercent)));
      return credential.state === "exhausted" ? `Đã dùng ${percent}% · Hết lượt` : `Đã dùng ${percent}%`;
    }
    return credential.state === "ready" ? "Sẵn sàng" : "Hết lượt tạo video";
  }
  if (credential.state === "checking") return "Đang kiểm tra lượt";
  if (credential.state === "disconnected") return "Mất kết nối";
  return "Đã nối, chưa nhận tab Grok";
}
function GrokRuntimePanel({ alwaysVisible = false }) {
  const { status, tasks, initialize, refresh, clearFinished } = useGrokRuntimeStore();
  const hideLoginBrowser = useVideoStudioSettingsStore((state) => state.hideLoginBrowser);
  const setHideLoginBrowser = useVideoStudioSettingsStore((state) => state.setHideLoginBrowser);
  const videoLanesPerExtension = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoLanesPerJwt);
  const videoSubmitDelayMinMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoSubmitDelayMinMs);
  const videoSubmitDelayMaxMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.videoSubmitDelayMaxMs);
  const extensionStartStaggerMinMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.jwtStartStaggerMinMs);
  const extensionStartStaggerMaxMs = useVideoStudioSettingsStore((state) => state.maxStudioLanes.jwtStartStaggerMaxMs);
  const [inAppAccounts, setInAppAccounts] = reactExports.useState([]);
  const [addingAccount, setAddingAccount] = reactExports.useState(false);
  const [removingAccount, setRemovingAccount] = reactExports.useState(null);
  reactExports.useEffect(() => initialize(), [initialize]);
  const refreshInAppAccounts = reactExports.useCallback(async () => {
    if (!window.grokVideoRuntime) return;
    try {
      setInAppAccounts(await window.grokVideoRuntime.listInAppAccounts());
    } catch (error) {
      console.warn("[Grok] Không thể đọc danh sách tài khoản trong app:", error);
    }
  }, []);
  reactExports.useEffect(() => {
    void refreshInAppAccounts();
  }, [refreshInAppAccounts, status?.readyCredentialCount]);
  reactExports.useEffect(() => {
    void window.videoStudioBrowser?.setHideAfterLogin(hideLoginBrowser);
  }, [hideLoginBrowser]);
  const addInAppAccount = reactExports.useCallback(async () => {
    if (!window.grokVideoRuntime) return;
    setAddingAccount(true);
    try {
      await window.grokVideoRuntime.addInAppAccount();
      toast.success("Đã mở cửa sổ đăng nhập Grok trong ứng dụng.");
      await refreshInAppAccounts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở cửa sổ đăng nhập.");
    } finally {
      setAddingAccount(false);
    }
  }, [refreshInAppAccounts]);
  const removeInAppAccount = reactExports.useCallback(async (accountSlotId) => {
    if (!window.grokVideoRuntime) return;
    setRemovingAccount(accountSlotId);
    try {
      await window.grokVideoRuntime.removeInAppAccount(accountSlotId);
      await refreshInAppAccounts();
      void refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gỡ tài khoản.");
    } finally {
      setRemovingAccount(null);
    }
  }, [refresh, refreshInAppAccounts]);
  reactExports.useEffect(() => {
    void window.grokVideoRuntime?.updateSettings({
      videoLanesPerExtension,
      videoSubmitDelayMinMs,
      videoSubmitDelayMaxMs,
      extensionStartStaggerMinMs,
      extensionStartStaggerMaxMs
    });
  }, [videoLanesPerExtension, videoSubmitDelayMinMs, videoSubmitDelayMaxMs, extensionStartStaggerMinMs, extensionStartStaggerMaxMs]);
  const taskList = Object.values(tasks);
  const preloadAvailable = typeof window !== "undefined" && Boolean(window.grokVideoRuntime);
  const ready = Boolean(status?.readyCredentialCount);
  if (!alwaysVisible && !ready && !taskList.length) return null;
  let diagnostic = "";
  if (!preloadAvailable) {
    diagnostic = "Phiên ứng dụng hiện tại chưa nạp Grok runtime. Hãy đóng hẳn và mở lại ứng dụng desktop.";
  } else if (!status?.running) {
    diagnostic = "Runtime Grok chưa chạy. Hãy khởi động lại ứng dụng desktop.";
  } else if (!ready) {
    const credentials = status?.credentials || [];
    diagnostic = credentials.length > 0 && credentials.every((credential) => credential.state === "exhausted") ? "Tất cả tài khoản Grok đã hết lượt tạo video." : credentials.some((credential) => credential.state === "checking") ? "Đang kiểm tra lượt tạo video còn lại của tài khoản Grok." : inAppAccounts.length ? 'Đang chờ đăng nhập Grok trong cửa sổ vừa mở. Sau khi đăng nhập vào grok.com/imagine, trạng thái sẽ chuyển "Sẵn sàng".' : "Bấm “+ Thêm tài khoản” để đăng nhập Grok ngay trong ứng dụng.";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border bg-muted/20 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs font-medium", children: [
          ready ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-green-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5 text-amber-600" }),
          "Kết nối Grok Video"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xs text-muted-foreground", children: [
          "Runtime: ",
          status?.running ? "đang chạy" : "chưa chạy",
          " · Cổng ",
          status?.port || 9223,
          " · ",
          status?.readyCredentialCount || 0,
          " extension · ",
          status?.videoLaneCount || 0,
          " lane video"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-7 text-2xs", disabled: addingAccount, onClick: () => void addInAppAccount(), children: addingAccount ? "Đang mở…" : "+ Thêm tài khoản" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "h-7 w-7", title: "Kiểm tra lại", onClick: () => {
          void refresh();
          void refreshInAppAccounts();
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "checkbox",
          className: "h-3.5 w-3.5",
          checked: hideLoginBrowser,
          onChange: (event) => setHideLoginBrowser(event.target.checked)
        }
      ),
      "Ẩn cửa sổ Chrome sau khi đăng nhập xong (dùng nút “Hiện” khi cần đăng nhập lại)"
    ] }),
    inAppAccounts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: inAppAccounts.map((account) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 rounded border bg-background/70 px-2 py-1.5 text-2xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Tài khoản trong app · ",
        account.accountSlotId.slice(0, 8)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "h-6 text-2xs",
            onClick: () => void window.grokVideoRuntime?.showInAppAccount(account.accountSlotId),
            children: "Hiện"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "h-6 text-2xs text-red-600 hover:text-red-600",
            disabled: removingAccount === account.accountSlotId,
            onClick: () => void removeInAppAccount(account.accountSlotId),
            children: removingAccount === account.accountSlotId ? "Đang gỡ…" : "Gỡ tài khoản"
          }
        )
      ] })
    ] }, account.accountSlotId)) }),
    diagnostic && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-2xs leading-relaxed text-amber-800 dark:text-amber-300", children: diagnostic }),
    status?.credentials.map((credential) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded border bg-background/70 px-2 py-1.5 text-2xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Extension ",
        credential.extensionInstanceId.slice(0, 8)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: credential.state === "ready" ? "text-green-600" : credential.state === "exhausted" ? "text-red-600" : "text-amber-600", children: credentialQuotaLabel(credential) })
    ] }, credential.credentialId)),
    taskList.slice(0, 8).map((task) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-background/70 px-2 py-1.5 text-2xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Video · ",
          typeof task.progress === "number" ? `${task.progress}%` : "—"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: statusLabel[task.status] || task.status })
      ] }),
      task.message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 line-clamp-2 text-2xs text-red-600", children: task.message })
    ] }, task.taskId)),
    taskList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-7 text-2xs", onClick: clearFinished, children: "Xóa tác vụ đã xong" })
  ] });
}
const PLATFORM_ICONS = {
  openrouter: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-5 w-5" }),
  googleflow: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-5 w-5" }),
  grok: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-5 w-5" }),
  custom: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5" })
};
function isBrowserRuntimePlatform(platform) {
  return platform === "googleflow" || platform === "grok";
}
function getProviderMediaModels(provider, kind) {
  if (provider.platform === "googleflow") {
    return kind === "image" ? GOOGLE_FLOW_IMAGE_MODELS : GOOGLE_FLOW_VIDEO_MODELS;
  }
  if (provider.platform === "grok") {
    return kind === "video" ? GROK_VIDEO_MODELS : [];
  }
  return [];
}
function getProviderDisplayName(provider) {
  return provider.platform === "googleflow" ? "Google Flow" : provider.platform === "grok" ? "Grok" : provider.name;
}
function ProviderList({
  providers,
  googleFlowReady,
  grokReady,
  syncingProvider,
  setSyncingProvider,
  onEdit,
  onAdd,
  t
}) {
  const { removeProvider, syncProviderModels } = useAPIConfigStore();
  const [expandedProviders, setExpandedProviders] = reactExports.useState({});
  const [testingProvider, setTestingProvider] = reactExports.useState(null);
  const [testResults, setTestResults] = reactExports.useState({});
  const toggleExpanded = (id) => {
    setExpandedProviders((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const handleDelete = (id) => {
    removeProvider(id);
    toast.success(t("settings.deleteProvider"));
  };
  const isConfigured = (provider) => provider.platform === "googleflow" ? googleFlowReady : provider.platform === "grok" ? grokReady : isProviderCredentialConfigured(provider.platform, provider.apiKey);
  const testConnection = async (provider) => {
    if (provider.platform === "grok") {
      setTestingProvider(provider.id);
      try {
        const status = await window.grokVideoRuntime?.getStatus();
        const success = Boolean(status?.readyCredentialCount);
        setTestResults((prev) => ({ ...prev, [provider.id]: success }));
        if (success) toast.success(`Grok đã sẵn sàng: ${status.readyCredentialCount} extension`);
        else toast.error("Chưa kết nối Grok. Hãy nạp extension logdd, mở Grok Imagine và đăng nhập.");
      } finally {
        setTestingProvider(null);
      }
      return;
    }
    if (provider.platform === "googleflow") {
      setTestingProvider(provider.id);
      try {
        const status = await window.googleFlowRuntime?.getStatus();
        const success = Boolean(status?.readyCredentialCount);
        setTestResults((prev) => ({ ...prev, [provider.id]: success }));
        if (success) toast.success(`Google Flow đã sẵn sàng: ${status.readyCredentialCount} tiện ích`);
        else toast.error("Chưa có tiện ích Google Flow sẵn sàng. Hãy mở Google Flow trong Chrome và kiểm tra tiện ích.");
      } finally {
        setTestingProvider(null);
      }
      return;
    }
    const keys = parseApiKeys(provider.apiKey);
    if (keys.length === 0) {
      toast.error(t("settings.configureApiKeyFirst"));
      return;
    }
    setTestingProvider(provider.id);
    setTestResults((prev) => ({ ...prev, [provider.id]: null }));
    try {
      let response;
      const apiKey = keys[0];
      const normalizedBaseUrl = provider.baseUrl?.replace(/\/+$/, "");
      const buildEndpoint = (root, path) => {
        const normalized = root.replace(/\/+$/, "");
        return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
      };
      if (normalizedBaseUrl && provider.model?.length) {
        const endpoint = buildEndpoint(normalizedBaseUrl, "chat/completions");
        const model = provider.model[0];
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 5
          })
        });
      } else {
        setTestResults((prev) => ({ ...prev, [provider.id]: true }));
        toast.success(t("settings.providerConfigured", { name: getProviderDisplayName(provider) }));
        setTestingProvider(null);
        return;
      }
      const success = response.ok;
      setTestResults((prev) => ({ ...prev, [provider.id]: success }));
      if (success) {
        toast.success(t("settings.connectionSuccess"));
      } else {
        const errorData = await response.text();
        console.error("API test error:", response.status, errorData);
        toast.error(t("settings.connectionFailedWithStatus", { status: response.status }));
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setTestResults((prev) => ({ ...prev, [provider.id]: false }));
      toast.error(t("settings.networkTestFailed"));
    } finally {
      setTestingProvider(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "h-4 w-4" }),
      t("settings.providers")
    ] }),
    providers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-12 w-12 text-muted-foreground mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-foreground mb-2", children: t("settings.noProviders") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onAdd, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
        t("settings.addProvider")
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: providers.map((provider) => {
      const isExpanded = expandedProviders[provider.id] ?? false;
      const keyCount = getProviderCredentialCount(provider.platform, provider.apiKey);
      const configured = isConfigured(provider);
      const testResult = testResults[provider.id];
      const isTesting = testingProvider === provider.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Collapsible,
        {
          open: isExpanded,
          onOpenChange: () => toggleExpanded(provider.id),
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "border rounded-xl transition-all",
                configured ? "bg-card border-primary/30" : "bg-card border-border"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    role: "button",
                    tabIndex: 0,
                    className: "w-full flex items-center justify-between p-4 hover:bg-muted/30 rounded-t-xl transition-colors cursor-pointer",
                    onKeyDown: (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpanded(provider.id);
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: cn(
                              "p-2 rounded-lg",
                              configured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            ),
                            children: PLATFORM_ICONS[provider.platform] || /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5" })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
                            getProviderDisplayName(provider),
                            configured && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-normal", children: isBrowserRuntimePlatform(provider.platform) ? "Sẵn sàng" : t("settings.badgeConfigured") }),
                            isBrowserRuntimePlatform(provider.platform) && !configured && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-normal", children: "Chưa kết nối" })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: provider.platform })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "span",
                            {
                              className: "cursor-pointer hover:text-foreground",
                              onClick: (e) => {
                                e.stopPropagation();
                                toggleExpanded(provider.id);
                              },
                              children: t("settings.models", { count: provider.model.length })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "|" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "span",
                            {
                              className: "cursor-pointer hover:text-foreground",
                              onClick: (e) => {
                                e.stopPropagation();
                                if (isBrowserRuntimePlatform(provider.platform)) {
                                  toggleExpanded(provider.id);
                                } else {
                                  onEdit(provider);
                                }
                              },
                              children: isBrowserRuntimePlatform(provider.platform) ? "Tiện ích Chrome" : `Key (${keyCount})`
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "div",
                          {
                            className: "flex items-center gap-1",
                            onClick: (e) => e.stopPropagation(),
                            children: [
                              !isBrowserRuntimePlatform(provider.platform) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-8 w-8",
                                  title: t("settings.syncModels"),
                                  onClick: async () => {
                                    setSyncingProvider(provider.id);
                                    const result = await syncProviderModels(provider.id);
                                    setSyncingProvider(null);
                                    if (result.success) {
                                      toast.success(t("settings.syncSuccess", { count: result.count }));
                                    } else {
                                      toast.error(result.error || t("settings.syncFailed"));
                                    }
                                  },
                                  disabled: !configured || syncingProvider === provider.id,
                                  children: syncingProvider === provider.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" })
                                }
                              ),
                              provider.platform !== "googleflow" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-8 w-8",
                                  title: t("settings.testConnection"),
                                  onClick: () => testConnection(provider),
                                  disabled: !configured || isTesting,
                                  children: isTesting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : testResult === true ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-500" }) : testResult === false ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 text-red-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4" })
                                }
                              ),
                              !isBrowserRuntimePlatform(provider.platform) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-8 w-8",
                                  title: t("settings.edit"),
                                  onClick: () => onEdit(provider),
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-4 w-4" })
                                }
                              ),
                              !isBrowserRuntimePlatform(provider.platform) && /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Button,
                                  {
                                    variant: "ghost",
                                    size: "icon",
                                    className: "h-8 w-8 text-muted-foreground hover:text-destructive",
                                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
                                  }
                                ) }),
                                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("settings.confirmDelete") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("settings.confirmDeleteProvider", { name: getProviderDisplayName(provider) }) })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: t("common.cancel") }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      AlertDialogAction,
                                      {
                                        onClick: () => handleDelete(provider.id),
                                        className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                                        children: t("dashboard.delete")
                                      }
                                    )
                                  ] })
                                ] })
                              ] })
                            ]
                          }
                        ),
                        isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 space-y-3 border-t border-border/60 pt-3", children: [
                  provider.baseUrl && !isBrowserRuntimePlatform(provider.platform) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                      "Base URL:",
                      " "
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-foreground", children: provider.baseUrl })
                  ] }),
                  provider.platform === "googleflow" && /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleFlowRuntimePanel, { alwaysVisible: true }),
                  provider.platform === "grok" && /* @__PURE__ */ jsxRuntimeExports.jsx(GrokRuntimePanel, { alwaysVisible: true }),
                  provider.model.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: provider.model.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-xs px-2 py-1 bg-muted rounded font-mono",
                      children: getModelDisplayName(m)
                    },
                    m
                  )) }),
                  configured && !isBrowserRuntimePlatform(provider.platform) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                      "API Key:",
                      " "
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-foreground", children: [
                      maskApiKey(parseApiKeys(provider.apiKey)[0]),
                      keyCount > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                        " ",
                        "(+",
                        keyCount - 1,
                        ")"
                      ] })
                    ] })
                  ] })
                ] }) })
              ]
            }
          )
        },
        provider.id
      );
    }) })
  ] });
}
function MediaModelSelectors() {
  const { providers, setFeatureBindings, getFeatureBindings } = useAPIConfigStore();
  const mediaProviders = reactExports.useMemo(
    () => providers.filter((provider) => ["googleflow", "grok"].includes(provider.platform)),
    [providers]
  );
  const getMediaSelection = reactExports.useCallback((feature, kind) => {
    const bindings = getFeatureBindings(feature);
    for (const binding of bindings) {
      const separator = binding.indexOf(":");
      if (separator <= 0) continue;
      const providerIdOrPlatform = binding.slice(0, separator);
      const model = binding.slice(separator + 1);
      const provider = mediaProviders.find((item) => item.id === providerIdOrPlatform) || mediaProviders.find((item) => item.platform === providerIdOrPlatform);
      if (provider && getProviderMediaModels(provider, kind).includes(model)) {
        return { provider, model };
      }
    }
    const fallbackProvider = mediaProviders[0];
    const fallbackModels = fallbackProvider ? getProviderMediaModels(fallbackProvider, kind) : [];
    const fallbackModel = fallbackModels[0] || "";
    return fallbackProvider ? { provider: fallbackProvider, model: fallbackModel } : null;
  }, [getFeatureBindings, mediaProviders]);
  const imageSelection = getMediaSelection("character_generation", "image");
  const videoSelection = getMediaSelection("video_generation", "video");
  const setMediaModelBinding = reactExports.useCallback((feature, provider, model) => {
    setFeatureBindings(feature, [`${provider.id}:${model}`]);
    if (feature === "character_generation") {
      setFeatureBindings("scene_generation", [`${provider.id}:${model}`]);
    }
  }, [setFeatureBindings]);
  const setMediaProvider = reactExports.useCallback((feature, kind, providerId) => {
    const provider = mediaProviders.find((item) => item.id === providerId);
    if (!provider) return;
    const model = getProviderMediaModels(provider, kind)[0];
    if (model) setMediaModelBinding(feature, provider, model);
  }, [mediaProviders, setMediaModelBinding]);
  reactExports.useEffect(() => {
    const ensureBinding = (feature, selection) => {
      if (!selection) return;
      const expected = `${selection.provider.id}:${selection.model}`;
      if (!getFeatureBindings(feature).includes(expected)) {
        setFeatureBindings(feature, [expected]);
      }
    };
    ensureBinding("character_generation", imageSelection);
    ensureBinding("scene_generation", imageSelection);
    ensureBinding("video_generation", videoSelection);
  }, [
    getFeatureBindings,
    imageSelection?.model,
    imageSelection?.provider.id,
    setFeatureBindings,
    videoSelection?.model,
    videoSelection?.provider.id
  ]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-4 w-4" }),
        "Nhà cung cấp và mô hình tạo nội dung"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Mỗi loại nội dung chỉ hiển thị các mô hình thuộc nhà cung cấp đang được chọn." })
    ] }),
    mediaProviders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: "Hãy kết nối Google Flow hoặc Grok trước để chọn mô hình." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 rounded-lg border border-border/60 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nhà cung cấp tạo ảnh" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: imageSelection?.provider.id,
              onValueChange: (providerId) => setMediaProvider("character_generation", "image", providerId),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Chọn nhà cung cấp tạo ảnh" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: mediaProviders.map((provider) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: provider.id, children: getProviderDisplayName(provider) }, provider.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Mô hình tạo ảnh" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: imageSelection?.model,
              onValueChange: (model) => imageSelection && setMediaModelBinding("character_generation", imageSelection.provider, model),
              disabled: !imageSelection,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Chọn mô hình tạo ảnh" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (imageSelection ? getProviderMediaModels(imageSelection.provider, "image") : []).map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: getModelDisplayName(model) }, model)) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: imageSelection ? `Chỉ hiển thị mô hình ảnh của ${getProviderDisplayName(imageSelection.provider)}.` : "Chưa có nhà cung cấp tạo ảnh." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 rounded-lg border border-border/60 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nhà cung cấp tạo video" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: videoSelection?.provider.id,
              onValueChange: (providerId) => setMediaProvider("video_generation", "video", providerId),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Chọn nhà cung cấp tạo video" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: mediaProviders.map((provider) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: provider.id, children: getProviderDisplayName(provider) }, provider.id)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Mô hình tạo video" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: videoSelection?.model,
              onValueChange: (model) => videoSelection && setMediaModelBinding("video_generation", videoSelection.provider, model),
              disabled: !videoSelection,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Chọn mô hình tạo video" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (videoSelection ? getProviderMediaModels(videoSelection.provider, "video") : []).map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: getModelDisplayName(model) }, model)) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: videoSelection ? `Chỉ hiển thị mô hình video của ${getProviderDisplayName(videoSelection.provider)}.` : "Chưa có nhà cung cấp tạo video." })
        ] })
      ] })
    ] })
  ] });
}
function CliRuntimeSection() {
  const { t } = useI18n();
  const { cliRuntime, setCliRuntime } = useVideoStudioSettingsStore();
  const [cliStatus, setCliStatus] = reactExports.useState(null);
  const [cliModels, setCliModels] = reactExports.useState([]);
  const [isLoadingCliModels, setIsLoadingCliModels] = reactExports.useState(false);
  const [isCheckingCliStatus, setIsCheckingCliStatus] = reactExports.useState(false);
  const [cliTestPrompt, setCliTestPrompt] = reactExports.useState("Reply with exactly one sentence that says the CLI runtime is working.");
  const [cliTestOutput, setCliTestOutput] = reactExports.useState("");
  const [isRunningCliTest, setIsRunningCliTest] = reactExports.useState(false);
  const cliRuntimeAvailable = Boolean(window.cliRuntime || cliStatus?.transport === "http");
  const refreshCliStatus = reactExports.useCallback(async () => {
    setIsCheckingCliStatus(true);
    try {
      const status = await getCliRuntimeStatus();
      setCliStatus(status);
    } catch (error) {
      console.warn("[SettingsPanel] Failed to detect CLI runtime:", error);
      setCliStatus(null);
    } finally {
      setIsCheckingCliStatus(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void refreshCliStatus();
  }, [refreshCliStatus]);
  const refreshCliModels = reactExports.useCallback(async (adapter) => {
    setIsLoadingCliModels(true);
    try {
      const result = await getCliModels(adapter);
      const models = result.models || [];
      setCliModels(models);
      if (models.length > 0 && (!cliRuntime.model || !models.includes(cliRuntime.model))) {
        setCliRuntime({ model: models[0] });
      }
      if (models.length === 0 && cliRuntime.model) {
        setCliRuntime({ model: "" });
      }
    } finally {
      setIsLoadingCliModels(false);
    }
  }, [cliRuntime.model, setCliRuntime]);
  reactExports.useEffect(() => {
    void refreshCliModels(cliRuntime.adapter);
  }, [cliRuntime.adapter, refreshCliModels]);
  reactExports.useEffect(() => {
    if (!cliStatus) return;
    void refreshCliModels(cliRuntime.adapter);
  }, [cliStatus?.claude.available, cliStatus?.opencode.available, cliRuntime.adapter, refreshCliModels]);
  const handleRunCliTest = reactExports.useCallback(async () => {
    if (!cliTestPrompt.trim()) {
      toast.error(t("settings.cliTestPromptRequired"));
      return;
    }
    if (!cliRuntimeAvailable) {
      toast.error(t("settings.cliRuntimeUnavailable"));
      return;
    }
    setIsRunningCliTest(true);
    setCliTestOutput("");
    try {
      const result = await cliJsonTest(cliRuntime.adapter, cliRuntime.model || void 0);
      if (!result.ok) {
        throw new Error(result.error || "CLI test failed");
      }
      const output = await runCliTextCompletion({
        systemPrompt: "You are a concise assistant helping verify that the local CLI runtime is working.",
        userPrompt: cliTestPrompt,
        model: cliRuntime.model || void 0,
        sessionKey: "settings-cli-test",
        onChunk: (chunk) => {
          setCliTestOutput((prev) => prev + chunk);
        }
      });
      setCliTestOutput(output);
      toast.success(t("settings.connectionSuccess"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("settings.testFailed", { message }));
    } finally {
      setIsRunningCliTest(false);
    }
  }, [cliRuntimeAvailable, cliRuntime.model, cliRuntime.adapter, cliTestPrompt, t]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }),
          t("settings.cliRuntimeTitle"),
          isCliRuntimeBeta
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("settings.cliRuntimeDescription") }),
        !cliRuntimeAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600 mt-2", children: t("settings.cliRuntimeUnavailableHint") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Switch,
        {
          checked: cliRuntime.enabled,
          onCheckedChange: (checked) => setCliRuntime({ enabled: checked }),
          disabled: !cliRuntimeAvailable
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: cliRuntime.adapter === "opencode" ? "default" : "outline",
          className: "justify-start",
          onClick: () => setCliRuntime({ adapter: "opencode" }),
          disabled: isCliRuntimeBeta,
          children: "OpenCode CLI"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: cliRuntime.adapter === "claude" ? "default" : "outline",
          className: "justify-start",
          onClick: () => setCliRuntime({ adapter: "claude" }),
          disabled: isCliRuntimeBeta,
          children: "Claude CLI"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("settings.cliModel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: cliRuntime.model || void 0, onValueChange: (value) => setCliRuntime({ model: value }), disabled: isCliRuntimeBeta, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: isLoadingCliModels ? t("settings.cliLoadingModels") : t("settings.cliSelectModel") }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: cliModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: model, children: model }, model)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: isLoadingCliModels ? t("settings.cliLoadingModels") : cliModels.length > 0 ? t("settings.cliModelSourceReady", { count: cliModels.length }) : t("settings.cliNoModels") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("settings.cliTimeout") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 1e3,
            step: 1e3,
            value: cliRuntime.timeoutMs,
            onChange: (e) => {
              const value = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(value) && value >= 1e3) {
                setCliRuntime({ timeoutMs: value });
              }
            },
            disabled: isCliRuntimeBeta
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "OpenCode CLI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-xs", cliStatus?.opencode.available ? "text-green-600" : "text-muted-foreground"), children: cliStatus?.opencode.available ? t("settings.cliAvailable") : t("settings.cliUnavailable") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-mono break-all", children: cliStatus?.opencode.version || cliStatus?.opencode.error || t("settings.cliStatusUnknown") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground font-mono break-all", children: cliStatus?.opencode.path || t("settings.cliPathUnknown") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 pt-2 border-t border-border/60", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Claude CLI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-xs", cliStatus?.claude.available ? "text-green-600" : "text-muted-foreground"), children: cliStatus?.claude.available ? t("settings.cliAvailable") : t("settings.cliUnavailable") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-mono break-all", children: cliStatus?.claude.version || cliStatus?.claude.error || t("settings.cliStatusUnknown") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground font-mono break-all", children: cliStatus?.claude.path || t("settings.cliPathUnknown") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: async () => {
          await refreshCliStatus();
          await refreshCliModels(cliRuntime.adapter);
        }, disabled: isCheckingCliStatus || isLoadingCliModels, children: [
          isCheckingCliStatus ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
          t("settings.refreshCliStatus")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: cliStatus?.transport === "http" ? t("settings.cliUsingDevServer") : cliStatus?.transport === "electron" ? t("settings.cliUsingElectronRuntime") : t("settings.cliRuntimeStartHint") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.cliRuntimeHint") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2 border-t border-border/60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: t("settings.cliTestPrompt") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleRunCliTest, disabled: isRunningCliTest || !cliRuntime.enabled || !cliRuntimeAvailable, children: [
          isRunningCliTest ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4 mr-1" }),
          t("settings.cliRunTest")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Textarea,
        {
          value: cliTestPrompt,
          onChange: (e) => setCliTestPrompt(e.target.value),
          className: "min-h-[88px]",
          placeholder: t("settings.cliTestPromptPlaceholder"),
          disabled: isCliRuntimeBeta
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/20 p-3 min-h-[96px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-2", children: t("settings.cliTestOutput") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs whitespace-pre-wrap break-words text-foreground font-mono", children: cliTestOutput || t("settings.cliTestOutputEmpty") })
      ] })
    ] })
  ] });
}
function MsRangeInputs({
  min,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  width = "w-28"
}) {
  const handle = (raw, apply) => {
    const value = parseInt(raw, 10);
    if (value >= min) apply(value);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min, value: minValue, onChange: (e) => handle(e.target.value, onMinChange), className: width }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "-" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min, value: maxValue, onChange: (e) => handle(e.target.value, onMaxChange), className: width })
  ] });
}
function GlobalSettingsSection() {
  const { t } = useI18n();
  const {
    maxStudioLanes,
    scriptImport,
    setMaxStudioLanes,
    setScriptImport,
    watermarkRemovalEnabled,
    setWatermarkRemovalEnabled
  } = useVideoStudioSettingsStore();
  const licensePlan = useLicenseStore((s) => s.plan);
  const [draft, setDraft] = reactExports.useState(maxStudioLanes);
  reactExports.useEffect(() => {
    setDraft(maxStudioLanes);
  }, [maxStudioLanes]);
  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-foreground flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" }),
      t("settings.globalSettings")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-muted/10 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10 text-primary mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-foreground", children: t("settings.scriptImportChunkConcurrency") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.scriptImportChunkConcurrencyDesc") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground/70", children: t("settings.scriptImportChunkConcurrencyHint", {
            min: MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
            max: MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "number",
          min: MIN_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
          max: MAX_LONG_SCRIPT_SKILL_CHUNK_CONCURRENCY,
          step: 1,
          value: scriptImport.longScriptSkillChunkConcurrency,
          onChange: (event) => {
            setScriptImport({
              longScriptSkillChunkConcurrency: normalizeLongScriptSkillChunkConcurrency(event.target.value)
            });
          },
          className: "w-24 shrink-0"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-muted/10 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10 text-primary mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-foreground", children: t("settings.watermarkRemoval") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.watermarkRemovalDesc") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: watermarkRemovalEnabled,
            onCheckedChange: setWatermarkRemovalEnabled,
            disabled: licensePlan === "free"
          }
        )
      ] }),
      licensePlan === "free" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-3", children: t("settings.watermarkRemovalProHint") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("settings.maxStudioLanesTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: () => {
              setMaxStudioLanes(draft);
              toast.success(t("settings.maxStudioSettingsSaved"));
            },
            children: t("settings.save")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.maxStudioImageLanes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 1,
              value: draft.imageLanesPerJwt,
              onChange: (e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1) patchDraft({ imageLanesPerJwt: val });
              },
              className: "w-24"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.maxStudioImageLanesHelp") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.maxStudioVideoLanes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              type: "number",
              min: 1,
              value: draft.videoLanesPerJwt,
              onChange: (e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1) patchDraft({ videoLanesPerJwt: val });
              },
              className: "w-24"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.maxStudioVideoLanesHelp") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.maxStudioImageSubmitDelay") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MsRangeInputs,
            {
              min: 0,
              minValue: draft.imageSubmitDelayMinMs,
              maxValue: draft.imageSubmitDelayMaxMs,
              onMinChange: (value) => patchDraft({ imageSubmitDelayMinMs: value }),
              onMaxChange: (value) => patchDraft({ imageSubmitDelayMaxMs: value })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.maxStudioImageSubmitDelayHelp") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.maxStudioVideoSubmitDelay") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MsRangeInputs,
            {
              min: 0,
              minValue: draft.videoSubmitDelayMinMs,
              maxValue: draft.videoSubmitDelayMaxMs,
              onMinChange: (value) => patchDraft({ videoSubmitDelayMinMs: value }),
              onMaxChange: (value) => patchDraft({ videoSubmitDelayMaxMs: value })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.maxStudioVideoSubmitDelayHelp") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.maxStudioJwtStartStagger") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MsRangeInputs,
          {
            min: 0,
            minValue: draft.jwtStartStaggerMinMs,
            maxValue: draft.jwtStartStaggerMaxMs,
            onMinChange: (value) => patchDraft({ jwtStartStaggerMinMs: value }),
            onMaxChange: (value) => patchDraft({ jwtStartStaggerMaxMs: value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.maxStudioJwtStartStaggerHelp") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.directorImageTimeout") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MsRangeInputs,
            {
              min: 1,
              minValue: Math.round(draft.imageGenerationTimeoutMinMs / 1e3),
              maxValue: Math.round(draft.imageGenerationTimeoutMaxMs / 1e3),
              onMinChange: (value) => patchDraft({ imageGenerationTimeoutMinMs: value * 1e3 }),
              onMaxChange: (value) => patchDraft({ imageGenerationTimeoutMaxMs: value * 1e3 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.directorImageTimeoutHelp") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: t("settings.directorVideoTimeout") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            MsRangeInputs,
            {
              min: 1,
              minValue: Math.round(draft.videoGenerationTimeoutMinMs / 1e3),
              maxValue: Math.round(draft.videoGenerationTimeoutMaxMs / 1e3),
              onMinChange: (value) => patchDraft({ videoGenerationTimeoutMinMs: value * 1e3 }),
              onMaxChange: (value) => patchDraft({ videoGenerationTimeoutMaxMs: value * 1e3 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.directorVideoTimeoutHelp") })
        ] })
      ] })
    ] })
  ] });
}
const TEST_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
function ImageHostTab({ onAdd, onEdit }) {
  const { t } = useI18n();
  const { imageHostProviders, updateImageHostProvider, removeImageHostProvider } = useAPIConfigStore();
  const [testingImageHostId, setTestingImageHostId] = reactExports.useState(null);
  const visibleImageHostProviders = reactExports.useMemo(
    () => imageHostProviders.filter(isVisibleImageHostProvider),
    [imageHostProviders]
  );
  const handleDelete = (id) => {
    removeImageHostProvider(id);
    toast.success(t("settings.deleteImageHost"));
  };
  const handleTest = async (provider) => {
    setTestingImageHostId(provider.id);
    try {
      const result = await uploadToImageHost(TEST_IMAGE, {
        expiration: 60,
        providerId: provider.id
      });
      if (result.success) {
        toast.success(t("settings.imageHostTestSuccess", { name: provider.name }));
      } else {
        toast.error(t("settings.testFailed", { message: result.error || "Unknown error" }));
      }
    } catch {
      toast.error(t("settings.networkTestFailed"));
    } finally {
      setTestingImageHostId(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 max-w-3xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-5 w-5" }),
        t("settings.imageHostTitle")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("settings.imageHostDescription") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: t("settings.imageHostProviders") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: onAdd, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
          t("settings.add")
        ] })
      ] }),
      visibleImageHostProviders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: t("settings.noImageHosts") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: visibleImageHostProviders.map((provider) => {
        const keyCount = getApiKeyCount(provider.apiKey);
        const endpoint = provider.uploadPath || provider.baseUrl;
        const configured = provider.enabled && !!endpoint && (provider.apiKeyOptional || keyCount > 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border border-border rounded-xl bg-card space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: getProviderDisplayName(provider) }),
                configured ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded", children: t("settings.badgeConfigured") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded", children: t("settings.notConfigured") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                provider.platform,
                " · ",
                endpoint || t("settings.addressNotSet")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: provider.apiKeyOptional && keyCount === 0 ? t("settings.guestUpload") : t("settings.keyCount", { count: keyCount }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: provider.enabled,
                onCheckedChange: (checked) => updateImageHostProvider({ ...provider, enabled: checked })
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                disabled: !provider.enabled || testingImageHostId === provider.id,
                onClick: () => handleTest(provider),
                children: testingImageHostId === provider.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : t("settings.testConnection")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => onEdit(provider), children: t("settings.edit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(provider.id), children: t("dashboard.delete") })
          ] })
        ] }, provider.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-muted-foreground mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("settings.imageHostNotice") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: t("settings.imageHostDefaultNotice") })
      ] })
    ] })
  ] }) });
}
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
}
function clearPersistedStoreCaches() {
  const keysToRemove = Object.keys(localStorage).filter(
    (key) => key.startsWith("logdd-") || key.startsWith("longdd-") || key.includes("store")
  );
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  try {
    const dbRequest = indexedDB.open("longdd-creator-db", 1);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (db.objectStoreNames.contains("zustand-storage")) {
        const tx = db.transaction("zustand-storage", "readwrite");
        tx.objectStore("zustand-storage").clear();
      }
    };
  } catch (e) {
    console.warn("Failed to clear IndexedDB:", e);
  }
}
const LICENSE_BADGE_CLASS = {
  free: "text-muted-foreground bg-muted border-border",
  pro: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  unlimited: "text-success bg-success/10 border-success/20",
  dev: "text-violet-600 bg-violet-500/10 border-violet-500/20"
};
function StorageTab({ appVersion, onUpdateAvailable }) {
  const { t } = useI18n();
  const {
    resourceSharing,
    storagePaths,
    cacheSettings,
    updateSettings,
    setResourceSharing,
    setStoragePaths,
    setCacheSettings,
    setUpdateSettings
  } = useVideoStudioSettingsStore();
  const { activeProjectId } = useProjectStore();
  const { assignProjectToUnscoped: assignCharactersToProject } = useCharacterLibraryStore();
  const { assignProjectToUnscoped: assignScenesToProject } = useSceneStore();
  const { assignProjectToUnscoped: assignMediaToProject } = useMediaStore();
  const licensePlan = useLicenseStore((s) => s.plan);
  const [cacheSize, setCacheSize] = reactExports.useState(0);
  const [isCacheLoading, setIsCacheLoading] = reactExports.useState(false);
  const [isClearingCache, setIsClearingCache] = reactExports.useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = reactExports.useState(false);
  const hasStorageManager = typeof window !== "undefined" && !!window.storageManager;
  const hasAppUpdater = typeof window !== "undefined" && !!window.appUpdater;
  const refreshCacheSize = reactExports.useCallback(async () => {
    if (!window.storageManager) return;
    setIsCacheLoading(true);
    try {
      const result = await window.storageManager.getCacheSize();
      setCacheSize(result.total || 0);
    } catch (error) {
      console.error("Failed to get cache size:", error);
    } finally {
      setIsCacheLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    if (!hasStorageManager) return;
    window.storageManager?.getPaths().then((paths) => {
      if (paths.basePath) {
        setStoragePaths({ basePath: paths.basePath });
      }
    }).catch(() => {
    });
    refreshCacheSize();
  }, [hasStorageManager, refreshCacheSize, setStoragePaths]);
  reactExports.useEffect(() => {
    if (!hasStorageManager || !window.storageManager) return;
    window.storageManager.updateConfig({
      autoCleanEnabled: cacheSettings.autoCleanEnabled,
      autoCleanDays: cacheSettings.autoCleanDays
    });
  }, [cacheSettings.autoCleanEnabled, cacheSettings.autoCleanDays, hasStorageManager]);
  const handleToggleShareCharacters = async (checked) => {
    setResourceSharing({ shareCharacters: checked });
    if (!checked && activeProjectId) {
      assignCharactersToProject(activeProjectId);
    }
    try {
      await useCharacterLibraryStore.persist.rehydrate();
    } catch {
    }
  };
  const handleToggleShareScenes = async (checked) => {
    setResourceSharing({ shareScenes: checked });
    if (!checked && activeProjectId) {
      assignScenesToProject(activeProjectId);
    }
    try {
      await useSceneStore.persist.rehydrate();
    } catch {
    }
  };
  const handleToggleShareMedia = async (checked) => {
    setResourceSharing({ shareMedia: checked });
    if (!checked && activeProjectId) {
      assignMediaToProject(activeProjectId);
    }
    try {
      await useMediaStore.persist.rehydrate();
    } catch {
    }
  };
  const handleSelectStoragePath = async () => {
    if (!window.storageManager) {
      toast.error(t("settings.desktopOnly"));
      return;
    }
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    const result = await window.storageManager.moveData(dir);
    if (result.success) {
      setStoragePaths({ basePath: result.path || dir });
      clearPersistedStoreCaches();
      toast.success(t("settings.storageUpdated"));
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.moveFailed", { message: result.error || "Unknown error" }));
    }
  };
  const handleExportData = async () => {
    if (!window.storageManager) return;
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    const result = await window.storageManager.exportData(dir);
    if (result.success) {
      toast.success(t("settings.dataExported"));
    } else {
      toast.error(t("settings.exportFailed", { message: result.error || "Unknown error" }));
    }
  };
  const handleImportData = async () => {
    if (!window.storageManager) return;
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    if (!confirm(t("settings.confirmImport"))) return;
    const result = await window.storageManager.importData(dir);
    if (result.success) {
      clearPersistedStoreCaches();
      toast.success(t("settings.dataImported"));
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.importFailed", { message: result.error || "Unknown error" }));
    }
  };
  const handleLinkData = async () => {
    if (!window.storageManager) {
      toast.error(t("settings.desktopOnly"));
      return;
    }
    const dir = await window.storageManager.selectDirectory();
    if (!dir) return;
    const validation = await window.storageManager.validateDataDir(dir);
    if (!validation.valid) {
      toast.error(validation.error || t("settings.invalidDataDirectory"));
      return;
    }
    const confirmMsg = t("settings.linkDataConfirm", { projectCount: validation.projectCount || 0, mediaCount: validation.mediaCount || 0 });
    if (!confirm(confirmMsg)) return;
    const result = await window.storageManager.linkData(dir);
    if (result.success) {
      setStoragePaths({ basePath: result.path || dir });
      clearPersistedStoreCaches();
      toast.success(t("settings.linkedDataDir"));
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(t("settings.operationFailed", { message: result.error || "Unknown error" }));
    }
  };
  const handleClearCache = async () => {
    if (!window.storageManager) return;
    setIsClearingCache(true);
    try {
      const result = await window.storageManager.clearCache();
      if (result.success) {
        toast.success(t("settings.cacheCleared"));
        refreshCacheSize();
      } else {
        toast.error(t("settings.clearFailed", { message: result.error || "Unknown error" }));
      }
    } finally {
      setIsClearingCache(false);
    }
  };
  const handleCheckForUpdates = async () => {
    if (!window.appUpdater) {
      toast.error(t("settings.desktopOnly"));
      return;
    }
    setIsCheckingForUpdates(true);
    try {
      const result = await window.appUpdater.checkForUpdates();
      if (!result.success) {
        toast.error(t("settings.checkUpdateFailed", { message: result.error || "Unknown error" }));
        return;
      }
      if (result.hasUpdate && result.update) {
        onUpdateAvailable(result.update);
        return;
      }
      onUpdateAvailable(null);
      toast.success(t("settings.upToDate", { version: result.currentVersion }));
    } catch (error) {
      console.error("[SettingsPanel] Failed to check updates:", error);
      toast.error(t("settings.checkUpdateRetry"));
    } finally {
      setIsCheckingForUpdates(false);
    }
  };
  const handleClearIgnoredVersion = () => {
    setUpdateSettings({ ignoredVersion: "" });
    toast.success(t("settings.updateReminderRestored"));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 max-w-3xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "h-5 w-5" }),
        t("settings.storageTitle")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("settings.storageDescription") })
    ] }),
    !hasStorageManager && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-muted-foreground mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("settings.desktopOnly") }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-4 w-4" }),
        t("settings.resourceSharing")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.shareCharacters") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.visibleCurrentProjectOnly") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: resourceSharing.shareCharacters,
            onCheckedChange: handleToggleShareCharacters,
            disabled: !hasStorageManager
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.shareScenes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.visibleCurrentProjectOnly") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: resourceSharing.shareScenes,
            onCheckedChange: handleToggleShareScenes,
            disabled: !hasStorageManager
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.shareMedia") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.visibleCurrentProjectOnly") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: resourceSharing.shareMedia,
            onCheckedChange: handleToggleShareMedia,
            disabled: !hasStorageManager
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "h-4 w-4" }),
        t("settings.storageLocation")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("settings.storagePathLabel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: storagePaths.basePath || t("settings.defaultLocation"),
              placeholder: t("settings.defaultLocation"),
              readOnly: true,
              className: "font-mono text-xs"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleSelectStoragePath, disabled: !hasStorageManager, children: t("settings.select") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportData, disabled: !hasStorageManager, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5 mr-1" }),
            t("settings.export")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: handleImportData, disabled: !hasStorageManager, children: t("settings.import") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.storageMoveWarning") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
        t("settings.dataRecovery")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("settings.dataRecoveryDescription") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleLinkData,
            disabled: !hasStorageManager,
            className: "w-full",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Folder, { className: "h-3.5 w-3.5 mr-1" }),
              t("settings.linkExistingData")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.linkExistingDataHint") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "h-4 w-4" }),
        t("settings.cacheManagement")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.cacheSize") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: isCacheLoading ? t("settings.calculating") : formatBytes(cacheSize) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: refreshCacheSize,
              disabled: !hasStorageManager || isCacheLoading,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${isCacheLoading ? "animate-spin" : ""}` })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleClearCache,
              disabled: !hasStorageManager || isClearingCache,
              children: isClearingCache ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : t("settings.clear")
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.autoClean") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.defaultOff") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: cacheSettings.autoCleanEnabled,
            onCheckedChange: (checked) => setCacheSettings({ autoCleanEnabled: checked }),
            disabled: !hasStorageManager
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs text-muted-foreground", children: t("settings.clean") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            type: "number",
            min: 1,
            value: cacheSettings.autoCleanDays,
            onChange: (e) => setCacheSettings({ autoCleanDays: Math.max(1, parseInt(e.target.value) || 1) }),
            className: "w-20",
            disabled: !cacheSettings.autoCleanEnabled
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("settings.cacheOlderThanDays", { count: cacheSettings.autoCleanDays }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 border border-border rounded-xl bg-card space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-medium text-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
        t("settings.appUpdates")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "License plan" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-2xs uppercase tracking-widest font-medium border ${LICENSE_BADGE_CLASS[licensePlan] || LICENSE_BADGE_CLASS.free}`, children: LICENSE_BADGE_CLASS[licensePlan] ? licensePlan : "—" }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.currentVersion") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground font-mono mt-1", children: [
            "v",
            appVersion
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleCheckForUpdates,
            disabled: !hasAppUpdater || isCheckingForUpdates,
            children: [
              isCheckingForUpdates ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin mr-1" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
              t("settings.checkForUpdates")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.autoCheckUpdates") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.autoCheckUpdatesHelp") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: updateSettings.autoCheckEnabled,
            onCheckedChange: (checked) => setUpdateSettings({ autoCheckEnabled: checked }),
            disabled: !hasAppUpdater
          }
        )
      ] }),
      updateSettings.ignoredVersion && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("settings.ignoredVersion") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground font-mono mt-1", children: [
            "v",
            updateSettings.ignoredVersion
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleClearIgnoredVersion, children: t("settings.restoreReminder") })
      ] }),
      !hasAppUpdater && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("settings.desktopOnly") })
    ] })
  ] }) });
}
function SettingsPanel() {
  const {
    providers,
    addProvider,
    updateProvider,
    addImageHostProvider,
    updateImageHostProvider,
    isImageHostConfigured,
    syncProviderModels
  } = useAPIConfigStore();
  const { setUpdateSettings } = useVideoStudioSettingsStore();
  const { t } = useI18n();
  const googleFlowStatus = useGoogleFlowRuntimeStore((state) => state.status);
  const initializeGoogleFlowRuntime = useGoogleFlowRuntimeStore((state) => state.initialize);
  const grokStatus = useGrokRuntimeStore((state) => state.status);
  const initializeGrokRuntime = useGrokRuntimeStore((state) => state.initialize);
  reactExports.useEffect(() => initializeGoogleFlowRuntime(), [initializeGoogleFlowRuntime]);
  reactExports.useEffect(() => initializeGrokRuntime(), [initializeGrokRuntime]);
  const [activeTab, setActiveTab] = reactExports.useState("api");
  const [addDialogOpen, setAddDialogOpen] = reactExports.useState(false);
  const [editDialogOpen, setEditDialogOpen] = reactExports.useState(false);
  const [editingProvider, setEditingProvider] = reactExports.useState(null);
  const [syncingProvider, setSyncingProvider] = reactExports.useState(null);
  const [imageHostAddOpen, setImageHostAddOpen] = reactExports.useState(false);
  const [imageHostEditOpen, setImageHostEditOpen] = reactExports.useState(false);
  const [editingImageHost, setEditingImageHost] = reactExports.useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = reactExports.useState(false);
  const [availableUpdate, setAvailableUpdate] = reactExports.useState(null);
  const [appVersion, setAppVersion] = reactExports.useState(packageJson.version);
  const googleFlowReady = Boolean(googleFlowStatus?.readyCredentialCount);
  const grokReady = Boolean(grokStatus?.readyCredentialCount);
  const existingPlatforms = reactExports.useMemo(() => providers.map((p) => p.platform), [providers]);
  const configuredCount = providers.filter(
    (p) => p.platform === "googleflow" ? googleFlowReady : p.platform === "grok" ? grokReady : isProviderCredentialConfigured(p.platform, p.apiKey)
  ).length;
  reactExports.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const version2 = await window.appUpdater?.getCurrentVersion?.();
        if (!cancelled && version2) {
          setAppVersion(version2);
        }
      } catch (error) {
        console.warn("[SettingsPanel] Failed to load app version:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const syncAfterCredentialChange = (id, platform, apiKey) => {
    if (!isProviderCredentialConfigured(platform, apiKey)) return;
    setSyncingProvider(id);
    syncProviderModels(id).then((result) => {
      setSyncingProvider(null);
      if (result.success) {
        toast.success(t("settings.autoSyncedModels", { count: result.count }));
      } else if (result.error) {
        toast.error(t("settings.modelSyncFailed", { message: result.error }));
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col h-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1 flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "h-12 bg-transparent p-0 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TabsTrigger,
            {
              value: "api",
              className: "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "h-4 w-4 mr-2" }),
                t("settings.tab.api")
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TabsTrigger,
            {
              value: "imagehost",
              className: "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4 mr-2" }),
                t("settings.tab.imageHost"),
                isImageHostConfigured() && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 w-2 h-2 bg-green-500 rounded-full" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TabsTrigger,
            {
              value: "storage",
              className: "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(HardDrive, { className: "h-4 w-4 mr-2" }),
                t("settings.tab.storage")
              ]
            }
          )
        ] }),
        activeTab === "api" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-mono bg-muted border border-border px-2 py-1 rounded", children: t("settings.configured", { count: configuredCount, total: providers.length }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setAddDialogOpen(true), size: "sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
            t("settings.addProvider")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "api", className: "flex-1 overflow-hidden mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 max-w-5xl mx-auto space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-5 w-5 text-primary mt-0.5 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-foreground text-sm", children: t("settings.securityTitle") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("settings.securityBody") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ProviderList,
          {
            providers,
            googleFlowReady,
            grokReady,
            syncingProvider,
            setSyncingProvider,
            onEdit: (provider) => {
              setEditingProvider(provider);
              setEditDialogOpen(true);
            },
            onAdd: () => setAddDialogOpen(true),
            t
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MediaModelSelectors, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CliRuntimeSection, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalSettingsSection, {})
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "imagehost", className: "flex-1 overflow-hidden mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        ImageHostTab,
        {
          onAdd: () => setImageHostAddOpen(true),
          onEdit: (provider) => {
            setEditingImageHost(provider);
            setImageHostEditOpen(true);
          }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "storage", className: "flex-1 overflow-hidden mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        StorageTab,
        {
          appVersion,
          onUpdateAvailable: (update) => {
            setAvailableUpdate(update);
            if (update) setUpdateDialogOpen(true);
          }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddProviderDialog,
      {
        open: addDialogOpen,
        onOpenChange: setAddDialogOpen,
        onSubmit: (providerData) => {
          const provider = addProvider(providerData);
          syncAfterCredentialChange(provider.id, providerData.platform, providerData.apiKey);
        },
        existingPlatforms
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditProviderDialog,
      {
        open: editDialogOpen,
        onOpenChange: setEditDialogOpen,
        provider: editingProvider,
        onSave: (provider) => {
          updateProvider(provider);
          syncAfterCredentialChange(provider.id, provider.platform, provider.apiKey);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddImageHostDialog,
      {
        open: imageHostAddOpen,
        onOpenChange: setImageHostAddOpen,
        onSubmit: addImageHostProvider
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditImageHostDialog,
      {
        open: imageHostEditOpen,
        onOpenChange: setImageHostEditOpen,
        provider: editingImageHost,
        onSave: updateImageHostProvider
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UpdateDialog,
      {
        open: updateDialogOpen,
        onOpenChange: setUpdateDialogOpen,
        updateInfo: availableUpdate,
        onIgnoreVersion: (version2) => {
          setUpdateSettings({ ignoredVersion: version2 });
          setAvailableUpdate(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute bottom-2 right-4 text-2xs font-mono text-muted-foreground/70", children: [
      "v",
      appVersion
    ] })
  ] });
}
export {
  SettingsPanel
};
