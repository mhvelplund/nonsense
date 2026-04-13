import { describe, expect, it, vi } from "vitest";

import { analyzeSyllableCounts } from "../../src/lib/analyze-syllable-counts";
import type { SyllableExtractor } from "../../src/lib/types";

const extractor: SyllableExtractor = (word) => {
  if (word === "syllable") return ["syl", "la", "ble"];
  if (word === "common") return ["com", "mon"];
  return [];
};

describe("analyzeSyllableCounts", () => {
  it("returns an unsorted syllable-count record", () => {
    const counts = analyzeSyllableCounts("Syllable common syllable", extractor);

    expect(counts).toEqual({
      syl: 2,
      la: 2,
      ble: 2,
      com: 1,
      mon: 1,
    });
    expect(Object.keys(counts)).toEqual(["syl", "la", "ble", "com", "mon"]);
  });

  it("returns an empty record for empty input", () => {
    expect(analyzeSyllableCounts("", extractor)).toEqual({});
  });

  it("returns an empty record when no words produce syllables", () => {
    expect(analyzeSyllableCounts("mystery tokens", () => [])).toEqual({});
  });

  it("uses the hypher extractor by default", () => {
    expect(analyzeSyllableCounts("Syllable common")).toEqual({
      syl: 1,
      la: 1,
      ble: 1,
      com: 1,
      mon: 1,
    });
  });

  it("reuses the default hypher extractor across calls", async () => {
    vi.resetModules();

    const extractSyllables = vi.fn((word: string) => [word]);
    const createExtractor = vi.fn(() => extractSyllables);

    vi.doMock("../../src/lib/hypher-syllable-extractor", () => ({
      createHypherSyllableExtractor: createExtractor,
    }));

    const { analyzeSyllableCounts: analyzeWithMockedExtractor } =
      await import("../../src/lib/analyze-syllable-counts.js");

    analyzeWithMockedExtractor("alpha");
    analyzeWithMockedExtractor("beta");

    expect(createExtractor).toHaveBeenCalledTimes(1);

    vi.doUnmock("../../src/lib/hypher-syllable-extractor");
  });

  it("ignores words whose extractor returns no syllables", () => {
    const sparseExtractor: SyllableExtractor = (word) => {
      if (word === "syllable") return ["syl", "la", "ble"];
      return [];
    };

    expect(analyzeSyllableCounts("syllable mystery", sparseExtractor)).toEqual({
      syl: 1,
      la: 1,
      ble: 1,
    });
  });

  it("rethrows extractor failures instead of swallowing them", () => {
    const failingExtractor: SyllableExtractor = () => {
      throw new Error("extractor failed");
    };

    expect(() => analyzeSyllableCounts("syllable", failingExtractor)).toThrow(
      "extractor failed",
    );
  });
});
