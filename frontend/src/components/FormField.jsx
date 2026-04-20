export default function FormField({ id, label, error, children }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      {children}
      <p className="min-h-5 text-sm text-red-600" role="alert">
        {error || ""}
      </p>
    </div>
  );
}
