import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const packageDefinitions = [
  {
    sourcePackagePath: "apps/syllables-cli/package.json",
    distPackagePath: "apps/syllables-cli/dist/package.json",
  },
  {
    sourcePackagePath: "apps/syllable-map-cli/package.json",
    distPackagePath: "apps/syllable-map-cli/dist/package.json",
  },
  {
    sourcePackagePath: "apps/synthetic-language-cli/package.json",
    distPackagePath: "apps/synthetic-language-cli/dist/package.json",
  },
];

const packageJsonPaths = [
  "libs/syllables-core/package.json",
  "libs/synthetic-language-core/package.json",
  ...packageDefinitions.map(({ sourcePackagePath }) => sourcePackagePath),
];

function readJson(path) {
  return JSON.parse(readFileSync(resolve(rootDir, path), "utf-8"));
}

const versionsByPackageName = new Map(
  packageJsonPaths.map((path) => {
    const pkg = readJson(path);

    return [pkg.name, pkg.version];
  }),
);

for (const { sourcePackagePath, distPackagePath } of packageDefinitions) {
  const sourcePackageJson = readJson(sourcePackagePath);
  const distPackageJsonPath = resolve(rootDir, distPackagePath);
  const distPackageJson = readJson(distPackagePath);
  const normalizedDependencies = Object.fromEntries(
    Object.entries(distPackageJson.dependencies ?? {}).map(([name, value]) => {
      return [name, versionsByPackageName.get(name) ?? value];
    }),
  );

  distPackageJson.name = sourcePackageJson.name;
  distPackageJson.version = sourcePackageJson.version;
  distPackageJson.publishConfig = sourcePackageJson.publishConfig;
  distPackageJson.repository = sourcePackageJson.repository;
  distPackageJson.dependencies = normalizedDependencies;

  writeFileSync(
    distPackageJsonPath,
    `${JSON.stringify(distPackageJson, null, 2)}\n`,
  );

  const workspaceModulesPath = resolve(
    rootDir,
    dirname(distPackagePath),
    "workspace_modules",
  );

  if (existsSync(workspaceModulesPath)) {
    rmSync(workspaceModulesPath, { recursive: true, force: true });
  }
}
