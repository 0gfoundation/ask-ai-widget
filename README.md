# @0gfoundation/ask-ai-widget

A floating Ask AI chatbot for any React site. Backed by 0G Compute. Drop it into Docusaurus, Next.js, Vite, or anywhere React renders. Inherits the same prompt, RAG knowledge index, and guardrails as `build.0g.ai/ask`.

## Install

This package is distributed directly from GitHub, not the npm registry. The package's `prepare` script builds the bundle on install, so no manual build step is needed on the consumer side.

```bash
npm install github:0gfoundation/ask-ai-widget#v0.1.0
```

Pin to a tag in production (`#v0.1.0`). For tracking the bleeding edge, use the branch: `npm install github:0gfoundation/ask-ai-widget#main`.

The imported package name is still `@0gfoundation/ask-ai-widget` since that's what's declared in the package's own `package.json` — the install URL just controls where the code comes from.

## Usage

```tsx
import { AskAIWidget } from "@0gfoundation/ask-ai-widget";
import "@0gfoundation/ask-ai-widget/styles.css";

export default function App() {
  return (
    <>
      {/* your app */}
      <AskAIWidget
        apiUrl="https://build.0g.ai/api/chat"
        turnstileSiteKey="0x4AAAAAAA_your_key"
      />
    </>
  );
}
```

That's it. The widget renders a floating purple chat button in the bottom-right. Click it to talk to the bot.

## Full page

`ChatPage` is the same chat with no trigger, header or positioning, for a dedicated route like `build.0g.ai/ask`. It fills its container, so give the parent a height. Mount it with the same `storageKey` as the floating widget on the same origin and the conversation follows between the two.

```tsx
import { ChatPage } from "@0gfoundation/ask-ai-widget";

export default function AskPage() {
  return (
    <div style={{ height: "80vh" }}>
      <ChatPage
        apiUrl="https://build.0g.ai/api/chat"
        turnstileSiteKey="0x4AAAAAAA_your_key"
        style={{ borderRadius: 16, border: "1px solid #E5E5E5" }}
      />
    </div>
  );
}
```

It takes `apiUrl`, `turnstileSiteKey`, `theme`, `accent`, `storageKey`, `starterQuestions` and `branding` with the same meaning as the widget, plus `className` and `style` on the root for the host's own border, radius or sizing.

Pair the two with `maximizeHref` on the widget pointing at the page's route and the popup header gets a maximize button.

## Theming contract

The widget owns every colour, size and face in both themes so answers render the same on every host. A host can influence three things, all on the widget root:

- `accent`, adjusted as described in the props table.
- `--aai-font-sans` and `--aai-font-mono`, CSS custom properties, to use the host's own faces instead of the system stacks.

Nothing else on the page reaches inside the widget: its utilities are emitted with `!important` and every element markdown can produce is pinned to the widget's own values.

## Zed

Zed is the character on the trigger, in the panel header, next to every answer, and in the error notice. It is one parametric SVG, exported from this package so any 0G site can use the same drawing:

```tsx
import { Zed } from "@0gfoundation/ask-ai-widget";

<Zed state="idle" size={32} />
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `state` | `"idle" \| "thinking" \| "answered" \| "error" \| "resting"` | `"idle"` | Only the eyes change between states. |
| `size` | `number` | `32` | Outline and eye size are computed from this, so 16px is not a shrunken 96px. |
| `animate` | `boolean` | `true` | Idle blink and thinking bounce. Off under `prefers-reduced-motion` regardless. |
| `title` | `string` | `"Zed"` | Accessible name. |

`ZED_COLORS`, `ZED_STATES`, `zedStrokeWidth` and `zedEyeBox` are exported for hosts that need to draw or match the character elsewhere.

Static assets live in `assets/zed/`: one SVG per state, `favicon.svg` (small-size geometry), and PNGs at 16, 32, 180 and 512 for the Safari favicon, apple-touch-icon and maskable icon. They are regenerated from the component with `npm run build && npm run export:zed`, so the icons are never a separate drawing.

Design reference: the "Meet Zed" board and the Claude Design character sheet (ask the 0G Builders team for links). This component is the production source of truth; copy tuned values from the canvas into `src/zed/Zed.tsx`.

## Docusaurus integration

In `src/theme/Root.tsx`:

```tsx
import React from "react";
import { AskAIWidget } from "@0gfoundation/ask-ai-widget";
import "@0gfoundation/ask-ai-widget/styles.css";

