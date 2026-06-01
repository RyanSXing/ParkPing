# ParkPing Resident-First MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the resident-first ParkPing MVP slice: anonymous plate ping, simulated notification, resolve token flow, protected admin read views, seed data, privacy tests, and documentation.

**Architecture:** Scaffold a Next.js App Router app and keep sensitive behavior in server-only modules under `src/lib`. Public routes call server APIs that never return private owner fields. Admin routes use Supabase Auth and server-side data access, while the first slice keeps vehicle CRUD and CSV/Excel import write flows out of scope but preserves schema compatibility.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, Supabase, Zod, Vitest, Testing Library, PapaParse, xlsx, Lucide React.

---

## File Structure

Create or modify these files:

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js config.
- `tsconfig.json`: TypeScript config and path aliases.
- `postcss.config.mjs`: Tailwind PostCSS config.
- `eslint.config.mjs`: lint config.
- `vitest.config.ts`: Vitest config.
- `src/test/setup.ts`: test setup.
- `src/app/globals.css`: design tokens and Tailwind base styles.
- `src/app/layout.tsx`: root HTML shell.
- `src/app/page.tsx`: public landing page.
- `src/app/ping/page.tsx`: resident ping UI.
- `src/app/ping/ping-form.tsx`: client form behavior.
- `src/app/resolve/[token]/page.tsx`: owner resolve page.
- `src/app/resolve/[token]/resolve-button.tsx`: client resolve action button.
- `src/app/admin/login/page.tsx`: admin login UI.
- `src/app/admin/layout.tsx`: protected admin shell.
- `src/app/admin/page.tsx`: admin dashboard.
- `src/app/admin/vehicles/page.tsx`: vehicles table.
- `src/app/admin/incidents/page.tsx`: incidents table.
- `src/app/admin/notifications/page.tsx`: notification table.
- `src/app/api/ping/route.ts`: public ping API.
- `src/app/api/resolve/route.ts`: public resolve API.
- `src/app/api/admin/login/route.ts`: admin login endpoint.
- `src/app/api/admin/logout/route.ts`: admin logout endpoint.
- `src/lib/env.ts`: environment validation.
- `src/lib/supabase/server.ts`: Supabase server clients.
- `src/lib/supabase/types.ts`: database row types used by the app.
- `src/lib/validation/plate.ts`: plate normalization and validation.
- `src/lib/validation/contact.ts`: phone/email validation and masking.
- `src/lib/validation/message.ts`: message sanitizing and blocked-word logic.
- `src/lib/import/columns.ts`: import column mapping and duplicate detection foundations.
- `src/lib/security/requester.ts`: requester hashing.
- `src/lib/rate-limit.ts`: rate-limit and duplicate suppression logic.
- `src/lib/notifications/simulated.ts`: simulated notification service.
- `src/lib/incidents.ts`: incident creation and resolve helpers.
- `src/lib/admin/queries.ts`: admin query helpers.
- `src/components/ui/badge.tsx`: status badge.
- `src/components/ui/button.tsx`: button primitive.
- `src/components/ui/card.tsx`: card primitive.
- `src/components/ui/input.tsx`: input primitive.
- `src/components/ui/table.tsx`: table primitive.
- `src/components/admin/admin-nav.tsx`: admin navigation.
- `supabase/migrations/0001_initial_schema.sql`: database schema.
- `supabase/seed.sql`: mock owner/vehicle data.
- `.env.example`: required and optional environment variables.
- `README.md`: setup, privacy model, simulated mode, tests, and admin workflow.
- `src/lib/**/*.test.ts`: focused unit tests.
- `src/app/api/**/*.test.ts`: route-level tests with mocked Supabase helpers.

---

### Task 1: Scaffold The Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Modify: `README.md`

- [ ] **Step 1: Scaffold the app in the existing directory**

Run:

```bash
npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Next.js files are created in `/Users/rsxing/ParkPing` without replacing committed design files.

- [ ] **Step 2: Install MVP dependencies**

Run:

```bash
npm install @supabase/ssr @supabase/supabase-js zod papaparse xlsx lucide-react clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: dependencies are added to `package.json` and `package-lock.json`.

- [ ] **Step 3: Add test scripts**

Modify `package.json` scripts to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

If the scaffold uses ESLint flat config without `next lint`, set `"lint": "eslint ."` instead and keep the rest unchanged.

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Set base design tokens**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --background: #f0f9ff;
  --foreground: #0f172a;
  --primary: #2563eb;
  --secondary: #059669;
  --accent: #dc2626;
  --muted: #f1f5fd;
  --border: #e4ecfc;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {
  min-height: 100%;
  margin: 0;
  background: var(--background);
  color: var(--foreground);
}

a,
button {
  cursor: pointer;
}

:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}
```

- [ ] **Step 6: Verify scaffold**

Run:

```bash
npm run typecheck
npm test
```

Expected: typecheck passes, test runner reports no tests or passes the generated setup.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs vitest.config.ts src README.md
git commit -m "chore: scaffold parkping app"
```

---

### Task 2: Add Database Schema, Environment, And Supabase Helpers

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/server.ts`

- [ ] **Step 1: Create schema migration**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
create extension if not exists "pgcrypto";

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
  status text not null default 'pending' check (status in ('pending', 'notified', 'resolved', 'failed', 'rate_limited', 'cancelled')),
  resolve_token text unique,
  resolve_token_expires_at timestamptz,
  requester_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  method text not null check (method in ('simulated', 'sms', 'email')),
  recipient_masked text,
  delivery_status text not null check (delivery_status in ('simulated_sent', 'pending', 'sent', 'failed')),
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
  status text not null check (status in ('previewed', 'confirmed', 'failed')),
  total_rows integer not null default 0,
  rows_created integer not null default 0,
  rows_updated integer not null default 0,
  rows_failed integer not null default 0,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists import_errors (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references imports(id) on delete cascade,
  row_number integer,
  field text,
  error_message text,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_plate_active_idx on vehicles (plate_number, active);
create index if not exists incidents_plate_created_idx on incidents (plate_number_snapshot, created_at desc);
create index if not exists incidents_requester_created_idx on incidents (requester_hash, created_at desc);
create index if not exists notifications_incident_idx on notifications (incident_id);
```

