self.addEventListener("push", (event) => {
  let payload = {
    title: "Pawfolio",
    body: "You have a Pawfolio reminder.",
    url: "/",
  };

  try {
    payload = { ...payload, ...event.data?.json() };
  } catch {
    payload.body = event.data?.text() || payload.body;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: payload.tag || "pawfolio-reminder",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
