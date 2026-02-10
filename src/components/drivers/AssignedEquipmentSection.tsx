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
import { AssignmentDto, DocumentRole } from "@/lib/types";
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
                    <div className="space-y-3">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/app/equipment/${assignment.equipmentId}`}
                                                className="font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                                            >
                                                {assignment.equipmentUnitNumber || 'Unknown Equipment'}
                                            </Link>
                                            {assignment.assignmentType === 'Primary' && (
                                                <Badge variant="default" className="bg-blue-600">Primary</Badge>
                                            )}
                                            {assignment.assignmentType === 'Temporary' && (
                                                <Badge variant="secondary">Temporary</Badge>
                                            )}
                                            {assignment.assignmentType === 'Team' && (
                                                <Badge variant="outline">Team</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>since {format(new Date(assignment.startAt), 'MMM d, yyyy')}</span>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEndAssignmentClick(assignment.id)}
                                >
                                    End Assignment
                                </Button>
                            </div>
                        ))}
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
