
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarFooterSection } from "./sidebar/SidebarFooterSection";

import { Logo } from "@/components/ui/Logo";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-white/5">
        <Logo textClassName="text-white" />
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <SidebarNavigation />
      </SidebarContent>

      <SidebarFooterSection />
    </Sidebar>
  );
}
