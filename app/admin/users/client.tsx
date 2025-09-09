"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Eye, UserCheck, Clock } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminUser, AdminUsersResponse } from "@/app/api/admin/users/route";

interface AdminUsersPageClientProps {
  userRole: 'admin' | 'moderator' | 'viewer';
}

export function AdminUsersPageClient({ userRole }: AdminUsersPageClientProps) {
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('Access denied. Admin privileges required.');
          } else {
            setError('Failed to fetch user data');
          }
          return;
        }
        
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-300">No data available</p>
      </div>
    );
  }

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
                  <p className="text-2xl font-bold text-white">{data.totals.total}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals.active}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals.idle}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals.admins}</p>
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
        <AdminUsersTable 
          userRole={userRole} 
          users={data.users}
          onRefresh={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
