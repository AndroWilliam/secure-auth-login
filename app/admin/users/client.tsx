"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Eye, UserCheck, Clock } from "lucide-react";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { AdminUser, AdminUsersResponse } from "@/app/api/admin/users/route";
import { UserListItem, UserListResponse } from "@/app/api/users/list/route";
import { UserRole } from "@/lib/roles";

interface AdminUsersPageClientProps {
  userRole: UserRole;
}

export function AdminUsersPageClient({ userRole }: AdminUsersPageClientProps) {
  const [data, setData] = useState<AdminUsersResponse | UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>(userRole);

  // Fetch role and data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, get current user role
        const roleResponse = await fetch('/api/me', { cache: 'no-store' });
        let role = userRole; // fallback to prop
        
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          if (roleData.ok) {
            role = roleData.role;
            setCurrentRole(role);
            console.log('Current user role:', role);
          }
        }

        // Choose API endpoint based on role
        const apiPath = role === 'admin' ? '/api/admin/users' : '/api/users/list';
        console.log('Fetching data from:', apiPath);

        const response = await fetch(apiPath, { cache: 'no-store' });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log('API error response:', response.status, errorData);
          
          if (response.status === 401) {
            setError('Please log in to view this page');
          } else if (response.status === 403) {
            setError('Access denied. Admin privileges required for this action.');
          } else {
            setError('Failed to fetch user data');
          }
          return;
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (!result.ok) {
          setError(result.error || 'Failed to fetch user data');
          return;
        }
        
        setData(result);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

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
                  <p className="text-2xl font-bold text-white">{data.totals?.total || 0}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals?.active || 0}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals?.idle || 0}</p>
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
                  <p className="text-2xl font-bold text-white">{data.totals?.admins || 0}</p>
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
                  {currentRole === 'admin' ? 'Administrator Access' : 
                   currentRole === 'moderator' ? 'Moderator Access' : 'Viewer Access'}
                </h3>
                <p className="text-gray-300">
                  {currentRole === 'admin' 
                    ? 'You can add, edit, and delete users directly. All changes take effect immediately.'
                    : currentRole === 'moderator'
                    ? 'You can view users and submit change requests for admin approval.'
                    : 'You can view user information only. No modification permissions.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <ErrorBoundary>
          <AdminUsersTable 
            userRole={currentRole} 
            users={data.users}
            onRefresh={() => window.location.reload()}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
