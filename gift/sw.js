const CACHE = "rushd-gift-v4";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(e.request).then(function (r) {
        if (r && r.ok) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return r;
      }).catch(function () { return hit; });
      return hit || fresh;
    })
  );
});
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || "رشد", { body: d.body || "عندك حاجات مستنيةك النهارده", icon: "icon-192.png", badge: "icon-192.png", dir: "rtl", lang: "ar", data: { url: d.url || "/gift/" } }),
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) { cs.forEach(function (c) { c.postMessage({ type: "pushgot", body: d.body || "" }); }); })
  ]));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var u = (e.notification.data && e.notification.data.url) || "/gift/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (const c of cs) { if (c.url.indexOf("/gift/") >= 0) return c.focus(); }
    return clients.openWindow(u);
  }));
});
