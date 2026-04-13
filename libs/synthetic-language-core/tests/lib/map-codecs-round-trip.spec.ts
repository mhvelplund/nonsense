import { describe, expect, it } from "vitest";
import { parseMapCsv } from "../../src/lib/parse-map-csv";
import { parseMapJson } from "../../src/lib/parse-map-json";
import { serializeMapCsv } from "../../src/lib/serialize-map-csv";
import { serializeMapJson } from "../../src/lib/serialize-map-json";
import type { MappingRecord } from "../../src/lib/types";

describe("round-trip serialization", () => {
  const records: MappingRecord[] = [
    { synthetic: "hello", source: "hola" },
    { synthetic: 'say "hi"', source: "world" },
  ];

  it("CSV round-trip without header", () => {
    const csv = serializeMapCsv(records, { header: false });
    expect(parseMapCsv(csv, { header: false })).toEqual(records);
  });

  it("CSV round-trip with header", () => {
    const csv = serializeMapCsv(records, { header: true });
    expect(parseMapCsv(csv, { header: true })).toEqual(records);
  });

  it("JSON round-trip", () => {
    const json = serializeMapJson(records);
    expect(parseMapJson(json)).toEqual(records);
  });
});
