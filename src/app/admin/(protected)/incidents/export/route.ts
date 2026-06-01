import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { getAdminIncidents } from "@/lib/admin/queries";

export async function GET(request: Request) {
  await requireAdminUser();
  const url = new URL(request.url);
  const incidents = await getAdminIncidents({
    status: url.searchParams.get("status") ?? "",
    plate: url.searchParams.get("plate") ?? "",
    date: url.searchParams.get("date") ?? "",
    location: url.searchParams.get("location") ?? "",
  });
  const csv = toCsv(
    [
      "plate",
      "vehicle",
      "location",
      "message",
      "status",
      "notification_status",
      "created_at",
      "resolved_at",
    ],
    incidents.map((incident) => [
      incident.plateNumber,
      incident.vehicle,
      incident.location,
      incident.message,
      incident.status,
      incident.notificationStatus,
      incident.createdAt,
      incident.resolvedAt,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="parkping-incidents.csv"',
    },
  });
}
