import { useState } from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";
import { useResolvedTheme } from "../theme";

const LANG_MAP: Record<string, Language | "text"> = {
  bash: "bash",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  python: "python",
  go: "go",
  rust: "rust",
  rs: "rust",
  sol: "clike",
  solidity: "clike",
  json: "json",
  text: "text",
  txt: "text",
};

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can fail in non-secure contexts
    }
  };
  return (
    <button
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--aai-border)] bg-[var(--aai-bg-card)] text-[var(--aai-fg-muted)] opacity-0 transition-opacity hover:text-[var(--aai-fg)] group-hover:opacity-100 focus:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function CodeBlock({ code, language, className = "" }: CodeBlockProps) {
  const theme = useResolvedTheme();
  const mapped = LANG_MAP[language] ?? "text";
  const isDark = theme === "dark";
  const prismTheme = isDark ? themes.vsDark : themes.oneLight;
  const bg = "var(--aai-code-bg)";
  const plainText = isDark ? "var(--aai-fg-muted)" : "var(--aai-fg)";

  const scrollStyle = {
    scrollbarWidth: "thin" as const,
    scrollbarColor: "var(--aai-border) transparent",
  };

  if (mapped === "text") {
    return (
      <div className={`group relative ${className}`}>
        <pre
          style={{ background: bg, color: "var(--aai-fg-muted)", ...scrollStyle }}
          className="px-6 py-4 overflow-x-auto text-xs font-mono leading-relaxed"
        >
          <code>{code}</code>
        </pre>
        <CopyButton code={code} />
      </div>
    );
  }

  return (
    <Highlight theme={prismTheme} code={code.trim()} language={mapped}>
      {({ className: prismClass, style, tokens, getLineProps, getTokenProps }) => (
        <div className={`group relative ${className}`}>
          <pre
            className={`${prismClass} px-6 py-4 overflow-x-auto text-xs font-mono leading-relaxed`}
            style={{ ...style, background: bg, color: plainText, ...scrollStyle }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
          <CopyButton code={code} />
        </div>
      )}
    </Highlight>
  );
}
