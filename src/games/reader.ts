import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fetchBookText, type BookMeta } from "./data/gutendex.js";
import type { Game, GameContext } from "./types.js";

const PAGE_WIDTH = 58; // fits inside the game canvas with a little margin
const PAGE_HEIGHT = 16;

const PROGRESS_FILE = join(homedir(), ".sidequest", "reading-progress.json");

function loadProgress(): Record<string, number> {
  try {
    if (!existsSync(PROGRESS_FILE)) return {};
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveProgress(bookId: number, page: number): void {
  try {
    const all = loadProgress();
    all[String(bookId)] = page;
    mkdirSync(join(homedir(), ".sidequest"), { recursive: true });
    writeFileSync(PROGRESS_FILE, JSON.stringify(all));
  } catch {
    // best-effort
  }
}

/** Strips Project Gutenberg's standard license/header boilerplate, leaving just the actual text. */
function stripBoilerplate(raw: string): string {
  const startMarker = /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const endMarker = /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const startMatch = raw.match(startMarker);
  const endMatch = raw.match(endMarker);
  const start = startMatch ? startMatch.index! + startMatch[0].length : 0;
  const end = endMatch ? endMatch.index! : raw.length;
  return raw.slice(start, end).trim();
}

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n\s*\n/)) {
    const words = paragraph.replace(/\s+/g, " ").trim().split(" ");
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length > width) {
        lines.push(current);
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    }
    if (current) lines.push(current);
    lines.push(""); // paragraph break
  }
  return lines;
}

function paginate(lines: string[]): string[][] {
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += PAGE_HEIGHT) {
    pages.push(lines.slice(i, i + PAGE_HEIGHT));
  }
  return pages.length ? pages : [[]];
}

export interface ReaderState {
  book: BookMeta;
  loading: boolean;
  error: string | null;
  pages: string[][];
  page: number;
}

export function buildReaderGame(book: BookMeta): Game<ReaderState> {
  return {
    id: `library-${book.id}`,
    title: book.title,
    tickIntervalMs: null,

    init(_ctx: GameContext): ReaderState {
      const state: ReaderState = {
        book,
        loading: true,
        error: null,
        pages: [[]],
        page: loadProgress()[String(book.id)] ?? 0,
      };
      fetchBookText(book.id)
        .then((raw) => {
          const lines = wrapText(stripBoilerplate(raw), PAGE_WIDTH);
          state.pages = paginate(lines);
          state.page = Math.min(state.page, state.pages.length - 1);
          state.loading = false;
        })
        .catch((err) => {
          state.error = err instanceof Error ? err.message : "failed to load book";
          state.loading = false;
        });
      return state;
    },

    handleKey(state, key) {
      if (state.loading || state.error) return;
      if (key === "right" || key === "down" || key === "space" || key === "n") {
        if (state.page < state.pages.length - 1) {
          state.page += 1;
          saveProgress(state.book.id, state.page);
        }
      } else if (key === "left" || key === "up" || key === "p") {
        if (state.page > 0) {
          state.page -= 1;
          saveProgress(state.book.id, state.page);
        }
      }
    },

    render(state) {
      if (state.loading) return "{grey-fg}loading book...{/grey-fg}";
      if (state.error) return `{red-fg}couldn't load this book: ${escapeTags(state.error)}{/red-fg}`;
      return state.pages[state.page].map(escapeTags).join("\n");
    },

    sidebar(state) {
      if (state.loading || state.error) return [];
      const pct = Math.round(((state.page + 1) / state.pages.length) * 100);
      return [
        `{bold}${escapeTags(state.book.title)}{/bold}`,
        `{grey-fg}by ${escapeTags(state.book.author)}{/grey-fg}`,
        "",
        `Page ${state.page + 1} / ${state.pages.length}`,
        `${pct}% read`,
        "",
        "{grey-fg}←/→ turn page{/grey-fg}",
        "{grey-fg}progress saved{/grey-fg}",
      ];
    },

    isOver() {
      return false;
    },

    score() {
      return 0; // reading isn't scored — "best: N" in the menu would be meaningless here
    },
  };
}

function escapeTags(s: string): string {
  return s.replace(/[{}]/g, (c) => (c === "{" ? "{open}" : "{close}"));
}
