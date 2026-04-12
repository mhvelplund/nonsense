import type { RankedSyllableEntry, SyllableCounts } from "./types";

export function toSyllableRecord(
  entries: RankedSyllableEntry[],
): SyllableCounts {
  return Object.fromEntries(
    entries.map(({ syllable, count }) => [syllable, count]),
  );
}
