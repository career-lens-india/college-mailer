import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultDraft, draftForAnotherEmail, withTemplate } from "../src/lib/draftStorage.ts";
import { explainSendFailure, sendMessages } from "../src/lib/messages.ts";
import { isValidEmail, validateOutreach } from "../src/lib/validation.ts";
import type { OutreachDraft } from "../src/types/outreach.ts";

const filled: OutreachDraft = {
  ...defaultDraft,
  recipientEmail: "hod@college.edu",
  recipientName: "Dr. Ravi Kumar",
  designation: "HOD - CSE",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Technical Guest Lecture",
  selectedTemplate: "newsletter",
};

describe("form validation", () => {
  it("accepts normal institutional addresses", () => {
    for (const email of ["hod@college.edu", "tpo@college.ac.in", "placement.office@example.edu"]) {
      assert.equal(isValidEmail(email), true);
      const errors = validateOutreach({ ...filled, recipientEmail: email });
      assert.equal(errors.recipientEmail, undefined);
    }
  });

  it("rejects an invalid email without limiting the domain", () => {
    const errors = validateOutreach({ ...filled, recipientEmail: "not-an-email" });
    assert.equal(errors.recipientEmail, sendMessages.recipientsInvalid);
    assert.equal(isValidEmail("person@company.com"), true);
  });

  it("requires college and requires a department unless this is placement outreach", () => {
    const errors = validateOutreach({ ...filled, collegeName: "  ", department: "" });
    assert.equal(errors.collegeName, sendMessages.collegeRequired);
    assert.equal(errors.department, sendMessages.departmentRequired);
    const missing = validateOutreach({ ...filled, department: "", placementOutreach: false });
    assert.equal(missing.department, sendMessages.departmentRequired);
    const general = validateOutreach({ ...filled, department: "ISE", placementOutreach: false });
    assert.equal(general.department, undefined);
    const placementBlank = validateOutreach({ ...filled, department: "", placementOutreach: true });
    assert.equal(placementBlank.department, undefined);
    const placementNamed = validateOutreach({ ...filled, department: "ISE", placementOutreach: true });
    assert.equal(placementNamed.department, undefined);
  });

  it("allows optional name, designation, and session interest", () => {
    const errors = validateOutreach({
      ...filled,
      recipientName: "",
      designation: "",
      sessionInterest: "Not Specified",
    });
    assert.deepEqual(errors, {});
  });

  it("rejects values that are too long to send", () => {
    const errors = validateOutreach({
      ...filled,
      collegeName: "C".repeat(181),
      department: "D".repeat(121),
      recipientName: "N".repeat(121),
    });
    assert.equal(errors.collegeName, sendMessages.collegeTooLong);
    assert.equal(errors.department, sendMessages.departmentTooLong);
    assert.equal(errors.recipientName, sendMessages.nameTooLong);
  });
});

describe("draft reset", () => {
  it("keeps the template and clears the previous college", () => {
    const next = draftForAnotherEmail(filled);
    assert.equal(next.selectedTemplate, "newsletter");
    assert.equal(next.recipientEmail, "");
    assert.equal(next.recipientName, "");
    assert.equal(next.designation, "");
    assert.equal(next.collegeName, "");
    assert.equal(next.department, "");
    assert.equal(next.placementOutreach, false);
    assert.equal(next.customSubject, "");
    assert.equal(next.customMessage, "");
    assert.equal(next.sessionInterest, "Not Specified");
    assert.equal(next.newsletterContent.heading, defaultDraft.newsletterContent.heading);
  });

  it("keeps recipient details when the template changes", () => {
    const next = withTemplate(filled, "custom");
    assert.equal(next.selectedTemplate, "custom");
    assert.equal(next.collegeName, filled.collegeName);
    assert.equal(next.department, filled.department);
    assert.equal(next.recipientEmail, filled.recipientEmail);
    assert.equal(next.recipientName, filled.recipientName);
    assert.equal(next.newsletterContent.heading, filled.newsletterContent.heading);
  });
});

describe("send failure copy", () => {
  it("maps configuration, rejection, provider, and network failures", () => {
    assert.equal(
      explainSendFailure({ status: 503, code: "ASSET_BASE_URL_MISSING" }),
      sendMessages.notConfigured,
    );
    assert.equal(
      explainSendFailure({ status: 503, code: "EMAIL_CONFIG_MISSING" }),
      sendMessages.notConfigured,
    );
    assert.equal(
      explainSendFailure({ status: 400, code: "RECIPIENT_REJECTED" }),
      sendMessages.recipientRejected,
    );
    assert.equal(
      explainSendFailure({ status: 502, code: "EMAIL_SEND_FAILED" }),
      sendMessages.providerFailed,
    );
    assert.equal(explainSendFailure({ status: 0, code: "NETWORK_ERROR" }), sendMessages.network);
    assert.equal(explainSendFailure({ status: 429, code: "RATE_LIMITED" }), sendMessages.rateLimited);
    assert.equal(
      explainSendFailure({ status: 400, code: "VALIDATION_ERROR", message: sendMessages.emailInvalid }),
      sendMessages.emailInvalid,
    );
  });
});
