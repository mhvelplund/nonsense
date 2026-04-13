import { describe, expect, it } from "vitest";
import {
  generateSyntheticSyllable,
  isVowel,
  type Rng,
} from "../../src/lib/generate-synthetic-syllable";

const alwaysZero: Rng = () => 0;

describe("isVowel", () => {
  it("identifies vowels a e i o u y", () => {
    for (const v of ["a", "e", "i", "o", "u", "y"]) {
      expect(isVowel(v), `expected '${v}' to be a vowel`).toBe(true);
    }
  });

  it("identifies non-vowels as consonants", () => {
    for (const c of ["b", "c", "d", "f", "s", "t", "z"]) {
      expect(isVowel(c), `expected '${c}' to be a consonant`).toBe(false);
    }
  });
});

describe("generateSyntheticSyllable", () => {
  it("preserves length", () => {
    expect(generateSyntheticSyllable("ab", alwaysZero)).toHaveLength(2);
    expect(generateSyntheticSyllable("str", alwaysZero)).toHaveLength(3);
  });

  it("starts with vowel when source starts with vowel", () => {
    const result = generateSyntheticSyllable("ab", alwaysZero);
    expect(isVowel(result[0])).toBe(true);
  });

  it("starts with consonant when source starts with consonant", () => {
    const result = generateSyntheticSyllable("ba", alwaysZero);
    expect(isVowel(result[0])).toBe(false);
  });

  it("ends with vowel when source ends with vowel", () => {
    const result = generateSyntheticSyllable("ba", alwaysZero);
    expect(isVowel(result[result.length - 1])).toBe(true);
  });

  it("ends with consonant when source ends with consonant", () => {
    const result = generateSyntheticSyllable("ab", alwaysZero);
    expect(isVowel(result[result.length - 1])).toBe(false);
  });

  it("handles single-letter vowel syllable", () => {
    const result = generateSyntheticSyllable("a", alwaysZero);
    expect(result).toHaveLength(1);
    expect(isVowel(result)).toBe(true);
  });

  it("handles single-letter consonant syllable", () => {
    const result = generateSyntheticSyllable("b", alwaysZero);
    expect(result).toHaveLength(1);
    expect(isVowel(result)).toBe(false);
  });

  it("handles repeated-letter vowel syllable", () => {
    const result = generateSyntheticSyllable("ee", alwaysZero);
    expect(result).toHaveLength(2);
    expect(isVowel(result[0])).toBe(true);
    expect(isVowel(result[1])).toBe(true);
  });

  it("handles repeated-letter consonant syllable", () => {
    const result = generateSyntheticSyllable("ss", alwaysZero);
    expect(result).toHaveLength(2);
    expect(isVowel(result[0])).toBe(false);
    expect(isVowel(result[1])).toBe(false);
  });

  it("produces lowercase ASCII output only", () => {
    const result = generateSyntheticSyllable("ab", alwaysZero);
    expect(result).toMatch(/^[a-z]+$/);
  });

  it("uses the rng to select letters from the appropriate pool", () => {
    // rng=0 picks index 0: vowel→'a', consonant→'b'
    expect(generateSyntheticSyllable("a", alwaysZero)).toBe("a");
    expect(generateSyntheticSyllable("b", alwaysZero)).toBe("b");
  });

  it("different rng values produce different letters from pool", () => {
    const pickFirst = generateSyntheticSyllable("a", () => 0);
    const pickLast = generateSyntheticSyllable("a", () => 0.999);
    // Both must be vowels; at least one should differ
    expect(isVowel(pickFirst)).toBe(true);
    expect(isVowel(pickLast)).toBe(true);
    expect(pickFirst).not.toBe(pickLast);
  });
});
