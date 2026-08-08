/* TAKA69 service worker — show notifications when tab is closed/backgrounded */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "TAKA69", body: "New update", href: "/" };
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
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
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

// Allow page to ask SW to show a local notification (works offline-ish when page backgrounded)
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "NOTIFY") {
    event.waitUntil(
      self.registration.showNotification(msg.title || "TAKA69", {
        body: msg.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/favicon-32.png",
        tag: msg.tag || undefined,
        data: { href: msg.href || "/" },
        vibrate: [100, 50, 100],
      })
    );
  }
});
