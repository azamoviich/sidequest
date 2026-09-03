import { getProgress, levelFor, xpIntoLevel, formatDuration } from "../progress.js";
import type { Game, GameContext } from "./types.js";

export interface ProgressScreenState {
  tick: number; // forces a fresh read from disk each render, so the productive-time counter feels alive
}

export const progressGame: Game<ProgressScreenState> = {
  id: "progress",
  title: "Your Progress",
  tickIntervalMs: 1000,

  init(_ctx: GameContext): ProgressScreenState {
    return { tick: 0 };
  },

  tick(state) {
    state.tick += 1;
  },

  handleKey() {
    // static screen, nothing to interact with
  },

  render() {
    const p = getProgress();
    const level = levelFor(p.xp);
    const { current, needed } = xpIntoLevel(p.xp);
    const barWidth = 20;
    const filled = Math.round((current / needed) * barWidth);
    const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

    const lines = [
      "{bold}{magenta-fg}YOUR PROGRESS{/magenta-fg}{/bold}",
      "",
      `{bold}Level{/bold}        ${level}`,
      `{bold}XP{/bold}           ${p.xp}  {grey-fg}[${bar}] ${current}/${needed}{/grey-fg}`,
      `{bold}Streak{/bold}       ${p.streakDays} day${p.streakDays === 1 ? "" : "s"}`,
      "",
      `{bold}Games{/bold}        ${p.counts.games}`,
      `{bold}Quizzes{/bold}      ${p.counts.quizzes}`,
      `{bold}Books{/bold}        ${p.counts.books}`,
      `{bold}Challenges{/bold}   ${p.counts.challenges}`,
      "",
      `{bold}{green-fg}Productive waiting{/green-fg}{/bold}   ${formatDuration(p.productiveWaitingMs)}`,
    ];
    return lines.join("\n");
  },

  sidebar() {
    return ["{grey-fg}time spent playing{/grey-fg}", "{grey-fg}while your agent{/grey-fg}", "{grey-fg}worked, instead of{/grey-fg}", "{grey-fg}doomscrolling{/grey-fg}"];
  },

  isOver() {
    return false;
  },

  score() {
    return 0;
  },
};
