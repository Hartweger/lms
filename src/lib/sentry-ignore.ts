// Greške koje namerno ne šaljemo u Sentry (štedi kvotu, smanjuje šum).
//
// Supabase auth-js u browseru koristi Web Locks API za serijalizaciju
// refresh-a tokena između tabova. Kad jedan tab drži lock predugo
// (uspavan tab, bfcache), drugi ga posle timeout-a namerno ukrade
// (steal: true) - ugrađeni recovery, vidi supabase/supabase#42505.
// Tab-žrtva tada dobije NavigatorLockAcquireTimeoutError; sama
// biblioteka kaže da je benigna i da je pozivaoci treba da filtriraju.
export const SENTRY_IGNORE_ERRORS: (string | RegExp)[] = [
  /was released because another request stole it/,
  /Acquiring an exclusive Navigator LockManager lock/,
];
