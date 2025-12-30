
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarAccountSection } from "./sidebar/SidebarAccountSection";
import { SidebarFooterSection } from "./sidebar/SidebarFooterSection";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-xl font-black">⚡</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">FleetManage<span className="text-blue-500">.ai</span></h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <SidebarNavigation />
        <div className="mt-auto">
          <SidebarAccountSection />
        </div>
      </SidebarContent>

      <SidebarFooterSection />
    </Sidebar>
  );
}
