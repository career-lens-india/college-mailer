import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionStore, createSignedSessionStore } from "./auth/sessions.ts";
import { dailyPasscode, passcodeMatches } from "./utils/passcode.ts";

describe("daily passcode", () => {
  it("formats a date as DDMMYYYY in India", () => {
    assert.equal(dailyPasscode(new Date("2026-09-27T06:30:00.000Z")), "27092026");
  });

  it("changes at midnight India time, not UTC midnight", () => {
    assert.equal(dailyPasscode(new Date("2026-09-27T18:29:59.000Z")), "27092026");
    assert.equal(dailyPasscode(new Date("2026-09-27T18:30:00.000Z")), "28092026");
  });

  it("pads a single-digit day and month", () => {
    assert.equal(dailyPasscode(new Date("2025-12-31T18:30:00.000Z")), "01012026");
    assert.equal(dailyPasscode(new Date("2026-03-09T04:30:00.000Z")), "09032026");
  });

  it("accepts only the exact passcode", () => {
    assert.equal(passcodeMatches("27092026", "27092026"), true);
    assert.equal(passcodeMatches("27092027", "27092026"), false);
    assert.equal(passcodeMatches("2709202", "27092026"), false);
    assert.equal(passcodeMatches("", "27092026"), false);
  });
});

describe("session store", () => {
  it("creates a session and forgets it after logout or expiry", () => {
    let now = 1_000;
    const sessions = createSessionStore({ ttlMs: 500, now: () => now });
    const id = sessions.create();
    assert.equal(sessions.has(id), true);
    sessions.destroy(id);
    assert.equal(sessions.has(id), false);

    const next = sessions.create();
    now = 1_600;
    assert.equal(sessions.has(next), false);
  });

  it("accepts a signed session on another store with the same secret", () => {
    let now = 1_000;
    const issued = createSignedSessionStore("same-secret", { ttlMs: 500, now: () => now });
    const checked = createSignedSessionStore("same-secret", { ttlMs: 500, now: () => now });
    const other = createSignedSessionStore("other-secret", { ttlMs: 500, now: () => now });
    const token = issued.create();
    assert.equal(checked.has(token), true);
    assert.equal(other.has(token), false);
    assert.equal(checked.has(`${token}x`), false);
    now = 1_600;
    assert.equal(checked.has(token), false);
  });
});
