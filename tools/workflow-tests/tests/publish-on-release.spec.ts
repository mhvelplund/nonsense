import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("publish-on-release workflow", () => {
  test("publishes packages from inside each package directory", () => {
    const workflow = readFileSync(
      resolve(__dirname, "../../../.github/workflows/publish-on-release.yml"),
      "utf8",
    );

    expect(workflow).toContain(
      "(cd libs/syllables-core && pnpm publish --no-git-checks)",
    );
    expect(workflow).toContain(
      "(cd libs/synthetic-language-core && pnpm publish --no-git-checks)",
    );
    expect(workflow).toContain(
      "(cd apps/syllables-cli/dist && pnpm publish --no-git-checks)",
    );
    expect(workflow).toContain(
      "(cd apps/syllable-map-cli/dist && pnpm publish --no-git-checks)",
    );
    expect(workflow).toContain(
      "(cd apps/synthetic-language-cli/dist && pnpm publish --no-git-checks)",
    );
    expect(workflow).not.toMatch(/pnpm --dir .* publish --no-git-checks/);
  });
});
