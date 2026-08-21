export const CONTENT_MCP_TOOLS = [
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
] as const

