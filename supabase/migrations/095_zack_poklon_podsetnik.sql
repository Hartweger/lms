-- Podsetnik pred istek poklona (/poklon): JEDAN miran mejl roditelju, par dana
-- pre nego što igre stanu. Bez ovog traga cron bi ga slao svakog dana dok
-- prozor traje - tačno ono dosađivanje koje zack! nigde ne radi.
--
-- Kolona stoji na detetu, a ne na porudžbini: poklon je jedno dete, a
-- porudžbina je novčani zapis koji o pristupu ništa ne odlučuje.
alter table zack_deca
  add column if not exists poklon_podsetnik_at timestamptz;

comment on column zack_deca.poklon_podsetnik_at is
  'Kad je roditelju poslat podsetnik da poklon ističe. NULL = nije slat. Upisuje se PRE slanja, pa pad slanja znači izgubljen podsetnik, nikad dupli.';
