import { describe, it, expect } from "vitest";
import { createSnakeState, setDirection, step } from "./snake.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("snake", () => {
  it("moves forward each step", () => {
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    state.started = true;
    const before = state.snake[0];
    step(state);
    const after = state.snake[0];
    expect(after.x).toBe(before.x + 1); // starts moving right
    expect(after.y).toBe(before.y);
  });

  it("eats food and grows, scoring a point", () => {
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    state.started = true;
    state.food = { x: state.snake[0].x + 1, y: state.snake[0].y };
    const lengthBefore = state.snake.length;
    step(state);
    expect(state.score).toBe(1);
    expect(state.snake.length).toBe(lengthBefore + 1);
    expect(state.sfxEvent).toBe("eat");
  });

  it("dies on wall collision", () => {
    const state = createSnakeState(3, 3, fixedRng([0.1]));
    state.started = true;
    // snake starts near center of a 3-wide grid facing right; step until it hits the wall
    for (let i = 0; i < 5 && !state.gameOver; i++) step(state);
    expect(state.gameOver).toBe(true);
    expect(state.sfxEvent).toBe("gameover");
  });

  it("dies when the head moves into its own body", () => {
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    // a 4-segment loop where turning "down" drives the head into a body segment
    // that isn't the tail (the tail cell is vacated this same step, so it must
    // be a genuine mid-body collision, not a false positive on the freed tail).
    state.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
    ];
    state.direction = "left";
    state.started = true;
    setDirection(state, "down");
    step(state);
    expect(state.gameOver).toBe(true);
    expect(state.sfxEvent).toBe("gameover");
  });

  it("does not move until started (no auto-death while idle)", () => {
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    const before = JSON.stringify(state.snake);
    for (let i = 0; i < 10; i++) step(state);
    expect(JSON.stringify(state.snake)).toBe(before);
    expect(state.gameOver).toBe(false);
  });

  it("ignores a 180-degree reversal", () => {
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    setDirection(state, "left"); // direct opposite of initial "right"
    expect(state.pendingDirection).toBe("right");
  });

  it("ignores a reversal chained across two rapid key presses in the same tick", () => {
    // regression: pressing "up" then "down" before the next tick applies must not
    // let the snake reverse into its own neck (state.direction is still "right"
    // for both checks until the next step() runs).
    const state = createSnakeState(10, 10, fixedRng([0.1]));
    setDirection(state, "up"); // right -> up: legal turn, queued
    setDirection(state, "down"); // up -> down would be a reversal of the *queued* turn
    expect(state.pendingDirection).toBe("up");
  });
});
