import { WORDS } from "./data/words.js";
import { GUESS_WORDS } from "./data/guess-words.js";
import type { Game, GameContext } from "./types.js";

// GUESS_WORDS (~16k words) already contains every word in the curated WORDS
// answer pool (verified at generation time), so this set alone covers both.
const VALID_GUESSES = new Set(GUESS_WORDS);

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const RESULT_PAUSE_MS = 1800;

type LetterResult = "correct" | "present" | "absent";

export interface WordleState {
  target: string;
  guesses: string[]; // submitted guesses, uppercase
  results: LetterResult[][]; // per-guess per-letter result
  current: string; // in-progress typed letters for the active row
  message: string | null; // transient message, e.g. "not in word list"
  gameOver: boolean;
  won: boolean;
  wins: number;
  streak: number;
  bestStreak: number;
  roundOverAt: number; // timestamp; tick() starts a new round after this passes
  letterStates: Record<string, LetterResult>;
  sfxEvent: "correct" | "wrong" | null;
  rng: () => number;
}

function pickWord(rng: () => number): string {
  return WORDS[Math.floor(rng() * WORDS.length)];
}

function scoreGuess(guess: string, target: string): LetterResult[] {
  const result: LetterResult[] = Array(WORD_LEN).fill("absent");
  const targetLetters = target.split("");
  const used = Array(WORD_LEN).fill(false);

  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === "correct") continue;
    const idx = targetLetters.findIndex((c, j) => c === guess[i] && !used[j]);
    if (idx !== -1) {
      result[i] = "present";
      used[idx] = true;
    }
  }
  return result;
}

function mergeLetterStates(state: WordleState, guess: string, result: LetterResult[]) {
  const rank = { absent: 0, present: 1, correct: 2 };
  for (let i = 0; i < WORD_LEN; i++) {
    const letter = guess[i];
    const existing = state.letterStates[letter];
    if (!existing || rank[result[i]] > rank[existing]) {
      state.letterStates[letter] = result[i];
    }
  }
}

function startRound(state: WordleState) {
  state.target = pickWord(state.rng);
  state.guesses = [];
  state.results = [];
  state.current = "";
  state.message = null;
  state.gameOver = false;
  state.won = false;
  state.letterStates = {};
  state.roundOverAt = 0;
}

export const wordleGame: Game<WordleState> = {
  id: "wordle",
  title: "Wordle",
  tickIntervalMs: 100,
  capturesTextInput: true,

  init(ctx: GameContext): WordleState {
    const state: WordleState = {
      target: "",
      guesses: [],
      results: [],
      current: "",
      message: null,
      gameOver: false,
      won: false,
      wins: 0,
      streak: 0,
      bestStreak: 0,
      roundOverAt: 0,
      letterStates: {},
      sfxEvent: null,
      rng: ctx.rng,
    };
    startRound(state);
    return state;
  },

  tick(state) {
    if (state.gameOver && state.roundOverAt && Date.now() >= state.roundOverAt) {
      startRound(state);
    }
  },

  handleKey(state, key) {
    if (state.gameOver) return;

    if (key === "backspace") {
      state.current = state.current.slice(0, -1);
      state.message = null;
      return;
    }

    if (key === "enter") {
      if (state.current.length !== WORD_LEN) {
        state.message = "not enough letters";
        return;
      }
      if (!VALID_GUESSES.has(state.current)) {
        state.message = "not in word list";
        return;
      }

      const result = scoreGuess(state.current, state.target);
      state.guesses.push(state.current);
      state.results.push(result);
      mergeLetterStates(state, state.current, result);

      const won = result.every((r) => r === "correct");
      state.message = null;
      state.current = "";

      if (won) {
        state.won = true;
        state.gameOver = true;
        state.wins += 1;
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        state.sfxEvent = "correct";
        state.roundOverAt = Date.now() + RESULT_PAUSE_MS;
      } else if (state.guesses.length >= MAX_GUESSES) {
        state.gameOver = true;
        state.won = false;
        state.streak = 0;
        state.sfxEvent = "wrong";
        state.roundOverAt = Date.now() + RESULT_PAUSE_MS;
      }
      return;
    }

    // single printable letter
    if (/^[a-zA-Z]$/.test(key) && state.current.length < WORD_LEN) {
      state.current += key.toUpperCase();
      state.message = null;
    }
  },

  render(state) {
    const rows: string[] = [];
    const colorTag: Record<LetterResult, string> = { correct: "green", present: "yellow", absent: "grey" };

    for (let r = 0; r < MAX_GUESSES; r++) {
      if (r < state.guesses.length) {
        const guess = state.guesses[r];
        const result = state.results[r];
        rows.push(
          guess
            .split("")
            .map((ch, i) => `{${colorTag[result[i]]}-bg}{white-fg}{bold} ${ch} {/bold}{/white-fg}{/${colorTag[result[i]]}-bg}`)
            .join(" ")
        );
      } else if (r === state.guesses.length && !state.gameOver) {
        const padded = state.current.padEnd(WORD_LEN, " ");
        rows.push(
          padded
            .split("")
            .map((ch) => (ch === " " ? "{grey-fg} _ {/grey-fg}" : ` {bold}${ch}{/bold} `))
            .join(" ")
        );
      } else {
        rows.push("{grey-fg} _   _   _   _   _ {/grey-fg}");
      }
    }

    if (state.message) rows.push("", `{yellow-fg}${state.message}{/yellow-fg}`);

    if (state.gameOver) {
      rows.push("");
      rows.push(state.won ? "{green-fg}{bold}Solved it!{/bold}{/green-fg}" : `{red-fg}{bold}Out of guesses.{/bold}{/red-fg} word was {bold}${state.target}{/bold}`);
    }

    return rows.join("\n");
  },

  sidebar(state) {
    const lines = [`{bold}Wins{/bold}    ${state.wins}`, `{bold}Streak{/bold}  ${state.streak}`, `{bold}Best{/bold}    ${state.bestStreak}`];
    if (!state.gameOver) lines.push("", `Guess ${state.guesses.length + 1}/${MAX_GUESSES}`, "type letters, enter to submit");

    const order = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
    const colorFor: Record<string, string> = { correct: "green", present: "yellow", absent: "grey" };
    const kb = order.map((l) => {
      const st = state.letterStates[l];
      return st ? `{${colorFor[st]}-fg}${l}{/${colorFor[st]}-fg}` : `{grey-fg}${l}{/grey-fg}`;
    });
    lines.push("", kb.slice(0, 10).join(""), kb.slice(10, 19).join(""), kb.slice(19).join(""));
    return lines;
  },

  isOver() {
    return false;
  },

  score(state) {
    return state.wins;
  },

  consumeSfxEvent(state) {
    const e = state.sfxEvent;
    state.sfxEvent = null;
    return e;
  },
};
