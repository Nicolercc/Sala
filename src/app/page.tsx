"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Glyph } from "@/components/Glyph";
import { displayContracts } from "@/policy/displayContract";
import type { GlyphId } from "@/types/patient";

type DemoStatus = "waiting" | "called" | "desk" | "done";
type DemoPatient = {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  visit: string;
  language: string;
  arrivedMinutesAgo: number;
  status: DemoStatus;
  window?: number;
  glyph: GlyphId;
  tokenLabel: string;
  you?: boolean;
};

const seedPatients: DemoPatient[] = [
  { id: 1, firstName: "James", lastName: "Okafor", dob: "1975-11-02", visit: "Annual visit", language: "English", arrivedMinutesAgo: 24, status: "called", window: 1, glyph: "leaf", tokenLabel: "Jade Sparrow" },
  { id: 2, firstName: "Luis", lastName: "Fernandez", dob: "1968-01-09", visit: "Follow-up", language: "Español", arrivedMinutesAgo: 19, status: "waiting", glyph: "diamond", tokenLabel: "Jade Heron" },
  { id: 3, firstName: "Priya", lastName: "Nair", dob: "1992-06-27", visit: "Lab only", language: "English", arrivedMinutesAgo: 15, status: "waiting", glyph: "star", tokenLabel: "Coral Dove" },
  { id: 4, firstName: "Andre", lastName: "Baptiste", dob: "1983-04-18", visit: "Something else", language: "English", arrivedMinutesAgo: 12, status: "desk", glyph: "triangle", tokenLabel: "Olive Crane" }
];

const nextTokens: Array<Pick<DemoPatient, "glyph" | "tokenLabel">> = [
  { glyph: "hexagon", tokenLabel: "Indigo Pelican" },
  { glyph: "circle", tokenLabel: "Amber Heron" },
  { glyph: "crescent", tokenLabel: "Ruby Swan" }
];

const visitOptions = ["Annual visit", "Follow-up", "Lab only", "Something else"];

function boardStatus(patient: DemoPatient, waitingIndex: number): string {
  if (patient.status === "called") return `Go to window ${patient.window ?? 1}`;
  if (patient.status === "desk") return "Please see front desk";
  return waitingIndex === 0 ? "You're next" : "Waiting";
}

function waitRange(waitingIndex: number, status: DemoStatus): string {
  if (status === "called") return "Now";
  if (status === "desk") return "--";
  if (waitingIndex === 0) return "under 5 min";
  if (waitingIndex === 1) return "5-10 min";
  if (waitingIndex === 2) return "10-20 min";
  return "20-30 min";
}

function projectForBoard(patients: DemoPatient[]) {
  const waiting = patients.filter((patient) => patient.status === "waiting");
  return patients
    .filter((patient) => patient.status !== "done")
    .map((patient) => {
      const index = waiting.findIndex((item) => item.id === patient.id);
      return {
        id: patient.id,
        glyph: patient.glyph,
        tokenLabel: patient.tokenLabel,
        waitRange: waitRange(index, patient.status),
        status: boardStatus(patient, index)
      };
    });
}

