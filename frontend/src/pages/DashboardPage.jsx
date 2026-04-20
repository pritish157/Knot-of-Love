import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/http";
import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import { useActiveMatches } from "../hooks/useActiveMatches";
import PasswordField from "../components/PasswordField";
import { useToast } from "../hooks/useToast";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import { getProfileImageSrc, handleImageError } from "../utils/image";
import IncomingInterests from "../components/IncomingInterests";
import SentInterests from "../components/SentInterests";
import Conversations from "../components/Conversations";
import HiddenUsers from "../components/HiddenUsers";

function VerificationBadge({ label, verified }) {
  return (
    <div className="flex items-center gap-2.5">
      {verified ? (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      ) : (
        <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-slate-400">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      )}
      <span className={`text-sm font-bold ${verified ? "text-emerald-700" : "text-muted"}`}>{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon, color = "text-ink" }) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <strong className={`mt-3 block text-4xl font-extrabold ${color}`}>{value}</strong>
    </article>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser, logout } = useAuth();
  const { toast, showToast, clearToast } = useToast();

  // ── Admin guard: admins should never be on /dashboard ──────────────────────
  useEffect(() => {
    if (user?.role === "Admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const { matches, loadingMatches } = useActiveMatches();
  const [incomingCount, setIncomingCount] = useState(0);

  // ── Account Security State ───────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showToast("New passwords do not match", "error");
    }
    setUpdatingPassword(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      showToast("Password updated successfully", "success");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleLogoutAll() {
    setLoggingOutAll(true);
    try {
      await apiRequest("/api/auth/logout-all", { method: "POST" });
      logout();
      navigate("/login");
    } catch (err) {
      showToast(err.message, "error");
      setLoggingOutAll(false);
      setShowLogoutAllModal(false);
    }
  }

  // ── Photo upload state ────────────────────────────────────────────────────
  const { uploadPhoto, uploading: uploadingPhoto } = usePhotoUpload();
  const photoInputRef = useRef(null);

  // ── Delete account state ───────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Profile photo upload ──────────────────────────────────────────────────
  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!deletePassword) return showToast("Please enter your password to confirm.");
    try {
      setDeletingAccount(true);
      await apiRequest("/api/auth/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword })
      });
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      showToast(err.message || "Failed to delete account.");
      setDeletingAccount(false);
    }
  }

  if (!user) return <div className="flex h-96 items-center justify-center"><Spinner /></div>;

  const avatarUrl = getProfileImageSrc(user.profileImage, user.name || "U", 200);
  const completion = user.profileCompletion || 0;

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <main className="mx-auto w-full max-w-6xl space-y-5 p-4">

        {/* ──── USER CARD ──────────────────────────────────────────────────── */}
        <section className="surface-card premium-shell grid gap-6 overflow-hidden p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
          
          {/* Hidden file input (shared for both views) */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* DESKTOP VIEW */}
          <div className="hidden md:flex items-center gap-5">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt={user.name}
                onError={(e) => handleImageError(e, user.name || "U")}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-xl sm:h-28 sm:w-28"
              />
              {/* Hover overlay to prompt photo change */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change profile photo"
              >
                {uploadingPhoto ? (
                  <Spinner className="h-6 w-6 border-white/40 border-t-white" />
                ) : (
                  <>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="mt-1 text-xs font-bold text-white">Change</span>
                  </>
                )}
              </button>
              {user.isProfileVerified && (
                <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-lg" title="Profile Verified">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-3xl leading-none text-ink sm:text-4xl">{user.name}</h1>
              <p className="mt-1 text-sm font-bold text-brand-700">{user.memberId || "KOL-XXXXX"}</p>
              <p className="mt-1 text-xs text-muted">{user.city && user.state ? `${user.city}, ${user.state}` : user.email}</p>
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-center gap-2 lg:items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted">Trust Score</span>
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-extrabold text-brand-700">{user.trustScore || 0}%</span>
            </div>
            <div className="h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/10 lg:ml-auto">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                style={{ width: `${user.trustScore || 0}%` }}
              />
            </div>
          </div>

          {/* MOBILE VIEW (<768px) */}
          <div className="md:hidden flex items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt={user.name}
                onError={(e) => handleImageError(e, user.name || "U")}
                className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-md"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity cursor-pointer active:opacity-100"
                title="Change profile photo"
              >
                {uploadingPhoto ? (
                  <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                ) : (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {user.isProfileVerified && (
                <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-lg" title="Profile Verified">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <h1 className="font-serif text-2xl leading-none text-ink truncate">{user.name}</h1>
              <p className="mt-0.5 text-xs font-bold text-brand-700 truncate">{user.memberId || "KOL-XXXXX"}</p>
              <p className="text-[10px] text-muted truncate">{user.city && user.state ? `${user.city}, ${user.state}` : user.email}</p>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3 mt-2 border-t border-ink/5 pt-3">
            <span className="text-xs font-bold text-muted shrink-0">Trust Score</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-700"
                style={{ width: `${user.trustScore || 0}%` }}
              />
            </div>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-extrabold text-brand-700 shrink-0">{user.trustScore || 0}%</span>
          </div>

        </section>

        {/* ──── VERIFICATION STATUS ────────────────────────────────────────── */}
        {/* DESKTOP */}
        <section className="hidden md:grid surface-card gap-4 p-6 sm:grid-cols-3">
          <VerificationBadge label="Email Verified"       verified={user.isEmailVerified} />
          <VerificationBadge label="Phone Verified"       verified={user.isPhoneVerified} />
          <VerificationBadge label="Profile Verified (KYC)" verified={user.isProfileVerified} />
        </section>

        {/* MOBILE */}
        <details className="md:hidden surface-card group p-4 cursor-pointer">
          <summary className="font-bold text-sm text-ink outline-none list-none flex justify-between items-center">
            <span>Verification Status</span>
            <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="grid gap-3 mt-4 pt-2 border-t border-ink/5">
            <VerificationBadge label="Email Verified"       verified={user.isEmailVerified} />
            <VerificationBadge label="Phone Verified"       verified={user.isPhoneVerified} />
            <VerificationBadge label="Profile Verified (KYC)" verified={user.isProfileVerified} />
          </div>
        </details>

        {/* ──── STATS ──────────────────────────────────────────────────────── */}
        {/* DESKTOP */}
        <section className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Profile Views"     value={user.profileViews || 0}         icon="👁️" />
          <StatCard label="Interests Received" value={incomingCount} icon="💌" color="text-amber-600" />
          <StatCard label="Matches Accepted"  value={user.matchesAccepted || 0}      icon="💑" color="text-emerald-600" />
          <StatCard label="Profile Complete"  value={`${completion}%`}               icon="📋" color="text-brand-700" />
        </section>

        {/* MOBILE */}
        <section className="md:hidden grid grid-cols-2 gap-3">
          {[
            { label: "Views", value: user.profileViews || 0, icon: "👁️", color: "text-ink" },
            { label: "Interests", value: incomingCount, icon: "💌", color: "text-amber-600" },
            { label: "Matches", value: user.matchesAccepted || 0, icon: "💑", color: "text-emerald-600" },
            { label: "Complete", value: `${completion}%`, icon: "📋", color: "text-brand-700" },
          ].map((stat, i) => (
            <article key={i} className="surface-card p-3 flex items-center gap-2">
              <span className="text-xl shrink-0">{stat.icon}</span>
              <div className="flex flex-col overflow-hidden">
                <strong className={`text-xl font-extrabold leading-none ${stat.color} truncate`}>{stat.value}</strong>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted mt-0.5 truncate">{stat.label}</p>
              </div>
            </article>
          ))}
        </section>

        {/* ──── INCOMING INTERESTS ────────────────────────────────── */}
        <IncomingInterests onCountChange={setIncomingCount} />

        {/* ──── MY CONVERSATIONS (accepted matches) ────────────────── */}
        <Conversations myId={user._id} />

        {/* ──── PROFILE COMPLETION PROMPT ───────────────────────────────────── */}
        {completion < 100 && (
          <section className="surface-card flex flex-col gap-4 border-l-4 border-amber-400 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-ink">Complete your profile</h3>
              <p className="mt-1 text-sm text-muted">
                Your profile is {completion}% complete. A fully completed profile gets up to <strong>5× more views</strong>.
              </p>
              <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <Link to="/onboarding" className="btn-primary shrink-0">Continue Setup</Link>
          </section>
        )}

        {/* ──── QUICK ACTIONS ─────────────────────────────────────────────── */}
        {/* DESKTOP */}
        <section className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/onboarding" className="surface-card interactive-card flex items-center gap-4 p-5">
            <span className="text-3xl">✏️</span>
            <div>
              <strong className="text-ink">Edit Profile</strong>
              <p className="text-xs text-muted">Update details</p>
            </div>
          </Link>
          <Link to="/kyc" className="surface-card interactive-card flex items-center gap-4 p-5">
            <span className="text-3xl">🛡️</span>
            <div>
              <strong className="text-ink">Upload Documents</strong>
              <p className="text-xs text-muted">Identity &amp; Job</p>
            </div>
          </Link>
          <Link to="/profiles" className="surface-card interactive-card flex items-center gap-4 p-5">
            <span className="text-3xl">❤️</span>
            <div>
              <strong className="text-ink">Find Matches</strong>
              <p className="text-xs text-muted">View recommendations</p>
            </div>
          </Link>
          <div className="surface-card flex cursor-not-allowed items-center gap-4 p-5 opacity-60">
            <span className="text-3xl">⭐</span>
            <div>
              <strong className="text-ink">Wishlist</strong>
              <p className="text-xs text-muted">Coming Soon</p>
            </div>
          </div>
        </section>

        {/* MOBILE */}
        <details className="md:hidden surface-card group p-4 cursor-pointer">
          <summary className="font-bold text-sm text-ink outline-none list-none flex justify-between items-center">
            <span>Quick Actions</span>
            <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-2 border-t border-ink/5">
            <Link to="/onboarding" className="rounded-xl border border-ink/5 bg-slate-50 p-3 flex flex-col items-center text-center gap-2 active:bg-slate-100 transition-colors">
              <span className="text-2xl">✏️</span>
              <strong className="text-xs text-ink">Edit Profile</strong>
            </Link>
            <Link to="/kyc" className="rounded-xl border border-ink/5 bg-slate-50 p-3 flex flex-col items-center text-center gap-2 active:bg-slate-100 transition-colors">
              <span className="text-2xl">🛡️</span>
              <strong className="text-xs text-ink">Upload Docs</strong>
            </Link>
            <Link to="/profiles" className="rounded-xl border border-ink/5 bg-slate-50 p-3 flex flex-col items-center text-center gap-2 active:bg-slate-100 transition-colors">
              <span className="text-2xl">❤️</span>
              <strong className="text-xs text-ink">Find Matches</strong>
            </Link>
            <div className="rounded-xl border border-ink/5 bg-slate-50 p-3 flex flex-col items-center text-center gap-2 opacity-60 cursor-not-allowed">
              <span className="text-2xl">⭐</span>
              <strong className="text-xs text-ink">Wishlist</strong>
            </div>
          </div>
        </details>

        {/* ──── CONTENT SPLIT: RECENT MATCHES & ACCOUNT INFO ─────────────── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* RECENT MATCHES */}
          <section className="surface-card flex flex-col p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-serif text-2xl text-ink">Recent Matches</h2>
              <Link to="/profiles" className="text-sm font-bold text-brand-600 hover:text-brand-800">Browse New →</Link>
            </div>
            <div className="flex-1">
              {loadingMatches ? (
                <div className="flex h-32 items-center justify-center"><Spinner /></div>
              ) : matches.length > 0 ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {matches.slice(0, 4).map(match => (
                    <li key={match.matchId} className="flex items-center gap-4 rounded-xl border border-ink/5 bg-slate-50 p-3">
                      <img
                        src={getProfileImageSrc(match.user.image, match.user.name, 48)}
                        alt={match.user.name}
                        loading="lazy"
                        onError={(e) => handleImageError(e, match.user.name)}
                        className="h-12 w-12 rounded-full object-cover shadow"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-bold text-ink">{match.user.name}</p>
                        <p className="truncate text-xs text-muted">
                          {match.user.maritalStatus || "Single"} • {match.user.gender}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-slate-50/50 p-8 text-center">
                  <p className="text-4xl">🕊️</p>
                  <h3 className="mt-3 font-bold text-ink">No Matches Yet</h3>
                  <p className="mt-1 text-sm text-muted">Browse profiles and send an interest to get started.</p>
                  <Link to="/profiles" className="btn-secondary mt-4">Discover Profiles</Link>
                </div>
              )}
            </div>
          </section>

          {/* ACCOUNT DETAILS SNAPSHOT */}
          {/* DESKTOP */}
          <section className="hidden md:block surface-card p-6">
            <h2 className="border-b border-ink/10 pb-4 font-serif text-xl text-ink">Account Overview</h2>
            <dl className="mt-4 space-y-4 text-sm">
              {[
                ["Email",      user.email],
                ["Phone",      user.phone ? `+91 ${user.phone.slice(0,2)}***${user.phone.slice(-2)}` : "None"],
                ["Religion",   user.religion],
                ["Education",  user.education],
                ["Profession", user.profession]
              ].map(([label, value]) => {
                if (!value) return null;
                return (
                  <div key={label} className="flex flex-col">
                    <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
                    <dd className="mt-1 font-semibold text-ink">{value}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-6 border-t border-ink/10 pt-4">
              <Link to="/onboarding" className="flex items-center justify-between text-sm font-bold text-brand-600 hover:text-brand-800">
                Update Information <span>→</span>
              </Link>
            </div>

            {/* Account Security Options */}
            <div className="mt-6 border-t border-ink/10 pt-4">
              <h3 className="text-sm font-bold text-ink mb-3">Security & Access</h3>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="text-left text-sm font-bold text-brand-600 transition hover:text-brand-800"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutAllModal(true)}
                  className="text-left text-sm font-bold text-amber-600 transition hover:text-amber-700"
                >
                  Logout from all devices
                </button>
              </div>
            </div>

            {/* Delete Account option */}
            <div className="mt-6 border-t border-red-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-sm font-bold text-red-500 transition hover:text-red-700"
              >
                Delete Account
              </button>
              <p className="mt-1 text-xs text-muted">Permanently removes all your data.</p>
            </div>
          </section>

          {/* MOBILE */}
          <details className="md:hidden surface-card group p-4 cursor-pointer">
            <summary className="font-bold text-sm text-ink outline-none list-none flex justify-between items-center">
              <span>Account Overview & Security</span>
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-4 pt-4 border-t border-ink/5">
              <dl className="space-y-3 text-sm">
                {[
                  ["Email",      user.email],
                  ["Phone",      user.phone ? `+91 ${user.phone.slice(0,2)}***${user.phone.slice(-2)}` : "None"],
                  ["Religion",   user.religion],
                  ["Education",  user.education],
                  ["Profession", user.profession]
                ].map(([label, value]) => {
                  if (!value) return null;
                  return (
                    <div key={label} className="flex justify-between items-center">
                      <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
                      <dd className="font-semibold text-ink">{value}</dd>
                    </div>
                  );
                })}
              </dl>
              
              <div className="mt-5 pt-4 border-t border-ink/5 flex flex-col gap-4">
                <Link to="/onboarding" className="text-sm font-bold text-brand-600 flex justify-between items-center">
                  Update Information <span>→</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="text-left text-sm font-bold text-brand-600"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutAllModal(true)}
                  className="text-left text-sm font-bold text-amber-600"
                >
                  Logout from all devices
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-red-100/50">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm font-bold text-red-500"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* ──── INTERESTS I SENT ─────────────────────────────────── */}
        <SentInterests />

        {/* ──── BLOCKED & ARCHIVED USERS ─────────────────────────── */}
        <HiddenUsers />
      </main>

      {/* ──── DELETE ACCOUNT MODAL ───────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
            aria-label="Close modal"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="surface-card relative z-10 w-full max-w-md p-8 shadow-2xl"
          >
            <div className="text-center">
              <p className="text-5xl">⚠️</p>
              <h2 className="mt-4 font-serif text-3xl text-ink">Delete Account?</h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                This action is <strong>permanent and irreversible</strong>. Your profile, matches, documents and all data will be deleted immediately.
              </p>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleDeleteAccount}>
              <PasswordField
                id="delete-password"
                label="Confirm your password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount || !deletePassword}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingAccount ? (
                    <><Spinner className="h-4 w-4 border-red-300 border-t-white" /><span>Deleting...</span></>
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── CHANGE PASSWORD MODAL ───────────────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
          />
          <div className="surface-card relative z-10 w-full max-w-md p-8 shadow-2xl">
            <h2 className="font-serif text-2xl text-ink mb-6">Change Password</h2>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <PasswordField
                id="current-password"
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
              <PasswordField
                id="new-password"
                label="New Password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 8 chars)"
              />
              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {updatingPassword ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── LOGOUT ALL DEVICES MODAL ───────────────────────────────────────────── */}
      {showLogoutAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowLogoutAllModal(false)}
          />
          <div className="surface-card relative z-10 w-full max-w-sm p-8 shadow-2xl text-center">
            <h2 className="font-serif text-2xl text-ink mb-3">Logout from all devices?</h2>
            <p className="text-sm text-muted mb-6">
              This will invalidate all your active sessions, including this one. You will need to log back in.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutAllModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 !shadow-amber-500/30"
              >
                {loggingOutAll ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
