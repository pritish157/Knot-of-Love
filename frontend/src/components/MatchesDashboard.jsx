import { useActiveMatches } from "../hooks/useActiveMatches";
import Spinner from "../components/Spinner";

export default function MatchesDashboard() {
  const { matches, loadingMatches } = useActiveMatches();

  if (loadingMatches) return <Spinner />;

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-2xl text-ink">My Successful Matches ({matches.length})</h3>
      {matches.length === 0 ? (
        <div className="surface-card p-10 text-center text-muted">
          Your accepted matches will appear here. Start expressing interest in profiles to see them here!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map(m => (
            <div key={m.matchId} className="surface-card-soft flex items-center gap-4 p-4 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-brand-500/10 flex items-center justify-center font-bold text-brand-700">
                {m.user.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-ink">{m.user.name}</div>
                <div className="text-xs text-muted">{m.user.maritalStatus} • Matched on {new Date(m.since).toLocaleDateString()}</div>
              </div>
              <button className="btn-ghost !min-h-8 !px-3 !text-xs">Chat</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
