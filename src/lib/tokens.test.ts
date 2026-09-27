import { describe, expect, it } from "vitest";
import { assignToken, createRng, tokenKey, tokenLabel } from "@/lib/tokens";
import type { PatientToken } from "@/types/patient";

describe("tokens", () => {
  it("assigns unique active tokens", () => {
    const rng = createRng(44);
    const active: PatientToken[] = [];

    for (let index = 0; index < 64; index += 1) {
      active.push(assignToken(active, rng));
    }

    expect(new Set(active.map(tokenKey))).toHaveLength(64);
  });

  it("is deterministic from a fixed rng", () => {
    const first = assignToken([], createRng(7));
    const second = assignToken([], createRng(7));
    expect(second).toEqual(first);
  });

  it("uses language-specific word order", () => {
    const token = assignToken([], createRng(3));
    expect(tokenLabel(token, "en")).toMatch(new RegExp(`^${token.colorWord.en} ${token.nounWord.en}$`));
    expect(tokenLabel(token, "es")).toMatch(new RegExp(`^${token.nounWord.es} ${token.colorWord.es}$`));
  });
});
