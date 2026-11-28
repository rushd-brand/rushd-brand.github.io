const CACHE = "rushd-gift-v23";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "privacy.html", "journey.json", "a/9ad38d9743.otf", "a/dafbd0eb5b.ttf", "a/cfc62f6d46.webp", "a/51a5c835dd.webp", "a/1db58be49c.webp", "icon-180.png", "badge-96.png", "icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("rushd-gift-") === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
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
    caches.open("rushd-nf").then(function (c) { return c.put("/gift/_nf/" + Date.now(), new Response(JSON.stringify({ t: d.title || "رشد", b: d.body || "", ts: Date.now() }))); }).catch(function () {}),
    self.registration.showNotification(d.title || "رشد", { body: d.body || "عندك حاجات مستنيةك النهارده", icon: "icon-512.png", badge: "badge-96.png", vibrate: [180, 90, 180, 90, 420], tag: "rushd-daily", renotify: true, silent: false, timestamp: Date.now(), dir: "rtl", lang: "ar", data: { url: d.url || "/gift/" } }),
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
