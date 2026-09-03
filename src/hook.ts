import { writeStatus, isWatcherAlive, type AgentStatus } from "./status.js";
import { openWatcherTerminal } from "./launch-terminal.js";
import { captureOriginWindow, focusOriginWindow, focusWatcherWindow } from "./focus.js";
import { loadConfig } from "./config.js";

const VALID: AgentStatus[] = ["working", "waiting", "done"];

/** Invoked by an installed agent hook: `sidequest hook <working|waiting|done> [agentId]` */
export function runHookCommand(args: string[]): void {
  const [statusArg, agent] = args;
  if (!VALID.includes(statusArg as AgentStatus)) {
    console.error(`sidequest hook: expected one of ${VALID.join("|")}, got "${statusArg}"`);
    process.exit(1);
  }

  const status = statusArg as AgentStatus;
  writeStatus(status, agent);

  // status.json is always kept truthful regardless of this setting — a
  // manually-run `sidequest watch` still reflects reality either way. This
  // only gates the automatic window open/focus behavior.
  if (!loadConfig().autoOpen) return;

  if (status === "working") {
    if (isWatcherAlive()) {
      // A watcher's already open (from an earlier prompt) — don't spawn a
      // duplicate window, but DO bring the existing one forward. Otherwise
      // it just silently updates status.json with nothing telling the user
      // to look at it, which is what "the game doesn't open" actually was.
      focusWatcherWindow();
    } else {
      // Remember which terminal window this prompt came from *before*
      // opening the watcher window, so "done"/"waiting" can bring focus
      // back to it automatically instead of just showing a banner.
      captureOriginWindow();
      const result = openWatcherTerminal();
      if (!result.launched && result.instructions) {
        // Hooks run silently in the background — this can't be seen by the
        // user in real time, but is useful if they inspect hook output/logs.
        console.error(`sidequest: couldn't auto-open a terminal. ${result.instructions}`);
      }
    }
  }

  if (status === "done" || status === "waiting") {
    focusOriginWindow();
  }
}
