export type PredictionUrgency = 'low' | 'medium' | 'high' | 'critical';
export type PredictionSeverity = 'info' | 'warning' | 'critical';

export type PredictionType =
    | 'pm_due'
    | 'pattern_failure'
    | 'repeat_issue'
    | 'bundling_opportunity'
    | 'data_quality';

export interface PredictedMaintenanceEvent {
    id: string;
    equipmentId: number;
    unitNumber: string;
    equipmentDisplayName: string;

    category: string;
    predictionType: PredictionType;

    title: string;
    description: string;

    riskScore: number;
    confidenceScore: number;

    urgency: PredictionUrgency;
    severity: PredictionSeverity;

    predictedFailureMileage?: number | null;
    failureWindowStartMileage?: number | null;
    failureWindowEndMileage?: number | null;

    recommendedWithinMiles?: number | null;

    estimatedRepairCost?: number | null;
    estimatedDowntimeDays?: number | null;
    estimatedSavings?: number | null;

    recommendedAction: string;
    rationale: string[];

    source: string;
    createdAtUtc: string;
}

export interface MaintenanceRiskCategorySummary {
    category: string;
    count: number;
    averageRiskScore: number;
}

export interface MaintenancePredictionSummary {
    totalPredictions: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;

    uniqueEquipmentAtRisk: number;

    averageRiskScore: number;
    averageConfidenceScore: number;

    estimatedTotalRepairCost: number;
    estimatedTotalDowntimeDays: number;
    estimatedTotalSavings: number;

    topRiskCategories: MaintenanceRiskCategorySummary[];
    topUrgentEvents: PredictedMaintenanceEvent[];
}
