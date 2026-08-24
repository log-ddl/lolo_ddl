import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { useI18n } from "@/shared/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatAge, formatViews } from "../../lib/format";
import { loadChannelVideoCatalog } from "../../lib/youtube-api";
import { runResearchScan } from "../../lib/research-scanner";
import { DEFAULT_CHANNEL_SCAN_CONFIG, useResearchStore } from "../../stores/research-store";
import type { ChannelScanConfig, VphPoint, YouTubeChannel, YouTubeVideo } from "../../types";

const EMPTY_HISTORY: VphPoint[] = [];
type MeasuredHourBar = { views: number; durationMinutes: number; heightValue: number } | null;

function buildHourlyViewBars(history: VphPoint[]) {
  const hourMs = 3_600_000;
  if (!history.length) return Array.from<MeasuredHourBar>({ length: 48 }).fill(null);
  const observations = [{
    scannedAt: history[0].previousScannedAt ?? history[0].scannedAt - history[0].elapsedHours * hourMs,
    viewCount: history[0].viewCount - history[0].deltaViews,
  }, ...history.map((point) => ({ scannedAt: point.scannedAt, viewCount: point.viewCount }))];
  const bars: MeasuredHourBar[] = [];
  let endIndex = observations.length - 1;

  while (bars.length < 48 && endIndex > 0) {
    const end = observations[endIndex];
    let startIndex = endIndex - 1;
    while (startIndex > 0 && end.scannedAt - observations[startIndex].scannedAt < hourMs) startIndex -= 1;
    const candidates = [startIndex, startIndex + 1].filter((index) => index >= 0 && index < endIndex);
    const bestIndex = candidates.reduce((best, index) => (
      Math.abs((end.scannedAt - observations[index].scannedAt) - hourMs)
        < Math.abs((end.scannedAt - observations[best].scannedAt) - hourMs) ? index : best
    ), candidates[0]);
    const start = observations[bestIndex];
    const durationMs = end.scannedAt - start.scannedAt;
    const views = end.viewCount - start.viewCount;
    bars.push(durationMs > 0 && durationMs <= hourMs * 1.5
      ? { views, durationMinutes: Math.round(durationMs / 60_000), heightValue: views / (durationMs / hourMs) }
      : null);
    endIndex = bestIndex;
  }

  while (bars.length < 48) bars.push(null);
  const result = bars.reverse();
  if (result.some(Boolean)) return result;
  const observed = history.slice(-48).map((point) => ({
    views: point.deltaViews,
    durationMinutes: Math.round(point.elapsedHours * 60),
    heightValue: point.elapsedHours > 0 ? point.deltaViews / point.elapsedHours : 0,
  }));
  return [...Array.from<MeasuredHourBar>({ length: 48 - observed.length }).fill(null), ...observed];
}

