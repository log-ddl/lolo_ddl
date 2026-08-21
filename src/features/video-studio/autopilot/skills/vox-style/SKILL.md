---
name: vox-style
description: Plan Vietnamese or English Vox-style documentary and explainer visuals for LONGDD AutoPilot from locked audio beats. Use for biographies, history, business, science, technology, finance, timelines, investigations, and punchy narrated stories needing editorial hierarchy, recurring human identity, restrained factual-image inserts, text-safe frames, living-poster motion, and story-motivated transitions while respecting the project image style selected in Video Studio.
---

# Vox Style for LONGDD AutoPilot

AUTOPILOT_REAL_IMAGE_RESEARCH: enabled

Direct the visual-planning stage of LONGDD AutoPilot. Work from the supplied locked audio beats and produce one complete machine-readable visual plan in a single response.

Do not run the pipeline, rewrite the script, create voice, calculate timestamps, search the web, generate media, render video, ask questions, request approval, or pause between planning passes. AutoPilot performs those operations after receiving the plan.

Everything required by this skill is contained in this file. Never read or request external `references/` files.

## Authority and style precedence

Obey inputs in this order:

1. Locked narration beats, indices, timestamps, and durations are authoritative.
2. The continuity bible and neighbouring chapter context are authoritative in long-form mode.
3. `APP IMAGE STYLE`, when supplied by Video Studio, is the mandatory project-wide rendering style.
4. This skill controls Vox editorial storytelling, hierarchy, composition, factual inserts, motion, and edit rhythm.

When `APP IMAGE STYLE` is non-empty:

- Apply that style consistently to character references and every shot frame.
- Keep Vox composition: bold visual thesis, strong hierarchy, clean negative space, evidence inserts, wide-to-detail rhythm, graphic comparisons, and motivated transitions.
- Do not add paper, newsprint, halftone, risograph, collage, vector, photographic, 3D, or other surface-treatment words that conflict with the selected app style.
- Let AutoPilot append the exact app-style prompt during image generation; do not fight or replace it.

When Video Studio style is `None / Skill Defined`, use the classic Vox surface language defined below: tactile editorial paper collage, torn/scissor-cut layers, restrained tape, halftone, newsprint grain, flat colour, visible paper shadows, and a clear living-poster hierarchy.

## AutoPilot contract

- Receive `LOCKED AUDIO BEATS`; each includes `beatIndex`, `startMs`, `endMs`, `durationSec`, and `narration`.
- Return exactly one shot for every supplied beat.
- Preserve every `beatIndex` exactly and keep the original order.
- Never split, merge, omit, duplicate, translate, paraphrase, summarize, or return narration.
- Never return voice-over, timestamps, duration, subtitles, chapters, episodes, sequences, scene references, or render instructions.
- Do not choose clip length. AutoPilot maps the real audio duration to Flow's supported clip duration and trims it during render.
- Do not output scene or episode arrays. AutoPilot currently consumes only `characters` and `shots`.

## Required output

Return one strict JSON object and nothing else:

```json
{
  "characters": [
    {
      "name": "exact canonical human name",
      "description": "brief stable role in this documentary",
      "characterPrompt": "English reusable visible-identity reference prompt"
    }
  ],
  "shots": [
    {
      "beatIndex": 1,
      "sceneName": "short stable sequence or location label",
      "characterNames": ["exact canonical human name"],
      "imagePrompt": "English static first-frame prompt",
      "videoPrompt": "English motion-only image-to-video prompt, or empty string to keep the shot static",
      "realImageQuery": "precise broad-web factual image query or empty string",
      "transitionToNext": "none | fade | dissolve | fade_black | fade_white | wipe_left | wipe_right | wipe_up | wipe_down | slide_left | slide_right | smooth_left | smooth_right | circle_open | circle_close | pixelize | zoom_in"
    }
  ]
}
```

Output rules:

- Return valid JSON without Markdown fences, commentary, notes, tables, preamble, or trailing commas.
- Keep strings concise enough for long-form chapter planning.
- Return `characters: []` when no recurring named human requires continuity.
- Return exactly as many shot objects as locked beats.
- End the final shot with `transitionToNext: "none"`.

## Internal planning workflow

Perform these passes silently:

1. Read the complete supplied beat set and continuity context.
2. Select one narrative arc that best fits the film.
3. Group adjacent beats mentally into sequences with one dramatic purpose, location logic, palette family, and editorial register.
4. Identify recurring named human subjects and lock canonical identities.
5. Assign one concrete visual thesis to every locked beat.
6. Choose shot scale, camera meaning, real-image need, and transition from the story.
7. Write character prompts first, image prompts second, and video prompts last.
8. Validate beat coverage, identity continuity, style consistency, typography restraint, research restraint, motion feasibility, transition rhythm, and JSON syntax.

## Narrative arcs

Choose exactly one primary arc:

