import { spawn } from "node:child_process";

export interface CommandResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  outputTail: string;
}

const TAIL_LIMIT = 4000; // chars

export function runCommand(command: string, args: string[]): {
  promise: Promise<CommandResult>;
  kill: () => void;
} {
  const start = Date.now();
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

  let tail = "";
  const append = (chunk: Buffer) => {
    tail += chunk.toString();
    if (tail.length > TAIL_LIMIT) tail = tail.slice(tail.length - TAIL_LIMIT);
  };
  child.stdout?.on("data", append);
  child.stderr?.on("data", append);

  const promise = new Promise<CommandResult>((resolve) => {
    child.on("close", (code, signal) => {
      resolve({ code, signal, durationMs: Date.now() - start, outputTail: tail });
    });
    child.on("error", (err) => {
      tail += `\n[waitplay] failed to launch command: ${err.message}`;
      resolve({ code: null, signal: null, durationMs: Date.now() - start, outputTail: tail });
    });
  });

  return { promise, kill: () => child.kill("SIGTERM") };
}
