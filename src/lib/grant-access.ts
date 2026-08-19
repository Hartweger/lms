// src/lib/grant-access.ts
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendGrupniWelcomeEmail, sendProfNewStudentEmail, sendIndividualWelcomeEmail, sendProfNewIndividualStudentEmail, sendSubscriptionChargeEmail, sendAcademyWelcomeEmail, sendZackWelcomeEmail } from "@/lib/email";
import { nivoForSlug } from "@/lib/course-nivo";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";
import { callGas } from "@/lib/gas";
import { sendGa4Purchase } from "@/lib/ga4-mp";
import { sendPurchaseEvent } from "@/lib/meta-capi";
import { SITE_URL } from "@/lib/site-url";
import { createLoginLinkToken } from "@/lib/login-link";
import { firstLessonForCourses } from "@/lib/first-lesson";
import { accessUntilForCharge, planForSlug, unlockedSlugsAfter } from "@/lib/subscription-plans";
import { recurringTxData } from "@/lib/payment-confirmation";
import { CLANSTVO_CONTENT_SLUG } from "@/lib/clanstvo";
import { noviRokClanstva, ZACK_PROMO_RSD } from "@/lib/zack/clanstvo";
import { napraviKod } from "@/lib/zack/kod";
import type { ZackGostMeta } from "@/lib/zack/gost";

interface OrderItem { course_id: string; course_slug: string; title: string; price: number; }

/** NH Academy Gen II (migracija 081) - program uživo, ima svoj mejl potvrde. */
const ACADEMY_SLUG = "nh-academy-gen2";

/**
 * Do kada Academy Gen II poklanja članstvo: do kraja programa, ne godinu dana koliko
 * traje podrazumevani pristup. Bez ovoga polaznica koja kupi 15.09. dobija biblioteku
 * do 15.09.2027 - devet meseci preko dogovorenog. Posle roka ide redovnih 2.290 RSD/mes.
 */
const ACADEMY_CLANSTVO_DO = "2026-12-16T23:59:59+01:00";

/** Paralelni poziv već radi grant za ovaj order — ništa nije poslato ni upisano. */
export const GRANT_IN_PROGRESS = "grant-in-progress";

// Posle ovoliko minuta lock se smatra bajatim (crash usred granta) i sme da se preuzme,
// da reconcile cron ne ostane zauvek blokiran na zaglavljenom orderu.
const GRANT_LOCK_TTL_MS = 10 * 60_000;

export interface RevokeResult {
  ok: boolean;
  error?: string;
  /** Šta je stvarno skinuto - admin vidi u odgovoru, jer se storno radi ručno i mora da se proveri. */
  skinuto: { courseAccess: number; grupni: number; individualni: number };
  /** Šta ostaje na ruke (npr. grupa koju nismo umeli pouzdano da pogodimo). */
  napomene: string[];
}

/**
 * Oduzima sve što je `grantAccessForOrder` dodelio: pristup sadržaju, upis u grupu,
 * individualni upis, potrošeni kupon. NE dira novac ni fiskalni račun i NE šalje mejl -
 * polazniku se javlja Nataša. Idempotentno (drugi poziv skida nulu redova).
 *
 * Namerno NE briše `professor_students`: ta veza je po (profesor, student, kurs) i deli se
 * sa drugim upisima, pa bi brisanje umelo da sakrije polaznika koji i dalje ima drugi kurs.
 */
