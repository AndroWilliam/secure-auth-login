import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/session";
import { resolveRole } from "@/lib/roles";

export interface UserListItem {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;            // auth.users.created_at
  lastLoginAt?: string | null;  // auth.users.last_sign_in_at
  phone?: string | null;        // public.profiles.phone_number
  role: 'admin' | 'viewer' | 'moderator';
  status: 'Active' | 'Idle' | 'Inactive';
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

    // 2) Fetch profiles for these users
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, display_name, phone_number')
      .in('id', ids);

    const profileById = new Map<string, { phone_number: string | null; display_name: string | null }>();
    (profiles || []).forEach(p => profileById.set(p.id, { 
      phone_number: p.phone_number || null,
      display_name: p.display_name || null
    }));

    const users: UserListItem[] = allUsers.map(user => {
      const profile = profileById.get(user.id);
      const phone = profile?.phone_number ?? null;
      const role = resolveRole(user.email);
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