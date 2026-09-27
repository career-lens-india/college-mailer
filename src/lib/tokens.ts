import type { EmailTemplateData } from "../types/outreach.ts";

const TOKEN = /\{\{\s*(recipientName|collegeName|department|sessionInterest)\s*\}\}/g;

function tokenValue(key: string, data: EmailTemplateData): string {
  if (key === "recipientName") return data.recipientName?.trim() || "Sir/Madam";
  if (key === "collegeName") return data.collegeName.trim();
  if (key === "department") return data.department.trim();
  const session = data.sessionInterest?.trim() ?? "";
  if (key === "sessionInterest") return !session || session === "Not Specified" ? "" : session;
  return "";
}

export function applyPersonalizationTokens(text: string, data: EmailTemplateData): string {
  const replaced = text.replace(TOKEN, (_match, key: string) => tokenValue(key, data));
  return replaced
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+([,.;:!?])/g, "$1");
}
