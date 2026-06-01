export type IncidentStatus =
  | "pending"
  | "notified"
  | "resolved"
  | "failed"
  | "rate_limited"
  | "cancelled";

export type NotificationMethod = "simulated" | "sms" | "email";

export type NotificationStatus =
  | "simulated_sent"
  | "pending"
  | "sent"
  | "failed";

export type Owner = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  unit: string | null;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  plate: string;
  normalized_plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
