import { spawn } from "node:child_process";

/**
 * Opens a new terminal window running `waitplay watch`. Only macOS (via
 * osascript/Terminal.app) is automated — that's the one OS with a reliable,
 * dependency-free way to script "open a new terminal window running X".
 * Linux terminal emulators vary too much (gnome-terminal, konsole, alacritty,
 * kitty, ...) to guess reliably, and Windows Terminal scripting needs its own
 * separate path — both print instructions instead of silently failing.
 */
export function openWatcherTerminal(): { launched: boolean; instructions?: string } {
  const cliPath = process.argv[1]; // this file's own CLI entry, re-invoked with "watch"

  if (process.platform === "darwin") {
    const script = `tell application "Terminal" to do script "node '${cliPath}' watch"`;
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
