import blessed from "blessed";
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { games, menuEntries, type Game, type GameGroup } from "./games/index.js";
import { tickIntervalFor } from "./games/snake.js";
import { loadConfig, saveConfig, type Config, type Difficulty } from "./config.js";
import { getHighScore, maybeSaveHighScore } from "./highscore.js";
import { playSfx, setSoundEnabled } from "./sound.js";
import type { CommandResult } from "./runner.js";
import { readStatus, heartbeatWatcher, type AgentStatus } from "./status.js";
import { touchDailyStreak, addProductiveMs } from "./progress.js";
import { getTriviaQuestions } from "./games/data/opentdb.js";
import { LIBRARY_BOOKS, searchBooks } from "./games/data/gutendex.js";
import { buildReaderGame } from "./games/reader.js";

type RunOptions =
  | {
      kind: "wrap";
      commandLabel: string;
      resultPromise: Promise<CommandResult>;
      killCommand: () => void;
      onExit: (result: CommandResult | null) => void;
    }
  | {
      kind: "watch";
      onExit: () => void;
    };

const STATUS_LABEL: Record<AgentStatus, string> = {
  working: "{green-fg}● working{/green-fg}",
  waiting: "{yellow-fg}{bold}● needs you!{/bold}{/yellow-fg}",
  done: "{green-fg}{bold}✓ finished{/bold}{/green-fg}",
};

const GAME_THEME: Record<string, string> = {
  snake: "green",
  wordle: "magenta",
  "trivia-mixed": "yellow",
  "trivia-movies": "red",
  "trivia-music": "cyan",
  "trivia-science": "blue",
  "trivia-geography": "blue",
  "coding-frontend": "cyan",
  "coding-backend": "cyan",
  "coding-nodejs": "cyan",
  "coding-algorithms": "cyan",
  "coding-git": "cyan",
  "debug-javascript": "red",
  "debug-python": "red",
  "debug-sql": "red",
  "debug-git": "red",
  "debug-algorithms": "red",
  "debug-linux": "red",
  "debug-regex": "red",
  "debug-http": "red",
  "debug-docker": "red",
  "crypto-base64": "green",
  "crypto-caesar": "green",
  "crypto-rot13": "green",
  "crypto-hashid": "green",
};

for (const book of LIBRARY_BOOKS) {
  GAME_THEME[`library-${book.id}`] = "magenta";
}
GAME_THEME["progress"] = "green";
GAME_THEME["daily-challenge"] = "yellow";

const RAINBOW = ["red", "yellow", "green", "cyan", "blue", "magenta"];

// Fixed content width, centered on screen via left:'center' — keeps the
// layout readable and intentional on wide terminals instead of stretching
// text edge-to-edge, and keeps every screen (menu/settings/game) visually
// consistent with each other.
const CONTENT_WIDTH = 78;

// sound, difficulty, auto-open, run setup, back
const SETTINGS_ROW_COUNT = 5;

function rainbowText(text: string): string {
  return [...text].map((ch, i) => (ch === " " ? " " : `{${RAINBOW[i % RAINBOW.length]}-fg}{bold}${ch}{/bold}{/${RAINBOW[i % RAINBOW.length]}-fg}`)).join("");
}

type Mode =
  | { kind: "menu"; index: number }
  | { kind: "submenu"; group: GameGroup; index: number }
  | { kind: "settings"; index: number }
  | {
      kind: "game";
      game: Game<any>;
      state: any;
      ctx: { difficulty: Difficulty; rng: () => number };
      highScore: number;
      elapsedSec: number;
      done: boolean;
      tickMs: number | null;
      flashUntil: number;
    };

/**
 * A single blessed.screen and a single set of screen.key() bindings live for
 * the whole process. screen.key() attaches to the screen itself, not to the
 * widgets it draws — so if every menu/game transition registered its own
 * handlers, old handlers never got removed and kept firing against stale
 * state (this bit us once already). Instead we keep one `mode` ref and
 * dispatch on it; transitions just swap `mode` and redraw.
 *
 * The menu/settings screens are hand-rolled colored Box content rather than
 * blessed.list — List's per-item tag parsing is unreliable/unverified without
 * a live TTY to test against, whereas Box.setContent with tags is proven to
 * work correctly (as long as the color name is real — "dim-fg" isn't one,
 * that was an earlier bug; the valid set is black/red/green/yellow/blue/
 * magenta/cyan/white/grey plus light/bright variants).
 */
