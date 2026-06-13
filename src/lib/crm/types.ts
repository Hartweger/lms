export type CrmStage =
  | "nov" | "kontaktiran" | "zainteresovan" | "ponuda" | "upisan" | "izgubljen";

export type CrmSource =
  | "naki" | "smile" | "kontakt-forma" | "masterclass"
  | "manychat" | "instagram" | "whatsapp" | "rucno";

export type CrmChannel =
  | "mejl" | "naki" | "smile" | "manychat"
  | "instagram" | "whatsapp" | "beleska" | "sistem";

export type CrmDirection = "dolazna" | "odlazna" | "interna";

export const CRM_STAGES: CrmStage[] = [
  "nov", "kontaktiran", "zainteresovan", "ponuda", "upisan", "izgubljen",
];

export interface CrmContact {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  instagram_handle: string | null;
  user_id: string | null;
  stage: CrmStage;
  source: CrmSource;
  level: string | null;
  tags: string[];
  note: string | null;
  owner: string | null;
  next_action: string | null;
  next_action_at: string | null;
  last_interaction_at: string;
  created_at: string;
}

export interface CrmInteraction {
  id: string;
  contact_id: string;
  channel: CrmChannel;
  direction: CrmDirection;
  summary: string | null;
  body: string | null;
  occurred_at: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}
