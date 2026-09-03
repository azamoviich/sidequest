import blessed from "blessed";
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { games, type Game } from "./games/index.js";
import { tickIntervalFor } from "./games/snake.js";
import { loadConfig, saveConfig, type Config, type Difficulty } from "./config.js";
import { getHighScore, maybeSaveHighScore } from "./highscore.js";
import { playSfx, setSoundEnabled } from "./sound.js";
import type { CommandResult } from "./runner.js";
import { readStatus, heartbeatWatcher, type AgentStatus } from "./status.js";

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
  geography: "blue",
  history: "yellow",
};

const RAINBOW = ["red", "yellow", "green", "cyan", "blue", "magenta"];

// Fixed content width, centered on screen via left:'center' — keeps the
// layout readable and intentional on wide terminals instead of stretching
// text edge-to-edge, and keeps every screen (menu/settings/game) visually
// consistent with each other.
const CONTENT_WIDTH = 78;

function rainbowText(text: string): string {
  return [...text].map((ch, i) => (ch === " " ? " " : `{${RAINBOW[i % RAINBOW.length]}-fg}{bold}${ch}{/bold}{/${RAINBOW[i % RAINBOW.length]}-fg}`)).join("");
}

type Mode =
  | { kind: "menu"; index: number }
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
  const screen = blessed.screen({ smartCSR: true, title: "waitplay" });
  const config = loadConfig();
  setSoundEnabled(config.sound);

  let commandFinished = false;
  let finishedResult: CommandResult | null = null;
  if (opts.kind === "wrap") {
    opts.resultPromise.then((result) => {
      commandFinished = true;
      finishedResult = result;
    });
  }

  const commandLabel = () => (opts.kind === "wrap" ? opts.commandLabel : liveStatusAgent ?? "your coding agent");

  let mode: Mode = { kind: "menu", index: 0 };
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let liveStatus: AgentStatus | null = null;
  let liveStatusAgent: string | null = null;
  let statusPollTimer: ReturnType<typeof setInterval> | null = null;

  const exitApp = () => {
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
    if (tickTimer) clearInterval(tickTimer);
    let secondCounter = 0;
    tickTimer = setInterval(() => {
      if (mode.kind !== "game") return;
      secondCounter += 100;
      if (secondCounter >= 1000) {
        secondCounter = 0;
        mode.elapsedSec += 1;
        if (commandFinished) mode.done = true;
      }
      mode.game.tick?.(mode.state, mode.ctx);
      renderGame();
    }, Math.min(mode.tickMs ?? 200, 100));
    renderGame();
  };

  function clearScreen() {
    for (const child of [...screen.children]) screen.remove(child);
    // Widgets built by any *other* screen are now detached and dead — null
    // their cached refs so each render*() function's `if (!x) buildX()`
    // guard actually rebuilds instead of silently updating a removed
    // widget (which renders nothing and looks like the UI froze).
    menuBody = null;
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
      content: `${rainbowText("W A I T P L A Y")}\n{grey-fg}${opts.kind === "watch" ? "watching:" : "running:"} {/grey-fg}{cyan-fg}${escapeTags(commandLabel())}{/cyan-fg}${liveStatus ? "   " + STATUS_LABEL[liveStatus] : ""}`,
      border: { type: "line" },
      style: { border: { fg: "magenta" } },
    });

    menuBody = blessed.box({
      top: 5,
      left: "center",
      width: CONTENT_WIDTH,
      // rows are double-spaced ("\n\n" between each), so (games + settings)
      // entries need 2*entries-1 content lines, plus 2 for the border and 2
      // for vertical padding. Too short here silently clips the bottom rows
      // instead of erroring — that's what ate History/Settings off-screen
      // before this was computed correctly.
      height: 2 * (games.length + 1) + 5,
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
    games.forEach((g, i) => {
      const color = GAME_THEME[g.id] ?? "white";
      const best = getHighScore(g.id);
      const selected = mode.kind === "menu" && mode.index === i;
      const swatch = `{${color}-bg}  {/${color}-bg}`;
      const label = `${g.title}  {grey-fg}(best: ${best}){/grey-fg}`;
      rows.push(selected ? `{inverse}{bold} ${swatch} ${label} {/bold}{/inverse}` : ` ${swatch} ${label}`);
    });
    const settingsSelected = mode.kind === "menu" && mode.index === games.length;
    const settingsLabel = `Settings  {grey-fg}sound: ${config.sound ? "on" : "off"}, difficulty: ${config.difficulty}{/grey-fg}`;
    rows.push(settingsSelected ? `{inverse}{bold} ⚙ ${settingsLabel} {/bold}{/inverse}` : ` ⚙ ${settingsLabel}`);

    menuBody!.setContent(rows.join("\n\n"));
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
      height: 8,
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
    } else {
      goToMenu();
    }
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

    const lines = [
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
    const isWordle = g.id === "wordle" && !mode.done;
    footer!.setContent(
      mode.done
        ? "{green-fg}m menu   q see results & quit{/green-fg}"
        : isWordle
          ? "{grey-fg}type letters, enter to submit   esc menu   ctrl+c quit{/grey-fg}"
          : "{grey-fg}m menu   q quit{/grey-fg}"
    );
    screen.render();
  }

  // --- single persistent key dispatcher ---

  if (process.env.WAITPLAY_DEBUG) {
    const dir = join(homedir(), ".waitplay");
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
    const isWordleTyping = mode.kind === "game" && mode.game.id === "wordle" && !mode.done;

    if (keyName === "escape") {
      if (mode.kind === "settings" || mode.kind === "game") goToMenu();
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
      const count = games.length + 1;
      if (keyName === "up") mode.index = (mode.index - 1 + count) % count;
      else if (keyName === "down") mode.index = (mode.index + 1) % count;
      else if (keyName === "enter" || keyName === "space") {
        if (mode.index === games.length) goToSettings();
        else startGame(games[mode.index]);
        return;
      }
      renderMenu();
      return;
    }

    if (mode.kind === "settings") {
      const count = 3;
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
        liveStatus = newStatus;
        liveStatusAgent = newAgent;
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