export default function Home() {
  const [patients, setPatients] = useState(seedPatients);
  const [lensOn, setLensOn] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    visit: visitOptions[0],
    language: "English"
  });
  const [issued, setIssued] = useState<DemoPatient | null>(null);
  const [wallMode, setWallMode] = useState<"ok" | "blocked">("ok");
  const boardFeed = useMemo(() => projectForBoard(patients), [patients]);
  const lastPayload = boardFeed.find((item) => item.status.startsWith("Go to")) ?? boardFeed[0];
  const activePatients = patients.filter((patient) => patient.status !== "done");

  function checkIn() {
    const token = nextTokens[patients.length % nextTokens.length];
    const patient: DemoPatient = {
      id: Math.max(...patients.map((item) => item.id)) + 1,
      firstName: form.firstName.trim() || "Lina",
      lastName: form.lastName.trim() || "Campos",
      dob: form.dob || "1990-04-12",
      visit: form.visit,
      language: form.language,
      arrivedMinutesAgo: 0,
      status: "waiting",
      you: true,
      ...token
    };

    setPatients((current) => [...current, patient]);
    setIssued(patient);
    setStep(3);
    setWallMode("ok");
  }

  function setStatus(id: number, status: DemoStatus) {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === id
          ? {
              ...patient,
              status,
              window: status === "called" ? patient.window ?? 2 : undefined
            }
          : patient
      )
    );
    setWallMode("ok");
  }

  return (
    <main className="min-h-screen bg-[#eef2f1] text-[#14201f]">
      <section className="mx-auto max-w-[1560px] px-4 py-8 sm:px-7">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#0f5c63]">Sala</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.03em] text-[#0f5c63] sm:text-6xl">
              Privacy-first clinic arrival prototype
            </h1>
            <p className="mt-4 text-lg text-[#52605d]">
              Check in at the kiosk, watch the staff console update, then see exactly what the public waiting-room board
              is allowed to receive.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="button-secondary" href="/design-system">Design system</Link>
            <Link className="button-secondary" href="/case-study">Case study</Link>
            <button className="button-secondary" onClick={() => { setPatients(seedPatients); setIssued(null); setStep(0); setWallMode("ok"); }} type="button">
              Reset demo
            </button>
          </div>
        </div>

        <section aria-labelledby="behind-desk">
          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl font-bold" id="behind-desk">Behind the desk</h2>
            <p className="text-[#52605d]">Only patients and staff see these screens.</p>
          </div>
          <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
            <section className="overflow-hidden rounded-[14px] border border-[#d3dbd9] bg-white" aria-label="Check-in kiosk">
              <div className="flex items-center justify-between border-b border-[#d3dbd9] bg-[#f6f8f7] px-5 py-3">
                <h3 className="font-bold">Check-in kiosk</h3>
                <div className="rounded-full border border-[#d3dbd9] p-1 text-sm font-bold">
                  <button className="rounded-full bg-[#0f5c63] px-3 py-1 text-white" type="button">EN</button>
                  <button className="px-3 py-1 text-[#52605d]" type="button">ES</button>
                </div>
              </div>
              <div className="flex min-h-[560px] flex-col gap-5 p-6">
                {step === 0 ? (
                  <div className="flex flex-1 flex-col justify-center gap-5">
                    <div className="flex gap-2 text-[#0f5c63]">
                      {(["triangle", "circle", "square", "diamond", "star"] as GlyphId[]).map((glyph) => <Glyph glyph={glyph} key={glyph} size={30} />)}
                    </div>
                    <h3 className="text-4xl font-extrabold leading-tight">Check in for your visit</h3>
                    <p className="text-lg text-[#52605d]">
                      Takes about a minute. You’ll get a symbol to watch for. Your name never appears on the waiting-room screen.
                    </p>
                    <button className="button-primary self-start px-6 py-4 text-base" onClick={() => setStep(1)} type="button">Start check-in</button>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="grid gap-4">
                    <StepBar step={1} />
                    <h3 className="text-3xl font-extrabold">Who’s checking in?</h3>
                    <KioskField htmlFor="root-first-name" label="First name">
                      <input id="root-first-name" className="field min-h-[52px] w-full" onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} value={form.firstName} />
                    </KioskField>
                    <KioskField htmlFor="root-last-name" label="Last name">
                      <input id="root-last-name" className="field min-h-[52px] w-full" onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} value={form.lastName} />
                    </KioskField>
                    <KioskField htmlFor="root-dob" label="Date of birth">
                      <input id="root-dob" className="field min-h-[52px] w-full" onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))} type="date" value={form.dob} />
                    </KioskField>
                    <div className="mt-auto flex justify-between gap-3 border-t border-[#d3dbd9] pt-5">
                      <button className="button-secondary" onClick={() => setStep(0)} type="button">Back</button>
                      <button className="button-primary" onClick={() => setStep(2)} type="button">Continue</button>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-4">
                    <StepBar step={2} />
                    <h3 className="text-3xl font-extrabold">What’s the visit for?</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {visitOptions.map((visit) => (
                        <label className={`min-h-[78px] cursor-pointer rounded-xl border p-4 ${form.visit === visit ? "border-[#0f5c63] bg-[#dfeeee]" : "border-[#d3dbd9] bg-white"}`} data-testid={`visit-option-${visit.toLowerCase().replaceAll(" ", "-")}`} key={visit}>
                          <input checked={form.visit === visit} className="sr-only" name="visit" onChange={() => setForm((current) => ({ ...current, visit }))} type="radio" />
                          <span className="font-bold">{visit}</span>
                          <span className="mt-1 block text-sm text-[#52605d]">{visit === "Something else" ? "The front desk will help" : "Staff-only context"}</span>
                        </label>
                      ))}
                    </div>
                    <KioskField htmlFor="root-language" label="Language at the desk">
                      <select id="root-language" className="field min-h-[52px] w-full" onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} value={form.language}>
                        <option>English</option>
                        <option>Español</option>
                        <option>Another language</option>
                      </select>
                    </KioskField>
                    <p className="rounded-lg bg-[#dfeeee] p-3 font-semibold text-[#0f5c63]">
                      The waiting-room screen will show only your symbol, wait estimate, and status.
                    </p>
                    <div className="mt-auto flex justify-between gap-3 border-t border-[#d3dbd9] pt-5">
                      <button className="button-secondary" onClick={() => setStep(1)} type="button">Back</button>
                      <button className="button-primary" onClick={checkIn} type="button">Confirm check-in</button>
                    </div>
                  </div>
                ) : null}

                {step === 3 && issued ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                    <h3 className="text-3xl font-extrabold">You’re checked in</h3>
                    <div className="rounded-3xl border border-[#d3dbd9] bg-[#f6f8f7] px-9 py-7">
                      <div className="mx-auto flex justify-center text-[#0f5c63]"><Glyph glyph={issued.glyph} size={84} /></div>
                      <p className="mt-4 text-4xl font-extrabold" data-testid="root-issued-token">{issued.tokenLabel}</p>
                      <p className="mt-2 text-sm text-[#52605d]">Your waiting-room symbol</p>
                    </div>
                    <p className="max-w-sm text-lg text-[#52605d]">Watch the waiting-room screen for {issued.tokenLabel}. Your name will not be shown.</p>
                    <button className="button-primary" onClick={() => { setStep(0); setIssued(null); setForm({ firstName: "", lastName: "", dob: "", visit: visitOptions[0], language: "English" }); }} type="button">
                      Done
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <StaffConsole activePatients={activePatients} lensOn={lensOn} setLensOn={setLensOn} setStatus={setStatus} />
          </div>
        </section>

        <section className="my-7 grid gap-6 rounded-2xl bg-[#0b1416] p-6 text-white lg:grid-cols-[1fr_1.35fr_0.9fr]" aria-labelledby="wall-title">
          <div>
            <h2 className="text-2xl font-bold" id="wall-title">The wall</h2>
            <p className="mt-2 text-[#a9bac1]">
              The waiting-room screen gets a smaller record built from the staff one. These fields stay behind the desk:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {displayContracts.publicBoard.forbiddenFields.map((field) => (
                <span className="rounded-md border border-[#2a3c40] px-2 py-1 font-mono text-sm text-[#7f9296] line-through" key={field}>{field}</span>
              ))}
            </div>
          </div>
          <pre className={`min-h-44 overflow-x-auto whitespace-pre-wrap rounded-xl border bg-[#0f1f22] p-4 font-mono text-sm leading-7 ${wallMode === "blocked" ? "border-[#ff8a80]" : "border-[#23383c]"}`}>
            {wallMode === "blocked" ? JSON.stringify({ ...lastPayload, firstName: issued?.firstName ?? "Lina", lastName: issued?.lastName ?? "Campos" }, null, 2) : JSON.stringify(lastPayload, null, 2)}
          </pre>
          <div className="flex flex-col items-start gap-3">
            <button className="rounded-md border border-[#4c6a6f] px-4 py-3 font-bold text-white" onClick={() => setWallMode("blocked")} type="button">Try to send a name</button>
            <p className={wallMode === "blocked" ? "font-bold text-[#ff9c8f]" : "font-bold text-[#7ee2a8]"}>
              {wallMode === "blocked" ? "Blocked. firstName and lastName are not in the waiting-room contract, so the board is unchanged." : `Sent: ${displayContracts.publicBoard.allowedFields.length} fields. Nothing else crossed.`}
            </p>
          </div>
        </section>

        <section aria-labelledby="waiting-room">
          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl font-bold" id="waiting-room">Waiting room</h2>
            <p className="text-[#52605d]">Everyone in the room can see this screen.</p>
          </div>
          <div className="rounded-[18px] border-[10px] border-[#050a0c] bg-[#0e1a1f] p-6 text-white shadow-2xl">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-4xl font-extrabold">Now serving</h3>
                <p className="mt-1 text-[#a9bac1]">Riverside Family Clinic</p>
              </div>
              <p className="text-right text-[#a9bac1]">Wait times are estimates</p>
            </div>
            <BoardGroup items={boardFeed.filter((item) => item.status.startsWith("Go to"))} title="Called" />
            <BoardGroup items={boardFeed.filter((item) => !item.status.startsWith("Go to"))} title="Waiting" />
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[#23383c] pt-4 text-[#a9bac1]">
              <span>Don’t see your symbol? Ask the front desk.</span>
              <span lang="es">¿No ve su símbolo? Pregunte en recepción.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function StaffConsole({ activePatients, lensOn, setLensOn, setStatus }: {
  activePatients: DemoPatient[];
  lensOn: boolean;
  setLensOn: (value: boolean) => void;
  setStatus: (id: number, status: DemoStatus) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#d3dbd9] bg-white" aria-labelledby="staff-console">
      <div className="flex items-center justify-between gap-3 border-b border-[#d3dbd9] bg-[#f6f8f7] px-5 py-3">
        <div>
          <h3 className="font-bold" id="staff-console">Staff console</h3>
          <p className="text-sm text-[#52605d]">Front desk · Riverside Family Clinic</p>
        </div>
        <button aria-pressed={lensOn} className={`rounded-full border px-4 py-2 font-bold ${lensOn ? "border-[#0f5c63] bg-[#dfeeee] text-[#0f5c63]" : "border-[#d3dbd9] bg-white"}`} onClick={() => setLensOn(!lensOn)} type="button">
          Privacy lens: {lensOn ? "on" : "off"}
        </button>
      </div>
      <div className="flex flex-wrap gap-5 border-b border-[#d3dbd9] px-5 py-4 text-[#52605d]">
        <span><b className="mr-1 text-2xl text-[#14201f]">{activePatients.filter((p) => p.status === "waiting").length}</b>waiting</span>
        <span><b className="mr-1 text-2xl text-[#14201f]">{activePatients.filter((p) => p.status === "called").length}</b>called</span>
        <span><b className="mr-1 text-2xl text-[#14201f]">{activePatients.filter((p) => p.status === "desk").length}</b>at desk</span>
      </div>
      {lensOn ? <p className="border-b border-[#d3dbd9] bg-[#dfeeee] px-5 py-3 font-bold text-[#0f5c63]" data-testid="root-lens-banner">Identifiers hidden. This is what staff can safely show while a patient is standing nearby.</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f6f8f7] text-xs uppercase tracking-[0.04em] text-[#52605d]">
              <th className="p-3">Token</th><th className="p-3">Patient</th><th className="p-3">Date of birth</th><th className="p-3">Visit</th><th className="p-3">Arrived</th><th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activePatients.map((patient) => (
              <tr className={patient.you ? "bg-[#fff4e0]" : ""} key={patient.id}>
                <td className="border-t border-[#d3dbd9] p-3 font-bold"><span className="inline-flex items-center gap-2"><Glyph glyph={patient.glyph} size={22} />{patient.tokenLabel}</span></td>
                <td className="border-t border-[#d3dbd9] p-3 font-bold">
                  {lensOn ? `${patient.firstName[0]}. ${patient.lastName[0]}.` : `${patient.firstName} ${patient.lastName}`}
                  {patient.you ? <span className="ml-2 rounded bg-[#f5c542] px-2 py-0.5 text-xs">You</span> : null}
                  {!lensOn && patient.language !== "English" ? <span className="block text-sm font-normal text-[#52605d]">{patient.language} at the desk</span> : null}
                </td>
                <td className="border-t border-[#d3dbd9] p-3">{lensOn ? "••••" : patient.dob}</td>
                <td className="border-t border-[#d3dbd9] p-3">{lensOn ? "••••" : patient.visit}</td>
                <td className="border-t border-[#d3dbd9] p-3">{patient.arrivedMinutesAgo || "Just now"} min</td>
                <td className="border-t border-[#d3dbd9] p-3"><StatusPill patient={patient} /></td>
                <td className="border-t border-[#d3dbd9] p-3">
                  <div className="flex gap-2">
                    {patient.status !== "called" ? <button className="button-secondary min-h-9 px-3 py-1" onClick={() => setStatus(patient.id, "called")} type="button">Call</button> : <button className="button-secondary min-h-9 px-3 py-1" onClick={() => setStatus(patient.id, "done")} type="button">Done</button>}
                    {patient.status === "waiting" ? <button className="button-secondary min-h-9 px-3 py-1" onClick={() => setStatus(patient.id, "desk")} type="button">Needs desk</button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#d3dbd9] px-5 py-3 text-sm text-[#52605d]">Screen locks after 60 seconds without activity. Synthetic patients, plus anyone you check in.</p>
    </section>
  );
}

function StepBar({ step }: { step: number }) {
  return <div className="flex items-center gap-2 text-sm text-[#52605d]"><span>Step {step} of 3</span>{[1, 2, 3].map((item) => <span className={`h-1 w-9 rounded ${item <= step ? "bg-[#0f5c63]" : "bg-[#d3dbd9]"}`} key={item} />)}</div>;
}

function KioskField({ children, htmlFor, label }: { children: React.ReactNode; htmlFor: string; label: string }) {
  return (
    <div className="grid gap-2 font-semibold">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ patient }: { patient: DemoPatient }) {
  const label = patient.status === "called" ? `Called · window ${patient.window ?? 1}` : patient.status === "desk" ? "See front desk" : patient.status === "done" ? "Done" : "Waiting";
  const tone = patient.status === "called" ? "bg-[#e6f6ec] text-[#067647]" : patient.status === "desk" ? "bg-[#fef1ef] text-[#b42318]" : "bg-[#e9eeec] text-[#344054]";
  return <span className={`rounded-full px-3 py-1 text-sm font-bold ${tone}`}>{label}</span>;
}

function BoardGroup({ items, title }: { items: Array<{ id: number; glyph: GlyphId; tokenLabel: string; waitRange: string; status: string }>; title: string }) {
  return (
    <section className="mb-5">
      <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-[#a9bac1]">{title}</p>
      <div className={`grid gap-4 ${title === "Called" ? "lg:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {items.length ? items.map((item) => (
          <article className={`rounded-[14px] border-2 p-5 ${item.status.startsWith("Go to") ? "border-[#f5c542] bg-[#0f4c52]" : "border-transparent bg-[#17272e]"}`} key={item.id}>
            <div className="flex items-center gap-4"><Glyph glyph={item.glyph} size={item.status.startsWith("Go to") ? 52 : 42} /><p className="text-3xl font-extrabold">{item.tokenLabel}</p></div>
            <div className="mt-4 flex flex-wrap justify-between gap-3"><p className="text-xl font-bold text-white">{item.status}</p><p className="text-lg text-[#a9bac1]">{item.waitRange === "Now" ? item.waitRange : `Est. ${item.waitRange}`}</p></div>
          </article>
        )) : <p className="text-[#a9bac1]">No one called right now.</p>}
      </div>
    </section>
  );
}
