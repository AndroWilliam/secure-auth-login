export const runtime = "nodejs20";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const env = {
    has_public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_public_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_service_url: !!process.env.SUPABASE_URL,
    has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_resend: !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM,
    has_smtp: !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
  };

  let supabase_ok = false;
  try {
    const s = createServiceClient();
    const { error } = await s.from("otp_verifications").select("id").limit(1);
    supabase_ok = !error;
  } catch {
    supabase_ok = false;
  }

  return NextResponse.json({ env, supabase_ok });
}