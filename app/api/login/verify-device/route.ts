export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id || body.userId;
    const deviceId = body.device_id || body.deviceId;
    const email = body.email;

    if (!userId || !deviceId) {
      return NextResponse.json({ error: "PAYLOAD_INVALID" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get the signup event with device info
    const { data: events, error: queryError } = await supabase
      .from("user_info_events")
      .select("*")
      .eq("user_id", userId)
      .eq("event_type", "signup_completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryError || !events || events.length === 0) {
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    const signupEvent = events[0];
    
    // Get device_id from event_data (signup flow stores it there)
    const storedDeviceId = signupEvent.event_data?.device_id;
    
    if (!storedDeviceId) {
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    // Compare device IDs
    const device_ok = storedDeviceId === deviceId;

    if (!device_ok) {
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    return NextResponse.json({ device_ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[LOGIN_VERIFY_DEVICE_ERROR]", e.message);
    return NextResponse.json({ device_ok: false, error: "Internal server error" }, { status: 500 });
  }
}


