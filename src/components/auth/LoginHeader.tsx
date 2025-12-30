import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface LoginHeaderProps {
  isSignUp: boolean;
  isForgotPassword: boolean;
  onBackToLogin: () => void;
  onSwitchToSignUp?: () => void;   // NEW (optional)
  onSwitchToSignIn?: () => void;   // NEW (optional)
}

export const LoginHeader = ({
  isSignUp,
  isForgotPassword,
  onBackToLogin,
  onSwitchToSignUp,
  onSwitchToSignIn,
}: LoginHeaderProps) => {
  const title = isForgotPassword
    ? "Reset Password"
    : isSignUp
      ? "Create Account"
      : "Welcome Back";

  const subtitle = isForgotPassword
    ? "Enter your email to receive a password reset link"
    : isSignUp
      ? "Sign up for your fleet management account"
      : "Sign in to your fleet management account";

  return (
    <CardHeader className="space-y-2 pb-6">
      <div className="flex items-center gap-2">
        {(isForgotPassword || isSignUp) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBackToLogin}
            className="p-1"
            aria-label="Back to sign in"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
      </div>

      <p className="text-center text-gray-600">{subtitle}</p>

      {/* Mode switch helper text */}
      <div className="text-center text-sm text-gray-600">
        {!isForgotPassword && !isSignUp && onSwitchToSignUp && (
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            New here? Create an account
          </button>
        )}

        {isSignUp && onSwitchToSignIn && (
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Already have an account? Sign in
          </button>
        )}

        {isForgotPassword && onSwitchToSignIn && (
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </CardHeader>
  );
};
