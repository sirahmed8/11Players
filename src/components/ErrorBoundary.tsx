"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

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
            {/* Red Card */}
            <div className="mx-auto w-28 h-40 rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/30 flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0 duration-500">
              <span className="text-6xl select-none">🟥</span>
            </div>

            {/* Title - bilingual */}
            <h1 className="text-3xl md:text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">
              Red Card! 🚫
            </h1>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              بطاقة حمراء! حدث خطأ غير متوقع
            </p>

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
