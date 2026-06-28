"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 p-6">
          <div className="relative w-full max-w-lg text-center space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
            <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
              Oops! Something went wrong.
            </h1>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Something went wrong and the play has been stopped.
              <br />
              حدث خطأ ما وتم إيقاف اللعب.
            </p>

            {/* Error details (collapsed by default for devs) */}
            {this.state.error && (
              <details className="text-left bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                  Technical Details / تفاصيل تقنية
                </summary>
                <pre className="mt-2 text-xs text-red-500 dark:text-red-400 overflow-auto max-h-32 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            </div>

            {/* Try Again Button */}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="text-xl">🔄</span>
              <span>Try Again / حاول مجدداً</span>
            </button>

            {/* Decorative football */}
            <div className="absolute -bottom-10 -right-6 text-8xl opacity-10 select-none pointer-events-none">
              ⚽
            </div>
            <div className="absolute -top-8 -left-4 text-6xl opacity-10 select-none pointer-events-none">
              🏟️
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
