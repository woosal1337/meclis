# @meclis/cli

Install [meclis](https://github.com/woosal1337/meclis) advisors with one command.

Browse the agora: <https://meclis.chele.bi>.

## Quickstart

```bash
bunx @meclis/cli init
bunx @meclis/cli add paul-graham seth-godin robert-greene
```

`npx` works too.

## Commands

| Command | Description |
| --- | --- |
| `meclis add <slug>…` | Install advisors. Aliases (e.g. `pg`) are accepted. |
| `meclis list` | Show installed advisors and versions. |
| `meclis search <query>` | Fuzzy search the agora. |
| `meclis update` | Refresh installed advisors to the latest version. |
| `meclis remove <slug>` | Uninstall. |
| `meclis init` | Create the local skill folders. |

## Flags

- `--sprite-dir <path>` — override sprite write path. Default: `~/Documents/GitHub/meclis/assets/sprites`.
- `--no-sprite` — skip sprite download.
- `-y`, `--yes` — assume yes for overwrite prompts.

## Where files land

```
~/.claude/skills/meclis/advisors/<slug>.md
~/.claude/skills/meclis/advisors/.versions.json
~/Documents/GitHub/meclis/assets/sprites/<slug>.png
```

## License

MIT.
