"use client";

// Otkrivanje na skrol: sekcija ispod prvog ekrana se „zalepi" tek kad uđe u
// kadar, istom animacijom kojom se lepe sličice (zack-zalepi iz rasporeda).
//
// Redosled je pravilo bezbednog pada:
// - bez JavaScripta atribut data-otkrij ne postoji, pa je sve normalno vidljivo;
// - uz reduced-motion se efekat uopšte ne uključuje (i sav CSS za njega živi
//   unutar no-preference), pa elementi prosto stoje na mestu;
// - element koji je pri učitavanju već u kadru se ne dira, da prvi ekran nikad
//   ne trepne.
//
// Atribut se postavlja pravo na DOM, mimo React stanja: ovo je progresivno
// ulepšavanje koje ne sme da izazove nijedno ponovno crtanje, a React ga ne
// dira jer data-otkrij nikad ne prolazi kroz render.
//
// Sakrivanje se dešava tek POSLE prvog crtanja (useEffect), ali isključivo za
// elemente ispod donje ivice ekrana - pa to sakrivanje niko ne vidi.
import { useEffect, useRef } from "react";

export default function Otkrij({
  children,
  className = "",
  kasni = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Zadrška prve animacije u ms; deca sa svojim --zack-kasni je sabiraju. */
  kasni?: number;
}) {
  const okvir = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = okvir.current;
    if (!el) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    // Već u kadru (ili iznad njega, posle skrola pa osvežavanja): ne diraj.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.otkrij = "ne";
    const posmatrac = new IntersectionObserver(
      (unosi) => {
        if (unosi.some((u) => u.isIntersecting)) {
          el.dataset.otkrij = "da";
          posmatrac.disconnect();
        }
      },
      // Okida tek kad element stvarno zađe u ekran, ne na samoj ivici.
      { rootMargin: "0px 0px -8% 0px" }
    );
    posmatrac.observe(el);
    return () => posmatrac.disconnect();
  }, []);

  return (
    <div
      ref={okvir}
      className={className}
      style={kasni ? ({ "--zack-osnovni-kasni": `${kasni}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
