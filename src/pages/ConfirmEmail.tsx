
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmEmail } from "@/components/auth/Auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";

const ConfirmEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verify = async () => {
            const userId = searchParams.get("userId");
            const token = searchParams.get("token");

            if (!userId || !token) {
                setStatus("error");
                setMessage("Invalid verification link. Missing parameters.");
                return;
            }

            try {
                await confirmEmail(userId, token);
                setStatus("success");
            } catch (error) {
                console.error("Verification failed", error);
                setStatus("error");
                setMessage("Verification failed. The link may be invalid or expired.");
            }
        };

        verify();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-8 text-center space-y-6">

                {status === "loading" && (
                    <div className="py-12 space-y-4">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                        <h2 className="text-xl font-black text-slate-900">Verifying Email...</h2>
                        <p className="text-slate-500">Please wait while we confirm your account.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="py-8 space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">Email Verified!</h2>
                            <p className="text-slate-600">
                                Your email has been successfully confirmed. You can now access your account.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button
                                onClick={() => navigate("/login")}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-95"
                            >
                                Continue to Sign In
                            </Button>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="py-8 space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900">Verification Failed</h2>
                            <p className="text-slate-600">
                                {message}
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate("/login")}
                                className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-6 font-bold text-base flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ConfirmEmail;
