import { describe, expect, it } from "vitest";
import type { MappingRecord } from "../../src/lib/types.js";
import { translateText } from "../../src/lib/translate-text.js";

const mapping: MappingRecord[] = [
  { source: "hel", synthetic: "zel" },
  { source: "lo", synthetic: "vo" },
  { source: "world", synthetic: "krix" },
  { source: "hap", synthetic: "bru" },
  { source: "py", synthetic: "na" },
];

/**
 * Simple extractor that splits a word into single-character syllables
 * unless an override is provided.
 */
function makeExtractor(
  syllableMap: Record<string, string[]>,
): (word: string) => string[] {
  return (word: string) => syllableMap[word] ?? [word];
}

const extract = makeExtractor({
  hello: ["hel", "lo"],
  world: ["world"],
  happy: ["hap", "py"],
  unknown: ["un", "known"],
});

describe("translateText", () => {
  describe("to-synthetic direction", () => {
    it("translates a single word from source to synthetic", () => {
      const result = translateText("hello", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe("zelvo");
    });

    it("translates prose with multiple words", () => {
      const result = translateText("hello world", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe("zelvo krix");
    });
  });

  describe("from-synthetic direction", () => {
    it("does not require a syllable extractor to translate synthetic words back to source", () => {
      const result = translateText("zelvo", mapping, {
        direction: "from-synthetic",
        extractSyllables: () => {
          throw new Error("should not call extractor for synthetic input");
        },
      });
      expect(result).toBe("hello");
    });

    it("prefers a full mapped segmentation over a greedy longest-prefix match", () => {
      const overlappingMapping: MappingRecord[] = [
        { source: "x", synthetic: "ab" },
        { source: "y", synthetic: "aba" },
        { source: "z", synthetic: "ac" },
      ];

      const result = translateText("abac", overlappingMapping, {
        direction: "from-synthetic",
      });

      expect(result).toBe("xz");
    });

    it("translates a single word from synthetic to source", () => {
      const syntheticExtract = makeExtractor({ zelvo: ["zel", "vo"] });
      const result = translateText("zelvo", mapping, {
        direction: "from-synthetic",
        extractSyllables: syntheticExtract,
      });
      expect(result).toBe("hello");
    });

    it("translates prose from synthetic back to source", () => {
      const syntheticExtract = makeExtractor({
        zelvo: ["zel", "vo"],
        krix: ["krix"],
      });
      const result = translateText("zelvo krix", mapping, {
        direction: "from-synthetic",
        extractSyllables: syntheticExtract,
      });
      expect(result).toBe("hello world");
    });

    it("uses the same mapping records (no data duplication)", () => {
      const syntheticExtract = makeExtractor({ bruna: ["bru", "na"] });
      const forwardResult = translateText("happy", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      const reverseResult = translateText("bruna", mapping, {
        direction: "from-synthetic",
        extractSyllables: syntheticExtract,
      });
      expect(forwardResult).toBe("bruna");
      expect(reverseResult).toBe("happy");
    });
  });

  describe("punctuation preservation", () => {
    it("preserves punctuation before and after a word", () => {
      const result = translateText('"hello"', mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe('"zelvo"');
    });

    it("preserves sentence-ending punctuation", () => {
      const result = translateText("hello world.", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe("zelvo krix.");
    });

    it("preserves commas between words", () => {
      const result = translateText("hello, world", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe("zelvo, krix");
    });
  });

  describe("case preservation", () => {
    it("preserves all-caps", () => {
      const allCapsExtract = makeExtractor({ hello: ["hel", "lo"] });
      const result = translateText("HELLO", mapping, {
        direction: "to-synthetic",
        extractSyllables: allCapsExtract,
      });
      expect(result).toBe("ZELVO");
    });

    it("preserves title case", () => {
      const titleExtract = makeExtractor({ hello: ["hel", "lo"] });
      const result = translateText("Hello", mapping, {
        direction: "to-synthetic",
        extractSyllables: titleExtract,
      });
      expect(result).toBe("Zelvo");
    });

    it("preserves lowercase unchanged", () => {
      const result = translateText("hello", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      expect(result).toBe("zelvo");
    });

    it("leaves extra translated characters lowercase when translated word is longer", () => {
      const shortMapping: MappingRecord[] = [
        { source: "hi", synthetic: "hello" },
      ];
      const shortExtract = makeExtractor({ hi: ["hi"] });
      const result = translateText("HI", shortMapping, {
        direction: "to-synthetic",
        extractSyllables: shortExtract,
      });
      // H and I are caps so first two chars -> "HE", rest lowercase -> "llo"
      expect(result).toBe("HEllo");
    });
  });

  describe("unmapped syllables", () => {
    it("leaves unmapped syllables unchanged", () => {
      const result = translateText("unknown", mapping, {
        direction: "to-synthetic",
        extractSyllables: extract,
      });
      // "un" and "known" are not in the map, so the word stays as-is
      expect(result).toBe("unknown");
    });

    it("partially translates a word with some unmapped syllables", () => {
      const partialMapping: MappingRecord[] = [
        { source: "hap", synthetic: "bru" },
      ];
      const partialExtract = makeExtractor({ hapless: ["hap", "less"] });
      const result = translateText("hapless", partialMapping, {
        direction: "to-synthetic",
        extractSyllables: partialExtract,
      });
      // "hap" -> "bru", "less" unmapped -> "less"
      expect(result).toBe("bruless");
    });
  });

  describe("apostrophes and contractions", () => {
    it("translates alphabetic runs on either side of an apostrophe independently and preserves the apostrophe", () => {
      // The regex /[A-Za-z]+/g splits "don't" into "don" and "t".
      // Each alphabetic run is translated independently; the apostrophe is
      // a non-alphabetic character and passes through unchanged.
      const contractionMapping: MappingRecord[] = [
        { source: "don", synthetic: "zel" },
        { source: "t", synthetic: "vo" },
      ];
      const contractionExtract = makeExtractor({
        don: ["don"],
        t: ["t"],
      });
      const result = translateText("don't", contractionMapping, {
        direction: "to-synthetic",
        extractSyllables: contractionExtract,
      });
      expect(result).toBe("zel'vo");
    });
  });

  describe("unicode word handling", () => {
    it("translates Danish words containing non-ASCII letters", () => {
      const danishMapping: MappingRecord[] = [
        { source: "blå", synthetic: "sne" },
      ];
      const danishExtract = makeExtractor({ blå: ["blå"] });

      const result = translateText("blå", danishMapping, {
        direction: "to-synthetic",
        language: "da",
        extractSyllables: danishExtract,
      });

      expect(result).toBe("sne");
    });
  });
});
