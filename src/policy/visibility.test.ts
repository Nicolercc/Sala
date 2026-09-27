import { describe, expect, it } from "vitest";
import { getBoardFeed } from "@/feeds/board";
import { createSeedPatients, defaultSeedNow } from "@/lib/seed";
import { project, surfaces } from "@/policy/visibility";

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

  it("makes the staff lens equal the board feed", () => {
    const feedRows = JSON.parse(getBoardFeed(patients, defaultSeedNow));
    const lensRows = patients
      .filter((patient) => patient.status !== "done")
      .map((patient) => project(patient, "publicBoard", defaultSeedNow, patients));

    expect(lensRows).toEqual(feedRows);
  });
});
