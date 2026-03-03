import { useState } from "react";
import { Driver } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface AddDotInspectionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver?: Driver;
}

export function AddDotInspectionSheet({ open, onOpenChange, driver }: AddDotInspectionSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock company name - in a real app this would come from a context or API
    const defaultCompanyName = "Everin LLC";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call to save DOT inspection
        setTimeout(() => {
            setIsSubmitting(false);
            onOpenChange(false);
        }, 1000);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-4xl p-0 overflow-y-auto bg-slate-50 border-l border-slate-200">
                <SheetHeader className="p-6 bg-slate-900 border-b border-slate-800">
                    <SheetTitle className="text-white text-xl flex items-center gap-2">
                        Add New DOT Inspection
                    </SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 flex flex-col min-h-[calc(100vh-80px)]">
                    {/* Top Company Field */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Company *</Label>
                        <Select defaultValue={defaultCompanyName}>
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Select Company" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={defaultCompanyName}>{defaultCompanyName}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                        {/* LEFT COLUMN: Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                                Details
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Inspection/Report # *</Label>
                                    <Input required className="bg-white border-slate-200" placeholder="e.g. NET303000857" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Inspection Date *</Label>
                                        <Input type="date" required className="bg-white border-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Time</Label>
                                        <div className="flex gap-2">
                                            <Input type="time" className="bg-white border-slate-200 flex-1" />
                                            <Select defaultValue="EST">
                                                <SelectTrigger className="w-24 bg-white border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="EST">EST</SelectItem>
                                                    <SelectItem value="CST">CST</SelectItem>
                                                    <SelectItem value="MST">MST</SelectItem>
                                                    <SelectItem value="PST">PST</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Location *</Label>
                                    <Input required className="bg-white border-slate-200 mb-2" placeholder="e.g. RATON PORT OF ENTRY" />

                                    <RadioGroup defaultValue="us" className="flex items-center gap-6 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="us" id="loc-us" />
                                            <Label htmlFor="loc-us" className="text-sm font-medium">United States</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="canada" id="loc-ca" />
                                            <Label htmlFor="loc-ca" className="text-sm font-medium">Canada</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="mexico" id="loc-mx" />
                                            <Label htmlFor="loc-mx" className="text-sm font-medium">Mexico</Label>
                                        </div>
                                    </RadioGroup>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input className="bg-white border-slate-200" placeholder="City *" required />
                                        <Select required>
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue placeholder="State *" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TX">Texas</SelectItem>
                                                <SelectItem value="CA">California</SelectItem>
                                                <SelectItem value="FL">Florida</SelectItem>
                                                <SelectItem value="NM">New Mexico</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700">Inspection Level *</Label>
                                    <Select required>
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

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 block">Violation(s) Discovered</Label>
                                    <RadioGroup defaultValue="no" className="flex items-center gap-6">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="violation-yes" />
                                            <Label htmlFor="violation-yes" className="text-sm font-medium">Violation(s) Discovered</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="violation-no" />
                                            <Label htmlFor="violation-no" className="text-sm font-bold text-slate-900">No Violation(s)</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Upload Document Field */}
                                <div className="space-y-2 pt-4 border-t border-slate-200 mt-6">
                                    <Label className="text-xs font-bold text-slate-700">Upload Inspection Document</Label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="space-y-1 text-center">
                                            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-slate-600 justify-center">
                                                <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                    Upload a file
                                                </span>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* RIGHT COLUMN: Inspected Parties */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                                Inspected Parties
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">Truck *</Label>
                                    <Select required>
                                        <SelectTrigger className="bg-white border-slate-200">
                                            <SelectValue placeholder="Select Truck" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2313">2313</SelectItem>
                                            <SelectItem value="2314">2314</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">Trailer</Label>
                                    <Input className="bg-white border-slate-200" placeholder="Enter Trailer" />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">Driver/Contractor *</Label>
                                        <Select defaultValue={driver ? `${driver.firstName} ${driver.lastName}` : undefined} required>
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue placeholder="Select Driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {driver ? (
                                                    <SelectItem value={`${driver.firstName} ${driver.lastName}`}>
                                                        {driver.firstName} {driver.lastName}
                                                    </SelectItem>
                                                ) : (
                                                    <SelectItem value="Mohammad Mutawakel">Mohammad Mutawakel</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Apply Reward or Penalty to driver</Label>
                                        <RadioGroup defaultValue="none" className="flex items-center gap-6">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="none" id="driver-none" />
                                                <Label htmlFor="driver-none" className="text-sm font-medium text-slate-700">None</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="reward" id="driver-reward" />
                                                <Label htmlFor="driver-reward" className="text-sm font-medium text-slate-700">Reward</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="penalty" id="driver-penalty" />
                                                <Label htmlFor="driver-penalty" className="text-sm font-medium text-slate-700">Penalty</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">Co Driver</Label>
                                        <Select>
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue placeholder="Select Driver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Suleyman Durdiyev">Suleyman Durdiyev</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Apply Reward or Penalty to driver</Label>
                                        <RadioGroup defaultValue="none" className="flex items-center gap-6 opacity-50">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="none" id="codriver-none" disabled />
                                                <Label htmlFor="codriver-none" className="text-sm font-medium text-slate-700">None</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="reward" id="codriver-reward" disabled />
                                                <Label htmlFor="codriver-reward" className="text-sm font-medium text-slate-700">Reward</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="penalty" id="codriver-penalty" disabled />
                                                <Label htmlFor="codriver-penalty" className="text-sm font-medium text-slate-700">Penalty</Label>
                                            </div>
                                        </RadioGroup>
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
                            {isSubmitting ? "Adding..." : "Add"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
