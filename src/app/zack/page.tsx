// Prijava deteta: kod koji je dobilo od roditelja plus PIN. Bez mejla i bez
// ijednog imena škole - ovo je detetov ekran. Deca sa starim direktnim
// linkom i dalje ulaze pravo na /zack/<childId>, ova stranica ih ne dira.
import PrijavaDeteta from "./PrijavaDeteta";
import { UskiStub } from "./Ukras";

export default function ZackPrijavaPage() {
  return (
    <UskiStub>
      <PrijavaDeteta />
    </UskiStub>
  );
}
