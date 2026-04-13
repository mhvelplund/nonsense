import type { MappingRecord } from "./types";
import { assertMappingRecord } from "./map-records";

export function parseMapJson(input: string): MappingRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `Invalid mapping JSON: expected an array, got ${typeof parsed}`,
    );
  }
  return parsed.map((item, i) => assertMappingRecord(item, `index ${i}`));
}
