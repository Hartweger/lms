"use client";

import { useEffect, useState } from "react";

export default function Instaliraj() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<(Event & { prompt: () => void }) | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Aplikacija je instalirana</h1>
          <p className="text-gray-500">
            Hartweger aplikacija je vec na vasem uredaju. Otvorite je sa pocetnog ekrana.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-plava-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img src="/icon-192.png" alt="Hartweger" className="w-14 h-14 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Instaliraj aplikaciju
          </h1>
          <p className="text-gray-500">
            Pristupaj lekcijama direktno sa telefona — bez otvaranja browsera.
          </p>
        </div>

        {/* Android: automatic install button */}
        {deferredPrompt && (
          <div className="mb-6">
            <button
              onClick={handleInstall}
              className="w-full bg-plava text-white py-4 rounded-xl font-bold text-lg hover:bg-plava-dark transition-colors shadow-lg shadow-plava/20"
            >
              Instaliraj
            </button>
          </div>
        )}

        {/* iOS instructions */}
        {isIOS && !deferredPrompt && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">iPhone / iPad</h2>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Otvorite <strong>kurs.hartweger.rs</strong> u Safari browseru
                  <span className="block text-xs text-gray-400 mt-0.5">(mora biti Safari, ne Chrome)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>
                  Kliknite na <strong>Share</strong> dugme
                  <span className="block text-xs text-gray-400 mt-0.5">(kvadrat sa strelicom na gore, na dnu ekrana)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>
                  Skrolujte nadole i izaberite <strong>&quot;Add to Home Screen&quot;</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Kliknite <strong>&quot;Add&quot;</strong> — gotovo!</span>
              </li>
            </ol>
          </div>
        )}

        {/* Android instructions (fallback if prompt didn't fire) */}
        {isAndroid && !deferredPrompt && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Android</h2>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Otvorite <strong>kurs.hartweger.rs</strong> u Chrome browseru
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>
                  Kliknite na <strong>tri tacke</strong> (meni) u gornjem desnom uglu
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>
                  Izaberite <strong>&quot;Install app&quot;</strong> ili <strong>&quot;Add to Home screen&quot;</strong>
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Desktop instructions */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Desktop (Chrome)</h2>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>
                  Otvorite <strong>kurs.hartweger.rs</strong> u Chrome browseru
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>
                  Kliknite na ikonu za instalaciju u address baru (desno od URL-a)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 bg-plava text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Kliknite <strong>&quot;Install&quot;</strong></span>
              </li>
            </ol>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-plava text-lg">&#9889;</span>
            <span>Brzi pristup bez otvaranja browsera</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-plava text-lg">&#128241;</span>
            <span>Izgleda kao prava aplikacija (fullscreen)</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <span className="text-plava text-lg">&#127760;</span>
            <span>Uvek najnovija verzija — bez azuriranja</span>
          </div>
        </div>
      </div>
    </div>
  );
}
