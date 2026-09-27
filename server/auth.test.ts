import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { createApp } from "./app.ts";
import { sendMessages } from "../src/lib/messages.ts";
import { createRateLimiter } from "./utils/rateLimit.ts";

const fixedNow = () => new Date("2026-09-27T06:30:00.000Z");
const passcode = "27092026";

const payload = {
  to: "hod@example.edu",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE",
  template: "modern",
};

async function listen(app: ReturnType<typeof createApp>): Promise<{ server: Server; base: string }> {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP port");
  return { server, base: `http://127.0.0.1:${address.port}` };
}

function cookiePair(response: Response): string {
  const raw = response.headers.getSetCookie?.()[0] ?? response.headers.get("set-cookie") ?? "";
  return raw.split(";")[0] ?? "";
}

describe("daily passcode login", () => {
  let server: Server;
  let base = "";
  let sends = 0;

  before(async () => {
    const app = createApp({
      providerName: "smtp",
      allowedOrigins: ["http://localhost:5173"],
      now: fixedNow,
      secureCookies: true,
      send: async () => {
        sends += 1;
        return { sent: 1, total: 1, results: [{ to: payload.to, success: true, messageId: "auth-1" }] };
      },
    });
    const running = await listen(app);
    server = running.server;
    base = running.base;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("rejects an incorrect passcode without revealing the expected value", async () => {
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: "01012000" }),
    });
    const body = await response.json();
    const serialized = JSON.stringify(body);
    assert.equal(response.status, 401);
    assert.equal(body.error.code, "AUTH_FAILED");
    assert.equal(body.error.message, sendMessages.passcodeIncorrect);
    assert.equal(serialized.includes(passcode), false);
    assert.equal(response.headers.get("set-cookie"), null);
  });

  it("creates an HTTP-only session for the correct passcode", async () => {
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(JSON.stringify(body).includes(passcode), false);
    assert.match(setCookie, /careerlens_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Secure/i);
    assert.equal(setCookie.includes(passcode), false);

    const session = await fetch(`${base}/api/auth/session`, {
      headers: { cookie: cookiePair(response) },
    });
    const sessionBody = await session.json();
    assert.deepEqual(sessionBody, { authenticated: true });
    assert.equal(JSON.stringify(sessionBody).includes(passcode), false);
  });

  it("rejects email sending without a session and allows it with one", async () => {
    const beforeSends = sends;
    const denied = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, test: true }),
    });
    const deniedBody = await denied.json();
    assert.equal(denied.status, 401);
    assert.equal(deniedBody.error.code, "UNAUTHORIZED");
    assert.equal(sends, beforeSends);

    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const allowed = await fetch(`${base}/api/email/send`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookiePair(login) },
      body: JSON.stringify(payload),
    });
    assert.equal(allowed.status, 200);
    assert.equal(sends, beforeSends + 1);
  });

  it("forgets the session on logout", async () => {
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const cookie = cookiePair(login);
    const logout = await fetch(`${base}/api/auth/logout`, {
      method: "POST",
      headers: { cookie },
    });
    const cleared = logout.headers.get("set-cookie") ?? "";
    assert.match(cleared, /Max-Age=0/i);
    const session = await fetch(`${base}/api/auth/session`, { headers: { cookie } });
    const body = await session.json();
    assert.deepEqual(body, { authenticated: false });
  });
});

describe("login rate limit", () => {
  it("slows repeated login attempts", async () => {
    const app = createApp({
      providerName: "smtp",
      allowedOrigins: [],
      now: fixedNow,
      loginRateLimiter: createRateLimiter({ windowMs: 60_000, max: 2 }),
      send: async () => ({ sent: 0, total: 0, results: [] }),
    });
    const running = await listen(app);
    try {
      const post = (value: string) =>
        fetch(`${running.base}/api/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ passcode: value }),
        });
      assert.equal((await post("00000000")).status, 401);
      assert.equal((await post("00000000")).status, 401);
      const limited = await post(passcode);
      const body = await limited.json();
      assert.equal(limited.status, 429);
      assert.equal(body.error.code, "RATE_LIMITED");
      assert.equal(body.error.message, sendMessages.loginRateLimited);
      assert.equal(JSON.stringify(body).includes(passcode), false);
    } finally {
      await new Promise<void>((resolve, reject) => {
        running.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
