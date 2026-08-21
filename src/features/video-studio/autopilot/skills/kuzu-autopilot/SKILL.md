---
name: kuzu-csv
description: Turn a Vietnamese or English voice-over script into an animated shot list as one JSON visual plan, planned in gated passes over a sequence/beat/shot hierarchy with reusable character and scene references. Use for faceless science, educational, nature, health, history, and explainer videos built from one still image per shot animated by Veo.
---

# Kuzu CSV

AUTOPILOT_REAL_IMAGE_RESEARCH: disabled

Cut a locked voice-over script into shots, then write reusable character and scene references plus one image prompt and one video prompt per shot.

Use only the providers and pipeline already configured:

- Configured text AI for script analysis and visual planning.
- An image model for character references, scene references, and shot frames.
- Veo for image-to-video generation, one clip per shot.
- The project's own TTS or imported narration audio.
- The editor for assembly, transitions, captions, and music.

The project's visual style block is appended downstream by the pipeline. Never write rendering technique, saturation policy, gradient policy, or design principles into any prompt. Colour is not style and always belongs in the prompt.

Everything required by this skill is contained in this single document. Do not attempt to read external reference files.

## AutoPilot execution contract

AutoPilot supplies locked audio beats with `beatIndex`, `startMs`, `endMs`, `durationSec`, and narration. Treat those beat boundaries, timing, narration, aspect ratio, and project style as authoritative.

This is a non-interactive pipeline. Perform every planning and review pass internally in one response. Never pause, ask a question, request approval, expose an intermediate sequence map, or output a review table.

- Return exactly one shot for every supplied locked beat.
- Preserve every `beatIndex` exactly and keep the original order.
- Never split, merge, omit, duplicate, rewrite, translate, summarize, or return the locked narration.
- Do not return timestamps, voice-over, subtitle text, or clip duration. AutoPilot already owns them and maps each beat to a supported Veo duration.
- AutoPilot generates reusable character references first, reusable scene references second, shot frames third, and Veo image-to-video clips fourth.
- For every shot, AutoPilot passes the matching scene reference plus every matching character reference into image generation.
- After generation, AutoPilot retries failed clips according to Settings, falls back to the generated still when video remains unavailable, then uses FFmpeg to trim clips to the locked audio timeline, apply `transitionToNext`, mix narration/music, add optional subtitles, and render the final MP4.

## Workflow

1. Read the entire locked beat set before planning anything.

2. Take the total video duration, beat timing, and register mix from the input.

3. Use every named register exactly as supplied. If no register is named, use the neutral educational register implied by this document without stopping to ask.

4. Group the locked beats into sequences. One location and one dramatic purpose each.

5. Place every sequence on a link of one narrative arc from the embedded "Sequence, beat, and shot layer" section below.

6. Assign each sequence its scene and its register. Both are sequence-level properties and hold for the whole sequence.

7. Detect recurring characters: any entity appearing visually twice or more, counting pronouns and implied reference. Same entity under different words is one character.

8. Validate the sequence map and character list internally, then continue without exposing them.

9. Mark beats inside each sequence. One beat is one move the story makes.

10. Treat the supplied AutoPilot beats as locked. Never recut them with a script, regex, word counter, or prose judgement.

11. Lay exactly one shot on every locked beat.

12. Preserve each supplied `beatIndex` as the shot key. Do not return narration.

13. Set `shotSize` and `cameraMove` internally, using supplied `durationSec` only to design a feasible motion arc.

14. Run the review table internally without outputting it.

15. Run the animatic check across all locked beats.

16. Fix every issue internally before drawing anything.

17. Write all character references first.

18. Write all scene references second.

19. Write shot prompts last, one `imagePrompt` and one `videoPrompt` per row.

20. Run the frame check on every shot.

21. Rewrite any shot that fails a check. Never ship a failing row with a note.

22. Emit one JSON visual plan and nothing else.

23. Never rewrite, summarize, merge, omit, translate, or reorder the locked narration at any pass.

## Long-form orchestration

