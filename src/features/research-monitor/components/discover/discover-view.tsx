import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Slider } from "radix-ui";
import { AlertCircle, ArrowDown, ArrowUp, ChevronDown, ExternalLink, KeyRound, Loader2, MessageCircle, Pin, PinOff, Search, SlidersHorizontal, ThumbsUp, Zap } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { discoverYouTubeVideos } from "../../lib/youtube-api";
import { formatAge, formatDuration, formatViews } from "../../lib/format";
import { useResearchStore } from "../../stores/research-store";
import type { VideoKind, YouTubeVideo } from "../../types";

type SortField = "outlier" | "views" | "subscribers" | "published" | "composite";
type SortDir = "asc" | "desc";
type CompositeSignal = "views" | "recency" | "subscribers" | "outlier";

// Composite sort blends several normalized signals into one score, so results that
// are high on ALL enabled signals (e.g. high views + recent + big channel) rise to
// the top — unlike a tie-breaker chain, where secondary keys almost never activate.
const COMPOSITE_SIGNALS: CompositeSignal[] = ["views", "recency", "subscribers", "outlier"];
const COMPOSITE_SIGNAL_LABEL: Record<CompositeSignal, string> = { views: "research.discover.sortViews", recency: "research.discover.signalRecency", subscribers: "research.discover.sortSubscribers", outlier: "research.discover.sortOutlier" };
const COMPOSITE_PRESETS: { key: string; labelKey: string; weights: Record<CompositeSignal, number> }[] = [
  { key: "balanced", labelKey: "research.discover.presetBalanced", weights: { views: 50, recency: 50, subscribers: 0, outlier: 0 } },
  { key: "trending", labelKey: "research.discover.presetTrending", weights: { views: 40, recency: 60, subscribers: 0, outlier: 0 } },
  { key: "bigChannel", labelKey: "research.discover.presetBigChannel", weights: { views: 50, recency: 0, subscribers: 50, outlier: 0 } },
  { key: "breakout", labelKey: "research.discover.presetBreakout", weights: { views: 30, recency: 0, subscribers: 0, outlier: 70 } },
];

function clampHour(value: number, maxHours: number) {
  return Math.max(0, Math.min(maxHours, Math.round(Number.isFinite(value) ? value : 0)));
}

// Human-friendly anchor thresholds spaced evenly across the track. Between anchors
// the value is interpolated continuously, so dragging reaches ANY number (e.g. 250K)
// instead of snapping to fixed stops — while the low end keeps fine control instead
// of the old log curve. The far-right edge means "no upper limit" (∞).
const METRIC_ANCHORS = [0, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000];
const METRIC_RES = 100; // slider steps per segment → smooth, precise dragging
const METRIC_MAX_POS = (METRIC_ANCHORS.length - 1) * METRIC_RES;
const METRIC_ANCHOR_MAX = METRIC_ANCHORS[METRIC_ANCHORS.length - 1];

function positionToValue(position: number) {
  if (position >= METRIC_MAX_POS) return Number.POSITIVE_INFINITY;
  const segment = Math.floor(position / METRIC_RES);
  const fraction = (position - segment * METRIC_RES) / METRIC_RES;
  return Math.round(METRIC_ANCHORS[segment] + fraction * (METRIC_ANCHORS[segment + 1] - METRIC_ANCHORS[segment]));
}

function valueToPosition(value: number) {
  if (!Number.isFinite(value) || value >= METRIC_ANCHOR_MAX) return METRIC_MAX_POS;
  if (value <= 0) return 0;
  const segment = Math.max(0, METRIC_ANCHORS.findIndex((anchor) => anchor > value) - 1);
  const low = METRIC_ANCHORS[segment];
  const high = METRIC_ANCHORS[segment + 1];
  return Math.round((segment + (value - low) / (high - low)) * METRIC_RES);
}

function formatMetricValue(value: number) {
  return Number.isFinite(value) ? formatViews(value) : "∞";
}

function parseMetricValue(value: string) {
  const normalized = value.trim().toUpperCase().replace(/[,_\s]/g, "");
  if (normalized === "" || normalized === "∞") return Number.POSITIVE_INFINITY;
  const match = normalized.match(/^(\d+(?:\.\d+)?)([KMB])?\+?$/);
  if (!match) return null;
  const multiplier = match[2] === "K" ? 1_000 : match[2] === "M" ? 1_000_000 : match[2] === "B" ? 1_000_000_000 : 1;
  return Number(match[1]) * multiplier;
}

