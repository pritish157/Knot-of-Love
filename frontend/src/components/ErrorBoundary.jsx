import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="surface-card max-w-md p-8">
            <p className="text-5xl">⚠️</p>
            <h1 className="mt-6 font-serif text-3xl font-bold text-ink">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6 w-full"
            >
              Refresh the page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
