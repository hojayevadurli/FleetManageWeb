
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, UserX } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



const AccountActionsSection = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    }
  };

  const handleDeactivateAccount = () => {
    console.log("Deactivating account");
    toast.info("Account deactivation functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Account Actions</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-gray-600">Sign out of your account</p>
          </div>
          <Button type="button" onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
          <div>
            <p className="font-medium text-red-700">Deactivate Account</p>
            <p className="text-sm text-red-600">Permanently deactivate your account</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently deactivate your account. This action cannot be undone.
                  All your data will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivateAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Deactivate Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AccountActionsSection;
