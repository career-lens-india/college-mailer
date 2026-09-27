import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, it } from "node:test";
import { defaultDraft, draftForAnotherEmail, loadDraft, saveDraft, withTemplate } from "../src/lib/draftStorage.ts";
import { passcodeDigits, passcodePlaceholder } from "../src/lib/passcodeCopy.ts";
import {
  commitTemplateSwitch,
  consumeTemplateSwitchRefresh,
  DESKTOP_SPLIT_MEDIA_QUERY,
  planTemplateSwitch,
  TEMPLATE_REFRESH_LABEL,
  TEMPLATE_SWITCH_REFRESH_KEY,
} from "../src/lib/templateSwitch.ts";
import { renderPlainText } from "../src/lib/plainText.ts";
import { commitPreview, renderPreviewFragment, toPreviewFragment } from "../src/lib/previewMarkup.ts";
import {
  defaultContent,
  mergeTemplateContent,
  resolveEditableText,
} from "../src/lib/templateContent.ts";
import { renderEmailHtml } from "../src/templates/renderEmail.tsx";
import type { ComposerMode, EmailTemplateData } from "../src/types/outreach.ts";
import { validateSendRequest } from "./utils/validateSendRequest.ts";

const data: EmailTemplateData = {
  recipientName: "Dr. Ravi Kumar",
  designation: "Dean",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE",
  sessionInterest: "Technical Guest Lecture",
  placementOutreach: false,
};

