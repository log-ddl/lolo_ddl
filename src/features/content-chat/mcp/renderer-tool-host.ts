import {
  discoverYouTubeVideos,
  extractYouTubeVideoId,
  loadAllVideoComments,
} from '@/features/research-monitor/lib/youtube-api'
import { useResearchStore } from '@/features/research-monitor/stores/research-store'
import { useContentChatStore } from '../store'

type ToolArguments = Record<string, unknown>

function requiredText(args: ToolArguments, key: string): string {
  const value = typeof args[key] === 'string' ? args[key].trim() : ''
  if (!value) throw new Error(`${key} is required`)
  return value
}

function integer(args: ToolArguments, key: string, fallback: number, min: number, max: number): number {
  const value = Number(args[key] ?? fallback)
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback
}

function youtubeApiKey(): string {
  const key = useResearchStore.getState().apiKey.trim()
  if (!key) throw new Error('YouTube API key is not configured. Add it in Research > Settings, then retry.')
  return key
}

function youtubeUrl(input: string): string {
  const id = extractYouTubeVideoId(input)
  if (!id) throw new Error('Invalid YouTube URL or video ID')
  return `https://www.youtube.com/watch?v=${id}`
}

function plainTextFromSrt(srt: string): string {
  return srt
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^\d+$/.test(line.trim()) && !/-->/.test(line))
    .join('\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

async function searchYouTube(args: ToolArguments) {
  const query = requiredText(args, 'query')
  const kind = args.kind === 'Shorts' || args.kind === 'Live' ? args.kind : 'Long'
  const order = args.order === 'viewCount' ? 'viewCount' : 'relevance'
  const duration = args.duration === 'short' || args.duration === 'medium' || args.duration === 'long'
    ? args.duration
    : undefined
  const limit = integer(args, 'limit', 10, 1, 50)
  const result = await discoverYouTubeVideos(
    youtubeApiKey(),
    query,
    kind,
    undefined,
    typeof args.publishedAfter === 'string' ? args.publishedAfter : undefined,
    typeof args.publishedBefore === 'string' ? args.publishedBefore : undefined,
    order,
    duration,
  )
  return {
    query,
    totalResults: result.totalResults,
    returned: Math.min(limit, result.videos.length),
    videos: result.videos.slice(0, limit).map((video) => ({
      id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      title: video.title,
      channel: video.channelTitle,
      publishedAt: video.publishedAt,
      duration: video.duration,
      kind: video.kind,
      views: video.viewCount,
      likes: video.likeCount,
      comments: video.commentCount,
      subscribers: video.subscriberCount,
      viewsPerHour: video.viewsPerHour,
      outlier: video.outlier,
      description: video.description,
    })),
  }
}

async function getComments(args: ToolArguments) {
  const input = requiredText(args, 'video')
  const id = extractYouTubeVideoId(input)
  if (!id) throw new Error('Invalid YouTube URL or video ID')
  const limit = integer(args, 'limit', 200, 1, 500)
  const comments = await loadAllVideoComments(youtubeApiKey(), id)
  return {
    videoId: id,
    videoUrl: `https://www.youtube.com/watch?v=${id}`,
    totalLoaded: comments.length,
    returned: Math.min(limit, comments.length),
    truncated: comments.length > limit,
    comments: comments.slice(0, limit),
  }
}

async function getTranscript(args: ToolArguments) {
  if (!window.mediaToolkit) throw new Error('Media Toolkit is only available in the desktop app')
  const url = youtubeUrl(requiredText(args, 'video'))
  const jobId = `content-mcp-transcript-${crypto.randomUUID()}`
  const analysis = await window.mediaToolkit.analyze({ jobId, url })
  if (!analysis.success || !analysis.info) throw new Error(analysis.error || 'Unable to inspect this video')
  const preferred = typeof args.language === 'string' ? args.language.trim().toLowerCase() : ''
  const tracks = analysis.info.subtitles
  const track = tracks.find((item) => item.language.toLowerCase() === preferred && !item.automatic)
    || tracks.find((item) => item.language.toLowerCase() === preferred)
    || tracks.find((item) => preferred && item.language.toLowerCase().startsWith(`${preferred}-`))
    || tracks.find((item) => !item.automatic)
    || tracks[0]
  if (!track) throw new Error('This video has no available subtitles or automatic captions')
  const contentState = useContentChatStore.getState()
  const activeConversation = contentState.conversations.find((item) => item.id === contentState.activeConversationId)
  const workspace = await window.contentWorkspace?.ensure(activeConversation?.workspacePath ?? null)
  const result = await window.mediaToolkit.download({
    jobId,
    url,
    kind: 'subtitle',
    outputDirectory: workspace?.path,
    subtitleLanguage: track.language,
    includeAutomatic: true,
  })
  if (!result.success || !result.srt) throw new Error(result.error || 'Unable to download the transcript')
  const includeTimestamps = args.includeTimestamps === true
  return {
    videoId: analysis.info.id,
    videoUrl: url,
    title: analysis.info.title,
    language: track.language,
    automatic: track.automatic,
    format: includeTimestamps ? 'srt' : 'text',
    transcript: includeTimestamps ? result.srt : plainTextFromSrt(result.srt),
    savedFile: result.filePath,
  }
}

async function executeTool(name: string, args: ToolArguments): Promise<unknown> {
  if (name === 'search_youtube') return searchYouTube(args)
  if (name === 'get_youtube_comments') return getComments(args)
  if (name === 'get_youtube_transcript') return getTranscript(args)
  throw new Error(`Unknown tool: ${name}`)
}

export function registerContentMcpToolHost(): () => void {
  if (!window.contentMcp) return () => undefined
  window.contentMcp.ready()
  return window.contentMcp.onToolCall((request) => {
    void executeTool(request.name, request.arguments ?? {})
      .then((result) => window.contentMcp?.respond({ requestId: request.requestId, success: true, result }))
      .catch((error) => window.contentMcp?.respond({
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }))
  })
}
