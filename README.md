# @0gfoundation/ask-ai-widget

A floating Ask AI chatbot for any React site. Backed by 0G Compute. Drop it into Docusaurus, Next.js, Vite, or anywhere React renders. Inherits the same prompt, RAG knowledge index, and guardrails as `build.0g.ai/ask`.

## Install

```bash
npm install @0gfoundation/ask-ai-widget
```

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
| `accent` | `string` | `"#B75FFF"` | CSS color for primary buttons and accents. |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | Corner the floating button anchors to. |
| `initialOpen` | `boolean` | `false` | Open on first mount. Otherwise restores from sessionStorage. |
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
