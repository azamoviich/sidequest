import { claudeCodeAdapter } from "./claude-code.js";
import { cursorAdapter } from "./cursor.js";
import { copilotCliAdapter } from "./copilot-cli.js";
import type { AgentAdapter } from "./types.js";

export const agents: AgentAdapter[] = [claudeCodeAdapter, cursorAdapter, copilotCliAdapter];

export type { AgentAdapter, InstallScope, InstallResult } from "./types.js";
