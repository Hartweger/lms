// WP REST je ugašen sa WordPress-om. Vercel firewall ovo već blokira sa 403,
// ali 403 Googleu znači "postoji, ali ti ne smeš" i adresa ostaje u izveštaju
// (GSC coverage 23.08.2026: 11 × "Blocked due to access forbidden"). 410 je
// jasan signal da je resurs trajno nestao. Ako firewall presretne pre funkcije,
// status ostaje 403 - tad se pravilo gasi u Vercel dashboardu, ne u kodu.
export const dynamic = "force-static";

export function GET() {
  return new Response(null, { status: 410 });
}

export const POST = GET;