- [ ] **Step 2: Create seed data**

Create `supabase/seed.sql` with 10 mock owners and vehicles. Use normalized plates:

```sql
insert into owners (id, name, phone, email, unit_number) values
  ('00000000-0000-4000-8000-000000000001', 'Avery Chen', '+14165550101', 'avery.chen@example.com', '1201'),
  ('00000000-0000-4000-8000-000000000002', 'Morgan Patel', '+14165550102', 'morgan.patel@example.com', '808'),
  ('00000000-0000-4000-8000-000000000003', 'Jordan Lee', '+14165550103', 'jordan.lee@example.com', '602'),
  ('00000000-0000-4000-8000-000000000004', 'Taylor Brooks', '+14165550104', 'taylor.brooks@example.com', '314'),
  ('00000000-0000-4000-8000-000000000005', 'Sam Rivera', '+14165550105', 'sam.rivera@example.com', '1907'),
  ('00000000-0000-4000-8000-000000000006', 'Casey Nguyen', '+14165550106', 'casey.nguyen@example.com', '411'),
  ('00000000-0000-4000-8000-000000000007', 'Riley Singh', '+14165550107', 'riley.singh@example.com', '1510'),
  ('00000000-0000-4000-8000-000000000008', 'Jamie Ortiz', '+14165550108', 'jamie.ortiz@example.com', '905'),
  ('00000000-0000-4000-8000-000000000009', 'Quinn Martin', '+14165550109', 'quinn.martin@example.com', '2210'),
  ('00000000-0000-4000-8000-000000000010', 'Drew Wilson', '+14165550110', 'drew.wilson@example.com', '707')
on conflict (id) do nothing;

insert into vehicles (owner_id, plate_number, colour, make, model, year, active) values
  ('00000000-0000-4000-8000-000000000001', 'PARK101', 'Blue', 'Honda', 'Civic', 2021, true),
  ('00000000-0000-4000-8000-000000000002', 'PING202', 'White', 'Toyota', 'Corolla', 2020, true),
  ('00000000-0000-4000-8000-000000000003', 'GARAGE3', 'Black', 'Tesla', 'Model 3', 2022, true),
  ('00000000-0000-4000-8000-000000000004', 'LEVEL44', 'Silver', 'Hyundai', 'Elantra', 2019, true),
  ('00000000-0000-4000-8000-000000000005', 'TANDEM5', 'Red', 'Mazda', 'CX-5', 2023, true),
  ('00000000-0000-4000-8000-000000000006', 'SPOT606', 'Grey', 'Subaru', 'Outback', 2018, true),
  ('00000000-0000-4000-8000-000000000007', 'BLOCK7', 'Green', 'Kia', 'Soul', 2021, true),
  ('00000000-0000-4000-8000-000000000008', 'MOVE808', 'Blue', 'Ford', 'Escape', 2020, true),
  ('00000000-0000-4000-8000-000000000009', 'BAY909', 'White', 'Volkswagen', 'Golf', 2017, true),
  ('00000000-0000-4000-8000-000000000010', 'UNIT10', 'Black', 'Nissan', 'Rogue', 2022, true)
on conflict (plate_number) do nothing;
```

- [ ] **Step 3: Create environment example**

Create `.env.example`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NOTIFICATION_MODE=simulated
APP_BASE_URL=http://localhost:3000
REQUESTER_HASH_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=
FROM_EMAIL=
```

- [ ] **Step 4: Add environment validation**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NOTIFICATION_MODE: z.enum(["simulated", "sms", "email"]).default("simulated"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  REQUESTER_HASH_SECRET: z.string().default("parkping-dev-secret"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NOTIFICATION_MODE: process.env.NOTIFICATION_MODE,
  APP_BASE_URL: process.env.APP_BASE_URL,
  REQUESTER_HASH_SECRET: process.env.REQUESTER_HASH_SECRET,
});

export function hasSupabaseAdminEnv() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
```

- [ ] **Step 5: Add Supabase types and clients**

Create `src/lib/supabase/types.ts` with table row types used by the app:

```ts
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

export type IncidentStatus = "pending" | "notified" | "resolved" | "failed" | "rate_limited" | "cancelled";
export type NotificationStatus = "simulated_sent" | "pending" | "sent" | "failed";
export type NotificationMethod = "simulated" | "sms" | "email";
```

Create `src/lib/supabase/server.ts`:

```ts
import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

export function createSupabaseAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin environment variables are not configured.");
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

- [ ] **Step 6: Verify types**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add .env.example supabase src/lib/env.ts src/lib/supabase package.json package-lock.json
git commit -m "feat: add schema and supabase helpers"
```

---

### Task 3: Build Validation, Masking, Import Mapping, And Requester Hashing With TDD

**Files:**
- Create: `src/lib/validation/plate.test.ts`
- Create: `src/lib/validation/plate.ts`
- Create: `src/lib/validation/contact.test.ts`
- Create: `src/lib/validation/contact.ts`
- Create: `src/lib/validation/message.test.ts`
- Create: `src/lib/validation/message.ts`
- Create: `src/lib/import/columns.test.ts`
- Create: `src/lib/import/columns.ts`
- Create: `src/lib/security/requester.test.ts`
- Create: `src/lib/security/requester.ts`

- [ ] **Step 1: Write failing plate tests**

Create `src/lib/validation/plate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizePlate, plateSchema } from "./plate";

describe("normalizePlate", () => {
  it("uppercases plates and removes spaces and dashes", () => {
    expect(normalizePlate(" abc-d 123 ")).toBe("ABCD123");
  });

  it("rejects empty normalized plates", () => {
    expect(() => plateSchema.parse(" --- ")).toThrow();
  });
});
```

- [ ] **Step 2: Run plate tests and verify RED**

Run:

```bash
npm test -- src/lib/validation/plate.test.ts
```

Expected: FAIL because `src/lib/validation/plate.ts` does not exist.

- [ ] **Step 3: Implement plate utilities**

Create `src/lib/validation/plate.ts`:

