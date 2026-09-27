import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSendRequest } from "./utils/validateSendRequest.ts";

const valid = {
  to: "hod@example.edu",
  recipientName: "Dr. Ravi Kumar",
  designation: "HOD - CSE",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Technical Guest Lecture",
  template: "modern",
};

describe("validateSendRequest", () => {
  it("accepts a complete request and trims whitespace", () => {
    const result = validateSendRequest({
      ...valid,
      collegeName: "  Sai Vidya Institute of Technology  ",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.collegeName, "Sai Vidya Institute of Technology");
      assert.equal(result.value.template, "modern");
      assert.equal(result.value.test, false);
    }
  });

  it("rejects a missing recipient", () => {
    const result = validateSendRequest({ ...valid, to: "   " });
    assert.equal(result.ok, false);
  });

  it("rejects an invalid recipient", () => {
    const result = validateSendRequest({ ...valid, to: "not-an-email" });
    assert.equal(result.ok, false);
  });

  it("rejects a missing college", () => {
    const result = validateSendRequest({ ...valid, collegeName: "" });
    assert.equal(result.ok, false);
  });

  it("requires a department unless the email is for the placement department", () => {
    const missing = validateSendRequest({ ...valid, department: "", placementOutreach: false });
    const named = validateSendRequest({ ...valid, department: "ISE", placementOutreach: false });
    const placementBlank = validateSendRequest({ ...valid, department: "  ", placementOutreach: true });
    const placementNamed = validateSendRequest({ ...valid, department: "ISE", placementOutreach: true });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.message, "Department is required.");
    assert.equal(named.ok, true);
    assert.equal(placementBlank.ok, true);
    assert.equal(placementNamed.ok, true);
    if (placementBlank.ok) {
      assert.equal(placementBlank.value.department, "");
      assert.equal(placementBlank.value.placementOutreach, true);
    }
  });

  it("rejects a non-boolean placement answer", () => {
    const result = validateSendRequest({ ...valid, placementOutreach: "yes" });
    assert.equal(result.ok, false);
  });

  it("rejects an invalid template", () => {
    const result = validateSendRequest({ ...valid, template: "../secret" });
    assert.equal(result.ok, false);
  });

  it("normalizes a comma-separated recipient list and drops duplicates", () => {
    const result = validateSendRequest({
      ...valid,
      to: " arun@example.com, placement@college.ac.in, arun@example.com , , Arun@example.com ",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.value.recipients, ["arun@example.com", "placement@college.ac.in"]);
    }
  });

  it("rejects a list that contains an invalid address", () => {
    const result = validateSendRequest({
      ...valid,
      to: "arun@example.com, not-an-email",
    });
    assert.equal(result.ok, false);
  });

  it("requires a custom subject and message, and keeps branding toggles", () => {
    const missing = validateSendRequest({ ...valid, template: "custom" });
    assert.equal(missing.ok, false);
    const ready = validateSendRequest({
      ...valid,
      template: "custom",
      customSubject: "Session for {{collegeName}}",
      customMessage: "Dear {{recipientName}},\n\nWe can visit {{department}}.",
      branding: { logo: true, banner: false, signature: true, footer: false },
    });
    assert.equal(ready.ok, true);
    if (ready.ok) {
      assert.equal(ready.value.customSubject, "Session for {{collegeName}}");
      assert.equal(ready.value.branding.banner, false);
      assert.equal(ready.value.branding.footer, false);
      assert.equal(ready.value.branding.logo, true);
    }
  });

  it("rejects a test send with more than one address", () => {
    const result = validateSendRequest({
      ...valid,
      to: "one@example.com, two@example.com",
      test: true,
    });
    assert.equal(result.ok, false);
  });

  it("rejects header-breaking whitespace", () => {
    const result = validateSendRequest({ ...valid, collegeName: "College\nBcc: evil@example.com" });
    assert.equal(result.ok, false);
  });
});
