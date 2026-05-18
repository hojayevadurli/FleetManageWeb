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
    importInactiveVehicles: boolean;
    defaultEquipmentStatus: string | null;
    defaultEquipmentType: string | null;
    defaultOperatorStatus: string | null;
};

const OPERATIONAL_STATUS_OPTIONS = [
    { value: 0, label: "Active" },
    { value: 1, label: "In Shop" },
    { value: 2, label: "Out of Service" },
];

export function MotiveAssetSync() {
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
        importInactiveVehicles: false,
        defaultEquipmentStatus: "Active",
        defaultEquipmentType: null,
        defaultOperatorStatus: "Active",
    });

    const { toast } = useToast();

    // TEMP — replace later with API
    const fleetCategoryOptions = [
        { id: 1, name: "Truck" },
        { id: 2, name: "Trailer" },
        { id: 3, name: "Bus" },
        { id: 4, name: "Construction" },
    ];

    const equipmentTypeOptions = [
        { id: 1, name: "Power Unit" },
        { id: 2, name: "Dry Van" },
        { id: 3, name: "Reefer" },
        { id: 4, name: "Flatbed" },
    ];

    const hasValidDefaults = (value: ImportDefaults | null | undefined) => {
        return Boolean(
            value &&
            value.defaultEquipmentStatus &&
            value.defaultEquipmentType &&
            value.defaultOperatorStatus
        );
    };

    const getErrorMessage = (e: any) => {
        return (
            e?.response?.data?.error ||
            e?.response?.data?.message ||
            e?.message ||
            "Something went wrong"
        );
    };

    const runVehicleSync = async () => {
        try {
            const result = await integrationService.syncMotiveVehicles();
            setSyncResult(result);

            toast({
                title: "Vehicle import completed",
                description: `${result.created ?? 0} created, ${result.updated ?? 0} updated.`,
            });
        } catch (e: any) {
            toast({
                title: "Sync failed",
                description: getErrorMessage(e),
                variant: "destructive",
            });
        }
    };

    const handleFetch = async () => {
        if (loading) return; // prevent spam click

        setLoading(true);
        try {
            const existingDefaults = await integrationService.getMotiveImportDefaults();

            if (!hasValidDefaults(existingDefaults)) {
                setDefaults({
                    autoCreateAssets: existingDefaults?.autoCreateAssets ?? true,
                    autoCreateOperators: existingDefaults?.autoCreateOperators ?? true,
                    autoSyncTelemetry: existingDefaults?.autoSyncTelemetry ?? true,
                    importInactiveVehicles: existingDefaults?.importInactiveVehicles ?? false,
                    defaultEquipmentStatus: existingDefaults?.defaultEquipmentStatus ?? "Active",
                    defaultEquipmentType: existingDefaults?.defaultEquipmentType ?? null,
                    defaultOperatorStatus: existingDefaults?.defaultOperatorStatus ?? "Active",
                });

                setShowDefaultsModal(true);
                return;
            }

            await runVehicleSync();
        } catch (e: any) {
            toast({
                title: "Fetch failed",
                description: getErrorMessage(e),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDefaultsAndImport = async () => {
        if (!hasValidDefaults(defaults)) {
            toast({
                title: "Missing required fields",
                description: "Please select Fleet Category, Equipment Type, and Operational Status.",
                variant: "destructive",
            });
            return;
        }

        setSavingDefaults(true);
        try {
            await integrationService.saveMotiveImportDefaults({
                autoCreateAssets: defaults.autoCreateAssets,
                autoCreateOperators: defaults.autoCreateOperators,
                autoSyncTelemetry: defaults.autoSyncTelemetry,
                importInactiveVehicles: defaults.importInactiveVehicles,
                defaultEquipmentStatus: defaults.defaultEquipmentStatus,
                defaultEquipmentType: defaults.defaultEquipmentType,
                defaultOperatorStatus: defaults.defaultOperatorStatus,
            });

            setShowDefaultsModal(false);

            toast({
                title: "Import defaults saved",
                description: "Defaults saved successfully.",
            });

            await runVehicleSync();
        } catch (e: any) {
            toast({
                title: "Could not save defaults",
                description: getErrorMessage(e),
                variant: "destructive",
            });
        } finally {
            setSavingDefaults(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-sm font-medium text-slate-900">
                            Import Motive Vehicles
                        </div>
                        <div className="text-sm text-slate-500">
                            New vehicles will use your configured defaults.
                        </div>
                    </div>

                    <Button
                        onClick={handleFetch}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                    >
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
                            <div className="font-medium text-slate-900">
                                Vehicle Import Behavior
                            </div>

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
                            <DialogTitle>Motive Import Defaults</DialogTitle>
                        </div>

                        <DialogDescription>
                            Configure how new vehicles should be created.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* Sync Preferences (Switches) */}
                        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Sync Behaviors</h4>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Create Assets</Label>
                                    <div className="text-[13px] text-slate-500">Automatically create new vehicles from Motive</div>
                                </div>
                                <Switch
                                    checked={defaults.autoCreateAssets}
                                    onCheckedChange={(checked) => setDefaults((p) => ({ ...p, autoCreateAssets: checked }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Create Operators</Label>
                                    <div className="text-[13px] text-slate-500">Automatically create drivers from Motive</div>
                                </div>
                                <Switch
                                    checked={defaults.autoCreateOperators}
                                    onCheckedChange={(checked) => setDefaults((p) => ({ ...p, autoCreateOperators: checked }))}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Sync Telemetry</Label>
                                    <div className="text-[13px] text-slate-500">Regularly fetch locations, odometers, and engine hours</div>
                                </div>
                                <Switch
                                    checked={defaults.autoSyncTelemetry}
                                    onCheckedChange={(checked) => setDefaults((p) => ({ ...p, autoSyncTelemetry: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Import Inactive Vehicles</Label>
                                    <div className="text-[13px] text-slate-500">Pull vehicles marked as inactive in Motive</div>
                                </div>
                                <Switch
                                    checked={defaults.importInactiveVehicles}
                                    onCheckedChange={(checked) => setDefaults((p) => ({ ...p, importInactiveVehicles: checked }))}
                                />
                            </div>
                        </div>

                        {/* Default Values (Selects) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900">Default Field Mappings</h4>
                            <div className="space-y-2">
                                <Label>Equipment Type</Label>
                                <Select
                                    value={defaults.defaultEquipmentType || undefined}
                                    onValueChange={(value) =>
                                        setDefaults((prev) => ({
                                            ...prev,
                                            defaultEquipmentType: value,
                                        }))
                                    }
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
                                        onValueChange={(value) =>
                                            setDefaults((prev) => ({
                                                ...prev,
                                                defaultEquipmentStatus: value,
                                            }))
                                        }
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
                                        onValueChange={(value) =>
                                            setDefaults((prev) => ({
                                                ...prev,
                                                defaultOperatorStatus: value,
                                            }))
                                        }
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
                        <Button
                            variant="outline"
                            onClick={() => setShowDefaultsModal(false)}
                            disabled={savingDefaults}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSaveDefaultsAndImport}
                            disabled={savingDefaults}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {savingDefaults && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save & Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}