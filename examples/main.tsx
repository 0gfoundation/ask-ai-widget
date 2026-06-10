/// <reference types="vite/client" />
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AskAIWidget } from "../src";
import type { WidgetTheme } from "../src/types";
import "../src/styles/widget.css";

function Demo() {
  const [theme, setTheme] = useState<WidgetTheme>("auto");
  const [accent, setAccent] = useState("#B75FFF");
  const [initialOpen, setInitialOpen] = useState(false);

  // Local dev points at the running Builder Hub instance.
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api/chat";
  const turnstileSiteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // Cloudflare always-pass test key

  return (
    <div className="page">
      <h1>Ask AI Widget — Demo</h1>
      <p>
        This page is for local development. The floating button in the
        bottom-right opens the widget. Tweak the controls below to test
        themes, accent colors, and the initial-open behavior.
      </p>

      <div className="controls">
        <label>
          Theme
          <select value={theme} onChange={(e) => setTheme(e.target.value as WidgetTheme)}>
            <option value="auto">auto (follows OS)</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label>
          Accent color
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={initialOpen}
            onChange={(e) => setInitialOpen(e.target.checked)}
            style={{ width: "auto", marginRight: "0.5rem" }}
          />
          Open on mount
        </label>
        <p style={{ fontSize: "0.8rem", margin: "0.5rem 0 0", opacity: 0.7 }}>
          API: <code>{apiUrl}</code>
        </p>
      </div>

      <p>
        Try long-form scrolling. The widget panel manages its own scroll
        region and shouldn't interfere with this page's scroll.
      </p>
      {Array.from({ length: 30 }).map((_, i) => (
        <p key={i}>
          Filler paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
          adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      ))}

      <AskAIWidget
        key={`${theme}-${accent}-${initialOpen}`}
        apiUrl={apiUrl}
        turnstileSiteKey={turnstileSiteKey}
        theme={theme}
        accent={accent}
        initialOpen={initialOpen}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
