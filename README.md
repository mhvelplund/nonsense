# nonsense

## Setup

```bash
pnpm install
```

## Package the CLIs

```bash
nx run syllables-cli:prune
nx run syllable-map-cli:prune
nx run synthetic-language-cli:prune
```

## Install and run

### syllables-cli

Counts syllable frequencies in text input and outputs a ranked list.

#### Global install (recommended)

```bash
npm install -g ./apps/syllables-cli/dist
syllables-cli input.txt
cat input.txt | syllables-cli
syllables-cli input.txt --format json --output result.json
```

#### Run from this repository without installing into the workspace

```bash
node ./apps/syllables-cli/dist/main.js input.txt
cat input.txt | node ./apps/syllables-cli/dist/main.js
node ./apps/syllables-cli/dist/main.js input.txt --format json --output result.json
```

Default behavior:

- format defaults to CSV
- CSV omits the header row unless `--header` is passed
- CSV uses semicolons and always quotes the syllable text column
- `--limit` defaults to `100`

### syllable-map-cli

Builds a syllable substitution map from a ranked syllable list (e.g. the output of `syllables-cli`).

#### Global install (recommended)

```bash
npm install -g ./apps/syllable-map-cli/dist
syllable-map-cli ranked.csv
cat ranked.csv | syllable-map-cli
syllable-map-cli ranked.csv --format json --output map.json
syllable-map-cli ranked.json --input-format json --format json --output map.json
```

#### Run from this repository without installing into the workspace

```bash
node ./apps/syllable-map-cli/dist/main.js ranked.csv
cat ranked.csv | node ./apps/syllable-map-cli/dist/main.js
node ./apps/syllable-map-cli/dist/main.js ranked.csv --format json --output map.json
```

Default behavior:

- input format defaults to CSV
- output format defaults to CSV
- CSV omits the header row unless `--header` / `--input-header` is passed

### synthetic-language-cli

Translates text to or from a synthetic language using a syllable substitution map.

Requires `--map <path>` and `--direction <to-synthetic|from-synthetic>`.

#### Global install (recommended)

```bash
npm install -g ./apps/synthetic-language-cli/dist
synthetic-language-cli --map map.csv --direction to-synthetic input.txt
cat input.txt | synthetic-language-cli --map map.csv --direction to-synthetic
synthetic-language-cli --map map.json --map-format json --direction from-synthetic input.txt --output result.txt
```

#### Run from this repository without installing into the workspace

```bash
node ./apps/synthetic-language-cli/dist/main.js --map map.csv --direction to-synthetic input.txt
cat input.txt | node ./apps/synthetic-language-cli/dist/main.js --map map.csv --direction to-synthetic
node ./apps/synthetic-language-cli/dist/main.js --map map.json --map-format json --direction from-synthetic input.txt
```

Default behavior:

- map format defaults to CSV
- language defaults to `en-us` (also supports `da`)
- output goes to stdout unless `--output <path>` is given
