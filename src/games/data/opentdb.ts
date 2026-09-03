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

/** Open Trivia DB (opentdb.com) — free, no API key, well-documented public trivia API. */
export async function fetchTriviaQuestions(amount = 50): Promise<QuizQuestion[]> {
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
