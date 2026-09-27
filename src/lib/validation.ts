import { sendMessages } from "./messages.ts";
import { isValidEmail, MAX_RECIPIENTS, parseRecipientList } from "./recipients.ts";
import type { FieldErrors, OutreachDraft } from "../types/outreach.ts";

export { isValidEmail };

const CUSTOM_SUBJECT_MAX = 150;
const CUSTOM_MESSAGE_MAX = 8000;

export function validateOutreach(draft: OutreachDraft): FieldErrors {
  const errors: FieldErrors = {};
  const collegeName = draft.collegeName.trim();
  const department = draft.department.trim();
  const recipientName = draft.recipientName.trim();
  const designation = draft.designation.trim();
  const parsed = parseRecipientList(draft.recipientEmail);

  if (!draft.recipientEmail.trim() || parsed.recipients.length === 0) {
    errors.recipientEmail = parsed.invalid.length ? sendMessages.recipientsInvalid : sendMessages.recipientsRequired;
  } else if (parsed.invalid.length > 0) {
    errors.recipientEmail = sendMessages.recipientsInvalid;
  } else if (parsed.recipients.length > MAX_RECIPIENTS) {
    errors.recipientEmail = sendMessages.tooManyRecipients;
  }

  if (!collegeName) {
    errors.collegeName = sendMessages.collegeRequired;
  } else if (collegeName.length > 180) {
    errors.collegeName = sendMessages.collegeTooLong;
  }

  if (!draft.placementOutreach && !department) {
    errors.department = sendMessages.departmentRequired;
  } else if (department.length > 120) {
    errors.department = sendMessages.departmentTooLong;
  }

  if (recipientName.length > 120) {
    errors.recipientName = sendMessages.nameTooLong;
  }

  if (designation.length > 120) {
    errors.designation = sendMessages.designationTooLong;
  }

  if (draft.selectedTemplate === "custom") {
    const subject = draft.customSubject.trim();
    const message = draft.customMessage.trim();
    if (!subject) errors.customSubject = sendMessages.subjectRequired;
    else if (/[\r\n]/.test(draft.customSubject)) errors.customSubject = sendMessages.invalidRequest;
    else if (subject.length > CUSTOM_SUBJECT_MAX) errors.customSubject = sendMessages.subjectTooLong;
    if (!message) errors.customMessage = sendMessages.messageRequired;
    else if (message.length > CUSTOM_MESSAGE_MAX) errors.customMessage = sendMessages.messageTooLong;
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function contentErrors(errors: FieldErrors): boolean {
  return Object.entries(errors).some(([key, value]) => key !== "recipientEmail" && Boolean(value));
}
