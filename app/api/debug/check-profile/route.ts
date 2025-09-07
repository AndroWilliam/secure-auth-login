import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, updated_at")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      hasProfile: !!profile,
      hasRole: !!profile?.role
    });
    
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json({ 
      error: "Failed to check profile",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
