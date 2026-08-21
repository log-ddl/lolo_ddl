/**
 * Scene Prompt Generator
 * 
 * Generates prompts for split scenes.
 * 
 * Strategy:
 * 1. If scene has text descriptions (actionSummary, cameraMovement, dialogue),
 *    generate prompts directly from text WITHOUT calling any API.
 * 2. Only fall back to Vision API when scene has NO text descriptions.
 * 
 * Two-tier prompt system:
 * 1. Image Prompt - static description for first-frame image generation
 * 2. Video Prompt - dynamic action description for video generation
 */

export interface ScenePromptRequest {
  storyboardImage: string; // Base64 or URL
  storyPrompt: string;
  scenes: Array<{
    id: number;
    row: number;
    col: number;
    // Optional: existing script data for better context
    actionSummary?: string;
    cameraMovement?: string;
    dialogue?: string;
    // Additional scene description fields
    sceneName?: string;
    sceneDescription?: string;
  }>;
  apiKey: string;
  provider?: string;
  baseUrl?: string;
  model?: string;
}

/**
 * Generated prompts for a single scene with two-tier structure
 */
export interface GeneratedPrompt {
  id: number;

  // === First-Frame Prompt (static) ===
  // For image generation: composition, lighting, character appearance, starting pose
  imagePrompt: string;      // English

  // === Video Prompt (dynamic action) ===
  // For video generation: action process, camera movement, atmosphere change
  videoPrompt: string;      // English

  // Legacy compatibility (maps to videoPrompt)
  prompt: string;
  action?: string;
  camera?: string;
}

/**
 * Check if a scene has enough text description to skip Vision API
 */
function sceneHasTextDescription(scene: ScenePromptRequest['scenes'][0]): boolean {
  const hasAction = !!(scene.actionSummary && scene.actionSummary.trim().length > 5);
  const hasCamera = !!(scene.cameraMovement && scene.cameraMovement.trim().length > 0);
  const hasDialogue = !!(scene.dialogue && scene.dialogue.trim().length > 0);
  const hasSceneDesc = !!(scene.sceneDescription && scene.sceneDescription.trim().length > 5);
  
  // Treat any meaningful script text as valid context for prompt generation.
  return hasAction || hasSceneDesc || hasCamera || hasDialogue;
}

/**
 * Generate prompt from text description (no API call)
 */
function generatePromptFromText(scene: ScenePromptRequest['scenes'][0]): GeneratedPrompt {
  const action = scene.actionSummary || '';
  const camera = scene.cameraMovement || '';
  const dialogue = scene.dialogue || '';
  const sceneDesc = scene.sceneDescription || '';
  const sceneName = scene.sceneName || `Scene ${scene.id}`;
  
  // Build image prompt (static first-frame description)
  const imagePromptParts: string[] = [];
  if (sceneDesc) imagePromptParts.push(sceneDesc);
  if (action) imagePromptParts.push(action);
  const imagePrompt = imagePromptParts.join('. ') || `${sceneName} frame`;
  
  // Build video prompt (dynamic action)
  const videoPromptParts: string[] = [];
  if (action) videoPromptParts.push(action);
  if (camera) videoPromptParts.push(`Camera: ${camera}`);
  if (dialogue) videoPromptParts.push(`Dialogue: "${dialogue.substring(0, 50)}"`);
  const videoPrompt = videoPromptParts.join('. ') || `${sceneName} dynamic shot`;
  
  return {
    id: scene.id,
    // First frame
    imagePrompt,
    // Video
    videoPrompt,
    // Legacy
    prompt: videoPrompt,
    action: action || undefined,
    camera: camera || undefined,
  };
}

/**
 * Generate three-tier prompts for scenes
 * 
 * Strategy:
 * - If ALL scenes have text descriptions → generate from text directly (no API)
 * - If SOME scenes lack descriptions → fall back to Vision API for those
 * 
 * Output structure:
 * - imagePrompt: Static description for the first frame image
 * - videoPrompt: Dynamic action description for video
 */
