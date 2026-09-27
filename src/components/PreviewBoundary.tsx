import { Component, type ReactNode } from "react";

type PreviewBoundaryProps = {
  resetKey: string;
  children: ReactNode;
};

type PreviewBoundaryState = {
  failed: boolean;
  resetKey: string;
};

export class PreviewBoundary extends Component<PreviewBoundaryProps, PreviewBoundaryState> {
  state: PreviewBoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<PreviewBoundaryState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: PreviewBoundaryProps,
    state: PreviewBoundaryState,
  ): Partial<PreviewBoundaryState> | null {
    if (props.resetKey !== state.resetKey) return { failed: false, resetKey: props.resetKey };
    return null;
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="px-6 py-10 text-center" role="alert">
          <p className="text-sm font-semibold text-navy">Preview unavailable</p>
          <p className="mt-2 text-sm text-muted">Try another template.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
