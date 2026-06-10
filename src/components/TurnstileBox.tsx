import { useImperativeHandle, useRef, forwardRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export interface TurnstileBoxHandle {
  /**
   * Resolves with a fresh Turnstile token. If the widget hasn't been solved
   * yet, this kicks an execution and waits for the callback. Resolves with
   * `null` if the site key isn't configured.
   */
  getToken(): Promise<string | null>;
  reset(): void;
}

interface TurnstileBoxProps {
  siteKey: string | undefined;
}

export const TurnstileBox = forwardRef<TurnstileBoxHandle, TurnstileBoxProps>(
  function TurnstileBox({ siteKey }, ref) {
    const widgetRef = useRef<TurnstileInstance | null>(null);

    useImperativeHandle(ref, () => ({
      async getToken() {
        if (!siteKey) return null;
        const widget = widgetRef.current;
        if (!widget) return null;
        const existing = widget.getResponse();
        if (existing) return existing;
        try {
          widget.execute();
        } catch {
          return null;
        }
        const deadline = Date.now() + 5000;
        return await new Promise<string | null>((resolve) => {
          const tick = () => {
            const t = widgetRef.current?.getResponse();
            if (t) return resolve(t);
            if (Date.now() > deadline) return resolve(null);
            setTimeout(tick, 100);
          };
          tick();
        });
      },
      reset() {
        widgetRef.current?.reset();
      },
    }));

    if (!siteKey) return null;

    return (
      <Turnstile
        ref={widgetRef}
        siteKey={siteKey}
        options={{ size: "invisible", appearance: "interaction-only" }}
      />
    );
  },
);
