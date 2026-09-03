import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ORIGIN_FILE = join(homedir(), ".sidequest", "origin-window.json");
const WATCHER_FILE = join(homedir(), ".sidequest", "watcher-window.json");

type SupportedTerminal = "Apple_Terminal" | "iTerm.app";

// TERM_PROGRAM isn't reliably present in a hook subprocess's environment
// (confirmed empty in testing) — an unrecognized/missing value defaults to
// Terminal.app rather than silently doing nothing, same reasoning as
// launch-terminal.ts.
function detectTerminal(): SupportedTerminal {
  return process.env.TERM_PROGRAM === "iTerm.app" ? "iTerm.app" : "Apple_Terminal";
}

function captureFrontWindow(file: string): void {
  if (process.platform !== "darwin") return;
  const terminal = detectTerminal();

  try {
    if (terminal === "iTerm.app") {
      const id = execFileSync("osascript", ["-e", 'tell application "iTerm" to id of current window'], {
        encoding: "utf8",
      }).trim();
      if (!id) return;
      mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
      writeFileSync(file, JSON.stringify({ terminal, windowId: id }));
      return;
    }

    const id = execFileSync("osascript", ["-e", 'tell application "Terminal" to id of front window'], {
      encoding: "utf8",
    }).trim();
    if (!id) return;
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(file, JSON.stringify({ terminal, windowId: id }));
  } catch {
    // frontmost app wasn't actually this terminal, or something else went
    // wrong — fine, the corresponding focus*() just won't have anything to bring forward
  }
}

function focusWindow(file: string): void {
  if (process.platform !== "darwin") return;
  try {
    if (!existsSync(file)) return;
    const { terminal, windowId } = JSON.parse(readFileSync(file, "utf8"));
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
    // the window may have been closed since — nothing to focus
  }
}

/**
 * Records which terminal window was frontmost right before we open the
 * watcher window — that's assumed to be the one running the coding agent,
 * since the user just typed a prompt into it. macOS + Terminal.app/iTerm2 only.
 */
export function captureOriginWindow(): void {
  captureFrontWindow(ORIGIN_FILE);
}

export function focusOriginWindow(): void {
  focusWindow(ORIGIN_FILE);
}

/** Called by `sidequest watch` itself at startup, so later hook events can bring THIS window forward. */
export function captureWatcherWindow(): void {
  captureFrontWindow(WATCHER_FILE);
}

/**
 * Brings the watcher window forward. Needed on every "working" event, not
 * just the first one — without this, a game window that's already open (and
 * therefore skipped re-launching to avoid duplicates) never visibly reacts
 * to a *new* prompt; it just silently updates status.json in the background
 * with nothing telling the user to look at it.
 */
export function focusWatcherWindow(): void {
  focusWindow(WATCHER_FILE);
}
