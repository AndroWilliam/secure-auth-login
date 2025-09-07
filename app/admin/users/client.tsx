"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Eye, UserCheck, Clock } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { getUserStats } from "@/lib/admin/mockApi";
import { initPresence, startHeartbeat } from "@/lib/admin/presenceMock";
import { mockUsers } from "@/lib/admin/test-data";

interface AdminUsersPageClientProps {
  userRole: 'admin' | 'moderator' | 'viewer';
}

export function AdminUsersPageClient({ userRole }: AdminUsersPageClientProps) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    inactive: 0,
    admins: 0,
    moderators: 0,
    viewers: 0
  });

  // Initialize presence system and fetch stats
  useEffect(() => {
    const initializeData = async () => {
      // Initialize presence with mock users
      initPresence(mockUsers);
      
      // Start heartbeat for real-time updates
      startHeartbeat(30000); // 30 seconds
      
      // Fetch user statistics
      try {
        const result = await getUserStats();
        if (result.ok) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    initializeData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-300">Manage user accounts and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Idle Users</p>
                  <p className="text-2xl font-bold text-white">{stats.idle}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm font-medium">Admins</p>
                  <p className="text-2xl font-bold text-white">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Info Card */}
        <Card className="bg-black border-gray-800 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-700 p-3 rounded-full">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {userRole === 'admin' ? 'Administrator Access' : 'Moderator Access'}
                </h3>
                <p className="text-gray-300">
                  {userRole === 'admin' 
                    ? 'You can add, edit, and delete users directly. All changes take effect immediately.'
                    : 'You can view users and submit change requests for admin approval.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <AdminUsersTable userRole={userRole} />
      </div>
    </div>
  );
}
