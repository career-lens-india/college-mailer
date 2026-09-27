const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MAX_RECIPIENTS = 15;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export type ParsedRecipients = {
  recipients: string[];
  invalid: string[];
};

export function parseRecipientList(input: string): ParsedRecipients {
  const parts = input.split(",").map((part) => part.trim()).filter(Boolean);
  const seen = new Set<string>();
  const recipients: string[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    if (part.length > 254 || !isValidEmail(part)) {
      invalid.push(part);
      continue;
    }
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(part);
  }

  return { recipients, invalid };
}
