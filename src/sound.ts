import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/sound.js -> ../assets/sfx (package root/assets/sfx)
const SFX_DIR = join(__dirname, "..", "assets", "sfx");

export type SfxName = "eat" | "gameover" | "correct" | "wrong" | "done" | "click";

let enabled = true;
export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

function playerCommand(file: string): { cmd: string; args: string[] } | null {
  switch (process.platform) {
    case "darwin":
      return { cmd: "afplay", args: [file] };
    case "linux":
      return { cmd: "paplay", args: [file] };
    case "win32":
      return {
        cmd: "powershell",
        args: ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer '${file}').PlaySync();`],
      };
    default:
      return null;
  }
}

export function playSfx(name: SfxName): void {
  if (!enabled) return;
  const file = join(SFX_DIR, `${name}.wav`);
  if (!existsSync(file)) return;

  const player = playerCommand(file);
  if (!player) return;

  try {
    const child = spawn(player.cmd, player.args, { stdio: "ignore", detached: true });
    child.on("error", () => {
      // no player binary available (e.g. paplay missing on this Linux distro) — silently skip
    });
    child.unref();
  } catch {
    // never let sound playback crash the game
  }
}
