import type {
  MinimalContent,
  ModernContent,
  NewsletterContent,
  ProfessionalContent,
  TemplateContentById,
} from "../types/templateContent.ts";
import type { EmailTemplateData, TemplateId } from "../types/outreach.ts";
import { buildPersonalization } from "./personalization.ts";

export type {
  MinimalContent,
  ModernContent,
  NewsletterContent,
  ProfessionalContent,
  TemplateContentById,
};

export const professionalDefaults: ProfessionalContent = {
  heroTitle: "Empowering Students Through Industry-Led Learning",
  heroSupport: "Technical Sessions | Workshops | Guest Lectures",
  greeting: "{{greeting}}",
  introduction:
    "Greetings from CareerLens India. {{invitation}}\n\nWe bring industry professionals into the classroom for technical sessions, workshops and guest lectures, with the examples shaped to {{departmentPhrase}}.",
  sectionHeading: "Popular Session Topics",
  ctaText: "View CareerLens Campus Impact",
  closingText: "We would be glad to shape the format, topic and speaker for {{collegeName}}.",
  additionalMessage: "",
};

export const modernDefaults: ModernContent = {
  heroTitle: "Industry Knowledge today. Better careers tomorrow.",
  heroSupport: "Engaging technical sessions, hands-on workshops and industry interactions for college students.",
  greeting: "{{greeting}}",
  introduction:
    "CareerLens India works with industry professionals to deliver practical, industry-focused learning. {{invitation}}",
  topicHeading: "What We Offer",
  engagementHeading: "Recent Campus Engagements",
  ctaText: "View CareerLens Campus Impact",
  closingText: "Let's Plan a Session at Your College",
  additionalMessage: "",
};

export const minimalDefaults: MinimalContent = {
  heading: "Industry Expert Sessions for Tomorrow's Tech Leaders",
  greeting: "{{greeting}}",
  introduction: "{{invitation}}\n\n{{collaboration}}",
  offerHeading: "Popular Topics for Students",
  offerText:
    "The session stays practical: industry examples, tools students can try, and time for questions from {{departmentPhrase}}.",
  ctaText: "View CareerLens Campus Impact",
  closingText: "We can suggest suitable topics, industry experts and a session format based on the department's needs.",
  additionalMessage: "",
};

export const newsletterDefaults: NewsletterContent = {
  heading: "Turning Classrooms into Career Opportunities",
  introduction:
    "Greetings from CareerLens India. {{briefing}}\n\nWe partner with colleges to deliver industry-focused technical sessions, workshops and guest lectures. {{invitation}}",
  focusHeading: "Our Focus Areas",
  campusHeading: "Recent Campus Engagements",
  ctaText: "View CareerLens Campus Impact",
  closingText: "Let's discuss the department's requirements and create a customised session.",
  additionalMessage: "",
};

const defaultsByTemplate = {
  professional: professionalDefaults,
  modern: modernDefaults,
  minimal: minimalDefaults,
  newsletter: newsletterDefaults,
} as const;

export type ContentField = {
  key: string;
  label: string;
  multiline: boolean;
  hint?: string;
};

const additionalMessageField: ContentField = {
  key: "additionalMessage",
  label: "Additional Message (Optional)",
  multiline: true,
  hint: "Add any extra message you want to include before the signature.",
};

const fieldsByTemplate: Record<TemplateId, ContentField[]> = {
  professional: [
    { key: "heroTitle", label: "Hero Heading", multiline: false },
    { key: "heroSupport", label: "Hero Supporting Text", multiline: false },
    { key: "greeting", label: "Greeting", multiline: false },
    { key: "introduction", label: "Introduction", multiline: true },
    { key: "sectionHeading", label: "Section Heading", multiline: false },
    { key: "ctaText", label: "CTA", multiline: false },
    { key: "closingText", label: "Closing Text", multiline: true },
    additionalMessageField,
  ],
  modern: [
    { key: "heroTitle", label: "Hero Heading", multiline: false },
    { key: "heroSupport", label: "Hero Supporting Text", multiline: false },
    { key: "greeting", label: "Greeting", multiline: false },
    { key: "introduction", label: "Introduction", multiline: true },
    { key: "topicHeading", label: "Topic Section Heading", multiline: false },
    { key: "engagementHeading", label: "Engagement Section Heading", multiline: false },
    { key: "ctaText", label: "CTA", multiline: false },
    { key: "closingText", label: "Closing Text", multiline: false },
    additionalMessageField,
  ],
  minimal: [
    { key: "heading", label: "Heading", multiline: false },
    { key: "greeting", label: "Greeting", multiline: false },
    { key: "introduction", label: "Introduction", multiline: true },
    { key: "offerHeading", label: "Offer Section Heading", multiline: false },
    { key: "offerText", label: "Offer Text", multiline: true },
    { key: "ctaText", label: "CTA", multiline: false },
    { key: "closingText", label: "Closing", multiline: true },
    additionalMessageField,
  ],
  newsletter: [
    { key: "heading", label: "Newsletter Heading", multiline: false },
    { key: "introduction", label: "Intro", multiline: true },
    { key: "focusHeading", label: "Focus Section Heading", multiline: false },
    { key: "campusHeading", label: "Campus Section Heading", multiline: false },
    { key: "ctaText", label: "CTA", multiline: false },
    { key: "closingText", label: "Closing", multiline: true },
    additionalMessageField,
  ],
};

export function contentFields(template: TemplateId): ContentField[] {
  return fieldsByTemplate[template];
}

export function defaultContent<T extends TemplateId>(template: T): TemplateContentById[T] {
  return { ...defaultsByTemplate[template] };
}

export function mergeTemplateContent<T extends TemplateId>(
  template: T,
  value: unknown,
): TemplateContentById[T] {
  const defaults = defaultContent(template);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return defaults;
  const record = value as Record<string, unknown>;
  const next = { ...defaults };
  for (const field of fieldsByTemplate[template]) {
    if (typeof record[field.key] === "string") {
      (next as Record<string, string>)[field.key] = record[field.key] as string;
    }
  }
  return next;
}

const TEMPLATE_TOKEN =
  /\{\{\s*(greeting|invitation|collaboration|briefing|departmentPhrase|collegeName|recipientName|department|sessionInterest)\s*\}\}/g;

export function visibleText(text: string, data: EmailTemplateData): string {
  return resolveEditableText(text, data).trim();
}

export function resolveEditableText(text: string, data: EmailTemplateData): string {
  const copy = buildPersonalization(data);
  const values: Record<string, string> = {
    greeting: copy.greeting,
    invitation: copy.invitation,
    collaboration: copy.collaboration,
    briefing: copy.briefing,
    departmentPhrase: copy.departmentPhrase,
    collegeName: copy.collegeName,
    recipientName: data.recipientName?.trim() || "Sir/Madam",
    department: copy.departmentPhrase,
    sessionInterest: copy.sessionPhrase ?? "an industry interaction",
  };
  return text
    .replace(TEMPLATE_TOKEN, (_match, key: string) => values[key] ?? "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+([,.;:!?])/g, "$1");
}

export function professionalContent(value?: Record<string, string>): ProfessionalContent {
  return mergeTemplateContent("professional", value);
}

export function modernContent(value?: Record<string, string>): ModernContent {
  return mergeTemplateContent("modern", value);
}

export function minimalContent(value?: Record<string, string>): MinimalContent {
  return mergeTemplateContent("minimal", value);
}

export function newsletterContent(value?: Record<string, string>): NewsletterContent {
  return mergeTemplateContent("newsletter", value);
}

export function contentRecord(value: object): Record<string, string> {
  return { ...value };
}