```ts
import { z } from "zod";

export function normalizePlate(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export const plateSchema = z
  .string()
  .transform(normalizePlate)
  .pipe(z.string().min(1, "Plate number is required").max(16, "Plate number is too long"));
```

- [ ] **Step 4: Verify plate tests pass**

Run:

```bash
npm test -- src/lib/validation/plate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing contact tests**

Create `src/lib/validation/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { maskEmail, maskPhone, normalizeNorthAmericanPhone } from "./contact";

describe("contact helpers", () => {
  it("masks phone numbers to the last four digits", () => {
    expect(maskPhone("+14165550123")).toBe("(***) ***-0123");
  });

  it("masks email local parts", () => {
    expect(maskEmail("resident@example.com")).toBe("r***@example.com");
  });

  it("normalizes North American phone numbers to E.164", () => {
    expect(normalizeNorthAmericanPhone("(416) 555-0123")).toBe("+14165550123");
  });
});
```

- [ ] **Step 6: Run contact tests and verify RED**

Run:

```bash
npm test -- src/lib/validation/contact.test.ts
```

Expected: FAIL because `src/lib/validation/contact.ts` does not exist.

- [ ] **Step 7: Implement contact helpers**

Create `src/lib/validation/contact.ts`:

```ts
export function normalizeNorthAmericanPhone(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return value.trim();
}

export function maskPhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  const lastFour = digits.slice(-4).padStart(4, "*");
  return `(***) ***-${lastFour}`;
}

export function maskEmail(value: string | null | undefined) {
  if (!value || !value.includes("@")) return "";
  const [local, domain] = value.split("@");
  const first = local.at(0) ?? "*";
  return `${first}***@${domain}`;
}
```

- [ ] **Step 8: Verify contact tests pass**

Run:

```bash
npm test -- src/lib/validation/contact.test.ts
```

Expected: PASS.

- [ ] **Step 9: Write failing message tests**

Create `src/lib/validation/message.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { messageSchema, sanitizeMessage } from "./message";

describe("message validation", () => {
  it("strips html tags", () => {
    expect(sanitizeMessage("<b>Please move</b>")).toBe("Please move");
  });

  it("rejects blocked threatening words", () => {
    expect(() => messageSchema.parse("I will kill your car")).toThrow("Please keep the message respectful.");
  });

  it("limits messages to 200 characters", () => {
    expect(() => messageSchema.parse("a".repeat(201))).toThrow();
  });
});
```

- [ ] **Step 10: Run message tests and verify RED**

Run:

```bash
npm test -- src/lib/validation/message.test.ts
```

Expected: FAIL because `src/lib/validation/message.ts` does not exist.

- [ ] **Step 11: Implement message helpers**

Create `src/lib/validation/message.ts`:

```ts
import { z } from "zod";

const blockedWords = ["kill", "hurt", "threat", "revenge"];

export function sanitizeMessage(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

export const messageSchema = z
  .string()
  .max(200, "Message must be 200 characters or less.")
  .transform(sanitizeMessage)
  .refine(
    (value) => !blockedWords.some((word) => value.toLowerCase().includes(word)),
    "Please keep the message respectful.",
  )
  .optional()
  .or(z.literal(""));
```

- [ ] **Step 12: Write failing import column tests**

Create `src/lib/import/columns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findDuplicatePlates, mapImportRow } from "./columns";

describe("import column helpers", () => {
  it("maps common column aliases", () => {
    expect(
      mapImportRow({
        owner_name: "Avery Chen",
        unit: "1201",
        license_plate: "park 101",
        color: "Blue",
      }),
    ).toMatchObject({
      name: "Avery Chen",
      unit_number: "1201",
      plate_number: "PARK101",
      colour: "Blue",
    });
  });

  it("finds duplicate normalized plates", () => {
    expect(findDuplicatePlates([{ plate_number: "ABC 123" }, { plate: "ABC-123" }])).toEqual(["ABC123"]);
  });
});
```

- [ ] **Step 13: Run import tests and verify RED**

Run:

```bash
npm test -- src/lib/import/columns.test.ts
```

Expected: FAIL because `src/lib/import/columns.ts` does not exist.

- [ ] **Step 14: Implement import column helpers**

Create `src/lib/import/columns.ts`:

```ts
import { normalizePlate } from "@/lib/validation/plate";

type RawRow = Record<string, unknown>;

const aliases: Record<string, string> = {
  owner_name: "name",
  full_name: "name",
  unit: "unit_number",
  plate: "plate_number",
  license_plate: "plate_number",
  car_colour: "colour",
  color: "colour",
  car_make: "make",
  car_model: "model",
  vehicle_year: "year",
};

export function mapImportRow(row: RawRow) {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const canonicalKey = aliases[key] ?? key;
    mapped[canonicalKey] = String(value ?? "").trim();
  }
  if (mapped.plate_number) mapped.plate_number = normalizePlate(mapped.plate_number);
  return mapped;
}

export function findDuplicatePlates(rows: RawRow[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    const mapped = mapImportRow(row);
    const plate = mapped.plate_number;
    if (!plate) continue;
    if (seen.has(plate)) duplicates.add(plate);
    seen.add(plate);
  }

  return Array.from(duplicates).sort();
}
```

- [ ] **Step 15: Write failing requester hash tests**

Create `src/lib/security/requester.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequesterHash } from "./requester";

describe("createRequesterHash", () => {
  it("returns a stable hash without exposing the raw ip or user agent", async () => {
    const first = await createRequesterHash("192.0.2.1", "Vitest Browser", "secret");
    const second = await createRequesterHash("192.0.2.1", "Vitest Browser", "secret");

    expect(first).toBe(second);
    expect(first).not.toContain("192.0.2.1");
    expect(first).not.toContain("Vitest");
  });
});
```

- [ ] **Step 16: Run requester test and verify RED**

Run:

```bash
npm test -- src/lib/security/requester.test.ts
```

Expected: FAIL because `src/lib/security/requester.ts` does not exist.

- [ ] **Step 17: Implement requester hashing**

Create `src/lib/security/requester.ts`:

```ts
import { createHash } from "node:crypto";

export async function createRequesterHash(ip: string, userAgent: string, secret: string) {
  return createHash("sha256").update(`${secret}:${ip}:${userAgent}`).digest("hex");
}

