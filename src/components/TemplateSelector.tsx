import { memo } from "react";
import type { ComposerMode } from "../types/outreach.ts";
import { templateCatalog } from "../templates/registry.ts";
import { TemplateCard } from "./TemplateCard.tsx";

type TemplateSelectorProps = {
  selectedTemplate: ComposerMode;
  onSelect: (templateId: ComposerMode) => void;
};

export const TemplateSelector = memo(function TemplateSelector({
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <section aria-labelledby="template-heading" className="rounded-3xl border border-line bg-white p-6 shadow-[0_24px_60px_-36px_rgba(12,35,64,0.45)] sm:p-8">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">Email Style</p>
      <h2 id="template-heading" className="mt-2 font-serif text-2xl text-navy">
        Choose Template
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Choose a design, or write your own email. The preview uses your current details.
      </p>
      <div role="radiogroup" aria-label="Email style" className="mt-5 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
        {templateCatalog.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            description={template.description}
            selected={selectedTemplate === template.id}
            onSelect={() => onSelect(template.id)}
          />
        ))}
        <label
          className={`flex h-full cursor-pointer flex-col rounded-2xl border-2 border-dashed p-3 transition ${
            selectedTemplate === "custom"
              ? "border-teal bg-[#f3fbfb] shadow-[0_18px_40px_-28px_rgba(14,124,132,0.85)]"
              : "border-line bg-[#fbfcfe] hover:border-[#b7c6d4]"
          } focus-within:ring-4 focus-within:ring-teal/25`}
        >
          <input
            type="radio"
            name="email-template"
            value="custom"
            checked={selectedTemplate === "custom"}
            onChange={() => onSelect("custom")}
            className="sr-only"
          />
          <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-white ring-1 ring-[#0c2340]/5">
            <span aria-hidden="true" className="font-serif text-3xl text-navy">
              Aa
            </span>
            <span className="mt-2 px-4 text-center text-xs font-semibold tracking-wide text-teal-deep uppercase">
              Write your own email
            </span>
          </div>
          <span className="mt-3 block px-1 text-sm font-semibold text-navy">Custom Email</span>
          <span className="mt-1 block flex-1 px-1 text-xs leading-5 text-muted">
            Your subject and message, with optional CareerLens branding.
          </span>
          <span className={`mt-3 inline-flex items-center gap-1.5 px-1 text-xs font-semibold ${selectedTemplate === "custom" ? "text-teal-deep" : "text-muted"}`}>
            {selectedTemplate === "custom" ? "Selected" : "Select template"}
          </span>
        </label>
      </div>
    </section>
  );
});