export async function revokeAccessForOrder(orderId: string): Promise<RevokeResult> {
  const admin = createAdminClient();
  const skinuto = { courseAccess: 0, grupni: 0, individualni: 0 };
  const napomene: string[] = [];

  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "Order not found", skinuto, napomene };

  const oznaka = `order:${order.order_number ?? orderId}`;
  const items = (order.items ?? []) as unknown as OrderItem[];

  // zack! članstvo ne živi u course_access nego u zack_deca.clanstvo_do, pa ga
  // brisanje ispod ne dira - admin pri stornu mora da vidi da rok skida ručno.
  if ((items[0] as { dete_id?: string } | undefined)?.dete_id) {
    napomene.push(
      `zack! članstvo: rok pristupa stoji na zack_deca.clanstvo_do (dete ${(items[0] as { dete_id?: string }).dete_id}) - ako storno treba da ukine pristup, skratiti ručno.`,
    );
  }

  // 1) Pristup sadržaju. Vezujemo se za `source`, jedini trag koji grant ostavlja na redu.
  // PAŽNJA: kod obnove grant PREPIŠE source na postojećem redu (npr. wp-migracija), pa se
  // tada briše i stariji pristup. Zato route vraća broj obrisanih redova na uvid.
  const { data: obrisani, error: caError } = await admin
    .from("course_access").delete()
    .eq("user_id", order.user_id).eq("source", oznaka)
    .select("id");
  if (caError) return { ok: false, error: `course_access: ${caError.message}`, skinuto, napomene };
  skinuto.courseAccess = (obrisani ?? []).length;

  // 2) Individualni upisi - jedini imaju order_id, pa je pogodak tačan.
  const { data: ind, error: indError } = await admin
    .from("individual_enrollments").update({ status: "cancelled" })
    .eq("order_id", orderId).eq("status", "active")
    .select("id");
  if (indError) napomene.push(`Individualni upis nije skinut: ${indError.message}`);
  else skinuto.individualni = (ind ?? []).length;

  // 3) Grupni upisi. `group_enrollments` NEMA order_id, pa gađamo isto kao grant: po nivou
  // iz slug-a. Ako je polaznik u dve grupe istog nivoa, ovo ume da pogodi pogrešnu - zato
  // se svaka otkazana grupa ispisuje u napomenama.
  for (const item of items) {
    if (!item.course_slug?.startsWith("grupni-")) continue;
    const nivo = nivoForSlug(item.course_slug);
    if (!nivo) continue;
    const { data: grupe } = await admin.from("groups").select("id").eq("level", nivo);
    const ids = (grupe ?? []).map((g) => g.id);
    if (ids.length === 0) { napomene.push(`Nema grupe nivoa ${nivo} - grupni upis proveriti ručno.`); continue; }
    const { data: otkazani, error: geError } = await admin
      .from("group_enrollments").update({ status: "cancelled" })
      .eq("user_id", order.user_id).in("group_id", ids).eq("status", "active")
      .select("id, group_id");
    if (geError) { napomene.push(`Grupni upis (${nivo}) nije skinut: ${geError.message}`); continue; }
    skinuto.grupni += (otkazani ?? []).length;
    for (const o of otkazani ?? []) napomene.push(`Otkazan upis u grupu ${o.group_id} (${nivo}) - proveri da je prava.`);
    // Gost na Google kalendaru i red u profesorkinom Sheetu ostaju - GAS nema "unenroll".
    if ((otkazani ?? []).length > 0) napomene.push(`Skini polaznika sa Google kalendara i iz tabele profesorke (${nivo}) ručno.`);
  }

  // 4) Kupon: grant je potrošio jedno mesto na naplati, storno ga vraća.
  if (order.coupon_code) {
    const { data: coupon } = await admin.from("coupons").select("usage_count").eq("code", order.coupon_code).single();
    const trenutno = (coupon?.usage_count as number | undefined) ?? 0;
    if (trenutno > 0) await admin.from("coupons").update({ usage_count: trenutno - 1 }).eq("code", order.coupon_code);
  }

  return { ok: true, skinuto, napomene };
}

/** Isti broj izvlačenja koda kao /api/zack/roditelj/deca - vidi komentar tamo. */
const IZVLACENJA_KODA = 20;

/**
 * Gost-porudžbina zack! članstva (items[0].zack_gost, bez dete_id): kupac je
 * platio PRE nego što ima roditeljski red i dete, pa se ovde - tek POSLE
 * uspešne naplate - obezbeđuje oboje:
 * - auth nalog već postoji (napravio ga /api/orders pri kreiranju porudžbine),
 * - red u zack_roditelji nastaje sa pristankom IZ PORUDŽBINE (tekst + vreme
 *   koje je roditelj stvarno video na kupovnoj strani); POSTOJEĆEM roditelju
 *   se pristanak ne prepisuje - njegov prvobitni dokaz ostaje netaknut,
 * - dete sa jedinstvenim kodom i pin_hash = NULL (PIN roditelj postavlja na
 *   hvala strani ili kasnije u panelu).
 *
 * Retry granta (reconcile cron posle pada) ne pravi duplikat: svoje dete
 * prepoznaje po (roditelj, ime, udžbenik, pin_hash NULL) - jedini trag koji
 * postoji bez posebne kolone porekla.
 */