function DualRange({ label, values, onChange }: { label: string; values: number[]; onChange: (value: number[]) => void }) {
  const positions = [valueToPosition(values[0]), valueToPosition(values[1])];
  const minValue = values[0];
  const maxValue = values[1];
  return (
    <div>
      <p className="mb-3 text-xs font-semibold">{label}</p>
      <Slider.Root value={positions} min={0} max={METRIC_MAX_POS} step={1} minStepsBetweenThumbs={1} onValueChange={(nextPositions) => onChange(nextPositions.map(positionToValue))} className="relative flex h-5 w-full touch-none select-none items-center">
        <Slider.Track className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><Slider.Range className="absolute h-full bg-primary" /></Slider.Track>
        <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" />
      </Slider.Root>
      <div className="mt-2 flex items-center gap-2"><input aria-label={`${label} min`} value={formatMetricValue(minValue)} onChange={(event) => { const parsed = parseMetricValue(event.target.value); if (parsed != null) onChange([Math.max(0, Math.min(parsed, maxValue)), maxValue]); }} className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center text-2xs font-medium outline-none focus:border-primary" /><span className="text-2xs text-muted-foreground">—</span><input aria-label={`${label} max`} value={formatMetricValue(maxValue)} onChange={(event) => { const parsed = parseMetricValue(event.target.value); if (parsed != null) onChange([minValue, Math.max(minValue, parsed)]); }} className="min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-center text-2xs font-medium outline-none focus:border-primary" /></div>
    </div>
  );
}

function PublishedTimeRange({ maxDays, hours, onMaxDaysChange, onHoursChange }: { maxDays: number; hours: number[]; onMaxDaysChange: (days: number) => void; onHoursChange: (hours: number[]) => void }) {
  const { t } = useI18n();
  const maxHours = maxDays * 24;
  const formatHourAge = (value: number) => {
    if (value === 0) return t("research.discover.now");
    if (value < 48) return t("research.discover.hoursAgo", { count: value });
    const days = Math.floor(value / 24);
    const remainingHours = value % 24;
    return remainingHours ? t("research.discover.daysHoursAgo", { days, hours: remainingHours }) : t("research.discover.daysAgo", { count: days });
  };
  const setNewest = (value: number) => {
    const newest = Math.min(clampHour(value, maxHours), Math.max(0, hours[1] - 1));
    onHoursChange([newest, hours[1]]);
  };
  const setOldest = (value: number) => {
    const oldest = Math.max(clampHour(value, maxHours), Math.min(maxHours, hours[0] + 1));
    onHoursChange([hours[0], oldest]);
  };

  return <div>
    <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-semibold">{t("research.discover.published")}</p><label className="flex items-center gap-1.5 text-2xs text-muted-foreground"><span>{t("research.discover.maxDays")}</span><input type="number" min={1} max={3650} value={maxDays} onChange={(event) => onMaxDaysChange(Number(event.target.value))} className="h-7 w-16 rounded-lg border border-border/60 bg-background px-2 text-center text-2xs font-medium text-foreground outline-none focus:border-primary" /></label></div>
    <Slider.Root value={hours} min={0} max={maxHours} step={1} minStepsBetweenThumbs={1} onValueChange={onHoursChange} className="relative flex h-5 w-full touch-none select-none items-center">
      <Slider.Track className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><Slider.Range className="absolute h-full bg-primary" /></Slider.Track>
      <Slider.Thumb aria-label={t("research.discover.newestAge")} className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" />
      <Slider.Thumb aria-label={t("research.discover.oldestAge")} className="block h-4 w-4 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus:ring-2 focus:ring-primary/30" />
    </Slider.Root>
    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><label className="rounded-lg border border-border/60 bg-background px-2 py-1.5"><span className="block text-2xs text-muted-foreground">{t("research.discover.newestAge")}</span><input type="number" min={0} max={Math.max(0, hours[1] - 1)} value={hours[0]} onChange={(event) => setNewest(Number(event.target.value))} className="mt-0.5 w-full bg-transparent text-center text-2xs font-medium outline-none" /></label><span className="text-2xs text-muted-foreground">—</span><label className="rounded-lg border border-border/60 bg-background px-2 py-1.5"><span className="block text-2xs text-muted-foreground">{t("research.discover.oldestAge")}</span><input type="number" min={hours[0] + 1} max={maxHours} value={hours[1]} onChange={(event) => setOldest(Number(event.target.value))} className="mt-0.5 w-full bg-transparent text-center text-2xs font-medium outline-none" /></label></div>
    <div className="mt-1.5 flex justify-between text-2xs text-muted-foreground"><span>{formatHourAge(hours[0])}</span><span>{formatHourAge(hours[1])}</span></div>
  </div>;
}

