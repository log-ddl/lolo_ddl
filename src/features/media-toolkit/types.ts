export type MediaDownloadKind = "video" | "audio" | "subtitle" | "thumbnail";

export interface MediaPlaylistEntry {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
}

export interface MediaPlaylistInfo {
  id: string;
  title: string;
  url: string;
  entries: MediaPlaylistEntry[];
}

export interface MediaSubtitleTrack {
  language: string;
  label: string;
  automatic: boolean;
  formats: string[];
}

export interface MediaSourceInfo {
  id: string;
  url: string;
  webpageUrl: string;
  title: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  extractor?: string;
  subtitles: MediaSubtitleTrack[];
}

export interface MediaToolkitProgress {
  jobId: string;
  stage: "installing" | "analyzing" | "downloading" | "processing" | "done" | "error";
  percent?: number;
  message?: string;
}

export interface MediaDownloadRequest {
  jobId: string;
  url: string;
  kind: MediaDownloadKind;
  outputDirectory?: string;
  quality?: "best" | "1080" | "720" | "480";
  audioFormat?: "mp3" | "m4a" | "wav";
  subtitleLanguage?: string;
  includeAutomatic?: boolean;
  startTime?: string;
  endTime?: string;
  outputSuffix?: string;
}

export interface MediaDownloadResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  srt?: string;
  error?: string;
}

export interface YouTubeProfile {
  id: string;
  name: string;
  createdAt: number;
}
