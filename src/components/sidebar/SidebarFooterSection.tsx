
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function SidebarFooterSection() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    }
  };

  return (
    <SidebarFooter className="p-4 border-t">
      <div className="space-y-2">
        {user && (
          <div className="text-sm text-gray-600 mb-2">
            Signed in as: {user.email}
          </div>
        )}
        <Button 
          onClick={handleSignOut} 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </SidebarFooter>
  );
}
