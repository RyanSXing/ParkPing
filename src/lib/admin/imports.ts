import Papa from "papaparse";
import ExcelJS from "exceljs";
import { z } from "zod";

import { mapImportRow } from "@/lib/import/columns";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizePlate, plateSchema } from "@/lib/validation/plate";

type ImportValue = string | number | boolean | null | undefined;
export type RawImportRow = Record<string, ImportValue>;

export type ExistingImportVehicle = {
  id: string;
  ownerId: string;
  plateNumber: string;
};

export type ValidImportRow = {
  rowNumber: number;
  mode: "create" | "update";
  vehicleId: string | null;
  ownerId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  unitNumber: string | null;
  plateNumber: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  rawRow: RawImportRow;
};

export type ImportPreviewError = {
  rowNumber: number;
  field: string;
  message: string;
  rawRow: RawImportRow;
};

export type VehicleImportPreview = {
  importId?: string;
  filename?: string;
  totalRows: number;
  rowsToCreate: number;
  rowsToUpdate: number;
  invalidRows: number;
  duplicateRows: number;
  validRows: ValidImportRow[];
  errors: ImportPreviewError[];
};

const emailSchema = z.string().email();

function text(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function parseYear(value: string | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  const year = Number(trimmed);
  return Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : Number.NaN;
}

function duplicatePlateCounts(rows: RawImportRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const plate = mapImportRow(row).plate_number;

    if (plate) {
      counts.set(plate, (counts.get(plate) ?? 0) + 1);
    }
  }

  return counts;
}

export function buildVehicleImportPreview(
  rows: RawImportRow[],
  existingVehicles: ExistingImportVehicle[],
): VehicleImportPreview {
  const existingByPlate = new Map(
    existingVehicles.map((vehicle) => [normalizePlate(vehicle.plateNumber), vehicle]),
  );
  const plateCounts = duplicatePlateCounts(rows);
  const validRows: ValidImportRow[] = [];
  const errors: ImportPreviewError[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 1;
    const mapped = mapImportRow(rawRow);
    const rowErrors: ImportPreviewError[] = [];
    const name = text(mapped.name);
    const phone = text(mapped.phone);
    const email = text(mapped.email);
    const plateResult = plateSchema.safeParse(mapped.plate_number ?? "");
    const year = parseYear(mapped.year);

    if (!name) {
      rowErrors.push({
        rowNumber,
        field: "name",
        message: "Owner name is required.",
        rawRow,
      });
    }

    if (!phone && !email) {
      rowErrors.push({
        rowNumber,
        field: "contact",
        message: "Add a phone number or email.",
        rawRow,
      });
    }

    if (email && !emailSchema.safeParse(email).success) {
      rowErrors.push({
        rowNumber,
        field: "email",
        message: "Enter a valid email address.",
        rawRow,
      });
    }

    if (!plateResult.success) {
      rowErrors.push({
        rowNumber,
        field: "plate_number",
        message: "Plate number is required.",
        rawRow,
      });
    }

    if (Number.isNaN(year)) {
      rowErrors.push({
        rowNumber,
        field: "year",
        message: "Enter a valid vehicle year.",
        rawRow,
      });
    }

    const plateNumber = plateResult.success ? plateResult.data : "";

    if (plateNumber && (plateCounts.get(plateNumber) ?? 0) > 1) {
      rowErrors.push({
        rowNumber,
        field: "plate_number",
        message: "Duplicate plate in import file.",
        rawRow,
      });
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    const existingVehicle = existingByPlate.get(plateNumber) ?? null;
    validRows.push({
      rowNumber,
      mode: existingVehicle ? "update" : "create",
      vehicleId: existingVehicle?.id ?? null,
      ownerId: existingVehicle?.ownerId ?? null,
      name: name as string,
      phone,
      email,
      unitNumber: text(mapped.unit_number),
      plateNumber,
      colour: text(mapped.colour),
      make: text(mapped.make),
      model: text(mapped.model),
      year,
      rawRow,
    });
  });

  return {
    totalRows: rows.length,
    rowsToCreate: validRows.filter((row) => row.mode === "create").length,
    rowsToUpdate: validRows.filter((row) => row.mode === "update").length,
    invalidRows: rows.length - validRows.length,
    duplicateRows: errors.filter((error) => error.message === "Duplicate plate in import file.")
      .length,
    validRows,
    errors,
  };
}

