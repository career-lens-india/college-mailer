import { fileURLToPath } from "node:url";
import { AppError } from "./errors.ts";
import { sendMessages } from "../src/lib/messages.ts";
import { createProductionApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createSmtpProvider, verifySmtpConfiguration } from "./services/providers/smtpProvider.ts";
import type { EmailProvider } from "./services/providers/types.ts";

function loadEnvFile(): void {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  try {
    process.loadEnvFile(envPath);
  } catch {
    // A missing .env is expected until SMTP is configured.
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
const config = loadConfig();
const app = createProductionApp({
  provider: createProvider(config.providerName, config),
  providerName: config.providerName,
  allowedOrigins: config.allowedOrigins,
  trustProxy: config.trustProxy,
  assetBaseUrl: config.assetBaseUrl,
  nodeEnv: config.nodeEnv,
  websiteUrl: config.websiteUrl,
  campusImpactUrl: config.campusImpactUrl,
});

app.listen(config.port, () => {
  console.log(`CareerLens College Mailer API listening on port ${config.port}`);
  if (config.providerName === "smtp") {
    void verifySmtpConfiguration(config.smtp);
  }
});
