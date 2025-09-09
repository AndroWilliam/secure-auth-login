"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditUserDialog } from "./EditUserDialog";
import { UserRow, UserStatus } from "@/lib/admin/types";
import { listUsers, deleteUser } from "@/lib/admin/mockApi";
import { getStatus, simulateIdle, forceLogout, resetToActive, subscribe } from "@/lib/admin/presenceMock";
import { Trash2, Edit, MoreHorizontal, Search, Plus, Users, Shield, Eye, Clock, UserX, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ExportUsersButton } from "./ExportUsersButton";
import { AddUserButton } from "./AddUserButton";
import { AdminUser } from "@/app/api/admin/users/route";

interface AdminUsersTableProps {
  userRole: 'admin' | 'moderator' | 'viewer';
  users?: AdminUser[];
  onRefresh?: () => void;
}

export function AdminUsersTable({ userRole, users: realUsers, onRefresh }: AdminUsersTableProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Convert AdminUser to UserRow format
  const convertAdminUserToUserRow = (adminUser: AdminUser): UserRow => ({
    id: adminUser.id,
    email: adminUser.email,
    full_name: adminUser.displayName || null,
    phone: null, // Not available in auth users
    role: adminUser.role,
    status: adminUser.status.toLowerCase() as UserStatus,
    created_at: adminUser.createdAt,
    updated_at: adminUser.lastSignInAt || adminUser.createdAt
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (realUsers) {
        // Use real data from props
        let filteredUsers = realUsers.map(convertAdminUserToUserRow);
        
        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter(user =>
            user.full_name?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply role filter
        if (roleFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }
        
        // Apply pagination
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        setTotalPages(Math.ceil(filteredUsers.length / 10));
      } else {
        // Fallback to mock data
        const result = await listUsers({
          page,
          pageSize: 10,
          search: search || undefined,
          roleFilter: roleFilter !== 'all' ? roleFilter : undefined,
          statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        });

        if (result.ok) {
          setUsers(result.data.rows);
          setTotalPages(Math.ceil(result.data.total / 10));
        } else {
          toast.error(result.error || "Failed to fetch users");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to presence changes
  useEffect(() => {
    const unsubscribe = subscribe((userId, status) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status } : user
        )
      );
    });

    return unsubscribe;
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter, realUsers]);

  const handleEditUser = (user: UserRow) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = async (user: UserRow) => {
    if (userRole !== 'admin') {
      toast.error("Admin access required to delete users");
      return;
    }

    try {
      const result = await deleteUser(user.id);
      if (result.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleUserSaved = () => {
    fetchUsers();
  };

  const handleApproveInvite = async (userId: string) => {
    try {
      const response = await fetch('/api/invitations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to approve invitation");
      }
    } catch (error) {
      console.error("Error approving invitation:", error);
      toast.error("Failed to approve invitation");
    }
  };

  const handleRejectInvite = async (userId: string) => {
    try {
      const response = await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to reject invitation");
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Failed to reject invitation");
    }
  };

  // Get all filtered rows for export (not just paginated)
  const getAllRows = async () => {
    try {
      if (realUsers) {
        // Use real data from props
        let filteredUsers = realUsers.map(convertAdminUserToUserRow);
        
        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = filteredUsers.filter(user =>
            user.full_name?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply role filter
        if (roleFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }
        
        return filteredUsers;
      } else {
        // Fallback to mock data
        const result = await listUsers({
          page: 1,
          pageSize: 1000, // Large number to get all results
          search: search || undefined,
          roleFilter: roleFilter !== 'all' ? roleFilter : undefined,
          statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        });

        if (result.ok) {
          return result.data.rows;
        } else {
          console.error('Failed to fetch all users for export:', result.error);
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching all users for export:', error);
      return [];
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-800 text-green-200';
      case 'idle': return 'bg-yellow-800 text-yellow-200';
      case 'inactive': return 'bg-red-800 text-red-200';
      case 'inviting': return 'bg-yellow-600 text-yellow-100';
      case 'invited': return 'bg-blue-800 text-blue-200';
      case 'rejected': return 'bg-gray-600 text-gray-200';
      default: return 'bg-gray-800 text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-800 text-red-200';
      case 'moderator': return 'bg-blue-800 text-blue-200';
      case 'viewer': return 'bg-gray-800 text-gray-200';
      default: return 'bg-gray-800 text-gray-200';
    }
  };

  const canManageUsers = userRole === 'admin' || userRole === 'moderator';
  const canViewFullDetails = userRole !== 'viewer';

  return (
    <Card className="w-full bg-black border-gray-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-bold text-white">User Management</CardTitle>
          <div className="flex flex-wrap gap-2">
            <ExportUsersButton 
              getAllRows={getAllRows}
              title="User Management Export"
            />
            {canManageUsers && (
              <AddUserButton 
                currentUserRole={userRole}
                onUserAdded={fetchUsers}
              />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Roles</SelectItem>
              <SelectItem value="admin" className="text-white hover:bg-gray-700">Admin</SelectItem>
              <SelectItem value="moderator" className="text-white hover:bg-gray-700">Moderator</SelectItem>
              <SelectItem value="viewer" className="text-white hover:bg-gray-700">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
              <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
              <SelectItem value="idle" className="text-white hover:bg-gray-700">Idle</SelectItem>
              <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 font-medium text-gray-300">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Name</th>
                {canViewFullDetails && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Date Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-300">Role</th>
                  </>
                )}
                <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canViewFullDetails ? 6 : 4} className="py-8 text-center text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={canViewFullDetails ? 6 : 4} className="py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-700 text-gray-200">
                            {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    {canViewFullDetails && (
                      <>
                        <td className="py-4 px-4 text-sm text-gray-300">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </td>
                      </>
                    )}
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {/* Approve/Reject buttons for inviting status */}
                        {user.status === 'inviting' && userRole === 'admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApproveInvite(user.id)}
                              className="h-8 w-8 p-0 hover:bg-green-700"
                              title="Approve invitation"
                            >
                              <Check className="h-4 w-4 text-green-300" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectInvite(user.id)}
                              className="h-8 w-8 p-0 hover:bg-red-700"
                              title="Reject invitation"
                            >
                              <X className="h-4 w-4 text-red-300" />
                            </Button>
                          </>
                        )}

                        {/* Edit/Delete buttons for regular users */}
                        {user.status !== 'inviting' && canManageUsers && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 p-0 hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4 text-gray-300" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-700"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-300" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black border-gray-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Are you sure you want to delete {user.full_name || user.email}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        {/* Presence Controls (Dev Only) */}
                        {process.env.NODE_ENV === 'development' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-700"
                              >
                                <MoreHorizontal className="h-4 w-4 text-gray-300" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-600">
                              <DropdownMenuItem
                                onClick={() => resetToActive(user.id)}
                                className="text-white hover:bg-gray-700"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => simulateIdle(user.id)}
                                className="text-white hover:bg-gray-700"
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Simulate Idle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => forceLogout(user.id)}
                                className="text-white hover:bg-gray-700"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Force Logout
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedUser(null);
        }}
        onSaved={handleUserSaved}
      />
    </Card>
  );
}