- `hook_payoff` for general explainers; `timeline` for history and biography; `how_it_works` for systems and science; `origin` for founders and inventions.
- `investigation` for mysteries; `man_in_hole` for crises; `myth_buster` for contested claims; `three_act` for long documentary narratives.
- `pas`, `bab`, or `aida` only for promotional stories; `listicle` for ranked or enumerated material.
- Preserve the chosen arc across the whole film instead of treating each sequence as a new story.

## Vox story grammar

Keep three internal layers separate:

```text
Sequence: one location and one dramatic purpose
Beat: one move the narration makes
Shot: one framing of the supplied locked beat
```

AutoPilot has already fixed the beat boundaries. Do not cut them again.

- Make the first visual land as a hook immediately; avoid generic establishing filler.
- Give every frame one instantly readable thesis rather than illustrating every noun in narration.
- Stay slightly ahead of or behind the spoken explanation to create curiosity.
- Use reveal, comparison, consequence, scale, pattern-breaking, or evidence as the reason for a cut.
- Let adjacent shots share screen direction and environmental anchors.
- Use `sceneName` only as a stable planning label. No separate scene reference is generated.
- Repeat concrete location anchors inside image prompts for shots belonging to the same sequence.
- Spend closeness deliberately: use `EST_WIDE` and `WIDE` for context, `MEDIUM` for action and relationships, `CLOSE` for deciding details, and `DETAIL` only for rare emphasis.
- Prefer wide-to-detail rhythm across related beats.
- Do not repeat the same shot scale or camera move mechanically on adjacent shots.

## Camera and motion grammar

Choose one dominant camera idea per shot:

- `static` for payoff or evidence; `push_in` for tightening focus; `pull_out` for context or consequence.
- `pan` for timeline, geography, or comparison; `tilt` for scale; `parallax` for restrained layer depth.
- `element` for a locked camera while one visible element enters, slides, hinges, pulses, or settles.

Use physically possible motion from visible geometry. Paper scraps, arrows, coins, leaves, tape, dots, portraits, maps, charts, and cut-outs may drift, slide, flutter, pulse, hinge, scatter, or settle when they already exist in the first frame.

For a `static` shot, return `videoPrompt: ""`. AutoPilot keeps the generated frame as a still and animates it with a subtle Ken Burns move instead of generating an AI video.

Never melt, morph, liquefy, stretch, deform, grow extra limbs, invent an opening, create fragments that do not exist, rotate a flat poster into deep perspective, or introduce an internal scene cut.

## Character continuity

Create character entries only for recurring named human subjects visible in at least two shots. Exclude crowds, generic people, companies, locations, logos, products, objects, animals, and one-off figures.

For each character:

- Use one exact canonical name everywhere.
- Write one short stable role in `description`.
- Write `characterPrompt` in English as a neutral reusable reference portrait, not a shot.
- Lock approximate age, face shape, skin tone, hair, build, signature clothing, and two or three distinguishing visible markers.
- Use a centered front-facing or three-quarter neutral pose on a plain isolated background.
- Exclude temporary action, scene, typography, watermark, camera movement, and story-specific props.
- When app style is supplied, explicitly preserve that selected style.
- When app style is None, use a clean isolated editorial paper-collage cut-out.
- End with: `full character reference, plain background, no text, consistent across all shots`.

For every shot:

- Put the exact names of all visible defined characters in `characterNames`.
- Use an empty array when none is visible.
- Mention the same canonical people clearly inside `imagePrompt`.
- Never include a name in only one place; AutoPilot uses `characterNames` to select reference images.

## Vox composition

Make four qualities readable immediately:

- One dominant subject or visual claim.
- One focal point with a concrete contrast.
- Negative space that prevents clutter.
- Clear relative positions and actions between subjects.

Build the frame from three or four large shapes before adding small detail. Separate foreground, midground, and background using overlap, scale, colour grouping, and controlled depth. Avoid parallel tangents, mirrored poses, arbitrary decoration, and multiple equally loud focal points.

Use editorial devices only when they clarify the beat:

- Scale collision.
- One element breaking a pattern.
- Before/after or side-by-side comparison.
- Process frozen immediately before contact or consequence.
- Map, timeline, diagram, document, or photographic evidence insert.
- One warm focal element against a cool field, or the reverse.

## Classic Vox surface when app style is None

Lock one restrained palette family across the film. Choose its character from the subject: cream/red/mustard/charcoal newsprint for biography and news; modular two-colour Swiss graphics for systems and finance; black/white plus one spot colour for culture; muted screenprint for history; teal/orange retro-futurism for science; or cream/gold/charcoal for heritage.

Use torn or scissor-cut edges, restrained tape, halftone dots, non-readable newsprint texture, stencil shapes, risograph grain, slight ink misregistration, fold creases, real paper shadows, and layered printed cut-outs. Keep it flat and tactile rather than glossy CGI.

## Image prompt construction

