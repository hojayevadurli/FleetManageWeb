import api from "@/lib/Api";
import { Integration } from "@/lib/types";

type MotiveImportDefaults = {
    autoCreateAssets: boolean;
    autoCreateOperators: boolean;
    autoSyncTelemetry: boolean;
    importInactiveVehicles: boolean;
    defaultEquipmentStatus: string | null;
    defaultEquipmentType: string | null;
    defaultOperatorStatus: string | null;
};

// Mock data as fallback
const MOCK_INTEGRATIONS: Integration[] = [
    {
        id: "1",
        provider: "Motive",
        status: "Disconnected",
        lastSync: null,
        vehicleCount: 0,
        apiKey: "",
    },
    {
        id: "2",
        provider: "Samsara",
        status: "Disconnected",
        lastSync: null,
        vehicleCount: 0,
        apiKey: "",
    },
];

export const integrationService = {
    getIntegrations: async (): Promise<Integration[]> => {
        try {
            const response = await api.get("/integrations/motive/status");

            let backendIntegrations: any[] = [];
            if (Array.isArray(response.data)) {
                backendIntegrations = response.data.map((item: any) => ({
                    ...item,
                    provider: item.provider || "Motive",
                }));
            } else if (response.data && typeof response.data === "object") {
                backendIntegrations = [
                    {
                        ...response.data,
                        provider: response.data.provider || "Motive",
                    },
                ];
            }

            return MOCK_INTEGRATIONS.map((mock) => {
                const found = backendIntegrations.find((b) => b.provider === mock.provider);

                if (found) {
                    return {
                        ...mock,
                        id: found.id || mock.id,
                        provider: mock.provider,
                        status: found.isConnected ? "Connected" : "Disconnected",
                        apiKey: found.isConnected ? "********" : "",
                        lastSync: found.lastSyncedAt ? new Date(found.lastSyncedAt) : null,
                        vehicleCount: found.vehicleCount || 0,
                    };
                }

                return mock;
            });
        } catch (error) {
            console.warn("Failed to fetch integrations, using mock", error);
            return MOCK_INTEGRATIONS;
        }
    },

    connectMotive: async (
        apiKey: string,
        accountId?: string
    ): Promise<{ success: boolean }> => {
        const response = await api.post("/integrations/motive/connect", {
            provider: "Motive",
            apiKey,
            accountId,
        });

        return response.data;
    },

    disconnect: async (provider: string): Promise<void> => {
        console.log(`Disconnecting ${provider}...`);
    },

    syncMotive: async (): Promise<any> => {
        try {
            const response = await api.post("/integrations/motive/sync-driver-location-odometer");
            return response.data;
        } catch (error: any) {
            console.error("Sync failed:", error);

            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Unknown sync error");
            }

            throw error;
        }
    },

    // Syncs fuel level (and any other telematics not covered by the location sync).
    // Falls back silently if the endpoint doesn't exist yet on the backend.
    syncMotiveFuel: async (): Promise<any> => {
        try {
            const response = await api.post("/integrations/motive/sync-fuel-level");
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return null; // endpoint not deployed yet
            console.error("Fuel sync failed:", error);
            return null;
        }
    },

    testMotiveConnection: async (apiKey: string, accountId?: string): Promise<boolean> => {
        try {
            const response = await api.post("/integrations/motive/test", {
                provider: "Motive",
                apiKey,
                accountId,
            });

            return !!response.data?.success;
        } catch {
            return false;
        }
    },

    syncMotiveVehicles: async (): Promise<{ created: number; updated: number }> => {
        try {
            const response = await api.post("/integrations/motive/sync-vehicles");
            return response.data;
        } catch (error: any) {
            console.error("Vehicle sync failed:", error);

            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not sync vehicles");
            }

            throw error;
        }
    },

    getMotiveVehicles: async (): Promise<{ created: number; updated: number }> => {
        return integrationService.syncMotiveVehicles();
    },

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
            console.error("Failed to load Motive import defaults:", error);

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
            console.error("Failed to save Motive import defaults:", error);

            if (error.response?.data) {
                const { message, error: errorTitle, detail } = error.response.data;
                throw new Error(detail || message || errorTitle || "Could not save import defaults");
            }

            throw error;
        }
    },

    saveMotiveMappings: async (mappings: any[]): Promise<void> => {
        try {
            await api.post("/integrations/motive/save-mappings", mappings);
        } catch {
            console.log("No backend save mapping endpoint implemented yet. Ignoring error.");
        }
    },
};