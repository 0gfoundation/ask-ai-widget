import { useCallback, useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import ChatStateNotices from "./ChatStateNotices";
import { TurnstileBox, type TurnstileBoxHandle } from "./TurnstileBox";
import type {
  ChatErrorCode,
  ChatMessage,
  ChatStreamChunk,
} from "../types";

interface ErrorState {
  code: ChatErrorCode;
  message?: string;
}

interface ChatPanelProps {
  apiUrl: string;
  turnstileSiteKey: string;
  storageKey: string | null;
  starterQuestions: string[];
  branding: boolean;
  /** Called when the user picks a starter question or first sends a message. */
  onActivity?: () => void;
}

function loadConversation(storageKey: string | null): ChatMessage[] {
  if (!storageKey || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string" &&
        (m as ChatMessage).content.length > 0,
    );
  } catch {
    return [];
  }
}

export default function ChatPanel({
  apiUrl,
  turnstileSiteKey,
  storageKey,
  starterQuestions,
  branding,
  onActivity,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [awaitingFirstDelta, setAwaitingFirstDelta] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  const turnstileRef = useRef<TurnstileBoxHandle>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore conversation from localStorage on mount.
  useEffect(() => {
    const saved = loadConversation(storageKey);
    if (saved.length > 0) setMessages(saved);
  }, [storageKey]);

  // Persist conversation. Skip while streaming to avoid thrashing storage
  // on every token.
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (isStreaming) return;
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {
      // quota / private mode — non-fatal
    }
  }, [messages, isStreaming, storageKey]);

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isStreaming) return;
      setError(null);
      onActivity?.();

      const next: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      setInput("");
      setIsStreaming(true);
      setAwaitingFirstDelta(true);

      const assistantIndex = next.length;
      setMessages([...next, { role: "assistant", content: "" }]);

      const turnstileToken = (await turnstileRef.current?.getToken()) ?? "";

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, turnstileToken }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let envelope: { code?: ChatErrorCode; message?: string } = {};
          try {
            envelope = await res.json();
          } catch {
            // ignore
          }
          rollbackAssistant();
          setError({
            code: envelope.code ?? "upstream",
            message: envelope.message,
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantContent = "";
        let assistantSuggestions: string[] | undefined;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            try {
              const chunk = JSON.parse(line) as ChatStreamChunk;
              if (chunk.type === "delta") {
                assistantContent += chunk.text;
                if (awaitingFirstDelta) setAwaitingFirstDelta(false);
                setMessages((prev) => {
                  const copy = prev.slice();
                  copy[assistantIndex] = {
                    role: "assistant",
                    content: assistantContent,
                    suggestions: assistantSuggestions,
                  };
                  return copy;
                });
              } else if (chunk.type === "suggestions") {
                assistantSuggestions = chunk.items;
                setMessages((prev) => {
                  const copy = prev.slice();
                  copy[assistantIndex] = {
                    role: "assistant",
                    content: assistantContent,
                    suggestions: assistantSuggestions,
                  };
                  return copy;
                });
              } else if (chunk.type === "error") {
                rollbackAssistant();
                setError({ code: chunk.code, message: chunk.message });
                return;
              }
            } catch {
              // malformed line — ignore
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          rollbackAssistant();
          return;
        }
        rollbackAssistant();
        setError({ code: "upstream" });
      } finally {
        setIsStreaming(false);
        setAwaitingFirstDelta(false);
        abortRef.current = null;
        turnstileRef.current?.reset();
      }

      function rollbackAssistant() {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    },
    [apiUrl, awaitingFirstDelta, isStreaming, messages, onActivity],
  );

  const onSubmit = useCallback(() => {
    void send(input);
  }, [input, send]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const onClear = useCallback(() => {
    if (isStreaming) {
      abortRef.current?.abort();
    }
    setMessages([]);
    setError(null);
  }, [isStreaming]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--aai-bg)]">
      {/* Scrollable message region. data-lenis-prevent stops smooth-scroll
          libraries on the host page from hijacking wheel events here. */}
      <div
        data-lenis-prevent
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--aai-border) transparent",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-8">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-[var(--aai-fg)]">
                Ask anything about 0G
              </h2>
              <p className="text-xs text-[var(--aai-fg-muted)]">
                Powered by 0G Compute. Answers with citations.
              </p>
            </div>
            {starterQuestions.length > 0 && (
              <div className="grid w-full grid-cols-1 gap-2">
                {starterQuestions.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => send(ex)}
                    className="rounded-xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-3 py-2.5 text-left text-xs text-[var(--aai-fg)] transition-colors hover:border-[var(--aai-hover-border)] hover:bg-[var(--aai-hover-surface)]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MessageList
            messages={messages}
            awaitingFirstDelta={awaitingFirstDelta}
            onSuggestionClick={(text) => send(text)}
            suggestionsEnabled={!isStreaming}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--aai-border)] bg-[var(--aai-bg)]">
        <div className="px-3 pt-3 pb-2">
          <ChatStateNotices error={error} onDismiss={() => setError(null)} />
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={onSubmit}
            onStop={onStop}
            onClear={onClear}
            canClear={messages.length > 0 && !isStreaming}
            disabled={isStreaming}
            streaming={isStreaming}
          />
          {branding && (
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--aai-accent-text)]">
              Powered by 0G Compute
            </p>
          )}
        </div>
      </div>

      <TurnstileBox ref={turnstileRef} siteKey={turnstileSiteKey} />
    </div>
  );
}
