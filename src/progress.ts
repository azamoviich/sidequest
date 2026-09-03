import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type XpCategory = "games" | "quizzes" | "books" | "challenges";

export interface Progress {
  xp: number;
  streakDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  counts: Record<XpCategory, number>;
  /** cumulative ms spent with the agent status "working" while a watch-mode
   * session was open — the actual "time spent productively while your agent
   * worked" headline stat, not just total time the app was open. */
  productiveWaitingMs: number;
}

const DIR = join(homedir(), ".sidequest");
const FILE = join(DIR, "progress.json");

const DEFAULTS: Progress = {
  xp: 0,
  streakDays: 0,
  lastActiveDate: null,
  counts: { games: 0, quizzes: 0, books: 0, challenges: 0 },
  productiveWaitingMs: 0,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readProgress(): Progress {
  try {
    if (!existsSync(FILE)) return { ...DEFAULTS, counts: { ...DEFAULTS.counts } };
    const parsed = JSON.parse(readFileSync(FILE, "utf8"));
    return { ...DEFAULTS, ...parsed, counts: { ...DEFAULTS.counts, ...parsed.counts } };
  } catch {
    return { ...DEFAULTS, counts: { ...DEFAULTS.counts } };
  }
}

function writeProgress(p: Progress): void {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(p));
  } catch {
    // best-effort
  }
}

/** Call once per app launch — bumps the daily streak (consecutive calendar
 * days), resets it if a day was skipped, no-ops if already recorded today. */
export function touchDailyStreak(): void {
  const p = readProgress();
  const t = today();
  if (p.lastActiveDate === t) return;

  if (p.lastActiveDate) {
    const prev = new Date(p.lastActiveDate + "T00:00:00Z").getTime();
    const cur = new Date(t + "T00:00:00Z").getTime();
    const dayGap = Math.round((cur - prev) / 86_400_000);
    p.streakDays = dayGap === 1 ? p.streakDays + 1 : 1;
  } else {
    p.streakDays = 1;
  }
  p.lastActiveDate = t;
  writeProgress(p);
}

export function awardXp(amount: number, category: XpCategory): void {
  const p = readProgress();
  p.xp += amount;
  p.counts[category] += 1;
  writeProgress(p);
}

export function addProductiveMs(ms: number): void {
  if (ms <= 0) return;
  const p = readProgress();
  p.productiveWaitingMs += ms;
  writeProgress(p);
}

export function getProgress(): Progress {
  return readProgress();
}

// Every 100 XP = 1 level. Simple, easy to reason about, easy to tune later.
export function levelFor(xp: number): number {
  return 1 + Math.floor(xp / 100);
}

export function xpIntoLevel(xp: number): { current: number; needed: number } {
  const level = levelFor(xp);
  const levelStartXp = (level - 1) * 100;
  return { current: xp - levelStartXp, needed: 100 };
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
