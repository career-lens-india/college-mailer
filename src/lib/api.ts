import type { BrandingOptions, ComposerMode } from "../types/outreach.ts";
import { explainSendFailure, sendMessages } from "./messages.ts";

export class EmailApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EmailApiError";
    this.code = code;
  }
}

export type SendEmailRequest = {
  to: string;
  recipientName?: string;
  designation?: string;
  collegeName: string;
  department: string;
  placementOutreach?: boolean;
  sessionInterest?: string;
  template: ComposerMode;
  customSubject?: string;
  customMessage?: string;
  branding?: BrandingOptions;
  content?: Record<string, string>;
};

export type RecipientSendResult = {
  to: string;
  success: boolean;
  messageId?: string;
  error?: { code: string; message: string };
};

export type SendEmailResponse = {
  success: boolean;
  sent: number;
  total: number;
  results: RecipientSendResult[];
  messageId?: string;
};

type FailureBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

function isFailure(value: unknown): value is FailureBody {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { success?: unknown; error?: { code?: unknown; message?: unknown } };
  return record.success === false && typeof record.error?.code === "string" && typeof record.error.message === "string";
}

function isSendResponse(value: unknown): value is SendEmailResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as { sent?: unknown; total?: unknown; results?: unknown; success?: unknown };
  return typeof record.sent === "number" && typeof record.total === "number" && Array.isArray(record.results);
}

async function postEmail(request: SendEmailRequest, test: boolean): Promise<SendEmailResponse> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...request, test }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new EmailApiError("NETWORK_ERROR", sendMessages.network);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok && isSendResponse(body)) return body;

  const failure = isFailure(body) ? body.error : undefined;
  throw new EmailApiError(
    failure?.code ?? "EMAIL_SEND_FAILED",
    explainSendFailure({
      status: response.status,
      code: failure?.code,
      message: failure?.message,
    }),
  );
}

export function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  return postEmail(request, false);
}

export function sendTestEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  return postEmail(request, true);
}
