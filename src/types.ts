export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  suggestions?: string[];
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  turnstileToken: string;
}

export type ChatErrorCode =
  | "forbidden"
  | "bad_request"
  | "turnstile"
  | "rate_minute"
  | "rate_day"
  | "global_cap"
  | "upstream";

export interface ChatErrorEnvelope {
  ok: false;
  code: ChatErrorCode;
  message: string;
}

export type ChatStreamChunk =
  | { type: "delta"; text: string }
  | { type: "suggestions"; items: string[] }
  | { type: "done" }
  | { type: "error"; code: ChatErrorCode; message: string };

export type WidgetTheme = "light" | "dark" | "auto";

export type WidgetPosition = "bottom-right" | "bottom-left";

export interface AskAIWidgetProps {
  /**
   * The backend `/api/chat` endpoint URL. Must return the NDJSON chunk
   * protocol this widget consumes. Example: `https://build.0g.ai/api/chat`.
   */
  apiUrl: string;

  /**
   * Cloudflare Turnstile site key. Required because the backend rejects any
   * request missing a verified token. Register your hostname in the
   * Turnstile dashboard before going live.
   */
  turnstileSiteKey: string;

  /**
   * Visual theme. `"auto"` follows the host site's `prefers-color-scheme`.
   * Default: `"auto"`.
   */
  theme?: WidgetTheme;

  /**
   * CSS color for the primary accent (send button, links, focus borders).
   * Default: `#B75FFF` (0G Hero Purple).
   */
  accent?: string;

  /**
   * Where the floating button sits on screen. Default: `"bottom-right"`.
   */
  position?: WidgetPosition;

  /**
   * If true, the panel is open on first mount. Default: `false`.
   */
  initialOpen?: boolean;

  /**
   * Controlled open state. When provided, the widget follows this value and
   * reports user-initiated changes through `onOpenChange` instead of
   * managing its own state. Leave undefined for uncontrolled behavior.
   */
  open?: boolean;

  /**
   * Called when the user opens or closes the panel (trigger click, close
   * button, Escape). Required for controlled usage; also fired in
   * uncontrolled mode as a notification.
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * When set, the panel header shows a maximize button linking here, for
   * hosts that pair the widget with a full-page chat (e.g. build.0g.ai/ask).
   * The conversation follows via `storageKey` when the page uses the same
   * key. Default: hidden.
   */
  maximizeHref?: string;

  /**
   * localStorage key used to persist the conversation. Set to a unique
   * value if you embed multiple widgets per site. Pass `null` to disable
   * persistence. Default: `"ask-ai-widget:conversation"`.
   */
  storageKey?: string | null;

  /**
   * Tooltip shown on the floating button before the panel opens.
   * Default: `"Ask AI"`.
   */
  triggerLabel?: string;

  /**
   * Optional starter questions rendered as chips in the empty state.
   * Pass an empty array to hide them. Default: a 0G-focused set.
   */
  starterQuestions?: string[];

  /**
   * Show the "Powered by 0G Compute" footer line. Default: `true`.
   */
  branding?: boolean;
}
