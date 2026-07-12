import type { SupabaseClient } from "@supabase/supabase-js";
import { SMILE_MODEL, SMILE_NOTIFY_KEYWORDS } from "./sales-prompt";

export type SmileConfig = {
  enabled: boolean;
  nudge: boolean;
  leadCapture: boolean;
  coupon: boolean;
  model: string;
};

export const DEFAULT_SMILE_CONFIG: SmileConfig = {
  enabled: true,
  nudge: true,
  leadCapture: false,
  coupon: true,
  model: SMILE_MODEL,
};

type Row = { key: string; value: string };

export function mergeConfig(rows: Row[]): SmileConfig {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const bool = (k: string, d: boolean) => (map.has(k) ? map.get(k) === "true" : d);
  return {
    enabled: bool("enabled", DEFAULT_SMILE_CONFIG.enabled),
    nudge: bool("nudge", DEFAULT_SMILE_CONFIG.nudge),
    leadCapture: bool("lead_capture", DEFAULT_SMILE_CONFIG.leadCapture),
    coupon: bool("coupon", DEFAULT_SMILE_CONFIG.coupon),
    model: map.get("model") || DEFAULT_SMILE_CONFIG.model,
  };
}

export async function getSmileConfig(admin: SupabaseClient): Promise<SmileConfig> {
  try {
    const { data } = await admin.from("smile_config").select("key, value");
    return mergeConfig((data ?? []) as Row[]);
  } catch {
    return DEFAULT_SMILE_CONFIG;
  }
}

/** Prvi mejl u tekstu (mala slova) ili null - za hvatanje lida kad ga Smile zamoli za mejl. */
export function extractEmail(text: string): string | null {
  const m = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

export function isPurchaseSignal(text: string): boolean {
  const lower = text.toLowerCase();
  if (SMILE_NOTIFY_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return text.trim().split(/\s+/).length > 15;
}
