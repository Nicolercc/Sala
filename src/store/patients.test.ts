import { describe, expect, it } from "vitest";
import { checkInSchema, patientReducer } from "@/store/patients";
import type { PatientState } from "@/store/patients";

const baseState: PatientState = {
  patients: [],
  lastCheckedInId: null
};

const validInput = {
  firstName: "Lina",
  lastName: "Campos",
  dob: "1990-04-12",
  reason: "follow_up" as const,
  language: "es" as const,
  arrivedAt: "2026-09-27T10:30"
};

describe("patient reducer", () => {
  it("checks in a valid patient", () => {
    const state = patientReducer(baseState, { type: "CHECK_IN", input: validInput });
    expect(state.patients).toHaveLength(1);
    expect(state.patients[0]).toMatchObject({
      firstName: "Lina",
      status: "waiting",
      language: "es"
    });
  });

  it("rejects invalid check-in input", () => {
    expect(() =>
      patientReducer(baseState, { type: "CHECK_IN", input: { ...validInput, firstName: "" } })
    ).toThrow();
  });

  it("sets status and retires done tokens from active assignment", () => {
    const checkedIn = patientReducer(baseState, { type: "CHECK_IN", input: validInput });
    const done = patientReducer(checkedIn, { type: "SET_STATUS", id: checkedIn.patients[0].id, status: "done" });
    const next = patientReducer(done, {
      type: "CHECK_IN",
      input: { ...validInput, firstName: "Mara", arrivedAt: "2026-09-27T10:35" }
    });

    expect(done.patients[0].status).toBe("done");
    expect(next.patients).toHaveLength(2);
  });

  it("resets to the seed", () => {
    const changed = patientReducer(baseState, { type: "CHECK_IN", input: validInput });
    const reset = patientReducer(changed, { type: "RESET" });
    expect(reset.patients).toHaveLength(8);
  });
});

describe("check-in schema", () => {
  it("accepts valid input and rejects invalid fields", () => {
    expect(checkInSchema.safeParse(validInput).success).toBe(true);
    expect(checkInSchema.safeParse({ ...validInput, dob: "04/12/1990" }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validInput, arrivedAt: "" }).success).toBe(false);
  });
});

describe("demo clock", () => {
  it("starts at the seed time, so seeded waits stay within the seed morning", async () => {
    const { demoNow } = await import("@/store/patients");
    const { createSeedPatients, defaultSeedNow } = await import("@/lib/seed");
    const now = demoNow();
    expect(now.getTime() - defaultSeedNow.getTime()).toBeGreaterThanOrEqual(0);
    expect(now.getTime() - defaultSeedNow.getTime()).toBeLessThan(60 * 60_000);
    for (const patient of createSeedPatients(defaultSeedNow)) {
      const minutes = (now.getTime() - new Date(patient.arrivedAt).getTime()) / 60_000;
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(120);
    }
  });
});
