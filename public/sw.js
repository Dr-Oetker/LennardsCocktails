// Service Worker für Push-Benachrichtigungen und PWA
const CACHE_NAME = "lennards-cocktails-v1";
const urlsToCache = [
  "/",
  "/admin",
  "/admin/dashboard",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Install Event - Cache wichtige Dateien
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event - Cache-First Strategie für statische Assets
self.addEventListener("fetch", function (event) {
  // Nur GET-Requests cachen
  if (event.request.method !== "GET") {
    return;
  }

  // API-Requests nicht cachen
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Cache miss - fetch from network
      return fetch(event.request).then(function (response) {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push Event - Push-Benachrichtigungen
self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Neue Bestellung";
  const options = {
    body: data.body || "Du hast eine neue Bestellung erhalten",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/icon-192x192.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: "order-notification",
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Öffne die Admin-Seite wenn auf Benachrichtigung geklickt wird
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Wenn bereits ein Fenster offen ist, fokussiere es
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/admin/dashboard" && "focus" in client) {
          return client.focus();
        }
      }
      // Sonst öffne ein neues Fenster
      if (clients.openWindow) {
        return clients.openWindow("/admin/dashboard");
      }
    })
  );
});
