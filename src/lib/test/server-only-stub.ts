// Zamena za paket `server-only` u testovima.
//
// Taj paket ne postoji u node_modules - Next ga rešava sam pri build-u, pa se
// nikad i ne instalira. Vitest ga zato ne može učitati, i svaki test koji dotakne
// serverski modul (sef.ts, ips-qr.ts, dokument-pdf.ts) puca sa ERR_MODULE_NOT_FOUND.
//
// Alias na ovaj fajl stoji u vitest.config.ts. Uvoz `server-only` u samim modulima
// se NE uklanja - on je tu da spreči da serverski kod slučajno završi u pretraživaču.
export {};
