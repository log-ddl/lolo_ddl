import { useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, Download, KeyRound, Loader2, MessageSquareText, Search, Users } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { extractYouTubeVideoId, loadAllVideoComments, loadCommentChannelVideos, loadYouTubeVideosByIds } from "../../lib/youtube-api";
import { formatAge, formatViews } from "../../lib/format";
import { useResearchStore } from "../../stores/research-store";
import type { YouTubeChannel, YouTubeComment, YouTubeVideo } from "../../types";

type Mode = "video" | "channel";
type CommentSort = "youtube" | "likes" | "newest" | "oldest";

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: unknown[][]) {
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

function safeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "youtube";
}

function commentsCsvRows(comments: YouTubeComment[], videos: YouTubeVideo[], headers: string[], replyLabel: string, commentLabel: string) {
  const videoMap = new Map(videos.map((video) => [video.id, video]));
  return [
    headers,
    ...comments.map((comment) => {
      const video = videoMap.get(comment.videoId);
      return [video?.title, `https://www.youtube.com/watch?v=${comment.videoId}`, video?.description, video?.tags?.join(" | "), comment.author, comment.isReply ? replyLabel : commentLabel, comment.publishedAt, comment.likeCount, comment.text];
    }),
  ];
}

function CommentList({ comments, videos }: { comments: YouTubeComment[]; videos: YouTubeVideo[] }) {
  const { language, locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CommentSort>("youtube");
  const videoMap = useMemo(() => new Map(videos.map((video) => [video.id, video])), [videos]);
  const threads = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    const parents = comments.filter((comment) => !comment.isReply);
    const repliesByParent = new Map<string, YouTubeComment[]>();
    comments.filter((comment) => comment.isReply).forEach((reply) => {
      if (!reply.parentId) return;
      repliesByParent.set(reply.parentId, [...(repliesByParent.get(reply.parentId) || []), reply]);
    });
    return parents
      .map((parent, originalIndex) => ({ parent, replies: repliesByParent.get(parent.id) || [], originalIndex }))
      .filter(({ parent, replies }) => !normalized || [parent, ...replies].some((comment) => `${comment.author} ${comment.text} ${videoMap.get(comment.videoId)?.title || ""}`.toLocaleLowerCase("vi").includes(normalized)))
      .sort((a, b) => sort === "youtube" ? a.originalIndex - b.originalIndex : sort === "likes" ? b.parent.likeCount - a.parent.likeCount : sort === "newest" ? Date.parse(b.parent.publishedAt) - Date.parse(a.parent.publishedAt) : Date.parse(a.parent.publishedAt) - Date.parse(b.parent.publishedAt));
  }, [comments, query, sort, videoMap]);
  const visibleCount = threads.reduce((total, thread) => total + 1 + thread.replies.length, 0);

  return (
    <div className="mt-5 rounded-xl border border-border/60 bg-card/70">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
        <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background px-3"><Search className="h-3.5 w-3.5 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("research.comments.filterPlaceholder")} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></div>
        <select value={sort} onChange={(event) => setSort(event.target.value as CommentSort)} className="h-9 rounded-xl border border-border/60 bg-background px-3 text-2xs"><option value="youtube">{t("research.comments.youtubeOrder")}</option><option value="likes">{t("research.comments.mostLiked")}</option><option value="newest">{t("research.comments.newest")}</option><option value="oldest">{t("research.comments.oldest")}</option></select>
        <span className="text-2xs text-muted-foreground">{visibleCount.toLocaleString(locale)} / {comments.length.toLocaleString(locale)}</span>
      </div>
      <div className="max-h-[460px] divide-y divide-border/40 overflow-y-auto">
        {threads.slice(0, 200).map(({ parent, replies }) => <div key={parent.id} className="p-3"><div className="flex gap-3"><div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">{parent.authorAvatarUrl && <img src={parent.authorAvatarUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-2xs font-semibold">{parent.author}</span><span className="text-2xs text-muted-foreground">{formatAge(parent.publishedAt, language)}</span><span className="text-2xs text-primary">♥ {formatViews(parent.likeCount)}</span></div>{videos.length > 1 && <p className="mt-0.5 truncate text-2xs text-muted-foreground">{videoMap.get(parent.videoId)?.title}</p>}<p className="mt-1 whitespace-pre-wrap text-2xs leading-relaxed">{parent.text}</p></div></div>{replies.length > 0 && <div className="ml-11 mt-2 space-y-2 border-l border-border/60 pl-3">{replies.map((reply) => <div key={reply.id} className="flex gap-2.5 py-1"><div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">{reply.authorAvatarUrl && <img src={reply.authorAvatarUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2"><span className="text-2xs font-semibold">{reply.author}</span><span className="text-2xs text-muted-foreground">{formatAge(reply.publishedAt, language)}</span><span className="text-2xs text-primary">♥ {formatViews(reply.likeCount)}</span></div><p className="mt-0.5 whitespace-pre-wrap text-2xs leading-relaxed">{reply.text}</p></div></div>)}</div>}</div>)}
        {!threads.length && <p className="p-8 text-center text-xs text-muted-foreground">{t("research.comments.noMatch")}</p>}
        {threads.length > 200 && <p className="p-3 text-center text-2xs text-muted-foreground">{t("research.comments.displayLimit")}</p>}
      </div>
    </div>
  );
}