async function obezbediGostDete(
  admin: ReturnType<typeof createAdminClient>,
  order: { user_id: string; email: string },
  gost: ZackGostMeta,
): Promise<{ ok: true; deteId: string } | { ok: false; error: string }> {
  // 1) Roditelj za kupčev auth nalog.
  const { data: postojeci, error: rGreska } = await admin
    .from("zack_roditelji").select("id").eq("auth_user_id", order.user_id).maybeSingle();
  if (rGreska) return { ok: false, error: `zack_roditelji čitanje: ${rGreska.message}` };
  let roditeljId = postojeci?.id ?? null;
  if (!roditeljId) {
    const { data: novi, error: insGreska } = await admin
      .from("zack_roditelji")
      .insert({
        auth_user_id: order.user_id,
        email: order.email,
        pristanak_tekst: gost.pristanak_tekst,
        pristanak_at: gost.pristanak_at,
      })
      .select("id").single();
    if (!insGreska) {
      roditeljId = novi?.id ?? null;
    } else if (insGreska.code === "23505") {
      // Trka: paralelni tok (npr. roditelj koji se baš sad prijavio u panel i
      // potvrdio pristanak) upravo je upisao red - pročitaj ga i nastavi.
      const { data: uTrci } = await admin
        .from("zack_roditelji").select("id").eq("auth_user_id", order.user_id).maybeSingle();
      roditeljId = uTrci?.id ?? null;
    } else {
      return { ok: false, error: `zack_roditelji upis: ${insGreska.message}` };
    }
    if (!roditeljId) return { ok: false, error: "zack_roditelji: red nije nastao" };
  }

  // 2) Dete - najpre da li ga je prošli (prekinuti) pokušaj granta već napravio.
  const { data: vecPostoji, error: dGreska } = await admin
    .from("zack_deca").select("id")
    .eq("roditelj_id", roditeljId).eq("ime", gost.ime).eq("udzbenik_id", gost.udzbenik_id)
    .is("pin_hash", null)
    .limit(1).maybeSingle();
  if (dGreska) return { ok: false, error: `zack_deca čitanje: ${dGreska.message}` };
  if (vecPostoji) return { ok: true, deteId: vecPostoji.id };

  // Isti obrazac kao /api/zack/roditelj/deca: „pokušaj pa novi kod na sudar",
  // jer „proveri pa upiši" ume da izgubi trku oko UNIQUE(kod).
  for (let i = 0; i < IZVLACENJA_KODA; i++) {
    const kod = napraviKod(Math.random);
    const { data: dete, error } = await admin
      .from("zack_deca")
      .insert({
        ime: gost.ime,
        udzbenik_id: gost.udzbenik_id,
        roditelj_id: roditeljId,
        kod,
        pin_hash: null,
      })
      .select("id").single();
    if (!error && dete) return { ok: true, deteId: dete.id };
    if (error && error.code !== "23505") {
      return { ok: false, error: `zack_deca upis: ${error.message}` };
    }
  }
  return { ok: false, error: "zack_deca: nije izvučen slobodan kod" };
}

