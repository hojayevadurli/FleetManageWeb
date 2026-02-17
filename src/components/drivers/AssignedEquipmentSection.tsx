import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { operatorsApi } from "@/lib/operatorsApi";
import equipmentApi from "@/lib/equipmentApi";
import { AssignmentDto, DocumentRole, Equipment } from "@/lib/types";
import { Truck, Calendar, AlertCircle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AssignmentMediaUpload } from "./AssignmentMediaUpload";
import { uploadDocument } from "@/lib/documentsService";
import { AssignmentAttachmentViewer } from "./AssignmentAttachmentViewer";

interface AssignedEquipmentSectionProps {
    driverId: string;
    onChangeAssignment?: () => void;
    refreshKey?: number; // Add this to trigger refresh
    onAssignmentEnded?: () => void; // Callback when assignment is ended
}

export function AssignedEquipmentSection({ driverId, onChangeAssignment, refreshKey, onAssignmentEnded }: AssignedEquipmentSectionProps) {
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
    const [pastAssignments, setPastAssignments] = useState<AssignmentDto[]>([]);
    const [equipmentDetails, setEquipmentDetails] = useState<Record<string, Equipment>>({});
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    // End assignment dialog state
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [endingAssignment, setEndingAssignment] = useState(false);
    const [endPhotos, setEndPhotos] = useState<File[]>([]);

    // Delete assignment dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<string>("");
    const [deletingAssignment, setDeletingAssignment] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, [driverId, refreshKey]); // Add refreshKey to dependencies

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await operatorsApi.getAssignments(driverId);
            console.log('Assignment data received:', data); // Debug log
            // Separate active and past assignments
            setAssignments(data.filter(a => !a.endAt));
            setPastAssignments(data.filter(a => a.endAt).sort((a, b) =>
                new Date(b.endAt!).getTime() - new Date(a.endAt!).getTime()
            )); // Sort by most recent end date first

            // Fetch detailed equipment info for all assignments
            const uniqueIds = Array.from(new Set(data.map(a => a.equipmentId)));
            const detailsMap: Record<string, Equipment> = {};

            await Promise.all(uniqueIds.map(async (id) => {
                const eq = await equipmentApi.get(id);
                if (eq) detailsMap[id] = eq;
            }));

            setEquipmentDetails(detailsMap);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
            toast({ title: "Error", description: "Failed to load equipment assignments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleEndAssignmentClick = (assignmentId: string) => {
        setSelectedAssignmentId(assignmentId);
        setEndDate(new Date().toISOString().split('T')[0]); // Default to today
        setShowEndDialog(true);
    };

    const handleConfirmEndAssignment = async () => {
        if (!selectedAssignmentId) return;

        setEndingAssignment(true);
        try {
            // Step 1: Upload end photos/videos if any
            let endPhotoIds: string[] = [];
            if (endPhotos.length > 0) {
                toast({ title: "Uploading files...", description: `Uploading ${endPhotos.length} file(s)` });

                const uploadPromises = endPhotos.map(async (file) => {
                    const doc = await uploadDocument(file, 'assignment');
                    return doc.id;
                });

                endPhotoIds = await Promise.all(uploadPromises);
            }

            // Step 2: End assignment with photo IDs
            await operatorsApi.endAssignment(driverId, selectedAssignmentId, {
                endAt: new Date(endDate).toISOString(),
                endPhotoIds: endPhotoIds.length > 0 ? endPhotoIds : undefined
            });

            toast({ title: "Success", description: "Assignment ended successfully" });
            fetchAssignments(); // Refresh the list
            setShowEndDialog(false);
            setEndPhotos([]); // Clear photos
            if (onAssignmentEnded) {
                onAssignmentEnded(); // Notify parent to update hasEquipment state
            }
        } catch (error) {
            console.error("Failed to end assignment", error);
            toast({ title: "Error", description: "Failed to end assignment", variant: "destructive" });
        } finally {
            setEndingAssignment(false);
        }
    };

    const handleDeleteClick = (assignmentId: string) => {
        setAssignmentToDelete(assignmentId);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!assignmentToDelete) return;

        setDeletingAssignment(true);
        try {
            await operatorsApi.deleteAssignment(driverId, assignmentToDelete);
            toast({ title: "Success", description: "Assignment deleted successfully" });
            fetchAssignments(); // Refresh the list
            setShowDeleteDialog(false);
            setAssignmentToDelete("");
        } catch (error) {
            console.error("Failed to delete assignment", error);
            toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" });
        } finally {
            setDeletingAssignment(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Assigned Equipment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-500">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    // Don't show the card if there are no assignments at all (neither active nor past)
    if (assignments.length === 0 && pastAssignments.length === 0) {
        return null; // CTA will show instead
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assigned Equipment
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Active Assignments */}
                {assignments.length > 0 && (
                    <div className="space-y-4">
                        {assignments.map((assignment) => {
                            const details = equipmentDetails[assignment.equipmentId];
                            return (
                                <div
                                    key={assignment.id}
                                    className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    {/* Header with Type and Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                                                {assignment.equipmentType || (details?.type || 'Asset')}
                                            </Badge>
                                            {assignment.assignmentType !== 'Primary' && (
                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                    {assignment.assignmentType}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                                            onClick={() => handleEndAssignmentClick(assignment.id)}
                                        >
                                            End
                                        </Button>
                                    </div>

                                    {/* Main Asset Info */}
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white p-2 rounded border border-gray-200 shadow-sm mt-1">
                                            <Truck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <Link
                                                to={`/app/equipment/${assignment.equipmentId}`}
                                                className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors block"
                                            >
                                                {assignment.equipmentUnitNumber || 'Unknown'}
                                            </Link>

                                            {/* Rich Details */}
                                            {details && (
                                                <div className="text-sm font-medium text-gray-700 mt-0.5">
                                                    {details.year} {details.make} {details.model}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                                                {details?.vin && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold text-gray-400">VIN:</span>
                                                        <span className="font-mono text-gray-600 select-all">{details.vin}</span>
                                                    </div>
                                                )}
                                                {details?.licensePlate && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold text-gray-400">Plate:</span>
                                                        <span className="font-mono text-gray-600">{details.licensePlate}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                                <Calendar className="h-3 w-3" />
                                                <span>Assigned: {format(new Date(assignment.startAt), 'MMM d, yyyy')}</span>
                                            </div>

                                            {assignment.notes && (
                                                <div className="flex items-center gap-1 text-xs text-yellow-600 mt-2 bg-yellow-50 px-2 py-1 rounded">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span>{assignment.notes}</span>
                                                </div>
                                            )}

                                            {/* Display attachments */}
                                            <div className="mt-2">
                                                <AssignmentAttachmentViewer
                                                    startAttachments={assignment.startAttachments}
                                                    endAttachments={assignment.endAttachments}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Assign More Equipment Button */}
                {assignments.length > 0 && onChangeAssignment && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={onChangeAssignment}
                    >
                        Assign More Equipment
                    </Button>
                )}

                {/* Assignment History */}
                {pastAssignments.length > 0 && (
                    <div className={`mt-4 ${assignments.length > 0 ? 'pt-4 border-t border-gray-200' : ''}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-between text-gray-600 hover:text-gray-900"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <span className="text-sm font-medium">Assignment History ({pastAssignments.length})</span>
                            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {showHistory && (
                            <div className="space-y-2 mt-3">
                                {pastAssignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 opacity-75"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-200 p-2 rounded">
                                                <Truck className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/app/equipment/${assignment.equipmentId}`}
                                                        className="font-medium text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                                                    >
                                                        {assignment.equipmentUnitNumber || 'Unknown Equipment'}
                                                    </Link>
                                                    {assignment.assignmentType === 'Primary' && (
                                                        <Badge variant="outline" className="text-xs">Primary</Badge>
                                                    )}
                                                    {assignment.assignmentType === 'Temporary' && (
                                                        <Badge variant="outline" className="text-xs">Temporary</Badge>
                                                    )}
                                                    {assignment.assignmentType === 'Team' && (
                                                        <Badge variant="outline" className="text-xs">Team</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {format(new Date(assignment.startAt), 'MMM d, yyyy')} - {format(new Date(assignment.endAt!), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                {assignment.notes && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        <span>{assignment.notes}</span>
                                                    </div>
                                                )}
                                                {/* Display attachments */}
                                                <AssignmentAttachmentViewer
                                                    startAttachments={assignment.startAttachments}
                                                    endAttachments={assignment.endAttachments}
                                                />
                                            </div>
                                        </div>
                                        {/* Delete button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(assignment.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {/* End Assignment Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>End Equipment Assignment</DialogTitle>
                        <DialogDescription>
                            Specify the date when this assignment ended.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]} // Can't end in the future
                            />
                        </div>

                        {/* Photo/Video Upload for End Assignment */}
                        <AssignmentMediaUpload
                            label="Attach End Condition Photos/Videos (optional)"
                            selectedFiles={endPhotos}
                            onFilesSelected={setEndPhotos}
                            onRemoveFile={(index) => {
                                setEndPhotos(prev => prev.filter((_, i) => i !== index));
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEndDialog(false)} disabled={endingAssignment}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmEndAssignment} disabled={endingAssignment || !endDate}>
                            {endingAssignment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            End Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Assignment Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this assignment? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingAssignment}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deletingAssignment}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deletingAssignment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
