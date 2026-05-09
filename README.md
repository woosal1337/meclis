<p align="center">
  <img src="assets/banner.png" alt="meclis — a symposium of advisors" />
</p>

<h1 align="center">meclis</h1>

<p align="center">
  A 2D pixel-art viewer for Claude Code's <code>/meclis</code> skill.<br />
  Watch your AI advisors deliberate as characters on a stage.
</p>

<p align="center">
  <a href="https://meclis.chele.bi"><img src="https://img.shields.io/badge/agora-meclis.chele.bi-cf8d4a?style=flat-square" alt="agora"></a>
  <a href="https://www.npmjs.com/package/@meclis/cli"><img src="https://img.shields.io/npm/v/@meclis/cli?style=flat-square&color=cf8d4a&label=cli" alt="cli"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-cf8d4a?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/runtime-claude_code-cf8d4a?style=flat-square" alt="runtime">
</p>

---

## What this is

A local web app that turns Claude Code's `/meclis` invocations into a live, watchable scene. When the skill dispatches a sub-agent for a named advisor — Paul Graham, Robert Greene, Seth Godin, anyone you add — the dispatch is mirrored to a tiny local server through hooks, then streamed to a browser tab where each advisor appears as a 2D character with speech and thought bubbles.

**No `ANTHROPIC_API_KEY`. No orchestration.** Your existing Claude Code subscription does the actual work. `meclis` is a window onto it.

The character cast is read straight from `~/.claude/skills/meclis/advisors/*.md`. Adding an advisor is one file on disk away.

## The agora

The public collection of curated advisor character packs lives at **<https://meclis.chele.bi>** and ships in [`collection/`](collection/) of this repo. Browse, download, contribute via PR.

Install one with the CLI:

```bash
bunx @meclis/cli init                                       # first time only
bunx @meclis/cli add paul-graham seth-godin robert-greene   # bring the seed cast
```

`npx @meclis/cli ...` works too. Full command list at <https://meclis.chele.bi/cli>.

## How it works

```
 ┌─ Claude Code ────────────────┐    ┌─ meclis server ─┐    ┌─ meclis viewer ─┐
 │                              │    │                 │    │                 │
 │  /meclis should I learn Go? │    │   POST          │    │   SSE stream    │
 │       │                      │    │   /api/meclis/  │    │   /api/meclis/  │
 │       ▼                      │    │   hooks/event   │    │   stream        │
 │  Agent  Agent  Agent         │    │                 │    │                 │
 │   PG     SG     RG           │ ─► │   in-memory bus │ ─► │   PIXI scene    │
 │       │                      │    │                 │    │                 │
 │       ▼ PreToolUse hook      │    │                 │    │   parchment     │
 │       ▼ PostToolUse hook     │    │                 │    │   bubbles +     │
 │       ▼ SubagentStop hook    │    │                 │    │   transcript    │
 └──────────────────────────────┘    └─────────────────┘    └─────────────────┘
```

1. You run `/meclis …` in Claude Code.
2. The meclis skill spawns an `Agent` sub-agent per advisor, passing each one the matching character pack from disk.
3. Three hooks installed in `~/.claude/settings.json` (`PreToolUse`, `PostToolUse`, `SubagentStop` with matcher `Agent`) fire on every dispatch. The hook script identifies whether the prompt belongs to a known advisor and, if so, POSTs a small event to `meclis`.
4. The `meclis` server holds an in-memory bus and broadcasts events over SSE. Any browser tab pointed at `http://localhost:5173` is the stage.
5. Characters appear, take a thinking pose, then speak as their answers stream in. Click any character to spotlight their bubble. The codex panel on the right keeps the full transcript.

## Quickstart

