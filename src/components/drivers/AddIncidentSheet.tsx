import { useState, useEffect } from "react";
import { Driver, IncidentType, IncidentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { incidentsApi } from "@/lib/incidentsApi";
import { tenantsApi } from "@/lib/tenantsApi";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddIncidentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver?: Driver;
    onSuccess?: () => void;
}

export function AddIncidentSheet({ open, onOpenChange, driver, onSuccess }: AddIncidentSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [type, setType] = useState<IncidentType>(IncidentType.DotInspection);
    const [date, setDate] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [fineAmount, setFineAmount] = useState<string>("");
    const [points, setPoints] = useState<string>("");
    const [reportNumber, setReportNumber] = useState("");
    const [inspectionLevel, setInspectionLevel] = useState("");
    const [isOutOfService, setIsOutOfService] = useState(false);
    const [violations, setViolations] = useState("No Violations");
    const [isAtFault, setIsAtFault] = useState(false);
    const [inspectedParty, setInspectedParty] = useState(driver ? `${driver.firstName} ${driver.lastName}` : "");

    const [companyName, setCompanyName] = useState<string>("");

    useEffect(() => {
        const fetchTenantData = async () => {
            try {
                const tenant = await tenantsApi.getCurrent();
                if (tenant?.name) {
                    setCompanyName(tenant.name);
                }
            } catch (e) {
                console.error("Failed to fetch tenant data", e);
            }
        };
        if (open) {
            fetchTenantData();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!driver) {
            toast.error("Driver context is missing");
            return;
        }

        if (!date || !location) {
            toast.error("Please fill in required fields.");
            return;
        }

        try {
            setIsSubmitting(true);

            await incidentsApi.create({
                operatorId: driver.id,
                equipmentId: null, // Hardcoded for now as per requirement or could be added
                type: type,
                date: new Date(date).toISOString(),
                location: location,
                description: description || undefined,
                fineAmount: fineAmount ? parseFloat(fineAmount) : undefined,
                points: points ? parseInt(points, 10) : undefined,
                reportNumber: reportNumber || undefined,
                inspectionLevel: type === IncidentType.DotInspection ? inspectionLevel : undefined,
                isOutOfService: isOutOfService,
                violations: violations,
                inspectedParty: inspectedParty || undefined,
                status: IncidentStatus.Open,
                isAtFault: isAtFault,
                documentIds: [] // Can be wired up later
            });

            toast.success("Incident record added successfully!");
            onSuccess?.();
            onOpenChange(false);

            // Reset form
            setType(IncidentType.DotInspection);
            setDate("");
            setLocation("");
            setDescription("");
            setFineAmount("");
            setPoints("");
            setReportNumber("");
            setInspectionLevel("");
            setIsOutOfService(false);
            setViolations("No Violations");
            setIsAtFault(false);

        } catch (err) {
            console.error(err);
            toast.error("Failed to add incident record.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-4xl p-0 overflow-y-auto bg-slate-50 border-l border-slate-200">
                <SheetHeader className="p-6 bg-slate-900 border-b border-slate-800">
                    <SheetTitle className="text-white text-xl flex items-center gap-2">
                        Add Record
                    </SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 flex flex-col min-h-[calc(100vh-80px)]">
                    {/* Top Company & Type Fields */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Company *</Label>
                            <Select value={companyName} onValueChange={setCompanyName}>
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select Company" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companyName && (
                                        <SelectItem value={companyName}>{companyName}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Record Type *</Label>
                            <Select value={type} onValueChange={(val) => setType(val as IncidentType)}>
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={IncidentType.Accident}>Accident</SelectItem>
                                    <SelectItem value={IncidentType.Violation}>Violation/Ticket</SelectItem>
                                    <SelectItem value={IncidentType.Warning}>Warning</SelectItem>
                                    <SelectItem value={IncidentType.Complaint}>Complaint</SelectItem>
                                    <SelectItem value={IncidentType.DotInspection}>DOT Inspection</SelectItem>
                                    <SelectItem value={IncidentType.Other}>Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                        {/* LEFT COLUMN: Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                                Details
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Report/Ticket #</Label>
                                    <Input
                                        value={reportNumber}
                                        onChange={(e) => setReportNumber(e.target.value)}
                                        className="bg-white border-slate-200"
                                        placeholder="e.g. NET303000857"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Date *</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-white border-slate-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Location *</Label>
                                    <Input
                                        required
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="bg-white border-slate-200 mb-2"
                                        placeholder="e.g. RATON PORT OF ENTRY or City, State"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Description</Label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-white border-slate-200"
                                        placeholder="Brief description of the event..."
                                    />
                                </div>

                                {type === IncidentType.DotInspection && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Inspection Level</Label>
                                        <Select value={inspectionLevel} onValueChange={setInspectionLevel}>
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue placeholder="Select Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Level 1 - North American Standard</SelectItem>
                                                <SelectItem value="2">Level 2 - Walk-Around</SelectItem>
                                                <SelectItem value="3">Level 3 - Driver/Credential</SelectItem>
                                                <SelectItem value="4">Level 4 - Special Study</SelectItem>
                                                <SelectItem value="5">Level 5 - Vehicle Only</SelectItem>
                                                <SelectItem value="6">Level 6 - Radioactive</SelectItem>
                                                <SelectItem value="general">General</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 block">Violation(s) Discovered</Label>
                                    <Input
                                        value={violations}
                                        onChange={(e) => setViolations(e.target.value)}
                                        className="bg-white border-slate-200"
                                        placeholder="e.g. Speeding, Logbook violation..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Consequences & Parties */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                                Consequences & Parties
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Fine Amount ($)</Label>
                                        <Input
                                            type="number"
                                            min="0" step="0.01"
                                            value={fineAmount}
                                            onChange={(e) => setFineAmount(e.target.value)}
                                            className="bg-white border-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">License Points</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={points}
                                            onChange={(e) => setPoints(e.target.value)}
                                            className="bg-white border-slate-200"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="atFault"
                                            checked={isAtFault}
                                            onCheckedChange={(c) => setIsAtFault(!!c)}
                                        />
                                        <Label htmlFor="atFault" className="text-sm font-medium">Driver at Fault</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="oos"
                                            checked={isOutOfService}
                                            onCheckedChange={(c) => setIsOutOfService(!!c)}
                                        />
                                        <Label htmlFor="oos" className="text-sm font-medium">Placed Out of Service</Label>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">Inspected Party (Driver) *</Label>
                                        <Select
                                            value={inspectedParty}
                                            onValueChange={setInspectedParty}
                                        >
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue placeholder="Select Driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {driver ? (
                                                    <SelectItem value={`${driver.firstName} ${driver.lastName}`}>
                                                        {driver.firstName} {driver.lastName}
                                                    </SelectItem>
                                                ) : (
                                                    <SelectItem value="N/A">N/A</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-200 pt-6 mt-auto flex justify-end gap-3 sticky bottom-0 bg-slate-50 mt-4 px-1 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-32 bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-32 bg-[#34A853] hover:bg-[#2d9648] text-white"
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
