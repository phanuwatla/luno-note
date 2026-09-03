import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Lock,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Home,
  FilePlus2,
  Frown,
  OctagonX,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

function getHostFromUrl(url: string): string {
  if (!url) return "";
  try {
    const formatted = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(formatted);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

// Global Electron API declaration
declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      openExternal?: (url: string) => Promise<boolean>;
      [key: string]: unknown;
    };
  }
}

interface WebViewerViewProps {
  initialUrl: string;
  onUrlChange?: (url: string) => void;
  onTitleChange?: (title: string) => void;
  onFaviconChange?: (faviconUrl: string) => void;
  onInsertToActiveNote?: (url: string, title?: string) => void;
  onClose?: () => void;
  onSplit?: () => void;
  isSplit?: boolean;
}

export default function WebViewerView({
  initialUrl,
  onUrlChange,
  onTitleChange,
  onFaviconChange,
  onInsertToActiveNote,
  onClose,
  onSplit,
  isSplit = false,
}: WebViewerViewProps) {
  const { t } = useTranslation();
  const [currentUrl, setCurrentUrl] = useState(initialUrl || "https://www.google.com");
  const [inputUrl, setInputUrl] = useState(initialUrl || "https://www.google.com");
  const [pageTitle, setPageTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const isElectron = Boolean(window.electronAPI?.isElectron);
  const webviewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const initialSrcRef = useRef(initialUrl || "https://www.google.com");
  const currentUrlRef = useRef(initialUrl || "https://www.google.com");

  // Run progress once from left to right on page load
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    if (isLoading) {
      setShowProgress(true);
      setProgressPercent(15);

      timer1 = setTimeout(() => setProgressPercent(45), 100);
      timer2 = setTimeout(() => setProgressPercent(75), 350);
      timer3 = setTimeout(() => setProgressPercent(88), 700);
      timer4 = setTimeout(() => setProgressPercent(96), 1400);
    } else {
      setProgressPercent(100);
      hideTimer = setTimeout(() => {
        setShowProgress(false);
        setProgressPercent(0);
      }, 250);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(hideTimer);
    };
  }, [isLoading]);

  // Sync initial URL if it changes from external props
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrlRef.current) {
      currentUrlRef.current = initialUrl;
      setCurrentUrl(initialUrl);
      setInputUrl(initialUrl);
      setLoadError(null);
      if (isElectron && webviewRef.current) {
        try {
          webviewRef.current.loadURL(initialUrl);
        } catch (err) {
          console.warn("Failed loading URL in webview:", err);
        }
      }
    }
  }, [initialUrl, isElectron]);

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "https://www.google.com";

    // If it's already http:// or https://
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // If it looks like a domain name (e.g. github.com, docs.google.com, localhost:3000)
    if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed) || /^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }

    // Otherwise, treat as a Google search query
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  };

  const handleNavigate = (targetUrl: string) => {
    const validUrl = normalizeUrl(targetUrl);
    currentUrlRef.current = validUrl;
    setCurrentUrl(validUrl);
    setInputUrl(validUrl);
    setLoadError(null);
    onUrlChange?.(validUrl);

    if (isElectron && webviewRef.current) {
      try {
        webviewRef.current.loadURL(validUrl);
      } catch (err) {
        console.warn("Failed loading URL in webview:", err);
      }
    }
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(inputUrl);
  };

  const handleReloadOrStop = () => {
    if (isElectron && webviewRef.current) {
      try {
        if (isLoading) {
          webviewRef.current.stop();
        } else {
          webviewRef.current.reload();
        }
      } catch (err) {
        console.warn("Error controlling webview reload/stop:", err);
      }
    } else if (iframeRef.current) {
      try {
        iframeRef.current.src = currentUrl;
      } catch {
        /* ignore */
      }
    }
  };

  const handleGoBack = () => {
    if (isElectron && webviewRef.current) {
      try {
        if (webviewRef.current.canGoBack()) {
          webviewRef.current.goBack();
        }
      } catch (err) {
        console.warn("Error navigating back in webview:", err);
      }
    }
  };

  const handleGoForward = () => {
    if (isElectron && webviewRef.current) {
      try {
        if (webviewRef.current.canGoForward()) {
          webviewRef.current.goForward();
        }
      } catch (err) {
        console.warn("Error navigating forward in webview:", err);
      }
    }
  };

  const handleGoHome = () => {
    handleNavigate("https://www.google.com");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      toast({
        title: t("webViewer.copyUrl") || "Copy URL",
        description: t("webViewer.urlCopied") || "URL copied to clipboard",
      });
    } catch {
      /* ignore */
    }
  };

  const handleOpenExternal = () => {
    if (window.electronAPI?.openExternal) {
      void window.electronAPI.openExternal(currentUrl);
    } else {
      window.open(currentUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleInsertToNote = () => {
    if (onInsertToActiveNote) {
      onInsertToActiveNote(currentUrl, pageTitle || undefined);
      toast({
        title: t("webViewer.insertToNote") || "Insert link to active note",
        description: t("webViewer.linkInserted") || "Link inserted into note",
      });
    }
  };

  // Electron <webview> event binding
  useEffect(() => {
    const webview = webviewRef.current;
    if (!isElectron || !webview) return;

    const applyZoom = () => {
      try {
        if (typeof webview.setZoomFactor === "function") {
          webview.setZoomFactor(0.9);
        }
      } catch {
        /* ignore */
      }
    };

    const onStartLoading = () => {
      setIsLoading(true);
      setLoadError(null);
      applyZoom();
    };

    const onStopLoading = () => {
      setIsLoading(false);
      try {
        setCanGoBack(Boolean(webview.canGoBack?.()));
        setCanGoForward(Boolean(webview.canGoForward?.()));
      } catch {
        /* ignore */
      }
      applyZoom();
    };

    const onDidNavigate = (e: any) => {
      if (e.url) {
        currentUrlRef.current = e.url;
        setCurrentUrl(e.url);
        setInputUrl(e.url);
        onUrlChange?.(e.url);
        applyZoom();
      }
    };

    const onDidNavigateInPage = (e: any) => {
      if (e.url) {
        currentUrlRef.current = e.url;
        setCurrentUrl(e.url);
        setInputUrl(e.url);
        onUrlChange?.(e.url);
      }
    };

    const onPageTitleUpdated = (e: any) => {
      if (e.title) {
        setPageTitle(e.title);
        onTitleChange?.(e.title);
      }
    };

    const onFailLoad = (e: any) => {
      if (e.errorCode !== -3) {
        // -3 is aborted (normal on redirect or rapid navigation)
        setLoadError(e.errorDescription || "Failed to load page");
        setIsLoading(false);
      }
    };

    const onNewWindow = (e: any) => {
      if (e.url) {
        handleNavigate(e.url);
      }
    };

    const onPageFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        const icon = e.favicons[0];
        if (icon) {
          onFaviconChange?.(icon);
        }
      }
    };

    applyZoom();

    webview.addEventListener("did-start-loading", onStartLoading);
    webview.addEventListener("did-stop-loading", onStopLoading);
    webview.addEventListener("did-navigate", onDidNavigate);
    webview.addEventListener("did-navigate-in-page", onDidNavigateInPage);
    webview.addEventListener("page-title-updated", onPageTitleUpdated);
    webview.addEventListener("page-favicon-updated", onPageFaviconUpdated);
    webview.addEventListener("did-fail-load", onFailLoad);
    webview.addEventListener("new-window", onNewWindow);
    webview.addEventListener("load-commit", applyZoom);
    webview.addEventListener("dom-ready", applyZoom);
    webview.addEventListener("did-finish-load", applyZoom);

    return () => {
      webview.removeEventListener("did-start-loading", onStartLoading);
      webview.removeEventListener("did-stop-loading", onStopLoading);
      webview.removeEventListener("did-navigate", onDidNavigate);
      webview.removeEventListener("did-navigate-in-page", onDidNavigateInPage);
      webview.removeEventListener("page-title-updated", onPageTitleUpdated);
      webview.removeEventListener("page-favicon-updated", onPageFaviconUpdated);
      webview.removeEventListener("did-fail-load", onFailLoad);
      webview.removeEventListener("new-window", onNewWindow);
      webview.removeEventListener("load-commit", applyZoom);
      webview.removeEventListener("dom-ready", applyZoom);
      webview.removeEventListener("did-finish-load", applyZoom);
    };
  }, [isElectron, onUrlChange, onTitleChange, onFaviconChange]);

  useEffect(() => {
    if (currentUrl) {
      try {
        const u = new URL(currentUrl.startsWith("http") ? currentUrl : `https://${currentUrl}`);
        if (u.hostname) {
          const defaultFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=32`;
          onFaviconChange?.(defaultFavicon);
        }
      } catch {}
    }
  }, [currentUrl, onFaviconChange]);

  const isHttps = currentUrl.startsWith("https://");

  return (
    <TooltipProvider delayDuration={350}>
      <div className="flex flex-col h-full w-full bg-background select-none overflow-hidden">
        {/* Browser Top Navigation Bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-sidebar/50 border-b border-border/40 shrink-0">
          {/* Navigation controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleGoBack}
                  disabled={!canGoBack && isElectron}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("webViewer.back") || "Back"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleGoForward}
                  disabled={!canGoForward && isElectron}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("webViewer.forward") || "Forward"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleReloadOrStop}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? (t("webViewer.stop") || "Stop Loading") : (t("webViewer.reload") || "Reload")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("webViewer.home") || "Home"}</TooltipContent>
            </Tooltip>
          </div>

          {/* Omnibox / Address Bar */}
          <form
            onSubmit={handleSubmitUrl}
            className="flex-1 flex items-center bg-background/70 hover:bg-background focus-within:bg-background border border-border/60 focus-within:border-primary rounded-full px-3 py-1 text-xs transition-colors min-w-0 shadow-none focus-within:ring-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center mr-1.5 shrink-0 cursor-default">
                  {isHttps ? (
                    <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <OctagonX className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isHttps
                  ? (t("webViewer.secure") || "Secure Connection (HTTPS)")
                  : (t("webViewer.notSecure") || "Not Secure (HTTP)")}
              </TooltipContent>
            </Tooltip>

            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder={t("webViewer.searchOrUrl") || "Search Google or enter web address..."}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-foreground text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
            />

            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 ml-1 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* Browser Action Toolbar */}
          <div className="flex items-center gap-0.5 shrink-0">
            {onInsertToActiveNote && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleInsertToNote}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("webViewer.insertToNote") || "Insert link to active note"}</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("webViewer.copyUrl") || "Copy URL"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("webViewer.openExternal") || "Open in Default Browser"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Loading Progress Bar - Runs once smoothly from 0 to 100% */}
        {showProgress && (
          <div className="w-full h-[1.5px] bg-muted/20 overflow-hidden shrink-0 relative">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                opacity: progressPercent === 100 ? 0.8 : 1,
              }}
            />
          </div>
        )}

        {/* Web View Main Area */}
        <div className="flex-1 relative w-full h-full bg-background overflow-hidden flex flex-col">
          {loadError ? (
            <div className="flex-1 w-full h-full bg-background overflow-y-auto p-6 sm:p-10 flex flex-col items-center justify-center">
              <div className="max-w-md w-full flex flex-col items-start text-left space-y-3.5 animate-in fade-in-50 duration-200">
                {/* Lucide Frown Icon */}
                <div className="text-muted-foreground/80 select-none pb-0.5">
                  <Frown className="h-9 w-9 stroke-[1.75]" />
                </div>

                {/* Title */}
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  {t("webViewer.siteCantBeReached") || "This site can’t be reached"}
                </h1>

                {/* Suggestions / Typo in URL */}
                <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    {t("webViewer.checkTypoInUrl", { host: getHostFromUrl(currentUrl) }) || (
                      <>
                        Check if there is a typo in <span className="font-semibold text-foreground">{getHostFromUrl(currentUrl)}</span>
                      </>
                    )}
                  </p>
                  <p>
                    {t("webViewer.checkConnectionSuggestion") ||
                      "If spelling is correct, try checking your network connection or opening in default browser."}
                  </p>
                </div>

                {/* Error code badge */}
                <div className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide pt-0.5">
                  {loadError}
                </div>

                {/* Action Buttons - Slightly more rounded system style */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate(currentUrl)}
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {t("webViewer.retry") || "Reload"}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="px-3.5 py-2 text-xs font-medium rounded-xl border border-border/70 hover:bg-muted text-foreground transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t("webViewer.openInExternalBrowserBtn") || "Open in External Browser"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isElectron ? (
            // Native Electron Webview with isolated partition
            <webview
              ref={webviewRef}
              src={initialSrcRef.current}
              partition="persist:luno_webviewer"
              allowpopups="true"
              webpreferences="contextIsolation=yes"
              className="w-full h-full flex-1 border-0 bg-white"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            // Standard Web Fallback Iframe
            <iframe
              ref={iframeRef}
              src={currentUrl}
              title={pageTitle || "Web Viewer"}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              className="w-full h-full flex-1 border-0 bg-white"
              style={{ width: "100%", height: "100%", zoom: 0.9 }}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
