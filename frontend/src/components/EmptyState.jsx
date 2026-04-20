import { Link } from "react-router-dom";

export default function EmptyState({ title, message, actionText, actionLink, onAction }) {
  return (
    <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10 text-brand-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-10 w-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <h3 className="mt-6 font-serif text-3xl text-ink">{title}</h3>
      <p className="mt-3 max-w-sm text-base leading-8 text-muted">{message}</p>
      {actionText && (
        <div className="mt-8">
          {actionLink ? (
            <Link to={actionLink} className="btn-primary">
              {actionText}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
