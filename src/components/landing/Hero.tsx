import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MessageSquare, Receipt, MapPin, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] bg-[#4F7CFF]/20 blur-[120px] rounded-full opacity-50" />
            <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] bg-purple-500/10 blur-[100px] rounded-full opacity-50" />

            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-[#4F7CFF]" />
                        <span className="text-sm font-medium text-slate-300">New: AI-Powered Fleet Management</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Talk to Your Fleet. <br />
                        <span className="bg-gradient-to-r from-[#4F7CFF] to-purple-400 bg-clip-text text-transparent">
                            AI Does the Rest.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl leading-relaxed">
                        Track truck maintenance, scan receipts in seconds, and find trustworthy repair shops—all with AI.
                    </p>

                    {/* What This Replaces */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="text-red-400 text-xs">✕</span> Paperwork</span>
                        <span className="flex items-center gap-1.5"><span className="text-red-400 text-xs">✕</span> Spreadsheets</span>
                        <span className="flex items-center gap-1.5"><span className="text-red-400 text-xs">✕</span> Lost Receipts</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto h-12 px-8 bg-[#4F7CFF] hover:bg-[#4F7CFF]/90 text-white font-bold text-base shadow-[0_0_25px_rgba(79,124,255,0.4)] transition-all hover:scale-105"
                            onClick={() => navigate("/login")}
                        >
                            Start Free Month
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto h-12 px-8 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                            onClick={() => (window as any).Calendly?.initPopupWidget({ url: 'https://calendly.com/suleyman-durdiyev/30min' })}
                        >
                            Book a Demo
                        </Button>
                    </div>

                    <p className="mt-6 text-sm text-slate-500 font-medium">
                        1 Month Free • $6/truck/month after
                    </p>
                </div>

                {/* Hero Visual - 3 Panel Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                    {/* Panel 1: Chat Interface */}
                    <div className="lg:col-span-4 bg-[#1E2536] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm transform lg:translate-y-8 hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-white font-semibold">Fleet AI Assistant</h3>
                        </div>
                        <div className="space-y-4 relative h-[140px]">
                            {/* User Message */}
                            <motion.div
                                animate={{ opacity: [0, 1, 1, 1, 0], y: [10, 0, 0, 0, -10] }}
                                transition={{ duration: 8, times: [0, 0.1, 0.8, 0.9, 1], repeat: Infinity, repeatDelay: 1 }}
                                className="flex gap-3 justify-end absolute right-0 w-full"
                            >
                                <div className="bg-[#4F7CFF] p-3 rounded-2xl rounded-tr-sm text-sm text-white max-w-[85%] shadow-md">
                                    Show me all brake repairs in the last 6 months
                                </div>
                            </motion.div>

                            {/* AI Thinking Dots */}
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 2, times: [0, 0.2, 1], delay: 1, repeat: Infinity, repeatDelay: 7 }}
                                className="flex gap-1 absolute left-12 top-14"
                            >
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                            </motion.div>

                            {/* AI Response */}
                            <motion.div
                                animate={{ opacity: [0, 1, 1, 1, 0], y: [10, 0, 0, 0, -10] }}
                                transition={{ duration: 8, times: [0, 0.1, 0.8, 0.9, 1], delay: 2.5, repeat: Infinity, repeatDelay: 1 }}
                                className="flex gap-3 absolute top-14 left-0 w-full"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-[#2A3449] p-3 rounded-2xl rounded-tl-sm text-sm text-slate-300 shadow-md">
                                    Found 2 brake service records:
                                    <motion.ul
                                        animate={{ opacity: [0, 1, 1, 1, 0], height: [0, "auto", "auto", "auto", 0] }}
                                        transition={{ duration: 8, times: [0, 0.1, 0.8, 0.9, 1], delay: 1 }} // Relative to parent delay
                                        className="mt-2 space-y-2 overflow-hidden"
                                    >
                                        <li className="bg-white/5 p-2 rounded text-xs text-slate-300 border border-white/5">
                                            <span className="text-[#4F7CFF] font-semibold">#5192</span>: Brake pads replaced - $450 <span className="text-slate-500">(Diesel Pros)</span>
                                        </li>
                                        <li className="bg-white/5 p-2 rounded text-xs text-slate-300 border border-white/5">
                                            <span className="text-[#4F7CFF] font-semibold">#TRK-010</span>: Brake drums resurfaced - $280 <span className="text-slate-500">(Midwest)</span>
                                        </li>
                                    </motion.ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Panel 2: Receipt Scanning (Center Feature) */}
                    <div className="lg:col-span-4 bg-[#1E2536] border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(79,124,255,0.15)] z-20 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#4F7CFF]/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <Receipt className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-white font-semibold">Instant Receipt Parser</h3>
                        </div>

                        <div className="relative h-[200px] flex items-center justify-center">
                            {/* Receipt Container */}
                            <motion.div
                                initial={{ y: 20, opacity: 0, rotate: -2 }}
                                animate={{
                                    y: [20, 0, 0, 0, 20],
                                    opacity: [0, 1, 1, 1, 0],
                                    rotate: [-2, -2, -2, -2, -2]
                                }}
                                transition={{
                                    duration: 8,
                                    times: [0, 0.1, 0.8, 0.9, 1],
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                                className="bg-white p-4 rounded-lg absolute w-48 shadow-lg origin-bottom"
                            >
                                {/* Header Mockup */}
                                <div className="h-2 w-20 bg-slate-800 mb-2 rounded-full" />
                                <div className="h-2 w-12 bg-slate-300 mb-4 rounded-full" />

                                {/* Line Items */}
                                <div className="space-y-2">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1], backgroundColor: ["transparent", "rgba(79, 124, 255, 0.1)", "transparent"] }}
                                        transition={{ duration: 1, delay: 2, repeat: Infinity, repeatDelay: 7 }} // Sync with main loop
                                        className="flex justify-between text-[10px] text-slate-600 border-b border-slate-100 pb-1 rounded px-1"
                                    >
                                        <span>Oil Filter</span>
                                        <span>$45.00</span>
                                    </motion.div>
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1], backgroundColor: ["transparent", "rgba(79, 124, 255, 0.1)", "transparent"] }}
                                        transition={{ duration: 1, delay: 2.5, repeat: Infinity, repeatDelay: 7 }}
                                        className="flex justify-between text-[10px] text-slate-600 border-b border-slate-100 pb-1 rounded px-1"
                                    >
                                        <span>Labor (1.5h)</span>
                                        <span>$135.00</span>
                                    </motion.div>
                                    <div className="flex justify-between font-bold text-xs text-slate-900 pt-1 px-1">
                                        <span>Total</span>
                                        <span>$180.00</span>
                                    </div>
                                </div>

                                {/* Scanning Line */}
                                <motion.div
                                    animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 6 }}
                                    className="absolute left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_#3B82F6] z-10"
                                    style={{ top: 0 }}
                                />
                            </motion.div>

                            {/* Success Badge */}
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.1, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }}
                                transition={{ duration: 4, delay: 3.5, times: [0, 0.1, 0.2, 0.9, 1], repeat: Infinity, repeatDelay: 4 }} // Total 8s cycle to sync
                                className="absolute bottom-2 bg-[#10B981] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-30"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 3.6 }}
                                    className="bg-white rounded-full p-0.5"
                                >
                                    <Check className="w-3 h-3 text-[#10B981]" />
                                </motion.div>
                                <span className="text-xs font-bold tracking-wide">PROCESSED</span>
                            </motion.div>

                            {/* Extracted Data Floating Cards (Optional Polish) */}
                            {/* Can add if needed, keeping it simpler to avoid clutter for now */}
                        </div>
                    </div>

                    {/* Panel 3: Shop Network */}
                    <div className="lg:col-span-4 bg-[#1E2536] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm transform lg:translate-y-12 hover:-translate-y-2 transition-transform duration-500 overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="bg-emerald-500/20 p-2 rounded-lg">
                                <MapPin className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-semibold">Shop Network</h3>
                        </div>
                        <div className="space-y-3 relative h-[160px]">
                            {/* Map Placeholder */}
                            <div className="h-24 w-full bg-[#2A3449] rounded-xl overflow-hidden relative mb-4">
                                <div className="w-full h-full opacity-20 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:8px_8px]" />
                                {/* Pin 1 (Matches Card 1) */}
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-1/2 left-1/3 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3B82F6]"
                                />
                                {/* Pin 2 (Matches Card 2) */}
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, delay: 1, repeat: Infinity }}
                                    className="absolute top-1/3 left-2/3 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10B981]"
                                />
                            </div>

                            {/* Card 1: TruckPro Diesel */}
                            <motion.div
                                animate={{ opacity: [1, 1, 0, 0, 1], x: [0, 0, -20, 20, 0] }}
                                transition={{ duration: 8, times: [0, 0.45, 0.5, 0.95, 1], repeat: Infinity }}
                                className="bg-[#2A3449] p-3 rounded-xl border border-white/5 flex justify-between items-center absolute bottom-0 w-full"
                            >
                                <div>
                                    <div className="text-sm font-medium text-white">TruckPro Diesel</div>
                                    <div className="text-xs text-yellow-500 flex items-center gap-1">
                                        ★★★★★ <span className="text-slate-500">(24)</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">Rate</div>
                                    <div className="text-sm font-mono text-white">$115/hr</div>
                                </div>
                            </motion.div>

                            {/* Card 2: Action Truck Service */}
                            <motion.div
                                animate={{ opacity: [0, 0, 1, 1, 0], x: [20, 20, 0, 0, -20] }}
                                transition={{ duration: 8, times: [0, 0.45, 0.5, 0.95, 1], repeat: Infinity }}
                                className="bg-[#2A3449] p-3 rounded-xl border border-emerald-500/30 flex justify-between items-center absolute bottom-0 w-full"
                            >
                                <div>
                                    <div className="text-sm font-medium text-white">Action Truck Svc</div>
                                    <div className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                                        <Check className="w-3 h-3" /> PREFERRED
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400">Spent</div>
                                    <div className="text-sm font-mono text-white">$12.4k</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
