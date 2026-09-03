import { spawn } from "node:child_process";

type SupportedTerminal = "Apple_Terminal" | "iTerm.app";

/** TERM_PROGRAM is the standard env var terminal emulators set to identify themselves. */
function detectTerminal(): SupportedTerminal | null {
  const t = process.env.TERM_PROGRAM;
  if (t === "Apple_Terminal" || t === "iTerm.app") return t;
  return null;
}

function scriptFor(terminal: SupportedTerminal, command: string): string {
  if (terminal === "iTerm.app") {
    return `
      tell application "iTerm"
        create window with default profile
        tell current session of current window
          write text "${command}"
        end tell
      end tell
    `;
  }
  return `tell application "Terminal" to do script "${command}"`;
}

/**
 * Opens a new terminal window running `sidequest watch`. Only macOS is
 * automated, and only for the two terminal emulators with a reliable,
 * dependency-free scripting story (Terminal.app and iTerm2, detected via
 * TERM_PROGRAM — the standard env var terminal emulators set to identify
 * themselves). Everything else (Linux terminal emulators vary too much to
 * guess reliably; Windows Terminal needs its own separate path; other macOS
 * terminals like WezTerm/Alacritty/Hyper aren't scripted here) gets
 * instructions instead of silently failing.
 */
export function openWatcherTerminal(): { launched: boolean; instructions?: string } {
  const cliPath = process.argv[1]; // this file's own CLI entry, re-invoked with "watch"
  const terminal = detectTerminal();

  if (process.platform === "darwin" && terminal) {
    const script = scriptFor(terminal, `node '${cliPath}' watch`);
    try {
      spawn("osascript", ["-e", script], { stdio: "ignore", detached: true }).unref();
      return { launched: true };
    } catch {
      // fall through to instructions
    }
  }

  return {
    launched: false,
    instructions: `Open a new terminal and run: node '${cliPath}' watch`,
  };
}
