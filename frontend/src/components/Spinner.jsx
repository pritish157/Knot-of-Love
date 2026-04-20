export default function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500 ${className}`}
      aria-hidden="true"
    />
  );
}
