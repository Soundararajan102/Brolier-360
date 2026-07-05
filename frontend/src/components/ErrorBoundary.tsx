import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error fallback UI (styled for modern, glassmorphic look)
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2 tracking-tight">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            We encountered an unexpected issue while loading this content. This could be due to a network interruption.
          </p>
          <Button 
            onClick={this.handleReload}
            className="rounded-xl px-6 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          
          {/* Removed process.env check for Vite compatibility */}
          {this.state.error && (
            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-left max-w-2xl w-full overflow-auto">
              <p className="text-sm font-mono text-rose-500 font-semibold mb-2">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
