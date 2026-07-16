import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { generateOrderNumber, calculatePaypalEur } from "@/lib/order-utils";
import { sendPaymentInstructionsEmail, sendNewOrderAdminEmail } from "@/lib/email";
import { nivoForSlug } from "@/lib/course-nivo";
import { emailOwnsCourse, emailOwnsAnyVideoCourse, emailUsedCoupon } from "@/lib/coupon-ownership";
import { computeCouponDiscount, isTermPackage } from "@/lib/coupon-discount";
import { computeSeats, pickOpenGroupForNivo } from "@/lib/groups";

export async function POST(request: Request) {
  try {
    // Ruta kreira naloge (auth.admin.createUser) i šalje mejlove na proizvoljan
    // mejl - bez kočnica je email-bomb/spam vektor.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipLimit = rateLimit(`orders:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Previše pokušaja. Sačekaj par minuta pa pokušaj ponovo." },
        { status: 429 }
      );
    }

    const { fullName, email, country, courseSlug, paymentMethod, couponCode: rawCouponCode, professorId, packageType, pages: rawPages, attribution } =
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
    // (pre kočnice po mejlu - za reuse pending porudžbine poredimo items[0].course_id)
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

    // Povratak sa NestPay strane: kupac često ponovi pokušaj plaćanja za isti kurs,
    // pa bi svaki pokušaj pravio novu porudžbinu + novi admin mejl. Umesto toga
    // ažuriramo njegovu poslednju pending porudžbinu (<24h) za isti kurs.
    // Reuse SAMO za pending: NestPay veže iznos za order_number, pa se naplaćena
    // porudžbina ne sme menjati.
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, created_at, payment_status, items")
      .ilike("email", email)
      .gte("created_at", dayAgo);

    const reusableOrder =
      (recentOrders ?? [])
        .filter(
          (o) =>
            o.payment_status === "pending" &&
            Array.isArray(o.items) &&
            o.items[0]?.course_id === course.id
        )
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] ?? null;

    // DB kočnica po mejlu (preživljava cold start, za razliku od in-memory limita):
    // 3+ porudžbine za isti mejl u poslednjih sat = neko bombarduje tuđi inbox.
    // Važi samo za stvarno NOVE porudžbine - ponovni pokušaj plaćanja iste (reuse)
    // je legitiman i ne sme da dobije 429.
    if (!reusableOrder) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentForEmail = (recentOrders ?? []).filter(
        (o) => String(o.created_at) >= hourAgo
      ).length;
      if (recentForEmail >= 3) {
        console.log(`[orders] Email throttle (429): ${email} - ${recentForEmail} porudžbina u poslednjih sat`);
        return NextResponse.json(
          { error: "Previše porudžbina za ovaj mejl. Sačekaj sat vremena ili nam piši na info@hartweger.rs." },
          { status: 429 }
        );
      }
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
        // (broji se samo naplaćena porudžbina - odbijena kartica ne troši kod)
        const onceOk =
          !coupon.once_per_email || !(await emailUsedCoupon(supabase, coupon.code, email));
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

    // Usluge (category="usluga", npr. prevod): cena po strani × broj strana.
    // Server-side clamp - klijentu se ne veruje za iznos.
    const isService = course.category === "usluga";
    const pages = isService
      ? Math.min(50, Math.max(1, Math.trunc(Number(rawPages)) || 1))
      : 1;
    const lineTotal = unitPrice * pages;

    const { discount, finalPrice } = couponForDiscount
      ? computeCouponDiscount(couponForDiscount.discount_type, couponForDiscount.amount, lineTotal)
      : { discount: 0, finalPrice: lineTotal };

    // Calculate PayPal EUR price if needed
    const paypalEur =
      paymentMethod === "paypal"
        ? calculatePaypalEur(finalPrice)
        : undefined;

    const paypalNote =
      paymentMethod === "paypal"
        ? `${paypalEur} EUR - paypal.me/natasahartweger1`
        : null;

    // Build items JSONB
    // Usluga: broj strana ide u naziv stavke (fiskalni račun čita items[0].title) + quantity.
    const stranaLabel = pages % 10 >= 2 && pages % 10 <= 4 && (pages % 100 < 12 || pages % 100 > 14) ? "strane" : "strana";
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: isService ? `${course.title} - ${pages} ${stranaLabel}` : course.title,
        price: unitPrice,
        ...(isService ? { quantity: pages } : {}),
        ...(isIndividual ? { professor_id: chosenProfessorId, package_lessons: packageLessons } : {}),
      },
    ];

    let order: { id: string; order_number: string } | null = null;
    let reusedOrder = false;

    if (reusableOrder) {
      // Guard .eq("payment_status", "pending") štiti od trke sa NestPay callbackom:
      // ako je porudžbina u međuvremenu naplaćena, ne diramo je nego pravimo novu.
      // order_number ostaje isti - NestPay retry ide preko istog broja.
      const { data: updated } = await supabase
        .from("orders")
        .update({
          items,
          subtotal: lineTotal,
          discount,
          total: finalPrice,
          coupon_code: validCouponCode,
          payment_method: paymentMethod,
          paypal_note: paypalNote,
        })
        .eq("id", reusableOrder.id)
        .eq("payment_status", "pending")
        .select("id, order_number")
        .maybeSingle();

      if (updated) {
        order = updated;
        reusedOrder = true;
        console.log(
          `[orders] Reused pending order ${updated.order_number} for ${email} - ${courseSlug} via ${paymentMethod}`
        );
      }
    }

    if (!order) {
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

      // Insert order
      const { data: inserted, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          email,
          full_name: fullName,
          country,
          items,
          subtotal: lineTotal,
          discount,
          total: finalPrice,
          coupon_code: validCouponCode,
          payment_method: paymentMethod,
          order_number: orderNumber,
          utm_source: attr.utm_source ?? null,
          utm_medium: attr.utm_medium ?? null,
          utm_campaign: attr.utm_campaign ?? null,
          source_type: attr.source_type ?? null,
          paypal_note: paypalNote,
        })
        .select("id, order_number")
        .single();

      if (orderError || !inserted) {
        console.error("[orders] Failed to insert order:", orderError);
        return NextResponse.json(
          { error: "Greška pri kreiranju narudžbine. Pokušajte ponovo." },
          { status: 500 }
        );
      }

      order = inserted;
      console.log(
        `[orders] Created order ${inserted.order_number} for ${email} - ${courseSlug} via ${paymentMethod}`
      );
    }

    // Trenutna notifikacija adminu o svakoj novoj narudžbini (ne blokira odgovor ako mejl padne).
    // Reuse iste pending porudžbine NE šalje novi admin mejl - to je isti kupac
    // koji ponavlja pokušaj plaćanja, ne nova narudžbina.
    if (!reusedOrder) {
      await sendNewOrderAdminEmail({
        orderNumber: order.order_number,
        fullName,
        email,
        courseTitle: items[0].title,
        total: finalPrice,
        paymentMethod,
        country,
      });
    }

    // usage_count se NE uvećava ovde: kupon troši limit tek kad porudžbina postane
    // completed (grantAccessForOrder) — odbijena kartica ne sme da pojede max_uses.

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
        items[0].title,
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