- Switch to long-form mode only when the script exceeds roughly eight minutes of narration. Treat eight minutes as a default, not a hard rule.

- Keep shorter scripts on the normal single-pass workflow.

- Lock one authoritative continuity bible before planning any chapter.

- Lock the following for the entire film:

  - Narrative arc.
  - Register mix and its placement across the film.
  - Canonical character names and identity descriptions.
  - Canonical scene names and layouts.
  - Colour language: background hues, subject hues, focal-point convention.
  - Camera grammar: which moves are in use and what each means here.
  - Shot-size grammar: how close the film gets and how rarely.
  - Naming and terminology for recurring objects.

- Split the script into contiguous chapters along sequence boundaries.

- Target roughly three minutes per chapter, staying between two and four minutes wherever a sequence boundary permits.

- Cover every sequence exactly once. Never split a sequence across two chapters.

- Preserve every shot's global `beatIndex` and its locked beat assignment.

- Plan chapters only after the continuity bible is locked.

- Give every chapter pass:

  - The full continuity bible.
  - The closing sequence of the previous chapter.
  - The opening sequence of the next chapter.
  - Only the sequences assigned to that chapter.

- Never allow a chapter pass to:

  - Rewrite narration.
  - Omit or duplicate a shot.
  - Rename a recurring character.
  - Introduce a conflicting character identity.
  - Rename or redesign a recurring scene.
  - Replace the locked colour language.
  - Change the register mix.
  - Introduce a camera move outside the locked grammar.
  - Treat the chapter as an unrelated video.

- Save each completed chapter plan immediately.

- On resume, reuse valid character references, scene references, completed chapter plans, and generated frames. Regenerate only missing or invalid outputs.

- Merge completed chapters back in original `beatIndex` order before emitting the visual plan.

- Run the animatic check on the merged whole, not only per chapter. Pacing faults appear across chapter boundaries.

## Story rules

- Land the hook inside the first beat. Do not spend it on generic setup.

- Stay slightly ahead of the viewer or slightly behind, never level. Level is where boredom lives.

- Ahead means the frame shows something before the narration reaches it, which reads as tension.

- Behind means the viewer sees a thing before the subject in frame does, and the pleasure is watching the subject arrive at what the viewer already knows.

- Withhold a piece of information and reveal it later. That gap is where comedy lives in this form, not in a joke drawn onto the frame.

- Give every cut a motive. A cut exists because the frame can no longer do the job.

- Let an action start in one shot and finish in the next. Sometimes do not show it finish at all, moving on once the beat is clear.

- Keep screen direction across cuts. Something moving right keeps moving right.

- Change screen direction only through a deliberate transition, or the viewer reads it as a new place.

- Spend closeness like money. Cutting close is emphasis, and emphasis spent everywhere buys nothing.

- Do not repeat a camera move on adjacent shots unless a timeline deliberately pans one direction.

- Run each register across a stretch of sequences so the totals land near the shares that were asked for.

- Allow a single shot to stand at a different register from its neighbours. That is often the point.

- Never alternate register continuously row to row. The viewer never settles, and the one extreme frame loses its force.

- Choose `transitionToNext` from the story, not from variety. A hard cut inside a rhythmic sequence, a dissolve between two shots of one beat, a fade at a sequence boundary.

- Do not repeat a flashy transition on adjacent cuts, and end the final shot with `none`.

- Keep the supplied locked narration authoritative for visual interpretation, but never return it in the visual plan.

## Look and motion

Follow the embedded "Image and video prompt guide" section below before producing prompts.

- State the frame as three or four large shapes making one clear visual statement, then subdivide each, then go a level further.

- Never start a prompt from small details. A picture built outward from details has nothing dominating it and gives the eye nowhere to land.

- Make four things readable at a glance:

  - The lines of action.
  - The focal point.
  - The negative shapes that let the whole image be seen.
  - The relative positions of the subjects and the relationship between what each is doing.

- Build depth by layering flat shapes at different scales. Never build depth by shading.

- Frame from the widest action rather than pushing close by default, and leave breathing room. That is what produces clean negative shapes and readable silhouettes.

