import { awardXp } from "../progress.js";
import type { Game, GameContext } from "./types.js";

type Cell = "X" | "O" | null;
type Winner = "X" | "O" | "draw" | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

function checkWinner(board: Cell[]): Winner {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a] as "X" | "O";
  }
  return board.every((c) => c !== null) ? "draw" : null;
}

/** Minimax with depth-preference (win sooner, lose later) — unbeatable on a 3x3 board, small enough to search exhaustively every move. */
function minimax(board: Cell[], player: "X" | "O", depth: number): { score: number; move: number | null } {
  const winner = checkWinner(board);
  if (winner === "O") return { score: 10 - depth, move: null };
  if (winner === "X") return { score: depth - 10, move: null };
  if (winner === "draw") return { score: 0, move: null };

  const moves = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
  let best = { score: player === "O" ? -Infinity : Infinity, move: moves[0] };

  for (const move of moves) {
    board[move] = player;
    const result = minimax(board, player === "O" ? "X" : "O", depth + 1);
    board[move] = null;
    if (player === "O" ? result.score > best.score : result.score < best.score) {
      best = { score: result.score, move };
    }
  }
  return best;
}

export interface TicTacToeState {
  board: Cell[];
  winner: Winner;
  wins: number;
  losses: number;
  draws: number;
  sfxEvent: "correct" | "wrong" | null;
}

export const tictactoeGame: Game<TicTacToeState> = {
  id: "tictactoe",
  title: "Tic-Tac-Toe",
  tickIntervalMs: null,

  init(_ctx: GameContext): TicTacToeState {
    return { board: Array(9).fill(null), winner: null, wins: 0, losses: 0, draws: 0, sfxEvent: null };
  },

  handleKey(state, key) {
    if (state.winner) {
      if (key === "space" || key === "r") {
        state.board = Array(9).fill(null);
        state.winner = null;
      }
      return;
    }

    const idx = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6, "8": 7, "9": 8 }[key];
    if (idx === undefined || state.board[idx] !== null) return;

    state.board[idx] = "X";
    let w = checkWinner(state.board);
    if (w) {
      state.winner = w;
      if (w === "X") {
        state.wins += 1;
        state.sfxEvent = "correct";
        awardXp(15, "games");
      } else {
        state.draws += 1;
      }
      return;
    }

    // AI's turn — instant, minimax on a 3x3 board is trivial
    const { move } = minimax(state.board, "O", 0);
    if (move !== null) state.board[move] = "O";
    w = checkWinner(state.board);
    if (w) {
      state.winner = w;
      if (w === "O") {
        state.losses += 1;
        state.sfxEvent = "wrong";
      } else {
        state.draws += 1;
      }
    }
  },

  render(state) {
    const symbol = (c: Cell, i: number) => {
      if (c === "X") return "{green-fg}{bold} X {/bold}{/green-fg}";
      if (c === "O") return "{red-fg}{bold} O {/bold}{/red-fg}";
      return `{grey-fg} ${i + 1} {/grey-fg}`;
    };
    const rows = [0, 3, 6].map((r) => [0, 1, 2].map((c) => symbol(state.board[r + c], r + c)).join("{grey-fg}│{/grey-fg}"));
    const sep = "{grey-fg}───┼───┼───{/grey-fg}";
    const lines = [rows[0], sep, rows[1], sep, rows[2]];
    if (state.winner) {
      const msg =
        state.winner === "X"
          ? "{green-fg}{bold}You win!{/bold}{/green-fg}"
          : state.winner === "O"
            ? "{red-fg}{bold}AI wins.{/bold}{/red-fg}"
            : "{yellow-fg}{bold}Draw.{/bold}{/yellow-fg}";
      lines.push("", msg, "", "{grey-fg}space = new game{/grey-fg}");
    }
    return lines.join("\n");
  },

  sidebar(state) {
    return [
      `{bold}Wins{/bold}    ${state.wins}`,
      `{bold}Losses{/bold}  ${state.losses}`,
      `{bold}Draws{/bold}   ${state.draws}`,
      "",
      "{grey-fg}press 1-9 to place{/grey-fg}",
      "{grey-fg}the AI plays optimally{/grey-fg}",
      "{grey-fg}— a draw is a good result{/grey-fg}",
    ];
  },

  isOver() {
    return false;
  },

  score(state) {
    return state.wins;
  },

  consumeSfxEvent(state) {
    const e = state.sfxEvent;
    state.sfxEvent = null;
    return e;
  },
};
