import { useState } from "react";
import { appImages } from "../brand/assets.ts";
import { AuthError, login } from "../lib/auth.ts";
import { sendMessages } from "../lib/messages.ts";
import { passcodeDigits, passcodePlaceholder } from "../lib/passcodeCopy.ts";

type PasscodeScreenProps = {
  onSuccess: () => void;
};

export function PasscodeScreen({ onSuccess }: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fade-in grid min-h-screen place-items-center px-4">
      <form
        className="w-full max-w-sm rounded-3xl border border-line bg-white px-8 py-10 text-center shadow-[0_24px_60px_-36px_rgba(12,35,64,0.45)]"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          setError(null);
          void login(passcode.trim())
            .then(() => onSuccess())
            .catch((reason: unknown) => {
              setError(reason instanceof AuthError ? reason.message : sendMessages.passcodeIncorrect);
              setSubmitting(false);
            });
        }}
      >
        <img src={appImages.markUrl} alt="" width={48} height={55} className="mx-auto h-12 w-auto" />
        <p className="mt-4 font-serif text-3xl text-navy">CareerLens</p>
        <h1 className="mt-2 text-base font-semibold text-ink">College Outreach</h1>
        <label htmlFor="daily-passcode" className="mt-8 block text-sm font-semibold text-navy">
          Enter today's passcode
        </label>
        <input
          id="daily-passcode"
          name="passcode"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={8}
          spellCheck={false}
          placeholder={passcodePlaceholder}
          value={passcode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "passcode-error" : undefined}
          disabled={submitting}
          className="mt-3 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-center text-[15px] tracking-[0.2em] text-ink shadow-sm outline-none focus-visible:border-teal focus-visible:ring-4 focus-visible:ring-teal/15"
          onChange={(event) => setPasscode(passcodeDigits(event.target.value))}
        />
        {error ? (
          <p id="passcode-error" role="alert" className="mt-3 text-sm text-[#9f1239]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Entering..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