- Avoid parallels and twinning. Parts of a subject sitting at the same angle, or two subjects mirroring each other, both flatten a frame.

- Assign a colour to every key element, name one background hue, and name the focal point.

- Default every shot to no typography.

- Include an explicit no-text constraint in every `imagePrompt`.

- In every `videoPrompt`, name the subject and the scene by reference instead of describing them again, and spend the words on the action and the camera.

- Allow real motion. What breaks a generation is not movement but movement requiring geometry the frame does not contain.

- Keep one dominant action per clip.

- Keep the same colour and edge language across the whole film while varying composition and palette by beat.

## Character and scene continuity

- Create a character only for entities appearing visually twice or more.

- Exclude one-off subjects, background masses, and anything that never returns. Describe those inline in the shot prompt instead.

- Give every character one stable identity description covering:

  - Overall silhouette and construction.
  - Proportions measured against one named other thing.
  - Resting line of action.
  - Two or three identity markers.
  - Body hue, two or three fills, one accent.

- Do not include in a character description:

  - Background.
  - Temporary action.
  - Scene-specific lighting.
  - Camera movement.
  - Typography.

- State `no face and no facial features` on any subject that does not genuinely have one.

- Give every sequence exactly one scene.

- Route a shot with no physical location to a neighbouring sequence's scene, or to `NeutralStage` when no neighbour fits.

- Always define `NeutralStage` as a plain recessive backdrop for location-less shots.

- Reference characters as `@[Name]` and scenes as `@scene[Name]`.

- Every reference used in a prompt must exist in the `characters` or `scenes` array.

- List in `characterNames` the exact canonical name of every defined character visible in the shot, and nothing else.

- Keep `characterNames` and the `@[Name]` references inside `imagePrompt` in agreement. A character named in one and missing from the other means the pipeline passes the wrong references into generation.

## Required output contract

Return one JSON object containing three top-level arrays: `characters`, `scenes`, and `shots`.

## characters

One entry for every recurring character.

```json
{
  "name": "canonical character name",
  "description": "brief role in the video",
  "characterPrompt": "English reusable reference-sheet prompt"
}
```

- `name`: short, unique, English. Used everywhere as `@[Name]`.
- `description`: one short stable descriptor of what this is.
- `characterPrompt`: ends with `full character reference, plain background, consistent across all shots`.

Return an empty array when the script has no recurring character.

## scenes

One entry for every sequence's location, plus `NeutralStage`.

```json
{
  "name": "canonical scene name",
  "description": "brief location descriptor",
  "scenePrompt": "English reusable background prompt"
}
```

- `name`: short, unique, English. Used everywhere as `@scene[Name]`.
- `scenePrompt`: ends with `full scene reference, no characters, no props, no objects, no text, no labels, no letters, no numbers, no watermark, no temporary action, consistent across all shots`.

## shots

One entry for every shot, in order.

```json
{
  "beatIndex": 1,
  "sceneName": "canonical scene name",
  "characterNames": ["exact canonical name"],
  "imagePrompt": "English static first-frame prompt",
  "videoPrompt": "English motion-only prompt, or empty string to keep the shot static",
  "realImageQuery": "",
  "transitionToNext": "none | fade | dissolve | fade_black | fade_white | wipe_left | wipe_right | wipe_up | wipe_down | slide_left | slide_right | smooth_left | smooth_right | circle_open | circle_close | pixelize | zoom_in"
}
```

- `beatIndex`: exactly matches one supplied locked beat and appears once.
- `sceneName`: exactly matches a `name` in `scenes`. AutoPilot supplies that scene reference to image generation.
- `characterNames`: the exact canonical names of every defined character visible in this shot. Empty array when none is visible. AutoPilot uses this to supply the matching character references.
- `imagePrompt`: five directive blocks, containing `@scene[...]` and every `@[Name]` listed in `characterNames`.
- `videoPrompt`: motion only, ending with the closing motion line and feasible within the supplied `durationSec`. Leave it as `""` for a shot that must stay a still; AutoPilot animates the generated frame with a Ken Burns move instead of an AI video.
- `realImageQuery`: normally empty. Use a precise factual search query only when authentic evidence is essential.
- `transitionToNext`: the cut into the following shot.

