import { sendMessages } from "../../src/lib/messages.ts";
import { contentFields } from "../../src/lib/templateContent.ts";
import { MAX_RECIPIENTS, parseRecipientList } from "../../src/lib/recipients.ts";
import {
  COMPOSER_MODES,
  defaultBranding,
  SESSION_INTERESTS,
  type BrandingOptions,
  type ComposerMode,
  type SessionInterest,
} from "../../src/types/outreach.ts";

const SUBJECT_MAX = 150;
const MESSAGE_MAX = 8000;

export type RecipientDelivery = {
  to: string;
  success: boolean;
  messageId?: string;
  error?: { code: string; message: string };
};

export type ValidatedOutreach = {
  recipients: string[];
  recipientName?: string;
  designation?: string;
  collegeName: string;
  department: string;
  placementOutreach: boolean;
  sessionInterest: SessionInterest;
  template: ComposerMode;
  customSubject?: string;
  customMessage?: string;
  branding: BrandingOptions;
  content?: Record<string, string>;
  test: boolean;
};

export type ValidationResult =
  | { ok: true; value: ValidatedOutreach }
  | { ok: false; message: string };

function clean(value: unknown, max: number): string | "invalid" | "long" {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "invalid";
  if (value.includes("\0") || value.includes("\r") || value.includes("\n")) return "invalid";
  const normalized = value.replace(/[ \t\f\v]+/g, " ").trim();
  if (normalized.length > max) return "long";
  return normalized;
}

function cleanMessage(value: unknown, max: number): string | "invalid" | "long" {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "invalid";
  if (value.includes("\0")) return "invalid";
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (normalized.length > max) return "long";
  return normalized;
}

function isComposerMode(value: string): value is ComposerMode {
  return (COMPOSER_MODES as readonly string[]).includes(value);
}

function isSessionInterest(value: string): value is SessionInterest {
  return (SESSION_INTERESTS as readonly string[]).includes(value);
}

function readBranding(value: unknown): BrandingOptions | "invalid" {
  if (value === undefined) return { ...defaultBranding };
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "invalid";
  const record = value as Record<string, unknown>;
  const flag = (key: keyof BrandingOptions): boolean | "invalid" => {
    if (record[key] === undefined) return defaultBranding[key];
    if (typeof record[key] !== "boolean") return "invalid";
    return record[key];
  };
  const logo = flag("logo");
  const banner = flag("banner");
  const signature = flag("signature");
  const footer = flag("footer");
  if (logo === "invalid" || banner === "invalid" || signature === "invalid" || footer === "invalid") {
    return "invalid";
  }
  return { logo, banner, signature, footer };
}

export function validateSendRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: sendMessages.invalidRequest };
  }

  const record = body as Record<string, unknown>;
  const to = clean(record.to, 4000);
  const collegeName = clean(record.collegeName, 180);
  const department = clean(record.department, 120);
  const recipientName = clean(record.recipientName, 120);
  const designation = clean(record.designation, 120);
  const sessionRaw = clean(record.sessionInterest, 80);
  const templateRaw = clean(record.template, 32);
  const customSubject = clean(record.customSubject, SUBJECT_MAX);
  const customMessage = cleanMessage(record.customMessage, MESSAGE_MAX);
  const branding = readBranding(record.branding);
  const templateForContent = typeof record.template === "string" && isComposerMode(record.template) ? record.template : "modern";
  const content = readTemplateContent(templateForContent, record.content);

  if (
    [to, collegeName, department, recipientName, designation, sessionRaw, templateRaw, customSubject].includes(
      "invalid",
    ) ||
    customMessage === "invalid" ||
    branding === "invalid" ||
    content === "invalid"
  ) {
    return { ok: false, message: sendMessages.invalidRequest };
  }
  if (to === "long") return { ok: false, message: sendMessages.tooManyRecipients };
  if (collegeName === "long") return { ok: false, message: sendMessages.collegeTooLong };
  if (department === "long") return { ok: false, message: sendMessages.departmentTooLong };
  if (recipientName === "long") return { ok: false, message: sendMessages.nameTooLong };
  if (designation === "long") return { ok: false, message: sendMessages.designationTooLong };
  if (customSubject === "long") return { ok: false, message: sendMessages.subjectTooLong };
  if (customMessage === "long" || content === "long") return { ok: false, message: sendMessages.messageTooLong };
  if (sessionRaw === "long" || templateRaw === "long") {
    return { ok: false, message: sendMessages.invalidRequest };
  }

  if (record.placementOutreach !== undefined && typeof record.placementOutreach !== "boolean") {
    return { ok: false, message: sendMessages.invalidRequest };
  }
  if (record.test !== undefined && typeof record.test !== "boolean") {
    return { ok: false, message: sendMessages.invalidRequest };
  }

  const parsed = parseRecipientList(typeof to === "string" ? to : "");
  if (!to || parsed.recipients.length === 0) {
    return { ok: false, message: parsed.invalid.length ? sendMessages.recipientsInvalid : sendMessages.recipientsRequired };
  }
  if (parsed.invalid.length > 0) return { ok: false, message: sendMessages.recipientsInvalid };
  if (parsed.recipients.length > MAX_RECIPIENTS) return { ok: false, message: sendMessages.tooManyRecipients };

  const test = record.test === true;
  if (test && parsed.recipients.length !== 1) {
    return { ok: false, message: sendMessages.emailInvalid };
  }

  if (!collegeName) return { ok: false, message: sendMessages.collegeRequired };
  if (!templateRaw || !isComposerMode(templateRaw)) {
    return { ok: false, message: "Choose a valid email template." };
  }

  let sessionInterest: SessionInterest = "Not Specified";
  if (sessionRaw) {
    if (!isSessionInterest(sessionRaw)) {
      return { ok: false, message: "Choose a valid session interest." };
    }
    sessionInterest = sessionRaw;
  }

  if (templateRaw === "custom") {
    if (!customSubject) return { ok: false, message: sendMessages.subjectRequired };
    if (!customMessage) return { ok: false, message: sendMessages.messageRequired };
  }

  const placementOutreach = record.placementOutreach === true;
  if (!placementOutreach && !department) {
    return { ok: false, message: sendMessages.departmentRequired };
  }

  return {
    ok: true,
    value: {
      recipients: parsed.recipients,
      recipientName: recipientName || undefined,
      designation: designation || undefined,
      collegeName,
      department,
      placementOutreach,
      sessionInterest,
      template: templateRaw,
      customSubject: templateRaw === "custom" ? customSubject : undefined,
      customMessage: templateRaw === "custom" ? customMessage : undefined,
      branding,
      content: templateRaw === "custom" ? undefined : content,
      test,
    },
  };
}

function readTemplateContent(
  template: ComposerMode,
  value: unknown,
): Record<string, string> | "invalid" | "long" {
  if (template === "custom" || value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "invalid";
  const record = value as Record<string, unknown>;
  const next: Record<string, string> = {};
  for (const field of contentFields(template)) {
    if (record[field.key] === undefined) continue;
    const cleaned = cleanMessage(record[field.key], MESSAGE_MAX);
    if (cleaned === "invalid" || cleaned === "long") return cleaned;
    next[field.key] = cleaned;
  }
  return next;
}
