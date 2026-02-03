import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number;
    max?: number;
    className?: string;
}

export function StarRating({ rating, max = 5, className }: StarRatingProps) {
    // Ensure rating is valid
    const safeRating = Math.max(0, Math.min(rating, max));

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const isFilled = i < Math.floor(safeRating);
                // For MVP we stick to full stars. 
                // If we wanted half stars we'd need more logic/SVGs.

                return (
                    <Star
                        key={i}
                        className={cn(
                            "w-3.5 h-3.5",
                            isFilled
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-200 fill-slate-100" // Subtle empty state
                        )}
                    />
                );
            })}
        </div>
    );
}
