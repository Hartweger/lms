// Klijent za Google Apps Script web-app (grupni-webapp).
// Apps Script radi kao info@hartweger.rs i obavlja Google radnje (kalendar+Meet, beleške, prof Sheet).

interface GasResult { ok?: boolean; error?: string; [k: string]: unknown }

/** Pozovi Apps Script akciju. Baca grešku ako GAS nije podešen ili vrati grešku. */
export async function callGas(action: string, payload: Record<string, unknown>): Promise<GasResult> {
  const url = process.env.GAS_WEBAPP_URL;
  const secret = process.env.GAS_SECRET;
  if (!url || !secret) throw new Error("GAS_WEBAPP_URL/GAS_SECRET nisu podešeni");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, secret, ...payload }),
    redirect: "follow",
  });
  const text = await res.text();
  let json: GasResult;
  try { json = JSON.parse(text); } catch { throw new Error(`GAS nevažeći odgovor (${res.status}): ${text.slice(0, 120)}`); }
  if (!json.ok) throw new Error(json.error || "GAS greška");
  return json;
}
