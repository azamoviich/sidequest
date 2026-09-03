import { snakeGame } from "./snake.js";
import { buildQuizGame } from "./quiz-engine.js";
import { buildTypingQuizGame } from "./typing-quiz-engine.js";
import { historyQuestions } from "./data/history.js";
import { getTriviaQuestions } from "./data/opentdb.js";
import { frontendQuestions, backendQuestions, nodejsQuestions, algorithmQuestions, gitQuestions } from "./data/coding-typed.js";
import {
  jsDebugQuestions,
  pythonDebugQuestions,
  sqlDebugQuestions,
  gitDebugQuestions,
  algorithmsDebugQuestions,
  linuxDebugQuestions,
  regexDebugQuestions,
  httpDebugQuestions,
  dockerDebugQuestions,
} from "./data/debugging.js";
import { wordleGame } from "./wordle.js";
import { tictactoeGame } from "./tictactoe.js";
import { game2048 } from "./game2048.js";
import { detectiveGame } from "./detective.js";
import { buildReaderGame } from "./reader.js";
import { buildLessonGame } from "./lesson.js";
import { LESSONS } from "./data/lessons.js";
import { progressGame } from "./progress-screen.js";
import { dailyChallengeGame } from "./daily-challenge.js";
import { LIBRARY_BOOKS } from "./data/gutendex.js";
import { buildCryptoGame } from "./crypto-engine.js";
import { generateBase64Puzzle, generateCaesarPuzzle, generateRot13Puzzle, generateHashIdPuzzle } from "./data/crypto-puzzles.js";
import type { Game } from "./types.js";

export interface GameGroup {
  kind: "group";
  id: string;
  title: string;
  color: string;
  // entries can themselves be groups — one extra level of nesting (used for
  // "Quizzes" containing Trivia + Coding as sub-groups) without generalizing
  // to arbitrary-depth recursion, which nothing else needs.
  games: MenuEntry[];
}

export type MenuEntry = { kind: "game"; game: Game<any> } | GameGroup;

function asEntries(games: Game<any>[]): MenuEntry[] {
  return games.map((game) => ({ kind: "game", game }));
}

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

export const debugGames: Game<any>[] = [
  buildTypingQuizGame("debug-javascript", "JavaScript", jsDebugQuestions),
  buildTypingQuizGame("debug-python", "Python", pythonDebugQuestions),
  buildTypingQuizGame("debug-sql", "SQL", sqlDebugQuestions),
  buildTypingQuizGame("debug-git", "Git", gitDebugQuestions),
  buildTypingQuizGame("debug-algorithms", "Algorithms", algorithmsDebugQuestions),
  buildTypingQuizGame("debug-linux", "Linux", linuxDebugQuestions),
  buildTypingQuizGame("debug-regex", "Regex", regexDebugQuestions),
  buildTypingQuizGame("debug-http", "HTTP", httpDebugQuestions),
  buildTypingQuizGame("debug-docker", "Docker", dockerDebugQuestions),
];

export const cryptoGames: Game<any>[] = [
  buildCryptoGame("crypto-base64", "Base64 Decode", generateBase64Puzzle),
  buildCryptoGame("crypto-caesar", "Caesar Cipher", generateCaesarPuzzle),
  buildCryptoGame("crypto-rot13", "ROT13", generateRot13Puzzle),
  buildCryptoGame("crypto-hashid", "Hash ID", generateHashIdPuzzle),
];

export const arcadeGames: Game<any>[] = [snakeGame, wordleGame, tictactoeGame, game2048, detectiveGame];

export const lessonGames: Game<any>[] = LESSONS.map((lesson) => buildLessonGame(lesson));

export const libraryGames: Game<any>[] = LIBRARY_BOOKS.map((book) => buildReaderGame(book));

const triviaGroup: GameGroup = { kind: "group", id: "trivia", title: "Trivia (live)", color: "yellow", games: asEntries(triviaGames) };
const codingGroup: GameGroup = { kind: "group", id: "coding", title: "Coding Quiz", color: "cyan", games: asEntries(codingGames) };

export const menuEntries: MenuEntry[] = [
  { kind: "game", game: dailyChallengeGame },
  { kind: "group", id: "games", title: "Games", color: "green", games: asEntries(arcadeGames) },
  { kind: "group", id: "quizzes", title: "Quizzes", color: "yellow", games: [triviaGroup, codingGroup] },
  { kind: "group", id: "debug", title: "Spot the Bug", color: "red", games: asEntries(debugGames) },
  { kind: "group", id: "crypto", title: "Cryptography Puzzles", color: "green", games: asEntries(cryptoGames) },
  { kind: "group", id: "library", title: "Library (public-domain books)", color: "magenta", games: asEntries(libraryGames) },
  { kind: "group", id: "learn", title: "Learn Something in 5 Minutes", color: "blue", games: asEntries(lessonGames) },
  { kind: "game", game: progressGame },
];

// Flat list of every playable game, used for theming/high-score lookups
// regardless of whether it's reached directly or through a group submenu.
export const games: Game<any>[] = [
  dailyChallengeGame,
  ...arcadeGames,
  ...triviaGames,
  ...codingGames,
  ...debugGames,
  ...cryptoGames,
  ...libraryGames,
  ...lessonGames,
  progressGame,
];

export function getGame(id: string): Game<any> {
  const g = games.find((g) => g.id === id);
  return g ?? games[0];
}

export type { Game } from "./types.js";
