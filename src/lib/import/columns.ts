import { normalizePlate } from "../validation/plate";

type ImportValue = string | number | boolean | null | undefined;
type ImportRow = Record<string, ImportValue>;

const COLUMN_ALIASES: Record<string, string> = {
  car_colour: "colour",
  car_make: "make",
  car_model: "model",
  color: "colour",
  full_name: "name",
  license_plate: "plate_number",
  owner_name: "name",
  plate: "plate_number",
  unit: "unit_number",
  unit_number: "unit_number",
  vehicle_year: "year",
};

function normalizeHeader(column: string): string {
  return column
    .trim()
    .toLowerCase()
    .replace(/#+/g, "number")
    .replace(/\W+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function targetColumn(column: string): string {
  const normalizedColumn = normalizeHeader(column);

  return COLUMN_ALIASES[normalizedColumn] ?? normalizedColumn;
}

function stringifyValue(value: ImportValue): string {
  return value == null ? "" : String(value);
}

export function mapImportRow(row: ImportRow): Record<string, string> {
  return Object.entries(row).reduce<Record<string, string>>(
    (mapped, [column, value]) => {
      const target = targetColumn(column);
      const stringValue = stringifyValue(value).trim();

      mapped[target] =
        target === "plate_number" ? normalizePlate(stringValue) : stringValue;

      return mapped;
    },
    {},
  );
}

export function findDuplicatePlates(rows: ImportRow[]): string[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const mapped = mapImportRow(row);
    const plate = mapped.plate_number;

    if (plate) {
      counts.set(plate, (counts.get(plate) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([plate]) => plate)
    .sort();
}
