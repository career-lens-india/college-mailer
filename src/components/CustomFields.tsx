import type { FieldErrors, OutreachDraft } from "../types/outreach.ts";
import { FormField } from "./FormField.tsx";

type CustomFieldsProps = {
  draft: OutreachDraft;
  errors: FieldErrors;
  submitted: boolean;
  touched: Partial<Record<keyof OutreachDraft, boolean>>;
  onChange: <K extends keyof OutreachDraft>(key: K, value: OutreachDraft[K]) => void;
  onTouch: (key: keyof OutreachDraft) => void;
};

const controlClass =
  "w-full scroll-mt-28 rounded-xl border bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-4";

function controlClasses(invalid: boolean): string {
  return invalid
    ? `${controlClass} border-[#e11d48] focus-visible:border-[#e11d48] focus-visible:ring-[#e11d48]/15`
    : `${controlClass} border-line focus-visible:border-teal focus-visible:ring-teal/15`;
}

export function CustomFields({ draft, errors, submitted, touched, onChange, onTouch }: CustomFieldsProps) {
  const subjectError = submitted || touched.customSubject ? errors.customSubject : undefined;
  const messageError = submitted || touched.customMessage ? errors.customMessage : undefined;
  const nameBlank = !draft.recipientName.trim() && draft.customMessage.includes("{{recipientName}}");

  return (
    <section aria-labelledby="custom-heading" className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h2 id="custom-heading" className="font-serif text-2xl text-navy">
        Custom Email
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Write the message in plain text. You can use {"{{recipientName}}"}, {"{{collegeName}}"}, {"{{department}}"}, and{" "}
        {"{{sessionInterest}}"}.
      </p>
      <div className="mt-5 grid gap-5">
        <FormField id="custom-subject" label="Subject" required error={subjectError}>
          <input
            id="custom-subject"
            name="customSubject"
            type="text"
            required
            value={draft.customSubject}
            aria-invalid={subjectError ? true : undefined}
            aria-describedby={subjectError ? "custom-subject-error" : undefined}
            className={controlClasses(Boolean(subjectError))}
            onChange={(event) => onChange("customSubject", event.target.value)}
            onBlur={() => onTouch("customSubject")}
          />
        </FormField>
        <FormField
          id="custom-message"
          label="Message"
          required
          error={messageError}
          hint={
            nameBlank
              ? "Recipient name is blank, so {{recipientName}} becomes Sir/Madam."
              : "Line breaks are kept. HTML is not used."
          }
        >
          <textarea
            id="custom-message"
            name="customMessage"
            required
            rows={10}
            value={draft.customMessage}
            placeholder={"Dear Sir/Madam,\n\nWrite your custom CareerLens message here..."}
            aria-invalid={messageError ? true : undefined}
            aria-describedby={messageError ? "custom-message-error custom-message-hint" : "custom-message-hint"}
            className={`${controlClasses(Boolean(messageError))} min-h-48 resize-y leading-6`}
            onChange={(event) => onChange("customMessage", event.target.value)}
            onBlur={() => onTouch("customMessage")}
          />
        </FormField>
      </div>
    </section>
  );
}
