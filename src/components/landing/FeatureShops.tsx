import { MapPin, Star, Building2, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const FeatureShops = () => {
    return (
        <section className="py-24 bg-[#0F172A] relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side (Map) - Animation */}
                    <div className="order-2 relative group h-[400px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />

                        <motion.div
                            animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.95, 1, 1, 1, 0.95] }}
                            transition={{ duration: 10, times: [0, 0.1, 0.85, 0.95, 1], repeat: Infinity }}
                            className="bg-[#1E2536] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-10 w-full max-w-[500px]"
                        >
                            {/* Map Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex bg-[#0F172A] rounded-lg p-1 border border-white/5">
                                    <div className="px-3 py-1 bg-[#2A3449] rounded text-xs text-white">Map</div>
                                    <div className="px-3 py-1 text-xs text-slate-500">List</div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-lg border border-white/5 w-48 relative overflow-hidden">
                                    <motion.div
                                        animate={{ opacity: [0, 0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
                                    />
                                    <Search className="w-3 h-3" />
                                    <span className="text-xs">Find shops nearby...</span>
                                </div>
                            </div>

                            {/* Map Area */}
                            <div className="relative h-64 bg-[#2A3449] rounded-xl overflow-hidden mb-4 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-97.7431,30.2672,12,0/800x600?access_token=pk.eyJ1IjoiZ29vZ2xlIiwiYSI6ImNqemg1eXF5MTAxfTMzaHF5aG55aG55aGgifQ.Xt1')] bg-cover bg-center opacity-80 grayscale-[0.5]" role="img" aria-label="Map showing preferred truck repair shops with ratings and hourly rates">
                                <div className="absolute inset-0 bg-[#2A3449]/50" />

                                {/* Pin 1 (Standard) */}
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.8, type: "spring", bounce: 0.5 }} // Part of loop handled by parent Reset? No, parent resets whole DOM? No.
                                    // Better to use explicit sequence relative to parent loop time.
                                    // Let's use `times` prop with parent duration if possible, OR just simple delay/repeat.
                                    // Simple delay/repeat with parent duration 10s:
                                    // Delay 0.08 * 10 = 0.8s
                                    style={{ position: 'absolute', top: '60%', left: '30%' }}
                                >
                                    <motion.div
                                        animate={{ y: [-50, 0], opacity: [0, 1] }}
                                        transition={{ duration: 0.6, delay: 1, repeat: Infinity, repeatDelay: 9.4 }}
                                        className="relative"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-slate-500 border-2 border-[#1E2536] flex items-center justify-center shadow-lg">
                                            <Building2 className="w-3 h-3 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                            transition={{ duration: 1, delay: 1.6, repeat: Infinity, repeatDelay: 9 }}
                                            className="absolute -inset-2 bg-slate-500/30 rounded-full z-[-1]"
                                        />
                                    </motion.div>
                                </motion.div>

                                {/* Pin 2 (Partner) */}
                                <motion.div style={{ position: 'absolute', top: '70%', left: '70%' }}>
                                    <motion.div
                                        animate={{ y: [-50, 0], opacity: [0, 1] }}
                                        transition={{ duration: 0.6, delay: 1.2, repeat: Infinity, repeatDelay: 9.4 }}
                                        className="relative"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#1E2536] flex items-center justify-center shadow-lg">
                                            <Building2 className="w-3 h-3 text-white" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                            transition={{ duration: 1, delay: 1.8, repeat: Infinity, repeatDelay: 9 }}
                                            className="absolute -inset-2 bg-blue-500/30 rounded-full z-[-1]"
                                        />
                                    </motion.div>
                                </motion.div>


                                {/* Pin 3 (Preferred - Hero) */}
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
                                    <motion.div
                                        animate={{ y: [-50, 0], opacity: [0, 1] }}
                                        transition={{ duration: 0.6, delay: 1.4, repeat: Infinity, repeatDelay: 9.4 }}
                                        className="relative z-20 cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#1E2536] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <Star className="w-4 h-4 text-white fill-white" />
                                        </div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45 border-r border-b border-[#1E2536]" />
                                        <motion.div
                                            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                            transition={{ duration: 1.5, delay: 2, repeat: Infinity, repeatDelay: 8.5 }}
                                            className="absolute -inset-4 bg-emerald-500/30 rounded-full z-[-1]"
                                        />
                                    </motion.div>
                                </div>

                                {/* Shop Card Popover */}
                                <motion.div
                                    animate={{ y: [40, 0, 0, 40], opacity: [0, 1, 1, 0] }}
                                    transition={{ duration: 10, times: [0.2, 0.25, 0.85, 0.9], repeat: Infinity }} // Slide up at 2s (0.2 * 10)
                                    className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-6 w-56 bg-[#1A1F2E] rounded-xl border border-white/10 p-3 shadow-2xl z-30 mt-8"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-xs font-bold text-white">Action Truck Service</div>
                                            <div className="flex items-center gap-1 text-[10px] text-yellow-500 mt-0.5">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <motion.div
                                                            key={s}
                                                            animate={{ scale: [0, 1], opacity: [0, 1] }}
                                                            transition={{ delay: 2.5 + (s * 0.1), duration: 0.3, repeat: Infinity, repeatDelay: 9.2 }}
                                                        >
                                                            <Star className={`w-3 h-3 ${s === 5 ? 'text-yellow-500 fill-transparent' : 'fill-yellow-500'}`} />
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <motion.span
                                                    animate={{ opacity: [0, 1] }}
                                                    transition={{ delay: 3, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                                >
                                                    4.9 (23)
                                                </motion.span>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ scale: [0.9, 1.1, 1] }}
                                            transition={{ delay: 2.5, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                            className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                                        >
                                            Preferred
                                        </motion.div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-2">
                                        <div>
                                            <div className="text-slate-500">Rate</div>
                                            <motion.div
                                                animate={{ x: [-10, 0], opacity: [0, 1] }}
                                                transition={{ delay: 3.2, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                                className="text-white font-mono"
                                            >
                                                $115/hr
                                            </motion.div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-500">Spent</div>
                                            <motion.div
                                                animate={{ opacity: [0, 1] }}
                                                transition={{ delay: 3.4, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                                className="text-white font-mono"
                                            >
                                                $12.4k
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 justify-center text-[10px] text-slate-400">
                                <motion.div
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ delay: 4, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                    className="flex items-center gap-1"
                                >
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Preferred
                                </motion.div>
                                <motion.div
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ delay: 4.2, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                    className="flex items-center gap-1"
                                >
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Partner
                                </motion.div>
                                <motion.div
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ delay: 4.4, duration: 0.5, repeat: Infinity, repeatDelay: 9.5 }}
                                    className="flex items-center gap-1"
                                >
                                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                                    Standard
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Content Side */}
                    <div className="order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 mb-6">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">Repair Shop Network Management</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Find Trusted Repair Shops<br />
                            <span className="text-emerald-400">Without Getting Overcharged</span>
                        </h2>

                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Manage all your repair shops in one place. See community ratings, track spending by vendor, and find the best shops on the map instantly.
                        </p>

                        <div className="space-y-6 mb-8">
                            {[
                                { title: "Track Every Dollar", desc: "See exactly how much you spend at each shop over time." },
                                { title: "Rate & Review", desc: "Build a database of trusted partners based on real experience." },
                                { title: "Compare Rates", desc: "Know the hourly rates and hidden fees before you go." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 bg-[#1E2536] rounded-xl flex items-center justify-center border border-white/5 shrink-0 group-hover:border-emerald-500/30 transition-colors">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">{item.title}</h3>
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

export default FeatureShops;
