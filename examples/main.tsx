/// <reference types="vite/client" />
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AskAIWidget, ChatPage } from "../src";
import type { WidgetTheme } from "../src/types";
import "../src/styles/widget.css";

const SAMPLE_CONVERSATION = [
  { role: "user", content: "What is 0G?" },
  {
    role: "assistant",
    content: [
      "## What is 0G?",
      "",
      "0G (Zero Gravity) is a **modular, decentralized AI L1 blockchain** built as infrastructure for on-chain AI. It combines three products:",
      "",
      "| Product | What it does | Key specs |",
      "|---|---|---|",
      "| 0G Chain | EVM-compatible L1 with CometBFT consensus | Sub-second finality, chain ID 16661 |",
      "| 0G Storage | Log and key-value layers for large data | 30+ MB/s retrieval |",
      "| 0G Compute | GPU marketplace with an OpenAI-compatible endpoint | `router-api.0g.ai/v1` |",
      "",
      "- Deploy contracts with Hardhat or Foundry against `https://evmrpc-testnet.0g.ai`",
      "- Store model weights and datasets on 0G Storage",
      "- Call any model through the router:",
      "",
      "```ts",
      "const client = new OpenAI({ baseURL: \"https://router-api.0g.ai/v1\", apiKey: process.env.ZG_API_KEY });",
      "```",
      "",
      "**Read more**",
      "",
      "- https://docs.0g.ai",
      "- https://build.0g.ai",
    ].join("\n"),
    suggestions: ["How do I deploy a contract?", "What does 0G Storage cost?"],
  },
];

// ?sample=1 seeds a markdown-heavy conversation so answer rendering can be
// reviewed in either theme without spending tokens. Clear chat removes it.
if (new URLSearchParams(window.location.search).get("sample") === "1") {
  try {
    window.localStorage.setItem("ask-ai-widget:conversation", JSON.stringify(SAMPLE_CONVERSATION));
  } catch {
    // storage blocked
  }
}

function Demo() {
  // ?theme=light|dark presets the theme, for previews and screenshots.
  const [theme, setTheme] = useState<WidgetTheme>(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    return t === "light" || t === "dark" ? t : "auto";
  });
  const [accent, setAccent] = useState(
    () => new URLSearchParams(window.location.search).get("accent") || "#B75FFF",
  );
  const [initialOpen, setInitialOpen] = useState(false);
  // ?layout=page opens the full-page layout directly, for previews and screenshots.
  const [layout, setLayout] = useState<"widget" | "page">(() =>
    new URLSearchParams(window.location.search).get("layout") === "page" ? "page" : "widget",
  );

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
          Layout
          <select value={layout} onChange={(e) => setLayout(e.target.value as "widget" | "page")}>
            <option value="widget">floating widget</option>
            <option value="page">full page</option>
          </select>
        </label>
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

      {layout === "widget" ? (
        <AskAIWidget
          key={`${theme}-${accent}-${initialOpen}`}
          apiUrl={apiUrl}
          turnstileSiteKey={turnstileSiteKey}
          theme={theme}
          accent={accent}
          initialOpen={initialOpen}
        />
      ) : (
        <div className="fullpage">
          <ChatPage
            apiUrl={apiUrl}
            turnstileSiteKey={turnstileSiteKey}
            theme={theme}
            accent={accent}
            style={{ borderRadius: 16, border: "1px solid var(--aai-border)" }}
          />
        </div>
      )}
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

    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
