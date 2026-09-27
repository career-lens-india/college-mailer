import { TEMPLATE_REFRESH_LABEL } from "../lib/templateSwitch.ts";

export function TemplateRefreshOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0c2340]/30 px-4 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-3xl border border-line bg-white px-10 py-8 text-center shadow-[0_24px_60px_-36px_rgba(12,35,64,0.55)]">
        <div className="flex items-center justify-center gap-2.5" aria-hidden="true">
          <span className="template-dot" />
          <span className="template-dot template-dot-delay-1" />
          <span className="template-dot template-dot-delay-2" />
        </div>
        <p className="mt-4 text-sm font-semibold text-navy">{TEMPLATE_REFRESH_LABEL}</p>
      </div>
    </div>
  );
}
