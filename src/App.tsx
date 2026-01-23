
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ShieldCheck, Bell, User as UserIcon } from "lucide-react";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import { AppSidebar } from "./components/AppSidebar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
  const { user: authUser } = useAuth();

  // Handle potential nested user object from backend
  const user = (authUser as any)?.user || authUser;

  return (
    <header className="flex h-20 shrink-0 items-center justify-between px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="-ml-2 text-slate-400 hover:text-slate-900 transition-colors" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID:</span>
            <span className="text-xs font-black text-slate-900 tracking-tight">
              {user?.tenant?.id?.slice(0, 7).toUpperCase() || user?.Tenant?.Id?.slice(0, 7).toUpperCase() || 'FM-7721-AI'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <button className="relative group">
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-4 group cursor-pointer">
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
              {user?.tenant?.name || user?.Tenant?.Name ||
                user?.tenantName || user?.TenantName ||
                user?.companyName || user?.CompanyName ||
                user?.company || user?.Company ||
                'Operations'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

import { HelmetProvider } from "react-helmet-async";

const App = () => (
  <HelmetProvider>
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

                            <Route path="/maintenance/service-history/:id" element={<ServiceRecordDetailPage />} />
                            <Route path="/maintenance/upcoming" element={<UpcomingMaintenance />} />
                            <Route path="/inspections" element={<InspectionsPage />} />
                            <Route path="/shops" element={<ShopsPage />} />
                            <Route path="/shops/:id" element={<ShopDetailView />} />
                            <Route path="/shops/map" element={<ShopMap shops={[]} />} />
                            <Route path="/vendor-analytics" element={<VendorAnalytics />} />
                            <Route path="/operations/fuel" element={<FuelTracking />} />
                            <Route path="/ai-chat" element={<AIChatPage />} />
                            <Route path="/ai-chat" element={<AIChatPage />} />

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
  </HelmetProvider>
);

export default App;