export function getRequesterSignals(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const ip = forwardedFor || realIp || "unknown";
  const userAgent = headers.get("user-agent") ?? "unknown";
  return { ip, userAgent };
}
```

- [ ] **Step 18: Verify all utility tests pass**

Run:

```bash
npm test -- src/lib/validation src/lib/import src/lib/security
npm run typecheck
```

Expected: PASS.

- [ ] **Step 19: Commit**

Run:

```bash
git add src/lib/validation src/lib/import src/lib/security
git commit -m "feat: add validation and privacy utilities"
```

---

### Task 4: Build Incident, Rate Limit, And Simulated Notification Services With TDD

**Files:**
- Create: `src/lib/rate-limit.test.ts`
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/notifications/simulated.test.ts`
- Create: `src/lib/notifications/simulated.ts`
- Create: `src/lib/incidents.test.ts`
- Create: `src/lib/incidents.ts`

- [ ] **Step 1: Write failing rate-limit tests**

Create `src/lib/rate-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { evaluatePingLimits } from "./rate-limit";

const now = new Date("2026-06-01T12:00:00.000Z");

describe("evaluatePingLimits", () => {
  it("blocks when the same plate has three pings within an hour", () => {
    const result = evaluatePingLimits({
      now,
      plateIncidents: [
        { created_at: "2026-06-01T11:30:00.000Z", status: "resolved" },
        { created_at: "2026-06-01T11:40:00.000Z", status: "resolved" },
        { created_at: "2026-06-01T11:50:00.000Z", status: "resolved" },
      ],
      requesterIncidents: [],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("plate_hour_limit");
  });

  it("blocks duplicate open pings within five minutes", () => {
    const result = evaluatePingLimits({
      now,
      plateIncidents: [{ created_at: "2026-06-01T11:57:00.000Z", status: "notified" }],
      requesterIncidents: [],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("duplicate_open_incident");
  });
});
```

- [ ] **Step 2: Run rate-limit tests and verify RED**

Run:

```bash
npm test -- src/lib/rate-limit.test.ts
```

Expected: FAIL because `src/lib/rate-limit.ts` does not exist.

- [ ] **Step 3: Implement rate-limit evaluation**

Create `src/lib/rate-limit.ts`:

```ts
import type { IncidentStatus } from "@/lib/supabase/types";

type IncidentLike = {
  created_at: string;
  status: IncidentStatus;
};

type LimitInput = {
  now: Date;
  plateIncidents: IncidentLike[];
  requesterIncidents: IncidentLike[];
};

const openStatuses: IncidentStatus[] = ["pending", "notified"];

export type PingLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "plate_hour_limit" | "requester_day_limit" | "duplicate_open_incident" };

export function evaluatePingLimits({ now, plateIncidents, requesterIncidents }: LimitInput): PingLimitResult {
  const nowMs = now.getTime();
  const oneHourAgo = nowMs - 60 * 60 * 1000;
  const oneDayAgo = nowMs - 24 * 60 * 60 * 1000;
  const fiveMinutesAgo = nowMs - 5 * 60 * 1000;

  const plateLastHour = plateIncidents.filter((incident) => Date.parse(incident.created_at) >= oneHourAgo);
  if (plateLastHour.length >= 3) return { allowed: false, reason: "plate_hour_limit" };

  const requesterLastDay = requesterIncidents.filter((incident) => Date.parse(incident.created_at) >= oneDayAgo);
  if (requesterLastDay.length >= 5) return { allowed: false, reason: "requester_day_limit" };

  const duplicateOpen = plateIncidents.some(
    (incident) => openStatuses.includes(incident.status) && Date.parse(incident.created_at) >= fiveMinutesAgo,
  );
  if (duplicateOpen) return { allowed: false, reason: "duplicate_open_incident" };

  return { allowed: true };
}
```

- [ ] **Step 4: Write failing simulated notification tests**

Create `src/lib/notifications/simulated.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { sendSimulatedParkingAlert } from "./simulated";

describe("sendSimulatedParkingAlert", () => {
  it("stores a simulated notification with masked recipient and resolve link", async () => {
    const insert = vi.fn().mockReturnValue({ select: () => ({ single: () => ({ data: { id: "notification-1" }, error: null }) }) });
    const supabase = { from: vi.fn(() => ({ insert })) };

    const result = await sendSimulatedParkingAlert({
      supabase,
      incidentId: "incident-1",
      resolveToken: "token-1",
      owner: { phone: "+14165550123", email: "resident@example.com" },
      vehicle: { plate_number: "PARK101", colour: "Blue", make: "Honda", model: "Civic" },
      location: "",
      appBaseUrl: "http://localhost:3000",
    });

    expect(result.id).toBe("notification-1");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "simulated",
        delivery_status: "simulated_sent",
        recipient_masked: "(***) ***-0123",
        resolve_link: "http://localhost:3000/resolve/token-1",
      }),
    );
  });
});
```

- [ ] **Step 5: Run notification tests and verify RED**

Run:

```bash
npm test -- src/lib/notifications/simulated.test.ts
```

Expected: FAIL because `src/lib/notifications/simulated.ts` does not exist.

- [ ] **Step 6: Implement simulated notification service**

Create `src/lib/notifications/simulated.ts`:

```ts
import { maskEmail, maskPhone } from "@/lib/validation/contact";

type SupabaseInsertClient = {
  from: (table: "notifications") => {
    insert: (values: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
  };
};

type SendInput = {
  supabase: SupabaseInsertClient;
  incidentId: string;
  resolveToken: string;
  owner: { phone: string | null; email: string | null };
  vehicle: { plate_number: string; colour: string | null; make: string | null; model: string | null };
  location: string | null;
  appBaseUrl: string;
};

export async function sendSimulatedParkingAlert(input: SendInput) {
  const vehicleLabel = [input.vehicle.colour, input.vehicle.make, input.vehicle.model].filter(Boolean).join(" ");
  const location = input.location?.trim() || "in the shared parking area";
  const resolveLink = `${input.appBaseUrl}/resolve/${input.resolveToken}`;
  const recipientMasked = input.owner.phone ? maskPhone(input.owner.phone) : maskEmail(input.owner.email);

  const simulatedMessage = `Parking alert: Your vehicle ${vehicleLabel}, plate ${input.vehicle.plate_number}, may be blocking another resident near ${location}. Please move it when possible. Resolve: ${resolveLink}`;

  const { data, error } = await input.supabase
    .from("notifications")
    .insert({
      incident_id: input.incidentId,
      method: "simulated",
      recipient_masked: recipientMasked,
      delivery_status: "simulated_sent",
      simulated_message: simulatedMessage,
      resolve_link: resolveLink,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Notification was not created.");
  return data;
}
```

