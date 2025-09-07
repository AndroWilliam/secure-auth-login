/**
 * Admin User Management Types
 * 
 * These types are designed to be 100% compatible with future Supabase integration.
 * All field names and types match the expected database schema.
 */

export type UserRole = 'viewer' | 'moderator' | 'admin';

export type UserStatus = 'active' | 'idle' | 'inactive';

export type UserRow = {
  id: string;                      // UUID - matches auth.users.id
  email: string;                   // matches auth.users.email
  full_name: string | null;        // matches profiles.display_name
  phone: string | null;            // matches profiles.phone_number
  role: UserRole;                  // matches profiles.role (enum)
  status: UserStatus;              // computed from presence data
  created_at: string;              // ISO timestamp - matches auth.users.created_at
  updated_at: string;              // ISO timestamp - matches profiles.updated_at
};

export type UserUpdateInput = {
  full_name?: string | null;
  phone?: string | null;
  role?: UserRole;
  prevUpdatedAt: string;           // optimistic concurrency control
};

export type ApiResult<T> = 
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: any };

export type ConflictDetail = {
  server: UserRow;
  client: UserUpdateInput;
  conflicts: Array<{
    field: keyof UserUpdateInput;
    serverValue: any;
    clientValue: any;
  }>;
};

export type PresenceData = {
  last_seen: Date;
  last_logout_at?: Date;
};

export type UserListResponse = {
  rows: UserRow[];
  total: number;
  page: number;
  pageSize: number;
};

// Future Supabase schema types (for documentation)
export type SupabaseProfile = {
  id: string;                      // UUID PK -> auth.users.id
  display_name: string | null;     // text
  phone_number: string | null;     // text
  role: UserRole;                  // user_role enum
  created_at: string;              // timestamptz default now()
  updated_at: string;              // timestamptz default now()
};

export type SupabaseUserPresence = {
  user_id: string;                 // UUID PK -> auth.users.id
  last_seen: string;               // timestamptz
  last_logout_at: string | null;   // timestamptz
  updated_at: string;              // timestamptz default now()
};

export type SupabaseUserManagementView = {
  id: string;                      // auth.users.id
  email: string;                   // auth.users.email
  display_name: string | null;     // profiles.display_name
  phone_number: string | null;     // profiles.phone_number
  role: UserRole;                  // profiles.role
  status: UserStatus;              // computed from presence
  created_at: string;              // auth.users.created_at
  updated_at: string;              // profiles.updated_at
  last_seen: string;               // user_presence.last_seen
  last_logout_at: string | null;   // user_presence.last_logout_at
};
