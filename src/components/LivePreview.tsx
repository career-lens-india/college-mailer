import { useMemo, useState } from "react";
import { commitPreview, renderPreviewFragment } from "../lib/previewMarkup.ts";
import { subjectForDelivery } from "../lib/subject.ts";
import { templateName } from "../templates/registry.ts";
import type { EmailTemplateData, OutreachDraft } from "../types/outreach.ts";
import { EmailPreview } from "./EmailPreview.tsx";
import { PreviewBoundary } from "./PreviewBoundary.tsx";
import { PreviewChrome } from "./DesktopPreview.tsx";

type PreviewMode = "desktop" | "mobile";

type LivePreviewProps = {
  draft: OutreachDraft;
  data: EmailTemplateData;
};

export function LivePreview({ draft, data }: LivePreviewProps) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [storedHtml, setStoredHtml] = useState<string | null>(null);
  const rendered = useMemo(() => {
    try {
      return renderPreviewFragment(draft.selectedTemplate, data, mode === "mobile");
    } catch {
      return null;
    }
  }, [draft.selectedTemplate, data, mode]);
  if (rendered && rendered !== storedHtml) setStoredHtml(rendered);
  const committed = commitPreview(storedHtml, rendered);

  const subject =
    draft.selectedTemplate === "custom" && !draft.customSubject.trim()
      ? "Add a subject"
      : !data.collegeName.trim() && draft.selectedTemplate !== "custom"
        ? "Add a college name to complete the subject"
        : subjectForDelivery({
            template: draft.selectedTemplate,
            collegeName: data.collegeName,
            customSubject: draft.customSubject,
            data,
            test: false,
          });

  return (
    <section aria-labelledby="live-preview-title" className="flex h-auto min-h-[24rem] min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-[#eef3f6] lg:h-full lg:max-h-full lg:min-h-0">
      <div className="shrink-0 border-b border-line bg-white px-4 py-4 sm:rounded-t-3xl sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 id="live-preview-title" className="font-serif text-2xl text-navy">
              Live Preview
            </h2>
            <p className="mt-1 text-sm text-muted">
              {templateName(draft.selectedTemplate)}
              <span className="sr-only">.</span>
            </p>
            <p className="mt-1 text-sm break-words text-muted">
              Subject: <span className="font-semibold text-ink">{subject}</span>
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="inline-flex rounded-xl bg-[#e7eef3] p-1" role="group" aria-label="Preview size">
              <button
                id="preview-desktop"
                type="button"
                aria-pressed={mode === "desktop"}
                className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 ${
                  mode === "desktop" ? "bg-white text-navy shadow-sm" : "text-muted"
                }`}
                onClick={() => setMode("desktop")}
              >
                Desktop
              </button>
              <button
                id="preview-mobile"
                type="button"
                aria-pressed={mode === "mobile"}
                className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 ${
                  mode === "mobile" ? "bg-white text-navy shadow-sm" : "text-muted"
                }`}
                onClick={() => setMode("mobile")}
              >
                Mobile
              </button>
            </div>
            <p aria-live="polite" className="text-xs font-semibold text-muted">
              {committed.failed ? "Preview could not be updated." : "✓ Updated"}
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-4">
        <div className={`mx-auto w-full ${mode === "mobile" ? "max-w-[375px]" : "max-w-[680px]"}`}>
          <PreviewChrome>
            <PreviewBoundary resetKey="preview-canvas">
              {committed.html ? (
                <EmailPreview html={committed.html} />
              ) : (
                <div className="px-6 py-10 text-center" role="alert">
                  <p className="text-sm font-semibold text-navy">Preview unavailable</p>
                  <p className="mt-2 text-sm text-muted">Try another template.</p>
                </div>
              )}
            </PreviewBoundary>
          </PreviewChrome>
        </div>
      </div>
    </section>
  );
}
