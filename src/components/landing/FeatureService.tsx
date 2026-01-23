import { Camera, ArrowRight, CheckCircle2, FileText, Smartphone, Truck } from "lucide-react";

const FeatureService = () => {
    return (
        <section className="py-24 bg-[#0B1121] border-y border-white/5 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Content Side */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 mb-6">
                            <Camera className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">AI Receipt Parser</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Snap. Upload. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Done.</span>
                        </h2>

                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Take a photo of any service receipt or upload a PDF. Our AI instantly extracts the work details, costs, vendor info and creates a complete work order.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            {[
                                "Reads handwritten & printed",
                                "Extracts parts & labor costs",
                                "Identifies shop & dates",
                                "Auto-creates Work Orders"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="text-slate-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-[#1A1F2E] rounded-2xl border border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="bg-purple-500/20 p-3 rounded-xl">
                                    <FileText className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-white font-bold mb-1">Example Extraction</div>
                                    <p className="text-slate-400 text-sm">
                                        "Diag, Air Leak hole in Air Dryer Carriage" → <br />
                                        <span className="text-purple-300 font-mono text-xs mt-1 block">
                                            Job: Air Dryer Replace | Cost: $210.28 | Date: 1/21/26
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Side */}
                    <div className="relative" aria-label="AI scanning handwritten truck repair receipt and converting to digital work order">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 bg-purple-500/20 blur-[100px] rounded-full" />

                        <div className="relative grid grid-cols-2 gap-4">
                            {/* Left: Messy Receipt */}
                            <div className="bg-white p-4 rounded-xl shadow-lg transform rotate-[-3deg] mt-8 self-end opacity-90">
                                <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest text-center">Original Receipt</div>
                                <div className="space-y-2 font-mono text-[8px] text-slate-600 leading-tight blur-[0.5px]">
                                    <div className="font-bold text-center text-slate-900 text-xs mb-2">JOE'S TRUCK SHOP</div>
                                    <div>Inv: #999321</div>
                                    <div>Date: Jan 21, 2026</div>
                                    <div className="border-b border-slate-300 my-1"></div>
                                    <div className="flex justify-between">
                                        <span>Air Dryer Assy</span>
                                        <span>$125.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Labor 1h</span>
                                        <span>$85.00</span>
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-300 mt-1">
                                        <span>Total</span>
                                        <span>$210.00</span>
                                    </div>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white shadow-xl rounded-full p-2">
                                <ArrowRight className="w-5 h-5 text-purple-600" />
                            </div>

                            {/* Right: Clean UI */}
                            <div className="bg-[#1E2536] border border-green-500/30 rounded-xl p-4 shadow-2xl transform rotate-[3deg] self-start mb-8">
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <div className="text-xs font-bold text-white">Work Order #WO-1</div>
                                    <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Completed</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Truck className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Asset</div>
                                            <div className="text-xs font-bold text-white">Truck #5192</div>
                                        </div>
                                    </div>

                                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Shop</span>
                                            <span className="text-white">Joe's Truck Shop</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Date</span>
                                            <span className="text-white">Jan 21, 2026</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-white border-t border-white/10 pt-2 mt-2">
                                            <span>Total</span>
                                            <span>$210.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FeatureService;
