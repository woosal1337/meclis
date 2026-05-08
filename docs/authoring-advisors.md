# Authoring an advisor

`meclis` reads its cast from `~/.claude/skills/meclis/advisors/*.md`. Each file is one advisor. The hook that bridges Claude Code into the viewer matches a sub-agent prompt against these files, so the structure matters.

This guide describes the structure used by the three reference advisors (Paul Graham, Seth Godin, Robert Greene) and the conventions the rest of the system relies on.

## File location and slug

```
~/.claude/skills/meclis/advisors/
├── paul-graham.md
├── robert-greene.md
└── seth-godin.md
```

The filename minus `.md` is the **slug** (`paul-graham`). The slug becomes:
- The advisor's id in events
- The default sprite filename (`apps/web/public/assets/sprites/paul-graham.png`)
- The CLI alias the meclis skill maps onto your file

Pick a stable, lowercase, hyphen-separated slug. Don't rename it after release.

## Required structure

Every pack must start with an H1 that is the **display name**:

```markdown
# Paul Graham

> Compiled character pack for the `/meclis` skill...
```

The hook script reads the first 1500 characters of the sub-agent prompt and matches `# Paul Graham` (or `answering AS Paul Graham`) to identify which pack a dispatch belongs to. Without that exact heading, the dispatch is silently skipped and the advisor never appears on stage.

Beyond the H1, the file is free-form markdown. The structure used by the reference packs is below — it's a strong template, but the meclis skill only needs the H1.

## Recommended structure

```markdown
# <Display Name>

> One-line description, optional.

## Identity

A paragraph or two on who they are, when they lived/work, what they're known for, and the kind of question this advisor is best for.

## Philosophy (the spine)

The 3-5 ideas that anchor everything else. Keep it tight; this is the essence.

## Voice rules

The cadence:
- Short, opinionated bullets describing how this person speaks.
- Sentence length, opening moves, closing moves.

The diction:
- Words they prefer.
- Words they avoid.
- Reading level.

The structures:
- Their typical opening, bridging, closing patterns.

### Voice exemplars
> Verbatim quoted paragraph showing the voice.
— [source](https://...)

## Frameworks (top N)

A table of the named ideas they reach for, with one-line statements and when each applies.

| Framework | Statement | When it applies |
|---|---|---|
| ... | ... | ... |

## Approach (thinking moves)

How they engage with a problem. Numbered list of moves.

## Execution (action principles)

What they tell people to actually do. Numbered list.

## Signature quotes

Verbatim quotes with sources. The sub-agent uses these to sharpen its responses without inventing things the advisor never said.

## DO / DON'T (operational rules)

A pair of bullet lists making it explicit what to do and avoid in their voice.

## Mode adaptations

If your meclis skill supports modes (`tweet`, `essay`, `decision`, `review`), describe how this advisor adapts to each.

## Sub-agent priming

The final section with the literal instructions for the sub-agent answering AS this advisor. First-person voice. Frameworks to reach for. Failure modes to avoid.
```

## Sub-agent priming — the most important section

This is the section the meclis skill loads verbatim into each sub-agent. It tells the model:
1. **You ARE this person, not an actor playing them.** First person only.
2. Apply the voice rules at every sentence.
3. Reach for the named frameworks when they apply.
4. Use signature quotes only when they sharpen the point.
5. Close in their characteristic way.
6. Pivot honestly if the question is outside their domain.

The reference packs include this section near the bottom. Copy that pattern.

## Adding a sprite

Sprites are 896×1200 PNGs with transparent background. The character should fill ~93% of the canvas vertically with feet near the bottom. See the three reference sprites in `apps/web/public/assets/sprites/` for the exact style and proportions.

Drop your sprite at `apps/web/public/assets/sprites/<slug>.png`. If you skip the sprite, `meclis` falls back to a deterministic colored silhouette derived from the slug. It's not pretty but the advisor will still appear on stage.

`scripts/generate-sprites.md` contains a Gemini prompt template that produces sprites in the matching style. You can pass two existing sprites as references and the model will match the proportions, palette, and detail level. The repo's own Seth Godin sprite was generated this way, then auto-cropped to match the canvas fill of Paul Graham and Robert Greene.

## Testing your advisor without using tokens

Once your pack is in place, you can synthesize a turn for them via curl, no Claude Code dispatch needed:

```bash
SECRET=local-only-meclis
URL=http://localhost:3001/api/meclis/hooks/event

# turn_start
curl -s "$URL" -H 'content-type: application/json' -d "{
  \"secret\":\"$SECRET\",\"phase\":\"pre-tool\",
  \"advisorId\":\"<your-slug>\",\"displayName\":\"<Your Display Name>\",
  \"userMessage\":\"is this thing on?\"
}"

sleep 2

# turn_complete
curl -s "$URL" -H 'content-type: application/json' -d "{
  \"secret\":\"$SECRET\",\"phase\":\"post-tool\",
  \"advisorId\":\"<your-slug>\",\"displayName\":\"<Your Display Name>\",
  \"fullSpeech\":\"It is. Welcome to the symposium.\"
}"
```

If the bubble appears with their sprite at the correct scale and the codex card lands cleanly, you're done.

## Submitting a pack to the project

The repo doesn't ship advisor packs — that's the user's `~/.claude/skills/meclis/` and we don't want to be the canonical source. But:

- If you've made a pack you're proud of, link it from a public gist or repo and we'll add it to a community list in the README.
- If you've drawn a sprite that fits the visual standard, PRs to `apps/web/public/assets/sprites/` are welcome.
- If you've authored a new mode (e.g. `/meclis debate`), open a PR adjusting the protocol and we'll discuss.
