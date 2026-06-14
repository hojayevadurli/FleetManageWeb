import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Truck, Settings2 } from "lucide-react";
import { integrationService } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type ImportDefaults = {
    autoCreateAssets: boolean;
    autoCreateOperators: boolean;
    autoSyncTelemetry: boolean;
    importInactiveDrivers: boolean;
    defaultEquipmentStatus: string | null;
    defaultEquipmentType: string | null;
    defaultOperatorStatus: string | null;
};

const equipmentTypeOptions = [
    { id: 1, name: "Power Unit" },
    { id: 2, name: "Dry Van" },
    { id: 3, name: "Reefer" },
    { id: 4, name: "Flatbed" },
];

export function SamsaraAssetSync() {
    const [loading, setLoading] = useState(false);
    const [savingDefaults, setSavingDefaults] = useState(false);
    const [showDefaultsModal, setShowDefaultsModal] = useState(false);

    const [syncResult, setSyncResult] = useState<{
        created?: number;
        updated?: number;
    } | null>(null);

    const [defaults, setDefaults] = useState<ImportDefaults>({
        autoCreateAssets: true,
        autoCreateOperators: true,
        autoSyncTelemetry: true,
        importInactiveDrivers: false,
        defaultEquipmentStatus: "Active",
        defaultEquipmentType: null,
        defaultOperatorStatus: "Active",
    });

    const { toast } = useToast();

    const hasValidDefaults = (value: ImportDefaults | null | undefined) =>
        Boolean(value && value.defaultEquipmentStatus && value.defaultEquipmentType && value.defaultOperatorStatus);

    const getErrorMessage = (e: any) =>
        e?.response?.data?.error || e?.response?.data?.message || e?.message || "Something went wrong";

    const runVehicleSync = async () => {
        try {
            const result = await integrationService.syncSamsaraVehicles();
            setSyncResult(result);
            toast({
                title: "Vehicle import completed",
                description: `${result.created ?? 0} created, ${result.updated ?? 0} updated.`,
            });
        } catch (e: any) {
            toast({ title: "Sync failed", description: getErrorMessage(e), variant: "destructive" });
        }
    };

    const handleFetch = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const existingDefaults = await integrationService.getSamsaraImportDefaults();

            if (!hasValidDefaults(existingDefaults)) {
                setDefaults({
                    autoCreateAssets: existingDefaults?.autoCreateAssets ?? true,
                    autoCreateOperators: existingDefaults?.autoCreateOperators ?? true,
                    autoSyncTelemetry: existingDefaults?.autoSyncTelemetry ?? true,
                    importInactiveDrivers: existingDefaults?.importInactiveDrivers ?? false,
                    defaultEquipmentStatus: existingDefaults?.defaultEquipmentStatus ?? "Active",
                    defaultEquipmentType: existingDefaults?.defaultEquipmentType ?? null,
                    defaultOperatorStatus: existingDefaults?.defaultOperatorStatus ?? "Active",
                });
                setShowDefaultsModal(true);
                return;
            }

            await runVehicleSync();
        } catch (e: any) {
            toast({ title: "Fetch failed", description: getErrorMessage(e), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDefaultsAndImport = async () => {
        if (!hasValidDefaults(defaults)) {
            toast({
                title: "Missing required fields",
                description: "Please select Equipment Type, Equipment Status, and Operator Status.",
                variant: "destructive",
            });
            return;
        }

        setSavingDefaults(true);
        try {
            await integrationService.saveSamsaraImportDefaults(defaults);
            setShowDefaultsModal(false);
            toast({ title: "Import defaults saved", description: "Defaults saved successfully." });
            await runVehicleSync();
        } catch (e: any) {
            toast({ title: "Could not save defaults", description: getErrorMessage(e), variant: "destructive" });
        } finally {
            setSavingDefaults(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-900">Import Samsara Vehicles</div>
                        <div className="text-sm text-slate-500">New vehicles will use your configured defaults.</div>
                    </div>
                    <Button onClick={handleFetch} disabled={loading} variant="outline" size="sm">
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Fetch Vehicles
                    </Button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white">
                            <Truck className="h-5 w-5 text-slate-700" />
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-slate-900">Vehicle Import Behavior</div>
                            <div className="mt-1 text-sm text-slate-600">
                                Existing assets are updated. New vehicles are created using your defaults.
                            </div>
                            {syncResult && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                        Created: {syncResult.created ?? 0}
                                    </Badge>
                                    <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                                        Updated: {syncResult.updated ?? 0}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={showDefaultsModal} onOpenChange={setShowDefaultsModal}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-slate-700" />
                            <DialogTitle>Samsara Import Defaults</DialogTitle>
                        </div>
                        <DialogDescription>Configure how new vehicles should be created.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Sync Behaviors</h4>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Create Assets</Label>
                                    <div className="text-[13px] text-slate-500">Automatically create new vehicles from Samsara</div>
                                </div>
                                <Switch
                                    checked={defaults.autoCreateAssets}
                                    onCheckedChange={(v) => setDefaults((p) => ({ ...p, autoCreateAssets: v }))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Create Operators</Label>
                                    <div className="text-[13px] text-slate-500">Automatically create drivers from Samsara</div>
                                </div>
                                <Switch
                                    checked={defaults.autoCreateOperators}
                                    onCheckedChange={(v) => setDefaults((p) => ({ ...p, autoCreateOperators: v }))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Sync Telemetry</Label>
                                    <div className="text-[13px] text-slate-500">Regularly fetch locations, odometer, and fuel</div>
                                </div>
                                <Switch
                                    checked={defaults.autoSyncTelemetry}
                                    onCheckedChange={(v) => setDefaults((p) => ({ ...p, autoSyncTelemetry: v }))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Import Inactive Drivers</Label>
                                    <div className="text-[13px] text-slate-500">Pull deactivated drivers from Samsara</div>
                                </div>
                                <Switch
                                    checked={defaults.importInactiveDrivers}
                                    onCheckedChange={(v) => setDefaults((p) => ({ ...p, importInactiveDrivers: v }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900">Default Field Mappings</h4>
                            <div className="space-y-2">
                                <Label>Equipment Type</Label>
                                <Select
                                    value={defaults.defaultEquipmentType || undefined}
                                    onValueChange={(v) => setDefaults((p) => ({ ...p, defaultEquipmentType: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select equipment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {equipmentTypeOptions.map((item) => (
                                            <SelectItem key={item.id} value={item.name}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Equipment Status</Label>
                                    <Select
                                        value={defaults.defaultEquipmentStatus || undefined}
                                        onValueChange={(v) => setDefaults((p) => ({ ...p, defaultEquipmentStatus: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="In Shop">In Shop</SelectItem>
                                            <SelectItem value="Out of Service">Out of Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Operator Status</Label>
                                    <Select
                                        value={defaults.defaultOperatorStatus || undefined}
                                        onValueChange={(v) => setDefaults((p) => ({ ...p, defaultOperatorStatus: v }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDefaultsModal(false)} disabled={savingDefaults}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDefaultsAndImport}
                            disabled={savingDefaults}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {savingDefaults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
