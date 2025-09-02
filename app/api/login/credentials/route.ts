// app/api/login/credentials/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "PAYLOAD_INVALID" }, { status: 400 });
    }

    const cookieStore = await cookies();

    // ✅ SSR client that reads/writes Next.js cookies
    const supabase = createServerClient(URL, ANON, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          cookieStore.set(name, value, options);
        },
        // 🔧 FIX: delete signature must be (name, options?) — not an object.
        remove(name: string, options?: any) {
          cookieStore.delete(name, options);
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "AUTH_FAILED", detail: error.message },
        { status: 401 }
      );
    }

    // Return the minimal shape the frontend expects
    return NextResponse.json(
      { ok: true, user_id: data.user?.id ?? null, email: data.user?.email ?? email },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "LOGIN_FAILED", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}