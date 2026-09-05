import type { CSSProperties } from "react";
import ChatPanel from "./components/ChatPanel";
import { ThemeProvider, useThemeResolver, accentVars } from "./theme";
import { DEFAULT_ACCENT, DEFAULT_STARTERS, DEFAULT_STORAGE_KEY } from "./defaults";
import type { ChatPageProps } from "./types";

/**
 * Full-page chat. The same engine as the floating widget with no trigger,
 * header or positioning: the host decides where it goes and how big it is.
 * Fills its container by default, so give the parent a height (or a
 * flex/grid track) and this stretches to it.
 *
 * Pair it with `AskAIWidget` on the same origin and the same `storageKey`
 * and the conversation follows between the popup and the page.
 */
export function ChatPage({
  apiUrl,
  turnstileSiteKey,
  theme = "auto",
  accent = DEFAULT_ACCENT,
  storageKey = DEFAULT_STORAGE_KEY,
  starterQuestions = DEFAULT_STARTERS,
  branding = true,
  className,
  style,
}: ChatPageProps) {
  const resolvedTheme = useThemeResolver(theme);

  // Geometry is inline for the same reason as the widget panel: host
  // Tailwind bundles can override the widget's utility classes.
  const rootStyle: CSSProperties = {
    ...accentVars(accent),
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: "var(--aai-bg)",
    ...style,
  };

  return (
    <ThemeProvider value={resolvedTheme}>
      <div
        data-ask-ai-widget
        data-theme={resolvedTheme}
        className={className ? `aai-root ${className}` : "aai-root"}
        style={rootStyle}
      >
        <div style={{ minHeight: 0, flex: 1 }}>
          <ChatPanel
            apiUrl={apiUrl}
            turnstileSiteKey={turnstileSiteKey}
            storageKey={storageKey}
            starterQuestions={starterQuestions}
            branding={branding}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
