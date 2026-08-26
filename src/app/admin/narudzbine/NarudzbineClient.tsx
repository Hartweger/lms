"use client";

import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import type { CardDecline } from "@/lib/order-utils";
import { orderTotals, orderFiscalStatus, canDeleteOrder, canRefundOrder, pendingPaymentState, cardDeclineReason } from "@/lib/order-utils";
import { professorsFromVariants, packageTypesFromVariants, resolveVariant, type Variant } from "@/lib/individual-pricing";

type Filter = "sve" | "na-cekanju" | "potvrdjene";

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface Props {
  initialOrders: Order[];
  courses: CourseOption[];
  variantsByCourse?: Record<string, Variant[]>;
  /** Pričamo sa demo SEF-om - fakture nisu prijavljene državi. */
  sefDemo?: boolean;
}

const PAKET_LABEL: Record<string, string> = { paket4: "4 termina", paket8: "8 termina", paket12: "12 termina" };

/** SEF statusi na našem jeziku. Ono što nije ovde se prikazuje kako je stiglo. */
const SEF_LABEL: Record<string, string> = {
  Sending: "šalje se",
  Sent: "poslata",
  Approved: "prihvaćena",
  Rejected: "ODBIJENA",
  Paid: "plaćena",
  Cancelled: "otkazana",
  Storno: "stornirana",
  Mistake: "greška",
  OverDue: "istekla",
  GRESKA: "slanje palo",
};

const SEF_BOJA: Record<string, string> = {
  Approved: "text-green-600",
  Paid: "text-green-600",
  Rejected: "text-koral font-semibold",
  Mistake: "text-koral font-semibold",
  GRESKA: "text-koral font-semibold",
  OverDue: "text-amber-600",
};

/**
 * Sitan red ispod statusa: šta je tačno banka odgovorila.
 * Tooltip nosi sirove kodove (ProcReturnCode, 3DS) - to je ono što se citira banci u reklamaciji.
 */
