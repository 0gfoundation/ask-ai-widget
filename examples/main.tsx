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
// So it mounts both exports, drives them from real props through one set of
// controls, and keeps every control in the URL so a reviewer can link to the
// exact state they are describing.

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
  { value: "#B75FFF", label: "0G Hero Purple — the default" },
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

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
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

const STORAGE_KEYS = [WIDGET_STORAGE_KEY, PAGE_STORAGE_KEY];

/** A button whose label flips to a confirmation for a moment after it runs. */
function ActionButton({
  label,
  done,
  onRun,
  primary,
}: {
  label: string;
  done: string;
  onRun: () => void;
  primary?: boolean;
}) {
  const [ran, setRan] = useState(false);
  useEffect(() => {
    if (!ran) return;
    const t = setTimeout(() => setRan(false), 1400);
    return () => clearTimeout(t);
  }, [ran]);
  return (
    <button
      type="button"
      className={primary ? "btn btn-primary" : "btn"}
      onClick={() => {
        onRun();
        setRan(true);
      }}
    >
      {ran ? done : label}
    </button>
  );
}

function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="field">
      <span className="legend">{legend}</span>
      <div className="seg" role="group" aria-label={legend}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <>
      <div className="snippet-head">
        <h3>{title}</h3>
        <ActionButton label="Copy" done="Copied" onRun={() => navigator.clipboard?.writeText(code)} />
      </div>
      <pre className="snippet">
        <code>{code}</code>
      </pre>
    </>
  );
}

function widgetSnippet(state: DemoState, apiUrl: string): string {
  const lines = [
    "<AskAIWidget",
    `  apiUrl="${apiUrl}"`,
    "  turnstileSiteKey={siteKey}",
    `  theme="${state.theme}"`,
    `  accent="${state.accent}"`,
    `  position="${state.position}"`,
    `  triggerVariant="${state.variant}"`,
    `  triggerLabel="${state.label}"`,
    `  storageKey="${WIDGET_STORAGE_KEY}"`,
  ];
  if (state.maximize) lines.push('  maximizeHref="#full-page"');
  if (!state.starters) lines.push("  starterQuestions={[]}");
  if (!state.branding) lines.push("  branding={false}");
  lines.push("  open={open}", "  onOpenChange={setOpen}", "/>");
  return lines.join("\n");
}

