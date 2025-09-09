import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail, getSessionRole } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;            // auth.users.created_at
  lastLoginAt?: string | null;  // auth.users.last_sign_in_at
  phone?: string | null;        // public.profiles.phone_number
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
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

function computeStatus(lastSeenAt?: string | null, lastSignInAt?: string | null): 'Active' | 'Idle' | 'Inactive' {
  const ref = lastSeenAt ?? lastSignInAt;
  if (!ref) return 'Inactive';
  const deltaMin = (Date.now() - new Date(ref).getTime()) / 60000;
  if (deltaMin <= 5) return 'Active';
  if (deltaMin <= 30) return 'Idle';
  return 'Inactive';
}

function humanNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  return local.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const email = await getSessionEmail();
    if (!email) {
      console.log('GET /api/admin/users: No authenticated user');
      return NextResponse.json({ 
        ok: false, 
        error: "UNAUTHORIZED" 
      }, { status: 401 });
    }

    // Check if user is admin
    const role = resolveRole(email);
    if (role !== 'admin') {
      console.log(`GET /api/admin/users: User ${email} is not admin (role: ${role})`);
      return NextResponse.json({
        ok: false,
        error: "FORBIDDEN"
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
        console.error("Error fetching users in /api/admin/users:", error);
        return NextResponse.json({
          ok: false,
          error: "FAILED_TO_FETCH_USERS"
        }, { status: 500 });
      }

      if (users && users.users.length > 0) {
        allUsers.push(...users.users);
        page++;
      } else {
        hasMore = false;
      }
    }

    const ids = allUsers.map(u => u.id);

    // Fetch profiles for these users
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, display_name, phone_number')
      .in('id', ids);

    const profileById = new Map<string, { phone_number: string | null; display_name: string | null }>();
    (profiles || []).forEach(p => profileById.set(p.id, { 
      phone_number: p.phone_number || null,
      display_name: p.display_name || null
    }));

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = allUsers.map(user => {
      const profile = profileById.get(user.id);
      const phone = profile?.phone_number ?? null;
      const role: 'admin' | 'viewer' | 'moderator' = resolveRole(user.email);
      const displayName = profile?.display_name || humanNameFromEmail(user.email);
      
      // Force Active for current user
      let status = computeStatus(user.last_sign_in_at);
      if (user.email === email) {
        status = 'Active';
      }

      return {
        id: user.id,
        email: user.email,
        displayName,
        createdAt: user.created_at,
        lastLoginAt: user.last_sign_in_at ?? null,
        phone,
        role,
        status,
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

    return NextResponse.json({
      ok: true,
      ...response
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error("Error in admin users API:", error);
    return NextResponse.json({
      ok: false,
      error: "INTERNAL_SERVER_ERROR"
    }, { status: 500 });
  }
}