## Transitions

- `none`: an intentional hard cut. The default inside a sequence with strong rhythm.
- `dissolve` or `fade`: continuity between two shots of the same beat or the same space.
- `wipe_left`, `wipe_right`, `wipe_up`, `wipe_down`: directional progression, timelines, cause into effect.
- `slide_left`, `slide_right`: lateral movement between two comparable things.
- `smooth_left`, `smooth_right`: restrained flow inside one sequence.
- `fade_black` or `fade_white`: sequence change, time jump, or tonal change.
- `circle_open`, `circle_close`, `pixelize`, `zoom_in`: rare emphasis only.

Do not repeat a flashy transition on adjacent cuts. The final shot must use `none`.

## Output rules

- Return strictly valid JSON.
- No Markdown fences, commentary, notes, preamble, or summary.
- No episodes array, no timing fields, no narration field, no duration field, and no narration alternatives.
- Never return a rewritten, translated, summarized, or copied voice-over.
- Return exactly one shot per supplied beat and no extra top-level arrays.

At pass 14, use this review table only as silent internal reasoning and never include it in the response:

```text
beatIndex | sequence | beat | sceneName | shotSize | cameraMove | durationSec | visualBeat
```

---

# Sequence, beat, and shot layer

## The three tiers

Keep three tiers separate. Collapsing them produces a flat run of interchangeable pictures with nothing standing out.

```text
Sequence  one location and one dramatic purpose
  Beat    one move the story makes
  Shot    one framing of that beat
```

- **In AutoPilot, every locked beat takes exactly one shot and no shot spans two locked beats.**

- If a supplied beat is long, design one readable motion arc for its supplied duration. Never split or duplicate its `beatIndex`.

- Inventing a second idea to justify a second row is the most common way this goes wrong.

- Keep register and scene at the sequence tier. Pushed down to the shot tier they flicker and the film reads as noise.

## Narrative arcs

Choose exactly one arc that matches the subject. A sequence that fits no link of the chosen arc is either two sequences fused or one that should be cut.

### `hook_payoff`

Structure:

Hook â†’ context â†’ build â†’ payoff â†’ final button.

Use as the safe default for general explainer content.

### `story_spine`

Structure:

Once upon a time â†’ every day â†’ one day â†’ because of that â†’ because of that â†’ until finally.

Use for narrative explainers, disasters, and anything with cause running through it.

### `how_it_works`

Structure:

Hook â†’ definition â†’ demonstrated steps â†’ consequence â†’ takeaway.

Use for mechanisms, biology, systems, technology, and processes.

### `timeline`

Structure:

Beginning â†’ major events â†’ turning point â†’ present â†’ takeaway.

Use for history, institutions, discoveries, and chronological stories.

### `man_in_hole`

Structure:

Stable state â†’ fall â†’ worsening â†’ recovery â†’ transformation.

Use for outbreaks, crises, failures, and recoveries.

### `myth_buster`

Structure:

Stated belief â†’ contradiction â†’ evidence â†’ replacement belief â†’ takeaway.

Use for misconceptions, health claims, and contested science.

### `investigation`

Structure:

Anomaly â†’ question â†’ search â†’ discovery â†’ implication.

Use for failure analysis, medical mysteries, and scientific detective stories.

### `three_act`

Structure:

Setup â†’ confrontation â†’ resolution.

Use for long-form documentary narrative.

## Sequences

- One location and one dramatic purpose per sequence.

- An eight-minute video usually yields four to seven sequences.

- End a sequence when the location changes or the story turns to a different purpose.

- Each sequence carries one scene and one register for its whole length.

- Registers come from the input mix. Decide only their placement.

## Beats

- A beat is one move the story makes, not one sentence.

- Several sentences carrying one move are one beat.

