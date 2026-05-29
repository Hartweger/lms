import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BANK_DETAILS, PAYPAL_ME_URL } from "@/lib/order-utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Hvala na narudžbini — Hartweger",
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
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single<Order>();

  if (!order) notFound();

  const items = order.items as OrderItem[];
  const courseTitle = items?.[0]?.title ?? "";

  const ipsData = [
    "K:PR",
    "V:01",
    "C:1",
    `R:${BANK_DETAILS.racun}`,
    `N:${BANK_DETAILS.primalac}`,
    `I:RSD${order.total.toFixed(2)}`,
    `P:Placanje porudzbine #${order.order_number}`,
    `SF:${BANK_DETAILS.sifraPalcanja}`,
    `RO:${order.order_number}`,
  ].join("|");

  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(ipsData)}&choe=UTF-8`;

  const paypalEur = order.paypal_note ? parseInt(order.paypal_note) : null;

  return (
    <section className="bg-gradient-to-b from-plava-light/40 to-white min-h-screen">
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
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">IPS QR kod za mobilno bankarstvo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="IPS QR kod za uplatu"
                width={250}
                height={250}
                className="rounded-lg"
              />
            </div>
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

        {/* Info note */}
        <div className="bg-plava-light/60 rounded-xl px-5 py-4 mb-8 text-sm text-gray-700">
          Poslali smo instrukcije i na <span className="font-medium">{order.email}</span>.
          Kada primimo uplatu, aktiviraćemo pristup.
        </div>

        {/* Back link */}
        <Link
          href="/kursevi"
          className="text-sm text-plava hover:underline"
        >
          ← Nazad na kurseve
        </Link>
      </div>
    </section>
  );
}
