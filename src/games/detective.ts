import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DETECTIVE_CASES, type DetectiveCase } from "./data/detective-cases.js";
import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

const RECORD_FILE = join(homedir(), ".sidequest", "detective-progress.json");
const CASE_XP = 30;

function loadSolved(): Set<string> {
  try {
    if (existsSync(RECORD_FILE)) return new Set(JSON.parse(readFileSync(RECORD_FILE, "utf8")));
  } catch {
    // fall through
  }
  return new Set();
}

function saveSolved(solved: Set<string>): void {
  try {
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(RECORD_FILE, JSON.stringify([...solved]));
  } catch {
    // best-effort
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickCase(rng: () => number, solved: Set<string>): DetectiveCase {
  const unsolved = DETECTIVE_CASES.filter((c) => !solved.has(c.id));
  const pool = unsolved.length ? unsolved : DETECTIVE_CASES;
  return pool[Math.floor(rng() * pool.length)];
}

export interface DetectiveState {
  caseData: DetectiveCase;
  phase: "briefing" | "investigating" | "answering" | "solved" | "wrong";
  clueIndex: number;
  current: string;
  solved: Set<string>;
  rng: () => number;
  sfxEvent: "correct" | "wrong" | null;
}

export const detectiveGame: Game<DetectiveState> = {
  id: "detective",
  title: "Detective Mode",
  tickIntervalMs: null,
  capturesTextInput: true,

  init(ctx: GameContext): DetectiveState {
    const solved = loadSolved();
    return {
      caseData: pickCase(ctx.rng, solved),
      phase: "briefing",
      clueIndex: 0,
      current: "",
      solved,
      rng: ctx.rng,
      sfxEvent: null,
    };
  },

  handleKey(state, key) {
    if (state.phase === "briefing") {
      if (key === "enter" || key === "space") state.phase = "investigating";
      return;
    }

    if (state.phase === "investigating") {
      const n = state.caseData.clues.length;
      if (key === "left" || key === "up") state.clueIndex = (state.clueIndex - 1 + n) % n;
      else if (key === "right" || key === "down") state.clueIndex = (state.clueIndex + 1) % n;
      else if (key === "a" || key === "enter") state.phase = "answering";
      return;
    }

    if (state.phase === "answering") {
      if (key === "backspace") {
        state.current = state.current.slice(0, -1);
        return;
      }
      if (key === "b") {
        state.phase = "investigating";
        return;
      }
      if (key === "space") {
        if (state.current.length < 60) state.current += " ";
        return;
      }
      if (key === "enter") {
        if (!state.current.trim()) return;
        const correct = state.caseData.answers.some((a) => normalize(a) === normalize(state.current));
        if (correct) {
          state.phase = "solved";
          state.sfxEvent = "correct";
          if (!state.solved.has(state.caseData.id)) {
            state.solved.add(state.caseData.id);
            saveSolved(state.solved);
            awardXp(CASE_XP, "challenges");
          }
        } else {
          state.phase = "wrong";
          state.sfxEvent = "wrong";
        }
        return;
      }
      if (key.length === 1 && state.current.length < 60) {
        state.current += key;
      }
      return;
    }

    if (state.phase === "wrong") {
      if (key === "b" || key === "enter") {
        state.phase = "investigating";
        state.current = "";
      }
      return;
    }

    if (state.phase === "solved") {
      if (key === "space" || key === "n") {
        state.caseData = pickCase(state.rng, state.solved);
        state.phase = "briefing";
        state.clueIndex = 0;
        state.current = "";
      }
    }
  },

  render(state) {
    if (state.phase === "briefing") {
      return [`{bold}{yellow-fg}CASE: ${state.caseData.title}{/yellow-fg}{/bold}`, "", state.caseData.briefing, "", "{grey-fg}press enter to begin investigating{/grey-fg}"].join(
        "\n"
      );
    }

    if (state.phase === "investigating") {
      const clue = state.caseData.clues[state.clueIndex];
      return [
        `{bold}{cyan-fg}[${clue.label}]{/cyan-fg}{/bold}  {grey-fg}(${state.clueIndex + 1}/${state.caseData.clues.length}){/grey-fg}`,
        "",
        clue.content,
      ].join("\n");
    }

    if (state.phase === "answering") {
      return [
        `{bold}${escapeTags(state.caseData.question)}{/bold}`,
        "",
        `{cyan-fg}{bold}❯{/bold}{/cyan-fg} ${escapeTags(state.current)}{blink}{cyan-fg}▌{/cyan-fg}{/blink}`,
      ].join("\n");
    }

    if (state.phase === "wrong") {
      return [`{red-bg}{white-fg}{bold} ${escapeTags(state.current)} ✗ {/bold}{/white-fg}{/red-bg}`, "", "{yellow-fg}not quite. review the evidence again.{/yellow-fg}", "", "{grey-fg}b = back to evidence{/grey-fg}"].join(
        "\n"
      );
    }

    // solved
    return [
      "{green-bg}{black-fg}{bold} CASE SOLVED {/bold}{/black-fg}{/green-bg}",
      "",
      `{bold}${escapeTags(state.caseData.title)}{/bold}`,
      `Answer: {green-fg}{bold}${escapeTags(state.caseData.answers[0])}{/bold}{/green-fg}`,
      "",
      "{grey-fg}space = next case{/grey-fg}",
    ].join("\n");
  },

  sidebar(state) {
    const solvedCount = state.solved.size;
    const lines = [`{bold}Cases solved{/bold}  ${solvedCount}/${DETECTIVE_CASES.length}`, ""];
    if (state.phase === "investigating") {
      lines.push("{grey-fg}←/→ browse evidence{/grey-fg}", "{grey-fg}a = give your answer{/grey-fg}");
    } else if (state.phase === "answering") {
      lines.push("{grey-fg}type your answer,{/grey-fg}", "{grey-fg}enter to submit{/grey-fg}", "{grey-fg}b = back to evidence{/grey-fg}");
    }
    return lines;
  },

  isOver() {
    return false;
  },

  score(state) {
    return state.solved.size;
  },

  consumeSfxEvent(state) {
    const e = state.sfxEvent;
    state.sfxEvent = null;
    return e;
  },
};

function escapeTags(s: string): string {
  return s.replace(/[{}]/g, (c) => (c === "{" ? "{open}" : "{close}"));
}
