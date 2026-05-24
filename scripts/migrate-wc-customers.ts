/**
 * Migration script: kreira Supabase naloge i dodeljuje course_access
 * za postojeće WooCommerce kupce.
 *
 * NE ŠALJE MEJLOVE — samo kreira naloge u bazi.
 *
 * Usage: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/migrate-wc-customers.ts
 */

import { createClient } from "@supabase/supabase-js";

// WC product map — copy from src/lib since tsx can't resolve @/ aliases easily
const WC_PRODUCT_MAP: Record<number, string[]> = {
  35178: ["nemacki-a1-1", "nemacki-a1-2"],
  46478: ["nemacki-a1-1", "nemacki-a1-2"],
  46480: ["nemacki-a1-1", "nemacki-a1-2"],
  35766: ["nemacki-a1-1"],
  35767: ["nemacki-a1-2"],
  46494: ["nemacki-a1-1", "nemacki-a1-2"],
  35841: ["nemacki-a1-1"],
  36241: ["nemacki-a1-2"],
  47440: ["nemacki-a1-1", "nemacki-a1-2"],
  36863: ["nemacki-a1-1", "nemacki-a1-2"],
};

const WC_URL = "https://www.hartweger.rs/wp-json/wc/v3";
const WC_KEY = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const WC_SECRET = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WCOrder {
  id: number;
  status: string;
  date_created: string;
  billing: { email: string; first_name: string; last_name: string };
  line_items: { product_id: number }[];
}

async function fetchAllOrders(): Promise<WCOrder[]> {
  const allOrders: WCOrder[] = [];
  let page = 1;

  while (true) {
    const url = `${WC_URL}/orders?status=completed&per_page=100&page=${page}&after=2025-05-01T00:00:00`;
    const res = await fetch(url, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64"),
      },
    });
    const orders: WCOrder[] = await res.json();
    if (orders.length === 0) break;
    allOrders.push(...orders);
    page++;
    console.log(`Fetched page ${page - 1}: ${orders.length} orders`);
  }

  return allOrders;
}

async function grantAccessLocal(
  email: string,
  fullName: string,
  productIds: number[],
  expiresAt: Date
): Promise<{ isNewUser: boolean; coursesGranted: string[] }> {
  // Map products to course slugs
  const courseSlugs = new Set<string>();
  for (const pid of productIds) {
    const slugs = WC_PRODUCT_MAP[pid];
    if (slugs) slugs.forEach((s) => courseSlugs.add(s));
  }
  if (courseSlugs.size === 0) return { isNewUser: false, coursesGranted: [] };

  // Find or create user
  let userId: string;
  let isNewUser = false;

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !newUser.user) {
      throw new Error(`Failed to create user: ${error?.message}`);
    }
    userId = newUser.user.id;
    isNewUser = true;

    await supabase.from("user_profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      role: "student",
    });
  }

  // Grant course access
  const coursesGranted: string[] = [];

  for (const slug of courseSlugs) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!course) continue;

    const { data: existing } = await supabase
      .from("course_access")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .single();

    if (existing) {
      const existingExpiry = existing.expires_at
        ? new Date(existing.expires_at)
        : null;
      if (existingExpiry && existingExpiry < new Date()) {
        await supabase
          .from("course_access")
          .update({ expires_at: expiresAt.toISOString() })
          .eq("id", existing.id);
        coursesGranted.push(slug);
      }
      // Already active — skip
    } else {
      await supabase.from("course_access").insert({
        user_id: userId,
        course_id: course.id,
        expires_at: expiresAt.toISOString(),
      });
      coursesGranted.push(slug);
    }
  }

  return { isNewUser, coursesGranted };
}

async function main() {
  console.log("Fetching WC orders...\n");
  const orders = await fetchAllOrders();
  console.log(`Total completed orders: ${orders.length}\n`);

  // Group by email
  const customerMap = new Map<
    string,
    { name: string; productIds: Set<number>; earliestOrder: Date }
  >();

  for (const order of orders) {
    const email = order.billing.email.toLowerCase().trim();
    if (!email) continue;

    const name =
      `${order.billing.first_name} ${order.billing.last_name}`.trim();
    const productIds = order.line_items.map((i) => i.product_id);
    const orderDate = new Date(order.date_created);

    const hasMapped = productIds.some((pid) => WC_PRODUCT_MAP[pid]);
    if (!hasMapped) continue;

    if (!customerMap.has(email)) {
      customerMap.set(email, {
        name,
        productIds: new Set(productIds),
        earliestOrder: orderDate,
      });
    } else {
      const existing = customerMap.get(email)!;
      productIds.forEach((pid) => existing.productIds.add(pid));
      if (orderDate < existing.earliestOrder) {
        existing.earliestOrder = orderDate;
      }
    }
  }

  console.log(`Unique customers with LMS products: ${customerMap.size}\n`);

  let created = 0;
  let existed = 0;
  let skipped = 0;
  let errors = 0;

  for (const [email, data] of customerMap) {
    try {
      // Expiry = 1 year from original purchase date
      const expiresAt = new Date(data.earliestOrder);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Skip if already expired
      if (expiresAt < new Date()) {
        console.log(
          `SKIP ${email} — expired ${expiresAt.toISOString().slice(0, 10)}`
        );
        skipped++;
        continue;
      }

      const result = await grantAccessLocal(
        email,
        data.name,
        [...data.productIds],
        expiresAt
      );

      if (result.isNewUser) {
        created++;
        console.log(
          `NEW  ${email} — ${result.coursesGranted.join(", ")} — expires ${expiresAt.toISOString().slice(0, 10)}`
        );
      } else if (result.coursesGranted.length > 0) {
        existed++;
        console.log(
          `EXIST ${email} — granted: ${result.coursesGranted.join(", ")}`
        );
      } else {
        existed++;
        console.log(`EXIST ${email} — already has access`);
      }
    } catch (err) {
      errors++;
      console.error(`ERROR ${email}:`, err);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created}`);
  console.log(`Already existed: ${existed}`);
  console.log(`Skipped (expired): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nNIJEDAN MEJL NIJE POSLAT. Mejlove šalješ ti kad budeš spremna.`);
}

main();
