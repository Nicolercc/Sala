"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PatientProvider, usePatients } from "@/store/patients";

function Header() {
  const pathname = usePathname();
  const { resetDemo } = usePatients();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="border-b border-border-default bg-surface-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-text-secondary">Sala</p>
          <p className="text-sm text-text-secondary">Demo with synthetic data. No real patient information.</p>
        </div>
        <nav aria-label="Main views" className="flex flex-wrap items-center gap-2">
          {[
            ["Check-in", "/checkin"],
            ["Staff", "/staff"],
            ["Board", "/board"],
            ["Design system", "/design-system"],
            ["Case study", "/case-study"]
          ].map(([label, href]) => (
            <Link
              aria-current={pathname === href ? "page" : undefined}
              className="nav-link"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Theme
            <select
              className="field max-w-[11rem]"
              defaultValue="light"
              onChange={(event) => {
                document.documentElement.dataset.theme = event.target.value;
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="high-contrast">High contrast</option>
            </select>
          </label>
          <button className="button-secondary" onClick={resetDemo} type="button">
            Reset demo
          </button>
        </nav>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PatientProvider>
      <Header />
      {children}
    </PatientProvider>
  );
}
