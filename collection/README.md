# collection — the meclis agora

Curated, PR-reviewed character packs for the [`meclis`](https://github.com/woosal1337/meclis) skill.

Browse the live agora: **<https://meclis.chele.bi>**.
Install one with the CLI:

```bash
bunx @meclis/cli add paul-graham
# or
npx @meclis/cli add paul-graham
```

## Layout

```
collection/
├── _schema/
│   └── advisor.schema.json
└── <slug>/
    ├── advisor.md          # the character pack — H1 must equal displayName
    ├── advisor.json        # validated metadata (slug, brief, tags, sources, version)
    ├── sprite.png          # 896×1200 transparent PNG, hero use
    ├── sprite.thumb.png    # 384×512 thumbnail for cards (regenerable)
    └── references.md       # optional bibliography
```

The folder name **must** equal `slug` in `advisor.json`. The H1 of `advisor.md` **must** equal `displayName`. CI rejects PRs that violate either invariant.

## Contributing a new advisor

1. Pick a public thinker. The bar is "enough essays, books, podcasts, and interviews to build a tight pack of their voice." Living people who would loathe the project on principle deserve restraint — meclis is a personal-use tool but the agora is public; use judgment.
2. Pick a slug. Lowercase kebab-case. The folder name and `advisor.json.slug` must match.
3. Write `advisor.md` following the structure in [`docs/authoring-advisors.md`](../docs/authoring-advisors.md). Sections in order: Identity, Philosophy, Voice rules, Frameworks, Quotes, Ethical line. ~8-12k words is the working range.
4. Write `advisor.json` matching [`_schema/advisor.schema.json`](_schema/advisor.schema.json).
5. Add `sprite.png` (896×1200 PNG, transparent background, ~93% canvas fill). Generate via [`scripts/generate-sprites.md`](../scripts/generate-sprites.md) or hand-draw.
6. `bun run generate-thumbs` to produce `sprite.thumb.png`.
7. Optional: `references.md` listing the source material distilled.
8. Open a PR. CI validates the schema, sprite dimensions, slug match, and section presence.

## Versioning

Each advisor is independently versioned via `advisor.json.version`. Bump on substantive edits to the pack so the CLI's `update` command knows when to refresh installed packs.

## Ethical line

Every pack is a model of someone's **public** voice. Use only publicly available material. Do not fabricate quotes — the pack may guide voice but the model still writes the text. The CLI never publishes output as if the actual person said it. The synthesis line at the end of every advisor block makes the imitation explicit.

If a living thinker asks for their pack to be removed, open an issue and we will pull it.
