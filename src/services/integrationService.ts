import api from "@/lib/Api.temp";
import { Integration } from "@/lib/types";

// Mock data as fallback
const MOCK_INTEGRATIONS: Integration[] = [
    {
        id: "1",
        provider: "Motive",
        status: "Disconnected",
        lastSync: null,
        vehicleCount: 0,
        apiKey: "", // Start empty
    },
    {
        id: "2", // Samsara
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
            const response = await api.get("/integrations");
            // Merge generic list with our known providers to ensure UI shows available options
            const backendIntegrations = response.data as Integration[];

            return MOCK_INTEGRATIONS.map(mock => {
                const found = backendIntegrations.find(b => b.provider === mock.provider);
                if (found) {
                    return {
                        ...mock,
                        ...found,
                        id: found.id || mock.id, // Use backend ID if available
                        status: found.status || "Connected", // If returned, it's likely connected
                        apiKey: found.apiKeyEncrypted ? "********" : "", // Mask key
                        lastSync: found.lastSyncAt ? new Date(found.lastSyncAt) : null,
                        vehicleCount: found.vehicleCount || 0
                    };
                }
                return mock;
            });
        } catch (error) {
            console.warn("Failed to fetch integrations, using mock", error);
            return MOCK_INTEGRATIONS;
        }
    },

    connectMotive: async (apiKey: string, accountId?: string): Promise<Integration> => {
        // POST /integrations/connect
        const response = await api.post("/integrations/connect", {
            provider: "Motive",
            apiKey,
            accountId
        });
        return response.data;
    },

    disconnect: async (provider: string): Promise<void> => {
        // Not implemented on backend yet, just mock
        console.log(`Disconnecting ${provider}...`);
    },

    syncMotive: async (): Promise<{ success: boolean; vehiclesSynced: number; message?: string }> => {
        try {
            const response = await api.post("/integrations/motive/sync");
            return response.data;
        } catch (error: any) {
            console.error("Sync failed:", error);
            if (error.response?.data) {
                const { errorCode, message, error: errorTitle } = error.response.data;
                throw new Error(message || errorTitle || "Unknown sync error");
            }
            throw error;
        }
    },

    // Kept for testing if needed, but syncMotive is preferred
    testMotiveConnection: async (apiKey: string, accountId?: string): Promise<boolean> => {
        // We can reuse connect endpoint or just try to sync?
        // Let's use connect as test.
        try {
            await api.post("/integrations/connect", {
                provider: 'Motive',
                apiKey,
                accountId
            });
            return true;
        } catch (e) {
            return false;
        }
    },

    getMotiveVehicles: async () => {
        // This is likely replaced by syncMotive which updates DB, 
        // then we fetch from Equipment? 
        // Or this could specific endpoint.
        // For now, let's assume we rely on sync.
        return [];
    }
};
