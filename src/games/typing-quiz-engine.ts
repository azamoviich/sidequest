import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

export interface TypingQuestion {
  prompt: string;
  /** accepted answers, matched case-insensitively after trimming; first entry is shown on a wrong answer */
  answers: string[];
}

export interface TypingQuizState {
  questions: TypingQuestion[];
  order: number[];
  pos: number;
  current: string;
  score: number;
  streak: number;
  best: number;
  feedback: "correct" | "wrong" | null;
  feedbackUntil: number;
  sfxEvent: "correct" | "wrong" | null;
  rng: () => number;
}

const FEEDBACK_MS = 1200; // longer than the multiple-choice quiz — there's a revealed answer to actually read here
const MAX_INPUT_LEN = 60;

function shuffledIndices(n: number, rng: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrectAnswer(q: TypingQuestion, input: string): boolean {
  const normalized = normalize(input);
  return q.answers.some((a) => normalize(a) === normalized);
}

export function buildTypingQuizGame(id: string, title: string, questions: TypingQuestion[]): Game<TypingQuizState> {
  return {
    id,
    title,
    tickIntervalMs: 100,
    capturesTextInput: true,

    init(ctx: GameContext): TypingQuizState {
      return {
        questions,
        order: shuffledIndices(questions.length, ctx.rng),
        pos: 0,
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
        state.pos += 1;
        if (state.pos >= state.order.length) {
          state.order = shuffledIndices(state.questions.length, state.rng);
          state.pos = 0;
        }
        state.current = "";
        state.feedback = null;
      }
    },

    handleKey(state, key) {
      if (state.feedback) return; // waiting out the feedback pause

      if (key === "backspace") {
        state.current = state.current.slice(0, -1);
        return;
      }

      if (key === "enter") {
        if (!state.current.trim()) return;
        const q = state.questions[state.order[state.pos]];
        const correct = isCorrectAnswer(q, state.current);

        state.feedback = correct ? "correct" : "wrong";
        state.feedbackUntil = Date.now() + FEEDBACK_MS;
        state.sfxEvent = correct ? "correct" : "wrong";

        if (correct) {
          state.score += 1;
          state.streak += 1;
          state.best = Math.max(state.best, state.streak);
          awardXp(10, "quizzes");
        } else {
          state.streak = 0;
          awardXp(2, "quizzes");
        }
        return;
      }

      if (key === "space") {
        if (state.current.length < MAX_INPUT_LEN) state.current += " ";
        return;
      }

      // single printable character (letters, digits, punctuation used in
      // answers like "O(1)", "git checkout -b", ":hover")
      if (key.length === 1 && state.current.length < MAX_INPUT_LEN) {
        state.current += key;
      }
    },

    render(state) {
      const q = state.questions[state.order[state.pos]];
      const lines = [`{bold}${escapeTags(q.prompt)}{/bold}`, ""];

      if (state.feedback) {
        const shown = escapeTags(state.current || "(nothing typed)");
        if (state.feedback === "correct") {
          lines.push(`{green-bg}{white-fg}{bold} ${shown} ✓ {/bold}{/white-fg}{/green-bg}`);
        } else {
          lines.push(`{red-bg}{white-fg}{bold} ${shown} ✗ {/bold}{/white-fg}{/red-bg}`);
          lines.push("", `{green-fg}Answer: {bold}${escapeTags(q.answers[0])}{/bold}{/green-fg}`);
        }
      } else {
        lines.push(`{cyan-fg}{bold}❯{/bold}{/cyan-fg} ${escapeTags(state.current)}{blink}{cyan-fg}▌{/cyan-fg}{/blink}`);
      }

      return lines.join("\n");
    },

    sidebar(state) {
      const streakTag = state.streak >= 5 ? "{red-fg}{bold}" : state.streak >= 3 ? "{yellow-fg}{bold}" : "";
      const streakClose = state.streak >= 3 ? "{/bold}" + (state.streak >= 5 ? "{/red-fg}" : "{/yellow-fg}") : "";
      const lines = [
        `{bold}Score{/bold}   ${state.score}`,
        `{bold}Streak{/bold}  ${streakTag}${state.streak}${streakClose}`,
        `{bold}Best{/bold}    ${state.best}`,
      ];
      if (state.feedback === "correct") lines.push("", "{green-fg}{bold}Correct! ✓{/bold}{/green-fg}");
      if (state.feedback === "wrong") lines.push("", "{red-fg}{bold}Wrong ✗{/bold}{/red-fg}");
      lines.push("", "{grey-fg}type your answer,{/grey-fg}", "{grey-fg}enter to submit{/grey-fg}");
      return lines;
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
