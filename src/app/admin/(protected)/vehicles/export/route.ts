import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { getAdminVehicles } from "@/lib/admin/queries";

export async function GET() {
  await requireAdminUser();
  const vehicles = await getAdminVehicles();
  const csv = toCsv(
    ["plate", "vehicle", "owner", "unit", "phone", "email", "active"],
    vehicles.map((vehicle) => [
      vehicle.plateNumber,
      vehicle.vehicle,
      vehicle.ownerName,
      vehicle.unitNumber,
      vehicle.phone,
      vehicle.email,
      vehicle.active ? "active" : "inactive",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="parkping-vehicles.csv"',
    },
  });
}
