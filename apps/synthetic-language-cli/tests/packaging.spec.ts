import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Tests intentionally exercise the built install artifact, not the source.
// Run `nx run synthetic-language-cli:prune` before running this spec in isolation.
const distDir = resolve(__dirname, "../dist");
const pkgPath = resolve(distDir, "package.json");
const entrypointPath = resolve(distDir, "main.js");

describe("synthetic-language-cli dist/package.json", () => {
  it("has a bin entry pointing to ./main.js", () => {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
      string,
      unknown
    >;
    expect(pkg["bin"]).toEqual({ "synthetic-language-cli": "./main.js" });
  });

  it("is not marked private", () => {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
      string,
      unknown
    >;
    expect(pkg["private"]).not.toBe(true);
  });
});

describe("synthetic-language-cli dist/main.js", () => {
  it("starts with a #!/usr/bin/env node shebang", () => {
    const content = readFileSync(entrypointPath, "utf-8");
    expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
  });
});

describe("synthetic-language-cli dist non-entrypoint JS files", () => {
  it("do NOT carry the shebang", () => {
    const nonEntrypoints = [
      resolve(distDir, "apps/synthetic-language-cli/src/lib/run-cli.js"),
      resolve(distDir, "apps/synthetic-language-cli/src/lib/run-main.js"),
      resolve(distDir, "libs/synthetic-language-core/src/index.js"),
    ];
    for (const filePath of nonEntrypoints) {
      const content = readFileSync(filePath, "utf-8");
      expect(
        content.startsWith("#!/usr/bin/env node"),
        `${filePath} should not start with shebang`,
      ).toBe(false);
    }
  });
});

describe("README local package usage", () => {
  it("documents running the packaged entrypoint directly instead of workspace-local npm install", () => {
    const readmePath = resolve(__dirname, "../../../README.md");
    const readme = readFileSync(readmePath, "utf-8");

    expect(readme).toContain(
      "node ./apps/synthetic-language-cli/dist/main.js --map map.csv --direction to-synthetic input.txt",
    );
    expect(readme).not.toContain(
      "npm install ./apps/synthetic-language-cli/dist",
    );
    expect(readme).not.toContain(
      "npx --yes --package ./apps/synthetic-language-cli/dist synthetic-language-cli",
    );
  });
});
