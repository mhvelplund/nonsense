import { describe, expect, it } from "vitest";
import { parseMapJson } from "../../src/lib/parse-map-json";

describe("parseMapJson", () => {
  it("parses a valid JSON array of mapping records", () => {
    const input = JSON.stringify([
      { synthetic: "hello", source: "hola" },
      { synthetic: "world", source: "mundo" },
    ]);
    expect(parseMapJson(input)).toEqual([
      { synthetic: "hello", source: "hola" },
      { synthetic: "world", source: "mundo" },
    ]);
  });

  it("returns an empty array for an empty JSON array", () => {
    expect(parseMapJson("[]")).toEqual([]);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseMapJson("{not valid json}")).toThrow(/Invalid JSON/);
  });

  it("throws when the root value is not an array", () => {
    expect(() => parseMapJson('{"synthetic":"a","source":"b"}')).toThrow(
      /expected an array/,
    );
  });

  it("throws when a record is missing the synthetic field", () => {
    expect(() => parseMapJson('[{"source":"hola"}]')).toThrow(
      /Invalid mapping record/,
    );
  });

  it("throws when a record is missing the source field", () => {
    expect(() => parseMapJson('[{"synthetic":"hello"}]')).toThrow(
      /Invalid mapping record/,
    );
  });

  it("throws when a record has a non-string synthetic field", () => {
    expect(() => parseMapJson('[{"synthetic":42,"source":"hola"}]')).toThrow(
      /Invalid mapping record/,
    );
  });
});
