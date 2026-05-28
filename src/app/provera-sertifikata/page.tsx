import type { Metadata } from "next";
import ProveraForma from "./ProveraForma";

export const metadata: Metadata = {
  title: "Provera sertifikata — Hartweger",
  description:
    "Proverite validnost sertifikata iz Hartweger škole nemačkog jezika.",
};

export default function ProveraSertifikataPage() {
  return <ProveraForma />;
}
