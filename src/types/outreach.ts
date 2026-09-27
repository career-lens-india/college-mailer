import type {
  MinimalContent,
  ModernContent,
  NewsletterContent,
  ProfessionalContent,
} from "./templateContent.ts";

export const SESSION_INTERESTS = [
  "General Industry Interaction",
  "Technical Guest Lecture",
  "Hands-on Workshop",
  "Career & Industry Readiness",
  "Faculty Development",
  "Emerging Technology Session",
  "Not Specified",
] as const;

export type SessionInterest = (typeof SESSION_INTERESTS)[number];

export const TEMPLATE_IDS = ["professional", "modern", "minimal", "newsletter"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const COMPOSER_MODES = [...TEMPLATE_IDS, "custom"] as const;

export type ComposerMode = (typeof COMPOSER_MODES)[number];

export type BrandingOptions = {
  logo: boolean;
  banner: boolean;
  signature: boolean;
  footer: boolean;
};

export const defaultBranding: BrandingOptions = {
  logo: true,
  banner: true,
  signature: true,
  footer: true,
};

export type OutreachDraft = {
  recipientEmail: string;
  recipientName: string;
  designation: string;
  collegeName: string;
  department: string;
  placementOutreach: boolean;
  sessionInterest: SessionInterest;
  selectedTemplate: ComposerMode;
  customSubject: string;
  customMessage: string;
  branding: BrandingOptions;
  professionalContent: ProfessionalContent;
  modernContent: ModernContent;
  minimalContent: MinimalContent;
  newsletterContent: NewsletterContent;
};

export type EmailTemplateData = {
  recipientName?: string;
  designation?: string;
  collegeName: string;
  department: string;
  sessionInterest?: string;
  placementOutreach?: boolean;
  customSubject?: string;
  customMessage?: string;
  branding?: BrandingOptions;
  content?: Record<string, string>;
};

export type FieldName =
  | "recipientEmail"
  | "recipientName"
  | "designation"
  | "collegeName"
  | "department"
  | "customSubject"
  | "customMessage";

export type FieldErrors = Partial<Record<FieldName, string>>;
