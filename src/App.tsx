import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./components/AppShell.tsx";
import { BrandingControls } from "./components/BrandingControls.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog.tsx";
import { CustomFields } from "./components/CustomFields.tsx";
import { LivePreview } from "./components/LivePreview.tsx";
import { PreviewBoundary } from "./components/PreviewBoundary.tsx";
import { OutreachForm } from "./components/OutreachForm.tsx";
import { PrimaryButton } from "./components/PrimaryButton.tsx";
import { ReadinessIndicator } from "./components/ReadinessIndicator.tsx";
import { SecondaryButton } from "./components/SecondaryButton.tsx";
import { PasscodeScreen } from "./components/PasscodeScreen.tsx";
import { SendErrorDialog, SendSuccessDialog, TestEmailDialog } from "./components/SendDialogs.tsx";
import { TemplateContentEditor } from "./components/TemplateContentEditor.tsx";
import { TemplateRefreshOverlay } from "./components/TemplateRefreshOverlay.tsx";
import { TemplateSelector } from "./components/TemplateSelector.tsx";
import { EmailApiError, sendEmail, sendTestEmail, type SendEmailResponse } from "./lib/api.ts";
import { fetchSession, logout } from "./lib/auth.ts";
import { clearStoredDraft, defaultDraft, draftForAnotherEmail, loadDraft, saveDraft } from "./lib/draftStorage.ts";
import { commitTemplateSwitch, consumeTemplateSwitchRefresh } from "./lib/templateSwitch.ts";
import { useDesktopSplit } from "./lib/useDesktopSplit.ts";
import { mergeTemplateContent } from "./lib/templateContent.ts";
import { parseRecipientList } from "./lib/recipients.ts";
import { contentErrors, hasErrors, validateOutreach } from "./lib/validation.ts";
import { templateName } from "./templates/registry.ts";
import type { EmailTemplateData, OutreachDraft } from "./types/outreach.ts";

const focusOrder = [
  { id: "recipient-email", field: "recipientEmail" },
  { id: "college-name", field: "collegeName" },
  { id: "department", field: "department" },
  { id: "custom-subject", field: "customSubject" },
  { id: "custom-message", field: "customMessage" },
] as const;

function toTemplateData(draft: OutreachDraft): EmailTemplateData {
  return {
    recipientName: draft.recipientName.trim() || undefined,
    designation: draft.designation.trim() || undefined,
    collegeName: draft.collegeName.trim(),
    department: draft.department.trim(),
    sessionInterest: draft.sessionInterest,
    placementOutreach: draft.placementOutreach,
    customSubject: draft.customSubject,
    customMessage: draft.customMessage,
    branding: draft.branding,
    content: activeContent(draft),
  };
}

function activeContent(draft: OutreachDraft): Record<string, string> | undefined {
  if (draft.selectedTemplate === "professional") return { ...draft.professionalContent };
  if (draft.selectedTemplate === "modern") return { ...draft.modernContent };
  if (draft.selectedTemplate === "minimal") return { ...draft.minimalContent };
  if (draft.selectedTemplate === "newsletter") return { ...draft.newsletterContent };
  return undefined;
}

