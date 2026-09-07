import { useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";
import type { ChatMessage } from "../types";

interface MessageBubbleProps {
  message: ChatMessage;
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy answer"}
      className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--aai-border)] bg-[var(--aai-bg-card)] px-2 text-[11px] text-[var(--aai-fg-muted)] transition-colors hover:border-[var(--aai-hover-border)] hover:text-[var(--aai-fg)]"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`min-w-0 max-w-[92%] overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[88%] ${
          isUser
            ? "bg-[var(--aai-accent)] text-[var(--aai-accent-fg)]"
            : "bg-[var(--aai-bg-card)] border border-[var(--aai-border)] text-[var(--aai-fg-muted)]"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="space-y-3 [&_p]:leading-relaxed [&_pre]:my-2 [&_pre]:rounded-xl [&_a]:text-[var(--aai-accent-text)] [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--aai-border)] [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-[var(--aai-border)] [&_td]:px-2 [&_td]:py-1 [&_:not(pre)>code]:bg-[var(--aai-hover-surface)] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table({ children }) {
                    return (
                      <div className="-mx-1 my-2 overflow-x-auto">
                        <table>{children}</table>
                      </div>
                    );
                  },
                  code(props) {
                    const { className, children, node: _node, ...rest } = props as {
                      className?: string;
                      children?: React.ReactNode;
                      node?: unknown;
                    };
                    const match = /language-(\w+)/.exec(className || "");
                    const isBlock = !!match;
                    if (!isBlock) {
                      return (
                        <code className={className} {...rest}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <CodeBlock
                        language={match![1]}
                        code={String(children).replace(/\n$/, "")}
                        className="!my-0"
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.content.length > 0 && <CopyMessageButton text={message.content} />}
          </>
        )}
      </div>
    </div>
  );
}
