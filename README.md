# Sala

A front-desk check-in prototype for clinics where the visit itself is sensitive. Staff see what they need. The waiting room sees a glyph, a token, a wait range, and a status. Nothing else.

**Live demo:** [LIVE_URL] · **Design file:** [FIGMA_URL] · **Research findings:** [FINDINGS_URL]

All data is synthetic. No real patient information was used at any point.

## The idea

Sala focuses on the in-clinic arrival and waiting-room display layer, where privacy exposure can still happen even when intake is handled elsewhere. One patient record renders differently on each surface. The public board never receives names, dates of birth, or visit reasons, because its data source only ever contains projected fields. A test fails if that changes.

The core product idea is a display contract: each surface names the fields it is allowed to show, the fields it is forbidden to show, and the tests that prove the contract.

## Routes

- `/checkin`: front-desk form for adding an arriving patient to the synthetic queue.
- `/staff`: full front-desk queue with masked DOB, visit reason, status changes, and the waiting-room lens.
- `/board`: public waiting-room board with glyph, token, wait range, and status only.
- `/design-system`: component, token, annotation, and display-contract reference for Figma handoff.
- `/case-study`: portfolio-ready explanation of the flow, privacy boundary, accessibility decisions, and test evidence.

## Privacy design

| ID | Requirement | Enforced by |
| --- | --- | --- |
| PR-1 | Board payload contains only glyph, tokenLabel, waitRange, status | Feed and policy tests on the serialized string |
| PR-2 | All data synthetic, fixed seed | `src/lib/seed.ts` |
| PR-3 | Fixtures contain no SSN, phone, email, or MRN-like patterns | Unit test |
| PR-4 | No browser storage used | E2E test after a full flow |
| PR-5 | No patient fields in logs | `src/lib/logger.ts` redacts known keys; lint bans `console.log` |
| PR-6 | No third-party requests | E2E test that fails on another origin |
| PR-7 | DOB masked on staff view | Visibility policy |
| PR-8 | Idle blur at 60s | E2E test with a mocked clock |
| PR-9 | Lens output equals board output for every patient | Unit test |

## Accessibility

The prototype uses visible labels, native form controls, keyboard-operable status changes, visible focus rings, and text plus icons for status. Touch targets are at least 24 CSS pixels. Check-in asks for each field once, matching WCAG 3.3.7. The e2e suite runs axe on every route in light, dark, and high-contrast themes.

## Research and Privacy Docs

- `docs/PRIVACY_MODEL.md`: assets, risks, controls, integration story, and limits.
- `docs/USABILITY_PLAN.md`: quick moderated session plan using synthetic data only.
- `src/policy/displayContract.ts`: allowed fields, forbidden fields, and proof for each display surface.

## Running it

Install dependencies:

```bash
pnpm install
```

Run locally:

```bash
pnpm dev
```

Check the project:

```bash
pnpm check
```

## Tests

Unit tests cover:

- visibility projection for each surface
- board feed privacy
- token uniqueness and determinism
- wait range math
- synthetic fixture safety
- reducer actions and validation
- staff lens output matching the board feed
- design token coverage by theme
- display contract alignment with the projection policy

E2E tests cover:

- visiting all routes
- keyboard check-in reaching the board
- keyboard status changes and the staff lens
- empty browser storage after a full flow
- no third-party requests
- axe checks in light, dark, and high-contrast themes
- idle blur and resume behavior
- case study and design system accessibility checks in all three themes

## Production Integration

In production, Sala would sit beside an EHR or patient-access platform. A server-side projection layer would map appointment and arrival state into a display-safe queue record. The public board would never query the EHR directly. It would receive only a minimum-necessary feed scoped to a location.

## What this is not

A prototype, not a product. It has no authentication, backend, or persistence, and it is not HIPAA compliant; compliance is a legal and organizational status. A production version would need a risk analysis, business associate agreements, role-based access with audit logging, encryption in transit and at rest, and a display-only role that the server never sends PHI to.
