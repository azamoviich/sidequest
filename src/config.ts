import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Difficulty = "easy" | "medium" | "hard";

export interface Config {
  sound: boolean;
  difficulty: Difficulty;
  lastGame: string;
}

const DIR = join(homedir(), ".sidequest");
const FILE = join(DIR, "config.json");

const DEFAULTS: Config = {
  sound: true,
  difficulty: "medium",
  lastGame: "snake",
};

export function loadConfig(): Config {
  try {
    if (!existsSync(FILE)) return { ...DEFAULTS };
    const parsed = JSON.parse(readFileSync(FILE, "utf8"));
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config: Config): void {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(config, null, 2));
  } catch {
    // best-effort; a missing config just falls back to defaults next run
  }
}
