import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { data: orders, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  // Admin auth check
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  try {
    const { email, courseId, totalAmount, paymentMethod, markAsPaid, sendPaymentEmail, fiscalize, professorId, packageType } = await request.json();

    // Validate required fields
    if (!email || !courseId || !totalAmount || !paymentMethod) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    // Iznos mora biti ceo broj dinara (total/subtotal su integer kolone - decimala obara upis).
    const amount = Math.round(Number(totalAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Iznos mora biti broj veći od 0." }, { status: 400 });
    }

    // Load course by ID
    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, slug, title, price, course_type, category, included_lessons")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Kurs nije pronađen." }, { status: 404 });
    }

    // Individualni: cena, profesorka i broj časova dolaze iz product_variants
    // (kao na javnom checkout-u) - ne veruj iznosu s klijenta. professor_id +
    // package_lessons se upisuju u items[0] da grantAccessForOrder kreira
    // individual_enrollments i professor_students vezu.
    const isIndividual = course.course_type === "individual" ||
      ["individualni", "mesecni"].includes(course.category ?? "");
    let chosenProfessorId: string | null = null;
    let packageLessons: number | null = null;
    let variantPrice: number | null = null;
    if (isIndividual) {
      let q = admin
        .from("product_variants")
        .select("id, professor_id, package_type, price")
        .eq("course_id", course.id)
        .eq("is_active", true);
      q = professorId ? q.eq("professor_id", professorId) : q.is("professor_id", null);
      q = packageType ? q.eq("package_type", packageType) : q.is("package_type", null);
      const { data: variant } = await q.maybeSingle();
      if (!variant) {
        return NextResponse.json(
          { error: "Izabrana kombinacija (profesorka/paket) nije dostupna." },
          { status: 400 },
        );
      }
      chosenProfessorId = variant.professor_id;
      variantPrice = variant.price;
      packageLessons = variant.package_type
        ? parseInt(variant.package_type.replace(/\D/g, ""), 10)
        : (course.included_lessons ?? null);
    }
    // Za individualne cena je autoritativna iz varijacije; inače uneti iznos.
    const finalAmount = variantPrice ?? amount;

    // Find or create user by email
    let userId: string;
    let userName: string;

    const { data: existingProfile } = await admin
      .from("user_profiles")
      .select("id, full_name")
      .eq("email", email.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      userName = existingProfile.full_name ?? email;
      console.log(`[admin/orders] Existing user: ${email} (${userId})`);
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !newUser.user) {
        console.error(`[admin/orders] Failed to create user ${email}:`, createError);
        return NextResponse.json(
          { error: "Greška pri kreiranju naloga." },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      userName = email;
      console.log(`[admin/orders] Created new user: ${email} (${userId})`);

      await admin.from("user_profiles").upsert({
        id: userId,
        email,
        full_name: email,
        role: "student",
      });
    }

    // Generate order number
    const { generateOrderNumber } = await import("@/lib/order-utils");
    const orderNumber = await generateOrderNumber();

    // Build items
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: course.title,
        price: finalAmount,
        ...(isIndividual ? { professor_id: chosenProfessorId, package_lessons: packageLessons } : {}),
      },
    ];

    // Create order as pending; grantAccessForOrder ga prebacuje u completed.
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        email,
        full_name: userName,
        items,
        subtotal: finalAmount,
        total: finalAmount,
        payment_method: paymentMethod,
        order_number: orderNumber,
        payment_status: "pending",
        granted: false,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      console.error("[admin/orders] Failed to insert order:", orderError);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbine." },
        { status: 500 }
      );
    }

    console.log(`[admin/orders] Created order ${order.order_number} for ${email}`);

    // markAsPaid → isti tok kao "Potvrdi uplatu": course_unlocks → pristup (svi vezani kursevi),
    // welcome mejl. Fiskalizacija SAMO ako je admin eksplicitno čekirao "Fiskalizuj" - neki računi
    // idu preko SEF-a i ne smeju da dobiju fiskalni račun (odluka 12.06.2026).
    if (markAsPaid) {
      const result = await grantAccessForOrder(order.id);
      if (!result.ok) {
        console.error(`[admin/orders] grantAccessForOrder failed for ${order.order_number}: ${result.error}`);
        return NextResponse.json(
          { error: result.error ?? "Greška pri dodeli pristupa." },
          { status: 500 }
        );
      }
      if (fiscalize) {
        await fiscalizeOrder(order.id); // idempotentno; ne blokira pristup ako padne
      }
    } else if (sendPaymentEmail) {
      // Pošalji kupcu podatke za uplatu (uplatnica/PayPal/kartica). Best-effort.
      try {
        const { sendPaymentInstructionsEmail } = await import("@/lib/email");
        const { calculatePaypalEur } = await import("@/lib/order-utils");
        const paypalEur = paymentMethod === "paypal" ? calculatePaypalEur(finalAmount) : undefined;
        let ipsQrUrl: string | null = null;
        if (paymentMethod === "uplatnica") {
          const { generateIpsQrUrl } = await import("@/lib/ips-qr");
          ipsQrUrl = await generateIpsQrUrl(admin, order);
        }
        await sendPaymentInstructionsEmail(email, userName, course.title, order.order_number, finalAmount, paymentMethod, paypalEur, order.id, ipsQrUrl ?? undefined);
      } catch (e) {
        console.error(`[admin/orders] payment email failed for ${order.order_number}:`, e);
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[admin/orders] Error:", error);
    return NextResponse.json({ error: "Greška na serveru." }, { status: 500 });
  }
}
