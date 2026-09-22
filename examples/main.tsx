/// <reference types="vite/client" />
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AskAIWidget, ChatPage } from "../src";
import { deriveAccentColors } from "../src/contrast";
import type { WidgetPosition, WidgetTheme } from "../src/types";
import pkg from "../package.json";
import "../src/styles/widget.css";
import "./demo.css";

// This page is the widget's showcase as well as its dev harness: every push
// deploys it to a hostname under ask-zed-widget.0g.ai, and tags are public.
// So it mounts both exports side by side, drives them from real props, and
// keeps every control in the URL so a reviewer can link to a given state.

// Each mount gets its own conversation key so the two on this page can't
// overwrite each other's history. A real site shares one key between its
// popup and its full page, and the conversation follows between them.
const WIDGET_STORAGE_KEY = "ask-ai-widget:demo-widget";
const PAGE_STORAGE_KEY = "ask-ai-widget:demo-page";

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

const ACCENT_PRESETS: { value: string; label: string }[] = [
  { value: "#B75FFF", label: "0G Hero Purple (the default)" },
  { value: "#000000", label: "Black — derived lighter so filled surfaces stay visible" },
  { value: "#FFFFFF", label: "White — derived darker on the light theme" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#16A34A", label: "Green" },
  { value: "#FF5C00", label: "Orange" },
];

type Layout = "both" | "widget" | "page";

interface DemoState {
  layout: Layout;
  open: boolean;
  theme: WidgetTheme;
  accent: string;
  variant: "bubble" | "pill";
  position: WidgetPosition;
  label: string;
  branding: boolean;
  starters: boolean;
  maximize: boolean;
}

const DEFAULTS: DemoState = {
  layout: "both",
  open: false,
  theme: "auto",
  accent: "#B75FFF",
  variant: "bubble",
  position: "bottom-right",
  label: "Ask AI",
  branding: true,
  starters: true,
  maximize: false,
};

function readState(): DemoState {
  const q = new URLSearchParams(window.location.search);
  const one = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = q.get(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  };
  const flag = (key: string, fallback: boolean): boolean => {
    const value = q.get(key);
    if (value === "1" || value === "true") return true;
    if (value === "0" || value === "false") return false;
    return fallback;
  };
  return {
    // ?layout=page is the older spelling for the full page on its own.
    layout: one("layout", ["both", "widget", "page"] as const, DEFAULTS.layout),
    open: flag("open", DEFAULTS.open),
    theme: one("theme", ["auto", "light", "dark"] as const, DEFAULTS.theme),
    accent: q.get("accent") || DEFAULTS.accent,
    variant: one("variant", ["bubble", "pill"] as const, DEFAULTS.variant),
    position: one("position", ["bottom-right", "bottom-left"] as const, DEFAULTS.position),
    label: q.get("label") || DEFAULTS.label,
    branding: flag("branding", DEFAULTS.branding),
    starters: flag("starters", DEFAULTS.starters),
    maximize: flag("maximize", DEFAULTS.maximize),
  };
}

/** Mirror the controls into the query string, dropping anything at its default. */
function writeState(state: DemoState): void {
  const q = new URLSearchParams(window.location.search);
  const put = (key: string, value: string, fallback: string) => {
    if (value === fallback) q.delete(key);
    else q.set(key, value);
  };
  put("layout", state.layout, DEFAULTS.layout);
  put("open", state.open ? "1" : "0", "0");
  put("theme", state.theme, DEFAULTS.theme);
  put("accent", state.accent, DEFAULTS.accent);
  put("variant", state.variant, DEFAULTS.variant);
  put("position", state.position, DEFAULTS.position);
  put("label", state.label, DEFAULTS.label);
  put("branding", state.branding ? "1" : "0", "1");
  put("starters", state.starters ? "1" : "0", "1");
  put("maximize", state.maximize ? "1" : "0", "0");
  const query = q.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

function useSystemTheme(): "light" | "dark" {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return dark ? "dark" : "light";
}

function seed(keys: string[]): void {
  for (const key of keys) {
    try {
      window.localStorage.setItem(key, JSON.stringify(SAMPLE_CONVERSATION));
    } catch {
      // storage blocked
    }
  }
}

function wipe(keys: string[]): void {
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // storage blocked
    }
  }
}

// ?sample=1 seeds a markdown-heavy conversation before the first render, so
// answer rendering can be reviewed in either theme without spending tokens.
if (new URLSearchParams(window.location.search).get("sample") === "1") {
  seed([WIDGET_STORAGE_KEY, PAGE_STORAGE_KEY]);
}

