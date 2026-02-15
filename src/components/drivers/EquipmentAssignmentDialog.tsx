import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { equipmentApi } from "@/lib/equipmentApi";
import { operatorsApi } from "@/lib/operatorsApi";
import { EquipmentDto, DocumentRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AssignmentMediaUpload } from "./AssignmentMediaUpload";
import { uploadDocument } from "@/lib/documentsService";

interface EquipmentAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driverId: string;
    driverName: string;
    onAssignmentComplete: () => void;
}

export function EquipmentAssignmentDialog({
    open,
    onOpenChange,
    driverId,
    driverName,
    onAssignmentComplete
}: EquipmentAssignmentDialogProps) {
    const { toast } = useToast();
    const [equipment, setEquipment] = useState<EquipmentDto[]>([]);
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [assignmentType, setAssignmentType] = useState<'Primary' | 'Temporary' | 'Team'>('Primary');
    const [notes, setNotes] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");

    // Fetch equipment list
    useEffect(() => {
        if (open) {
            setLoadingEquipment(true);
            equipmentApi.list()
                .then(data => setEquipment(data))
                .catch(err => {
                    console.error("Failed to fetch equipment", err);
                    toast({ title: "Error", description: "Failed to load equipment list", variant: "destructive" });
                })
                .finally(() => setLoadingEquipment(false));
        }
    }, [open, toast]);

    const handleAssign = async (forceAssign = false) => {
        if (!selectedEquipmentId) {
            toast({ title: "Validation Error", description: "Please select equipment", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            // Step 1: Upload photos/videos if any
            let startPhotoIds: string[] = [];
            if (selectedFiles.length > 0) {
                toast({ title: "Uploading files...", description: `Uploading ${selectedFiles.length} file(s)` });

                const uploadPromises = selectedFiles.map(async (file) => {
                    const doc = await uploadDocument(file, 'assignment');
                    return doc.id;
                });

                startPhotoIds = await Promise.all(uploadPromises);
            }

            // Step 2: Call assignment API with photo IDs
            await operatorsApi.assignEquipment(driverId, {
                equipmentId: selectedEquipmentId,
                startAt: new Date(startDate).toISOString(),
                assignmentType: assignmentType,
                notes: notes || undefined,
                startPhotoIds: startPhotoIds.length > 0 ? startPhotoIds : undefined
            });

            toast({
                title: "Success",
                description: `Equipment assigned to ${driverName} successfully!`
            });

            onAssignmentComplete();
            onOpenChange(false);
            resetForm();
        } catch (error: any) {
            console.error("Failed to assign equipment", error);

            // Check if it's a conflict error
            if (error.response?.status === 409) {
                setConflictMessage(error.response.data.message || "This equipment already has an active driver.");
                setShowConflictDialog(true);
            } else {
                toast({
                    title: "Error",
                    description: error.response?.data?.message || error.message || "Failed to assign equipment",
                    variant: "destructive"
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedEquipmentId("");
        setStartDate(new Date().toISOString().split('T')[0]);
        setAssignmentType('Primary');
        setNotes("");
        setSelectedFiles([]);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Equipment</DialogTitle>
                        <DialogDescription>
                            Assign a truck or trailer to {driverName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Equipment Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="equipment">Equipment <span className="text-red-500">*</span></Label>
                            {loadingEquipment ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading equipment...
                                </div>
                            ) : (
                                <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {equipment.map(eq => (
                                            <SelectItem key={eq.id} value={eq.id}>
                                                {eq.equipmentTypeName} #{eq.unitNumber} - {eq.make} {eq.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Assignment Start Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* Assignment Type */}
                        <div className="space-y-2">
                            <Label htmlFor="assignmentType">Assignment Type <span className="text-red-500">*</span></Label>
                            <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as 'Primary' | 'Temporary' | 'Team')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select assignment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Primary">Primary Driver</SelectItem>
                                    <SelectItem value="Temporary">Temporary Assignment</SelectItem>
                                    <SelectItem value="Team">Team Driver</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any additional notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Photo/Video Upload */}
                        <AssignmentMediaUpload
                            label="Attach Photos/Videos (optional)"
                            selectedFiles={selectedFiles}
                            onFilesSelected={setSelectedFiles}
                            onRemoveFile={(index) => {
                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleAssign()} disabled={submitting || !selectedEquipmentId}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Conflict Warning Dialog */}
            <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Equipment Already Assigned</AlertDialogTitle>
                        <AlertDialogDescription>
                            {conflictMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAssign(true)}>
                            Assign Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
