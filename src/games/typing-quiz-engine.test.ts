import { describe, it, expect } from "vitest";
import { buildTypingQuizGame, type TypingQuestion } from "./typing-quiz-engine.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

const QUESTIONS: TypingQuestion[] = [
  { prompt: "HTTP method for retrieving data?", answers: ["get"] },
  { prompt: "Big-O of binary search?", answers: ["o(log n)", "log n"] },
];

describe("typing-quiz-engine", () => {
  it("accepts a correct answer case-insensitively", () => {
    const game = buildTypingQuizGame("test", "Test", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    const q = state.questions[state.order[state.pos]];
    for (const ch of q.answers[0].toUpperCase()) game.handleKey(state, ch === " " ? "space" : ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe("correct");
    expect(state.score).toBe(1);
  });

  it("accepts any listed alternate answer", () => {
    const game = buildTypingQuizGame("test", "Test", [QUESTIONS[1]]);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    for (const ch of "log n") game.handleKey(state, ch === " " ? "space" : ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe("correct");
  });

  it("rejects a wrong answer and resets streak", () => {
    const game = buildTypingQuizGame("test", "Test", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    for (const ch of "post") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe("wrong");
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
  });

  it("backspace removes the last typed character", () => {
    const game = buildTypingQuizGame("test", "Test", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    game.handleKey(state, "g", ctx);
    game.handleKey(state, "e", ctx);
    game.handleKey(state, "x", ctx);
    game.handleKey(state, "backspace", ctx);
    expect(state.current).toBe("ge");
  });

  it("ignores empty-input enter (no accidental wrong-answer spam)", () => {
    const game = buildTypingQuizGame("test", "Test", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.feedback).toBe(null);
  });

  it("ignores further input while feedback is showing", () => {
    const game = buildTypingQuizGame("test", "Test", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    for (const ch of "post") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    const scoreAfterFirst = state.score;
    for (const ch of "get") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.score).toBe(scoreAfterFirst);
  });
});
