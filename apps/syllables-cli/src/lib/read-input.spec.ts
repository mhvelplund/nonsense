import { describe, expect, it } from "vitest";

import { resolveInputRequest } from "./read-input";

describe("resolveInputRequest", () => {
  it("chooses a file path when provided and stdin is a tty", () => {
    expect(
      resolveInputRequest({ inputPath: "input.txt", stdinIsTty: true }),
    ).toEqual({
      source: "file",
      path: "input.txt",
    });
  });

  it("chooses stdin when input is piped and no file path is provided", () => {
    expect(resolveInputRequest({ stdinIsTty: false })).toEqual({
      source: "stdin",
    });
  });

  it("rejects missing input", () => {
    expect(() => resolveInputRequest({ stdinIsTty: true })).toThrow(
      "Provide a file path or pipe input on stdin.",
    );
  });

  it("rejects a file path combined with piped stdin", () => {
    expect(() =>
      resolveInputRequest({ inputPath: "input.txt", stdinIsTty: false }),
    ).toThrow("Use either a file path or stdin, not both.");
  });
});
