# Contributing to meclis

Thanks for the interest. `meclis` is small and intentionally opinionated, but the surface that benefits most from contributions — new advisors, sprites, themes, and Phase B (mid-turn streaming) — is wide open.

## Getting set up

```bash
git clone git@github.com:woosal1337/meclis.git
cd meclis
pnpm install
pnpm dev:server          # in one terminal
pnpm dev:web             # in another
pnpm install-hooks       # once
```

If you've never set up Claude Code hooks before, the [Quickstart in the README](README.md#quickstart) is the canonical path.

## What we welcome

### New advisor packs

The most valuable kind of contribution. An advisor pack is a single markdown file describing a real or fictional thinker's voice, frameworks, and quotes. The hook script identifies them by the `# <Display Name>` line, so any pack that follows the structure in [`docs/authoring-advisors.md`](docs/authoring-advisors.md) drops in cleanly.

Open a PR with:
- The pack itself (you can host it yourself; we don't ship advisor packs in this repo by design — the user's `~/.claude/skills/meclis/` is theirs).
- A reference to a sprite in the matching pixel-art style (see below).

### Sprites in matching style

The three reference sprites (Paul Graham, Robert Greene, Seth Godin) are 896×1200 PNGs with transparent backgrounds, ~93% canvas fill, detailed pixel-art proportions. New sprites should match.

`scripts/generate-sprites.md` has the Gemini prompt template the existing sprites were built from. You can also draw them by hand. Submit your sprite as `apps/web/public/assets/sprites/<slug>.png`.

### Alternative themes

The current theme is "ancient Greek symposium". The architecture supports swapping the background, palette, and bubble styling for a different setting — Renaissance court, Edo-period tea house, contemporary boardroom, etc. PRs that introduce a `themes/` switch are welcome.

### Phase B — mid-turn streaming

Today the speech bubble fills in only after `PostToolUse` fires. A more lifelike experience would stream tokens as the sub-agent writes them, by tailing the Claude Code session jsonl file at `~/.claude/projects/<project>/<session>.jsonl`. The shape of the events is already defined (`speech_delta`, `thinking_delta` in `packages/shared/src/events.ts`); the tailer is the missing piece.

## Code style

- TypeScript strict mode. No `any` without an explicit reason.
- No comments. Names should carry the meaning. The only acceptable comments are tooling directives (`@ts-ignore`, `eslint-disable`).
- Prettier defaults, two-space indent, single quotes.
- Run `pnpm typecheck` before pushing. CI will reject diffs that don't typecheck.

## Commits

Conventional commit shape, lowercase, present tense, under 70 chars on the subject line:

```
feat(web): focus the most recent speaker by default
fix(server): drain pending events when an advisor joins late
docs(readme): clarify how to add a new advisor
```

PRs that touch user-visible behavior should include a screenshot or short clip of the change.

## Reporting bugs

Open a GitHub issue with:
- Your OS + Node version (`node -v`)
- A reproduction (the `/meclis` invocation that triggered the bug, or a `curl` that synthesizes the same event)
- What you saw vs. what you expected
- Any output from running the hook with `MECLIS_DEBUG=1`

## Code of conduct

Be kind. Disagree about ideas, not people. The goal is a useful tool, not a winning argument.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
