// src/lib/grant-access.ts
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendGrupniWelcomeEmail, sendProfNewStudentEmail, sendIndividualWelcomeEmail, sendProfNewIndividualStudentEmail } from "@/lib/email";
import { nivoForSlug } from "@/lib/course-nivo";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";
import { callGas } from "@/lib/gas";
import { sendGa4Purchase } from "@/lib/ga4-mp";
import { sendPurchaseEvent } from "@/lib/meta-capi";
import { SITE_URL } from "@/lib/site-url";
import { createLoginLinkToken } from "@/lib/login-link";
import { firstLessonForCourses } from "@/lib/first-lesson";

interface OrderItem { course_id: string; course_slug: string; title: string; price: number; }

/** Dodeljuje pristup za narudžbinu (course_unlocks → course_access), označava completed+granted, šalje welcome mejl. Idempotentno. */
export async function grantAccessForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "Order not found" };
  if (order.payment_status === "completed") return { ok: true }; // idempotentno

  const items: OrderItem[] = order.items ?? [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

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

  const grantFailures: string[] = [];
  for (const courseId of contentCourseIds) {
    const { data: existing } = await admin
      .from("course_access").select("id, expires_at")
      .eq("user_id", order.user_id).eq("course_id", courseId).single();
    if (!existing) {
      const { error: insertError } = await admin.from("course_access").insert({
        user_id: order.user_id, course_id: courseId, expires_at: expiresAt.toISOString(),
        source: `order:${order.order_number ?? orderId}`,
      });
      if (insertError) grantFailures.push(`${courseId}: ${insertError.message}`);
    } else if (existing.expires_at && new Date(existing.expires_at) < expiresAt) {
      // Obnova: postojeći red (npr. wp-migracija) se produžava, nikad ne skraćuje.
      const { error: updateError } = await admin.from("course_access")
        .update({ expires_at: expiresAt.toISOString(), source: `order:${order.order_number ?? orderId}` })
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
      const group = pickOpenGroupForNivo(groupsForNivo ?? [], nivo);
      if (!group) { console.warn(`[grant] Nema otvorene grupe za nivo ${nivo} (order ${orderId})`); continue; }

      const { count } = await admin.from("group_enrollments").select("*", { count: "exact", head: true })
        .eq("group_id", group.id).eq("status", "active");

      const seats = computeSeats({ maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled, activeEnrollments: count ?? 0 });
      if (seats.full) {
        console.error(`[grant][oversell] Grupa ${group.id} (${nivo}) je puna - preskačem auto-upis za order ${orderId} (user ${order.user_id}). Rešiti ručno.`);
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
        nivo, profIme, meetLink: group.meet_link, notesUrl: group.notes_url,
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

  await admin.from("orders").update({ payment_status: "completed", granted: true }).eq("id", orderId);
  // GA4 prihod (server-side) za SVE načine plaćanja — klijentski purchase hvata samo karticu.
  await sendGa4Purchase(order);
  // Meta Purchase (CAPI) iz JEDNE tačke — pokriva SVE puteve do "completed" (kartica callback,
  // admin potvrda uplatnice/PayPala, recovery cron, ručna admin porudžbina). Dedup sa browser
  // pixel-om ide preko event_id (purchase_<order_number>). Rezultat pamtimo u meta_purchase_sent
  // (trajna evidencija + osnova za retry). Best-effort: ne ruši dodelu pristupa ako padne.
  if (!order.meta_purchase_sent) {
    const metaOk = await sendPurchaseEvent(order, { eventSourceUrl: `${SITE_URL}/kupovina/hvala/${order.id}` });
    if (metaOk) await admin.from("orders").update({ meta_purchase_sent: true }).eq("id", orderId);
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
    await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title), { startUrl, hasLesson });
  }
  return { ok: true };
}
