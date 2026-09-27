import nodemailer from "nodemailer";
import { sendMessages } from "../../../src/lib/messages.ts";
import { AppError } from "../../errors.ts";
import type { EmailProvider } from "./types.ts";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

const CONFIG_MESSAGE = sendMessages.notConfigured;

function transportOptions(settings: SmtpSettings) {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: !settings.secure,
    auth: settings.user
      ? {
          user: settings.user,
          pass: settings.password,
        }
      : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  };
}

export async function verifySmtpConfiguration(settings: SmtpSettings): Promise<void> {
  if (!settings.host || !settings.fromEmail || !settings.user || !settings.password) {
    console.error("SMTP is not fully configured. Email sending is unavailable.");
    return;
  }

  const transporter = nodemailer.createTransport(transportOptions(settings));
  try {
    await transporter.verify();
    console.log(`SMTP configuration detected for ${settings.fromEmail}`);
  } catch (error) {
    const details = error as { code?: string; responseCode?: number };
    console.error("SMTP verification failed.", {
      code: details.code ?? "",
      responseCode: details.responseCode ?? 0,
    });
  }
}

export function createSmtpProvider(settings: SmtpSettings): EmailProvider {
  return {
    async sendEmail(input) {
      if (!settings.host || !settings.fromEmail) {
        console.error("SMTP host or FROM_EMAIL is missing.");
        throw new AppError(503, "EMAIL_CONFIG_MISSING", CONFIG_MESSAGE);
      }
      if (settings.user && !settings.password) {
        console.error("SMTP_USER is set without SMTP_PASSWORD.");
        throw new AppError(503, "EMAIL_CONFIG_MISSING", CONFIG_MESSAGE);
      }

      const transporter = nodemailer.createTransport(transportOptions(settings));

      const info = await transporter.sendMail({
        from: {
          name: settings.fromName || "CareerLens India",
          address: settings.fromEmail,
        },
        replyTo: settings.fromEmail,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      return {
        success: true,
        messageId: typeof info.messageId === "string" ? info.messageId : undefined,
      };
    },
  };
}
