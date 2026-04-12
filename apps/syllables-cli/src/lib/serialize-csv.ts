import type { RankedSyllableEntry } from "@nonsense/syllables-core";

export function serializeCsv(
  entries: RankedSyllableEntry[],
  options: { header: boolean },
): string {
  const rows = entries.map(
    ({ syllable, count }) =>
      '"' + syllable.replaceAll('"', '""') + '";' + count,
  );

  if (options.header) {
    rows.unshift('"syllable";count');
  }

  if (rows.length === 0) {
    return options.header ? '"syllable";count\n' : "";
  }

  return rows.join("\n") + "\n";
}
