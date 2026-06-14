import api from "@/lib/Api";
import { Integration } from "@/lib/types";

export type { Integration as IntegrationStatus };

type MotiveImportDefaults = {
    autoCreateAssets: boolean;
    autoCreateOperators: boolean;
    autoSyncTelemetry: boolean;
    importInactiveVehicles: boolean;
    defaultEquipmentStatus: string | null;
    defaultEquipmentType: string | null;
    defaultOperatorStatus: string | null;
};

type SamsaraImportDefaults = {
    autoCreateAssets: boolean;
    autoCreateOperators: boolean;
    autoSyncTelemetry: boolean;
    importInactiveDrivers: boolean;
    defaultEquipmentStatus: string | null;
    defaultEquipmentType: string | null;
    defaultOperatorStatus: string | null;
};

// Fallback entries when the backend is unreachable
const FALLBACK_INTEGRATIONS: Integration[] = [
    { id: "1", provider: "Motive", status: "Disconnected", lastSync: null, vehicleCount: 0, apiKey: "" },
    { id: "2", provider: "Samsara", status: "Disconnected", lastSync: null, vehicleCount: 0, apiKey: "" },
];

function mapStatusResponse(id: string, provider: string, data: any): Integration {
    return {
        id,
        provider,
        status: data?.isConnected ? "Connected" : "Disconnected",
        apiKey: data?.isConnected ? "********" : "",
        lastSync: data?.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
        lastSyncAt: data?.lastSyncedAt ?? undefined,
        vehicleCount: data?.vehicleCount ?? 0,
    };
}

