import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Briefcase, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/api/client";

export default function LoginPage() {
  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error("Enter a valid phone number");
    setLoading(true);
    try {
      await authApi.sendOtpAdmin(phone.trim());
      toast.success("OTP sent to your phone");
      setStep("otp");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtpAdmin(phone.trim(), otp.trim());
      const { accessToken, refreshToken, user } = data.data;
      if (!["admin", "superadmin"].includes(user.role)) {
        toast.error("This account does not have admin access");
        return;
      }
      setSession({ user, accessToken, refreshToken });
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="h-5.5 w-5.5" />
          </div>
          <h1 className="text-lg font-semibold">Job India Admin Console</h1>
          <p className="text-sm text-muted-foreground">Sign in with your admin phone number</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {step === "phone" ? "Sign in" : "Verify OTP"}
            </CardTitle>
            <CardDescription>
              {step === "phone"
                ? "We'll send a one-time code to this number"
                : `Enter the 6-digit code sent to ${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    placeholder="+919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">One-time code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="tracking-[0.5em] text-center text-lg"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify & Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("phone")}
                  disabled={loading}
                >
                  Use a different number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
