"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Glyph } from "@/components/Glyph";
import { statusIcon, statusLabels } from "@/lib/status";
import type { View } from "@/policy/visibility";

type BoardView = View<"publicBoard">;

export function BoardDisplay({ feed }: { feed: string }) {
  const rows = useMemo(() => {
    const parsed = JSON.parse(feed) as BoardView[];
    return [...parsed].sort((a, b) => {
      if (a.status === "called" && b.status !== "called") return -1;
      if (a.status !== "called" && b.status === "called") return 1;
      return 0;
    });
  }, [feed]);
  const previousStatuses = useRef(new Map<string, string>());
  const [announcement, setAnnouncement] = useState("");
  const [changedToken, setChangedToken] = useState<string | null>(null);

  useEffect(() => {
    for (const row of rows) {
      const previous = previousStatuses.current.get(row.tokenLabel);
      if (previous && previous !== row.status) {
        setAnnouncement(`${row.tokenLabel}: ${statusLabels[row.status].en}`);
        setChangedToken(row.tokenLabel);
        window.setTimeout(() => setChangedToken(null), 300);
      }
      previousStatuses.current.set(row.tokenLabel, row.status);
    }
  }, [rows]);

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-surface-base px-4 py-8 text-text-primary" data-theme="dark">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-default">Public display</p>
            <h1 className="mt-2 text-5xl font-bold sm:text-7xl">Find your token</h1>
            <p className="mt-3 text-2xl text-text-secondary">Busque su símbolo y código.</p>
          </div>
          <div className="rounded-md border border-border-default bg-surface-raised px-5 py-4 text-right">
            <p className="text-lg font-semibold">Estimates are rough.</p>
            <p className="text-lg text-text-secondary">Los tiempos son aproximados.</p>
          </div>
        </div>
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <div className="grid gap-5">
          {rows.map((row) => (
            <article
              className={`grid gap-5 rounded-md border bg-surface-raised p-6 transition-colors lg:grid-cols-[minmax(210px,0.8fr)_minmax(260px,1.3fr)_minmax(250px,1fr)_minmax(220px,0.8fr)] lg:items-center ${
                row.status === "called" ? "border-status-called shadow-[0_0_0_2px_var(--status-called)]" : "border-border-default"
              } ${changedToken === row.tokenLabel ? "bg-accent-subtle" : ""}`}
              key={row.tokenLabel}
            >
              <div className="flex items-center gap-5 text-accent-default">
                <div className="grid h-24 w-24 place-items-center rounded-md border border-border-default bg-surface-base">
                  <Glyph glyph={row.glyph} size={68} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Symbol</p>
                  <p className="mt-1 text-2xl font-bold capitalize">{row.glyph}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Token</p>
                <p className="mt-1 text-5xl font-bold leading-none sm:text-6xl">{row.tokenLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Wait range</p>
                <p className="mt-1 text-3xl font-semibold">{row.waitRange.label.en}</p>
                <p className="mt-1 text-2xl text-text-secondary">{row.waitRange.label.es}</p>
                <div aria-hidden="true" className="mt-4 h-3 rounded-full bg-accent-subtle">
                  <div
                    className={`h-3 rounded-full ${
                      row.status === "called" ? "w-full bg-status-called" : "w-1/2 bg-accent-default"
                    }`}
                  />
                </div>
              </div>
              <p
                className={`inline-flex min-h-14 items-center justify-center rounded-full border px-5 text-2xl font-bold ${
                  row.status === "called"
                    ? "border-status-called bg-status-called/10 text-status-called"
                    : row.status === "in_room"
                      ? "border-status-in-room bg-status-in-room/10 text-status-in-room"
                      : "border-status-waiting bg-status-waiting/10 text-status-waiting"
              }`}
              >
                <span aria-hidden="true" className="mr-2">
                  {statusIcon(row.status)}
                </span>
                {statusLabels[row.status].en} / {statusLabels[row.status].es}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
