import { useState } from "react";
import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Star,
    MessageSquare,
    ThumbsUp,
    AlertCircle,
    TrendingUp,
    Filter,
    List,
    GitCommitVertical,
    CheckCircle2,
    AlertTriangle,
    XCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface PerformanceTabProps {
    driver: Driver;
}

type NoteType = "Praise" | "Performance" | "Safety" | "Compliance";
type SeverityLevel = "Minor" | "Moderate" | "Major";

interface PerformanceNote {
    id: string;
    type: NoteType;
    title: string;
    description: string;
    date: string;
    loggedBy: string;
    severity?: SeverityLevel;
    isResolved?: boolean;
    resolvedDate?: string;
}

const initialNotes: PerformanceNote[] = [
    {
        id: "1",
        type: "Praise",
        title: "Exceptional Service",
        description: "Customer specifically mentioned driver for being polite and helping with the unload at the Georgia facility. Great job representing the company.",
        date: "2026-01-15",
        loggedBy: "Dispatch",
        severity: "Minor"
    },
    {
        id: "2",
        type: "Performance",
        title: "Late Arrival",
        description: "Arrived 2 hours late to pickup without proactive communication. Discussed with driver about calling ahead.",
        date: "2025-12-02",
        loggedBy: "Safety Mgr",
        severity: "Moderate",
        isResolved: true,
        resolvedDate: "2025-12-05"
    },
    {
        id: "3",
        type: "Safety",
        title: "Hard Braking Event",
        description: "Triggered harsh braking alert on I-95. Review of dashcam showed defensive driving to avoid cut-off, but following distance was close.",
        date: "2025-11-20",
        loggedBy: "Safety Mgr",
        severity: "Moderate",
        isResolved: false
    },
    {
        id: "4",
        type: "Compliance",
        title: "Missing Log Signature",
        description: "Failed to sign logs for 2 consecutive days. Training provided on ELD device.",
        date: "2025-10-15",
        loggedBy: "Compliance",
        severity: "Minor",
        isResolved: true,
        resolvedDate: "2025-10-16"
    }
];

