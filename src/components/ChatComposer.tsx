import { useEffect, useRef, useState } from "react";
import { Send, Square, Trash2 } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onClear?: () => void;
  canClear?: boolean;
  disabled: boolean;
  streaming?: boolean;
  placeholder?: string;
}

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  onClear,
  canClear,
  disabled,
  streaming,
  placeholder,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  useEffect(() => () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  }, []);

  const handleClearClick = () => {
    if (!onClear) return;
    if (confirmingClear) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setConfirmingClear(false);
      onClear();
      return;
    }
    setConfirmingClear(true);
    clearTimerRef.current = setTimeout(() => setConfirmingClear(false), 3000);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim().length > 0) onSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 px-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? "Ask Zed anything about 0G..."}
        rows={1}
        disabled={disabled && !streaming}
        className="flex-1 resize-none overflow-y-auto rounded-xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-4 py-3 text-sm leading-6 text-[var(--aai-fg)] placeholder:text-[var(--aai-fg-subtle)] focus:border-[var(--aai-accent)] focus:outline-none disabled:opacity-60"
        maxLength={2000}
      />
      {streaming ? (
        <button
          onClick={onStop}
          aria-label="Stop generating"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--aai-border)] bg-[var(--aai-bg-card)] text-[var(--aai-fg)] transition-colors hover:border-[var(--aai-hover-border)] hover:bg-[var(--aai-hover-surface)]"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={disabled || value.trim().length === 0}
          aria-label="Send"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--aai-accent)] text-[var(--aai-accent-fg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
      {canClear && onClear && (
        <div className="relative h-11 w-11 shrink-0">
          <button
            onClick={handleClearClick}
            aria-label={confirmingClear ? "Click again to confirm clearing the chat" : "Clear chat"}
            title={confirmingClear ? "Click again to confirm" : "Clear chat"}
            className={`absolute right-0 top-0 inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-[var(--aai-bg-card)] transition-all ${
              confirmingClear
                ? "border-[var(--aai-accent)] px-3 text-[var(--aai-accent-text)] shadow-[var(--aai-shadow)] z-10"
                : "w-11 border-[var(--aai-border)] text-[var(--aai-fg-muted)] hover:border-[var(--aai-hover-border)] hover:text-[var(--aai-fg)]"
            }`}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            {confirmingClear && (
              <span className="text-xs font-medium whitespace-nowrap">Click again to clear</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
