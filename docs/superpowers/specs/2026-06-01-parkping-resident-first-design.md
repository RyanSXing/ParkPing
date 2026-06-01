# ParkPing Resident-First MVP Design

## Summary

ParkPing is a production-quality anonymous parking notification system for shared garages and tandem parking. The first implementation slice will be resident-first: prove the privacy-safe ping loop end to end before expanding the heavier admin import and CRUD workflows.

The approved product emphasis is:

- Resident-first public experience.
- Simulated notifications by default, with no paid services required.
- Demo polish built into the first slice.
- Dense, practical admin tools behind authentication.

## Scope

### First Implementation Slice

The first slice includes:

- Next.js App Router app scaffold with TypeScript, Tailwind CSS, Vitest, Zod, and Supabase helpers.
- Public landing page at `/`.
- Public anonymous ping page at `/ping`.
- Public owner resolve page at `/resolve/[token]`.
- Server route for creating pings.
- Server route for resolving incidents.
- Core database schema for owners, vehicles, incidents, notifications, imports, and import errors.
- Sample seed data with at least 10 mock owners and vehicles if no provided workbook is present.
- Simulated notification service.
- Protected admin login.
- Protected admin dashboard, vehicles list, incidents list, and notifications list.
- Tests for normalization, validation, masking, rate limits, simulated notifications, public response privacy, and resolve tokens.
- README and `.env.example`.

### Deferred To Next Slice

The first implementation plan will leave room for, but not require completion of:

- Manual vehicle add/edit/deactivate/reactivate forms.
- CSV/Excel import preview and confirm.
- Import history and detailed import error management.
- Optional Twilio or Resend integrations.

These deferred items remain part of the larger MVP and must be compatible with the first slice's schema and utility boundaries.

## Architecture

ParkPing will be a Next.js App Router application. Public resident and owner routes will use server APIs that never return private owner information. Admin routes will be protected with Supabase Auth and can access private vehicle-owner data after authentication.

The public flow is:

1. A blocked resident submits a plate, location, and optional message.
2. The server normalizes and validates the plate.
3. The server applies rate limit and duplicate checks.
4. The server looks up an active vehicle by normalized plate.
5. If found, the server creates an incident with a secure resolve token.
6. The simulated notification service creates a notification row and resolve link.
7. The API returns a generic success message with no private owner fields.
8. The owner can open `/resolve/[token]` and mark the incident resolved.

The admin flow is:

1. Admin signs in through `/admin/login`.
2. Protected routes verify the Supabase session.
3. Admin dashboard shows high-level counts and recent incident activity.
4. Vehicles, incidents, and notifications are shown in searchable, data-dense tables.

## Routes

### Public Routes

`/`

- Simple landing page.
- Primary CTA: "Ping a Vehicle Owner".
- Secondary CTA: "Admin Login".
- Core copy: "Enter the blocking car's plate. We notify the owner privately."
- Privacy is the first-viewport message.

`/ping`

- Mobile-first form.
- Large plate input with auto-uppercase display.
- Optional location field.
- Optional message field with 200-character counter.
- Privacy note: "Your request stays anonymous. The owner receives a system notification, not your contact info."
- Demo note: "Demo mode uses simulated notifications, so no paid SMS/email service is required."
- Success state: "Ping created. The vehicle owner would be notified by the system."
- Not-found state: "No matching vehicle found. Please check the plate number or contact building management."
- Rate-limit and duplicate state: "That vehicle was recently pinged. Please wait before sending another alert."
- No owner name, phone, email, unit number, or exact vehicle-owner details are displayed.

`/resolve/[token]`

- Shows vehicle plate snapshot and location.
- Does not show requester identity.
- Button: "I moved my car".
- Valid token updates the incident to resolved and sets `resolved_at`.
- Invalid or expired token shows a friendly invalid-link state.

### Admin Routes

`/admin/login`

- Supabase email/password login.

`/admin`

- Protected dashboard.
- KPI cards for total active vehicles, open incidents, pings today, and failed notifications.
- Recent incidents table.

`/admin/vehicles`

- Protected searchable table.
- Search by plate, owner name, unit, make, model, and colour.
- Columns include plate, vehicle, owner, unit, masked phone, masked email, and active status.

`/admin/incidents`

- Protected incident table.
- Filters by status, date, plate, and location.
- Shows plate snapshot, vehicle summary, location, message, status, creation time, resolution time, and notification status.

`/admin/notifications`

- Protected simulated notification table.
- Shows incident id, method, masked recipient, delivery status, sent time, simulated message preview, and resolve link.

## Data Model

The first slice will create SQL for these tables:

- `owners`
- `vehicles`
- `incidents`
- `notifications`
- `imports`
- `import_errors`

