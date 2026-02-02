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
import { Star, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SupportPage() {
    const [option, setOption] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitted, setSubmitted] = useState(false);

    // Mock submit handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, send data to backend here
        setSubmitted(true);
        toast.success("Request submitted successfully!");
    };

    const handleReset = () => {
        setSubmitted(false);
        setOption("");
        setRating(0);
        setTitle("");
        setDescription("");
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in zoom-in duration-300">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/50 backdrop-blur-xl p-8 text-center ring-1 ring-slate-200/50">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Success!</h2>
                    <p className="text-slate-500 mb-8">
                        Your {option === "rate" ? "feedback" : "request"} has been submitted successfully!
                    </p>

                    <div className="p-4 bg-slate-50 rounded-xl mb-6 text-sm text-slate-400">
                        You can <button onClick={handleReset} className="text-blue-600 font-bold hover:underline">submit another request</button> here.
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div className="flex justify-end w-full max-w-xl mb-2">
                {/* Close button placeholder if we were in a modal, redundant here but matching 'escapable' vibe */}
            </div>

            <Card className="w-full max-w-xl border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
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
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 font-medium">
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
                                        className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 resize-none"
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
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20"
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
                                        className="min-h-[150px] rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500/20 resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required={option !== ""}
                                        disabled={!option}
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            type="button" // Change to submit if we wire it up, but for now prevent default submission
                            onClick={(e) => {
                                // validation
                                if (!option) return toast.error("Please select an option");
                                if (option !== "rate" && (!title || !description)) return toast.error("Please fill in all fields");
                                if (option === "rate" && rating === 0) return toast.error("Please select a rating");

                                handleSubmit(e as any);
                            }}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Submit Request
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
