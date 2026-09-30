import { describe, expect, it } from "vitest";
import { getBoardFeed } from "@/feeds/board";
import { createSeedPatients, defaultSeedNow } from "@/lib/seed";
import { pickSurfaceFields, project, surfaceContractViolations, surfaces } from "@/policy/visibility";
import type { Patient } from "@/types/patient";

describe("visibility policy", () => {
  const patients = createSeedPatients(defaultSeedNow);

  it("returns exactly the allowed keys for each surface", () => {
    const patient = patients[0];
    expect(Object.keys(project(patient, "publicBoard", defaultSeedNow, patients))).toEqual(surfaces.publicBoard);
    expect(Object.keys(project(patient, "staffQueue", defaultSeedNow, patients))).toEqual(surfaces.staffQueue);
  });

  it("keeps direct patient fields off the public board", () => {
    for (const patient of patients) {
      const output = JSON.stringify(project(patient, "publicBoard", defaultSeedNow, patients));
      expect(output).not.toContain(patient.firstName);
      expect(output).not.toContain(patient.lastName);
      expect(output).not.toContain(patient.dob);
      expect(output).not.toContain(patient.reason);
    }
  });

  it("serializes only the public board projection", () => {
    const feed = getBoardFeed(patients, defaultSeedNow);
    for (const patient of patients) {
      expect(feed).not.toContain(patient.firstName);
      expect(feed).not.toContain(patient.lastName);
      expect(feed).not.toContain(patient.dob);
      expect(feed).not.toContain(patient.reason);
    }
  });

  it("drops fields a source record gains later, before they reach the public board", () => {
    const patient = {
      ...patients[0],
      ssn: "123-45-6789",
      mrn: "MRN-SENTINEL-42",
      diagnosis: "sentinel-diagnosis",
      insurance: "sentinel-insurance"
    } as Patient;
    const output = project(patient, "publicBoard", defaultSeedNow, patients);
    expect(Object.keys(output)).toEqual(surfaces.publicBoard);
    const serialized = JSON.stringify(output);
    for (const value of ["123-45-6789", "MRN-SENTINEL-42", "sentinel-diagnosis", "sentinel-insurance"]) {
      expect(serialized).not.toContain(value);
    }
  });

  it("pickSurfaceFields copies only the keys a surface allows", () => {
    const picked = pickSurfaceFields("publicBoard", {
      glyph: "circle",
      tokenLabel: "Circle 12",
      waitRange: "5–10 min",
      status: "Waiting",
      firstName: "Lina",
      id: 7
    });
    expect(picked).toEqual({ glyph: "circle", tokenLabel: "Circle 12", waitRange: "5–10 min", status: "Waiting" });
  });

  it("surfaceContractViolations names extra and missing keys", () => {
    expect(surfaceContractViolations("publicBoard", { glyph: "", tokenLabel: "", waitRange: "", status: "" })).toEqual([]);
    expect(
      surfaceContractViolations("publicBoard", { glyph: "", tokenLabel: "", waitRange: "", status: "", firstName: "Lina" })
    ).toEqual(["firstName"]);
    expect(surfaceContractViolations("publicBoard", { glyph: "", tokenLabel: "" })).toEqual(["waitRange", "status"]);
  });

  it("makes the staff lens equal the board feed", () => {
    const feedRows = JSON.parse(getBoardFeed(patients, defaultSeedNow));
    const lensRows = patients
      .filter((patient) => patient.status !== "done")
      .map((patient) => project(patient, "publicBoard", defaultSeedNow, patients));

    expect(lensRows).toEqual(feedRows);
  });
});
