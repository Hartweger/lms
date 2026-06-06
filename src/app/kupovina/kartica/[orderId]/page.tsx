// src/app/kupovina/kartica/[orderId]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentFields, NESTPAY } from "@/lib/nestpay";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KarticaPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders").select("id, order_number, total, email, full_name, country, payment_method, payment_status")
    .eq("id", orderId).single();

  if (!order || (order.payment_method !== "kartica" && order.payment_method !== "kartica_rate")) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kurs.hartweger.rs";
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
