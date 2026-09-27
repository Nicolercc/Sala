import { describe, expect, it } from "vitest";
import { redactPatientFields } from "@/lib/logger";
import { createSeedPatients, defaultSeedNow } from "@/lib/seed";

describe("seed data", () => {
  it("is deterministic", () => {
    expect(createSeedPatients(defaultSeedNow)).toEqual(createSeedPatients(defaultSeedNow));
  });

  it("does not include SSNs, phones, emails, or MRN-like strings", () => {
    const serialized = JSON.stringify(createSeedPatients(defaultSeedNow));
    const blockedPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/,
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      /\b(?:MRN|Medical Record Number)[:#\s-]*[A-Z0-9]{5,}\b/i
    ];

    for (const pattern of blockedPatterns) {
      expect(serialized).not.toMatch(pattern);
    }
  });

  it("redacts patient fields before logging", () => {
    expect(
      redactPatientFields({
        firstName: "Maya",
        lastName: "Rivera",
        dob: "1980-01-10",
        reason: "annual_exam",
        nested: { firstName: "Elena" }
      })
    ).toEqual({
      firstName: "[redacted]",
      lastName: "[redacted]",
      dob: "[redacted]",
      reason: "[redacted]",
      nested: { firstName: "[redacted]" }
    });
  });
});
