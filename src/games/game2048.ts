import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

type Grid = number[][]; // 4x4, 0 = empty

const SIZE = 4;
const MILESTONES = [128, 256, 512, 1024, 2048];

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function emptyCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) cells.push([r, c]);
  return cells;
}

function spawnTile(grid: Grid, rng: () => number): void {
  const cells = emptyCells(grid);
  if (!cells.length) return;
  const [r, c] = cells[Math.floor(rng() * cells.length)];
  grid[r][c] = rng() < 0.9 ? 2 : 4;
}

/** Slides+merges one line toward index 0 (left). Callers transpose/reverse the grid to reuse this for all 4 directions. */
function slideLine(line: number[]): { line: number[]; gained: number } {
  const nonZero = line.filter((v) => v !== 0);
  const result: number[] = [];
  let gained = 0;
  for (let i = 0; i < nonZero.length; i++) {
    if (nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      result.push(merged);
      gained += merged;
      i++; // skip the tile just merged in
    } else {
      result.push(nonZero[i]);
    }
  }
  while (result.length < line.length) result.push(0);
  return { line: result, gained };
}

function transpose(grid: Grid): Grid {
  return grid[0].map((_, c) => grid.map((row) => row[c]));
}

function move(grid: Grid, direction: "up" | "down" | "left" | "right"): { grid: Grid; gained: number; moved: boolean } {
  let working = grid.map((row) => [...row]);
  if (direction === "up" || direction === "down") working = transpose(working);
  if (direction === "right" || direction === "down") working = working.map((row) => [...row].reverse());

  let gained = 0;
  working = working.map((row) => {
    const { line, gained: g } = slideLine(row);
    gained += g;
    return line;
  });

  if (direction === "right" || direction === "down") working = working.map((row) => [...row].reverse());
  if (direction === "up" || direction === "down") working = transpose(working);

  const moved = JSON.stringify(working) !== JSON.stringify(grid);
  return { grid: working, gained, moved };
}

function hasMoves(grid: Grid): boolean {
  if (emptyCells(grid).length > 0) return true;
  for (const dir of ["up", "down", "left", "right"] as const) {
    if (move(grid, dir).moved) return true;
  }
  return false;
}

export interface Game2048State {
  grid: Grid;
  score: number;
  best: number;
  gameOver: boolean;
  milestonesHit: Set<number>;
  sfxEvent: "correct" | "wrong" | null;
  rng: () => number;
}

export const game2048: Game<Game2048State> = {
  id: "2048",
  title: "2048",
  tickIntervalMs: null,
  pauseWhileAgentBusy: false,

  init(ctx: GameContext): Game2048State {
    const grid = emptyGrid();
    spawnTile(grid, ctx.rng);
    spawnTile(grid, ctx.rng);
    return { grid, score: 0, best: 0, gameOver: false, milestonesHit: new Set(), sfxEvent: null, rng: ctx.rng };
  },

  handleKey(state, key) {
    if (state.gameOver) {
      if (key === "space" || key === "r") {
        const grid = emptyGrid();
        spawnTile(grid, state.rng);
        spawnTile(grid, state.rng);
        state.grid = grid;
        state.score = 0;
        state.gameOver = false;
        state.milestonesHit = new Set();
      }
      return;
    }

    const dir = { up: "up", down: "down", left: "left", right: "right", w: "up", s: "down", a: "left", d: "right" }[key] as
      | "up"
      | "down"
      | "left"
      | "right"
      | undefined;
    if (!dir) return;

    const result = move(state.grid, dir);
    if (!result.moved) return;

    state.grid = result.grid;
    state.score += result.gained;
    state.best = Math.max(state.best, state.score);
    if (result.gained > 0) state.sfxEvent = "correct";
    spawnTile(state.grid, state.rng);

    for (const m of MILESTONES) {
      if (!state.milestonesHit.has(m) && state.grid.some((row) => row.includes(m))) {
        state.milestonesHit.add(m);
        awardXp(Math.min(50, m / 4), "games");
      }
    }

    if (!hasMoves(state.grid)) state.gameOver = true;
  },

  render(state) {
    const colorFor = (v: number): string => {
      if (v === 0) return "grey";
      if (v <= 4) return "white";
      if (v <= 16) return "yellow";
      if (v <= 64) return "red";
      if (v <= 256) return "magenta";
      if (v <= 1024) return "cyan";
      return "green";
    };
    const cellWidth = 6;
    const rows = state.grid.map((row) =>
      row
        .map((v) => {
          const text = v === 0 ? "·" : String(v);
          const padded = text.padStart(Math.ceil((cellWidth + text.length) / 2)).padEnd(cellWidth);
          const color = colorFor(v);
          return v === 0 ? `{grey-fg}${padded}{/grey-fg}` : `{${color}-fg}{bold}${padded}{/bold}{/${color}-fg}`;
        })
        .join("")
    );
    const lines = [...rows];
    if (state.gameOver) {
      lines.push("", "{red-fg}{bold}No more moves.{/bold}{/red-fg}", "", "{grey-fg}space = new game{/grey-fg}");
    }
    return lines.join("\n\n");
  },

  sidebar(state) {
    return [
      `{bold}Score{/bold}  ${state.score}`,
      `{bold}Best{/bold}   ${state.best}`,
      "",
      "{grey-fg}arrows/WASD{/grey-fg}",
      "{grey-fg}to slide tiles{/grey-fg}",
    ];
  },

  isOver() {
    return false;
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
