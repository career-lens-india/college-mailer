import { parseRecipientList } from "../lib/recipients.ts";
import type { FieldErrors, OutreachDraft } from "../types/outreach.ts";

type ReadinessIndicatorProps = {
  draft: OutreachDraft;
  errors: FieldErrors;
  ready: boolean;
};

type Mark = "ok" | "warn";

function Row({ label, mark }: { label: string; mark: Mark }) {
  return (
    <li className="flex items-center gap-2 text-sm text-ink">
      <span aria-hidden="true" className={mark === "ok" ? "text-teal-deep" : "text-[#b45309]"}>
        {mark === "ok" ? "✓" : "⚠"}
      </span>
      <span>{label}</span>
    </li>
  );
}

export function ReadinessIndicator({ draft, errors, ready }: ReadinessIndicatorProps) {
  const parsed = parseRecipientList(draft.recipientEmail);
  const recipientOk = !errors.recipientEmail && parsed.invalid.length === 0 && parsed.recipients.length > 0;
  const collegeOk = !errors.collegeName && draft.collegeName.trim().length > 0;
  const messageOk =
    draft.selectedTemplate !== "custom" ||
    (!errors.customSubject && !errors.customMessage && Boolean(draft.customSubject.trim()) && Boolean(draft.customMessage.trim()));
  const departmentOk = !errors.department && (draft.placementOutreach || draft.department.trim().length > 0);

  return (
    <section aria-label="Email readiness" className="rounded-2xl border border-line bg-white/80 px-4 py-4">
      <h2 className="text-sm font-semibold text-navy">Email readiness</h2>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        <Row label="Recipient" mark={recipientOk ? "ok" : "warn"} />
        <Row label="College" mark={collegeOk ? "ok" : "warn"} />
        <Row label="Template" mark="ok" />
        <Row label="Message" mark={messageOk ? "ok" : "warn"} />
        <Row label="Department" mark={departmentOk ? "ok" : "warn"} />
        {draft.placementOutreach ? <Row label="Placement" mark="ok" /> : null}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-sm font-semibold text-navy">
        {ready ? "Ready to send ✓" : "Complete the required details."}
      </p>
    </section>
  );
}
