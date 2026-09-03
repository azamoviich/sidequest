import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { QuizQuestion } from "../quiz-engine.js";

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

const CACHE_FILE = join(homedir(), ".sidequest", "trivia-cache.json");
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — long enough to make repeat launches instant, short enough to stay fresh

async function fetchFresh(amount: number): Promise<QuizQuestion[]> {
  const url = `https://opentdb.com/api.php?amount=${amount}&encode=url3986`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

function readCache(): QuizQuestion[] | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const { questions, fetchedAt } = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    return questions?.length ? questions : null;
  } catch {
    return null;
  }
}

function writeCache(questions: QuizQuestion[]): void {
  try {
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify({ questions, fetchedAt: Date.now() }));
  } catch {
    // caching is a nice-to-have; never let it block gameplay
  }
}

// Module-level singleton: whichever caller asks first (the eager prefetch
// kicked off at UI startup, or the game itself when you actually select it)
// shares the same in-flight fetch, so by the time you navigate to Trivia
// it's usually already resolved instead of starting cold from a standstill.
let inFlight: Promise<QuizQuestion[]> | null = null;

/** Open Trivia DB (opentdb.com) — free, no API key, well-documented public trivia API. */
export function getTriviaQuestions(amount = 25): Promise<QuizQuestion[]> {
  const cached = readCache();
  if (cached) return Promise.resolve(cached);

  if (!inFlight) {
    inFlight = fetchFresh(amount)
      .then((qs) => {
        writeCache(qs);
        return qs;
      })
      .catch((err) => {
        inFlight = null; // allow a retry on the next call instead of caching a failure forever
        throw err;
      });
  }
  return inFlight;
}
