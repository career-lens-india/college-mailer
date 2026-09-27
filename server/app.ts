import express, { type Express, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendMessages } from "../src/lib/messages.ts";
import {
  clearedSessionCookie,
  createSessionStore,
  createSignedSessionStore,
  readSessionId,
  sessionCookie,
  type SessionStore,
} from "./auth/sessions.ts";
import { errorHandler, notFound } from "./middleware/errors.ts";
import type { EmailProvider } from "./services/providers/types.ts";
import { deliverOutreach, type DeliveryResult } from "./services/emailService.ts";
import { dailyPasscode, passcodeMatches } from "./utils/passcode.ts";
import { readJsonBody } from "./utils/jsonBody.ts";
import { createRateLimiter, type RateLimiter } from "./utils/rateLimit.ts";
import { validateSendRequest, type ValidatedOutreach } from "./utils/validateSendRequest.ts";

export type MailerAppOptions = {
  providerName: string;
  send: (input: ValidatedOutreach) => Promise<DeliveryResult>;
  allowedOrigins: string[];
  trustProxy?: boolean;
  assetsDir?: string;
  clientDir?: string;
  rateLimiter?: RateLimiter;
  loginRateLimiter?: RateLimiter;
  sessions?: SessionStore;
  now?: () => Date;
  secureCookies?: boolean;
  signInDisabled?: boolean;
};

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function enteredPasscode(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const value = (body as { passcode?: unknown }).passcode;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return "";
}

function indiaDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function createApp(options: MailerAppOptions): Express {
  const app = express();
  const inFlight = new Set<string>();
  app.disable("x-powered-by");
  if (options.trustProxy) app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const origin = req.header("origin");
    if (origin && options.allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(readJsonBody);

  if (options.assetsDir) {
    app.use("/assets", express.static(options.assetsDir, { index: false }));
  }

  const health = (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      provider: options.providerName,
    });
  };
  app.get("/health", health);
  app.get("/api/health", health);

  const limiter = options.rateLimiter ?? createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8 });
  const loginLimiter = options.loginRateLimiter ?? createRateLimiter({ windowMs: 5 * 60 * 1000, max: 5 });
  const sessions = options.sessions ?? createSessionStore();
  const now = options.now ?? (() => new Date());
  const secureCookies = options.secureCookies === true;

  function currentSession(req: Request): string | undefined {
    const id = readSessionId(req.header("cookie"));
    if (!id || !sessions.has(id)) return undefined;
    return id;
  }

  function requireSession(req: Request, res: Response): boolean {
    if (currentSession(req)) return true;
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: sendMessages.unauthorized,
      },
    });
    return false;
  }

  app.post("/api/auth/login", (req, res) => {
    if (options.signInDisabled) {
      res.status(503).json({
        success: false,
        error: {
          code: "AUTH_UNAVAILABLE",
          message: sendMessages.signInUnavailable,
        },
      });
      return;
    }

    if (!loginLimiter.allow(`login:${clientKey(req)}`)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: sendMessages.loginRateLimited,
        },
      });
      return;
    }

    console.log(`Login request ${req.method} ${req.path}`);
    const passcode = enteredPasscode(req.body);
    const expected = dailyPasscode(now());
    if (!/^\d{8}$/.test(passcode) || !passcodeMatches(passcode, expected)) {
      console.error(`Login rejected. passcodeLength=${passcode.length} indiaDate=${indiaDateLabel(now())}`);
      res.status(401).json({
        success: false,
        error: {
          code: "AUTH_FAILED",
          message: sendMessages.passcodeIncorrect,
        },
      });
      return;
    }

    const id = sessions.create();
    res.setHeader("Set-Cookie", sessionCookie(id, secureCookies));
    res.json({ success: true });
  });

  app.get("/api/auth/session", (req, res) => {
    res.json({ authenticated: Boolean(currentSession(req)) });
  });

  app.post("/api/auth/logout", (req, res) => {
    const id = readSessionId(req.header("cookie"));
    if (id) sessions.destroy(id);
    res.setHeader("Set-Cookie", clearedSessionCookie(secureCookies));
    res.json({ success: true });
  });

  app.post("/api/email/send", async (req, res, next) => {
    if (!requireSession(req, res)) return;
    const parsed = validateSendRequest(req.body);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message,
        },
      });
      return;
    }

    const key = clientKey(req);
    if (!limiter.allow(key)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: sendMessages.rateLimited,
        },
      });
      return;
    }

    const flightKey = `${key}:${parsed.value.test ? "test" : "live"}:${parsed.value.recipients.join(",")}:${parsed.value.template}`;
    if (inFlight.has(flightKey)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: sendMessages.rateLimited,
        },
      });
      return;
    }

    inFlight.add(flightKey);
    try {
      const result = await options.send(parsed.value);
      const success = result.sent === result.total && result.total > 0;
      res.json({
        success,
        sent: result.sent,
        total: result.total,
        results: result.results,
        ...(success && result.messageId ? { messageId: result.messageId } : {}),
      });
    } catch (error) {
      next(error);
    } finally {
      inFlight.delete(flightKey);
    }
  });

  if (options.clientDir) {
    const clientDir = options.clientDir;
    app.use(express.static(clientDir, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      if (req.path.startsWith("/api/") || req.path === "/health" || req.path.startsWith("/assets/")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDir, "index.html"), (error) => {
        if (error) next();
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export function createProductionApp(input: {
  provider: EmailProvider;
  providerName: string;
  allowedOrigins: string[];
  trustProxy: boolean;
  assetBaseUrl?: string;
  nodeEnv: string;
  websiteUrl?: string;
  campusImpactUrl?: string;
  sessionSecret?: string;
  requirePersistentSession?: boolean;
  beforeSend?: (outreach: ValidatedOutreach) => {
    provider: EmailProvider;
    assetBaseUrl?: string;
    nodeEnv: string;
    websiteUrl?: string;
    campusImpactUrl?: string;
  };
}): Express {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const clientIndex = path.join(root, "dist", "index.html");
  const sessionSecret = input.sessionSecret?.trim() ?? "";
  if (input.requirePersistentSession && !sessionSecret) {
    console.error("SESSION_SECRET is missing. Passcode login will not persist on Vercel.");
  }
  return createApp({
    providerName: input.providerName,
    allowedOrigins: input.allowedOrigins,
    trustProxy: input.trustProxy,
    secureCookies: input.nodeEnv === "production",
    signInDisabled: input.requirePersistentSession === true && !sessionSecret,
    sessions: sessionSecret ? createSignedSessionStore(sessionSecret) : createSessionStore(),
    assetsDir: path.join(root, "public", "assets"),
    clientDir: input.nodeEnv === "production" && fs.existsSync(clientIndex) ? path.join(root, "dist") : undefined,
    send: (outreach) => {
      const delivery = input.beforeSend?.(outreach) ?? {
        provider: input.provider,
        assetBaseUrl: input.assetBaseUrl,
        nodeEnv: input.nodeEnv,
        websiteUrl: input.websiteUrl,
        campusImpactUrl: input.campusImpactUrl,
      };
      return deliverOutreach(outreach, delivery);
    },
  });
}
