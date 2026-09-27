import type { NextFunction, Request, Response } from "express";
import { sendMessages } from "../../src/lib/messages.ts";
import { isAppError } from "../errors.ts";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "That request could not be found.",
    },
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
    console.error(`API ${error.status} ${error.code}: ${error.message}`);
    res.status(error.status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const parseError = error as { type?: string; status?: number; message?: string };
  if (parseError.type === "entity.parse.failed" || parseError.status === 400) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: sendMessages.invalidRequest,
      },
    });
    return;
  }

  console.error("Unhandled server error", error instanceof Error ? error.name : "unknown");
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: sendMessages.tryAgain,
    },
  });
}
