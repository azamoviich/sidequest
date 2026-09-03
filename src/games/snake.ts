import { createSnakeState, setDirection, step, type SnakeState } from "../snake.js";
import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

const GRID_W = 30;
const GRID_H = 16;

const TICK_BY_DIFFICULTY = { easy: 150, medium: 110, hard: 75 } as const;

export const snakeGame: Game<SnakeState> = {
  id: "snake",
  title: "Snake",
  tickIntervalMs: null, // set dynamically via tickIntervalMsFor(); runner reads once at start
  pauseWhileAgentBusy: true, // otherwise it keeps moving/dying while you're not looking

  init(ctx: GameContext) {
    return createSnakeState(GRID_W, GRID_H, ctx.rng);
  },

  tick(state) {
    if (!state.gameOver) {
      const wasGameOver = state.gameOver;
      step(state);
      if (state.sfxEvent === "eat") awardXp(5, "games");
      if (state.gameOver && !wasGameOver && state.score > 0) awardXp(2, "games");
    }
  },

  handleKey(state, key) {
    if (state.gameOver && key === "space") {
      Object.assign(state, createSnakeState(GRID_W, GRID_H, state.rng));
      return;
    }
    if (key === "up" || key === "w") setDirection(state, "up");
    else if (key === "down" || key === "s") setDirection(state, "down");
    else if (key === "left" || key === "a") setDirection(state, "left");
    else if (key === "right" || key === "d") setDirection(state, "right");
    else return;

    state.started = true;
  },

  render(state) {
    const cells: (number | null)[][] = Array.from({ length: state.height }, () => Array(state.width).fill(null));
    state.snake.forEach((p, i) => {
      if (p.y >= 0 && p.y < state.height && p.x >= 0 && p.x < state.width) cells[p.y][p.x] = i;
    });

    return cells
      .map((row, y) =>
        row
          .map((segIndex, x) => {
            if (x === state.food.x && y === state.food.y) return "{red-fg}{bold}●●{/bold}{/red-fg}";
            if (segIndex === null) return (x + y) % 2 === 0 ? "{grey-fg}·{/grey-fg} " : "  ";
            if (segIndex === 0) return "{light-green-fg}{bold}██{/bold}{/light-green-fg}";
            // alternating shade gives the body a segmented, gradient look
            const shade = segIndex % 2 === 0 ? "green" : "light-green";
            return `{${shade}-fg}▓▓{/${shade}-fg}`;
          })
          .join("")
      )
      .join("\n");
  },

  sidebar(state) {
    const lines = [`{bold}Score{/bold}  ${state.score}`, `{bold}Length{/bold} ${state.snake.length}`];
    if (!state.started && !state.gameOver) {
      lines.push("", "{yellow-fg}press a direction{/yellow-fg}", "{yellow-fg}to start moving{/yellow-fg}");
    }
    if (state.gameOver) {
      lines.push(
        "",
        "{red-bg}{white-fg}{bold} GAME OVER {/bold}{/white-fg}{/red-bg}",
        "",
        `final score: {bold}${state.score}{/bold}`,
        "",
        "{grey-fg}space = restart{/grey-fg}"
      );
    }
    return lines;
  },

  isOver() {
    return false; // snake restarts on space; the wrapped command decides when we actually exit
  },

  score(state) {
    return state.score;
  },

  consumeSfxEvent(state) {
    const e = state.sfxEvent;
    state.sfxEvent = null;
    return e;
  },
};

export function tickIntervalFor(ctx: GameContext): number {
  return TICK_BY_DIFFICULTY[ctx.difficulty];
}
