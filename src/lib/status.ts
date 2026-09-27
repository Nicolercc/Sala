import type { Language, Status } from "@/types/patient";

export const statusLabels: Record<Status, Record<Language, string>> = {
  waiting: { en: "Waiting", es: "Esperando" },
  called: { en: "Your turn", es: "Es su turno" },
  in_room: { en: "In room", es: "En consulta" },
  done: { en: "Done", es: "Listo" }
};

export const boardStatuses: Status[] = ["waiting", "called", "in_room"];

export function statusIcon(status: Status): string {
  if (status === "called") return "!";
  if (status === "in_room") return ">";
  if (status === "done") return "✓";
  return "...";
}
