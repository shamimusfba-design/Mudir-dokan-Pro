import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShoppingBag } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-rose-100 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-black text-slate-900">
              মুদি দোকান প্রো লোড হতে সাময়িক সমস্যা হয়েছে
            </h2>

            <p className="text-xs text-slate-500 leading-relaxed">
              সিস্টেমটি নিরাপদে রিস্টার্ট করতে নিচের বাটন ব্যবহার করুন। আপনার পূর্ববর্তী কোনো গুরুত্বপূর্ণ ডেটা হারাবে না।
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-100 p-3 rounded-xl text-[11px] font-mono text-rose-700 overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>পেজটি রিফ্রেশ করুন</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/demo"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 py-2.5 text-xs font-bold transition"
                >
                  <span>⚡ ফ্রি ডেমো</span>
                </a>
                <a
                  href="/store"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-2.5 text-xs font-bold transition"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>অনলাইন শপ</span>
                </a>
              </div>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full text-slate-400 hover:text-slate-600 text-[11px] underline pt-1 cursor-pointer"
              >
                ক্যাশ মেমোরি রিসেট করে হোমপেজে যান
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