The schema will follow the supplied brief. `vehicles.plate_number` is unique and stores only the normalized plate. Incidents store `plate_number_snapshot` so historical logs remain readable if vehicle records change. Vehicles are deactivated rather than hard deleted in later CRUD work.

## Validation And Utilities

Shared server utilities will include:

- `normalizePlate(value)` trims whitespace, uppercases letters, and removes spaces and dashes.
- `maskPhone(value)` returns a masked North American phone display such as `(***) ***-1234`.
- `maskEmail(value)` returns a masked email display such as `r***@example.com`.
- Ping input schema validates required plate, optional location, optional message, and maximum message length.
- Message validation strips dangerous HTML and rejects a small blocked-word list.
- Import column mapping utilities will be created early enough to support future import work without shaping public endpoints around it.

## Privacy Rules

Public routes and public API responses must never expose:

- Owner name.
- Owner phone.
- Owner email.
- Unit number.
- Full vehicle database rows.
- Any exact owner contact details.

The public ping API returns only a generic success, not-found, duplicate, or rate-limit result. Supabase service role keys are server-only and must not be referenced by client components.

Admin routes may show private owner data because they are protected. List views will use masked phone and email by default.

## Abuse Controls

The first slice implements:

- Max 3 pings per plate per hour.
- Max 5 pings per requester per day.
- Duplicate suppression when the same plate has an open pending or notified incident from the last 5 minutes.
- `requester_hash` based on IP/user-agent plus `REQUESTER_HASH_SECRET`.
- Do not store raw IP addresses in the first slice.
- Server-side validation for all public inputs.

## Notification Service

Notification mode defaults to simulated.

Required environment variables:

- `NOTIFICATION_MODE=simulated`
- `APP_BASE_URL=http://localhost:3000`
- `REQUESTER_HASH_SECRET=`

Optional future variables may be documented but cannot be required:

- `TWILIO_ACCOUNT_SID=`
- `TWILIO_AUTH_TOKEN=`
- `TWILIO_PHONE_NUMBER=`
- `RESEND_API_KEY=`
- `FROM_EMAIL=`

`sendSimulatedParkingAlert()` will create a notification row with:

- `method = simulated`
- `delivery_status = simulated_sent`
- Masked recipient.
- Simulated message preview.
- Resolve link.
- Sent timestamp.

Message copy:

`Parking alert: Your vehicle {colour} {make} {model}, plate {plate}, may be blocking another resident near {location}. Please move it when possible. Resolve: {link}`

If location is missing, use `in the shared parking area`.

## UI Direction

The approved UI direction is resident-first. The public experience is simple, practical, and mobile-first. The admin experience is compact and data-dense.

UI/UX Pro Max recommended:

- Minimal single-column pattern for the public experience.
- Data-dense dashboard pattern for admin.
- Primary color `#2563EB`, secondary `#059669`, destructive/accent `#DC2626`.
- Clear form labels, helpful validation, loading states, empty states, error states, and success states.
- WCAG AA contrast, visible focus states, and responsive checks at 375px, 768px, 1024px, and 1440px.

The implementation should avoid marketing fluff, oversized decorative hero sections, and visual treatments that make this feel less trustworthy.

## Testing Strategy

Use Vitest unless the scaffold introduces a better existing test setup.

Minimum tests:

- Plate normalization.
- Message validation and blocked-word rejection.
- Phone and email masking.
- Import column mapping foundations.
- Duplicate plate detection utility foundations.
- Ping API behavior does not return private owner fields.
- Rate limit and duplicate suppression logic.
- Simulated notification creation.
- Resolve token success, expired, and invalid flows.

Before completion, run:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Acceptance Criteria For First Slice

Resident side:

- `/ping` opens and accepts a known seeded plate.
- Known plate creates an incident and simulated notification.
- Success response does not show owner private data.
- Unknown plate shows a clean error.
- Rate limits and duplicate suppression prevent spam.

Owner side:

- Simulated notification includes a resolve link.
- Resolve link opens `/resolve/[token]`.
- Owner can mark incident resolved.
- Incident status updates correctly.

Admin side:

- Admin can log in.
- Admin can view summary counts.
- Admin can view vehicles.
- Admin can search vehicles.
- Admin can view incidents.
- Admin can view simulated notifications, message previews, and resolve links.

Technical:

- No paid services are required.
- No Twilio or Resend keys are required.
- Public APIs do not leak private owner data.
- Sensitive keys are not exposed client-side.
- Tests, lint, typecheck, and build pass.

## Open Decisions

There are no blocking open decisions for the first implementation plan. The implementation plan should preserve compatibility with future manual CRUD and CSV/Excel import work.
