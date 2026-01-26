import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

interface LogoProps {
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

export const Logo = ({ className, showText = true, textClassName }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 overflow-hidden">
                <Truck className="h-6 w-6 text-white" />
            </div>
            {showText && (
                <span className={cn("text-xl font-bold tracking-tight", textClassName)}>
                    FleetManage<span className="text-blue-500">.ai</span>
                </span>
            )}
        </div>
    );
};
