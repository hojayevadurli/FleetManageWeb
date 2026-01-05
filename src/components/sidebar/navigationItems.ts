
import {
  Truck,
  FileCheck,
  MapPin,
  Settings,
  Home,
  RectangleHorizontal,
  Plus,
  User,
  MessageCircle,
  Wrench,
  Calendar,
  ClipboardList,
  Fuel,
  BarChart3
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: any;
}

export interface NavigationGroup {
  group: string;
  items: NavigationItem[];
}

export type NavigationConfig = (NavigationItem | NavigationGroup)[];

export const navigationItems: NavigationConfig = [
  {
    title: "Dashboard",
    url: "/app/",
    icon: Home,
  },
  {
    title: "AI Chat",
    url: "/app/ai-chat",
    icon: MessageCircle,
  },
  {
    group: "Equipment",
    items: [
      {
        title: "All Assets",
        url: "/app/equipment",
        icon: Truck,
      },
      {
        title: "Fleet Map",
        url: "/app/equipment/map",
        icon: MapPin,
      },
    ],
  },
  {
    group: "Maintenance",
    items: [
      {
        title: "Work Orders",
        url: "/app/work-orders",
        icon: ClipboardList,
      },

      {
        title: "Upcoming",
        url: "/app/maintenance/upcoming",
        icon: Calendar,
      },
    ],
  },
  {
    group: "Inspection",
    items: [
      {
        title: "Create New Inspection",
        url: "/app/inspections?tab=create",
        icon: Plus,
      },
      {
        title: "Inspection List",
        url: "/app/inspections?tab=inspections",
        icon: FileCheck,
      },
    ],
  },
  {
    group: "Shops",
    items: [
      {
        title: "Shops List",
        url: "/app/shops",
        icon: Settings,
      },
      {
        title: "Vendor Analytics",
        url: "/app/vendor-analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    group: "Fleet Operations",
    items: [
      {
        title: "Fuel Tracking",
        url: "/app/operations/fuel",
        icon: Fuel,
      },
    ],
  },
];
