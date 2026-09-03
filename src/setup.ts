import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { agents } from "./agents/index.js";
import type { InstallScope } from "./agents/types.js";

export async function runSetupWizard(): Promise<void> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  console.log("sidequest setup — wire your coding agent(s) so a game auto-opens while they work.\n");

  const selected: typeof agents = [];
  for (const agent of agents) {
    const tag = agent.confidence === "verified" ? "" : "  (best-effort — hook schema not fully confirmed, may need manual fixing)";
    const answer = await rl.question(`Install for ${agent.name}?${tag} [y/N] `);
    if (answer.trim().toLowerCase().startsWith("y")) selected.push(agent);
  }

  if (selected.length === 0) {
    console.log("\nNothing selected. Run `sidequest setup` again anytime.");
    rl.close();
    return;
  }

  const scopeAnswer = await rl.question(
    "\nInstall scope — (g)lobal, applies to every project, or (p)roject, this folder only? [g/p] "
  );
  const scope: InstallScope = scopeAnswer.trim().toLowerCase().startsWith("p") ? "project" : "global";

  console.log("");
  for (const agent of selected) {
    const result = agent.install(scope);
    console.log(`${result.ok ? "✓" : "✗"} ${agent.name}: ${result.message}`);
  }

  console.log(
    "\nDone. Next time you prompt your agent, sidequest should auto-open a terminal with a game." +
      "\nOn macOS this opens Terminal.app automatically; elsewhere you'll get a manual command to run once per session."
  );

  rl.close();
}
