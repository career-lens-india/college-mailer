export const sendMessages = {
  notConfigured:
    "Email sending is not configured yet. Please configure the email provider and public asset URL.",
  recipientRejected:
    "The recipient email was rejected by the mail server. Please verify the address.",
  providerFailed: "The email provider could not send the message. Please try again.",
  network: "Unable to reach the email server. Please check your connection and try again.",
  rateLimited: "Too many send attempts. Please wait a moment and try again.",
  loginRateLimited: "Too many attempts. Please wait a moment and try again.",
  passcodeIncorrect: "Incorrect passcode. Please try again.",
  unauthorized: "Please sign in to continue.",
  signInUnavailable: "Sign-in is not configured yet.",
  tryAgain: "Unable to send the email. Please try again.",
  invalidRequest: "The email request is not valid.",
  emailInvalid: "Please enter a valid email address.",
  recipientsRequired: "Enter at least one email address.",
  recipientsInvalid: "Check the list. Every address must be a valid email, separated by commas.",
  tooManyRecipients: "Enter at most 15 email addresses for one send.",
  collegeRequired: "College name is required.",
  departmentRequired: "Department is required.",
  subjectRequired: "Subject is required for a custom email.",
  subjectTooLong: "Subject is too long.",
  messageRequired: "Write the custom email message.",
  messageTooLong: "Message is too long.",
  collegeTooLong: "College name is too long.",
  departmentTooLong: "Department is too long.",
  nameTooLong: "Recipient name is too long.",
  designationTooLong: "Designation is too long.",
} as const;

const configurationCodes = new Set([
  "ASSET_BASE_URL_MISSING",
  "EMAIL_CONFIG_MISSING",
  "EMAIL_AUTH_FAILED",
  "EMAIL_PROVIDER_UNSUPPORTED",
]);

const providerCodes = new Set([
  "EMAIL_SEND_FAILED",
  "EMAIL_PROVIDER_UNAVAILABLE",
  "EMAIL_RENDER_FAILED",
]);

export function explainSendFailure(input: {
  status: number;
  code?: string;
  message?: string;
}): string {
  if (input.code && configurationCodes.has(input.code)) return sendMessages.notConfigured;
  if (input.code === "RECIPIENT_REJECTED") return sendMessages.recipientRejected;
  if (input.code && providerCodes.has(input.code)) return sendMessages.providerFailed;
  if (input.code === "UNAUTHORIZED" || input.status === 401) return sendMessages.unauthorized;
  if (input.code === "RATE_LIMITED" || input.status === 429) return sendMessages.rateLimited;
  if (input.code === "NETWORK_ERROR" || input.status === 0) return sendMessages.network;
  if (input.code === "VALIDATION_ERROR" && input.message) return input.message;
  if (input.status === 503) return sendMessages.notConfigured;
  if (input.status === 502) return sendMessages.providerFailed;
  return sendMessages.tryAgain;
}
