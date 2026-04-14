import type { RankedSyllableEntry } from "@mhvelplund/syllables-core";

function assertRankedEntry(
  value: unknown,
  context: string,
): RankedSyllableEntry {
  const v = value as Record<string, unknown>;
  if (
    typeof value !== "object" ||
    value === null ||
    typeof v["syllable"] !== "string" ||
    typeof v["count"] !== "number" ||
    !Number.isInteger(v["count"]) ||
    (v["count"] as number) < 0
  ) {
    throw new Error(
      `Invalid ranked entry (${context}): expected { syllable: string, count: number }, got ${JSON.stringify(value)}`,
    );
  }
  return { syllable: v["syllable"] as string, count: v["count"] as number };
}

export function parseRankedJson(input: string): RankedSyllableEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Invalid ranked JSON: expected an array, got ${typeof parsed}`,
    );
  }
  return parsed.map((item, i) => assertRankedEntry(item, `index ${i}`));
}
