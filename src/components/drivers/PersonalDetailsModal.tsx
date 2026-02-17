import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { OperatorDto, UpdateOperatorDto, OperatorStatus, DocumentRole, DriverHiringStage } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi } from "@/lib/documentsApi";
import { parseDriverLicense } from "@/lib/gemini";
import { US_STATES } from "@/lib/constants";
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { LicenseUploadCard } from "@/components/drivers/LicenseUploadCard";
import { Sparkles, Loader2, Camera, Upload, Trash2, User, MapPin, CreditCard, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PersonalDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driver: OperatorDto;
    onSuccess: () => void;
}

export function PersonalDetailsModal({ open, onOpenChange, driver, onSuccess }: PersonalDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [isParsingLicense, setIsParsingLicense] = useState(false);

    // License files state
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    // AI filled fields tracker
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        driverNumber: "", // EmployeeId

        licenseNumber: "",
        licenseState: "",
        dlIssueDate: "",
        dlExpireDate: "",
        dob: "",
        medicalExpiration: "",

        addressStreet: "",
        addressUnit: "",
        addressCity: "",
        addressState: "",
        addressZip: "",

        homeTerminal: "",
        employmentType: "Employee",
        status: OperatorStatus.Active as OperatorStatus,
        hiringStage: DriverHiringStage.Lead as string,
        isBlacklisted: false,
        blacklistReason: "",
        hireDate: "",
        terminationDate: "",
        expectedStartDate: "",

        photoUrl: "",
        notes: "",
    });

    // Initialize form data
    useEffect(() => {
        if (open && driver) {
            // Parse Metadata from Notes
            let metadata: any = {};
            let userNotes = driver.notes || "";
            try {
                if (driver.notes?.startsWith("{")) {
                    const parsed = JSON.parse(driver.notes);
                    if (parsed.metadata) {
                        metadata = parsed.metadata;
                        userNotes = parsed.userNotes || "";
                    }
                }
            } catch (e) {
                console.warn("Could not parse operator metadata from notes", e);
            }

            let addressStreet = metadata.addressStreet || metadata.address || "";

            setFormData({
                firstName: driver.firstName || "",
                lastName: driver.lastName || "",
                email: driver.email || "",
                phone: driver.phone || "",
                driverNumber: driver.employeeId || "",

                status: (() => {
                    const s = driver.status;
                    if (!s) return OperatorStatus.Active;
                    if (typeof s === 'number') return s;
                    const num = Number(s);
                    if (!isNaN(num)) return num;

                    const str = String(s).toLowerCase();
                    if (str === 'active') return OperatorStatus.Active;
                    if (str === 'inactive' || str === 'suspended') return OperatorStatus.Inactive;
                    if (str === 'onleave' || str === 'on leave') return OperatorStatus.OnLeave;
                    if (str === 'terminated') return OperatorStatus.Terminated;
                    return OperatorStatus.Active;
                })(),
                hireDate: driver.hireDate ? String(driver.hireDate).split('T')[0] : "",
                terminationDate: driver.terminationDate ? String(driver.terminationDate).split('T')[0] : "",

                // License
                licenseNumber: driver.licenseNumber || "",
                licenseState: driver.licenseState || "",
                dlExpireDate: driver.licenseExpirationDate ? String(driver.licenseExpirationDate).split('T')[0] : "",
                dob: driver.dateOfBirth ? String(driver.dateOfBirth).split('T')[0] : "",

                // Metadata Fields
                homeTerminal: metadata.homeTerminal || "",
                employmentType: metadata.employmentType || (driver.status === 'Active' ? "Employee" : "Candidate"),
                hiringStage: metadata.hiringStage || DriverHiringStage.Lead,
                isBlacklisted: metadata.isBlacklisted || false,
                blacklistReason: metadata.blacklistReason || "",
                expectedStartDate: metadata.expectedStartDate || "",
                medicalExpiration: metadata.medicalCardExpiration || "",

                // Address
                addressStreet: addressStreet,
                addressUnit: metadata.addressUnit || "",
                addressCity: metadata.addressCity || "",
                addressState: metadata.addressState || "",
                addressZip: metadata.addressZip || "",

                photoUrl: driver.photoUrl || "",
                notes: userNotes,
            });

            // Reset files and AI fields on reopen
            setLicenseFront(null);
            setLicenseBack(null);
            setAiFilledFields(new Set());
        }
    }, [open, driver]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (aiFilledFields.has(name)) {
            setAiFilledFields(prev => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (aiFilledFields.has(name)) {
            setAiFilledFields(prev => {
                const next = new Set(prev);
                next.delete(name);
                return next;
            });
        }
    };

    const handleLicenseFilesChange = (front: File | null, back: File | null) => {
        setLicenseFront(front);
        setLicenseBack(back);
    };

    const handleParseLicense = async () => {
        if (!licenseFront) return;
        setIsParsingLicense(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(licenseFront);
            reader.onload = async () => {
                try {
                    const base64 = (reader.result as string).split(',')[1];
                    const result = await parseDriverLicense(base64, licenseFront.type);
                    if (result) {
                        const newFields = new Set(aiFilledFields);
                        setFormData(prev => {
                            const updates: any = {};
                            const updateIfFound = (key: keyof typeof formData, val: string | undefined) => {
                                if (val) {
                                    updates[key] = val;
                                    newFields.add(key);
                                }
                            };
                            updateIfFound('firstName', result.firstName);
                            updateIfFound('lastName', result.lastName);
                            updateIfFound('dob', result.dob);
                            updateIfFound('licenseNumber', result.dlNumber);
                            updateIfFound('licenseState', result.licenseState);
                            updateIfFound('dlIssueDate', result.dlIssueDate);
                            updateIfFound('dlExpireDate', result.dlExpireDate);
                            if (result.addressComponents) {
                                updateIfFound('addressStreet', result.addressComponents.street);
                                updateIfFound('addressCity', result.addressComponents.city);
                                updateIfFound('addressState', result.addressComponents.state);
                                updateIfFound('addressZip', result.addressComponents.zip);
                            } else if (result.address) {
                                updateIfFound('addressStreet', result.address);
                            }
                            return { ...prev, ...updates };
                        });
                        setAiFilledFields(newFields);
                        toast.success("Driver License Parsed", { description: "Review the auto-filled fields below." });
                    } else {
                        toast.error("Analysis Failed", { description: "Couldn't parse license." });
                    }
                } catch (e) {
                    toast.error("Error", { description: "Failed to parse license" });
                } finally {
                    setIsParsingLicense(false);
                }
            };
        } catch (error) { setIsParsingLicense(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadsApi.uploadDocument(file);
            setFormData(prev => ({ ...prev, photoUrl: url }));
            toast.success("Profile photo updated");
        } catch (error) {
            toast.error("Upload Failed", { description: "Could not upload photo." });
        }
    };

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, photoUrl: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct Metadata
            const metadata = {
                homeTerminal: formData.homeTerminal,
                addressStreet: formData.addressStreet,
                addressUnit: formData.addressUnit,
                addressCity: formData.addressCity,
                addressState: formData.addressState,
                addressZip: formData.addressZip,
                address: `${formData.addressStreet}${formData.addressUnit ? ` ${formData.addressUnit}` : ''}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`,
                employmentType: formData.employmentType,
                hiringStage: formData.hiringStage,
                isBlacklisted: formData.isBlacklisted,
                blacklistReason: formData.blacklistReason,
                expectedStartDate: formData.expectedStartDate,
                medicalCardExpiration: formData.medicalExpiration,
                dlIssueDate: formData.dlIssueDate, // Include Issue Date in metadata
            };

            const notesPayload = JSON.stringify({
                metadata: metadata,
                userNotes: formData.notes
            });

            // Process License Files
            const documentIds: string[] = [];

            const processLicenseFile = async (file: File, title: string) => {
                try {
                    const fileUrl = await uploadsApi.uploadDocument(file);
                    const doc = await documentsApi.create({
                        fileUrl: fileUrl,
                        fileType: file.type,
                        docKind: 'license',
                        title: title,
                        driverId: undefined
                    });
                    if (doc && doc.id) {
                        documentIds.push(doc.id);
                    }
                } catch (err) {
                    console.error("Failed to upload license file:", title, err);
                }
            };

            if (licenseFront) await processLicenseFile(licenseFront, "Driver License (Front)");
            if (licenseBack) await processLicenseFile(licenseBack, "Driver License (Back)");

            const updatePayload: UpdateOperatorDto = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                employeeId: formData.driverNumber,
                status: formData.status,
                licenseNumber: formData.licenseNumber,
                licenseState: formData.licenseState,
                licenseExpirationDate: formData.dlExpireDate || undefined,
                dateOfBirth: formData.dob || undefined,
                hireDate: formData.hireDate || undefined,
                terminationDate: formData.terminationDate || undefined,
                photoUrl: formData.photoUrl,
                notes: notesPayload,
                documentIds: documentIds.length > 0 ? documentIds : undefined,
            };

            await operatorsApi.update(driver.id, updatePayload); // Assuming update returns promise

            toast.success("Personal details updated");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save personal details");
        } finally {
            setLoading(false);
        }
    };

    // Helper for AI Indicator
    const LabelWithAi = ({ htmlFor, label, fieldName }: { htmlFor?: string, label: string, fieldName: string }) => (
        <Label htmlFor={htmlFor} className="flex justify-between items-center group text-xs text-gray-500 font-medium uppercase tracking-wide">
            {label}
            {aiFilledFields.has(fieldName) && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 normal-case">
                    <Sparkles className="h-2 w-2" />
                    AI-filled
                </span>
            )}
        </Label>
    );

    const inputAiClass = (fieldName: string) => cn(
        aiFilledFields.has(fieldName) && "bg-yellow-50/50 border-yellow-200 transition-colors duration-500 focus:bg-white focus:border-blue-400"
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] p-0 flex flex-col">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Edit Personal Details</DialogTitle>
                    <DialogDescription>
                        Update the driver's basic information, address, and license details.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="py-6 space-y-8">

                        {/* AI License Parser - Collapsible or Top Section */}
                        <div className="space-y-4">
                            <LicenseUploadCard
                                onFilesChange={handleLicenseFilesChange}
                                onParse={handleParseLicense}
                                isParsing={isParsingLicense}
                                aiFilledCount={aiFilledFields.size}
                            />
                        </div>

                        {/* Basic Info Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Profile Photo */}
                                <div className="md:col-span-3 flex flex-col items-center gap-3">
                                    <div className="relative h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group hover:border-blue-400 transition-colors">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-gray-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                            <Camera className="h-6 w-6" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handlePhotoUpload}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {formData.photoUrl && (
                                            <Button type="button" variant="ghost" size="xs" onClick={handleRemovePhoto} className="text-red-600 h-6 text-xs">
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Names and Contact */}
                                <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <LabelWithAi htmlFor="firstName" label="First Name" fieldName="firstName" />
                                        <Input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputAiClass("firstName")} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <LabelWithAi htmlFor="lastName" label="Last Name" fieldName="lastName" />
                                        <Input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputAiClass("lastName")} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</Label>
                                        <Input name="phone" value={formData.phone} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</Label>
                                        <Input name="email" value={formData.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <LabelWithAi htmlFor="dob" label="Date of Birth" fieldName="dob" />
                                        <Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={inputAiClass("dob")} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="driverNumber" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Employee ID</Label>
                                        <Input name="driverNumber" value={formData.driverNumber} onChange={handleInputChange} placeholder="Auto-generated" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="hireDate" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Hire Date</Label>
                                        <Input type="date" name="hireDate" value={formData.hireDate} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="terminationDate" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Termination Date</Label>
                                        <Input type="date" name="terminationDate" value={formData.terminationDate} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</Label>
                                        <Select
                                            value={String(formData.status)}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, status: Number(val) }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={String(OperatorStatus.Active)}>Active</SelectItem>
                                                <SelectItem value={String(OperatorStatus.Inactive)}>Inactive</SelectItem>
                                                <SelectItem value={String(OperatorStatus.OnLeave)}>On Leave</SelectItem>
                                                <SelectItem value={String(OperatorStatus.Terminated)}>Terminated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Address Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                Residential Address
                            </h3>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-8 space-y-1.5">
                                    <LabelWithAi htmlFor="addressStreet" label="Street Address" fieldName="addressStreet" />
                                    <AddressAutocomplete
                                        id="addressStreet"
                                        value={formData.addressStreet}
                                        onChange={(val) => setFormData(prev => ({ ...prev, addressStreet: val }))}
                                        onSelect={(parsed) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                addressStreet: parsed.street,
                                                addressCity: parsed.city,
                                                addressState: parsed.state,
                                                addressZip: parsed.zip
                                            }));
                                        }}
                                        className={inputAiClass("addressStreet")}
                                        placeholder="123 Main St"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-4 space-y-1.5">
                                    <Label htmlFor="addressUnit" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Apt / Unit</Label>
                                    <Input name="addressUnit" value={formData.addressUnit} onChange={handleInputChange} placeholder="Apt 4B" />
                                </div>
                                <div className="col-span-12 md:col-span-5 space-y-1.5">
                                    <LabelWithAi htmlFor="addressCity" label="City" fieldName="addressCity" />
                                    <Input name="addressCity" value={formData.addressCity} onChange={handleInputChange} className={inputAiClass("addressCity")} />
                                </div>
                                <div className="col-span-6 md:col-span-4 space-y-1.5">
                                    <LabelWithAi htmlFor="addressState" label="State" fieldName="addressState" />
                                    <Select value={formData.addressState} onValueChange={(val) => handleSelectChange("addressState", val)}>
                                        <SelectTrigger className={inputAiClass("addressState")}>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-6 md:col-span-3 space-y-1.5">
                                    <LabelWithAi htmlFor="addressZip" label="ZIP Code" fieldName="addressZip" />
                                    <Input name="addressZip" value={formData.addressZip} onChange={handleInputChange} className={inputAiClass("addressZip")} />
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* License Information */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-purple-600" />
                                License Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <LabelWithAi htmlFor="licenseNumber" label="License Number" fieldName="licenseNumber" />
                                    <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className={cn(inputAiClass("licenseNumber"), "uppercase")} />
                                </div>
                                <div className="space-y-1.5">
                                    <LabelWithAi htmlFor="licenseState" label="License State" fieldName="licenseState" />
                                    <Select value={formData.licenseState} onValueChange={(val) => handleSelectChange("licenseState", val)}>
                                        <SelectTrigger className={inputAiClass("licenseState")}>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <LabelWithAi htmlFor="dlIssueDate" label="Issue Date" fieldName="dlIssueDate" />
                                    <Input type="date" name="dlIssueDate" value={formData.dlIssueDate} onChange={handleInputChange} className={inputAiClass("dlIssueDate")} />
                                </div>
                                <div className="space-y-1.5">
                                    <LabelWithAi htmlFor="dlExpireDate" label="Expiration Date" fieldName="dlExpireDate" />
                                    <Input type="date" name="dlExpireDate" value={formData.dlExpireDate} onChange={handleInputChange} className={inputAiClass("dlExpireDate")} />
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Additional Information */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Info className="h-4 w-4 text-gray-500" />
                                Other Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="homeTerminal" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Home Terminal</Label>
                                    <Select value={formData.homeTerminal} onValueChange={(val) => handleSelectChange("homeTerminal", val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select terminal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
                                            <SelectItem value="Gary, IN">Gary, IN</SelectItem>
                                            <SelectItem value="Joliet, IL">Joliet, IL</SelectItem>
                                            <SelectItem value="Milwaukee, WI">Milwaukee, WI</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs text-gray-500 font-medium uppercase tracking-wide">Notes</Label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </section>

                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t bg-gray-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
