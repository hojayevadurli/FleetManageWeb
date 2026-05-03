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

type ImportDefaults = {
    defaultFleetCategoryId: number | null;
    defaultEquipmentTypeId: number | null;
    defaultOperationalStatus: number | null;
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
        defaultFleetCategoryId: null,
        defaultEquipmentTypeId: null,
        defaultOperationalStatus: null,
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
            value.defaultFleetCategoryId &&
            value.defaultEquipmentTypeId &&
            value.defaultOperationalStatus !== null &&
            value.defaultOperationalStatus !== undefined
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
                    defaultFleetCategoryId: existingDefaults?.defaultFleetCategoryId ?? null,
                    defaultEquipmentTypeId: existingDefaults?.defaultEquipmentTypeId ?? null,
                    defaultOperationalStatus:
                        existingDefaults?.defaultOperationalStatus ?? null,
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
                defaultFleetCategoryId: defaults.defaultFleetCategoryId!,
                defaultEquipmentTypeId: defaults.defaultEquipmentTypeId!,
                defaultOperationalStatus: defaults.defaultOperationalStatus!,
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

                    <div className="space-y-4 py-2">
                        {/* Fleet Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Fleet Category
                            </label>
                            <Select
                                value={defaults.defaultFleetCategoryId ? String(defaults.defaultFleetCategoryId) : undefined}
                                onValueChange={(value) =>
                                    setDefaults((prev) => ({
                                        ...prev,
                                        defaultFleetCategoryId: Number(value),
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select fleet category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fleetCategoryOptions.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Equipment Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Equipment Type
                            </label>
                            <Select
                                value={defaults.defaultEquipmentTypeId ? String(defaults.defaultEquipmentTypeId) : undefined}
                                onValueChange={(value) =>
                                    setDefaults((prev) => ({
                                        ...prev,
                                        defaultEquipmentTypeId: Number(value),
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select equipment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {equipmentTypeOptions.map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Operational Status
                            </label>
                            <Select
                                value={
                                    defaults.defaultOperationalStatus !== null
                                        ? String(defaults.defaultOperationalStatus)
                                        : undefined
                                }
                                onValueChange={(value) =>
                                    setDefaults((prev) => ({
                                        ...prev,
                                        defaultOperationalStatus: Number(value),
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select default status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OPERATIONAL_STATUS_OPTIONS.map((item) => (
                                        <SelectItem key={item.value} value={String(item.value)}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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