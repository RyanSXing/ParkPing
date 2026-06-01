import { describe, expect, it } from "vitest";

import { findDuplicatePlates, mapImportRow } from "./columns";

describe("import column helpers", () => {
  it("maps known CSV aliases to resident vehicle fields", () => {
    expect(
      mapImportRow({
        owner_name: "Avery Chen",
        unit: "1201",
        license_plate: "park 101",
        color: "Blue",
      }),
    ).toEqual({
      name: "Avery Chen",
      unit_number: "1201",
      plate_number: "PARK101",
      colour: "Blue",
    });
  });

  it("finds duplicate plates after normalization", () => {
    expect(
      findDuplicatePlates([{ plate_number: "ABC 123" }, { plate: "ABC-123" }]),
    ).toEqual(["ABC123"]);
  });
});
