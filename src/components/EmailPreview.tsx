import { useLayoutEffect, useRef } from "react";

type EmailPreviewProps = {
  html: string | null;
};

export function EmailPreview({ html }: EmailPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !html) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    try {
      const template = document.createElement("template");
      template.innerHTML = html;
      shadow.replaceChildren(template.content.cloneNode(true));
    } catch {
      // Keep the shadow content that was already on screen.
    }
  }, [html]);

  return <div ref={hostRef} data-email-preview="" className="min-h-[40rem] bg-white" />;
}
