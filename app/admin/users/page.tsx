import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, Eye } from "lucide-react";
import { mockUserStats } from "@/lib/mock-data/users";

async function getUserStats() {
  // Return mock stats for now
  return mockUserStats;
}

async function getUserRole() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Special case for admin user - allow access even without profile
  if (user.email === "androa687@gmail.com") {
    return "admin" as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !['admin', 'moderator', 'viewer'].includes(profile.role)) {
    redirect("/dashboard");
  }

  return profile.role as 'admin' | 'moderator' | 'viewer';
}

export default async function UserManagementPage() {
  const userRole = await getUserRole();
  const stats = await getUserStats();

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-300 mt-1">
              Manage user accounts and permissions
              <Badge className="ml-2 bg-gray-700 text-white">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Access
              </Badge>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && userRole !== 'viewer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.total_users}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.active_users}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Admins
                </CardTitle>
                <Shield className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{stats.admins}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Moderators
                </CardTitle>
                <Eye className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">{stats.moderators}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role-based Information */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-700">
                {userRole === 'admin' && <Shield className="w-5 h-5 text-white" />}
                {userRole === 'moderator' && <Users className="w-5 h-5 text-white" />}
                {userRole === 'viewer' && <Eye className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {userRole === 'admin' && 'Administrator Access'}
                  {userRole === 'moderator' && 'Moderator Access'}
                  {userRole === 'viewer' && 'Viewer Access'}
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  {userRole === 'admin' && 'You can add, edit, and delete users directly. All changes take effect immediately.'}
                  {userRole === 'moderator' && 'You can submit requests to add, edit, or delete users. These requests require admin approval.'}
                  {userRole === 'viewer' && 'You can view user status and activity information only. No modification permissions.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <UserManagementTable userRole={userRole} />
      </div>
    </div>
  );
}
