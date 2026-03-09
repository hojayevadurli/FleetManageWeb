import React, { useEffect, useState } from 'react';
import type {
    MaintenancePredictionSummary,
    PredictedMaintenanceEvent,
    PredictionUrgency,
} from '../../types/maintenance';
import {
    getMaintenancePredictionSummary,
    getMaintenancePredictions,
    getRiskLevelText,
    getConfidenceLevelText
} from '../../lib/maintenanceApi';

const MaintenancePredictionsPage: React.FC = () => {
    const [summary, setSummary] = useState<MaintenancePredictionSummary | null>(null);
    const [predictions, setPredictions] = useState<PredictedMaintenanceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [urgency, setUrgency] = useState<PredictionUrgency | ''>('');
    const [minRiskScore, setMinRiskScore] = useState<number | ''>('');

    useEffect(() => {
        void loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError(null);

            const [summaryResult, predictionResult] = await Promise.all([
                getMaintenancePredictionSummary(),
                getMaintenancePredictions({ take: 25 }),
            ]);

            setSummary(summaryResult);
            setPredictions(predictionResult);
        } catch (err) {
            console.error(err);
            setError('Failed to load maintenance predictions.');
        } finally {
            setLoading(false);
        }
    }

    async function applyFilters() {
        try {
            setLoading(true);
            setError(null);

            const predictionResult = await getMaintenancePredictions({
                urgency: urgency || undefined,
                minRiskScore: minRiskScore === '' ? undefined : Number(minRiskScore),
                take: 25,
            });

            setPredictions(predictionResult);
        } catch (err) {
            console.error(err);
            setError('Failed to load filtered predictions.');
        } finally {
            setLoading(false);
        }
    }

    if (loading && !summary) {
        return <div className="p-6">Loading maintenance intelligence...</div>;
    }

    if (error && !summary) {
        return <div className="p-6 text-red-600">{error}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Maintenance Predictions</h1>
                <p className="text-slate-500">
                    Preventative maintenance insights, risk windows, and savings opportunities.
                </p>
            </div>

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SummaryCard label="Critical" value={summary.criticalCount} />
                    <SummaryCard label="High" value={summary.highCount} />
                    <SummaryCard label="At Risk Units" value={summary.uniqueEquipmentAtRisk} />
                    <SummaryCard
                        label="Potential Savings"
                        value={`$${summary.estimatedTotalSavings.toLocaleString()}`}
                    />
                </div>
            )}

            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">Urgency</label>
                    <select
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value as PredictionUrgency | '')}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="">All</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Min Risk Score</label>
                    <input
                        type="number"
                        value={minRiskScore}
                        onChange={(e) =>
                            setMinRiskScore(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="border rounded-lg px-3 py-2 w-32"
                        min={0}
                        max={100}
                    />
                </div>

                <button
                    onClick={applyFilters}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white"
                >
                    Apply
                </button>
            </div>

            {error && <div className="text-red-600">{error}</div>}

            <div className="space-y-4">
                {predictions.map((item) => (
                    <PredictionCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

function SummaryCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
    );
}

function PredictionCard({ item }: { item: PredictedMaintenanceEvent }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm text-slate-500">{item.equipmentDisplayName}</div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-slate-600">{item.description}</p>
                </div>

                <div className="text-right">
                    <div className="text-sm">Risk: <span className="font-semibold text-slate-800">{getRiskLevelText(item.riskScore)}</span></div>
                    <div className="text-sm">Confidence: <span className="font-semibold text-slate-800">{getConfidenceLevelText(item.confidenceScore)}</span></div>
                    <div className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${item.urgency === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : item.urgency === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : item.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {item.urgency.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <Info label="Category" value={item.category} />
                <Info
                    label="Failure Window"
                    value={
                        item.failureWindowStartMileage && item.failureWindowEndMileage
                            ? `${item.failureWindowStartMileage.toLocaleString()} - ${item.failureWindowEndMileage.toLocaleString()}`
                            : '—'
                    }
                />
                <Info
                    label="Repair Cost"
                    value={
                        item.estimatedRepairCost != null
                            ? `$${item.estimatedRepairCost.toLocaleString()}`
                            : '—'
                    }
                />
                <Info
                    label="Potential Savings"
                    value={
                        item.estimatedSavings != null
                            ? `$${item.estimatedSavings.toLocaleString()}`
                            : '—'
                    }
                />
            </div>

            <div className="mt-4">
                <div className="text-sm font-medium text-slate-700">Recommended action</div>
                <div className="text-sm text-slate-600 mt-1">{item.recommendedAction}</div>
            </div>

            {item.rationale?.length > 0 && (
                <div className="mt-4">
                    <div className="text-sm font-medium text-slate-700">Why this alert</div>
                    <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
                        {item.rationale.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-slate-500">{label}</div>
            <div className="font-medium text-slate-800">{value}</div>
        </div>
    );
}

export default MaintenancePredictionsPage;
