/**
 * AutoPilot prompt builders and pure planning helpers (no side effects).
 *
 * Extracted from autopilot-engine.ts so the engine only orchestrates stages;
 * new prompt variants or plan normalizers belong here.
 */

import { cleanJsonString, safeParseJson } from '@/features/video-studio/lib/utils/json-cleaner';
import type { VideoLength } from '@/features/video-studio/types/script';
import type { AutoVideoTransition } from '@/features/video-studio/lib/auto-video/types';
import type { AutopilotLongFormBible } from './types';
import type { TimedNarrationBeat } from './narration-timeline';

export const DEFAULT_IMAGE_MODEL = 'GEM_PIX_2';
export const DEFAULT_ASPECT_RATIO = '16:9';
export const DEFAULT_LONG_FORM_THRESHOLD_MINUTES = 8;

export const AUTOPILOT_WRITER_SYSTEM_PROMPT = `Bạn là biên kịch phim tài liệu chuyên nghiệp.

Viết kịch bản tiếng Việt chỉ gồm những khối nội dung sau:
Cảnh N
Hình ảnh: mô tả ngắn ý tưởng hình ảnh
Thuyết minh: lời đọc hoàn chỉnh của cảnh

Yêu cầu:
- Mở bằng một hook mạnh trong câu đầu tiên.
- Lời thuyết minh tự nhiên, chính xác, liền mạch và đủ nghĩa khi ghép thành một audio duy nhất.
- Mỗi dòng Thuyết minh phải chứa lời đọc thật; không để trống và không trộn chỉ dẫn hình ảnh vào lời đọc.
- Không xuất JSON hoặc Markdown code fence.`;

export const AUTOPILOT_SHOT_PLANNER_SYSTEM_PROMPT = `You are a documentary visual director and prompt engineer.

The supplied narration beats and their timestamps are LOCKED. Return exactly one visual plan item for every beat. Never rewrite, summarize, merge, omit, or return narration/timing.

Return strictly valid JSON only:
{
  "characters": [
    {
      "name": "canonical name",
      "description": "brief role in this documentary",
      "characterPrompt": "English reusable visible identity description"
    }
  ],
  "scenes": [
    {
      "name": "canonical scene name",
      "description": "brief stable location descriptor",
      "scenePrompt": "English reusable environment-only reference prompt"
    }
  ],
  "shots": [
    {
      "beatIndex": 1,
      "sceneName": "short scene label",
      "characterNames": ["exact character name when visible"],
      "imagePrompt": "English static first-frame prompt",
      "videoPrompt": "English motion-only image-to-video prompt, or empty string to keep this shot a static image",
      "realImageQuery": "specific broad-web image search query, or empty string",
      "transitionToNext": "none | fade | dissolve | fade_black | fade_white | wipe_left | wipe_right | wipe_up | wipe_down | slide_left | slide_right | smooth_left | smooth_right | circle_open | circle_close | pixelize | zoom_in"
    }
  ]
}

Rules:
- Detect recurring visible subjects that require identity continuity. Follow the creative skill when it defines stylized, faceless, non-human, or human characters. Do not create characters for crowds, places, logos, or one-off generic subjects.
- characterNames must use exact names from characters. Use an empty array for shots without a recurring defined subject.
- characterPrompt must lock stable visible construction and identity markers; no scene/background and no text.
- scenes contains only reusable environments requested by the creative skill. scenePrompt describes an empty environment with stable camera-neutral layout, no characters, no temporary action, and no text.
- sceneName in every shot must exactly match a scenes.name when scenes are returned. Use an empty scenes array only when the creative skill does not require scene references.
- imagePrompt describes only the first frame, composition, subjects, lighting and visual treatment.
- Default imagePrompt to no visible text, typography, letters, numbers, logos, signage, or watermarks. Allow one exact short phrase only when a date, statistic, quote, map label, document title, or chapter card is essential to the beat. Never add decorative headlines.
- videoPrompt describes one continuous camera move and coherent motion only; do not repeat the full appearance.
- Leave videoPrompt as an empty string when a shot should stay a static still. AutoPilot then animates the frame with a Ken Burns move instead of generating an AI video.
- realImageQuery must be an empty string unless REAL IMAGE RESEARCH POLICY in the user prompt is ENABLED. Never infer permission merely because narration mentions a real person, event, place, product, building, document, or object.
- When the policy is ENABLED, follow the creative skill's own research rules. Use a precise query only for shots the skill explicitly justifies; otherwise leave it empty. The real image is supplied before frame generation as an editorial insert, not automatically full-screen.
- transitionToNext directs the edit into the following beat. Use none for an intentional hard cut; otherwise choose a restrained transition that supports the narration. The final shot must use none.
- For Vox editing, prefer hard cuts, dissolve, wipe, slide, and smooth directional transitions. Use fade_black/fade_white for chapter or time changes. Reserve circle, pixelize, and zoom_in for rare emphasis. Never repeat a flashy transition on adjacent cuts.
- Preserve the requested creative skill consistently across all shots.
- Produce no episodes array, no narration/timing fields, no Markdown, and no extra prose.`;

