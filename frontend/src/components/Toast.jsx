export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === "success";
  
  return (
    <div 
      className="fixed right-6 top-6 z-[60] max-w-sm animate-page-fade" 
      role="alert" 
      aria-live="polite"
    >
      <div className={`flex items-center gap-4 rounded-3xl border p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
        isSuccess 
          ? "border-emerald-500/20 bg-emerald-50/90 text-emerald-800" 
          : "border-red-500/20 bg-red-50/90 text-red-800"
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          isSuccess ? "bg-emerald-500/10" : "bg-red-500/10"
        }`}>
          {isSuccess ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-bold tracking-tight">{toast.message}</p>
        </div>

        <button 
          onClick={onClose}
          className="rounded-xl p-2 transition-colors hover:bg-black/5"
          aria-label="Close"
        >
          <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
