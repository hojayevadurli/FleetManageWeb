import React from 'react';
import { Settings, Sliders, Bell, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PreferencesTab = () => {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 w-full min-h-[60vh] flex items-center justify-center">
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-16 text-center max-w-2xl mx-auto relative overflow-hidden">

                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>


                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner relative group">
                        <Sliders className="w-10 h-10 text-slate-300 group-hover:text-emerald-500 transition-colors duration-500" />
                        <div className="absolute -top-2 -right-2 bg-white p-2 rounded-full shadow-sm border border-slate-100">
                            <Settings className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Preferences</h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Coming Soon</span>
                    </div>

                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8 max-w-md">
                        Advanced controls for notifications, theming, and system-wide configurations are being engineered.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                            <Palette className="w-5 h-5 text-slate-400 mb-2 mx-auto" />
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Advanced Theming</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                            <Bell className="w-5 h-5 text-slate-400 mb-2 mx-auto" />
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notification Control</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreferencesTab;
