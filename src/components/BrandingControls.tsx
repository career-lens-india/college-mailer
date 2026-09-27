import type { BrandingOptions } from "../types/outreach.ts";

const items: { key: keyof BrandingOptions; label: string }[] = [
  { key: "logo", label: "Logo" },
  { key: "banner", label: "Banner" },
  { key: "signature", label: "Signature" },
  { key: "footer", label: "Footer" },
];

type BrandingControlsProps = {
  branding: BrandingOptions;
  onChange: (branding: BrandingOptions) => void;
};

export function BrandingControls({ branding, onChange }: BrandingControlsProps) {
  return (
    <section aria-labelledby="branding-heading" className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h2 id="branding-heading" className="font-serif text-2xl text-navy">
        CareerLens Branding
      </h2>
      <div className="mt-4 divide-y divide-line">
        {items.map((item) => {
          const on = branding[item.key];
          const labelId = `branding-${item.key}-label`;
          return (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3">
              <span id={labelId} className="text-sm font-semibold text-navy">
                {item.label}
              </span>
              <span className="inline-flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  id={`branding-${item.key}`}
                  aria-checked={on}
                  aria-labelledby={labelId}
                  onClick={() => onChange({ ...branding, [item.key]: !on })}
                  className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 ${
                    on ? "bg-teal" : "bg-[#d5dee6]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      on ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="w-8 text-xs font-semibold tracking-wide text-navy" aria-hidden="true">
                  {on ? "ON" : "OFF"}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