export async function parseVehicleImportFile(file: File): Promise<RawImportRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const buffer = await file.arrayBuffer();

  if (extension === "csv") {
    const textValue = new TextDecoder().decode(buffer);
    const result = Papa.parse<RawImportRow>(textValue, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length) {
      throw new Error(result.errors[0]?.message ?? "Unable to parse CSV file.");
    }

    return result.data;
  }

  if (extension === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return [];
    }

    const headerRow = sheet.getRow(1);
    const headers = headerRow.values as Array<string | number | undefined>;
    const rows: RawImportRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const rawRow: RawImportRow = {};
      let hasValue = false;

      headers.forEach((header, index) => {
        if (!header || index === 0) {
          return;
        }

        const value = row.getCell(index).value;
        const normalizedValue =
          value && typeof value === "object" && "text" in value
            ? String(value.text)
            : value == null
              ? ""
              : String(value);

        if (normalizedValue) {
          hasValue = true;
        }

        rawRow[String(header)] = normalizedValue;
      });

      if (hasValue) {
        rows.push(rawRow);
      }
    });

    return rows;
  }

  throw new Error("Upload a CSV or XLSX file.");
}

async function loadExistingVehiclesByPlate(plates: string[]) {
  if (!plates.length) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, owner_id, plate_number")
    .in("plate_number", Array.from(new Set(plates)));

  if (error) {
    throw new Error("Unable to load existing vehicles.");
  }

  return ((data ?? []) as Array<{
    id: string;
    owner_id: string;
    plate_number: string;
  }>).map((vehicle) => ({
    id: vehicle.id,
    ownerId: vehicle.owner_id,
    plateNumber: vehicle.plate_number,
  }));
}

export async function previewVehicleImportFile({
  adminId,
  file,
}: {
  adminId: string;
  file: File;
}): Promise<VehicleImportPreview> {
  const rows = await parseVehicleImportFile(file);
  const plates = rows.map((row) => mapImportRow(row).plate_number).filter(Boolean);
  const existingVehicles = await loadExistingVehiclesByPlate(plates);
  const preview = buildVehicleImportPreview(rows, existingVehicles);
  const supabase = createSupabaseAdminClient();
  const importInsert = await supabase
    .from("imports")
    .insert({
      admin_id: adminId,
      filename: file.name,
      status: "previewed",
      total_rows: preview.totalRows,
      rows_created: preview.rowsToCreate,
      rows_updated: preview.rowsToUpdate,
      rows_failed: preview.invalidRows,
    })
    .select("id")
    .single();

  if (importInsert.error || !importInsert.data) {
    throw new Error("Unable to save import preview.");
  }

  const importId = (importInsert.data as { id: string }).id;

  if (preview.errors.length) {
    const { error } = await supabase.from("import_errors").insert(
      preview.errors.map((previewError) => ({
        import_id: importId,
        row_number: previewError.rowNumber,
        field: previewError.field,
        error_message: previewError.message,
        raw_row: previewError.rawRow,
      })),
    );

    if (error) {
      throw new Error("Unable to save import errors.");
    }
  }

  return { ...preview, importId, filename: file.name };
}

export async function confirmVehicleImport(preview: VehicleImportPreview) {
  if (!preview.importId) {
    throw new Error("Missing import preview.");
  }

  const supabase = createSupabaseAdminClient();

  for (const row of preview.validRows) {
    if (row.mode === "update" && row.vehicleId && row.ownerId) {
      const ownerUpdate = await supabase
        .from("owners")
        .update({
          name: row.name,
          phone: row.phone,
          email: row.email,
          unit_number: row.unitNumber,
        })
        .eq("id", row.ownerId);

      if (ownerUpdate.error) {
        throw new Error(`Unable to update owner on row ${row.rowNumber}.`);
      }

      const vehicleUpdate = await supabase
        .from("vehicles")
        .update({
          plate_number: row.plateNumber,
          colour: row.colour,
          make: row.make,
          model: row.model,
          year: row.year,
          active: true,
        })
        .eq("id", row.vehicleId);

      if (vehicleUpdate.error) {
        throw new Error(`Unable to update vehicle on row ${row.rowNumber}.`);
      }
    } else {
      const ownerInsert = await supabase
        .from("owners")
        .insert({
          name: row.name,
          phone: row.phone,
          email: row.email,
          unit_number: row.unitNumber,
        })
        .select("id")
        .single();

      if (ownerInsert.error || !ownerInsert.data) {
        throw new Error(`Unable to create owner on row ${row.rowNumber}.`);
      }

      const ownerId = (ownerInsert.data as { id: string }).id;
      const vehicleInsert = await supabase.from("vehicles").insert({
        owner_id: ownerId,
        plate_number: row.plateNumber,
        colour: row.colour,
        make: row.make,
        model: row.model,
        year: row.year,
        active: true,
      });

      if (vehicleInsert.error) {
        throw new Error(`Unable to create vehicle on row ${row.rowNumber}.`);
      }
    }
  }

  const importUpdate = await supabase
    .from("imports")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      rows_created: preview.rowsToCreate,
      rows_updated: preview.rowsToUpdate,
      rows_failed: preview.invalidRows,
    })
    .eq("id", preview.importId);

  if (importUpdate.error) {
    throw new Error("Unable to confirm import.");
  }

  return {
    success: true,
    rowsCreated: preview.rowsToCreate,
    rowsUpdated: preview.rowsToUpdate,
  };
}
