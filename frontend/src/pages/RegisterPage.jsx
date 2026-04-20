import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { validateRegistration } from "../utils/validators";

const initialValues = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  password: "",
  confirmPassword: ""
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setStatus("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearToast();

    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("Please review the highlighted fields before submitting.");
      return;
    }

    try {
      setLoading(true);
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\D/g, ""),
        dob: values.dob,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        password: values.password
      });
      showToast("Account created successfully. Please verify your email.", "success");
      window.setTimeout(() => navigate("/verify-otp", { state: { email: values.email } }), 1200);
    } catch (error) {
      setStatus(error.message || "Unable to create your account right now.");
      showToast(error.message || "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4">
        <section className="max-w-3xl py-4">
          <Link to="/" className="text-sm font-bold text-muted">
            Back to home
          </Link>
          <p className="hero-badge mt-4">Member onboarding</p>
          <h1 className="mt-4 max-w-[14ch] font-serif text-5xl leading-none text-ink sm:text-6xl lg:text-7xl">
            Begin your journey to finding the right partner.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Fill in a few essentials and your profile will be ready. We keep your information private
            and only share what you choose.
          </p>
        </section>

        <section className="surface-card p-5 sm:p-8">
          <div className="flex flex-col gap-3 border-b border-ink/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="hero-badge">Getting started</p>
              <h2 className="mt-4 font-serif text-4xl leading-none text-ink sm:text-5xl">Your details</h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-muted">
              All fields are required. You can add more details like education and preferences after signing in.
            </p>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <FormField id="name" label="Full name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="input-field"
                />
              </FormField>
            </div>

            <FormField id="email" label="Email address" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-field"
              />
            </FormField>

            <FormField id="phone" label="Phone number" error={errors.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={updateField}
                placeholder="9876543210"
                autoComplete="tel"
                inputMode="numeric"
                className="input-field"
              />
            </FormField>

            <FormField id="dob" label="Date of birth" error={errors.dob}>
              <input id="dob" name="dob" type="date" value={values.dob} onChange={updateField} className="input-field" />
            </FormField>

            <FormField id="gender" label="Gender" error={errors.gender}>
              <select id="gender" name="gender" value={values.gender} onChange={updateField} className="input-field">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </FormField>

            <FormField id="maritalStatus" label="Marital status" error={errors.maritalStatus}>
              <select id="maritalStatus" name="maritalStatus" value={values.maritalStatus} onChange={updateField} className="input-field">
                <option value="">Select status</option>
                <option value="Single">Single</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </FormField>

            {values.maritalStatus === "Widowed" && (
              <div className="md:col-span-2 rounded-2xl bg-brand-500/5 p-4 text-sm text-brand-800 border border-brand-500/10 italic">
                "We understand that starting a new chapter takes courage. We're here to help you find a companion who respects your journey."
              </div>
            )}

            <div className="md:col-span-2">
              <PasswordField
                id="password"
                label="Password"
                value={values.password}
                onChange={updateField}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                error={errors.password}
                helperText="Use at least 8 characters with a mix of letters and numbers."
              />
            </div>

            <div className="md:col-span-2">
              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={values.confirmPassword}
                onChange={updateField}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </div>

            {status ? <div className="status-error md:col-span-2">{status}</div> : null}

            <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
              <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto">
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-sm leading-7 text-muted">
                Already have an account?{" "}
                <Link to="/login" className="font-extrabold text-brand-700">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
