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

  it("normalizes common human-readable CSV headers before alias matching", () => {
    expect(
      mapImportRow({
        Color: "Green",
        "License Plate": "park 202",
        "Owner Name": "Jordan Lee",
        "Unit #": "1402",
      }),
    ).toEqual({
      colour: "Green",
      name: "Jordan Lee",
      plate_number: "PARK202",
      unit_number: "1402",
    });
  });

  it("maps workbook split names and American car color spelling", () => {
    expect(
      mapImportRow({
        first_name: "James",
        last_name: "Thornton",
        car_color: "Red",
        car_make: "Toyota",
        car_model: "Camry",
        plate_number: "abcd 123",
      }),
    ).toEqual({
      first_name: "James",
      last_name: "Thornton",
      name: "James Thornton",
      colour: "Red",
      make: "Toyota",
      model: "Camry",
      plate_number: "ABCD123",
    });
  });

  it("keeps an explicit name when split name columns are also present", () => {
    expect(
      mapImportRow({
        name: "Building Override",
        first_name: "James",
        last_name: "Thornton",
        plate_number: "ABCD123",
      }),
    ).toEqual({
      name: "Building Override",
      first_name: "James",
      last_name: "Thornton",
      plate_number: "ABCD123",
    });
  });

  it("finds duplicate plates after normalization", () => {
    expect(
      findDuplicatePlates([{ plate_number: "ABC 123" }, { plate: "ABC-123" }]),
    ).toEqual(["ABC123"]);
  });

  it("finds duplicate plates from normalized header aliases", () => {
    expect(
      findDuplicatePlates([
        { "License Plate": "ABC 123" },
        { "license plate": "ABC-123" },
      ]),
    ).toEqual(["ABC123"]);
  });
});
