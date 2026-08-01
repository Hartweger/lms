"use client";
// Sakriva decu (školski header) na zadatim prefiksima ruta. Server-rendered
// deca prolaze kroz klijentsku komponentu netaknuta - ovo ne pretvara
// Navigaciju u klijentsku komponentu.
import { usePathname } from "next/navigation";

export default function SakrijNa({
  prefiksi,
  children,
}: {
  prefiksi: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sakrij = prefiksi.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );
  if (sakrij) return null;
  return <>{children}</>;
}