function sameDraft(left: OutreachDraft, right: OutreachDraft): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function Mailer({ onLogout }: { onLogout: () => void }) {
  const [draft, setDraft] = useState<OutreachDraft>(() => loadDraft());
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof OutreachDraft, boolean>>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "just-now" | "saved">("idle");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testSession, setTestSession] = useState(0);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<(SendEmailResponse & { test: boolean }) | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [templateRefresh, setTemplateRefresh] = useState(false);
  const sendingRef = useRef(false);
  const templateRefreshStarted = useRef(false);
  const desktopSplit = useDesktopSplit();

  useEffect(() => {
    consumeTemplateSwitchRefresh(window.sessionStorage);
  }, []);

  useEffect(() => {
    if (sameDraft(draft, defaultDraft)) {
      clearStoredDraft();
      const idle = window.setTimeout(() => setSaveState("idle"), 0);
      return () => window.clearTimeout(idle);
    }
    saveDraft(draft);
    const saving = window.setTimeout(() => setSaveState("saving"), 0);
    const justNow = window.setTimeout(() => setSaveState("just-now"), 200);
    const saved = window.setTimeout(() => setSaveState("saved"), 8000);
    return () => {
      window.clearTimeout(saving);
      window.clearTimeout(justNow);
      window.clearTimeout(saved);
    };
  }, [draft]);

  const errors = useMemo(() => validateOutreach(draft), [draft]);
  const templateData = useMemo(() => toTemplateData(draft), [draft]);
  const recipients = useMemo(() => parseRecipientList(draft.recipientEmail).recipients, [draft.recipientEmail]);
  const formValid = !hasErrors(errors);
  const testReady = !contentErrors(errors);

  const update = useCallback(<K extends keyof OutreachDraft>(key: K, value: OutreachDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const touch = useCallback((key: keyof OutreachDraft) => {
    setTouched((current) => ({ ...current, [key]: true }));
  }, []);

  const selectTemplate = useCallback((selectedTemplate: OutreachDraft["selectedTemplate"]) => {
    const outcome = commitTemplateSwitch(draft, selectedTemplate, desktopSplit, window.sessionStorage);
    if (outcome.action === "ignore") return;
    if (outcome.action === "live") {
      setDraft(outcome.draft);
      return;
    }
    if (templateRefreshStarted.current) return;
    templateRefreshStarted.current = true;
    setTemplateRefresh(true);
    window.requestAnimationFrame(() => {
      window.setTimeout(() => window.location.reload(), 650);
    });
  }, [desktopSplit, draft]);

  const closeConfirm = useCallback(() => setConfirmClear(false), []);
  const closeSendConfirm = useCallback(() => {
    if (!sendingRef.current) setConfirmSend(false);
  }, []);
  const closeTest = useCallback(() => {
    if (!sendingRef.current) setTestOpen(false);
  }, []);
  const closeError = useCallback(() => setSendError(null), []);

  const requestFromDraft = useCallback(
    (to: string) => ({
      to,
      recipientName: draft.recipientName.trim() || undefined,
      designation: draft.designation.trim() || undefined,
      collegeName: draft.collegeName.trim(),
      department: draft.department.trim(),
      placementOutreach: draft.placementOutreach,
      sessionInterest: draft.sessionInterest,
      template: draft.selectedTemplate,
      customSubject: draft.selectedTemplate === "custom" ? draft.customSubject.trim() : undefined,
      customMessage: draft.selectedTemplate === "custom" ? draft.customMessage : undefined,
      branding: draft.selectedTemplate === "custom" ? draft.branding : undefined,
      content: activeContent(draft),
    }),
    [draft],
  );

  const performSend = useCallback(
    async (to: string, test: boolean) => {
      if (sendingRef.current) return;
      if (test ? !testReady : !formValid) return;
      sendingRef.current = true;
      setSending(true);
      try {
        const response = test ? await sendTestEmail(requestFromDraft(to)) : await sendEmail(requestFromDraft(to));
        setConfirmSend(false);
        setTestOpen(false);
        setOutcome({ ...response, test });
      } catch (error) {
        const message =
          error instanceof EmailApiError
            ? error.message
            : "Unable to send the email. Please check your connection and try again.";
        setConfirmSend(false);
        setTestOpen(false);
        setSendError(message);
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [formValid, requestFromDraft, testReady],
  );

  const finishSuccess = useCallback(() => {
    setOutcome(null);
    setSubmitted(false);
    setTouched({});
    setDraft((current) => draftForAnotherEmail(current));
  }, []);

  const focusFirstError = () => {
    const target = focusOrder.find((item) => errors[item.field]);
    if (target) document.getElementById(target.id)?.focus();
  };

  const clearDraft = () => {
    clearStoredDraft();
    setDraft(draftForAnotherEmail(defaultDraft));
    setSubmitted(false);
    setTouched({});
    setConfirmClear(false);
  };

  const saveLabel =
    saveState === "saving" ? "Saving..." : saveState === "just-now" ? "✓ Saved just now" : saveState === "saved" ? "✓ Saved" : "";

  return (
    <AppShell workspace onLogout={onLogout}>
      {templateRefresh ? <TemplateRefreshOverlay /> : null}
      <form
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (!formValid) {
            focusFirstError();
            return;
          }
          setConfirmSend(true);
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 lg:grid lg:h-full lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden">
          <div data-composer-scroll className="composer-scroll lg:pr-1">
            <div className="order-1 space-y-6 lg:order-none">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">Industry × Academia</p>
              <h1 className="mt-2 font-serif text-4xl leading-tight text-navy">College Outreach</h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                Compose the letter here. The preview stays in view.
              </p>
            </div>
            <OutreachForm
              draft={draft}
              errors={errors}
              submitted={submitted}
              touched={touched}
              onChange={update}
              onTouch={touch}
            />
            <TemplateSelector selectedTemplate={draft.selectedTemplate} onSelect={selectTemplate} />
            {draft.selectedTemplate === "custom" ? (
              <>
                <CustomFields
                  draft={draft}
                  errors={errors}
                  submitted={submitted}
                  touched={touched}
                  onChange={update}
                  onTouch={touch}
                />
                <BrandingControls branding={draft.branding} onChange={(branding) => update("branding", branding)} />
              </>
            ) : (
              <TemplateContentEditor
                template={draft.selectedTemplate}
                content={activeContent(draft) ?? {}}
                onChange={(next) => {
                  setDraft((current) => {
                    if (current.selectedTemplate === "professional") {
                      return { ...current, professionalContent: mergeTemplateContent("professional", next) };
                    }
                    if (current.selectedTemplate === "modern") {
                      return { ...current, modernContent: mergeTemplateContent("modern", next) };
                    }
                    if (current.selectedTemplate === "minimal") {
                      return { ...current, minimalContent: mergeTemplateContent("minimal", next) };
                    }
                    if (current.selectedTemplate === "newsletter") {
                      return { ...current, newsletterContent: mergeTemplateContent("newsletter", next) };
                    }
                    return current;
                  });
                }}
              />
            )}
            <ReadinessIndicator draft={draft} errors={errors} ready={formValid} />
            <p aria-live="polite" className="min-h-5 text-xs font-semibold text-muted">
              {saveLabel}
            </p>
            </div>

            <div className="order-3 mt-6 lg:order-none">
            {submitted && hasErrors(errors) ? (
              <div role="alert" className="mb-4 rounded-2xl border border-[#f3c3cf] bg-[#fff5f7] px-4 py-3 text-sm text-[#9f1239]">
                Complete the required details before sending.
              </div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SecondaryButton type="button" onClick={() => setConfirmClear(true)} disabled={sending}>
                Clear Draft
              </SecondaryButton>
              <SecondaryButton
                id="send-test"
                type="button"
                disabled={!testReady || sending}
                onClick={() => {
                  setSubmitted(true);
                  if (!testReady) {
                    focusFirstError();
                    return;
                  }
                  setTestSession((value) => value + 1);
                  setTestOpen(true);
                }}
              >
                {sending ? "Sending..." : "Send Test Email"}
              </SecondaryButton>
              <PrimaryButton id="send-email" type="submit" disabled={!formValid || sending}>
                {sending ? "Sending..." : "Send Email"}
              </PrimaryButton>
            </div>
            </div>
          </div>

          <div className="order-2 min-h-0 lg:order-none lg:col-start-2 lg:row-start-1 lg:overflow-hidden">
            <PreviewBoundary resetKey={draft.selectedTemplate}>
              <LivePreview draft={draft} data={templateData} />
            </PreviewBoundary>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmClear}
        title="Clear this draft?"
        confirmLabel="Clear Draft"
        onConfirm={clearDraft}
        onClose={closeConfirm}
      >
        All currently entered information will be removed.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmSend}
        title="Send this email?"
        cancelLabel="Cancel"
        confirmLabel={sending ? "Sending..." : "Send Email"}
        confirmVariant="primary"
        confirmDisabled={sending}
        cancelDisabled={sending}
        onConfirm={() => void performSend(draft.recipientEmail, false)}
        onClose={closeSendConfirm}
      >
        <p>
          This will send {recipients.length} separate {recipients.length === 1 ? "email" : "emails"}. Recipients will
          not see each other.
        </p>
        <ul className="mt-3 space-y-1">
          {recipients.map((email) => (
            <li key={email} className="font-semibold break-all text-navy">
              {email}
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2">
          <div>
            <dt>College</dt>
            <dd className="font-semibold break-words text-navy">{draft.collegeName.trim()}</dd>
          </div>
          {draft.department.trim() ? (
            <div>
              <dt>Department</dt>
              <dd className="font-semibold break-words text-navy">{draft.department.trim()}</dd>
            </div>
          ) : null}
          <div>
            <dt>{draft.placementOutreach ? "Placement" : "Audience"}</dt>
            <dd className="font-semibold text-navy">
              {draft.placementOutreach ? "Placement Department" : draft.department.trim() ? "Department" : "General college"}
            </dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd className="font-semibold text-navy">{templateName(draft.selectedTemplate)}</dd>
          </div>
        </dl>
        <p className="mt-3">This email will be sent immediately.</p>
      </ConfirmDialog>
      <TestEmailDialog
        key={testSession}
        open={testOpen}
        sending={sending}
        onClose={closeTest}
        onSubmit={(email) => void performSend(email, true)}
      />
      <SendSuccessDialog
        open={outcome !== null}
        test={outcome?.test ?? false}
        sent={outcome?.sent ?? 0}
        total={outcome?.total ?? 0}
        results={outcome?.results ?? []}
        onAnother={finishSuccess}
        onClose={() => setOutcome(null)}
      />
      <SendErrorDialog open={sendError !== null} message={sendError ?? ""} onClose={closeError} />
    </AppShell>
  );
}

export function App() {
  const [session, setSession] = useState<"checking" | "ready" | "locked">("checking");

  useEffect(() => {
    let cancelled = false;
    fetchSession()
      .then((authenticated) => {
        if (!cancelled) setSession(authenticated ? "ready" : "locked");
      })
      .catch(() => {
        if (!cancelled) setSession("locked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (session === "checking") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <p className="text-sm font-semibold text-navy">Opening CareerLens...</p>
      </div>
    );
  }

  if (session === "locked") {
    return <PasscodeScreen onSuccess={() => setSession("ready")} />;
  }

  return (
    <div className="workspace-root fade-in">
      <Mailer
        onLogout={() => {
          void logout().finally(() => setSession("locked"));
        }}
      />
    </div>
  );
}
