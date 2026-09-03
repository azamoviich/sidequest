import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type AgentStatus = "working" | "waiting" | "done";

export interface StatusRecord {
  status: AgentStatus;
  updatedAt: number;
  agent?: string;
}

const DIR = join(homedir(), ".sidequest");
const FILE = join(DIR, "status.json");
const WATCH_PID_FILE = join(DIR, "watch.pid");

export function writeStatus(status: AgentStatus, agent?: string): void {
  mkdirSync(DIR, { recursive: true });
  const record: StatusRecord = { status, updatedAt: Date.now(), agent };
  writeFileSync(FILE, JSON.stringify(record));
}

export function readStatus(): StatusRecord | null {
  try {
    if (!existsSync(FILE)) return null;
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return null;
  }
}

/** True if a `sidequest watch` process registered itself recently (heartbeat within the last 10s). */
export function isWatcherAlive(): boolean {
  try {
    if (!existsSync(WATCH_PID_FILE)) return false;
    const ts = Number(readFileSync(WATCH_PID_FILE, "utf8"));
    return Date.now() - ts < 10_000;
  } catch {
    return false;
  }
}

export function heartbeatWatcher(): void {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(WATCH_PID_FILE, String(Date.now()));
}
