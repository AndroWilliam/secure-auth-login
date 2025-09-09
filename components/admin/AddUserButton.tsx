"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddUserModal } from "./AddUserModal";
import { UserRole } from "@/lib/types/admin";

interface AddUserButtonProps {
  currentUserRole: UserRole;
  onUserAdded: () => void;
}

export function AddUserButton({ currentUserRole, onUserAdded }: AddUserButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowModal(true)}
        className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New User
      </Button>

      <AddUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUserAdded={onUserAdded}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
