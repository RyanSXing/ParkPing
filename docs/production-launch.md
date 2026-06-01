# Production Launch Checklist

Use this checklist before promoting ParkPing beyond the free simulated MVP.

## 1. Supabase

- Create a production Supabase project.
- Apply `supabase/migrations/0001_initial_schema.sql`.
- Seed only safe demo or real building data; do not run local-only seed data in a tenant-facing production database unless it is intentional.
- Create each admin in Supabase Auth.
- Confirm Row Level Security is enabled on all application tables.

## 2. Vercel Environment

Set these variables for the production deployment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NOTIFICATION_MODE=simulated
APP_BASE_URL=https://your-production-domain.example
REQUESTER_HASH_SECRET=<long random secret>
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

`APP_BASE_URL` is used in owner resolve links. If it is omitted on Vercel,
ParkPing falls back to `https://$VERCEL_URL`, which is useful for preview
deployments. Set it explicitly for production so links use the public domain.

Keep `NOTIFICATION_MODE=simulated` until Resend credentials are configured and a
controlled email smoke test passes. Email mode requires:

```text
NOTIFICATION_MODE=email
RESEND_API_KEY=<resend api key>
FROM_EMAIL=ParkPing <alerts@yourdomain.com>
```

`FROM_EMAIL` must be a sender identity accepted by Resend. Simulated mode remains
available for demos and local work.

## 3. CI Gate

The GitHub Actions workflow in `.github/workflows/ci.yml` runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

Require this workflow before merging to `main`.

## 4. Preview Smoke Test

Before promoting a preview deployment:

- Open `/` and `/ping`.
- Submit unknown plate text and confirm the response does not leak owner data.
- Submit a seeded active plate and confirm the success response is generic.
- Open `/admin/login` and verify an allowlisted admin can sign in.
- Check `/admin/incidents` and `/admin/notifications` for the created record.
- Open the simulated resolve link and confirm the incident can be resolved once.

## 5. Production Promotion

Use Vercel's Git integration or promote a verified preview deployment. After
promotion:

- Confirm the production URL loads.
- Confirm `APP_BASE_URL` points to the production domain.
- Confirm admin access is limited to `ADMIN_EMAILS`.
- Review Vercel function logs for server errors after the first smoke test.
