/* TAKA69 service worker — Web Push + local NOTIFY */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function showFromData(data) {
  const title = data.title || "TAKA69";
  const options = {
    body: data.body || "",
    icon: data.image || data.icon || "/icons/icon-192.png",
    badge: "/icons/favicon-32.png",
    image: data.image || undefined,
    tag: data.tag || "taka69",
    renotify: true,
    data: { href: data.href || "/" },
    vibrate: [120, 60, 120],
    requireInteraction: false,
  };
  return self.registration.showNotification(title, options);
}

self.addEventListener("push", (event) => {
  let data = { title: "TAKA69", body: "New update", href: "/", image: "", tag: "push" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      data.body = event.data ? event.data.text() : data.body;
    } catch {
      /* */
    }
  }
  event.waitUntil(showFromData(data));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          try {
            c.navigate(href);
          } catch {
            /* */
          }
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
      showFromData({
        title: msg.title,
        body: msg.body,
        href: msg.href,
        image: msg.image,
        tag: msg.tag,
      })
    );
  }
});
