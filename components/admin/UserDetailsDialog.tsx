"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/roles";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { fmtDate, fmtPhone, fmtLocation } from "@/lib/utils/format";
import { format } from "date-fns";

export interface UserDetail {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'admin' | 'viewer' | 'moderator';
  createdAt: string;
  lastLoginAt?: string | null;
  status: 'Active' | 'Idle' | 'Inactive';
}

export interface SecurityInfo {
  ipAddress?: string | null;
  deviceFingerprint?: string | null;
  location?: any | null;
}

interface UserDetailsDialogProps {
  userId: string;
  userRole: UserRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function UserDetailsDialog({ 
  userId, 
  userRole, 
  open, 
  onOpenChange, 
  onUpdated 
}: UserDetailsDialogProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'viewer' as 'admin' | 'viewer'
  });

  // Fetch user details
  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${userId}/detail`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch user details');
      }
      
      setUser(result.user);
      setSecurity(result.security);
      setFormData({
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone || '',
        role: result.user.role
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (userRole !== 'admin') return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          email: formData.email,
          display_name: formData.displayName,
          phone_number: formData.phoneNumber,
          role: formData.role
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      toast.success('User updated successfully');
      setUser(result.user);
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading user details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchUserDetails} variant="outline">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={userRole !== 'admin'}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={userRole !== 'admin'}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={userRole !== 'admin'}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'viewer') => setFormData(prev => ({ ...prev, role: value }))}
                disabled={userRole !== 'admin'}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Account Created</Label>
              <p className="mt-1 text-sm text-gray-600">
                {user.createdAt ? format(new Date(user.createdAt), "M/d/yyyy p") : "Never"}
              </p>
            </div>
            <div>
              <Label>Last Login</Label>
              <p className="mt-1 text-sm text-gray-600">
                {user.lastLoginAt ? format(new Date(user.lastLoginAt), "M/d/yyyy p") : "Never"}
              </p>
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Security Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>IP Address</Label>
                <p className="mt-1 text-sm text-gray-600 font-mono">
                  {security?.ipAddress ?? 'Unknown'}
                </p>
              </div>
              <div>
                <Label>Device Fingerprint</Label>
                <p className="mt-1 text-sm text-gray-600 font-mono break-all">
                  {security?.deviceFingerprint ?? 'Unknown'}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label>Location</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {security?.location
                    ? `${security.location.city ?? "Unknown"}, ${security.location.country ?? ""}`.trim()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {userRole === 'admin' && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
