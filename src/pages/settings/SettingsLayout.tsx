
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { User, CreditCard, Settings, Users, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const SettingsLayout = () => {
    const location = useLocation();

    const tabs = [
        { name: "Account", path: "account", icon: User },
        { name: "Billing", path: "billing", icon: CreditCard },
        { name: "Preferences", path: "preferences", icon: Settings },
        { name: "Team", path: "team", icon: Users },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-20 pt-8 px-4 md:px-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your company profile and preferences</p>
                </div>

                {/* We might move the global save button here later, but for now specific tabs handle it */}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 mb-8 overflow-x-auto">
                <nav className="flex space-x-8 min-w-max" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.name}
                            to={tab.path}
                            className={({ isActive }) =>
                                `flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${isActive
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`
                            }
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] w-full">
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsLayout;