export const AUTOPILOT_LONG_FORM_BIBLE_SYSTEM_PROMPT = `You are the lead director of a long-form documentary. Build one compact continuity bible that every chapter planner must obey.

Return strictly valid JSON only:
{
  "storyArc": "one concise arc",
  "visualTheme": "one authoritative visual language",
  "palette": ["color"],
  "characterRules": ["stable identity rule"],
  "locationRules": ["recurring location rule"],
  "motionRules": ["camera and motion rule"],
  "transitionRules": ["editing rule"],
  "researchRules": ["when factual imagery is justified"],
  "terminology": {"canonical term": "required spelling"}
}

Keep the bible reusable across the entire film. Do not create shots, rewrite narration, or output Markdown.`;

export function buildAutopilotWriterUserPrompt(topic: string, style?: string, skill?: string): string {
  return `Chủ đề video: ${topic}
${style ? `\nGhi chú phong cách:\n${style}` : ''}
${skill ? `\nQuy tắc skill cần áp dụng:\n${skill.slice(0, 14_000)}` : ''}

Viết kịch bản theo đúng cấu trúc được yêu cầu.`;
}

// ==================== Planner response types + normalizers ====================

export interface PlannerItem {
  beatIndex?: number;
  sceneName?: string;
  characterNames?: string[];
  imagePrompt?: string;
  videoPrompt?: string;
  realImageQuery?: string;
  transitionToNext?: string;
}

export interface PlannerCharacter {
  name?: string;
  description?: string;
  characterPrompt?: string;
}

export interface PlannerScene {
  name?: string;
  description?: string;
  scenePrompt?: string;
}

export interface PlannerResponse {
  shots: PlannerItem[];
  characters: PlannerCharacter[];
  scenes: PlannerScene[];
}

export function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 20) : [];
}

export function normalizeLongFormBible(value: unknown): AutopilotLongFormBible {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const terminologySource = record.terminology && typeof record.terminology === 'object'
    ? record.terminology as Record<string, unknown>
    : {};
  return {
    storyArc: String(record.storyArc || 'Hook, context, escalation, turning point, payoff').trim(),
    visualTheme: String(record.visualTheme || 'Cinematic editorial documentary with consistent composition and texture').trim(),
    palette: normalizeStringArray(record.palette),
    characterRules: normalizeStringArray(record.characterRules),
    locationRules: normalizeStringArray(record.locationRules),
    motionRules: normalizeStringArray(record.motionRules),
    transitionRules: normalizeStringArray(record.transitionRules),
    researchRules: normalizeStringArray(record.researchRules),
    terminology: Object.fromEntries(
      Object.entries(terminologySource)
        .map(([key, item]) => [key.trim(), String(item || '').trim()] as const)
        .filter(([key, item]) => key && item)
        .slice(0, 50),
    ),
  };
}

