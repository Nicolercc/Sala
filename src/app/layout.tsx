import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sala",
  description: "Synthetic clinic check-in prototype"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html data-theme="light" lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
