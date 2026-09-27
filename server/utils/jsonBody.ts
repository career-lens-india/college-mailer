import type { NextFunction, Request, Response } from "express";
import { sendMessages } from "../../src/lib/messages.ts";

const LIMIT = 32 * 1024;

export function preparedJsonBody(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    const text = value.toString("utf8");
    return text ? JSON.parse(text) : {};
  }
  if (typeof value === "string") return value ? JSON.parse(value) : {};
  if (value && typeof value === "object") return value;
  return undefined;
}

function collect(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > LIMIT) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function readJsonBody(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const finish = (body: unknown) => {
    req.body = body;
    next();
  };

  if ("body" in req) {
    try {
      const prepared = preparedJsonBody(req.body);
      if (prepared !== undefined) {
        finish(prepared);
        return;
      }
    } catch {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: sendMessages.invalidRequest },
      });
      return;
    }
  }

  if (req.readableEnded) {
    finish({});
    return;
  }

  void collect(req)
    .then((text) => {
      finish(text ? JSON.parse(text) : {});
    })
    .catch(() => {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: sendMessages.invalidRequest },
      });
    });
}
