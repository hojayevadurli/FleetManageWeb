import { motion } from "framer-motion";
import { Truck, AlertTriangle, CheckCircle2, TrendingUp, MapPin, Wrench } from "lucide-react";

const activities = [
    {
        icon: Truck,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        title: "Truck #4021",
        desc: "Completed oil change at Joe's Truck Shop",
        time: "2 hours ago"
    },
    {
        icon: TrendingUp,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        title: "$2,840 Saved",
        desc: "Warranty covered transmission repair",
        time: "5 hours ago"
    },
    {
        icon: AlertTriangle,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
        title: "Truck #5192",
        desc: "Due for inspection in 3 days",
        time: "Today"
    },
    {
        icon: CheckCircle2,
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        title: "New Milestone",
        desc: "500,000 miles tracked across fleet",
        time: "Yesterday"
    },
    {
        icon: MapPin,
        color: "text-pink-400",
        bg: "bg-pink-400/10",
        border: "border-pink-400/20",
        title: "Action Truck Service",
        desc: "Added to your preferred shops network",
        time: "Yesterday"
    },
    {
        icon: Wrench,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10",
        border: "border-cyan-400/20",
        title: "Work Order #8821",
        desc: "Brake pad replacement approved",
        time: "2 days ago"
    }
];

export const LoginActivityFeed = () => {
    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-8 overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                    <div>
                        <h3 className="text-white font-bold text-lg">Recent Fleet Activity</h3>
                        <p className="text-slate-400 text-xs">Live updates from your operations</p>
                    </div>
                </div>

                <div className="relative h-[400px] overflow-hidden mask-gradient-b">
                    {/* Fade Masks */}
                    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0B1121] to-transparent z-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0B1121] to-transparent z-20 pointer-events-none" />

                    <motion.div
                        animate={{ y: [0, -400] }} // Adjust based on height of items
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "loop"
                        }}
                        className="space-y-4"
                    >
                        {/* Render items twice for seamless loop */}
                        {[...activities, ...activities].map((item, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border ${item.border} bg-[#1E2536]/50 backdrop-blur-sm shadow-sm flex gap-4 items-start`}
                            >
                                <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-white font-medium text-sm truncate pr-2">{item.title}</h4>
                                        <span className="text-[10px] text-slate-500 whitespace-nowrap">{item.time}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
