"use client";

import { useState } from "react";

type ToggleKey = "enabled" | "nudge" | "lead_capture" | "coupon";

const LABELS: Record<ToggleKey, string> = {
  enabled: "Uključen (enabled)",
  nudge: "Nudge",
  lead_capture: "Hvatanje lead-a (lead_capture)",
  coupon: "Kupon (coupon)",
};

export default function SmileToggles({
  initial,
}: {
  initial: Record<ToggleKey, boolean>;
}) {
  const [values, setValues] = useState<Record<ToggleKey, boolean>>(initial);
  const [saving, setSaving] = useState<ToggleKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onToggle(key: ToggleKey, checked: boolean) {
    setValues((v) => ({ ...v, [key]: checked }));
    setSaving(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/smile-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: checked ? "true" : "false" }),
      });
      if (!res.ok) {
        setValues((v) => ({ ...v, [key]: !checked }));
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "Greška pri čuvanju.");
      }
    } catch {
      setValues((v) => ({ ...v, [key]: !checked }));
      setError("Greška pri čuvanju.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-2">
      {(Object.keys(LABELS) as ToggleKey[]).map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={values[key]}
            disabled={saving === key}
            onChange={(e) => onToggle(key, e.target.checked)}
            className="h-4 w-4"
          />
          {LABELS[key]}
        </label>
      ))}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