export function safeFileName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9\u00C0-\u024F_-]+/g, '_').replace(/^_+|_+$/g, '') || 'autopilot';
}

export function toFlowDuration(durationMs: number): VideoLength {
  if (durationMs <= 4_000) return 4;
  if (durationMs <= 6_000) return 6;
  return 8;
}

export function parsePlannerResponse(response: string): PlannerResponse {
  const cleaned = cleanJsonString(response);
  const parsed = safeParseJson<unknown>(cleaned, null);
  if (Array.isArray(parsed)) return { shots: parsed as PlannerItem[], characters: [], scenes: [] };
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { shots?: unknown[] }).shots)) {
    const record = parsed as { shots: PlannerItem[]; characters?: PlannerCharacter[]; scenes?: PlannerScene[] };
    return {
      shots: record.shots,
      characters: Array.isArray(record.characters) ? record.characters : [],
      scenes: Array.isArray(record.scenes) ? record.scenes : [],
    };
  }

  // Salvage complete shot objects from a partially malformed response.
  const items: PlannerItem[] = [];
  const objectPattern = /\{[^{}]*"beatIndex"\s*:\s*\d+[^{}]*\}/gu;
  for (const match of cleaned.matchAll(objectPattern)) {
    const item = safeParseJson<PlannerItem>(match[0], {});
    if (item.beatIndex) items.push(item);
  }
  return { shots: items, characters: [], scenes: [] };
}

export function fallbackPlannerItem(beat: TimedNarrationBeat, aspectRatio: string, style?: string): PlannerItem {
  const visualStyle = style?.trim() || 'cinematic editorial documentary';
  return {
    beatIndex: beat.index,
    sceneName: `Beat ${beat.index}`,
    imagePrompt: `${visualStyle}. Static first frame illustrating: ${beat.text}. Clear editorial composition, strong subject separation, ${aspectRatio} aspect ratio.`,
    videoPrompt: 'One smooth continuous slow push-in. Subtle coherent subject and environmental motion, stable composition, natural easing, then gently settles.',
    transitionToNext: (['dissolve', 'wipe_left', 'fade', 'smooth_right', 'slide_left'][beat.index % 5]),
  };
}

const AUTOPILOT_TRANSITIONS = new Set<AutoVideoTransition>([
  'none', 'fade', 'fade_slow', 'dip_white', 'flash_white', 'dissolve',
  'fade_black', 'fade_white', 'wipe_left', 'wipe_right', 'wipe_up', 'wipe_down',
  'slide_left', 'slide_right', 'smooth_left', 'smooth_right', 'circle_open',
  'circle_close', 'pixelize', 'zoom_in',
]);

export function normalizeTransition(value: unknown, index: number, total: number): AutoVideoTransition {
  if (index === total - 1) return 'none';
  if (typeof value === 'string' && AUTOPILOT_TRANSITIONS.has(value as AutoVideoTransition)) {
    return value as AutoVideoTransition;
  }
  const fallbacks: AutoVideoTransition[] = ['dissolve', 'wipe_left', 'fade', 'smooth_right', 'slide_left'];
  return fallbacks[index % fallbacks.length];
}

export function skillAllowsRealImageResearch(skill?: string): boolean {
  const value = String(skill || '');
  const explicitPolicy = /^\s*AUTOPILOT_REAL_IMAGE_RESEARCH\s*:\s*(enabled|disabled|true|false|yes|no)\s*$/im.exec(value)?.[1]?.toLocaleLowerCase();
  if (explicitPolicy) return ['enabled', 'true', 'yes'].includes(explicitPolicy);
  // Backward compatibility for existing skills that already have a dedicated
  // research section. Merely listing realImageQuery in a JSON schema is not permission.
  return /^##\s+Real-image research\s*$/im.test(value)
    && /realImageQuery/i.test(value);
}
