import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 animate-fade-in">
      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/5 border border-slate-200/50 dark:border-slate-800/50 animate-pulse">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">Loading</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we prepare this view...</p>
    </div>
  );
}
