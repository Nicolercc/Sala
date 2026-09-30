import { pickSurfaceFields, surfaces, type SurfaceKeys } from "@/policy/visibility";

// The home prototype keeps its own arrival records (shape-and-number tokens, a
// "desk" status, window numbers). This module is the only way those records
// reach the waiting-room board, and it goes through the same allow-list as
// project(): surfaces.publicBoard via pickSurfaceFields().

export type KioskStatus = "waiting" | "called" | "desk" | "done";

/** Staff-side arrival record. Only the staff console may read these directly. */
export type KioskRecord = {
  id: number;
  first: string;
  last: string;
  dob: string;
  visit: string;
  lang: string;
  note: string;
  arrived: Date;
  status: KioskStatus;
  window: number | null;
  token: string;
  you: boolean;
};

export type KioskBoardRow = Readonly<Record<SurfaceKeys<"publicBoard">, string>>;

function waitBucket(minutes: number): string {
  if (minutes < 5) return "under 5 min";
  if (minutes < 10) return "5–10 min";
  if (minutes < 20) return "10–20 min";
  if (minutes < 30) return "20–30 min";
  return "30+ min";
}

function waitingOrder(records: readonly KioskRecord[]): KioskRecord[] {
  return records.filter((r) => r.status === "waiting").sort((a, b) => a.arrived.getTime() - b.arrived.getTime());
}

export function projectKioskRecord(record: KioskRecord, all: readonly KioskRecord[]): KioskBoardRow {
  let status: string;
  let waitRange: string;
  if (record.status === "called") {
    status = `Go to window ${record.window}`;
    waitRange = "Now";
  } else if (record.status === "desk") {
    status = "Please see front desk";
    waitRange = "—";
  } else {
    const place = waitingOrder(all).indexOf(record);
    status = place === 0 ? "You're next" : "Waiting";
    waitRange = waitBucket(3 + place * 6);
  }

  const derived = {
    glyph: record.token.split(" ")[0].toLowerCase(),
    tokenLabel: record.token,
    waitRange,
    status
  };
  const row = pickSurfaceFields("publicBoard", derived);
  // The board contract is exact: if a public field could not be derived, fail
  // loudly instead of rendering a partial row.
  for (const key of surfaces.publicBoard) {
    if (typeof row[key] !== "string") throw new Error(`Board row is missing ${key}`);
  }
  return Object.freeze(row);
}

/** Active records, oldest arrival first, as public board rows only. No ids, no names. */
export function getKioskBoardFeed(records: readonly KioskRecord[]): KioskBoardRow[] {
  return records
    .filter((r) => r.status !== "done")
    .sort((a, b) => a.arrived.getTime() - b.arrived.getTime())
    .map((r) => projectKioskRecord(r, records));
}
