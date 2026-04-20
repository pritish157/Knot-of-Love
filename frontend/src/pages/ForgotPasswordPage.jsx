import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/http";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  
  // Form State
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ─── STEP 1: Request OTP ────────────────────────────────────────────────
  async function handleRequestOtp(e) {
    e.preventDefault();
    if (!identifier) {
       return setStatus("Please enter your email or phone number.");
    }
    
    try {
      setLoading(true);
      setStatus("");
      clearToast();
      
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: identifier.trim() })
      });
      
      showToast(res.message || "OTP has been sent.", "success");
      setStep(2); // Move to OTP step
    } catch (error) {
      setStatus(error.message || "Unable to request OTP at this time.");
    } finally {
      setLoading(false);
    }
  }

  // ─── STEP 2 & 3: Reset Password (Combined) ──────────────────────────────
  // The backend controller we designed expects identifier, otp, and new passwords together
  async function handleResetPassword(e) {
    e.preventDefault();
    if (step === 2) {
      if (!otp || otp.length < 6) return setStatus("Please enter the 6-digit OTP.");
      setStep(3);
      setStatus("");
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      return setStatus("Passwords do not match.");
    }

    try {
      setLoading(true);
      setStatus("");
      clearToast();

      const res = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ 
          email: identifier.trim(), 
          otp, 
          newPassword, 
          confirmPassword 
        })
      });

      showToast(res.message || "Password reset successful.", "success");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
      
    } catch (error) {
      setStatus(error.message || "Failed to reset password.");
      if (error.message.toLowerCase().includes("otp")) {
        setStep(2); // Go back if OTP was invalid
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Resend OTP from step 2 ──────────────────────────────────────────────
  async function handleResendCode() {
    if (!identifier) {
      setStep(1);
      return;
    }
    try {
      setLoading(true);
      setStatus("");
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: identifier.trim() })
      });
      showToast(res.message || "New OTP sent.", "success");
    } catch (error) {
      setStatus(error.message || "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <main className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side: Brand presentation */}
        <section className="flex flex-col justify-center gap-5 bg-brand-gradient px-6 py-10 text-white sm:px-10 lg:px-16">
          <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em]">
            Account Recovery
          </span>
          <h1 className="max-w-[12ch] font-serif text-5xl leading-none sm:text-6xl">
            Regain access securely.
          </h1>
          <p className="max-w-xl text-base leading-8 text-white/85">
            We will verify your identity to ensure the safety of your profile and matches.
          </p>
        </section>

        {/* Right Side: Interactive Forms */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="surface-card w-full max-w-xl p-6 sm:p-8">
            <Link to="/login" className="text-sm font-bold text-muted transition hover:text-brand-700">
              &larr; Back to login
            </Link>
            <p className="hero-badge mt-4">Security verification</p>
            
            <h2 className="mt-4 font-serif text-4xl leading-none text-ink sm:text-5xl">
              {step === 1 ? "Forgot Password" : step === 2 ? "Enter OTP" : "New Password"}
            </h2>

            {/* STEP 1 FORM */}
            {step === 1 && (
              <form className="mt-6 grid gap-5" onSubmit={handleRequestOtp}>
                <p className="text-base leading-7 text-muted">
                  Enter your registered email address or phone number, and we'll send you an OTP to reset your password.
                </p>
                <FormField id="identifier" label="Email or Phone">
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or 9876543210"
                    className="input-field"
                    required
                  />
                </FormField>

                {status && <div className="status-error">{status}</div>}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Send Reset Code"}
                </button>
              </form>
            )}

            {/* STEP 2 & 3 FORM */}
            {(step === 2 || step === 3) && (
              <form className="mt-6 grid gap-5" onSubmit={handleResetPassword}>
                
                {step === 2 && (
                  <>
                    <p className="text-base leading-7 text-muted">
                      Please enter the 6-digit code sent to <strong>{identifier}</strong>.
                    </p>
                    <FormField id="otp" label="One-Time Password (OTP)">
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="input-field text-center text-xl tracking-[0.5em]"
                        required
                        autoFocus
                      />
                    </FormField>
                  </>
                )}

                {step === 3 && (
                  <>
                    <p className="text-base leading-7 text-muted">
                      Create a strong new password for your account.
                    </p>
                    <PasswordField
                      id="newPassword"
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <PasswordField
                      id="confirmPassword"
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </>
                )}

                {status && <div className="status-error">{status}</div>}

                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? (
                    <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                  ) : step === 2 ? (
                    "Verify Code"
                  ) : (
                    "Reset Password"
                  )}
                </button>

                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="mt-2 text-sm text-brand-700 font-bold hover:underline self-center disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send code again"}
                  </button>
                )}
              </form>
            )}

          </div>
        </section>
      </main>
    </>
  );
}
