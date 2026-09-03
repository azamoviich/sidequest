import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FILE = join(homedir(), ".waitplay", "origin-window.json");

/**
 * Records which Terminal.app window was frontmost right before we open the
 * watcher window — that's assumed to be the one running Claude Code, since
 * the user just typed a prompt into it. macOS/Terminal.app only; a no-op
 * (and focusOriginWindow() a no-op) everywhere else.
 */
export function captureOriginWindow(): void {
  if (process.platform !== "darwin") return;
  try {
    const id = execFileSync("osascript", ["-e", 'tell application "Terminal" to id of front window'], {
      encoding: "utf8",
    }).trim();
    if (!id) return;
    mkdirSync(join(homedir(), ".waitplay"), { recursive: true });
    writeFileSync(FILE, JSON.stringify({ windowId: id }));
  } catch {
    // Terminal.app not frontmost, or another terminal emulator entirely —
    // fine, focusOriginWindow() just won't have anything to bring forward.
  }
}

export function focusOriginWindow(): void {
  if (process.platform !== "darwin") return;
  try {
    if (!existsSync(FILE)) return;
    const { windowId } = JSON.parse(readFileSync(FILE, "utf8"));
    if (!windowId) return;
    const script = `
      tell application "Terminal"
        activate
        set index of window id ${windowId} to 1
      end tell
    `;
    spawn("osascript", ["-e", script], { stdio: "ignore", detached: true }).unref();
  } catch {
    // the origin window may have been closed since — nothing to focus
  }
}
