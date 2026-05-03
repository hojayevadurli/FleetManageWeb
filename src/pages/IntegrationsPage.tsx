import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { MotiveConnectModal } from "@/components/integrations/MotiveConnectModal";
import { MotiveManageModal } from "@/components/integrations/MotiveManageModal";
import { integrationService } from "@/services/integrationService";
import { IntegrationStatus, IntegrationProvider } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type CardStatus = "Connected" | "Disconnected" | "ComingSoon" | "Error" | "Connecting";

const IntegrationsPage = () => {
    const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retrying, setRetrying] = useState(false);

    const [motiveConnectOpen, setMotiveConnectOpen] = useState(false);
    const [motiveManageOpen, setMotiveManageOpen] = useState(false);

    const { toast } = useToast();

    const fetchIntegrations = useCallback(async (showToastOnError = true) => {
        setLoading(true);
        setError(false);

        try {
            const data = await integrationService.getIntegrations();
            setIntegrations(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to load integrations", e);
            setError(true);

            if (showToastOnError) {
                toast({
                    title: "Error",
                    description: "Failed to load integration status.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            await fetchIntegrations(true);
        } finally {
            setRetrying(false);
        }
    };

    const refreshSilent = useCallback(async () => {
        try {
            const data = await integrationService.getIntegrations();
            setIntegrations(Array.isArray(data) ? data : []);
            setError(false);
        } catch (e) {
            console.error("Silent refresh failed", e);
        }
    }, []);

    useEffect(() => {
        fetchIntegrations(true);
    }, [fetchIntegrations]);

    const handleConnect = (provider: IntegrationProvider) => {
        if (provider === "Motive") {
            setMotiveConnectOpen(true);
        }
    };

    const handleManage = (provider: IntegrationProvider) => {
        if (provider === "Motive") {
            setMotiveManageOpen(true);
        }
    };

    const handleNotifyMe = (provider: string) => {
        toast({
            title: "Subscribed",
            description: `We'll notify you when ${provider} integration is available.`,
        });
    };

    const getIntegration = (provider: IntegrationProvider) => {
        return integrations.find((i) => i.provider === provider);
    };

    const normalizeStatus = (status?: string): CardStatus => {
        switch (status) {
            case "Connected":
            case "Disconnected":
            case "ComingSoon":
            case "Error":
            case "Connecting":
                return status;
            default:
                return "Disconnected";
        }
    };

    const getStatus = (provider: IntegrationProvider): CardStatus => {
        const integration = getIntegration(provider);
        return normalizeStatus(integration?.status);
    };

    if (loading && integrations.length === 0) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && integrations.length === 0) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-rose-500" />
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">Failed to load integrations</h3>
                    <p className="text-slate-500">We couldn't connect to the server.</p>
                </div>
                <Button onClick={handleRetry} variant="outline" className="gap-2" disabled={retrying}>
                    {retrying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Integrations | FleetManage</title>
            </Helmet>

            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Integrations</h1>
                    <p className="text-lg text-slate-500">
                        Connect FleetManage with external systems to automate operations.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <IntegrationCard
                        logo="/motive-logo.png"
                        name="Motive"
                        description="Sync vehicles, locations, odometer, fuel %, engine hours, and driver assignment from Motive."
                        status={getStatus("Motive")}
                        onConnect={() => handleConnect("Motive")}
                        onManage={() => handleManage("Motive")}
                        onNotifyMe={() => handleNotifyMe("Motive")}
                    />

                    <IntegrationCard
                        logo="/tafs-logo.png"
                        name="TAFS"
                        description="Automatically export all invoices to TAFS."
                        status="ComingSoon"
                        onNotifyMe={() => handleNotifyMe("TAFS")}
                    />

                    <IntegrationCard
                        logo="/wex-logo.png"
                        name="WEX (EFS)"
                        description="Automatically import all EFS fuel transactions from WEX."
                        status="ComingSoon"
                        onNotifyMe={() => handleNotifyMe("WEX")}
                    />
                </div>

                <MotiveConnectModal
                    open={motiveConnectOpen}
                    onOpenChange={setMotiveConnectOpen}
                    onSuccess={refreshSilent}
                />

                <MotiveManageModal
                    open={motiveManageOpen}
                    onOpenChange={setMotiveManageOpen}
                    integration={getIntegration("Motive")}
                    onRefresh={refreshSilent}
                />
            </div>
        </>
    );
};

export default IntegrationsPage;