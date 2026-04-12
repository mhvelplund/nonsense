# nonsense

## Setup

```bash
pnpm install
```

## Run the CLI

```bash
pnpm exec nx build syllables-cli
node dist/apps/syllables-cli/main.js input.txt
cat input.txt | node dist/apps/syllables-cli/main.js
node dist/apps/syllables-cli/main.js input.txt --format json --output result.json
```

Default behavior:

- format defaults to CSV
- CSV omits the header row unless `--header` is passed
- CSV uses semicolons and always quotes the syllable text column
- `--limit` defaults to `100`
