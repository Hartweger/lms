"use client";

import { useState, useRef } from "react";
import SpeakButton from "@/components/SpeakButton";
import { sanitizeHtml } from "@/lib/sanitize";
import { mergeTranscript } from "@/lib/speech-transcript";

interface SpeakExerciseProps {
  question: string;
  correctAnswer: string;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

// Prepoznavanje govora izgovoreni broj UVEK vrati kao cifru ("zweiunddreißig"
// -> "32"), pa se ne poklapa sa rečju u tačnom odgovoru. Zato cifre pre
// poređenja pretvaramo u nemačke reči. Podržava 0-9999 (dovoljno za A1-B2);
// veće ostavljamo kako jesu.
const NUM_UNITS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
const NUM_TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const NUM_TENS = ["zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

function numberToGermanWords(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 9999) return String(n);
  if (n < 10) return NUM_UNITS[n];
  if (n < 20) return NUM_TEENS[n - 10];
  if (n < 100) {
    const u = n % 10, t = Math.floor(n / 10);
    if (u === 0) return NUM_TENS[t - 2];
    return (u === 1 ? "ein" : NUM_UNITS[u]) + "und" + NUM_TENS[t - 2];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100), rem = n % 100;
    const hw = (h === 1 ? "ein" : NUM_UNITS[h]) + "hundert";
    return rem === 0 ? hw : hw + numberToGermanWords(rem);
  }
  const th = Math.floor(n / 1000), rem = n % 1000;
  const tw = (th === 1 ? "ein" : NUM_UNITS[th]) + "tausend";
  return rem === 0 ? tw : tw + numberToGermanWords(rem);
}

