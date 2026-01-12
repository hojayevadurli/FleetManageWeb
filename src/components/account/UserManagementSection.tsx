import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Plus } from "lucide-react";

const UserManagementSection = () => {
  const handleAddUser = () => {
    console.log("Adding new user");
    toast.info("Add user functionality coming soon!");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-400" />
          Team Management
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
          Manage your team members and permissions
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all">
          <div>
            <h3 className="font-bold text-slate-900">Team Members (1)</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Invite and manage team access</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                YOU
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">You (Owner)</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Access</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAddUser}
            className="rounded-xl px-6 py-6 font-bold bg-white text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all text-xs uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementSection;
