import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { QuizQuestion } from "../quiz-engine.js";
import type { Difficulty } from "../../config.js";

interface OpenTDBQuestion {
  type: "multiple" | "boolean";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

// Real Open Trivia DB category IDs (opentdb.com/api_config.php).
export const TRIVIA_CATEGORIES = {
  mixed: null,
  movies: 11,
  music: 12,
  science: 17,
  geography: 22,
} as const;

export type TriviaCategoryKey = keyof typeof TRIVIA_CATEGORIES;

const CACHE_DIR = join(homedir(), ".sidequest", "trivia-cache");
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

function cacheFile(category: TriviaCategoryKey, difficulty: Difficulty): string {
  return join(CACHE_DIR, `${category}-${difficulty}.json`);
}

async function fetchFresh(amount: number, categoryId: number | null, difficulty: Difficulty): Promise<QuizQuestion[]> {
  const params = new URLSearchParams({ amount: String(amount), encode: "url3986", difficulty });
  if (categoryId !== null) params.set("category", String(categoryId));

  const res = await fetch(`https://opentdb.com/api.php?${params}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`opentdb: HTTP ${res.status}`);

  const data = (await res.json()) as OpenTDBResponse;
  if (data.response_code !== 0 || !data.results?.length) {
    throw new Error(`opentdb: response_code ${data.response_code}`);
  }

  return data.results.map((q) => {
    const decode = (s: string) => decodeURIComponent(s);
    const choices = [...q.incorrect_answers.map(decode), decode(q.correct_answer)];
    return {
      prompt: decode(q.question),
      choices,
      correctIndex: choices.length - 1,
    };
  });
}

function readCache(file: string): QuizQuestion[] | null {
  try {
    if (!existsSync(file)) return null;
    const { questions, fetchedAt } = JSON.parse(readFileSync(file, "utf8"));
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    return questions?.length ? questions : null;
  } catch {
    return null;
  }
}

function writeCache(file: string, questions: QuizQuestion[]): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(file, JSON.stringify({ questions, fetchedAt: Date.now() }));
  } catch {
    // caching is a nice-to-have; never let it block gameplay
  }
}

// Keyed by "category:difficulty" — each combination gets its own in-flight
// dedup so prefetching movies doesn't block/collide with fetching science.
const inFlight = new Map<string, Promise<QuizQuestion[]>>();

/** Open Trivia DB (opentdb.com) — free, no API key, well-documented public trivia API. */
export function getTriviaQuestions(category: TriviaCategoryKey, difficulty: Difficulty, amount = 25): Promise<QuizQuestion[]> {
  const key = `${category}:${difficulty}`;
  const file = cacheFile(category, difficulty);

  const cached = readCache(file);
  if (cached) return Promise.resolve(cached);

  let promise = inFlight.get(key);
  if (!promise) {
    promise = fetchFresh(amount, TRIVIA_CATEGORIES[category], difficulty)
      .then((qs) => {
        writeCache(file, qs);
        return qs;
      })
      .catch((err) => {
        inFlight.delete(key); // allow a retry on the next call instead of caching a failure forever
        throw err;
      });
    inFlight.set(key, promise);
  }
  return promise;
}
