import { homedir } from "node:os";
import { join } from "node:path";
import { readJsonConfig, writeJsonConfig, containsCommand } from "./json-config.js";
import type { AgentAdapter, InstallScope } from "./types.js";

// Best-effort: Cursor added a hooks.json system in v1.7 (events like
// sessionStart/sessionEnd/beforeSubmitPrompt/preToolUse/postToolUse, JSON
// over stdin) but I haven't verified this against a live Cursor install —
// unlike the Claude Code adapter, this schema is not independently confirmed
// to actually fire. Treat this as a starting point to test, not a guarantee.
function configPathFor(scope: InstallScope): string {
  return scope === "global" ? join(homedir(), ".cursor", "hooks.json") : join(process.cwd(), ".cursor", "hooks.json");
}

function addHook(hooks: Record<string, any>, event: string, command: string) {
  if (!Array.isArray(hooks[event])) hooks[event] = [];
  if (containsCommand(hooks[event], command)) return;
  hooks[event].push({ command });
}

export const cursorAdapter: AgentAdapter = {
  id: "cursor",
  name: "Cursor",
  confidence: "best-effort",
  install(scope) {
    const path = configPathFor(scope);
    const config = readJsonConfig(path);
    config.hooks = config.hooks ?? {};

    addHook(config.hooks, "beforeSubmitPrompt", "sidequest hook working cursor");
    addHook(config.hooks, "sessionEnd", "sidequest hook done cursor");
    // No confirmed Cursor event maps cleanly to "waiting for permission" —
    // skipped rather than guessed.

    writeJsonConfig(path, config);
    return {
      ok: true,
      message: `Hooks written to ${path} (best-effort — please verify these actually fire; Cursor's hook schema wasn't independently confirmed).`,
      configPath: path,
    };
  },
};
