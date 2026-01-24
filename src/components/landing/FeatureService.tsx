import { Camera, ArrowRight, CheckCircle2, FileText, Smartphone, Truck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

                    {/* Visual Side - Animation */}
                    <div className="relative h-[400px] flex items-center justify-center" aria-label="AI scanning handwritten truck repair receipt and converting to digital work order">
                        <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full" />

                        <div className="relative w-full max-w-[600px] flex items-center justify-between">

                            {/* 1. Receipt Card */}
                            <motion.div
                                animate={{
                                    x: [-50, 0, 0, 0, -50],
                                    rotate: [-5, 0, 0, 0, -5],
                                    opacity: [0, 1, 1, 1, 0]
                                }}
                                transition={{
                                    duration: 8,
                                    times: [0, 0.1, 0.8, 0.9, 1],
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                                className="bg-white p-4 rounded-xl shadow-xl w-48 relative overflow-hidden shrink-0 z-20 origin-bottom-left"
                            >
                                <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-widest text-center">Original Receipt</div>
                                <div className="space-y-2 font-mono text-[8px] text-slate-600 leading-tight">
                                    <motion.div
                                        animate={{ color: ["#475569", "#9333ea", "#475569"] }}
                                        transition={{ duration: 0.5, delay: 1.5, repeat: Infinity, repeatDelay: 7.5 }}
                                        className="font-bold text-center text-slate-900 text-xs mb-2"
                                    >
                                        JOE'S TRUCK SHOP
                                    </motion.div>
                                    <div>Inv: #999321</div>
                                    <motion.div
                                        animate={{ color: ["#475569", "#9333ea", "#475569"] }}
                                        transition={{ duration: 0.5, delay: 1.8, repeat: Infinity, repeatDelay: 7.5 }}
                                    >
                                        Date: Jan 21, 2026
                                    </motion.div>
                                    <div className="border-b border-slate-300 my-1"></div>
                                    <div className="flex justify-between">
                                        <span>Air Dryer Assy</span>
                                        <span>$125.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Labor 1h</span>
                                        <span>$85.00</span>
                                    </div>
                                    <motion.div
                                        animate={{ color: ["#475569", "#9333ea", "#475569"], scale: [1, 1.05, 1] }}
                                        transition={{ duration: 0.5, delay: 2.1, repeat: Infinity, repeatDelay: 7.5 }}
                                        className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-300 mt-1"
                                    >
                                        <span>Total</span>
                                        <span>$210.00</span>
                                    </motion.div>
                                </div>

                                {/* Scan Line */}
                                <motion.div
                                    animate={{ top: ["0%", "150%"], opacity: [0, 1, 1, 0] }}
                                    transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 7.5, ease: "linear" }}
                                    className="absolute left-0 w-full h-8 bg-gradient-to-b from-purple-500/20 to-transparent border-t border-purple-500/50 pointer-events-none"
                                />
                            </motion.div>

                            {/* 2. Arrow & Particles */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-12 flex items-center justify-center">
                                <div className="relative w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent">
                                    {/* Particles */}
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ x: [-40, 40], opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, delay: 1 + (i * 0.2), repeat: Infinity, repeatDelay: 7 }}
                                            className="absolute top-1/2 left-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                                        />
                                    ))}
                                </div>
                                <div className="absolute right-0 bg-white shadow-lg rounded-full p-1.5 z-20">
                                    <ArrowRight className="w-4 h-4 text-purple-600" />
                                </div>
                            </div>

                            {/* 3. Work Order Card */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{
                                    scale: [0.9, 1, 1, 1, 0.9],
                                    opacity: [0, 1, 1, 1, 0]
                                }}
                                transition={{
                                    duration: 8,
                                    times: [0, 0.3, 0.8, 0.9, 1], // Consolidate timing window
                                    delay: 2, // Start later
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                                className="bg-[#1E2536] border border-green-500/30 rounded-xl p-4 shadow-2xl w-56 shrink-0 relative z-20 origin-center"
                            >
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <motion.div
                                        animate={{ opacity: [0, 1] }}
                                        transition={{ duration: 0.5, delay: 2.5, repeat: Infinity, repeatDelay: 8.5 }}
                                        className="text-xs font-bold text-white"
                                    >
                                        Work Order #WO-1
                                    </motion.div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.2, 1] }}
                                        transition={{ duration: 0.4, delay: 3.5, repeat: Infinity, repeatDelay: 8.6 }}
                                        className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full"
                                    >
                                        Completed
                                    </motion.div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                            <Truck className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase">Asset</div>
                                            <motion.div
                                                animate={{ opacity: [0, 1] }}
                                                transition={{ duration: 0.5, delay: 2.6, repeat: Infinity, repeatDelay: 8.5 }}
                                                className="text-xs font-bold text-white"
                                            >
                                                Truck #5192
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="bg-[#0F172A] rounded-lg p-3 border border-white/5">
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Shop</span>
                                            <motion.span
                                                animate={{ opacity: [0, 1] }}
                                                transition={{ duration: 0.5, delay: 2.7, repeat: Infinity, repeatDelay: 8.5 }}
                                                className="text-white"
                                            >
                                                Joe's Truck Shop
                                            </motion.span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Date</span>
                                            <motion.span
                                                animate={{ opacity: [0, 1] }}
                                                transition={{ duration: 0.5, delay: 2.8, repeat: Infinity, repeatDelay: 8.5 }}
                                                className="text-white"
                                            >
                                                Jan 21, 2026
                                            </motion.span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-white border-t border-white/10 pt-2 mt-2">
                                            <span>Total</span>
                                            <motion.span
                                                animate={{ opacity: [0, 1] }}
                                                transition={{ duration: 0.5, delay: 3.0, repeat: Infinity, repeatDelay: 8.5 }}
                                            >
                                                $210.00
                                            </motion.span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FeatureService;
