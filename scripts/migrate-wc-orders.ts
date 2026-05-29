/**
 * Migrate WooCommerce orders to Supabase wc_orders table.
 * Fetches all completed/processing/refunded orders via WC REST API.
 *
 * Usage: npx tsx scripts/migrate-wc-orders.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WC_API = "https://hartweger.rs/wp-json/wc/v3";
const WC_KEY = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const WC_SECRET = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";

interface WcOrder {
  id: number;
  status: string;
  currency: string;
  total: string;
  discount_total: string;
  payment_method: string;
  payment_method_title: string;
  billing: { email: string; first_name: string; last_name: string; country: string };
  line_items: { name: string; quantity: number; total: string; product_id: number }[];
  date_created: string;
  date_completed: string | null;
}

async function fetchOrders(page: number, status: string): Promise<WcOrder[]> {
  const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
  const url = `${WC_API}/orders?per_page=100&page=${page}&status=${status}&orderby=date&order=asc`;

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    if (res.status === 400) return []; // no more pages
    throw new Error(`WC API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function main() {
  console.log("=== Migrate WC Orders to Supabase ===\n");

  const statuses = ["completed", "processing", "refunded"];
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const status of statuses) {
    console.log(`\nFetching ${status} orders...`);
    let page = 1;

    while (true) {
      console.log(`  Page ${page}...`);

      let orders: WcOrder[];
      try {
        orders = await fetchOrders(page, status);
      } catch (err: any) {
        console.log(`  ERROR fetching: ${err.message}`);
        // Rate limit — wait and retry
        if (err.message.includes("429") || err.message.includes("403")) {
          console.log("  Rate limited, waiting 10s...");
          await new Promise((r) => setTimeout(r, 10000));
          continue;
        }
        break;
      }

      if (!orders || orders.length === 0) break;

      // Prepare batch
      const rows = orders.map((o) => ({
        wc_order_id: o.id,
        status: o.status,
        currency: o.currency,
        total: parseFloat(o.total),
        discount_total: parseFloat(o.discount_total),
        payment_method: o.payment_method || null,
        payment_method_title: o.payment_method_title || null,
        customer_email: o.billing?.email || null,
        customer_name: [o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(" ") || null,
        country: o.billing?.country || null,
        items: o.line_items.map((li) => ({
          name: li.name,
          quantity: li.quantity,
          total: li.total,
          product_id: li.product_id,
        })),
        date_created: o.date_created,
        date_completed: o.date_completed || null,
      }));

      // Upsert (skip duplicates)
      const { data, error } = await supabase
        .from("wc_orders")
        .upsert(rows, { onConflict: "wc_order_id", ignoreDuplicates: true });

      if (error) {
        // Try one by one if batch fails
        for (const row of rows) {
          const { error: singleErr } = await supabase
            .from("wc_orders")
            .upsert(row, { onConflict: "wc_order_id", ignoreDuplicates: true });
          if (singleErr) {
            totalErrors++;
          } else {
            totalInserted++;
          }
        }
      } else {
        totalInserted += rows.length;
      }

      console.log(`  ${rows.length} orders processed`);

      page++;

      // Rate limit protection
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Final count
  const { count } = await supabase
    .from("wc_orders")
    .select("id", { count: "exact", head: true });

  console.log(`\n=== Done ===`);
  console.log(`Total in DB: ${count}`);
  console.log(`Inserted: ${totalInserted}`);
  console.log(`Errors: ${totalErrors}`);
}

main().catch(console.error);
