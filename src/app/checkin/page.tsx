"use client";

import { useRef, useState } from "react";
import { ZodError } from "zod";
import { Glyph } from "@/components/Glyph";
import { IdleBlur } from "@/components/IdleBlur";
import { reasonLabels, toDateTimeLocal } from "@/lib/format";
import { tokenLabel } from "@/lib/tokens";
import { checkInSchema, type CheckInInput, usePatients } from "@/store/patients";
import type { Patient, VisitReason } from "@/types/patient";

const reasonOptions: VisitReason[] = ["annual_exam", "follow_up", "consultation", "other"];
const steps = [
  { title: "Identify patient", description: "Confirm only the fields staff need to place this patient in the queue." },
  { title: "Visit context", description: "Set language and arrival details before the public-safe token is issued." },
  { title: "Token handoff", description: "Read the token aloud and point the patient to the waiting-room board." }
] as const;
const stepFields: Array<Array<keyof CheckInInput>> = [
  ["firstName", "lastName", "dob"],
  ["reason", "language", "arrivedAt"],
  []
];

type Errors = Partial<Record<keyof CheckInInput, string>>;

function emptyInput(): CheckInInput {
  return {
    firstName: "",
    lastName: "",
    dob: "",
    reason: "annual_exam",
    language: "en",
    arrivedAt: toDateTimeLocal(new Date())
  };
}

