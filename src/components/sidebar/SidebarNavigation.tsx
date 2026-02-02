
import { useLocation, Link } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navigationItems, NavigationItem, NavigationGroup } from "./navigationItems";

const isNavigationItem = (item: NavigationItem | NavigationGroup): item is NavigationItem => {
  return 'url' in item;
};

const isNavigationGroup = (item: NavigationItem | NavigationGroup): item is NavigationGroup => {
  return 'group' in item;
};

export function SidebarNavigation() {
  const location = useLocation();

  return (
    <SidebarGroup className="px-4">
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {navigationItems.map((item) => {
            if (isNavigationItem(item)) {
              // Exact match for dashboard, startsWith for others to catch sub-pages
              const active = item.url === '/app/'
                ? location.pathname === item.url
                : location.pathname.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={`h-12 px-4 rounded-xl transition-all duration-200 group relative ${active
                      ? 'bg-blue-600/10 text-blue-500 font-bold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'
                      }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${active ? 'text-blue-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="text-sm tracking-wide">{item.title}</span>
                      {active && <div className="absolute right-0 w-1.5 h-6 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            if (isNavigationGroup(item)) {
              return (
                <div key={item.group} className="mt-8 mb-4">
                  <SidebarGroupLabel className="px-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                    {item.group}
                  </SidebarGroupLabel>
                  <div className="space-y-2">
                    {item.items?.map((subItem) => {
                      const active = location.pathname === subItem.url;
                      return (
                        <SidebarMenuItem key={subItem.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            className={`h-12 px-4 rounded-xl transition-all duration-200 group relative ${active
                              ? 'bg-blue-600/10 text-blue-500 font-bold'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'
                              }`}
                          >
                            <Link to={subItem.url} className="flex items-center gap-3">
                              <subItem.icon className={`w-5 h-5 ${active ? 'text-blue-500' : 'text-slate-400 group-hover:text-white'}`} />
                              <span className="text-sm tracking-wide">{subItem.title}</span>
                              {active && <div className="absolute right-0 w-1.5 h-6 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
