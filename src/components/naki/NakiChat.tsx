"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { NakiFace } from "./NakiAvatar";

// NaKI šalje markdown (**bold**, *kurziv*, [tekst](url)). Pretvori u React čvorove
// (kao stari WP widget) — inače se vide gole zvezdice. Novi red čuva whitespace-pre-wrap.
function renderRich(text: string): ReactNode[] {
  const withBullets = text.replace(/^- /gm, "• ");
  // markdown link | bold | kurziv | goli URL (www. ili https://) | mejl
  const re =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|((?:https?:\/\/|www\.)[^\s)]+)|([^\s@]+@[^\s@]+\.[A-Za-z]{2,})/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withBullets)) !== null) {
    if (m.index > last) nodes.push(withBullets.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-plava underline">
          {m[1]}
        </a>
      );
    } else if (m[3]) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4]) {
      nodes.push(<em key={key++}>{m[4]}</em>);
    } else if (m[5]) {
      // odvoji rep interpunkcije (tačka/zarez na kraju rečenice nije deo URL-a)
      let url = m[5];
      let trail = "";
      const tm = url.match(/[.,;:!?]+$/);
      if (tm) {
        trail = tm[0];
        url = url.slice(0, url.length - trail.length);
      }
      const href = url.startsWith("www.") ? `https://${url}` : url;
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-plava underline">
          {url}
        </a>
      );
      if (trail) nodes.push(trail);
    } else if (m[6]) {
      let mail = m[6];
      let trail = "";
      const tm = mail.match(/[.,;:!?]+$/);
      if (tm) {
        trail = tm[0];
        mail = mail.slice(0, mail.length - trail.length);
      }
      nodes.push(
        <a key={key++} href={`mailto:${mail}`} className="text-plava underline">
          {mail}
        </a>
      );
      if (trail) nodes.push(trail);
    }
    last = re.lastIndex;
  }
  if (last < withBullets.length) nodes.push(withBullets.slice(last));
  return nodes;
}

// GA event helper (gtag je globalno učitan u layout.tsx)
function ga(event: string, params?: Record<string, unknown>) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag === "function") w.gtag("event", event, params || {});
}

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "Objasni mi padeže",
  "Daj mi jednu vežbu",
  "Kako se gradi Perfekt?",
  "Vežbajmo razgovor",
];

