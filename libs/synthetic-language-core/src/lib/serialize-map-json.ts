import type { MappingRecord } from "./types";

export function serializeMapJson(records: MappingRecord[]): string {
  return JSON.stringify(records, null, 2) + "\n";
}
