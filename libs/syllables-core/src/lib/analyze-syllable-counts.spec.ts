import { describe, expect, it } from "vitest";

import { analyzeSyllableCounts } from "./analyze-syllable-counts";
import type { SyllableExtractor } from "./types";

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

  it("rethrows extractor failures instead of swallowing them", () => {
    const failingExtractor: SyllableExtractor = () => {
      throw new Error("extractor failed");
    };

    expect(() => analyzeSyllableCounts("syllable", failingExtractor)).toThrow(
      "extractor failed",
    );
  });
});
