// WP REST je ugašen sa WordPress-om. Vercel firewall ovo blokira sa 403, ali 403
// Googleu znači "postoji, ali ti ne smeš" i adresa ostaje u izveštaju (GSC coverage
// 23.08.2026: 11 × "Blocked due to access forbidden"). 410 je jasan signal da je
// resurs trajno nestao. Ako firewall presretne pre funkcije, status ostaje 403.
//
// Ruta je dinamička namerno: sa force-static je Next odbijao POST handler i vraćao
// 500 (smoke test posle deploya 23.08.2026).
export const dynamic = "force-dynamic";

function gone() {
  return new Response(null, { status: 410 });
}

export const GET = gone;
export const POST = gone;
export const HEAD = gone;
