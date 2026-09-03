import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface BookMeta {
  id: number;
  title: string;
  author: string;
}

// Curated public-domain titles (Project Gutenberg IDs, verified against the
// live Gutendex API). Picking a fixed list rather than exposing search
// keeps this to books actually worth reading while waiting a few minutes,
// not a random long/obscure catalog entry.
export const LIBRARY_BOOKS: BookMeta[] = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
  { id: 84, title: "Frankenstein", author: "Mary Shelley" },
  { id: 345, title: "Dracula", author: "Bram Stoker" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville" },
  { id: 64317, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { id: 36, title: "The War of the Worlds", author: "H. G. Wells" },
  { id: 46, title: "A Christmas Carol", author: "Charles Dickens" },
  { id: 35, title: "The Time Machine", author: "H. G. Wells" },
];

const CACHE_DIR = join(homedir(), ".sidequest", "library-cache");

function cacheFile(id: number): string {
  return join(CACHE_DIR, `${id}.txt`);
}

/** Fetches a book's full plain text from Project Gutenberg (via its Gutendex API wrapper), caching it to disk permanently — public-domain text doesn't go stale. */
export async function fetchBookText(id: number): Promise<string> {
  const cached = cacheFile(id);
  if (existsSync(cached)) return readFileSync(cached, "utf8");

  const metaRes = await fetch(`https://gutendex.com/books/${id}`, { signal: AbortSignal.timeout(10_000) });
  if (!metaRes.ok) throw new Error(`gutendex: HTTP ${metaRes.status}`);
  const meta = await metaRes.json();

  const textUrl: string | undefined = meta.formats?.["text/plain; charset=utf-8"] ?? meta.formats?.["text/plain"];
  if (!textUrl) throw new Error("no plain-text format available for this book");

  const textRes = await fetch(textUrl, { signal: AbortSignal.timeout(15_000) });
  if (!textRes.ok) throw new Error(`gutenberg: HTTP ${textRes.status}`);
  const text = await textRes.text();

  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cached, text);
  } catch {
    // caching is best-effort
  }
  return text;
}
