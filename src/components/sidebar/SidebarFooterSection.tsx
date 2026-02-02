
import { LifeBuoy } from "lucide-react";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function SidebarFooterSection() {
  const handleSupportClick = () => {
    window.location.href = "mailto:support@fleetmanage.ai";
  };

  return (
    <SidebarFooter className="p-4 border-t border-white/5">
      <div className="space-y-2">
        <Button
          onClick={handleSupportClick}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
        >
          <LifeBuoy className="h-4 w-4 mr-3" />
          Help & Support
        </Button>
      </div>
    </SidebarFooter>
  );
}
