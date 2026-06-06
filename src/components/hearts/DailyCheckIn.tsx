// src/components/hearts/DailyCheckIn.tsx
"use client";
import { useEffect, useRef } from "react";

export function DailyCheckIn() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch("/api/hearts/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "daily_login" }),
    }).catch(() => {});
  }, []);
  return null;
}
