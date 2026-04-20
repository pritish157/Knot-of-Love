import { useState } from "react";

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  helperText
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="input-field pr-20"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-brand-700"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {helperText ? <p className="text-sm text-muted">{helperText}</p> : null}
      <p className="min-h-5 text-sm text-red-600">{error || ""}</p>
    </div>
  );
}
