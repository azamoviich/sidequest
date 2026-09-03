import { homedir } from "node:os";
import { join } from "node:path";
import { readJsonConfig, writeJsonConfig, containsCommand } from "./json-config.js";
import type { AgentAdapter, InstallScope } from "./types.js";

// Best-effort: GitHub Copilot CLI documents a notification-hooks.json for
// "waiting for user input" style events, but the full event set (start/done)
// wasn't independently confirmed here. Global-only — Copilot CLI's hooks
// live under the user's home config, not a project-local file.
function configPath(): string {
  return join(homedir(), ".copilot", "hooks", "notification-hooks.json");
}

export const copilotCliAdapter: AgentAdapter = {
  id: "copilot-cli",
  name: "GitHub Copilot CLI",
  confidence: "best-effort",
  install(_scope) {
    const path = configPath();
    const config = readJsonConfig(path);
    config.hooks = config.hooks ?? [];

    const command = "sidequest hook waiting copilot-cli";
    if (!containsCommand(config.hooks, command)) {
      config.hooks.push({ event: "waiting_for_input", command });
    }

    writeJsonConfig(path, config);
    return {
      ok: true,
      message: `Hook written to ${path} (best-effort — Copilot CLI only documents the "waiting for input" event here, not start/done; verify it fires).`,
      configPath: path,
    };
  },
};
