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
  id?: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  unit_number: string | null;
};

type VehicleRecord = {
  id: string;
  owner_id: string;
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  active: boolean;
  owners: OwnerRecord | OwnerRecord[] | null;
};

type IncidentVehicleRecord = {
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
};

type IncidentNotificationRecord = {
  delivery_status: string;
  created_at: string;
};

type IncidentRecord = {
  id: string;
  plate_number_snapshot: string;
  location: string | null;
  message: string | null;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
  vehicles?: IncidentVehicleRecord | IncidentVehicleRecord[] | null;
  notifications?: IncidentNotificationRecord[] | null;
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

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminVehicleDetail = {
  id: string;
  ownerId: string;
  plateNumber: string;
  colour: string;
  make: string;
  model: string;
  year: string;
  active: boolean;
  ownerName: string;
  unitNumber: string;
  phone: string;
  email: string;
};

export type AdminIncident = {
  id: string;
  plateNumber: string;
  vehicle: string;
  location: string;
  message: string;
  status: IncidentStatus;
  notificationStatus: string;
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

export type AdminImportHistory = {
  id: string;
  filename: string;
  status: string;
  totalRows: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsFailed: number;
  createdAt: string;
  confirmedAt: string | null;
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

function vehicleLabel(vehicle: {
  year: number | null;
  colour: string | null;
  make: string | null;
  model: string | null;
}) {
  return [vehicle.year, vehicle.colour, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
}

function firstIncidentVehicle(
  vehicle: IncidentRecord["vehicles"],
): IncidentVehicleRecord | null {
  if (Array.isArray(vehicle)) {
    return vehicle[0] ?? null;
  }

  return vehicle ?? null;
}

function latestNotificationStatus(notifications: IncidentRecord["notifications"]) {
  const latest = [...(notifications ?? [])].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  )[0];

  return latest?.delivery_status ?? "";
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

function mapVehicleDetail(vehicle: VehicleRecord): AdminVehicleDetail {
  const owner = firstOwner(vehicle.owners);

  return {
    id: vehicle.id,
    ownerId: vehicle.owner_id,
    plateNumber: vehicle.plate_number,
    colour: vehicle.colour ?? "",
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    year: vehicle.year ? String(vehicle.year) : "",
    active: vehicle.active,
    ownerName: owner?.name ?? "",
    unitNumber: owner?.unit_number ?? "",
    phone: owner?.phone ?? "",
    email: owner?.email ?? "",
  };
}

function mapIncident(incident: IncidentRecord): AdminIncident {
  const vehicle = firstIncidentVehicle(incident.vehicles);

  return {
    id: incident.id,
    plateNumber: incident.plate_number_snapshot,
    vehicle: vehicle ? vehicleLabel(vehicle) || "Unknown vehicle" : "Unknown vehicle",
    location: incident.location ?? "",
    message: incident.message ?? "",
    status: incident.status,
    notificationStatus: latestNotificationStatus(incident.notifications),
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

function uniqueVehiclesById(vehicleGroups: VehicleRecord[][]) {
  const vehiclesById = new Map<string, VehicleRecord>();

  for (const vehicles of vehicleGroups) {
    for (const vehicle of vehicles) {
      vehiclesById.set(vehicle.id, vehicle);
    }
  }

  return Array.from(vehiclesById.values()).sort((left, right) =>
    left.plate_number.localeCompare(right.plate_number),
  );
}

function paginateItems<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
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
    .select(
      "id, plate_number_snapshot, location, message, status, created_at, resolved_at, vehicles(year, colour, make, model), notifications(delivery_status, created_at)",
    )
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
  const vehicleSelect =
    "id, owner_id, plate_number, colour, make, model, year, active, owners(id, name, phone, email, unit_number)";

  if (!searchTerm) {
    const { data, error } = await supabase
      .from("vehicles")
      .select(vehicleSelect)
      .order("plate_number", { ascending: true })
      .limit(100);

    if (error) {
      throw new Error("Unable to load vehicles.");
    }

    return ((data ?? []) as VehicleRecord[]).map(mapVehicle);
  }

  const pattern = `%${searchTerm}%`;
  const [vehicleFieldResult, ownerResult] = await Promise.all([
    supabase
      .from("vehicles")
      .select(vehicleSelect)
      .or(
        `plate_number.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},colour.ilike.${pattern}`,
      )
      .order("plate_number", { ascending: true })
      .limit(100),
    supabase
      .from("owners")
      .select("id")
      .or(`name.ilike.${pattern},unit_number.ilike.${pattern}`)
      .limit(100),
  ]);

  if (vehicleFieldResult.error || ownerResult.error) {
    throw new Error("Unable to load vehicles.");
  }

  const ownerIds = ((ownerResult.data ?? []) as Array<{ id: string }>).map(
    (owner) => owner.id,
  );
  const ownerVehicleResult = ownerIds.length
    ? await supabase
        .from("vehicles")
        .select(vehicleSelect)
        .in("owner_id", ownerIds)
        .order("plate_number", { ascending: true })
        .limit(100)
    : { data: [], error: null };

  if (ownerVehicleResult.error) {
    throw new Error("Unable to load vehicles.");
  }

  return uniqueVehiclesById([
    (vehicleFieldResult.data ?? []) as VehicleRecord[],
    (ownerVehicleResult.data ?? []) as VehicleRecord[],
  ])
    .slice(0, 100)
    .map(mapVehicle);
}

export async function getAdminVehiclesPage({
  q,
  active,
  page = 1,
  pageSize = 25,
}: {
  q?: string;
  active?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminVehicle>> {
  const vehicles = await getAdminVehicles(q);
  const filteredVehicles =
    active === "active"
      ? vehicles.filter((vehicle) => vehicle.active)
      : active === "inactive"
        ? vehicles.filter((vehicle) => !vehicle.active)
        : vehicles;

  return paginateItems(filteredVehicles, page, pageSize);
}

export async function getAdminVehicleById(
  vehicleId: string,
): Promise<AdminVehicleDetail | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, owner_id, plate_number, colour, make, model, year, active, owners(id, name, phone, email, unit_number)",
    )
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load vehicle.");
  }

  if (!data) {
    return null;
  }

  return mapVehicleDetail(data as VehicleRecord);
}

export async function getAdminIncidents({
  status,
  plate,
  date,
  location,
}: {
  status?: string;
  plate?: string;
  date?: string;
  location?: string;
}): Promise<AdminIncident[]> {
  const supabase = createSupabaseAdminClient();
  const plateTerm = escapeSearchTerm(plate ?? "");
  const locationTerm = escapeSearchTerm(location ?? "");
  let query = supabase
    .from("incidents")
    .select(
      "id, plate_number_snapshot, location, message, status, created_at, resolved_at, vehicles(year, colour, make, model), notifications(delivery_status, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && INCIDENT_STATUSES.has(status as IncidentStatus)) {
    query = query.eq("status", status);
  }

  if (plateTerm) {
    query = query.ilike("plate_number_snapshot", `%${plateTerm}%`);
  }

  if (locationTerm) {
    query = query.ilike("location", `%${locationTerm}%`);
  }

  if (date) {
    const parsedDate = new Date(`${date}T00:00:00.000`);

    if (!Number.isNaN(parsedDate.getTime())) {
      const nextDate = new Date(parsedDate);
      nextDate.setDate(parsedDate.getDate() + 1);
      query = query
        .gte("created_at", parsedDate.toISOString())
        .lt("created_at", nextDate.toISOString());
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load incidents.");
  }

  return ((data ?? []) as IncidentRecord[]).map(mapIncident);
}

export async function getAdminIncidentsPage(params: {
  status?: string;
  plate?: string;
  date?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminIncident>> {
  const incidents = await getAdminIncidents(params);
  return paginateItems(incidents, params.page ?? 1, params.pageSize ?? 25);
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

export async function getAdminNotificationsPage({
  status,
  method,
  page = 1,
  pageSize = 25,
}: {
  status?: string;
  method?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminNotification>> {
  const notifications = await getAdminNotifications();
  const filtered = notifications.filter((notification) => {
    const statusMatches = status ? notification.status === status : true;
    const methodMatches = method ? notification.method === method : true;
    return statusMatches && methodMatches;
  });

  return paginateItems(filtered, page, pageSize);
}

export async function archiveDemoIncidents(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("incidents")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    })
    .ilike("location", "%smoke%")
    .in("status", ["pending", "notified", "failed"])
    .select("id");

  if (error) {
    throw new Error("Unable to archive demo incidents.");
  }

  return (data ?? []).length;
}

export async function getAdminImports(): Promise<AdminImportHistory[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("imports")
    .select(
      "id, filename, status, total_rows, rows_created, rows_updated, rows_failed, created_at, confirmed_at",
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error("Unable to load import history.");
  }

  return ((data ?? []) as Array<{
    id: string;
    filename: string;
    status: string;
    total_rows: number;
    rows_created: number;
    rows_updated: number;
    rows_failed: number;
    created_at: string;
    confirmed_at: string | null;
  }>).map((record) => ({
    id: record.id,
    filename: record.filename,
    status: record.status,
    totalRows: record.total_rows,
    rowsCreated: record.rows_created,
    rowsUpdated: record.rows_updated,
    rowsFailed: record.rows_failed,
    createdAt: record.created_at,
    confirmedAt: record.confirmed_at,
  }));
}
