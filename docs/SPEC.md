# Sala spec

A clinic front-desk check-in prototype. One patient record renders differently on each surface, and the data boundary makes leaking a sensitive field impossible by accident. Synthetic data only.

## Routes

| Route | Who | Shows |
| --- | --- | --- |
| `/checkin` | Front-desk staff | Form to add an arriving patient |
| `/staff` | Front-desk staff | Full queue, status changes, the "See what the room sees" lens |
| `/board` | Everyone in the waiting room | Glyph, token, wait range, status. Nothing else. |

A header toggle (Staff / Board) stands in for authentication. A persistent banner reads: "Demo with synthetic data. No real patient information." A "Reset demo" button restores the seed.

## Data model

```ts
type Status = "waiting" | "called" | "in_room" | "done";
type Language = "en" | "es";
type VisitReason = "annual_exam" | "follow_up" | "consultation" | "other";

type Patient = {
  id: string;          // uuid, never displayed
  firstName: string;
  lastName: string;
  dob: string;         // ISO date
  reason: VisitReason;
  arrivedAt: string;   // ISO datetime
  status: Status;
  language: Language;  // chosen at check-in, sets token language
  token: { glyph: GlyphId; colorWord: WordPair; nounWord: WordPair };
};
```

## Visibility policy

```ts
// src/policy/visibility.ts
export const surfaces = {
  publicBoard: ["glyph", "tokenLabel", "waitRange", "status"],
  staffQueue: ["fullName", "tokenLabel", "glyph", "dobMasked", "reason", "arrivedAt", "waitMinutes", "status"],
} as const;
```

- `project(patient, surface, now)` returns only the keys listed for that surface. Deny by default.
- Derived fields: `fullName`, `tokenLabel` (in the patient's language), `dobMasked` (`**/**/1987`), `waitMinutes`, `waitRange`.
- Components receive `View<S>`, never `Patient`.

## Board feed (the boundary)

```ts
// src/feeds/board.ts
export function getBoardFeed(patients: Patient[], now: Date): string {
  return JSON.stringify(patients.filter(isActive).map(p => project(p, "publicBoard", now)));
}
```

`/board` parses this string and renders from it. It never imports the store. This mirrors a real `/api/board` endpoint serving a display-only device.

## Tokens

- Glyph first. 8 glyphs: circle, triangle, square, diamond, hexagon, star, crescent, leaf. Each is inline SVG, `aria-hidden`, with a text label beside it.
- Word pairs, translated as pairs. English order is color then noun ("Amber Heron"). Spanish order is noun then color ("Garza Ámbar"). Colors are nouns used as adjectives, so Spanish never needs gender agreement.
- Colors: Amber/Ámbar, Coral/Coral, Jade/Jade, Indigo/Índigo, Olive/Oliva, Pearl/Perla, Ruby/Rubí, Sage/Salvia.
- Nouns: Heron/Garza, Dove/Paloma, Falcon/Halcón, Crane/Grulla, Pelican/Pelícano, Sparrow/Gorrión, Lark/Alondra, Swan/Cisne.
- The owner reviews the Spanish before shipping.
- Tokens are unique among active patients (glyph + color + noun). Retired when status becomes `done`.
- Generation is deterministic from the seed so tests are stable.

## Wait range

A simple, labeled heuristic on synthetic data, not a prediction.

- `ahead` = active patients with status `waiting` who arrived earlier.
- Low = `ahead * 8` minutes. High = `ahead * 15 + 5` minutes. Round both to the nearest 5.
- If `ahead` is 0: "Next up" / "Es su turno pronto".
- Display: "About 10 to 20 min" / "Aprox. 10 a 20 min", plus a decorative range bar (`aria-hidden`).
- A footnote on the board: "Estimates are rough." / "Los tiempos son aproximados."

## Status labels (bilingual, text plus icon)

| Status | English | Spanish | Shown on board |
| --- | --- | --- | --- |
| waiting | Waiting | Esperando | Yes |
| called | Your turn | Es su turno | Yes |
| in_room | In room | En consulta | Yes |
| done | Done | Listo | No (removed) |

## Screens

**`/checkin`**
- Fields: first name, last name, date of birth, reason (select), preferred language (English / Español), arrival time (prefilled, editable).
- Zod validation. Visible labels. Required marked in text. Inline errors announced. Focus moves to the first error on submit.
- Success: a confirmation card with the glyph and token, large enough to read aloud.
- Never asks for the same information twice (WCAG 3.3.7).

**`/staff`**
- Table sorted by longest wait. Columns: name, token, DOB (masked), reason, arrived, wait, status.
- Status change per row with a native select. Keyboard operable.
- "See what the room sees" toggle. Each row switches to the output of `project(p, "publicBoard", now)`. Hidden fields fade out one by one (200ms each, 60ms stagger). Instant under reduced motion. Announce the change in a polite live region.
- Idle blur after 60 seconds with no input on `/staff` and `/checkin`. A "Resume" button restores the view and receives focus.

**`/board`**
- Large type. Rows: glyph, token, wait range, status.
- Dark wall-display mode (`data-theme="dark"`), readable at 1920px.
- On status change: one 300ms highlight, none under reduced motion. `aria-live="polite"` announces "Amber Heron: Your turn".
- No names, initials, reasons, service labels, or free text. Ever.

## Design tokens (match Figma variable names exactly)

`surface/base`, `surface/raised`, `text/primary`, `text/secondary`, `border/default`, `accent/default`, `accent/subtle`, `focus/ring`, `status/waiting`, `status/called`, `status/in-room`.
Modes via `data-theme`: `light`, `dark`, `high-contrast`. CSS custom properties in `src/styles/tokens.css`, mapped into the Tailwind theme.

## Privacy requirements

| ID | Requirement | Enforced by |
| --- | --- | --- |
| PR-1 | Board payload contains only glyph, tokenLabel, waitRange, status | Feed test on the serialized string |
| PR-2 | All data synthetic, fixed seed | `seed.ts` |
| PR-3 | Fixtures contain no SSN, phone, email, or MRN-like patterns | Unit test |
| PR-4 | No browser storage used | E2E test after a full flow |
| PR-5 | No patient fields in logs | `logger.ts` redacts known keys; lint bans `console.log` |
| PR-6 | No third-party requests | E2E test that fails on any request to another origin |
| PR-7 | DOB masked on staff view | Policy |
| PR-8 | Idle blur at 60s | E2E with a mocked clock |
| PR-9 | Lens output equals board output for every patient | Unit test |

## Tests

- Unit: `project()` per surface; token uniqueness and determinism; wait range math; fixture patterns; reducer; lens equals board.
- Feed: for every seeded patient, the serialized board feed contains none of their first name, last name, DOB, or reason.
- E2E: keyboard-only check-in reaches the board; axe finds zero violations on all three routes in light and dark; storage is empty after a full flow; no third-party requests; idle blur.

## Non-goals

Authentication, backend, database, persistence, insurance, scheduling, EHR integration, AI features on patient data. Do not claim "HIPAA compliant" anywhere.
