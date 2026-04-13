import { describe, expect, it } from "vitest";

import { rankSyllableCounts } from "../../src/lib/rank-syllable-counts";

describe("rankSyllableCounts", () => {
  it("selects membership by count desc then syllable asc before applying output sort", () => {
    const ranked = rankSyllableCounts(
      { zz: 5, aa: 5, mm: 4 },
      {
        limit: 2,
        sort: [{ field: "syllable", direction: "asc" }],
      },
    );

    expect(ranked).toEqual([
      { syllable: "aa", count: 5 },
      { syllable: "zz", count: 5 },
    ]);
  });

  it("uses the canonical default order when no sort options are supplied", () => {
    expect(rankSyllableCounts({ zz: 2, aa: 2, mm: 1 }, { sort: [] })).toEqual([
      { syllable: "aa", count: 2 },
      { syllable: "zz", count: 2 },
      { syllable: "mm", count: 1 },
    ]);
  });

  it("returns an empty list for empty counts", () => {
    expect(rankSyllableCounts({}, { sort: [] })).toEqual([]);
  });

  it("defaults the limit to 100 when omitted", () => {
    const counts = Object.fromEntries(
      Array.from({ length: 101 }, (_, index) => [`s${index}`, 101 - index]),
    );

    expect(rankSyllableCounts(counts, { sort: [] })).toHaveLength(100);
  });

  it("rejects invalid limits", () => {
    for (const limit of [0, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => rankSyllableCounts({ aa: 1 }, { limit, sort: [] })).toThrow(
        /positive integer/i,
      );
    }
  });

  it("supports multi-key sorting with mixed directions", () => {
    const ranked = rankSyllableCounts(
      { aa: 2, zz: 2, mm: 1 },
      {
        limit: 3,
        sort: [
          { field: "count", direction: "asc" },
          { field: "syllable", direction: "desc" },
        ],
      },
    );

    expect(ranked).toEqual([
      { syllable: "mm", count: 1 },
      { syllable: "zz", count: 2 },
      { syllable: "aa", count: 2 },
    ]);
  });
});
