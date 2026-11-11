import { assignToken, createRng, type Rng } from "@/lib/tokens";
import type { Language, Patient, Status, VisitReason } from "@/types/patient";

const firstNames = ["Maya", "Elena", "Rosa", "Talia", "June", "Iris", "Nora", "Ana"];
const lastNames = ["Rivera", "Stone", "Morales", "Kim", "Patel", "Cruz", "Bennett", "Lopez"];
const reasons: VisitReason[] = ["annual_exam", "follow_up", "consultation", "other"];
const statuses: Status[] = ["waiting", "waiting", "waiting", "waiting", "waiting", "called", "in_room", "done"];
const languages: Language[] = ["en", "es", "en", "en", "es", "en", "es", "en"];

export const defaultSeedNow = new Date("2026-09-27T13:00:00.000Z");

/** A UUID-shaped id from a seeded generator, so seed data is the same on every load. */
function seededUuid(rng: Rng): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rng() * 16).toString(16));
  hex[12] = "4";
  hex[16] = "89ab"[Math.floor(rng() * 4)];
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function createSeedPatients(now: Date = defaultSeedNow): Patient[] {
  const rng = createRng(20260927);
  // Ids get their own generator so token assignment draws the same numbers as before.
  const idRng = createRng(20260928);
  const patients: Patient[] = [];
  const offsets = [50, 42, 34, 25, 17, 11, 6, 2];

  for (let index = 0; index < 8; index += 1) {
    const token = assignToken(
      patients.filter((patient) => patient.status !== "done").map((patient) => patient.token),
      rng
    );
    const arrivedAt = new Date(now.getTime() - offsets[index] * 60_000).toISOString();
    patients.push({
      id: seededUuid(idRng),
      firstName: firstNames[index],
      lastName: lastNames[index],
      dob: new Date(Date.UTC(1978 + index, index % 12, 10 + index)).toISOString().slice(0, 10),
      reason: reasons[index % reasons.length],
      arrivedAt,
      status: statuses[index],
      language: languages[index],
      token
    });
  }

  return patients;
}
