"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { z } from "zod";
import { createSeedPatients, defaultSeedNow } from "@/lib/seed";
import { assignToken, createRng } from "@/lib/tokens";
import type { Language, Patient, Status, VisitReason } from "@/types/patient";

const languageSchema = z.enum(["en", "es"]);
const reasonSchema = z.enum(["annual_exam", "follow_up", "consultation", "other"]);

export const checkInSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date as YYYY-MM-DD.")
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), "Enter a real date."),
  reason: reasonSchema,
  language: languageSchema,
  arrivedAt: z
    .string()
    .min(1, "Enter an arrival time.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a real arrival time.")
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export type PatientState = {
  patients: Patient[];
  lastCheckedInId: string | null;
};

type Action =
  | { type: "CHECK_IN"; input: CheckInInput }
  | { type: "SET_STATUS"; id: string; status: Status }
  | { type: "RESET" };

const initialState: PatientState = {
  patients: createSeedPatients(defaultSeedNow),
  lastCheckedInId: null
};

function createPatient(input: CheckInInput, existingPatients: Patient[]): Patient {
  const activeTokens = existingPatients.filter((patient) => patient.status !== "done").map((patient) => patient.token);
  const token = assignToken(activeTokens, createRng(9100 + existingPatients.length));
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `synthetic-${existingPatients.length + 1}`;

  return {
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dob: input.dob,
    reason: input.reason as VisitReason,
    arrivedAt: new Date(input.arrivedAt).toISOString(),
    status: "waiting",
    language: input.language as Language,
    token
  };
}

export function patientReducer(state: PatientState, action: Action): PatientState {
  if (action.type === "RESET") {
    return initialState;
  }

  if (action.type === "SET_STATUS") {
    return {
      ...state,
      patients: state.patients.map((patient) =>
        patient.id === action.id ? { ...patient, status: action.status } : patient
      )
    };
  }

  const result = checkInSchema.safeParse(action.input);
  if (!result.success) {
    throw result.error;
  }

  const patient = createPatient(result.data, state.patients);
  return {
    patients: [...state.patients, patient],
    lastCheckedInId: patient.id
  };
}

type PatientContextValue = PatientState & {
  checkIn(input: CheckInInput): Patient;
  resetDemo(): void;
  setStatus(id: string, status: Status): void;
};

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(patientReducer, initialState);

  const value = useMemo<PatientContextValue>(() => {
    return {
      ...state,
      checkIn(input) {
        const beforeIds = new Set(state.patients.map((patient) => patient.id));
        const next = patientReducer(state, { type: "CHECK_IN", input });
        const patient = next.patients.find((candidate) => !beforeIds.has(candidate.id));
        dispatch({ type: "CHECK_IN", input });
        if (!patient) throw new Error("Check-in did not create a patient.");
        return patient;
      },
      resetDemo() {
        dispatch({ type: "RESET" });
      },
      setStatus(id, status) {
        dispatch({ type: "SET_STATUS", id, status });
      }
    };
  }, [state]);

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatients(): PatientContextValue {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used inside PatientProvider.");
  }
  return context;
}

export function useNow(fixed?: Date): Date {
  const [now, setNow] = useState(fixed ?? new Date());

  useEffect(() => {
    if (fixed) return undefined;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [fixed]);

  return now;
}