/** Dodeljuje pristup za narudžbinu (course_unlocks → course_access), označava completed+granted, šalje welcome mejl. Idempotentno. */
export async function grantAccessForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "Order not found" };
  if (order.payment_status === "completed") return { ok: true }; // idempotentno

  // completed-provera iznad nije dovoljna sama: dupli klik na „Potvrdi uplatu" napravi dva
  // zahteva koja OBA pročitaju pending pre nego što prvi stigne do update-a na dnu, pa mejlovi
  // odu 2x (order 2026-268, 06.08.2026). Zato atomični claim: UPDATE ... WHERE je u Postgresu
  // atomičan po redu, pa lock uzme tačno jedan poziv; drugi dobije GRANT_IN_PROGRESS.
  const claim = { grant_lock_at: new Date().toISOString() };
  const first = await admin.from("orders").update(claim)
    .eq("id", orderId).neq("payment_status", "completed").is("grant_lock_at", null)
    .select("id").maybeSingle();
  let claimed = !!first.data;
  if (!claimed && !first.error) {
    const staleIso = new Date(Date.now() - GRANT_LOCK_TTL_MS).toISOString();
    const retry = await admin.from("orders").update(claim)
      .eq("id", orderId).neq("payment_status", "completed").lt("grant_lock_at", staleIso)
      .select("id").maybeSingle();
    claimed = !!retry.data;
  }
  if (first.error) {
    // Fail-open: bez locka smo na starom (ranjivom na trku) ponašanju, ali grant NE sme da
    // stane zbog npr. kolone koja još nije u bazi. Sentry da se vidi.
    console.error(`[grant] lock claim pao za order ${orderId}:`, first.error.message);
    Sentry.captureException(new Error(`[grant] lock claim pao: ${first.error.message}`));
  } else if (!claimed) {
    const { data: fresh } = await admin.from("orders").select("payment_status").eq("id", orderId).single();
    if (fresh?.payment_status === "completed") return { ok: true }; // paralelni poziv upravo završio
    return { ok: false, error: GRANT_IN_PROGRESS };
  }

  const items = (order.items ?? []) as unknown as OrderItem[];
  // Mesečno plaćanje: pristup važi do sledeće naplate + 7 dana zaliha, pa prestanak
  // plaćanja sam gasi pristup - nema oduzimanja. Sve ostalo: godinu dana kao i do sada.
  const jePretplata = !!order.subscription_id;
  const rataBr: number = order.installment_no ?? 1;
  const jePrvaNaplata = !jePretplata || rataBr === 1;
  const expiresAt = jePretplata
    ? accessUntilForCharge(new Date())
    : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })();

  // zack! članstvo (stavka nosi dete_id): kupac je RODITELJ, a pristup pripada
  // DETETU - zato ovde nema course_access. Naplata (i prva iz callbacka i rata
  // iz subscriptions-poll crona) samo produžava zack_deca.clanstvo_do; sve
  // ostalo (order → completed, fiskalizacija u pozivaocu, GA4/Meta, mejl) ide
  // istim tokom kao školske porudžbine. Školske stavke nemaju dete_id, pa se
  // za njih ova grana nikad ne izvršava.
  const zackStavka = items[0] as { dete_id?: string; zack_gost?: ZackGostMeta } | undefined;
  let zackDeteId = zackStavka?.dete_id;

  // Gost-porudžbina: dete (i po potrebi roditelj) nastaju TEK SAD, posle
  // naplate - do ovog trenutka o kupcu postoji samo auth nalog i porudžbina.
  if (!zackDeteId && zackStavka?.zack_gost) {
    const gost = await obezbediGostDete(admin, order, zackStavka.zack_gost);
    const oznaka = order.order_number ?? orderId;
    if (!gost.ok) {
      // PLAĆENO-A-NEMA-DETETA ne sme tiho: order ostaje pending (reconcile
      // cron ponavlja), lock se oslobađa odmah - isto kao za clanstvo_do dole.
      const msg = `[grant][zack] gost-porudžbina bez deteta (order ${oznaka}): ${gost.error}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ grant_lock_at: null }).eq("id", orderId);
      return { ok: false, error: msg };
    }

    // dete_id mora u stavku PRE nastavka: rata 2+ kopira items sa ove
    // porudžbine (subscription-charges), a hvala strana po njemu zna kome da
    // pokaže kod i ponudi PIN. zack_gost namerno OSTAJE - trajan dokaz
    // pristanka (tekst + vreme), i posle nastanka roditeljskog reda.
    const sirove = Array.isArray(order.items) ? order.items : [];
    const prva = sirove[0];
    const noveStavke =
      typeof prva === "object" && prva !== null && !Array.isArray(prva)
        ? [{ ...prva, dete_id: gost.deteId }, ...sirove.slice(1)]
        : null;
    const { error: itemsGreska } = noveStavke
      ? await admin.from("orders").update({ items: noveStavke }).eq("id", orderId)
      : { error: { message: "items[0] nije objekat" } };
    if (itemsGreska) {
      const msg = `[grant][zack] dete_id nije upisan u stavku (order ${oznaka}, dete ${gost.deteId}): ${itemsGreska.message}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ grant_lock_at: null }).eq("id", orderId);
      return { ok: false, error: msg };
    }

    // Pretplata je upisana PRE granta (redosled u nestpay callbacku), pa joj je
    // dete_id ostao NULL - dopuna, jer roditeljski panel po subscriptions.dete_id
    // prikazuje i otkazuje članstvo. Best-effort uslov .is(null): tuđu vrednost
    // nikad ne prepisuje.
    if (order.subscription_id) {
      const { error: subGreska } = await admin
        .from("subscriptions")
        .update({ dete_id: gost.deteId })
        .eq("id", order.subscription_id)
        .is("dete_id", null);
      if (subGreska) {
        console.error(`[grant][zack] subscriptions.dete_id dopuna pala (order ${oznaka}):`, subGreska.message);
        Sentry.captureException(new Error(`[grant][zack] subscriptions.dete_id dopuna pala: ${subGreska.message}`));
      }
    }

    zackDeteId = gost.deteId;
  }

  if (zackDeteId) {
    const { data: dete, error: deteError } = await admin
      .from("zack_deca")
      .select("id, ime, clanstvo_do, kod, pin_hash")
      .eq("id", zackDeteId)
      .maybeSingle();
    const rokError = dete
      ? (
          await admin
            .from("zack_deca")
            .update({ clanstvo_do: noviRokClanstva(dete.clanstvo_do, expiresAt).toISOString() })
            .eq("id", dete.id)
        ).error
      : null;
    if (!dete || rokError) {
      // Isti princip kao za course_access: PLAĆENO-A-NEMA-PRISTUP ne sme da
      // prođe tiho. Order ostaje pending (reconcile cron ponavlja), lock se
      // oslobađa odmah.
      const msg = `[grant][zack] clanstvo_do nije upisan za dete ${zackDeteId} (order ${order.order_number ?? orderId}): ${rokError?.message ?? deteError?.message ?? "dete ne postoji"}`;
      console.error(msg);
      Sentry.captureException(new Error(msg));
      await admin.from("orders").update({ grant_lock_at: null }).eq("id", orderId);
      return { ok: false, error: msg };
    }

    await admin.from("orders").update({ payment_status: "completed", granted: true, grant_lock_at: null }).eq("id", orderId);

    // Ista pravila merenja kao dole: samo PRVA naplata je konverzija.
    if (jePrvaNaplata) await sendGa4Purchase(order);
    if (jePrvaNaplata && !order.meta_purchase_sent) {
      const metaOk = await sendPurchaseEvent(order, { eventSourceUrl: `${SITE_URL}/kupovina/hvala/${order.id}` });
      if (metaOk) await admin.from("orders").update({ meta_purchase_sent: true }).eq("id", orderId);
    }

    if (jePrvaNaplata) {
      await sendZackWelcomeEmail(order.email, order.full_name, {
        imeDeteta: dete.ime,
        monthlyRsd: ZACK_PROMO_RSD,
        accessUntil: expiresAt.toISOString(),
        // Kod uvek uz mejl (roditelju je to jedini „login" podatak deteta);
        // napomena o PIN-u samo dok PIN stvarno ne postoji - dete iz panela
        // ga već ima, gost-dete ga postavlja na hvala strani ili u panelu.
        kod: dete.kod,
        pinNijePostavljen: dete.pin_hash === null,
      });
    } else {
      const { data: sub } = await admin
        .from("subscriptions").select("total_payments").eq("id", order.subscription_id!).maybeSingle();
      await sendSubscriptionChargeEmail({
        email: order.email,
        name: order.full_name,
        courseTitle: items[0]?.title ?? "zack! članstvo",
        installmentNo: rataBr,
        totalPayments: sub?.total_payments ?? 121,
        amount: order.total,
        accessUntil: expiresAt.toISOString(),
        orderNumber: order.order_number ?? "",
        tx: recurringTxData(order.nestpay_response as Record<string, unknown> | null, order.created_at),
        tip: "clanstvo",
      });
    }
    return { ok: true };
  }

  const purchasedIds = items.map((i) => i.course_id);
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("purchasable_course_id", purchasedIds);

  const contentCourseIds = new Set<string>();
  for (const item of items) {
    const mapped = (unlocks ?? []).filter((u) => u.purchasable_course_id === item.course_id);
    if (mapped.length > 0) mapped.forEach((u) => contentCourseIds.add(u.content_course_id));
    else { console.warn(`[grant] No course_unlocks for ${item.course_slug} (${item.course_id}) - granting product itself`); contentCourseIds.add(item.course_id); }
  }

  // Kod mesečnog plaćanja sadržaj se otvara postepeno: rata otključava samo nivoe
  // predviđene rasporedom (1 → A1.1, 2 → A1.2, 4 → A2.1 ...). Bez ovoga bi prva rata
  // od 3.199 din nosila ceo paket od 29.133 din.
  if (jePretplata) {
    const plan = items[0]?.course_slug ? planForSlug(items[0].course_slug) : null;
    if (plan) {
      const dozvoljeniSlugovi = new Set(unlockedSlugsAfter(plan, rataBr));
      const { data: sadrzaj } = await admin
        .from("courses").select("id, slug").in("id", [...contentCourseIds]);
      for (const kurs of sadrzaj ?? []) {
        if (!dozvoljeniSlugovi.has(kurs.slug)) contentCourseIds.delete(kurs.id);
      }
    }
  }

  // Academy Gen II poklanja članstvo samo do kraja programa, a ne godinu dana koliko
  // traje podrazumevani pristup. Rok važi SAMO za biblioteku članstva - ostale kurseve
  // iz iste porudžbine ne dira.
  const rokPoKursu = new Map<string, Date>();
  if (items.some((i) => i.course_slug === ACADEMY_SLUG)) {
    const krajPrograma = new Date(ACADEMY_CLANSTVO_DO);
    // Kupovina posle roka (zakasnela uplatnica, slug ponovo upotrebljen za sledeću
    // generaciju): ne upisuj već istekao pristup, pusti podrazumevani rok.
    if (krajPrograma > new Date()) {
      const { data: biblioteka } = await admin
        .from("courses").select("id").eq("slug", CLANSTVO_CONTENT_SLUG).maybeSingle();
      if (biblioteka && contentCourseIds.has(biblioteka.id)) rokPoKursu.set(biblioteka.id, krajPrograma);
    }
  }

  const grantFailures: string[] = [];
  for (const courseId of contentCourseIds) {
    const rok = rokPoKursu.get(courseId) ?? expiresAt;
    const { data: existing } = await admin
      .from("course_access").select("id, expires_at")
      .eq("user_id", order.user_id).eq("course_id", courseId).single();
    if (!existing) {
      const { error: insertError } = await admin.from("course_access").insert({
        user_id: order.user_id, course_id: courseId, expires_at: rok.toISOString(),
        source: `order:${order.order_number ?? orderId}`,
      });
      if (insertError) grantFailures.push(`${courseId}: ${insertError.message}`);
    } else if (existing.expires_at && new Date(existing.expires_at) < rok) {
      // Obnova: postojeći red (npr. wp-migracija) se produžava, nikad ne skraćuje.
      // Zato polaznica koja već plaća članstvo ne gubi rok zbog Academy poklona.
      const { error: updateError } = await admin.from("course_access")
        .update({ expires_at: rok.toISOString(), source: `order:${order.order_number ?? orderId}` })
        .eq("id", existing.id);
      if (updateError) grantFailures.push(`${courseId}: ${updateError.message}`);
    }
  }
  // Ako ijedan pristup nije upisan, order OSTAJE pending (reconcile cron ponavlja grant),
  // bez welcome mejla — kupcu ne obećavamo pristup koji ne postoji.
  if (grantFailures.length > 0) {
    const msg = `[grant] course_access insert pao za order ${order.order_number ?? orderId}: ${grantFailures.join("; ")}`;
    console.error(msg);
    Sentry.captureException(new Error(msg));
    // Oslobodi lock da reconcile cron može odmah da ponovi grant (ne čeka TTL).
    await admin.from("orders").update({ grant_lock_at: null }).eq("id", orderId);
    return { ok: false, error: msg };
  }

  // Grupni proizvodi: auto-upis u otvorenu grupu + Google (kalendar/Sheet) + mejl. Best-effort.
  let grupniWelcomeSent = false;
  for (const item of items) {
    if (!item.course_slug.startsWith("grupni-")) continue;
    const nivo = nivoForSlug(item.course_slug);
    if (!nivo) continue;
    try {
      // Status filter radi pickOpenGroupForNivo (jedinstveno mesto definicije "otvoren").
      const { data: groupsForNivo } = await admin
        .from("groups")
        .select("id, level, status, start_date, max_seats, manual_enrolled, gcal_event_id, meet_link, notes_url, professor_id, content_course_id, professor:professor_id(full_name, email)")
        .eq("level", nivo);
      // PAŽNJA: oba slučaja ispod su PLAĆENO-A-NEMA-MESTO. Kupac dobije pristup sadržaju, ali
      // ostane van grupe - i to mu niko ne kaže. Ranije se samo logovalo, pa je jedna polaznica
      // (jun 2026) zaključila da plaćanje nije prošlo i platila ista kurs tri puta. Zato Sentry.
      const oznaka = order.order_number ?? orderId;
      const group = pickOpenGroupForNivo(groupsForNivo ?? [], nivo);
      if (!group) {
        const msg = `[grant] PLAĆENO-A-NEMA-MESTO: nema otvorene grupe za nivo ${nivo} (order ${oznaka}, user ${order.user_id}) - kupac ima sadržaj ali nije ni u jednoj grupi, upisati ručno`;
        console.error(msg);
        Sentry.captureException(new Error(msg));
        continue;
      }

      const { count } = await admin.from("group_enrollments").select("*", { count: "exact", head: true })
        .eq("group_id", group.id).eq("status", "active");

      const seats = computeSeats({ maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled, activeEnrollments: count ?? 0 });
      if (seats.full) {
        const msg = `[grant][oversell] PLAĆENO-A-NEMA-MESTO: grupa ${group.id} (${nivo}) je puna - preskočen auto-upis za order ${oznaka} (user ${order.user_id}), rešiti ručno`;
        console.error(msg);
        Sentry.captureException(new Error(msg));
        continue;
      }
      await admin.from("group_enrollments").upsert(
        { group_id: group.id, user_id: order.user_id, status: "active", enrolled_at: new Date().toISOString() },
        { onConflict: "group_id,user_id" },
      );
      console.log(`[grant] Auto-upis u grupu ${group.id} (${nivo}) za order ${orderId}`);

      // Profesorska veza za grupnog polaznika: lista Schreiben radova i objava (essays/publish)
      // čitaju professor_students. Bez ovoga je grupni student nevidljiv svojoj profesorki.
      const g = group as unknown as { professor_id?: string | null; content_course_id?: string | null };
      if (g.professor_id && g.content_course_id) {
        await admin.from("professor_students").upsert(
          { professor_id: g.professor_id, student_id: order.user_id, course_id: g.content_course_id, assigned_via: "group" },
          { onConflict: "professor_id,student_id,course_id", ignoreDuplicates: true },
        );
      }

      const prof = Array.isArray(group.professor) ? group.professor[0] : group.professor;
      const profIme: string = prof?.full_name || "";

      // Google: dodaj gosta na event + upiši u profesorkin Sheet (samo ako je termin otvoren novim sistemom).
      if (group.gcal_event_id) {
        try {
          await callGas("enroll", {
            nivo, prof: profIme, eventId: group.gcal_event_id,
            studentEmail: order.email, studentName: order.full_name,
          });
        } catch (ge) {
          console.error(`[grant] GAS enroll pao za ${order.email} (${nivo}):`, ge);
        }
      }

      // Jedan mejl polazniku: platforma + Meet + beleške.
      await sendGrupniWelcomeEmail(order.email, order.full_name, {
        nivo, profIme, meetLink: group.meet_link ?? undefined, notesUrl: group.notes_url ?? undefined,
      });
      grupniWelcomeSent = true;

      // Mejl profesorki: novi polaznik.
      const profEmail: string = prof?.email || "";
      if (profEmail) {
        await sendProfNewStudentEmail(profEmail, profIme, {
          nivo, studentName: order.full_name, studentEmail: order.email,
        });
      }
    } catch (e) {
      console.error(`[grant] Grupni tok pao za nivo ${nivo} (order ${orderId}):`, e);
      Sentry.captureException(e);
    }
  }

  // Individualni proizvodi: enrollment + beleške (GAS) + mejlovi. Best-effort.
  let individualWelcomeSent = false;
  for (const item of items) {
    const profId = (item as { professor_id?: string | null }).professor_id;
    const pkgLessons = (item as { package_lessons?: number | null }).package_lessons;
    if (profId === undefined && pkgLessons === undefined) continue; // nije individualna stavka
    const nivo = nivoForSlug(item.course_slug) ?? "";
    try {
      // Idempotentnost: ako upis za ovaj (order, kurs) već postoji (retry grant-a), ne pravi duplikat.
      const { data: existingEnr } = await admin
        .from("individual_enrollments").select("id")
        .eq("order_id", orderId).eq("course_id", item.course_id).maybeSingle();
      if (existingEnr) { individualWelcomeSent = true; continue; }

      let profIme = "", profEmail = "", calendarUrl: string | null = null;
      if (profId) {
        const { data: prof } = await admin.from("user_profiles")
          .select("full_name, email, calendar_url").eq("id", profId).single();
        profIme = prof?.full_name ?? ""; profEmail = prof?.email ?? ""; calendarUrl = prof?.calendar_url ?? null;
      }

      // hasPlatform: ima li course_unlocks (regularni nivoi/FIDE/FSP da, KTZ mesečni ne).
      const { count: unlockCount } = await admin.from("course_unlocks")
        .select("*", { count: "exact", head: true }).eq("purchasable_course_id", item.course_id);
      const hasPlatform = (unlockCount ?? 0) > 0;

      // Mesečni (KTZ) paketi važe mesec dana; ostali individualni 3 meseca.
      const { data: courseRow } = await admin.from("courses")
        .select("category").eq("id", item.course_id).maybeSingle();
      const isMonthly = courseRow?.category === "mesecni";

      // Rok = uplata + (1 mesec za mesečne, inače 3 meseca); format dd.MM.yyyy.
      const expEnroll = new Date(); expEnroll.setMonth(expEnroll.getMonth() + (isMonthly ? 1 : 3));
      const rok = `${String(expEnroll.getDate()).padStart(2, "0")}.${String(expEnroll.getMonth() + 1).padStart(2, "0")}.${expEnroll.getFullYear()}.`;

      // Materijali: regularni nivoi → jedan folder; FIDE/FSP (naziv) i KTZ (bez platforme) → bez linka.
      const isFideFsp = /fide|fsp/i.test(nivo) || /fide|fsp/i.test(item.course_slug ?? "");
      const materijaliUrl = (isFideFsp || !hasPlatform)
        ? ""
        : "https://drive.google.com/drive/folders/1uyIxitTor_n_oxDZ3IZ48WBJ0Jv5mpQF";

      // GAS: beleške doc (bez kalendar eventa).
      let notesUrl: string | null = null;
      try {
        const r = await callGas("enrollIndividual", {
          nivo, prof: profIme, studentName: order.full_name, studentEmail: order.email,
          casova: pkgLessons ?? 0, rok, calendarUrl: calendarUrl ?? "", profEmail: profEmail ?? "",
          materijaliUrl,
        });
        notesUrl = (r.notesUrl as string) || null;
      } catch (ge) {
        console.error(`[grant][ind] GAS enrollIndividual pao za ${order.email} (${nivo}):`, ge);
      }
      await admin.from("individual_enrollments").insert({
        user_id: order.user_id, course_id: item.course_id, professor_id: profId ?? null,
        order_id: orderId, package_lessons: pkgLessons ?? 0, status: "active",
        notes_doc_url: notesUrl, expires_at: expEnroll.toISOString(),
      });

      // Profesorska veza: da student vidljiv u profesorskom dašbordu i admin pregledu
      // (oba čitaju professor_students). Idempotentno. Bez ovoga 1:1 student je „nevidljiv".
      if (profId) {
        await admin.from("professor_students").upsert(
          { professor_id: profId, student_id: order.user_id, course_id: item.course_id, assigned_via: "individual" },
          { onConflict: "professor_id,student_id,course_id", ignoreDuplicates: true },
        );
      }

      await sendIndividualWelcomeEmail(order.email, order.full_name, {
        nivo, profIme, calendarUrl, notesUrl, hasPlatform, isMonthly, rok,
      });
      individualWelcomeSent = true;

      if (profEmail) {
        await sendProfNewIndividualStudentEmail(profEmail, profIme, {
          nivo, lessons: pkgLessons ?? 0, studentName: order.full_name, studentEmail: order.email, notesUrl,
        });
      }
    } catch (e) {
      console.error(`[grant][ind] Individualni tok pao za ${item.course_slug} (order ${orderId}):`, e);
      Sentry.captureException(e);
    }
  }

  await admin.from("orders").update({ payment_status: "completed", granted: true, grant_lock_at: null }).eq("id", orderId);
  // Kupon troši max_uses tek na NAPLATU (jedina tačka gde order postaje completed) —
  // odbijena kartica / otkazana uplatnica ne sme da pojede limit. Idempotentno preko
  // completed-guarda na vrhu. Best-effort: brojač ne sme da obori dodelu pristupa.
  if (order.coupon_code) {
    try {
      const { data: coupon } = await admin.from("coupons").select("usage_count").eq("code", order.coupon_code).single();
      if (coupon) {
        await admin.from("coupons").update({ usage_count: (coupon.usage_count as number) + 1 }).eq("code", order.coupon_code);
      }
    } catch (e) {
      console.error(`[grant] usage_count increment pao za kupon ${order.coupon_code} (order ${orderId}):`, e);
      Sentry.captureException(e);
    }
  }
  // GA4 prihod (server-side) za SVE načine plaćanja — klijentski purchase hvata samo karticu.
  // Rate 2-12 NISU nove konverzije: slanje bi u Meta/GA4 prijavilo 12 kupovina po 3.199
  // umesto jedne prodaje i pokvarilo merenje isplativosti oglasa.
  if (jePrvaNaplata) await sendGa4Purchase(order);
  // Meta Purchase (CAPI) iz JEDNE tačke — pokriva SVE puteve do "completed" (kartica callback,
  // admin potvrda uplatnice/PayPala, recovery cron, ručna admin porudžbina). Dedup sa browser
  // pixel-om ide preko event_id (purchase_<order_number>). Rezultat pamtimo u meta_purchase_sent
  // (trajna evidencija + osnova za retry). Best-effort: ne ruši dodelu pristupa ako padne.
  if (jePrvaNaplata && !order.meta_purchase_sent) {
    const metaOk = await sendPurchaseEvent(order, { eventSourceUrl: `${SITE_URL}/kupovina/hvala/${order.id}` });
    if (metaOk) await admin.from("orders").update({ meta_purchase_sent: true }).eq("id", orderId);
  }
  // Rate 2-12: kratka potvrda naplate umesto dvanaest puta ponovljene dobrodošlice.
  if (!jePrvaNaplata) {
    const { data: sub } = await admin
      .from("subscriptions").select("total_payments").eq("id", order.subscription_id!).maybeSingle();
    // tip određuje samo naslov/uvod mejla (bez "od N" za članstvo) - transakcioni podaci
    // ostaju isti za oba tipa (EPM 2.7, vidi komentar iznad sendSubscriptionChargeEmail).
    const chargePlan = planForSlug(items[0]?.course_slug ?? "");
    await sendSubscriptionChargeEmail({
      email: order.email,
      name: order.full_name,
      courseTitle: items[0]?.title ?? "kurs",
      installmentNo: rataBr,
      totalPayments: sub?.total_payments ?? 12,
      amount: order.total,
      accessUntil: expiresAt.toISOString(),
      // Podaci o transakciji - obavezni u mejlu i za naknadne mesečne naplate
      // (zahtev banke 24.07.2026, EPM 2.7). Upisao ih je subscriptions-poll cron.
      orderNumber: order.order_number ?? "",
      tx: recurringTxData(order.nestpay_response as Record<string, unknown> | null, order.created_at),
      tip: chargePlan?.tip,
    });
    return { ok: true };
  }

  // NH Academy je program uživo, ne kurs na platformi: generički mejl bi polaznicu
  // poslao na kontrolnu tablu gde je ne čeka nikakav sadržaj. Zato svoj mejl sa
  // datumom početka i sledećim korakom.
  if (!grupniWelcomeSent && !individualWelcomeSent && items.some((i) => i.course_slug === ACADEMY_SLUG)) {
    await sendAcademyWelcomeEmail(order.email, order.full_name);
    return { ok: true };
  }

  // Generički welcome šaljemo samo ako nismo već poslali grupni/individualni (da polaznik dobije jedan mejl).
  if (!grupniWelcomeSent && !individualWelcomeSent) {
    // Direktan login-link do prve lekcije - kupac iz mejla ulazi bez /prijava zida.
    // Best-effort: ako izračunavanje padne, mejl ide sa starim /prijava CTA.
    let startUrl: string | undefined;
    let hasLesson = false;
    try {
      const fl = await firstLessonForCourses(admin, [...contentCourseIds]);
      hasLesson = !!fl;
      const token = createLoginLinkToken({
        email: order.email,
        next: fl ? `/lekcija/${fl.id}` : "/dashboard",
      });
      startUrl = `${SITE_URL}/auth/mejl?t=${encodeURIComponent(token)}`;
    } catch (e) {
      console.error(`[grant] login-link za welcome pao (order ${orderId}):`, e);
      Sentry.captureException(e);
    }
    // Mesečno plaćanje: banka traži da već prva (welcome) notifikacija kupcu jasno
    // kaže da je pokrenuta pretplata - iznos, učestalost, broj naplata i otkazivanje.
    const plan = jePretplata ? planForSlug(items[0]?.course_slug ?? "") : null;
    await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title), {
      startUrl,
      hasLesson,
      subscription: plan ? { monthlyRsd: plan.monthlyRsd, totalPayments: plan.totalPayments, tip: plan.tip } : undefined,
    });
  }
  return { ok: true };
}
