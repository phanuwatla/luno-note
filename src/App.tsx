import { Component, type ReactNode, lazy, Suspense, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AppSettingsProvider } from "@/hooks/useAppSettings";
import { PageLoader } from "@/components/shared/PageLoader";
import { translations, type Language } from "@/translation";
import Index from "./pages/Index.tsx";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function getStoredLanguageForBoundary(): Language {
  try {
    const raw = localStorage.getItem("notes-app-settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.language === "th" || parsed?.language === "en") {
        return parsed.language;
      }
    }
  } catch {
    // Fallback to navigator language if storage is unavailable
  }
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("th")) {
    return "th";
  }
  return "en";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error caught by AppErrorBoundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const lang = getStoredLanguageForBoundary();
      const copy = translations[lang]?.errorBoundary || translations.en.errorBoundary;
      return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-6 bg-background text-foreground text-center">
          <div className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h1 className="text-xl font-bold text-foreground">{copy?.title || "Something went wrong"}</h1>
            <p className="text-sm text-muted-foreground">
              {copy?.description || "An unexpected error occurred. Please reload Luno Note."}
            </p>
            <p className="text-xs font-mono bg-muted p-2 rounded text-destructive overflow-x-auto text-left max-h-32">
              {this.state.error?.message || copy?.unknownError || "Unknown error"}
            </p>
            <Button type="button" onClick={this.handleReload} className="w-full">
              {copy?.reloadButton || "Reload Luno Note"}
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

/** Redirects legacy standalone /settings and /help routes into the main tabbed workspace. */
function RedirectToMainTab({ tab }: { tab: "settings" | "help" }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (tab === "settings") {
        window.dispatchEvent(new CustomEvent("luno:open-settings"));
      } else {
        window.dispatchEvent(new CustomEvent("luno:open-help"));
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [tab]);

  return <Navigate to="/" replace />;
}

if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
  void navigator.storage.persist().catch(() => {});
}

const App = () => (
  <AppErrorBoundary>
    <AppSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <HashRouter>
          <Suspense fallback={<PageLoader className="h-screen w-screen" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<RedirectToMainTab tab="settings" />} />
              <Route path="/help" element={<RedirectToMainTab tab="help" />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </TooltipProvider>
    </AppSettingsProvider>
  </AppErrorBoundary>
);

export default App;
