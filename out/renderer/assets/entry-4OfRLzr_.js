const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./entry-C4f9I3oQ.js","./radix-ui-BYOyDlCM.js","./lucide-react-Cs1Usobv.js","./supabase-DI0hoIb9.js","./index-B8Pnvlyd.js","./zustand-DqfYAuvg.js","./index-CdMwN6ML.css","./FeatureHeaderIcon-BtUg61kJ.js","./progress-C4y9txuJ.js","./select-Dpmre5UT.js","./textarea-P4k3OFxA.js","./label-C6uhtku6.js","./popover-BBVZUjTG.js"])))=>i.map(i=>d[i]);
import { j as jsxRuntimeExports, J as Root, K as Track, M as Range, N as Thumb } from "./radix-ui-BYOyDlCM.js";
import { A as translate, a as useI18n, B as Button, C as useUIPreferencesStore, D as Dialog, e as DialogContent, i as DialogHeader, j as DialogTitle, y as DialogDescription, k as DialogFooter, F as FeatureRail, _ as __vitePreload } from "./index-B8Pnvlyd.js";
import { r as reactExports, aU as SlidersHorizontal, z as Search, L as LoaderCircle, $ as ChevronDown, aV as ArrowDown, aW as ArrowUp, u as CircleAlert, aX as KeyRound, v as ExternalLink, aY as Zap, aH as PinOff, aG as Pin, ar as ThumbsUp, aZ as MessageCircle, _ as Plus, K as Users, q as RefreshCw, a_ as Settings2, d as Trash2, a7 as ChevronUp, D as Download, M as MessageSquareText, T as Telescope, i as Settings, a$ as Compass, b0 as Youtube, b as EyeOff, E as Eye, t as CircleCheck, b1 as ShieldCheck, c as Save, aI as RotateCcw } from "./lucide-react-Cs1Usobv.js";
import { u as useResearchStore, d as discoverYouTubeVideos, m as measuredCoverageInWindow, a as measuredViewsInWindow, b as measuredChannelViewsInWindow, D as DEFAULT_CHANNEL_SCAN_CONFIG, c as loadTrackedChannels, f as latestMeasuredVph, g as loadChannelVideoCatalog, e as extractYouTubeVideoId, h as loadYouTubeVideosByIds, l as loadAllVideoComments, i as loadCommentChannelVideos, q as quotaForKey, j as configuredApiKeys, k as maskYouTubeKey, v as validateYouTubeApiKey } from "./youtube-api-ls4n_Jy1.js";
import { F as FeatureHeaderIcon } from "./FeatureHeaderIcon-BtUg61kJ.js";
import "./supabase-DI0hoIb9.js";
import "./zustand-DqfYAuvg.js";
import "./cors-fetch-CkwbEcad.js";
function formatViews(value) {
  const integerValue = Math.round(value);
  if (integerValue >= 1e6) return `${(integerValue / 1e6).toFixed(integerValue >= 1e7 ? 0 : 1)}M`;
  if (integerValue >= 1e3) return `${(integerValue / 1e3).toFixed(integerValue >= 1e5 ? 0 : 1)}K`;
  return String(integerValue);
}
function formatDuration(value) {
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function formatAge(value, language = "vi") {
  const hours = Math.max(1, (Date.now() - new Date(value).getTime()) / 36e5);
  if (hours < 48) return translate(language, "research.time.hoursAgo", { count: Math.round(hours) });
  const days = hours / 24;
  if (days < 60) return translate(language, "research.time.daysAgo", { count: Math.round(days) });
  const months = days / 30;
  if (months < 24) return translate(language, "research.time.monthsAgo", { count: Math.round(months) });
  return translate(language, "research.time.yearsAgo", { count: Math.round(months / 12) });
}
const COMPOSITE_SIGNALS = ["views", "recency", "subscribers", "outlier"];
const COMPOSITE_SIGNAL_LABEL = { views: "research.discover.sortViews", recency: "research.discover.signalRecency", subscribers: "research.discover.sortSubscribers", outlier: "research.discover.sortOutlier" };
const COMPOSITE_PRESETS = [
  { key: "balanced", labelKey: "research.discover.presetBalanced", weights: { views: 50, recency: 50, subscribers: 0, outlier: 0 } },
  { key: "trending", labelKey: "research.discover.presetTrending", weights: { views: 40, recency: 60, subscribers: 0, outlier: 0 } },
  { key: "bigChannel", labelKey: "research.discover.presetBigChannel", weights: { views: 50, recency: 0, subscribers: 50, outlier: 0 } },
  { key: "breakout", labelKey: "research.discover.presetBreakout", weights: { views: 30, recency: 0, subscribers: 0, outlier: 70 } }
];
function clampHour(value, maxHours) {
  return Math.max(0, Math.min(maxHours, Math.round(Number.isFinite(value) ? value : 0)));
}
const METRIC_ANCHORS = [0, 100, 500, 1e3, 5e3, 1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8];
const METRIC_RES = 100;
const METRIC_MAX_POS = (METRIC_ANCHORS.length - 1) * METRIC_RES;
const METRIC_ANCHOR_MAX = METRIC_ANCHORS[METRIC_ANCHORS.length - 1];
function positionToValue(position) {
  if (position >= METRIC_MAX_POS) return Number.POSITIVE_INFINITY;
  const segment = Math.floor(position / METRIC_RES);
  const fraction = (position - segment * METRIC_RES) / METRIC_RES;
  return Math.round(METRIC_ANCHORS[segment] + fraction * (METRIC_ANCHORS[segment + 1] - METRIC_ANCHORS[segment]));
}
function valueToPosition(value) {
  if (!Number.isFinite(value) || value >= METRIC_ANCHOR_MAX) return METRIC_MAX_POS;
  if (value <= 0) return 0;
  const segment = Math.max(0, METRIC_ANCHORS.findIndex((anchor) => anchor > value) - 1);
  const low = METRIC_ANCHORS[segment];
  const high = METRIC_ANCHORS[segment + 1];
  return Math.round((segment + (value - low) / (high - low)) * METRIC_RES);
}
function formatMetricValue(value) {
  return Number.isFinite(value) ? formatViews(value) : "∞";
}
function parseMetricValue(value) {
  const normalized = value.trim().toUpperCase().replace(/[,_\s]/g, "");
  if (normalized === "" || normalized === "∞") return Number.POSITIVE_INFINITY;
  const match = normalized.match(/^(\d+(?:\.\d+)?)([KMB])?\+?$/);
  if (!match) return null;
  const multiplier = match[2] === "K" ? 1e3 : match[2] === "M" ? 1e6 : match[2] === "B" ? 1e9 : 1;
  return Number(match[1]) * multiplier;
}
function DualRange({ label, values, onChange }) {
  const positions = [valueToPosition(values[0]), valueToPosition(values[1])];
  const minValue = values[0];
  const maxValue = values[1];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs font-semibold", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root, { value: positions, min: 0, max: METRIC_MAX_POS, step: 1, minStepsBetweenThumbs: 1, onValueChange: (nextPositions) => onChange(nextPositions.map(positionToValue)), className: "relative flex h-5 w-full touch-none select-none items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Track, { className: "relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { className: "block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { className: "block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { "aria-label": `${label} min`, value: formatMetricValue(minValue), onChange: (event) => {
        const parsed = parseMetricValue(event.target.value);
        if (parsed != null) onChange([Math.max(0, Math.min(parsed, maxValue)), maxValue]);
      }, className: "min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center text-2xs font-medium outline-none focus:border-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { "aria-label": `${label} max`, value: formatMetricValue(maxValue), onChange: (event) => {
        const parsed = parseMetricValue(event.target.value);
        if (parsed != null) onChange([minValue, Math.max(minValue, parsed)]);
      }, className: "min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center text-2xs font-medium outline-none focus:border-primary" })
    ] })
  ] });
}
function PublishedTimeRange({ maxDays, hours, onMaxDaysChange, onHoursChange }) {
  const { t } = useI18n();
  const maxHours = maxDays * 24;
  const formatHourAge = (value) => {
    if (value === 0) return t("research.discover.now");
    if (value < 48) return t("research.discover.hoursAgo", { count: value });
    const days = Math.floor(value / 24);
    const remainingHours = value % 24;
    return remainingHours ? t("research.discover.daysHoursAgo", { days, hours: remainingHours }) : t("research.discover.daysAgo", { count: days });
  };
  const setNewest = (value) => {
    const newest = Math.min(clampHour(value, maxHours), Math.max(0, hours[1] - 1));
    onHoursChange([newest, hours[1]]);
  };
  const setOldest = (value) => {
    const oldest = Math.max(clampHour(value, maxHours), Math.min(maxHours, hours[0] + 1));
    onHoursChange([hours[0], oldest]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold", children: t("research.discover.published") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 text-2xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.discover.maxDays") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, max: 3650, value: maxDays, onChange: (event) => onMaxDaysChange(Number(event.target.value)), className: "h-7 w-16 rounded-lg border border-border/60 bg-background px-2 text-center text-2xs font-medium text-foreground outline-none focus:border-primary" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Root, { value: hours, min: 0, max: maxHours, step: 1, minStepsBetweenThumbs: 1, onValueChange: onHoursChange, className: "relative flex h-5 w-full touch-none select-none items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Track, { className: "relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { "aria-label": t("research.discover.newestAge"), className: "block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { "aria-label": t("research.discover.oldestAge"), className: "block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "rounded-lg border border-border/60 bg-background px-2 py-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: t("research.discover.newestAge") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, max: Math.max(0, hours[1] - 1), value: hours[0], onChange: (event) => setNewest(Number(event.target.value)), className: "mt-0.5 w-full bg-transparent text-center text-2xs font-medium outline-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "rounded-lg border border-border/60 bg-background px-2 py-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: t("research.discover.oldestAge") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: hours[0] + 1, max: maxHours, value: hours[1], onChange: (event) => setOldest(Number(event.target.value)), className: "mt-0.5 w-full bg-transparent text-center text-2xs font-medium outline-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex justify-between text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatHourAge(hours[0]) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatHourAge(hours[1]) })
    ] })
  ] });
}
function VideoCard({ video, measured, pinned, onTogglePin }) {
  const { language, t } = useI18n();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `https://www.youtube.com/watch?v=${video.id}`, target: "_blank", rel: "noopener noreferrer", className: "relative block aspect-video overflow-hidden rounded-xl bg-muted/30", children: [
      video.thumbnailUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: video.thumbnailUrl, alt: "", className: "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-2xs font-medium text-white", children: formatDuration(video.duration) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2 text-xs font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-primary/10 px-2 py-0.5 text-primary", children: [
        video.outlier.toFixed(1),
        "×"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-3 w-3 text-amber-500" }),
        measured ? `${formatViews(Math.round(video.viewsPerHour))} VPH` : t("research.discover.waitScan")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onTogglePin, title: t(pinned ? "research.discover.unpin" : "research.discover.pin"), className: `ml-auto flex h-6 w-6 items-center justify-center rounded-lg ${pinned ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`, children: pinned ? /* @__PURE__ */ jsxRuntimeExports.jsx(PinOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { className: "h-3.5 w-3.5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://www.youtube.com/watch?v=${video.id}`, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1.5 line-clamp-2 min-h-10 text-xs font-semibold leading-5 transition-colors group-hover:text-primary", children: video.title }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex min-w-0 items-center gap-1.5 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: video.channelTitle }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: video.subscriberCount ? `${formatViews(video.subscriberCount)} sub` : t("research.discover.hiddenSubs") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-2 text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-foreground", children: [
        formatViews(video.viewCount),
        " ",
        t("research.common.views")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "· ",
        formatAge(video.publishedAt, language)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-3 w-3" }),
        formatViews(video.likeCount)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3 w-3" }),
        formatViews(video.commentCount)
      ] })
    ] })
  ] });
}
function DiscoverView() {
  const { t } = useI18n();
  const apiKey = useResearchStore((state) => state.apiKey);
  const savedQuery = useResearchStore((state) => state.discoveryQuery);
  const setSavedQuery = useResearchStore((state) => state.setDiscoveryQuery);
  const maxPublishedDays = useResearchStore((state) => state.discoveryMaxDays);
  const publishedHourRange = useResearchStore((state) => state.discoveryPublishedHourRange);
  const setMaxPublishedDays = useResearchStore((state) => state.setDiscoveryMaxDays);
  const setPublishedHourRange = useResearchStore((state) => state.setDiscoveryPublishedHourRange);
  const pinnedVideoIds = useResearchStore((state) => state.pinnedVideoIds);
  const vphHistory = useResearchStore((state) => state.vphHistory);
  const pinVideo = useResearchStore((state) => state.pinVideo);
  const unpinVideo = useResearchStore((state) => state.unpinVideo);
  const [query, setQuery] = reactExports.useState(savedQuery);
  const [videos, setVideos] = reactExports.useState([]);
  const [nextPageToken, setNextPageToken] = reactExports.useState();
  const [totalResults, setTotalResults] = reactExports.useState(0);
  const [hasSearched, setHasSearched] = reactExports.useState(false);
  const [activePublishedBounds, setActivePublishedBounds] = reactExports.useState({});
  const [sortField, setSortField] = reactExports.useState("outlier");
  const [sortDir, setSortDir] = reactExports.useState("desc");
  const [weights, setWeights] = reactExports.useState({ views: 50, recency: 50, subscribers: 0, outlier: 0 });
  const [kind, setKind] = reactExports.useState("Long");
  const [duration, setDuration] = reactExports.useState("any");
  const [viewRange, setViewRange] = reactExports.useState([0, Number.POSITIVE_INFINITY]);
  const [subRange, setSubRange] = reactExports.useState([0, Number.POSITIVE_INFINITY]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const viewValues = viewRange;
  const subValues = subRange;
  const results = reactExports.useMemo(() => {
    const enriched = videos.map((video) => {
      const history = vphHistory[video.id];
      return { ...video, viewsPerHour: history?.[history.length - 1]?.vph ?? 0 };
    });
    const direction = sortDir === "asc" ? 1 : -1;
    if (sortField === "composite" && enriched.length) {
      const signalValue = (video, signal) => signal === "views" ? video.viewCount : signal === "recency" ? new Date(video.publishedAt).getTime() : signal === "subscribers" ? video.subscriberCount : video.outlier;
      const ranges = COMPOSITE_SIGNALS.map((signal) => {
        const values = enriched.map((video) => signalValue(video, signal));
        return { signal, min: Math.min(...values), max: Math.max(...values) };
      });
      const totalWeight = COMPOSITE_SIGNALS.reduce((sum, signal) => sum + weights[signal], 0) || 1;
      const score = (video) => ranges.reduce((sum, { signal, min, max }) => sum + weights[signal] * (max > min ? (signalValue(video, signal) - min) / (max - min) : 0), 0) / totalWeight;
      return enriched.sort((a, b) => (score(a) - score(b)) * direction);
    }
    const metric = (video) => sortField === "views" ? video.viewCount : sortField === "subscribers" ? video.subscriberCount : sortField === "published" ? new Date(video.publishedAt).getTime() : video.outlier;
    return enriched.sort((a, b) => (metric(a) - metric(b)) * direction);
  }, [sortField, sortDir, weights, videos, vphHistory]);
  const matchesSearchFilters = (video, requestedKind) => {
    if (video.kind !== requestedKind) return false;
    if (video.viewCount < viewValues[0] || Number.isFinite(viewValues[1]) && video.viewCount > viewValues[1]) return false;
    if (video.subscriberCount < subValues[0] || Number.isFinite(subValues[1]) && video.subscriberCount > subValues[1]) return false;
    return true;
  };
  const invalidateSearch = () => {
    setVideos([]);
    setNextPageToken(void 0);
    setTotalResults(0);
    setHasSearched(false);
    setError("");
  };
  const changeMaxPublishedDays = (value) => {
    const nextDays = Math.max(1, Math.min(3650, Math.round(Number.isFinite(value) ? value : 1)));
    const previousMaxHours = maxPublishedDays * 24;
    const nextMaxHours = nextDays * 24;
    const followedMaximum = publishedHourRange[1] === previousMaxHours;
    const nextOldest = followedMaximum ? nextMaxHours : Math.min(publishedHourRange[1], nextMaxHours);
    setMaxPublishedDays(nextDays);
    setPublishedHourRange([Math.min(publishedHourRange[0], Math.max(0, nextOldest - 1)), Math.max(1, nextOldest)]);
    invalidateSearch();
  };
  const changePublishedHours = (value) => {
    setPublishedHourRange(value.map((hour) => clampHour(hour, maxPublishedDays * 24)));
    invalidateSearch();
  };
  const resetFilters = () => {
    setKind("Long");
    setDuration("any");
    setMaxPublishedDays(30);
    setPublishedHourRange([0, 30 * 24]);
    setViewRange([0, Number.POSITIVE_INFINITY]);
    setSubRange([0, Number.POSITIVE_INFINITY]);
    setVideos([]);
    setNextPageToken(void 0);
    setTotalResults(0);
    setActivePublishedBounds({});
    setHasSearched(false);
  };
  const collectMatchingPages = async (requestedKind, startToken, bounds, maxPages = 10) => {
    const collected = [];
    const order = viewValues[0] > 0 ? "viewCount" : "relevance";
    let token = startToken;
    let total = 0;
    let pageCount = 0;
    do {
      const page = await discoverYouTubeVideos(apiKey, query.trim(), requestedKind, token, bounds.after, bounds.before, order, requestedKind === "Long" && duration !== "any" ? duration : void 0);
      total = Math.max(total, page.totalResults);
      collected.push(...page.videos.filter((video) => matchesSearchFilters(video, requestedKind)));
      token = page.nextPageToken;
      pageCount += 1;
      if (order === "viewCount" && viewValues[0] > 0 && page.videos.length && Math.max(...page.videos.map((video) => video.viewCount)) < viewValues[0]) token = void 0;
    } while (token && collected.length < 50 && pageCount < maxPages);
    return { videos: [...new Map(collected.map((video) => [video.id, video])).values()], nextPageToken: token, totalResults: total };
  };
  const search = async (requestedKind = kind) => {
    if (!apiKey) return setError(t("research.discover.apiRequired"));
    if (!query.trim()) return setError(t("research.discover.queryRequired"));
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const requestedAt = Date.now();
      setSavedQuery(query.trim());
      const publishedAfter = new Date(requestedAt - publishedHourRange[1] * 36e5).toISOString();
      const publishedBefore = publishedHourRange[0] > 0 ? new Date(requestedAt - publishedHourRange[0] * 36e5).toISOString() : void 0;
      const bounds = { after: publishedAfter, before: publishedBefore };
      setActivePublishedBounds(bounds);
      const page = await collectMatchingPages(requestedKind, void 0, bounds);
      setVideos(page.videos);
      setNextPageToken(page.nextPageToken);
      setTotalResults(page.totalResults);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("research.discover.loadFailed"));
    } finally {
      setLoading(false);
    }
  };
  const loadMore = async () => {
    if (!apiKey || !nextPageToken || loading) return;
    setLoading(true);
    setError("");
    try {
      const page = await collectMatchingPages(kind, nextPageToken, activePublishedBounds);
      setVideos((current) => [...new Map([...current, ...page.videos].map((video) => [video.id, video])).values()]);
      setNextPageToken(page.nextPageToken);
      setTotalResults(page.totalResults);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("research.discover.loadMoreFailed"));
    } finally {
      setLoading(false);
    }
  };
  const changeKind = (item) => {
    const rerun = hasSearched || videos.length > 0;
    setKind(item);
    invalidateSearch();
    if (rerun && query.trim()) void search(item);
  };
  const timeLabel = t("research.discover.hourRange", { from: publishedHourRange[0], to: publishedHourRange[1] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "hidden w-[250px] shrink-0 overflow-y-auto border-r border-border/60 bg-panel/40 p-4 xl:block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xs font-semibold", children: t("research.discover.filters") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: resetFilters, className: "ml-auto text-2xs text-primary", children: t("research.discover.reset") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("research.discover.contentType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 rounded-xl bg-muted/40 p-1", children: ["Long", "Shorts", "Live"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: loading, onClick: () => changeKind(item), className: `rounded-lg px-2 py-1.5 text-2xs font-medium disabled:opacity-50 ${kind === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`, children: item }, item)) })
        ] }),
        kind === "Long" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("research.discover.duration") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1", children: ["any", "short", "medium", "long"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: loading, onClick: () => {
            setDuration(item);
            invalidateSearch();
          }, className: `rounded-lg px-2 py-1.5 text-2xs font-medium disabled:opacity-50 ${duration === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`, children: t(item === "any" ? "research.discover.durationAny" : item === "short" ? "research.discover.durationShort" : item === "medium" ? "research.discover.durationMedium" : "research.discover.durationLong") }, item)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PublishedTimeRange, { maxDays: maxPublishedDays, hours: publishedHourRange, onMaxDaysChange: changeMaxPublishedDays, onHoursChange: changePublishedHours }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DualRange, { label: t("research.discover.views"), values: viewRange, onChange: (value) => {
          setViewRange(value);
          invalidateSearch();
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DualRange, { label: t("research.discover.subscribers"), values: subRange, onChange: (value) => {
          setSubRange(value);
          invalidateSearch();
        } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-2xs leading-4 text-muted-foreground", children: t("research.discover.serverFilterHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-xl border border-border/60 bg-card/50 p-3 text-2xs leading-4 text-muted-foreground", children: t("research.discover.vphHint") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "isolate min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 lg:px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-30 -mx-4 mb-5 border-b border-border/60 bg-background px-4 pb-3 pt-4 shadow-sm lg:-mx-5 lg:px-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (event) => {
          event.preventDefault();
          void search();
        }, className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[180px] flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("research.discover.queryPlaceholder"), className: "h-9 w-full rounded-lg border border-border/60 bg-card pl-10 pr-3 text-xs outline-none focus:border-primary" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: loading, children: [
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
            t("research.discover.search")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex shrink-0 items-center gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.discover.sort") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { "aria-label": t("research.discover.sort"), value: sortField, onChange: (event) => setSortField(event.target.value), className: "h-9 min-w-32 cursor-pointer appearance-none rounded-lg border border-border/60 bg-card pl-3 pr-8 text-xs font-semibold text-foreground outline-none focus:border-primary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "outlier", children: t("research.discover.sortOutlier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "views", children: t("research.discover.sortViews") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "subscribers", children: t("research.discover.sortSubscribers") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "published", children: t("research.discover.sortPublished") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "composite", children: t("research.discover.sortComposite") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", className: "shrink-0", onClick: () => setSortDir(sortDir === "desc" ? "asc" : "desc"), title: t(sortDir === "desc" ? "research.discover.sortDesc" : "research.discover.sortAsc"), children: [
            sortDir === "desc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: t(sortDir === "desc" ? "research.discover.sortDesc" : "research.discover.sortAsc") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 flex flex-wrap items-center gap-2 text-2xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1", children: [
            t("research.discover.type"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: kind })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-muted/50 px-2.5 py-1", children: [
            t("research.discover.time"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: timeLabel })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-muted/50 px-2.5 py-1", children: [
            "Views: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              formatMetricValue(viewValues[0]),
              "–",
              formatMetricValue(viewValues[1])
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-muted/50 px-2.5 py-1", children: [
            "Sub: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              formatMetricValue(subValues[0]),
              "–",
              formatMetricValue(subValues[1])
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: resetFilters, className: "font-medium text-primary", children: t("research.discover.clearAll") })
        ] }),
        sortField === "composite" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 rounded-xl border border-border/60 bg-card/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-semibold text-muted-foreground", children: t("research.discover.compositePresets") }),
            COMPOSITE_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setWeights(preset.weights), className: "rounded-full bg-muted/60 px-2.5 py-1 text-2xs font-medium hover:bg-primary/10 hover:text-primary", children: t(preset.labelKey) }, preset.key))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 grid gap-x-4 gap-y-2 sm:grid-cols-2", children: COMPOSITE_SIGNALS.map((signal) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex items-center gap-2 ${weights[signal] === 0 ? "opacity-45" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-20 shrink-0 text-2xs font-medium", children: t(COMPOSITE_SIGNAL_LABEL[signal]) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "range", min: 0, max: 100, step: 10, value: weights[signal], onChange: (event) => setWeights((current) => ({ ...current, [signal]: Number(event.target.value) })), className: "h-1 flex-1 accent-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "w-8 shrink-0 text-right text-2xs tabular-nums text-muted-foreground", children: [
              weights[signal],
              "%"
            ] })
          ] }, signal)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xs leading-3 text-muted-foreground", children: t("research.discover.compositeHint") })
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-1.5 text-2xs text-destructive", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
          error
        ] })
      ] }),
      !apiKey ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "mb-3 h-9 w-9 text-amber-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.common.noApi") })
      ] }) : loading && !videos.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-72 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-7 w-7 animate-spin text-primary" }) }) : videos.length && !results.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "mb-3 h-8 w-8 text-muted-foreground/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.discover.filteredEmpty", { count: videos.length }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: resetFilters, className: "mt-2 text-xs font-medium text-primary", children: t("research.discover.showAll") })
      ] }) : results.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center text-2xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.discover.resultCount", { shown: results.length, loaded: videos.length, total: formatViews(totalResults) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-x-3 gap-y-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5", children: results.map((video) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video, measured: Boolean(vphHistory[video.id]?.length), pinned: pinnedVideoIds.includes(video.id), onTogglePin: () => pinnedVideoIds.includes(video.id) ? unpinVideo(video.id) : pinVideo(video) }, video.id)) }),
        nextPageToken && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", className: "px-5", onClick: () => void loadMore(), disabled: loading, children: [
          loading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
          t("research.discover.loadMore")
        ] }) })
      ] }) : hasSearched ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mb-3 h-8 w-8 text-muted-foreground/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.discover.noResults", { query }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("research.discover.tryShorter") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mb-3 h-8 w-8 text-muted-foreground/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.discover.start") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("research.discover.pageHint") })
      ] })
    ] })
  ] });
}
function buildVideoState(rows) {
  const snapshots = {};
  const vphHistory = {};
  const grouped = /* @__PURE__ */ new Map();
  for (const row of rows) grouped.set(row.videoId, [...grouped.get(row.videoId) || [], row]);
  for (const [videoId, points] of grouped) {
    points.sort((left, right) => left.scannedAt - right.scannedAt);
    const latest = points[points.length - 1];
    if (latest) snapshots[videoId] = latest;
    vphHistory[videoId] = points.slice(1).map((point, index) => {
      const previous = points[index];
      const elapsedHours = (point.scannedAt - previous.scannedAt) / 36e5;
      const deltaViews = point.viewCount - previous.viewCount;
      return { previousScannedAt: previous.scannedAt, scannedAt: point.scannedAt, viewCount: point.viewCount, deltaViews, elapsedHours, vph: elapsedHours > 0 ? deltaViews / elapsedHours : 0 };
    }).filter((point) => point.elapsedHours > 0);
  }
  return { snapshots, vphHistory };
}
function buildChannelState(rows) {
  const channelSnapshots = {};
  const channelViewHistory = {};
  const grouped = /* @__PURE__ */ new Map();
  for (const row of rows) grouped.set(row.channelId, [...grouped.get(row.channelId) || [], row]);
  for (const [channelId, points] of grouped) {
    points.sort((left, right) => left.scannedAt - right.scannedAt);
    const latest = points[points.length - 1];
    if (latest) channelSnapshots[channelId] = latest;
    channelViewHistory[channelId] = points.slice(1).map((point, index) => {
      const previous = points[index];
      const elapsedHours = (point.scannedAt - previous.scannedAt) / 36e5;
      const deltaViews = point.viewCount - previous.viewCount;
      return { previousScannedAt: previous.scannedAt, scannedAt: point.scannedAt, viewCount: point.viewCount, deltaViews, elapsedHours, vph: elapsedHours > 0 ? deltaViews / elapsedHours : 0 };
    }).filter((point) => point.elapsedHours > 0);
  }
  return { channelSnapshots, channelViewHistory };
}
function refreshMeasuredChannelCache(now) {
  const state = useResearchStore.getState();
  state.setChannelCache(state.channelCache.map((channel) => ({
    ...channel,
    viewsLast48Hours: measuredChannelViewsInWindow(channel.id, 48, now),
    measurementCoverage48Hours: measuredCoverageInWindow(state.channelViewHistory[channel.id], 48, now),
    recentVideos: channel.recentVideos.map((video) => ({
      ...video,
      viewsLast48Hours: measuredViewsInWindow(video.id, 48, now),
      measurementCoverage48Hours: measuredCoverageInWindow(state.vphHistory[video.id], 48, now)
    }))
  })));
}
async function hydrateResearchDatabase() {
  const api = window.researchDatabase;
  if (!api) {
    useResearchStore.setState({ databaseHydrated: true });
    return;
  }
  const legacy = useResearchStore.getState();
  await api.migrateLegacy({
    snapshots: legacy.snapshots,
    vphHistory: legacy.vphHistory,
    channelSnapshots: legacy.channelSnapshots,
    channelViewHistory: legacy.channelViewHistory
  });
  const loaded = await api.load();
  const videoState = buildVideoState(loaded.videos);
  const channelState = buildChannelState(loaded.channels);
  useResearchStore.getState().hydrateScanHistory({ ...videoState, ...channelState, scanAudits: loaded.scans });
  const latestAt = Math.max(0, ...loaded.videos.map((row) => row.scannedAt), ...loaded.channels.map((row) => row.scannedAt));
  if (latestAt) useResearchStore.setState({ lastScanAt: latestAt });
  refreshMeasuredChannelCache(latestAt || Date.now());
}
async function persistSuccessfulResearchScan(payload) {
  return window.researchDatabase?.recordScan(payload);
}
async function persistFailedResearchScan(payload) {
  return window.researchDatabase?.recordFailure(payload);
}
async function runResearchScan(force = false, onlyChannelId) {
  const state = useResearchStore.getState();
  if (state.isScanning || !state.apiKey) return false;
  const now = Date.now();
  const targets = state.trackedChannels.map((input, index) => {
    const cachedChannel = state.channelCache[index];
    const config = {
      ...DEFAULT_CHANNEL_SCAN_CONFIG,
      ...state.channelScanConfigs[cachedChannel?.id || input]
    };
    const lastScannedAt = cachedChannel ? state.channelSnapshots[cachedChannel.id]?.scannedAt : void 0;
    return { input, cachedChannel, config, lastScannedAt };
  }).filter((target) => {
    if (onlyChannelId && target.cachedChannel?.id !== onlyChannelId) return false;
    if (force) return true;
    if (!target.config.autoScan) return false;
    return !target.lastScannedAt || now - target.lastScannedAt >= target.config.intervalMinutes * 6e4;
  });
  if (!targets.length) return false;
  state.setScanning(true);
  const startedAt = Date.now();
  try {
    const channels = [];
    for (const target of targets) {
      const customIds = target.config.videoScanMode === "custom" ? { [target.cachedChannel?.id || ""]: state.customScanVideoIdsByChannel[target.cachedChannel?.id || ""] || [] } : void 0;
      const [channel] = await loadTrackedChannels(
        state.apiKey,
        [target.input],
        target.config.videosPerChannel,
        customIds,
        { mode: target.config.videoScanMode, kind: target.config.videoKind }
      );
      if (channel) {
        channels.push(channel);
        useResearchStore.getState().setChannelScanConfig(channel.id, target.config);
      }
    }
    const allVideos = channels.flatMap((channel) => channel.recentVideos);
    const uniqueVideos = [...new Map(allVideos.map((video) => [video.id, video])).values()];
    const scannedAt = Date.now();
    const persisted = await persistSuccessfulResearchScan({ startedAt, finishedAt: scannedAt, scope: "channels", videos: uniqueVideos, channels });
    if (persisted) useResearchStore.setState((current) => ({ scanAudits: [{ id: persisted.scanId, startedAt, finishedAt: scannedAt, scope: "channels", status: "success", channelCount: channels.length, videoCount: uniqueVideos.length }, ...current.scanAudits].slice(0, 100) }));
    useResearchStore.getState().recordScan(uniqueVideos, scannedAt);
    if (channels.length) useResearchStore.getState().recordChannelScan(channels, scannedAt);
    if (channels.length) {
      const measuredChannels = channels.map((channel) => {
        const recentVideos = channel.recentVideos.map((video) => ({
          ...video,
          viewsPerHour: latestMeasuredVph(video.id) ?? 0,
          viewsLast48Hours: measuredViewsInWindow(video.id, 48, scannedAt),
          measurementCoverage48Hours: measuredCoverageInWindow(useResearchStore.getState().vphHistory[video.id], 48, scannedAt)
        }));
        return {
          ...channel,
          recentVideos,
          recentVelocity: recentVideos.reduce((sum, video) => sum + video.viewsPerHour, 0),
          viewsLast48Hours: measuredChannelViewsInWindow(channel.id, 48, scannedAt),
          measurementCoverage48Hours: measuredCoverageInWindow(useResearchStore.getState().channelViewHistory[channel.id], 48, scannedAt)
        };
      });
      const existingChannels = useResearchStore.getState().channelCache;
      const measuredById = new Map(measuredChannels.map((channel) => [channel.id, channel]));
      const mergedChannels = existingChannels.map((channel) => measuredById.get(channel.id) || channel);
      const existingIds = new Set(existingChannels.map((channel) => channel.id));
      mergedChannels.push(...measuredChannels.filter((channel) => !existingIds.has(channel.id)));
      useResearchStore.getState().setChannelCache(mergedChannels);
    }
    useResearchStore.getState().finishScan(scannedAt);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : translate(useUIPreferencesStore.getState().uiLanguage, "research.api.scanFailed");
    const failedAt = Date.now();
    const persisted = await persistFailedResearchScan({ startedAt, finishedAt: failedAt, scope: "channels", error: message }).catch(() => void 0);
    if (persisted) useResearchStore.setState((current) => ({ scanAudits: [{ id: persisted.scanId, startedAt, finishedAt: failedAt, scope: "channels", status: "failed", channelCount: 0, videoCount: 0, error: message }, ...current.scanAudits].slice(0, 100) }));
    useResearchStore.getState().finishScan(state.lastScanAt || 0, message);
    throw error;
  }
}
const EMPTY_HISTORY = [];
function buildHourlyViewBars(history) {
  const hourMs = 36e5;
  if (!history.length) return Array.from({ length: 48 }).fill(null);
  const observations = [{
    scannedAt: history[0].previousScannedAt ?? history[0].scannedAt - history[0].elapsedHours * hourMs,
    viewCount: history[0].viewCount - history[0].deltaViews
  }, ...history.map((point) => ({ scannedAt: point.scannedAt, viewCount: point.viewCount }))];
  const bars = [];
  let endIndex = observations.length - 1;
  while (bars.length < 48 && endIndex > 0) {
    const end = observations[endIndex];
    let startIndex = endIndex - 1;
    while (startIndex > 0 && end.scannedAt - observations[startIndex].scannedAt < hourMs) startIndex -= 1;
    const candidates = [startIndex, startIndex + 1].filter((index) => index >= 0 && index < endIndex);
    const bestIndex = candidates.reduce((best, index) => Math.abs(end.scannedAt - observations[index].scannedAt - hourMs) < Math.abs(end.scannedAt - observations[best].scannedAt - hourMs) ? index : best, candidates[0]);
    const start = observations[bestIndex];
    const durationMs = end.scannedAt - start.scannedAt;
    const views = end.viewCount - start.viewCount;
    bars.push(durationMs > 0 && durationMs <= hourMs * 1.5 ? { views, durationMinutes: Math.round(durationMs / 6e4), heightValue: views / (durationMs / hourMs) } : null);
    endIndex = bestIndex;
  }
  while (bars.length < 48) bars.push(null);
  const result = bars.reverse();
  if (result.some(Boolean)) return result;
  const observed = history.slice(-48).map((point) => ({
    views: point.deltaViews,
    durationMinutes: Math.round(point.elapsedHours * 60),
    heightValue: point.elapsedHours > 0 ? point.deltaViews / point.elapsedHours : 0
  }));
  return [...Array.from({ length: 48 - observed.length }).fill(null), ...observed];
}
function HistoryChart({ history }) {
  const { language, t } = useI18n();
  const bars = reactExports.useMemo(() => buildHourlyViewBars(history), [history]);
  const maxValue = Math.max(...bars.map((bar) => Math.max(0, bar?.heightValue ?? 0)), 1);
  const lastIndex = bars.reduce((latest, bar, index) => bar == null ? latest : index, -1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-14 border-b border-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-end gap-[2px]", children: bars.map((bar, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        title: bar ? t("research.monitor.measuredInterval", {
          count: bar.views.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
          minutes: bar.durationMinutes
        }) : t("research.monitor.missingInterval"),
        className: `min-w-0 flex-1 rounded-t-[2px] transition-colors ${bar == null ? "bg-transparent" : index === lastIndex ? "bg-primary" : "bg-primary/20 hover:bg-primary/45"}`,
        style: { height: bar == null ? 0 : `${Math.max(3, Math.round(Math.max(0, bar.heightValue) / maxValue * 52))}px` }
      },
      index
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex justify-between text-2xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.hours48Ago") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.now") })
    ] })
  ] });
}
function latestPoint(history) {
  return history[history.length - 1];
}
function ChannelCard({
  channel,
  config,
  customVideoIds,
  loading,
  onOpenSettings,
  onScanNow,
  onOpenVideo,
  onRemove
}) {
  const { language, t } = useI18n();
  const customMode = config.videoScanMode === "custom";
  const [visibleVideoCount, setVisibleVideoCount] = reactExports.useState(10);
  const channelHistory = useResearchStore((state) => state.channelViewHistory[channel.id]) || EMPTY_HISTORY;
  const videoHistory = useResearchStore((state) => state.vphHistory);
  const channelLatest = latestPoint(channelHistory);
  const sortedVideos = reactExports.useMemo(
    () => channel.recentVideos.filter((video) => !customMode || customVideoIds.includes(video.id)).sort((left, right) => {
      const leftVph = latestPoint(videoHistory[left.id] || EMPTY_HISTORY)?.vph ?? -1;
      const rightVph = latestPoint(videoHistory[right.id] || EMPTY_HISTORY)?.vph ?? -1;
      return rightVph - leftVph;
    }),
    [channel.recentVideos, customMode, customVideoIds, videoHistory]
  );
  const visibleVideos = sortedVideos.slice(0, visibleVideoCount);
  const remaining = Math.max(0, sortedVideos.length - visibleVideos.length);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center gap-3 border-b border-border/60 px-4 py-3", children: [
      channel.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: channel.thumbnailUrl, alt: "", className: "h-10 w-10 shrink-0 rounded-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `https://www.youtube.com/channel/${channel.id}`, target: "_blank", rel: "noopener noreferrer", className: "flex min-w-0 items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "max-w-[150px] shrink-0 truncate text-xs font-semibold hover:text-primary", children: channel.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate text-2xs text-muted-foreground", children: channel.handle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3 shrink-0 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: [
          formatViews(channel.subscriberCount),
          " ",
          t("research.common.subscribers"),
          " · ",
          formatViews(channel.videoCount),
          " ",
          t("research.common.videos")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex shrink-0 items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "whitespace-nowrap", disabled: loading, onClick: onScanNow, title: t("research.monitor.scanNow"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "animate-spin" : ""}` }),
          t("research.monitor.scanNow")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "whitespace-nowrap", onClick: onOpenSettings, title: t("research.monitor.channelSettings"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-3.5 w-3.5" }),
          t("research.monitor.channelSettings")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon-sm", className: "text-muted-foreground hover:text-destructive", onClick: onRemove, title: t("research.monitor.remove"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-px bg-border/40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card px-3.5 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.publicViews") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold", children: formatViews(channel.viewCount) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "bg-card px-3.5 py-2.5",
          title: channelLatest ? t("research.monitor.measuredInterval", {
            count: channelLatest.deltaViews.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
            minutes: Math.round(channelLatest.elapsedHours * 60)
          }) : t("research.monitor.measureHint"),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.latestDelta") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold text-emerald-500", children: channelLatest ? formatViews(channelLatest.deltaViews) : "—" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card px-3.5 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.views48h") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold", children: channel.viewsLast48Hours == null ? "—" : formatViews(channel.viewsLast48Hours) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border/60 px-4 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryChart, { history: channelHistory }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1.5 grid grid-cols-[minmax(0,1fr)_84px_96px_72px] gap-2 px-1 text-2xs font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.video") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: t("research.monitor.totalViews") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: t("research.monitor.latestDelta") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: "48H" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        visibleVideos.map((video) => {
          const history = videoHistory[video.id] || EMPTY_HISTORY;
          const point = latestPoint(history);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => onOpenVideo(video),
              className: "grid w-full grid-cols-[minmax(0,1fr)_84px_96px_72px] items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-muted/40",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                  video.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: video.thumbnailUrl, alt: "", className: "h-8 w-12 shrink-0 rounded object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-8 w-12 shrink-0 rounded bg-muted" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-2xs font-medium", children: video.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-2xs text-muted-foreground", children: formatAge(video.publishedAt, language) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right text-xs", children: formatViews(video.viewCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: "text-right text-xs font-semibold text-emerald-500",
                    title: point ? t("research.monitor.measuredInterval", {
                      count: point.deltaViews.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
                      minutes: Math.round(point.elapsedHours * 60)
                    }) : t("research.monitor.measureHint"),
                    children: point ? formatViews(point.deltaViews) : "—"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right text-xs", children: video.viewsLast48Hours == null ? "—" : formatViews(video.viewsLast48Hours) })
              ]
            },
            video.id
          );
        }),
        !visibleVideos.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-2xs text-muted-foreground", children: customMode ? t("research.monitor.chooseVideosHint") : t("research.monitor.noPublicVideos") })
      ] }),
      remaining > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "mt-2 w-full text-muted-foreground", onClick: () => setVisibleVideoCount((count) => count + 10), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5" }),
        t("research.monitor.showMoreVideos", { count: Math.min(10, remaining) })
      ] }),
      visibleVideoCount > 10 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "ghost", size: "xs", className: "mt-1 w-full text-muted-foreground", onClick: () => setVisibleVideoCount(10), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3.5 w-3.5" }),
        t("research.monitor.collapseVideos")
      ] })
    ] })
  ] });
}
function MonitorView() {
  const { language, locale, t } = useI18n();
  const apiKey = useResearchStore((state) => state.apiKey);
  const trackedChannels = useResearchStore((state) => state.trackedChannels);
  const channels = useResearchStore((state) => state.channelCache);
  const loading = useResearchStore((state) => state.isScanning);
  const error = useResearchStore((state) => state.lastScanError);
  const lastScanAt = useResearchStore((state) => state.lastScanAt);
  const channelScanConfigs = useResearchStore((state) => state.channelScanConfigs);
  const customIds = useResearchStore((state) => state.customScanVideoIdsByChannel);
  const channelHistory = useResearchStore((state) => state.channelViewHistory);
  const videoHistory = useResearchStore((state) => state.vphHistory);
  const setTrackedChannels = useResearchStore((state) => state.setTrackedChannels);
  const setChannelCache = useResearchStore((state) => state.setChannelCache);
  const setChannelScanConfig = useResearchStore((state) => state.setChannelScanConfig);
  const setCustomScanVideoIds = useResearchStore((state) => state.setCustomScanVideoIds);
  const [addOpen, setAddOpen] = reactExports.useState(false);
  const [addConfig, setAddConfig] = reactExports.useState(DEFAULT_CHANNEL_SCAN_CONFIG);
  const [settingsChannel, setSettingsChannel] = reactExports.useState(null);
  const [draftConfig, setDraftConfig] = reactExports.useState(DEFAULT_CHANNEL_SCAN_CONFIG);
  const [channelInput, setChannelInput] = reactExports.useState("");
  const [selectedVideo, setSelectedVideo] = reactExports.useState(null);
  const [catalogChannel, setCatalogChannel] = reactExports.useState(null);
  const [catalogLoading, setCatalogLoading] = reactExports.useState(false);
  const [catalogSearch, setCatalogSearch] = reactExports.useState("");
  const [draftCustomIds, setDraftCustomIds] = reactExports.useState([]);
  const totalViews = reactExports.useMemo(() => channels.reduce((sum, channel) => sum + channel.viewCount, 0), [channels]);
  const totalViews48h = reactExports.useMemo(() => channels.reduce((sum, channel) => sum + (channel.viewsLast48Hours ?? 0), 0), [channels]);
  const totalLatestDelta = reactExports.useMemo(() => channels.reduce((sum, channel) => {
    const point = latestPoint(channelHistory[channel.id] || EMPTY_HISTORY);
    return sum + (point?.deltaViews ?? 0);
  }, 0), [channelHistory, channels]);
  const addChannel = () => {
    const value = channelInput.trim();
    if (!value || trackedChannels.includes(value)) return;
    setChannelScanConfig(value, addConfig);
    setTrackedChannels([...trackedChannels, value]);
    setChannelInput("");
    setAddOpen(false);
    if (apiKey) void runResearchScan(true).catch(() => void 0);
  };
  const removeChannel = (index) => {
    setTrackedChannels(trackedChannels.filter((_, itemIndex) => itemIndex !== index));
    setChannelCache(channels.filter((_, itemIndex) => itemIndex !== index));
  };
  const openChannelSettings = (channel) => {
    setDraftConfig({ ...DEFAULT_CHANNEL_SCAN_CONFIG, ...channelScanConfigs[channel.id] });
    setSettingsChannel(channel);
  };
  const saveChannelSettings = () => {
    if (!settingsChannel) return;
    setChannelScanConfig(settingsChannel.id, draftConfig);
    setSettingsChannel(null);
  };
  const openCustomPicker = async (channel, index) => {
    setCatalogChannel(channel);
    setDraftCustomIds(customIds[channel.id] || []);
    setCatalogSearch("");
    setCatalogLoading(true);
    try {
      const catalog = await loadChannelVideoCatalog(apiKey, trackedChannels[index]);
      if (catalog) setCatalogChannel(catalog);
    } finally {
      setCatalogLoading(false);
    }
  };
  const filteredCatalogVideos = reactExports.useMemo(() => {
    const query = catalogSearch.trim().toLocaleLowerCase();
    const videos = catalogChannel?.recentVideos || [];
    return query ? videos.filter((video) => video.title.toLocaleLowerCase().includes(query)) : videos;
  }, [catalogChannel, catalogSearch]);
  const saveCustomSelection = () => {
    if (!catalogChannel) return;
    setCustomScanVideoIds(catalogChannel.id, draftCustomIds);
    const channelId = catalogChannel.id;
    setCatalogChannel(null);
    void runResearchScan(true, channelId).catch(() => void 0);
  };
  const selectedHistory = selectedVideo ? videoHistory[selectedVideo.id] || EMPTY_HISTORY : EMPTY_HISTORY;
  const selectedLatest = latestPoint(selectedHistory);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full overflow-y-auto p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: t("research.monitor.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: lastScanAt ? t("research.monitor.latestSnapshot", { time: new Date(lastScanAt).toLocaleString(locale) }) : t("research.monitor.needTwoScans") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: () => setAddOpen(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
        t("research.monitor.addChannel")
      ] }) })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-2xs text-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      error
    ] }),
    !apiKey ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "mb-3 h-9 w-9 text-amber-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.common.noApi") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("research.monitor.noApiHint") })
    ] }) : !trackedChannels.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-72 flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "mb-3 h-9 w-9 text-muted-foreground/60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.monitor.empty") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("research.monitor.emptyHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", className: "mt-4", onClick: () => setAddOpen(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
        t("research.monitor.addChannel")
      ] })
    ] }) : loading && !channels.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-72 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-7 w-7 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.scannedChannels") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold", children: channels.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.publicViews") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold", children: formatViews(totalViews) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.latestDelta") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold text-emerald-500", children: formatViews(totalLatestDelta) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("research.monitor.views48h") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-base font-bold", children: formatViews(totalViews48h) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 items-start gap-4 lg:grid-cols-3", children: channels.map((channel, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ChannelCard,
        {
          channel,
          config: channelScanConfigs[channel.id] || DEFAULT_CHANNEL_SCAN_CONFIG,
          customVideoIds: customIds[channel.id] || [],
          loading,
          onOpenSettings: () => openChannelSettings(channel),
          onScanNow: () => void runResearchScan(true, channel.id).catch(() => void 0),
          onOpenVideo: setSelectedVideo,
          onRemove: () => removeChannel(index)
        },
        channel.id
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: addOpen, onOpenChange: setAddOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-base", children: t("research.monitor.dialogTitle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-2xs", children: t("research.monitor.dialogDescription") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { autoFocus: true, value: channelInput, onChange: (event) => setChannelInput(event.target.value), onKeyDown: (event) => {
        if (event.key === "Enter") addChannel();
      }, placeholder: "@handle or https://youtube.com/@handle", className: "h-11 rounded-xl border border-border/60 bg-background px-3 text-2xs outline-none focus:border-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 rounded-xl border border-border/60 bg-muted/15 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("research.monitor.scanRange") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setAddConfig((config) => ({ ...config, videoScanMode: "all" })), className: `h-9 rounded-lg border px-3 text-xs font-medium ${addConfig.videoScanMode === "all" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`, children: t("research.monitor.allChannelVideos") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setAddConfig((config) => ({ ...config, videoScanMode: "latest" })), className: `h-9 rounded-lg border px-3 text-xs font-medium ${addConfig.videoScanMode === "latest" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`, children: t("research.monitor.latestVideos") })
          ] }),
          addConfig.videoScanMode === "latest" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-2 flex h-9 items-center justify-between rounded-lg border border-border/60 bg-background px-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.latestVideoCount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, value: addConfig.videosPerChannel, onChange: (event) => setAddConfig((config) => ({ ...config, videosPerChannel: Math.max(1, Math.floor(Number(event.target.value) || 1)) })), className: "w-20 bg-transparent text-right font-semibold outline-none" })
          ] }),
          addConfig.videoScanMode === "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-2xs text-amber-600", children: t("research.monitor.allVideosQuotaHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-xs font-semibold", children: t("research.monitor.videoType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["all", "long", "shorts"].map((kind) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setAddConfig((config) => ({ ...config, videoKind: kind })), className: `h-9 rounded-lg border px-2 text-xs font-medium ${addConfig.videoKind === kind ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`, children: t(kind === "all" ? "research.monitor.allVideoTypes" : kind === "long" ? "research.monitor.longVideos" : "research.monitor.shorts") }, kind)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setAddOpen(false), children: t("research.common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: addChannel, disabled: !channelInput.trim(), children: t("research.monitor.addAndScan") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(settingsChannel), onOpenChange: (open) => {
      if (!open) setSettingsChannel(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-base", children: t("research.monitor.channelSettingsTitle", { channel: settingsChannel?.title || "" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-2xs", children: t("research.monitor.channelSettingsDescription") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-2xs font-semibold", children: t("research.monitor.interval") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: draftConfig.intervalMinutes,
              onChange: (event) => setDraftConfig((config) => ({ ...config, intervalMinutes: Number(event.target.value) })),
              className: "h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-2xs",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 30, children: t("research.monitor.minutes", { count: 30 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 60, children: t("research.monitor.hours", { count: 1 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 180, children: t("research.monitor.hours", { count: 3 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 360, children: t("research.monitor.hours", { count: 6 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 720, children: t("research.monitor.hours", { count: 12 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 1440, children: t("research.monitor.hours", { count: 24 }) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-2xs font-semibold", children: t("research.monitor.videoScanMode") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDraftConfig((config) => ({ ...config, videoScanMode: "all" })), className: `h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "all" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`, children: t("research.monitor.allChannelVideos") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDraftConfig((config) => ({ ...config, videoScanMode: "latest" })), className: `h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "latest" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`, children: t("research.monitor.latestVideos") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDraftConfig((config) => ({ ...config, videoScanMode: "custom" })), className: `h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`, children: "Custom" })
          ] }),
          draftConfig.videoScanMode === "latest" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-2 flex h-10 items-center justify-between rounded-xl border border-border/60 bg-background px-3 text-2xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.videosPerEachChannel") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: draftConfig.videosPerChannel,
                onChange: (event) => setDraftConfig((config) => ({ ...config, videosPerChannel: Math.max(1, Math.floor(Number(event.target.value) || 1)) })),
                className: "w-20 bg-transparent text-right font-semibold outline-none"
              }
            )
          ] }),
          draftConfig.videoScanMode === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                if (!settingsChannel) return;
                const channel = settingsChannel;
                const index = channels.findIndex((item) => item.id === channel.id);
                setChannelScanConfig(channel.id, draftConfig);
                setSettingsChannel(null);
                if (index >= 0) void openCustomPicker(channel, index);
              },
              className: "mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-border/60 text-2xs font-medium hover:bg-muted/40",
              children: [
                t("research.monitor.chooseVideos"),
                " (",
                settingsChannel ? (customIds[settingsChannel.id] || []).length : 0,
                ")"
              ]
            }
          ),
          draftConfig.videoScanMode === "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-2xs text-amber-600", children: t("research.monitor.allVideosQuotaHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-2xs font-semibold", children: t("research.monitor.videoType") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: ["all", "long", "shorts"].map((kind) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setDraftConfig((config) => ({ ...config, videoKind: kind })), className: `h-10 rounded-xl border px-2 text-2xs font-medium ${draftConfig.videoKind === kind ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`, children: t(kind === "all" ? "research.monitor.allVideoTypes" : kind === "long" ? "research.monitor.longVideos" : "research.monitor.shorts") }, kind)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex h-10 items-center justify-between rounded-xl border border-border/60 bg-background px-3 text-2xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("research.monitor.autoScan") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: draftConfig.autoScan, onChange: (event) => setDraftConfig((config) => ({ ...config, autoScan: event.target.checked })), className: "h-4 w-4 accent-primary" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setSettingsChannel(null), children: t("research.common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveChannelSettings, children: t("research.common.save") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(catalogChannel), onOpenChange: (open) => {
      if (!open) setCatalogChannel(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "flex max-h-[82vh] max-w-2xl flex-col rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-base", children: t("research.monitor.chooseChannelVideos", { channel: catalogChannel?.title || "" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-2xs", children: t("research.monitor.chooseChannelVideosDescription") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex h-10 items-center gap-2 rounded-xl border border-border/60 px-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: catalogSearch, onChange: (event) => setCatalogSearch(event.target.value), placeholder: t("research.monitor.searchVideos"), className: "min-w-0 flex-1 bg-transparent text-xs outline-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-48 flex-1 overflow-y-auto rounded-xl border border-border/60 p-2", children: catalogLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-48 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : filteredCatalogVideos.map((video) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            checked: draftCustomIds.includes(video.id),
            onChange: (event) => setDraftCustomIds((ids) => event.target.checked ? [...ids, video.id] : ids.filter((id) => id !== video.id)),
            className: "h-4 w-4 accent-primary"
          }
        ),
        video.thumbnailUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: video.thumbnailUrl, alt: "", className: "h-10 w-16 rounded object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-10 w-16 rounded bg-muted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs font-medium", children: video.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
            formatAge(video.publishedAt, language),
            " · ",
            formatViews(video.viewCount),
            " views"
          ] })
        ] })
      ] }, video.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-auto self-center text-2xs text-muted-foreground", children: t("research.monitor.selectedVideosCount", { count: draftCustomIds.length }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => setCatalogChannel(null), children: t("research.common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", onClick: saveCustomSelection, children: t("research.common.save") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: Boolean(selectedVideo), onOpenChange: (open) => {
      if (!open) setSelectedVideo(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl rounded-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "pr-8 text-base", children: selectedVideo?.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-2xs", children: t("research.monitor.videoDetailDescription") })
      ] }),
      selectedVideo && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("research.monitor.totalViews") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold", children: formatViews(selectedVideo.viewCount) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-muted/30 p-3", title: selectedLatest ? t("research.monitor.measuredInterval", { count: selectedLatest.deltaViews, minutes: Math.round(selectedLatest.elapsedHours * 60) }) : void 0, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("research.monitor.latestDelta") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold text-emerald-500", children: selectedLatest ? formatViews(selectedLatest.deltaViews) : "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("research.monitor.views48h") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold", children: selectedVideo.viewsLast48Hours == null ? "—" : formatViews(selectedVideo.viewsLast48Hours) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryChart, { history: selectedHistory }),
          !selectedHistory.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-center text-2xs text-amber-500", children: t("research.monitor.measureHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `https://www.youtube.com/watch?v=${selectedVideo.id}`, target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-1.5 text-2xs font-medium text-primary hover:underline", children: [
          t("research.monitor.openOnYouTube"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
        ] })
      ] })
    ] }) })
  ] });
}
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function downloadCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function safeFilename(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "youtube";
}
function commentsCsvRows(comments, videos, headers, replyLabel, commentLabel) {
  const videoMap = new Map(videos.map((video) => [video.id, video]));
  return [
    headers,
    ...comments.map((comment) => {
      const video = videoMap.get(comment.videoId);
      return [video?.title, `https://www.youtube.com/watch?v=${comment.videoId}`, video?.description, video?.tags?.join(" | "), comment.author, comment.isReply ? replyLabel : commentLabel, comment.publishedAt, comment.likeCount, comment.text];
    })
  ];
}
function CommentList({ comments, videos }) {
  const { language, locale, t } = useI18n();
  const [query, setQuery] = reactExports.useState("");
  const [sort, setSort] = reactExports.useState("youtube");
  const videoMap = reactExports.useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const threads = reactExports.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    const parents = comments.filter((comment) => !comment.isReply);
    const repliesByParent = /* @__PURE__ */ new Map();
    comments.filter((comment) => comment.isReply).forEach((reply) => {
      if (!reply.parentId) return;
      repliesByParent.set(reply.parentId, [...repliesByParent.get(reply.parentId) || [], reply]);
    });
    return parents.map((parent, originalIndex) => ({ parent, replies: repliesByParent.get(parent.id) || [], originalIndex })).filter(({ parent, replies }) => !normalized || [parent, ...replies].some((comment) => `${comment.author} ${comment.text} ${videoMap.get(comment.videoId)?.title || ""}`.toLocaleLowerCase("vi").includes(normalized))).sort((a, b) => sort === "youtube" ? a.originalIndex - b.originalIndex : sort === "likes" ? b.parent.likeCount - a.parent.likeCount : sort === "newest" ? Date.parse(b.parent.publishedAt) - Date.parse(a.parent.publishedAt) : Date.parse(a.parent.publishedAt) - Date.parse(b.parent.publishedAt));
  }, [comments, query, sort, videoMap]);
  const visibleCount = threads.reduce((total, thread) => total + 1 + thread.replies.length, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-border/60 bg-card/70", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 border-b border-border/60 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background px-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-3.5 w-3.5 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("research.comments.filterPlaceholder"), className: "min-w-0 flex-1 bg-transparent text-xs outline-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: sort, onChange: (event) => setSort(event.target.value), className: "h-9 rounded-xl border border-border/60 bg-background px-3 text-2xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "youtube", children: t("research.comments.youtubeOrder") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "likes", children: t("research.comments.mostLiked") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "newest", children: t("research.comments.newest") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "oldest", children: t("research.comments.oldest") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-muted-foreground", children: [
        visibleCount.toLocaleString(locale),
        " / ",
        comments.length.toLocaleString(locale)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[460px] divide-y divide-border/40 overflow-y-auto", children: [
      threads.slice(0, 200).map(({ parent, replies }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted", children: parent.authorAvatarUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: parent.authorAvatarUrl, alt: "", className: "h-full w-full object-cover" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-2 gap-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-semibold", children: parent.author }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: formatAge(parent.publishedAt, language) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-primary", children: [
                "♥ ",
                formatViews(parent.likeCount)
              ] })
            ] }),
            videos.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-2xs text-muted-foreground", children: videoMap.get(parent.videoId)?.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 whitespace-pre-wrap text-2xs leading-relaxed", children: parent.text })
          ] })
        ] }),
        replies.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-11 mt-2 space-y-2 border-l border-border/60 pl-3", children: replies.map((reply) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2.5 py-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted", children: reply.authorAvatarUrl && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: reply.authorAvatarUrl, alt: "", className: "h-full w-full object-cover" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs font-semibold", children: reply.author }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xs text-muted-foreground", children: formatAge(reply.publishedAt, language) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xs text-primary", children: [
                "♥ ",
                formatViews(reply.likeCount)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 whitespace-pre-wrap text-2xs leading-relaxed", children: reply.text })
          ] })
        ] }, reply.id)) })
      ] }, parent.id)),
      !threads.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-8 text-center text-xs text-muted-foreground", children: t("research.comments.noMatch") }),
      threads.length > 200 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-3 text-center text-2xs text-muted-foreground", children: t("research.comments.displayLimit") })
    ] })
  ] });
}
function CommentsView() {
  const { language, locale, t } = useI18n();
  const apiKey = useResearchStore((state) => state.apiKey);
  const [mode, setMode] = reactExports.useState("video");
  const [input, setInput] = reactExports.useState("");
  const [video, setVideo] = reactExports.useState(null);
  const [channel, setChannel] = reactExports.useState(null);
  const [videos, setVideos] = reactExports.useState([]);
  const [comments, setComments] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [message, setMessage] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const [channelLimit, setChannelLimit] = reactExports.useState(10);
  const resetResult = () => {
    setVideo(null);
    setChannel(null);
    setVideos([]);
    setComments([]);
    setError("");
    setMessage("");
  };
  const switchMode = (next) => {
    setMode(next);
    setInput("");
    resetResult();
  };
  const analyzeVideo = async () => {
    if (!apiKey) return;
    const id = extractYouTubeVideoId(input);
    if (!id) {
      setError(t("research.comments.videoInvalid"));
      return;
    }
    setLoading(true);
    resetResult();
    setMessage(t("research.comments.loadingVideo"));
    try {
      const found = (await loadYouTubeVideosByIds(apiKey, [id]))[0];
      if (!found) throw new Error(t("research.comments.videoNotFound"));
      setVideo(found);
      setVideos([found]);
      setMessage(t("research.comments.loadingComments"));
      const loaded = await loadAllVideoComments(apiKey, id, (count) => setMessage(t("research.comments.loadedComments", { count: count.toLocaleString(locale) })));
      setComments(loaded);
      setMessage(t("research.comments.done", { count: loaded.length.toLocaleString(locale) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("research.comments.videoFailed"));
      setMessage("");
    } finally {
      setLoading(false);
    }
  };
  const loadChannel = async () => {
    if (!apiKey || !input.trim()) return;
    setLoading(true);
    resetResult();
    setMessage(t("research.comments.loadingChannel"));
    try {
      const result = await loadCommentChannelVideos(apiKey, input, (count) => setMessage(t("research.comments.foundVideos", { count: count.toLocaleString(locale) })));
      setChannel(result.channel);
      setVideos(result.videos);
      setMessage(t("research.comments.channelReady", { count: result.videos.length.toLocaleString(locale) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("research.comments.channelFailed"));
      setMessage("");
    } finally {
      setLoading(false);
    }
  };
  const fetchChannelComments = async () => {
    const targets = videos.slice(0, channelLimit === 0 ? videos.length : channelLimit).filter((item) => item.commentCount > 0);
    if (!targets.length) return;
    setLoading(true);
    setError("");
    setComments([]);
    const collected = [];
    try {
      for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        setMessage(t("research.comments.processing", { current: index + 1, total: targets.length, title: target.title }));
        try {
          collected.push(...await loadAllVideoComments(apiKey, target.id));
        } catch (cause) {
          if (cause instanceof Error && !/tắt bình luận|comments are disabled/i.test(cause.message)) throw cause;
        }
        setComments([...collected]);
      }
      setMessage(t("research.comments.channelDone", { comments: collected.length.toLocaleString(locale), videos: targets.length }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("research.comments.allFailed"));
    } finally {
      setLoading(false);
    }
  };
  const exportComments = () => {
    if (!comments.length) return;
    downloadCsv(`${safeFilename(video?.title || channel?.title || "youtube")}_comments.csv`, commentsCsvRows(comments, videos, [t("research.comments.csvVideo"), t("research.comments.csvVideoUrl"), t("research.comments.csvDescription"), "Tags", t("research.comments.csvAuthor"), t("research.comments.csvType"), t("research.comments.csvPublished"), t("research.common.likes"), t("research.comments.csvComment")], t("research.comments.csvReply"), t("research.comments.csvComment")));
  };
  const exportMetadata = () => {
    if (!videos.length) return;
    downloadCsv(`${safeFilename(channel?.title || "youtube")}_videos.csv`, [[t("research.comments.csvTitle"), "URL", t("research.comments.csvPublished"), t("research.common.views"), t("research.common.likes"), t("research.common.comments"), t("research.comments.csvDescription"), "Tags"], ...videos.map((item) => [item.title, `https://www.youtube.com/watch?v=${item.id}`, item.publishedAt, item.viewCount, item.likeCount, item.commentCount, item.description, item.tags?.join(" | ")])]);
  };
  if (!apiKey) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-0 flex-1 flex-col items-center justify-center text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "mb-3 h-9 w-9 text-amber-500" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: t("research.common.noApi") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: t("research.comments.noApiHint") })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5 lg:px-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 inline-flex rounded-xl bg-muted/50 p-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => switchMode("video"), className: `h-8 rounded-lg px-4 text-xs font-semibold ${mode === "video" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`, children: t("research.comments.single") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => switchMode("channel"), className: `h-8 rounded-lg px-4 text-xs font-semibold ${mode === "channel" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`, children: t("research.comments.channel") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: t(mode === "video" ? "research.comments.singleTitle" : "research.comments.channelTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: t(mode === "video" ? "research.comments.singleHint" : "research.comments.channelHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: input, onChange: (event) => setInput(event.target.value), onKeyDown: (event) => {
          if (event.key === "Enter" && !loading) void (mode === "video" ? analyzeVideo() : loadChannel());
        }, placeholder: mode === "video" ? "https://youtube.com/watch?v=..." : "https://youtube.com/@handle", className: "h-10 min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: loading || !input.trim(), onClick: () => void (mode === "video" ? analyzeVideo() : loadChannel()), className: "flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50", children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4" }),
          t(mode === "video" ? "research.comments.analyze" : "research.comments.loadChannel")
        ] })
      ] }),
      message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-2xs text-primary", children: message }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 flex items-center gap-1.5 text-2xs text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
        error
      ] })
    ] }),
    video && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-4 sm:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: video.thumbnailUrl, alt: "", className: "aspect-video w-full rounded-xl object-cover sm:w-64" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: video.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-2xs text-muted-foreground", children: [
          video.channelTitle,
          " · ",
          formatAge(video.publishedAt, language)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-2 text-2xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-lg bg-muted/60 px-2.5 py-1.5", children: [
            formatViews(video.viewCount),
            " ",
            t("research.common.views")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-lg bg-muted/60 px-2.5 py-1.5", children: [
            formatViews(video.likeCount),
            " ",
            t("research.common.likes")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-lg bg-muted/60 px-2.5 py-1.5", children: t("research.comments.publicComments", { count: formatViews(video.commentCount) }) })
        ] }),
        comments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: exportComments, className: "mt-4 flex h-9 items-center gap-2 rounded-xl border border-primary/40 px-3 text-2xs font-semibold text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
          t("research.comments.exportFull")
        ] })
      ] })
    ] }),
    channel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-border/60 bg-card/70 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: channel.thumbnailUrl, alt: "", className: "h-12 w-12 rounded-full object-cover" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold", children: channel.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs text-muted-foreground", children: t("research.comments.loadedVideoCount", { subscribers: formatViews(channel.subscriberCount), videos: videos.length.toLocaleString(locale) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: exportMetadata, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
            t("research.comments.metadataCsv")
          ] }),
          comments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: exportComments, className: "flex h-9 items-center gap-2 rounded-xl border border-primary/40 px-3 text-2xs font-semibold text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
            t("research.comments.commentsCsv")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-2xs text-muted-foreground", children: t("research.comments.collectFrom") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: channelLimit, onChange: (event) => setChannelLimit(Number(event.target.value)), className: "h-9 rounded-xl border border-border/60 bg-background px-3 text-2xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 10, children: t("research.comments.latestVideos", { count: 10 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 25, children: t("research.comments.latestVideos", { count: 25 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 50, children: t("research.comments.latestVideos", { count: 50 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("research.comments.allVideos") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: loading || !videos.length, onClick: () => void fetchChannelComments(), className: "flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-2xs font-semibold text-primary-foreground disabled:opacity-50", children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquareText, { className: "h-3.5 w-3.5" }),
          t("research.comments.fetch")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-1 text-2xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3.5 w-3.5" }),
          t("research.comments.quotaWarning")
        ] })
      ] })
    ] }),
    comments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(CommentList, { comments, videos })
  ] }) });
}
const titleKeys = {
  discover: { title: "research.header.discoverTitle", subtitle: "research.header.discoverSubtitle" },
  monitor: { title: "research.header.monitorTitle", subtitle: "research.header.monitorSubtitle" },
  comments: { title: "research.header.commentsTitle", subtitle: "research.header.commentsSubtitle" },
  tools: { title: "research.header.toolsTitle", subtitle: "research.header.toolsSubtitle" },
  settings: { title: "research.header.settingsTitle", subtitle: "research.header.settingsSubtitle" }
};
function ResearchHeader({ activeView }) {
  const { locale, t } = useI18n();
  const legacyKey = useResearchStore((state) => state.apiKey);
  const apiKeys = useResearchStore((state) => state.apiKeys);
  useResearchStore((state) => state.quotaUsage);
  const keys = apiKeys.length ? apiKeys : legacyKey ? [legacyKey] : [];
  const quotas = keys.map(quotaForKey);
  const coreUsed = quotas.reduce((sum, quota) => sum + quota.coreUsed, 0);
  const searchUsed = quotas.reduce((sum, quota) => sum + quota.searchUsed, 0);
  const current = titleKeys[activeView];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex min-h-[62px] shrink-0 items-center border-b border-border/60 bg-panel/70 px-4 backdrop-blur-xl lg:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureHeaderIcon, { className: "mr-3", icon: Telescope }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-sm font-semibold", children: t(current.title) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-2xs text-muted-foreground", children: t(current.subtitle) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: t("research.header.quotaTip"), className: `ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium ${keys.length ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-3 w-3" }),
      keys.length ? t("research.header.quota", { count: keys.length, read: coreUsed.toLocaleString(locale), search: searchUsed.toLocaleString(locale) }) : t("research.common.noApi")
    ] })
  ] });
}
function ResearchSidebar({ activeView, onViewChange }) {
  const { t } = useI18n();
  const item = (id, icon, labelKey, tooltipKey) => ({
    id,
    icon,
    label: t(labelKey),
    tooltip: t(tooltipKey),
    active: activeView === id,
    onClick: () => onViewChange(id)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    FeatureRail,
    {
      items: [
        item("discover", Compass, "research.sidebar.discover", "research.sidebar.discoverTip"),
        item("monitor", Users, "research.sidebar.monitor", "research.sidebar.monitorTip"),
        item("comments", MessageSquareText, "research.sidebar.comments", "research.sidebar.commentsTip"),
        item("tools", Download, "research.sidebar.tools", "research.sidebar.toolsTip")
      ],
      bottomItems: [
        item("settings", Settings, "research.sidebar.settings", "research.sidebar.settingsTip")
      ]
    }
  );
}
function ResearchSettings() {
  const { locale, t } = useI18n();
  const savedApiKey = useResearchStore((state) => state.apiKey);
  const savedApiKeys = useResearchStore((state) => state.apiKeys);
  const activeIndex = useResearchStore((state) => state.activeApiKeyIndex);
  const disabledApiKeys = useResearchStore((state) => state.disabledApiKeys);
  const setApiKeys = useResearchStore((state) => state.setApiKeys);
  const resetQuotaEstimates = useResearchStore((state) => state.resetQuotaEstimates);
  const initialKeys = reactExports.useMemo(
    () => savedApiKeys.length ? savedApiKeys : savedApiKey ? [savedApiKey] : [""],
    [savedApiKey, savedApiKeys]
  );
  const [keyInputs, setKeyInputs] = reactExports.useState(initialKeys);
  const [showKeys, setShowKeys] = reactExports.useState(false);
  const [testing, setTesting] = reactExports.useState(false);
  const [message, setMessage] = reactExports.useState("");
  const [results, setResults] = reactExports.useState({});
  reactExports.useEffect(() => setKeyInputs(initialKeys), [initialKeys]);
  const parsedKeys = reactExports.useMemo(
    () => [...new Set(keyInputs.map((key) => key.trim()).filter(Boolean))],
    [keyInputs]
  );
  const updateKey = (index, value) => {
    setKeyInputs((keys) => keys.map((key, keyIndex) => keyIndex === index ? value : key));
    setMessage("");
  };
  const addKeyInput = () => {
    setKeyInputs((keys) => [...keys, ""]);
    setMessage("");
  };
  const removeKeyInput = (index) => {
    setKeyInputs((keys) => {
      const next = keys.filter((_, keyIndex) => keyIndex !== index);
      return next.length ? next : [""];
    });
    setMessage("");
  };
  const save = () => {
    setApiKeys(parsedKeys);
    setMessage(t("research.settings.saved", { count: parsedKeys.length }));
  };
  const testAll = async () => {
    if (!parsedKeys.length) {
      setMessage(t("research.settings.enterKey"));
      return;
    }
    setTesting(true);
    setMessage("");
    const nextResults = {};
    for (const key of parsedKeys) {
      try {
        await validateYouTubeApiKey(key);
        nextResults[key] = "valid";
      } catch (error) {
        nextResults[key] = error instanceof Error ? error.message : t("research.settings.invalid");
      }
      setResults({ ...nextResults });
    }
    setTesting(false);
  };
  const storedKeys = configuredApiKeys();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-h-0 flex-1 overflow-y-auto p-5 lg:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Youtube, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: "YouTube Data API keys" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-muted-foreground", children: t("research.settings.description") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold", children: t("research.settings.keyList") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setShowKeys((show) => !show), className: "flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground", children: [
            showKeys ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3.5 w-3.5" }),
            t(showKeys ? "research.settings.hideKeys" : "research.settings.showKeys")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: keyInputs.map((key, index) => {
          const trimmedKey = key.trim();
          const result = trimmedKey ? results[trimmedKey] : void 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-background p-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1 block text-2xs font-medium text-muted-foreground", children: t("research.settings.keyLabel", { count: index + 1 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: showKeys ? "text" : "password",
                    value: key,
                    onChange: (event) => updateKey(index, event.target.value),
                    placeholder: "AIza...",
                    autoComplete: "off",
                    spellCheck: false,
                    className: "h-7 w-full bg-transparent font-mono text-2xs outline-none"
                  }
                )
              ] }),
              result === "valid" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 shrink-0 text-emerald-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeKeyInput(index),
                  title: t("research.settings.removeKey"),
                  className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
                }
              )
            ] }),
            result && result !== "valid" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 pl-11 text-2xs text-destructive", children: result })
          ] }, index);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", className: "mt-2 w-full border-dashed text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary", onClick: addKeyInput, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
          t("research.settings.addKey")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-2xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-emerald-500" }),
            t("research.settings.localOnly", { count: parsedKeys.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://console.cloud.google.com/apis/credentials", target: "_blank", rel: "noopener noreferrer", className: "flex shrink-0 items-center gap-1 text-2xs font-medium text-primary", children: [
            t("research.settings.createKey"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", onClick: () => void testAll(), disabled: testing, children: [
          testing && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }),
          t("research.settings.testAll")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: save, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-3.5 w-3.5" }),
          t("research.settings.save")
        ] }),
        message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-emerald-500", children: message })
      ] })
    ] }),
    storedKeys.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold", children: t("research.settings.quotaTitle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xs text-muted-foreground", children: t("research.settings.quotaHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: resetQuotaEstimates, className: "flex items-center gap-1.5 text-2xs text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3.5 w-3.5" }),
          t("research.settings.resetQuota")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-2", children: storedKeys.map((key, index) => {
        const quota = quotaForKey(key);
        const result = results[key];
        const disabled = disabledApiKeys.includes(key);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border/60 bg-background/60 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${disabled || result && result !== "valid" ? "bg-destructive" : index === activeIndex ? "bg-emerald-500" : "bg-muted-foreground/40"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium", children: maskYouTubeKey(key) }),
            index === activeIndex && !disabled && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-medium text-emerald-500", children: t("research.settings.active") }),
            result === "valid" && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-emerald-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-2xs text-muted-foreground", children: t("research.settings.keyPosition", { current: index + 1, total: storedKeys.length }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/30 px-2.5 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("research.settings.readRemaining") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs font-semibold", children: quota.coreUsed.toLocaleString(locale) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-muted/30 px-2.5 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xs text-muted-foreground", children: t("research.settings.searchRemaining") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-2xs font-semibold", children: quota.searchUsed.toLocaleString(locale) })
            ] })
          ] }),
          result && result !== "valid" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-2xs text-destructive", children: result })
        ] }, key);
      }) })
    ] })
  ] }) });
}
function useResearchScanner() {
  const apiKey = useResearchStore((state) => state.apiKey);
  const trackedChannels = useResearchStore((state) => state.trackedChannels);
  const channelCache = useResearchStore((state) => state.channelCache);
  const channelScanConfigs = useResearchStore((state) => state.channelScanConfigs);
  const channelSnapshots = useResearchStore((state) => state.channelSnapshots);
  const databaseHydrated = useResearchStore((state) => state.databaseHydrated);
  const isScanning = useResearchStore((state) => state.isScanning);
  reactExports.useEffect(() => {
    void hydrateResearchDatabase().catch((error) => {
      console.error("Failed to hydrate research database", error);
      useResearchStore.setState({ databaseHydrated: true });
    });
  }, []);
  reactExports.useEffect(() => {
    if (!databaseHydrated || !apiKey || !trackedChannels.length || isScanning) return;
    const nextScanAt = trackedChannels.reduce((earliest, input, index) => {
      const channel = channelCache[index];
      const config = { ...DEFAULT_CHANNEL_SCAN_CONFIG, ...channelScanConfigs[channel?.id || input] };
      if (!config.autoScan) return earliest;
      const lastScannedAt = channel ? channelSnapshots[channel.id]?.scannedAt : void 0;
      const dueAt = lastScannedAt ? lastScannedAt + config.intervalMinutes * 6e4 : 0;
      return Math.min(earliest, dueAt);
    }, Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextScanAt)) return;
    const delayMs = Math.max(0, nextScanAt - Date.now());
    const timer = window.setTimeout(() => {
      void runResearchScan().catch(() => void 0);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [
    apiKey,
    channelCache,
    channelScanConfigs,
    channelSnapshots,
    databaseHydrated,
    isScanning,
    trackedChannels
  ]);
}
const MediaToolkit = reactExports.lazy(() => __vitePreload(() => import("./entry-C4f9I3oQ.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]) : void 0, import.meta.url));
function ResearchWorkspace() {
  const [activeView, setActiveView] = reactExports.useState("discover");
  useResearchScanner();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full min-h-0 bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ResearchSidebar, { activeView, onViewChange: setActiveView }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden", children: [
      activeView !== "tools" && /* @__PURE__ */ jsxRuntimeExports.jsx(ResearchHeader, { activeView }),
      activeView === "discover" && /* @__PURE__ */ jsxRuntimeExports.jsx(DiscoverView, {}),
      activeView === "monitor" && /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorView, {}),
      activeView === "comments" && /* @__PURE__ */ jsxRuntimeExports.jsx(CommentsView, {}),
      activeView === "tools" && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-7 w-7 animate-spin text-primary" }) }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MediaToolkit, { embedded: true }) }),
      activeView === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsx(ResearchSettings, {})
    ] })
  ] });
}
function ResearchMonitorFeature() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ResearchWorkspace, {});
}
export {
  ResearchMonitorFeature as default
};