- Finding beats is a reading task. A program can count words and find full stops but cannot tell whether the next sentence is still the same move, so it falls back to counting and cuts at arbitrary points.

- Most beats take one shot.

- A beat takes more than one shot when it must establish a space and then land a detail, or when its narration exceeds one clip.

- Prefer wide â†’ detail coverage inside one beat.

## Shot grammar

Use one shot scale per shot.

- `EST_WIDE`: establish where we are and how big things are against each other.
- `WIDE`: full action with breathing room. The default for a beat that has room.
- `MEDIUM`: carries the action and the relationship between subjects.
- `CLOSE`: lands the detail that decides the beat.
- `DETAIL`: one element isolated. The strongest emphasis available.

Cream stirred into coffee needs no close-up. Poison dropped into the same cup does. A column of `CLOSE` is a video with nothing left in reserve.

## Camera moves

Use one camera move per shot.

### `static`

Use for:

- Payoff.
- A statistic or a number.
- A frame that should be read rather than travelled.
- A strong graphic composition that a move would only disturb.

### `push_in`

Use for:

- Focus tightening.
- Tension rising.
- Approaching the detail that decides the beat.

### `pull_out`

Use for:

- Revealing context.
- Showing consequence.
- Closing a sequence.

### `pan`

Use for:

- Timelines.
- Lists and enumerations.
- Geography.
- Lateral comparison between two things.

### `tilt`

Use for:

- Scale.
- Vertical structures.
- A reveal from foundation to outcome.

### `orbit`

Use for:

- Showing a form in the round.
- A slight rotation that reveals a second face of the subject.

### `element`

Use for:

- A locked camera while one element in the frame moves.
- Graphic emphasis without camera movement.

## Motion continuity

- Do not repeat a camera move on adjacent shots unless a timeline deliberately pans one direction.

- Allow real element motion: run, swing, fall, drift, collide, slide, rise, drop, scatter, settle, collapse.

- Never melt, morph, liquefy, stretch, or deform a subject.

- Never open what has no opening, or shatter what has no fragments.

- Keep movement readable and subordinate to the narration.

## Locked beat timing

AutoPilot has already produced narration audio and a timed beat map before this skill runs.

- Use each supplied `durationSec` to judge how much motion can complete naturally.
- Do not output `voiceOver`, `videoLength`, timestamps, or subtitle text.
- Do not split or merge beats to fit Veo. AutoPilot chooses the supported generation length and trims or holds the result against the authoritative audio timeline.
- A short beat needs one concise action. A longer beat may use a slow action with a clear start, development, and settle, still without an internal cut.

## AutoPilot animatic check

Read the internal columns down the page before returning JSON.

- Every supplied `beatIndex` appears exactly once, in order.
- Shot count equals locked beat count.
- Every shot has one valid `sceneName`.
- `shotSize` has rhythm rather than one value repeated.
- `cameraMove` does not repeat on adjacent rows without story reason.
- Register holds across stretches rather than alternating row to row.
- Motion scope fits the supplied beat duration.
- Character and scene references remain canonical across the whole film.

---

# Image and video prompt guide

## Testing any phrase

Ask whether two illustrators working from the phrase alone would draw the same thing.

Where they would not, it records an impression rather than an image and must be replaced with what would actually be drawn: a position, a size, a direction, a state.

Run this hardest on phrases that read as finished, since those sound like description and pass unexamined.

## character_prompt

A reference sheet, not a shot. What matters is that the same character returns identical every time. A vague reference drifts across the film.

Write it in six parts.

### Part 1: Form and construction

Describe the overall silhouette and how the body is built. Measure it against one named other thing so its size is fixed.

### Part 2: Silhouette test

Black the shape out mentally. If it is still clear what this is, the design works. If not, change the shape, not the details.

### Part 3: Line of action

State the imaginary spine running through the body at rest.

This is where emotion comes from on a subject with no face, since a wide range of feeling reads out of the body alone.

Subjects rarely stand straight up and down.

### Part 4: Identity markers

Give two or three concrete details that make this one *this* one.

