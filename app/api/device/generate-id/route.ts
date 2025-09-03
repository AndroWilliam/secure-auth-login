export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateIpBasedDeviceId, getClientIp } from "@/lib/utils/ip-device-id";

export async function POST(req: NextRequest) {
  try {
    console.log("[GENERATE_DEVICE_ID] POST request received");
    
    // Get client IP address
    const clientIp = getClientIp(req);
    console.log("[GENERATE_DEVICE_ID] Client IP:", clientIp);
    
    // Generate IP-based device ID
    const deviceId = generateIpBasedDeviceId(clientIp);
    console.log("[GENERATE_DEVICE_ID] Generated device ID:", deviceId);
    
    return NextResponse.json({ 
      deviceId,
      ip: clientIp,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("[GENERATE_DEVICE_ID_ERROR]", error.message);
    return NextResponse.json({ error: "Failed to generate device ID" }, { status: 500 });
  }
}
