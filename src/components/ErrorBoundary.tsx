import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B0F15] text-[#E2E8F0] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161F2E] border border-[#EF4444]/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-white">حدث خطأ أثناء تحميل الواجهة</h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {this.state.error?.message || 'يرجى إعادة تحميل التطبيق للمتابعة بشكل طبيعي.'}
            </p>

            <button
              onClick={() => {
                try {
                  localStorage.removeItem('ultra_scraper_history');
                } catch {}
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#1E3A8A] text-[#0F1419] font-bold text-sm hover:opacity-90 transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تشغيل التطبيق وتحديث الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
