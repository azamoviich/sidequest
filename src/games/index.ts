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
import { progressGame } from "./progress-screen.js";
import { dailyChallengeGame } from "./daily-challenge.js";
import { LIBRARY_BOOKS } from "./data/gutendex.js";
import { buildCryptoGame } from "./crypto-engine.js";
import { generateBase64Puzzle, generateCaesarPuzzle, generateRot13Puzzle, generateHashIdPuzzle } from "./data/crypto-puzzles.js";
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
  { kind: "game", game: dailyChallengeGame },
  { kind: "game", game: snakeGame },
  { kind: "game", game: wordleGame },
  { kind: "game", game: tictactoeGame },
  { kind: "game", game: game2048 },
  { kind: "game", game: detectiveGame },
  { kind: "group", id: "trivia", title: "Trivia Quiz (live)", color: "yellow", games: triviaGames },
  { kind: "group", id: "coding", title: "Coding Quiz (type the answer)", color: "cyan", games: codingGames },
  { kind: "group", id: "debug", title: "Spot the Bug", color: "red", games: debugGames },
  { kind: "group", id: "crypto", title: "Cryptography Puzzles", color: "green", games: cryptoGames },
  { kind: "group", id: "library", title: "Library (public-domain books)", color: "magenta", games: libraryGames },
  { kind: "game", game: progressGame },
];

// Flat list of every playable game, used for theming/high-score lookups
// regardless of whether it's reached directly or through a group submenu.
export const games: Game<any>[] = [
  dailyChallengeGame,
  snakeGame,
  wordleGame,
  tictactoeGame,
  game2048,
  detectiveGame,
  ...triviaGames,
  ...codingGames,
  ...debugGames,
  ...cryptoGames,
  ...libraryGames,
  progressGame,
];

export function getGame(id: string): Game<any> {
  const g = games.find((g) => g.id === id);
  return g ?? games[0];
}

export type { Game } from "./types.js";
