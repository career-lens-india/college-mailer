import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.ts";
import { AppError } from "./errors.ts";
import { createRateLimiter } from "./utils/rateLimit.ts";
import type { DeliveryResult } from "./services/emailService.ts";
import type { ValidatedOutreach } from "./utils/validateSendRequest.ts";

const payload = {
  to: "hod@example.edu",
  recipientName: "Dr. Ravi Kumar",
  designation: "HOD - CSE",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Technical Guest Lecture",
  template: "modern",
};

const fixedNow = () => new Date("2026-09-27T06:30:00.000Z");

async function sessionCookie(base: string): Promise<string> {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ passcode: "27092026" }),
  });
  assert.equal(response.status, 200);
  const raw = response.headers.getSetCookie?.()[0] ?? response.headers.get("set-cookie") ?? "";
  return raw.split(";")[0] ?? "";
}

async function listen(app: ReturnType<typeof createApp>): Promise<{ server: Server; base: string }> {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP port");
  return { server, base: `http://127.0.0.1:${address.port}` };
}

describe("email API", () => {
  const calls: ValidatedOutreach[] = [];
  let server: Server;
  let base = "";
  let cookie = "";

  before(async () => {
    const app = createApp({
      providerName: "smtp",
      allowedOrigins: ["http://localhost:5173"],
      now: fixedNow,
      rateLimiter: createRateLimiter({ windowMs: 60_000, max: 20 }),
      send: async (input) => {
        calls.push(input);
        const to = input.recipients[0] ?? "";
        if (to === "reject@example.edu") {
          throw new AppError(400, "RECIPIENT_REJECTED", "The recipient email was rejected by the mail server. Please verify the address.");
        }
        if (to === "down@example.edu") {
          throw new Error("535 auth failed password=super-secret");
        }
        const result: DeliveryResult = {
          messageId: "queued-123",
          sent: 1,
          total: 1,
          results: [{ to, success: true, messageId: "queued-123" }],
        };
        return result;
      },
    });
    const running = await listen(app);
    server = running.server;
    base = running.base;
    cookie = await sessionCookie(base);
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns health without secrets", async () => {
    const response = await fetch(`${base}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok", provider: "smtp" });
    assert.equal(JSON.stringify(body).includes("password"), false);
  });

  it("sends a valid request through the email service", async () => {
    calls.length = 0;
    const response = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:5173", cookie },
      body: JSON.stringify({ ...payload, html: "<script>alert(1)</script>" }),
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.messageId, "queued-123");
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.collegeName, payload.collegeName);
    assert.equal(calls[0]?.template, "modern");
    assert.equal("html" in (calls[0] ?? {}), false);
  });

  it("returns 400 for an invalid request and does not send", async () => {
    const beforeCount = calls.length;
    const response = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ ...payload, to: "bad" }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.equal(calls.length, beforeCount);
  });

  it("hides provider failures", async () => {
    const response = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ ...payload, to: "down@example.edu" }),
    });
    const body = await response.json();
    const serialized = JSON.stringify(body);
    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.equal(serialized.includes("super-secret"), false);
    assert.equal(serialized.includes("535"), false);
  });

  it("returns a safe recipient rejection", async () => {
    const response = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ ...payload, to: "reject@example.edu" }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "RECIPIENT_REJECTED");
  });

  it("rate limits repeated sends", async () => {
    const app = createApp({
      providerName: "smtp",
      allowedOrigins: [],
      now: fixedNow,
      rateLimiter: createRateLimiter({ windowMs: 60_000, max: 2 }),
      send: async (input) => ({
        messageId: "ok",
        sent: 1,
        total: 1,
        results: [{ to: input.recipients[0] ?? "", success: true, messageId: "ok" }],
      }),
    });
    const running = await listen(app);
    try {
      const cookieHeader = await sessionCookie(running.base);
      const post = () =>
        fetch(`${running.base}/api/email/send`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie: cookieHeader },
          body: JSON.stringify(payload),
        });
      assert.equal((await post()).status, 200);
      assert.equal((await post()).status, 200);
      const limited = await post();
      const body = await limited.json();
      assert.equal(limited.status, 429);
      assert.equal(body.error.code, "RATE_LIMITED");
    } finally {
      await new Promise<void>((resolve, reject) => {
        running.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("rejects an email send with no session", async () => {
    const beforeCount = calls.length;
    const response = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, test: true }),
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "UNAUTHORIZED");
    assert.equal(calls.length, beforeCount);
  });

  it("does not open CORS to an unlisted origin", async () => {
    const response = await fetch(`${base}/health`, {
      headers: { origin: "https://evil.example" },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    const listed = await fetch(`${base}/api/email/send`, {
      method: "OPTIONS",
      headers: { origin: "http://localhost:5173" },
    });
    assert.equal(listed.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.notEqual(listed.headers.get("access-control-allow-origin"), "*");
  });
});
