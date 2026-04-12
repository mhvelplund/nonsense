# nonsense

## Setup

```bash
pnpm install
```

## Package the CLI

```bash
pnpm exec nx run syllables-cli:prune
```

## Install and run

### Global install (recommended)

```bash
npm install -g ./apps/syllables-cli/dist
syllables-cli input.txt
cat input.txt | syllables-cli
syllables-cli input.txt --format json --output result.json
```

### Project-local install

```bash
npm install ./apps/syllables-cli/dist
npx --no-install syllables-cli input.txt
```

Default behavior:

- format defaults to CSV
- CSV omits the header row unless `--header` is passed
- CSV uses semicolons and always quotes the syllable text column
- `--limit` defaults to `100`
