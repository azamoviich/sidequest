import { snakeGame } from "./snake.js";
import { buildQuizGame } from "./quiz-engine.js";
import { buildTypingQuizGame } from "./typing-quiz-engine.js";
import { historyQuestions } from "./data/history.js";
import { getTriviaQuestions } from "./data/opentdb.js";
import { frontendQuestions, backendQuestions, nodejsQuestions, algorithmQuestions, gitQuestions } from "./data/coding-typed.js";
import { wordleGame } from "./wordle.js";
import { buildReaderGame } from "./reader.js";
import { LIBRARY_BOOKS } from "./data/gutendex.js";
import type { Game } from "./types.js";

export const triviaGames: Game<any>[] = [
  buildQuizGame("trivia-mixed", "Mixed", (ctx) => getTriviaQuestions("mixed", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-movies", "Movies", (ctx) => getTriviaQuestions("movies", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-music", "Music", (ctx) => getTriviaQuestions("music", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-science", "Science", (ctx) => getTriviaQuestions("science", ctx.difficulty), historyQuestions),
  buildQuizGame("trivia-geography", "Geography", (ctx) => getTriviaQuestions("geography", ctx.difficulty), historyQuestions),
];

export const codingGames: Game<any>[] = [
  buildTypingQuizGame("coding-frontend", "Frontend", frontendQuestions),
  buildTypingQuizGame("coding-backend", "Backend", backendQuestions),
  buildTypingQuizGame("coding-nodejs", "Node.js", nodejsQuestions),
  buildTypingQuizGame("coding-algorithms", "Algorithms & Data Structures", algorithmQuestions),
  buildTypingQuizGame("coding-git", "Git", gitQuestions),
];

export const libraryGames: Game<any>[] = LIBRARY_BOOKS.map((book) => buildReaderGame(book));

export interface GameGroup {
  kind: "group";
  id: string;
  title: string;
  color: string;
  games: Game<any>[];
}

export type MenuEntry = { kind: "game"; game: Game<any> } | GameGroup;

export const menuEntries: MenuEntry[] = [
  { kind: "game", game: snakeGame },
  { kind: "game", game: wordleGame },
  { kind: "group", id: "trivia", title: "Trivia Quiz (live)", color: "yellow", games: triviaGames },
  { kind: "group", id: "coding", title: "Coding Quiz (type the answer)", color: "cyan", games: codingGames },
  { kind: "group", id: "library", title: "Library (public-domain books)", color: "magenta", games: libraryGames },
];

// Flat list of every playable game, used for theming/high-score lookups
// regardless of whether it's reached directly or through a group submenu.
export const games: Game<any>[] = [snakeGame, wordleGame, ...triviaGames, ...codingGames, ...libraryGames];

export function getGame(id: string): Game<any> {
  const g = games.find((g) => g.id === id);
  return g ?? games[0];
}

export type { Game } from "./types.js";
