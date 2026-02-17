import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateOperatorContractDto, OperatorContract, EmploymentType } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContractModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driverId: string;
    existingContract?: OperatorContract | null;
    onSuccess: () => void;
}

export function ContractModal({ open, onOpenChange, driverId, existingContract, onSuccess }: ContractModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);
    const [employmentTypeId, setEmploymentTypeId] = useState<string>(""); // Store as string for Select, convert to number for DTO
    const [paymentType, setPaymentType] = useState("PerMile");
    const [paymentRate, setPaymentRate] = useState<number>(0);
    const [payFrequency, setPayFrequency] = useState("Weekly");
    const [grossShare, setGrossShare] = useState<number>(0);
    const [driverType, setDriverType] = useState("Solo");

    const [showTripRates, setShowTripRates] = useState(false);
    const [showLoadedMileage, setShowLoadedMileage] = useState(false);
    const [showEmptyMileage, setShowEmptyMileage] = useState(false);

    const [coDriverId, setCoDriverId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");

    // Initialize form when opening/changing contract
    useEffect(() => {
        if (open) {
            if (existingContract) {
                setEmploymentTypeId(existingContract.employmentTypeId.toString());
                setPaymentType(existingContract.paymentType || "PerMile");
                setPaymentRate(existingContract.paymentRate || 0);
                setPayFrequency(existingContract.payFrequency || "Weekly");
                setGrossShare(existingContract.grossShare || 0);
                setDriverType(existingContract.driverType || "Solo");

                setShowTripRates(existingContract.showTripRates || false);
                setShowLoadedMileage(existingContract.showLoadedMileage || false);
                setShowEmptyMileage(existingContract.showEmptyMileage || false);

                setCoDriverId(existingContract.coDriverId || "");
                setStartDate(existingContract.startDate ? new Date(existingContract.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setEndDate(existingContract.endDate ? new Date(existingContract.endDate).toISOString().split('T')[0] : "");
                setNotes(existingContract.notes || "");
            } else {
                // Reset defaults for new contract
                setEmploymentTypeId(""); // Will need validation if empty
                setPaymentType("PerMile");
                setPaymentRate(0);
                setPayFrequency("Weekly");
                setGrossShare(0);
                setDriverType("Solo");
                setShowTripRates(false);
                setShowLoadedMileage(false);
                setShowEmptyMileage(false);
                setCoDriverId("");
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate("");
                setNotes("");
            }
        }
    }, [open, existingContract]);

    // Fetch Employment Types on mount
    useEffect(() => {
        operatorsApi.getEmploymentTypes()
            .then(setEmploymentTypes)
            .catch(err => console.error("Failed to load employment types", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: CreateOperatorContractDto = {
                employmentTypeId: parseInt(employmentTypeId),
                paymentType,
                paymentRate: Number(paymentRate),
                payFrequency,
                grossShare: Number(grossShare),
                driverType,
                showTripRates,
                showLoadedMileage,
                showEmptyMileage,
                coDriverId: coDriverId || undefined,
                startDate: new Date(startDate).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                notes
            };

            if (existingContract) {
                await operatorsApi.updateContract(driverId, existingContract.id, payload);
                toast.success("Employment details updated");
            } else {
                await operatorsApi.createContract(driverId, payload);
                toast.success("New contract created");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save contract", error);
            toast.error("Failed to save employment details");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{existingContract ? "Edit Employment Details" : "Add Employment Contract"}</DialogTitle>
                    <DialogDescription>
                        Define the employment terms, payment model, and rates.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">

                    {/* Section 1: Role & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Employment Type</Label>
                            <Select value={employmentTypeId} onValueChange={setEmploymentTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employmentTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Driver Type</Label>
                            <Select value={driverType} onValueChange={setDriverType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Solo">Solo</SelectItem>
                                    <SelectItem value="Team">Team</SelectItem>
                                    <SelectItem value="Trainer">Trainer</SelectItem>
                                    <SelectItem value="Trainee">Trainee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Section 2: Payment Model */}
                    <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Compensation Model</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pay Model</Label>
                                <Select value={paymentType} onValueChange={setPaymentType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PerMile">Per Mile (CPM)</SelectItem>
                                        <SelectItem value="Percentage">Percentage of Gross</SelectItem>
                                        <SelectItem value="Hourly">Hourly Rate</SelectItem>
                                        <SelectItem value="FlatRate">Flat Rate (Weekly/Daily)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Pay Frequency</Label>
                                <Select value={payFrequency} onValueChange={setPayFrequency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Per Trip">Per Trip</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    {paymentType === 'PerMile' ? 'Rate per Mile ($)' :
                                        paymentType === 'Percentage' ? 'Percentage (%)' :
                                            paymentType === 'Hourly' ? 'Hourly Rate ($)' : 'Rate ($)'}
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={paymentRate}
                                    onChange={(e) => setPaymentRate(parseFloat(e.target.value))}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Only show Gross Share if relevant, e.g. for Owner Operators */}
                            <div className="space-y-2">
                                <Label>Gross Share (%) <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={grossShare}
                                    onChange={(e) => setGrossShare(parseFloat(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Visibility Options */}
                    <div className="space-y-3 border-t pt-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payroll Visibility</h4>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="trip-rates" className="cursor-pointer">Show Trip Rates on Settlement</Label>
                            <Switch id="trip-rates" checked={showTripRates} onCheckedChange={setShowTripRates} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="loaded-mileage" className="cursor-pointer">Show Loaded Mileage</Label>
                            <Switch id="loaded-mileage" checked={showLoadedMileage} onCheckedChange={setShowLoadedMileage} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="empty-mileage" className="cursor-pointer">Show Empty Mileage</Label>
                            <Switch id="empty-mileage" checked={showEmptyMileage} onCheckedChange={setShowEmptyMileage} />
                        </div>
                    </div>

                    {/* Section 4: Additional Info */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Co-Driver ID <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                            <Input value={coDriverId} onChange={(e) => setCoDriverId(e.target.value)} placeholder="Enter ID if assigned to team" />
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional terms or notes" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {existingContract ? "Update Details" : "Save Contract"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
