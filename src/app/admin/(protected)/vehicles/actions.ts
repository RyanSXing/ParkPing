"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/admin/auth";
import {
  createAdminVehicleRecord,
  setAdminVehicleActive,
  updateAdminVehicleRecord,
  type AdminVehicleFormInput,
} from "@/lib/admin/vehicles";

export type VehicleFormState = {
  message: string;
};

const EMPTY_STATE: VehicleFormState = {
  message: "",
};

function inputFromFormData(formData: FormData): AdminVehicleFormInput {
  return {
    ownerName: String(formData.get("ownerName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    unitNumber: String(formData.get("unitNumber") ?? ""),
    plateNumber: String(formData.get("plateNumber") ?? ""),
    colour: String(formData.get("colour") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    year: String(formData.get("year") ?? ""),
  };
}

export async function createVehicleAction(
  previousState: VehicleFormState = EMPTY_STATE,
  formData: FormData,
): Promise<VehicleFormState> {
  void previousState;
  await requireAdminUser();

  const result = await createAdminVehicleRecord(inputFromFormData(formData));

  if (!result.success) {
    return { message: result.message };
  }

  revalidatePath("/admin/vehicles");
  redirect("/admin/vehicles");
}

export async function updateVehicleAction(
  vehicleId: string,
  previousState: VehicleFormState = EMPTY_STATE,
  formData: FormData,
): Promise<VehicleFormState> {
  void previousState;
  await requireAdminUser();

  const result = await updateAdminVehicleRecord(vehicleId, inputFromFormData(formData));

  if (!result.success) {
    return { message: result.message };
  }

  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
  redirect("/admin/vehicles");
}

export async function toggleVehicleActiveAction(vehicleId: string, active: boolean) {
  await requireAdminUser();

  await setAdminVehicleActive(vehicleId, active);
  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${vehicleId}/edit`);
}
