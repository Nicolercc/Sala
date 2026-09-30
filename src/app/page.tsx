import type { Metadata } from "next";
import { SalaHome } from "./SalaHome";

export const metadata: Metadata = {
  title: "Sala — privacy-first clinic arrival prototype",
  description: "Synthetic clinic check-in prototype"
};

export default function Page() {
  return <SalaHome />;
}
