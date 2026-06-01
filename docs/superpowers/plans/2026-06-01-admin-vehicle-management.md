# Admin Vehicle Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add protected admin workflows to create, edit, deactivate, and reactivate ParkPing vehicle records.

**Architecture:** Keep database mutation logic in a tested server-only helper under `src/lib/admin/vehicles.ts`. Wire protected App Router pages and server actions on top of that helper. Preserve the current admin UI language and the public privacy model.

**Tech Stack:** Next.js App Router, TypeScript, React server actions, Supabase, Zod, Vitest, Tailwind CSS.

---

## File Structure

- Create `src/lib/admin/vehicles.ts`: validation, normalization, duplicate checks, and Supabase writes for owner/vehicle management.
- Create `src/lib/admin/vehicles.test.ts`: focused tests for create, update, deactivate, and reactivate behavior.
- Create `src/app/admin/(protected)/vehicles/actions.ts`: server actions for form submissions.
- Create `src/app/admin/(protected)/vehicles/vehicle-form.tsx`: reusable client form UI.
- Create `src/app/admin/(protected)/vehicles/new/page.tsx`: new vehicle page.
- Create `src/app/admin/(protected)/vehicles/[id]/edit/page.tsx`: edit vehicle page.
- Modify `src/app/admin/(protected)/vehicles/page.tsx`: add create CTA and row actions.
- Modify `src/lib/admin/queries.ts`: add a single-record vehicle query for edit pages.
- Modify `src/lib/supabase/types.ts`: add write input types if needed.

## Tasks

- [ ] Write failing tests for admin vehicle create/update/active helpers.
- [ ] Implement `src/lib/admin/vehicles.ts` until helper tests pass.
- [ ] Add protected server actions that call the helper and return form-safe errors.
- [ ] Build reusable admin vehicle form.
- [ ] Add new and edit pages.
- [ ] Add create/edit/deactivate/reactivate actions to the vehicles table.
- [ ] Run lint, typecheck, tests, and production build.
- [ ] Smoke the admin vehicle workflow locally or against production preview.
