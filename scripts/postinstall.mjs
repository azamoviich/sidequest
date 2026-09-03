// Runs after `npm install`. Deliberately does NOT launch the interactive
// setup wizard here — a postinstall hook blocking on stdin is a well-known
// footgun (breaks `npm ci`, CI pipelines, and any non-interactive install).
// Just a one-line nudge pointing at the real command.
if (process.stdout.isTTY) {
  console.log("\nwaitplay installed. Run `waitplay setup` to auto-open a game when Claude Code (or Cursor/Copilot CLI) starts working.\n");
}
