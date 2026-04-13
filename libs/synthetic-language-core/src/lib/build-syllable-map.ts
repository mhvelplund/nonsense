import type { RankedSyllableEntry } from "@nonsense/syllables-core";

import type { MappingRecord } from "./types";
import {
  generateSyntheticSyllable,
  isVowel,
  type Rng,
} from "./generate-synthetic-syllable";

// Pool sizes must stay in sync with generate-synthetic-syllable.ts
const VOWEL_POOL_SIZE = 6; // a, e, i, o, u, y
const CONSONANT_POOL_SIZE = 20; // 26 minus 6 vowels

function maxUniqueCombinations(source: string): number {
  return source
    .split("")
    .reduce(
      (acc, ch) => acc * (isVowel(ch) ? VOWEL_POOL_SIZE : CONSONANT_POOL_SIZE),
      1,
    );
}

export function buildSyllableMap(
  entries: RankedSyllableEntry[],
  rng: Rng = Math.random,
): MappingRecord[] {
  const used = new Set<string>();
  return entries.map(({ syllable }) => {
    const maxAttempts = maxUniqueCombinations(syllable);
    let synthetic: string;
    let attempts = 0;
    do {
      if (attempts >= maxAttempts) {
        throw new Error(
          `Exhausted all ${maxAttempts} unique synthetic combinations for syllable shape "${syllable}"`,
        );
      }
      synthetic = generateSyntheticSyllable(syllable, rng);
      attempts++;
    } while (used.has(synthetic));
    used.add(synthetic);
    return { synthetic, source: syllable };
  });
}
