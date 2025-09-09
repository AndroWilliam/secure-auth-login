"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserRole } from "@/lib/types/admin";
import { toast } from "sonner";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  currentUserRole: UserRole;
}

export function AddUserModal({ isOpen, onClose, onUserAdded, currentUserRole }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as UserRole
  });
  const [isLoading, setIsLoading] = useState(false);

  // Viewer role - show permission message
  if (currentUserRole === 'viewer') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-gray-300">
              You are a viewer and do not have access to this section.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    if (!formData.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        onUserAdded();
        onClose();
        setFormData({ name: "", email: "", role: "viewer" });
      } else {
        toast.error(result.error || "Failed to create invitation");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("Failed to create invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
            <DialogDescription className="text-gray-300">
              {currentUserRole === 'admin' 
                ? "Create a new user invitation. An email will be sent to the user."
                : "Request to invite a new user. An admin will need to approve this request."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* User Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">User Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Enter full name"
                required
              />
            </div>

            {/* User Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">User Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="Enter email address"
                required
              />
            </div>

            {/* User Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">User Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
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
              type="button"
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              {isLoading ? "Creating..." : "Create Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
