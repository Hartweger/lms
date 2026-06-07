-- 041: Seed prof config (calendar + honorar) i included_lessons. Idempotentno (po email/slug).

-- Profesorke: calendar + honorar (sve 1400/1600 osim Katarine 1600/1800).
update public.user_profiles set calendar_url='https://calendar.app.google/ZjskhvmBoWNYjMbt8', honorar_ind=1400, honorar_grp=1600 where email='hristina@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/nAhWsy5CJZchHB5c8', honorar_ind=1400, honorar_grp=1600 where email='marija@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/Wd3LMCvyGm6Veedx5', honorar_ind=1400, honorar_grp=1600 where email='milica@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/XhgrDbo8iAVJJyAM6', honorar_ind=1400, honorar_grp=1600 where email='suzana@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/ikcyRjvdwsVBfsTc7', honorar_ind=1600, honorar_grp=1800 where email='katarina@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/pLednA2FiPJSN9Fg9', honorar_ind=1400, honorar_grp=1600 where email='natasa@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/SvZGH4RbhGvcZh6JA', honorar_ind=1400, honorar_grp=1600 where email='danica@hartweger.rs';

-- included_lessons po "po nivou" individualnim kursevima (staro PAKET_PO_NIVOU).
update public.courses set included_lessons=7  where slug='individualni-kurs-nemackog-jezika-a11';
update public.courses set included_lessons=7  where slug='individualni-kurs-nemackog-jezika-a1-2';
update public.courses set included_lessons=14 where slug='paket-nivo-a1-a1-1-a1-2-individualni-standard';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-a2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-a2-2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b11';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b1-2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b2-1';
update public.courses set included_lessons=5  where slug='fsp-individualni';
update public.courses set included_lessons=5  where slug='individualni-polozi-fide';
