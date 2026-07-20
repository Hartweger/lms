// src/app/admin/nestpay-recurring-test/page.tsx
// Jeftin RECURRING test protiv NestPay TEST okruženja (Intesa, jul 2026).
// Pokreće test transakciju sa 3 recurring polja (3 naplate, dnevno) i prikazuje
// SVE callbackove koje banka pošalje na /api/nestpay/test-callback.
// Pristup čuva proxy (role=admin za /admin/*).
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecurringTestFields, NESTPAY_TEST } from "@/lib/nestpay-test";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function NestpayRecurringTestPage() {
  const admin = createAdminClient();
  const { data: callbacks } = await admin
    .from("nestpay_test_callbacks")
    .select("id, created_at, oid, method, hash_valid, proc_return_code, trans_id, params")
    .order("created_at", { ascending: false })
    .limit(100);

  const configured = Boolean(NESTPAY_TEST.merchantId && NESTPAY_TEST.storeKey);
  const callbackUrl = `${SITE_URL}/api/nestpay/test-callback`;
  const oid = `RECTEST-${Date.now()}`;
  const fields = configured
    ? buildRecurringTestFields({
        oid,
        amountRsd: 100,
        okUrl: callbackUrl,
        failUrl: callbackUrl,
        recurringPaymentNumber: 3,
        recurringFrequencyUnit: "D",
        recurringFrequency: 1,
      })
    : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">NestPay recurring — test okruženje</h1>
      <p className="text-gray-600 mb-6">
        Cilj: videti da li banka šalje callback i za naplate 2 i 3 (serija: 3 naplate,
        svaki dan po 100 RSD, testni novac). Svaki callback se upisuje u tabelu ispod.
      </p>

      {!configured && (
        <div className="border border-amber-400 bg-amber-50 text-amber-900 rounded p-4 mb-6">
          <p className="font-semibold">Nedostaje konfiguracija testnog okruženja.</p>
          <p className="text-sm mt-1">
            U Vercel env treba <code>NESTPAY_TEST_MERCHANT_ID</code> i{" "}
            <code>NESTPAY_TEST_STORE_KEY</code> (store key se očitava/podešava u testnom
            Merchant Centeru: 3D Gate → Store Key). Bez toga hash ne može da se izračuna.
          </p>
        </div>
      )}

      {fields && (
        <form method="POST" action={NESTPAY_TEST.paymentUrl} className="border rounded p-4 mb-8">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <p className="text-sm text-gray-600 mb-3">
            Nova test transakcija: <strong>{oid}</strong> — 100,00 RSD,{" "}
            RecurringPaymentNumber=3, RecurringFrequencyUnit=D, RecurringFrequency=1.
            Na bankinoj strani unesi <strong>testnu karticu</strong> (iz bankine
            dokumentacije), nikad pravu.
          </p>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Pokreni test recurring transakciju
          </button>
        </form>
      )}

      <h2 className="text-xl font-semibold mb-3">
        Primljeni callbackovi ({callbacks?.length ?? 0})
      </h2>
      {!callbacks?.length ? (
        <p className="text-gray-500">Još nijedan callback nije stigao.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">Vreme</th>
                <th className="text-left p-2 border-b">oid</th>
                <th className="text-left p-2 border-b">Metod</th>
                <th className="text-left p-2 border-b">ProcReturnCode</th>
                <th className="text-left p-2 border-b">TransId</th>
                <th className="text-left p-2 border-b">Potpis</th>
                <th className="text-left p-2 border-b">Detalji</th>
              </tr>
            </thead>
            <tbody>
              {callbacks.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="p-2 border-b whitespace-nowrap">
                    {new Date(c.created_at).toLocaleString("sr-RS")}
                  </td>
                  <td className="p-2 border-b">{c.oid ?? "—"}</td>
                  <td className="p-2 border-b">{c.method}</td>
                  <td className="p-2 border-b">
                    {c.proc_return_code === "00" ? (
                      <span className="text-green-700 font-semibold">00 (odobreno)</span>
                    ) : (
                      c.proc_return_code ?? "—"
                    )}
                  </td>
                  <td className="p-2 border-b">{c.trans_id ?? "—"}</td>
                  <td className="p-2 border-b">
                    {c.hash_valid === null ? "bez HASH" : c.hash_valid ? "validan" : (
                      <span className="text-red-600 font-semibold">NEVALIDAN</span>
                    )}
                  </td>
                  <td className="p-2 border-b">
                    <details>
                      <summary className="cursor-pointer text-blue-600">params</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-x-auto">
                        {JSON.stringify(c.params, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
