import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserListItem {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
  createdAt: string;            // from auth.users.created_at
  lastLoginAt?: string | null;  // from user_info_events (fallback last_sign_in_at)
  phoneNumber?: string | null;  // from profiles.phone_number
}

export interface UserListResponse {
  ok: boolean;
  users?: UserListItem[];
  totals?: {
    total: number;
    active: number;
    idle: number;
    admins: number;
  };
  error?: string;
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

export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const serviceClient = createServiceClient();

    // 1) Auth users (paged)
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 200;
    let hasMore = true;

    while (hasMore) {
      const { data: users, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
      if (error) return NextResponse.json({ ok: false, error: 'FAILED_TO_FETCH_USERS' }, { status: 500 });

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
      .select('id, display_name, phone_number')
      .in('id', ids);

    const profileByUserId = new Map(
      (profiles ?? []).map(p => [p.id, { phone: p.phone_number ?? null, name: p.display_name ?? null }])
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

    const users: UserListItem[] = allUsers.map(u => {
      const p = profileByUserId.get(u.id);
      const lastLoginAt = lastLoginByUserId.get(u.id) ?? u.last_sign_in_at ?? null;
      const createdAt = u.created_at; // always present
      const role = resolveRole(u.email); // existing helper
      
      // Force Active for current user
      let status = calculateStatus(lastLoginAt);
      if (u.email === email) {
        status = 'Active';
      }

      return {
        id: u.id,
        email: u.email,
        displayName: p?.name ?? undefined,
        role,
        status,
        createdAt,
        lastLoginAt,
        phoneNumber: p?.phone ?? null,
      };
    });

    const totals = {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      idle: users.filter(u => u.status === 'Idle').length,
      admins: users.filter(u => u.role === 'admin').length,
    };

    return NextResponse.json({ ok: true, users, totals }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error in /api/users/list:', error);
    return NextResponse.json({ ok: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}