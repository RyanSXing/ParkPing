"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin/auth";
import {
  confirmVehicleImport,
  previewVehicleImportFile,
  type VehicleImportPreview,
} from "@/lib/admin/imports";

export type ImportActionState = {
  message: string;
  preview: VehicleImportPreview | null;
  confirmed: boolean;
};

const EMPTY_STATE: ImportActionState = {
  message: "",
  preview: null,
  confirmed: false,
};

export async function previewImportAction(
  previousState: ImportActionState = EMPTY_STATE,
  formData: FormData,
): Promise<ImportActionState> {
  void previousState;
  const user = await requireAdminUser();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.name) {
    return { message: "Choose a CSV or XLSX file.", preview: null, confirmed: false };
  }

  try {
    const preview = await previewVehicleImportFile({
      adminId: user.id,
      file,
    });

    revalidatePath("/admin/import");
    return { message: "", preview, confirmed: false };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to preview import.",
      preview: null,
      confirmed: false,
    };
  }
}

export async function confirmImportAction(
  previousState: ImportActionState = EMPTY_STATE,
  formData: FormData,
): Promise<ImportActionState> {
  void previousState;
  await requireAdminUser();
  const previewJson = String(formData.get("preview") ?? "");

  if (!previewJson) {
    return { message: "Preview the import before confirming.", preview: null, confirmed: false };
  }

  try {
    const preview = JSON.parse(previewJson) as VehicleImportPreview;
    await confirmVehicleImport(preview);
    revalidatePath("/admin/import");
    revalidatePath("/admin/vehicles");
    return { message: "Import confirmed.", preview: null, confirmed: true };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to confirm import.",
      preview: null,
      confirmed: false,
    };
  }
}
