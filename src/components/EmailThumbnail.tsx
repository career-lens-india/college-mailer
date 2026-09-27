const thumbnailSrc = {
  professional: "/assets/template-professional-preview.png",
  modern: "/assets/template-modern-preview.png",
  minimal: "/assets/template-minimal-preview.png",
  newsletter: "/assets/template-newsletter-preview.png",
} as const;

export function EmailThumbnail({ id, label }: { id: keyof typeof thumbnailSrc; label: string }) {
  return (
    <img
      src={thumbnailSrc[id]}
      alt={`${label} email design`}
      width={640}
      height={900}
      className="h-56 w-full rounded-xl object-cover object-top ring-1 ring-[#0c2340]/5"
    />
  );
}
