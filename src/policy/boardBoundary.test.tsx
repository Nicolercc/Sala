import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoardFeedBridge } from "@/components/BoardFeedBridge";
import { reasonLabels } from "@/lib/format";
import { surfaces } from "@/policy/visibility";
import { PatientProvider, usePatients, type CheckInInput } from "@/store/patients";

const SRC = resolve(process.cwd(), "src");

/** Resolve "@/x" and relative imports to a file under src/, or null for packages. */
function resolveImport(fromFile: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(fromFile), spec) : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) {
      try {
        readFileSync(candidate);
        return candidate;
      } catch {
        /* directory */
      }
    }
  }
  return null;
}

/** Every src/ file reachable from `entry` through static imports. */
function importClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    // Type-only imports are erased at build time and carry no data, so skip them.
    for (const [, spec] of source.matchAll(/^(?!\s*(?:import|export)\s+type\b)\s*(?:import|export)[^"';]*?from\s+["']([^"']+)["']/gm)) {
      const target = resolveImport(file, spec);
      if (target) queue.push(target);
    }
  }
  return seen;
}

const rel = (file: string) => file.slice(SRC.length + 1);
const isPatientModel = (file: string) => /^(store\/|types\/patient)/.test(rel(file));

describe("board import boundary (transitive)", () => {
  it("the board renderer cannot reach the patient store or patient model through any import chain", () => {
    const closure = [...importClosure(join(SRC, "components/BoardDisplay.tsx"))].map(rel);
    expect(closure.filter((file) => /^(store\/|types\/patient)/.test(file))).toEqual([]);
  });

  it("BoardFeedBridge is the single place the board route touches the patient store", () => {
    const closure = importClosure(join(SRC, "app/board/page.tsx"));
    const importers = [...closure].filter((file) => {
      if (isPatientModel(file)) return false;
      const source = readFileSync(file, "utf8");
      return /^(?!\s*import\s+type\b)\s*import[^;]*from\s+["'](@\/store|@\/types\/patient)/m.test(source);
    });
    // Everything else on the route receives only the projected feed. If this list
    // grows, a second path from patient records to the board has been added.
    expect(importers.map(rel).filter((file) => !file.startsWith("policy/") && !file.startsWith("feeds/") && !file.startsWith("lib/")))
      .toEqual(["components/BoardFeedBridge.tsx"]);
  });
});

describe("board render", () => {
  const sentinel: CheckInInput = {
    firstName: "Zebulon",
    lastName: "Quixotewright",
    dob: "1901-02-03",
    reason: "consultation",
    language: "en",
    arrivedAt: "2026-09-27T09:00"
  };

  function CheckInThenBoard() {
    const { checkIn, patients } = usePatients();
    return (
      <>
        <button onClick={() => checkIn(sentinel)} type="button">check in</button>
        <span data-testid="count">{patients.length}</span>
        <div data-testid="board">
          <BoardFeedBridge />
        </div>
      </>
    );
  }

  it("shows a newly checked-in patient only through allow-listed fields", () => {
    const { getByText, getByTestId } = render(
      <PatientProvider>
        <CheckInThenBoard />
      </PatientProvider>
    );
    const before = Number(getByTestId("count").textContent);
    act(() => getByText("check in").click());
    expect(Number(getByTestId("count").textContent)).toBe(before + 1);

    const board = getByTestId("board");
    const html = board.innerHTML;
    for (const leaked of ["Zebulon", "Quixotewright", "1901", "02/03", reasonLabels.consultation]) {
      expect(html, `board shows ${String(leaked)}`).not.toContain(String(leaked));
    }
    // One board row per active patient, each carrying only the public fields.
    expect(board.querySelectorAll("article").length).toBeGreaterThan(0);
    expect(surfaces.publicBoard).toEqual(["glyph", "tokenLabel", "waitRange", "status"]);
  });
});
