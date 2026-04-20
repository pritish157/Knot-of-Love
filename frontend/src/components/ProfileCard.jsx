import { memo } from "react";
import { getProfileImageSrc, handleImageError } from "../utils/image";

const ProfileCard = memo(function ProfileCard({ profile, onSelect }) {
  const imageSrc = getProfileImageSrc(profile.image, profile.name || "U", 400);

  return (
    <article
      className="surface-card-soft interactive-card group cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      aria-label={`View ${profile.name}'s profile`}
      onClick={() => onSelect(profile)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(profile); } }}
    >
      <div className="relative overflow-hidden">
        <img
          src={imageSrc}
          alt={`${profile.name} profile`}
          loading="lazy"
          width={400}
          height={300}
          onError={(e) => handleImageError(e, profile.name || "U")}
          className={`aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.04] ${profile.isBlurred ? "blur-mask" : ""}`}
        />
        {profile.isBlurred && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="rounded-2xl bg-white/40 px-4 py-3 backdrop-blur-md">
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-brand-900">Verify to see photos</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent" />
        {profile.isVerified && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </div>
        )}
        {profile.trustScore >= 70 && (
          <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[0.6rem] font-bold text-brand-700 backdrop-blur-md shadow">
            {profile.trustScore}% Trust
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-ink">{profile.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {profile.age ? `${profile.age} yrs` : ""}{profile.location ? ` • ${profile.location}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-700">View</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            profile.religion,
            profile.education,
            profile.profession,
            profile.maritalStatus
          ].filter(Boolean).map((tag) => (
            <span
              key={`${profile._id}-${tag}`}
              className="rounded-full border border-ink/10 bg-[#faf3ec] px-2.5 py-1.5 text-[0.65rem] font-bold text-muted transition duration-300 group-hover:bg-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
});

export default ProfileCard;
