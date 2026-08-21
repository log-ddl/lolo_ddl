import { corsFetch } from "@/features/video-studio/lib/cors-fetch";
import { translate } from "@/shared/i18n";
import { useUIPreferencesStore } from "@/shared/stores/ui-preferences-store";
import type { VideoKind, VideoKindFilter, VideoScanMode, YouTubeChannel, YouTubeComment, YouTubeVideo } from "../types";
import { availableApiKeys, configuredApiKeys, type QuotaBucket, useResearchStore } from "../stores/research-store";

const API_ROOT = "https://www.googleapis.com/youtube/v3";
const rt = (key: string, params?: Record<string, string | number>) => translate(useUIPreferencesStore.getState().uiLanguage, key, params);

interface ApiErrorBody {
  error?: { message?: string; errors?: Array<{ reason?: string }> };
}

interface SearchItem {
  id: { videoId?: string; channelId?: string };
}

export interface DiscoveryPage {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

interface VideoResource {
  id: string;
  snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string; description?: string; tags?: string[]; liveBroadcastContent?: string; thumbnails?: Record<string, { url: string }> };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
  _capturedAt?: number;
}

interface ChannelResource {
  id: string;
  snippet: { title: string; customUrl?: string; thumbnails?: Record<string, { url: string }> };
  statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string; hiddenSubscriberCount?: boolean };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
  _capturedAt?: number;
}

