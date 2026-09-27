import { parseRecipientList } from "../lib/recipients.ts";
import { SESSION_INTERESTS, type FieldErrors, type OutreachDraft } from "../types/outreach.ts";
import { FormField } from "./FormField.tsx";

type OutreachFormProps = {
  draft: OutreachDraft;
  errors: FieldErrors;
  submitted: boolean;
  touched: Partial<Record<keyof OutreachDraft, boolean>>;
  onChange: <K extends keyof OutreachDraft>(key: K, value: OutreachDraft[K]) => void;
  onTouch: (key: keyof OutreachDraft) => void;
};

const controlClass =
  "w-full scroll-mt-28 rounded-xl border bg-white px-3.5 py-3 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:ring-4";

function controlClasses(invalid: boolean): string {
  return invalid
    ? `${controlClass} border-[#e11d48] focus-visible:border-[#e11d48] focus-visible:ring-[#e11d48]/15`
    : `${controlClass} border-line focus-visible:border-teal focus-visible:ring-teal/15`;
}

export function OutreachForm({ draft, errors, submitted, touched, onChange, onTouch }: OutreachFormProps) {
  const visible = (field: keyof FieldErrors) => (submitted || touched[field] ? errors[field] : undefined);

  const emailError = visible("recipientEmail");
  const nameError = visible("recipientName");
  const designationError = visible("designation");
  const collegeError = visible("collegeName");
  const departmentError = visible("department");

  return (
    <section aria-labelledby="recipient-heading" className="rounded-3xl border border-line bg-white p-6 shadow-[0_24px_60px_-36px_rgba(12,35,64,0.45)] sm:p-8">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-teal uppercase">Create Email</p>
      <h2 id="recipient-heading" className="mt-2 font-serif text-2xl text-navy">
        Recipient Details
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        These details personalize the letter. Empty optional fields stay out of the wording.
      </p>

      <div className="mt-6 grid gap-5">
        <FormField
          id="recipient-email"
          label="Recipient Email"
          required
          error={emailError}
          hint="Enter multiple email addresses separated by commas."
        >
          <input
            id="recipient-email"
            name="recipientEmail"
            type="text"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="arun@example.com, placement@college.ac.in"
            value={draft.recipientEmail}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "recipient-email-error recipient-count" : "recipient-email-hint recipient-count"}
            className={controlClasses(Boolean(emailError))}
            onChange={(event) => onChange("recipientEmail", event.target.value)}
            onBlur={() => {
              const parsed = parseRecipientList(draft.recipientEmail);
              const next =
                parsed.invalid.length === 0 && parsed.recipients.length > 0
                  ? parsed.recipients.join(", ")
                  : draft.recipientEmail.trim();
              onChange("recipientEmail", next);
              onTouch("recipientEmail");
            }}
          />
          <RecipientCount email={draft.recipientEmail} invalid={Boolean(emailError)} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="recipient-name" label="Recipient Name" hint="Leave blank to open with Dear Sir/Madam." error={nameError}>
            <input
              id="recipient-name"
              name="recipientName"
              type="text"
              autoComplete="name"
              placeholder="Dr. XYZ"
              value={draft.recipientName}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "recipient-name-error" : "recipient-name-hint"}
              className={controlClasses(Boolean(nameError))}
              onChange={(event) => onChange("recipientName", event.target.value)}
              onBlur={() => {
                onChange("recipientName", draft.recipientName.trim());
                onTouch("recipientName");
              }}
            />
          </FormField>
          <FormField id="designation" label="Designation" hint="Shown under the salutation when provided." error={designationError}>
            <input
              id="designation"
              name="designation"
              type="text"
              autoComplete="organization-title"
              placeholder="HOD / TPO / Dean / Principal"
              value={draft.designation}
              aria-invalid={designationError ? true : undefined}
              aria-describedby={designationError ? "designation-error" : "designation-hint"}
              className={controlClasses(Boolean(designationError))}
              onChange={(event) => onChange("designation", event.target.value)}
              onBlur={() => {
                onChange("designation", draft.designation.trim());
                onTouch("designation");
              }}
            />
          </FormField>
        </div>

        <FormField id="college-name" label="College Name" required error={collegeError}>
          <input
            id="college-name"
            name="collegeName"
            type="text"
            autoComplete="organization"
            required
            placeholder="Sai Vidya Institute of Technology"
            value={draft.collegeName}
            aria-invalid={collegeError ? true : undefined}
            aria-describedby={collegeError ? "college-name-error" : undefined}
            className={controlClasses(Boolean(collegeError))}
            onChange={(event) => onChange("collegeName", event.target.value)}
            onBlur={() => {
              onChange("collegeName", draft.collegeName.trim());
              onTouch("collegeName");
            }}
          />
        </FormField>

        <FormField
          id="department"
          label="Department"
          required={!draft.placementOutreach}
          error={departmentError}
          hint={
            draft.placementOutreach
              ? "Optional when contacting the Placement Department."
              : "Required for department-specific outreach."
          }
        >
          <input
            id="department"
            name="department"
            type="text"
            required={!draft.placementOutreach}
            placeholder="CSE"
            value={draft.department}
            aria-invalid={departmentError ? true : undefined}
            aria-describedby={departmentError ? "department-error" : "department-hint"}
            className={controlClasses(Boolean(departmentError))}
            onChange={(event) => onChange("department", event.target.value)}
            onBlur={() => {
              onChange("department", draft.department.trim());
              onTouch("department");
            }}
          />
        </FormField>

        <fieldset className="rounded-2xl border border-line px-4 py-4">
          <legend className="px-1 text-sm font-semibold text-navy">
            Are we also sending this email to the Placement Department?
          </legend>
          <p id="placement-hint" className="mt-2 text-xs leading-5 text-muted">
            Yes addresses the placement office, and department is optional. No is department-specific outreach, and department is required.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
              <input
                id="placement-yes"
                type="radio"
                name="placementOutreach"
                value="yes"
                checked={draft.placementOutreach}
                onChange={() => onChange("placementOutreach", true)}
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
              <input
                id="placement-no"
                type="radio"
                name="placementOutreach"
                value="no"
                checked={!draft.placementOutreach}
                onChange={() => onChange("placementOutreach", false)}
              />
              No
            </label>
          </div>
          <p className="mt-3 text-xs font-semibold text-teal-deep">
            {draft.placementOutreach
              ? "Placement-office outreach."
              : draft.department.trim()
                ? "Department-specific outreach."
                : "Add a department to continue."}
          </p>
        </fieldset>

        <FormField
          id="session-interest"
          label="Session Interest"
          hint={
            draft.sessionInterest === "Not Specified"
              ? "Not Specified keeps the letter general, without naming a session type."
              : "This session type is written into the letter."
          }
        >
          <select
            id="session-interest"
            name="sessionInterest"
            value={draft.sessionInterest}
            aria-describedby="session-interest-hint"
            className={`${controlClasses(false)} select-chevron`}
            onChange={(event) =>
              onChange("sessionInterest", event.target.value as OutreachDraft["sessionInterest"])
            }
            onBlur={() => onTouch("sessionInterest")}
          >
            {SESSION_INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </section>
  );
}

function RecipientCount({ email, invalid }: { email: string; invalid: boolean }) {
  const parsed = parseRecipientList(email);
  if (invalid || parsed.recipients.length === 0) return <p id="recipient-count" className="sr-only" />;
  const label = parsed.recipients.length === 1 ? "1 recipient" : `${parsed.recipients.length} recipients`;
  return (
    <p id="recipient-count" className="mt-1.5 text-xs font-semibold text-teal-deep">
      {label}
    </p>
  );
}
