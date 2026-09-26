const text = { type: 'string', minLength: 1 } as const
const ref = { type: 'string', minLength: 1, description: 'An image assetId returned by this MCP, an absolute file path, or an image URL.' } as const
const requestKey = { ...text, description: 'Unique key for this operation. Reuse with identical arguments after a timeout to avoid duplicate generation.' }
const common = {
  requestKey,
  prompt: text,
  model: { ...text, description: 'Model ID from list_media_capabilities. Omit to use the app configuration.' },
  projectId: text,
  aspectRatio: { type: 'string', enum: ['16:9', '9:16', '1:1'] },
}
function tool(name: string, description: string, properties: Record<string, unknown>, required: string[] = []) {
  return { name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false } }
}

export const MEDIA_MCP_TOOLS = [
  tool('list_media_capabilities', 'List image/video models, supported video modes and TTS model readiness. Uses app settings; never returns credentials.', {}),
  tool('generate_image', 'Start image generation using the app. Returns a taskId immediately; poll get_media_task for the assetId. Reuse that assetId as a reference in another image or video request. May consume provider credits.', {
    ...common, references: { type: 'array', items: ref, maxItems: 10 },
  }, ['requestKey', 'prompt']),
  tool('generate_video', 'Start video generation. Returns a taskId; poll get_media_task. The mode is explicit; unsupported combinations are rejected. May consume provider credits.', {
    ...common,
    mode: { type: 'string', enum: ['text-to-video', 'image-to-video', 'reference-to-video'] },
    startImage: ref, endImage: ref,
    references: { type: 'array', items: ref, maxItems: 3 },
    duration: { type: 'integer', enum: [4, 6, 8, 10, 15] },
  }, ['requestKey', 'prompt', 'mode']),
  tool('create_tts_audio', 'Start speech generation through an existing app TTS engine. Choose a built-in voice or clone profile; poll get_media_task for the audio path. May consume provider credits.', {
    requestKey, text, modelId: text,
    mode: { type: 'string', enum: ['clone', 'design', 'auto', 'preset'] },
    voiceId: { ...text, description: 'Built-in voice ID from list_voice_profiles for the selected model.' },
    voiceProfileId: text, referenceAudioPath: text, referenceText: text,
    voiceDesignDescription: text, language: text,
    speed: { type: 'number', minimum: 0.5, maximum: 2 },
  }, ['requestKey', 'text']),
  tool('list_voice_profiles', 'List saved clone profiles and built-in voices for a TTS model, defaulting to the currently selected model. Does not expose API keys.', { modelId: text, language: text }),
  tool('create_voice_profile', 'Save a reusable clone profile using an existing absolute audio file path and its transcript. This does not train or install a model.', {
    requestKey, name: text, modelId: text, referenceAudioPath: text, referenceText: text,
  }, ['requestKey', 'name', 'modelId', 'referenceAudioPath']),
  tool('get_media_task', 'Read task status, progress, error and completed asset. Poll with a delay of a few seconds. A cancellation request can take time to settle.', { taskId: text }, ['taskId']),
  tool('list_media_tasks', 'List the most recent MCP media tasks. Interrupted tasks are not automatically resubmitted.', {}),
  tool('cancel_media_task', 'Request cancellation of an MCP media task. Provider charges already incurred may remain.', { taskId: text }, ['taskId']),
  tool('get_media_asset', 'Get a generated asset by assetId. For images, includePreview returns image content that a vision-capable AI can inspect.', {
    assetId: text, includePreview: { type: 'boolean' },
  }, ['assetId']),
]

// Validate at the execution boundary as well as publishing JSON schemas to clients.
export function validateMediaArguments(name: string, value: unknown): Record<string, unknown> {
  const definition = MEDIA_MCP_TOOLS.find((item) => item.name === name)
  if (!definition) throw new Error(`Unknown media tool: ${name}`)
  const check = (schema: any, input: any, path: string): void => {
    if (schema.type === 'object') {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`${path} must be an object`)
      for (const key of schema.required || []) if (input[key] === undefined) throw new Error(`${key} is required`)
      for (const key of Object.keys(input)) {
        if (!schema.properties[key]) throw new Error(`Unknown argument: ${key}`)
        check(schema.properties[key], input[key], key)
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(input) || input.length > schema.maxItems) throw new Error(`${path} must be an array with at most ${schema.maxItems} items`)
      input.forEach((entry, index) => check(schema.items, entry, `${path}[${index}]`))
    } else {
      const expected = schema.type === 'integer' ? 'number' : schema.type
      if (typeof input !== expected || (expected === 'number' && !Number.isFinite(input))) throw new Error(`${path} must be ${schema.type}`)
      if (schema.type === 'integer' && !Number.isInteger(input)) throw new Error(`${path} must be an integer`)
      if (schema.minLength && !input.trim()) throw new Error(`${path} must not be empty`)
      if (schema.minimum !== undefined && input < schema.minimum || schema.maximum !== undefined && input > schema.maximum) throw new Error(`${path} is out of range`)
      if (schema.enum && !schema.enum.includes(input)) throw new Error(`Unsupported ${path}: ${input}`)
    }
  }
  check(definition.inputSchema, value, 'arguments')
  return value as Record<string, unknown>
}
