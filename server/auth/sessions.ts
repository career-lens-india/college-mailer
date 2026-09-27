import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "careerlens_session";
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

export type SessionStore = {
  create(): string;
  has(id: string): boolean;
  destroy(id: string): void;
};

export function createSignedSessionStore(
  secret: string,
  options?: { ttlMs?: number; now?: () => number },
): SessionStore {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = options?.now ?? Date.now;

  function sign(payload: string): string {
    return createHmac("sha256", secret).update(payload).digest("base64url");
  }

  return {
    create() {
      const exp = now() + ttlMs;
      const nonce = randomBytes(16).toString("base64url");
      const payload = `${exp}.${nonce}`;
      return `${payload}.${sign(payload)}`;
    },
    has(id: string) {
      const parts = id.split(".");
      if (parts.length !== 3) return false;
      const [expText, nonce, mac] = parts;
      if (!expText || !nonce || !mac) return false;
      const expected = sign(`${expText}.${nonce}`);
      const actual = Buffer.from(mac);
      const valid = Buffer.from(expected);
      if (actual.length !== valid.length || !timingSafeEqual(actual, valid)) return false;
      const exp = Number(expText);
      return Number.isFinite(exp) && now() <= exp;
    },
    destroy(id: string) {
      void id;
    },
  };
}

export function createSessionStore(options?: { ttlMs?: number; now?: () => number }): SessionStore {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = options?.now ?? Date.now;
  const sessions = new Map<string, number>();

  return {
    create() {
      const id = randomBytes(32).toString("hex");
      sessions.set(id, now());
      return id;
    },
    has(id: string) {
      const created = sessions.get(id);
      if (created === undefined) return false;
      if (now() - created > ttlMs) {
        sessions.delete(id);
        return false;
      }
      return true;
    },
    destroy(id: string) {
      sessions.delete(id);
    },
  };
}

export function readSessionId(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== SESSION_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function sessionCookie(id: string, secure: boolean): string {
  return cookieValue(encodeURIComponent(id), secure, false);
}

export function clearedSessionCookie(secure: boolean): string {
  return cookieValue("", secure, true);
}

function cookieValue(value: string, secure: boolean, clear: boolean): string {
  const parts = [`${SESSION_COOKIE}=${value}`, "HttpOnly", "SameSite=Lax", "Path=/"];
  if (clear) parts.push("Max-Age=0");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
