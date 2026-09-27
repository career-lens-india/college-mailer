import type { TemplateId } from "../types/outreach.ts";
import { EmailThumbnail } from "./EmailThumbnail.tsx";

type TemplateCardProps = {
  id: TemplateId;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

export function TemplateCard({ id, name, description, selected, onSelect }: TemplateCardProps) {
  return (
    <label
      className={`flex h-full cursor-pointer flex-col rounded-2xl border-2 p-3 transition ${
        selected
          ? "border-teal bg-[#f3fbfb] shadow-[0_18px_40px_-28px_rgba(14,124,132,0.85)]"
          : "border-line bg-white hover:border-[#b7c6d4]"
      } focus-within:ring-4 focus-within:ring-teal/25`}
    >
      <input
        type="radio"
        name="email-template"
          value={id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <EmailThumbnail id={id} label={name} />
      <span className="mt-3 block px-1 text-sm font-semibold text-navy">{name}</span>
      <span className="mt-1 block flex-1 px-1 text-xs leading-5 text-muted">{description}</span>
      <span className={`mt-3 inline-flex items-center gap-1.5 px-1 text-xs font-semibold ${selected ? "text-teal-deep" : "text-muted"}`}>
        {selected ? (
          <>
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
              <path d="M6.2 11.4 2.9 8.1l1.1-1.1 2.2 2.2 5-5.1 1.1 1.1z" />
            </svg>
            Selected
          </>
        ) : (
          "Select template"
        )}
      </span>
    </label>
  );
}
