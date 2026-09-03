import { createHash } from "node:crypto";
import { WORDS } from "./words.js";
import type { CryptoPuzzle } from "../crypto-engine.js";

function randomWord(rng: () => number): string {
  return WORDS[Math.floor(rng() * WORDS.length)].toLowerCase();
}

export function generateBase64Puzzle(rng: () => number): CryptoPuzzle {
  const word = randomWord(rng);
  const encoded = Buffer.from(word, "utf8").toString("base64");
  return { prompt: `Decode this Base64:\n\n  ${encoded}`, answers: [word] };
}

function caesarShift(text: string, shift: number): string {
  return text.replace(/[a-z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97));
}

export function generateCaesarPuzzle(rng: () => number): CryptoPuzzle {
  const word = randomWord(rng);
  const shift = 1 + Math.floor(rng() * 25); // 1-25
  const encoded = caesarShift(word, shift).toUpperCase();
  return { prompt: `Caesar cipher, shift ${shift}: decode '${encoded}'\n(each letter was shifted forward by ${shift})`, answers: [word] };
}

export function generateRot13Puzzle(rng: () => number): CryptoPuzzle {
  const word = randomWord(rng);
  const encoded = caesarShift(word, 13).toLowerCase();
  return { prompt: `ROT13 decode: '${encoded}'`, answers: [word] };
}

const HASH_ALGOS = ["md5", "sha1", "sha256"] as const;

export function generateHashIdPuzzle(rng: () => number): CryptoPuzzle {
  const word = randomWord(rng);
  const algo = HASH_ALGOS[Math.floor(rng() * HASH_ALGOS.length)];
  const hash = createHash(algo).update(word).digest("hex");
  return {
    prompt: `Which hash algorithm produced this ${hash.length}-character hex digest?\n\n  ${hash}\n\n(type: md5, sha1, or sha256)`,
    answers: [algo],
  };
}
