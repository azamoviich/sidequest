import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DIR = join(homedir(), ".sidequest");
const FILE = join(DIR, "highscore.json");

type Store = Record<string, number>;

function readStore(): Store {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function getHighScore(game: string): number {
  return readStore()[game] ?? 0;
}

export function maybeSaveHighScore(game: string, score: number): { isNewHighScore: boolean; highScore: number } {
  const store = readStore();
  const current = store[game] ?? 0;
  if (score > current) {
    store[game] = score;
    try {
      mkdirSync(DIR, { recursive: true });
      writeFileSync(FILE, JSON.stringify(store, null, 2));
    } catch {
      // non-fatal: highscore persistence is best-effort
    }
    return { isNewHighScore: true, highScore: score };
  }
  return { isNewHighScore: false, highScore: current };
}
