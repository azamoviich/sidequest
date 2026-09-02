import type { Game, GameContext } from "./types.js";

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface QuizState {
  questions: QuizQuestion[];
  order: number[];
  pos: number;
  displayedChoices: number[]; // indices into current question's choices, truncated by difficulty
  score: number;
  streak: number;
  best: number;
  selected: number | null; // index into displayedChoices
  feedback: "correct" | "wrong" | null;
  feedbackUntil: number;
  sfxEvent: "correct" | "wrong" | null;
  rng: () => number;
}

const CHOICES_BY_DIFFICULTY = { easy: 2, medium: 3, hard: 4 } as const;
const FEEDBACK_MS = 800;

function shuffledIndices(n: number, rng: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDisplayedChoices(q: QuizQuestion, difficulty: keyof typeof CHOICES_BY_DIFFICULTY, rng: () => number): number[] {
  const wantCount = Math.min(CHOICES_BY_DIFFICULTY[difficulty], q.choices.length);
  const others = q.choices.map((_, i) => i).filter((i) => i !== q.correctIndex);
  const shuffledOthers = shuffledIndices(others.length, rng).map((i) => others[i]);
  const picked = [q.correctIndex, ...shuffledOthers.slice(0, wantCount - 1)];
  return shuffledIndices(picked.length, rng).map((i) => picked[i]);
}

export function buildQuizGame(id: string, title: string, questions: QuizQuestion[]): Game<QuizState> {
  return {
    id,
    title,
    tickIntervalMs: 100,

    init(ctx: GameContext): QuizState {
      const order = shuffledIndices(questions.length, ctx.rng);
      const q = questions[order[0]];
      return {
        questions,
        order,
        pos: 0,
        displayedChoices: buildDisplayedChoices(q, ctx.difficulty, ctx.rng),
        score: 0,
        streak: 0,
        best: 0,
        selected: null,
        feedback: null,
        feedbackUntil: 0,
        sfxEvent: null,
        rng: ctx.rng,
      };
    },

    tick(state, ctx) {
      if (state.feedback && Date.now() >= state.feedbackUntil) {
        state.pos += 1;
        if (state.pos >= state.order.length) {
          state.order = shuffledIndices(state.questions.length, state.rng);
          state.pos = 0;
        }
        const q = state.questions[state.order[state.pos]];
        state.displayedChoices = buildDisplayedChoices(q, ctx.difficulty, state.rng);
        state.selected = null;
        state.feedback = null;
      }
    },

    handleKey(state, key) {
      if (state.feedback) return; // waiting out the feedback pause
      const num = { "1": 0, "2": 1, "3": 2, "4": 3 }[key];
      if (num === undefined || num >= state.displayedChoices.length) return;

      const q = state.questions[state.order[state.pos]];
      const chosenOriginalIndex = state.displayedChoices[num];
      const correct = chosenOriginalIndex === q.correctIndex;

      state.selected = num;
      state.feedback = correct ? "correct" : "wrong";
      state.feedbackUntil = Date.now() + FEEDBACK_MS;
      state.sfxEvent = correct ? "correct" : "wrong";

      if (correct) {
        state.score += 1;
        state.streak += 1;
        state.best = Math.max(state.best, state.streak);
      } else {
        state.streak = 0;
      }
    },

    render(state) {
      const q = state.questions[state.order[state.pos]];
      const letters = ["1", "2", "3", "4"];
      const optionColors = ["red", "blue", "yellow", "green"];
      // Prompts are static, trusted, bundled data (some embed intentional
      // blessed color tags, e.g. the flag color bands) — not escaped. Choice
      // text is plain data too but escaped defensively since it's rendered
      // inline inside our own generated markup.
      const lines = [`{bold}${q.prompt}{/bold}`, ""];
      state.displayedChoices.forEach((choiceIdx, i) => {
        const text = escapeTags(q.choices[choiceIdx]);
        const isCorrect = choiceIdx === q.correctIndex;
        const label = ` ${letters[i]}) ${text} `;

        let styled: string;
        if (state.feedback) {
          if (isCorrect) {
            styled = `{green-bg}{white-fg}{bold}${label} ✓{/bold}{/white-fg}{/green-bg}`;
          } else if (state.selected === i) {
            styled = `{red-bg}{white-fg}{bold}${label} ✗{/bold}{/white-fg}{/red-bg}`;
          } else {
            styled = `{grey-fg}${label}{/grey-fg}`;
          }
        } else {
          const color = optionColors[i % optionColors.length];
          styled = `{${color}-bg}{white-fg}{bold}${label}{/bold}{/white-fg}{/${color}-bg}`;
        }
        lines.push(styled, "");
      });
      return lines.join("\n");
    },

    sidebar(state) {
      const lines = [`{bold}Score{/bold}   ${state.score}`, `{bold}Streak{/bold}  ${state.streak}`, `{bold}Best{/bold}    ${state.best}`];
      if (state.feedback === "correct") lines.push("", "{green-fg}{bold}Correct! ✓{/bold}{/green-fg}");
      if (state.feedback === "wrong") lines.push("", "{red-fg}{bold}Wrong ✗{/bold}{/red-fg}");
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
