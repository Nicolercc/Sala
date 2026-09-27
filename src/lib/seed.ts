import { faker } from "@faker-js/faker";
import { assignToken, createRng } from "@/lib/tokens";
import type { Language, Patient, Status, VisitReason } from "@/types/patient";

const firstNames = ["Maya", "Elena", "Rosa", "Talia", "June", "Iris", "Nora", "Ana"];
const lastNames = ["Rivera", "Stone", "Morales", "Kim", "Patel", "Cruz", "Bennett", "Lopez"];
const reasons: VisitReason[] = ["annual_exam", "follow_up", "consultation", "other"];
const statuses: Status[] = ["waiting", "waiting", "waiting", "waiting", "waiting", "called", "in_room", "done"];
const languages: Language[] = ["en", "es", "en", "en", "es", "en", "es", "en"];

export const defaultSeedNow = new Date("2026-09-27T13:00:00.000Z");

export function createSeedPatients(now: Date = defaultSeedNow): Patient[] {
  faker.seed(20260927);
  const rng = createRng(20260927);
  const patients: Patient[] = [];
  const offsets = [50, 42, 34, 25, 17, 11, 6, 2];

  for (let index = 0; index < 8; index += 1) {
    const token = assignToken(
      patients.filter((patient) => patient.status !== "done").map((patient) => patient.token),
      rng
    );
    const arrivedAt = new Date(now.getTime() - offsets[index] * 60_000).toISOString();
    patients.push({
      id: faker.string.uuid(),
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
