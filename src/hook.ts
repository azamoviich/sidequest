import { writeStatus, isWatcherAlive, type AgentStatus } from "./status.js";
import { openWatcherTerminal } from "./launch-terminal.js";

const VALID: AgentStatus[] = ["working", "waiting", "done"];

/** Invoked by an installed agent hook: `waitplay hook <working|waiting|done> [agentId]` */
export function runHookCommand(args: string[]): void {
  const [statusArg, agent] = args;
  if (!VALID.includes(statusArg as AgentStatus)) {
    console.error(`waitplay hook: expected one of ${VALID.join("|")}, got "${statusArg}"`);
    process.exit(1);
  }

  const status = statusArg as AgentStatus;
  writeStatus(status, agent);

  if (status === "working" && !isWatcherAlive()) {
    const result = openWatcherTerminal();
    if (!result.launched && result.instructions) {
      // Hooks run silently in the background — this can't be seen by the
      // user in real time, but is useful if they inspect hook output/logs.
      console.error(`waitplay: couldn't auto-open a terminal. ${result.instructions}`);
    }
  }
}
