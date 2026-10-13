// Service worker NH Membershipa - isključivo za push obaveštenja Gen II kanala.
// BEZ keširanja i offline režima: to nosi svoje rizike od zastarelog sadržaja
// i zaslužuje zaseban posao.
//
// Registruje se sa scope "/clanstvo/" (vidi PushPrijava.tsx). Fajl stoji u
// korenu, pa mu je najširi mogući doseg "/" - uži doseg je dozvoljen i
// Service-Worker-Allowed zaglavlje ne treba.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let p;
  try {
    p = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(p.naslov || "Gen II", {
      body: p.telo || "",
      icon: "/nh-icon-192.png",
      badge: "/nh-icon-192.png",
      // Isti tag: novo obaveštenje zamenjuje staro umesto da se ređaju u nizu.
      // renotify traži da telefon ipak zavibrira na zamenu.
      tag: "gen2",
      renotify: true,
      data: { url: p.url || "/clanstvo/zajednica" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cilj = (event.notification.data && event.notification.data.url) || "/clanstvo/zajednica";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabovi) => {
      for (const t of tabovi) {
        if (t.url.includes("/clanstvo/zajednica")) return t.focus();
      }
      return self.clients.openWindow(cilj);
    })
  );
});