export default function NakiChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Zdravo! Ja sam NaKI. Sa čime da ti pomognem oko nemačkog?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [gateName, setGateName] = useState("");
  const [gateEmail, setGateEmail] = useState("");
  const [gateSubmitting, setGateSubmitting] = useState(false);

  const sessionId = useRef<string>("");
  const startTime = useRef<number>(0);
  const messageCount = useRef(0);
  const engagedFired = useRef(false);
  const level = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>(messages);

  // localStorage stanje email gate-a
  const emailGiven = useRef(false);
  const emailDeclined = useRef(false);
  const emailFinal = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionId.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    startTime.current = Date.now();
    emailGiven.current = localStorage.getItem("naki_email_given") === "true";
    emailDeclined.current = localStorage.getItem("naki_email_declined") === "true";
    emailFinal.current = localStorage.getItem("naki_email_final") === "true";
    level.current = localStorage.getItem("naki_level");
    ga("naki_session_start", { session_id: sessionId.current });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, showGate]);

  const extractLevel = useCallback((text: string) => {
    const m = text.match(/\b(A1|A2|B1|B2|C1)\b/i);
    if (m) {
      level.current = m[1].toUpperCase();
      localStorage.setItem("naki_level", level.current);
    }
  }, []);

  const checkEngaged = useCallback(() => {
    if (engagedFired.current) return;
    const minutes = (Date.now() - startTime.current) / 60000;
    if (messageCount.current >= 5 || minutes >= 5) {
      ga("naki_engaged", { session_id: sessionId.current });
      engagedFired.current = true;
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return; // debounce

      setSending(true);
      messageCount.current += 1;
      extractLevel(trimmed);
      ga("naki_message_sent", {
        message_number: messageCount.current,
        session_id: sessionId.current,
      });
      checkEngaged();

      const nextHistory: Msg[] = [...messagesRef.current, { role: "user", content: trimmed }];
      setMessages(nextHistory);
      setInput("");

      // Email gate trigger (kao stari frontend: 8. i 15. poruka)
      if (messageCount.current === 8 && !emailGiven.current && !emailFinal.current) {
        setShowGate(true);
        ga("naki_email_gate_shown", { session_id: sessionId.current });
      } else if (
        messageCount.current === 15 &&
        emailDeclined.current &&
        !emailGiven.current &&
        !emailFinal.current
      ) {
        setShowGate(true);
        ga("naki_email_gate_shown", { session_id: sessionId.current });
      }

      try {
        const res = await fetch("/api/naki", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextHistory.slice(-12),
            session_id: sessionId.current,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const errMsg =
            data.error === "limit_reached"
              ? data.message
              : "Ups! Greška na serveru. Probaj ponovo.";
          setMessages((m) => [...m, { role: "assistant", content: errMsg }]);
          return;
        }
        extractLevel(data.reply);
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Ups! Došlo je do greške. Probaj ponovo za koji trenutak." },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, extractLevel, checkEngaged]
  );

  const sendQuick = (text: string) => {
    ga("naki_quick_button", { button_text: text });
    send(text);
  };

  const submitEmail = async () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!gateName.trim()) return;
    if (!emailRe.test(gateEmail.trim())) return;
    setGateSubmitting(true);
    try {
      await fetch("/api/naki/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gateName.trim(),
          email: gateEmail.trim(),
          level: level.current || "",
          history: messagesRef.current.slice(-12),
          session_id: sessionId.current,
        }),
      });
      localStorage.setItem("naki_email_given", "true");
      emailGiven.current = true;
      setShowGate(false);
      ga("naki_email_submitted", { session_id: sessionId.current });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Hvala! Poslala sam ti plan učenja na email. Nastavljamo dalje 😊",
        },
      ]);
    } catch {
      // tiho — korisnik može nastaviti razgovor
    } finally {
      setGateSubmitting(false);
    }
  };

  const declineEmail = () => {
    setShowGate(false);
    if (emailDeclined.current) {
      localStorage.setItem("naki_email_final", "true");
      emailFinal.current = true;
    } else {
      localStorage.setItem("naki_email_declined", "true");
      emailDeclined.current = true;
    }
    ga("naki_email_declined", { session_id: sessionId.current });
    setMessages((m) => [...m, { role: "assistant", content: "Nema problema! Nastavljamo dalje." }]);
  };

  return (
    <div className="mx-auto flex h-[70vh] max-h-[640px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-plava px-5 py-3 text-white">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          <NakiFace className="h-9 w-9" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-heading text-base font-bold">NaKI — Natašin AI asistent</span>
          <span className="text-xs text-white/85">Online · Nemački A1–C1</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-plava px-3.5 py-2.5 text-sm leading-relaxed text-white"
                : "max-w-[85%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900"
            }
          >
            {m.role === "assistant" ? renderRich(m.content) : m.content}
          </div>
        ))}

        {sending && (
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2.5 text-sm italic text-gray-400">
            NaKI piše…
          </div>
        )}

        {showGate && (
          <div className="rounded-2xl border border-plava bg-plava-light p-4">
            <p className="mb-3 text-sm text-gray-700">
              Super ti ide! Ostavi email — pošaljem ti <strong>plan učenja</strong> prilagođen tebi:
              šta već znaš i šta dalje da vežbaš. Besplatno.
            </p>
            <input
              className="mb-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-plava"
              type="text"
              placeholder="Tvoje ime"
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
            />
            <input
              className="mb-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-plava"
              type="email"
              placeholder="tvoj@email.com"
              value={gateEmail}
              onChange={(e) => setGateEmail(e.target.value)}
            />
            <button
              className="w-full rounded-lg bg-plava py-2.5 font-medium text-white transition-colors hover:bg-plava-dark disabled:opacity-50"
              onClick={submitEmail}
              disabled={gateSubmitting}
            >
              {gateSubmitting ? "Šaljem…" : "Pošalji mi plan"}
            </button>
            <button
              className="mt-1 w-full py-2 text-sm text-gray-400 hover:underline"
              onClick={declineEmail}
            >
              Možda kasnije
            </button>
          </div>
        )}
      </div>

      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {QUICK.map((q) => (
            <button
              key={q}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
              onClick={() => sendQuick(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2 border-t border-gray-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-plava"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napiši pitanje…"
          disabled={sending}
        />
        <button
          type="submit"
          className="rounded-lg bg-plava px-5 font-medium text-white transition-colors hover:bg-plava-dark disabled:opacity-50"
          disabled={sending || !input.trim()}
        >
          Pošalji
        </button>
      </form>
    </div>
  );
}
