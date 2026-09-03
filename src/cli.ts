#!/usr/bin/env node
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runCommand } from "./runner.js";
import { runGameUI } from "./ui.js";
import { runHookCommand } from "./hook.js";
import { runSetupWizard } from "./setup.js";
import type { CommandResult } from "./runner.js";

// If something throws inside a blessed render/keypress callback while the
// alternate screen buffer is active, the terminal is left showing a static
// frame with no visible error and no way to interact — indistinguishable
// from a genuine freeze. Log the real error instead of dying silently.
function logCrash(label: string, err: unknown): void {
  try {
    const dir = join(homedir(), ".waitplay");
    mkdirSync(dir, { recursive: true });
    const stack = err instanceof Error ? err.stack ?? err.message : String(err);
    appendFileSync(join(dir, "crash.log"), `[${new Date().toISOString()}] ${label}\n${stack}\n\n`);
  } catch {
    // logging the crash must never itself throw
  }
}

process.on("uncaughtException", (err) => {
  logCrash("uncaughtException", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  logCrash("unhandledRejection", err);
  process.exit(1);
});

function printHelp(): void {
  console.log(`waitplay — play a terminal game while any slow command runs

Usage:
  waitplay -- <command> [args...]     wrap a one-shot command (npm install, docker build, ...)
  waitplay watch                      persistent session that shows live agent status (working/waiting/done)
  waitplay setup                      wire waitplay into Claude Code / Cursor / Copilot CLI hooks
  waitplay hook <working|waiting|done> [agentId]   called by an installed hook — not for manual use

Examples:
  waitplay -- claude -p "refactor the auth module" --dangerously-skip-permissions
  waitplay -- npm install
  waitplay setup

Options:
  -h, --help    show this help
`);
}

function runWrapMode(cmdArgs: string[]): void {
  const [command, ...rest] = cmdArgs;
  const label = cmdArgs.join(" ");
  const { promise, kill } = runCommand(command, rest);

  runGameUI({
    kind: "wrap",
    commandLabel: label,
    resultPromise: promise,
    killCommand: kill,
    onExit: (result: CommandResult | null) => {
      if (result) {
        process.stdout.write("\n--- waitplay: command finished ---\n");
        process.stdout.write(`exit code: ${result.code ?? "n/a"}${result.signal ? ` (signal ${result.signal})` : ""}\n`);
        process.stdout.write(`duration:  ${(result.durationMs / 1000).toFixed(1)}s\n`);
        if (result.outputTail.trim()) {
          process.stdout.write("\n--- last output ---\n");
          process.stdout.write(result.outputTail.trimEnd() + "\n");
        }
        process.exit(result.code ?? 0);
      } else {
        process.exit(0);
      }
    },
  });
}

function runWatchMode(): void {
  runGameUI({
    kind: "watch",
    onExit: () => process.exit(0),
  });
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    printHelp();
    process.exit(0);
  }

  if (argv[0] === "watch") {
    runWatchMode();
    return;
  }

  if (argv[0] === "setup") {
    await runSetupWizard();
    return;
  }

  if (argv[0] === "hook") {
    runHookCommand(argv.slice(1));
    return;
  }

  const sepIndex = argv.indexOf("--");
  const cmdArgs = sepIndex >= 0 ? argv.slice(sepIndex + 1) : argv;

  if (cmdArgs.length === 0) {
    console.error("waitplay: no command given. Usage: waitplay -- <command> [args...]");
    process.exit(1);
  }

  runWrapMode(cmdArgs);
}

main();
