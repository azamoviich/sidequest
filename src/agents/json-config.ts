import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export function readJsonConfig(path: string): Record<string, any> {
  try {
    if (!existsSync(path)) return {};
    const raw = readFileSync(path, "utf8").trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {}; // an unparseable existing file is left alone; we won't overwrite garbage blindly
  }
}

export function writeJsonConfig(path: string, data: Record<string, any>): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

/** Does `commandSubstring` already appear inside any command string under this JSON tree? Used to avoid double-installing on repeated setup runs. */
export function containsCommand(obj: unknown, commandSubstring: string): boolean {
  if (typeof obj === "string") return obj.includes(commandSubstring);
  if (Array.isArray(obj)) return obj.some((v) => containsCommand(v, commandSubstring));
  if (obj && typeof obj === "object") return Object.values(obj).some((v) => containsCommand(v, commandSubstring));
  return false;
}
