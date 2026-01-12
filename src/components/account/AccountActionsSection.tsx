
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AccountActionsSection = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <LogOut className="w-5 h-5 text-slate-400" />
          Account Actions
        </h2>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
          <div>
            <h3 className="font-bold text-slate-900">Sign Out</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Sign out of your account session</p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="rounded-xl px-6 py-3 font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all border-slate-200 shadow-sm h-auto"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountActionsSection;
