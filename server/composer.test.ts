import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRecipientList } from "../src/lib/recipients.ts";
import { buildEmailSubject, subjectForDelivery } from "../src/lib/subject.ts";
import { applyPersonalizationTokens } from "../src/lib/tokens.ts";
import { renderPlainText } from "../src/lib/plainText.ts";
import { renderEmailHtml } from "../src/templates/renderEmail.tsx";
import type { EmailTemplateData, TemplateId } from "../src/types/outreach.ts";
import { deliverOutreach } from "./services/emailService.ts";
import { validateSendRequest } from "./utils/validateSendRequest.ts";

const data: EmailTemplateData = {
  recipientName: "Dr. Ravi Kumar",
  designation: "Dean",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Hands-on Workshop",
};

describe("recipient list", () => {
  it("trims whitespace, ignores empty entries, and removes obvious duplicates", () => {
    const parsed = parseRecipientList(
      " arun@example.com, placement@college.ac.in, , arun@example.com , Arun@example.com ",
    );
    assert.deepEqual(parsed.invalid, []);
    assert.deepEqual(parsed.recipients, ["arun@example.com", "placement@college.ac.in"]);
  });
});

describe("custom email", () => {
  it("replaces supported tokens and avoids an empty greeting", () => {
    const named = applyPersonalizationTokens("Dear {{recipientName}}, {{collegeName}} / {{department}}", data);
    assert.equal(named, "Dear Dr. Ravi Kumar, Sai Vidya Institute of Technology / CSE & ISE");
    const fallback = applyPersonalizationTokens("Dear {{recipientName}},", {
      ...data,
      recipientName: "",
      department: "",
      sessionInterest: "Not Specified",
    });
    assert.equal(fallback, "Dear Sir/Madam,");
    assert.equal(fallback.includes("{{"), false);
  });

  it("uses the custom subject and the same renderer for preview and send", async () => {
    const customData: EmailTemplateData = {
      ...data,
      customSubject: "Hello {{collegeName}}",
      customMessage: "Dear {{recipientName}},\n\nA note for {{collegeName}}.",
      branding: { logo: true, banner: false, signature: true, footer: false },
    };
    const preview = renderEmailHtml("custom", customData);
    const hosted = renderEmailHtml("custom", customData, { assetBaseUrl: "https://mailer.career-lens.in" });
    assert.equal(hosted, preview.replaceAll('="/assets/', '="https://mailer.career-lens.in/assets/'));
    assert.match(preview, /Dear Dr\. Ravi Kumar,/);
    assert.match(preview, /src="\/assets\/careerlens-logo\.png"/);
    assert.doesNotMatch(preview, /careerlens-banner/);
    assert.match(preview, /Rohith R\./);
    assert.doesNotMatch(preview, /www\.career-lens\.in/);

    const parsed = validateSendRequest({
      to: "hod@example.edu",
      recipientName: data.recipientName,
      collegeName: data.collegeName,
      department: data.department,
      template: "custom",
      customSubject: customData.customSubject,
      customMessage: customData.customMessage,
      branding: customData.branding,
      test: true,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let html = "";
    let subject = "";
    await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail(input) {
          html = input.html;
          subject = input.subject;
          return { success: true, messageId: "custom-1" };
        },
      },
    });
    assert.equal(html, hosted);
    assert.equal(subject, "[TEST] Hello Sai Vidya Institute of Technology");
    assert.match(
      renderPlainText(customData, {
        websiteUrl: "https://www.career-lens.in/",
        campusImpactUrl: "https://www.career-lens.in/campus-impact",
      }, "custom"),
      /Dear Dr\. Ravi Kumar,/,
    );
  });

  it("hides logo, banner, signature, and footer when those toggles are off", () => {
    const html = renderEmailHtml("custom", {
      collegeName: "ABC Institute of Technology",
      department: "",
      customMessage: "Hello from CareerLens.",
      branding: { logo: false, banner: false, signature: false, footer: false },
    });
    assert.match(html, /Hello from CareerLens\./);
    assert.doesNotMatch(html, /<img/i);
    assert.doesNotMatch(html, /Rohith/);
    assert.doesNotMatch(html, /career-lens\.in/);
  });
});

describe("shared renderer", () => {
  const templates: TemplateId[] = ["professional", "modern", "minimal", "newsletter"];

  for (const template of templates) {
    it(`uses one ${template} renderer for preview and send`, async () => {
      const preview = renderEmailHtml(template, data);
      const hosted = renderEmailHtml(template, data, { assetBaseUrl: "https://mailer.career-lens.in" });
      assert.equal(hosted, preview.replaceAll('="/assets/', '="https://mailer.career-lens.in/assets/'));
      assert.equal(
        subjectForDelivery({ template, collegeName: data.collegeName, data, test: false }),
        buildEmailSubject(data.collegeName),
      );

      const parsed = validateSendRequest({
        to: "hod@example.edu",
        recipientName: data.recipientName,
        designation: data.designation,
        collegeName: data.collegeName,
        department: data.department,
        sessionInterest: data.sessionInterest,
        template,
      });
      assert.equal(parsed.ok, true);
      if (!parsed.ok) return;
      let html = "";
      await deliverOutreach(parsed.value, {
        nodeEnv: "test",
        assetBaseUrl: "https://mailer.career-lens.in",
        provider: {
          async sendEmail(input) {
            html = input.html;
            return { success: true };
          },
        },
      });
      assert.equal(html, hosted);
    });
  }

  it("addresses the placement office without inventing a department", () => {
    const html = renderEmailHtml("minimal", {
      collegeName: "Siddaganga Institute of Technology",
      department: "",
      placementOutreach: true,
    });
    assert.match(html, /for the Placement Department/);
    assert.doesNotMatch(html, /students from the department/);
  });

  it("allows a general college note with no department", () => {
    const html = renderEmailHtml("professional", {
      collegeName: "ABC Institute of Technology",
      department: "",
      placementOutreach: false,
    });
    assert.match(html, /students at ABC Institute of Technology/);
    assert.doesNotMatch(html, /Placement Department/);
    assert.doesNotMatch(html, /the department/);
  });
});
