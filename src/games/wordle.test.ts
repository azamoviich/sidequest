import { describe, it, expect } from "vitest";
import { wordleGame, type WordleState } from "./wordle.js";

function fixedRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length];
}

function typeWord(state: WordleState, word: string) {
  for (const ch of word) wordleGame.handleKey(state, ch, { difficulty: "medium", rng: Math.random });
  wordleGame.handleKey(state, "enter", { difficulty: "medium", rng: Math.random });
}

describe("wordle", () => {
  it("scores an exact match as a win", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) }); // first word in list
    const target = state.target;
    typeWord(state, target);
    expect(state.won).toBe(true);
    expect(state.gameOver).toBe(true);
    expect(state.wins).toBe(1);
    expect(state.results[0].every((r) => r === "correct")).toBe(true);
  });

  it("rejects a guess not in the word list without consuming a turn", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) });
    typeWord(state, "ZZZZZ");
    expect(state.guesses.length).toBe(0);
    expect(state.message).toBe("not in word list");
  });

  it("marks present (wrong position) vs absent letters correctly", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) });
    state.target = "APPLE";
    // "LEAPS" isn't a real word in our list; use two real words to check cross-letters instead
    typeWord(state, "PLATE"); // P,L,A,T,E vs A,P,P,L,E
    const result = state.results[0];
    // E at index4 matches target[4]='E' -> correct
    expect(result[4]).toBe("correct");
    // P at index0: target has P at index1 and 2, not 0 -> present
    expect(result[0]).toBe("present");
  });

  it("ends the game after max guesses without a win", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) });
    state.target = "APPLE";
    const words = ["BREAD", "SPLIT", "TRUCK", "PLANT", "STORM", "CRAFT"]; // 6 wrong guesses, all real list entries
    for (const w of words) typeWord(state, w);
    expect(state.gameOver).toBe(true);
    expect(state.won).toBe(false);
    expect(state.guesses.length).toBe(6);
  });

  it("backspace removes the last typed letter", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) });
    wordleGame.handleKey(state, "a", { difficulty: "medium", rng: Math.random });
    wordleGame.handleKey(state, "b", { difficulty: "medium", rng: Math.random });
    wordleGame.handleKey(state, "backspace", { difficulty: "medium", rng: Math.random });
    expect(state.current).toBe("A");
  });

  it("ignores input once the round is over until the next round starts", () => {
    const state = wordleGame.init({ difficulty: "medium", rng: fixedRng([0]) });
    typeWord(state, state.target);
    expect(state.gameOver).toBe(true);
    wordleGame.handleKey(state, "a", { difficulty: "medium", rng: Math.random });
    expect(state.current).toBe("");
  });
});
