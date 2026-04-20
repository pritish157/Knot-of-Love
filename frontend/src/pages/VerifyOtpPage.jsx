import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import FormField from "../components/FormField";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/http";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const { setAuth } = useAuth();

  const { toast, showToast, clearToast } = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="surface-card p-12 text-center">
          <h2 className="font-serif text-3xl">Invalid session</h2>
          <p className="mt-4 text-muted">Please sign up or log in first.</p>
          <Link to="/register" className="btn-primary mt-8">Go to registration</Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp })
      });

      // Auto-login: backend returns token + user after verify
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        showToast("Email verified! Setting up your profile...", "success");
        setTimeout(() => navigate("/onboarding"), 1200);
      } else {
        showToast("Verification successful! Please log in.", "success");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      await apiRequest("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      showToast("A new OTP has been sent to your email.", "success");
    } catch (err) {
      showToast(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-gradient p-4">
      <Toast toast={toast} onClose={clearToast} />
      <div className="surface-card w-full max-w-md p-8 shadow-2xl">
        <div className="text-center">
          <p className="hero-badge">Security check</p>
          <h1 className="mt-4 font-serif text-4xl text-ink">Verify email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We've sent a 6-digit code to <br />
            <strong className="text-brand-700">{email}</strong>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <FormField id="otp" label="Enter 6-digit code">
            <input
              id="otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="input-field text-center text-3xl font-black tracking-[0.5em]"
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </FormField>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Verify account"}
          </button>

          <div className="text-center">
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="text-sm font-bold text-brand-700 hover:text-brand-800 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Didn't get a code? Resend"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
