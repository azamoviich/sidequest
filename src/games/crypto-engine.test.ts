import { describe, it, expect } from "vitest";
import { buildCryptoGame } from "./crypto-engine.js";
import { generateBase64Puzzle, generateCaesarPuzzle, generateRot13Puzzle, generateHashIdPuzzle } from "./data/crypto-puzzles.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("crypto-engine", () => {
  it("accepts the correct decoded answer", () => {
    const game = buildCryptoGame("t", "T", generateBase64Puzzle);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.1]) };
    const state = game.init(ctx);
    for (const ch of state.puzzle.answers[0]) game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe("correct");
    expect(state.score).toBe(1);
  });

  it("rejects a wrong answer and resets streak", () => {
    const game = buildCryptoGame("t", "T", generateBase64Puzzle);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.1]) };
    const state = game.init(ctx);
    for (const ch of "zzznotitzzz") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe("wrong");
    expect(state.score).toBe(0);
  });

  it("generates a fresh puzzle after the feedback pause resolves", () => {
    const game = buildCryptoGame("t", "T", generateBase64Puzzle);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.1, 0.9]) };
    const state = game.init(ctx);
    const firstPrompt = state.puzzle.prompt;
    for (const ch of state.puzzle.answers[0]) game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    state.feedbackUntil = 0; // force the pause to be over
    game.tick?.(state, ctx);
    expect(state.feedback).toBe(null);
    expect(state.current).toBe("");
  });
});

describe("crypto puzzle generators", () => {
  it("base64 puzzle answer round-trips through actual base64 decoding", () => {
    const rng = fixedRng([0.05]);
    const puzzle = generateBase64Puzzle(rng);
    const encodedMatch = puzzle.prompt.match(/\n\n\s*(\S+)/);
    expect(encodedMatch).not.toBeNull();
    const decoded = Buffer.from(encodedMatch![1], "base64").toString("utf8");
    expect(decoded).toBe(puzzle.answers[0]);
  });

  it("caesar puzzle is reversible with the stated shift", () => {
    const rng = fixedRng([0.2]);
    const puzzle = generateCaesarPuzzle(rng);
    const shiftMatch = puzzle.prompt.match(/shift (\d+)/);
    expect(shiftMatch).not.toBeNull();
    const shift = Number(shiftMatch![1]);
    expect(shift).toBeGreaterThanOrEqual(1);
    expect(shift).toBeLessThanOrEqual(25);
  });

  it("rot13 puzzle decodes back to the answer word", () => {
    const rng = fixedRng([0.3]);
    const puzzle = generateRot13Puzzle(rng);
    const encodedMatch = puzzle.prompt.match(/'([a-z]+)'/);
    expect(encodedMatch).not.toBeNull();
    const rot13 = (s: string) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));
    expect(rot13(encodedMatch![1])).toBe(puzzle.answers[0]);
  });

  it("hash-id puzzle's answer matches the actual digest algorithm", () => {
    const rng = fixedRng([0.4]);
    const puzzle = generateHashIdPuzzle(rng);
    expect(["md5", "sha1", "sha256"]).toContain(puzzle.answers[0]);
    const lengths: Record<string, number> = { md5: 32, sha1: 40, sha256: 64 };
    const hashMatch = puzzle.prompt.match(/\n\n\s*([0-9a-f]+)/);
    expect(hashMatch).not.toBeNull();
    expect(hashMatch![1].length).toBe(lengths[puzzle.answers[0]]);
  });
});
