export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSameIpDevice, getClientIp } from "@/lib/utils/ip-device-id";

export async function POST(req: NextRequest) {
  try {
    console.log("[LOGIN_VERIFY_DEVICE] POST request received");
    
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id || body.userId;
    const deviceId = body.device_id || body.deviceId;
    const email = body.email;

    console.log("[LOGIN_VERIFY_DEVICE] Request data:", { userId, deviceId, email });

    if (!userId || !deviceId) {
      console.log("[LOGIN_VERIFY_DEVICE] Missing required fields");
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 400 });
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

    console.log("[LOGIN_VERIFY_DEVICE] Query result:", { eventsCount: events?.length, queryError });

    if (queryError || !events || events.length === 0) {
      console.log("[LOGIN_VERIFY_DEVICE] No signup events found");
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    const signupEvent = events[0];
    console.log("[LOGIN_VERIFY_DEVICE] Signup event data:", signupEvent.event_data);
    
    // Get device_id from event_data (signup flow stores it there)
    const storedDeviceId = signupEvent.event_data?.device_id;
    
    if (!storedDeviceId) {
      console.log("[LOGIN_VERIFY_DEVICE] No device_id in signup event");
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    // Compare device IDs using IP-based comparison
    const device_ok = isSameIpDevice(storedDeviceId, deviceId);
    const currentIp = getClientIp(req);
    
    console.log("[LOGIN_VERIFY_DEVICE] Device comparison:", { 
      storedDeviceId, 
      currentDeviceId: deviceId, 
      currentIp,
      device_ok 
    });

    if (!device_ok) {
      console.log("[LOGIN_VERIFY_DEVICE] Device IP mismatch - triggering OTP");
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    console.log("[LOGIN_VERIFY_DEVICE] Device verified successfully");
    return NextResponse.json({ device_ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[LOGIN_VERIFY_DEVICE_ERROR]", e.message);
    return NextResponse.json({ device_ok: false, error: "Internal server error" }, { status: 500 });
  }
}


