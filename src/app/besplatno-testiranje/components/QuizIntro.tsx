// src/app/test-nivoa/components/QuizIntro.tsx

interface QuizIntroProps {
  onStart: () => void;
}

export default function QuizIntro({ onStart }: QuizIntroProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <div className="bg-plava-light inline-block px-4 py-1 rounded-full text-plava text-sm font-medium mb-6">
        Besplatno · do 5 minuta
      </div>
      <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Testiraj svoj nivo nemačkog
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
        Odgovori na pitanja i saznaj koji kurs je pravi za tebe. Bez registracije - rezultat odmah.
      </p>
      <button
        onClick={onStart}
        className="bg-plava text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-plava-dark transition-colors shadow-lg shadow-plava/20"
      >
        Započni test →
      </button>
      <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
        <span>✓ Besplatno</span>
        <span>✓ Bez registracije</span>
        <span>✓ Rezultat odmah</span>
      </div>
      <div className="mt-12 flex items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-plava text-white flex items-center justify-center font-bold text-sm">NH</div>
        <p className="text-sm text-gray-500">
          Nataša Hartweger · 20+ godina iskustva · 4.000+ polaznika
        </p>
      </div>
    </div>
  );
}
