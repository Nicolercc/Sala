import { tokenLabel } from "@/lib/tokens";
import { getWaitRange, type WaitRange } from "@/lib/waitRange";
import type { GlyphId, Patient, Status, VisitReason } from "@/types/patient";

export const surfaces = {
  publicBoard: ["glyph", "tokenLabel", "waitRange", "status"],
  staffQueue: ["fullName", "tokenLabel", "glyph", "dobMasked", "reason", "arrivedAt", "waitMinutes", "status"]
} as const;

export type Surface = keyof typeof surfaces;
export type SurfaceKeys<S extends Surface> = (typeof surfaces)[S][number];

/**
 * The one enforcement point for every surface: copies only the keys the surface
 * allows, deny by default. Anything else in `fields`, including fields added to a
 * source record later, is dropped here.
 */
export function pickSurfaceFields<S extends Surface, F extends Partial<Record<SurfaceKeys<S>, unknown>>>(
  surface: S,
  fields: F
): Pick<F, Extract<keyof F, SurfaceKeys<S>>> {
  const allowed = surfaces[surface] as readonly SurfaceKeys<S>[];
  return Object.fromEntries(
    allowed.filter((key) => Object.prototype.hasOwnProperty.call(fields, key)).map((key) => [key, fields[key]])
  ) as Pick<F, Extract<keyof F, SurfaceKeys<S>>>;
}

/** Keys that stop `payload` matching the surface exactly: extras first, then missing. */
export function surfaceContractViolations(surface: Surface, payload: Record<string, unknown>): string[] {
  const allowed: readonly string[] = surfaces[surface];
  const extra = Object.keys(payload).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in payload));
  return [...extra, ...missing];
}

export type ViewFields = {
  glyph: GlyphId;
  tokenLabel: string;
  waitRange: WaitRange;
  status: Status;
  fullName: string;
  dobMasked: string;
  reason: VisitReason;
  arrivedAt: string;
  waitMinutes: number;
};

export type View<S extends Surface> = Pick<ViewFields, SurfaceKeys<S>>;

export function isActive(patient: Patient): boolean {
  return patient.status !== "done";
}

function maskDob(dob: string): string {
  return `**/**/${dob.slice(0, 4)}`;
}

function waitMinutes(patient: Patient, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(patient.arrivedAt).getTime()) / 60_000));
}

function waitingAhead(patient: Patient, allPatients: Patient[]): number {
  const arrived = new Date(patient.arrivedAt).getTime();
  return allPatients.filter(
    (candidate) =>
      candidate.status === "waiting" &&
      candidate.id !== patient.id &&
      new Date(candidate.arrivedAt).getTime() < arrived
  ).length;
}

export function project<S extends Surface>(
  patient: Patient,
  surface: S,
  now: Date,
  allPatients: Patient[] = [patient]
): View<S> {
  const derived: ViewFields = {
    glyph: patient.token.glyph,
    tokenLabel: tokenLabel(patient.token, patient.language),
    waitRange: getWaitRange(waitingAhead(patient, allPatients)),
    status: patient.status,
    fullName: `${patient.firstName} ${patient.lastName}`,
    dobMasked: maskDob(patient.dob),
    reason: patient.reason,
    arrivedAt: patient.arrivedAt,
    waitMinutes: waitMinutes(patient, now)
  };

  return pickSurfaceFields(surface, derived) as View<S>;
}
