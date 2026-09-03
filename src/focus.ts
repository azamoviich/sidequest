import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FILE = join(homedir(), ".sidequest", "origin-window.json");

type SupportedTerminal = "Apple_Terminal" | "iTerm.app";

function detectTerminal(): SupportedTerminal | null {
  const t = process.env.TERM_PROGRAM;
  if (t === "Apple_Terminal" || t === "iTerm.app") return t;
  return null;
}

/**
 * Records which terminal window was frontmost right before we open the
 * watcher window — that's assumed to be the one running the coding agent,
 * since the user just typed a prompt into it. macOS + Terminal.app/iTerm2
 * only (detected via TERM_PROGRAM); a no-op everywhere else.
 */
export function captureOriginWindow(): void {
  if (process.platform !== "darwin") return;
  const terminal = detectTerminal();
  if (!terminal) return;

  try {
    if (terminal === "iTerm.app") {
      const id = execFileSync("osascript", ["-e", 'tell application "iTerm" to id of current window'], {
        encoding: "utf8",
      }).trim();
      if (!id) return;
      mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
      writeFileSync(FILE, JSON.stringify({ terminal, windowId: id }));
      return;
    }

    const id = execFileSync("osascript", ["-e", 'tell application "Terminal" to id of front window'], {
      encoding: "utf8",
    }).trim();
    if (!id) return;
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(FILE, JSON.stringify({ terminal, windowId: id }));
  } catch {
    // frontmost app wasn't actually this terminal, or something else went
    // wrong — fine, focusOriginWindow() just won't have anything to bring forward
  }
}

export function focusOriginWindow(): void {
  if (process.platform !== "darwin") return;
  try {
    if (!existsSync(FILE)) return;
    const { terminal, windowId } = JSON.parse(readFileSync(FILE, "utf8"));
    if (!windowId) return;

    const script =
      terminal === "iTerm.app"
        ? `
          tell application "iTerm"
            activate
            repeat with w in windows
              if id of w is ${windowId} then
                select w
              end if
            end repeat
          end tell
        `
        : `
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
