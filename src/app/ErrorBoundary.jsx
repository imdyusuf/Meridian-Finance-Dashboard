import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Last line of defense — catches render errors anywhere below the app
 * root and offers a clean recovery path instead of a white screen.
 */
export class ErrorBoundary extends Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? "Unexpected error" };
  }

  componentDidCatch(error, info) {
    console.error("[Meridian] Unhandled render error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {this.state.message || "An unexpected error interrupted this view."}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Reload application
          </button>
        </div>
      </div>
    );
  }
}
