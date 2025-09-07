"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserRow, UserUpdateInput, ConflictDetail } from "@/lib/admin/types";
import { validateUserUpdate } from "@/lib/admin/validators";
import { updateUser } from "@/lib/admin/mockApi";
import { getStatus } from "@/lib/admin/presenceMock";
import { toast } from "sonner";

interface EditUserDialogProps {
  user: UserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditUserDialog({ user, isOpen, onClose, onSaved }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    role: "viewer" as const
  });
  const [isLoading, setIsLoading] = useState(false);
  const [conflict, setConflict] = useState<ConflictDetail | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        role: user.role
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    // Validate form data
    const validation = validateUserUpdate({
      ...formData,
      prevUpdatedAt: user.updated_at
    });

    if (!validation.success) {
      toast.error("Validation failed: " + validation.errors.join(", "));
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUser(user.id, {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        role: formData.role,
        prevUpdatedAt: user.updated_at
      });

      if (result.ok) {
        toast.success("User updated successfully");
        onSaved();
        onClose();
      } else if (result.status === 409) {
        // Handle conflict
        setConflict(result.detail as ConflictDetail);
        setShowConflictDialog(true);
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverwriteConflict = async () => {
    if (!user || !conflict) return;

    setIsLoading(true);
    setShowConflictDialog(false);

    try {
      // Fetch latest user data and retry
      const result = await updateUser(user.id, {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        role: formData.role,
        prevUpdatedAt: conflict.server.updated_at
      });

      if (result.ok) {
        toast.success("User updated successfully (overwrote server changes)");
        onSaved();
        onClose();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
      setConflict(null);
    }
  };

  const handleCancelConflict = () => {
    setShowConflictDialog(false);
    setConflict(null);
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  const currentStatus = getStatus(user.id);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-gray-300">
              Update user information directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Read-only Status Badge */}
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(currentStatus)} border`}>
                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                </Badge>
                <span className="text-sm text-gray-400">
                  (Status is read-only and based on user activity)
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Enter full name"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Enter phone number (e.g., +1234567890)"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "viewer" | "moderator" | "admin") => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="viewer" className="text-white hover:bg-gray-700">
                    Viewer
                  </SelectItem>
                  <SelectItem value="moderator" className="text-white hover:bg-gray-700">
                    Moderator
                  </SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-gray-700">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="bg-black border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              The user was modified by another user while you were editing. 
              Here are the conflicting changes:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {conflict && (
            <div className="space-y-4 py-4">
              {conflict.conflicts.map((conflict, index) => (
                <div key={index} className="p-3 bg-gray-900 rounded border border-gray-700">
                  <div className="font-medium text-white capitalize">{conflict.field.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    <div>Server: {conflict.serverValue || 'null'}</div>
                    <div>Your changes: {conflict.clientValue || 'null'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelConflict}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel and Refresh
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOverwriteConflict}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Overwriting..." : "Overwrite Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
