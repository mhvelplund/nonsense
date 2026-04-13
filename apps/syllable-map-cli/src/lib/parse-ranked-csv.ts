import type { RankedSyllableEntry } from "@nonsense/syllables-core";

// Matches a quoted syllable field followed by a semicolon and an integer count.
// Format: "syllable";count
const ROW_PATTERN = /^"((?:[^"]|"")*)";(\d+)$/;

export function parseRankedCsv(
  input: string,
  options: { header: boolean },
): RankedSyllableEntry[] {
  const lines = input.split(/\r?\n/).filter((line) => line.length > 0);
  const startIndex = options.header && lines.length > 0 ? 1 : 0;

  return lines.slice(startIndex).map((line, i) => {
    const match = ROW_PATTERN.exec(line);
    if (!match) {
      throw new Error(
        `Invalid ranked CSV row at line ${startIndex + i + 1}: ${JSON.stringify(line)}`,
      );
    }
    return {
      syllable: match[1].replaceAll('""', '"'),
      count: Number(match[2]),
    };
  });
}
