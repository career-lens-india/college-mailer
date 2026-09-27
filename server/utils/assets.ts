import { sendMessages } from "../../src/lib/messages.ts";
import { AppError } from "../errors.ts";

export function resolveAssetBaseUrl(value: string | undefined, nodeEnv: string): string {
  const raw = value?.trim().replace(/\/+$/, "") ?? "";
  if (!raw) {
    console.error("Email send blocked: CAREERLENS_ASSET_BASE_URL is not set.");
    throw new AppError(503, "ASSET_BASE_URL_MISSING", sendMessages.notConfigured);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.error("Email send blocked: CAREERLENS_ASSET_BASE_URL is not an absolute URL.");
    throw new AppError(503, "ASSET_BASE_URL_MISSING", sendMessages.notConfigured);
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const localHost =
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
  if (url.protocol !== "https:" || localHost) {
    console.error(`Email send blocked: CAREERLENS_ASSET_BASE_URL must be a public HTTPS origin (${nodeEnv}).`);
    throw new AppError(503, "ASSET_BASE_URL_MISSING", sendMessages.notConfigured);
  }

  const pathName = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  return `${url.origin}${pathName}`;
}

export function assertDeliverableHtml(html: string): void {
  const local =
    /[A-Za-z]:\\/.test(html) ||
    /file:\/\//i.test(html) ||
    /javascript:/i.test(html) ||
    /<script[\s>]/i.test(html) ||
    /https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(html);
  if (local) {
    console.error("Rendered email contained a local or unsafe reference.");
    throw new AppError(500, "EMAIL_RENDER_FAILED", sendMessages.providerFailed);
  }
  if (/src="\/assets\//.test(html) || /src="assets\//.test(html) || /src="https?:\/\/[^"]*\/\/assets\//.test(html)) {
    console.error("Email send blocked: rendered image URL is not publicly usable.");
    throw new AppError(503, "ASSET_BASE_URL_MISSING", sendMessages.notConfigured);
  }
}
