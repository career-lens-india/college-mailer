import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderPlainText } from "../src/lib/plainText.ts";
import { buildEmailSubject } from "../src/lib/subject.ts";
import { renderEmailHtml } from "../src/templates/renderEmail.tsx";
import type { EmailTemplateData, TemplateId } from "../src/types/outreach.ts";

const full: EmailTemplateData = {
  recipientName: "Dr. Ravi Kumar",
  designation: "Dean",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Hands-on Workshop",
};

describe("email rendering", () => {
  const templates: TemplateId[] = ["professional", "modern", "minimal", "newsletter"];

  for (const template of templates) {
    it(`renders the ${template} template with personalization`, () => {
      const html = renderEmailHtml(template, full);
      assert.match(html, /Dear Dr\. Ravi Kumar,/);
      assert.match(html, /Dean/);
      assert.match(html, /Sai Vidya Institute of Technology/);
      assert.match(html, /CSE &amp; ISE|CSE & ISE/);
      assert.match(html, /hands-on workshop/);
      assert.doesNotMatch(html, /Not Specified/);
      assert.doesNotMatch(html, /\{\{/);
      assert.match(html, /src="\/assets\/careerlens-logo\.png"/);
      assert.match(html, /src="\/assets\/hero-/);
    });
  }

  it("falls back when the recipient name is empty and omits an empty designation", () => {
    const html = renderEmailHtml("professional", {
      collegeName: "Sai Vidya Institute of Technology",
      department: "ISE",
      sessionInterest: "Not Specified",
    });
    assert.match(html, /Dear Sir\/Madam,/);
    assert.match(html, /the ISE department/);
    assert.match(html, /an industry interaction/);
    assert.doesNotMatch(html, /Not Specified/);
    assert.doesNotMatch(html, />Dean</);
  });

  it("addresses faculty for a faculty development session", () => {
    const html = renderEmailHtml("modern", {
      collegeName: "Sai Vidya Institute of Technology",
      department: "MCA",
      sessionInterest: "Faculty Development",
    });
    assert.match(html, /faculty from the MCA department/);
    assert.doesNotMatch(html, /students from the MCA/);
  });

  it("rewrites image URLs to the public asset host", () => {
    const html = renderEmailHtml("newsletter", full, {
      assetBaseUrl: "https://mailer.career-lens.in",
    });
    assert.match(html, /src="https:\/\/mailer\.career-lens\.in\/assets\/careerlens-logo\.png"/);
    assert.match(html, /src="https:\/\/mailer\.career-lens\.in\/assets\/hero-/);
    assert.doesNotMatch(html, /campus-sit|campus-bit/);
    assert.match(html, /Siddaganga Institute of Technology, Tumakuru/);
    assert.match(html, /Bangalore Institute of Technology, Bengaluru/);
    assert.doesNotMatch(html, /src="\/assets\//);
    assert.doesNotMatch(html, /[A-Za-z]:\\/);
    assert.doesNotMatch(html, /file:\/\//);
  });

  it("builds a plain-text fallback without markup", () => {
    const text = renderPlainText(full);
    assert.match(text, /Dear Dr\. Ravi Kumar,/);
    assert.match(text, /Sai Vidya Institute of Technology/);
    assert.match(text, /CSE & ISE/);
    assert.match(text, /Generative AI & Artificial Intelligence/);
    assert.match(text, /Siddaganga Institute of Technology, Tumakuru/);
    assert.match(text, /https:\/\/www\.career-lens\.in\/campus-impact/);
    assert.doesNotMatch(text, /<[^>]+>/);
    assert.doesNotMatch(text, /Not Specified/);
  });

  it("personalizes the subject and prefixes test mail", () => {
    assert.equal(
      buildEmailSubject("Sai Vidya Institute of Technology", false),
      "Industry-Led Technical Sessions & Workshops for Sai Vidya Institute of Technology",
    );
    assert.match(buildEmailSubject("Sai Vidya Institute of Technology", true), /^\[TEST\] /);
    const longSubject = buildEmailSubject("A".repeat(200), false);
    assert.ok(longSubject.length <= 110);
    assert.doesNotMatch(longSubject, /!!!|URGENT|FREE/);
  });
});
