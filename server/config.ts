export type AppConfig = {
  port: number;
  nodeEnv: string;
  providerName: string;
  allowedOrigins: string[];
  trustProxy: boolean;
  assetBaseUrl?: string;
  websiteUrl?: string;
  campusImpactUrl?: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
};

function text(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function bool(name: string, fallback: boolean): boolean {
  const value = text(name).toLowerCase();
  if (!value) return fallback;
  return value === "true" || value === "1";
}

function portNumber(name: string, fallback: number): number {
  const parsed = Number(text(name) || fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const nodeEnv = text("NODE_ENV") || "development";
  const configuredOrigins = text("FRONTEND_ORIGIN")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const devOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
  const allowedOrigins =
    nodeEnv === "production" ? configuredOrigins : [...new Set([...configuredOrigins, ...devOrigins])];

  return {
    port: portNumber("PORT", 5000),
    nodeEnv,
    providerName: text("EMAIL_PROVIDER") || "smtp",
    allowedOrigins,
    trustProxy: bool("TRUST_PROXY", false),
    assetBaseUrl: text("CAREERLENS_ASSET_BASE_URL") || undefined,
    websiteUrl: text("CAREERLENS_WEBSITE") || undefined,
    campusImpactUrl: text("CAREERLENS_CAMPUS_IMPACT") || undefined,
    smtp: {
      host: text("SMTP_HOST"),
      port: portNumber("SMTP_PORT", 587),
      secure: bool("SMTP_SECURE", false),
      user: text("SMTP_USER"),
      password: process.env.SMTP_PASSWORD ?? "",
      fromEmail: text("FROM_EMAIL"),
      fromName: text("FROM_NAME") || "CareerLens India",
    },
  };
}
