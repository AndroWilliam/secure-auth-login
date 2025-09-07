import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const serviceClient = await createServiceClient();
    
    // Get the user by email using admin API
    const { data: users, error: userError } = await serviceClient.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: "Failed to list users", details: userError.message }, { status: 500 });
    }

    const adminUser = users.users.find(u => u.email === "androa687@gmail.com");
    
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Check if profile exists
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", adminUser.id)
      .single();

    let result;
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await serviceClient
        .from("profiles")
        .update({ 
          role: "admin",
          updated_at: new Date().toISOString()
        })
        .eq("id", adminUser.id)
        .select();
      
      result = { action: "updated", data, error };
    } else {
      // Create new profile
      const { data, error } = await serviceClient
        .from("profiles")
        .insert({ 
          id: adminUser.id,
          full_name: adminUser.user_metadata?.full_name || "Admin User",
          email: adminUser.email,
          role: "admin"
        })
        .select();
      
      result = { action: "created", data, error };
    }

    if (result.error) {
      return NextResponse.json({ 
        error: `Failed to ${result.action} profile`, 
        details: result.error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      profile: result.data?.[0],
      adminUserId: adminUser.id
    });
    
  } catch (error) {
    console.error("Fix admin error:", error);
    return NextResponse.json({ 
      error: "Failed to fix admin role",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
