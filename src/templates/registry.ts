import type { ComposerMode, EmailTemplateData, TemplateId } from "../types/outreach.ts";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
};

export const templateCatalog: readonly TemplateMeta[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Formal institutional communication",
  },
  {
    id: "modern",
    name: "Modern Visual",
    description: "Technology-focused communication",
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    description: "Minimal premium communication",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Visual campus communication",
  },
];

export function templateName(id: ComposerMode): string {
  if (id === "custom") return "Custom Email";
  return templateCatalog.find((template) => template.id === id)?.name ?? "Modern Visual";
}

/** Illustration data for template-card thumbnails only. Preview uses the form. */
export const thumbnailSample: EmailTemplateData = {
  collegeName: "Your College",
  department: "CSE & ISE",
  sessionInterest: "Technical Guest Lecture",
};
