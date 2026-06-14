import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink } from "lucide-react";
import { integrationService } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";

interface SamsaraConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function SamsaraConnectModal({ open, onOpenChange, onSuccess }: SamsaraConnectModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const { toast } = useToast();

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setTestResult(null);
            setErrorDetail(null);
        }
        onOpenChange(newOpen);
    };

    const handleTestConnection = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            toast({ title: "API Token Required", description: "Please enter your Samsara API token.", variant: "destructive" });
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        setErrorDetail(null);

        try {
            const ok = await integrationService.testSamsaraConnection(trimmedKey);
            if (ok) {
                setTestResult("success");
            } else {
                setTestResult("error");
                setErrorDetail("Connection test failed. Check that your token is active and has fleet read permissions.");
            }
        } catch (e: any) {
            setTestResult("error");
            setErrorDetail(e?.message ?? "Connection failed.");
        } finally {
            setIsTesting(false);
        }
    };

    const handleConnect = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) return;

        setIsConnecting(true);
        setErrorDetail(null);

        try {
            if (testResult !== "success") {
                const ok = await integrationService.testSamsaraConnection(trimmedKey);
                if (!ok) throw new Error("Invalid API token or connection failed.");
            }

            await integrationService.connectSamsara(trimmedKey);

            toast({
                title: "Integration Connected",
                description: "Samsara has been successfully connected.",
                className: "bg-emerald-50 border-emerald-200 text-emerald-900",
            });
            onSuccess();
            handleOpenChange(false);
            setApiKey("");
            setTestResult(null);
        } catch (e: any) {
            setTestResult("error");
            setErrorDetail(e?.message ?? "Could not save the integration.");
            toast({ title: "Connection Failed", description: "Failed to save integration.", variant: "destructive" });
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-blue-700 text-lg">S</span>
                        </div>
                        <div>
                            <DialogTitle>Connect Samsara</DialogTitle>
                            <DialogDescription>
                                Enter your Samsara API token to sync your fleet data.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="samsaraApiKey">API Token <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                            <Input
                                id="samsaraApiKey"
                                placeholder="samsara_api_..."
                                value={apiKey}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^\x00-\x7F]/g, "");
                                    setApiKey(val);
                                }}
                                type={showApiKey ? "text" : "password"}
                                className="font-mono pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[12px] text-slate-500 flex items-start gap-1">
                            <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>
                                Generate your API token in Samsara Dashboard →{" "}
                                <span className="font-medium text-slate-700">Settings</span> →{" "}
                                <span className="font-medium text-slate-700">Developer Tools</span> → API Tokens.
                            </span>
                        </p>
                    </div>

                    {testResult === "success" && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="font-medium">Connection verified ✅</span>
                        </div>
                    )}

                    {testResult === "error" && (
                        <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 flex items-start gap-3 text-sm text-rose-800 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-medium block">Connection failed</span>
                                {errorDetail && <span className="opacity-90 block mt-1">{errorDetail}</span>}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || apiKey.length < 5 || isConnecting}
                        className="w-full sm:w-auto"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            "Test Connection"
                        )}
                    </Button>

                    <Button
                        onClick={handleConnect}
                        disabled={isConnecting || apiKey.length < 5}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            "Connect Integration"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
