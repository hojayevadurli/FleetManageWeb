import { useState } from "react";
import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Calendar, DollarSign, UserCheck, Clock, Award, AlertTriangle, Plus, Pencil, ChevronDown, ChevronUp, Save, X } from "lucide-react";

interface HRTabProps {
    driver: Driver;
}

interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'Hired' | 'Rate Change' | 'Promotion' | 'Disciplinary Action' | 'Suspension' | 'Termination' | 'Award' | 'Training Completed';
}

export function HRTab({ driver }: HRTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showCompHistory, setShowCompHistory] = useState(false);
    const [isAddingEvent, setIsAddingEvent] = useState(false); // State for dialog visibility

    const [events, setEvents] = useState<TimelineEvent[]>([
        {
            id: '1',
            date: 'Jan 15, 2023',
            title: 'Hired as OTR Driver',
            description: 'Completed orientation and road test successfully.',
            type: 'Hired'
        },
        {
            id: '2',
            date: 'Jun 01, 2024',
            title: 'Rate Increase',
            description: 'Rate increased from $0.60 to $0.65 CPM based on performance review.',
            type: 'Rate Change'
        }
    ]);

    const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
        date: new Date().toISOString().split('T')[0],
        type: 'Hired'
    });

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.description || !newEvent.date) return;

        const event: TimelineEvent = {
            id: Math.random().toString(36).substr(2, 9),
            date: newEvent.date || '',
            title: newEvent.title || '',
            description: newEvent.description || '',
            type: newEvent.type as any
        };

        setEvents([event, ...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setNewEvent({ date: new Date().toISOString().split('T')[0], type: 'Hired', title: '', description: '' });
        setIsAddingEvent(false);
    };

    // State for compensation history
    interface CompensationHistoryEntry {
        id: string;
        payModel: string;
        rate: string;
        frequency: string;
        effectiveDate: string;
        endDate?: string;
        reason?: string;
        changedBy: string;
        changedAt: string;
    }

    const [compHistory, setCompHistory] = useState<CompensationHistoryEntry[]>([
        {
            id: '1',
            payModel: 'CPM (Cents Per Mile)',
            rate: '0.65',
            frequency: 'Weekly',
            effectiveDate: '2024-06-01',
            changedBy: 'Admin',
            changedAt: '2024-06-01T09:00:00Z',
            reason: 'Annual Review'
        },
        {
            id: '2',
            payModel: 'CPM (Cents Per Mile)',
            rate: '0.60',
            frequency: 'Weekly',
            effectiveDate: '2023-01-15',
            endDate: '2024-05-31',
            changedBy: 'System',
            changedAt: '2023-01-15T08:00:00Z',
            reason: 'Hiring Rate'
        }
    ]);

    // Current displayed details (derived from latest history or separate state if needed)
    // We'll keep empDetails for the non-comp fields or simple display, but sync with history
    const [empDetails, setEmpDetails] = useState({
        type: "Full-Time (W2)",
        // The following are now controlled by compHistory[0] primarily, but we keep them for easy access
        payModel: compHistory[0].payModel,
        rate: compHistory[0].rate,
        frequency: compHistory[0].frequency
    });

    // Form state for editing
    const [editForm, setEditForm] = useState({
        type: empDetails.type,
        payModel: empDetails.payModel,
        rate: empDetails.rate,
        frequency: empDetails.frequency,
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: ""
    });

    const [mgmtDetails, setMgmtDetails] = useState({
        supervisor: "Alex Morgan",
        dispatcher: "Sarah Jenkins",
        terminal: driver.homeTerminal || "Not assigned"
    });

    const handleEditClick = () => {
        setEditForm({
            type: empDetails.type,
            payModel: empDetails.payModel,
            rate: empDetails.rate,
            frequency: empDetails.frequency,
            effectiveDate: new Date().toISOString().split('T')[0],
            reason: ""
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        // failed safeguard
        if (!editForm.effectiveDate) {
            alert("Effective date is required");
            return;
        }

        const hasCompChange =
            editForm.payModel !== empDetails.payModel ||
            editForm.rate !== empDetails.rate ||
            editForm.frequency !== empDetails.frequency;

        if (hasCompChange) {
            // Close current record
            let updatedHistory = [...compHistory];
            if (updatedHistory.length > 0) {
                const prevDate = new Date(editForm.effectiveDate);
                prevDate.setDate(prevDate.getDate() - 1);

                // Create a copy of the head item to avoid mutating state directly
                updatedHistory[0] = {
                    ...updatedHistory[0],
                    endDate: prevDate.toISOString().split('T')[0]
                };
            }

            // Create new record
            const newRecord: CompensationHistoryEntry = {
                id: Math.random().toString(36).substr(2, 9),
                payModel: editForm.payModel,
                rate: editForm.rate,
                frequency: editForm.frequency,
                effectiveDate: editForm.effectiveDate,
                reason: editForm.reason,
                changedBy: 'Current User', // Mocked
                changedAt: new Date().toISOString()
            };

            setCompHistory([newRecord, ...updatedHistory]);

            // Add timeline event
            const newTimelineEvent: TimelineEvent = {
                id: Math.random().toString(36).substr(2, 9),
                date: editForm.effectiveDate,
                title: 'Compensation Change',
                description: `Rate changed to $${editForm.rate} (${editForm.payModel}) - ${editForm.reason || 'No reason provided'}`,
                type: 'Rate Change'
            };
            setEvents([newTimelineEvent, ...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }

        // Update current details
        setEmpDetails({
            type: editForm.type,
            payModel: editForm.payModel,
            rate: editForm.rate,
            frequency: editForm.frequency
        });

        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    // Mock calculations for status summary
    const yearsWithCompany = 2.1;
    const lastReviewDate = "Jun 01, 2024";
    const status = driver.operatingStatus || "Active";

    return (
        <div className="space-y-6">
            {/* Status Summary Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Employment Status</p>
                        <p className="text-lg font-bold text-gray-900">{status}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Tenure</p>
                        <p className="text-lg font-bold text-gray-900">{yearsWithCompany} Years</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Last Review</p>
                        <p className="text-lg font-bold text-gray-900">{lastReviewDate}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="gap-2 text-gray-600"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditClick}
                        className="gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit HR Details
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                            Employment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Employment Type</span>
                            {isEditing ? (
                                <Select
                                    value={editForm.type}
                                    onValueChange={(val) => setEditForm({ ...editForm, type: val })}
                                >
                                    <SelectTrigger className="w-[180px] h-8">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-Time (W2)">Full-Time (W2)</SelectItem>
                                        <SelectItem value="Contractor (1099)">Contractor (1099)</SelectItem>
                                        <SelectItem value="Part-Time">Part-Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="font-semibold text-gray-900">{empDetails.type}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Pay Model</span>
                            {isEditing ? (
                                <Select
                                    value={editForm.payModel}
                                    onValueChange={(val) => setEditForm({ ...editForm, payModel: val })}
                                >
                                    <SelectTrigger className="w-[180px] h-8">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CPM (Cents Per Mile)">CPM</SelectItem>
                                        <SelectItem value="Hourly">Hourly</SelectItem>
                                        <SelectItem value="Percentage">Percentage</SelectItem>
                                        <SelectItem value="Flat Rate">Flat Rate</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="font-semibold text-gray-900">{empDetails.payModel}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 bg-emerald-50/50 -mx-4 px-4 min-h-[50px]">
                            <span className="text-gray-600 font-medium">Current Rate</span>
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-[180px]">
                                    <span className="text-gray-500 font-bold">$</span>
                                    <Input
                                        value={editForm.rate}
                                        onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                                        className="h-8 font-bold text-emerald-700"
                                    />
                                </div>
                            ) : (
                                <span className="text-xl font-extrabold text-emerald-700">${empDetails.rate} <span className="text-sm text-emerald-600 font-medium">/ mile</span></span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Pay Frequency</span>
                            {isEditing ? (
                                <Select
                                    value={editForm.frequency}
                                    onValueChange={(val) => setEditForm({ ...editForm, frequency: val })}
                                >
                                    <SelectTrigger className="w-[180px] h-8">
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <span className="font-semibold text-gray-900">{empDetails.frequency}</span>
                            )}
                        </div>

                        {/* New Fields for Compensation Change */}
                        {isEditing && (
                            <div className="bg-blue-50/50 p-3 rounded-md space-y-3 border border-blue-100 mt-2">
                                <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Compensation Change Details</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Effective Date *</Label>
                                        <Input
                                            type="date"
                                            value={editForm.effectiveDate}
                                            onChange={(e) => setEditForm({ ...editForm, effectiveDate: e.target.value })}
                                            className="h-8 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Reason / Notes</Label>
                                        <Input
                                            placeholder="e.g. Annual Review"
                                            value={editForm.reason}
                                            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                            className="h-8 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Compensation History */}
                        <div className="pt-2">
                            <div className="border-t border-gray-100 pt-3">
                                <button
                                    onClick={() => setShowCompHistory(!showCompHistory)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
                                >
                                    {showCompHistory ? "Hide" : "View"} Compensation History
                                    {showCompHistory ? (
                                        <ChevronUp className="h-3 w-3 group-hover:-translate-y-0.5 transition-transform" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3 group-hover:translate-y-0.5 transition-transform" />
                                    )}
                                </button>

                                {showCompHistory && (
                                    <div className="mt-3 space-y-4 pl-2 border-l-2 border-blue-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {compHistory.map((item, index) => (
                                            <div key={item.id} className="relative">
                                                <div className={`absolute -left-[13px] top-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{index === 0 ? 'Current' : 'Previous'}</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            ${item.rate} <span className="text-gray-500 font-normal">({item.payModel.split(' ')[0]})</span>
                                                        </p>
                                                    </div>
                                                    {item.reason && <Badge variant="outline" className="text-[10px] h-5">{item.reason}</Badge>}
                                                </div>

                                                <div className="flex flex-col gap-1 mt-1">
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-medium">Effective:</span> {item.effectiveDate}
                                                        {item.endDate && <span className="text-gray-400"> - {item.endDate}</span>}
                                                    </p>
                                                    {index === 0 && (
                                                        <p className="text-[10px] text-gray-400">
                                                            Last updated {new Date(item.changedAt).toLocaleDateString()} by {item.changedBy}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <UserCheck className="h-5 w-5 text-gray-500" />
                            Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Supervisor</span>
                            {isEditing ? (
                                <Input
                                    value={mgmtDetails.supervisor}
                                    onChange={(e) => setMgmtDetails({ ...mgmtDetails, supervisor: e.target.value })}
                                    className="w-[180px] h-8"
                                />
                            ) : (
                                <span className="font-semibold text-blue-600">{mgmtDetails.supervisor}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Dispatcher</span>
                            {isEditing ? (
                                <Input
                                    value={mgmtDetails.dispatcher}
                                    onChange={(e) => setMgmtDetails({ ...mgmtDetails, dispatcher: e.target.value })}
                                    className="w-[180px] h-8"
                                />
                            ) : (
                                <span className="font-semibold text-blue-600">{mgmtDetails.dispatcher}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 min-h-[45px]">
                            <span className="text-gray-500 font-medium">Branch / Terminal</span>
                            {isEditing ? (
                                <Input
                                    value={mgmtDetails.terminal}
                                    onChange={(e) => setMgmtDetails({ ...mgmtDetails, terminal: e.target.value })}
                                    className="w-[180px] h-8"
                                />
                            ) : (
                                <span className="font-semibold text-gray-900">{mgmtDetails.terminal}</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fleet Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200 bg-red-50/50">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                            Safety Score
                            <Award className="h-4 w-4 text-red-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-gray-900">88/100</div>
                        <p className="text-xs text-red-600 font-medium mt-1">Needs Attention</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                            Accidents (3Y)
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-gray-900">0</div>
                        <p className="text-xs text-green-600 font-medium mt-1">Clean Record</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                            Avg Miles/Mo
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-gray-900">9,240</div>
                        <p className="text-xs text-gray-500 mt-1">+12% vs Fleet Avg</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                            Overtime (YTD)
                            <Clock className="h-4 w-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-gray-900">14.5h</div>
                        <p className="text-xs text-gray-500 mt-1">Within limits</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-bold text-gray-800">Employment Timeline</CardTitle>
                    <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add Timeline Event</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">
                                        Date
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        className="col-span-3"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Event Type
                                    </Label>
                                    <Select
                                        value={newEvent.type}
                                        onValueChange={(val) => setNewEvent({ ...newEvent, type: val as any })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select event type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Hired">Hired</SelectItem>
                                            <SelectItem value="Rate Change">Rate Change</SelectItem>
                                            <SelectItem value="Promotion">Promotion</SelectItem>
                                            <SelectItem value="Disciplinary Action">Disciplinary Action</SelectItem>
                                            <SelectItem value="Suspension">Suspension</SelectItem>
                                            <SelectItem value="Termination">Termination</SelectItem>
                                            <SelectItem value="Award">Award</SelectItem>
                                            <SelectItem value="Training Completed">Training Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">
                                        Title
                                    </Label>
                                    <Input
                                        id="title"
                                        className="col-span-3"
                                        placeholder="e.g. Annual Performance Review"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        className="col-span-3"
                                        placeholder="Enter details..."
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>Cancel</Button>
                                <Button onClick={handleAddEvent}>Save Event</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-gray-200 ml-3 pl-8 pb-8 space-y-8">
                        {events.map((event) => (
                            <div key={event.id} className="relative group">
                                <div className={`absolute -left-[41px] h-5 w-5 rounded-full border-4 border-white shadow-sm group-hover:scale-110 transition-transform ${event.type === 'Hired' ? 'bg-green-500' :
                                    event.type === 'Termination' || event.type === 'Suspension' || event.type === 'Disciplinary Action' ? 'bg-red-500' :
                                        event.type === 'Award' ? 'bg-yellow-500' :
                                            'bg-blue-500'
                                    }`}></div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">{event.date}</p>
                                <h4 className="font-bold text-gray-900 text-base">{event.title}</h4>
                                <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                                <div className="mt-2">
                                    <Badge variant="secondary" className={`border-none ${event.type === 'Hired' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                        event.type === 'Termination' || event.type === 'Suspension' || event.type === 'Disciplinary Action' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                            event.type === 'Award' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                                'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}>
                                        {event.type}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
