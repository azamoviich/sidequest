import { homedir } from "node:os";
import { join } from "node:path";
import { readJsonConfig, writeJsonConfig, containsCommand } from "./json-config.js";
import type { AgentAdapter, InstallScope } from "./types.js";

// Schema confirmed against Claude Code's official hooks docs
// (code.claude.com/docs/en/hooks-guide): UserPromptSubmit and Stop take no
// matcher; Notification's matcher filters by notification_type ("" = all).
function configPathFor(scope: InstallScope): string {
  return scope === "global" ? join(homedir(), ".claude", "settings.json") : join(process.cwd(), ".claude", "settings.json");
}

function addHook(hooks: Record<string, any>, event: string, command: string, matcher?: string) {
  if (!Array.isArray(hooks[event])) hooks[event] = [];
  if (containsCommand(hooks[event], command)) return; // already installed
  const entry: Record<string, any> = { hooks: [{ type: "command", command }] };
  if (matcher !== undefined) entry.matcher = matcher;
  hooks[event].push(entry);
}

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  name: "Claude Code",
  confidence: "verified",
  install(scope) {
    const path = configPathFor(scope);
    const config = readJsonConfig(path);
    config.hooks = config.hooks ?? {};

    addHook(config.hooks, "UserPromptSubmit", "waitplay hook working claude-code");
    addHook(config.hooks, "Stop", "waitplay hook done claude-code");
    addHook(config.hooks, "Notification", "waitplay hook waiting claude-code", "");

    writeJsonConfig(path, config);
    return { ok: true, message: `Hooks added to ${path}`, configPath: path };
  },
};
