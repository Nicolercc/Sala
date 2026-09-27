import { describe, expect, it } from "vitest";
import { getWaitRange } from "@/lib/waitRange";

describe("wait range", () => {
  it.each([
    [0, 0, 0, "Next up", "Es su turno pronto"],
    [1, 10, 20, "About 10 to 20 min", "Aprox. 10 a 20 min"],
    [3, 25, 50, "About 25 to 50 min", "Aprox. 25 a 50 min"]
  ])("calculates the labeled range for %i patients ahead", (ahead, low, high, en, es) => {
    expect(getWaitRange(ahead)).toEqual({ low, high, label: { en, es } });
  });
});
