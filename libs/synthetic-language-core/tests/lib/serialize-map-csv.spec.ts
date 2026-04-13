import { describe, expect, it } from "vitest";
import { serializeMapCsv } from "../../src/lib/serialize-map-csv";

describe("serializeMapCsv", () => {
  it("serializes records as semicolon-separated quoted fields", () => {
    expect(
      serializeMapCsv([{ synthetic: "hello", source: "hola" }], {
        header: false,
      }),
    ).toBe('"hello";"hola"\n');
  });

  it("prepends the header row when requested", () => {
    expect(
      serializeMapCsv([{ synthetic: "hello", source: "hola" }], {
        header: true,
      }),
    ).toBe('"synthetic";"source"\n"hello";"hola"\n');
  });

  it("escapes embedded quotes by doubling them", () => {
    expect(
      serializeMapCsv([{ synthetic: 'say "hi"', source: 'say "hello"' }], {
        header: false,
      }),
    ).toBe('"say ""hi""";"say ""hello"""\n');
  });

  it("returns empty string for empty records without header", () => {
    expect(serializeMapCsv([], { header: false })).toBe("");
  });

  it("returns only the header line for empty records with header", () => {
    expect(serializeMapCsv([], { header: true })).toBe(
      '"synthetic";"source"\n',
    );
  });
});
