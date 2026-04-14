import type { RankedSyllableEntry } from "@mhvelplund/syllables-core";

export function serializeJson(entries: RankedSyllableEntry[]): string {
  return JSON.stringify(entries, null, 2) + "\n";
}
