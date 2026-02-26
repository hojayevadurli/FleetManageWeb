import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import SupportTicketHistory from "@/components/SupportTicketHistory";

export default function SupportPage() {
    const [option, setOption] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/support/submit', {
                option,
                rating,
                title,
                description
            });
            setSubmitted(true);
            toast.success("Request submitted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSubmitted(false);
        setOption("");
        setRating(0);
        setTitle("");
        setDescription("");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8">
            <Tabs defaultValue="new" className="w-full max-w-2xl">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 font-bold transition-all">Submit Request</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 font-bold transition-all">My History</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="focus-visible:outline-none focus-visible:ring-0">
                    {submitted ? (
                        <Card className="w-full border-0 shadow-2xl bg-white/80 backdrop-blur-xl p-12 text-center ring-1 ring-slate-200 animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Success!</h2>
                            <p className="text-slate-500 mb-8 text-lg font-medium">
                                Your {option === "rate" ? "feedback" : "request"} has been submitted successfully. Our team will review it shortly.
                            </p>

                            <div className="p-4 bg-slate-50 rounded-xl mb-6 text-sm text-slate-500 border border-slate-100">
                                You can <button onClick={handleReset} className="text-blue-600 font-bold hover:underline">submit another request</button> here, or check your History tab.
                            </div>
                        </Card>
                    ) : (
                        <Card className="w-full border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4">
                            <CardContent className="p-8 space-y-8">
                                <div className="text-center space-y-2">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Report a bug or request a feature
                                    </h1>
                                    <p className="text-slate-400 font-medium text-sm">We appreciate your help in making FleetManage better.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">I would like to</label>
                                        <Select onValueChange={(val) => setOption(val)} value={option}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 font-medium focus:bg-white transition-colors">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bug">Report a bug</SelectItem>
                                                <SelectItem value="feature">Request a feature</SelectItem>
                                                <SelectItem value="rate">Rate experience</SelectItem>
                                                <SelectItem value="other">Other inquiry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Conditional Rendering */}
                                    {option === "rate" ? (
                                        <div className="space-y-4 py-4 animate-in fade-in slide-in-from-top-4">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1 block text-center">How was your experience?</label>
                                            <div className="flex justify-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        className={`p-2 transition-all hover:scale-110 active:scale-95 focus:outline-none ${rating >= star ? "text-yellow-400" : "text-slate-200 hover:text-yellow-200"
                                                            }`}
                                                    >
                                                        <Star className="w-10 h-10 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                            {rating > 0 && (
                                                <div className="text-center text-sm font-bold text-slate-600 animate-in fade-in">
                                                    {rating === 5 ? "Amazing! 🎉" :
                                                        rating === 4 ? "Good! 👍" :
                                                            rating === 3 ? "Okay. 😐" :
                                                                rating === 2 ? "Could be better. 😕" : " Terrible. 😭"}
                                                </div>
                                            )}

                                            <div className="space-y-2 mt-4">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Additional Comments (Optional)</label>
                                                <Textarea
                                                    placeholder="Tell us more about your experience..."
                                                    className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 resize-none focus:bg-white transition-colors"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Title</label>
                                                <Input
                                                    placeholder="Enter a title"
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 focus:bg-white transition-colors"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required={option !== ""}
                                                    disabled={!option}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Description</label>
                                                <Textarea
                                                    placeholder="Enter a description"
                                                    className="min-h-[150px] rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 resize-none focus:bg-white transition-colors"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    required={option !== ""}
                                                    disabled={!option}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={(e) => {
                                            if (!option) return toast.error("Please select an option");
                                            if (option !== "rate" && (!title || !description)) return toast.error("Please fill in all fields");
                                            if (option === "rate" && rating === 0) return toast.error("Please select a rating");
                                            handleSubmit(e as any);
                                        }}
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {loading ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history" className="focus-visible:outline-none focus-visible:ring-0">
                    <Card className="w-full border-0 shadow-2xl bg-white/50 backdrop-blur-xl ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <CardContent className="p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">My History</h2>
                                <p className="text-sm text-slate-500">Track the status of your previously submitted feature requests, bug reports, and feedback.</p>
                            </div>

                            <SupportTicketHistory />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
