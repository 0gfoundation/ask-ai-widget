import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "../types";

interface MessageListProps {
  messages: ChatMessage[];
  awaitingFirstDelta: boolean;
  onSuggestionClick: (text: string) => void;
  suggestionsEnabled: boolean;
}

export default function MessageList({
  messages,
  awaitingFirstDelta,
  onSuggestionClick,
  suggestionsEnabled,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const messageCount = messages.length;

  // Scroll the LAST message into view inside the scroll container (not the
  // window — important because the widget panel has its own scrollable
  // region). Use `nearest` block to avoid jumping past the composer.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount, awaitingFirstDelta]);

  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {messages.map((m, i) => {
        if (m.role === "assistant" && m.content === "") return null;
        const showSuggestions =
          i === lastAssistantIdx &&
          !awaitingFirstDelta &&
          Array.isArray(m.suggestions) &&
          m.suggestions.length > 0;
        return (
          <div key={i} className="flex flex-col gap-2">
            <MessageBubble message={m} />
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pl-1">
                {m.suggestions!.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!suggestionsEnabled}
                    onClick={() => onSuggestionClick(s)}
                    className="rounded-full border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-3 py-1.5 text-xs text-[var(--aai-fg-muted)] transition-colors hover:border-[var(--aai-accent-text)] hover:text-[var(--aai-fg)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {awaitingFirstDelta && (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--aai-fg-muted)]">
              <span className="italic">Thinking</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--aai-fg-muted)]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--aai-fg-muted)] [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--aai-fg-muted)] [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
