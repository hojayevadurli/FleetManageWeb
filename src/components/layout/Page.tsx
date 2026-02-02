import React from "react";
import { cn } from "@/lib/utils";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string; // Optional override, defaults to max-w-[1400px] or similar
}

export function Page({ children, className, maxWidth = "max-w-[1600px]", ...props }: PageProps) {
    return (
        <div
            className={cn(
                "flex flex-col flex-1 w-full h-full p-4 md:p-6 lg:p-8 gap-6 animate-in fade-in duration-300",
                maxWidth,
                "mx-auto",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode; // For actions (buttons, search, filters)
    className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm md:text-base text-slate-500 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Actions Area - Enforcing standard heights for children is tricky via CSS alone, 
          but we can provide a standard wrapper or just rely on children using standard classes.
          We'll add a flex wrapper. */}
            {children && (
                <div className="flex flex-wrap items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
