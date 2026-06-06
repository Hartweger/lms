-- 034_fiscal_fields.sql — Fiscomm PURS fiskalizacija
alter table orders
  add column if not exists fiscal_referent_number text,    -- _referent_document_number
  add column if not exists fiscal_referent_dt text,          -- _referent_document_dt
  add column if not exists fiscal_journal text,              -- _vpfr_journal
  add column if not exists fiscal_verification_url text,     -- _verification_url (PURS)
  add column if not exists fiscal_pdf_url text,              -- _invoice_pdf_url (storage.fiscomm.rs)
  add column if not exists fiscal_response jsonb,            -- sirov odgovor (za tačno mapiranje)
  add column if not exists fiscalized_at timestamptz;