Write each `imagePrompt` as a compact static first-frame instruction containing:

1. The exact frozen instant, location anchors, visible canonical people, and necessary one-off subjects.
2. One concrete visual thesis or editorial device.
3. Dominant-subject framing, frame share, negative space, and foreground/midground/background layout.
4. Limited palette, focal contrast, and either the mandatory app style or the classic Vox surface when app style is None.
5. Typography decision, technical constraints, and one-second communication goal.

Default closing constraint:

`No text, no typography, no letters, no numbers, no captions, no invented newspaper copy, no logo, no signage, no watermark, no blur, no distortion, no deformed anatomy, no clutter.`

### Typography gate

- Default every shot to text-free imagery.
- Permit one exact short phrase only when a date, statistic, quote, map label, document title, verified product wording, or chapter card is essential to the beat.
- Keep text-bearing shots rare and never add decorative headlines, random labels, fake articles, or background writing merely to imitate Vox.
- Prefer subtitles or editor overlays whenever exact spelling and legibility matter.
- When generated text is essential, request one exact phrase of at most six words and prohibit all other visible text.

## Real-image research

Use researched images only when authentic visual evidence materially improves the beat. Normally select roughly 15–25% of shots, never every shot, and avoid adjacent researched shots unless presenting a deliberate evidence sequence.

Good targets include a named real person, historical event, actual place, building, verified product, document, artwork, vehicle, or object explicitly discussed by narration.

For selected shots:

- Write a precise `realImageQuery` containing canonical subject, distinguishing context, and useful visual target.
- In `imagePrompt`, reserve a recognisable cropped photo or paper insert smaller than the main composition.
- Preserve the factual content, face, product shape, label, or document structure of the supplied reference.
- Integrate the insert with restrained border, crop, tape, shadow, or surrounding editorial geometry appropriate to the app style.
- Never invent a source, license, fact, URL, caption, headline, logo, or watermark.
- Never request the research image full-screen unless the narration explicitly calls for a full-frame evidence reveal.

For all other shots, return `realImageQuery: ""`.

If the factual insert contains an important real face or product, keep that insert recognisable. Apply strong stylisation to the surrounding composition rather than destroying identity or verified lettering inside the reference.

## Video prompt construction

The supplied generated image is already the first frame. Animate it; do not redesign it.

When a shot should stay a fully static still (payoff or evidence frames), return `videoPrompt: ""`; AutoPilot renders that frame with a Ken Burns move instead of an AI video.

Each `videoPrompt` must include:

- One canonical moving subject or clearly identified visible element.
- One dominant action with direction, distance, speed, and settle point.
- One camera move with direction and pace, or an explicitly locked camera.
- A continuous motion arc fitting the supplied beat duration without an internal cut.
- Preservation of the first frame's style, palette, layout, identity, edges, materials, and geometry.
- Optional ambient sound only when naturally produced by visible action. No speech and no music.

When intentional text exists in the source frame, keep that region completely stable. Never ask Veo to create, rewrite, or animate text.

End with:

`One continuous living-poster shot, smooth restrained motion, stable identity and geometry, preserve the exact supplied visual style and layout, no morphing, no new text.`

## Transitions

Choose `transitionToNext` independently from Veo motion:

- `none`: intentional rhythmic hard cut; default inside a strong sequence.
- `dissolve` or `fade`: continuity between closely related beats or the same location.
- `wipe_left`, `wipe_right`, `wipe_up`, `wipe_down`: timeline, geography, cause-to-effect, directional progress.
- `slide_left`, `slide_right`, `smooth_left`, `smooth_right`: comparisons and restrained editorial layer movement.
- `fade_black` or `fade_white`: chapter, time, location, or major tonal change.
- `circle_open`, `circle_close`, `pixelize`, `zoom_in`: rare emphasis only.

Preserve screen direction, avoid adjacent flashy transitions, and end the final shot with `none`.

## Long-form continuity

When AutoPilot supplies a continuity bible or chapter context:

- Treat the bible as authoritative for arc, terminology, identity, palette, style, locations, camera, research, and transitions.
- Plan only supplied chapter beats; preserve global indices and canonical names.
- Use neighbouring context to preserve visual and directional continuity.
- Never treat a chapter as a new film or contradict the bible.
- Return only `characters` and `shots`; AutoPilot merges chapters globally.

## Final validation

Before returning JSON, verify:

- Every supplied `beatIndex` appears exactly once and in order.
- Shot count equals locked beat count.
- No narration, timing, duration, scene array, episode, chapter, intermediate table, or extra prose is returned.
- Every `characterNames` value exactly matches a character entry and appears visibly in its image prompt.
- Every shot has one focal point, negative space, stable anchors, and the correct style.
- Ordinary frames prohibit text; research is precise, sparse, and justified.
- Motion is feasible and continuous; transitions do not repeat mechanically.
- The final transition is `none`; output parses as strict JSON.
