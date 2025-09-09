import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string | null;
  role: 'admin' | 'viewer';
  status: 'Active' | 'Idle' | 'Inactive';
  displayName?: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totals: {
    total: number;
    active: number;
    idle: number;
    admins: number;
  };
}

function calculateStatus(lastSignInAt: string | null | undefined): 'Active' | 'Idle' | 'Inactive' {
  if (!lastSignInAt) return 'Inactive';
  
  const now = new Date();
  const lastSignIn = new Date(lastSignInAt);
  const diffMinutes = (now.getTime() - lastSignIn.getTime()) / (1000 * 60);
  
  if (diffMinutes <= 5) return 'Active';
  if (diffMinutes <= 30) return 'Idle';
  return 'Inactive';
}

function getDisplayName(email: string, profilesData?: any): string {
  // If we have profile data with display_name, use it
  if (profilesData?.display_name) {
    return profilesData.display_name;
  }
  
  // Otherwise, extract name from email local part
  const localPart = email.split('@')[0];
  return localPart
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Check if user is admin
    if (user.email !== 'androa687@gmail.com') {
      return NextResponse.json({
        success: false,
        error: "Admin access required"
      }, { status: 403 });
    }

    // Get service client for admin operations
    const serviceClient = createServiceClient();
    
    // Fetch all users using pagination
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 200;
    let hasMore = true;

    while (hasMore) {
      const { data: users, error } = await serviceClient.auth.admin.listUsers({
        page,
        perPage
      });

      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to fetch users"
        }, { status: 500 });
      }

      if (users && users.users.length > 0) {
        allUsers.push(...users.users);
        page++;
      } else {
        hasMore = false;
      }
    }

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = allUsers.map(user => {
      const role: 'admin' | 'viewer' = user.email === 'androa687@gmail.com' ? 'admin' : 'viewer';
      const status = calculateStatus(user.last_sign_in_at);
      const displayName = getDisplayName(user.email);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        role,
        status,
        displayName
      };
    });

    // Calculate totals
    const totals = {
      total: adminUsers.length,
      active: adminUsers.filter(user => user.status === 'Active').length,
      idle: adminUsers.filter(user => user.status === 'Idle').length,
      admins: adminUsers.filter(user => user.role === 'admin').length
    };

    const response: AdminUsersResponse = {
      users: adminUsers,
      totals
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}