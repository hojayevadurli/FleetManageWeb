import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Industry } from "@/lib/industriesApi";
import { cn } from "@/lib/utils";

interface LoginFormProps {
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
  companyName?: string;
  setCompanyName?: (name: string) => void;
  phoneNumber?: string;
  setPhoneNumber?: (phone: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (pwd: string) => void;
  industryId?: string;
  setIndustryId?: (id: string) => void;
  industries?: Industry[];
  industriesLoading?: boolean;
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
  phoneNumber,
  setPhoneNumber,
  confirmPassword,
  setConfirmPassword,
  industryId,
  setIndustryId,
  industries = [],
  industriesLoading = false
}: LoginFormProps) => {

  const inputApi = "bg-[#0B1121] border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500 transition-all h-11 pl-10";
  const iconStyle = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500";

  return (
    <form onSubmit={onSubmit} className="space-y-4">

      {/* Company Name & Industry (Sign Up) */}
      {isSignUp && !isForgotPassword && setCompanyName && (
        <>
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
            <div className="relative">
              <Building2 className={iconStyle} />
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Logistics"
                value={companyName ?? ""}
                onChange={(e) => setCompanyName(e.target.value)}
                required={isSignUp}
                className={inputApi}
                autoComplete="organization"
              />
            </div>
          </div>

          {setIndustryId && (
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-slate-300">Industry</Label>
              <div className="relative">
                <Briefcase className={cn(iconStyle, "z-10")} />
                <Select value={industryId} onValueChange={setIndustryId} disabled={industriesLoading}>
                  <SelectTrigger className={cn(inputApi, "w-full text-left pl-10 flex items-center")}>
                    <SelectValue placeholder={industriesLoading ? "Loading..." : "Select industry type"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E2536] border-white/10 text-white">
                    {industries.length > 0 ? (
                      industries.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id} className="focus:bg-blue-600 focus:text-white">
                          {ind.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="trucking">Trucking & Logistics</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Full Name (Sign Up) */}
      {isSignUp && !isForgotPassword && (
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
          <div className="relative">
            <User className={iconStyle} />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
              className={inputApi}
              autoComplete="name"
            />
          </div>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">Email Address</Label>
        <div className="relative">
          <Mail className={iconStyle} />
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputApi}
            autoComplete={isForgotPassword ? "email" : "username"}
          />
        </div>
      </div>

      {/* Phone (Sign Up) */}
      {isSignUp && !isForgotPassword && setPhoneNumber && (
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-slate-300">Phone Number</Label>
          <div className="relative">
            <Phone className={iconStyle} />
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber ?? ""}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required={isSignUp}
              className={inputApi}
              autoComplete="tel"
            />
          </div>
        </div>
      )}

      {/* Password */}
      {!isForgotPassword && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            {/* Forgot Password Link - moved here for cleaner layout if not signing up */}
          </div>
          <div className="relative">
            <Lock className={iconStyle} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${inputApi} pr-10`}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Password */}
      {isSignUp && !isForgotPassword && setConfirmPassword && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
          <div className="relative">
            <Lock className={iconStyle} />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword ?? ""}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={isSignUp}
              className={inputApi}
              autoComplete="new-password"
            />
          </div>
        </div>
      )}

      {/* Remember Me / Forgot Password Row */}
      {!isSignUp && !isForgotPassword && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="remember" className="text-sm text-slate-400 font-normal cursor-pointer">
              Remember me
            </Label>
          </div>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all mt-4"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          isForgotPassword ? "Send Reset Email" : isSignUp ? "Create Account" : "Sign In"
        )}
      </Button>
    </form>
  );
};