function HistoryChart({ history }: { history: VphPoint[] }) {
  const { language, t } = useI18n();
  const bars = useMemo(() => buildHourlyViewBars(history), [history]);
  const maxValue = Math.max(...bars.map((bar) => Math.max(0, bar?.heightValue ?? 0)), 1);
  const lastIndex = bars.reduce((latest, bar, index) => bar == null ? latest : index, -1);

  return (
    <div>
      <div className="relative h-14 border-b border-border/60">
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {bars.map((bar, index) => (
            <span
              key={index}
              title={bar ? t("research.monitor.measuredInterval", {
                count: bar.views.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
                minutes: bar.durationMinutes,
              }) : t("research.monitor.missingInterval")}
              className={`min-w-0 flex-1 rounded-t-[2px] transition-colors ${
                bar == null ? "bg-transparent" : index === lastIndex ? "bg-primary" : "bg-primary/20 hover:bg-primary/45"
              }`}
              style={{ height: bar == null ? 0 : `${Math.max(3, Math.round((Math.max(0, bar.heightValue) / maxValue) * 52))}px` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-2xs text-muted-foreground">
        <span>{t("research.monitor.hours48Ago")}</span>
        <span>{t("research.monitor.now")}</span>
      </div>
    </div>
  );
}

function latestPoint(history: VphPoint[]) {
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
  onRemove,
}: {
  channel: YouTubeChannel;
  config: ChannelScanConfig;
  customVideoIds: string[];
  loading: boolean;
  onOpenSettings: () => void;
  onScanNow: () => void;
  onOpenVideo: (video: YouTubeVideo) => void;
  onRemove: () => void;
}) {
  const { language, t } = useI18n();
  const customMode = config.videoScanMode === "custom";
  const [visibleVideoCount, setVisibleVideoCount] = useState(10);
  const channelHistory = useResearchStore((state) => state.channelViewHistory[channel.id]) || EMPTY_HISTORY;
  const videoHistory = useResearchStore((state) => state.vphHistory);
  const channelLatest = latestPoint(channelHistory);
  const sortedVideos = useMemo(
    () => channel.recentVideos
      .filter((video) => !customMode || customVideoIds.includes(video.id))
      .sort((left, right) => {
      const leftVph = latestPoint(videoHistory[left.id] || EMPTY_HISTORY)?.vph ?? -1;
      const rightVph = latestPoint(videoHistory[right.id] || EMPTY_HISTORY)?.vph ?? -1;
      return rightVph - leftVph;
    }),
    [channel.recentVideos, customMode, customVideoIds, videoHistory],
  );
  const visibleVideos = sortedVideos.slice(0, visibleVideoCount);
  const remaining = Math.max(0, sortedVideos.length - visibleVideos.length);

  return (
    <article className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        {channel.thumbnailUrl
          ? <img src={channel.thumbnailUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>}
        <div className="min-w-0 flex-1">
          <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5">
            <h3 className="max-w-[150px] shrink-0 truncate text-xs font-semibold hover:text-primary">{channel.title}</h3>
            <span className="min-w-0 truncate text-2xs text-muted-foreground">{channel.handle}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          </a>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatViews(channel.subscriberCount)} {t("research.common.subscribers")} · {formatViews(channel.videoCount)} {t("research.common.videos")}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" className="whitespace-nowrap" disabled={loading} onClick={onScanNow} title={t("research.monitor.scanNow")}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("research.monitor.scanNow")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="whitespace-nowrap" onClick={onOpenSettings} title={t("research.monitor.channelSettings")}>
            <Settings2 className="h-3.5 w-3.5" />
            {t("research.monitor.channelSettings")}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={onRemove} title={t("research.monitor.remove")}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-px bg-border/40">
        <div className="bg-card px-3.5 py-2.5">
          <p className="text-xs text-muted-foreground">{t("research.monitor.publicViews")}</p>
          <p className="mt-0.5 text-base font-bold">{formatViews(channel.viewCount)}</p>
        </div>
        <div
          className="bg-card px-3.5 py-2.5"
          title={channelLatest ? t("research.monitor.measuredInterval", {
            count: channelLatest.deltaViews.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
            minutes: Math.round(channelLatest.elapsedHours * 60),
          }) : t("research.monitor.measureHint")}
        >
        <p className="text-xs text-muted-foreground">{t("research.monitor.latestDelta")}</p>
          <p className="mt-0.5 text-base font-bold text-emerald-500">{channelLatest ? formatViews(channelLatest.deltaViews) : "—"}</p>
        </div>
        <div className="bg-card px-3.5 py-2.5">
          <p className="text-xs text-muted-foreground">{t("research.monitor.views48h")}</p>
          <p className="mt-0.5 text-base font-bold">{channel.viewsLast48Hours == null ? "—" : formatViews(channel.viewsLast48Hours)}</p>
        </div>
      </div>

      <div className="border-b border-border/60 px-4 py-2">
        <HistoryChart history={channelHistory} />
      </div>

      <div className="px-4 py-3">
        <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_84px_96px_72px] gap-2 px-1 text-2xs font-semibold text-muted-foreground">
          <span>{t("research.monitor.video")}</span>
          <span className="text-right">{t("research.monitor.totalViews")}</span>
          <span className="text-right">{t("research.monitor.latestDelta")}</span>
          <span className="text-right">48H</span>
        </div>
        <div className="space-y-1">
          {visibleVideos.map((video) => {
            const history = videoHistory[video.id] || EMPTY_HISTORY;
            const point = latestPoint(history);
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => onOpenVideo(video)}
                className="grid w-full grid-cols-[minmax(0,1fr)_84px_96px_72px] items-center gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-muted/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-8 w-12 shrink-0 rounded object-cover" /> : <span className="h-8 w-12 shrink-0 rounded bg-muted" />}
                  <span className="min-w-0">
                    <span className="block truncate text-2xs font-medium">{video.title}</span>
                    <span className="block text-2xs text-muted-foreground">{formatAge(video.publishedAt, language)}</span>
                  </span>
                </span>
                <span className="text-right text-xs">{formatViews(video.viewCount)}</span>
                <span
                  className="text-right text-xs font-semibold text-emerald-500"
                  title={point ? t("research.monitor.measuredInterval", {
                    count: point.deltaViews.toLocaleString(language === "vi" ? "vi-VN" : "en-US"),
                    minutes: Math.round(point.elapsedHours * 60),
                  }) : t("research.monitor.measureHint")}
                >
                  {point ? formatViews(point.deltaViews) : "—"}
                </span>
                <span className="text-right text-xs">{video.viewsLast48Hours == null ? "—" : formatViews(video.viewsLast48Hours)}</span>
              </button>
            );
          })}
          {!visibleVideos.length && (
            <p className="py-6 text-center text-2xs text-muted-foreground">
              {customMode ? t("research.monitor.chooseVideosHint") : t("research.monitor.noPublicVideos")}
            </p>
          )}
        </div>
        {remaining > 0 && (
          <Button type="button" variant="outline" size="sm" className="mt-2 w-full text-muted-foreground" onClick={() => setVisibleVideoCount((count) => count + 10)}>
            <ChevronDown className="h-3.5 w-3.5" />
            {t("research.monitor.showMoreVideos", { count: Math.min(10, remaining) })}
          </Button>
        )}
        {visibleVideoCount > 10 && (
          <Button type="button" variant="ghost" size="xs" className="mt-1 w-full text-muted-foreground" onClick={() => setVisibleVideoCount(10)}>
            <ChevronUp className="h-3.5 w-3.5" />
            {t("research.monitor.collapseVideos")}
          </Button>
        )}
      </div>
    </article>
  );
}

