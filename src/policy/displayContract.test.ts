import { describe, expect, it } from "vitest";
import { displayContracts, forbiddenPublicFields } from "@/policy/displayContract";
import { surfaces } from "@/policy/visibility";

describe("display contracts", () => {
  it("keeps the public board contract aligned with the projection policy", () => {
    expect(displayContracts.publicBoard.allowedFields).toEqual(surfaces.publicBoard);
  });

  it("documents direct patient fields as forbidden on the public board", () => {
    for (const field of forbiddenPublicFields) {
      expect(displayContracts.publicBoard.forbiddenFields).toContain(field);
      expect(displayContracts.publicBoard.allowedFields).not.toContain(field);
    }
  });
});
