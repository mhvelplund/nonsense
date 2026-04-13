import type { MappingRecord } from "./types";

export function assertMappingRecord(
  value: unknown,
  context?: string,
): MappingRecord {
  const v = value as Record<string, unknown>;
  if (
    typeof value !== "object" ||
    value === null ||
    typeof v["synthetic"] !== "string" ||
    typeof v["source"] !== "string"
  ) {
    const ctx = context ? ` (${context})` : "";
    throw new Error(
      `Invalid mapping record${ctx}: expected { synthetic: string, source: string }, got ${JSON.stringify(value)}`,
    );
  }
  return value as MappingRecord;
}
