import { spawn } from "node:child_process";

type SupportedTerminal = "Apple_Terminal" | "iTerm.app";

/**
 * TERM_PROGRAM is the standard env var terminal emulators set to identify
 * themselves — but it isn't reliably present in a hook subprocess's
 * environment (confirmed empty in testing), so an unrecognized/missing value
 * defaults to Terminal.app rather than silently doing nothing. That's the
 * right default on macOS: Terminal.app is the one every Mac has, and a wrong
 * guess here just opens the wrong terminal app instead of failing silently.
 */
function detectTerminal(): SupportedTerminal {
  return process.env.TERM_PROGRAM === "iTerm.app" ? "iTerm.app" : "Apple_Terminal";
}

function openCommandFor(terminal: SupportedTerminal, command: string): string {
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

/** Same "Postpone / Open Now, 5s auto-confirm" pattern used for the finish
 * notification (see focus.ts) — applied here too, so a game window doesn't
 * just yank itself open the instant you start prompting, with no way to say
 * "not right now". */
function withConfirmPrompt(message: string, actionScript: string): string {
  const escaped = message.replace(/"/g, '\\"');
  return `
    set dlgResult to display dialog "${escaped}" with title "sidequest" buttons {"Postpone", "Open Now"} default button "Open Now" giving up after 5
    if (gave up of dlgResult) or (button returned of dlgResult is "Open Now") then
      ${actionScript}
    end if
  `;
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

  if (process.platform === "darwin") {
    const openCommand = openCommandFor(terminal, `node '${cliPath}' watch`);
    const script = withConfirmPrompt("Open sidequest? — opening in 5s", openCommand);
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
