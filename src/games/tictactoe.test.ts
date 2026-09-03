import { describe, it, expect } from "vitest";
import { tictactoeGame } from "./tictactoe.js";

const ctx = { difficulty: "medium" as const, rng: Math.random };

describe("tictactoe", () => {
  it("the AI never loses when the player plays randomly", () => {
    // Run several randomized games; the AI (minimax, unbeatable) should
    // never end up with the human winning.
    for (let game = 0; game < 20; game++) {
      const state = tictactoeGame.init(ctx);
      let guard = 0;
      while (!state.winner && guard++ < 20) {
        const emptyIdx = state.board.map((c, i) => (c === null ? i + 1 : null)).filter((v) => v !== null) as number[];
        if (!emptyIdx.length) break;
        const pick = emptyIdx[Math.floor(Math.random() * emptyIdx.length)];
        tictactoeGame.handleKey(state, String(pick), ctx);
      }
      expect(state.winner).not.toBe("X");
    }
  });

  it("rejects placing on an already-occupied cell", () => {
    const state = tictactoeGame.init(ctx);
    tictactoeGame.handleKey(state, "5", ctx);
    const boardAfterFirst = [...state.board];
    tictactoeGame.handleKey(state, "5", ctx); // cell 5 (index 4) is taken by X now
    expect(state.board[4]).toBe(boardAfterFirst[4]);
  });

  it("space resets the board after a game ends", () => {
    const state = tictactoeGame.init(ctx);
    state.winner = "draw";
    tictactoeGame.handleKey(state, "space", ctx);
    expect(state.winner).toBe(null);
    expect(state.board.every((c) => c === null)).toBe(true);
  });
});
