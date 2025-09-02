// lib/supabase/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !key) return response; // don’t break pages locally when envs are missing

  // Avoid hard dependency on @supabase/ssr at build time (module may be missing in some envs)
  try {
    const { createServerClient } = await import("@supabase/ssr");

    const supabase = createServerClient(url, key, {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        // Cast to any to satisfy differing type shapes between Next.js and @supabase/ssr
        set: ((name: string, value: string, options?: any) => response.cookies.set({ name, value, ...options })) as any,
        remove: ((name: string, options?: any) => response.cookies.delete({ name, ...options })) as any,
      } as any,
    });

    // Refresh session cookies when needed
    await supabase.auth.getUser();
  } catch {
    // If the module is unavailable, skip silently
  }

  return response;
}