import { sendMessages } from "../../src/lib/messages.ts";
import { brand } from "../../src/brand/facts.ts";
import { renderPlainText } from "../../src/lib/plainText.ts";
import { mergeTemplateContent } from "../../src/lib/templateContent.ts";
import { subjectForDelivery } from "../../src/lib/subject.ts";
import { renderEmailHtml } from "../../src/templates/renderEmail.tsx";
import { AppError, isAppError } from "../errors.ts";
import type { RecipientDelivery, ValidatedOutreach } from "../utils/validateSendRequest.ts";
import { assertDeliverableHtml, resolveAssetBaseUrl } from "../utils/assets.ts";
import type { EmailProvider } from "./providers/types.ts";

export type DeliverySettings = {
  provider: EmailProvider;
  assetBaseUrl?: string;
  nodeEnv: string;
  websiteUrl?: string;
  campusImpactUrl?: string;
};

export type DeliveryResult = {
  messageId?: string;
  sent: number;
  total: number;
  results: RecipientDelivery[];
};

function toSafeProviderError(error: unknown): AppError {
  if (isAppError(error)) return error;

  const details = error as { code?: string; responseCode?: number; message?: string; response?: string };
  const code = details.code ?? "";
  const responseCode = details.responseCode ?? 0;
  const response = `${details.response ?? ""} ${details.message ?? ""}`.toLowerCase();
  console.error("Email provider failed", { code, responseCode });

  if (code === "EAUTH" || responseCode === 535) {
    return new AppError(502, "EMAIL_AUTH_FAILED", sendMessages.notConfigured);
  }

  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION" || code === "EDNS" || code === "EAI_AGAIN") {
    return new AppError(502, "EMAIL_PROVIDER_UNAVAILABLE", sendMessages.providerFailed);
  }

  if (
    responseCode === 550 ||
    responseCode === 551 ||
    responseCode === 553 ||
    response.includes("recipient") ||
    response.includes("mailbox")
  ) {
    return new AppError(400, "RECIPIENT_REJECTED", sendMessages.recipientRejected);
  }

  return new AppError(502, "EMAIL_SEND_FAILED", sendMessages.providerFailed);
}

export async function deliverOutreach(
  input: ValidatedOutreach,
  settings: DeliverySettings,
): Promise<DeliveryResult> {
  const assetBaseUrl = resolveAssetBaseUrl(settings.assetBaseUrl, settings.nodeEnv);
  const websiteUrl = settings.websiteUrl?.trim() || brand.websiteUrl;
  const campusImpactUrl = settings.campusImpactUrl?.trim() || brand.campusImpactUrl;
  const data = {
    recipientName: input.recipientName,
    designation: input.designation,
    collegeName: input.collegeName,
    department: input.department,
    sessionInterest: input.sessionInterest,
    placementOutreach: input.placementOutreach,
    customSubject: input.customSubject,
    customMessage: input.customMessage,
    branding: input.branding,
    content:
      input.template === "custom" ? undefined : { ...mergeTemplateContent(input.template, input.content) },
  };

  const html = renderEmailHtml(input.template, data, {
    assetBaseUrl,
    websiteUrl,
    campusImpactUrl,
  });
  assertDeliverableHtml(html);
  const text = renderPlainText(data, { websiteUrl, campusImpactUrl }, input.template);
  const subject = subjectForDelivery({
    template: input.template,
    collegeName: input.collegeName,
    customSubject: input.customSubject,
    data,
    test: input.test,
  });

  const results: RecipientDelivery[] = [];
  let halted: { code: string; message: string } | null = null;

  for (const to of input.recipients) {
    if (halted) {
      results.push({ to, success: false, error: halted });
      continue;
    }
    try {
      const result = await settings.provider.sendEmail({ to, subject, html, text });
      if (!result.success) {
        results.push({
          to,
          success: false,
          error: { code: "EMAIL_SEND_FAILED", message: sendMessages.providerFailed },
        });
        continue;
      }
      results.push({ to, success: true, messageId: result.messageId });
    } catch (error) {
      const safe = toSafeProviderError(error);
      const failure = { code: safe.code, message: safe.message };
      results.push({ to, success: false, error: failure });
      if (safe.code === "EMAIL_AUTH_FAILED" || safe.code === "EMAIL_PROVIDER_UNAVAILABLE") {
        halted = failure;
      }
    }
  }

  const sent = results.filter((result) => result.success).length;
  const succeeded = sent === results.length && sent > 0;
  return {
    messageId: succeeded ? results.find((result) => result.messageId)?.messageId : undefined,
    sent,
    total: results.length,
    results,
  };
}