export function PerformanceTab({ driver }: PerformanceTabProps) {
    const [notes, setNotes] = useState<PerformanceNote[]>(initialNotes);
    const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
    const [filterType, setFilterType] = useState<string>("all");

    // Add Note Modal State
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [newNoteType, setNewNoteType] = useState<NoteType>("Performance");
    const [newNoteSeverity, setNewNoteSeverity] = useState<SeverityLevel>("Minor");
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteDescription, setNewNoteDescription] = useState("");
    const [isFollowUpRequired, setIsFollowUpRequired] = useState(false);

    const handleSaveNote = () => {
        if (!newNoteTitle || !newNoteDescription) return;

        setIsSaving(true);

        // Simulate API call
        setTimeout(() => {
            const newNote: PerformanceNote = {
                id: Math.random().toString(36).substr(2, 9),
                type: newNoteType,
                title: newNoteTitle,
                description: newNoteDescription,
                date: new Date().toISOString().split('T')[0],
                loggedBy: "Current User", // Mocked user
                severity: newNoteType !== "Praise" ? newNoteSeverity : undefined,
                isResolved: !isFollowUpRequired,
                resolvedDate: !isFollowUpRequired ? new Date().toISOString().split('T')[0] : undefined
            };

            setNotes([newNote, ...notes]);
            setIsSaving(false);
            setIsAddNoteOpen(false);

            // Reset form
            setNewNoteType("Performance");
            setNewNoteSeverity("Minor");
            setNewNoteTitle("");
            setNewNoteDescription("");
            setIsFollowUpRequired(false);
        }, 1000);
    };

    // Filter Logic
    const filteredNotes = notes.filter(note => {
        if (filterType === "all") return true;
        return note.type === filterType;
    });

    const getSeverityColor = (severity?: SeverityLevel) => {
        switch (severity) {
            case "Major": return "border-l-red-500 bg-red-50";
            case "Moderate": return "border-l-amber-500";
            default: return "border-l-blue-500"; // Minor or Praise usually blue/green
        }
    };

    const getTypeIcon = (type: NoteType) => {
        switch (type) {
            case "Praise": return <ThumbsUp className="h-5 w-5 text-blue-600" />;
            case "Safety": return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case "Compliance": return <CheckCircle2 className="h-5 w-5 text-purple-600" />;
            default: return <AlertCircle className="h-5 w-5 text-amber-600" />;
        }
    };

    const getTypeColor = (type: NoteType) => {
        switch (type) {
            case "Praise": return "bg-blue-100 text-blue-700";
            case "Safety": return "bg-red-100 text-red-700";
            case "Compliance": return "bg-purple-100 text-purple-700";
            default: return "bg-amber-100 text-amber-700";
        }
    };

    // Stats (Mocked based on notes for now, but could be real data)
    const performanceScore = 82;
    const onTimePct = 94;
    const feedbackCount = 5;
    const safetyIncidents = 0;

    return (
        <div className="space-y-6">
            {/* 1. Performance Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1 bg-slate-900 text-white border-none">
                    <CardContent className="p-6 flex flex-col justify-center h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-medium text-sm">Performance Score</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-0">
                                <TrendingUp className="h-3 w-3 mr-1" /> +4
                            </Badge>
                        </div>
                        <div className="text-4xl font-bold mb-1">{performanceScore}<span className="text-xl text-slate-500 font-normal">/100</span></div>
                        <Progress value={performanceScore} className="h-2 bg-slate-700" />
                        <p className="text-xs text-slate-400 mt-2">Top 15% of fleet</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-8 h-full items-center">
                            <div className="text-center md:text-left">
                                <p className="text-sm text-gray-500 font-medium">On-Time %</p>
                                <p className="text-2xl font-bold text-gray-900">{onTimePct}%</p>
                                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                    <CheckCircle2 className="h-3 w-3" /> Target met
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-sm text-gray-500 font-medium">Customer Feedback</p>
                                <p className="text-2xl font-bold text-gray-900">{feedbackCount}</p>
                                <p className="text-xs text-gray-400 mt-1">Positive notes YTD</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-sm text-gray-500 font-medium">Safety Incidents</p>
                                <p className="text-2xl font-bold text-gray-900">{safetyIncidents}</p>
                                <p className="text-xs text-gray-400 mt-1">Zero accidents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Controls & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2 text-gray-500" />
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Praise">Praise</SelectItem>
                            <SelectItem value="Performance">Performance</SelectItem>
                            <SelectItem value="Safety">Safety</SelectItem>
                            <SelectItem value="Compliance">Compliance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "timeline")} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="list" className="px-3"><List className="h-4 w-4" /></TabsTrigger>
                            <TabsTrigger value="timeline" className="px-3"><GitCommitVertical className="h-4 w-4" /></TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <MessageSquare className="h-4 w-4" /> Add Note
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Performance Note</DialogTitle>
                                <DialogDescription>
                                    Log a new performance event for {driver.firstName}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Type</Label>
                                        <Select value={newNoteType} onValueChange={(v: NoteType) => setNewNoteType(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Praise">Praise</SelectItem>
                                                <SelectItem value="Performance">Performance</SelectItem>
                                                <SelectItem value="Safety">Safety</SelectItem>
                                                <SelectItem value="Compliance">Compliance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {newNoteType !== "Praise" && (
                                        <div className="grid gap-2">
                                            <Label>Severity</Label>
                                            <Select value={newNoteSeverity} onValueChange={(v: SeverityLevel) => setNewNoteSeverity(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Minor">Minor</SelectItem>
                                                    <SelectItem value="Moderate">Moderate</SelectItem>
                                                    <SelectItem value="Major">Major</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input placeholder="Short title (e.g. Late Arrival)" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea placeholder="Detailed description of the event..." value={newNoteDescription} onChange={(e) => setNewNoteDescription(e.target.value)} />
                                </div>
                                {newNoteType !== "Praise" && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="followUp" checked={isFollowUpRequired} onCheckedChange={(c) => setIsFollowUpRequired(c as boolean)} />
                                        <Label htmlFor="followUp">Follow-up required?</Label>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveNote} disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Note"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 3. Notes List / Timeline */}
            <div className="space-y-4">
                {viewMode === "list" ? (
                    filteredNotes.map(note => (
                        <Card key={note.id} className={`border-l-4 ${getSeverityColor(note.severity)}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(note.type).split(" ")[0]}`}>
                                        {getTypeIcon(note.type)}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">{note.title}</h4>
                                                <Badge variant="secondary" className={`${getTypeColor(note.type)}`}>{note.type}</Badge>
                                                {note.severity && note.type !== "Praise" && (
                                                    <Badge variant="outline" className="text-xs uppercase px-1.5 py-0 h-5 border-gray-300 text-gray-500">
                                                        {note.severity}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">{note.date}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {note.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-400 font-medium">Logged by: <span className="text-gray-600">{note.loggedBy}</span></p>

                                            {note.type !== "Praise" && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium flex items-center gap-1 ${note.isResolved ? "text-green-600" : "text-amber-600"}`}>
                                                        {note.isResolved ? (
                                                            <><CheckCircle2 className="h-3 w-3" /> Resolved ({note.resolvedDate})</>
                                                        ) : (
                                                            <><AlertCircle className="h-3 w-3" /> Follow-up Required</>
                                                        )}
                                                    </span>
                                                    {!note.isResolved && (
                                                        <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2">
                                                            Mark Resolved
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 ml-4 py-2">
                        {filteredNotes.map(note => (
                            <div key={note.id} className="relative">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[41px] top-1 h-6 w-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${getTypeColor(note.type)}`}>
                                    {/* Simple dot or small icon */}
                                    <div className="h-2 w-2 bg-current rounded-full" />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{note.title}</h4>
                                    <span className="text-xs text-gray-400">{note.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {note.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
