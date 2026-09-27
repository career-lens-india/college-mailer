import { Component, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] px-6">
        <div className="max-w-md text-center">
          <p className="font-serif text-3xl text-navy">CareerLens</p>
          <h1 className="mt-3 text-lg font-semibold text-navy">Something went wrong.</h1>
          <button
            type="button"
            className="mt-6 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload CareerLens
          </button>
          {import.meta.env.DEV ? (
            <p className="mt-4 text-left text-sm break-words text-muted">{this.state.error.message}</p>
          ) : null}
        </div>
      </div>
    );
  }
}
