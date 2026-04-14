import {
  createHypherSyllableExtractor,
  type SupportedLanguage,
} from "@mhvelplund/syllables-core";
import type { MappingRecord } from "./types.js";

export type TranslationDirection = "to-synthetic" | "from-synthetic";

export interface TranslateTextOptions {
  direction: TranslationDirection;
  language?: SupportedLanguage;
  extractSyllables?: (word: string) => string[];
}

/**
 * Replays the casing from `original` onto `translated` character-by-character.
 * Extra translated characters (beyond original length) are left lowercase.
 */
function replayCase(original: string, translated: string): string {
  let result = "";
  for (let i = 0; i < translated.length; i++) {
    if (
      i < original.length &&
      original[i] === original[i].toUpperCase() &&
      original[i] !== original[i].toLowerCase()
    ) {
      result += translated[i].toUpperCase();
    } else {
      result += translated[i].toLowerCase();
    }
  }
  return result;
}

/**
 * Translates a word using the syllable lookup map.
 * The extractor always receives a lowercase word so that the real Hypher-based
 * extractor works correctly regardless of the original casing. Each returned
 * syllable is also lowercased before lookup. Syllables with no mapping entry
 * are left unchanged.
 */
function translateWord(
  word: string,
  lookup: Map<string, string>,
  extractSyllables: (word: string) => string[],
): string {
  const syllables = extractSyllables(word.toLowerCase());
  return syllables
    .map((syl) => {
      const key = syl.toLowerCase();
      return lookup.get(key) ?? key;
    })
    .join("");
}

function translateSyntheticWord(
  word: string,
  lookup: Map<string, string>,
): string {
  const lowerWord = word.toLowerCase();
  const knownSyllables = Array.from(lookup.keys()).sort(
    (left, right) => right.length - left.length,
  );
  const memo = new Map<number, { translated: string; unmatched: number }>();

  function bestFrom(index: number): { translated: string; unmatched: number } {
    if (index >= lowerWord.length) {
      return { translated: "", unmatched: 0 };
    }

    const cached = memo.get(index);
    if (cached) {
      return cached;
    }

    const fallbackRest = bestFrom(index + 1);
    let best = {
      translated: lowerWord[index] + fallbackRest.translated,
      unmatched: fallbackRest.unmatched + 1,
    };

    for (const syllable of knownSyllables) {
      if (!lowerWord.startsWith(syllable, index)) {
        continue;
      }

      const rest = bestFrom(index + syllable.length);
      const candidate = {
        translated: (lookup.get(syllable) ?? syllable) + rest.translated,
        unmatched: rest.unmatched,
      };

      if (candidate.unmatched < best.unmatched) {
        best = candidate;
      }
    }

    memo.set(index, best);
    return best;
  }

  return bestFrom(0).translated;
}

/**
 * Translates prose text word by word, preserving punctuation, whitespace, and
 * casing. Non-alphabetic characters are never modified.
 */
export function translateText(
  text: string,
  mapping: MappingRecord[],
  options: TranslateTextOptions,
): string {
  const { direction, language = "en-us", extractSyllables: inject } = options;
  const extractSyllables = inject ?? createHypherSyllableExtractor(language);

  const lookup = new Map<string, string>(
    mapping.map((r) =>
      direction === "to-synthetic"
        ? [r.source, r.synthetic]
        : [r.synthetic, r.source],
    ),
  );

  // Split the text into alternating non-word / word segments and process words.
  return text.replace(/\p{L}+/gu, (originalWord) => {
    const translatedLower =
      direction === "from-synthetic"
        ? translateSyntheticWord(originalWord, lookup)
        : translateWord(originalWord, lookup, extractSyllables);
    return replayCase(originalWord, translatedLower);
  });
}
