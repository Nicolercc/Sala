import { displayContracts } from "@/policy/displayContract";

const evidence = [
  "The board route receives a serialized feed, not the full queue state.",
  "Projection tests fail if name, DOB, or visit reason enter the public payload.",
  "Browser tests verify empty storage and no third-party requests.",
  "Axe checks run across all routes in light, dark, and high-contrast themes.",
  "A display contract names allowed fields, forbidden fields, and proof for each surface."
];

const flow = [
  "Intake or EHR data is reduced to the minimum needed for in-clinic arrival.",
  "Sala issues a glyph and bilingual token that can be read aloud.",
  "Staff manage the queue and can switch on the privacy lens.",
  "The waiting-room board renders only glyph, token, wait range, and status."
];

const researchTasks = [
  "Check in a synthetic patient without moderator help.",
  "Find a token on the public board.",
  "Explain what changes when the privacy lens turns on.",
  "Describe the wait range as rough rather than promised."
];

export default function CaseStudyPage() {
  return (
    <main className="bg-surface-base text-text-primary">
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Portfolio case study</p>
          <h1 className="mt-3 text-5xl font-bold leading-tight">Sala designs privacy at the display boundary.</h1>
          <p className="mt-5 max-w-2xl text-xl text-text-secondary">
            A synthetic clinic arrival prototype for the layer after intake: the staff queue and public waiting-room
            board where privacy exposure can still happen.
          </p>
          <p className="mt-4 max-w-2xl text-text-secondary">
            This is a prototype, not a HIPAA-compliant product. The work demonstrates HIPAA-minded design choices:
            minimum necessary display, synthetic data, no persistence, no third-party requests, and tests around data
            leakage.
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Core boundary</p>
          <div className="mt-4 grid gap-3">
            <BoundaryStep label="Full synthetic patient record" tone="border-status-called text-status-called" />
            <BoundaryStep label="project(patient, surface)" tone="border-accent-default text-accent-default" />
            <BoundaryStep label="Serialized public board feed" tone="border-status-in-room text-status-in-room" />
            <BoundaryStep label="Glyph + token + wait + status" tone="border-status-waiting text-status-waiting" />
          </div>
        </div>
      </section>

      <section className="border-y border-border-default bg-surface-raised">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-4">
          <Metric label="Routes" value="5" />
          <Metric label="Public PHI fields" value="0" />
          <Metric label="Unit tests" value="22" />
          <Metric label="E2E checks" value="17+" />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
        <CasePanel title="User Flow" items={flow} />
        <CasePanel title="Evidence" items={evidence} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="panel grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Originality</p>
            <h2 className="mt-2 text-3xl font-bold">The product idea is a display contract, not another check-in form.</h2>
            <p className="mt-4 text-text-secondary">
              Patient intake and token boards already exist. Sala’s distinct contribution is making the public display
              contract visible, testable, and reviewable by non-engineers before sensitive workflow data reaches a room.
            </p>
          </div>
          <div className="grid gap-4">
            <ContractSummary surface="publicBoard" />
            <ContractSummary surface="staffQueue" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="panel grid gap-6 p-6 lg:grid-cols-3">
          <Decision
            title="Privacy lens"
            body="Staff can switch the queue into the same projected view the room sees. This makes the hidden data visible as a product decision, not just an implementation detail."
          />
          <Decision
            title="Accessible controls"
            body="The flow uses native inputs and selects, visible labels, inline errors, first-error focus, live regions, and reduced-motion handling."
          />
          <Decision
            title="Honest limits"
            body="No production health data, no claims of compliance, no backend, and no EHR integration. The prototype isolates one product risk and tests it."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 lg:grid-cols-2">
        <CasePanel title="Usability Plan" items={researchTasks} />
        <section className="panel p-6">
          <h2 className="text-3xl font-bold">Production Integration</h2>
          <p className="mt-4 text-text-secondary">
            In production, Sala would sit beside an EHR or patient-access platform. A server-side projection layer would
            map appointment state into a display-safe queue record. The board would never query the EHR directly.
          </p>
          <p className="mt-4 text-text-secondary">
            The public board would receive only a minimum-necessary feed scoped to one location. Staff could still use
            the source system for permitted workflows, but public devices would not receive names, DOB, reason, provider,
            department, room, payment state, insurance state, or free text.
          </p>
        </section>
      </section>
    </main>
  );
}

function BoundaryStep({ label, tone }: { label: string; tone: string }) {
  return <div className={`rounded-md border bg-surface-base p-4 text-lg font-semibold ${tone}`}>{label}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">{label}</p>
      <p className="mt-2 text-5xl font-bold">{value}</p>
    </div>
  );
}

function CasePanel({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="panel p-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <ol className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li className="grid grid-cols-[2.5rem_1fr] gap-3" key={item}>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-border-default font-bold">
              {index + 1}
            </span>
            <span className="pt-2 text-text-secondary">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Decision({ body, title }: { body: string; title: string }) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-3 text-text-secondary">{body}</p>
    </section>
  );
}

function ContractSummary({ surface }: { surface: "publicBoard" | "staffQueue" }) {
  const contract = displayContracts[surface];
  return (
    <section className="rounded-md border border-border-default bg-surface-base p-4">
      <h3 className="text-xl font-bold">{contract.surface}</h3>
      <p className="mt-2 text-sm text-text-secondary">{contract.purpose}</p>
      <p className="mt-4 text-sm font-semibold text-text-secondary">Allowed fields</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {contract.allowedFields.map((field) => (
          <span className="rounded-full border border-border-default px-3 py-1 text-sm" key={field}>
            {field}
          </span>
        ))}
      </div>
    </section>
  );
}
