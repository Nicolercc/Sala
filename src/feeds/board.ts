import { isActive, project } from "@/policy/visibility";
import type { Patient } from "@/types/patient";

export function getBoardFeed(patients: Patient[], now: Date): string {
  return JSON.stringify(patients.filter(isActive).map((patient) => project(patient, "publicBoard", now, patients)));
}