function numberValue(value?: string) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function apiGet<T>(path: string, apiKey: string, params: Record<string, string>): Promise<T> {
  const bucket: QuotaBucket = path === "search" ? "search" : "core";
  const configured = configuredApiKeys();
  const candidates = configured.length ? availableApiKeys(bucket) : apiKey ? [apiKey] : [];
  if (!candidates.length) throw new Error(rt(bucket === "search" ? "research.api.searchQuota" : "research.api.readQuota"));

  let lastMessage = rt("research.api.failed");
  for (const candidate of candidates) {
    const url = new URL(`${API_ROOT}/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set("key", candidate);
    useResearchStore.getState().recordQuotaUsage(candidate, bucket, 1);
    const response = await corsFetch(url);
    if (response.ok) {
      useResearchStore.getState().setActiveApiKey(candidate);
      return response.json() as Promise<T>;
    }
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    const reason = body.error?.errors?.[0]?.reason || "";
    lastMessage = body.error?.message || rt("research.api.httpError", { status: response.status });
    if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"].includes(reason)) {
      useResearchStore.getState().markQuotaExhausted(candidate, bucket);
      continue;
    }
    if (["keyInvalid", "accessNotConfigured", "ipRefererBlocked"].includes(reason)) {
      useResearchStore.getState().markApiKeyInvalid(candidate);
      continue;
    }
    throw new Error(lastMessage);
  }
  throw new Error(lastMessage);
}

async function validateKeyDirectly(apiKey: string) {
  const url = new URL(`${API_ROOT}/videos`);
  url.searchParams.set("part", "id");
  url.searchParams.set("id", "dQw4w9WgXcQ");
  url.searchParams.set("key", apiKey);
  useResearchStore.getState().recordQuotaUsage(apiKey, "core", 1);
  const response = await corsFetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    throw new Error(body.error?.message || rt("research.api.invalidKey"));
  }
}

function bestThumbnail(thumbnails?: Record<string, { url: string }>) {
  return thumbnails?.maxres?.url || thumbnails?.standard?.url || thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || "";
}

function toVideo(resource: VideoResource, channel?: ChannelResource): YouTubeVideo {
  const views = numberValue(resource.statistics?.viewCount);
  const channelViews = numberValue(channel?.statistics?.viewCount);
  const channelVideos = Math.max(1, numberValue(channel?.statistics?.videoCount));
  const channelAverageViews = channelViews / channelVideos;
  const durationParts = resource.contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const durationSeconds = Number(durationParts?.[1] || 0) * 3600 + Number(durationParts?.[2] || 0) * 60 + Number(durationParts?.[3] || 0);
  // Only treat clips <= 60s as Shorts. YouTube reports no aspect ratio here, so a
  // wider threshold (e.g. 3 min) misclassifies ordinary short videos as Shorts and
  // hides them from the Long tab. 60s keeps normal 1-3 min videos in "Long"
  // while genuine Shorts stay in their own section — no overlap between the two.
  const kind = resource.snippet.liveBroadcastContent && resource.snippet.liveBroadcastContent !== "none"
    ? "Live"
    : durationSeconds > 0 && durationSeconds <= 60 ? "Shorts" : "Long";
  return {
    id: resource.id,
    title: resource.snippet.title,
    channelId: resource.snippet.channelId,
    channelTitle: resource.snippet.channelTitle,
    publishedAt: resource.snippet.publishedAt,
    thumbnailUrl: bestThumbnail(resource.snippet.thumbnails),
    duration: resource.contentDetails?.duration || "PT0S",
    viewCount: views,
    likeCount: numberValue(resource.statistics?.likeCount),
    commentCount: numberValue(resource.statistics?.commentCount),
    subscriberCount: channel?.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel?.statistics?.subscriberCount),
    channelAverageViews,
    outlier: channelAverageViews > 0 ? views / channelAverageViews : 0,
    viewsPerHour: 0,
    description: resource.snippet.description || "",
    tags: resource.snippet.tags || [],
    kind,
    capturedAt: resource._capturedAt,
  };
}

async function getVideosByIds(ids: string[], apiKey: string) {
  if (!ids.length) return [];
  const data = await apiGet<{ items?: VideoResource[] }>("videos", apiKey, { part: "snippet,statistics,contentDetails", id: ids.slice(0, 50).join(",") });
  const capturedAt = Date.now();
  return (data.items ?? []).map((item) => ({ ...item, _capturedAt: capturedAt }));
}

async function getChannelsByIds(ids: string[], apiKey: string) {
  if (!ids.length) return [];
  const uniqueIds = [...new Set(ids)].slice(0, 50);
  const data = await apiGet<{ items?: ChannelResource[] }>("channels", apiKey, { part: "snippet,statistics,contentDetails", id: uniqueIds.join(",") });
  const capturedAt = Date.now();
  return (data.items ?? []).map((item) => ({ ...item, _capturedAt: capturedAt }));
}

async function getAllChannelsByIds(ids: string[], apiKey: string) {
  const uniqueIds = [...new Set(ids)];
  const resources: ChannelResource[] = [];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    resources.push(...await getChannelsByIds(uniqueIds.slice(index, index + 50), apiKey));
  }
  return resources;
}

export async function validateYouTubeApiKey(apiKey: string) {
  await validateKeyDirectly(apiKey);
}

export async function discoverYouTubeVideos(apiKey: string, query: string, kind: VideoKind, pageToken?: string, publishedAfter?: string, publishedBefore?: string, order: "relevance" | "viewCount" = "relevance", videoDuration?: "short" | "medium" | "long"): Promise<DiscoveryPage> {
  const searchParams: Record<string, string> = {
    part: "snippet",
    type: "video",
    q: query,
    order,
    maxResults: "50",
    safeSearch: "none",
  };
  if (pageToken) searchParams.pageToken = pageToken;
  if (publishedAfter) searchParams.publishedAfter = publishedAfter;
  if (publishedBefore) searchParams.publishedBefore = publishedBefore;
  // Shorts force short-form; otherwise honour the user's Duration filter.
  if (kind === "Shorts") searchParams.videoDuration = "short";
  else if (videoDuration) searchParams.videoDuration = videoDuration;
  if (kind === "Live") searchParams.eventType = "live";
  const search = await apiGet<{ items?: SearchItem[]; nextPageToken?: string; pageInfo?: { totalResults?: number } }>("search", apiKey, searchParams);
  const videoIds = (search.items ?? []).flatMap((item) => item.id.videoId ? [item.id.videoId] : []);
  const resources = await getVideosByIds(videoIds, apiKey);
  const channels = await getChannelsByIds(resources.map((video) => video.snippet.channelId), apiKey);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  const videos = resources.map((video) => {
    const result = toVideo(video, channelMap.get(video.snippet.channelId));
    return kind === "Live" ? { ...result, kind: "Live" as const } : result;
  });
  return { videos, nextPageToken: search.nextPageToken, totalResults: search.pageInfo?.totalResults || videos.length };
}

export async function loadYouTubeVideosByIds(apiKey: string, ids: string[]): Promise<YouTubeVideo[]> {
  const resources: VideoResource[] = [];
  const uniqueIds = [...new Set(ids)];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    resources.push(...await getVideosByIds(uniqueIds.slice(index, index + 50), apiKey));
  }
  const channels = await getAllChannelsByIds(resources.map((video) => video.snippet.channelId), apiKey);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));
  return resources.map((video) => toVideo(video, channelMap.get(video.snippet.channelId)));
}

function extractChannelId(input: string) {
  return input.match(/UC[\w-]{22}/)?.[0] || "";
}

async function resolveChannel(input: string, apiKey: string): Promise<ChannelResource | undefined> {
  const id = extractChannelId(input);
  if (id) return (await getChannelsByIds([id], apiKey))[0];
  const handle = input.match(/@([\w.-]+)/)?.[1];
  if (handle) {
    const data = await apiGet<{ items?: ChannelResource[] }>("channels", apiKey, { part: "snippet,statistics,contentDetails", forHandle: handle });
    if (data.items?.[0]) return { ...data.items[0], _capturedAt: Date.now() };
  }
  const search = await apiGet<{ items?: SearchItem[] }>("search", apiKey, { part: "id", type: "channel", q: input, maxResults: "1" });
  const channelId = search.items?.[0]?.id.channelId;
  return channelId ? (await getChannelsByIds([channelId], apiKey))[0] : undefined;
}

async function getRecentChannelVideos(channel: ChannelResource, apiKey: string, maxResults: number) {
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  const ids: string[] = [];
  let pageToken = "";
  const loadsAllVideos = maxResults === 0;
  do {
    const remaining = loadsAllVideos ? 50 : Math.min(50, Math.max(1, maxResults - ids.length));
    const params: Record<string, string> = { part: "contentDetails", playlistId, maxResults: String(remaining) };
    if (pageToken) params.pageToken = pageToken;
    const playlist = await apiGet<{ items?: Array<{ contentDetails?: { videoId?: string } }>; nextPageToken?: string }>("playlistItems", apiKey, params);
    ids.push(...(playlist.items ?? []).flatMap((item) => item.contentDetails?.videoId ? [item.contentDetails.videoId] : []));
    pageToken = playlist.nextPageToken || "";
  } while (pageToken && (loadsAllVideos || ids.length < maxResults));

  const resources: VideoResource[] = [];
  for (let index = 0; index < ids.length; index += 50) resources.push(...await getVideosByIds(ids.slice(index, index + 50), apiKey));
  return resources.map((video) => toVideo(video, channel));
}

export async function loadTrackedChannels(
  apiKey: string,
  inputs: string[],
  videosPerChannel = 10,
  customVideoIdsByChannel?: Record<string, string[]>,
  scanOptions?: { mode?: VideoScanMode; kind?: VideoKindFilter },
): Promise<YouTubeChannel[]> {
  const results: YouTubeChannel[] = [];
  for (const input of inputs) {
    const channel = await resolveChannel(input, apiKey);
    if (!channel) continue;
    const customIds = customVideoIdsByChannel?.[channel.id];
    const mode = scanOptions?.mode || (customVideoIdsByChannel ? "custom" : "latest");
    const kind = scanOptions?.kind || "all";
    const requestedCount = mode === "all" ? 0 : videosPerChannel;
    const fetchCount = mode === "latest" && kind !== "all"
      ? Math.max(50, videosPerChannel * 5)
      : requestedCount;
    const loadedVideos = customVideoIdsByChannel
      ? (await getVideosByIds(customIds || [], apiKey)).map((video) => toVideo(video, channel))
      : await getRecentChannelVideos(channel, apiKey, fetchCount);
    const matchingVideos = loadedVideos.filter((video) => (
      kind === "all" || (kind === "long" ? video.kind === "Long" : video.kind === "Shorts")
    ));
    const recentVideos = mode === "latest" ? matchingVideos.slice(0, videosPerChannel) : matchingVideos;
    results.push({
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.id,
      thumbnailUrl: bestThumbnail(channel.snippet.thumbnails),
      subscriberCount: channel.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel.statistics?.subscriberCount),
      viewCount: numberValue(channel.statistics?.viewCount),
      videoCount: numberValue(channel.statistics?.videoCount),
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || "",
      recentVideos,
      recentVelocity: 0,
      capturedAt: channel._capturedAt,
    });
  }
  return results;
}

export async function loadChannelVideoCatalog(apiKey: string, input: string): Promise<YouTubeChannel | undefined> {
  return (await loadTrackedChannels(apiKey, [input], 0, undefined, { mode: "all", kind: "all" }))[0];
}

export function extractYouTubeVideoId(input: string) {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return trimmed.match(/[?&]v=([\w-]{11})/)?.[1]
    || trimmed.match(/youtu\.be\/([\w-]{11})/)?.[1]
    || trimmed.match(/youtube\.com\/(?:shorts|live|embed)\/([\w-]{11})/)?.[1]
    || "";
}

export async function loadCommentChannelVideos(
  apiKey: string,
  input: string,
  onProgress?: (loaded: number) => void,
): Promise<{ channel: YouTubeChannel; videos: YouTubeVideo[] }> {
  const channel = await resolveChannel(input, apiKey);
  if (!channel) throw new Error(rt("research.api.channelNotFound"));
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error(rt("research.api.noPlaylist"));

  const ids: string[] = [];
  let pageToken = "";
  do {
    const params: Record<string, string> = { part: "contentDetails", playlistId, maxResults: "50" };
    if (pageToken) params.pageToken = pageToken;
    const page = await apiGet<{ items?: Array<{ contentDetails?: { videoId?: string } }>; nextPageToken?: string }>("playlistItems", apiKey, params);
    ids.push(...(page.items ?? []).flatMap((item) => item.contentDetails?.videoId ? [item.contentDetails.videoId] : []));
    pageToken = page.nextPageToken || "";
    onProgress?.(ids.length);
  } while (pageToken);

  const videos: YouTubeVideo[] = [];
  for (let index = 0; index < ids.length; index += 50) {
    const resources = await getVideosByIds(ids.slice(index, index + 50), apiKey);
    videos.push(...resources.map((video) => toVideo(video, channel)));
    onProgress?.(videos.length);
  }

  return {
    channel: {
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl || channel.id,
      thumbnailUrl: bestThumbnail(channel.snippet.thumbnails),
      subscriberCount: channel.statistics?.hiddenSubscriberCount ? 0 : numberValue(channel.statistics?.subscriberCount),
      viewCount: numberValue(channel.statistics?.viewCount),
      videoCount: numberValue(channel.statistics?.videoCount),
      uploadsPlaylistId: playlistId,
      recentVideos: videos,
      recentVelocity: 0,
    },
    videos,
  };
}

interface CommentSnippet {
  authorDisplayName?: string;
  authorProfileImageUrl?: string;
  textOriginal?: string;
  textDisplay?: string;
  publishedAt?: string;
  likeCount?: number;
  parentId?: string;
}

function toComment(id: string, videoId: string, snippet: CommentSnippet, isReply: boolean): YouTubeComment {
  return {
    id,
    videoId,
    parentId: snippet.parentId,
    author: snippet.authorDisplayName || rt("research.api.youtubeUser"),
    authorAvatarUrl: snippet.authorProfileImageUrl || "",
    text: snippet.textOriginal || snippet.textDisplay || "",
    publishedAt: snippet.publishedAt || "",
    likeCount: numberValue(String(snippet.likeCount ?? 0)),
    isReply,
  };
}

export async function loadAllVideoComments(
  apiKey: string,
  videoId: string,
  onProgress?: (loaded: number) => void,
): Promise<YouTubeComment[]> {
  const comments: YouTubeComment[] = [];
  let pageToken = "";
  try {
    do {
      const params: Record<string, string> = { part: "snippet,replies", videoId, maxResults: "100", textFormat: "plainText", order: "relevance" };
      if (pageToken) params.pageToken = pageToken;
      const page = await apiGet<{
        items?: Array<{
          id: string;
          snippet: { totalReplyCount?: number; topLevelComment: { id: string; snippet: CommentSnippet } };
          replies?: { comments?: Array<{ id: string; snippet: CommentSnippet }> };
        }>;
        nextPageToken?: string;
      }>("commentThreads", apiKey, params);

      for (const thread of page.items ?? []) {
        comments.push(toComment(thread.snippet.topLevelComment.id, videoId, thread.snippet.topLevelComment.snippet, false));
        const replyCount = thread.snippet.totalReplyCount || 0;
        const inlineReplies = thread.replies?.comments ?? [];
        if (replyCount > 0 && inlineReplies.length >= replyCount) {
          comments.push(...inlineReplies.map((reply) => toComment(reply.id, videoId, reply.snippet, true)));
        } else if (replyCount > 0) {
          let replyPageToken = "";
          do {
            const replyParams: Record<string, string> = { part: "snippet", parentId: thread.snippet.topLevelComment.id, maxResults: "100", textFormat: "plainText" };
            if (replyPageToken) replyParams.pageToken = replyPageToken;
            const replies = await apiGet<{ items?: Array<{ id: string; snippet: CommentSnippet }>; nextPageToken?: string }>("comments", apiKey, replyParams);
            comments.push(...(replies.items ?? []).map((reply) => toComment(reply.id, videoId, reply.snippet, true)));
            replyPageToken = replies.nextPageToken || "";
          } while (replyPageToken);
        }
        onProgress?.(comments.length);
      }
      pageToken = page.nextPageToken || "";
    } while (pageToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : rt("research.api.commentsFailed");
    if (/disabled|commentsDisabled/i.test(message)) throw new Error(rt("research.api.commentsDisabled"));
    throw error;
  }
  return comments;
}
