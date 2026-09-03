import { describe, it, expect } from "vitest";
import { levelFor, xpIntoLevel, formatDuration } from "./progress.js";

describe("progress", () => {
  it("levelFor computes 1 level per 100 xp", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(99)).toBe(1);
    expect(levelFor(100)).toBe(2);
    expect(levelFor(250)).toBe(3);
  });

  it("xpIntoLevel reports progress within the current level", () => {
    expect(xpIntoLevel(250)).toEqual({ current: 50, needed: 100 });
    expect(xpIntoLevel(0)).toEqual({ current: 0, needed: 100 });
  });

  it("formatDuration formats minutes-only under an hour", () => {
    expect(formatDuration(5 * 60_000)).toBe("5m");
  });

  it("formatDuration formats hours and minutes over an hour", () => {
    expect(formatDuration((4 * 60 + 21) * 60_000)).toBe("4h 21m");
  });
});
