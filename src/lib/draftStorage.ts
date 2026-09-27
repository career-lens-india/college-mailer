import {
  defaultContent,
  mergeTemplateContent,
} from "./templateContent.ts";
import {
  COMPOSER_MODES,
  defaultBranding,
  SESSION_INTERESTS,
  type BrandingOptions,
  type ComposerMode,
  type OutreachDraft,
  type SessionInterest,
} from "../types/outreach.ts";

export const DRAFT_STORAGE_KEY = "careerlens-college-mailer-draft";

export const defaultDraft: OutreachDraft = {
  recipientEmail: "",
  recipientName: "",
  designation: "",
  collegeName: "",
  department: "",
  placementOutreach: false,
  sessionInterest: "Not Specified",
  selectedTemplate: "modern",
  customSubject: "",
  customMessage: "",
  branding: defaultBranding,
  professionalContent: defaultContent("professional"),
  modernContent: defaultContent("modern"),
  minimalContent: defaultContent("minimal"),
  newsletterContent: defaultContent("newsletter"),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isComposerMode(value: unknown): value is ComposerMode {
  return typeof value === "string" && (COMPOSER_MODES as readonly string[]).includes(value);
}

function isSessionInterest(value: unknown): value is SessionInterest {
  return typeof value === "string" && (SESSION_INTERESTS as readonly string[]).includes(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function brandingFrom(value: unknown): BrandingOptions {
  if (!isRecord(value)) return { ...defaultBranding };
  const flag = (key: keyof BrandingOptions) => (typeof value[key] === "boolean" ? value[key] : defaultBranding[key]);
  return {
    logo: flag("logo"),
    banner: flag("banner"),
    signature: flag("signature"),
    footer: flag("footer"),
  };
}

export function loadDraft(): OutreachDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return defaultDraft;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultDraft;

    return {
      recipientEmail: text(parsed.recipientEmail),
      recipientName: text(parsed.recipientName),
      designation: text(parsed.designation),
      collegeName: text(parsed.collegeName),
      department: text(parsed.department),
      placementOutreach: parsed.placementOutreach === true,
      sessionInterest: isSessionInterest(parsed.sessionInterest)
        ? parsed.sessionInterest
        : defaultDraft.sessionInterest,
      selectedTemplate: isComposerMode(parsed.selectedTemplate)
        ? parsed.selectedTemplate
        : defaultDraft.selectedTemplate,
      customSubject: text(parsed.customSubject),
      customMessage: text(parsed.customMessage),
      branding: brandingFrom(parsed.branding),
      professionalContent: mergeTemplateContent("professional", parsed.professionalContent),
      modernContent: mergeTemplateContent("modern", parsed.modernContent),
      minimalContent: mergeTemplateContent("minimal", parsed.minimalContent),
      newsletterContent: mergeTemplateContent("newsletter", parsed.newsletterContent),
    };
  } catch {
    return defaultDraft;
  }
}

export function saveDraft(draft: OutreachDraft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Private browsing can block storage. The form still works for this visit.
  }
}

export function withTemplate(draft: OutreachDraft, selectedTemplate: ComposerMode): OutreachDraft {
  return { ...draft, selectedTemplate };
}

export function draftForAnotherEmail(draft: OutreachDraft): OutreachDraft {
  return {
    ...defaultDraft,
    branding: { ...defaultBranding },
    professionalContent: defaultContent("professional"),
    modernContent: defaultContent("modern"),
    minimalContent: defaultContent("minimal"),
    newsletterContent: defaultContent("newsletter"),
    selectedTemplate: draft.selectedTemplate,
  };
}

export function clearStoredDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage failures and still reset the form in memory.
  }
}
