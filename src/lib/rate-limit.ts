import type { IncidentStatus } from "./supabase/types";

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

const OPEN_INCIDENT_STATUSES = new Set<IncidentStatus>(["pending", "notified"]);

export type IncidentLike = {
  created_at: string;
  status: IncidentStatus;
  plate_number_snapshot?: string | null;
  requester_hash?: string | null;
};

export type PingLimitReason =
  | "plate_hour_limit"
  | "duplicate_open_incident"
  | "requester_day_limit";

export type PingLimitResult =
  | { allowed: true }
  | { allowed: false; reason: PingLimitReason };

export type EvaluatePingLimitsInput = {
  now?: Date;
  plateNumber: string;
  requesterHash?: string | null;
  incidents: IncidentLike[];
};

function normalizePlate(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? "";
}

function isWithinWindow(createdAt: string, now: Date, windowMs: number): boolean {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return false;
  }

  const elapsed = now.getTime() - createdTime;
  return elapsed >= 0 && elapsed < windowMs;
}

export function evaluatePingLimits({
  now = new Date(),
  plateNumber,
  requesterHash,
  incidents,
}: EvaluatePingLimitsInput): PingLimitResult {
  const normalizedPlate = normalizePlate(plateNumber);
  const plateIncidents = incidents.filter(
    (incident) => normalizePlate(incident.plate_number_snapshot) === normalizedPlate,
  );

  const platePingsWithinHour = plateIncidents.filter((incident) =>
    isWithinWindow(incident.created_at, now, HOUR_IN_MS),
  );

  if (platePingsWithinHour.length >= 3) {
    return { allowed: false, reason: "plate_hour_limit" };
  }

  const duplicateOpenIncident = plateIncidents.some(
    (incident) =>
      OPEN_INCIDENT_STATUSES.has(incident.status) &&
      isWithinWindow(incident.created_at, now, FIVE_MINUTES_IN_MS),
  );

  if (duplicateOpenIncident) {
    return { allowed: false, reason: "duplicate_open_incident" };
  }

  if (requesterHash) {
    const requesterIncidentsWithinDay = incidents.filter(
      (incident) =>
        incident.requester_hash === requesterHash &&
        isWithinWindow(incident.created_at, now, DAY_IN_MS),
    );

    if (requesterIncidentsWithinDay.length >= 5) {
      return { allowed: false, reason: "requester_day_limit" };
    }
  }

  return { allowed: true };
}
