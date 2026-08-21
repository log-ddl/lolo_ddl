export type ResearchView = "discover" | "monitor" | "comments" | "tools" | "settings";
export type ScanScope = "channels" | "videos" | "all";
export type VideoScanMode = "all" | "latest" | "custom";
export type VideoKindFilter = "all" | "long" | "shorts";

export interface ChannelScanConfig {
  intervalMinutes: number;
  videoScanMode: VideoScanMode;
  videoKind: VideoKindFilter;
  videosPerChannel: number;
  autoScan: boolean;
}
export type VideoKind = "Long" | "Shorts" | "Live";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  subscriberCount: number;
  channelAverageViews: number;
  outlier: number;
  viewsPerHour: number;
  viewsLast48Hours?: number | null;
  measurementCoverage48Hours?: number;
  description?: string;
  tags?: string[];
  kind: VideoKind;
  /** Local timestamp taken immediately after the API response containing this counter arrived. */
  capturedAt?: number;
}

export interface VideoSnapshot {
  videoId: string;
  channelId: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  scannedAt: number;
}

export interface ChannelSnapshot {
  channelId: string;
  viewCount: number;
  scannedAt: number;
}

export interface VphPoint {
  previousScannedAt?: number;
  scannedAt: number;
  viewCount: number;
  deltaViews: number;
  elapsedHours: number;
  vph: number;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  handle: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  uploadsPlaylistId: string;
  recentVideos: YouTubeVideo[];
  recentVelocity: number;
  viewsLast48Hours?: number | null;
  measurementCoverage48Hours?: number;
  /** Local timestamp taken immediately after the API response containing this counter arrived. */
  capturedAt?: number;
}

export interface ScanAudit {
  id: number;
  startedAt: number;
  finishedAt: number;
  scope: ScanScope;
  status: "success" | "partial" | "failed";
  channelCount: number;
  videoCount: number;
  error?: string;
}

export interface YouTubeComment {
  id: string;
  videoId: string;
  parentId?: string;
  author: string;
  authorAvatarUrl: string;
  text: string;
  publishedAt: string;
  likeCount: number;
  isReply: boolean;
}
