import { Glyph } from "@/components/Glyph";
import { displayContracts } from "@/policy/displayContract";
import type { GlyphId, Status } from "@/types/patient";

const glyphSamples: GlyphId[] = ["circle", "triangle", "square", "diamond", "hexagon", "star", "crescent", "leaf"];
const statuses: Array<{ label: string; status: Status; className: string }> = [
  { label: "Waiting", status: "waiting", className: "border-status-waiting bg-status-waiting/10 text-status-waiting" },
  { label: "Called", status: "called", className: "border-status-called bg-status-called/10 text-status-called" },
  { label: "In room", status: "in_room", className: "border-status-in-room bg-status-in-room/10 text-status-in-room" }
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Design system</p>
          <h1 className="mt-3 text-5xl font-bold">Sala handoff kit</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Component, token, and annotation examples for rebuilding the prototype in Figma and handing it to an
            engineering team.
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Annotation standard</p>
          <p className="mt-2 text-sm text-text-secondary">
            Every public surface must include an allowed-fields note, forbidden-fields note, live-region behavior, and
            reduced-motion behavior.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <TokenSection />
        <ComponentsSection />
        <AnnotationsSection />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <DisplayContractCard surface="publicBoard" />
        <DisplayContractCard surface="staffQueue" />
      </section>
    </main>
  );
}

function TokenSection() {
  return (
    <section className="panel p-5">
      <h2 className="text-2xl font-bold">Tokens</h2>
      <p className="mt-2 text-sm text-text-secondary">Glyph first, then bilingual word token.</p>
      <div className="mt-5 grid grid-cols-4 gap-3">
        {glyphSamples.map((glyph) => (
          <div className="grid min-h-24 place-items-center rounded-md border border-border-default bg-surface-base p-3" key={glyph}>
            <Glyph glyph={glyph} size={40} />
            <p className="mt-2 text-xs font-semibold capitalize text-text-secondary">{glyph}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComponentsSection() {
  return (
    <section className="panel p-5">
      <h2 className="text-2xl font-bold">Components</h2>
      <div className="mt-5 grid gap-4">
        <button className="button-primary justify-self-start" type="button">
          Primary action
        </button>
        <button className="button-secondary justify-self-start" type="button">
          Secondary action
        </button>
        <label className="label" htmlFor="sample-input">
          Input label <span className="font-normal text-text-secondary">(Required)</span>
        </label>
        <input className="field" id="sample-input" placeholder="Visible label, clear target" />
        <select className="field" defaultValue="en" aria-label="Sample select">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <span className={`rounded-full border px-3 py-2 text-sm font-semibold ${status.className}`} key={status.status}>
              {status.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnotationsSection() {
  const annotations = [
    "Board receives projected data only.",
    "No name, DOB, reason, provider, department, room, or service label appears on public displays.",
    "Live region announces status changes.",
    "Focus moves to the first invalid field on submit.",
    "Idle blur protects staff screens after 60 seconds.",
    "Reduced motion removes staggered privacy transitions."
  ];

  return (
    <section className="panel p-5">
      <h2 className="text-2xl font-bold">Annotations</h2>
      <ul className="mt-5 grid gap-3">
        {annotations.map((annotation) => (
          <li className="rounded-md border border-border-default bg-surface-base p-3 text-sm text-text-secondary" key={annotation}>
            {annotation}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DisplayContractCard({ surface }: { surface: "publicBoard" | "staffQueue" }) {
  const contract = displayContracts[surface];
  return (
    <section className="panel p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Display contract</p>
      <h2 className="mt-2 text-2xl font-bold">{contract.surface}</h2>
      <p className="mt-2 text-text-secondary">{contract.purpose}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <FieldList label="Allowed" values={contract.allowedFields} />
        <FieldList label="Forbidden" values={contract.forbiddenFields} />
      </div>
    </section>
  );
}

function FieldList({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span className="rounded-full border border-border-default bg-surface-base px-3 py-1 text-sm" key={value}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