function pageSnippet(state: DemoState, apiUrl: string): string {
  const lines = [
    "<ChatPage",
    `  apiUrl="${apiUrl}"`,
    "  turnstileSiteKey={siteKey}",
    `  theme="${state.theme}"`,
    `  accent="${state.accent}"`,
    `  storageKey="${PAGE_STORAGE_KEY}"`,
  ];
  if (!state.starters) lines.push("  starterQuestions={[]}");
  if (!state.branding) lines.push("  branding={false}");
  lines.push('  style={{ borderRadius: 16, border: "1px solid var(--aai-border)" }}', "/>");
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
        turnstileSiteKey={siteKey}
      />
    </>
  );
}`;

const PARAMS: [string, string][] = [
  ["?layout=", "both (default), widget or page — which mounts render."],
  ["?open=1", "Land with the floating panel already open."],
  ["?theme=", "auto, light or dark. The page follows it too."],
  ["?accent=", "Any CSS colour, URL-encoded (%23B75FFF for #B75FFF)."],
  ["?variant=", "bubble or pill."],
  ["?position=", "bottom-right or bottom-left."],
  ["?label=", "The trigger's label and aria-label."],
  ["?branding=0", "Hide the branding footer."],
  ["?starters=0", "Hide the starter questions."],
  ["?maximize=1", "Show the panel's maximize button."],
  ["?sample=1", "Seed a markdown-heavy conversation in both mounts."],
];

function Demo() {
  const [state, setState] = useState<DemoState>(readState);
  // Bumped when a conversation is seeded or wiped: both mounts read storage
  // once on mount, so remounting them is what makes the change show.
  const [storageToken, setStorageToken] = useState(0);

  const systemTheme = useSystemTheme();
  // Matches the CSS breakpoint where the two columns become one.
  const narrow = useMediaQuery("(max-width: 62rem)");
  const shellTheme = state.theme === "auto" ? systemTheme : state.theme;

  useEffect(() => writeState(state), [state]);

  const set = useCallback(
    <K extends keyof DemoState>(key: K, value: DemoState[K]) =>
      setState((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const setOpen = useCallback((open: boolean) => set("open", open), [set]);

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
  const corner = state.position.replace("-", " ");

  const controls = (
    <div className="card">
      <div className="group">
        <h2>Surfaces</h2>
        <div className="stack">
          <Segmented
            legend="Show"
            value={state.layout}
            onChange={(layout) => set("layout", layout)}
            options={[
              { value: "both", label: "Both" },
              { value: "widget", label: "Popup" },
              { value: "page", label: "Page" },
            ]}
          />
          <Segmented
            legend="Theme"
            value={state.theme}
            onChange={(theme) => set("theme", theme)}
            options={[
              { value: "auto", label: "Auto" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
      </div>

      <div className="group">
        <h2>Accent</h2>
        <div className="stack">
          <div className="accent">
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
            <span title="Filled surfaces">
              <i style={{ background: derived.surface }} />
              {derived.surface}
            </span>
            <span title="Text on those surfaces">
              <i style={{ background: derived.onSurface }} />
              {derived.onSurface}
            </span>
            <span title="Accent as text">
              <i style={{ background: derived.text }} />
              {derived.text}
            </span>
          </div>
        </div>
      </div>

      <div className="group">
        <h2>Trigger</h2>
        <div className="stack">
          <Segmented
            legend="Shape"
            value={state.variant}
            onChange={(variant) => set("variant", variant)}
            options={[
              { value: "bubble", label: "Bubble" },
              { value: "pill", label: "Pill" },
            ]}
          />
          <Segmented
            legend="Corner"
            value={state.position}
            onChange={(position) => set("position", position)}
            options={[
              { value: "bottom-right", label: "Right" },
              { value: "bottom-left", label: "Left" },
            ]}
          />
          <label className="field">
            <span>Label</span>
            <input
              type="text"
              value={state.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="group">
        <h2>Chrome</h2>
        <div className="stack">
          <Switch
            label="Starter questions"
            checked={state.starters}
            onChange={(v) => set("starters", v)}
          />
          <Switch
            label="Branding footer"
            checked={state.branding}
            onChange={(v) => set("branding", v)}
          />
          <Switch
            label="Maximize button"
            checked={state.maximize}
            onChange={(v) => set("maximize", v)}
          />
        </div>
      </div>

      <div className="group">
        <h2>Actions</h2>
        <div className="btn-row">
          <ActionButton
            label="Copy link"
            done="Link copied"
            primary
            onRun={() => navigator.clipboard?.writeText(window.location.href)}
          />
          <ActionButton
            label="Seed an answer"
            done="Seeded"
            onRun={() => {
              seed(STORAGE_KEYS);
              setStorageToken((n) => n + 1);
            }}
          />
          <ActionButton
            label="Clear chat"
            done="Cleared"
            onRun={() => {
              wipe(STORAGE_KEYS);
              setStorageToken((n) => n + 1);
            }}
          />
          <ActionButton label="Reset" done="Reset" onRun={() => setState(DEFAULTS)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="demo" data-demo-theme={shellTheme}>
      <div className="wrap">
        <header className="masthead">
          <p className="eyebrow">@0gfoundation/ask-ai-widget · v{pkg.version}</p>
          <h1>The 0G chat, both ways round</h1>
          <p className="lede">
            <code>AskAIWidget</code> is a popup that floats over any page.{" "}
            <code>ChatPage</code> is the same chat with no chrome, sized by its
            container. Both are live below and share these controls; the URL
            keeps whatever you set, so a link shows someone exactly what you
            are seeing.
          </p>
          <div className="facts">
            <span className="fact">
              <b>backend</b> <span className="mono">{apiUrl}</span>
            </span>
            <span className="fact">
              <b>turnstile</b>{" "}
              <span>{envSiteKey ? "site key from env" : "always-pass test key"}</span>
            </span>
            <span className="fact">
              <b>host</b> <span className="mono">{window.location.host}</span>
            </span>
          </div>
        </header>

        <div className="shell">
          <aside className="sidebar" aria-label="Widget controls">
            {narrow ? (
              <details className="disc controls-disc">
                <summary>Controls</summary>
                {controls}
              </details>
            ) : (
              controls
            )}
          </aside>
          <main>
            {showWidget && (
              <section className="surface" id="popup">
                <div className="stage-head">
                  <div>
                    <h2>Popup</h2>
                    <p className="sub">
                      Fixed to the {corner} corner of the viewport, not to this
                      column — 400×600 on desktop, fullscreen on a phone. Driven
                      from here through <code>open</code> and{" "}
                      <code>onOpenChange</code>, the way a host's nav pill would.
                      {state.maximize && " Maximize jumps to the page below."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={state.open ? "btn" : "btn btn-primary"}
                    onClick={() => setOpen(!state.open)}
                  >
                    {state.open ? "Close panel" : "Open panel"}
                  </button>
                </div>
              </section>
            )}

            {showPage && (
              <section className="surface" id="full-page">
                <div className="stage-head">
                  <div>
                    <h2>Page</h2>
                    <p className="sub">
                      No trigger, no header, no positioning. Fills its
                      container; this one is 60vh with a border and a radius.
                    </p>
                  </div>
                </div>
                <div className="chat-frame">
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
                <p className="note">
                  The two mounts here keep separate conversation keys so they
                  can't overwrite each other. Give them the same{" "}
                  <code>storageKey</code> on a real site and one conversation
                  follows between popup and page.
                </p>
              </section>
            )}

            <details className="disc">
              <summary>Props in play</summary>
              <div className="disc-body">
                {showWidget && <Snippet title="AskAIWidget" code={widgetSnippet(state, apiUrl)} />}
                {showPage && <Snippet title="ChatPage" code={pageSnippet(state, apiUrl)} />}
              </div>
            </details>

            <details className="disc">
              <summary>Install</summary>
              <div className="disc-body">
                <p>
                  Installed from GitHub rather than npm. The package's{" "}
                  <code>prepare</code> script builds the bundle, so there is no
                  build step on the consumer side. Pin a tag in production.
                </p>
                <Snippet title="Install" code={INSTALL_SNIPPET} />
                <Snippet title="Usage" code={USAGE_SNIPPET} />
              </div>
            </details>

            <details className="disc">
              <summary>Link parameters</summary>
              <div className="disc-body">
                <p>
                  Every control writes itself into the query string, so Copy
                  link carries the state you are looking at. These are the
                  parameters it can set.
                </p>
                <table className="params">
                  <tbody>
                    {PARAMS.map(([param, what]) => (
                      <tr key={param}>
                        <td>{param}</td>
                        <td>{what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <details className="disc">
              <summary>Scroll isolation</summary>
              <div className="disc-body filler">
                <p>
                  The panel manages its own scroll region and marks it{" "}
                  <code>data-lenis-prevent</code>, so a smooth-scroll library
                  on the host page can't hijack the wheel over it. Open the
                  panel, put the cursor inside it and scroll: this page should
                  stay exactly where it is. Mounting a saved conversation
                  shouldn't move the page either.
                </p>
                {Array.from({ length: 4 }).map((_, i) => (
                  <p key={i}>
                    Filler paragraph {i + 1}. Lorem ipsum dolor sit amet,
                    consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad
                    minim veniam, quis nostrud exercitation ullamco laboris nisi
                    ut aliquip ex ea commodo consequat.
                  </p>
                ))}
              </div>
            </details>

            <footer className="foot">
              <p>
                <a href="https://github.com/0gfoundation/ask-ai-widget">
                  0gfoundation/ask-ai-widget
                </a>{" "}
                — every push to main, every pull request and every tag deploys
                this page to its own hostname under{" "}
                <code>ask-zed-widget.0g.ai</code>. Each hostname is its own
                origin, so previews never share a saved conversation.
              </p>
            </footer>
          </main>
        </div>
      </div>

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

