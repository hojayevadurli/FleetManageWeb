import { MapPin, Star, Building2, Search, ArrowRight } from "lucide-react";

const FeatureShops = () => {
    return (
        <section className="py-24 bg-[#0F172A] relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side (Map) */}
                    <div className="order-2 relative group">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />

                        <div className="bg-[#1E2536] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-10">
                            {/* Map Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex bg-[#0F172A] rounded-lg p-1 border border-white/5">
                                    <div className="px-3 py-1 bg-[#2A3449] rounded text-xs text-white">Map</div>
                                    <div className="px-3 py-1 text-xs text-slate-500">List</div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 bg-[#0F172A] px-3 py-1.5 rounded-lg border border-white/5 w-48">
                                    <Search className="w-3 h-3" />
                                    <span className="text-xs">Find shops nearby...</span>
                                </div>
                            </div>

                            {/* Map Area */}
                            <div className="relative h-64 bg-[#2A3449] rounded-xl overflow-hidden mb-4 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-97.7431,30.2672,12,0/800x600?access_token=pk.eyJ1IjoiZ29vZ2xlIiwiYSI6ImNqemg1eXF5MTAxfTMzaHF5aG55aG55aGgifQ.Xt1')] bg-cover bg-center opacity-80 grayscale-[0.5]" role="img" aria-label="Map showing preferred truck repair shops with ratings and hourly rates">
                                <div className="absolute inset-0 bg-[#2A3449]/50" />

                                {/* Pins */}
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 transform hover:scale-110 transition-transform cursor-pointer">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#1E2536] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <Star className="w-4 h-4 text-white fill-white" />
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45 border-r border-b border-[#1E2536]" />
                                </div>

                                <div className="absolute top-2/3 left-1/4 transform hover:scale-110 transition-transform cursor-pointer">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#1E2536] flex items-center justify-center shadow-lg">
                                        <Building2 className="w-3 h-3 text-white" />
                                    </div>
                                </div>

                                {/* Shop Card Popover */}
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 translate-y-6 w-56 bg-[#1A1F2E] rounded-xl border border-white/10 p-3 shadow-2xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-xs font-bold text-white">Action Truck Service</div>
                                            <div className="flex items-center gap-1 text-[10px] text-yellow-500 mt-0.5">
                                                <Star className="w-3 h-3 fill-yellow-500" /> 4.9 (23)
                                            </div>
                                        </div>
                                        <div className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Preferred</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/5 pt-2">
                                        <div>
                                            <div className="text-slate-500">Rate</div>
                                            <div className="text-white font-mono">$115/hr</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-500">Spent</div>
                                            <div className="text-white font-mono">$12.4k</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-4 justify-center text-[10px] text-slate-400">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Preferred
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Partner
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                                    Standard
                                </div>
                            </div>
                        </div>
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
