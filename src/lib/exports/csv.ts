export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

export function buildCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]) {
  const headerLine = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const bodyLines = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(normalizeCsvCell(column.value(row))))
      .join(",")
  );

  return ["\uFEFF" + headerLine, ...bodyLines].join("\n");
}

function normalizeCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function escapeCsvValue(value: string) {
  if (value.length === 0) {
    return "";
  }

  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
