import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminUsersPageClient } from "./client";
import { resolveRole, UserRole } from "@/lib/roles";

async function getUserRole(): Promise<UserRole> {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  return resolveRole(user.email);
}

export default async function AdminUsersPage() {
  const userRole = await getUserRole();

  // Allow all authenticated users to access the page
  // Role-based permissions are handled in the client component
  return <AdminUsersPageClient userRole={userRole} />;
}