Find them by naming what would let a viewer confuse it with the nearest similar thing, then fixing that difference.

The answer comes from the subject, so it lands somewhere different every time. Two character prompts built the same way mean the previous row was copied.

### Part 5: Colour

Give a body hue, two or three fills at most, and one accent.

Every shape holds a single hue.

### Part 6: Framing and anchor

State the sheet view, such as front-facing, full body, centered.

Add `no face and no facial features` where it applies.

End with `full character reference, plain background, consistent across all shots`.

## scene_prompt

One scene per sequence. This generates the background every shot in that sequence reuses, so a loose scene means the background jumps between cuts.

Write it in seven parts.

### Part 1: Camera

`wide camera-neutral view of [location]`, plus the default camera height and angle.

Fixing the camera is what makes shots in this scene line up with each other.

### Part 2: Fixed layout

Name at least one permanent landmark and place it: left, centre, right, near, or far.

A landmark that any location of this type would have anchors nothing.

### Part 3: Depth

State what occupies the foreground, the midground, and the background as layered flat shapes at different scales.

### Part 4: Staging area

State the space deliberately left clear for subjects, and where it sits in the frame.

### Part 5: Spatial scale

State how large the space reads against a subject standing in it.

### Part 6: Light direction

State where the light arrives from.

### Part 7: Colour and anchor

Assign the hues the location itself calls for, with the field kept recessive.

End with `full scene reference, no characters, no props, no objects, no text, no labels, no letters, no numbers, no watermark, no temporary action, consistent across all shots`.

Environment only. No characters, no props, no temporary action, no text.

## Finding the pull

Find the hook in the content before thinking about composition.

Read the beat and ask what is already out of proportion in it:

- What is vastly larger than what.
- What sits somewhere it does not belong.
- What is true at this instant and false a second later.
- What is identical to its neighbours except in one respect.

Build the frame on whatever that turns out to be.

The answer usually lands on one of these shapes, which are vocabulary rather than a menu to pick from:

- A collision of scale.
- One element breaking a pattern.
- A process frozen mid-event.
- A warm mass held in a cool field.
- Two things from different worlds sharing a frame calmly.

If what you found maps onto none of them, that is fine and often better.

Two moves push a frame from tense to incomplete:

- Show the consequence and withhold the cause.
- Stop one beat before contact and let the viewer supply the next.

The narration is the explanation. Never draw it into the frame.

If nothing in the beat is out of proportion, leave it alone. Manufactured tension reads as manufactured.

## Camera meaning

- Eye level reads as neutral.

- A low angle puts the subject on a pedestal and reads as power. Pushed further with hard shadow it turns sinister.

- A high angle reads as loss or bewilderment, and shows the subject's place in the space around it.

Choose the angle for the point of the beat, never for variety.

## Contrast

- An object alone in empty space is seen immediately because it contrasts with the emptiness.

- One light shape among dark ones is found before anything is read.

- Complexity attracts the eye, so keep complexity where the attention belongs and away from everywhere else.

## imagePrompt

Write every image prompt as five directive sentences, each opening with a directive verb, so anyone reading the finished prompt can see at a glance whether all five are present.

Melted into one continuous descriptive run it stops being checkable and stops being followed.

### Part 1: Subject and instant

`Show` the scene and character references, what is happening, and the exact instant frozen.

### Part 2: The pull

`Use` the pull, built as a concrete thing in the frame rather than named as a technique.

### Part 3: Composition and depth

`Frame` the dominant subject and how much of the frame it fills.

`Leave` deliberate empty space on one side.

`Use layered flat shapes only:` foreground, midground, background.

### Part 4: Colour

`Use a ... background.` then `Make` the object colours, closing on the focal point and which side runs warm against which cool.

### Part 5: Constraint and intent

End with the constraint line, then `The image should communicate:` one idea grasped in under a second.

