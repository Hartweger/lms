"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SprechenProps {
  task: string;
  exerciseId: string;
  lessonId: string;
  onAnswer: (correct: boolean) => void;
}

export default function SprechenExercise({ task, exerciseId, lessonId, onAnswer }: SprechenProps) {
  const supabase = createClient();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // lokalni preview
  const [blob, setBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("essay_submissions")
        .select("id, status")
        .eq("exercise_id", exerciseId)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0 && data[0].status !== "published") setAlreadyPending(true);
    };
    check();
  }, [exerciseId, supabase]);

  const startRecording = async () => {
    setError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Tvoj browser ne podržava snimanje. Probaj noviji Chrome, Safari ili Firefox.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // iOS/Safari ne podržava webm - izaberi prvi podržan tip
      const cands = ["audio/webm", "audio/mp4", "audio/ogg"];
      const mime = cands.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const type = mr.mimeType || mime || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        setBlob(b);
        setAudioUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Ne mogu da pristupim mikrofonu. Dozvoli pristup u browseru.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => { setBlob(null); setAudioUrl(null); setSeconds(0); };

  const submit = async () => {
    if (!blob) return;
    setUploading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Nisi prijavljen/a."); setUploading(false); return; }
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
      const path = `${user.id}/${exerciseId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("sprechen").upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true });
      if (upErr) { setError("Greška pri otpremanju snimka."); setUploading(false); return; }
      const url = supabase.storage.from("sprechen").getPublicUrl(path).data.publicUrl;
      const { error: insErr } = await supabase.from("essay_submissions").insert({
        user_id: user.id, exercise_id: exerciseId, lesson_id: lessonId,
        text: null, audio_url: url, submission_type: "audio", status: "pending",
      });
      if (insErr) { setError("Greška pri slanju na pregled."); setUploading(false); return; }
      setSubmitted(true);
      onAnswer(true);
    } catch {
      setError("Došlo je do greške. Pokušaj ponovo.");
    }
    setUploading(false);
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
      <p className="text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-line mb-4">{task}</p>

      {submitted || alreadyPending ? (
        <div className="bg-plava-light rounded-lg p-4 text-center">
          <p className="text-plava font-medium">Tvoj snimak je poslat na pregled 🎙️</p>
          <p className="text-sm text-gray-600 mt-1">Profesor će ga preslušati i dati ti povratnu informaciju.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Snimi svoj usmeni odgovor. Možeš preslušati pre slanja i, ako želiš, snimiti ponovo.</p>

          {!recording && !audioUrl && (
            <button onClick={startRecording} className="inline-flex items-center gap-2 bg-koral text-white px-6 py-3 rounded-lg font-semibold hover:bg-koral-dark transition-colors">
              ● Počni snimanje
            </button>
          )}

          {recording && (
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-gray-700">{mmss(seconds)}</span>
              <button onClick={stopRecording} className="bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                ■ Zaustavi
              </button>
            </div>
          )}

          {audioUrl && !recording && (
            <div className="space-y-3">
              <audio controls className="w-full" src={audioUrl} />
              <div className="flex gap-3">
                <button onClick={submit} disabled={uploading} className="bg-plava text-white px-6 py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors disabled:opacity-50">
                  {uploading ? "Šaljem…" : "Pošalji na pregled"}
                </button>
                <button onClick={reset} disabled={uploading} className="border border-gray-300 text-gray-600 px-5 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Snimi ponovo
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-koral-dark">{error}</p>}
        </div>
      )}
    </div>
  );
}