export function CommentsView() {
  const { language, locale, t } = useI18n();
  const apiKey = useResearchStore((state) => state.apiKey);
  const [mode, setMode] = useState<Mode>("video");
  const [input, setInput] = useState("");
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [channelLimit, setChannelLimit] = useState(10);

  const resetResult = () => { setVideo(null); setChannel(null); setVideos([]); setComments([]); setError(""); setMessage(""); };
  const switchMode = (next: Mode) => { setMode(next); setInput(""); resetResult(); };

  const analyzeVideo = async () => {
    if (!apiKey) return;
    const id = extractYouTubeVideoId(input);
    if (!id) { setError(t("research.comments.videoInvalid")); return; }
    setLoading(true); resetResult(); setMessage(t("research.comments.loadingVideo"));
    try {
      const found = (await loadYouTubeVideosByIds(apiKey, [id]))[0];
      if (!found) throw new Error(t("research.comments.videoNotFound"));
      setVideo(found); setVideos([found]); setMessage(t("research.comments.loadingComments"));
      const loaded = await loadAllVideoComments(apiKey, id, (count) => setMessage(t("research.comments.loadedComments", { count: count.toLocaleString(locale) })));
      setComments(loaded); setMessage(t("research.comments.done", { count: loaded.length.toLocaleString(locale) }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("research.comments.videoFailed")); setMessage(""); }
    finally { setLoading(false); }
  };

  const loadChannel = async () => {
    if (!apiKey || !input.trim()) return;
    setLoading(true); resetResult(); setMessage(t("research.comments.loadingChannel"));
    try {
      const result = await loadCommentChannelVideos(apiKey, input, (count) => setMessage(t("research.comments.foundVideos", { count: count.toLocaleString(locale) })));
      setChannel(result.channel); setVideos(result.videos); setMessage(t("research.comments.channelReady", { count: result.videos.length.toLocaleString(locale) }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("research.comments.channelFailed")); setMessage(""); }
    finally { setLoading(false); }
  };

  const fetchChannelComments = async () => {
    const targets = videos.slice(0, channelLimit === 0 ? videos.length : channelLimit).filter((item) => item.commentCount > 0);
    if (!targets.length) return;
    setLoading(true); setError(""); setComments([]);
    const collected: YouTubeComment[] = [];
    try {
      for (let index = 0; index < targets.length; index += 1) {
        const target = targets[index];
        setMessage(t("research.comments.processing", { current: index + 1, total: targets.length, title: target.title }));
        try { collected.push(...await loadAllVideoComments(apiKey, target.id)); }
        catch (cause) { if (cause instanceof Error && !/tắt bình luận|comments are disabled/i.test(cause.message)) throw cause; }
        setComments([...collected]);
      }
      setMessage(t("research.comments.channelDone", { comments: collected.length.toLocaleString(locale), videos: targets.length }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("research.comments.allFailed")); }
    finally { setLoading(false); }
  };

  const exportComments = () => {
    if (!comments.length) return;
    downloadCsv(`${safeFilename(video?.title || channel?.title || "youtube")}_comments.csv`, commentsCsvRows(comments, videos, [t("research.comments.csvVideo"), t("research.comments.csvVideoUrl"), t("research.comments.csvDescription"), "Tags", t("research.comments.csvAuthor"), t("research.comments.csvType"), t("research.comments.csvPublished"), t("research.common.likes"), t("research.comments.csvComment")], t("research.comments.csvReply"), t("research.comments.csvComment")));
  };

  const exportMetadata = () => {
    if (!videos.length) return;
    downloadCsv(`${safeFilename(channel?.title || "youtube")}_videos.csv`, [[t("research.comments.csvTitle"), "URL", t("research.comments.csvPublished"), t("research.common.views"), t("research.common.likes"), t("research.common.comments"), t("research.comments.csvDescription"), "Tags"], ...videos.map((item) => [item.title, `https://www.youtube.com/watch?v=${item.id}`, item.publishedAt, item.viewCount, item.likeCount, item.commentCount, item.description, item.tags?.join(" | ")])]);
  };

  if (!apiKey) return <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><KeyRound className="mb-3 h-9 w-9 text-amber-500" /><p className="text-sm font-semibold">{t("research.common.noApi")}</p><p className="mt-1 text-xs text-muted-foreground">{t("research.comments.noApiHint")}</p></div>;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5 lg:px-7">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 inline-flex rounded-xl bg-muted/50 p-1"><button type="button" onClick={() => switchMode("video")} className={`h-8 rounded-lg px-4 text-xs font-semibold ${mode === "video" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{t("research.comments.single")}</button><button type="button" onClick={() => switchMode("channel")} className={`h-8 rounded-lg px-4 text-xs font-semibold ${mode === "channel" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{t("research.comments.channel")}</button></div>
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm"><h2 className="text-sm font-semibold">{t(mode === "video" ? "research.comments.singleTitle" : "research.comments.channelTitle")}</h2><p className="mt-1 text-2xs text-muted-foreground">{t(mode === "video" ? "research.comments.singleHint" : "research.comments.channelHint")}</p><div className="mt-4 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !loading) void (mode === "video" ? analyzeVideo() : loadChannel()); }} placeholder={mode === "video" ? "https://youtube.com/watch?v=..." : "https://youtube.com/@handle"} className="h-10 min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary" /><button type="button" disabled={loading || !input.trim()} onClick={() => void (mode === "video" ? analyzeVideo() : loadChannel())} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{t(mode === "video" ? "research.comments.analyze" : "research.comments.loadChannel")}</button></div>{message && <p className="mt-3 text-2xs text-primary">{message}</p>}{error && <p className="mt-3 flex items-center gap-1.5 text-2xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}</div>

        {video && <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-4 sm:flex-row"><img src={video.thumbnailUrl} alt="" className="aspect-video w-full rounded-xl object-cover sm:w-64" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{video.title}</h3><p className="mt-1 text-2xs text-muted-foreground">{video.channelTitle} · {formatAge(video.publishedAt, language)}</p><div className="mt-3 flex flex-wrap gap-2 text-2xs"><span className="rounded-lg bg-muted/60 px-2.5 py-1.5">{formatViews(video.viewCount)} {t("research.common.views")}</span><span className="rounded-lg bg-muted/60 px-2.5 py-1.5">{formatViews(video.likeCount)} {t("research.common.likes")}</span><span className="rounded-lg bg-muted/60 px-2.5 py-1.5">{t("research.comments.publicComments", { count: formatViews(video.commentCount) })}</span></div>{comments.length > 0 && <button type="button" onClick={exportComments} className="mt-4 flex h-9 items-center gap-2 rounded-xl border border-primary/40 px-3 text-2xs font-semibold text-primary"><Download className="h-3.5 w-3.5" />{t("research.comments.exportFull")}</button>}</div></div>}

        {channel && <div className="mt-5 rounded-xl border border-border/60 bg-card/70 p-4"><div className="flex flex-wrap items-center gap-3"><img src={channel.thumbnailUrl} alt="" className="h-12 w-12 rounded-full object-cover" /><div><h3 className="text-sm font-semibold">{channel.title}</h3><p className="mt-0.5 text-2xs text-muted-foreground">{t("research.comments.loadedVideoCount", { subscribers: formatViews(channel.subscriberCount), videos: videos.length.toLocaleString(locale) })}</p></div><div className="ml-auto flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={exportMetadata}><Download className="h-3.5 w-3.5" />{t("research.comments.metadataCsv")}</Button>{comments.length > 0 && <button type="button" onClick={exportComments} className="flex h-9 items-center gap-2 rounded-xl border border-primary/40 px-3 text-2xs font-semibold text-primary"><Download className="h-3.5 w-3.5" />{t("research.comments.commentsCsv")}</button>}</div></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4"><label className="text-2xs text-muted-foreground">{t("research.comments.collectFrom")}</label><select value={channelLimit} onChange={(event) => setChannelLimit(Number(event.target.value))} className="h-9 rounded-xl border border-border/60 bg-background px-3 text-2xs"><option value={10}>{t("research.comments.latestVideos", { count: 10 })}</option><option value={25}>{t("research.comments.latestVideos", { count: 25 })}</option><option value={50}>{t("research.comments.latestVideos", { count: 50 })}</option><option value={0}>{t("research.comments.allVideos")}</option></select><button type="button" disabled={loading || !videos.length} onClick={() => void fetchChannelComments()} className="flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-2xs font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}{t("research.comments.fetch")}</button><span className="ml-auto flex items-center gap-1 text-2xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{t("research.comments.quotaWarning")}</span></div></div>}

        {comments.length > 0 && <CommentList comments={comments} videos={videos} />}
      </div>
    </section>
  );
}
