import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Trash2, CheckCircle2, Clock, Activity, AlertTriangle, Truck } from "lucide-react";
import { integrationService, IntegrationStatus } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MotiveAssetSync } from "./MotiveAssetSync";

interface MotiveManageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    integration: IntegrationStatus | undefined;
    onRefresh: () => void;
}

export function MotiveManageModal({ open, onOpenChange, integration, onRefresh }: MotiveManageModalProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const { toast } = useToast();

    if (!integration) return null;

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            await integrationService.syncMotive();
            toast({
                title: "Sync Started",
                description: "Synchronization has been triggered in the background.",
            });
            onRefresh();
        } catch (e) {
            toast({
                title: "Sync Failed",
                description: "Failed to trigger sync. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect Motive? This will stop all data syncing.")) return;

        setIsDisconnecting(true);
        try {
            await integrationService.disconnectIntegration('Motive');
            toast({
                title: "Disconnected",
                description: "Motive has been disconnected.",
            });
            onRefresh();
            onOpenChange(false);
        } catch (e) {
            toast({
                title: "Disconnect Failed",
                description: "Failed to disconnect integration.",
                variant: "destructive"
            });
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-blue-700">M</span>
                            </div>
                            <div>
                                <DialogTitle>Manage Motive Integration</DialogTitle>
                                <DialogDescription>
                                    View sync status and manage connection.
                                </DialogDescription>
                            </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Connected
                        </Badge>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="status" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="status">Status</TabsTrigger>
                        <TabsTrigger value="assets">Asset Sync</TabsTrigger>
                    </TabsList>

                    <TabsContent value="status" className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    Status
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                    {integration.lastSyncStatus === 'Failed' ? (
                                        <span className="text-rose-600 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Error
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Healthy
                                        </span>
                                    )}
                                </div>
                                {integration.lastErrorMessage && (
                                    <p className="text-xs text-rose-600 mt-1 bg-rose-50 p-2 rounded border border-rose-100">
                                        {integration.lastErrorMessage}
                                    </p>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Last Synced
                                </div>
                                <div className="text-lg font-bold text-slate-900">
                                    {integration.lastSyncAt ? formatDistanceToNow(new Date(integration.lastSyncAt), { addSuffix: true }) : 'Never'}
                                </div>
                                {integration.vehicleCount !== undefined && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {integration.vehicleCount} vehicles synced
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4">
                            <h4 className="font-semibold text-sm mb-2">Sync Configuration</h4>
                            <p className="text-sm text-slate-600">
                                Data is synced automatically every 15 minutes. This includes vehicle locations, odometer readings, and engine hours.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleSyncNow}
                                disabled={isSyncing || isDisconnecting}
                                className="flex-1"
                            >
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Sync Now
                            </Button>
                            <Button
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting || isSyncing}
                            >
                                {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Disconnect
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="assets" className="py-4">
                        <MotiveAssetSync />
                    </TabsContent>
                </Tabs>


                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
