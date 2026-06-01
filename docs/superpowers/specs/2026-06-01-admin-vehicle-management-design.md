# Admin Vehicle Management Design

## Summary

Build the next ParkPing production slice so building managers can manage owner and vehicle records without opening Supabase. The slice adds protected admin create, edit, deactivate, and reactivate workflows while preserving the existing privacy model and resident-first public experience.

## Scope

This slice includes:

- `/admin/vehicles/new` for creating an owner and vehicle together.
- `/admin/vehicles/[id]/edit` for editing owner and vehicle fields together.
- Deactivate and reactivate actions from the vehicle list and edit page.
- Server-side admin write helpers that normalize plates, validate owner contact rules, and prevent duplicate plates.
- Focused tests for create, update, duplicate plate rejection, deactivate, and reactivate behavior.
- Compact, data-dense admin UI consistent with the existing dashboard.

This slice does not include CSV/Excel import, real SMS/email delivery, hard delete, bulk actions, or audit logs.

## Product Rules

- Only authenticated allowlisted admins can use these workflows.
- Vehicles are deactivated instead of hard deleted.
- Plates are normalized before saving.
- `owner.name` is required.
- At least one contact method, phone or email, is required.
- Duplicate normalized plates are rejected, including inactive vehicles, because plate number is the unique matching key.
- Admin pages may show owner and vehicle details; public pages and APIs must remain privacy-safe.

## Architecture

Use server actions for admin write flows. Server actions fit the existing Next.js App Router code and avoid exposing a broader REST write API before mobile/native clients exist. Shared write logic lives in `src/lib/admin/vehicles.ts` so it can be tested independently and reused by the server actions.

The data flow is:

1. Admin opens a protected page under `/admin`.
2. Server component verifies the admin session through the existing protected layout.
3. The form submits to a server action.
4. The server action calls `createAdminVehicleRecord`, `updateAdminVehicleRecord`, or `setAdminVehicleActive`.
5. The helper validates and normalizes input, writes owners/vehicles through the Supabase service-role client, and returns a structured result.
6. The action redirects back to the vehicle list or edit page after success.

## UI Direction

Use the existing restrained admin style: compact form sections, clear labels, stable buttons, visible error banners, and status badges. The vehicle table gains explicit row actions for edit and active-state toggling. Forms should be usable on mobile but optimized for repeated admin work on desktop.

## Testing

Use Vitest for the write helper and server action boundaries where practical. Minimum coverage:

- Creating a valid owner and vehicle writes normalized plate data.
- Create rejects missing owner name.
- Create rejects rows without phone and email.
- Create rejects duplicate normalized plates.
- Updating a vehicle can edit owner and vehicle fields.
- Updating rejects a duplicate plate owned by another vehicle.
- Deactivate/reactivate flips `vehicles.active`.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before completion.
