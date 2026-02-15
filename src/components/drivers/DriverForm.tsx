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
import { operatorsApi } from "@/lib/operatorsApi";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi } from "@/lib/documentsApi";
import { OperatorDto, CreateOperatorDto, UpdateOperatorDto, OperatorStatus, DocumentRole, DriverHiringStage, OperatorDocumentDto } from "@/lib/types";
import { parseDriverLicense } from "@/lib/gemini";
import { LicenseUploadCard } from "@/components/drivers/LicenseUploadCard";
// Remove LicensePreview import if handled by parent
import { AddressAutocomplete } from "@/components/common/AddressAutocomplete";
import { US_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react"; // Ensure FileText is imported

interface DriverFormProps {
    mode: 'create' | 'edit' | 'view';
    initialData?: OperatorDto;
    onSubmit?: (driver: OperatorDto) => void;
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

    // Attached Documents State
    const [attachedDocs, setAttachedDocs] = useState<OperatorDocumentDto[]>([]);

    // Fetch documents effect
    useEffect(() => {
        if (initialData) {
            console.log("INITIAL DATA DEBUG:", initialData);
            if (initialData.documents && initialData.documents.length > 0) {
                console.log("Using initialData.documents:", JSON.stringify(initialData.documents, null, 2));
                setAttachedDocs(initialData.documents);
            } else if (initialData.id) {
                console.log("Fetching attachments for:", initialData.id);
                operatorsApi.getAttachments(initialData.id)
                    .then(docs => {
                        console.log("Fetched docs:", JSON.stringify(docs, null, 2));
                        setAttachedDocs(docs);
                    })
                    .catch(err => console.error("Failed to fetch attachments", err));
            } else {
                console.log("No initialData documents and no ID to fetch from.");
            }
        }
    }, [initialData]);

    // AI filled fields tracker
    const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        driverNumber: "", // Maps to EmployeeId

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
        status: OperatorStatus.Active as OperatorStatus, // Maps to backend Status
        hiringStage: DriverHiringStage.Lead as string, // Store in metadata
        isBlacklisted: false, // Store in metadata
        blacklistReason: "", // Store in metadata
        hireDate: "",
        expectedStartDate: "", // Store in metadata

        // complianceStatus: DriverComplianceStatus.Good, // Can't store unless metadata
        photoUrl: "",
        notes: "", // User visible notes
    });

    // Initialize form data from prop
    useEffect(() => {
        if (initialData) {
            // Parse Metadata from Notes
            let metadata: any = {};
            let userNotes = initialData.notes || "";
            try {
                if (initialData.notes?.startsWith("{")) {
                    const parsed = JSON.parse(initialData.notes);
                    if (parsed.metadata) {
                        metadata = parsed.metadata;
                        userNotes = parsed.userNotes || "";
                    }
                }
            } catch (e) {
                console.warn("Could not parse operator metadata from notes", e);
            }

            // Address Parsing from Metadata
            // If address is stored as single string in metadata.address, split if possible or just put in street
            // For now assume metadata.address contains full string if components missing
            let addressStreet = metadata.addressStreet || metadata.address || "";

            setFormData(prev => ({
                ...prev,
                firstName: initialData.firstName || "",
                lastName: initialData.lastName || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                driverNumber: initialData.employeeId || "",

                status: (() => {
                    const s = initialData.status;
                    if (!s) return OperatorStatus.Active;
                    if (typeof s === 'number') return s;
                    const num = Number(s);
                    if (!isNaN(num)) return num;

                    // Handle string status
                    const str = String(s).toLowerCase();
                    if (str === 'active') return OperatorStatus.Active;
                    if (str === 'inactive' || str === 'suspended') return OperatorStatus.Inactive;
                    if (str === 'onleave' || str === 'on leave') return OperatorStatus.OnLeave;
                    if (str === 'terminated') return OperatorStatus.Terminated;
                    return OperatorStatus.Active;
                })(),
                hireDate: initialData.hireDate ? String(initialData.hireDate) : "",  // Ensure string format

                // License
                licenseNumber: initialData.licenseNumber || "",
                licenseState: initialData.licenseState || "",
                dlExpireDate: initialData.licenseExpirationDate ? String(initialData.licenseExpirationDate) : "",
                dob: initialData.dateOfBirth ? String(initialData.dateOfBirth) : "",

                // Metadata Fields
                homeTerminal: metadata.homeTerminal || "",
                employmentType: metadata.employmentType || (initialData.status === 'Active' ? "Employee" : "Candidate"),
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

                photoUrl: initialData.photoUrl || "",
                notes: userNotes,
            }));
        }
    }, [initialData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const handleLicenseFilesChange = (front: File | null, back: File | null) => {
        setLicenseFront(front);
        setLicenseBack(back);
        if (onLicenseUpload) onLicenseUpload(front, back);
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

        try {
            const url = await uploadsApi.uploadDocument(file);
            setFormData(prev => ({ ...prev, photoUrl: url }));
            toast({ title: "Photo Uploaded", description: "Profile photo updated." });
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload photo.", variant: "destructive" });
        }
    };

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, photoUrl: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validate required fields
        if (!formData.phone || formData.phone.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Phone Number is required. Please enter a valid phone number.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        if (!formData.email || formData.email.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Email Address is required. Please enter a valid email address.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid email address format.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            // Construct Metadata Payload
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
            };

            const notesPayload = JSON.stringify({
                metadata: metadata,
                userNotes: formData.notes
            });

            // Upload License Files if present
            const documentIds: string[] = [];

            const processLicenseFile = async (file: File, title: string) => {
                try {
                    // 1. Upload File
                    const fileUrl = await uploadsApi.uploadDocument(file);

                    // 2. Create Document Entity
                    const doc = await documentsApi.create({
                        fileUrl: fileUrl,
                        fileType: file.type,
                        docKind: 'license', // Explicitly 'license'
                        title: title,
                        driverId: undefined // Will be linked by backend via documentIds
                    });

                    if (doc && doc.id) {
                        documentIds.push(doc.id);
                    }
                } catch (err) {
                    console.error("Failed to upload license file:", title, err);
                    toast({ title: "Upload Warning", description: `Failed to attach ${title}. You can try again from the Documents tab.`, variant: "destructive" });
                }
            };

            if (licenseFront) await processLicenseFile(licenseFront, "Driver License (Front)");
            if (licenseBack) await processLicenseFile(licenseBack, "Driver License (Back)");

            const basePayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                employeeId: formData.driverNumber || `DRV-${Math.floor(Math.random() * 10000)}`,
                status: formData.status,
                licenseNumber: formData.licenseNumber,
                licenseState: formData.licenseState,
                licenseExpirationDate: formData.dlExpireDate || undefined,
                dateOfBirth: formData.dob || undefined,
                hireDate: formData.hireDate || undefined,
                photoUrl: formData.photoUrl,
                notes: notesPayload,
                documentIds: documentIds.length > 0 ? documentIds : undefined,
            };

            let savedOperator: OperatorDto;

            if (mode === 'edit' && initialData) {
                // Update
                const updatePayload: UpdateOperatorDto = {
                    ...basePayload,
                    terminationDate: undefined, // Or handle logic
                };

                const response = await operatorsApi.update(initialData.id, updatePayload);
                // operatorsApi.update usually returns void or updated object?
                // Assuming it returns updated object based on my client implementation
                savedOperator = initialData; // Optimistic or requires fetch
                // Wait, my operatorsApi.update returns response.data
                // So let's fetch fresh or use response
                savedOperator = (response as any) || initialData;

                // Handle Document Uploads
                const uploadDoc = async (file: File, role: DocumentRole, notes: string) => {
                    try {
                        const url = await uploadsApi.uploadDocument(file);
                        // We need to 'create' attachment but attachments api is usually 'upload file content'?
                        // My operatorsApi.attachDocument takes { documentId? ... } 
                        // Wait, `AddOperatorAttachmentDto` takes `documentId`. This implies document is already created globally?
                        // Or maybe backend handles upload?
                        // The user code for `CreateOperatorDto` doesn't handle files immediately.
                        // But `OperatorsController` has `POST {id}/attachments`.
                        // It takes `d.DocumentId` if reusing, or... wait.
                        // Backend `AddOperatorAttachmentDto`: `public Guid DocumentId { get; set; }`
                        // So I must Create a Document entity first via `DocumentsController` (generic) then allow attaching?
                        // OR, maybe the `uploadsApi` returns a `DocumentId`?
                        // User's `operatorsApi.ts` client implementation assumed `uploadsApi` returns URL.
                        // I might need to implement a true document creation flow.
                        // But for now, let's assume I can't easily upload attachments without `Document` entity.
                        // The user prompted: "refer to this backend codes". code has `OperatorDocumentDto`.
                        // Controller `AddAttachment`: `var document = await _context.Documents.FindAsync(dto.DocumentId);`
                        // So YES, I must create a document first.
                        // And `_context.Documents` implies a `DocumentsController`.
                        // I don't have `DocumentsController` source.
                        // BUT, existing `documentsApi` (mock) suggests there is one?
                        // I'll stick to `uploadsApi` returning URL, and just creating a "Note" about the URL for now if I can't create real Document relation.
                        // OR better: Just skip document upload implementation detail for this step since I don't have `DocumentsController` to confirm creation.
                        // The user said "make it fully functional... refer to this backend codes".
                        // Without `DocumentsController` code, I can't know how to create a `Document` ID to pass to `AddAttachment`.
                        // So I will likely FAIL to attach documents properly.
                        // I will add a comment/log about this limitation.
                        console.warn("Skipping true document attachment as DocumentsController is missing.");
                    } catch (err) { console.error(`Failed to upload ${role}`, err); }
                };

                // if (licenseFront) await uploadDoc(licenseFront, DocumentRole.OperatorLicense, "Front");

                toast({ title: "Success", description: "Driver updated successfully." });
                if (onSubmit) onSubmit(savedOperator);
                else navigate(`/app/drivers/${initialData.id}`);

            } else {
                // Create
                const createPayload: CreateOperatorDto = {
                    ...basePayload,
                };
                const newOperator = await operatorsApi.create(createPayload);
                savedOperator = newOperator;

                toast({ title: "Success", description: "Driver created successfully." });
                navigate(`/app/drivers/${newOperator.id}`);
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
    const RenderField = ({ name, value, placeholder, type = "text", maxLength, required }: any) => {
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
                required={required}
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
                        {/* Row 1: First Name and Last Name */}
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="firstName" label="First Name" fieldName="firstName" />
                            <RenderField name="firstName" value={formData.firstName} placeholder="e.g. John" />
                        </div>
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="lastName" label="Last Name" fieldName="lastName" />
                            <RenderField name="lastName" value={formData.lastName} placeholder="e.g. Doe" />
                        </div>

                        {/* Row 2: Date of Birth and Internal Driver ID */}
                        <div className="space-y-2">
                            <LabelWithAi htmlFor="dob" label="Date of Birth" fieldName="dob" />
                            <RenderField name="dob" value={formData.dob} type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="driverNumber">Internal Driver ID</Label>
                            <RenderField name="driverNumber" value={formData.driverNumber} placeholder="Auto-generated" />
                        </div>

                        {/* Row 3: Phone Number and Email Address */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                            <RenderField name="phone" value={formData.phone} placeholder="(555) 000-0000" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                            <RenderField name="email" value={formData.email} placeholder="john@example.com" type="email" required />
                        </div>
                    </div>

                    {/* Residential Address Section */}
                    <div className="space-y-4 pt-6 border-t mt-4">
                        <Label className="flex items-center gap-2 text-gray-700 font-semibold">
                            <MapPin className="h-4 w-4" />
                            Residential Address
                        </Label>

                        <div className="space-y-4">
                            {/* Street Address */}
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

                    {/* Home Terminal */}
                    <div className="space-y-2 pt-4">
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


                    {/* Notes */}
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="notes">Notes</Label>
                        {isEditing ? (
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                rows={3}
                            />
                        ) : (
                            <div className="py-2 text-gray-900 font-medium">{formData.notes || "-"}</div>
                        )}
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

                    {/* Attached License Documents */}
                    <div className="col-span-1 md:col-span-2 pt-4 border-t mt-2">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Attached Documents (Debug: showing all)</Label>
                        {attachedDocs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {attachedDocs.map(doc => (
                                    <a
                                        key={doc.id}
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center group-hover:bg-blue-200">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{doc.fileUrl?.split('/').pop() || "Untitled Document"}</p>
                                            <p className="text-xs text-gray-500">Kind: {doc.docKind || "N/A"}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 italic flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                No documents found attached to this driver.
                            </div>
                        )}
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
                                    {!isEditing ? (
                                        <div className="py-2 text-gray-900 font-medium min-h-[40px] flex items-center">
                                            {formData.status ? OperatorStatus[formData.status] : "Active"}
                                        </div>
                                    ) : (
                                        <Select
                                            value={String(formData.status || 1)}
                                            onValueChange={(val) => handleSelectChange("status", Number(val) as any)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Active</SelectItem>
                                                <SelectItem value="2">Inactive</SelectItem>
                                                <SelectItem value="3">On Leave</SelectItem>
                                                <SelectItem value="4">Terminated</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
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
                </CardContent>
            </Card >

            {/* Submit Button Section - Only for Create Mode */}
            {
                mode === 'create' && (
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading} className="min-w-[120px]">
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Driver
                                </>
                            )}
                        </Button>
                    </div>
                )
            }
        </form >
    );
}