export const integrationService = {
    getIntegrations: async (): Promise<Integration[]> => {
        const [motiveResult, samsaraResult] = await Promise.allSettled([
            api.get("/integrations/motive/status"),
            api.get("/integrations/samsara/status"),
        ]);

        return [
            motiveResult.status === "fulfilled"
                ? mapStatusResponse("1", "Motive", motiveResult.value.data)
                : { ...FALLBACK_INTEGRATIONS[0] },
            samsaraResult.status === "fulfilled"
                ? mapStatusResponse("2", "Samsara", samsaraResult.value.data)
                : { ...FALLBACK_INTEGRATIONS[1] },
        ];
    },

    // --- Motive ---

    connectMotive: async (apiKey: string, accountId?: string): Promise<{ success: boolean }> => {
        const response = await api.post("/integrations/motive/connect", { provider: "Motive", apiKey, accountId });
        return response.data;
    },

    testMotiveConnection: async (apiKey: string, accountId?: string): Promise<boolean> => {
        try {
            const response = await api.post("/integrations/motive/test", { provider: "Motive", apiKey, accountId });
            return !!response.data?.success;
        } catch {
            return false;
        }
    },

    syncMotive: async (): Promise<any> => {
        try {
            const response = await api.post("/integrations/motive/sync-driver-location-odometer");
            return response.data;
        } catch (error: any) {
            const data = error.response?.data;
            if (data) {
                const msg = typeof data === 'string' ? data : (data.detail || data.message || data.error || "Sync failed");
                throw new Error(msg);
            }
            throw error;
        }
    },

    syncMotiveVehicles: async (): Promise<{ created: number; updated: number }> => {
        try {
            const response = await api.post("/integrations/motive/sync-vehicles");
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not sync vehicles");
            }
            throw error;
        }
    },

    getMotiveVehicles: async (): Promise<{ created: number; updated: number }> =>
        integrationService.syncMotiveVehicles(),

    getMotiveImportDefaults: async (): Promise<MotiveImportDefaults> => {
        try {
            const response = await api.get("/integrations/motive/import-defaults");
            return {
                autoCreateAssets: response.data?.autoCreateAssets ?? true,
                autoCreateOperators: response.data?.autoCreateOperators ?? true,
                autoSyncTelemetry: response.data?.autoSyncTelemetry ?? true,
                importInactiveVehicles: response.data?.importInactiveVehicles ?? false,
                defaultEquipmentStatus: response.data?.defaultEquipmentStatus ?? null,
                defaultEquipmentType: response.data?.defaultEquipmentType ?? null,
                defaultOperatorStatus: response.data?.defaultOperatorStatus ?? null,
            };
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not load import defaults");
            }
            throw error;
        }
    },

    saveMotiveImportDefaults: async (payload: MotiveImportDefaults): Promise<{ success: boolean }> => {
        try {
            const response = await api.post("/integrations/motive/import-defaults", payload);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not save import defaults");
            }
            throw error;
        }
    },

    syncFaults: async (): Promise<{ synced: number }> => {
        const response = await api.post<{ synced: number }>("/integrations/motive/sync-faults");
        return response.data;
    },

    saveMotiveMappings: async (mappings: any[]): Promise<void> => {
        try {
            await api.post("/integrations/motive/save-mappings", mappings);
        } catch {
            // endpoint not yet implemented
        }
    },

    // --- Samsara ---

    connectSamsara: async (apiKey: string): Promise<{ success: boolean }> => {
        const response = await api.post("/integrations/samsara/connect", { apiKey });
        return response.data;
    },

    testSamsaraConnection: async (apiKey: string): Promise<boolean> => {
        try {
            const response = await api.post("/integrations/samsara/test", { apiKey });
            return !!response.data?.success;
        } catch {
            return false;
        }
    },

    syncSamsara: async (): Promise<any> => {
        try {
            const response = await api.post("/integrations/samsara/sync-driver-location-odometer");
            return response.data;
        } catch (error: any) {
            const data = error.response?.data;
            if (data) {
                const msg = typeof data === 'string' ? data : (data.detail || data.message || data.error || "Sync failed");
                throw new Error(msg);
            }
            throw error;
        }
    },

    syncSamsaraVehicles: async (): Promise<{ created: number; updated: number }> => {
        try {
            const response = await api.post("/integrations/samsara/sync-vehicles");
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not sync vehicles");
            }
            throw error;
        }
    },

    getSamsaraImportDefaults: async (): Promise<SamsaraImportDefaults> => {
        try {
            const response = await api.get("/integrations/samsara/import-defaults");
            return {
                autoCreateAssets: response.data?.autoCreateAssets ?? true,
                autoCreateOperators: response.data?.autoCreateOperators ?? true,
                autoSyncTelemetry: response.data?.autoSyncTelemetry ?? true,
                importInactiveDrivers: response.data?.importInactiveDrivers ?? false,
                defaultEquipmentStatus: response.data?.defaultEquipmentStatus ?? null,
                defaultEquipmentType: response.data?.defaultEquipmentType ?? null,
                defaultOperatorStatus: response.data?.defaultOperatorStatus ?? null,
            };
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not load import defaults");
            }
            throw error;
        }
    },

    saveSamsaraImportDefaults: async (payload: SamsaraImportDefaults): Promise<{ success: boolean }> => {
        try {
            const response = await api.post("/integrations/samsara/import-defaults", payload);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not save import defaults");
            }
            throw error;
        }
    },

    syncSamsaraFaults: async (): Promise<{ synced: number }> => {
        const response = await api.post<{ synced: number }>("/integrations/samsara/sync-faults");
        return response.data;
    },

    // --- Shared ---

    disconnect: async (provider: string): Promise<void> => {
        await integrationService.disconnectIntegration(provider);
    },

    disconnectIntegration: async (provider: string): Promise<void> => {
        if (provider === "Motive") {
            await api.post("/integrations/motive/disconnect");
        } else if (provider === "Samsara") {
            await api.post("/integrations/samsara/disconnect");
        } else {
            throw new Error(`Disconnect not implemented for provider: ${provider}`);
        }
    },

    // Syncs fuel level — kept for backwards compat, falls back silently if endpoint doesn't exist
    syncMotiveFuel: async (): Promise<any> => {
        try {
            const response = await api.post("/integrations/motive/sync-fuel-level");
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null;
            return null;
        }
    },
};
