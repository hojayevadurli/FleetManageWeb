import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

export const Logo = ({ className, showText = true, textClassName }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <img
                src="/app-logo-dark.png"
                alt="FleetManage Logo"
                className="h-10 w-10 object-contain rounded-xl"
            />
            {showText && (
                <span className={cn("text-xl font-bold tracking-tight", textClassName)}>
                    FleetManage<span className="text-blue-500">.ai</span>
                </span>
            )}
        </div>
    );
};
