export function resolveInputRequest(input: {
  inputPath?: string;
  stdinIsTty: boolean;
}): { source: "file"; path: string } | { source: "stdin" } {
  if (input.inputPath && !input.stdinIsTty) {
    throw new Error("Use either a file path or stdin, not both.");
  }

  if (input.inputPath) {
    return { source: "file", path: input.inputPath };
  }

  if (!input.stdinIsTty) {
    return { source: "stdin" };
  }

  throw new Error("Provide a file path or pipe input on stdin.");
}
