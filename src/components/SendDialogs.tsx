import { useCallback, useState } from "react";
import { sendMessages } from "../lib/messages.ts";
import { isValidEmail } from "../lib/validation.ts";
import { PrimaryButton } from "./PrimaryButton.tsx";
import { SecondaryButton } from "./SecondaryButton.tsx";
import { useDialog } from "./useDialog.ts";

type TestEmailDialogProps = {
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

export function TestEmailDialog({ open, sending, onClose, onSubmit }: TestEmailDialogProps) {
  const close = useCallback(() => {
    if (!sending) onClose();
  }, [onClose, sending]);
  const ref = useDialog(open, close);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"address" | "confirm">("address");
  if (!open) return null;

  const invalid = !isValidEmail(email);
  const error = submitted && invalid ? sendMessages.emailInvalid : undefined;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07182b]/70 p-4 sm:items-center"
      onMouseDown={() => {
        if (!sending) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-email-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="test-email-title" className="font-serif text-2xl text-navy">
          Send Test Email
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          The selected template and current personalized content will be sent to this address.
        </p>
        <form
          className="mt-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (sending) return;
            if (step === "address") {
              setSubmitted(true);
              if (invalid) return;
              setStep("confirm");
              return;
            }
            onSubmit(email.trim());
          }}
        >
          {step === "address" ? (
            <>
              <label htmlFor="test-recipient-email" className="mb-1.5 block text-sm font-semibold text-navy">
                Test recipient email
              </label>
              <input
                id="test-recipient-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                disabled={sending}
                placeholder="you@career-lens.in"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "test-recipient-error" : undefined}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm outline-none focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/15"
                onChange={(event) => setEmail(event.target.value)}
              />
              {error ? (
                <p id="test-recipient-error" role="alert" className="mt-1.5 text-sm text-[#9f1239]">
                  {error}
                </p>
              ) : null}
            </>
          ) : (
            <div>
              <p className="text-sm leading-6 text-muted">Send this test email?</p>
              <p className="mt-3 text-sm text-muted">To</p>
              <p className="font-semibold break-all text-navy">{email.trim()}</p>
              <p className="mt-3 text-sm leading-6 text-ink">This test email will be sent immediately.</p>
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <SecondaryButton
              type="button"
              onClick={() => {
                if (step === "confirm" && !sending) {
                  setStep("address");
                  return;
                }
                onClose();
              }}
              disabled={sending}
            >
              {step === "confirm" ? "Back" : "Cancel"}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={sending}>
              {sending ? "Sending..." : step === "confirm" ? "Send Test" : "Continue"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

type SuccessDialogProps = {
  open: boolean;
  test: boolean;
  sent: number;
  total: number;
  results: { to: string; success: boolean; messageId?: string; error?: { message: string } }[];
  onAnother: () => void;
  onClose: () => void;
};

export function SendSuccessDialog({ open, test, sent, total, results, onAnother, onClose }: SuccessDialogProps) {
  const complete = total > 0 && sent === total;
  const ref = useDialog(open, complete ? onAnother : onClose);
  if (!open) return null;

  const title = test
    ? "Test Email Sent"
    : sent === 0
      ? "No emails were sent."
      : complete
        ? `${sent} of ${total} emails sent successfully.`
        : `${sent} of ${total} emails sent.`;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07182b]/70 p-4 sm:items-center" onMouseDown={complete ? onAnother : onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-success-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="send-success-title" className="font-serif text-2xl text-navy">
          {title}
        </h2>
        <ul className="mt-4 space-y-3">
          {results.map((result) => (
            <li key={result.to} className="text-sm">
              <p className={`font-semibold break-all ${result.success ? "text-teal-deep" : "text-[#9f1239]"}`}>
                {result.success ? "✓" : "✕"} {result.to}
              </p>
              {!result.success && result.error?.message ? (
                <p className="mt-1 text-[#9f1239]">{result.error.message}</p>
              ) : null}
            </li>
          ))}
        </ul>
        {complete && results[0]?.messageId ? (
          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-navy">Technical detail</summary>
            <p className="mt-2 break-all">Message ID: {results[0].messageId}</p>
          </details>
        ) : null}
        <div className="mt-6 flex justify-end">
          {complete ? (
            <PrimaryButton type="button" onClick={onAnother}>
              Send Another Email
            </PrimaryButton>
          ) : (
            <SecondaryButton type="button" onClick={onClose}>
              Back to composer
            </SecondaryButton>
          )}
        </div>
      </div>
    </div>
  );
}

type ErrorDialogProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function SendErrorDialog({ open, message, onClose }: ErrorDialogProps) {
  const ref = useDialog(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07182b]/70 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="send-error-title"
        aria-describedby="send-error-message"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="send-error-title" className="font-serif text-2xl text-navy">
          Email not sent
        </h2>
        <p id="send-error-message" className="mt-3 text-sm leading-6 text-[#9f1239]">
          {message}
        </p>
        <div className="mt-6 flex justify-end">
          <SecondaryButton type="button" onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
