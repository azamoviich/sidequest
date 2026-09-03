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
  /** true if this game needs full a-z/punctuation text input — disables the
   * global q/m quit-to-menu shortcuts while playing (they'd otherwise eat
   * every "q" or "m" you type as an answer), same as Wordle needs. */
  capturesTextInput?: boolean;
  /** true if letting the tick loop keep running while the agent needs you
   * would actually cause harm (e.g. Snake moving/dying unattended). Quiz-type
   * games are safe to keep ticking regardless — pausing them would freeze a
   * pending feedback-reveal (like a wrong-answer flash) until the agent's
   * status changes again, which reads as "stuck", not "paused". Defaults to
   * false: most games should NOT be paused. */
  pauseWhileAgentBusy?: boolean;

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
