"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, Search, Settings, Eye, FileDown } from "lucide-react";
import { toast } from "sonner";

interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'moderator' | 'viewer';
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

interface UserManagementTableProps {
  userRole: 'admin' | 'moderator' | 'viewer';
}

export function UserManagementTable({ userRole }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "viewer" as 'admin' | 'moderator' | 'viewer'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(roleFilter && roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter })
      });

      const response = await fetch(`/api/mock/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleAddUser = async () => {
    if (userRole !== 'admin') {
      // Moderators create requests
      try {
        const response = await fetch('/api/admin/user-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_type: 'add_user',
            request_data: newUser
          })
        });

        if (response.ok) {
          toast.success("User creation request submitted for admin approval");
          setShowAddDialog(false);
          setNewUser({ full_name: "", email: "", phone: "", password: "", role: "viewer" });
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to submit request");
        }
      } catch (error) {
        toast.error("Failed to submit request");
        console.error("Error submitting request:", error);
      }
      return;
    }

    // Admins create users directly
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast.success("User created successfully");
        setShowAddDialog(false);
        setNewUser({ full_name: "", email: "", phone: "", password: "", role: "viewer" });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Failed to create user");
      console.error("Error creating user:", error);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (userRole !== 'admin') {
      // Moderators create requests
      try {
        const response = await fetch('/api/admin/user-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_type: 'edit_user',
            request_data: {
              user_id: selectedUser.user_id,
              updates: {
                full_name: selectedUser.full_name,
                phone: selectedUser.phone,
                role: selectedUser.role,
                is_active: selectedUser.is_active
              }
            }
          })
        });

        if (response.ok) {
          toast.success("User edit request submitted for admin approval");
          setShowEditDialog(false);
          setSelectedUser(null);
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to submit request");
        }
      } catch (error) {
        toast.error("Failed to submit request");
        console.error("Error submitting request:", error);
      }
      return;
    }

    // Admins edit users directly
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: selectedUser.full_name,
          phone: selectedUser.phone,
          role: selectedUser.role,
          is_active: selectedUser.is_active
        })
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setShowEditDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (userRole !== 'admin') {
      // Moderators create requests
      try {
        const response = await fetch('/api/admin/user-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_type: 'delete_user',
            request_data: { user_id: user.user_id }
          })
        });

        if (response.ok) {
          toast.success("User deletion request submitted for admin approval");
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to submit request");
        }
      } catch (error) {
        toast.error("Failed to submit request");
        console.error("Error submitting request:", error);
      }
      return;
    }

    // Admins delete users directly
    try {
      const response = await fetch(`/api/admin/users/${user.user_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    }
  };

  const exportToExcel = () => {
    // Simple CSV export
    const headers = userRole === 'viewer' 
      ? ['Name', 'Role', 'Status', 'Last Active']
      : ['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Active', 'Created'];
    
    const rows = users.map(user => {
      const baseData = [
        user.full_name,
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        new Date(user.last_active_at).toLocaleDateString()
      ];
      
      if (userRole !== 'viewer') {
        return [
          user.full_name,
          user.email,
          user.phone || '',
          user.role,
          user.is_active ? 'Active' : 'Inactive',
          new Date(user.last_active_at).toLocaleDateString(),
          new Date(user.created_at).toLocaleDateString()
        ];
      }
      
      return baseData;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-800 text-red-200';
      case 'moderator': return 'bg-gray-700 text-gray-200';
      case 'viewer': return 'bg-green-800 text-green-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-800 text-green-200' 
      : 'bg-red-800 text-red-200';
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
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
            >
              <FileDown className="w-4 h-4" />
              Export to Excel
            </Button>
            {canManageUsers && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                    <Plus className="w-4 h-4" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      {userRole === 'admin' 
                        ? "Create a new user account directly."
                        : "Submit a request to add a new user. This will require admin approval."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>
                      {userRole === 'admin' ? 'Create User' : 'Submit Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
                {canManageUsers && (
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canViewFullDetails ? 6 : 3} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={canViewFullDetails ? 6 : 3} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.user_id} className="border-b border-gray-800 hover:bg-gray-900">
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-700 text-gray-200 text-sm">
                            {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{user.full_name}</div>
                          {canViewFullDetails && (
                            <div className="text-sm text-gray-400">{user.email}</div>
                          )}
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
                      <Badge className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canManageUsers && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditDialog(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {userRole === 'admin' ? 'Delete User' : 'Request User Deletion'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {userRole === 'admin' 
                                    ? `Are you sure you want to delete ${user.full_name}? This action cannot be undone.`
                                    : `Submit a request to delete ${user.full_name}? This will require admin approval.`
                                  }
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {userRole === 'admin' ? 'Delete' : 'Submit Request'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, Math.min(totalPages, page - 2 + i));
              return (
                <Button
                  key={pageNumber}
                  variant={page === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                  className={page === pageNumber ? "bg-blue-600" : ""}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        {selectedUser && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  {userRole === 'admin' 
                    ? "Update user information directly."
                    : "Submit a request to edit user. This will require admin approval."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={selectedUser.full_name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone</Label>
                  <Input
                    id="edit_phone"
                    value={selectedUser.phone || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_role">Role</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value: any) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={selectedUser.is_active}
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_active: checked })}
                  />
                  <Label htmlFor="edit_is_active">Active User</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>
                  {userRole === 'admin' ? 'Update User' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
