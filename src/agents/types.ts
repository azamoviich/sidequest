export type InstallScope = "global" | "project";

export interface InstallResult {
  ok: boolean;
  message: string;
  configPath: string;
}

export interface AgentAdapter {
  id: string;
  name: string;
  /** Short note on how solid this integration is — shown in the setup wizard. */
  confidence: "verified" | "best-effort" | "unsupported";
  install(scope: InstallScope): InstallResult;
}
