import type { MappingRecord } from "./types";

const ROW_PATTERN = /^"((?:[^"]|"")*)"\;"((?:[^"]|"")*)"$/;

export function parseMapCsv(
  input: string,
  options: { header: boolean },
): MappingRecord[] {
  const lines = input.split(/\r?\n/).filter((line) => line.length > 0);
  const startIndex = options.header && lines.length > 0 ? 1 : 0;

  return lines.slice(startIndex).map((line, i) => {
    const match = ROW_PATTERN.exec(line);
    if (!match) {
      throw new Error(
        `Invalid CSV row at line ${startIndex + i + 1}: ${JSON.stringify(line)}`,
      );
    }
    return {
      synthetic: match[1].replaceAll('""', '"'),
      source: match[2].replaceAll('""', '"'),
    };
  });
}
