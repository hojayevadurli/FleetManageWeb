import type {
    MaintenancePredictionSummary,
    PredictedMaintenanceEvent,
    PredictionUrgency,
} from '../types/maintenance';
import { api } from './Api'; // adjust if your app uses a different client

export interface GetPredictionsParams {
    equipmentId?: number;
    urgency?: PredictionUrgency;
    minRiskScore?: number;
    take?: number;
}

function toQueryString(params: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            search.set(key, String(value));
        }
    });

    const qs = search.toString();
    return qs ? `?${qs}` : '';
}

export async function getMaintenancePredictionSummary(): Promise<MaintenancePredictionSummary> {
    const response = await api.get('/Maintenance/predictions/summary');
    return response.data;
}

export async function getMaintenancePredictions(
    params: GetPredictionsParams = {}
): Promise<PredictedMaintenanceEvent[]> {
    const { equipmentId, urgency, minRiskScore, take = 50 } = params;

    const qs = toQueryString({
        urgency,
        minRiskScore,
        take,
    });

    const url = equipmentId
        ? `/Maintenance/predictions/${equipmentId}${qs}`
        : `/Maintenance/predictions${qs}`;

    const response = await api.get(url);
    return response.data;
}

export function getRiskLevelText(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Elevated';
    if (score >= 20) return 'Moderate';
    return 'Low';
}

export function getConfidenceLevelText(score: number): string {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
}
