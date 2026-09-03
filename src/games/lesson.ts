import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Lesson } from "./data/lessons.js";
import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

const RECORD_FILE = join(homedir(), ".sidequest", "lessons-completed.json");
const LESSON_XP = 20;

function loadCompleted(): Set<string> {
  try {
    if (existsSync(RECORD_FILE)) return new Set(JSON.parse(readFileSync(RECORD_FILE, "utf8")));
  } catch {
    // fall through
  }
  return new Set();
}

function saveCompleted(completed: Set<string>): void {
  try {
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(RECORD_FILE, JSON.stringify([...completed]));
  } catch {
    // best-effort
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface LessonState {
  lesson: Lesson;
  stepIndex: number;
  phase: "info" | "question" | "feedback" | "complete";
  current: string;
  lastCorrect: boolean | null;
  completed: Set<string>;
  sfxEvent: "correct" | "wrong" | null;
}

export function buildLessonGame(lesson: Lesson): Game<LessonState> {
  return {
    id: `lesson-${lesson.id}`,
    title: lesson.title,
    tickIntervalMs: null,
    capturesTextInput: true,

    init(_ctx: GameContext): LessonState {
      return {
        lesson,
        stepIndex: 0,
        phase: "info",
        current: "",
        lastCorrect: null,
        completed: loadCompleted(),
        sfxEvent: null,
      };
    },

    handleKey(state, key) {
      if (state.phase === "info") {
        if (key === "enter" || key === "space") state.phase = "question";
        return;
      }

      if (state.phase === "question") {
        if (key === "backspace") {
          state.current = state.current.slice(0, -1);
          return;
        }
        if (key === "space") {
          if (state.current.length < 60) state.current += " ";
          return;
        }
        if (key === "enter") {
          if (!state.current.trim()) return;
          const step = state.lesson.steps[state.stepIndex];
          const correct = step.answers.some((a) => normalize(a) === normalize(state.current));
          state.lastCorrect = correct;
          state.sfxEvent = correct ? "correct" : "wrong";
          state.phase = "feedback";
          return;
        }
        if (key.length === 1 && state.current.length < 60) state.current += key;
        return;
      }

      if (state.phase === "feedback") {
        if (key === "enter" || key === "space") {
          state.current = "";
          if (state.stepIndex < state.lesson.steps.length - 1) {
            state.stepIndex += 1;
            state.phase = "info";
          } else {
            state.phase = "complete";
            if (!state.completed.has(lesson.id)) {
              state.completed.add(lesson.id);
              saveCompleted(state.completed);
              awardXp(LESSON_XP, "challenges");
            }
          }
        }
        return;
      }

      if (state.phase === "complete") {
        if (key === "r") {
          state.stepIndex = 0;
          state.phase = "info";
          state.current = "";
        }
      }
    },

    render(state) {
      const step = state.lesson.steps[state.stepIndex];
      const progress = `{grey-fg}[${state.stepIndex + 1}/${state.lesson.steps.length}]{/grey-fg}`;

      if (state.phase === "info") {
        return [`{bold}{cyan-fg}${escapeTags(state.lesson.title)}{/cyan-fg}{/bold} ${progress}`, "", step.info, "", "{grey-fg}enter to continue{/grey-fg}"].join("\n");
      }
      if (state.phase === "question") {
        return [
          `{bold}${escapeTags(step.question)}{/bold} ${progress}`,
          "",
          `{cyan-fg}{bold}❯{/bold}{/cyan-fg} ${escapeTags(state.current)}{blink}{cyan-fg}▌{/cyan-fg}{/blink}`,
        ].join("\n");
      }
      if (state.phase === "feedback") {
        const banner = state.lastCorrect
          ? "{green-bg}{black-fg}{bold} ✓ CORRECT {/bold}{/black-fg}{/green-bg}"
          : `{yellow-bg}{black-fg}{bold} ANSWER: ${step.answers[0]} {/bold}{/black-fg}{/yellow-bg}`;
        return [banner, "", "{grey-fg}enter to continue{/grey-fg}"].join("\n");
      }
      // complete
      return [
        "{green-bg}{black-fg}{bold} LESSON COMPLETE {/bold}{/black-fg}{/green-bg}",
        "",
        state.lesson.summary,
        "",
        "{grey-fg}r = review again{/grey-fg}",
      ].join("\n");
    },

    sidebar(state) {
      const total = state.completed.size;
      return [`{bold}Lessons learned{/bold}  ${total}`, "", "{grey-fg}type your answer,{/grey-fg}", "{grey-fg}enter to submit{/grey-fg}"];
    },

    isOver() {
      return false;
    },

    score(state) {
      return state.completed.has(lesson.id) ? 1 : 0;
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
