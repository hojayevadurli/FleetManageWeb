import { Check, X, Minus } from "lucide-react";

const Comparison = () => {
    return (
        <section className="py-24 bg-[#0F172A]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Verify vs. Trust
                    </h2>
                    <p className="text-lg text-slate-400">
                        See why small fleets are switching from spreadsheets and enterprise software to FleetManage AI.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full max-w-5xl mx-auto text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-4 text-slate-400 font-medium w-1/3">Feature</th>
                                <th className="p-4 text-slate-400 font-medium w-1/4">Traditional Software</th>
                                <th className="p-4 text-slate-400 font-medium w-1/4">Excel / Paper</th>
                                <th className="p-4 bg-[#1E2536] text-[#4F7CFF] font-bold border-t-2 border-t-[#4F7CFF] rounded-t-xl w-1/4">
                                    FleetManage AI
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            {[
                                {
                                    feature: "Data Entry",
                                    trad: "Manual typing",
                                    paper: "Fully manual",
                                    us: "AI Receipt Scanning"
                                },
                                {
                                    feature: "Searchability",
                                    trad: "Complex filters",
                                    paper: "Impossible",
                                    us: "Natural Language Chat"
                                },
                                {
                                    feature: "Setup Time",
                                    trad: "Weeks/Months",
                                    paper: "Instant",
                                    us: "< 5 Minutes"
                                },
                                {
                                    feature: "Cost",
                                    trad: "$$$ (Contracts)",
                                    paper: "Free (Time cost)",
                                    us: "$6/mo per truck"
                                },
                                {
                                    feature: "Warranty Tracking",
                                    trad: "Add-on Module",
                                    paper: "Manual check",
                                    us: "Automated AI"
                                }
                            ].map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{row.feature}</td>
                                    <td className="p-4 text-slate-500">{row.trad}</td>
                                    <td className="p-4 text-slate-500">{row.paper}</td>
                                    <td className="p-4 bg-[#1E2536] text-white font-bold border-x border-[#1E2536] first:rounded-bl-xl last:rounded-br-xl">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {row.us}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default Comparison;
