/* eslint-disable no-console */
import assert from 'node:assert';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';

async function json(path: string, init?: RequestInit) {
  const res = await fetch(BASE + path, init);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data } as const;
}

async function main() {
  // doctor
  const doctor = await json('/api/doctor');
  assert.equal(doctor.status, 200);
  assert.equal(doctor.data.supabase_ok, true, 'supabase_ok must be true');
  const env = doctor.data.env || {};
  assert.equal(env.has_public_url, true);
  assert.equal(env.has_public_anon, true);
  assert.equal(env.has_service_url, true);
  assert.equal(env.has_service_key, true);

  // otp send
  const email = `smoke+${Date.now()}@example.com`;
  const send = await json('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  assert.ok([200].includes(send.status), 'otp send should return 200');
  assert.ok(send.data.sent || send.data.devOtp || send.data.messageId);

  // store-event
  const store = await json('/api/user-info/store-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'debug_login', event_data: { email, reason: 'auto smoke' } })
  });
  assert.equal(store.status, 201);
  assert.equal(store.data.ok, true);
  assert.ok(store.data.inserted?.id);

  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


