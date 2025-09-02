# Secure Auth Login

## Getting started

Prereqs:
- Node 22+
- `.env.local` with Supabase + email provider vars (already present locally)

Install & run (port 3005):

```
npm install --legacy-peer-deps
npm run kill-port && npm run dev
```

Smoke checks:

```
# Doctor
curl -sS http://127.0.0.1:3005/api/doctor | jq .

# OTP send
curl -sS -X POST http://127.0.0.1:3005/api/auth/otp/send \
  -H 'Content-Type: application/json' \
  --data '{"email":"you@example.com"}' | jq .

# Login credentials
curl -sS -X POST http://127.0.0.1:3005/api/login/credentials \
  -H 'Content-Type: application/json' \
  --data '{"email":"you@example.com","password":"Passw0rd!"}' | jq .

# Store event
curl -sS -X POST http://127.0.0.1:3005/api/user-info/store-event \
  -H 'Content-Type: application/json' \
  --data '{"event_type":"debug_login","event_data":{"email":"you@example.com","reason":"auto smoke"}}' | jq .
```

Tests:

```
npm run test:smoke
npx playwright install --with-deps
npm run test:e2e
```

## Dev notes
- `/api/doctor` reports env flags and supabase_ok.
- Middleware excludes `/api/*` and uses lazy `@supabase/ssr` import.
- OTP provider prefers SMTP if configured; falls back to Resend; in dev returns `devOtp`.
- Migration: `supabase/sql/20250902_user_info_events.sql` is idempotent.
