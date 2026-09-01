import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Maximize2, MessageCircle, Sparkles, X } from "lucide-react";
import ChatPanel from "./components/ChatPanel";
import { ThemeProvider, useThemeResolver } from "./theme";
import type { AskAIWidgetProps } from "./types";

const DEFAULT_STARTERS = [
  "What is 0G?",
  "What can I build with the 0G stack?",
  "How do I get started as a builder?",
  "How do I get 0G tokens?",
];

const OPEN_STATE_KEY = "ask-ai-widget:open";

// Panel geometry is set inline rather than via utility classes: host sites
// ship their own Tailwind bundles, and merged cascade layers can defeat the
// widget's responsive position utilities (observed on build.0g.ai). Inline
// styles are immune to any host stylesheet.
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    const onChange = () => setIsDesktop(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function applyAccentVars(accent: string): React.CSSProperties {
  // Cast to React.CSSProperties so TS accepts the custom prop names.
  return {
    "--aai-accent": accent,
    "--aai-accent-text": accent,
  } as React.CSSProperties;
}

export function AskAIWidget({
  apiUrl,
  turnstileSiteKey,
  theme = "auto",
  accent = "#B75FFF",
  position = "bottom-right",
  initialOpen = false,
  open: openProp,
  onOpenChange,
  maximizeHref,
  storageKey = "ask-ai-widget:conversation",
  triggerVariant = "bubble",
  triggerLabel = "Ask AI",
  starterQuestions = DEFAULT_STARTERS,
  branding = true,
}: AskAIWidgetProps) {
  const resolvedTheme = useThemeResolver(theme);
  const isDesktop = useIsDesktop();

  // Per-tab open/closed state. Survives across navigations inside the same
  // tab but not a full reload of the host site. When the `open` prop is
  // provided the component is controlled and this state is ignored.
  const [openState, setOpenState] = useState<boolean>(() => {
    if (typeof window === "undefined") return initialOpen;
    try {
      const stored = window.sessionStorage.getItem(OPEN_STATE_KEY);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      // sessionStorage blocked — fall through
    }
    return initialOpen;
  });

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;

  // Functional updates must see the CURRENT open value even from callbacks
  // memoized long ago (the trigger's toggle); a ref avoids stale closures
  // that made a controlled widget open-only.
  const openRef = useRef(open);
  openRef.current = open;

  const setOpen = useCallback(
    (next: boolean | ((v: boolean) => boolean)) => {
      const value = typeof next === "function" ? next(openRef.current) : next;
      if (!isControlled) setOpenState(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (typeof window === "undefined" || isControlled) return;
    try {
      window.sessionStorage.setItem(OPEN_STATE_KEY, open ? "true" : "false");
    } catch {
      // ignore
    }
  }, [open, isControlled]);

  // Close on Escape — accessibility + parity with most overlay UX.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Trigger sits 1rem from its corner; the desktop panel stacks directly
  // above it (same corner) with a small gap, so the trigger is never covered.
  const triggerCornerClass =
    position === "bottom-left" ? "left-4" : "right-4";
  const panelBottom = triggerVariant === "pill" ? "4.5rem" : "5.25rem";
  const panelGeometry: CSSProperties = isDesktop
    ? {
        top: "auto",
        bottom: panelBottom,
        [position === "bottom-left" ? "left" : "right"]: "1rem",
        [position === "bottom-left" ? "right" : "left"]: "auto",
        width: 400,
        height: 600,
        maxHeight: `calc(100vh - ${panelBottom} - 1rem)`,
        borderRadius: "1rem",
      }
    : { inset: 0 };

  return (
    <ThemeProvider value={resolvedTheme}>
      <div
        data-ask-ai-widget
        data-theme={resolvedTheme}
        style={applyAccentVars(accent)}
        className="aai-root"
      >
        {/* Floating trigger button. Stays visible at all times so the panel
            can sit next to it (Drift / Crisp style) instead of covering it.
            On mobile the panel goes fullscreen and its higher z-index hides
            the trigger naturally. */}
        {triggerVariant === "pill" ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? "Close Ask AI" : triggerLabel}
            aria-expanded={open}
            className={`fixed bottom-4 ${triggerCornerClass} z-[9998] inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white shadow-[var(--aai-shadow)] transition-transform duration-200 hover:scale-105 active:scale-95`}
            style={{ backgroundColor: accent }}
          >
            {open ? <X className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {triggerLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? "Close Ask AI" : triggerLabel}
            aria-expanded={open}
            className={`fixed bottom-4 ${triggerCornerClass} z-[9998] inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--aai-shadow)] transition-transform duration-200 hover:scale-105 active:scale-95`}
            style={{ backgroundColor: accent }}
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </button>
        )}

        {/* Panel — fixed positioned, animates from corner. On mobile this
            takes over the full viewport for usable text input. */}
        <div
          role="dialog"
          aria-label="Ask AI"
          aria-hidden={!open}
          style={panelGeometry}
          className={`fixed z-[9999] flex flex-col overflow-hidden bg-[var(--aai-bg)] shadow-[var(--aai-shadow-lg)] transition-all duration-200 ${
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          } sm:border sm:border-[var(--aai-border)]`}
        >
          {/* Panel header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--aai-border)] bg-[var(--aai-bg)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: accent }}
              >
                <MessageCircle className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold text-[var(--aai-fg)]">
                Ask AI
              </span>
            </div>
            <div className="flex items-center gap-1">
            {maximizeHref && (
              <a
                href={maximizeHref}
                aria-label="Open full page"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--aai-fg-muted)] transition-colors hover:bg-[var(--aai-hover-surface)] hover:text-[var(--aai-fg)]"
              >
                <Maximize2 className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--aai-fg-muted)] transition-colors hover:bg-[var(--aai-hover-surface)] hover:text-[var(--aai-fg)]"
            >
              <X className="h-4 w-4" />
            </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <ChatPanel
              apiUrl={apiUrl}
              turnstileSiteKey={turnstileSiteKey}
              storageKey={storageKey}
              starterQuestions={starterQuestions}
              branding={branding}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
