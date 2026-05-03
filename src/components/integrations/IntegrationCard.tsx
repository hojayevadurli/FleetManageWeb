import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Circle,
    AlertCircle,
    Loader2,
    RefreshCw,
    Settings2
} from "lucide-react";

export interface IntegrationCardProps {
    logo: React.ReactNode | string;
    name: string;
    description: string;
    status: "Connected" | "Disconnected" | "ComingSoon" | "Error" | "Connecting";
    onConnect?: () => void;
    onManage?: () => void;
    onNotifyMe?: () => void;
}

export function IntegrationCard({
    logo,
    name,
    description,
    status,
    onConnect,
    onManage,
    onNotifyMe
}: IntegrationCardProps) {
    const isConnecting = status === "Connecting";
    const isConnected = status === "Connected";
    const isDisconnected = status === "Disconnected";
    const isError = status === "Error";
    const isComingSoon = status === "ComingSoon";

    const renderStatusBadge = () => {
        if (isConnected) {
            return (
                <Badge className="gap-1.5 border-emerald-200 bg-emerald-100 pl-1.5 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                </Badge>
            );
        }

        if (isDisconnected || isConnecting) {
            return (
                <Badge variant="outline" className="gap-1.5 bg-slate-50 pl-1.5 text-slate-500">
                    {isConnecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Circle className="h-3.5 w-3.5" />
                    )}
                    {isConnecting ? "Connecting..." : "Not Connected"}
                </Badge>
            );
        }

        if (isError) {
            return (
                <Badge variant="destructive" className="gap-1.5 pl-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Error
                </Badge>
            );
        }

        return (
            <Badge className="gap-1.5 border-amber-200 bg-amber-100 pl-1.5 text-amber-700 hover:bg-amber-100">
                <AlertCircle className="h-3.5 w-3.5" />
                Coming Soon
            </Badge>
        );
    };

    const renderActionButton = () => {
        if (isConnected) {
            return (
                <Button
                    variant="outline"
                    className="w-full gap-2 font-semibold"
                    onClick={onManage}
                    disabled={!onManage}
                >
                    <Settings2 className="h-4 w-4" />
                    Manage
                </Button>
            );
        }

        if (isComingSoon) {
            return (
                <Button
                    variant="secondary"
                    className="w-full font-semibold"
                    onClick={onNotifyMe}
                    disabled={!onNotifyMe}
                >
                    Notify Me
                </Button>
            );
        }

        if (isError) {
            return (
                <Button
                    className="w-full gap-2 bg-blue-600 font-semibold hover:bg-blue-700"
                    onClick={onConnect}
                    disabled={!onConnect}
                >
                    <RefreshCw className="h-4 w-4" />
                    Retry Connection
                </Button>
            );
        }

        return (
            <Button
                className="w-full bg-blue-600 font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700"
                onClick={onConnect}
                disabled={isConnecting || !onConnect}
            >
                {isConnecting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    "Connect Integration"
                )}
            </Button>
        );
    };

    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-16 w-44 items-center">
                    {typeof logo === "string" ? (
                        <img
                            src={logo}
                            alt={`${name} logo`}
                            className="max-h-full w-full object-contain object-left"
                        />
                    ) : (
                        logo
                    )}
                </div>

                {renderStatusBadge()}
            </div>

            <h3 className="mb-2 text-lg font-bold text-slate-900">{name}</h3>
            <p className="mb-6 flex-grow text-sm leading-relaxed text-slate-500">
                {description}
            </p>

            <div className="mt-auto border-t border-slate-100 pt-4">
                {renderActionButton()}
            </div>
        </div>
    );
}