function Snippet({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => setCopied(false),
    );
  }, [code]);

  return (
    <div>
      <div className="snippet-head">
        <h3>{title}</h3>
        <button type="button" className="btn" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="snippet">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function widgetSnippet(state: DemoState, apiUrl: string): string {
  const lines = [
    `<AskAIWidget`,
    `  apiUrl="${apiUrl}"`,
    `  turnstileSiteKey={siteKey}`,
    `  theme="${state.theme}"`,
    `  accent="${state.accent}"`,
    `  position="${state.position}"`,
    `  triggerVariant="${state.variant}"`,
    `  triggerLabel="${state.label}"`,
    `  storageKey="${WIDGET_STORAGE_KEY}"`,
  ];
  if (state.maximize) lines.push(`  maximizeHref="#full-page"`);
  if (!state.starters) lines.push(`  starterQuestions={[]}`);
  if (!state.branding) lines.push(`  branding={false}`);
  lines.push(`  open={open}`, `  onOpenChange={setOpen}`, `/>`);
  return lines.join("\n");
}

function pageSnippet(state: DemoState, apiUrl: string): string {
  const lines = [
    `<ChatPage`,
    `  apiUrl="${apiUrl}"`,
    `  turnstileSiteKey={siteKey}`,
    `  theme="${state.theme}"`,
    `  accent="${state.accent}"`,
    `  storageKey="${PAGE_STORAGE_KEY}"`,
  ];
  if (!state.starters) lines.push(`  starterQuestions={[]}`);
  if (!state.branding) lines.push(`  branding={false}`);
  lines.push(`  style={{ borderRadius: 16, border: "1px solid var(--aai-border)" }}`, `/>`);
  return lines.join("\n");
}

const INSTALL_SNIPPET = `npm install github:0gfoundation/ask-ai-widget#v${pkg.version}`;

const USAGE_SNIPPET = `import { AskAIWidget } from "@0gfoundation/ask-ai-widget";
import "@0gfoundation/ask-ai-widget/styles.css";

export default function App() {
  return (
    <>
      {/* your app */}
      <AskAIWidget
        apiUrl="https://0g.ai/zed/api/chat"
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      />
    </>
  );
}`;

const PARAMS: [string, string][] = [
  ["?layout=", "both (default), widget or page — which mounts render."],
  ["?open=1", "Land with the floating panel already open."],
  ["?theme=", "auto, light or dark. The demo page follows it too."],
  ["?accent=", "Any CSS colour, URL-encoded (%23B75FFF for #B75FFF)."],
  ["?variant=", "bubble or pill — the floating trigger's shape."],
  ["?position=", "bottom-right or bottom-left."],
  ["?label=", "The trigger's label and aria-label."],
  ["?branding=0", "Hide the Powered by 0G Compute footer."],
  ["?starters=0", "Hide the starter questions in the empty state."],
  ["?maximize=1", "Show the panel's maximize button."],
  ["?sample=1", "Seed a markdown-heavy conversation in both mounts."],
];

function Demo() {
  const [state, setState] = useState<DemoState>(readState);
  // Bumped when a conversation is seeded or wiped: both mounts read storage
  // once on mount, so remounting them is what makes the change show.
  const [storageToken, setStorageToken] = useState(0);

  const systemTheme = useSystemTheme();
  const shellTheme = state.theme === "auto" ? systemTheme : state.theme;

  useEffect(() => writeState(state), [state]);

  const set = useCallback(
    <K extends keyof DemoState>(key: K, value: DemoState[K]) =>
      setState((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setOpen = useCallback((open: boolean) => set("open", open), [set]);

  const bothKeys = useMemo(() => [WIDGET_STORAGE_KEY, PAGE_STORAGE_KEY], []);

  // Local dev points at a zed backend running on port 3000 (basePath /zed).
  // Deployed previews get the real endpoint through VITE_API_URL.
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/zed/api/chat";
  const envSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  // Cloudflare's documented always-pass key, for local dev and previews.
  const turnstileSiteKey = envSiteKey || "1x00000000000000000000AA";

  const derived = useMemo(
    () => deriveAccentColors(state.accent, shellTheme),
    [state.accent, shellTheme],
  );

  const showWidget = state.layout !== "page";
  const showPage = state.layout !== "widget";

  return (
    <div className="demo" data-demo-theme={shellTheme}>
      <header className="wrap masthead">
        <h1>Ask AI Widget</h1>
        <p className="lede">
          Both of the package's chat surfaces, live, driven by the controls
          below. The floating <code>AskAIWidget</code> sits in the corner of
          this page; <code>ChatPage</code> is embedded further down. Every
          control is mirrored in the URL, so a link carries the state you are
          looking at.
        </p>
        <div className="facts">
          <span className="fact">
            <b>version</b>
            <span>{pkg.version}</span>
          </span>
          <span className="fact">
            <b>api</b>
            <span>{apiUrl}</span>
          </span>
          <span className="fact">
            <b>turnstile</b>
            <span>{envSiteKey ? "site key from env" : "always-pass test key"}</span>
          </span>
          <span className="fact">
            <b>host</b>
            <span>{window.location.host}</span>
          </span>
        </div>
      </header>

      <div className="controls">
        <div className="controls-inner">
          <label className="field">
            <span>Layout</span>
            <select
              value={state.layout}
              onChange={(e) => set("layout", e.target.value as Layout)}
            >
              <option value="both">both</option>
              <option value="widget">floating widget</option>
              <option value="page">full page</option>
            </select>
          </label>

          <label className="field">
            <span>Theme</span>
            <select
              value={state.theme}
              onChange={(e) => set("theme", e.target.value as WidgetTheme)}
            >
              <option value="auto">auto (follows OS)</option>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>

          <label className="field">
            <span>Trigger</span>
            <select
              value={state.variant}
              onChange={(e) => set("variant", e.target.value as "bubble" | "pill")}
            >
              <option value="bubble">bubble</option>
              <option value="pill">pill</option>
            </select>
          </label>

          <label className="field">
            <span>Position</span>
            <select
              value={state.position}
              onChange={(e) => set("position", e.target.value as WidgetPosition)}
            >
              <option value="bottom-right">bottom-right</option>
              <option value="bottom-left">bottom-left</option>
            </select>
          </label>

          <label className="field">
            <span>Trigger label</span>
            <input
              type="text"
              value={state.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </label>

          <div className="field">
            <span>Accent</span>
            <div className="accent-row">
              <input
                type="color"
                aria-label="Accent colour"
                value={/^#[0-9a-f]{6}$/i.test(state.accent) ? state.accent : "#B75FFF"}
                onChange={(e) => set("accent", e.target.value)}
              />
              <div className="swatches">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className="swatch"
                    title={preset.label}
                    aria-label={preset.label}
                    aria-pressed={state.accent.toLowerCase() === preset.value.toLowerCase()}
                    style={{ background: preset.value }}
                    onClick={() => set("accent", preset.value)}
                  />
                ))}
              </div>
            </div>
            <div className="derived" title="Derived per theme by src/contrast.ts">
              <span>
                <i style={{ background: derived.surface }} />
                {derived.surface}
              </span>
              <span>
                <i style={{ background: derived.onSurface }} />
                {derived.onSurface}
              </span>
              <span>
                <i style={{ background: derived.text }} />
                {derived.text}
              </span>
            </div>
          </div>

          <div className="checks">
            <label className="check">
              <input
                type="checkbox"
                checked={state.starters}
                onChange={(e) => set("starters", e.target.checked)}
              />
              Starter questions
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={state.branding}
                onChange={(e) => set("branding", e.target.checked)}
              />
              Branding footer
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={state.maximize}
                onChange={(e) => set("maximize", e.target.checked)}
              />
              Maximize button
            </label>
          </div>

          <div className="btn-row">
            {showWidget && (
              <button type="button" className="btn" onClick={() => setOpen(!state.open)}>
                {state.open ? "Close the panel" : "Open the panel"}
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => {
                seed(bothKeys);
                setStorageToken((n) => n + 1);
              }}
            >
              Seed a sample answer
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                wipe(bothKeys);
                setStorageToken((n) => n + 1);
              }}
            >
              Wipe conversations
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setState(DEFAULTS)}
            >
              Reset controls
            </button>
          </div>
        </div>
      </div>

      <main className="wrap">
        <section className="section" id="floating-widget">
          <h2>
            Floating widget
            <span className="tag">AskAIWidget</span>
          </h2>
          <p>
            Mounted once, anywhere in the tree. It renders a trigger fixed to
            the {state.position.replace("-", " ")} corner of this page and a
            panel that stacks above it — 400&times;600 on desktop, fullscreen
            on a phone. Here it is controlled, so the button in the controls
            bar drives <code>open</code> the same way a host's own nav pill
            would.
          </p>
          {showWidget ? (
            <div className="stage">
              <p className="note">
                The trigger is in the {state.position.replace("-", " ")} corner
                of the viewport, not in this box.
                {state.maximize
                  ? " Its maximize button links to the full page below."
                  : ""}
              </p>
              <button type="button" className="btn" onClick={() => setOpen(true)}>
                Open it
              </button>
            </div>
          ) : (
            <div className="stage">
              <p className="note">Not mounted — the layout is set to full page only.</p>
            </div>
          )}
          <Snippet title="Props in play" code={widgetSnippet(state, apiUrl)} />
        </section>

        <section className="section" id="full-page">
          <h2>
            Full page
            <span className="tag">ChatPage</span>
          </h2>
          <p>
            The same chat with no trigger, header or positioning. It fills its
            container, so the host decides the size and the frame — this one is
            capped at 70vh with a border and a radius. Give it the same{" "}
            <code>storageKey</code> as the floating widget on the same origin
            and one conversation follows between the two.
          </p>
          {showPage ? (
            <div className="frame">
              <ChatPage
                key={`page-${storageToken}`}
                apiUrl={apiUrl}
                turnstileSiteKey={turnstileSiteKey}
                theme={state.theme}
                accent={state.accent}
                storageKey={PAGE_STORAGE_KEY}
                starterQuestions={state.starters ? undefined : []}
                branding={state.branding}
                style={{ borderRadius: 16, border: "1px solid var(--aai-border)" }}
              />
            </div>
          ) : (
            <div className="stage">
              <p className="note">
                Not mounted — the layout is set to the floating widget only.
              </p>
            </div>
          )}
          <p className="note">
            The two mounts on this page use separate storage keys so they can't
            overwrite each other's history.
          </p>
          <Snippet title="Props in play" code={pageSnippet(state, apiUrl)} />
        </section>

        <section className="section">
          <h2>Install</h2>
          <p>
            The package is installed from GitHub, not npm. Its{" "}
            <code>prepare</code> script builds the bundle, so consumers need no
            build step. Pin a tag in production.
          </p>
          <Snippet title="Install" code={INSTALL_SNIPPET} />
          <div style={{ height: "1.25rem" }} />
          <Snippet title="Usage" code={USAGE_SNIPPET} />
        </section>

        <section className="section">
          <h2>Review with a URL</h2>
          <p>
            Every control writes itself into the query string. These are the
            parameters a link can set.
          </p>
          <table className="params">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map(([param, what]) => (
                <tr key={param}>
                  <td>{param}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note" style={{ marginTop: "1rem" }}>
            For instance{" "}
            <a href="?layout=page&sample=1&theme=light">
              ?layout=page&amp;sample=1&amp;theme=light
            </a>{" "}
            reviews answer rendering on the light theme without spending
            tokens.
          </p>
        </section>

        <section className="section">
          <h2>Scroll isolation</h2>
          <p>
            The panel manages its own scroll region and marks it{" "}
            <code>data-lenis-prevent</code>, so a smooth-scroll library on the
            host page can't hijack the wheel over it. Open the panel, put the
            cursor inside it and scroll: this page should stay put.
          </p>
          {Array.from({ length: 6 }).map((_, i) => (
            <p key={i}>
              Filler paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo
              consequat.
            </p>
          ))}
        </section>

        <footer className="foot">
          <p>
            <a href="https://github.com/0gfoundation/ask-ai-widget">
              0gfoundation/ask-ai-widget
            </a>{" "}
            — every push to main, every pull request and every tag deploys this
            page to its own hostname under <code>ask-zed-widget.0g.ai</code>.
            Each hostname is its own origin, so previews never share a saved
            conversation.
          </p>
        </footer>
      </main>

      {showWidget && (
        <AskAIWidget
          key={`widget-${storageToken}`}
          apiUrl={apiUrl}
          turnstileSiteKey={turnstileSiteKey}
          theme={state.theme}
          accent={state.accent}
          position={state.position}
          triggerVariant={state.variant}
          triggerLabel={state.label}
          storageKey={WIDGET_STORAGE_KEY}
          starterQuestions={state.starters ? undefined : []}
          branding={state.branding}
          maximizeHref={state.maximize ? "#full-page" : undefined}
          open={state.open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
