import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail, getSessionRole } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
  createdAt: string;            // from auth.users.created_at
  lastLoginAt?: string | null;  // from user_info_events (fallback last_sign_in_at)
  phoneNumber?: string | null;  // from profiles.phone_number
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

    // 2) Profiles (phone/display name)
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('uuid, display_name, phone_number')
      .in('uuid', ids);

    const profileByUserId = new Map(
      (profiles ?? []).map(p => [p.uuid, { phone: p.phone_number ?? null, name: p.display_name ?? null }])
    );

    // 3) Latest login events
    const { data: rawEvents } = await serviceClient
      .from('user_info_events')
      .select('user_id, event_type, created_at')
      .in('user_id', ids)
      .in('event_type', ['login_attempt','login_completed','login_success'])
      .order('created_at', { ascending: false });

    const lastLoginByUserId = new Map<string, string>();
    for (const e of rawEvents ?? []) {
      if (!lastLoginByUserId.has(e.user_id)) {
        lastLoginByUserId.set(e.user_id, e.created_at);
      }
    }

    // 4) Build rows
    function calculateStatus(lastIso: string | null | undefined): 'Active'|'Idle'|'Inactive' {
      if (!lastIso) return 'Inactive';
      const deltaMin = (Date.now() - new Date(lastIso).getTime()) / 60000;
      if (deltaMin <= 5) return 'Active';
      if (deltaMin <= 30) return 'Idle';
      return 'Inactive';
    }

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = allUsers.map(user => {
      const p = profileByUserId.get(user.id);
      const lastLoginAt = lastLoginByUserId.get(user.id) ?? user.last_sign_in_at ?? null;
      const createdAt = user.created_at; // always present
      const role: 'admin' | 'viewer' | 'moderator' = resolveRole(user.email);
      
      // Force Active for current user
      let status = calculateStatus(lastLoginAt);
      if (user.email === email) {
        status = 'Active';
      }

      return {
        id: user.id,
        email: user.email,
        displayName: p?.name ?? undefined,
        role,
        status,
        createdAt,
        lastLoginAt,
        phoneNumber: p?.phone ?? null,
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