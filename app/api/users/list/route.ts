import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserListItem {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string | null;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
  displayName?: string;
  phone?: string | null;
  lastLoginIp?: string | null;
  lastLoginDeviceId?: string | null;
  lastLoginLocation?: {
    city?: string | null;
    country?: string | null;
  } | null;
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

    // 2) Batch fetch profiles + latest login events
    const [{ data: profiles }, { data: latestLogins }] = await Promise.all([
      serviceClient.from("profiles").select("id, display_name, phone_number").in("id", ids),
      serviceClient.rpc('get_latest_login_events', { user_ids: ids }),
    ]);

    const pMap = new Map<string, any>((profiles ?? []).map(p => [p.id, p]));
    const lMap = new Map<string, any>((latestLogins ?? []).map((l: any) => [l.user_id, l]));

    const users: UserListItem[] = allUsers.map(user => {
      const prof = pMap.get(user.id);
      const login = lMap.get(user.id);
      const role = resolveRole(user.email);
      const displayName = prof?.display_name || humanNameFromEmail(user.email);
      const phone = prof?.phone_number ?? null;

      // Force Active status for current user
      const isCurrentUser = user.email === email;
      const status = isCurrentUser ? 'Active' : computeStatus(login?.last_login_at, user.last_sign_in_at);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        lastLoginAt: login?.last_login_at ?? user.last_sign_in_at ?? null,
        lastSeenAt: null, // Not using sessions for now
        role,
        status,
        displayName,
        phone,
        lastLoginIp: login?.last_ip ?? null,
        lastLoginDeviceId: login?.last_device_id ?? null,
        lastLoginLocation: login?.last_city || login?.last_country ? {
          city: login?.last_city ?? null,
          country: login?.last_country ?? null,
        } : null,
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