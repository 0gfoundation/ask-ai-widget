import { createContext, useContext, useEffect, useState } from "react";
import type { WidgetTheme } from "./types";

/**
 * Internal theme context. The AskAIWidget provider wraps children with a
 * resolved theme value (always "light" or "dark", never "auto"), so deep
 * components like CodeBlock can pick the right Prism palette without
 * re-resolving the media query themselves.
 */
const ThemeContext = createContext<"light" | "dark">("dark");

export const ThemeProvider = ThemeContext.Provider;

export function useResolvedTheme(): "light" | "dark" {
  return useContext(ThemeContext);
}

/**
 * Resolve the user-facing `theme` prop ("light" | "dark" | "auto") into a
 * concrete "light" | "dark" value, listening to prefers-color-scheme when
 * the prop is "auto". Returns the resolved value plus a ref-stable updater
 * caller can ignore (we re-render via state).
 */
export function useThemeResolver(prop: WidgetTheme): "light" | "dark" {
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (prop === "light" || prop === "dark") return prop;
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (prop === "light" || prop === "dark") {
      setResolved(prop);
      return;
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(mql.matches ? "dark" : "light");
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [prop]);

  return resolved;
}
