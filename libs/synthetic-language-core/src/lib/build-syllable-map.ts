import type { RankedSyllableEntry } from "@nonsense/syllables-core";

import type { MappingRecord } from "./types";
import {
  generateSyntheticSyllable,
  isVowel,
  VOWEL_POOL_SIZE,
  CONSONANT_POOL_SIZE,
  type Rng,
} from "./generate-synthetic-syllable";

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
          `Failed to find a unique synthetic syllable for "${syllable}" after ${maxAttempts} attempts`,
        );
      }
      synthetic = generateSyntheticSyllable(syllable, rng);
      attempts++;
    } while (used.has(synthetic));
    used.add(synthetic);
    return { synthetic, source: syllable };
  });
}
