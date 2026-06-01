create extension if not exists pgcrypto;

create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  unit_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  plate_number text not null unique,
  colour text,
  make text,
  model text,
  year integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  plate_number_snapshot text not null,
  location text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'notified', 'resolved', 'failed', 'rate_limited', 'cancelled')),
  resolve_token text unique,
  resolve_token_expires_at timestamptz,
  requester_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  method text not null
    check (method in ('simulated', 'sms', 'email')),
  recipient_masked text not null,
  delivery_status text not null default 'pending'
    check (delivery_status in ('simulated_sent', 'pending', 'sent', 'failed')),
  simulated_message text,
  resolve_link text,
  provider_message_id text,
  provider_response jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  filename text not null,
  status text not null default 'previewed'
    check (status in ('previewed', 'confirmed', 'failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  rows_created integer not null default 0 check (rows_created >= 0),
  rows_updated integer not null default 0 check (rows_updated >= 0),
  rows_failed integer not null default 0 check (rows_failed >= 0),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references imports(id) on delete set null,
  row_number integer check (row_number is null or row_number > 0),
  field text,
  error_message text not null,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_plate_active_idx
  on vehicles (plate_number, active);

create index if not exists incidents_plate_created_idx
  on incidents (plate_number_snapshot, created_at desc);

create index if not exists incidents_requester_created_idx
  on incidents (requester_hash, created_at desc);

create index if not exists notifications_incident_idx
  on notifications (incident_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists owners_set_updated_at on owners;
create trigger owners_set_updated_at
  before update on owners
  for each row
  execute function set_updated_at();

drop trigger if exists vehicles_set_updated_at on vehicles;
create trigger vehicles_set_updated_at
  before update on vehicles
  for each row
  execute function set_updated_at();

alter table owners enable row level security;
alter table vehicles enable row level security;
alter table incidents enable row level security;
alter table notifications enable row level security;
alter table imports enable row level security;
alter table import_errors enable row level security;
