import type { SyllableCounts, SyllableExtractor } from "./types";

export function analyzeSyllableCounts(
  text: string,
  extractSyllables: SyllableExtractor = () => [],
): SyllableCounts {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.reduce<SyllableCounts>((counts, word) => {
    for (const syllable of extractSyllables(word)) {
      counts[syllable] = (counts[syllable] ?? 0) + 1;
    }
    return counts;
  }, {});
}
