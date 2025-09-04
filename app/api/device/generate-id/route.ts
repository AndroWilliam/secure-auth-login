export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateHybridDeviceId, getClientIp } from "@/lib/utils/hybrid-device-id";

export async function POST(req: NextRequest) {
  try {
    console.log("[GENERATE_DEVICE_ID] POST request received");
    
    // Get client IP address
    const clientIp = getClientIp(req);
    console.log("[GENERATE_DEVICE_ID] Client IP:", clientIp);
    
    // Generate hybrid device ID
    const hybridDeviceId = generateHybridDeviceId(clientIp);
    console.log("[GENERATE_DEVICE_ID] Generated hybrid device ID:", hybridDeviceId);
    
    return NextResponse.json({ 
      deviceId: hybridDeviceId.deviceId, // This is the hardware fingerprint
      ipAddress: hybridDeviceId.ipAddress, // Collected for future use
      timestamp: hybridDeviceId.timestamp, // Collected for future use
      hardwareFingerprint: hybridDeviceId.hardwareFingerprint // Same as deviceId
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("[GENERATE_DEVICE_ID_ERROR]", error.message);
    return NextResponse.json({ error: "Failed to generate device ID" }, { status: 500 });
  }
}
