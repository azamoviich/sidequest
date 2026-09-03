import { describe, it, expect } from "vitest";
import { detectiveGame } from "./detective.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };

describe("detective", () => {
  it("starts on the briefing phase", () => {
    const state = detectiveGame.init(ctx);
    expect(state.phase).toBe("briefing");
  });

  it("enter moves briefing -> investigating -> answering, then solves with the right answer", () => {
    const state = detectiveGame.init(ctx);
    detectiveGame.handleKey(state, "enter", ctx);
    expect(state.phase).toBe("investigating");
    detectiveGame.handleKey(state, "a", ctx);
    expect(state.phase).toBe("answering");

    for (const ch of state.caseData.answers[0]) detectiveGame.handleKey(state, ch === " " ? "space" : ch, ctx);
    detectiveGame.handleKey(state, "enter", ctx);
    expect(state.phase).toBe("solved");
    expect(state.solved.has(state.caseData.id)).toBe(true);
  });

  it("wrong answer goes to the wrong phase without solving the case", () => {
    const state = detectiveGame.init(ctx);
    const solvedBefore = state.solved.size; // may be non-zero — solved state persists to disk across runs
    detectiveGame.handleKey(state, "enter", ctx);
    detectiveGame.handleKey(state, "a", ctx);
    for (const ch of "definitelynottherightanswer") detectiveGame.handleKey(state, ch, ctx);
    detectiveGame.handleKey(state, "enter", ctx);
    expect(state.phase).toBe("wrong");
    expect(state.solved.size).toBe(solvedBefore); // unchanged — a wrong answer must not mark it solved
  });

  it("left/right cycles through evidence without going out of bounds", () => {
    const state = detectiveGame.init(ctx);
    detectiveGame.handleKey(state, "enter", ctx);
    const clueCount = state.caseData.clues.length;
    for (let i = 0; i < clueCount + 2; i++) detectiveGame.handleKey(state, "right", ctx);
    expect(state.clueIndex).toBeGreaterThanOrEqual(0);
    expect(state.clueIndex).toBeLessThan(clueCount);
  });
});
