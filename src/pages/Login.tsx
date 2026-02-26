import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { api } from "@/lib/Api.temp";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginActivityFeed } from "@/components/auth/LoginActivityFeed";
import { industriesApi, Industry } from "@/lib/industriesApi";
import { Logo } from "@/components/ui/Logo";
import { Shield, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { signIn, signUp } = useAuth();

  // Initialize mode from URL query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initialMode);

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryId, setIndustryId] = useState("");

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSignUp = mode === "signup";
  const isForgotPassword = mode === "forgot";

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const data = await industriesApi.list();
        setIndustries(data);
      } catch (e) {
        console.error("Failed to load industries", e);
      } finally {
        setIndustriesLoading(false);
      }
    };
    loadIndustries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        await api.post("/Auth/forgot-password", { email });
        setSuccess("Password reset link sent to your email.");
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const res = await signUp(companyName, fullName, email, phoneNumber, password, industryId);

        if (res.error) {
          setError(res.error);
        } else {
          // ✅ no auto-login: tell user to sign in
          setSuccess("Company created! Please check your email to verify your account before logging in.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        const res = await signIn(email, password);

        if (res.error) {
          setError(res.error);
        } else {
          window.location.href = "/app";
        }
      }
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "Something went wrong.";

      if (typeof data === "string") msg = data;
      else if (data?.message) msg = data.message;

      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setMode("forgot");
    setError(null);
    setSuccess(null);
  };

  const switchToLogin = () => {
    setMode("login");
    setError(null);
    setSuccess(null);
  };

  const switchToSignUp = () => {
    setMode("signup");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] font-sans antialiased text-slate-200 selection:bg-blue-500/30 selection:text-blue-200 lg:grid lg:grid-cols-[55%_45%]">

      {/* Left Panel - Animation (Hidden on Mobile) */}
      <div className="hidden lg:flex relative flex-col items-center justify-center overflow-hidden bg-[#0B1121] border-r border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="z-10 w-full max-w-2xl px-12">
          <LoginActivityFeed />
          <div className="mt-8 text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Your Fleet, In Real-Time</h2>
            <p className="text-slate-400">Track maintenance, scan receipts, and find shops instantly.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo textClassName="text-2xl" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {isForgotPassword
                  ? "Reset Password"
                  : isSignUp
                    ? "Start Your Free Trial"
                    : "Welcome Back"}
              </h1>
              <p className="text-sm text-slate-400">
                {isForgotPassword
                  ? "We'll send a recovery link to your email"
                  : isSignUp
                    ? "Join 500+ fleets saving time with AI"
                    : "Sign in to manage your fleet"}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-[#1E2536] p-8 rounded-2xl border border-white/10 shadow-xl">
            <LoginForm
              email={email}
              setEmail={setEmail}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              isLoading={isLoading}
              isSignUp={isSignUp}
              isForgotPassword={isForgotPassword}
              onSubmit={handleSubmit}
              onForgotPasswordClick={handleForgotPasswordClick}
              companyName={companyName}
              setCompanyName={setCompanyName}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              industryId={industryId}
              setIndustryId={setIndustryId}
              industries={industries}
              industriesLoading={industriesLoading}
            />

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="text-center text-sm text-slate-400">
            {!isForgotPassword && !isSignUp && (
              <p>
                New to FleetManage?{" "}
                <button
                  type="button"
                  onClick={switchToSignUp}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Start free trial
                </button>
              </p>
            )}

            {isSignUp && (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}

            {isForgotPassword && (
              <button
                type="button"
                onClick={switchToLogin}
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 w-full"
              >
                Back to sign in
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" />
              Secured with 256-bit SSL Encryption
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
