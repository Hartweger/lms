export default function PolitikaPrivatnosti() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Politika privatnosti</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Koji podaci se prikupljaju</h2>
          <p>Prikupljamo sledeće podatke: ime i prezime, email adresu, napredak u učenju i rezultate testova. Ovi podaci su neophodni za funkcionisanje platforme.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Kako koristimo vaše podatke</h2>
          <p>Vaši podaci se koriste isključivo za: pristup kursevima, praćenje napretka, izdavanje sertifikata i komunikaciju vezanu za vaše kurseve.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Gde se čuvaju podaci</h2>
          <p>Podaci se čuvaju na serverima u Evropskoj Uniji (Frankfurt, Nemačka) putem servisa Supabase, u skladu sa GDPR regulativom.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Vaša prava</h2>
          <p>Imate pravo da: zatražite uvid u svoje podatke, ispravite netačne podatke, zatražite brisanje naloga i svih podataka, i preuzmete kopiju svojih podataka.</p>
          <p>Za ostvarivanje ovih prava, kontaktirajte nas na: info@hartweger.rs</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Kolačići</h2>
          <p>Koristimo samo funkcionalne kolačiće neophodne za rad platforme (sesija, autentifikacija). Ne koristimo kolačiće za praćenje ili reklamiranje.</p>
        </section>
      </div>
    </div>
  );
}
