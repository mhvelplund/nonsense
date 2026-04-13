import { describe, expect, it } from "vitest";
import { buildSyllableMap } from "../../src/lib/build-syllable-map";
import type { Rng } from "../../src/lib/generate-synthetic-syllable";

function makeSeqRng(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}

const alwaysZero: Rng = () => 0;

// With rng=0: vowel→'a', consonant→'b'
// "ab" shape: [vowel, consonant] → "ab"
// "it" shape: [vowel, consonant] → "ab" (same as "ab" shape)

describe("buildSyllableMap", () => {
  it("returns an empty array for empty input", () => {
    expect(buildSyllableMap([], alwaysZero)).toEqual([]);
  });

  it("maps source syllables to synthetic equivalents preserving shape", () => {
    const entries = [{ syllable: "ab", count: 5 }];
    const result = buildSyllableMap(entries, alwaysZero);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("ab");
    // synthetic[0] must be vowel (like 'a'), synthetic[1] must be consonant (like 'b')
    expect(result[0].synthetic).toMatch(/^[aeiouy][^aeiouy]$/);
  });

  it("output records are shaped { synthetic, source }", () => {
    const result = buildSyllableMap([{ syllable: "a", count: 1 }], alwaysZero);
    expect(result[0]).toHaveProperty("synthetic");
    expect(result[0]).toHaveProperty("source");
    expect(typeof result[0].synthetic).toBe("string");
    expect(typeof result[0].source).toBe("string");
  });

  it("synthetic syllables are unique across all entries", () => {
    // "ab" and "it" have the same shape [vowel, consonant]
    // With always-zero rng both would produce "ab" - must retry for the second
    // Provide a seq: first 2 calls generate "ab" for first entry,
    // next 2 calls generate "ab" for second (collision), then switch to produce "eb"
    // VOWELS[0]='a', VOWELS[1]='e'; CONSONANTS[0]='b'
    const seqRng = makeSeqRng([0, 0, 0, 0, 1 / 6 + 0.01, 0]);
    const entries = [
      { syllable: "ab", count: 5 },
      { syllable: "it", count: 3 },
    ];
    const result = buildSyllableMap(entries, seqRng);
    expect(result).toHaveLength(2);
    const synthetics = result.map((r) => r.synthetic);
    expect(new Set(synthetics).size).toBe(2);
  });

  it("output order follows first-seen order of input entries", () => {
    // Use entries with distinct shapes so alwaysZero never causes a collision:
    // "aa" (V+V) → "aa", "bb" (C+C) → "bb", "ab" (V+C) → "ab"
    const entries = [
      { syllable: "aa", count: 5 },
      { syllable: "bb", count: 3 },
      { syllable: "ab", count: 1 },
    ];
    const result = buildSyllableMap(entries, alwaysZero);
    expect(result.map((r) => r.source)).toEqual(["aa", "bb", "ab"]);
  });

  it("counts do not appear in the output map", () => {
    const entries = [
      { syllable: "ab", count: 999 },
      { syllable: "cd", count: 1 },
    ];
    const result = buildSyllableMap(entries, alwaysZero);
    for (const record of result) {
      expect(record).not.toHaveProperty("count");
    }
  });

  it("order from the input table does not affect synthetic assignment beyond source identity", () => {
    // Same syllables in different order should still produce same source→synthetic mapping
    const entriesA = [
      { syllable: "ab", count: 100 },
      { syllable: "cd", count: 1 },
    ];
    const entriesB = [
      { syllable: "ab", count: 1 },
      { syllable: "cd", count: 100 },
    ];
    const rngA = alwaysZero;
    const rngB = alwaysZero;
    const resultA = buildSyllableMap(entriesA, rngA);
    const resultB = buildSyllableMap(entriesB, rngB);
    // Same shape: both produce same synthetics regardless of count values
    expect(resultA.map((r) => r.source)).toEqual(resultB.map((r) => r.source));
    expect(resultA.map((r) => r.synthetic)).toEqual(
      resultB.map((r) => r.synthetic),
    );
  });

  it("retries until a unique synthetic is found", () => {
    // "ab" and "it" have the same vowel+consonant shape, first attempt
    // produces the same synthetic — second entry must retry
    const seqRng = makeSeqRng([0, 0, 0, 0, 1 / 6 + 0.01, 0]);
    const entries = [
      { syllable: "ab", count: 5 },
      { syllable: "it", count: 3 },
    ];
    const result = buildSyllableMap(entries, seqRng);
    const [first, second] = result;
    expect(first.synthetic).not.toBe(second.synthetic);
    // Both should still be valid vowel+consonant strings
    expect(first.synthetic).toMatch(/^[aeiouy][^aeiouy]$/);
    expect(second.synthetic).toMatch(/^[aeiouy][^aeiouy]$/);
  });

  it("throws when all unique combinations for a shape are exhausted", () => {
    // Single-vowel shape has exactly 6 combinations (VOWELS: a,e,i,o,u,y).
    // alwaysZero always maps any vowel → "a", so after the first entry claims "a"
    // the second entry can never obtain a unique synthetic and must throw.
    const entries = [
      { syllable: "a", count: 1 },
      { syllable: "i", count: 1 }, // same single-vowel shape; alwaysZero → "a" → exhausted
    ];
    expect(() => buildSyllableMap(entries, alwaysZero)).toThrow(
      /Exhausted all 6 unique synthetic combinations for syllable shape "i"/,
    );
  });
});
