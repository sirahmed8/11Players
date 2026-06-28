const CACHE_NAME = "11players-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json",
        "/logo.jpg"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // Fallback for offline if needed
    })
  );
});

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || "New Message";
    const options = {
      body: data.body || "You have a new message on 11Players.",
      icon: "/logo.jpg",
      badge: "/logo.jpg"
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});
