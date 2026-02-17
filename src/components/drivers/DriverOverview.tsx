import { useEffect, useState } from "react";
import { OperatorDto, OperatorStatus, AssignmentDto, DocumentRole, OperatorContract } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { tenantsApi } from "@/lib/tenantsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar, Phone, Mail, MapPin, Truck, CreditCard,
    FileText, AlertCircle, CheckCircle2, DollarSign, MessageSquare, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AssignedEquipmentSection } from "./AssignedEquipmentSection";
import { EquipmentAssignmentCTA } from "./EquipmentAssignmentCTA";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { ContractModal } from "./ContractModal";
import { PersonalDetailsModal } from "./PersonalDetailsModal";
import { ContractHistoryModal } from "./ContractHistoryModal";

interface DriverOverviewProps {
    driver: OperatorDto;
    onEdit?: () => void;
    // Equipment Assignment Props
    hasEquipment?: boolean;
    onAssignEquipment?: () => void;
    assignmentRefreshKey?: number;
    onAssignmentEnded?: () => void;
}

export function DriverOverview({
    driver,
    onEdit,
    hasEquipment = false,
    onAssignEquipment,
    assignmentRefreshKey = 0,
    onAssignmentEnded
}: DriverOverviewProps) {
    const [activeModal, setActiveModal] = useState<{ role: DocumentRole, title: string } | null>(null);
    const [contractModalOpen, setContractModalOpen] = useState(false);
    const [personalDetailsModalOpen, setPersonalDetailsModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    // Local driver state to support refreshing without parent reload
    const [localDriver, setLocalDriver] = useState<OperatorDto>(driver);

    // Restoring missing state variables
    const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
    const [activeAssignment, setActiveAssignment] = useState<AssignmentDto | null>(null);
    const [metadata, setMetadata] = useState<any>({});
    const [documents, setDocuments] = useState<any[]>(driver.documents || []);
    const [tenantName, setTenantName] = useState<string>("");
    const [contract, setContract] = useState<OperatorContract | null>(null);

    useEffect(() => {
        setLocalDriver(driver);
    }, [driver]);

    // Parse metadata from notes (using localDriver)
    useEffect(() => {
        if (localDriver.notes?.startsWith("{")) {
            try {
                const parsed = JSON.parse(localDriver.notes);
                if (parsed.metadata) {
                    setMetadata(parsed.metadata);
                }
            } catch (e) {
                console.error("Failed to parse driver metadata", e);
            }
        }
    }, [localDriver.notes]);

    // Fetch assignments, documents, and tenant info
    const refreshData = () => {
        if (localDriver.id) {
            // Refresh Documents
            operatorsApi.getAttachments(localDriver.id)
                .then(docs => {
                    console.log("Fetched detailed docs:", docs);
                    setDocuments(docs);
                })
                .catch(err => console.error("Failed to refresh documents", err));

            // Refresh Driver Details (to get updated expiration dates if backend syncs them)
            operatorsApi.getById(localDriver.id)
                .then(d => setLocalDriver(d))
                .catch(err => console.error("Failed to refresh driver", err));
        }
    };

    useEffect(() => {
        if (localDriver.id) {
            // Fetch Assignments
            operatorsApi.getAssignments(localDriver.id)
                .then(data => {
                    setAssignments(data);
                    const active = data.find(a => !a.endAt);
                    setActiveAssignment(active || null);
                })
                .catch(err => console.error("Failed to fetch assignments", err));

            // Fetch Documents (ensure we have them even if not in parent DTO)
            operatorsApi.getAttachments(localDriver.id)
                .then(docs => {
                    console.log("Fetched detailed docs:", docs);
                    setDocuments(docs);
                })
                .catch(err => console.error("Failed to fetch documents", err));

            // Fetch Tenant Info
            tenantsApi.getCurrent()
                .then(tenant => setTenantName(tenant.name))
                .catch(err => console.error("Failed to fetch tenant info", err));

            // Fetch Contracts
            operatorsApi.getContracts(localDriver.id)
                .then(contracts => {
                    // Find active contract or use the most recent one
                    // Assuming contracts are returned, we can sort them or find the active one
                    // Logic: isActive is true, or just sort by startDate desc
                    const active = contracts.find(c => c.isActive) ||
                        contracts.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
                    setContract(active || null);
                })
                .catch(err => console.error("Failed to fetch contracts", err));
        }
    }, [localDriver.id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), "MM/dd/yyyy");
        } catch (e) {
            return dateString;
        }
    };

    // Helper to check if file is image
    const isImage = (doc: any) => {
        return doc.fileType?.includes("image") ||
            doc.fileUrl?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    };

    // Helper to get latest document for a role
    const getLatestDoc = (role: DocumentRole) => {
        if (!documents || documents.length === 0) return undefined;
        // Search by role, sort by CreatedAt desc
        const docs = documents.filter(d => d.role === role);
        if (docs.length === 0) return undefined;
        return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    };

    const licenseDoc = getLatestDoc(DocumentRole.OperatorLicense);
    const medCertDoc = getLatestDoc(DocumentRole.MedicalCard);
    const mvrDoc = getLatestDoc(DocumentRole.MVR);
    const clearinghouseDoc = getLatestDoc(DocumentRole.ClearinghouseQuery);
    // SSN isn't a specific role, usually handled as 'Other' or just metadata. 
    // If we want to support SSN document upload, we can look for 'Other' with title 'SSN'?
    // For now, we'll rely on metadata for the number, but maybe look for a doc for "On File" status?
    const ssnDoc = documents?.find(d => d.title?.includes("SSN") || d.docKind === "ssn_card");

    // Helper for Status Badges
    const ExpirationCard = ({ title, date, icon: Icon, doc, onClick }: any) => {
        // Source of truth: Document Expiration -> Metadata/Driver Date
        const effectiveDate = doc?.expirationDate || date;
        const isOnFile = !!doc || !!date;
        const isExpired = effectiveDate && new Date(effectiveDate) < new Date();

        return (
            <div
                onClick={onClick}
                className={cn(
                    "bg-white border rounded-lg p-3 flex-1 min-w-[140px] shadow-sm relative overflow-hidden group transition-all",
                    onClick ? "cursor-pointer hover:border-blue-400 hover:shadow-md" : ""
                )}
            >
                <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-600">
                    {title}
                    {Icon && <Icon className="h-3 w-3" />}
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">
                    {effectiveDate ? formatDate(effectiveDate) : "Not on File"}
                </div>

                <div className={`text-xs flex items-center gap-1 ${!isOnFile ? "text-gray-400" : isExpired ? "text-red-600 font-medium" : "text-emerald-600"}`}>
                    {!isOnFile ? (
                        <>
                            <AlertCircle className="h-3 w-3" />
                            Missing
                        </>
                    ) : isExpired ? (
                        <>
                            <AlertCircle className="h-3 w-3" />
                            Expired
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            On File
                        </>
                    )}
                </div>

                {/* Hover indicator */}
                {onClick && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3 w-3 text-blue-500" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Row: Expirations */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ExpirationCard
                    title="CDL"
                    date={localDriver.licenseExpirationDate}
                    doc={licenseDoc}
                    icon={CreditCard}
                    onClick={() => setActiveModal({ role: DocumentRole.OperatorLicense, title: "CDL Information" })}
                />
                <ExpirationCard
                    title="Med/Cert"
                    date={metadata.medicalCardExpiration}
                    doc={medCertDoc}
                    icon={FileText}
                    onClick={() => setActiveModal({ role: DocumentRole.MedicalCard, title: "Medical Certificate" })}
                />
                <ExpirationCard
                    title="MVR"
                    date={metadata.mvrExpiration}
                    doc={mvrDoc}
                    icon={FileText}
                    onClick={() => setActiveModal({ role: DocumentRole.MVR, title: "Motor Vehicle Record (MVR)" })}
                />
                <ExpirationCard
                    title="C/House"
                    date={metadata.clearinghouseExpiration}
                    doc={clearinghouseDoc}
                    icon={FileText}
                    onClick={() => setActiveModal({ role: DocumentRole.ClearinghouseQuery, title: "Clearinghouse Query" })}
                />
                <div
                    className="bg-white border rounded-lg p-3 flex-1 min-w-[140px] shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md group relative"
                    onClick={() => setActiveModal({ role: DocumentRole.Other, title: "Social Security Number" })}
                >
                    <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-600">SSN</div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                        {metadata.ssn ? `***-**-${metadata.ssn.slice(-4)}` : "Not on File"}
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${(metadata.ssn || ssnDoc) ? "text-emerald-600" : "text-gray-400"}`}>
                        <FileText className="h-3 w-3" />
                        {(metadata.ssn || ssnDoc) ? "SSN On File" : "Missing"}
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="h-3 w-3 text-blue-500" />
                    </div>
                </div>
            </div>

            {/* General Details Section */}
            <Card className="border-none shadow-sm bg-gray-50/50">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <div className="text-sm text-gray-500 font-medium mb-1">General Details</div>
                        <div className="flex gap-8">
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Hired To</div>
                                <div className="font-semibold text-gray-900">{tenantName || "Loading..."}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Hired Date</div>
                                <div className="font-semibold text-gray-900">{formatDate(localDriver.hireDate || metadata.hireDate || metadata.hiredDate)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Terminated Date</div>
                                <div className="font-semibold text-gray-900">{localDriver.terminationDate ? formatDate(localDriver.terminationDate) : "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Terminated Reason</div>
                                <div className="font-semibold text-gray-900">{metadata.terminationReason || "-"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide">Rehired Date</div>
                                <div className="font-semibold text-gray-900">{metadata.rehiredDate ? formatDate(metadata.rehiredDate) : "-"}</div>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Active</Badge>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 spans) */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Personal Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    Personal Details
                                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Assigned Asset Display */}
                                    {activeAssignment && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                                            <Truck className="h-4 w-4 text-slate-500" />
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Assigned</span>
                                                <span className="text-xs font-black text-slate-900">{activeAssignment.equipmentUnitNumber}</span>
                                            </div>
                                        </div>
                                    )}

                                    {onEdit && (
                                        <Button variant="ghost" size="icon" onClick={() => setPersonalDetailsModalOpen(true)} className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500">First Name</div>
                                <div className="font-medium">{localDriver.firstName}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Middle Name</div>
                                <div className="font-medium">{localDriver.lastName}</div> {/* Using Lastname as placeholder if middle missing */}
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Last Name</div>
                                <div className="font-medium">{localDriver.lastName}</div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <div className="font-medium">{localDriver.phone}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <div className="font-medium text-sm truncate">{localDriver.email}</div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-xs text-gray-500">Statement Email</div>
                                <div className="font-medium text-sm truncate">{localDriver.email}</div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500">License Number</div>
                                <div className="font-medium">{localDriver.licenseNumber || "N/A"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">DOB</div>
                                <div className="font-medium">{formatDate(localDriver.dateOfBirth)}</div>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div className="text-sm max-w-[200px]">
                                    {metadata.address ||
                                        `${metadata.addressStreet || ''} ${metadata.addressCity || ''} ${metadata.addressState || ''} ${metadata.addressZip || ''}`.trim() ||
                                        "No Address On File"}
                                </div>
                            </div>

                            <Separator />

                            {/* License Information Section */}
                            <div>
                                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                    License Information
                                </div>

                                {/* License Image */}
                                {licenseDoc ? (
                                    <div className="mb-4">
                                        <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm max-w-[300px]">
                                            {isImage(licenseDoc) ? (
                                                <img
                                                    src={licenseDoc.fileUrl}
                                                    alt="Driver License"
                                                    className="w-full object-contain max-h-[180px] cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(licenseDoc.fileUrl, '_blank')}
                                                />
                                            ) : (
                                                <div className="h-[120px] flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                                                    <FileText className="h-8 w-8 text-slate-400 mb-2" />
                                                    <p className="font-medium text-xs text-gray-900 mb-1">{licenseDoc.docKind || "Document"}</p>
                                                    <a
                                                        href={licenseDoc.fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        View PDF <CreditCard className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => window.open(licenseDoc.fileUrl, '_blank')}
                                            >
                                                <FileText className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = licenseDoc.fileUrl;
                                                    link.download = `CDL_${localDriver.firstName}_${localDriver.lastName}`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                <CreditCard className="h-3 w-3 mr-1" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 text-xs text-gray-400 italic">No license image on file</div>
                                )}

                                {/* License Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500">License Number (DL)</div>
                                        <div className="font-medium">{localDriver.licenseNumber || "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">License State</div>
                                        <div className="font-medium">{localDriver.licenseState || "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Issue Date</div>
                                        <div className="font-medium">{formatDate(metadata.dlIssueDate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Expiration Date</div>
                                        <div className="font-medium">{formatDate(localDriver.licenseExpirationDate)}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Details (formerly Contract) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    Employment Details
                                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                                </div>
                                {onEdit && (
                                    <Button variant="ghost" size="icon" onClick={() => setContractModalOpen(true)} className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-gray-500">Employment Type</div>
                                    <div className="font-medium">{contract?.employmentTypeName || metadata.employmentType || "Company Driver"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">Employee ID</div>
                                    <div className="font-medium">{localDriver.employeeId || "-"}</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs text-gray-500">Pay Model</div>
                                    <div className="font-medium">{contract?.paymentType || metadata.paymentType || "Per Mile"}</div>
                                </div>
                                {contract?.payFrequency && (
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Pay Frequency</div>
                                        <div className="font-medium">{contract.payFrequency}</div>
                                    </div>
                                )}
                            </div>

                            {/* Highlighted Rate Section */}
                            <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-sm font-medium text-emerald-900">Current Rate</span>
                                <span className="text-lg font-bold text-emerald-700">
                                    {contract?.paymentRate
                                        ? (contract.paymentType === 'Percentage' ? `${contract.paymentRate}%` : `$${contract.paymentRate}`)
                                        : (metadata.paymentRate ? `$${metadata.paymentRate}` : "Standard")}

                                    <span className="text-xs font-normal text-emerald-600 ml-1">
                                        {contract?.paymentType === 'Per Mile' ? '/ mile' :
                                            contract?.paymentType === 'Hourly' ? '/ hr' : ''}
                                    </span>
                                </span>
                            </div>

                            {contract?.driverRole === 'Owner Operator' && (
                                <div>
                                    <div className="text-xs text-gray-500">Gross Share</div>
                                    <div className="font-medium">
                                        {contract?.grossShare !== undefined ? `${contract.grossShare}%` : (metadata.grossShare ? `${metadata.grossShare}%` : "0%")}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="text-xs text-gray-500">Driver Type</div>
                                <div className="font-medium">{contract?.driverType || "Solo"}</div>
                            </div>

                            <Button
                                variant="link"
                                className="h-auto p-0 text-blue-600 font-normal text-sm"
                                onClick={() => setHistoryModalOpen(true)}
                            >
                                View Compensation History <span className="ml-1">→</span>
                            </Button>
                        </CardContent>
                    </Card>



                </div>

                {/* Right Column (1 span) - Summaries */}
                <div className="space-y-6">
                    {/* Assigned Equipment Section */}
                    {hasEquipment ? (
                        <AssignedEquipmentSection
                            driverId={localDriver.id}
                            onChangeAssignment={onAssignEquipment}
                            refreshKey={assignmentRefreshKey}
                            onAssignmentEnded={onAssignmentEnded}
                        />
                    ) : (
                        <EquipmentAssignmentCTA
                            driverId={localDriver.id}
                            onAssignClick={onAssignEquipment || (() => { })}
                        />
                    )}
                </div>
            </div>

            {/* Document Upload Modal */}
            {activeModal && (
                <DocumentUploadModal
                    open={!!activeModal}
                    onOpenChange={(open) => !open && setActiveModal(null)}
                    driverId={localDriver.id}
                    role={activeModal.role}
                    title={activeModal.title}
                    onUploadSuccess={refreshData}
                    existingDocuments={documents}
                />
            )}

            <ContractModal
                open={contractModalOpen}
                onOpenChange={setContractModalOpen}
                driverId={localDriver.id}
                existingContract={contract}
                onSuccess={() => {
                    // Refresh contracts
                    operatorsApi.getContracts(localDriver.id)
                        .then(contracts => {
                            const active = contracts.find(c => c.isActive) ||
                                contracts.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
                            setContract(active || null);
                        });
                }}
            />

            <ContractHistoryModal
                open={historyModalOpen}
                onOpenChange={setHistoryModalOpen}
                driverId={localDriver.id}
            />

            <PersonalDetailsModal
                open={personalDetailsModalOpen}
                onOpenChange={setPersonalDetailsModalOpen}
                driver={localDriver}
                onSuccess={refreshData}
            />
        </div>
    );
}

