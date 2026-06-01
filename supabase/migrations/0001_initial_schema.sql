create extension if not exists pgcrypto;

create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text not null,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  plate text not null,
  normalized_plate text not null unique,
  make text,
  model text,
  color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  plate text not null,
  normalized_plate text not null,
  requester_hash text not null,
  requester_contact text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'notified', 'resolved', 'failed', 'rate_limited', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  method text not null
    check (method in ('simulated', 'sms', 'email')),
  status text not null default 'pending'
    check (status in ('simulated_sent', 'pending', 'sent', 'failed')),
  recipient text not null,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  status text not null default 'previewed'
    check (status in ('previewed', 'confirmed', 'failed')),
  row_count integer not null default 0 check (row_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  field text,
  message text not null,
  raw_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_plate_active_idx
  on vehicles (normalized_plate, active);

create index if not exists incidents_plate_created_idx
  on incidents (normalized_plate, created_at desc);

create index if not exists incidents_requester_created_idx
  on incidents (requester_hash, created_at desc);

create index if not exists notifications_incident_idx
  on notifications (incident_id);
