"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GroupRow {
  id: string;
  level: string | null;
  session_time: string | null;
  meet_link: string | null;
  nextSession: string | null;
  professor: string | null;
}
interface IndivRow {
  id: string;
  title: string;
  packageLessons: number;
  lessonsUsed: number;
  status: string;
  expiresAt: string | null;
  professor: string | null;
  calendarUrl: string | null;
}

interface SubRow {
  id: string;
  status: string;
  title: string;
  amount: number;
  paidPayments: number;
  totalPayments: number;
  nextChargeAt: string | null;
  accessUntil: string | null;
  unlockedCount: number;
  nextUnlockAt: number | null;
}

const PRAZNO = { groups: [], individual: [], subscriptions: [] };

/** Mesečno plaćanje: stanje serije i samouslužno otkazivanje (uslov banke). */
function Pretplata({ s, onCancel }: { s: SubRow; onCancel: (id: string) => void }) {
  const [pita, setPita] = useState(false);
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState("");
  const datum = (d: string | null) => (d ? new Date(d).toLocaleDateString("sr-RS") : "-");
  const iznos = s.amount.toLocaleString("de-DE");

  const otkazi = async () => {
    setSalje(true);
    setGreska("");
    const r = await fetch("/api/pretplata/otkazi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: s.id }),
    });
    const j = await r.json().catch(() => ({}));
    setSalje(false);
    if (!r.ok) { setGreska(j.error ?? "Otkazivanje nije prošlo."); return; }
    setPita(false);
    onCancel(s.id);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-2">
      <p className="font-medium">{s.title} · mesečno plaćanje</p>
      <p className="text-sm text-gray-600 mt-1">
        Plaćeno {s.paidPayments} od {s.totalPayments} naplata · {iznos} din mesečno
      </p>
      <p className="text-sm text-gray-600">
        Otvoreno ti je {s.unlockedCount} od 6 nivoa
        {s.nextUnlockAt ? ` · sledeći stiže sa ${s.nextUnlockAt}. naplatom` : " · ceo kurs je otvoren"}
      </p>
      {s.status === "active" ? (
        <>
          <p className="text-sm text-gray-600">
            Sledeća naplata: {datum(s.nextChargeAt)} · pristup važi do {datum(s.accessUntil)}
          </p>
          {!pita ? (
            <button onClick={() => setPita(true)} className="mt-2 text-sm text-gray-500 underline hover:text-gray-700">
              Otkaži mesečno plaćanje
            </button>
          ) : (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Otkazujemo sve buduće naplate. Pristup ti ostaje do {datum(s.accessUntil)}, a već naplaćeno se ne vraća.
                Kurs kasnije možeš da nastaviš - napredak ti ostaje sačuvan.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setPita(false)} className="text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-white">
                  Odustani
                </button>
                <button onClick={otkazi} disabled={salje} className="text-sm bg-gray-800 text-white px-3 py-2 rounded-lg disabled:opacity-60">
                  {salje ? "Otkazujem…" : "Da, otkaži"}
                </button>
              </div>
              {greska && <p className="text-sm text-red-600 mt-2">{greska}</p>}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-600">
          Otkazano - novih naplata nema. Pristup ti važi do {datum(s.accessUntil)}.
        </p>
      )}
    </div>
  );
}

export function GrupniIIndividualni() {
  const [data, setData] = useState<{ groups: GroupRow[]; individual: IndivRow[]; subscriptions: SubRow[] } | null>(null);

  useEffect(() => {
    fetch("/api/student/account")
      .then((r) => (r.ok ? r.json() : PRAZNO))
      .then((d) => setData({ ...PRAZNO, ...d }))
      .catch(() => setData(PRAZNO));
  }, []);

  if (!data || (data.groups.length === 0 && data.individual.length === 0 && data.subscriptions.length === 0)) return null;

  const oznaciOtkazanu = (id: string) =>
    setData((d) =>
      d ? { ...d, subscriptions: d.subscriptions.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)) } : d,
    );

  return (
    <section className="mb-8">
      {data.subscriptions.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-500 mb-2">Mesečno plaćanje</p>
          {data.subscriptions.map((s) => (
            <Pretplata key={s.id} s={s} onCancel={oznaciOtkazanu} />
          ))}
        </>
      )}
      {(data.groups.length > 0 || data.individual.length > 0) && (
        <p className="text-sm font-medium text-gray-500 mb-2 mt-6">Časovi uživo</p>
      )}
      {data.groups.map((g) => (
        <div key={g.id} className="border border-gray-200 rounded-lg p-4 mb-2">
          <p className="font-medium">
            Grupni {g.level}
            {g.professor ? ` · ${g.professor}` : ""}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {g.nextSession
              ? `Sledeći čas: ${new Date(g.nextSession).toLocaleDateString("sr-RS")}${g.session_time ? ` u ${g.session_time}` : ""}`
              : "Termin uskoro"}
          </p>
          {g.meet_link && (
            <a href={g.meet_link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-plava">
              Otvori Meet
            </a>
          )}
        </div>
      ))}
      {data.individual.map((e) => {
        const remaining = Math.max(0, e.packageLessons - e.lessonsUsed);
        return (
          <div key={e.id} className="border border-gray-200 rounded-lg p-4 mb-2">
            <p className="font-medium">
              {e.title}
              {e.professor ? ` · ${e.professor}` : ""}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Ostalo ti {remaining} od {e.packageLessons} časova
            </p>
            {remaining > 0 && e.calendarUrl && (
              <a href={e.calendarUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-plava">
                Zakaži sledeći čas
              </a>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function ProfilSekcija({ initialName, email }: { initialName: string; email: string }) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState(email);
  const [msg, setMsg] = useState("");

  const saveName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").update({ full_name: name }).eq("id", user.id);
    setMsg("Ime sačuvano.");
  };

  const changeEmail = async () => {
    if (newEmail === email) return;
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    setMsg(error ? "Greška pri promeni mejla. Pokušaj ponovo." : "Poslali smo link za potvrdu na stari i novi mejl.");
  };

  return (
    <section className="mt-8 pt-8 border-t border-gray-100">
      <h2 className="text-base font-semibold mb-3">Profil</h2>

      <label className="block text-sm text-gray-600 mb-1">Ime i prezime</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-plava"
      />
      <button onClick={saveName} className="text-sm bg-plava text-white px-4 py-2 rounded-lg mb-5 hover:bg-plava-dark transition-colors">
        Sačuvaj ime
      </button>

      <label className="block text-sm text-gray-600 mb-1">Email</label>
      <div className="flex gap-2 items-center">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
        />
        <button onClick={changeEmail} className="text-sm border border-gray-300 px-4 py-2 rounded-lg whitespace-nowrap hover:bg-gray-50 transition-colors">
          Promeni
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Poslaćemo link za potvrdu na stari i novi mejl.</p>

      {msg && <p className="text-sm text-plava-dark mt-3">{msg}</p>}

      <p className="text-sm mt-5">
        <a href="/profil" className="text-plava">Promeni lozinku</a>
      </p>
    </section>
  );
}
