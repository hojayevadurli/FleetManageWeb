import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  // existing
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  isLoading: boolean;
  isSignUp: boolean;
  isForgotPassword: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPasswordClick: () => void;

  // NEW for company sign-up
  companyName?: string;
  setCompanyName?: (name: string) => void;

  // Optional (nice UX): confirm password on sign-up
  confirmPassword?: string;
  setConfirmPassword?: (pwd: string) => void;
}

export const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  isSignUp,
  isForgotPassword,
  onSubmit,
  onForgotPasswordClick,
  companyName,
  setCompanyName,
  confirmPassword,
  setConfirmPassword,
}: LoginFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Company Name (sign-up only) */}
      {isSignUp && !isForgotPassword && setCompanyName && (
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Acme Logistics"
            value={companyName ?? ""}
            onChange={(e) => setCompanyName(e.target.value)}
            required={isSignUp}
            className="h-11"
            autoComplete="organization"
          />
        </div>
      )}

      {/* Full Name (sign-up only) */}
      {isSignUp && !isForgotPassword && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required={isSignUp}
            className="h-11"
            autoComplete="name"
          />
        </div>
      )}

      {/* Email (always shown) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
          autoComplete={isForgotPassword ? "email" : "username"}
        />
      </div>

      {/* Password (hidden for forgot) */}
      {!isForgotPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Password (sign-up only, optional prop-gated) */}
      {isSignUp && !isForgotPassword && setConfirmPassword && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword ?? ""}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required={isSignUp}
            className="h-11"
            autoComplete="new-password"
          />
        </div>
      )}

      {/* Remember me + Forgot link (sign-in only) */}
      {!isSignUp && !isForgotPassword && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </Label>
          </div>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isLoading}
      >
        {isLoading
          ? (isForgotPassword
              ? "Sending reset email..."
              : isSignUp
                ? "Creating account..."
                : "Signing in...")
          : (isForgotPassword
              ? "Send Reset Email"
              : isSignUp
                ? "Create Account"
                : "Sign In")}
      </Button>
    </form>
  );
};
