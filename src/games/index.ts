import { snakeGame } from "./snake.js";
import { buildQuizGame } from "./quiz-engine.js";
import { flagQuestions } from "./data/flags.js";
import { historyQuestions } from "./data/history.js";
import { wordleGame } from "./wordle.js";
import type { Game } from "./types.js";

export const games: Game<any>[] = [
  snakeGame,
  wordleGame,
  buildQuizGame("geography", "Geography Quiz (flags & capitals)", flagQuestions),
  buildQuizGame("history", "History Quiz", historyQuestions),
];

export function getGame(id: string): Game<any> {
  const g = games.find((g) => g.id === id);
  return g ?? games[0];
}

export type { Game } from "./types.js";
