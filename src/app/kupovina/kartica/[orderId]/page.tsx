// src/app/kupovina/kartica/[orderId]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentFields, NESTPAY } from "@/lib/nestpay";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site-url";
import { planForSlug } from "@/lib/subscription-plans";

export const dynamic = "force-dynamic";

export default async function KarticaPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders").select("id, order_number, total, email, full_name, country, payment_method, payment_status, items")
    .eq("id", orderId).single();

  const KARTICNE = ["kartica", "kartica_rate", "kartica_pretplata"];
  if (!order || !KARTICNE.includes(order.payment_method)) notFound();

  // Mesečno plaćanje: banci se uz uobičajena polja šalje i broj naplata iz plana,
  // pa ona sama pokreće seriju. Kod ostalih metoda plan ostaje null.
  const slug = Array.isArray(order.items)
    ? (order.items[0] as { course_slug?: string })?.course_slug ?? ""
    : "";
  const plan = order.payment_method === "kartica_pretplata" ? planForSlug(slug) : null;

  const base = SITE_URL;
  const callbackUrl = `${base}/api/nestpay/callback`;
  const fields = buildPaymentFields({
    orderNumber: order.order_number,
    amountRsd: order.total,
    okUrl: callbackUrl,
    failUrl: callbackUrl,
    email: order.email,
    fullName: order.full_name,
    country: order.country,
    shopUrl: base,
    recurring: plan ? { totalPayments: plan.totalPayments } : undefined,
  });

  return (
    <html>
      <body>
        <form id="np" method="POST" action={NESTPAY.paymentUrl}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <noscript><button type="submit">Nastavi na plaćanje</button></noscript>
        </form>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('np').submit();` }} />
        <p style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: 40 }}>Preusmeravamo te na sigurno plaćanje…</p>
      </body>
    </html>
  );
}
