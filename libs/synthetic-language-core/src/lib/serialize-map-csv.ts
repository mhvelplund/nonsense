import type { MappingRecord } from "./types";

function quoteField(value: string): string {
  return '"' + value.replaceAll('"', '""') + '"';
}

export function serializeMapCsv(
  records: MappingRecord[],
  options: { header: boolean },
): string {
  const rows = records.map(
    ({ synthetic, source }) => quoteField(synthetic) + ";" + quoteField(source),
  );

  if (options.header) {
    rows.unshift('"synthetic";"source"');
  }

  if (rows.length === 0) {
    return "";
  }

  return rows.join("\n") + "\n";
}
