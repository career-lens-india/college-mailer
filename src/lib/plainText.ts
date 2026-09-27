import { brand, coreAreas, engagements } from "../brand/facts.ts";
import { defaultBranding, type ComposerMode, type EmailTemplateData } from "../types/outreach.ts";
import { buildPersonalization } from "./personalization.ts";
import { resolveEditableText } from "./templateContent.ts";
import { applyPersonalizationTokens } from "./tokens.ts";

export type PublicLinks = {
  websiteUrl: string;
  campusImpactUrl: string;
};

export function renderPlainText(
  data: EmailTemplateData,
  links: PublicLinks = {
    websiteUrl: brand.websiteUrl,
    campusImpactUrl: brand.campusImpactUrl,
  },
  template: ComposerMode = "modern",
): string {
  if (template === "custom") return renderCustomPlainText(data, links);
  const copy = buildPersonalization(data);
  const additionalMessage = resolveEditableText(data.content?.additionalMessage ?? "", data).trim();
  const lines = [
    "CareerLens India",
    "",
    "Industry-Led Learning for Students",
    "",
    copy.greeting,
    copy.designation,
    "",
    "CareerLens India works with industry professionals to bring practical, industry-focused learning to students.",
    "",
    copy.invitation,
    "",
    "Areas include:",
    ...coreAreas.map((area) => `- ${area}`),
    "",
    "Recent engagements:",
    ...engagements.map((engagement) => `${engagement.institution} — ${engagement.title}. ${engagement.detail}`),
    "",
    "Explore:",
    links.campusImpactUrl,
    "",
    ...(additionalMessage ? [additionalMessage, ""] : []),
    brand.name,
    brand.focus,
    brand.phoneDisplay,
    brand.email,
    links.websiteUrl,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

function renderCustomPlainText(data: EmailTemplateData, links: PublicLinks): string {
  const branding = data.branding ?? defaultBranding;
  const message = applyPersonalizationTokens(data.customMessage ?? "", data).trim();
  const lines = [
    branding.logo || branding.banner ? "CareerLens India" : null,
    branding.logo || branding.banner ? "" : null,
    message,
    "",
  ];
  if (branding.signature) {
    lines.push(brand.contactName, brand.contactRole, brand.phoneDisplay, brand.email, "");
  }
  if (branding.footer) {
    lines.push(brand.name, brand.focus, brand.phoneDisplay, brand.email, links.websiteUrl, links.campusImpactUrl);
  }
  return lines.filter((line) => line !== null).join("\n").trim();
}
