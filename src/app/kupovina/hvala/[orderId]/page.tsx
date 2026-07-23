import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { firstLessonForOrder } from "@/lib/first-lesson";
import { BANK_DETAILS, PAYPAL_ME_URL, buildIpsString } from "@/lib/order-utils";
import { MERCHANT, CARD_OUTCOME, nestpayTxData, pdvBreakdown } from "@/lib/payment-confirmation";
import type { Order } from "@/lib/types";
import IpsQrCode from "./IpsQrCode";
import PixelPurchase from "@/components/PixelPurchase";

export const metadata: Metadata = {
  title: "Hvala na narudžbini - Hartweger",
  robots: { index: false },
};

interface OrderItem {
  course_id: string;
  course_slug: string;
  title: string;
  price: number;
}

export default async function HvalaPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orderId } = await params;
  const { status } = await searchParams;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single<Order>();

  if (!order) notFound();

  const items = order.items as OrderItem[];
  const courseTitle = items?.[0]?.title ?? "";
  const courseSlug = items?.[0]?.course_slug ?? "";

  const ipsData = buildIpsString({ total: order.total, order_number: order.order_number });

  const paypalEur = order.paypal_note ? parseInt(order.paypal_note) : null;
  const isCard = order.payment_method === "kartica" || order.payment_method === "kartica_rate";

  // Posle kartičnog auto-logina kupac stiže ULOGOVAN - CTA vodi pravo u prvu lekciju
  // umesto na /prijava. Stranica ostaje landing zbog browser Pixel Purchase (dedup sa CAPI).
  // firstLessonId=null i za KTZ/mesečne BEZ platforme - tada ni poruka ni CTA ne smeju
  // da obećavaju lekcije (detalji o časovima idu mejlom, individualni welcome tok).
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  const cardOk = isCard && status === "ok";
  let firstLessonId: string | null = null;
  if (cardOk) {
    firstLessonId = (await firstLessonForOrder(supabase, items ?? []))?.id ?? null;
  }

  // Potvrda o plaćanju na web formi - obavezna po Uputstvu za rad EPM (Banca Intesa) v3.5,
  // tačka 2.7, za USPEŠNO i NEUSPEŠNO kartično plaćanje: ishod, kupac, narudžbina (sa PDV
  // i Order ID), trgovac i parametri transakcije (AuthCode, Response, ProcReturnCode, mdStatus).
  const showPotvrda = isCard && (status === "ok" || status === "fail");
  const tx = showPotvrda
    ? nestpayTxData(order.nestpay_response as Record<string, unknown> | null, order.created_at)
    : null;
  const pdv = pdvBreakdown(order.total, order.country);

  // Browser pixel Purchase šaljemo SAMO za potvrđenu karticu (status=ok) - tu je naplata
  // gotova i poklapa se sa server-side CAPI događajem iz nestpay callback-a (dedup po event_id).
  // Za uplatnicu/PayPal Purchase ide isključivo server-side (CAPI) tek kad admin potvrdi uplatu,
  // pa se ovde ništa ne šalje (porudžbina je kreirana ali još nije plaćena).
  const shouldTrackPurchase = isCard && status === "ok";

  return (
    <section className="bg-gradient-to-b from-plava-light/40 to-white min-h-screen">
      {shouldTrackPurchase && (
        <PixelPurchase
          orderId={order.order_number}
          value={order.total}
          contentId={courseSlug || undefined}
          contentName={courseTitle || undefined}
          items={(items ?? []).map((it) => ({
            id: it.course_slug || it.course_id,
            name: it.title,
            price: it.price,
          }))}
        />
      )}
      <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
        {/* Success header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl text-green-500">✓</span>
          <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900">
            Hvala na narudžbini!
          </h1>
        </div>
        <p className="text-gray-500 mb-1">
          Narudžbina #{order.order_number}
        </p>
        {courseTitle && (
          <p className="text-gray-700 font-medium mb-8">{courseTitle}</p>
        )}

        {/* Kartica status */}
        {isCard && status === "ok" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 text-sm text-green-800">
            <p className="font-semibold">{CARD_OUTCOME.success} 🎉</p>
            <p className="mt-1">
              {!firstLessonId
                ? "Uplata je uspela. Sve detalje o tvojim časovima poslali smo ti na mejl."
                : user
                  ? "Pristup kursu je aktiviran i već si prijavljen/a - kreni odmah."
                  : "Pristup kursu je aktiviran. Poslali smo ti email - prijavi se i počni."}
            </p>
          </div>
        )}
        {isCard && status === "fail" && (
          <div className="bg-[#FFF3F3] border border-[#F78687]/40 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700">
            <p className="font-semibold text-[#E06566]">{CARD_OUTCOME.fail}</p>
            <p className="mt-1 mb-4">{CARD_OUTCOME.failHint}</p>
            {courseSlug && (
              <Link
                href={`/kupovina/${courseSlug}`}
                className="inline-block px-5 py-2.5 rounded-lg font-semibold text-white text-sm bg-[#F78687] hover:bg-[#E06566] transition-colors"
              >
                Pokušaj ponovo
              </Link>
            )}
          </div>
        )}
        {isCard && !status && (
          <div className="bg-plava-light/60 rounded-xl px-5 py-4 mb-6 text-sm text-gray-700">
            <p>Obrađujemo tvoje plaćanje… Ako si upravo platio/la, pristup se aktivira automatski.</p>
          </div>
        )}

        {/* Potvrda o plaćanju (EPM 2.7) - svi obavezni elementi, za uspeh i neuspeh */}
        {showPotvrda && tx && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-sm">
            <h2 className="font-montserrat font-semibold text-lg text-gray-900 mb-4">
              Potvrda o plaćanju
            </h2>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Podaci o kupcu
            </h3>
            <p className="text-gray-700 mb-4">
              {order.full_name}
              <br />
              {order.email}
            </p>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Podaci o narudžbini
            </h3>
            <table className="w-full mb-4">
              <tbody className="divide-y divide-gray-100">
                {(items ?? []).map((it) => (
                  <tr key={it.course_id}>
                    <td className="py-1.5 pr-4 text-gray-700">{it.title} × 1</td>
                    <td className="py-1.5 text-gray-900 text-right whitespace-nowrap">
                      {it.price.toLocaleString("sr-RS")} RSD
                    </td>
                  </tr>
                ))}
                {order.discount > 0 && (
                  <tr>
                    <td className="py-1.5 pr-4 text-gray-500">
                      Popust{order.coupon_code ? ` (${order.coupon_code})` : ""}
                    </td>
                    <td className="py-1.5 text-gray-700 text-right whitespace-nowrap">
                      −{order.discount.toLocaleString("sr-RS")} RSD
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 pr-4 text-gray-500">{pdv.label}</td>
                  <td className="py-1.5 text-gray-700 text-right whitespace-nowrap">
                    {pdv.amountRsd.toLocaleString("sr-RS")} RSD
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-semibold text-gray-900">Ukupno</td>
                  <td className="py-1.5 font-semibold text-gray-900 text-right whitespace-nowrap">
                    {order.total.toLocaleString("sr-RS")} RSD
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 text-gray-500">Broj porudžbenice (Order ID)</td>
                  <td className="py-1.5 text-gray-900 text-right font-mono">{order.order_number}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Podaci o transakciji
            </h3>
            <table className="w-full mb-4">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Datum i vreme", tx.dateTime],
                  ["Order ID", order.order_number],
                  ["AuthCode", tx.authCode],
                  ["Response", tx.response],
                  ["ProcReturnCode", tx.procReturnCode],
                  ["mdStatus", tx.mdStatus],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-1.5 pr-4 text-gray-500 whitespace-nowrap">{label}</td>
                    <td className="py-1.5 text-gray-900 text-right font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Podaci o trgovcu
            </h3>
            <p className="text-gray-700">
              {MERCHANT.naziv}
              <br />
              PIB: {MERCHANT.pib}
              <br />
              {MERCHANT.adresa}
            </p>
            <p className="text-gray-400 text-xs mt-3">
              Potvrdu o plaćanju poslali smo i na {order.email}.
            </p>
          </div>
        )}

        {/* Uplatnica section */}
        {order.payment_method === "uplatnica" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-montserrat font-semibold text-lg text-gray-900 mb-4">
              Podaci za uplatu
            </h2>

            <table className="w-full text-sm mb-6">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Primalac
                  </td>
                  <td className="py-2 text-gray-900">{BANK_DETAILS.primalac}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Broj računa
                  </td>
                  <td className="py-2 text-gray-900 font-mono">{BANK_DETAILS.racun}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Iznos (RSD)
                  </td>
                  <td className="py-2 text-gray-900 font-semibold">
                    {order.total.toLocaleString("sr-RS")} RSD
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Poziv na broj
                  </td>
                  <td className="py-2 text-gray-900 font-mono">{order.order_number}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Svrha
                  </td>
                  <td className="py-2 text-gray-900">
                    Plaćanje porudžbine #{order.order_number}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 font-medium whitespace-nowrap">
                    Šifra plaćanja
                  </td>
                  <td className="py-2 text-gray-900">{BANK_DETAILS.sifraPalcanja}</td>
                </tr>
              </tbody>
            </table>

            {/* IPS QR code */}
            <IpsQrCode data={ipsData} />
          </div>
        )}

        {/* PayPal section */}
        {order.payment_method === "paypal" && paypalEur !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-montserrat font-semibold text-lg text-gray-900 mb-4">
              Plaćanje putem PayPal-a
            </h2>
            <p className="text-gray-700 mb-6">
              Iznos za plaćanje:{" "}
              <span className="font-bold text-gray-900">{paypalEur} EUR</span>
            </p>
            <a
              href={`${PAYPAL_ME_URL}/${paypalEur}EUR`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm"
              style={{ backgroundColor: "#0070ba" }}
            >
              Plati putem PayPal-a
            </a>
          </div>
        )}

        {/* Info note (samo za uplatnicu/PayPal - kartica je instant) */}
        {!isCard && (
        <div className="bg-plava-light/60 rounded-xl px-5 py-4 mb-8 text-sm text-gray-700 space-y-2">
          <p>
            Poslali smo instrukcije i na <span className="font-medium">{order.email}</span>.
          </p>
          <p>
            {order.payment_method === "paypal"
              ? "Tvoju uplatu potvrđujemo ručno - obično u roku od 24h, najkasnije 3 radna dana. Čim potvrdimo, dobićeš email i pristup kursu se aktivira."
              : "Čim potvrdimo uplatu - obično u roku od 24h, najkasnije 3 radna dana - dobićeš email i pristup kursu se aktivira."}
          </p>
          <p className="text-gray-500">
            Ako ne dobiješ pristup, piši nam na{" "}
            <a href="mailto:info@hartweger.rs" className="text-plava hover:underline">info@hartweger.rs</a>.
          </p>
        </div>
        )}

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-4">
          {user && cardOk ? (
            <Link
              href={firstLessonId ? `/lekcija/${firstLessonId}` : "/nalog"}
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              {firstLessonId ? "Započni prvu lekciju →" : "Moj nalog →"}
            </Link>
          ) : cardOk && !firstLessonId ? (
            // KTZ/mesečni bez platforme, odjavljen: nema lekcija koje bi prijava "otključala".
            <Link href="/nalog" className="text-sm text-plava hover:underline">
              Moj nalog →
            </Link>
          ) : (
            <Link
              href="/prijava"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              Prijavi se da vidiš kurs
            </Link>
          )}
          <Link href="/kursevi" className="text-sm text-plava hover:underline">
            ← Nazad na kurseve
          </Link>
        </div>
      </div>
    </section>
  );
}
