"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl border border-rose-500/20 bg-slate-900/90 text-white backdrop-blur-2xl text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-slate-100">
                حدث خطأ في تحميل الصفحة
              </h3>
              <p className="text-sm text-slate-400">
                Something went wrong loading this component. The rest of the app is working normally.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-rose-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة / Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
