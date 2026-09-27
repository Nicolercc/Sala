import type { VisitReason } from "@/types/patient";

export const reasonLabels: Record<VisitReason, string> = {
  annual_exam: "Annual exam",
  follow_up: "Follow-up",
  consultation: "Consultation",
  other: "Other"
};

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
