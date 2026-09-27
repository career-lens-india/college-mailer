import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deliverOutreach } from "./services/emailService.ts";
import { validateSendRequest } from "./utils/validateSendRequest.ts";

describe("deliverOutreach", () => {
  it("gives the provider the rendered message and a plain-text part", async () => {
    const parsed = validateSendRequest({
      to: "hod@example.edu",
      recipientName: "Dr. Ravi Kumar",
      collegeName: "Sai Vidya Institute of Technology",
      department: "CSE & ISE",
      sessionInterest: "Technical Guest Lecture",
      template: "minimal",
      test: true,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let captured: { to: string; subject: string; html: string; text?: string } | undefined;
    const result = await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail(input) {
          captured = input;
          return { success: true, messageId: "id-1" };
        },
      },
    });

    assert.equal(result.messageId, "id-1");
    assert.ok(captured);
    assert.equal(captured.to, "hod@example.edu");
    assert.match(captured.subject, /^\[TEST\] Industry-Led Technical Sessions & Workshops for Sai Vidya/);
    assert.match(captured.html, /src="https:\/\/mailer\.career-lens\.in\/assets\/careerlens-logo\.png"/);
    assert.match(captured.html, /Dear Dr\. Ravi Kumar,/);
    assert.doesNotMatch(captured.html, /src="\/assets\//);
    assert.doesNotMatch(captured.html, /[A-Za-z]:\\/);
    assert.match(captured.text ?? "", /Dear Dr\. Ravi Kumar,/);
    assert.doesNotMatch(captured.text ?? "", /<html/);
  });

  it("does not send when public image hosting is missing", async () => {
    const parsed = validateSendRequest({
      to: "hod@example.edu",
      collegeName: "Sai Vidya Institute of Technology",
      department: "CSE",
      template: "modern",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let called = false;
    await assert.rejects(
      () =>
        deliverOutreach(parsed.value, {
          nodeEnv: "development",
          provider: {
            async sendEmail() {
              called = true;
              return { success: true };
            },
          },
        }),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, "ASSET_BASE_URL_MISSING");
        return true;
      },
    );
    assert.equal(called, false);
  });

  it("accepts a public asset origin with or without a trailing slash", async () => {
    for (const assetBaseUrl of ["https://mailer.career-lens.in", "https://mailer.career-lens.in/"]) {
      const parsed = validateSendRequest({
        to: "hod@example.edu",
        collegeName: "Sai Vidya Institute of Technology",
        department: "CSE",
        template: "professional",
      });
      assert.equal(parsed.ok, true);
      if (!parsed.ok) return;

      let html = "";
      await deliverOutreach(parsed.value, {
        nodeEnv: "test",
        assetBaseUrl,
        provider: {
          async sendEmail(input) {
            html = input.html;
            return { success: true };
          },
        },
      });
      assert.match(html, /src="https:\/\/mailer\.career-lens\.in\/assets\/careerlens-logo\.png"/);
      assert.doesNotMatch(html, /career-lens\.in\/\/assets/);
      assert.doesNotMatch(html, /career-lens\.inassets/);
    }
  });

  it("does not send when the asset host is local", async () => {
    const parsed = validateSendRequest({
      to: "hod@example.edu",
      collegeName: "Sai Vidya Institute of Technology",
      department: "CSE",
      template: "modern",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    let called = false;
    await assert.rejects(
      () =>
        deliverOutreach(parsed.value, {
          nodeEnv: "development",
          assetBaseUrl: "http://127.0.0.1:5000/",
          provider: {
            async sendEmail() {
              called = true;
              return { success: true };
            },
          },
        }),
      (error: unknown) => {
        assert.equal((error as { code?: string }).code, "ASSET_BASE_URL_MISSING");
        return true;
      },
    );
    assert.equal(called, false);
  });

  it("sends the same rendered email separately and reports partial success", async () => {
    const parsed = validateSendRequest({
      ...{
        to: "arun@example.com, placement@example.com, principal@example.com",
        collegeName: "Sai Vidya Institute of Technology",
        department: "CSE",
        template: "modern",
      },
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const sent: { to: string; html: string }[] = [];
    const result = await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail(input) {
          sent.push({ to: input.to, html: input.html });
          if (input.to === "principal@example.com") {
            const error = new Error("mailbox unavailable") as Error & { responseCode?: number };
            error.responseCode = 550;
            throw error;
          }
          return { success: true, messageId: `id-${input.to}` };
        },
      },
    });

    assert.equal(result.sent, 2);
    assert.equal(result.total, 3);
    assert.equal(result.messageId, undefined);
    assert.deepEqual(
      result.results.map((item) => item.success),
      [true, true, false],
    );
    assert.equal(result.results[2]?.error?.code, "RECIPIENT_REJECTED");
    assert.equal(sent.length, 3);
    assert.equal(sent[0]?.html, sent[1]?.html);
    assert.equal(sent[0]?.to.includes(","), false);
    assert.equal(sent[0]?.html.includes("placement@example.com"), false);
    assert.equal(sent[1]?.html.includes("arun@example.com"), false);
  });

  it("reports that nothing was sent when every recipient fails", async () => {
    const parsed = validateSendRequest({
      to: "a@example.com, b@example.com",
      collegeName: "Sai Vidya Institute of Technology",
      department: "CSE",
      template: "professional",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;

    const result = await deliverOutreach(parsed.value, {
      nodeEnv: "test",
      assetBaseUrl: "https://mailer.career-lens.in",
      provider: {
        async sendEmail() {
          const error = new Error("mailbox unavailable") as Error & { responseCode?: number };
          error.responseCode = 550;
          throw error;
        },
      },
    });

    assert.equal(result.sent, 0);
    assert.equal(result.total, 2);
    assert.equal(result.results.every((item) => item.success === false), true);
  });
});
