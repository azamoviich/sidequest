import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DAILY_CHALLENGES, type DailyChallenge } from "./data/daily-challenges.js";
import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

const RECORD_FILE = join(homedir(), ".sidequest", "daily-challenge.json");
const DAILY_XP = 25;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic pick — same challenge for everyone on a given calendar date. */
function todaysChallenge(): DailyChallenge {
  const d = today();
  let hash = 0;
  for (let i = 0; i < d.length; i++) hash = (hash * 31 + d.charCodeAt(i)) >>> 0;
  return DAILY_CHALLENGES[hash % DAILY_CHALLENGES.length];
}

interface DailyRecord {
  date: string;
  solved: boolean;
  attempts: number;
}

function loadRecord(): DailyRecord {
  try {
    if (existsSync(RECORD_FILE)) {
      const r = JSON.parse(readFileSync(RECORD_FILE, "utf8")) as DailyRecord;
      if (r.date === today()) return r;
    }
  } catch {
    // fall through to fresh record
  }
  return { date: today(), solved: false, attempts: 0 };
}

function saveRecord(r: DailyRecord): void {
  try {
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(RECORD_FILE, JSON.stringify(r));
  } catch {
    // best-effort
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface DailyChallengeState {
  challenge: DailyChallenge;
  record: DailyRecord;
  current: string;
  feedback: "correct" | "wrong" | null;
  sfxEvent: "correct" | "wrong" | null;
}

export const dailyChallengeGame: Game<DailyChallengeState> = {
  id: "daily-challenge",
  title: "Daily Challenge",
  tickIntervalMs: null,
  capturesTextInput: true,

  init(_ctx: GameContext): DailyChallengeState {
    return {
      challenge: todaysChallenge(),
      record: loadRecord(),
      current: "",
      feedback: null,
      sfxEvent: null,
    };
  },

  handleKey(state, key) {
    if (state.record.solved) return;

    if (key === "backspace") {
      state.current = state.current.slice(0, -1);
      state.feedback = null;
      return;
    }
    if (key === "space") {
      if (state.current.length < 60) state.current += " ";
      return;
    }
    if (key === "enter") {
      if (!state.current.trim()) return;
      const correct = state.challenge.answers.some((a) => normalize(a) === normalize(state.current));
      state.record.attempts += 1;
      if (correct) {
        state.record.solved = true;
        state.feedback = "correct";
        state.sfxEvent = "correct";
        awardXp(DAILY_XP, "challenges");
      } else {
        state.feedback = "wrong";
        state.sfxEvent = "wrong";
      }
      saveRecord(state.record);
      return;
    }
    if (key.length === 1 && state.current.length < 60) {
      state.current += key;
      state.feedback = null;
    }
  },

  render(state) {
    if (state.record.solved) {
      return [
        "{green-bg}{black-fg}{bold} ✓ SOLVED {/bold}{/black-fg}{/green-bg}",
        "",
        `{bold}[${state.challenge.category}]{/bold} ${state.challenge.prompt}`,
        "",
        `{green-fg}Answer: {bold}${state.challenge.answers[0]}{/bold}{/green-fg}`,
        "",
        "{grey-fg}come back tomorrow for a new one{/grey-fg}",
      ].join("\n");
    }

    const lines = [`{bold}[${state.challenge.category}]{/bold}`, "", state.challenge.prompt, ""];
    if (state.feedback === "wrong") {
      lines.push(`{red-bg}{white-fg}{bold} ${state.current || "(nothing typed)"} ✗ {/bold}{/white-fg}{/red-bg}`, "", "{yellow-fg}not quite — try again{/yellow-fg}", "");
    } else {
      lines.push(`{cyan-fg}{bold}❯{/bold}{/cyan-fg} ${state.current}{blink}{cyan-fg}▌{/cyan-fg}{/blink}`);
    }
    return lines.join("\n");
  },

  sidebar(state) {
    if (state.record.solved) {
      return [`{bold}Attempts{/bold}  ${state.record.attempts}`, "", `{green-fg}{bold}+${DAILY_XP} XP earned{/bold}{/green-fg}`];
    }
    return [`{bold}Attempts{/bold}  ${state.record.attempts}`, "", "{grey-fg}type your answer,{/grey-fg}", "{grey-fg}enter to submit{/grey-fg}"];
  },

  isOver() {
    return false;
  },

  score(state) {
    return state.record.solved ? 1 : 0;
  },

  consumeSfxEvent(state) {
    const e = state.sfxEvent;
    state.sfxEvent = null;
    return e;
  },
};
