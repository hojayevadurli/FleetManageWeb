import { useState } from "react";
import { OperatorDto } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, AlertTriangle, Plus, AlertCircle, Briefcase, Stethoscope } from "lucide-react";
import { format, isSameDay, addDays } from "date-fns";

interface TimeOffTabProps {
    driver: OperatorDto;
}

type RequestStatus = "Approved" | "Pending" | "Rejected";
type RequestType = "Vacation" | "Sick" | "Personal" | "Unpaid";

interface TimeOffRequest {
    id: string;
    type: RequestType;
    startDate: Date;
    endDate: Date;
    status: RequestStatus;
    reason?: string;
    notes?: string;
    approvedBy?: string;
}

// Mock Data
const initialRequests: TimeOffRequest[] = [
    {
        id: "1",
        type: "Vacation",
        startDate: new Date(2024, 2, 12), // March 12
        endDate: new Date(2024, 2, 15), // March 15
        status: "Approved",
        reason: "Family trip",
        approvedBy: "Alex Morgan",
        notes: "Approved per policy."
    },
    {
        id: "2",
        type: "Sick",
        startDate: new Date(2024, 1, 10), // Feb 10
        endDate: new Date(2024, 1, 11), // Feb 11
        status: "Approved",
        reason: "Flu",
        approvedBy: "Alex Morgan"
    },
    {
        id: "3",
        type: "Personal",
        startDate: new Date(2024, 3, 5), // April 5
        endDate: new Date(2024, 3, 5), // April 5
        status: "Pending",
        reason: "Dentist appointment"
    }
];

export function TimeOffTab({ driver }: TimeOffTabProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [requests, setRequests] = useState<TimeOffRequest[]>(initialRequests);
    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Filter Logic for Selected Date
    const selectedDateRequest = date ? requests.find(req =>
        date >= req.startDate && date <= req.endDate
    ) : undefined;

    // Conflict Detection (Mock)
    // OperatorDto doesn't have assignedEquipment currently, assuming false for conflict
    const hasConflict = false; // selectedDateRequest?.status === "Pending" && driver.assignedEquipment;

    // Add Request Form State
    const [newRequestType, setNewRequestType] = useState<RequestType>("Vacation");
    const [newStartDate, setNewStartDate] = useState<string>("");
    const [newEndDate, setNewEndDate] = useState<string>("");
    const [newReason, setNewReason] = useState("");

    const handleAddRequest = () => {
        if (!newStartDate || !newEndDate) return;

        const newReq: TimeOffRequest = {
            id: Math.random().toString(36).substr(2, 9),
            type: newRequestType,
            startDate: new Date(newStartDate),
            endDate: new Date(newEndDate),
            status: "Pending",
            reason: newReason
        };

        setRequests([...requests, newReq]);
        setIsAddDialogOpen(false);
        // Reset form
        setNewStartDate("");
        setNewEndDate("");
        setNewReason("");
    };

    const handleStatusChange = (id: string, newStatus: RequestStatus) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    // Calendar Modifiers
    const modifiers = {
        approved: (date: Date) => requests.some(req => req.status === "Approved" && date >= req.startDate && date <= req.endDate),
        pending: (date: Date) => requests.some(req => req.status === "Pending" && date >= req.startDate && date <= req.endDate),
        rejected: (date: Date) => requests.some(req => req.status === "Rejected" && date >= req.startDate && date <= req.endDate),
        sick: (date: Date) => requests.some(req => req.status === "Approved" && req.type === "Sick" && date >= req.startDate && date <= req.endDate),
    };

    const modifiersStyles = {
        approved: { backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: "bold" }, // Blue
        pending: { backgroundColor: "#fef9c3", color: "#854d0e", fontWeight: "bold" }, // Yellow
        rejected: { backgroundColor: "#fee2e2", color: "#991b1b", textDecoration: "line-through" }, // Red
        sick: { backgroundColor: "#f3e8ff", color: "#6b21a8", fontWeight: "bold" }, // Purple
    };

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Vacation Used</p>
                            <p className="text-2xl font-bold text-gray-900">8 <span className="text-sm font-normal text-gray-400">/ 14 days</span></p>
                        </div>
                        <Briefcase className="h-8 w-8 text-blue-100 text-blue-600" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Sick Days Used</p>
                            <p className="text-2xl font-bold text-gray-900">2 <span className="text-sm font-normal text-gray-400">/ 5 days</span></p>
                        </div>
                        <Stethoscope className="h-8 w-8 text-purple-100 text-purple-600" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                            <p className="text-2xl font-bold text-amber-600">1</p>
                        </div>
                        <Clock className="h-8 w-8 text-amber-100 text-amber-600" />
                    </CardContent>
                </Card>
                <Card className="flex items-center justify-center bg-gray-50 border-dashed cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsAddDialogOpen(true)}>
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                        <Plus className="h-6 w-6 text-gray-500" />
                        <span className="font-medium text-gray-600">New Request</span>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Calendar Section (Left 70%) */}
                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Availability Calendar</CardTitle>
                            <CardDescription>View and manage driver schedule.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 bg-blue-100 rounded-full"></div> Approved</span>
                            <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 bg-yellow-100 rounded-full"></div> Pending</span>
                            <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 bg-purple-100 rounded-full"></div> Sick</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-center p-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border shadow-sm w-full max-w-md"
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                        />
                    </CardContent>
                </Card>

                {/* Side Panel (Right 30%) */}
                <Card className="w-full md:w-[350px]">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateRequest ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <Badge className={`px-3 py-1 text-sm ${selectedDateRequest.status === "Approved" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                            selectedDateRequest.status === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                                "bg-red-100 text-red-800 hover:bg-red-100"
                                            }`}>
                                            {selectedDateRequest.status}
                                        </Badge>
                                        <span className="text-sm font-medium text-gray-500">{selectedDateRequest.type}</span>
                                    </div>
                                </div>

                                {selectedDateRequest.reason && (
                                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                                        <p className="font-semibold text-gray-900 mb-1">Reason:</p>
                                        "{selectedDateRequest.reason}"
                                    </div>
                                )}

                                {hasConflict && (
                                    <div className="bg-red-50 border border-red-200 p-3 rounded-md flex gap-2 items-start">
                                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                        <div className="text-xs text-red-800">
                                            <span className="font-bold">Conflict Warning:</span> Driver is assigned to Unit {"105"} during these dates. Reassign truck before approving.
                                        </div>
                                    </div>
                                )}

                                {selectedDateRequest.status === "Pending" && (
                                    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusChange(selectedDateRequest.id, "Rejected")}>
                                            Reject
                                        </Button>
                                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange(selectedDateRequest.id, "Approved")}>
                                            Approve
                                        </Button>
                                    </div>
                                )}

                                {selectedDateRequest.status === "Approved" && (
                                    <div className="text-xs text-gray-500 pt-2 border-t">
                                        Approved by {selectedDateRequest.approvedBy}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No events for this date.</p>
                                <p className="text-xs mt-1">Driver is available.</p>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Request
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Request Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Time Off Request</DialogTitle>
                        <DialogDescription>
                            Submit a new time-off request for {driver.firstName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select value={newRequestType} onValueChange={(v: RequestType) => setNewRequestType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Vacation">Vacation</SelectItem>
                                        <SelectItem value="Sick">Sick Leave</SelectItem>
                                        <SelectItem value="Personal">Personal</SelectItem>
                                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>End Date</Label>
                                <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason</Label>
                            <Textarea placeholder="e.g. Family vacation" value={newReason} onChange={(e) => setNewReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRequest}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
