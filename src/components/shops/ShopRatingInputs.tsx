import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

export interface ShopRatingData {
    mainRating: number;
    qualityRating: number;
    timelinessRating: number;
    communicationRating: number;
    valueRating: number;
    wouldRecommend: boolean | null;
    comment: string;
}

interface ShopRatingInputsProps {
    data: ShopRatingData;
    onChange: (data: ShopRatingData) => void;
    showComment?: boolean;
    variant?: 'default' | 'compact';
}

const ShopRatingInputs = ({ data, onChange, showComment = true, variant = 'default' }: ShopRatingInputsProps) => {
    const [hoverRating, setHoverRating] = useState(0);

    const update = (field: keyof ShopRatingData, value: any) => {
        onChange({ ...data, [field]: value });
    };

    const ratingLabels: Record<number, string> = {
        1: "Terrible",
        2: "Poor",
        3: "Average",
        4: "Good",
        5: "Excellent"
    };

    const CategoryRating = ({ label, icon, value, field }: { label: string, icon: string, value: number, field: keyof ShopRatingData }) => (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => update(field, star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star className={`w-5 h-5 ${star <= value ? "fill-blue-400 text-blue-400" : "text-slate-200"}`} />
                    </button>
                ))}
            </div>
        </div>
    );

    if (variant === 'compact') {
        return (
            <div className="space-y-4">
                {/* Compact Rating: Question + Stars */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">How was your experience?</label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => update('mainRating', star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none p-1 transition-transform hover:scale-110"
                            >
                                <Star
                                    size={24}
                                    className={`${star <= (hoverRating || data.mainRating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-sm text-slate-500 font-medium">
                            {ratingLabels[hoverRating || data.mainRating]}
                        </span>
                    </div>
                </div>

                {/* Compact Comment */}
                <Textarea
                    placeholder="Optional: Share feedback..."
                    value={data.comment}
                    onChange={(e) => update('comment', e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                    rows={2}
                />

                {/* Inline Recommendation */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommend?</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => update('wouldRecommend', true)}
                            className={`px-3 py-1 rounded text-xs font-bold border transition-all ${data.wouldRecommend === true ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:border-green-300'}`}
                        >
                            👍 Yes
                        </button>
                        <button
                            onClick={() => update('wouldRecommend', false)}
                            className={`px-3 py-1 rounded text-xs font-bold border transition-all ${data.wouldRecommend === false ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'}`}
                        >
                            👎 No
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default Layout
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Main Rating - Large & Visual */}
            <div className="flex flex-col items-center gap-3 py-2">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Overall Rating</div>
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/50 backdrop-blur-sm">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => update('mainRating', star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95 p-1"
                        >
                            <Star
                                className={`w-12 h-12 ${star <= (hoverRating || data.mainRating)
                                    ? "fill-amber-400 text-amber-400 filter drop-shadow-sm"
                                    : "text-slate-200"
                                    } transition-all duration-200`}
                                strokeWidth={star <= (hoverRating || data.mainRating) ? 0 : 1.5}
                            />
                        </button>
                    ))}
                </div>
                <div className={`text-sm font-bold px-4 py-1 rounded-full transition-all duration-300 ${data.mainRating > 0 ? 'bg-amber-100 text-amber-700 opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    {ratingLabels[hoverRating || data.mainRating] || "Select a rating"}
                </div>
            </div>

            {/* 2. Detailed Categories - Grid Layout */}
            <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Detailed Breakdown</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CategoryRating icon="⚙️" label="Quality" value={data.qualityRating} field="qualityRating" />
                    <CategoryRating icon="⏱️" label="Timeliness" value={data.timelinessRating} field="timelinessRating" />
                    <CategoryRating icon="💬" label="Communication" value={data.communicationRating} field="communicationRating" />
                    <CategoryRating icon="💰" label="Value" value={data.valueRating} field="valueRating" />
                </div>
            </div>

            {/* 3. Recommendation Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-sm font-bold text-slate-700">Would you recommend them?</span>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => update('wouldRecommend', true)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all border ${data.wouldRecommend === true
                            ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-green-300 hover:text-green-600'}`}
                    >
                        👍 Yes
                    </button>
                    <button
                        onClick={() => update('wouldRecommend', false)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all border ${data.wouldRecommend === false
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600'}`}
                    >
                        👎 No
                    </button>
                </div>
            </div>

            {/* 4. Written Review */}
            {showComment && (
                <div className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                        <label htmlFor="comment" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Written Review (Optional)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
                            {data.comment.length} / 500
                        </span>
                    </div>
                    <Textarea
                        id="comment"
                        placeholder="What went well? Any issues? Share your experience..."
                        value={data.comment}
                        maxLength={500}
                        onChange={(e: any) => update('comment', e.target.value)}
                        className="resize-none min-h-[100px] rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm leading-relaxed p-4"
                    />
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['Fast Service', 'Great Communication', 'Fair Price', 'High Quality'].map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => update('comment', data.comment ? data.comment + ' ' + tag : tag)}
                                className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200"
                            >
                                + {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopRatingInputs;
