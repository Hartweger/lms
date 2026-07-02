import Link from "next/link";

// Gate za /lekcija/[id] kad RLS ne da lekciju: odjavljen korisnik (najčešće klik iz
// mejla u starom browseru/drugom uređaju) ili ulogovan bez pristupa (istekao).
// Umesto mrtvog 404 - jasan sledeći korak. Sadržaj lekcije se ovde NE prikazuje.
export default function LekcijaGate({
  lessonTitle,
  courseTitle,
  loggedIn,
}: {
  lessonTitle: string;
  courseTitle: string;
  loggedIn: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4" aria-hidden>🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{lessonTitle}</h1>
      {courseTitle && <p className="text-gray-500 mb-6">Lekcija kursa {courseTitle}</p>}
      {loggedIn ? (
        <>
          <p className="text-gray-700 mb-6">
            Nemaš (više) pristup ovom kursu. Ako ti je pristup istekao, možeš da ga obnoviš.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/nalog"
              className="px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              Moj nalog
            </Link>
            <Link
              href="/kursevi"
              className="px-6 py-3 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Pogledaj kurseve
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-700 mb-6">
            Prijavi se da nastaviš sa učenjem - traje pola minuta.
          </p>
          <Link
            href="/prijava"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
          >
            Prijavi se
          </Link>
        </>
      )}
    </div>
  );
}
