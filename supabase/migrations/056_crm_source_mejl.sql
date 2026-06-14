-- CRM: dodaj izvor 'mejl' (direktni mejlovi sa info@ preko Gmail/Apps Script ingesta)
alter table public.crm_contacts drop constraint crm_contacts_source_check;
alter table public.crm_contacts add constraint crm_contacts_source_check
  check (source in ('naki','smile','kontakt-forma','masterclass','manychat','instagram','whatsapp','rucno','mejl'));
