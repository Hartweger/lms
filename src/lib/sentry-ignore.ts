// Greške koje namerno ne šaljemo u Sentry (štedi kvotu, smanjuje šum).
//
// Supabase auth-js u browseru koristi Web Locks API za serijalizaciju
// refresh-a tokena između tabova. Kad jedan tab drži lock predugo
// (uspavan tab, bfcache), drugi ga posle timeout-a namerno ukrade
// (steal: true) - ugrađeni recovery, vidi supabase/supabase#42505.
// Tab-žrtva tada dobije NavigatorLockAcquireTimeoutError; sama
// biblioteka kaže da je benigna i da je pozivaoci treba da filtriraju.
//
// In-app browseri (Instagram/Facebook WebView na Androdu) ubacuju svoj
// instrumentacioni skript (navigation_performance_logger_android) koji pri
// napuštanju stranice zove svoj native Java most. Kad se WebView ruši, taj
// Java objekat više ne postoji -> "Java object is gone". Nije naš kod
// (jedini naš frejm je generički event handler), benigno, dolazi sa
// app://... izvora. Filtriramo da ne troši kvotu/šum.
//
// iOS pandan: isti Meta in-app browser (Instagram WebView na iOS-u) ubacuje
// skript koji preko window.webkit.messageHandlers priča sa native iOS app-om.
// Kad taj most nije prisutan -> "undefined is not an object (evaluating
// 'window.webkit.messageHandlers')". Nije naš kod (grep: ne koristimo webkit
// messageHandlers nigde), dolazi iz app:///... injektovanog skripta.
//
// Browser ekstenzije (ad-blocker, menadžer lozinki, prevodilac...) ubace svoj
// skript u stranicu i preko webextension-polyfill-a zovu runtime.sendMessage da
// pričaju sa svojim background kontekstom. Kad taj kontekst (tab/worker) više ne
// postoji -> "Invalid call to runtime.sendMessage(). Tab not found." Odbijeni
// promise se diže do našeg globalnog onunhandledrejection pa Sentry to pripiše
// nama. Nije naš kod (ne koristimo runtime.sendMessage nigde), benigno, zavisi
// od korisnikove ekstenzije. Filtriramo da ne troši kvotu/šum.
//
// SEO/structured-data ekstenzije (uglavnom Safari) skeniraju JSON-LD na
// stranici i nad svakim objektom zovu nesto kao obj["@context"].toLowerCase().
// Kad naletu na objekat bez "@context" -> "undefined is not an object
// (evaluating 'r["@context"].toLowerCase')". Nas kod samo PISE @context u
// schema.org blokove (layout.tsx), nikad ga ne cita; greska se digne do naseg
// globalnog onerror pa je Sentry pripise nama. Promenljiva 'r' je minifikovana
// (menja se po buildu) pa hvatamo stabilan deo: ["@context"].toLowerCase.
export const SENTRY_IGNORE_ERRORS: (string | RegExp)[] = [
  /was released because another request stole it/,
  /Acquiring an exclusive Navigator LockManager lock/,
  /Java object is gone/,
  /Java exception was raised during method invocation/,
  /enableButtonsClickedMetaDataLogging/,
  /window\.webkit\.messageHandlers/,
  /runtime\.sendMessage/,
  /\["@context"\]\.toLowerCase/,
];

// Frejmovi koji dolaze iz tuđih skriptova (browser ekstenzije) - odbacujemo
// po URL-u fajla u stack trace-u, jer je poruka često preopšta za ignoreErrors.
//
// csSpoofGeoMain.bundle.js: content script ekstenzije za lažiranje geolokacije
// (anti-tracking/VPN tip). Njen cleanup pri napuštanju stranice baci odbijeni
// promise "Error: cleanup" koji naš globalni onunhandledrejection pripiše nama.
// Nije naš kod (bundle ne postoji u repou), zavisi od korisnikove ekstenzije.
export const SENTRY_DENY_URLS: RegExp[] = [
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari(-web)?-extension:\/\//i,
  /csSpoofGeoMain\.bundle\.js/,
];
