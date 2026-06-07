// src/lib/wc-variant-map.ts
// Čisto mapiranje WooCommerce varijacija → redovi za product_variants. Bez I/O.

const PROF_EMAILS: Record<string, string> = {
  natasa: "natasa@hartweger.rs",
  marija: "marija@hartweger.rs",
  milica: "milica@hartweger.rs",
  suzana: "suzana@hartweger.rs",
  katarina: "katarina@hartweger.rs",
  hristina: "hristina@hartweger.rs",
  danica: "danica@hartweger.rs",
};

// Standardne mesečne cene po package_type (Marijine više cene u WP-u su greška → standard).
const MONTHLY_STANDARD: Record<string, number> = { paket4: 14000, paket8: 27500, paket12: 41000 };

export function normalizeFirstName(s: string): string {
  return String(s).trim().split(/\s+/)[0].toLowerCase()
    .replace(/č|ć/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "dj");
}

export function profEmailForWcName(name: string): string | null {
  return PROF_EMAILS[normalizeFirstName(name)] ?? null;
}

interface WcAttr { name: string; option: string }
interface WcVariation { price: string; attributes: WcAttr[] }

export interface VariantRow {
  course_id: string;
  professor_id: string;
  package_type: string | null;
  price: number;
  paypal_price_eur: number | null;
  is_active: boolean;
}

function attr(v: WcVariation, name: string): string | null {
  const a = v.attributes.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return a ? a.option : null;
}

export function mapWcVariationsToRows(input: {
  courseId: string;
  isMonthly: boolean;
  profIdByEmail: Record<string, string>;
  variations: WcVariation[];
}): VariantRow[] {
  const rows: VariantRow[] = [];
  for (const v of input.variations) {
    const profName = attr(v, "Profesor");
    if (!profName) continue;
    const email = profEmailForWcName(profName);
    if (!email) continue;
    const profId = input.profIdByEmail[email];
    if (!profId) continue; // profesorka nije u bazi/seed-u — preskoči

    const packageType = input.isMonthly ? attr(v, "Paket") : null;
    let price = parseInt(String(v.price), 10);
    // Marija ispravka: za mesečni koristi standard cenu po paketu.
    if (input.isMonthly && email === "marija@hartweger.rs" && packageType && MONTHLY_STANDARD[packageType] != null) {
      price = MONTHLY_STANDARD[packageType];
    }
    rows.push({
      course_id: input.courseId,
      professor_id: profId,
      package_type: packageType,
      price,
      paypal_price_eur: null, // izvodi se calculatePaypalEur na checkout-u
      is_active: true,
    });
  }
  return rows;
}
