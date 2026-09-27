import { sendMessages } from "./messages.ts";

export class AuthError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export async function fetchSession(): Promise<boolean> {
  const response = await fetch(`${apiBase()}/api/auth/session`, {
    credentials: "include",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return false;
  const body: unknown = await response.json();
  return typeof body === "object" && body !== null && (body as { authenticated?: unknown }).authenticated === true;
}

export async function login(passcode: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ passcode }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AuthError("NETWORK_ERROR", sendMessages.network);
  }

  if (response.ok) return;

  let message: string = sendMessages.signInUnreachable;
  let code = "NETWORK_ERROR";
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { error?: { code?: unknown; message?: unknown } }).error?.message === "string" &&
      typeof (body as { error?: { code?: unknown } }).error?.code === "string"
    ) {
      code = (body as { error: { code: string; message: string } }).error.code;
      message = (body as { error: { code: string; message: string } }).error.message;
    }
  } catch {
    message = sendMessages.signInUnreachable;
  }
  throw new AuthError(code, message);
}

export async function logout(): Promise<void> {
  await fetch(`${apiBase()}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.timeout(10_000),
  });
}
