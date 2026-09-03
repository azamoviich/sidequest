// Runs after `npm install`. Deliberately does NOT launch the interactive
// setup wizard here — a postinstall hook blocking on stdin is a well-known
// footgun (breaks `npm ci`, CI pipelines, and any non-interactive install).
// Just a one-line nudge pointing at the real command.
if (process.stdout.isTTY) {
  console.log("\nsidequest installed. Run `sidequest setup` to auto-open a game when Claude Code (or Cursor/Copilot CLI) starts working.\n");
}