export default function Root({ children }) {
  return (
    <>
      {children}
      <AskAIWidget
        apiUrl="https://build.0g.ai/api/chat"
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY}
        theme="auto"
      />
    </>
  );
}
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `apiUrl` | `string` | required | The `/api/chat` endpoint URL. |
| `turnstileSiteKey` | `string` | required | Register your hostname in the Cloudflare Turnstile dashboard. |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | `auto` follows `prefers-color-scheme`. |
| `accent` | `string` | `"#B75FFF"` | CSS color for the send button, user bubbles and links. Adjusted per theme where needed so it stays legible: filled surfaces reach 3:1 and accent text 4.5:1 against the widget background, and text on filled surfaces is ink or white, whichever reads better. |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | Corner the floating button anchors to. |
| `initialOpen` | `boolean` | `false` | Open on first mount. Otherwise restores from sessionStorage. |
| `maximizeHref` | `string` | hidden | Adds a maximize button in the panel header linking to a full-page chat (see `ChatPage`). |
| `storageKey` | `string \| null` | `"ask-ai-widget:conversation"` | localStorage namespace for the conversation. Pass `null` to disable persistence. |
| `triggerLabel` | `string` | `"Ask AI"` | aria-label on the closed-state button. |
| `starterQuestions` | `string[]` | a 0G-focused set | Empty array hides them. |
| `branding` | `boolean` | `true` | Show the "Powered by 0G Compute" footer. |

## Before going live

The widget hits an `/api/chat` endpoint that needs to:

1. Allow your hostname's origin in its CORS / origin allowlist.
2. Accept the Turnstile token issued for that hostname.
3. Return the NDJSON stream chunks documented under [Protocol](#protocol).

If you're embedding on `docs.0g.ai`, add `docs.0g.ai` to the Turnstile widget hostnames in the Cloudflare dashboard. Without that, every request returns `turnstile`.

## Protocol

The widget POSTs:

```json
{ "messages": [{"role": "user", "content": "..."}], "turnstileToken": "..." }
```

And expects newline-delimited JSON chunks back:

```
{"type":"delta","text":"streaming "}
{"type":"delta","text":"answer"}
{"type":"suggestions","items":["follow-up 1","follow-up 2","follow-up 3"]}
{"type":"done"}
```

Or an error envelope (single JSON, not a stream):

```json
{ "ok": false, "code": "rate_minute", "message": "..." }
```

## Local development

```bash
npm install
npm run dev:demo
```

Opens `http://localhost:5173`. By default it points at `http://localhost:3000/api/chat` (a locally-running Builder Hub) and uses the always-pass Turnstile test key.

To target a deployed backend instead:

```bash
VITE_API_URL=https://build.0g.ai/api/chat \
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_your_key \
npm run dev:demo
```

## Previews

Every push to main, every pull request and every tag deploys the demo to the ask-zed-widget Vercel project (`.github/workflows/preview.yml`):

| What | Where | Who can open it |
|---|---|---|
| main | `https://main.ask-zed-widget.0g.ai` | Vercel team login |
| PR N | `https://pr-N.ask-zed-widget.0g.ai` | Vercel team login |
| tag vX.Y.Z | `https://vX-Y-Z.ask-zed-widget.0g.ai` | public, kept permanently |
| latest tag | `https://ask-zed-widget.0g.ai` | public |

The demo talks to the real chat backend at `https://0g.ai/zed/api/chat`. Each hostname is its own origin, so previews don't share a saved conversation.

## Build

```bash
npm run build
```

Emits to `dist/`:

- `index.js` (ESM)
- `index.cjs` (CJS)
- `index.d.ts` (types)
- `styles.css` (Tailwind-compiled, scoped to `[data-ask-ai-widget]`)

## License

MIT
