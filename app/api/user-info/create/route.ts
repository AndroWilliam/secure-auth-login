import { NextResponse, type NextRequest } from "next/server"
import { SecureHash } from "@/lib/utils/crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Hash password on server if present
    const password = body?.user_password_hash as string | undefined
    const hashed = password ? SecureHash.hashSensitiveData(password) : undefined

    const record = {
      ...body,
      user_password_hash: hashed?.hash ?? null,
      user_password_salt: hashed?.salt ?? null,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    }

    console.log("[v0] user-info/create received:", {
      hasPassword: Boolean(password),
      device_id: record.device_id,
      geo_location: record.geo_location,
    })

    // For preview, we don't persist. Respond success.
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "unknown" }, { status: 500 })
  }
}



