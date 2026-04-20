import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/http";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { usePhotoUpload } from "../hooks/usePhotoUpload";
import Spinner from "../components/Spinner";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const STEP_LABELS = [
  "Identity", "Religion & Education", "Account", "Background",
  "Career", "Lifestyle", "Physical", "Habits",
  "Phone Verification", "Partner Preferences", "Advanced Prefs", "Bio"
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const [constants, setConstants] = useState(null);
  const [step, setStep] = useState(user?.onboardingStep || 1);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const { uploadPhoto, uploading: uploadingPhoto } = usePhotoUpload();

  const [constantsError, setConstantsError] = useState(null);

  useEffect(() => {
    apiRequest("/api/auth/constants")
      .then(setConstants)
      .catch((err) => setConstantsError(err.message || "Failed to load options"));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        creatingFor: user.creatingFor || "Self",
        gender: user.gender || "",
        maritalStatus: user.maritalStatus || "",
        religion: user.religion || "",
        subCaste: user.subCaste || "",
        education: user.education || "",
        country: user.country || "",
        livingInSince: user.livingInSince || "",
        placeOfBirth: user.placeOfBirth || "",
        nationality: user.nationality || "",
        visaStatus: user.visaStatus || "",
        ethnicity: user.ethnicity || "",
        profession: user.profession || "",
        incomeRange: user.incomeRange || "",
        state: user.state || "",
        city: user.city || "",
        livingWithFamily: user.livingWithFamily || "",
        height: user.height || "",
        weight: user.weight || "",
        bodyType: user.bodyType || "",
        familyStatus: user.familyStatus || "",
        complexion: user.complexion || "",
        diet: user.diet || "",
        drinking: user.drinking || "",
        smoking: user.smoking || "",
        bio: user.bio || "",
        twoFactorConsent: user.twoFactorConsent || false,
        partnerPreferences: user.partnerPreferences || {}
      });
    }
  }, [user]);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updatePref(key, value) {
    setForm(prev => ({
      ...prev,
      partnerPreferences: { ...prev.partnerPreferences, [key]: value }
    }));
  }

  function validateStep(s) {
    if (s === 1) return form.creatingFor && form.gender && form.maritalStatus;
    if (s === 2) return form.religion && form.education;
    if (s === 4) return form.country && form.nationality && form.visaStatus;
    if (s === 5) return form.profession && form.incomeRange;
    if (s === 6) return form.state && form.city;
    if (s === 7) return form.height && form.bodyType && form.familyStatus;
    if (s === 8) return form.diet && form.drinking && form.smoking;
    if (s === 12) return form.bio?.length >= 50; // photo upload is separate; not a hard blocker
    return true; // other steps optional or already have defaults
  }

  async function saveStep() {
    if (!validateStep(step)) {
      return showToast("Please fill all required fields correctly to proceed.", "error");
    }

    try {
      setSaving(true);
      const body = { step, ...form };
      const data = await apiRequest("/api/auth/onboarding", {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      if (data.user) updateUser(data.user);
      showToast(`Step ${step} saved!`, "success");

      if (step < 12) {
        setStep(step + 1);
      } else {
        showToast("Profile complete! Redirecting...", "success");
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadPhoto() {
    if (!photoFile) return showToast("Select a photo first.");
    await uploadPhoto(photoFile);
  }

  if (constantsError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="text-red-600 font-bold">{constantsError}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
      </div>
    );
  }

  if (!constants) return <div className="flex h-96 items-center justify-center"><Spinner /></div>;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4">
      <Toast toast={toast} onClose={clearToast} />

      {/* ─── Progress ──────────────────────────────────────────────────── */}
      <section className="surface-card p-6">
        <div className="flex items-center justify-between">
          <p className="hero-badge">Step {step} of 12</p>
          <span className="text-sm font-bold text-muted">{STEP_LABELS[step - 1]}</span>
        </div>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              onClick={() => i + 1 <= (user?.onboardingStep || 1) && setStep(i + 1)}
              className={`h-2 flex-1 rounded-full transition-all ${
                i + 1 <= step ? "bg-brand-gradient" : "bg-ink/10"
              } ${i + 1 <= (user?.onboardingStep || 1) ? "cursor-pointer" : "cursor-not-allowed"}`}
            />
          ))}
        </div>
      </section>

      {/* ─── Step Content ──────────────────────────────────────────────── */}
      <section className="surface-card space-y-5 p-6">
        {step === 1 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Your Identity</h2>
            <Select label="Creating profile for" value={form.creatingFor} onChange={v => update("creatingFor", v)} options={constants.creatingFor} />
            <Select label="Gender" value={form.gender} onChange={v => update("gender", v)} options={constants.genders} />
            <Select label="Marital Status" value={form.maritalStatus} onChange={v => update("maritalStatus", v)} options={constants.maritalStatuses} />
            {form.maritalStatus === "Widowed" && (
              <div className="rounded-2xl border border-brand-500/10 bg-brand-500/5 p-4 text-sm italic text-brand-800">
                "We understand that starting a new chapter takes courage. We're here to help you find a companion who respects your journey."
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Religion & Education</h2>
            <Select label="Religion" value={form.religion} onChange={v => { update("religion", v); update("subCaste", ""); }} options={Object.keys(constants.religions)} />
            {form.religion && constants.religions[form.religion] && (
              <Select label="Sub-community" value={form.subCaste} onChange={v => update("subCaste", v)} options={constants.religions[form.religion]} />
            )}
            <Select label="Education" value={form.education} onChange={v => update("education", v)} options={constants.educationLevels} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Account Details</h2>
            <p className="text-muted">Your email <strong className="text-brand-700">{user?.email}</strong> and password were set during registration.</p>
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              ✅ Account already created. Continue to the next step.
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Location & Background</h2>
            <Select label="Country" value={form.country} onChange={v => update("country", v)} options={constants.countries} />
            <Input label="Living in country since (year)" value={form.livingInSince} onChange={v => update("livingInSince", v)} type="number" placeholder="e.g. 2010" />
            <Input label="Place of Birth" value={form.placeOfBirth} onChange={v => update("placeOfBirth", v)} placeholder="e.g. Mumbai" />
            <Select label="Nationality" value={form.nationality} onChange={v => update("nationality", v)} options={constants.nationalities} />
            <Select label="Visa Status" value={form.visaStatus} onChange={v => update("visaStatus", v)} options={constants.visaStatuses} />
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Career & Income</h2>
            <Select label="Ethnicity" value={form.ethnicity} onChange={v => update("ethnicity", v)} options={constants.ethnicities} />
            <Select label="Profession" value={form.profession} onChange={v => update("profession", v)} options={constants.professions} />
            <Select label="Annual Income" value={form.incomeRange} onChange={v => update("incomeRange", v)} options={constants.incomeRanges} />
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Lifestyle</h2>
            <Select label="State" value={form.state} onChange={v => update("state", v)} options={constants.indianStates} />
            <Input label="City" value={form.city} onChange={v => update("city", v)} placeholder="e.g. Pune" />
            <Select label="Living with Family" value={form.livingWithFamily} onChange={v => update("livingWithFamily", v)} options={["Yes", "No"]} />
          </>
        )}

        {step === 7 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Physical Attributes</h2>
            <Select label="Height" value={form.height} onChange={v => update("height", v)} options={constants.heights} />
            <Input label="Weight (kg)" value={form.weight} onChange={v => update("weight", v)} type="number" placeholder="e.g. 65" />
            <Select label="Body Type" value={form.bodyType} onChange={v => update("bodyType", v)} options={constants.bodyTypes} />
            <Select label="Family Status" value={form.familyStatus} onChange={v => update("familyStatus", v)} options={constants.familyStatuses} />
          </>
        )}

        {step === 8 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Habits</h2>
            <Select label="Complexion" value={form.complexion} onChange={v => update("complexion", v)} options={constants.complexions} />
            <Select label="Diet" value={form.diet} onChange={v => update("diet", v)} options={constants.diets} />
            <Select label="Drinking" value={form.drinking} onChange={v => update("drinking", v)} options={constants.drinkingHabits} />
            <Select label="Smoking" value={form.smoking} onChange={v => update("smoking", v)} options={constants.smokingHabits} />
          </>
        )}

        {step === 9 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Phone Verification</h2>
            <p className="text-muted">Your phone <strong>{user?.phone}</strong> is {user?.isPhoneVerified ? "verified ✅" : "not yet verified"}.</p>
            {!user?.isPhoneVerified && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Phone verification via OTP will be available soon. For now, please continue.
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.twoFactorConsent}
                onChange={e => update("twoFactorConsent", e.target.checked)}
                className="h-5 w-5 rounded border-ink/20 accent-brand-600"
              />
              <span className="text-sm text-ink">I consent to two-factor authentication for added security</span>
            </label>
          </>
        )}

        {step === 10 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Partner Preferences</h2>
            <Select label="Preferred Marital Status" value={(form.partnerPreferences?.maritalStatus || [])[0] || ""} onChange={v => updatePref("maritalStatus", [v])} options={constants.maritalStatuses} />
            <Select label="Preferred Religion" value={(form.partnerPreferences?.religions || [])[0] || ""} onChange={v => updatePref("religions", [v])} options={Object.keys(constants.religions)} />
            <Select label="Preferred Education" value={(form.partnerPreferences?.education || [])[0] || ""} onChange={v => updatePref("education", [v])} options={constants.educationLevels} />
          </>
        )}

        {step === 11 && (
          <>
            <h2 className="font-serif text-3xl text-ink">Advanced Preferences</h2>
            <Select label="Country Preference" value={(form.partnerPreferences?.countries || [])[0] || ""} onChange={v => updatePref("countries", [v])} options={constants.countries} />
            <Input label="Minimum Age" value={form.partnerPreferences?.minAge || 18} onChange={v => updatePref("minAge", Number(v))} type="number" />
            <Input label="Maximum Age" value={form.partnerPreferences?.maxAge || 60} onChange={v => updatePref("maxAge", Number(v))} type="number" />
            <Select label="Drinking Preference" value={form.partnerPreferences?.drinkingPreference || ""} onChange={v => updatePref("drinkingPreference", v)} options={["No Preference", ...constants.drinkingHabits]} />
            <Select label="Smoking Preference" value={form.partnerPreferences?.smokingPreference || ""} onChange={v => updatePref("smokingPreference", v)} options={["No Preference", ...constants.smokingHabits]} />
          </>
        )}

        {step === 12 && (
          <>
            <h2 className="font-serif text-3xl text-ink">About Yourself</h2>
            <div className="space-y-2">
              <label className="input-label">Profile Photo</label>
              <div className="flex items-center gap-4">
                {user?.profileImage && (
                  <img
                    src={getProfileImageSrc(user.profileImage, user.name || "U", 80)}
                    alt="Profile"
                    onError={(e) => handleImageError(e, user.name || "U")}
                    className="h-20 w-20 rounded-2xl object-cover shadow"
                  />
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-700" />
                  <button type="button" onClick={handleUploadPhoto} disabled={uploadingPhoto} className="btn-secondary mt-2 !text-xs">
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="input-label">Bio (minimum 50 characters)</label>
              <textarea
                value={form.bio}
                onChange={e => update("bio", e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Tell potential matches about yourself, your values, interests, and what you're looking for..."
                className="input-field resize-none"
              />
              <p className={`text-xs ${form.bio.length >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
                {form.bio.length}/2000 characters {form.bio.length < 50 && `(${50 - form.bio.length} more needed)`}
              </p>
            </div>
          </>
        )}
      </section>

      {/* ─── Navigation ────────────────────────────────────────────────── */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <button onClick={saveStep} disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : step === 12 ? "Complete Profile" : "Save & Continue →"}
        </button>
      </div>
    </main>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input-field">
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}
