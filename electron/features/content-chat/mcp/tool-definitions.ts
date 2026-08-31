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
  {
    name: 'create_tts_audio',
    description: 'Synthesize speech from text using the local OmniVoice TTS engine inside logdd. Returns the generated audio file path and duration.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The text script or narration to speak.' },
        voiceProfileId: { type: 'string', description: 'Optional ID of an existing voice clone profile.' },
        voiceDesignDescription: { type: 'string', description: 'Optional natural language description of voice character if using Voice Design.' },
        speed: { type: 'number', minimum: 0.5, maximum: 2.0, description: 'Speech speed multiplier. Defaults to 1.0.' },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_voice_profiles',
    description: 'List all available voice clone profiles and built-in voices in logdd.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'create_video_project',
    description: 'Create a new video project in Video AI Studio with title, aspect ratio, scenes, image prompts, and narration lines.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the new video project.' },
        aspectRatio: { type: 'string', enum: ['16:9', '9:16', '1:1'], description: 'Video aspect ratio. Defaults to 16:9.' },
        scenes: {
          type: 'array',
          description: 'List of video scenes with visual prompts and narration scripts.',
          items: {
            type: 'object',
            properties: {
              sceneNumber: { type: 'integer', description: 'Scene index.' },
              imagePrompt: { type: 'string', description: 'Detailed prompt for visual image generation.' },
              narration: { type: 'string', description: 'Voice narration script for this scene.' },
              durationSec: { type: 'number', description: 'Estimated scene duration in seconds.' },
            },
            required: ['sceneNumber', 'imagePrompt', 'narration'],
          },
        },
      },
      required: ['title', 'scenes'],
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
] as const
