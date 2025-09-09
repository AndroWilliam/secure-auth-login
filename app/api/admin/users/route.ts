import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail, getSessionRole } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string | null;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
  displayName?: string;
  phoneNumber?: string | null;
  security?: {
    ip?: string | null;
    deviceFingerprint?: string | null;
    location?: any | null;
  }
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

    // Batch fetch profiles + sessions
    const [{ data: profiles }, { data: sessions }] = await Promise.all([
      serviceClient.from("profiles").select("id, display_name, phone_number").in("id", ids),
      serviceClient.from("user_sessions").select("*").in("user_id", ids),
    ]);

    const pMap = new Map<string, any>((profiles ?? []).map(p => [p.id, p]));
    const sMap = new Map<string, any>((sessions ?? []).map(s => [s.user_id, s]));

    // Transform users to AdminUser format
    const adminUsers: AdminUser[] = allUsers.map(user => {
      const prof = pMap.get(user.id);
      const sess = sMap.get(user.id);
      
      // Use profile role if available, otherwise resolve from email
      const role: 'admin' | 'viewer' = prof?.role || resolveRole(user.email);
      const status = computeStatus(sess?.last_seen_at, user.last_sign_in_at);
      const displayName = prof?.display_name || humanNameFromEmail(user.email);
      const phoneNumber = prof?.phone_number ?? null;

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        lastLoginAt: sess?.last_login_at ?? user.last_sign_in_at ?? null,
        lastSeenAt: sess?.last_seen_at ?? null,
        role,
        status,
        displayName,
        phoneNumber,
        security: {
          ip: sess?.last_ip ?? null,
          deviceFingerprint: sess?.last_device_fingerprint ?? null,
          location: sess?.last_location ?? null,
        }
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