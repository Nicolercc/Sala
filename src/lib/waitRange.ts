import type { Language, Status } from "@/types/patient";

export type WaitRange = {
  low: number;
  high: number;
  label: Record<Language, string>;
};

function roundToNearestFive(value: number): number {
  return Math.round(value / 5) * 5;
}

export function getWaitRange(ahead: number): WaitRange {
  if (ahead === 0) {
    return {
      low: 0,
      high: 0,
      label: {
        en: "Next up",
        es: "Es su turno pronto"
      }
    };
  }

  const low = roundToNearestFive(ahead * 8);
  const high = roundToNearestFive(ahead * 15 + 5);

  return {
    low,
    high,
    label: {
      en: `About ${low} to ${high} min`,
      es: `Aprox. ${low} a ${high} min`
    }
  };
}

/**
 * The wait shown for a patient in a given status. Only waiting patients get an
 * estimate; someone already called or with staff has no wait left, and showing
 * "About 40 to 80 min" next to "Your turn" contradicted the status beside it.
 */
export function getWaitRangeForStatus(status: Status, ahead: number): WaitRange {
  if (status === "called") {
    return { low: 0, high: 0, label: { en: "Now", es: "Ahora" } };
  }
  if (status === "in_room" || status === "done") {
    return { low: 0, high: 0, label: { en: "—", es: "—" } };
  }
  return getWaitRange(ahead);
}
