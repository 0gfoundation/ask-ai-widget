import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { Zed } from "../zed/Zed";
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
            {m.role === "assistant" ? (
              <div className="flex items-start gap-2">
                <Zed state="idle" size={28} className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <MessageBubble message={m} />
                </div>
              </div>
            ) : (
              <MessageBubble message={m} />
            )}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pl-9">
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
        <div className="flex items-start gap-2">
          <Zed state="thinking" size={28} className="mt-1 shrink-0" />
          <div className="rounded-2xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-4 py-3 text-xs italic text-[var(--aai-fg-muted)]">
            Thinking
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
