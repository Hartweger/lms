"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { renderRich } from "./render-rich";

const ALLOWED_PREFIXES = ["/", "/kursevi", "/grupni-kursevi", "/individualni-kursevi"];
const BLOCKED_PREFIXES = ["/naki", "/dashboard", "/kurs/", "/admin", "/prijava", "/kupovina"];
const CORAL = "#F78687";
const QUICK = ["Odakle da počnem?", "Koliko košta kurs za početnike?", "Da li se dobija sertifikat?", "Kako da platim iz EU?"];
const WELCOME = "Hej! Ja sam Smile, KI asistent u Hartweger timu. Pomažem ti da nađeš pravi kurs nemačkog - pitaj slobodno!";
const STORAGE_KEY = "smile_chat_v1";

// Smile lik - prijateljsko lice (belo sa koralnim crtama). Koralni brend, vizuelno odvojen od NaKI tutora.
function SmileFace({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#fff" />
      <circle cx="8.7" cy="10.2" r="1.35" fill={CORAL} />
      <circle cx="15.3" cy="10.2" r="1.35" fill={CORAL} />
      <path d="M7.5 13.6 Q12 17.6 16.5 13.6" stroke={CORAL} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="6.5" cy="13.2" r="1.1" fill={CORAL} opacity="0.35" />
      <circle cx="17.5" cy="13.2" r="1.1" fill={CORAL} opacity="0.35" />
    </svg>
  );
}

type Msg = { role: "user" | "assistant"; content: string };
type Config = { enabled: boolean; nudge: boolean; leadCapture: boolean };