function VideoCard({ video, measured, pinned, onTogglePin }: { video: YouTubeVideo; measured: boolean; pinned: boolean; onTogglePin: () => void }) {
  const { language, t } = useI18n();
  return (
    <article className="group min-w-0">
      <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden rounded-xl bg-muted/30">{video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}<span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-2xs font-medium text-white">{formatDuration(video.duration)}</span><span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"><ExternalLink className="h-3 w-3" /></span></a>
      <div className="mt-2 flex items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{video.outlier.toFixed(1)}×</span><span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" />{measured ? `${formatViews(Math.round(video.viewsPerHour))} VPH` : t("research.discover.waitScan")}</span><button type="button" onClick={onTogglePin} title={t(pinned ? "research.discover.unpin" : "research.discover.pin")} className={`ml-auto flex h-6 w-6 items-center justify-center rounded-lg ${pinned ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"}`}>{pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</button></div>
      <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer"><h3 className="mt-1.5 line-clamp-2 min-h-10 text-xs font-semibold leading-5 transition-colors group-hover:text-primary">{video.title}</h3></a>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-2xs text-muted-foreground"><span className="truncate">{video.channelTitle}</span><span>·</span><span className="shrink-0">{video.subscriberCount ? `${formatViews(video.subscriberCount)} sub` : t("research.discover.hiddenSubs")}</span></div>
      <div className="mt-1.5 flex items-center gap-2 text-2xs text-muted-foreground"><span className="font-medium text-foreground">{formatViews(video.viewCount)} {t("research.common.views")}</span><span>· {formatAge(video.publishedAt, language)}</span><span className="ml-auto flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{formatViews(video.likeCount)}</span><span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{formatViews(video.commentCount)}</span></div>
    </article>
  );
}

export function DiscoverView() {
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
  const [query, setQuery] = useState(savedQuery);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [activePublishedBounds, setActivePublishedBounds] = useState<{ after?: string; before?: string }>({});
  const [sortField, setSortField] = useState<SortField>("outlier");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [weights, setWeights] = useState<Record<CompositeSignal, number>>({ views: 50, recency: 50, subscribers: 0, outlier: 0 });
  const [kind, setKind] = useState<VideoKind>("Long");
  const [duration, setDuration] = useState<"any" | "short" | "medium" | "long">("any");
  const [viewRange, setViewRange] = useState([0, Number.POSITIVE_INFINITY]);
  const [subRange, setSubRange] = useState([0, Number.POSITIVE_INFINITY]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const viewValues = viewRange;
  const subValues = subRange;
  // Pure client-side reordering of already-fetched results — never re-queries YouTube.
  const results = useMemo(() => {
    const enriched = videos.map((video) => { const history = vphHistory[video.id]; return { ...video, viewsPerHour: history?.[history.length - 1]?.vph ?? 0 }; });
    const direction = sortDir === "asc" ? 1 : -1;
    if (sortField === "composite" && enriched.length) {
      const signalValue = (video: YouTubeVideo, signal: CompositeSignal) => signal === "views" ? video.viewCount
        : signal === "recency" ? new Date(video.publishedAt).getTime()
        : signal === "subscribers" ? video.subscriberCount
        : video.outlier;
      // Normalize each signal to 0-1 across the current result set so they are comparable.
      const ranges = COMPOSITE_SIGNALS.map((signal) => { const values = enriched.map((video) => signalValue(video, signal)); return { signal, min: Math.min(...values), max: Math.max(...values) }; });
      const totalWeight = COMPOSITE_SIGNALS.reduce((sum, signal) => sum + weights[signal], 0) || 1;
      const score = (video: YouTubeVideo) => ranges.reduce((sum, { signal, min, max }) => sum + weights[signal] * (max > min ? (signalValue(video, signal) - min) / (max - min) : 0), 0) / totalWeight;
      return enriched.sort((a, b) => (score(a) - score(b)) * direction);
    }
    const metric = (video: YouTubeVideo) => sortField === "views" ? video.viewCount
      : sortField === "subscribers" ? video.subscriberCount
      : sortField === "published" ? new Date(video.publishedAt).getTime()
      : video.outlier;
    return enriched.sort((a, b) => (metric(a) - metric(b)) * direction);
  }, [sortField, sortDir, weights, videos, vphHistory]);

  const matchesSearchFilters = (video: YouTubeVideo, requestedKind: VideoKind) => {
    if (video.kind !== requestedKind) return false;
    if (video.viewCount < viewValues[0] || (Number.isFinite(viewValues[1]) && video.viewCount > viewValues[1])) return false;
    if (video.subscriberCount < subValues[0] || (Number.isFinite(subValues[1]) && video.subscriberCount > subValues[1])) return false;
    return true;
  };

  const invalidateSearch = () => { setVideos([]); setNextPageToken(undefined); setTotalResults(0); setHasSearched(false); setError(""); };
  const changeMaxPublishedDays = (value: number) => {
    const nextDays = Math.max(1, Math.min(3650, Math.round(Number.isFinite(value) ? value : 1)));
    const previousMaxHours = maxPublishedDays * 24;
    const nextMaxHours = nextDays * 24;
    const followedMaximum = publishedHourRange[1] === previousMaxHours;
    const nextOldest = followedMaximum ? nextMaxHours : Math.min(publishedHourRange[1], nextMaxHours);
    setMaxPublishedDays(nextDays);
    setPublishedHourRange([Math.min(publishedHourRange[0], Math.max(0, nextOldest - 1)), Math.max(1, nextOldest)]);
    invalidateSearch();
  };
  const changePublishedHours = (value: number[]) => { setPublishedHourRange(value.map((hour) => clampHour(hour, maxPublishedDays * 24))); invalidateSearch(); };
  const resetFilters = () => { setKind("Long"); setDuration("any"); setMaxPublishedDays(30); setPublishedHourRange([0, 30 * 24]); setViewRange([0, Number.POSITIVE_INFINITY]); setSubRange([0, Number.POSITIVE_INFINITY]); setVideos([]); setNextPageToken(undefined); setTotalResults(0); setActivePublishedBounds({}); setHasSearched(false); };
  const collectMatchingPages = async (requestedKind: VideoKind, startToken: string | undefined, bounds: { after?: string; before?: string }, maxPages = 10) => {
    const collected: YouTubeVideo[] = [];
    const order = viewValues[0] > 0 ? "viewCount" as const : "relevance" as const;
    let token = startToken;
    let total = 0;
    let pageCount = 0;
    do {
      const page = await discoverYouTubeVideos(apiKey, query.trim(), requestedKind, token, bounds.after, bounds.before, order, requestedKind === "Long" && duration !== "any" ? duration : undefined);
      total = Math.max(total, page.totalResults);
      collected.push(...page.videos.filter((video) => matchesSearchFilters(video, requestedKind)));
      token = page.nextPageToken;
      pageCount += 1;
      if (order === "viewCount" && viewValues[0] > 0 && page.videos.length && Math.max(...page.videos.map((video) => video.viewCount)) < viewValues[0]) token = undefined;
    } while (token && collected.length < 50 && pageCount < maxPages);
    return { videos: [...new Map(collected.map((video) => [video.id, video])).values()], nextPageToken: token, totalResults: total };
  };
  const search = async (requestedKind: VideoKind = kind) => {
    if (!apiKey) return setError(t("research.discover.apiRequired"));
    if (!query.trim()) return setError(t("research.discover.queryRequired"));
    setLoading(true); setError(""); setHasSearched(true);
    try { const requestedAt = Date.now(); setSavedQuery(query.trim()); const publishedAfter = new Date(requestedAt - publishedHourRange[1] * 3_600_000).toISOString(); const publishedBefore = publishedHourRange[0] > 0 ? new Date(requestedAt - publishedHourRange[0] * 3_600_000).toISOString() : undefined; const bounds = { after: publishedAfter, before: publishedBefore }; setActivePublishedBounds(bounds); const page = await collectMatchingPages(requestedKind, undefined, bounds); setVideos(page.videos); setNextPageToken(page.nextPageToken); setTotalResults(page.totalResults); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : t("research.discover.loadFailed")); }
    finally { setLoading(false); }
  };
  const loadMore = async () => {
    if (!apiKey || !nextPageToken || loading) return;
    setLoading(true); setError("");
    try { const page = await collectMatchingPages(kind, nextPageToken, activePublishedBounds); setVideos((current) => [...new Map([...current, ...page.videos].map((video) => [video.id, video])).values()]); setNextPageToken(page.nextPageToken); setTotalResults(page.totalResults); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : t("research.discover.loadMoreFailed")); }
    finally { setLoading(false); }
  };
  const changeKind = (item: VideoKind) => {
    const rerun = hasSearched || videos.length > 0;
    setKind(item);
    invalidateSearch();
    if (rerun && query.trim()) void search(item);
  };
  const timeLabel = t("research.discover.hourRange", { from: publishedHourRange[0], to: publishedHourRange[1] });

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden w-[250px] shrink-0 overflow-y-auto border-r border-border/60 bg-panel/40 p-4 xl:block">
        <div className="mb-5 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /><h2 className="text-2xs font-semibold">{t("research.discover.filters")}</h2><button type="button" onClick={resetFilters} className="ml-auto text-2xs text-primary">{t("research.discover.reset")}</button></div>
        <div className="space-y-6">
          <div><p className="mb-2 text-xs font-semibold">{t("research.discover.contentType")}</p><div className="grid grid-cols-3 rounded-xl bg-muted/40 p-1">{(["Long", "Shorts", "Live"] as VideoKind[]).map((item) => <button type="button" key={item} disabled={loading} onClick={() => changeKind(item)} className={`rounded-lg px-2 py-1.5 text-2xs font-medium disabled:opacity-50 ${kind === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{item}</button>)}</div></div>
          {kind === "Long" && <div><p className="mb-2 text-xs font-semibold">{t("research.discover.duration")}</p><div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1">{(["any", "short", "medium", "long"] as const).map((item) => <button type="button" key={item} disabled={loading} onClick={() => { setDuration(item); invalidateSearch(); }} className={`rounded-lg px-2 py-1.5 text-2xs font-medium disabled:opacity-50 ${duration === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{t(item === "any" ? "research.discover.durationAny" : item === "short" ? "research.discover.durationShort" : item === "medium" ? "research.discover.durationMedium" : "research.discover.durationLong")}</button>)}</div></div>}
          <PublishedTimeRange maxDays={maxPublishedDays} hours={publishedHourRange} onMaxDaysChange={changeMaxPublishedDays} onHoursChange={changePublishedHours} />
          <DualRange label={t("research.discover.views")} values={viewRange} onChange={(value) => { setViewRange(value); invalidateSearch(); }} />
          <DualRange label={t("research.discover.subscribers")} values={subRange} onChange={(value) => { setSubRange(value); invalidateSearch(); }} />
        </div>
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-2xs leading-4 text-muted-foreground">{t("research.discover.serverFilterHint")}</div>
        <div className="mt-3 rounded-xl border border-border/60 bg-card/50 p-3 text-2xs leading-4 text-muted-foreground">{t("research.discover.vphHint")}</div>
      </aside>
      <section className="isolate min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 lg:px-5">
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-border/60 bg-background px-4 pb-3 pt-4 shadow-sm lg:-mx-5 lg:px-5">
          <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("research.discover.queryPlaceholder")} className="h-9 w-full rounded-lg border border-border/60 bg-card pl-10 pr-3 text-xs outline-none focus:border-primary" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{t("research.discover.search")}</Button>
            <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span>{t("research.discover.sort")}</span>
              <span className="relative">
                <select aria-label={t("research.discover.sort")} value={sortField} onChange={(event) => setSortField(event.target.value as SortField)} className="h-9 min-w-32 cursor-pointer appearance-none rounded-lg border border-border/60 bg-card pl-3 pr-8 text-xs font-semibold text-foreground outline-none focus:border-primary">
                  <option value="outlier">{t("research.discover.sortOutlier")}</option>
                  <option value="views">{t("research.discover.sortViews")}</option>
                  <option value="subscribers">{t("research.discover.sortSubscribers")}</option>
                  <option value="published">{t("research.discover.sortPublished")}</option>
                  <option value="composite">{t("research.discover.sortComposite")}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")} title={t(sortDir === "desc" ? "research.discover.sortDesc" : "research.discover.sortAsc")}>{sortDir === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}<span className="hidden sm:inline">{t(sortDir === "desc" ? "research.discover.sortDesc" : "research.discover.sortAsc")}</span></Button>
          </form>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-2xs"><span className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1">{t("research.discover.type")} <strong>{kind}</strong></span><span className="rounded-full bg-muted/50 px-2.5 py-1">{t("research.discover.time")} <strong>{timeLabel}</strong></span><span className="rounded-full bg-muted/50 px-2.5 py-1">Views: <strong>{formatMetricValue(viewValues[0])}–{formatMetricValue(viewValues[1])}</strong></span><span className="rounded-full bg-muted/50 px-2.5 py-1">Sub: <strong>{formatMetricValue(subValues[0])}–{formatMetricValue(subValues[1])}</strong></span><button type="button" onClick={resetFilters} className="font-medium text-primary">{t("research.discover.clearAll")}</button></div>
          {sortField === "composite" && <div className="mt-2.5 rounded-xl border border-border/60 bg-card/60 p-3">
            <div className="flex flex-wrap items-center gap-1.5"><span className="text-2xs font-semibold text-muted-foreground">{t("research.discover.compositePresets")}</span>{COMPOSITE_PRESETS.map((preset) => <button type="button" key={preset.key} onClick={() => setWeights(preset.weights)} className="rounded-full bg-muted/60 px-2.5 py-1 text-2xs font-medium hover:bg-primary/10 hover:text-primary">{t(preset.labelKey)}</button>)}</div>
            <div className="mt-2.5 grid gap-x-4 gap-y-2 sm:grid-cols-2">{COMPOSITE_SIGNALS.map((signal) => <label key={signal} className={`flex items-center gap-2 ${weights[signal] === 0 ? "opacity-45" : ""}`}><span className="w-20 shrink-0 text-2xs font-medium">{t(COMPOSITE_SIGNAL_LABEL[signal])}</span><input type="range" min={0} max={100} step={10} value={weights[signal]} onChange={(event) => setWeights((current) => ({ ...current, [signal]: Number(event.target.value) }))} className="h-1 flex-1 accent-primary" /><span className="w-8 shrink-0 text-right text-2xs tabular-nums text-muted-foreground">{weights[signal]}%</span></label>)}</div>
            <p className="mt-2 text-2xs leading-3 text-muted-foreground">{t("research.discover.compositeHint")}</p>
          </div>}
          {error && <p className="mt-2 flex items-center gap-1.5 text-2xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
        </div>
        {!apiKey ? <div className="flex h-72 flex-col items-center justify-center text-center"><KeyRound className="mb-3 h-9 w-9 text-amber-500" /><p className="text-sm font-semibold">{t("research.common.noApi")}</p></div>
          : loading && !videos.length ? <div className="flex h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          : videos.length && !results.length ? <div className="flex h-72 flex-col items-center justify-center text-center"><SlidersHorizontal className="mb-3 h-8 w-8 text-muted-foreground/50" /><p className="text-sm font-semibold">{t("research.discover.filteredEmpty", { count: videos.length })}</p><button type="button" onClick={resetFilters} className="mt-2 text-xs font-medium text-primary">{t("research.discover.showAll")}</button></div>
          : results.length ? <><div className="mb-4 flex items-center text-2xs text-muted-foreground"><span>{t("research.discover.resultCount", { shown: results.length, loaded: videos.length, total: formatViews(totalResults) })}</span></div><div className="grid grid-cols-1 gap-x-3 gap-y-7 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{results.map((video) => <VideoCard key={video.id} video={video} measured={Boolean(vphHistory[video.id]?.length)} pinned={pinnedVideoIds.includes(video.id)} onTogglePin={() => pinnedVideoIds.includes(video.id) ? unpinVideo(video.id) : pinVideo(video)} />)}</div>{nextPageToken && <div className="mt-8 flex justify-center"><Button type="button" variant="outline" className="px-5" onClick={() => void loadMore()} disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{t("research.discover.loadMore")}</Button></div>}</>
          : hasSearched ? <div className="flex h-72 flex-col items-center justify-center text-center"><Search className="mb-3 h-8 w-8 text-muted-foreground/50" /><p className="text-sm font-semibold">{t("research.discover.noResults", { query })}</p><p className="mt-1 text-xs text-muted-foreground">{t("research.discover.tryShorter")}</p></div>
          : <div className="flex h-72 flex-col items-center justify-center text-center"><Search className="mb-3 h-8 w-8 text-muted-foreground/50" /><p className="text-sm font-semibold">{t("research.discover.start")}</p><p className="mt-1 text-xs text-muted-foreground">{t("research.discover.pageHint")}</p></div>}
      </section>
    </div>
  );
}
