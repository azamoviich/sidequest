# waitplay

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Play a terminal game while your coding agent works — instead of doomscrolling.**

```bash
waitplay -- claude -p "refactor the auth module" --dangerously-skip-permissions
```

That wraps any one-shot, unattended command — a long agent run, `npm install`, `docker build`, a test suite — and drops you into a game while it runs in the background. The instant it finishes, you get the exit code and output.

## Two modes

**Wrap mode** — for any single command that runs to completion unattended:

```bash
waitplay -- <command> [args...]
```

Works with literally anything: `waitplay -- npm install`, `waitplay -- docker build -t app .`, `waitplay -- claude -p "..." --dangerously-skip-permissions`.

**Watch mode** — a persistent session for interactive coding-agent sessions (Claude Code, Cursor, GitHub Copilot CLI), showing live status instead of "process running / not running":

```bash
waitplay setup   # one-time: wires hooks into your agent(s) of choice
```

After setup, sending your agent a prompt auto-opens a terminal running `waitplay watch`. It shows **● working** while the agent is going, flips to **● needs you!** the moment it's blocked on a permission prompt or waiting on you, and **✓ finished** when it's done — so you know exactly when to switch back, without staring at the other window.

```bash
waitplay watch   # can also be run manually, doesn't require setup
```

## Games

- **Snake** — classic, with difficulty-scaled speed
- **Wordle** — 6 guesses, colored tiles, on-screen keyboard, streak tracking, ~450-word bundled dictionary
- **Geography Quiz** — flags (rendered as real color bands, not emoji — works in every terminal) and capitals
- **History Quiz** — world history trivia

All games persist high scores and settings (sound on/off, difficulty) in `~/.waitplay/`.

## Agent hook support

| Agent | Status | Notes |
|---|---|---|
| Claude Code | ✅ verified | `UserPromptSubmit`/`Stop`/`Notification` hooks, confirmed against official docs |
| Cursor | ⚠️ best-effort | Cursor's `hooks.json` schema (v1.7+) implemented but not independently verified live |
| GitHub Copilot CLI | ⚠️ best-effort | only the "waiting for input" event is documented publicly; start/done aren't |
| Aider / anything else | — | no hook mechanism exists — use **wrap mode** instead, works with any CLI |

`waitplay setup` lets you pick which agent(s) to install for and whether to install globally (every project) or just the current one. It only adds/merges its own hook entries — it won't touch or remove anything else already in your config.

## Install

```bash
git clone https://github.com/azamoviich/waitplay
cd waitplay
npm install
npm run build
npm link   # makes the `waitplay` command available globally
```

## How it's built

- TypeScript + [blessed](https://github.com/chjj/blessed) for the terminal UI
- Zero runtime dependency on any specific agent — wrap mode works with any command via plain process spawning
- Games are a small internal interface (`init/tick/handleKey/render/sidebar`) so adding a new one doesn't touch the menu/runtime code
- SFX are synthesized WAV tones generated at build time (`scripts/gen-sfx.mjs`) — no bundled audio assets, no licensing questions
- Agent hook adapters live under `src/agents/`, each just merges its own JSON hook config non-destructively

## License

MIT — see [LICENSE](LICENSE).
