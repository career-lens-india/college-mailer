import { contentFields } from "../lib/templateContent.ts";
import type { TemplateId } from "../types/outreach.ts";

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/15";

type TemplateContentEditorProps = {
  template: TemplateId;
  content: Record<string, string>;
  onChange: (content: Record<string, string>) => void;
};

export function TemplateContentEditor({ template, content, onChange }: TemplateContentEditorProps) {
  return (
    <section aria-labelledby="content-heading" className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">Words</p>
      <h2 id="content-heading" className="mt-2 font-serif text-2xl text-navy">
        Edit Email Content
      </h2>
      <p id="content-token-hint" className="mt-2 text-sm leading-6 text-muted">
        Edit the words. The template keeps its layout. {"{{recipientName}}"}, {"{{collegeName}}"}, {"{{department}}"}, and {"{{sessionInterest}}"} use the details above.
      </p>
      <div className="mt-5 space-y-4">
        {contentFields(template).map((field) => {
          const id = `content-${field.key}`;
          const hintId = field.hint ? `${id}-hint` : undefined;
          const value = content[field.key] ?? "";
          return (
            <div key={field.key}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  id={id}
                  value={value}
                  rows={field.key === "additionalMessage" ? 4 : 5}
                  maxLength={4000}
                  aria-describedby={hintId ?? "content-token-hint"}
                  className={`${fieldClass} min-h-28 resize-y`}
                  onChange={(event) => onChange({ ...content, [field.key]: event.target.value })}
                />
              ) : (
                <input
                  id={id}
                  value={value}
                  maxLength={4000}
                  aria-describedby="content-token-hint"
                  className={fieldClass}
                  onChange={(event) => onChange({ ...content, [field.key]: event.target.value })}
                />
              )}
              {field.hint ? (
                <p id={hintId} className="mt-1.5 text-xs leading-5 text-muted">
                  {field.hint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
