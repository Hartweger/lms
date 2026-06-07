// src/lib/grant-access.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendGrupniWelcomeEmail } from "@/lib/email";
import { nivoForSlug } from "@/lib/course-nivo";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";
import { callGas } from "@/lib/gas";

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
    else { console.warn(`[grant] No course_unlocks for ${item.course_slug} (${item.course_id}) — granting product itself`); contentCourseIds.add(item.course_id); }
  }

  for (const courseId of contentCourseIds) {
    const { data: existing } = await admin
      .from("course_access").select("id")
      .eq("user_id", order.user_id).eq("course_id", courseId).single();
    if (!existing) {
      await admin.from("course_access").insert({
        user_id: order.user_id, course_id: courseId, expires_at: expiresAt.toISOString(),
      });
    }
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
        .select("id, level, status, start_date, max_seats, manual_enrolled, term_opened_at, gcal_event_id, meet_link, notes_url, professor:professor_id(full_name)")
        .eq("level", nivo);
      const group = pickOpenGroupForNivo(groupsForNivo ?? [], nivo);
      if (!group) { console.warn(`[grant] Nema otvorene grupe za nivo ${nivo} (order ${orderId})`); continue; }

      // Brojanje upisa tekućeg termina (od term_opened_at, ako postoji).
      let countQ = admin.from("group_enrollments").select("*", { count: "exact", head: true })
        .eq("group_id", group.id).eq("status", "active");
      if (group.term_opened_at) countQ = countQ.gte("enrolled_at", group.term_opened_at);
      const { count } = await countQ;

      const seats = computeSeats({ maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled, activeEnrollments: count ?? 0 });
      if (seats.full) {
        console.error(`[grant][oversell] Grupa ${group.id} (${nivo}) je puna — preskačem auto-upis za order ${orderId} (user ${order.user_id}). Rešiti ručno.`);
        continue;
      }
      await admin.from("group_enrollments").upsert(
        { group_id: group.id, user_id: order.user_id, status: "active", enrolled_at: new Date().toISOString() },
        { onConflict: "group_id,user_id" },
      );
      console.log(`[grant] Auto-upis u grupu ${group.id} (${nivo}) za order ${orderId}`);

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
    } catch (e) {
      console.error(`[grant] Grupni tok pao za nivo ${nivo} (order ${orderId}):`, e);
    }
  }

  await admin.from("orders").update({ payment_status: "completed", granted: true }).eq("id", orderId);
  // Generički welcome šaljemo samo ako nismo već poslali grupni (da polaznik dobije jedan mejl).
  if (!grupniWelcomeSent) await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title));
  return { ok: true };
}