> Requires Node 20+, [Bun](https://bun.sh) 1.1+, and an installed `/meclis` skill at `~/.claude/skills/meclis/`.

```bash
git clone git@github.com:woosal1337/meclis.git
cd meclis
bun install

# 1. start the server (any persistent terminal)
bun run dev:server                      # listens on http://localhost:3001

# 2. install the hooks into ~/.claude/settings.json (idempotent, makes a .bak)
bun run install-hooks

# 3. open the viewer (any time, leave the tab open)
bun run dev:web                         # http://localhost:5173

# 4. add advisors from the agora
bunx @meclis/cli add paul-graham seth-godin robert-greene
```

Then in any Claude Code session:

```
/meclis should I raise a seed round now or wait for traction?
```

You'll see the advisors wake up, sit in a thinking pose while the sub-agents work, and type out their answers as the model returns text.

To turn the integration off:

```bash
node scripts/install-hooks.mjs --uninstall
```

## Adding an advisor

Two paths.

**Use one from the agora** (recommended):

```bash
bunx @meclis/cli add <slug>
```

The CLI writes the pack to `~/.claude/skills/meclis/advisors/<slug>.md` and the matching sprite into your local meclis repo.

**Author one from scratch:**

1. Open a PR adding `collection/<slug>/` with `advisor.md`, `advisor.json`, `sprite.png` (896×1200, transparent), and `sprite.thumb.png`.
2. CI validates the schema, sprite dimensions, and required sections.
3. Once merged, the advisor appears at <https://meclis.chele.bi> and is installable via the CLI within a deploy.

Full guide: [`collection/README.md`](collection/README.md) and [`docs/authoring-advisors.md`](docs/authoring-advisors.md).

## Project layout

```
meclis/
├── apps/
│   ├── web/         Vite + React + PixiJS local viewer
│   ├── server/      Hono server with SSE event bus
│   ├── site/        Next.js 14 public agora at meclis.chele.bi
│   └── cli/         @meclis/cli installer
├── packages/
│   └── shared/      Event types shared between web and server
├── collection/      curated character packs (canonical, PR-reviewed)
│   ├── _schema/advisor.schema.json
│   └── <slug>/{advisor.md, advisor.json, sprite.png, sprite.thumb.png}
├── scripts/
│   ├── hooks/agent-event.mjs       hook script Claude Code calls
│   ├── install-hooks.mjs           idempotent settings.json patcher
│   ├── validate-collection.ts      schema + sprite validator (CI)
│   ├── build-collection-index.ts   generates collection/index.json
│   ├── generate-thumbs.ts          regenerate sprite.thumb.png
│   └── generate-sprites.md         Gemini prompt for new advisor sprites
├── assets/                         project banners, audio, stages
└── docs/
    └── authoring-advisors.md       guide for new advisor packs
```

## Configuration

Most things just work. The few env knobs the hook script honors:

| variable | default | purpose |
|---|---|---|
| `MECLIS_URL` | `http://localhost:3001` | where the hook posts events |
| `MECLIS_SECRET` | `local-only-meclis` | shared secret between hook and server |
| `MECLIS_ADVISOR_DIR` | `~/.claude/skills/meclis/advisors` | where advisor packs live |
| `MECLIS_DEBUG` | unset | set to anything to log hook decisions to stderr |
| `MECLIS_RAW_BASE` | `https://raw.githubusercontent.com/woosal1337/meclis/main` | CLI source-of-truth override |

Server env (`apps/server/.env`):

| variable | default | purpose |
|---|---|---|
| `PORT` | `3001` | server port |
| `WEB_ORIGIN` | `http://localhost:5173` | CORS origin for the viewer |
| `ADVISOR_DIR` | `~/.claude/skills/meclis/advisors` | same as above, server-side |

## Resetting the session

1. Click **NEW SESSION** in the viewer header (cleanest).
2. `curl -X POST http://localhost:3001/api/meclis/reset` (no UI required).
3. Restart the server — the in-memory bus resets along with it.

## Production build

```bash
bun run build              # builds every workspace
bun run --filter @meclis/server start
bun run --filter @meclis/web preview
bun run --filter @meclis/site start
```

## Contributing

Issues and PRs welcome. Especially valued:

- **New advisor packs.** The biggest single contribution. See [`collection/README.md`](collection/README.md).
- **Sprites in matching style.** Same style guide as the seed cast.
- **Alternative themes.** Renaissance court, Edo-period tea house, modern boardroom — the architecture supports swapping background, palette, and bubble styling.
- **Phase B mid-turn streaming.** Tail Claude Code's session jsonl to stream tokens as they're written.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## License

MIT — see [LICENSE](LICENSE).
