import { tokenLabel } from "@/lib/tokens";
import { getWaitRange, type WaitRange } from "@/lib/waitRange";
import type { GlyphId, Patient, Status, VisitReason } from "@/types/patient";

export const surfaces = {
  publicBoard: ["glyph", "tokenLabel", "waitRange", "status"],
  staffQueue: ["fullName", "tokenLabel", "glyph", "dobMasked", "reason", "arrivedAt", "waitMinutes", "status"]
} as const;

export type Surface = keyof typeof surfaces;
type SurfaceKeys<S extends Surface> = (typeof surfaces)[S][number];

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

  return Object.fromEntries(surfaces[surface].map((key) => [key, derived[key]])) as View<S>;
}
