import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { api } from "@/lib/Api";
import { LoginForm } from "@/components/auth/LoginForm";
import { industriesApi, Industry } from "@/lib/industriesApi";

export default function Login() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

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
        // forgot-password flow
        await api.post("/Auth/forgot-password", { email });
        setSuccess("Password reset link sent to your email.");
      } else if (isSignUp) {
        // basic client-side check
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const res = await signUp(companyName, fullName, email, phoneNumber, password, industryId);

        if (res.error) {
          // 🔥 show exact backend message from signUp
          setError(res.error);
        } else {
          // ✅ no auto-login: tell user to sign in
          setSuccess("Company created. Please sign in.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        // login flow
        const res = await signIn(email, password);

        if (res.error) {
          // 🔥 show exact backend message from signIn
          setError(res.error);
        } else {
          window.location.href = "/App";
        }
      }
    } catch (err: any) {
      // Only catches unexpected/network errors.
      // Still try to surface backend message if present.
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {isForgotPassword
              ? "Reset your password"
              : isSignUp
                ? "Create your company account"
                : "Sign in to FleetManage"}
          </h1>
          <p className="text-sm text-gray-600">
            {isForgotPassword
              ? "Enter your email and we’ll send you a reset link."
              : isSignUp
                ? "Create a company and your first admin user."
                : "Use your work email to log in."}
          </p>
        </div>

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
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {success}
          </p>
        )}

        <div className="text-sm text-center text-gray-600 space-y-1">
          {!isForgotPassword && !isSignUp && (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={switchToSignUp}
                className="text-blue-600 hover:underline"
              >
                Create company
              </button>
            </p>
          )}

          {isSignUp && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {isForgotPassword && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="text-blue-600 hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
