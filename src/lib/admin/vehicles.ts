import "server-only";

import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { normalizePlate, plateSchema } from "@/lib/validation/plate";

export type AdminVehicleFormInput = {
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  unitNumber?: string | null;
  plateNumber?: string | null;
  colour?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
};

export type AdminVehicleMutationResult =
  | {
      success: true;
      vehicleId: string;
    }
  | {
      success: false;
      message: string;
    };

type ExistingVehicle = {
  id: string;
  owner_id: string;
};

const emailSchema = z.string().email();

function optionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function parseYear(value: AdminVehicleFormInput["year"]) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericYear = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numericYear) || numericYear < 1900 || numericYear > 2100) {
    return Number.NaN;
  }

  return numericYear;
}

function validateVehicleInput(input: AdminVehicleFormInput):
  | {
      success: true;
      data: {
        ownerName: string;
        phone: string | null;
        email: string | null;
        unitNumber: string | null;
        plateNumber: string;
        colour: string | null;
        make: string | null;
        model: string | null;
        year: number | null;
      };
    }
  | { success: false; message: string } {
  const ownerName = optionalText(input.ownerName);

  if (!ownerName) {
    return { success: false, message: "Owner name is required." };
  }

  const phone = optionalText(input.phone);
  const email = optionalText(input.email);

  if (!phone && !email) {
    return {
      success: false,
      message: "Add a phone number or email for the owner.",
    };
  }

  if (email && !emailSchema.safeParse(email).success) {
    return { success: false, message: "Enter a valid owner email address." };
  }

  const plateResult = plateSchema.safeParse(input.plateNumber ?? "");

  if (!plateResult.success) {
    return { success: false, message: "Plate number is required." };
  }

  const year = parseYear(input.year);

  if (Number.isNaN(year)) {
    return { success: false, message: "Enter a valid vehicle year." };
  }

  return {
    success: true,
    data: {
      ownerName,
      phone,
      email,
      unitNumber: optionalText(input.unitNumber),
      plateNumber: plateResult.data,
      colour: optionalText(input.colour),
      make: optionalText(input.make),
      model: optionalText(input.model),
      year,
    },
  };
}

async function findVehicleByPlate(plateNumber: string, excludeVehicleId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("vehicles")
    .select("id")
    .eq("plate_number", normalizePlate(plateNumber))
    .limit(1);

  if (excludeVehicleId) {
    query = query.neq("id", excludeVehicleId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Unable to check vehicle plate.");
  }

  return data as { id: string } | null;
}

export async function createAdminVehicleRecord(
  input: AdminVehicleFormInput,
): Promise<AdminVehicleMutationResult> {
  const parsed = validateVehicleInput(input);

  if (!parsed.success) {
    return parsed;
  }

  const existingVehicle = await findVehicleByPlate(parsed.data.plateNumber);

  if (existingVehicle) {
    return {
      success: false,
      message: "A vehicle with this plate already exists.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const ownerInsert = await supabase
    .from("owners")
    .insert({
      name: parsed.data.ownerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      unit_number: parsed.data.unitNumber,
    })
    .select("id")
    .single();

  if (ownerInsert.error || !ownerInsert.data) {
    throw new Error("Unable to create owner.");
  }

  const owner = ownerInsert.data as { id: string };
  const vehicleInsert = await supabase
    .from("vehicles")
    .insert({
      owner_id: owner.id,
      plate_number: parsed.data.plateNumber,
      colour: parsed.data.colour,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      active: true,
    })
    .select("id")
    .single();

  if (vehicleInsert.error || !vehicleInsert.data) {
    throw new Error("Unable to create vehicle.");
  }

  return {
    success: true,
    vehicleId: (vehicleInsert.data as { id: string }).id,
  };
}

export async function updateAdminVehicleRecord(
  vehicleId: string,
  input: AdminVehicleFormInput,
): Promise<AdminVehicleMutationResult> {
  const parsed = validateVehicleInput(input);

  if (!parsed.success) {
    return parsed;
  }

  const supabase = createSupabaseAdminClient();
  const vehicleResult = await supabase
    .from("vehicles")
    .select("id, owner_id")
    .eq("id", vehicleId)
    .maybeSingle();

  if (vehicleResult.error) {
    throw new Error("Unable to load vehicle.");
  }

  if (!vehicleResult.data) {
    return { success: false, message: "Vehicle not found." };
  }

  const existingVehicle = await findVehicleByPlate(parsed.data.plateNumber, vehicleId);

  if (existingVehicle) {
    return {
      success: false,
      message: "A vehicle with this plate already exists.",
    };
  }

  const vehicle = vehicleResult.data as ExistingVehicle;
  const ownerUpdate = await supabase
    .from("owners")
    .update({
      name: parsed.data.ownerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      unit_number: parsed.data.unitNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicle.owner_id);

  if (ownerUpdate.error) {
    throw new Error("Unable to update owner.");
  }

  const vehicleUpdate = await supabase
    .from("vehicles")
    .update({
      plate_number: parsed.data.plateNumber,
      colour: parsed.data.colour,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId);

  if (vehicleUpdate.error) {
    throw new Error("Unable to update vehicle.");
  }

  return { success: true, vehicleId };
}

export async function setAdminVehicleActive(
  vehicleId: string,
  active: boolean,
): Promise<AdminVehicleMutationResult> {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("vehicles")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId);

  if (result.error) {
    throw new Error("Unable to update vehicle status.");
  }

  return { success: true, vehicleId };
}
