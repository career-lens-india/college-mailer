import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { coreAreas, engagements } from "../src/brand/facts.ts";
import { sendMessages } from "../src/lib/messages.ts";
import { TEMPLATE_IDS, type TemplateId } from "../src/types/outreach.ts";
import { loadConfig } from "./config.ts";
import { deliverOutreach } from "./services/emailService.ts";
import { createSmtpProvider } from "./services/providers/smtpProvider.ts";
import { validateSendRequest } from "./utils/validateSendRequest.ts";

const sample = {
  to: "test@example.com",
  recipientName: "Dr. Ravi Kumar",
  designation: "HOD - CSE",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Technical Guest Lecture",
};

const longCollege = "Sai Vidya Institute of Technology and Applied Sciences Campus Extension";

describe("simulated outreach", () => {
  for (const template of TEMPLATE_IDS) {
    it(`prepares and sends the ${template} template through a mock provider`, async () => {
      const parsed = validateSendRequest({ ...sample, template });
      assert.equal(parsed.ok, true);
      if (!parsed.ok) return;

      let sent: { subject: string; html: string; text?: string } | undefined;
      const result = await deliverOutreach(parsed.value, {
        nodeEnv: "test",
        assetBaseUrl: "https://mailer.career-lens.in/",
        provider: {
          async sendEmail(input) {
            sent = input;
            return { success: true, messageId: `mock-${template}` };
          },
        },
      });

      assert.equal(result.messageId, `mock-${template}`);
      assert.ok(sent);
      assert.equal(
        sent.subject,
        "Industry-Led Technical Sessions & Workshops for Sai Vidya Institute of Technology",
      );
      assert.match(sent.html, /Dear Dr\. Ravi Kumar,/);
      assert.match(sent.html, /HOD - CSE/);
      assert.match(sent.html, /Sai Vidya Institute of Technology/);
      assert.match(sent.html, /CSE &amp; ISE|CSE & ISE/);
      assert.match(sent.html, /technical guest lecture/i);
      assert.doesNotMatch(sent.html, /Not Specified/);
      assert.doesNotMatch(sent.html, /\{\{/);
      assert.match(sent.html, /CareerLens India/);
      assert.match(sent.html, new RegExp(engagements[0].institution));
      assert.match(sent.html, new RegExp(engagements[1].institution.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(sent.html, /https:\/\/www\.career-lens\.in\/campus-impact/);
      assert.match(sent.html, /src="https:\/\/mailer\.career-lens\.in\/assets\//);
      assert.match(sent.html, /overflow-wrap:\s*break-word/);
      assert.doesNotMatch(sent.html, /<script/i);
      assert.doesNotMatch(sent.html, /javascript:/i);
      assert.doesNotMatch(sent.html, /localhost|127\.0\.0\.1|file:\/\//i);
      assert.doesNotMatch(sent.html, /[A-Za-z]:\\/);
      assert.match(sent.text ?? "", /Dear Dr\. Ravi Kumar,/);
      assert.match(sent.text ?? "", /Sai Vidya Institute of Technology/);
      assert.doesNotMatch(sent.text ?? "", /<|\{/);
      for (const area of coreAreas) {
        assert.match(`${sent.html}\n${sent.text}`, new RegExp(area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    });
  }

  it("keeps a long college name in the letter and shortens only the subject", async () => {
    const parsed = validateSendRequest({
      ...sample,
      collegeName: longCollege,
      template: "modern" satisfies TemplateId,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let sent: { subject: string; html: string } | undefined;
    await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail(input) {
          sent = input;
          return { success: true };
        },
      },
    });
    assert.ok(sent);
    assert.match(sent.html, new RegExp(longCollege));
    assert.ok(sent.subject.length <= 110);
    assert.match(sent.subject, /^Industry-Led Technical Sessions & Workshops for /);
  });

  it("prefixes a test send and omits an empty name", async () => {
    const parsed = validateSendRequest({
      to: "test@example.com",
      collegeName: "Sai Vidya Institute of Technology",
      department: "ISE",
      template: "minimal",
      test: true,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let sent: { subject: string; html: string } | undefined;
    await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail(input) {
          sent = input;
          return { success: true };
        },
      },
    });
    assert.ok(sent);
    assert.match(sent.subject, /^\[TEST\] /);
    assert.match(sent.html, /Dear Sir\/Madam,/);
    assert.doesNotMatch(sent.html, /Not Specified/);
  });
});

describe("sending readiness", () => {
  it("reports that email sending is not configured", async () => {
    const provider = createSmtpProvider({
      host: "",
      port: 587,
      secure: false,
      user: "",
      password: "",
      fromEmail: "",
      fromName: "CareerLens India",
    });
    await assert.rejects(
      () =>
        provider.sendEmail({
          to: "test@example.com",
          subject: "Hello",
          html: "<p>Hello</p>",
          text: "Hello",
        }),
      (error: unknown) => {
        const failure = error as { code?: string; message?: string };
        assert.equal(failure.code, "EMAIL_CONFIG_MISSING");
        assert.equal(failure.message, sendMessages.notConfigured);
        assert.equal(JSON.stringify(failure).includes("SMTP_PASSWORD"), false);
        const source = readFileSync(new URL("./services/providers/smtpProvider.ts", import.meta.url), "utf8");
        assert.match(source, /replyTo: settings\.fromEmail/);
        assert.match(source, /requireTLS: !settings\.secure/);
        assert.match(source, /SMTP configuration detected for \$\{settings\.fromEmail\}/);
        assert.doesNotMatch(source, /console\.(log|error)\([^)]*settings\.password/);
        return true;
      },
    );
  });

  it("uses only FRONTEND_ORIGIN in production and trusts a proxy only when asked", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
      TRUST_PROXY: process.env.TRUST_PROXY,
    };
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_ORIGIN = "https://mailer.career-lens.in";
    delete process.env.TRUST_PROXY;
    try {
      const config = loadConfig();
      assert.deepEqual(config.allowedOrigins, ["https://mailer.career-lens.in"]);
      assert.equal(config.trustProxy, false);
      assert.equal(JSON.stringify(config.allowedOrigins).includes("*"), false);
    } finally {
      process.env.NODE_ENV = previous.NODE_ENV;
      process.env.FRONTEND_ORIGIN = previous.FRONTEND_ORIGIN;
      process.env.TRUST_PROXY = previous.TRUST_PROXY;
    }
  });
});
