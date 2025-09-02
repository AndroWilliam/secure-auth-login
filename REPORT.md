# Secure Auth Audit (Next.js 15 + Supabase + OTP)

- Updated Supabase helpers and middleware for Next.js 15 cookies/headers; excluded `/api/*`.
- Hardened OTP send/verify with canonical columns and robust email provider handling (SMTP/Resend/dev mode).
- Implemented credentials login via SSR Supabase client (cookie persistence).
- Event logger inserts into `user_info_events` with service client and returns inserted row.
- Added `/api/doctor` for env flags and `supabase_ok`.
- Added scripts and tests: kill-port, smoke API test, Playwright smoke UI tests.
- Added SQL: `supabase/sql/20250902_user_info_events.sql` (idempotent table + RLS policy).

## How to run
- `npm install --legacy-peer-deps`
- `npm run kill-port && npm run dev`
- Smoke curls:
  - OTP send: `POST http://127.0.0.1:3005/api/auth/otp/send` `{ email }`
  - Login credentials: `POST /api/login/credentials` `{ email,password }`
  - Store event: `POST /api/user-info/store-event` `{ event_type,event_data }`
- Tests:
  - `npm run test:smoke`
  - `npx playwright install --with-deps && npm run test:e2e`

## Observed outputs (local)
- doctor: `supabase_ok` true; env flags true
- otp/send: `{ sent:true, messageId, devOtp }`
- store-event: `{ ok:true, inserted: { id, created_at } }`
- tests: `SMOKE OK`; Playwright `2 passed`
