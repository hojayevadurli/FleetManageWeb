import React from 'react';
import { Bot, Zap, Layers, AlertCircle, Settings } from 'lucide-react';
import type { PredictedMaintenanceEvent, PredictionUrgency } from '../../types/maintenance';
import { getRiskLevelText } from '../../lib/maintenanceApi';

interface AIPMLogicStreamWidgetProps {
    predictions: PredictedMaintenanceEvent[];
}

const getUrgencyConfig = (urgency: PredictionUrgency) => {
    switch (urgency) {
        case 'critical':
            return {
                icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
                label: 'Critical Forecast',
                badgeClass: 'bg-rose-100 text-rose-700',
                bgClass: 'hover:bg-rose-50/50 border-rose-100/50'
            };
        case 'high':
            return {
                icon: <Zap className="w-4 h-4 text-amber-500" />,
                label: 'High Risk Forecast',
                badgeClass: 'bg-amber-100 text-amber-700',
                bgClass: 'hover:bg-amber-50/50 border-amber-100/50'
            };
        case 'medium':
            return {
                icon: <Layers className="w-4 h-4 text-yellow-500" />,
                label: 'Medium Risk',
                badgeClass: 'bg-yellow-100 text-yellow-700',
                bgClass: 'hover:bg-yellow-50/50 border-yellow-100/50'
            };
        case 'low':
        default:
            return {
                icon: <Settings className="w-4 h-4 text-emerald-500" />,
                label: 'Routine Forecast',
                badgeClass: 'bg-emerald-100 text-emerald-700',
                bgClass: 'hover:bg-emerald-50/50 border-emerald-100/50'
            };
    }
};

const AIPMLogicStreamWidget: React.FC<AIPMLogicStreamWidgetProps> = ({ predictions }) => {
    return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full min-h-[500px]">
            <div className="p-6 border-b border-slate-100 bg-slate-900 relative overflow-hidden flex items-center justify-between">
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <h3 className="font-black text-white text-lg tracking-tight">AI PM Logic Stream</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Real-time backend inference & predictions
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative custom-scrollbar">
                {predictions.length === 0 ? (
                    <div className="p-10 text-center opacity-50">
                        <Bot className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                        <div className="text-sm font-bold text-slate-500">No predictions available.</div>
                        <div className="text-xs text-slate-400 mt-1">The AI engine is waiting for more data to generate insights.</div>
                    </div>
                ) : (
                    predictions.map((pred) => {
                        const config = getUrgencyConfig(pred.urgency);

                        return (
                            <div
                                key={pred.id}
                                className={`p-4 rounded-xl border transition-colors duration-300 relative ${config.bgClass}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-lg border shadow-sm flex items-center justify-center">
                                        {config.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${config.badgeClass}`}
                                                >
                                                    {config.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                                                    Unit: {pred.equipmentDisplayName || pred.unitNumber}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Risk: {getRiskLevelText(pred.riskScore)}
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-slate-800 text-sm mb-0.5">
                                            {pred.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium mb-2">
                                            {pred.description}
                                        </p>

                                        <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block font-semibold">
                                            Action: {pred.recommendedAction}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AIPMLogicStreamWidget;