
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const UserManagementSection = () => {
  const handleAddUser = () => {
    console.log("Adding new user");
    toast.info("Add user functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">User Management</h3>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Team Members</p>
          <p className="text-sm text-gray-600">Invite and manage team members</p>
        </div>
        <Button type="button" onClick={handleAddUser} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
    </div>
  );
};

export default UserManagementSection;
