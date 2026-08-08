/* TAKA69 service worker — notifications when tab closed/backgrounded */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "TAKA69", body: "New update", href: "/", image: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      data.body = event.data.text();
    } catch {
      /* */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "TAKA69", {
      body: data.body || "",
      icon: data.image || "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      image: data.image || undefined,
      data: { href: data.href || "/" },
      vibrate: [120, 60, 120],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(href);
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(href);
    })
  );
});

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "NOTIFY") {
    event.waitUntil(
      self.registration.showNotification(msg.title || "TAKA69", {
        body: msg.body || "",
        icon: msg.image || "/icons/icon-192.png",
        badge: "/icons/favicon-32.png",
        image: msg.image || undefined,
        tag: msg.tag || undefined,
        data: { href: msg.href || "/" },
        vibrate: [100, 50, 100],
      })
    );
  }
});