export function MonitorView() {
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

  const [addOpen, setAddOpen] = useState(false);
  const [addConfig, setAddConfig] = useState<ChannelScanConfig>(DEFAULT_CHANNEL_SCAN_CONFIG);
  const [settingsChannel, setSettingsChannel] = useState<YouTubeChannel | null>(null);
  const [draftConfig, setDraftConfig] = useState<ChannelScanConfig>(DEFAULT_CHANNEL_SCAN_CONFIG);
  const [channelInput, setChannelInput] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [catalogChannel, setCatalogChannel] = useState<YouTubeChannel | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [draftCustomIds, setDraftCustomIds] = useState<string[]>([]);

  const totalViews = useMemo(() => channels.reduce((sum, channel) => sum + channel.viewCount, 0), [channels]);
  const totalViews48h = useMemo(() => channels.reduce((sum, channel) => sum + (channel.viewsLast48Hours ?? 0), 0), [channels]);
  const totalLatestDelta = useMemo(() => channels.reduce((sum, channel) => {
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
    if (apiKey) void runResearchScan(true).catch(() => undefined);
  };

  const removeChannel = (index: number) => {
    setTrackedChannels(trackedChannels.filter((_, itemIndex) => itemIndex !== index));
    setChannelCache(channels.filter((_, itemIndex) => itemIndex !== index));
  };

  const openChannelSettings = (channel: YouTubeChannel) => {
    setDraftConfig({ ...DEFAULT_CHANNEL_SCAN_CONFIG, ...channelScanConfigs[channel.id] });
    setSettingsChannel(channel);
  };

  const saveChannelSettings = () => {
    if (!settingsChannel) return;
    setChannelScanConfig(settingsChannel.id, draftConfig);
    setSettingsChannel(null);
  };

  const openCustomPicker = async (channel: YouTubeChannel, index: number) => {
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

  const filteredCatalogVideos = useMemo(() => {
    const query = catalogSearch.trim().toLocaleLowerCase();
    const videos = catalogChannel?.recentVideos || [];
    return query ? videos.filter((video) => video.title.toLocaleLowerCase().includes(query)) : videos;
  }, [catalogChannel, catalogSearch]);

  const saveCustomSelection = () => {
    if (!catalogChannel) return;
    setCustomScanVideoIds(catalogChannel.id, draftCustomIds);
    const channelId = catalogChannel.id;
    setCatalogChannel(null);
    void runResearchScan(true, channelId).catch(() => undefined);
  };

  const selectedHistory = selectedVideo ? videoHistory[selectedVideo.id] || EMPTY_HISTORY : EMPTY_HISTORY;
  const selectedLatest = latestPoint(selectedHistory);

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t("research.monitor.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastScanAt ? t("research.monitor.latestSnapshot", { time: new Date(lastScanAt).toLocaleString(locale) }) : t("research.monitor.needTwoScans")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t("research.monitor.addChannel")}
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-2xs text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!apiKey ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <KeyRound className="mb-3 h-9 w-9 text-amber-500" />
          <p className="text-sm font-semibold">{t("research.common.noApi")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("research.monitor.noApiHint")}</p>
        </div>
      ) : !trackedChannels.length ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <Users className="mb-3 h-9 w-9 text-muted-foreground/60" />
          <p className="text-sm font-semibold">{t("research.monitor.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("research.monitor.emptyHint")}</p>
          <Button type="button" className="mt-4" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" />{t("research.monitor.addChannel")}</Button>
        </div>
      ) : loading && !channels.length ? (
        <div className="flex h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5"><p className="text-xs text-muted-foreground">{t("research.monitor.scannedChannels")}</p><p className="mt-0.5 text-base font-bold">{channels.length}</p></div>
            <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5"><p className="text-xs text-muted-foreground">{t("research.monitor.publicViews")}</p><p className="mt-0.5 text-base font-bold">{formatViews(totalViews)}</p></div>
            <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5"><p className="text-xs text-muted-foreground">{t("research.monitor.latestDelta")}</p><p className="mt-0.5 text-base font-bold text-emerald-500">{formatViews(totalLatestDelta)}</p></div>
            <div className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5"><p className="text-xs text-muted-foreground">{t("research.monitor.views48h")}</p><p className="mt-0.5 text-base font-bold">{formatViews(totalViews48h)}</p></div>
          </div>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            {channels.map((channel, index) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                config={channelScanConfigs[channel.id] || DEFAULT_CHANNEL_SCAN_CONFIG}
                customVideoIds={customIds[channel.id] || []}
                loading={loading}
                onOpenSettings={() => openChannelSettings(channel)}
                onScanNow={() => void runResearchScan(true, channel.id).catch(() => undefined)}
                onOpenVideo={setSelectedVideo}
                onRemove={() => removeChannel(index)}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t("research.monitor.dialogTitle")}</DialogTitle>
            <DialogDescription className="text-2xs">{t("research.monitor.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <input autoFocus value={channelInput} onChange={(event) => setChannelInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addChannel(); }} placeholder="@handle or https://youtube.com/@handle" className="h-11 rounded-xl border border-border/60 bg-background px-3 text-2xs outline-none focus:border-primary" />
          <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/15 p-3">
            <div>
              <p className="mb-2 text-xs font-semibold">{t("research.monitor.scanRange")}</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAddConfig((config) => ({ ...config, videoScanMode: "all" }))} className={`h-9 rounded-lg border px-3 text-xs font-medium ${addConfig.videoScanMode === "all" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`}>
                  {t("research.monitor.allChannelVideos")}
                </button>
                <button type="button" onClick={() => setAddConfig((config) => ({ ...config, videoScanMode: "latest" }))} className={`h-9 rounded-lg border px-3 text-xs font-medium ${addConfig.videoScanMode === "latest" ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`}>
                  {t("research.monitor.latestVideos")}
                </button>
              </div>
              {addConfig.videoScanMode === "latest" && (
                <label className="mt-2 flex h-9 items-center justify-between rounded-lg border border-border/60 bg-background px-3 text-xs">
                  <span>{t("research.monitor.latestVideoCount")}</span>
                  <input type="number" min={1} value={addConfig.videosPerChannel} onChange={(event) => setAddConfig((config) => ({ ...config, videosPerChannel: Math.max(1, Math.floor(Number(event.target.value) || 1)) }))} className="w-20 bg-transparent text-right font-semibold outline-none" />
                </label>
              )}
              {addConfig.videoScanMode === "all" && <p className="mt-1.5 text-2xs text-amber-600">{t("research.monitor.allVideosQuotaHint")}</p>}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">{t("research.monitor.videoType")}</p>
              <div className="grid grid-cols-3 gap-2">
                {(["all", "long", "shorts"] as const).map((kind) => (
                  <button key={kind} type="button" onClick={() => setAddConfig((config) => ({ ...config, videoKind: kind }))} className={`h-9 rounded-lg border px-2 text-xs font-medium ${addConfig.videoKind === kind ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background"}`}>
                    {t(kind === "all" ? "research.monitor.allVideoTypes" : kind === "long" ? "research.monitor.longVideos" : "research.monitor.shorts")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>{t("research.common.cancel")}</Button>
            <Button type="button" onClick={addChannel} disabled={!channelInput.trim()}>{t("research.monitor.addAndScan")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(settingsChannel)} onOpenChange={(open) => { if (!open) setSettingsChannel(null); }}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t("research.monitor.channelSettingsTitle", { channel: settingsChannel?.title || "" })}</DialogTitle>
            <DialogDescription className="text-2xs">{t("research.monitor.channelSettingsDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-2xs font-semibold">{t("research.monitor.interval")}</label>
              <select
                value={draftConfig.intervalMinutes}
                onChange={(event) => setDraftConfig((config) => ({ ...config, intervalMinutes: Number(event.target.value) }))}
                className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-2xs"
              >
                <option value={30}>{t("research.monitor.minutes", { count: 30 })}</option>
                <option value={60}>{t("research.monitor.hours", { count: 1 })}</option>
                <option value={180}>{t("research.monitor.hours", { count: 3 })}</option>
                <option value={360}>{t("research.monitor.hours", { count: 6 })}</option>
                <option value={720}>{t("research.monitor.hours", { count: 12 })}</option>
                <option value={1440}>{t("research.monitor.hours", { count: 24 })}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-2xs font-semibold">{t("research.monitor.videoScanMode")}</label>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setDraftConfig((config) => ({ ...config, videoScanMode: "all" }))} className={`h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "all" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}>
                  {t("research.monitor.allChannelVideos")}
                </button>
                <button type="button" onClick={() => setDraftConfig((config) => ({ ...config, videoScanMode: "latest" }))} className={`h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "latest" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}>
                  {t("research.monitor.latestVideos")}
                </button>
                <button type="button" onClick={() => setDraftConfig((config) => ({ ...config, videoScanMode: "custom" }))} className={`h-10 rounded-xl border px-3 text-2xs font-medium ${draftConfig.videoScanMode === "custom" ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}>
                  Custom
                </button>
              </div>
              {draftConfig.videoScanMode === "latest" && (
                <label className="mt-2 flex h-10 items-center justify-between rounded-xl border border-border/60 bg-background px-3 text-2xs">
                  <span>{t("research.monitor.videosPerEachChannel")}</span>
                  <input
                    type="number"
                    min={1}
                    value={draftConfig.videosPerChannel}
                    onChange={(event) => setDraftConfig((config) => ({ ...config, videosPerChannel: Math.max(1, Math.floor(Number(event.target.value) || 1)) }))}
                    className="w-20 bg-transparent text-right font-semibold outline-none"
                  />
                </label>
              )}
              {draftConfig.videoScanMode === "custom" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!settingsChannel) return;
                    const channel = settingsChannel;
                    const index = channels.findIndex((item) => item.id === channel.id);
                    setChannelScanConfig(channel.id, draftConfig);
                    setSettingsChannel(null);
                    if (index >= 0) void openCustomPicker(channel, index);
                  }}
                  className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-border/60 text-2xs font-medium hover:bg-muted/40"
                >
                  {t("research.monitor.chooseVideos")} ({settingsChannel ? (customIds[settingsChannel.id] || []).length : 0})
                </button>
              )}
              {draftConfig.videoScanMode === "all" && <p className="mt-1.5 text-2xs text-amber-600">{t("research.monitor.allVideosQuotaHint")}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-2xs font-semibold">{t("research.monitor.videoType")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["all", "long", "shorts"] as const).map((kind) => (
                  <button key={kind} type="button" onClick={() => setDraftConfig((config) => ({ ...config, videoKind: kind }))} className={`h-10 rounded-xl border px-2 text-2xs font-medium ${draftConfig.videoKind === kind ? "border-primary bg-primary/10 text-primary" : "border-border/60"}`}>
                    {t(kind === "all" ? "research.monitor.allVideoTypes" : kind === "long" ? "research.monitor.longVideos" : "research.monitor.shorts")}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex h-10 items-center justify-between rounded-xl border border-border/60 bg-background px-3 text-2xs">
              <span>{t("research.monitor.autoScan")}</span>
              <input type="checkbox" checked={draftConfig.autoScan} onChange={(event) => setDraftConfig((config) => ({ ...config, autoScan: event.target.checked }))} className="h-4 w-4 accent-primary" />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSettingsChannel(null)}>{t("research.common.cancel")}</Button>
            <Button type="button" onClick={saveChannelSettings}>{t("research.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(catalogChannel)} onOpenChange={(open) => { if (!open) setCatalogChannel(null); }}>
        <DialogContent className="flex max-h-[82vh] max-w-2xl flex-col rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">{t("research.monitor.chooseChannelVideos", { channel: catalogChannel?.title || "" })}</DialogTitle>
            <DialogDescription className="text-2xs">{t("research.monitor.chooseChannelVideosDescription")}</DialogDescription>
          </DialogHeader>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-border/60 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder={t("research.monitor.searchVideos")} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
          </label>
          <div className="min-h-48 flex-1 overflow-y-auto rounded-xl border border-border/60 p-2">
            {catalogLoading ? (
              <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filteredCatalogVideos.map((video) => (
              <label key={video.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={draftCustomIds.includes(video.id)}
                  onChange={(event) => setDraftCustomIds((ids) => event.target.checked ? [...ids, video.id] : ids.filter((id) => id !== video.id))}
                  className="h-4 w-4 accent-primary"
                />
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="h-10 w-16 rounded bg-muted" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{video.title}</span>
                  <span className="text-2xs text-muted-foreground">{formatAge(video.publishedAt, language)} · {formatViews(video.viewCount)} views</span>
                </span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <span className="mr-auto self-center text-2xs text-muted-foreground">{t("research.monitor.selectedVideosCount", { count: draftCustomIds.length })}</span>
            <Button type="button" variant="ghost" onClick={() => setCatalogChannel(null)}>{t("research.common.cancel")}</Button>
            <Button type="button" onClick={saveCustomSelection}>{t("research.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedVideo)} onOpenChange={(open) => { if (!open) setSelectedVideo(null); }}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="pr-8 text-base">{selectedVideo?.title}</DialogTitle>
            <DialogDescription className="text-2xs">{t("research.monitor.videoDetailDescription")}</DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-2xs text-muted-foreground">{t("research.monitor.totalViews")}</p><p className="mt-1 text-lg font-bold">{formatViews(selectedVideo.viewCount)}</p></div>
                <div className="rounded-xl bg-muted/30 p-3" title={selectedLatest ? t("research.monitor.measuredInterval", { count: selectedLatest.deltaViews, minutes: Math.round(selectedLatest.elapsedHours * 60) }) : undefined}><p className="text-2xs text-muted-foreground">{t("research.monitor.latestDelta")}</p><p className="mt-1 text-lg font-bold text-emerald-500">{selectedLatest ? formatViews(selectedLatest.deltaViews) : "—"}</p></div>
                <div className="rounded-xl bg-muted/30 p-3"><p className="text-2xs text-muted-foreground">{t("research.monitor.views48h")}</p><p className="mt-1 text-lg font-bold">{selectedVideo.viewsLast48Hours == null ? "—" : formatViews(selectedVideo.viewsLast48Hours)}</p></div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <HistoryChart history={selectedHistory} />
                {!selectedHistory.length && <p className="mt-3 text-center text-2xs text-amber-500">{t("research.monitor.measureHint")}</p>}
              </div>
              <a href={`https://www.youtube.com/watch?v=${selectedVideo.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-2xs font-medium text-primary hover:underline">
                {t("research.monitor.openOnYouTube")} <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
