import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { IncidentStatus } from "@/lib/supabase/types";
import { maskEmail, maskPhone } from "@/lib/validation/contact";

export { requireAdminUser } from "@/lib/admin/auth";

const OPEN_INCIDENT_STATUSES: IncidentStatus[] = ["pending", "notified"];
const INCIDENT_STATUSES = new Set<IncidentStatus>([
  "pending",
  "notified",
  "resolved",
  "failed",
  "rate_limited",
  "cancelled",
]);

type OwnerRecord = {
  name: string | null;
  phone: string | null;
  email: string | null;
  unit_number: string | null;
};

type VehicleRecord = {
  id: string;
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  active: boolean;
  owners: OwnerRecord | OwnerRecord[] | null;
};

type IncidentRecord = {
  id: string;
  plate_number_snapshot: string;
  location: string | null;
  message: string | null;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
};

type NotificationRecord = {
  id: string;
  incident_id: string;
  method: string;
  recipient_masked: string;
  delivery_status: string;
  simulated_message: string | null;
  resolve_link: string | null;
  sent_at: string | null;
  created_at: string;
};

export type AdminSummary = {
  activeVehicles: number;
  openIncidents: number;
  failedNotifications: number;
  pingsToday: number;
};

export type AdminVehicle = {
  id: string;
  plateNumber: string;
  vehicle: string;
  ownerName: string;
  unitNumber: string;
  phone: string;
  email: string;
  active: boolean;
};

export type AdminIncident = {
  id: string;
  plateNumber: string;
  location: string;
  message: string;
  status: IncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminNotification = {
  id: string;
  incidentId: string;
  method: string;
  recipient: string;
  status: string;
  message: string;
  resolveLink: string;
  sentAt: string | null;
  createdAt: string;
};

function firstOwner(owner: VehicleRecord["owners"]): OwnerRecord | null {
  if (Array.isArray(owner)) {
    return owner[0] ?? null;
  }

  return owner;
}

function countOrZero(count: number | null) {
  return count ?? 0;
}

function escapeSearchTerm(value: string) {
  return value.trim().replace(/[%_,()]/g, "");
}

function vehicleLabel(vehicle: VehicleRecord) {
  return [vehicle.year, vehicle.colour, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
}

function mapVehicle(vehicle: VehicleRecord): AdminVehicle {
  const owner = firstOwner(vehicle.owners);

  return {
    id: vehicle.id,
    plateNumber: vehicle.plate_number,
    vehicle: vehicleLabel(vehicle) || "Unknown vehicle",
    ownerName: owner?.name ?? "Unknown owner",
    unitNumber: owner?.unit_number ?? "",
    phone: maskPhone(owner?.phone),
    email: maskEmail(owner?.email),
    active: vehicle.active,
  };
}

function mapIncident(incident: IncidentRecord): AdminIncident {
  return {
    id: incident.id,
    plateNumber: incident.plate_number_snapshot,
    location: incident.location ?? "",
    message: incident.message ?? "",
    status: incident.status,
    createdAt: incident.created_at,
    resolvedAt: incident.resolved_at,
  };
}

function mapNotification(notification: NotificationRecord): AdminNotification {
  return {
    id: notification.id,
    incidentId: notification.incident_id,
    method: notification.method,
    recipient: notification.recipient_masked,
    status: notification.delivery_status,
    message: notification.simulated_message ?? "",
    resolveLink: notification.resolve_link ?? "",
    sentAt: notification.sent_at,
    createdAt: notification.created_at,
  };
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const supabase = createSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeVehiclesResult,
    openIncidentsResult,
    failedNotificationsResult,
    pingsTodayResult,
  ] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .in("status", OPEN_INCIDENT_STATUSES),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("delivery_status", "failed"),
      supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString()),
    ]);

  if (
    activeVehiclesResult.error ||
    openIncidentsResult.error ||
    failedNotificationsResult.error ||
    pingsTodayResult.error
  ) {
    throw new Error("Unable to load admin summary.");
  }

  return {
    activeVehicles: countOrZero(activeVehiclesResult.count),
    openIncidents: countOrZero(openIncidentsResult.count),
    failedNotifications: countOrZero(failedNotificationsResult.count),
    pingsToday: countOrZero(pingsTodayResult.count),
  };
}

export async function getRecentIncidents(limit = 8): Promise<AdminIncident[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id, plate_number_snapshot, location, message, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to load recent incidents.");
  }

  return ((data ?? []) as IncidentRecord[]).map(mapIncident);
}

export async function getAdminVehicles(q?: string): Promise<AdminVehicle[]> {
  const supabase = createSupabaseAdminClient();
  const searchTerm = escapeSearchTerm(q ?? "");
  let query = supabase
    .from("vehicles")
    .select(
      "id, plate_number, colour, make, model, year, active, owners(name, phone, email, unit_number)",
    )
    .order("plate_number", { ascending: true })
    .limit(100);

  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    query = query.or(
      `plate_number.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},colour.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load vehicles.");
  }

  return ((data ?? []) as VehicleRecord[]).map(mapVehicle);
}

export async function getAdminIncidents({
  status,
  plate,
}: {
  status?: string;
  plate?: string;
}): Promise<AdminIncident[]> {
  const supabase = createSupabaseAdminClient();
  const plateTerm = escapeSearchTerm(plate ?? "");
  let query = supabase
    .from("incidents")
    .select("id, plate_number_snapshot, location, message, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && INCIDENT_STATUSES.has(status as IncidentStatus)) {
    query = query.eq("status", status);
  }

  if (plateTerm) {
    query = query.ilike("plate_number_snapshot", `%${plateTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load incidents.");
  }

  return ((data ?? []) as IncidentRecord[]).map(mapIncident);
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, incident_id, method, recipient_masked, delivery_status, simulated_message, resolve_link, sent_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load notifications.");
  }

  return ((data ?? []) as NotificationRecord[]).map(mapNotification);
}
