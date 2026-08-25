// Konsultacija (migracija 099): usluga, ne kurs. Posle uplate ne sledi pristup sadržaju
// nego biranje termina, pa checkout, hvala strana i mejl moraju da govore tim jezikom.
// Prodajna stranica je na natasahartweger.rs/konsultacija; ovde je samo naplata.
export const KONSULTACIJA_SLUG = "konsultacija";

/** Kategorija u `courses` - namerno bez posebnog ponašanja u ceni (za razliku od 'usluga'). */
export const KONSULTACIJA_CATEGORY = "konsultacija";

/**
 * Google „appointment schedule" Natašinog kalendara - klijent bira slobodan termin sam.
 * Namerno NE stoji na prodajnoj stranici: pokazuje se tek posle potvrđene uplate
 * (hvala strana i mejl), da niko ne zauzme termin bez plaćanja.
 */
export const KONSULTACIJA_CALENDAR_URL = "https://calendar.app.google/vKutf1Sm7H9BXVKy7";
