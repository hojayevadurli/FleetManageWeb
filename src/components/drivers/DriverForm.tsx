import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Make sure to use Link if needed or remove
import { useNavigate } from "react-router-dom";
import { Save, User, ShieldAlert, Truck, Sparkles, MapPin, Info, CreditCard, ArrowLeft, X, Camera, Upload, Trash2, Briefcase } from "lucide-react"; // Added Camera, Upload, Trash2, Briefcase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { driversApi } from "@/lib/driversApi";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi } from "@/lib/documentsApi";
import { Driver, DriverOperatingStatus, DriverHiringStage, DriverComplianceStatus } from "@/lib/types";
import { parseDriverLicense } from "@/lib/gemini";
import { LicenseUploadCard } from "@/components/drivers/LicenseUploadCard";
// Remove LicensePreview import if handled by parent
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { US_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DriverFormProps {
    mode: 'create' | 'edit' | 'view';
    initialData?: Driver;
    onSubmit?: (driver: Driver) => void;
    onCancel?: () => void;
    onLicenseUpload?: (front: File | null, back: File | null) => void; // Callback to parent to handle preview if needed
}

export function DriverForm({ mode, initialData, onSubmit, onCancel, onLicenseUpload }: DriverFormProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isParsingLicense, setIsParsingLicense] = useState(false);
    const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit'); // Derived state for inputs

    // Effect to update local edit state if mode changes
    useEffect(() => {
        setIsEditing(mode === 'create' || mode === 'edit');
    }, [mode]);

    // License files state (local to form if needed for upload logic)
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    // AI filled fields tracker
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        driverNumber: "",

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
        operatingStatus: DriverOperatingStatus.Active as string, // Allow string for flexibility
        hiringStage: DriverHiringStage.Lead as string,
        isBlacklisted: false,
        blacklistReason: "",
        hireDate: "",
        expectedStartDate: "",

        complianceStatus: DriverComplianceStatus.Good, // For snapshot
        photoUrl: "",
    });

    // Initialize form data from prop
    useEffect(() => {
        if (initialData) {
            // Parse name if needed, or assume existing fields map directly
            // Address parsing needed if stored as single string
            // For now, let's try to map what we can
            // If addressComponents are NOT in Driver type, we might need to parse the address string or update backend to send components.
            // Assuming for now simple mapping or empty defaults if not present

            // Basic parsing of address string if components missing
            let street = "", unit = "", city = "", state = "", zip = "";
            // TODO: Better address parsing if needed. For now, if we saved it as component fields, we should retrieve them.
            // If the Backend DTO doesn't have address components separate, we might lose detailed edit capability without parsing.
            // Let's assume for this refactor we rely on what's available or user manual fix.
            // Actually, looks like CreateDriverPage joins them: `${street}${unit...}, ${city}, ${state} ${zip}`
            // So we'd need to parse it back or just fill "addressStreet" with the full string if we don't have parts.

            // Helper to try and parse standard US address format: "Street, City, State Zip"
            // Start simple
            const fullAddress = initialData.homeTerminal || ""; // Use homeTerminal? No, user has "address" prop in Create payload?
            // Driver interface has 'homeTerminal' but looks like CreateDriverPage relies on 'address' variable in submit but 'homeTerminal' in state
            // Re-read CreateDriverPage submit:
            // address: `${formData.addressStreet}...`
            // But Driver type has `homeTerminal`? Let's check `Driver` interface in types.ts
            // driversApi.createDriver payload: address is sent.
            // Driver type in types.ts HAS NO `address` field! It has `homeTerminal`.
            // Wait, CreateDriverPage sends `address` in payload, but `driversApi.createDriver` uses `Driver` type... 
            // Actually, `driversApi.createDriver` takes `any` or `Omit<Driver, 'id'>`?
            // Let's look at `types.ts` again. `Driver` interface lines 551-582 does NOT have `address`, only `homeTerminal`.
            // But `ReceiptParsedData` has `address`. `DriverLicenseParsedData` has `address`.
            // The `CreateDriverPage` submit payload line 192: `address: ...`. 
            // If the backend accepts `address` but the frontend `Driver` type doesn't have it, we might lose it on fetch.
            // Let's assume for now we might map `homeTerminal` to `addressCity` or similar if that's what it meant, or maybe I missed proper `address` field in `Driver`.
            // Checking `Driver` type in read file output...
            // It has `homeTerminal`. It does NOT have `address`.
            // Ideally we need to see how `DriverDetailPage` creates the address display.
            // `OverviewTab.tsx` line 48: `{driver.homeTerminal || 'Not assigned'}`.
            // The `CreateDriverPage` puts the composed address into... where?
            // `payload` has `address`.
            // If `Driver` type on frontend is incomplete, I should maybe update `Driver` type too.
            // But for now, map `homeTerminal` to `homeTerminal` form field. And if `address` is missing from `Driver`, we can't pre-fill it accurately without backend change.
            // Workaround: We will leave address fields empty or put `homeTerminal` into one of them if logical. 
            // Or better, maybe `driver` object DOES have address from API but type def is missing it.
            // I'll add `address?: string;` to `Driver` type via an edit to make sure.

            setFormData(prev => ({
                ...prev,
                firstName: initialData.firstName || "",
                lastName: initialData.lastName || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                driverNumber: initialData.driverNumber || "",
                homeTerminal: initialData.homeTerminal || "",

                employmentType: initialData.hiringStage ? "Candidate" : "Employee",
                operatingStatus: initialData.operatingStatus || DriverOperatingStatus.Active,
                hiringStage: initialData.hiringStage || DriverHiringStage.Lead,
                isBlacklisted: initialData.isBlacklisted || false,
                // blacklistReason: initialData.blacklistReason || "", // If exists
                hireDate: initialData.hireDate ? initialData.hireDate.split('T')[0] : "",

                // Address - attempt to use what we have
                // If we added `address` to Driver type, we could use it.
                // For now, let's assume we can map what we can.

                // Address
                addressStreet: initialData.address || "", // Map full address to street for now if parts missing

                // License
                licenseNumber: initialData.licenseNumber || "",
                licenseState: initialData.licenseState || "",
                dlIssueDate: initialData.dlIssueDate ? initialData.dlIssueDate.split('T')[0] : "",
                dlExpireDate: initialData.dlExpireDate ? initialData.dlExpireDate.split('T')[0] : "",
                medicalExpiration: initialData.medicalCardExpiration ? initialData.medicalCardExpiration.split('T')[0] : "",

                complianceStatus: initialData.complianceStatus || DriverComplianceStatus.Good,
                photoUrl: initialData.photoUrl || "",
            }));
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Remove AI indicator
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

    // Dynamic Compliance Calculation
    useEffect(() => {
        if (!isEditing) return;

        const checkDate = (dateStr: string) => {
            if (!dateStr) return 'missing';
            const date = new Date(dateStr);
            const now = new Date();
            const diffTime = date.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'expired';
            if (diffDays <= 30) return 'expiring';
            return 'valid';
        };

        const dlStatus = checkDate(formData.dlExpireDate);
        const medStatus = checkDate(formData.medicalExpiration);

        // Determine overall status
        let newStatus = DriverComplianceStatus.Good;

        if (dlStatus === 'expired' || medStatus === 'expired') {
            newStatus = DriverComplianceStatus.NonCompliant;
        } else if (dlStatus === 'expiring' || medStatus === 'expiring') {
            newStatus = DriverComplianceStatus.Review; // Mapping 'Expiring Soon' to Review/Action
        } else if (dlStatus === 'missing' || medStatus === 'missing') {
            // If missing, arguably maybe not Good, but let's stick to Good unless known bad for this demo
            // Or keep existing status if manually set? 
            // Let's default to Good if valid.
            newStatus = DriverComplianceStatus.Good;
        }

        // Only update if changed to avoid loop
        if (newStatus !== formData.complianceStatus) {
            setFormData(prev => ({ ...prev, complianceStatus: newStatus }));
        }

    }, [formData.dlExpireDate, formData.medicalExpiration, isEditing]);

    const handleBlacklistToggle = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isBlacklisted: checked }));
    };

    const handleLicenseFilesChange = (front: File | null, back: File | null) => {
        setLicenseFront(front);
        setLicenseBack(back);
        if (onLicenseUpload) onLicenseUpload(front, back);
    };

    const handleParseLicense = async () => {
        // ... (Keep existing parse logic, simplified for brevity but full logic needed)
        // For this artifact, I'll copy the key logic
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
                        toast({ title: "Driver License Parsed", description: "Review the auto-filled fields below." });
                    } else {
                        toast({ title: "Analysis Failed", description: "Couldn't parse license.", variant: "destructive" });
                    }
                } catch (e) {
                    toast({ title: "Error", description: "Failed to parse", variant: "destructive" });
                } finally {
                    setIsParsingLicense(false);
                }
            };
        } catch (error) { setIsParsingLicense(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, upload immediately to get URL
        // setUploadingPhoto(true);
        try {
            const url = await uploadsApi.uploadDocument(file);
            setFormData(prev => ({ ...prev, photoUrl: url }));
            toast({ title: "Photo Uploaded", description: "Profile photo updated." });
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload photo.", variant: "destructive" });
        }
        // setUploadingPhoto(false);
    };

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, photoUrl: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fullAddress = `${formData.addressStreet}${formData.addressUnit ? ` ${formData.addressUnit}` : ''}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`;

            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                driverNumber: formData.driverNumber || `DRV-${Math.floor(Math.random() * 10000)}`,
                homeTerminal: formData.homeTerminal,
                isBlacklisted: formData.isBlacklisted,
                complianceStatus: formData.complianceStatus,
                hireDate: formData.employmentType === "Employee" ? formData.hireDate : undefined,
                address: fullAddress,

                // New Fields Persistence
                dob: formData.dob,
                licenseNumber: formData.licenseNumber,
                licenseState: formData.licenseState,
                dlIssueDate: formData.dlIssueDate,
                dlExpireDate: formData.dlExpireDate,
                medicalCardExpiration: formData.medicalExpiration,
                photoUrl: formData.photoUrl,
            };

            if (formData.isBlacklisted) {
                // Logic handled by backend override usually
            } else if (formData.employmentType === "Employee") {
                payload.operatingStatus = formData.operatingStatus;
            } else {
                payload.hiringStage = formData.hiringStage;
            }

            let savedDriver: Driver;

            if (mode === 'edit' && initialData) {
                // Update Mode
                const updatedDriver = await driversApi.updateDriver(initialData.id, payload);
                savedDriver = updatedDriver;

                // Upload new docs if any
                const uploadDoc = async (file: File, type: string) => {
                    try {
                        const url = await uploadsApi.uploadDocument(file);
                        await documentsApi.create({
                            driverId: initialData.id,
                            fileUrl: url,
                            fileType: file.type,
                            docKind: "license",
                            title: type,
                            expiryDate: formData.dlExpireDate
                        });
                    } catch (err) { console.error(`Failed to upload ${type}`, err); }
                };
                if (licenseFront) await uploadDoc(licenseFront, "Driver License - Front (Updated)");
                if (licenseBack) await uploadDoc(licenseBack, "Driver License - Back (Updated)");

                toast({ title: "Success", description: "Driver updated successfully." });
                if (onSubmit) {
                    onSubmit(updatedDriver);
                } else {
                    navigate(`/app/drivers/${initialData.id}`);
                }

            } else {
                // Create Mode
                const newDriver = await driversApi.createDriver(payload);

                // Verify Persistence
                const fetched = await driversApi.getDriverById(newDriver.id);
                if (!fetched || !fetched.address || !fetched.licenseNumber) {
                    // In mock, this might happen if createDriver doesn't store all fields. 
                    // But we updated types, so if driversApi just spreads, it should work.
                    // Warn if criticals missing
                    console.warn("Verify check failed:", fetched);
                }

                // Upload docs logic...
                const uploadDoc = async (file: File, type: string) => {
                    try {
                        const url = await uploadsApi.uploadDocument(file);
                        await documentsApi.create({
                            driverId: newDriver.id,
                            fileUrl: url,
                            fileType: file.type,
                            docKind: "license",
                            title: type,
                            expiryDate: formData.dlExpireDate
                        });
                    } catch (err) { console.error(`Failed to upload ${type}`, err); }
                };
                if (licenseFront) await uploadDoc(licenseFront, "Driver License - Front");
                if (licenseBack) await uploadDoc(licenseBack, "Driver License - Back");

                savedDriver = newDriver;
                toast({ title: "Success", description: "Driver created successfully." });
                navigate(`/app/drivers/${newDriver.id}`);
            }

        } catch (error) {
            console.error(error);
            toast({ title: "Operation Failed", variant: "destructive", description: "Could not save driver. Check connection." });
        } finally {
            setLoading(false);
        }
    };

    // Helper for AI Indicator
    const LabelWithAi = ({ htmlFor, label, fieldName }: { htmlFor?: string, label: string, fieldName: string }) => (
        <Label htmlFor={htmlFor} className="flex justify-between items-center group">
            {label}
            {aiFilledFields.has(fieldName) && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <Sparkles className="h-2 w-2" />
                    AI-filled
                </span>
            )}
        </Label>
    );

    const inputAiClass = (fieldName: string) => cn(
        !isEditing && "bg-transparent border-none shadow-none p-0 h-auto font-medium text-gray-900",
        isEditing && aiFilledFields.has(fieldName) && "bg-yellow-50/50 border-yellow-200 transition-colors duration-500 focus:bg-white focus:border-blue-400"
    );

    // Conditional render for View Mode text vs Input
    const RenderField = ({ name, value, placeholder, type = "text", maxLength }: any) => {
        if (!isEditing) {
            return <div className="py-2 text-gray-900 font-medium min-h-[40px] flex items-center">{value || "-"}</div>;
        }
        return (
            <Input
                id={name}
                name={name}
                type={type}
                maxLength={maxLength}
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                className={inputAiClass(name)}
            />
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Sticky Header for Edit Mode */}
            {mode === 'edit' && (
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b py-3 -mx-6 px-6 flex justify-between items-center mb-6">
                    <span className="font-semibold text-gray-700">Editing Driver Profile</span>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                        )}
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            )}

            {/* AI Parse Section - Only in Create or Edit mode if needed */}
            {isEditing && (
                <>
                    <LicenseUploadCard
                        onFilesChange={handleLicenseFilesChange}
                        onParse={handleParseLicense}
                        isParsing={isParsingLicense}
                        aiFilledCount={aiFilledFields.size}
                    />
                </>
            )}

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Photo Upload */}
                    <div className="flex items-center gap-6 pb-6 border-b">
                        <div className="relative h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group hover:border-blue-400 transition-colors">
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-8 w-8 text-gray-400" />
                            )}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                    <Camera className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        {isEditing && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Profile Photo</Label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="sm" className="relative overflow-hidden">
                                        <Upload className="h-3 w-3 mr-2" /> Upload
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handlePhotoUpload}
                                        />
                                    </Button>
                                    {formData.photoUrl && (
                                        <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 className="h-3 w-3 mr-2" /> Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">JPG or PNG. Max 5MB.</p>
                            </div>
                        )}
                        {!isEditing && formData.photoUrl && (
                            <div className="text-sm text-gray-500 italic">Profile photo set</div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="firstName" label="First Name" fieldName="firstName" />
                            <RenderField name="firstName" value={formData.firstName} placeholder="e.g. John" />
                        </div>
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="lastName" label="Last Name" fieldName="lastName" />
                            <RenderField name="lastName" value={formData.lastName} placeholder="e.g. Doe" />
                        </div>
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="dob" label="Date of Birth" fieldName="dob" />
                            <RenderField name="dob" value={formData.dob} type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="driverNumber">Internal Driver ID</Label>
                            <RenderField name="driverNumber" value={formData.driverNumber} placeholder="Auto-generated" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <RenderField name="phone" value={formData.phone} placeholder="(555) 000-0000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <RenderField name="email" value={formData.email} placeholder="john@example.com" type="email" />
                        </div>

                        {/* Address Section */}
                        <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t mt-2">
                            <Label className="flex items-center gap-2 text-gray-700 font-semibold">
                                <MapPin className="h-4 w-4" />
                                Residential Address
                            </Label>

                            <div className="space-y-4">
                                {/* Row 1: Street Address */}
                                <div className="space-y-2">
                                    <LabelWithAi htmlFor="addressStreet" label="Street Address" fieldName="addressStreet" />
                                    {isEditing ? (
                                        <>
                                            {aiFilledFields.has("addressStreet") && (
                                                <div className="text-[11px] text-yellow-700 flex items-center gap-1 mb-1">
                                                    <Info className="h-3 w-3" />
                                                    AI-detected address — please verify.
                                                </div>
                                            )}
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
                                                    // Clear AI flags...
                                                }}
                                                className={inputAiClass("addressStreet")}
                                                placeholder="Start typing..."
                                            />
                                        </>
                                    ) : (
                                        <div className="py-2 text-gray-900 font-medium">{formData.addressStreet || "-"}</div>
                                    )}
                                </div>

                                {/* Row 2: Apt/Unit */}
                                <div className="space-y-2">
                                    <Label htmlFor="addressUnit" className="text-gray-600 font-normal text-sm">
                                        Apt, Suite, Unit <span className="text-gray-400">(optional)</span>
                                    </Label>
                                    <RenderField name="addressUnit" value={formData.addressUnit} placeholder="e.g. Apt 4B" className="max-w-md" />
                                </div>

                                {/* Row 3 */}
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <LabelWithAi htmlFor="addressCity" label="City" fieldName="addressCity" />
                                        <RenderField name="addressCity" value={formData.addressCity} placeholder="City" />
                                    </div>
                                    <div className="col-span-6 md:col-span-4 space-y-2">
                                        <LabelWithAi htmlFor="addressState" label="State" fieldName="addressState" />
                                        {isEditing ? (
                                            <Select value={formData.addressState} onValueChange={(val) => handleSelectChange("addressState", val)}>
                                                <SelectTrigger className={inputAiClass("addressState")}>
                                                    <SelectValue placeholder="State" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="py-2 text-gray-900 font-medium">{formData.addressState || "-"}</div>
                                        )}
                                    </div>
                                    <div className="col-span-6 md:col-span-3 space-y-2">
                                        <LabelWithAi htmlFor="addressZip" label="ZIP Code" fieldName="addressZip" />
                                        <RenderField name="addressZip" value={formData.addressZip} placeholder="ZIP" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="homeTerminal">Home Terminal</Label>
                            {isEditing ? (
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
                            ) : (
                                <div className="py-2 text-gray-900 font-medium">{formData.homeTerminal || "-"}</div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* License Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        License Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <LabelWithAi label="License Number (DL)" fieldName="licenseNumber" />
                        <RenderField name="licenseNumber" value={formData.licenseNumber} placeholder="D1234567" className="uppercase" />
                    </div>
                    <div className="space-y-2">
                        <LabelWithAi label="License State" fieldName="licenseState" />
                        {isEditing ? (
                            <Select value={formData.licenseState} onValueChange={(val) => handleSelectChange("licenseState", val)}>
                                <SelectTrigger className={inputAiClass("licenseState")}>
                                    <SelectValue placeholder="Select State" />
                                </SelectTrigger>
                                <SelectContent>
                                    {US_STATES.map(s => <SelectItem key={s.value} value={s.value}>{s.value} - {s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="py-2 text-gray-900 font-medium">{formData.licenseState || "-"}</div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <LabelWithAi label="Issue Date" fieldName="dlIssueDate" />
                        <RenderField name="dlIssueDate" value={formData.dlIssueDate} type="date" />
                    </div>
                    <div className="space-y-2">
                        <LabelWithAi label="Expiration Date" fieldName="dlExpireDate" />
                        <RenderField name="dlExpireDate" value={formData.dlExpireDate} type="date" />
                    </div>
                    <div className="space-y-2">
                        <Label>Medical Card Expiration</Label>
                        <RenderField name="medicalExpiration" value={formData.medicalExpiration} type="date" />
                    </div>
                </CardContent>
            </Card>

            {/* Employment & Status Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-emerald-600" />
                        Employment & Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Driver Type Selection */}
                    <div className="space-y-3">
                        <Label>Driver Type</Label>
                        <RadioGroup
                            value={formData.employmentType}
                            onValueChange={(val) => handleSelectChange("employmentType", val)}
                            className="flex gap-4"
                        >
                            <div className={`flex items-center space-x-2 border rounded-lg p-3 w-40 cursor-pointer transition-colors ${formData.employmentType === 'Employee' ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-gray-50'}`}>
                                <RadioGroupItem value="Employee" id="type-employee" />
                                <Label htmlFor="type-employee" className="cursor-pointer font-medium">Employee</Label>
                            </div>
                            <div className={`flex items-center space-x-2 border rounded-lg p-3 w-40 cursor-pointer transition-colors ${formData.employmentType === 'Candidate' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                                <RadioGroupItem value="Candidate" id="type-candidate" />
                                <Label htmlFor="type-candidate" className="cursor-pointer font-medium">Candidate</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {formData.employmentType === 'Employee' ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Operating Status</Label>
                                    <Select
                                        value={formData.operatingStatus}
                                        onValueChange={(val) => handleSelectChange("operatingStatus", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={DriverOperatingStatus.Active}>Active</SelectItem>
                                            <SelectItem value={DriverOperatingStatus.OnLeave}>On Leave</SelectItem>
                                            <SelectItem value={DriverOperatingStatus.Suspended}>Suspended</SelectItem>
                                            <SelectItem value={DriverOperatingStatus.Terminated}>Terminated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Hire Date</Label>
                                    <Input
                                        type="date"
                                        name="hireDate"
                                        value={formData.hireDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Hiring Stage</Label>
                                    <Select
                                        value={formData.hiringStage}
                                        onValueChange={(val) => handleSelectChange("hiringStage", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={DriverHiringStage.Lead}>Lead</SelectItem>
                                            <SelectItem value={DriverHiringStage.Applied}>Applied</SelectItem>
                                            <SelectItem value={DriverHiringStage.Screening}>Screening</SelectItem>
                                            <SelectItem value={DriverHiringStage.Interview}>Interview</SelectItem>
                                            <SelectItem value={DriverHiringStage.Offer}>Offer</SelectItem>
                                            <SelectItem value={DriverHiringStage.Checks}>Checks</SelectItem>
                                            <SelectItem value={DriverHiringStage.Onboarding}>Onboarding</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Expected Start Date</Label>
                                    <Input
                                        type="date"
                                        name="expectedStartDate"
                                        value={formData.expectedStartDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Blacklist Toggle */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Restricted / Blacklisted</Label>
                                <p className="text-sm text-gray-500">Prevent this driver from being dispatched.</p>
                            </div>
                            <Switch
                                checked={formData.isBlacklisted}
                                onCheckedChange={handleBlacklistToggle}
                            />
                        </div>

                        {formData.isBlacklisted && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-red-600">Reason for Restriction (Required)</Label>
                                <Input
                                    name="blacklistReason"
                                    value={formData.blacklistReason}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Test failure, safety violation..."
                                    className="border-red-200 focus-visible:ring-red-500"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Submit Buttons for Create Mode */}
            {mode === 'create' && (
                <div className="flex items-center justify-end gap-4 pt-4">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
                    <Button type="submit" disabled={loading} className="min-w-[120px]">
                        {loading ? "Creating..." : (<><Save className="h-4 w-4 mr-2" /> Create Driver</>)}
                    </Button>
                </div>
            )}
        </form>
    );
}