export function runGameUI(opts: RunOptions): void {
  const screen = blessed.screen({ smartCSR: true, title: "sidequest" });
  const config = loadConfig();
  setSoundEnabled(config.sound);
  touchDailyStreak();

  // Kick off Trivia's live fetch immediately, before the user has even
  // looked at the menu — by the time they navigate to it and pick it, it's
  // usually already resolved (or well underway) instead of starting cold.
  // Only prefetch "mixed" (the most commonly picked category) — prefetching
  // all five would mean five parallel requests on every launch for four the
  // user probably won't even open this session.
  getTriviaQuestions("mixed", config.difficulty).catch(() => {}); // failure handled by the game's own fallback path when it actually asks

  let commandFinished = false;
  let finishedResult: CommandResult | null = null;
  if (opts.kind === "wrap") {
    opts.resultPromise.then((result) => {
      commandFinished = true;
      finishedResult = result;
    });
  }

  const commandLabel = () => (opts.kind === "wrap" ? opts.commandLabel : liveStatusAgent ?? "no agent connected");

  let mode: Mode = { kind: "menu", index: 0 };
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let liveStatus: AgentStatus | null = null;
  let liveStatusAgent: string | null = null;
  let statusPollTimer: ReturnType<typeof setInterval> | null = null;
  let workingSince: number | null = null; // timestamp productive-waiting accrual started, or null if not currently accruing

  const flushProductiveTime = () => {
    if (workingSince !== null) {
      addProductiveMs(Date.now() - workingSince);
      workingSince = null;
    }
  };

  const exitApp = () => {
    flushProductiveTime();
    if (opts.kind === "wrap") {
      if (!commandFinished) opts.killCommand();
    }
    if (tickTimer) clearInterval(tickTimer);
    if (statusPollTimer) clearInterval(statusPollTimer);
    screen.destroy();
    if (opts.kind === "wrap") opts.onExit(finishedResult);
    else opts.onExit();
  };

  const goToMenu = () => {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    mode = { kind: "menu", index: 0 };
    renderMenu();
  };

  const goToSettings = () => {
    mode = { kind: "settings", index: 0 };
    renderSettings();
  };

  const goToSubmenu = (group: GameGroup) => {
    mode = { kind: "submenu", group, index: 0 };
    renderSubmenu();
  };

  // Live search across the full Gutenberg catalog (~70k books), not just the
  // curated Library list — uses blessed's built-in prompt widget rather than
  // hand-rolling text capture, since it's a one-off modal input, not a
  // full-screen game needing the general capturesTextInput key-routing path.
  function openLibrarySearch() {
    const prompt = blessed.prompt({
      top: "center",
      left: "center",
      width: "60%",
      height: 8,
      border: { type: "line" },
      tags: true,
      label: " search Gutenberg ",
      style: { border: { fg: "magenta" } },
    });
    screen.append(prompt);
    prompt.input("Search title or author:", "", (err, value) => {
      screen.remove(prompt);
      screen.render();
      if (err || !value || !value.trim()) return;

      const loadingGroup: GameGroup = { kind: "group", id: "library-search", title: `Results for "${value}"`, color: "magenta", games: [] };
      goToSubmenu(loadingGroup);
      submenuBody?.setContent("{grey-fg}searching...{/grey-fg}");
      screen.render();

      searchBooks(value.trim())
        .then((results) => {
          if (mode.kind !== "submenu" || mode.group.id !== "library-search") return; // user navigated away
          const resultGroup: GameGroup = {
            kind: "group",
            id: "library-search",
            title: `Results for "${value}" (${results.length})`,
            color: "magenta",
            games: results.map((b) => buildReaderGame(b)),
          };
          goToSubmenu(resultGroup);
        })
        .catch(() => {
          if (mode.kind !== "submenu" || mode.group.id !== "library-search") return;
          submenuBody?.setContent("{red-fg}search failed — check your connection{/red-fg}");
          screen.render();
        });
    });
  }

  let tickSecondCounter = 0;

  function startGameTickLoop() {
    if (mode.kind !== "game") return;
    if (tickTimer) clearInterval(tickTimer);
    const tickMs = mode.tickMs;
    tickTimer = setInterval(() => {
      if (mode.kind !== "game") return;
      tickSecondCounter += 100;
      if (tickSecondCounter >= 1000) {
        tickSecondCounter = 0;
        mode.elapsedSec += 1;
        if (commandFinished) mode.done = true;
      }
      mode.game.tick?.(mode.state, mode.ctx);
      renderGame();
    }, Math.min(tickMs ?? 200, 100));
  }

  function stopGameTickLoop() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  const startGame = (game: Game<any>) => {
    gameBox = null;
    sidebar = null;
    footer = null;
    const ctx = { difficulty: config.difficulty, rng: Math.random };
    const tickMs = game.id === "snake" ? tickIntervalFor(ctx) : game.tickIntervalMs;
    mode = {
      kind: "game",
      game,
      state: game.init(ctx),
      ctx,
      highScore: getHighScore(game.id),
      elapsedSec: 0,
      done: commandFinished,
      tickMs,
      flashUntil: 0,
    };
    tickSecondCounter = 0;
    // Watch mode: if the agent is already waiting/done when you pick a
    // pausable game (Snake), start paused rather than ticking a game nobody
    // asked to run yet. Non-pausable games (quizzes) always start ticking —
    // see Game.pauseWhileAgentBusy.
    const startsPaused = opts.kind === "watch" && game.pauseWhileAgentBusy && liveStatus !== "working" && liveStatus !== null;
    if (!startsPaused) {
      startGameTickLoop();
    }
    renderGame();
  };

  function clearScreen() {
    for (const child of [...screen.children]) screen.remove(child);
    // Widgets built by any *other* screen are now detached and dead — null
    // their cached refs so each render*() function's `if (!x) buildX()`
    // guard actually rebuilds instead of silently updating a removed
    // widget (which renders nothing and looks like the UI froze).
    menuBody = null;
    submenuBody = null;
    settingsBody = null;
    gameBox = null;
    sidebar = null;
    footer = null;
  }

  // --- menu ---

  let menuBody: blessed.Widgets.BoxElement | null = null;

  function buildMenuFrame() {
    clearScreen();
    const title = blessed.box({
      top: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 4,
      tags: true,
      align: "center",
      valign: "middle",
      content: `${rainbowText("S I D E Q U E S T")}\n{grey-fg}${opts.kind === "watch" ? "watching:" : "running:"} {/grey-fg}{cyan-fg}${escapeTags(commandLabel())}{/cyan-fg}${liveStatus ? "   " + STATUS_LABEL[liveStatus] : ""}`,
      border: { type: "line" },
      style: { border: { fg: "magenta" } },
    });

    menuBody = blessed.box({
      top: 5,
      left: "center",
      width: CONTENT_WIDTH,
      // rows are double-spaced ("\n\n" between each), so (menuEntries +
      // settings) entries need 2*entries-1 content lines, plus 2 for the
      // border and 2 for vertical padding. Too short here silently clips the
      // bottom rows instead of erroring — that's what ate History/Settings
      // off-screen before this was computed correctly.
      height: 2 * (menuEntries.length + 1) + 5,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      border: { type: "line" },
      label: " pick a game ",
      style: { border: { fg: "green" } },
    });

    const footer = blessed.box({
      bottom: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      content: commandFinished
        ? "{green-fg}{bold}command finished{/bold}{/green-fg}  —  pick a game, or press q to see results"
        : "{grey-fg}↑↓ move   enter select   q quit{/grey-fg}",
    });

    screen.append(title);
    screen.append(menuBody);
    screen.append(footer);
  }

  function renderMenu() {
    if (mode.kind !== "menu") return;
    if (!menuBody) buildMenuFrame();

    const rows: string[] = [];
    menuEntries.forEach((entry, i) => {
      const selected = mode.kind === "menu" && mode.index === i;
      let label: string;
      let color: string;
      if (entry.kind === "game") {
        color = GAME_THEME[entry.game.id] ?? "white";
        const best = getHighScore(entry.game.id);
        label = `${entry.game.title}  {grey-fg}(best: ${best}){/grey-fg}`;
      } else {
        color = entry.color;
        const best = Math.max(0, ...entry.games.map((g) => getHighScore(g.id)));
        label = `${entry.title}  {grey-fg}(${entry.games.length} categories, best: ${best}) ▸{/grey-fg}`;
      }
      const swatch = `{${color}-bg}  {/${color}-bg}`;
      rows.push(selected ? `{inverse}{bold} ${swatch} ${label} {/bold}{/inverse}` : ` ${swatch} ${label}`);
    });
    const settingsSelected = mode.kind === "menu" && mode.index === menuEntries.length;
    const settingsLabel = `Settings  {grey-fg}sound: ${config.sound ? "on" : "off"}, difficulty: ${config.difficulty}{/grey-fg}`;
    rows.push(settingsSelected ? `{inverse}{bold} ⚙ ${settingsLabel} {/bold}{/inverse}` : ` ⚙ ${settingsLabel}`);

    menuBody!.setContent(rows.join("\n\n"));
    screen.render();
  }

  // --- submenu (category picker inside a group, e.g. Trivia/Coding Quiz) ---

  let submenuBody: blessed.Widgets.BoxElement | null = null;

  function buildSubmenuFrame(group: GameGroup) {
    clearScreen();
    const title = blessed.box({
      top: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      valign: "middle",
      content: `{bold}{${group.color}-fg}${escapeTags(group.title)}{/${group.color}-fg}{/bold}`,
      border: { type: "line" },
      style: { border: { fg: group.color } },
    });

    submenuBody = blessed.box({
      top: 4,
      left: "center",
      width: CONTENT_WIDTH,
      height: 2 * (group.games.length + 1) + 5,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      border: { type: "line" },
      label: " pick a category ",
      style: { border: { fg: group.color } },
    });

    const footer = blessed.box({
      bottom: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      content: group.id.startsWith("library")
        ? "{grey-fg}↑↓ move   enter select   / search   esc back   q quit{/grey-fg}"
        : "{grey-fg}↑↓ move   enter select   esc back   q quit{/grey-fg}",
    });

    screen.append(title);
    screen.append(submenuBody);
    screen.append(footer);
  }

  function renderSubmenu() {
    if (mode.kind !== "submenu") return;
    const m = mode; // narrow once — TS won't retain the guard inside the closure below
    if (!submenuBody) buildSubmenuFrame(m.group);

    const rows: string[] = [];
    m.group.games.forEach((g, i) => {
      const selected = m.index === i;
      const best = getHighScore(g.id);
      const label = `${g.title}  {grey-fg}(best: ${best}){/grey-fg}`;
      const swatch = `{${m.group.color}-bg}  {/${m.group.color}-bg}`;
      rows.push(selected ? `{inverse}{bold} ${swatch} ${label} {/bold}{/inverse}` : ` ${swatch} ${label}`);
    });
    rows.push(m.index === m.group.games.length ? "{inverse}{bold} ← Back {/bold}{/inverse}" : " ← Back");

    submenuBody!.setContent(rows.join("\n\n"));
    screen.render();
  }

  // --- settings ---

  let settingsBody: blessed.Widgets.BoxElement | null = null;
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  function buildSettingsFrame() {
    clearScreen();
    const header = blessed.box({
      top: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      valign: "middle",
      content: "{bold}{yellow-fg}⚙ Settings{/yellow-fg}{/bold}",
      border: { type: "line" },
      style: { border: { fg: "yellow" } },
    });

    settingsBody = blessed.box({
      top: 4,
      left: "center",
      width: CONTENT_WIDTH,
      // 5 rows (sound, difficulty, auto-open, run setup, back), double-spaced
      // — same undercounting mistake bit the main menu once already, so this
      // is deliberately generous rather than exactly-computed.
      height: 2 * SETTINGS_ROW_COUNT + 5,
      tags: true,
      padding: { left: 2, right: 2, top: 1, bottom: 1 },
      border: { type: "line" },
      style: { border: { fg: "yellow" } },
    });

    const footer = blessed.box({
      bottom: 1,
      left: "center",
      width: CONTENT_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      content: "{grey-fg}↑↓ move   enter toggle/change   esc back   q quit{/grey-fg}",
    });

    screen.append(header);
    screen.append(settingsBody);
    screen.append(footer);
  }

  function renderSettings() {
    if (mode.kind !== "settings") return;
    if (!settingsBody) buildSettingsFrame();

    const rows = [
      `Sound: ${config.sound ? "{green-fg}ON{/green-fg}" : "{grey-fg}off{/grey-fg}"}`,
      `Difficulty: {cyan-fg}${config.difficulty}{/cyan-fg}`,
      `Auto-open game on prompt: ${config.autoOpen ? "{green-fg}ON{/green-fg}" : "{grey-fg}off{/grey-fg}"}`,
      "Run setup wizard  {grey-fg}(wire up Claude Code / Cursor / Copilot CLI){/grey-fg}",
      "Back",
    ];
    const styled = rows.map((r, i) => (mode.kind === "settings" && mode.index === i ? `{inverse}{bold} > ${r} {/bold}{/inverse}` : `   ${r}`));
    settingsBody!.setContent(styled.join("\n\n"));
    screen.render();
  }

  function activateSettingsRow() {
    if (mode.kind !== "settings") return;
    if (mode.index === 0) {
      config.sound = !config.sound;
      setSoundEnabled(config.sound);
      saveConfig(config);
      renderSettings();
    } else if (mode.index === 1) {
      const i = difficulties.indexOf(config.difficulty);
      config.difficulty = difficulties[(i + 1) % difficulties.length];
      saveConfig(config);
      renderSettings();
    } else if (mode.index === 2) {
      config.autoOpen = !config.autoOpen;
      saveConfig(config);
      renderSettings();
    } else if (mode.index === 3) {
      runSetupFromUI();
    } else {
      goToMenu();
    }
  }

  // Leaves the blessed TUI entirely to run the real interactive setup
  // wizard (it needs actual readline/stdin, which conflicts with blessed's
  // own raw-mode input handling) — exits the process when done rather than
  // trying to re-enter the TUI, since terminal mode was just handed back.
  function runSetupFromUI() {
    if (tickTimer) clearInterval(tickTimer);
    if (statusPollTimer) clearInterval(statusPollTimer);
    screen.destroy();
    console.log("");
    import("./setup.js").then(({ runSetupWizard }) =>
      runSetupWizard().then(() => process.exit(0))
    );
  }

  // --- game ---

  // Snake's grid renders at 2 chars/cell × 30 cells = 60, +2 for the border =
  // 62 minimum — wider than CONTENT_WIDTH, so the game screen gets its own,
  // wider centered container. gameBox/sidebar are nested inside it (blessed's
  // `parent` option) so they lay out side-by-side as one centered group
  // instead of each trying to center independently.
  const GAME_BOX_WIDTH = 62;
  const SIDEBAR_WIDTH = 30;
  const GAME_CONTAINER_WIDTH = GAME_BOX_WIDTH + SIDEBAR_WIDTH;

  let gameBox: blessed.Widgets.BoxElement | null = null;
  let sidebar: blessed.Widgets.BoxElement | null = null;
  let footer: blessed.Widgets.BoxElement | null = null;

  function buildGame(game: Game<any>) {
    clearScreen();
    const color = GAME_THEME[game.id] ?? "green";
    const header = blessed.box({
      top: 1,
      left: "center",
      width: GAME_CONTAINER_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      valign: "middle",
      content: `{bold}{${color}-fg}${escapeTags(game.title)}{/${color}-fg}{/bold}   {grey-fg}${opts.kind === "watch" ? "watching:" : "running:"}{/grey-fg} {cyan-fg}${escapeTags(commandLabel())}{/cyan-fg}${liveStatus ? "   " + STATUS_LABEL[liveStatus] : ""}`,
      border: { type: "line" },
      style: { border: { fg: color } },
    });

    const container = blessed.box({
      top: 4,
      left: "center",
      width: GAME_CONTAINER_WIDTH,
      height: 20,
    });

    gameBox = blessed.box({
      // No padding here — the game canvas (e.g. Snake's 30-cell grid at
      // 2 chars/cell = 60 chars) is sized to fit the border-only interior
      // exactly; padding would clip the rightmost column.
      parent: container,
      top: 0,
      left: 0,
      width: GAME_BOX_WIDTH,
      height: 20,
      tags: true,
      valign: "middle", // content (e.g. Snake's 16-row grid) is shorter than
      // the 20-row box — center it vertically instead of pinning it to the
      // top with dead space below.
      border: { type: "line" },
      style: { border: { fg: color } },
    });

    sidebar = blessed.box({
      parent: container,
      top: 0,
      left: GAME_BOX_WIDTH,
      width: SIDEBAR_WIDTH,
      height: 20,
      tags: true,
      padding: { left: 1, right: 1, top: 1, bottom: 0 },
      border: { type: "line" },
      style: { border: { fg: "yellow" } },
    });

    footer = blessed.box({
      top: 24,
      left: "center",
      width: GAME_CONTAINER_WIDTH,
      height: 3,
      tags: true,
      align: "center",
      content: "{grey-fg}m menu   q quit{/grey-fg}",
    });

    screen.append(header);
    screen.append(container);
    screen.append(footer);
  }

  function renderGame() {
    if (mode.kind !== "game") return;
    if (!gameBox || !sidebar || !footer) buildGame(mode.game);
    const g = mode.game;
    const state = mode.state;

    gameBox!.setContent(g.render(state));
    const sfx = g.consumeSfxEvent?.(state);
    if (sfx) {
      playSfx(sfx);
      if (sfx === "eat" || sfx === "correct") mode.flashUntil = Date.now() + 150;
    }
    const flashing = Date.now() < mode.flashUntil;
    const color = GAME_THEME[g.id] ?? "green";
    (gameBox as any).style.border.fg = flashing ? "white" : color;

    const currentScore = g.score(state);
    if (currentScore > mode.highScore) {
      const { highScore: hs } = maybeSaveHighScore(g.id, currentScore);
      mode.highScore = hs;
    }

    const isPaused = opts.kind === "watch" && (liveStatus === "waiting" || liveStatus === "done");

    const summary = isPaused
      ? [
          liveStatus === "waiting"
            ? "{yellow-bg}{black-fg}{bold} ⏸ NEEDS YOU {/bold}{/black-fg}{/yellow-bg}"
            : "{green-bg}{black-fg}{bold} ✓ FINISHED {/bold}{/black-fg}{/green-bg}",
          "",
          `You played {bold}${escapeTags(g.title)}{/bold}`,
          `for ${mode.elapsedSec}s — score ${currentScore}`,
          "",
        ]
      : [];

    const lines = [
      ...summary,
      ...g.sidebar(state),
      "",
      `{bold}Best{/bold}    ${mode.highScore}`,
      "",
      `{bold}Elapsed{/bold} ${mode.elapsedSec}s`,
      "",
      mode.done
        ? "{green-fg}{bold}Command finished!{/bold}{/green-fg}"
        : opts.kind === "watch" && liveStatus
          ? STATUS_LABEL[liveStatus]
          : "{grey-fg}still running...{/grey-fg}",
    ];
    sidebar!.setContent(lines.join("\n"));
    const typing = g.capturesTextInput && !mode.done;
    footer!.setContent(
      mode.done
        ? "{green-fg}m menu   q see results & quit{/green-fg}"
        : typing
          ? "{grey-fg}type your answer, enter to submit   esc menu   ctrl+c quit{/grey-fg}"
          : "{grey-fg}m menu   q quit{/grey-fg}"
    );
    screen.render();
  }

  // --- single persistent key dispatcher ---

  if (process.env.SIDEQUEST_DEBUG) {
    const dir = join(homedir(), ".sidequest");
    mkdirSync(dir, { recursive: true });
    const logPath = join(dir, "debug.log");
    screen.on("keypress", (ch: string, key: any) => {
      appendFileSync(
        logPath,
        `mode=${mode.kind} ch=${JSON.stringify(ch)} name=${key?.name} full=${key?.full} shift=${key?.shift} ctrl=${key?.ctrl}\n`
      );
    });
  }

  // Ctrl+C always force-quits, no matter what's being typed — the one
  // exit hatch that can't be swallowed by a game that wants full a-z input
  // (Wordle needs every letter, including "q" and "m", which everywhere
  // else in the app mean quit/menu).
  screen.key(["C-c"], exitApp);

  screen.on("keypress", (ch: string, key: any) => {
    const keyName: string = key?.name ?? ch ?? "";
    const isWordleTyping = mode.kind === "game" && mode.game.capturesTextInput && !mode.done;

    if (keyName === "escape") {
      if (mode.kind === "settings" || mode.kind === "game" || mode.kind === "submenu") goToMenu();
      return;
    }

    if (!isWordleTyping) {
      if (keyName === "q") {
        exitApp();
        return;
      }
      if (keyName === "m" && mode.kind === "game") {
        goToMenu();
        return;
      }
    }

    if (mode.kind === "menu") {
      const count = menuEntries.length + 1;
      if (keyName === "up") mode.index = (mode.index - 1 + count) % count;
      else if (keyName === "down") mode.index = (mode.index + 1) % count;
      else if (keyName === "enter" || keyName === "space") {
        if (mode.index === menuEntries.length) {
          goToSettings();
        } else {
          const entry = menuEntries[mode.index];
          if (entry.kind === "group") goToSubmenu(entry);
          else startGame(entry.game);
        }
        return;
      }
      renderMenu();
      return;
    }

    if (mode.kind === "submenu") {
      if (keyName === "/" && mode.group.id.startsWith("library")) {
        openLibrarySearch();
        return;
      }
      const count = mode.group.games.length + 1; // +1 for Back
      if (keyName === "up") mode.index = (mode.index - 1 + count) % count;
      else if (keyName === "down") mode.index = (mode.index + 1) % count;
      else if (keyName === "enter" || keyName === "space") {
        if (mode.index === mode.group.games.length) goToMenu();
        else startGame(mode.group.games[mode.index]);
        return;
      }
      renderSubmenu();
      return;
    }

    if (mode.kind === "settings") {
      const count = SETTINGS_ROW_COUNT;
      if (keyName === "up") mode.index = (mode.index - 1 + count) % count;
      else if (keyName === "down") mode.index = (mode.index + 1) % count;
      else if (keyName === "enter" || keyName === "space") {
        activateSettingsRow();
        return;
      }
      renderSettings();
      return;
    }

    if (mode.kind === "game") {
      mode.game.handleKey(mode.state, keyName, mode.ctx);
      renderGame();
    }
  });

  function redrawCurrentScreen() {
    if (mode.kind === "menu") {
      menuBody = null;
      renderMenu();
    } else if (mode.kind === "submenu") {
      submenuBody = null;
      renderSubmenu();
    } else if (mode.kind === "settings") {
      settingsBody = null;
      renderSettings();
    } else if (mode.kind === "game") {
      gameBox = null;
      sidebar = null;
      footer = null;
      renderGame();
    }
  }

  if (opts.kind === "watch") {
    statusPollTimer = setInterval(() => {
      heartbeatWatcher();
      const record = readStatus();
      const newStatus = record?.status ?? null;
      const newAgent = record?.agent ?? null;
      if (newStatus !== liveStatus || newAgent !== liveStatusAgent) {
        if (newStatus && newStatus !== liveStatus) {
          if (newStatus === "done") playSfx("done");
          else if (newStatus === "waiting") playSfx("wrong");
        }
        const wasPausable = liveStatus === "waiting" || liveStatus === "done";

        // "productive waiting" clock: accrue only while status is actually
        // "working", flush the accumulated span the moment it stops being so.
        if (newStatus === "working" && workingSince === null) {
          workingSince = Date.now();
        } else if (newStatus !== "working" && workingSince !== null) {
          flushProductiveTime();
        }

        liveStatus = newStatus;
        liveStatusAgent = newAgent;

        if (mode.kind === "game" && mode.game.pauseWhileAgentBusy) {
          const shouldPause = newStatus === "waiting" || newStatus === "done";
          if (shouldPause) stopGameTickLoop();
          else if (wasPausable && newStatus === "working") startGameTickLoop();
        }

        redrawCurrentScreen();
      }
    }, 500);
    heartbeatWatcher();
  }

  buildMenuFrame();
  renderMenu();
}

function escapeTags(s: string): string {
  return s.replace(/[{}]/g, (c) => (c === "{" ? "{open}" : "{close}"));
}
