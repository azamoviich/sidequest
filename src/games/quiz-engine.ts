import type { Game, GameContext } from "./types.js";

export interface QuizQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Pre-rendered, trusted blessed markup shown below the prompt (e.g. flag color bands).
   * Only ever set by our own bundled data, never by external/API text — `prompt` and
   * `choices` are always escaped since they may come from an untrusted live API. */
  visual?: string;
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
  loading: boolean;
  loadNote: string | null; // e.g. "offline — using bundled questions"
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

function loadQuestionsInto(state: QuizState, questions: QuizQuestion[], ctx: GameContext) {
  state.questions = questions;
  state.order = shuffledIndices(questions.length, ctx.rng);
  state.pos = 0;
  state.displayedChoices = buildDisplayedChoices(questions[state.order[0]], ctx.difficulty, ctx.rng);
  state.loading = false;
}

export type QuizSource = QuizQuestion[] | ((ctx: GameContext) => Promise<QuizQuestion[]>);

/**
 * `source` can be a static bundled list, or an async fetcher (e.g. a live
 * trivia API). When it's a fetcher, the game starts in a "loading" state and
 * `fallback` (if given) is used if the fetch fails or times out — so a live
 * question source degrades gracefully instead of leaving the game stuck.
 */
export function buildQuizGame(id: string, title: string, source: QuizSource, fallback?: QuizQuestion[]): Game<QuizState> {
  return {
    id,
    title,
    tickIntervalMs: 100,

    init(ctx: GameContext): QuizState {
      const base: QuizState = {
        questions: [],
        order: [],
        pos: 0,
        displayedChoices: [],
        score: 0,
        streak: 0,
        best: 0,
        selected: null,
        feedback: null,
        feedbackUntil: 0,
        sfxEvent: null,
        rng: ctx.rng,
        loading: false,
        loadNote: null,
      };

      if (Array.isArray(source)) {
        loadQuestionsInto(base, source, ctx);
        return base;
      }

      base.loading = true;
      source(ctx)
        .then((qs) => {
          if (!qs.length) throw new Error("empty question set");
          loadQuestionsInto(base, qs, ctx);
        })
        .catch(() => {
          if (fallback?.length) {
            loadQuestionsInto(base, fallback, ctx);
            base.loadNote = "couldn't reach live trivia — using bundled questions";
          } else {
            base.loadNote = "couldn't load questions — check your connection";
          }
        });
      return base;
    },

    tick(state, ctx) {
      if (state.loading) return;
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
      if (state.loading || state.questions.length === 0) return;
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
      if (state.loading) {
        return "{grey-fg}loading trivia questions...{/grey-fg}";
      }
      if (state.questions.length === 0) {
        return `{red-fg}${state.loadNote ?? "no questions available"}{/red-fg}`;
      }

      const q = state.questions[state.order[state.pos]];
      const letters = ["1", "2", "3", "4"];
      const optionColors = ["red", "blue", "yellow", "green"];
      // prompt/choices may come from a live external API — always escaped.
      // `visual` (e.g. flag color bands) is only ever set by our own trusted
      // bundled data, so it's safe to inline as real markup, unescaped.
      const lines = [`{bold}${escapeTags(q.prompt)}{/bold}`];
      if (q.visual) lines.push("", q.visual);
      lines.push("");
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
      if (state.loading) return ["{grey-fg}fetching questions...{/grey-fg}"];
      const streakTag = state.streak >= 5 ? "{red-fg}{bold}" : state.streak >= 3 ? "{yellow-fg}{bold}" : "";
      const streakClose = state.streak >= 3 ? "{/bold}" + (state.streak >= 5 ? "{/red-fg}" : "{/yellow-fg}") : "";
      const lines = [
        `{bold}Score{/bold}   ${state.score}`,
        `{bold}Streak{/bold}  ${streakTag}${state.streak}${streakClose}`,
        `{bold}Best{/bold}    ${state.best}`,
      ];
      if (state.feedback === "correct") lines.push("", "{green-fg}{bold}Correct! ✓{/bold}{/green-fg}");
      if (state.feedback === "wrong") lines.push("", "{red-fg}{bold}Wrong ✗{/bold}{/red-fg}");
      if (state.loadNote) lines.push("", `{yellow-fg}${state.loadNote}{/yellow-fg}`);
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
