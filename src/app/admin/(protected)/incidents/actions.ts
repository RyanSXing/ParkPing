"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin/auth";
import { archiveDemoIncidents } from "@/lib/admin/queries";

export async function archiveDemoIncidentsAction() {
  await requireAdminUser();
  await archiveDemoIncidents();
  revalidatePath("/admin/incidents");
  revalidatePath("/admin");
}
