import React from 'react';
import { Sparkles, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';

interface ForecastItem {
    unit: string;
    prediction: string;
    probability: number;
    daysLeft: number;
    type: 'critical' | 'warning' | 'info';
}

const AIPredictiveForecast = () => {
    const forecasts: ForecastItem[] = [
        { unit: '2022-T1', prediction: 'Brake Pad Replacement Required', probability: 94, daysLeft: 12, type: 'critical' },
        { unit: 'TRK-010', prediction: 'Engine Oil Degradation Alert', probability: 88, daysLeft: 4, type: 'warning' },
        { unit: '2019-V5', prediction: 'Scheduled PM-B Inspection', probability: 99, daysLeft: 22, type: 'info' },
    ];

    return (
        <div className="space-y-4">
            {forecasts.map((f, i) => (
                <div key={i} className="group p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-blue-200 hover:bg-white transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${f.type === 'critical' ? 'bg-rose-500 animate-pulse' :
                                    f.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                }`} />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{f.unit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{f.probability}% Match</span>
                        </div>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight mb-2">{f.prediction}</h4>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">ETA: {f.daysLeft} Days</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                </div>
            ))}

            <div className="p-4 rounded-2xl bg-blue-600 text-white flex items-center justify-between shadow-lg shadow-blue-500/20 mt-6">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Network Prediction</div>
                    <div className="text-sm font-black">Fleet Health Optimized</div>
                </div>
                <AlertCircle className="w-5 h-5 opacity-50" />
            </div>
        </div>
    );
};

export default AIPredictiveForecast;
