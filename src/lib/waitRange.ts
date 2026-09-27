import type { Language } from "@/types/patient";

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
