import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, Eye } from "lucide-react";

async function getUserStats() {
  const supabase = createClient();
  
  const { data: stats, error } = await supabase
    .rpc('get_user_stats');

  if (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }

  return stats?.[0] || null;
}

async function getUserRole() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage user accounts and permissions
              <Badge className="ml-2 bg-blue-100 text-blue-800">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Access
              </Badge>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && userRole !== 'viewer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Admins
                </CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Moderators
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.moderators}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role-based Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                {userRole === 'admin' && <Shield className="w-5 h-5 text-blue-600" />}
                {userRole === 'moderator' && <Users className="w-5 h-5 text-blue-600" />}
                {userRole === 'viewer' && <Eye className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {userRole === 'admin' && 'Administrator Access'}
                  {userRole === 'moderator' && 'Moderator Access'}
                  {userRole === 'viewer' && 'Viewer Access'}
                </h3>
                <p className="text-blue-700 text-sm mt-1">
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
