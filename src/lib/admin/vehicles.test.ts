import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminVehicleRecord,
  setAdminVehicleActive,
  updateAdminVehicleRecord,
} from "./vehicles";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

type TableName = "owners" | "vehicles";

type OwnerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  unit_number: string | null;
};

type VehicleRow = {
  id: string;
  owner_id: string;
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  active: boolean;
};

function createSupabaseWriteMock({
  owners = [],
  vehicles = [],
}: {
  owners?: OwnerRow[];
  vehicles?: VehicleRow[];
} = {}) {
  const state = {
    owners: [...owners],
    vehicles: [...vehicles],
    ownerInsertPayloads: [] as unknown[],
    vehicleInsertPayloads: [] as unknown[],
    ownerUpdatePayloads: [] as unknown[],
    vehicleUpdatePayloads: [] as unknown[],
  };

  let ownerIdCounter = owners.length + 1;
  let vehicleIdCounter = vehicles.length + 1;

  function tableRows(table: TableName) {
    return table === "owners" ? state.owners : state.vehicles;
  }

  function createQuery(table: TableName, rows: Array<OwnerRow | VehicleRow>) {
    const filters: Array<{ column: string; value: unknown; negate?: boolean }> = [];
    let singleMode: "single" | "maybeSingle" | null = null;
    let limitCount: number | null = null;

    const applyFilters = () => {
      let result = [...rows];

      for (const filter of filters) {
        result = result.filter((row) => {
          const matches = row[filter.column as keyof typeof row] === filter.value;
          return filter.negate ? !matches : matches;
        });
      }

      if (limitCount !== null) {
        result = result.slice(0, limitCount);
      }

      return result;
    };

    const query = {
      select: vi.fn((columns?: string) => {
        void columns;
        return query;
      }),
      eq: vi.fn((column: string, value: unknown) => {
        filters.push({ column, value });
        return query;
      }),
      neq: vi.fn((column: string, value: unknown) => {
        filters.push({ column, value, negate: true });
        return query;
      }),
      limit: vi.fn((count: number) => {
        limitCount = count;
        return query;
      }),
      single: vi.fn(() => {
        singleMode = "single";
        return Promise.resolve({ data: applyFilters()[0] ?? null, error: null });
      }),
      maybeSingle: vi.fn(() => {
        singleMode = "maybeSingle";
        return Promise.resolve({ data: applyFilters()[0] ?? null, error: null });
      }),
      then: (
        resolve: (value: { data: Array<OwnerRow | VehicleRow>; error: null }) => void,
      ) => {
        if (!singleMode) {
          resolve({ data: applyFilters(), error: null });
        }
      },
    };

    return query;
  }

  function createInsertQuery(table: TableName, payload: Record<string, unknown>) {
    const inserted =
      table === "owners"
        ? ({
            id: `owner-created-${ownerIdCounter++}`,
            name: payload.name,
            phone: payload.phone ?? null,
            email: payload.email ?? null,
            unit_number: payload.unit_number ?? null,
          } as OwnerRow)
        : ({
            id: `vehicle-created-${vehicleIdCounter++}`,
            owner_id: payload.owner_id,
            plate_number: payload.plate_number,
            colour: payload.colour ?? null,
            make: payload.make ?? null,
            model: payload.model ?? null,
            year: payload.year ?? null,
            active: payload.active ?? true,
          } as VehicleRow);

    tableRows(table).push(inserted as never);

    if (table === "owners") {
      state.ownerInsertPayloads.push(payload);
    } else {
      state.vehicleInsertPayloads.push(payload);
    }

    const query = {
      select: vi.fn(() => query),
      single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
    };

    return query;
  }

  function createUpdateQuery(table: TableName, payload: Record<string, unknown>) {
    const filters: Array<{ column: string; value: unknown }> = [];
    const query = {
      eq: vi.fn((column: string, value: unknown) => {
        filters.push({ column, value });
        for (const row of tableRows(table)) {
          if (filters.every((filter) => row[filter.column as keyof typeof row] === filter.value)) {
            Object.assign(row, payload);
          }
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    if (table === "owners") {
      state.ownerUpdatePayloads.push(payload);
    } else {
      state.vehicleUpdatePayloads.push(payload);
    }

    return query;
  }

  return {
    client: {
      from: vi.fn((table: TableName) => ({
        select: (columns?: string) => createQuery(table, tableRows(table)).select(columns),
        insert: (payload: Record<string, unknown>) => createInsertQuery(table, payload),
        update: (payload: Record<string, unknown>) => createUpdateQuery(table, payload),
      })),
    },
    state,
  };
}

describe("admin vehicle write helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an owner and vehicle with a normalized plate", async () => {
    const { client, state } = createSupabaseWriteMock();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const result = await createAdminVehicleRecord({
      ownerName: "Mira Patel",
      phone: "416-555-0199",
      email: "",
      unitNumber: "1204",
      plateNumber: "abc-123",
      colour: "Blue",
      make: "Honda",
      model: "Civic",
      year: "2021",
    });

    expect(result).toEqual({ success: true, vehicleId: "vehicle-created-1" });
    expect(state.ownerInsertPayloads[0]).toMatchObject({
      name: "Mira Patel",
      phone: "416-555-0199",
      email: null,
      unit_number: "1204",
    });
    expect(state.vehicleInsertPayloads[0]).toMatchObject({
      owner_id: "owner-created-1",
      plate_number: "ABC123",
      colour: "Blue",
      make: "Honda",
      model: "Civic",
      year: 2021,
      active: true,
    });
  });

  it("rejects create requests without owner name or contact method", async () => {
    const { client } = createSupabaseWriteMock();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    await expect(
      createAdminVehicleRecord({
        ownerName: "",
        phone: "",
        email: "",
        unitNumber: "1204",
        plateNumber: "ABC123",
      }),
    ).resolves.toEqual({
      success: false,
      message: "Owner name is required.",
    });

    await expect(
      createAdminVehicleRecord({
        ownerName: "Mira Patel",
        phone: "",
        email: "",
        unitNumber: "1204",
        plateNumber: "ABC123",
      }),
    ).resolves.toEqual({
      success: false,
      message: "Add a phone number or email for the owner.",
    });
  });

  it("rejects duplicate normalized plates on create", async () => {
    const { client } = createSupabaseWriteMock({
      vehicles: [
        {
          id: "vehicle-existing",
          owner_id: "owner-existing",
          plate_number: "ABC123",
          colour: null,
          make: null,
          model: null,
          year: null,
          active: false,
        },
      ],
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const result = await createAdminVehicleRecord({
      ownerName: "Mira Patel",
      phone: "416-555-0199",
      plateNumber: "abc 123",
    });

    expect(result).toEqual({
      success: false,
      message: "A vehicle with this plate already exists.",
    });
  });

  it("updates owner and vehicle fields while allowing the same vehicle plate", async () => {
    const { client, state } = createSupabaseWriteMock({
      owners: [
        {
          id: "owner-1",
          name: "Old Owner",
          phone: null,
          email: "old@example.com",
          unit_number: "1",
        },
      ],
      vehicles: [
        {
          id: "vehicle-1",
          owner_id: "owner-1",
          plate_number: "ABC123",
          colour: "Red",
          make: "Toyota",
          model: "Corolla",
          year: 2018,
          active: true,
        },
      ],
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const result = await updateAdminVehicleRecord("vehicle-1", {
      ownerName: "New Owner",
      phone: "416-555-0101",
      email: "",
      unitNumber: "909",
      plateNumber: "abc-123",
      colour: "Black",
      make: "Tesla",
      model: "Model 3",
      year: "2024",
    });

    expect(result).toEqual({ success: true, vehicleId: "vehicle-1" });
    expect(state.owners[0]).toMatchObject({
      name: "New Owner",
      phone: "416-555-0101",
      email: null,
      unit_number: "909",
    });
    expect(state.vehicles[0]).toMatchObject({
      plate_number: "ABC123",
      colour: "Black",
      make: "Tesla",
      model: "Model 3",
      year: 2024,
    });
  });

  it("rejects duplicate plates owned by another vehicle on update", async () => {
    const { client } = createSupabaseWriteMock({
      owners: [{ id: "owner-1", name: "Owner", phone: "416", email: null, unit_number: null }],
      vehicles: [
        {
          id: "vehicle-1",
          owner_id: "owner-1",
          plate_number: "ABC123",
          colour: null,
          make: null,
          model: null,
          year: null,
          active: true,
        },
        {
          id: "vehicle-2",
          owner_id: "owner-2",
          plate_number: "XYZ999",
          colour: null,
          make: null,
          model: null,
          year: null,
          active: true,
        },
      ],
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    const result = await updateAdminVehicleRecord("vehicle-1", {
      ownerName: "Owner",
      phone: "416",
      plateNumber: "xyz-999",
    });

    expect(result).toEqual({
      success: false,
      message: "A vehicle with this plate already exists.",
    });
  });

  it("deactivates and reactivates vehicles", async () => {
    const { client, state } = createSupabaseWriteMock({
      vehicles: [
        {
          id: "vehicle-1",
          owner_id: "owner-1",
          plate_number: "ABC123",
          colour: null,
          make: null,
          model: null,
          year: null,
          active: true,
        },
      ],
    });
    vi.mocked(createSupabaseAdminClient).mockReturnValue(client as never);

    await expect(setAdminVehicleActive("vehicle-1", false)).resolves.toEqual({
      success: true,
      vehicleId: "vehicle-1",
    });
    expect(state.vehicles[0].active).toBe(false);

    await expect(setAdminVehicleActive("vehicle-1", true)).resolves.toEqual({
      success: true,
      vehicleId: "vehicle-1",
    });
    expect(state.vehicles[0].active).toBe(true);
  });
});