describe("passcode placeholder", () => {
  it("shows eight digit marks without revealing the date format", () => {
    assert.equal(passcodePlaceholder, "________");
    assert.equal(passcodePlaceholder.length, 8);
    assert.doesNotMatch(passcodePlaceholder, /DDMM|YYYY|date/i);
    assert.equal(passcodeDigits("27-09-2026"), "27092026");
    assert.equal(passcodeDigits("abc27092026extra"), "27092026");
    const source = readFileSync(new URL("../src/components/PasscodeScreen.tsx", import.meta.url), "utf8");
    assert.match(source, /placeholder=\{passcodePlaceholder\}/);
    assert.match(source, /maxLength=\{8\}/);
    assert.match(source, /inputMode="numeric"/);
    assert.match(source, /Enter today's passcode/);
    assert.doesNotMatch(source, /DDMMYYYY/);
    assert.doesNotMatch(readFileSync(new URL("../src/lib/passcodeCopy.ts", import.meta.url), "utf8"), /DDMMYYYY/);
  });
});

describe("editable template content", () => {
  it("resolves default copy without leaving tokens or an empty greeting", () => {
    for (const template of ["professional", "modern", "minimal", "newsletter"] as const) {
      const html = renderEmailHtml(template, data);
      assert.doesNotMatch(html, /\{\{/);
      assert.match(html, /Dear Dr\. Ravi Kumar,/);
      assert.match(html, /Sai Vidya Institute of Technology/);
    }
    const empty = renderEmailHtml("professional", {
      collegeName: "",
      department: "",
      sessionInterest: "Not Specified",
    });
    assert.match(empty, /Dear Sir\/Madam,/);
    assert.doesNotMatch(empty, /Dear ,/);
    assert.doesNotMatch(empty, /for the {2}department/);
  });

  it("uses edited content in the shared renderer and keeps other templates separate", () => {
    const professional = {
      ...defaultContent("professional"),
      heroTitle: "A campus heading for ELVA",
      introduction: "A note for {{collegeName}}.",
    };
    const html = renderEmailHtml("professional", { ...data, content: professional });
    assert.match(html, /A campus heading for ELVA/);
    assert.match(html, /A note for Sai Vidya Institute of Technology/);
    assert.doesNotMatch(html, /Empowering Students Through Industry-Led Learning/);
    const modern = renderEmailHtml("modern", data);
    assert.match(modern, /Industry Knowledge today/);
    assert.doesNotMatch(modern, /A campus heading for ELVA/);
  });

  it("omits an empty heading without dropping the surrounding layout", () => {
    const html = renderEmailHtml("professional", {
      ...data,
      content: { ...defaultContent("professional"), sectionHeading: "   " },
    });
    assert.doesNotMatch(html, /Popular Session Topics/);
    assert.match(html, /Generative AI &amp; Artificial Intelligence|Generative AI & Artificial Intelligence/);
    assert.match(html, /src="\/assets\/hero-professional/);
  });

  it("escapes custom email text and leaves it outside the fixed content model", () => {
    const html = renderEmailHtml("custom", {
      ...data,
      customMessage: "Hello <script>alert(1)</script>\n\n{{collegeName}}",
      content: { heroTitle: "Should not appear" },
    });
    assert.match(html, /Hello &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /Sai Vidya Institute of Technology/);
    assert.doesNotMatch(html, /Should not appear/);
    assert.doesNotMatch(html, /<script>/);
  });

  it("keeps each template's edits when the selection changes and restores them from the draft", () => {
    const edited = {
      ...data,
      selectedTemplate: "professional" as const,
      professionalContent: {
        ...defaultContent("professional"),
        heroTitle: "Kept professional heading",
        additionalMessage: "Professional extra",
      },
      modernContent: {
        ...defaultContent("modern"),
        heroTitle: "Kept modern heading",
        additionalMessage: "Modern extra",
      },
      branding: { logo: false, banner: true, signature: true, footer: false },
      recipientEmail: "person1@example.com",
      recipientName: "Dr. Ravi Kumar",
      designation: "Dean",
      collegeName: "Sai Vidya Institute of Technology",
      department: "CSE",
      placementOutreach: false,
      sessionInterest: "Technical Guest Lecture" as const,
      customSubject: "Custom subject",
      customMessage: "Custom message",
    };
    const switched = withTemplate(
      {
        recipientEmail: edited.recipientEmail,
        recipientName: edited.recipientName,
        designation: edited.designation,
        collegeName: edited.collegeName,
        department: edited.department,
        placementOutreach: false,
        sessionInterest: edited.sessionInterest,
        selectedTemplate: "professional",
        customSubject: edited.customSubject,
        customMessage: edited.customMessage,
        branding: edited.branding,
        professionalContent: edited.professionalContent,
        modernContent: edited.modernContent,
        minimalContent: defaultContent("minimal"),
        newsletterContent: defaultContent("newsletter"),
      },
      "modern",
    );
    assert.equal(switched.selectedTemplate, "modern");
    assert.equal(switched.professionalContent.heroTitle, "Kept professional heading");
    assert.equal(switched.professionalContent.additionalMessage, "Professional extra");
    assert.equal(switched.modernContent.additionalMessage, "Modern extra");
    assert.equal(switched.collegeName, edited.collegeName);
    const returned = withTemplate(switched, "professional");
    assert.equal(returned.professionalContent.heroTitle, "Kept professional heading");

    const storage = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };
    Object.assign(globalThis, { localStorage });
    saveDraft(returned);
    const loaded = loadDraft();
    assert.equal(loaded.selectedTemplate, "professional");
    assert.equal(loaded.professionalContent.heroTitle, "Kept professional heading");
    assert.equal(loaded.modernContent.heroTitle, "Kept modern heading");
    assert.equal(loaded.professionalContent.additionalMessage, "Professional extra");
    assert.equal(loaded.modernContent.additionalMessage, "Modern extra");
    assert.equal(loaded.minimalContent.additionalMessage, "");
    assert.equal(loaded.newsletterContent.additionalMessage, "");
    assert.equal(loaded.customSubject, "Custom subject");
    assert.equal(loaded.branding.logo, false);
    assert.equal(loaded.branding.footer, false);
    const reset = draftForAnotherEmail(loaded);
    assert.equal(reset.selectedTemplate, "professional");
    assert.equal(reset.professionalContent.heroTitle, defaultContent("professional").heroTitle);
    assert.equal(reset.professionalContent.additionalMessage, "");
    assert.equal(reset.modernContent.additionalMessage, "");
    assert.equal(reset.collegeName, "");
  });

  it("sends the same edited content the preview renders", () => {
    const content = { ...defaultContent("minimal"), heading: "Edited minimal heading" };
    const preview = renderEmailHtml("minimal", { ...data, content });
    const parsed = validateSendRequest({
      to: "person1@example.com",
      collegeName: data.collegeName,
      department: data.department,
      recipientName: data.recipientName,
      designation: data.designation,
      sessionInterest: data.sessionInterest,
      placementOutreach: false,
      template: "minimal",
      content,
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    const sent = renderEmailHtml("minimal", {
      ...data,
      content: mergeTemplateContent(parsed.value.template === "minimal" ? "minimal" : "minimal", parsed.value.content),
    });
    assert.match(preview, /Edited minimal heading/);
    assert.equal(sent, preview);
    assert.equal(parsed.value.content?.heading, "Edited minimal heading");
  });
});

describe("preview shell stability", () => {
  it("does not blank or remount the preview when the template changes", () => {
    const preview = readFileSync(new URL("../src/components/LivePreview.tsx", import.meta.url), "utf8");
    const frame = readFileSync(new URL("../src/components/EmailPreview.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(preview, /opacity-0|setVisible\(false\)|key=\{|preview-settle|setPreviewHtml\(""\)|setPreview\(null\)/);
    assert.match(preview, /commitPreview/);
    assert.match(preview, /Preview could not be updated\./);
    assert.match(frame, /shadowRoot/);
    assert.doesNotMatch(frame, /iframe|srcDoc|sandbox|createRoot|document\.write|unmount\(|renderEmailHtml/);
    const thumbnail = readFileSync(new URL("../src/components/EmailThumbnail.tsx", import.meta.url), "utf8");
    assert.match(thumbnail, /<img/);
    assert.doesNotMatch(thumbnail, /iframe|srcDoc|sandbox|createRoot|document\.write|shadowRoot/);
    const selector = readFileSync(new URL("../src/components/TemplateSelector.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(selector, /iframe|srcDoc|createRoot|renderEmailHtml|shadowRoot/);
    assert.match(readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8"), /commitTemplateSwitch\(draft, selectedTemplate, desktopSplit/);
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    assert.match(app, /<PreviewBoundary resetKey=\{draft\.selectedTemplate\}>/);
    assert.doesNotMatch(app, /key=\{draft\.selectedTemplate\}/);
    const boundary = readFileSync(new URL("../src/components/AppErrorBoundary.tsx", import.meta.url), "utf8");
    assert.match(boundary, /Something went wrong\./);
    assert.match(boundary, /Reload CareerLens/);
    assert.match(boundary, /import\.meta\.env\.DEV/);
    assert.match(readFileSync(new URL("../src/components/PreviewBoundary.tsx", import.meta.url), "utf8"), /Preview unavailable/);
    assert.equal(resolveEditableText("Hello {{collegeName}}", data), "Hello Sai Vidya Institute of Technology");
  });

  it("renders every template as script-free email HTML", () => {
    const sequence: ComposerMode[] = [
      "professional",
      "modern",
      "minimal",
      "newsletter",
      "professional",
      "custom",
      "modern",
      "newsletter",
      "minimal",
      "professional",
      "modern",
      "newsletter",
    ];
    for (const template of sequence) {
      const html = renderEmailHtml(template, data);
      assert.match(html, /<!DOCTYPE html>/);
      assert.match(html, /CareerLens/);
      assert.doesNotMatch(html, /<script|localhost:5173|@vite|react-refresh|createRoot|ReactDOM|campus-sit|campus-bit/i);
      const fragment = toPreviewFragment(`${html}<script>alert(1)</script>`);
      assert.equal(fragment.includes("<script"), false);
      assert.doesNotMatch(fragment, /<!DOCTYPE|<html|<body/i);
    }
    for (const template of ["professional", "modern", "minimal", "newsletter", "custom"] as const) {
      assert.doesNotThrow(() =>
        renderEmailHtml(template, {
          collegeName: "ELVA TECH",
          department: "",
          customMessage: template === "custom" ? "Hello <b>there</b>" : undefined,
        }),
      );
    }
    const professional = renderEmailHtml("professional", {
      ...data,
      customMessage: "Custom only sentence",
      content: defaultContent("professional"),
    });
    assert.doesNotMatch(professional, /Custom only sentence/);
  });

  it("keeps the last valid preview when the next render fails", () => {
    const first = commitPreview(null, "<p>Professional</p>");
    assert.equal(first.failed, false);
    assert.equal(first.html, "<p>Professional</p>");
    const kept = commitPreview(first.html, null);
    assert.equal(kept.failed, true);
    assert.equal(kept.html, "<p>Professional</p>");
    const blank = commitPreview(first.html, "   ");
    assert.equal(blank.html, "<p>Professional</p>");
    const next = commitPreview(kept.html, "<p>Modern</p>");
    assert.equal(next.failed, false);
    assert.equal(next.html, "<p>Modern</p>");
    const rendered = renderPreviewFragment("modern", data);
    assert.match(rendered, /Industry Knowledge today/);
    assert.doesNotMatch(rendered, /<!DOCTYPE|<html|<body|<script/i);
  });
});

describe("template thumbnails", () => {
  it("uses a static image of each approved design", () => {
    for (const file of [
      "template-professional-preview.png",
      "template-modern-preview.png",
      "template-minimal-preview.png",
      "template-newsletter-preview.png",
    ]) {
      const path = new URL(`../public/assets/${file}`, import.meta.url);
      assert.equal(existsSync(path), true);
      assert.ok(statSync(path).size > 5000);
    }
  });
});

describe("campus engagements", () => {
  it("keeps the two established engagements as text and does not use a campus photograph", () => {
    for (const template of ["professional", "modern", "minimal", "newsletter"] as const) {
      const html = renderEmailHtml(template, data);
      assert.match(html, /Siddaganga Institute of Technology, Tumakuru/);
      assert.match(html, /Generative AI &amp; Prompt Engineering|Generative AI & Prompt Engineering/);
      assert.match(html, /Bangalore Institute of Technology, Bengaluru/);
      assert.match(html, /Prompt Engineering: Core Techniques/);
      assert.match(html, /AICTE ATAL/);
      assert.doesNotMatch(html, /campus-sit|campus-bit|<img[^>]+alt=""/);
    }
  });
});

describe("additional message", () => {
  it("stays out of the email until it has text, then appears before the signature", () => {
    for (const template of ["professional", "modern", "minimal", "newsletter"] as const) {
      const empty = renderEmailHtml(template, {
        ...data,
        content: { ...defaultContent(template), additionalMessage: "   " },
      });
      const baseline = renderEmailHtml(template, data);
      assert.equal(empty, baseline);

      const note = "Please let us know a suitable date.\n\nA format for {{collegeName}}.";
      const html = renderEmailHtml(template, {
        ...data,
        content: { ...defaultContent(template), additionalMessage: note },
      });
      const textAt = html.indexOf("Please let us know a suitable date.");
      const signatureAt = html.lastIndexOf("info@career-lens.in");
      assert.ok(textAt > 0);
      assert.ok(signatureAt > textAt);
      assert.match(html, /A format for Sai Vidya Institute of Technology\./);
      assert.match(html.slice(textAt, html.indexOf("A format for")), /<\/p>/);

      const escaped = renderEmailHtml(template, {
        ...data,
        content: { ...defaultContent(template), additionalMessage: "Hello <b>team</b> & friends" },
      });
      assert.match(escaped, /Hello &lt;b&gt;team&lt;\/b&gt; &amp; friends/);
      assert.doesNotMatch(escaped, /<b>team<\/b>/);

      const plain = renderPlainText(
        { ...data, content: { ...defaultContent(template), additionalMessage: "Extra for {{department}}" } },
        undefined,
        template,
      );
      assert.match(plain, /Extra for the CSE department|Extra for CSE/);
      assert.ok(plain.indexOf("Extra for") < plain.lastIndexOf("+91 63619 10673"));
      const plainHtml = renderEmailHtml(template, {
        ...data,
        content: { ...defaultContent(template), additionalMessage: "Extra for {{department}}" },
      });
      assert.match(plainHtml, /Extra for/);
      assert.equal(plain.includes("<"), false);
    }
  });
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe("desktop template refresh fallback", () => {
  const filled = {
    ...defaultDraft,
    recipientEmail: "hod@college.edu, dean@college.edu",
    recipientName: "Arun P N",
    designation: "HOD",
    collegeName: "ELVA TECH",
    department: "ISE",
    placementOutreach: false,
    sessionInterest: "Technical Guest Lecture" as const,
    selectedTemplate: "professional" as const,
    customSubject: "A custom subject",
    customMessage: "A custom message for {{collegeName}}",
    branding: { logo: false, banner: true, signature: false, footer: true },
    professionalContent: { ...defaultContent("professional"), heroTitle: "Professional heading", additionalMessage: "Professional note" },
    modernContent: { ...defaultContent("modern"), heroTitle: "Modern heading", additionalMessage: "Modern note" },
    minimalContent: { ...defaultContent("minimal"), additionalMessage: "Minimal note" },
    newsletterContent: { ...defaultContent("newsletter"), additionalMessage: "Newsletter note" },
  };

  it("refreshes once on desktop, keeps the draft, and does not refresh again", () => {
    assert.equal(DESKTOP_SPLIT_MEDIA_QUERY, "(min-width: 1024px)");
    const local = memoryStorage();
    const session = memoryStorage();
    Object.assign(globalThis, { localStorage: local });

    const first = commitTemplateSwitch(filled, "modern", true, session);
    assert.equal(first.action, "refresh");
    assert.equal(session.getItem(TEMPLATE_SWITCH_REFRESH_KEY), "true");
    assert.equal(first.draft.selectedTemplate, "modern");

    let reloads = first.action === "refresh" ? 1 : 0;
    const pending = consumeTemplateSwitchRefresh(session);
    assert.equal(pending, true);
    assert.equal(session.getItem(TEMPLATE_SWITCH_REFRESH_KEY), null);
    const secondPass = consumeTemplateSwitchRefresh(session);
    assert.equal(secondPass, false);
    if (secondPass) reloads += 1;
    assert.equal(reloads, 1);

    const restored = loadDraft();
    assert.equal(restored.selectedTemplate, "modern");
    assert.equal(restored.recipientEmail, filled.recipientEmail);
    assert.equal(restored.recipientName, "Arun P N");
    assert.equal(restored.designation, "HOD");
    assert.equal(restored.collegeName, "ELVA TECH");
    assert.equal(restored.department, "ISE");
    assert.equal(restored.placementOutreach, false);
    assert.equal(restored.sessionInterest, "Technical Guest Lecture");
    assert.equal(restored.professionalContent.heroTitle, "Professional heading");
    assert.equal(restored.professionalContent.additionalMessage, "Professional note");
    assert.equal(restored.modernContent.heroTitle, "Modern heading");
    assert.equal(restored.modernContent.additionalMessage, "Modern note");
    assert.equal(restored.minimalContent.additionalMessage, "Minimal note");
    assert.equal(restored.newsletterContent.additionalMessage, "Newsletter note");
    assert.equal(restored.customSubject, "A custom subject");
    assert.equal(restored.customMessage, filled.customMessage);
    assert.deepEqual(restored.branding, filled.branding);

    const again = commitTemplateSwitch(restored, "modern", true, session);
    assert.equal(again.action, "ignore");
    assert.equal(session.getItem(TEMPLATE_SWITCH_REFRESH_KEY), null);
    assert.equal(reloads, 1);
  });

  it("updates in place below the desktop split and does not refresh for the same template", () => {
    const session = memoryStorage();
    const narrow = commitTemplateSwitch(filled, "minimal", false, session);
    assert.equal(narrow.action, "live");
    assert.equal(narrow.draft.selectedTemplate, "minimal");
    assert.equal(narrow.draft.collegeName, "ELVA TECH");
    assert.equal(narrow.draft.modernContent.heroTitle, "Modern heading");
    assert.equal(session.getItem(TEMPLATE_SWITCH_REFRESH_KEY), null);
    assert.equal(planTemplateSwitch("professional", "professional", true), "ignore");
    assert.equal(commitTemplateSwitch(filled, "professional", true, session).action, "ignore");
  });

  it("keeps the refresh in the desktop selection path only", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    const overlay = readFileSync(new URL("../src/components/TemplateRefreshOverlay.tsx", import.meta.url), "utf8");
    assert.match(app, /commitTemplateSwitch/);
    assert.match(app, /consumeTemplateSwitchRefresh/);
    assert.match(app, /useDesktopSplit/);
    assert.match(app, /window\.location\.reload\(\)/);
    assert.match(overlay, /TEMPLATE_REFRESH_LABEL/);
    assert.equal(TEMPLATE_REFRESH_LABEL, "Updating template...");
    assert.match(readFileSync(new URL("../src/lib/useDesktopSplit.ts", import.meta.url), "utf8"), /matchMedia/);
    assert.doesNotMatch(readFileSync(new URL("../src/components/TemplateSelector.tsx", import.meta.url), "utf8"), /location\.reload|iframe|createRoot/);
  });
});
