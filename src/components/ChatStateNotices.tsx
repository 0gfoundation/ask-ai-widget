import { AlertCircle } from "lucide-react";
import type { ChatErrorCode } from "../types";

const FRIENDLY: Record<ChatErrorCode, string> = {
  forbidden: "We can't accept requests from this origin.",
  bad_request: "That message couldn't be sent. Try shortening it (max 2,000 characters).",
  turnstile: "Couldn't verify you're human. Refresh the page and try again.",
  rate_minute: "Slow down. 10 messages a minute. Try again in a moment.",
  rate_day: "You've hit the daily message limit. Resets at UTC midnight.",
  global_cap: "The bot is resting today. Try again after UTC midnight.",
  upstream: "0G Compute didn't respond. Try again in a moment.",
};

interface ChatStateNoticesProps {
  error: { code: ChatErrorCode; message?: string } | null;
  onDismiss: () => void;
}

export default function ChatStateNotices({ error, onDismiss }: ChatStateNoticesProps) {
  if (!error) return null;
  const text = error.message && error.code === "bad_request" ? error.message : FRIENDLY[error.code];
  return (
    <div className="mx-4 mb-2 flex items-start gap-2 rounded-xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-3 py-2 text-sm text-[var(--aai-fg-muted)]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--aai-accent-text)]" />
      <p className="flex-1">{text}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-[var(--aai-fg-subtle)] hover:text-[var(--aai-fg)]"
      >
        ×
      </button>
    </div>
  );
}
