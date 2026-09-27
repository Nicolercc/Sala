"use client";

import { useMemo, useState } from "react";
import { Glyph } from "@/components/Glyph";
import { IdleBlur } from "@/components/IdleBlur";
import { getBoardFeed } from "@/feeds/board";
import { formatTime, reasonLabels } from "@/lib/format";
import { statusIcon, statusLabels } from "@/lib/status";
import { project } from "@/policy/visibility";
import { useNow, usePatients } from "@/store/patients";
import type { Status } from "@/types/patient";

const statuses: Status[] = ["waiting", "called", "in_room", "done"];
const statusTone: Record<Status, string> = {
  waiting: "text-status-waiting bg-status-waiting/10 border-status-waiting/40",
  called: "text-status-called bg-status-called/10 border-status-called/40",
  in_room: "text-status-in-room bg-status-in-room/10 border-status-in-room/40",
  done: "text-text-secondary bg-accent-subtle border-border-default"
};

export default function StaffPage() {
  const { patients, setStatus } = usePatients();
  const now = useNow();
  const [lensOn, setLensOn] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const rows = useMemo(() => {
    return [...patients]
      .map((patient) => ({
        id: patient.id,
        status: patient.status,
        language: patient.language,
        staffView: project(patient, "staffQueue", now, patients),
        boardView: project(patient, "publicBoard", now, patients)
      }))
      .sort((a, b) => b.staffView.waitMinutes - a.staffView.waitMinutes);
  }, [now, patients]);

  const counts = useMemo(() => {
    return {
      waiting: patients.filter((patient) => patient.status === "waiting").length,
      called: patients.filter((patient) => patient.status === "called").length,
      inRoom: patients.filter((patient) => patient.status === "in_room").length,
      done: patients.filter((patient) => patient.status === "done").length
    };
  }, [patients]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <IdleBlur>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Front desk surface</p>
            <h1 className="mt-2 text-4xl font-bold">Staff queue</h1>
            <p className="mt-3 max-w-2xl text-lg text-text-secondary">
              Manage arrival status while checking the exact public display shape before anyone looks at the board.
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-sm font-semibold text-text-secondary">Privacy lens</p>
            <p className="mt-1 text-sm text-text-secondary">
              Toggle from staff view to the same projected fields sent to the public board.
            </p>
            <button
              aria-pressed={lensOn}
              className={`mt-3 w-full ${lensOn ? "button-primary" : "button-secondary"}`}
              onClick={() => {
                const next = !lensOn;
                setLensOn(next);
                setAnnouncement(next ? "Showing what the waiting room sees" : "Showing staff queue details");
              }}
              type="button"
            >
              {lensOn ? "Showing public-safe view" : "See what the room sees"}
            </button>
          </div>
        </div>
        <section className="mb-6 grid gap-3 sm:grid-cols-4" aria-label="Queue summary">
          <SummaryCard label="Waiting" value={counts.waiting} tone="text-status-waiting" />
          <SummaryCard label="Called" value={counts.called} tone="text-status-called" />
          <SummaryCard label="In room" value={counts.inRoom} tone="text-status-in-room" />
          <SummaryCard label="Done" value={counts.done} tone="text-text-secondary" />
        </section>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        {lensOn ? (
          <div className="mb-4 rounded-md border border-accent-default bg-accent-subtle p-4">
            <p className="font-semibold">Public-safe lens is on.</p>
            <p className="mt-1 text-sm text-text-secondary">
              Name, DOB, reason, and exact arrival time are removed from the working surface. Remaining cells match the
              serialized board feed.
            </p>
          </div>
        ) : null}
        <div className="panel overflow-x-auto">
          <table className="min-w-[880px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default">
                {["Name or token", "Token", "DOB", "Reason", "Arrived", "Wait", "Status"].map((heading) => (
                  <th className="px-4 py-3 text-sm font-semibold text-text-secondary" key={heading} scope="col">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statusText = `${statusLabels[row.status].en} / ${statusLabels[row.status].es}`;
                return (
                  <tr className="border-b border-border-default last:border-0" key={row.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{lensOn ? row.boardView.tokenLabel : row.staffView.fullName}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {lensOn ? "Board identifier only" : `${row.staffView.waitMinutes} minutes since arrival`}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-md border border-border-default bg-surface-base px-3 py-2">
                        <Glyph glyph={row.staffView.glyph} size={26} />
                        {row.staffView.tokenLabel}
                      </span>
                    </td>
                    <td className={`px-4 py-4 transition-opacity duration-200 ${lensOn ? "opacity-0" : "opacity-100"}`}>
                      {row.staffView.dobMasked}
                    </td>
                    <td className={`px-4 py-4 transition-opacity delay-[60ms] duration-200 ${lensOn ? "opacity-0" : "opacity-100"}`}>
                      {reasonLabels[row.staffView.reason]}
                    </td>
                    <td className={`px-4 py-4 transition-opacity delay-[120ms] duration-200 ${lensOn ? "opacity-0" : "opacity-100"}`}>
                      {formatTime(row.staffView.arrivedAt)}
                    </td>
                    <td className="px-4 py-4">{lensOn ? row.boardView.waitRange.label[row.language] : `${row.staffView.waitMinutes} min`}</td>
                    <td className="px-4 py-4">
                      {lensOn ? (
                        <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-semibold ${statusTone[row.status]}`}>
                          <span aria-hidden="true" className="mr-2">
                            {statusIcon(row.boardView.status)}
                          </span>
                          {statusText}
                        </span>
                      ) : (
                        <label className="sr-only" htmlFor={`status-${row.id}`}>
                          Status for {row.staffView.fullName}
                        </label>
                      )}
                      {!lensOn ? (
                        <select
                          className="field"
                          id={`status-${row.id}`}
                          onChange={(event) => setStatus(row.id, event.target.value as Status)}
                          value={row.status}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status].en}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-text-secondary">
          Lens check: {JSON.parse(getBoardFeed(patients, now)).length} public rows match the waiting-room feed.
        </p>
      </IdleBlur>
    </main>
  );
}

function SummaryCard({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