export default function CheckInPage() {
  const { checkIn } = usePatients();
  const [input, setInput] = useState<CheckInInput>(() => emptyInput());
  const [errors, setErrors] = useState<Errors>({});
  const [confirmation, setConfirmation] = useState<Patient | null>(null);
  const [step, setStep] = useState(0);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const fieldRefs = {
    firstName: firstFieldRef,
    lastName: useRef<HTMLInputElement>(null),
    dob: useRef<HTMLInputElement>(null),
    reason: useRef<HTMLSelectElement>(null),
    language: useRef<HTMLSelectElement>(null),
    arrivedAt: useRef<HTMLInputElement>(null)
  };

  function update<Key extends keyof CheckInInput>(key: Key, value: CheckInInput[Key]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function moveFocusToFirstError(nextErrors: Errors) {
    const firstKey = Object.keys(nextErrors)[0] as keyof CheckInInput | undefined;
    if (firstKey) fieldRefs[firstKey].current?.focus();
  }

  function validate(fields: Array<keyof CheckInInput>): boolean {
    const result = checkInSchema.safeParse(input);
    if (!result.success) {
      const nextErrors: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CheckInInput;
        if (fields.length === 0 || fields.includes(key)) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        moveFocusToFirstError(nextErrors);
        return false;
      }
    }

    setErrors({});
    return true;
  }

  function continueFlow() {
    if (!validate(stepFields[step])) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate([])) return;

    try {
      const patient = checkIn(checkInSchema.parse(input));
      setErrors({});
      setConfirmation(patient);
      setStep(2);
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors({ firstName: error.issues[0]?.message ?? "Check the form and try again." });
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <IdleBlur>
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Front desk flow</p>
            <h1 className="mt-2 text-4xl font-bold">Patient check-in</h1>
            <p className="mt-3 max-w-2xl text-lg text-text-secondary">
              Add an arriving patient, then hand them a token that works on the public board without exposing names,
              DOB, or visit reason.
            </p>
          </div>
          <ol className="panel grid gap-2 p-3" aria-label="Check-in progress">
            {steps.map((item, index) => (
              <li
                aria-current={step === index ? "step" : undefined}
                className={`rounded-md border px-3 py-2 ${
                  step === index ? "border-accent-default bg-accent-subtle" : "border-transparent"
                }`}
                key={item.title}
              >
                <p className="text-sm font-semibold">
                  Step {index + 1}: {item.title}
                </p>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <form className="panel grid gap-4 p-5" noValidate onSubmit={submit}>
            {step === 0 ? (
              <section className="grid gap-4" aria-labelledby="identity-step">
                <h2 className="text-2xl font-bold" id="identity-step">
                  Identify patient
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field error={errors.firstName} id="firstName" label="First name" requiredText="Required">
                    <input
                      aria-describedby={errors.firstName ? "firstName-error" : undefined}
                      aria-invalid={errors.firstName ? "true" : "false"}
                      className="field w-full"
                      id="firstName"
                      onChange={(event) => update("firstName", event.target.value)}
                      ref={fieldRefs.firstName}
                      value={input.firstName}
                    />
                  </Field>
                  <Field error={errors.lastName} id="lastName" label="Last name" requiredText="Required">
                    <input
                      aria-describedby={errors.lastName ? "lastName-error" : undefined}
                      aria-invalid={errors.lastName ? "true" : "false"}
                      className="field w-full"
                      id="lastName"
                      onChange={(event) => update("lastName", event.target.value)}
                      ref={fieldRefs.lastName}
                      value={input.lastName}
                    />
                  </Field>
                </div>
                <Field error={errors.dob} id="dob" label="Date of birth" requiredText="Required">
                  <input
                    aria-describedby={errors.dob ? "dob-error" : undefined}
                    aria-invalid={errors.dob ? "true" : "false"}
                    className="field w-full"
                    id="dob"
                    onChange={(event) => update("dob", event.target.value)}
                    ref={fieldRefs.dob}
                    type="date"
                    value={input.dob}
                  />
                </Field>
                <button className="button-primary justify-self-start" onClick={continueFlow} type="button">
                  Continue to visit details
                </button>
              </section>
            ) : null}

            {step === 1 ? (
              <section className="grid gap-4" aria-labelledby="visit-step">
                <h2 className="text-2xl font-bold" id="visit-step">
                  Visit context
                </h2>
                <Field error={errors.reason} id="reason" label="Reason for visit" requiredText="Required">
                  <select
                    className="field w-full"
                    id="reason"
                    onChange={(event) => update("reason", event.target.value as VisitReason)}
                    ref={fieldRefs.reason}
                    value={input.reason}
                  >
                    {reasonOptions.map((reason) => (
                      <option key={reason} value={reason}>
                        {reasonLabels[reason]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field error={errors.language} id="language" label="Preferred language" requiredText="Required">
                  <select
                    className="field w-full"
                    id="language"
                    onChange={(event) => update("language", event.target.value as CheckInInput["language"])}
                    ref={fieldRefs.language}
                    value={input.language}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </Field>
                <Field error={errors.arrivedAt} id="arrivedAt" label="Arrival time" requiredText="Required">
                  <input
                    aria-describedby={errors.arrivedAt ? "arrivedAt-error" : undefined}
                    aria-invalid={errors.arrivedAt ? "true" : "false"}
                    className="field w-full"
                    id="arrivedAt"
                    onChange={(event) => update("arrivedAt", event.target.value)}
                    ref={fieldRefs.arrivedAt}
                    type="datetime-local"
                    value={input.arrivedAt}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <button className="button-secondary" onClick={() => setStep(0)} type="button">
                    Back
                  </button>
                  <button className="button-primary" type="submit">
                    Issue public-safe token
                  </button>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="grid gap-4" aria-labelledby="handoff-step">
                <h2 className="text-2xl font-bold" id="handoff-step">
                  Token handoff
                </h2>
                <p className="text-text-secondary">
                  The queue now shows this patient to staff. The waiting-room board receives only the token, glyph,
                  wait range, and status.
                </p>
                <button
                  className="button-secondary justify-self-start"
                  onClick={() => {
                    setConfirmation(null);
                    setInput(emptyInput());
                    setStep(0);
                    window.setTimeout(() => firstFieldRef.current?.focus(), 0);
                  }}
                  type="button"
                >
                  Check in another
                </button>
              </section>
            ) : null}
          </form>
          <aside className="panel p-5" aria-live="polite">
            {confirmation ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  Check-in complete
                </p>
                <div className="my-6 rounded-md border border-accent-default bg-accent-subtle p-5 text-center">
                  <div className="mx-auto flex justify-center text-accent-default">
                    <Glyph glyph={confirmation.token.glyph} size={96} />
                  </div>
                  <p className="mt-3 text-sm font-semibold uppercase text-text-secondary">{confirmation.token.glyph}</p>
                  <p className="mt-2 text-5xl font-bold" data-testid="confirmation-token">
                    {tokenLabel(confirmation.token, confirmation.language)}
                  </p>
                </div>
                <div className="rounded-md border border-border-default p-4">
                  <p className="text-sm font-semibold text-text-secondary">Staff script</p>
                  <p className="mt-2 text-lg font-semibold">
                    “You are {tokenLabel(confirmation.token, confirmation.language)}. Watch for this glyph on the
                    board.”
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Preview</p>
                <p className="mt-3 text-text-secondary">
                  The public-safe token appears here after check-in. Names, DOB, and visit reason stay off the
                  waiting-room board.
                </p>
              </div>
            )}
          </aside>
        </div>
      </IdleBlur>
    </main>
  );
}

function Field({
  children,
  error,
  id,
  label,
  requiredText
}: {
  children: React.ReactNode;
  error?: string;
  id: keyof CheckInInput;
  label: string;
  requiredText: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label} <span className="font-normal text-text-secondary">({requiredText})</span>
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
