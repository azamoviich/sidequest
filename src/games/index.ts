import { snakeGame } from "./snake.js";
import { buildQuizGame } from "./quiz-engine.js";
import { historyQuestions } from "./data/history.js";
import { getTriviaQuestions } from "./data/opentdb.js";
import { wordleGame } from "./wordle.js";
import type { Game } from "./types.js";

export const games: Game<any>[] = [
  snakeGame,
  wordleGame,
  buildQuizGame("trivia-mixed", "Trivia — Mixed", (ctx) => getTriviaQuestions("mixed", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-movies", "Trivia — Movies", (ctx) => getTriviaQuestions("movies", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-music", "Trivia — Music", (ctx) => getTriviaQuestions("music", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-science", "Trivia — Science", (ctx) => getTriviaQuestions("science", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-geography", "Trivia — Geography", (ctx) => getTriviaQuestions("geography", ctx.difficulty), historyQuestions),
];

export function getGame(id: string): Game<any> {
  const g = games.find((g) => g.id === id);
  return g ?? games[0];
}

export type { Game } from "./types.js";
