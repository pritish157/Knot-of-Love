import Spinner from "./Spinner";

export default function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="surface-card flex items-center gap-3 px-5 py-4">
        <Spinner />
        <span className="text-sm font-semibold text-muted">Loading experience...</span>
      </div>
    </div>
  );
}
