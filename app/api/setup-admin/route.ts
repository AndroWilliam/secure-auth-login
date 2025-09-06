export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Check if role column exists by trying to select it
    const { data: testProfile, error: columnCheckError } = await supabase
      .from("profiles")
      .select("role")
      .limit(1);

    console.log("[SETUP] Column check result:", { testProfile, columnCheckError });

    // Get admin user info
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(user => user.email === 'androa687@gmail.com');

    if (!adminUser) {
      return NextResponse.json({ 
        error: "Admin user androa687@gmail.com not found" 
      }, { status: 404 });
    }

    // If role column doesn't exist, return instructions for manual setup
    if (columnCheckError?.message?.includes('column "role" does not exist')) {
      return NextResponse.json({ 
        error: "Database not ready. Please run the SQL migration manually.",
        instructions: "Execute scripts/015_create_user_roles_system.sql in your Supabase dashboard",
        sql_file: "scripts/015_create_user_roles_system.sql",
        status: "migration_needed"
      }, { status: 400 });
    }

    // If role column exists, set admin role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: 'admin',
        is_active: true,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", adminUser.id);

    if (updateError) {
      console.error("[SETUP] Error setting admin role:", updateError);
      return NextResponse.json({ 
        error: "Failed to set admin role: " + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Admin role set successfully",
      adminUser: adminUser.email,
      status: "ready"
    });

  } catch (error: any) {
    console.error("[SETUP] Unexpected error:", error);
    return NextResponse.json({ 
      error: "Setup failed",
      details: error.message 
    }, { status: 500 });
  }
}
