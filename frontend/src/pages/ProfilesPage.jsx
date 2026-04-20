import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { ProfileCardSkeleton } from "../components/Skeleton";
import Toast from "../components/Toast";
import { useProfiles } from "../hooks/useProfiles";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/http";
import { communities, defaultFilters, languages, locations, religions } from "../utils/constants";
import { getProfileImageSrc, handleImageError } from "../utils/image";

export default function ProfilesPage() {
  const { user } = useAuth();

  // ── All hooks must be called unconditionally (Rules of Hooks) ────────────
  const {
    profiles,
    filters,
    loading,
    error,
    isDemoData,
    selectedProfile,
    setSelectedProfile,
    refreshProfiles,
    setFilters
  } = useProfiles();

  const { toast, showToast, clearToast } = useToast();
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [sentMap, setSentMap] = useState({}); // mapping of receiverId -> matchId
  const [withdrawingInterest, setWithdrawingInterest] = useState(false);
  const hasFetched = useRef(false);
  const modalRef = useRef(null);

  // ── KYC gate: render wall AFTER hooks (Rules of Hooks require this) ──────
  if (user && !user.isProfileVerified) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="surface-card premium-shell w-full p-10">
          <p className="text-6xl">🔐</p>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-ink">KYC Verification Required</h1>
          <p className="mt-4 text-base leading-8 text-muted">
            To protect all members and maintain trust, profile discovery is available only
            to <strong>admin-verified</strong> users. Complete your KYC to unlock this feature.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/kyc" className="btn-primary">Upload KYC Documents →</Link>
            <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
          </div>
          <p className="mt-6 text-xs text-muted">Verification is typically completed within 24 hours on business days.</p>
        </div>
      </main>
    );
  }

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      refreshProfiles(defaultFilters);
      if (user?.isProfileVerified) {
        fetchSentInterests();
      }
    }
  }, [refreshProfiles, user?.isProfileVerified]);

  async function fetchSentInterests() {
    try {
      const d = await apiRequest("/api/matches/sent");
      const map = {};
      if (d.sent) {
        d.sent.forEach(m => {
          if (m.status === "Pending") map[m.receiverId] = m.matchId;
        });
        setSentMap(map);
      }
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (!selectedProfile) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedProfile(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedProfile, setSelectedProfile]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setLocalFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFilters(localFilters);
    refreshProfiles(localFilters);
  }

  function handleReset() {
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    refreshProfiles(defaultFilters);
  }

  // ✅ Wire Express Interest to POST /api/matches/request
  async function handleExpressInterest(targetUserId) {
    if (!targetUserId) return;
    try {
      setSendingInterest(true);
      await apiRequest("/api/matches/request", {
        method: "POST",
        body: JSON.stringify({ targetUserId })
      });
      showToast("Interest sent successfully! 💚", "success");
      await fetchSentInterests(); // refresh sent list
    } catch (err) {
      // 409 = already sent, still a friendly message
      if (err.message?.includes("already exists")) {
        showToast("You've already expressed interest in this profile.", "success");
        await fetchSentInterests(); // refresh sent list just in case
      } else {
        showToast(err.message || "Could not send interest right now.");
      }
    } finally {
      setSendingInterest(false);
    }
  }

  // ✅ Wire Withdraw Interest to DELETE /api/matches/withdraw/:matchId
  async function handleWithdrawInterest(matchId) {
    if (!matchId) return;
    
    try {
      setWithdrawingInterest(true);
      await apiRequest(`/api/matches/withdraw/${matchId}`, { method: "DELETE" });
      showToast("Interest withdrawn successfully.", "success");
      
      // Update local state to remove from map
      setSentMap(prev => {
        const next = { ...prev };
        // Find and delete the entry
        for (const key in next) {
          if (next[key] === matchId) {
            delete next[key];
            break;
          }
        }
        return next;
      });
    } catch (err) {
      showToast(err.message || "Failed to withdraw interest.");
    } finally {
      setWithdrawingInterest(false);
    }
  }

  return (
    <div className="page-fade">
      <Toast toast={toast} onClose={clearToast} />
      <main className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="surface-card premium-shell p-5 xl:sticky xl:top-24 xl:self-start">
          <div>
            <p className="hero-badge">Profile discovery</p>
            <h1 className="mt-4 font-serif text-4xl leading-none text-ink">
              Find profiles that align with your preferences.
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              Refine with intention and see clearer, more relevant results.
            </p>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <FilterInput label="Minimum age" name="minAge" value={localFilters.minAge} onChange={updateFilter} type="number" />
            <FilterInput label="Maximum age" name="maxAge" value={localFilters.maxAge} onChange={updateFilter} type="number" />
            <FilterSelect label="Location" name="location" value={localFilters.location} onChange={updateFilter} options={locations} defaultLabel="Any location" />

            <button
              type="button"
              className="text-left text-sm font-extrabold text-brand-700 transition hover:text-brand-800"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? "Hide advanced filters ▲" : "Show advanced filters ▼"}
            </button>

            {showAdvanced ? (
              <div className="animate-page-fade space-y-4">
                <FilterSelect label="Religion" name="religion" value={localFilters.religion} onChange={updateFilter} options={religions} defaultLabel="Any religion" />
                <FilterSelect label="Community / caste" name="caste" value={localFilters.caste} onChange={updateFilter} options={communities} defaultLabel="Any community" />
                <FilterSelect label="Mother tongue" name="motherTongue" value={localFilters.motherTongue} onChange={updateFilter} options={languages} defaultLabel="Any language" />
                <FilterInput label="Minimum annual income" name="income" value={localFilters.income} onChange={updateFilter} type="number" />
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 border-white/40 border-t-white" />
                  <span>Loading matches...</span>
                </>
              ) : (
                "Show matches"
              )}
            </button>

            <button type="button" onClick={handleReset} className="btn-secondary w-full">
              Reset filters
            </button>
          </form>
        </aside>

        <section className="grid gap-4">
          <div className="surface-card premium-shell flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="hero-badge">Search results</p>
              <h2 className="mt-4 font-serif text-4xl leading-none text-ink">
                {loading ? "Discovering..." : `Showing ${profiles.length} match${profiles.length === 1 ? "" : "es"}`}
              </h2>
            </div>
            {!loading && profiles.length > 0 && (
              <p className="max-w-xl text-sm leading-7 text-muted">
                Click a profile card to view their details and express interest.
              </p>
            )}
          </div>

          {isDemoData && !loading && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Showing sample profiles while we connect to our servers. Real profiles will appear shortly.
            </div>
          )}

          {error && <div className="status-error">{error}</div>}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileCardSkeleton />
              <ProfileCardSkeleton />
              <ProfileCardSkeleton />
              <ProfileCardSkeleton />
            </div>
          ) : profiles.length === 0 ? (
            <EmptyState
              title="No profiles found"
              message="Try widening your search filters or removing one or two to find more matches."
              actionText="Reset filters"
              onAction={handleReset}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {profiles.map((profile) => (
                <ProfileCard key={profile._id || profile.name} profile={profile} onSelect={setSelectedProfile} />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedProfile(null)}
            aria-label="Close modal"
          />
          <div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProfile.name}'s profile details`}
            className="surface-card premium-shell relative z-10 w-full max-w-3xl overflow-y-auto p-4 sm:p-6"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-serif text-3xl leading-none text-ink">{selectedProfile.name}</h3>
              <button type="button" className="btn-ghost !min-h-10 !px-4" onClick={() => setSelectedProfile(null)}>
                Close
              </button>
            </div>
            
            <div className="mt-6 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-xl">
                <img
                  src={getProfileImageSrc(selectedProfile.image, selectedProfile.name || "U", 400)}
                  alt={`${selectedProfile.name} profile`}
                  loading="lazy"
                  onError={(e) => handleImageError(e, selectedProfile.name || "U")}
                  className="h-full w-full object-cover"
                />
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="hero-badge">About</p>
                  <p className="mt-4 text-base leading-8 text-muted">{selectedProfile.bio || "No bio available."}</p>
                </div>

                <dl className="grid gap-4 border-t pt-6 sm:grid-cols-2">
                  <DetailRow label="Age" value={`${selectedProfile.age} years`} />
                  <DetailRow label="Location" value={selectedProfile.location} />
                  <DetailRow label="Religion" value={selectedProfile.religion} />
                  <DetailRow label="Mother tongue" value={selectedProfile.motherTongue} />
                  <DetailRow label="Profession" value={selectedProfile.occupation} />
                  <DetailRow label="Income" value={selectedProfile.formattedIncome} />
                </dl>
                
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {sentMap[selectedProfile._id] ? (
                    <button
                      type="button"
                      className="w-full rounded-full border border-red-500 bg-red-50 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      disabled={withdrawingInterest}
                      onClick={() => handleWithdrawInterest(sentMap[selectedProfile._id])}
                    >
                      {withdrawingInterest ? (
                        <><Spinner className="mr-2 inline-block h-4 w-4 border-red-600/40 border-t-red-600" /><span>Withdrawing...</span></>
                      ) : (
                        "❌ Withdraw Interest"
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-primary w-full"
                        disabled={sendingInterest}
                        onClick={() => handleExpressInterest(selectedProfile._id)}
                      >
                        {sendingInterest ? (
                          <><Spinner className="mr-2 inline-block h-4 w-4 border-white/40 border-t-white" /><span>Sending...</span></>
                        ) : (
                          "❤️ Express Interest"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() => setSelectedProfile(null)}
                      >
                        👎 Not Interested
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterInput({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="input-label">
        {label}
      </label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} className="input-field" />
    </div>
  );
}

function FilterSelect({ label, name, value, onChange, options, defaultLabel }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="input-label">
        {label}
      </label>
      <select id={name} name={name} value={value} onChange={onChange} className="input-field">
        <option value="">{defaultLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-extrabold uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1 text-base font-bold text-ink">{value || "Not specified"}</dd>
    </div>
  );
}
