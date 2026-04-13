import { describe, expect, it } from "vitest";

import { serializeJson } from "../../src/lib/serialize-json";

describe("serializeJson", () => {
  it("serializes ranked entries as a JSON array", () => {
    expect(
      serializeJson([
        { syllable: "la", count: 2 },
        { syllable: "ble", count: 2 },
      ]),
    ).toBe(
      '[\n  {\n    "syllable": "la",\n    "count": 2\n  },\n  {\n    "syllable": "ble",\n    "count": 2\n  }\n]\n',
    );
  });

  it("serializes empty results as an empty JSON array", () => {
    expect(serializeJson([])).toBe("[]\n");
  });
});
