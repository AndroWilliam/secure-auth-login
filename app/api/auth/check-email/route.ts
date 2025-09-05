import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    console.log("[CHECK_EMAIL] Checking if email exists:", email)
    
    // Use service client to check if user exists
    const supabase = await createServiceClient()
    
    // Check in auth.users table using admin client
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error("[CHECK_EMAIL] Error listing users:", error)
      return NextResponse.json(
        { error: "Failed to check email" },
        { status: 500 }
      )
    }
    
    // Check if any user has this email
    const emailExists = users.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )
    
    console.log("[CHECK_EMAIL] Email exists:", emailExists)
    
    return NextResponse.json({ exists: emailExists })
    
  } catch (error) {
    console.error("[CHECK_EMAIL] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
