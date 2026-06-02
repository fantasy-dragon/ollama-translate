import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[Ollama 翻译] 组件错误:", error, errorInfo);
  }



  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-[320px]  bg-background text-foreground font-sans p-3 overflow-x-hidden flex items-center justify-center">
          <div className="bg-destructive/10 border border-destructive/20  p-4 space-y-3 text-center max-w-70">
            <div className="flex justify-center">
              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">出现错误</h2>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {this.state.error?.message ?? "未知错误"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
