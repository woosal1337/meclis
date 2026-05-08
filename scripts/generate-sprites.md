# Sprite generation prompt — meclis

Use the [`ce-gemini-imagegen`](../../) skill (Nano Banana Pro) to produce 4-frame
sprite sheets per advisor. Run one prompt per advisor, save as
`assets/sprites/<advisor-id>/{idle,thinking,speaking,listening}.png`.

## Style spec (apply to every prompt)

- 16-bit JRPG / Stardew Valley aesthetic.
- 128×128 px, transparent background, single character framed waist-up.
- Limited palette per character (≤ 8 colors, including outline + 2 shading tones).
- Black 2px outline.
- Eye-line at 1/3 from top.
- No drop shadow.
- Same proportions across all advisors so they feel like the same cast.

## Per-advisor prompt skeleton

> Pixel art portrait of {NAME}, {LIKENESS_DETAILS}, in a 16-bit JRPG style.
> 128×128 px, transparent background, character framed waist-up,
> wearing {OUTFIT_DETAILS}, holding {OPTIONAL_PROP}.
> Single state: {STATE — idle / thinking / speaking / listening}.
> {STATE-SPECIFIC POSE NOTE}.
> 8-color palette, 2px black outline, no drop shadow.

### Robert Greene
- LIKENESS_DETAILS: tall, slim, salt-and-pepper hair, scholarly glasses, dark eyes, contemplative expression
- OUTFIT_DETAILS: charcoal turtleneck under a dark grey blazer
- OPTIONAL_PROP: leatherbound book in left hand
- STATE-SPECIFIC POSES:
  - idle: book held closed at chest, slight tilt of the head
  - thinking: right hand to chin, eyes half-closed
  - speaking: book held open, gesturing with right hand, mouth slightly open
  - listening: head tilted toward speaker, eyebrows slightly raised

### Paul Graham
- LIKENESS_DETAILS: medium build, glasses, light brown hair, friendly intense eyes
- OUTFIT_DETAILS: faded blue button-down, sleeves rolled up
- OPTIONAL_PROP: a black coffee mug
- STATE-SPECIFIC POSES:
  - idle: standing relaxed, mug at hip
  - thinking: head down, mug at lips, looking off to the side
  - speaking: gesturing with empty hand, slight forward lean
  - listening: looking directly at the speaker, slight nod implied

### Seth Godin
- LIKENESS_DETAILS: bald, round wire-rim glasses, warm smile, energetic
- OUTFIT_DETAILS: yellow knit beanie / cap, blue patterned shirt
- OPTIONAL_PROP: a small notebook
- STATE-SPECIFIC POSES:
  - idle: notebook held at waist, slight grin
  - thinking: pen tapping notebook, eyes upward
  - speaking: hand raised palm-up, mid-sentence
  - listening: notebook open, pen ready to jot

## After generation

- Manually inspect for likeness drift across the 4 frames.
- Crop to consistent bounds.
- Place under `assets/sprites/<id>/<state>.png`.
- Update `Character.ts` to load the sprite when `meta.spriteSlug` resolves to a real folder.
