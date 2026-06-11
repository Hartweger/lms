"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/fbq";

interface Props {
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
}

/** Šalje Meta Pixel ViewContent kad se učita stranica proizvoda (kursa). */
export default function PixelViewContent({ contentId, contentName, value, currency = "RSD" }: Props) {
  useEffect(() => {
    trackViewContent({ contentId, contentName, value, currency });
  }, [contentId, contentName, value, currency]);
  return null;
}
