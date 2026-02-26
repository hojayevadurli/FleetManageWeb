import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { MotiveConnectModal } from '@/components/integrations/MotiveConnectModal';
import { MotiveManageModal } from '@/components/integrations/MotiveManageModal';
import { integrationService, IntegrationStatus, IntegrationProvider } from '@/services/integrationService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IntegrationsPage = () => {
    const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Modals state
    const [motiveConnectOpen, setMotiveConnectOpen] = useState(false);
    const [motiveManageOpen, setMotiveManageOpen] = useState(false);

    const { toast } = useToast();

    const fetchIntegrations = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await integrationService.getIntegrations();
            setIntegrations(data);
        } catch (e) {
            console.error("Failed to load integrations", e);
            setError(true);
            toast({
                title: "Error",
                description: "Failed to load integration status.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const refreshSilent = async () => {
        try {
            const data = await integrationService.getIntegrations();
            setIntegrations(data);
        } catch (e) {
            console.error("Silent refresh failed", e);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const handleConnect = (provider: IntegrationProvider) => {
        if (provider === 'Motive') {
            setMotiveConnectOpen(true);
        }
    };

    const handleManage = (provider: IntegrationProvider) => {
        if (provider === 'Motive') {
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
        return integrations.find(i => i.provider === provider);
    };

    const getStatus = (provider: IntegrationProvider) => {
        const int = getIntegration(provider);
        return int?.status || 'Disconnected';
    };

    if (loading && integrations.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && integrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <div className="text-center">
                    <h3 className="text-lg font-bold text-slate-900">Failed to load integrations</h3>
                    <p className="text-slate-500">We couldn't connect to the server.</p>
                </div>
                <Button onClick={fetchIntegrations} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
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

            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Integrations</h1>
                    <p className="text-slate-500 text-lg">Connect FleetManage with external systems to automate operations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Motive Card */}
                    <IntegrationCard
                        logo="https://assets.website-files.com/62a8d672221c9b68627730e6/62b4065633a6972e25902099_Motive-Logo.svg"
                        name="Motive"
                        description="Sync vehicles, locations, odometer, fuel %, engine hours, and driver assignment from Motive."
                        status="ComingSoon"
                        onNotifyMe={() => handleNotifyMe('Motive')}
                    />

                    {/* TAFS Card */}
                    <IntegrationCard
                        logo="https://tafs.com/wp-content/uploads/2020/07/TAFS-Logo-2020.png"
                        name="TAFS"
                        description="Automatically export all invoices to TAFS."
                        status="ComingSoon"
                        onNotifyMe={() => handleNotifyMe('TAFS')}
                    />

                    {/* WEX Card */}
                    <IntegrationCard
                        logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/WEX_Inc._logo.svg/2560px-WEX_Inc._logo.svg.png"
                        name="WEX (EFS)"
                        description="Automatically import all EFS fuel transactions from WEX."
                        status="ComingSoon"
                        onNotifyMe={() => handleNotifyMe('WEX')}
                    />
                </div>

                {/* Modals */}
                <MotiveConnectModal
                    open={motiveConnectOpen}
                    onOpenChange={setMotiveConnectOpen}
                    onSuccess={refreshSilent}
                />

                <MotiveManageModal
                    open={motiveManageOpen}
                    onOpenChange={setMotiveManageOpen}
                    integration={getIntegration('Motive')}
                    onRefresh={refreshSilent}
                />
            </div>
        </>
    );
};

export default IntegrationsPage;
