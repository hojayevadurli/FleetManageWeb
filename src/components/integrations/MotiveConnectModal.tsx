import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink } from "lucide-react";
import { integrationService } from "@/services/integrationService";
import { useToast } from "@/hooks/use-toast";
import { AxiosError } from "axios";

interface MotiveConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function MotiveConnectModal({ open, onOpenChange, onSuccess }: MotiveConnectModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [accountId, setAccountId] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const { toast } = useToast();

    // Reset state when opening
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setTestResult(null);
            setErrorDetail(null);
            // Don't clear keys if re-opening? Maybe better to keep for user convenience if they closed accidentally
        }
        onOpenChange(newOpen);
    }

    const validateInput = () => {
        const trimmedKey = apiKey.trim();
        if (trimmedKey.length < 5) {
            return false;
        }
        return true;
    }

    const handleTestConnection = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            toast({
                title: "API Key Required",
                description: "Please enter your Motive API Key.",
                variant: "destructive"
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        setErrorDetail(null);

        try {
            await integrationService.testMotiveConnection(trimmedKey, accountId.trim());
            setTestResult('success');
        } catch (e: any) {
            console.error("Test connection failed", e);
            setTestResult('error');

            // Extract meaningful error message
            let msg = "Connection failed.";
            if (e instanceof AxiosError) {
                if (e.response) {
                    const status = e.response.status;
                    if (status === 401 || status === 403) {
                        msg = "Invalid or unauthorized API key. Check that your key is active and belongs to this Motive org.";
                    } else if (status === 404) {
                        msg = "Wrong base URL or endpoint used (backend error).";
                    } else if (e.response.data && typeof e.response.data === 'string') {
                        msg = `Error: ${e.response.data}`;
                    } else if (e.response.data && (e.response.data as any).message) {
                        msg = `Error: ${(e.response.data as any).message}`;
                    } else {
                        msg = `Server error (${status}).`;
                    }
                } else if (e.request) {
                    msg = "Cannot reach server (network error).";
                } else {
                    msg = e.message;
                }
            } else if (e instanceof Error) {
                msg = e.message;
            }
            setErrorDetail(msg);
        } finally {
            setIsTesting(false);
        }
    };

    const handleConnect = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) return;

        // If not tested successfully, force a test implicitly or reject?
        // User requirements: "Require successful Test Connection OR validate immediately during connect."
        // We will validate immediately (which is effectively what test does, but we proceed to save if valid).

        setIsConnecting(true);
        setErrorDetail(null);

        try {
            // Step 1: Validate/Test first (if not already verified just now)
            if (testResult !== 'success') {
                await integrationService.testMotiveConnection(trimmedKey, accountId.trim());
            }

            // Step 2: Connect (Save)
            await integrationService.connectMotive(trimmedKey, accountId.trim());

            toast({
                title: "Integration Connected",
                description: "Motive has been successfully connected.",
                variant: "default",
                className: "bg-emerald-50 border-emerald-200 text-emerald-900"
            });
            onSuccess();
            handleOpenChange(false);

            // Reset fields
            setApiKey("");
            setAccountId("");
            setTestResult(null);
        } catch (e: any) {
            let msg = "Could not save the integration.";
            if (e instanceof AxiosError && e.response) {
                const status = e.response.status;
                const data = e.response.data as any;

                if (status === 401 || status === 403) {
                    msg = "Unauthorized: Please log in again.";
                } else if (data) {
                    // Try to find a message in common error formats
                    if (typeof data === 'string') msg = data;
                    else if (data.message) msg = data.message;
                    else if (data.error) msg = data.error;
                    else if (data.title) msg = data.title; // .NET ProblemDetails
                }

                // Append status code for clarity
                msg = `${msg} (Status: ${status})`;
            }
            setErrorDetail(msg);
            setTestResult('error'); // Show error state
            toast({
                title: "Connection Failed",
                description: "Failed to save integration. See details below.",
                variant: "destructive"
            });
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
                            {/* Motive Logo Placeholder */}
                            <span className="font-bold text-blue-700">M</span>
                        </div>
                        <div>
                            <DialogTitle>Connect Motive</DialogTitle>
                            <DialogDescription>
                                Enter your Motive API credentials to sync your fleet data.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                            <Input
                                id="apiKey"
                                placeholder="Enter your Motive API Key"
                                value={apiKey}
                                onChange={(e) => {
                                    // Sanitize input: Remove any non-ASCII characters immediately
                                    // This prevents "Failed to execute 'setRequestHeader'" errors
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
                                Generate your API key in Motive Dashboard → <span className="font-medium text-slate-700">Admin</span> → <span className="font-medium text-slate-700">Developers</span> → Create (or Request) API Key.
                            </span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountId">Account / Company ID <span className="text-slate-400 font-normal">(Optional)</span></Label>
                        <Input
                            id="accountId"
                            placeholder="e.g. 12345"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        />
                    </div>

                    {/* Test Result Feedback */}
                    {testResult === 'success' && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="font-medium">Connection verified ✅</span>
                        </div>
                    )}

                    {testResult === 'error' && (
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
                        ) : "Test Connection"}
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
                        ) : "Connect Integration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
