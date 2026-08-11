import { useEffect, useState } from "react";
import { apiRequest } from "../services/http";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

export default function KycPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const [form, setForm] = useState({
    type: "Aadhar",
    idNumber: "",
    file: null
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const data = await apiRequest("/api/kyc/status");
      setStatus(data);
    } catch (err) {
      setError(err.message || "Failed to load KYC status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!form.file) return showToast("Please select a document image.");
    if (!form.idNumber) return showToast("ID number is required.");

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("idNumber", form.idNumber);
      formData.append("document", form.file);

      await apiRequest("/api/kyc/upload", {
        method: "POST",
        body: formData
      });

      showToast("Documents uploaded successfully!", "success");
      fetchStatus();
    } catch (err) {
      showToast(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="flex h-96 items-center justify-center"><Spinner /></div>;

  return (
    <div className="page-fade mx-auto max-w-2xl pb-6">
      <Toast toast={toast} onClose={clearToast} />

      <section className="surface-card p-5 sm:p-8">
        <header className="text-center">
          <p className="hero-badge">Verification Center</p>
          <h1 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">Trust & Safety</h1>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
            Verify your identity to earn a <strong>"Verified"</strong> badge and increase visibility by 5×.
          </p>
        </header>

        {error ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-8 text-center">
            <h2 className="mt-4 font-serif text-2xl text-red-800">Connection Error</h2>
            <p className="mt-2 text-sm text-red-700/80">{error}</p>
            <button onClick={fetchStatus} className="btn-secondary mt-4">Try Again</button>
          </div>
        ) : status?.status === "Approved" ? (
          <div className="mt-8 rounded-2xl bg-emerald-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 font-serif text-3xl text-emerald-800">You are verified</h2>
            <p className="mt-2 text-sm text-emerald-700/80">Your identity documents have been approved by our admin team.</p>
          </div>
        ) : status?.status === "Pending" ? (
          <div className="mt-8 rounded-2xl bg-amber-50 p-8 text-center">
            <Spinner className="mx-auto h-12 w-12 border-amber-300 border-t-amber-600" />
            <h2 className="mt-6 font-serif text-3xl text-amber-800">Review in progress</h2>
            <p className="mt-2 text-sm text-amber-700/80">Please allow 24–48 hours for our team to manually verify your documents.</p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleUpload}>
            {status?.status === "Rejected" && (
              <div className="status-error">
                <strong>KYC Rejected:</strong> {status.reason}
              </div>
            )}

            <div className="grid gap-2">
              <label className="input-label">Identity Proof Type</label>
              <select
                className="input-field"
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="Aadhar">Aadhar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="input-label">ID Number / Card Number</label>
              <input
                className="input-field"
                placeholder="e.g. 1234 5678 9012"
                value={form.idNumber}
                onChange={e => setForm({...form, idNumber: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <label className="input-label">Upload ID Proof (Photo / Scan)</label>
              <label className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors ${form.file ? "border-brand-400 bg-brand-50/50" : "border-ink/15 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/30"}`}>
                <svg className={`h-8 w-8 ${form.file ? "text-brand-600" : "text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm font-semibold text-muted">
                  {form.file ? form.file.name : "Click to upload — JPG, PNG, PDF"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => setForm({...form, file: e.target.files[0]})}
                />
              </label>
              {form.file && (
                <p className="text-xs text-emerald-600 font-semibold">✓ File selected: {form.file.name}</p>
              )}
            </div>

            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? (
                <><Spinner className="h-4 w-4 border-white/40 border-t-white" /><span>Uploading...</span></>
              ) : (
                "Submit for Verification"
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
