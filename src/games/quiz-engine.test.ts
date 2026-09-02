import { describe, it, expect } from "vitest";
import { buildQuizGame, type QuizQuestion } from "./quiz-engine.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

const QUESTIONS: QuizQuestion[] = [
  { prompt: "2 + 2?", choices: ["3", "4", "5", "6"], correctIndex: 1 },
  { prompt: "Capital of France?", choices: ["Berlin", "Madrid", "Paris", "Rome"], correctIndex: 2 },
];

describe("quiz-engine", () => {
  it("respects difficulty choice count", () => {
    const game = buildQuizGame("test", "Test Quiz", QUESTIONS);
    const easy = game.init({ difficulty: "easy", rng: fixedRng([0]) });
    expect(easy.displayedChoices.length).toBe(2);

    const hard = game.init({ difficulty: "hard", rng: fixedRng([0]) });
    expect(hard.displayedChoices.length).toBe(4);
  });

  it("always includes the correct answer among displayed choices", () => {
    const game = buildQuizGame("test", "Test Quiz", QUESTIONS);
    const ctx = { difficulty: "medium" as const, rng: fixedRng([0.9, 0.1, 0.5, 0.2]) };
    const state = game.init(ctx);
    const q = state.questions[state.order[state.pos]];
    const includesCorrect = state.displayedChoices.includes(q.correctIndex);
    expect(includesCorrect).toBe(true);
  });

  it("awards a point and sets correct feedback on right answer", () => {
    const game = buildQuizGame("test", "Test Quiz", QUESTIONS);
    const ctx = { difficulty: "easy" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    const q = state.questions[state.order[state.pos]];
    const correctDisplayIdx = state.displayedChoices.indexOf(q.correctIndex);

    game.handleKey(state, String(correctDisplayIdx + 1), ctx);

    expect(state.score).toBe(1);
    expect(state.feedback).toBe("correct");
    expect(game.consumeSfxEvent?.(state)).toBe("correct");
  });

  it("does not award a point on wrong answer and resets streak", () => {
    const game = buildQuizGame("test", "Test Quiz", QUESTIONS);
    const ctx = { difficulty: "easy" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    const q = state.questions[state.order[state.pos]];
    const wrongDisplayIdx = state.displayedChoices.findIndex((i) => i !== q.correctIndex);

    game.handleKey(state, String(wrongDisplayIdx + 1), ctx);

    expect(state.score).toBe(0);
    expect(state.feedback).toBe("wrong");
    expect(state.streak).toBe(0);
  });

  it("ignores further input while feedback is showing", () => {
    const game = buildQuizGame("test", "Test Quiz", QUESTIONS);
    const ctx = { difficulty: "easy" as const, rng: fixedRng([0]) };
    const state = game.init(ctx);
    game.handleKey(state, "1", ctx);
    const scoreAfterFirst = state.score;
    game.handleKey(state, "1", ctx);
    expect(state.score).toBe(scoreAfterFirst);
  });
});
