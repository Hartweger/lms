"use client";

import { useState, useRef } from "react";
import SpeakButton from "@/components/SpeakButton";

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

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ");
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

function findDifferences(spoken: string, expected: string): { word: string; status: "correct" | "wrong" | "missing" }[] {
  const spokenWords = normalize(spoken).split(" ");
  const expectedWords = normalize(expected).split(" ");
  const result: { word: string; status: "correct" | "wrong" | "missing" }[] = [];
  for (let i = 0; i < expectedWords.length; i++) {
    if (i < spokenWords.length && normalize(spokenWords[i]) === normalize(expectedWords[i])) {
      result.push({ word: expectedWords[i], status: "correct" });
    } else if (i < spokenWords.length) {
      result.push({ word: expectedWords[i], status: "wrong" });
    } else {
      result.push({ word: expectedWords[i], status: "missing" });
    }
  }
  return result;
}

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export default function SpeakExercise({ question, correctAnswer, explanation, onAnswer }: SpeakExerciseProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ score: number; differences: { word: string; status: string }[] } | null>(null);
  const [retries, setRetries] = useState(0);
  const [micFailed, setMicFailed] = useState(false);
  const [fallbackInput, setFallbackInput] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastTranscriptRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluate = (text: string) => {
    const score = similarity(text, correctAnswer);
    const differences = findDifferences(text, correctAnswer);
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

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < Object.keys(event.results).length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          // Check if result is final (isFinal property)
          const isFinal = (result as unknown as { isFinal: boolean }).isFinal;
          if (isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
      }
      lastTranscript = final || interim;
      lastTranscriptRef.current = lastTranscript;
      setTranscript(lastTranscript);

      // If we got a final result, evaluate immediately
      if (final) {
        setListening(false);
        try { recognition.stop(); } catch { /* already stopped */ }
        evaluate(final);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicFailed(true);
      } else if (event.error === "no-speech") {
        setTranscript("Nije prepoznat govor. Pokušaj ponovo.");
      } else if (event.error === "aborted") {
        // On abort, evaluate whatever we captured
        if (lastTranscript) {
          evaluate(lastTranscript);
        }
        return;
      } else {
        setTranscript(`Greška: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      // Safari sometimes fires onend without onresult final — evaluate last captured text
      if (lastTranscriptRef.current && !answered) {
        evaluate(lastTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;
    lastTranscriptRef.current = "";
    setListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleRetry = () => {
    setAnswered(false);
    setTranscript("");
    setFallbackInput("");
    setResult(null);
    setRetries(retries + 1);
    if (micFailed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div>
      {/* Instruction */}
      {question.includes("<") ? (
        <div className="text-lg font-medium text-gray-900 mb-2" dangerouslySetInnerHTML={{ __html: question }} />
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
            {listening ? "Slušam... govori sada" : "Klikni i izgovori rečenicu"}
          </p>

          {/* Transcript while not answered */}
          {transcript && !answered && (
            <div className="mt-2 bg-amber-50 text-amber-700 rounded-xl p-3 text-sm w-full text-center">
              {transcript}
            </div>
          )}
        </div>
      )}

      {/* Fallback: mic not available */}
      {!answered && micFailed && (
        <div className="bg-amber-50 rounded-xl p-5 text-center">
          <p className="text-amber-700 font-medium mb-2">Mikrofon nije dostupan u ovom browseru.</p>
          <p className="text-amber-600 text-sm">Probaj u Safari-ju ili otvori ovu stranicu na telefonu.</p>
          <button
            onClick={() => { setMicFailed(false); setTranscript(""); }}
            className="mt-3 text-sm text-plava hover:underline font-medium"
          >
            Pokušaj ponovo
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
            <p className="text-koral-dark font-semibold text-base">Ima razlika — pogledaj ispod.</p>
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
