export const runtime = "nodejs20";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { compareHybridDeviceIds, getClientIp, HybridDeviceId } from "@/lib/utils/hybrid-device-id";

// Helper function to parse hybrid device ID
function parseHybridDeviceId(deviceId: string): HybridDeviceId {
  // Handle hybrid format: hybrid-{ipHash}-{hardwareFingerprint}-{persistentId}
  if (deviceId.startsWith('hybrid-')) {
    const withoutPrefix = deviceId.substring(7); // Remove 'hybrid-'
    const parts = withoutPrefix.split('-');
    
    if (parts.length >= 3) {
      // For format like: ::1-server-side--server-side
      // We need to handle the case where IP might contain colons
      let ipHash = parts[0];
      let hardwareFingerprint = parts[1];
      let persistentId = parts.slice(2).join('-');
      
      // Special handling for IPv6 addresses like ::1
      if (parts[0] === '::1' || parts[0].includes(':')) {
        ipHash = parts[0];
        hardwareFingerprint = parts[1];
        persistentId = parts.slice(2).join('-');
      }
      
      return {
        deviceId,
        ipHash,
        hardwareFingerprint,
        persistentId,
        timestamp: Date.now()
      };
    }
  }
  
  // Fallback for non-hybrid device IDs (old UUID format)
  return {
    deviceId,
    ipHash: 'unknown',
    hardwareFingerprint: 'unknown',
    persistentId: 'unknown',
    timestamp: Date.now()
  };
}

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

    // Compare device IDs using hybrid comparison
    const currentIp = getClientIp(req);
    
    // Parse stored device ID to extract components
    const storedDeviceComponents = parseHybridDeviceId(storedDeviceId);
    const currentDeviceComponents = parseHybridDeviceId(deviceId);
    
    // Special handling for old UUID format device IDs
    let device_ok = false;
    
    if (storedDeviceId.startsWith('hybrid-') && deviceId.startsWith('hybrid-')) {
      // Both are hybrid format - use normal comparison
      device_ok = compareHybridDeviceIds(storedDeviceComponents, currentDeviceComponents);
    } else if (!storedDeviceId.startsWith('hybrid-') && deviceId.startsWith('hybrid-')) {
      // Stored is old UUID, current is hybrid - this is a migration case
      // For now, we'll allow this and update the stored device ID
      console.log("[LOGIN_VERIFY_DEVICE] Migrating from old UUID to hybrid device ID");
      device_ok = true; // Allow login and we'll update the stored ID
    } else {
      // Both are old format or other cases
      device_ok = storedDeviceId === deviceId;
    }
    
    console.log("[LOGIN_VERIFY_DEVICE] Device comparison:", { 
      storedDeviceId, 
      currentDeviceId: deviceId, 
      currentIp,
      storedComponents: storedDeviceComponents,
      currentComponents: currentDeviceComponents,
      device_ok 
    });

    if (!device_ok) {
      console.log("[LOGIN_VERIFY_DEVICE] Device mismatch - triggering OTP");
      return NextResponse.json({ device_ok: false, action: "send_email_otp", email: email || undefined }, { status: 200 });
    }

    // If this was a migration case, update the stored device ID
    if (!storedDeviceId.startsWith('hybrid-') && deviceId.startsWith('hybrid-')) {
      try {
        console.log("[LOGIN_VERIFY_DEVICE] Updating stored device ID to hybrid format");
        await supabase
          .from("user_info_events")
          .update({
            event_data: {
              ...signupEvent.event_data,
              device_id: deviceId
            }
          })
          .eq("id", signupEvent.id);
        console.log("[LOGIN_VERIFY_DEVICE] Successfully updated device ID in database");
      } catch (updateError) {
        console.warn("[LOGIN_VERIFY_DEVICE] Failed to update device ID:", updateError);
        // Don't fail the login for this
      }
    }

    console.log("[LOGIN_VERIFY_DEVICE] Device verified successfully");
    return NextResponse.json({ device_ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[LOGIN_VERIFY_DEVICE_ERROR]", e.message);
    return NextResponse.json({ device_ok: false, error: "Internal server error" }, { status: 500 });
  }
}


