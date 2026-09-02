export type Point = { x: number; y: number };
export type Direction = "up" | "down" | "left" | "right";

export interface SnakeState {
  width: number;
  height: number;
  snake: Point[]; // head is snake[0]
  direction: Direction;
  pendingDirection: Direction;
  food: Point;
  score: number;
  gameOver: boolean;
  rng: () => number;
  sfxEvent: "eat" | "gameover" | null;
  started: boolean;
}

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createSnakeState(width: number, height: number, rng: () => number = Math.random): SnakeState {
  const startX = Math.floor(width / 2);
  const startY = Math.floor(height / 2);
  const state: SnakeState = {
    width,
    height,
    snake: [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ],
    direction: "right",
    pendingDirection: "right",
    food: { x: 0, y: 0 },
    score: 0,
    gameOver: false,
    rng,
    sfxEvent: null,
    started: false,
  };
  state.food = spawnFood(state);
  return state;
}

function spawnFood(state: SnakeState): Point {
  const occupied = new Set(state.snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  const idx = Math.floor(state.rng() * free.length);
  return free[idx];
}

export function setDirection(state: SnakeState, dir: Direction): void {
  // Check against pendingDirection (the last *queued* turn), not state.direction
  // (the last *applied* one). Otherwise two key presses landing in the same tick
  // window (e.g. up then down) can each look legal individually but combine into
  // an effective 180-degree reversal — driving the snake straight into its own neck.
  if (OPPOSITE[dir] === state.pendingDirection) return;
  state.pendingDirection = dir;
}

export function step(state: SnakeState): SnakeState {
  state.sfxEvent = null;
  if (state.gameOver || !state.started) return state;

  state.direction = state.pendingDirection;
  const head = state.snake[0];
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const d = delta[state.direction];
  const newHead: Point = { x: head.x + d.x, y: head.y + d.y };

  if (
    newHead.x < 0 ||
    newHead.x >= state.width ||
    newHead.y < 0 ||
    newHead.y >= state.height
  ) {
    state.gameOver = true;
    state.sfxEvent = "gameover";
    return state;
  }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const body = ateFood ? state.snake : state.snake.slice(0, -1);

  if (body.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    state.gameOver = true;
    state.sfxEvent = "gameover";
    return state;
  }

  state.snake = [newHead, ...body];

  if (ateFood) {
    state.score += 1;
    state.food = spawnFood(state);
    state.sfxEvent = "eat";
  }

  return state;
}