- [ ] **Step 7: Write failing resolve token tests**

Create `src/lib/incidents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createResolveToken, isResolveTokenExpired } from "./incidents";

describe("incident helpers", () => {
  it("creates a URL-safe resolve token", () => {
    expect(createResolveToken()).toMatch(/^[A-Za-z0-9_-]{32,}$/);
  });

  it("detects expired resolve tokens", () => {
    expect(isResolveTokenExpired("2026-06-01T11:59:00.000Z", new Date("2026-06-01T12:00:00.000Z"))).toBe(true);
  });
});
```

- [ ] **Step 8: Run incident tests and verify RED**

Run:

```bash
npm test -- src/lib/incidents.test.ts
```

Expected: FAIL because `src/lib/incidents.ts` does not exist.

- [ ] **Step 9: Implement incident helpers**

Create `src/lib/incidents.ts`:

```ts
import { randomBytes } from "node:crypto";

export function createResolveToken() {
  return randomBytes(32).toString("base64url");
}

export function createResolveExpiry(now = new Date()) {
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function isResolveTokenExpired(expiresAt: string | null, now = new Date()) {
  if (!expiresAt) return true;
  return Date.parse(expiresAt) <= now.getTime();
}
```

- [ ] **Step 10: Verify service tests pass**

Run:

```bash
npm test -- src/lib/rate-limit.test.ts src/lib/notifications/simulated.test.ts src/lib/incidents.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 11: Commit**

Run:

```bash
git add src/lib/rate-limit* src/lib/notifications src/lib/incidents*
git commit -m "feat: add ping service foundations"
```

---

### Task 5: Build Public Ping API With Privacy Tests

**Files:**
- Create: `src/app/api/ping/route.test.ts`
- Create: `src/app/api/ping/route.ts`
- Modify: `src/lib/incidents.ts`

- [ ] **Step 1: Write failing API privacy test**

Create `src/app/api/ping/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () =>
              table === "vehicles"
                ? {
                    data: {
                      id: "vehicle-1",
                      plate_number: "PARK101",
                      colour: "Blue",
                      make: "Honda",
                      model: "Civic",
                      owners: { name: "Private Owner", phone: "+14165550123", email: "owner@example.com", unit_number: "1201" },
                    },
                    error: null,
                  }
                : { data: null, error: null },
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: "incident-1", resolve_token: "token-1" }, error: null }),
        }),
      }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));

describe("POST /api/ping", () => {
  it("does not return private owner information", async () => {
    const response = await POST(
      new Request("http://localhost/api/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plateNumber: "park 101", location: "P1" }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain("Private Owner");
    expect(JSON.stringify(body)).not.toContain("owner@example.com");
    expect(JSON.stringify(body)).not.toContain("1201");
  });
});
```

- [ ] **Step 2: Run API test and verify RED**

Run:

```bash
npm test -- src/app/api/ping/route.test.ts
```

Expected: FAIL because `src/app/api/ping/route.ts` does not exist.

- [ ] **Step 3: Implement ping API**

Create `src/app/api/ping/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { createResolveExpiry, createResolveToken } from "@/lib/incidents";
import { sendSimulatedParkingAlert } from "@/lib/notifications/simulated";
import { evaluatePingLimits } from "@/lib/rate-limit";
import { createRequesterHash, getRequesterSignals } from "@/lib/security/requester";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validation/message";
import { plateSchema } from "@/lib/validation/plate";

const pingSchema = z.object({
  plateNumber: plateSchema,
  location: z.string().trim().max(120).optional().or(z.literal("")),
  message: messageSchema,
});

const duplicateMessage = "That vehicle was recently pinged. Please wait before sending another alert.";

export async function POST(request: Request) {
  const parsed = pingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Please check the form and try again." }, { status: 400 });
  }

  const { plateNumber, location, message } = parsed.data;
  const { ip, userAgent } = getRequesterSignals(request.headers);
  const requesterHash = await createRequesterHash(ip, userAgent, env.REQUESTER_HASH_SECRET);
  const supabase = createSupabaseAdminClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, plate_number, colour, make, model, owners(name, phone, email, unit_number)")
    .eq("plate_number", plateNumber)
    .eq("active", true)
    .maybeSingle();

  if (vehicleError) return NextResponse.json({ success: false, message: "Unable to create ping right now." }, { status: 500 });
  if (!vehicle) {
    return NextResponse.json(
      { success: false, message: "No matching vehicle found. Please check the plate number or contact building management." },
      { status: 404 },
    );
  }

  const sinceDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: plateIncidents } = await supabase
    .from("incidents")
    .select("created_at, status")
    .eq("plate_number_snapshot", plateNumber)
    .gte("created_at", sinceDay);
  const { data: requesterIncidents } = await supabase
    .from("incidents")
    .select("created_at, status")
    .eq("requester_hash", requesterHash)
    .gte("created_at", sinceDay);

  const limit = evaluatePingLimits({
    now: new Date(),
    plateIncidents: plateIncidents ?? [],
    requesterIncidents: requesterIncidents ?? [],
  });

  if (!limit.allowed) {
    return NextResponse.json({ success: false, message: duplicateMessage }, { status: 429 });
  }

  const resolveToken = createResolveToken();
  const { data: incident, error: incidentError } = await supabase
    .from("incidents")
    .insert({
      vehicle_id: vehicle.id,
      plate_number_snapshot: plateNumber,
      location: location || null,
      message: message || null,
      status: "pending",
      resolve_token: resolveToken,
      resolve_token_expires_at: createResolveExpiry(),
      requester_hash: requesterHash,
    })
    .select()
    .single();

  if (incidentError || !incident) {
    return NextResponse.json({ success: false, message: "Unable to create ping right now." }, { status: 500 });
  }

  await sendSimulatedParkingAlert({
    supabase,
    incidentId: incident.id,
    resolveToken,
    owner: vehicle.owners,
    vehicle,
    location: location || null,
    appBaseUrl: env.APP_BASE_URL,
  });

  await supabase.from("incidents").update({ status: "notified" }).eq("id", incident.id);

  return NextResponse.json({
    success: true,
    incidentId: incident.id,
    message: "Ping created. The vehicle owner would be notified by the system.",
  });
}
```

- [ ] **Step 4: Verify ping API test passes**

Run:

```bash
npm test -- src/app/api/ping/route.test.ts
npm run typecheck
```

Expected: PASS. If Supabase mock shapes need adjustment, change the test mock without weakening the privacy assertion.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app/api/ping src/lib/incidents.ts
git commit -m "feat: add privacy-safe ping api"
```

