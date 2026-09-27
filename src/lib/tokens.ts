import type { GlyphId, Language, PatientToken, WordPair } from "@/types/patient";

export const glyphs: GlyphId[] = [
  "circle",
  "triangle",
  "square",
  "diamond",
  "hexagon",
  "star",
  "crescent",
  "leaf"
];

export const colorWords: WordPair[] = [
  { en: "Amber", es: "Ámbar" },
  { en: "Coral", es: "Coral" },
  { en: "Jade", es: "Jade" },
  { en: "Indigo", es: "Índigo" },
  { en: "Olive", es: "Oliva" },
  { en: "Pearl", es: "Perla" },
  { en: "Ruby", es: "Rubí" },
  { en: "Sage", es: "Salvia" }
];

export const nounWords: WordPair[] = [
  { en: "Heron", es: "Garza" },
  { en: "Dove", es: "Paloma" },
  { en: "Falcon", es: "Halcón" },
  { en: "Crane", es: "Grulla" },
  { en: "Pelican", es: "Pelícano" },
  { en: "Sparrow", es: "Gorrión" },
  { en: "Lark", es: "Alondra" },
  { en: "Swan", es: "Cisne" }
];

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function tokenKey(token: PatientToken): string {
  return `${token.glyph}:${token.colorWord.en}:${token.nounWord.en}`;
}

export function tokenLabel(token: PatientToken, language: Language): string {
  if (language === "es") {
    return `${token.nounWord.es} ${token.colorWord.es}`;
  }

  return `${token.colorWord.en} ${token.nounWord.en}`;
}

export function assignToken(activeTokens: PatientToken[], rng: Rng): PatientToken {
  const used = new Set(activeTokens.map(tokenKey));
  const total = glyphs.length * colorWords.length * nounWords.length;

  if (used.size >= total) {
    throw new Error("No available display tokens remain.");
  }

  for (let attempt = 0; attempt < total * 2; attempt += 1) {
    const index = Math.floor(rng() * total) % total;
    const glyphIndex = Math.floor(index / (colorWords.length * nounWords.length));
    const colorIndex = Math.floor(index / nounWords.length) % colorWords.length;
    const nounIndex = index % nounWords.length;
    const token = {
      glyph: glyphs[glyphIndex],
      colorWord: colorWords[colorIndex],
      nounWord: nounWords[nounIndex]
    };

    if (!used.has(tokenKey(token))) {
      return token;
    }
  }

  for (const glyph of glyphs) {
    for (const colorWord of colorWords) {
      for (const nounWord of nounWords) {
        const token = { glyph, colorWord, nounWord };
        if (!used.has(tokenKey(token))) {
          return token;
        }
      }
    }
  }

  throw new Error("No available display tokens remain.");
}