```text
Show @scene[...] @[...] ..., frozen at ... .
Use ...: ..., so that ... .
Frame @[...] as the one dominant subject, filling ... . Leave ... . Use layered flat shapes only: ..., ..., and ... .
Use a ... background. Make @[...] ..., with ... as the focal point.
no text, no labels, no letters, no numbers, no captions, no typography, no watermark, no blur, no distortion, no extra limbs, no deformed shapes, no clutter. The image should communicate: ... .
```

## Typography gate

- Default to text-free imagery.

- End every ordinary image prompt with `no text, no labels, no letters, no numbers, no captions, no typography, no watermark, no blur, no distortion, no extra limbs, no deformed shapes, no clutter`.

- Do not add decorative labels, background writing, invented signage, or logos.

- Prefer adding critical wording later as an editor overlay whenever exact spelling or legibility matters.

## Register

Register is not a word to drop into a prompt. `make it funny` directs nothing and fails the same test every other phrase must pass.

It lands inside the existing blocks rather than in a block of its own:

- In how far the exaggeration is pushed and what the line of action is doing, in Part 1.

- In whether the framing sits settled or crowded and how much air is left, in Part 3.

- In how hard the colours run against each other, in Part 4.

If those sentences would read the same at any register, the register was never applied.

## videoPrompt

Veo prompts are built from seven fields: subject, action, setting, lighting and mood, camera, style, and sound.

When a shot must stay a still, return `videoPrompt: ""`. AutoPilot then renders that frame with a Ken Burns move instead of generating an AI video.

The image is already the first frame, so three of those fields shrink to a reference or drop out entirely. Writing them again fights the image.

### Part 1: Subject

Name it as `@[Name]`. Do not describe it.

Naming matters because it tells Veo which thing in the frame is the one that moves.

### Part 2: Action

The field this prompt exists for. Spend the words here.

State what moves, which way, how far, and how fast.

Keep one dominant action per prompt. A single force renders cleaner than several stacked.

The action must use what the frame already contains. A thing may run, swing, fall, drift, collide, or collapse when the parts are visible. Nothing may open where there is no opening, or shatter where there are no fragments.

### Part 3: Setting

`@scene[Name]` only. Do not describe the location again.

### Part 4: Camera

Name the move, its speed, its direction, and the shot-size change it produces.

`cinematic movement` directs nothing. A move becomes an instruction once it says what it travels from and to.

A locked-off camera is a valid choice and is stated explicitly.

For 6s and 8s shots, place the timing bands here.

Set each band boundary by what the viewer should not have seen yet: ask what is still withheld two seconds in, and put the first boundary where that stops being withheld.

Bands derived that way differ from shot to shot. A run of shots sharing one split were copied rather than derived.

### Part 5: Mood, sound, and close

Lighting is fixed in the image, so skip it.

Give one short phrase for pace and feel, matched to the beat's register.

Add ambient sound only where the action itself would make it. No speech, no music.

End with `Smooth natural motion, stable, consistent, clean flat 2D vector animation with smooth solid background.`

```text
The camera [move, speed, direction], going from [shot size] to [shot size]. @[Subject] [action: what moves, which way, how far]. 0-Xs: ...; X-Ys: ...; Y-Zs: ... . [pace and feel]. [ambient sound, if any]. Smooth natural motion, stable, consistent, clean flat 2D vector animation with smooth solid background.
```

Avoid:

- Re-describing the image.
- Several stacked actions.
- Anything not already visible in the frame.
- Transform, assemble, morph, burst, melt.
- An internal cut or a second scene inside one clip.
- Asking the video model to create text.

## Frame check

Run these six questions on every shot. Any question without a clear answer means rewriting the shot.

1. Who is the hero of this frame?

2. Where does the eye land first?

3. Why there? Name the contrast doing it.

4. With the background removed, is the story still readable?

5. Is anything in frame that does not need to be?

6. Shrunk to three centimetres, does it still read?

Then run the mechanical pass:

- No row without a `sceneName`.
- No `imagePrompt` without `@scene[...]`.
- No reference used that was never defined.
- No missing, duplicated, or reordered `beatIndex`.
- No narration, timing, or duration field in the output.
- JSON keys exact and no extra top-level arrays.