---

### Task 6: Build Resolve API And Owner Resolve Page

**Files:**
- Create: `src/app/api/resolve/route.test.ts`
- Create: `src/app/api/resolve/route.ts`
- Create: `src/app/resolve/[token]/page.tsx`
- Create: `src/app/resolve/[token]/resolve-button.tsx`

- [ ] **Step 1: Write failing resolve API tests**

Create `src/app/api/resolve/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: "incident-1", status: "notified", resolve_token_expires_at: "2026-06-02T00:00:00.000Z" },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

describe("POST /api/resolve", () => {
  it("marks a valid incident as resolved", async () => {
    const response = await POST(
      new Request("http://localhost/api/resolve", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });
});
```

- [ ] **Step 2: Run resolve API tests and verify RED**

Run:

```bash
npm test -- src/app/api/resolve/route.test.ts
```

Expected: FAIL because `src/app/api/resolve/route.ts` does not exist.

- [ ] **Step 3: Implement resolve API**

Create `src/app/api/resolve/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { isResolveTokenExpired } from "@/lib/incidents";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const resolveSchema = z.object({
  token: z.string().min(16),
});

export async function POST(request: Request) {
  const parsed = resolveSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, message: "Invalid resolve link." }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("id, status, resolve_token_expires_at")
    .eq("resolve_token", parsed.data.token)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, message: "Unable to resolve this alert." }, { status: 500 });
  if (!incident || isResolveTokenExpired(incident.resolve_token_expires_at)) {
    return NextResponse.json({ success: false, message: "This resolve link is invalid or expired." }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("incidents")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", incident.id);

  if (updateError) return NextResponse.json({ success: false, message: "Unable to resolve this alert." }, { status: 500 });
  return NextResponse.json({ success: true, message: "Thanks. This parking alert has been marked resolved." });
}
```

- [ ] **Step 4: Build resolve page**

Create `src/app/resolve/[token]/resolve-button.tsx`:

```tsx
"use client";

import { useState } from "react";

export function ResolveButton({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function resolveIncident() {
    setIsPending(true);
    const response = await fetch("/api/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const body = await response.json();
    setMessage(body.message);
    setIsPending(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={resolveIncident}
        disabled={isPending}
        className="rounded-md bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? "Marking resolved..." : "I moved my car"}
      </button>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
```

Create `src/app/resolve/[token]/page.tsx`:

```tsx
import { ResolveButton } from "./resolve-button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isResolveTokenExpired } from "@/lib/incidents";

export default async function ResolvePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: incident } = await supabase
    .from("incidents")
    .select("plate_number_snapshot, location, resolve_token_expires_at")
    .eq("resolve_token", token)
    .maybeSingle();

  if (!incident || isResolveTokenExpired(incident.resolve_token_expires_at)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <section className="rounded-lg border border-[#E4ECFC] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Resolve link unavailable</h1>
          <p className="mt-3 text-slate-700">This parking alert link is invalid or expired.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="rounded-lg border border-[#E4ECFC] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#2563EB]">Parking alert</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Please confirm when your vehicle is moved</h1>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-600">Plate</dt>
            <dd className="text-slate-950">{incident.plate_number_snapshot}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Location</dt>
            <dd className="text-slate-950">{incident.location || "Shared parking area"}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <ResolveButton token={token} />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Verify resolve flow**

Run:

```bash
npm test -- src/app/api/resolve/route.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/api/resolve src/app/resolve
git commit -m "feat: add resolve flow"
```

---

### Task 7: Build Resident Landing And Ping UI

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/ping/page.tsx`
- Create: `src/app/ping/ping-form.tsx`

- [ ] **Step 1: Create UI primitives**

Create `src/components/ui/button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge(
        "inline-flex min-h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
```

Create `src/components/ui/card.tsx`:

```tsx
import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge("rounded-lg border border-[#E4ECFC] bg-white p-5 shadow-sm", className)} {...props} />;
}
```

Create `src/components/ui/input.tsx`:

