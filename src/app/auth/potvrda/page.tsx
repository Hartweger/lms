import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isOtpType, potvrdaTekst, safeNext } from "@/lib/auth-confirm";

// Međukorak za link iz mejla: token je jednokratan, pa ga GET ne sme trošiti
// (pregled linka u Gmail-u / dupli klik). Dugme šalje POST na /auth/confirm.
// Radi i bez JavaScript-a - običan HTML form.

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function prvi(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export default async function Potvrda({ searchParams }: Props) {
  const params = await searchParams;
  const token_hash = prvi(params.token_hash);
  const type = prvi(params.type);
  const next = safeNext(prvi(params.next));

  if (!token_hash || !isOtpType(type)) {
    redirect("/prijava?greska=auth");
  }

  const { naslov, dugme } = potvrdaTekst(type);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-plava mb-2">{naslov}</h1>
        <p className="text-gray-500 mb-8">
          Klikni na dugme da završiš. Ovaj korak čuva tvoj link od automatskih pregleda mejla,
          pa radi i kad ga otvoriš kasnije.
        </p>

        <form method="POST" action="/auth/confirm">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full bg-plava text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition"
          >
            {dugme}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Ne radi?{" "}
          <Link href="/prijava" className="text-plava hover:underline">
            Prijavi se lozinkom ili zatraži novi link
          </Link>
        </p>
      </div>
    </div>
  );
}
