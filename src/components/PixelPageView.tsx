"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/fbq";

/**
 * Šalje Meta Pixel PageView na klijentskim (SPA) navigacijama.
 * Prvi PageView već šalje base kod (<MetaPixel/>), pa preskačemo prvi prolaz
 * da ga ne dupliramo.
 */
export default function PixelPageView() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  return null;
}
