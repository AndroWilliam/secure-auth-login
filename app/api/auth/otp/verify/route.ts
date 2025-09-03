// app/api/auth/otp/verify/route.ts
export const runtime = "nodejs20";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyOtp } from "@/lib/otp";

// ---- ENV (server only) ----
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept either { email, otp } or { contact, otpCode }
    const rawEmail = (body.email ?? body.contact)?.toString().trim();
    const code = (body.otp ?? body.otpCode)?.toString().trim();
    const password: string | undefined = body.password?.toString(); // OPTIONAL but recommended in your flow

    if (!rawEmail || !code) {
      return NextResponse.json({ ok: false, error: "PAYLOAD_INVALID" }, { status: 400 });
    }

    const email = rawEmail.toLowerCase();

    // 1) Verify OTP stored in your DB
    const ok = await verifyOtp(email, code, "email");
    if (!ok) {
      return NextResponse.json({ ok: false, error: "OTP_INVALID" }, { status: 400 });
    }

    // 2) If password is provided, ensure there is a Supabase Auth user
    let userId: string | null = null;

    if (password) {
      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { ok: false, error: "SERVER_MISCONFIG", detail: "Missing service role envs" },
          { status: 500 }
        );
      }

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Look up existing user by email
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) {
        return NextResponse.json(
          { ok: false, error: "USER_LIST_FAILED", detail: listErr.message },
          { status: 500 }
        );
      }
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

      if (!existing) {
        // Create fresh user (email already verified via OTP)
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr) {
          return NextResponse.json(
            { ok: false, error: "USER_CREATE_FAILED", detail: createErr.message },
            { status: 500 }
          );
        }
        userId = created.user?.id ?? null;
      } else {
        // DEMO BEHAVIOR: align password + confirm email for existing user
        const { data: updated, error: upErr } = await admin.auth.admin.updateUserById(existing.id, {
          password,          // set to the password the user chose in step 1
          email_confirm: true,
        });
        if (upErr) {
          return NextResponse.json(
            { ok: false, error: "USER_UPDATE_FAILED", detail: upErr.message },
            { status: 500 }
          );
        }
        userId = existing.id;
      }
    }

    // Success
    return NextResponse.json({ ok: true, verified: true, user_id: userId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "VERIFY_FAILED", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}