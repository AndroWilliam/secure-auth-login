import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminUsersPageClient } from "./client";

async function getUserRole() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Special case for admin user
  if (user.email === "androa687@gmail.com") {
    return "admin" as const;
  }

  // Check user profile for role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile error:", profileError);
    return "viewer" as const;
  }

  return (profile.role || "viewer") as "admin" | "moderator" | "viewer";
}

export default async function AdminUsersPage() {
  const userRole = await getUserRole();

  if (userRole === "viewer") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <AdminUsersPageClient userRole={userRole} />;
}