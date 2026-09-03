import { describe, it, expect } from "vitest";
import { game2048 } from "./game2048.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("2048", () => {
  it("starts with exactly two tiles on the board", () => {
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.1, 0.2, 0.3]) };
    const state = game2048.init(ctx);
    const filled = state.grid.flat().filter((v) => v !== 0);
    expect(filled.length).toBe(2);
  });

  it("merges two equal adjacent tiles when sliding", () => {
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.01]) };
    const state = game2048.init(ctx);
    state.grid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    game2048.handleKey(state, "left", ctx);
    expect(state.grid[0][0]).toBe(4);
    expect(state.score).toBe(4);
  });

  it("does not double-merge three equal tiles in one slide (2,2,2 -> 4,2 not 8)", () => {
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.01]) };
    const state = game2048.init(ctx);
    state.grid = [
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    game2048.handleKey(state, "left", ctx);
    expect(state.grid[0][0]).toBe(4);
    expect(state.grid[0][1]).toBe(2);
  });

  it("does not move or spawn a tile if the slide direction changes nothing", () => {
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.5]) };
    const state = game2048.init(ctx);
    state.grid = [
      [2, 4, 8, 16],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    const before = JSON.stringify(state.grid);
    game2048.handleKey(state, "left", ctx); // already fully packed left, no merges possible
    expect(JSON.stringify(state.grid)).toBe(before);
  });
});
