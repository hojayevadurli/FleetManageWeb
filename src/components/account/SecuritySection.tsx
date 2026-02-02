import { Shield, Key, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { useAuth } from "@/components/auth/AuthContext";
import { formatDistanceToNow } from "date-fns";

export const SecuritySection = () => {
    const { user } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const getLastPasswordChangeText = () => {
        if (!user?.lastPasswordChange) return "Last changed: Never";
        try {
            return `Last changed ${formatDistanceToNow(new Date(user.lastPasswordChange), { addSuffix: true })}`;
        } catch {
            return "Last changed: Unknown";
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    Security
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
                    Manage your password and security settings
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Password */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Key className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Password</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">{getLastPasswordChangeText()}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPasswordDialogOpen(true)}
                        className="px-6 py-3 bg-white rounded-xl font-bold text-xs text-slate-700 shadow-sm border border-slate-100 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-2"
                    >
                        Change <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <ChangePasswordDialog
                    open={isPasswordDialogOpen}
                    onOpenChange={setIsPasswordDialogOpen}
                />
            </div>
        </div>
    );
};
