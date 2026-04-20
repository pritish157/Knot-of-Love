import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { validateEmail, validatePassword } from "../utils/validators";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setStatus("");
  }

  function validateForm() {
    const nextErrors = {
      email: validateEmail(values.email),
      password: validatePassword(values.password, 6)
    };

    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearToast();

    if (!validateForm()) {
      setStatus("Please correct the highlighted fields and try again.");
      return;
    }

    try {
      setLoading(true);
      setStatus("");
      const data = await login({
        email: values.email.trim(),
        password: values.password
      });
      showToast("Login successful. Redirecting...", "success");
      // Admins go to /admin, regular users go to /dashboard (or wherever they were)
      const isAdmin = data?.user?.role === "Admin";
      const fallback = isAdmin ? "/admin" : "/dashboard";
      const redirectTo = isAdmin ? "/admin" : (location.state?.from || "/dashboard");
      window.setTimeout(() => navigate(redirectTo, { replace: true }), 800);
    } catch (error) {
      setStatus(error.message || "Unable to sign in right now.");
      showToast(error.message || "Unable to sign in right now.");
      if (error.message.includes("verify your email")) {
        window.setTimeout(() => navigate("/verify-otp", { state: { email: values.email } }), 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <main className="grid min-h-screen lg:grid-cols-2">
        <section className="flex flex-col justify-center gap-5 bg-brand-gradient px-6 py-10 text-white sm:px-10 lg:px-16">
          <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em]">
            Secure member sign-in
          </span>
          <h1 className="max-w-[11ch] font-serif text-5xl leading-none sm:text-6xl">
            Welcome back to a calmer, better-organized matchmaking experience.
          </h1>
          <p className="max-w-xl text-base leading-8 text-white/85">
            Access your saved profile, continue discovery, and stay close to the connections that matter.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/15 bg-white/15 p-5 backdrop-blur">
              <strong className="block text-lg">Fast access</strong>
              <span className="mt-2 block text-sm leading-7 text-white/80">
                Sign in quickly and pick up right where you left off.
              </span>
            </article>
            <article className="rounded-[1.5rem] border border-white/15 bg-white/15 p-5 backdrop-blur">
              <strong className="block text-lg">Safe &amp; secure</strong>
              <span className="mt-2 block text-sm leading-7 text-white/80">
                Your data is encrypted and never shared without your consent.
              </span>
            </article>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="surface-card w-full max-w-xl p-6 sm:p-8">
            <Link to="/" className="text-sm font-bold text-muted">
              Back to home
            </Link>
            <p className="hero-badge mt-4">Account access</p>
            <h2 className="mt-4 font-serif text-4xl leading-none text-ink sm:text-5xl">Sign in</h2>
            <p className="mt-3 text-base leading-8 text-muted">
              Use your registered email and password to continue.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <FormField
                id="email"
                label="Email address"
                error={errors.email}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="input-field"
                />
              </FormField>

              <PasswordField
                id="password"
                label="Password"
                value={values.password}
                onChange={updateField}
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password}
              />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-bold text-brand-700 hover:-translate-y-0.5 transition hover:text-brand-600">
                  Forgot password?
                </Link>
              </div>

              {status ? <div className="status-error">{status}</div> : null}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-5 text-sm leading-7 text-muted">
              New to Knot of Love?{" "}
              <Link to="/register" className="font-extrabold text-brand-700">
                Create your profile
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
