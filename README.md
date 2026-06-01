# ParkPing

ParkPing is an anonymous parking notification system for shared garages and
tandem parking. A resident can report a blocking vehicle by license plate, and
ParkPing privately routes the alert to the vehicle owner without exposing either
resident's contact details.

## MVP Overview

The resident-first MVP supports this flow:

- A resident submits a license plate from `/ping` without creating an account or
  logging in.
- The server normalizes the plate, privately looks up the matching owner, creates
  an incident, and records a notification.
- `NOTIFICATION_MODE=simulated` is the default, so local development stores a
  simulated notification instead of sending SMS or email.
- `NOTIFICATION_MODE=email` sends owner alerts through Resend when
  `RESEND_API_KEY` and `FROM_EMAIL` are configured.
- The resident never sees the owner name, phone number, email address, unit
  number, full vehicle row, or any other contact details.
- Owners resolve alerts through secure token links at `/resolve/[token]`.
- Admins log in with Supabase Auth and an `ADMIN_EMAILS` allowlist to view
  vehicles, incidents, and simulated notifications.

## Free MVP Mode

ParkPing runs in free simulated mode by default:

```bash
NOTIFICATION_MODE=simulated
```

No Twilio, Resend, Stripe, or other paid API account is required for simulated
mode. To send real email pings, configure Resend and switch
`NOTIFICATION_MODE=email`.

## Environment Setup

Create a local env file:

```bash
cp .env.example .env.local
```

Then set:

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase anon key for browser/server auth.
- `SUPABASE_SERVICE_ROLE_KEY`: your Supabase service role key for private server
  lookups and writes.
- `ADMIN_EMAILS`: comma-separated Supabase Auth emails allowed to access `/admin`.
- `REQUESTER_HASH_SECRET`: a private secret used to hash requester signals for
  rate limiting without storing raw requester identity.
- `RESEND_API_KEY`: required only when `NOTIFICATION_MODE=email`.
- `FROM_EMAIL`: verified sender identity used for live email alerts.

`APP_BASE_URL` defaults to `http://localhost:3000` and is used when creating
owner resolve links. Keep `NOTIFICATION_MODE=simulated` unless Resend is
configured for live email delivery.

## Database Setup

Apply the initial schema, then seed demo data:

```bash
supabase db reset
```

Or run these SQL files manually in order:

```bash
supabase/migrations/0001_initial_schema.sql
supabase/seed.sql
```

The seed data includes a known active plate:

```text
PARK101
```

Use `PARK101` for a successful local ping after Supabase is configured. Unknown
plates should return a clean not-found message.

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Verification

Run the full automated slice before handing off changes:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Recommended smoke checks with the dev server running:

- `/` loads and shows the privacy promise.
- `/ping` loads, and the license plate field uppercases typed text.
- Submitting an unknown plate shows either the clean not-found message or, if
  Supabase env is not configured locally, a generic no-env/server error.
- `/admin/login` loads.

For production setup and promotion, see
[`docs/production-launch.md`](docs/production-launch.md).

## Privacy Model

Public pages and APIs are designed to avoid leaking owner data. They never return
owner name, phone number, email address, unit number, or full vehicle rows to the
resident. Public ping responses contain only generic success, not-found, rate
limit, or error messages.

Admin pages are protected by Supabase Auth plus the `ADMIN_EMAILS` allowlist.
Admin views can show vehicle, owner, incident, and notification records needed by
building staff, including masked notification recipients and simulated resolve
links.

## Admin Workflow

1. Add an admin user in Supabase Auth.
2. Add that user's email to `ADMIN_EMAILS` in `.env.local`.
3. Visit `/admin/login` and sign in.
4. Use the admin dashboard to review vehicles, incidents, and notification
   records.

In simulated notification mode, ParkPing writes notification records with masked
recipients and secure resolve links instead of sending live SMS or email. When
`NOTIFICATION_MODE=email` is enabled with Resend credentials, ParkPing sends a
live owner email and still stores the masked recipient, provider id, message
preview, and resolve link.
