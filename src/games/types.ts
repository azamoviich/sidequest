import type { Difficulty } from "../config.js";

export interface GameContext {
  difficulty: Difficulty;
  rng: () => number;
}

/** A game owns its own state object (opaque to the runner) and renders blessed-tag content. */
export interface Game<TState = unknown> {
  id: string;
  title: string;
  /** ms between automatic ticks, or null if the game is purely input-driven (e.g. quizzes) */
  tickIntervalMs: number | null;

  init(ctx: GameContext): TState;
  tick?(state: TState, ctx: GameContext): void;
  handleKey(state: TState, key: string, ctx: GameContext): void;
  /** returns blessed-tag markup for the main game box */
  render(state: TState): string;
  /** returns blessed-tag markup lines for the sidebar (score, hints, etc) */
  sidebar(state: TState): string[];
  isOver(state: TState): boolean;
  score(state: TState): number;
  /** true right after a scoring event this tick, used to trigger sfx */
  consumeSfxEvent?(state: TState): "eat" | "correct" | "wrong" | "gameover" | null;
}
