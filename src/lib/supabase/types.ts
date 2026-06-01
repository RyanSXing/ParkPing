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
  name: string;
  phone: string | null;
  email: string | null;
  unit_number: string | null;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Incident = {
  id: string;
  vehicle_id: string | null;
  plate_number_snapshot: string;
  location: string | null;
  message: string | null;
  status: IncidentStatus;
  resolve_token: string | null;
  resolve_token_expires_at: string | null;
  requester_hash: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type Notification = {
  id: string;
  incident_id: string;
  method: NotificationMethod;
  recipient_masked: string;
  delivery_status: NotificationStatus;
  simulated_message: string | null;
  resolve_link: string | null;
  provider_message_id: string | null;
  provider_response: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
};

export type Import = {
  id: string;
  admin_id: string | null;
  filename: string;
  status: "previewed" | "confirmed" | "failed";
  total_rows: number;
  rows_created: number;
  rows_updated: number;
  rows_failed: number;
  created_at: string;
  confirmed_at: string | null;
};

export type ImportError = {
  id: string;
  import_id: string | null;
  row_number: number | null;
  field: string | null;
  error_message: string;
  raw_row: Record<string, unknown> | null;
  created_at: string;
};