```tsx
import type { InputHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "min-h-11 w-full rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-base text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-[#2563EB]",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Replace root layout**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParkPing",
  description: "Anonymous parking notifications for shared garages.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Build landing page**

Modify `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6">
      <nav className="flex items-center justify-between text-sm">
        <Link href="/" className="font-semibold text-slate-950">ParkPing</Link>
        <Link href="/admin/login" className="text-slate-700 hover:text-slate-950">Admin Login</Link>
      </nav>
      <section className="grid flex-1 content-center gap-8 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#059669]">Anonymous parking alerts</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
            Enter the blocking car&apos;s plate. We notify the owner privately.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
            ParkPing helps residents in shared garages send a private system alert without revealing names, phone numbers, emails, or unit numbers.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/ping" className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-blue-700">
              Ping a Vehicle Owner
            </Link>
            <Link href="/admin/login" className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-5 text-sm font-semibold text-slate-950 transition hover:border-[#2563EB]">
              Admin Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Build ping form**

Create `src/app/ping/ping-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Result = { success: boolean; message: string } | null;

export function PingForm() {
  const [plateNumber, setPlateNumber] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setResult(null);

    const response = await fetch("/api/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plateNumber, location, message }),
    });
    const body = await response.json();
    setResult({ success: response.ok && body.success, message: body.message });
    setIsPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="plateNumber" className="text-sm font-semibold text-slate-800">Plate number</label>
        <Input
          id="plateNumber"
          name="plateNumber"
          required
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
          placeholder="ABC 123"
          className="mt-2 text-2xl font-semibold uppercase tracking-wide"
        />
      </div>
      <div>
        <label htmlFor="location" className="text-sm font-semibold text-slate-800">Location</label>
        <Input id="location" name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="P1 near elevator" className="mt-2" />
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-semibold text-slate-800">Message</label>
        <textarea
          id="message"
          name="message"
          maxLength={200}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional short note"
          className="mt-2 min-h-28 w-full rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-base text-slate-950 shadow-sm"
        />
        <p className="mt-1 text-xs text-slate-500">{message.length}/200</p>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending..." : "Send anonymous ping"}
      </Button>
      {result ? (
        <div className={result.success ? "rounded-md bg-green-50 p-4 text-sm text-green-800" : "rounded-md bg-red-50 p-4 text-sm text-red-800"}>
          {result.message}
        </div>
      ) : null}
    </form>
  );
}
```

Create `src/app/ping/page.tsx`:

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PingForm } from "./ping-form";

export default function PingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-6">
      <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-950">ParkPing</Link>
      <section className="py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#059669]">Private system alert</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Ping a vehicle owner</h1>
        <p className="mt-3 text-slate-700">
          Your request stays anonymous. The owner receives a system notification, not your contact info.
        </p>
        <Card className="mt-6">
          <PingForm />
        </Card>
        <p className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-900">
          Demo mode uses simulated notifications, so no paid SMS/email service is required.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Verify resident UI**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/ping src/components/ui
git commit -m "feat: add resident ping experience"
```

---

### Task 8: Build Admin Auth Shell And Read Views

**Files:**
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/admin/admin-nav.tsx`
- Create: `src/lib/admin/queries.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/login/login-form.tsx`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/vehicles/page.tsx`
- Create: `src/app/admin/incidents/page.tsx`
- Create: `src/app/admin/notifications/page.tsx`

- [ ] **Step 1: Add admin UI primitives**

Create `src/components/ui/badge.tsx`:

```tsx
import { twMerge } from "tailwind-merge";

