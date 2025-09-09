import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

function calculateStatus(lastSignInAt: string | null | undefined): 'Active' | 'Idle' | 'Inactive' {
  if (!lastSignInAt) return 'Inactive';
  
  const now = Date.now();
  const lastSignIn = new Date(lastSignInAt).getTime();
  const diffMinutes = (now - lastSignIn) / (1000 * 60);
  
  if (diffMinutes <= 5) return 'Active';
  if (diffMinutes <= 30) return 'Idle';
  return 'Inactive';
}

function getDisplayName(email: string): string {
  const local = email.split('@')[0];
  return local.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const email = await getSessionEmail();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const supa = createServiceClient();

  // auth user
  const { data: userData, error: userErr } = await supa.auth.admin.getUserById(params.id);
  if (userErr || !userData?.user) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
  const user = userData.user;

  // profile
  const { data: profile } = await supa.from("profiles")
    .select("id, display_name, phone_number")
    .eq("id", params.id)
    .maybeSingle();

  // security events (latest of each)
  const { data: events } = await supa
    .from("user_info_events")
    .select("event_type, event_data, location_data, created_at")
    .eq("user_id", params.id)
    .in("event_type", ["signup_completed", "login_completed", "login_attempt", "location_verification"])
    .order("created_at", { ascending: false });

  const latest = (type: string) => (events || []).find(e => e.event_type === type);

  const signup = latest("signup_completed");
  const login = latest("login_completed") || latest("login_attempt");
  const loc   = latest("location_verification");

  const deviceFingerprint =
    signup?.event_data?.device_id ||
    login?.event_data?.device_id ||
    null;

  const ipAddress =
    login?.event_data?.client_ip ||
    signup?.event_data?.client_ip ||
    login?.event_data?.ipAddress ||
    signup?.event_data?.ipAddress ||
    null;

  const location =
    loc?.location_data ||
    login?.event_data?.current_location ||
    login?.event_data?.locationData ||
    null;

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: profile?.display_name || getDisplayName(user.email),
      phone: profile?.phone_number || null,
      createdAt: user.created_at,
      lastLoginAt: user.last_sign_in_at,
      role: resolveRole(user.email),
      status: calculateStatus(user.last_sign_in_at),
    },
    security: {
      ipAddress,
      deviceFingerprint,
      location,
    },
  }, { headers: { 'Cache-Control': 'no-store' }});
}
