import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, Loader2, RefreshCw, Settings2 } from "lucide-react";

export interface IntegrationCardProps {
    logo: React.ReactNode; // or string URL
    name: string;
    description: string;
    status: 'Connected' | 'Disconnected' | 'ComingSoon' | 'Error' | 'Connecting';
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
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden">
                    {/* If logo is a string, render img, else render component */}
                    {typeof logo === 'string' ? <img src={logo} alt={name} className="w-8 h-8 object-contain" /> : logo}
                </div>
                {status === 'Connected' && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1.5 pl-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected
                    </Badge>
                )}
                {(status === 'Disconnected' || status === 'Connecting') && (
                    <Badge variant="outline" className="text-slate-500 bg-slate-50 gap-1.5 pl-1.5">
                        {status === 'Connecting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Circle className="w-3.5 h-3.5" />}
                        {status === 'Connecting' ? 'Connecting...' : 'Not Connected'}
                    </Badge>
                )}
                {status === 'Error' && (
                    <Badge variant="destructive" className="gap-1.5 pl-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Error
                    </Badge>
                )}
                {status === 'ComingSoon' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1.5 pl-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Coming Soon
                    </Badge>
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">{name}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">{description}</p>

            <div className="pt-4 border-t border-slate-100 mt-auto">
                {status === 'Connected' ? (
                    <Button variant="outline" className="w-full font-semibold gap-2" onClick={onManage}>
                        <Settings2 className="w-4 h-4" />
                        Manage
                    </Button>
                ) : status === 'ComingSoon' ? (
                    <Button variant="secondary" className="w-full font-semibold" onClick={onNotifyMe}>
                        Notify Me
                    </Button>
                ) : status === 'Error' ? (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 font-semibold gap-2" onClick={onConnect}>
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </Button>
                ) : (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 font-semibold"
                        onClick={onConnect}
                        disabled={status === 'Connecting'}
                    >
                        {status === 'Connecting' ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                            </>
                        ) : "Connect Integration"}
                    </Button>
                )}
            </div>
        </div>
    );
}
