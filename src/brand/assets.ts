/**
 * Image URLs embedded in email HTML.
 *
 * Phase 1 loads these from the app so the preview can show the real artwork.
 * A later sending phase should replace them with absolute hosted URLs.
 * Do not point these at a local filesystem path.
 */
export const emailImages = {
  logoUrl: "/assets/careerlens-logo.png",
  bannerUrl: "/assets/careerlens-banner.jpg",
  heroProfessional: "/assets/hero-professional.jpg",
  heroModern: "/assets/hero-modern.jpg",
  heroMinimal: "/assets/hero-minimal.jpg",
  heroNewsletter: "/assets/hero-newsletter.jpg",
  logoAlt: "CareerLens India",
  bannerAlt:
    "CareerLens India. See the career before you choose it. Stream strategy, engineering roadmaps and IT growth planning.",
} as const;

export const appImages = {
  markUrl: "/assets/careerlens-mark.png",
  logoUrl: emailImages.logoUrl,
  bannerUrl: emailImages.bannerUrl,
} as const;
