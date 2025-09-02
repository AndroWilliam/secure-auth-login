// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createClient as createServiceSupabaseClient } from "@supabase/supabase-js";

// public envs for anon client
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLIC_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// service-role envs for admin ops (no cookies)
const SERVICE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Use this from Route Handlers / Server Actions to get an authed client that writes auth cookies */
export async function createServerClient() {
  const cookieStore = await cookies();

  try {
    // Lazy import to avoid build-time module resolution errors if @supabase/ssr isn't installed
    const { createServerClient } = await import("@supabase/ssr");

    return createServerClient(PUBLIC_URL, PUBLIC_ANON, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options?: any) {
          cookieStore.delete({ name, ...options } as any);
        },
      },
    });
  } catch (error) {
    console.error("Failed to create Supabase server client:", error);
    throw new Error("Supabase client initialization failed. Please check your environment variables and dependencies.");
  }
}

/** Use this only for admin tasks (no cookies, service key) */
export function createServiceClient() {
  try {
    return createServiceSupabaseClient(SERVICE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  } catch (error) {
    console.error("Failed to create Supabase service client:", error);
    throw new Error("Supabase service client initialization failed. Please check your environment variables.");
  }
}