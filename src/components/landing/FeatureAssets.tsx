import { MessageSquare, Sparkles, Truck, AlertTriangle } from "lucide-react";

const FeatureAssets = () => {
    return (
        <section className="py-24 bg-[#0F172A] relative overflow-hidden" id="features">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side */}
                    <div className="relative order-2 lg:order-1">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30" />
                        <div className="relative bg-[#1E2536] border border-white/10 rounded-2xl p-6 shadow-2xl">
                            {/* Chat Header */}
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-white font-semibold">
                                    FleetManage AI
                                    <div className="text-xs text-green-400 flex items-center gap-1 font-normal">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        Online
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="space-y-6 font-mono text-sm mb-6" aria-label="Chat interface demonstrating AI answering fleet maintenance questions">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="text-xs text-white">You</span>
                                    </div>
                                    <div className="bg-[#2A3449] p-4 rounded-2xl rounded-tr-sm text-slate-200">
                                        When was the last oil change on truck #5192?
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-white/10">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="bg-[#1E2536] border border-blue-500/30 p-4 rounded-2xl rounded-tl-sm text-slate-200">
                                            <div className="flex items-center gap-2 text-[#4F7CFF] font-bold mb-2 uppercase text-xs tracking-wider">
                                                <Truck className="w-3 h-3" />
                                                Vehicle History Found
                                            </div>
                                            Truck #5192 (Freightliner Cascadia) last had an oil change on <span className="text-white font-bold">Jan 15, 2026</span>.

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                                                    <div className="text-slate-500">Service ID</div>
                                                    <div className="text-white">PM-B #9921</div>
                                                </div>
                                                <div className="bg-slate-800/50 p-2 rounded border border-white/5">
                                                    <div className="text-slate-500">Cost</div>
                                                    <div className="text-white">$450.00</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-white/10">
                                        <span className="text-xs text-white">You</span>
                                    </div>
                                    <div className="bg-[#2A3449] p-4 rounded-2xl rounded-tr-sm text-slate-200">
                                        Is it still under warranty?
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 border border-white/10">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-[#1E2536] border border-blue-500/30 p-4 rounded-2xl rounded-tl-sm text-slate-200">
                                        Yes, the <strong className="text-white">Powertrain Warranty</strong> is active until <span className="text-green-400">June 2028</span> or 500,000 miles.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
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

                        <div className="space-y-6">
                            {[
                                { title: "Instant Service Search", desc: "Find any past repair by asking 'When did we replace the brakes?'" },
                                { title: "Warranty Monitoring", desc: "Automatically track parts & labor warranties so you don't pay twice." },
                                { title: "Truck Recall Alerts", desc: "Get notified immediately if your specific VIN has a safety recall." },
                                { title: "Total Cost of Ownership", desc: "See exactly how much each truck costs you per mile." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-12 h-12 bg-[#1E2536] rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                                        <Sparkles className="w-5 h-5 text-[#4F7CFF]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{item.title}</h3>
                                        <p className="text-slate-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureAssets;
