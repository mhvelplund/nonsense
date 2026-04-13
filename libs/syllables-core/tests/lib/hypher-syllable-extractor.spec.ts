import { describe, expect, it } from "vitest";

import { createHypherSyllableExtractor } from "../../src/lib/hypher-syllable-extractor";

describe("createHypherSyllableExtractor", () => {
  it("splits words using the English hyphenation patterns", () => {
    const extract = createHypherSyllableExtractor();

    expect(extract("syllable")).toEqual(["syl", "la", "ble"]);
    expect(extract("common")).toEqual(["com", "mon"]);
  });

  it("rethrows dependency initialization failures", () => {
    expect(() =>
      createHypherSyllableExtractor(() => {
        throw new Error("hypher init failed");
      }),
    ).toThrow("hypher init failed");
  });

  it("rethrows dependency failures so callers can surface them", () => {
    const extract = createHypherSyllableExtractor(() => ({
      hyphenate() {
        throw new Error("hypher failed");
      },
    }));

    expect(() => extract("syllable")).toThrow("hypher failed");
  });
});