function isAllowed(pathname: string): boolean {
  if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return false;
  return ALLOWED_PREFIXES.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

// sessionStorage može da baci (Safari private mode) - guard
function ssGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function ssSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export default function SmileWidget() {
  const pathname = usePathname();
  const [cfg, setCfg] = useState<Config | null>(null);
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [inited, setInited] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadDone, setLeadDone] = useState(false);
  const sessionId = useRef<string>(typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Vrati prethodni razgovor (preživi reload / novo učitavanje u istoj sesiji)
  useEffect(() => {
    const raw = ssGet(STORAGE_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (Array.isArray(s.msgs) && s.msgs.length) { setMsgs(s.msgs); setInited(true); }
        if (typeof s.sessionId === "string" && s.sessionId) sessionId.current = s.sessionId;
        if (s.leadDone) setLeadDone(true);
      } catch { /* ignore */ }
    }
    hydrated.current = true;
  }, []);

  // Sačuvaj razgovor pri svakoj promeni (tek posle hidracije, da ne pregazi sačuvano)
  useEffect(() => {
    if (!hydrated.current) return;
    ssSet(STORAGE_KEY, JSON.stringify({ sessionId: sessionId.current, msgs, inited, leadDone }));
  }, [msgs, inited, leadDone]);

  // Učitaj konfiguraciju jednom (samo na dozvoljenim stranama)
  useEffect(() => {
    if (!isAllowed(pathname)) { setCfg(null); return; }
    let active = true;
    fetch("/api/naki/sales").then((r) => r.json()).then((d) => { if (active) setCfg(d); }).catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  // Nudge posle 9s, jednom po sesiji
  useEffect(() => {
    if (!cfg?.enabled || !cfg.nudge || open) return;
    const seen = ssGet("smile_nudge_seen");
    if (seen) return;
    const t = setTimeout(() => setShowNudge(true), 9000);
    return () => clearTimeout(t);
  }, [cfg, open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, busy]);

  // Escape zatvara panel kada je otvoren
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!cfg?.enabled || !isAllowed(pathname)) return null;

  const toggle = () => {
    setOpen((o) => !o);
    setShowNudge(false);
    ssSet("smile_nudge_seen", "1");
    if (!inited) { setInited(true); setMsgs([{ role: "assistant", content: WELCOME }]); }
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next);
    setBusy(true);
    try {
      const r = await fetch("/api/naki/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, messages: next.filter((m) => m.role !== "assistant" || m.content !== WELCOME) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsgs((m) => [...m, { role: "assistant", content: d.message || d.error || "Ups, pokušaj ponovo!" }]);
        return;
      }
      const reply = d.reply || "Ups, pokušaj ponovo!";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      if (cfg.leadCapture && next.filter((m) => m.role === "user").length >= 2 && !leadDone) setShowLead(true);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Greška u konekciji - pokušaj ponovo!" }]);
    } finally {
      setBusy(false);
    }
  };

  const submitLead = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) return;
    try {
      await fetch("/api/naki/sales/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: leadEmail }),
      });
    } catch {}
    setLeadDone(true);
    setShowLead(false);
    setMsgs((m) => [...m, { role: "assistant", content: "Super, poslala sam ti na mejl! 😊" }]);
  };

  return (
    <div style={{ fontFamily: "var(--font-lato), sans-serif" }}>
      {/* Nudge */}
      {showNudge && !open && (
        <button onClick={toggle} style={{ position: "fixed", bottom: 86, right: 20, zIndex: 9998, background: "#fff", border: "1px solid #e2e5e9", borderRadius: 14, padding: "10px 14px", fontSize: 13.5, color: "#0c0d24", boxShadow: "0 4px 18px rgba(0,0,0,.12)", maxWidth: 220, cursor: "pointer", textAlign: "left" }}>
          Treba ti pomoć oko izbora kursa? 😊
        </button>
      )}

      {/* Launcher */}
      <button onClick={toggle} aria-label="Razgovaraj sa Smile" style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, width: 56, height: 56, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 14px rgba(0,0,0,.18)", animation: open ? "none" : "smileSway 3s ease-in-out infinite" }}>
        {open ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <SmileFace size={32} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div role="dialog" aria-label="Smile chat" style={{ position: "fixed", bottom: 88, right: 20, zIndex: 9999, width: 340, maxWidth: "calc(100vw - 24px)", background: "#fff", borderRadius: 18, border: "1px solid #e2e5e9", boxShadow: "0 4px 24px rgba(0,0,0,.13)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: CORAL, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><SmileFace size={26} /></div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>Smile</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,.82)" }}>● KI asistent · Hartweger tim</p>
            </div>
            <button onClick={toggle} aria-label="Zatvori" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.8)", fontSize: 20 }}>×</button>
          </div>

          <div ref={scrollRef} style={{ height: 300, overflowY: "auto", padding: 13, display: "flex", flexDirection: "column", gap: 9, background: "#f7f8fa" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ maxWidth: "84%", padding: "9px 13px", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? CORAL : "#fff", color: m.role === "user" ? "#fff" : "#0c0d24", border: m.role === "user" ? "none" : "1px solid #eaecef", borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px" }}>
                {m.role === "assistant"
                  ? renderRich(m.content, { linkClassName: "", linkStyle: { color: CORAL, textDecoration: "underline" } })
                  : m.content}
              </div>
            ))}
            {busy && <div style={{ alignSelf: "flex-start", fontSize: 13, color: "#adb5bd", padding: "9px 13px" }}>Smile piše…</div>}
          </div>

          {msgs.length <= 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "9px 13px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} style={{ fontSize: 11.5, padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${CORAL}`, background: CORAL, color: "#fff", cursor: "pointer" }}>{q}</button>
              ))}
            </div>
          )}

          {showLead && !leadDone && (
            <div style={{ padding: "10px 13px", background: "#fdf6f6", borderTop: "1px solid #f0e0e0", display: "flex", gap: 6 }}>
              <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitLead(); }} placeholder="Tvoj mejl - šaljem ti preporuku" style={{ flex: 1, border: "1.5px solid #dde0e4", borderRadius: 22, padding: "8px 12px", fontSize: 12.5, outline: "none" }} />
              <button onClick={submitLead} style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 22, padding: "0 14px", cursor: "pointer", fontSize: 12.5 }}>Pošalji</button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, padding: "10px 13px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(input); }} placeholder="Napiši pitanje za Smile..." style={{ flex: 1, border: "1.5px solid #dde0e4", borderRadius: 22, padding: "8px 14px", fontSize: 13, outline: "none", color: "#0c0d24" }} />
            <button onClick={() => send(input)} disabled={busy} aria-label="Pošalji" style={{ width: 36, height: 36, borderRadius: "50%", background: CORAL, border: "none", cursor: "pointer", color: "#fff", flexShrink: 0 }}>›</button>
          </div>
          <div style={{ textAlign: "center", padding: "5px 0 6px", fontSize: 10, color: "#c0c4cb", background: "#fff" }}>Smile · Powered by Claude AI</div>
        </div>
      )}

      <style>{`@keyframes smileSway{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}