export async function generateScenePrompts(
  config: ScenePromptRequest
): Promise<GeneratedPrompt[]> {
  const { storyboardImage, storyPrompt, scenes, apiKey, provider = 'unknown', baseUrl, model } = config;

  console.log(`[ScenePromptGenerator] Generating two-tier prompts for ${scenes.length} scenes`);
  
  // Check which scenes have text descriptions
  const scenesWithText = scenes.filter(s => sceneHasTextDescription(s));
  const scenesWithoutText = scenes.filter(s => !sceneHasTextDescription(s));
  
  console.log(`[ScenePromptGenerator] ${scenesWithText.length} scenes have text descriptions, ${scenesWithoutText.length} need Vision API`);
  
  // If ALL scenes have text, generate directly without API
  if (scenesWithoutText.length === 0) {
    console.log('[ScenePromptGenerator] All scenes have text descriptions, generating from text (no API call)');
    return scenes.map(generatePromptFromText);
  }
  
  // If SOME scenes have text, generate those from text first
  const textResults = scenesWithText.map(generatePromptFromText);
  
  // For scenes without text, we need Vision API
  if (scenesWithoutText.length > 0) {
    console.log(`[ScenePromptGenerator] Falling back to Vision API for ${scenesWithoutText.length} scenes`);
    
    // Validate API config only when needed
    const normalizedBaseUrl = baseUrl?.replace(/\/+$/, '');
    if (!normalizedBaseUrl) {
      // If no API configured but some scenes need it, generate placeholder prompts
      console.warn('[ScenePromptGenerator] No Vision API configured, using placeholder for scenes without text');
      const placeholderResults = scenesWithoutText.map(s => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`,
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
    
    if (!model) {
      console.warn('[ScenePromptGenerator] No Vision model configured, using placeholder for scenes without text');
      const placeholderResults = scenesWithoutText.map(s => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`,
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
    
    // Call Vision API for scenes without text
    try {
      const visionResults = await generatePromptsViaVisionAPI(
        storyboardImage,
        storyPrompt,
        scenesWithoutText,
        apiKey,
        provider,
        normalizedBaseUrl,
        model
      );
      return [...textResults, ...visionResults].sort((a, b) => a.id - b.id);
    } catch (error) {
      console.error('[ScenePromptGenerator] Vision API failed, using placeholders:', error);
      const placeholderResults = scenesWithoutText.map(s => ({
        id: s.id,
        imagePrompt: `Scene ${s.id}`,
        videoPrompt: `Scene ${s.id} dynamic shot`,
        prompt: `Scene ${s.id} dynamic shot`,
      }));
      return [...textResults, ...placeholderResults].sort((a, b) => a.id - b.id);
    }
  }
  
  return textResults;
}

/**
 * Generate prompts via Vision API (original implementation)
 */
async function generatePromptsViaVisionAPI(
  storyboardImage: string,
  storyPrompt: string,
  scenes: ScenePromptRequest['scenes'],
  apiKey: string,
  provider: string,
  baseUrl: string,
  model: string
): Promise<GeneratedPrompt[]> {
  console.log(`[ScenePromptGenerator] Calling Vision API for ${scenes.length} scenes using ${provider}`);
  
  const buildEndpoint = (root: string, path: string) => {
    const normalized = root.replace(/\/+$/, '');
    return /\/v\d+$/.test(normalized) ? `${normalized}/${path}` : `${normalized}/v1/${path}`;
  };

  // Build the scene list with optional context
  const sceneList = scenes.map(s => {
    let desc = `- Frame #${s.id}: Position Row ${s.row}, Column ${s.col}`;
    if (s.actionSummary) desc += `\n  Action hint: ${s.actionSummary}`;
    if (s.cameraMovement) desc += `\n  Camera hint: ${s.cameraMovement}`;
    if (s.dialogue) desc += `\n  Dialogue: "${s.dialogue.substring(0, 50)}..."`;
    return desc;
  }).join('\n');

  const systemPrompt = `
# Role
You are a world-class cinematographer with Oscar-winning experience, specializing in AI-assisted filmmaking.

Your Expertise:
- **Visual Language Mastery**: Expert at composition, lighting, framing for every shot
- **Motion Understanding**: Precisely judge when a scene needs controlled endpoints (end frames) for AI video generation
- **AI Video Generation Expert**: Deep knowledge of Seedance, Sora, Runway and other AI video models - know exactly when end frames improve quality
- **Storytelling Through Camera**: Understand how each shot serves the overall narrative

You understand the TWO-TIER PROMPT SYSTEM for video generation:
1. **First Frame Prompt**: STATIC description for generating the starting image
2. **Video Prompt**: DYNAMIC description for the motion/action between frames

# Context
- Input: A storyboard grid containing multiple frames.
- Story Context: "${storyPrompt}"
- Task: For each frame, generate TWO types of prompts.

# Prompt Writing Guidelines

## First Frame Prompt (imagePrompt)
- Describe the STATIC visual: composition, lighting, character appearance, pose
- Focus on WHAT IS VISIBLE in the starting frame
- Example: "A young woman in a red dress stands at the doorway, hand on the doorknob, warm afternoon light streaming through the window."

## Video Prompt (videoPrompt)
- Describe the MOTION and ACTION between first and end frames
- Do NOT describe static appearance (the image provides this)
- Include camera movement if any
- Example: "The woman gently pushes the door open and walks into the room with graceful steps. Camera follows her movement."

# Frames to Analyze
${sceneList}

# Output Format
Return a RAW JSON array with English-only prompt fields.
[
  {
    "id": 1,
    "imagePrompt": "English static first frame description...",
    "videoPrompt": "English action/motion description..."
  },
  {
    "id": 2,
    "imagePrompt": "...",
    "videoPrompt": "..."
  }
]
`;

  // Mock mode for testing without API
  if (apiKey === 'mock' || !apiKey) {
    console.log('[ScenePromptGenerator] Using mock response');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return scenes.map((s) => {
      return {
        id: s.id,
        // First frame (static)
        imagePrompt: `(Mock) A character in scene ${s.id}, composition based on "${storyPrompt}".`,
        // Video action (dynamic)
        videoPrompt: `(Mock) Slow zoom in. Scene ${s.id} action based on "${storyPrompt}".`,
        // Legacy compatibility
        prompt: `(Mock) Slow zoom in. Scene ${s.id} action based on "${storyPrompt}".`,
        action: 'Mock action',
        camera: 'Zoom In'
      };
    });
  }

  try {
    const formattedMessages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          { type: 'image_url', image_url: { url: storyboardImage } }
        ]
      }
    ];

    const endpoint = buildEndpoint(baseUrl, 'chat/completions');
    console.log('[ScenePromptGenerator] Calling chat completion:', { model, hasImage: true, endpoint });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: false,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ScenePromptGenerator] API error:', response.status, errorText);
      
      let errorMessage = `API request failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText && errorText.length < 200) {
          errorMessage = errorText;
        }
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('API key is invalid or expired');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[ScenePromptGenerator] API response received');
    
    const content = data.choices?.[0]?.message?.content || data.content || '';
    
    // Parse JSON from content
    // Handle markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    
    let parsed: any[];
    try {
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('[ScenePromptGenerator] Failed to parse JSON:', content);
      throw new Error('AI response is not valid JSON');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }

    // Validate and map to two-tier prompt result
    const results: GeneratedPrompt[] = parsed.map((item: any) => {
      // Extract prompts with fallbacks
      const imagePrompt = String(item.imagePrompt || item.prompt || '');
      const videoPrompt = String(item.videoPrompt || item.prompt || '');

      return {
        id: Number(item.id),
        // First frame (static)
        imagePrompt,
        // Video action (dynamic)
        videoPrompt,
        // Legacy compatibility (maps to videoPrompt)
        prompt: videoPrompt,
        action: item.action,
        camera: item.camera
      };
    }).filter(p => (p.videoPrompt || p.imagePrompt) && !isNaN(p.id));

    console.log(`[ScenePromptGenerator] Generated ${results.length} two-tier prompts`);

    return results;

  } catch (error) {
    console.error('[ScenePromptGenerator] Vision API Error:', error);
    throw error;
  }
}
