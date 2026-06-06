export interface GrupaRaspored {
  nivo: string;
  prof: string;
  status: string;
  pocetak: string;
  trajanje: string;
  dani: string;
  sat: string;
  maks: string;
  upisanih: string;
  slobodnih: string;
}

const RASPORED_URL =
  "https://script.google.com/macros/s/AKfycbym5mwZiEC0ZBrG7WNL97-pRHvRc5IUwIvE7LcwzsmpuXnf0PtbuxIf7LyuVMWHXlLjAA/exec?callback=x&refresh=1";

export async function fetchRaspored(): Promise<GrupaRaspored[]> {
  const res = await fetch(RASPORED_URL, { next: { revalidate: 600 } });
  const text = await res.text();

  // JSONP: strip "x(" prefix and ")" suffix
  const jsonStr = text.replace(/^x\(/, "").replace(/\)$/, "");
  const data: GrupaRaspored[] = JSON.parse(jsonStr);

  return data;
}
