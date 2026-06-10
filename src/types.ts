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
