import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AppError } from "./errors.ts";
import { sendMessages } from "../src/lib/messages.ts";
import { createProductionApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createSmtpProvider, verifySmtpConfiguration } from "./services/providers/smtpProvider.ts";
import type { EmailProvider } from "./services/providers/types.ts";

const ENV_KEYS = [
  "EMAIL_PROVIDER",
  "FROM_EMAIL",
  "FROM_NAME",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "CAREERLENS_WEBSITE",
  "CAREERLENS_CAMPUS_IMPACT",
  "CAREERLENS_ASSET_BASE_URL",
] as const;

function loadEnvFile(): void {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  if (!existsSync(envPath)) return;
  for (const key of ENV_KEYS) delete process.env[key];
  try {
    process.loadEnvFile(envPath);
  } catch {
    // A missing .env is expected until SMTP is configured.
  }
}

function assetLabel(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "missing";
  try {
    const url = new URL(raw);
    return `${url.host}${url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "invalid";
  }
}

function createProvider(providerName: string, config: ReturnType<typeof loadConfig>): EmailProvider {
  if (providerName === "smtp") return createSmtpProvider(config.smtp);
  console.error(`Unsupported EMAIL_PROVIDER: ${providerName}`);
  return {
    async sendEmail() {
      throw new AppError(
        503,
        "EMAIL_PROVIDER_UNSUPPORTED",
        sendMessages.notConfigured,
      );
    },
  };
}

loadEnvFile();
const startup = loadConfig();
const app = createProductionApp({
  provider: createProvider(startup.providerName, startup),
  providerName: startup.providerName,
  allowedOrigins: startup.allowedOrigins,
  trustProxy: startup.trustProxy,
  assetBaseUrl: startup.assetBaseUrl,
  nodeEnv: startup.nodeEnv,
  websiteUrl: startup.websiteUrl,
  campusImpactUrl: startup.campusImpactUrl,
  beforeSend: (outreach) => {
    loadEnvFile();
    const current = loadConfig();
    console.log(
      `Email send started. template=${outreach.template} test=${outreach.test} recipients=${outreach.recipients.length} from=${current.smtp.fromEmail || "missing"} smtpUser=${current.smtp.user || "missing"} asset=${assetLabel(current.assetBaseUrl)}`,
    );
    return {
      provider: createProvider(current.providerName, current),
      assetBaseUrl: current.assetBaseUrl,
      nodeEnv: current.nodeEnv,
      websiteUrl: current.websiteUrl,
      campusImpactUrl: current.campusImpactUrl,
    };
  },
});

app.listen(startup.port, () => {
  console.log(`CareerLens College Mailer API listening on port ${startup.port}`);
  console.log(
    `Mail configuration: from=${startup.smtp.fromEmail || "missing"} smtpUser=${startup.smtp.user || "missing"} asset=${assetLabel(startup.assetBaseUrl)} password=${startup.smtp.password ? "configured" : "missing"}`,
  );
  if (startup.providerName === "smtp") {
    void verifySmtpConfiguration(startup.smtp);
  }
});
