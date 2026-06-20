import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber, calculatePaypalEur } from "@/lib/order-utils";
import { sendPaymentInstructionsEmail, sendNewOrderAdminEmail } from "@/lib/email";
import { nivoForSlug } from "@/lib/course-nivo";
import { emailOwnsCourse, emailOwnsAnyVideoCourse } from "@/lib/coupon-ownership";
import { computeCouponDiscount, isTermPackage } from "@/lib/coupon-discount";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";

export async function POST(request: Request) {
  try {
    const { fullName, email, country, courseSlug, paymentMethod, couponCode: rawCouponCode, professorId, packageType, attribution } =
      await request.json();
    const attr = (attribution && typeof attribution === "object") ? attribution as Record<string, string> : {};

    // Validate required fields
    if (!fullName || !email || !country || !courseSlug || !paymentMethod) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    const ALLOWED = ["uplatnica", "paypal", "kartica", "kartica_rate"];
    if (!ALLOWED.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Neispravna metoda plaćanja." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Load course by slug where is_purchasable = true
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, slug, title, price, category, course_type, included_lessons")
      .eq("slug", courseSlug)
      .eq("is_purchasable", true)
      .single();

    if (courseError || !course) {
      console.log(`[orders] Course not found or not purchasable: ${courseSlug}`);
      return NextResponse.json(
        { error: "Kurs nije dostupan za kupovinu." },
        { status: 404 }
      );
    }

    // Grupni kurs: ne dozvoli kupovinu ako je grupa popunjena.
    if (course.category === "grupni") {
      const nivo = nivoForSlug(course.slug);
      if (nivo) {
        // Status filter radi pickOpenGroupForNivo (jedinstveno mesto definicije "otvoren"), isto kao grant-access.
        const { data: groupsForNivo } = await supabase
          .from("groups").select("id, level, status, start_date, max_seats, manual_enrolled")
          .eq("level", nivo);
        const group = pickOpenGroupForNivo(groupsForNivo ?? [], nivo);
        if (group) {
          const { count } = await supabase
            .from("group_enrollments").select("*", { count: "exact", head: true })
            .eq("group_id", group.id).eq("status", "active");
          const seats = computeSeats({
            maxSeats: group.max_seats, manualEnrolled: group.manual_enrolled ?? null,
            activeEnrollments: count ?? 0,
          });
          if (seats.full) {
            console.log(`[orders] Grupna blokada (409): ${course.slug} / ${nivo} - grupa ${group.id} popunjena`);
            return NextResponse.json(
              { error: "Grupa je trenutno popunjena. Ostavi mejl da te obavestimo za sledeći termin." },
              { status: 409 },
            );
          }
        }
      }
    }

    // Individualni: cena i broj časova dolaze iz product_variants (server-side, ne veruj klijentu).
    // Samo stvarno individualni proizvodi idu kroz product_variants (cena/prof/paket).
    // Video paketi (category="paket", course_type="video") imaju fiksnu cenu na kursu
    // i NE smeju da se tretiraju kao individualni - inače traže variant koji ne postoji
    // i kupovina pada sa "Izabrana kombinacija nije dostupna".
    const isIndividual = course.course_type === "individual" ||
      ["individualni", "mesecni"].includes(course.category ?? "");
    let unitPrice = course.price;
    let chosenProfessorId: string | null = null;
    let packageLessons: number | null = course.included_lessons ?? null;

    if (isIndividual) {
      let q = supabase
        .from("product_variants")
        .select("id, professor_id, package_type, price")
        .eq("course_id", course.id)
        .eq("is_active", true);
      q = professorId ? q.eq("professor_id", professorId) : q.is("professor_id", null);
      q = packageType ? q.eq("package_type", packageType) : q.is("package_type", null);
      const { data: variant } = await q.maybeSingle();
      if (!variant) {
        return NextResponse.json({ error: "Izabrana kombinacija nije dostupna. Osveži stranicu i pokušaj ponovo." }, { status: 400 });
      }
      unitPrice = variant.price;
      chosenProfessorId = variant.professor_id;
      packageLessons = variant.package_type
        ? parseInt(variant.package_type.replace(/\D/g, ""), 10)
        : (course.included_lessons ?? null);
    }

    // Validate coupon if provided
    let couponForDiscount: { discount_type: string; amount: number } | null = null;
    let validCouponCode: string | null = null;

    if (rawCouponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", String(rawCouponCode).trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
        const notMaxed = coupon.max_uses === null || coupon.usage_count < coupon.max_uses;
        // renewal_only kupon (npr. OBNOVI50): važi SAMO za obnovu kursa koji ovaj mejl već poseduje
        const renewalOk = !coupon.renewal_only || (await emailOwnsCourse(supabase, email, course.id));
        if (coupon.renewal_only && !renewalOk) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za obnovu kursa koji već imaš (na isti mejl)." },
            { status: 400 }
          );
        }
        // new_customers_only: samo za mejlove koji još nemaju nijedan video kurs
        if (coupon.new_customers_only && (await emailOwnsAnyVideoCourse(supabase, email))) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za prvu kupovinu video kursa." },
            { status: 400 }
          );
        }
        // video_only kupon (npr. NAKI10): važi samo na video kurseve
        if (coupon.video_only && course.course_type !== "video") {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za video kurseve." },
            { status: 400 }
          );
        }
        // once_per_email: isti mejl sme da iskoristi kod samo jednom
        let onceOk = true;
        if (coupon.once_per_email) {
          const { data: prior } = await supabase
            .from("orders")
            .select("id")
            .eq("coupon_code", coupon.code)
            .ilike("email", email)
            .limit(1);
          if (prior && prior.length) onceOk = false;
        }
        if (!onceOk) {
          return NextResponse.json(
            { error: "Ovaj kod si već iskoristio/la." },
            { status: 400 }
          );
        }
        // applies_to_course_id: kupon važi samo na tačno taj kurs
        if (coupon.applies_to_course_id && coupon.applies_to_course_id !== course.id) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za individualni FSP kurs." },
            { status: 400 }
          );
        }
        // requires_course_id: mejl mora već da poseduje taj kurs (npr. video FSP)
        if (coupon.requires_course_id && !(await emailOwnsCourse(supabase, email, coupon.requires_course_id))) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za polaznike koji su kupili video FSP kurs (na taj mejl)." },
            { status: 400 }
          );
        }
        // term_packages_only: kupon važi samo na individualne pakete od 4/8/12 termina
        if (coupon.term_packages_only && !isTermPackage(packageType)) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za individualne pakete (4, 8 ili 12 termina)." },
            { status: 400 }
          );
        }
        if (notExpired && notMaxed && renewalOk) {
          couponForDiscount = { discount_type: coupon.discount_type, amount: Number(coupon.amount) };
          validCouponCode = coupon.code;
        }
      }
    }

    const { discount, finalPrice } = couponForDiscount
      ? computeCouponDiscount(couponForDiscount.discount_type, couponForDiscount.amount, unitPrice)
      : { discount: 0, finalPrice: unitPrice };

    // Find or create user by email
    let userId: string;

    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log(`[orders] Existing user: ${email} (${userId})`);
    } else {
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });

      if (createError || !newUser.user) {
        console.error(`[orders] Failed to create user ${email}:`, createError);
        return NextResponse.json(
          { error: "Greška pri kreiranju naloga. Pokušajte ponovo." },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      console.log(`[orders] Created new user: ${email} (${userId})`);

      await supabase.from("user_profiles").upsert({
        id: userId,
        email,
        full_name: fullName,
        role: "student",
      });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate PayPal EUR price if needed
    const paypalEur =
      paymentMethod === "paypal"
        ? calculatePaypalEur(finalPrice)
        : undefined;

    // Build items JSONB
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: course.title,
        price: unitPrice,
        ...(isIndividual ? { professor_id: chosenProfessorId, package_lessons: packageLessons } : {}),
      },
    ];

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        email,
        full_name: fullName,
        country,
        items,
        subtotal: unitPrice,
        discount,
        total: finalPrice,
        coupon_code: validCouponCode,
        payment_method: paymentMethod,
        order_number: orderNumber,
        utm_source: attr.utm_source ?? null,
        utm_medium: attr.utm_medium ?? null,
        utm_campaign: attr.utm_campaign ?? null,
        source_type: attr.source_type ?? null,
        paypal_note:
          paymentMethod === "paypal"
            ? `${paypalEur} EUR - paypal.me/natasahartweger1`
            : null,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("[orders] Failed to insert order:", orderError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbine. Pokušajte ponovo." },
        { status: 500 }
      );
    }

    console.log(
      `[orders] Created order ${order.order_number} for ${email} - ${courseSlug} via ${paymentMethod}`
    );

    // Trenutna notifikacija adminu o svakoj novoj narudžbini (ne blokira odgovor ako mejl padne)
    await sendNewOrderAdminEmail({
      orderNumber: order.order_number,
      fullName,
      email,
      courseTitle: course.title,
      total: finalPrice,
      paymentMethod,
      country,
    });

    // Increment coupon usage count if coupon was applied
    if (validCouponCode) {
      const { data: coupon } = await supabase.from("coupons").select("usage_count").eq("code", validCouponCode).single();
      if (coupon) {
        await supabase.from("coupons").update({ usage_count: coupon.usage_count + 1 }).eq("code", validCouponCode);
      }
    }

    // Kartice se naplaćaju instant na bankovnoj strani - bez mejla sa instrukcijama;
    // narudžbina ostaje 'pending' dok NestPay callback ne potvrdi.
    const isCard = paymentMethod === "kartica" || paymentMethod === "kartica_rate";
    if (!isCard) {
      let ipsQrUrl: string | null = null;
      if (paymentMethod === "uplatnica") {
        const { generateIpsQrUrl } = await import("@/lib/ips-qr");
        ipsQrUrl = await generateIpsQrUrl(supabase, { total: finalPrice, order_number: order.order_number });
      }
      await sendPaymentInstructionsEmail(
        email,
        fullName,
        course.title,
        order.order_number,
        finalPrice,
        paymentMethod,
        paypalEur,
        undefined,
        ipsQrUrl ?? undefined
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      paymentMethod,
    });
  } catch (error) {
    console.error("[orders] Error:", error);
    return NextResponse.json(
      { error: "Greška na serveru. Pokušajte ponovo." },
      { status: 500 }
    );
  }
}
