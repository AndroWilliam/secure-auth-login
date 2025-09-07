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
import { Trash2, Edit, MoreHorizontal, Search, FileDown, Plus, Users, Shield, Eye, Clock, UserX } from "lucide-react";
import { toast } from "sonner";

interface AdminUsersTableProps {
  userRole: 'admin' | 'moderator' | 'viewer';
}

export function AdminUsersTable({ userRole }: AdminUsersTableProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
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
  }, [page, search, roleFilter, statusFilter]);

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

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-800 text-green-200';
      case 'idle': return 'bg-yellow-800 text-yellow-200';
      case 'inactive': return 'bg-red-800 text-red-200';
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
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
            {canManageUsers && (
              <Button
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
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
                        {canManageUsers && (
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
