// src/lib/belgrade-date.ts
// „Važi do" iz admin forme je samo datum (YYYY-MM-DD). Kupon treba da važi ceo taj dan
// po Beogradu, pa se pravi ISO string 23:59:59 sa offsetom koji Beograd ima TOG dana
// (leti +02:00, zimi +01:00). Postgres timestamptz ga čita direktno.

export function krajDanaBeograd(datum: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error(`Loš datum: ${datum}`);
  const podne = new Date(`${datum}T12:00:00Z`);
  const delovi = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Belgrade", timeZoneName: "shortOffset" }).formatToParts(podne);
  const tz = delovi.find((d) => d.type === "timeZoneName")?.value ?? "GMT+1"; // npr. "GMT+2"
  const sati = Number(tz.replace("GMT", "")) || 0;
  const znak = sati >= 0 ? "+" : "-";
  const hh = String(Math.abs(sati)).padStart(2, "0");
  return `${datum}T23:59:59${znak}${hh}:00`;
}
