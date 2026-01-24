import { MessageSquare, Sparkles, CheckCircle2, Smartphone, FileText, History } from "lucide-react";
import { motion } from "framer-motion";

const FeatureAssets = () => {
    return (
        <section className="py-24 bg-[#0F172A] relative overflow-hidden" id="features">
            {/* Background Gradients */}
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side (Left) - Chat Interface */}
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-60 bg-blue-500/20 blur-[120px] rounded-full" />

                        <div className="bg-[#1E2536] border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(79,124,255,0.1)] relative">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <MessageSquare className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold flex items-center gap-2">
                                        FleetManage AI
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    </h3>
                                    <span className="text-[10px] text-emerald-500 font-medium pl-0.5">Online</span>
                                </div>
                            </div>

                            <div className="space-y-4 relative h-[360px] flex flex-col">
                                {/* 1. User Message */}
                                <motion.div
                                    animate={{ opacity: [0, 1, 1, 1, 0], y: [20, 0, 0, 0, -20] }}
                                    transition={{ duration: 16, times: [0, 0.05, 0.85, 0.95, 1], repeat: Infinity }}
                                    className="flex gap-3 justify-start"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="text-xs text-white font-bold">You</span>
                                    </div>
                                    <div className="bg-[#2A3449] p-3 rounded-2xl rounded-tl-sm text-sm text-slate-200 border border-white/5 max-w-[85%]">
                                        When did we last repair the transmission on truck #5192?
                                    </div>
                                </motion.div>

                                {/* 2. AI Response */}
                                <motion.div
                                    animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, -10] }}
                                    transition={{ duration: 16, times: [0, 0.1, 0.15, 0.85, 1], repeat: Infinity }}
                                    className="flex gap-3 justify-start w-full"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="w-full">
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0], display: ["none", "flex", "none"] }}
                                            transition={{ duration: 16, times: [0, 0.05, 0.15], repeat: Infinity }}
                                            className="bg-[#1E2536] p-3 rounded-2xl rounded-tr-sm text-sm text-slate-300 border border-white/10 w-16 flex items-center justify-center gap-1"
                                        >
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </motion.div>

                                        <motion.div
                                            animate={{ opacity: [0, 1, 1, 0], display: ["none", "block", "block", "none"] }}
                                            transition={{ duration: 16, times: [0, 0.15, 0.85, 1], repeat: Infinity }}
                                            className="bg-[#1E2536] border border-blue-500/30 rounded-xl overflow-hidden w-full max-w-[95%]"
                                        >
                                            <div className="bg-blue-500/10 p-2 border-b border-blue-500/20 flex items-center gap-2">
                                                <History className="w-3 h-3 text-blue-400" />
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Vehicle History Found</span>
                                            </div>
                                            <div className="p-3 space-y-3">
                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    Truck <span className="text-white font-bold">#5192</span> (Freightliner Cascadia) last had transmission service on <span className="text-white font-bold">Jan 15, 2026</span>.
                                                </p>
                                                <div className="flex gap-2">
                                                    <div className="bg-[#0B1121] p-2 rounded border border-white/5 flex-1">
                                                        <div className="text-[10px] text-slate-500 uppercase">Service ID</div>
                                                        <div className="text-xs font-mono text-white">TRN-9921</div>
                                                    </div>
                                                    <div className="bg-[#0B1121] p-2 rounded border border-white/5 flex-1">
                                                        <div className="text-[10px] text-slate-500 uppercase">Cost</div>
                                                        <div className="text-xs font-mono text-white">$2,840.00</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* 3. User Message 2 */}
                                <motion.div
                                    animate={{ opacity: [0, 0, 1, 1, 0], y: [20, 20, 0, 0, -20] }}
                                    transition={{ duration: 16, times: [0, 0.4, 0.45, 0.85, 1], repeat: Infinity }}
                                    className="flex gap-3 justify-end"
                                >
                                    <div className="bg-[#4F7CFF] p-3 rounded-2xl rounded-tr-sm text-sm text-white max-w-[85%] shadow-md">
                                        Is it still under warranty?
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="text-xs text-white font-bold">You</span>
                                    </div>
                                </motion.div>

                                {/* 4. AI Response 2 */}
                                <motion.div
                                    animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, -10] }}
                                    transition={{ duration: 16, times: [0, 0.5, 0.55, 0.85, 1], repeat: Infinity }}
                                    className="flex gap-3 justify-start w-full"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0], display: ["none", "flex", "none"] }}
                                            transition={{ duration: 16, times: [0, 0.45, 0.55], repeat: Infinity }}
                                            className="bg-[#1E2536] p-3 rounded-2xl rounded-tr-sm text-sm text-slate-300 border border-white/10 w-16 flex items-center justify-center gap-1"
                                        >
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ opacity: [0, 1, 1, 0], display: ["none", "block", "block", "none"] }}
                                            transition={{ duration: 16, times: [0, 0.55, 0.85, 1], repeat: Infinity }}
                                            className="bg-[#2A3449] p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 shadow-md border border-white/5"
                                        >
                                            Yes, the <span className="text-emerald-400 font-bold">Powertrain Warranty</span> is active. This repair was fully covered—you only paid the <span className="text-white font-bold">$150 deductible</span>.
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Content Side (Right) */}
                    <div className="order-1 lg:order-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 mb-6">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">Fleet Maintenance Tracking</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Never Lose Track of <br />
                            <span className="text-[#4F7CFF]">Truck Service History</span>
                        </h2>

                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Stop digging through filing cabinets. Ask our AI Assistant questions in plain English to instantly find truck maintenance records, warranty status, and costs.
                        </p>

                        <div className="grid grid-cols-1 gap-6 mb-8">
                            <div className="flex gap-4">
                                <div className="bg-[#1A1F2E] p-3 rounded-xl h-fit border border-white/5">
                                    <Sparkles className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Instant Service Search</h4>
                                    <p className="text-slate-400 text-sm">Find any past repair by asking "When did we replace the brakes?"</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-[#1A1F2E] p-3 rounded-xl h-fit border border-white/5">
                                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Warranty Monitoring</h4>
                                    <p className="text-slate-400 text-sm">Automatically track parts & labor warranties so you don't pay twice.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-[#1A1F2E] p-3 rounded-xl h-fit border border-white/5">
                                    <Smartphone className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Truck Recall Alerts</h4>
                                    <p className="text-slate-400 text-sm">Get notified immediately if your specific VIN has a safety recall.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-[#1A1F2E] p-3 rounded-xl h-fit border border-white/5">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Total Cost of Ownership</h4>
                                    <p className="text-slate-400 text-sm">See exactly how much each truck costs you per mile.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureAssets;
