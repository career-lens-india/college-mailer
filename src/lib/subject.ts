import type { ComposerMode, EmailTemplateData } from "../types/outreach.ts";
import { applyPersonalizationTokens } from "./tokens.ts";

const LEAD = "Industry-Led Technical Sessions & Workshops for ";
const MAX_LENGTH = 110;

export function buildEmailSubject(collegeName: string, test = false): string {
  const college = collegeName.replace(/\s+/g, " ").trim();
  const prefix = test ? "[TEST] " : "";
  const budget = Math.max(8, MAX_LENGTH - prefix.length - LEAD.length);
  const shortened =
    college.length > budget ? `${college.slice(0, budget - 1).trimEnd()}…` : college;
  return `${prefix}${LEAD}${shortened}`;
}

export function buildCustomSubject(subject: string, test = false): string {
  const value = subject.replace(/\s+/g, " ").trim();
  return `${test ? "[TEST] " : ""}${value}`;
}

export function subjectForDelivery(input: {
  template: ComposerMode;
  collegeName: string;
  customSubject?: string;
  data: EmailTemplateData;
  test: boolean;
}): string {
  if (input.template !== "custom") return buildEmailSubject(input.collegeName, input.test);
  const personalized = applyPersonalizationTokens(input.customSubject ?? "", input.data).replace(/\s+/g, " ").trim();
  return buildCustomSubject(personalized, input.test);
}
