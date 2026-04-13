import { describe, expect, it } from "vitest";
import { serializeMapJson } from "../../src/lib/serialize-map-json";

describe("serializeMapJson", () => {
  it("serializes records as pretty-printed JSON with a trailing newline", () => {
    const records = [{ synthetic: "hello", source: "hola" }];
    expect(serializeMapJson(records)).toBe(
      '[\n  {\n    "synthetic": "hello",\n    "source": "hola"\n  }\n]\n',
    );
  });

  it("serializes an empty array correctly", () => {
    expect(serializeMapJson([])).toBe("[]\n");
  });
});
