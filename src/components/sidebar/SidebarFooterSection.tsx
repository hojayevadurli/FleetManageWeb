
import { LifeBuoy } from "lucide-react";
import { SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function SidebarFooterSection() {
  return (
    <SidebarFooter className="p-4 border-t border-white/5">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
          asChild
        >
          <Link to="/app/support">
            <LifeBuoy className="h-4 w-4 mr-3" />
            Help & Support
          </Link>
        </Button>
      </div>
    </SidebarFooter>
  );
}
