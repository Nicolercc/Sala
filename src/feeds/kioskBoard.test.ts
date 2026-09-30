import { describe, expect, it } from "vitest";
import { getKioskBoardFeed, projectKioskRecord, type KioskRecord } from "@/feeds/kioskBoard";
import { forbiddenPublicFields } from "@/policy/displayContract";
import { surfaces } from "@/policy/visibility";

const now = new Date("2026-09-27T13:00:00.000Z");
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

function record(overrides: Partial<KioskRecord>): KioskRecord {
  return {
    id: 1,
    first: "Lina",
    last: "Campos",
    dob: "1990-04-12",
    visit: "follow",
    lang: "es",
    note: "",
    arrived: minutesAgo(10),
    status: "waiting",
    window: null,
    token: "Triangle 14",
    you: false,
    ...overrides
  };
}

const records: KioskRecord[] = [
  record({ id: 1, first: "James", last: "Okafor", dob: "1975-11-02", visit: "annual", lang: "en", note: "Uses a wheelchair", arrived: minutesAgo(24), status: "called", window: 2, token: "Circle 31" }),
  record({ id: 2, first: "Luis", last: "Fernández", dob: "1968-01-09", visit: "lab", arrived: minutesAgo(19), token: "Square 22" }),
  record({ id: 3, first: "Priya", last: "Nair", dob: "1992-06-27", note: "Needs an interpreter", arrived: minutesAgo(15), status: "desk", token: "Star 47" }),
  record({ id: 4, first: "Hannah", last: "Kim", dob: "2001-08-30", arrived: minutesAgo(8), token: "Hexagon 58" }),
  record({ id: 5, first: "Omar", last: "Haddad", dob: "1990-07-21", arrived: minutesAgo(31), status: "done", token: "Diamond 63" })
];

describe("home waiting-room feed", () => {
  const feed = getKioskBoardFeed(records);

  it("gives every row exactly the public board fields", () => {
    expect(feed).toHaveLength(4);
    for (const row of feed) {
      expect(Object.keys(row)).toEqual(surfaces.publicBoard);
    }
  });

  it("keeps names, birth dates, notes and internal ids off the board", () => {
    const serialized = JSON.stringify(feed);
    for (const r of records) {
      for (const value of [r.first, r.last, r.dob]) {
        expect(serialized).not.toContain(value);
      }
      if (r.note) expect(serialized).not.toContain(r.note);
    }
    for (const row of feed) {
      for (const key of [...forbiddenPublicFields, "id", "first", "last", "note", "lang", "visit", "arrived", "window", "you"]) {
        expect(row).not.toHaveProperty(key);
      }
    }
  });

  it("keeps sensitive fields out even when the source record carries extra ones", () => {
    const withExtras = {
      ...record({ id: 9, arrived: minutesAgo(2), token: "Circle 77", note: "sentinel-note-text" }),
      ssn: "123-45-6789",
      mrn: "MRN-SENTINEL-42",
      phone: "(555) 010-0199",
      email: "lina@example.test",
      insurance: "sentinel-insurance-plan",
      diagnosis: "sentinel-diagnosis"
    } as KioskRecord;

    const row = projectKioskRecord(withExtras, [withExtras]);
    expect(Object.keys(row)).toEqual(surfaces.publicBoard);

    const serialized = JSON.stringify(getKioskBoardFeed([...records, withExtras]));
    for (const value of [
      "123-45-6789",
      "MRN-SENTINEL-42",
      "(555) 010-0199",
      "lina@example.test",
      "sentinel-insurance-plan",
      "sentinel-diagnosis",
      "sentinel-note-text"
    ]) {
      expect(serialized).not.toContain(value);
    }
  });

  it("orders rows by arrival and derives only public status and wait text", () => {
    expect(feed.map((row) => row.tokenLabel)).toEqual(["Circle 31", "Square 22", "Star 47", "Hexagon 58"]);
    expect(feed[0]).toMatchObject({ glyph: "circle", status: "Go to window 2", waitRange: "Now" });
    expect(feed[1]).toMatchObject({ glyph: "square", status: "You're next" });
    expect(feed[2]).toMatchObject({ glyph: "star", status: "Please see front desk", waitRange: "—" });
    expect(feed[3]).toMatchObject({ glyph: "hexagon", status: "Waiting" });
  });

  it("returns rows the board cannot modify", () => {
    for (const row of feed) {
      expect(Object.isFrozen(row)).toBe(true);
    }
  });
});
