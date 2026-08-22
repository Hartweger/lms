// OG slika landinga - do 22.08.2026. je nije bilo, pa je svaki podeljen link
// (i svaki Meta oglas iz objave) izgledao golo. Pravi se iz koda, a ne kao
// zalepljen PNG, da se ne razidje sa stranom kad se tekst promeni.
//
// Font se čita SA DISKA (src/fonts/ArchivoBlack-Regular.ttf), ne sa mreže:
// build koji zavisi od fonts.gstatic.com pada kad Google kine. Isti font
// (Archivo Black, OFL) sajt ionako koristi kroz next/font - ovo je samo
// primerak koji satori ume da pročita, jer woff2 iz next/font ne ume.
//
// Sve mora biti flex: satori ne zna ni za grid ni za nasleđeno centriranje.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "zack! - nemački za osnovce kroz album sa sličicama";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Boje su prepisane iz ../zack/Ukras.tsx i lib/zack/rec.ts. Namerno ručno:
// Ukras je klijentska komponenta sa JSX-om, a ovde treba samo nekoliko heksova.
// Boje roda NE SMEJU da se izmisle - OG slika je reklama, ali i dalje uči
// dete-i-roditelja rodu, pa lažna boja ovde je isto što i lažna u albumu.
const PODLOGA = "#F4F1E9";
const MASTILO = "#16161A";
const PRIGUSEN = "#6E6A5E";
const CRVENA_ZNAK = "#E5342A";
const DER_PLAVA = "#0B54C9";
const DIE_CRVENA = "#E5342A";
const DAS_ZELENA = "#2E9E4F";
const ZUTA = "#FFC400";

// Na das zelenoj mastilo (5.3:1), na plavoj i crvenoj belo - isto pravilo kao
// u komponenti Slicica. Reči su prave iz lekcije „Im Klassenzimmer", a nijedna
// nije izuzetak: izuzetak u proizvodu nosi sjajni preliv, koji ovde ne postoji.
// Član stoji u svom redu iznad reči, kao na pravoj sličici - i zato što se
// „die Tasche" u jednom redu prelama i udara u ivicu kartice.
const SLICICE = [
  { boja: DER_PLAVA, slova: "#FFFFFF", clan: "der", oblik: "Stuhl", prevod: "stolica", ugao: -6 },
  { boja: DIE_CRVENA, slova: "#FFFFFF", clan: "die", oblik: "Tasche", prevod: "torba", ugao: 4 },
  { boja: DAS_ZELENA, slova: MASTILO, clan: "das", oblik: "Heft", prevod: "sveska", ugao: -3 },
];

/** Sličica iz albuma - ista gramatika kao u proizvodu: boja roda + reč. */
function Slicica({
  boja,
  slova,
  clan,
  oblik,
  prevod,
  ugao,
}: {
  boja: string;
  slova: string;
  clan: string;
  oblik: string;
  prevod: string;
  ugao: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 164,
        height: 196,
        background: boja,
        border: "8px solid #FFFFFF",
        borderRadius: 24,
        transform: `rotate(${ugao}deg)`,
        boxShadow: "0 10px 24px rgba(22,22,26,0.22)",
        color: slova,
      }}
    >
      <div style={{ display: "flex", fontSize: 21, opacity: 0.85, fontFamily: "Zack" }}>{clan}</div>
      <div style={{ display: "flex", fontSize: 29, marginTop: 2, fontFamily: "Zack" }}>{oblik}</div>
      <div style={{ display: "flex", fontSize: 19, marginTop: 10, opacity: 0.85 }}>{prevod}</div>
    </div>
  );
}

export default async function Image() {
  const zack = await readFile(join(process.cwd(), "src/fonts/ArchivoBlack-Regular.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PODLOGA,
          padding: 56,
        }}
      >
        {/* Znak: ista crvena nalepnica sa belom ivicom kao svuda u zack! svetu. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              background: CRVENA_ZNAK,
              border: "8px solid #FFFFFF",
              borderRadius: 20,
              padding: "10px 28px",
              transform: "rotate(-2deg)",
              boxShadow: "0 6px 16px rgba(22,22,26,0.22)",
              color: "#FFFFFF",
              fontSize: 58,
              fontFamily: "Zack",
            }}
          >
            zack!
          </div>
          <div style={{ display: "flex", marginLeft: 24, fontSize: 30, color: PRIGUSEN, fontFamily: "Zack" }}>
            nemački za osnovce
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 616 }}>
            <div style={{ display: "flex", fontSize: 46, lineHeight: 1.05, color: MASTILO, fontFamily: "Zack" }}>
              Nemački se ne uči
            </div>
            {/* Žuti marker preko druge polovine naslova - kao flomaster u svesci. */}
            <div
              style={{
                display: "flex",
                marginTop: 10,
                background: ZUTA,
                color: MASTILO,
                fontSize: 46,
                lineHeight: 1.05,
                padding: "8px 14px",
                borderRadius: 6,
                fontFamily: "Zack",
              }}
            >
              veče pred kontrolni.
            </div>
            <div style={{ display: "flex", marginTop: 26, fontSize: 27, color: PRIGUSEN }}>
              Album sa sličicama, po deset minuta dnevno - po programu Ministarstva.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            {SLICICE.map((s, i) => (
              <div key={s.oblik} style={{ display: "flex", marginLeft: i === 0 ? 0 : -20 }}>
                <Slicica {...s} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Zack", data: zack, style: "normal", weight: 400 }],
    },
  );
}
