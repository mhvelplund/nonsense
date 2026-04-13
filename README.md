# nonsense

## Setup

```bash
pnpm install
```

## Package the CLI

```bash
nx run syllables-cli:prune
```

## Install and run

### Global install (recommended)

```bash
npm install -g ./apps/syllables-cli/dist
syllables-cli input.txt
cat input.txt | syllables-cli
syllables-cli input.txt --format json --output result.json
```

### Run from this repository without installing into the workspace

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