const tones: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-800",
  notified: "bg-blue-50 text-blue-800",
  resolved: "bg-green-50 text-green-800",
  failed: "bg-red-50 text-red-800",
  simulated_sent: "bg-green-50 text-green-800",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={twMerge("inline-flex rounded-full px-2 py-1 text-xs font-medium", tones[tone] ?? "bg-slate-100 text-slate-700")}>{children}</span>;
}
```

Create `src/components/ui/table.tsx`:

```tsx
export function EmptyState({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-[#E4ECFC] bg-white p-8 text-center text-sm text-slate-600">{message}</div>;
}
```

Create `src/components/admin/admin-nav.tsx`:

```tsx
import Link from "next/link";

const links = [
  ["Dashboard", "/admin"],
  ["Vehicles", "/admin/vehicles"],
  ["Incidents", "/admin/incidents"],
  ["Notifications", "/admin/notifications"],
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-[#E4ECFC] bg-white px-6 py-3">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#F1F5FD] hover:text-slate-950">
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Add admin query helpers**

Create `src/lib/admin/queries.ts`:

```ts
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getAdminSummary() {
  const supabase = createSupabaseAdminClient();
  const [{ count: activeVehicles }, { count: openIncidents }, { count: failedNotifications }] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["pending", "notified"]),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("delivery_status", "failed"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: pingsToday } = await supabase.from("incidents").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString());

  return {
    activeVehicles: activeVehicles ?? 0,
    openIncidents: openIncidents ?? 0,
    failedNotifications: failedNotifications ?? 0,
    pingsToday: pingsToday ?? 0,
  };
}
```

- [ ] **Step 3: Build login route and page**

Create `src/app/api/admin/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, message: "Enter a valid email and password." }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return NextResponse.json({ success: false, message: "Login failed." }, { status: 401 });
  return NextResponse.json({ success: true });
}
```

Create `src/app/api/admin/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
```

Create `src/app/admin/login/login-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }

    const body = await response.json();
    setMessage(body.message ?? "Login failed.");
    setIsPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-800">Email</label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" required />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-800">Password</label>
        <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" required />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
      {message ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{message}</p> : null}
    </form>
  );
}
```

Create `src/app/admin/login/page.tsx`:

```tsx
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-6 text-sm font-semibold text-slate-700 hover:text-slate-950">ParkPing</Link>
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Manage vehicles, incidents, and simulated notification logs.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Build protected admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#F0F9FF]">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Build admin read pages**

Create `src/app/admin/page.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { getAdminSummary } from "@/lib/admin/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();
  const summary = await getAdminSummary();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, plate_number_snapshot, location, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Privacy-safe parking activity at a glance.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Active vehicles", summary.activeVehicles],
          ["Open incidents", summary.openIncidents],
          ["Pings today", summary.pingsToday],
          ["Failed notifications", summary.failedNotifications],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </Card>
        ))}
      </section>
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">Recent incidents</h2>
        {!incidents?.length ? (
          <div className="mt-4"><EmptyState message="No incidents yet." /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-slate-600">
                <tr><th className="py-2">Plate</th><th>Location</th><th>Status</th><th>Created</th></tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-t border-[#E4ECFC]">
                    <td className="py-3 font-medium">{incident.plate_number_snapshot}</td>
                    <td>{incident.location || "Shared parking area"}</td>
                    <td><Badge tone={incident.status}>{incident.status}</Badge></td>
                    <td>{new Date(incident.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

Create `src/app/admin/vehicles/page.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { maskEmail, maskPhone } from "@/lib/validation/contact";

export default async function AdminVehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("vehicles")
    .select("id, plate_number, colour, make, model, year, active, owners(name, phone, email, unit_number)")
    .order("plate_number", { ascending: true });

  if (q) query = query.or(`plate_number.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%,colour.ilike.%${q}%`);
  const { data: vehicles } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Vehicles</h1>
        <p className="mt-1 text-sm text-slate-600">Searchable owner and vehicle records.</p>
      </div>
      <form>
        <input name="q" defaultValue={q} placeholder="Search plate, make, model, colour" className="min-h-11 w-full rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm" />
      </form>
      <Card>
        {!vehicles?.length ? (
          <EmptyState message="No vehicles match this search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-slate-600">
                <tr><th className="py-2">Plate</th><th>Vehicle</th><th>Owner</th><th>Unit</th><th>Phone</th><th>Email</th><th>Active</th></tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-t border-[#E4ECFC]">
                    <td className="py-3 font-semibold">{vehicle.plate_number}</td>
                    <td>{[vehicle.year, vehicle.colour, vehicle.make, vehicle.model].filter(Boolean).join(" ")}</td>
                    <td>{vehicle.owners?.name}</td>
                    <td>{vehicle.owners?.unit_number}</td>
                    <td>{maskPhone(vehicle.owners?.phone)}</td>
                    <td>{maskEmail(vehicle.owners?.email)}</td>
                    <td>{vehicle.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

Create `src/app/admin/incidents/page.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdminIncidentsPage({ searchParams }: { searchParams: Promise<{ status?: string; plate?: string }> }) {
  const { status = "", plate = "" } = await searchParams;
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("incidents")
    .select("id, plate_number_snapshot, location, message, status, created_at, resolved_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (plate) query = query.ilike("plate_number_snapshot", `%${plate}%`);
  const { data: incidents } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-950">Incidents</h1>
      <Card>
        {!incidents?.length ? (
          <EmptyState message="No incidents match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-slate-600">
                <tr><th className="py-2">Plate</th><th>Location</th><th>Message</th><th>Status</th><th>Created</th><th>Resolved</th></tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-t border-[#E4ECFC]">
                    <td className="py-3 font-semibold">{incident.plate_number_snapshot}</td>
                    <td>{incident.location || "Shared parking area"}</td>
                    <td>{incident.message || "No message"}</td>
                    <td><Badge tone={incident.status}>{incident.status}</Badge></td>
                    <td>{new Date(incident.created_at).toLocaleString()}</td>
                    <td>{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "Open"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

Create `src/app/admin/notifications/page.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function AdminNotificationsPage() {
  const supabase = createSupabaseAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, incident_id, method, recipient_masked, delivery_status, sent_at, simulated_message, resolve_link")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-950">Simulated notifications</h1>
      <Card>
        {!notifications?.length ? (
          <EmptyState message="No notification attempts yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="text-slate-600">
                <tr><th className="py-2">Incident</th><th>Method</th><th>Recipient</th><th>Status</th><th>Sent</th><th>Message</th><th>Resolve link</th></tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className="border-t border-[#E4ECFC] align-top">
                    <td className="py-3 font-mono text-xs">{notification.incident_id}</td>
                    <td>{notification.method}</td>
                    <td>{notification.recipient_masked}</td>
                    <td><Badge tone={notification.delivery_status}>{notification.delivery_status}</Badge></td>
                    <td>{notification.sent_at ? new Date(notification.sent_at).toLocaleString() : "Not sent"}</td>
                    <td className="max-w-sm">{notification.simulated_message}</td>
                    <td><a href={notification.resolve_link ?? "#"} className="text-[#2563EB] hover:underline">Open</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Verify admin pages**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/app/admin src/app/api/admin src/components/admin src/components/ui src/lib/admin
git commit -m "feat: add protected admin read views"
```

---

### Task 9: Document Setup And Verify The Full Slice

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Update README**

Replace `README.md` with sections for:

````md
# ParkPing

ParkPing is an anonymous parking notification system for shared garages and tandem parking.

## What The MVP Does

- Residents submit a plate without logging in.
- The server privately looks up the vehicle owner.
- The app creates a simulated notification by default.
- The resident never sees owner name, phone, email, unit, or contact details.
- Owners resolve alerts through secure token links.
- Admins can view vehicles, incidents, and simulated notifications after login.

## Free MVP Mode

ParkPing runs in `NOTIFICATION_MODE=simulated` by default. Twilio, Resend, Stripe, and paid APIs are not required.

## Environment

Copy `.env.example` to `.env.local` and set Supabase values.

## Database

Run `supabase/migrations/0001_initial_schema.sql`, then `supabase/seed.sql`.

Known seeded test plate: `PARK101`.

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Privacy Model

Public pages and APIs never return owner name, phone, email, unit number, or vehicle database rows. Admin pages are protected with Supabase Auth.
````

- [ ] **Step 2: Run all automated checks**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: PASS for all commands.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev
```

Expected: local app starts, usually at `http://localhost:3000`.

- [ ] **Step 4: Browser smoke test**

Use the Browser plugin to verify:

- `/` loads and shows the privacy promise.
- `/ping` loads and the plate field uppercases typed text.
- Unknown plate submission shows the clean not-found state.
- With Supabase configured and seed data loaded, `PARK101` creates a simulated notification.
- `/resolve/[token]` loads from a generated notification link.
- `/admin/login` loads.

- [ ] **Step 5: Commit**

Run:

```bash
git add README.md .env.example
git commit -m "docs: add setup and verification guide"
```

---

## Plan Self-Review

Coverage:

- Resident landing, ping, and resolve flows are covered by Tasks 5, 6, and 7.
- Core schema and seed data are covered by Task 2.
- Privacy, validation, masking, import mapping foundations, requester hashing, rate limits, and simulated notifications are covered by Tasks 3, 4, and 5.
- Protected admin read views are covered by Task 8.
- Documentation and final verification are covered by Task 9.

Deferred scope:

- Manual vehicle CRUD and CSV/Excel import preview/confirm are intentionally excluded from this first implementation plan and preserved by schema/utilities for the next slice.

Type consistency:

- Plate fields use `plateNumber` at public API boundaries and `plate_number` in database-facing code.
- Incident statuses match the SQL check constraint and `IncidentStatus`.
- Notification statuses match the SQL check constraint and `NotificationStatus`.
