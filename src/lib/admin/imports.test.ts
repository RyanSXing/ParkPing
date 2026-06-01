import { describe, expect, it, vi } from "vitest";
import { buildVehicleImportPreview } from "./imports";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const existingVehicles = [
  {
    id: "vehicle-1",
    ownerId: "owner-1",
    plateNumber: "PARK101",
  },
];

describe("admin vehicle imports", () => {
  it("previews creates, updates, invalid rows, and duplicate plates", () => {
    const preview = buildVehicleImportPreview(
      [
        {
          name: "Existing Owner",
          phone: "416-555-0101",
          plate_number: "park 101",
          make: "Honda",
        },
        {
          owner_name: "New Owner",
          email: "new@example.com",
          plate: "new-222",
          model: "Civic",
        },
        {
          owner_name: "",
          email: "missing@example.com",
          plate: "bad-333",
        },
        {
          owner_name: "Dup One",
          email: "dup1@example.com",
          plate: "dup 444",
        },
        {
          owner_name: "Dup Two",
          email: "dup2@example.com",
          plate: "dup-444",
        },
      ],
      existingVehicles,
    );

    expect(preview.totalRows).toBe(5);
    expect(preview.rowsToUpdate).toBe(1);
    expect(preview.rowsToCreate).toBe(1);
    expect(preview.invalidRows).toBe(3);
    expect(preview.duplicateRows).toBe(2);
    expect(preview.validRows.map((row) => row.plateNumber)).toEqual([
      "PARK101",
      "NEW222",
    ]);
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 3,
          field: "name",
          message: "Owner name is required.",
        }),
        expect.objectContaining({
          rowNumber: 4,
          field: "plate_number",
          message: "Duplicate plate in import file.",
        }),
      ]),
    );
  });

  it("rejects rows without phone and email", () => {
    const preview = buildVehicleImportPreview(
      [
        {
          owner_name: "No Contact",
          plate: "NC123",
        },
      ],
      [],
    );

    expect(preview.validRows).toEqual([]);
    expect(preview.errors).toEqual([
      expect.objectContaining({
        rowNumber: 1,
        field: "contact",
        message: "Add a phone number or email.",
      }),
    ]);
  });
});
