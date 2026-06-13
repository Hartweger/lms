// WooCommerce product ID → LMS course slugs
// Svaki proizvod daje pristup SAMO svom nivou
// Paketi daju pristup svim nivoima koje sadrže

export const WC_PRODUCT_MAP: Record<number, string[]> = {
  // === VIDEO kursevi ===
  35178: ["nemacki-a1-1", "nemacki-a1-2"], // VIDEO kurs A1 → A1.1 + A1.2
  35182: ["nemacki-a2-1", "nemacki-a2-2"], // VIDEO kurs A2 → A2.1 + A2.2
  // 35186: VIDEO kurs B1 → B1.1 + B1.2 (dodati kad LMS bude spreman)

  // === VIDEO paketi ===
  46478: ["nemacki-a1-1", "nemacki-a1-2", "nemacki-a2-1", "nemacki-a2-2"], // Video Paket A1+A2
  46480: ["nemacki-a1-1", "nemacki-a1-2", "nemacki-a2-1", "nemacki-a2-2", "nemacki-b1-1", "nemacki-b1-2"], // Video Paket A1+A2+B1 (B1 dodat - sad postoji)

  // === INDIVIDUALNI A1 ===
  35766: ["nemacki-a1-1"],                 // IND A1.1 → samo A1.1
  35767: ["nemacki-a1-2"],                 // IND A1.2 → samo A1.2
  46494: ["nemacki-a1-1", "nemacki-a1-2"], // IND Paket A1 (standard) → A1.1 + A1.2

  // === INDIVIDUALNI A2 ===
  35758: ["nemacki-a2-1"],                 // IND A2.1
  35761: ["nemacki-a2-2"],                 // IND A2.2

  // === GRUPNI A1 ===
  35841: ["nemacki-a1-1"],                 // GRUPNI A1.1 → samo A1.1
  36241: ["nemacki-a1-2"],                 // GRUPNI A1.2 → samo A1.2

  // === GRUPNI A2, B1 ===
  35183: ["nemacki-a2-1"],                 // GRUPNI A2.1
  35851: ["nemacki-a2-2"],                 // GRUPNI A2.2
  37366: ["nemacki-b1-1"],                 // GRUPNI B1.1 → nemacki-b1-1
  // 36132: GRUPNI B1.2 → nemacki-b1-2

  // === OSTALO ===
  47440: ["gramatika-a2-b1"],  // VIDEO + E-book Gramatika A2-B1 (ranije POGREŠNO mapirano na A1 - vidi migrate-gramatika-buyers.ts)
  36863: ["polozi-goethe-b1"], // VIDEO + B1 ispit - kompletna priprema (ranije POGREŠNO mapirano na A1)
};
