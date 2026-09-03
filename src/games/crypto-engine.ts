import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

export interface CryptoPuzzle {
  prompt: string;
  answers: string[];
}

export interface CryptoState {
  puzzle: CryptoPuzzle;
  current: string;
  score: number;
  streak: number;
  best: number;
  feedback: "correct" | "wrong" | null;
  feedbackUntil: number;
  sfxEvent: "correct" | "wrong" | null;
  rng: () => number;
}

const FEEDBACK_MS = 1200;
const MAX_INPUT_LEN = 60;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Like buildTypingQuizGame, but the puzzle is freshly generated each round
 * instead of drawn from a fixed array — used for procedurally-generated
 * crypto puzzles (Base64/Caesar/hash-ID) where "infinite content" beats a
 * curated bank, since there's no authoring cost per puzzle. */
export function buildCryptoGame(id: string, title: string, generate: (rng: () => number) => CryptoPuzzle): Game<CryptoState> {
  return {
    id,
    title,
    tickIntervalMs: 100,
    capturesTextInput: true,

    init(ctx: GameContext): CryptoState {
      return {
        puzzle: generate(ctx.rng),
        current: "",
        score: 0,
        streak: 0,
        best: 0,
        feedback: null,
        feedbackUntil: 0,
        sfxEvent: null,
        rng: ctx.rng,
      };
    },

    tick(state) {
      if (state.feedback && Date.now() >= state.feedbackUntil) {
        state.puzzle = generate(state.rng);
        state.current = "";
        state.feedback = null;
      }
    },

    handleKey(state, key) {
      if (state.feedback) return;

      if (key === "backspace") {
        state.current = state.current.slice(0, -1);
        return;
      }
      if (key === "enter") {
        if (!state.current.trim()) return;
        const correct = state.puzzle.answers.some((a) => normalize(a) === normalize(state.current));
        state.feedback = correct ? "correct" : "wrong";
        state.feedbackUntil = Date.now() + FEEDBACK_MS;
        state.sfxEvent = correct ? "correct" : "wrong";
        if (correct) {
          state.score += 1;
          state.streak += 1;
          state.best = Math.max(state.best, state.streak);
          awardXp(10, "challenges");
        } else {
          state.streak = 0;
          awardXp(2, "challenges");
        }
        return;
      }
      if (key === "space") {
        if (state.current.length < MAX_INPUT_LEN) state.current += " ";
        return;
      }
      if (key.length === 1 && state.current.length < MAX_INPUT_LEN) {
        state.current += key;
      }
    },

    render(state) {
      const lines = [`{bold}${escapeTags(state.puzzle.prompt)}{/bold}`, ""];
      if (state.feedback) {
        const shown = escapeTags(state.current || "(nothing typed)");
        if (state.feedback === "correct") {
          lines.push(`{green-bg}{white-fg}{bold} ${shown} ✓ {/bold}{/white-fg}{/green-bg}`);
        } else {
          lines.push(`{red-bg}{white-fg}{bold} ${shown} ✗ {/bold}{/white-fg}{/red-bg}`);
          lines.push("", `{green-fg}Answer: {bold}${escapeTags(state.puzzle.answers[0])}{/bold}{/green-fg}`);
        }
      } else {
        lines.push(`{cyan-fg}{bold}❯{/bold}{/cyan-fg} ${escapeTags(state.current)}{blink}{cyan-fg}▌{/cyan-fg}{/blink}`);
      }
      return lines.join("\n");
    },

    sidebar(state) {
      const streakTag = state.streak >= 5 ? "{red-fg}{bold}" : state.streak >= 3 ? "{yellow-fg}{bold}" : "";
      const streakClose = state.streak >= 3 ? "{/bold}" + (state.streak >= 5 ? "{/red-fg}" : "{/yellow-fg}") : "";
      return [
        `{bold}Score{/bold}   ${state.score}`,
        `{bold}Streak{/bold}  ${streakTag}${state.streak}${streakClose}`,
        `{bold}Best{/bold}    ${state.best}`,
        "",
        "{grey-fg}type your answer,{/grey-fg}",
        "{grey-fg}enter to submit{/grey-fg}",
      ];
    },

    isOver() {
      return false;
    },

    score(state) {
      return state.score;
    },

    consumeSfxEvent(state) {
      const e = state.sfxEvent;
      state.sfxEvent = null;
      return e;
    },
  };
}

function escapeTags(s: string): string {
  return s.replace(/[{}]/g, (c) => (c === "{" ? "{open}" : "{close}"));
}
