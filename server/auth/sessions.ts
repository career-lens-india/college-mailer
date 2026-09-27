import { randomBytes } from "node:crypto";

export const SESSION_COOKIE = "careerlens_session";
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

export type SessionStore = {
  create(): string;
  has(id: string): boolean;
  destroy(id: string): void;
};

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
