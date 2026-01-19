import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from 'lucide-react';
import { shopsApi } from '@/lib/shopsApi';
import { useToast } from '@/hooks/use-toast';

interface ReviewContext {
    workOrderId: string;
    workOrderNumber: string;
    serviceDate: string;
    totalCost: number;
    assetName: string;
}

interface WriteReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shopId: string;
    shopName: string;
    onReviewSubmitted: () => void;
    context?: ReviewContext;
}

const WriteReviewDialog = ({
    open,
    onOpenChange,
    shopId,
    shopName,
    onReviewSubmitted,
    context
}: WriteReviewDialogProps) => {
    const { toast } = useToast();

    // Detailed Ratings
    const [qualityRating, setQualityRating] = useState(0);
    const [timelinessRating, setTimelinessRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);

    const [comment, setComment] = useState("");
    const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate overall rating average if all 4 are set, otherwise 0
    // Or we can let user set overall separately. 
    // The design implies 1 main rating, plus categories.
    // Let's keep a main rating state for the big stars.
    const [mainRating, setMainRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async () => {
        if (mainRating === 0) {
            toast({
                title: "Rating required",
                description: "Please select an overall star rating.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await shopsApi.createRating(shopId, {
                rating: mainRating,
                reviewText: comment,
                serviceDate: context?.serviceDate,
                workOrderId: context?.workOrderId,
                qualityRating,
                timelinessRating,
                communicationRating,
                valueRating,
                wouldRecommend: wouldRecommend === true
            });
            toast({
                title: "Review submitted",
                description: "Thank you for your feedback!"
            });
            onReviewSubmitted();
            onOpenChange(false);
            // Reset form
            setMainRating(0);
            setQualityRating(0);
            setTimelinessRating(0);
            setCommunicationRating(0);
            setValueRating(0);
            setComment("");
            setWouldRecommend(null);
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast({
                title: "Submission failed",
                description: "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const CategoryRating = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="focus:outline-none"
                    >
                        <Star className={`w-4 h-4 ${star <= value ? "fill-blue-400 text-blue-400" : "text-slate-200"}`} />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Rate Your Service Experience</DialogTitle>
                    <DialogDescription>
                        {context ? (
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-black tracking-wider text-slate-400">Shop</span>
                                    <span className="font-bold text-slate-900">{shopName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-black tracking-wider text-slate-400">Work Order</span>
                                    <span className="font-bold text-slate-900">{context.workOrderNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-black tracking-wider text-slate-400">Date</span>
                                    <span className="font-bold text-slate-900">{context.serviceDate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase font-black tracking-wider text-slate-400">Total</span>
                                    <span className="font-bold text-slate-900 font-mono">${context.totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <span>Share your experience with <strong>{shopName}</strong>.</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-8">
                    {/* Main Rating */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Overall Rating</div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setMainRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoverRating || mainRating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-200"
                                            } transition-colors duration-200`}
                                    />
                                </button>
                            ))}
                        </div>
                        {mainRating > 0 && (
                            <div className="text-amber-600 font-bold text-sm">
                                {mainRating === 5 ? "Excellent" : mainRating === 4 ? "Good" : mainRating === 3 ? "Average" : mainRating === 2 ? "Poor" : "Terrible"}
                            </div>
                        )}
                    </div>

                    {/* Detailed Categories */}
                    <div className="space-y-3 px-4">
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Review Categories</div>
                        <CategoryRating label="Quality of Work" value={qualityRating} onChange={setQualityRating} />
                        <CategoryRating label="Timeliness" value={timelinessRating} onChange={setTimelinessRating} />
                        <CategoryRating label="Communication" value={communicationRating} onChange={setCommunicationRating} />
                        <CategoryRating label="Price / Value" value={valueRating} onChange={setValueRating} />
                    </div>

                    {/* Would Recommend? */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                        <span className="text-sm font-bold text-slate-700">Would you recommend this shop?</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setWouldRecommend(true)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${wouldRecommend === true ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-400 border-slate-200 hover:border-green-200 hover:text-green-600'}`}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setWouldRecommend(false)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${wouldRecommend === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-200 hover:text-rose-600'}`}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="comment" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Written Review (Optional)
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us about the service, speed, and quality..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none min-h-[100px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="rounded-xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting
                            </>
                        ) : (
                            "Submit Review"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WriteReviewDialog;
