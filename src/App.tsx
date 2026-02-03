
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ShieldCheck, Bell, User as UserIcon } from "lucide-react";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "./components/AppSidebar";
import { tenantsApi } from "@/lib/tenantsApi";
import { useState, useEffect } from "react";
import { differenceInDays, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, CreditCard, Users } from "lucide-react"; // Additional icons
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";
import Equipment from "./pages/Equipment";
import WorkOrders from "./pages/WorkOrders";
import HistoryTrucks from "./pages/HistoryTrucks";
import RepairHistoryPage from "./pages/RepairHistoryPage";

import UpcomingMaintenance from "./pages/UpcomingMaintenance";
import InspectionsPage from "./pages/InspectionsPage";
import ShopsPage from "./pages/ShopsPage";
import ShopMap from "./pages/ShopMap";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import AIChatPage from "./pages/AIChatPage";
import FleetMap from "./pages/FleetMap";
import ServiceRecordDetailPage from "./pages/ServiceRecordDetailPage";
import FuelTracking from "./pages/FuelTracking";
import VendorAnalytics from "./pages/VendorAnalytics";
import ShopDetailView from "./pages/ShopDetailView";
import SupportPage from "./pages/support/SupportPage";

import SettingsLayout from "./pages/settings/SettingsLayout";
import AccountTab from "./pages/settings/tabs/AccountTab";
import BillingTab from "./pages/settings/tabs/BillingTab";
import PreferencesTab from "./pages/settings/tabs/PreferencesTab";
import TeamTab from "./pages/settings/tabs/TeamTab";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Root route handler
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Landing />;
};

const DashboardHeader = () => {
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const tenant = await tenantsApi.getCurrent();

        if (tenant?.name) {
          setCompanyName(tenant.name);
        }

        if (tenant?.trialEndsAt) {
          const end = parseISO(tenant.trialEndsAt);
          const days = differenceInDays(end, new Date());
          setTrialDays(days > 0 ? days : 0);
        } else {
          setTrialDays(29);
        }
      } catch (e) {
        console.error("Failed to fetch tenant data", e);
        setTrialDays(29);
      }
    };
    fetchTenantData();
  }, []);

  // Handle potential nested user object from backend
  const user = (authUser as any)?.user || authUser;

  return (
    <header className="flex h-20 shrink-0 items-center justify-between px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="-ml-2 text-slate-400 hover:text-slate-900 transition-colors" />
        <div className="flex items-center gap-4">
          {trialDays !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-left-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Active Trial</span>
              <span className="text-xs font-bold text-orange-900 border-l border-orange-200 pl-2 ml-1">
                {trialDays} days left
              </span>
            </div>
          )}

          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={() => toast({ title: "No Notifications", description: "You're all caught up! No active alerts." })}
          className="relative group"
        >
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-4 group cursor-pointer outline-none">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {user?.fullName || user?.FullName ||
                    user?.displayName || user?.DisplayName ||
                    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
                    (user?.FirstName && user?.LastName ? `${user.FirstName} ${user.LastName}` : null) ||
                    user?.name || user?.Name ||
                    user?.email || 'User'}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {companyName ||
                    user?.companyName || user?.CompanyName ||
                    user?.tenant?.name || user?.Tenant?.Name ||
                    user?.tenantName || user?.TenantName ||
                    user?.company || user?.Company ||
                    'Freightcab Inc'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-xl bg-white/95 backdrop-blur-sm">
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName || 'User'}</p>
                <p className="text-xs leading-none text-slate-500 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem asChild>
              <Link to="/app/settings/account" className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <UserIcon className="w-4 h-4 ml-1" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings/billing" className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <CreditCard className="w-4 h-4 ml-1" />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings/preferences" className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <Settings className="w-4 h-4 ml-1" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/settings/team" className="flex items-center gap-2 cursor-pointer rounded-xl px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                <Users className="w-4 h-4 ml-1" />
                Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                navigate("/login");
              }}
              className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 ml-1" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

import { HelmetProvider } from "react-helmet-async";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Backend sends /reset link */}
            <Route path="/reset" element={<ResetPassword />} />
            {/* Backend sends /confirm-email link */}
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <SidebarInset>
                      <DashboardHeader />
                      <div className="flex flex-1 flex-col gap-4 p-4">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/equipment" element={<Equipment />} />
                          <Route path="/equipment/map" element={<FleetMap />} />
                          <Route path="/service" element={<WorkOrders />} />
                          <Route path="/history/trucks" element={<HistoryTrucks />} />
                          <Route path="/history/repairs" element={<RepairHistoryPage />} />

                          <Route path="/service/:id" element={<ServiceRecordDetailPage />} />
                          <Route path="/maintenance/upcoming" element={<UpcomingMaintenance />} />
                          <Route path="/inspections" element={<InspectionsPage />} />
                          <Route path="/shops" element={<ShopsPage />} />
                          <Route path="/shops/:id" element={<ShopDetailView />} />
                          <Route path="/shops/map" element={<ShopMap shops={[]} />} />
                          <Route path="/vendor-analytics" element={<VendorAnalytics />} />
                          <Route path="/operations/fuel" element={<FuelTracking />} />
                          <Route path="/ai-chat" element={<AIChatPage />} />
                          <Route path="/ai-chat" element={<AIChatPage />} />
                          <Route path="/support" element={<SupportPage />} />

                          {/* Settings Routes */}
                          <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="account" replace />} />
                            <Route path="account" element={<AccountTab />} />
                            <Route path="billing" element={<BillingTab />} />
                            <Route path="preferences" element={<PreferencesTab />} />
                            <Route path="team" element={<TeamTab />} />
                          </Route>
                          <Route path="/account" element={<Navigate to="/app/settings/account" replace />} />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;









