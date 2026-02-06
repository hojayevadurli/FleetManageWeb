
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
  BarChart3,
  Store
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
    title: "All Assets",
    url: "/app/equipment",
    icon: Truck,
  },
  {
    title: "Drivers",
    url: "/app/drivers",
    icon: User,
  },
  {
    title: "Service",
    url: "/app/service",
    icon: ClipboardList,
  },
  {
    title: "Shops List",
    url: "/app/shops",
    icon: Store,
  },

];
