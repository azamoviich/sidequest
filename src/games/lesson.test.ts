import { describe, it, expect } from "vitest";
import { buildLessonGame } from "./lesson.js";
import type { Lesson } from "./data/lessons.js";

const ctx = { difficulty: "medium" as const, rng: Math.random };

const TEST_LESSON: Lesson = {
  id: "test-lesson",
  title: "Test Lesson",
  steps: [
    { info: "Step one info.", question: "What is 1?", answers: ["one"] },
    { info: "Step two info.", question: "What is 2?", answers: ["two"] },
  ],
  summary: "You learned the test lesson.",
};

describe("lesson", () => {
  it("starts on the info phase of step 0", () => {
    const game = buildLessonGame(TEST_LESSON);
    const state = game.init(ctx);
    expect(state.phase).toBe("info");
    expect(state.stepIndex).toBe(0);
  });

  it("advances info -> question -> feedback -> next step's info", () => {
    const game = buildLessonGame(TEST_LESSON);
    const state = game.init(ctx);
    game.handleKey(state, "enter", ctx); // info -> question
    expect(state.phase).toBe("question");
    for (const ch of "one") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx); // question -> feedback
    expect(state.phase).toBe("feedback");
    expect(state.lastCorrect).toBe(true);
    game.handleKey(state, "enter", ctx); // feedback -> next step info
    expect(state.phase).toBe("info");
    expect(state.stepIndex).toBe(1);
  });

  it("wrong answers still advance instead of blocking progress", () => {
    const game = buildLessonGame(TEST_LESSON);
    const state = game.init(ctx);
    game.handleKey(state, "enter", ctx);
    for (const ch of "totallywrong") game.handleKey(state, ch, ctx);
    game.handleKey(state, "enter", ctx);
    expect(state.phase).toBe("feedback");
    expect(state.lastCorrect).toBe(false);
    game.handleKey(state, "enter", ctx);
    expect(state.stepIndex).toBe(1); // advanced anyway
  });

  it("reaches complete after the last step and marks it completed", () => {
    const game = buildLessonGame(TEST_LESSON);
    const state = game.init(ctx);
    for (let i = 0; i < TEST_LESSON.steps.length; i++) {
      game.handleKey(state, "enter", ctx); // info -> question
      for (const ch of TEST_LESSON.steps[i].answers[0]) game.handleKey(state, ch, ctx);
      game.handleKey(state, "enter", ctx); // question -> feedback
      game.handleKey(state, "enter", ctx); // feedback -> next (or complete)
    }
    expect(state.phase).toBe("complete");
    expect(state.completed.has("test-lesson")).toBe(true);
  });
});