function RazlogBanke({ decline, kartica }: { decline: CardDecline | null; kartica: boolean }) {
  if (decline) {
    const vidljivo = [decline.poruka, decline.autentikacija].filter(Boolean).join(" · ");
    const tooltip = [
      decline.kod ? `ProcReturnCode: ${decline.kod}` : null,
      decline.poruka ? `poruka banke: ${decline.poruka}` : null,
      decline.autentikacija ? `3DS: ${decline.autentikacija}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      <span className="text-xs text-koral max-w-[190px]" title={tooltip}>
        {vidljivo || "banka odbila"}
      </span>
    );
  }
  if (!kartica) return null;
  return (
    <span
      className="text-xs text-gray-400"
      title="Banka nikad nije odgovorila - kupac nije završio plaćanje na strani banke"
    >
      bez odgovora banke
    </span>
  );
}

export default function NarudzbineClient({ initialOrders, courses, variantsByCourse = {}, sefDemo = false }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<Filter>("sve");
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stornoId, setStornoId] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newProfessorId, setNewProfessorId] = useState<string | null>(null);
  const [newPackageType, setNewPackageType] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [newPayment, setNewPayment] = useState("uplatnica");
  const [newMarkPaid, setNewMarkPaid] = useState(false);
  const [newFiscalize, setNewFiscalize] = useState(false);
  const [newSendEmail, setNewSendEmail] = useState(true);
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  // Kupac pravno lice. `newGroupId` se puni posle prve sačuvane narudžbine te
  // kupovine, pa svaki sledeći polaznik ulazi u istu grupu i isti dokument.
  const [newJeFirma, setNewJeFirma] = useState(false);
  const [newPib, setNewPib] = useState("");
  const [newNazivFirme, setNewNazivFirme] = useState("");
  const [newAdresaFirme, setNewAdresaFirme] = useState("");
  const [newGradFirme, setNewGradFirme] = useState("");
  const [newMaticni, setNewMaticni] = useState("");
  const [newBillingEmail, setNewBillingEmail] = useState("");
  const [newGroupId, setNewGroupId] = useState<string | null>(null);
  const [firmaTrazenje, setFirmaTrazenje] = useState(false);
  const [firmaNadjena, setFirmaNadjena] = useState(false);
  const [dokLoading, setDokLoading] = useState<string | null>(null);
  const [dokError, setDokError] = useState<string | null>(null);
  const [sendingPay, setSendingPay] = useState<string | null>(null);
  const [sentPay, setSentPay] = useState<string | null>(null);

  // Varijacije izabranog kursa (prazno za ne-individualne). Cena 1:1 narudžbine
  // dolazi iz varijacije (profesorka + broj termina), ne iz osnovne cene kursa.
  const selVariants = variantsByCourse[newCourseId] ?? [];
  const selIsIndividual = selVariants.length > 0;
  const selProfessors = professorsFromVariants(selVariants);
  const selPackageTypes = packageTypesFromVariants(selVariants);

  function priceFor(profId: string | null, pkg: string | null): number | null {
    const v = resolveVariant(selVariants, { professorId: profId, packageType: pkg });
    return v?.price ?? null;
  }

  function handleCourseChange(courseId: string) {
    setNewCourseId(courseId);
    const course = courses.find((c) => c.id === courseId);
    const variants = variantsByCourse[courseId] ?? [];
    if (variants.length > 0) {
      // Individualni: podrazumevano prva profesorka + prvi paket, cena iz varijacije.
      const profs = professorsFromVariants(variants);
      const pkgs = packageTypesFromVariants(variants);
      const profId = profs[0]?.id ?? null;
      const pkg = pkgs[0] ?? null;
      setNewProfessorId(profId);
      setNewPackageType(pkg);
      const v = resolveVariant(variants, { professorId: profId, packageType: pkg });
      setNewAmount(v ? String(v.price) : "");
    } else {
      setNewProfessorId(null);
      setNewPackageType(null);
      if (course) setNewAmount(String(course.price));
    }
  }

  function handleProfessorChange(profId: string) {
    setNewProfessorId(profId);
    const p = priceFor(profId, newPackageType);
    if (p != null) setNewAmount(String(p));
  }

  function handlePackageChange(pkg: string) {
    setNewPackageType(pkg);
    const p = priceFor(newProfessorId, pkg);
    if (p != null) setNewAmount(String(p));
  }

  /** Firma koja je već kupovala se ne kuca ponovo - podaci dolaze iz naše baze. */
  async function povuciFirmu(pib: string) {
    const cist = pib.trim();
    if (cist.length < 8) return;
    setFirmaTrazenje(true);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(cist)}`);
      const json = await res.json();
      if (json.firma) {
        setNewNazivFirme(json.firma.naziv ?? "");
        setNewAdresaFirme(json.firma.adresa ?? "");
        setNewGradFirme(json.firma.grad ?? "");
        setNewMaticni(json.firma.maticni_broj ?? "");
        if (!newBillingEmail) setNewBillingEmail(json.firma.email ?? "");
        setFirmaNadjena(true);
      } else {
        setFirmaNadjena(false);
      }
    } catch {
      setFirmaNadjena(false);
    } finally {
      setFirmaTrazenje(false);
    }
  }

  /** Izdaje predračun ili fakturu za celu grupu narudžbina te firme. */
  async function izdajDokument(order: Order, tip: "predracun" | "faktura") {
    if (!order.company_order_group) return;
    setDokLoading(`${order.id}-${tip}`);
    setDokError(null);
    try {
      const res = await fetch(`/api/admin/dokument/${order.company_order_group}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDokError(json.error ?? "Dokument nije poslat.");
        return;
      }
      // Broj se upisuje na SVE narudžbine grupe, isto kao na serveru.
      setOrders((prev) =>
        prev.map((o) =>
          o.company_order_group === order.company_order_group
            ? { ...o, [tip === "predracun" ? "predracun_broj" : "faktura_broj"]: json.broj }
            : o,
        ),
      );
    } catch {
      setDokError("Greška na serveru.");
    } finally {
      setDokLoading(null);
    }
  }

  /** Šalje već izdatu fakturu na SEF. Zaseban klik, namerno odvojen od izdavanja. */
  async function posaljiNaSef(order: Order) {
    if (!order.company_order_group) return;
    setDokLoading(`${order.id}-sef`);
    setDokError(null);
    try {
      const res = await fetch(`/api/admin/sef/${order.company_order_group}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setDokError(json.error ?? "Slanje na SEF nije uspelo.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.company_order_group === order.company_order_group
            ? { ...o, sef_invoice_id: json.sefInvoiceId, sef_status: json.status }
            : o,
        ),
      );
    } catch {
      setDokError("Greška na serveru.");
    } finally {
      setDokLoading(null);
    }
  }

  async function createOrder() {
    setNewLoading(true);
    setNewError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          courseId: newCourseId,
          totalAmount: Number(newAmount),
          paymentMethod: newPayment,
          markAsPaid: newMarkPaid,
          fiscalize: newMarkPaid && newFiscalize,
          sendPaymentEmail: newSendEmail && !newMarkPaid,
          professorId: selIsIndividual ? newProfessorId : null,
          packageType: selIsIndividual ? newPackageType : null,
          firma: newJeFirma
            ? { pib: newPib, naziv: newNazivFirme, adresa: newAdresaFirme, grad: newGradFirme, maticniBroj: newMaticni }
            : null,
          billingEmail: newJeFirma ? newBillingEmail : null,
          groupId: newJeFirma ? newGroupId : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNewError(json.error ?? "Greška pri kreiranju narudžbine.");
        return;
      }
      // Ime profesorke se na serveru izvodi iz individual_enrollments (vidi se po
      // osvežavanju); ovde ga dodamo odmah radi prikaza u tabeli.
      const profName = selIsIndividual
        ? selProfessors.find((p) => p.id === newProfessorId)?.full_name ?? null
        : null;
      setOrders((prev) => [{ ...json.order, professor_name: profName }, ...prev]);
      // Polaznikova polja se uvek prazne. Kod firme forma OSTAJE otvorena sa
      // podacima firme i grupom - da sledeći polaznik iste kupovine uđe u isti
      // dokument, bez ponovnog kucanja PIB-a.
      setNewEmail("");
      setNewCourseId("");
      setNewProfessorId(null);
      setNewPackageType(null);
      setNewAmount("");
      if (newJeFirma) {
        setNewGroupId(json.order.company_order_group ?? null);
      } else {
        setShowNewForm(false);
        setNewPayment("uplatnica");
        setNewMarkPaid(false);
        setNewFiscalize(false);
      }
    } catch {
      setNewError("Greška na serveru.");
    } finally {
      setNewLoading(false);
    }
  }

  async function sendPayment(orderId: string) {
    setSendingPay(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/send-payment`, { method: "POST" });
      if (res.ok) { setSentPay(orderId); setTimeout(() => setSentPay((p) => (p === orderId ? null : p)), 3000); }
    } finally {
      setSendingPay(null);
    }
  }

  const orderProduct = (o: Order) =>
    (o.items as { title: string }[])[0]?.title ?? "-";
  const products = Array.from(new Set(orders.map(orderProduct)))
    .filter((p) => p !== "-")
    .sort((a, b) => a.localeCompare(b, "sr"));

  const q = search.trim().toLowerCase();
  const filtered = orders.filter((o) => {
    if (filter === "na-cekanju" && o.payment_status !== "pending") return false;
    if (filter === "potvrdjene" && o.payment_status !== "completed") return false;
    if (productFilter && orderProduct(o) !== productFilter) return false;
    if (
      q &&
      !(`${o.full_name ?? ""}`.toLowerCase().includes(q) ||
        `${o.email ?? ""}`.toLowerCase().includes(q))
    )
      return false;
    return true;
  });

  const pendingCount = orders.filter((o) => o.payment_status === "pending").length;
  const totals = orderTotals(filtered);

  async function deleteOrder(orderId: string, notify: boolean) {
    setDeleting(orderId);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}${notify ? "?notify=1" : ""}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setDeleting(null);
      setDeleteId(null);
    }
  }

  // Sinhroni guard: disabled={isLoading} ne stigne da se primeni kod brzog duplog klika
  // (state update čeka re-render), pa su za order 2026-268 mejlovi otišli 2x. Ref je odmah true.
  const confirmInFlight = useRef(false);

  async function confirmPayment(orderId: string) {
    if (confirmInFlight.current) return;
    confirmInFlight.current = true;
    setLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, payment_status: "completed", granted: true } : o
          )
        );
      } else {
        const { error } = await res.json().catch(() => ({ error: res.statusText }));
        alert(`Potvrda nije uspela: ${error}`);
      }
    } finally {
      confirmInFlight.current = false;
      setLoading(null);
      setConfirmId(null);
    }
  }

  async function reFiscalize(orderId: string) {
    setLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/fiscalize`, {
        method: "POST",
      });
      if (res.ok) {
        const { order: updated } = await res.json().catch(() => ({ order: null }));
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  fiscalized_at: updated?.fiscalized_at ?? o.fiscalized_at,
                  fiscal_pdf_url: updated?.fiscal_pdf_url ?? o.fiscal_pdf_url,
                  fiscal_referent_number:
                    updated?.fiscal_referent_number ?? o.fiscal_referent_number,
                }
              : o
          )
        );
      } else {
        const { error } = await res.json().catch(() => ({ error: String(res.status) }));
        alert(`Fiskalizacija nije uspela: ${error}`);
      }
    } finally {
      setLoading(null);
    }
  }

  // Storno: protivračun kod PURS-a + oduzimanje pristupa. Nepovratno, zato dvostepena potvrda
  // (setStornoId → "Da"). Novac se NE vraća odavde - to ide kroz banku.
  async function stornoOrder(orderId: string) {
    setLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/storno`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payment_status: "refunded",
                  granted: false,
                  refunded_at: body.order?.refunded_at ?? new Date().toISOString(),
                  refund_referent_number: body.order?.refund_referent_number ?? null,
                  refund_pdf_url: body.order?.refund_pdf_url ?? null,
                }
              : o
          )
        );
        const s = body.skinuto;
        const sazetak = s ? `Skinuto: ${s.courseAccess} pristup(a), ${s.grupni} grupni, ${s.individualni} individualni upis.` : "";
        const napomene = (body.napomene ?? []).length ? `\n\n${(body.napomene as string[]).join("\n")}` : "";
        alert(`Storno je prošao. ${sazetak}${napomene}\n\nNovac vrati kroz Merchant centar banke - to nije urađeno ovde.`);
      } else {
        alert(`Storno nije prošao: ${body.error ?? res.status}`);
      }
    } finally {
      setLoading(null);
      setStornoId(null);
    }
  }

  function formatPaymentMethod(method: string) {
    if (method === "paypal") return "PayPal";
    if (method === "swift") return "SWIFT";
    if (method === "ips") return "IPS / Prenos";
    if (method === "rate") return "Rate";
    return method;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Narudžbine</h1>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {filtered.length === orders.length
                ? `${orders.length} ukupno`
                : `${filtered.length} od ${orders.length}`}
            </span>
            <span className="text-green-600 font-medium">
              Potvrđeno: {totals.confirmed.toLocaleString("sr-RS")} RSD
            </span>
            <span className="text-yellow-600 font-medium">
              Na čekanju: {totals.pending.toLocaleString("sr-RS")} RSD
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-plava text-white hover:bg-plava-dark transition-colors"
          >
            + Nova narudžbina
          </button>
        </div>
      </div>

      {/* New order form */}
      {showNewForm && (
        <div className="bg-plava-light rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova narudžbina</h2>

          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={newJeFirma}
              onChange={(e) => {
                setNewJeFirma(e.target.checked);
                if (!e.target.checked) {
                  setNewGroupId(null);
                  setFirmaNadjena(false);
                }
              }}
              className="rounded border-gray-300 text-plava focus:ring-plava"
            />
            <span className="text-sm font-medium text-gray-700">Kupac je firma</span>
          </label>

          {newJeFirma && (
            <div className="rounded-lg bg-white/60 p-4 mb-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIB</label>
                  <input
                    type="text"
                    value={newPib}
                    onChange={(e) => setNewPib(e.target.value)}
                    onBlur={(e) => povuciFirmu(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="108712117"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {firmaTrazenje
                      ? "Tražim firmu..."
                      : firmaNadjena
                      ? "Firma je već kupovala - podaci su popunjeni."
                      : "Nova firma - podaci se pamte za sledeći put."}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naziv firme</label>
                  <input
                    type="text"
                    value={newNazivFirme}
                    onChange={(e) => setNewNazivFirme(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="PROBA DOO BEOGRAD"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ulica i broj</label>
                  <input
                    type="text"
                    value={newAdresaFirme}
                    onChange={(e) => setNewAdresaFirme(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="Neka ulica 1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                  <input
                    type="text"
                    value={newGradFirme}
                    onChange={(e) => setNewGradFirme(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="Beograd"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Zasebno polje jer SEF traži grad odvojeno od ulice.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matični broj</label>
                  <input
                    type="text"
                    value={newMaticni}
                    onChange={(e) => setNewMaticni(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="21268372"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mejl za predračun i fakturu
                  </label>
                  <input
                    type="email"
                    value={newBillingEmail}
                    onChange={(e) => setNewBillingEmail(e.target.value)}
                    disabled={!!newGroupId}
                    placeholder="racunovodstvo@firma.rs"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ovde idu dokumenti. Polaznik dobija pristup na svoj mejl, ispod.
                  </p>
                </div>
              </div>
              {newGroupId && (
                <p className="text-xs text-plava mt-3">
                  Polaznik je sačuvan. Unesi sledećeg - ući će u isti predračun i istu fakturu.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {newJeFirma ? "Email polaznika" : "Email kupca"}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="korisnik@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurs
              </label>
              <select
                value={newCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              >
                <option value="">- Izaberi kurs -</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.price.toLocaleString("sr-RS")} RSD)
                  </option>
                ))}
              </select>
            </div>
            {selIsIndividual && (
              <>
                {selPackageTypes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Broj termina
                    </label>
                    <select
                      value={newPackageType ?? ""}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                    >
                      {selPackageTypes.map((p) => (
                        <option key={p} value={p}>{PAKET_LABEL[p] ?? p}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesorka
                  </label>
                  <select
                    value={newProfessorId ?? ""}
                    onChange={(e) => handleProfessorChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                  >
                    {selProfessors.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iznos RSD
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Način plaćanja
              </label>
              <select
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
              >
                <option value="uplatnica">Uplatnica</option>
                <option value="paypal">PayPal</option>
                <option value="kartica">Kartica</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newMarkPaid}
                onChange={(e) => setNewMarkPaid(e.target.checked)}
                className="rounded border-gray-300 text-plava focus:ring-plava"
              />
              <span className="text-sm text-gray-700">
                Označi odmah kao plaćeno (daje pristup kursu)
              </span>
            </label>
            {newMarkPaid && (
              <label className="flex items-center gap-2 cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={newFiscalize}
                  onChange={(e) => setNewFiscalize(e.target.checked)}
                  className="rounded border-gray-300 text-plava focus:ring-plava"
                />
                <span className="text-sm text-gray-700">
                  Fiskalizuj račun (ne čekiraj ako račun ide preko SEF-a)
                </span>
              </label>
            )}
            {/* Kod firme ovo bi poslalo uplatnicu POLAZNIKU, a plaća računovodstvo
                po predračunu. Zato se kod firme uopšte ne nudi. */}
            {!newJeFirma && (
              <label className={`flex items-center gap-2 ${newMarkPaid ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                <input
                  type="checkbox"
                  checked={newSendEmail && !newMarkPaid}
                  disabled={newMarkPaid}
                  onChange={(e) => setNewSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-plava focus:ring-plava"
                />
                <span className="text-sm text-gray-700">
                  Pošalji kupcu podatke za uplatu (mejl sa {newPayment === "kartica" ? "linkom za karticu" : newPayment === "paypal" ? "PayPal-om" : "uplatnicom i pozivom na broj"})
                </span>
              </label>
            )}
            {newJeFirma && (
              <p className="text-sm text-gray-500">
                Firma dobija predračun - dugme stoji u redu narudžbine, kad završiš unos polaznika.
              </p>
            )}
          </div>
          {newError && (
            <p className="mt-3 text-sm text-koral font-medium">{newError}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={createOrder}
              disabled={newLoading}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-plava text-white hover:bg-plava-dark transition-colors disabled:opacity-50"
            >
              {newLoading
                ? "Kreiranje..."
                : newGroupId
                ? "Dodaj polaznika"
                : "Kreiraj narudžbinu"}
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewGroupId(null);
                setNewJeFirma(false);
                setFirmaNadjena(false);
              }}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              {newGroupId ? "Završi" : "Otkaži"}
            </button>
          </div>
        </div>
      )}

      {dokError && (
        <div className="mb-4 rounded-lg bg-koral/10 border border-koral/30 px-4 py-3">
          <p className="text-sm text-koral font-medium">{dokError}</p>
        </div>
      )}

      {/* Search + product filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Pretraži po imenu ili mejlu"
          className="flex-1 min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava"
        />
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava max-w-[260px]"
        >
          <option value="">Svi proizvodi</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {(search || productFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setProductFilter("");
            }}
            className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 border border-gray-200"
          >
            ✕ Očisti
          </button>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("sve")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "sve"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Sve
        </button>
        <button
          onClick={() => setFilter("na-cekanju")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === "na-cekanju"
              ? "bg-yellow-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Na čekanju
          {pendingCount > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === "na-cekanju"
                  ? "bg-white text-yellow-600"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("potvrdjene")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "potvrdjene"
              ? "bg-green-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Potvrđene
        </button>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">#</th>
                <th className="text-left px-6 py-3">Kupac</th>
                <th className="text-left px-6 py-3">Kurs</th>
                <th className="text-left px-6 py-3">Iznos</th>
                <th className="text-left px-6 py-3">Plaćanje</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Datum</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const courseTitle =
                  (order.items as { title: string }[])[0]?.title ?? "-";
                const isConfirming = confirmId === order.id;
                const isLoading = loading === order.id;
                const isPending = order.payment_status === "pending";
                const cardState = isPending ? pendingPaymentState(order, Date.now()) : null;
                // Razlog odbijanja ima smisla samo za kartice - uplatnica/PayPal nemaju odgovor banke.
                const isCardOrder = order.payment_method.startsWith("kartica");
                const decline = isCardOrder ? cardDeclineReason(order) : null;
                const isDeleting = deleteId === order.id;
                const isBeingDeleted = deleting === order.id;
                const fiscalState = orderFiscalStatus(order);
                const isStorniranje = stornoId === order.id;
                const jeStornirana = order.payment_status === "refunded";

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.full_name || "-"}
                      </div>
                      <div className="text-gray-400 text-xs">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <button
                        type="button"
                        onClick={() => setProductFilter(courseTitle)}
                        className="text-left hover:text-plava hover:underline"
                        title="Filtriraj po ovom proizvodu"
                      >
                        {courseTitle}
                      </button>
                      {order.professor_name && (
                        <div className="text-gray-400 text-xs mt-0.5">👩‍🏫 {order.professor_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.total.toLocaleString("sr-RS")} RSD
                      </div>
                      {order.paypal_note && (
                        <div className="text-gray-400 text-xs truncate max-w-[120px]" title={order.paypal_note}>
                          {order.paypal_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatPaymentMethod(order.payment_method)}
                    </td>
                    <td className="px-6 py-4">
                      {jeStornirana ? (
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                            title="Izdat je storno račun i pristup je oduzet. Povraćaj novca ide kroz banku - proveri odvojeno."
                          >
                            Stornirano
                          </span>
                          {order.refunded_at ? (
                            <span className="text-xs text-gray-400">
                              {new Date(order.refunded_at).toLocaleDateString("sr-RS")}
                            </span>
                          ) : (
                            <span
                              className="text-xs text-koral font-medium"
                              title="Pristup je oduzet, ali protivračun kod PURS-a nije izdat - klikni „Storniraj"
                            >
                              bez storno računa
                            </span>
                          )}
                        </div>
                      ) : order.payment_status === "cancelled" ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500" title="Neplaćena porudžbina - automatski otkazana posle 7 dana">
                            Otkazano
                          </span>
                          <RazlogBanke decline={decline} kartica={isCardOrder} />
                        </div>
                      ) : isPending ? (
                        cardState === "declined" ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600" title="Banka je odbila karticu - kupovina nije prošla">
                              Kartica odbijena
                            </span>
                            <RazlogBanke decline={decline} kartica={false} />
                          </div>
                        ) : cardState === "incomplete" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600" title="Kartica započeta ali nije završena - nije naplaćeno">
                            Nije završeno
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                            Na čekanju
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                            Potvrđena
                          </span>
                          <span
                            className={`text-xs ${order.granted ? "text-green-600" : "text-koral font-medium"}`}
                          >
                            {order.granted ? "pristup ✓" : "pristup ✗"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Dokumenti za firmu. Stoje iznad ostalih dugmadi jer su
                          zaseban tok: predračun traži uplatu, faktura dolazi posle.
                          Fiskalizacija je nezavisna i ne dira se odavde. */}
                      {order.company_order_group && (
                        <div className="flex items-center justify-end gap-2 mb-2">
                          {order.predracun_broj ? (
                            <span className="text-xs text-gray-500" title="Predračun je poslat računovodstvu">
                              Predračun {order.predracun_broj}
                            </span>
                          ) : (
                            <button
                              onClick={() => izdajDokument(order, "predracun")}
                              disabled={dokLoading === `${order.id}-predracun`}
                              title="Napravi predračun i pošalji ga na mejl računovodstva"
                              className="text-xs px-3 py-1.5 rounded-lg bg-white text-plava font-medium border border-plava/30 hover:bg-plava hover:text-white transition-colors disabled:opacity-50"
                            >
                              {dokLoading === `${order.id}-predracun` ? "..." : "Pošalji predračun"}
                            </button>
                          )}
                          {order.faktura_broj ? (
                            <span className="text-xs text-green-600" title="Faktura je poslata računovodstvu">
                              Faktura {order.faktura_broj}
                            </span>
                          ) : (
                            !isPending && (
                              <button
                                onClick={() => izdajDokument(order, "faktura")}
                                disabled={dokLoading === `${order.id}-faktura`}
                                title="Napravi fakturu i pošalji je na mejl računovodstva"
                                className="text-xs px-3 py-1.5 rounded-lg bg-white text-green-600 font-medium border border-green-600/30 hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {dokLoading === `${order.id}-faktura` ? "..." : "Izdaj fakturu"}
                              </button>
                            )
                          )}
                          {order.faktura_broj && (
                            order.sef_invoice_id ? (
                              <span
                                className={`text-xs ${SEF_BOJA[order.sef_status ?? ""] ?? "text-gray-500"}`}
                                title={`SEF id: ${order.sef_invoice_id}`}
                              >
                                SEF{sefDemo ? " (DEMO)" : ""}: {SEF_LABEL[order.sef_status ?? ""] ?? order.sef_status ?? "poslata"}
                              </span>
                            ) : (
                              <button
                                onClick={() => posaljiNaSef(order)}
                                disabled={dokLoading === `${order.id}-sef`}
                                title="Šalje istu fakturu, pod istim brojem, na Sistem elektronskih faktura"
                                className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-700 font-medium border border-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {dokLoading === `${order.id}-sef` ? "..." : sefDemo ? "Pošalji na SEF (DEMO)" : "Pošalji na SEF"}
                              </button>
                            )
                          )}
                        </div>
                      )}
                      {isPending ? (
                        isConfirming ? (
                          <span className="flex items-center justify-end gap-1">
                            <span className="text-xs text-gray-500">Sigurno?</span>
                            <button
                              onClick={() => confirmPayment(order.id)}
                              disabled={isLoading}
                              className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50"
                            >
                              {isLoading ? "..." : "Da"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Ne
                            </button>
                          </span>
                        ) : isDeleting ? (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">Obrisati?</span>
                            <button
                              onClick={() => deleteOrder(order.id, true)}
                              disabled={isBeingDeleted}
                              title="Briše porudžbinu i šalje polazniku mejl da je otkazana"
                              className="text-xs text-koral font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
                            >
                              {isBeingDeleted ? "..." : "Da + mejl"}
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id, false)}
                              disabled={isBeingDeleted}
                              title="Briše porudžbinu bez obaveštenja (npr. test porudžbine)"
                              className="text-xs text-koral/70 font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
                            >
                              {isBeingDeleted ? "..." : "Bez mejla"}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Ne
                            </button>
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => sendPayment(order.id)}
                              disabled={sendingPay === order.id}
                              title="Pošalji kupcu mejl sa podacima za uplatu"
                              className="text-xs px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium hover:bg-plava hover:text-white transition-colors disabled:opacity-50"
                            >
                              {sendingPay === order.id ? "..." : sentPay === order.id ? "✓ Poslato" : "Pošalji uplatu"}
                            </button>
                            <button
                              onClick={() => setConfirmId(order.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-medium hover:bg-green-100 transition-colors"
                            >
                              Potvrdi uplatu
                            </button>
                            <button
                              onClick={() => setDeleteId(order.id)}
                              className="text-xs text-gray-400 hover:text-koral hover:underline transition-colors"
                            >
                              Obriši
                            </button>
                          </span>
                        )
                      ) : isStorniranje ? (
                        <span className="flex items-center justify-end gap-2">
                          <span
                            className="text-xs text-gray-500"
                            title="Izdaje protivračun kod PURS-a i oduzima pristup. Novac se vraća odvojeno, kroz banku."
                          >
                            Stornirati?
                          </span>
                          <button
                            onClick={() => stornoOrder(order.id)}
                            disabled={isLoading}
                            className="text-xs text-koral font-medium hover:underline disabled:opacity-50"
                          >
                            {isLoading ? "Storniram…" : "Da"}
                          </button>
                          <button
                            onClick={() => setStornoId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Ne
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-3">
                          {fiscalState === "ok" && order.fiscal_pdf_url ? (
                            <a
                              href={order.fiscal_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium hover:bg-plava hover:text-white transition-colors"
                            >
                              Račun
                            </a>
                          ) : fiscalState === "missing" ? (
                            <button
                              onClick={() => reFiscalize(order.id)}
                              disabled={isLoading}
                              className="text-xs text-koral font-medium hover:underline disabled:opacity-50"
                              title="Narudžbina je potvrđena ali fiskalni račun nije izdat - klikni da fiskalizuješ"
                            >
                              {isLoading ? "Fiskalizujem…" : "⚠ Fiskalizuj"}
                            </button>
                          ) : null}
                          {fiscalState === "stornirano" && order.refund_pdf_url && (
                            <a
                              href={order.refund_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                            >
                              Storno račun
                            </a>
                          )}
                          {canRefundOrder(order) && (
                            <button
                              onClick={() => setStornoId(order.id)}
                              className="text-xs text-gray-400 hover:text-koral hover:underline transition-colors"
                              title="Storniraj: protivračun kod PURS-a + oduzimanje pristupa"
                            >
                              Storniraj
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema narudžbina.
        </div>
      )}
    </div>
  );
}
