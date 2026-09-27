import type { EmailTemplateData, SessionInterest } from "../types/outreach.ts";

const SESSION_PHRASES: Record<Exclude<SessionInterest, "Not Specified">, string> = {
  "General Industry Interaction": "a general industry interaction",
  "Technical Guest Lecture": "a technical guest lecture",
  "Hands-on Workshop": "a hands-on workshop",
  "Career & Industry Readiness": "a career and industry-readiness session",
  "Faculty Development": "a faculty development session",
  "Emerging Technology Session": "an emerging technology session",
};

export type Personalization = {
  greeting: string;
  designation: string | null;
  collegeName: string;
  department: string;
  departmentPhrase: string;
  sessionPhrase: string | null;
  invitation: string;
  collaboration: string;
  briefing: string;
  preheader: string;
};

function isKnownSession(value: string): value is Exclude<SessionInterest, "Not Specified"> {
  return Object.prototype.hasOwnProperty.call(SESSION_PHRASES, value);
}

export function formatDepartmentPhrase(department: string): string {
  const value = department.trim();
  if (!value) return "";
  if (/\bdepartments?\b/i.test(value)) return value;
  const plural = /[&,]|\band\b/i.test(value);
  return plural ? `the ${value} departments` : `the ${value} department`;
}

function sessionPhraseFor(interest?: string): string | null {
  const value = interest?.trim() ?? "";
  if (!value || value === "Not Specified") return null;
  if (!isKnownSession(value)) return null;
  return SESSION_PHRASES[value];
}

export function buildPersonalization(data: EmailTemplateData): Personalization {
  const recipientName = data.recipientName?.trim() ?? "";
  const designationValue = data.designation?.trim() ?? "";
  const collegeName = data.collegeName.trim() || "the college";
  const department = data.department.trim();
  const placement = data.placementOutreach === true;
  const academicPhrase = formatDepartmentPhrase(department);
  const departmentPhrase = academicPhrase || (placement ? "the Placement Department" : "the college");
  const sessionPhrase = sessionPhraseFor(data.sessionInterest);
  const offering = sessionPhrase ?? "an industry interaction";
  const learner =
    data.sessionInterest === "Faculty Development"
      ? academicPhrase
        ? `faculty from ${academicPhrase}`
        : `faculty at ${collegeName}`
      : academicPhrase
        ? `students from ${academicPhrase}`
        : `students at ${collegeName}`;
  const audience = placement
    ? academicPhrase
      ? `the Placement Department and ${learner}`
      : "the Placement Department"
    : learner;

  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Sir/Madam,";
  const invitation = `CareerLens India would be glad to explore ${offering} with ${collegeName} for ${audience}.`;
  const collaboration = `${collegeName} can host ${offering} for ${audience}, with the depth and examples shaped to ${departmentPhrase}.`;
  const briefing = `For ${collegeName}, we can prepare ${offering} for ${audience}.`;
  const preheader = recipientName
    ? `${recipientName}, a note from CareerLens India for ${collegeName}.`
    : `A note from CareerLens India for ${collegeName}.`;

  return {
    greeting,
    designation: designationValue || null,
    collegeName,
    department,
    departmentPhrase,
    sessionPhrase,
    invitation,
    collaboration,
    briefing,
    preheader,
  };
}