// Skini SVU interpunkciju (i unutar rečenice) - prepoznavanje govora je
// dodaje nepredvidivo, a izgovor se ocenjuje po rečima, ne po znacima.
function normalize(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[.!?,;:„“”‚’‘"'\-—–…()]/g, " ")
    .replace(/\d+/g, (m) => numberToGermanWords(parseInt(m, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - dist / maxLen;
}

// Da li su dve reči "iste" za potrebe izgovora: jednake, ili se za duže reči
// razlikuju najviše za 1 slovo (varijacije u prepoznavanju govora).
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 4) return levenshtein(a, b) <= 1;
  return false;
}

// Poravnanje sa tolerancijom na umetnute/izostavljene reči: za svaku očekivanu
// reč tražimo sledeću podudarnu u izgovorenom nizu (umesto krutog poređenja
// pozicija i pozicija, gde jedna umetnuta reč oboji sve iza nje u crveno).
function findDifferences(spoken: string, expected: string): { word: string; status: "correct" | "wrong" | "missing" }[] {
  const spokenWords = normalize(spoken).split(" ").filter(Boolean);
  const expectedWords = normalize(expected).split(" ").filter(Boolean);
  const result: { word: string; status: "correct" | "wrong" | "missing" }[] = [];
  let si = 0;
  for (let i = 0; i < expectedWords.length; i++) {
    // potraži očekivanu reč u narednih nekoliko izgovorenih (preskoči umetke)
    let found = -1;
    for (let j = si; j < Math.min(si + 3, spokenWords.length); j++) {
      if (wordsMatch(spokenWords[j], expectedWords[i])) { found = j; break; }
    }
    if (found >= 0) {
      result.push({ word: expectedWords[i], status: "correct" });
      si = found + 1;
    } else if (si < spokenWords.length) {
      result.push({ word: expectedWords[i], status: "wrong" });
      si++;
    } else {
      result.push({ word: expectedWords[i], status: "missing" });
    }
  }
  return result;
}

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: { isFinal: boolean; [key: number]: { transcript: string } };
  };
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export default function SpeakExercise({ question, correctAnswer, explanation, onAnswer }: SpeakExerciseProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ score: number; differences: { word: string; status: string }[] } | null>(null);
  const [retries, setRetries] = useState(0);
  const [micFailed, setMicFailed] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [fallbackInput, setFallbackInput] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastTranscriptRef = useRef("");
  const manualStopRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluate = (text: string) => {
    const differences = findDifferences(text, correctAnswer);
    const wordScore = differences.length
      ? differences.filter((d) => d.status === "correct").length / differences.length
      : 0;
    // uzmi povoljniju ocenu: poklapanje reči ili sličnost celog niza
    const score = Math.max(similarity(text, correctAnswer), wordScore);
    setResult({ score, differences });
    setAnswered(true);
    onAnswer(score >= 0.75);
  };

  const startListening = async () => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) {
      setMicFailed(true);
      return;
    }

    // Request microphone permission first (triggers browser dialog on HTTPS)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicFailed(true);
      return;
    }

    // Small delay to release the mic before SpeechRecognition takes it
    await new Promise((r) => setTimeout(r, 200));

    const recognition = new (SR as new () => SpeechRecognitionInstance)();
    recognition.lang = "de-DE";
    recognition.interimResults = true;
    recognition.continuous = true;

    let lastTranscript = "";
    let finalTranscript = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let done = false;
    manualStopRef.current = false;

    // Jedinstven završetak: zaustavi, oceni jednom (tajmer tišine i ručni stop
    // mogu da okinu - sme da prođe samo prvi).
    const finish = () => {
      if (done) return;
      done = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      setListening(false);
      setMicReady(false);
      try { recognition.stop(); } catch { /* already stopped */ }
      if (lastTranscriptRef.current) {
        evaluate(lastTranscriptRef.current);
      } else {
        setTranscript("Nisam te čula. Klikni i probaj ponovo.");
      }
    };

    // Mikrofon je stvarno spreman tek kad engine pokrene slušanje - do tad
    // polaznik ne treba da govori (inače se prve reči izgube na prvom pitanju).
    recognition.onstart = () => {
      setMicReady(true);
    };

    recognition.onresult = (event) => {
      // Obrađuj SAMO nove rezultate (od resultIndex). Finalne spajaj kroz
      // mergeTranscript: desktop ih šalje kao zasebne segmente (nadovežu se),
      // a Chrome na Androidu svaki parcijalni šalje kao KUMULATIVAN finalni -
      // tamo novi rezultat ZAMENJUJE stari, inače se reči multipliciraju
      // ("im im Wohnzimmer im Wohnzimmer steht..." - prijave polaznika 07.2026).
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result || !result[0]) continue;
        if (result.isFinal) {
          finalTranscript = mergeTranscript(finalTranscript, result[0].transcript);
        } else {
          interim = result[0].transcript;
        }
      }
      const combined = mergeTranscript(finalTranscript, interim);
      lastTranscript = combined || lastTranscript;
      lastTranscriptRef.current = lastTranscript;
      setTranscript(lastTranscript);

      // NE ocenjuj na prvu mikropauzu - sačekaj 2,5 s tišine da polaznik
      // završi celu rečenicu (svaki novi rezultat resetuje tajmer).
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(finish, 2500);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Ne prekidaj - onend će restartovati ili će tajmer tišine završiti.
        return;
      }
      // Trajna greška (dozvola, mreža, servis...) - prekini slušanje i pređi
      // na unos kucanjem, umesto kriptične poruke "Greška: network".
      done = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      setListening(false);
      setMicReady(false);
      setMicFailed(true);
      try { recognition.stop(); } catch { /* already stopped */ }
    };

    recognition.onend = () => {
      if (done) return;
      // Ručni stop polaznika -> završi i oceni.
      if (manualStopRef.current) {
        finish();
        return;
      }
      // Engine je sam prekinuo na pauzu (Chrome/Safari to rade i kad je
      // continuous=true). Polaznik možda nije završio - nastavi da slušaš.
      // Završava jedino tajmer tišine (2,5 s) ili ručni stop.
      try {
        recognition.start();
      } catch {
        finish();
      }
    };

    recognitionRef.current = recognition;
    lastTranscriptRef.current = "";
    setListening(true);
    // Sigurnosni okvir: ako polaznik ćuti, ne vrti restart unedogled -
    // posle 6 s bez ijedne reči završavamo. Svaki rezultat ga skrati na 2,5 s.
    silenceTimer = setTimeout(finish, 6000);
    recognition.start();
  };

  const stopListening = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setMicReady(false);
  };

  const handleRetry = () => {
    setAnswered(false);
    setTranscript("");
    setFallbackInput("");
    setResult(null);
    setMicReady(false);
    setRetries(retries + 1);
    if (micFailed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div>
      {/* Instruction */}
      {question.includes("<") ? (
        <div className="text-lg font-medium text-gray-900 mb-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question) }} />
      ) : (
        <p className="text-lg font-medium text-gray-900 mb-2">{question}</p>
      )}

      {/* Sentence to speak */}
      <div className="bg-gray-50 rounded-xl p-5 mb-5 flex items-center justify-between gap-4">
        <p className="text-xl font-semibold text-gray-800">{correctAnswer}</p>
        <SpeakButton text={correctAnswer} className="text-gray-500 hover:text-plava !w-6 !h-6" />
      </div>

      {/* Microphone mode */}
      {!answered && !micFailed && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              listening
                ? "bg-koral text-white shadow-lg shadow-koral/30 animate-pulse"
                : "bg-plava text-white shadow-lg shadow-plava/30 hover:bg-plava-dark"
            }`}
            aria-label={listening ? "Zaustavi snimanje" : "Počni da govoriš"}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              {listening ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
              )}
            </svg>
          </button>
          <p className="text-sm text-gray-400">
            {listening
              ? micReady
                ? "Slušam... govori sada"
                : "Pripremam mikrofon..."
              : "Klikni i izgovori rečenicu"}
          </p>

          {/* Transcript while not answered */}
          {transcript && !answered && (
            <div className="mt-2 bg-amber-50 text-amber-700 rounded-xl p-3 text-sm w-full text-center">
              {transcript}
            </div>
          )}
        </div>
      )}

      {/* Fallback: mic not available -> exercise can be finished by typing */}
      {!answered && micFailed && (
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-amber-700 font-medium mb-1 text-center">Mikrofon trenutno nije dostupan.</p>
          <p className="text-amber-600 text-sm text-center">Izgovori rečenicu naglas, pa je ukucaj ovde:</p>
          <div className="mt-3 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={fallbackInput}
              onChange={(e) => setFallbackInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && fallbackInput.trim()) evaluate(fallbackInput); }}
              placeholder="Ukucaj rečenicu"
              className="flex-1 min-w-0 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-plava"
            />
            <button
              onClick={() => { if (fallbackInput.trim()) evaluate(fallbackInput); }}
              className="bg-plava text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-plava-dark shrink-0"
            >
              Proveri
            </button>
          </div>
          <button
            onClick={() => { setMicFailed(false); setTranscript(""); }}
            className="mt-3 text-sm text-plava hover:underline font-medium"
          >
            Pokušaj ponovo sa mikrofonom
          </button>
        </div>
      )}

      {/* Result */}
      {answered && result && (
        <div className={`mt-4 p-4 rounded-xl text-sm ${
          result.score >= 0.75 ? "bg-green-50" : "bg-koral-light"
        }`}>
          {result.score >= 0.95 ? (
            <p className="text-green-700 font-semibold text-base">Odlično! Savršeno!</p>
          ) : result.score >= 0.75 ? (
            <p className="text-green-700 font-semibold text-base">Vrlo dobro!</p>
          ) : (
            <p className="text-koral-dark font-semibold text-base">Ima razlika - pogledaj ispod.</p>
          )}

          {/* What was recognized / typed */}
          <div className="mt-3 bg-white/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">{micFailed ? "Ti si napisao/la:" : "Prepoznato:"}</p>
            <p className="text-gray-800">{transcript || fallbackInput}</p>
          </div>

          {/* Correct answer */}
          <div className="mt-2 bg-white/50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Tačan odgovor:</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-800 font-medium">{correctAnswer}</p>
              <SpeakButton text={correctAnswer} />
            </div>
          </div>

          {/* Word-by-word feedback */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.differences.map((d, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded text-sm font-medium ${
                  d.status === "correct"
                    ? "bg-green-100 text-green-700"
                    : d.status === "wrong"
                    ? "bg-koral-light text-koral-dark underline decoration-wavy"
                    : "bg-gray-200 text-gray-500 italic"
                }`}
              >
                {d.word}
                {d.status === "missing" && " (nedostaje)"}
              </span>
            ))}
          </div>

          {explanation && (
            <p className="mt-2 text-gray-600">{explanation}</p>
          )}

          {result.score < 0.75 && retries < 2 && (
            <button
              onClick={handleRetry}
              className="mt-3 text-sm text-plava hover:underline font-medium"
            >
              Pokušaj ponovo ({2 - retries} {2 - retries === 1 ? "pokušaj" : "pokušaja"} preostalo)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
