import { createHypherSyllableExtractor } from "./hypher-syllable-extractor";
import { tokenizeWords } from "./tokenize-words";
import type { SyllableCounts, SyllableExtractor } from "./types";

const defaultExtractor: SyllableExtractor = createHypherSyllableExtractor();

export function analyzeSyllableCounts(
  text: string,
  extractSyllables: SyllableExtractor = defaultExtractor,
): SyllableCounts {
  const words = tokenizeWords(text);
  return words.reduce<SyllableCounts>((counts, word) => {
    for (const syllable of extractSyllables(word)) {
      counts[syllable] = (counts[syllable] ?? 0) + 1;
    }
    return counts;
  }, {});
}
