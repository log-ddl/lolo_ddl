import { MEDIA_MCP_TOOLS } from '../../../../src/features/content-chat/mcp/media-tool-definitions'

const EXISTING_CONTENT_MCP_TOOLS = [
  {
    name: 'search_youtube',
    description: 'Search YouTube using the Research feature already configured in logdd. Use this when the user asks to find videos, topics, Shorts, long videos, or live videos. The YouTube API key is managed by logdd and must never be requested from the user by this tool.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'YouTube search query.' },
        kind: { type: 'string', enum: ['Long', 'Shorts', 'Live'], description: 'Video kind. Defaults to Long.' },
        order: { type: 'string', enum: ['relevance', 'viewCount'], description: 'Sort order. Defaults to relevance.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of videos returned. Defaults to 10.' },
        publishedAfter: { type: 'string', description: 'Optional ISO-8601 lower publication bound.' },
        publishedBefore: { type: 'string', description: 'Optional ISO-8601 upper publication bound.' },
        duration: { type: 'string', enum: ['short', 'medium', 'long'], description: 'Optional YouTube duration filter.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_youtube_comments',
    description: 'Load public comments and replies from one YouTube video using the Comments feature already configured in logdd. Accepts a YouTube URL or video ID. Use the limit to avoid flooding the conversation; the result also reports the total number loaded.',
    inputSchema: {
      type: 'object',
      properties: {
        video: { type: 'string', description: 'YouTube video URL or 11-character video ID.' },
        limit: { type: 'integer', minimum: 1, maximum: 500, description: 'Maximum comments returned. Defaults to 200.' },
      },
      required: ['video'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_youtube_transcript',
    description: 'Get the transcript/captions of one YouTube video through the Media Toolkit already available in logdd. It supports creator subtitles and automatic captions. Accepts a YouTube URL or video ID.',
    inputSchema: {
      type: 'object',
      properties: {
        video: { type: 'string', description: 'YouTube video URL or 11-character video ID.' },
        language: { type: 'string', description: 'Preferred caption language code such as vi, en, or en-US. If omitted, the best available track is selected.' },
        includeTimestamps: { type: 'boolean', description: 'Return SRT timestamps instead of plain transcript text. Defaults to false.' },
      },
      required: ['video'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_system_resource_metrics',
    description: 'Check current system CPU usage %, RAM memory, and running background media/AI processes.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  { name: 'get_media_capabilities', description: 'List supported providers and exact model IDs before generating images or videos.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  ...(['generate_image', 'generate_video'] as const).map((name) => ({
    name,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    description: 'Start a media generation job using an already configured logdd account. May consume provider credits. Returns a taskId; poll get_media_task for progress and output. Ask the user before spending credits. App must remain open.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', minLength: 1, maxLength: 20000 },
        provider: { type: 'string', enum: ['googleflow'] },
        model: { type: 'string', description: 'Model identifier supported by the provider. Required; call get_media_capabilities for supported IDs.' },
        aspectRatio: { type: 'string', enum: ['16:9', '9:16', '1:1'] },
        duration: { type: 'number', minimum: 1, maximum: 30 },
        startImage: { type: 'string', description: 'Optional local image path or URL for image-to-video.' },
      },
      required: ['prompt', 'model'], additionalProperties: false,
    },
  })),
  ...(['get_media_task', 'cancel_media_task'] as const).map((name) => ({
    name, description: name === 'get_media_task' ? 'Read progress, errors and output URLs for a media job. Poll every 5 seconds. Jobs last for this app session.' : 'Cancel a media job started through MCP.',
    inputSchema: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'], additionalProperties: false },
  })),
] as const

export const CONTENT_MCP_TOOLS = [
  ...EXISTING_CONTENT_MCP_TOOLS.filter((tool) => !MEDIA_MCP_TOOLS.some((mediaTool) => mediaTool.name === tool.name)),
  ...MEDIA_MCP_TOOLS,
]
