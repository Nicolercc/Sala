export type Status = "waiting" | "called" | "in_room" | "done";
export type Language = "en" | "es";
export type VisitReason = "annual_exam" | "follow_up" | "consultation" | "other";

export type GlyphId =
  | "circle"
  | "triangle"
  | "square"
  | "diamond"
  | "hexagon"
  | "star"
  | "crescent"
  | "leaf";

export type WordPair = {
  en: string;
  es: string;
};

export type PatientToken = {
  glyph: GlyphId;
  colorWord: WordPair;
  nounWord: WordPair;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  reason: VisitReason;
  arrivedAt: string;
  status: Status;
  language: Language;
  token: PatientToken;
};
