// src/components/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-3">😕</div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Algo correu mal
            </h1>
            <p className="text-sm text-slate-600 mb-5">
              Pedimos desculpa. Já registámos o erro e vamos corrigir.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center rounded-full bg-[#1F1F3D] text-white text-sm font-semibold px-5 py-2.5"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
