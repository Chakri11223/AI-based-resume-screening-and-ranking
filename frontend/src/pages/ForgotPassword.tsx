import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Mail, Lock, Shield, ArrowLeft, KeyRound } from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('otp');
        toast({
          title: "OTP Sent!",
          description: data.message || "If an account exists with this email, an OTP has been sent.",
        });
        
        // In development, show OTP if provided
        if (data.otp) {
          toast({
            title: "Development Mode",
            description: `OTP: ${data.otp}`,
          });
        }
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpVerified(true);
        setStep('reset');
        toast({
          title: "OTP Verified!",
          description: "You can now reset your password.",
        });
      } else {
        throw new Error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtp("");
        toast({
          title: "OTP Resent!",
          description: data.message || "A new OTP has been sent to your email.",
        });
        
        if (data.otp) {
          toast({
            title: "Development Mode",
            description: `OTP: ${data.otp}`,
          });
        }
      } else {
        throw new Error(data.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Resend OTP",
        description: error.message || "Could not resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      toast({
        title: "OTP Not Verified",
        description: "Please verify your OTP first.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Password Reset Successful!",
          description: "Your password has been reset. You can now login with your new password.",
        });
        
        navigate("/login");
      } else {
        throw new Error(data.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-8 glass border-white/10 shadow-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-muted-foreground text-center">
            {step === 'email' && 'Enter your email to receive a password reset code'}
            {step === 'otp' && 'Enter the 6-digit code sent to your email'}
            {step === 'reset' && 'Enter your new password'}
          </p>
        </div>

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-card/50"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary shadow-glow mt-6"
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Code
                </>
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 bg-card/50 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Code sent to: <span className="font-medium">{email}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('email');
                  setOtp("");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary shadow-glow"
                disabled={isVerifyingOtp || otp.length !== 6}
              >
                {isVerifyingOtp ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isSendingOtp}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isSendingOtp ? 'Resending...' : "Didn't receive code? Resend"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-accent" />
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="pl-10 bg-card/50 opacity-70"
                />
              </div>
              <p className="text-xs text-accent flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Email verified
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-card/50"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-card/50"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('otp');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary shadow-glow"
                disabled={isResetting || newPassword.length < 6 || newPassword !== confirmPassword}
              >
                {isResetting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;

